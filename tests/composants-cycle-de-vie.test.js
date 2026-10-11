// Composants réutilisables : cycle de vie complet sur une vraie base migrée — nature (standard / global), copie de travail et mise à jour explicite,
// instances liées exactes, suppression avec choix (instances supprimées OU conservées comme blocs indépendants), atomicité, isolation entre organisations et sites.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");

const heading = (id, text) => ({ id, type: "heading", props: { text, level: "2" } });
const box = (id, kids) => ({ id, type: "container", children: kids });
const layout = (kids) => ({ type: "layout", children: kids });
const ref = (id, componentId, extra = {}) => ({ id, type: "component", componentId, ...extra });
const content = (sections) => ({ sections, title: "T" });
const ids = (list, out = []) => { for (const x of list || []) { out.push(x.id); ids(x.children, out); } return out; };

describe("nature, copie de travail, mise à jour explicite", () => {
  const { db, A } = freshMarketing();
  const std = pages.createComponent(A, { name: "Bandeau", section: layout([box("bx0000000001", [heading("h00000000001", "Bonjour"), heading("h00000000002", "Monde")])]), kind: "standard" });
  const glo = pages.createComponent(A, { name: "Pied commun", section: layout([heading("h00000000003", "Version 1")]), kind: "global" });

  test("la nature est enregistrée ; un composant sans choix est standard ; une nature inconnue est refusée ; le nombre de blocs est exact", () => {
    assert.equal(std.kind, "standard"); assert.equal(glo.kind, "global");
    assert.equal(pages.createComponent(A, { name: "Par défaut", section: layout([heading("h00000000004", "x")]) }).kind, "standard");
    assert.throws(() => pages.createComponent(A, { name: "Bizarre", section: layout([heading("h00000000005", "x")]), kind: "partage" }), /Nature de composant inconnue/);
    assert.equal(std.blocks, 3, "conteneur + 2 titres");
    assert.equal(glo.blocks, 1);
  });

  test("les identifiants internes du modèle ne sont pas conservés comme identité de section (la section enregistrée n'a pas d'id)", () => {
    assert.equal(std.section.id, undefined);
  });

  test("une modification est une COPIE DE TRAVAIL : la version diffusée (vue par les pages) ne change pas avant la mise à jour", () => {
    const p = pages.createPage(A, { name: "Page 1" });
    pages.saveDraft(A, p.id, content([ref("s00000000001", glo.id)]), { revision: 0 });
    pages.saveComponentDraft(A, glo.id, layout([heading("h00000000003", "Version 2")]));
    const c = pages.getComponent(A, glo.id);
    assert.equal(c.hasDraft, true); assert.equal(c.version, 1);
    assert.equal(c.section.children[0].props.text, "Version 1", "version diffusée inchangée");
    const shown = pages.resolveSections(A, [ref("s00000000001", glo.id)]);
    assert.equal(shown[0].children[0].props.text, "Version 1", "les instances liées affichent toujours la version diffusée");
  });

  test("« Mettre à jour » publie la copie de travail, passe à la version 2 et touche toutes les instances liées (plusieurs pages)", () => {
    const p2 = pages.createPage(A, { name: "Page 2" });
    pages.saveDraft(A, p2.id, content([ref("s00000000002", glo.id), ref("s00000000003", glo.id)]), { revision: 0 });
    const r = pages.publishComponent(A, glo.id);
    assert.equal(r.changed, true);
    assert.equal(r.component.version, 2); assert.equal(r.component.hasDraft, false);
    assert.equal(r.instances.length, 2, "deux pages");
    assert.equal(r.instances.reduce((n, p) => n + p.count, 0), 3, "trois instances au total (1 + 2)");
    for (const x of pages.resolveSections(A, [ref("s00000000001", glo.id), ref("s00000000002", glo.id)])) assert.equal(x.children[0].props.text, "Version 2");
  });

  test("mettre à jour sans copie de travail ne change rien (pas de mise à jour inutile)", () => {
    const r = pages.publishComponent(A, glo.id);
    assert.equal(r.changed, false); assert.equal(r.component.version, 2);
  });

  test("abandonner la copie de travail restitue la version diffusée", () => {
    pages.saveComponentDraft(A, glo.id, layout([heading("h00000000003", "Brouillon à jeter")]));
    assert.equal(pages.discardComponentDraft(A, glo.id).hasDraft, false);
    assert.equal(pages.getComponent(A, glo.id).section.children[0].props.text, "Version 2");
  });

  test("renommer ne casse pas l'identité : les instances continuent de pointer le même composant", () => {
    pages.updateComponent(A, glo.id, { name: "Pied de page commun" });
    assert.equal(pages.getComponent(A, glo.id).name, "Pied de page commun");
    assert.equal(pages.componentInstances(A, glo.id).reduce((n, p) => n + p.count, 0), 3);
    assert.throws(() => pages.updateComponent(A, glo.id, { name: "Bandeau" }), /porte déjà ce nom/);
  });
});

