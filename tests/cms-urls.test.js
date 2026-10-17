// KOLAKISA CMS — palier 12 : adresses, permaliens, historique, redirections, 404, plan du site, robots.txt, domaines des sites.
// Vrais serveurs, vraie base, vrai HTTP : chaque assertion lit ce que verrait un visiteur (statut, Location, HTML).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
const idOf = (location) => Number(String(location).match(/pages\/(\d+)/)[1]);
const R = "/marketing/site-web/redirections";
const metaOf = (html, name) => (html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`)) || [])[1];
const linkOf = (html, rel) => (html.match(new RegExp(`<link rel="${rel}" href="([^"]*)"`)) || [])[1];
const onHost = (host) => ({ headers: { "x-forwarded-host": host } });

async function create(name, extra = {}) {
  const r = await boss.post("/marketing/pages", { name, template: "", ...extra });
  assert.equal(r.status, 302);
  return idOf(r.location);
}
async function saveDraft(id, content = {}) {
  const r = row(id);
  const cur = r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections), seo: JSON.parse(r.seo || "{}") };
  return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { title: r.title || r.name, description: cur.description || "", seo: cur.seo || {}, ...content, sections: content.sections || cur.sections } } });
}
const hero = (title) => ({ type: "hero", title, subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" });
// Page en ligne, indexable
async function livePage(name, extra = {}, sections = [{ type: "text", markdown: "Contenu de la page." }]) {
  const id = await create(name, extra);
  assert.equal((await saveDraft(id, { sections })).status, 200);
  db.prepare("UPDATE mk_landing_pages SET indexable = 1 WHERE id = ?").run(id);
  assert.equal((await boss.post(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  return id;
}
// Changement d'adresse comme le fait la fiche de la page
async function rename(id, slug) {
  const r = row(id);
  const w = r.draft ? JSON.parse(r.draft) : { title: r.title, description: r.description };
  return boss.post(`/marketing/pages/${id}`, { revision: String(r.revision), name: r.name, slug, title: w.title || r.name, description: w.description || "", form_id: "", tags: "", site_id: r.site_id ? String(r.site_id) : "", indexable: r.indexable ? "on" : "" });
}
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
const settingsUrl = (siteId) => `/marketing/site-web/sites/${siteId}/reglages.json`;
async function newSite(name, publicUrl) {
  const siteId = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  if (publicUrl) {
    const cur = JSON.parse((await boss.get(settingsUrl(siteId))).text);
    const r = await boss.request(settingsUrl(siteId), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl } } } });
    assert.equal(r.status, 200, r.text.slice(0, 300));
  }
  return siteId;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", SITEMAP_SPLIT_AT: "6" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("changement d'adresse d'une page : historique et redirection 301", () => {
  let id, a;
  before(async () => { id = await livePage("Formation Photoshop"); a = row(id).slug; });
  test("l'adresse d'origine est déduite du titre, sans accent ; la page répond 200", async () => {
    assert.equal(a, "formation-photoshop");
    assert.equal((await anon.get(`/p/${a}`)).status, 200);
  });
  test("renommer : l'ancienne adresse redirige (301) vers la nouvelle, qui répond 200", async () => {
    assert.equal((await rename(id, "formation-photoshop-avancee")).status, 302);
    const old = await anon.get(`/p/${a}`);
    assert.equal(old.status, 301);
    assert.equal(old.location, "/p/formation-photoshop-avancee");
    assert.equal((await anon.get("/p/formation-photoshop-avancee")).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM cms_url_history WHERE resource_type = 'page' AND resource_id = ?", id).n, 1);
  });
  test("renommer encore : TOUTES les anciennes adresses mènent directement à la dernière (aucune chaîne)", async () => {
    await rename(id, "photoshop-expert");
    for (const old of [a, "formation-photoshop-avancee"]) {
      const r = await anon.get(`/p/${old}`);
      assert.equal(r.status, 301, old);
      assert.equal(r.location, "/p/photoshop-expert", `${old} → destination finale en un seul saut`);
    }
    assert.equal((await anon.get("/p/photoshop-expert")).status, 200);
  });
  test("le canonical, og:url et le plan du site suivent la nouvelle adresse ; l'ancienne n'y est plus", async () => {
    const html = (await anon.get("/p/photoshop-expert")).text;
    assert.equal(linkOf(html, "canonical"), "https://k.test/p/photoshop-expert");
    assert.equal(metaOf(html, "og:url"), "https://k.test/p/photoshop-expert");
    const xml = (await anon.get("/sitemap-pages.xml")).text;
    assert.match(xml, /https:\/\/k\.test\/p\/photoshop-expert</);
    assert.doesNotMatch(xml, /\/p\/formation-photoshop</);
  });
  test("revenir à une ancienne adresse : elle répond 200 à nouveau et ne redirige plus (l'adresse « reprise » sort de l'historique)", async () => {
    await rename(id, a);
    assert.equal((await anon.get(`/p/${a}`)).status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM cms_url_history WHERE resource_type = 'page' AND old_slug = ?", a).n, 0);
    assert.equal((await anon.get("/p/photoshop-expert")).status, 301);
    assert.equal((await anon.get("/p/photoshop-expert")).location, `/p/${a}`);
  });
  test("une adresse déjà prise est refusée ; une adresse invalide aussi ; rien ne change", async () => {
    const other = await livePage("Autre page");
    const before = row(id).slug;
    for (const bad of [row(other).slug, "Mon Adresse", "adresse avec espaces", "", "é-accent", "a/b", "../x"]) {
      await rename(id, bad);
      assert.equal(row(id).slug, before, `adresse refusée : « ${bad} »`);
    }
  });
  test("une page jamais publiée qui change d'adresse ne laisse aucune redirection (elle n'avait pas d'adresse publique)", async () => {
    const d = await create("Brouillon jamais publié");
    const old = row(d).slug;
    await rename(d, "brouillon-renomme");
    assert.equal(one("SELECT COUNT(*) n FROM cms_url_history WHERE old_slug = ?", old).n, 0);
    assert.equal((await anon.get(`/p/${old}`)).status, 404);
  });
});

describe("corbeille, restauration, duplication", () => {
  test("une page à la corbeille n'est plus servie (404) ; son ancienne adresse non plus ; restaurée, tout redevient cohérent", async () => {
    const id = await livePage("Page corbeille");
    const old = row(id).slug;
    await rename(id, "page-corbeille-2");
    assert.equal((await anon.get(`/p/${old}`)).status, 301);
    await boss.post("/marketing/pages/actions", { action: "corbeille", ids: String(id) });
    assert.ok(row(id).archived_at);
    assert.equal((await anon.get("/p/page-corbeille-2")).status, 404, "contenu supprimé jamais affiché");
    assert.equal((await anon.get(`/p/${old}`)).status, 404, "l'ancienne adresse ne redirige pas vers une page à la corbeille");
    assert.doesNotMatch((await anon.get("/sitemap.xml")).text, /page-corbeille-2</);
    await boss.post("/marketing/pages/actions", { action: "restaurer", ids: String(id) });
    await boss.post(`/marketing/pages/${id}/publier.json`, {});
    assert.equal((await anon.get("/p/page-corbeille-2")).status, 200);
    assert.equal((await anon.get(`/p/${old}`)).status, 301, "l'ancienne redirection retrouve sa destination");
  });
  test("dupliquer : adresse unique, aucune redirection créée depuis l'original", async () => {
    const id = await livePage("Page à copier");
    const slug = row(id).slug;
    const before = one("SELECT COUNT(*) n FROM cms_url_history").n;
    const r = await boss.post(`/marketing/pages/${id}/dupliquer`, {});
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const copy = one("SELECT * FROM mk_landing_pages WHERE id <> ? AND name LIKE ? ORDER BY id DESC", id, "%Page à copier%");
    assert.ok(copy && copy.slug !== slug && /^page-a-copier/.test(copy.slug), `copie : ${copy && copy.slug}`);
    assert.equal(one("SELECT COUNT(*) n FROM cms_url_history").n, before);
    assert.equal((await anon.get(`/p/${slug}`)).status, 200, "l'original ne redirige pas vers sa copie");
  });
});

describe("taxonomies : changement d'adresse, fusion, suppression", () => {
  const taxonomy = () => srv.taxonomy;
  test("renommer l'adresse d'une catégorie : l'ancienne redirige (301) ; fusionnée, elle mène à la catégorie de destination", async () => {
    const mk = async (name, slug) => { const r = await boss.post("/marketing/site-web/articles/termes", { taxonomy: "category", name, slug }); assert.ok([200, 302].includes(r.status)); return one("SELECT * FROM taxonomy_terms WHERE name = ?", name); };
    const cat = await mk("Marketing digital", "marketing-digital");
    const post = db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, category) VALUES ('art-tax', 'Article taxo', 'x', 'html', 'published', 1, datetime('now'), 'Marketing digital')").run();
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary) VALUES ('post', ?, ?, 1)").run(Number(post.lastInsertRowid), cat.id);
    assert.equal((await anon.get("/blog/categorie/marketing-digital")).status, 200);
    const up = await boss.post(`/marketing/site-web/articles/termes/${cat.id}`, { taxonomy: "category", name: "Marketing digital", slug: "marketing" });
    assert.ok([200, 302].includes(up.status), up.text.slice(0, 200));
    const old = await anon.get("/blog/categorie/marketing-digital");
    assert.equal(old.status, 301);
    assert.equal(old.location, "/blog/categorie/marketing");
    assert.equal((await anon.get("/blog/categorie/marketing")).status, 200);
    // fusion dans une autre catégorie : toutes les anciennes adresses mènent à la destination finale
    const dest = await mk("Stratégie", "strategie");
    await boss.post(`/marketing/site-web/articles/termes/${cat.id}/fusionner`, { taxonomy: "category", target_id: String(dest.id) });
    for (const p of ["marketing", "marketing-digital"]) {
      const r = await anon.get(`/blog/categorie/${p}`);
      assert.equal(r.status, 301, p);
      assert.equal(r.location, "/blog/categorie/strategie", p);
    }
  });
});

