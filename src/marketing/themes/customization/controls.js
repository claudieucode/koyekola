// Réglages de personnalisation d'un thème : le CATALOGUE des réglages que Kolakisa sait appliquer à un thème autonome (paquet), par composant.
//
// Un réglage = { id, panel, kind, label, sel, css, prop, … } :
//   • sel   : sélecteurs RELATIFS à la portée du thème (body[data-kw-pack="<clé>"]) ; « " » = la portée elle-même ;
//   • css   : (valeur) → déclarations CSS ; toutes en !important pour passer devant la feuille du thème, mais UNIQUEMENT quand la personne a choisi une valeur
//             (aucun réglage choisi = aucune règle ajoutée = le design d'origine du thème, octet pour octet) ;
//   • prop  : propriété CSS observée pour MESURER l'effet (script scripts/mesurer-personnalisation-themes.js) ;
//   • un réglage n'est proposé pour un thème que s'il y trouve des éléments ET que la mesure a vu la valeur changer (inventaire : effective.json).
// Les valeurs sont validées ici (couleur hexadécimale, nombre borné, choix fermé) : aucune valeur libre n'atteint jamais la feuille de style.
const PANELS = Object.freeze([
  { id: "theme", label: "Spécifique au thème", hint: "Les réglages que ce thème est seul à proposer : ses couleurs signature, ses motifs, ses animations." },
  { id: "en-tete", label: "En-tête", hint: "Hauteur, fond, couleurs, ombre et comportement collant de l'en-tête de ce thème." },
  { id: "navigation", label: "Navigation", hint: "Liens du menu : taille, graisse, casse, couleurs et état au survol." },
  { id: "mise-en-page", label: "Mise en page", hint: "Fond de page, largeur du contenu, marges et espacement des sections." },
  { id: "typographie", label: "Typographie", hint: "Titres, texte courant et liens de ce thème." },
  { id: "boutons", label: "Boutons", hint: "Couleurs, arrondi, graisse et états des boutons de ce thème." },
  { id: "cartes", label: "Cartes et images", hint: "Cartes, blocs et images : arrondi, ombre et bordure." },
  { id: "pied", label: "Pied de page", hint: "Fond, couleurs, espacement et liens du pied de page." },
]);

