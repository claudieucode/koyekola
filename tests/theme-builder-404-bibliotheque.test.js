// Page 404 — bibliothèque de 100 concepts sur un vrai serveur : chaque modèle, utilisé puis publié, fait de la page introuvable du site un VRAI 404 (noindex, isolation entre sites, accueil toujours 200) et reste responsive à 1440 / 820 / 390 px.
// La diversité (axes et arbres) est vérifiée dans theme-builder-404-diversite.test.js.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP_BROWSER = !chromium || !CHROME ? "Playwright ou Chrome absent" : false;

const ALL = Catalog.entries("not_found");
const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); };
const docOf = (key) => { const b = Catalog.build("not_found", key); return { type: "layout", children: b.sections[0].children }; };
const ALLOWED_URL = /^\/(|blog|catalogue|contact|boutique|compte)$/;
const AXES = ["C", "N", "M", "A", "R", "P", "T", "D"], STRUCT = [0, 1, 2, 3, 4, 7];

// Signature d'arbre : types, imbrication, sens des flex, colonnes des grilles — sans valeurs ni identifiants
const sig = (n) => `${n.type}${n.styles && n.styles.desktop && n.styles.desktop.flexDirection === "row" ? "~" : ""}${n.styles && n.styles.desktop && n.styles.desktop.columns ? "#" + n.styles.desktop.columns : ""}${(n.children || []).length ? "(" + n.children.map(sig).join(",") + ")" : ""}`;
// Sac de jetons (type + disposition) pour comparer deux compositions
const bag = (n) => { const m = new Map(); walk(n, (x) => { const d = (x.styles && x.styles.desktop) || {}; const t = `${x.type}|${d.flexDirection || ""}|${d.columns || ""}|${d.alignItems || ""}|${d.justifyContent || ""}`; m.set(t, (m.get(t) || 0) + 1); }); return m; };
const jaccard = (a, b) => { let i = 0, u = 0; for (const k of new Set([...a.keys(), ...b.keys()])) { const x = a.get(k) || 0, y = b.get(k) || 0; i += Math.min(x, y); u += Math.max(x, y); } return u ? i / u : 1; };


const hostReq = (srv, host, path) => new Promise((resolve, reject) => {
  const u = new URL(srv.base);
  const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers })); });
  r.on("error", reject); r.end();
});

describe("Page 404  : serveur réel, vrai statut 404, isolation, responsive", () => {
  let srv, boss, db, org, A, B, browser;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => { const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text); return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() }); };
  const adopt = async (site, key) => {
    const u = await post(U(site, "/api/bibliotheque/utiliser"), { type: "not_found", key }); assert.equal(u.status, 200, `${key} : ${u.text.slice(0, 300)}`);
    const t = JSON.parse(u.text).template; const p = await post(U(site, `/api/modeles/${t.id}/publier`), { replace: true }); assert.equal(p.status, 200, `${key} : ${p.text.slice(0, 300)}`);
    return t;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "",  });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    if (!SKIP_BROWSER) browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test("pour CHAQUE modèle : utilisé puis publié, l'adresse inconnue du site A répond HTTP 404 avec le titre du modèle, noindex, et le site B n'en montre rien", async () => {
    for (const e of ALL) {
      const title = JSON.stringify(docOf(e.key)).match(/"text":"([^"]*)","level":"1"/);
      const h1 = (() => { let t = ""; walk(docOf(e.key), (n) => { if (n.type === "heading" && n.props && n.props.level === "1" && n.props.tag !== "p") t = n.props.text; if (n.type !== "heading" && n.props && (n.props.tag === "h1" || n.props.titleTag === "h1")) t = n.props.text || n.props.title || (n.props.phrases && n.props.phrases[0].text) || t; }); return t; })();
      assert.ok(h1, `${e.key} : titre de niveau 1`); void title;
      await adopt(A, e.key);
      const a = await hostReq(srv, "a.test", "/introuvable-xyz");
      assert.equal(a.status, 404, `${e.key} : statut`);
      assert.ok(a.text.includes(h1) || a.text.includes(h1.replace(/'/g, "&#39;")), `${e.key} : titre « ${h1} » affiché`);
      assert.match(String(a.headers["x-robots-tag"] || "") + a.text, /noindex/, `${e.key} : noindex`);
      const b = await hostReq(srv, "b.test", "/introuvable-xyz"); assert.equal(b.status, 404);
      assert.ok(!b.text.includes(h1) || h1 === "Page introuvable.", `${e.key} : isolation (le site B n'affiche pas le modèle du site A)`);
    }
  });
  test("URL existante : l'accueil du site A reste un 200 normal (aucun soft 404)", async () => {
    const ok = await hostReq(srv, "a.test", "/"); assert.equal(ok.status, 200);
  });
  test("responsive : chaque modèle à 1440 / 820 / 390 px — aucun défilement horizontal, un seul h1, polices chargées", { skip: SKIP_BROWSER }, async () => {
    const bad = [];
    for (const w of [1440, 820, 390]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 800 } }); await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
      const page = await ctx.newPage();
      for (const e of ALL) {
        await page.goto(srv.base + U(A, `/api/bibliotheque/not_found/${e.key}/apercu`), { waitUntil: "load" });
        await page.evaluate(async () => { await document.fonts.ready; });
        const m = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth;
          // Un élément qui dépasse mais est rogné par un ancêtre (bande défilante, carrousel, texte découpé…) n'est pas un défaut : seul compte ce que le visiteur peut voir ou atteindre
          const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (cs.overflowX !== "visible") { const r = p.getBoundingClientRect(); if (r.left >= -2 && r.right <= vw + 2) return true; } } return false; };
          const off = [...document.querySelectorAll("h1,h2,p,a,button,input,form,nav,li,span")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 2 || r.left < -2) && !clipped(el); }).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}`);
          return { over: document.documentElement.scrollWidth > vw + 1, h1: document.querySelectorAll("h1").length, off: off.length, sample: off.slice(0, 3) };
        });
        if (m.over || m.h1 !== 1 || m.off) bad.push(`${e.key} @${w} : ${JSON.stringify(m)}`);
      }
      await ctx.close();
    }
    assert.deepEqual(bad, []);
  });
});
