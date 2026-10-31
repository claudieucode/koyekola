// Socle commun des assistants IA du site (blog, marketing) : client Claude via le SDK officiel d'Anthropic, demande à
// réponse JSON imposée par un schéma, traduction des erreurs en messages utiles. Sans clé ANTHROPIC_API_KEY, les
// assistants sont simplement indisponibles (aucune fausse réponse). Aucune donnée secrète n'est jamais renvoyée.
const Anthropic = require("@anthropic-ai/sdk");

const schemaBudget = require("./schemaBudget");

const AnthropicClient = Anthropic.default || Anthropic;
const MODEL = "claude-opus-5-5";

class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Raison donnée par Anthropic (texte de l'API, sans aucune donnée secrète), pour un message utile à l'administrateur
function apiMessage(error) {
  const body = error && error.error;
  return String((body && body.error && body.error.message) || (body && body.message) || "").replace(/sk-ant-[\w-]+/g, "[clé masquée]").slice(0, 300);
}
function translateError(error) {
  const msg = apiMessage(error);
  if (error instanceof AnthropicClient.AuthenticationError) return new AiError("auth", "La clé ANTHROPIC_API_KEY est refusée par Anthropic : vérifiez-la (ou recréez-la) sur console.anthropic.com, puis redémarrez le site.");
  if (error instanceof AnthropicClient.PermissionDeniedError) return new AiError("permission", `Votre compte Anthropic n'a pas accès à cette fonction${msg ? ` (« ${msg} »)` : ""}.`);
  if (error instanceof AnthropicClient.NotFoundError) return new AiError("model", `Le modèle ${MODEL} n'est pas disponible pour votre compte Anthropic${msg ? ` (« ${msg} »)` : ""}.`);
  if (error instanceof AnthropicClient.RateLimitError) return new AiError("rate", "Trop de demandes à l'IA pour le moment : réessayez dans une minute.");
  if (error instanceof AnthropicClient.APIConnectionError) return new AiError("network", "Impossible de joindre le service d'IA : réessayez dans un instant.");
  if (error instanceof AnthropicClient.BadRequestError) {
    if (/credit balance|billing|purchase credits/i.test(msg)) return new AiError("credit", "Crédit Anthropic insuffisant : ajoutez du crédit sur console.anthropic.com → Billing (Plans & Billing), puis réessayez. La clé, elle, fonctionne.");
    // Grammaire du schéma de sortie trop volumineuse : défaut de Kolakisa (pas de la clé, ni du texte saisi) — message dédié
    if (/compiled grammar is too large|schema.{0,40}too (large|complex)/i.test(msg)) return new AiError("schema_too_complex", "L'analyse n'a pas pu démarrer : le format de réponse demandé à l'IA est trop complexe pour Anthropic. Ce n'est pas lié à votre texte ni à votre clé. Rien n'a été modifié ; signalez ce message à l'équipe technique.");
    return new AiError("api", `Anthropic a refusé la demande (400)${msg ? ` : « ${msg} »` : ""}. Rien n'a été modifié.`);
  }
  if (error instanceof AnthropicClient.APIError) return new AiError("api", `Le service d'IA a renvoyé une erreur (${error.status || "?"})${msg ? ` : « ${msg} »` : ""}. Réessayez plus tard.`);
  return error;
}

let injectedClient = null;
// Tests : client factice (aucun appel réseau), partagé par tous les assistants
function setClientForTests(client) { injectedClient = client; }

const isConfigured = () => Boolean(injectedClient || process.env.ANTHROPIC_API_KEY);

// `apiKey` : clé fournie par le centre de connecteurs (Réglages → Connecteurs) pour le site concerné ; sinon, comportement historique : variable d'environnement ANTHROPIC_API_KEY
function clientOf(apiKey) {
  if (injectedClient) return injectedClient;
  if (apiKey) return new AnthropicClient({ apiKey, timeout: 120000, maxRetries: 2 });
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("not_configured", "L'assistant IA n'est pas activé : ajoutez la variable ANTHROPIC_API_KEY (clé de console.anthropic.com) dans la configuration du serveur.");
  return new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120000, maxRetries: 2 });
}

// Une demande, une réponse JSON conforme au schéma. Renvoie { data, model, usage }.
async function runJson({ system, prompt, schema, effort = "medium", maxTokens = 16000, tooLong = "La réponse de l'IA a été coupée : raccourcissez le texte fourni.", apiKey = null, label = "json" }) {
  // Aucun outil n'est transmis : seule la sortie structurée (schéma) est compilée par Anthropic. On mesure le schéma AVANT l'appel
  const metrics = schemaBudget.measure(schema);
  const over = schemaBudget.exceeded(metrics);
  if (over.length) {
    console.warn(`[ia] schéma « ${label} » refusé avant l'appel (trop complexe : ${over.join(", ")})`);
    const e = new AiError("schema_too_complex", "L'analyse n'a pas pu démarrer : le format de réponse demandé à l'IA est trop complexe. Rien n'a été envoyé ni modifié ; signalez ce message à l'équipe technique.");
    e.schema = metrics;
    throw e;
  }
  const client = clientOf(apiKey);
  const params = {
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    output_config: { effort, format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: prompt }],
  };
  let response;
  try {
    try {
      // Repli automatique : si un filtre refuse la demande, Anthropic la confie à un autre modèle adapté (option bêta)
      response = await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
    } catch (error) {
      // Option bêta refusée pour ce compte : même demande, sans l'option (le reste est identique)
      if (!(error instanceof AnthropicClient.BadRequestError) || !/fallback|beta/i.test(apiMessage(error))) throw error;
      response = await client.messages.create(params);
    }
  } catch (error) {
    const out = translateError(error);
    // Trace technique (aucun secret, aucun texte saisi) : de quoi retrouver le schéma en cause
    if (out instanceof AiError && out.code === "schema_too_complex") { out.schema = metrics; console.error(`[ia] Anthropic a refusé la grammaire du schéma « ${label} » : ${JSON.stringify(metrics)} ; outils transmis : 0`); }
    throw out;
  }
  if (response.stop_reason === "refusal") throw new AiError("refusal", "L'IA a refusé de traiter ce texte. Reformulez la demande ou rédigez ce passage vous-même.");
  if (response.stop_reason === "max_tokens") throw new AiError("too_long", tooLong);
  const block = (response.content || []).find((b) => b.type === "text");
  let data;
  try {
    data = JSON.parse(block ? block.text : "");
  } catch {
    throw new AiError("format", "Réponse de l'IA illisible : réessayez.");
  }
  return { data, model: response.model, usage: response.usage || null };
}

module.exports = { MODEL, AiError, AnthropicClient, runJson, translateError, setClientForTests, isConfigured, clientOf };
