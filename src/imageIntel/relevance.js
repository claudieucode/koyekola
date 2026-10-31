// Image Relevance Engine : classe des images candidates pour un besoin visuel. La pertinence est calculée d'après les MÉTADONNÉES (nom, texte alternatif, titre, description, étiquettes, catégorie)
// et, si disponible, l'analyse de pixels (orientation, qualité). Sans métadonnées, la pertinence n'est PAS évaluable (score plafonné, indiqué) : on ne devine pas le sujet d'une image.
const { norm } = require("./brief");
const words = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2);
const GENERIC = new Set(["image", "photo", "img", "jpg", "png", "webp", "dsc", "copie", "capture", "ecran"]);

// candidate : { id, name, alt, title, description, tags, category, analysis? } ; brief : sortie de visualBrief
function score(candidate, brief) {
  const text = [candidate.name && String(candidate.name).replace(/\.[a-z0-9]+$/i, "").replace(/\d{5,}/g, " "), candidate.alt, candidate.title, candidate.description, (candidate.tags || []).join(" "), candidate.category].filter(Boolean).join(" ");
  const tokens = new Set(words(text).filter((w) => !GENERIC.has(w)));
  const reasons = []; let pts = 0;
  const subjectWords = words(brief.subject || "");
  const hitsSubject = subjectWords.filter((w) => tokens.has(w) || [...tokens].some((t) => t.length > 4 && w.length > 4 && (t.startsWith(w.slice(0, 5)) || w.startsWith(t.slice(0, 5)))));
  const wanted = (brief.wanted || []).filter((w) => tokens.has(norm(w)) || [...tokens].some((t) => t.startsWith(norm(w).slice(0, 5))));
  const avoided = (brief.avoid || []).filter((w) => tokens.has(norm(w)) || [...tokens].some((t) => t.startsWith(norm(w).slice(0, 5))));
  if (tokens.size < 1) {
    return { id: candidate.id, score: 0, evaluable: false, evidence: "aucune", reasons: ["Aucune description, étiquette ni nom parlant : la pertinence ne peut pas être évaluée (le sujet de l'image n'est pas deviné)."] };
  }
  if (hitsSubject.length) { pts += Math.min(40, hitsSubject.length * 14); reasons.push(`Mots en commun avec le sujet attendu : ${[...new Set(hitsSubject)].slice(0, 4).join(", ")}.`); }
  if (wanted.length) { pts += Math.min(35, wanted.length * 18); reasons.push(`Correspond à la facette demandée (${brief.facet}) : ${[...new Set(wanted)].slice(0, 3).join(", ")}.`); }
  if (avoided.length) { pts -= 30; reasons.push(`Contient des éléments à éviter pour cet emplacement : ${[...new Set(avoided)].join(", ")}.`); }
  const a = candidate.analysis;
  let evidence = "métadonnées";
  if (a && a.available) {
    evidence = "métadonnées + pixels";
    if (brief.orientation && a.orientation === brief.orientation) { pts += 10; reasons.push("Orientation adaptée à l'emplacement."); }
    else if (brief.orientation && a.orientation && a.orientation !== brief.orientation) { pts -= 8; reasons.push(`Orientation ${a.orientation} pour un emplacement ${brief.orientation} : recadrage important.`); }
    for (const f of a.flags || []) if (f.level === "warn" && ["floue", "petite", "trop_sombre"].includes(f.code)) { pts -= 10; reasons.push(f.text); }
    if (brief.composition && brief.composition.textSide && ["left", "right"].includes(brief.composition.textSide) && a.calmSide) {
      const want = brief.composition.textSide === "left" ? "gauche" : "droite";
      if (a.calmSide === want) { pts += 10; reasons.push("Le côté prévu pour le texte est le plus calme de l'image."); } else { pts -= 5; reasons.push("Le côté prévu pour le texte est chargé : lisibilité à vérifier."); }
    }
  }
  if (!hitsSubject.length && !wanted.length) reasons.push("Aucun mot en commun avec le sujet attendu : pertinence faible.");
  return { id: candidate.id, score: Math.max(0, Math.min(100, Math.round(pts))), evaluable: true, evidence, reasons };
}
function rank(candidates, brief) {
  // Une image non évaluable (aucune description) est classée au-dessus d'une image dont la description la désigne comme hors sujet : l'inconnu n'est pas puni comme une erreur prouvée
  const key = (r) => (r.evaluable ? r.score : 5);
  return candidates.map((c) => ({ ...score(c, brief), name: c.name })).sort((a, b) => key(b) - key(a) || (a.name || "").localeCompare(b.name || ""));
}
module.exports = { score, rank };
