// Bibliothèque de structures de catalogue par SECTEUR (Product Structure Planner). Ce sont des PROPOSITIONS de départ, modifiables, jamais des produits :
// aucune marque, aucun modèle, aucun prix. Un secteur inconnu reçoit la structure « general » (peu de catégories) plutôt qu'une structure inventée.
// Chaque catégorie : { name, children: [...], attributes: [{ name, values }] } ; les attributs ne servent qu'aux produits « variables » et sont des valeurs courantes, à ajuster.
const A = (name, values) => ({ name, values });
const SIZE_CLOTHES = A("Taille", ["XS", "S", "M", "L", "XL"]);
const COLOR = A("Couleur", ["Noir", "Blanc", "Bleu", "Rouge", "Vert"]);

const SECTORS = {
  informatique: {
    label: "Informatique et électronique", keywords: ["informatique", "ordinateur", "laptop", "pc ", "electronique", "smartphone", "telephone", "high-tech", "hightech", "clavier", "ecran", "imprimante", "tablette"],
    categories: [
      { name: "Ordinateurs", children: [{ name: "Ordinateurs portables" }, { name: "Ordinateurs de bureau" }], attributes: [A("Capacité de stockage", ["256 Go", "512 Go", "1 To"]), A("Mémoire", ["8 Go", "16 Go", "32 Go"])] },
      { name: "Écrans" }, { name: "Claviers et souris" }, { name: "Stockage", attributes: [A("Capacité", ["256 Go", "512 Go", "1 To", "2 To"])] }, { name: "Réseaux" }, { name: "Téléphones et tablettes" }, { name: "Accessoires" },
    ],
  },
  mode: {
    label: "Mode et vêtements", keywords: ["mode", "vetement", "habit", "pret-a-porter", "robe", "chemise", "pantalon", "chaussure", "sneakers", "textile", "wax", "pagne"],
    categories: [
      { name: "Femme", children: [{ name: "Robes" }, { name: "Hauts" }, { name: "Pantalons et jupes" }], attributes: [SIZE_CLOTHES, COLOR] },
      { name: "Homme", children: [{ name: "Chemises" }, { name: "Pantalons" }, { name: "Vestes" }], attributes: [SIZE_CLOTHES, COLOR] },
      { name: "Enfant", attributes: [A("Âge", ["2 ans", "4 ans", "6 ans", "8 ans", "10 ans"]), COLOR] },
      { name: "Chaussures", attributes: [A("Pointure", ["36", "37", "38", "39", "40", "41", "42", "43", "44"]), COLOR] }, { name: "Accessoires" },
    ],
  },
  beaute: {
    label: "Beauté et cosmétiques", keywords: ["beaute", "cosmetique", "maquillage", "soin", "parfum", "creme", "cheveux", "peau", "savon", "huile"],
    categories: [{ name: "Soins du visage" }, { name: "Soins du corps" }, { name: "Cheveux" }, { name: "Maquillage", attributes: [A("Teinte", ["Clair", "Moyen", "Foncé"])] }, { name: "Parfums" }, { name: "Coffrets" }],
  },
  maison: {
    label: "Maison, décoration et mobilier", keywords: ["maison", "decoration", "deco", "mobilier", "meuble", "canape", "lampe", "luminaire", "cuisine", "literie", "tapis"],
    categories: [{ name: "Salon", children: [{ name: "Canapés et fauteuils" }, { name: "Tables basses" }] }, { name: "Chambre" }, { name: "Cuisine et salle à manger" }, { name: "Décoration" }, { name: "Luminaires" }, { name: "Textiles de maison", attributes: [COLOR] }, { name: "Rangement" }],
  },
  alimentation: {
    label: "Alimentation et épicerie", keywords: ["alimentation", "epicerie", "nourriture", "boisson", "cafe", "the ", "chocolat", "bio ", "traiteur", "fruit", "legume", "miel", "epice"],
    categories: [{ name: "Épicerie salée" }, { name: "Épicerie sucrée" }, { name: "Boissons" }, { name: "Produits frais" }, { name: "Coffrets cadeaux" }],
    notes: ["Alimentation : date limite, allergènes, conservation et réglementation locale ne sont pas gérés par le moteur de boutique : à indiquer dans la description."],
  },
  numerique: {
    label: "Produits numériques", keywords: ["numerique", "ebook", "e-book", "formation en ligne", "logiciel", "template", "modele numerique", "telechargeable", "licence", "application"],
    categories: [{ name: "Guides et livres numériques" }, { name: "Modèles et gabarits" }, { name: "Logiciels et licences" }, { name: "Ressources graphiques" }],
    notes: ["Le moteur n'a PAS de livraison de fichier téléchargeable : un produit numérique est vendu et confirmé, le fichier doit être transmis par un autre moyen."],
    defaultType: "digital",
  },
  accessoires: {
    label: "Accessoires et bijoux", keywords: ["bijou", "accessoire", "montre", "sac", "ceinture", "lunettes", "collier", "bracelet", "maroquinerie"],
    categories: [{ name: "Bijoux", children: [{ name: "Colliers" }, { name: "Bracelets" }, { name: "Bagues" }] }, { name: "Sacs et maroquinerie", attributes: [COLOR] }, { name: "Montres" }, { name: "Lunettes" }, { name: "Autres accessoires" }],
  },
  sport: {
    label: "Sport et loisirs", keywords: ["sport", "fitness", "football", "running", "velo", "loisir", "camping", "randonnee", "musculation"],
    categories: [{ name: "Vêtements de sport", attributes: [SIZE_CLOTHES] }, { name: "Chaussures de sport", attributes: [A("Pointure", ["38", "39", "40", "41", "42", "43", "44"])] }, { name: "Équipement" }, { name: "Fitness et musculation" }, { name: "Plein air" }],
  },
  general: {
    label: "Boutique généraliste", keywords: [],
    categories: [{ name: "Nouveautés" }, { name: "Les plus vendus" }, { name: "Promotions" }],
    notes: ["Secteur non reconnu : structure minimale proposée, à adapter à votre catalogue réel."],
  },
};
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Secteur le mieux reconnu dans un texte : { key, score, evidence } ; sinon « general » (score 0)
function detectSector(text) {
  const t = ` ${norm(text)} `;
  let best = { key: "general", score: 0, evidence: "" };
  for (const [key, s] of Object.entries(SECTORS)) {
    const hits = s.keywords.filter((k) => t.includes(k));
    if (hits.length > best.score) best = { key, score: hits.length, evidence: hits[0].trim() };
  }
  return best;
}
module.exports = { SECTORS, detectSector, norm };
