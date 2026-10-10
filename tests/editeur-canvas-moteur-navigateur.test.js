// Éditeur de pages — MOTEUR DE CRÉATION du canevas, parcours complet dans un VRAI Chrome (mission « Canvas façon Elementor », phases 17-18) :
// créer un conteneur, régler largeur / hauteur min. / largeur du contenu / direction / alignement / écart / retour à la ligne, imbriquer,
// ajouter des widgets, déplacer, réorganiser dans Structure, écran mobile, enregistrer, recharger, annuler / rétablir, publier et comparer la
// géométrie du canevas à celle de la page publiée. Chaque réglage est vérifié sur le CSS RÉEL calculé par le navigateur ET dans le brouillon.
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

describe("moteur de création du canevas (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, page, errors, id, slug;
  const fr = () => page.frameLocator("[data-pb-frame]");
  const draft = () => { const r = srv.db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections) }; };
  const flat = (list, out = []) => { for (const x of list || []) { out.push(x); flat(x.children, out); } return out; };
  const nodes = () => flat(draft().sections);
  const byType = (t) => nodes().filter((n) => n.type === t);
  const until = (fn, what, timeout = 10000) => page.waitForFunction(fn, null, { timeout, polling: 30 }).catch(() => { throw new Error("Délai dépassé : " + what); });
  const saved = async (check, what) => { const end = Date.now() + 12000; for (;;) { let ok = false; try { ok = check(draft()); } catch { /* pas encore */ } if (ok) return; if (Date.now() > end) throw new Error("Pas enregistré : " + what); await wait(150); } };
  const cs = (nodeId, prop) => page.evaluate(([n, p]) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${n}"]`); return e ? getComputedStyle(e)[p] : null; }, [nodeId, prop]);
  const rect = (nodeId) => page.evaluate((n) => { const e = document.querySelector("[data-pb-frame]").contentDocument.querySelector(`[data-node-id="${n}"]`); const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, nodeId);
  const pick = async (nodeId) => { await page.locator(`[data-pb-layers] .pb-node[data-id="${nodeId}"] > .pb-row-item`).click(); await wait(250); };
  const tab = async (name) => { await page.locator(".pb-right button", { hasText: new RegExp(`^${name}$`) }).first().click(); await wait(250); };
  // Les groupes de l'onglet Style sont des <details> repliables : on ouvre celui qui contient le réglage
  const reveal = async (prop) => {
    const group = page.locator(`.pb-inspector details.pb-acc:has([data-prop="${prop}"])`).first();
    if (!(await group.count())) throw new Error(`réglage introuvable : ${prop}`);
    if (!(await group.evaluate((d) => d.open))) { await group.locator("> summary").click(); await wait(150); }
    await page.locator(`.pb-inspector [data-prop="${prop}"]`).first().scrollIntoViewIfNeeded().catch(() => {});
  };
  const setLen = async (prop, value, unit) => { await reveal(prop); const f = page.locator(`.pb-inspector [data-prop="${prop}"]`); if (unit) await f.locator(".pb-len-unit").selectOption(unit, { force: true }); const i = f.locator(".pb-len-num"); await i.fill(String(value)); await i.press("Enter"); await wait(200); };
  const seg = async (prop, value) => { await reveal(prop); const b = page.locator(`.pb-inspector [data-prop="${prop}"] button[data-value="${value}"]`); if ((await b.getAttribute("aria-checked")) !== "true") { await b.click(); await wait(200); } };
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
  const styleOf = (n, d = "desktop") => (n.styles && n.styles[d]) || {};
  let cont, kidA, kidB;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1700, height: 1000 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    id = Number((await boss.post("/marketing/pages", { name: "Moteur canevas" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect0000001", type: "layout", children: [] }] } }, headers: { Origin: srv.base } })).status, 200);
    slug = srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await ready(); await wait(600);
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("T1 : créer un conteneur vide (+ → Flexbox → une colonne) : identifiant stable, dans Structure, enregistré", async () => {
    await fr().locator("[data-section-id] [data-kw-add]").first().click();
    await page.locator("dialog[open] button", { hasText: /Flexbox/i }).first().click();
    await page.locator("dialog[open] button", { hasText: /^Une colonne$/ }).first().click();
    await saved((d) => flat(d.sections).some((n) => n.type === "container"), "conteneur créé");
    cont = byType("container")[0].id;
    assert.match(cont, /^[a-z0-9]{12}$/);
    assert.ok(await page.locator(`[data-pb-layers] .pb-node[data-id="${cont}"]`).count(), "présent dans Structure");
    await pick(cont);
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].length), 1);
  });
  test("T2-T3 : largeur et hauteur minimale réellement appliquées (CSS calculé + brouillon)", async () => {
    await tab("Style");
    await setLen("width", 600, "px");
    await setLen("minHeight", 300, "px");
    await saved((d) => { const n = flat(d.sections).find((x) => x.id === cont); return styleOf(n).width === "600px" && styleOf(n).minHeight === "300px"; }, "largeur 600 px, hauteur min. 300 px");
    await wait(600);
    assert.equal(await cs(cont, "width"), "600px");
    assert.ok((await rect(cont)).h >= 300, "la hauteur minimale empêche le conteneur d'être plus petit");
  });
  test("T4 : Encadrée → Pleine largeur : le conteneur n'est plus limité par la largeur du site", async () => {
    await reveal("width");
    await page.locator('.pb-inspector [data-prop="width"] .pb-len-num').fill(""); await page.locator('.pb-inspector [data-prop="width"] .pb-len-num').press("Enter"); await wait(300);
    await saved((d) => { const n = flat(d.sections).find((x) => x.id === cont); return styleOf(n).width === undefined; }, "largeur effacée");
    await wait(500);
    const boxedMax = await cs(cont, "maxWidth");
    assert.match(boxedMax, /^\d+px$/, `encadrée : largeur max. ${boxedMax}`);
    const modeSelect = page.locator(".pb-inspector select", { has: page.locator("option[value=full]") }).first();
    await tab("Général");
    const sel = page.locator(".pb-inspector select").filter({ has: page.locator('option[value="full"]') }).first();
    if (await sel.count()) { await sel.selectOption("full"); await saved((d) => flat(d.sections).find((x) => x.id === cont).props?.full === true, "pleine largeur"); await wait(600); assert.equal(await cs(cont, "maxWidth"), "none"); }
    else throw new Error("le contrôle « Largeur du contenu » est introuvable");
    void modeSelect;
    await tab("Style");
  });
  test("T5-T8 : direction, répartition, alignement, écart et retour à la ligne produisent le CSS demandé", async () => {
    await seg("flexDirection", "row");
    await seg("justifyContent", "space-between");
    await seg("alignItems", "center");
    await setLen("gap", 30, "px");
    await seg("flexWrap", "wrap");
    await saved((d) => { const s = styleOf(flat(d.sections).find((x) => x.id === cont)); return s.flexDirection === "row" && s.justifyContent === "space-between" && s.alignItems === "center" && s.gap === "30px" && s.flexWrap === "wrap"; }, "réglages Flexbox");
    await wait(600);
    for (const [p, v] of [["display", "flex"], ["flexDirection", "row"], ["justifyContent", "space-between"], ["alignItems", "center"], ["flexWrap", "wrap"]]) assert.equal(await cs(cont, p), v, p);
    assert.equal(await cs(cont, "columnGap"), "30px");
    await seg("flexDirection", "column"); await wait(500);
    assert.equal(await cs(cont, "flexDirection"), "column");
    await seg("flexDirection", "row"); await wait(400);
  });
  test("T9 : deux conteneurs enfants (+ à l'intérieur), imbriqués et enregistrés", async () => {
    for (let i = 0; i < 2; i++) {
      await pick(cont);
      await page.locator("[data-pb-left] button", { hasText: /^Conteneur$/ }).first().click();
      await wait(900);
    }
    await saved((d) => { const c = flat(d.sections).find((x) => x.id === cont); return (c.children || []).filter((k) => k.type === "container").length >= 2; }, "deux conteneurs enfants");
    const kids = flat(draft().sections).find((x) => x.id === cont).children.filter((k) => k.type === "container");
    [kidA, kidB] = [kids[0].id, kids[1].id];
    assert.ok(kidA && kidB && kidA !== kidB);
    assert.equal(await page.locator(`[data-pb-layers] .pb-node[data-id="${cont}"] .pb-node[data-id="${kidA}"]`).count(), 1, "hiérarchie de Structure = document");
  });
  test("T10-T12 : un titre dans le premier, un texte dans le second ; dimensions du titre", async () => {
    await pick(kidA);
    await page.locator("[data-pb-left] button", { hasText: /^Titre$/ }).first().click(); await wait(900);
    await pick(kidB);
    await page.locator("[data-pb-left] button", { hasText: /^Texte$/ }).first().click(); await wait(900);
    await saved((d) => { const a = flat(d.sections).find((x) => x.id === kidA); return (a.children || []).some((k) => k.type === "heading"); }, "titre dans le premier conteneur");
    const a = flat(draft().sections).find((x) => x.id === kidA); const head = a.children.find((k) => k.type === "heading");
    assert.ok(head);
    await pick(head.id); await tab("Style");
    await setLen("width", 50, "%");
    await saved((d) => styleOf(flat(d.sections).find((x) => x.id === head.id)).width === "50%", "largeur du titre 50 %");
    await wait(600);
    const w = await rect(head.id), pw = await rect(kidA);
    assert.ok(Math.abs(w.w - pw.w * 0.5) < pw.w * 0.1 + 24, `titre à 50 % de son parent (${w.w} / ${pw.w})`);
  });
  test("T15-T17 : écran mobile : réglage propre à l'écran, ordinateur inchangé ; enregistrement et rechargement conservent tout", async () => {
    await pick(cont); await tab("Style");
    await page.locator('.pb-top .pb-devices [data-device="mobile"]').click(); await wait(900);
    await pick(cont); await tab("Style");
    await seg("flexDirection", "column");
    await saved((d) => styleOf(flat(d.sections).find((x) => x.id === cont), "mobile").flexDirection === "column", "direction mobile");
    const n = flat(draft().sections).find((x) => x.id === cont);
    assert.equal(styleOf(n).flexDirection, "row", "ordinateur inchangé");
    await wait(600);
    assert.equal(await cs(cont, "flexDirection"), "column");
    await page.locator('.pb-top .pb-devices [data-device="desktop"]').click(); await wait(900);
    assert.equal(await cs(cont, "flexDirection"), "row");
    const before = JSON.stringify(draft().sections);
    await page.reload(); await ready(); await wait(700);
    assert.equal(JSON.stringify(draft().sections), before, "document identique après rechargement");
    assert.equal(await cs(cont, "flexDirection"), "row");
    assert.equal(await page.locator("[data-pb-layers] .pb-node").count() >= 4, true);
  });
  test("T13-T14 : déplacer un widget entre conteneurs et réordonner dans Structure (même modèle partout)", async () => {
    const a = flat(draft().sections).find((x) => x.id === kidA); const head = a.children.find((k) => k.type === "heading");
    const rowOf = (nid) => page.locator(`[data-pb-layers] .pb-node[data-id="${nid}"] > .pb-row-item`);
    await rowOf(head.id).dragTo(rowOf(kidB), { targetPosition: { x: 60, y: 12 } }); await wait(900);
    await saved((d) => { const b = flat(d.sections).find((x) => x.id === kidB); return (b.children || []).some((k) => k.id === head.id); }, "titre déplacé dans le second conteneur");
    assert.equal(await fr().locator(`[data-node-id="${kidB}"] [data-node-id="${head.id}"]`).count(), 1, "le canevas suit");
    const order0 = flat(draft().sections).find((x) => x.id === cont).children.map((k) => k.id);
    await rowOf(kidB).dragTo(rowOf(kidA), { targetPosition: { x: 60, y: 3 } }); await wait(900);
    await saved((d) => { const o = flat(d.sections).find((x) => x.id === cont).children.map((k) => k.id); return o[0] === order0[1]; }, "conteneurs réordonnés");
    assert.equal(await page.locator(`[data-pb-layers] .pb-node[data-id="${cont}"] > ul > .pb-node, [data-pb-layers] .pb-node[data-id="${cont}"] .pb-node`).first().getAttribute("data-id"), order0[1]);
  });
  test("T20 : annuler / rétablir (Ctrl+Z / Ctrl+Maj+Z) restaurent la structure sans la dupliquer", async () => {
    const before = nodes().length;
    await pick(kidA); await page.keyboard.press("Delete"); await saved((d) => flat(d.sections).length < before, "supprimé");
    assert.ok(nodes().length < before);
    await page.keyboard.press("Control+z"); await saved((d) => flat(d.sections).length === before, "restauré");
    await page.keyboard.press("Control+Shift+z"); await saved((d) => flat(d.sections).length < before, "rétabli");
    await page.keyboard.press("Control+z"); await saved((d) => flat(d.sections).length === before, "restauré de nouveau");
  });
  test("T18-T19 : publication ; la géométrie du canevas = celle de la page publiée (3 écrans) ; aucun débordement horizontal", async () => {
    // Un conteneur VIDE reçoit dans le canevas une zone d'édition (hauteur minimale d'aide, absente de la page publiée : voir landing.css) ;
    // elle décalerait ses voisins centrés. On compare donc des conteneurs remplis, comme dans une vraie page terminée.
    for (const c of nodes().filter((n) => n.type === "container" && !(n.children || []).length)) { await pick(c.id); await page.locator("[data-pb-left] button", { hasText: /^Texte$/ }).first().click(); await wait(800); }
    await saved((d) => flat(d.sections).filter((n) => n.type === "container" && !(n.children || []).length).length === 0, "plus aucun conteneur vide");

    await page.locator("[data-pb-publish]").click().catch(() => {}); await wait(1500);
    if (!srv.db().prepare("SELECT status FROM mk_landing_pages WHERE id = ?").get(id).status.includes("publ")) await boss.postJson(`/marketing/pages/${id}/publier.json`, {});
    const measure = (win) => { const o = {}; win.document.querySelectorAll("[class*=\"kw-n-\"]").forEach((e) => { const m = /kw-n-([a-z0-9]+)/.exec(e.className); const r = e.getBoundingClientRect(); if (m) o[m[1]] = [Math.round(r.x), Math.round(r.y + win.scrollY), Math.round(r.width), Math.round(r.height)]; }); return { vw: win.innerWidth, sw: win.document.documentElement.scrollWidth, o }; };
    for (const dev of ["desktop", "tablet", "mobile"]) {
      await page.locator(`.pb-top .pb-devices [data-device="${dev}"]`).click(); await wait(1000);
      const canvas = await page.evaluate(`(${measure})(document.querySelector("[data-pb-frame]").contentWindow)`);
      const pub = await page.context().newPage(); await pub.setViewportSize({ width: canvas.vw, height: 900 }); await pub.goto(`${srv.base}/p/${slug}`); await wait(500);
      const real = await pub.evaluate(`(${measure})(window)`); if (process.env.DEBUG_PARITE) console.log("PUBLIE", dev, await pub.evaluate(() => document.querySelector("main").outerHTML.replace(/\s+/g, " ").slice(0, 700) + " || BODY> " + [...document.body.children].map((e) => e.tagName + "." + e.className + ":" + Math.round(e.getBoundingClientRect().height)).join(","))); await pub.close();
      assert.equal(real.sw <= real.vw, true, `${dev} : débordement horizontal publié (${real.sw} > ${real.vw})`);
      assert.equal(canvas.sw <= canvas.vw, true, `${dev} : débordement horizontal canevas`);
      const bad = Object.keys(real.o).filter((k) => !canvas.o[k] || canvas.o[k].some((v, i) => Math.abs(v - real.o[k][i]) > 1));
      assert.deepEqual(Object.keys(canvas.o), Object.keys(real.o), `${dev} : mêmes éléments, même ordre dans le canevas et la page publiée`);
      assert.deepEqual(bad, [], `${dev} : éléments dont la géométrie diffère : ${bad.map((k) => `${k} ${canvas.o[k]} / ${real.o[k]}`).join(" ; ")}`);
    }
    await page.locator('.pb-top .pb-devices [data-device="desktop"]').click();
  });
  test("T7 : glisser un widget de la palette vers un conteneur précis : indication de dépôt visible, widget inséré dans CE parent, à la bonne place, sélectionné", async () => {
    const mk = (k, t) => ({ id: (k + "x").padEnd(12, "0"), type: "text", props: { html: `<p>${t}</p>` } });
    const box = (k, kids) => ({ id: (k + "x").padEnd(12, "0"), type: "container", styles: { desktop: { minHeight: "120px", flexGrow: 1 } }, children: kids });
    const content = { sections: [{ id: "sect0000001", type: "layout", children: [{ id: "rowx00000000", type: "container", props: { full: true }, styles: { desktop: { display: "flex", flexDirection: "row", gap: "20px" } }, children: [box("left", [mk("l1", "Gauche 1"), mk("l2", "Gauche 2")]), box("right", [mk("r1", "Droite 1")])] }] }] };
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    await page.goto(`${srv.base}/marketing/pages/${id}/editeur`); await ready(); await wait(700);
    // zone de dépôt : le bas du texte « Droite 1 » = après lui, dans le conteneur de droite
    const target = fr().locator('[data-node-id="r1x000000000"]');
    const box_ = await target.boundingBox();
    const card = page.locator("[data-pb-left] button", { hasText: /^Titre$/ }).first();
    const cb = await card.boundingBox(), fb = await page.locator("[data-pb-frame]").boundingBox();
    await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.mouse.down();
    await page.mouse.move(cb.x + 60, cb.y + 40, { steps: 4 });
    const zoom = await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); return f.getBoundingClientRect().width / f.contentWindow.innerWidth; }); // échelle réelle du cadre
    const tx = box_.x + box_.width / 2, ty = box_.y + box_.height * 0.9; // boundingBox d'un élément du cadre : déjà en coordonnées de la fenêtre
    await page.mouse.move(tx, ty, { steps: 12 }); await wait(150); await page.mouse.move(tx + 1, ty, { steps: 2 }); await wait(250); // un navigateur réel émet « dragover » en continu : on bouge d'un pixel pour le même effet
    const indicator = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const line = d.querySelector(".pb-drop-line"), label = d.querySelector(".pb-drop-label"); const r = (e) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; }; return line ? { line: r(line), label: label ? label.textContent : "" } : null; });
    await page.mouse.up(); await wait(900);
    if (process.env.DEBUG_DND) console.log("INDIC", JSON.stringify(indicator), JSON.stringify(box_));
    assert.ok(indicator, "une indication de dépôt est affichée pendant le glissement");
    // l'indication correspond à l'endroit réel : sous « Droite 1 », sur sa largeur, et le texte annonce le parent
    assert.match(indicator.label, /Après/); assert.match(indicator.label, /dans/);
    assert.ok(Math.abs(indicator.line.w - box_.width / zoom) <= 3, `largeur de l'indication ${indicator.line.w} ≈ largeur de la cible ${Math.round(box_.width / zoom)} (px de la page, zoom ${zoom})`);
    await page.mouse.up(); await wait(900);
    if (process.env.DEBUG_DND) console.log("INDIC", JSON.stringify(indicator), JSON.stringify(box_));
    assert.ok(indicator, "une indication de dépôt est affichée pendant le glissement");
    // l'indication correspond à l'endroit réel : sous « Droite 1 », sur sa largeur, et le texte annonce le parent
    assert.match(indicator.label, /Après/); assert.match(indicator.label, /dans/);
    await wait(1500);
    if (process.env.DEBUG_DND) console.log("APRES", JSON.stringify(flat(draft().sections).map((n) => n.type + ":" + n.id.slice(0, 6) + ">" + (n.children || []).length)), JSON.stringify(indicator), "cible", JSON.stringify(box_), "cadre", JSON.stringify(fb));
    await saved((d) => { const r = flat(d.sections).find((x) => x.id === "rightx000000"); return r && r.children.length === 2; }, "titre inséré dans le conteneur de droite");
    const right = flat(draft().sections).find((x) => x.id === "rightx000000");
    assert.equal(right.children[0].id, "r1x000000000", "ordre : après « Droite 1 »");
    assert.equal(right.children[1].type, "heading");
    assert.equal(flat(draft().sections).find((x) => x.id === "leftx0000000").children.length, 2, "le conteneur de gauche est inchangé");
    assert.ok(await page.locator(`[data-pb-layers] .pb-row-item.is-selected`).count(), "le nouveau widget est sélectionné");
  });
  test("T10 : sélection d'un enfant (pas de son parent), accès au parent par le fil d'Ariane ; les cadres ne modifient aucune dimension et ne décalent rien", async () => {
    const geometry = () => page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; const o = {}; d.querySelectorAll("[data-node-id]").forEach((e) => { const r = e.getBoundingClientRect(); o[e.getAttribute("data-node-id")] = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }); return { o, sw: d.documentElement.scrollWidth, sh: d.documentElement.scrollHeight, y: d.defaultView.scrollY }; });
    const selectedIds = () => page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((r) => r.closest(".pb-node").dataset.id));
    await page.locator("[data-pb-canvas]").click({ position: { x: 5, y: 5 } }).catch(() => {}); await page.keyboard.press("Escape"); await wait(300);
    const before = await geometry();
    await fr().locator('[data-node-id="l2x000000000"]').click(); await wait(400);
    assert.deepEqual(await selectedIds(), ["l2x000000000"], "le clic sur un enfant sélectionne l'enfant");
    const during = await geometry();
    assert.deepEqual(during.o, before.o, "la sélection (cadre, badge, poignées) ne décale et ne redimensionne aucun élément");
    assert.equal(during.sw, before.sw, "aucune largeur ajoutée"); assert.equal(during.sh, before.sh, "aucune hauteur ajoutée"); assert.equal(during.y, before.y, "le défilement ne bouge pas");
    const frameBox = await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return [...d.querySelectorAll(".pb-sel-box, .pb-sel-badge, .pb-handle, .pb-parent-box")].map((e) => d.defaultView.getComputedStyle(e).position); });
    assert.ok(frameBox.length >= 2 && frameBox.every((p) => p === "absolute" || p === "fixed"), `les cadres sont hors du flux (${frameBox.join(",")})`);
    // le fil d'Ariane de l'inspecteur mène au parent
    await page.locator(".pb-inspector .pb-crumbs button").last().click(); await wait(400);
    const ids = await selectedIds();
    assert.equal(ids.length, 1); assert.equal(ids[0], "leftx0000000", "le parent immédiat est sélectionnable");
    assert.deepEqual((await geometry()).o, before.o);
    // la touche Échap désélectionne ; une sélection multiple (Maj) garde chaque identité
    await fr().locator('[data-node-id="l1x000000000"]').click(); await fr().locator('[data-node-id="r1x000000000"]').click({ modifiers: ["Shift"] }); await wait(400);
    assert.deepEqual((await selectedIds()).sort(), ["l1x000000000", "r1x000000000"]);
    assert.deepEqual((await geometry()).o, before.o);
  });
  test("aucune erreur de script", () => assert.deepEqual(errors, []));
});
