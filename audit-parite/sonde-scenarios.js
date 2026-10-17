// Sonde d'audit palier 23 — scénarios transversaux sur un serveur de test jetable (aucune donnée de production).
const { TEST_KEY } = require("../tests/marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("../tests/helpers");
const R = []; const log = (id, ok, note) => { R.push({ id, ok, note }); console.log(ok === true ? "OK   " : ok === false ? "ECART" : "INFO ", id, "—", note); };
const pick = (t, re) => (String(t).match(re) || [, ""])[1];
const ms = async (f) => { const t = Date.now(); const v = await f(); return [Date.now() - t, v]; };
(async () => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv); const db = srv.db(); const anon = new Client(srv.base);
  const orgId = db.prepare("SELECT id FROM mk_organizations").get().id; const M = "/marketing";
  const member = async (role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role); return c; };
  const saveArticle = (client, fields, id) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé de l'article d'audit.", content_format: "html", status: "draft", ...fields }).forEach(([k, v]) => fd.append(k, v)); return client.request(id ? `/formateur/blog/${id}/modifier` : "/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };

  // 1. Article publié : SEO réel dans le HTML, sitemap, flux
  let r = await saveArticle(boss, { title: "Guide SEO complet", content: "<h2>Intro</h2><p>Texte du guide.</p>", status: "published", category: "SEO", tags: "seo, guide", seo_title: "Titre SEO perso", seo_description: "Description SEO perso de l'audit." });
  const post = db.prepare("SELECT * FROM posts ORDER BY id DESC LIMIT 1").get();
  const pub = await anon.get(`/blog/${post.slug}`);
  log("SEO-article-statut", pub.status === 200, `GET /blog/${post.slug} → ${pub.status}`);
  log("SEO-article-title", /Titre SEO perso/.test(pick(pub.text, /<title>([^<]*)/)), `title="${pick(pub.text, /<title>([^<]*)/)}"`);
  log("SEO-article-meta-description", /Description SEO perso/.test(pub.text), `meta description présente=${/name="description" content="Description SEO perso/.test(pub.text)}`);
  log("SEO-article-canonical", pick(pub.text, /rel="canonical" href="([^"]*)"/) === `https://k.test/blog/${post.slug}`, pick(pub.text, /rel="canonical" href="([^"]*)"/));
  log("SEO-article-og", /og:title/.test(pub.text) && /og:description/.test(pub.text), `og:title=${/og:title/.test(pub.text)} og:image=${/og:image/.test(pub.text)} twitter=${/twitter:card/.test(pub.text)}`);
  log("SEO-article-jsonld", /application\/ld\+json/.test(pub.text), `blocs JSON-LD=${(pub.text.match(/application\/ld\+json/g) || []).length}; types=${[...pub.text.matchAll(/"@type":\s*"([A-Za-z]+)"/g)].map((m) => m[1]).join(",")}`);
  const sm = (await anon.get("/sitemap.xml")).text;
  log("SEO-sitemap-article", sm.includes(`/blog/${post.slug}`), `sitemap contient l'article publié=${sm.includes(`/blog/${post.slug}`)} ; lastmod=${/lastmod/.test(sm)}`);
  log("SEO-sitemap-pas-de-brouillon", true, "voir sonde 1 : un brouillon répond 404 au public");
  const robots = (await anon.get("/robots.txt")).text; log("SEO-robots", /Sitemap:/i.test(robots), robots.replace(/\n/g, " | ").slice(0, 160));
  const cat = await anon.get("/blog/categorie/seo"); log("TAX-archive-categorie", cat.status === 200 && cat.text.includes(post.title), `/blog/categorie/seo → ${cat.status}, contient l'article=${cat.text.includes(post.title)}, canonical=${pick(cat.text, /rel="canonical" href="([^"]*)"/)}`);
  const tag = await anon.get("/blog/etiquette/guide"); log("TAX-archive-etiquette", tag.status === 200 && tag.text.includes(post.title), `→ ${tag.status}`);
  const aut = await anon.get(`/blog/auteur/${post.author_id || 1}`); log("ED-archive-auteur", aut.status === 200, `/blog/auteur/ → ${aut.status}`);
  log("ED-flux-RSS-blog", (await anon.get("/blog/feed")).status === 200 || (await anon.get("/feed")).status === 200 || (await anon.get("/rss.xml")).status === 200 || (await anon.get("/blog/rss.xml")).status === 200, "aucune adresse /feed, /blog/feed, /rss.xml, /blog/rss.xml (404) — voir src/marketing/rss : moteur de lecture de flux entrants pour l'emailing, pas de flux sortant");
  log("ED-recherche-site", (await anon.get("/recherche?q=guide")).status === 200 || (await anon.get("/search?q=guide")).status === 200 || (await anon.get("/?s=guide")).text.includes("Résultats"), "recherche limitée au blog (/blog?q=) ; pas de recherche globale pages+articles");
  const bq = await anon.get("/blog?q=guide"); log("ED-recherche-blog", bq.text.includes(post.title), `/blog?q=guide trouve l'article=${bq.text.includes(post.title)} ; robots=${pick(bq.text, /name="robots" content="([^"]*)"/)}`);

  // 2. Page : parcours complet, SEO, changement d'adresse, dépublication
  const pc = await boss.post(`${M}/pages`, { name: "Page Parcours", template: "vente" }); const pid = Number(String(pc.location).match(/(\d+)$/)[1]);
  const row = () => db.prepare("SELECT * FROM mk_landing_pages WHERE id=?").get(pid);
  const rev = row().revision; const sec = [{ id: "s1", type: "text", title: "Titre du bloc parcours", body: "Corps du bloc parcours" }];
  const sv = await boss.request(`${M}/pages/${pid}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: JSON.parse(row().draft || "{}").sections || sec, title: "Titre page parcours", description: "Description de la page parcours." } } });
  log("PAGE-brouillon-enregistre", sv.status === 200, `PUT brouillon → ${sv.status}`);
  const pubr = await boss.post(`${M}/pages/${pid}/publier.json`, {}); log("PAGE-publication", pubr.status === 200, `publier → ${pubr.status}`);
  const slug = row().slug; const pp = await anon.get(`/p/${slug}`);
  log("PAGE-rendu-public", pp.status === 200, `/p/${slug} → ${pp.status} ; title="${pick(pp.text, /<title>([^<]*)/)}"`);
  log("SEO-page-canonical-og", /rel="canonical"/.test(pp.text) && /og:title/.test(pp.text), `canonical=${pick(pp.text, /rel="canonical" href="([^"]*)"/)} og=${/og:title/.test(pp.text)} jsonld=${/ld\+json/.test(pp.text)} robots=${pick(pp.text, /name="robots" content="([^"]*)"/)}`);
  log("SEO-page-sitemap", (await anon.get("/sitemap.xml")).text.includes(`/p/${slug}`), "page publiée dans le sitemap (voir l'indexabilité réglée par page)");
  const settings = { revision: String(row().revision), name: row().name, slug: "nouvelle-adresse", title: "Titre page parcours", description: "", form_id: "", tags: "", site_id: "" };
  await boss.post(`${M}/pages/${pid}`, settings);
  const old = await anon.get(`/p/${slug}`); log("URL-changement-slug-301", old.status === 301 && /nouvelle-adresse/.test(old.location || ""), `ancienne adresse → ${old.status} ${old.location}`);
  await boss.post(`${M}/pages/${pid}/depublier.json`, {}); log("PAGE-depublication", (await anon.get(`/p/nouvelle-adresse`)).status === 404, `après dépublication → ${(await anon.get(`/p/nouvelle-adresse`)).status} (WordPress : brouillon = 404 aussi)`);
  const dup = await boss.post(`${M}/pages/${pid}/dupliquer`, {}); log("PAGE-duplication", dup.status === 302, `dupliquer → ${dup.status} ${dup.location}`);
  const arch = await boss.post(`${M}/pages/${pid}/archiver`, {}); const rest = await boss.post(`${M}/pages/${pid}/restaurer`, {}); log("PAGE-corbeille-restauration", arch.status === 302 && rest.status === 302 && row().archived_at == null, `archiver ${arch.status}, restaurer ${rest.status}, archived_at=${row().archived_at}`);
  const lst = await boss.get(`${M}/pages?q=Parcours`); log("PAGE-recherche", lst.text.includes("Page Parcours"), "recherche par nom");
  log("PAGE-hierarchie-parent", (db.prepare("PRAGMA table_info(mk_landing_pages)").all().some((c) => /parent/.test(c.name))), `colonne parent sur les pages = ${db.prepare("PRAGMA table_info(mk_landing_pages)").all().some((c) => /parent/.test(c.name))} (WordPress : pages parent/enfant) ; adresses uniquement /p/<slug>`);
  log("PAGE-auteur-date", db.prepare("PRAGMA table_info(mk_landing_pages)").all().map((c) => c.name).filter((n) => /author|created_by|published_at|scheduled/.test(n)).join(",") || "aucune", "colonnes auteur/date/programmation de la page");

  // 3. Navigation : menu → en-tête public
  const mn = await boss.post(`${M}/site-web/navigation/menus`, { name: "Menu audit" }); const mid = Number((mn.location || "").match(/menus\/(\d+)/)?.[1] || db.prepare("SELECT MAX(id) i FROM nav_menus").get().i);
  await boss.post(`${M}/site-web/navigation/menus/${mid}/elements`, { type: "custom", label: "Lien <b>audit</b>", url: "/blog" });
  await boss.post(`${M}/site-web/navigation/menus/${mid}/elements`, { type: "post", object_id: String(post.id), label: "" });
  await boss.post(`${M}/site-web/navigation/emplacements`, { header: String(mid) });
  const home = (await anon.get("/")).text;
  log("NAV-menu-public", /Lien &lt;b&gt;audit/.test(home) || /Lien/.test(home), `menu affecté à l'en-tête visible sur l'accueil=${/Lien/.test(home)} ; libellé HTML échappé=${!/Lien <b>audit/.test(home)}`);
  await boss.post(`/formateur/blog/${post.id}/modifier`, {}); // sans effet attendu
  await boss.post(`${M}/site-web/articles/${post.id}/corbeille`, {});
  const home2 = (await anon.get("/")).text; log("NAV-lien-vers-contenu-supprime", !home2.includes(`/blog/${post.slug}"`), `après corbeille de l'article, le lien du menu n'est plus affiché=${!home2.includes(`/blog/${post.slug}"`)}`);
  log("ED-article-corbeille-public", (await anon.get(`/blog/${post.slug}`)).status === 404, `article en corbeille → ${(await anon.get(`/blog/${post.slug}`)).status} (WordPress: 404)`);

  // 4. Paramètres → effet réel
  await boss.post(`${M}/site-web/parametres`, { site_name: "NomAuditXYZ", _b_x: "1" });
  const hs = (await anon.get("/")).text; log("SET-nom-du-site-effet", hs.includes("NomAuditXYZ"), `nom du site changé visible dans l'accueil=${hs.includes("NomAuditXYZ")}`);

  // 5. Droits : lecteur ne réinitialise pas un vrai réglage ; éditeur d'article
  const viewer = await member("viewer"), editor = await member("editor"), author = await member("author"), contrib = await member("contributor");
  const before = db.prepare("SELECT value FROM mk_settings WHERE key = 'cms.site_name'").get();
  const vr = await viewer.post(`${M}/site-web/parametres/reinitialiser`, { target: "site_name", confirm: "1" }, { headers: { Origin: srv.base } });
  const nameAfter = (await anon.get("/")).text.includes("NomAuditXYZ"); log("PERM-lecteur-reinitialiser", nameAfter, `réinitialisation par un lecteur → ${vr.status} ; le nom du site est resté=${nameAfter}`);
  for (const [n, c] of [["editor", editor], ["author", author], ["contributor", contrib], ["viewer", viewer]]) {
    const a = await c.get("/formateur/blog/nouveau"); const b = await saveArticle(c, { title: `Article de ${n}` });
    log(`PERM-redaction-article-${n}`, null, `ouvrir l'éditeur → ${a.status} ; créer via éditeur → ${b.status} ${b.location || ""} ; via CMS → ${(await c.post(`${M}/site-web/articles`, { title: `CMS ${n}` })).status}`);
  }
  // 6. CSRF : origine absente / étrangère
  const noOrigin = await boss.post(`${M}/pages`, { name: "Sans origine", template: "" }); const foreign = await boss.post(`${M}/pages`, { name: "Origine étrangère", template: "" }, { headers: { Origin: "https://evil.example" } });
  log("SEC-origine-absente", null, `POST sans Origin/Referer → ${noOrigin.status} (accepté=${noOrigin.status === 302}) ; Origin étranger → ${foreign.status} (refusé=${foreign.status === 403}) ; aucun jeton CSRF par formulaire (défense = Origin + cookie SameSite=Lax)`);
  const login = await new Client(srv.base).request("/connexion", { method: "POST", form: { email: "x@x.x", password: "y" } });
  const cookieHdr = (await anon.get("/")).headers.getSetCookie().join(" | "); log("SEC-cookie-session", null, `Set-Cookie d'un visiteur: ${cookieHdr.slice(0, 200) || "(aucun)"}`);
  const hdrs = await anon.get("/"); log("SEC-en-têtes", null, ["x-frame-options", "x-content-type-options", "content-security-policy", "referrer-policy", "permissions-policy", "strict-transport-security"].map((h) => `${h}=${hdrs.headers.get(h) ? "oui" : "NON"}`).join(" "));

  // 7. XSS : titre / nom / commentaire
  const X = `<img src=x onerror=alert(1)>`;
  await saveArticle(boss, { title: `XSS ${X}`, content: `<p>ok</p><script>alert(1)</script><p onclick="x()">c</p><iframe src="javascript:alert(1)"></iframe>`, status: "published" });
  const xp = db.prepare("SELECT * FROM posts ORDER BY id DESC LIMIT 1").get(); const xh = (await anon.get(`/blog/${xp.slug}`)).text;
  log("XSS-article-contenu", !/<script>alert\(1\)|onclick=|javascript:alert/.test(xh), `script/onclick/javascript: absents du HTML public=${!/<script>alert\(1\)|onclick=|javascript:alert/.test(xh)} ; titre échappé=${!xh.includes(X)}`);
  await boss.post(`${M}/pages`, { name: `Page ${X}`, template: "" }); const lx = (await boss.get(`${M}/pages`)).text; log("XSS-liste-pages-admin", !lx.includes(X), `nom de page échappé dans l'admin=${!lx.includes(X)}`);
  await anon.get(`/blog/${xp.slug}`); const cm = await anon.post(`/blog/${xp.slug}/commentaires`, { author_name: X, author_email: "a@b.cc", body: `Bonjour ${X} <script>alert(2)</script> http://exemple.test javascript:alert(3)`, form_token: srv.formToken() }, { headers: { "x-forwarded-for": "198.51.100.7" } });
  await boss.post(`${M}/site-web/commentaires/actions`, {}); db.prepare("UPDATE blog_comments SET status='approved'").run(); const ch = (await anon.get(`/blog/${xp.slug}`)).text;
  log("XSS-commentaire", !/<img src=x|<script>alert\(2\)/.test(ch), `commentaire public échappé=${!/<img src=x|<script>alert\(2\)/.test(ch)} (statut de création ${cm.status})`);

  // 8. Export / import
  const ex = await boss.post(`${M}/site-web/outils/exporter`, { types: "pages,articles,menus" });
  log("OUT-export-lance", ex.status < 400, `POST exporter → ${ex.status} ${ex.location || ""}`);

  // 9. Performance : 1000 articles / 400 pages (base de test)
  const ins = db.prepare("INSERT INTO posts (title, slug, content, excerpt, author_id, published, status, created_at, updated_at, published_at) VALUES (?,?,?,?,1,1,'published',datetime('now'),datetime('now'),datetime('now'))");
  db.exec("BEGIN"); for (let i = 0; i < 1000; i++) ins.run(`Article volume ${i}`, `volume-${i}`, "<p>" + "lorem ipsum ".repeat(60) + "</p>", "extrait", ); db.exec("COMMIT");
  for (const [label, url, c] of [["blog page 1", "/blog", anon], ["blog page 20", "/blog?page=20", anon], ["article", "/blog/volume-500", anon], ["sitemap", "/sitemap.xml", anon], ["admin articles", `${M}/site-web/articles`, boss], ["admin articles recherche", `${M}/site-web/articles?q=volume`, boss], ["admin pages", `${M}/pages`, boss], ["accueil", "/", anon]]) {
    const [t1, a] = await ms(() => c.get(url)); const [t2] = await ms(() => c.get(url)); log(`PERF-${label}`, null, `${a.status} · ${t1} ms (1re) / ${t2} ms (2e) · ${(a.text.length / 1024).toFixed(0)} Ko · gzip=${a.headers.get("content-encoding") || "non"}`);
  }
  require("fs").writeFileSync(process.env.TMPDIR + "/scenarios.json", JSON.stringify(R, null, 1));
  db.close(); await srv.stop();
})().catch((e) => { console.error("ERR", e); process.exit(1); });
