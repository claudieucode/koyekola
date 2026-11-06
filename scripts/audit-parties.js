// Audit des PARTIES (sous-éléments) des éléments : pour chaque partie déclarée dans pages/parts.js qui accepte la typographie ou la couleur, on règle « couleur » et « taille de police »
// sur la partie (comme dans le panneau Style → Partie), on publie, puis on mesure dans Chrome le style calculé de TOUS les éléments que la partie désigne.
// Usage : node scripts/audit-parties.js <fichier JSON de sortie> [types,…]
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const nodes = require(path.join(REPO, "src/marketing/pages/nodes.js"));
const { PARTS } = require(path.join(REPO, "src/marketing/pages/parts.js"));
const OUT = process.argv[2] || ".audit-parties.json";
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db(); const ORIGIN = { Origin: srv.base };
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit parties" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const specTypes = Object.fromEntries(nodes.editorSpec().types.map((t) => [t.type, t]));
  const report = [];
  for (const [type, defs] of Object.entries(PARTS)) {
    if (ONLY && !ONLY.includes(type)) continue;
    const t = specTypes[type]; if (!t) continue;
    const blank = t.blank || {};
    const parts = {};
    for (const [key, def] of Object.entries(defs)) {
      const g = def.groups || {}; const st = {};
      if (g.typography) st.fontSize = "31px";
      if (g.color && (g.color === true || (Array.isArray(g.color) && g.color.includes("color")))) st.color = "#c0392b";
      if (Object.keys(st).length) parts[key] = { styles: { desktop: st } };
    }
    if (!Object.keys(parts).length) continue;
    const id = "prt000000001";
    const node = { id, type, props: JSON.parse(JSON.stringify(blank.props || {})), children: JSON.parse(JSON.stringify(blank.children || [])), styles: { desktop: { ...((blank.styles || {}).desktop || {}) } }, parts };
    const pid = Number((await boss.post("/marketing/pages", { name: `P ${type}`, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    const put = await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: ORIGIN, json: { revision: rev, content: { title: type, sections: [{ id: "sect00000001", type: "layout", children: [node] }] } } });
    if (put.status !== 200) { report.push({ type, error: `brouillon ${put.status} ${String(put.text).slice(0, 140)}` }); continue; }
    const pub = await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: ORIGIN });
    if (pub.status !== 200) { report.push({ type, error: `publication ${pub.status}` }); continue; }
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pid).slug;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const pg = await ctx.newPage();
    try {
      await pg.goto(`${srv.base}/p/${slug}`, { waitUntil: "load", timeout: 60000 }); await pg.waitForTimeout(250);
      const res = await pg.evaluate(({ id, defs, parts }) => {
        const out = {};
        for (const [key, set] of Object.entries(parts)) {
          const els = [...document.querySelectorAll(`.kw-node.kw-n-${id} ${defs[key].select}`)];
          const st = set.styles.desktop;
          const bad = els.filter((e) => { const cs = getComputedStyle(e); return (st.fontSize && cs.fontSize !== st.fontSize) || (st.color && cs.color !== "rgb(192, 57, 43)"); }).map((e) => e.tagName.toLowerCase() + "." + String(e.className).split(" ")[0]);
          out[key] = { matched: els.length, bad: bad.slice(0, 3), badCount: bad.length };
        }
        return out;
      }, { id, defs: Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, { select: d.select }])), parts });
      report.push({ type, parts: res });
    } catch (e) { report.push({ type, error: String(e.message || e).slice(0, 140) }); }
    await ctx.close();
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(OUT, JSON.stringify(report, null, 1));
  let n = 0, nomatch = 0, bad = 0;
  for (const e of report) for (const r of Object.values(e.parts || {})) { n++; if (!r.matched) nomatch++; else if (r.badCount) bad++; }
  console.log(`Types : ${report.length} ; parties : ${n} ; sans élément (contenu vide) : ${nomatch} ; réglage sans effet : ${bad} ; erreurs : ${report.filter((e) => e.error).length}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
