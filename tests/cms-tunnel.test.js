// KOLAKISA CMS — palier 18 : CMS ↔ Tunnel (service). Une étape de tunnel est une RÉFÉRENCE vers une page CMS ; jamais de copie du contenu.
// Base en mémoire avec les vraies migrations.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const funnels = require("../src/marketing/funnels");
const pages = require("../src/marketing/pages");
const landing = require("../src/marketing/landing");
const core = require("../src/marketing/contactcore");
const { emitVisitEvents } = require("../src/marketing/visitors/triggers");

let m, A, db, S1, S2;
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const makePage = (name, extra = {}) => pages.createPage(A, { name, ...extra });
const publishRaw = (id) => db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(id);
const stepsOf = (f) => funnels.getFunnel(A, f.id).steps;
// Étape sans page : créée avec une page puis détachée (le détachement est l'opération réelle qui produit cet état)
const bareStep = (ctx, f, name = "Vide") => { const { id } = funnels.addStep(ctx, f.id, { type: "custom", name, newPage: true }); funnels.detachStepPage(ctx, f.id, id); return id; };

beforeEach(() => {
  m = freshMarketing(); A = m.A; db = m.db;
  db.exec("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha'), (1, 'Bravo')");
  S1 = { ...A, siteScope: 1 }; S2 = { ...A, siteScope: 2 };
});

describe("une seule page, une seule source de vérité", () => {
  test("une étape ne stocke qu'une RÉFÉRENCE : aucune copie de la page, et la modification de la page est visible dans le tunnel", () => {
    const page = makePage("Page de vente");
    const f = funnels.createFunnel(A, { name: "Tunnel" });
    const { id: stepId } = funnels.addStep(A, f.id, { type: "page", name: "Vente", pageId: page.id });
    const pagesBefore = count("SELECT COUNT(*) n FROM mk_landing_pages");
    const step = one("SELECT * FROM mk_funnel_steps WHERE id = ?", stepId);
    assert.equal(step.page_id, page.id);
    // le schéma de l'étape ne contient AUCUN contenu de page
    const cols = db.prepare("PRAGMA table_info(mk_funnel_steps)").all().map((c) => c.name);
    for (const forbidden of ["sections", "content", "html", "draft", "title", "description"]) assert.ok(!cols.includes(forbidden), forbidden);
    // on modifie la page (brouillon puis publication) : le tunnel désigne toujours la MÊME page, désormais publiée
    pages.saveDraft(A, page.id, { title: "Nouveau titre", sections: [{ type: "text", markdown: "Contenu modifié" }] }, { revision: pages.getPage(A, page.id).revision });
    pages.publish(A, page.id);
    const d = stepsOf(f)[0];
    assert.equal(d.pageId, page.id); assert.equal(d.live, true); assert.equal(d.pageStatus, "published");
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages"), pagesBefore, "aucune page créée par la modification");
    assert.equal(landing.getPublishedPage(db, page.slug).title, "Nouveau titre", "la page servie est la page CMS elle-même");
  });
  test("« Créer avec KOLAKISA CMS » : UNE nouvelle page CMS (brouillon, nature « étape ») associée à l'étape, dans le même site", () => {
    const f = funnels.createFunnel(S1, { name: "Alpha tunnel" });
    const before = count("SELECT COUNT(*) n FROM mk_landing_pages");
    const { id } = funnels.addStep(S1, f.id, { type: "landing", name: "Entrée", newPage: true });
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages"), before + 1);
    const p = one("SELECT * FROM mk_landing_pages WHERE id = (SELECT page_id FROM mk_funnel_steps WHERE id = ?)", id);
    assert.equal(p.kind, "step"); assert.equal(p.status, "draft"); assert.equal(p.site_id, 1);
  });
  test("détacher : l'étape reste, la page CMS n'est PAS supprimée ; remplacer : l'ancienne page n'est pas touchée", () => {
    const p1 = makePage("P1"), p2 = makePage("P2");
    const f = funnels.createFunnel(A, { name: "T" });
    const { id } = funnels.addStep(A, f.id, { type: "page", name: "E", pageId: p1.id });
    funnels.replaceStepPage(A, f.id, id, p2.id);
    assert.equal(stepsOf(f)[0].pageId, p2.id);
    assert.ok(pages.getPage(A, p1.id), "l'ancienne page existe toujours");
    funnels.detachStepPage(A, f.id, id);
    const d = stepsOf(f)[0];
    assert.equal(d.pageId, null); assert.match(d.problem, /Aucune page/);
    assert.ok(pages.getPage(A, p2.id), "la page détachée existe toujours");
    assert.equal(count("SELECT COUNT(*) n FROM mk_funnel_steps WHERE funnel_id = ?", f.id), 1, "l'étape est conservée");
    // une étape sans page en reçoit une nouvelle (transaction)
    const made = funnels.createStepPage(A, f.id, id);
    assert.equal(stepsOf(f)[0].pageId, made.pageId);
    assert.ok(code(() => funnels.createStepPage(A, f.id, id)), "une étape qui a déjà une page n'en reçoit pas une seconde");
  });
  test("création de page échouée : l'étape reste inchangée (aucun état à moitié enregistré)", () => {
    const f = funnels.createFunnel(A, { name: "T2" });
    const id = bareStep(A, f);
    // modèle inconnu → refus ; aucune page ni association
    const before = count("SELECT COUNT(*) n FROM mk_landing_pages");
    assert.ok(code(() => funnels.createStepPage(A, f.id, id, { template: "inexistant" })));
    assert.equal(count("SELECT COUNT(*) n FROM mk_landing_pages"), before);
    assert.equal(stepsOf(f)[0].pageId, null);
  });
  test("une page dans un seul tunnel ACTIF ; dupliquer un tunnel : copies (nouveaux identifiants) ou étapes sans page — jamais deux tunnels actifs sur la même page", () => {
    const p = makePage("Partagée");
    const f1 = funnels.createFunnel(A, { name: "F1" }), f2 = funnels.createFunnel(A, { name: "F2" });
    funnels.addStep(A, f1.id, { type: "page", name: "E", pageId: p.id });
    assert.equal(code(() => funnels.addStep(A, f2.id, { type: "page", name: "E", pageId: p.id })), "in_use");
    const copy = funnels.duplicateFunnel(A, f1.id);
    assert.notEqual(copy.steps[0].pageId, p.id); assert.equal(copy.steps[0].settings.noindex, false);
    const bare = funnels.duplicateFunnel(A, f1.id, { pages: "none" });
    assert.equal(bare.steps[0].pageId, null); assert.equal(bare.steps.length, 1);
    assert.ok(code(() => funnels.duplicateFunnel(A, f1.id, { pages: "tout" })), "mode de duplication inconnu refusé");
    // la page d'origine est vue de ses tunnels
    assert.deepEqual(funnels.funnelsOfPage(A, p.id).map((u) => u.name), ["F1"]);
  });
});

