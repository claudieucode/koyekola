// Réglages du site (hors design system) : identité, arrière-plan, mise en page, visionneuse, transitions de page, CSS
// personnalisé et réglages supplémentaires. Stockés dans mk_sites.settings (JSON), validés ici, traduits en CSS ici.
// Les couleurs, polices et styles du thème vivent dans mk_sites.tokens (tokens.js, themeCss.js) : une seule source de vérité.
const { bad } = require("./sections");
const { COLOR_REF } = require("./tokens");
const { colorCss } = require("./themeCss");
const customHtml = require("../../utils/customHtml");

const DEFAULT_BREAKPOINTS = Object.freeze({ tablet: 1023, mobile: 767, wide: 1920 });
const LANGUAGES = { fr: "Français", en: "English", es: "Español", pt: "Português", de: "Deutsch", it: "Italiano", ar: "العربية", sw: "Kiswahili" };
const LB_ANIMATIONS = ["none", "fade", "zoom"];
const TRANSITION_TYPES = ["none", "fade", "slide"];
const BG_POSITIONS = ["center", "top", "bottom", "left", "right"];
const BG_SIZES = ["cover", "contain", "auto"];
const BG_REPEATS = ["no-repeat", "repeat", "repeat-x", "repeat-y"];
const MAX_CSS = 20000;
const MAX_CODE = 20000;

const DEFAULT_SETTINGS = Object.freeze({
  identity: { description: "", logoUrl: "", logoMobileUrl: "", faviconUrl: "" },
  background: { color: "", gradient: { enabled: false, from: "token:primary", to: "token:secondary", angle: 135 }, image: "", position: "center", size: "cover", repeat: "no-repeat", fixed: false },
  layout: { fullWidth: false, contentWidth: 760, containerWidth: 1100, gutter: 16, breakpoints: { tablet: 1023, mobile: 767, wide: 1920 } },
  lightbox: { enabled: true, overlay: "#050c14", overlayOpacity: 82, arrows: true, closeOnOverlay: true, captions: true, animation: "fade" },
  transitions: { type: "none", duration: 300 },
  // Valeurs propres à la tablette et au mobile (null = valeur globale). Appliquées sous les points de rupture du site (layout.breakpoints).
  responsive: { tablet: { h1: null, h2: null, h3: null, body: null, gutter: null, spaceLg: null, spaceXl: null }, mobile: { h1: null, h2: null, h3: null, body: null, gutter: null, spaceLg: null, spaceXl: null } },
  // Mode sombre du site : "off" = jamais ; "auto" = suit la préférence de la personne (système). Couleurs vides = couleur du site inchangée.
  dark: { mode: "off", background: "", surface: "", text: "", muted: "", primary: "" },
  customCss: "",
  // Code personnalisé (head, début et fin de body) : écrit par un compte « pages.code » et SIGNÉ côté serveur ; restitué seulement si la signature est valide
  customCode: { head: "", bodyStart: "", bodyEnd: "", sig: "" },
  classes: [],
  extras: { language: "fr", smoothScroll: false, noindex: false },
  // Référencement du site (palier 11) : valeurs par défaut des pages du site. La description du site est identity.description,
  // l'interdiction d'indexer tout le site est extras.noindex : une seule source pour chaque valeur.
  seo: { title: "", ogImage: "", publicUrl: "", follow: true },
  // Réglages généraux du site (palier 14) : fuseau horaire, formats de date et d'heure, page de confidentialité
  general: { timezone: "Europe/Paris", dateFormat: "long", timeFormat: "24h", weekStart: "monday", privacyPageId: null },
  // Lecture (Paramètres → Lecture) : ce que l'accueil affiche, page des articles, nombre d'articles par page, flux de syndication. La page d'accueil
  // elle-même reste mk_sites.home_page_id (une seule source) ; ici : le mode et les valeurs propres à la lecture.
  reading: { showOnFront: "page", postsPage: null, postsPerPage: 10, feedItems: 20, feedContent: "excerpt" },
  comments: null,
});

// Fuseau horaire reconnu par le moteur d'internationalisation du serveur (jamais une valeur libre)
const validTimezone = (tz) => { try { new Intl.DateTimeFormat("fr-FR", { timeZone: tz }); return typeof tz === "string" && tz.length > 0; } catch { return false; } };
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max) : "");

