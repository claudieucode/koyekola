// Bibliothèque « Page individuelle » v2 : assemble les groupes (un fichier par groupe de 10 concepts). Chaque mise en page porte sa propre identité (skinDef) en valeurs fixes.
const FILES = ["g01"];
const layouts = FILES.flatMap((f) => require(`./${f}`));
const skins = layouts.map((l) => l.skinDef);
module.exports = { layouts, skins, count: layouts.length };