describe("isolation par site", () => {
  test("une page d'un autre site (ou sans site) est refusée côté serveur : ajout, remplacement et page_id injecté", () => {
    const pA = makePage("Page Alpha", { siteId: 1 }), pB = makePage("Page Bravo", { siteId: 2 }), pP = makePage("Page principale");
    const f = funnels.createFunnel(A, { name: "Alpha", siteId: 1 });
    assert.equal(f.site_id, 1);
    assert.ok(funnels.addStep(A, f.id, { type: "page", name: "OK", pageId: pA.id }));
    for (const bad of [pB, pP]) assert.equal(code(() => funnels.addStep(A, f.id, { type: "page", name: "Intrus", pageId: bad.id })), "invalid_field");
    const id = bareStep(A, f);
    assert.equal(code(() => funnels.replaceStepPage(A, f.id, id, pB.id)), "invalid_field");
    assert.equal(code(() => funnels.replaceStepPage(A, f.id, id, 99999)), "invalid_field");
    assert.equal(count("SELECT COUNT(*) n FROM mk_funnel_steps WHERE funnel_id = ?", f.id), 2, "aucune étape intruse");
    assert.equal(stepsOf(f).find((x) => x.id === id).pageId, null, "l'étape vide n'a reçu aucune page d'un autre site");
    // le tunnel du site principal n'accepte pas une page de site
    const main = funnels.createFunnel(A, { name: "Principal" });
    assert.equal(code(() => funnels.addStep(A, main.id, { type: "page", name: "X", pageId: pA.id })), "invalid_field");
  });
  test("accès limité à un site : ne voit, ne modifie, ne crée que dans son site ; les tunnels des autres sites sont invisibles", () => {
    const a = funnels.createFunnel(A, { name: "Tunnel A", siteId: 1 }), b = funnels.createFunnel(A, { name: "Tunnel B", siteId: 2 }), p = funnels.createFunnel(A, { name: "Tunnel P" });
    assert.deepEqual(funnels.listFunnels(S1).map((f) => f.name), ["Tunnel A"]);
    assert.equal(funnels.getFunnel(S1, b.id), null); assert.equal(funnels.getFunnel(S1, p.id), null);
    assert.equal(code(() => funnels.addStep(S1, b.id, { type: "custom", name: "X", newPage: true })), "not_found");
    assert.equal(code(() => funnels.duplicateFunnel(S1, b.id)), "not_found");
    assert.equal(funnels.createFunnel(S1, { name: "Créé en site", siteId: 2 }).site_id, 1, "site imposé");
    assert.equal(funnels.duplicateFunnel(A, a.id).site_id, 1, "la copie reste dans le site");
    assert.deepEqual(funnels.listFunnels(S2).map((f) => f.name), ["Tunnel B"]);
  });
  test("référence cassée : page d'un autre site (données anciennes) signalée, jamais servie", () => {
    const pB = makePage("Page Bravo", { siteId: 2 });
    const f = funnels.createFunnel(A, { name: "Ancien", siteId: 1 });
    publishRaw(pB.id);
    // Depuis le palier 2 la base refuse cette association (déclencheur) : on la prouve, puis on simule une donnée d'AVANT le palier 2 en retirant le déclencheur
    assert.throws(() => db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (1, ?, 1, 'page', 'Cassée', ?)").run(f.id, pB.id), /site différent/);
    db.exec("DROP TRIGGER mk_funnel_steps_same_site_insert");
    db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id) VALUES (1, ?, 1, 'page', 'Cassée', ?)").run(f.id, pB.id);
    const d = stepsOf(f)[0];
    assert.equal(d.live, false); assert.match(d.problem, /autre site/);
    const orphan = funnels.contextForPage(db, { id: pB.id, organization_id: 1, site_id: 2 });
    assert.equal(orphan, null, "pas de contexte de tunnel pour une page d'un autre site");
  });
});

