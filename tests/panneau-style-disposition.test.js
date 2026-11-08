// DISPOSITION DES LIGNES DU PANNEAU « STYLE » (et du panneau « Page » d'un en-tête) : la ligne « Espacement entre éléments » ne doit pas casser la grille
// (champ numérique réduit à quelques pixels, liste d'unités qui déborde sur le bouton « valeur du site », libellés coupés par « … »).
// Mesures faites dans un vrai Chrome sur le vrai éditeur ; ignoré proprement si Chrome est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const cdp = require("./helpers-chrome-cdp");

const SKIP = cdp.SKIP;
const wait = cdp.wait;
const ID = (s) => (s + "0000000000000").slice(0, 12);
const kid = (n, type, props, extra) => ({ id: ID(n), type, props: props || {}, ...(extra || {}) });
const CANVAS_READY = () => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); };
const inside = (a, b) => a[0] >= b[0] - 0.5 && a[1] >= b[1] - 0.5 && a[0] + a[2] <= b[0] + b[2] + 0.5 && a[1] + a[3] <= b[1] + b[3] + 0.5; // [x, y, w, h]
const apart = (a, b) => a[0] + a[2] <= b[0] + 0.5 || b[0] + b[2] <= a[0] + 0.5 || a[1] + a[3] <= b[1] + 0.5 || b[1] + b[3] <= a[1] + 0.5;

// Mesure d'une ligne de réglage dans le panneau `root` (sélecteur CSS) : rectangles du libellé, du champ, de l'unité, du bouton « valeur du site », de ↺
const MEASURE = ({ root, prop }) => {
  const box = document.querySelector(root), row = box.querySelector(`[data-prop="${prop}"]`);
  if (!row) return null;
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; };
  const num = row.querySelector("input.pb-len-num"), unit = row.querySelector(".pb-len-unit");
  const scroller = box.closest(".pb-inspector") || box;
  const labels = [...box.querySelectorAll(".pb-prop-label")].map((l) => ({ text: l.textContent, clipped: l.scrollWidth > l.clientWidth + 1 || getComputedStyle(l).textOverflow === "ellipsis" && getComputedStyle(l).overflow !== "visible" }));
  return { row: r(row), label: r(row.querySelector(".pb-prop-label")), labelText: row.querySelector(".pb-prop-label").textContent, labelTitle: row.querySelector(".pb-prop-label").title, len: r(row.querySelector(".pb-len")), num: r(num), unit: r(unit), tok: r(row.querySelector(".pb-tokbtn")),
    reset: r(row.querySelector(".pb-reset")), slider: r(row.querySelector(".pb-nc-range")), unitInsideInput: Boolean(num && num.contains(unit)), numText: num && num.value, numPlaceholder: num && num.placeholder, unitText: unit && unit.value,
    boxScroll: [scroller.scrollWidth, scroller.clientWidth], labels, tokTip: row.querySelector(".pb-tokbtn") && (row.querySelector(".pb-tokbtn").dataset.tip || row.querySelector(".pb-tokbtn").title) };
};
function checkRow(m, what) {
  assert.ok(m, what + " : ligne introuvable");
  assert.ok(inside(m.len, m.row), what + " : le champ reste dans la ligne");
  assert.ok(m.tok && inside(m.tok, m.row), what + " : le bouton « valeur du site » reste dans la ligne");
  if (m.reset) assert.ok(inside(m.reset, m.row), what + " : ↺ reste dans la ligne"); // ↺ n'existe que si une valeur est réglée
  assert.ok(apart(m.len, m.tok), what + " : le bouton « valeur du site » ne touche pas le champ");
  if (m.reset) assert.ok(apart(m.tok, m.reset), what + " : ↺ ne touche pas le bouton");
  assert.ok(m.unit && inside(m.unit, m.len), what + " : la liste d'unités reste DANS le cadre du champ (sans déborder sur le bouton)");
  assert.ok(apart(m.num, m.unit), what + " : l'unité a sa propre place, à côté du nombre (pas dans le champ numérique)");
  assert.ok(m.num[2] >= 40, what + " : le nombre est lisible (champ d'au moins 40 px, mesuré " + Math.round(m.num[2]) + ")");
  assert.equal(m.unitInsideInput, false, what + " : le sélecteur d'unité n'est pas dans le champ numérique");
  assert.notEqual(m.numText, "px", what + " : le champ ne contient pas l'unité");
  assert.ok(m.numPlaceholder && m.numPlaceholder !== "px", what + " : le champ vide affiche un repère, pas l'unité");
  assert.ok(m.tok[1] - m.len[1] <= 2, what + " : le bouton est aligné en haut avec le champ");
  assert.ok(m.slider && Math.abs(m.slider[0] - m.len[0]) <= 1 && Math.abs(m.slider[2] - m.len[2]) <= 1, what + " : le curseur a la largeur du champ");
  assert.ok(m.tokTip, what + " : info-bulle du bouton");
  assert.ok(m.boxScroll[0] <= m.boxScroll[1], what + " : aucun défilement horizontal (" + m.boxScroll + ")");
  assert.deepEqual(m.labels.filter((l) => l.clipped), [], what + " : aucun libellé coupé");
  assert.ok(m.label[0] + m.label[2] <= m.len[0] + 0.5 || m.label[1] + m.label[3] <= m.len[1] + 0.5, what + " : le libellé est à gauche du champ ou au-dessus, jamais par-dessus");
}

