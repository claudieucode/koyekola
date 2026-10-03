// Assistant de rédaction du blog (IA Claude, via le SDK officiel d'Anthropic).
// Règle absolue : l'assistant PROPOSE, il ne modifie jamais un article. L'éditeur affiche la proposition, l'auteur l'accepte
// ou la refuse. Sans clé ANTHROPIC_API_KEY sur le serveur, l'assistant est simplement indisponible (aucune fausse réponse).
const Anthropic = require("@anthropic-ai/sdk");

const AnthropicClient = Anthropic.default || Anthropic;
const MODEL = "claude-opus-5-5";
const MAX_INPUT = 20000; // caractères envoyés au plus (article ou sélection)

class AiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const SYSTEM = [
  "Tu es l'assistant de rédaction du blog de KOLAKISA, une plateforme francophone de formations en ligne (graphisme, vidéo, bureautique, marketing digital, développement web, intelligence artificielle).",
  "Tu écris en français clair, chaleureux et professionnel, pour des lecteurs débutants à intermédiaires.",
  "Tu n'inventes jamais de faits, de chiffres, d'études ou de citations : tu travailles uniquement à partir du texte fourni.",
  "Tu ne répètes pas artificiellement un mot-clé : le référencement passe par un texte utile et naturel.",
  "Tu réponds uniquement avec l'objet JSON demandé.",
].join(" ");

const text = { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false };
const proposals = { type: "object", properties: { proposals: { type: "array", items: { type: "string" } } }, required: ["proposals"], additionalProperties: false };

// Chaque action : la consigne, le schéma de réponse attendu, et si elle porte sur une sélection ou sur l'article entier
const ACTIONS = {
  titre: { label: "Améliorer le titre", scope: "article", schema: proposals, prompt: (i) => `Propose 3 titres d'article (H1) plus clairs et plus engageants, de 45 à 70 caractères, fidèles au contenu${i.keyword ? `, qui contiennent naturellement l'expression « ${i.keyword} »` : ""}. Titre actuel : « ${i.title} ».` },
  reecrire: { label: "Réécrire", scope: "selection", schema: text, prompt: () => "Réécris ce passage pour qu'il soit plus fluide et plus convaincant, sans changer son sens ni ajouter d'information. Garde à peu près la même longueur. Paragraphes séparés par une ligne vide." },
  corriger: { label: "Corriger", scope: "selection", schema: { type: "object", properties: { text: { type: "string" }, changes: { type: "array", items: { type: "string" } } }, required: ["text", "changes"], additionalProperties: false }, prompt: () => "Corrige l'orthographe, la grammaire, la ponctuation et la typographie française (espaces avant : ; ! ?, guillemets « »). Ne change pas le style ni le sens. Dans « changes », liste brièvement chaque correction faite (vide s'il n'y en a aucune)." },
  resumer: { label: "Résumer", scope: "article", schema: text, prompt: () => "Rédige un résumé de l'article en 2 phrases (250 caractères au plus), qui donne envie de le lire. Il servira de chapeau sous le titre." },
  developper: { label: "Développer", scope: "selection", schema: text, prompt: () => "Développe ce passage : explique davantage, ajoute un exemple concret et pratique, sans inventer de chiffres. Paragraphes séparés par une ligne vide." },
  simplifier: { label: "Simplifier", scope: "selection", schema: text, prompt: () => "Simplifie ce passage pour un débutant : phrases courtes, mots simples, jargon expliqué. Garde toutes les informations. Paragraphes séparés par une ligne vide." },
  lisibilite: { label: "Améliorer la lisibilité", scope: "selection", schema: text, prompt: () => "Améliore la lisibilité de ce passage : coupe les phrases trop longues, ajoute des mots de liaison, varie les débuts de phrases. Ne change pas le sens. Paragraphes séparés par une ligne vide." },
  faq: { label: "Générer une FAQ", scope: "article", schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } }, required: ["question", "answer"], additionalProperties: false } } }, required: ["items"], additionalProperties: false }, prompt: () => "Rédige 4 à 6 questions fréquentes que se poserait un lecteur de cet article, avec des réponses courtes (2 à 3 phrases) tirées UNIQUEMENT du contenu de l'article." },
  meta: { label: "Générer une meta description", scope: "article", schema: proposals, prompt: (i) => `Propose 3 meta descriptions de 130 à 155 caractères (compte bien), qui résument l'article et donnent une raison de cliquer${i.keyword ? `, en intégrant naturellement « ${i.keyword} »` : ""}.` },
  mots_cles: { label: "Suggérer des mots-clés", scope: "article", schema: { type: "object", properties: { focus: { type: "string" }, secondary: { type: "array", items: { type: "string" } }, explanation: { type: "string" } }, required: ["focus", "secondary", "explanation"], additionalProperties: false }, prompt: () => "Suggère le mot-clé principal le plus pertinent (expression de 2 à 4 mots qu'un internaute francophone taperait dans Google) et 3 à 6 mots-clés secondaires proches. Explique ton choix en une phrase. Ce sont des suggestions : tu n'as pas accès aux volumes de recherche, ne prétends pas le contraire." },
  liens: { label: "Suggérer des liens internes", scope: "article", schema: { type: "object", properties: { links: { type: "array", items: { type: "object", properties: { anchor: { type: "string" }, url: { type: "string" }, reason: { type: "string" } }, required: ["anchor", "url", "reason"], additionalProperties: false } } }, required: ["links"], additionalProperties: false }, prompt: (i) => `Parmi les pages du site listées ci-dessous, choisis au plus 5 pages réellement utiles au lecteur de cet article. Pour chacune, donne une expression EXACTE déjà présente dans l'article qui pourrait servir de texte du lien (anchor), l'adresse (url, recopiée telle quelle depuis la liste) et la raison. N'invente aucune adresse.\n\nPages du site :\n${(i.candidates || []).map((c) => `- ${c.title} : ${c.url}`).join("\n")}` },
};

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
    return new AiError("api", `Anthropic a refusé la demande (400)${msg ? ` : « ${msg} »` : ""}. Votre article n'a pas été modifié.`);
  }
  if (error instanceof AnthropicClient.APIError) return new AiError("api", `Le service d'IA a renvoyé une erreur (${error.status || "?"})${msg ? ` : « ${msg} »` : ""}. Réessayez plus tard.`);
  return error;
}

