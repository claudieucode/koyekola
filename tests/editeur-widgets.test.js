// Éditeur de pages, étape 1 (bibliothèque de widgets façon Elementor) : fiches du registre (catégorie, mots de recherche,
// permission, version), lot 1 « Mise en page » (balise HTML et largeur des conteneurs, grille qui s'adapte d'elle-même
// aux petits écrans, remplissage et alignement des cases), widgets réservés vérifiés côté serveur (cadenas réel).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const layout = (children, id = "sect00000001") => ({ id, type: "layout", children: [{ id: `cont${id.slice(4)}`, type: "container", children }] });

describe("registre des widgets (sans serveur)", () => {
  test("chaque widget a une fiche : catégorie Elementor, mots de recherche, version ; HTML réservé", () => {
    const spec = nodes.editorSpec();
    assert.deepEqual(Object.values(spec.widgetGroups), ["Mise en page", "Basique", "Général", "Formulaire", "Avancé", "Site", "E-commerce", "Réseaux sociaux"]);
    for (const t of spec.types) {
      assert.ok(spec.widgetGroups[t.group], `${t.type} : catégorie`);
      assert.ok(t.keywords && t.keywords.length > 2, `${t.type} : mots de recherche`);
      assert.equal(t.version, 1);
    }
    const group = (g) => spec.types.filter((t) => t.group === g).map((t) => t.type);
    assert.deepEqual(group("layout"), ["container", "columns", "column", "grid", "stack", "group"]);
    for (const t of ["heading", "image", "text", "video", "button", "divider", "spacer", "icon"]) assert.ok(group("basic").includes(t), t);
    for (const t of ["tabs", "accordion", "carousel", "gallery", "iconlist", "counter", "progress", "testimonial", "alert", "html"]) assert.ok(group("general").includes(t), t);
    assert.deepEqual(spec.types.filter((t) => t.requires).map((t) => [t.type, t.requires]), [["html", "pages.code"]]);
    assert.ok(spec.widgetPermissions["pages.code"]);
    assert.equal(spec.types.find((t) => t.type === "carousel").label, "Carrousel d'images");
    // recherche : « image » trouve Image, Galerie et Carrousel d'images ; « produit » les widgets de formations
    const finds = (w) => spec.types.filter((t) => (t.label + " " + t.keywords).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(w)).map((t) => t.type);
    for (const t of ["image", "gallery", "carousel"]) assert.ok(finds("image").includes(t), t);
    for (const t of ["course", "courselist"]) assert.ok(finds("produit").includes(t), t);
  });

  test("conteneurs : balise HTML et largeur du contenu validées ; « div » et valeurs inconnues jamais enregistrées", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Lot 1", kind: "page" });
    const save = (kids) => pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: kids }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;
    const out = save([
      { id: "box000000001", type: "container", props: { tag: "section", full: true }, children: [{ id: "box000000002", type: "container", props: { tag: "aside" }, children: [] }] },
      { id: "box000000003", type: "container", props: { tag: "main", full: "oui" }, children: [] },
      { id: "box000000004", type: "container", props: { tag: "div" }, children: [] },
      { id: "grd000000001", type: "grid", props: { tag: "nav", full: true }, children: [] },
      { id: "col000000001", type: "columns", props: { tag: "section" }, children: [{ id: "col000000002", type: "column", children: [] }] },
    ]);
    assert.deepEqual(out[0].props, { tag: "section", full: true });
    assert.deepEqual(out[0].children[0].props, { tag: "aside" }, "conteneurs imbriqués");
    assert.deepEqual(out[1].props, {}, "« main » refusé (la page a déjà sa zone principale), « full » doit valoir true");
    assert.deepEqual(out[2].props, {});
    assert.deepEqual(out[3].props, { tag: "nav" }, "la grille a une balise, pas de largeur encadrée");
    assert.deepEqual(out[4].props, {}, "les colonnes gardent leur structure");
  });

  test("grille : sens de remplissage et alignement des cases validés ; tablette et mobile se resserrent d'eux-mêmes", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Grille", kind: "page" });
    const save = (styles) => pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "grd000000001", type: "grid", styles, children: [] }] }] }, { revision: pages.getPage(A, p.id).revision }).content.sections;
    const ok = save({ desktop: { columns: 4, gridAutoFlow: "row dense", justifyItems: "center" } });
    assert.deepEqual(ok[0].children[0].styles.desktop, { columns: 4, gridAutoFlow: "row dense", justifyItems: "center" });
    assert.throws(() => save({ desktop: { gridAutoFlow: "diagonal" } }));
    assert.throws(() => save({ desktop: { justifyItems: "url(x)" } }));
    const css = nodes.pageCss(ok);
    assert.match(css, /\.kw-n-grd000000001\{grid-template-columns:repeat\(4, minmax\(0, 1fr\)\);grid-auto-flow:row dense;justify-items:center\}/);
    assert.match(css, /@media \(max-width: 1023px\)\{\.kw-n-grd000000001\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}\}/);
    assert.match(css, /@media \(max-width: 767px\)\{\.kw-n-grd000000001\{grid-template-columns:minmax\(0,1fr\)\}\}/);
    // Réglage propre à la tablette : respecté, et hérité par le mobile (pas de règle automatique)
    const own = nodes.pageCss(save({ desktop: { columns: 4 }, tablet: { columns: 3 } }));
    assert.match(own, /@media \(max-width: 1023px\)\{\.kw-n-grd000000001\{grid-template-columns:repeat\(3, minmax\(0, 1fr\)\)\}\}/);
    assert.doesNotMatch(own, /minmax\(0,1fr\)\}/);
    // Largeurs libres (2fr 1fr) : resserrées aussi ; grille de 2 colonnes : seulement sur mobile
    assert.match(nodes.pageCss(save({ desktop: { gridTemplate: "2fr 1fr 1fr" } })), /1023px\)\{\.kw-n-grd000000001\{grid-template-columns:repeat\(2/);
    const two = nodes.pageCss(save({ desktop: { columns: 2 } }));
    assert.doesNotMatch(two, /1023px/);
    assert.match(two, /767px\)\{\.kw-n-grd000000001\{grid-template-columns:minmax\(0,1fr\)\}/);
  });

  test("widgets réservés : sans la permission, ajouter ou modifier est refusé ; déplacer et supprimer restent permis", () => {
    const h = { id: "htm000000001", type: "html", props: { html: "<p>Annonce</p>" } };
    const deny = () => false;
    assert.throws(() => nodes.lockedWidgetChanges([], [layout([h])], deny), (e) => e.code === "forbidden_widget" && /réservé aux administrateurs/.test(e.message));
    nodes.lockedWidgetChanges([layout([h])], [layout([{ id: "grp000000001", type: "group", children: [h] }], "sect00000002")], deny);
    nodes.lockedWidgetChanges([layout([h])], [layout([])], deny);
    assert.throws(() => nodes.lockedWidgetChanges([layout([h])], [layout([{ ...h, props: { html: "<p>Autre</p>" } }])], deny));
    assert.throws(() => nodes.lockedWidgetChanges([layout([h])], [layout([h, { ...h, id: "htm000000002" }])], deny), undefined, "copie = ajout");
    nodes.lockedWidgetChanges([], [layout([h])], () => true);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db, editor;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    editor = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'editor')").run(editor.email);
  });
  after(() => srv.stop());
  const put = async (who, id, content) => {
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    return who.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } });
  };
  const newPage = async (name) => Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
  const bootOf = async (who, id) => JSON.parse((await who.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);

  test("conteneur et grille : balise, pleine largeur et grille resserrée sur la page publiée", async () => {
    const id = await newPage("Mise en page");
    const r = await put(boss, id, { sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "box000000001", type: "container", props: { tag: "section", full: true }, children: [{ id: "hed000000001", type: "heading", props: { text: "Zone pleine largeur", level: "2" } }] },
      { id: "grd000000001", type: "grid", props: { tag: "article" }, styles: { desktop: { columns: 4 } }, children: [{ id: "hed000000002", type: "heading", props: { text: "Case", level: "3" } }] },
    ] }] });
    assert.equal(r.status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, /<section class="kw-node kw-container kw-n-box000000001 kw-full"/);
    assert.match(html, /<\/section>/);
    assert.match(html, /<article class="kw-node kw-grid kw-n-grd000000001"/);
    assert.match(html, /@media \(max-width: 767px\)\{[^}]*\.kw-n-grd000000001\{grid-template-columns:minmax\(0,1fr\)\}/);
  });

  test("cadenas réel : un rédacteur ne peut ni ajouter ni modifier un bloc HTML ; l'administrateur si", async () => {
    const id = await newPage("Réservé");
    const h = { id: "htm000000001", type: "html", props: { html: "<p>Annonce</p>" } };
    assert.equal((await put(boss, id, { sections: [layout([h])] })).status, 200, "administrateur (propriétaire) : permis");
    assert.equal((await bootOf(boss, id)).perms["pages.code"], true);
    assert.equal((await bootOf(editor, id)).perms["pages.code"], false, "le cadenas de la bibliothèque vient de la permission");
    const added = await put(editor, id, { sections: [layout([h, { ...h, id: "htm000000002" }])] });
    assert.equal(added.status, 422);
    assert.match(added.text, /forbidden_widget/);
    assert.equal((await put(editor, id, { sections: [layout([{ ...h, props: { html: "<p>Piège</p>" } }])] })).status, 422);
    assert.equal((await put(editor, id, { sections: [layout([{ id: "hed000000001", type: "heading", props: { text: "Avant", level: "2" } }, h])] })).status, 200, "déplacer (et ajouter autre chose) : permis");
    assert.equal((await put(editor, id, { sections: [layout([])] })).status, 200, "supprimer : permis");
    // Composant : même règle
    const comp = await editor.request("/marketing/site-web/composants", { method: "POST", json: { name: "Bloc HTML", global: true, section: { type: "layout", children: [h] } } });
    assert.notEqual(comp.status, 200);
    assert.match(comp.text, /réservé aux administrateurs/);
  });
});

