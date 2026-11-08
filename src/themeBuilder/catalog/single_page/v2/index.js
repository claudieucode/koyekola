// Bibliothèque « Page individuelle » v2 : assemble les groupes (un fichier par groupe de 10 concepts). Chaque mise en page porte sa propre identité (skinDef) en valeurs fixes.
const FILES = ["g01", "g02", "g03", "g04", "g05", "g06", "g07", "g08", "g09", "g10"];
const layouts = FILES.flatMap((f) => require(`./${f}`));
const skins = layouts.map((l) => l.skinDef);
module.exports = { layouts, skins, count: layouts.length };
