// IA Kolakisa (AI Studio) : moteur d'opérations, périmètre, responsive sans toucher à l'ordinateur, plafond, absence de fausse réponse.
// Aucune vraie demande à Anthropic : client factice.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const pages = require("../src/marketing/pages");
const studio = require("../src/marketing/ai/studio");

const NOW = Date.UTC(2026, 9, 10, 12);
let m, A, page, reply, requests;
const fake = () => { requests = []; aiCore.setClientForTests({ beta: { messages: { create: async (r) => { requests.push(r); const out = reply(r); if (out instanceof Error) throw out; return { stop_reason: "end_turn", model: r.model, usage: { output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify(out) }] }; } } } }); };
const code = async (p) => { try { await p; } catch (e) { return e.code; } return null; };
const empty = { summary: "", question: "", operations: [] };
const op = (o) => ({ id: "", bp: "desktop", state: "normal", parent: "", index: -1, props: [], styles: [], node_json: "", title: "", description: "", why: "", ...o });

function setup(sections) {
  m = freshMarketing();
  A = m.ctx(1, { now: () => NOW, baseUrl: "https://k.test" });
  const p = pages.createPage(A, { name: "Test IA" });
  const saved = pages.saveDraft(A, p.id, { sections }, { revision: pages.getPage(A, p.id).revision });
  page = pages.getPage(A, p.id);
  return saved;
}
const tree = () => [{ type: "layout", children: [
  { type: "heading", props: { text: "Titre", level: 1 }, styles: { desktop: { fontSize: "48px", width: "900px" } } },
  { type: "text", props: { html: "<p>Un paragraphe</p>" } },
] }];
const ids = () => { const s = pages.getPage(A, page.id).working.sections[0]; return { sec: s.id, h: s.children[0].id, t: s.children[1].id }; };
const base = (extra = {}) => ({ instruction: "Fais quelque chose", revision: pages.getPage(A, page.id).revision, ...extra });

describe("IA Kolakisa : service", () => {
  beforeEach(() => { setup(tree()); fake(); });
  after(() => aiCore.setClientForTests(null));

  test("sans clé : indisponible, aucune fausse réponse", async () => {
    aiCore.setClientForTests(null);
    const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
    try { assert.equal(await code(studio.propose(A, page.id, base())), "not_configured"); }
    finally { if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved; }
  });

  test("modifier un style : proposition validée avec différences, brouillon NON modifié", async () => {
    const i = ids();
    reply = () => ({ ...empty, summary: "Titre plus petit", operations: [op({ op: "set_styles", id: i.h, styles: [{ prop: "fontSize", value: "36px" }], why: "plus lisible" })] });
    const r = await studio.propose(A, page.id, base());
    assert.equal(r.changes.length, 1);
    assert.equal(r.changes[0].before, "48px"); assert.equal(r.changes[0].after, "36px");
    assert.equal(r.content.sections[0].children[0].styles.desktop.fontSize, "36px");
    assert.equal(pages.getPage(A, page.id).working.sections[0].children[0].styles.desktop.fontSize, "48px");
    assert.equal(r.needsConfirm, false);
  });

  test("valeur de style invalide ou propriété inconnue : refusées", async () => {
    const i = ids();
    reply = () => ({ ...empty, operations: [op({ op: "set_styles", id: i.h, styles: [{ prop: "fontSize", value: "énorme" }] })] });
    assert.equal(await code(studio.propose(A, page.id, base())), "invalid_field");
    reply = () => ({ ...empty, operations: [op({ op: "set_styles", id: i.h, styles: [{ prop: "inventé", value: "1" }] })] });
    assert.equal(await code(studio.propose(A, page.id, base())), "invalid_field");
  });

  test("élément inexistant, périmètre dépassé, suppression à confirmer", async () => {
    const i = ids();
    reply = () => ({ ...empty, operations: [op({ op: "set_props", id: "inconnu000000", props: [{ key: "level", value: "2" }] })] });
    assert.equal(await code(studio.propose(A, page.id, base())), "invalid_field");
    reply = () => ({ ...empty, operations: [op({ op: "set_props", id: i.t, props: [{ key: "level", value: "2" }] })] });
    assert.equal(await code(studio.propose(A, page.id, base({ scope: "selection", selection: i.h }))), "invalid_field");
    reply = () => ({ ...empty, operations: [op({ op: "remove", id: i.t })] });
    const r = await studio.propose(A, page.id, base());
    assert.equal(r.needsConfirm, true);
    assert.equal(r.content.sections[0].children.length, 1);
  });

  test("insertion : identifiants créés par le serveur, type inconnu refusé", async () => {
    const i = ids();
    reply = () => ({ ...empty, operations: [op({ op: "insert", parent: i.sec, node_json: JSON.stringify({ id: "pirate", type: "text", props: { html: "<p>Nouveau</p>" } }) })] });
    const r = await studio.propose(A, page.id, base());
    const added = r.content.sections[0].children[2];
    assert.equal(added.props.html, "<p>Nouveau</p>"); assert.notEqual(added.id, "pirate");
    reply = () => ({ ...empty, operations: [op({ op: "insert", parent: i.sec, node_json: JSON.stringify({ type: "virus" }) })] });
    assert.equal(await code(studio.propose(A, page.id, base())), "invalid_field");
  });

  test("page modifiée entre-temps : refus ; question de clarification sans opération", async () => {
    assert.equal(await code(studio.propose(A, page.id, { instruction: "x", revision: 999 })), "conflict");
    reply = () => ({ ...empty, question: "Quel bouton ?" });
    const r = await studio.propose(A, page.id, base());
    assert.equal(r.question, "Quel bouton ?"); assert.equal(r.changes.length, 0);
  });

  test("le prompt ne contient pas de secret et le journal ne contient aucun texte", async () => {
    reply = () => empty;
    await studio.propose(A, page.id, base({ instruction: "Texte confidentiel XYZ" }));
    const rows = m.db.prepare("SELECT * FROM mk_ai_requests").all();
    assert.equal(rows.length, 1);
    assert.ok(!JSON.stringify(rows).includes("confidentiel"));
    assert.ok(!JSON.stringify(requests[0]).includes("sk-ant"));
  });

  test("responsive : corrections écrites SEULEMENT dans l'écran concerné, ordinateur intact", () => {
    const i = ids();
    const r = studio.responsiveFixes(A, page.id, { revision: page.revision, issues: [
      { id: i.h, kind: "fixedWidth", bp: "mobile", detail: "900 px sur 390" },
      { id: i.h, kind: "bigText", bp: "mobile", value: "48px" },
      { id: i.t, kind: "smallText", bp: "tablet" },
      { id: "fantome", kind: "overflow", bp: "mobile" },
    ] });
    const h = r.content.sections[0].children[0];
    assert.equal(h.styles.mobile.width, "100%");
    assert.equal(h.styles.mobile.fontSize, "34px");
    assert.deepEqual(h.styles.desktop, { fontSize: "48px", width: "900px" });
    assert.equal(r.content.sections[0].children[1].styles.tablet.fontSize, "14px");
    assert.ok(r.report.some((x) => x.status === "ignoré"));
  });

  test("responsive sans constat : rien à corriger", () => {
    const r = studio.responsiveFixes(A, page.id, { revision: page.revision, issues: [] });
    assert.equal(r.operations.length, 0);
  });

  test("plafond quotidien respecté", async () => {
    const ai = require("../src/marketing/ai");
    ai.saveAiSettings(A, { dailyLimit: 1 });
    reply = () => empty;
    await studio.propose(A, page.id, base());
    assert.equal(await code(studio.propose(A, page.id, base())), "quota");
  });
});
