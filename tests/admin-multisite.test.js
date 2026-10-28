// Administration par site de « Mon espace » (/formateur) : sélecteur de site universel, contexte vérifié côté serveur, isolation des données
// (formations, chapitres, catégories, messages, FAQ, À propos, support, journal, blog, SEO) — par les vraies routes d'un vrai serveur et la vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

const read = (...p) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf8");

describe("Administration par site : contexte et sélecteur", () => {
  let srv, prof, eleve, db, orgId, siteA, siteB, siteArchived;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const mkSite = (name, slug, status = "active") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, status, tokens) VALUES (?, ?, ?, ?, '{}')").run(orgId, name, slug, status).lastInsertRowid);
  const titlesOf = (html) => [...html.matchAll(/class="course-title"[^>]*>([^<]+)</g)].map((m) => m[1].trim());

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    prof = await loginInstructor(srv); eleve = await newStudent(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    siteA = mkSite("Site Alpha", "alpha"); siteB = mkSite("Site Beta", "beta"); siteArchived = mkSite("Site Ancien", "ancien", "archived");
  });
  after(() => { try { db.close(); } catch { /* déjà fermée */ } srv.stop(); });

  test("migration : site_id (nullable) sur les tables du LMS, la table des pages par site, aucune ligne existante déplacée", () => {
    for (const t of ["courses", "faqs", "contact_messages", "support_tickets", "audit_log"]) {
      const col = all(`PRAGMA table_info(${t})`).find((c) => c.name === "site_id");
      assert.ok(col, `${t}.site_id`);
      assert.equal(col.notnull, 0, `${t}.site_id est facultatif (NULL = site principal)`);
    }
    assert.ok(one("SELECT 1 x FROM sqlite_master WHERE name = 'site_pages_by_site'"));
    assert.equal(one("SELECT COUNT(*) n FROM courses WHERE site_id IS NOT NULL").n, 0);
  });

  test("sélecteur : sites réels du gestionnaire (nom, domaine), principal en tête, site actif indiqué en toutes lettres ; archivé et inconnu absents", async () => {
    const html = (await prof.get("/formateur/formations?site=principal")).text;
    assert.match(html, /data-dash-site/);
    assert.match(html, /Site administré/);
    assert.match(html, /<strong>Site principal<\/strong>/);
    assert.match(html, /<strong>Site Alpha<\/strong>/);
    assert.match(html, /<strong>Site Beta<\/strong>/);
    assert.doesNotMatch(html, /Site Ancien/, "un site archivé n'est pas proposé");
    assert.match(html, /aria-current="true"[\s\S]{0,400}Site principal[\s\S]{0,200}Sélectionné/, "le site actif est indiqué par un texte, pas seulement une couleur");
    assert.match(html, new RegExp(`href="/formateur/formations\\?site=${siteA}"`), "chaque option est un vrai lien (fonctionne sans JavaScript)");
  });

  test("sélecteur : absent sur Marketing et Profil (périmètre global), présent sur les onglets propres à un site", async () => {
    assert.doesNotMatch((await prof.get("/formateur/profil")).text, /data-dash-site/);
    for (const url of ["/formateur", "/formateur/formations", "/formateur/chapitres", "/formateur/categories", "/formateur/messages", "/formateur/blog", "/formateur/gestion", "/formateur/gestion/journal", "/formateur/gestion/support", "/formateur/faq", "/formateur/pages/a-propos", "/formateur/apparence"]) {
      const r = await prof.get(url);
      assert.equal(r.status, 200, url);
      assert.match(r.text, /data-dash-site/, `sélecteur sur ${url}`);
    }
  });

  test("contexte : le site demandé est revérifié côté serveur — identifiant forgé, inconnu, archivé ou injection : repli sûr sur le principal avec message", async () => {
    for (const bad of ["99999", "abc", "1%20OR%201%3D1", `${siteArchived}`, "-3", "0"]) {
      const r = await prof.get(`/formateur/formations?site=${bad}`);
      assert.equal(r.status, 200, bad);
      assert.match(r.text, /role="alert"/, `refus signalé pour ${bad}`);
      assert.match(r.text, /Le site « Site principal » est affiché à la place/);
    }
  });

  test("contexte : le site choisi reste actif pendant la navigation (session) et se retrouve par lien direct", async () => {
    await prof.get(`/formateur/formations?site=${siteA}`);
    const r = await prof.get("/formateur/categories");
    assert.match(r.text, /aria-current="true"[\s\S]{0,400}Site Alpha/);
    assert.match(r.text, new RegExp(`href="/formateur/messages\\?site=${siteA}"`), "la navigation conserve le site dans ses liens");
    await prof.get("/formateur/formations?site=principal");
  });

  test("accès : anonyme renvoyé à la connexion ; élève refusé, même avec un site dans l'adresse", async () => {
    assert.equal((await new Client(srv.base).get(`/formateur/formations?site=${siteA}`)).status, 302);
    assert.equal((await eleve.get(`/formateur/formations?site=${siteA}`)).status, 403);
  });

  test("redirections : une action sur un site garde ce site dans l'adresse de retour", async () => {
    const r = await prof.post(`/formateur/cours/nouveau?site=${siteA}`, { title: "Cours redirigé", category: "Test", level: "debutant", price: "0", description: "d" });
    assert.equal(r.status, 302);
    assert.match(r.location, new RegExp(`site=${siteA}`));
  });
});

