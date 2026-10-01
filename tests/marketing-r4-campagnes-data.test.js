// Marketing R4 (1/2) — campagnes : recherche par onglets, tri, pagination, duplication, étapes de la création guidée.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const { wizardSteps, STEP_KEYS } = require("../src/marketing/sending/wizard");

const PROOF = { source: "form", textShown: "Oui, je veux recevoir la newsletter" };
let m, A, B, tpl, list;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const camp = (name, o = {}) => {
  const v = { status: "draft", org: 1, kind: "campaign", sent: 0, clicks: 0, recipients: 0, created: null, ...o };
  const id = Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id, kind, status, sent_count, unique_click_count, total_recipients) VALUES (?, ?, ?, 'list', ?, ?, ?, ?, ?, ?)").run(v.org, name, tpl.id, list.id, v.kind, v.status, v.sent, v.clicks, v.recipients).lastInsertRowid);
  if (v.created) m.db.prepare("UPDATE mk_campaigns SET created_at = ? WHERE id = ?").run(v.created, id);
  return id;
};
const names = (r) => r.rows.map((c) => c.name);

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  list = audience.createList(A, { name: "Newsletter" });
  templates.setOrgAddress(A, "12 rue des Écoles\n75005 Paris");
  tpl = templates.createTemplate(A, { name: "Modèle A", subject: "Bonjour", blocks: [{ type: "text", markdown: "Bonjour" }] });
});

describe("searchCampaigns : onglets par statut", () => {
  beforeEach(() => {
    camp("Brouillon 1"); camp("Brouillon 2");
    camp("Programmée", { status: "scheduled" });
    camp("En cours", { status: "sending" }); camp("En pause", { status: "paused" });
    camp("Envoyée 1", { status: "sent" }); camp("Envoyée 2", { status: "sent" });
    camp("Annulée", { status: "cancelled" }); camp("Ratée", { status: "failed" });
  });
  test("chaque onglet regroupe les bons statuts", () => {
    const of = (status) => names(sending.searchCampaigns(A, { status })).sort();
    assert.deepEqual(of("draft"), ["Brouillon 1", "Brouillon 2"]);
    assert.deepEqual(of("scheduled"), ["Programmée"]);
    assert.deepEqual(of("running"), ["En cours", "En pause"]);
    assert.deepEqual(of("sent"), ["Envoyée 1", "Envoyée 2"]);
    assert.deepEqual(of("stopped"), ["Annulée", "Ratée"]);
    assert.equal(sending.searchCampaigns(A, {}).total, 9);
  });
  test("onglet inconnu ou tentative d'injection : équivalent à « toutes »", () => {
    for (const status of ["nimporte", "sent'; DROP TABLE mk_campaigns;--", undefined, "", 5]) assert.equal(sending.searchCampaigns(A, { status }).total, 9, String(status));
  });
  test("effectifs de chaque onglet", () => {
    assert.deepEqual(sending.campaignStatusCounts(A), { all: 9, draft: 2, scheduled: 1, running: 2, sent: 2, stopped: 2 });
  });
  test("campagnes des scénarios exclues ; autre organisation exclue", () => {
    camp("Système", { kind: "automation", status: "sent" }); camp("Chez B", { org: 2 });
    assert.equal(sending.searchCampaigns(A, {}).total, 9);
    assert.equal(sending.campaignStatusCounts(A).all, 9);
    assert.equal(sending.campaignStatusCounts(B).all, 1);
  });
});