describe("pages utilisées par un tunnel : suppression protégée", () => {
  function used() {
    const page = makePage("Utilisée"); publishRaw(page.id);
    const f = funnels.createFunnel(A, { name: "Mon tunnel" });
    funnels.addStep(A, f.id, { type: "page", name: "Étape clé", pageId: page.id });
    return { page, f };
  }
  test("mise à la corbeille : refusée tant que la page sert à un tunnel actif, avec la liste des tunnels ; détachement explicite possible", () => {
    const { page, f } = used();
    let message = "";
    try { pages.archivePage(A, page.id); } catch (e) { message = e.message; assert.equal(e.code, "in_use"); }
    assert.match(message, /utilisée par 1 tunnel/); assert.match(message, /Mon tunnel/); assert.match(message, /Étape clé/);
    assert.equal(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", page.id).archived_at, null);
    pages.archivePage(A, page.id, { detach: true });
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", page.id).archived_at, "page archivée");
    assert.equal(stepsOf(f)[0].pageId, null, "l'étape est détachée, pas laissée sur une référence cassée");
    assert.equal(count("SELECT COUNT(*) n FROM mk_funnel_steps WHERE funnel_id = ?", f.id), 1);
  });
  test("suppression définitive : même protection ; sans protection, aucune référence cassée ne subsiste", () => {
    const { page, f } = used();
    db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(page.id);
    assert.equal(code(() => landing.deletePage(A, page.id)), "in_use");
    assert.ok(pages.getPage(A, page.id), "page toujours là");
    landing.deletePage(A, page.id, { detach: true });
    assert.equal(pages.getPage(A, page.id), null);
    assert.equal(stepsOf(f)[0].pageId, null);
  });
  test("tunnel archivé : sa page n'est plus protégée ; une page libre se supprime normalement", () => {
    const { page, f } = used();
    funnels.archiveFunnel(A, f.id);
    pages.archivePage(A, page.id);
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", page.id).archived_at);
    const free = makePage("Libre");
    pages.archivePage(A, free.id);
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", free.id).archived_at);
  });
});

describe("contexte de l'étape (réglages propres au tunnel)", () => {
  test("remerciement : non indexé par défaut ; les réglages vivent dans l'étape, jamais dans la page CMS", () => {
    const p = makePage("Merci"), q = makePage("Atterrissage");
    const f = funnels.createFunnel(A, { name: "Ctx" });
    const thanks = funnels.addStep(A, f.id, { type: "thankyou", name: "Merci", pageId: p.id });
    const land = funnels.addStep(A, f.id, { type: "landing", name: "Entrée", pageId: q.id });
    const stepP = stepsOf(f).find((s) => s.id === thanks.id), stepQ = stepsOf(f).find((s) => s.id === land.id);
    assert.equal(stepP.settings.noindex, true); assert.equal(stepQ.settings.noindex, false);
    const pageRowBefore = JSON.stringify(one("SELECT * FROM mk_landing_pages WHERE id = ?", q.id));
    funnels.updateStepSettings(A, f.id, land.id, { noindex: true, hideFooter: true, goal: "Inscription au guide" });
    assert.equal(JSON.stringify(one("SELECT * FROM mk_landing_pages WHERE id = ?", q.id)), pageRowBefore, "la page CMS n'est pas modifiée par les réglages d'étape");
    const ctx = funnels.contextForPage(db, one("SELECT * FROM mk_landing_pages WHERE id = ?", q.id));
    assert.deepEqual([ctx.noindex, ctx.hideFooter, ctx.goal, ctx.funnelName, ctx.stepName], [true, true, "Inscription au guide", "Ctx", "Entrée"]);
    assert.equal(funnels.contextForPage(db, one("SELECT * FROM mk_landing_pages WHERE id = ?", makePage("Hors tunnel").id)), null);
    funnels.archiveFunnel(A, f.id);
    assert.equal(funnels.contextForPage(db, one("SELECT * FROM mk_landing_pages WHERE id = ?", q.id)), null, "tunnel archivé : plus de contexte");
  });
  test("réglages invalides refusés (type, injection de structure) ; l'objectif est borné", () => {
    const f = funnels.createFunnel(A, { name: "V" });
    const { id } = funnels.addStep(A, f.id, { type: "custom", name: "E", newPage: true });
    assert.ok(code(() => funnels.updateStepSettings(A, f.id, id, "pirate")));
    assert.ok(code(() => funnels.updateStepSettings(A, f.id, id, ["x"])));
    const s = funnels.updateStepSettings(A, f.id, id, { goal: `<img onerror=alert(1)>${"x".repeat(500)}`, noindex: "on" });
    assert.ok(s.goal.length <= 120); assert.equal(s.noindex, true);
  });
});

describe("navigation et événements", () => {
  test("étape suivante et étape précise : seulement dans le même tunnel, seulement si atteignable (jamais d'adresse inventée)", () => {
    const p1 = makePage("S1"), p2 = makePage("S2"), p3 = makePage("S3"), other = makePage("Autre");
    for (const p of [p1, p2, p3, other]) publishRaw(p.id);
    const f = funnels.createFunnel(A, { name: "Nav" }), g = funnels.createFunnel(A, { name: "Autre tunnel" });
    funnels.addStep(A, f.id, { type: "landing", name: "1", pageId: p1.id });
    const s2 = funnels.addStep(A, f.id, { type: "page", name: "2", pageId: p2.id });
    const s3 = funnels.addStep(A, f.id, { type: "page", name: "3", pageId: p3.id });
    const sg = funnels.addStep(A, g.id, { type: "page", name: "G", pageId: other.id });
    const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
    assert.equal(funnels.nextUrlForPage(db, row(p1.id)), `/p/${p2.slug}`);
    assert.equal(funnels.stepUrlForPage(db, row(p1.id), s3.id), `/p/${p3.slug}`);
    assert.equal(funnels.stepUrlForPage(db, row(p1.id), sg.id), null, "étape d'un autre tunnel : refusée");
    assert.equal(funnels.stepUrlForPage(db, row(p1.id), 999999), null);
    db.prepare("UPDATE mk_landing_pages SET status = 'unpublished' WHERE id = ?").run(p2.id);
    assert.equal(funnels.nextUrlForPage(db, row(p1.id)), `/p/${p3.slug}`, "une étape hors ligne est sautée");
    assert.equal(funnels.stepUrlForPage(db, row(p1.id), s2.id), null, "étape hors ligne : pas d'adresse");
  });
  test("événements du tunnel dans le journal du Contact Core : étape atteinte et tunnel terminé, avec l'étape (objet) et le site", () => {
    const p1 = makePage("E1", { siteId: 1 }), p2 = makePage("E2", { siteId: 1 });
    publishRaw(p1.id); publishRaw(p2.id);
    const f = funnels.createFunnel(S1, { name: "Événements", siteId: 1 });
    funnels.addStep(S1, f.id, { type: "landing", name: "Entrée", pageId: p1.id });
    const last = funnels.addStep(S1, f.id, { type: "page", name: "Fin", pageId: p2.id });
    const c = core.identify(A, { email: "visiteur@x.fr", siteId: 1 }).contact;
    emitVisitEvents(A, { contactId: c.id, sessionId: "s1", pageViews: [{ pageId: p1.id }, { pageId: p2.id }] });
    const ev = db.prepare("SELECT name, object_type, object_id, site_id FROM mk_events WHERE contact_id = ? AND name LIKE 'funnel.%' ORDER BY id").all(c.id);
    // palier 19 : entrée dans le tunnel et étape précédente terminée s'ajoutent aux événements d'étape
    assert.deepEqual(ev.map((e) => e.name), ["funnel.entered", "funnel.step_reached", "funnel.step_reached", "funnel.step.completed", "funnel.completed"]);
    assert.deepEqual(ev.map((e) => e.object_type), ["funnel", "funnel_step", "funnel_step", "funnel_step", "funnel"]);
    assert.equal(ev[2].object_id, String(last.id)); assert.ok(ev.every((e) => e.site_id === 1));
    emitVisitEvents(A, { contactId: c.id, sessionId: "s1", pageViews: [{ pageId: p1.id }] }); // même session rejouée
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE contact_id = ? AND name = 'funnel.step_reached'", c.id), 2, "idempotent : pas de double comptage");
  });
});
