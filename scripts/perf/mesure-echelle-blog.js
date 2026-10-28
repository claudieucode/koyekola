// Montée en charge des données du blog (TITAN XXXI) : mêmes pages publiques avec 50, 500 puis 2 000 articles publiés (insertion directe).
// Usage : node scripts/perf/mesure-echelle-blog.js [--tailles 50,500,2000] [--n 15]
"use strict";
const path = require("node:path");
const { startServer, Client, loginInstructor } = require("../../tests/helpers.js");
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const SIZES = String(arg("tailles", "50,500,2000")).split(",").map(Number), N = Number(arg("n", 15));
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "", KW_WRITE_BEHIND_MS: "2000", NODE_OPTIONS: `--require ${path.join(__dirname, "sonde-sql.js")}` });
  try {
    const boss = await loginInstructor(srv); const db = srv.db(); const anon = new Client(srv.base);
    const body = "<h2>Titre</h2>" + "<p>Un paragraphe de contenu réaliste pour le blog, avec assez de texte pour peser comme un vrai article. </p>".repeat(60);
    const author = db.prepare("SELECT id FROM users WHERE role = 'formateur'").get().id;
    let have = 0;
    const routes = ["/blog", "/blog?q=paragraphe", "/blog/feed.xml", "/sitemap.xml", "/blog?page=2", "/formateur/blog"];
    console.log("articles   " + routes.map((r) => r.padEnd(24)).join(""));
    for (const size of SIZES) {
      db.exec("BEGIN");
      const ins = db.prepare("INSERT INTO posts (slug, title, excerpt, content, content_format, category, tags, published, published_at, author_id, status) VALUES (?, ?, ?, ?, 'html', ?, ?, 1, datetime('now', ?), ?, 'published')");
      for (; have < size; have++) ins.run(`article-echelle-${have}`, `Article d'échelle ${have}`, "Un extrait court.", body, "Catégorie " + (have % 7), "a,b,c", `-${have} hours`, author);
      db.exec("COMMIT");
      // Articles insérés directement en base : le blog convertit leurs anciens textes catégorie/étiquettes en relations, 200 articles par passage
      // (taxonomy.reconcile) ; on passe jusqu'à ce que ce travail unique soit terminé, pour ne mesurer que le régime établi
      for (let k = 0; k < 40; k++) { const r = await fetch(srv.base + "/blog", { signal: AbortSignal.timeout(600000) }); await r.arrayBuffer(); if (Number(r.headers.get("x-q-count")) < 400 && k > 0) break; }
      const cells = [];
      for (const url of routes) {
        const client = url.startsWith("/formateur") ? boss : anon; const lat = [], qms = [];
        for (let i = 0; i < N + 2; i++) { const t = process.hrtime.bigint(); const r = await client.request(url); const ms = Number(process.hrtime.bigint() - t) / 1e6; if (i >= 2) { lat.push(ms); qms.push(Number(r.headers.get("x-q-ms")) || 0); } if (r.status !== 200 && i === 0) cells.push("!" + r.status); }
        cells.push(`${pct(lat, 50).toFixed(0)}/${pct(lat, 95).toFixed(0)} ms (SQL ${pct(qms, 50).toFixed(0)})`.padEnd(24));
      }
      console.log(String(size).padEnd(11) + cells.join(""));
    }
    db.close();
  } finally { await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
