// Responsive Validation Engine — volet NAVIGATEUR (programme 22.8). `measure` s'exécute DANS la page (page.evaluate) et ne renvoie que des constats mesurés : aucune estimation.
// Il ne prouve rien sur de vrais téléphones : seulement la mise en page du moteur Chromium à la largeur demandée (émulation de la taille de fenêtre et du pointeur tactile).
function measure(opts) {
  const o = Object.assign({ touch: true, minTarget: 32, minFont: 12 }, opts || {});
  const vw = document.documentElement.clientWidth, out = { vw, overflowX: 0, wide: [], clipped: [], small: [], tiny: [], broken: [], narrow: [], overlapping: [] };
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; const c = String(typeof el.className === "string" ? el.className : "").trim().split(/\s+/).filter(Boolean).slice(0, 2); return c.length ? s + "." + c.join(".") : s; };
  const shown = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.05 && !el.closest("[hidden],[inert],[aria-hidden='true'],details:not([open]) > :not(summary),.kw-sr-only,.sr-only"); };
  const scrollable = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox === "auto" || ox === "scroll" || ox === "hidden" || ox === "clip") return true; } return false; };
  out.overflowX = Math.max(0, document.documentElement.scrollWidth - vw);
  for (const el of document.body.querySelectorAll("*")) {
    if (out.wide.length >= 12) break;
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if ((r.right > vw + 1 || r.left < -1) && !scrollable(el) && getComputedStyle(el).position !== "fixed") out.wide.push({ sel: sel(el), left: Math.round(r.left), right: Math.round(r.right) });
  }
  for (const el of document.body.querySelectorAll("h1,h2,h3,p,li,a,button,span,label")) {
    if (out.clipped.length >= 10) break;
    if (!shown(el) || !el.textContent.trim()) continue;
    const cs = getComputedStyle(el);
    if ((cs.overflow === "hidden" || cs.textOverflow === "ellipsis") && el.scrollWidth > el.clientWidth + 2 && cs.display !== "inline") out.clipped.push({ sel: sel(el), text: el.textContent.trim().slice(0, 30) });
  }
  const seen = new Set();
  if (o.touch) for (const el of document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button]")) {
    if (!shown(el)) continue;
    const cs = getComputedStyle(el); if (cs.display === "inline" && el.closest("p,li,td,dd,label,.kw-prose,.kw-text")) continue;
    const r = el.getBoundingClientRect(); if (r.height >= o.minTarget && r.width >= o.minTarget) continue;
    const k = sel(el) + Math.round(r.width) + "x" + Math.round(r.height); if (seen.has(k)) continue; seen.add(k);
    out.small.push({ sel: sel(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24) });
  }
  for (const el of document.body.querySelectorAll("p,li,a,button,span,td,label,h1,h2,h3,h4")) {
    if (out.tiny.length >= 10) break;
    if (!shown(el) || ![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < o.minFont) out.tiny.push({ sel: sel(el), px: fs });
  }
  for (const img of document.images) { if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) out.broken.push({ src: String(img.getAttribute("src")).slice(0, 80) }); }
  // colonnes trop étroites : conteneurs de texte (≥ 40 caractères) plus étroits que 180 px
  for (const el of document.body.querySelectorAll("p,h1,h2,h3,li")) {
    if (out.narrow.length >= 8) break;
    if (!shown(el) || el.textContent.trim().length < 40) continue;
    const w = el.getBoundingClientRect().width; if (w < 180 && vw >= 320) out.narrow.push({ sel: sel(el), w: Math.round(w) });
  }
  // zoom : la page ne doit pas bloquer le zoom utilisateur
  const meta = document.querySelector('meta[name="viewport"]'); const c = meta ? meta.getAttribute("content") || "" : "";
  out.zoomBlocked = /user-scalable\s*=\s*(no|0)/i.test(c) || /maximum-scale\s*=\s*1(\.0)?(?![\d])/i.test(c);
  out.hasViewportMeta = Boolean(meta);
  return out;
}
// Constats chiffrés → même forme que l'audit statique (gravité, écran, preuve)
function toIssues(m, { page = "", profile }) {
  const mk = (rule, severity, message, evidence, element = "") => ({ rule, severity, page, device: profile.device, viewport: `${profile.width}px`, profile: profile.key, element, message, evidence, source: "browser" });
  const out = [];
  if (m.overflowX > 1) out.push(mk("overflow-x", "blocking", `Défilement horizontal de ${m.overflowX} px à ${profile.width} px.`, `scrollWidth - clientWidth = ${m.overflowX}`, (m.wide[0] || {}).sel));
  for (const w of m.wide.slice(0, 3)) out.push(mk("element-out-of-view", "blocking", `Élément qui dépasse l'écran (${w.left} → ${w.right} px sur ${m.vw} px).`, `left=${w.left} right=${w.right}`, w.sel));
  for (const c of m.clipped.slice(0, 3)) out.push(mk("text-clipped", "warning", "Texte coupé.", c.text, c.sel));
  if (profile.touch) for (const s of m.small.slice(0, 6)) out.push(mk("tap-target", s.h < 24 ? "warning" : "suggestion", `Cible tactile de ${s.w}×${s.h} px (recommandé : 44, minimum mesuré : 32).`, `${s.w}x${s.h}`, s.text ? `${s.sel} « ${s.text} »` : s.sel));
  for (const t of m.tiny.slice(0, 3)) out.push(mk("tiny-text", "warning", `Texte de ${t.px} px.`, `font-size=${t.px}`, t.sel));
  for (const b of m.broken.slice(0, 3)) out.push(mk("broken-image", "blocking", "Image qui ne se charge pas.", b.src));
  for (const n of m.narrow.slice(0, 3)) out.push(mk("narrow-column", "warning", `Colonne de texte de ${n.w} px seulement.`, `width=${n.w}`, n.sel));
  if (m.zoomBlocked) out.push(mk("zoom-blocked", "blocking", "Le zoom de l'utilisateur est bloqué (viewport) : contraire à l'accessibilité (WCAG 1.4.4).", "meta viewport"));
  if (!m.hasViewportMeta) out.push(mk("viewport-meta", "blocking", "Balise meta viewport absente : la page s'affiche en bureau réduit sur téléphone.", ""));
  return out;
}
module.exports = { measure, toIssues };
