// Motion Studio, lot « t » : Liste ou grille animée (Stagger Container / Animated Grid / Animated List). Une liste d'éléments éditable (titre, texte, image, lien)
// présentée en liste ou en grille de 2 à 4 colonnes ; les éléments apparaissent en cascade (décalage, sens, 7 effets). Tout est écrit dans la page : lisible sans JavaScript.
// Exécution : public/js/motion-studio/cascade.js. Limite : les éléments sont ceux de ce composant (pas de widgets quelconques à l'intérieur).
module.exports = {
  type: "motioncascade", template: "motion-cascade", label: "Liste ou grille animée", group: "advanced", icon: "grid", version: 1, style: "box", status: "operational",
  description: "Une liste ou grille de cartes qui apparaissent en cascade, une à une",
  keywords: "cascade stagger liste grille animee animated grid list cartes apparition decalee conteneur enfants delai progressif avantages fonctionnalites",
  schema: [
    { key: "items", kind: "items", label: "Éléments", min: 1, max: 12,
      default: [
        { title: "Simple", text: "Un point d'entrée clair, sans jargon.", image: "", alt: "", link: "" },
        { title: "Rapide", text: "Des pages légères qui s'affichent vite.", image: "", alt: "", link: "" },
        { title: "Souple", text: "Tout se règle, rien n'est figé.", image: "", alt: "", link: "" },
      ],
      fields: [
        { key: "title", kind: "text", label: "Titre", max: 80, required: true, default: "Titre" },
        { key: "text", kind: "textarea", label: "Texte (facultatif)", max: 300, default: "" },
        { key: "image", kind: "image", label: "Image (facultative)" },
        { key: "alt", kind: "text", label: "Description de l'image", max: 120, default: "" },
        { key: "link", kind: "link", label: "Lien du titre (facultatif)" },
      ] },
    { key: "layout", kind: "select", label: "Disposition", options: [["grid", "Grille"], ["list", "Liste (une colonne)"]], default: "grid" },
    { key: "columns", kind: "select", label: "Colonnes de la grille (ordinateur)", options: [["2", "2 colonnes"], ["3", "3 colonnes"], ["4", "4 colonnes"]], default: "3" },
    { key: "look", kind: "select", label: "Aspect des éléments", options: [["card", "Cartes"], ["line", "Filet"], ["plain", "Sans cadre"]], default: "card" },
    { key: "titleTag", kind: "select", label: "Niveau des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Texte gras"]], default: "h3" },
  ],
  motion: {
    module: "cascade",
    presets: [["fade-up", "Fondu montant"], ["fade", "Fondu"], ["scale", "Zoom"], ["slide-left", "Glissement depuis la gauche"], ["slide-right", "Glissement depuis la droite"], ["blur", "Netteté progressive"], ["flip", "Bascule 3D"]],
    defaults: { preset: "fade-up", trigger: "viewport", duration: 600, delay: 0, easing: "smooth", stagger: 90 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
    params: [{ key: "from", kind: "select", label: "Sens de la cascade", options: [["start", "Du premier au dernier"], ["end", "Du dernier au premier"], ["center", "Du centre vers les bords"], ["random", "Au hasard"]], default: "start" }],
  },
};
