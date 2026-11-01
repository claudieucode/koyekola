// Assistant IA des visiteurs (ElevenLabs Agents) : une seule source de configuration.
// L'identifiant de l'agent est PUBLIC (il figure dans le HTML de la page) ; la clé API ElevenLabs, elle, n'est jamais dans le projet
// (elle ne sert qu'à créer/mettre à jour l'agent : scripts/elevenlabs/create-agent.sh).
// ELEVENLABS_AGENT_ID : remplace l'agent par défaut ; valeur « off » ou vide = assistant désactivé.
const DEFAULT_AGENT_ID = "agent_5401m6b3yrpgf4qaj0f5e4yqqygc";
const SHAPE = /^agent_[a-z0-9]{10,60}$/i;

// Pages où l'assistant ne s'affiche jamais : espaces privés, connexion, panier et paiement (aucune saisie sensible à côté d'un micro)
const HIDDEN_PREFIXES = ["/formateur", "/mes-cours", "/panier", "/commande", "/paiement", "/apprendre", "/certificat", "/favoris", "/support", "/notifications", "/connexion", "/inscription", "/deconnexion", "/mon-compte", "/mot-de-passe", "/marketing", "/gestion", "/api"];

function agentId(env = process.env) {
  const raw = env.ELEVENLABS_AGENT_ID === undefined ? DEFAULT_AGENT_ID : String(env.ELEVENLABS_AGENT_ID).trim();
  return SHAPE.test(raw) ? raw : null;
}
// Identifiant à afficher pour cette requête, ou null : site principal seulement (jamais sur le domaine d'un site créé), jamais sur les pages privées
function idFor(req, env = process.env) {
  if (req.kwSite) return null;
  const p = String(req.path || "");
  if (HIDDEN_PREFIXES.some((h) => p === h || p.startsWith(h + "/"))) return null;
  return agentId(env);
}
// Script du widget : version FIGÉE + empreinte (SRI). Il n'est chargé qu'au clic du visiteur (voir public/js/agent-ia.js). Pour monter de version :
// télécharger https://unpkg.com/@elevenlabs/convai-widget-embed@<version>/dist/index.js, recalculer l'empreinte (openssl dgst -sha384 -binary | openssl base64 -A), tester, puis changer ces deux valeurs.
const WIDGET_SCRIPT = {
  src: "https://unpkg.com/@elevenlabs/convai-widget-embed@0.22.2/dist/index.js",
  integrity: "sha384-DpBWLghpAvk2oZk9MFxnwzOYbcZxNGynQfvc5qmeK4ceuiaSUMICU+QJIwJS2GEK",
};
module.exports = { WIDGET_SCRIPT, agentId, idFor, HIDDEN_PREFIXES, DEFAULT_AGENT_ID };
