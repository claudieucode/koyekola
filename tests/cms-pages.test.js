// KOLAKISA CMS — palier 2 : le système de pages, de bout en bout, par les vraies routes d'un vrai serveur et la vraie base :
// créer → ouvrir dans le Page Builder → enregistrer → prévisualiser → publier → dupliquer → corbeille → restaurer → supprimer,
// avec recherche, filtres, tri, pagination, actions groupées, permissions, sites multiples et adresses qui changent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId;
const row = (id) => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
const idOf = (location) => Number(String(location).match(/pages\/(\d+)/)[1]);
const textSection = (markdown) => ({ type: "text", markdown });
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];

// Corps du formulaire « réglages de la page » (revision courante, nom, adresse…) avec modifications
function settings(id, over = {}) {
  const r = row(id);
  const w = r.draft ? JSON.parse(r.draft) : { title: r.title, description: r.description };
  return { revision: String(r.revision), name: r.name, slug: r.slug, title: w.title || r.name, description: w.description || "", form_id: "", tags: "", site_id: r.site_id ? String(r.site_id) : "", ...over };
}
async function create(name, extra = {}) {
  const r = await boss.post("/marketing/pages", { name, template: "", ...extra });
  assert.equal(r.status, 302, `création de « ${name} » : ${r.status}`);
  return idOf(r.location);
}
// Enregistrement du brouillon exactement comme l'éditeur visuel (PUT JSON avec la révision chargée)
async function saveDraft(client, id, sections, over = {}) {
  const r = row(id);
  return client.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { sections, title: r.title || r.name, description: "", ...over } } });
}
// Membre de l'équipe marketing avec un rôle donné
async function member(role) {
  const c = await newStudent(srv);
  const u = db.prepare("SELECT id FROM users WHERE email = ?").get(c.email);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, u.id, role);
  return c;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
});
after(() => srv.stop());

describe("créer, nommer, ouvrir dans le Page Builder", () => {
  let id;
  test("« Nouvelle page » crée une vraie page en base puis ouvre l'éditeur visuel existant dessus", async () => {
    const r = await boss.post("/marketing/pages", { name: "À propos de KOLAKISA", template: "", ouvrir: "editeur" });
    assert.equal(r.status, 302);
    assert.match(r.location, /\/marketing\/pages\/\d+\/editeur\?retour=pages$/);
    id = idOf(r.location);
    const p = row(id);
    assert.equal(p.name, "À propos de KOLAKISA");
    assert.equal(p.slug, "a-propos-de-kolakisa", "adresse déduite du titre, sans accents");
    assert.equal(p.status, "draft");
    assert.ok(p.created_by, "auteur enregistré");
    assert.equal(p.published_at, null);
  });
  test("l'éditeur charge la page et son contenu, et ramène à la liste des pages", async () => {
    const res = await boss.get(`/marketing/pages/${id}/editeur?retour=pages`);
    assert.equal(res.status, 200);
    assert.match(res.text, /class="pb-back" href="\/marketing\/pages"/);
    assert.match(res.text, /Retour aux pages/);
    assert.doesNotMatch(res.text, /is-cms/, "l'éditeur garde sa propre page");
    assert.match(res.text, new RegExp(`"id":${id}`));
  });
  test("sans le paramètre, le retour de l'éditeur reste celui d'avant (réglages de la page)", async () => {
    const res = await boss.get(`/marketing/pages/${id}/editeur`);
    assert.match(res.text, new RegExp(`class="pb-back" href="/marketing/pages/${id}"`));
  });
  test("le workflow historique (sans « ouvrir ») redirige toujours vers la fiche", async () => {
    const r = await boss.post("/marketing/pages", { name: "Fiche d'abord", template: "" });
    assert.equal(r.location, `/marketing/pages/${idOf(r.location)}`);
  });
  test("nom vide ou déjà pris : refusé, rien n'est créé", async () => {
    const before = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
    await boss.post("/marketing/pages", { name: "  ", template: "" });
    const dup = await boss.post("/marketing/pages", { name: "À propos de KOLAKISA", template: "" });
    assert.equal(dup.status, 302);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, before);
  });
});

