// Éditeur de pages — RÈGLES, GUIDES, GRILLE ET MAGNÉTISME dans un VRAI navigateur (Chrome piloté par Playwright) contre un
// vrai serveur. Chaque scénario agit comme une personne (glisser depuis une règle, tirer une poignée, saisir une position,
// changer de zoom ou d'écran), puis relit les positions RÉELLES calculées par le navigateur, le brouillon enregistré en base et
// la page publiée : les outils de conception ne doivent jamais entrer dans le contenu ni dans le site.
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

// Page de test : trois cases côte à côte (Flexbox, écart 24 px, largeurs fixes) puis une grille de deux colonnes.
// Hauteur supérieure au plancher d'un conteneur vide (zone d'édition) : sinon la hauteur écrite ne se voit pas
const H = 260;
const box = (id, w, h) => ({ id, type: "container", styles: { desktop: { width: `${w}px`, height: `${h}px` } }, children: [] });
const CONTENT = () => ({
  sections: [{ id: "sect00000001", type: "layout", children: [
    { id: "flex00000001", type: "container", styles: { desktop: { display: "flex", flexDirection: "row", gap: "24px" } }, children: [box("boxa00000001", 200, H), box("boxb00000001", 200, H), box("boxc00000001", 200, H)] },
    { id: "grid00000001", type: "grid", props: {}, styles: { desktop: { columns: 2, gap: "16px" } }, children: [box("cell00000001", 300, 100), box("cell00000002", 300, 100)] },
  ] }],
});

