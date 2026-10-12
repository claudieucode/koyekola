// Sauvegarde, autosauvegarde, récupération et publication dans l'éditeur RÉEL (Chrome), avec un réseau que le test contrôle
// (réponses retardées, erreurs 500, session expirée) :
//   * « Publier » pendant un enregistrement en cours attend sa fin (sinon : ancienne version publiée ET conflit qui fait perdre la modification) ;
//   * une erreur n'est jamais présentée comme un succès, les essais reprennent seuls, la session expirée est expliquée ;
//   * fermer / recharger avant la confirmation : alerte puis reprise de la copie locale ;
//   * deux modifications rapprochées arrivent dans l'ordre ; annuler pendant un enregistrement est enregistré ;
//   * deux onglets : l'onglet périmé est bloqué sans écraser le plus récent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : persistance non exécutée sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, what = "condition" } = {}) { const end = Date.now() + timeout; for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(80); } }
const content = () => ({ title: "Persistance", sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: "Original", level: "2" } }] }] });

describe("persistance : sauvegarde, récupération, publication (Chrome réel, réseau contrôlé)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx, id, page, dialogs;
  let mode = "normal", delay = 0, puts = 0;
  const row = () => srv.db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const headingText = (json) => { const f = (l) => { for (const x of l || []) { if (x.id === "hed000000001") return x.props.text; const g = f(x.children); if (g) return g; } return null; }; const v = JSON.parse(json); return f(Array.isArray(v) ? v : v.sections); };
  const draftText = () => headingText(row().draft || row().sections);
  const publishedText = () => (row().sections ? headingText(row().sections) : null);
  const status = () => page.evaluate(() => document.querySelector("[data-pb-save]").textContent);
  const open = async (p = page) => {
    await p.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await p.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    await wait(900);
  };
  const edit = async (text, p = page) => {
    await p.locator('[data-pb-layers] .pb-node[data-id="hed000000001"] > .pb-row-item').click(); await wait(300);
    await p.locator("[data-pb-inspector] [role=tab]", { hasText: /^Contenu$/ }).click().catch(() => {}); await wait(200);
    const i = p.locator("[data-pb-inspector] input[type=text], [data-pb-inspector] textarea").first();
    await i.fill(text); await i.press("Tab");
  };
  const reset = async () => {
    mode = "normal"; delay = 0; puts = 0; dialogs.length = 0;
    srv.db().prepare("UPDATE mk_landing_pages SET status = 'draft', sections = '[]', draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(content()), id);
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await open();
  };
  const installRoute = async (p) => {
    await p.route(/\/brouillon$/, async (route) => {
      if (route.request().method() !== "PUT") return route.continue();
      puts++; if (delay) await wait(delay);
      if (mode === "500") return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "Erreur interne" } }) });
      if (mode === "401") return route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: { message: "Non connecté" } }) });
      return route.continue();
    });
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    id = Number((await boss.post("/marketing/pages", { name: "Persistance", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await ctx.newPage(); dialogs = [];
    page.on("dialog", async (d) => { dialogs.push(`${d.type()}: ${d.message()}`); await d.accept(); });
    await installRoute(page);
    await reset();
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("« Publier » pendant un enregistrement en cours attend sa fin : la page publiée contient la modification, aucun conflit, rien n'est perdu", async () => {
    await reset(); delay = 2500;
    await edit("Version publiée");
    await until(async () => (await status()) === "Enregistrement…", { what: "enregistrement en cours" });
    await page.locator("[data-pb-publish]").click();
    await until(() => publishedText() === "Version publiée", { timeout: 20000, what: "page publiée avec la modification" });
    assert.equal(row().status, "published");
    await wait(600);
    assert.doesNotMatch(await status(), /ailleurs|Erreur|Non enregistré/);
    assert.equal(puts, 1, "un seul enregistrement");
  });

  test("erreur 500 : jamais présentée comme enregistrée ; le brouillon du serveur reste intact ; les essais reprennent seuls et réussissent", async () => {
    await reset(); mode = "500";
    await edit("Après erreur");
    await until(async () => /Erreur d'enregistrement/.test(await status()), { what: "erreur annoncée" });
    assert.equal(draftText(), "Original", "le serveur n'a rien reçu");
    assert.doesNotMatch(await status(), /^Enregistré/);
    mode = "normal";
    await until(() => draftText() === "Après erreur", { timeout: 20000, what: "reprise automatique" });
    await until(async () => /^Enregistré à/.test(await status()), { what: "état enregistré" });
  });

  test("session expirée (401) : le message explique quoi faire ; l'enregistrement reprend dès que la session revient", async () => {
    await reset(); mode = "401";
    await edit("Après session");
    await until(async () => /Session expirée/.test(await status()), { what: "message de session" });
    assert.equal(draftText(), "Original");
    mode = "normal";
    await until(() => draftText() === "Après session", { timeout: 20000, what: "reprise après reconnexion" });
  });

  test("recharger avant la confirmation : alerte de fermeture, puis la copie locale est proposée et reprise ; elle s'enregistre ensuite", async () => {
    await reset(); mode = "500";
    await edit("Copie locale");
    await until(async () => /Erreur d'enregistrement/.test(await status()), { what: "échec d'enregistrement" });
    mode = "normal";
    await page.reload();
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
    assert.ok(dialogs.some((d) => /^beforeunload/.test(d)), "alerte de fermeture avec des modifications non enregistrées");
    assert.ok(dialogs.some((d) => /^confirm: Une copie non enregistrée/.test(d)), "copie locale proposée");
    await until(() => draftText() === "Copie locale", { timeout: 20000, what: "copie reprise puis enregistrée" });
  });

  test("deux modifications rapprochées avec une réponse lente : elles arrivent dans l'ordre, la dernière l'emporte, aucun conflit", async () => {
    await reset(); delay = 1800;
    await edit("Première");
    await until(async () => (await status()) === "Enregistrement…", { what: "première en vol" });
    await edit("Seconde");
    await until(() => draftText() === "Seconde", { timeout: 20000, what: "la seconde l'emporte" });
    await wait(800);
    assert.doesNotMatch(await status(), /ailleurs|Erreur/);
    assert.ok(puts >= 2, `deux enregistrements au moins (${puts})`);
  });

  test("annuler pendant un enregistrement : l'annulation est enregistrée à son tour, sans conflit", async () => {
    await reset(); delay = 1500;
    await edit("À annuler");
    await until(async () => (await status()) === "Enregistrement…", { what: "en vol" });
    await page.keyboard.press("Control+z");
    await until(() => draftText() === "Original" && puts >= 2, { timeout: 20000, what: "annulation enregistrée" });
    assert.doesNotMatch(await status(), /ailleurs|Erreur/);
  });

  test("deux onglets : l'onglet devenu périmé est bloqué avec un message, et n'écrase PAS la version la plus récente", async () => {
    await reset();
    const other = await ctx.newPage(); other.on("dialog", (d) => d.accept());
    await open(other);
    await edit("Onglet récent", other);
    await until(() => draftText() === "Onglet récent", { what: "onglet récent enregistré" });
    await edit("Onglet périmé");
    await until(async () => /modifiée ailleurs/.test(await status()), { what: "conflit annoncé" });
    assert.equal(draftText(), "Onglet récent", "la version la plus récente n'est pas écrasée");
    const backup = await page.evaluate((id) => localStorage.getItem(`pb-backup-${id}`), id);
    assert.ok(backup && backup.includes("Onglet périmé"), "le travail de l'onglet périmé est gardé localement");
    await other.close();
  });

  test("aperçu avec un enregistrement impossible : l'aperçu ne s'ouvre pas sur une ancienne version sans prévenir", async () => {
    await reset(); mode = "500";
    await edit("Jamais enregistrée");
    await until(async () => /Erreur d'enregistrement/.test(await status()), { what: "échec" });
    await page.locator("[data-pb-preview]").click();
    await wait(1200);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-preview-dialog]").open), false);
    assert.match(await page.locator("[data-pb-toast]").innerText(), /Aperçu non ouvert/);
    mode = "normal";
  });
});