describe("lot 2 — Basique", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("validation : Google Maps (adresse obligatoire, zoom et hauteur bornés), lien du titre, taille du bouton, séparateur avec texte", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Lot 2", kind: "page" });
    const save = (kids) => pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: kids }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;
    const out = save([
      { id: "map000000001", type: "map", props: { address: " Tour Eiffel, Paris ", zoom: 99, height: 5000 } },
      { id: "hed000000001", type: "heading", props: { text: "Titre", level: "2", link: "https://k.test/a", newTab: true } },
      { id: "btn000000001", type: "button", props: { label: "Go", url: "/catalogue", size: "lg" } },
      { id: "btn000000002", type: "button", props: { label: "Go", url: "/catalogue", size: "xxl" } },
      { id: "div000000001", type: "divider", props: { text: "ou", align: "nope" } },
      { id: "div000000002", type: "divider", props: { align: "left" } },
    ]);
    assert.deepEqual(out[0].props, { address: "Tour Eiffel, Paris", zoom: 14, height: 350, title: "Carte : Tour Eiffel, Paris" });
    assert.deepEqual(out[1].props, { text: "Titre", level: "2", link: "https://k.test/a", newTab: true });
    assert.equal(out[2].props.size, "lg");
    assert.equal(out[3].props.size, undefined, "taille inconnue = normale (non enregistrée)");
    assert.deepEqual([out[4].props.text, out[4].props.align], ["ou", "center"]);
    assert.equal(out[5].props.align, undefined, "position sans texte : rien");
    assert.throws(() => save([{ id: "map000000001", type: "map", props: { address: "" } }]), /indiquez une adresse/);
    assert.throws(() => save([{ id: "hed000000001", type: "heading", props: { text: "T", level: "2", link: "javascript:alert(1)" } }]));
    assert.equal(nodes.editorSpec().types.find((t) => t.type === "map").group, "basic");
  });

  test("page publiée : carte (adresse encodée), titre cliquable compté, bouton grand, séparateur avec texte ; canevas sans chargement de carte", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Basique" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "hed000000001", type: "heading", props: { text: "Nos formations", level: "2", link: "/catalogue" } },
      { id: "btn000000001", type: "button", props: { label: "S'inscrire", url: "/catalogue", size: "lg" } },
      { id: "div000000001", type: "divider", props: { text: "ou", align: "center", thickness: 2 } },
      { id: "map000000001", type: "map", props: { address: "Bd Denis Sassou <Nguesso> & co", zoom: 16, height: 450 } },
    ] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } })).status, 200);
    const canvas = (await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content } })).text;
    assert.doesNotMatch(canvas, /google\.com\/maps/, "le canevas représente la carte sans la charger");
    assert.match(canvas, /Bd Denis Sassou &lt;Nguesso&gt; &amp; co/);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, /<iframe class="kw-map-frame" src="https:\/\/www\.google\.com\/maps\?q=Bd%20Denis%20Sassou%20%3CNguesso%3E%20%26%20co&amp;z=16&amp;output=embed" title="Carte : Bd Denis Sassou &lt;Nguesso&gt; &amp; co"/);
    assert.match(html, /\.kw-n-map000000001 \.kw-map-frame\{height:450px\}/);
    assert.match(html, new RegExp(`<h2 class="kw-node kw-heading kw-n-hed000000001"><a class="kw-heading-link" href="/p/${slug}/clic/0">Nos formations</a></h2>`));
    assert.match(html, new RegExp(`kw-btn-primary kw-btn-lg" href="/p/${slug}/clic/1"`), "le lien du titre décale bien le comptage des liens suivants");
    assert.match(html, /<div class="kw-node kw-divider kw-n-div000000001 kw-divider-text is-center" role="separator"><span>ou<\/span><\/div>/);
    assert.match(html, /\.kw-n-div000000001::before,\.kw-n-div000000001::after\{border-top:2px solid currentColor\}/);
    const click = await boss.get(`/p/${slug}/clic/0`);
    assert.equal(click.status, 302);
    assert.equal(click.location, "/catalogue");
  });
});

