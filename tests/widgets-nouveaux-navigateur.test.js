// Nouveaux widgets dans un VRAI Chrome : insertion depuis la bibliothèque, éditeur de liste (ajouter, modifier, réordonner, supprimer),
// enregistrement et rechargement, annuler / rétablir, duplication, et comportements réels sur la page publiée (déplier « Lire la suite »,
// navigation du carrousel, boucle). Ignoré (avec la raison) si Playwright ou Chrome sont absents.
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

describe("nouveaux widgets : éditeur et page publiée (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId;
  const db = () => srv.db();
  const until = async (fn, what, ms = 15000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 40000 });
  const draft = () => { const r = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections) }; };
  const found = (type) => { const out = []; const walk = (n) => { if (n && n.type === type) out.push(n); ((n && n.children) || []).forEach(walk); }; draft().sections.forEach(walk); return out; };
  const add = async (key) => { await page.evaluate((k) => document.querySelector(`.pb-pal-item[data-widget="${k}"]`).click(), key); };
  const saved = async () => { await page.keyboard.press("Control+s"); await until(() => !db().prepare("SELECT 1").get() || true, "tick"); await wait(1800); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: "Nouveaux widgets" })).location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`); await ready(); await wait(2500);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("les 6 widgets sont dans la bibliothèque, dans la bonne catégorie, avec leur description en infobulle ; la recherche les trouve", async () => {
    const info = await page.evaluate(() => ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel", "mediacarousel", "facebookpage", "instagrampost", "tiktokvideo", "youtubeplaylist"].map((k) => { const b = document.querySelector(`.pb-pal-item[data-widget="${k}"]`); return b ? { k, group: b.closest("[data-group]").dataset.group, tip: b.getAttribute("data-tip") || "" } : { k, absent: true }; }));
    assert.deepEqual(info.filter((i) => i.absent), [], "présents");
    const g = Object.fromEntries(info.map((i) => [i.k, i.group]));
    assert.equal(g.readmore, "basic"); assert.equal(g.linkinbio, "social"); assert.equal(g.slides, "general"); assert.equal(g.facebookpage, "social");
    const desc = info.filter((i) => ["readmore", "slides", "linkinbio"].includes(i.k)).map((i) => i.tip);
    assert.ok(desc.every((t) => t.length > 10), `infobulles (description du widget) : ${desc.join(" | ")}`);
  });

  test("insertion, réglages réels et persistance : Lire la suite, Texte sur un tracé, Lien en bio, Diaporama, Carrousel de témoignages", async () => {
    for (const k of ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel"]) { await add(k); await wait(500); }
    await saved();
    for (const t of ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel"]) assert.equal(found(t).length, 1, `${t} inséré et enregistré`);
    // le canevas affiche réellement chaque widget
    const inCanvas = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return ["readmore", "textpath", "linkinbio", "slides", "testimonialcarousel"].map((t) => !!d.querySelector(`.kw-${t}`)); });
    assert.deepEqual(inCanvas, [true, true, true, true, true]);
    assert.deepEqual(errors, []);
  });

  test("éditeur de liste (Lien en bio) : ajouter, modifier, réordonner, supprimer ; le canevas suit ; annuler / rétablir", async () => {
    const id = found("linkinbio")[0].id;
    await page.evaluate((id) => { const r = document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`); r.scrollIntoView({ block: "center" }); r.click(); }, id);
    await until(() => page.evaluate(() => !!document.querySelector("[data-pb-inspector] .pb-items")), "éditeur de liste ouvert");
    const count = () => page.evaluate(() => document.querySelectorAll("[data-pb-inspector] .pb-items-item").length);
    const canvasLinks = () => page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll(".kw-lib-link span:last-child")].map((e) => e.textContent));
    assert.equal(await count(), 2);
    // ajouter
    await page.locator("[data-pb-inspector] .pb-items > button", { hasText: "Ajouter un élément" }).click();
    await until(async () => (await count()) === 3, "élément ajouté");
    // modifier le texte du 3e bouton
    const label3 = page.locator("[data-pb-inspector] .pb-items-item").nth(2).locator("input[type=text]").first();
    await label3.fill("Nouveau lien"); await label3.press("Tab");
    await until(async () => (await canvasLinks()).includes("Nouveau lien"), "canevas mis à jour");
    // réordonner : monter le 3e
    await page.locator("[data-pb-inspector] .pb-items-item").nth(2).locator('button[aria-label^="Monter"]').click();
    await until(async () => (await canvasLinks())[1] === "Nouveau lien", `ordre changé (liens du canevas : ${(await canvasLinks()).join(" | ")} ; éléments : ${await page.evaluate(() => [...document.querySelectorAll("[data-pb-inspector] .pb-items-item")].map((e) => e.querySelector("input[type=text]").value).join(" | "))})`);
    // annuler (ordre), rétablir
    await page.locator("[data-pb-undo]").click();
    await until(async () => (await canvasLinks())[2] === "Nouveau lien", "annulation de l'ordre");
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await canvasLinks())[1] === "Nouveau lien", "rétablissement");
    // supprimer (l'annulation / le rétablissement ont pu fermer l'inspecteur : on sélectionne de nouveau le widget)
    await page.evaluate((id) => { document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); }, id);
    await until(async () => (await count()) === 3, "inspecteur rouvert");
    await page.locator("[data-pb-inspector] .pb-items-item").nth(1).locator('button[aria-label^="Supprimer"]').click();
    await until(async () => (await count()) === 2 && !(await canvasLinks()).includes("Nouveau lien"), "élément supprimé");
    // le minimum est respecté : le dernier élément ne se supprime pas
    await page.locator("[data-pb-inspector] .pb-items-item").nth(1).locator('button[aria-label^="Supprimer"]').click();
    await until(async () => (await count()) === 1, "un seul reste");
    assert.equal(await page.locator("[data-pb-inspector] .pb-items-item").first().locator('button[aria-label^="Supprimer"]').isDisabled(), true, "le minimum (1 lien) est protégé");
    await saved();
    assert.equal(found("linkinbio")[0].props.links.length, 1, "liste enregistrée");
  });

  test("après rechargement : la liste et les réglages sont restaurés ; dupliquer garde la liste", async () => {
    await page.reload(); await ready(); await wait(1500);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll(".kw-lib-link").length), 1);
    const id = found("linkinbio")[0].id;
    await page.evaluate((id) => { document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`).click(); }, id);
    await wait(500); await page.keyboard.press("Control+d"); await wait(900); await saved();
    const all = found("linkinbio");
    assert.equal(all.length, 2, "dupliqué");
    assert.deepEqual(all[1].props.links, all[0].props.links, "la copie garde la liste");
    assert.notEqual(all[0].id, all[1].id, "identifiants distincts");
  });

  test("page publiée : « Lire la suite » se déplie et se replie réellement ; le diaporama navigue (suivant / précédent, points)", async () => {
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = draft();
    content.sections = content.sections.filter((x) => x.type === "layout"); // la page neuve contient aussi des sections prêtes (dont un formulaire) : on ne publie que nos widgets
    // le diaporama a 2 diapositives par défaut ; on ajoute un texte plus long pour tester le dépliage
    const rm = found("readmore")[0]; rm.props.more = "Suite cachée du texte.";
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 400));
    const pb = await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } });
    assert.equal(pb.status, 200, pb.text.slice(0, 500));
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const pub = await context.newPage();
    await pub.goto(`${srv.base}/p/${slug}`); await pub.waitForSelector(".kw-slides.is-enhanced, .kw-slides .kw-carousel-btn", { timeout: 20000 });
    // Lire la suite
    const details = pub.locator(".kw-readmore-more").first();
    assert.equal(await details.evaluate((d) => d.open), false);
    assert.equal(await pub.locator(".kw-readmore-body").first().isVisible(), false, "suite cachée au départ");
    await pub.locator(".kw-readmore-toggle").first().click();
    await until(() => details.evaluate((d) => d.open), "déplié");
    assert.equal(await pub.locator(".kw-readmore-body").first().isVisible(), true);
    assert.equal(await pub.locator(".kw-readmore-close").first().isVisible(), true, "le lien devient « Réduire »");
    await pub.locator(".kw-readmore-toggle").first().click();
    await until(async () => !(await details.evaluate((d) => d.open)), "replié");
    // Diaporama : navigation réelle
    const track = pub.locator(".kw-slides .kw-carousel-track").first();
    const pos = () => track.evaluate((t) => Math.round(t.scrollLeft));
    assert.equal(await pos(), 0);
    await pub.locator(".kw-slides .kw-carousel-btn.is-next").first().click();
    await until(async () => (await pos()) > 100, "diapositive suivante");
    await pub.locator(".kw-slides .kw-carousel-btn.is-prev").first().click();
    await until(async () => (await pos()) < 5, "retour à la première");
    const dots = await pub.locator(".kw-slides .kw-carousel-dot").count();
    assert.equal(dots, 2, "un point par diapositive");
    await pub.locator(".kw-slides .kw-carousel-dot").nth(1).click();
    await until(async () => (await pos()) > 100, "point cliqué : 2e diapositive");
    assert.deepEqual(errors, []);
    await pub.close();
  });
});
