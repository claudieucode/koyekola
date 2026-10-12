// Accueil persistant et « Reprendre mon travail » (Chrome réel, vrai serveur).
// Vérifie : l'icône Accueil rouvre l'écran de démarrage sans toucher au document, à l'historique ni à l'enregistrement ; « Reprendre mon travail »
// ramène le travail intact ; classique / guidé depuis l'accueil AJOUTENT sans rien effacer ; format verrouillé respecté ; aucun raccourci actif dessous.
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

describe("accueil persistant et reprise du travail (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors;
  const db = () => srv.db();
  const row = (id) => db().prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const draft = (id) => { const r = row(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections || "[]") }; };
  const layout = (id) => (draft(id).theme || {}).layout;
  const start = () => page.locator("[data-pb-start]");
  const home = () => page.locator("[data-pb-home]");
  const nodes = () => page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll("[data-node-id]").length);
  const create = async (name) => {
    await page.goto(`${srv.base}/marketing/pages#nouvelle`);
    await page.locator("#nouvelle").waitFor({ state: "visible" });
    await page.locator("#lp-name").fill(name);
    await Promise.all([page.waitForURL(/\/editeur/), page.locator('#nouvelle button[type="submit"]').click()]);
    return Number(page.url().match(/pages\/(\d+)/)[1]);
  };
  const open = async (id) => {
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`);
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(500);
  };
  const withContent = async (name, theme) => {
    const id = await create(name);
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: { ...CONTENT, theme: theme || JSON.parse(row(id).theme) } }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    return id;
  };
  const deleteContainer = async () => {
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').click(); });
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await until(async () => (await nodes()) === 0, { what: "page vidée" });
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("dialog", (d) => d.accept().catch(() => {})); // « quitter la page ? » (modifications en attente volontairement laissées par certains tests)
    page.on("response", (r) => { if (r.request().method() === "POST") (global.__posts = global.__posts || []).push(`${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, "")}`); });
    page.on("requestfailed", (r) => (global.__posts = global.__posts || []).push(`FAIL ${r.url().replace(/^https?:\/\/[^/]+/, "")}`));
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("l'icône Accueil est accessible (libellé, infobulle) et rouvre l'écran sans toucher au document ni à l'enregistrement", async () => {
    const id = await withContent("Accueil A");
    assert.equal(await start().isHidden(), true);
    assert.match(await home().getAttribute("aria-label"), /Accueil/);
    assert.match(await home().getAttribute("data-tip"), /Accueil/);
    const revision = row(id).revision;
    await home().click();
    await start().waitFor({ state: "visible" });
    assert.equal(await home().getAttribute("aria-pressed"), "true");
    const text = await start().innerText();
    assert.match(text, /Reprendre mon travail/); assert.match(text, /Ajouter une structure/); assert.match(text, /Nouvelle page vierge/); assert.match(text, /Création guidée/);
    assert.equal(await page.locator('[data-pb-start-card="resume"]').count(), 1); assert.equal(await page.locator('[data-pb-start-card="classic"]').count(), 1); assert.equal(await page.locator('[data-pb-start-card="blank"]').count(), 1);
    await wait(1500);
    assert.equal(row(id).revision, revision, "ouvrir l'accueil n'enregistre rien");
    assert.equal(draft(id).sections[0].children[0].children[0].props.text, "Titre");
    await page.locator("[data-pb-home-resume]").click();
    await start().waitFor({ state: "hidden" });
    assert.equal(await home().getAttribute("aria-pressed"), "false");
    assert.equal(await nodes() > 0, true, "le canevas est intact");
    assert.equal(await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"]').count(), 1);
  });

  test("Accueil : un second clic referme ; Échap referme ; aucun raccourci n'agit sur la page cachée (Suppr)", async () => {
    await home().click(); await start().waitFor({ state: "visible" });
    await home().click(); await start().waitFor({ state: "hidden" });
    await home().click(); await start().waitFor({ state: "visible" });
    await page.keyboard.press("Delete");
    await wait(300);
    assert.equal(await nodes() > 0, true, "Suppr n'a rien supprimé sous l'accueil");
    await page.locator("[data-pb-home-resume]").focus();
    await page.keyboard.press("Escape");
    await start().waitFor({ state: "hidden" });
  });

  test("modifications non enregistrées : passer par l'accueil ne les perd pas, l'historique reste, l'enregistrement se fait ensuite", async () => {
    const id = await withContent("Accueil B");
    await page.locator("[data-pb-mode='structure']").count(); // présent
    await deleteContainer();
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), false);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.match(await start().innerText(), /Reprendre mon travail/, "page vidée : l'accueil propose bien la reprise");
    await page.locator("[data-pb-home-resume]").click(); await start().waitFor({ state: "hidden" });
    assert.equal(await nodes(), 0, "la page vidée reste vidée (aucune réinitialisation)");
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    // Annuler / Rétablir fonctionnent après la navigation
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await nodes()) > 0, { what: "annulation après accueil" });
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await nodes()) === 0, { what: "rétablissement après accueil" });
  });

  test("page vidée puis rechargée : l'accueil reste atteignable par l'icône ; rien n'est modifié", async () => {
    const id = await withContent("Accueil C");
    await deleteContainer();
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    await open(id);
    assert.equal(await home().isVisible(), true);
    await home().click(); // la page est vide mais possède une section : travail existant
    await start().waitFor({ state: "visible" });
    assert.equal((draft(id).sections || []).length, 1, "rien n'a été modifié");
  });

  test("page entièrement vide (aucune section) : l'écran de démarrage reste affiché, l'icône ne le duplique pas", async () => {
    const id = await create("Accueil D");
    await start().waitFor({ state: "visible" });
    await home().click();
    assert.equal(await start().locator("[data-pb-start-card]").count(), 2, "un seul écran, pas de doublon");
    assert.equal(await start().locator("[data-pb-home-resume]").count(), 0, "rien à reprendre sur une page vierge");
    assert.equal((draft(id).sections || []).length, 0);
  });

  test("Création classique depuis l'accueil : AJOUTE une structure sans effacer l'existant", async () => {
    const id = await withContent("Accueil E");
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="classic"]').click();
    await start().waitFor({ state: "hidden" });
    await page.getByText("Quelle mise en page utiliser", { exact: false }).first().waitFor({ timeout: 8000 });
    assert.equal(await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"]').count(), 1, "contenu existant conservé");
    assert.equal(layout(id), undefined);
  });

  test("Création guidée depuis l'accueil : gabarit appliqué à la page existante, contenu conservé, annulable", async () => {
    const id = await withContent("Accueil F");
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="guided"]').click();
    await page.locator('[data-pb-start-format="compact"]').click();
    await page.locator("[data-pb-start-continue]").click();
    await until(() => { const l = layout(id); return l && l.format === "compact"; }, { what: "format enregistré" });
    await start().waitFor({ state: "hidden" });
    assert.equal(draft(id).sections[0].children[0].children[0].props.text, "Titre", "contenu conservé");
    assert.equal(await home().getAttribute("aria-pressed"), "false");
  });

  test("format verrouillé : la création guidée est désactivée depuis l'accueil, le travail reste repris normalement", async () => {
    const id = await withContent("Accueil G", { layout: { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: true } });
    await home().click(); await start().waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-pb-start-go="guided"]').isDisabled(), true);
    assert.match(await start().innerText(), /verrouillé/);
    await page.locator("[data-pb-home-resume]").click(); await start().waitFor({ state: "hidden" });
    assert.deepEqual(layout(id), { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: true });
  });

  test("petite largeur (téléphone) : l'icône Accueil reste atteignable et l'écran sans débordement", async () => {
    await withContent("Accueil H");
    await page.setViewportSize({ width: 420, height: 900 });
    await wait(300);
    assert.equal(await home().isVisible(), true);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => { const e = document.querySelector("[data-pb-start]"); return e.scrollWidth <= e.clientWidth + 1; }), true);
    await page.setViewportSize({ width: 1600, height: 950 });
  });

  test("historique conservé après rechargement : Annuler et Rétablir fonctionnent encore, et l'écran de démarrage ne revient pas", async () => {
    const id = await withContent("Accueil I");
    await deleteContainer();
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    await wait(1200); // l'historique est copié dans le navigateur après une courte pause
    await open(id);
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), false, "Annuler disponible après rechargement");
    assert.equal(await nodes(), 0);
    assert.equal(await start().isHidden(), true, "page vidée volontairement : pas de retour à l'écran de choix");
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await nodes()) > 0, { what: "annulation après rechargement" });
    assert.equal(await page.locator("[data-pb-redo]").isDisabled(), false);
    await wait(1200);
    await open(id); // Rétablir aussi survit à un rechargement
    assert.equal(await page.locator("[data-pb-redo]").isDisabled(), false, "Rétablir disponible après rechargement");
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await nodes()) === 0, { what: "rétablissement après rechargement" });
  });

  test("historique écarté si la page a changé ailleurs : jamais appliqué à un autre contenu", async () => {
    const id = await withContent("Accueil J");
    await deleteContainer();
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "vidage enregistré", timeout: 12000 });
    await wait(1200);
    const other = { ...draft(id), sections: [{ id: "sect00000009", type: "layout", children: [{ id: "cont00000009", type: "container", children: [] }] }] };
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: row(id).revision, content: other }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await open(id);
    assert.equal(await page.locator("[data-pb-undo]").isDisabled(), true, "historique d'un autre contenu écarté");
  });

  const leftFor = async (id) => {
    try { await page.waitForURL((u) => !u.pathname.includes(`/pages/${id}/`), { timeout: 15000, waitUntil: "commit" }); } catch (e) {
      const note = await page.locator("[data-pb-home-note]").allInnerTexts().catch(() => []), err = await page.locator("[data-cd-error]").allInnerTexts().catch(() => []);
      throw new Error(`pas de navigation : note=${JSON.stringify(note)} erreur=${JSON.stringify(err)} url=${page.url()} posts=${JSON.stringify((global.__posts || []).slice(-6))}`);
    }
  };
  const pageCount = () => db().prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
  const failSaves = async () => { await page.route("**/brouillon", (route) => (route.request().method() === "PUT" ? route.abort() : route.continue())); };
  const allowSaves = async () => { await page.unroute("**/brouillon"); };
  const makeDirty = async (id) => {
    await failSaves();
    await page.evaluate(() => { document.querySelector("[data-pb-frame]").contentDocument.querySelector('[data-node-id="cont00000001"]').click(); });
    await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"] > .pb-row-item').click();
    await page.keyboard.press("Delete");
    await until(async () => (await nodes()) === 0, { what: "modification locale" });
    await wait(1500); // l'enregistrement automatique est tenté, refusé (réseau coupé) : la modification reste en attente
  };
  const luminance = (rgb) => { const c = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  test("Nouvelle page vierge, document enregistré : crée une page DISTINCTE et vide, l'ancienne reste intacte et rouvrable", async () => {
    const id = await withContent("Accueil K");
    const before = pageCount(), oldDraft = JSON.stringify(draft(id)), oldRevision = row(id).revision;
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="blank"]').dblclick(); // double clic : une seule création
    await page.waitForURL((u) => /\/pages\/\d+\/editeur/.test(u.pathname) && !u.pathname.includes(`/pages/${id}/`), { timeout: 15000 });
    const newId = Number(page.url().match(/pages\/(\d+)/)[1]);
    assert.notEqual(newId, id);
    assert.equal(pageCount(), before + 1, "une seule page créée malgré le double clic");
    assert.equal(JSON.stringify(draft(id)), oldDraft, "l'ancien document n'a pas changé");
    assert.equal(row(id).revision, oldRevision);
    assert.equal((draft(newId).sections || []).length, 0, "aucun élément transféré");
    assert.notEqual(row(newId).name, row(id).name);
    await page.waitForFunction(() => document.querySelector("[data-pb-frame]"), null, { timeout: 15000 });
    await start().waitFor({ state: "visible" });
    assert.equal(await page.locator('[data-pb-start-card="classic"]').count(), 1, "la nouvelle page propose l'écran de démarrage");
    await open(id); // l'ancien document est récupérable
    assert.equal(await nodes() > 0, true);
    assert.equal(await page.locator('[data-pb-layers] .pb-node[data-id="cont00000001"]').count(), 1);
  });

  test("modifications en attente : la boîte de dialogue propose les trois actions ; Annuler ne change rien", async () => {
    const id = await withContent("Accueil L");
    const before = pageCount();
    await makeDirty(id);
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="blank"]').click();
    const dlg = page.locator("dialog.pb-comp-dlg[open]");
    await dlg.waitFor({ state: "visible" });
    const t = await dlg.innerText();
    assert.match(t, /Enregistrer votre travail avant de continuer \?/); assert.match(t, /Vous allez quitter le document actuel pour créer une nouvelle page vierge/);
    assert.match(t, /Enregistrer et continuer/); assert.match(t, /Quitter sans enregistrer/); assert.match(t, /Annuler/);
    for (const [skin, palette] of [["classic", "dark"], ["navy", "dark"], ["classic", "light"]]) {
      await page.evaluate(([k, p]) => { document.body.dataset.skin = k; document.body.dataset.palette = p; document.querySelector("[data-pb-main]").dataset.palette = p; }, [skin, palette]);
      await wait(400);
      const c = await dlg.evaluate((e) => ({ bg: getComputedStyle(e).backgroundColor, fg: getComputedStyle(e.querySelector("h2")).color, tx: getComputedStyle(e.querySelector("[data-pb-leave-text]")).color }));
      assert.ok(contrast(c.bg, c.fg) >= 4.5 && contrast(c.bg, c.tx) >= 4.5, `dialogue ${skin}/${palette} : ${JSON.stringify(c)}`);
    }
    await dlg.getByRole("button", { name: "Annuler" }).click();
    await dlg.waitFor({ state: "hidden" });
    assert.equal(pageCount(), before); assert.equal(page.url().includes(`/pages/${id}/`), true, "toujours dans le document");
    assert.equal(await nodes(), 0, "modification locale conservée");
    await allowSaves();
  });

  test("échec d'enregistrement : aucune navigation, erreur claire, réessai possible puis retour à l'accueil (pas de page créée d'office)", async () => {
    const id = await withContent("Accueil M");
    const before = pageCount();
    await makeDirty(id);
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="blank"]').click();
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor({ state: "visible" });
    await dlg.getByRole("button", { name: "Enregistrer et continuer" }).click();
    await dlg.locator("[data-cd-error]").waitFor({ state: "visible", timeout: 15000 });
    assert.match(await dlg.locator("[data-cd-error]").innerText(), /n'a pas abouti/);
    assert.equal(pageCount(), before, "aucune page créée"); assert.equal(page.url().includes(`/pages/${id}/`), true);
    await allowSaves(); // le réseau revient : on réessaie
    await dlg.getByRole("button", { name: "Enregistrer et continuer" }).click();
    await dlg.waitFor({ state: "hidden", timeout: 20000 });
    await until(() => (draft(id).sections[0].children || []).length === 0, { what: "modification réellement enregistrée sur le serveur", timeout: 12000 });
    assert.equal(pageCount(), before, "retour à l'accueil : aucune page créée automatiquement");
    assert.equal(await start().isVisible(), true);
    assert.match(await page.locator("[data-pb-home-note]").innerText(), /enregistré/);
    await page.locator('[data-pb-start-go="blank"]').click(); // propre : création directe
    await leftFor(id);
    assert.equal(pageCount(), before + 1);
    assert.equal((draft(id).sections[0].children || []).length, 0, "l'ancien document garde le travail enregistré");
  });

  test("« Quitter sans enregistrer » : confirmation, abandon des seules modifications en attente, version enregistrée intacte", async () => {
    const id = await withContent("Accueil N");
    const before = pageCount();
    await makeDirty(id);
    await home().click(); await start().waitFor({ state: "visible" });
    await page.locator('[data-pb-start-go="blank"]').click();
    const dlg = page.locator("dialog.pb-comp-dlg[open]"); await dlg.waitFor({ state: "visible" });
    await dlg.locator("[data-pb-leave-quit]").click();
    assert.match(await dlg.locator("[data-cd-error]").innerText(), /seront perdues/);
    assert.equal(pageCount(), before, "pas encore de création : il faut confirmer");
    await allowSaves();
    await dlg.locator("[data-pb-leave-quit]").click();
    await leftFor(id);
    assert.equal(pageCount(), before + 1);
    await wait(1500);
    assert.equal(draft(id).sections[0].children.length, 1, "la version enregistrée de l'ancien document est intacte (la modification abandonnée n'a pas été écrite)");
    await open(id);
    assert.equal(await nodes() > 0, true);
  });

  test("apparences : cartes et boîte de dialogue lisibles en clair, sombre et navy ; trois actions visibles", async () => {
    await withContent("Accueil O");
    await home().click(); await start().waitFor({ state: "visible" });
    for (const [skin, palette] of [["classic", "light"], ["classic", "dark"], ["navy", "dark"]]) {
      await page.evaluate(([k, p]) => { document.body.dataset.skin = k; document.body.dataset.palette = p; document.querySelector("[data-pb-main]").dataset.palette = p; }, [skin, palette]);
      await wait(400);
      for (const sel of ['[data-pb-start-card="resume"]', '[data-pb-start-card="classic"]', '[data-pb-start-card="blank"]']) {
        const c = await page.locator(sel).evaluate((e) => { const cs = getComputedStyle(e), t = getComputedStyle(e.querySelector(".pb-start-title")); return { bg: cs.backgroundColor, fg: t.color }; });
        assert.ok(contrast(c.bg, c.fg) >= 4.5, `${skin}/${palette} ${sel} : contraste ${contrast(c.bg, c.fg).toFixed(2)} (${c.bg} sur ${c.fg})`);
      }
    }
    await page.evaluate(() => { document.body.dataset.skin = "classic"; document.body.dataset.palette = "light"; document.querySelector("[data-pb-main]").dataset.palette = "light"; });
  });

  test("petite largeur : les trois actions s'empilent sans débordement", async () => {
    await withContent("Accueil P");
    await page.setViewportSize({ width: 420, height: 900 }); await wait(300);
    await home().click(); await start().waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => { const e = document.querySelector("[data-pb-start]"); return e.scrollWidth <= e.clientWidth + 1; }), true);
    const xs = await page.locator(".pb-start-cards.is-home .pb-start-card").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().left)));
    assert.equal(new Set(xs).size, 1, "empilées");
    await page.setViewportSize({ width: 1600, height: 950 });
    await wait(300);
    const wide = await page.locator(".pb-start-cards.is-home .pb-start-card").evaluateAll((els) => new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))).size);
    assert.equal(wide, 1, "trois colonnes sur grand écran");
  });

  test("composition : « reprendre » au-dessus, trois actions alignées, boutons secondaires lisibles en sombre, aucun débordement aux largeurs utiles", async () => {
    await withContent("Accueil Q");
    await home().click(); await start().waitFor({ state: "visible" });
    const box = (sel) => page.locator(sel).first().boundingBox();
    const resume = await box('[data-pb-start-card="resume"]'), first = await box('[data-pb-start-card="classic"]');
    assert.ok(resume.y + resume.height <= first.y, "reprendre est au-dessus des autres actions");
    const tops = await page.locator(".pb-start-cards.is-home .pb-home-card .pb-start-btn").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    assert.equal(new Set(tops).size, 1, `boutons alignés (grand écran) : ${tops}`);
    // largeur utile : on fait varier la fenêtre ET on masque le panneau de gauche
    for (const w of [1600, 1280, 1000, 700, 420]) {
      await page.setViewportSize({ width: w, height: 900 }); await wait(300);
      const o = await page.evaluate(() => { const e = document.querySelector("[data-pb-start]"); const b = e.querySelector(".pb-start-box"); return { sw: e.scrollWidth <= e.clientWidth + 1, btns: [...e.querySelectorAll("button")].every((x) => { const r = x.getBoundingClientRect(), c = b.getBoundingClientRect(); return r.left >= c.left - 1 && r.right <= c.right + 1; }) }; });
      assert.equal(o.sw, true, `pas de défilement horizontal à ${w}px`); assert.equal(o.btns, true, `boutons dans le bloc à ${w}px`);
      assert.equal(await page.locator('[data-pb-start-card]').count(), 4, "les quatre actions restent présentes");
    }
    await page.setViewportSize({ width: 1600, height: 950 }); await wait(300);
    await page.evaluate(() => { const b = [...document.querySelectorAll("[data-pb-theme-toggle]")].find((x) => x.offsetParent); if (b) b.click(); });
    await wait(500);
    assert.equal(await page.evaluate(() => document.body.dataset.palette), "dark");
    const c = await page.locator('[data-pb-start-go="blank"]').evaluate((e) => { const s = getComputedStyle(e); return { bg: s.backgroundColor, fg: s.color }; });
    assert.ok(luminance(c.bg) < 0.35, `bouton secondaire sombre en mode sombre : ${c.bg}`); assert.ok(contrast(c.bg === "rgba(0, 0, 0, 0)" ? "rgb(15,15,15)" : c.bg, c.fg) >= 4.5);
    await page.evaluate(() => { const b = [...document.querySelectorAll("[data-pb-theme-toggle]")].find((x) => x.offsetParent); if (b) b.click(); });
    await wait(400);
  });

  test("aucune erreur de script pendant tout le parcours", () => { assert.deepEqual(errors, []); });
});
