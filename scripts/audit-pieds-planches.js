// Planches de contrôle visuel : assemble les captures de scripts/audit-pieds.js en planches (N modèles par planche) pour une relecture par lots.
// Usage : node scripts/audit-pieds-planches.js <dossier des captures> <largeur: desktop|tablette|mobile> [modèles par planche = 10]
const path = require("path"), fs = require("fs");
let chromium; try { ({ chromium } = require("playwright-core")); } catch { console.error("playwright-core absent"); process.exit(2); }
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dir = path.resolve(process.argv[2] || "."), vp = process.argv[3] || "desktop", per = Number(process.argv[4]) || 10;
const files = fs.readdirSync(dir).filter((f) => f.endsWith(`.${vp}.png`)).sort();
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const cols = vp === "mobile" ? 5 : 1, w = vp === "mobile" ? 260 : 1000;
  for (let i = 0; i * per < files.length; i++) {
    const part = files.slice(i * per, (i + 1) * per);
    const html = `<body style="margin:0;background:#cbd5e1;font:12px system-ui"><div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:14px;padding:10px">${part.map((f) => `<figure style="margin:0"><figcaption style="padding:2px 0;font-weight:700">${f.replace(`.${vp}.png`, "")}</figcaption><img style="width:${w}px;display:block;border:1px solid #64748b" src="file://${path.join(dir, f)}"></figure>`).join("")}</div></body>`;
    const out = path.join(dir, `planche-${vp}-${String(i + 1).padStart(2, "0")}.html`);
    fs.writeFileSync(out, html);
    const pg = await browser.newPage({ viewport: { width: cols * (w + 14) + 20, height: 600 } });
    await pg.goto("file://" + out, { waitUntil: "load" });
    await pg.screenshot({ path: out.replace(".html", ".png"), fullPage: true });
    await pg.close(); fs.unlinkSync(out);
  }
  await browser.close();
  console.log(`${Math.ceil(files.length / per)} planches`);
})();
