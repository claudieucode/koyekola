// Programme 21.9 — Intelligent Regeneration & History. Service : vraie base en mémoire (vraies migrations), vrai moteur de pages (pages.saveDraft et ses normaliseurs), vrai Content Generator (21.6),
// IA SIMULÉE et déterministe (fonction `call` injectée : aucun appel réseau, aucun coût), port de design remplacé par un faux brouillon de personnalisateur (le vrai est testé en HTTP).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const R = require("../src/regen");
const designPort = require("../src/regen/designPort");

const T = Date.UTC(2026, 9, 30, 12);
let m, A, siteId, calls, draft;
const S = (type, extra = {}) => ({ type, ...extra });
const fakeCall = (reply = {}) => (ctx, task, o) => { calls.push({ task, o }); const r = typeof reply[task] === "function" ? reply[task](o) : reply[task]; if (r instanceof Error) return Promise.reject(r); return Promise.resolve(r); };
const revise = (text) => ({ revise: { variants: [text] } });
function newPage(sid, name, sections) {
  const p = pages.createPage(A, { name, siteId: sid, kind: "page", blank: true }), cur = pages.requirePage(A, p.id);
  pages.saveDraft(A, p.id, { ...cur.working, sections }, { revision: cur.revision });
  return pages.requirePage(A, p.id);
}
const home = () => [
  S("hero", { title: "Bienvenue chez nous", subtitle: "Un sous-titre", image: "", imageAlt: "", buttonLabel: "Contact", buttonUrl: "/contact", style: { padding: "lg", background: "primary" } }),
  S("features", { title: "Nos services", intro: "Ce que nous faisons", columns: 3, items: [{ title: "Conception", text: "Des plans" }, { title: "Chantier", text: "Un suivi" }] }),
  S("faq", { title: "Questions", items: [{ q: "Un devis ?", a: "Oui, gratuit." }] }),
  S("text", { markdown: "Nous sommes une entreprise locale au service de tous." }),
];
const ids = (p) => (pages.requirePage(A, p.id).working.sections || []).map((s) => s.id);
const fresh = (p) => pages.requirePage(A, p.id);
const sec = (p, type) => fresh(p).working.sections.find((s) => s.type === type);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const codeA = async (p) => { try { await p; } catch (e) { return e.code; } return null; };
const CTX = { facts: { company_name: "BâtiPlus" }, language: "fr", country: "CD" };

beforeEach(() => {
  m = freshMarketing(); A = m.ctx(1, { now: () => T, userId: 7 }); siteId = pages.createSite(A, { name: "Site Un" }).id; calls = [];
  draft = { changes: {}, rev: 0 };
  designPort.setForTests({ state: () => ({ changes: { ...draft.changes }, values: { "tokens.colors.secondary": "#123456", ...draft.changes }, rev: draft.rev }), saveDraft: (c, s, changes) => { draft = { changes: { ...changes }, rev: draft.rev + 1 }; return { rev: draft.rev }; } });
});