describe("searchCampaigns : recherche, tri, pagination", () => {
  test("recherche par nom, sans tenir compte de la casse, caractères spéciaux littéraux", () => {
    camp("Lancement Été"); camp("100% offert"); camp("Autre");
    assert.deepEqual(names(sending.searchCampaigns(A, { q: "lancement" })), ["Lancement Été"]);
    assert.deepEqual(names(sending.searchCampaigns(A, { q: "100%" })), ["100% offert"]);
    assert.equal(sending.searchCampaigns(A, { q: "%" }).total, 1);
    assert.equal(sending.searchCampaigns(A, { q: "_" }).total, 0);
  });
  test("par défaut : les plus récentes d'abord ; tri par nom, envoyés, clics, destinataires", () => {
    camp("b", { created: "2026-01-02 00:00:00", sent: 10, clicks: 5, recipients: 30 }); camp("A", { created: "2026-01-03 00:00:00", sent: 30, clicks: 1, recipients: 10 }); camp("c", { created: "2026-01-01 00:00:00", sent: 20, clicks: 9, recipients: 20 });
    assert.deepEqual(names(sending.searchCampaigns(A, {})), ["A", "b", "c"]);
    assert.deepEqual(names(sending.searchCampaigns(A, {}, { sort: "name", dir: "asc" })), ["A", "b", "c"]);
    assert.deepEqual(names(sending.searchCampaigns(A, {}, { sort: "name", dir: "desc" })), ["c", "b", "A"]);
    assert.deepEqual(names(sending.searchCampaigns(A, {}, { sort: "sent", dir: "desc" })), ["A", "c", "b"]);
    assert.deepEqual(names(sending.searchCampaigns(A, {}, { sort: "clicks", dir: "desc" })), ["c", "b", "A"]);
    assert.deepEqual(names(sending.searchCampaigns(A, {}, { sort: "recipients", dir: "asc" })), ["A", "c", "b"]);
  });
  test("tri inconnu / injection : ignoré", () => {
    camp("x", { created: "2026-01-01 00:00:00" }); camp("y", { created: "2026-01-02 00:00:00" });
    for (const sort of ["zzz", "id; DROP TABLE mk_campaigns", "name DESC, (SELECT 1)"]) assert.deepEqual(names(sending.searchCampaigns(A, {}, { sort })), ["y", "x"]);
    const r = sending.searchCampaigns(A, {}, { sort: "zzz" });
    assert.deepEqual([r.sort, r.dir], ["created", "desc"]);
    assert.equal(sending.campaignStatusCounts(A).all, 2);
  });
  test("pages numérotées : 10/25/50, hors bornes ramené, aucun doublon entre pages", () => {
    for (let i = 0; i < 30; i++) camp(`C${String(i).padStart(2, "0")}`, { created: "2026-01-01 00:00:00" });
    const p1 = sending.searchCampaigns(A, {}, { pageSize: 10 });
    assert.deepEqual([p1.total, p1.pages, p1.page, p1.rows.length, p1.pageSize], [30, 3, 1, 10, 10]);
    assert.equal(sending.searchCampaigns(A, {}, { pageSize: 10, page: 99 }).page, 3);
    assert.equal(sending.searchCampaigns(A, {}, { pageSize: 7 }).pageSize, 25);
    const seen = [1, 2, 3].flatMap((page) => names(sending.searchCampaigns(A, {}, { pageSize: 10, page })));
    assert.equal(new Set(seen).size, 30);
  });
  test("lignes enrichies : modèle, cible, taux de clic (null sans envoi)", () => {
    camp("Envoyée", { status: "sent", sent: 200, clicks: 50 }); camp("Brouillon");
    const rows = Object.fromEntries(sending.searchCampaigns(A, {}).rows.map((r) => [r.name, r]));
    assert.equal(rows["Envoyée"].clickRate, 25);
    assert.equal(rows["Brouillon"].clickRate, null);
    assert.equal(rows["Envoyée"].template_name, "Modèle A");
    assert.equal(rows["Envoyée"].target_name, "Newsletter");
    assert.equal(rows["Envoyée"].target_type, "list");
  });
  test("modèle ou cible supprimés : libellé de repli, pas d'erreur", () => {
    const seg = m.db.prepare("INSERT INTO mk_segments (organization_id, name, definition) VALUES (1, 'S', '{}')").run().lastInsertRowid;
    m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, template_id, target_type, target_id) VALUES (1, 'Orpheline', 9999, 'segment', ?)").run(Number(seg) + 50);
    const row = sending.searchCampaigns(A, { q: "Orpheline" }).rows[0];
    assert.equal(row.template_name, null);
    assert.equal(row.target_name, null);
  });
});

describe("duplicateCampaign", () => {
  test("copie les réglages en brouillon vierge (aucun compteur, aucun contenu figé)", () => {
    const id = camp("Source", { status: "sent", sent: 50, clicks: 9, recipients: 60 });
    m.db.prepare("UPDATE mk_campaigns SET category = '', track_opens = 1, track_clicks = 0, snapshot = 'FIGE', started_at = 5, finished_at = 6, error = 'x' WHERE id = ?").run(id);
    const copy = sending.duplicateCampaign(A, id);
    assert.equal(copy.name, "Copie de Source");
    assert.equal(copy.status, "draft");
    assert.deepEqual([copy.template_id, copy.target_type, copy.target_id, copy.track_opens, copy.track_clicks], [tpl.id, "list", list.id, 1, 0]);
    assert.deepEqual([copy.sent_count, copy.unique_click_count, copy.total_recipients, copy.snapshot, copy.started_at, copy.error], [0, 0, 0, "", null, ""]);
    assert.notEqual(copy.id, id);
  });
  test("noms uniques, longueur bornée, introuvable, autre organisation", () => {
    const id = camp("Source");
    assert.equal(sending.duplicateCampaign(A, id).name, "Copie de Source");
    assert.equal(sending.duplicateCampaign(A, id).name, "Copie de Source (2)");
    assert.equal(sending.duplicateCampaign(A, id).name, "Copie de Source (3)");
    assert.ok(sending.duplicateCampaign(A, camp("x".repeat(100))).name.length <= 100);
    assert.equal(code(() => sending.duplicateCampaign(A, 99999)), "not_found");
    assert.equal(code(() => sending.duplicateCampaign(B, id)), "not_found");
  });
  test("la copie d'une campagne dont le modèle a disparu est refusée avec un message clair", () => {
    const id = camp("Source"); m.db.prepare("UPDATE mk_campaigns SET template_id = 9999 WHERE id = ?").run(id);
    assert.equal(code(() => sending.duplicateCampaign(A, id)), "not_found");
  });
  test("journalisé", () => {
    sending.duplicateCampaign(A, camp("Source"));
    assert.ok(m.db.prepare("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'campaign.duplicated'").get().n >= 1);
  });
});

