#!/usr/bin/env node
// Contrôles AVANT / APRÈS déploiement d'un site public — requêtes GET uniquement (aucune écriture, aucun compte), sortie jamais écrasée.
//   node scripts/r9/controles-deploiement.js capturer <https://domaine> <avant.json> [--path /x …]
//   node scripts/r9/controles-deploiement.js comparer <https://domaine> <avant.json> [--path /x …]     (recapture et compare ; code 1 au moindre écart sur les adresses publiques ou si /sante n'est pas « ok »)
// Relevé par adresse : statut, redirection, titre, canonical, meta robots, og:url ; pour robots.txt le texte, pour sitemap.xml l'ensemble des adresses. /sante doit répondre 200 « ok ».
const fs = require("node:fs");
const path = require("node:path");
const out = (t = "") => fs.writeSync(1, `${t}\n`), err = (t) => fs.writeSync(2, `${t}\n`);
const args = process.argv.slice(2); const [cmd, base, file] = args;
const multi = (n) => args.flatMap((a, i) => (a === n ? [args[i + 1]] : []));
const DEFAULT = ["/", "/blog", "/catalogue", "/a-propos", "/faq", "/contact", "/connexion", "/robots.txt", "/sitemap.xml", "/page-introuvable-controle"];
if (!["capturer", "comparer"].includes(cmd) || !base || !file) { err("Usage : controles-deploiement.js <capturer|comparer> <https://domaine> <fichier.json> [--path /x …]"); process.exit(2); }
let origin; try { origin = new URL(base); } catch { err("Adresse invalide."); process.exit(2); }
if (!["https:", "http:"].includes(origin.protocol)) { err("Seules les adresses http(s) sont acceptées."); process.exit(2); }
const attr = (html, re) => { const m = re.exec(html); return m ? m[1] : null; };
async function shot(p) {
  const r = await fetch(origin.origin + p, { method: "GET", redirect: "manual", headers: { "user-agent": "KOLAKISA-controle-deploiement (lecture seule)" }, signal: AbortSignal.timeout(20000) }).catch((e) => ({ error: e.message }));
  if (r.error) return { erreur: r.error };
  const text = await r.text(); const o = { statut: r.status, redirection: r.headers.get("location") || null };
  if (p === "/robots.txt") o.robots = text.replace(/\r/g, "").trim();
  else if (p === "/sitemap.xml") o.plan = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).sort();
  else if (/text\/html/.test(r.headers.get("content-type") || "") && r.status === 200) { o.titre = attr(text, /<title>([^<]*)<\/title>/); o.canonical = attr(text, /<link rel="canonical" href="([^"]+)"/); o.metaRobots = attr(text, /<meta name="robots" content="([^"]+)"/); o.ogUrl = attr(text, /<meta property="og:url" content="([^"]+)"/); }
  return o;
}
(async () => {
  const paths = [...new Set([...(multi("--path").length ? multi("--path") : DEFAULT)])]; const now = {};
  for (const p of paths) now[p] = await shot(p);
  const sante = await fetch(origin.origin + "/sante", { signal: AbortSignal.timeout(20000) }).then(async (r) => ({ statut: r.status, corps: (await r.text()).slice(0, 200) })).catch((e) => ({ erreur: e.message }));
  let santeOk = sante.statut === 200; try { const j = JSON.parse(sante.corps); if (j.statut && j.statut !== "ok") santeOk = false; } catch { /* corps non JSON */ }
  if (cmd === "capturer") {
    const dest = path.resolve(file); if (fs.existsSync(dest)) { err(`Refus d'écraser : ${dest}`); process.exit(2); }
    fs.writeFileSync(dest, JSON.stringify({ date: new Date().toISOString(), base: origin.origin, sante, pages: now }, null, 1)); out(`Capture : ${paths.length} adresse(s) · /sante ${sante.statut || sante.erreur} → ${dest}`); process.exit(santeOk ? 0 : 1);
  }
  const before = JSON.parse(fs.readFileSync(path.resolve(file), "utf8")); const diffs = [];
  for (const p of new Set([...Object.keys(before.pages), ...paths])) if (JSON.stringify(before.pages[p]) !== JSON.stringify(now[p])) diffs.push(`${p}\n    avant : ${JSON.stringify(before.pages[p])}\n    après : ${JSON.stringify(now[p])}`);
  out(`/sante : ${sante.statut || sante.erreur} ${santeOk ? "(ok)" : "(PROBLÈME)"}`); out(diffs.length ? `${diffs.length} DIFFÉRENCE(S) sur les adresses publiques :\n${diffs.join("\n")}` : `Aucune différence sur ${paths.length} adresse(s) publique(s).`);
  process.exit(diffs.length || !santeOk ? 1 : 0);
})().catch((e) => { err(e.message); process.exit(1); });
