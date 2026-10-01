// Marketing M3a (1/2) — fournisseurs d'envoi (console, SMTP, Resend) et configuration d'envoi.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const { createSettings } = require("../src/marketing/settings");
const { createProvider, SendError, parseSender } = require("../src/marketing/sending/providers");
const config = require("../src/marketing/sending/config");

const MSG = { from: "KOYEKOLA <no-reply@k.test>", to: "awa@ex.fr", replyTo: "aide@k.test", subject: "Bonjour", html: "<p>Salut</p>", text: "Salut", headers: { "List-Unsubscribe": "<https://k.test/u/x>" }, idempotencyKey: "campaign:1:contact:2" };
const quiet = { log() {}, warn() {}, error() {} };
const fail = async (fn) => { try { await fn(); } catch (e) { return e; } return null; };

describe("expéditeur", () => {
  test("« Nom <adresse> » ou adresse seule ; nettoyé ; refus des caractères dangereux", () => {
    assert.deepEqual(parseSender("KOYEKOLA <no-reply@k.test>"), { name: "KOYEKOLA", email: "no-reply@k.test", formatted: "KOYEKOLA <no-reply@k.test>" });
    assert.equal(parseSender("  Aide@K.test ").formatted, "aide@k.test");
    assert.equal(parseSender('"Équipe, K." <a@k.test>').name, "Équipe K.");
    for (const bad of ["", "pas-un-email", "Nom <pas-un-email>", "A <a@k.test>\r\nBcc: x@y.fr", "A <a@k.test> <b@k.test>", null, 42]) assert.equal(parseSender(bad), null, String(bad));
  });
});

describe("fournisseur console (par défaut : rien ne part réellement)", () => {
  test("enregistre le message sans l'envoyer, renvoie un identifiant", async () => {
    const p = createProvider({ provider: "console" }, { log: quiet });
    const r = await p.send(MSG);
    assert.match(r.providerMessageId, /^console-/);
    assert.equal(p.sent.length, 1);
    assert.equal(p.sent[0].to, "awa@ex.fr");
    assert.deepEqual([p.name, p.capabilities.webhooks], ["console", false]);
  });
});

describe("fournisseur SMTP", () => {
  const smtp = (sendMail) => createProvider({ provider: "smtp" }, { transport: { sendMail }, log: quiet });
  test("transmet expéditeur, destinataire, en-têtes, HTML et texte", async () => {
    let seen;
    const p = smtp(async (m) => { seen = m; return { messageId: "<abc@k.test>" }; });
    const r = await p.send(MSG);
    assert.equal(r.providerMessageId, "<abc@k.test>");
    assert.deepEqual([seen.from, seen.to, seen.replyTo, seen.subject], [MSG.from, MSG.to, MSG.replyTo, MSG.subject]);
    assert.equal(seen.headers["List-Unsubscribe"], "<https://k.test/u/x>");
    assert.equal(seen.html, MSG.html);
    assert.equal(seen.text, MSG.text);
  });
  test("classement des erreurs : 4xx et réseau = temporaire ; 550/551/553 = adresse refusée ; autres 5xx = permanent", async () => {
    const kind = async (err) => (await fail(() => smtp(async () => { throw err; }).send(MSG))).kind;
    assert.equal(await kind(Object.assign(new Error("try later"), { responseCode: 451 })), "temporary");
    assert.equal(await kind(Object.assign(new Error("x"), { code: "ECONNECTION" })), "temporary");
    assert.equal(await kind(Object.assign(new Error("x"), { code: "ETIMEDOUT" })), "temporary");
    assert.equal(await kind(Object.assign(new Error("no such user"), { responseCode: 550 })), "recipient_rejected");
    assert.equal(await kind(Object.assign(new Error("x"), { responseCode: 553 })), "recipient_rejected");
    assert.equal(await kind(Object.assign(new Error("policy"), { responseCode: 554 })), "permanent");
    assert.equal(await kind(new Error("inconnue")), "temporary");
  });
  test("le message d'erreur exposé ne contient jamais le texte brut du serveur (identifiants possibles)", async () => {
    const e = await fail(() => smtp(async () => { throw Object.assign(new Error("AUTH failed for user:SECRET@smtp"), { responseCode: 535 }); }).send(MSG));
    assert.ok(e instanceof SendError);
    assert.ok(!e.message.includes("SECRET"));
  });
  test("sans transport configuré : erreur explicite à la création", () => {
    assert.throws(() => createProvider({ provider: "smtp" }, { transport: null }), /SMTP/);
  });
});