describe("étapes de la création guidée", () => {
  const contact = (email) => { const { contact: c } = audience.upsertContact(A, { email }); compliance.recordConsent(A, c.id, PROOF); audience.addToList(A, list.id, [c.id]); return c; };
  const steps = (id, over = {}) => {
    const campaign = sending.getCampaign(A, id);
    return wizardSteps(campaign, { check: sending.preflight(A, id, { workerOn: true, smtpAvailable: false }), tested: false, ...over });
  };
  const state = (w) => Object.fromEntries(w.steps.map((s) => [s.key, s.state]));

  test("sept étapes, dans l'ordre annoncé", () => {
    assert.deepEqual(STEP_KEYS, ["infos", "audience", "template", "tracking", "test", "check", "send"]);
    contact("a@ex.fr");
    const w = steps(sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id);
    assert.deepEqual(w.steps.map((s) => s.key), STEP_KEYS);
    assert.equal(w.total, 7);
    assert.ok(w.steps.every((s) => s.label && typeof s.detail === "string"));
  });
  test("tout est prêt mais pas testé : lancement possible, le test est facultatif et n'est pas l'étape courante", () => {
    contact("a@ex.fr");
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id;
    const w = steps(id);
    assert.deepEqual(state(w), { infos: "done", audience: "done", template: "done", tracking: "done", test: "todo", check: "done", send: "todo" });
    assert.equal(w.steps.find((s) => s.key === "test").optional, true);
    assert.equal(w.canSend, true);
    assert.equal(w.current, "send");
    assert.equal(w.done, 5);
    assert.equal(w.percent, 71);
  });
  test("test envoyé : l'étape passe à « fait » et la progression augmente", () => {
    contact("a@ex.fr");
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id;
    const w = steps(id, { tested: true });
    assert.equal(state(w).test, "done");
    assert.equal(w.done, 6);
    assert.equal(w.percent, 86);
  });
  test("aucun contact joignable : audience et contrôle en erreur, envoi impossible, étape courante = audience", () => {
    audience.upsertContact(A, { email: "sans-consentement@ex.fr" });
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id;
    const w = steps(id);
    assert.equal(state(w).audience, "error");
    assert.equal(state(w).check, "error");
    assert.equal(w.canSend, false);
    assert.equal(w.current, "audience");
    assert.match(w.steps.find((s) => s.key === "audience").detail, /Aucun contact joignable/);
  });
  test("modèle supprimé : étape modèle en erreur", () => {
    contact("a@ex.fr");
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id;
    m.db.prepare("DELETE FROM mk_templates WHERE id = ?").run(tpl.id);
    const w = steps(id);
    assert.equal(state(w).template, "error");
    assert.equal(w.current, "template");
    assert.equal(w.canSend, false);
  });
  test("problème de configuration (fournisseur, adresse du site) : seule l'étape « contrôle » est en erreur", () => {
    contact("a@ex.fr");
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id;
    const w = wizardSteps(sending.getCampaign(A, id), { check: sending.preflight({ ...A, baseUrl: "http://exemple.fr" }, id, { workerOn: true }), tested: false });
    assert.equal(state(w).check, "error");
    assert.equal(state(w).audience, "done");
    assert.equal(w.canSend, false);
    assert.equal(w.current, "check");
    assert.match(w.steps.find((s) => s.key === "check").detail, /https/);
  });
  test("le suivi est décrit (clics / ouvertures)", () => {
    contact("a@ex.fr");
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id, trackClicks: true, trackOpens: false }).id;
    assert.match(steps(id).steps.find((s) => s.key === "tracking").detail, /clics/i);
  });
  test("campagne déjà lancée : toutes les étapes faites, plus de lancement possible", () => {
    contact("a@ex.fr");
    const id = sending.createCampaign(A, { name: "C", templateId: tpl.id, targetType: "list", targetId: list.id }).id;
    m.db.prepare("UPDATE mk_campaigns SET status = 'sent' WHERE id = ?").run(id);
    const w = wizardSteps(sending.getCampaign(A, id), { check: null, tested: false });
    assert.equal(w.percent, 100);
    assert.equal(w.canSend, false);
    assert.ok(w.steps.every((s) => s.state === "done"));
  });
});
