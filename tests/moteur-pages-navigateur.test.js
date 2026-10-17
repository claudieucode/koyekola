// MP — formulaire « Déplacer » de la liste des pages dans un VRAI navigateur (Chrome via Playwright, vrai serveur, vraie base d'essai) :
// affichage, dimensions, adaptation à une fenêtre étroite, confirmation, déplacement réel, destination invalide / non autorisée, page à la corbeille.
// Captures d'écran écrites seulement si MP_SHOTS=<dossier> est défini. Ignoré (avec message) si Playwright ou Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : contrôle visuel non exécuté sur cette machine" : false;
const SHOTS = process.env.MP_SHOTS || "";

describe("formulaire « Déplacer » (navigateur réel)", { skip: SKIP }, () => {
  let srv, boss, db, browser, context, page, A, B, errors;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const shot = async (name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); } };
  const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, ?, ?, '{}')").run(name, name.toLowerCase()).lastInsertRowid);
  async function mkPage(name, site) {
    const r = await boss.post("/marketing/pages", { name, template: "", site_id: String(site) });
    return Number(String(r.location).match(/pages\/(\d+)/)[1]);
  }
  const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
  const menuOf = (id) => page.locator(`tr:has(a[href="/marketing/pages/${id}"]) .mk-cms-more, li:has(a[href="/marketing/pages/${id}"]) .mk-cms-more`).first();
  async function openList(query = "") {
    await page.goto(`${srv.base}/marketing/pages${query}`);
    await page.waitForLoadState("domcontentloaded");
  }
  async function openMenu(id) {
    const btn = page.locator(`button.mk-cms-more[aria-label$="« ${row(id).name} »"]`).first();
    await btn.click();
    const menu = page.locator(`#${await btn.getAttribute("aria-controls")}`);
    await menu.waitFor({ state: "visible" });
    await page.waitForTimeout(500); // fin de l'animation d'ouverture (la mesure et la capture portent sur le menu stabilisé)
    return menu;
  }
  const dialogOpen = () => page.locator("dialog[open]").first();
  const confirmYes = async () => { const d = dialogOpen(); await d.waitFor({ state: "visible", timeout: 5000 }); await d.locator(".mk-dialog-actions button").last().click(); };
  const confirmNo = async () => { const d = dialogOpen(); await d.waitFor({ state: "visible", timeout: 5000 }); await d.locator(".mk-dialog-actions button").first().click(); };
  const body = async () => (await page.locator("body").innerText());
  const geometry = (menu) => menu.evaluate((el) => {
    const r = el.getBoundingClientRect(), f = el.querySelector(".mk-cms-move"), fr = f.getBoundingClientRect();
    const sel = f.querySelector("select").getBoundingClientRect(), btn = f.querySelector("button").getBoundingClientRect();
    return { vw: innerWidth, docW: document.documentElement.scrollWidth, menu: { l: r.left, r: r.right, w: r.width }, form: { l: fr.left, r: fr.right, w: fr.width, h: fr.height }, select: { l: sel.left, r: sel.right, w: sel.width, h: sel.height }, btn: { l: btn.left, r: btn.right, w: btn.width, h: btn.height },
      font: getComputedStyle(f.querySelector("select")).fontSize, color: getComputedStyle(f.querySelector("select")).color, bg: getComputedStyle(f.querySelector("select")).backgroundColor, btnFont: getComputedStyle(f.querySelector("button")).fontSize };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = mkSite("Alpha"); B = mkSite("Beta");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`script : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console : ${m.text().slice(0, 160)}`); });
    // Les fenêtres de confirmation natives sont acceptées explicitement dans chaque test qui les attend
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("bureau : le formulaire est visible dans le menu de la ligne, aligné, lisible, dans la fenêtre, sans débordement ni erreur de script", async () => {
    const id = await mkPage("Page à voir", A);
    await openList();
    const menu = await openMenu(id);
    await shot("01-bureau-menu");
    const g = await geometry(menu);
    assert.ok(g.form.l >= g.menu.l - 1 && g.form.r <= g.menu.r + 1, `le formulaire sort du menu : ${JSON.stringify(g)}`);
    assert.ok(g.menu.l >= 0 && g.menu.r <= g.vw, `le menu sort de la fenêtre : ${JSON.stringify(g.menu)}`);
    assert.ok(g.docW <= g.vw, "pas de défilement horizontal de la page");
    assert.ok(g.select.r <= g.form.r + 1 && g.btn.r <= g.form.r + 1, `contrôles hors du formulaire : ${JSON.stringify(g)}`);
    assert.ok(g.select.h >= 24 && g.btn.h >= 24, `contrôles trop petits (select ${g.select.h}px, bouton ${g.btn.h}px)`);
    assert.ok(parseFloat(g.font) >= 12, `texte trop petit : ${g.font}`);
    const labels = await menu.locator(".mk-cms-move label").innerText();
    assert.match(labels, /Déplacer « Page à voir » vers/);
    const opts = await menu.locator(".mk-cms-move select option").allInnerTexts();
    assert.ok(opts.includes("Beta") && opts.includes("Aucun site (site principal)") && !opts.includes("Alpha"), `options : ${opts}`);
    assert.deepEqual(errors, []);
  });

  test("fenêtre réduite (390 px) : le menu et le formulaire restent dans l'écran et utilisables", async () => {
    const id = await mkPage("Page étroite", A);
    await page.setViewportSize({ width: 390, height: 800 });
    await openList();
    const menu = await openMenu(id);
    await shot("02-mobile-menu");
    const g = await geometry(menu);
    assert.ok(g.menu.l >= -1 && g.menu.r <= g.vw + 1, `le menu sort de l'écran étroit : ${JSON.stringify(g.menu)} (fenêtre ${g.vw})`);
    assert.ok(g.form.r <= g.vw + 1 && g.select.r <= g.vw + 1 && g.btn.r <= g.vw + 1, `le formulaire sort de l'écran étroit : ${JSON.stringify(g)}`);
    assert.ok(g.docW <= g.vw + 1, `défilement horizontal de la page (${g.docW} > ${g.vw})`);
    assert.ok(g.btn.w >= 24 && g.select.w >= 80, `contrôles trop étroits : select ${g.select.w}px, bouton ${g.btn.w}px`);
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("déplacement autorisé : demande de confirmation (annulable), puis la page change réellement de site et le message l'annonce", async () => {
    const id = await mkPage("Page voyageuse", A);
    await openList();
    let menu = await openMenu(id);
    await menu.locator(".mk-cms-move select").selectOption(String(B));
    // Annuler la confirmation : rien ne bouge
    await menu.locator(".mk-cms-move button").click();
    await dialogOpen().waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(500);
    await shot("03-confirmation");
    const txt = await dialogOpen().innerText();
    assert.match(txt, /Déplacer cette page \?/); assert.match(txt, /changera de site/);
    assert.equal(await dialogOpen().locator(".mk-dialog-actions button").last().innerText(), "Déplacer");
    await confirmNo();
    assert.equal(row(id).site_id, A, "annuler la confirmation ne déplace rien");
    // Confirmer
    menu = await openMenu(id);
    await menu.locator(".mk-cms-move select").selectOption(String(B));
    await menu.locator(".mk-cms-move button").click();
    await confirmYes();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForFunction((pid) => location.pathname === `/marketing/pages/${pid}` || location.pathname === "/marketing/pages", id, { timeout: 8000 });
    assert.equal(row(id).site_id, B, "la page est dans le site Beta");
    assert.match(await body(), /déplacée/);
    await shot("04-apres-deplacement");
    assert.deepEqual(errors, []);
  });

  test("destination invalide ou inconnue (formulaire altéré) : refusée avec un message, la page ne bouge pas", async () => {
    const id = await mkPage("Page garde", A);
    for (const bad of ["abc", "999999"]) {
      await openList();
      const menu = await openMenu(id);
      await menu.locator(".mk-cms-move select").evaluate((s, v) => { const o = document.createElement("option"); o.value = v; o.textContent = "altérée"; s.appendChild(o); s.value = v; }, bad);
      await menu.locator(".mk-cms-move button").click();
      await confirmYes();
      await page.waitForLoadState("domcontentloaded");
      assert.equal(row(id).site_id, A, `destination « ${bad} » : la page ne doit pas bouger`);
      assert.match(await body(), /Site de destination invalide|introuvable|Site/i, `un message explique le refus (« ${bad} »)`);
    }
    await shot("05-destination-invalide");
  });

  test("destination non autorisée (site archivé, droit refusé) : refusée avec un message, la page ne bouge pas", async () => {
    const id = await mkPage("Page protégée", A);
    const frozen = mkSite("Gelé");
    await openList();
    const menu = await openMenu(id);
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(frozen);
    await menu.locator(".mk-cms-move select").evaluate((s, v) => { const o = document.createElement("option"); o.value = v; o.textContent = "Gelé"; s.appendChild(o); s.value = v; }, String(frozen));
    await menu.locator(".mk-cms-move button").click();
    await confirmYes();
    await page.waitForLoadState("domcontentloaded");
    assert.equal(row(id).site_id, A);
    assert.match(await body(), /destination|archivé|écrire/i);
    await shot("06-destination-refusee");
  });

  test("page à la corbeille : aucun formulaire « Déplacer » dans la vue Corbeille, et le serveur refuse aussi un envoi forcé", async () => {
    const id = await mkPage("Page en corbeille", A);
    await boss.post(`/marketing/pages/${id}/archiver`, {});
    await openList("?etat=corbeille");
    const btn = page.locator(`button.mk-cms-more[aria-label$="« Page en corbeille »"]`).first();
    await btn.click();
    const menu = page.locator(`#${await btn.getAttribute("aria-controls")}`);
    await menu.waitFor({ state: "visible" });
    await shot("07-corbeille");
    assert.equal(await menu.locator(".mk-cms-move").count(), 0, "pas de formulaire de déplacement dans la corbeille");
    const status = await page.evaluate(async ({ pid, site }) => { const r = await fetch(`/marketing/pages/${pid}/deplacer`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `site_id=${site}`, redirect: "manual" }); return r.type; }, { pid: id, site: B });
    assert.ok(status);
    assert.equal(row(id).site_id, A, "une page à la corbeille ne se déplace pas, même par un envoi forcé");
  });
});
