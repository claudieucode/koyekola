// Canvas de l'éditeur de pages dans un VRAI Chrome (Playwright) : grande zone de création, « + » qui crée vraiment des containers (page vide,
// puis en fin de page tant qu'on veut en ajouter), containers imbriqués, extension de la page, défilement du canvas seul, écrans
// ordinateur / tablette / mobile, sauvegarde et rechargement, contrôles du canvas contenus, reste de l'interface inchangé.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, dismissStart } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("canvas de l'éditeur de pages : grande zone de création, « + », containers, défilement (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, n = 0;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
  async function openEditor(content = { sections: [] }, viewport = { width: 1600, height: 900 }) {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: `Canvas ${n}` })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready(); await dismissStart(page); await wait(500);
  }
  const draft = () => { const r = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections) }; };
  const until = async (fn, what, ms = 10000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };
  // Chaque container ajouté depuis un « + » racine devient sa propre section de la page : on lit les enfants de TOUTES les sections
  const roots = () => draft().sections.flatMap((s) => s.children || []);
  const nodesDeep = (list, out = []) => { for (const x of list || []) { out.push(x); nodesDeep(x.children, out); } return out; };
  // Crée un container Flexbox (première structure) depuis un « + » donné
  // Clic comme une personne : sur le « + » visible, aux coordonnées de la souris (l'étape « défiler jusqu'à l'élément » de Playwright reste bloquée sur les « + » intérieurs)
  async function clickPlus(loc) {
    try { await loc.click({ timeout: 5000 }); } catch { const b = await loc.boundingBox(); assert.ok(b, "le « + » est visible"); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); }
  }
  async function createFrom(plusLocator, kind = "flex") {
    await clickPlus(plusLocator);
    const dlg = page.locator("[data-pb-layout]"); await dlg.waitFor({ state: "visible" });
    await dlg.locator(`.pb-kind[data-kind="${kind}"]`).click(); await dlg.locator(".pb-structure").first().click();
    await until(async () => !(await dlg.evaluate((d) => d.open)), "fenêtre fermée");
    await wait(500);
  }
  const geo = () => page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right), b: Math.round(b.bottom) }; };
    const f = document.querySelector("[data-pb-frame]"), d = f.contentDocument, st = document.querySelector("[data-pb-stage]");
    const end = d.querySelector(".kw-add-end"), eb = end ? end.getBoundingClientRect() : null, fb = f.getBoundingClientRect();
    const secs = [...d.querySelectorAll(".lp-main > .kw-layout > [data-node-id], .lp-main [data-section-id] > .kw-layout > [data-node-id]")].map((e) => { const b = e.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom) }; });
    return { canvas: r("[data-pb-canvas]"), stage: r("[data-pb-stage]"), wrap: r("[data-pb-frame-wrap]"), left: r(".pb-left"), right: r(".pb-right"), top: r(".pb-top"), gizmo: r(".pb-gizmo"),
      pageH: d.documentElement.scrollHeight, frameH: Math.round(fb.height), frameW: Math.round(fb.width), docW: d.documentElement.scrollWidth, docClientW: d.documentElement.clientWidth,
      stageScroll: { sh: st.scrollHeight, ch: st.clientHeight, oy: getComputedStyle(st).overflowY }, plusCount: d.querySelectorAll("[data-kw-add]").length, end: end ? { top: Math.round(eb.top), bottom: Math.round(eb.bottom), left: Math.round(eb.left), right: Math.round(eb.right) } : null, secs,
      rootPlus: d.querySelectorAll('[data-kw-add="root"]').length, nodes: d.querySelectorAll("[data-node-id]").length };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("T1 canvas vide : grande zone de création qui occupe toute la zone centrale, un seul grand « + », rien qui déborde", async () => {
    await openEditor();
    const g = await geo();
    assert.ok(g.stage.w >= 900 && g.stage.h >= 700, `zone de création de ${g.stage.w}×${g.stage.h} px`);
    assert.equal(g.canvas.b, 900, "le canvas descend jusqu'au bas de la fenêtre"); assert.equal(g.rootPlus, 1, "un seul « + »"); assert.equal(g.end, null, "pas de bouton de fin de page tant que la page est vide");
    const plus = await frame().locator('[data-kw-add="root"]').boundingBox(); assert.ok(plus.width >= 52 && plus.height >= 52, `le « + » est bien visible (${plus.width}×${plus.height})`);
    assert.equal(g.stageScroll.sh <= g.stageScroll.ch + 1, true, "pas de défilement inutile quand la page est vide"); assert.ok(g.docW <= g.docClientW, "aucun débordement horizontal");
  });

  test("T2-T3 « + » crée vraiment des containers : le premier, puis d'autres en fin de page (bouton « Ajouter un container ») ; sélectionnables, sauvegardés, sans chevauchement", async () => {
    await openEditor();
    await createFrom(frame().locator('[data-kw-add="root"]'));
    await until(() => roots().length === 1, "premier container enregistré");
    let g = await geo();
    assert.equal(g.end !== null, true, "le bouton de fin de page apparaît après le premier container");
    const endBtn = frame().locator(".kw-add-end .kw-add");
    assert.match(await endBtn.innerText(), /Ajouter un container/); assert.ok(g.end.top >= g.secs[0].bottom - 1, "le bouton est SOUS le container, pas dessus");
    for (let i = 2; i <= 5; i++) {
      await createFrom(frame().locator(".kw-add-end .kw-add"));
      await until(() => roots().length === i, `${i} containers enregistrés`);
    }
    g = await geo();
    assert.equal(g.secs.length, 5, "5 containers affichés");
    for (let i = 1; i < g.secs.length; i++) assert.ok(g.secs[i].top >= g.secs[i - 1].bottom - 1, `container ${i + 1} sous le container ${i}, sans chevauchement`);
    assert.ok(g.end.top >= g.secs[4].bottom - 1, "le bouton reste après le dernier container");
    assert.ok(roots().every((r) => ["container", "grid"].includes(r.type)), "de vrais containers dans le document");
    // sélectionnable : clic dans le canvas -> l'élément est sélectionné dans les calques
    await frame().locator("[data-node-id]").nth(2).click({ position: { x: 20, y: 20 } }); await wait(300);
    assert.equal(await page.locator("[data-pb-layers] .pb-row-item.is-selected").count(), 1, "le container est sélectionnable");
    // un container Grille aussi
    await createFrom(frame().locator(".kw-add-end .kw-add"), "grid");
    await until(() => roots().length === 6 && roots()[5].type === "grid", "container Grille créé");
  });

  test("T4 container imbriqué : le « + » d'un container vide y crée un enfant, qui en accepte un autre ; la hiérarchie est enregistrée", async () => {
    await openEditor();
    await createFrom(frame().locator('[data-kw-add="root"]'));
    await until(() => roots().length === 1, "container");
    const firstEmpty = () => frame().locator("[data-node-id] [data-kw-add]:not([data-kw-add='root']):visible").first();
    const depth = (x) => 1 + Math.max(0, ...(x.children || []).filter((c) => ["container", "grid"].includes(c.type)).map(depth));
    // le conteneur vide est sélectionné : seul le « + » de création de la zone vide est là, le « + » rond qui doublait la palette de commandes n'existe plus
    const plus = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return { inside: d.querySelectorAll(".pb-struct-add.is-inside").length, any: [...d.querySelectorAll(".pb-struct-add")].filter((b) => b.getAttribute("aria-label") === "Ajouter un élément ici").length, zone: d.querySelectorAll(".kw-node [data-kw-add]:not([data-kw-add='root'])").length }; });
    assert.deepEqual(plus, { inside: 0, any: 0, zone: 1 }, "plus de « + » rond « Ajouter un élément ici » ; le « + » de la zone vide reste");
    for (const level of [2, 3]) {
      await createFrom(firstEmpty());
      await until(() => Math.max(...roots().map(depth)) >= level, `niveau ${level}`);
    }
    assert.ok(Math.max(...roots().map(depth)) >= 3, "container > container > container");
    assert.ok(await page.evaluate(() => document.querySelectorAll("[data-pb-layers] .pb-node").length) >= 3, "la hiérarchie est visible dans la Structure");
  });

  test("T5-T6 page longue : la page grandit, seul le canvas défile, ses contrôles restent dans leur zone ; le reste de l'interface ne bouge pas", async () => {
    await openEditor();
    await createFrom(frame().locator('[data-kw-add="root"]'));
    const ref = await geo();
    for (let i = 2; i <= 9; i++) { await createFrom(frame().locator(".kw-add-end .kw-add")); }
    await until(() => roots().length === 9, "9 containers");
    const g = await geo();
    assert.ok(g.pageH > ref.pageH + 600, `la page s'est étendue (${ref.pageH} → ${g.pageH} px)`);
    assert.ok(g.pageH > g.frameH + 400, `la page est plus haute que la zone visible (${g.pageH} > ${g.frameH}) : elle défile`);
    assert.ok(g.stageScroll.sh <= g.stageScroll.ch + 1, "un seul défilement : celui de la page dans le canvas, pas de seconde barre autour");
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true, "l'application elle-même ne défile pas");
    for (const k of ["left", "right", "top", "canvas"]) assert.deepEqual(g[k], ref[k], `${k} : à la même place et à la même taille`);
    await frame().locator("body").evaluate(() => window.scrollTo(0, 0)); await wait(200);
    const y0 = await frame().locator("[data-node-id]").first().evaluate((e) => Math.round(e.getBoundingClientRect().top));
    await frame().locator(".kw-add-end .kw-add").scrollIntoViewIfNeeded(); await wait(300);
    const y1 = await frame().locator("[data-node-id]").first().evaluate((e) => Math.round(e.getBoundingClientRect().top));
    assert.ok(y1 < y0 - 300, `le contenu a défilé (${y0} → ${y1})`);
    const after = await geo();
    assert.deepEqual(after.gizmo, ref.gizmo, "le zoom reste en bas à droite du canvas");
    assert.ok(after.gizmo.b <= after.canvas.b && after.gizmo.r <= after.canvas.r && after.gizmo.l >= after.canvas.l, "contrôles dans le canvas");
    const last = await frame().locator(".kw-add-end .kw-add").boundingBox();
    assert.ok(last && last.y > 0, "après le défilement, le bouton de fin de page est atteint et visible");
    for (const k of ["left", "right", "top"]) assert.deepEqual(after[k], ref[k], `${k} inchangé après défilement`);
  });

  test("T7 écrans : tablette et mobile affichent le canvas sans débordement (le bouton de fin de page inclus) ; ordinateur revient identique", async () => {
    await openEditor({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "box000000001", type: "container", props: {}, children: [] }, { id: "box000000002", type: "grid", props: {}, children: [] }] }] });
    const base = await geo();
    for (const [label, dev] of [["Tablette", "tablet"], ["Mobile", "mobile"]]) {
      await page.locator(`.pb-devices [data-device="${dev}"], .pb-devices button[aria-label="${label}"]`).first().click(); await wait(500);
      const g = await geo();
      assert.ok(g.frameW < base.frameW, `${label} : cadre plus étroit (${g.frameW})`); assert.ok(g.docW <= g.docClientW + 1, `${label} : pas de débordement horizontal de la page`);
      const e = await frame().locator(".kw-add-end .kw-add").boundingBox(); assert.ok(e && e.width > 100, `${label} : le bouton de fin de page est visible`);
      assert.ok(g.end.left >= 0 && g.end.right <= g.docClientW + 1, `${label} : le bouton reste dans la page`);
      for (const k of ["left", "right", "top"]) assert.deepEqual(g[k], base[k], `${label} : panneaux inchangés`);
    }
    await page.locator('.pb-devices [data-device="desktop"], .pb-devices button[aria-label="Ordinateur"]').first().click(); await wait(500);
    assert.deepEqual((await geo()).wrap, base.wrap, "retour à l'ordinateur : même cadre");
  });

  test("T8 actualisation : la structure créée est restaurée à l'identique (containers, imbrication, bouton de fin de page)", async () => {
    await openEditor();
    await createFrom(frame().locator('[data-kw-add="root"]'));
    await createFrom(frame().locator(".kw-add-end .kw-add"));
    await createFrom(frame().locator("[data-node-id] [data-kw-add]:not([data-kw-add='root'])").first());
    await until(() => roots().length === 2 && nodesDeep(roots()).length >= 3, "structure enregistrée");
    const before = JSON.stringify(roots().map((r) => [r.type, (r.children || []).map((c) => c.type)]));
    await page.locator("[data-pb-save-now]").click().catch(() => {}); await wait(800);
    await page.reload(); await ready(); await wait(600);
    assert.equal(JSON.stringify(roots().map((r) => [r.type, (r.children || []).map((c) => c.type)])), before, "mêmes containers après rechargement");
    const g = await geo(); assert.equal(g.secs.length, 2); assert.ok(g.end, "le bouton de fin de page est revenu");
  });

  test("T9 beaucoup de contenu : rien n'est perdu, le canvas s'étend ; l'aperçu et la page publiée n'ont AUCUN bouton d'édition", async () => {
    await openEditor();
    await createFrom(frame().locator('[data-kw-add="root"]'));
    for (let i = 0; i < 6; i++) await createFrom(frame().locator(".kw-add-end .kw-add"));
    await until(() => roots().length === 7, "7 containers");
    assert.equal((await geo()).secs.length, 7, "les 7 containers sont affichés");
    const rev = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200, `publication (révision ${rev})`);
    const html = (await boss.get(`/p/${db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug}`)).text;
    assert.doesNotMatch(html, /data-kw-add|kw-add-end/, "page publiée : aucun « + »");
    const prev = (await boss.get(`/marketing/pages/${pageId}/apercu`)).text;
    assert.doesNotMatch(prev, /data-kw-add|kw-add-end/, "aperçu : aucun « + »");
  });

  test("le reste de l'interface est inchangé : panneaux, barre du haut et cartes à la même place pendant toute la création", async () => {
    await openEditor();
    const clip = (c) => page.screenshot({ clip: c, animations: "disabled" });
    const topRects = () => page.evaluate(() => [...document.querySelectorAll(".pb-top-left button, .pb-top-left h1, .pb-top-left .pb-seg")].map((e) => { const b = e.getBoundingClientRect(); return [e.getAttribute("aria-label") || e.className, Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join("|"); }));
    const top = await topRects(); // (le groupe de droite se décale quand l'heure d'enregistrement apparaît : on compare le groupe de gauche, positions et tailles)
    // Signature du panneau de gauche : place, taille et couleurs de chacun de ses éléments (plus fiable qu'une capture : pas de bruit de rendu)
    const sig = () => page.evaluate(() => [...document.querySelectorAll(".pb-left *, .pb-tools *")].filter((e) => e.getBoundingClientRect().width).map((e) => { const b = e.getBoundingClientRect(), c = getComputedStyle(e); return [e.tagName, String(e.className).slice(0, 24), Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height), c.color, c.backgroundColor, c.fontSize, c.fontWeight].join("|"); }));
    const left = await sig();
    const right = await clip({ x: 1262, y: 100, width: 338, height: 400 });
    await createFrom(frame().locator('[data-kw-add="root"]'));
    for (let i = 0; i < 3; i++) await createFrom(frame().locator(".kw-add-end .kw-add"));
    await page.keyboard.press("Escape"); await wait(300);
    assert.deepEqual(await topRects(), top, "barre du haut : mêmes boutons, aux mêmes positions et tailles");
    const leftAfter = await sig();
    assert.equal(leftAfter.length, left.length, "panneau de gauche : mêmes éléments");
    assert.deepEqual(leftAfter.filter((l, i) => l !== left[i]).slice(0, 4), [], "panneau de gauche et barre d'outils : même place, même taille, mêmes couleurs");
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => { assert.deepEqual(errors, []); });
});