describe("Administration par site : isolation des données", () => {
  let srv, prof, db, orgId, siteA, siteB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, slug).lastInsertRowid);
  const newCourse = async (title, site, category = "Test") => {
    const r = await prof.post(`/formateur/cours/nouveau?site=${site || "principal"}`, { title, category, level: "debutant", price: "10", description: "desc", ...(site ? { site: String(site) } : {}) });
    assert.equal(r.status, 302, `création de ${title}`);
    return one("SELECT * FROM courses WHERE title = ?", title);
  };
  const text = async (url) => (await prof.get(url)).text;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    prof = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    siteA = mkSite("Site Alpha", "alpha"); siteB = mkSite("Site Beta", "beta");
  });
  after(() => { try { db.close(); } catch { /* déjà fermée */ } srv.stop(); });

  test("formations : créées dans le site sélectionné, listées seulement là ; persistées après rechargement", async () => {
    const principal = await newCourse("Formation du principal", null);
    const a = await newCourse("Formation Alpha", siteA);
    const b = await newCourse("Formation Beta", siteB);
    assert.equal(principal.site_id, null); assert.equal(a.site_id, siteA); assert.equal(b.site_id, siteB);
    const listA = await text(`/formateur/formations?site=${siteA}`);
    assert.match(listA, /Formation Alpha/); assert.doesNotMatch(listA, /Formation Beta|Formation du principal/);
    const listP = await text("/formateur/formations?site=principal");
    assert.match(listP, /Formation du principal/); assert.doesNotMatch(listP, /Formation Alpha|Formation Beta/);
    assert.match(await text(`/formateur/formations?site=${siteB}`), /Formation Beta/, "rechargement : toujours là");
  });

  test("formations : le champ « site » d'un formulaire ne peut pas contredire le site actif (409), rien n'est écrit", async () => {
    await prof.get(`/formateur/formations?site=${siteA}`);
    const before = one("SELECT COUNT(*) n FROM courses").n;
    const r = await prof.post(`/formateur/cours/nouveau?site=${siteA}`, { title: "Cours piégé", category: "Test", level: "debutant", price: "1", description: "d", site: String(siteB) });
    assert.equal(r.status, 409);
    assert.equal(one("SELECT COUNT(*) n FROM courses").n, before);
    assert.equal(one("SELECT 1 x FROM courses WHERE title = 'Cours piégé'"), undefined);
  });

  test("objets : ouvrir par adresse directe la formation d'un autre site bascule sur son site (GET) ; toute écriture depuis le mauvais site est refusée (409)", async () => {
    const b = one("SELECT * FROM courses WHERE title = 'Formation Beta'");
    await prof.get(`/formateur/formations?site=${siteA}`);
    const g = await prof.get(`/formateur/cours/${b.id}/modifier`);
    assert.equal(g.status, 302);
    assert.match(g.location, new RegExp(`site=${siteB}`));
    await prof.get(`/formateur/formations?site=${siteA}`);
    const w = await prof.post(`/formateur/cours/${b.id}/supprimer`, {});
    assert.equal(w.status, 409);
    assert.ok(one("SELECT 1 x FROM courses WHERE id = ?", b.id), "la formation du site Beta n'a pas été supprimée");
    for (const action of ["publier", "archiver", "dupliquer"]) assert.equal((await prof.post(`/formateur/cours/${b.id}/${action}`, {})).status, 409, action);
    const unchanged = one("SELECT published, archived FROM courses WHERE id = ?", b.id);
    assert.equal(unchanged.archived, 0);
    assert.equal(one("SELECT COUNT(*) n FROM courses WHERE title LIKE 'Formation Beta%'").n, 1, "aucune copie");
  });

  test("chapitres : rattachés à une formation du site ; un chapitre d'un autre site est inatteignable depuis le site actif", async () => {
    const b = one("SELECT * FROM courses WHERE title = 'Formation Beta'");
    await prof.get(`/formateur/formations?site=${siteB}`);
    await prof.post(`/formateur/cours/${b.id}/sections?site=${siteB}`, { title: "Chapitre Beta" });
    const section = one("SELECT * FROM sections WHERE course_id = ?", b.id);
    assert.ok(section);
    await prof.get(`/formateur/formations?site=${siteA}`);
    assert.equal((await prof.post(`/formateur/sections/${section.id}/supprimer`, {})).status, 409);
    assert.equal((await prof.post(`/formateur/cours/${b.id}/sections`, { title: "Intrus" })).status, 409, "ajout d'un chapitre à la formation d'un autre site");
    assert.equal(all("SELECT * FROM sections WHERE course_id = ?", b.id).length, 1);
    const chapters = await text(`/formateur/chapitres?site=${siteA}`);
    assert.doesNotMatch(chapters, /Formation Beta/);
  });

  test("catégories : celles du site sélectionné seulement ; renommer n'affecte pas les formations des autres sites", async () => {
    await newCourse("Cours catégorie A", siteA, "Cuisine");
    await newCourse("Cours catégorie principal", null, "Cuisine");
    assert.match(await text(`/formateur/categories?site=${siteA}`), /Cuisine/);
    assert.doesNotMatch(await text(`/formateur/categories?site=${siteB}`), /Cuisine/);
    await prof.get(`/formateur/categories?site=${siteA}`);
    const r = await prof.post(`/formateur/categories/renommer?site=${siteA}`, { from: "Cuisine", to: "Gastronomie" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT category c FROM courses WHERE title = 'Cours catégorie A'").c, "Gastronomie");
    assert.equal(one("SELECT category c FROM courses WHERE title = 'Cours catégorie principal'").c, "Cuisine", "le site principal n'est pas touché");
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/categorie/cuisine'").n, 0, "aucune redirection commune créée par un site secondaire");
    await prof.get("/formateur/categories?site=principal");
  });

  test("messages : chaque site a sa boîte ; un message d'un autre site est introuvable (lecture, marquage, suppression)", async () => {
    const ins = (name, site) => Number(db.prepare("INSERT INTO contact_messages (name, email, subject, message, site_id) VALUES (?, 'x@k.test', ?, 'Bonjour, ceci est un message.', ?)").run(name, `Objet ${name}`, site).lastInsertRowid);
    const mp = ins("Visiteur Principal", null), ma = ins("Visiteur Alpha", siteA), mb = ins("Visiteur Beta", siteB);
    const listA = await text(`/formateur/messages?site=${siteA}`);
    assert.match(listA, /Visiteur Alpha/); assert.doesNotMatch(listA, /Visiteur Beta|Visiteur Principal/);
    assert.match(await text(`/formateur/messages?site=principal`), /Visiteur Principal/);
    const open = await text(`/formateur/messages?site=${siteA}&id=${mb}`);
    assert.doesNotMatch(open, /Visiteur Beta/, "un message d'un autre site ne s'ouvre pas");
    assert.equal(one("SELECT read_at FROM contact_messages WHERE id = ?", mb).read_at, null, "et n'est pas marqué comme lu");
    await prof.get(`/formateur/messages?site=${siteA}`);
    await prof.post(`/formateur/messages/${mb}/supprimer`, {});
    assert.ok(one("SELECT 1 x FROM contact_messages WHERE id = ?", mb), "suppression refusée sur un message d'un autre site");
    await prof.post(`/formateur/messages/${ma}/supprimer`, {});
    assert.equal(one("SELECT 1 x FROM contact_messages WHERE id = ?", ma), undefined, "suppression réelle dans son propre site");
    assert.ok(one("SELECT 1 x FROM contact_messages WHERE id = ?", mp));
    await prof.get("/formateur/messages?site=principal");
  });

  test("messages : le formulaire de contact public enregistre le site du domaine servi (jamais une valeur envoyée par le visiteur)", () => {
    const src = read("src", "routes", "pages.js");
    assert.match(src, /INSERT INTO contact_messages \(name, email, subject, message, site_id\)[^;]*req\.kwSite \? req\.kwSite\.id : null/);
  });

  test("FAQ : questions générales propres à chaque site ; modifier/supprimer une question d'un autre site est refusé", async () => {
    await prof.post(`/formateur/faq/ajouter?site=${siteA}`, { question: "Question Alpha ?", answer: "Réponse Alpha", published: "1" });
    await prof.post(`/formateur/faq/ajouter?site=${siteB}`, { question: "Question Beta ?", answer: "Réponse Beta", published: "1" });
    const qa = one("SELECT * FROM faqs WHERE question = 'Question Alpha ?'"), qb = one("SELECT * FROM faqs WHERE question = 'Question Beta ?'");
    assert.equal(qa.site_id, siteA); assert.equal(qb.site_id, siteB);
    const listA = await text(`/formateur/faq?site=${siteA}`);
    assert.match(listA, /Question Alpha/); assert.doesNotMatch(listA, /Question Beta/);
    await prof.get(`/formateur/faq?site=${siteA}`);
    assert.equal((await prof.post(`/formateur/faq/${qb.id}/supprimer`, {})).status, 409);
    assert.equal((await prof.post(`/formateur/faq/${qb.id}/modifier`, { question: "Piraté", answer: "x" })).status, 409);
    assert.equal(one("SELECT question FROM faqs WHERE id = ?", qb.id).question, "Question Beta ?");
    assert.equal((await prof.get(`/formateur/faq/${qb.id}/modifier`)).status, 302, "lien direct : bascule sur le bon site");
    await prof.get(`/formateur/faq?site=${siteA}`);
    await prof.post(`/formateur/faq/${qa.id}/supprimer`, {});
    assert.equal(one("SELECT 1 x FROM faqs WHERE id = ?", qa.id), undefined);
    assert.ok(one("SELECT 1 x FROM faqs WHERE id = ?", qb.id));
    assert.doesNotMatch(await text("/faq"), /Question Beta|Question Alpha/, "la page publique du domaine principal ne sert pas les questions des autres sites");
    await prof.get("/formateur/faq?site=principal");
  });

  test("À propos : une page par site (table dédiée), le principal garde la sienne ; persistance après rechargement", async () => {
    await prof.post(`/formateur/pages/a-propos?site=${siteA}`, { content: "# Alpha\n\nTexte Alpha", seo_description: "desc alpha" });
    await prof.post(`/formateur/pages/a-propos?site=${siteB}`, { content: "# Beta\n\nTexte Beta", seo_description: "desc beta" });
    await prof.post("/formateur/pages/a-propos?site=principal", { content: "# Principal\n\nTexte principal", seo_description: "desc principal" });
    assert.match(await text(`/formateur/pages/a-propos?site=${siteA}`), /Texte Alpha/);
    assert.doesNotMatch(await text(`/formateur/pages/a-propos?site=${siteA}`), /Texte Beta|Texte principal/);
    assert.match(await text(`/formateur/pages/a-propos?site=${siteB}`), /Texte Beta/);
    assert.match(await text("/formateur/pages/a-propos?site=principal"), /Texte principal/);
    assert.equal(one("SELECT content FROM site_pages WHERE slug = 'a-propos'").content, "# Principal\n\nTexte principal");
    assert.equal(all("SELECT * FROM site_pages_by_site WHERE slug = 'a-propos'").length, 2);
    assert.match(await text("/a-propos"), /Texte principal/);
    assert.doesNotMatch(await text("/a-propos"), /Texte Alpha|Texte Beta/);
  });

  test("support : tickets et compteurs par site ; un ticket d'un autre site est introuvable, jamais modifiable", async () => {
    const student = await require("./helpers").newStudent(srv);
    const sid = one("SELECT id FROM users WHERE role = 'etudiant' ORDER BY id DESC").id;
    const inst = one("SELECT id FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").id;
    const ticket = (subject, site) => { const id = Number(db.prepare("INSERT INTO support_tickets (user_id, instructor_id, subject, site_id) VALUES (?, ?, ?, ?)").run(sid, inst, subject, site).lastInsertRowid); db.prepare("INSERT INTO support_messages (ticket_id, author_id, is_staff, body) VALUES (?, ?, 0, 'Bonjour, besoin d''aide')").run(id, sid); return id; };
    const tp = ticket("Ticket principal", null), ta = ticket("Ticket Alpha", siteA), tb = ticket("Ticket Beta", siteB);
    assert.ok(student);
    const listA = await text(`/formateur/gestion/support?site=${siteA}`);
    assert.match(listA, /Ticket Alpha/); assert.doesNotMatch(listA, /Ticket Beta|Ticket principal/);
    assert.equal((await prof.get(`/formateur/gestion/support/${tb}?site=${siteA}`)).status, 404);
    assert.equal((await prof.post(`/formateur/gestion/support/${tb}/fermer?site=${siteA}`, {})).status, 404);
    assert.equal(one("SELECT status FROM support_tickets WHERE id = ?", tb).status, "open");
    assert.equal((await prof.post(`/formateur/gestion/support/${ta}/fermer?site=${siteA}`, {})).status, 302);
    assert.equal(one("SELECT status FROM support_tickets WHERE id = ?", ta).status, "closed");
    assert.ok(tp);
    await prof.get("/formateur/gestion/support?site=principal");
  });

  test("support public : un ticket ouvert sur une formation prend le site de cette formation", async () => {
    const c = one("SELECT id FROM courses WHERE title = 'Formation Alpha'");
    const e = await require("./helpers").newStudent(srv);
    const uid = one("SELECT id FROM users WHERE role = 'etudiant' ORDER BY id DESC").id;
    db.prepare("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)").run(uid, c.id);
    const r = await e.post("/support", { subject: "Question sur Alpha", message: "Bonjour, une question sur ce cours.", course_id: String(c.id) });
    assert.ok([200, 302].includes(r.status), `statut ${r.status}`);
    const t = one("SELECT site_id FROM support_tickets WHERE subject = 'Question sur Alpha'");
    assert.ok(t, "ticket créé");
    assert.equal(t.site_id, siteA);
  });

  test("journal : chaque opération est rattachée au site actif ; la page ne montre que le site sélectionné", async () => {
    const a = one("SELECT site_id FROM audit_log WHERE action = 'course.created' AND summary LIKE '%Formation Alpha%'");
    assert.equal(a.site_id, siteA);
    const p = one("SELECT site_id FROM audit_log WHERE action = 'course.created' AND summary LIKE '%Formation du principal%'");
    assert.equal(p.site_id, null);
    const logA = await text(`/formateur/gestion/journal?site=${siteA}`);
    assert.match(logA, /Formation Alpha/); assert.doesNotMatch(logA, /Formation Beta|Formation du principal/);
    assert.match(await text("/formateur/gestion/journal?site=principal"), /Formation du principal/);
    assert.doesNotMatch(await text("/formateur/gestion/journal?site=principal"), /Formation Alpha/);
  });

  test("blog : la liste ne montre que les articles du site sélectionné ; l'éditeur s'ouvre sur n'importe quel article du créateur", async () => {
    const mk = (title, site) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, author_id) VALUES (?, ?, '<p>x</p>', 0, 'draft', 1)").run(title.toLowerCase().replace(/\W+/g, "-"), title).lastInsertRowid); if (site) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(id, orgId, site); return id; };
    const pb = mk("Billet principal", null), ba = mk("Billet Alpha", siteA), bb = mk("Billet Beta", siteB);
    const listA = await text(`/formateur/blog?site=${siteA}`);
    assert.match(listA, /Billet Alpha/); assert.doesNotMatch(listA, /Billet Beta|Billet principal/);
    assert.match(await text("/formateur/blog?site=principal"), /Billet principal/);
    await prof.get(`/formateur/blog?site=${siteA}`);
    assert.equal((await prof.get(`/formateur/blog/${bb}/modifier`)).status, 200, "l'éditeur s'ouvre par identifiant (contrat historique : il porte lui-même le site de l'article)");
    assert.ok(pb && ba);
    await prof.get("/formateur/blog?site=principal");
  });

  test("vue d'ensemble et Centre de gestion : compteurs du site sélectionné (formations, élèves, ventes, ressources)", async () => {
    const ovA = await text(`/formateur?site=${siteA}`);
    assert.match(ovA, /Formation Alpha/); assert.doesNotMatch(ovA, /Formation Beta/);
    const g = await prof.get(`/formateur/gestion?site=${siteB}`);
    assert.equal(g.status, 200);
    for (const url of ["ventes", "eleves", "analytics", "ressources", "activite"]) assert.equal((await prof.get(`/formateur/gestion/${url}?site=${siteB}`)).status, 200, url);
    const orders = (await prof.get(`/formateur/gestion/ventes/commandes/999999?site=${siteB}`)).status;
    assert.equal(orders, 404);
    await prof.get("/formateur?site=principal");
  });

  test("SEO : un site secondaire ouvre son espace SEO propre ; les écritures centrales sont refusées depuis ce site", async () => {
    await prof.get(`/formateur?site=${siteA}`);
    const g = await prof.get("/formateur/seo/redirections");
    assert.equal(g.status, 302);
    assert.equal(g.location, `/marketing/site-web/sites/${siteA}/seo`);
    const before = one("SELECT COUNT(*) n FROM seo_redirects").n;
    const w = await prof.post("/formateur/seo/redirections", { source: "/a", target: "/b", status: "301" });
    assert.equal(w.status, 409);
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects").n, before);
    await prof.get("/formateur?site=principal");
    assert.equal((await prof.get("/formateur/seo")).status, 200, "le site principal garde la suite SEO centrale");
  });

  test("apparence : le thème personnel reste global ; le site sélectionné a son lien vers le personnalisateur du site", async () => {
    const html = await text(`/formateur/apparence?site=${siteA}`);
    assert.match(html, /Apparence du site « Site Alpha »/);
    assert.match(html, new RegExp(`/marketing/site-web/personnaliser\\?site=${siteA}`));
    assert.match(html, /theme-grid/, "les préférences du compte restent proposées");
    await prof.get("/formateur/apparence?site=principal");
  });

  test("marketing : aucune route ni fichier de vue du module Marketing n'a été modifié par cette fonctionnalité", () => {
    const { execFileSync } = require("node:child_process");
    const changed = execFileSync("git", ["diff", "--name-only", "HEAD", "--", "src/marketing/web", "views/marketing"], { cwd: path.join(__dirname, "..") }).toString().split("\n").filter(Boolean);
    const mine = changed.filter((f) => !/funnel|tunnel/i.test(f)); // chantier « tunnel de paiement » antérieur et distinct
    assert.deepEqual(mine, []);
  });
});

describe("Administration par site : layout pleine largeur", () => {
  test("la zone de contenu n'est plus plafonnée à 1240 px ni centrée ; elle peut rétrécir sans déborder", () => {
    const css = read("public", "css", "dashboard.css");
    const rule = css.match(/\.dash-content \{[^}]*\}/)[0];
    assert.doesNotMatch(rule, /max-width:\s*1240px/);
    assert.match(rule, /max-width:\s*none/);
    assert.match(rule, /min-width:\s*0/);
    assert.doesNotMatch(rule, /margin:\s*0 auto/);
  });
  test("sélecteur : styles responsives (liste dans la largeur de l'écran, cibles 44 px), aucune couleur écrite en dur", () => {
    const css = read("public", "css", "dashboard.css");
    const block = css.slice(css.indexOf("Sélecteur de site universel"));
    assert.match(block, /min-height:\s*44px/);
    assert.match(block, /max-width:\s*760px/);
    assert.match(block, /calc\(100vw/);
    assert.doesNotMatch(block.replace(/rgba?\([^)]*\)/g, ""), /#[0-9a-fA-F]{3,8}\b/);
  });
});
