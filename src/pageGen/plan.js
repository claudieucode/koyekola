// Page Generator — CONTRAT du Site Plan (v1). Le Site Planner (programme 21.3) n'existe pas encore dans le dépôt : ce contrat est celui que le générateur accepte,
// et que le Site Planner devra produire. Un plan est une donnée NON FIABLE (saisie, import ou réponse d'IA) : il est borné et nettoyé ici avant tout usage.
//   { version: 1, site: { name, description? }, pages: [ { key, name, slug?, type, goal?, sections: [ { key?, kind, title?, text?, items?, image?, cta?, courseIds?, url? } ] } ] }
const { MarketingError } = require("../marketing/errors");

const bad = (m) => new MarketingError("invalid_field", m);
const MAX_PAGES = 12, MAX_SECTIONS = 14, MAX_ITEMS = 12;
const KINDS = Object.freeze(["hero", "intro", "services", "benefits", "steps", "gallery", "testimonials", "faq", "contact", "cta", "pricing", "listing", "video", "text"]);
const KEY = /^[a-z0-9][a-z0-9-]{0,39}$/;

const str = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const slugify = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function cleanItem(it) {
  if (typeof it === "string") return { title: str(it, 80) };
  if (!it || typeof it !== "object") return null;
  const out = { title: str(it.title, 80), text: str(it.text, 400), q: str(it.q, 200), a: str(it.a, 2000), author: str(it.author, 120), role: str(it.role, 120), price: str(it.price, 40) };
  return Object.values(out).some(Boolean) ? out : null;
}
// Valide et NETTOIE un plan : propriétés inconnues écartées (listées en `warnings`), types de section inconnus refusés.
function validate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw bad("Plan invalide : un objet est attendu.");
  if (input.version !== 1) throw bad("Plan invalide : « version » doit valoir 1.");
  if (!Array.isArray(input.pages) || !input.pages.length) throw bad("Plan invalide : au moins une page est attendue.");
  if (input.pages.length > MAX_PAGES) throw bad(`Plan trop grand : ${MAX_PAGES} pages au plus par génération.`);
  const warnings = [], seen = new Set();
  const pages = input.pages.map((p, i) => {
    if (!p || typeof p !== "object") throw bad(`Page ${i + 1} : invalide.`);
    const name = str(p.name, 100);
    if (!name) throw bad(`Page ${i + 1} : le nom est obligatoire.`);
    const key = str(p.key, 40) || slugify(name);
    if (!KEY.test(key)) throw bad(`Page « ${name} » : identifiant invalide (lettres minuscules, chiffres, tirets).`);
    if (seen.has(key)) throw bad(`Deux pages portent l'identifiant « ${key} ».`);
    seen.add(key);
    if (!Array.isArray(p.sections) || !p.sections.length) throw bad(`Page « ${name} » : au moins une section est attendue.`);
    if (p.sections.length > MAX_SECTIONS) throw bad(`Page « ${name} » : ${MAX_SECTIONS} sections au plus.`);
    const keys = new Set();
    const secs = p.sections.map((s, j) => {
      if (!s || typeof s !== "object") throw bad(`Page « ${name} », section ${j + 1} : invalide.`);
      if (!KINDS.includes(s.kind)) throw bad(`Page « ${name} », section ${j + 1} : genre « ${str(String(s.kind), 30)} » inconnu.`);
      const known = ["key", "kind", "title", "text", "items", "image", "images", "cta", "courseIds", "url", "columns"];
      for (const k of Object.keys(s)) if (!known.includes(k)) warnings.push(`Page « ${name} », section ${j + 1} : propriété « ${str(k, 30)} » ignorée.`);
      let skey = str(s.key, 40) || `${s.kind}-${j + 1}`;
      if (!KEY.test(skey) || keys.has(skey)) skey = `${s.kind}-${j + 1}`;
      keys.add(skey);
      const img = (x) => (x && typeof x === "object" && str(x.src, 2000) ? { src: str(x.src, 2000), alt: str(x.alt, 200), caption: str(x.caption, 200) } : null);
      const cta = s.cta && typeof s.cta === "object" && str(s.cta.label, 60) ? { label: str(s.cta.label, 60), url: str(s.cta.url, 2000) } : null;
      return {
        key: skey, kind: s.kind, title: str(s.title, 150), text: str(s.text, 4000),
        items: (Array.isArray(s.items) ? s.items : []).slice(0, MAX_ITEMS).map(cleanItem).filter(Boolean),
        image: img(s.image), images: (Array.isArray(s.images) ? s.images : []).slice(0, 6).map(img).filter(Boolean), cta,
        courseIds: (Array.isArray(s.courseIds) ? s.courseIds : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 6), url: str(s.url, 500),
        columns: [2, 3, 4].includes(Number(s.columns)) ? Number(s.columns) : 0,
      };
    });
    return { key, name, slug: p.slug ? slugify(p.slug) : "", type: str(p.type, 40) || "autre", goal: str(p.goal, 300), sections: secs };
  });
  return { version: 1, site: { name: str(input.site && input.site.name, 100), description: str(input.site && input.site.description, 500) }, pages, warnings };
}

// Recettes : sections par défaut d'un type de page (utilisées pour fabriquer un plan depuis l'assistant de création ; le Site Planner pourra les remplacer)
const RECIPES = Object.freeze({
  accueil: ["hero", "intro", "services", "testimonials", "cta"], apropos: ["hero", "intro", "benefits", "cta"], services: ["hero", "services", "faq", "cta"],
  realisations: ["hero", "gallery", "cta"], galerie: ["hero", "gallery", "cta"], contact: ["hero", "contact"], tarifs: ["hero", "pricing", "faq", "cta"],
  blog: ["hero", "listing"], formation: ["hero", "listing", "faq"], catalogue: ["hero", "listing"], boutique: ["hero", "listing"], panier: ["hero", "listing"], commande: ["hero", "listing"], "fiche-produit": ["hero", "listing"],
  immobilier: ["hero", "listing", "contact"], equipe: ["hero", "benefits", "cta"], faq: ["hero", "faq"], temoignages: ["hero", "testimonials", "cta"], autre: ["hero", "text"],
});
const TITLES = Object.freeze({ hero: "", intro: "Qui sommes-nous", services: "Nos services", benefits: "Pourquoi nous choisir", steps: "Comment ça marche", gallery: "Nos réalisations", testimonials: "Ils nous font confiance", faq: "Questions fréquentes", contact: "Nous contacter", cta: "Passons à l'action", pricing: "Nos tarifs", listing: "Notre offre", video: "En vidéo", text: "" });

// Plan par défaut pour des pages décrites par (nom, type, objectif) — sans aucun contenu inventé : les textes absents seront des textes d'exemple signalés.
function planFor({ siteName = "", description = "", pages = [] } = {}) {
  return validate({
    version: 1, site: { name: siteName, description },
    pages: pages.map((p) => ({ key: p.key || slugify(p.name), name: p.name, type: p.type || "autre", goal: p.goal || "", sections: (RECIPES[p.type] || RECIPES.autre).map((kind, i) => ({ kind, title: kind === "hero" ? p.name : TITLES[kind] || "", ...(kind === "hero" && description ? { text: description } : {}), key: `${kind}-${i + 1}` })) })),
  });
}
module.exports = { validate, planFor, KINDS, RECIPES, TITLES, MAX_PAGES, MAX_SECTIONS, slugify };
