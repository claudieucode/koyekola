// Nommage d'une page dès sa création (Chrome réel, vrai serveur) : dialogue commun, règles centralisées, parcours de création, aucune création inutile.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 10000, every = 80, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  for (;;) { let v = null; try { v = await check(); } catch { v = null; } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(every); }
}
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: 1 } }] },
] }] };

describe("nommage d'une page à la création (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const db = () => srv.db();
  const row = (id) => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const byName = (n) => db().prepare("SELECT * FROM mk_landing_pages WHERE name = ? COLLATE NOCASE").all(n);
  const count = () => db().prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
  const draft = (id) => { const r = row(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections || "[]"), theme: JSON.parse(r.theme || "{}") }; };
  const start = () => page.locator("[data-pb-start]");
  const home = () => page.locator("[data-pb-home]");
  const dlg = () => page.locator("dialog.pb-comp-dlg[open]").filter({ has: page.locator("[data-pb-name-input]") });
  const ok = () => dlg().locator("[data-cd-ok]");
  const ready = async () => {
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 }).catch(() => {});
    await wait(500);
  };
  const open = async (id) => { await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await ready(); };
  const create = async (name) => {
    await page.goto(`${srv.base}/marketing/pages#nouvelle`);
    await page.locator("#nouvelle").waitFor({ state: "visible" });
    await page.locator("#lp-name").fill(name);
    await Promise.all([page.waitForURL(/\/editeur/), page.locator('#nouvelle button[type="submit"]').click()]);
    return Number(page.url().match(/pages\/(\d+)/)[1]);
  };
  const withContent = async (name) => {
    const id = await create(name);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: { ...CONTENT, theme: JSON.parse(row(id).theme) } }, headers: {} });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    return id;
  };
  const type = async (name) => { await dlg().waitFor({ state: "visible", timeout: 15000 }); await dlg().locator("[data-pb-name-input]").fill(name); };
  const valid = async () => until(async () => !(await ok().isDisabled()), { what: "bouton actif", timeout: 8000 });
  const openHome = async () => { if (await start().isHidden()) await home().click(); await start().waitFor({ state: "visible" }); };
  const newBlank = async () => { await openHome(); await page.locator('[data-pb-start-go="blank"]').click(); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("dialog", (d) => d.accept().catch(() => {}));
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("le dialogue s'ouvre avec titre, description, champ focalisé ; vide = création impossible ; Échap annule sans rien créer", async () => {
    await withContent("Source A");
    const before = count();
    await newBlank();
    await dlg().waitFor({ state: "visible" });
    const t = await dlg().innerText();
    assert.match(t, /Créer une nouvelle page/); assert.match(t, /Donnez un nom à votre page pour la retrouver facilement dans votre espace de travail\./);
    assert.match(t, /Nom de la page/); assert.match(t, /Créer la page/); assert.match(t, /Annuler/);
    assert.equal(await dlg().locator("[data-pb-name-input]").getAttribute("placeholder"), "Ex. : Accueil, À propos, Nos services…");
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute("data-pb-name-input")), true, "focus dans le champ");
    assert.equal(await ok().isDisabled(), true, "vide : bouton désactivé");
    await dlg().locator("[data-pb-name-input]").fill("     ");
    await wait(500);
    assert.equal(await ok().isDisabled(), true, "espaces seuls : bouton désactivé");
    await page.keyboard.press("Escape");
    await dlg().waitFor({ state: "hidden" });
    assert.equal(count(), before, "annuler ne crée aucun document");
    assert.equal(await start().isVisible(), true);
  });

  test("nom trop long refusé avant création ; message clair ; la limite est celle du modèle (100)", async () => {
    await newBlank();
    await type("x".repeat(101));
    await until(async () => /100 caractères/.test(await dlg().innerText()), { what: "message de longueur" });
    assert.equal(await ok().isDisabled(), true);
    await dlg().locator("[data-pb-name-input]").fill("é".repeat(100));
    await valid();
    await page.keyboard.press("Escape");
  });

  test("création : nom enregistré tel que saisi (accents, espaces retirés), page DISTINCTE, un seul document malgré le double clic, nom dans la barre supérieure, la liste des pages et les pages récentes", async () => {
    const src = await withContent("Source B");
    const before = count(), oldDraft = JSON.stringify(draft(src));
    await newBlank();
    await type("  À propos de l’équipe  ");
    await valid();
    await ok().dblclick();
    await page.waitForURL((u) => /\/pages\/\d+\/editeur/.test(u.pathname) && !u.pathname.includes(`/pages/${src}/`), { timeout: 20000 });
    await ready();
    const id = Number(page.url().match(/pages\/(\d+)/)[1]);
    assert.equal(count(), before + 1, "une seule page créée");
    assert.equal(row(id).name, "À propos de l’équipe");
    assert.match(row(id).slug, /^a-propos-de-l-equipe/, "le slug est dérivé par la génération existante, distinct du nom et de l'identifiant");
    assert.equal(JSON.stringify(draft(src)), oldDraft, "l'ancien document est intact");
    assert.equal((draft(id).sections || []).length, 0, "document vierge");
    assert.equal(await page.locator(".pb-title h1").innerText(), "À propos de l’équipe", "barre supérieure");
    assert.equal(await start().isVisible(), true);
    const list = await boss.request("/marketing/pages");
    assert.match(list.text, /À propos de l’équipe/, "gestionnaire des pages");
    await open(src);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.match(await page.locator(`[data-pb-recent="${id}"]`).innerText(), /À propos de l’équipe/, "pages récentes (même identifiant)");
  });

  test("deux pages avec le même titre : refusé AVANT création (règle d'unicité de Kolakisa, casse ignorée), rien n'est écrasé", async () => {
    const src = await withContent("Source C");
    await create("Titre déjà pris");
    await open(src);
    const before = count();
    await newBlank();
    await type("TITRE déjà pris"); // la casse ASCII est ignorée (collation NOCASE de la table)
    await until(async () => /déjà ce nom/.test(await dlg().innerText()), { what: "message de doublon" });
    assert.equal(await ok().isDisabled(), true);
    assert.equal(count(), before);
    assert.equal(byName("Titre déjà pris").length, 1);
    await dlg().locator("[data-pb-name-input]").fill("Titre différent");
    await valid();
    await page.keyboard.press("Escape");
  });

  test("erreur de persistance : le dialogue reste, message compréhensible, aucun document fantôme, réessai possible", async () => {
    const src = await withContent("Source D");
    const before = count();
    await page.route("**/pages/creer.json", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: { message: "Erreur interne simulée." } }) }));
    await newBlank();
    await type("Page qui échoue");
    await valid();
    await ok().click();
    await dlg().locator("[data-cd-error]").waitFor({ state: "visible" });
    assert.equal(await dlg().isVisible(), true, "dialogue conservé");
    assert.equal(count(), before, "aucun document créé");
    assert.equal(page.url().includes(`/pages/${src}/`), true);
    await page.unroute("**/pages/creer.json");
    await valid();
    await Promise.all([page.waitForURL((u) => !u.pathname.includes(`/pages/${src}/`), { timeout: 20000 }), ok().click()]);
    assert.equal(count(), before + 1);
    assert.equal(byName("Page qui échoue").length, 1);
  });

  test("modifications en attente : protégées d'abord ; le nommage s'ouvre ensuite ; annuler le nom ne perd rien", async () => {
    const src = await withContent("Source E");
    await page.route("**/brouillon", (route) => (route.request().method() === "PUT" ? route.abort() : route.continue()));
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').click(); });
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await wait(1500);
    const before = count();
    await newBlank();
    const leave = page.locator("dialog.pb-comp-dlg[open]");
    await leave.waitFor();
    assert.match(await leave.innerText(), /Enregistrer votre travail avant de continuer/);
    assert.equal(await dlg().count(), 0, "le nommage n'est pas proposé avant la résolution de l'enregistrement");
    await page.unroute("**/brouillon");
    await leave.getByRole("button", { name: "Enregistrer et continuer" }).click();
    await dlg().waitFor({ state: "visible", timeout: 20000 });
    await until(() => (draft(src).sections[0].children || []).length === 0, { what: "enregistré", timeout: 12000 });
    assert.equal(count(), before);
    await page.keyboard.press("Escape");
    await dlg().waitFor({ state: "hidden" });
    assert.equal(count(), before, "annuler : rien créé");
    assert.equal(page.url().includes(`/pages/${src}/`), true, "toujours dans le document");
  });

  test("création guidée : « Créer dans une nouvelle page » conserve gabarit, format, largeur et marges, après nommage", async () => {
    const src = await withContent("Source F");
    const before = count();
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-cat-card="contact"]').click();
    await page.locator("[data-pb-cat-next]").click();
    await page.locator('[data-pb-start-format="large"]').click();
    await page.locator("[data-pb-start-newpage]").click();
    await type("Contact guidé");
    assert.equal(count(), before, "pas de création avant confirmation");
    await valid();
    await Promise.all([page.waitForURL((u) => !u.pathname.includes(`/pages/${src}/`), { timeout: 20000 }), ok().click()]);
    await ready();
    const id = Number(page.url().match(/pages\/(\d+)/)[1]);
    assert.equal(count(), before + 1, "une seule page pour appliquer le gabarit");
    assert.equal(row(id).name, "Contact guidé");
    const d = draft(id);
    assert.ok(d.sections.length >= 3, "sections du gabarit « Contact »");
    assert.equal(d.theme.layout.format, "large"); assert.equal(d.theme.layout.maxWidth, 1440); assert.equal(d.theme.layout.gutter, 32);
    assert.equal(await page.locator(".pb-title h1").innerText(), "Contact guidé");
    assert.equal(draft(src).sections.length, 1, "la page d'origine n'est pas modifiée");
  });

  test("aucun dialogue pour : reprendre, ajouter une structure, ouvrir une page récente, appliquer un gabarit à la page ouverte, création classique", async () => {
    const other = await create("Autre ouverte");
    const src = await withContent("Source G");
    const before = count();
    await openHome();
    await page.locator("[data-pb-home-resume]").click();
    assert.equal(await dlg().count(), 0);
    await openHome();
    await page.locator('[data-pb-start-go="classic"]').click();
    await wait(400);
    assert.equal(await dlg().count(), 0, "ajouter une structure");
    await page.keyboard.press("Escape");
    await wait(300);
    await openHome();
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-cat-card="faq"]').click();
    await page.locator("[data-pb-cat-next]").click();
    await page.locator("[data-pb-start-continue]").click();
    await wait(800);
    assert.equal(await dlg().count(), 0, "gabarit appliqué à la page ouverte");
    await until(async () => /enregistr/i.test(await page.locator("[data-pb-save]").innerText()) && !/attente|…/.test(await page.locator("[data-pb-save]").innerText()), { what: "enregistrement automatique", timeout: 15000 });
    await openHome();
    const rbtn = page.locator(`[data-pb-recent-open="${other}"]`);
    assert.equal(await rbtn.count(), 1, "la page récente est listée : " + (await page.locator("[data-pb-recents]").innerText()));
    await rbtn.click();
    await wait(1500);
    const leave = page.locator("dialog.pb-comp-dlg[open]");
    if (await leave.count()) { assert.equal(await dlg().count(), 0, "seule la protection du travail s'affiche"); await leave.getByRole("button", { name: "Enregistrer et continuer" }).click(); }
    await until(() => new RegExp(`/pages/${other}/editeur`).test(page.url()), { what: "page récente ouverte", timeout: 15000 });
    assert.equal(await dlg().count(), 0, "ouverture d'une page récente");
    assert.equal(count(), before);
    assert.ok(src);
  });

  test("renommage ultérieur (gestionnaire des pages) : mêmes règles, doublon refusé, identifiant et adresse inchangés", async () => {
    const a = await create("Renom A"); await create("Renom B");
    const slug = row(a).slug;
    const rename = (name) => boss.request(`/marketing/pages/${a}`, { method: "POST", form: { name, slug, action: "settings" }, headers: {} });
    await rename("renom b");
    assert.equal(row(a).name, "Renom A", "doublon refusé au renommage aussi");
    await rename("   ");
    assert.equal(row(a).name, "Renom A", "vide refusé");
    await rename("  Renom A2  ");
    assert.equal(row(a).name, "Renom A2");
    assert.equal(row(a).id, a); assert.equal(row(a).slug, slug);
  });

  test("renommer depuis la barre supérieure : champ prérempli, mêmes règles, nom mis à jour sans recharger, identifiant et adresse inchangés", async () => {
    await create("Renom pris");
    const id = await withContent("Renom barre");
    const slug = row(id).slug;
    await page.evaluate(() => { window.__marker = "same-page"; });
    await page.locator("[data-pb-rename]").click();
    await dlg().waitFor({ state: "visible" });
    assert.match(await dlg().innerText(), /Renommer la page/);
    assert.equal(await dlg().locator("[data-pb-name-input]").inputValue(), "Renom barre");
    await dlg().locator("[data-pb-name-input]").fill("renom PRIS");
    await until(async () => /déjà ce nom/.test(await dlg().innerText()), { what: "doublon au renommage" });
    assert.equal(await ok().isDisabled(), true);
    await dlg().locator("[data-pb-name-input]").fill("");
    await wait(400);
    assert.equal(await ok().isDisabled(), true);
    await dlg().locator("[data-pb-name-input]").fill("  Nouveau titre  ");
    await valid();
    await ok().click();
    await dlg().waitFor({ state: "hidden" });
    assert.equal(await page.locator(".pb-title h1").innerText(), "Nouveau titre");
    assert.equal(await page.evaluate(() => window.__marker), "same-page", "pas de rechargement de l'éditeur");
    assert.equal(row(id).name, "Nouveau titre"); assert.equal(row(id).id, id); assert.equal(row(id).slug, slug);
    assert.match((await boss.request("/marketing/pages")).text, /Nouveau titre/);
    await page.locator("[data-pb-rename]").click();
    await dlg().waitFor({ state: "visible" });
    await dlg().locator("[data-pb-name-input]").fill("nouveau TITRE"); // même page : son propre nom n'est pas un doublon
    await valid();
    await page.keyboard.press("Escape");
    assert.equal(row(id).name, "Nouveau titre", "annuler ne change rien");
  });

  test("route de création : sans connexion refusée, nom vide refusé, doublon refusé", async () => {
    const res = await fetch(`${srv.base}/marketing/pages/creer.json`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Sans session" }), redirect: "manual" });
    assert.notEqual(res.status, 201);
    assert.equal(byName("Sans session").length, 0);
    const e1 = await boss.request("/marketing/pages/creer.json", { method: "POST", json: { name: "   " }, headers: {} });
    assert.equal(e1.status, 422);
    const c1 = await boss.request("/marketing/pages/creer.json", { method: "POST", json: { name: "Route unique" }, headers: {} });
    assert.equal(c1.status, 201);
    const c2 = await boss.request("/marketing/pages/creer.json", { method: "POST", json: { name: "ROUTE UNIQUE" }, headers: {} });
    assert.equal(c2.status, 422);
    assert.equal(byName("Route unique").length, 1);
  });

  test("apparences et petite largeur : dialogue lisible (clair, sombre) et dans l'écran", async () => {
    await withContent("Source H");
    await newBlank();
    await dlg().waitFor({ state: "visible" });
    const lum = (rgb) => { const c = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    for (const [skin, palette] of [["classic", "light"], ["classic", "dark"], ["navy", "dark"]]) {
      await page.evaluate(([k, p]) => { document.body.dataset.skin = k; document.body.dataset.palette = p; document.querySelector("[data-pb-main]").dataset.palette = p; }, [skin, palette]);
      await wait(300);
      const c = await dlg().evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e.querySelector("h2")).color, tx: getComputedStyle(e.querySelector("p")).color, inp: getComputedStyle(e.querySelector("input")).color, ibg: getComputedStyle(e.querySelector("input")).backgroundColor }));
      assert.ok(contrast(c.bg, c.fg) >= 4.5 && contrast(c.bg, c.tx) >= 4.5, `${skin}/${palette} : ${JSON.stringify(c)}`);
      assert.ok(contrast(c.ibg === "rgba(0, 0, 0, 0)" ? c.bg : c.ibg, c.inp) >= 4.5, `champ ${skin}/${palette} : ${JSON.stringify(c)}`);
    }
    await page.setViewportSize({ width: 380, height: 700 }); await wait(300);
    const r = await dlg().evaluate((e) => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth + 1; });
    assert.equal(r, true, "le dialogue tient dans l'écran");
    await page.setViewportSize({ width: 1600, height: 950 });
    await page.evaluate(() => { document.body.dataset.skin = "classic"; document.body.dataset.palette = "light"; document.querySelector("[data-pb-main]").dataset.palette = "light"; });
    await page.keyboard.press("Escape");
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
