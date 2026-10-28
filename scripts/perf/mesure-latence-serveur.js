// Banc de latence serveur (TITAN XXXI). Lance un vrai serveur KOLAKISA isolé (dossiers temporaires), y crée un jeu de données
// représentatif (formations, articles, élèves, contacts Marketing), puis mesure chaque page : latence HTTP, temps serveur,
// nombre et durée des requêtes SQL (sonde scripts/perf/sonde-sql.js), poids brut et compressé.
// Usage : node scripts/perf/mesure-latence-serveur.js [--n 30] [--articles 120] [--contacts 3000] [--sortie fichier.json]
"use strict";
const path = require("node:path");
const fs = require("node:fs");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("../../tests/helpers.js");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg("n", 30)), ARTICLES = Number(arg("articles", 120)), CONTACTS = Number(arg("contacts", 3000)), OUT = arg("sortie", "");
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] : 0; };

(async () => {
  // KW_WRITE_BEHIND_MS : le serveur de test s'exécute en NODE_ENV=test (écritures immédiates) ; on active ici l'écriture groupée comme en production (--sans-groupage pour mesurer l'ancien comportement)
  const srv = await startServer({ ENCRYPTION_KEY: "0".repeat(64), SMTP_HOST: "", ...(process.argv.includes("--sans-groupage") ? {} : { KW_WRITE_BEHIND_MS: "2000" }), NODE_OPTIONS: `--require ${path.join(__dirname, "sonde-sql.js")}` });
  try {
    const boss = await loginInstructor(srv);
    const db = srv.db();
    // --- jeu de données ---
    const t0 = Date.now();
    for (let i = 1; i <= 8; i++) await createCourse(boss, srv, { title: `Formation ${i}`, lessons: [{ title: "Leçon 1" }, { title: "Leçon 2" }, { title: "Leçon 3" }] });
    const slugs = [];
    for (let i = 1; i <= ARTICLES; i++) {
      const fd = new FormData();
      for (const [k, v] of Object.entries({ content_format: "html", title: `Article de mesure ${i}`, content: "<h2>Titre</h2><p>" + "Un paragraphe de contenu réaliste pour le blog. ".repeat(30) + "</p>".repeat(1) + "<p>Suite</p>".repeat(8), status: "published" })) fd.append(k, v);
      const r = await boss.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } });
      let j = null; try { j = JSON.parse(r.text); } catch { /* ignore */ }
      if (j && j.slug) slugs.push(j.slug);
    }
    const stu = await newStudent(srv);
    const c1 = db.prepare("SELECT id FROM courses ORDER BY id LIMIT 1").get();
    await buy(stu, c1);
    // contacts Marketing en masse (accès direct, comme un import)
    const org = db.prepare("SELECT id FROM mk_organizations").get();
    let seeded = 0;
    if (org) {
      const cols = db.prepare("PRAGMA table_info(mk_contacts)").all().map((c) => c.name);
      if (cols.includes("email")) {
        db.exec("BEGIN");
        const st = db.prepare(`INSERT INTO mk_contacts (organization_id, email, first_name, last_name) VALUES (?, ?, ?, ?)`);
        for (let i = 0; i < CONTACTS; i++) { try { st.run(org.id, `contact${i}@exemple.test`, `Prénom${i}`, `Nom${i}`); seeded++; } catch { break; } }
        db.exec("COMMIT");
      }
    }
    const seedMs = Date.now() - t0;
    const anon = new Client(srv.base);
    const slug = slugs[Math.floor(slugs.length / 2)] || "";
    const course = db.prepare("SELECT slug FROM courses ORDER BY id LIMIT 1").get();
    const routes = [
      ["public", anon, "/"], ["public", anon, "/catalogue"], ["public", anon, `/cours/${course.slug}`], ["public", anon, "/blog"], ["public", anon, "/blog?page=3"],
      ["public", anon, slug ? `/blog/${slug}` : "/blog"], ["public", anon, "/a-propos"], ["public", anon, "/faq"], ["public", anon, "/contact"], ["public", anon, "/connexion"],
      ["public", anon, "/sitemap.xml"], ["public", anon, "/blog/feed.xml"], ["public", anon, "/sante"],
      ["élève", stu, "/mes-cours"], ["élève", stu, "/mon-compte"],
      ["formateur", boss, "/formateur"], ["formateur", boss, "/formateur/formations"], ["formateur", boss, "/formateur/blog"], ["formateur", boss, "/formateur/blog/nouveau"],
      ["formateur", boss, "/formateur/gestion"], ["formateur", boss, "/formateur/gestion/ventes"], ["formateur", boss, "/formateur/gestion/eleves"], ["formateur", boss, "/formateur/messages"],
      ["marketing", boss, "/marketing"], ["marketing", boss, "/marketing/contacts"], ["marketing", boss, "/marketing/campagnes"], ["marketing", boss, "/marketing/listes"], ["marketing", boss, "/marketing/segments"],
      ["marketing", boss, "/marketing/formulaires"], ["marketing", boss, "/marketing/pages"], ["marketing", boss, "/marketing/tunnels"], ["marketing", boss, "/marketing/automatisations"], ["marketing", boss, "/marketing/analytics"], ["marketing", boss, "/marketing/medias"],
      ["seo", boss, "/formateur/seo"],
    ];
    const rows = [];
    for (const [who, client, url] of routes) {
      const lat = [], srvMs = [], qn = [], qms = [];
      let status = 0, size = 0, gz = 0, slow = "", writes = "";
      for (let i = 0; i < N + 2; i++) {
        const t = process.hrtime.bigint();
        const r = await client.request(url, { headers: { "accept-encoding": "gzip" } });
        const ms = Number(process.hrtime.bigint() - t) / 1e6;
        status = r.status;
        if (i < 2) continue; // 2 passages d'échauffement (compilation des gabarits, caches), non comptés
        lat.push(ms); srvMs.push(Number(r.headers.get("x-srv-ms")) || 0); qn.push(Number(r.headers.get("x-q-count")) || 0); qms.push(Number(r.headers.get("x-q-ms")) || 0);
        gz = Number(r.headers.get("content-length")) || r.body.length; size = r.body.length; slow = decodeURIComponent(r.headers.get("x-q-slow") || ""); writes = r.headers.get("x-q-writes") || "";
      }
      rows.push({ who, url, status, p50: pct(lat, 50), p95: pct(lat, 95), p99: pct(lat, 99), srvP50: pct(srvMs, 50), sqlN: pct(qn, 50), sqlMsP50: pct(qms, 50), bytes: size, transfer: gz, slow, writes });
    }
    const out = { date: new Date().toISOString(), node: process.version, n: N, articles: slugs.length, contacts: seeded, seedMs, rows };
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
    const f = (x) => x.toFixed(1).padStart(7);
    console.log(`n=${N} articles=${slugs.length} contacts=${seeded} (jeu de données en ${seedMs} ms)`);
    console.log("rôle       statut  p50     p95     p99   srv50  SQLn  SQLms  écritures  octets  url");
    for (const r of rows) console.log(`${r.who.padEnd(10)} ${String(r.status).padEnd(5)} ${f(r.p50)} ${f(r.p95)} ${f(r.p99)} ${f(r.srvP50)} ${String(r.sqlN).padStart(5)} ${f(r.sqlMsP50)} ${String(r.writes).padStart(10)} ${String(r.transfer).padStart(8)}  ${r.url}`);
    db.close();
  } finally { await srv.stop(); }
})().catch((e) => { console.error(e); process.exit(1); });
