// Page 404 — nouvelle bibliothèque (KW_404_V2=1, en construction) : chaque modèle est un concept distinct, valide, responsive, et il fait de la vraie page introuvable du site un VRAI 404.
// Portes de diversité (docs/theme-builder/404/TEST_PLAN.md §2) : axes déclarés comparés deux à deux ET arbres réellement construits comparés deux à deux.
process.env.KW_404_V2 = "1";
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

describe("Page 404 (nouvelle bibliothèque) : catalogue", () => {
  test("métadonnées : codes 404-NNN consécutifs, clés et noms uniques, famille connue, axes complets", () => {
    assert.ok(ALL.length >= 1);
    assert.equal(new Set(ALL.map((e) => e.key)).size, ALL.length, "clés uniques");
    assert.equal(new Set(ALL.map((e) => e.name)).size, ALL.length, "noms uniques");
    ALL.forEach((e, i) => {
      assert.equal(e.code, `404-${String(i + 1).padStart(3, "0")}`, `code de ${e.key}`);
      assert.match(e.key, /^[a-z0-9.-]{3,80}$/, `clé ${e.key}`);
      assert.ok(e.desc && e.desc.length > 20, `description de ${e.key}`);
      assert.ok(e.layoutLabel, `famille de ${e.key}`);
      for (const a of AXES) assert.ok(Number.isInteger(e.axes[a]), `${e.key} : axe ${a}`);
    });
  });
  test("densité : l'axe D déclaré correspond au nombre réel d'éléments de contenu (≤ 6 · 7–12 · 13–22 · > 22)", () => {
    const WRAP = new Set(["layout", "container", "stack", "group", "grid", "columns", "column", "root"]);
    for (const e of ALL) { let n = 0; walk(docOf(e.key), (x) => { if (!WRAP.has(x.type)) n += 1; }); const d = n <= 6 ? 1 : n <= 12 ? 2 : n <= 22 ? 3 : 4; assert.equal(e.axes.D, d, `${e.key} : ${n} éléments de contenu → D=${d}`); }
  });
  test("chaque modèle : un seul h1, une action utile, liens vers des pages standard, aucune position absolue/fixe, aucune image factice", () => {
    for (const e of ALL) {
      const doc = docOf(e.key); let h1 = 0, actions = 0; const bad = [];
      walk(doc, (n) => {
        if ((n.type === "heading" && n.props && n.props.level === "1" && n.props.tag !== "p") || (n.type === "motiontypewriter" && n.props && n.props.tag === "h1")) h1 += 1;
        if (["button", "link", "search", "menu"].includes(n.type)) actions += 1;
        if (["button", "link"].includes(n.type) && n.props && !ALLOWED_URL.test(n.props.url || "")) bad.push(n.props.url);
        for (const d of Object.values(n.styles || {})) if (d && (d.position === "absolute" || d.position === "fixed")) bad.push("position:" + d.position);
        if (n.type === "image") bad.push("image");
      });
      assert.equal(h1, 1, `${e.key} : un seul h1`); assert.ok(actions >= 1, `${e.key} : au moins une action`); assert.deepEqual(bad, [], `${e.key}`);
    }
  });
});

describe("Page 404 (nouvelle bibliothèque) : portes de diversité", () => {
  test("axes déclarés : pour toute paire, ≥ 5 axes différents sur 8 et ≥ 3 axes structurels sur 6", () => {
    const bad = [];
    for (let i = 0; i < ALL.length; i++) for (let j = i + 1; j < ALL.length; j++) {
      let t = 0, s = 0; AXES.forEach((a, k) => { if (ALL[i].axes[a] !== ALL[j].axes[a]) { t += 1; if (STRUCT.includes(k)) s += 1; } });
      if (t < 5 || s < 3) bad.push(`${ALL[i].key} ≈ ${ALL[j].key} (${t}/8, ${s}/6)`);
    }
    assert.deepEqual(bad, []);
  });
  test("arbres construits : tous différents ; deux compositions ne se ressemblent jamais à plus de 85 % (sac de types et de dispositions)", () => {
    const docs = ALL.map((e) => ({ key: e.key, doc: docOf(e.key) }));
    assert.equal(new Set(docs.map((d) => sig(d.doc))).size, docs.length, "signatures d'arbre toutes distinctes");
    const close = [];
    for (let i = 0; i < docs.length; i++) for (let j = i + 1; j < docs.length; j++) { const s = jaccard(bag(docs[i].doc), bag(docs[j].doc)); if (s > 0.85) close.push(`${docs[i].key} ≈ ${docs[j].key} (${Math.round(s * 100)} %)`); }
    assert.deepEqual(close, []);
  });
  test("aucune valeur d'axe de composition ne domine : au plus 20 % des modèles partagent la même composition (à partir de 10 modèles)", () => {
    if (ALL.length < 10) return;
    const c = {}; ALL.forEach((e) => { c[e.axes.C] = (c[e.axes.C] || 0) + 1; });
    assert.ok(Math.max(...Object.values(c)) <= Math.ceil(ALL.length * 0.2), JSON.stringify(c));
  });
});

const hostReq = (srv, host, path) => new Promise((resolve, reject) => {
  const u = new URL(srv.base);
  const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers })); });
  r.on("error", reject); r.end();
});

describe("Page 404 (nouvelle bibliothèque) : serveur réel, vrai statut 404, isolation, responsive", () => {
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
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KW_404_V2: "1" });
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
      const h1 = (() => { let t = ""; walk(docOf(e.key), (n) => { if (n.type === "heading" && n.props && n.props.level === "1" && n.props.tag !== "p") t = n.props.text; if (n.type === "motiontypewriter" && n.props && n.props.tag === "h1") t = n.props.phrases[0].text; }); return t; })();
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
        const m = await page.evaluate(() => { const vw = document.documentElement.clientWidth; const off = [...document.querySelectorAll("h1,h2,p,a,button,input,form,nav,li,span")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > vw + 2 || r.left < -2); }).length; return { over: document.documentElement.scrollWidth > vw + 1, h1: document.querySelectorAll("h1").length, off }; });
        if (m.over || m.h1 !== 1 || m.off) bad.push(`${e.key} @${w} : ${JSON.stringify(m)}`);
      }
      await ctx.close();
    }
    assert.deepEqual(bad, []);
  });
});
