// Visual Balance Analyzer (programme 22.3). Règles MESURABLES sur la structure normalisée (pistes de grille, portées, longueurs de texte, tailles, couleurs) — aucune réponse d'IA.
// Chaque constat porte une règle, une mesure, et une correction ciblée (`fix` : paramètre du pattern à changer) que le moteur peut appliquer automatiquement une fois.
const { walk, textOf } = require("./validate");

const WEIGHT = { error: 25, warn: 10, info: 3 };
const trackList = (t) => String(t || "").trim().split(/\s+/).filter(Boolean);
const fr = (t) => { const m = /minmax\(0,\s*([\d.]+)fr\)|^([\d.]+)fr$/.exec(t); return m ? Number(m[1] || m[2]) : null; };
const px = (v) => { const m = /^(\d+(?:\.\d+)?)px$/.exec(String(v || "")); return m ? Number(m[1]) : null; };
const chars = (n) => { let t = 0; const add = (m) => { const p = m.props || {}; for (const k of ["text", "label", "title", "description", "q", "a"]) if (typeof p[k] === "string") t += p[k].length; if (p.html) t += p.html.replace(/<[^>]+>/g, "").length; for (const it of p.items || []) if (it && typeof it === "object") for (const v of Object.values(it)) if (typeof v === "string") t += v.length; for (const m2 of m.children || []) add(m2); }; add(n); return t; };
const DARK_BG = new Set(["token:primary", "token:secondary", "token:accent"]);