describe("titre, adresse et enregistrement réel", () => {
  let id;
  before(async () => { id = await create("Landing Formation"); });
  test("modifier le titre et l'adresse, rafraîchir : tout est toujours là", async () => {
    const r = await boss.post(`/marketing/pages/${id}`, settings(id, { name: "Landing Formation Pro", slug: "formation-pro" }));
    assert.equal(r.status, 302);
    const p = row(id);
    assert.equal(p.name, "Landing Formation Pro");
    assert.equal(p.slug, "formation-pro");
    const html = (await boss.get(`/marketing/pages/${id}`)).text;
    assert.match(html, /Landing Formation Pro/);
    assert.match(html, /value="formation-pro"/);
  });
  test("adresse invalide ou déjà utilisée : refusée avec un message, l'ancienne est gardée", async () => {
    await create("Autre page");
    const other = db.prepare("SELECT slug FROM mk_landing_pages WHERE name = 'Autre page'").get().slug;
    for (const slug of ["Mauvaise Adresse", "avec_underscore", other]) {
      const r = await boss.post(`/marketing/pages/${id}`, settings(id, { slug }));
      assert.equal(r.status, 302);
      assert.equal(row(id).slug, "formation-pro", `adresse « ${slug} » refusée`);
    }
    assert.match(flashOf((await boss.get(`/marketing/pages/${id}`)).text), /adresse|déjà utilisée/i);
  });
  test("le Page Builder enregistre dans le brouillon ; le contenu survit au rechargement de l'éditeur", async () => {
    const r = await saveDraft(boss, id, [textSection("Contenu écrit dans le Page Builder")]);
    assert.equal(r.status, 200);
    const body = JSON.parse(r.text);
    assert.ok(body.revision > 0);
    const draft = JSON.parse(row(id).draft);
    assert.equal(draft.sections[0].markdown, "Contenu écrit dans le Page Builder");
    assert.match((await boss.get(`/marketing/pages/${id}/editeur`)).text, /Contenu écrit dans le Page Builder/);
  });
  test("erreurs de l'éditeur : conflit de révision (409), contenu invalide (422), page inconnue (404)", async () => {
    const stale = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: 0, content: { sections: [textSection("x")] } } });
    assert.equal(stale.status, 409);
    const invalid = await saveDraft(boss, id, [{ type: "inconnu" }]);
    assert.equal(invalid.status, 422);
    assert.match(JSON.parse(invalid.text).error.message, /.+/);
    assert.equal((await boss.request("/marketing/pages/999999/brouillon", { method: "PUT", json: { revision: 0, content: {} } })).status, 404);
    assert.equal(JSON.parse(row(id).draft).sections[0].markdown, "Contenu écrit dans le Page Builder", "rien n'a été écrasé");
  });
});

