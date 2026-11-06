// Audit des PROPRIÉTÉS de style des éléments du Page Builder / Theme Builder dans un vrai Chrome.
// Pour chaque type d'élément, plusieurs copies sont publiées sur une page de site ; chaque copie reçoit UNE propriété de texte réglée sur l'élément lui-même (comme dans le panneau
// « Style »). On mesure alors le style CALCULÉ de chaque texte visible dans l'élément : si le réglage n'atteint pas le texte (un style du site l'écrase), c'est un défaut.
// Usage : node scripts/audit-proprietes.js <fichier JSON de sortie> [types,séparés,par,des,virgules]
// Prérequis : playwright-core et Chrome (CHROME_PATH). TEST_START_TIMEOUT_MS élevé si la machine est chargée.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const nodes = require(path.join(REPO, "src/marketing/pages/nodes.js"));

const OUT = process.argv[2] || path.join(require("os").tmpdir(), "audit-proprietes.json");
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
// propriété → [valeur écrite, propriété CSS calculée, valeur attendue (normalisée par Chrome)]
const PROPS = {
  color: ["#c0392b", "color", "rgb(192, 57, 43)"],
  fontFamily: ["font.lora", "fontFamily", /lora/i],
  fontSize: ["31px", "fontSize", "31px"],
  fontWeight: ["800", "fontWeight", "800"],
  letterSpacing: ["3px", "letterSpacing", "3px"],
  lineHeight: ["2.2", "lineHeight", (v, fs) => Math.abs(parseFloat(v) / parseFloat(fs) - 2.2) < 0.05],
  textTransform: ["uppercase", "textTransform", "uppercase"],
};
const SKIP = new Set(["container", "columns", "column", "grid", "stack", "group", "spacer", "divider", "html", "embed", "lottie", "facebookembed", "map", "textpath", "readingprogress", "floatingbutton", "modal", "tooltip", "hotspot", "stripebutton", "paypalbutton", "sidebar"]);

(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db();
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit propriétés" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ORIGIN = { Origin: srv.base };
  const types = nodes.editorSpec().types.filter((t) => !SKIP.has(t.type) && (!ONLY || ONLY.includes(t.type)));
  const report = [];
  for (const t of types) {
    const blank = t.blank || {};
    const kids = Object.keys(PROPS).map((p, i) => {
      const id = `n${String(i).padStart(2, "0")}${t.type.replace(/[^a-z]/g, "").padEnd(8, "x").slice(0, 8)}`.slice(0, 12).padEnd(12, "0");
      return { prop: p, id, node: { id, type: t.type, props: JSON.parse(JSON.stringify(blank.props || {})), children: JSON.parse(JSON.stringify(blank.children || [])), styles: { desktop: { ...((blank.styles || {}).desktop || {}), [p]: PROPS[p][0] } } } };
    });
    const pid = Number((await boss.post("/marketing/pages", { name: `T ${t.type}`, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    const content = { title: t.type, sections: [{ id: "sect00000001", type: "layout", children: kids.map((k) => k.node) }] };
    const put = await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: ORIGIN, json: { revision: rev, content } });
    if (put.status !== 200) { report.push({ type: t.type, error: `brouillon ${put.status} ${String(put.text).slice(0, 200)}` }); continue; }
    const pub = await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: ORIGIN });
    if (pub.status !== 200) { report.push({ type: t.type, error: `publication ${pub.status}` }); continue; }
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pid).slug;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage();
    try {
      await pg.goto(`${srv.base}/p/${slug}`, { waitUntil: "load", timeout: 60000 });
      await pg.waitForTimeout(300);
      const res = await pg.evaluate(({ kids, props }) => {
        const out = {};
        const textLeaves = (root) => {
          const list = [];
          const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            if (!n.nodeValue.trim()) continue;
            const el = n.parentElement; if (!el || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue;
            const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
            if (r.width === 0 || r.height === 0 || cs.visibility === "hidden" || cs.display === "none") continue;
            if (!list.includes(el)) list.push(el);
          }
          return list;
        };
        for (const k of kids) {
          const root = document.querySelector(`.kw-n-${k.id}`);
          if (!root) { out[k.prop] = { missing: true }; continue; }
          const leaves = textLeaves(root);
          const [, css, want] = props[k.prop];
          const bad = [];
          for (const el of leaves) {
            const cs = getComputedStyle(el); const v = cs[css];
            const ok = want === "fn" ? false : null;
            bad.push({ el: `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`, v, fs: cs.fontSize });
          }
          out[k.prop] = { rootValue: getComputedStyle(root)[css], leaves: bad };
        }
        return out;
      }, { kids: kids.map((k) => ({ prop: k.prop, id: k.id })), props: Object.fromEntries(Object.entries(PROPS).map(([k, v]) => [k, [v[0], v[1], typeof v[2] === "function" ? "fn" : v[2] instanceof RegExp ? v[2].source : v[2]]])) });
      const entry = { type: t.type, props: {} };
      for (const [p, [, , want]] of Object.entries(PROPS)) {
        const r = res[p];
        if (!r || r.missing) { entry.props[p] = { status: "absent" }; continue; }
        const ok = (v, fsz) => (typeof want === "function" ? want(v, fsz) : want instanceof RegExp ? want.test(v) : v === want);
        const fails = r.leaves.filter((l) => !ok(l.v, l.fs));
        entry.props[p] = { status: r.leaves.length === 0 ? "sans-texte" : fails.length === 0 ? "ok" : "defaut", textes: r.leaves.length, echecs: fails.slice(0, 4) };
      }
      report.push(entry);
    } catch (e) { report.push({ type: t.type, error: String(e.message || e).slice(0, 160) }); }
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  const tot = {}; let defects = 0;
  for (const e of report) for (const [p, r] of Object.entries(e.props || {})) { tot[r.status] = (tot[r.status] || 0) + 1; if (r.status === "defaut") defects++; }
  console.log(`Types : ${report.length} ; résultats ${JSON.stringify(tot)} ; erreurs : ${report.filter((e) => e.error).length}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
