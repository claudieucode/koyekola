// Éditeur de pages — CANVAS, LARGEUR DE PAGE, CONTRAINTES WEB et PALETTE dans un VRAI navigateur (Chrome piloté par Playwright)
// contre un vrai serveur. Chaque scénario clique comme une personne, puis relit les dimensions RÉELLES calculées par le navigateur.
// Couvre : page de bureau fluide (suit l'espace disponible, jamais sous les panneaux), tablette et mobile centrés, panneaux repliés,
// zoom et sélection alignés, aucun débordement (image géante, texte et lien interminables, bouton, tableau, code, colonnes, grille),
// largeurs de contenu du site (pleine largeur / encadrée / personnalisée), palette claire / sombre / système et sa persistance.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(check, { timeout = 15000, every = 120, what = "condition" } = {}) {
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

const LONG = "Supercalifragilisticexpialidocious".repeat(8);
const WIDE_ROW = Array.from({ length: 8 }, (_, i) => `Cellule très large numéro ${i + 1} ${"x".repeat(30)}`);
// Page de contrainte : tout ce qui peut déborder (texte et lien interminables, bouton, image géante, vidéo, tableau, code, colonnes, grille)
const STRESS = { sections: [
  { id: "sect00000001", type: "layout", children: [
    { id: "cont00000001", type: "container", props: { tag: "section", full: true }, children: [
      { id: "head00000001", type: "heading", props: { text: `Pleine largeur ${LONG}`, level: "1" } },
      { id: "text00000001", type: "text", props: { html: `<p>${LONG} ${LONG}</p><p><a href="https://exemple.com/${"a".repeat(180)}">https://exemple.com/${"a".repeat(180)}</a></p>` } },
      { id: "butn00000001", type: "button", props: { label: "Un bouton avec un texte vraiment très long pour vérifier qu'il reste contenu dans son parent", url: "https://exemple.com", variant: "primary" } },
      { id: "imag00000001", type: "image", props: { src: "/uploads/thumbnails/grand.svg", alt: "Très grande image" } },
      { id: "vide00000001", type: "video", props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Vidéo" } },
      { id: "tabl00000001", type: "table", props: { rows: [WIDE_ROW, WIDE_ROW, WIDE_ROW], header: true } },
      { id: "code00000001", type: "code", props: { text: `const x = '${"y".repeat(400)}';` } },
    ] },
  ] },
  { id: "sect00000002", type: "layout", children: [
    { id: "cols00000001", type: "columns", children: [
      { id: "colu00000001", type: "column", children: [{ id: "head00000002", type: "heading", props: { text: `Colonne A ${LONG}`, level: "2" } }, { id: "imag00000002", type: "image", props: { src: "/uploads/thumbnails/grand.svg", alt: "Image dans une colonne" } }] },
      { id: "colu00000002", type: "column", children: [{ id: "text00000002", type: "text", props: { html: `<p>${LONG}</p>` } }, { id: "butn00000002", type: "button", props: { label: "Bouton en colonne avec un libellé long et plusieurs mots", url: "https://exemple.com" } }] },
    ] },
    { id: "grid00000001", type: "grid", children: [
      { id: "text00000003", type: "text", props: { html: `<p>${LONG}</p>` } },
      { id: "imag00000003", type: "image", props: { src: "/uploads/thumbnails/grand.svg", alt: "Image dans une grille" } },
      { id: "text00000004", type: "text", props: { html: "<p>Court</p>" } },
    ] },
  ] },
  { id: "sect00000003", type: "layout", children: [
    { id: "cont00000002", type: "container", children: [{ id: "head00000003", type: "heading", props: { text: "Conteneur encadré", level: "2" } }] },
  ] },
] };

describe("canvas, largeur de page, contraintes web et palette (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, n = 0, pageId;
  const db = () => srv.db();
  const frameDoc = (fn, arg) => page.evaluate(`(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return (${fn.toString()})(d, ${JSON.stringify(arg === undefined ? null : arg)}); })()`);
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 20000 });

  async function openEditor(content, { siteSettings = null, viewport = { width: 1920, height: 1080 }, palette = null } = {}) {
    n += 1;
    // Navigateur neuf à chaque scénario : aucune préférence (panneaux, palette, zoom) ne fuit d'un test à l'autre
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
    if (siteSettings) {
      const org = db().prepare("SELECT organization_id AS o FROM mk_landing_pages WHERE id = ?").get(pageId).o;
      const info = db().prepare("INSERT INTO mk_sites (organization_id, name, settings) VALUES (?, ?, ?)").run(org, `Site canvas ${n}`, JSON.stringify(siteSettings));
      db().prepare("UPDATE mk_landing_pages SET site_id = ? WHERE id = ?").run(Number(info.lastInsertRowid), pageId);
    }
    if (palette) await context.addInitScript((v) => { try { localStorage.setItem("pb:palette-theme", JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }, palette);
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await ready();
    await wait(500);
  }
  // Géométrie de la surface de travail (px de l'écran) : cadre, zone de travail, zoom affiché
  const geometry = () => page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height, right: b.right, bottom: b.bottom }; };
    const wrap = document.querySelector("[data-pb-frame-wrap]"), stage = document.querySelector("[data-pb-stage]");
    const f = document.querySelector("[data-pb-frame]");
    return { wrap: r(wrap), stage: r(stage), left: r(document.querySelector(".pb-left")), right: r(document.querySelector(".pb-right")), canvas: r(document.querySelector("[data-pb-canvas]")),
      pageW: f.contentDocument.documentElement.clientWidth, scrollW: f.contentDocument.documentElement.scrollWidth, zoom: Number(document.querySelector("[data-pb-zoom-value]").textContent.replace(/\D/g, "")) / 100,
      stageClient: stage.clientWidth };
  });
  // Débordements (px de la page affichée) : éléments hors de leur parent ou de la page, contenu plus large que sa boîte
  const overflows = () => frameDoc((d) => {
    const bad = [];
    const mainEl = d.querySelector(".lp-main"), mr = mainEl.getBoundingClientRect();
    for (const el of d.querySelectorAll(".lp-main *")) {
      if (/^(SCRIPT|STYLE)$/.test(el.tagName) || el.closest(".pb-sel-box,.pb-handle,.pb-sel-badge,.pb-parent-box,.kw-add")) continue;
      let pe = el.parentElement; while (pe && d.defaultView.getComputedStyle(pe).display === "contents") pe = pe.parentElement; // enveloppe transparente (.kw-layout) : le vrai parent est la section
      const b = el.getBoundingClientRect(), p = pe.getBoundingClientRect(), cs = d.defaultView.getComputedStyle(el);
      if (b.width > 0 && (b.right > p.right + 1 || b.left < p.left - 1) && cs.position !== "absolute" && cs.position !== "fixed") bad.push(`${el.className || el.tagName} sort de son parent`);
      if (b.width > 0 && b.right > mr.right + 1 && cs.position !== "absolute" && cs.position !== "fixed") bad.push(`${el.className || el.tagName} sort de la page`);
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && !/auto|scroll/.test(cs.overflowX) && cs.display !== "inline" && el.tagName.toLowerCase() !== "svg") bad.push(`${el.className || el.tagName} : contenu ${el.scrollWidth} > boîte ${el.clientWidth}`);
    }
    if (d.documentElement.scrollWidth > d.documentElement.clientWidth) bad.push(`la page défile horizontalement (${d.documentElement.scrollWidth} > ${d.documentElement.clientWidth})`);
    return bad;
  });
  const setDevice = async (d) => { await page.click(`[data-device="${d}"]`); await wait(450); };
  const clickZoom = async (v) => { await page.click(`[data-pb-zoom="${v}"]`); await wait(450); };   // la transition de zoom dure au plus 200 ms

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const dir = path.join(srv.dir, "uploads", "thumbnails");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "grand.svg"), '<svg xmlns="http://www.w3.org/2000/svg" width="5000" height="3000" viewBox="0 0 5000 3000"><rect width="5000" height="3000" fill="#8fb8d8"/><circle cx="2500" cy="1500" r="900" fill="#0277b6"/></svg>');
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("bureau : la page suit l'espace disponible (fluide), est centrée et ne passe jamais sous les panneaux", async () => {
    await openEditor(STRESS, { viewport: { width: 1920, height: 1080 } });
    const g = await geometry();
    const avail = g.stageClient - 48;
    assert.ok(Math.abs(g.wrap.w - avail) <= 2 && g.zoom === 1, `grand écran : la page occupe l'espace (${Math.round(g.wrap.w)} px pour ${avail} disponibles, zoom ${g.zoom})`);
    assert.ok(g.pageW >= 1024, `largeur de page affichée ≥ 1024 (point de rupture tablette + 1) : ${g.pageW}`);
    assert.ok(g.wrap.x >= g.stage.x && g.wrap.right <= g.stage.right + 1, "la page reste dans la zone de travail");
    assert.ok(g.wrap.x >= g.left.right && g.wrap.right <= g.right.x + 1, "la page ne passe ni sous le panneau de gauche ni sous celui de droite");
    // Écran plus petit : le plancher de 1024 px s'applique, le zoom « ajuster » réduit la page pour qu'elle tienne
    await openEditor(STRESS, { viewport: { width: 1366, height: 768 } });
    const s = await geometry();
    assert.equal(s.pageW, 1024, `plancher : ${s.pageW}`);
    assert.ok(s.zoom < 1 && s.wrap.right <= s.stage.right + 1 && s.wrap.x >= s.stage.x - 1, `la page réduite tient dans la zone (zoom ${s.zoom})`);
  });

  test("tablette et mobile : largeur d'appareil, cadre centré dans la zone de travail", async () => {
    await openEditor(STRESS);
    for (const [d, w] of [["tablet", 820], ["mobile", 390]]) {
      await setDevice(d);
      const g = await geometry();
      assert.equal(g.pageW, w, `${d} : largeur de page`);
      const centre = (g.wrap.x + g.wrap.right) / 2, zoneCentre = (g.stage.x + g.stage.right) / 2;
      assert.ok(Math.abs(centre - zoneCentre) <= 3, `${d} : cadre centré (écart ${Math.round(centre - zoneCentre)} px)`);
    }
  });

  test("panneaux : réduire la palette ou masquer les calques rend l'espace au canevas, sans passer sous un panneau", async () => {
    await openEditor(STRESS, { viewport: { width: 1600, height: 900 } });
    const base = await geometry();
    await page.click('button[aria-label="Panneau des éléments"]'); await wait(500);
    const sansPalette = await geometry();
    assert.ok(sansPalette.stage.w >= base.stage.w + 200, `palette réduite : zone de travail ${Math.round(base.stage.w)} → ${Math.round(sansPalette.stage.w)}`);
    assert.ok(sansPalette.wrap.w > base.wrap.w || sansPalette.zoom > base.zoom, "la page profite de la place gagnée");
    await page.click('button[aria-label="Panneau des éléments"]'); await wait(500);
    const retour = await geometry();
    assert.ok(Math.abs(retour.stage.w - base.stage.w) <= 2, "palette rouverte : zone de travail rétablie");
    await page.click('button[aria-label="Calques"]'); await wait(500);
    const sansDroite = await geometry();
    assert.ok(sansDroite.stage.w >= base.stage.w + 250, `panneau de droite masqué : ${Math.round(base.stage.w)} → ${Math.round(sansDroite.stage.w)}`);
    assert.ok(sansDroite.wrap.right <= sansDroite.canvas.right + 1, "la page reste dans le canevas");
    await page.click('button[aria-label="Calques"]'); await wait(500);
    assert.ok(Math.abs((await geometry()).stage.w - base.stage.w) <= 2, "panneau rouvert : zone de travail rétablie");
  });

  test("zoom : la page et le cadre de sélection restent alignés et dans la zone de travail à chaque niveau", async () => {
    await openEditor(STRESS);
    await page.frameLocator("[data-pb-frame]").locator("[data-node-id='head00000003']").click();
    await wait(300);
    const niveaux = [];
    await clickZoom("100"); niveaux.push(await geometry());
    for (let i = 0; i < 3; i += 1) await clickZoom("-");   // niveaux usuels : 100 → 75 → 66 → 50 %
    niveaux.push(await geometry());
    await clickZoom("100"); await clickZoom("+"); await clickZoom("+");
    niveaux.push(await geometry());
    assert.deepEqual(niveaux.map((g) => g.zoom), [1, 0.5, 1.5]);   // puis 100 → 125 → 150 %
    for (const g of niveaux) {
      // Largeur à l'écran = largeur de la page × zoom (à l'arrondi près) ; le cadre ne déborde pas de la zone vers la gauche
      assert.ok(Math.abs(g.wrap.w - g.pageW * g.zoom) <= 2, `zoom ${g.zoom} : ${Math.round(g.wrap.w)} px à l'écran pour ${g.pageW} px × ${g.zoom}`);
      assert.ok(g.wrap.x >= g.stage.x - 1, `zoom ${g.zoom} : la page ne dépasse pas à gauche`);
    }
    // Cadre de sélection = dimensions réelles de l'élément (dans la page, donc mis à l'échelle avec elle)
    await clickZoom("fit");
    const m = await frameDoc((d) => { const el = d.querySelector("[data-node-id='head00000003']").getBoundingClientRect(), box = d.querySelector(".pb-sel-box").getBoundingClientRect(); return { dx: box.left - el.left, dy: box.top - el.top, dw: box.width - el.width, dh: box.height - el.height }; });
    for (const [k, v] of Object.entries(m)) assert.ok(Math.abs(v) <= 1.5, `cadre de sélection : écart ${k} = ${v}`);
  });

  test("aucun débordement : image géante, texte et lien interminables, bouton, vidéo, tableau, code, colonnes, grille (3 écrans)", async () => {
    await openEditor(STRESS);
    for (const d of ["desktop", "tablet", "mobile"]) {
      await setDevice(d);
      assert.deepEqual(await overflows(), [], `écran ${d}`);
    }
    // Les médias et le bouton restent dans leur parent
    await setDevice("desktop");
    const rects = await frameDoc((d) => ["imag00000001", "vide00000001", "butn00000001", "tabl00000001"].map((id) => { const el = d.querySelector(`[data-node-id='${id}']`), b = el.getBoundingClientRect(); let pe = el.parentElement; while (pe && d.defaultView.getComputedStyle(pe).display === "contents") pe = pe.parentElement; const p = pe.getBoundingClientRect(); return { id, dentro: b.right <= p.right + 1 && b.left >= p.left - 1 }; }));
    for (const r of rects) assert.ok(r.dentro, `${r.id} reste dans son parent`);
  });

  test("largeurs de contenu : par défaut historique ; réglages du site « pleine largeur » et « personnalisée » appliqués au canevas", async () => {
    await openEditor(STRESS, { viewport: { width: 1920, height: 1080 } });
    const std = await frameDoc((d) => ({ main: Math.round(d.querySelector(".lp-main").getBoundingClientRect().width) }));
    assert.equal(std.main, 760, "sans réglage de site : contenu de 760 px (comportement historique conservé)");
    await openEditor(STRESS, { siteSettings: { layout: { fullWidth: true } } });
    const large = await frameDoc((d) => { const w = (id) => Math.round(d.querySelector(`[data-node-id='${id}']`).getBoundingClientRect().width); const mainW = Math.round(d.querySelector(".lp-main").getBoundingClientRect().width), boxed = d.querySelector("[data-node-id='cont00000002']").getBoundingClientRect(), p = d.querySelector(".lp-main").getBoundingClientRect(); return { main: mainW, full: w("cont00000001"), boxed: w("cont00000002"), gauche: boxed.left - p.left, droite: p.right - boxed.right, page: d.documentElement.clientWidth }; });
    assert.equal(large.main, large.page, "page large : le contenu occupe toute la page");
    assert.ok(large.full >= large.main - 40, `section pleine largeur : ${large.full} px pour ${large.main}`);
    assert.equal(large.boxed, 1100, "conteneur encadré : 1100 px");
    assert.ok(Math.abs(large.gauche - large.droite) <= 1, `conteneur centré (marges ${Math.round(large.gauche)} / ${Math.round(large.droite)})`);
    await openEditor(STRESS, { siteSettings: { layout: { contentWidth: 1200, containerWidth: 1000 } } });
    const perso = await frameDoc((d) => ({ main: Math.round(d.querySelector(".lp-main").getBoundingClientRect().width), boxed: Math.round(d.querySelector("[data-node-id='cont00000002']").getBoundingClientRect().width) }));
    assert.deepEqual(perso, { main: 1200, boxed: 1000 }, "largeur personnalisée du contenu et des conteneurs");
    assert.deepEqual(await overflows(), [], "aucun débordement en page large");
  });

  test("conteneur : largeur Encadrée / Pleine / Personnalisée changent réellement le rendu, en une seule annulation", async () => {
    await openEditor(STRESS, { siteSettings: { layout: { fullWidth: true } } });
    await page.locator("li.pb-node[data-id='cont00000002'] > .pb-row-item").click(); // sélection par la Structure
    await wait(300);
    const widthOf = () => frameDoc((d) => Math.round(d.querySelector("[data-node-id='cont00000002']").getBoundingClientRect().width));
    // Le rendu du canevas est asynchrone : on attend la valeur attendue plutôt qu'un délai fixe
    const expectWidth = async (ok, what) => { let v = null; await until(async () => { v = await widthOf(); return ok(v); }, { what, timeout: 8000 }).catch((e) => { throw new Error(`${e.message} — dernière largeur : ${v}`); }); return v; };
    const select = page.locator("[data-pb-inspector] select", { has: page.locator("option[value='custom']") }).first();
    await expectWidth((v) => v === 1100, "encadré par défaut : 1100 px");
    await select.selectOption("full");
    await expectWidth((v) => v > 1100, "pleine largeur : plus large que 1100");
    await select.selectOption("custom");
    await expectWidth((v) => v === 960, "personnalisée : 960 px proposés");
    const champ = page.locator("[data-pb-inspector] input[placeholder='960px']").first();
    await champ.fill("700px"); await champ.dispatchEvent("change");
    await expectWidth((v) => v === 700, "personnalisée : 700 px saisis");
    await select.selectOption("boxed");
    await expectWidth((v) => v === 1100, "retour à encadrée : 1100 px");
    // Une seule annulation défait le dernier choix (retour à la personnalisée 700 px)
    await page.keyboard.press("Control+z");
    await expectWidth((v) => v === 700, "annuler : retour à 700 px en une seule étape");
  });

  test("apparence : claire par défaut, sombre et système réellement appliqués à la palette ET au panneau de droite, sans toucher la page", async () => {
    await openEditor(STRESS);
    const look = () => page.evaluate(() => {
      const bg = (el) => getComputedStyle(el).backgroundColor, rgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
      const card = document.querySelector(".pb-left .pb-pal-item"), left = document.querySelector(".pb-left"), tools = document.querySelector(".pb-tools");
      const lum = (c) => { const [r, g, b] = c.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const label = card.querySelector("span:not(.pb-pal-kind)");
      const fr = document.querySelector("[data-pb-frame]").contentDocument.body;
      return { mode: document.querySelector("[data-pb-main]").dataset.palette, left: rgb(bg(left)), tools: rgb(bg(tools)), card: rgb(bg(card)), contrasteCarte: contrast(rgb(getComputedStyle(label).color), rgb(bg(card))),
        droite: rgb(bg(document.querySelector(".pb-right"))), pageFond: getComputedStyle(fr).backgroundColor, checked: [...document.querySelectorAll("[data-pal-mode]")].filter((b) => b.getAttribute("aria-checked") === "true").map((b) => b.dataset.palMode) };
    });
    const clair = await look();
    assert.equal(clair.mode, "light"); assert.deepEqual(clair.checked, ["light"]);
    assert.ok(clair.left.every((v) => v > 240), "palette claire : fond clair");
    await page.click('[data-pal-mode="dark"]'); await wait(250);
    const sombre = await look();
    assert.equal(sombre.mode, "dark"); assert.deepEqual(sombre.checked, ["dark"]);
    assert.ok(sombre.left.every((v) => v < 40) && sombre.tools.every((v) => v < 40) && sombre.card.every((v) => v < 50), `palette sombre : fonds sombres (${sombre.left} / ${sombre.tools} / ${sombre.card})`);
    assert.ok(sombre.contrasteCarte >= 7, `texte des cartes lisible en sombre (contraste ${sombre.contrasteCarte.toFixed(1)})`);
    assert.ok(sombre.droite.every((v) => v < 40) && clair.droite.every((v) => v > 240), `le panneau de droite suit l'apparence (${clair.droite} → ${sombre.droite})`);
    assert.equal(sombre.pageFond, clair.pageFond, "la page ne change pas");
    assert.ok(clair.contrasteCarte >= 7, `texte des cartes lisible en clair (contraste ${clair.contrasteCarte.toFixed(1)})`);
    // Système : suit la préférence du navigateur, en direct
    await page.emulateMedia({ colorScheme: "dark" });
    await page.click('[data-pal-mode="system"]'); await wait(250);
    assert.equal((await look()).mode, "dark", "système + navigateur sombre → sombre");
    await page.emulateMedia({ colorScheme: "light" }); await wait(250);
    assert.equal((await look()).mode, "light", "le changement du navigateur est suivi sans recharger");
    // Clavier : flèche droite dans le groupe passe au mode suivant
    await page.focus('[data-pal-mode="light"]'); await page.click('[data-pal-mode="light"]');
    await page.keyboard.press("ArrowRight"); await wait(200);
    assert.equal((await look()).mode, "dark", "flèche droite : sombre");
  });

  test("palette : la préférence survit au rechargement de l'éditeur", async () => {
    await openEditor(STRESS);
    await page.click('[data-pal-mode="dark"]'); await wait(200);
    await page.reload(); await ready(); await wait(400);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-main]").dataset.palette), "dark");
    assert.equal(await page.evaluate(() => document.querySelector('[data-pal-mode="dark"]').getAttribute("aria-checked")), "true");
    await page.click('[data-pal-mode="light"]'); await wait(200);
    await page.reload(); await ready(); await wait(400);
    assert.equal(await page.evaluate(() => document.querySelector("[data-pb-main]").dataset.palette), "light");
  });

  test("palette : cartes de structure identique (même taille, rien ne déborde), recherche intégrée, catégories repliables", async () => {
    await openEditor(STRESS, { viewport: { width: 1600, height: 900 } });
    const cartes = await page.evaluate(() => [...document.querySelectorAll(".pb-left .pb-pal-item")].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(), i = b.querySelector("svg"), t = b.querySelector("span:not(.pb-pal-kind):not(.pb-pal-lock)"), ir = i && i.getBoundingClientRect(), c = r.left + r.width / 2; return { w: Math.round(r.width), h: Math.round(r.height), iconeCentree: ir ? Math.abs((ir.left + ir.width / 2) - c) <= 1.5 : true, texteDedans: !t || t.scrollWidth <= t.clientWidth + 1, label: (t && t.textContent) || "" }; }));
    assert.ok(cartes.length >= 20, `cartes visibles : ${cartes.length}`);
    assert.equal(new Set(cartes.map((c) => c.h)).size, 1, `toutes les cartes ont la même hauteur (${[...new Set(cartes.map((c) => c.h))]})`);
    assert.ok(Math.max(...cartes.map((c) => c.w)) - Math.min(...cartes.map((c) => c.w)) <= 1, "toutes les cartes ont la même largeur");
    assert.ok(cartes.every((c) => c.iconeCentree), "icônes centrées");
    assert.ok(cartes.every((c) => c.texteDedans), `texte contenu : ${cartes.filter((c) => !c.texteDedans).map((c) => c.label)}`);
    const champ = await page.evaluate(() => { const i = document.querySelector("[data-pb-el-search]"); const b = i.getBoundingClientRect(), cs = getComputedStyle(i); return { h: Math.round(b.height), icone: cs.backgroundImage !== "none", radius: cs.borderTopLeftRadius }; });
    assert.equal(champ.h, 32); assert.ok(champ.icone, "icône de recherche");
    const avant = await page.evaluate(() => document.querySelectorAll(".pb-left .pb-pal-item").length);
    await page.click(".pb-pal-toggle"); await wait(150);
    assert.equal(await page.evaluate(() => document.querySelector(".pb-pal-toggle").getAttribute("aria-expanded")), "false");
    assert.ok(await page.evaluate(() => [...document.querySelectorAll(".pb-left .pb-pal-item")].filter((b) => b.offsetParent).length) < avant, "catégorie repliée : moins de cartes visibles");
    await page.click(".pb-pal-toggle"); await wait(150);
  });

  test("régression : sélection (canevas ↔ Structure), duplication, suppression, annuler / rétablir et enregistrement fonctionnent", async () => {
    await openEditor({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
      { id: "head00000001", type: "heading", props: { text: "Titre un", level: "2" } }, { id: "head00000002", type: "heading", props: { text: "Titre deux", level: "2" } }] }] }] });
    const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
    const count = () => { let c = 0; const walk = (l) => { for (const x of l || []) { if (x.type === "heading") c += 1; walk(x.children); } }; walk(draft().sections); return c; };
    const frame = page.frameLocator("[data-pb-frame]");
    await frame.locator("[data-node-id='head00000002']").click(); await wait(300);
    assert.ok(await page.evaluate(() => /Titre/.test(document.querySelector(".pb-node.is-selected .pb-node-name, .pb-node[aria-selected='true'] .pb-node-name, li.pb-node.is-selected")?.textContent || "")), "canevas → Structure : le titre est sélectionné dans les calques");
    await page.keyboard.press("Control+d"); await wait(500);
    await until(() => count() === 3, { what: "duplication enregistrée" });
    await page.keyboard.press("Delete"); await wait(500);
    await until(() => count() === 2, { what: "suppression enregistrée" });
    await page.keyboard.press("Control+z"); await wait(500);
    await until(() => count() === 3, { what: "annuler" });
    await page.keyboard.press("Control+Shift+z"); await wait(500);
    await until(() => count() === 2, { what: "rétablir" });
    await page.click("[data-pb-save-now]"); await wait(600);
    assert.equal(count(), 2, "enregistré");
  });

  test("aucune erreur de script ni de console pendant tous ces parcours", () => {
    assert.deepEqual(errors, []);
  });
});
