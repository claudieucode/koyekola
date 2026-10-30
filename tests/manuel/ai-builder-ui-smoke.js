// Programme 21.8 — essai NAVIGATEUR RÉEL du créateur de site IA (Chrome piloté par Playwright). Hors de `npm test` : il demande Chrome et playwright-core.
// Usage : NODE_PATH=<dossier>/node_modules node tests/manuel/ai-builder-ui-smoke.js <dossier de sortie>   (captures dans <sortie>/shots, résultats dans <sortie>/ui-results.json)
// Serveur et faux fournisseur d'IA locaux, base jetable : aucun appel externe, aucun coût.
const http = require("node:http");
const path = require("node:path");
const ROOT = path.join(__dirname, "..", "..");
const { startServer, loginInstructor } = require(path.join(ROOT, "tests/helpers"));
const { TEST_KEY } = require(path.join(ROOT, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const OUT = process.argv[2]; require("fs").mkdirSync(`${OUT}/shots`, { recursive: true });
const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
const ANALYSIS = { briefLanguage: "fr", name: fact("BâtiPlus", "explicit", "BâtiPlus"), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(), city: fact("Kinshasa", "explicit", "Kinshasa"), siteLanguage: fact("fr", "assumed"), audience: fact(), tone: fact(), formality: fact(), style: fact("moderne", "explicit", "moderne"), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "devis" }], features: [{ key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "devis", reason: "" }, { key: "boutique", status: "inferred", confidence: 0.6, evidence: "", reason: "" }], pagesRequested: [], contradictions: [], missing: [], questions: [{ topic: "photos", question: "Disposez-vous de photographies de vos réalisations ?", why: "Elles alimentent la galerie.", blocking: false, choices: ["Oui", "Non"] }] };
const sec = (type, purpose) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai" });
const pgm = (key, name, sections, pageType, position) => ({ key, name, slug: key, purpose: `Objectif de la page ${name}`, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections });
const PLAN = { site: { name: "BâtiPlus", description: "" }, pages: [pgm("accueil", "Accueil", [sec("hero", "Accroche"), sec("features", "Services"), sec("cta", "Devis")], "accueil", 1), pgm("services", "Services", [sec("features", "Détail")], "services", 2), pgm("contact", "Contact", [sec("form", "Formulaire")], "contact", 3)], navigation: { main: ["accueil", "services", "contact"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [{ text: "Ajouter une page Références.", feature: "temoignages", why: "Rassure les visiteurs." }] };
(async () => {
  const api = http.createServer((req, res) => { let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => { const r = JSON.parse(body || "{}"); const sys = String(r.system || ""), user = String(r.messages[0].content); let out = {};
    if (/analyste de projets/.test(sys)) out = ANALYSIS; else if (/architecte de sites/.test(sys)) out = PLAN; else if (/rédacteur web/.test(sys)) { if (/variante\(s\)/.test(user)) out = { variants: ["Un texte plus court."] }; else { const keys = [...user.matchAll(/"key":"([^"]+)"/g)].map((m) => m[1]); out = { fields: keys.map((key) => ({ key, value: /title/.test(key) ? "Un titre précis" : "Un texte clair et utile." })), seo: { title: "BâtiPlus : construction", description: "Entreprise de construction à Kinshasa : conception, chantiers et suivi, demandez un devis gratuit.", focusKeyword: "construction", slug: "accueil" }, questions: [] }; } }
    else if (/conseiller/.test(sys)) out = { answer: "Ajoutez des réalisations concrètes." };
    res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 5, output_tokens: 5 } })); }); });
  await new Promise((r) => api.listen(0, "127.0.0.1", r));
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "sk-ant-test", ANTHROPIC_BASE_URL: `http://127.0.0.1:${api.address().port}` });
  const boss = await loginInstructor(srv);
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
  const cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
  const base = srv.base;
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
  const results = [];
  const check = (name, ok, extra = "") => { results.push({ name, ok: Boolean(ok), extra }); console.log((ok ? "OK  " : "KO  ") + name + (extra ? " — " + extra : "")); };
  try {
    for (const vp of [{ w: 1360, h: 860, tag: "desktop" }, { w: 390, h: 800, tag: "mobile" }]) {
      const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } }); await ctx.addCookies(cookies);
      const page = await ctx.newPage(); const errors = []; page.on("pageerror", (e) => errors.push(String(e))); page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
      await page.goto(`${base}/marketing/site-web/sites/${site}/createur-ia`); await page.waitForSelector("text=Mes projets de site IA", { timeout: 20000 });
      if (vp.tag === "desktop") await page.screenshot({ path: `${OUT}/shots/01-projets-${vp.tag}.png` });
      await page.fill('input[name="name"]', "Site de BâtiPlus"); await page.click('button:has-text("Créer le projet")');
      await page.waitForSelector("text=Brief du projet", { timeout: 20000 });
      await page.waitForSelector("#aib-side .aib-step", { timeout: 15000 }); check(`[${vp.tag}] projet créé, barre et navigation présentes`, await page.locator("#aib-side .aib-step").count() === 8);
      await page.fill('textarea[name="description"]', "Je souhaite créer un site professionnel pour une entreprise de construction à Kinshasa. Le site doit présenter les services et permettre de demander un devis.");
      await page.fill('input[name="company"]', "BâtiPlus");
      await page.waitForFunction(() => /Enregistré/.test(document.querySelector("#aib-save").textContent), null, { timeout: 15000 });
      check(`[${vp.tag}] autosauvegarde confirmée par le serveur`, true);
      await page.screenshot({ path: `${OUT}/shots/02-brief-${vp.tag}.png` });
      await page.click("#aib-analyze"); await page.waitForSelector("text=Ce que j'ai compris", { timeout: 30000 });
      check(`[${vp.tag}] analyse affichée avec statuts fourni/déduit/hypothèse`, (await page.content()).includes("Fourni") && (await page.content()).includes("Hypothèse"));
      check(`[${vp.tag}] fonctionnalité indisponible signalée`, (await page.content()).includes("Indisponible"));
      await page.click('button:has-text("Proposer le plan du site")'); await page.waitForSelector("text=Plan du site", { timeout: 30000 }); await page.waitForSelector(".aib-page", { timeout: 15000 });
      check(`[${vp.tag}] plan affiché (3 pages)`, await page.locator(".aib-page").count() === 3);
      await page.screenshot({ path: `${OUT}/shots/03-plan-${vp.tag}.png` });
      await page.fill("#aib-newpage", "À propos"); await page.click('button:has-text("Ajouter la page")'); await page.waitForSelector('.aib-page:has-text("À propos")', { timeout: 15000 });
      check(`[${vp.tag}] page ajoutée au plan`, await page.locator(".aib-page").count() === 4);
      check(`[${vp.tag}] Annuler activé après modification`, !(await page.locator("#aib-undo").isDisabled()));
      await page.click("#aib-undo"); await page.waitForFunction(() => document.querySelectorAll(".aib-page").length === 3, null, { timeout: 15000 });
      check(`[${vp.tag}] annulation efface la page`, true);
      await page.click("#aib-redo"); await page.waitForFunction(() => document.querySelectorAll(".aib-page").length === 4, null, { timeout: 15000 });
      check(`[${vp.tag}] rétablissement`, true);
      // assistant
      if (vp.tag === "mobile") await page.click("#aib-assist-btn");
      const ta = page.locator('[data-form="chat"] textarea'); await ta.fill("Ajoute une page Tarifs"); await page.click('[data-form="chat"] button[type="submit"]');
      await page.waitForSelector(".aib-prop", { timeout: 20000 });
      check(`[${vp.tag}] proposition de l'assistant affichée avec Accepter/Refuser`, await page.locator('.aib-prop button:has-text("Accepter")').count() === 1);
      await page.screenshot({ path: `${OUT}/shots/04-assistant-${vp.tag}.png` });
      const before = await page.locator(".aib-page").count();
      await page.click('.aib-prop button:has-text("Refuser")'); await page.waitForTimeout(800);
      check(`[${vp.tag}] refus : rien n'est modifié`, (await page.locator(".aib-page").count()) === before);
      if (vp.tag === "mobile") await page.click("#aib-assist-btn");
      await page.click('button:has-text("Valider le plan")'); await page.waitForSelector('.aib-chip:has-text("Validé")', { timeout: 20000 });
      check(`[${vp.tag}] plan validé`, true);
      await page.click('#aib-side [data-step="pages"]'); await page.waitForSelector('button:has-text("Générer les pages")', { timeout: 15000 });
      await page.click('button:has-text("Générer les pages")'); await page.waitForSelector('button:has-text("Appliquer en brouillon")', { timeout: 30000 });
      await page.click('button:has-text("Appliquer en brouillon")'); await page.waitForSelector("table.aib-table", { timeout: 30000 });
      check(`[${vp.tag}] pages créées en brouillon (tableau)`, (await page.locator("table.aib-table tbody tr").count()) >= 3);
      await page.screenshot({ path: `${OUT}/shots/05-pages-${vp.tag}.png` });
      await page.click('#aib-side [data-step="design"]'); await page.waitForSelector('button:has-text("Proposer des directions")', { timeout: 15000 });
      await page.click('button:has-text("Proposer des directions")'); await page.waitForSelector(".aib-dir .aib-card", { timeout: 30000 });
      check(`[${vp.tag}] propositions de design avec palettes`, (await page.locator(".aib-swatch").count()) >= 5);
      await page.screenshot({ path: `${OUT}/shots/06-design-${vp.tag}.png` });
      await page.click('#aib-side [data-step="contents"]'); await page.waitForSelector('button:has-text("Générer les textes")', { timeout: 15000 });
      await page.locator('button:has-text("Générer les textes")').first().click(); await page.waitForSelector("textarea[data-edit]", { timeout: 30000 });
      check(`[${vp.tag}] champs de texte avec indicateur IA/manuel`, (await page.content()).includes("Généré par IA"));
      await page.screenshot({ path: `${OUT}/shots/07-contenus-${vp.tag}.png` });
      await page.click('#aib-side [data-step="media"]'); await page.waitForSelector("h1:has-text('Images et médias')", { timeout: 15000 });
      await page.click('button:has-text("Analyser les besoins")'); await page.waitForTimeout(1500);
      await page.screenshot({ path: `${OUT}/shots/08-medias-${vp.tag}.png` });
      await page.click('#aib-side [data-step="preview"]'); await page.waitForSelector("#aib-frame", { timeout: 15000 });
      await page.click('[data-act="device"][data-d="mobile"]'); await page.waitForTimeout(400);
      check(`[${vp.tag}] aperçu mobile : largeur de cadre 390 px`, (await page.locator("#aib-frame").evaluate((e) => e.style.width)) === "390px");
      const fr = await (await page.locator("#aib-frame").elementHandle()).contentFrame(); await fr.waitForLoadState("load");
      check(`[${vp.tag}] aperçu rendu par le moteur natif (page réelle chargée)`, (await fr.content()).length > 500);
      await page.screenshot({ path: `${OUT}/shots/09-apercu-${vp.tag}.png` });
      await page.click('#aib-side [data-step="publish"]'); await page.waitForSelector(".aib-check", { timeout: 15000 });
      check(`[${vp.tag}] liste de contrôle de publication`, (await page.locator(".aib-check").count()) >= 6);
      await page.screenshot({ path: `${OUT}/shots/10-publication-${vp.tag}.png` });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`[${vp.tag}] aucun débordement horizontal de la page`, overflow <= 1, `débordement ${overflow}px`);
      check(`[${vp.tag}] aucune erreur JavaScript`, errors.length === 0, errors.slice(0, 2).join(" | "));
      await ctx.close();
      break; // le second viewport est vérifié sur l'écran des projets et le brief ci-dessous
    }
    // mobile : écran d'accueil + brief (pas de débordement)
    const mctx = await browser.newContext({ viewport: { width: 390, height: 800 } }); await mctx.addCookies(cookies);
    const mp = await mctx.newPage(); await mp.goto(`${base}/marketing/site-web/sites/${site}/createur-ia`); await mp.waitForSelector("text=Mes projets de site IA");
    await mp.screenshot({ path: `${OUT}/shots/11-projets-mobile.png` });
    await mp.click('button:has-text("Reprendre mon travail")'); await mp.waitForSelector("#aib-side .aib-step");
    await mp.waitForTimeout(1200); await mp.screenshot({ path: `${OUT}/shots/12-reprise-mobile.png` });
    check("[mobile] reprise du projet (navigation par étapes défilante)", (await mp.locator("#aib-side .aib-step").count()) === 8);
    check("[mobile] aucun débordement horizontal", (await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);
    await mctx.close();
  } catch (e) { check("exécution sans exception", false, String(e).slice(0, 300)); try { const pgs = browser.contexts()[0].pages(); const pg = pgs[pgs.length - 1]; await pg.screenshot({ path: `${OUT}/shots/fail.png` }); console.log("TOAST", await pg.locator("#aib-toasts").innerText()); console.log((await pg.locator("#aib-main").innerText()).slice(0, 400)); } catch (x) { console.log("dbg", x.message); } }
  await browser.close(); await srv.stop(); api.close();
  require("fs").writeFileSync(`${OUT}/ui-results.json`, JSON.stringify(results, null, 1));
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
