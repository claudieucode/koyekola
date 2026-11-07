// Catalogue de démonstration « Dentelle » (24 produits : variantes, promotions, ruptures). Données de démonstration, jamais créées sur la boutique d'un client sans action explicite.
// Tailles de soutien-gorge au format français (tour de dessous de poitrine + bonnet) ; tailles de bas au format français (34 à 42).
const B = { Taille: ["80B", "85B", "85C", "90C"] };
const D = { Taille: ["85C", "90C", "90D", "95D"] };
const H = { Taille: ["34", "36", "38", "40"] };
const N = { Taille: ["S", "M", "L"] };
module.exports = {
  categories: ["Soutiens-gorge", "Culottes et strings", "Bodys et bustiers", "Nuit et déshabillés", "Bas et accessoires"],
  products: [
    ["Soutien-gorge triangle Chair", 0, 78, 0, { ...B, Coloris: ["Chair", "Noir"] }, "partiel", ["dentelle", "sans-armature"], "Triangle en dentelle souple, sans armature."],
    ["Soutien-gorge balconnet Nuit", 0, 92, 0, { ...D, Coloris: ["Noir", "Rose poudré"] }, "ok", ["dentelle", "armatures"], "Balconnet à armatures, bretelles réglables."],
    ["Soutien-gorge corbeille Ivoire", 0, 88, 0, { ...D }, "ok", ["dentelle", "armatures"], "Corbeille galbante, dos en dentelle."],
    ["Bralette Rose poudré", 0, 65, 52, { ...N, Coloris: ["Rose poudré", "Chair"] }, "ok", ["dentelle", "sans-armature", "fin-de-serie"], "Bralette légère en dentelle élastique."],
    ["Soutien-gorge plongeant Noir", 0, 96, 0, { ...D }, "rupture", ["dentelle", "armatures"], "Décolleté plongeant, bretelles amovibles."],
    ["Soutien-gorge soie Chair", 0, 125, 0, { ...B }, "ok", ["soie", "armatures"], "Coques doublées de soie, finitions invisibles."],
    ["Culotte taille haute Noir", 1, 42, 0, { ...H, Coloris: ["Noir", "Chair"] }, "ok", ["dentelle"], "Taille haute, entrejambe en coton."],
    ["String dentelle Chair", 1, 28, 0, { ...H, Coloris: ["Chair", "Rose poudré", "Noir"] }, "ok", ["dentelle"], "Dentelle élastique, bords sans couture."],
    ["Shorty Ivoire", 1, 38, 0, { ...H }, "partiel", ["dentelle"], "Shorty ajouré, ceinture souple."],
    ["Culotte soie Nuit", 1, 58, 0, { ...H }, "ok", ["soie"], "Soie lavée, coupe classique."],
    ["Tanga brodé Rose poudré", 1, 32, 26, { ...H }, "ok", ["dentelle", "fin-de-serie"], "Broderie sur le devant."],
    ["Culotte coton Chair", 1, 24, 0, { ...H }, "libre", ["coton"], "Coton biologique, usage quotidien."],
    ["Body dentelle Noir", 2, 115, 0, { ...N, Coloris: ["Noir", "Chair"] }, "ok", ["dentelle"], "Body à dos ouvert, fermeture à pressions."],
    ["Bustier Ivoire", 2, 148, 0, { Taille: ["80B", "85B", "85C"] }, "ok", ["dentelle", "armatures"], "Bustier avec baleines, lacet dans le dos."],
    ["Body soie Nuit", 2, 165, 0, { ...N }, "rupture", ["soie"], "Décolleté en V, bretelles fines."],
    ["Guêpière noire", 2, 138, 110, { Taille: ["80B", "85B", "85C"] }, "ok", ["dentelle", "fin-de-serie"], "Guêpière avec jarretelles amovibles."],
    ["Nuisette dentelle Chair", 3, 98, 0, { ...N, Coloris: ["Chair", "Noir"] }, "ok", ["dentelle", "nuit"], "Nuisette courte, bretelles réglables."],
    ["Déshabillé long Nuit", 3, 185, 0, { ...N }, "ok", ["soie", "nuit"], "Déshabillé en soie, ceinture à nouer."],
    ["Kimono satin Rose poudré", 3, 120, 0, { ...N }, "partiel", ["satin", "nuit"], "Kimono léger, manches larges."],
    ["Pyjama soie Ivoire", 3, 235, 0, { ...N }, "ok", ["soie", "nuit"], "Chemise et pantalon en soie."],
    ["Bas autofixants Noir", 4, 26, 0, { ...N }, "ok", ["bas"], "Voile 15 deniers, bande en dentelle antidérapante."],
    ["Porte-jarretelles Noir", 4, 54, 0, { Taille: ["S", "M", "L"] }, "ok", ["dentelle", "bas"], "Quatre attaches, boucles métal."],
    ["Collants voile Chair", 4, 18, 0, { ...N, Coloris: ["Chair", "Noir"] }, "ok", ["bas"], "Voile 20 deniers, bout renforcé."],
    ["Pochette lingerie", 4, 14, 0, null, "libre", ["entretien"], "Pochette de lavage en filet."],
    ["Coffret Dentelle", 4, 189, 0, { Taille: ["85B", "85C", "90C"] }, "ok", ["dentelle", "coffret"], "Soutien-gorge et culotte assortis, boîte cadeau."],
  ],
};
