// Largeurs aux LIMITES des points de rupture et largeurs intermédiaires sur la page PUBLIÉE (Chrome réel), avec les points de rupture par
// défaut du projet (tablette ≤ 1023, mobile ≤ 767, grand écran ≥ 1920) puis ceux d'un site qui les a réglés (tablette ≤ 1279, mobile ≤ 600).
// Vérifie : la bonne valeur à chaque largeur (juste sous / sur / au-dessus de chaque limite), l'héritage (le grand écran hérite de
// l'ordinateur et jamais de la tablette ; le mobile hérite de la tablette), l'absence de débordement horizontal, la grille 3 → 2 → 1 colonnes,
// des changements rapides de largeur, et la concordance du canevas (largeur de chaque appareil) avec la page publiée.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : largeurs responsive non exécutées sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const LONG = "Un paragraphe assez long pour passer à la ligne plusieurs fois sur un petit écran. ".repeat(12);
const content = () => ({ title: "Largeurs", sections: [{ id: "sect00000001", type: "layout", children: [
  { id: "hed000000001", type: "heading", props: { text: "Titre", level: "2" }, styles: { desktop: { fontSize: "40px" }, wide: { fontSize: "50px" }, tablet: { fontSize: "30px" }, mobile: { fontSize: "20px" } } },
  { id: "hed000000002", type: "heading", props: { text: "Seulement mobile", level: "3" }, styles: { desktop: { fontSize: "24px" }, mobile: { fontSize: "14px" } } },
  { id: "hed000000003", type: "heading", props: { text: "Seulement grand écran", level: "3" }, styles: { desktop: { fontSize: "24px" }, tablet: { fontSize: "18px" }, wide: { fontSize: "36px" } } },
  { id: "txt000000001", type: "text", props: { html: `<p>${LONG}</p>` } },
  { id: "img000000001", type: "image", props: { src: "https://example.com/a.jpg", alt: "a" }, styles: { desktop: { width: "100%" } } },
  { id: "grd000000001", type: "grid", props: {}, styles: { desktop: { columns: 3, gap: "12px" } }, children: ["A", "B", "C", "D", "E", "F"].map((t, i) => ({ id: `gri00000000${i}`, type: "text", props: { html: `<p>${LONG.slice(0, 120)}</p>` } })) },
] }] });
const expectedSize = (w, bp) => (w >= bp.wide ? 50 : w <= bp.mobile ? 20 : w <= bp.tablet ? 30 : 40);

