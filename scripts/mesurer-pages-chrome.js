#!/usr/bin/env node
// Mesure le débordement horizontal de pages « hôte » déjà générées (dossier html/*.host.html) dans un vrai Chrome, avec arrêt forcé de chaque Chrome au bout de 90 s
// et résultats écrits au fur et à mesure (resultats.jsonl). Usage : node scripts/mesurer-pages-chrome.js <dossier-html> [parallélisme]
const fs = require("node:fs"), path = require("node:path"), { spawn } = require("node:child_process");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const dir = path.resolve(process.argv[2]), N = Number(process.argv[3]) || 3;
const out = path.join(dir, "..", "resultats.jsonl");
const done = new Set(fs.existsSync(out) ? fs.readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).file) : []);
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".host.html") && !done.has(f));
const size = { desktop: [1280, 900], tablette: [820, 1100], mobile: [390, 900] };
const measure1 = (f, timeoutMs) => new Promise((resolve) => {
  const [, , name] = /^(.*)\.(desktop|tablette|mobile)\.host\.html$/.exec(f).slice(0, 3).concat(/\.(desktop|tablette|mobile)\./.exec(f)[1]);
  const w = size[name][0], h = size[name][1];
  const c = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox", `--window-size=${Math.max(w, 500)},${h}`, "--virtual-time-budget=2500", "--dump-dom", `file://${path.join(dir, f)}`], { stdio: ["ignore", "pipe", "ignore"], detached: true });
  let buf = ""; c.stdout.on("data", (d) => (buf += d));
  let ended = false;
  const finish = (err) => { if (ended) return; ended = true; clearTimeout(t); try { process.kill(-c.pid, "SIGKILL"); } catch {} const m = buf.match(/<title>RESULT:(\{.*?\})<\/title>/); let r = { file: f, size: name, error: err || "mesure indisponible" };
    if (m) { const v = JSON.parse(m[1]); r = { file: f, size: name, scrollWidth: v.sw, innerWidth: v.iw, overflowX: v.sw > v.iw + 1, outside: v.out, first: v.first }; } resolve(r); };
  const t = setTimeout(() => finish("délai dépassé"), timeoutMs);
  c.on("close", () => finish(null));
});
// Jusqu'à 3 essais par page (un Chrome peut rester bloqué quand la machine est chargée) ; seul le dernier résultat est écrit
const measure = async (f) => { let r; for (let i = 0; i < 3; i++) { r = await measure1(f, 100000 + i * 40000); if (!r.error) break; } fs.appendFileSync(out, JSON.stringify(r) + "\n"); return r; };
(async () => { const q = files.slice(); let n = 0; await Promise.all(Array.from({ length: N }, async () => { while (q.length) { await measure(q.shift()); if (++n % 10 === 0) console.error(`${n}/${files.length}`); } }));
  const all = fs.readFileSync(out, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const bad = all.filter((r) => r.error || r.overflowX || r.outside > 0);
  console.log(JSON.stringify({ measures: all.length, defective: bad.length })); bad.forEach((b) => console.log("DEFAUT", b.file, b.error || `sw=${b.scrollWidth}/${b.innerWidth} hors=${b.outside} ${JSON.stringify(b.first)}`)); })();