describe("règles, guides, grille et magnétisme (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, pageId, n = 0;
  const db = () => srv.db();
  const frame = () => page.frameLocator("[data-pb-frame]");
  const draft = () => { const row = db().prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(pageId); return row.draft ? JSON.parse(row.draft) : { sections: JSON.parse(row.sections) }; };
  const nodesOf = (list, out = []) => { for (const x of list || []) { out.push(x); nodesOf(x.children, out); } return out; };
  const saved = (check, what) => until(() => { const d = draft(); return check(d) ? d : null; }, { what: `enregistré : ${what}`, timeout: 12000 });
  const ready = () => page.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder") && f.contentDocument.querySelector("[data-node-id]"); });
  async function openEditor({ device = "desktop", zoom = 0.66, prefs = null } = {}) {
    n += 1;
    pageId = Number((await boss.post("/marketing/pages", { name: `Règles ${n}` })).location.match(/(\d+)$/)[1]);
    const revision = db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision, content: CONTENT() }, headers: { Origin: srv.base } });
    assert.equal(put.status, 200, put.text.slice(0, 200));
    await page.goto(`${srv.base}/marketing/pages/${pageId}/editeur`);
    await page.evaluate((p) => { try { localStorage.clear(); if (p) localStorage.setItem("pb:snapcfg", JSON.stringify(p)); } catch { /* rien */ } }, prefs);
    await page.reload();
    await ready();
    await wait(250);
    if (device !== "desktop") { await page.locator(`.pb-top .pb-devices [data-device="${device}"]`).click(); await wait(300); }
    await setZoom(zoom);
  }
  // Zoom exact (1 = 100 %) par le même chemin que les boutons
  async function setZoom(z) {
    await page.locator("[data-pb-zoom-value]").click();
    const label = z === "fit" ? "Ajuster à la fenêtre" : `${Math.round(z * 100)} %`;
    await page.locator("[data-pb-menu] .pb-menu-item", { hasText: new RegExp(`^(✓ )?${label}`) }).first().click();
    await wait(200);
  }
  const zoomNow = () => page.evaluate(() => parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100);
  // Mesures réelles d'un élément du canevas, en pixels de la page (indépendantes du zoom et du défilement)
  // (le canevas est redessiné par le serveur après chaque modification : on attend que l'élément soit de nouveau là)
  const rectOf = (id) => until(() => page.evaluate((i) => {
    const d = document.querySelector("[data-pb-frame]").contentDocument, w = d && d.defaultView, el = d && d.querySelector(`[data-node-id="${i}"]`);
    if (!el || !d.body.classList.contains("lp-builder")) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left + w.scrollX, top: r.top + w.scrollY, width: r.width, height: r.height, right: r.right + w.scrollX, bottom: r.bottom + w.scrollY };
  }, id), { what: `élément ${id} présent`, timeout: 8000 });
  // Point de l'écran (page parente) correspondant à un point de la page affichée
  const screenOf = (x, y) => page.evaluate(([px, py]) => {
    const f = document.querySelector("[data-pb-frame]"), r = f.getBoundingClientRect(), w = f.contentWindow;
    const z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100;
    return { x: r.left + (px - w.scrollX) * z, y: r.top + (py - w.scrollY) * z };
  }, [x, y]);
  const guidesInCanvas = () => page.evaluate(() => {
    const d = document.querySelector("[data-pb-frame]").contentDocument;
    return [...d.querySelectorAll(".pb-guide:not(.is-temp)")].map((g) => (g.classList.contains("pb-guide-v") ? { axis: "v", pos: parseFloat(g.style.left) } : { axis: "h", pos: parseFloat(g.style.top) }));
  });
  const panelOpen = async () => { if (!(await page.locator("[data-pb-rules]").evaluate((d) => d.open))) { await page.locator("[data-pb-rules-menu]").click(); await page.locator(".pb-rules-pop .pb-menu-item").click(); } await page.locator("[data-pb-rules]").waitFor({ state: "visible" }); };
  const panelClose = async () => { if (await page.locator("[data-pb-rules]").evaluate((d) => d.open)) await page.locator("[data-pb-rules] [data-pb-close]").click(); };
  const panelCheck = (label) => page.locator("[data-pb-rules] label", { hasText: label }).first().locator("input");
  const setPanelCheck = async (label, on) => { const c = panelCheck(label); if ((await c.isChecked()) !== on) await c.click(); };
  const overlay = () => page.evaluate(() => {
    const d = document.querySelector("[data-pb-frame]").contentDocument, o = d.querySelector(".pb-grid-overlay");
    if (!o) return null;
    return { bg: o.style.backgroundSize, cols: [...o.querySelectorAll(".pb-grid-col")].map((c) => ({ left: parseFloat(c.style.left), width: parseFloat(c.style.width) })),
      margins: [...o.querySelectorAll(".pb-margin-line")].map((c) => parseFloat(c.style.left)), container: [...o.querySelectorAll(".pb-container-line")].map((c) => parseFloat(c.style.left)), w: parseFloat(o.style.width) };
  });
  const savedPrefs = () => page.evaluate(() => JSON.parse(localStorage.getItem("pb:snapcfg") || "null"));
  const aid = (k) => page.evaluate((key) => (JSON.parse(localStorage.getItem("pb:aids") || "{}"))[key], k);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) errors.push(`console : ${m.text()}`); });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });


  // ---- gestes ----
  // Sélectionne un élément puis tire sa poignée (dir : e = largeur, s = hauteur, se = les deux) de dx, dy pixels DE LA PAGE.
  // hold : garde le bouton enfoncé (pour lire les repères affichés pendant le geste) ; renvoie alors une fonction « relâcher ».
  async function dragHandle(id, dir, dx, dy, { alt = false, shift = false, hold = false } = {}) {
    await frame().locator(`[data-node-id="${id}"]`).click({ position: { x: 6, y: 6 } }); // près du coin : le centre d'un conteneur vide est son « + »
    const handle = frame().locator(`.pb-handle-${dir}`);
    await handle.waitFor({ state: "visible" });
    await wait(350); // les poignées sont redessinées juste après la sélection : on attend qu'elles soient stables
    const b = await handle.boundingBox(), z = await zoomNow();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    if (alt) await page.keyboard.down("Alt");
    if (shift) await page.keyboard.down("Shift");
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + (dx * z) / 2, y + (dy * z) / 2, { steps: 2 });
    await page.mouse.move(x + dx * z, y + dy * z, { steps: 3 });
    await wait(120);
    const release = async () => { await page.mouse.up(); if (alt) await page.keyboard.up("Alt"); if (shift) await page.keyboard.up("Shift"); await wait(700); };
    if (hold) return release;
    await release();
    return null;
  }
  // Glisse depuis une règle pour créer un guide à (x, y) de la page. axis : "v" règle de gauche → guide vertical ; "h" règle du haut.
  async function dragGuide(axis, pos, { alt = true } = {}) {
    const ruler = page.locator(axis === "v" ? "[data-pb-ruler-y]" : "[data-pb-ruler-x]");
    const rb = await ruler.boundingBox();
    const target = await screenOf(axis === "v" ? pos : 400, axis === "h" ? pos : 300);
    if (alt) await page.keyboard.down("Alt");
    await page.mouse.move(rb.x + (axis === "v" ? rb.width / 2 : 300), rb.y + (axis === "h" ? rb.height / 2 : 200));
    await page.mouse.down();
    await page.mouse.move(target.x, target.y, { steps: 6 });
    await page.mouse.up();
    if (alt) await page.keyboard.up("Alt");
    await wait(200);
  }
  const tags = () => page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll(".pb-smart-tag")].map((e) => ({ text: e.textContent, cls: e.className })));
  const smartLines = () => page.evaluate(() => [...document.querySelector("[data-pb-frame]").contentDocument.querySelectorAll(".pb-smart")].map((e) => e.className));
  const widthOf = async (id) => Math.round((await rectOf(id)).width);
  const NO_GRID = { snap: { grid: false } }; // isole le guide / l'élément visé : la grille libre accrocherait aussi

  test("T1 l'éditeur démarre sans erreur avec le nouveau moteur et le panneau", async () => {
    await openEditor();
    assert.equal(await page.evaluate(() => typeof window.KWSnap + typeof window.pbRules), "objectobject");
    assert.deepEqual(errors, []);
  });

  test("T2 règles : activer / désactiver (bouton et touche R) retire réellement les règles", async () => {
    await openEditor();
    const rx = page.locator("[data-pb-ruler-x]");
    assert.equal(await rx.isHidden(), true, "masquées au départ");
    await page.locator('[data-pb-toggle="rulers"]').click();
    assert.equal(await rx.isVisible(), true);
    assert.equal(await page.locator("[data-pb-ruler-y]").isVisible(), true);
    assert.equal(await page.locator("[data-pb-ruler-corner]").textContent(), "px");
    await frame().locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("r");
    assert.equal(await rx.isHidden(), true, "la touche R les retire");
    await page.keyboard.press("r");
    assert.equal(await rx.isVisible(), true);
    assert.equal(await aid("rulers"), true, "préférence mémorisée");
  });

  test("T3 règles : zoom 50 → 200 %, graduations lisibles, repères alignés sur les guides (aucun décalage)", async () => {
    await openEditor();
    await page.locator('[data-pb-toggle="rulers"]').click();
    await page.locator("[data-pb-ruler-corner]").click(); // menu des unités ouvert puis fermé : le coin reste utilisable
    await page.keyboard.press("Escape");
    await panelOpen();
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill("240");
    await page.locator("[data-pb-rules] .pb-rules-add button").click();
    await panelClose();
    assert.deepEqual((await guidesInCanvas()).map((g) => g.pos), [240]);
    for (const z of [0.5, 0.66, 0.75, 1, 1.25, 1.5, 2]) {
      await setZoom(z);
      assert.ok(Math.abs((await zoomNow()) - z) < 0.006, `zoom ${z} appliqué`);
      const m = await page.evaluate(() => {
        const f = document.querySelector("[data-pb-frame]"), fr = f.getBoundingClientRect(), d = f.contentDocument, w = f.contentWindow;
        const z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100;
        const g = d.querySelector(".pb-guide-v"), gr = g.getBoundingClientRect();
        const lineX = fr.left + (gr.left + 4 - w.scrollX) * z + w.scrollX * z; // ligne du guide (centre de sa zone de saisie)
        const cv = document.querySelector("[data-pb-ruler-x]"), cr = cv.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1, ctx = cv.getContext("2d");
        // Repère cyan du guide sur la règle : cherche le pixel cyan de la ligne du haut le plus proche de la ligne du guide
        let best = null;
        for (let px = 0; px < cr.width; px++) { const p = ctx.getImageData(Math.round(px * dpr), 1, 1, 1).data; if (p[0] < 40 && p[1] > 130 && p[2] > 150 && p[3] > 200) { const dd = Math.abs(cr.left + px + 0.5 - lineX); if (best === null || dd < best) best = dd; } }
        return { lineX, rulerLeft: cr.left, mark: best };
      });
      assert.ok(m.mark !== null && m.mark <= 1.5, `zoom ${z} : repère du guide sur la règle à ${m.mark} px du guide`);
      // graduations : au moins 2 et pas trop serrées — on relit les nombres écrits : pas de chevauchement = pas ≥ 56 px d'écran
      const step = await page.evaluate((zz) => window.KWSnap.niceStep(zz), z);
      assert.ok(step * z >= 56 - 0.001, `zoom ${z} : pas ${step}`);
    }
    await setZoom(1);
  });

  test("T4 guides : créer en tirant depuis chaque règle, déplacer, supprimer (Suppr, glisser dehors, clic droit)", async () => {
    await openEditor({ zoom: 0.75 });
    await page.locator('[data-pb-toggle="rulers"]').click();
    await dragGuide("v", 420);
    await dragGuide("h", 260);
    let g = await guidesInCanvas();
    assert.deepEqual(g.map((x) => `${x.axis}${x.pos}`).sort(), ["h260", "v420"].sort().map((v) => v), "positions exactes (Alt : sans accrochage)");
    // déplacer le guide vertical
    const from = await screenOf(420, 500), to = await screenOf(520, 500);
    await page.keyboard.down("Alt");
    await page.mouse.move(from.x, from.y); await page.mouse.down(); await page.mouse.move(to.x, to.y, { steps: 5 }); await page.mouse.up();
    await page.keyboard.up("Alt");
    await wait(200);
    g = await guidesInCanvas();
    assert.ok(g.some((x) => x.axis === "v" && x.pos === 520), `guide déplacé à 520 (${JSON.stringify(g)})`);
    // Suppr sur le guide sélectionné
    await page.keyboard.press("Delete");
    await wait(150);
    assert.equal((await guidesInCanvas()).filter((x) => x.axis === "v").length, 0, "supprimé avec Suppr");
    // clic droit → Supprimer ce guide
    const hpos = await screenOf(700, 260);
    await page.mouse.click(hpos.x, hpos.y, { button: "right" });
    await page.locator("[data-pb-menu] .pb-menu-item", { hasText: "Supprimer ce guide" }).click();
    await wait(150);
    assert.equal((await guidesInCanvas()).filter((x) => x.axis === "h").length, 0, "supprimé par le menu");
    // glisser hors de la page (vers la règle)
    await dragGuide("v", 300);
    const gp = await screenOf(300, 400), rb = await page.locator("[data-pb-ruler-y]").boundingBox();
    await page.mouse.move(gp.x, gp.y); await page.mouse.down(); await page.mouse.move(rb.x + 5, gp.y, { steps: 6 }); await page.mouse.up();
    await wait(200);
    assert.equal((await guidesInCanvas()).length, 0, "glissé vers la règle : supprimé");
  });

  test("T5 guides : position précise (saisie), plusieurs guides indépendants, unité %, jamais enregistrés dans le contenu", async () => {
    await openEditor();
    await panelOpen();
    const add = async (axis, text) => { await page.locator("[data-pb-rules] .pb-rules-add select").selectOption(axis); await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill(text); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(100); };
    for (const x of ["120", "320", "600", "1080"]) await add("v", x);
    for (const y of ["80", "400", "800"]) await add("h", y);
    let g = await guidesInCanvas();
    assert.deepEqual(g.filter((x) => x.axis === "v").map((x) => x.pos), [120, 320, 600, 1080]);
    assert.deepEqual(g.filter((x) => x.axis === "h").map((x) => x.pos), [80, 400, 800]);
    // modifier la position d'un guide dans la liste
    const row = page.locator('[data-pb-rules] input[data-guide-axis="v"][data-guide-index="1"]');
    await row.fill("350"); await row.press("Enter"); await wait(150);
    g = await guidesInCanvas();
    assert.ok(g.some((x) => x.axis === "v" && x.pos === 350) && !g.some((x) => x.axis === "v" && x.pos === 320), "320 → 350");
    // position illisible : refusée, rien ne change
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill("beaucoup"); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(100);
    assert.equal((await guidesInCanvas()).length, 7);
    // unité % : 50 % de la page = milieu
    await page.locator('[data-pb-toggle="rulers"]').click();
    await page.locator("[data-pb-rules] select").first().selectOption("%");
    await page.locator("[data-pb-rules] .pb-rules-add select").selectOption("v");
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill("50"); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(100);
    const half = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.documentElement.clientWidth / 2);
    g = await guidesInCanvas();
    assert.ok(g.some((x) => x.axis === "v" && Math.abs(x.pos - half) <= 1), `50 % = ${half} px`);
    assert.equal(await page.locator("[data-pb-ruler-corner]").evaluate((e) => e.textContent), "%", "le coin affiche l'unité");
    // pas dans le contenu enregistré
    await page.locator("[data-pb-save-now]").click(); await wait(500);
    assert.ok(!/guide|pb-grid|snapcfg/i.test(JSON.stringify(draft())), "aucun guide dans le brouillon");
  });

  test("T6 grille : pas de 8 puis 12 px, grille web 12 colonnes, gouttière, marges, conteneur, zone de sécurité", async () => {
    await openEditor();
    await panelOpen();
    await setPanelCheck("Grille (Maj + G)", true);
    let o = await overlay();
    assert.ok(o && /^8px 8px$/.test(o.bg), `pas de 8 px (${o && o.bg})`);
    await page.locator("[data-pb-rules] select", { has: page.locator('option[value="12"]') }).first().selectOption("12");
    await wait(150);
    o = await overlay();
    assert.ok(/^12px 12px$/.test(o.bg), `pas de 12 px (${o.bg})`);
    // grille web
    await page.locator("[data-pb-rules] select", { has: page.locator('option[value="web"]') }).selectOption("web");
    await wait(150);
    o = await overlay();
    assert.equal(o.cols.length, 12, "12 colonnes");
    const expected = await page.evaluate((w) => window.KWSnap.webGrid({ columns: 12, gutter: 24, marginL: 32, marginR: 32, maxWidth: 1200 }, w), o.w);
    for (let i = 0; i < 12; i++) { assert.ok(Math.abs(o.cols[i].left - expected.columns[i].left) < 0.5 && Math.abs(o.cols[i].width - (expected.columns[i].right - expected.columns[i].left)) < 0.5, `colonne ${i + 1}`); }
    // gouttière 40 px
    const gutter = page.locator("[data-pb-rules] .pb-field", { hasText: "Gouttière" }).locator("input");
    await gutter.fill("40"); await gutter.press("Enter"); await gutter.blur(); await wait(200);
    o = await overlay();
    assert.ok(Math.abs(o.cols[1].left - (o.cols[0].left + o.cols[0].width) - 40) < 0.5, "gouttière de 40 px");
    // colonnes 6
    await page.getByLabel("Colonnes", { exact: true }).selectOption("6");
    await wait(150);
    assert.equal((await overlay()).cols.length, 6);
    // marges + conteneur
    await setPanelCheck("Marges de la grille web", true);
    await setPanelCheck("Limites du conteneur", true);
    o = await overlay();
    assert.equal(o.margins.length, 2); assert.equal(o.container.length, 2);
    assert.ok(Math.abs(o.container[0] - (o.w - 1200) / 2) < 0.5 && Math.abs(o.container[1] - (o.w + 1200) / 2) < 0.5, `conteneur 1200 centré (${o.container})`);
    assert.ok(Math.abs(o.margins[0] - (o.container[0] + 32)) < 0.5, "marge gauche de 32 px à l'intérieur du conteneur");
    // zone de sécurité
    await setPanelCheck("Zone de sécurité", true);
    assert.equal(await frame().locator(".pb-safe-area").count(), 1);
    // masquer = disparaît du canevas
    await setPanelCheck("Zone de sécurité", false); await setPanelCheck("Marges de la grille web", false); await setPanelCheck("Limites du conteneur", false);
    await setPanelCheck("Grille (Maj + G)", false);
    assert.equal(await overlay(), null, "grille retirée");
    assert.equal(await frame().locator(".pb-safe-area").count(), 0);
  });

  test("T7 grille web par écran : tablette 8 colonnes, mobile 4 colonnes ; guides indépendants par écran", async () => {
    await openEditor({ prefs: { mode: "web" } });
    await panelOpen();
    await setPanelCheck("Grille (Maj + G)", true);
    assert.equal((await overlay()).cols.length, 12, "ordinateur");
    await page.locator('.pb-top .pb-devices [data-device="tablet"]').click(); await wait(400);
    assert.equal((await overlay()).cols.length, 8, "tablette");
    assert.match(await page.locator("[data-pb-rules] .pb-rules-screen").textContent(), /Tablette · 820 px/);
    await page.locator('.pb-top .pb-devices [data-device="mobile"]').click(); await wait(400);
    assert.equal((await overlay()).cols.length, 4, "mobile");
    const o = await overlay();
    assert.ok(Math.abs(o.cols[0].left - 16) < 0.5, "marge de 16 px sur mobile");
    // guides : indépendants
    await page.locator('.pb-top .pb-devices [data-device="desktop"]').click(); await wait(300);
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill("500"); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(100);
    assert.equal((await guidesInCanvas()).length, 1);
    await page.locator('.pb-top .pb-devices [data-device="tablet"]').click(); await wait(400);
    assert.equal((await guidesInCanvas()).length, 0, "pas de guide de l'ordinateur sur la tablette");
    await setPanelCheck("Guides indépendants par écran", false); await wait(200);
    assert.equal((await guidesInCanvas()).length, 0, "désactivé : liste commune (vide au départ)");
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill("333"); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(100);
    await page.locator('.pb-top .pb-devices [data-device="mobile"]').click(); await wait(400);
    assert.deepEqual((await guidesInCanvas()).map((g) => g.pos), [333], "guides communs à tous les écrans");
  });

  test("T8 magnétisme aux guides : la poignée s'accroche (596 → 600), Alt et l'interrupteur le suppriment réellement", async () => {
    await openEditor({ prefs: NO_GRID });
    const a = await rectOf("boxa00000001");
    const guide = Math.round(a.left + 231);
    await panelOpen();
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill(String(guide));
    await page.locator("[data-pb-rules] .pb-rules-add button").click();
    await panelClose();
    // largeur brute 200 + 27 = 227 → le bord droit est à ~4 px du guide : il s'y cale (le bord, pas seulement la largeur)
    await dragHandle("boxa00000001", "e", 27, 0);
    const snapped = await rectOf("boxa00000001");
    assert.ok(Math.abs(snapped.right - guide) <= 0.6, `bord droit ${snapped.right} calé sur le guide ${guide}`);
    const wA = Math.round(snapped.width);
    const d1 = await saved((d) => nodesOf(d.sections).find((x) => x.id === "boxa00000001").styles.desktop.width === `${wA}px`, `largeur ${wA} px`);
    assert.ok(d1);
    // Alt : libre
    await dragHandle("boxb00000001", "e", 27, 0, { alt: true });
    const wb = await widthOf("boxb00000001");
    assert.ok(Math.abs(wb - 227) <= 2, `Alt : largeur libre (${wb})`);
    // interrupteur : plus d'accrochage
    await page.locator('[data-pb-toggle="snap"]').click();
    await dragHandle("boxc00000001", "e", 27, 0);
    const wc = await widthOf("boxc00000001");
    assert.ok(Math.abs(wc - 227) <= 2, `magnétisme désactivé : largeur libre (${wc})`);
    assert.equal(await aid("snap"), false);
  });

  test("T9 magnétisme : centre de la page, bords, autres éléments ; chaque option désactivée retire son accrochage", async () => {
    await openEditor({ prefs: NO_GRID });
    const a = await rectOf("boxa00000001");
    const half = await page.evaluate(() => document.querySelector("[data-pb-frame]").contentDocument.documentElement.clientWidth / 2);
    // centre : bord droit visé à 4 px du centre de la page
    const release = await dragHandle("boxa00000001", "e", half - 4 - a.right, 0, { hold: true });
    const during = await tags();
    await release();
    assert.ok(during.some((t) => /^centre/.test(t.text)), `repère de centre affiché (${JSON.stringify(during)})`);
    const ra = await rectOf("boxa00000001");
    assert.ok(Math.abs(ra.right - half) <= 1, `bord droit sur le centre : right ${ra.right}, centre ${half}, tags ${JSON.stringify(during)}`);
    // option « Au centre » désactivée : plus d'accrochage au centre
    await panelOpen(); await setPanelCheck("Au centre", false); await setPanelCheck("Aux autres éléments", false); await panelClose();
    await until(() => page.locator("[data-pb-undo]").isEnabled(), { what: "annuler disponible" }); await page.locator("[data-pb-undo]").click(); await wait(700);
    assert.ok(Math.abs((await widthOf("boxa00000001")) - 200) <= 1, "annulé");
    const rel2 = await dragHandle("boxa00000001", "e", half - 4 - a.right, 0, { hold: true });
    const during2 = await tags(), dimTxt = await frame().locator(".pb-dim").allTextContents();
    await rel2();
    // Sans accrochage, la largeur écrite est celle du curseur (la mise en page Flexbox peut ensuite rétrécir la case : c'est
    // son comportement réel). Avec accrochage, la largeur aurait été corrigée pour que le bord tombe pile sur la cible.
    const freeW = await saved((d) => { const w = parseFloat(nodesOf(d.sections).find((n) => n.id === "boxa00000001").styles.desktop.width); return Math.abs(w - (half - 4 - a.left)) <= 2; }, `largeur libre ≈ ${Math.round(half - 4 - a.left)} px (repères ${JSON.stringify(during2)})`);
    assert.ok(freeW);
    // éléments : la hauteur de la case A se cale sur le bas de B (même hauteur)
    await panelOpen(); await setPanelCheck("Au centre", true); await setPanelCheck("Aux autres éléments", true); await panelClose();
    await dragHandle("boxb00000001", "s", 5, 5 - 5); // même hauteur déjà : aucun changement attendu (pas de dérive)
    await dragHandle("boxa00000001", "s", 0, 6);
    assert.equal(Math.round((await rectOf("boxa00000001")).height), H, "bas de A calé sur le bas de B (6 px d'écart)");
    await panelOpen(); await setPanelCheck("Aux autres éléments", false); await setPanelCheck("Aux bords", false); await panelClose(); // le bas du parent est aussi un bord
    await dragHandle("boxa00000001", "s", 0, 6);
    const free = Math.round((await rectOf("boxa00000001")).height);
    assert.ok(free >= H + 3 && free <= H + 9, `sans accrochage aux éléments : hauteur libre (${free})`);
  });

  test("T10 guides intelligents et distances : écarts affichés pendant le geste, écarts identiques en vert, rien d'affiché après", async () => {
    await openEditor({ prefs: NO_GRID });
    const release = await dragHandle("boxb00000001", "e", 2, 0, { hold: true });
    const during = await tags();
    assert.ok(during.some((t) => /^24 px$/.test(t.text)), `distance de 24 px affichée (${JSON.stringify(during)})`);
    assert.ok(during.some((t) => /is-equal/.test(t.cls)), "écarts égaux signalés");
    await release();
    assert.deepEqual(await smartLines(), [], "les repères disparaissent à la fin du geste");
    // « Distances intelligentes » désactivées : plus de mesures
    await panelOpen(); await setPanelCheck("Distances intelligentes", false); await panelClose();
    const r2 = await dragHandle("boxb00000001", "e", 2, 0, { hold: true });
    assert.deepEqual((await tags()).filter((t) => /is-(dist|equal)/.test(t.cls)), [], "aucune distance quand l'option est désactivée");
    await r2();
  });

  test("T11 Alt + survol : distances entre l'élément sélectionné et l'élément survolé", async () => {
    await openEditor();
    await frame().locator('[data-node-id="boxa00000001"]').click({ position: { x: 6, y: 6 } });
    const c = await frame().locator('[data-node-id="boxc00000001"]').boundingBox();
    await page.keyboard.down("Alt");
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 4 });
    await wait(150);
    const t = await tags();
    await page.keyboard.up("Alt");
    const a = await rectOf("boxa00000001"), cc = await rectOf("boxc00000001");
    assert.ok(t.some((x) => Math.abs(parseFloat(x.text) - (cc.left - a.right)) <= 1), `écart ${Math.round(cc.left - a.right)} px (${JSON.stringify(t)})`);
    await wait(100);
    assert.deepEqual(await smartLines(), [], "effacé quand Alt est relâché");
  });

  test("T12 Flexbox et Grille : le bord s'accroche à l'écart (gap) réel du parent et aux pistes de la grille", async () => {
    await openEditor({ prefs: NO_GRID });
    // Flexbox : B est à 24 px de C ; tirer son bord de 5 px puis le relâcher → retour à l'écart de 24 px (largeur 200)
    await dragHandle("boxb00000001", "e", -5, 0);
    assert.equal(await widthOf("boxb00000001"), 200, "écart Flexbox de 24 px retrouvé");
    // Grille : le bord droit de la case 1 s'accroche à la fin de la 1re piste
    const track = await until(() => page.evaluate(() => {
      const d = document.querySelector("[data-pb-frame]").contentDocument, g = d && d.querySelector('[data-node-id="grid00000001"]'), w = d && d.defaultView;
      if (!g) return null;
      const cs = w.getComputedStyle(g), first = parseFloat(cs.gridTemplateColumns.split(" ")[0]), r = g.getBoundingClientRect();
      return { end: r.left + w.scrollX + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) + first };
    }), { what: "grille affichée" });
    const c1 = await rectOf("cell00000001");
    await dragHandle("cell00000001", "e", track.end - 5 - c1.right, 0);
    const after = await rectOf("cell00000001");
    assert.ok(Math.abs(after.right - track.end) <= 1, `fin de la 1re piste ${Math.round(track.end)} (obtenu ${Math.round(after.right)})`);
    // La mise en page n'a pas été modifiée : aucune position absolue injectée
    const d = draft();
    assert.ok(!/absolute|"position"/.test(JSON.stringify(d)), "aucun position: absolute écrit dans le contenu");
  });

  test("T13 touche Maj : les proportions sont gardées sur la poignée d'angle", async () => {
    await openEditor({ prefs: NO_GRID });
    const r0 = await rectOf("boxa00000001");
    await dragHandle("boxa00000001", "se", 60, 0, { shift: true, alt: true });
    const r = await rectOf("boxa00000001");
    assert.ok(Math.abs(r.width / r.height - r0.width / r0.height) < 0.03, `proportions ${(r.width / r.height).toFixed(2)} (départ ${(r0.width / r0.height).toFixed(2)})`);
  });

  test("T14 annuler / rétablir un redimensionnement accroché ; le contenu enregistré ne contient que la dimension", async () => {
    await openEditor({ prefs: NO_GRID });
    const a = await rectOf("boxa00000001");
    const guide = Math.round(a.left + 260);
    await panelOpen();
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill(String(guide));
    await page.locator("[data-pb-rules] .pb-rules-add button").click(); await panelClose();
    await dragHandle("boxa00000001", "e", 57, 0);
    const snapped = await rectOf("boxa00000001"), w = Math.round(snapped.width);
    assert.ok(Math.abs(snapped.right - guide) <= 0.6, `bord droit calé sur le guide (${snapped.right} / ${guide})`);
    await until(() => page.locator("[data-pb-undo]").isEnabled(), { what: "annuler disponible" });
    await page.locator("#pb-canvas").focus(); // le clavier va au canevas, pas à un champ
    await page.keyboard.press("Control+z");
    await until(async () => (await widthOf("boxa00000001")) === 200, { what: "largeur annulée à 200 px" });
    await until(() => page.locator("[data-pb-redo]").isEnabled(), { what: "rétablir disponible" });
    await page.keyboard.press("Control+Shift+z");
    await until(async () => (await widthOf("boxa00000001")) === w, { what: `largeur rétablie à ${w} px` });
    await page.locator("[data-pb-save-now]").click();
    const d = await saved((x) => nodesOf(x.sections).find((n) => n.id === "boxa00000001").styles.desktop.width === `${w}px`, `${w} px enregistré`);
    assert.equal(JSON.stringify(nodesOf(d.sections).find((n) => n.id === "boxa00000001").styles), `{"desktop":{"width":"${w}px","height":"${H}px"}}`);
  });

  test("T15 défilement : règles et guides restent synchronisés (vertical et horizontal)", async () => {
    await openEditor({ zoom: 1 });
    await page.locator('[data-pb-toggle="rulers"]').click();
    await panelOpen();
    const add = async (axis, text) => { await page.locator("[data-pb-rules] .pb-rules-add select").selectOption(axis); await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill(text); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(80); };
    await add("h", "150"); await panelClose();
    await page.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); f.contentDocument.body.style.minHeight = "2400px"; f.contentWindow.scrollTo(0, 90); });
    await wait(300);
    const m = await page.evaluate(() => {
      const f = document.querySelector("[data-pb-frame]"), fr = f.getBoundingClientRect(), d = f.contentDocument, w = f.contentWindow;
      const z = parseFloat(document.querySelector("[data-pb-zoom-value]").textContent) / 100;
      const g = d.querySelector(".pb-guide-h"), gr = g.getBoundingClientRect();
      const lineY = fr.top + (gr.top + 4) * z;
      const cv = document.querySelector("[data-pb-ruler-y]"), cr = cv.getBoundingClientRect(), ctx = cv.getContext("2d");
      let best = null;
      for (let py = 0; py < cr.height; py++) { const p = ctx.getImageData(1, py, 1, 1).data; if (p[0] < 40 && p[1] > 130 && p[2] > 150 && p[3] > 200) { const dd = Math.abs(cr.top + py + 0.5 - lineY); if (best === null || dd < best) best = dd; } }
      return { scroll: w.scrollY, mark: best, top: gr.top };
    });
    assert.equal(m.scroll, 90, "page défilée");
    assert.ok(Math.abs(m.top + 90 - 150) <= 5 + 1, `guide à 150 − 90 = 60 de la fenêtre (${m.top})`);
    assert.ok(m.mark !== null && m.mark <= 1.5, `repère sur la règle à ${m.mark} px du guide après défilement`);
  });

  test("T16 préférences et guides conservés après rechargement ; contenu, aperçu et page publiée sans aucun outil de conception", async () => {
    await openEditor({ prefs: NO_GRID });
    await panelOpen();
    await setPanelCheck("Grille (Maj + G)", true);
    await page.locator("[data-pb-rules] select", { has: page.locator('option[value="16"]') }).first().selectOption("16");
    await page.locator("[data-pb-rules] .pb-rules-add input[type=text]").fill("640"); await page.locator("[data-pb-rules] .pb-rules-add button").click(); await wait(100);
    await dragHandle("boxa00000001", "e", 30, 0, { alt: true });
    await page.locator("[data-pb-save-now]").click(); await wait(600);
    const before = await savedPrefs();
    assert.equal(before.step, 16);
    await page.reload(); await ready(); await wait(400);
    assert.equal((await savedPrefs()).step, 16, "préférence relue");
    assert.deepEqual((await guidesInCanvas()).map((g) => g.pos), [640], "guide relu");
    assert.match((await overlay()).bg, /^16px 16px$/, "grille relue");
    // publier : aucune trace des outils
    const pub = await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} });
    assert.equal(pub.status, 200, pub.text.slice(0, 200));
    const slug = db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.ok(html.includes("boxa00000001") || html.length > 500, "page publiée");
    for (const bad of ["pb-guide", "pb-grid-overlay", "pb-smart", "pb-safe-area", "KWSnap", "page-builder-snap", "pb-margin-line"]) assert.ok(!html.includes(bad), `la page publiée ne contient pas « ${bad} »`);
    assert.ok(!/guide|snapcfg|"grid-step"/i.test(JSON.stringify(draft())), "brouillon sans outil de conception");
  });

  test("T17 menu rapide : cases réellement liées aux réglages ; raccourcis Maj + R / G / M sans casser les existants", async () => {
    await openEditor();
    await page.locator("[data-pb-rules-menu]").click();
    const pop = page.locator(".pb-rules-pop");
    assert.equal(await pop.isVisible(), true);
    const item = (label) => pop.locator("label", { hasText: new RegExp(`^\\s*${label}$`) }).locator("input");
    await item("Règles").click();
    assert.equal(await page.locator("[data-pb-ruler-x]").isVisible(), true);
    await item("Grille").click();
    assert.ok(await overlay(), "grille affichée");
    await item("Magnétisme").click();
    assert.equal(await aid("snap"), false);
    await item("Guides intelligents").click();
    assert.equal((await savedPrefs()).snap.smart, false);
    await page.keyboard.press("Escape");
    assert.equal(await pop.isHidden(), true);
    // raccourcis (focus dans le canevas)
    await frame().locator("body").click({ position: { x: 5, y: 5 } });
    await page.keyboard.press("Shift+G");
    assert.equal(await overlay(), null, "Maj + G : grille masquée");
    await page.keyboard.press("Shift+M");
    assert.equal(await aid("snap"), true, "Maj + M : magnétisme rétabli");
    await page.keyboard.press("Shift+R");
    assert.equal(await aid("guides"), false, "Maj + R : guides masqués");
    await page.keyboard.press("Shift+R");
    // existants intacts : V, H (outils), Ctrl+K (commandes)
    await page.keyboard.press("h");
    assert.equal(await page.evaluate(() => document.querySelector('[data-mode="hand"]')?.getAttribute("aria-pressed")), "true");
    await page.keyboard.press("v");
    assert.deepEqual(errors, [], "aucune erreur dans la console");
  });
});
