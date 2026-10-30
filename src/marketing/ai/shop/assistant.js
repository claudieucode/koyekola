// Assistant contextuel de la boutique : À RÈGLES (sans IA). Il traduit quelques demandes françaises en PROPOSITIONS de modification des brouillons, que la personne accepte ou refuse.
// Il ne supprime jamais rien, n'invente jamais un prix, un stock, une caractéristique, un délai ou un taux : ces demandes reçoivent une réponse qui renvoie à la saisie par la personne.
const { norm } = require("./library");
const clean = (v, max = 80) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/^["«'\s:]+|["»'\s.!]+$/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const T = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const findCat = (st, text) => { const n = norm(text); return (st.categories || []).find((c) => n.includes(norm(c.name))) || null; };

function interpret(message, { structure, plan } = {}) {
  const raw = clean(message, 400), n = norm(raw);
  if (!n) return { kind: "info", text: "Écrivez ce que vous souhaitez faire, par exemple « Ajoute une catégorie Imprimantes »." };
  if (/\b(supprime|supprimer|efface|retire|retirer|enleve)\b/.test(n)) return { kind: "advice", text: "Je ne supprime jamais rien moi-même. Retirez un élément du plan ou de la structure avec son bouton (confirmation et annulation possibles) ; le catalogue déjà créé se gère dans l'administration de la boutique." };
  if (/\b(prix|tarif|stock|quantite|delai|taux|tva|taxe|garantie|certif|avis|note)\b/.test(n) && /\b(mets?|fixe|propose|invente|choisis|definis|ajoute)\b/.test(n)) return { kind: "advice", text: "Je n'invente jamais un prix, un stock, un délai, un taux de taxe, une garantie ou un avis : saisissez ces valeurs vous-même (étape Produits ou Configuration), je peux ensuite les vérifier." };
  if (/\b(couleur|police|style|design)\b/.test(n)) return { kind: "advice", text: "Les couleurs et polices se règlent à l'étape Design de la boutique.", redirect: "design" };
  if (/\b(image|photo)\b/.test(n)) return { kind: "advice", text: "Les images se choisissent à l'étape Images et médias (médiathèque du site).", redirect: "medias" };
  let m;
  if ((m = raw.match(/renomme\s+(?:la\s+)?cat[ée]gorie\s+[«"']?(.+?)[»"']?\s+en\s+[«"']?(.+?)[»"']?\s*$/i))) {
    const c = findCat(structure || {}, m[1]); if (!c) return { kind: "info", text: `Je ne trouve pas la catégorie « ${clean(m[1])} ».` };
    const name = T(clean(m[2])); return { kind: "proposal", text: `Je propose de renommer « ${c.name} » en « ${name} ».`, proposal: { operation: { op: "cat_rename_category", key: c.key, name }, summary: `Renommer la catégorie « ${c.name} » en « ${name} »` } };
  }
  if ((m = raw.match(/(?:ajoute|ajouter|cr[ée]e|creer)\s+(?:une?\s+)?(?:nouvelle\s+)?(?:sous-?)?cat[ée]gorie\s+(?:de\s+|d'|:)?\s*(.+?)(?:\s+(?:dans|sous)\s+(?:la\s+cat[ée]gorie\s+)?(.+))?$/i))) {
    const name = T(clean(m[1])); if (!name) return { kind: "info", text: "Quel nom pour la catégorie ?" };
    const parent = m[2] ? findCat(structure || {}, m[2]) : null; if (m[2] && !parent) return { kind: "info", text: `Je ne trouve pas la catégorie parente « ${clean(m[2])} ».` };
    return { kind: "proposal", text: `Je propose d'ajouter la catégorie « ${name} »${parent ? ` dans « ${parent.name} »` : ""}.`, proposal: { operation: { op: "cat_add_category", name, parent: parent ? parent.key : null }, summary: `Ajouter la catégorie « ${name} »${parent ? ` dans « ${parent.name} »` : ""}` } };
  }
  if ((m = raw.match(/(?:ajoute|ajouter|cr[ée]e|creer)\s+(?:une?\s+)?(?:nouvelle\s+)?page\s+(?:de\s+|d'|:)?\s*(.+)$/i))) {
    const name = T(clean(m[1])); return { kind: "proposal", text: `Je propose d'ajouter la page « ${name} ».`, proposal: { operation: { op: "plan_add_page", name }, summary: `Ajouter la page « ${name} »` } };
  }
  if ((m = raw.match(/(?:ajoute|ajouter|cr[ée]e|creer)\s+(?:un\s+)?(?:nouveau\s+)?produit\s*(?::|nomm[ée]\s+)?\s*(.+)$/i))) {
    const name = T(clean(m[1], 200)); return { kind: "proposal", text: `Je propose un brouillon de produit « ${name} » SANS prix, stock ni caractéristiques inventés : vous les renseignerez.`, proposal: { operation: { op: "add_product", product: { name } }, summary: `Ajouter le brouillon de produit « ${name} »` } };
  }
  if (/^(comment|pourquoi|quel|quelle|est-ce|que |puis-je|faut-il)|\?\s*$/.test(n)) return { kind: "advice", text: `Votre boutique : ${(plan && plan.pages ? plan.pages.length : 0)} page(s) prévue(s), ${(structure && structure.categories ? structure.categories.length : 0)} catégorie(s). Dites ce que vous voulez changer (par exemple « Ajoute une catégorie Imprimantes ») et je vous proposerai une modification.` };
  return { kind: "info", text: "Je n'ai pas compris. Je sais : ajouter une catégorie (« …dans Ordinateurs »), renommer une catégorie, ajouter une page, ajouter un brouillon de produit. Prix, stocks, taxes et délais se saisissent vous-même." };
}
module.exports = { interpret };
