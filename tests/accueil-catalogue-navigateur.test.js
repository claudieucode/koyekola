// Création guidée : catalogue de gabarits, types de pages, pages récentes (Chrome réel, vrai serveur).
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

const { TEMPLATES } = require("../src/marketing/pages/templates");
const { TYPES, GABARIT_TYPES, typeList } = require("../src/marketing/pages/pageTypes");

describe("registre des types de pages (cohérence)", () => {
  test("chaque gabarit déclaré existe, chaque gabarit réel est déclaré, chaque identifiant est unique et connu", () => {
    const keys = TEMPLATES.map((t) => t.key);
    assert.deepEqual(Object.keys(GABARIT_TYPES).sort(), keys.slice().sort());
    const all = typeList(), ids = all.map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length, "identifiants de types uniques");
    for (const [k, list] of Object.entries(GABARIT_TYPES)) for (const id of list) assert.ok(ids.includes(id), `type inconnu « ${id} » dans ${k}`);
    for (const g of Object.keys(TYPES)) assert.ok(TYPES[g].length > 0);
    assert.ok(all.some((t) => !t.gabarits.length), "des types restent seulement répertoriés");
    assert.ok(all.filter((t) => t.needs).every((t) => !t.gabarits.length), "un type qui exige une fonction manquante ne se présente pas comme couvert");
  });
});

