// Sonde d'audit palier 23 — compléments (droits d'édition d'articles, import/export, programmation, multi-site). Serveur de test jetable.
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("../tests/helpers");
const log = (id, note) => console.log(id.padEnd(34), note);
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db(); const anon = new Client(srv.base); const M = "/marketing";
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  const member = async (role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role); return c; };
  const save = (c, f, id) => { const fd = new FormData(); Object.entries({ excerpt: "r", content_format: "html", status: "draft", ...f }).forEach(([k, v]) => fd.append(k, v)); return c.request(id ? `/formateur/blog/${id}/modifier` : "/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
  // Article créé par l'éditeur via le CMS : peut-il ensuite l'ouvrir / le modifier ?
  const editor = await member("editor"), author = await member("author");
  const c = await editor.post(`${M}/site-web/articles`, { title: "Créé par un éditeur" }); log("éditeur crée via CMS", `${c.status} ${c.location}`);
  const pid = Number(String(c.location).match(/blog\/(\d+)/)?.[1]);
  log("éditeur ouvre son article", String((await editor.get(`/formateur/blog/${pid}/modifier`)).status));
  log("éditeur enregistre (éditeur riche)", String((await save(editor, { title: "Modifié" }, pid)).status));
  log("éditeur publie (CMS)", String((await editor.post(`${M}/site-web/articles/${pid}/publier`, {})).status));
  const own = db.prepare("SELECT author_id FROM posts WHERE id=?").get(pid); log("auteur enregistré de l'article", JSON.stringify(own));
  // Auteur : articles de l'auteur (edit_own) — comment en crée-t-il un ?
  log("auteur liste CMS articles", String((await author.get(`${M}/site-web/articles`)).status));
  // Programmation : article planifié, avant la 1re lecture publique, est-il dans le sitemap / flux ?
  const past = new Date(Date.now() - 3600e3).toISOString();
  await save(boss, { title: "Planifié passé", content: "<p>x</p>", status: "scheduled", published_at_utc: new Date(Date.now() + 3600e3).toISOString() });
  const sp = db.prepare("SELECT id,slug,status,published FROM posts ORDER BY id DESC LIMIT 1").get(); log("planifié (futur)", JSON.stringify(sp));
  db.prepare("UPDATE posts SET published_at = ? WHERE id = ?").run(past.replace("T", " ").slice(0, 19), sp.id);
  log("sitemap avant 1re lecture", String((await anon.get("/sitemap.xml")).text.includes(sp.slug)));
  log("lecture publique après échéance", String((await anon.get(`/blog/${sp.slug}`)).status));
  // Export puis import (aller-retour)
  await save(boss, { title: "Pour export", content: "<p>contenu</p>", status: "published", category: "Cat", tags: "t1" });
  await boss.post(`${M}/pages`, { name: "Page export", template: "" });
  const ex = await boss.post(`${M}/site-web/outils/exporter`, { types: "pages,articles,menus,taxonomies,settings" }); log("export", `${ex.status} ${ex.location}`);
  const eid = Number(String(ex.location).match(/(\d+)$/)?.[1]);
  const file = await boss.get(`${M}/site-web/outils/exporter/${eid}/fichier`); log("fichier d'export", `${file.status} ${file.headers.get("content-type")} ${file.text.length} octets`);
  let json; try { json = JSON.parse(file.text); log("export JSON valide", `clés=${Object.keys(json).join(",")}`); } catch (e) { log("export JSON valide", "NON " + file.text.slice(0, 80)); }
  const counts = () => ({ posts: db.prepare("SELECT COUNT(*) n FROM posts").get().n, pages: db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, terms: db.prepare("SELECT COUNT(*) n FROM taxonomy_terms").get().n });
  const b = counts(); const fd = new FormData(); fd.append("file", new Blob([file.text], { type: "application/json" }), "export.json"); fd.append("on_conflict", "skip");
  const im = await boss.request(`${M}/site-web/outils/importer`, { method: "POST", multipart: fd }); log("import (simulation)", `${im.status} ${im.location}`);
  const iid = Number(String(im.location).match(/(\d+)$/)?.[1]);
  if (iid) { const prev = await boss.get(`${M}/site-web/outils/importer/${iid}`); log("aperçu import", `${prev.status} conflits mentionnés=${/conflit/i.test(prev.text)}`); const conf = await boss.post(`${M}/site-web/outils/importer/${iid}/confirmer`, { confirm: "1" }); log("import confirmé", `${conf.status}`); }
  log("compte avant/après import", `${JSON.stringify(b)} → ${JSON.stringify(counts())}`);
  // Multi-site : sitemap et articles
  const s = await boss.post(`${M}/site-web/sites`, { name: "Site B" }); log("création site", `${s.status} ${s.location}`);
  log("articles.site_id existe", String(db.prepare("PRAGMA table_info(posts)").all().some((x) => x.name === "site_id")));
  log("taxonomy_terms.site_id existe", String(db.prepare("PRAGMA table_info(taxonomy_terms)").all().some((x) => x.name === "site_id")));
  log("blog_comments.site_id existe", String(db.prepare("PRAGMA table_info(blog_comments)").all().some((x) => x.name === "site_id")));
  log("nav_menus.site_id existe", String(db.prepare("PRAGMA table_info(nav_menus)").all().some((x) => x.name === "site_id")));
  log("mk_media.site_id existe", String(db.prepare("PRAGMA table_info(mk_media)").all().some((x) => x.name === "site_id")));
  log("mk_landing_pages.site_id existe", String(db.prepare("PRAGMA table_info(mk_landing_pages)").all().some((x) => x.name === "site_id")));
  log("mk_redirects site_id", String(db.prepare("SELECT name FROM sqlite_master WHERE name LIKE '%redirect%'").all().map((x) => x.name)));
  db.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