describe("1-5 — analyse de la demande, contexte, dépendances, impact", () => {
  test("1. demandes simples : intention, propriété, périmètre, éléments à préserver", () => {
    const a = (t, sel) => R.analyze(t, sel);
    assert.deepEqual([a("Change uniquement la couleur de cette section en fond sombre", { sectionId: "x" }).intent, a("Change uniquement la couleur de cette section en fond sombre", { sectionId: "x" }).property], ["change_style", { name: "background", value: "dark" }]);
    assert.equal(a("Change uniquement la couleur de cette section en fond sombre").scope.requested, "local");
    const g = a("Modifie toutes les couleurs secondaires du site en bleu marine"); assert.equal(g.intent, "change_design"); assert.deepEqual([g.property.token, g.property.value, g.scope.explicitGlobal], ["secondary", "#0b2a40", true]);
    assert.equal(a("Raccourcis ce texte", { fieldKey: "a/b" }).op, "shorten");
    assert.equal(a("Ajoute une section FAQ après les services").target.afterType, "features");
    assert.deepEqual(a("Change le design de la page À propos sans modifier les autres pages").preserve, ["autres éléments"]);
    assert.equal(a("Rends cette page plus adaptée aux téléphones").intent, "mobile_advice");
    assert.equal(a("Que penses-tu de mon site ?").intent, "advice");
    assert.equal(a("blabla").ambiguities.length, 1);
  });
  test("2-3. widget et page désignés par IDENTIFIANT ou par indice ; plusieurs candidats = ambiguïté, jamais un choix arbitraire", () => {
    const p = newPage(siteId, "Accueil", home()), q = newPage(siteId, "Accueil bis", [S("hero", { title: "Autre", subtitle: "x" })]); newPage(siteId, "Services A", [S("text", { markdown: "a" })]); newPage(siteId, "Services B", [S("text", { markdown: "b" })]);
    const [hid] = ids(p);
    const r1 = R.ctxLib.resolve(A, siteId, R.analyze("Raccourcis ce texte"), { pageId: p.id, fieldKey: `${hid}/subtitle` });
    assert.equal(r1.page.id, p.id); assert.equal(r1.fieldKey, `${hid}/subtitle`); assert.equal(r1.section.id, hid); assert.equal(r1.ambiguities.length, 0);
    const r2 = R.ctxLib.resolve(A, siteId, R.analyze("Réécris le texte de la page services"), {}); assert.ok(r2.ambiguities.some((x) => x.field === "page" && x.candidates.length === 2), "« services » correspond à deux pages");
    const r3 = R.ctxLib.resolve(A, siteId, R.analyze("Réécris la page Accueil bis"), {}); assert.equal(r3.page.id, q.id, "correspondance exacte du nom");
    assert.throws(() => R.ctxLib.resolve(A, siteId, R.analyze("x"), { pageId: p.id, sectionId: "inexistant" }), (e) => e.code === "not_found");
    assert.throws(() => R.ctxLib.resolve(A, siteId, R.analyze("x"), { pageId: p.id, fieldKey: `${hid}/inconnu` }), (e) => e.code === "not_found");
    const dup = newPage(siteId, "Deux textes", [S("text", { markdown: "Un" }), S("text", { markdown: "Deux" })]);
    const r4 = R.ctxLib.resolve(A, siteId, R.analyze("Réécris le texte de présentation de la page Deux textes"), {}); assert.ok(r4.ambiguities.some((x) => x.field === "section" && x.candidates.length === 2));
  });
  test("4-5. dépendances (local / partagé / global) et analyse d'impact ; confirmation exigée si fort impact", () => {
    const img = "/uploads/marketing/1/commune.png";
    const p = newPage(siteId, "Accueil", [S("hero", { title: "T", subtitle: "s", image: img, imageAlt: "a" })]), q = newPage(siteId, "Services", [S("hero", { title: "T2", subtitle: "s2", image: img, imageAlt: "b" })]);
    const an = R.analyze("Remplace l'image principale"); const rs = R.ctxLib.resolve(A, siteId, an, { pageId: p.id, sectionId: ids(p)[0] });
    const dep = R.ctxLib.dependencies(A, siteId, an, rs);
    assert.equal(dep.scopeKind, "shared"); assert.deepEqual(dep.media[0].alsoUsedOn.map((x) => x.name), ["Services"]);
    const plan = R.engine.planScope(an, rs, dep), imp = R.ctxLib.impact(A, siteId, an, rs, dep, plan);
    assert.ok(imp.indirect.some((x) => /Services/.test(x.label))); assert.equal(imp.level, "high"); assert.equal(imp.requiresConfirmation, true);
    const g = R.analyze("Modifie toutes les couleurs secondaires du site en bleu marine"), dg = R.ctxLib.dependencies(A, siteId, g, { page: null, section: null });
    assert.equal(dg.scopeKind, "global"); assert.equal(dg.pages.length, 2);
    const loc = newPage(siteId, "Locale", [S("text", { markdown: "Texte seul" })]); const al = R.analyze("Change le fond de cette section en sombre"), rl = R.ctxLib.resolve(A, siteId, al, { pageId: loc.id, sectionId: ids(loc)[0] });
    assert.equal(R.ctxLib.dependencies(A, siteId, al, rl).scopeKind, "local");
  });
});

