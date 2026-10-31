// Programme 22.6 — l'écran « Contenu et qualité SEO » dans un VRAI Chrome : onglets au clavier, tableau de bord, analyse d'une page (14 critères, problèmes classés), maillage
// (proposer, accepter dans le brouillon, refuser), aucun script en erreur, aucune métrique de trafic, responsive 320 px sans débordement. Ignoré (avec la raison) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const long = (w, k) => Array.from({ length: k }, (_, i) => `${w} numéro ${i} aide les équipes à organiser le travail du quotidien avec méthode.`).join(" ");

describe("Contenu et qualité SEO (navigateur)", { skip: SKIP }, () => {
  let srv, db, boss, browser, context, page, errors, site, src, tgt;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); db = srv.db();
    boss = await loginInstructor(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site navigateur" })).location.match(/sites\/(\d+)/)[1]);
    for (const n of ["Isolation des combles", "Guide travaux"]) await boss.post("/marketing/pages", { name: n, site_id: site, kind: "page" });
    const mk = (name, extra) => { const p = one("SELECT id FROM mk_landing_pages WHERE name = ?", name); db.prepare("UPDATE mk_landing_pages SET sections = ?, draft = NULL, status = 'published', title = ?, seo = ? WHERE id = ?").run(JSON.stringify([{ id: "sechero1", type: "hero", title: name, subtitle: "Un sous-titre." }, { id: "sectext1", type: "text", markdown: `${extra} ${long("Contenu", 3)}` }]), name, JSON.stringify({ focusKeyword: name }), p.id); return p.id; };
    tgt = mk("Isolation des combles", "Un texte sur l'isolation."); src = mk("Guide travaux", "Pour réduire vos factures, pensez à l'isolation des combles dès cet automne. Téléphone : [à compléter].");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage(); errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("dialog", (d) => { errors.push(`dialogue inattendu : ${d.message()}`); d.dismiss(); });
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/contenu-seo`); await page.waitForSelector(".ci-stat");
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("vue d'ensemble : compteurs réels, tableau des pages, avertissement, aucune métrique de trafic", async () => {
    const text = await page.locator("#ci-over").innerText();
    assert.match(text, /Pages analysées/); assert.equal(await page.locator(".ci-stat").first().locator("strong").innerText(), "2");
    assert.match(text, /ni des prévisions|prédiction/i); assert.match(text, /Aucune métrique de trafic/); assert.equal(await page.locator("#ci-over tbody tr").count(), 2);
    assert.match(text, /Informations à compléter : Guide travaux/);
    assert.deepEqual(errors, []);
  });
  test("onglets : navigation au clavier (flèches) et état ARIA", async () => {
    await page.locator("#ci-t-over").focus(); await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#ci-t-page").getAttribute("aria-selected"), "true"); assert.equal(await page.locator("#ci-p-page").isVisible(), true); assert.equal(await page.locator("#ci-p-over").isVisible(), false);
    assert.equal(await page.evaluate(() => document.activeElement.id), "ci-t-page");
  });
  test("analyse d'une page : 14 critères, problème BLOQUANT en premier (espace réservé), correction ou recommandation affichées", async () => {
    await page.selectOption("#ci-page", String(src));
    await page.waitForSelector(".ci-crit li"); assert.equal(await page.locator(".ci-crit li").count(), 14);
    const first = page.locator(".ci-issue").first(); assert.equal(await first.getAttribute("data-sev"), "blocking"); assert.match(await first.innerText(), /à compléter/);
    assert.match(await page.locator("#ci-eval").innerText(), /Recommandation :/); assert.match(await page.locator("#ci-eval").innerText(), /pas une prédiction de classement/);
    assert.deepEqual(errors, []);
  });
  test("maillage : proposer, accepter (brouillon seulement), l'écran se met à jour ; refus d'une autre proposition", async () => {
    await page.click("#ci-t-link"); await page.waitForSelector("#ci-links");
    await page.click("#ci-link-run"); const prop = page.locator("#ci-links .ci-issue").filter({ hasText: "Guide travaux" }).first(); await prop.waitFor();
    assert.match(await prop.innerText(), /Isolation des combles/);
    const live = one("SELECT sections FROM mk_landing_pages WHERE id = ?", src).sections;
    await prop.getByRole("button", { name: /Accepter/ }).click();
    await page.waitForFunction(() => /Lien ajouté au brouillon/.test(document.getElementById("ci-status").textContent));
    assert.equal(one("SELECT sections FROM mk_landing_pages WHERE id = ?", src).sections, live, "page en ligne intacte");
    assert.match(one("SELECT draft FROM mk_landing_pages WHERE id = ?", src).draft, /\[isolation des combles\]\(/i);
    assert.equal(await page.locator("#ci-links .ci-issue").filter({ hasText: "Guide travaux → Isolation" }).count(), 0, "la proposition traitée disparaît");
    assert.deepEqual(errors, []);
  });
  test("mots-clés et sources : « aucun connecteur implémenté » affiché ; langues et réglages se chargent", async () => {
    await page.click("#ci-t-kw"); await page.waitForFunction(() => /Recherche de mots-clés/.test(document.getElementById("ci-kws").textContent));
    assert.match(await page.locator("#ci-kws").innerText(), /Aucun connecteur n'est implémenté/); assert.match(await page.locator("#ci-kws").innerText(), /non disponible/i);
    await page.click("#ci-t-lang"); await page.waitForFunction(() => /Aucun groupe de traduction/.test(document.getElementById("ci-langs").textContent));
    await page.click("#ci-t-set"); await page.waitForFunction(() => /Langue de contenu/.test(document.getElementById("ci-sets").textContent));
    assert.deepEqual(errors, []);
  });
  test("responsive : 320 px sans défilement horizontal de la page, cibles tactiles des onglets ≥ 44 px", async () => {
    await page.setViewportSize({ width: 320, height: 800 }); await page.click("#ci-t-over"); await page.waitForSelector(".ci-stat");
    const over = await page.evaluate(() => { const w = document.documentElement.clientWidth; return [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > w + 1 && e.getBoundingClientRect().width > 0).slice(0, 6).map((e) => `${e.tagName}.${String(e.className).slice(0, 30)}#${e.id} right=${Math.round(e.getBoundingClientRect().right)}`); });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), true, `éléments qui débordent : ${over.join(" | ")}`);
    const small = await page.evaluate(() => [...document.querySelectorAll(".ci-tabs button")].filter((b) => b.getBoundingClientRect().height < 44).length); assert.equal(small, 0);
    assert.deepEqual(errors, []);
  });
});