// Analyse d'une section normalisée. Renvoie { score, findings:[{rule, severity, message, measure, fix?}], measures }
function analyze(section, { profile = null } = {}) {
  const findings = [];
  const add = (rule, severity, message, measure, fix) => findings.push({ rule, severity, message, measure, ...(fix ? { fix } : {}) });
  const total = chars({ children: section.children || [] });
  const measures = { chars: total, nodes: 0, grids: 0, maxColumnRatio: 1 };
  walk(section.children, (n, depth) => {
    measures.nodes += 1;
    const d = (n.styles && n.styles.desktop) || {};
    const kids = n.children || [];
    if (d.display === "grid" || n.type === "grid") {
      measures.grids += 1;
      const tr = trackList(d.gridTemplate), cols = d.columns ? Number(d.columns) : tr.length;
      // 1. proportions de colonnes
      const frs = tr.map(fr).filter((x) => x !== null);
      if (frs.length >= 2) {
        const ratio = Math.max(...frs) / Math.min(...frs); measures.maxColumnRatio = Math.max(measures.maxColumnRatio, ratio);
        // une colonne étroite qui ne porte qu'un repère (numéro, icône : moins de 20 caractères) est voulue ; le déséquilibre ne compte que si les deux colonnes portent du contenu
        const small = kids[frs.indexOf(Math.min(...frs))];
        if (ratio > 4 && (!small || chars(small) >= 20)) add("column-ratio", "warn", `Colonnes déséquilibrées (rapport ${ratio.toFixed(1)}:1).`, ratio, { ratio: "1:1" });
        // 2. contenu trop étroit : une colonne < 20 % de la largeur portant beaucoup de texte
        const sum = frs.reduce((a, b) => a + b, 0);
        kids.forEach((k, i) => { const share = (frs[i] || 0) / sum; if (frs[i] !== undefined && share < 0.2 && chars(k) > 220) add("narrow-column", "warn", `Texte long (${chars(k)} car.) dans une colonne de ${Math.round(share * 100)} % de la largeur.`, share); });
      }
      // 3. cellules vides involontaires (grille régulière sans placement explicite)
      const placed = kids.some((k) => { const s = (k.styles && k.styles.desktop) || {}; return s.gridColumnStart !== undefined || s.gridRowStart !== undefined; });
      if (cols >= 2 && cols <= 6 && kids.length > cols && !placed && !d.gridAutoFlow) {
        const area = kids.reduce((a, k) => { const s = (k.styles && k.styles.desktop) || {}; return a + (Number((s.gridColumnSpan || "span 1").toString().replace(/\D/g, "")) || 1) * (Number((s.gridRowSpan || "span 1").toString().replace(/\D/g, "")) || 1); }, 0);
        const empty = (cols - (area % cols)) % cols;
        if (empty >= 2) add("empty-cells", "warn", `${empty} cases vides sur la dernière ligne.`, empty, { cols: Math.max(2, cols - 1) });
        else if (empty === 1 && cols >= 4) add("empty-cells", "info", "1 case vide sur la dernière ligne.", empty);
      }
      // 4. disparité de densité entre cartes sœurs
      const sizes = kids.map(chars).filter((x) => x > 0);
      if (sizes.length >= 3 && cols >= 3) { const mx = Math.max(...sizes), mn = Math.min(...sizes); if (mn > 0 && mx / mn > 5 && mx > 300) add("card-density", "warn", `Cartes de densités très différentes (${mn} à ${mx} car.).`, mx / mn, { cols: Math.max(2, cols - 1) }); }
      // 5. image disproportionnée : une colonne d'image qui prend > 70 % de la largeur à côté de texte
      if (frs.length === 2) { const sum = frs[0] + frs[1]; kids.forEach((k, i) => { if (k.type === "image" && frs[i] / sum > 0.7 && kids.some((o) => o !== k && chars(o) > 0)) add("image-dominance", "warn", "L'image occupe plus de 70 % de la largeur.", frs[i] / sum, { ratio: "7:5" }); }); }
    }
    // 6. titre trop imposant pour sa longueur
    if (n.type === "heading") {
      const size = px(d.fontSize), len = (n.props.text || "").length;
      if (size && size >= 56 && len > 60) add("heading-oversize", "warn", `Titre de ${size}px pour ${len} caractères.`, size, { heroSize: "lg" });
      else if (size && size >= 44 && len > 120) add("heading-oversize", "warn", `Titre de ${size}px pour ${len} caractères.`, size, { heroSize: "md" });
    }
    // 7. alignements : enfants frères aux alignements de texte mixtes (centre / gauche)
    if (kids.length >= 3) { const al = new Set(kids.map((k) => ((k.styles && k.styles.desktop) || {}).textAlign).filter(Boolean)); if (al.size > 1) add("mixed-alignment", "info", `Alignements de texte mixtes parmi les éléments frères (${[...al].join(", ")}).`, al.size); }
    // 8. contraste : fond foncé sans couleur de texte associée
    if (d.backgroundColor && DARK_BG.has(d.backgroundColor) && !d.color && chars(n) > 0) add("contrast", "error", "Fond foncé sans couleur de texte associée (contraste non garanti).", 0);
    if (depth > 6) add("nesting", "warn", `Imbrication de ${depth} niveaux.`, depth);
  });
  // 9. section trop chargée (hors texte long assumé)
  const isArticle = Boolean((section.children || []).some((n) => JSON.stringify(n).includes('"columnCount"')));
  if (total > 2200 && !isArticle) add("overloaded", "warn", `Section chargée (${total} caractères) : envisagez de la scinder.`, total);
  if (measures.nodes > 90) add("complexity", "warn", `Structure complexe (${measures.nodes} éléments).`, measures.nodes);
  // 10. espace vide : section très haute avec peu de contenu
  walk(section.children, (n) => { const d = (n.styles && n.styles.desktop) || {}; if (d.minHeight && /^\d+vh$/.test(d.minHeight) && parseInt(d.minHeight, 10) >= 80 && chars(n) < 40) add("empty-space", "info", "Section haute avec très peu de texte.", chars(n)); });
  const seen = new Set();   // un même constat répété par plusieurs lignes identiques n'est compté qu'une fois
  for (let i = findings.length - 1; i >= 0; i--) { const k = `${findings[i].rule}|${findings[i].message}`; if (seen.has(k)) findings.splice(i, 1); else seen.add(k); }
  const score = Math.max(0, 100 - findings.reduce((a, f) => a + WEIGHT[f.severity], 0));
  return { score, findings, measures };
}
module.exports = { analyze };
