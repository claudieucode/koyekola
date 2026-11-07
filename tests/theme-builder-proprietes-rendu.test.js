// Theme Builder : les réglages d'un élément ont un EFFET RÉEL, de bout en bout, pour chaque catégorie de modèle.
// Parcours vérifié pour chaque catégorie : réglage → canevas de l'éditeur (rendu du brouillon) → enregistrement → rechargement (relecture) → publication → site public (domaine réel) → isolation d'un autre site.
// Mesuré dans un vrai Chrome sur les styles CALCULÉS (jamais sur le texte du CSS). Voir docs/theme-builder/THEME_BUILDER_PROPERTY_VALIDATION.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;

// Éléments réglés : un par famille de propriété (couleur, typographie, dimension, fond, responsive, état au survol, élément imbriqué, visibilité par appareil)
const nodes = () => [
  { id: "pr0head00001", type: "heading", props: { text: "PR-TITRE", level: "2" }, styles: { desktop: { color: "#c0392b", fontFamily: "font.lora", fontSize: "37px", letterSpacing: "2px" }, tablet: { fontSize: "23px" } }, states: { hover: { color: "#0b6e4f" } } },
  { id: "pr0text00001", type: "text", props: { html: "<p>PR-TEXTE</p>" }, styles: { desktop: { color: "#1d4ed8", fontSize: "19px", lineHeight: "1.9" } } },
  { id: "pr0link00001", type: "link", props: { label: "PR-LIEN", url: "/contact" }, styles: { desktop: { fontFamily: "font.lora", color: "#7c3aed" } } },
  { id: "pr0butt00001", type: "button", props: { label: "PR-BOUTON", url: "/contact", variant: "primary" }, styles: { desktop: { fontFamily: "font.lora", backgroundColor: "#0f766e", color: "#ffffff", borderRadius: "17px" } } },
  { id: "pr0boxx00001", type: "container", props: {}, styles: { desktop: { backgroundColor: "#fef3c7", paddingTop: "41px" } },
    children: [{ id: "pr0nest00001", type: "heading", props: { text: "PR-IMBRIQUE", level: "3" }, styles: { desktop: { color: "#9d174d", fontFamily: "font.lora" } } }] },
  { id: "pr0hide00001", type: "text", props: { html: "<p>PR-MASQUE-MOBILE</p>" }, hideOn: ["mobile"] },
];
const EXPECT = {
  "pr0head00001": { color: "rgb(192, 57, 43)", fontFamily: /lora/i, fontSize: "37px", letterSpacing: "2px" },
  "pr0text00001": { color: "rgb(29, 78, 216)", fontSize: "19px" },
  "pr0link00001": { color: "rgb(124, 58, 237)", fontFamily: /lora/i },
  "pr0butt00001": { color: "rgb(255, 255, 255)", backgroundColor: "rgb(15, 118, 110)", fontFamily: /lora/i, borderTopLeftRadius: "17px" },
  "pr0boxx00001": { backgroundColor: "rgb(254, 243, 199)", paddingTop: "41px" },
  "pr0nest00001": { color: "rgb(157, 23, 77)", fontFamily: /lora/i },
};
// catégorie → [type du Theme Builder, adresse publique, conditions]
const CATEGORIES = [
  ["header", "header", "/"], ["footer", "footer", "/"], ["single_post", "single_post", "/blog/article-a"], ["archive", "archive", "/blog"],
  ["search_results", "search_results", "/blog?q=Article"], ["not_found", "not_found", "/introuvable-xyz"],
];

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text })); });
    r.on("error", reject); r.end();
  });
};

