#!/usr/bin/env node
// Vérification visuelle de la bibliothèque « Résultats de recherche » du Theme Builder, dans un vrai Chrome (sans bibliothèque de test navigateur) :
// pour CHAQUE modèle et à trois largeurs (desktop 1280, tablette 820, mobile 390) → mesure le débordement horizontal et les éléments qui sortent de l'écran, et enregistre une capture.
// Usage : node scripts/verification-visuelle-recherche.js [dossier-de-sortie] [--captures=toutes|aucune]   (Chrome requis ; serveur de test démarré puis arrêté)
const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
const Catalog = require("../src/themeBuilder/catalog");

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = path.resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "verification-recherche");
// Mesures : TOUS les modèles aux 3 largeurs. Captures : un échantillon (1 modèle sur 7) par défaut, tous avec --captures=toutes, aucun avec --captures=aucune.
const CAP = (process.argv.find((a) => a.startsWith("--captures=")) || "--captures=echantillon").split("=")[1];
const SIZES = [["desktop", 1280, 900], ["tablette", 820, 1100], ["mobile", 390, 900]];
const PROBE = `<script>addEventListener("load",function(){setTimeout(function(){var de=document.documentElement,o=[];document.querySelectorAll("body *").forEach(function(e){var b=e.getBoundingClientRect(),s=getComputedStyle(e);if(b.width>0&&b.right>innerWidth+1&&s.position!=="fixed"&&e.closest("svg")===null)o.push((e.className&&e.className.toString()||e.tagName).slice(0,50))});(window.parent!==window?parent.document:document).title="RESULT:"+JSON.stringify({sw:de.scrollWidth,iw:innerWidth,sh:de.scrollHeight,out:o.length,first:o.slice(0,3)})},400)})</script>`;
const run = (args) => new Promise((resolve) => execFile(CHROME, args, { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }, (e, out) => resolve(String(out || ""))));
async function pool(items, n, fn) { const q = items.slice(); const res = []; await Promise.all(Array.from({ length: n }, async () => { while (q.length) { const it = q.shift(); res.push(await fn(it)); } })); return res; }

(async () => {
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.join(OUT, "html"), { recursive: true }); fs.mkdirSync(path.join(OUT, "captures"), { recursive: true });
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  try {
    const boss = await loginInstructor(srv);
    const site = Number((await boss.post("/marketing/site-web/sites", { name: "Verification recherche" })).location.match(/(\d+)$/)[1]);
    const keys = Catalog.entries("search_results").map((e) => e.key);
    const jobs = [];
    for (const key of keys) {
      const r = await boss.get(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/bibliotheque/search_results/${key}/apercu`);
      if (r.status !== 200) { jobs.push({ key, error: `HTTP ${r.status}` }); continue; }
      const html = r.text.replace("<head>", `<head><base href="${srv.base}/">`).replace("</body>", `${PROBE}</body>`);
      const file = path.join(OUT, "html", `${key}.html`); fs.writeFileSync(file, html);
      for (const [name, w, h] of SIZES) {
        // Page hôte : le modèle (srcdoc, même origine) dans un cadre de largeur EXACTE ; les requêtes d'écran (responsive) suivent la largeur du cadre
        const host = path.join(OUT, "html", `${key}.${name}.host.html`);
        fs.writeFileSync(host, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888"><iframe style="width:${w}px;height:${h}px;border:0;display:block;background:#fff" srcdoc="${html.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe></body>`);
        jobs.push({ key, file: host, name, w, h });
      }
    }
    const results = await pool(jobs.filter((j) => !j.error), 6, async (j) => {
      const base = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox", `--window-size=${Math.max(j.w, 500)},${j.h}`, "--virtual-time-budget=1500"];
      const dom = await run([...base, "--dump-dom", `file://${j.file}`]);
      const m = dom.match(/<title>RESULT:(\{.*?\})<\/title>/);
      let r = { key: j.key, size: j.name, error: "mesure indisponible" };
      if (m) { const v = JSON.parse(m[1]); r = { key: j.key, size: j.name, width: j.w, scrollWidth: v.sw, overflowX: v.sw > v.iw + 1, outside: v.out, firstOutside: v.first, height: v.sh }; }
      if (CAP === "toutes" || (CAP === "echantillon" && keys.indexOf(j.key) % 7 === 0)) await run([...base, `--screenshot=${path.join(OUT, "captures", `${j.key}.${j.name}.png`)}`, `file://${j.file}`]);
      return r;
    });
    const bad = results.filter((r) => r.error || r.overflowX || r.outside > 0);
    const report = { generated: new Date().toISOString(), models: keys.length, measures: results.length, defective: bad.length, errors: jobs.filter((j) => j.error), details: bad };
    fs.writeFileSync(path.join(OUT, "rapport.json"), JSON.stringify({ ...report, all: results }, null, 1));
    console.log(JSON.stringify({ models: report.models, measures: report.measures, defective: report.defective, errors: report.errors.length }));
    for (const b of bad.slice(0, 40)) console.log("DEFAUT", b.key, b.size, b.error || `scrollWidth=${b.scrollWidth} hors-ecran=${b.outside} ${JSON.stringify(b.firstOutside || [])}`);
  } finally { await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