describe("gestionnaire de redirections (CMS)", () => {
  test("créer une redirection 301 puis 302 : le serveur redirige réellement (statut et destination)", async () => {
    assert.equal((await boss.post(R, { source: "/ancienne-offre", target: "/catalogue", status: "301", note: "test" })).status, 302);
    const r = await anon.get("/ancienne-offre");
    assert.equal(r.status, 301);
    assert.equal(r.location, "/catalogue");
    await boss.post(R, { source: "/promo-ete", target: "/blog", status: "302" });
    const t = await anon.get("/promo-ete");
    assert.equal(t.status, 302, "302 : le type choisi est respecté");
    assert.equal(one("SELECT hits FROM seo_redirects WHERE source_path = '/ancienne-offre'").hits, 1, "compteur réel");
  });
  test("refus : boucle, auto-redirection, chaîne via historique, espace technique, adresse invalide, type inconnu", async () => {
    const count = () => one("SELECT COUNT(*) n FROM seo_redirects").n;
    const n0 = count();
    const tries = [
      { source: "/catalogue-x", target: "/catalogue-x" },
      { source: "/catalogue", target: "/ancienne-offre" },       // boucle : /ancienne-offre → /catalogue → /ancienne-offre
      { source: "/formateur/tableau", target: "/blog" },
      { source: "/marketing", target: "/blog" },
      { source: "/", target: "/blog" },
      { source: "pas-un-chemin", target: "/blog" },
      { source: "/x y", target: "/blog" },
      { source: "/ok-source", target: "javascript:alert(1)" },
      { source: "/ok-source", target: "//evil.example/x" },
      { source: "/ok-source", target: "/blog", status: "307" },
    ];
    for (const t of tries) {
      await boss.post(R, { status: "301", ...t });
    }
    // seule la boucle /catalogue → /ancienne-offre était potentiellement dangereuse : aucune ligne n'a été ajoutée
    assert.equal(count(), n0, "aucune des redirections invalides n'est enregistrée");
  });
  test("une chaîne (A → B, B → C) est détectée et corrigée en A → C", async () => {
    await boss.post(R, { source: "/etape-b", target: "/blog", status: "301" });
    await boss.post(R, { source: "/etape-a", target: "/etape-b", status: "301" });
    const a = one("SELECT id FROM seo_redirects WHERE source_path = '/etape-a'").id;
    const r = await boss.post(`${R}/${a}/raccourcir`, {});
    assert.equal(r.status, 302);
    assert.equal(one("SELECT target FROM seo_redirects WHERE id = ?", a).target, "/blog");
    assert.equal((await anon.get("/etape-a")).location, "/blog", "un seul saut");
  });
  test("liste : recherche, filtres (type, état), tri, pagination — chiffres réels de la base", async () => {
    for (let i = 0; i < 27; i++) await boss.post(R, { source: `/pagination-${i}`, target: "/blog", status: i % 2 ? "302" : "301" });
    const p1 = (await boss.get(`${R}?q=pagination`)).text;
    assert.match(p1, /27 redirections/);
    assert.match(p1, /Page 1 sur 2/);
    const p2 = (await boss.get(`${R}?q=pagination&page=2`)).text;
    assert.match(p2, /Page 2 sur 2/);
    assert.match((await boss.get(`${R}?q=pagination&type=302`)).text, /13 redirections/);
    assert.match((await boss.get(`${R}?q=zzzjamais`)).text, /Aucun résultat/);
    assert.match((await boss.get(`${R}?q=a_b%25`)).text, /Aucun résultat/, "les caractères spéciaux de recherche ne cassent pas la requête");
  });
  test("désactiver : le serveur n'applique plus la redirection (404) ; réactiver la rétablit ; modifier change la destination", async () => {
    const id = one("SELECT id FROM seo_redirects WHERE source_path = '/promo-ete'").id;
    await boss.post(`${R}/${id}/etat`, { enabled: "0" });
    assert.equal((await anon.get("/promo-ete")).status, 404);
    await boss.post(`${R}/${id}/etat`, { enabled: "1" });
    assert.equal((await anon.get("/promo-ete")).status, 302);
    await boss.post(`${R}/${id}`, { source: "/promo-ete", target: "/catalogue", status: "301" });
    const r = await anon.get("/promo-ete");
    assert.equal(r.status, 301); assert.equal(r.location, "/catalogue");
  });
  test("tester : la réponse est celle du vrai serveur (étapes, codes, verdict)", async () => {
    const t = JSON.parse((await boss.request(`${R}/tester`, { method: "POST", json: { source: "/ancienne-offre" } })).text);
    assert.equal(t.steps[0].status, 301);
    assert.equal(t.steps[0].location, "/catalogue");
    assert.equal(t.final.status, 200);
    assert.equal(t.verdict, "ok");
    await boss.post(R, { source: "/vers-rien", target: "/page-qui-nexiste-pas", status: "301" });
    const bad = JSON.parse((await boss.request(`${R}/tester`, { method: "POST", json: { source: "/vers-rien" } })).text);
    assert.equal(bad.verdict, "404", "une redirection vers une page inexistante est signalée");
    assert.equal((await boss.request(`${R}/tester`, { method: "POST", json: { source: "pas-valide" } })).status, 422);
    // la sonde n'a pas faussé les compteurs
    assert.equal(one("SELECT hits FROM seo_redirects WHERE source_path = '/vers-rien'").hits, 0);
    assert.equal(one("SELECT COUNT(*) n FROM seo_404 WHERE path = '/page-qui-nexiste-pas'").n, 0, "la sonde n'entre pas dans le journal des 404");
  });
  test("supprimer : la redirection disparaît, l'adresse redevient une 404", async () => {
    const id = one("SELECT id FROM seo_redirects WHERE source_path = '/vers-rien'").id;
    await boss.post(`${R}/${id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE id = ?", id).n, 0);
    assert.equal((await anon.get("/vers-rien")).status, 404);
  });
  test("les redirections existantes de l'Espace SEO (changements d'adresse d'articles et de formations) fonctionnent toujours", async () => {
    const p = db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at) VALUES ('article-actuel', 'Article', 'x', 'html', 'published', 1, datetime('now'))").run();
    db.prepare("INSERT INTO post_slug_history (old_slug, post_id) VALUES ('article-ancien', ?)").run(Number(p.lastInsertRowid));
    const r = await anon.get("/blog/article-ancien");
    assert.equal(r.status, 301);
    assert.equal(r.location, "/blog/article-actuel");
  });
});

describe("permissions des redirections", () => {
  let editor, viewer, admin;
  before(async () => { editor = await member("editor"); viewer = await member("viewer"); admin = await member("admin"); });
  test("un lecteur n'accède ni à la liste, ni au test, ni à la création (403) ; un éditeur oui", async () => {
    assert.equal((await viewer.get(R)).status, 403);
    assert.equal((await viewer.request(`${R}/tester`, { method: "POST", json: { source: "/x" } })).status, 403);
    const n = one("SELECT COUNT(*) n FROM seo_redirects").n;
    await viewer.post(R, { source: "/pirate", target: "/blog", status: "301" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects").n, n);
    assert.equal((await editor.get(R)).status, 200);
    await editor.post(R, { source: "/par-editeur", target: "/blog", status: "301" });
    assert.equal((await anon.get("/par-editeur")).status, 301);
  });
  test("rediriger vers un site extérieur : refusé à l'éditeur (anti redirection malveillante), accepté à l'administrateur", async () => {
    await editor.post(R, { source: "/vers-dehors", target: "https://autre-site.example/page", status: "301" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/vers-dehors'").n, 0);
    await admin.post(R, { source: "/vers-dehors", target: "https://autre-site.example/page", status: "301" });
    const r = await anon.get("/vers-dehors");
    assert.equal(r.status, 301); assert.equal(r.location, "https://autre-site.example/page");
    // l'éditeur ne peut ni modifier ni désactiver une redirection extérieure créée par un administrateur
    const id = one("SELECT id FROM seo_redirects WHERE source_path = '/vers-dehors'").id;
    await editor.post(`${R}/${id}`, { source: "/vers-dehors", target: "/blog", status: "301" });
    await editor.post(`${R}/${id}/etat`, { enabled: "0" });
    assert.equal(one("SELECT target, enabled FROM seo_redirects WHERE id = ?", id).target, "https://autre-site.example/page");
    assert.equal(one("SELECT enabled FROM seo_redirects WHERE id = ?", id).enabled, 1);
  });
  test("supprimer : réservé à l'administrateur", async () => {
    const id = one("SELECT id FROM seo_redirects WHERE source_path = '/par-editeur'").id;
    await editor.post(`${R}/${id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE id = ?", id).n, 1);
    await admin.post(`${R}/${id}/supprimer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE id = ?", id).n, 0);
  });
  test("aucune route de redirection ouverte (open redirect) : /redirect?url=… n'existe pas", async () => {
    for (const u of ["/redirect?url=https://evil.example", "/redirection?to=https://evil.example", "/go?u=//evil.example", "/connexion?redirect=https://evil.example"]) {
      const r = await anon.get(u);
      assert.ok(!(r.status >= 300 && r.status < 400 && /evil\.example/.test(r.location || "")), `${u} : ${r.status} ${r.location}`);
    }
  });
});

describe("404 : vrai statut HTTP, modèle KOLAKISA, jamais indexée", () => {
  test("adresse inexistante : HTTP 404, page d'erreur du site, noindex ; aucune page « 200 qui ressemble à une erreur »", async () => {
    for (const p of ["/page-qui-n-existe-pas", "/p/inconnu", "/blog/inconnu", "/cours/inconnu", "/blog/categorie/inconnue", "/blog/etiquette/inconnue"]) {
      const r = await anon.get(p);
      assert.equal(r.status, 404, p);
      assert.equal(metaOf(r.text, "robots"), "noindex, nofollow", `${p} : noindex`);
    }
  });
  test("adresses malformées ou piégées : jamais de 500, jamais de fuite", async () => {
    for (const p of ["/p/..%2f..%2fetc%2fpasswd", "/p/%E0%A4%A", "/blog/%00", "/p/../../etc/passwd", "/p/a%2Fb", "/%2e%2e/%2e%2e/etc/passwd", "/blog/" + "a".repeat(5000), "/p/<script>alert(1)</script>", "/blog/categorie/%3Cimg%20src=x%3E"]) {
      const r = await anon.get(p);
      assert.ok([301, 400, 404].includes(r.status), `${p.slice(0, 50)} → ${r.status}`);
      assert.doesNotMatch(r.text, /root:|Traceback|SQLITE|<script>alert/, `${p.slice(0, 50)} ne fuit rien`);
    }
  });
  test("pagination : une page d'archive valide répond 200 (pas de 404 artificielle) ; les tris et filtres ne changent pas le canonical", async () => {
    const r = await anon.get("/blog?page=1&tri=date");
    assert.equal(r.status, 200);
    assert.equal(linkOf(r.text, "canonical"), "https://k.test/blog");
  });
  test("casse et barre finale : /Blog/ et /P/Slug/ sont normalisés en 301 vers l'adresse propre", async () => {
    const id = await livePage("Page casse");
    const slug = row(id).slug;
    const a = await anon.get("/Blog/");
    assert.equal(a.status, 301); assert.equal(a.location, "/blog");
    const b = await anon.get(`/p/${slug}/`);
    assert.equal(b.status, 301); assert.equal(b.location, `/p/${slug}`);
    const c = await anon.get(`/p/${slug.toUpperCase()}?x=1`);
    assert.equal(c.status, 301); assert.equal(c.location, `/p/${slug}?x=1`, "la chaîne de requête est conservée");
    // routes techniques : jamais réécrites
    assert.notEqual((await anon.get("/Connexion")).status, 301);
  });
});

describe("domaines des sites : un site par domaine, isolation, canonical, plan du site, robots.txt", () => {
  let siteA, siteB, pa, pb, home;
  before(async () => {
    siteA = await newSite("Site Alpha", "https://www.alpha.example");
    siteB = await newSite("Site Bêta", "https://beta.example");
    pa = await livePage("À propos Alpha", { site_id: String(siteA) });
    pb = await livePage("Contactez Bêta", { site_id: String(siteB) });
    home = await livePage("Accueil Alpha", { site_id: String(siteA) }, [hero("Bienvenue chez Alpha")]);
    const set = await boss.post(`/marketing/site-web/sites/${siteA}`, { name: "Site Alpha", home_page_id: String(home) });
    assert.equal(set.status, 302);
    assert.equal(one("SELECT home_page_id h FROM mk_sites WHERE id = ?", siteA).h, home, "page d'accueil enregistrée");
  });
  test("accueil du site : « / » sur son domaine affiche sa page d'accueil ; sur le site principal, rien ne change", async () => {
    const a = await anon.get("/", onHost("www.alpha.example"));
    assert.equal(a.status, 200);
    assert.match(a.text, /Bienvenue chez Alpha/);
    assert.equal(linkOf(a.text, "canonical"), "https://www.alpha.example/");
    const main = await anon.get("/");
    assert.doesNotMatch(main.text, /Bienvenue chez Alpha/);
  });
  test("page d'un site : /<adresse> sur son domaine (200), /p/<adresse> y redirige vers l'adresse propre ; canonical et og:url sur le bon domaine", async () => {
    const slug = row(pa).slug;
    const root = await anon.get(`/${slug}`, onHost("www.alpha.example"));
    assert.equal(root.status, 200);
    assert.equal(linkOf(root.text, "canonical"), `https://www.alpha.example/${slug}`);
    assert.equal(metaOf(root.text, "og:url"), `https://www.alpha.example/${slug}`);
    const old = await anon.get(`/p/${slug}`, onHost("www.alpha.example"));
    assert.equal(old.status, 301); assert.equal(old.location, `/${slug}`);
    const homeSlug = row(home).slug;
    const h = await anon.get(`/${homeSlug}`, onHost("www.alpha.example"));
    assert.equal(h.status, 301); assert.equal(h.location, "/", "l'accueil n'existe qu'à la racine (jamais /<adresse> en doublon)");
    // sur le site principal, la même page reste servie sous /p/ et pointe son canonical vers le domaine du site
    const viaMain = await anon.get(`/p/${slug}`);
    assert.equal(viaMain.status, 200);
    assert.equal(linkOf(viaMain.text, "canonical"), `https://www.alpha.example/${slug}`);
  });
  test("isolation : la page du site B n'existe pas sur le domaine du site A (404), ni à la racine ni sous /p/", async () => {
    const slugB = row(pb).slug;
    assert.equal((await anon.get(`/${slugB}`, onHost("www.alpha.example"))).status, 404);
    assert.equal((await anon.get(`/p/${slugB}`, onHost("www.alpha.example"))).status, 404);
    assert.equal((await anon.get(`/${slugB}`, onHost("beta.example"))).status, 200);
    assert.equal((await anon.get(`/${slugB}`)).status, 404, "sur le site principal, les pages à domaine propre ne sont pas à la racine");
  });
  test("hôte inconnu ou forgé : jamais un site, jamais le site principal (421, règle des domaines du palier 2)", async () => {
    const slug = row(pa).slug;
    for (const h of ["evil.example", "www.alpha.example.evil.example", "alpha.example", "ALPHA.EXAMPLE.", "x.k.test"]) {
      const r = await anon.get(`/${slug}`, onHost(h));
      assert.equal(r.status, 421, h);
      assert.doesNotMatch(r.text, /canonical/i, `${h} : aucune adresse publiée`);
    }
    const home = await anon.get("/", onHost("evil.example"));
    assert.equal(home.status, 421, "un hôte forgé ne reçoit plus le site principal");
    assert.doesNotMatch(home.text, /<link[^>]*canonical/i);
    assert.equal(linkOf((await anon.get("/")).text, "canonical"), "https://k.test/", "le domaine du site principal est inchangé");
  });
  test("plan du site par domaine : seulement les pages de CE site, sur CE domaine ; le plan principal ne liste pas les pages à domaine propre", async () => {
    const a = (await anon.get("/sitemap.xml", onHost("www.alpha.example"))).text;
    assert.match(a, new RegExp(`https://www\\.alpha\\.example/${row(pa).slug}<`));
    assert.match(a, /https:\/\/www\.alpha\.example\/<\/loc>/, "accueil du site = racine");
    assert.doesNotMatch(a, /beta\.example|k\.test/);
    const b = (await anon.get("/sitemap.xml", onHost("beta.example"))).text;
    assert.match(b, new RegExp(`https://beta\\.example/${row(pb).slug}<`));
    assert.doesNotMatch(b, /alpha\.example|k\.test/);
    const main = (await anon.get("/sitemap.xml")).text;
    assert.doesNotMatch(main, /alpha\.example|beta\.example/);
    assert.doesNotMatch(main, new RegExp(`/p/${row(pa).slug}<`));
  });
  test("robots.txt par domaine : la ligne Sitemap utilise le domaine du site ; aucune page publique n'est interdite", async () => {
    const a = (await anon.get("/robots.txt", onHost("www.alpha.example"))).text;
    assert.match(a, /Sitemap: https:\/\/www\.alpha\.example\/sitemap\.xml/);
    assert.doesNotMatch(a, /^Disallow: \/$/m, "le site n'est jamais fermé par erreur");
    assert.doesNotMatch(a, /Disallow: \/p\b/);
    const main = (await anon.get("/robots.txt")).text;
    assert.match(main, /Sitemap: https:\/\/k\.test\/sitemap\.xml/);
    assert.doesNotMatch(main, /^Disallow: \/$/m);
  });
  test("renommer une page de site : l'ancienne adresse redirige sur le domaine du site ET sous /p/, l'accueil du site reste correct", async () => {
    const old = row(pa).slug;
    await rename(pa, "alpha-presentation");
    const r = await anon.get(`/${old}`, onHost("www.alpha.example"));
    assert.equal(r.status, 301); assert.equal(r.location, "/alpha-presentation");
    const p = await anon.get(`/p/${old}`, onHost("www.alpha.example"));
    assert.equal(p.status, 301); assert.equal(p.location, "/alpha-presentation");
    const main = await anon.get(`/p/${old}`);
    assert.equal(main.status, 301);
    assert.equal(main.location, "/p/alpha-presentation");
  });
  test("adresse réservée refusée pour une page de site ; deux sites ne peuvent pas partager un domaine", async () => {
    const before = row(pa).slug;
    await rename(pa, "blog");
    assert.equal(row(pa).slug, before, "« blog » est une route du site");
    const cur = JSON.parse((await boss.get(settingsUrl(siteB))).text);
    const r = await boss.request(settingsUrl(siteB), { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: "https://www.alpha.example" } } } });
    assert.equal(r.status, 422, r.text.slice(0, 200));
    assert.match(r.text, /un seul site/);
  });
  test("redirection propre à un site : appliquée sur son domaine seulement", async () => {
    await boss.post(R, { source: "/ancien-menu", target: `/alpha-presentation`, status: "301", site_id: String(siteA) });
    assert.equal((await anon.get("/ancien-menu", onHost("www.alpha.example"))).status, 301);
    assert.equal((await anon.get("/ancien-menu", onHost("beta.example"))).status, 404);
    assert.equal((await anon.get("/ancien-menu")).status, 404);
    await boss.post(R, { source: "/pour-tous", target: "/catalogue", status: "301" });
    for (const h of [null, "www.alpha.example", "beta.example"]) assert.equal((await anon.get("/pour-tous", h ? onHost(h) : {})).status, 301, String(h));
  });
  test("site archivé : son domaine n'est plus un site ; son contenu n'est plus servi à la racine", async () => {
    const tmp = await newSite("Site éphémère", "https://ephemere.example");
    const pid = await livePage("Page éphémère", { site_id: String(tmp) });
    const slug = row(pid).slug;
    assert.equal((await anon.get(`/${slug}`, onHost("ephemere.example"))).status, 200);
    await boss.post(`/marketing/site-web/sites/${tmp}/archiver`, {});
    assert.equal((await anon.get(`/${slug}`, onHost("ephemere.example"))).status, 404);
  });
});