const HEX = /^#[0-9a-f]{6}$/i;
const SHADOWS = { none: "none", sm: "0 1px 3px rgba(0,0,0,.18)", md: "0 6px 18px rgba(0,0,0,.22)", lg: "0 18px 44px rgba(0,0,0,.30)" };
const SHADOW_OPTS = [["none", "Aucune"], ["sm", "Légère"], ["md", "Moyenne"], ["lg", "Forte"]];
const WEIGHTS = [["400", "Normale"], ["500", "Moyenne"], ["600", "Demi-grasse"], ["700", "Grasse"], ["800", "Très grasse"]];
const CASES = [["none", "D'origine"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Initiales"]];
const UNDERLINES = [["none", "Jamais"], ["underline", "Toujours"]];

const BTN = ':is(button,[class*="btn"],[class*="button"],input[type="submit"],.lp-btn)';
const CARD = ':is(article,[class*="card"])';
const NAVA = "header a, nav a";
const TXT = "main p, main li, .lp-main p, .lp-main li";
const LINKS = ".lp-main p a, .lp-main li a";

const list = [];
const add = (id, panel, kind, label, o) => list.push({ id, panel, kind, label, ...o });
const color = (id, panel, label, sel, prop, css, extra = {}) => add(id, panel, "color", label, { sel, prop, css: (v) => css.replace(/\$/g, v), ...extra });
const num = (id, panel, label, sel, prop, css, min, max, unit = "px", extra = {}) => add(id, panel, "number", label, { sel, prop, min, max, unit, step: extra.step || 1, css: (v) => css.replace(/\$/g, `${v}${unit}`), ...extra });
const sel = (id, panel, label, sel_, prop, css, options, extra = {}) => add(id, panel, "select", label, { sel: sel_, prop, options, css: (v) => css.replace(/\$/g, v), ...extra });
const tgl = (id, panel, label, sel_, prop, css, extra = {}) => add(id, panel, "toggle", label, { sel: sel_, prop, css: () => css, ...extra });

// En-tête
color("hd-bg", "en-tete", "Fond de l'en-tête", "header", "backgroundColor", "background:$!important");
color("hd-fg", "en-tete", "Texte de l'en-tête", "header, header :is(a,span,li,p,strong)", "color", "color:$!important");
num("hd-h", "en-tete", "Hauteur minimale", "header", "minHeight", "min-height:$!important", 40, 240);
num("hd-py", "en-tete", "Marge intérieure verticale", "header", "paddingTop", "padding-top:$!important;padding-bottom:$!important", 0, 80);
tgl("hd-sticky", "en-tete", "En-tête collant au défilement", "header", "position", "position:sticky!important;top:0!important;z-index:60!important");
sel("hd-shadow", "en-tete", "Ombre de l'en-tête", "header", "boxShadow", "box-shadow:$!important", SHADOW_OPTS, { map: SHADOWS });
color("hd-line", "en-tete", "Filet sous l'en-tête", "header", "borderBottomColor", "border-bottom:1px solid $!important");

// Navigation
color("nv-fg", "navigation", "Couleur des liens", NAVA, "color", "color:$!important");
color("nv-hover", "navigation", "Couleur au survol", "header a:hover, nav a:hover", "color", "color:$!important", { state: true });
num("nv-size", "navigation", "Taille des liens", NAVA, "fontSize", "font-size:$!important", 11, 28);
sel("nv-weight", "navigation", "Graisse des liens", NAVA, "fontWeight", "font-weight:$!important", WEIGHTS);
sel("nv-case", "navigation", "Casse des liens", NAVA, "textTransform", "text-transform:$!important", CASES);
num("nv-track", "navigation", "Espacement des lettres", NAVA, "letterSpacing", "letter-spacing:$!important", 0, 0.3, "em", { step: 0.01 });
num("nv-gap", "navigation", "Espace entre les liens", "header :is(ul,nav)", "columnGap", "gap:$!important", 0, 80);

// Mise en page
color("pg-bg", "mise-en-page", "Fond de la page", "", "backgroundColor", "background-color:$!important;background-image:none!important");
num("pg-max", "mise-en-page", "Largeur du contenu", "", "--pk-max", "--pk-max:$", 640, 1800, "px", { probeVar: true });
num("pg-gutter", "mise-en-page", "Marge latérale", "", "--pk-gutter", "--pk-gutter:$", 0, 96, "px", { probeVar: true });
num("pg-sec", "mise-en-page", "Espacement vertical des sections", "main section, .lp-main section", "paddingTop", "padding-top:$!important;padding-bottom:$!important", 0, 240);

// Typographie
color("ty-h", "typographie", "Couleur des titres", "h1, h2, h3, h4, h5, h6", "color", "color:$!important");
num("ty-h1", "typographie", "Taille — titre 1", "h1", "fontSize", "font-size:$!important", 18, 120);
num("ty-h2", "typographie", "Taille — titre 2", "h2", "fontSize", "font-size:$!important", 16, 96);
num("ty-h3", "typographie", "Taille — titre 3", "h3", "fontSize", "font-size:$!important", 14, 64);
sel("ty-hw", "typographie", "Graisse des titres", "h1, h2, h3, h4, h5, h6", "fontWeight", "font-weight:$!important", WEIGHTS);
sel("ty-hc", "typographie", "Casse des titres", "h1, h2, h3, h4, h5, h6", "textTransform", "text-transform:$!important", CASES);
num("ty-ht", "typographie", "Espacement des lettres — titres", "h1, h2, h3, h4, h5, h6", "letterSpacing", "letter-spacing:$!important", -0.1, 0.3, "em", { step: 0.01 });
num("ty-hl", "typographie", "Interligne des titres", "h1, h2, h3", "lineHeight", "line-height:$!important", 0.9, 2, "", { step: 0.05 });
color("ty-p", "typographie", "Couleur du texte courant", TXT, "color", "color:$!important");
num("ty-ps", "typographie", "Taille du texte courant", TXT, "fontSize", "font-size:$!important", 12, 28);
num("ty-pl", "typographie", "Interligne du texte courant", TXT, "lineHeight", "line-height:$!important", 1, 2.4, "", { step: 0.05 });
color("ty-a", "typographie", "Couleur des liens dans le texte", LINKS, "color", "color:$!important");
color("ty-ah", "typographie", "Couleur des liens au survol", ".lp-main p a:hover, .lp-main li a:hover", "color", "color:$!important", { state: true });
sel("ty-au", "typographie", "Soulignement des liens", LINKS, "textDecorationLine", "text-decoration:$!important", UNDERLINES);

// Boutons
color("bt-bg", "boutons", "Fond des boutons", BTN, "backgroundColor", "background:$!important");
color("bt-fg", "boutons", "Texte des boutons", BTN, "color", "color:$!important");
color("bt-bd", "boutons", "Bordure des boutons", BTN, "borderTopColor", "border-color:$!important");
color("bt-bgh", "boutons", "Fond au survol", `${BTN}:hover`, "backgroundColor", "background:$!important", { state: true });
color("bt-fgh", "boutons", "Texte au survol", `${BTN}:hover`, "color", "color:$!important", { state: true });
num("bt-r", "boutons", "Arrondi des boutons", BTN, "borderTopLeftRadius", "border-radius:$!important", 0, 60);
num("bt-px", "boutons", "Marge intérieure horizontale", BTN, "paddingLeft", "padding-left:$!important;padding-right:$!important", 6, 80);
num("bt-py", "boutons", "Marge intérieure verticale", BTN, "paddingTop", "padding-top:$!important;padding-bottom:$!important", 2, 40);
sel("bt-w", "boutons", "Graisse du texte", BTN, "fontWeight", "font-weight:$!important", WEIGHTS);
sel("bt-c", "boutons", "Casse du texte", BTN, "textTransform", "text-transform:$!important", CASES);

// Cartes et images
color("cd-bg", "cartes", "Fond des cartes", CARD, "backgroundColor", "background:$!important");
num("cd-r", "cartes", "Arrondi des cartes", CARD, "borderTopLeftRadius", "border-radius:$!important", 0, 60);
sel("cd-sh", "cartes", "Ombre des cartes", CARD, "boxShadow", "box-shadow:$!important", SHADOW_OPTS, { map: SHADOWS });
color("cd-bd", "cartes", "Bordure des cartes", CARD, "borderTopColor", "border:1px solid $!important");
num("im-r", "cartes", "Arrondi des images", "main img, .lp-main img", "borderTopLeftRadius", "border-radius:$!important", 0, 60);
sel("im-sh", "cartes", "Ombre des images", "main img, .lp-main img", "boxShadow", "box-shadow:$!important", SHADOW_OPTS, { map: SHADOWS });

// Pied de page
color("ft-bg", "pied", "Fond du pied de page", "footer", "backgroundColor", "background:$!important");
color("ft-fg", "pied", "Texte du pied de page", "footer, footer :is(p,span,li,small,strong)", "color", "color:$!important");
color("ft-a", "pied", "Couleur des liens du pied de page", "footer a", "color", "color:$!important");
num("ft-py", "pied", "Marge intérieure verticale", "footer", "paddingTop", "padding-top:$!important;padding-bottom:$!important", 0, 160);
num("ft-fs", "pied", "Taille du texte", "footer, footer :is(p,span,li,a,small)", "fontSize", "font-size:$!important", 10, 24);

const BY_ID = new Map(list.map((c) => [c.id, c]));
// Clé d'option enregistrée : « z- » + identifiant du réglage (≤ 25 caractères, motif imposé par le moteur de jetons)
const optKey = (id) => `z-${id}`;
const fromOptKey = (k) => (String(k).startsWith("z-") ? BY_ID.get(String(k).slice(2)) || null : null);

// Découpe une liste de sélecteurs sur les virgules de premier niveau (celles d'un :is(…) restent intactes)
function splitTop(sel) {
  const out = []; let depth = 0, cur = "";
  for (const ch of sel) { if (ch === "(" || ch === "[") depth++; else if (ch === ")" || ch === "]") depth--; if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch; }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
// Valeur (texte reçu) → valeur validée du réglage, ou null si elle est refusée
function clean(c, raw) {
  const v = String(raw ?? "").trim();
  if (c.kind === "color") return HEX.test(v) ? v.toLowerCase() : null;
  if (c.kind === "number") { const n = Number(v); return Number.isFinite(n) && n >= c.min && n <= c.max ? String(Math.round(n * 1000) / 1000) : null; }
  if (c.kind === "select") return c.options.some(([o]) => o === v) ? v : null;
  if (c.kind === "toggle") return v === "on" || v === "off" ? v : null;
  return null;
}
// Règle CSS d'un réglage pour un thème, ou "" (valeur refusée, réglage désactivé)
function rule(key, c, raw) {
  const v = clean(c, raw);
  if (v === null || (c.kind === "toggle" && v === "off")) return "";
  const scope = `body[data-kw-pack="${key}"]`;
  const decl = c.css(c.map ? c.map[v] || v : v);
  const selectors = c.sel === "" ? [scope] : splitTop(c.sel).map((s) => `${scope} ${s}`);
  return `${selectors.join(",")}{${decl}}`;
}

module.exports = { PANELS, list, BY_ID, optKey, fromOptKey, clean, rule, splitTop, HEX };