describe("disposition des lignes du panneau Style (vrai Chrome, vrai éditeur)", { skip: SKIP }, () => {
  let srv, boss, ch, cookies, pageId, headerId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    ch = await cdp.launch();
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
    pageId = Number((await boss.post("/marketing/pages", { name: "Disposition panneau" })).location.match(/(\d+)$/)[1]);
    const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const content = { sections: [{ id: ID("sect1"), type: "layout", children: [
      kid("flex1", "container", {}, { styles: { desktop: { backgroundColor: "#cc3333", paddingTop: "30px", display: "flex", gap: "20px" } }, children: [kid("h1", "heading", { text: "A", level: 2 }), kid("h2", "heading", { text: "B", level: 2 })] }),
      kid("grid1", "grid", {}, { styles: { desktop: { backgroundColor: "#3333cc", paddingTop: "30px" } }, children: [kid("h3", "heading", { text: "C", level: 2 })] }),
    ] }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content }, headers: { Origin: srv.base } })).status, 200);
    const db = srv.db(), orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    const section = { type: "layout", children: [{ type: "container", children: [{ type: "text", props: { html: "<p>Logo</p>" } }], styles: { desktop: { paddingTop: "16px", display: "flex", gap: "24px", paddingBottom: "16px" } } }] };
    headerId = Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, ?, 'En-tête', ?, 'standard')").run(orgId, site, JSON.stringify(section)).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET header_component_id = ? WHERE id = ?").run(headerId, site);
  });
  after(async () => { if (ch) await ch.close(); if (srv) await srv.stop(); });

  const openEditor = async (url) => { const page = await ch.newPage({ width: 1900, height: 1100, cookies }); await page.goto(url); await page.waitFor(CANVAS_READY, "canevas", 90000); await wait(1000); return page; };
  const widen = (page, name, w) => page.evaluate(([n, w]) => document.querySelector(".pb-main").style.setProperty(n, w + "px"), [name, w]);
  const openGroups = (page, root) => page.evaluate((root) => document.querySelectorAll(`${root} details.pb-acc`).forEach((d) => (d.open = true)), root);
  const select = async (page, nid) => {
    const r = await page.evaluate((n) => { const f = document.querySelector("[data-pb-frame]"), fr = f.getBoundingClientRect(), e = f.contentDocument.querySelector(`[data-node-id="${n}"]`); e.scrollIntoView({ block: "start" }); const b = e.getBoundingClientRect(); return { x: fr.x + b.x + 8, y: fr.y + b.y + 8 }; }, ID(nid));
    await page.mouseClick(r.x, r.y); await wait(500);
    await page.evaluate(() => { const b = [...document.querySelectorAll(".pb-right button")].find((x) => /^Style$/.test(x.textContent.trim())); if (b) b.click(); }); await wait(400);
  };
  const cs = (page, nid, prop) => page.evaluate(([n, p]) => { const d = document.querySelector("[data-pb-frame]").contentDocument; return d.defaultView.getComputedStyle(d.querySelector(`[data-node-id="${n}"]`))[p]; }, [ID(nid), prop]);
  const typeIn = async (page, root, prop, value) => { await page.evaluate(([root, prop, v]) => { const i = document.querySelector(`${root} [data-prop="${prop}"] input.pb-len-num`); i.scrollIntoView({ block: "center" }); i.focus(); i.value = v; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); }, [root, prop, value]); await wait(900); };

  test("panneau de droite (Style) : ligne « Écart », paire Colonnes/Lignes et « Flou » sans rognage, à 360 et 440 px", async () => {
    const page = await openEditor(`${srv.base}/marketing/pages/${pageId}/editeur`);
    try {
      for (const w of [360, 440]) {
        await widen(page, "--pb-right-w", w); await wait(300);
        await select(page, "flex1"); await openGroups(page, ".pb-inspector"); await wait(300);
        const gap = await page.evaluate(MEASURE, { root: ".pb-inspector", prop: "gap" }); checkRow(gap, `Écart (${w}px)`);
        const blur = await page.evaluate(MEASURE, { root: ".pb-inspector", prop: "backdropBlur" });
        assert.ok(blur && inside(blur.len, blur.row) && inside(blur.unit, blur.len) && blur.num[2] >= 40, `Flou arrière (${w}px) : champ et unité dans la ligne`);
        await select(page, "grid1"); await openGroups(page, ".pb-inspector"); await wait(300);
        checkRow(await page.evaluate(MEASURE, { root: ".pb-inspector", prop: "columnGap" }), `Colonnes (${w}px)`);
        checkRow(await page.evaluate(MEASURE, { root: ".pb-inspector", prop: "rowGap" }), `Lignes (${w}px)`);
      }
    } finally { await page.close(); }
  });

  test("panneau de droite : la valeur saisie s'applique (24 → 24px), l'unité change, le curseur déplace la valeur, ↺ réinitialise ; paire colonnes/lignes", async () => {
    const page = await openEditor(`${srv.base}/marketing/pages/${pageId}/editeur`);
    try {
      await widen(page, "--pb-right-w", 440);
      await select(page, "flex1"); await openGroups(page, ".pb-inspector");
      await typeIn(page, ".pb-inspector", "gap", "24");
      assert.equal(await cs(page, "flex1", "columnGap"), "24px", "24 tapé → 24px sur le canevas");
      await page.evaluate(() => { const s = document.querySelector('.pb-inspector [data-prop="gap"] select.pb-len-unit'); s.value = "rem"; s.dispatchEvent(new Event("change", { bubbles: true })); }); await wait(900);
      assert.equal(await cs(page, "flex1", "columnGap"), "384px", "unité rem : 24 rem = 384 px");
      await page.evaluate(() => { const s = document.querySelector('.pb-inspector [data-prop="gap"] select.pb-len-unit'); s.value = "px"; s.dispatchEvent(new Event("change", { bubbles: true })); }); await wait(900);
      await page.evaluate(() => { const r = document.querySelector('.pb-inspector [data-prop="gap"] input.pb-nc-range'); r.value = "10"; r.dispatchEvent(new Event("input", { bubbles: true })); r.dispatchEvent(new Event("change", { bubbles: true })); }); await wait(900);
      assert.equal(await cs(page, "flex1", "columnGap"), "10px", "le curseur à 10 → 10px");
      await page.evaluate(() => document.querySelector('.pb-inspector [data-prop="gap"] .pb-reset').click()); await wait(900);
      assert.notEqual(await cs(page, "flex1", "columnGap"), "10px", "↺ efface la valeur propre");
      assert.equal(await page.evaluate(() => document.querySelectorAll('.pb-inspector [data-prop="gap"].is-set').length), 0, "la ligne n'est plus marquée comme réglée");
      await select(page, "grid1"); await openGroups(page, ".pb-inspector");
      await typeIn(page, ".pb-inspector", "columnGap", "10"); await typeIn(page, ".pb-inspector", "rowGap", "20");
      assert.equal(await cs(page, "grid1", "columnGap"), "10px"); assert.equal(await cs(page, "grid1", "rowGap"), "20px");
    } finally { await page.close(); }
  });

  test("panneau « Page » d'un en-tête (zone étroite à gauche) : « Espacement entre éléments » en entier, champ lisible, unité à sa place, sans débordement, à 260 et 360 px", async () => {
    const page = await openEditor(`${srv.base}/marketing/site-web/composants/${headerId}/editeur`);
    try {
      await page.evaluate(() => document.querySelector("#pb-tab-page").click()); await wait(500);
      for (const w of [260, 360]) {
        await widen(page, "--pb-left-w", w); await wait(300);
        await openGroups(page, "[data-pb-page-settings]"); await wait(300);
        const m = await page.evaluate(MEASURE, { root: "[data-pb-page-settings]", prop: "gap" });
        assert.equal(m.labelText, "Espacement entre éléments");
        assert.match(m.labelTitle, /Espacement entre éléments/, "le libellé complet est aussi dans l'info-bulle");
        checkRow(m, `En-tête, Espacement (${w}px)`);
        assert.equal(await page.evaluate(() => { const l = document.querySelector('[data-pb-page-settings] [data-prop="gap"] .pb-prop-label'); return l.scrollWidth <= l.clientWidth + 1 && l.getBoundingClientRect().height >= 12; }), true, "libellé entier, sans « … »");
      }
      await widen(page, "--pb-left-w", 360);
      await typeIn(page, "[data-pb-page-settings]", "gap", "32");
      assert.equal(await page.evaluate(() => { const d = document.querySelector("[data-pb-frame]").contentDocument; return [...d.querySelectorAll("*")].some((e) => d.defaultView.getComputedStyle(e).columnGap === "32px"); }), true, "32 tapé dans le panneau de l'en-tête → 32px sur le canevas");
    } finally { await page.close(); }
  });
});