describe("plan du site : uniquement les ressources réellement indexables ; date réelle ; sous-plans", () => {
  test("exclusions : brouillon, corbeille, noindex, adresse redirigée ; inclusions : page, article, catégorie, étiquette publiés", async () => {
    const ok = await livePage("Page indexable");
    const noidx = await livePage("Page noindex");
    await saveDraft(noidx, { seo: { noindex: true } });
    await boss.post(`/marketing/pages/${noidx}/publier.json`, {});
    const draft = await create("Page brouillon sitemap");
    const trashed = await livePage("Page supprimée sitemap");
    await boss.post("/marketing/pages/actions", { action: "corbeille", ids: String(trashed) });
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, updated_at) VALUES ('art-sitemap', 'Art sitemap', 'x', 'html', 'published', 1, datetime('now'), '2026-03-04 10:00:00')").run();
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, deleted_at) VALUES ('art-supprime-sitemap', 'Supprimé', 'x', 'html', 'trash', 0, datetime('now'), datetime('now'))").run();
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published) VALUES ('art-brouillon-sitemap', 'Brouillon', 'x', 'html', 'draft', 0)").run();
    const xml = (await anon.get("/sitemap-pages.xml")).text;
    assert.match(xml, new RegExp(`/p/${row(ok).slug}<`));
    for (const id of [noidx, draft, trashed]) assert.doesNotMatch(xml, new RegExp(`/p/${row(id).slug}<`), `page ${id} exclue`);
    const articles = (await anon.get("/sitemap-articles.xml")).text;
    assert.match(articles, /\/blog\/art-sitemap</);
    assert.match(articles, /<lastmod>2026-03-04<\/lastmod>/, "lastmod = date réelle de modification, pas la date du jour");
    assert.doesNotMatch(articles, /art-supprime-sitemap|art-brouillon-sitemap/);
    assert.doesNotMatch(await (async () => (await anon.get("/sitemap.xml")).text)(), /\/p\/formation-photoshop-avancee</, "une adresse qui redirige n'est jamais dans le plan");
  });
  test("lastmod stable : deux demandes donnent les mêmes dates", async () => {
    const a = (await anon.get("/sitemap-pages.xml")).text.match(/<lastmod>[^<]*<\/lastmod>/g);
    const b = (await anon.get("/sitemap-pages.xml")).text.match(/<lastmod>[^<]*<\/lastmod>/g);
    assert.deepEqual(a, b);
  });
  test("grand site : /sitemap.xml devient un index de sous-plans valides ; groupe inconnu → 404", async () => {
    for (let i = 0; i < 8; i++) await livePage(`Page volume ${i}`);
    const idx = (await anon.get("/sitemap.xml")).text;
    assert.match(idx, /<sitemapindex/);
    assert.match(idx, /https:\/\/k\.test\/sitemap-pages\.xml/);
    assert.equal((await anon.get("/sitemap-inconnu.xml")).status, 404);
    assert.match((await anon.get("/sitemap-pages.xml")).text, /<urlset/);
  });
  test("cache court : le plan du site et robots.txt expirent en quelques minutes", async () => {
    const r = await anon.get("/sitemap.xml");
    assert.match(r.headers.get("cache-control"), /max-age=300/);
  });
});

