// Marketing — pages d'atterrissage (point 6 de la parité Mailchimp) : pages /p/<adresse> faites de sections, publiées
// après contrôle, inscription par un formulaire existant + étiquettes de la page, statistiques réelles.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const forms = require("../src/marketing/forms");
const landing = require("../src/marketing/landing");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
let srv, boss, db, pageId, slug, formId, course;
const sql = (q, ...a) => db.prepare(q).all(...a);
const pageRow = () => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(pageId);
const sectionsOf = () => JSON.parse(pageRow().sections);
// Formulaire de l'éditeur tel que le navigateur l'enverrait (champs « sections[i][…] »)
function editorBody(over = {}, sections = sectionsOf()) {
  const p = pageRow();
  const body = { name: p.name, slug: p.slug, title: p.title, description: p.description, form_id: p.form_id ? String(p.form_id) : "", tags: JSON.parse(p.tags).join(", "), theme_accent: "#0277b6", theme_background: "#f3f8fc", theme_text: "#10222f", action: "save" };
  sections.forEach((s, i) => {
    for (const [k, v] of Object.entries(s)) body[`sections[${i}][${k}]`] = Array.isArray(v) ? v.join("\n") : String(v);
    if (s.type === "hero") body[`sections[${i}][imageUrl]`] = s.image || "";
    if (s.type === "image") body[`sections[${i}][srcUrl]`] = s.src || "";
  });
  return { ...body, ...over };
}
const flash = async (c) => { const r = await c.get(`/marketing/pages/${pageId}`); return (r.text.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [r.text])[0]; };

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  course = await createCourse(boss, srv, { title: "Photo pour débutants", price: 30 });
  db.exec("INSERT INTO mk_lists (organization_id, name) VALUES (1, 'Prospects')");
  const listId = db.prepare("SELECT id FROM mk_lists WHERE name = 'Prospects'").get().id;
  const ctx = { db, organizationId: 1, userId: null };
  const f = forms.createForm(ctx, { name: "Guide photo", fields: ["first_name"], consentText: "Oui, envoyez-moi le guide et les conseils photo.", listId });
  formId = f.id;
  db.prepare("UPDATE mk_forms SET tags = '[\"guide-photo\"]' WHERE id = ?").run(formId);
});
after(() => srv.stop());

