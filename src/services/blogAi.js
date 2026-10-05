// Assistant de rédaction du blog (IA Claude, via le SDK officiel d'Anthropic).
// Règle absolue : l'assistant PROPOSE, il ne modifie jamais un article. L'éditeur affiche la proposition, l'auteur l'accepte
// ou la refuse. Sans clé ANTHROPIC_API_KEY sur le serveur, l'assistant est simplement indisponible (aucune fausse réponse).
const { runJson, AiError, setClientForTests, isConfigured, MODEL } = require("./aiCore");

const MAX_INPUT = 20000; // caractères envoyés au plus (article ou sélection)

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

// input : { action, text (sélection), article (texte complet), title, keyword, candidates }
async function assist(input = {}) {
  const action = ACTIONS[input.action];
  if (!action) throw new AiError("invalid", "Action inconnue.");
  const source = String((action.scope === "selection" ? input.text || input.article : input.article) || "").trim().slice(0, MAX_INPUT);
  if (!source) throw new AiError("invalid", action.scope === "selection" ? "Sélectionnez d'abord le passage à traiter dans l'article." : "L'article est vide.");
  const { data, model } = await runJson({
    system: SYSTEM, schema: action.schema, tooLong: "La réponse de l'IA a été coupée : sélectionnez un passage plus court.",
    prompt: `${action.prompt(input)}\n\nTitre de l'article : ${String(input.title || "(sans titre)").slice(0, 200)}\n\n<texte>\n${source}\n</texte>`,
  });
  // Liens : seules les adresses réellement proposées au modèle sont gardées (aucune adresse inventée)
  if (input.action === "liens") {
    const allowed = new Set((input.candidates || []).map((c) => c.url));
    data.links = (data.links || []).filter((l) => allowed.has(l.url) && l.anchor && String(input.article || "").includes(l.anchor));
  }
  return { action: input.action, label: action.label, scope: action.scope, result: data, model };
}

module.exports = { assist, isConfigured, setClientForTests, ACTIONS, AiError, MODEL };