describe("Theme Builder : les réglages d'un élément produisent leur effet (canevas, enregistrement, rechargement, site public)", { skip: SKIP }, () => {
  let srv, boss, db, org, A, B, browser, port;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const mkPost = (site, slug, title) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at, category, tags) VALUES (?, ?, '<p>Texte</p>', 1, 'published', datetime('now'), '', '')").run(slug, title).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
  };
  const content = (name) => ({ title: name, sections: [{ id: "sect00000001", type: "layout", children: nodes() }] });
  // Mesure les styles calculés des éléments attendus (un rendu HTML complet est chargé dans le domaine du site, puis lu par Chrome)
  const measure = async (page, expect = EXPECT) => page.evaluate((ex) => {
    const out = {};
    for (const [id, props] of Object.entries(ex)) {
      const el = document.querySelector(`.kw-n-${id}`);
      if (!el) { out[id] = { absent: true }; continue; }
      const cs = getComputedStyle(el); out[id] = {};
      for (const k of Object.keys(props)) out[id][k] = cs[k];
    }
    return out;
  }, Object.fromEntries(Object.entries(expect).map(([id, p]) => [id, Object.fromEntries(Object.keys(p).map((k) => [k, 1]))])));
  const check = (got, label, expect = EXPECT) => {
    for (const [id, props] of Object.entries(expect)) {
      assert.ok(got[id] && !got[id].absent, `${label} : élément ${id} absent`);
      for (const [k, want] of Object.entries(props)) {
        const v = got[id][k];
        assert.ok(want instanceof RegExp ? want.test(v) : v === want, `${label} : ${id}.${k} = « ${v} » (attendu ${want})`);
      }
    }
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id; port = new URL(srv.base).port;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    mkPost(A, "article-a", "Article de A");
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--host-resolver-rules=MAP a.test 127.0.0.1, MAP b.test 127.0.0.1"] });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  for (const [label, type, url] of CATEGORIES) {
    test(`${label} : réglage → canevas → enregistrement → rechargement → publication → site public → isolation`, async () => {
      // 1. création du modèle (brouillon) et réglage des éléments
      const r = await post(U(A, "/api/modeles"), { type, name: `PR ${label}`, conditions: {} }); assert.equal(r.status, 200, r.text.slice(0, 200));
      const t = JSON.parse(r.text).template; const isPage = t.sourceKind === "page";
      const draftUrl = isPage ? `/marketing/pages/${t.sourceId}/brouillon` : `/marketing/site-web/composants/${t.sourceId}/brouillon`;
      const renderUrl = isPage ? `/marketing/pages/${t.sourceId}/rendu` : `/marketing/site-web/composants/${t.sourceId}/rendu`;
      const rev = one(isPage ? "SELECT revision FROM mk_landing_pages WHERE id = ?" : "SELECT revision FROM mk_web_components WHERE id = ?", t.sourceId).revision;
      const body = content(`PR ${label}`);
      // 2. canevas : le rendu du brouillon (même gabarit que le site) est chargé dans Chrome ; les réglages s'y voient
      const canvas = await boss.request(renderUrl, { method: "POST", json: { content: body }, headers: ORIGIN() });
      assert.equal(canvas.status, 200, canvas.text.slice(0, 200));
      const ctxc = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const pc = await ctxc.newPage();
      await pc.goto(`http://a.test:${port}/robots.txt`); await pc.evaluate((html) => { document.open(); document.write(html); document.close(); }, canvas.text);
      await pc.waitForFunction(() => document.readyState === "complete"); await pc.waitForTimeout(400);
      check(await measure(pc), `${label} canevas`);
      await ctxc.close();
      // 3. enregistrement puis rechargement : les réglages sont relus à l'identique
      assert.equal((await boss.request(draftUrl, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content: body } })).status, 200);
      const row = isPage ? one("SELECT draft FROM mk_landing_pages WHERE id = ?", t.sourceId) : one("SELECT draft FROM mk_web_components WHERE id = ?", t.sourceId);
      const saved = JSON.parse(row.draft);
      const find = (list, id) => { for (const n of list || []) { if (n.id === id) return n; const f = find(n.children, id); if (f) return f; } return null; };
      const root = isPage ? saved.sections : [saved];
      assert.equal(find(root, "pr0head00001").styles.desktop.fontFamily, "font.lora", `${label} : police enregistrée`);
      assert.equal(find(root, "pr0head00001").styles.tablet.fontSize, "23px", `${label} : réglage tablette enregistré`);
      assert.equal(find(root, "pr0head00001").states.hover.color, "#0b6e4f", `${label} : état au survol enregistré`);
      assert.equal(find(root, "pr0nest00001").styles.desktop.color, "#9d174d", `${label} : élément imbriqué enregistré`);
      assert.deepEqual(find(root, "pr0hide00001").hideOn, ["mobile"], `${label} : visibilité par appareil enregistrée`);
      const reopened = await boss.request(renderUrl, { method: "POST", json: { content: { title: "t", sections: isPage ? saved.sections : [saved] } }, headers: ORIGIN() });
      assert.equal(reopened.status, 200); assert.match(reopened.text, /kw-n-pr0head00001/);
      // 4. publication : le modèle s'applique à toutes les pages concernées
      const pub = await post(U(A, `/api/modeles/${t.id}/publier`)); assert.equal(pub.status, 200, pub.text.slice(0, 300));
      const ctxp = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const pp = await ctxp.newPage();
      const resp = await pp.goto(`http://a.test:${port}${url}`, { waitUntil: "load" });
      assert.ok([200, 404].includes(resp.status()), `${label} : statut ${resp.status()}`);
      await pp.waitForTimeout(400);
      check(await measure(pp), `${label} site public`);
      // responsive : tablette (réglage propre) et mobile (élément masqué)
      await pp.setViewportSize({ width: 800, height: 900 }); await pp.waitForTimeout(150);
      assert.equal(await pp.evaluate(() => getComputedStyle(document.querySelector(".kw-n-pr0head00001")).fontSize), "23px", `${label} : titre sur tablette`);
      await pp.setViewportSize({ width: 390, height: 900 }); await pp.waitForTimeout(150);
      assert.equal(await pp.evaluate(() => getComputedStyle(document.querySelector(".kw-n-pr0hide00001")).display), "none", `${label} : élément masqué sur mobile`);
      await pp.setViewportSize({ width: 1280, height: 900 }); await pp.waitForTimeout(150);
      // état interactif : couleur du titre au survol
      await pp.hover(".kw-n-pr0head00001"); await pp.waitForTimeout(250);
      assert.equal(await pp.evaluate(() => getComputedStyle(document.querySelector(".kw-n-pr0head00001")).color), "rgb(11, 110, 79)", `${label} : titre au survol`);
      // un seul exemplaire de l'élément sur la page (pas de doublon d'en-tête ou de pied)
      assert.equal(await pp.evaluate(() => document.querySelectorAll(".kw-n-pr0head00001").length), 1, `${label} : un seul exemplaire`);
      await ctxp.close();
      // 5. isolation : l'autre site ne reçoit rien
      const other = await hostReq(srv, "b.test", url.startsWith("/introuvable") ? url : "/blog");
      assert.ok(!other.text.includes("pr0head00001") && !other.text.includes("PR-TITRE"), `${label} : le modèle du site A apparaît sur le site B`);
      // archivage du modèle pour ne pas gêner la catégorie suivante
      assert.equal((await post(U(A, `/api/modeles/${t.id}/archiver`))).status, 200);
    });
  }
});
