// Éditeur de pages — canevas, structures Flexbox / Grille, calques (Structure) et panneau détachable, dans un VRAI navigateur
// (Chrome piloté par Playwright) contre un vrai serveur : chaque scénario clique comme le ferait une personne, puis relit
// le résultat dans le canevas, dans l'arbre des calques ET dans le brouillon enregistré en base.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, createCourse } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    let v = null;
    // Le canevas se recharge après chaque modification : une lecture interrompue par ce rechargement est simplement refaite
    try { v = await check(); } catch (error) { last = error; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}

describe("structure : canevas, Flexbox, Grille, calques et panneau détachable (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, n = 0;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const draft = () => {
    const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId);
    return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) };
  };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const saved = async (check, what) => until(() => { const c = draft(); return check(c) ? c : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const ready = async () => {
    await page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
    await wait(250);
  };
  async function openEditor() {
    n += 1;
    const r = await boss.post("/marketing/pages", { name: `Structure ${n}` });
    pageId = Number(r.location.match(/(\d+)$/)[1]);
    // Une page neuve contient un bandeau et un formulaire de départ : on la vide pour tester le canevas vide
    const revision = Number(db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision);
    const cleared = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: { sections: [] } }, headers: { Origin: srv.base } });
    assert.equal(cleared.status, 200, `page vidée : ${cleared.text.slice(0, 120)}`);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
  }
  const rows = () => page.locator("[data-pb-layers] .pb-node");
  const styleTab = async () => { await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click().catch(() => {}); };
  const openGroup = async (group) => { const det = page.locator(`[data-pb-inspector] details[data-group="${group}"]`).first(); if ((await det.count()) && !(await det.evaluate((d) => d.open))) await det.locator("> summary").click(); };
  const dialog = () => page.locator("[data-pb-layout]");
  async function pick(kind, key) {
    await dialog().locator(`.pb-kind[data-kind="${kind}"]`).click();
    await dialog().locator(`.pb-structure[data-structure="${key}"]`).click();
    await until(async () => !(await dialog().evaluate((d) => d.open)), { what: "fenêtre fermée" });
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1500, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("T1 canevas vide : un seul « + », rien d'autre dans la zone", async () => {
    await openEditor();
    const zone = frame().locator(".kw-empty-page");
    await zone.waitFor();
    assert.equal(await zone.locator("button").count(), 1, "un seul bouton");
    assert.equal((await zone.locator("button").innerText()).trim(), "+");
    assert.equal(await zone.locator("a, img, svg, input, select").count(), 0, "aucun dossier, IA, bibliothèque ni raccourci");
    assert.equal((await zone.innerText()).trim(), "+", "aucun texte décoratif");
  });

  test("T2 « + » : « Quelle mise en page utiliser ? » avec Flexbox et Grille, fermeture possible", async () => {
    await frame().locator("[data-kw-add='root']").click();
    await dialog().waitFor({ state: "visible" });
    assert.equal((await dialog().locator("[data-pb-layout-title]").innerText()).trim(), "Quelle mise en page utiliser ?");
    const kinds = await dialog().locator(".pb-kind .pb-kind-name").allInnerTexts();
    assert.deepEqual(kinds, ["FLEXBOX", "GRILLE"]);
    await dialog().locator("[data-pb-close]").click();
    assert.equal(await dialog().evaluate((d) => d.open), false, "fermée par le bouton");
    await frame().locator("[data-kw-add='root']").click();
    await page.keyboard.press("Escape");
    assert.equal(await dialog().evaluate((d) => d.open), false, "fermée par Échap");
    assert.equal(draft().sections.length, 0, "fermer n'a rien créé");
  });

  test("T3 Flexbox : structures disponibles (colonnes, asymétriques, lignes, combinaisons)", async () => {
    await frame().locator("[data-kw-add='root']").click();
    await dialog().locator(".pb-kind[data-kind='flex']").click();
    const names = await dialog().locator(".pb-structure .pb-structure-name").allInnerTexts();
    assert.ok(names.length >= 12, `${names.length} structures`);
    for (const label of ["Une colonne", "Deux colonnes", "Trois colonnes", "Quatre colonnes", "Deux lignes"]) assert.ok(names.includes(label), label);
    assert.ok(names.some((x) => /un tiers, deux tiers/.test(x)), "asymétrique");
    assert.ok(names.some((x) => /deux à droite/.test(x)), "combinaison imbriquée");
    // retour au choix Flexbox / Grille
    await dialog().locator(".pb-layout-back").click();
    assert.equal((await dialog().locator("[data-pb-layout-title]").innerText()).trim(), "Quelle mise en page utiliser ?");
    await page.keyboard.press("Escape");
  });

  test("T4 une structure choisie crée une VRAIE structure Flexbox (document, canevas, calques, enregistrement)", async () => {
    await frame().locator("[data-kw-add='root']").click();
    await pick("flex", "flex-3");
    const doc = await saved((c) => nodesOf(c.sections).filter((x) => x.type === "container").length === 4, "trois colonnes");
    const root = doc.sections[0].children[0];
    assert.equal(doc.sections[0].type, "layout");
    assert.equal(root.type, "container");
    assert.equal(root.styles.desktop.display, "flex");
    assert.equal(root.styles.desktop.flexDirection, "row");
    assert.equal(root.children.length, 3);
    for (const cell of root.children) { assert.equal(cell.styles.desktop.flexBasis, "33.33%"); assert.equal(cell.styles.desktop.flexGrow, 0); }
    // canevas : trois cases côte à côte, de largeur égale
    const boxes = await frame().locator(".kw-container .kw-container").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width }; }));
    assert.equal(boxes.length, 3);
    assert.ok(Math.abs(boxes[0].y - boxes[2].y) < 2, "alignées");
    assert.ok(boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x, "côte à côte");
    assert.ok(Math.abs(boxes[0].w - boxes[1].w) < 3 && Math.abs(boxes[1].w - boxes[2].w) < 3, "largeurs égales");
    const css = await frame().locator(".kw-container").first().evaluate((e) => getComputedStyle(e).display);
    assert.equal(css, "flex");
    // calques : section > conteneur > trois cases, chacune avec son « + » dans le canevas
    assert.equal(await rows().count(), 5);
    assert.equal(await frame().locator(".kw-container .kw-container > .kw-add").count(), 3);
  });

  test("T5 imbrication réelle : un conteneur dans un conteneur dans un conteneur", async () => {
    await frame().locator(".kw-container .kw-container > .kw-add").first().click();
    await pick("flex", "flex-2");
    const doc = await saved((c) => nodesOf(c.sections).filter((x) => x.type === "container").length === 7, "deux colonnes imbriquées");
    const root = doc.sections[0].children[0];
    const first = root.children[0];
    assert.equal(first.children.length, 1, "la première case contient maintenant une structure");
    assert.equal(first.children[0].type, "container");
    assert.equal(first.children[0].children.length, 2, "…de deux cases");
    // profondeur dans les calques
    const levels = await page.locator("[data-pb-layers] .pb-node").evaluateAll((els) => els.map((e) => Number(e.getAttribute("aria-level"))));
    assert.equal(Math.max(...levels), 5, "section > conteneur > case > conteneur > case");
    // le canevas montre le troisième niveau
    assert.equal(await frame().locator(".kw-container .kw-container .kw-container").count(), 3, "le troisième et le quatrième niveau sont dessinés");
  });

  test("T8 / T9 sélection : canevas → calque, puis calque → canevas (un seul état partagé)", async () => {
    const doc = draft();
    const second = doc.sections[0].children[0].children[1];
    // canevas → calque
    await frame().locator(`[data-node-id="${second.id}"]`).click({ position: { x: 5, y: 5 } });
    await until(async () => (await page.locator(`[data-pb-layers] .pb-node[data-id="${second.id}"]`).getAttribute("aria-selected")) === "true", { what: "calque sélectionné" });
    assert.equal(await page.locator("[data-pb-layers] .pb-node[aria-selected='true']").count(), 1);
    // calque → canevas
    const third = doc.sections[0].children[0].children[2];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${third.id}"] > .pb-row-item`).click();
    await until(async () => frame().locator(`[data-node-id="${third.id}"].is-selected`).count().then((c) => c === 1), { what: "élément sélectionné dans le canevas" });
    assert.equal(await frame().locator(".is-selected").count(), 1);
  });

  test("T10 glisser-déposer dans Structure : l'arbre du document change réellement", async () => {
    const doc = draft();
    const root = doc.sections[0].children[0];
    const [, b, c] = root.children;
    const rowB = page.locator(`[data-pb-layers] .pb-node[data-id="${b.id}"] > .pb-row-item`);
    const rowC = page.locator(`[data-pb-layers] .pb-node[data-id="${c.id}"] > .pb-row-item`);
    await rowC.dragTo(rowB, { targetPosition: { x: 40, y: (await rowB.boundingBox()).height / 2 } });
    const after = await saved((d) => { const r = d.sections[0].children[0]; return r.children.length === 2 && r.children[1].children.some((x) => x.id === c.id); }, "case déplacée dans la deuxième");
    assert.equal(after.sections[0].children[0].children[1].children[0].id, c.id);
    assert.equal(await frame().locator(`[data-node-id="${b.id}"] [data-node-id="${c.id}"]`).count(), 1, "le canevas reflète le déplacement");
  });

  test("T11 / T12 annuler puis rétablir : l'état exact est restauré", async () => {
    const before = JSON.stringify(draft().sections);
    await page.locator("[data-pb-undo]").click();
    await saved((d) => JSON.stringify(d.sections) !== before && d.sections[0].children[0].children.length === 3, "annulé");
    assert.equal(draft().sections[0].children[0].children.length, 3);
    await page.locator("[data-pb-redo]").click();
    await saved((d) => JSON.stringify(d.sections) === before, "rétabli");
  });

  test("T13 / T14 enregistrer, quitter, revenir : structure identique", async () => {
    const before = JSON.stringify(draft().sections);
    const tree = await page.locator("[data-pb-layers] .pb-node").evaluateAll((els) => els.map((e) => `${e.getAttribute("aria-level")}:${e.dataset.id}`));
    const deep = await frame().locator(".kw-container .kw-container .kw-container").count();
    await page.locator("[data-pb-save-now]").click();
    await page.goto("about:blank");
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    assert.equal(JSON.stringify(draft().sections), before, "document identique");
    const again = await page.locator("[data-pb-layers] .pb-node").evaluateAll((els) => els.map((e) => `${e.getAttribute("aria-level")}:${e.dataset.id}`));
    assert.deepEqual(again, tree, "calques identiques (ordre, niveaux, identifiants)");
    assert.equal(await frame().locator(".kw-container .kw-container .kw-container").count(), deep, "canevas identique");
  });

  test("T6 Grille : une vraie grille, avec ses cases", async () => {
    await openEditor();
    await frame().locator("[data-kw-add='root']").click();
    await pick("grid", "grid-3x2");
    const doc = await saved((c) => nodesOf(c.sections).some((x) => x.type === "grid"), "grille");
    const grid = doc.sections[0].children[0];
    assert.equal(grid.type, "grid");
    assert.equal(grid.styles.desktop.columns, 3);
    assert.equal(grid.styles.desktop.gridRows, 2);
    assert.equal(grid.children.length, 6);
    const css = await frame().locator(".kw-grid").evaluate((e) => ({ d: getComputedStyle(e).display, cols: getComputedStyle(e).gridTemplateColumns.split(" ").length }));
    assert.deepEqual(css, { d: "grid", cols: 3 });
    assert.equal(await frame().locator(".kw-grid > .kw-container").count(), 6);
  });

  test("T7 modifier la grille dans l'inspecteur : le canevas change réellement (colonnes, écart, placement d'une case)", async () => {
    const grid = draft().sections[0].children[0];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${grid.id}"] > .pb-row-item`).click();
    await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click().catch(() => {});
    const columns = page.locator("[data-pb-inspector] [data-prop='columns'] input");
    await columns.waitFor();
    await columns.fill("4");
    await columns.press("Tab");
    await until(async () => (await frame().locator(".kw-grid").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length)) === 4, { what: "quatre colonnes dans le canevas" });
    await saved((c) => { const g = nodesOf(c.sections).find((x) => x.type === "grid"); return g && g.styles && g.styles.desktop && g.styles.desktop.columns === 4; }, "4 colonnes");
    // placement d'une case : début de colonne et étendue
    const cell = grid.children[0];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${cell.id}"] > .pb-row-item`).click();
    const span = page.locator("[data-pb-inspector] [data-prop='gridColumnSpan'] input");
    await span.waitFor();
    await span.fill("2");
    await span.press("Tab");
    await until(async () => (await frame().locator(`[data-node-id="${cell.id}"]`).evaluate((e) => getComputedStyle(e).gridColumnStart)) === "span 2", { what: "case sur deux colonnes" });
    const start = page.locator("[data-pb-inspector] [data-prop='gridColumnStart'] input");
    await start.fill("3");
    await start.press("Tab");
    await until(async () => (await frame().locator(`[data-node-id="${cell.id}"]`).evaluate((e) => `${getComputedStyle(e).gridColumnStart} / ${getComputedStyle(e).gridColumnEnd}`)) === "3 / span 2", { what: "colonne 3, sur deux colonnes" });
    const saved3 = await saved((c) => { const x = nodesOf(c.sections).find((n) => n.id === cell.id); return x && x.styles && x.styles.desktop && x.styles.desktop.gridColumnStart === 3 && x.styles.desktop.gridColumnSpan === 2; }, "placement enregistré");
    assert.ok(saved3);
  });

  test("T15 responsive : Desktop 3 colonnes → Tablette 2 → Mobile 1 (réel et enregistré)", async () => {
    const grid = draft().sections[0].children[0];
    assert.equal(grid.styles.tablet.columns, 2);
    assert.equal(grid.styles.mobile.columns, 1);
    const cols = () => frame().locator(".kw-grid").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length);
    await page.locator("[data-device='tablet']").first().click();
    await until(async () => (await cols()) === 2, { what: "tablette : 2 colonnes" });
    await page.locator("[data-device='mobile']").first().click();
    await until(async () => (await cols()) === 1, { what: "mobile : 1 colonne" });
    await page.locator("[data-device='desktop']").first().click();
    await until(async () => (await cols()) === 4, { what: "ordinateur : 4 colonnes (modifiées)" });
    // une valeur propre à la tablette, modifiée dans l'éditeur, persiste
    await page.locator("[data-device='tablet']").first().click();
    await page.locator(`[data-pb-layers] .pb-node[data-id="${grid.id}"] > .pb-row-item`).click();
    const columns = page.locator("[data-pb-inspector] [data-prop='columns'] input");
    await columns.waitFor();
    await columns.fill("3");
    await columns.press("Tab");
    await saved((c) => { const g = nodesOf(c.sections).find((x) => x.type === "grid"); return g && g.styles && g.styles.tablet && g.styles.tablet.columns === 3; }, "tablette : 3 colonnes");
    await until(async () => (await cols()) === 3, { what: "tablette : 3 colonnes dans le canevas" });
    await page.locator("[data-device='desktop']").first().click();
  });

  test("T15b responsive Flexbox : trois colonnes en ligne → deux par ligne sur tablette → empilées sur mobile", async () => {
    await openEditor();
    await frame().locator("[data-kw-add='root']").click();
    await pick("flex", "flex-3");
    await saved((c) => nodesOf(c.sections).filter((x) => x.type === "container").length === 4, "trois colonnes");
    const cells = () => frame().locator(".kw-container .kw-container").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) }; }));
    let c = await cells();
    assert.ok(c[0].y === c[1].y && c[1].y === c[2].y, "ordinateur : sur une ligne");
    await page.locator("[data-device='tablet']").first().click();
    await until(async () => { const t = await cells(); return t.length === 3 && t[0].y === t[1].y && t[2].y > t[0].y; }, { what: "tablette : deux par ligne puis une" });
    c = await cells();
    assert.ok(c[2].w > c[0].w, "la troisième occupe toute la ligne");
    await page.locator("[data-device='mobile']").first().click();
    await until(async () => { const t = await cells(); return t.length === 3 && t[0].y < t[1].y && t[1].y < t[2].y; }, { what: "mobile : empilées" });
    c = await cells();
    assert.ok(Math.abs(c[0].w - c[1].w) < 3 && Math.abs(c[1].w - c[2].w) < 3, "même largeur");
    await page.locator("[data-device='desktop']").first().click();
  });

  test("T16 / T17 / T18 panneau Structure : détacher, déplacer, redimensionner, fermer, rouvrir, rattacher — synchronisation conservée", async () => {
    const panel = page.locator("[data-pb-layers-panel]");
    const root = draft().sections[0].children[0];
    const cell = root.children[1];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${cell.id}"] > .pb-row-item`).click();
    const treeBefore = await page.locator("[data-pb-layers] .pb-node").evaluateAll((els) => els.map((e) => e.dataset.id));
    // détacher
    await page.locator("[data-pb-layers-dock]").click();
    await until(async () => panel.evaluate((e) => e.classList.contains("is-floating")), { what: "panneau flottant" });
    assert.equal(await panel.evaluate((e) => getComputedStyle(e).position), "fixed");
    assert.equal(await page.locator("[data-pb-right]").evaluate((e) => e.classList.contains("is-layers-detached")), true);
    assert.equal(await page.locator("[data-pb-inspector]").isVisible(), true, "l'inspecteur prend la place libérée");
    assert.deepEqual(await page.locator("[data-pb-layers] .pb-node").evaluateAll((els) => els.map((e) => e.dataset.id)), treeBefore, "même contenu");
    assert.equal(await page.locator(`[data-pb-layers] .pb-node[data-id="${cell.id}"]`).getAttribute("aria-selected"), "true", "sélection conservée");
    // déplacer par l'en-tête
    const head = page.locator("[data-pb-layers-head]");
    const b0 = await panel.boundingBox();
    const hb = await head.boundingBox();
    await page.mouse.move(hb.x + 60, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x + 60 - 220, hb.y + hb.height / 2 + 90, { steps: 6 });
    await page.mouse.up();
    const b1 = await panel.boundingBox();
    assert.ok(Math.abs((b0.x - b1.x) - 220) < 6 && Math.abs((b1.y - b0.y) - 90) < 6, `déplacé (${b0.x},${b0.y}) → (${b1.x},${b1.y})`);
    // redimensionner par le coin
    const grip = await page.locator(".pb-float-resize").boundingBox();
    await page.mouse.move(grip.x + 8, grip.y + 8);
    await page.mouse.down();
    await page.mouse.move(grip.x + 8 + 120, grip.y + 8 + 80, { steps: 6 });
    await page.mouse.up();
    const b2 = await panel.boundingBox();
    assert.ok(b2.width > b1.width + 100 && b2.height > b1.height + 60, `agrandi ${b1.width}x${b1.height} → ${b2.width}x${b2.height}`);
    // taille et position mémorisées
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("pb:layers-dock")));
    assert.equal(stored.mode, "floating");
    assert.ok(stored.w >= 340 + 100);
    // la sélection reste synchronisée avec le canevas pendant que le panneau est flottant
    const third = root.children[2];
    await frame().locator(`[data-node-id="${third.id}"]`).click({ position: { x: 5, y: 5 } });
    await until(async () => (await page.locator(`[data-pb-layers] .pb-node[data-id="${third.id}"]`).getAttribute("aria-selected")) === "true", { what: "calque sélectionné (flottant)" });
    // fermer puis rouvrir (il revient en mode flottant, à sa place)
    await page.locator("[data-pb-layers-close]").click();
    assert.equal(await panel.isVisible(), false, "fermé");
    assert.equal(await page.locator("[data-pb-layers-open]").getAttribute("aria-pressed"), "false");
    await page.locator("[data-pb-layers-open]").click();
    await panel.waitFor({ state: "visible" });
    const b3 = await panel.boundingBox();
    assert.ok(Math.abs(b3.x - b2.x) < 2 && Math.abs(b3.width - b2.width) < 2, "position et taille conservées");
    // double-clic sur l'en-tête : rattacher
    await page.locator("[data-pb-layers-dock]").click();
    await until(async () => panel.evaluate((e) => !e.classList.contains("is-floating")), { what: "panneau rattaché" });
    assert.equal(await page.locator("[data-pb-right]").evaluate((e) => e.classList.contains("is-layers-detached")), false);
    assert.equal(await panel.evaluate((e) => getComputedStyle(e).position), "static");
    assert.deepEqual(await page.locator("[data-pb-layers] .pb-node").evaluateAll((els) => els.map((e) => e.dataset.id)), treeBefore, "arbre identique après rattachement");
    assert.equal(await page.locator(`[data-pb-layers] .pb-node[data-id="${third.id}"]`).getAttribute("aria-selected"), "true", "sélection conservée");
    // toujours synchronisé après rattachement
    const first = root.children[0];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${first.id}"] > .pb-row-item`).click();
    await until(async () => frame().locator(`[data-node-id="${first.id}"].is-selected`).count().then((c) => c === 1), { what: "canevas synchronisé après rattachement" });
    // l'état persiste au rechargement
    await page.locator("[data-pb-layers-dock]").click();
    await page.reload();
    await ready();
    assert.equal(await page.locator("[data-pb-layers-panel]").evaluate((e) => e.classList.contains("is-floating")), true, "mode flottant mémorisé");
    await page.locator("[data-pb-layers-dock]").click();
  });

  test("T19 suppression : canevas, calques et document restent synchronisés", async () => {
    const root = draft().sections[0].children[0];
    const victim = root.children[2];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${victim.id}"] > .pb-row-item`).hover();
    await page.locator(`[data-pb-layers] .pb-node[data-id="${victim.id}"] > .pb-row-item .pb-flag-delete`).click();
    await saved((d) => !nodesOf(d.sections).some((x) => x.id === victim.id), "case supprimée du document");
    assert.equal(await page.locator(`[data-pb-layers] .pb-node[data-id="${victim.id}"]`).count(), 0, "plus dans les calques");
    await until(async () => (await frame().locator(`[data-node-id="${victim.id}"]`).count()) === 0, { what: "plus dans le canevas" });
    assert.equal(await frame().locator(".kw-container .kw-container").count(), 2);
    await page.locator("[data-pb-undo]").click();
    await saved((d) => nodesOf(d.sections).some((x) => x.id === victim.id), "suppression annulée");
  });

  test("propriétés Flexbox du conteneur : chaque réglage modifie réellement le rendu", async () => {
    const root = draft().sections[0].children[0];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${root.id}"] > .pb-row-item`).click();
    await styleTab();
    const ctrl = (key) => page.locator(`[data-pb-inspector] [data-prop='${key}']`);
    const css = (prop) => frame().locator(`[data-node-id="${root.id}"]`).evaluate((e, p) => getComputedStyle(e)[p], prop);
    // direction, retour à la ligne, répartition, alignement, répartition des lignes
    for (const [key, value, prop, expected] of [["flexDirection", "column", "flexDirection", "column"], ["flexWrap", "wrap", "flexWrap", "wrap"], ["justifyContent", "space-between", "justifyContent", "space-between"], ["alignItems", "center", "alignItems", "center"], ["alignContent", "center", "alignContent", "center"]]) {
      await ctrl(key).waitFor({ timeout: 6000 }).catch(() => { throw new Error(`contrôle absent de l'inspecteur : ${key}`); });
      // contrôle iconographique (un bouton par valeur) ou liste
      if (await ctrl(key).locator(".pb-iseg").count()) await ctrl(key).locator(`.pb-iseg-btn[data-value="${value}"]`).click();
      else await ctrl(key).locator("select").selectOption(value);
      await until(async () => (await css(prop)) === expected, { what: `${key} = ${value}` });
    }
    // écarts
    for (const [key, prop] of [["rowGap", "rowGap"], ["columnGap", "columnGap"]]) {
      const input = ctrl(key).locator("input").first();
      await input.fill("40px");
      await input.press("Tab");
      await until(async () => (await css(prop)) === "40px", { what: `${key} = 40px` });
    }
    // dimensions
    await openGroup("size");
    for (const [key, prop, value, expected] of [["minHeight", "minHeight", "300px", "300px"], ["maxWidth", "maxWidth", "700px", "700px"]]) {
      const input = page.locator(`[data-pb-inspector] [data-prop='${key}'] input`).first();
      await input.waitFor({ timeout: 6000 }).catch(() => { throw new Error(`contrôle absent de l'inspecteur : ${key}`); });
      await input.fill(value);
      await input.press("Tab");
      await until(async () => (await css(prop)) === expected, { what: `${key} = ${value}px` });
    }
    const out = await saved((c) => { const r = nodesOf(c.sections).find((x) => x.id === root.id); return r.styles.desktop.alignContent === "center" && r.styles.desktop.rowGap === "40px"; }, "réglages Flexbox enregistrés");
    assert.ok(out);
  });

  test("propriétés d'un enfant Flexbox : croissance, rétrécissement, base, ordre, alignement sur soi-même", async () => {
    const root = draft().sections[0].children[0];
    const cell = root.children[0];
    await page.locator(`[data-pb-layers] .pb-node[data-id="${cell.id}"] > .pb-row-item`).click();
    await styleTab();
    const el = frame().locator(`[data-node-id="${cell.id}"]`);
    // Taille flexible et ordre : valeurs libres derrière « personnalisé » (grandir / rétrécir / premier / dernier sinon)
    await page.locator("[data-pb-inspector] .pb-iseg-btn[aria-label='Taille personnalisée']").click();
    await page.locator("[data-pb-inspector] .pb-iseg-btn[aria-label='Ordre personnalisé']").click();
    const set = async (key, value) => { const input = page.locator(`[data-pb-inspector] [data-prop='${key}'] input`).first(); await input.waitFor({ timeout: 6000 }).catch(() => { throw new Error(`contrôle absent de l'inspecteur : ${key}`); }); await input.fill(value); await input.press("Tab"); };
    await set("flexGrow", "2"); await until(async () => (await el.evaluate((e) => getComputedStyle(e).flexGrow)) === "2", { what: "flex-grow" });
    await set("flexShrink", "0"); await until(async () => (await el.evaluate((e) => getComputedStyle(e).flexShrink)) === "0", { what: "flex-shrink" });
    await set("flexBasis", "120px"); await until(async () => (await el.evaluate((e) => getComputedStyle(e).flexBasis)) === "120px", { what: "flex-basis" });
    await set("order", "-2"); await until(async () => (await el.evaluate((e) => getComputedStyle(e).order)) === "-2", { what: "order" });
    await page.locator("[data-pb-inspector] [data-prop='alignSelf'] .pb-iseg-btn[data-value='flex-end']").click();
    await until(async () => (await el.evaluate((e) => getComputedStyle(e).alignSelf)) === "flex-end", { what: "align-self" });
    await saved((c) => { const x = nodesOf(c.sections).find((n) => n.id === cell.id); return x.styles.desktop.order === -2 && x.styles.desktop.flexShrink === 0 && x.styles.desktop.flexGrow === 2; }, "réglages enfant enregistrés");
  });

  test("copier, couper, coller, dupliquer, renommer, masquer, verrouiller depuis les calques", async () => {
    const root = draft().sections[0].children[0];
    const cell = root.children[1];
    const row = page.locator(`[data-pb-layers] .pb-node[data-id="${cell.id}"] > .pb-row-item`);
    const count = () => nodesOf(draft().sections).filter((x) => x.type === "container").length;
    const base = count();
    // dupliquer (menu contextuel)
    await row.click({ button: "right" });
    await page.locator("[data-pb-menu] [role='menuitem']", { hasText: "Dupliquer" }).first().click();
    await saved(() => count() === base + 1, "duplication");
    // renommer
    await row.dblclick();
    await page.locator(".pb-rename").fill("Ma colonne");
    await page.keyboard.press("Enter");
    await saved((c) => nodesOf(c.sections).find((x) => x.id === cell.id).name === "Ma colonne", "renommage");
    assert.ok(await page.locator(`[data-pb-layers] .pb-node[data-id="${cell.id}"] .pb-node-name`).innerText().then((t) => /Ma colonne/.test(t)));
    // masquer
    await row.locator(".pb-flag[data-tip='Masquer']").click();
    await saved((c) => nodesOf(c.sections).find((x) => x.id === cell.id).hidden === true, "masquage");
    await row.locator(".pb-flag[data-tip='Afficher']").click();
    await saved((c) => !nodesOf(c.sections).find((x) => x.id === cell.id).hidden, "affichage");
    // verrouiller
    await row.locator(".pb-flag[data-tip='Verrouiller']").click();
    await saved((c) => nodesOf(c.sections).find((x) => x.id === cell.id).locked === true, "verrouillage");
    await row.locator(".pb-flag[data-tip='Déverrouiller']").click();
    // copier / couper / coller
    await row.click();
    await page.keyboard.press("Control+c");
    await page.keyboard.press("Control+v");
    await saved(() => count() === base + 2, "copier-coller");
    await row.click();
    await page.keyboard.press("Control+x");
    await saved(() => count() === base, "couper (la case et la copie collée à l'intérieur)");
    await page.keyboard.press("Control+v");
    await saved(() => count() === base + 2, "coller après couper");
  });

  test("replier / déplier un niveau : les éléments restent dans le document", async () => {
    const root = draft().sections[0].children[0];
    const before = JSON.stringify(draft().sections);
    const li = page.locator(`[data-pb-layers] .pb-node[data-id="${root.id}"]`);
    const kidsBefore = await page.locator("[data-pb-layers] .pb-node").count();
    await li.locator("> .pb-row-item .pb-twist").click();
    assert.ok((await page.locator("[data-pb-layers] .pb-node").count()) < kidsBefore, "descendants masqués dans le panneau");
    assert.equal(await frame().locator(`[data-node-id="${root.id}"] .kw-container`).count() > 0, true, "toujours dans le canevas");
    assert.equal(JSON.stringify(draft().sections), before, "document inchangé");
    await li.locator("> .pb-row-item .pb-twist").click();
    assert.equal(await page.locator("[data-pb-layers] .pb-node").count(), kidsBefore);
  });

  test("raccourci Ctrl/⌘ + Maj + Y, et rattachement en déposant le panneau flottant sur le panneau de droite", async () => {
    await openEditor();
    const panel = page.locator("[data-pb-layers-panel]");
    await page.keyboard.press("Control+Shift+Y");
    await until(async () => !(await panel.isVisible()), { what: "panneau fermé au clavier" });
    await page.keyboard.press("Control+Shift+Y");
    await until(async () => panel.isVisible(), { what: "panneau rouvert au clavier" });
    // détacher, puis déposer l'en-tête sur le panneau de droite : il se rattache
    await page.locator("[data-pb-layers-dock]").click();
    await until(async () => panel.evaluate((e) => e.classList.contains("is-floating")), { what: "flottant" });
    const head = await page.locator("[data-pb-layers-head]").boundingBox();
    const right = await page.locator("[data-pb-right]").boundingBox();
    await page.mouse.move(head.x + 60, head.y + head.height / 2);
    await page.mouse.down();
    await page.mouse.move(right.x + right.width / 2, right.y + 160, { steps: 8 });
    assert.equal(await page.locator("[data-pb-right]").evaluate((e) => e.classList.contains("is-dock-target")), true, "zone de dépôt signalée");
    await page.mouse.up();
    await until(async () => panel.evaluate((e) => !e.classList.contains("is-floating")), { what: "rattaché par dépôt" });
    assert.equal(await page.locator("[data-pb-right]").evaluate((e) => e.classList.contains("is-dock-target")), false);
    // relâché ailleurs : il reste flottant
    await page.locator("[data-pb-layers-dock]").click();
    const h2 = await page.locator("[data-pb-layers-head]").boundingBox();
    await page.mouse.move(h2.x + 60, h2.y + h2.height / 2);
    await page.mouse.down();
    await page.mouse.move(400, 400, { steps: 6 });
    await page.mouse.up();
    assert.equal(await panel.evaluate((e) => e.classList.contains("is-floating")), true, "reste flottant hors du panneau de droite");
    await page.locator("[data-pb-layers-dock]").click();
  });

  test("commande « Vider la page » : canevas vide avec son « + », annulable", async () => {
    const r = await boss.post("/marketing/pages", { name: `Vider ${++n}` });
    pageId = Number(r.location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    assert.ok(draft().sections.length >= 2, "une page neuve a son bandeau et son formulaire");
    await page.keyboard.press("Control+k");
    await page.locator("[data-pb-cmd-q]").fill("vider la page");
    await page.keyboard.press("Enter");
    await saved((c) => c.sections.length === 0, "page vidée");
    await frame().locator("[data-kw-add='root']").waitFor();
    await page.locator("[data-pb-undo]").click();
    await saved((c) => c.sections.length >= 2, "page restaurée");
  });

  test("commande « Vider la page » : canevas vide avec son « + », annulable", async () => {
    const r = await boss.post("/marketing/pages", { name: `Vider ${++n}` });
    pageId = Number(r.location.match(/(\d+)$/)[1]);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    assert.ok(draft().sections.length >= 2, "une page neuve a son bandeau et son formulaire");
    await page.keyboard.press("Control+k");
    await page.locator("[data-pb-cmd-q]").fill("vider la page");
    await page.keyboard.press("Enter");
    await saved((c) => c.sections.length === 0, "page vidée");
    await frame().locator("[data-kw-add='root']").waitFor();
    await page.locator("[data-pb-undo]").click();
    await saved((c) => c.sections.length >= 2, "page restaurée");
  });

  test("annuler la création d'une structure : la page redevient vide ; rétablir : la structure revient identique", async () => {
    await openEditor();
    await frame().locator("[data-kw-add='root']").click();
    await pick("grid", "grid-2x2");
    const made = await saved((c) => nodesOf(c.sections).some((x) => x.type === "grid"), "grille créée");
    const snapshot = JSON.stringify(made.sections);
    await page.locator("[data-pb-undo]").click();
    await saved((c) => c.sections.length === 0, "page vide après annulation");
    await frame().locator("[data-kw-add='root']").waitFor();
    await page.locator("[data-pb-redo]").click();
    await saved((c) => JSON.stringify(c.sections) === snapshot, "structure rétablie à l'identique");
    // l'historique nomme l'action
    await page.locator("[data-pb-history]").click();
    assert.match(await page.locator("[data-pb-menu]").innerText(), /Structure : Deux colonnes, deux lignes/);
    await page.keyboard.press("Escape");
  });

  test("widgets : « Boutons de partage » et « Bouton d'achat » s'ajoutent depuis la bibliothèque et se règlent dans l'inspecteur", async () => {
    await createCourse(boss, srv, { title: "Formation à vendre", price: 19 });
    await openEditor();
    const search = page.locator("[data-pb-el-search]");
    // Boutons de partage : un clic dans la bibliothèque, quatre réseaux par défaut
    await search.fill("partage");
    await page.locator(".pb-pal-item", { hasText: "Boutons de partage" }).first().click();
    await saved((c) => nodesOf(c.sections).some((x) => x.type === "sharebuttons"), "boutons de partage ajoutés");
    await frame().locator(".kw-sharebuttons").waitFor();
    assert.equal(await frame().locator(".kw-sharebuttons .kw-social-link").count(), 4);
    await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Contenu" }).first().click().catch(() => {});
    await page.locator("[data-pb-inspector] .pb-check", { hasText: "Facebook" }).locator("input").uncheck();
    await until(async () => (await frame().locator(".kw-sharebuttons .kw-social-link").count()) === 3, { what: "trois réseaux" });
    await saved((c) => nodesOf(c.sections).find((x) => x.type === "sharebuttons").props.networks.length === 3, "réseaux enregistrés");
    // Bouton d'achat : la formation se choisit à l'ajout ; bouton inactif dans l'éditeur
    await search.fill("achat");
    await page.locator(".pb-pal-item", { hasText: "Bouton d'achat" }).first().click();
    await page.locator("[data-pb-ask] select").selectOption({ label: "Formation à vendre" });
    await page.locator("[data-pb-ask-form] button[type='submit']").click();
    await saved((c) => nodesOf(c.sections).some((x) => x.type === "addtocart"), "bouton d'achat ajouté");
    await frame().locator(".kw-buy button").waitFor();
    assert.equal(await frame().locator(".kw-buy button").isDisabled(), true, "inactif dans l'éditeur");
    assert.equal((await frame().locator(".kw-buy button").innerText()).trim(), "Ajouter au panier");
    await page.locator("[data-pb-inspector] select").filter({ hasText: "Acheter maintenant" }).first().selectOption("buy");
    await until(async () => (await frame().locator(".kw-buy button").innerText()).trim() === "Acheter maintenant", { what: "libellé « Acheter maintenant »" });
  });

  test("T20 aucune erreur dans la console du navigateur", async () => {
    assert.deepEqual(errors, []);
  });
});
