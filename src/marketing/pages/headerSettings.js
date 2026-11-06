// Entête d'un site : modèle de réglages (settings.header), UNE table qui sert à la validation, à l'interface du personnalisateur et au rendu (headerStyle.js).
// Chaque réglage : id (clé dans settings.header), type, défaut, onglet (general | design), groupe d'écran, libellé. Les réglages « par appareil » existent en trois
// valeurs : ordinateur (clé), tablette (clé + "T") et mobile (clé + "M") ; vide/absent = hérite de l'appareil plus grand (jamais d'écrasement entre appareils).
// Types : bool · enum · text · num (min, max) · color ("" | #rrggbb | token:nom) · vis (sous-ensemble de « dtm » : d = ordinateur, t = tablette, m = mobile) ·
//         space (« haut,droite,bas,gauche;unité » : cases vides permises) · media (adresse d'image du site).

const DEVICES = ["", "T", "M"];
const UNITS = ["px", "em", "rem", "%"];
const FONT_WEIGHTS = ["", "400", "500", "600", "700", "800"];
const TRANSFORMS = ["", "none", "uppercase", "lowercase", "capitalize"];
const HOVERS = ["none", "underline", "underline-anim", "bg", "outline", "overline"];
const ANIMS = ["none", "fade", "slide", "zoom"];

const S = []; // entrées de la table
const add = (id, type, def, ui, o = {}) => S.push({ id, type, def, ui, ...o });
// Variante « par appareil » : id, idT, idM
const resp = (id, type, def, ui, o = {}) => { add(id, type, def, ui, { ...o, resp: "" }); const inherit = type === "num" ? null : ""; add(id + "T", type, inherit, ui, { ...o, resp: "T" }); add(id + "M", type, inherit, ui, { ...o, resp: "M" }); };
const U = (g, tab, label, extra = {}) => ({ g, tab, label, ...extra });

// ---------- Entête : structure (onglet Design de la vue principale) ----------
add("auto", "bool", false, U("entete", "elements", "Afficher l'entête automatique du site", { help: "Logo, titre et menu « En-tête du site » en haut de chaque page, quand la page n'a pas déjà son propre composant d'en-tête (Theme Builder)." }));
add("width", "enum", "full", U("entete", "design", "Largeur", { options: [["full", "Pleine largeur"], ["contained", "Largeur du contenu"]] }), { options: ["full", "contained"] });
resp("margin", "space", "", U("entete", "design", "Marge externe", { min: -400, max: 400 }), { min: -400, max: 400 });
resp("rowHeight", "num", null, U("entete", "design", "Hauteur de la rangée principale", { unit: "px", min: 40, max: 400 }), { min: 40, max: 400 });
add("rowAlign", "enum", "between", U("entete", "design", "Alignement horizontal", { options: [["between", "Écarté"], ["start", "À gauche"], ["center", "Au centre"], ["end", "À droite"]] }), { options: ["between", "start", "center", "end"] });
add("rowBg", "color", "", U("entete", "design", "Arrière-plan de la rangée principale"));
add("rowBorder", "num", null, U("entete", "design", "Épaisseur de la bordure inférieure", { unit: "px", min: 0, max: 20 }), { min: 0, max: 20 });
add("rowBorderColor", "color", "", U("entete", "design", "Couleur de la bordure inférieure"));
resp("rowPadding", "space", "", U("entete", "design", "Espacement intérieur", { min: 0, max: 200 }), { min: 0, max: 200 });

// ---------- Titre et logo ----------
resp("logoWidth", "num", null, U("logo", "general", "Largeur du logo", { unit: "px", min: 20, max: 600 }), { min: 20, max: 600 });
add("logoSvg", "bool", false, U("logo", "general", "Utiliser le logo SVG", { help: "Le logo est affiché comme un masque : il prend la couleur choisie dans Design (SVG ou PNG transparent)." }));
add("title", "text", "", U("logo", "general", "Titre du site", { max: 100, help: "Vide : le nom du site. Ne change pas le nom interne du site." }), { max: 100 });
add("titleVis", "vis", "auto", U("logo", "general", "Visibilité du titre du site"));
add("sameLine", "bool", true, U("logo", "general", "Logo et titre du site sur la même ligne"));
add("tagline", "text", "", U("logo", "general", "Slogan", { max: 160 }), { max: 160 });
add("taglineVis", "vis", "dtm", U("logo", "general", "Visibilité du slogan du site"));
add("logoVis", "vis", "dtm", U("logo", "general", "Visibilité"));
add("logoColor", "color", "", U("logo", "design", "Couleur du logo", { help: "S'applique au logo SVG (voir « Utiliser le logo SVG »)." }));
add("titleColor", "color", "", U("logo", "design", "Couleur du titre"));
add("titleHover", "color", "", U("logo", "design", "Couleur du titre au survol"));
add("taglineColor", "color", "", U("logo", "design", "Couleur du slogan"));
resp("titleSize", "num", null, U("logo", "design", "Taille de la police du titre", { unit: "px", min: 10, max: 96 }), { min: 10, max: 96 });
resp("identityMargin", "space", "", U("logo", "design", "Marge externe", { min: -200, max: 200 }), { min: -200, max: 200 });

