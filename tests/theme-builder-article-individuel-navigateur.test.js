// Article individuel : rendu RÉEL (Chrome) des 100 modèles de la bibliothèque autour d'un article riche (intertitres, listes, citation, tableau), aux trois largeurs (1440 / 820 / 390).
// Contrôle pour chaque modèle : titre et contenu de l'article visibles, une seule fois ; aucun débordement horizontal, chevauchement, texte coupé ou illisible ; aucune erreur JavaScript.
// Rapport par modèle : BIB_REPORT=/chemin/rapport.json ; captures : BIB_SHOTS=/dossier ; restreindre : BIB_ONLY=cle1,cle2. Ignoré sans Playwright/Chrome.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { INSPECT } = require("./inspect-rendu");
const Catalog = require("../src/themeBuilder/catalog");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : rendu des modèles d'article non exécuté sur cette machine" : false;
const only = process.env.BIB_ONLY ? new Set(process.env.BIB_ONLY.split(",")) : null;
const KEYS = Catalog.entries("single_post").map((e) => e.key).filter((k) => !only || only.has(k));
const VIEWPORTS = [["desktop", 1440, 900], ["tablet", 820, 1100], ["mobile", 390, 800]];
const BODY = "PARAGRAPHE-UN-ZQ ouvre l'article avec une première phrase assez longue pour vérifier la largeur de lecture et le retour à la ligne sur mobile.\n\n## Premier intertitre de l'article\n\nUn texte courant, avec un [lien interne](/blog) et du **texte en gras**.\n\n- Premier point de la liste\n- Deuxième point de la liste\n\n> Une citation mise en valeur dans le corps de l'article.\n\n### Un sous-titre\n\nDernier paragraphe, FIN-ARTICLE-ZQ."; // le contenu des articles est du Markdown

describe("Article individuel : rendu navigateur des 100 modèles (3 largeurs)", { skip: SKIP }, () => {
  let srv, boss, browser, db, site;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Articles" })).location.match(/sites\/(\d+)/)[1]);
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, status, published_at) VALUES ('article-riche', 'TITRE-RICHE-ZQ : un titre d article un peu long pour tester les retours à la ligne', ?, 'Résumé de l article riche.', 1, 'published', datetime('now'))").run(BODY).lastInsertRowid);
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, 'article-riche')").run(id, org, site);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (db) db.close(); if (srv) await srv.stop(); });

  test(`chaque modèle (${KEYS.length}) s'affiche avec le bon article, sans défaut, sur ordinateur, tablette et mobile`, { timeout: 3600000 }, async () => {
    const report = {}; let defects = 0;
    for (const [vp, width, height] of VIEWPORTS) {
      const context = await browser.newContext({ viewport: { width, height } });
      await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
      const page = await context.newPage(); const errors = [];
      page.on("pageerror", (e) => errors.push(`erreur JavaScript : ${e.message}`));
      page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|X-Frame-Options|frame-ancestors/.test(m.text())) errors.push(`erreur console : ${m.text().slice(0, 140)}`); });
      for (const key of KEYS) {
        errors.length = 0; let issues = [], status = 0;
        const url = `${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/single_post/${key}/apercu`;
        try {
          const r = await page.goto(url, { waitUntil: "load", timeout: 30000 }); status = r.status(); await page.waitForTimeout(60);
          if (status === 200) {
            issues = await page.evaluate(INSPECT);
            const txt = await page.evaluate(() => document.body.innerText);
            const count = (re) => (txt.match(re) || []).length;
            if (count(/TITRE-RICHE-ZQ/g) < 1) issues.push("titre de l'article absent");
            if (count(/PARAGRAPHE-UN-ZQ/g) !== 1) issues.push(`contenu de l'article affiché ${count(/PARAGRAPHE-UN-ZQ/g)} fois`);
            if (count(/FIN-ARTICLE-ZQ/g) !== 1) issues.push("fin de l'article absente ou répétée");
            if (/\{\{post\./.test(txt)) issues.push("étiquette dynamique non résolue");
            const h1 = await page.evaluate(() => [...document.querySelectorAll("h1")].filter((h) => h.offsetParent !== null && /TITRE-RICHE-ZQ/.test(h.textContent)).length);
            if (h1 !== 1) issues.push(`${h1} titre(s) h1 visible(s) pour l'article (attendu : 1)`);
            if (process.env.BIB_SHOTS) { fs.mkdirSync(process.env.BIB_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.BIB_SHOTS}/${key}.${vp}.png`, fullPage: true }); }
          }
        } catch (e) { issues = [`navigation impossible : ${e.message.slice(0, 120)}`]; }
        if (status !== 200) issues.unshift(`HTTP ${status}`);
        issues.push(...errors);
        if (issues.length) { (report[key] ||= {})[vp] = issues; defects += issues.length; }
      }
      await context.close();
    }
    if (process.env.BIB_REPORT) fs.writeFileSync(process.env.BIB_REPORT, JSON.stringify({ models: KEYS.length, defects, report }, null, 1));
    const bad = Object.keys(report);
    assert.equal(bad.length, 0, `${bad.length} modèle(s) défectueux sur ${KEYS.length} :\n${bad.slice(0, 25).map((r) => `  ${r} → ${Object.entries(report[r]).map(([v, l]) => `${v}: ${l[0]}`).join(" | ")}`).join("\n")}`);
  });
});
