// Éditeur de pages — CLASSES GLOBALES du site : validation, CSS du site (priorité plus faible que le style propre d'un élément),
// application à tous les éléments qui portent la classe sur la page publiée, mise à jour par un seul enregistrement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const siteSettings = require("../src/marketing/pages/siteSettings");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });

describe("définition des classes (sans serveur)", () => {
  test("noms, doublons, limites et styles validés ; une classe invalide n'entre jamais dans le CSS", () => {
    const s = (classes, strict) => siteSettings.normalizeSettings({ classes }, { strict }).classes;
    assert.deepEqual(s([{ name: "Carte", styles: { desktop: { paddingTop: "16px" } } }]).map((c) => c.name), ["carte"], "nom mis en minuscules");
    for (const name of ["kw-x", "lp-x", "pb-x", "mk-x", "1abc", "a b", "a".repeat(31), "", "a;b"]) assert.throws(() => s([{ name }], true), /Classe globale|nom invalide/, name);
    assert.throws(() => s([{ name: "a" }, { name: "a" }], true), /déjà utilisé/);
    assert.deepEqual(s([{ name: "kw-x" }, { name: "ok" }], false).map((c) => c.name), ["ok"], "hors édition : classe invalide ignorée");
    assert.throws(() => s([{ name: "a", styles: { desktop: { backgroundImage: { src: "javascript:alert(1)" } } } }], true), /image/);
    assert.throws(() => s(Array.from({ length: 41 }, (_, i) => ({ name: `c${i}` })), true), /40 classes/);
    const css = nodes.classCss(s([{ name: "carte", styles: { desktop: { color: "#0b2a40" }, mobile: { paddingTop: "8px" } }, states: { hover: { opacity: 0.8 } } }]));
    assert.match(css, /^\.lp-site :where\(\.carte\)\{color:#0b2a40\}$/m);
    assert.match(css, /:where\(\.carte\):hover\{opacity:0\.8\}/);
    assert.match(css, /@media \(max-width: 767px\)\{\.lp-site :where\(\.carte\)\{padding-top:8px\}\}/);
    assert.ok(!/[<>]/.test(css));
  });
});

describe("vrai serveur : site, classe, page publiée", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("une classe enregistrée dans le site stylise tous les éléments qui la portent, sans toucher les autres ; le style propre l'emporte", async () => {
    const created = await boss.post("/marketing/site-web/sites", { name: "Site classes" });
    const siteId = Number(String(created.location).match(/sites\/(\d+)/)[1]);
    const url = `/marketing/site-web/sites/${siteId}/reglages.json`;
    const cur = JSON.parse((await boss.get(url)).text);
    const put = await boss.request(url, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, classes: [{ name: "carte", styles: { desktop: { backgroundColor: "#fdf2dc", paddingTop: "24px" }, mobile: { paddingTop: "8px" } } }] } } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    assert.equal(JSON.parse(put.text).settings.classes[0].name, "carte");
    // une classe au nom réservé est refusée à l'enregistrement
    const refused = await boss.request(url, { method: "PUT", json: { revision: JSON.parse(put.text).revision, tokens: cur.tokens, settings: { ...cur.settings, classes: [{ name: "kw-piege" }] } } });
    assert.equal(refused.status, 422, refused.text.slice(0, 200));

    const id = Number((await boss.post("/marketing/pages", { name: "Page classes", site_id: String(siteId) })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [layout([
      { id: "head00000001", type: "heading", classes: "carte", props: { text: "Avec la classe", level: 2 } },
      { id: "head00000002", type: "heading", classes: "carte", styles: { desktop: { paddingTop: "40px" } }, props: { text: "Style propre", level: 2 } },
      { id: "head00000003", type: "heading", props: { text: "Sans classe", level: 2 } },
    ])] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html, /class="[^"]*kw-n-head00000001[^"]*carte"/);
    assert.match(html, /class="[^"]*kw-n-head00000003"/);
    assert.doesNotMatch(html, /kw-n-head00000003[^"]*carte/);
    const rule = html.indexOf(".lp-site :where(.carte){"), own = html.indexOf("kw-n-head00000002{");
    assert.ok(rule > 0 && own > 0 && rule < own, "la règle de la classe est écrite AVANT le style propre de l'élément (le style propre gagne)");
    assert.match(html, /\.lp-site :where\(\.carte\)\{[^}]*padding-top:24px/);
    assert.match(html, /@media \(max-width: 767px\)\{\.lp-site :where\(\.carte\)\{padding-top:8px\}\}/);
    // mise à jour de la classe : tous les éléments suivent après un seul enregistrement
    const cur2 = JSON.parse((await boss.get(url)).text);
    const upd = await boss.request(url, { method: "PUT", json: { revision: cur2.revision, tokens: cur2.tokens, settings: { ...cur2.settings, classes: [{ name: "carte", styles: { desktop: { backgroundColor: "#e0f2fe", paddingTop: "24px" } } }] } } });
    assert.equal(upd.status, 200);
    const html2 = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html2, /\.lp-site :where\(\.carte\)\{[^}]*background-color:#e0f2fe/);
    assert.doesNotMatch(html2, /background-color:#fdf2dc/);
  });
});
