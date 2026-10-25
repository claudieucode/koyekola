// Mesures de géométrie exécutées DANS la page (page.evaluate) : renvoient des constats {kind, sel, detail}.
// Mesures exécutées dans la page : retournent des constats {kind, sel, detail}.
function measure() {
  const out = [];
  const vw = window.innerWidth;
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += "#" + el.id; const c = (el.className && el.className.baseVal === undefined ? String(el.className) : "").trim().split(/\s+/).filter(Boolean).slice(0, 3); if (c.length) s += "." + c.join("."); return s; };
  // invisible = hors rendu : contenu d'un <details> fermé (hors <summary>), [hidden], [inert], aria-hidden, display:none, opacité nulle
  const closed = (el) => { for (let p = el; p && p !== document.body; p = p.parentElement) { if (p.tagName === "DETAILS" && !p.open) { const s = p.querySelector(":scope > summary"); if (!(s && s.contains(el))) return true; } if (p.hidden || p.hasAttribute("inert") || p.getAttribute("aria-hidden") === "true") return true; } return false; };
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0 && !closed(el); };
  const inScroller = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const o = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(o.overflowX) && p.scrollWidth > p.clientWidth + 1) return true; } return false; };
  const root = document.documentElement;
  if (root.scrollWidth - vw > 1) out.push({ kind: "h-scroll", sel: "html", detail: `${root.scrollWidth - vw}px de défilement horizontal` });
  const all = [...document.querySelectorAll("body *")].filter(vis);
  // 1) éléments qui dépassent le bord droit de la fenêtre (hors zones à défilement volontaire)
  const beyond = all.filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 2 && !inScroller(el) && getComputedStyle(el).position !== "fixed"; });
  const tops = beyond.filter((el) => !beyond.includes(el.parentElement));
  for (const el of tops.slice(0, 6)) out.push({ kind: "hors-cadre", sel: sel(el), detail: `bord droit à ${Math.round(el.getBoundingClientRect().right)}px pour ${vw}px` });
  // 2) texte coupé dans un bouton / lien / champ / étiquette (contenu plus large que la boîte, sans ellipse volontaire)
  for (const el of all.filter((e) => /^(BUTTON|A|LABEL|SUMMARY|TH|SELECT)$/.test(e.tagName) || e.matches("[class*=btn],[class*=chip],[class*=tab],[class*=badge],[class*=pill]"))) {
    const cs = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 2 && cs.display !== "inline" && /(hidden|clip)/.test(cs.overflowX) && cs.textOverflow !== "ellipsis") out.push({ kind: "texte-coupé", sel: sel(el), detail: `${el.scrollWidth}px de contenu dans ${el.clientWidth}px — « ${(el.textContent || "").trim().slice(0, 40)} »` });
  }
  // 3) boutons démesurés : très larges sans être dans un conteneur étroit, ou très hauts
  for (const el of all.filter((e) => e.matches("button,.btn,a[class*=btn],input[type=submit]"))) {
    const r = el.getBoundingClientRect(); const txt = (el.textContent || "").trim();
    if (r.width > 560 && txt.length < 40 && vw > 700) out.push({ kind: "bouton-étiré", sel: sel(el), detail: `${Math.round(r.width)}×${Math.round(r.height)}px pour « ${txt.slice(0, 30)} »` });
    if (r.height > 90 && txt.length < 30) out.push({ kind: "bouton-haut", sel: sel(el), detail: `${Math.round(r.width)}×${Math.round(r.height)}px pour « ${txt.slice(0, 30)} »` });
  }
  // 4) rangées de commandes de hauteurs ou de lignes de base incohérentes
  const rows = new Map();
  for (const el of all.filter((e) => e.matches("button,.btn,a[class*=btn],input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select"))) {
    if (!el.parentElement) continue; const r = el.getBoundingClientRect();
    const key = el.parentElement; if (!rows.has(key)) rows.set(key, []); rows.get(key).push({ el, r });
  }
  for (const [parent, items] of rows) {
    if (items.length < 2) continue;
    const line = {}; for (const it of items) { const k = Math.round(it.r.top / 6); (line[k] = line[k] || []).push(it); }
    for (const grp of Object.values(line)) {
      if (grp.length < 2) continue;
      const hs = grp.map((g) => Math.round(g.r.height)); const mn = Math.min(...hs), mx = Math.max(...hs);
      if (mx - mn >= 6 && mn > 0 && !grp.some((g) => g.el.tagName === "TEXTAREA")) out.push({ kind: "hauteurs-incohérentes", sel: sel(parent), detail: `hauteurs ${[...new Set(hs)].join("/")}px (${grp.map((g) => sel(g.el)).slice(0, 3).join(", ")})` });
    }
  }
  // 5) commandes qui se chevauchent
  const ctrls = all.filter((e) => e.matches("button,a.btn,input:not([type=hidden]),select,textarea,[role=button]")).filter((e) => !e.closest("[hidden],dialog:not([open])"));
  let overlaps = 0;
  for (let i = 0; i < ctrls.length && overlaps < 6; i += 1) {
    const a = ctrls[i].getBoundingClientRect();
    for (let j = i + 1; j < Math.min(ctrls.length, i + 40); j += 1) {
      if (ctrls[i].contains(ctrls[j]) || ctrls[j].contains(ctrls[i])) continue;
      const b = ctrls[j].getBoundingClientRect(); const w = Math.min(a.right, b.right) - Math.max(a.left, b.left); const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (w > 4 && h > 4 && w * h > 0.25 * Math.min(a.width * a.height, b.width * b.height)) { out.push({ kind: "chevauchement", sel: `${sel(ctrls[i])} × ${sel(ctrls[j])}`, detail: `${Math.round(w)}×${Math.round(h)}px communs` }); overlaps += 1; }
    }
  }
  // 6) contenu masqué derrière une barre fixe en haut / en bas
  const fixed = all.filter((e) => getComputedStyle(e).position === "fixed" && e.getBoundingClientRect().width > vw * 0.6 && e.getBoundingClientRect().height < 120);
  if (fixed.length > 2) out.push({ kind: "barres-fixes-multiples", sel: fixed.map(sel).join(" | "), detail: `${fixed.length} barres fixes pleine largeur` });
  // 7) images sans dimensions réservées (source de sauts) ou cassées
  for (const im of [...document.images].filter(vis)) if (im.complete && im.naturalWidth === 0) out.push({ kind: "image-cassée", sel: sel(im), detail: im.getAttribute("src") });
  return out;
}

module.exports = { measure };