describe("suppression avec choix", () => {
  const setup = () => {
    const { db, A, B } = freshMarketing();
    const c = pages.createComponent(A, { name: "Carte", kind: "global", section: layout([box("bx0000000010", [heading("h00000000010", "Titre A"), heading("h00000000011", "Titre B")])]) });
    const p1 = pages.createPage(A, { name: "P1" }), p2 = pages.createPage(A, { name: "P2" });
    pages.saveDraft(A, p1.id, content([ref("s00000000010", c.id, { hideOn: ["mobile"], name: "Ma carte" }), { type: "layout", id: "s00000000011", children: [heading("h00000000012", "Indépendant")] }]), { revision: 0 });
    pages.publish(A, p1.id);
    pages.saveDraft(A, p2.id, content([ref("s00000000012", c.id), ref("s00000000013", c.id)]), { revision: 0 });
    return { db, A, B, c, p1, p2 };
  };
  const working = (A, id) => { const p = pages.getPage(A, id); return p.working.sections; };

  test("sans choix, la suppression d'un composant utilisé est refusée avec le nombre réel d'instances et les pages", () => {
    const { A, c } = setup();
    try { pages.deleteComponent(A, c.id); assert.fail("devait refuser"); } catch (e) { assert.equal(e.code, "in_use"); assert.equal(e.details.instances, 3); assert.equal(e.details.pages.length, 2); }
    assert.ok(pages.getComponent(A, c.id), "rien n'est supprimé");
  });

  test("option A : supprimer le composant ET ses instances ; les blocs indépendants ne sont pas touchés", () => {
    const { A, c, p1, p2 } = setup();
    const r = pages.deleteComponent(A, c.id, { mode: "instances" });
    assert.equal(r.instances >= 3, true);
    assert.equal(pages.getComponent(A, c.id), null);
    const w1 = working(A, p1.id); assert.equal(w1.length, 1); assert.equal(w1[0].id, "s00000000011", "la section indépendante reste");
    assert.equal(working(A, p2.id).length, 0);
  });

  test("option B : supprimer le composant, CONSERVER les instances comme blocs indépendants (contenu, structure, réglages locaux) avec de nouveaux identifiants", () => {
    const { A, c, p1, p2 } = setup();
    pages.deleteComponent(A, c.id, { mode: "detach" });
    assert.equal(pages.getComponent(A, c.id), null);
    const w1 = working(A, p1.id);
    assert.equal(w1.length, 2);
    assert.equal(w1[0].type, "layout", "devenue une vraie section libre");
    assert.equal(w1[0].id, "s00000000010", "la place et l'identité de l'instance sont conservées");
    assert.deepEqual(w1[0].hideOn, ["mobile"], "réglage local conservé"); assert.equal(w1[0].name, "Ma carte");
    assert.equal(w1[0].children[0].children[0].props.text, "Titre A"); assert.equal(w1[0].children[0].children[1].props.text, "Titre B");
    const w2 = working(A, p2.id);
    assert.equal(w2.length, 2);
    const all = [...ids(w1), ...ids(w2)];
    assert.equal(new Set(all).size, all.length, "aucun identifiant en double entre les instances détachées");
    assert.ok(!all.includes("bx0000000010"), "les identifiants du composant source ne sont pas réutilisés");
    for (const s of [...w1, ...w2]) assert.notEqual(s.type, "component", "aucune référence orpheline");
  });

  test("la version EN LIGNE de la page est convertie aussi (aucune référence orpheline nulle part)", () => {
    const { db, A, c, p1 } = setup();
    pages.deleteComponent(A, c.id, { mode: "detach" });
    const live = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(p1.id).sections);
    assert.equal(live[0].type, "layout");
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE sections LIKE '%\"componentId\"%' OR draft LIKE '%\"componentId\"%'").get().n, 0);
  });

  test("skipDraftOfPage : le brouillon de la page ouverte est laissé à l'éditeur (annulable), sa version en ligne est traitée", () => {
    const { db, A, c, p1, p2 } = setup();
    pages.deleteComponent(A, c.id, { mode: "detach", skipDraftOfPage: p2.id });
    assert.equal(working(A, p1.id)[0].type, "layout");
    assert.equal(working(A, p2.id)[0].type, "component", "laissé tel quel pour l'éditeur ouvert");
  });

  test("atomicité : si la conversion échoue, le composant n'est PAS supprimé et aucune page n'est modifiée", () => {
    const { db, A, c, p1 } = setup();
    const before = db.prepare("SELECT sections, draft, revision FROM mk_landing_pages WHERE id = ?").get(p1.id);
    // composant sans section lisible : la copie indépendante est impossible
    db.prepare("UPDATE mk_web_components SET section = 'pas du json' WHERE id = ?").run(c.id);
    assert.throws(() => pages.deleteComponent(A, c.id, { mode: "detach" }));
    assert.ok(db.prepare("SELECT 1 FROM mk_web_components WHERE id = ?").get(c.id), "composant conservé");
    assert.deepEqual(db.prepare("SELECT sections, draft, revision FROM mk_landing_pages WHERE id = ?").get(p1.id), before, "page intacte");
  });

  test("un composant sans instance se supprime directement ; un choix inconnu est refusé", () => {
    const { A } = setup();
    const lone = pages.createComponent(A, { name: "Seul", section: layout([heading("h00000000020", "x")]) });
    assert.equal(pages.deleteComponent(A, lone.id).mode, "none");
    const c2 = pages.createComponent(A, { name: "Autre", kind: "global", section: layout([heading("h00000000021", "x")]) });
    const p = pages.createPage(A, { name: "PX" }); pages.saveDraft(A, p.id, content([ref("s00000000030", c2.id)]), { revision: 0 });
    assert.throws(() => pages.deleteComponent(A, c2.id, { mode: "tout" }), /Choix de suppression inconnu/);
  });
});