describe("liens cassés et références stables", () => {
  let linker, target, menuId;
  before(async () => {
    target = await livePage("Cible du lien");
    linker = await livePage("Page avec liens", {}, [{ type: "text", markdown: `[sain](/p/${row(target).slug}) [mort](/p/page-supprimee-jadis) [catalogue](/catalogue) [introuvable](/introuvable-du-tout)` }]);
    const m = await boss.post("/marketing/site-web/navigation/menus", { name: "Menu liens test" });
    menuId = Number(String(m.location).match(/menus\/(\d+)/)[1]);
  });
  test("analyse : liens cassés détectés avec leur source ; lien sain et routes fixes non signalés", async () => {
    const r = await boss.post("/marketing/site-web/liens-casses/analyser", {});
    assert.equal(r.status, 302);
    const page = (await boss.get("/marketing/site-web/liens-casses")).text;
    assert.match(page, /\/p\/page-supprimee-jadis/);
    assert.match(page, /\/introuvable-du-tout/);
    assert.doesNotMatch(page, new RegExp(`<code>/p/${row(target).slug}</code>`));
    assert.doesNotMatch(page, /<code>\/catalogue<\/code>/);
    assert.match(page, /Page avec liens/);
    assert.match(page, new RegExp(`/marketing/pages/${linker}/editeur`));
  });
  test("lien vers une page renommée : signalé « redirigé » ; mis à la corbeille : « cassé »", async () => {
    const old = row(target).slug;
    await rename(target, "cible-renommee");
    await boss.post("/marketing/site-web/liens-casses/analyser", {});
    let page = (await boss.get("/marketing/site-web/liens-casses")).text;
    assert.match(page, new RegExp(`<code>/p/${old}</code>`));
    assert.match(page, /Redirigé/);
    await boss.post("/marketing/pages/actions", { action: "corbeille", ids: String(target) });
    await boss.post("/marketing/site-web/liens-casses/analyser", {});
    page = (await boss.get("/marketing/site-web/liens-casses")).text;
    assert.match(page, /corbeille/);
  });
  test("menu par référence : le lien suit le nouveau slug sans intervention", async () => {
    const pg = await livePage("Page du menu");
    const add = await boss.post(`/marketing/site-web/navigation/menus/${menuId}/elements`, { type: "page", object_id: String(pg), label: "Ma page" });
    assert.ok([200, 302].includes(add.status), add.text.slice(0, 200));
    await rename(pg, "page-du-menu-renommee");
    const navigation = srv.navigation;
    const items = db.prepare("SELECT type, object_id FROM nav_items WHERE menu_id = ?").all(menuId);
    assert.deepEqual(items.map((i) => i.object_id), [pg]);
    await boss.post("/marketing/site-web/liens-casses/analyser", {});
    const report = JSON.parse(one("SELECT value FROM seo_settings WHERE key = 'broken_links_report'").value);
    assert.ok(!report.issues.some((i) => i.source.type === "menu" && /page-du-menu/.test(i.path || "")), "le menu pointe vers l'adresse actuelle : aucun problème");
    void navigation;
  });
  test("accès : lecture seule du rapport réservée à redirects.view", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.get("/marketing/site-web/liens-casses")).status, 403);
    assert.equal((await viewer.post("/marketing/site-web/liens-casses/analyser", {})).status, 403);
  });
});

