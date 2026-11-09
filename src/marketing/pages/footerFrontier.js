// FRONTIÈRE DE PIED (indépendance graphique du pied de page du Theme Builder).
// Un pied peut être dans trois états, portés par le DOCUMENT du pied (section.ftMode), donc copiés, versionnés et restaurés avec lui :
//   legacy (absent)  comportement historique, strictement inchangé : le pied lit le thème et les réglages du site (défaut de tous les pieds déjà installés)
//   solo             indépendant : <footer data-kw-ft="solo"> posé APRÈS </main> ; il lit ses propres variables (--kw-* / --lp-* redéfinies sur sa racine, + --ft-*) ;
//                    aucune règle « du site » (thème, réglages globaux, CSS personnalisé) ne l'atteint (exclusion ajoutée à l'émission du CSS, spécificité 0)
//   site             hérité de la charte du site : posé après </main> comme solo, mais sans exclusion ni coupure de l'héritage ; --ft-* branchés sur la charte
// Ce module : (1) excludeFooter(css) — l'exclusion, à appliquer à CHAQUE feuille « du site » émise ; (2) la table des variables du site lues par les widgets partagés
// (landing.css, motion-studio.css…) et leur remplacement local ; (3) la validation du réglage stocké dans le document. Le CSS statique de la frontière est dans public/css/landing.css.
const T = () => require("./tokens");

const MODES = Object.freeze(["legacy", "solo", "site"]);
const MODE_LABEL = Object.freeze({ legacy: "Ancien comportement (suit le thème du site, comme avant)", solo: "Indépendante du site (le thème et les réglages du site ne la modifient plus)", site: "Suit la charte du site (couleurs, polices et boutons du site)" });
// Exclusion : « ce sélecteur ne peut jamais viser le pied solo ni rien de ce qu'il contient ». :where() → spécificité 0 : la cascade existante ne bouge pas, `!important` compris.
const SOLO = '[data-kw-ft="solo"]';
// Deux :not(:where()) à la suite plutôt qu'une liste : aucune virgule dans le suffixe (les outils qui découpent un sélecteur à la virgule ne le cassent pas) ; spécificité toujours 0
const SUFFIX = `:not(:where(${SOLO} *)):not(:where(${SOLO}))`;

// Variables du site lues par les widgets partagés et qui n'ont pas leur place dans les jetons (posées sur <body> par la vue) : remplacées localement aussi
const EXTRA_VARS = Object.freeze({ "--kw-lb-overlay": "rgba(0,0,0,.85)", "--kw-band-w": "1100px" });
// --lp-* : alias historiques de la page, redéfinis sur la racine du pied par landing.css (valeurs prises sur les --kw-* locaux)
const LP_VARS = Object.freeze(["--lp-accent", "--lp-on-accent", "--lp-bg", "--lp-text"]);
// Jetons propres au pied (--ft-*) → variables que lisent les widgets partagés (un jeton fourni remplace la variable correspondante, dans le pied seulement)
const FT_TO_KW = Object.freeze({
  "--ft-accent": ["--kw-primary"], "--ft-on-accent": ["--kw-on-primary"], "--ft-bg": ["--kw-background"], "--ft-bg-alt": ["--kw-surface"],
  "--ft-text": ["--kw-text"], "--ft-muted": ["--kw-muted"], "--ft-font": ["--kw-font-body", "--kw-font-button", "--kw-font-link"], "--ft-font-head": ["--kw-font-heading"],
  "--ft-size": ["--kw-body-size"], "--ft-weight": ["--kw-body-weight"], "--ft-lh": ["--kw-body-lh"], "--ft-radius": ["--kw-radius-card", "--kw-radius-lg"], "--ft-radius-btn": ["--kw-radius-button"],
});

