// Site Web — phase 4 : éditeur visuel des pages. Grammaire des nouvelles sections, rendu du canevas (même gabarit que la
// page publiée), sauvegarde automatique JSON (révisions, erreurs claires), publication, composants synchronisés,
// page publique (sections masquées, affichage par écran, mise en page, FAQ structurée), droits.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const { normalizeSection } = require("../src/marketing/pages/sections");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const hero = (title, extra = {}) => ({ type: "hero", title, subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "", ...extra });

describe("grammaire des nouvelles sections", () => {
  const { A } = freshMarketing();
  const n = (raw) => normalizeSection(A, raw, 0);

  test("points forts, FAQ, appel à l'action, témoignages, séparateur : normalisés et bornés", () => {
    const f = n({ type: "features", title: "Pourquoi", columns: "4", items: [{ title: "A", text: "x" }, { title: "", text: "" }, ...Array(20).fill({ title: "B" })] });
    assert.equal(f.columns, 4);
    assert.equal(f.items.length, 12, "12 cartes au plus, cartes vides retirées");
    assert.equal(n({ type: "features", columns: 7, items: [{ title: "A" }] }).columns, 3);
    assert.throws(() => n({ type: "features", items: [] }), /au moins une carte/);
    assert.throws(() => n({ type: "faq", items: [{ q: "Question ?", a: "" }] }), /chaque question a besoin d'une réponse/);
    assert.equal(n({ type: "faq", items: [{ q: "Q ?", a: "R." }] }).title, "Questions fréquentes");
    assert.throws(() => n({ type: "cta", title: "Go", buttonLabel: "Clic", buttonUrl: "javascript:alert(1)" }), /https:\/\//);
    assert.throws(() => n({ type: "cta", title: "Go" }), /bouton/);
    assert.equal(n({ type: "testimonials", items: [{ text: "Top", author: "A" }, { text: "" }] }).items.length, 1);
    assert.deepEqual(n({ type: "divider", line: "false", size: "lg" }), { type: "divider", line: false, size: "lg" });
  });

  test("vidéo : YouTube, Vimeo ou fichier https uniquement, titre obligatoire", () => {
    assert.equal(n({ type: "video", url: "https://youtu.be/dQw4w9WgXcQ", title: "Présentation" }).url, "https://youtu.be/dQw4w9WgXcQ");
    for (const url of ["https://exemple.com/page", "http://exemple.com/a.mp4", "javascript:alert(1)", ""]) assert.throws(() => n({ type: "video", url, title: "x" }), /vidéo/, url);
    assert.throws(() => n({ type: "video", url: "https://vimeo.com/76979871" }), /titre/);
  });

  test("mise en page et affichage : valeurs connues seulement ; jamais masquée sur tous les écrans", () => {
    const s = n({ ...hero("T"), id: "abcdef123456", name: "Haut", style: { padding: "xl", background: "dark", align: "center", width: "full", color: "red" }, hideOn: ["mobile", "inconnu"] });
    assert.deepEqual(s.style, { padding: "xl", background: "dark", align: "center", width: "full" });
    assert.deepEqual(s.hideOn, ["mobile"]);
    assert.throws(() => n({ ...hero("T"), hideOn: ["desktop", "tablet", "mobile"] }), /tous les écrans/);
    assert.throws(() => n({ ...hero("T"), id: "<script>" }), /Identifiant/);
  });
});

describe("éditeur visuel (vrai serveur)", () => {
  let srv, boss, db, id, slug;
  const row = () => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const put = (c, body) => c.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: body });
  const content = (sections, extra = {}) => ({ sections, title: "Titre SEO", description: "", theme: {}, seo: {}, ...extra });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    id = Number((await boss.post("/marketing/pages", { name: "Page éditeur" })).location.match(/(\d+)$/)[1]);
    slug = row().slug;
  });
  after(() => srv.stop());

  test("page de l'éditeur : données de démarrage échappées, types proposés, lien depuis la fiche de la page", async () => {
    db.prepare("UPDATE mk_landing_pages SET name = ? WHERE id = ?").run("Page </script><script>alert(1)</script>", id);
    const html = (await boss.get(`/marketing/pages/${id}/editeur`)).text;
    assert.doesNotMatch(html, /<\/script><script>alert/, "données JSON intégrées échappées");
    const boot = JSON.parse(html.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    assert.equal(boot.page.id, id);
    assert.equal(boot.canWrite, true);
    for (const t of ["hero", "features", "faq", "cta", "video", "testimonials", "divider"]) assert.ok(boot.types.some((x) => x.type === t), t);
    assert.ok(boot.types.find((x) => x.type === "course").unavailable, "aucune formation publiée : section formation non proposée, avec la raison");
    db.prepare("UPDATE mk_landing_pages SET name = 'Page éditeur' WHERE id = ?").run(id);
    assert.match((await boss.get(`/marketing/pages/${id}`)).text, new RegExp(`href="/marketing/pages/${id}/editeur"`));
  });

  test("rendu du canevas : même gabarit que la page publiée, identifiants de sélection, sections masquées visibles", async () => {
    const r = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: content([hero("Visible", { id: "aaaaaa111111" }), { type: "text", markdown: "Caché", hidden: true, id: "bbbbbb222222" }]) } });
    assert.equal(r.status, 200);
    assert.match(r.text, /data-section-id="aaaaaa111111"/);
    assert.match(r.text, /class="lp-block lp-block-text is-hidden" data-section-id="bbbbbb222222"/);
    assert.match(r.text, /<link rel="stylesheet" href="\/css\/landing\.css/);
    assert.equal(row().draft, null, "le rendu n'enregistre rien");
    const bad = await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: content([hero("ok"), { type: "video", url: "https://exemple.com", title: "x" }]) } });
    assert.equal(bad.status, 422);
    assert.match(JSON.parse(bad.text).error.message, /^Section 2 \(vidéo\)/);
  });

  test("sauvegarde automatique (JSON) : révision, conflit 409 sans écrasement, contenu invalide 422", async () => {
    const rev = row().revision;
    const ok = await put(boss, { content: content([hero("Brouillon A"), { type: "faq", items: [{ q: "Prix ?", a: "**Gratuit**." }] }]), revision: rev });
    assert.equal(ok.status, 200);
    assert.equal(JSON.parse(ok.text).revision, rev + 1);
    assert.equal(JSON.parse(row().draft).sections[0].title, "Brouillon A");
    const stale = await put(boss, { content: content([hero("Ancien onglet")]), revision: rev });
    assert.equal(stale.status, 409);
    assert.match(JSON.parse(stale.text).error.message, /modifiée ailleurs/);
    assert.equal(JSON.parse(row().draft).sections[0].title, "Brouillon A");
    const invalid = await put(boss, { content: content([hero("")]), revision: rev + 1 });
    assert.equal(invalid.status, 422);
    assert.equal(row().revision, rev + 1);
  });

  test("publication depuis l'éditeur, puis page publique : masquage, affichage par écran, mise en page, FAQ structurée, clics suivis", async () => {
    await boss.post(`/marketing/pages/${id}`, { revision: String(row().revision), name: "Page éditeur", slug, title: "Titre SEO", description: "", form_id: "", tags: "", indexable: "on", action: "save" });
    const rev = row().revision;
    assert.equal(JSON.parse(row().draft).sections[0].title, "Brouillon A", "la fiche de la page (sans sections) garde les sections du brouillon");
    await put(boss, { content: content([
      hero("En ligne", { style: { width: "full", background: "dark" } }),
      { type: "text", markdown: "Section cachée", hidden: true },
      { type: "text", markdown: "Seulement sur ordinateur", hideOn: ["mobile", "tablet"] },
      { type: "cta", title: "Prêt ?", buttonLabel: "Je commence", buttonUrl: "/catalogue", style: { align: "center", padding: "xl" } },
      { type: "faq", title: "FAQ", items: [{ q: "Combien de temps ?", a: "6 semaines." }] },
    ]), revision: rev });
    const pub = await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} });
    assert.equal(pub.status, 200);
    assert.equal(JSON.parse(pub.text).url, `/p/${slug}`);
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text;
    assert.doesNotMatch(html, /Section cachée/);
    assert.doesNotMatch(html, /data-section-id/, "aucun attribut de l'éditeur en ligne");
    assert.match(html, /lp-block lp-block-text lp-hide-mobile lp-hide-tablet/);
    assert.match(html, /lp-block lp-block-hero lp-bg-dark lp-w-full/);
    assert.match(html, /lp-block lp-block-cta lp-pad-xl lp-al-center/);
    // Palier 11 : un graphe unique (Organisation, site, page, FAQ) relié par des identifiants
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"].find((n) => n["@type"] === "FAQPage");
    assert.equal(ld["@type"], "FAQPage");
    assert.equal(ld.mainEntity[0].name, "Combien de temps ?");
    const link = html.match(/href="(\/p\/[^"]+\/clic\/\d+)">Je commence/)[1];
    assert.equal((await new Client(srv.base).get(link, { headers: UA })).location, "/catalogue");
  });

  test("composants : enregistrer, insérer synchronisé, le modifier change la page EN LIGNE ; suppression refusée s'il est utilisé", async () => {
    const created = await boss.request("/marketing/site-web/composants", { method: "POST", json: { name: "Bandeau promo", section: hero("Promo -20 %"), global: true } });
    assert.equal(created.status, 201);
    const comp = JSON.parse(created.text).component;
    assert.equal((await boss.request("/marketing/site-web/composants", { method: "POST", json: { name: "bandeau PROMO", section: hero("x") } })).status, 409);
    await put(boss, { content: content([{ type: "component", componentId: comp.id }, { type: "text", markdown: "Suite" }]), revision: row().revision });
    await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} });
    assert.match((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text, /Promo -20 %/);
    const upd = await boss.request(`/marketing/site-web/composants/${comp.id}`, { method: "POST", json: { section: hero("Promo -30 %") } });
    assert.equal(upd.status, 200);
    assert.match((await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text, /Promo -30 %/, "synchronisé : la page en ligne suit le composant");
    const del = await boss.request(`/marketing/site-web/composants/${comp.id}/supprimer`, { method: "POST", json: {} });
    assert.equal(del.status, 409);
    assert.match(JSON.parse(del.text).error.message, /instances liées dans 1 page/);
    const list = JSON.parse((await boss.get("/marketing/site-web/composants.json")).text).components;
    assert.deepEqual(list.map((c) => c.name), ["Bandeau promo"]);
  });

  test("droits : lecteur = éditeur en lecture seule, aucune écriture ; élève refusé", async () => {
    const viewer = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(viewer.email);
    const html = (await viewer.get(`/marketing/pages/${id}/editeur`)).text;
    assert.equal(JSON.parse(html.match(/id="pb-boot">([\s\S]*?)<\/script>/)[1]).canWrite, false);
    assert.equal((await viewer.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: content([hero("x")]) } })).status, 200, "aperçu en lecture seule autorisé");
    assert.equal((await put(viewer, { content: content([hero("Pirate")]), revision: row().revision })).status, 403);
    assert.equal((await viewer.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 403);
    assert.equal((await viewer.request("/marketing/site-web/composants", { method: "POST", json: { name: "x", section: hero("x") } })).status, 403);
    const student = await newStudent(srv);
    assert.equal((await student.get(`/marketing/pages/${id}/editeur`)).status, 403);
  });
});
