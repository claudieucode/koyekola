// KOLAKISA CMS — Utilisateurs d'un site dans un VRAI Chrome (Playwright, ignoré sans) : navigation par le menu, fiche (le bouton « Enregistrer » ne s'active qu'après un vrai changement, la base est relue),
// confirmation avant de retirer un accès, invitation envoyée UNE seule fois malgré le double clic, téléphone (390 px), mouvement réduit. Aucune erreur JavaScript.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("utilisateurs d'un site (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, errors, person;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const S = (screen) => `${srv.base}/marketing/site-web/sites/${A}/${screen}`;
  const open = async ({ width = 1280, reducedMotion = "no-preference" } = {}) => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width < 600, reducedMotion });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(org).lastInsertRowid);
    person = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'editor')").run(A, person.email);
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); });
  const pid = () => one("SELECT id FROM users WHERE email = ?", person.email).id;

  test("les cinq entrées du menu Utilisateurs ouvrent leur écran dans le cadre du site, sans erreur JavaScript", async () => {
    const page = await open(); await page.goto(S("tableau-de-bord"));
    const head = page.locator('[data-mk-group="utilisateurs"] > .mk-nav-head'); assert.equal(await head.getAttribute("aria-expanded"), "false", "groupe replié au départ");
    await head.click(); assert.equal(await head.getAttribute("aria-expanded"), "true"); await page.locator("#mk-sub-utilisateurs").waitFor({ state: "visible" });
    for (const [label, h1] of [["Tous les utilisateurs", "Utilisateurs"], ["Inviter", "Inviter quelqu'un"], ["Rôles", "Rôles"], ["Permissions", "Permissions"], ["Invitations", "Invitations"]]) {
      const link = page.locator("#mk-sub-utilisateurs a.mk-nav-sublink", { hasText: new RegExp(`^${label}$`) }); assert.equal(await link.count(), 1, label);
      await link.click(); await page.waitForFunction((t) => { const h = document.querySelector("h1"); return h && h.textContent.trim() === t; }, h1); assert.equal(await page.locator('#mk-sub-utilisateurs a[aria-current="page"]').innerText(), label);
    }
    assert.equal(errors.length, 0, errors.join("\n")); await page.context().close();
  });

  test("fiche : « Enregistrer le rôle » désactivé tant que rien ne change ; changement réel en base ; retrait annulable (confirmation)", async () => {
    const page = await open(); await page.goto(`${S("equipe")}?membre=${pid()}`);
    assert.equal(await page.locator("[data-su-save]").isDisabled(), true);
    await page.selectOption("#su-r", "viewer"); assert.equal(await page.locator("[data-su-save]").isDisabled(), false); assert.match(await page.locator("[data-su-state]").innerText(), /non enregistrée/);
    await Promise.all([page.waitForURL(/membre=/), page.click("[data-su-save]")]);
    assert.equal(one("SELECT role FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, pid()).role, "viewer", "rôle enregistré");
    assert.equal(await page.locator("#su-r").inputValue(), "viewer", "rechargé"); assert.match(await page.locator(".mk-flash").first().innerText(), /Rôle enregistré/);
    await page.click(".mk-su-remove button"); await page.locator("dialog.mk-dialog[open], .mk-dialog[open]").first().waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    assert.ok(one("SELECT 1 FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, pid()), "annulé : l'accès est conservé");
    assert.equal(errors.length, 0, errors.join("\n")); await page.context().close();
  });

  test("inviter : un double clic ne crée QU'UNE invitation ; le message dit la vérité (aucun serveur d'e-mail) et rien n'est annoncé « envoyé »", async () => {
    const page = await open(); await page.goto(S("equipe-inviter"));
    await page.fill("#iv-email", "double.clic@exemple.test"); await page.fill("#iv-name", "Dora"); await page.selectOption("#iv-role", "viewer");
    await Promise.all([page.waitForURL(/equipe-invitations/), page.dblclick("[data-us-send]")]);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = 'double.clic@exemple.test'").n, 1, "une seule invitation");
    const flash = await page.locator(".mk-flash").first().innerText(); assert.match(flash, /aucun serveur d.e-mail/i); assert.ok(!/est en file d.envoi/.test(flash));
    assert.match(await page.locator("tbody").innerText(), /double\.clic@exemple\.test/); assert.match(await page.locator("tbody").innerText(), /Échec d.envoi/);
    await page.goto(S("equipe-inviter")); await page.fill("#iv-email", "pas-une-adresse"); await page.click("[data-us-send]");
    assert.match(await page.locator("[data-us-state]").innerText(), /adresse e-mail valide/); assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = 'pas-une-adresse'").n, 0, "refusée côté navigateur ET serveur");
    assert.equal(errors.length, 0, errors.join("\n")); await page.context().close();
  });

  test("téléphone (390 px) : aucune des cinq pages ne défile horizontalement ; « mouvement réduit » coupe l'animation", async () => {
    const page = await open({ width: 390 });
    for (const u of ["equipe", `equipe?membre=${pid()}`, "equipe-inviter", "equipe-invitations", "equipe-roles", "equipe-permissions"]) { await page.goto(S(u)); assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${u} : pas de défilement horizontal`); }
    await page.context().close();
    const calm = await open({ reducedMotion: "reduce" }); await calm.goto(S("equipe-inviter"));
    assert.equal(await calm.evaluate(() => getComputedStyle(document.querySelector(".mk-us-form")).animationName), "none"); await calm.context().close();
    assert.equal(errors.length, 0, errors.join("\n"));
  });
});
