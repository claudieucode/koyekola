// Site principal + Theme Builder, dans un VRAI Chrome (pilote DevTools maison, voir helpers-chrome-site.js) et sur un serveur réel.
// Preuves : (1) SANS modèle, l'habillage d'origine s'affiche (mesures à 390 / 820 / 1280 px) ; (2) AVEC modèles publiés, l'en-tête et le pied du Theme Builder
// s'affichent sans défilement horizontal ; (3) après archivage, le rendu redevient EXACTEMENT celui d'avant (HTML de l'habillage et mesures identiques) ;
// (4) isolation : un modèle du site principal n'apparaît jamais sur un site client (adresse de domaine) et inversement.
// Ignoré (avec la raison) sans Playwright / Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const Cdp = require("./helpers-chrome-site");
const SKIP = Cdp.AVAILABLE ? false : "Chrome absent : preuve navigateur non exécutée sur cette machine";
const WIDTHS = [390, 820, 1280];
const PAGES = ["/", "/catalogue", "/blog", "/connexion"];

describe("Site principal et Theme Builder dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, db, org, A;
  const errors = [];
  const P = "/marketing/site-web/principal/constructeur-de-theme";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const model = async (base, type, name) => {
    const r = await post(`${base}/api/modeles`, { type, name, conditions: {} }); assert.equal(r.status, 200, r.text.slice(0, 300));
    const t = JSON.parse(r.text).template;
    const c = one("SELECT section FROM mk_web_components WHERE id = ?", t.sourceId);
    const section = JSON.parse(c.section); section.children = [{ id: "hed000000002", type: "heading", props: { text: name, level: "3" } }];
    db.prepare("UPDATE mk_web_components SET section = ? WHERE id = ?").run(JSON.stringify(section), t.sourceId);
    const p = await post(`${base}/api/modeles/${t.id}/publier`); assert.equal(p.status, 200, p.text.slice(0, 300));
    return t;
  };
  const hostGet = (host, path) => { const u = new URL(srv.base); return new Promise((resolve, reject) => { const r = http.request({ host: u.hostname, port: u.port, path, headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text })); }); r.on("error", reject); r.end(); }); };

  // Photographie d'une page publique : HTML de l'en-tête et du pied (normalisé), mesures calculées, débordement horizontal
  const snap = async (path, width) => {
    const page = await browser.newPage({ width, height: 900 });
    await page.goto(`${srv.base}${path}`);
    const s = await page.evaluate(() => {
      const norm = (h) => h.replace(/nonce="[^"]*"/g, "").replace(/value="[a-f0-9]{16,}"/g, "").replace(/\s+/g, " ");
      const box = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(), c = getComputedStyle(e); return { w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, pos: c.position, disp: c.display, color: c.color, font: c.fontFamily }; };
      const hd = document.querySelector(".site-header"), ft = document.querySelector(".site-footer");
      return {
        header: hd ? norm(hd.outerHTML) : null, footer: ft ? norm(ft.outerHTML) : null,
        hdBox: box(".site-header"), ftBox: box(".site-footer"),
        tbHeader: Boolean(document.querySelector(".kw-theme-header")), tbFooter: Boolean(document.querySelector(".kw-theme-footer")),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        text: document.body.innerText,
      };
    });
    errors.push(...page.pageErrors.map((e) => `${path}@${width} : ${e}`));
    s.page = page; return s;
  };
  const closeSnap = async (s) => { await s.page.close(); delete s.page; return s; };
  const all = async () => { const out = {}; for (const p of PAGES) for (const w of WIDTHS) out[`${p}@${w}`] = await closeSnap(await snap(p, w)); return out; };

  let SANS;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
    browser = await Cdp.launch();
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("1. SANS modèle : l'habillage d'origine s'affiche partout, sans débordement (390 / 820 / 1280 px)", async () => {
    SANS = await all();
    for (const [k, s] of Object.entries(SANS)) {
      assert.equal(s.tbHeader || s.tbFooter, false, `${k} : aucun habillage Theme Builder sans modèle`);
      assert.ok(s.header && s.footer, `${k} : en-tête et pied d'origine présents`);
      assert.ok(s.overflow <= 1, `${k} : défilement horizontal de ${s.overflow}px`);
    }
    // menu mobile de l'habillage d'origine : le bouton ouvre le menu
    const m = await snap("/", 390);
    await m.page.click("#openMenuBtn"); assert.equal(await m.page.attr("#openMenuBtn", "aria-expanded"), "true", "le menu mobile s'ouvre");
    assert.ok((await m.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 1, "menu mobile ouvert : pas de débordement");
    await closeSnap(m);
  });

  test("2. AVEC en-tête et pied publiés : ils remplacent l'habillage, sans débordement ni erreur (390 / 820 / 1280 px)", async () => {
    await model(P, "header", "ENTETE-NAVIGATEUR"); await model(P, "footer", "PIED-NAVIGATEUR");
    const AVEC = await all();
    for (const [k, s] of Object.entries(AVEC)) {
      assert.ok(s.tbHeader && s.tbFooter, `${k} : habillage Theme Builder présent`);
      assert.match(s.text, /ENTETE-NAVIGATEUR/, k); assert.match(s.text, /PIED-NAVIGATEUR/, k);
      assert.equal(s.header, null, `${k} : l'ancien en-tête ne doit plus s'afficher`);
      assert.ok(s.overflow <= 1, `${k} : défilement horizontal de ${s.overflow}px`);
    }
    assert.deepEqual(errors, []);
  });

  test("3. isolation : un modèle du site principal n'apparaît pas sur un site client et celui du client pas sur le principal", async () => {
    const base = `/marketing/site-web/sites/${A}/constructeur-de-theme`;
    await model(base, "header", "ENTETE-CLIENT-A");
    const principal = await hostGet(new URL(srv.base).host, "/");
    assert.match(principal.text, /ENTETE-NAVIGATEUR/); assert.doesNotMatch(principal.text, /ENTETE-CLIENT-A/);
    const mine = JSON.parse((await boss.get(`${base}/api/modeles`)).text);
    assert.deepEqual(mine.templates.map((t) => t.name), ["ENTETE-CLIENT-A"]);
    assert.ok(!JSON.stringify(mine).includes("NAVIGATEUR"));
  });

  test("4. retour arrière : après archivage des deux modèles, le rendu est EXACTEMENT celui d'avant (HTML et mesures identiques)", async () => {
    const list = JSON.parse((await boss.get(`${P}/api/modeles`)).text).templates.filter((t) => t.status === "published");
    assert.equal(list.length, 2);
    for (const t of list) assert.equal((await post(`${P}/api/modeles/${t.id}/archiver`)).status, 200);
    const APRES = await all();
    for (const k of Object.keys(SANS)) {
      const a = SANS[k], b = APRES[k];
      assert.equal(b.header, a.header, `${k} : HTML de l'en-tête différent`);
      assert.equal(b.footer, a.footer, `${k} : HTML du pied différent`);
      assert.deepEqual(b.hdBox, a.hdBox, `${k} : mesures de l'en-tête différentes`);
      assert.deepEqual(b.ftBox, a.ftBox, `${k} : mesures du pied différentes`);
      assert.equal(b.overflow, a.overflow, k);
      assert.equal(b.tbHeader || b.tbFooter, false, k);
    }
  });
});