describe("lot 3 — Général", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("validation : boîtes d'image et d'icône, évaluation (demi-étoiles, bornes), ancre de menu nommée ; raccourci SoundCloud", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Lot 3", kind: "page" });
    const save = (kids) => pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: kids }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;
    const out = save([
      { id: "ibx000000001", type: "imagebox", props: { src: "https://k.test/a.png", alt: "Classe", title: "Cours en direct", text: "Chaque semaine.", position: "left", link: "/catalogue", titleLevel: 9 } },
      { id: "cbx000000001", type: "iconbox", props: { icon: "star", title: "Certificat", position: "nope", size: 7 } },
      { id: "rat000000001", type: "rating", props: { value: "4,3", title: "Note des élèves" } },
      { id: "rat000000002", type: "rating", props: { value: 8.5, scale: 10, showValue: false } },
      { id: "anc000000001", type: "menuanchor", anchor: "tarifs" },
    ]);
    assert.deepEqual(out[0].props, { src: "https://k.test/a.png", alt: "Classe", title: "Cours en direct", text: "Chaque semaine.", titleLevel: "3", position: "left", link: "/catalogue", newTab: false });
    assert.deepEqual([out[1].props.position, out[1].props.size, out[1].props.titleLevel], ["top", "48", "3"]);
    assert.deepEqual(out[2].props, { value: 4.5, scale: 5, title: "Note des élèves", showValue: true }, "arrondi à la demi-étoile");
    assert.deepEqual(out[3].props, { value: 8.5, scale: 10, title: "", showValue: false });
    assert.equal(out[4].anchor, "tarifs");
    assert.throws(() => save([{ id: "rat000000001", type: "rating", props: { value: 6 } }]), /entre 0 et 5/);
    assert.throws(() => save([{ id: "rat000000001", type: "rating", props: { value: "beaucoup" } }]));
    assert.throws(() => save([{ id: "anc000000001", type: "menuanchor" }]), /donnez un nom à l'ancre/);
    assert.throws(() => save([{ id: "ibx000000001", type: "imagebox", props: { src: "https://k.test/a.png", title: "" } }]), /titre est obligatoire/);
    assert.throws(() => save([{ id: "cbx000000001", type: "iconbox", props: { icon: "pas-une-icone", title: "x" } }]), /icône inconnue/);
    const spec = nodes.editorSpec();
    for (const t of ["imagebox", "iconbox", "rating", "menuanchor"]) assert.equal(spec.types.find((x) => x.type === t).group, "general", t);
    const sc = spec.shortcuts.find((x) => x.key === "soundcloud");
    assert.equal(sc.type, "embed");
    assert.ok(new RegExp(sc.pattern, "i").test("https://soundcloud.com/artiste/titre"));
    assert.ok(!new RegExp(sc.pattern, "i").test("https://evil.test/soundcloud.com/a/b"));
    // un SoundCloud créé par le raccourci est un contenu intégré ordinaire, validé par le serveur
    assert.equal(save([{ id: "emb000000001", type: "embed", props: { url: "https://soundcloud.com/artiste/titre", title: "Podcast" } }])[0].type, "embed");
  });

  test("page publiée : boîtes avec un seul lien compté chacune, évaluation lisible, ancre ; responsive", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Général" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "anc000000001", type: "menuanchor", anchor: "tarifs" },
      { id: "ibx000000001", type: "imagebox", props: { src: "https://k.test/a.png", alt: "Classe", title: "Cours <en> direct", text: "Chaque semaine.", position: "left", link: "/catalogue" } },
      { id: "cbx000000001", type: "iconbox", props: { icon: "star", title: "Certificat", link: "/blog" } },
      { id: "btn000000001", type: "button", props: { label: "Après", url: "/connexion" } },
      { id: "rat000000001", type: "rating", props: { value: 4.5, title: "Note des élèves" } },
    ] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, /<div class="kw-node kw-menuanchor kw-n-anc000000001" id="tarifs"><\/div>/);
    assert.match(html, new RegExp(`kw-imagebox kw-n-ibx000000001 kw-box is-left"><div class="kw-box-media"><a href="/p/${slug}/clic/0" tabindex="-1" aria-hidden="true"><img src="https://k.test/a.png" alt="Classe"`));
    assert.match(html, new RegExp(`<h3 class="kw-box-title"><a href="/p/${slug}/clic/0">Cours &lt;en&gt; direct</a></h3>`), "même numéro de clic pour l'image et le titre");
    assert.match(html, new RegExp(`kw-iconbox kw-n-cbx000000001 kw-box is-top"><div class="kw-box-media"><span class="kw-iconbox-icon" aria-hidden="true"><svg`));
    assert.match(html, new RegExp(`<a href="/p/${slug}/clic/1">Certificat</a>`));
    assert.match(html, new RegExp(`href="/p/${slug}/clic/2"[^>]*>Après</a>`), "les liens suivants restent bien numérotés");
    assert.match(html, /role="img" aria-label="Note : 4,5 sur 5"/);
    assert.match(html, /\.kw-n-rat000000001 \.kw-rating-fill\{width:90%\}/);
    assert.equal((await boss.get(`/p/${slug}/clic/1`)).location, "/blog");
    assert.equal((await boss.get(`/p/${slug}/clic/2`)).location, "/connexion");
  });
});