let injectedClient = null;
// Tests : client factice (aucun appel réseau)
function setClientForTests(client) { injectedClient = client; }

const isConfigured = () => Boolean(injectedClient || process.env.ANTHROPIC_API_KEY);

function clientOf() {
  if (injectedClient) return injectedClient;
  if (!process.env.ANTHROPIC_API_KEY) throw new AiError("not_configured", "L'assistant IA n'est pas activé : ajoutez la variable ANTHROPIC_API_KEY (clé de console.anthropic.com) dans la configuration du serveur.");
  return new AnthropicClient({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 120000, maxRetries: 2 });
}

// input : { action, text (sélection), article (texte complet), title, keyword, candidates }
async function assist(input = {}) {
  const action = ACTIONS[input.action];
  if (!action) throw new AiError("invalid", "Action inconnue.");
  const source = String((action.scope === "selection" ? input.text || input.article : input.article) || "").trim().slice(0, MAX_INPUT);
  if (!source) throw new AiError("invalid", action.scope === "selection" ? "Sélectionnez d'abord le passage à traiter dans l'article." : "L'article est vide.");
  const client = clientOf();
  const params = {
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: { type: "json_schema", schema: action.schema } },
    system: SYSTEM,
    messages: [{ role: "user", content: `${action.prompt(input)}\n\nTitre de l'article : ${String(input.title || "(sans titre)").slice(0, 200)}\n\n<texte>\n${source}\n</texte>` }],
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
    throw translateError(error);
  }
  if (response.stop_reason === "refusal") throw new AiError("refusal", "L'IA a refusé de traiter ce texte. Reformulez la demande ou traitez ce passage vous-même.");
  if (response.stop_reason === "max_tokens") throw new AiError("too_long", "La réponse de l'IA a été coupée : sélectionnez un passage plus court.");
  const block = (response.content || []).find((b) => b.type === "text");
  let data;
  try {
    data = JSON.parse(block ? block.text : "");
  } catch {
    throw new AiError("format", "Réponse de l'IA illisible : réessayez.");
  }
  // Liens : seules les adresses réellement proposées au modèle sont gardées (aucune adresse inventée)
  if (input.action === "liens") {
    const allowed = new Set((input.candidates || []).map((c) => c.url));
    data.links = (data.links || []).filter((l) => allowed.has(l.url) && l.anchor && String(input.article || "").includes(l.anchor));
  }
  return { action: input.action, label: action.label, scope: action.scope, result: data, model: response.model };
}

module.exports = { assist, isConfigured, setClientForTests, ACTIONS, AiError, MODEL };
