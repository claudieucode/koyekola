// Programme 21.8 — l'interface « Assistant IA » dans un VRAI Chrome : structure stable d'une étape à l'autre, navigation, modification du plan avec annulation, assistant (proposition acceptée),
// génération et aperçu des pages, perte de connexion expliquée puis reprise, clavier, anneau de focus fin, aucun débordement horizontal sur ordinateur / tablette / mobile, texte hostile inerte.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : npm install --no-save playwright-core
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
const ANALYSIS = { briefLanguage: "fr", name: fact(), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(), city: fact(), siteLanguage: fact(), audience: fact(), tone: fact(), formality: fact(), style: fact(), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "demander un devis" }], features: [{ key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "demander un devis", reason: "" }], pagesRequested: [], contradictions: [], missing: [], questions: [{ id: "q1", topic: "audience", question: "Qui sont vos clients principaux ?", why: "Pour adapter le ton.", blocking: false }] };
const sec = (type, purpose) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai" });
const pg = (key, name, sections, pageType, position) => ({ key, name, slug: key, purpose: name, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections });
const PLAN = { site: { name: "Construction", description: "" }, pages: [pg("accueil", "Accueil", [sec("hero", "Accroche"), sec("features", "Services"), sec("cta", "Devis")], "accueil", 1), pg("contact", "Contact", [sec("hero", "Titre"), sec("text", "Coordonnées")], "contact", 2)], navigation: { main: ["accueil", "contact"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [] };
const BRIEF = "Je veux un site pour mon entreprise de construction à Kinshasa, pour permettre aux clients de demander un devis.";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 120, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}

describe("Assistant IA (navigateur)", { skip: SKIP }, () => {
  let srv, boss, api, browser, context, page, errors, project, site;
  const U = (p = "") => `/marketing/ia/studio${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body === undefined ? {} : body });
  const stepBtn = (label) => page.locator(".aib-step").filter({ has: page.locator("strong", { hasText: new RegExp(`^${label}$`) }) });
  const status = (label) => stepBtn(label).locator(".aib-badge").innerText();
  const box = async (sel) => page.locator(sel).first().boundingBox();

  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}");
        const out = /analyste de projets/.test(String(r.system)) ? ANALYSIS : PLAN;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_t", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
    });
    await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "sk-ant-test-factice", ANTHROPIC_BASE_URL: `http://127.0.0.1:${api.address().port}` });
    boss = await loginInstructor(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post(`/marketing/site-web/sites/${site}/modules/ai`, { etat: "activer" });
    project = JSON.parse((await post(U("/projets"), { brief: BRIEF, siteId: site })).text).id;
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("dialog", (d) => { errors.push(`dialogue inattendu : ${d.message()}`); d.dismiss(); });
    await page.goto(`${srv.base}${U(`/${project}`)}?site=${site}`);
    await page.waitForSelector(".aib-step");
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); api.close(); });

  test("l'espace de travail affiche 8 étapes avec leur état réel, l'assistant et la barre supérieure ; aucune erreur de script", async () => {
    assert.equal(await page.locator(".aib-step").count(), 8);
    assert.equal(await status("Brief du projet"), "À vérifier", "une question est en attente");
    assert.equal(await status("Publication"), "Non commencé");
    assert.match(await page.locator("#aib-progress-t").innerText(), /0\/8/);
    for (const id of ["#aib-undo", "#aib-redo", "#aib-preview", "#aib-save-btn"]) assert.ok(await page.locator(id).isVisible(), id);
    assert.equal(await page.locator("#aib-publish").isVisible(), false, "Publier n'apparaît que lorsque les conditions sont réunies");
    assert.deepEqual(errors, []);
  });

  test("la structure reste stable : barre, navigation latérale et assistant ne bougent pas d'une étape à l'autre", async () => {
    const before = { top: await box(".aib-top"), nav: await box(".aib-steps"), assist: await box(".aib-assist") };
    for (const label of ["Plan du site", "Pages", "Design", "Contenus", "Images et médias", "Prévisualisation", "Publication", "Brief du projet"]) {
      await stepBtn(label).click();
      await until(async () => (await page.locator(".aib-pane h1").first().innerText()).length > 0, { what: label });
      const now = { top: await box(".aib-top"), nav: await box(".aib-steps"), assist: await box(".aib-assist") };
      assert.deepEqual(now, before, `la mise en page a bougé à l'étape « ${label} »`);
    }
    assert.equal(await page.locator('.aib-step[aria-current="step"]').count(), 1);
  });

  test("répondre aux questions puis créer le plan ; le plan s'affiche avec ses pages et sections", async () => {
    await stepBtn("Brief du projet").click();
    await page.locator("textarea[name=q1]").fill("Des particuliers et des entreprises.");
    await page.getByRole("button", { name: "Enregistrer mes réponses" }).click();
    await until(async () => (await page.locator("#aib-save-t").innerText()).startsWith("Enregistré"), { what: "réponses enregistrées" });
    await page.getByRole("button", { name: "Créer le plan du site" }).click();
    await page.waitForSelector(".aib-card h3");
    assert.equal(await page.locator(".aib-card h3 .aib-link", { hasText: "Accueil" }).count(), 1);
    assert.equal(await status("Plan du site"), "À vérifier"); assert.equal(await status("Brief du projet"), "Terminé");
  });

  test("renommer le site : mis à jour, enregistré, puis annulé et rétabli avec les boutons de la barre", async () => {
    await page.getByRole("button", { name: "Renommer le site" }).click();
    await page.locator("dialog input[name=name]").fill("BâtiPlus");
    await page.locator("dialog").getByRole("button", { name: "Renommer" }).click();
    await until(async () => (await page.locator("#aib-name").innerText()) === "BâtiPlus", { what: "nom mis à jour" });
    assert.match(await page.locator("#aib-save-t").innerText(), /^Enregistré à/);
    assert.equal(await page.locator("#aib-undo").isDisabled(), false);
    await page.locator("#aib-undo").click();
    await until(async () => (await page.locator("#aib-name").innerText()) !== "BâtiPlus", { what: "annulation" });
    assert.equal(await page.locator("#aib-redo").isDisabled(), false);
    await page.locator("#aib-redo").click();
    await until(async () => (await page.locator("#aib-name").innerText()) === "BâtiPlus", { what: "rétablissement" });
  });

  test("assistant : « Ajoute une page À propos » → proposition → Accepter → la page apparaît dans le plan ; un texte hostile reste inerte", async () => {
    await page.locator("#aib-chat-in").fill("Ajoute une page À propos");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForSelector(".aib-msgbox.is-proposal");
    assert.equal(await page.locator(".aib-card h3 .aib-link", { hasText: "À propos" }).count(), 0, "rien n'est modifié avant acceptation");
    await page.locator(".aib-msgbox.is-proposal").getByRole("button", { name: "Accepter" }).click();
    await until(async () => (await page.locator(".aib-card h3 .aib-link", { hasText: "À propos" }).count()) === 1, { what: "page ajoutée" });
    await page.locator("#aib-chat-in").fill("<img src=x onerror=alert(1)> Ajoute une page <script>window.__x=1</script>");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await until(async () => (await page.locator(".aib-msgbox.is-user").count()) >= 2, { what: "message envoyé" });
    assert.equal(await page.locator(".aib-chat img, .aib-chat script").count(), 0);
    assert.equal(await page.evaluate(() => window.__x), undefined);
    assert.deepEqual(errors, []);
  });

  test("valider le plan, générer puis appliquer les pages : brouillons créés, état de l'étape mis à jour, aperçu natif affiché", async () => {
    await stepBtn("Plan du site").click();
    await page.getByRole("button", { name: "Valider le plan" }).click();
    await until(async () => (await status("Plan du site")) === "Terminé", { what: "plan validé" });
    await stepBtn("Pages").click();
    await page.getByRole("button", { name: "Générer les pages" }).click();
    await page.getByRole("button", { name: "Appliquer en brouillon" }).waitFor();
    await page.getByRole("button", { name: "Appliquer en brouillon" }).click();
    await until(async () => (await page.locator(".aib-table .aib-badge", { hasText: "Brouillon" }).count()) >= 2, { what: "pages en brouillon" });
    assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'published'").get(site).n, 0);
    await stepBtn("Prévisualisation").click();
    const frame = page.locator("iframe.aib-frame");
    await frame.waitFor();
    assert.match(await frame.getAttribute("src"), /\/marketing\/pages\/\d+\/apercu$/);
    await page.getByRole("button", { name: "Mobile" }).click();
    await until(async () => (await box("iframe.aib-frame")).width <= 392, { what: "largeur mobile" });
    await page.getByRole("button", { name: "Ordinateur" }).click();
    await until(async () => (await box("iframe.aib-frame")).width > 700, { what: "largeur ordinateur" });
    const handle = await frame.elementHandle(); const inner = await handle.contentFrame();
    await until(async () => (await inner.content()).length > 500, { what: "page rendue dans le cadre" });
  });

  test("médias : analyse des besoins, génération « démonstration » avec coût annoncé puis acceptation ; publication : liste de contrôle lisible", async () => {
    await stepBtn("Images et médias").click();
    assert.match(await page.locator(".aib-msg.is-warn").first().innerText(), /démonstration|substitution|réel/i);
    await page.getByRole("button", { name: "Analyser les besoins visuels" }).click();
    await page.waitForSelector(".aib-card.is-missing");
    await page.locator(".aib-card.is-missing").first().getByRole("button", { name: "Générer", exact: true }).click();
    await page.locator("dialog select[name=provider]").selectOption("demo");
    await page.locator("dialog").getByRole("button", { name: "Voir le coût estimé" }).click();
    await page.locator("dialog").getByText(/Coût estimé/).waitFor();
    await page.locator("dialog").getByRole("button", { name: "Lancer la génération" }).click();
    const accept = page.locator("#aib-main").getByRole("button", { name: "Accepter" }).first();
    await accept.waitFor({ timeout: 20000 });
    await accept.click();
    await until(async () => (await page.locator(".aib-badge", { hasText: "En place" }).count()) >= 1, { what: "image en place" });
    await stepBtn("Publication").click();
    await page.waitForSelector(".aib-check li");
    assert.ok((await page.locator(".aib-check li").count()) >= 10);
    assert.match(await page.locator(".aib-check li", { hasText: "Version mobile" }).innerText(), /Non vérifiable automatiquement/);
  });

  test("perte de connexion : l'échec est annoncé, rien n'est faussement « enregistré », la reprise fonctionne", async () => {
    await stepBtn("Plan du site").click();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Renommer le site" }).click();
    await page.locator("dialog input[name=name]").fill("HorsLigne");
    await page.locator("dialog").getByRole("button", { name: "Renommer" }).click();
    await until(async () => /Connexion perdue/.test(await page.locator("#aib-banner").innerText()), { what: "bannière d'erreur de l'action" });
    assert.match(await page.locator("#aib-save-t").innerText(), /Échec|Hors connexion/);
    assert.notEqual(await page.locator("#aib-name").innerText(), "HorsLigne", "le nom n'est pas affiché comme enregistré");
    await context.setOffline(false);
    await page.locator("#aib-banner").getByRole("button", { name: "Réessayer" }).click();
    await until(async () => (await page.locator("#aib-name").innerText()) === "HorsLigne", { what: "reprise après coupure" });
  });

  test("clavier et focus : on atteint les étapes au clavier ; le focus reste sur l'étape après changement d'écran ; anneau fin (≤ 2 px), sans cadre épais", async () => {
    await stepBtn("Plan du site").focus();
    await page.keyboard.press("Tab"); await page.keyboard.press("Enter");
    const w = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { tag: el.tagName, key: el.dataset.key || "", style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), current: el.getAttribute("aria-current") }; });
    assert.equal(w.tag, "BUTTON", "le focus n'est pas perdu au redessin"); assert.equal(w.key, "pages"); assert.equal(w.current, "step");
    assert.notEqual(w.style, "none", "anneau de focus visible"); assert.ok(w.width <= 2, `anneau trop épais : ${w.width}px`);
    assert.equal(await page.locator('.aib-step[aria-current="step"]').count(), 1);
  });

  test("responsive : aucun débordement à 1440, 1024 et 390 px ; disposition adaptée (navigation à gauche, puis au-dessus) ; l'assistant ne masque pas le travail", async () => {
    for (const [width, height] of [[1440, 900], [1024, 768], [390, 800]]) {
      await page.setViewportSize({ width, height });
      await page.reload(); await page.waitForSelector(".aib-step");
      for (const label of ["Plan du site", "Pages", "Publication"]) {
        await stepBtn(label).scrollIntoViewIfNeeded(); await stepBtn(label).click();
        await wait(150);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(over <= 1, `débordement de ${over}px à ${width}px (étape ${label})`);
      }
      assert.ok(await page.locator(".aib-top").isVisible()); assert.ok(await page.locator("#aib-main").isVisible());
      const nav = await box(".aib-steps"), main = await box("#aib-main");
      if (width <= 760) { assert.ok(main.y >= nav.y + nav.height - 1, "mobile : la navigation passe AU-DESSUS du travail"); assert.ok(nav.width >= width - 2, "mobile : la navigation occupe la largeur"); }
      else assert.ok(main.x >= nav.x + nav.width - 1, "ordinateur / tablette : navigation à gauche du travail");
      if (width <= 1180) {
        assert.equal(await page.locator(".aib-assist").isVisible(), false, "écran étroit : assistant replié au départ");
        await page.locator("#aib-assist-btn").click(); assert.ok(await page.locator(".aib-assist").isVisible(), "le bouton Assistant l'ouvre");
        await page.locator("#aib-assist-btn").click(); assert.equal(await page.locator(".aib-assist").isVisible(), false);
      } else assert.ok(await page.locator(".aib-assist").isVisible(), "grand écran : assistant visible");
      // le badge d'état ne chevauche pas le titre d'une étape
      if (width > 760) for (const el of await page.locator(".aib-step").all()) { const t = await el.locator("strong").boundingBox(), bd = await el.locator(".aib-badge").boundingBox(); assert.ok(bd.y >= t.y + t.height - 1 || bd.x >= t.x + t.width - 1, "badge et titre ne se chevauchent pas"); }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => k.endsWith(".assist")).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignoré */ } });
  });

  test("accueil des projets : « Reprendre mon travail » mène au projet, avec progression réelle", async () => {
    await page.goto(`${srv.base}${U()}`);
    await page.waitForSelector(".aibh");
    assert.ok(await page.getByRole("link", { name: "Reprendre mon travail" }).isVisible());
    assert.match(await page.locator(".aibh-meta").first().innerText(), /\d+\/8 étapes terminées/);
    await page.getByRole("link", { name: "Reprendre mon travail" }).click();
    await page.waitForSelector(".aib-step");
    assert.deepEqual(errors, []);
  });
});
