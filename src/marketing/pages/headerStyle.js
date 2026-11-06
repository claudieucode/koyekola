// Entête d'un site : réglages (settings.header, voir headerSettings.js) → CSS réellement appliqué à l'entête publié ET à l'aperçu du personnalisateur (même fonction).
// Sélecteurs : l'entête automatique (.lp-autohead) et le composant d'en-tête du Theme Builder (.lp-site-header) pour la structure, la marge, la transparence et le menu ;
// le logo, le titre, le slogan et le menu hors-champ n'existent que dans l'entête automatique. Une règle n'est écrite que si le réglage est renseigné (rien par défaut :
// un site qui n'a jamais ouvert « Entête » garde EXACTEMENT son rendu actuel). Aucune valeur n'est copiée sans validation : tout vient de headerSettings.normalize.
const HS = require("./headerSettings");

const HEAD = ".lp-autohead, .lp-site-header";
const NAV = ".lp-autohead-nav, .lp-site-header .kw-menu-list";
const LINK = ".lp-autohead .kw-menu-link, .lp-site-header .kw-menu-link";
const SUBLINK = ".lp-autohead .kw-submenu .kw-menu-link, .lp-site-header .kw-submenu .kw-menu-link";
const SUB = ".lp-autohead .kw-submenu, .lp-site-header .kw-submenu";
const OCNAV = ".lp-oc-nav";

// Couleur : « token:nom » → variable CSS du site ; sinon le code hexadécimal validé
const color = (v) => (!v ? "" : v.startsWith("token:") ? `var(--kw-${v.slice(6)}, currentColor)` : v);
const px = (n) => `${n}px`;
// « haut,droite,bas,gauche;unité » → valeur CSS (une case vide = 0)
function spaceCss(v) {
  if (!v) return "";
  const [body, unit = "px"] = v.split(";");
  return body.split(",").map((x) => (x === "" ? "0" : x === "0" ? "0" : x + unit)).join(" ");
}
const decl = (pairs) => pairs.filter(([, v]) => v !== "" && v !== null && v !== undefined && v !== false).map(([k, v]) => `${k}:${v}`).join(";");
const rule = (sel, pairs) => { const d = decl(pairs); return d ? `${sel}{${d}}` : ""; };

// Plages d'appareils d'après les points de rupture du site
function ranges(bp) {
  const tablet = (bp && bp.tablet) || 1023, mobile = (bp && bp.mobile) || 767;
  return {
    "": "", T: `(max-width:${tablet}px)`, M: `(max-width:${mobile}px)`,
    // appareils exclusifs, pour la visibilité et les modes (ordinateur / tablette / mobile)
    d: `(min-width:${tablet + 1}px)`, t: `(min-width:${mobile + 1}px) and (max-width:${tablet}px)`, m: `(max-width:${mobile}px)`,
  };
}
const media = (q, css) => (!css ? "" : q ? `@media ${q}{${css}}` : css);

// Un réglage par appareil : base + @media tablette + @media mobile (la tablette hérite de l'ordinateur, le mobile de la tablette : cascade naturelle)
function perDevice(h, key, R, build) {
  return DEV.map((d) => {
    const v = h[key + d];
    if (v === null || v === undefined || v === "") return "";
    return media(R[d], build(v));
  }).join("");
}
const DEV = ["", "T", "M"];

// Masque de visibilité : cache l'élément sur les appareils absents du sous-ensemble « dtm »
function visCss(sel, vis, R) {
  const hide = [...("dtm")].filter((d) => !vis.includes(d));
  if (!hide.length) return "";
  return hide.map((d) => media(R[d], `${sel}{display:none!important}`)).join("");
}

