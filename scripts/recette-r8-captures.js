#!/usr/bin/env node
// Recette R8 — photographies HTTP du comportement public, avant / après, pour comparer le site principal (inchangé attendu) et un domaine secondaire de test.
//   node scripts/recette-r8-captures.js capture <urlDeBase> <sortie.json> --host <hôte> [--host <hôte2>…] [--path /x …]
//   node scripts/recette-r8-captures.js comparer <avant.json> <apres.json> [--hote-principal <hôte>]
// <urlDeBase> = adresse locale de l'instance de recette (ex. http://127.0.0.1:3100) ; --host = en-tête Host envoyé (aucun accès à Internet, aucune écriture).
// Relevé par hôte et par chemin : statut, Location, X-Robots-Tag, robots.txt (texte), plan du site (ensemble d'adresses), et pour les pages HTML : <title>, canonical, meta robots, og:url, nom de l'Organisation (JSON-LD).
const fs = require("node:fs");
const http = require("node:http");
const out = (t) => fs.writeSync(1, `${t}\n`);
const err = (t) => fs.writeSync(2, `${t}\n`);
const args = process.argv.slice(2);
const cmd = args[0];
const multi = (flag) => args.flatMap((a, i) => (a === flag ? [args[i + 1]] : []));
const DEFAULT_PATHS = ["/", "/blog", "/catalogue", "/a-propos", "/faq", "/contact", "/robots.txt", "/sitemap.xml", "/page-introuvable-recette"];

function get(base, host, p) {
  const u = new URL(base);
  return new Promise((resolve, reject) => {
    http.request({ host: u.hostname, port: u.port, path: p, headers: { Host: host }, method: "GET", timeout: 20000 }, (r) => { let t = ""; r.setEncoding("utf8"); r.on("data", (d) => (t += d)); r.on("end", () => resolve({ status: r.statusCode, headers: r.headers, text: t })); }).on("error", reject).end();
  });
}
const attr = (html, re) => { const m = re.exec(html); return m ? m[1] : null; };
function shape(p, r) {
  const o = { status: r.statusCode ?? r.status, location: r.headers.location || null, xRobots: r.headers["x-robots-tag"] || null };
  if (p === "/robots.txt") o.robots = r.text.replace(/\r/g, "").trim();
  else if (p === "/sitemap.xml") o.sitemap = [...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  else if (/text\/html/.test(r.headers["content-type"] || "") && r.status === 200) {
    o.title = attr(r.text, /<title>([^<]*)<\/title>/); o.canonical = attr(r.text, /<link rel="canonical" href="([^"]+)"/); o.metaRobots = attr(r.text, /<meta name="robots" content="([^"]+)"/); o.ogUrl = attr(r.text, /<meta property="og:url" content="([^"]+)"/);
    const names = [...r.text.matchAll(/"@type":"(?:Organization|EducationalOrganization)"[^}]*?"name":"([^"]+)"/g)].map((m) => m[1]); o.organisation = names.length ? names : null;
  }
  return o;
}
(async () => {
  if (cmd === "capture") {
    const [, base, file] = args; const hosts = multi("--host"); const paths = multi("--path").length ? multi("--path") : DEFAULT_PATHS;
    if (!base || !file || !hosts.length) { err("Usage : capture <urlDeBase> <sortie.json> --host <hôte> [--host …] [--path …]"); process.exitCode = 2; return; }
    const res = {};
    for (const h of hosts) { res[h] = {}; for (const p of paths) { const r = await get(base, h, p); res[h][p] = shape(p, { statusCode: r.status, status: r.status, headers: r.headers, text: r.text }); } }
    fs.writeFileSync(file, JSON.stringify(res, null, 1)); out(`${hosts.length} hôte(s) × ${paths.length} chemin(s) → ${file}`); return;
  }
  if (cmd === "comparer") {
    const [, fa, fb] = args; if (!fa || !fb) { err("Usage : comparer <avant.json> <apres.json> [--hote-principal <hôte>]"); process.exitCode = 2; return; }
    const A = JSON.parse(fs.readFileSync(fa, "utf8")), B = JSON.parse(fs.readFileSync(fb, "utf8"));
    const diffs = [];
    for (const h of new Set([...Object.keys(A), ...Object.keys(B)])) for (const p of new Set([...Object.keys(A[h] || {}), ...Object.keys(B[h] || {})])) {
      const a = (A[h] || {})[p], b = (B[h] || {})[p];
      if (JSON.stringify(a) !== JSON.stringify(b)) diffs.push(`${h}${p}\n    avant : ${JSON.stringify(a)}\n    après : ${JSON.stringify(b)}`);
    }
    out(diffs.length ? `${diffs.length} DIFFÉRENCE(S) :\n${diffs.join("\n")}` : "Aucune différence."); process.exitCode = diffs.length ? 1 : 0; return;
  }
  err("Usage : node scripts/recette-r8-captures.js <capture|comparer> …"); process.exitCode = 2;
})().catch((e) => { err(e.message); process.exitCode = 1; });
