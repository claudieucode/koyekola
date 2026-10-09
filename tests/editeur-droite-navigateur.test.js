// Partie DROITE de l'éditeur (Structure + inspecteur) dans un VRAI Chrome (Playwright) : thème clair / sombre par jetons centralisés,
// bascule et mémoire, contrastes mesurés, calques (états, recherche, menu ⋮, glisser-déposer), inspecteur (état vide, en-tête, onglets,
// historique, écrans, informations), débordements à plusieurs tailles de fenêtre et de panneau, menus ouverts hors des panneaux.
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

const kid = (id, type, props, extra = {}) => ({ id, type, props, ...extra });
const CONTENT = { sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "box000000001", type: "container", name: "Section principale avec un nom particulièrement long pour tester la troncature", props: {}, children: [
    { id: "col000000001", type: "container", props: {}, children: [
      kid("hed000000001", "heading", { text: "Titre d'accueil", level: "2" }),
      kid("txt000000001", "text", { html: "<p>Un texte</p>" }),
      kid("btn000000001", "button", { label: "Acheter", url: "/catalogue" }),
      kid("img000000001", "image", { src: "https://exemple.fr/p.jpg", alt: "Photo" }, { name: "Image de couverture" }),
    ] },
    { id: "col000000002", type: "container", props: {}, children: [
      kid("hed000000002", "heading", { text: "Deuxième titre", level: "3" }),
      kid("btn000000002", "button", { label: "Contact", url: "/contact" }),
    ] } ] },
  { id: "box000000002", type: "grid", props: {}, children: [kid("txt000000002", "text", { html: "<p>Cellule</p>" }), kid("hed000000003", "heading", { text: "Dans la grille", level: "3" }, { hidden: true })] },
] }] };
const BIG = { sections: [{ id: "sect00000001", type: "layout", children: Array.from({ length: 40 }, (_, i) => ({ id: `bx${String(i).padStart(10, "0")}`, type: "container", props: {}, children: [kid(`ht${String(i).padStart(10, "0")}`, "heading", { text: `Titre ${i}`, level: "3" }), kid(`tx${String(i).padStart(10, "0")}`, "text", { html: `<p>Texte ${i}</p>` })] })) }] };

