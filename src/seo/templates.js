// Modèles de titres et de descriptions : « {title}{sep}{site_name} ». Seules les variables autorisées pour le champ sont
// acceptées à l'enregistrement ; au rendu, chaque variable est réellement remplacée (une variable sans valeur devient vide).
const VAR = /\{([a-z_]+)\}/g;

function variablesOf(template) {
  return [...String(template || "").matchAll(VAR)].map((m) => m[1]);
}

// Renvoie la liste des variables inconnues (vide = modèle valide)
function unknownVariables(template, allowed) {
  const ok = new Set(allowed);
  return [...new Set(variablesOf(template).filter((v) => !ok.has(v)))];
}

function render(template, vars = {}) {
  return String(template || "")
    .replace(VAR, (whole, name) => (Object.hasOwn(vars, name) && vars[name] !== null && vars[name] !== undefined ? String(vars[name]) : ""))
    .replace(/\s{2,}/g, " ")
    .trim();
}

module.exports = { render, variablesOf, unknownVariables };
