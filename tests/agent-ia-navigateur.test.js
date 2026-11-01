// Assistant IA dans un VRAI Chrome (Playwright) : bouton de lancement, aucune requête tiers avant le clic, chargement du widget et de sa configuration,
// conversation texte avec l'agent réel, aucune erreur JavaScript, affichage mobile. Ignoré, avec la raison, sans Playwright, Chrome ou accès à ElevenLabs.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer } = require("./helpers");
const agentIa = require("../src/config/agentIa");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : assistant non exécuté dans un navigateur sur cette machine" : false;
const SHOTS = process.env.AGENT_SHOTS || "";
const THIRD = /(unpkg\.com|elevenlabs\.io|elevenlabs\.com)/;

describe("Assistant IA dans un navigateur réel", { skip: SKIP }, () => {
  let srv, browser, online = true; const errors = [];
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  const open = async (viewport) => {
    const context = await browser.newContext({ viewport, permissions: ["microphone"] });
    const page = await context.newPage(); const thirdBefore = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("request", (r) => { if (THIRD.test(r.url())) thirdBefore.push(r.url()); });
    return { context, page, thirdBefore };
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
    try { const r = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentIa.agentId()}/widget`); online = r.ok; } catch { online = false; }
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("bouton visible, rien chez un tiers avant le clic, puis widget et configuration chargés", async (t) => {
    if (!online) return t.skip("ElevenLabs injoignable");
    const { context, page, thirdBefore } = await open({ width: 1280, height: 800 });
    await page.goto(srv.base + "/");
    const btn = page.locator("[data-kb-agent-open]");
    await btn.waitFor();
    assert.match(await btn.innerText(), /Poser une question/);
    assert.ok((await btn.boundingBox()).height >= 44, "cible tactile ≥ 44 px");
    await page.waitForTimeout(1500);
    assert.deepEqual(thirdBefore, [], "aucune requête vers un tiers avant le clic");
    await shot(page, "1-bouton");
    const cfg = page.waitForResponse((r) => /\/convai\/agents\/agent_[^/]+\/widget/.test(r.url()), { timeout: 30000 });
    await btn.click();
    await page.waitForSelector("elevenlabs-convai", { timeout: 30000 });
    assert.equal((await cfg).status(), 200, "configuration du widget chargée");
    await page.getByRole("button", { name: /Accepter et continuer/ }).waitFor({ timeout: 20000 });
    assert.equal(await page.locator("[data-kb-agent-open]").isVisible(), false, "le bouton de lancement cède la place au widget");
    await shot(page, "2-conditions");
    await context.close();
  });

  test("conversation texte avec l'agent réel (réponse tirée de la base) puis aucune erreur JavaScript", async (t) => {
    if (!online) return t.skip("ElevenLabs injoignable");
    const { context, page } = await open({ width: 1280, height: 800 });
    await page.goto(srv.base + "/");
    await page.click("[data-kb-agent-open]");
    await page.getByRole("button", { name: /Accepter et continuer/ }).click({ timeout: 30000 });
    const box = page.getByRole("textbox", { name: /Votre message/ });
    await box.fill("Combien coûte la formation Figma ?");
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.waitForFunction(() => /24,99|vingt-quatre/.test(document.querySelector("elevenlabs-convai").shadowRoot.textContent), null, { timeout: 60000 });
    await shot(page, "3-reponse");
    await context.close();
  });

  test("mobile (390 px) : le bouton tient dans l'écran, aucun défilement horizontal, widget contenu", async (t) => {
    if (!online) return t.skip("ElevenLabs injoignable");
    const { context, page } = await open({ width: 390, height: 780 });
    await page.goto(srv.base + "/");
    const btn = page.locator("[data-kb-agent-open]"); await btn.waitFor();
    const b = await btn.boundingBox();
    assert.ok(b.x >= 0 && b.x + b.width <= 390 && b.y >= 0 && b.y + b.height <= 780, "bouton dans l'écran");
    await shot(page, "4-mobile-bouton");
    await btn.click(); await page.waitForSelector("elevenlabs-convai", { timeout: 30000 });
    await page.getByRole("button", { name: /Accepter et continuer/ }).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: /Accepter et continuer/ }).click();
    await page.getByRole("textbox", { name: /Votre message/ }).waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "pas de défilement horizontal");
    const panel = await page.evaluate(() => { const r = document.querySelector("elevenlabs-convai").shadowRoot.querySelector("textarea").getBoundingClientRect(); return { l: r.left, r: r.right }; });
    assert.ok(panel.l >= 0 && panel.r <= 390, "zone de saisie dans l'écran");
    await shot(page, "5-mobile-widget");
    await context.close();
  });

  test("aucune erreur JavaScript ni de console", () => { assert.deepEqual(errors, []); });
});
