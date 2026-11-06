// Styles du thème d'un site (Typographie, Boutons, Images, Champs de formulaire) : traduction des jetons en règles CSS.
//
// Hiérarchie des styles (du plus général au plus local ; le plus local gagne) :
//   1. réglages globaux du site (tokens → variables --kw-…, feuille de style landing.css)
//   2. styles du thème (ce fichier) : sélecteurs en :where(), donc de faible spécificité, écrits AVANT les styles des éléments
//   3. classes et styles de l'élément (.kw-n-<id>, posés dans l'inspecteur) : écrits APRÈS, ils l'emportent toujours
//   4. CSS personnalisé du site (siteSettings.js), puis CSS de la page
// Seules les valeurs réellement réglées produisent du CSS : un réglage laissé vide ne change rien à l'aspect d'origine.
// Toutes les valeurs ont été validées par normalizeTokens (nombres bornés, couleurs #rrggbb ou token:<clé>, listes fermées).
const { SHADOWS } = require("./tokens");

const colorCss = (v) => (!v ? "" : v.startsWith("token:") ? `var(--kw-${v.slice(6)})` : v);
const px = (n) => `${n}px`;

function themeCss(tokens) {
  const t = tokens;
  const out = [];
  const rule = (selector, decls) => { const d = decls.filter(Boolean).join(";"); if (d) out.push(`${selector}{${d}}`); };

  // ---- Typographie : détails par niveau (la taille, la graisse et la hauteur de ligne passent déjà par landing.css)
  const level = (k, sels) => {
    const v = t.type[k];
    rule(sels, [
      v.letterSpacing ? `letter-spacing:${v.letterSpacing}em` : "",
      v.transform !== "none" ? `text-transform:${v.transform}` : "",
      v.fontStyle !== "normal" ? `font-style:${v.fontStyle}` : "",
      v.color ? `color:${colorCss(v.color)}` : "",
    ]);
  };
  for (const k of ["h1", "h2", "h3", "h4", "h5", "h6"]) level(k, `.lp-site :where(${k}.kw-heading)`);
  level("body", ".lp-site :where(.kw-text, .kw-list, .kw-quote, .kw-toggle-body, .kw-alert-body)");
  level("caption", ".lp-site :where(figcaption, .kw-tl-date, .kw-counter-label)");
  // Texte des boutons : mêmes détails, appliqués à tous les boutons
  level("button", ".lp-site :where(.kw-button, .lp-btn)");

  // ---- Liens du texte
  const links = ".lp-site .kw-text a, .lp-site .lp-text a, .lp-site .kw-list a, .lp-site .kw-quote a, .lp-site .kw-toggle-body a, .lp-site .kw-alert-body a";
  const l = t.link;
  rule(links, [l.color ? `color:${colorCss(l.color)}` : "", l.underline === "always" ? "text-decoration:underline" : l.underline === "hover" || l.underline === "none" ? "text-decoration:none" : ""]);
  if (l.hoverColor || l.underline === "hover") {
    rule(links.split(", ").map((x) => `${x}:hover`).join(", "), [l.hoverColor ? `color:${colorCss(l.hoverColor)}` : "", l.underline === "hover" ? "text-decoration:underline" : ""]);
  }

  // ---- Listes
  if (t.list.gap !== null) rule(".lp-site :where(.kw-list) > li", [`margin-block:${px(t.list.gap / 2)}`]);
  if (t.list.markerColor) rule(".lp-site :where(.kw-list) li::marker", [`color:${colorCss(t.list.markerColor)}`]);

  // ---- Boutons : dimensions et bordure pour tous, couleurs et états pour le bouton principal (et les boutons de section)
  const b = t.buttons;
  rule(".lp-site :where(.kw-button, .lp-btn)", [
    b.paddingY !== null ? `padding-block:${px(b.paddingY)}` : "", b.paddingX !== null ? `padding-inline:${px(b.paddingX)}` : "",
    b.borderWidth !== null ? `border-width:${px(b.borderWidth)}` : "",
  ]);
  const primary = ".lp-site :where(.kw-btn-primary, .lp-btn)";
  const stateDecls = (s) => [s.bg ? `background:${colorCss(s.bg)}` : "", s.color ? `color:${colorCss(s.color)}` : "", s.border ? `border-color:${colorCss(s.border)}` : ""];
  rule(primary, stateDecls(b.normal));
  rule(primary.replace(/\)$/, "):hover"), stateDecls(b.hover));
  rule(primary.replace(/\)$/, "):active"), stateDecls(b.active));
  if (b.focus.color || b.focus.width !== null || b.focus.offset !== null) {
    rule(".lp-site :where(.kw-button, .lp-btn, .kw-link):focus-visible", [
      b.focus.color || b.focus.width !== null ? `outline:${px(b.focus.width === null ? 3 : b.focus.width)} solid ${b.focus.color ? colorCss(b.focus.color) : "var(--lp-accent, #0277b6)"}` : "",
      b.focus.offset !== null ? `outline-offset:${px(b.focus.offset)}` : "",
    ]);
  }

  // ---- Images : le rayon est posé sur le conteneur (un rayon d'élément le remplace) ; bordure et ombre sur l'image
  const im = t.images;
  if (im.radius !== null) {
    rule(".lp-site :where(.kw-image, .kw-imagebox .kw-box-media)", [`border-radius:${px(im.radius)}`]);
    rule(".lp-site :where(.kw-gallery-item img, .kw-carousel img, .kw-hotspot-stage > img)", [`border-radius:${px(im.radius)}`]);
  }
  const imgs = ".lp-site :where(.kw-image img, .kw-imagebox .kw-box-media img, .kw-gallery-item img, .kw-carousel img, .kw-hotspot-stage > img)";
  rule(imgs, [
    im.borderWidth !== null ? `border:${px(im.borderWidth)} solid ${im.borderColor ? colorCss(im.borderColor) : "var(--kw-border-color, rgba(16,34,47,.2))"}` : im.borderColor ? `border:1px solid ${colorCss(im.borderColor)}` : "",
    im.shadow ? `box-shadow:${SHADOWS[im.shadow]}` : "",
  ]);
  if (im.fit || im.position) {
    rule(".lp-site .kw-gallery-item img, .lp-site .kw-carousel img, .lp-site .kw-post-card img, .lp-site .kw-course-card img", [
      im.fit ? `object-fit:${im.fit}` : "", im.position ? `object-position:${im.position}` : "",
    ]);
  }

  // ---- Champs de formulaire (formulaire d'inscription, recherche) ; le bouton d'envoi suit les boutons
  const f = t.forms;
  const fields = ".lp-site .kw-signup-form input:not([type=checkbox]):not([type=radio]):not([type=hidden]), .lp-site .kw-signup-form select, .lp-site .kw-signup-form textarea, .lp-site .kw-search input";
  rule(fields, [
    f.bg ? `background:${colorCss(f.bg)}` : "", f.color ? `color:${colorCss(f.color)}` : "",
    f.borderWidth !== null || f.borderColor ? `border:${px(f.borderWidth === null ? 1 : f.borderWidth)} solid ${f.borderColor ? colorCss(f.borderColor) : "rgba(16,34,47,.25)"}` : "",
    f.radius !== null ? `border-radius:${px(f.radius)}` : "",
    f.paddingY !== null ? `padding-block:${px(f.paddingY)}` : "", f.paddingX !== null ? `padding-inline:${px(f.paddingX)}` : "",
  ]);
  if (f.focusColor) rule(fields.split(", ").map((x) => `${x}:focus-visible`).join(", "), [`outline:3px solid ${colorCss(f.focusColor)}`, "outline-offset:2px", `border-color:${colorCss(f.focusColor)}`]);
  if (f.placeholderColor) rule(fields.split(", ").map((x) => `${x}::placeholder`).join(", "), [`color:${colorCss(f.placeholderColor)}`, "opacity:1"]);
  if (f.labelColor) rule(".lp-site .kw-signup-form label, .lp-site .kw-signup-form legend", [`color:${colorCss(f.labelColor)}`]);
  if (f.accent) rule(".lp-site .kw-signup-form input[type=checkbox], .lp-site .kw-signup-form input[type=radio]", [`accent-color:${colorCss(f.accent)}`]);

  // ---- Réglages globaux du personnalisateur (niveau 2 de la hiérarchie) : écrits après les styles du thème, avant ceux des éléments
  if (t.global) { const g = require("./globalStyles").globalCss(t.global, "site"); if (g) out.push(g); }

  return out.join("\n");
}

module.exports = { themeCss, colorCss };
