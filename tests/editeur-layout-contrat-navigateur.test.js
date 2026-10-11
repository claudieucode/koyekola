// Éditeur de pages — CONTRAT DE MISE EN PAGE (vrai Chrome) : « le parent met en page ses enfants directs », pour TOUS les éléments qui peuvent
// contenir des enfants (Section libre, Conteneur, Conteneur imbriqué, Groupe, Pile, Colonnes). Affichage, Direction, Retour à la ligne,
// Répartition, Alignement, Écart, Grille et valeurs par écran sont posés sur le parent dans le document ; les enfants directs, mesurés dans
// la page publiée, doivent suivre — sans toucher aux enfants. Voir docs/canvas-moteur-audit.md (écart « Section libre : Direction sans effet »).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

const KIDS_W = 150;
// Scénarios : réglages du PARENT (par écran) et ce que doivent faire ses trois enfants directs (mesurés dans la page publiée à 1280 / 900 / 390 px)
const SC = {
  row: { st: { display: "flex", flexDirection: "row" }, at: { 1280: "row" } },
  column: { st: { display: "flex", flexDirection: "column" }, at: { 1280: "column" } },
  rowReverse: { st: { display: "flex", flexDirection: "row-reverse" }, at: { 1280: "rowReverse" } },
  columnReverse: { st: { display: "flex", flexDirection: "column-reverse" }, at: { 1280: "columnReverse" } },
  wrap: { st: { display: "flex", flexDirection: "row", flexWrap: "wrap", width: "400px" }, at: { 1280: "wrap" } },
  center: { st: { display: "flex", flexDirection: "row", gap: "0px", justifyContent: "center" }, at: { 1280: "center" } },
  between: { st: { display: "flex", flexDirection: "row", gap: "0px", justifyContent: "space-between" }, at: { 1280: "between" } },
  alignCenter: { st: { display: "flex", flexDirection: "row", gap: "0px", alignItems: "center" }, at: { 1280: "alignCenter" }, tall: true },
  gap: { st: { display: "flex", flexDirection: "row", gap: "40px" }, at: { 1280: "gap" } },
  grid3: { st: { display: "grid", columns: 3, gap: "10px" }, at: { 1280: "grid3" } },
  grid2: { st: { display: "grid", columns: 2, gap: "10px" }, at: { 1280: "grid2" } },
  respRCC: { st: { display: "flex", flexDirection: "row" }, tablet: { flexDirection: "column" }, mobile: { flexDirection: "column" }, at: { 1280: "row", 900: "column", 390: "column" } },
  respCRC: { st: { display: "flex", flexDirection: "column" }, tablet: { flexDirection: "row" }, mobile: { flexDirection: "column" }, at: { 1280: "column", 900: "row", 390: "column" } },
  respRRC: { st: { display: "flex", flexDirection: "row" }, mobile: { flexDirection: "column" }, at: { 1280: "row", 900: "row", 390: "column" } },
};
const TYPES = ["section", "container", "nested", "group", "stack", "columns"];
const code = (t, k) => `${t[0]}${t === "nested" ? "n" : t === "columns" ? "c" : t === "stack" ? "s" : t === "group" ? "g" : t === "section" ? "x" : "k"}${k.toString(36)}`;
const kid = (t, k, j, tall) => ({ id: `${code(t, k)}q${j}`.padEnd(12, "0"), type: t === "columns" ? "column" : "container", styles: { desktop: { width: `${KIDS_W}px`, minHeight: tall && j === 1 ? "90px" : "50px", backgroundColor: "#cde", ...(t === "columns" ? { flexGrow: 0, flexBasis: "auto" } : {}) } }, children: [] });
const parentNode = (t, k, s) => {
  const styles = { desktop: s.st, ...(s.tablet ? { tablet: s.tablet } : {}), ...(s.mobile ? { mobile: s.mobile } : {}) };
  const id = `${code(t, k)}p`.padEnd(12, "0");
  const kids = [0, 1, 2].map((j) => ({ ...kid(t, k, j, s.tall), children: [{ id: `${code(t, k)}t${j}`.padEnd(12, "0"), type: "text", props: { html: `<p>${j}</p>` } }] }));
  const type = t === "section" ? "layout" : t === "nested" || t === "container" ? "container" : t;
  if (t === "section") return { id: `sect${code(t, k)}`.padEnd(11, "0"), type: "layout", styles, children: kids };
  const node = { id, type, ...(type === "container" ? { props: { full: true } } : {}), styles, children: kids };
  return t === "nested" ? { id: `${code(t, k)}o`.padEnd(12, "0"), type: "container", props: { full: true }, children: [node] } : node;
};
const NAMES = Object.keys(SC);

