// Formats de mise en page : conception libre / guidée, persistance (brouillon, publication, version), CSS, verrouillage dans le moteur
// d'enregistrement (manuel ET IA), déverrouillage explicite, pages existantes intactes.
const { test, describe, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const pages = require("../src/marketing/pages");
const landing = require("../src/marketing/landing");
const lf = require("../src/marketing/pages/layoutFormat");
const studio = require("../src/marketing/ai/studio");

const NOW = Date.UTC(2026, 9, 10, 12);
let m, A;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const tree = () => [{ type: "layout", children: [
  { type: "container", children: [{ type: "heading", props: { text: "Titre", level: 1 } }], styles: { desktop: { backgroundColor: "#ffffff" } } },
  { type: "text", props: { html: "<p>Un paragraphe</p>" } },
] }];
const rev = (id) => pages.getPage(A, id).revision;
const save = (id, content) => pages.saveDraft(A, id, content, { revision: rev(id) });
const draft = (id) => pages.getPage(A, id).working;
function guidedPage(locked = true, format = "standard") {
  const p = pages.createPage(A, { name: "Guidée " + Math.random(), layout: { mode: "guided", format, locked } });
  save(p.id, { ...draft(p.id), sections: tree() });
  return p.id;
}
beforeEach(() => { m = freshMarketing(); A = m.ctx(1, { now: () => NOW, baseUrl: "https://k.test" }); });
after(() => aiCore.setClientForTests(null));

describe("format de mise en page", () => {
  test("conception libre par défaut : aucun format, aucune règle CSS, page existante intacte", () => {
    const p = pages.createPage(A, { name: "Libre" });
    assert.equal(draft(p.id).theme.layout, undefined);
    assert.equal(lf.css(undefined), "");
    save(p.id, { ...draft(p.id), sections: tree() });
    const w = draft(p.id).sections[0].children[0];
    save(p.id, { ...draft(p.id), sections: [{ ...draft(p.id).sections[0], children: [{ ...w, styles: { desktop: { width: "500px" } } }, draft(p.id).sections[0].children[1]] }] });
    assert.equal(draft(p.id).sections[0].children[0].styles.desktop.width, "500px");
  });

  test("création guidée : format enregistré dans le thème, relu après rechargement, publié et dupliqué", () => {
    const id = guidedPage(false, "large");
    const lay = draft(id).theme.layout;
    assert.deepEqual(lay, { mode: "guided", format: "large", maxWidth: 1440, gutter: 32, locked: false });
    pages.publish(A, id);
    assert.deepEqual(pages.getPage(A, id).published.theme.layout, lay);
    const copy = pages.duplicatePage(A, id);
    assert.deepEqual(draft(copy.id).theme.layout, lay);
  });

  test("restauration d'une version : le format de cette version revient avec le brouillon", () => {
    const id = guidedPage(false, "compact");
    pages.publish(A, id);
    const d = draft(id);
    save(id, { ...d, theme: { ...d.theme, layout: { mode: "guided", format: "large", maxWidth: 1440, gutter: 32, locked: false } } });
    assert.equal(draft(id).theme.layout.format, "large");
    const v = pages.listVersions(A, id).slice(-1)[0];
    pages.restoreVersion(A, id, v.number || v.version);
    assert.deepEqual(draft(id).theme.layout, { mode: "guided", format: "compact", maxWidth: 960, gutter: 24, locked: false });
  });

  test("CSS : largeur fluide plafonnée, spécificité nulle (le réglage d'un auteur déverrouillé l'emporte), fluide sans plafond", () => {
    assert.match(lf.css({ mode: "guided", maxWidth: 1200, gutter: 24 }), /:where\(\.kw-layout\) > \.kw-node, :where\(\.lp-main\) > \.lp-section \{ width: min\(calc\(100% - 48px\), 1200px\)/);
    assert.match(lf.css({ mode: "guided", maxWidth: 0, gutter: 16 }), /width: calc\(100% - 32px\)/);
    const id = guidedPage();
    const view = landing.viewModel(A, pages.getPage(A, id).working && { ...pages.getPage(A, id), ...draft(id) });
    assert.match(view.nodeCss, /:where\(\.kw-layout\)/);
  });

  test("CSS : les blocs typés des gabarits (div.lp-block) suivent le format ; sections libres, en-tête / pied du site et largeurs choisies exclus", () => {
    const rule = lf.css({ mode: "guided", maxWidth: 960, gutter: 24 }).split("\n").find((l) => l.includes(".lp-block"));
    assert.ok(rule, "règle des blocs typés présente");
    assert.match(rule, /^:where\(\.lp-main > \.lp-block:not\(\.lp-block-layout, \.lp-site-part, \[class\*="lp-w-"\]\)\) \{ width: min\(calc\(100% - 48px\), 960px\); margin-left: auto; margin-right: auto/);
    assert.equal(lf.css(null), "", "conception libre : aucune règle");
  });

  test("personnalisé : valeurs validées ; format inconnu refusé", () => {
    assert.deepEqual(lf.normalizeLayout({ mode: "guided", format: "custom", maxWidth: 1000, gutter: 10, locked: true }), { mode: "guided", format: "custom", maxWidth: 1000, gutter: 10, locked: true });
    assert.equal(code(() => lf.normalizeLayout({ mode: "guided", format: "custom", maxWidth: 100, gutter: 10 })), "invalid_field");
    assert.equal(code(() => lf.normalizeLayout({ mode: "guided", format: "inconnu" })), "invalid_field");
    assert.equal(lf.normalizeLayout({ mode: "free" }), null);
  });
});

describe("verrouillage du format", () => {
  test("verrouillé : largeur, largeur max, marges protégées sur TOUS les écrans ; refus clair", () => {
    const id = guidedPage(true);
    const set = (patch) => { const d = draft(id); const top = d.sections[0].children[0]; return save(id, { ...d, sections: [{ ...d.sections[0], children: [{ ...top, ...patch }, d.sections[0].children[1]] }] }); };
    for (const [bp, prop, v] of [["desktop", "width", "500px"], ["tablet", "maxWidth", "700px"], ["mobile", "marginLeft", "10px"], ["desktop", "minWidth", "200px"]]) {
      assert.equal(code(() => set({ styles: { desktop: { backgroundColor: "#ffffff" }, [bp]: { ...(bp === "desktop" ? { backgroundColor: "#ffffff" } : {}), [prop]: v } } })), "format_locked", `${bp}.${prop}`);
    }
    assert.equal(code(() => set({ states: { hover: { width: "400px" } } })), "format_locked");
    assert.equal(code(() => set({ styles: { desktop: { backgroundColor: "#ffffff" } } })), null, "inchangé : accepté");
  });

  test("verrouillé : textes, couleurs, ajout de widgets et de sections restent libres ; un élément ajouté ne peut pas porter une largeur", () => {
    const id = guidedPage(true);
    const d = draft(id);
    const top = d.sections[0].children[0];
    save(id, { ...d, sections: [{ ...d.sections[0], children: [{ ...top, styles: { desktop: { backgroundColor: "#ff0000", paddingTop: "40px" } }, children: [{ ...top.children[0], props: { text: "Nouveau titre", level: 1 } }] }, d.sections[0].children[1], { type: "text", props: { html: "<p>Ajout</p>" } }] }, { type: "layout", children: [{ type: "heading", props: { text: "Autre", level: 2 } }] }] });
    assert.equal(draft(id).sections.length, 2);
    const d2 = draft(id);
    assert.equal(code(() => save(id, { ...d2, sections: [{ ...d2.sections[0], children: [...d2.sections[0].children, { type: "text", props: { html: "<p>x</p>" }, styles: { desktop: { width: "300px" } } }] }, d2.sections[1]] })), "format_locked");
    // un élément imbriqué (pas de premier niveau) garde sa liberté
    const inner = d2.sections[0].children[0];
    save(id, { ...d2, sections: [{ ...d2.sections[0], children: [{ ...inner, children: [{ ...inner.children[0], styles: { desktop: { width: "300px" } } }] }, ...d2.sections[0].children.slice(1)] }, d2.sections[1]] });
  });

  test("changer ou retirer le format verrouillé est refusé ; déverrouiller ne permet pas de modifier les propriétés protégées en même temps", () => {
    const id = guidedPage(true);
    const d = draft(id);
    assert.equal(code(() => save(id, { ...d, theme: { ...d.theme, layout: { mode: "guided", format: "compact", locked: true } } })), "format_locked");
    assert.equal(code(() => save(id, { ...d, theme: { ...d.theme, layout: undefined } })), "format_locked");
    const w = d.sections[0].children[0];
    assert.equal(code(() => save(id, { ...d, theme: { ...d.theme, layout: { ...d.theme.layout, locked: false } }, sections: [{ ...d.sections[0], children: [{ ...w, styles: { desktop: { width: "1px" } } }, d.sections[0].children[1]] }] })), "format_locked", "déverrouiller + changer la largeur d'un coup : refusé");
    assert.equal(code(() => save(id, { ...d, theme: { ...d.theme, layout: { ...d.theme.layout, locked: false } }, title: "Autre" })), null, "déverrouiller seul (le titre n'est pas protégé) : accepté");
    // déverrouillé : plus aucun contrôle
    const d2 = draft(id);
    const top = d2.sections[0].children[0];
    save(id, { ...d2, sections: [{ ...d2.sections[0], children: [{ ...top, styles: { desktop: { width: "500px", backgroundColor: "#ffffff" } } }, d2.sections[0].children[1]] }] });
    assert.equal(draft(id).sections[0].children[0].styles.desktop.width, "500px");
    // verrouiller de nouveau avec un conflit existant : à lever explicitement
    assert.equal(code(() => lf.apply(draft(id), { ...draft(id).theme.layout, locked: true })), "format_conflicts");
    const cleaned = lf.apply(draft(id), { ...draft(id).theme.layout, locked: true }, { clearConflicts: true });
    assert.equal(cleaned.conflicts.length, 1);
    assert.equal(cleaned.sections[0].children[0].styles.desktop.width, undefined);
    assert.equal(cleaned.sections[0].children[0].styles.desktop.backgroundColor, "#ffffff");
  });

  test("l'IA ne contourne pas le verrou et ne le lève jamais", async () => {
    const id = guidedPage(true);
    const top = draft(id).sections[0].children[0].id;
    aiCore.setClientForTests({ beta: { messages: { create: async () => ({ stop_reason: "end_turn", model: "x", usage: { output_tokens: 1 }, content: [{ type: "text", text: JSON.stringify({ summary: "x", question: "", operations: [{ op: "set_styles", id: top, bp: "mobile", state: "normal", parent: "", index: 0, props: [], styles: [{ prop: "width", value: "100%" }], node_json: "", title: "", description: "", why: "" }] }) }] }) } } });
    let err = null;
    try { await studio.propose(A, id, { instruction: "Largeur 100 %", revision: rev(id) }); } catch (e) { err = e; }
    assert.equal(err.code, "format_locked");
    assert.match(err.message, /ne déverrouille jamais/);
    // une correction compatible (couleur) passe
    aiCore.setClientForTests({ beta: { messages: { create: async () => ({ stop_reason: "end_turn", model: "x", usage: { output_tokens: 1 }, content: [{ type: "text", text: JSON.stringify({ summary: "ok", question: "", operations: [{ op: "set_styles", id: top, bp: "desktop", state: "normal", parent: "", index: 0, props: [], styles: [{ prop: "backgroundColor", value: "#eeeeee" }], node_json: "", title: "", description: "", why: "" }] }) }] }) } } });
    const r = await studio.propose(A, id, { instruction: "Fond gris", revision: rev(id) });
    assert.equal(r.changes.length, 1);
  });

  test("le prompt de l'IA mentionne le format et les propriétés protégées (verrouillé) ou la liberté (libre)", async () => {
    const seen = [];
    aiCore.setClientForTests({ beta: { messages: { create: async (r) => { seen.push(r.messages[0].content); return { stop_reason: "end_turn", model: "x", usage: { output_tokens: 1 }, content: [{ type: "text", text: JSON.stringify({ summary: "", question: "?", operations: [] }) }] }; } } } });
    const locked = guidedPage(true);
    await studio.propose(A, locked, { instruction: "x", revision: rev(locked) });
    assert.match(seen[0], /VERROUILLÉ[\s\S]*width, minWidth, maxWidth[\s\S]*JAMAIS/);
    const free = pages.createPage(A, { name: "Libre IA" });
    await studio.propose(A, free.id, { instruction: "x", revision: rev(free.id) });
    assert.match(seen[1], /Conception libre/);
  });

  test("le responsive par règles propose une largeur sur un élément de premier niveau verrouillé : refusé, pas écrit", () => {
    const id = guidedPage(true);
    const top = draft(id).sections[0].children[0].id;
    assert.equal(code(() => studio.responsiveFixes(A, id, { revision: rev(id), issues: [{ id: top, kind: "overflow", bp: "mobile" }] })), "format_locked");
  });
});