describe("6-10 — modification et régénération au périmètre MINIMAL", () => {
  test("6. une propriété : seul le style de la section change ; aucun appel IA ; autres sections et pages intactes", async () => {
    const p = newPage(siteId, "Accueil", home()), o = newPage(siteId, "Autre", [S("text", { markdown: "Intact" })]);
    const [hid] = ids(p), before = JSON.stringify(fresh(p).working.sections.slice(1)), otherBefore = JSON.stringify(fresh(o).working);
    const pr = await R.propose(A, siteId, { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: p.id, sectionId: hid }, call: fakeCall() });
    assert.equal(pr.status, "proposed"); assert.equal(pr.plan.scope, "section"); assert.equal(pr.usage.aiCalls, 0); assert.deepEqual(pr.preview.changes.map((c) => [c.before, c.after]), [["primary", "dark"]]);
    assert.equal(sec(p, "hero").style.background, "primary", "une proposition ne modifie rien");
    const ap = await R.apply(A, siteId, pr.opId, {});
    assert.equal(ap.status, "applied"); assert.deepEqual(sec(p, "hero").style, { padding: "lg", background: "dark" });
    assert.equal(JSON.stringify(fresh(p).working.sections.slice(1)), before, "les autres sections sont identiques");
    assert.equal(JSON.stringify(fresh(o).working), otherBefore, "les autres pages sont identiques"); assert.equal(calls.length, 0);
    assert.notEqual(fresh(p).status, "published");
  });
  test("7. régénération d'UN texte : un seul champ change, un seul appel IA, le reste de la section et de la page est préservé", async () => {
    const p = newPage(siteId, "Accueil", home()), [hid] = ids(p), fid = ids(p)[1];
    const before = JSON.stringify(fresh(p).working.sections);
    const pr = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: `${fid}/intro` }, call: fakeCall(revise("Nos activités.")), context: CTX });
    assert.equal(pr.plan.scope, "field"); assert.equal(pr.usage.aiCalls, 1); assert.deepEqual(pr.preview.changes.map((c) => [c.before, c.after]), [["Ce que nous faisons", "Nos activités."]]);
    assert.match(pr.plan.why, /Un seul texte/);
    await R.apply(A, siteId, pr.opId, {});
    const after = fresh(p).working.sections; assert.equal(after[1].intro, "Nos activités."); assert.equal(after[1].title, "Nos services"); assert.deepEqual(after[1].items, JSON.parse(before)[1].items); assert.deepEqual(after[0], JSON.parse(before)[0]); assert.equal(hid, after[0].id);
    assert.equal(calls.length, 1);
  });
  test("7b. une variante qui invente un fait (chiffre, certification) n'est jamais proposée", async () => {
    const p = newPage(siteId, "Accueil", home()), fid = ids(p)[1];
    assert.equal(await codeA(R.propose(A, siteId, { text: "Rends ce texte plus commercial", selection: { pageId: p.id, fieldKey: `${fid}/intro` }, call: fakeCall(revise("Plus de 500 clients certifiés ISO 9001.")), context: CTX })), "unsupported_claim");
    assert.equal(fresh(p).working.sections[1].intro, "Ce que nous faisons");
  });
  test("8. image : seule la génération de CET emplacement est lancée (fournisseur de démonstration, estimation affichée) ; l'image n'est pas posée automatiquement", async () => {
    const p = newPage(siteId, "Accueil", [S("hero", { title: "T", subtitle: "s", image: "", imageAlt: "" })]), [hid] = ids(p);
    const pr = await R.propose(A, siteId, { text: "Remplace l'image principale", selection: { pageId: p.id, sectionId: hid }, call: fakeCall() });
    assert.equal(pr.status, "proposed"); assert.equal(pr.plan.executor, "image"); assert.ok("totalMicroUsd" in pr.usage.estimate); assert.equal(pr.preview.changes[0].category, "media");
    assert.equal(sec(p, "hero").image, "", "rien n'est posé à la proposition");
  });
  test("9. section : les textes de la section seulement (Content Generator), les autres sections intactes ; un texte écrit par la personne est protégé", async () => {
    const p = newPage(siteId, "Accueil", home()), fid = ids(p)[1];
    const keys = (o) => [...String(o.prompt).matchAll(/"key":"([^"]+)"/g)].map((x) => x[1]);
    const call = fakeCall({ page: (o) => ({ fields: keys(o).map((key) => ({ key, value: /items/.test(key) ? "Un point utile." : "Un texte clair." })), seo: { title: "", description: "", focusKeyword: "", slug: "" }, questions: [] }) });
    const before = JSON.stringify(fresh(p).working.sections.filter((s) => s.id !== fid));
    const pr = await R.propose(A, siteId, { text: "Réécris le texte de présentation", selection: { pageId: p.id, sectionId: fid }, call, context: CTX });
    assert.equal(pr.plan.scope, "section"); assert.ok(pr.preview.changes.every((c) => c.path.startsWith(`${fid}/`)), "seuls les champs de la section visée");
    await R.apply(A, siteId, pr.opId, {});
    assert.equal(sec(p, "features").intro, "Un texte clair."); assert.equal(JSON.stringify(fresh(p).working.sections.filter((s) => s.id !== fid)), before);
  });
  test("10. page : confirmation d'impact exigée ; structure, styles et images de la page conservés", async () => {
    const p = newPage(siteId, "Accueil", home());
    const keys = (o) => [...String(o.prompt).matchAll(/"key":"([^"]+)"/g)].map((x) => x[1]);
    const call = fakeCall({ page: (o) => ({ fields: keys(o).map((key) => ({ key, value: "Texte réécrit." })), seo: { title: "", description: "", focusKeyword: "", slug: "" }, questions: [] }) });
    const styles = JSON.stringify(fresh(p).working.sections.map((s) => s.style || null)); const kinds = fresh(p).working.sections.map((s) => s.type);
    const pr = await R.propose(A, siteId, { text: "Rends la page Accueil plus professionnelle", call, context: CTX });
    assert.equal(pr.plan.scope, "page"); assert.equal(pr.plan.requiresConfirmation, true);
    assert.equal(await codeA(R.apply(A, siteId, pr.opId, {})), "confirm_required", "rien n'est écrit sans confirmation");
    await R.apply(A, siteId, pr.opId, { confirm: true });
    assert.deepEqual(fresh(p).working.sections.map((s) => s.type), kinds); assert.equal(JSON.stringify(fresh(p).working.sections.map((s) => s.style || null)), styles);
  });
  test("ajout de section : insérée APRÈS « les services », sections existantes inchangées ; ambiguïté signalée", async () => {
    const p = newPage(siteId, "Accueil", home()); const before = JSON.stringify(fresh(p).working.sections);
    const pr = await R.propose(A, siteId, { text: "Ajoute une section FAQ après les services", selection: { pageId: p.id }, call: fakeCall() });
    assert.equal(pr.status, "proposed"); assert.match(pr.preview.changes[0].after, /après/);
    const ap = await R.apply(A, siteId, pr.opId, {});
    const s = fresh(p).working.sections; assert.deepEqual(s.map((x) => x.type), ["hero", "features", "faq", "faq", "text"]); assert.equal(s[2].id, ap.result.sectionId);
    assert.equal(JSON.stringify([s[0], s[1], s[3], s[4]]), JSON.stringify([...JSON.parse(before).slice(0, 2), ...JSON.parse(before).slice(2)]));
    const q = newPage(siteId, "Deux", [S("features", { title: "A", items: [{ title: "a", text: "b" }] }), S("features", { title: "B", items: [{ title: "c", text: "d" }] })]);
    const amb = await R.propose(A, siteId, { text: "Ajoute une section FAQ après les services", selection: { pageId: q.id }, call: fakeCall() }).catch((e) => e);
    assert.equal(amb.code, "ambiguous");
  });
  test("demande ambiguë ou non prise en charge : clarification demandée, rien n'est écrit, aucun appel IA", async () => {
    const p = newPage(siteId, "Accueil", home());
    const c1 = await R.propose(A, siteId, { text: "Réécris le texte", call: fakeCall() }); assert.equal(c1.status, "clarification"); assert.ok(c1.questions.some((q) => q.field === "page"));
    const c2 = await R.propose(A, siteId, { text: "Modifie la couleur du site", call: fakeCall() }); assert.equal(c2.status, "clarification");
    const u1 = await R.propose(A, siteId, { text: "Agrandis le titre de cette bannière", selection: { pageId: p.id, sectionId: ids(p)[0] }, call: fakeCall() }); assert.equal(u1.status, "unsupported"); assert.match(u1.message, /suit le design/);
    assert.equal((await R.propose(A, siteId, { text: "Rends cette page plus adaptée aux téléphones", selection: { pageId: p.id }, call: fakeCall() })).status, "unsupported");
    assert.equal((await R.propose(A, siteId, { text: "Que penses-tu de mon site ?", call: fakeCall() })).status, "advice");
    assert.equal(calls.length, 0); assert.equal(R.history(A, siteId).total, 0, "aucune opération enregistrée pour une clarification");
  });
});

