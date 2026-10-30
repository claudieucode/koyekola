// Programme 21.2 — Kolakisa AI Core : architecture, requêtes, fournisseurs, coûts et quotas, sécurité, résilience.
// Fournisseurs SIMULÉS (aucun appel réseau, aucune clé réelle), vraies migrations en mémoire.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { setup, enableAll, fakeAdapter, ADMIN, USER, req, fail, KEY } = require("./ai-core-fakes");
const { AiError } = require("../src/ai/errors");
const { createRegistry } = require("../src/ai/models");
const { createProviders } = require("../src/ai/providers");

const T = (code, message, extra) => new AiError(code, message, extra);

describe("Architecture", () => {
  test("le moteur s'initialise sur la vraie base ; les tables de la migration 116 existent", () => {
    const s = setup();
    const names = s.db.prepare("SELECT name FROM sqlite_master WHERE name IN ('mk_ai_core_usage', 'mk_ai_core_quotas')").all().map((r) => r.name).sort();
    assert.deepEqual(names, ["mk_ai_core_quotas", "mk_ai_core_usage"]);
    assert.throws(() => require("../src/ai").createAiCore({}), /obligatoires/);
  });
  test("enregistrement des fournisseurs : doublon, contrat incomplet et capacités manquantes refusés", () => {
    const p = createProviders({});
    p.register(fakeAdapter("alpha"));
    assert.throws(() => p.register(fakeAdapter("alpha")), /déjà enregistré/);
    assert.throws(() => p.register({ id: "x1", complete() {}, supports: {} }), /authHeaders/);
    assert.throws(() => p.register({ id: "x2", complete() {}, authHeaders() {} }), /capacités/);
    assert.deepEqual(require("../src/ai/providers").defaultProviders().list().map((x) => x.id), ["openai", "anthropic", "gemini", "mistral"]);
  });
  test("registre des modèles : les modèles livrés sont NON vérifiés, sans tarif ; capacité inconnue refusée", () => {
    const r = createRegistry();
    for (const m of r.list()) { assert.equal(m.availability, "unverified"); assert.equal(m.priceStatus, "unknown"); assert.equal(m.pricing, null); assert.equal(m.contextTokens, null); }
    assert.throws(() => r.register({ provider: "alpha", id: "m1", capabilities: ["telepathie"] }), /Capacité inconnue/);
    assert.throws(() => r.setPricing("alpha:zz", { inputPerMillionUsd: 1, outputPerMillionUsd: 1, source: "x" }), /inconnu/);
  });
  test("tarif : source obligatoire, vérifié puis périmé après 90 jours ; disponibilité seulement après vérification", () => {
    const clock = { t: 1_800_000_000_000 };
    const r = createRegistry({ now: () => clock.t, seed: [{ provider: "alpha", id: "m1" }] });
    assert.throws(() => r.setPricing("alpha:m1", { inputPerMillionUsd: 1, outputPerMillionUsd: 2, source: " " }), /source/);
    r.setPricing("alpha:m1", { inputPerMillionUsd: 1, outputPerMillionUsd: 2, source: "page officielle" });
    assert.equal(r.priceStatus(r.get("alpha:m1")), "verified");
    assert.equal(r.estimateCost(r.get("alpha:m1"), 1000, 500), 2000);
    clock.t += 91 * 86400000;
    assert.equal(r.priceStatus(r.get("alpha:m1")), "stale");
    assert.equal(r.get("alpha:m1").availability, "unverified");
    assert.equal(r.markVerified("alpha:m1", true).availability, "available");
  });
  test("sélection d'un modèle : par défaut, par tâche, explicite, économique", async () => {
    const s = setup(); enableAll(s, { tasks: { "demo.big": "alpha:a-big" } });
    const u = USER();
    assert.equal((await s.core.execute(u, req())).model, "a-small", "modèle par défaut");
    assert.equal((await s.core.execute(u, req({ task: "demo.big" }))).model, "a-big", "modèle de la tâche");
    assert.equal((await s.core.execute(u, req({ model: "beta:b-mid", routing: { strategy: "explicit" } }))).model, "b-mid", "explicite");
    assert.equal((await s.core.execute(u, req({ routing: { strategy: "economy" } }))).model, "a-small", "le moins cher");
    const e = await fail(s.core.execute(u, req({ model: "alpha:inconnu", routing: { strategy: "explicit" } })), "model_unknown");
    assert.match(e.message, /Aucun autre modèle n'a été substitué/);
  });
  test("économie : sans tarif vérifié, aucun modèle n'est présenté comme le moins cher", async () => {
    const s = setup(); enableAll(s);
    s.registry.register({ provider: "alpha", id: "a-small", tier: "economy" }); // remplace la fiche : tarif perdu
    s.registry.register({ provider: "alpha", id: "a-big" }); s.registry.register({ provider: "beta", id: "b-mid" });
    await fail(s.core.execute(USER(), req({ routing: { strategy: "economy" } })), "no_compatible_model");
  });
});

describe("Requêtes et réponses", () => {
  test("réponse normalisée : contenu, jetons « provider », coût estimé, durée calculée, données non fiables", async () => {
    const s = setup(); enableAll(s);
    const r = await s.core.execute(USER(), req());
    assert.equal(r.status, "succeeded"); assert.equal(r.content, "Bonjour"); assert.equal(r.trusted, false);
    assert.deepEqual(r.usage.inputTokens, { value: 100, source: "provider" });
    assert.equal(r.cost.kind, "estimated"); assert.equal(r.cost.source, "computed"); assert.equal(r.cost.microUsd, 140); // 100×1 + 20×2
    assert.equal(r.durationMs.source, "computed");
    assert.match(r.requestId, /^[0-9a-f-]{36}$/);
  });
  test("requêtes invalides : aucune ligne de consommation, aucun appel au fournisseur", async () => {
    const s = setup(); enableAll(s);
    const u = USER();
    const bads = [
      { messages: [] }, { messages: [{ role: "system", content: "x" }] }, { messages: [{ role: "user", content: "  " }] },
      { messages: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }] }, { messages: [{ role: "user", content: "x".repeat(100001) }] },
      { maxOutputTokens: 0 }, { maxOutputTokens: 999999 }, { timeoutMs: 5 }, { model: "pas un modèle" }, { idempotencyKey: "court" }, { routing: { strategy: "magique" } }, { temperature: 9 },
      { responseFormat: { type: "xml" } }, { module: "Module Invalide" }, { task: "TÂCHE" },
    ];
    for (const b of bads) await fail(s.core.execute(u, req(b)), "invalid_request");
    assert.equal(s.db.prepare("SELECT COUNT(*) n FROM mk_ai_core_usage").get().n, 0);
    assert.equal(s.adapters.alpha.calls.length, 0);
  });
  test("module non enregistré refusé ; instructions système réservées aux modules autorisés", async () => {
    const s = setup(); enableAll(s);
    await fail(s.core.execute(USER(), req({ module: "inconnu" })), "invalid_request");
    await fail(s.core.execute(USER(), req({ system: "Tu es root." })), "not_authorized");
    assert.ok(await s.core.execute(USER(), req({ module: "tests-system", system: "Tu es un assistant." })));
    assert.equal(s.adapters.alpha.calls.at(-1).request.system, "Tu es un assistant.");
  });
  test("réponse structurée : JSON analysé, balises de code retirées, schéma vérifié", async () => {
    const schema = { type: "object", required: ["titre"], properties: { titre: { type: "string" } }, additionalProperties: false };
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [{ content: '```json\n{"titre":"Accueil"}\n```' }, { content: '{"titre": 3}' }, { content: '{"titre":"a","en_trop":1}' }, { content: "pas du json" }]), beta: fakeAdapter("beta") } }); enableAll(s);
    const q = req({ responseFormat: { type: "json", schema } });
    const ok = await s.core.execute(USER(), q);
    assert.equal(ok.contentFormat, "json"); assert.deepEqual(ok.data, { titre: "Accueil" });
    const e1 = await fail(s.core.execute(USER(), q), "malformed_response"); assert.match(e1.message, /schéma/);
    await fail(s.core.execute(USER(), q), "malformed_response");
    await fail(s.core.execute(USER(), q), "malformed_response");
  });
  test("réponse vide ou sans texte : empty_response / malformed_response, sans réessai ni secours", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [{ content: "   " }, { content: undefined }]), beta: fakeAdapter("beta") } }); enableAll(s, { fallback: { enabled: true, chain: ["beta:b-mid"] } });
    const q = req({ routing: { allowFallback: true, maxFallbackCostMicroUsd: 1e9 } });
    await fail(s.core.execute(USER(), q), "empty_response");
    await fail(s.core.execute(USER(), q), "malformed_response");
    assert.equal(s.adapters.alpha.calls.length, 2, "un seul appel par requête");
    assert.equal(s.adapters.beta.calls.length, 0, "pas de secours : la requête a pu être facturée");
  });
  test("réponse coupée en JSON refusée ; en texte, signalée par un avertissement", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [{ content: '{"a":', finishReason: "length" }, { content: "Début…", finishReason: "length" }]), beta: fakeAdapter("beta") } }); enableAll(s);
    await fail(s.core.execute(USER(), req({ responseFormat: { type: "json" } })), "malformed_response");
    const r = await s.core.execute(USER(), req());
    assert.ok(r.warnings.some((w) => /coupée/.test(w)));
  });
});

