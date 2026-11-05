// Contrôle de mise en page exécuté DANS la page (Chrome) : débordement, éléments hors écran, chevauchements, texte coupé / mot coupé, contraste illisible, rendu vide.
// Partagé par les tests de rendu navigateur de la bibliothèque (tests/bibliotheque-100-rendu-navigateur, tests/theme-builder-article-individuel-navigateur).
// Exécuté dans la page : liste des défauts de mise en page visibles
const INSPECT = () => {
  const out = [], vw = document.documentElement.clientWidth, root = document.querySelector("main") || document.body;
  if (document.documentElement.scrollWidth > vw + 1) out.push(`débordement horizontal : ${document.documentElement.scrollWidth}px > ${vw}px`);
  if (root.querySelectorAll('*').length < 3) out.push('rendu vide');
  const clipped = (e) => { for (let p = e.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) { const c = getComputedStyle(p); if (c.overflowX !== "visible" && c.overflowX !== "") return true; } return false; };
  const seen = new Set();
  const label = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
  for (const e of root.querySelectorAll("*")) {
    const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue;
    if ((r.right > vw + 2 || r.left < -2) && !clipped(e)) { const k = `off:${label(e)}`; if (!seen.has(k) && !e.closest("[data-skip-overflow]")) { seen.add(k); out.push(`dépasse l'écran : ${label(e)} (${Math.round(r.left)}→${Math.round(r.right)}px sur ${vw}px)`); } }
    if ((cs.overflow === "hidden" || cs.overflowX === "hidden") && e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && !/sr-only|visually-hidden|kw-rating-fill/.test(String(e.className)) && /^(A|BUTTON|H[1-6]|P|SPAN|LI)$/.test(e.tagName)) { const k = `cut:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`texte coupé : ${label(e)}`); } }
    // mot coupé au milieu : sans césure forcée, le texte déborderait de son bloc
    if (e.children.length === 0 && (e.textContent || "").trim().length > 3 && !/sr-only|visually-hidden/.test(String(e.className))) {
      const ow = e.style.overflowWrap, wb = e.style.wordBreak; e.style.overflowWrap = "normal"; e.style.wordBreak = "normal";
      const broke = e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && cs.display !== "inline" && (cs.overflowX === "visible"); e.style.overflowWrap = ow; e.style.wordBreak = wb;
      if (broke) { const k = `word:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`mot coupé au milieu : « ${(e.textContent || "").trim().slice(0, 40)} »`); } }
    }
    // texte invisible ou illisible : contraste texte / fond effectif inférieur à 2,2 (seuil volontairement bas : seuls les vrais défauts)
    if (e.children.length === 0 && (e.textContent || "").trim().length > 1 && parseFloat(cs.fontSize) >= 12 && r.width > 20 && !e.closest(".kw-marquee")) {
      const lum = (c) => { const m = c.match(/[\d.]+/g); if (!m) return null; let [R, G, B, A = 1] = m.map(Number); if (/^color\(srgb/.test(c)) { R *= 255; G *= 255; B *= 255; if (m.length > 4) A = Number(m[m.length - 1]); } if (A === 0) return null; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return { l: 0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B), a: A }; };
      let bg = null, imageBg = false; for (let p = e; p; p = p.parentElement) { if (getComputedStyle(p).backgroundImage !== "none") imageBg = true; const b = lum(getComputedStyle(p).backgroundColor); if (b && b.a > 0.9) { bg = b; break; } }
      const fg = lum(cs.color); bg = bg || { l: 1 };
      if (fg && fg.a > 0.5 && !imageBg) { const hi = Math.max(fg.l, bg.l), lo = Math.min(fg.l, bg.l), ratio = (hi + 0.05) / (lo + 0.05); if (ratio < 2.2 && cs.opacity !== "0") { const k = `contrast:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`texte illisible (contraste ${ratio.toFixed(1)}) : « ${(e.textContent || "").trim().slice(0, 30)} »`); } } }
    }
    if ((cs.display.includes("flex") || cs.display.includes("grid")) && e.children.length > 1 && e.children.length < 40) {
      const kids = [...e.children].filter((c) => { const s = getComputedStyle(c); return s.display !== "none" && s.position !== "absolute" && s.position !== "fixed"; }).map((c) => c.getBoundingClientRect()).filter((b) => b.width > 2 && b.height > 2);
      for (let i = 0; i < kids.length; i += 1) for (let j = i + 1; j < kids.length; j += 1) {
        const a = kids[i], b = kids[j], w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 4 && h > 4) { const k = `ov:${label(e)}`; if (!seen.has(k)) { seen.add(k); out.push(`chevauchement dans ${label(e)} (${Math.round(w)}×${Math.round(h)}px)`); } }
      }
    }
  }
  return out;
};

module.exports = { INSPECT };