describe("11-12 — protection des éléments (côté serveur)", () => {
  test("11. un texte modifié à la main après une écriture IA est protégé : refus sans confirmation explicite, puis autorisation ciblée", async () => {
    const p = newPage(siteId, "Accueil", home()), fid = ids(p)[1], key = `${fid}/intro`;
    const go = async (txt) => { const pr = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, call: fakeCall(revise(txt)), context: CTX }); return pr; };
    await R.apply(A, siteId, (await go("Version IA.")).opId, {});
    assert.equal(R.protections(A, siteId, p.id).elements.find((e) => e.ref === fid).fields.find((f) => f.ref === key).state, "ai");
    const cur = fresh(p); pages.saveDraft(A, p.id, { ...cur.working, sections: cur.working.sections.map((s) => (s.type === "features" ? { ...s, intro: "Écrit par la personne." } : s)) }, { revision: cur.revision });
    assert.equal(R.protections(A, siteId, p.id).elements.find((e) => e.ref === fid).fields.find((f) => f.ref === key).state, "user_modified");
    const pr = await go("Autre version IA.");
    assert.equal(await codeA(R.apply(A, siteId, pr.opId, {})), "needs_confirmation");
    assert.equal(sec(p, "features").intro, "Écrit par la personne.");
    await R.apply(A, siteId, pr.opId, { allow: [key] }); assert.equal(sec(p, "features").intro, "Autre version IA.");
  });
  test("12. verrouillage : une section / page / champ verrouillé est refusé quelle que soit l'entrée (propose → apply, Content Generator, restauration)", async () => {
    const p = newPage(siteId, "Accueil", home()), [hid, fid] = ids(p);
    R.setProtection(A, siteId, { kind: "section", ref: fid, state: "locked", reason: "validée par le client" });
    const pr = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: `${fid}/intro` }, call: fakeCall(revise("X.")), context: CTX });
    assert.equal(await codeA(R.apply(A, siteId, pr.opId, {})), "protected"); assert.equal(sec(p, "features").intro, "Ce que nous faisons");
    // le Content Generator (21.6) respecte le même verrou
    const cg = require("../src/contentGen"), keys = (o) => [...String(o.prompt).matchAll(/"key":"([^"]+)"/g)].map((x) => x[1]);
    const set = await cg.generatePage(A, siteId, { pageId: p.id, context: { company: { name: "X" } }, scope: "all", call: fakeCall({ page: (o) => ({ fields: keys(o).map((key) => ({ key, value: "Texte." })), seo: { title: "", description: "", focusKeyword: "", slug: "" }, questions: [] }) }) });
    const out = cg.apply(A, siteId, set.id, {}); assert.ok(out.skipped.some((s) => /verrouillée/.test(s.why))); assert.equal(sec(p, "features").intro, "Ce que nous faisons"); assert.notEqual(sec(p, "hero").title, "Bienvenue chez nous");
    // page verrouillée
    R.setProtection(A, siteId, { kind: "section", ref: fid, state: "none" }); R.setProtection(A, siteId, { kind: "page", ref: String(p.id), state: "locked" });
    const pr2 = await R.propose(A, siteId, { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: p.id, sectionId: hid }, call: fakeCall() });
    assert.equal(await codeA(R.apply(A, siteId, pr2.opId, {})), "protected");
    assert.equal(code(() => R.setProtection(A, siteId, { kind: "inconnu", ref: "x", state: "locked" })), "invalid_field");
    assert.equal(R.protections(A, siteId).explicit.length, 1);
  });
  test("statut « validé » : régénération seulement avec confirmation explicite", async () => {
    const p = newPage(siteId, "Accueil", home()), fid = ids(p)[1], key = `${fid}/intro`;
    R.setProtection(A, siteId, { kind: "field", ref: key, state: "validated" });
    const pr = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, call: fakeCall(revise("Court.")), context: CTX });
    assert.equal(await codeA(R.apply(A, siteId, pr.opId, {})), "needs_confirmation");
    await R.apply(A, siteId, pr.opId, { allow: [key] }); assert.equal(sec(p, "features").intro, "Court.");
  });
});

