// Aperçu filaire d'un modèle (programme 23.1) : dessiné à partir de la structure RÉELLE du document (types d'éléments, colonnes, ordre) — jamais une image inventée.
// Sortie : balisage SVG construit uniquement de nombres et de classes fixes (aucune donnée du document n'y est insérée) ; les couleurs viennent de la feuille de style.
const W = 200, H = 120, PAD = 8;
const kidsOf = (n) => (Array.isArray(n.children) ? n.children : []);
// Éléments à plat dans l'ordre de lecture, profondeur limitée : { t: famille, cols }
function flatten(nodes, out, depth = 0) {
  for (const n of nodes || []) {
    if (out.length >= 14) return;
    const type = n && n.type;
    if (!type) continue;
    const st = (n.styles && n.styles.desktop) || {};
    const cols = type === "grid" || type === "columns" || st.display === "grid" ? Math.min(4, Math.max(2, Number(st.columns) || String(st.gridTemplate || "").trim().split(/\s+/).filter(Boolean).length || kidsOf(n).length || 2)) : 0;
    if (cols) { out.push({ t: "cols", cols }); continue; }
    if (["container", "stack", "section"].includes(type) && kidsOf(n).length && depth < 3) { flatten(kidsOf(n), out, depth + 1); continue; }
    out.push({ t: ["heading", "text", "image", "gallery", "button", "badge", "quote", "list", "divider", "form", "menu", "sitelogo", "sitetitle"].includes(type) ? type : "block" });
  }
}
const SIZE = { heading: 12, text: 18, image: 34, gallery: 30, button: 12, badge: 8, quote: 20, list: 20, divider: 4, form: 28, menu: 10, sitelogo: 14, sitetitle: 12, block: 18, cols: 34 };
function rects(items) {
  const gap = 5, total = items.reduce((s, i) => s + SIZE[i.t], 0) + gap * Math.max(0, items.length - 1);
  const k = total > H - 2 * PAD ? (H - 2 * PAD) / total : 1;
  const out = []; let y = PAD;
  for (const it of items) {
    const h = Math.max(2, Math.round(SIZE[it.t] * k * 10) / 10), w = W - 2 * PAD;
    if (it.t === "cols") { const cw = (w - 4 * (it.cols - 1)) / it.cols; for (let c = 0; c < it.cols; c += 1) out.push({ c: "box", x: PAD + c * (cw + 4), y, w: cw, h }); }
    else if (it.t === "heading") out.push({ c: "bar", x: PAD, y, w: w * 0.6, h });
    else if (it.t === "text" || it.t === "quote" || it.t === "list") { for (let l = 0; l < 3; l += 1) out.push({ c: "line", x: PAD, y: y + l * (h / 3), w: l === 2 ? w * 0.5 : w, h: Math.max(1.5, h / 5) }); }
    else if (it.t === "image" || it.t === "gallery") out.push({ c: "img", x: PAD, y, w: it.t === "gallery" ? w : w * 0.7, h });
    else if (it.t === "button") out.push({ c: "btn", x: PAD, y, w: 44, h });
    else out.push({ c: it.t === "menu" ? "line" : "box", x: PAD, y, w: it.t === "menu" ? w * 0.7 : w, h });
    y += h + gap * k;
  }
  return out;
}
// document : { sections } (page) ou section (composant)
function thumbnail(doc) {
  const items = [];
  const sections = Array.isArray(doc && doc.sections) ? doc.sections : doc ? [doc] : [];
  for (const s of sections) { if (s && s.type === "layout") flatten(kidsOf(s), items); else if (s) items.push({ t: "block" }); if (items.length >= 14) break; }
  const body = rects(items.slice(0, 14)).map((r) => `<rect class="tb-w-${r.c}" x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" rx="2"/>`).join("");
  return { svg: `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Aperçu filaire du modèle" focusable="false">${body}</svg>`, elements: items.length };
}
module.exports = { thumbnail };
