// Passerelle Site Planner (21.3) → Page Generator (21.4). Les deux paliers ont été écrits avec des contrats différents (le générateur attendait un plan « v1 » avant
// l'existence du planificateur) : cette passerelle est le SEUL endroit qui traduit l'un dans l'autre. Elle n'invente aucun contenu : les titres et textes restent vides
// (le générateur les remplace par des textes d'exemple signalés, ou par l'IA si la personne la demande). Les sections sans équivalent sont listées, jamais ignorées en silence.
const planLib = require("../../../pageGen/plan");

// type de section du planificateur (sections.TYPES) → genre du générateur (plan.KINDS)
const KIND = Object.freeze({ hero: "hero", text: "text", image: "gallery", list: "services", course: "listing", button: "cta", quote: "testimonials", form: "contact", features: "benefits", faq: "faq", cta: "cta", video: "video", testimonials: "testimonials" });

function toPageGenPlan(validated) {
  const skipped = [];
  const pages = [];
  for (const p of validated.pages) {
    const sections = [];
    for (const s of p.sections) {
      const kind = KIND[s.type];
      if (!kind) { skipped.push({ page: p.page.name, section: s.type, why: `Le type de section « ${s.type} » n'a pas d'équivalent dans le générateur de pages.` }); continue; }
      sections.push({ key: `${kind}-${sections.length + 1}`, kind });
    }
    if (!sections.length) { skipped.push({ page: p.page.name, section: "", why: "Aucune section de cette page n'a d'équivalent : la page n'est pas générée (ajoutez-lui une section dans le plan)." }); continue; }
    pages.push({ key: planLib.slugify(p.page.key) || p.page.key, name: p.page.name, slug: p.page.slug, type: p.page.pageType, goal: p.goal, sections });
  }
  return { plan: { version: 1, site: { name: validated.plan.site.name, description: validated.plan.site.description || "" }, pages }, skipped };
}
module.exports = { toPageGenPlan, KIND };