describe("Fournisseurs en défaut", () => {
  const one = async (err, code, { count = 1 } = {}) => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [err]), beta: fakeAdapter("beta") } }); enableAll(s);
    const e = await fail(s.core.execute(USER(), req()), code);
    assert.equal(s.adapters.alpha.calls.length, count);
    return { s, e };
  };
  test("fournisseur indisponible : erreur normalisée, pas de réessai, comptée (facturation possible)", async () => {
    const { s, e } = await one(T("provider_unavailable", "500"), "provider_unavailable");
    assert.equal(e.possiblyBilled, true);
    assert.equal(s.db.prepare("SELECT counted FROM mk_ai_core_usage").get().counted, 1);
  });
  test("clé invalide : auth_invalid, rien n'est compté, pas de réessai", async () => {
    const { s } = await one(T("auth_invalid", "401"), "auth_invalid");
    const row = s.db.prepare("SELECT counted, cost_micro_usd, reserved_micro_usd FROM mk_ai_core_usage").get();
    assert.deepEqual({ ...row }, { counted: 0, cost_micro_usd: 0, reserved_micro_usd: 0 });
  });
  test("quota ou crédit du fournisseur épuisé : provider_quota", () => one(T("provider_quota", "402"), "provider_quota"));
  test("modèle indisponible chez le fournisseur : model_unavailable", () => one(T("model_unavailable", "404"), "model_unavailable"));
  test("fournisseur sans clé pour ce site : provider_not_configured, aucune ligne comptée", async () => {
    const a = { alpha: fakeAdapter("alpha"), nocreds: fakeAdapter("nocreds"), beta: fakeAdapter("beta") };
    const s = setup({ adapters: a, models: [{ provider: "nocreds", id: "n1" }] });
    s.core.config.updateGlobal(ADMIN(), { enabled: true, allowedProviders: ["nocreds"], enabledModels: ["nocreds:n1"], defaultModel: "nocreds:n1" });
    s.core.config.updateSite(ADMIN(), 1, { enabled: true });
    await fail(s.core.execute(USER(), req()), "provider_not_configured");
    assert.equal(s.db.prepare("SELECT SUM(counted) n FROM mk_ai_core_usage").get().n, 0);
  });
  test("le message d'erreur d'un fournisseur ne contient jamais la clé", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [Object.assign(new Error(`Incorrect API key provided: ${KEY}`), { code: "auth_invalid" })]), beta: fakeAdapter("beta") } }); enableAll(s);
    const e = await fail(s.core.execute(USER(), req()), "auth_invalid");
    assert.doesNotMatch(JSON.stringify({ m: e.message, e: e.toJSON() }), /FAKEKEY/);
    assert.doesNotMatch(s.lines.join("\n"), /FAKEKEY/);
  });
});

