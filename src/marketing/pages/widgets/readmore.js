// Lire la suite : un court texte toujours visible, la suite se déplie / se replie (élément HTML natif <details> : clavier, lecteurs d'écran, sans script).
module.exports = {
  type: "readmore", label: "Lire la suite", group: "basic", icon: "alignLeft", version: 1, style: "text", status: "operational",
  description: "Un texte court, la suite se déplie au clic",
  keywords: "lire la suite plus deplier replier extrait texte long voir plus read more",
  schema: [
    { key: "intro", kind: "textarea", label: "Texte toujours visible", max: 1000, required: true, default: "Un résumé qui donne envie de lire la suite." },
    { key: "more", kind: "textarea", label: "Suite (se déplie ; une ligne vide sépare les paragraphes)", max: 5000, required: true, default: "Ici, le reste du texte, visible seulement quand on clique sur « Lire la suite »." },
    { key: "openLabel", kind: "text", label: "Texte du lien pour déplier", max: 40, default: "Lire la suite" },
    { key: "closeLabel", kind: "text", label: "Texte du lien pour replier", max: 40, default: "Réduire" },
    { key: "open", kind: "bool", label: "Déplié au départ", default: false },
  ],
};
