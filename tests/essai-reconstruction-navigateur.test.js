// Essai de reconstruction dans un VRAI Chrome (Playwright) : page Sauvegardes, bouton, état de chargement, résultat, erreurs, retour, accès.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
// SHOT_DIR (facultatif) : dossier où enregistrer des captures d'écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const http = require("http");
// Petit relais qui retarde de 2 s la requête de l'essai (réseau lent) : la page reste réellement interactive pendant l'attente, comme chez un utilisateur
function slowProxy(targetBase, delayMs) {
  const target = new URL(targetBase);
  const server = http.createServer((req, res) => {
    const forward = () => {
      const up = http.request({ host: target.hostname, port: target.port, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
      up.on("error", () => res.destroy()); req.pipe(up);
    };
    const chunks = [];
    if (req.method === "POST" && /essai-reconstruction$/.test(req.url)) { req.pause(); setTimeout(() => { req.resume(); forward(); }, delayMs); } else forward();
    void chunks;
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ base: `http://127.0.0.1:${server.address().port}`, server, close: () => server.close() })));
}

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.SHOT_DIR || "";
const LIST = "/formateur/gestion/sauvegardes";

describe("essai de reconstruction : interface dans un navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, errors;
  const open = async (viewport = { width: 1280, height: 900 }, client = boss) => {
    const context = await browser.newContext({ viewport });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return { context, page };
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true }); } };
  const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const db = srv.db(); const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    for (let i = 0; i < 5; i++) db.prepare("INSERT INTO posts (slug, title, content, status, published) VALUES (?, ?, 'x', 'published', 1)").run("a" + i, "Article " + i);
    db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (?, 'F', 'f', 'ok')").run(org);
    errors = [];
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("page Sauvegardes : création d'une sauvegarde, bouton « Essai de reconstruction » visible, accessible et sans erreur", async () => {
    const { context, page } = await open();
    await page.goto(srv.base + LIST);
    await page.getByRole("button", { name: /Sauvegarder maintenant/ }).click();
    await page.waitForURL(srv.base + LIST);
    const btn = page.getByRole("button", { name: /Essai de reconstruction/ }).first();
    await btn.waitFor();
    assert.ok(await btn.isVisible() && await btn.isEnabled());
    assert.match(await btn.getAttribute("title"), /copie temporaire/);
    await btn.focus(); assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.tagName), "BUTTON", "le bouton est atteignable au clavier");
    assert.ok(await page.getByRole("heading", { name: /Essai de reconstruction \(préparation du palier 3\)/ }).isVisible());
    assert.ok(await noHScroll(page));
    await shot(page, "01-sauvegardes-bureau");
    await context.close();
  });

  test("petit écran (téléphone) : pas de défilement horizontal, bouton atteignable", async () => {
    const { context, page } = await open({ width: 375, height: 800 });
    await page.goto(srv.base + LIST);
    const btn = page.getByRole("button", { name: /Essai de reconstruction/ }).first();
    await btn.scrollIntoViewIfNeeded(); assert.ok(await btn.isVisible());
    const box = await btn.boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= 376, `bouton dans l'écran (${JSON.stringify(box)})`);
    assert.ok(await noHScroll(page), "pas de défilement horizontal à 375 px");
    await shot(page, "02-sauvegardes-mobile");
    await context.close();
  });

  test("clic : état de chargement visible pendant l'essai (boutons désactivés + message), puis résultat conforme, puis retour aux sauvegardes", async () => {
    const proxy = await slowProxy(srv.base, 2500);
    let context;
    try {
    context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name]) => ({ name, value: boss.cookies.get(name), url: proxy.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    // Pendant qu'une navigation est en attente, Playwright n'exécute plus de script dans la page : l'état est donc relevé par la page elle-même, 100 ms après l'envoi
    // (écouteur posé avant celui de la page), conservé dans sessionStorage, puis relu sur la page de résultat. Une capture réelle est prise pendant l'attente (CDP).
    await context.addInitScript(() => {
      document.addEventListener("submit", () => setTimeout(() => {
        const e = document.getElementById("essai-etat"), bs = [...document.querySelectorAll("[data-essai-form] button")];
        const r = e ? e.getBoundingClientRect() : { top: -1, height: 0 };
        sessionStorage.setItem("essai-etat-capture", JSON.stringify({ texte: e && e.textContent, visible: Boolean(e && e.offsetParent !== null && r.height > 0), dansEcran: r.top >= 0 && r.top < window.innerHeight, desactives: bs.filter((b) => b.disabled).length, total: bs.length, libelles: bs.filter((b) => /en cours/.test(b.textContent)).length }));
      }, 100), true);
    });
    await page.goto(proxy.base + LIST);
    await page.getByRole("button", { name: /Essai de reconstruction/ }).first().click({ noWaitAfter: true });
    await new Promise((r) => setTimeout(r, 1000));
    const cdp = await context.newCDPSession(page);
    const during = await cdp.send("Page.captureScreenshot", { format: "png" });
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, "03-chargement.png"), Buffer.from(during.data, "base64")); }
    assert.ok(during.data.length > 1000, "capture réelle de la page pendant l'attente");
    await page.getByRole("heading", { name: "Essai de reconstruction", level: 1 }).waitFor({ timeout: 60000 });
    assert.match(await page.locator(".g-flash").first().innerText(), /Essai conforme/);
    const loading = JSON.parse(await page.evaluate(() => sessionStorage.getItem("essai-etat-capture")));
    assert.match(loading.texte, /Essai en cours sur une copie temporaire/); assert.equal(loading.visible, true, "le message est visible"); assert.equal(loading.dansEcran, true, "le message est dans l'écran (pas caché sous la ligne de flottaison)");
    assert.equal(loading.desactives, loading.total, "tous les boutons d'essai sont désactivés pendant l'essai"); assert.ok(loading.total >= 2); assert.equal(loading.libelles, 1, "le bouton cliqué annonce « Essai en cours… »");
    for (const t of ["posts", "taxonomy_terms", "mk_forms", "mk_page_templates"]) assert.ok(await page.getByRole("cell", { name: t, exact: true }).isVisible(), t);
    assert.ok(await page.getByText("Aucune.").first().isVisible(), "aucune différence inexpliquée");
    assert.equal(await page.getByText("✖").count(), 0);
    assert.match(await page.locator("body").innerText(), /Dossier temporaire supprimé : oui · verrou libéré : oui/);
    assert.ok(await noHScroll(page));
    await shot(page, "04-resultat-bureau");
    await page.setViewportSize({ width: 375, height: 800 }); assert.ok(await noHScroll(page), "résultat lisible sur téléphone"); await shot(page, "05-resultat-mobile");
    await page.getByRole("link", { name: /Retour aux sauvegardes/ }).first().click();
    await page.waitForURL(proxy.base + LIST);
    assert.ok(await page.getByRole("button", { name: /Essai de reconstruction/ }).first().isEnabled(), "les boutons sont de nouveau actifs après le retour");
    } finally { if (context) await context.close(); proxy.close(); proxy.server.closeAllConnections(); }
  });

  test("actualiser la page de résultat ne relance rien d'inattendu (le GET renvoie aux sauvegardes)", async () => {
    const { context, page } = await open();
    const res = await page.goto(srv.base + LIST + "/essai-reconstruction");
    assert.equal(new URL(page.url()).pathname, LIST); assert.ok(res.ok());
    await context.close();
  });

  test("deux onglets en même temps : un seul essai, l'autre affiche le message « déjà en cours » dans la page Sauvegardes", async () => {
    const a = await open(), b = await open();
    await a.page.goto(srv.base + LIST); await b.page.goto(srv.base + LIST);
    await a.page.getByRole("button", { name: /Essai de reconstruction/ }).first().click({ noWaitAfter: true });
    await new Promise((r) => setTimeout(r, 400));
    await b.page.getByRole("button", { name: /Essai de reconstruction/ }).first().click({ noWaitAfter: true });
    await b.page.waitForURL(srv.base + LIST, { timeout: 60000 });
    await b.page.waitForSelector(".g-flash", { timeout: 10000 });
    assert.match(await b.page.locator(".g-flash").first().innerText(), /déjà en cours/);
    await shot(b.page, "06-deja-en-cours");
    await a.page.getByRole("heading", { name: "Essai de reconstruction", level: 1 }).waitFor({ timeout: 60000 });
    assert.match(await a.page.locator(".g-flash").first().innerText(), /Essai conforme/);
    await a.context.close(); await b.context.close();
  });

  test("erreur : sauvegarde inconnue → page « Introuvable » avec retour, aucun essai lancé", async () => {
    const { context, page } = await open();
    await page.goto(srv.base + LIST);
    const status = await page.evaluate(async () => { const r = await fetch("/formateur/gestion/sauvegardes/essai-reconstruction", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "source=inconnue.db" }); return r.status; });
    assert.equal(status, 404);
    const root = path.join(srv.dir, "data", "essais-temporaires"); assert.deepEqual(fs.readdirSync(root), []);
    await context.close();
  });

  test("droits : visiteur renvoyé vers la connexion, élève refusé", async () => {
    const anon = await browser.newContext(); const p = await anon.newPage();
    await p.goto(srv.base + LIST); assert.match(new URL(p.url()).pathname, /connexion/);
    const student = await newStudent(srv); const { context, page } = await open({ width: 1280, height: 900 }, student);
    const res = await page.goto(srv.base + LIST);
    assert.ok(res.status() >= 300 || !/Essai de reconstruction/.test(await page.content()), "l'élève ne voit pas l'outil");
    assert.equal(await page.getByRole("button", { name: /Essai de reconstruction/ }).count(), 0);
    await anon.close(); await context.close();
  });

  test("aucune erreur JavaScript ni de console pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
