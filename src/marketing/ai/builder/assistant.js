// Assistant contextuel de l'interface de création. IMPORTANT — c'est un assistant À RÈGLES, sans intelligence artificielle : il reconnaît un petit nombre de demandes
// formulées en français et les traduit en PROPOSITIONS de modification du plan (opérations du Site Planner). Il n'écrit jamais lui-même : une proposition n'est appliquée
// que si la personne l'accepte, par le même chemin que ses propres modifications (plans.edit, protégé par la révision). Une question ou une demande de conseil reçoit
// une réponse, jamais une modification. Il ne propose JAMAIS de suppression (page, section, fonctionnalité) : supprimer reste un acte explicite de la personne.
// Les demandes qui relèvent d'une autre étape (couleurs, textes, images) sont orientées vers cette étape, sans rien modifier.
const registry = require("./registry");

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
const clean = (s, max = 80) => String(s ?? "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/^["«'\s:]+|["»'\s.!]+$/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const TITLE = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const PAGE_TYPES = [["a propos", "apropos"], ["contact", "contact"], ["faq", "faq"], ["questions", "faq"], ["tarif", "tarifs"], ["prix", "tarifs"], ["service", "services"], ["blog", "blog"], ["equipe", "equipe"], ["temoignage", "temoignages"], ["galerie", "galerie"], ["realisation", "portfolio"], ["portfolio", "portfolio"], ["devis", "devis"], ["mentions", "mentions"], ["partenaire", "partenaires"]];
const SECTION_WORDS = [["faq", "faq"], ["question", "faq"], ["service", "features"], ["atout", "features"], ["avantage", "features"], ["temoignage", "testimonials"], ["avis", "testimonials"], ["contact", "form"], ["formulaire", "form"], ["devis", "form"], ["appel a l'action", "cta"], ["bouton", "cta"], ["cta", "cta"], ["video", "video"], ["galerie", "image"], ["image", "image"], ["photo", "image"], ["texte", "text"], ["presentation", "text"], ["introduction", "text"], ["banniere", "hero"], ["bandeau", "hero"]];
const SECTION_PURPOSE = { faq: "Questions fréquentes", features: "Présenter les services", testimonials: "Témoignages de clients", form: "Formulaire de contact", cta: "Appel à l'action", video: "Vidéo de présentation", image: "Galerie d'images", text: "Texte de présentation", hero: "Bandeau d'accueil" };
const REDIRECT = [[/couleur|palette|police|typograph|bouton.*style|ombre|arrondi|theme/, "design", "Les couleurs, polices et styles se règlent à l'étape Design : choisissez une proposition ou demandez-en une nouvelle."], [/reecri|reformul|rediger|ton |texte de presentation|plus professionnel|plus chaleureux|raccourci|allonge/, "contenus", "Les textes se travaillent à l'étape Contenus (régénération d'un champ, ton éditorial, modification manuelle)."], [/image|photo|illustration|banniere.*(image|photo)|logo/, "medias", "Les images se gèrent à l'étape Images et médias (médiathèque du site). La génération d'images n'est pas encore disponible."], [/mobile|telephone|smartphone|tablette|responsive/, "apercu", "Vérifiez le rendu mobile et tablette à l'étape Prévisualisation ; la mise en page s'adapte automatiquement."], [/publi|mettre en ligne|mise en ligne/, "publication", "La publication se fait à l'étape Publication, une fois la liste de contrôle satisfaite."]];
const ADVICE = /^(comment|pourquoi|quel|quelle|quels|quelles|est-ce|est ce|que |qu'est|qu est|peux-tu m'expliquer|peux tu m'expliquer|a quoi|combien|puis-je|puis je|conseil|que penses|tu penses|vaut-il|faut-il)|\?\s*$/;
const IMPERATIVE = /\b(ajoute|ajouter|cree|creer|renomme|renommer|appelle|rajoute|insere|mets|met |change|modifie)\b/;

function guessType(name) { const n = norm(name); const hit = PAGE_TYPES.find(([k]) => n.includes(k)); return hit ? hit[1] : "autre"; }
function findPage(plan, text) {
  const n = norm(text);
  return (plan.pages || []).find((p) => n.includes(norm(p.name)) || n.includes(norm(p.key))) || null;
}

// → { kind: 'proposal' | 'advice' | 'info', text, proposal?: { op, summary, before, after }, redirect?: stepKey }
function interpret(message, { plan, pageKey } = {}) {
  const raw = clean(message, 600);
  const n = norm(raw);
  if (!n) return { kind: "info", text: "Écrivez ce que vous souhaitez faire, par exemple « Ajoute une page À propos »." };
  if (!plan) return { kind: "advice", text: "Le plan du site n'existe pas encore. Terminez d'abord l'étape Brief du projet : l'assistant pourra ensuite modifier le plan à votre demande." };
  const asksQuestion = ADVICE.test(n) && !IMPERATIVE.test(n);
  const current = (pageKey && (plan.pages || []).find((p) => p.key === pageKey)) || null;

  // Suppressions : jamais proposées
  if (/\b(supprime|supprimer|efface|effacer|retire|retirer|enleve|enlever)\b/.test(n)) {
    return { kind: "advice", text: "Je ne supprime jamais de page, de section ni de fonctionnalité moi-même : vous pouvez le faire vous-même à l'étape Plan du site, avec une confirmation. Je peux en revanche modifier ou ajouter des éléments." };
  }
  // Demandes d'une autre étape
  if (!asksQuestion || /\b(couleur|police|image|photo)\b/.test(n)) {
    for (const [re, step, text] of REDIRECT) if (re.test(n) && !/\bajoute\b.*\bpage\b/.test(n)) return { kind: "advice", text, redirect: step };
  }
  if (asksQuestion) {
    const pages = (plan.pages || []).map((p) => p.name).join(", ");
    return { kind: "advice", text: `Voici ce que contient votre plan : ${pages || "aucune page"}. Pour un conseil précis, dites-moi ce que vous voulez améliorer (par exemple « Ajoute une section FAQ à la page Contact »), et je vous proposerai une modification à accepter ou refuser.` };
  }
  let m;
  // Renommer le site
  if ((m = raw.match(/(?:renomme|appelle|nomme)\s+(?:le\s+)?site\s+(?:en\s+|:\s*)?(.+)$/i))) {
    const name = TITLE(clean(m[1], 80));
    if (!name) return { kind: "info", text: "Quel nom pour le site ? Par exemple « Renomme le site en BâtiPlus »." };
    return { kind: "proposal", text: `Je propose de renommer le site « ${name} ».`, proposal: { op: { op: "rename_site", name }, summary: `Renommer le site en « ${name} »`, before: (plan.site || {}).name || "", after: name } };
  }
  // Renommer une page
  if ((m = raw.match(/renomme\s+(?:la\s+page\s+)?[«"']?(.+?)[»"']?\s+en\s+[«"']?(.+?)[»"']?\s*$/i))) {
    const page = findPage(plan, m[1]);
    if (!page) return { kind: "info", text: `Je ne trouve pas la page « ${clean(m[1])} » dans le plan. Pages disponibles : ${(plan.pages || []).map((p) => p.name).join(", ")}.` };
    const name = TITLE(clean(m[2]));
    return { kind: "proposal", text: `Je propose de renommer la page « ${page.name} » en « ${name} ».`, proposal: { op: { op: "rename_page", key: page.key, name }, summary: `Renommer « ${page.name} » en « ${name} »`, before: page.name, after: name } };
  }
  // Ajouter une page
  if ((m = raw.match(/(?:ajoute|ajouter|cree|creer|rajoute)\s+(?:moi\s+)?(?:une?\s+)?(?:nouvelle\s+)?page\s*(?:de\s+|d'|:|nommee\s+|intitulee\s+)?\s*(.+)$/i))) {
    const name = TITLE(clean(m[1]));
    if (!name) return { kind: "info", text: "Quel nom pour cette page ? Par exemple « Ajoute une page À propos »." };
    if ((plan.pages || []).some((p) => norm(p.name) === norm(name))) return { kind: "info", text: `Une page « ${name} » existe déjà dans le plan.` };
    const pageType = guessType(name);
    return { kind: "proposal", text: `Je propose d'ajouter la page « ${name} » (type : ${pageType === "autre" ? "autre" : pageType}). Elle sera vide : ajoutez-lui ensuite des sections.`, proposal: { op: { op: "add_page", name, pageType, purpose: `Page ${name}` }, summary: `Ajouter la page « ${name} »`, before: (plan.pages || []).map((p) => p.name).join(", "), after: [...(plan.pages || []).map((p) => p.name), name].join(", ") } };
  }
  // Ajouter une section
  if ((m = n.match(/(?:ajoute|ajouter|rajoute|insere|mets)\s+(?:une?\s+)?(?:nouvelle\s+)?section\s*(?:de\s+|d'|sur\s+|:)?\s*(.*)/))) {
    const hit = SECTION_WORDS.find(([k]) => m[1].includes(k) || n.includes(k));
    if (!hit) return { kind: "info", text: "Quel type de section ? Par exemple : FAQ, services, témoignages, contact, appel à l'action, vidéo, galerie, texte." };
    const target = findPage(plan, n.replace(/section\s+\S+/, "")) || current;
    if (!target) return { kind: "info", text: "À quelle page l'ajouter ? Ouvrez une page à l'étape Pages, ou dites par exemple « … à la page Contact »." };
    if (!registry.hasSection(hit[1])) return { kind: "info", text: `Le type de section « ${hit[1]} » n'existe pas dans le CMS.` };
    const label = SECTION_PURPOSE[hit[1]] || TITLE(hit[0]);
    return { kind: "proposal", text: `Je propose d'ajouter une section « ${hit[1]} » à la page « ${target.name} ».`, proposal: { op: { op: "add_section", pageKey: target.key, type: hit[1], purpose: label }, summary: `Ajouter une section « ${hit[1]} » à « ${target.name} »`, before: `${(target.sections || []).length} section(s)`, after: `${(target.sections || []).length + 1} section(s)` } };
  }
  return { kind: "info", text: "Je n'ai pas compris cette demande. Je sais : ajouter une page (« Ajoute une page Tarifs »), ajouter une section (« Ajoute une section FAQ à la page Contact »), renommer une page ou le site. Pour les couleurs, textes et images, utilisez les étapes correspondantes." };
}
module.exports = { interpret, norm };