describe("isolation", () => {
  test("un composant d'une organisation n'est ni visible, ni modifiable, ni supprimable par une autre", () => {
    const { A, B } = freshMarketing();
    const c = pages.createComponent(A, { name: "Privé", section: layout([heading("h00000000040", "x")]), kind: "global" });
    assert.equal(pages.getComponent(B, c.id), null);
    assert.throws(() => pages.saveComponentDraft(B, c.id, layout([heading("h00000000041", "y")])), /introuvable/);
    assert.throws(() => pages.deleteComponent(B, c.id), /introuvable/);
    assert.equal(pages.listComponents(B).length, 0);
  });

  test("un composant réservé à un site n'apparaît pas pour un autre site de la même organisation", () => {
    const { A } = freshMarketing();
    const s1 = pages.createSite(A, { name: "Site un" }), s2 = pages.createSite(A, { name: "Site deux" });
    const c = pages.createComponent(A, { name: "Du site un", section: layout([heading("h00000000050", "x")]), siteId: s1.id });
    assert.equal(pages.listComponents(A, { siteId: s1.id }).some((x) => x.id === c.id), true);
    assert.equal(pages.listComponents(A, { siteId: s2.id }).some((x) => x.id === c.id), false);
  });
});

describe("migration : les composants déjà utilisés comme références restent globaux", () => {
  test("la colonne « kind » existe avec « standard » par défaut, « draft » et « version » aussi", () => {
    const { db } = freshMarketing();
    const cols = db.prepare("PRAGMA table_info(mk_web_components)").all().map((c) => `${c.name}:${c.dflt_value}`);
    assert.ok(cols.includes("kind:'standard'")); assert.ok(cols.some((c) => c.startsWith("draft:"))); assert.ok(cols.includes("version:1"));
  });
});
