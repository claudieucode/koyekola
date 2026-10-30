// Component Mapper (programme 21.4) : associe le BESOIN d'une section du plan aux composants natifs RÉELS (registre.js → pages/sections.js).
// Règles : jamais d'identifiant ni de propriété inventés ; un composant absent est SIGNALÉ (`missing`), remplacé par une alternative native si elle existe (`alternative`), sinon la section est
// ignorée (`skipped`) avec son motif ; aucun bloc vide, aucune image sans rapport (une image n'est posée que si le plan la fournit) ; les textes absents sont des textes d'exemple entre crochets
// (même convention que les gabarits : « [chiffre réel] »), toujours signalés (`example`).
const registry = require("./registry");

const ex = (label) => `[${label}]`;
const hasText = (s) => Boolean(s.text || s.title);
const mdOf = (s) => (s.text || "").trim();

// Chaque règle reçoit (section du plan, page, env) et renvoie { sections, components, justification, limitations, missing, example, alternative, status }.
const RULES = {
  hero(s, page) {
    const title = s.title || page.name;
    const sec = { type: "hero", title, subtitle: s.text || "", image: s.image ? s.image.src : "", imageAlt: s.image ? s.image.alt : "", buttonLabel: s.cta ? s.cta.label : "", buttonUrl: s.cta ? s.cta.url : "" };
    const lim = [];
    if (s.cta && !s.cta.url) { sec.buttonLabel = ""; lim.push("Bouton ignoré : le plan ne donne pas d'adresse (un bouton a besoin d'un texte ET d'une adresse)."); }
    if (!s.image) lim.push("Pas d'image : le plan n'en fournit pas (choisissez-en une dans la médiathèque depuis l'éditeur).");
    return { sections: [sec], components: ["hero"], justification: "Titre, texte secondaire, bouton et image : le composant « Bandeau » couvre exactement ce besoin.", limitations: lim, example: !s.title && !page.name };
  },
  intro(s, page) { return textRule(s, page, "Présentation"); },
  text(s, page) { return textRule(s, page, ""); },
  services(s) { return cards(s, "Services", ex("Service")); },
  benefits(s) { return cards(s, "Avantages", ex("Avantage")); },
  pricing(s) {
    const r = cards(s, "Formules", ex("Formule"));
    return { ...r, status: "partial", alternative: true, missing: [registry.ABSENT.tarifs], limitations: [...r.limitations, "Pas de composant tarifs natif : les formules sont des cartes (le prix se saisit dans le texte de chaque carte)."] };
  },
  steps(s) {
    const items = s.items.map((i) => i.title || i.text).filter(Boolean);
    const example = !items.length;
    return { sections: [{ type: "list", title: s.title, items: items.length ? items : [ex("Étape 1"), ex("Étape 2"), ex("Étape 3")] }], components: ["list"], justification: "Une suite de points ordonnés : le composant « Liste » est le plus simple à modifier.", limitations: [], example };
  },
  gallery(s) {
    const imgs = s.images.length ? s.images : s.image ? [s.image] : [];
    const missing = [registry.ABSENT.galerie];
    if (!imgs.length) return { sections: [], components: [], status: "skipped", justification: "Une galerie a besoin d'images : le plan n'en fournit aucune et aucune image sans rapport n'est ajoutée.", limitations: ["Ajoutez des images dans la médiathèque puis dans l'éditeur."], missing };
    const out = [];
    if (s.title) out.push({ type: "text", markdown: `## ${s.title}` });
    for (const im of imgs) out.push({ type: "image", src: im.src, alt: im.alt, caption: im.caption });
    return { sections: out, components: ["image"], status: "partial", alternative: true, missing, justification: "Pas de composant galerie natif : une image par section « Image », dans l'ordre du plan.", limitations: ["Pas de grille ni d'agrandissement (lightbox) propre au composant ; disposition en pile."] };
  },
  testimonials(s) {
    const items = s.items.filter((i) => i.text || i.a).map((i) => ({ text: i.text || i.a, author: i.author, role: i.role }));
    const example = !items.length;
    return { sections: [{ type: "testimonials", title: s.title, items: items.length ? items : [{ text: "Remplacez par le témoignage réel d'un client, avec son accord.", author: "Prénom N.", role: "" }] }], components: ["testimonials"], justification: "Citations de clients : composant « Témoignages ».", limitations: example ? [] : [], example };
  },
  faq(s) {
    const items = s.items.filter((i) => i.q && i.a).map((i) => ({ q: i.q, a: i.a }));
    const example = !items.length;
    return { sections: [{ type: "faq", title: s.title || "Questions fréquentes", items: items.length ? items : [{ q: ex("Votre question la plus fréquente"), a: ex("Votre réponse") }] }], components: ["faq"], justification: "Questions et réponses repliables : composant « Questions fréquentes ».", limitations: [], example };
  },
  contact(s) {
    const body = mdOf(s) || `${ex("Adresse")}\n\n${ex("Téléphone")}\n\n${ex("E-mail")}`;
    const out = [{ type: "text", markdown: `## ${s.title || "Nous contacter"}\n\n${body}` }, { type: "form", heading: s.title || "Écrivez-nous", intro: "" }];
    const lim = ["Le formulaire doit être associé à la page (réglages de la page) avant la publication : le générateur n'en choisit pas un à votre place."];
    if (s.cta && s.cta.url) out.push({ type: "button", label: s.cta.label, url: s.cta.url, align: "center" });
    return { sections: out, components: ["text", "form"], justification: "Coordonnées en texte + composant « Formulaire » ; bouton seulement si le plan donne une adresse.", limitations: lim, example: !mdOf(s) };
  },
  cta(s) {
    const url = s.cta && s.cta.url;
    if (!s.cta || !url) return { sections: [], components: [], status: "skipped", justification: "Un appel à l'action a besoin d'un bouton (texte ET adresse) : le plan n'en donne pas, aucun bouton sans objectif n'est créé.", limitations: [], missing: [] };
    return { sections: [{ type: "cta", title: s.title || ex("Votre proposition"), text: s.text, buttonLabel: s.cta.label, buttonUrl: url }], components: ["cta"], justification: "Appel à l'action avec bouton : composant « Appel à l'action ».", limitations: [], example: !s.title };
  },
  video(s) {
    if (!s.url) return { sections: [], components: [], status: "skipped", justification: "Une vidéo a besoin d'une adresse YouTube, Vimeo ou d'un fichier https : le plan n'en donne pas.", limitations: [], missing: [] };
    return { sections: [{ type: "video", url: s.url, title: s.title || "Vidéo", caption: s.text }], components: ["video"], justification: "Vidéo intégrée : composant « Vidéo ».", limitations: [] };
  },
  // Contenu dynamique (catalogue de formations, biens, produits, articles) : seules les formations du catalogue ont un composant natif
  listing(s, page, env) {
    const type = page.type;
    if (env.courseOk && s.courseIds.length) {
      return { sections: s.courseIds.map((id) => ({ type: "course", courseId: id, cta: "" })), components: ["course"], justification: "Formations du catalogue : composant « Formation du catalogue » (données réelles, jamais copiées).", limitations: [] };
    }
    const miss = type === "immobilier" ? "Catalogue de biens immobiliers (module métier absent)" : ["boutique", "panier", "commande", "fiche-produit", "catalogue"].includes(type) ? registry.ABSENT.produits : type === "blog" ? registry.ABSENT.articles : type === "formation" ? "Formations à choisir dans le catalogue (courseIds du plan)" : registry.ABSENT.articles;
    const intro = mdOf(s) || ex("Présentez en deux phrases ce que la personne va trouver ici");
    return { sections: [{ type: "text", markdown: `## ${s.title || "Notre offre"}\n\n${intro}` }], components: ["text"], status: "partial", alternative: true, missing: [miss], example: !mdOf(s),
      justification: "Aucun composant natif de liste dynamique pour ce besoin : un texte d'introduction est posé, la fonctionnalité manquante est signalée.", limitations: ["La liste dynamique n'existe pas encore dans Kolakisa : ne la présentez pas comme fonctionnelle."] };
  },
};
function textRule(s, page, fallbackTitle) {
  const out = [];
  const title = s.title || fallbackTitle;
  const body = mdOf(s);
  if (!body && !title) return { sections: [], components: [], status: "skipped", justification: "Section sans titre ni texte : aucun bloc vide n'est créé.", limitations: [], missing: [] };
  out.push({ type: "text", markdown: `${title ? `## ${title}\n\n` : ""}${body || ex("Présentez votre activité en quelques phrases")}` });
  if (s.image) out.push({ type: "image", src: s.image.src, alt: s.image.alt, caption: s.image.caption });
  return { sections: out, components: s.image ? ["text", "image"] : ["text"], justification: "Un titre et un texte : composant « Texte » (le plus simple à modifier).", limitations: [], example: !body };
}
function cards(s, fallbackTitle, placeholder) {
  const items = s.items.filter((i) => i.title || i.text).map((i) => ({ title: i.title, text: [i.text, i.price].filter(Boolean).join(" — ") }));
  const example = !items.length;
  const list = items.length ? items : [1, 2, 3].map((n) => ({ title: `${placeholder.slice(0, -1)} ${n}]`, text: ex("Une phrase qui décrit ce que la personne obtient") }));
  const columns = s.columns || (list.length === 2 || list.length === 4 ? list.length : 3);
  return { sections: [{ type: "features", title: s.title || fallbackTitle, intro: s.text, columns, items: list }], components: ["features"], justification: "Plusieurs éléments comparables : composant « Points forts en cartes » (2 à 4 colonnes, empilées sur mobile).", limitations: ["Pas d'icônes ni d'images dans les cartes (non pris en charge par le composant)."], missing: [], example };
}

// Association d'une section du plan. `env` : { courseOk }
function mapSection(sec, page, env = {}) {
  const rule = RULES[sec.kind];
  const base = { key: sec.key, need: sec.kind, status: "ok", components: [], justification: "", limitations: [], missing: [], example: false, alternative: false, sections: [] };
  if (!rule) return { ...base, status: "skipped", justification: `Genre « ${sec.kind} » sans règle de correspondance.` };
  const r = rule(sec, page, env);
  const types = new Set(registry.usable());
  const absent = (r.components || []).filter((c) => !types.has(c));
  // Défense : une règle ne peut citer qu'un type réellement enregistré dans le moteur
  if (absent.length) return { ...base, status: "skipped", missing: absent, justification: `Composant natif introuvable dans le moteur : ${absent.join(", ")}.` };
  const status = r.status || (r.sections.length ? "ok" : "skipped");
  return { ...base, ...r, status, missing: r.missing || [], limitations: r.limitations || [], properties: r.sections.map((x) => Object.keys(x)), compat: { responsive: ["empilement automatique sur mobile par le rendu", "masquage par écran possible (hideOn) depuis l'éditeur"] } };
}

// Style de section (attributs natifs seulement). `layout` (facultatif) : plan de composition du AI Design Generator (designGen) — { hero, cards, text, cta } ; toute valeur hors énumération native est écartée.
function styleFor(type, index, layout = null) {
  const S = registry.STYLE;
  const pick = (k, v) => (S[k].includes(v) ? v : undefined);
  const from = (def, over, alt = false) => {
    const g = { ...def, ...(over || {}) };
    if (alt && over && over.background === undefined && g.background !== undefined) g.background = index % 2 ? "surface" : "default";
    return Object.fromEntries(["padding", "background", "align", "width"].map((k) => [k, pick(k, g[k])]).filter(([, v]) => v));
  };
  if (type === "hero") return from({ padding: "xl", align: "center", width: "wide" }, layout && layout.hero);
  if (type === "cta") return from({ padding: "lg", background: "primary", align: "center" }, layout && layout.cta);
  if (["features", "testimonials", "faq", "list"].includes(type)) return from({ padding: "lg", background: index % 2 ? "surface" : "default", width: "normal" }, layout && layout.cards);
  return from({ padding: "md", width: "narrow" }, layout && layout.text);
}
module.exports = { mapSection, styleFor, RULES };