// logoUrl / tpLogoUrl : adresses déjà validées par le moteur d'images du site ; hasLogo : un logo est affiché (le titre « auto » s'efface alors)
const safeUrl = (u) => (typeof u === "string" && /^[\w\-./:%?=&+~@!,;]{1,500}$/.test(u) ? u : "");
function headerCss(header, { breakpoints, containerWidth = 1100, logoUrl = "", tpLogoUrl = "", hasLogo = false } = {}) {
  const h = HS.normalize(header, {});
  const R = ranges(breakpoints);
  const out = [];
  const push = (x) => { if (x) out.push(x); };

  // ----- Structure de l'entête -----
  if (h.width === "contained") push(`.lp-autohead{padding-left:max(24px,calc((100% - ${containerWidth}px) / 2));padding-right:max(24px,calc((100% - ${containerWidth}px) / 2))}`);
  push(perDevice(h, "margin", R, (v) => rule(HEAD, [["margin", spaceCss(v)]])));
  push(perDevice(h, "rowHeight", R, (v) => rule(HEAD, [["min-height", px(v)]])));
  push(perDevice(h, "rowPadding", R, (v) => rule(HEAD, [["padding", spaceCss(v)]])));
  if (h.rowAlign !== "between") push(rule(".lp-autohead", [["justify-content", { start: "flex-start", center: "center", end: "flex-end" }[h.rowAlign]]]));
  push(rule(HEAD, [["background", color(h.rowBg)]]));
  if (h.rowBorder !== null) push(rule(HEAD, [["border-bottom-width", px(h.rowBorder)], ["border-bottom-style", h.rowBorder > 0 ? "solid" : "none"]]));
  if (h.rowBorderColor) push(rule(HEAD, [["border-bottom-color", color(h.rowBorderColor)]]));

  // ----- Titre et logo -----
  push(perDevice(h, "logoWidth", R, (v) => rule(".lp-autohead-brand .lp-ah-logo-img", [["width", px(v)], ["max-width", "none"], ["height", "auto"]])));
  // Logo « SVG / masque » : le fichier sert de masque, la couleur choisie le remplit (l'image d'origine reste en dessous, invisible, pour la taille et l'accessibilité)
  const maskRule = (sel, u) => (safeUrl(u) ? rule(sel, [["-webkit-mask", `url("${safeUrl(u)}") center / contain no-repeat`], ["mask", `url("${safeUrl(u)}") center / contain no-repeat`]]) : "");
  if (h.logoSvg) push(maskRule(".lp-ah-logo-main.is-mask", logoUrl));
  if (h.logoSvg && h.tpLogo) push(maskRule(".lp-ah-logo-tp.is-mask", tpLogoUrl));
  push(perDevice(h, "titleSize", R, (v) => rule(".lp-ah-title", [["font-size", px(v)]])));
  push(perDevice(h, "identityMargin", R, (v) => rule(".lp-autohead-brand", [["margin", spaceCss(v)]])));
  if (!h.sameLine) push(".lp-autohead-brand{flex-direction:column;align-items:flex-start;gap:6px}");
  push(rule(".lp-ah-title", [["color", color(h.titleColor)]]));
  push(rule(".lp-autohead-brand:hover .lp-ah-title", [["color", color(h.titleHover)]]));
  push(rule(".lp-ah-tagline", [["color", color(h.taglineColor)]]));
  if (h.logoColor) push(rule(".lp-ah-logo.is-mask", [["background-color", color(h.logoColor)]]));
  push(visCss(".lp-ah-title", HS.effectiveVis(h.titleVis, hasLogo), R));
  push(visCss(".lp-ah-tagline", h.taglineVis, R));
  push(visCss(".lp-autohead-brand", h.logoVis, R)); // « Visibilité » : tout le bloc identité (logo, titre, slogan)

  // ----- Menu principal -----
  const hasOc = h.ocVis.length > 0;
  push(visCss(".lp-autohead-nav", h.menuVis, R));
  if (hasOc) for (const d of h.ocVis.split("")) push(media(R[d], ".lp-autohead-nav{display:none!important}"));
  push(rule(LINK, [["color", color(h.menuColor)], ["background-color", color(h.menuBg)]]));
  push(rule(LINK.replace(/,/g, ":hover,") + ":hover", [["color", color(h.menuColorHover)], ["background-color", color(h.menuBgHover)]]));
  push(rule(`${LINK.split(",").map((x) => x.trim() + '[aria-current="page"]').join(",")}`, [["color", color(h.menuColorActive)], ["background-color", color(h.menuBgActive)]]));
  push(rule(SUB, [["background", color(h.menuSubBg)]]));
  push(rule(SUBLINK, [["color", color(h.menuSubColor)]]));
  if (h.menuSubWidth !== null) push(rule(SUB, [["min-width", px(h.menuSubWidth)], ["width", px(h.menuSubWidth)]]));
  if (h.menuSubOffset !== null) push(rule(SUB, [["top", `calc(100% + ${h.menuSubOffset}px)`]]) + `${SUB.split(",").map((x) => x.trim() + "::before").join(",")}{content:"";position:absolute;left:0;right:0;top:-${h.menuSubOffset}px;height:${h.menuSubOffset}px}`);
  if (h.menuSubBorder) push(rule(SUB, [["border-style", "solid"], ["border-width", spaceCss(h.menuSubBorder)], ["border-color", color(h.menuSubBorderColor) || "currentColor"]]));
  else if (h.menuSubBorderColor) push(rule(SUB, [["border-color", color(h.menuSubBorderColor)]]));
  if (h.menuSubRadius) push(rule(SUB, [["border-radius", spaceCss(h.menuSubRadius)], ["overflow", "hidden"]]));
  push(rule(NAV, [["font-family", h.menuFont ? `var(--kw-font-${h.menuFont}, inherit)` : ""], ["font-weight", h.menuWeight], ["line-height", h.menuLineHeight], ["letter-spacing", h.menuLetter !== null ? `${h.menuLetter}em` : ""], ["text-transform", h.menuTransform]]));
  push(perDevice(h, "menuSize", R, (v) => rule(`${NAV}, ${LINK}`, [["font-size", px(v)]])));
  push(perDevice(h, "menuPadding", R, (v) => rule(LINK, [["padding", spaceCss(v)]])));
  push(perDevice(h, "menuMargin", R, (v) => rule(".lp-autohead-nav, .lp-site-header .kw-menu-list", [["margin", spaceCss(v)]])));
  if (h.menuSeparator) push(`${LINK.split(",").map((x) => x.trim().replace(".kw-menu-link", ".kw-menu-item + .kw-menu-item > .kw-menu-link")).join(",")}{box-shadow:-1px 0 0 color-mix(in srgb, currentColor 28%, transparent)}`);
  // Survol : chaque style est un vrai effet visuel (aucun choix sans rendu)
  const hv = {
    underline: `${LINK.replace(/,/g, ":hover,")}:hover{text-decoration:underline;text-underline-offset:4px}`,
    "underline-anim": `${LINK}{background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:0 100%;background-size:0 2px;transition:background-size .25s ease}${LINK.replace(/,/g, ":hover,")}:hover{background-size:100% 2px;text-decoration:none}`,
    bg: `${LINK.replace(/,/g, ":hover,")}:hover{background-color:${color(h.menuBgHover) || "color-mix(in srgb, currentColor 12%, transparent)"};text-decoration:none}`,
    outline: `${LINK.replace(/,/g, ":hover,")}:hover{box-shadow:inset 0 0 0 2px currentColor;text-decoration:none}`,
    overline: `${LINK.replace(/,/g, ":hover,")}:hover{box-shadow:0 -2px 0 currentColor;text-decoration:none}`,
  };
  if (h.menuHover !== "none") push(hv[h.menuHover]);
  // Animation des sous-menus : visibilité + opacité (le menu reste accessible au clavier : focus-within)
  if (h.menuSubAnim !== "none") {
    const from = { fade: "", slide: "transform:translateY(8px);", zoom: "transform:scale(.96);transform-origin:top left;" }[h.menuSubAnim];
    push(`${SUB}{display:block!important;visibility:hidden;opacity:0;${from}transition:opacity .2s ease,transform .2s ease,visibility 0s linear .2s}`);
    push(`${SUB.split(",").map((x) => x.trim().replace(".kw-submenu", ".has-sub:hover > .kw-submenu")).join(",")},${SUB.split(",").map((x) => x.trim().replace(".kw-submenu", ".has-sub:focus-within > .kw-submenu")).join(",")}{visibility:visible;opacity:1;transform:none;transition-delay:0s}`);
    push("@media (prefers-reduced-motion:reduce){.lp-autohead .kw-submenu,.lp-site-header .kw-submenu{transition:none!important}}");
  }

  // ----- Menu hors-champ -----
  if (hasOc) {
    const root = ".lp-autohead";
    for (const d of "dtm".split("")) {
      if (h.ocVis.includes(d)) push(media(R[d], `${root} .lp-oc-toggle{display:inline-flex}`));
      else push(media(R[d], `${root} .lp-oc,${root} .lp-oc-backdrop{display:none!important}`));
    }
  }
  push(rule(`${OCNAV} .kw-menu-link`, [["color", color(h.ocColor)]]));
  push(rule(`${OCNAV} .kw-menu-link:hover`, [["color", color(h.ocColorHover)], ["background-color", color(h.ocBgHover)]]));
  push(rule(`${OCNAV} .kw-menu-link[aria-current="page"]`, [["color", color(h.ocColorActive)]]));
  push(rule(".lp-oc", [["background", color(h.ocBg)], ["font-family", h.ocFont ? `var(--kw-font-${h.ocFont}, inherit)` : ""], ["font-weight", h.ocWeight], ["line-height", h.ocLineHeight], ["letter-spacing", h.ocLetter !== null ? `${h.ocLetter}em` : ""]]));
  push(rule(`${OCNAV} .kw-submenu`, [["background", color(h.ocSubBg)]]));
  push(rule(`${OCNAV} .kw-submenu .kw-menu-link`, [["color", color(h.ocSubColor)]]));
  push(rule(".lp-oc-toggle", [["color", color(h.ocTriggerColor)]]));
  push(perDevice(h, "ocSize", R, (v) => rule(`${OCNAV}, ${OCNAV} .kw-menu-link`, [["font-size", px(v)]])));
  push(perDevice(h, "ocPadding", R, (v) => rule(`${OCNAV} .kw-menu-link`, [["padding", spaceCss(v)]])));
  push(perDevice(h, "ocMargin", R, (v) => rule(OCNAV, [["margin", spaceCss(v)]])));
  if (h.ocSeparator) push(`${OCNAV} .kw-menu-item + .kw-menu-item{border-top:1px solid color-mix(in srgb, currentColor 22%, transparent)}`);

  // ----- Entête transparent -----
  if (h.tpEnabled) {
    // la tablette suit le mobile : « mobile » = tablette + mobile (≤ point de rupture tablette)
    const tp = (css) => (h.tpOn === "both" ? css : h.tpOn === "desktop" ? media(R.d, css) : media(R.T, css));
    const tpHead = ".lp-autohead, .lp-site-header";
    push(tp(`${tpHead}{position:absolute;top:0;left:0;right:0;z-index:30;background:${color(h.tpBg) || "transparent"}!important;box-shadow:none}`));
    if (h.tpBorder !== null) push(tp(rule(tpHead, [["border-bottom-width", px(h.tpBorder)], ["border-bottom-style", h.tpBorder > 0 ? "solid" : "none"]])));
    push(tp(rule(".lp-ah-title", [["color", color(h.tpTitle)]])));
    push(tp(rule(".lp-autohead-brand:hover .lp-ah-title", [["color", color(h.tpTitleHover)]])));
    push(tp(rule(".lp-ah-tagline", [["color", color(h.tpTagline)]])));
    push(tp(rule(".lp-ah-logo.is-mask", [["background-color", color(h.tpLogoColor)]])));
    push(tp(rule(LINK, [["color", color(h.tpMenuColor)], ["background-color", color(h.tpMenuBg)]])));
    push(tp(rule(LINK.replace(/,/g, ":hover,") + ":hover", [["color", color(h.tpMenuColorHover)], ["background-color", color(h.tpMenuBgHover)]])));
    push(tp(rule(LINK.split(",").map((x) => x.trim() + '[aria-current="page"]').join(","), [["color", color(h.tpMenuColorActive)], ["background-color", color(h.tpMenuBgActive)]])));
    push(tp(rule(SUB, [["background", color(h.tpSubBg)]])));
    push(tp(rule(SUBLINK, [["color", color(h.tpSubColor)]])));
    push(tp(rule(".lp-oc-toggle", [["color", color(h.tpTriggerColor)]])));
    if (h.tpLogo) {
      push(tp(".lp-ah-logo-main{display:none!important}"));
      push(".lp-ah-logo-tp{display:none}");
      push(tp(".lp-ah-logo-tp{display:inline-block}"));
    }
  }
  return out.join("\n");
}

module.exports = { headerCss };
