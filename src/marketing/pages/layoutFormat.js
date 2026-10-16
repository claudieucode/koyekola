// Formats de mise en page (Layout Standards Engine) : conception libre OU guidée par un format, éventuellement verrouillé.
// Aucun deuxième moteur : le format est une petite valeur du thème de la page (theme.layout), donc enregistrée, publiée, versionnée et
// dupliquée avec le reste. Il pilote UNE règle CSS (largeur du contenu des éléments de premier niveau de chaque section) ; tout le reste
// (conteneurs, Flexbox, widgets, écrans) est le moteur existant.
//  - largeur fluide + largeur MAXIMALE : le format n'est pas une taille d'écran ; l'aperçu ordinateur/tablette/mobile ne change pas.
//  - la règle est écrite avec une spécificité basse : quand le format est déverrouillé, un réglage de l'auteur l'emporte.
//  - verrouillé : les propriétés PROTÉGÉES des éléments de premier niveau (PROTECTED) ne peuvent plus changer, par aucune voie
//    (enregistrement du brouillon, éditeur, IA) — contrôle dans le moteur d'enregistrement, pas seulement dans l'interface.
const { MarketingError } = require("../errors");

const PROTECTED = ["width", "minWidth", "maxWidth", "marginLeft", "marginRight"];
const PROTECTED_LABELS = { width: "Largeur", minWidth: "Largeur minimale", maxWidth: "Largeur maximale", marginLeft: "Marge gauche", marginRight: "Marge droite" };
// Préréglages de départ : valeurs initiales modifiables (« Personnalisé »), jamais des normes obligatoires
const FORMATS = {
  compact: { label: "Contenu compact", maxWidth: 960, gutter: 24, hint: "Lecture confortable : articles, pages de texte." },
  standard: { label: "Contenu standard", maxWidth: 1200, gutter: 24, hint: "Choix polyvalent pour la plupart des sites." },
  large: { label: "Contenu large", maxWidth: 1440, gutter: 32, hint: "Pages visuelles, grilles de cartes, vitrines." },
  fluid: { label: "Mise en page fluide", maxWidth: 0, gutter: 16, hint: "Pas de largeur maximale : le contenu suit l'écran." },
  custom: { label: "Personnalisé", maxWidth: 1200, gutter: 24, hint: "Vos propres valeurs." },
};
const bad = (m) => new MarketingError("invalid_field", m);
const int = (v, min, max, name) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`Format : ${name} entre ${min} et ${max}.`);
  return n;
};

// Valeur enregistrée (ou null = conception libre)
function normalizeLayout(input) {
  if (!input || typeof input !== "object" || input.mode !== "guided") return null;
  const key = Object.hasOwn(FORMATS, input.format) ? input.format : null;
  if (!key) throw bad("Format de mise en page inconnu.");
  const preset = FORMATS[key];
  const custom = key === "custom";
  return {
    mode: "guided", format: key,
    maxWidth: custom ? (Number(input.maxWidth) === 0 ? 0 : int(input.maxWidth, 320, 2400, "largeur maximale")) : preset.maxWidth,
    gutter: custom ? int(input.gutter, 0, 96, "marge latérale") : preset.gutter,
    locked: input.locked === true,
  };
}
const guided = (layout) => Boolean(layout && layout.mode === "guided");

// CSS du format : éléments de premier niveau des sections libres. `:where()` : spécificité nulle, le réglage d'un auteur (déverrouillé) l'emporte.
function css(layout) {
  if (!guided(layout)) return "";
  const g = layout.gutter, w = layout.maxWidth;
  const width = w > 0 ? `min(calc(100% - ${2 * g}px), ${w}px)` : `calc(100% - ${2 * g}px)`;
  // `.lp-main` (colonne de 760 px par défaut ou réglage du site) cède la place au format ; les sections de l'ancien format suivent la même largeur
  // Sections « typées » (bandeau, texte, liste, FAQ… des gabarits) : rendues dans un `div.lp-block`, jamais en enfant direct de `.lp-main` en tant que
  // `.lp-section` ; sans cette règle elles s'étalent sur tout l'écran (0 px de marge) dès que `.lp-main` perd son padding. Restent hors format :
  // les sections libres (déjà couvertes par `.kw-node`), l'en-tête / pied du site et les blocs dont l'auteur a choisi une largeur (`lp-w-*`).
  const typed = ":where(.lp-main > .lp-block:not(.lp-block-layout, .lp-site-part, [class*=\"lp-w-\"]))";
  return [
    "body.lp-body .lp-main { max-width: none; padding-left: 0; padding-right: 0; }",
    `:where(.kw-layout) > .kw-node, :where(.lp-main) > .lp-section { width: ${width}; margin-left: auto; margin-right: auto; box-sizing: border-box; }`,
    `${typed} { width: ${width}; margin-left: auto; margin-right: auto; box-sizing: border-box; }`,
    // Blocs pleine largeur : le fond reste pleine largeur, le contenu s'aligne sur la colonne du format (et non sur l'ancienne colonne de 760 px)
    `:where(.lp-main) { --kw-fmt-pad: ${w > 0 ? `max(${g}px, calc(50vw - ${w / 2}px))` : `${g}px`}; }`,
  ].join("\n");
}

