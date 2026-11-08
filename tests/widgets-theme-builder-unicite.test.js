// Widgets du CMS (Apparence → Widgets) et Theme Builder : le Theme Builder reste la SOURCE UNIQUE de l'en-tête et du pied de page.
// Cause racine corrigée : une page du Page Builder recevait le pied de page du Theme Builder (section « sitePart ») ET, en plus, le pied d'origine de la vue (<footer class="lp-foot">)
// avec le bloc de widgets « lp-foot-widgets » : deux pieds de page, les widgets hors du pied choisi. Les widgets de pied de page entrent maintenant DANS le pied du Theme Builder.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const count = (t, s) => t.split(s).length - 1;
const part = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });
// Contenu HTML EXACT de l'élément <div class="… lp-site-footer …"> (balises <div> comptées jusqu'à sa fermeture) : ce qui est « dans » le pied de page choisi
const footerPart = (html) => {
  const at = html.indexOf("lp-site-footer"); if (at < 0) return "";
  // Le pied est un <footer> (rendu unifié, chantier A) ou, si le modèle contient déjà un <footer>, un <div> : on prend la balise ouvrante la plus proche
  const tag = html.lastIndexOf("<footer", at) > html.lastIndexOf("<div", at) ? "footer" : "div", start = html.lastIndexOf(`<${tag}`, at); let depth = 0;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, "g"); re.lastIndex = start; let m;
  while ((m = re.exec(html))) { depth += m[0] === `</${tag}>` ? -1 : 1; if (depth === 0) return html.slice(start, m.index + m[0].length); }
  return html.slice(start);
};

describe("Widgets et Theme Builder : un seul en-tête, un seul pied de page, widgets dans le pied choisi", () => {
  let srv, boss, db, A, B, pageA, pageB, pageC, C;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const W = "/marketing/site-web/widgets";
  const slug = (id) => one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug;
  const pub = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: UA })).text;
  const blk = (id, text) => ({ id, type: "paragraph", settings: { text } });
  const save = (site, zones) => {
    const cur = one("SELECT revision FROM cms_widget_layouts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site);
    return boss.postJson(`${W}/enregistrer?site=${site}`, { revision: cur ? cur.revision : 0, layout: { zones: { sidebar: [], "footer-1": [], "footer-2": [], ...zones }, inactive: [] } });
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    const orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta"); C = site("Gamma");
    const comp = (s, name, p) => Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, ?, ?, ?, 'standard')").run(orgId, s, name, JSON.stringify(p)).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET header_component_id = ?, footer_component_id = ? WHERE id = ?").run(comp(A, "En-tête Alpha", part("hdra", "ENTETE-ALPHA")), comp(A, "Pied Alpha", part("ftra", "PIED-ALPHA")), A);
    db.prepare("UPDATE mk_sites SET header_component_id = ?, footer_component_id = ? WHERE id = ?").run(comp(B, "En-tête Beta", part("hdrb", "ENTETE-BETA")), comp(B, "Pied Beta", part("ftrb", "PIED-BETA")), B);
    const page = (nm, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, nm, nm, nm, JSON.stringify([{ type: "text", markdown: "Contenu de la page" }]), s).lastInsertRowid);
    pageA = page("page-alpha", A); pageB = page("page-beta", B); pageC = page("page-gamma", C);
    assert.equal((await save(A, { "footer-1": [blk("wa000001", "WIDGET-A-UN")], "footer-2": [blk("wa000002", "WIDGET-A-DEUX")] })).status, 200);
    assert.equal((await save(B, { "footer-1": [blk("wb000001", "WIDGET-B-UN")] })).status, 200);
  });
  after(() => { db.close(); return srv.stop(); });

  test("page publiée d'un site : exactement un en-tête et un pied de page du Theme Builder, aucun pied d'origine en plus", async () => {
    const html = await pub(pageA);
    assert.equal(count(html, "lp-site-header"), 1, "un seul en-tête");
    assert.equal(count(html, "lp-site-footer"), 1, "un seul pied de page");
    assert.equal(count(html, "lp-autohead"), 0, "aucun en-tête automatique en plus");
    assert.equal(count(html, '<footer class="lp-foot">'), 0, "aucun second <footer> d'origine");
    assert.equal(count(html, "lp-foot-widgets"), 1, "un seul bloc de widgets de pied");
    assert.match(html, /ENTETE-ALPHA/); assert.match(html, /PIED-ALPHA/);
  });

  test("les widgets de pied de page sont DANS le pied du Theme Builder, dans l'ordre des sections", async () => {
    const html = await pub(pageA), inside = footerPart(html);
    const p0 = inside.indexOf("PIED-ALPHA"), p1 = inside.indexOf("WIDGET-A-UN"), p2 = inside.indexOf("WIDGET-A-DEUX");
    assert.ok(p0 >= 0 && p1 > p0 && p2 > p1, `ordre pied → section 1 → section 2 (${p0}, ${p1}, ${p2})`);
    assert.equal(count(html, "WIDGET-A-UN"), 1, "le widget n'est rendu qu'une fois");
    assert.equal(count(html.replace(inside, ""), "WIDGET-A-UN"), 0, "aucun widget hors du pied de page choisi");
  });

  test("la ligne légale (cookies) reste disponible, dans le pied du Theme Builder et non dans un second pied", async () => {
    const inside = footerPart(await pub(pageA));
    assert.match(inside, /data-kw-consent-open/, "lien Cookies conservé");
  });

  test("l'aperçu d'une page montre le même résultat qu'une page publiée", async () => {
    const html = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
    assert.equal(count(html, "lp-site-footer"), 1); assert.equal(count(html, '<footer class="lp-foot">'), 0);
    assert.match(footerPart(html), /WIDGET-A-UN/);
  });

  test("isolation : les widgets d'un site n'apparaissent que dans le pied de ce site", async () => {
    const a = await pub(pageA), b = await pub(pageB);
    assert.doesNotMatch(a, /WIDGET-B-UN|PIED-BETA/); assert.doesNotMatch(b, /WIDGET-A-UN|WIDGET-A-DEUX|PIED-ALPHA/);
    assert.match(footerPart(b), /WIDGET-B-UN/); assert.equal(count(b, "lp-site-footer"), 1);
  });

  test("un site sans pied de page du Theme Builder garde son pied d'origine (comportement inchangé), widgets compris", async () => {
    assert.equal((await save(C, { "footer-1": [blk("wc000001", "WIDGET-C-UN")] })).status, 200);
    const html = await pub(pageC);
    assert.equal(count(html, "lp-site-footer"), 0); assert.equal(count(html, '<footer class="lp-foot">'), 1, "le pied d'origine est le seul pied");
    assert.match(html, /WIDGET-C-UN/); assert.equal(count(html, "lp-foot-widgets"), 1);
  });
});
