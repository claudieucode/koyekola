#!/usr/bin/env node
// Santé du site en ligne : quelques pages clés doivent répondre vite et sans erreur. À lancer après chaque déploiement (ou à la demande).
//   node scripts/sante-site.js [https://kolakisa.com]
const base = (process.argv[2] || process.env.SITE_URL || "https://kolakisa.com").replace(/\/$/, "");
const pages = [
  ["/", 200], ["/connexion", 200], ["/catalogue", 200], ["/blog", 200], 
  ["/css/landing.css", 200], ["/js/landing.js", 200], ["/js/page-builder.js", 200],
];
const SEUIL_MS = 2500;
(async () => {
  let bad = 0;
  for (const [p, attendu] of pages) {
    const t0 = Date.now();
    try {
      const r = await fetch(base + p, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0 (controle-sante)" } });
      const ms = Date.now() - t0, ok = r.status === attendu && ms <= SEUIL_MS;
      if (!ok) bad++;
      console.log(`${ok ? "✔" : "✖"} ${p} → ${r.status} en ${ms} ms${r.status !== attendu ? ` (attendu ${attendu})` : ms > SEUIL_MS ? ` (plus de ${SEUIL_MS} ms)` : ""}`);
    } catch (e) { bad++; console.log(`✖ ${p} → injoignable (${e.message})`); }
  }
  console.log(bad ? `\n${bad} page(s) à vérifier.` : "\nLe site répond normalement.");
  process.exit(bad ? 1 : 0);
})();