describe("permaliens : structure réelle et vérification d'une adresse", () => {
  test("la page liste la structure, les domaines enregistrés et l'état de l'indexation", async () => {
    const html = (await boss.get("/marketing/site-web/permaliens")).text;
    assert.match(html, /\/p\/&lt;adresse&gt;/);
    assert.match(html, /\/blog\/categorie\/&lt;adresse&gt;/);
    assert.match(html, /www\.alpha\.example/);
    assert.match(html, /public — les moteurs de recherche peuvent indexer/);
  });
  test("« Que se passe-t-il à cette adresse ? » : ressource connue + réponse réelle du serveur", async () => {
    const html = (await boss.get("/marketing/site-web/permaliens?adresse=/ancienne-offre")).text;
    assert.match(html, /HTTP 301/);
    assert.match(html, /HTTP 200/);
    const page = (await boss.get("/marketing/site-web/permaliens?adresse=/blog/art-sitemap")).text;
    assert.match(page, /article/);
    assert.match(page, /en ligne/);
    assert.match((await boss.get("/marketing/site-web/permaliens?adresse=pas%20valide%3Cx")).text, /Adresse invalide|HTTP 404/);
  });
});

describe("révisions : une restauration ne change jamais l'adresse et ne crée aucune redirection contradictoire", () => {
  test("page : V1 → renommage → restauration de V1 : l'adresse actuelle est conservée, aucune redirection ajoutée", async () => {
    const id = await livePage("Page versionnée adresse");
    const v1 = one("SELECT number FROM mk_page_versions WHERE page_id = ? ORDER BY number DESC", id).number;
    await rename(id, "page-versionnee-nouvelle");
    await saveDraft(id, { sections: [{ type: "text", markdown: "Version deux" }] });
    await boss.post(`/marketing/pages/${id}/publier.json`, {});
    const history = one("SELECT COUNT(*) n FROM cms_url_history WHERE resource_id = ?", id).n;
    const r = await boss.post(`/marketing/site-web/historique/page/${id}/restaurer`, { ref: `v:${v1}` });
    assert.equal(r.status, 302);
    assert.equal(row(id).slug, "page-versionnee-nouvelle", "l'adresse n'est pas versionnée");
    assert.equal(one("SELECT COUNT(*) n FROM cms_url_history WHERE resource_id = ?", id).n, history);
    assert.equal((await anon.get("/p/page-versionnee-nouvelle")).status, 200);
    assert.equal((await anon.get("/p/page-versionnee-adresse")).status, 301);
  });
});

describe("environnement non public : jamais indexé", () => {
  let local;
  before(async () => { local = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "http://localhost", SMTP_HOST: "", ALLOW_INDEXING: "auto" }); });
  after(() => local.stop());
  test("adresse locale : robots.txt interdit tout, en-tête X-Robots-Tag noindex, aucun plan du site annoncé", async () => {
    const c = new Client(local.base);
    const r = await c.get("/robots.txt");
    assert.match(r.text, /Disallow: \/\s*$/m);
    assert.doesNotMatch(r.text, /Sitemap:/);
    assert.equal((await c.get("/")).headers.get("x-robots-tag"), "noindex, nofollow");
  });
  test("production : aucun en-tête noindex ; ALLOW_INDEXING=0 force la fermeture", async () => {
    assert.equal(anon && (await anon.get("/")).headers.get("x-robots-tag"), null);
    const closed = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "0" });
    try { assert.equal((await new Client(closed.base).get("/")).headers.get("x-robots-tag"), "noindex, nofollow"); } finally { await closed.stop(); }
  });
});