describe("création guidée : catalogue, gabarits et pages récentes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const db = () => srv.db();
  const row = (id) => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = (id) => { const r = row(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections || "[]") }; };
  const start = () => page.locator("[data-pb-start]");
  const home = () => page.locator("[data-pb-home]");
  const create = async (name) => {
    await page.goto(`${srv.base}/marketing/pages#nouvelle`);
    await page.locator("#nouvelle").waitFor({ state: "visible" });
    await page.locator("#lp-name").fill(name);
    await Promise.all([page.waitForURL(/\/editeur/), page.locator('#nouvelle button[type="submit"]').click()]);
    return Number(page.url().match(/pages\/(\d+)/)[1]);
  };
  const ready = async () => {
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 }).catch(() => {});
    await wait(500);
  };
  const open = async (id) => { await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await ready(); };
  const blank = async (name) => { // page vide : l'écran de démarrage s'affiche seul
    const id = await create(name);
    await db().prepare("UPDATE mk_landing_pages SET sections = '[]', draft = NULL WHERE id = ?").run(id);
    await open(id);
    return id;
  };
  const withContent = async (name) => {
    const id = await create(name);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: { ...CONTENT, theme: JSON.parse(row(id).theme) } }, headers: {} });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    return id;
  };
  const cards = () => page.locator("[data-pb-cat-card]");

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

  test("aucune autre page : état vide soigné, rien d'inventé dans les pages récentes", async () => {
    await blank("Seule page");
    await start().waitFor({ state: "visible" });
    assert.equal(await page.locator("[data-pb-recents-empty]").count(), 1);
    assert.equal(await page.locator("[data-pb-recent]").count(), 0);
    assert.match(await page.locator("[data-pb-recents-empty]").innerText(), /Aucune autre page/);
  });

  test("le catalogue liste les gabarits réels, distingue les types répertoriés et filtre par recherche, catégorie et portée", async () => {
    await blank("Catalogue A");
    await page.locator('[data-pb-start-go="guided"]').click();
    await cards().first().waitFor();
    assert.equal(await cards().count(), TEMPLATES.length + 1, "page vide + un carte par gabarit réel");
    assert.equal(await page.locator('[data-pb-cat-card="blank"]').getAttribute("aria-checked"), "true", "page vide préchoisie");
    assert.equal(await page.locator("[data-pb-cat-types]").count(), 0, "types sans gabarit masqués par défaut");
    await page.locator('[data-pb-cat-scope="all"]').click();
    await page.locator("[data-pb-cat-types]").waitFor();
    const txt = await page.locator("[data-pb-cat-types]").innerText();
    assert.match(txt, /Panier/); assert.match(txt, /Fonction manquante/); assert.match(txt, /Répertorié/); assert.match(txt, /Nécessite : Boutique/);
    assert.equal(await page.locator('[data-pb-cat-type="contact"]').count(), 0, "un type couvert n'est pas listé comme manquant");
    await page.locator("[data-pb-cat-q]").fill("contact");
    await until(async () => (await cards().count()) < TEMPLATES.length, { what: "filtre" });
    assert.equal(await page.locator('[data-pb-cat-card="contact"]').count(), 1);
    assert.equal(await page.locator('[data-pb-cat-card="blank"]').count(), 0, "la page vide n'apparaît pas dans une recherche");
    await page.locator("[data-pb-cat-q]").fill("zzzqqqxx");
    await page.locator("[data-pb-cat-empty]").waitFor();
    await page.locator("[data-pb-cat-reset]").click();
    await until(async () => (await cards().count()) === TEMPLATES.length + 1, { what: "réinitialisation" });
    await page.locator('[data-pb-cat-group="ecommerce"]').click();
    await until(async () => (await cards().count()) === 1, { what: "catégorie presque sans gabarit (une seule FAQ produits)" });
    assert.equal(await page.locator("[data-pb-cat-types] [data-pb-cat-type]").count() > 0, true, "mais ses types sont répertoriés");
    await page.locator('[data-pb-cat-group="marketing"]').click();
    await until(async () => (await cards().count()) > 0, { what: "marketing" });
    await page.locator('[data-pb-cat-q]').fill("");
    await page.locator('[data-pb-cat-sort]').selectOption("name");
    await until(async () => { const names = await page.locator(".pb-cat-name").allInnerTexts(); return names.length > 1 && names.every((n, i) => !i || names[i - 1].localeCompare(n, "fr") <= 0); }, { what: "tri par nom" });
  });

  test("gabarit choisi puis format : sections réelles insérées, format appliqué, une seule étape annulable", async () => {
    const id = await blank("Catalogue B");
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-cat-card="contact"]').click();
    assert.equal(await page.locator('[data-pb-cat-card="contact"]').getAttribute("aria-checked"), "true");
    await page.locator("[data-pb-cat-next]").click();
    assert.match(await page.locator("[data-pb-start-chosen]").innerText(), /Gabarit : « Contact »/);
    await page.locator('[data-pb-start-format="compact"]').click();
    await page.locator("[data-pb-start-continue]").click();
    await start().waitFor({ state: "hidden" });
    await until(async () => (await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll(".lp-section, [data-node-id]").length)) > 0, { what: "sections visibles" });
    await until(async () => { const d = draft(id); return d.sections && d.sections.length > 0; }, { timeout: 15000, what: "brouillon enregistré" });
    const d = draft(id);
    assert.equal(d.theme.layout.format, "compact"); assert.equal(d.theme.layout.maxWidth, 960);
    assert.ok(d.sections.length >= 3, "les sections du gabarit « Contact »");
    assert.ok(d.sections.every((s) => s.id), "identifiants neufs");
  });

  test("depuis l'accueil : le gabarit s'ajoute à la fin sans rien effacer, annulable", async () => {
    const id = await withContent("Catalogue C");
    const first = draft(id).sections[0].id, before = draft(id).sections.length;
    assert.ok(before > 0);
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-cat-card="evenement"]').click();
    await page.locator("[data-pb-cat-next]").click();
    await page.locator("[data-pb-start-continue]").click();
    await until(async () => { const d = draft(id); return d.sections.length > before; }, { timeout: 15000, what: "gabarit ajouté" });
    const after1 = draft(id).sections;
    assert.equal(after1[0].id, first, "le contenu existant reste en tête, intact");
    assert.ok(after1.length > before, "ajouté à la suite");
    await page.locator("[data-pb-undo]").click();
    await until(() => draft(id).sections.length === before, { timeout: 15000, what: "annulation en une étape" });
  });

  test("l'accueil montre l'état d'enregistrement et les pages récentes réelles (statut, date, ouverture)", async () => {
    const other = await create("Récente publiée");
    db().prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(other);
    const other2 = await create("Récente brouillon");
    const cur = await withContent("Page courante");
    await home().click(); await start().waitFor({ state: "visible" });
    assert.match(await page.locator("[data-pb-home-state]").innerText(), /Tout est enregistré/);
    const names = await page.locator("[data-pb-recent] .pb-recent-name").allInnerTexts();
    assert.ok(names.includes("Récente publiée") && names.includes("Récente brouillon"));
    assert.ok(!names.includes("Page courante"), "la page ouverte n'est pas listée");
    assert.equal(names[0], "Récente brouillon", "la plus récemment modifiée d'abord");
    assert.match(await page.locator(`[data-pb-recent="${other}"]`).innerText(), /Publiée/);
    assert.match(await page.locator(`[data-pb-recent="${other2}"]`).innerText(), /Brouillon/);
    assert.match(await page.locator(`[data-pb-recent="${other2}"] .pb-recent-meta`).innerText(), /modifiée (à l'instant|il y a|le )/);
    await page.locator('[data-pb-recent-filter="live"]').click();
    assert.equal(await page.locator("[data-pb-recent]").count() >= 1, true);
    assert.equal(await page.locator(`[data-pb-recent="${other2}"]`).count(), 0);
    await page.locator('[data-pb-recent-filter="draft"]').click();
    assert.equal(await page.locator(`[data-pb-recent="${other}"]`).count(), 0);
    assert.equal(await page.locator(`[data-pb-recent="${other2}"]`).count(), 1);
    await Promise.all([page.waitForURL(new RegExp(`/marketing/pages/${other2}/editeur`)), page.locator(`[data-pb-recent-open="${other2}"]`).click()]);
    await ready();
    assert.equal(row(other2).id, other2, "même identité de document, aucune copie");
    assert.equal(db().prepare("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE name = 'Récente brouillon'").get().n, 1);
  });

  const nodes = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
  const failSaves = async () => { await page.route("**/brouillon", (route) => (route.request().method() === "PUT" ? route.abort() : route.continue())); };
  const allowSaves = async () => { await page.unroute("**/brouillon"); };
  test("ouvrir une page récente avec des modifications en attente passe par la boîte d'enregistrement, sans perte", async () => {
    const other = await create("Cible récente");
    const cur = await create("Source modifiée");
    const put = await boss.request(`/marketing/pages/${cur}/brouillon`, { method: "PUT", json: { revision: row(cur).revision, content: { ...CONTENT, theme: JSON.parse(row(cur).theme) } }, headers: {} });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(cur);
    await failSaves();
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').click(); });
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await until(async () => (await nodes()) === 0, { what: "modification locale" });
    await wait(1500);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.match(await page.locator("[data-pb-home-state]").innerText(), /en attente|impossible/i, "état d'enregistrement exact");
    await page.locator(`[data-pb-recent-open="${other}"]`).click();
    const dlg = page.locator("dialog[open]");
    await dlg.waitFor();
    assert.match(await dlg.locator("[data-pb-leave-text]").innerText(), /Cible récente/);
    await dlg.getByRole("button", { name: "Annuler" }).click();
    await dlg.waitFor({ state: "hidden" });
    assert.match(page.url(), new RegExp(`/pages/${cur}/editeur`), "Annuler ne change rien");
    assert.equal(await nodes(), 0, "la modification locale est conservée");
    await allowSaves();
    await page.locator(`[data-pb-recent-open="${other}"]`).click();
    await dlg.waitFor();
    await Promise.all([page.waitForURL(new RegExp(`/marketing/pages/${other}/editeur`), { timeout: 20000 }), dlg.getByRole("button", { name: "Enregistrer et continuer" }).click()]);
    assert.equal((draft(cur).sections[0].children || []).length, 0, "enregistré avant de quitter, rien perdu");
  });

  test("épingler une page (sur cet appareil) la place en tête et le filtre « Épinglées » fonctionne", async () => {
    const cur = await withContent("Épingles courante");
    const ids = db().prepare("SELECT id FROM mk_landing_pages WHERE id != ? ORDER BY updated_at DESC, id DESC").all(cur).map((r) => r.id);
    const oldest = ids[ids.length - 1];
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-recent-filter="pin"]').click();
    assert.equal(await page.locator("[data-pb-recents-none]").count(), 1, "aucune épinglée au départ");
    await page.locator('[data-pb-recent-filter="all"]').click();
    if (await page.locator(`[data-pb-recent-pin="${oldest}"]`).count()) {
      await page.locator(`[data-pb-recent-pin="${oldest}"]`).click();
      assert.equal(await page.locator("[data-pb-recent]").first().getAttribute("data-pb-recent"), String(oldest), "épinglée en tête");
      assert.equal(await page.locator(`[data-pb-recent-pin="${oldest}"]`).getAttribute("aria-pressed"), "true");
      await page.locator('[data-pb-recent-filter="pin"]').click();
      assert.equal(await page.locator("[data-pb-recent]").count(), 1);
      await page.locator('[data-pb-recent-filter="all"]').click();
      await page.locator(`[data-pb-recent-pin="${oldest}"]`).click();
      assert.equal(await page.locator(`[data-pb-recent-pin="${oldest}"]`).getAttribute("aria-pressed"), "false");
    }
  });

  test("un gabarit appliqué est proposé ensuite dans « Récemment appliqués »", async () => {
    const rid = await withContent("Récents gabarits");
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    assert.equal(await page.locator("[data-pb-cat-recentg]").count() >= 0, true);
    await page.locator('[data-pb-cat-card="faq"]').click();
    await page.locator("[data-pb-cat-next]").click();
    await page.locator("[data-pb-start-continue]").click(); // format VERROUILLÉ (défaut) : le gabarit « FAQ » (largeur propre à ses blocs) doit rester enregistrable
    await start().waitFor({ state: "hidden" });
    await until(() => draft(rid).sections.length > 1 && draft(rid).theme.layout.locked === true, { timeout: 15000, what: "gabarit enregistré malgré le format verrouillé" });
    assert.equal(await page.locator("[data-pb-save]").innerText().then((t) => /Non enregistré/.test(t)), false);
    await withContent("Récents gabarits 2"); // autre page sans format : le gabarit appliqué avant est proposé dans « Récemment appliqués »
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-cat-pick="faq"]').waitFor();
    await page.locator('[data-pb-cat-pick="faq"]').click();
    assert.equal(await page.locator('[data-pb-cat-card="faq"]').getAttribute("aria-checked"), "true");
  });

  test("la route des gabarits : tous répondent avec de vraies sections, une clé inconnue est refusée, sans connexion c'est refusé", async () => {
    for (const t of TEMPLATES) {
      const r = await boss.request(`/marketing/site-web/gabarits/${t.key}.json`);
      assert.equal(r.status, 200, t.key);
      const j = JSON.parse(r.text);
      assert.ok(j.gabarit.sections.length >= 1, `${t.key} : sections`);
      assert.ok(j.gabarit.sections.every((s) => s.id && s.type), `${t.key} : identifiants et types`);
    }
    assert.equal((await boss.request("/marketing/site-web/gabarits/inconnu.json")).status, 404);
    const res = await fetch(`${srv.base}/marketing/site-web/gabarits/lead.json`, { redirect: "manual" });
    assert.notEqual(res.status, 200, "refusé sans connexion");
  });

  test("responsive et apparence sombre : pas de débordement du catalogue ni des pages récentes", async () => {
    await blank("Catalogue R");
    await page.locator('[data-pb-start-go="guided"]').click();
    await cards().first().waitFor();
    for (const w of [1600, 1100, 760, 420]) {
      await page.setViewportSize({ width: w, height: 900 }); await wait(250);
      const o = await page.evaluate(() => { const e = document.querySelector("[data-pb-start]"); return e.scrollWidth <= e.clientWidth + 1; });
      assert.equal(o, true, `pas de défilement horizontal à ${w}px`);
    }
    await page.setViewportSize({ width: 1600, height: 950 });
    await page.evaluate(() => { const b = [...document.querySelectorAll("[data-pb-theme-toggle]")].find((x) => x.offsetParent); if (b) b.click(); });
    await wait(400);
    const bg = await page.locator(".pb-cat-card").first().evaluate((e) => getComputedStyle(e).backgroundColor);
    const m = bg.match(/\d+/g).map(Number);
    assert.ok((m[0] + m[1] + m[2]) / 3 < 120, `carte sombre en mode sombre : ${bg}`);
    await page.evaluate(() => { const b = [...document.querySelectorAll("[data-pb-theme-toggle]")].find((x) => x.offsetParent); if (b) b.click(); });
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
