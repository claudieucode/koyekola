// Brand Visual Matching Engine + Visual Consistency Validator. Compare les couleurs, la luminosité et la saturation MESURÉES d'une image (analyzer) à la direction artistique du site (teinte, ambiance).
// Sépare les variations artistiques VOLONTAIRES (portfolio, photographie, galerie : seulement signalées en information) des vraies incohérences (avertissement).
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
// Plages attendues par ambiance (luminance moyenne, saturation maximale) : repères de départ, pas des règles esthétiques absolues
const MOODS = {
  luxe: { lum: [0.15, 0.6], satMax: 0.5, label: "premium (tons posés, contrastes doux)" },
  minimaliste: { lum: [0.5, 0.95], satMax: 0.35, label: "minimaliste (clair, peu saturé)" },
  corporate: { lum: [0.3, 0.85], satMax: 0.6, label: "professionnel (net, lumineux)" },
  creatif: { lum: [0.15, 0.9], satMax: 1, label: "créatif (libre)" },
  editorial: { lum: [0.35, 0.85], satMax: 0.55, label: "éditorial (tons chauds)" },
  tech: { lum: [0.1, 0.7], satMax: 0.8, label: "technologique" },
  ecommerce: { lum: [0.45, 0.95], satMax: 0.7, label: "boutique (fond épuré)" },
  institutionnel: { lum: [0.3, 0.8], satMax: 0.5, label: "institutionnel (sobre)" },
  educatif: { lum: [0.35, 0.9], satMax: 0.7, label: "éducatif (chaleureux)" },
};
function match(analysis, direction = {}) {
  if (!analysis || !analysis.available) return { score: null, evaluable: false, notes: ["Analyse indisponible : correspondance à la marque non évaluée."] };
  const notes = []; let score = 100;
  const hue = Number.isFinite(direction.hue) ? direction.hue : null;
  if (hue !== null) {
    if (analysis.neutralShare >= 0.6 || !analysis.dominantHues.length) notes.push("Image surtout neutre : s'accorde avec n'importe quelle palette.");
    else {
      const d = Math.min(...analysis.dominantHues.map((h) => hueDist(h.hue, hue)));
      if (d <= 40) notes.push(`Teinte proche de la couleur de la marque (écart ${d}°).`);
      else if (d <= 90) { score -= 15; notes.push(`Teinte moyennement proche de la couleur de la marque (écart ${d}°).`); }
      else { score -= 35; notes.push(`Teinte éloignée de la couleur de la marque (écart ${d}°) : risque de dissonance.`); }
    }
  }
  const m = MOODS[direction.mood];
  if (m) {
    if (analysis.luminance < m.lum[0]) { score -= 20; notes.push(`Plus sombre que l'ambiance ${m.label}.`); }
    else if (analysis.luminance > m.lum[1]) { score -= 20; notes.push(`Plus claire que l'ambiance ${m.label}.`); }
    if (analysis.saturation > m.satMax) { score -= 15; notes.push(`Plus saturée que l'ambiance ${m.label}.`); }
  }
  return { score: Math.max(0, score), evaluable: true, notes };
}
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
// analyses : [{ id, analysis }] ; opts.variety : variété volontaire (portfolio, galerie)
function consistency(items, opts = {}) {
  const ok = items.filter((i) => i.analysis && i.analysis.available);
  if (ok.length < 3) return { evaluable: false, issues: [], note: "Au moins 3 images analysées sont nécessaires pour juger de la cohérence." };
  const mL = median(ok.map((i) => i.analysis.luminance)), mS = median(ok.map((i) => i.analysis.saturation));
  const colored = ok.filter((i) => i.analysis.dominantHues.length && i.analysis.neutralShare < 0.6);
  const mean = colored.length ? (() => { let x = 0, y = 0; for (const i of colored) { const r = (i.analysis.dominantHues[0].hue * Math.PI) / 180; x += Math.cos(r); y += Math.sin(r); } return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360; })() : null;
  const issues = [];
  for (const i of ok) {
    const a = i.analysis, why = [];
    if (Math.abs(a.luminance - mL) > 0.3) why.push(`luminosité très différente des autres (${a.luminance} contre ≈ ${mL.toFixed(2)})`);
    if (Math.abs(a.saturation - mS) > 0.35) why.push(`saturation très différente (${a.saturation} contre ≈ ${mS.toFixed(2)})`);
    if (mean !== null && colored.includes(i) && colored.length >= 3 && hueDist(a.dominantHues[0].hue, mean) > 100) why.push("teinte dominante opposée à celle de l'ensemble");
    if (why.length) issues.push({ id: i.id, level: opts.variety ? "info" : "warn", voluntary: Boolean(opts.variety), reasons: why, text: opts.variety ? "Écart de style : possible choix artistique (portfolio / galerie), à confirmer." : "Écart de style avec les autres images du site : vérifiez que c'est voulu." });
  }
  return { evaluable: true, issues, medianLuminance: Math.round(mL * 100) / 100, medianSaturation: Math.round(mS * 100) / 100, variety: Boolean(opts.variety) };
}
module.exports = { match, consistency, MOODS, hueDist };
