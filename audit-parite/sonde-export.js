// Sonde d'audit palier 23 — aller-retour export → import (serveur de test jetable).
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("../tests/helpers");
const log = (id, note) => console.log(id.padEnd(30), note);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db(); const M = "/marketing";
  const save = (c, f) => { const fd = new FormData(); Object.entries({ excerpt: "r", content_format: "html", status: "draft", ...f }).forEach(([k, v]) => fd.append(k, v)); return c.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
  await save(boss, { title: "Pour export", content: "<p>contenu</p>", status: "published", category: "Cat", tags: "t1" });
  await boss.post(`${M}/pages`, { name: "Page export", template: "" });
  await boss.post(`${M}/site-web/navigation/menus`, { name: "Menu export" });
  const ex = await boss.post(`${M}/site-web/outils/exporter`, { types: "pages,articles,menus,taxonomies,settings" }); const eid = Number(String(ex.location).match(/(\d+)$/)[1]);
  let file; for (let i = 0; i < 40; i++) { file = await boss.get(`${M}/site-web/outils/exporter/${eid}/fichier`); if (file.status === 200) break; await wait(500); }
  log("fichier d'export", `${file.status} ${file.headers.get("content-type")} ${file.text.length} octets`);
  let json = null; try { json = JSON.parse(file.text); log("JSON valide", `clés: ${Object.keys(json).join(", ")}`); } catch { log("JSON valide", "NON"); }
  const counts = () => ({ posts: db.prepare("SELECT COUNT(*) n FROM posts").get().n, pages: db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, terms: db.prepare("SELECT COUNT(*) n FROM taxonomy_terms").get().n, menus: db.prepare("SELECT COUNT(*) n FROM nav_menus").get().n });
  const b = counts(); log("avant import", JSON.stringify(b));
  for (const mode of ["skip", "duplicate"]) {
    const fd = new FormData(); fd.append("file", new Blob([file.text], { type: "application/json" }), "export.json"); fd.append("on_conflict", mode); fd.append("types", "pages,articles,menus,taxonomies");
    const im = await boss.request(`${M}/site-web/outils/importer`, { method: "POST", multipart: fd }); const iid = Number(String(im.location).match(/importer\/(\d+)/)?.[1]);
    log(`import ${mode}: dépôt`, `${im.status} ${im.location}`);
    if (!iid) { const pg = await boss.get(`${M}/site-web/outils/importer`); log("  message", pg.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").match(/(Fichier|invalide|refus|impossible|n'est pas|format)[^.]{0,160}/i)?.[0] || "?"); continue; }
    let prev; for (let i = 0; i < 40; i++) { prev = await boss.get(`${M}/site-web/outils/importer/${iid}`); if (!/en cours|analyse en cours/i.test(prev.text)) break; await wait(500); }
    log(`  aperçu`, `${prev.status} ${prev.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").match(/(créer|ignor|conflit)[^.]{0,120}/i)?.[0] || ""}`);
    const conf = await boss.post(`${M}/site-web/outils/importer/${iid}/confirmer`, { confirm: "1" }); await wait(1500);
    log(`  confirmé`, `${conf.status} → ${JSON.stringify(counts())}`);
  }
  const bad = new FormData(); bad.append("file", new Blob(['{"kolakisa":"x","pages":[{"slug":"<script>"}'], { type: "application/json" }), "casse.json");
  const br = await boss.request(`${M}/site-web/outils/importer`, { method: "POST", multipart: bad }); log("import JSON cassé", `${br.status} ${br.location}`);
  db.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
