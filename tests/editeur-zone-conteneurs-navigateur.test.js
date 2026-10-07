// Éditeur de pages — ZONE D'ÉDITION DES CONTENEURS dans un VRAI navigateur (Chrome piloté par Playwright) contre un vrai
// serveur. Un conteneur / une structure vide doit être une vraie zone de construction (grande, centrée, manipulable) ;
// dès qu'il reçoit du contenu, sa hauteur redevient celle du contenu ; rien d'artificiel n'est enregistré dans le document.
// Chaque scénario clique comme une personne, puis relit les dimensions RÉELLES calculées par le navigateur (canevas),
// le brouillon enregistré en base, et la barre d'actions.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
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
async function until(check, { timeout = 15000, every = 150, what = "condition" } = {}) {
  const end = Date.now() + timeout;
  let last = null;
  for (;;) {
    let v = null;
    try { v = await check(); } catch (error) { last = error; }
    if (v) return v;
    if (Date.now() > end) throw new Error(`Délai dépassé : ${what}${last ? ` (${String(last.message).split("\n")[0]})` : ""}`);
    await wait(every);
  }
}

describe("zone d'édition des conteneurs : vide = vraie zone de construction, plein = hauteur du contenu (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, n = 0;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const draft = () => {
    const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId);
    return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) };
  };
  const saved = (check, what) => until(() => { const d = draft(); return check(d) ? d : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 15000 });
  async function openEditor(content = { sections: [] }) {
    n += 1;
    pageId = Number((await boss.post("/marketing/pages", { name: `Zone ${n}` })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    await wait(300);
  }
  // Mesures réelles (px CSS de la page affichée) de tous les conteneurs du canevas, dans l'ordre du document
  const boxes = () => page.evaluate(() => {
    const d = document.querySelector("[data-pb-frame]").contentDocument;
    return [...d.querySelectorAll(".lp-main .kw-node")].filter((el) => /\bkw-(container|grid|stack|column|columns|group)\b/.test(el.className)).map((el) => {
      const r = el.getBoundingClientRect();
      const plus = el.querySelector(":scope > .kw-add");
      const pr = plus ? plus.getBoundingClientRect() : null;
      return { id: el.getAttribute("data-node-id"), cls: el.className, empty: el.classList.contains("kw-is-empty"), x: r.left, y: r.top, w: r.width, h: r.height, kids: el.children.length,
        plus: pr ? { w: pr.width, h: pr.height, dx: (pr.left + pr.width / 2) - (r.left + r.width / 2), dy: (pr.top + pr.height / 2) - (r.top + r.height / 2) } : null };
    });
  });
  const viewport = () => page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return { w: d.documentElement.clientWidth, sw: d.documentElement.scrollWidth }; });
  async function pick(kind, key, where = "[data-kw-add='root']") {
    await frame().locator(where).click();
    const dlg = page.locator("[data-pb-layout]");
    await dlg.waitFor({ state: "visible" });
    await dlg.locator(`.pb-kind[data-kind="${kind}"]`).click();
    await dlg.locator(`.pb-structure[data-structure="${key}"]`).click();
    await until(async () => !(await dlg.evaluate((d) => d.open)), { what: "fenêtre fermée" });
    await until(async () => (await boxes()).length > 0, { what: "structure affichée" });
  }
  const addWidget = async (label) => { await page.locator(".pb-pal-item", { hasText: new RegExp(`^${label}$`) }).first().click(); };
  const rowOf = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const MIN_CELL = 160; // 10 rem : plancher de la zone d'une case, quel que soit l'écran

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

  test("T1 nouveau conteneur Flexbox vide : une vraie zone (haute, pleine largeur), « + » centré et assez grand", async () => {
    await openEditor();
    await pick("flex", "flex-1");
    const [box] = await boxes();
    assert.equal(box.empty, true, "état vide représenté par la classe du rendu");
    assert.ok(box.h >= 240, `hauteur ${Math.round(box.h)} px : zone de construction (avant la correction : 48 px)`);
    const vp = await viewport();
    assert.ok(box.w >= 700 && box.w <= vp.w, `largeur ${Math.round(box.w)} px : celle de la page, sans largeur arbitraire`);
    assert.ok(box.plus.w >= 44 && box.plus.h >= 44, "« + » : cible de 44 px au moins");
    assert.ok(Math.abs(box.plus.dx) <= 2 && Math.abs(box.plus.dy) <= 2, `« + » centré (écart ${Math.round(box.plus.dx)}, ${Math.round(box.plus.dy)})`);
  });

  test("T2 structure à 2 colonnes : deux cases égales, hautes, avec leur « + » centré ; le parent n'ajoute aucune hauteur", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const [parent, a, b] = await boxes();
    assert.equal(parent.empty, false, "le parent a des enfants : il n'est pas « vide »");
    for (const c of [a, b]) {
      assert.equal(c.empty, true);
      assert.ok(c.h >= MIN_CELL, `case de ${Math.round(c.h)} px`);
      assert.ok(Math.abs(c.plus.dx) <= 2 && Math.abs(c.plus.dy) <= 2, "« + » centré dans la case");
    }
    assert.ok(Math.abs(a.h - b.h) <= 1, "cases de même hauteur");
    assert.ok(Math.abs(a.w - b.w) <= 2 && a.w > parent.w * 0.4, "deux colonnes de même largeur");
    assert.ok(Math.abs(parent.h - a.h) <= 1, "hauteur du parent = hauteur de ses cases (aucune hauteur forcée en plus)");
    assert.ok(b.x - (a.x + a.w) >= 20, "l'écart entre colonnes est visible");
  });

  test("T3 structure à 3 colonnes : trois cases visibles et manipulables", async () => {
    await openEditor();
    await pick("flex", "flex-3");
    const [parent, a, b, c] = await boxes();
    for (const x of [a, b, c]) { assert.equal(x.empty, true); assert.ok(x.h >= MIN_CELL && x.w >= 150, `case ${Math.round(x.w)} × ${Math.round(x.h)}`); }
    assert.ok(Math.abs(a.w - c.w) <= 2);
    assert.ok(parent.w >= a.w * 3, "les trois cases tiennent dans le parent");
  });

  test("T4 Grille : cellules visibles et exploitables (2×2 puis 3×3), « + » centrés, séparations visibles", async () => {
    for (const [key, cols, rows] of [["grid-2x2", 2, 2], ["grid-3x3", 3, 3]]) {
      await openEditor();
      await pick("grid", key);
      const [grid, ...cells] = await boxes();
      assert.equal(cells.length, cols * rows);
      for (const c of cells) {
        assert.equal(c.empty, true);
        assert.ok(c.h >= MIN_CELL && c.w >= 150, `${key} : cellule ${Math.round(c.w)} × ${Math.round(c.h)}`);
        assert.ok(Math.abs(c.plus.dx) <= 2 && Math.abs(c.plus.dy) <= 2, `${key} : « + » centré`);
      }
      assert.ok(cells[1].x - (cells[0].x + cells[0].w) >= 20, `${key} : séparation verticale visible`);
      if (rows > 1) assert.ok(cells[cols].y - (cells[0].y + cells[0].h) >= 20, `${key} : séparation horizontale visible`);
      assert.ok(grid.h >= rows * MIN_CELL, "la grille est une vraie zone de construction");
    }
  });

  test("T5 un widget ajouté dans une case : cette case retrouve la hauteur de son contenu", async () => {
    await openEditor();
    await pick("flex", "flex-1");
    const [box] = await boxes();
    await frame().locator(".kw-is-empty").first().click({ position: { x: 24, y: 24 } });
    await addWidget("Titre");
    await until(async () => (await boxes())[0].empty === false, { what: "conteneur plus vide" });
    const [after1] = await boxes();
    assert.ok(after1.h < 120, `hauteur naturelle du contenu : ${Math.round(after1.h)} px (avant l'ajout : ${Math.round(box.h)} px)`);
    assert.equal(after1.plus, null, "plus de « + » dans un conteneur qui a du contenu");
    await saved((d) => nodesOf(d.sections).some((x) => x.type === "heading"), "widget dans le brouillon");
  });

  test("T6 plusieurs widgets : le conteneur grandit avec son contenu, sans débordement", async () => {
    await openEditor();
    await pick("flex", "flex-1");
    await frame().locator(".kw-is-empty").first().click({ position: { x: 24, y: 24 } });
    await addWidget("Titre");
    await until(async () => (await boxes())[0].empty === false, { what: "premier widget" });
    const h1 = (await boxes())[0].h;
    for (const label of ["Texte", "Titre", "Texte"]) {
      await frame().locator(".kw-container .kw-node").last().click();
      await addWidget(label);
      await wait(250);
    }
    await until(async () => nodesOf(draft().sections).filter((x) => x.type === "heading" || x.type === "text").length >= 3, { what: "widgets ajoutés" });
    const over = await page.evaluate(() => {
      const d = document.querySelector("[data-pb-frame]").contentDocument;
      const c = d.querySelector(".lp-main .kw-container");
      const cr = c.getBoundingClientRect();
      return { h: cr.height, overflow: c.scrollHeight > c.clientHeight + 1, out: [...c.children].filter((k) => k.getBoundingClientRect().bottom > cr.bottom + 1 || k.getBoundingClientRect().right > cr.right + 1).length };
    });
    assert.ok(over.h > h1, "le conteneur grandit avec son contenu");
    assert.equal(over.overflow, false, "aucun défilement interne");
    assert.equal(over.out, 0, "aucun enfant ne dépasse du conteneur");
  });

  test("T7 supprimer les widgets : retour à un état vide correctement dimensionné", async () => {
    await openEditor();
    await pick("flex", "flex-1");
    await frame().locator(".kw-is-empty").first().click({ position: { x: 24, y: 24 } });
    await addWidget("Titre");
    await until(async () => (await boxes())[0].empty === false, { what: "widget ajouté" });
    await frame().locator(".kw-container .kw-node").last().click();
    await page.keyboard.press("Delete");
    await until(async () => (await boxes())[0].empty === true, { what: "retour à l'état vide" });
    const [box] = await boxes();
    assert.ok(box.h >= 240, `zone vide de nouveau confortable : ${Math.round(box.h)} px`);
    assert.ok(box.plus && Math.abs(box.plus.dx) <= 2 && Math.abs(box.plus.dy) <= 2, "« + » de retour, centré");
  });

  test("T8 marge intérieure (padding) : la hauteur est recalculée (contenu + padding), sans double espacement", async () => {
    const heading = { id: "head00000001", type: "heading", props: { text: "Titre test", level: "2" } };
    const wrap = (padding) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", styles: { desktop: padding ? { paddingTop: `${padding}px`, paddingBottom: `${padding}px` } : {} }, children: [heading] }] }] });
    await openEditor(wrap(0));
    const base = (await boxes())[0].h;
    await openEditor(wrap(60));
    const padded = (await boxes())[0].h;
    assert.ok(Math.abs(padded - (base + 120)) <= 1, `padding 60 haut + bas : ${Math.round(base)} → ${Math.round(padded)} px (attendu +120)`);
    // conteneur VIDE avec padding : border-box, la hauteur minimale d'édition INCLUT le padding (aucun cumul)
    const emptyOf = (padding) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", styles: { desktop: padding ? { paddingTop: `${padding}px`, paddingBottom: `${padding}px` } : {} }, children: [] }] }] });
    await openEditor(emptyOf(0));
    const emptyBase = (await boxes())[0].h;
    await openEditor(emptyOf(60));
    const emptyPadded = (await boxes())[0].h;
    assert.ok(emptyBase >= 240, `vide : ${Math.round(emptyBase)} px`);
    assert.ok(Math.abs(emptyPadded - emptyBase) <= 1, `vide + padding : ${Math.round(emptyBase)} → ${Math.round(emptyPadded)} px (le padding est compris dans la zone, pas ajouté)`);
  });

  test("T9 marge extérieure (margin) : le conteneur se décale sans changer de hauteur", async () => {
    const heading = { id: "head00000001", type: "heading", props: { text: "Titre test", level: "2" } };
    const wrap = (margin) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", styles: { desktop: margin ? { marginTop: `${margin}px` } : {} }, children: [heading] }] }] });
    await openEditor(wrap(0));
    const a = (await boxes())[0];
    await openEditor(wrap(50));
    const b = (await boxes())[0];
    assert.ok(Math.abs(b.h - a.h) <= 1, "hauteur inchangée");
    assert.ok(Math.abs((b.y - a.y) - 50) <= 1, `décalage de ${Math.round(b.y - a.y)} px`);
  });

  test("T10 « Hauteur min. » de l'inspecteur : une vraie modification du layout, prioritaire sur la zone d'édition (grande ou petite)", async () => {
    await openEditor();
    await pick("flex", "flex-1");
    await frame().locator(".kw-is-empty").first().click({ position: { x: 24, y: 24 } });
    await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click().catch(() => {});
    const field = async () => {
      for (const g of ["size", "dimensions", "layout"]) { const det = page.locator(`[data-pb-inspector] details[data-group="${g}"]`).first(); if ((await det.count()) && !(await det.evaluate((d) => d.open))) await det.locator("> summary").click(); }
      return page.locator("[data-pb-inspector]").locator(".pb-field", { hasText: /Hauteur min/ }).locator("input[type='number'], input[type='text']").first();
    };
    for (const px of [500, 100]) {
      const input = await field();
      await input.fill(String(px));
      await input.press("Enter");
      await until(async () => Math.abs((await boxes())[0].h - px) <= 1, { what: `hauteur ${px} px dans le canevas` });
    }
    await until(async () => nodesOf(draft().sections).some((x) => x.styles && x.styles.desktop && /^100px$/.test(String(x.styles.desktop.minHeight))), { what: "hauteur enregistrée dans le document" });
  });

  test("T11-13 Ordinateur, tablette, mobile : la zone s'adapte à l'écran affiché (sans largeur fixe) et ne déborde jamais", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const seen = {};
    for (const device of ["desktop", "tablet", "mobile"]) {
      await page.locator(`.pb-top [data-device="${device}"]`).click();
      await wait(700);
      const [parent, a, b] = await boxes();
      const vp = await viewport();
      seen[device] = { w: vp.w, cell: a.h, stacked: b.y > a.y + a.h - 2 };
      assert.ok(a.h >= MIN_CELL && b.h >= MIN_CELL, `${device} : cases de ${Math.round(a.h)} px`);
      assert.ok(vp.sw <= vp.w + 1, `${device} : aucun défilement horizontal (${vp.sw} > ${vp.w})`);
      assert.ok(parent.w <= vp.w, `${device} : le conteneur tient dans l'écran`);
      assert.ok(Math.abs(a.plus.dx) <= 2 && Math.abs(a.plus.dy) <= 2, `${device} : « + » centré`);
    }
    assert.equal(seen.desktop.stacked, false, "ordinateur : colonnes côte à côte");
    assert.equal(seen.mobile.stacked, true, "mobile : colonnes empilées (structure responsive d'origine)");
    assert.ok(seen.desktop.cell > seen.tablet.cell, "la zone suit la largeur de l'écran affiché (plus large = plus haute), bornée");
    await page.locator('.pb-top [data-device="desktop"]').click();
    await wait(500);
  });

  test("T14-15 sauvegarde puis rechargement : la zone est identique, et AUCUNE hauteur artificielle n'est enregistrée", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const before_ = (await boxes()).map((x) => Math.round(x.h));
    await page.locator("[data-pb-save-now]").click();
    await until(async () => nodesOf(draft().sections).filter((x) => x.type === "container").length === 3, { what: "structure enregistrée" });
    assert.doesNotMatch(JSON.stringify(draft()), /minHeight|"height"/, "la zone vide vient du rendu, pas d'une valeur stockée");
    await page.reload();
    await ready();
    await wait(400);
    assert.deepEqual((await boxes()).map((x) => Math.round(x.h)), before_, "mêmes dimensions après rechargement");
    // structure + widget, puis rechargement
    await frame().locator(".kw-is-empty").first().click({ position: { x: 24, y: 24 } });
    await addWidget("Titre");
    await page.locator("[data-pb-save-now]").click();
    await until(async () => nodesOf(draft().sections).some((x) => x.type === "heading"), { what: "widget enregistré" });
    await until(async () => (await boxes())[1].empty === false, { what: "première case remplie dans le canevas" });
    const filled = (await boxes()).map((x) => `${x.empty}:${Math.round(x.h)}`);
    await page.reload();
    await ready();
    await wait(400);
    assert.deepEqual((await boxes()).map((x) => `${x.empty}:${Math.round(x.h)}`), filled, "case remplie / case vide conservées");
  });

  test("T16-17 annuler / rétablir : création d'une structure, puis changement de hauteur", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    assert.equal((await boxes()).length, 3);
    await page.locator("[data-pb-undo]").click();
    await frame().locator(".kw-empty-page").waitFor();
    assert.equal((await boxes()).length, 0, "annuler : la page redevient vide");
    await page.locator("[data-pb-redo]").click();
    await until(async () => (await boxes()).length === 3, { what: "structure rétablie" });
    const cells = (await boxes()).slice(1);
    assert.ok(cells.every((c) => c.empty && c.h >= MIN_CELL), "rétablie avec la même zone d'édition");
    // modifier la hauteur min. du conteneur, annuler, rétablir
    await frame().locator(".kw-container").first().click({ position: { x: 4, y: 4 } });
    await page.locator("[data-pb-inspector] [role='tab']", { hasText: "Style" }).first().click().catch(() => {});
    for (const g of ["size", "dimensions", "layout"]) { const det = page.locator(`[data-pb-inspector] details[data-group="${g}"]`).first(); if ((await det.count()) && !(await det.evaluate((d) => d.open))) await det.locator("> summary").click(); }
    const input = page.locator("[data-pb-inspector]").locator(".pb-field", { hasText: /Hauteur min/ }).locator("input[type='number'], input[type='text']").first();
    const natural = (await boxes())[0].h;
    await input.fill("420");
    await input.press("Enter");
    await until(async () => Math.abs((await boxes())[0].h - 420) <= 1, { what: "hauteur 420" });
    await page.locator("[data-pb-undo]").click();
    await until(async () => Math.abs((await boxes())[0].h - natural) <= 1, { what: "annulation de la hauteur" });
    await page.locator("[data-pb-redo]").click();
    await until(async () => Math.abs((await boxes())[0].h - 420) <= 1, { what: "hauteur rétablie" });
  });

  test("T18 glisser-déposer : un widget glissé depuis la bibliothèque est accepté par une case vide, partout dans sa zone", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const target = frame().locator(".kw-is-empty").nth(1);
    const tb = await target.boundingBox();
    // dépôt près du bord de la case (loin du « + ») : toute la zone est une cible
    await page.locator(".pb-pal-item", { hasText: /^Titre$/ }).first().dragTo(target, { targetPosition: { x: Math.max(8, tb.width * 0.15), y: Math.max(8, tb.height * 0.2) } });
    await until(async () => nodesOf(draft().sections).filter((x) => x.type === "container")[2] && (nodesOf(draft().sections).filter((x) => x.type === "container")[2].children || []).some((x) => x.type === "heading") || (await boxes())[2].empty === false, { what: "widget déposé dans la seconde case" });
    const [, a, b] = await boxes();
    assert.equal(a.empty, true, "la première case reste vide");
    assert.equal(b.empty, false, "la seconde case contient le widget");
    assert.equal((await boxes()).length, 3, "la structure est intacte");
  });

  test("T19 Flexbox imbriquée : les cases d'une structure « une ligne puis deux colonnes » sont toutes manipulables", async () => {
    await openEditor();
    await pick("flex", "flex-top-2");
    const list = await boxes();
    const empties = list.filter((x) => x.empty);
    assert.equal(empties.length, 3, "une case pleine largeur + deux colonnes imbriquées");
    for (const c of empties) { assert.ok(c.h >= MIN_CELL, `case imbriquée ${Math.round(c.h)} px`); assert.ok(Math.abs(c.plus.dx) <= 2 && Math.abs(c.plus.dy) <= 2); }
    assert.ok(list[0].h >= empties.reduce((s, c) => s + c.h, 0) * 0.5, "le parent englobe ses cases");
  });

  test("T20 Grille imbriquée : une grille créée dans une case vide garde des cellules exploitables", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const firstCell = frame().locator(".kw-is-empty").first();
    await firstCell.locator(".kw-add").click();
    const dlg = page.locator("[data-pb-layout]");
    await dlg.waitFor({ state: "visible" });
    await dlg.locator('.pb-kind[data-kind="grid"]').click();
    await dlg.locator('.pb-structure[data-structure="grid-2x2"]').click();
    await until(async () => (await boxes()).length === 8, { what: "grille imbriquée" });
    const list = await boxes();
    const inner = list.filter((x) => x.empty);
    assert.equal(inner.length, 5, "4 cellules de la grille + la seconde colonne");
    for (const c of inner) assert.ok(c.h >= 100 && c.w >= 80, `cellule ${Math.round(c.w)} × ${Math.round(c.h)}`);
    const vp = await viewport();
    assert.ok(vp.sw <= vp.w + 1, "aucun débordement horizontal");
  });

  test("T21 sélection dans le canevas : un clic dans une case vide la sélectionne (contour = sa zone) ; un enfant reste sélectionnable", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const cell = frame().locator(".kw-is-empty").first();
    await cell.click({ position: { x: 20, y: 20 } });
    const id = await cell.getAttribute("data-node-id");
    await until(async () => (await rowOf(id).locator("xpath=..").getAttribute("aria-selected")) === "true", { what: "calque de la case sélectionné" });
    const sel = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const s = d.querySelector(".pb-sel-box"); const r = s && s.getBoundingClientRect(); return r ? { w: r.width, h: r.height } : null; });
    const [, a] = await boxes();
    assert.ok(sel && Math.abs(sel.w - a.w) <= 4 && Math.abs(sel.h - a.h) <= 4, "le contour de sélection épouse toute la zone de la case");
    // un widget dans la case reste sélectionnable (la grande zone n'empêche pas de sélectionner l'enfant)
    await addWidget("Titre");
    await until(async () => (await boxes())[1].empty === false, { what: "widget ajouté" });
    await frame().locator(".kw-is-empty").first().evaluate(() => {});
    await frame().locator(".kw-heading").first().click();
    const heading = nodesOf((await saved((d) => nodesOf(d.sections).some((x) => x.type === "heading"), "titre dans le brouillon")).sections).find((x) => x.type === "heading");
    await until(async () => { const r = rowOf(heading.id); return (await r.count()) && (await r.locator("xpath=..").getAttribute("aria-selected")) === "true"; }, { what: "titre sélectionné (et non son conteneur)" });
  });

  test("T22 sélection par Structure/Calques, barre d'actions : bien placée, jamais sur les enfants ni hors écran", async () => {
    await openEditor();
    await pick("flex", "flex-2");
    const root = nodesOf((await saved((d) => nodesOf(d.sections).filter((x) => x.type === "container").length === 3, "structure dans le brouillon")).sections).find((x) => x.type === "container");
    await rowOf(root.id).click();
    const bar = page.locator(".pb-cbar");
    await bar.waitFor({ state: "visible" });
    await wait(300);
    const geo = await page.evaluate(() => {
      const f = document.querySelector("[data-pb-frame]");
      const fr = f.getBoundingClientRect();
      const zoom = fr.width / f.offsetWidth;
      const d = f.contentDocument;
      const kids = [...d.querySelectorAll(".lp-main .kw-container .kw-container")].map((k) => { const r = k.getBoundingClientRect(); return { l: fr.left + r.left * zoom, t: fr.top + r.top * zoom, r: fr.left + r.right * zoom, b: fr.top + r.bottom * zoom }; });
      const b = document.querySelector(".pb-cbar").getBoundingClientRect();
      return { kids, bar: { l: b.left, t: b.top, r: b.right, b: b.bottom }, win: { w: window.innerWidth, h: window.innerHeight } };
    });
    const overlap = geo.kids.some((k) => geo.bar.l < k.r && geo.bar.r > k.l && geo.bar.t < k.b && geo.bar.b > k.t);
    assert.equal(overlap, false, "la barre d'actions ne recouvre aucune case enfant");
    assert.ok(geo.bar.l >= 0 && geo.bar.r <= geo.win.w && geo.bar.t >= 0 && geo.bar.b <= geo.win.h, "la barre reste dans la fenêtre");
    // la sélection du parent ne gêne pas la sélection d'une case
    await frame().locator(".kw-is-empty").first().click({ position: { x: 20, y: 20 } });
    const cellId = await frame().locator(".kw-is-empty").first().getAttribute("data-node-id");
    await until(async () => (await rowOf(cellId).locator("xpath=..").getAttribute("aria-selected")) === "true", { what: "case sélectionnée" });
  });

  test("aucune erreur JavaScript ni de console pendant tout le parcours", async () => {
    assert.deepEqual(errors, [], `erreurs navigateur : ${errors.join(" | ")}`);
  });
});