// ---------- Éléments de premier niveau et propriétés protégées ----------
function topLevel(sections) {
  const out = [];
  for (const s of sections || []) if (s && s.type === "layout") for (const n of s.children || []) if (n && n.id) out.push(n);
  return out;
}
function protectedOf(n) {
  const out = {};
  const take = (set, where) => { for (const p of PROTECTED) if (set && set[p] !== undefined && set[p] !== "") out[`${where}.${p}`] = String(set[p]); };
  for (const [bp, set] of Object.entries(n.styles || {})) take(set, bp);
  for (const [st, set] of Object.entries(n.states || {})) take(set, st);
  return out;
}
// Éléments de premier niveau qui portent déjà une de ces propriétés : conflits à lever pour appliquer un format verrouillé
function conflicts(sections) {
  return topLevel(sections).map((n) => ({ id: n.id, type: n.type, props: Object.keys(protectedOf(n)) })).filter((x) => x.props.length);
}
const tip = "Déverrouillez le format (Page → Format) pour le modifier.";
// Contrôle du verrouillage entre deux états du document. `before` fait foi : on ne peut pas se déverrouiller et modifier en même temps.
function checkLocked(before, after) {
  const b = before && before.theme && before.theme.layout;
  if (!b || !b.locked) return;
  const a = after && after.theme && after.theme.layout;
  const same = a && a.mode === b.mode && a.format === b.format && a.maxWidth === b.maxWidth && a.gutter === b.gutter;
  if (!same) throw new MarketingError("format_locked", `Format verrouillé : le format ne peut pas être changé ni retiré. ${tip}`);
  const was = new Map(topLevel(before.sections).map((n) => [String(n.id), protectedOf(n)]));
  for (const n of topLevel(after.sections)) {
    const now = protectedOf(n), prev = was.get(String(n.id)) || {};
    const keys = new Set([...Object.keys(now), ...Object.keys(prev)]);
    for (const k of keys) {
      if (now[k] !== prev[k]) {
        const [where, prop] = k.split(".");
        throw new MarketingError("format_locked", `Format verrouillé : « ${PROTECTED_LABELS[prop] || prop} » (${where}) d'un élément de premier niveau est protégée par le format « ${FORMATS[b.format].label} ». ${tip}`);
      }
    }
  }
}
// Applique un format à un contenu EXISTANT : action explicite. Retire les réglages en conflit seulement si on le demande (aperçu des conflits avant).
function apply(content, layout, { clearConflicts = false } = {}) {
  const next = JSON.parse(JSON.stringify({ sections: content.sections || [] }));
  const found = conflicts(next.sections);
  if (found.length && layout.locked && !clearConflicts) throw new MarketingError("format_conflicts", `${found.length} élément(s) de premier niveau ont déjà une largeur ou des marges : confirmez leur remise à zéro pour verrouiller ce format.`);
  if (clearConflicts) {
    for (const n of topLevel(next.sections)) {
      for (const set of [...Object.values(n.styles || {}), ...Object.values(n.states || {})]) for (const p of PROTECTED) delete set[p];
    }
  }
  return { sections: next.sections, conflicts: found };
}

module.exports = { FORMATS, PROTECTED, PROTECTED_LABELS, normalizeLayout, guided, css, topLevel, protectedOf, conflicts, checkLocked, apply };
