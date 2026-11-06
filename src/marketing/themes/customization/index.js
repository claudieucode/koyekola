// Manifeste de personnalisation d'un thème (paquet) : la liste des réglages que CE thème propose, calculée à partir de ses propres déclarations et de la MESURE de leur effet.
//
//   • réglages déclarés par le thème (pack.options : couleurs signature, motifs, animations) → panneau « Spécifique au thème » ;
//   • réglages génériques par composant (controls.js : en-tête, navigation, typographie, boutons, cartes, pied…) → seulement ceux que la mesure a vus agir sur le thème
//     (effective.json, produit par scripts/mesurer-personnalisation-themes.js : il charge chaque thème dans Chrome, applique une valeur d'essai et compare le rendu) ;
//   • réglages du moteur (jetons de couleurs, polices, arrondis…) → mêmes mesures, clé « static ».
// Un réglage sans effet sur un thème n'apparaît donc JAMAIS pour ce thème. Valeurs par défaut = valeurs mesurées sur le design d'origine (aucune règle n'est ajoutée tant que rien n'est changé).
// Les réglages choisis sont enregistrés avec le site, dans tokens.pack.options (clés « z-… » pour les génériques) : même brouillon, mêmes versions, même publication que le reste.
const fs = require("node:fs");
const path = require("node:path");
const controls = require("./controls");

const FILE = process.env.KOLAKISA_THEME_EFFECTS_FILE || path.join(__dirname, "effective.json");
let cache = null;
const effects = () => {
  if (cache) return cache;
  try { cache = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch { cache = { version: 0, themes: {} }; }
  if (!cache.themes) cache.themes = {};
  return cache;
};
const reloadEffects = () => { cache = null; return effects(); };
const packs = () => require("../packs");

// Réglages génériques mesurés pour un thème : [{ ...contrôle, default }]
function genericFor(key) {
  const m = (effects().themes[key] || {}).controls || {};
  return controls.list.filter((c) => m[c.id]).map((c) => ({ ...c, default: m[c.id].default ?? (c.kind === "toggle" ? "off" : "") }));
}
const staticFor = (key) => new Set(((effects().themes[key] || {}).static) || []);
const measured = (key) => Boolean(effects().themes[key]);

// Valeur d'origine mesurée, ramenée dans les bornes du réglage (un arrondi « pilule » de 999 px s'affiche 60 px : sans règle ajoutée, le thème garde son rendu d'origine)
const dflt = (c) => { const d = String(c.default); if (c.kind !== "number") return d; const n = Number(d); return Number.isFinite(n) ? String(Math.min(c.max, Math.max(c.min, n))) : String(c.min); };
const strip = (c) => { const { css, map, sel, prop, probeVar, state, ...rest } = c; return rest; };

// Manifeste : { key, version, panels: [{ id, label, hint, controls: [ { id, optKey, source, kind, label, default, …contraintes } ] }], defaults }
function manifestOf(key) {
  const p = packs().get(String(key));
  if (!p) return null;
  const spec = p.spec;
  const panels = [];
  const theme = (spec.options || []).map((o) => ({
    id: `o-${o.key}`, optKey: o.key, source: "theme", kind: o.type === "color" ? "color" : o.type === "range" ? "number" : "select", label: o.label, default: String(o.default),
    ...(o.type === "choice" ? { options: o.choices } : {}), ...(o.type === "range" ? { min: o.min, max: o.max, step: o.step || 1, unit: o.unit || "" } : {}),
  }));
  if (theme.length) panels.push({ ...controls.PANELS[0], controls: theme });
  const gen = genericFor(spec.key);
  for (const panel of controls.PANELS.slice(1)) {
    const mine = gen.filter((c) => c.panel === panel.id).map((c) => ({ ...strip(c), optKey: controls.optKey(c.id), source: "generic", default: dflt(c) }));
    if (mine.length) panels.push({ ...panel, controls: mine });
  }
  const defaults = {};
  for (const pn of panels) for (const c of pn.controls) defaults[c.optKey] = c.default;
  return { key: spec.key, name: spec.name, version: String(spec.version || "1.0.0"), schema: 1, measured: measured(spec.key), staticControls: [...staticFor(spec.key)], panels, defaults };
}

// Contrôle d'un thème par clé d'option enregistrée ; null si ce thème ne le propose pas
function controlOf(key, optKey) {
  const m = manifestOf(key);
  if (!m) return null;
  for (const pn of m.panels) for (const c of pn.controls) if (c.optKey === optKey) return c;
  return null;
}

// Valeur validée d'un réglage du manifeste (texte), ou null si refusée
function cleanValue(c, raw) {
  const v = String(raw ?? "").trim();
  if (c.kind === "color") return controls.HEX.test(v) ? v.toLowerCase() : null;
  if (c.kind === "number") { const n = Number(v); return Number.isFinite(n) && n >= c.min && n <= c.max ? String(Math.round(n * 1000) / 1000) : null; }
  if (c.kind === "select") return (c.options || []).some(([o]) => String(o) === v) ? v : null;
  if (c.kind === "toggle") return v === "on" || v === "off" ? v : null;
  return null;
}

// CSS des réglages génériques choisis (tokens.pack.options) : vide si aucun
function cssFor(key, options) {
  if (!options || typeof options !== "object") return "";
  const mine = new Set(genericFor(key).map((c) => c.id));
  const out = [];
  for (const [k, v] of Object.entries(options)) {
    const c = controls.fromOptKey(k);
    if (!c || !mine.has(c.id)) continue;
    const r = controls.rule(key, c, v);
    if (r) out.push(r);
  }
  return out.join("\n").replace(/</g, "");
}

// Contrôle de cohérence d'un manifeste (utilisé par les tests et le script de mesure)
function validate(m) {
  const bad = [];
  if (!m) return ["manifeste absent"];
  const seen = new Set();
  if (!m.panels.length) bad.push("aucun réglage");
  for (const pn of m.panels) {
    if (!pn.controls.length) bad.push(`panneau vide : ${pn.id}`);
    for (const c of pn.controls) {
      if (seen.has(c.optKey)) bad.push(`réglage en double : ${c.optKey}`); seen.add(c.optKey);
      if (!/^[a-z][a-z0-9-]{0,24}$/.test(c.optKey)) bad.push(`clé invalide : ${c.optKey}`);
      if (!c.label) bad.push(`libellé manquant : ${c.optKey}`);
      if (cleanValue(c, c.default) === null && c.default !== "") bad.push(`valeur par défaut refusée : ${c.optKey} = ${c.default}`);
      if (c.kind === "number" && !(c.min < c.max)) bad.push(`bornes invalides : ${c.optKey}`);
      if (c.kind === "select" && !(c.options || []).length) bad.push(`choix absents : ${c.optKey}`);
    }
  }
  return bad;
}

// Inventaire : un résumé par thème (pour la documentation et les tests)
function inventory() {
  return packs().all().map((spec) => {
    const m = manifestOf(spec.key);
    return { key: spec.key, name: spec.name, panels: m.panels.map((pn) => ({ id: pn.id, label: pn.label, controls: pn.controls.map((c) => ({ optKey: c.optKey, label: c.label, kind: c.kind, source: c.source, default: c.default })) })), count: m.panels.reduce((n, pn) => n + pn.controls.length, 0), staticControls: m.staticControls.length, measured: m.measured };
  });
}

module.exports = { manifestOf, controlOf, cleanValue, cssFor, validate, inventory, genericFor, staticFor, measured, reloadEffects, effects, controls, FILE };