// Adresse d'une image : fichier de la médiathèque (/uploads/…) ou adresse https ; jamais de guillemet, parenthèse ou barre oblique inverse
function mediaUrl(v, label, strict) {
  const x = clean(v, 500);
  if (!x) return "";
  if (/^(\/uploads\/[A-Za-z0-9._\-\/]+|https:\/\/[A-Za-z0-9._~\-\/%?=&+:@]+)$/.test(x) && !x.includes("..")) return x;
  if (strict) throw bad(`${label} : choisissez une image de la médiathèque ou indiquez une adresse https.`);
  return "";
}
const colorRef = (v, label, strict, fallback = "") => {
  const x = v === undefined || v === null ? "" : String(v).trim();
  if (!x) return fallback;
  if (COLOR_REF.test(x)) return x.toLowerCase();
  if (strict) throw bad(`${label} : couleur attendue (code #rrggbb ou couleur du site).`);
  return fallback;
};
const bool = (v, fallback) => (v === undefined || v === null ? fallback : v === true || v === "true" || v === 1 || v === "1");
const num = (v, min, max, label, strict, fallback) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  if (Number.isFinite(n) && n >= min && n <= max) return Math.round(n);
  if (strict) throw bad(`${label} : un nombre entre ${min} et ${max} est attendu.`);
  return fallback;
};
const oneOf = (v, list, label, strict, fallback) => {
  if (v === undefined || v === null || v === "") return fallback;
  if (list.includes(v)) return v;
  if (strict) throw bad(`${label} : valeur inconnue.`);
  return fallback;
};

