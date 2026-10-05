// Assistant de rédaction IA du marketing (point 10 de la parité Mailchimp) : objets/préheaders, réécriture, brouillon
// d'e-mail, conseils, SMS ; plafond quotidien, journal sans texte, voix de la marque ; pages et appels web.
// Aucune vraie demande à Anthropic : client factice (service) et faux serveur d'API local (pages web, vrai SDK).
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { freshMarketing, TEST_KEY, addLmsSchema } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const ai = require("../src/marketing/ai");
const templates = require("../src/marketing/templates");
const { startServer, loginInstructor } = require("./helpers");

const NOW = Date.UTC(2026, 9, 5, 12);
let m, A, requests, reply;
// Client factice : enregistre chaque demande, répond avec `reply(request)` (objet JSON) ou lève l'erreur renvoyée
function fake() {
  requests = [];
  aiCore.setClientForTests({ beta: { messages: { create: async (r) => {
    requests.push(r);
    const out = reply(r);
    if (out instanceof Error) throw out;
    return { stop_reason: out.__stop || "end_turn", model: r.model, usage: { output_tokens: 42 }, content: [{ type: "text", text: JSON.stringify(out) }] };
  } } } });
}
const code = async (p) => { try { await p; } catch (e) { return e.code; } return null; };

function fresh() {
  m = freshMarketing();
  A = m.ctx(1, { now: () => NOW, baseUrl: "https://k.test" });
  fake();
}