describe("responsive : limites des points de rupture et largeurs intermédiaires (Chrome réel)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx;
  const db = () => srv.db();
  async function makePage(name, bp) {
    const id = Number((await boss.post("/marketing/pages", { name, template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    if (bp) {
      const org = db().prepare("SELECT organization_id o FROM mk_landing_pages WHERE id = ?").get(id).o;
      const sid = Number(db().prepare("INSERT INTO mk_sites (organization_id, name, tokens, settings) VALUES (?, ?, '{}', ?)").run(org, `Site ${name}`, JSON.stringify({ layout: { breakpoints: bp } })).lastInsertRowid);
      db().prepare("UPDATE mk_landing_pages SET site_id = ? WHERE id = ?").run(sid, id);
    }
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content: content() } });
    assert.equal(r.status, 200, r.text);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    return { id, slug: db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug };
  }
  const probe = (page, w) => page.evaluate(() => {
    const px = (id) => Math.round(parseFloat(getComputedStyle(document.querySelector(`.kw-n-${id}`)).fontSize));
    const grid = getComputedStyle(document.querySelector(".kw-n-grd000000001")).gridTemplateColumns.split(" ").length;
    return { t1: px("hed000000001"), t2: px("hed000000002"), t3: px("hed000000003"), grid, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, w: innerWidth };
  });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  for (const [label, bp] of [["points de rupture par défaut", { tablet: 1023, mobile: 767, wide: 1920 }], ["points de rupture réglés par le site", { tablet: 1279, mobile: 600, wide: 1920 }]]) {
    test(`${label} : valeur exacte à chaque limite (−1, limite, +1) et aux largeurs intermédiaires ; héritage ; pas de débordement`, async () => {
      const { slug } = await makePage(label, label.includes("défaut") ? null : bp);
      const page = await ctx.newPage();
      try {
        const widths = [320, 375, 390, bp.mobile - 1, bp.mobile, bp.mobile + 1, 700, 820, 900, bp.tablet - 1, bp.tablet, bp.tablet + 1, 1280, 1366, 1600, bp.wide - 1, bp.wide, bp.wide + 1, 2200];
        const problems = [];
        for (const w of widths) {
          await page.setViewportSize({ width: w, height: 900 });
          await page.goto(`${srv.base}/p/${slug}`);
          const r = await probe(page, w);
          if (r.t1 !== expectedSize(w, bp)) problems.push(`${w}px : titre ${r.t1}px, attendu ${expectedSize(w, bp)}px`);
          if (r.t2 !== (w <= bp.mobile ? 14 : 24)) problems.push(`${w}px : « seulement mobile » ${r.t2}px (hérite de l'ordinateur, pas de la tablette)`);
          // grand écran : hérite de l'ordinateur (24) et jamais de la tablette (18) ; tablette 18 ; mobile hérite de la tablette (18)
          const want3 = w >= bp.wide ? 36 : w <= bp.tablet ? 18 : 24;
          if (r.t3 !== want3) problems.push(`${w}px : « grand écran » ${r.t3}px, attendu ${want3}px`);
          const cols = w <= 1023 && bp.tablet === 1023 ? (w <= 767 ? 1 : 2) : null;
          if (cols !== null && r.grid !== cols) problems.push(`${w}px : grille ${r.grid} colonnes, attendu ${cols}`);
          if (r.overflow > 0) problems.push(`${w}px : débordement horizontal de ${r.overflow}px`);
        }
        assert.deepEqual(problems, []);
        // changements rapides de largeur (sans rechargement) : toujours la bonne valeur à la fin
        for (const w of [1600, 500, 1000, 400, 1900, 800, 2100, 360, 1200]) { await page.setViewportSize({ width: w, height: 900 }); }
        await wait(300);
        assert.equal((await probe(page, 1200)).t1, expectedSize(1200, bp), "après une série rapide de redimensionnements");
      } finally { await page.close(); }
    });

    test(`${label} : l'éditeur montre chaque appareil à une largeur cohérente avec la page publiée`, async () => {
      const { id, slug } = await makePage(`${label} (éditeur)`, label.includes("défaut") ? null : bp);
      const ed = await ctx.newPage();
      try {
        await ed.goto(`${srv.base}/marketing/pages/${id}/editeur`);
        await ed.waitForFunction(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.body && f.contentDocument.body.classList.contains("lp-builder"); }, null, { timeout: 30000 });
        await wait(1000);
        for (const d of ["desktop", "wide", "tablet", "mobile"]) {
          await ed.locator(`[role="radio"][data-device="${d}"]`).first().click(); await wait(1000);
          const inCanvas = await ed.evaluate(() => { const f = document.querySelector("[data-pb-frame]"); return { w: f.contentDocument.documentElement.clientWidth, size: Math.round(parseFloat(f.contentWindow.getComputedStyle(f.contentDocument.querySelector('[data-node-id="hed000000001"]')).fontSize)) }; });
          const pub = await ctx.newPage();
          try { await pub.setViewportSize({ width: inCanvas.w, height: 900 }); await pub.goto(`${srv.base}/p/${slug}`); const r = await probe(pub, inCanvas.w); assert.equal(inCanvas.size, r.t1, `${d} (${inCanvas.w}px) : canevas ${inCanvas.size}px, publié ${r.t1}px`); assert.equal(r.t1, expectedSize(inCanvas.w, bp), `${d} : l'appareil montre bien SA valeur (${inCanvas.w}px)`); }
          finally { await pub.close(); }
        }
      } finally { await ed.close(); }
    });
  }

  test("« Afficher sur » : plages disjointes aux limites exactes (767/768, 1023/1024, 1919/1920) ; « Ordinateur » couvre aussi le grand écran (compatibilité avec les pages d'avant l'écran « Grand écran », choix documenté et testé par elementor-parite-5)", async () => {
    const { id, slug } = await makePage("visibilité", null);
    const mk = (n, hideOn) => ({ id: `vis0000000${n}`, type: "heading", props: { text: `V${n}`, level: "3" }, hideOn });
    const rev = () => db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const kids = [mk(1, ["desktop"]), mk(2, ["wide"]), mk(3, ["tablet"]), mk(4, ["mobile"]), mk(5, ["desktop", "wide"])];
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev(), content: { title: "Visibilité", sections: [{ id: "sect00000001", type: "layout", children: kids }] } } });
    assert.equal(r.status, 200, r.text);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const page = await ctx.newPage();
    try {
      // « ordinateur » = tout ce qui dépasse la tablette (grand écran compris) ; « grand écran » = ≥ 1920 seulement
      const covers = (w) => ({ mobile: w <= 767, tablet: w > 767 && w <= 1023, desktop: w > 1023, wide: w >= 1920 });
      const hidden = [["desktop"], ["wide"], ["tablet"], ["mobile"], ["desktop", "wide"]];
      const problems = [];
      for (const w of [500, 767, 768, 1023, 1024, 1500, 1919, 1920, 2200]) {
        await page.setViewportSize({ width: w, height: 800 }); await page.goto(`${srv.base}/p/${slug}`);
        const shown = await page.evaluate(() => [1, 2, 3, 4, 5].map((n) => getComputedStyle(document.querySelector(`.kw-n-vis0000000${n}`)).display !== "none"));
        hidden.forEach((list, i) => { const want = !list.some((d) => covers(w)[d]); if (shown[i] !== want) problems.push(`${w}px : masqué sur [${list}] ${shown[i] ? "visible" : "caché"}, attendu ${want ? "visible" : "caché"}`); });
      }
      assert.deepEqual(problems, []);
    } finally { await page.close(); }
  });
});