describe("fournisseur Resend (API HTTP)", () => {
  const resend = (fetchImpl, over = {}) => createProvider({ provider: "resend", apiKey: "re_SECRETKEY", ...over }, { fetch: fetchImpl, log: quiet });
  const ok = (body = { id: "re_123" }, status = 200) => ({ ok: status < 300, status, headers: new Map(), json: async () => body, text: async () => JSON.stringify(body) });
  test("requête : adresse, en-tête d'autorisation, clé d'idempotence, corps complet", async () => {
    let call;
    const p = resend(async (url, init) => { call = { url, init }; return ok(); });
    const r = await p.send(MSG);
    assert.equal(r.providerMessageId, "re_123");
    assert.equal(call.url, "https://api.resend.com/emails");
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.headers.Authorization, "Bearer re_SECRETKEY");
    assert.equal(call.init.headers["Idempotency-Key"], "campaign:1:contact:2");
    const body = JSON.parse(call.init.body);
    assert.deepEqual([body.from, body.to, body.reply_to, body.subject], [MSG.from, ["awa@ex.fr"], MSG.replyTo, "Bonjour"]);
    assert.equal(body.headers["List-Unsubscribe"], "<https://k.test/u/x>");
    assert.equal(body.html, MSG.html);
    assert.equal(body.text, MSG.text);
  });
  test("429 : limitation (avec délai conseillé) ; 422/400 : permanent ; 5xx et réseau : temporaire", async () => {
    const kindOf = async (impl) => fail(() => resend(impl).send(MSG));
    const limited = await kindOf(async () => ({ ...ok({}, 429), headers: new Map([["retry-after", "7"]]) }));
    assert.deepEqual([limited.kind, limited.retryAfterMs], ["rate_limited", 7000]);
    assert.equal((await kindOf(async () => ok({ message: "invalid" }, 422))).kind, "permanent");
    assert.equal((await kindOf(async () => ok({}, 400))).kind, "permanent");
    assert.equal((await kindOf(async () => ok({}, 401))).kind, "config");
    assert.equal((await kindOf(async () => ok({}, 503))).kind, "temporary");
    assert.equal((await kindOf(async () => { throw new Error("ECONNRESET"); })).kind, "temporary");
  });
  test("la clé d'API n'apparaît JAMAIS dans une erreur ni dans les journaux", async () => {
    const logs = [];
    const p = createProvider({ provider: "resend", apiKey: "re_SECRETKEY" }, { fetch: async () => { throw new Error("échec avec re_SECRETKEY"); }, log: { error: (...a) => logs.push(a.join(" ")), warn: (...a) => logs.push(a.join(" ")), log() {} } });
    const e = await fail(() => p.send(MSG));
    assert.ok(!e.message.includes("SECRETKEY"));
    assert.ok(!logs.join("").includes("SECRETKEY"));
    const e2 = await fail(() => resend(async () => ok({ message: "clé re_SECRETKEY refusée" }, 422)).send(MSG));
    assert.ok(!e2.message.includes("SECRETKEY"));
  });
  test("délai maximal : une API qui ne répond pas ne fige pas l'envoi", async () => {
    const p = resend((url, init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))), { timeoutMs: 30 });
    const t = Date.now();
    const e = await fail(() => p.send(MSG));
    assert.equal(e.kind, "temporary");
    assert.ok(Date.now() - t < 1000);
  });
  test("clé absente : refusée à la création", () => {
    assert.throws(() => createProvider({ provider: "resend", apiKey: "" }, { fetch: async () => ok() }), /clé/i);
  });
  test("réponse sans identifiant : erreur temporaire (jamais un succès sans preuve)", async () => {
    const e = await fail(() => resend(async () => ok({})).send(MSG));
    assert.equal(e.kind, "temporary");
  });
});

describe("choix du fournisseur", () => {
  test("fournisseur inconnu refusé ; console par défaut", () => {
    assert.throws(() => createProvider({ provider: "pigeon" }, {}), /inconnu/i);
    assert.equal(createProvider({}, { log: quiet }).name, "console");
  });
});