describe("partie droite de l'éditeur : thème, structure, inspecteur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, n = 0, pageId;
  const db = () => srv.db();
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
  async function openEditor(content = CONTENT, { viewport = { width: 1600, height: 900 }, theme = null, reduce = false } = {}) {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport, reducedMotion: reduce ? "reduce" : "no-preference" });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    pageId = Number((await boss.post("/marketing/pages", { name: `Droite ${n}` })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 160));
    if (theme) await context.addInitScript((v) => { try { if (localStorage.getItem("pb:palette-theme") === null) localStorage.setItem("pb:palette-theme", JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }, theme); // seulement au premier chargement : un rechargement doit relire le choix fait dans l'éditeur
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    await wait(400);
  }
  const deselect = async () => { const b = page.locator(".pb-insp-head button[aria-label='Désélectionner']"); if (await b.count()) await b.first().click(); await until(async () => (await page.locator("[data-pb-inspector]").innerText()).includes("Aucun élément sélectionné"), "état vide"); };
  const row = (id) => page.locator(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item`);
  const pick = async (id) => { await row(id).click(); await wait(250); };
  const mode = () => page.evaluate(() => document.querySelector("[data-pb-main]").dataset.palette);
  const draft = () => { const r = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections) }; };
  const find = (id) => { let out = null; const walk = (list) => { for (const x of list || []) { if (x.id === id) out = x; walk(x.children); } }; walk(draft().sections); return out; };
  const count = () => { let n = 0; const walk = (list) => { for (const x of list || []) { n += 1; walk(x.children); } }; walk(draft().sections); return n; };
  const until = async (fn, what, ms = 8000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = await fn(); } catch { /* on réessaie */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(100); } };

  // Contraste WCAG entre la couleur d'un texte et le fond réel (premier ancêtre non transparent)
  const contrastOf = (sel) => page.evaluate((s) => {
    const el = document.querySelector(s); if (!el) return null;
    const rgb = (c) => (c.match(/[\d.]+/g) || [0, 0, 0, 1]).map(Number);
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    let bg = null; for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c[3] === undefined || c[3] > 0.95) { bg = c; break; } }
    const fg = rgb(getComputedStyle(el).color); const [a, b] = [lum(fg), lum(bg || [255, 255, 255])].sort((x, y) => y - x);
    return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
  }, sel);
  const bgOf = (sel) => page.evaluate((s) => getComputedStyle(document.querySelector(s)).backgroundColor.match(/\d+/g).slice(0, 3).map(Number), sel);

  // Plus aucun élément de la partie droite ne dépasse du panneau (ni à droite, ni en largeur de défilement)
  const noOverflow = (label) => page.evaluate(() => {
    const right = document.querySelector(".pb-right"), r = right.getBoundingClientRect(), bad = [];
    for (const box of [right, document.querySelector(".pb-inspector"), document.querySelector("[data-pb-layers]")]) if (box.scrollWidth > box.clientWidth + 1) bad.push(`défilement horizontal ${box.className} (${box.scrollWidth} > ${box.clientWidth})`);
    for (const el of right.querySelectorAll("*")) {
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || cs.position === "fixed") continue;
      if (b.right > r.right + 1 && !el.closest("[hidden]")) bad.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} « ${(el.textContent || el.getAttribute("aria-label") || el.placeholder || "").trim().slice(0, 40)} » dans ${el.parentElement.tagName.toLowerCase()}.${String(el.parentElement.className).slice(0, 30)} déborde de ${Math.round(b.right - r.right)} px`);
    }
    return bad.slice(0, 6);
  }).then((bad) => assert.deepEqual(bad, [], `${label} : rien ne déborde du panneau de droite`));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("thème : les jetons --editor-* sont la source unique ; clair et sombre sont réellement appliqués au panneau de droite, lisibles (contraste ≥ 4,5)", async () => {
    await openEditor(CONTENT, { theme: "light" });
    const tokens = () => page.evaluate(() => { const s = getComputedStyle(document.body); return Object.fromEntries(["--editor-panel", "--editor-panel-secondary", "--editor-card", "--editor-border", "--editor-text", "--editor-muted", "--editor-hover", "--editor-active", "--editor-input", "--editor-accent", "--editor-danger", "--editor-success", "--editor-shadow", "--editor-bg"].map((k) => [k, s.getPropertyValue(k).trim()])); });
    const clair = await tokens();
    assert.ok(Object.values(clair).every(Boolean), `tous les jetons existent : ${JSON.stringify(clair)}`);
    assert.equal(await mode(), "light");
    const lumi = (c) => c.reduce((a, v) => a + v, 0) / 3;
    const surfacesClair = { structure: await bgOf(".pb-layers-panel"), inspecteur: await bgOf(".pb-inspector") };
    assert.ok(lumi(surfacesClair.structure) > 240, "structure claire"); assert.ok(lumi(surfacesClair.inspecteur) > 235 && lumi(surfacesClair.inspecteur) < lumi(surfacesClair.structure), "inspecteur : zone secondaire, légèrement différenciée (pas blanc sur blanc)");
    await pick("hed000000001");
    for (const sel of [".pb-row-item .pb-node-name", ".pb-page-count", ".pb-panel-head h2", ".pb-insp-head h2", ".pb-insp-head .pb-kind", ".pb-inspector .pb-field > label", ".pb-inspector .pb-hint", ".pb-insp-tabs button[aria-selected=\"true\"]", ".pb-insp-tabs button:not([aria-selected=\"true\"])"]) {
      assert.ok((await contrastOf(sel)) >= 4.5, `clair : ${sel} lisible (${await contrastOf(sel)})`);
    }
    await page.locator("[data-pb-theme-toggle]").click(); await wait(60);
    assert.equal(await mode(), "dark", "la bascule est instantanée");
    const sombre = await tokens();
    for (const k of ["--editor-panel", "--editor-card", "--editor-text", "--editor-border", "--editor-active"]) assert.notEqual(sombre[k], clair[k], `${k} change avec le thème`);
    await wait(350);
    const surfacesSombre = { structure: await bgOf(".pb-layers-panel"), inspecteur: await bgOf(".pb-inspector") };
    assert.ok(lumi(surfacesSombre.structure) < 40 && lumi(surfacesSombre.inspecteur) < 30, "sombre : surfaces sombres, pas de noir absolu");
    assert.ok(lumi(surfacesSombre.structure) > 5, "sombre : niveaux étagés (pas de noir pur)");
    assert.notDeepEqual(surfacesSombre.structure, surfacesSombre.inspecteur, "sombre : structure et inspecteur sont deux niveaux distincts");
    for (const sel of [".pb-row-item .pb-node-name", ".pb-page-count", ".pb-panel-head h2", ".pb-insp-head h2", ".pb-insp-head .pb-kind", ".pb-inspector .pb-field > label", ".pb-inspector .pb-hint", ".pb-insp-tabs button[aria-selected=\"true\"]", ".pb-insp-tabs button:not([aria-selected=\"true\"])"]) {
      assert.ok((await contrastOf(sel)) >= 4.5, `sombre : ${sel} lisible (${await contrastOf(sel)})`);
    }
    // les champs suivent aussi (zone de saisie réellement sombre, texte clair)
    const champ = await page.evaluate(() => { const i = document.querySelector(".pb-inspector .pb-field input[type=text], .pb-inspector .pb-field textarea"); const c = getComputedStyle(i); return { bg: c.backgroundColor.match(/\d+/g).slice(0, 3).map(Number), fg: c.color.match(/\d+/g).slice(0, 3).map(Number), scheme: c.colorScheme }; });
    assert.ok(lumi(champ.bg) < 50 && lumi(champ.fg) > 180 && /dark/.test(champ.scheme), `champs sombres (${JSON.stringify(champ)})`);
  });

  test("bascule clair / sombre : mémorisée au rechargement dans les deux sens, synchronisée avec le sélecteur de la palette, nommée pour les lecteurs d'écran", async () => {
    await openEditor(CONTENT, { theme: "light" });
    const t = page.locator("[data-pb-theme-toggle]");
    assert.equal(await t.getAttribute("aria-pressed"), "false"); assert.match(await t.getAttribute("aria-label"), /sombre/);
    await t.click(); await wait(100);
    assert.equal(await mode(), "dark"); assert.equal(await t.getAttribute("aria-pressed"), "true"); assert.match(await t.getAttribute("aria-label"), /clair/);
    assert.equal(await page.evaluate(() => document.querySelector('[data-pal-mode="dark"]').getAttribute("aria-checked")), "true", "le sélecteur de la palette suit");
    assert.equal(await page.evaluate(() => document.body.dataset.palette), "dark", "menus et sélecteurs ouverts hors des panneaux : même thème");
    await page.reload(); await ready(); await wait(400);
    assert.equal(await mode(), "dark", "sombre mémorisé");
    await page.locator("[data-pb-theme-toggle]").click(); await wait(100);
    await page.reload(); await ready(); await wait(400);
    assert.equal(await mode(), "light", "clair mémorisé");
    await page.click('[data-pal-mode="dark"]'); await wait(100);
    assert.equal(await page.locator("[data-pb-theme-toggle]").getAttribute("aria-pressed"), "true", "le sélecteur de la palette met aussi la bascule à jour");
  });

  test("transition du thème : légère sur les surfaces (jamais sur les mesures), supprimée si l'on a demandé moins d'animations", async () => {
    await openEditor(CONTENT, { theme: "dark" });
    const tr = () => page.evaluate(() => { const c = getComputedStyle(document.querySelector(".pb-inspector")); const r = getComputedStyle(document.querySelector(".pb-row-item")); return { insp: c.transitionProperty + " | " + c.transitionDuration, row: r.transitionProperty + " | " + r.transitionDuration }; });
    const normal = await tr();
    assert.match(normal.insp, /background-color/); assert.match(normal.insp, /0\.16s/); assert.doesNotMatch(normal.insp, /width|height|top|left|transform|all/);
    await openEditor(CONTENT, { theme: "dark", reduce: true });
    const calme = await tr();
    assert.match(calme.insp, /0s/, "mouvement réduit : plus de transition"); assert.doesNotMatch(calme.insp, /0\.16s/);
  });

  test("structure : en-tête (icônes alignées, de même taille, sans chevauchement, nommées) ; replier, fermer, rouvrir ; thème clair et sombre", async () => {
    for (const theme of ["light", "dark"]) {
      await openEditor(CONTENT, { theme });
      const g = await page.evaluate(() => {
        const head = document.querySelector("[data-pb-layers-head]"), hr = head.getBoundingClientRect();
        const btns = [...head.querySelectorAll("button")].map((b) => { const r = b.getBoundingClientRect(); return { l: b.getAttribute("aria-label"), tip: b.dataset.tip, x: r.left, w: r.width, h: r.height, top: r.top, bottom: r.bottom }; });
        return { hr: { left: hr.left, right: hr.right, top: hr.top, bottom: hr.bottom, h: hr.height }, btns };
      });
      assert.ok(g.btns.length >= 5, `${theme} : bascule du thème, ajouter, détacher, fermer, replier`);
      for (const b of g.btns) { assert.ok(b.l && b.tip, `${theme} : « ${b.l} » a un nom et une infobulle`); assert.equal(Math.round(b.w), 28); assert.equal(Math.round(b.h), 28); assert.ok(b.top >= g.hr.top && b.bottom <= g.hr.bottom && b.x >= g.hr.left && b.x + b.w <= g.hr.right, `${theme} : « ${b.l} » reste dans l'en-tête`); }
      const sorted = [...g.btns].sort((a, b) => a.x - b.x);
      for (let i = 1; i < sorted.length; i++) assert.ok(sorted[i].x >= sorted[i - 1].x + sorted[i - 1].w - 0.5, `${theme} : « ${sorted[i].l} » ne chevauche pas « ${sorted[i - 1].l} »`);
      assert.equal(new Set(sorted.map((b) => Math.round(b.top))).size, 1, `${theme} : icônes alignées`);
    }
    const toggle = page.locator("[data-pb-layers-toggle]");
    await toggle.click(); await wait(200);
    assert.ok(await page.evaluate(() => document.querySelector(".pb-right").classList.contains("is-layers-collapsed")), "replié");
    assert.equal(await page.locator("[data-pb-layers]").isVisible(), false);
    await toggle.click(); await wait(200);
    assert.equal(await page.locator("[data-pb-layers]").isVisible(), true, "rouvert");
    await page.locator("[data-pb-layers-close]").click(); await wait(250);
    assert.equal(await page.locator("[data-pb-layers-panel]").isVisible(), false, "fermé : la Structure disparaît");
    assert.equal(await page.locator("[data-pb-inspector]").isVisible(), true, "l'inspecteur reste disponible");
  });

  test("arbre : hiérarchie lisible (repères d'indentation), états sélectionné / survolé / masqué, actions discrètes puis visibles au survol, nom long tronqué", async () => {
    await openEditor(CONTENT, { theme: "dark" });
    const info = () => page.evaluate(() => {
      const q = (id) => document.querySelector(`.pb-node[data-id="${id}"] > .pb-row-item`);
      const o = (id) => { const e = q(id); const f = e.querySelector(".pb-flag:not(.is-on):not(.pb-flag-more):not(.pb-flag-delete)"); return Number(getComputedStyle(f).opacity); };
      const lv = (id) => Number(q(id).style.getPropertyValue("--level"));
      return { lvBox: lv("box000000001"), lvCol: lv("col000000001"), lvHed: lv("hed000000001"), guideDeep: getComputedStyle(q("hed000000001")).backgroundImage !== "none", guideRoot: getComputedStyle(q("box000000001")).backgroundSize,
        restOpacity: o("txt000000001"), hiddenOn: Number(getComputedStyle(q("hed000000003").querySelector(".pb-flag.is-on")).opacity), name: (() => { const n = q("box000000001").querySelector(".pb-node-name"); return { sw: n.scrollWidth, cw: n.clientWidth, over: getComputedStyle(n).textOverflow }; })(), rowW: q("box000000001").getBoundingClientRect().width, panelW: document.querySelector("[data-pb-layers]").clientWidth };
    });
    let i = await info();
    assert.deepEqual([i.lvBox, i.lvCol, i.lvHed], [1, 2, 3], "niveaux hiérarchiques");
    assert.ok(i.guideDeep, "repères d'indentation dessinés"); assert.equal(i.restOpacity, 0, "actions discrètes au repos");
    assert.equal(i.hiddenOn, 1, "un état actif (masqué) reste visible sans survol");
    assert.ok(i.name.sw > i.name.cw && i.name.over === "ellipsis", "nom long : tronqué avec « … », sans déborder"); assert.ok(i.rowW <= i.panelW, "la ligne ne dépasse pas l'arbre");
    await row("txt000000001").hover(); await wait(200);
    assert.equal(await page.evaluate(() => Number(getComputedStyle(document.querySelector('.pb-node[data-id="txt000000001"] > .pb-row-item .pb-flag')).opacity)), 1, "survol : actions pleines");
    const hov = await page.evaluate(() => getComputedStyle(document.querySelector('.pb-node[data-id="txt000000001"] > .pb-row-item')).backgroundColor);
    const base = await page.evaluate(() => getComputedStyle(document.querySelector('.pb-node[data-id="btn000000001"] > .pb-row-item')).backgroundColor);
    assert.notEqual(hov, base, "survol : fond discret");
    await pick("hed000000001");
    const sel = await page.evaluate(() => { const e = document.querySelector('.pb-node[data-id="hed000000001"] > .pb-row-item'), c = getComputedStyle(e); return { bg: c.backgroundColor, shadow: c.boxShadow, weight: getComputedStyle(e.querySelector(".pb-node-name")).fontWeight, sel: e.classList.contains("is-selected") }; });
    assert.ok(sel.sel && /inset/.test(sel.shadow), "sélection : barre d'accent"); assert.ok(Number(sel.weight) >= 700, "sélection : nom en gras"); assert.notEqual(sel.bg, base);
    assert.equal(await page.evaluate(() => document.querySelector('.pb-node[data-id="hed000000001"]').getAttribute("aria-selected")), "true");
    assert.equal(await page.evaluate(() => document.querySelector('.pb-node[data-id="hed000000003"]').classList.contains("is-hidden")), true, "état masqué");
  });

  test("recherche de calques : filtre instantané, conserve la hiérarchie des parents, message si rien ; lisible en clair et en sombre", async () => {
    for (const theme of ["light", "dark"]) {
      await openEditor(CONTENT, { theme });
      const q = page.locator("[data-pb-layers-q]");
      assert.ok((await contrastOf(".pb-layers-search input")) >= 4.5, `${theme} : saisie lisible`);
      assert.ok(await page.evaluate(() => getComputedStyle(document.querySelector(".pb-layers-search input")).backgroundImage.includes("svg")), `${theme} : icône de recherche`);
      await q.fill("image"); await wait(120);
      const vis = await page.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-node")].map((n) => n.dataset.id));
      assert.ok(vis.includes("img000000001"), "l'image est affichée"); for (const parent of ["box000000001", "col000000001"]) assert.ok(vis.includes(parent), `${theme} : le parent ${parent} reste affiché (hiérarchie)`);
      assert.ok(!vis.includes("hed000000002") && !vis.includes("txt000000002"), `${theme} : le reste est filtré`);
      await q.fill("zzzzzz"); await wait(120);
      assert.equal(await page.locator("[data-pb-layers] .pb-node").count(), 0); assert.match(await page.locator("[data-pb-layers]").innerText(), /Aucun calque/);
      await q.fill(""); await wait(120);
      assert.ok((await page.locator("[data-pb-layers] .pb-node").count()) >= 10, "recherche vidée : tout revient");
    }
  });

  test("actions d'un calque : le menu ⋮ propose les mêmes actions que le clic droit et elles fonctionnent (dupliquer, renommer, masquer, supprimer)", async () => {
    await openEditor(CONTENT, { theme: "dark" });
    const before = count();
    await row("txt000000001").hover();
    await page.locator('.pb-node[data-id="txt000000001"] > .pb-row-item .pb-flag-more').click(); await wait(150);
    const items = await page.locator(".pb-menu:not([hidden]) .pb-menu-item").allInnerTexts();
    for (const label of ["Dupliquer", "Copier", "Couper", "Coller", "Renommer", "Masquer", "Verrouiller", "Monter", "Descendre", "Supprimer"]) assert.ok(items.some((t) => t.startsWith(label)), `entrée « ${label} » (menu : ${items.join(" / ")})`);
    assert.ok(await page.evaluate(() => { const m = document.querySelector(".pb-menu:not([hidden])"); const c = getComputedStyle(m); return c.backgroundColor.match(/\d+/g).slice(0, 3).every((v) => Number(v) < 60); }), "menu ouvert hors des panneaux : thème sombre");
    await page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: /^Dupliquer/ }).click();
    await until(() => count() === before + 1, "élément dupliqué");
    await row("txt000000001").hover();
    await page.locator('.pb-node[data-id="txt000000001"] > .pb-row-item .pb-flag-more').click(); await wait(150);
    await page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: /^Masquer/ }).click();
    await until(() => { const e = find("txt000000001"); return e && e.hidden === true; }, "élément masqué");
    await page.locator('.pb-node[data-id="btn000000002"] > .pb-row-item').click();
    await page.locator('.pb-node[data-id="btn000000002"] > .pb-row-item .pb-flag-more').click(); await wait(150);
    await page.locator(".pb-menu:not([hidden]) .pb-menu-item", { hasText: /^Supprimer/ }).click();
    await until(() => !JSON.stringify(draft()).includes("btn000000002"), "élément supprimé");
  });

  test("glisser-déposer des calques : ligne d'insertion à la bonne indentation, zone « dans » le conteneur ; le dépôt déplace réellement l'élément", async () => {
    await openEditor(CONTENT, { theme: "light" });
    const src = row("btn000000002"), dst = row("hed000000001");
    const dt = await page.evaluateHandle(() => new DataTransfer());
    await src.dispatchEvent("dragstart", { dataTransfer: dt });
    const box = await dst.boundingBox();
    await dst.dispatchEvent("dragover", { dataTransfer: dt, clientX: box.x + 20, clientY: box.y + 3 });
    const before = await page.evaluate(() => { const e = document.querySelector('.pb-node[data-id="hed000000001"] > .pb-row-item'); const a = getComputedStyle(e, "::after"), b = getComputedStyle(e, "::before"); return { cls: e.className, afterContent: a.content, afterHeight: a.height, afterLeft: parseFloat(a.left), dot: b.content, level: Number(e.style.getPropertyValue("--level")) }; });
    assert.match(before.cls, /is-drop-before/); assert.notEqual(before.afterContent, "none"); assert.equal(before.afterHeight, "2px"); assert.equal(before.afterLeft, before.level * 14 + 24, "la ligne est indentée comme le niveau de destination"); assert.notEqual(before.dot, "none", "point d'insertion");
    await dst.dispatchEvent("dragleave", { dataTransfer: dt });
    await dst.dispatchEvent("dragover", { dataTransfer: dt, clientX: box.x + 20, clientY: box.y + box.height / 2 });
    const container = row("col000000001");
    const cb = await container.boundingBox();
    await container.dispatchEvent("dragover", { dataTransfer: dt, clientX: cb.x + 20, clientY: cb.y + cb.height / 2 });
    assert.match(await container.getAttribute("class"), /is-drop-inside/, "zone de dépôt dans le conteneur");
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.pb-node[data-id="col000000001"] > .pb-row-item')).borderStyle), "dashed");
    await container.dispatchEvent("drop", { dataTransfer: dt, clientX: cb.x + 20, clientY: cb.y + cb.height / 2 });
    await until(() => { const col = draft().sections[0].children[0].children[0]; return col.children.some((c) => c.id === "btn000000002"); }, "élément déplacé dans la colonne");
  });

  test("inspecteur sans sélection : message clair, écran (ordinateur / tablette / mobile), réglages de la page, annuler / rétablir réels (états, infobulles), informations en accordéon", async () => {
    for (const theme of ["light", "dark"]) {
      await openEditor(CONTENT, { theme });
      const ins = page.locator("[data-pb-inspector]");
      assert.match(await ins.innerText(), /Aucun élément sélectionné/);
      const undo = ins.locator(".pb-hist-btn", { hasText: "Annuler" }), redo = ins.locator(".pb-hist-btn", { hasText: "Rétablir" });
      assert.equal(await undo.isDisabled(), true, `${theme} : Annuler désactivé sans historique`); assert.equal(await redo.isDisabled(), true);
      assert.match(await undo.getAttribute("data-tip"), /Ctrl/); assert.match(await redo.getAttribute("data-tip"), /Maj/);
      assert.ok(Number(await undo.evaluate((b) => getComputedStyle(b).opacity)) < 0.6, "état désactivé visible");
      // une vraie modification : dupliquer un élément, puis annuler / rétablir depuis l'inspecteur
      const n0 = count(); await pick("txt000000001");
      await page.keyboard.press("Control+d"); await until(() => count() === n0 + 1, "dupliqué");
      await deselect();
      assert.equal(await undo.isEnabled(), true, `${theme} : Annuler actif après une modification`);
      await undo.click(); await until(() => count() === n0, "annulé");
      await deselect(); assert.equal(await redo.isEnabled(), true, "Rétablir actif");
      await redo.click(); await until(() => count() === n0 + 1, "rétabli"); await deselect();
      // écran
      await ins.locator('.pb-bp-seg [data-device="tablet"]').click(); await wait(300);
      assert.equal(await page.evaluate(() => document.querySelector("[data-pb-frame-wrap]").dataset.device), "tablet", "l'écran change réellement");
      assert.equal(await ins.locator('.pb-bp-seg [data-device="tablet"]').getAttribute("aria-checked"), "true");
      assert.ok((await contrastOf('.pb-bp-seg [aria-checked="true"]')) >= 3, `${theme} : écran actif très lisible`);
      await ins.locator('.pb-bp-seg [data-device="desktop"]').click(); await wait(200);
      // réglages de la page : ouvre l'onglet Page du panneau de gauche
      await ins.getByRole("button", { name: "Réglages de la page" }).click(); await wait(200);
      assert.equal(await page.locator("#pb-tab-page").getAttribute("aria-selected"), "true");
      assert.equal(await page.locator("#pb-pane-page").isVisible(), true);
      // informations : accordéon
      const det = page.locator("[data-pb-info]");
      const open0 = await det.evaluate((d) => d.open);
      await det.locator("summary").click(); await wait(250);
      assert.equal(await det.evaluate((d) => d.open), !open0, "l'accordéon s'ouvre / se ferme");
      assert.match(await det.locator("summary").innerText(), /Informations sur la page/);
      const chev = await det.evaluate((d) => getComputedStyle(d.querySelector("summary"), "::before").transform);
      assert.notEqual(chev, "none", "chevron animé");
      await noOverflow(`${theme} : état vide`);
    }
  });

  test("inspecteur d'un élément : en-tête (icône, type, nom, ⋮, fermer), onglets, en-tête collé pendant le défilement, retour à l'état vide", async () => {
    await openEditor(CONTENT, { theme: "dark" });
    await pick("btn000000001");
    const head = page.locator(".pb-insp-head");
    assert.match(await head.locator(".pb-kind").innerText(), /Modifier Bouton/i); assert.match(await head.locator("h2").innerText(), /Acheter|Bouton/);
    assert.equal(await head.locator(".pb-insp-icon svg").count(), 1, "icône du type");
    assert.equal(await head.locator(".pb-panel-toggle").count(), 2, "menu ⋮ et fermer");
    await head.locator('button[aria-label="Actions de la sélection"]').click(); await wait(150);
    assert.ok((await page.locator(".pb-menu:not([hidden]) .pb-menu-item").count()) >= 8, "le menu ⋮ de l'en-tête liste les actions de l'élément");
    await page.keyboard.press("Escape"); await wait(150);
    await pick("btn000000001");
    for (const tab of ["Style", "Avancé", "Contenu"]) { await page.locator(".pb-insp-tabs button", { hasText: tab }).click(); await wait(200); assert.equal(await page.locator(".pb-insp-tabs button", { hasText: tab }).getAttribute("aria-selected"), "true"); }
    await page.locator(".pb-insp-tabs button", { hasText: "Style" }).click(); await wait(200);
    await page.evaluate(() => { document.querySelectorAll(".pb-inspector details").forEach((d) => { d.open = true; }); const i = document.querySelector(".pb-inspector"); i.scrollTop = 400; });
    await wait(150);
    const stuck = await page.evaluate(() => { const i = document.querySelector(".pb-inspector").getBoundingClientRect(), h = document.querySelector(".pb-insp-head").getBoundingClientRect(), t = document.querySelector(".pb-insp-tabs").getBoundingClientRect(); return { headTop: h.top - i.top, tabsTop: Math.round(t.top - h.bottom), scrolled: document.querySelector(".pb-inspector").scrollTop }; });
    assert.ok(stuck.scrolled > 50, "l'inspecteur a défilé"); assert.ok(Math.abs(stuck.headTop) <= 1, "l'en-tête reste visible en haut"); assert.ok(Math.abs(stuck.tabsTop) <= 1, "les onglets restent sous l'en-tête");
    await head.locator('button[aria-label="Désélectionner"]').click(); await wait(250);
    assert.match(await page.locator("[data-pb-inspector]").innerText(), /Aucun élément sélectionné/);
    assert.equal(await page.evaluate(() => document.querySelectorAll(".pb-row-item.is-selected").length), 0);
  });

  test("rien ne déborde : 3 tailles de fenêtre × largeur mini / maxi du panneau × vide, élément, conteneur (3 onglets) × clair et sombre", async () => {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 2560, height: 1440 }]) {
      for (const theme of ["light", "dark"]) {
        await openEditor(CONTENT, { viewport, theme });
        for (const w of [280, 560]) {
          await page.evaluate((width) => { const h = document.querySelector('[data-pb-resize="right"]'); h.focus(); }, w);
          const cur = await page.evaluate(() => document.querySelector(".pb-right").getBoundingClientRect().width);
          const steps = Math.round(Math.abs(cur - w) / 16) + 6;
          for (let i = 0; i < steps; i++) await page.keyboard.press(w < cur ? "ArrowRight" : "ArrowLeft");
          await wait(120);
          const width = await page.evaluate(() => Math.round(document.querySelector(".pb-right").getBoundingClientRect().width));
          assert.ok(width >= 280 && width <= Math.round(viewport.width * 0.5) + 1, `${viewport.width}px : largeur du panneau ${width} dans les limites`);
          const label = `${viewport.width}×${viewport.height} ${theme} panneau ${width}`;
          await row("hed000000001").click(); await deselect();
          await noOverflow(`${label} vide`);
          await pick("btn000000001");
          for (const tab of ["Contenu", "Style", "Avancé"]) { await page.locator(".pb-insp-tabs button", { hasText: tab }).click(); await wait(120); await page.evaluate(() => document.querySelectorAll(".pb-inspector details").forEach((d) => { d.open = true; })); await noOverflow(`${label} bouton ${tab}`); }
          await pick("col000000001");
          for (const tab of ["Général", "Style", "Interactions"]) { const b = page.locator(".pb-insp-tabs button", { hasText: tab }); if (await b.count()) { await b.first().click(); await wait(120); await page.evaluate(() => document.querySelectorAll(".pb-inspector details").forEach((d) => { d.open = true; })); await noOverflow(`${label} conteneur ${tab}`); } }
        }
      }
    }
  });

  test("largeur du panneau : jamais en dessous de 280 px ni au-delà de la moitié de la fenêtre, y compris une ancienne valeur enregistrée", async () => {
    await openEditor(CONTENT, { viewport: { width: 1280, height: 800 } });
    await page.evaluate(() => { try { localStorage.setItem("pb:panels", JSON.stringify({ left: 260, right: 200, layers: 46, leftHidden: false, rightHidden: false })); } catch (e) { /* ignoré */ } });
    await page.reload(); await ready(); await wait(400);
    assert.ok((await page.evaluate(() => document.querySelector(".pb-right").getBoundingClientRect().width)) >= 279, "ancienne largeur de 200 px relevée à 280");
    await page.locator('[data-pb-resize="right"]').focus();
    for (let i = 0; i < 60; i++) await page.keyboard.press("ArrowRight");
    assert.ok((await page.evaluate(() => document.querySelector(".pb-right").getBoundingClientRect().width)) >= 279, "plancher : 280 px");
    for (let i = 0; i < 60; i++) await page.keyboard.press("ArrowLeft");
    assert.ok((await page.evaluate(() => document.querySelector(".pb-right").getBoundingClientRect().width)) <= 641, "plafond : la moitié de la fenêtre (640 px pour 1280)");
  });

  test("beaucoup d'éléments : l'arbre défile seul (une seule barre de défilement), l'en-tête, la recherche et l'inspecteur restent en place", async () => {
    await openEditor(BIG, { theme: "dark", viewport: { width: 1600, height: 800 } });
    const g = await page.evaluate(() => { const t = document.querySelector("[data-pb-layers]"), h = document.querySelector("[data-pb-layers-head]"), s = document.querySelector(".pb-layers-search"), r = document.querySelector(".pb-right").getBoundingClientRect(); return { tScroll: t.scrollHeight > t.clientHeight, tOverflow: getComputedStyle(t).overflowY, headTop: h.getBoundingClientRect().top, panelH: r.height, bodyScroll: document.documentElement.scrollHeight > innerHeight + 1 }; });
    assert.ok(g.tScroll && g.tOverflow === "auto", "l'arbre défile"); assert.equal(g.bodyScroll, false, "la page elle-même ne défile pas (pas de double barre)");
    await page.evaluate(() => { document.querySelector("[data-pb-layers]").scrollTop = 99999; }); await wait(100);
    const after = await page.evaluate(() => ({ headTop: document.querySelector("[data-pb-layers-head]").getBoundingClientRect().top, searchTop: document.querySelector(".pb-layers-search").getBoundingClientRect().top, lastVisible: (() => { const t = document.querySelector("[data-pb-layers]").getBoundingClientRect(); const rows = [...document.querySelectorAll("[data-pb-layers] .pb-row-item")]; const last = rows[rows.length - 1].getBoundingClientRect(); return last.bottom <= t.bottom + 1 && last.top >= t.top; })() }));
    assert.equal(after.headTop, g.headTop, "l'en-tête ne bouge pas"); assert.ok(after.lastVisible, "la dernière ligne est entièrement visible");
    await noOverflow("beaucoup d'éléments");
  });

  test("sélecteurs ouverts depuis l'inspecteur (couleur, animation) : même thème que le panneau, lisibles", async () => {
    await openEditor(CONTENT, { theme: "dark" });
    await pick("hed000000001");
    await page.locator(".pb-insp-tabs button", { hasText: "Style" }).click(); await wait(250);
    await page.evaluate(() => document.querySelectorAll(".pb-inspector details").forEach((d) => { d.open = true; }));
    await page.locator(".pb-color-btn").first().click(); await wait(250);
    const pop = await page.evaluate(() => { const p = document.querySelector(".pb-cpop:not([hidden])"); const c = getComputedStyle(p); return { bg: c.backgroundColor.match(/\d+/g).slice(0, 3).map(Number), fg: c.color.match(/\d+/g).slice(0, 3).map(Number) }; });
    assert.ok(pop.bg.every((v) => v < 60) && pop.fg.every((v) => v > 150), `sélecteur de couleur sombre (${JSON.stringify(pop)})`);
    await page.keyboard.press("Escape"); await wait(100);
    await page.locator(".pb-insp-tabs button", { hasText: "Avancé" }).click(); await wait(250);
    await page.evaluate(() => document.querySelectorAll(".pb-inspector details").forEach((d) => { d.open = true; })); await wait(150);
    const pickBtn = page.locator("[data-pb-anim-pick]");
    if (await pickBtn.count()) { await pickBtn.first().click(); await wait(200); const a = await page.evaluate(() => getComputedStyle(document.querySelector(".pb-amenu")).backgroundColor.match(/\d+/g).slice(0, 3).map(Number)); assert.ok(a.every((v) => v < 60), "menu des animations sombre"); await page.keyboard.press("Escape"); }
  });

  test("la palette de gauche est restée identique (mêmes couleurs qu'avant) dans les deux thèmes", async () => {
    for (const [theme, bg, card] of [["light", [255, 255, 255], [255, 255, 255]], ["dark", [21, 21, 21], [27, 27, 27]]]) {
      await openEditor(CONTENT, { theme });
      const got = await page.evaluate(() => { const c = (s) => getComputedStyle(document.querySelector(s)).backgroundColor.match(/\d+/g).slice(0, 3).map(Number); return { left: c(".pb-left"), card: c(".pb-left .pb-pal-item") }; });
      assert.deepEqual(got.left, bg, `${theme} : fond de la palette`); assert.deepEqual(got.card, card, `${theme} : cartes de la palette`);
    }
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => { assert.deepEqual(errors, []); });
});