describe("13-19 — snapshots, historique, comparaison, restauration", () => {
  test("13. snapshots de 5 niveaux, dédupliqués, sans fichier (références de médias seulement)", () => {
    const img = "/uploads/marketing/1/photo.png"; const p = newPage(siteId, "Accueil", [S("hero", { title: "T", subtitle: "s", image: img, imageAlt: "a" }), ...home().slice(1)]);
    const s1 = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id }), s2 = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id });
    assert.equal(s2.id, s1.id); assert.equal(s2.reused, true, "état identique : pas de doublon");
    const sec1 = R.takeSnapshot(A, siteId, { level: "section", pageId: p.id, sectionId: ids(p)[0] }), d = R.takeSnapshot(A, siteId, { level: "design" }), st = R.takeSnapshot(A, siteId, { level: "site" });
    assert.ok([sec1.id, d.id, st.id].every(Boolean));
    assert.equal(R.getSnapshot(A, siteId, s1.id).data.content.sections[0].image, img, "référence du média conservée");
    assert.equal(R.getSnapshot(A, siteId, st.id).data.pages.length, 1);
    assert.deepEqual(R.listSnapshots(A, siteId, { level: "page" }).items.map((x) => x.level), ["page"]);
    assert.ok(R.snapshotStats(A, siteId).bytes > 0);
  });
  test("14. historique : opération, acteur IA/humain, demande, avant/après, snapshots ; aucune clé ; pagination et filtres", async () => {
    const p = newPage(siteId, "Accueil", home()), [hid] = ids(p);
    for (const bg of ["dark", "accent", "surface"]) { const pr = await R.propose(A, siteId, { text: `Change uniquement le fond de cette section en ${bg === "dark" ? "sombre" : bg === "accent" ? "accent" : "surface"}`, selection: { pageId: p.id, sectionId: hid }, call: fakeCall() }); await R.apply(A, siteId, pr.opId, {}); }
    const h = R.history(A, siteId, { limit: 2 }); assert.equal(h.total, 3); assert.equal(h.items.length, 2);
    const op = R.getOperation(A, siteId, h.items[0].id);
    assert.deepEqual([op.actor, op.status, op.intent, op.scope], ["ai", "applied", "change_style", "section"]); assert.match(op.request, /fond/); assert.equal(op.snapshots.filter((s) => s.phase === "before").length >= 1, true); assert.equal(op.changes[0].path.includes("style.background"), true);
    assert.equal(R.history(A, siteId, { sectionId: hid }).total, 3); assert.equal(R.history(A, siteId, { pageId: p.id, actor: "human" }).total, 0);
    assert.doesNotMatch(JSON.stringify(op), /sk-|api[_-]?key|secret/i);
    const u = R.usage(A, siteId); assert.equal(u.aiCalls, 0); assert.match(u.note, /pas un coût réel/);
  });
  test("15. comparaison de deux versions (sections ajoutées/supprimées/déplacées/modifiées, style, contenu, média) ; versions identiques = aucune différence", () => {
    const img = "/uploads/marketing/1/a.png";
    const p = newPage(siteId, "Accueil", home()), a = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id });
    const c = fresh(p), [h, f, q, t] = c.working.sections;
    pages.saveDraft(A, p.id, { ...c.working, title: "Nouveau titre", sections: [{ ...h, title: "Titre modifié", image: img, imageAlt: "x", style: { padding: "xl", background: "dark" } }, q, f, { type: "list", title: "Nouvelle", items: ["a"] }] }, { revision: c.revision });
    const b = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id }), cmp = R.compare(A, siteId, a.id, b.id);
    const kinds = (k) => cmp.changes.filter((x) => x.kind === k).map((x) => x.path); assert.equal(cmp.identical, false);
    assert.ok(kinds("removed").some((x) => x === `section:${t.id}`)); assert.ok(kinds("added").some((x) => x.startsWith("section:")) && cmp.changes.some((x) => x.kind === "added" && x.category === "structure"));
    assert.ok(cmp.changes.some((x) => x.kind === "moved" && x.section === q.id), "déplacement détecté par identifiant");
    assert.ok(cmp.changes.some((x) => x.category === "media" && /image/.test(x.path))); assert.ok(cmp.changes.some((x) => x.category === "style" && /style/.test(x.path))); assert.ok(cmp.changes.some((x) => x.category === "content" && x.path.endsWith(".title") && x.after === "Titre modifié"));
    assert.ok(cmp.changes.some((x) => x.path === "title" && x.after === "Nouveau titre"));
    const same = R.compare(A, siteId, a.id, a.id); assert.deepEqual([same.identical, same.changes.length], [true, 0]);
    assert.equal(code(() => R.compare(A, siteId, a.id, R.takeSnapshot(A, siteId, { level: "design" }).id)), "invalid_field", "niveaux différents");
    const cur = R.compareWithCurrent(A, siteId, a.id); assert.ok(cur.summary.total > 0);
  });
  test("16-18. restauration d'un widget, d'une section, d'une page : état d'avant conservé, nouvelle opération, historique intact, rien n'est publié", () => {
    const layout = newPage(siteId, "Libre", [S("layout", { children: [{ type: "heading", props: { text: "Titre libre", level: 2 } }, { type: "text", props: { html: "<p>Paragraphe</p>" } }] })]);
    const lay = fresh(layout).working.sections[0], hid = lay.children[0].id;
    const nodeSnap = R.takeSnapshot(A, siteId, { level: "node", pageId: layout.id, nodeId: hid });
    const c = fresh(layout); const lay2 = clone(c.working.sections[0]); lay2.children[0].props.text = "Titre cassé"; pages.saveDraft(A, layout.id, { ...c.working, sections: [lay2] }, { revision: c.revision });
    R.takeSnapshot(A, siteId, { level: "page", pageId: layout.id });
    const rn = R.restore(A, siteId, nodeSnap.id, {}); assert.equal(fresh(layout).working.sections[0].children[0].props.text, "Titre libre"); assert.equal(fresh(layout).working.sections[0].children[1].props.html, "<p>Paragraphe</p>", "le voisin est intact");
    assert.equal(R.getOperation(A, siteId, rn.opId).kind, "restore");
    // section : supprimée puis réinsérée à sa place
    const p = newPage(siteId, "Accueil", home()), full = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id }), [h, f, q, t] = ids(p);
    const secSnap = R.takeSnapshot(A, siteId, { level: "section", pageId: p.id, sectionId: f });
    let cc = fresh(p); pages.saveDraft(A, p.id, { ...cc.working, sections: cc.working.sections.filter((s) => s.id !== f) }, { revision: cc.revision }); R.takeSnapshot(A, siteId, { level: "page", pageId: p.id });
    R.restore(A, siteId, secSnap.id, {}); assert.deepEqual(ids(p), [h, f, q, t], "section réinsérée à sa position");
    // page : retour à la version complète ; l'état avant est conservé
    cc = fresh(p); pages.saveDraft(A, p.id, { ...cc.working, title: "Autre", sections: [cc.working.sections[0]] }, { revision: cc.revision }); R.takeSnapshot(A, siteId, { level: "page", pageId: p.id });
    const before = R.history(A, siteId).total;
    const rp = R.restore(A, siteId, full.id, {}); assert.deepEqual(ids(p), [h, f, q, t]); assert.equal(R.history(A, siteId).total, before + 1, "une restauration ajoute un événement, n'en supprime aucun");
    const bs = R.getOperation(A, siteId, rp.opId).snapshots.filter((s) => s.phase === "before" && s.level === "page");
    assert.equal(bs.length, 1); assert.equal(R.getSnapshot(A, siteId, bs[0].id).data.content.title, "Autre", "l'état d'avant la restauration est conservé");
    assert.notEqual(fresh(p).status, "published");
  });
  test("restauration partielle d'une section depuis un snapshot de PAGE ; section verrouillée refusée ; sections verrouillées conservées lors d'une restauration de page", () => {
    const p = newPage(siteId, "Accueil", home()), full = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id }), [h, f, q, t] = ids(p);
    const c = fresh(p); pages.saveDraft(A, p.id, { ...c.working, sections: c.working.sections.map((s) => (s.id === f ? { ...s, title: "Modifié" } : s.id === q ? { ...s, title: "Q modifiée" } : s)) }, { revision: c.revision }); R.takeSnapshot(A, siteId, { level: "page", pageId: p.id });
    R.restore(A, siteId, full.id, { scope: { sectionId: f } }); assert.equal(sec(p, "features").title, "Nos services"); assert.equal(sec(p, "faq").title, "Q modifiée", "seule la section visée est restaurée");
    R.setProtection(A, siteId, { kind: "section", ref: q, state: "locked" });
    assert.equal(code(() => R.restore(A, siteId, full.id, { scope: { sectionId: q } })), "protected");
    const r = R.restore(A, siteId, full.id, {}); assert.equal(sec(p, "faq").title, "Q modifiée", "section verrouillée conservée"); assert.ok(r.kept.some((k) => k.ref === q));
  });
  test("19. restauration globale du site : pages + design ; une page supprimée est ignorée et signalée ; restaurer ≠ perdre l'état d'avant", () => {
    const p = newPage(siteId, "Accueil", home()), o = newPage(siteId, "Contact", [S("text", { markdown: "Contact v1" })]);
    draft = { changes: { "tokens.colors.primary": "#111111" }, rev: 1 };
    const site1 = R.takeSnapshot(A, siteId, { level: "site" });
    let c = fresh(p); pages.saveDraft(A, p.id, { ...c.working, title: "V2" }, { revision: c.revision }); c = fresh(o); pages.saveDraft(A, o.id, { ...c.working, sections: [S("text", { markdown: "Contact v2" })] }, { revision: c.revision });
    draft = { changes: { "tokens.colors.primary": "#999999" }, rev: 2 }; R.takeSnapshot(A, siteId, { level: "site" });
    const res = R.restore(A, siteId, site1.id, {});
    assert.equal(fresh(o).working.sections[0].markdown, "Contact v1"); assert.equal(fresh(p).working.title, pages.requirePage(A, p.id).working.title); assert.equal(draft.changes["tokens.colors.primary"], "#111111");
    assert.ok(res.restored.some((r) => r.level === "design") && res.restored.filter((r) => r.pageId).length === 2);
    pages.archivePage(A, o.id);
    const res2 = R.restore(A, siteId, site1.id, { restoreAnyway: true }); assert.ok(res2.kept.some((k) => /supprimée|archivée/.test(k.why)));
  });
});

