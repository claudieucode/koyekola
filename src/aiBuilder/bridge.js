// Passerelles vers les moteurs existants : AUCUNE logique d'analyse, de génération ni de rendu ici. Ce module ne fait que convertir des formes de données entre moteurs
// (plan de site 21.3 → plan du Page Generator 21.4) et composer le texte du brief à partir des champs saisis.
const registryOfSections = { hero: "hero", text: "text", features: "services", faq: "faq", cta: "cta", form: "contact", testimonials: "testimonials", video: "video", list: "steps", image: "gallery", course: "listing", button: "cta", quote: "testimonials" };
const PAGE_TYPES = new Set(["accueil", "apropos", "services", "contact", "portfolio", "realisations", "blog", "tarifs", "faq", "temoignages", "formation", "boutique", "immobilier", "evenement"]);
const PLACEHOLDER = { hero: "[Titre principal]" };
const str = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");

// Plan de site validé (21.3) → plan du Page Generator (contrat v1). Les sections « indisponibles » ou sans équivalent sont écartées et LISTÉES (jamais en silence).
function sitePlanToPageGen(plan) {
  const skipped = [], notes = [];
  const pages = plan.pages.map((p) => {
    const sections = [];
    for (const s of p.sections) {
      const kind = registryOfSections[s.type];
      if (!kind || s.availability === "unavailable") { skipped.push({ page: p.name, section: s.purpose || s.type, why: !kind ? `type de section « ${s.type} » sans équivalent dans le Page Generator` : "section indisponible dans Kolakisa" }); continue; }
      const out = { key: s.key, kind };
      if (PLACEHOLDER[kind]) { out.title = PLACEHOLDER[kind]; out.text = "[Sous-titre]"; }
      else if (kind === "text") out.text = "[Texte]"; // sinon le Page Generator écarte la section (jamais de bloc vide)
      sections.push(out);
    }
    // Page ajoutée sans section : un bloc de texte d'exemple (jamais une page vide, que le Page Generator refuserait)
    if (!p.sections.length && !sections.length) { sections.push({ key: "intro", kind: "text", text: "[Texte]" }); notes.push({ page: p.name, note: "page sans section dans le plan : un texte d'exemple a été ajouté" }); }
    return { key: p.key, name: p.name, slug: p.slug, type: PAGE_TYPES.has(p.pageType) ? p.pageType : "autre", goal: str(p.purpose, 300), sections };
  }).filter((p) => p.sections.length);
  return { plan: { version: 1, site: { name: plan.site.name, description: plan.site.description || "" }, pages }, skipped, notes };
}
// Champs saisis dans l'étape « Brief » → texte pour le Brief Analyzer. Les valeurs sont données comme des informations FOURNIES par la personne (elles deviennent des faits « explicit »).
const LABELS = { company: "Entreprise ou marque", sector: "Secteur d'activité", siteType: "Type de site", audience: "Public cible", country: "Pays", language: "Langue principale", languages: "Langues secondaires", goals: "Objectifs commerciaux", services: "Services ou produits", style: "Style visuel souhaité", references: "Références" };
function composeBrief(draft) {
  const d = draft && typeof draft === "object" ? draft : {};
  const free = str(d.description, 3000);
  const lines = Object.keys(LABELS).map((k) => (str(d[k], 300) ? `${LABELS[k]} : ${str(d[k], 300)}` : "")).filter(Boolean);
  return [free, lines.length ? `Informations fournies :\n${lines.join("\n")}` : ""].filter(Boolean).join("\n\n").slice(0, 5900);
}
module.exports = { sitePlanToPageGen, composeBrief, LABELS, str };
