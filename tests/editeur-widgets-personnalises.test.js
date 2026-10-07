// Éditeur de pages, lot 9 : architecture des widgets personnalisés (src/marketing/pages/widgets) — description vérifiée,
// réglages validés par type de champ, contenu de départ, versions (mise à niveau), permission, rendu et liens comptés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const widgets = require("../src/marketing/pages/widgets");
const { startServer, loginInstructor } = require("./helpers");

const base = (extra = {}) => ({ type: "essaiwidget", label: "Essai", group: "general", icon: "star", keywords: "essai", version: 1, schema: [{ key: "titre", kind: "text", label: "Titre", required: true, default: "Titre" }], ...extra });

describe("architecture (sans serveur)", () => {
  test("description vérifiée : erreurs claires (type, champ inconnu, obligatoire sans défaut, version sans migration)", () => {
    assert.throws(() => widgets.check(base({ type: "A b" })), /« type »/);
    assert.throws(() => widgets.check(base({ schema: [{ key: "x", kind: "script", label: "X" }] })), /type « script » inconnu/);
    assert.throws(() => widgets.check(base({ schema: [{ key: "x", kind: "text", label: "X", required: true }] })), /obligatoire sans valeur par défaut/);
    assert.throws(() => widgets.check(base({ version: 2 })), /il manque migrate\[2\]/);
    assert.throws(() => widgets.check(base({ schema: [{ key: "n", kind: "number", label: "N" }] })), /bornes min et max/);
    assert.throws(() => nodes.registerWidget(base({ type: "heading" })), /ce type existe déjà/);
    assert.throws(() => nodes.registerWidget(base({ type: "essaigroupe", group: "inconnu" })), /catégorie « inconnu » inconnue/);
  });

  test("« Carte de profil » : construite uniquement par l'architecture (fiche, schéma, contenu de départ valide)", () => {
    const t = nodes.editorSpec().types.find((x) => x.type === "profilecard");
    assert.deepEqual([t.label, t.group, t.icon, t.version, t.style], ["Carte de profil", "general", "users", 1, "text"]);
    assert.deepEqual(t.schema.map((f) => f.kind), ["image", "text", "text", "textarea", "link", "text", "select"]);
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Profil", kind: "page" });
    const r = pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "prf000000001", type: "profilecard", ...t.blank }] }] }, { revision: p.revision });
    assert.deepEqual(r.content.sections[0].children[0].props, { photo: "", name: "[Nom]", role: "[Rôle]", bio: "", link: "", linkLabel: "Voir le profil", align: "center" });
  });

  test("validation par type de champ : lien et image sûrs, liste, nombre, case, icône, couleur, obligatoire", () => {
    nodes.registerWidget(base({ type: "essaichamps", schema: [
      { key: "titre", kind: "text", label: "Titre", max: 10, required: true, default: "T" },
      { key: "lien", kind: "link", label: "Lien" },
      { key: "image", kind: "image", label: "Image" },
      { key: "choix", kind: "select", label: "Choix", options: [["a", "A"], ["b", "B"]], default: "a" },
      { key: "nombre", kind: "number", label: "Nombre", min: 1, max: 5, default: 3 },
      { key: "actif", kind: "bool", label: "Actif" },
      { key: "icone", kind: "icon", label: "Icône", default: "star" },
      { key: "teinte", kind: "color", label: "Couleur" },
    ] }));
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Champs", kind: "page" });
    const save = (props) => pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "chp000000001", type: "essaichamps", props }] }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].props;
    assert.deepEqual(save({ titre: "Un titre beaucoup trop long", lien: "/catalogue", image: "https://k.test/a.png", choix: "z", nombre: 99, actif: true, icone: "pas-une-icone", teinte: "red; background:url(x)" }),
      { titre: "Un titre b", lien: "/catalogue", image: "https://k.test/a.png", choix: "a", nombre: 3, actif: true, icone: "star", teinte: "" });
    assert.throws(() => save({ titre: "x", lien: "javascript:alert(1)" }));
    assert.throws(() => save({ titre: "x", image: "javascript:alert(1)" }));
    assert.throws(() => save({ titre: "" }), /Titre\) : obligatoire/);
  });

  test("versions : réglages d'une ancienne version mis à niveau à l'enregistrement, version notée sur l'élément", () => {
    nodes.registerWidget(base({ type: "essaiversion", version: 3, schema: [{ key: "titre", kind: "text", label: "Titre", required: true, default: "T" }, { key: "taille", kind: "select", label: "Taille", options: [["s", "S"], ["l", "L"]], default: "s" }],
      migrate: { 2: (p) => ({ titre: p.texte }), 3: (p) => ({ ...p, taille: p.titre.length > 5 ? "l" : "s" }) } }));
    assert.deepEqual(nodes.editorSpec().types.find((x) => x.type === "essaiversion").blank, { props: { titre: "T", taille: "s" }, v: 3 });
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Versions", kind: "page" });
    const n = pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "ver000000001", type: "essaiversion", props: { texte: "Ancien titre" } }] }] }, { revision: p.revision }).content.sections[0].children[0];
    assert.deepEqual([n.props, n.v], [{ titre: "Ancien titre", taille: "l" }, 3], "v1 → v2 → v3");
    const again = pages.saveDraft(A, p.id, { sections: [{ id: "sect00000001", type: "layout", children: [n] }] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0];
    assert.deepEqual(again.props, n.props, "déjà à jour : rien ne change");
  });

  test("permission : un widget personnalisé peut être réservé (cadenas réel)", () => {
    nodes.registerWidget(base({ type: "essaireserve", requires: "pages.code" }));
    assert.equal(nodes.editorSpec().types.find((x) => x.type === "essaireserve").requires, "pages.code");
    const sec = (kids) => [{ id: "sect00000001", type: "layout", children: kids }];
    assert.throws(() => nodes.lockedWidgetChanges([], sec([{ id: "res000000001", type: "essaireserve", props: { titre: "x" } }]), () => false), (e) => e.code === "forbidden_widget");
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  test("page publiée : carte de profil rendue par son gabarit, texte échappé, lien compté dans l'ordre", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Équipe" })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections: [{ id: "sect00000001", type: "layout", children: [
      { id: "prf000000001", type: "profilecard", props: { photo: "https://k.test/awa.jpg", name: "Awa <Kola>", role: "Formatrice", bio: "Photographe.", link: "/catalogue", linkLabel: "Ses cours", align: "left" } },
      { id: "btn000000001", type: "button", props: { label: "Après", url: "/connexion" } },
    ] }] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const html = (await boss.get(`/p/${slug}`)).text;
    assert.match(html, new RegExp(`<article class="kw-node kw-profilecard kw-n-prf000000001 is-left"><img class="kw-profile-photo" src="https://k.test/awa.jpg" alt=""[^>]*><h3 class="kw-profile-name">Awa &lt;Kola&gt;</h3><p class="kw-profile-role">Formatrice</p><p class="kw-profile-bio">Photographe.</p><a class="kw-button kw-btn-outline kw-btn-sm" href="/p/${slug}/clic/0">Ses cours</a></article>`));
    assert.match(html, new RegExp(`href="/p/${slug}/clic/1"[^>]*>Après</a>`));
    assert.equal((await boss.get(`/p/${slug}/clic/0`)).location, "/catalogue");
    assert.equal((await boss.get(`/p/${slug}/clic/1`)).location, "/connexion");
  });
});