describe("Coûts et quotas", () => {
  test("jetons absents de la réponse : estimés par Kolakisa et signalés comme tels", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [{ content: "Bonjour tout le monde", usage: null }]), beta: fakeAdapter("beta") } }); enableAll(s);
    const r = await s.core.execute(USER(), req());
    assert.equal(r.usage.inputTokens.source, "estimated"); assert.equal(r.usage.outputTokens.source, "estimated");
    assert.ok(r.warnings.some((w) => /estimées/.test(w)));
    assert.equal(s.db.prepare("SELECT tokens_source FROM mk_ai_core_usage").get().tokens_source, "estimated");
  });
  test("tarif inconnu : coût « unknown » (jamais inventé) ; tarif périmé : estimation signalée ; jamais « confirmed »", async () => {
    const s = setup(); enableAll(s);
    s.registry.register({ provider: "alpha", id: "a-small" }); // sans tarif
    const r = await s.core.execute(USER(), req());
    assert.equal(r.cost.microUsd, null); assert.equal(r.cost.kind, "unknown"); assert.ok(r.warnings.some((w) => /inconnu/.test(w)));
    s.core.admin.setPricing(ADMIN(), "alpha:a-small", { inputPerMillionUsd: 1, outputPerMillionUsd: 2, source: "test" });
    s.clock.t += 100 * 86400000;
    const r2 = await s.core.execute(USER(), req());
    assert.equal(r2.cost.kind, "estimated"); assert.equal(r2.cost.priceStatus, "stale"); assert.ok(r2.warnings.some((w) => /périmé/.test(w)));
    assert.equal(s.db.prepare("SELECT COUNT(*) n FROM mk_ai_core_usage WHERE cost_kind = 'confirmed'").get().n, 0);
  });
  const quotaCase = (name, quota, ask2 = {}) => test(name, async () => {
    const s = setup(); enableAll(s);
    s.core.admin.setQuota(ADMIN(), quota);
    const u = USER();
    assert.ok(await s.core.execute(u, req(ask2)));
    const e = await fail(s.core.execute(u, req(ask2)), "quota_exceeded");
    assert.equal(e.quota.scope, quota.scope);
    assert.equal(s.adapters.alpha.calls.length, 1, "le fournisseur n'est PAS appelé au-delà du quota");
    assert.match(e.message, /Rien n'a été envoyé/);
  });
  quotaCase("quota par utilisateur", { scope: "user", scopeId: "2", period: "day", maxRequests: 1 });
  quotaCase("quota par site", { scope: "site", scopeId: "1", period: "day", maxRequests: 1 });
  quotaCase("quota de l'organisation", { scope: "organization", period: "month", maxRequests: 1 });
  quotaCase("quota par module", { scope: "module", scopeId: "tests", period: "day", maxRequests: 1 });
  quotaCase("quota global de la plateforme", { scope: "global", period: "day", maxRequests: 1 });
  test("le quota d'un site ne bloque pas un autre site ; le quota global compte les organisations ensemble", async () => {
    const s = setup(); enableAll(s);
    s.core.admin.setQuota(ADMIN(), { scope: "site", scopeId: "1", period: "day", maxRequests: 1 });
    await s.core.execute(USER(), req());
    await fail(s.core.execute(USER(), req()), "quota_exceeded");
    assert.ok(await s.core.execute(USER(), req({ siteId: 2 })), "site 2 non touché");
    s.core.admin.setQuota(ADMIN(), { scope: "global", period: "day", maxRequests: 3 });
    s.db.prepare("INSERT INTO mk_ai_core_usage (request_id, organization_id, module, provider, model, status, created_at) VALUES ('x', 2, 'm', 'alpha', 'a', 'succeeded', ?)").run(s.now());
    await fail(s.core.execute(USER(), req({ siteId: 2 })), "quota_exceeded"); // 2 en org 1 + 1 en org 2
  });
  test("quota de coût : appliqué sur le coût estimé ; refusé si le tarif n'est pas vérifié", async () => {
    const s = setup(); enableAll(s);
    s.core.admin.setQuota(ADMIN(), { scope: "organization", period: "day", maxCostMicroUsd: 3000 });
    // réservation d'une requête : (≈4 jetons entrée + 1024 sortie) → quelques milliers de micro-USD au plus
    const big = req({ maxOutputTokens: 5000 }); // 5000×2 = 10 000 µUSD > 3000
    const e = await fail(s.core.execute(USER(), big), "quota_exceeded"); assert.equal(e.quota.kind, "cost");
    assert.ok(await s.core.execute(USER(), req({ maxOutputTokens: 100 })));
    s.registry.register({ provider: "alpha", id: "a-small" }); // tarif perdu
    await fail(s.core.execute(USER(), req({ maxOutputTokens: 100 })), "cost_unverified");
    assert.equal(s.adapters.alpha.calls.length, 1);
  });
  test("la fenêtre « jour » repart à minuit UTC", async () => {
    const s = setup({ clock: { t: Date.UTC(2026, 9, 30, 23, 0, 0) } }); enableAll(s);
    s.core.admin.setQuota(ADMIN(), { scope: "user", scopeId: "2", period: "day", maxRequests: 1 });
    await s.core.execute(USER(), req());
    await fail(s.core.execute(USER(), req()), "quota_exceeded");
    s.clock.t += 2 * 3600000;
    assert.ok(await s.core.execute(USER(), req()));
  });
  test("un échec sans coût (clé refusée) ne consomme pas le quota ; un échec possiblement facturé, si", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T("auth_invalid", "x"), T("timeout", "x"), { content: "ok" }]), beta: fakeAdapter("beta") } }); enableAll(s);
    s.core.admin.setQuota(ADMIN(), { scope: "user", scopeId: "2", period: "day", maxRequests: 2 });
    const u = USER();
    await fail(s.core.execute(u, req()), "auth_invalid");
    await fail(s.core.execute(u, req()), "timeout");
    assert.ok(await s.core.execute(u, req()), "2e requête comptée seulement : la 1re n'a rien coûté");
    await fail(s.core.execute(u, req()), "quota_exceeded");
  });
  test("synthèse de consommation : par fournisseur, modèle, module, site ; coûts « confirmés » à zéro", async () => {
    const s = setup(); enableAll(s);
    await s.core.execute(USER(), req()); await s.core.execute(USER(), req({ siteId: 2, model: "beta:b-mid", routing: { strategy: "explicit" } }));
    const m = s.core.admin.metrics(ADMIN());
    assert.equal(m.requests, 2); assert.equal(m.succeeded, 2); assert.equal(m.confirmedCostMicroUsd, 0); assert.ok(m.estimatedCostMicroUsd > 0);
    assert.deepEqual(m.byProvider.map((x) => x.k).sort(), ["alpha", "beta"]);
    assert.equal(m.bySite.length, 2); assert.match(m.costNote, /Aucun coût confirmé/);
    assert.equal(s.core.forSite.usage(USER(["ai.site_admin"]), 1).requests, 1, "un site ne voit que le sien");
  });
});

