#!/usr/bin/env node
// Contrôle d'INDÉPENDANCE GRAPHIQUE des modèles « Page individuelle » : chaque modèle est affiché dans un vrai Chrome sur un site dont la charte (couleurs, polices, rayons) est
// modifiée entre deux mesures ; tout élément du modèle dont le style calculé (couleur du texte, fond, bordures, famille de police, rayon) change est une FUITE de la charte du site.
// Usage : node scripts/audit-page-individuelle-isolement.js [sortie.json] ; env ONLY=cle1,cle2 ; KW_SINGLE_PAGE_V2=1 pour la bibliothèque v2 en construction.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));
const { chromium } = require("playwright-core");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TYPE = process.env.TYPE || "single_page";
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const T1 = { colors: { primary: "#ff0000", secondary: "#00aa00", accent: "#0000ff", background: "#ffff00", surface: "#00ffff", text: "#ff00ff", muted: "#880000", success: "#008800", warning: "#888800", error: "#000088" }, fonts: { heading: "georgia", body: "georgia", button: "georgia", link: "georgia" }, radius: { sm: 0, md: 0, lg: 0, button: 0, field: 0, card: 0 } };
const T2 = { colors: { primary: "#111111", secondary: "#222222", accent: "#333333", background: "#444444", surface: "#555555", text: "#666666", muted: "#777777", success: "#999999", warning: "#aaaaaa", error: "#bbbbbb" }, fonts: { heading: "mono", body: "mono", button: "mono", link: "mono" }, radius: { sm: 40, md: 40, lg: 40, button: 40, field: 40, card: 40 } };
const PROPS = ["color", "backgroundColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "fontFamily", "borderTopLeftRadius", "outlineColor", "textDecorationColor", "fill", "stroke"];
const snap = (props) => {
  const root = document.querySelector(".kw-theme-template") || document.body;
  const rows = [];
  for (const e of root.querySelectorAll("*")) {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    if (cs.display === "none") continue;
    const o = { tag: e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.split(" ").filter((c) => !c.startsWith("kw-n-")).slice(0, 2).join(".") : ""), vis: r.width > 0 && r.height > 0, txt: [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) };
    for (const p of props) o[p] = cs[p];
    rows.push(o);
  }
  return rows;
};
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KW_SINGLE_PAGE_V2: process.env.KW_SINGLE_PAGE_V2 || "" });
  const boss = await loginInstructor(srv), db = srv.db();
  const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const site = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site isolement', 'site-iso', '{}')").run(org).lastInsertRowid);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
  const page = await ctx.newPage();
  const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
  const keys = Catalog.entries(TYPE).map((e) => e.key).filter((k) => !ONLY || ONLY.some((o) => k.startsWith(o)));
  const out = [];
  const render = async (tokens, key) => {
    db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(tokens), site);
    await page.goto(`${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/${TYPE}/${key}/apercu`, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(500);
    return page.evaluate(snap, PROPS);
  };
  for (const key of keys) {
    try {
      const a = await render(T1, key), b = await render(T2, key);
      if (a.length !== b.length) { out.push({ key, leaks: [`structure différente (${a.length} / ${b.length} éléments)`] }); continue; }
      const leaks = new Map();
      a.forEach((x, i) => { const y = b[i]; if (!x.vis) return; for (const p of PROPS) if (x[p] !== y[p] && (x.txt || (p !== "color" && p !== "fontFamily"))) { const k = `${x.tag} ${p}`; if (!leaks.has(k)) leaks.set(k, `${x[p]} → ${y[p]}`); } });
      out.push({ key, leaks: [...leaks].map(([k, v]) => `${k} : ${v}`) });
    } catch (e) { out.push({ key, leaks: [`ERREUR ${String(e.message).slice(0, 100)}`] }); }
  }
  await browser.close(); db.close(); await srv.stop();
  fs.writeFileSync(process.argv[2] || ".audit-isolement.json", JSON.stringify(out, null, 1));
  const bad = out.filter((o) => o.leaks.length);
  console.log(`${out.length} modèles contrôlés, ${bad.length} avec fuite de la charte du site`);
  for (const b of bad.slice(0, 40)) console.log(`  ${b.key} : ${b.leaks.length} fuite(s) — ${b.leaks.slice(0, 4).join(" | ")}`);
  process.exit(bad.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