describe("assistant IA : service", () => {
  beforeEach(fresh);
  after(() => aiCore.setClientForTests(null));

  test("sans clé : indisponible, aucune demande, aucun journal", async () => {
    aiCore.setClientForTests(null);
    const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
    try {
      assert.equal(ai.getAiSettings(A).configured, false);
      assert.equal(await code(ai.suggestSubjects(A, { content: "Bonjour" })), "not_configured");
      assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_ai_requests").get().n, 0);
    } finally { if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved; }
  });

  test("objets : propositions valides seulement, voix de la marque, journal SANS texte", async () => {
    ai.saveAiSettings(A, { voice: "Tutoiement, ton encourageant.", dailyLimit: 50 });
    reply = () => ({ proposals: [
      { subject: "  {{contact.first_name | default:\"Bonjour\"}}, Excel avancé ouvre ", preheader: "Inscriptions jusqu'à vendredi", why: "personnalisation" },
      { subject: "Variable inventée {{contact.age}}", preheader: "x", why: "" },
      { subject: "", preheader: "vide", why: "" },
      { subject: "Prêt pour Excel avancé ?", preheader: "Le programme complet", why: "question" },
    ] });
    const r = await ai.suggestSubjects(A, { content: "Contenu secret de l'e-mail", goal: "inscriptions" });
    assert.deepEqual(r.proposals.map((p) => p.subject), ["{{contact.first_name | default:\"Bonjour\"}}, Excel avancé ouvre", "Prêt pour Excel avancé ?"]);
    const req = requests[0];
    assert.equal(req.model, "claude-opus-5-5");
    assert.deepEqual(req.thinking, { type: "adaptive" });
    assert.equal(req.output_config.format.type, "json_schema");
    assert.match(req.system, /Voix de la marque à respecter : Tutoiement, ton encourageant\./);
    assert.match(req.system, /n'inventes jamais/);
    assert.match(req.messages[0].content, /Contenu secret de l'e-mail/);
    const log = m.db.prepare("SELECT * FROM mk_ai_requests").all();
    assert.equal(log.length, 1);
    assert.deepEqual([log[0].action, log[0].ok, log[0].output_tokens, log[0].user_id], ["subjects", 1, 42, 7]);
    assert.doesNotMatch(JSON.stringify(log), /secret/, "aucun texte conservé");
    assert.equal(await code(ai.suggestSubjects(A, { content: "  " })), "invalid_field");
  });

  test("plafond quotidien : refus au-delà, échecs comptés et journalisés avec leur code", async () => {
    ai.saveAiSettings(A, { voice: "", dailyLimit: 2 });
    reply = () => ({ __stop: "refusal" });
    assert.equal(await code(ai.rewrite(A, { text: "Bonjour", mode: "reecrire" })), "refusal");
    reply = () => ({ text: "Salut" });
    await ai.rewrite(A, { text: "Bonjour", mode: "reecrire" });
    assert.equal(await code(ai.rewrite(A, { text: "Bonjour", mode: "reecrire" })), "quota");
    assert.equal(requests.length, 2, "aucun appel au-delà du plafond");
    assert.deepEqual(m.db.prepare("SELECT ok, error_code FROM mk_ai_requests ORDER BY id").all().map((r) => [r.ok, r.error_code]), [[0, "refusal"], [1, ""]]);
    assert.deepEqual(ai.usage(A).last24h, 2);
    assert.equal(ai.usage({ ...A, now: () => NOW + 86400001 }).last24h, 0, "fenêtre glissante de 24 h");
    assert.throws(() => ai.saveAiSettings(A, { voice: "", dailyLimit: 0 }), /entre 1 et 2000/);
  });

  test("réécriture : modes connus, HTML propre, variable inventée retirée", async () => {
    reply = (r) => ({ text: /Raccourcis/.test(r.messages[0].content) ? "Court **et** clair, {{contact.first_name | default:\"toi\"}} !" : "Texte {{contact.inconnue}} réécrit" });
    const short = await ai.rewrite(A, { text: "Un long texte", mode: "raccourcir" });
    assert.match(short.html, /<p>Court <strong>et<\/strong> clair, \{\{contact\.first_name \| default:&quot;toi&quot;\}\} !<\/p>|<p>Court <strong>et<\/strong> clair, \{\{contact\.first_name \| default:"toi"\}\} !<\/p>/);
    const odd = await ai.rewrite(A, { text: "x", mode: "ton_amical" });
    assert.doesNotMatch(odd.html, /inconnue/);
    assert.match(requests[1].messages[0].content, /ton amical et chaleureux/);
    assert.equal(await code(ai.rewrite(A, { text: "x", mode: "pirater" })), "invalid_field");
  });

  test("brouillon : blocs convertis et valides, lien du bouton fourni par la personne (jamais par l'IA), formation du catalogue", async () => {
    reply = () => ({ subject: "Excel avancé : c'est parti", preheader: "Les inscriptions sont ouvertes", buttonLabel: "Je m'inscris",
      sections: [{ kind: "heading", text: "Bonjour {{contact.first_name | default:\"à toi\"}}", items: [] }, { kind: "text", text: "Premier paragraphe **important**.", items: [] }, { kind: "list", text: "", items: ["Formules", "Tableaux croisés", ""] }, { kind: "text", text: "", items: [] }] });
    const r = await ai.draftEmail(A, { topic: "Lancement Excel avancé", tone: "enthousiaste", length: "court", ctaUrl: "/catalogue" });
    assert.deepEqual(r.draft.blocks.map((b) => b.type), ["heading", "text", "list", "button"]);
    assert.equal(r.draft.blocks[0].level, 1);
    assert.match(r.draft.blocks[1].html, /<strong>important<\/strong>/);
    assert.deepEqual(r.draft.blocks[2].items, ["Formules", "Tableaux croisés"]);
    assert.deepEqual([r.draft.blocks[3].label, r.draft.blocks[3].url], ["Je m'inscris", "https://k.test/catalogue"]);
    assert.equal(r.missingLink, false);
    assert.ok(templates.compileTemplate({ kind: "marketing", ...r.draft }, { allowed: () => true }));
    assert.match(requests[0].messages[0].content, /enthousiaste et énergique/);
    assert.equal(requests[0].output_config.effort, "high");
    // Sans lien ni formation : pas de bouton (signalé), jamais une adresse inventée
    const noLink = await ai.draftEmail(A, { topic: "Nouvelles" });
    assert.equal(noLink.draft.blocks.some((b) => b.type === "button"), false);
    assert.equal(noLink.missingLink, true);
    assert.equal(await code(ai.draftEmail(A, { topic: "x", ctaUrl: "javascript:alert(1)" })), "invalid_field");
    assert.equal(await code(ai.draftEmail(A, { topic: "" })), "invalid_field");
    assert.equal(await code(ai.draftEmail(A, { topic: "x", tone: "agressif" })), "invalid_field");
  });

  test("brouillon autour d'une formation : bloc « formation » du catalogue ; variable inconnue retirée de l'objet", async () => {
    addLmsSchema(m.db);
    m.db.exec("ALTER TABLE courses ADD COLUMN subtitle TEXT; ALTER TABLE courses ADD COLUMN price_cents INTEGER; ALTER TABLE courses ADD COLUMN thumbnail_path TEXT");
    const courseId = m.db.prepare("INSERT INTO courses (title, slug, subtitle) VALUES ('Excel avancé', 'excel-avance', 'Tableaux croisés') RETURNING id").get().id;
    reply = () => ({ subject: "Pour {{contact.ville}} : Excel", preheader: "p", buttonLabel: "Voir", sections: [{ kind: "text", text: "Texte", items: [] }] });
    const r = await ai.draftEmail(A, { topic: "Promo", courseId });
    assert.equal(r.draft.subject, "Pour : Excel");
    assert.deepEqual(r.draft.blocks.at(-1), { type: "course", courseId, cta: "Voir" });
    assert.match(requests[0].messages[0].content, /« Excel avancé » — Tableaux croisés/);
    assert.equal(await code(ai.draftEmail(A, { topic: "x", courseId: 999 })), "invalid_field");
  });

  test("conseils d'optimisation : domaines traduits, 7 au plus, aucun score", async () => {
    reply = () => ({ summary: "Bon e-mail.", tips: Array.from({ length: 9 }, (_, i) => ({ area: i % 2 ? "objet" : "appel", issue: `Problème ${i}`, suggestion: `Idée ${i}` })) });
    const r = await ai.optimize(A, { subject: "Objet", preheader: "", content: "Corps" });
    assert.equal(r.tips.length, 7);
    assert.deepEqual([r.tips[0].areaLabel, r.tips[1].areaLabel], ["Appel à l'action", "Objet"]);
    assert.match(requests[0].messages[0].content, /Ne donne aucun score/);
    assert.match(requests[0].messages[0].content, /Préheader : \(vide\)/);
  });

  test("SMS : mesuré comme à l'envoi (mention STOP comprise), balises inconnues retirées, limite signalée", async () => {
    reply = () => ({ text: "Bonjour {{prenom|toi}}, les inscriptions a Excel ferment vendredi. {{email}}" });
    const r = await ai.smsText(A, { mode: "write", brief: "Rappel Excel" });
    assert.equal(r.text, "Bonjour {{prenom|toi}}, les inscriptions a Excel ferment vendredi.");
    assert.deepEqual([r.segments, r.encoding, r.overLimit, r.maxSegments], [1, "GSM-7", false, 3]);
    assert.match(requests[0].system, /des SMS/);
    assert.match(requests[0].messages[0].content, /Au plus \d+ caractères/);
    reply = () => ({ text: "ê".repeat(300) });
    const long = await ai.smsText(A, { mode: "shorten", text: "Un texte" });
    assert.equal(long.overLimit, true);
    assert.equal(await code(ai.smsText(A, { mode: "gsm", text: "x" })), "invalid_field");
    assert.equal(await code(ai.smsText(A, { mode: "write", brief: " " })), "invalid_field");
  });
});

describe("assistant IA : pages web (vrai SDK, faux serveur d'API local)", () => {
  let srv, boss, api, apiUrl, apiRequests = [];
  before(async () => {
    api = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}");
        apiRequests.push({ url: req.url, key: req.headers["x-api-key"], body: r });
        const text = JSON.stringify({ proposals: [{ subject: "Objet venu du faux serveur", preheader: "Préheader", why: "test" }] });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
    });
    await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
    apiUrl = `http://127.0.0.1:${api.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "sk-ant-test-factice", ANTHROPIC_BASE_URL: apiUrl });
    boss = await loginInstructor(srv);
  });
  after(async () => { await srv.stop(); api.close(); });

  test("Paramètres → Assistant IA : état, voix de la marque, plafond ; menu", async () => {
    let r = await boss.get("/marketing/ia");
    assert.equal(r.status, 200);
    assert.match(r.text, /Activé/);
    assert.match(r.text, /href="\/marketing\/ia"[^>]*>[\s\S]{0,200}Assistant IA/);
    r = await boss.post("/marketing/ia", { voice: "Vouvoiement.", dailyLimit: "30" });
    assert.equal(r.location, "/marketing/ia");
    r = await boss.get("/marketing/ia");
    assert.match(r.text, /Vouvoiement\./);
    assert.match(r.text, /value="30"/);
    assert.doesNotMatch(r.text, /sk-ant-test-factice/, "la clé n'est jamais affichée");
  });

  test("appel JSON depuis l'éditeur : vrai SDK, réponse filtrée, journal ; erreurs claires", async () => {
    const r = await boss.postJson("/marketing/ia/objets", { content: "Bienvenue dans la formation" });
    assert.equal(r.status, 200, r.text);
    const j = JSON.parse(r.text);
    assert.equal(j.ok, true);
    assert.equal(j.proposals[0].subject, "Objet venu du faux serveur");
    const last = apiRequests.at(-1);
    assert.equal(last.key, "sk-ant-test-factice");
    assert.match(last.url, /^\/v1\/messages/);
    assert.match(last.body.system, /Vouvoiement\./);
    const bad = await boss.postJson("/marketing/ia/reecrire", { text: "x", mode: "inconnu" });
    assert.equal(bad.status, 400);
    assert.match(JSON.parse(bad.text).error, /inconnue/);
  });

  test("éditeur d'e-mails : onglet IA ; campagne SMS : « Rédiger avec l'IA »", async () => {
    let r = await boss.post("/marketing/modeles", { name: "IA test", starter: "blank", kind: "marketing" });
    const page = await boss.get(r.location);
    assert.match(page.text, /id="pane-ai"/);
    assert.match(page.text, /id="ai-draft-go"/);
    assert.match(page.text, /&#34;ai&#34;:\{&#34;configured&#34;:true\}|"ai":\{"configured":true\}/);
    r = await boss.post("/marketing/sms/campagnes", { name: "SMS IA" });
    const sms = await boss.get(r.location);
    assert.match(sms.text, /data-sms-ai-write/);
    assert.match(sms.text, /Raccourcir avec l&#39;IA|Raccourcir avec l'IA/);
  });
});

describe("assistant IA : serveur sans clé", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());
  test("503 avec la marche à suivre ; réglages « Non activé »", async () => {
    const r = await boss.postJson("/marketing/ia/objets", { content: "x" });
    assert.equal(r.status, 503);
    assert.match(JSON.parse(r.text).error, /ANTHROPIC_API_KEY/);
    assert.match((await boss.get("/marketing/ia")).text, /Non activé/);
  });
});
