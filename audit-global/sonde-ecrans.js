// Palier 24 — parcours de TOUS les écrans d'administration (GET) par le compte créateur d'un serveur de test jetable : codes 5xx, mentions « bientôt »,
// commandes désactivées, liens « # », données fictives évidentes. Lecture seule (aucune écriture, base temporaire).
const fs = require("fs");
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor } = require("../tests/helpers");
const routes = JSON.parse(fs.readFileSync(process.env.TMPDIR + "/routes.json", "utf8")).filter((r) => r.f.startsWith("src/marketing/web/") && r.m === "get" && r.p.startsWith("/") && !r.p.includes("${") && !/^\/(:key|preferences|groupes\/.*)?$/.test(r.p) && !/(public|tracking|visitorsPublic|formsPublic|smsPublic|socialPublic|surveysPublic|webhooks|rss)\.js$/.test(r.f) && !/export|\.json|\.csv|fichier|apercu|telecharger/.test(r.p));
const fill = (p) => p.replace(/:(\w+)\(([^)]*)\)/g, (_, n, re) => (/\|/.test(re) ? re.split("|")[0] : "1")).replace(/:type/g, "page").replace(/:key/g, "viewer").replace(/:(\w+)/g, "1");
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); const boss = await loginInstructor(srv);
  const out = []; const seen = new Set();
  for (const r of routes) {
    const path = "/marketing" + fill(r.p); if (seen.has(path)) continue; seen.add(path);
    let res; try { res = await boss.get(path); } catch (e) { out.push({ path, status: "ERR", note: String(e.message).slice(0, 60) }); continue; }
    const t = strip(res.text);
    out.push({ path, status: res.status, soon: [...new Set([...t.matchAll(/bient[ôo]t|prochain palier|à venir|prochainement|lorem ipsum|exemple fictif|donn[ée]es? de d[ée]monstration|simulé/gi)].map((m) => m[0].toLowerCase()))], disabled: (res.text.match(/<(button|input|select)[^>]*\sdisabled[\s>]/g) || []).length, hash: (res.text.match(/<a [^>]*href="#"/g) || []).length, file: r.f.replace("src/marketing/web/", "") });
  }
  fs.writeFileSync(__dirname + "/resultats/ecrans.json", JSON.stringify(out, null, 1));
  const by = {}; for (const o of out) by[o.status] = (by[o.status] || 0) + 1;
  console.log("écrans parcourus:", out.length, JSON.stringify(by));
  console.log("5xx / erreurs:", out.filter((o) => String(o.status).startsWith("5") || o.status === "ERR").map((o) => `${o.status} ${o.path}`).join("\n  ") || "aucun");
  console.log("mentions « bientôt / simulé… »:", out.filter((o) => o.soon && o.soon.length).map((o) => `${o.path} [${o.soon.join(",")}]`).join("\n  ") || "aucune");
  console.log("liens href=\"#\":", out.filter((o) => o.hash).map((o) => `${o.path} (${o.hash})`).join(", ") || "aucun");
  await srv.stop();
})().catch((e) => { console.error(e); process.exit(1); });