describe("contrat de mise en page : le parent met en page ses enfants directs (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, ctx;
  const pages = {};
  const measure = (win, t) => { const rect = (id) => { const e = document.querySelector(`.kw-n-${id}`) || win.document.querySelector(`.kw-n-${id}`); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right }; }; return rect; };
  void measure;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    for (const t of TYPES) {
      const pageId = Number((await boss.post("/marketing/pages", { name: `Contrat ${t}` })).location.match(/(\d+)$/)[1]);
      const rev = srv.db().prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
      const sections = NAMES.map((n, k) => {
        const p = parentNode(t, k, SC[n]);
        return t === "section" ? p : { id: `sect${k.toString(36)}`.padEnd(11, "0"), type: "layout", children: [p] };
      });
      const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } }, headers: { Origin: srv.base } });
      assert.equal(put.status, 200, `${t} : ${put.text.slice(0, 300)}`);
      assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {} })).status, 200);
      pages[t] = { id: pageId, slug: srv.db().prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug };
    }
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  const read = async (t, width) => {
    const p = await ctx.newPage(); await p.setViewportSize({ width, height: 900 });
    await p.goto(`${srv.base}/p/${pages[t].slug}`); await p.waitForTimeout(300);
    const data = await p.evaluate(([t, names]) => {
      const code = (t, k) => `${t[0]}${t === "nested" ? "n" : t === "columns" ? "c" : t === "stack" ? "s" : t === "group" ? "g" : t === "section" ? "x" : "k"}${k.toString(36)}`;
      const box = (id) => { const e = document.querySelector(`.kw-n-${id}`); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, r: r.right }; };
      const out = {};
      names.forEach((n, k) => { const base = code(t, k); out[n] = { parent: box(t === "section" ? `sect${base}`.padEnd(11, "0") : `${base}p`.padEnd(12, "0")), kids: [0, 1, 2].map((j) => box(`${base}q${j}`.padEnd(12, "0"))) }; });
      return out;
    }, [t, NAMES]);
    await p.close();
    return data;
  };
  const eq = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
  const CHECK = {
    row: (p, k) => k[0].x < k[1].x && k[1].x < k[2].x && eq(k[0].y, k[2].y),
    column: (p, k) => eq(k[0].x, k[2].x) && k[0].y < k[1].y && k[1].y < k[2].y,
    rowReverse: (p, k) => k[0].x > k[1].x && k[1].x > k[2].x && eq(k[0].y, k[2].y),
    columnReverse: (p, k) => eq(k[0].x, k[2].x) && k[0].y > k[1].y && k[1].y > k[2].y,
    wrap: (p, k) => eq(k[0].y, k[1].y) && k[2].y > k[0].y + 10,
    center: (p, k) => eq(k[0].x - p.x, (p.w - 3 * KIDS_W) / 2),
    between: (p, k) => eq(k[2].r, p.r) && eq(k[0].x, p.x),
    alignCenter: (p, k) => eq(k[0].y - p.y, 20) && eq(k[1].y, p.y),
    gap: (p, k) => eq(k[1].x - (k[0].x + KIDS_W), 40) && eq(k[2].x - (k[1].x + KIDS_W), 40),
    grid3: (p, k) => eq(k[0].y, k[1].y) && eq(k[1].y, k[2].y) && k[0].x < k[1].x && k[1].x < k[2].x,
    grid2: (p, k) => eq(k[0].y, k[1].y) && k[2].y > k[0].y + 10 && eq(k[2].x, k[0].x),
  };
  const meets = (rule, p, k) => ({ row: CHECK.row, column: CHECK.column, rowReverse: CHECK.rowReverse, columnReverse: CHECK.columnReverse })[rule] ? ({ row: CHECK.row, column: CHECK.column, rowReverse: CHECK.rowReverse, columnReverse: CHECK.columnReverse })[rule](p, k) : CHECK[rule](p, k);

  for (const t of TYPES) {
    test(`${t === "section" ? "Section libre" : t === "nested" ? "Conteneur imbriqué" : t === "container" ? "Conteneur" : t === "group" ? "Groupe" : t === "stack" ? "Pile" : "Colonnes"} : flex (4 directions, retour à la ligne, répartition, alignement, écart), grille et valeurs par écran`, async () => {
      const bad = [];
      for (const width of [1280, 900, 390]) {
        const d = await read(t, width);
        NAMES.forEach((n) => {
          const sc = SC[n], rule = sc.at[width];
          if (!rule) return;
          const { parent, kids } = d[n];
          if (!parent || kids.some((x) => !x)) { bad.push(`${n}@${width} : élément absent`); return; }
          if (!meets(rule, parent, kids)) bad.push(`${n}@${width} (${rule}) : enfants ${kids.map((x) => `${Math.round(x.x - parent.x)},${Math.round(x.y - parent.y)}`).join(" | ")}`);
        });
      }
      assert.deepEqual(bad, [], bad.join("  ·  "));
    });
  }
});
