// Chaque texte contient un verbe que l'analyseur de demandes de la régénération reconnaît (réécris, reformule, raccourcis, développe, simplifie, corrige, rends … commercial/professionnel) : testé pour les 14 actions.
// Content Optimization Assistant : les 14 actions de l'éditeur, traduites en DEMANDES pour le moteur de régénération existant (src/regen, programme 21.9).
// Ce module ne réécrit rien lui-même : regen.propose produit une proposition avant/après, l'utilisateur l'accepte ou la refuse, l'historique et la restauration sont ceux de 21.9.
// Rien n'est remplacé en silence. Les consignes interdisent d'ajouter des faits : elles s'ajoutent à la garde anti-invention du Content Generator.
// Formulation volontairement sobre : l'analyseur de demandes de la régénération 21.9 lit ces mots (un « avis » ou une « garantie » y désigne une section) ; la garde anti-invention reste appliquée par le code, pas par la consigne.
const NO_FACTS = "Ne rien ajouter qui ne soit déjà écrit dans le texte.";
const ACTIONS = Object.freeze({
  improve: { label: "Améliorer ce texte", text: `Améliore ce texte (clarté, précision, concision) sans changer son sens. ${NO_FACTS}` },
  professional: { label: "Rendre plus professionnel", text: `Rends ce texte plus professionnel, registre soutenu, sans changer le sens. ${NO_FACTS}` },
  simplify: { label: "Simplifier le vocabulaire", text: `Simplifie le vocabulaire et raccourcis les phrases, sans changer le sens. ${NO_FACTS}` },
  commercial: { label: "Rendre plus commercial", text: `Rends ce texte plus commercial : bénéfices pour le lecteur, sans exagération. ${NO_FACTS}` },
  grammar: { label: "Corriger la grammaire", text: "Corrige uniquement l'orthographe, la grammaire et la ponctuation. Ne reformule pas." },
  readability: { label: "Améliorer la lisibilité", text: `Améliore la lisibilité : phrases plus courtes, une idée par phrase. ${NO_FACTS}` },
  shorten: { label: "Réduire la longueur", text: `Raccourcis ce texte en gardant les informations essentielles. ${NO_FACTS}` },
  expand: { label: "Développer le contenu", text: `Développe ce texte en explicitant ce qui est déjà dit, sans ajouter de fait nouveau. Si une information manque, laisse « [à compléter] ». ${NO_FACTS}` },
  intent: { label: "Optimiser pour une intention de recherche", text: `Reformule ce texte pour mieux répondre à l'intention de recherche indiquée, sans bourrage de mots-clés. ${NO_FACTS}` },
  headings: { label: "Ajouter des sous-titres", text: `Reformule ce texte en ajoutant des intertitres Markdown (## Titre) devant chaque partie, sans changer le contenu. ${NO_FACTS}` },
  intro: { label: "Améliorer l'introduction", text: `Réécris l'introduction pour annoncer clairement le sujet et ce que le lecteur va trouver. ${NO_FACTS}` },
  rewrite: { label: "Réécrire sans changer le sens", text: `Réécris ce texte avec d'autres mots en conservant exactement le même sens. ${NO_FACTS}` },
  audience: { label: "Adapter à une autre cible", text: `Reformule ce texte pour la cible indiquée (niveau de langue, exemples), sans changer les faits. ${NO_FACTS}` },
  harmonize: { label: "Harmoniser le ton avec le site", text: `Reformule ce texte pour harmoniser son ton avec la voix du site (déjà enregistrée), sans changer le sens. ${NO_FACTS}` },
});
// extra : précision de l'utilisateur (cible, intention) — texte libre assaini, ajouté en fin de demande
function request(action, extra = "") {
  const a = ACTIONS[action];
  if (!a) return null;
  const e = String(extra || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  return { action, label: a.label, text: e ? `${a.text} Précision : ${e}` : a.text };
}
module.exports = { ACTIONS, request };
