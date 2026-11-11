// Indépendance graphique des archives dans un VRAI Chrome, sur la page PUBLIQUE d'un site à charte bleu marine (thème autonome réglé sur le site) : on mesure les styles réellement calculés,
// puis on change couleurs, polices et thème du site : l'archive ne doit pas bouger. Constat vérifié ici : les pages du blog ne chargent PAS la feuille d'un thème autonome (la barrière CSS envisagée est donc inutile).
// Ignoré (avec la raison) sans Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { launch, SKIP } = require("./helpers-chrome-cdp");
const Archive = require("../src/themeBuilder/catalog/archive");

const hostGet = (srv, host, p) => { const u = new URL(srv.base); return new Promise((resolve, reject) => { const r = http.request({ host: u.hostname, port: u.port, path: p, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text })); }); r.on("error", reject); r.end(); }); };

describe("Archives : indépendance graphique dans un navigateur réel (page publique, thème actif)", { skip: SKIP }, () => {
  let srv, boss, db, site, chrome, tmp;
  const KEY = "verso.heros-grille", S = () => Archive.skins.find((s) => s.key === KEY);
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const setSite = (tokens) => db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(tokens), site);
  // Jetons VALIDES (normalisés par le moteur : un jeton partiel ferait échouer le rendu du site) + thème autonome actif
  const { normalizeTokens } = require("../src/marketing/pages/tokens");
  const tokens = (colors, pack, fonts) => ({ ...normalizeTokens({ colors, ...(fonts ? { fonts } : {}) }, { strict: false }), pack: { key: pack, options: {} } });
  const NAVY = tokens({ primary: "#0b2a40", secondary: "#0b2a40", background: "#0b2a40", surface: "#12395a", text: "#ffffff" }, "bulletin");
  const OTHER = tokens({ primary: "#b91c1c", secondary: "#14532d", background: "#14532d", surface: "#166534", text: "#fef9c3" }, "courrier", { heading: "font.playfair-display", body: "font.lato" });
  const rgb = (h) => `rgb(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ")})`;
  // La page publique est lue avec l'en-tête Host du site, écrite dans un fichier dont les ressources (CSS du thème, polices) pointent vers le serveur de test
  const load = async (pg, p = "/blog") => {
    const r = await hostGet(srv, "a.test", p); assert.equal(r.status, 200, `${p} : ${srv.logs().split("\n").filter((l) => /Error|error|at /.test(l)).slice(-8).join(" | ").slice(0, 900)}`);
    const file = path.join(tmp, `p-${Math.random().toString(36).slice(2)}.html`);
    fs.writeFileSync(file, r.text.replace("<head>", `<head><base href="${srv.base}/">`)); await pg.goto(`file://${file}`); return r.text;
  };
  const measure = (page) => page.evaluate(() => {
    const root = document.querySelector("[data-kw-own]"), cs = (e) => getComputedStyle(e);
    const h1 = root.querySelector("h1"), a = root.querySelector("a");
    const probe = document.createElement("a"); probe.href = "#"; probe.textContent = "témoin"; document.body.appendChild(probe);
    const probeH = document.createElement("h2"); probeH.textContent = "témoin"; document.body.appendChild(probeH);
    return { pack: document.body.getAttribute("data-kw-pack"), bg: cs(root).backgroundColor, h1Color: h1 && cs(h1).color, h1Font: h1 && cs(h1).fontFamily, linkColor: a && cs(a).color, linkDeco: a && cs(a).textDecorationLine,
      probeColor: cs(probe).color, probeFont: cs(probeH).fontFamily, probeWeight: cs(probeH).fontWeight, probeSize: cs(probeH).fontSize };
  });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kw-iso-"));
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, "Site marine", "site-marine").lastInsertRowid);
    // Un article réel pour que le blog existe (le domaine d'un site ne montre que ses articles)
    const pid = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at, category, tags) VALUES ('marine-1', 'Article marine', '<p>Texte</p>', 'Extrait', 1, 'published', datetime('now'), '', '')").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, 'marine-1')").run(pid, org, site);
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil', 'accueil-iso', 'Accueil', 'published', ?, datetime('now'), 'page', 1)").run(org, site).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, site);
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    assert.equal((await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: "https://a.test" } }, revision: cur.revision }, headers: ORIGIN() })).status, 200);
    const u = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "archive", key: KEY }, headers: ORIGIN() }); assert.equal(u.status, 200, u.text.slice(0, 200));
    const t = JSON.parse(u.text).template; assert.equal((await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: ORIGIN() })).status, 200);
    // Chrome peut démarrer lentement quand la machine est chargée : jusqu'à 4 essais
    for (let i = 0; i < 4 && !chrome; i += 1) { try { chrome = await launch(); } catch (e) { if (i === 3) throw e; } }
  });
  after(async () => { if (chrome) await chrome.close(); if (db) db.close(); if (srv) await srv.stop(); });
  const open = (width = 1280) => chrome.newPage({ width, height: 900 });

  test("charte marine : l'archive garde ses couleurs et ses polices (fond, encre, police des titres, liens) ; aucune feuille de thème autonome sur le blog", async () => {
    setSite(NAVY); const pg = await open(); const r0 = await load(pg); const a = await measure(pg);
    assert.match(r0, /^(?![\s\S]*theme-packs)/, "la page du blog ne charge aucune feuille de thème autonome");
    assert.equal(a.bg, rgb(S().bg), "fond propre du modèle (pas le bleu marine du site)");
    assert.equal(a.h1Color, rgb(S().fg), "titre : encre propre du modèle");
    assert.match(a.h1Font, /Fraunces/i, "titre : police propre du modèle");
    await pg.close();
  });
  test("le site change de couleurs, de polices et de thème : l'archive ne bouge pas, et reste identique au rechargement", async () => {
    setSite(NAVY); const p1 = await open(); await load(p1); const before = await measure(p1); await p1.close();
    setSite(OTHER); const p2 = await open(); await load(p2); const after = await measure(p2);
    assert.equal(JSON.parse(db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(site).tokens).pack.key, "courrier", "le thème et la charte du site ont bien changé");
    for (const k of ["bg", "h1Color", "h1Font", "linkColor", "linkDeco"]) assert.equal(after[k], before[k], `${k} inchangé`);
    await load(p2); const again = await measure(p2); for (const k of ["bg", "h1Color", "h1Font", "linkColor"]) assert.equal(again[k], after[k], `${k} stable au rechargement`);
    await p2.close();
  });
  test("responsive : aucun débordement horizontal à 1280, 820 et 390 px, avec le thème actif", async () => {
    setSite(NAVY);
    for (const w of [1280, 820, 390]) { const p = await open(w); await load(p); const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); assert.ok(o <= 1, `${w}px : débordement de ${o}px`); await p.close(); }
  });
});