describe("Sécurité et permissions", () => {
  test("par défaut tout est désactivé ; l'IA ne s'ouvre que par l'administration centrale", async () => {
    const s = setup();
    await fail(s.core.execute(USER(), req()), "ai_disabled");
    enableAll(s);
    s.core.config.updateSite(ADMIN(), 2, { enabled: false });
    await fail(s.core.execute(USER(), req({ siteId: 2 })), "ai_disabled");
    assert.ok(await s.core.execute(USER(), req()));
  });
  test("sans la permission ai.use : refus ; contexte absent ou forgé : refus", async () => {
    const s = setup(); enableAll(s);
    await fail(s.core.execute(USER([]), req()), "not_authorized");
    await fail(s.core.execute(null, req()), "not_authorized");
    await fail(s.core.execute({ organizationId: 1, can: "oui" }, req()), "not_authorized");
    assert.equal(s.adapters.alpha.calls.length, 0);
  });
  test("isolation des sites : accès limité à un site, site d'une autre organisation, site inexistant", async () => {
    const s = setup(); enableAll(s);
    const limited = USER(["ai.use"], { siteScope: 1 });
    assert.ok(await s.core.execute(limited, req({ siteId: 1 })));
    await fail(s.core.execute(limited, req({ siteId: 2 })), "not_authorized");
    await fail(s.core.execute(limited, req({ siteId: null })), "not_authorized");
    await fail(s.core.execute(USER(), req({ siteId: 3 })), "not_authorized"); // site de l'organisation B
    await fail(s.core.execute(USER(), req({ siteId: 999 })), "not_authorized");
    await fail(s.core.execute(USER(), req({ siteId: "1 OR 1=1" })), "not_authorized");
  });
  test("isolation des clés : un fournisseur configuré pour un autre site n'est pas utilisable ici (la portée est transmise au résolveur)", async () => {
    const seen = [];
    const s = setup(); enableAll(s);
    const orig = s.providers.call.bind(s.providers);
    s.providers.call = (ctx, scope, ...rest) => { seen.push({ org: ctx.organizationId, site: scope.siteId }); return orig(ctx, scope, ...rest); };
    await s.core.execute(USER(), req({ siteId: 1 })); await s.core.execute(USER(), req({ siteId: 2 }));
    assert.deepEqual(seen, [{ org: 1, site: 1 }, { org: 1, site: 2 }]);
  });
  test("administration : un administrateur de site ne peut modifier ni la configuration globale, ni les quotas, ni les modèles", () => {
    const s = setup(); enableAll(s);
    const siteAdmin = USER(["ai.use", "ai.site_admin"]);
    const limitedAdmin = USER(["ai.admin"], { siteScope: 1 });
    for (const who of [siteAdmin, limitedAdmin, USER()]) {
      assert.throws(() => s.core.config.updateGlobal(who, { enabled: false }), (e) => e.code === "not_authorized");
      assert.throws(() => s.core.admin.setQuota(who, { scope: "organization", period: "day", maxRequests: 10 }), (e) => e.code === "not_authorized");
      assert.throws(() => s.core.admin.setPricing(who, "alpha:a-small", { inputPerMillionUsd: 0, outputPerMillionUsd: 0, source: "x" }), (e) => e.code === "not_authorized");
      assert.throws(() => s.core.admin.metrics(who), (e) => e.code === "not_authorized");
    }
    assert.equal(s.core.config.effective(1, null).enabled, true);
  });
  test("administrateur de site : réglages de SON site seulement, dans les limites du niveau central", () => {
    const s = setup(); enableAll(s);
    const sa = USER(["ai.site_admin"], { siteScope: 1 });
    assert.deepEqual(s.core.forSite.update(sa, 1, { allowedModels: ["alpha:a-small"] }).allowedModels, ["alpha:a-small"]);
    assert.throws(() => s.core.forSite.update(sa, 2, { enabled: false }), (e) => e.code === "not_authorized");
    assert.throws(() => s.core.forSite.update(USER(["ai.site_admin"]), 3, { enabled: true }), (e) => e.code === "not_authorized", "site d'une autre organisation");
    s.core.config.updateGlobal(ADMIN(), { enabledModels: ["alpha:a-small"] });
    assert.throws(() => s.core.forSite.update(sa, 1, { allowedModels: ["beta:b-mid"] }), (e) => e.code === "invalid_request", "pas de modèle hors liste centrale");
    assert.throws(() => s.core.forSite.update(sa, 1, { preferences: { "bad key": 1 } }), (e) => e.code === "invalid_request");
    assert.deepEqual(s.core.config.effective(1, 1).models, ["alpha:a-small"]);
  });
  test("aucun contenu ni secret dans le journal technique ni dans la base d'utilisation", async () => {
    const s = setup(); enableAll(s);
    await s.core.execute(USER(), req({ messages: [{ role: "user", content: "PHRASE-CONFIDENTIELLE-XYZ" }] }));
    assert.doesNotMatch(s.lines.join("\n"), /CONFIDENTIELLE|FAKEKEY/);
    const dump = JSON.stringify(s.db.prepare("SELECT * FROM mk_ai_core_usage").all());
    assert.doesNotMatch(dump, /CONFIDENTIELLE|Bonjour|FAKEKEY/);
    assert.match(s.lines[0], /^\[KOLAKISA-AI\] \{/);
    assert.ok(s.lines.every((l) => /"requestId":"[0-9a-f-]{36}"/.test(l)), "identifiant de corrélation partout");
  });
  test("la réponse d'un fournisseur reste une donnée : caractères nuls retirés, taille bornée, jamais exécutée", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [{ content: `<script>alert(1)</script>\u0000${"x".repeat(500000)}` }]), beta: fakeAdapter("beta") } }); enableAll(s);
    const r = await s.core.execute(USER(), req());
    assert.equal(r.trusted, false); assert.ok(!r.content.includes("\u0000")); assert.ok(r.content.length <= 400000);
    assert.match(r.content, /^<script>/, "le contenu est rendu tel quel : c'est à l'appelant de l'échapper ou de l'assainir");
  });
});

