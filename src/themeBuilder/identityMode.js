// Identité graphique d'un modèle du Theme Builder : trois modes, sans jamais réécrire le document enregistré.
//   own    (indépendant) : le document est rendu tel quel (valeurs fixes du modèle) — mode par défaut ;
//   site   (suit le site) : à l'AFFICHAGE, les valeurs de l'identité du modèle sont remplacées par les jetons de la charte du site ;
//   hybrid (hybride)      : le modèle garde son identité, sauf les GROUPES choisis (couleurs, accent, polices) qui suivent le site.
// L'identité mémorisée avec le modèle est { bg, fg, mute, alt, accent, onAccent, line, font, head } (valeurs fixes). Seules les valeurs EXACTEMENT égales à celles de l'identité sont remplacées :
// une couleur que l'utilisateur a choisie lui-même dans l'éditeur n'est jamais touchée. Le document n'étant pas modifié, repasser en « indépendant » restitue exactement l'état précédent.
const MODES = ["own", "site", "hybrid"];
const GROUPS = { colors: ["bg", "fg", "mute", "alt"], accent: ["accent", "onAccent"], fonts: ["font", "head"] };
const TOKEN = { bg: "token:background", fg: "token:text", mute: "token:muted", alt: "token:surface", accent: "token:primary", onAccent: "token:on-primary" };
const FONT = { font: "body", head: "heading" };
const ORDER = ["bg", "fg", "accent", "onAccent", "alt", "mute"]; // si deux rôles ont la même valeur, le premier gagne
const HEX = /^#[0-9a-f]{6}$/i, HEX_A = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i, FONTID = /^font\.[a-z0-9-]+$/;

// Identité à mémoriser à partir d'une identité de catalogue ; null si elle est incomplète
function snapshot(skin) {
  if (!skin) return null;
  const own = {}; for (const k of ["bg", "fg", "mute", "alt", "accent", "onAccent"]) { if (!HEX.test(String(skin[k] || ""))) return null; own[k] = skin[k].toLowerCase(); }
  own.line = HEX_A.test(String(skin.line || "")) ? skin.line.toLowerCase() : "#e2e8f0"; // le filet peut être semi-transparent (#rrggbbaa) ; il ne suit jamais le site
  for (const k of ["font", "head"]) { if (!FONTID.test(String(skin[k] || ""))) return null; own[k] = skin[k]; }
  return { mode: "own", use: [], own };
}
// Configuration saisie → configuration valide ; lève une erreur lisible sinon
function normalize(input, current) {
  const mode = String((input && input.mode) || "");
  if (!MODES.includes(mode)) throw new Error("Mode d'identité inconnu (indépendant, suit le site ou hybride).");
  if (!current || !current.own) throw new Error("Ce modèle n'a pas d'identité mémorisée : seuls les modèles insérés depuis la bibliothèque peuvent changer de mode.");
  let use = [];
  if (mode === "site") use = Object.keys(GROUPS);
  else if (mode === "hybrid") {
    use = [...new Set([].concat((input && input.use) || []).map(String))].filter((g) => GROUPS[g]);
    if (!use.length) throw new Error("Mode hybride : choisissez au moins un groupe (couleurs, accent ou polices) à reprendre du site.");
  }
  return { mode, use, own: current.own };
}
const parse = (text) => { try { const v = JSON.parse(text); return v && typeof v === "object" && v.own ? v : null; } catch { return null; } };

// Table de remplacement { "#rrggbb" | "font.x" → "token:…" | "body" | "heading" } pour une configuration
function replacements(cfg) {
  const map = new Map();
  if (!cfg || !cfg.own || cfg.mode === "own") return map;
  const groups = new Set(cfg.mode === "site" ? Object.keys(GROUPS) : cfg.use || []);
  const groupOf = (role) => Object.keys(GROUPS).find((g) => GROUPS[g].includes(role));
  for (const role of ORDER) { // couleurs : si deux rôles ont la même valeur, le premier gagne
    if (!groups.has(groupOf(role))) continue;
    const key = String(cfg.own[role]).toLowerCase();
    if (!map.has(key)) map.set(key, TOKEN[role]);
  }
  if (groups.has("fonts")) for (const role of ["font", "head"]) if (!map.has(cfg.own[role])) map.set(cfg.own[role], FONT[role]);
  return map;
}
// Copie des sections avec les valeurs remplacées (chaînes entières uniquement, comparaison sans casse pour les couleurs) ; le document d'origine n'est jamais modifié
function apply(sections, cfg) {
  const map = replacements(cfg);
  if (!map.size) return sections;
  const swap = (v) => { if (typeof v !== "string") return v; const hit = map.get(v.toLowerCase()); return hit !== undefined ? hit : v; };
  const walk = (x) => {
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === "object") { const o = {}; for (const [k, v] of Object.entries(x)) o[k] = walk(v); return o; }
    return swap(x);
  };
  return walk(sections);
}
module.exports = { MODES, GROUPS, snapshot, normalize, parse, replacements, apply };
