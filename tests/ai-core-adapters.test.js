// Programme 21.2 — adaptateurs OpenAI, Anthropic, Gemini, Mistral testés contre un FAUX serveur HTTP local (CONNECTOR_API_BASE_<ID>, hors production seulement).
// Ces tests vérifient la forme des requêtes que Kolakisa ENVOIE et la lecture de réponses SIMULÉES d'après la documentation des fournisseurs.
// Ils ne prouvent PAS que les vrais services acceptent ces requêtes : aucune clé réelle n'a été utilisée (voir docs/KOLAKISA_AI_PROVIDER_ADAPTERS.md).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createProviders, defaultProviders } = require("../src/ai/providers");
const { normalizeRequest } = require("../src/ai/contracts");

const KEY = "sk-test-FAKEKEY-do-not-use-123456";
describe("Adaptateurs de fournisseurs (faux serveur local)", () => {
  let server, port, reply, seen;
  const ENV = ["OPENAI", "ANTHROPIC", "GOOGLE_AI", "MISTRAL"];
  before(async () => {
    server = http.createServer((req, res) => {
      let body = ""; req.on("data", (c) => { body += c; });
      req.on("end", () => { seen.push({ method: req.method, url: req.url, headers: req.headers, body: body ? JSON.parse(body) : null }); const r = typeof reply === "function" ? reply(req.url) : reply; res.writeHead(r.status || 200, { "content-type": "application/json" }); res.end(JSON.stringify(r.json)); });
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    port = server.address().port;
    for (const id of ENV) process.env[`CONNECTOR_API_BASE_${id}`] = `http://127.0.0.1:${port}`;
  });
  after(() => { for (const id of ENV) delete process.env[`CONNECTOR_API_BASE_${id}`]; server.close(); });
  const mk = () => createProviders({ credentials: () => ({ secrets: { apiKey: KEY }, config: {}, source: "central" }) });
  const prov = () => { const p = mk(); for (const f of ["openai", "anthropic", "gemini", "mistral"]) p.register(require(`../src/ai/adapters/${f}`)); return p; };
  const request = (extra = {}) => normalizeRequest({ module: "tests", messages: [{ role: "user", content: "Salut" }], system: "Sois bref.", maxOutputTokens: 50, temperature: 0.5, ...extra });
  const call = (p, id, model, extra) => p.call({ organizationId: 1, settings: null }, { siteId: 1 }, id, model, request(extra));
  const reset = (r) => { seen = []; reply = r; };

  test("OpenAI : Chat Completions, clé en en-tête Bearer, jetons lus de l'API", async () => {
    reset({ json: { id: "chatcmpl-1", model: "m1", choices: [{ message: { content: "Salut !" }, finish_reason: "stop" }], usage: { prompt_tokens: 12, completion_tokens: 3 } } });
    const out = await call(prov(), "openai", "m1");
    assert.equal(out.content, "Salut !"); assert.deepEqual(out.usage, { inputTokens: 12, outputTokens: 3 }); assert.equal(out.finishReason, "stop");
    const s = seen[0];
    assert.equal(s.url, "/v1/chat/completions"); assert.equal(s.headers.authorization, `Bearer ${KEY}`); assert.ok(!s.url.includes(KEY));
    assert.deepEqual(s.body.messages[0], { role: "system", content: "Sois bref." }); assert.equal(s.body.max_completion_tokens, 50); assert.equal(s.body.temperature, 0.5);
  });
  test("OpenAI : demande JSON → response_format json_object et consigne JSON ; finish length / content_filter normalisés", async () => {
    reset({ json: { choices: [{ message: { content: "{}" }, finish_reason: "length" }] } });
    const out = await call(prov(), "openai", "m1", { responseFormat: { type: "json" } });
    assert.deepEqual(seen[0].body.response_format, { type: "json_object" }); assert.match(seen[0].body.messages[0].content, /objet JSON/);
    assert.equal(out.finishReason, "length"); assert.equal(out.usage, null, "usage absent : pas de jetons inventés");
    reset({ json: { choices: [{ message: { content: null }, finish_reason: "content_filter" }] } });
    assert.equal((await call(prov(), "openai", "m1")).finishReason, "refused");
  });
  test("Anthropic : Messages API, x-api-key + anthropic-version, system séparé, stop_reason normalisé", async () => {
    reset({ json: { id: "msg_1", model: "c1", content: [{ type: "text", text: "Bonjour" }], stop_reason: "max_tokens", usage: { input_tokens: 9, output_tokens: 50 } } });
    const out = await call(prov(), "anthropic", "c1");
    assert.equal(out.content, "Bonjour"); assert.equal(out.finishReason, "length"); assert.deepEqual(out.usage, { inputTokens: 9, outputTokens: 50 });
    const s = seen[0];
    assert.equal(s.url, "/v1/messages"); assert.equal(s.headers["x-api-key"], KEY); assert.equal(s.headers["anthropic-version"], "2023-06-01"); assert.ok(!s.headers.authorization);
    assert.equal(s.body.system, "Sois bref."); assert.equal(s.body.max_tokens, 50); assert.deepEqual(s.body.messages, [{ role: "user", content: "Salut" }]);
  });
  test("Gemini : generateContent, clé en en-tête x-goog-api-key (jamais dans l'adresse), rôles user/model", async () => {
    reset({ json: { candidates: [{ content: { parts: [{ text: "Coucou" }] }, finishReason: "STOP" }], usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 2 } } });
    const out = await call(prov(), "gemini", "g1", { messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }, { role: "user", content: "c" }], responseFormat: { type: "json" } });
    assert.equal(out.content, "Coucou"); assert.deepEqual(out.usage, { inputTokens: 7, outputTokens: 2 });
    const s = seen[0];
    assert.equal(s.url, "/v1beta/models/g1:generateContent"); assert.equal(s.headers["x-goog-api-key"], KEY); assert.ok(!s.url.includes(KEY));
    assert.deepEqual(s.body.contents.map((c) => c.role), ["user", "model", "user"]); assert.equal(s.body.generationConfig.responseMimeType, "application/json");
    reset({ json: { promptFeedback: { blockReason: "SAFETY" } } });
    assert.equal((await call(prov(), "gemini", "g1")).finishReason, "refused");
  });
  test("Mistral : Chat Completions (format OpenAI), Bearer — NON vérifié contre le vrai service", async () => {
    reset({ json: { id: "m-1", choices: [{ message: { content: "Salut" }, finish_reason: "stop" }], usage: { prompt_tokens: 5, completion_tokens: 1 } } });
    const out = await call(prov(), "mistral", "ms1");
    assert.equal(out.content, "Salut"); assert.equal(seen[0].url, "/v1/chat/completions"); assert.equal(seen[0].headers.authorization, `Bearer ${KEY}`); assert.equal(seen[0].body.max_tokens, 50);
  });
  test("erreurs HTTP du fournisseur → codes normalisés, sans clé dans le message", async () => {
    const cases = [[401, "auth_invalid"], [403, "auth_invalid"], [404, "model_unavailable"], [402, "provider_quota"], [429, "rate_limited"], [503, "provider_overloaded"], [500, "provider_unavailable"], [400, "refused"]];
    for (const [status, code] of cases) {
      reset({ status, json: { error: { message: `Bad key ${KEY}` } } });
      try { await call(prov(), "openai", "m1"); assert.fail(`erreur attendue pour ${status}`); }
      catch (e) { assert.equal(e.code, code, `HTTP ${status}`); assert.doesNotMatch(e.message, /FAKEKEY/); }
    }
    reset({ status: 429, json: { error: { message: "You exceeded your current quota, please check your billing" } } });
    await assert.rejects(call(prov(), "openai", "m1"), (e) => e.code === "provider_quota");
  });
  test("réponse hors format : l'adaptateur ne fabrique rien (contenu absent), la couche cœur la refusera (malformed_response)", async () => {
    reset({ json: "pas un objet" });
    const out = await call(prov(), "openai", "m1");
    assert.equal(out.content, undefined);
  });
  test("une erreur du fournisseur qui cite la clé partiellement masquée est nettoyée", async () => {
    reset({ status: 401, json: { error: { message: "Incorrect API key provided: sk-test-*********************3456." } } });
    await assert.rejects(call(prov(), "openai", "m1"), (e) => e.code === "auth_invalid" && !/3456|sk-test/.test(e.message));
  });
});
