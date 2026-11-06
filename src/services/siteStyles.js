// KOLAKISA CMS : moteur de styles d'un site (écran Apparence → Styles) : brouillon, aperçu, publication et versions, par site.
//
// Ce n'est PAS un second moteur de design. Les valeurs vivent toujours dans les moteurs existants, qui restent les seuls à écrire le rendu public :
//   • site PRINCIPAL : appearance_configs (services/appearance.js : jetons, en-tête, pied de page ; brouillon, publication, mémo invalidé à la publication) ;
//   • SITE du CMS    : mk_sites (name, tokens, settings) via pages.saveSiteDesign (validation stricte, révision, conflits, invalidation des caches de sites).
// Ce service ajoute seulement : un CATALOGUE fermé de réglages de design (un réglage n'existe que si le moteur sait le rendre), un brouillon par
// site (cms_customizer_drafts, verrou optimiste), l'historique des publications (cms_customizer_versions) et le calcul du CSS d'aperçu.
// Un brouillon est un objet { "chemin.du.réglage": valeur } : seuls les réglages DIFFÉRENTS de la version en ligne y figurent.
// Le site est toujours celui que le serveur a vérifié (siteId : entier | null = principal) ; rien ici ne lit un site dans une requête.
const db = require("../config/database");
const { sameScope } = require("./siteScope");
const appearance = require("./appearance");
const tokensLib = require("../marketing/pages/tokens");
const fontLib = require("../utils/fontLibrary");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const MAX_CHANGES = 200;
const MAX_VERSIONS = 40;
const MAX_VALUE = 20000;
const pages = () => require("../marketing/pages");
const siteSettings = () => require("../marketing/pages/siteSettings");

// ---------- Catalogue des réglages ----------
// kind : color | text | textarea | number | select | toggle | media | css ; scope : sur quels sites le moteur sait le rendre ("principal" | "site")
// live : true = ne change que le CSS (aperçu instantané sans recharger la page) ; false = change le contenu (l'aperçu se recharge, sans perdre la position)
const BOTH = ["principal", "site"];
const PANELS = [
  { id: "couleurs", label: "Couleurs", icon: "palette", hint: "Couleurs globales, liens et bordures." },
  { id: "typographie", label: "Typographie", icon: "type", hint: "Polices, tailles, graisses et interlignes." },
  { id: "mise-en-page", label: "Mise en page", icon: "layout", hint: "Largeurs, espacements, arrondis et points de rupture." },
  { id: "arriere-plan", label: "Arrière-plan", icon: "image", hint: "Couleur, dégradé et image de fond des pages." },
  { id: "images", label: "Images", icon: "image", hint: "Arrondi, bordure, ombre et cadrage des images." },
  { id: "formulaires", label: "Champs de formulaire", icon: "form", hint: "Apparence des champs (inscription, recherche)." },
  { id: "appareils", label: "Tablette et mobile", icon: "tablet", hint: "Tailles et marges propres à la tablette et au mobile." },
  { id: "mode-sombre", label: "Mode sombre", icon: "moon", hint: "Couleurs du site pour les visiteurs qui préfèrent un thème sombre." },
  { id: "palette", label: "Palette du site", icon: "palette", hint: "Couleurs nommées, réutilisables dans tout le site." },
  { id: "boutons", label: "Boutons", icon: "button", hint: "Forme, couleurs et états des boutons." },
];
const controls = [];
const add = (id, panel, kind, label, o = {}) => controls.push({ id, panel, kind, label, scope: BOTH, live: true, ...o });
const colorOpt = { allowEmpty: true };

// Couleurs
const C = tokensLib.COLOR_LABELS;
for (const k of ["primary", "secondary", "accent", "background", "surface", "text", "muted"]) add(`tokens.colors.${k}`, "couleurs", "color", C[k], { scope: k === "accent" ? ["site"] : BOTH });
add("tokens.link.color", "couleurs", "color", "Liens", { ...colorOpt, help: "Vide : couleur d'origine du site." });
add("tokens.link.hoverColor", "couleurs", "color", "Liens au survol", colorOpt);
add("tokens.border.color", "couleurs", "color", "Bordures", { help: "Couleur des filets et des cartes." });
for (const k of ["success", "warning", "error"]) add(`tokens.colors.${k}`, "couleurs", "color", `${C[k]} (messages)`, { scope: ["site"], help: "Couleur des messages de confirmation, d'avertissement et d'erreur du site." });

