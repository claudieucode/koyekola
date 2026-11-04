// Contrôle visuel par lots des 100 pieds de page du Theme Builder (aperçu réel du catalogue) : 3 largeurs (1280 / 820 / 390 px), capture + mesures
// (débordement horizontal, chevauchements, éléments hors écran, contraste WCAG < 3, colonnes de hauteur nulle), rapport JSON + synthèse texte.
// Usage : node scripts/audit-pieds.js <dossier de sortie> [clé-de-modèle,famille,…]
// Prérequis : playwright-core (`npm i --no-save playwright-core`) et Chrome (CHROME_PATH). TEST_START_TIMEOUT_MS=900000 si le disque est lent.
const path = require("path"), fs = require("fs");
const REPO = path.join(__dirname, "..");
const { startServer, loginInstructor } = require(path.join(REPO, "tests/helpers"));
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent : npm i --no-save playwright-core"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const Catalog = require(path.join(REPO, "src/themeBuilder/catalog"));
const { TEST_KEY } = require(path.join(REPO, "tests/marketing-helpers"));

const OUT = process.argv[2] || path.join(require("os").tmpdir(), "audit-pieds");
const ONLY = process.argv[3] ? process.argv[3].split(",") : null;
const VPS = [["desktop", 1280, 800], ["tablette", 820, 900], ["mobile", 390, 800]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv);
  const site = Number((await boss.post("/marketing/site-web/sites", { name: "Audit pieds" })).location.match(/sites\/(\d+)/)[1]);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const report = [];
  const entries = Catalog.entries("footer").filter((e) => !ONLY || ONLY.includes(e.layoutId) || ONLY.includes(e.layoutKey) || ONLY.includes(e.key));
  for (const [vname, w, h] of VPS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addCookies([...boss.cookies].map(([n, v]) => ({ name: n, value: v, url: srv.base })));
    const pg = await ctx.newPage();
    const errors = [];
    pg.on("pageerror", (e) => errors.push(e.message));
    for (const e of entries) {
      const url = `${srv.base}/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/footer/${e.key}/apercu`;
      const r = { key: e.key, name: e.name, family: e.layoutKey, vp: vname };
      try {
        await pg.goto(url, { waitUntil: "load" });
        const m = await pg.evaluate(() => {
          const root = document.querySelector(".kw-theme-part");
          if (!root) return { missing: true };
          const vis = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0" && !(el.closest("details:not([open])") && el.tagName !== "SUMMARY" && !el.closest("summary")); };
          const SEL = "a,button,img,input,p,span,h1,h2,h3,svg,iframe";
          const leaves = [...root.querySelectorAll(SEL)].filter((el) => vis(el) && !(el.parentElement && el.parentElement.closest(SEL) && root.contains(el.parentElement.closest(SEL))));
          const rects = leaves.map((el) => { const r = el.getBoundingClientRect(); return { t: el.tagName, x: r.left, y: r.top, w: r.width, h: r.height, txt: (el.textContent || "").trim().slice(0, 24) }; });
          const overlaps = [];
          for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i], b = rects[j];
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            if (ox > 3 && oy > 3) overlaps.push(`${a.t}"${a.txt}"×${b.t}"${b.txt}"`);
          }
          const out = rects.filter((r) => r.x < -1 || r.x + r.w > innerWidth + 1).map((r) => `${r.t}"${r.txt}"`);
          const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(",").map((x) => parseFloat(x)); return { r, g, b, a }; };
          const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
          const bgOf = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.85) return c; } return { r: 255, g: 255, b: 255, a: 1 }; };
          const low = [];
          for (const el of root.querySelectorAll("a,button,p,span,h1,h2,h3,label,li")) {
            if (!vis(el) || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            const fg = parse(getComputedStyle(el).color), bg = bgOf(el); if (!fg) continue;
            const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
            if (ratio < 3) low.push(`${(el.textContent || "").trim().slice(0, 18)} ${ratio.toFixed(1)}`);
          }
          const rb = root.getBoundingClientRect();
          // la zone de contenu (1180 px max) est centrée : ses bords gauche et droit doivent être symétriques
          const inner = root.querySelector("[class*='kw-container'] [class*='kw-container']") || null;
          return { low: low.slice(0, 4), scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, height: Math.round(rb.height), top: Math.round(rb.top), items: rects.length, overlaps: overlaps.slice(0, 4), outside: out.slice(0, 4), hasInner: !!inner,
            logo: !!root.querySelector("img, [class*='logo']"), menu: !!root.querySelector("nav, [class*='menu']") };
        });
        Object.assign(r, m);
        await pg.screenshot({ path: path.join(OUT, `${e.key}.${vname}.png`), clip: { x: 0, y: Math.max(0, (m.top || 0) - 6), width: w, height: Math.min(1400, Math.max(80, (m.height || 80) + 12)) }, fullPage: true });
      } catch (err) { r.error = String(err.message).slice(0, 160); }
      report.push(r);
    }
    if (errors.length) report.push({ vp: vname, pageErrors: errors.slice(0, 5) });
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 1));
  const bad = report.filter((r) => r.key && (r.error || r.missing || (r.scrollW - r.clientW > 1) || (r.overlaps && r.overlaps.length) || (r.outside && r.outside.length) || (r.low && r.low.length) || r.height < 20));
  const lines = [`Pieds contrôlés : ${new Set(report.filter((r) => r.key).map((r) => r.key)).size} × ${VPS.length} largeurs = ${report.filter((r) => r.key).length} mesures`, `Mesures avec défaut : ${bad.length}`];
  for (const r of bad) lines.push(`- ${r.key} [${r.vp}] ${r.error || (r.missing ? "partie absente" : "")} ${r.scrollW - r.clientW > 1 ? `débordement ${r.scrollW - r.clientW}px ` : ""}${r.overlaps && r.overlaps.length ? `chevauchement ${r.overlaps.join(" | ")} ` : ""}${r.outside && r.outside.length ? `hors écran ${r.outside.join(" | ")} ` : ""}${r.low && r.low.length ? `contraste ${r.low.join(" | ")}` : ""}`);
  fs.writeFileSync(path.join(OUT, "synthese.txt"), lines.join("\n"));
  console.log(lines.join("\n"));
  await srv.stop();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