describe("prévisualiser et publier", () => {
  let id, slug;
  before(async () => { id = await create("Offre de lancement"); slug = row(id).slug; await saveDraft(boss, id, [textSection("Version brouillon A")]); });
  test("brouillon : visible en aperçu (vrai rendu), introuvable pour le public", async () => {
    assert.match((await boss.get(`/marketing/pages/${id}/apercu`)).text, /Version brouillon A/);
    assert.equal((await anon.get(`/p/${slug}`)).status, 404);
  });
  test("publier : statut et date réels, la page est servie au public", async () => {
    const r = await boss.post(`/marketing/pages/${id}/publier.json`, {});
    assert.equal(r.status, 200);
    const p = row(id);
    assert.equal(p.status, "published");
    assert.ok(p.published_at);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?").get(id).n, 1, "une version est gardée");
    const pub = await anon.get(`/p/${slug}`);
    assert.equal(pub.status, 200);
    assert.match(pub.text, /Version brouillon A/);
  });
  test("modifier après publication : le public garde la version publiée jusqu'à la prochaine publication", async () => {
    await saveDraft(boss, id, [textSection("Version brouillon B")]);
    assert.match((await anon.get(`/p/${slug}`)).text, /Version brouillon A/);
    assert.doesNotMatch((await anon.get(`/p/${slug}`)).text, /Version brouillon B/);
    assert.match((await boss.get(`/marketing/pages/${id}/apercu`)).text, /Version brouillon B/);
    await boss.post(`/marketing/pages/${id}/publier.json`, {});
    assert.match((await anon.get(`/p/${slug}`)).text, /Version brouillon B/);
  });
  test("changer l'adresse d'une page EN LIGNE : l'ancien lien redirige (301) vers le nouveau", async () => {
    const r = await boss.post(`/marketing/pages/${id}`, settings(id, { slug: "offre-2026" }));
    assert.equal(r.status, 302);
    const old = await anon.get(`/p/${slug}`);
    assert.equal(old.status, 301);
    assert.equal(old.location, "/p/offre-2026");
    assert.equal((await anon.get("/p/offre-2026")).status, 200);
    assert.ok(db.prepare("SELECT 1 FROM cms_url_history WHERE resource_type = 'page' AND old_slug = ? AND resource_id = ?").get(slug, id), "ancienne adresse conservée dans l'historique des adresses (palier 12)");
  });
  test("une page qui reprend l'ancienne adresse la récupère : la redirection ne la masque pas", async () => {
    const other = await create("Page qui reprend");
    assert.equal(row(other).slug === slug, false, "l'adresse d'une redirection n'est pas attribuée d'office");
    await boss.post(`/marketing/pages/${other}`, settings(other, { slug }));
    assert.equal(row(other).slug, slug);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM cms_url_history WHERE resource_type = 'page' AND old_slug = ?").get(slug).n, 0, "l'adresse reprise sort de l'historique");
    await saveDraft(boss, other, [textSection("Page qui reprend l'adresse")]);
    assert.equal((await boss.post(`/marketing/pages/${other}/publier.json`, {})).status, 200);
    assert.equal((await anon.get(`/p/${slug}`)).status, 200);
  });
  test("changer l'adresse d'un BROUILLON ne crée aucune redirection", async () => {
    const d = await create("Brouillon renommé");
    await boss.post(`/marketing/pages/${d}`, settings(d, { slug: "brouillon-renomme-2" }));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE target = '/p/brouillon-renomme-2'").get().n, 0);
  });
  test("mettre hors ligne : la page n'est plus servie", async () => {
    const r = await boss.post(`/marketing/pages/${id}/depublier.json`, {});
    assert.equal(r.status, 200);
    assert.equal(row(id).status, "unpublished");
    assert.equal((await anon.get("/p/offre-2026")).status, 404);
  });
});

describe("dupliquer, corbeille, restaurer, supprimer", () => {
  let id, copyId;
  before(async () => { id = await create("Landing Page Formation"); await saveDraft(boss, id, [textSection("Texte original")]); await boss.post(`/marketing/pages/${id}/publier.json`, {}); });
  test("dupliquer crée une NOUVELLE page en brouillon sans toucher à l'originale", async () => {
    const original = row(id);
    const r = await boss.post(`/marketing/pages/${id}/dupliquer`, {});
    assert.equal(r.status, 302);
    copyId = idOf(r.location);
    const copy = row(copyId);
    assert.notEqual(copyId, id);
    assert.notEqual(copy.slug, original.slug);
    assert.notEqual(copy.name, original.name);
    assert.match(copy.name, /copie/i);
    assert.equal(copy.status, "draft");
    assert.equal(copy.published_at, null);
    assert.equal(JSON.parse(copy.sections)[0].markdown, "Texte original", "même contenu");
    const after = row(id);
    for (const k of ["name", "slug", "status", "sections", "revision", "published_at", "updated_at"]) assert.equal(after[k], original[k], `l'original n'a pas changé : ${k}`);
    assert.equal((await anon.get(`/p/${copy.slug}`)).status, 404, "la copie n'est pas en ligne");
  });
  test("corbeille : la page quitte la liste, reste en base, n'est plus servie ; restaurer la remet hors ligne", async () => {
    const slug = row(id).slug;
    assert.equal((await boss.post(`/marketing/pages/${id}/archiver`, {})).status, 302);
    assert.ok(row(id).archived_at, "soft delete : la ligne existe toujours");
    assert.equal((await anon.get(`/p/${slug}`)).status, 404);
    assert.doesNotMatch((await boss.get("/marketing/pages")).text, /Landing Page Formation<\/a>/);
    assert.match((await boss.get("/marketing/pages?etat=corbeille")).text, /Landing Page Formation<\/a>/);
    assert.match((await boss.get("/marketing/pages?vue=archivees")).text, /Landing Page Formation<\/a>/, "ancien lien conservé");
    await boss.post(`/marketing/pages/${id}/restaurer`, {});
    assert.equal(row(id).archived_at, null);
    assert.equal(row(id).status, "unpublished", "jamais republiée d'office");
    assert.match((await boss.get("/marketing/pages")).text, /Landing Page Formation<\/a>/);
  });
  test("suppression définitive : impossible hors de la corbeille, possible depuis la corbeille (administrateur)", async () => {
    const early = await boss.post(`/marketing/pages/${copyId}/supprimer`, {});
    assert.equal(early.status, 302);
    assert.ok(row(copyId), "pas supprimée tant qu'elle n'est pas à la corbeille");
    assert.match(flashOf((await boss.get(`/marketing/pages/${copyId}`)).text), /corbeille/i);
    await boss.post(`/marketing/pages/${copyId}/archiver`, {});
    await boss.post(`/marketing/pages/${copyId}/supprimer`, {});
    assert.equal(row(copyId), undefined, "effacée pour de bon");
  });
});

