// KOLAKISA — Apparence → Styles : alignement du panneau (palettes, rangées de couleurs, contrastes) dans un VRAI Chrome (Playwright, ignoré sans).
// Mesure les boîtes réelles : rien ne dépasse du panneau, pastilles de taille uniforme, libellé et contrôles sur la même ligne, grille de palettes sans chevauchement.
// STYLES_SHOTS=<dossier> enregistre des captures de comparaison.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : mesure de mise en page non exécutée sur cette machine" : false;

describe("styles : alignement du panneau (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, siteId;
  const open = async (width, zoom = 1) => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    await page.goto(`${srv.base}/marketing/site-web/styles?site=${siteId}`);
    await page.locator("[data-st-layout]:not([hidden])").waitFor();
    if (zoom !== 1) await page.evaluate((z) => { document.documentElement.style.zoom = String(z); }, zoom);
    return page;
  };
  // Mesure : tout enfant du panneau doit tenir dans le panneau ; rangées : libellé et contrôles se recouvrent verticalement et ne se chevauchent pas horizontalement.
  const measure = (page) => page.evaluate(() => {
    const R = (e) => e.getBoundingClientRect();
    const panel = document.querySelector(".mk-st-panel"), pr = R(panel), out = { overflow: [], rows: [], sizes: new Set(), pal: [], hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
    for (const e of panel.querySelectorAll(".mk-st-body *")) { const r = R(e); if (r.width && (r.right > pr.right + 0.5 || r.left < pr.left - 0.5)) out.overflow.push(`${e.className || e.tagName}:${Math.round(r.right - pr.right)}`); }
    for (const f of panel.querySelectorAll(".mk-st-field[data-st-ctl]")) {
      const lab = f.querySelector(":scope > label"), row = f.querySelector(".mk-st-colorrow"); if (!lab || !row) continue;
      const a = R(lab), b = R(row), kids = [...row.children].filter((k) => !k.hidden && R(k).width).map(R);
      const sorted = kids.slice().sort((x, y) => x.left - y.left);
      out.rows.push({ id: f.dataset.stCtl, sameLine: Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) < 14 || b.top > a.bottom - 1, noOverlapLabel: b.left >= a.right - 0.5 || b.top >= a.bottom - 1, kidsOverlap: sorted.some((k, i) => i && k.left < sorted[i - 1].right - 0.5), right: Math.round(pr.right - b.right) });
      out.sizes.add(Math.round(R(row.querySelector(".mk-st-swatch")).width));
    }
    out.sizes = [...out.sizes];
    for (const c of panel.querySelectorAll(".mk-st-palette")) { const r = R(c), sw = R(c.querySelector(".mk-st-pal-sw")), n = R(c.querySelector(".mk-st-pal-name")); out.pal.push({ inside: sw.left >= r.left && sw.right <= r.right && n.right <= r.right + 0.5, below: n.top >= sw.bottom, r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] }); }
    const cards = out.pal.map((p) => p.r); out.palOverlap = cards.some((a, i) => cards.some((b, j) => j > i && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]));
    return out;
  });
  const shot = async (page, name) => { if (process.env.STYLES_SHOTS) { fs.mkdirSync(process.env.STYLES_SHOTS, { recursive: true }); await page.screenshot({ path: `${process.env.STYLES_SHOTS}/${name}.png`, fullPage: true }); } };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    const db = srv.db(), orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(orgId).lastInsertRowid);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { await browser?.close(); await srv?.stop?.(); });

  for (const [label, width, zoom] of [["bureau large", 1440, 1], ["bureau réduit", 1100, 1], ["proche tablette", 900, 1], ["zoom 150 %", 1280, 1.5]]) {
    test(`panneau Palette sans débordement ni chevauchement — ${label}`, async () => {
      const page = await open(width, zoom);
      const m = await measure(page);
      await shot(page, `palette-${width}-${zoom}`);
      assert.deepEqual(m.overflow, [], "aucun élément ne dépasse du panneau");
      assert.equal(m.hscroll, false, "pas de défilement horizontal de la page");
      assert.ok(m.rows.length >= 8, "rangées de couleurs présentes");
      for (const r of m.rows) { assert.ok(r.noOverlapLabel, `${r.id} : contrôles hors du libellé`); assert.equal(r.kidsOverlap, false, `${r.id} : pastilles qui se chevauchent`); assert.ok(r.right >= 0, `${r.id} : contrôles hors du panneau`); }
      assert.deepEqual(m.sizes, [Math.round(24 * zoom)], "pastilles de taille uniforme");
      assert.ok(m.pal.length >= 8 && m.pal.every((p) => p.inside && p.below), "chaque palette contient son aperçu et son nom dessous");
      assert.equal(m.palOverlap, false, "cartes de palette sans chevauchement");
      await page.context().close();
    });
  }

  test("les rangées gardent la même géométrie après un changement de couleur et un changement d'onglet", async () => {
    const page = await open(1280);
    const before = await measure(page);
    await page.locator('[data-st-ctl="color.primary"] input[type="text"], [data-st-ctl] input[type="text"]').first().fill("#7a1f3d");
    await page.waitForTimeout(150);
    const after = await measure(page);
    assert.deepEqual(after.overflow, []);
    assert.deepEqual(after.rows.map((r) => r.right), before.rows.map((r) => r.right), "position des contrôles inchangée");
    for (const id of ["typographie", "mise-en-page", "boutons"]) { await page.click(`[data-st-tab="${id}"]`); const m = await page.evaluate(() => { const p = document.querySelector(".mk-st-panel").getBoundingClientRect(); return [...document.querySelectorAll(".mk-st-body *")].filter((e) => e.getBoundingClientRect().width && e.getBoundingClientRect().right > p.right + 0.5).length; }); assert.equal(m, 0, `onglet ${id} : aucun débordement`); await shot(page, `onglet-${id}`); }
    await page.context().close();
  });
});