describe("Résilience", () => {
  test("limite de débit : un réessai contrôlé (avec attente), puis succès", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T("rate_limited", "429"), { content: "ok" }]), beta: fakeAdapter("beta") } }); enableAll(s);
    const r = await s.core.execute(USER(), req());
    assert.equal(r.content, "ok"); assert.equal(r.routing.attempts[0].attempts, 2);
    assert.deepEqual(s.sleeps, [500]);
    assert.equal(s.db.prepare("SELECT COUNT(*) n FROM mk_ai_core_usage").get().n, 1, "une seule ligne : le réessai n'est pas une seconde requête");
  });
  test("délai dépassé et coupure réseau : AUCUN réessai ni secours (la requête a pu être facturée)", async () => {
    for (const code of ["timeout", "network"]) {
      const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T(code, "x")]), beta: fakeAdapter("beta") } }); enableAll(s, { fallback: { enabled: true, chain: ["beta:b-mid"] } });
      const e = await fail(s.core.execute(USER(), req({ routing: { allowFallback: true, maxFallbackCostMicroUsd: 1e9 } })), code);
      assert.equal(e.possiblyBilled, true);
      assert.equal(s.adapters.alpha.calls.length, 1); assert.equal(s.adapters.beta.calls.length, 0); assert.deepEqual(s.sleeps, []);
    }
  });
  test("prévention des doublons : même clé d'idempotence → fournisseur appelé une seule fois", async () => {
    const s = setup(); enableAll(s);
    const q = req({ idempotencyKey: "demande-unique-0001" });
    const first = await s.core.execute(USER(), q);
    const e = await fail(s.core.execute(USER(), q), "duplicate_request");
    assert.equal(e.originalRequestId, first.requestId);
    assert.equal(s.adapters.alpha.calls.length, 1);
    assert.ok(await s.core.execute(USER(), req({ idempotencyKey: "demande-unique-0002" })), "autre clé : autre requête");
  });
  test("doublon simultané : la seconde requête est refusée pendant que la première est en cours", async () => {
    let release;
    const slow = fakeAdapter("alpha"); const orig = slow.complete.bind(slow);
    slow.complete = async (a) => { await new Promise((r) => { release = r; }); return orig(a); };
    const s = setup({ adapters: { alpha: slow, beta: fakeAdapter("beta") } }); enableAll(s);
    const q = req({ idempotencyKey: "demande-simultanee-1" });
    const p1 = s.core.execute(USER(), q);
    await new Promise((r) => setImmediate(r));
    await fail(s.core.execute(USER(), q), "duplicate_request");
    release(); assert.ok(await p1);
    assert.equal(slow.calls.length, 1);
  });
  test("une requête échouée sans coût peut être rejouée avec la même clé ; une échouée possiblement facturée, non", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T("auth_invalid", "x"), { content: "ok" }, T("timeout", "x")]), beta: fakeAdapter("beta") } }); enableAll(s);
    const a = req({ idempotencyKey: "cle-rejouable-001" });
    await fail(s.core.execute(USER(), a), "auth_invalid");
    assert.ok(await s.core.execute(USER(), a), "rejouée : la 1re n'avait rien coûté");
    const b = req({ idempotencyKey: "cle-facturee-0001" });
    await fail(s.core.execute(USER(), b), "timeout");
    await fail(s.core.execute(USER(), b), "duplicate_request");
  });
  const fb = { fallback: { enabled: true, chain: ["beta:b-mid"], costFactor: 3 } };
  test("basculement autorisé : après saturation répétée, secours compatible, transparent dans la réponse", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T("provider_overloaded", "503")]), beta: fakeAdapter("beta", [{ content: "secours" }]) } }); enableAll(s, fb);
    const r = await s.core.execute(USER(), req({ routing: { allowFallback: true } }));
    assert.equal(r.content, "secours"); assert.equal(r.provider, "beta"); assert.equal(r.routing.fallbackUsed, true);
    assert.deepEqual(r.routing.attempts.map((a) => a.outcome), ["failed", "succeeded"]);
    assert.equal(s.db.prepare("SELECT COUNT(DISTINCT request_id) n FROM mk_ai_core_usage").get().n, 1, "même identifiant de corrélation");
    assert.equal(s.core.admin.trace(ADMIN(), r.requestId).length, 2);
  });
  test("pas de basculement : refusé par la requête, par la configuration, ou fournisseur non autorisé", async () => {
    const mk = () => setup({ adapters: { alpha: fakeAdapter("alpha", [T("provider_overloaded", "503")]), beta: fakeAdapter("beta") } });
    let s = mk(); enableAll(s, fb);
    await fail(s.core.execute(USER(), req()), "provider_overloaded"); assert.equal(s.adapters.beta.calls.length, 0);
    s = mk(); enableAll(s, { fallback: { enabled: false, chain: ["beta:b-mid"] } });
    await fail(s.core.execute(USER(), req({ routing: { allowFallback: true } })), "provider_overloaded"); assert.equal(s.adapters.beta.calls.length, 0);
    s = mk(); enableAll(s, { ...fb, allowedProviders: ["alpha"] });
    await fail(s.core.execute(USER(), req({ routing: { allowFallback: true } })), "provider_overloaded"); assert.equal(s.adapters.beta.calls.length, 0, "données jamais envoyées à un fournisseur non autorisé");
  });
  test("pas de basculement vers un modèle plus cher que le plafond, ou au tarif non vérifié", async () => {
    const mk = () => setup({ adapters: { alpha: fakeAdapter("alpha", [T("provider_overloaded", "503")]), beta: fakeAdapter("beta") } });
    let s = mk(); enableAll(s, { fallback: { enabled: true, chain: ["beta:b-mid"], costFactor: 1 } }); // b-mid (2/4) coûte plus que a-small (1/2)
    const e = await fail(s.core.execute(USER(), req({ routing: { allowFallback: true } })), "provider_overloaded");
    assert.match(JSON.stringify(e.routing.skipped), /plus cher/); assert.equal(s.adapters.beta.calls.length, 0);
    s = mk(); enableAll(s, fb); s.registry.register({ provider: "beta", id: "b-mid", capabilities: ["text", "structured_output"] });
    const e2 = await fail(s.core.execute(USER(), req({ routing: { allowFallback: true } })), "provider_overloaded");
    assert.match(JSON.stringify(e2.routing.skipped), /non vérifié/);
  });
  test("le basculement ne contourne pas les quotas", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T("provider_overloaded", "503")]), beta: fakeAdapter("beta") } }); enableAll(s, fb);
    s.core.admin.setQuota(ADMIN(), { scope: "user", scopeId: "2", period: "day", maxRequests: 1 });
    // 1er essai (non compté car échec sans coût) puis secours admis ; la requête suivante est ensuite bloquée
    assert.ok(await s.core.execute(USER(), req({ routing: { allowFallback: true } })));
    await fail(s.core.execute(USER(), req({ routing: { allowFallback: true } })), "quota_exceeded");
  });
  test("disjoncteur : 5 échecs d'indisponibilité de suite → pause, puis nouvel essai après le délai", async () => {
    const s = setup({ adapters: { alpha: fakeAdapter("alpha", [T("provider_unavailable", "x")]), beta: fakeAdapter("beta") } }); enableAll(s);
    for (let i = 0; i < 5; i += 1) await fail(s.core.execute(USER(), req()), "provider_unavailable");
    assert.equal(s.providers.circuit("alpha"), "open");
    await fail(s.core.execute(USER(), req()), "circuit_open");
    assert.equal(s.adapters.alpha.calls.length, 5, "plus aucun appel pendant la pause");
    s.clock.t += 31000;
    assert.equal(s.providers.circuit("alpha"), "half-open");
  });
});