describe("création et composition", () => {
  test("créer une page : brouillon avec un bandeau et une section d'inscription, adresse dérivée du nom", async () => {
    const r = await boss.post("/marketing/pages", { name: "Guide gratuit : la photo" });
    assert.match(r.location, /^\/marketing\/pages\/\d+$/);
    pageId = Number(r.location.match(/(\d+)$/)[1]);
    assert.equal(pageRow().status, "draft");
    assert.equal(pageRow().slug, "guide-gratuit-la-photo");
    slug = pageRow().slug;
    assert.deepEqual(sectionsOf().map((s) => s.type), ["hero", "form"]);
    assert.equal((await boss.get(r.location)).status, 200);
    assert.equal((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).status, 404, "brouillon : jamais en ligne");
  });

  test("ajouter, déplacer, supprimer : la saisie en cours est enregistrée avec l'action", async () => {
    for (const t of ["text", "list", "course", "button", "quote"]) {
      const r = await boss.post(`/marketing/pages/${pageId}`, editorBody({ action: `add:${t}` }));
      assert.match(r.location, new RegExp(`#section-${sectionsOf().length - 1}$`));
    }
    assert.deepEqual(sectionsOf().map((s) => s.type), ["hero", "form", "text", "list", "course", "button", "quote"]);
    const edited = sectionsOf(); edited[0].title = "Titre modifié avant de déplacer";
    await boss.post(`/marketing/pages/${pageId}`, editorBody({ action: "down:0" }, edited));
    assert.deepEqual(sectionsOf().map((s) => s.type).slice(0, 2), ["form", "hero"]);
    assert.equal(sectionsOf()[1].title, "Titre modifié avant de déplacer", "modification conservée");
    await boss.post(`/marketing/pages/${pageId}`, editorBody({ action: "up:1" }));
    await boss.post(`/marketing/pages/${pageId}`, editorBody({ action: "remove:6" }));
    assert.deepEqual(sectionsOf().map((s) => s.type), ["hero", "form", "text", "list", "course", "button"]);
  });

  test("validation stricte : liens et images sûrs, description d'image, adresse unique, 5 étiquettes", async () => {
    const before = pageRow().sections;
    const tryBody = async (mutate, over = {}) => { const s = sectionsOf(); mutate(s); await boss.post(`/marketing/pages/${pageId}`, editorBody(over, s)); return pageRow().sections; };
    for (const url of ["javascript:alert(1)", "http://non-securise.fr", "//autre-site.fr", "https://user@evil.fr", "data:text/html,x"]) {
      assert.equal(await tryBody((s) => { s[5].url = url; }), before, `refusé : ${url}`);
    }
    assert.equal(await tryBody((s) => { s.push({ type: "image", src: "https://img.fr/a.jpg", alt: "" }); }), before, "image sans description refusée");
    assert.equal(await tryBody((s) => { s[0].image = "file:///etc/passwd"; }), before);
    assert.equal(await tryBody(() => {}, { slug: "Pas Valide!" }), before);
    assert.equal(await tryBody(() => {}, { tags: "a, b, c, d, e, f" }), before);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug) VALUES (1, 'Autre', 'deja-prise')").run();
    await boss.post(`/marketing/pages/${pageId}`, editorBody({ slug: "deja-prise" }));
    assert.equal(pageRow().slug, slug, "adresse déjà utilisée : refusée");
    // Lien interne et https acceptés ; texte et titre jamais interprétés comme du HTML
    const ok = sectionsOf();
    ok[5].url = "/catalogue";
    ok[2].markdown = "Bonjour <script>alert(1)</script> **gras**";
    ok[0].title = "<img src=x onerror=alert(1)>";
    await boss.post(`/marketing/pages/${pageId}`, editorBody({ tags: "page-photo, prospect", form_id: String(formId) }, ok));
    assert.equal(sectionsOf()[5].url, "/catalogue");
    assert.deepEqual(JSON.parse(pageRow().tags), ["page-photo", "prospect"]);
  });
});