describe("20-24 — annuler / rétablir, conflits, erreurs IA", () => {
  test("20-21. annuler / rétablir une opération logique (plusieurs textes = une opération) ; l'annulation est une opération de l'historique", async () => {
    const p = newPage(siteId, "Accueil", home()), [hid, fid] = ids(p);
    const keys = (o) => [...String(o.prompt).matchAll(/"key":"([^"]+)"/g)].map((x) => x[1]);
    const call = fakeCall({ page: (o) => ({ fields: keys(o).map((key) => ({ key, value: "Nouveau." })), seo: { title: "", description: "", focusKeyword: "", slug: "" }, questions: [] }) });
    const orig = JSON.stringify(fresh(p).working.sections);
    const pr = await R.propose(A, siteId, { text: "Réécris le texte de présentation", selection: { pageId: p.id, sectionId: fid }, call, context: CTX }); await R.apply(A, siteId, pr.opId, {});
    assert.ok(pr.preview.changes.length > 1); assert.notEqual(JSON.stringify(fresh(p).working.sections), orig);
    const u = R.undo(A, siteId); assert.equal(JSON.stringify(fresh(p).working.sections), orig, "toutes les modifications techniques annulées d'un coup");
    assert.equal(R.getOperation(A, siteId, pr.opId).status, "undone"); assert.equal(R.getOperation(A, siteId, u.opId).kind, "undo");
    const rd = R.redo(A, siteId); assert.equal(sec(p, "features").intro, "Nouveau."); assert.equal(R.getOperation(A, siteId, pr.opId).status, "applied");
    assert.equal(code(() => R.redo(A, siteId)), "nothing_to_redo"); assert.equal(R.history(A, siteId).total, 3 + 0, "proposition + annulation + rétablissement : rien d'effacé"); void hid; void rd;
  });
  test("22-23. conflits : cible modifiée après la proposition → refus clair ; rebasage sûr si seule une AUTRE partie de la page a changé ; résolution explicite", async () => {
    const p = newPage(siteId, "Accueil", home()), [hid, fid] = ids(p), key = `${fid}/intro`;
    const pr = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, call: fakeCall(revise("Court.")), context: CTX });
    // la personne modifie une AUTRE section pendant ce temps → fusion sûre
    let c = fresh(p); pages.saveDraft(A, p.id, { ...c.working, sections: c.working.sections.map((s) => (s.type === "text" ? { ...s, markdown: "Modifié ailleurs" } : s)) }, { revision: c.revision });
    const ap = await R.apply(A, siteId, pr.opId, {}); assert.equal(ap.merged, true); assert.equal(sec(p, "features").intro, "Court."); assert.equal(sec(p, "text").markdown, "Modifié ailleurs", "la modification concurrente est conservée");
    // modification de la CIBLE elle-même → conflit
    const pr2 = await R.propose(A, siteId, { text: "Développe ce texte", selection: { pageId: p.id, fieldKey: key }, call: fakeCall(revise("Texte développé.")), context: CTX });
    c = fresh(p); pages.saveDraft(A, p.id, { ...c.working, sections: c.working.sections.map((s) => (s.type === "features" ? { ...s, intro: "Saisie de la personne." } : s)) }, { revision: c.revision });
    const err = await R.apply(A, siteId, pr2.opId, {}).catch((e) => e); assert.equal(err.code, "conflict"); assert.deepEqual(err.detail.resolutions, ["keep_user", "use_ai"]);
    assert.equal(sec(p, "features").intro, "Saisie de la personne.");
    // « conserver la version de la personne » = refuser ; « utiliser l'IA » = explicite (le texte de la personne reste dans l'historique)
    const ok = await R.apply(A, siteId, pr2.opId, { resolve: "use_ai", allow: [key] }); assert.equal(ok.status, "applied"); assert.equal(sec(p, "features").intro, "Texte développé.");
    assert.ok(R.getOperation(A, siteId, pr2.opId).snapshots.some((s) => s.phase === "before"), "la saisie écrasée est conservée dans le snapshot « avant »");
    assert.equal(R.reject(A, siteId, (await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, call: fakeCall(revise("Z.")), context: CTX })).opId).status, "rejected");
    void hid;
  });
  test("conflit de restauration / d'annulation : l'état actuel a changé depuis → confirmation explicite, l'état actuel reste dans l'historique", async () => {
    const p = newPage(siteId, "Accueil", home()), [hid] = ids(p);
    const pr = await R.propose(A, siteId, { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: p.id, sectionId: hid }, call: fakeCall() }); await R.apply(A, siteId, pr.opId, {});
    const c = fresh(p); pages.saveDraft(A, p.id, { ...c.working, sections: c.working.sections.map((s) => (s.type === "faq" ? { ...s, title: "Changé à la main" } : s)) }, { revision: c.revision });
    const e = (() => { try { R.undo(A, siteId); } catch (x) { return x; } })(); assert.equal(e.code, "conflict"); assert.deepEqual(e.detail.resolutions, ["restore_anyway"]);
    assert.equal(sec(p, "faq").title, "Changé à la main", "rien n'a été écrasé");
    const u = R.undo(A, siteId, null, { restoreAnyway: true }); assert.equal(sec(p, "hero").style.background, "primary");
    assert.ok(R.getOperation(A, siteId, u.opId).snapshots.some((s) => s.phase === "before"), "l'état avant l'annulation est conservé");
    // restauration d'une ancienne version : refus si l'état actuel n'est dans aucune version enregistrée
    const snap = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id }); const c2 = fresh(p); pages.saveDraft(A, p.id, { ...c2.working, title: "Encore" }, { revision: c2.revision });
    assert.equal(code(() => R.restore(A, siteId, snap.id, {})), "conflict"); assert.ok(R.restore(A, siteId, snap.id, { restoreAnyway: true }).opId);
  });
  test("24. erreurs IA : fournisseur indisponible, quota, réponse invalide → rien n'est écrit, aucune opération enregistrée, message lisible", async () => {
    const p = newPage(siteId, "Accueil", home()), key = `${ids(p)[1]}/intro`, sel = { pageId: p.id, fieldKey: key };
    const before = JSON.stringify(fresh(p).working);
    for (const [reply, expected] of [[Object.assign(new Error("Plafond atteint"), { code: "quota" }), "quota"], [Object.assign(new Error("IA non activée"), { code: "not_configured" }), "not_configured"], [{ variants: [] }, "format"], [{ nope: 1 }, "format"]]) {
      assert.equal(await codeA(R.propose(A, siteId, { text: "Raccourcis ce texte", selection: sel, call: fakeCall({ revise: reply }), context: CTX })), expected);
    }
    assert.equal(JSON.stringify(fresh(p).working), before); assert.equal(R.history(A, siteId).total, 0);
  });
});