// ---------- Menu principal ----------
add("menuSubWidth", "num", null, U("menu", "general", "Largeur du sous-menu", { unit: "px", min: 120, max: 600 }), { min: 120, max: 600 });
add("menuSeparator", "bool", false, U("menu", "general", "Séparateur d'élément"));
add("menuVis", "vis", "dtm", U("menu", "general", "Visibilité"));
add("menuHover", "enum", "none", U("menu", "design", "Style au survol de menu", { options: [["none", "Aucun(e)"], ["underline", "Soulignement"], ["underline-anim", "Soulignement animé"], ["bg", "Fond coloré"], ["outline", "Contour"], ["overline", "Trait au-dessus"]] }), { options: HOVERS });
add("menuSubOffset", "num", null, U("menu", "design", "Décalage supérieur du sous-menu", { unit: "px", min: 0, max: 80 }), { min: 0, max: 80 });
add("menuSubAnim", "enum", "none", U("menu", "design", "Animation de sous-menu", { options: [["none", "Aucun(e)"], ["fade", "Fondu"], ["slide", "Glissement"], ["zoom", "Zoom léger"]] }), { options: ANIMS });
add("menuSubBorder", "space", "", U("menu", "design", "Largeur de bordure du sous-menu", { min: 0, max: 20 }), { min: 0, max: 20 });
add("menuSubBorderColor", "color", "", U("menu", "design", "Couleur de bordure du sous-menu"));
add("menuSubRadius", "space", "", U("menu", "design", "Rayon de bordure du sous-menu", { min: 0, max: 60, corners: true }), { min: 0, max: 60 });
for (const [k, label] of [["", "normal"], ["Hover", "survol"], ["Active", "actif"]]) {
  add("menuColor" + k, "color", "", U("menu", "design", `Texte/lien — ${label}`, { family: "menuColor", state: label }));
  add("menuBg" + k, "color", "", U("menu", "design", `Arrière-plan — ${label}`, { family: "menuBg", state: label }));
}
add("menuSubColor", "color", "", U("menu", "design", "Sous-menu : texte/lien"));
add("menuSubBg", "color", "", U("menu", "design", "Sous-menu : arrière-plan"));
add("menuFont", "enum", "", U("menu", "design", "Police du menu", { options: [["", "Héritée"], ["heading", "Police des titres"], ["body", "Police du texte"], ["button", "Police des boutons"]] }), { options: ["", "heading", "body", "button"] });
resp("menuSize", "num", null, U("menu", "design", "Taille du texte", { unit: "px", min: 10, max: 40 }), { min: 10, max: 40 });
add("menuWeight", "enum", "", U("menu", "design", "Graisse", { options: [["", "Héritée"], ["400", "Normale"], ["500", "Moyenne"], ["600", "Demi-grasse"], ["700", "Grasse"], ["800", "Très grasse"]] }), { options: FONT_WEIGHTS });
add("menuLineHeight", "num", null, U("menu", "design", "Hauteur de ligne", { min: 1, max: 3, step: 0.05 }), { min: 1, max: 3 });
add("menuLetter", "num", null, U("menu", "design", "Espacement des lettres", { unit: "em", min: -0.1, max: 0.5, step: 0.01 }), { min: -0.1, max: 0.5 });
add("menuTransform", "enum", "", U("menu", "design", "Transformation du texte", { options: [["", "Héritée"], ["none", "Aucune"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Première lettre en majuscule"]] }), { options: TRANSFORMS });
resp("menuPadding", "space", "", U("menu", "design", "Espacement du menu", { min: 0, max: 100 }), { min: 0, max: 100 });
resp("menuMargin", "space", "", U("menu", "design", "Marge externe", { min: -200, max: 200 }), { min: -200, max: 200 });

// ---------- Menu hors-champ ----------
add("ocVis", "vis", "", U("oc", "general", "Visibilité", { help: "Appareils où le menu hors-champ remplace le menu principal." }));
add("ocSeparator", "bool", false, U("oc", "general", "Séparateur d'élément"));
add("ocMode", "enum", "panel", U("oc", "general", "Type d'ouverture", { options: [["panel", "Panneau latéral"], ["full", "Plein écran"], ["dropdown", "Déroulant"]] }), { options: ["panel", "full", "dropdown"] });
add("ocDir", "enum", "right", U("oc", "general", "Direction d'ouverture", { options: [["left", "Gauche"], ["right", "Droite"]] }), { options: ["left", "right"] });
add("ocLabel", "text", "Menu", U("oc", "general", "Texte du déclencheur", { max: 20, help: "Lu par les lecteurs d'écran ; affiché à côté de l'icône si « Afficher le texte » est activé." }), { max: 20 });
add("ocShowLabel", "bool", false, U("oc", "general", "Afficher le texte à côté de l'icône"));
add("ocColor", "color", "", U("oc", "design", "Lien — normal"));
add("ocColorHover", "color", "", U("oc", "design", "Lien — survol"));
add("ocColorActive", "color", "", U("oc", "design", "Lien — actif"));
add("ocBg", "color", "", U("oc", "design", "Arrière-plan du panneau"));
add("ocBgHover", "color", "", U("oc", "design", "Arrière-plan d'un lien — survol"));
add("ocTriggerColor", "color", "", U("oc", "design", "Couleur du déclencheur"));
add("ocFont", "enum", "", U("oc", "design", "Police du menu", { options: [["", "Héritée"], ["heading", "Police des titres"], ["body", "Police du texte"], ["button", "Police des boutons"]] }), { options: ["", "heading", "body", "button"] });
resp("ocSize", "num", null, U("oc", "design", "Taille du texte", { unit: "px", min: 10, max: 48 }), { min: 10, max: 48 });
add("ocWeight", "enum", "", U("oc", "design", "Graisse", { options: [["", "Héritée"], ["400", "Normale"], ["500", "Moyenne"], ["600", "Demi-grasse"], ["700", "Grasse"], ["800", "Très grasse"]] }), { options: FONT_WEIGHTS });
add("ocLineHeight", "num", null, U("oc", "design", "Hauteur de ligne", { min: 1, max: 3, step: 0.05 }), { min: 1, max: 3 });
add("ocLetter", "num", null, U("oc", "design", "Espacement des lettres", { unit: "em", min: -0.1, max: 0.5, step: 0.01 }), { min: -0.1, max: 0.5 });
resp("ocPadding", "space", "", U("oc", "design", "Espacement de menu", { min: 0, max: 100 }), { min: 0, max: 100 });
resp("ocMargin", "space", "", U("oc", "design", "Marge externe", { min: -200, max: 200 }), { min: -200, max: 200 });
add("ocSubColor", "color", "", U("oc", "design", "Sous-menu : texte/lien"));
add("ocSubBg", "color", "", U("oc", "design", "Sous-menu : arrière-plan"));

// ---------- Entête transparent ----------
add("tpEnabled", "bool", false, U("tp", "general", "Activer sur tout le site"));
add("tpOn", "enum", "both", U("tp", "general", "Activer sur", { options: [["desktop", "Ordinateur"], ["mobile", "Mobile"], ["both", "Ordinateur + Mobile"]], help: "La tablette suit le mobile." }), { options: ["desktop", "mobile", "both"] });
add("tpLogo", "bool", false, U("tp", "general", "Logo transparent différent"));
add("tpLogoUrl", "media", "", U("tp", "general", "Logo de l'entête transparent", { showIf: "tpLogo" }));
add("tpBorder", "num", null, U("tp", "design", "Taille de bordure inférieure", { unit: "px", min: 0, max: 20 }), { min: 0, max: 20 });
add("tpLogoColor", "color", "", U("tp", "design", "Couleur du logo"));
add("tpBg", "color", "", U("tp", "design", "Superposition d'arrière-plan — entête principal"));
add("tpTitle", "color", "", U("tp", "design", "Titre du site"));
add("tpTitleHover", "color", "", U("tp", "design", "Titre du site — survol"));
add("tpTagline", "color", "", U("tp", "design", "Slogan"));
for (const [k, label] of [["", "normal"], ["Hover", "survol"], ["Active", "actif"]]) {
  add("tpMenuColor" + k, "color", "", U("tp", "design", `Menu : texte/lien — ${label}`));
  add("tpMenuBg" + k, "color", "", U("tp", "design", `Menu : arrière-plan — ${label}`));
}
add("tpSubColor", "color", "", U("tp", "design", "Sous-menu : texte/lien"));
add("tpSubBg", "color", "", U("tp", "design", "Sous-menu : arrière-plan"));
add("tpTriggerColor", "color", "", U("tp", "design", "Déclencheur du menu hors-champ"));

const BY_ID = new Map(S.map((e) => [e.id, e]));
const DEFAULTS = Object.freeze(Object.fromEntries(S.map((e) => [e.id, e.def])));

// ---------- Validation ----------
const HEX = /^#[0-9a-f]{6}$/i;
function parseSpace(v, min, max) {
  const s = String(v ?? "").trim();
  if (!s) return { ok: true, value: "" };
  const [body, unit = "px"] = s.split(";");
  if (!UNITS.includes(unit)) return { ok: false };
  const parts = body.split(",");
  if (parts.length !== 4) return { ok: false };
  const out = [];
  for (const p of parts) {
    const t = p.trim();
    if (t === "") { out.push(""); continue; }
    const n = Number(t);
    if (!Number.isFinite(n) || n < min || n > max) return { ok: false };
    out.push(String(Math.round(n * 100) / 100));
  }
  if (out.every((x) => x === "")) return { ok: true, value: "" };
  return { ok: true, value: out.join(",") + (unit === "px" ? "" : ";" + unit) };
}

// helpers : { mediaUrl(v, label, strict), bad(msg) } fournis par siteSettings (même règles d'adresses d'image que le reste du site)
function normalize(input, { strict = false, helpers = {} } = {}) {
  const src = input && typeof input === "object" ? input : {};
  const out = {};
  const fail = (msg) => { throw (helpers.bad ? helpers.bad(msg) : new Error(msg)); };
  for (const e of S) {
    const raw = src[e.id];
    const label = e.ui.label;
    const refuse = (why) => { if (strict) fail(`Entête — ${label} : ${why}`); return e.def; };
    if (raw === undefined || raw === null || raw === "") { out[e.id] = e.type === "bool" && raw !== undefined ? false : e.type === "enum" && raw === "" && e.options.includes("") ? "" : e.def; continue; }
    switch (e.type) {
      case "bool": out[e.id] = raw === true || raw === "true" || raw === 1 || raw === "1" || raw === "on"; break;
      case "enum": out[e.id] = e.options.includes(String(raw)) ? String(raw) : refuse("choix inconnu."); break;
      case "text": { const s = String(raw).replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim(); out[e.id] = s.length <= e.max ? s : refuse(`${e.max} caractères au plus.`); break; }
      case "num": { const n = Number(raw); out[e.id] = Number.isFinite(n) && n >= e.min && n <= e.max ? Math.round(n * 100) / 100 : refuse(`un nombre entre ${e.min} et ${e.max} est attendu.`); break; }
      case "color": { const v = String(raw).trim().toLowerCase(); out[e.id] = HEX.test(v) || /^token:[a-z0-9-]{1,24}$/.test(v) ? v : refuse("code couleur #rrggbb attendu."); break; }
      case "vis": { const v = String(raw); if (v === "auto" && e.def === "auto") { out[e.id] = "auto"; break; } out[e.id] = /^[dtm]{0,3}$/.test(v) ? [...new Set(v.split(""))].sort((a, b) => "dtm".indexOf(a) - "dtm".indexOf(b)).join("") : refuse("appareils attendus parmi d, t, m."); break; }
      case "space": { const r = parseSpace(raw, e.min, e.max); out[e.id] = r.ok ? r.value : refuse(`quatre valeurs entre ${e.min} et ${e.max} attendues.`); break; }
      case "media": { const m = String(raw).trim(); out[e.id] = helpers.mediaUrl ? helpers.mediaUrl(raw, label, strict) : (/^(\/uploads\/[A-Za-z0-9._\-\/]+|https:\/\/[A-Za-z0-9._~\-\/%?=&+:@]+)$/.test(m) && !m.includes("..") ? m : refuse("choisissez une image de la médiathèque ou une adresse https.")); break; }
      default: out[e.id] = e.def;
    }
  }
  return out;
}

// Catalogue pour le personnalisateur : une ligne par réglage, groupée par écran (g) et par onglet (tab)
// « auto » (titre) : visible s'il n'y a pas de logo, masqué quand un logo est affiché (comportement d'origine de l'entête automatique)
const effectiveVis = (v, hasLogo) => (v === "auto" ? (hasLogo ? "" : "dtm") : v);
const catalog = () => S.map((e) => ({ id: e.id, type: e.type, def: e.def, resp: e.resp, ...e.ui, options: e.ui.options }));
const GROUPS = Object.freeze({
  entete: { label: "Entête", hint: "Largeur, marges et rangée principale de l'entête." },
  logo: { label: "Titre et logo du site", hint: "Logo, titre, slogan, couleurs et espacements." },
  oc: { label: "Menu hors-champ", hint: "Panneau de navigation ouvert par un bouton (ordinateur, tablette, mobile)." },
  menu: { label: "Menu principal", hint: "Sous-menus, survol, couleurs, police et espacements." },
  tp: { label: "Entête transparent", hint: "L'entête passe par-dessus le haut de la page." },
});

module.exports = { effectiveVis, SPEC: S, BY_ID, DEFAULTS, DEVICES, UNITS, GROUPS, normalize, parseSpace, catalog };
