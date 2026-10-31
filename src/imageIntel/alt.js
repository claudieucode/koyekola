// Image SEO & Accessibility Intelligence : classe l'image (informative, décorative, fonctionnelle, complexe) et propose / contrôle le texte alternatif.
// Règle centrale : on ne décrit que ce qui est CONNU (description enregistrée, consigne de génération, légende). Sans source fiable, aucune description n'est inventée : l'état est « à décrire ».
const CLASSES = ["informative", "decorative", "functional", "complex"];
function classify({ role = "", linked = false, hasCaptionOrNearbyText = false, chart = false, decorativeHint = false } = {}) {
  if (linked) return "functional";
  if (chart) return "complex";
  if (decorativeHint || role === "background" || role === "banner") return "decorative";
  if (role === "hero" && hasCaptionOrNearbyText) return "decorative"; // l'information est déjà dans le texte voisin
  return "informative";
}
// source : { description, caption, requested (consigne/description du besoin), generated } ; renvoie { alt, status, basis, longDescription? }
function propose({ imageClass = "informative", source = {}, actionLabel = "", siblings = [] } = {}) {
  if (imageClass === "decorative") return { imageClass, alt: "", status: "decorative", basis: "image décorative : texte alternatif vide (les lecteurs d'écran l'ignorent)" };
  if (imageClass === "functional") {
    if (!actionLabel) return { imageClass, alt: "", status: "to_describe", basis: "image cliquable : indiquez ce que fait le lien (ex. « Voir la fiche du bien »), pas ce que montre l'image" };
    return { imageClass, alt: actionLabel.slice(0, 125), status: "ok", basis: "libellé de l'action" };
  }
  const base = (source.description || source.caption || source.requested || "").replace(/\s+/g, " ").trim();
  if (!base) return { imageClass, alt: "", status: "to_describe", basis: "aucune source fiable : le contenu de l'image n'est pas deviné, la personne doit la décrire" };
  let alt = base.replace(/^(image|photo|photographie|illustration) (de|d'|du|des)\s*/i, "").replace(/^./, (c) => c.toUpperCase());
  if (alt.length > 125) alt = `${alt.slice(0, 122).replace(/\s+\S*$/, "")}…`;
  const res = { imageClass, alt, status: "ok", basis: source.description ? "description enregistrée" : source.caption ? "légende" : "consigne de génération (ce qui a été demandé, pas ce qui est vérifié visuellement)" };
  if (source.generated) res.note = "Image générée : le rendu peut différer de la demande, à relire.";
  if (imageClass === "complex") { res.status = "needs_long_description"; res.longDescription = "Image complexe : ajoutez une description détaillée dans le texte voisin ou en légende."; }
  if (siblings.map((s) => s.toLowerCase()).includes(alt.toLowerCase())) { res.status = "duplicate"; res.note = "Même texte alternatif qu'une autre image de la page : précisez ce qui les distingue."; }
  return res;
}
// Contrôle d'un texte alternatif existant
function validate(alt, { imageClass = "informative", siblings = [], filename = "" } = {}) {
  const issues = [], a = String(alt || "").trim();
  if (imageClass === "decorative") { if (a) issues.push({ code: "decorative_not_empty", level: "info", text: "Image décorative : le texte alternatif devrait être vide." }); return issues; }
  if (!a) { issues.push({ code: "missing", level: "error", text: "Texte alternatif absent pour une image informative." }); return issues; }
  if (a.length > 125) issues.push({ code: "too_long", level: "warn", text: `Texte alternatif trop long (${a.length} caractères) : visez 125 caractères ou moins.` });
  if (/^(image|photo|photographie|illustration|picture)\b/i.test(a)) issues.push({ code: "redundant_prefix", level: "warn", text: "Inutile de commencer par « image de » / « photo de » : le lecteur d'écran l'annonce déjà." });
  if (/\.(jpe?g|png|webp|gif|avif)\b/i.test(a) || /^(img|dsc|image)[-_ ]?\d+/i.test(a) || (filename && a.toLowerCase() === filename.toLowerCase())) issues.push({ code: "filename", level: "warn", text: "Le texte alternatif ressemble à un nom de fichier." });
  const ws = a.toLowerCase().split(/[^a-zà-ÿ0-9]+/).filter((w) => w.length > 3), freq = {};
  for (const w of ws) freq[w] = (freq[w] || 0) + 1;
  if (Object.values(freq).some((n) => n >= 3) || (a.match(/,/g) || []).length >= 4) issues.push({ code: "keyword_stuffing", level: "warn", text: "Répétition de mots-clés : décrivez l'image naturellement." });
  if (siblings.some((s) => String(s).trim().toLowerCase() === a.toLowerCase())) issues.push({ code: "duplicate", level: "warn", text: "Même texte alternatif qu'une autre image de la page." });
  return issues;
}
module.exports = { classify, propose, validate, CLASSES };