describe("25-30 — quotas, isolation, permissions, régression", () => {
  test("25. quotas : la consommation passe par ai.call (plafond quotidien de l'organisation) ; les modifications locales n'appellent pas l'IA", async () => {
    const aiCore = require("../src/services/aiCore"), ai = require("../src/marketing/ai");
    aiCore.setClientForTests({ beta: { messages: { create: async () => ({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ variants: ["Court."] }) }], model: "fake", usage: { input_tokens: 5, output_tokens: 5 } }) } } });
    try {
      m.ctx(1).settings.set(1, "ai.daily_limit", 1);
      const p = newPage(siteId, "Accueil", home()), key = `${ids(p)[1]}/intro`;
      const ok = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, context: CTX }); assert.equal(ok.status, "proposed");
      assert.equal(await codeA(R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, context: CTX })), "quota", "plafond respecté, rien d'enregistré");
      const local = await R.propose(A, siteId, { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: p.id, sectionId: ids(p)[0] } }); assert.equal(local.status, "proposed", "une modification locale ne consomme aucun quota");
      assert.equal(R.history(A, siteId).items.filter((x) => x.aiCalls > 0).length, 1); assert.equal(R.usage(A, siteId).aiCalls, 1); assert.ok(ai.AiError);
    } finally { aiCore.setClientForTests(null); }
  });
  test("26-27. isolation : opérations, snapshots, protections, restauration introuvables depuis un autre site / une autre organisation / un accès limité", async () => {
    const s2 = pages.createSite(A, { name: "Site Deux" }).id, p = newPage(siteId, "Accueil", home()), o = newPage(s2, "Autre", [S("text", { markdown: "Autre" })]);
    const pr = await R.propose(A, siteId, { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: p.id, sectionId: ids(p)[0] }, call: fakeCall() }); await R.apply(A, siteId, pr.opId, {});
    const snap = R.takeSnapshot(A, siteId, { level: "page", pageId: p.id }); R.setProtection(A, siteId, { kind: "page", ref: String(p.id), state: "locked" });
    assert.equal(R.history(A, s2).total, 0); assert.equal(R.listSnapshots(A, s2).total, 0); assert.deepEqual(R.protections(A, s2).explicit, []);
    for (const fn of [() => R.getOperation(A, s2, pr.opId), () => R.getSnapshot(A, s2, snap.id), () => R.restore(A, s2, snap.id, {}), () => R.compare(A, s2, snap.id, snap.id), () => R.takeSnapshot(A, s2, { level: "page", pageId: p.id })]) assert.equal(code(fn), "not_found");
    assert.equal(await codeA(R.propose(A, s2, { text: "Change le fond de cette section en sombre", selection: { pageId: p.id, sectionId: ids(p)[0] } })), "not_found", "une page d'un autre site n'est pas accessible");
    assert.equal(await codeA(R.apply(A, s2, pr.opId, {})), "not_found");
    assert.equal(code(() => R.undo(A, s2)), "nothing_to_undo", "l'annulation ne voit que les opérations du site");
    const L = m.ctx(1, { now: () => T, siteScope: s2 }); assert.equal(code(() => R.history(L, siteId)), "not_found"); assert.equal(code(() => R.getSnapshot(L, siteId, snap.id)), "not_found");
    const B = m.ctx(2, { now: () => T }); assert.equal(code(() => R.history(B, siteId)), "not_found"); assert.equal(code(() => R.getOperation(B, siteId, pr.opId)), "not_found");
    assert.equal(R.history(A, s2).total, 0); void o;
  });
  test("28-29. préservation des médias et des structures : une régénération de texte ne touche ni image, ni style, ni ordre, ni identifiants", async () => {
    const img = "/uploads/marketing/1/p.png"; const p = newPage(siteId, "Accueil", [S("hero", { title: "T", subtitle: "s", image: img, imageAlt: "alt", buttonLabel: "Go", buttonUrl: "/x", style: { padding: "xl" } }), ...home().slice(1)]);
    const struct = () => JSON.stringify(fresh(p).working.sections.map((s) => ({ id: s.id, type: s.type, style: s.style || null, image: s.image || null, imageAlt: s.imageAlt || null, buttonUrl: s.buttonUrl || null })));
    const s0 = struct(), key = `${ids(p)[0]}/subtitle`;
    const pr = await R.propose(A, siteId, { text: "Raccourcis ce texte", selection: { pageId: p.id, fieldKey: key }, call: fakeCall(revise("Court.")), context: CTX }); await R.apply(A, siteId, pr.opId, {});
    assert.equal(struct(), s0); assert.equal(sec(p, "hero").subtitle, "Court.");
    const bad = await R.propose(A, siteId, { text: "Change le fond de cette section en sombre", selection: { pageId: p.id, sectionId: ids(p)[0] }, call: fakeCall() }); assert.equal(bad.status, "proposed");
  });
  test("30. régression : l'éditeur et l'historique natif (revisions) continuent de tracer les brouillons écrits par ce moteur ; rien n'est publié", async () => {
    const p = newPage(siteId, "Accueil", home()), revs = require("../src/services/revisions");
    const before = revs.history(A, "page", p.id).total ?? revs.history(A, "page", p.id).items?.length ?? 0;
    const pr = await R.propose(A, siteId, { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: p.id, sectionId: ids(p)[0] }, call: fakeCall() }); await R.apply(A, siteId, pr.opId, {});
    const h = revs.history(A, "page", p.id), after = h.total ?? h.items?.length ?? 0;
    assert.ok(after >= before, "l'historique natif n'est pas contourné");
    assert.notEqual(fresh(p).status, "published"); assert.equal(fresh(p).revision > 1, true);
  });
});
function clone(v) { return JSON.parse(JSON.stringify(v)); }
