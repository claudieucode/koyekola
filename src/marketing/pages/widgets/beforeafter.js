// Avant / Après : deux images superposées, un curseur (clavier, souris, doigt) révèle l'une ou l'autre.
// Sans script : les deux images s'affichent à 50 %. Avec script : le curseur (champ « range » natif) pilote la ligne de séparation.
module.exports = {
  type: "beforeafter", label: "Avant / Après", group: "general", icon: "image", version: 1, style: "box", status: "operational",
  description: "Deux images à comparer avec un curseur accessible au clavier et au doigt",
  keywords: "avant apres comparer comparaison image curseur slider before after transformation",
  schema: [
    { key: "before", kind: "image", label: "Image « Avant »" },
    { key: "beforeAlt", kind: "text", label: "Description de l'image « Avant »", max: 160, default: "Avant" },
    { key: "after", kind: "image", label: "Image « Après »" },
    { key: "afterAlt", kind: "text", label: "Description de l'image « Après »", max: 160, default: "Après" },
    { key: "beforeLabel", kind: "text", label: "Étiquette « Avant »", max: 20, default: "Avant" },
    { key: "afterLabel", kind: "text", label: "Étiquette « Après »", max: 20, default: "Après" },
    { key: "position", kind: "number", label: "Position de départ (%)", min: 0, max: 100, default: 50 },
    { key: "ratio", kind: "select", label: "Format", options: [["16 / 9", "16:9"], ["4 / 3", "4:3"], ["3 / 2", "3:2"], ["1 / 1", "Carré"]], default: "16 / 9" },
  ],
};