// Typographie
// Polices proposées : celles du système, la bibliothèque, et les polices TÉLÉVERSÉES par CE site (jamais celles d'un autre site)
const fontOptions = (siteId) => [...Object.entries(tokensLib.FONTS).map(([k, v]) => [k, v.label]), ...fontLib.list().map((f) => [f.id, f.family]), ...require("./siteFonts").pickerFonts(siteId).map((f) => [f.id, `${f.family} (téléversée)`])];
add("tokens.fonts.heading", "typographie", "select", "Police des titres", { options: fontOptions });
add("tokens.fonts.body", "typographie", "select", "Police du texte courant", { options: fontOptions });
for (const k of ["h1", "h2", "h3"]) {
  add(`tokens.type.${k}.size`, "typographie", "number", `Taille — ${tokensLib.TYPE_LABELS[k]}`, { min: 10, max: 96, unit: "px" });
  add(`tokens.type.${k}.weight`, "typographie", "select", `Graisse — ${tokensLib.TYPE_LABELS[k]}`, { options: [[400, "Normale"], [500, "Moyenne"], [600, "Demi-grasse"], [700, "Grasse"], [800, "Très grasse"]], number: true });
  add(`tokens.type.${k}.lineHeight`, "typographie", "number", `Interligne — ${tokensLib.TYPE_LABELS[k]}`, { min: 1, max: 2, step: 0.05 });
}
for (const k of ["h4", "h5", "h6"]) {
  add(`tokens.type.${k}.size`, "typographie", "number", `Taille — ${tokensLib.TYPE_LABELS[k]}`, { scope: ["site"], min: 10, max: 96, unit: "px" });
  add(`tokens.type.${k}.weight`, "typographie", "select", `Graisse — ${tokensLib.TYPE_LABELS[k]}`, { scope: ["site"], options: [[400, "Normale"], [500, "Moyenne"], [600, "Demi-grasse"], [700, "Grasse"], [800, "Très grasse"]], number: true });
}
add("tokens.type.caption.size", "typographie", "number", "Taille des légendes", { scope: ["site"], min: 10, max: 96, unit: "px" });
add("tokens.fonts.button", "typographie", "select", "Police des boutons", { scope: ["site"], options: fontOptions });
add("tokens.fonts.link", "typographie", "select", "Police des liens", { scope: ["site"], options: fontOptions });
for (const k of ["h1", "h2", "h3"]) add(`tokens.type.${k}.transform`, "typographie", "select", `Casse — ${tokensLib.TYPE_LABELS[k]}`, { scope: ["site"], options: [["none", "D'origine"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Initiales en capitale"]] });
add("tokens.type.body.size", "typographie", "number", "Taille du texte courant", { min: 10, max: 96, unit: "px" });
add("tokens.type.body.lineHeight", "typographie", "number", "Interligne du texte courant", { min: 1, max: 2, step: 0.05 });
add("tokens.type.h1.letterSpacing", "typographie", "number", "Espacement des lettres — Titre 1", { scope: ["site"], min: -0.1, max: 0.5, step: 0.01, unit: "em" });
add("tokens.type.body.letterSpacing", "typographie", "number", "Espacement des lettres — texte", { scope: ["site"], min: -0.1, max: 0.5, step: 0.01, unit: "em" });
add("tokens.link.underline", "typographie", "select", "Soulignement des liens", { options: [["", "D'origine"], ["always", "Toujours"], ["hover", "Au survol"], ["none", "Jamais"]] });

// Mise en page
add("tokens.sizes.content", "mise-en-page", "number", "Largeur du contenu large", { scope: ["principal"], min: 640, max: 1600, unit: "px" });
add("tokens.sizes.narrow", "mise-en-page", "number", "Largeur du contenu étroit (texte, articles)", { scope: ["principal"], min: 480, max: 1000, unit: "px" });
add("settings.layout.fullWidth", "mise-en-page", "toggle", "Disposition pleine largeur", { scope: ["site"], help: "Sinon, le contenu est encadré dans la largeur de conteneur." });
add("settings.layout.containerWidth", "mise-en-page", "number", "Largeur du conteneur", { scope: ["site"], min: 480, max: 1920, unit: "px" });
add("settings.layout.contentWidth", "mise-en-page", "number", "Largeur du contenu de texte", { scope: ["site"], min: 320, max: 1200, unit: "px" });
add("settings.layout.gutter", "mise-en-page", "number", "Marge latérale (écrans étroits)", { scope: ["site"], min: 0, max: 80, unit: "px" });
for (const k of ["sm", "md", "lg", "xl"]) add(`tokens.space.${k}`, "mise-en-page", "number", `Espacement ${k.toUpperCase()}`, { scope: ["site"], min: 0, max: 200, unit: "px" });
add("tokens.radius.md", "mise-en-page", "number", "Arrondi des cartes et champs", { min: 0, max: 48, unit: "px" });
add("tokens.radius.lg", "mise-en-page", "number", "Arrondi des grands blocs", { min: 0, max: 48, unit: "px" });
add("tokens.radius.sm", "mise-en-page", "number", "Arrondi des petits éléments", { scope: ["site"], min: 0, max: 48, unit: "px" });
add("tokens.radius.field", "mise-en-page", "number", "Arrondi des champs", { scope: ["site"], min: 0, max: 48, unit: "px" });
add("tokens.radius.card", "mise-en-page", "number", "Arrondi des cartes", { scope: ["site"], min: 0, max: 48, unit: "px" });
add("tokens.border.width", "mise-en-page", "number", "Épaisseur des bordures", { scope: ["site"], min: 0, max: 4, unit: "px" });
add("tokens.sizes.buttonHeight", "mise-en-page", "number", "Hauteur des boutons", { scope: ["site"], min: 32, max: 72, unit: "px" });
add("tokens.sizes.fieldHeight", "mise-en-page", "number", "Hauteur des champs", { scope: ["site"], min: 32, max: 72, unit: "px" });
add("settings.layout.breakpoints.tablet", "mise-en-page", "number", "Point de rupture : tablette", { scope: ["site"], min: 820, max: 1279, unit: "px", help: "Largeur en dessous de laquelle le site passe en disposition tablette." });
add("settings.layout.breakpoints.mobile", "mise-en-page", "number", "Point de rupture : mobile", { scope: ["site"], min: 400, max: 767, unit: "px", help: "Doit rester inférieur à celui de la tablette." });
add("settings.transitions.type", "mise-en-page", "select", "Transition entre les pages", { scope: ["site"], options: [["none", "Aucune"], ["fade", "Fondu"], ["slide", "Glissement"]], help: "Désactivée pour les personnes qui demandent moins d'animations." });
add("settings.transitions.duration", "mise-en-page", "number", "Durée de la transition", { scope: ["site"], min: 100, max: 1000, unit: "ms", showIf: { "settings.transitions.type": ["fade", "slide"] } });
add("tokens.shadow.card", "mise-en-page", "select", "Ombre des cartes", { options: [["none", "Aucune"], ["sm", "Légère"], ["md", "Moyenne"], ["lg", "Forte"]] });

// Boutons
add("tokens.radius.button", "boutons", "number", "Arrondi des boutons", { min: 0, max: 48, unit: "px" });
add("tokens.buttons.paddingY", "boutons", "number", "Marge intérieure verticale", { min: 4, max: 32, unit: "px", nullable: true });
add("tokens.buttons.paddingX", "boutons", "number", "Marge intérieure horizontale", { min: 8, max: 64, unit: "px", nullable: true });
add("tokens.buttons.normal.bg", "boutons", "color", "Fond", colorOpt);
add("tokens.buttons.normal.color", "boutons", "color", "Texte", colorOpt);
add("tokens.buttons.normal.border", "boutons", "color", "Bordure", colorOpt);
add("tokens.buttons.hover.bg", "boutons", "color", "Fond au survol", colorOpt);
add("tokens.buttons.hover.color", "boutons", "color", "Texte au survol", colorOpt);
add("tokens.buttons.hover.border", "boutons", "color", "Bordure au survol", { ...colorOpt, scope: ["site"] });
add("tokens.buttons.active.bg", "boutons", "color", "Fond au clic", { ...colorOpt, scope: ["site"] });
add("tokens.buttons.active.color", "boutons", "color", "Texte au clic", { ...colorOpt, scope: ["site"] });
add("tokens.buttons.active.border", "boutons", "color", "Bordure au clic", { ...colorOpt, scope: ["site"] });
add("tokens.buttons.focus.color", "boutons", "color", "Contour au focus clavier", colorOpt);
add("tokens.buttons.focus.width", "boutons", "number", "Épaisseur du contour au focus", { min: 0, max: 8, unit: "px", nullable: true });
add("tokens.buttons.borderWidth", "boutons", "number", "Épaisseur de bordure", { scope: ["site"], min: 0, max: 6, unit: "px", nullable: true });
add("tokens.shadow.button", "boutons", "select", "Ombre des boutons", { scope: ["site"], options: [["none", "Aucune"], ["sm", "Légère"], ["md", "Moyenne"], ["lg", "Forte"]] });

// Arrière-plan des pages d'un site (rendu par layoutCss)
add("settings.background.color", "arriere-plan", "color", "Couleur de fond", { scope: ["site"], allowEmpty: true, help: "Vide : la couleur « Fond » des Couleurs." });
add("settings.background.gradient.enabled", "arriere-plan", "toggle", "Dégradé", { scope: ["site"] });
add("settings.background.gradient.from", "arriere-plan", "color", "Dégradé : début", { scope: ["site"], showIf: { "settings.background.gradient.enabled": true } });
add("settings.background.gradient.to", "arriere-plan", "color", "Dégradé : fin", { scope: ["site"], showIf: { "settings.background.gradient.enabled": true } });
add("settings.background.gradient.angle", "arriere-plan", "number", "Dégradé : angle", { scope: ["site"], min: 0, max: 360, unit: "°", showIf: { "settings.background.gradient.enabled": true } });
add("settings.background.image", "arriere-plan", "media", "Image de fond", { scope: ["site"], store: "url", help: "Image de la médiathèque de CE site." });
add("settings.background.position", "arriere-plan", "select", "Position de l'image", { scope: ["site"], options: [["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]], showIf: { "settings.background.image": "*" } });
add("settings.background.size", "arriere-plan", "select", "Taille de l'image", { scope: ["site"], options: [["cover", "Remplir"], ["contain", "Contenir"], ["auto", "Taille d'origine"]], showIf: { "settings.background.image": "*" } });
add("settings.background.repeat", "arriere-plan", "select", "Répétition de l'image", { scope: ["site"], options: [["no-repeat", "Aucune"], ["repeat", "Mosaïque"], ["repeat-x", "Horizontale"], ["repeat-y", "Verticale"]], showIf: { "settings.background.image": "*" } });
add("settings.background.fixed", "arriere-plan", "toggle", "Image fixe au défilement", { scope: ["site"], showIf: { "settings.background.image": "*" }, help: "Appliqué sur écran large seulement." });

// Images (rendu par themeCss)
add("tokens.images.radius", "images", "number", "Arrondi des images", { scope: ["site"], min: 0, max: 48, unit: "px", nullable: true });
add("tokens.images.borderWidth", "images", "number", "Épaisseur de bordure", { scope: ["site"], min: 0, max: 8, unit: "px", nullable: true });
add("tokens.images.borderColor", "images", "color", "Couleur de bordure", { scope: ["site"], allowEmpty: true });
add("tokens.images.shadow", "images", "select", "Ombre des images", { scope: ["site"], options: [["", "D'origine"], ["none", "Aucune"], ["sm", "Légère"], ["md", "Moyenne"], ["lg", "Forte"]] });
add("tokens.images.fit", "images", "select", "Cadrage (galeries et cartes)", { scope: ["site"], options: [["", "D'origine"], ["cover", "Remplir"], ["contain", "Contenir"], ["fill", "Étirer"], ["scale-down", "Réduire si besoin"]] });
add("tokens.images.position", "images", "select", "Position du cadrage", { scope: ["site"], options: [["", "D'origine"], ["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]] });

// Champs de formulaire (rendu par themeCss : formulaire d'inscription et recherche)
add("tokens.forms.bg", "formulaires", "color", "Fond des champs", { scope: ["site"], allowEmpty: true });
add("tokens.forms.color", "formulaires", "color", "Texte des champs", { scope: ["site"], allowEmpty: true });
add("tokens.forms.borderColor", "formulaires", "color", "Bordure des champs", { scope: ["site"], allowEmpty: true });
add("tokens.forms.borderWidth", "formulaires", "number", "Épaisseur de bordure", { scope: ["site"], min: 0, max: 4, unit: "px", nullable: true });
add("tokens.forms.radius", "formulaires", "number", "Arrondi des champs", { scope: ["site"], min: 0, max: 32, unit: "px", nullable: true });
add("tokens.forms.paddingY", "formulaires", "number", "Marge intérieure verticale", { scope: ["site"], min: 4, max: 24, unit: "px", nullable: true });
add("tokens.forms.paddingX", "formulaires", "number", "Marge intérieure horizontale", { scope: ["site"], min: 6, max: 32, unit: "px", nullable: true });
add("tokens.forms.focusColor", "formulaires", "color", "Contour au focus clavier", { scope: ["site"], allowEmpty: true });
add("tokens.forms.placeholderColor", "formulaires", "color", "Aide à la saisie", { scope: ["site"], allowEmpty: true });
add("tokens.forms.labelColor", "formulaires", "color", "Libellés", { scope: ["site"], allowEmpty: true });
add("tokens.forms.accent", "formulaires", "color", "Cases et boutons radio", { scope: ["site"], allowEmpty: true });

// Valeurs par appareil (rendues sous les points de rupture du site par siteSettings.layoutCss)
for (const [dev, name] of [["tablet", "tablette"], ["mobile", "mobile"]]) {
  for (const [k, label, lo, hi] of [["h1", "Titre 1", 10, 96], ["h2", "Titre 2", 10, 96], ["h3", "Titre 3", 10, 96], ["body", "Texte courant", 10, 40]]) add(`settings.responsive.${dev}.${k}`, "appareils", "number", `${label} — ${name}`, { scope: ["site"], min: lo, max: hi, unit: "px", nullable: true, help: k === "h1" ? "Vide : la taille globale s'applique." : undefined });
  add(`settings.responsive.${dev}.gutter`, "appareils", "number", `Marge latérale — ${name}`, { scope: ["site"], min: 0, max: 80, unit: "px", nullable: true });
  add(`settings.responsive.${dev}.spaceLg`, "appareils", "number", `Espacement L — ${name}`, { scope: ["site"], min: 0, max: 200, unit: "px", nullable: true });
  add(`settings.responsive.${dev}.spaceXl`, "appareils", "number", `Espacement XL — ${name}`, { scope: ["site"], min: 0, max: 200, unit: "px", nullable: true });
}

// Mode sombre du site
add("settings.dark.mode", "mode-sombre", "select", "Mode sombre", { scope: ["site"], options: [["off", "Désactivé"], ["auto", "Selon la préférence du visiteur"]], help: "Activé : les couleurs ci-dessous remplacent celles du site chez les visiteurs dont l'appareil est en thème sombre." });
for (const [k, label] of [["background", "Fond"], ["surface", "Surface (cartes)"], ["text", "Texte"], ["muted", "Texte discret"], ["primary", "Couleur principale"]]) add(`settings.dark.${k}`, "mode-sombre", "color", label, { scope: ["site"], allowEmpty: true, showIf: { "settings.dark.mode": "auto" } });

// Palette nommée du site (jetons « customColors » : utilisables dans les styles des éléments)
add("tokens.customColors", "palette", "palette", "Couleurs de la palette", { scope: ["site"], max: tokensLib.MAX_CUSTOM_COLORS, help: "Donnez un nom à une couleur pour la réutiliser. Les couleurs nommées sont proposées dans les sélecteurs de couleur de cet écran." });

const BY_ID = new Map(controls.map((c) => [c.id, c]));
// Réglage par identifiant et portée (principal | site)
const ctl = (id) => BY_ID.get(id) || null;
const scopeName = (siteId) => (siteId === null ? "principal" : "site");
const catalog = (siteId) => controls.filter((c) => c.scope.includes(scopeName(siteId)));
const panelsFor = (siteId) => {
  const cat = catalog(siteId);
  return PANELS.filter((p) => cat.some((c) => c.panel === p.id)).map((p) => ({ ...p, controls: cat.filter((c) => c.panel === p.id).map((c) => publicControl(c, siteId)) }));
};
function publicControl(c, siteId) {
  const o = typeof c.options === "function" ? c.options(siteId) : c.options;
  const { options, scope, ...rest } = c;
  return { ...rest, ...(o ? { options: o } : {}) };
}

// ---------- Lecture / écriture par chemin ----------
const getPath = (obj, path) => path.split(".").reduce((n, k) => (n && typeof n === "object" ? n[k] : undefined), obj);
function setPath(obj, path, value) {
  const keys = path.split(".");
  let n = obj;
  for (const k of keys.slice(0, -1)) { if (!n[k] || typeof n[k] !== "object") n[k] = {}; n = n[k]; }
  n[keys[keys.length - 1]] = value;
}
const clone = (v) => JSON.parse(JSON.stringify(v));

// Configuration publiée du site, dans la forme que chaque moteur lit (principal : jetons + en-tête + pied ; site : nom + jetons + réglages)
function liveConfig(ctx, siteId) {
  if (siteId === null) {
    const st = appearance.state(null);
    return { config: clone({ tokens: st.published.tokens, header: st.published.header, footer: st.published.footer }), revision: st.revision, pendingEngineDraft: st.hasDraft };
  }
  const site = pages().requireSite(ctx, siteId);
  return { config: clone({ name: site.name, tokens: site.tokens, settings: site.settings }), revision: site.settings_revision, site, pendingEngineDraft: false };
}

// ---------- Validation d'un ensemble de changements ----------
// Chaque chemin doit exister dans le catalogue de CE site ; la valeur est convertie puis validée par le moteur lui-même (validation stricte).
function coerce(c, raw, siteId) {
  if (c.kind === "palette") {
    if (!Array.isArray(raw) || raw.length > c.max) throw new UserError(`${c.label} : ${c.max} couleurs au plus.`);
    return raw.map((x) => ({ key: String((x && x.key) || ""), label: String((x && x.label) || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 40), hex: String((x && x.hex) || "").trim().toLowerCase() }));
  }
  if (c.kind === "toggle") return raw === true || raw === "1" || raw === 1 || raw === "true" || raw === "on";
  if (c.kind === "number") {
    if (raw === "" || raw === null || raw === undefined) { if (c.nullable || c.id.startsWith("tokens.link") || c.id.startsWith("tokens.type")) return null; throw new UserError(`${c.label} : une valeur est attendue.`); }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < c.min || n > c.max) throw new UserError(`${c.label} : un nombre entre ${c.min} et ${c.max} est attendu.`);
    return n;
  }
  if (c.kind === "select") {
    const options = typeof c.options === "function" ? c.options(siteId) : c.options;
    const hit = options.find(([v]) => String(v) === String(raw));
    if (!hit) throw new UserError(`${c.label} : choix inconnu.`);
    return c.number ? Number(hit[0]) : hit[0];
  }
  if (c.kind === "color") {
    const v = String(raw ?? "").trim().toLowerCase();
    if (v === "") { if (c.allowEmpty) return ""; throw new UserError(`${c.label} : un code couleur est attendu (ex. #0277b6).`); }
    // Les couleurs de base du site sont toujours des codes hexadécimaux ; les autres champs acceptent aussi une couleur du site (« token:primary »), que le moteur valide
    const hexOnly = c.id.startsWith("tokens.colors.") || c.id === "tokens.border.color";
    if (!hexOnly && /^token:[a-z0-9-]{1,24}$/.test(v)) return v;
    if (!/^#[0-9a-f]{6}$/.test(v)) throw new UserError(`${c.label} : code hexadécimal attendu (ex. #0277b6).`);
    return v;
  }
  if (c.kind === "media") {
    if (raw === "" || raw === null || raw === undefined) return c.store === "id" ? null : "";
    if (c.store === "id") { const n = Number(raw); if (!Number.isInteger(n) || n < 1) throw new UserError(`${c.label} : image inconnue.`); return n; }
    return String(raw);
  }
  const s = String(raw ?? "");
  if (s.length > (c.max || MAX_VALUE)) throw new UserError(`${c.label} : ${c.max || MAX_VALUE} caractères au plus.`);
  return c.kind === "css" ? s : s.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
}
// Une image choisie doit appartenir à la médiathèque DU site (reach « site » + site_id) ; le site principal et les médias communs (reach « shared ») restent ouverts
// au principal et, en lecture d'une référence existante, aux sites. Jamais l'image d'un AUTRE site.
function mediaBelongs(c, value, siteId) {
  if (value === null || value === "") return true;
  const ok = (r) => Boolean(r) && (r.reach === "shared" ? true : siteId !== null && r.site_id === siteId);
  if (c.store === "id") return ok(db.prepare("SELECT reach, site_id FROM mk_media WHERE id = ? AND type = 'image' AND deleted_at IS NULL").get(value));
  if (!/^\/uploads\//.test(value)) return /^https:\/\//.test(value); // adresse https externe : acceptée par le moteur de réglages du site
  return ok(db.prepare("SELECT reach, site_id FROM mk_media WHERE path = ? AND deleted_at IS NULL").get(value));
}
function cleanChanges(raw, siteId, { can = () => true } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new UserError("Réglages invalides.");
  const entries = Object.entries(raw);
  if (entries.length > MAX_CHANGES) throw new UserError("Trop de réglages à la fois.");
  const out = {};
  const cat = catalog(siteId);
  for (const [id, value] of entries) {
    const c = ctl(id);
    if (!c || !c.scope.includes(scopeName(siteId)) || !cat.some((x) => x.id === id)) throw new UserError(`Réglage inconnu pour ce site : « ${String(id).slice(0, 60)} ».`);
    if (c.perm && !can(c.perm)) throw new UserError(`« ${c.label} » : vous n'avez pas la permission de modifier ce réglage (« ${c.perm} »).`);
    const v = coerce(c, value, siteId);
    if (c.kind === "media" && !mediaBelongs(c, v, siteId)) throw new UserError(`${c.label} : cette image n'appartient pas à la médiathèque de ce site.`);
    out[id] = v;
  }
  return out;
}

// Applique des changements à une configuration complète et la valide avec les moteurs (strict : une valeur refusée lève une erreur claire)
function applyChanges(config, changes, siteId) {
  const next = clone(config);
  for (const [id, v] of Object.entries(changes)) setPath(next, id, v);
  if (siteId === null) {
    // Le moteur d'apparence valide tout (jetons, en-tête, pied de page) ; les valeurs refusées sont signalées, jamais corrigées en silence
    const normalized = appearance.normalizeConfig(next, { strict: true, siteId: null });
    assertTokensKept(next.tokens, normalized.tokens, changes, siteId);
    return { config: normalized };
  }
  const tokens = tokensLib.normalizeTokens(next.tokens, { strict: true, fontScope: { siteId } });
  const settings = siteSettings().normalizeSettings(next.settings, { strict: true });
  const name = String(next.name || "").trim();
  if (!name) throw new UserError("Le nom du site est obligatoire.");
  return { config: { name, tokens, settings } };
}
// Les jetons sont « normalisés » : une valeur remplacée par un défaut (hors limites) est une erreur, pas une correction silencieuse
function assertTokensKept(sent, normalized, changes, siteId) {
  for (const id of Object.keys(changes)) {
    if (!id.startsWith("tokens.")) continue;
    const a = getPath({ tokens: sent }, id), b = getPath({ tokens: normalized }, id);
    if (a === undefined || a === null || a === "") continue;
    if (String(a).toLowerCase() !== String(b).toLowerCase() && Number(a) !== Number(b)) throw new UserError(`${(ctl(id) || { label: id }).label} : valeur hors des limites autorisées.`);
  }
}

// Seuls les réglages réellement différents de la version en ligne restent dans le brouillon
function diffAgainst(live, changes, siteId) {
  const out = {};
  for (const [id, v] of Object.entries(changes)) {
    const cur = getPath(live, id);
    if (Array.isArray(v)) { if (JSON.stringify(v) !== JSON.stringify(Array.isArray(cur) ? cur.map((x) => ({ key: x.key, label: x.label, hex: x.hex })) : [])) out[id] = v; continue; }
    const same = typeof v === "number" ? Number(cur) === v : (v === null || v === "") ? (cur === null || cur === undefined || cur === "") : String(cur) === String(v);
    if (!same) out[id] = v;
  }
  return out;
}
// Une couleur peut référencer une couleur du site (« token:primary ») : l'écran affiche le code hexadécimal correspondant
const resolveColor = (v, config) => {
  if (typeof v !== "string" || !v.startsWith("token:")) return v;
  const key = v.slice(6), t = (config && config.tokens) || {};
  if (key === "on-primary") return tokensLib.onColor(t.colors.primary);
  if (key === "on-accent") return tokensLib.onColor(t.colors.accent);
  const custom = (t.customColors || []).find((c) => c.key === key);
  return (custom && custom.hex) || (t.colors && t.colors[key]) || "";
};
const valuesOf = (siteId, config) => Object.fromEntries(catalog(siteId).map((c) => {
  const v = getPath(config, c.id);
  const out = v === undefined || v === null ? (c.kind === "toggle" ? false : c.kind === "palette" ? [] : "") : (c.kind === "color" ? resolveColor(v, config) : v);
  return [c.id, out];
}));

// ---------- Brouillon ----------
const draftRow = (siteId) => db.prepare(`SELECT * FROM cms_customizer_drafts WHERE ${sameScope("site_id")}`).get(siteId);
const parse = (t) => { try { const o = JSON.parse(t); return o && typeof o === "object" ? o : {}; } catch { return {}; } };

// État complet pour l'écran : valeurs en ligne, brouillon (revalidé : un brouillon ancien devenu invalide est signalé, jamais appliqué), version du brouillon
function state(ctx, siteId, { can = () => true } = {}) {
  const live = liveConfig(ctx, siteId);
  const row = draftRow(siteId);
  let changes = row ? parse(row.changes) : {};
  let stale = null;
  try { changes = cleanChanges(changes, siteId, { can: () => true }); applyChanges(live.config, changes, siteId); } catch (e) { stale = e.message; changes = {}; }
  changes = diffAgainst(live.config, changes, siteId);
  const effective = applyChanges(live.config, changes, siteId).config;
  return {
    siteId, panels: panelsFor(siteId), live: valuesOf(siteId, live.config), values: valuesOf(siteId, effective), changes,
    draft: row ? { rev: row.rev, baseRev: row.base_rev, updatedAt: row.updated_at, updatedBy: row.updated_by, count: Object.keys(changes).length } : { rev: 0, baseRev: live.revision, updatedAt: null, count: 0 },
    revision: live.revision, stale, pendingEngineDraft: live.pendingEngineDraft, can: Object.fromEntries(catalog(siteId).filter((c) => c.perm).map((c) => [c.id, Boolean(can(c.perm))])),
  };
}

// Enregistre le brouillon (remplace l'ensemble). rev = version que la personne a sous les yeux : si une autre session l'a changée, rien n'est écrasé.
function saveDraft(ctx, siteId, rawChanges, userId, { rev, can } = {}) {
  const live = liveConfig(ctx, siteId);
  const changes = diffAgainst(live.config, cleanChanges(rawChanges, siteId, { can }), siteId);
  applyChanges(live.config, changes, siteId); // refus clair avant d'écrire
  const row = draftRow(siteId);
  if (row && Number.isInteger(rev) && rev !== row.rev) throw new UserError("Le brouillon a été modifié depuis que vous l'avez ouvert (autre onglet ou autre personne). Rechargez l'écran Styles : vos modifications n'ont pas été enregistrées.");
  if (!row && Number.isInteger(rev) && rev > 0) throw new UserError("Le brouillon a été supprimé ou publié depuis que vous l'avez ouvert. Rechargez l'écran Styles : vos modifications n'ont pas été enregistrées.");
  if (!Object.keys(changes).length) { discardDraft(siteId); return { rev: 0, count: 0 }; }
  const json = JSON.stringify(changes);
  if (row) db.prepare("UPDATE cms_customizer_drafts SET changes = ?, rev = rev + 1, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(json, userId, row.id);
  else db.prepare("INSERT INTO cms_customizer_drafts (site_id, changes, rev, base_rev, updated_by) VALUES (?, ?, 1, ?, ?)").run(siteId, json, live.revision, userId);
  const now = draftRow(siteId);
  return { rev: now.rev, count: Object.keys(changes).length, updatedAt: now.updated_at };
}
function discardDraft(siteId) {
  db.prepare(`DELETE FROM cms_customizer_drafts WHERE ${sameScope("site_id")}`).run(siteId);
}

// ---------- Aperçu : CSS recalculé pour un ensemble de changements (rien n'est enregistré) ----------
const BODY_VARS = (tokens) => tokensLib.tokensToCss(tokens);
function previewFor(ctx, siteId, rawChanges, { can } = {}) {
  const live = liveConfig(ctx, siteId);
  const changes = diffAgainst(live.config, cleanChanges(rawChanges, siteId, { can }), siteId);
  const { config } = applyChanges(live.config, changes, siteId);
  const structural = Object.keys(changes).some((id) => !(ctl(id) || { live: false }).live);
  return { changes, config, structural, assets: assetsOf(siteId, config), warnings: contrast(config.tokens) };
}
// Ce que la page publique du site charge, recalculé : feuilles de style (même code que le rendu public)
function assetsOf(siteId, config) {
  if (siteId === null) {
    const css = String(appearance.buildCss(config) || "");
    return { appearanceCss: [fontLib.customFaceCssFor(css, null), css].filter(Boolean).join("\n").replace(/[<>]/g, "") };
  }
  const { themeCss } = require("../marketing/pages/themeCss");
  const a = siteSettings().siteAssets(config.tokens, config.settings, themeCss);
  const vars = BODY_VARS(config.tokens);
  // @font-face de la bibliothèque et des polices téléversées par CE site, pour que la police choisie s'affiche sans recharger
  return { bodyStyle: vars, theme: a.theme, custom: a.custom, pack: a.pack ? { vars: a.pack.vars, attr: a.pack.attr } : null, faces: String(fontLib.faceCssFor(vars, { siteId }) || "").replace(/[<>]/g, "") };
}
function contrast(t) {
  const out = [], c = t.colors;
  const check = (label, a, b) => { const r = tokensLib.contrast(a, b); if (r < 4.5) out.push(`${label} : contraste ${r.toFixed(1)}:1 (4,5:1 recommandé pour la lisibilité).`); };
  check("Texte sur le fond", c.text, c.background); check("Texte sur la surface", c.text, c.surface); check("Texte discret sur le fond", c.muted, c.background);
  check("Texte des boutons sur la couleur principale", tokensLib.onColor(c.primary), c.primary);
  return out;
}

// ---------- Publication ----------
// Applique le brouillon enregistré au moteur du site, en une opération ; l'écran n'annonce un succès qu'après cette fonction.
function publish(ctx, siteId, userId, { rev, note = "", can = () => true } = {}) {
  const row = draftRow(siteId);
  if (!row) throw new UserError("Rien à publier : aucun brouillon en attente pour ce site.");
  if (Number.isInteger(rev) && rev !== row.rev) throw new UserError("Le brouillon a changé depuis que vous l'avez ouvert : rechargez l'écran Styles avant de publier.");
  const live = liveConfig(ctx, siteId);
  if (siteId === null && live.pendingEngineDraft) throw new UserError("Un brouillon de l'Éditeur du site (Apparence → Styles, En-tête ou Pied de page) est en cours : publiez-le ou annulez-le d'abord, pour ne publier que vos changements ici.");
  if (row.base_rev !== live.revision) throw new UserError("L'apparence de ce site a été publiée par ailleurs depuis le début de ce brouillon : rechargez l'écran Styles pour repartir de la version en ligne (vos changements ne sont pas appliqués).");
  const changes = diffAgainst(live.config, cleanChanges(parse(row.changes), siteId, { can }), siteId);
  if (!Object.keys(changes).length) { discardDraft(siteId); throw new UserError("Rien à publier : le brouillon est identique à la version en ligne."); }
  const liveNow = live;
  const { config } = applyChanges(liveNow.config, changes, siteId);
  const previous = Object.fromEntries(Object.keys(changes).map((id) => { const v = getPath(liveNow.config, id); return [id, v === undefined ? null : v]; }));
  transaction(db, () => {
    if (siteId === null) {
      appearance.setDraft(null, config, userId);
      appearance.publish(null, userId, note || "Styles");
    } else {
      pages().saveSiteDesign(ctx, siteId, { tokens: config.tokens, settings: config.settings, name: config.name, revision: liveNow.revision });
    }
    db.prepare("INSERT INTO cms_customizer_versions (site_id, changes, previous, note, published_by) VALUES (?, ?, ?, ?, ?)").run(siteId, JSON.stringify(changes), JSON.stringify(previous), String(note || (liveNow !== live ? "Changement de thème" : "")).slice(0, 120), userId);
    db.prepare(`DELETE FROM cms_customizer_versions WHERE ${sameScope("site_id")} AND id NOT IN (SELECT id FROM cms_customizer_versions WHERE ${sameScope("site_id")} ORDER BY id DESC LIMIT ?)`).run(siteId, siteId, MAX_VERSIONS);
    discardDraft(siteId);
  });
  return { changed: Object.keys(changes), state: state(ctx, siteId, { can }) };
}
// Revenir à ce que la publication d'une version avait remplacé : placé dans le BROUILLON (rien n'est publié tant qu'on ne publie pas)
function history(siteId, limit = 10) {
  return db.prepare(`SELECT v.id, v.note, v.published_at, v.changes, u.username AS by FROM cms_customizer_versions v LEFT JOIN users u ON u.id = v.published_by WHERE ${sameScope("v.site_id")} ORDER BY v.id DESC LIMIT ?`).all(siteId, limit)
    .map((r) => ({ id: r.id, note: r.note, publishedAt: r.published_at, by: r.by, count: Object.keys(parse(r.changes)).length }));
}
function restoreVersion(ctx, siteId, versionId, userId, { can } = {}) {
  const r = db.prepare(`SELECT previous FROM cms_customizer_versions WHERE id = ? AND ${sameScope("site_id")}`).get(Number(versionId), siteId);
  if (!r) throw new UserError("Version introuvable.");
  const prev = parse(r.previous);
  const usable = Object.fromEntries(Object.entries(prev).filter(([id]) => { const c = ctl(id); return c && c.scope.includes(scopeName(siteId)); }).map(([id, v]) => { const c = ctl(id); return [id, v === null ? (c.pack ? c.default : c.kind === "toggle" ? false : c.kind === "palette" ? [] : "") : v]; }));
  if (!Object.keys(usable).length) throw new UserError("Cette version ne contient aucun réglage restaurable.");
  const row = draftRow(siteId);
  const merged = { ...(row ? parse(row.changes) : {}), ...usable };
  return saveDraft(ctx, siteId, merged, userId, { can });
}

module.exports = { PANELS, catalog, panelsFor, state, saveDraft, discardDraft, previewFor, publish, history, restoreVersion, cleanChanges, applyChanges, assetsOf, controlById: (id) => ctl(id), MAX_VERSIONS };