// ---------- Exclusion du pied dans le CSS « du site » ----------
function splitTop(s, sep) {
  const out = []; let depth = 0, quote = "", cur = "";
  for (const ch of s) {
    if (quote) { cur += ch; if (ch === quote) quote = ""; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === "(" || ch === "[") depth++;
    if (ch === ")" || ch === "]") depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out;
}
// Position du pseudo-élément final (::x ou :before/:after/:first-line/:first-letter/:placeholder…) hors parenthèses
function pseudoElementAt(sel) {
  let depth = 0, quote = "";
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (quote) { if (ch === quote) quote = ""; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === ":" && depth === 0) {
      if (sel[i + 1] === ":") return i;
      if (/^:(before|after|first-line|first-letter)\b/i.test(sel.slice(i))) return i;
    }
  }
  return -1;
}
// Le sélecteur ne concerne que html / :root (variables, fond de page) : jamais le pied, rien à exclure
const ROOT_ONLY = /^(html|:root)(?![\w-])(?:\s*[:.\[#][^\s>+~,]*)*$/i;
function excludeSelector(sel) {
  const s = sel.trim();
  if (!s) return "";
  if (ROOT_ONLY.test(s)) return s;
  const at = pseudoElementAt(s);
  return at < 0 ? s + SUFFIX : s.slice(0, at) + SUFFIX + s.slice(at);
}
const stripComments = (css) => String(css).replace(/\/\*[\s\S]*?\*\//g, "");
// Ajoute l'exclusion au sujet de chaque sélecteur d'une feuille (récursif dans @media / @supports / @container / @layer ; @font-face, @keyframes, @view-transition, @page… inchangés)
function excludeFooter(css) {
  const src = stripComments(css);
  if (!src.trim()) return String(css || "");
  const blockEnd = (from) => {
    let depth = 1, j = from, quote = "";
    while (j < src.length && depth) {
      const ch = src[j];
      if (quote) { if (ch === "\\") j++; else if (ch === quote) quote = ""; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === "{") depth++;
      else if (ch === "}") depth--;
      j++;
    }
    return j;
  };
  const walk = (start, end) => {
    let i = start, out = "";
    while (i < end) {
      const open = src.indexOf("{", i);
      const semi = src.indexOf(";", i);
      // @import / @charset / @layer a, b; : instruction sans bloc
      if (/^\s*@/.test(src.slice(i, Math.min(end, open < 0 ? end : open))) && semi >= 0 && (open < 0 || semi < open) && semi < end) { out += src.slice(i, semi + 1); i = semi + 1; continue; }
      if (open < 0 || open >= end) { out += src.slice(i, end); break; }
      const head = src.slice(i, open).trim();
      const close = blockEnd(open + 1);
      const body = src.slice(open + 1, close - 1);
      if (head.startsWith("@")) {
        const kind = head.split(/[\s({]/)[0].toLowerCase();
        out += ["@media", "@supports", "@container", "@layer", "@scope", "@document"].includes(kind) ? `${head}{${walk(open + 1, close - 1)}}` : `${head}{${body}}`;
      } else out += `${splitTop(head, ",").map(excludeSelector).filter(Boolean).join(",")}{${body}}`;
      i = close;
    }
    return out;
  };
  return walk(0, src.length);
}

// ---------- Réglage stocké dans le document du pied ----------
const KW_NAME = /^--(?:kw|ft)-[a-z0-9-]{1,40}$/;
const SAFE_VALUE = /^[A-Za-z0-9 #%.,()'"/_+*:-]{1,400}$/;
function normalizeVars(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw).slice(0, 160)) {
    const val = typeof v === "number" ? String(v) : typeof v === "string" ? v.trim() : "";
    if (KW_NAME.test(k) && SAFE_VALUE.test(val) && !/url\s*\(|expression|@import|javascript/i.test(val)) out[k] = val;
  }
  return out;
}
// { ftMode?, ftVars? } à poser sur une section (« legacy » = absence de réglage). Jamais d'erreur : une valeur inconnue revient à l'ancien comportement.
function normalizeAppearance(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  if (raw.ftMode === "solo" || raw.ftMode === "site") out.ftMode = raw.ftMode;
  const vars = normalizeVars(raw.ftVars);
  if (out.ftMode && Object.keys(vars).length) out.ftVars = vars;
  return out;
}
const modeOf = (section) => (section && (section.ftMode === "solo" || section.ftMode === "site") ? section.ftMode : "legacy");

// ---------- Variables locales du pied solo ----------
function parseDecls(css) {
  const out = {};
  for (const d of String(css).split(";")) { const i = d.indexOf(":"); if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim(); }
  return out;
}
// Toutes les variables « du site » posées par les jetons (valeurs par défaut de la plateforme) + les variables annexes
let defaults = null;
const defaultVars = () => defaults || (defaults = Object.freeze({ ...parseDecls(T().tokensToCss({})), ...EXTRA_VARS }));
// Variables d'un site (à figer dans le pied au moment de le rendre indépendant : son apparence ne change alors pas)
const varsFromTokens = (tokens, extra = {}) => ({ ...parseDecls(T().tokensToCss(tokens || {})), ...EXTRA_VARS, ...extra });
// Liste explicite des variables du site que le pied solo REMPLACE localement (le test de couverture compare cette liste aux var(--kw-…) / var(--lp-…) des feuilles partagées)
const siteVars = () => [...Object.keys(defaultVars()), ...LP_VARS];
// Déclarations de la racine solo : variables par défaut, puis celles figées dans le document, puis les jetons --ft-* et leur remplacement des variables lues par les widgets
function rootVars(section) {
  const own = normalizeVars(section && section.ftVars);
  const vars = { ...defaultVars() };
  for (const [k, v] of Object.entries(own)) if (k.startsWith("--kw-")) vars[k] = v;
  for (const [k, v] of Object.entries(own)) if (k.startsWith("--ft-")) { vars[k] = v; for (const t of FT_TO_KW[k] || []) vars[t] = `var(${k})`; }
  return vars;
}
const rootStyle = (section) => Object.entries(rootVars(section)).map(([k, v]) => `${k}:${v}`).join(";");
// Polices : les @font-face des familles du pied sont fournis avec la page (la feuille des polices lit du CSS ; on lui donne les variables)
const fontCss = (section) => `:root{${rootStyle(section)}}`;
// Attributs de la racine <footer> pour une section : { mode, attrs }
function rootInfo(section) {
  const mode = modeOf(section);
  if (mode === "legacy") return { mode, style: "" };
  return { mode, style: mode === "solo" ? rootStyle(section) : "" };
}

module.exports = { MODES, MODE_LABEL, SOLO, SUFFIX, EXTRA_VARS, LP_VARS, FT_TO_KW, excludeFooter, excludeSelector, normalizeVars, normalizeAppearance, modeOf, defaultVars, varsFromTokens, siteVars, rootVars, rootStyle, fontCss, rootInfo };
