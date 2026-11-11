// 100 recettes : 20 univers × 5 structures choisies pour leur différence mesurée (specs.js, généré par scripts/choisir-structures-recherche.js à partir de grammar.js).
const { UNIVERS } = require("./universes");
const { assemble, HEADS, BODIES, ASIDES, TAILS, POS } = require("./grammar");
const SPECS = require("./specs");
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const recipes = [];
const seen = new Set();
UNIVERS.forEach((u, ui) => SPECS[ui].forEach((s, si) => {
  const base = [cap(BODIES[s.body]), HEADS[s.head].toLowerCase()];
  const extra = [...(s.aside ? [ASIDES[s.aside]] : []), ...(s.set.length ? [`${s.set.map((x) => ({ count: "nombre", sort: "tri", cats: "catégories" }[x])).join(" + ")}`] : []), ...(s.tail ? [TAILS[s.tail]] : [])];
  let label = `${u.label} · ${base.join(", ")}`;
  for (const e of extra) { if (!seen.has(label)) break; label += `, ${e}`; }
  if (seen.has(label)) label = `${label} (${si + 1})`; seen.add(label);
  const key = `${u.key}-${si + 1}`;
  recipes.push({ key, universe: u, family: u.key, label, tags: [u.tag, BODIES[s.body], s.aside ? ASIDES[s.aside] : "sans colonne"], desc: `Page de résultats pour ${u.label.toLowerCase().replace("recherche ", "")} : ${BODIES[s.body]}, ${HEADS[s.head].toLowerCase()}${s.aside ? `, ${ASIDES[s.aside]}` : ""}. Résultats du moteur du site (terme, pagination${s.set.includes("sort") ? ", tri" : ""}${s.set.includes("cats") ? ", catégories" : ""}) et état « aucun résultat » propre au modèle.`, flags: s, build: (k) => assemble(k, u, s) });
}));
module.exports = { recipes, UNIVERS };