// CSS du site : des règles « sélecteurs { déclarations } », chaque sélecteur étant préfixé par .lp-site. Mêmes interdits
// que le CSS d'une page (aucun @, \, <, >, commentaire, ressource externe) ; pas de sélecteur sur html / body / :root.
function normalizeSiteCss(text, { strict = true } = {}) {
  const src = String(text ?? "").trim();
  if (!src) return "";
  const { cssDeclarations } = require("./nodes");
  const fail = (m) => { throw new Error(m); };
  if (src.length > MAX_CSS) fail(`CSS du site : ${MAX_CSS.toLocaleString("fr-FR")} caractères au plus.`);
  if (/@|\\|<|>|\/\*/.test(src)) fail("CSS du site : @, \\, <, > et commentaires ne sont pas autorisés.");
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m, used = 0;
  while ((m = re.exec(src))) {
    used += m[0].length;
    const sels = m[1].split(",").map((x) => x.trim()).filter(Boolean);
    if (!sels.length || sels.some((x) => !/^[a-z0-9 .#:_>+~*()\[\]="'-]{1,200}$/i.test(x) || /^(html|body|:root)\b/i.test(x))) fail(`CSS du site : sélecteur non autorisé « ${m[1].trim().slice(0, 50)} ».`);
    const decl = cssDeclarations(m[2], "CSS du site", 4000);
    if (decl) rules.push(`${sels.map((x) => `.lp-site ${x}`).join(", ")}{${decl}}`);
  }
  if (src.replace(/\s+/g, "").length > 0 && used === 0) fail("CSS du site : écrivez des règles « .ma-classe { color: #0b2a40; } ».");
  if (src.replace(/\s+/g, "").length > used) { /* texte hors règle : ignoré par le moteur CSS, signalé ici */ if (strict && src.replace(re, "").trim()) fail("CSS du site : du texte se trouve en dehors d'une règle « sélecteur { … } »."); }
  return rules.join("\n");
}

// Réglages complets et valides : toute valeur absente reprend la valeur par défaut ; strict = refuser les valeurs
// invalides (enregistrement depuis l'éditeur) au lieu de les remplacer silencieusement
function normalizeSettings(input = {}, { strict = false } = {}) {
  const src = input && typeof input === "object" ? input : {};
  const D = DEFAULT_SETTINGS;
  const id = src.identity || {};
  const identity = {
    description: clean(id.description, 300),
    logoUrl: mediaUrl(id.logoUrl, "Logo", strict), logoMobileUrl: mediaUrl(id.logoMobileUrl, "Logo mobile", strict), faviconUrl: mediaUrl(id.faviconUrl, "Favicon", strict),
  };
  if (strict && identity.faviconUrl && !/\.(png|svg|ico|webp|jpe?g)(\?.*)?$/i.test(identity.faviconUrl) && identity.faviconUrl.startsWith("https://")) throw bad("Favicon : un fichier .png, .svg, .ico, .webp ou .jpg est attendu.");
  const bg = src.background || {};
  const gr = bg.gradient || {};
  const background = {
    color: colorRef(bg.color, "Arrière-plan : couleur", strict),
    gradient: { enabled: bool(gr.enabled, false), from: colorRef(gr.from, "Dégradé : début", strict, D.background.gradient.from), to: colorRef(gr.to, "Dégradé : fin", strict, D.background.gradient.to), angle: num(gr.angle, 0, 360, "Dégradé : angle", strict, D.background.gradient.angle) },
    image: mediaUrl(bg.image, "Image d'arrière-plan", strict),
    position: oneOf(bg.position, BG_POSITIONS, "Arrière-plan : position", strict, "center"),
    size: oneOf(bg.size, BG_SIZES, "Arrière-plan : taille", strict, "cover"),
    repeat: oneOf(bg.repeat, BG_REPEATS, "Arrière-plan : répétition", strict, "no-repeat"),
    fixed: bool(bg.fixed, false),
  };
  const ly = src.layout || {};
  const bp = ly.breakpoints || {};
  const layout = {
    fullWidth: bool(ly.fullWidth, false),
    contentWidth: num(ly.contentWidth, 480, 1600, "Largeur du contenu", strict, D.layout.contentWidth),
    containerWidth: num(ly.containerWidth, 480, 1600, "Largeur des conteneurs", strict, D.layout.containerWidth),
    gutter: num(ly.gutter, 0, 80, "Marges latérales", strict, D.layout.gutter),
    breakpoints: { tablet: num(bp.tablet, 820, 1279, "Point de rupture tablette", strict, DEFAULT_BREAKPOINTS.tablet), mobile: num(bp.mobile, 400, 767, "Point de rupture mobile", strict, DEFAULT_BREAKPOINTS.mobile), wide: num(bp.wide, 1400, 3000, "Point de rupture grand écran", strict, DEFAULT_BREAKPOINTS.wide) },
  };
  if (layout.breakpoints.mobile >= layout.breakpoints.tablet) { if (strict) throw bad("Points de rupture : la tablette doit être plus large que le mobile."); layout.breakpoints = { ...DEFAULT_BREAKPOINTS }; }
  const lb = src.lightbox || {};
  const lightbox = {
    enabled: bool(lb.enabled, true), overlay: colorRef(lb.overlay, "Visionneuse : fond", strict, D.lightbox.overlay).replace(/^token:.*$/, D.lightbox.overlay),
    overlayOpacity: num(lb.overlayOpacity, 20, 100, "Visionneuse : opacité du fond", strict, D.lightbox.overlayOpacity),
    arrows: bool(lb.arrows, true), closeOnOverlay: bool(lb.closeOnOverlay, true), captions: bool(lb.captions, true), animation: oneOf(lb.animation, LB_ANIMATIONS, "Visionneuse : animation", strict, "fade"),
  };
  const tr = src.transitions || {};
  const transitions = { type: oneOf(tr.type, TRANSITION_TYPES, "Transition de page", strict, "none"), duration: num(tr.duration, 100, 1000, "Transition : durée", strict, D.transitions.duration) };
  const rs = src.responsive || {};
  const RESP = { h1: [10, 96, "Titre 1"], h2: [10, 96, "Titre 2"], h3: [10, 96, "Titre 3"], body: [10, 40, "Texte courant"], gutter: [0, 80, "Marge latérale"], spaceLg: [0, 200, "Espacement L"], spaceXl: [0, 200, "Espacement XL"] };
  const responsive = {};
  for (const dev of ["tablet", "mobile"]) {
    responsive[dev] = {};
    for (const [k, [lo, hi, label]] of Object.entries(RESP)) {
      const v = rs[dev] && rs[dev][k];
      if (v === undefined || v === null || v === "") { responsive[dev][k] = null; continue; }
      const n = Number(v);
      if (Number.isFinite(n) && n >= lo && n <= hi) responsive[dev][k] = Math.round(n);
      else if (strict) throw bad(`${label} (${dev === "tablet" ? "tablette" : "mobile"}) : un nombre entre ${lo} et ${hi} est attendu.`);
      else responsive[dev][k] = null;
    }
  }
  const dk = src.dark || {};
  const darkHex = (v, label) => { const x = v === undefined || v === null ? "" : String(v).trim().toLowerCase(); if (!x) return ""; if (/^#[0-9a-f]{6}$/.test(x)) return x; if (strict) throw bad(`${label} : code hexadécimal attendu (ex. #101820).`); return ""; };
  const dark = { mode: oneOf(dk.mode, ["off", "auto"], "Mode sombre", strict, "off"), background: darkHex(dk.background, "Mode sombre : fond"), surface: darkHex(dk.surface, "Mode sombre : surface"), text: darkHex(dk.text, "Mode sombre : texte"), muted: darkHex(dk.muted, "Mode sombre : texte discret"), primary: darkHex(dk.primary, "Mode sombre : couleur principale") };
  let customCss = "";
  const rawCss = src.customCss === undefined || src.customCss === null ? "" : String(src.customCss).replace(/\r\n?/g, "\n");
  if (rawCss.trim()) {
    try { normalizeSiteCss(rawCss); customCss = rawCss.trim(); } catch (e) { if (strict) throw bad(e.message); customCss = ""; }
  }
  const cc = src.customCode && typeof src.customCode === "object" ? src.customCode : {};
  const codeOf = (v, label) => { const x = v === undefined || v === null ? "" : String(v).replace(/\r\n?/g, "\n"); if (x.length > MAX_CODE) { if (strict) throw bad(`${label} : ${MAX_CODE} caractères au maximum.`); return ""; } return x.trim(); };
  const customCode = { head: codeOf(cc.head, "Code du <head>"), bodyStart: codeOf(cc.bodyStart, "Code de début de <body>"), bodyEnd: codeOf(cc.bodyEnd, "Code de fin de <body>"), sig: /^[A-Za-z0-9_-]{0,64}$/.test(String(cc.sig || "")) ? String(cc.sig || "") : "" };
  // Classes globales : styles nommés réutilisables (voir nodes.classCss)
  const sectionsLib = require("./sections");
  let classes;
  try { classes = require("./nodes").normalizeClassDefs(src.classes, { imageUrl: sectionsLib.imageUrl, linkUrl: sectionsLib.linkUrl }, { strict }); } catch (e) { throw bad(e.message); }
  const ex = src.extras || {};
  const extras = { language: oneOf(ex.language, Object.keys(LANGUAGES), "Langue", strict, "fr"), smoothScroll: bool(ex.smoothScroll, false), noindex: bool(ex.noindex, false) };
  const sx = src.seo || {};
  let publicUrl = clean(sx.publicUrl, 200).replace(/\/+$/, "");
  if (publicUrl && !/^https:\/\/[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{2,5})?$/i.test(publicUrl)) { if (strict) throw bad("Adresse publique du site : une adresse https:// sans chemin (ex. https://www.monsite.com)."); publicUrl = ""; }
  const seo = { title: clean(sx.title, 70).replace(/\s+/g, " "), ogImage: mediaUrl(sx.ogImage, "Image de partage du site", strict), publicUrl, follow: bool(sx.follow, true) };
  const gx = src.general || {};
  const timezone = clean(gx.timezone, 60) || "Europe/Paris";
  if (!validTimezone(timezone)) { if (strict) throw bad("Fuseau horaire inconnu."); }
  const general = {
    timezone: validTimezone(timezone) ? timezone : "Europe/Paris",
    dateFormat: oneOf(gx.dateFormat, ["long", "medium", "short", "iso", "dmy", "mdy", "dots"], "Format de date", strict, "long"),
    weekStart: oneOf(gx.weekStart, ["monday", "sunday", "saturday"], "Premier jour de la semaine", strict, "monday"),
    timeFormat: oneOf(gx.timeFormat, ["24h", "12h"], "Format de l'heure", strict, "24h"),
    privacyPageId: Number.isInteger(Number(gx.privacyPageId)) && Number(gx.privacyPageId) > 0 ? Number(gx.privacyPageId) : null,
  };
  const rx = src.reading || {};
  const posId = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
  const reading = {
    showOnFront: oneOf(rx.showOnFront, ["page", "posts"], "Affichage de l'accueil", strict, "page"),
    postsPage: posId(rx.postsPage),
    postsPerPage: num(rx.postsPerPage, 1, 50, "Articles par page", strict, D.reading.postsPerPage),
    feedItems: num(rx.feedItems, 1, 50, "Éléments des flux", strict, D.reading.feedItems),
    feedContent: oneOf(rx.feedContent, ["excerpt", "full"], "Contenu des flux", strict, "excerpt"),
  };
  // Commentaires du site : bloc complet (voir services/comments) ou null = le site hérite du site principal
  let commentsBlock = null;
  if (src.comments && typeof src.comments === "object") { try { commentsBlock = require("../../services/comments").normalizeSettings(src.comments); } catch { commentsBlock = null; } }
  // Publication unique (Personnalisation → Types de publication) : réglages complets, ou null = affichage d'origine de la page d'article
  let singlePost = null;
  try { singlePost = require("../../services/singlePost").compact(src.singlePost, { strict }); } catch (e) { if (e && e.isSinglePost) throw bad(e.message); singlePost = null; }
  return { identity, background, layout, lightbox, transitions, responsive, dark, customCss, customCode, classes, extras, seo, general, reading, comments: commentsBlock, singlePost };
}

// Points de rupture effectifs d'un site (utilisés par le CSS des éléments : pageCss) ; défauts si inconnus
const breakpointsOf = (settings) => (settings && settings.layout && settings.layout.breakpoints) || DEFAULT_BREAKPOINTS;

// Feuille de style globale du site : arrière-plan, mise en page, défilement doux. Placée avant les styles des éléments.
function layoutCss(settings) {
  const s = settings;
  const out = [];
  const bgDecls = [];
  const bg = s.background;
  if (bg.color) bgDecls.push(`background-color:${colorCss(bg.color)}`);
  const layers = [];
  if (bg.gradient.enabled) layers.push(`linear-gradient(${bg.gradient.angle}deg, ${colorCss(bg.gradient.from)}, ${colorCss(bg.gradient.to)})`);
  if (bg.image) layers.push(`url("${bg.image}")`);
  if (layers.length) {
    out.push(`.lp-site.lp-body{background-color:${bg.color ? colorCss(bg.color) : "var(--kw-background)"};background-image:${layers.join(",")};background-position:${bg.position};background-size:${bg.image ? bg.size : "auto"};background-repeat:${bg.image ? bg.repeat : "no-repeat"}}`);
    if (bg.fixed && bg.image) out.push(`@media (min-width:1025px){.lp-site.lp-body{background-attachment:fixed}}`);
  } else if (bgDecls.length) out.push(`.lp-site.lp-body{${bgDecls.join(";")}}`);
  const L = s.layout, D = DEFAULT_SETTINGS.layout;
  const main = [];
  if (L.fullWidth) main.push("max-width:none");
  else if (L.contentWidth !== D.contentWidth) main.push(`max-width:${L.contentWidth}px`);
  if (L.gutter !== D.gutter) main.push(`padding-left:${L.gutter}px`, `padding-right:${L.gutter}px`);
  if (main.length) out.push(`.lp-site .lp-main{${main.join(";")}}`);
  if (L.containerWidth !== D.containerWidth) out.push(`.lp-site{--kw-band-w:${L.containerWidth}px}`);
  if (L.containerWidth !== D.containerWidth) out.push(`.lp-site :where(.kw-container:not(.kw-full):not(.kw-band):not(.kw-container .kw-container)){max-width:${L.containerWidth}px}`);
  // Valeurs par appareil : variables posées en !important (les jetons du site sont en style de l'élément <body>), sous les points de rupture du site
  const bp = breakpointsOf(s), R = s.responsive;
  if (R) {
    const dev = (max, r) => {
      const v = [];
      for (const k of ["h1", "h2", "h3"]) if (r[k] !== null) v.push(`--kw-${k}-size:${r[k]}px!important`);
      if (r.body !== null) v.push(`--kw-body-size:${r.body}px!important`);
      if (r.spaceLg !== null) v.push(`--kw-space-lg:${r.spaceLg}px!important`);
      if (r.spaceXl !== null) v.push(`--kw-space-xl:${r.spaceXl}px!important`);
      const parts = [];
      if (v.length) parts.push(`.lp-site{${v.join(";")}}`);
      if (r.gutter !== null) parts.push(`.lp-site .lp-main{padding-left:${r.gutter}px;padding-right:${r.gutter}px}`);
      if (parts.length) out.push(`@media (max-width:${max}px){${parts.join("")}}`);
    };
    dev(bp.tablet, R.tablet); dev(bp.mobile, R.mobile);
  }
  // Mode sombre : couleurs du site remplacées quand la personne préfère un thème sombre (ou quand l'aperçu le force)
  const D2 = s.dark;
  if (D2 && D2.mode === "auto") {
    const v = [];
    if (D2.background) v.push(`--kw-background:${D2.background}!important`, `--lp-bg:${D2.background}!important`);
    if (D2.surface) v.push(`--kw-surface:${D2.surface}!important`);
    if (D2.text) v.push(`--kw-text:${D2.text}!important`, `--lp-text:${D2.text}!important`);
    if (D2.muted) v.push(`--kw-muted:${D2.muted}!important`);
    if (D2.primary) v.push(`--kw-primary:${D2.primary}!important`, `--kw-on-primary:${require("./tokens").onColor(D2.primary)}!important`);
    if (v.length) {
      out.push(`@media (prefers-color-scheme:dark){.lp-site{${v.join(";")};color-scheme:dark}}`);
      out.push(`html[data-kw-force-dark] .lp-site{${v.join(";")};color-scheme:dark}`);
    }
  }
  if (s.extras.smoothScroll) out.push(`@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}`);
  return out.join("\n");
}

// Transition entre les pages du site : API « View Transitions » du navigateur (même origine). Les navigateurs qui ne
// la connaissent pas changent de page sans transition. Jamais dans l'éditeur ; désactivée si la personne demande moins d'animations.
function transitionCss(settings) {
  const t = settings.transitions;
  if (t.type === "none") return "";
  const ms = t.duration;
  const slide = t.type === "slide";
  return [
    "@media (prefers-reduced-motion:no-preference){",
    "@view-transition{navigation:auto}",
    `::view-transition-old(root){animation:${ms}ms ease both kw-vt-out}`,
    `::view-transition-new(root){animation:${ms}ms ease both kw-vt-in}`,
    `@keyframes kw-vt-out{to{opacity:0${slide ? ";transform:translateX(-24px)" : ""}}}`,
    `@keyframes kw-vt-in{from{opacity:0${slide ? ";transform:translateX(24px)" : ""}}}`,
    "}",
  ].join("");
}

// Visionneuse : variables lues par la feuille de style, attributs lus par landing.js
function lightboxVars(settings) {
  const l = settings.lightbox;
  const hex = l.overlay.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `--kw-lb-overlay:rgba(${r},${g},${b},${l.overlayOpacity / 100})`;
}
function lightboxAttrs(settings) {
  const l = settings.lightbox;
  return ` data-kw-lb="${l.enabled ? "on" : "off"}" data-kw-lb-arrows="${l.arrows ? 1 : 0}" data-kw-lb-overlay-close="${l.closeOnOverlay ? 1 : 0}" data-kw-lb-captions="${l.captions ? 1 : 0}" data-kw-lb-anim="${l.animation}"`;
}

// Code personnalisé du site : la signature (HMAC, clé ENCRYPTION_KEY, voir utils/customHtml) couvre les trois zones ; sans clé ou signature valide, rien n'est restitué
const codePayload = (c) => customHtml.encode(JSON.stringify([c.head || "", c.bodyStart || "", c.bodyEnd || ""]));
function signCustomCode(c) { return customHtml.sign(codePayload(c)); }
function verifiedCustomCode(c) {
  const none = { head: "", bodyStart: "", bodyEnd: "" };
  if (!c || !(c.head || c.bodyStart || c.bodyEnd)) return none;
  return customHtml.verify(codePayload(c), c.sig) ? { head: c.head, bodyStart: c.bodyStart, bodyEnd: c.bodyEnd } : none;
}

// Tout ce que le gabarit public affiche pour un site, calculé une fois (valeurs déjà validées)
function siteAssets(tokens, settings, themeCss) {
  let custom = "";
  try { custom = normalizeSiteCss(settings.customCss, { strict: false }); } catch { custom = ""; }
  return {
    theme: [themeCss(tokens), layoutCss(settings), require("./nodes").classCss(settings.classes, breakpointsOf(settings))].filter(Boolean).join("\n").replace(/</g, ""),
    custom: custom.replace(/</g, ""),
    code: verifiedCustomCode(settings.customCode),
    transition: transitionCss(settings),
    pack: require("../themes/packs").headHtml(tokens && tokens.pack),
    lightboxVars: lightboxVars(settings),
    lightboxAttrs: lightboxAttrs(settings),
  };
}

module.exports = { signCustomCode, verifiedCustomCode, MAX_CODE, DEFAULT_SETTINGS, DEFAULT_BREAKPOINTS, LANGUAGES, LB_ANIMATIONS, TRANSITION_TYPES, BG_POSITIONS, BG_SIZES, BG_REPEATS, MAX_CSS, normalizeSettings, normalizeSiteCss, breakpointsOf, layoutCss, transitionCss, siteAssets };