describe("liste : recherche, filtres, tri, pagination, actions groupées", () => {
  let siteA, siteB, a1, b1;
  before(async () => {
    const mk = async (name) => { const r = await boss.post("/marketing/site-web/sites", { name }); assert.equal(r.status, 302); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(name).id; };
    siteA = await mk("Site A"); siteB = await mk("Site B");
    a1 = await create("Accueil A", { site_id: String(siteA) });
    b1 = await create("Accueil B", { site_id: String(siteB) });
    await create("Zèbre sans site");
    for (let i = 1; i <= 26; i++) await create(`Pagination ${String(i).padStart(2, "0")}`);
  });
  test("recherche par titre et par adresse, réelle (aucun faux résultat)", async () => {
    const byTitle = (await boss.get("/marketing/pages?q=zèbre")).text;
    assert.match(byTitle, /Zèbre sans site<\/a>/);
    assert.doesNotMatch(byTitle, /Accueil A<\/a>/);
    assert.match((await boss.get("/marketing/pages?q=accueil-b")).text, /Accueil B<\/a>/);
    const none = (await boss.get("/marketing/pages?q=introuvable-xyz")).text;
    assert.match(none, /Aucune page trouvée/);
    assert.doesNotMatch(none, /<table/);
  });
  test("filtre par site : une page d'un site n'apparaît jamais dans l'autre", async () => {
    const A = (await boss.get(`/marketing/pages?site=${siteA}`)).text;
    assert.match(A, /Accueil A<\/a>/);
    assert.doesNotMatch(A, /Accueil B<\/a>/);
    const B = (await boss.get(`/marketing/pages?site=${siteB}`)).text;
    assert.match(B, /Accueil B<\/a>/);
    assert.doesNotMatch(B, /Accueil A<\/a>/);
    const none = (await boss.get("/marketing/pages?site=none&q=zèbre")).text;
    assert.match(none, /Zèbre sans site<\/a>/);
    assert.doesNotMatch(none, /Accueil A<\/a>/);
  });
  test("filtre par état : les compteurs des onglets sont les vrais comptes de la base", async () => {
    const html = (await boss.get("/marketing/pages")).text;
    const n = (label) => Number(html.match(new RegExp(`${label} <span class="count">\\((\\d+)\\)`))[1]);
    const dbCount = db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NULL AND id NOT IN (SELECT variant_page_id FROM mk_page_tests WHERE variant_page_id IS NOT NULL)").get().n;
    assert.equal(n("Tous"), dbCount);
    assert.equal(n("Publiées"), db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NULL AND status = 'published'").get().n);
    assert.equal(n("Corbeille"), db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE archived_at IS NOT NULL").get().n);
    await boss.post(`/marketing/pages/${a1}/publier.json`, {}).catch(() => {});
  });
  test("tri alphabétique et pagination côté base (25 par page)", async () => {
    const sorted = (await boss.get("/marketing/pages?tri=titre")).text;
    assert.ok(sorted.indexOf("Accueil A</a>") > -1 && sorted.indexOf("Accueil A</a>") < sorted.indexOf("Accueil B</a>"), "ordre alphabétique");
    assert.doesNotMatch(sorted, /Zèbre sans site<\/a>/, "le dernier titre alphabétique est sur la page suivante");
    assert.match((await boss.get("/marketing/pages?tri=titre&page=2")).text, /Zèbre sans site<\/a>/);
    const p1 = (await boss.get("/marketing/pages?tri=titre")).text;
    assert.equal((p1.match(/name="ids" value=/g) || []).length, 25);
    assert.match(p1, /Page 1 sur 2/);
    const p2 = (await boss.get("/marketing/pages?tri=titre&page=2")).text;
    assert.match(p2, /Page 2 sur 2/);
    assert.ok((p2.match(/name="ids" value=/g) || []).length >= 1);
    const first = p1.match(/name="ids" value="(\d+)"/)[1];
    assert.doesNotMatch(p2, new RegExp(`name="ids" value="${first}"`), "pas de doublon entre pages");
    assert.match((await boss.get("/marketing/pages?page=9999")).text, /Page 2 sur 2/, "page hors limites ramenée à la dernière");
  });
  test("actions groupées : publier, mettre hors ligne, corbeille, restaurer ; rapport honnête des refus", async () => {
    // plusieurs identifiants : corps URL-encodé répété
    const multi = await boss.request("/marketing/pages/actions", { method: "POST", form: new URLSearchParams([["action", "publier"], ["ids", String(a1)], ["ids", String(b1)]]) });
    assert.equal(multi.status, 302);
    assert.equal(row(a1).status, "published");
    assert.equal(row(b1).status, "published");
    await boss.request("/marketing/pages/actions", { method: "POST", form: new URLSearchParams([["action", "depublier"], ["ids", String(a1)], ["ids", String(b1)]]) });
    assert.equal(row(a1).status, "unpublished");
    await boss.request("/marketing/pages/actions", { method: "POST", form: new URLSearchParams([["action", "corbeille"], ["ids", String(a1)], ["ids", String(b1)]]) });
    assert.ok(row(a1).archived_at && row(b1).archived_at);
    // supprimer définitivement : une page hors corbeille est refusée, l'autre passe
    const live = await create("Reste en ligne");
    await boss.request("/marketing/pages/actions", { method: "POST", form: new URLSearchParams([["action", "supprimer"], ["ids", String(live)], ["ids", String(b1)]]) });
    assert.ok(row(live), "page hors corbeille intacte");
    assert.equal(row(b1), undefined, "page de la corbeille supprimée");
    const flash = flashOf((await boss.get("/marketing/pages")).text);
    assert.match(flash, /Reste en ligne/);
    await boss.request("/marketing/pages/actions", { method: "POST", form: new URLSearchParams([["action", "restaurer"], ["ids", String(a1)]]) });
    assert.equal(row(a1).archived_at, null);
  });
  test("action inconnue ou sans sélection : rien ne se passe", async () => {
    assert.equal((await boss.post("/marketing/pages/actions", { action: "detruire", ids: "1" })).status, 403);
    const r = await boss.post("/marketing/pages/actions", { action: "corbeille" });
    assert.equal(r.status, 302);
    assert.match(flashOf((await boss.get("/marketing/pages")).text), /au moins une page/i);
  });
  test("pages hiérarchiques : parent du même site seulement, jamais de boucle, affiché dans la liste", async () => {
    const child = await create("Enfant A", { site_id: String(siteA) });
    const set = (id, parent, site) => boss.post(`/marketing/pages/${id}`, settings(id, { parent_id: String(parent), ...(site ? { site_id: String(site) } : {}) }));
    await set(child, a1);
    assert.equal(row(child).parent_id, a1);
    assert.match((await boss.get(`/marketing/pages?site=${siteA}`)).text, /sous-page de « Accueil A »/);
    await set(a1, child);
    assert.equal(row(a1).parent_id, null, "boucle refusée");
    await set(child, b1 === undefined ? 0 : (await create("Autre site", { site_id: String(siteB) })));
    assert.equal(row(child).parent_id, a1, "parent d'un autre site refusé");
    await set(child, a1, siteB);
    assert.equal(row(child).parent_id, null, "changer de site retire le lien avec le parent");
  });
});

describe("permissions", () => {
  let viewer, editor, admin, page;
  before(async () => {
    viewer = await member("viewer"); editor = await member("editor"); admin = await member("admin");
    page = await create("Page des droits");
  });
  test("lecteur : voit la liste mais n'a ni création, ni actions, ni sélection", async () => {
    const html = (await viewer.get("/marketing/pages")).text;
    assert.equal((await viewer.get("/marketing/pages")).status, 200);
    assert.match(html, /Page des droits<\/a>/);
    assert.doesNotMatch(html, /data-mk-modal-open="nouvelle"/);
    assert.doesNotMatch(html, /name="ids"/);
    assert.doesNotMatch(html, /Page Builder<\/a>/);
    for (const [url, form] of [["/marketing/pages", { name: "x", template: "" }], [`/marketing/pages/${page}/publier`, {}], [`/marketing/pages/${page}/archiver`, {}], [`/marketing/pages/${page}/supprimer`, {}], ["/marketing/pages/actions", { action: "corbeille", ids: String(page) }]]) {
      assert.equal((await viewer.post(url, form)).status, 403, url);
    }
    assert.equal(row(page).status, "draft");
  });
  test("éditeur : crée, publie, met à la corbeille, restaure — mais ne supprime pas définitivement", async () => {
    const r = await editor.post("/marketing/pages", { name: "Page de l'éditeur", template: "", ouvrir: "editeur" });
    assert.equal(r.status, 302);
    const mine = idOf(r.location);
    assert.equal((await saveDraft(editor, mine, [textSection("Contenu de l'éditeur")])).status, 200);
    assert.equal((await editor.post(`/marketing/pages/${mine}/publier.json`, {})).status, 200);
    assert.equal((await editor.post(`/marketing/pages/${mine}/archiver`, {})).status, 302);
    assert.ok(row(mine).archived_at);
    assert.equal((await editor.post(`/marketing/pages/${mine}/supprimer`, {})).status, 403);
    assert.equal((await editor.post("/marketing/pages/actions", { action: "supprimer", ids: String(mine) })).status, 403);
    assert.ok(row(mine), "toujours là");
    const trash = (await editor.get("/marketing/pages?etat=corbeille")).text;
    assert.doesNotMatch(trash, /Supprimer définitivement/);
    assert.equal((await editor.post(`/marketing/pages/${mine}/restaurer`, {})).status, 302);
    assert.equal(row(mine).archived_at, null);
  });
  test("administrateur : supprime définitivement, mais seulement depuis la corbeille", async () => {
    const victim = await create("À supprimer");
    await admin.post(`/marketing/pages/${victim}/supprimer`, {});
    assert.ok(row(victim), "refusé hors corbeille");
    await admin.post(`/marketing/pages/${victim}/archiver`, {});
    assert.match((await admin.get("/marketing/pages?etat=corbeille")).text, /Supprimer définitivement/);
    await admin.post(`/marketing/pages/${victim}/supprimer`, {});
    assert.equal(row(victim), undefined);
  });
  test("un compte hors équipe marketing n'accède à rien", async () => {
    const student = await newStudent(srv);
    for (const url of ["/marketing/pages", `/marketing/pages/${page}`, `/marketing/pages/${page}/editeur`]) assert.notEqual((await student.get(url)).status, 200, url);
    assert.equal((await student.post("/marketing/pages", { name: "x", template: "" })).status === 200, false);
  });
});

describe("régression : l'existant continue de fonctionner", () => {
  test("pages d'atterrissage (sans site), fiche, versions et éditeur répondent toujours", async () => {
    const id = await create("Atterrissage classique");
    for (const url of [`/marketing/pages/${id}`, `/marketing/pages/${id}/editeur`, `/marketing/pages/${id}/apercu`, `/marketing/pages/${id}/analyse`, `/marketing/pages/${id}/exporter`, "/marketing/site-web", "/marketing/site-web/sites", "/marketing/site-web/tests-ab", "/marketing/tunnels"]) {
      assert.equal((await boss.get(url)).status, 200, url);
    }
  });
});