describe("configuration d'envoi enregistrée", () => {
  let m, ctx;
  beforeEach(() => { m = freshMarketing(); ctx = m.A; });
  test("valeurs par défaut sûres : console, débit et plafond quotidien bornés", () => {
    const c = config.getSendingConfig(ctx);
    assert.deepEqual([c.provider, c.ratePerMinute, c.dailyLimit, c.from, c.apiKeySet], ["console", 60, 1000, "", false]);
  });
  test("enregistrement : validé, clé chiffrée (jamais renvoyée en clair), audit sans secret", () => {
    config.saveSendingConfig(ctx, { provider: "resend", from: "KOYEKOLA <no-reply@k.test>", replyTo: "aide@k.test", ratePerMinute: 120, dailyLimit: 5000, apiKey: "re_SECRETKEY", webhookSecret: "whsec_dGVzdA==" });
    const c = config.getSendingConfig(ctx);
    assert.deepEqual([c.provider, c.from, c.replyTo, c.ratePerMinute, c.dailyLimit, c.apiKeySet, c.webhookSecretSet], ["resend", "KOYEKOLA <no-reply@k.test>", "aide@k.test", 120, 5000, true, true]);
    assert.equal(c.apiKey, undefined);
    const raw = m.db.prepare("SELECT value, is_secret FROM mk_settings WHERE key = 'email.api_key'").get();
    assert.equal(raw.is_secret, 1);
    assert.ok(!raw.value.includes("SECRETKEY"));
    assert.equal(config.getSecrets(ctx).apiKey, "re_SECRETKEY");
    assert.ok(!JSON.stringify(m.db.prepare("SELECT metadata FROM mk_audit_logs").all()).includes("SECRETKEY"));
  });
  test("une clé laissée vide conserve l'ancienne ; « effacer » la supprime", () => {
    config.saveSendingConfig(ctx, { provider: "resend", from: "a@k.test", apiKey: "re_A" });
    config.saveSendingConfig(ctx, { provider: "resend", from: "a@k.test", apiKey: "" });
    assert.equal(config.getSecrets(ctx).apiKey, "re_A");
    config.saveSendingConfig(ctx, { provider: "resend", from: "a@k.test", clearApiKey: true });
    assert.equal(config.getSecrets(ctx).apiKey, undefined);
  });
  test("valeurs refusées : fournisseur inconnu, expéditeur invalide, débit hors bornes", () => {
    const code = (i) => { try { config.saveSendingConfig(ctx, i); } catch (e) { return e.code; } return null; };
    assert.equal(code({ provider: "pigeon" }), "invalid_field");
    assert.equal(code({ provider: "smtp", from: "nimporte" }), "invalid_field");
    assert.equal(code({ provider: "smtp", from: "a@k.test", ratePerMinute: 0 }), "invalid_field");
    assert.equal(code({ provider: "smtp", from: "a@k.test", ratePerMinute: 100000 }), "invalid_field");
    assert.equal(code({ provider: "smtp", from: "a@k.test", dailyLimit: -5 }), "invalid_field");
    assert.equal(code({ provider: "smtp", from: "a@k.test", replyTo: "pas-un-email" }), "invalid_field");
  });
  test("isolation : la configuration d'une organisation n'est pas visible d'une autre", () => {
    config.saveSendingConfig(ctx, { provider: "smtp", from: "a@k.test" });
    assert.equal(config.getSendingConfig(m.B).provider, "console");
  });
  test("createProviderFor : construit le fournisseur à partir de la configuration enregistrée", () => {
    config.saveSendingConfig(ctx, { provider: "resend", from: "a@k.test", apiKey: "re_K" });
    const p = config.createProviderFor(ctx, { fetch: async () => ({}), log: quiet });
    assert.equal(p.name, "resend");
    config.saveSendingConfig(ctx, { provider: "smtp", from: "a@k.test" });
    assert.equal(config.createProviderFor(ctx, { transport: { sendMail() {} }, log: quiet }).name, "smtp");
  });
  test("sans ENCRYPTION_KEY valide : impossible d'enregistrer un secret (message clair), le reste fonctionne", () => {
    const bare = { ...ctx, settings: createSettings(m.db, { encryptionKey: "" }) };
    assert.throws(() => config.saveSendingConfig(bare, { provider: "resend", from: "a@k.test", apiKey: "re_X" }), /ENCRYPTION_KEY/);
    assert.doesNotThrow(() => config.saveSendingConfig(bare, { provider: "smtp", from: "a@k.test" }));
  });
});