describe("publication, page publique et statistiques", () => {
  test("publication refusée tant que le formulaire n'est pas publié ; puis en ligne, non indexée, contenu échappé", async () => {
    await boss.post(`/marketing/pages/${pageId}/publier`, {});
    assert.equal(pageRow().status, "draft");
    assert.match(await flash(boss), /n(&#39;|')est pas publié/);
    forms.setStatus({ db, organizationId: 1, userId: null }, formId, "published");
    await boss.post(`/marketing/pages/${pageId}/publier`, {});
    assert.equal(pageRow().status, "published");
    const pub = await new Client(srv.base).get(`/p/${slug}`, { headers: UA });
    assert.equal(pub.status, 200);
    assert.match(pub.text, /<meta name="robots" content="noindex, nofollow">/);
    assert.match(pub.text, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(pub.text, /<script>alert\(1\)<\/script>/);
    assert.match(pub.text, /<strong>gras<\/strong>/);
    assert.match(pub.text, /Photo pour débutants/, "formation lue dans le catalogue");
    assert.match(pub.text, /Oui, envoyez-moi le guide/, "case de consentement du formulaire");
  });

  test("visites : un visiteur compté une fois par jour, robots exclus ; clics suivis vers le lien enregistré uniquement", async () => {
    const v = new Client(srv.base);
    await v.get(`/p/${slug}`, { headers: UA });
    await v.get(`/p/${slug}`, { headers: UA });
    await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": "Googlebot/2.1" } });
    const r = landing.pageReport({ db, organizationId: 1 }, pageId);
    assert.equal(r.visitors, 1, "même visiteur, même jour : un seul visiteur unique");
    assert.equal(r.views, 3, "visites : les 2 de ce visiteur + celle du test précédent (les robots non comptés)");
    const html = (await v.get(`/p/${slug}`, { headers: UA })).text;
    const links = [...html.matchAll(/href="(\/p\/[^"]+\/clic\/\d+)"/g)].map((m) => m[1]);
    assert.ok(links.length >= 2);
    const course_ = await v.get(links[0], { headers: UA });
    assert.equal(course_.location, `/cours/${course.slug}`);
    const btn = await v.get(links[1], { headers: UA });
    assert.equal(btn.location, "/catalogue");
    assert.equal((await v.get(`/p/${slug}/clic/99`, { headers: UA })).location, `/p/${slug}`, "numéro inconnu : retour à la page, jamais ailleurs");
    assert.equal(landing.pageReport({ db, organizationId: 1 }, pageId).clicks.reduce((s, c) => s + c.n, 0), 2);
  });

  test("inscription : consentement exigé ; contact abonné, dans la liste, avec les étiquettes du formulaire ET de la page ; conversion", async () => {
    const v = new Client(srv.base);
    const refused = await v.post(`/p/${slug}/inscription`, { email: "lectrice@ex.fr", first_name: "Awa" }, { headers: UA });
    assert.equal(refused.status, 400);
    const ok = await v.post(`/p/${slug}/inscription`, { email: "lectrice@ex.fr", first_name: "Awa", consent: "1", tz: "Africa/Kinshasa" }, { headers: UA });
    assert.equal(ok.location, `/p/${slug}?inscrit=1#inscription`);
    const c = db.prepare("SELECT * FROM mk_contacts WHERE email = 'lectrice@ex.fr'").get();
    assert.equal(c.status, "subscribed");
    assert.equal(c.timezone, "Africa/Kinshasa");
    const tags = sql("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? ORDER BY t.name", c.id).map((t) => t.name);
    assert.deepEqual(tags, ["guide-photo", "page-photo", "prospect"]);
    assert.ok(db.prepare("SELECT 1 FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id WHERE m.contact_id = ? AND l.name = 'Prospects'").get(c.id));
    assert.match((await v.get(`/p/${slug}?inscrit=1`, { headers: UA })).text, /role="status"/);
    const r = landing.pageReport({ db, organizationId: 1 }, pageId);
    assert.equal(r.signups, 1);
    assert.equal(r.conversion, 100, "1 inscription pour 1 visiteur unique (tous les essais viennent du même poste, même navigateur, même jour)");
    // Robot (champ piège) : faux succès, rien d'enregistré
    await v.post(`/p/${slug}/inscription`, { email: "robot@ex.fr", consent: "1", website: "http://spam" }, { headers: UA });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'robot@ex.fr'").get().n, 0);
  });

  test("formation dépubliée : sa section disparaît (jamais de lien mort) ; mise hors ligne : 404", async () => {
    db.prepare("UPDATE courses SET published = 0 WHERE id = ?").run(course.id);
    assert.doesNotMatch((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text, /Photo pour débutants/);
    db.prepare("UPDATE courses SET published = 1 WHERE id = ?").run(course.id);
    await boss.post(`/marketing/pages/${pageId}/depublier`, {});
    assert.equal((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).status, 404);
    assert.equal((await boss.get(`/marketing/pages/${pageId}/apercu`)).status, 200, "l'aperçu reste disponible pour l'équipe");
  });
});

describe("droits", () => {
  test("élève refusé ; lecteur : consultation sans modification", async () => {
    const student = await newStudent(srv);
    assert.equal((await student.get("/marketing/pages")).status, 403);
    const viewer = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(viewer.email);
    assert.equal((await viewer.get("/marketing/pages")).status, 200);
    assert.equal((await viewer.post(`/marketing/pages/${pageId}/publier`, {})).status, 403);
    assert.equal((await viewer.post("/marketing/pages", { name: "Pirate" })).status, 403);
  });
});
