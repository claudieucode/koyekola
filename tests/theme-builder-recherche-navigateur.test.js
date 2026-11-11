// Page individuelle : contrôle visuel par lots des 100 modèles dans un vrai Chrome (aperçu de la bibliothèque = rendu du site), à 1280 / 820 / 390 px.
// Défauts recherchés pour CHAQUE modèle et CHAQUE largeur : défilement horizontal du document, élément qui dépasse la fenêtre, blocs frères qui se chevauchent, titre H1 absent/invisible/vide,
// texte coupé. Le rapport des modèles défectueux est affiché ; GENERER_RAPPORT=1 l'écrit dans docs/theme-builder/rapport-visuel-resultats-recherche.json.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const WIDTHS = [["desktop", 1280, 900], ["tablette", 820, 1000], ["mobile", 390, 800]];

describe("Résultats de recherche · 100 modèles dans Chrome (desktop, tablette, mobile)", { skip: !chromium || !CHROME ? "Playwright ou Chrome absent" : false }, () => {
  let srv, boss, db, org, A, browser;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  // Mesures dans la page : renvoie la liste des défauts (vide = sain)
  const inspect = () => {
    const defects = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) defects.push(`défilement horizontal (${document.documentElement.scrollWidth} > ${vw})`);
    const root = document.querySelector(".kw-theme-template") || document.body;
    const vis = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none"; };
    const h1 = [...root.querySelectorAll("h1")].filter(vis);
    if (h1.length !== 1) defects.push(`${h1.length} titres H1 visibles`);
    else if (!h1[0].textContent.trim()) defects.push("H1 vide");
    for (const e of root.querySelectorAll("*")) {
      if (!vis(e)) continue;
      const r = e.getBoundingClientRect();
      // un élément qui défile volontairement à l'intérieur d'un cadre qui découpe (bandeau défilant) ne fait pas déborder la page
      const clipped = (() => { for (let a = e.parentElement; a && a !== root; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === "hidden" || o === "clip" || o === "auto" || o === "scroll") return a.getBoundingClientRect().right <= vw + 2; } return false; })();
      if (r.right > vw + 2 && !clipped && getComputedStyle(e).position !== "fixed") { defects.push(`dépasse à droite : ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} (${Math.round(r.right)} > ${vw})`); break; }
    }
    // champ de recherche : le bouton reste sur la ligne du champ, à la même hauteur, sans retour à la ligne du texte
    for (const f of root.querySelectorAll(".kw-search")) { const i = f.querySelector("input"), b = f.querySelector("button"); if (!i || !b || !vis(i)) continue; const ri = i.getBoundingClientRect(), rb = b.getBoundingClientRect(); if (Math.abs(ri.top + ri.height / 2 - (rb.top + rb.height / 2)) > 3 && rb.top > ri.bottom - 4) { defects.push("bouton de recherche décalé sous le champ"); break; } if (rb.height > ri.height * 1.6) { defects.push("bouton de recherche déformé (texte sur plusieurs lignes)"); break; } }
    // blocs frères d'une grille ou d'une ligne qui se chevauchent
    for (const e of root.querySelectorAll("*")) {
      const d = getComputedStyle(e).display;
      if (!(d.includes("grid") || d.includes("flex")) || e.children.length < 2) continue;
      const kids = [...e.children].filter(vis).map((c) => c.getBoundingClientRect()).filter((r) => r.height > 4 && r.width > 4);
      for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++) {
        const a = kids[i], b = kids[j];
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left), oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 6 && oy > 6) { defects.push(`chevauchement dans ${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]}`); i = kids.length; break; }
      }
      if (defects.length > 5) break;
    }
    // texte coupé : conteneur à débordement masqué dont le contenu est plus large que lui
    for (const e of root.querySelectorAll("h1,h2,h3,p,a,button,li")) {
      if (!vis(e)) continue;
      const cs = getComputedStyle(e);
      if ((cs.overflowX === "hidden" || cs.textOverflow === "ellipsis") && e.scrollWidth > e.clientWidth + 2) { defects.push(`texte coupé : ${e.tagName.toLowerCase()} « ${e.textContent.trim().slice(0, 30)} »`); break; }
    }
    return defects;
  };

  test("aucun modèle n'a de défaut visible aux trois largeurs (rapport des modèles défectueux)", async () => {
    const entries = Catalog.entries("search_results");
    const report = [];
    for (const [name, w, h] of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
      const page = await ctx.newPage();
      for (const e of entries) {
        const res = await page.goto(`${srv.base}${U(A, `/api/bibliotheque/search_results/${e.key}/apercu`)}`, { waitUntil: "load" });
        if (!res || res.status() !== 200) { report.push({ key: e.key, name, defects: [`HTTP ${res && res.status()}`] }); continue; }
        const defects = await page.evaluate(inspect);
        if (defects.length) report.push({ key: e.key, name, defects: [...new Set(defects)].slice(0, 4) });
      }
      await ctx.close();
    }
    if (process.env.GENERER_RAPPORT === "1") fs.writeFileSync(path.join(__dirname, "..", "docs", "theme-builder", "rapport-visuel-resultats-recherche.json"), JSON.stringify({ modeles: entries.length, largeurs: WIDTHS.map((x) => `${x[0]} ${x[1]}px`), defectueux: report }, null, 1) + "\n");
    if (report.length) console.log("Modèles défectueux :\n" + report.map((r) => `  ${r.key} (${r.name}) : ${r.defects.join(" ; ")}`).join("\n"));
    assert.deepEqual(report, [], `${new Set(report.map((r) => r.key)).size} modèle(s) défectueux`);
  });
});
