// Comptes → Profil (VRAI Chrome) : composition (étiquette à gauche sur grand écran, empilée sur téléphone), hauteurs communes des champs et des boutons, sélecteur de thème,
// composant photo (aperçu, nom du fichier, refus lisible), indicateur de modifications, état de chargement, mouvement réduit, aucun débordement ni erreur de script.
// Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { setup, SKIP } = require("./header-aides");

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

describe("Comptes → Profil dans Chrome", { skip: SKIP }, () => {
  let env, context, page; const errors = [];
  const url = () => `${env.srv.base}/marketing/site-web/profil`;
  const open = async (w, h = 900) => { await page.setViewportSize({ width: w, height: h }); await page.goto(url()); await page.waitForSelector("[data-pf]"); await page.waitForTimeout(450); };
  const box = (sel) => page.locator(sel).first().boundingBox();

  before(async () => {
    env = await setup({ siteName: "Site profil" });
    context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([...env.boss.cookies].map(([name, value]) => ({ name, value, url: env.srv.base })));
    context.setDefaultTimeout(15000); page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  });
  after(async () => { if (context) await context.close(); if (env) await env.close(); });

  test("aucun débordement horizontal de 1900 à 390 px ; deux colonnes sur grand écran, une seule sur tablette et téléphone", async () => {
    for (const w of [1900, 1440, 1200, 820, 390]) {
      await open(w);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1), `${w} px : pas de défilement horizontal`);
      const cols = await page.evaluate(() => new Set([...document.querySelectorAll(".mk-pf-col")].map((c) => Math.round(c.getBoundingClientRect().left))).size);
      assert.equal(cols, w >= 1200 ? 2 : 1, `${w} px : ${w >= 1200 ? "deux colonnes" : "une colonne"}`);
    }
  });

  test("étiquette à gauche du champ quand la carte est large, au-dessus quand elle est étroite ; mêmes hauteurs partout", async () => {
    await open(1900);
    const lab = await box("label[for=pf-first]"), inp = await box("#pf-first");
    assert.ok(inp.x > lab.x + 100, "grand écran : champ à droite de l'étiquette");
    assert.ok(Math.abs((lab.y + 12) - inp.y) < 24, "même rangée");
    await open(390);
    const lab2 = await box("label[for=pf-first]"), inp2 = await box("#pf-first");
    assert.ok(inp2.y > lab2.y + lab2.height - 2 && Math.abs(inp2.x - lab2.x) < 4, "téléphone : étiquette au-dessus du champ, même alignement");
    await open(1900);
    const heights = await page.evaluate(() => ["#pf-first", "#pf-last", "#pf-nick", "#pf-display", "#pf-web", "#pf-email", "#pf-email-pwd"].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().height)));
    assert.deepEqual([...new Set(heights)], [44], `champs de même hauteur (${heights.join(", ")})`);
    const btn = await page.evaluate(() => [".mk-pf-inline .btn", "[data-pf-submit]", ".mk-pf-details > summary"].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().height)));
    assert.deepEqual([...new Set(btn)], [44], `boutons à la hauteur des champs (${btn.join(", ")})`);
  });

  test("thème : trois sélecteurs avec aperçu ; le choix actif se reconnaît (coche visible) et l'enregistrement est signalé comme en attente", async () => {
    await open(1440);
    assert.equal(await page.locator(".mk-pf-theme").count(), 3); assert.equal(await page.locator(".mk-pf-prev").count(), 3);
    const tick = (label) => page.locator(".mk-pf-theme", { hasText: label }).locator(".mk-pf-tick").evaluate((e) => +getComputedStyle(e).opacity);
    assert.equal(await tick("Automatique"), 1); assert.equal(await tick("Sombre"), 0);
    await page.locator(".mk-pf-theme", { hasText: "Sombre" }).click(); await page.waitForTimeout(300);
    assert.equal(await tick("Sombre"), 1); assert.equal(await tick("Automatique"), 0);
    assert.match(await page.locator("[data-pf-note]").innerText(), /non enregistrées/); assert.ok(await page.locator("[data-pf-save].is-dirty").count());
  });

  test("photo : aperçu immédiat, nom et poids du fichier, refus lisible d'un fichier qui n'est pas une image", async () => {
    await open(1440);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kw-pf-")); const ok = path.join(dir, "portrait.png"), bad = path.join(dir, "notes.txt");
    fs.writeFileSync(ok, PNG); fs.writeFileSync(bad, "pas une image");
    await page.setInputFiles("#pf-file", ok); await page.waitForTimeout(250);
    assert.match(await page.locator("[data-pf-filename]").innerText(), /portrait\.png/);
    assert.match(await page.locator("[data-pf-avatar-img]").getAttribute("src"), /^blob:/); assert.equal(await page.locator("[data-pf-avatar-img]").isVisible(), true);
    await page.setInputFiles("#pf-file", bad); await page.waitForTimeout(250);
    assert.match(await page.locator("[data-pf-file-error]").innerText(), /pas une image/); assert.equal(await page.locator("[data-pf-file]").evaluate((i) => i.files.length), 0, "le fichier refusé n'est pas retenu");
  });

  test("l'envoi met le bouton en chargement (une seule soumission) ; le clavier atteint le sélecteur de fichier avec un focus visible", async () => {
    await open(1440);
    await page.evaluate(() => { document.getElementById("pf-main").addEventListener("submit", (e) => e.preventDefault()); });
    await page.locator("[data-pf-submit]").click(); await page.waitForTimeout(100);
    assert.equal(await page.locator("[data-pf-submit]").getAttribute("aria-busy"), "true"); assert.ok(await page.locator("[data-pf-submit].is-loading").count()); assert.equal(await page.locator("[data-pf-submit]").isDisabled(), true);
    await open(1440); await page.locator("#pf-file").focus();
    assert.ok(await page.evaluate(() => getComputedStyle(document.querySelector(".mk-pf-file + label.btn")).boxShadow !== "none"), "focus visible sur « Choisir un fichier »");
  });

  test("mouvement réduit : plus d'animation sur les cartes ; en mouvement normal, elles apparaissent par fondu court (transform et opacité seulement)", async () => {
    await open(1440);
    const anim = () => page.locator(".mk-pf-card").first().evaluate((e) => ({ name: getComputedStyle(e).animationName, dur: getComputedStyle(e).animationDuration }));
    const normal = await anim(); assert.equal(normal.name, "pf-card-in"); assert.ok(parseFloat(normal.dur) * 1000 <= 260, `durée ≤ 260 ms (${normal.dur})`);
    await page.emulateMedia({ reducedMotion: "reduce" }); await page.reload(); await page.waitForSelector("[data-pf]");
    assert.equal((await anim()).name, "none"); await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("sessions en cartes (appareil, « cette session », ouverture, expiration) et aucune erreur de script pendant le parcours", async () => {
    await open(1440);
    const s = page.locator(".mk-pf-session.is-current"); assert.equal(await s.count(), 1);
    const txt = await s.innerText(); assert.match(txt, /cette session/i); assert.match(txt, /Expire le \d{2}\/\d{2}\/\d{4}/);
    assert.equal(await page.locator("body").evaluate((b) => (b.textContent.match(/cette session/g) || []).length), 1, "« cette session » apparaît une seule fois");
    assert.deepEqual(errors, [], "aucune erreur de script : " + errors.join(" | "));
  });
});