describe("lot 4 — Formulaire (module Formulaires d'inscription)", () => {
  let srv, boss, db, formId, draftId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    formId = Number((await boss.post("/marketing/formulaires", { name: "Lettre atelier", consentText: "J'accepte de recevoir la lettre de l'atelier." })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_forms SET double_optin = 0, thank_you_text = 'Bienvenue dans la lettre !' WHERE id = ?").run(formId);
    await boss.post(`/marketing/formulaires/${formId}/publier`, {});
    draftId = Number((await boss.post("/marketing/formulaires", { name: "Brouillon", consentText: "J'accepte." })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv.stop());
  const put = async (id, content) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision, content } });
  const page = (children) => ({ sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] }] });

  test("validation : formulaire existant obligatoire ; publication refusée si le formulaire n'est pas publié ; bibliothèque « Formulaire »", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Formulaires" })).location.match(/(\d+)$/)[1]);
    const bad = await put(id, page([{ id: "frm000000001", type: "signupform", props: { formId: 999 } }]));
    assert.equal(bad.status, 422);
    assert.match(bad.text, /choisissez un formulaire existant/);
    assert.equal((await put(id, page([{ id: "frm000000001", type: "signupform", props: { formId: draftId } }]))).status, 200);
    const pub = await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} });
    assert.notEqual(pub.status, 200);
    assert.match(pub.text, /« Brouillon » n'est pas publié/);
    const boot = JSON.parse((await boss.get(`/marketing/pages/${id}/editeur`)).text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    assert.deepEqual(boot.forms.map((f) => [f.name, f.status]).sort(), [["Brouillon", "draft"], ["Lettre atelier", "published"]]);
    assert.equal(nodes.editorSpec().types.find((t) => t.type === "signupform").group, "form");
    // canevas : le formulaire non publié est signalé, jamais affiché comme s'il marchait
    const canvas = (await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", json: { content: page([{ id: "frm000000001", type: "signupform", props: { formId: draftId } }]) } })).text;
    assert.match(canvas, /Formulaire « Brouillon » non publié/);
  });

  test("page publiée : deux formulaires, chacun son envoi, ses erreurs et son message ; vrai contact créé (consentement prouvé)", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Deux formulaires" })).location.match(/(\d+)$/)[1]);
    assert.equal((await put(id, page([
      { id: "frm000000001", type: "signupform", props: { formId, heading: "Recevoir la lettre", button: "Je m'abonne" } },
      { id: "frm000000002", type: "signupform", props: { formId, heading: "Encore ici" } },
    ]))).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const visitor = new (require("./helpers").Client)(srv.base);
    const html = (await visitor.get(`/p/${slug}`)).text;
    assert.match(html, /<div class="kw-signup" id="kw-f-frm000000001"><h2 class="kw-signup-title">Recevoir la lettre<\/h2>/);
    assert.match(html, new RegExp(`<form class="kw-signup-form" method="post" action="/p/${slug}/inscription" novalidate><input type="hidden" name="tz" data-tz><input type="hidden" name="w" value="frm000000001">`));
    assert.match(html, /id="wfrm000000001-email"/, "identifiants propres à chaque widget");
    assert.match(html, /id="wfrm000000002-email"/);
    assert.match(html, /J&#39;accepte de recevoir la lettre de l&#39;atelier\./);
    assert.match(html, />Je m&#39;abonne<\/button>/);
    // consentement manquant : erreur sur CE widget seulement, saisie conservée
    const miss = await visitor.post(`/p/${slug}/inscription`, { w: "frm000000002", ft: srv.formToken(), email: "awa@ex.fr" });
    assert.equal(miss.status, 400);
    const kw2 = miss.text.slice(miss.text.indexOf('id="kw-f-frm000000002"'));
    assert.match(kw2, /role="alert">Cochez la case pour confirmer votre inscription\./);
    assert.match(kw2, /value="awa@ex\.fr"/);
    assert.doesNotMatch(miss.text.slice(0, miss.text.indexOf('id="kw-f-frm000000002"')), /role="alert"/, "l'autre formulaire n'affiche pas l'erreur");
    const ok = await visitor.post(`/p/${slug}/inscription`, { w: "frm000000002", ft: srv.formToken(), email: "awa@ex.fr", consent: "1" });
    assert.equal(ok.status, 302);
    assert.equal(ok.location, `/p/${slug}?inscrit=1&w=frm000000002#kw-f-frm000000002`);
    const back = (await visitor.get(ok.location.replace(/#.*/, ""))).text;
    assert.match(back.slice(back.indexOf('id="kw-f-frm000000002"')), /^[^]*?role="status">Bienvenue dans la lettre !/);
    assert.match(back.slice(back.indexOf('id="kw-f-frm000000001"'), back.indexOf('id="kw-f-frm000000002"')), /<form class="kw-signup-form"/, "l'autre widget garde son formulaire");
    const c = db.prepare("SELECT id, status FROM mk_contacts WHERE email = 'awa@ex.fr'").get();
    assert.ok(c, "contact créé");
    assert.equal(c.status, "subscribed", "inscription confirmée (formulaire sans double confirmation)");
    const proof = db.prepare("SELECT action, text_shown FROM mk_consents WHERE contact_id = ? ORDER BY id DESC").get(c.id);
    assert.deepEqual([proof.action, proof.text_shown], ["granted", "J'accepte de recevoir la lettre de l'atelier."], "preuve du consentement : le texte exact présenté");
    // widget inconnu : refusé proprement, rien créé
    const ghost = await visitor.post(`/p/${slug}/inscription`, { w: "nexistepas01", ft: srv.formToken(), email: "x@ex.fr", consent: "1" });
    assert.equal(ghost.status, 400);
    assert.ok(!db.prepare("SELECT 1 FROM mk_contacts WHERE email = 'x@ex.fr'").get());
  });
});

describe("lot 5 — Avancé", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("validation : titre animé, boîte retournable, liste de prix, table des matières, barre de lecture", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Lot 5", kind: "page" });
    const save = (kids) => pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: kids }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children;
    const out = save([
      { id: "ani000000001", type: "animatedheading", props: { before: "Apprenez", words: ["Photoshop", " ", "Blender"], after: "vite", interval: 99999, effect: "zoom" } },
      { id: "flp000000001", type: "flipbox", props: { frontTitle: "Recto", backTitle: "Verso", ctaLabel: "Voir", ctaUrl: "/catalogue", height: 9999, effect: "fade" } },
      { id: "prl000000001", type: "pricelist", props: { items: [{ title: "Coaching", price: "50 €", link: "/connexion" }, { title: "", price: "" }] } },
      { id: "toc000000001", type: "toc", props: { depth: "9" } },
      { id: "rdp000000001", type: "readingprogress", props: { position: "bottom", thickness: 99 } },
    ]);
    assert.deepEqual(out[0].props, { before: "Apprenez", words: ["Photoshop", "Blender"], after: "vite", level: "2", effect: "fade", interval: 2500 });
    assert.deepEqual([out[1].props.effect, out[1].props.height, out[1].props.ctaUrl], ["fade", 280, "/catalogue"]);
    assert.deepEqual(out[2].props.items, [{ title: "Coaching", price: "50 €", text: "", link: "/connexion" }], "ligne vide ignorée");
    assert.deepEqual(out[3].props, { title: "Sommaire", depth: "3", numbered: false });
    assert.deepEqual(out[4].props, { position: "bottom", thickness: 4 });
    assert.throws(() => save([{ id: "ani000000001", type: "animatedheading", props: { words: ["Seul"] } }]), /au moins deux mots/);
    assert.throws(() => save([{ id: "prl000000001", type: "pricelist", props: { items: [{ title: "Sans prix" }] } }]), /un nom et un prix réel/);
    assert.throws(() => save([{ id: "flp000000001", type: "flipbox", props: { frontTitle: "" } }]), /titre du recto/);
    for (const t of ["animatedheading", "flipbox", "pricelist", "toc", "readingprogress"]) assert.equal(nodes.editorSpec().types.find((x) => x.type === t).group, "advanced", t);
  });

  test("page publiée : sommaire construit depuis les titres (ancres), liens comptés dans l'ordre, titre animé lisible", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Avancé" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "toc000000001", type: "toc", props: { title: "Au programme", depth: "3", numbered: true } },
      { id: "rdp000000001", type: "readingprogress", props: { thickness: 6 } },
      { id: "ani000000001", type: "animatedheading", props: { before: "Apprenez", words: ["Photoshop", "Blender"], level: "1" } },
      { id: "hed000000001", type: "heading", props: { text: "Les modules", level: "2" } },
      { id: "hed000000002", type: "heading", anchor: "tarifs", props: { text: "Tarifs <2026>", level: "3" } },
      { id: "hed000000003", type: "heading", props: { text: "Détail fin", level: "4" } },
      { id: "flp000000001", type: "flipbox", props: { frontTitle: "Recto", backTitle: "Verso", ctaLabel: "Voir", ctaUrl: "/catalogue" } },
      { id: "prl000000001", type: "pricelist", props: { items: [{ title: "Coaching", price: "50 €", link: "/connexion" }] } },
    ] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, /<nav class="kw-node kw-toc kw-n-toc000000001" aria-label="Au programme"><p class="kw-toc-title">Au programme<\/p><ol class="kw-toc-list"><li class="kw-toc-l2"><a href="#kw-h-hed000000001">Les modules<\/a><\/li><li class="kw-toc-l3"><a href="#tarifs">Tarifs &lt;2026&gt;<\/a><\/li><\/ol><\/nav>/, "titres 2 et 3 seulement, l'ancre choisie est reprise");
    assert.match(html, /<h2 class="kw-node kw-heading kw-n-hed000000001" id="kw-h-hed000000001">Les modules<\/h2>/);
    assert.match(html, /<h3 class="kw-node kw-heading kw-n-hed000000002" id="tarifs">/);
    assert.match(html, /<h1 class="kw-node kw-animatedheading kw-n-ani000000001"><span class="sr-only">Apprenez Photoshop, Blender<\/span><span aria-hidden="true">Apprenez <span class="kw-rotate is-fade" data-kw-words="\[&#34;Photoshop&#34;,&#34;Blender&#34;\]" data-kw-interval="2500">Photoshop<\/span><\/span><\/h1>/);
    assert.match(html, new RegExp(`<a class="kw-button kw-btn-primary kw-btn-sm" href="/p/${slug}/clic/0">Voir</a>`));
    assert.match(html, new RegExp(`<a class="kw-pl-title" href="/p/${slug}/clic/1">Coaching</a>`));
    assert.equal((await boss.get(`/p/${slug}/clic/1`)).location, "/connexion");
    assert.match(html, /\.kw-n-rdp000000001 \.kw-readbar\{height:6px\}/);
    assert.match(html, /\.kw-n-flp000000001\{min-height:280px\}/);
  });
});
