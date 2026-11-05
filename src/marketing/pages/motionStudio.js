// Motion Studio : schéma versionné de `node.motion.studio` (lot 0). Contrat complet : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
//
//   motion.studio = { v: 1, preset?, trigger?, duration?, delay?, easing?, stagger?, iterations?, direction?, repeat?, scrub?, off?, rm?, alwaysMotion?, params? }
//
// - Additif : une page sans `studio` est inchangée ; une clé inconnue est ignorée (jamais enregistrée) ; une valeur invalide est retirée sans erreur,
//   comme le reste de `normalizeMotion`. Les valeurs par défaut ne sont pas écrites (le document reste petit).
// - Versionné : `v` absent = 1. `MIGRATIONS[n]` transforme un objet de version n en version n + 1 (aucune pour l'instant, la v1 est la première).
//   Une version plus récente que celle que ce code connaît est ignorée (jamais interprétée de travers).
// - Fermé : listes de valeurs, bornes, aucun CSS ni script libre. `preset` et `params` sont validés par la fiche `motion` du widget (listes fermées).
// - Pur : aucune dépendance vers nodes.js (évite les dépendances circulaires) ; nodes.js l'appelle depuis normalizeMotion.
const MOTION = require("./motion");

const CURRENT = 1;
const TRIGGERS = { viewport: "Quand l'élément est visible", load: "Au chargement de la page", click: "Au clic", hover: "Au survol", scroll: "Selon le défilement" };
const SCREENS = ["desktop", "tablet", "mobile"];
const REDUCED = { none: "Aucune animation (le contenu apparaît directement)", fade: "Fondu très court" };
// Réglages communs que le panneau peut afficher (la fiche du widget choisit ceux qui sont pertinents)
const CONTROLS = ["preset", "trigger", "duration", "delay", "easing", "stagger", "iterations", "direction", "repeat", "scrub"];
const LIMITS = { duration: [50, 10000], delay: [0, 10000], stagger: [0, 1000], iterations: [1, 10], scrub: [0, 100] };
// Valeurs par défaut communes (la fiche du widget les surcharge dans `defaults`)
const BASE_DEFAULTS = { trigger: "viewport", duration: 700, delay: 0, easing: "smooth", stagger: 0, iterations: 1, direction: "normal", repeat: false, rm: "none" };

const MODULE = /^[a-z][a-z0-9-]{1,30}$/;
const KEY = /^[a-z][a-zA-Z0-9]{0,30}$/;
const PRESET = /^[a-z][a-z0-9-]{0,40}$/;
const MIGRATIONS = {}; // { 1: (v1) => v2, … }

const int = (min, max) => (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

// Fiche `motion` d'un widget : vérifiée au démarrage (jamais en pleine page). Lève une erreur claire.
function checkSpec(m, where) {
  const bad = (msg) => { throw new Error(`Widget personnalisé (${where}) : « motion » ${msg}`); };
  if (!m || typeof m !== "object" || Array.isArray(m)) bad("doit être un objet { module, presets?, defaults?, controls?, params? }.");
  if (!MODULE.test(String(m.module || ""))) bad("« module » : nom du module d'exécution (minuscules, chiffres, tirets), fichier public/js/motion-studio/<module>.js.");
  const file = require("path").join(__dirname, "../../../public/js/motion-studio", `${m.module}.js`);
  if (!require("fs").existsSync(file)) bad(`« module » : fichier public/js/motion-studio/${m.module}.js introuvable.`);
  if (m.presets !== undefined) {
    if (!Array.isArray(m.presets) || !m.presets.length || m.presets.length > 40 || !m.presets.every((p) => Array.isArray(p) && p.length === 2 && PRESET.test(p[0]) && typeof p[1] === "string" && p[1].trim())) bad("« presets » : liste [[identifiant, libellé], …] (1 à 40).");
    if (new Set(m.presets.map((p) => p[0])).size !== m.presets.length) bad("« presets » : identifiants en double.");
  }
  if (m.controls !== undefined && (!Array.isArray(m.controls) || !m.controls.every((c) => CONTROLS.includes(c)))) bad(`« controls » : parmi ${CONTROLS.join(", ")}.`);
  if (m.controls && m.controls.includes("preset") && !m.presets) bad("« controls » contient « preset » mais « presets » est absent.");
  if (m.params !== undefined) {
    if (!Array.isArray(m.params) || m.params.length > 12) bad("« params » : liste de 12 réglages au plus.");
    const seen = new Set();
    for (const p of m.params) {
      if (!p || !KEY.test(String(p.key || "")) || seen.has(p.key)) bad(`« params » : clé invalide ou en double (${p && p.key}).`);
      seen.add(p.key);
      if (!["number", "select", "bool"].includes(p.kind)) bad(`« params.${p.key} » : type number, select ou bool.`);
      if (typeof p.label !== "string" || !p.label.trim()) bad(`« params.${p.key} » : libellé obligatoire.`);
      if (p.kind === "number" && !(Number.isFinite(p.min) && Number.isFinite(p.max) && p.min < p.max && Number.isFinite(p.default))) bad(`« params.${p.key} » : min, max et default (nombres) obligatoires.`);
      if (p.kind === "select" && (!Array.isArray(p.options) || !p.options.length || !p.options.every((o) => Array.isArray(o) && o.length === 2) || !p.options.some((o) => o[0] === p.default))) bad(`« params.${p.key} » : options [[valeur, libellé], …] et default parmi elles.`);
      if (p.kind === "bool" && typeof p.default !== "boolean") bad(`« params.${p.key} » : default vrai ou faux.`);
    }
  }
  if (m.defaults !== undefined) {
    if (!m.defaults || typeof m.defaults !== "object" || Array.isArray(m.defaults)) bad("« defaults » : objet.");
    const probe = normalize({ v: CURRENT, ...m.defaults }, { ...m, defaults: undefined });
    for (const k of Object.keys(m.defaults)) {
      if (k === "params") continue;
      if (k === "preset") { if (!m.presets || !m.presets.some((p) => p[0] === m.defaults.preset)) bad("« defaults.preset » : doit figurer dans « presets »."); continue; }
      const same = k in BASE_DEFAULTS && m.defaults[k] === BASE_DEFAULTS[k];
      if (!same && (!probe || JSON.stringify(probe[k]) !== JSON.stringify(m.defaults[k]))) bad(`« defaults.${k} » : valeur invalide.`);
    }
  }
  return m;
}

// Réglages effectifs : valeurs par défaut (communes + fiche du widget) puis réglages enregistrés
function effective(studio, spec) {
  const d = { ...BASE_DEFAULTS, ...(spec && spec.defaults ? spec.defaults : {}) };
  const params = {};
  for (const p of (spec && spec.params) || []) params[p.key] = p.default;
  if (spec && spec.defaults && spec.defaults.params) Object.assign(params, spec.defaults.params);
  const s = studio || {};
  const out = { v: CURRENT, ...d, ...Object.fromEntries(Object.entries(s).filter(([k]) => k !== "params" && k !== "v")), params: { ...params, ...(s.params || {}) } };
  if (spec && spec.presets && !out.preset) out.preset = spec.presets[0][0];
  if (!Object.keys(out.params).length) delete out.params;
  return out;
}

// Validation + migration. spec = fiche `motion` du widget (ou null pour un élément ordinaire) ; renvoie l'objet normalisé ou undefined
function normalize(raw, spec) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  let v = raw.v === undefined ? 1 : Number(raw.v);
  if (!Number.isInteger(v) || v < 1 || v > CURRENT) return undefined; // inconnue ou plus récente que ce code
  let cur = raw;
  while (v < CURRENT) { cur = MIGRATIONS[v](cur); v++; }
  const base = { ...BASE_DEFAULTS, ...(spec && spec.defaults ? spec.defaults : {}) };
  const out = { v: CURRENT };
  const keep = (k, val) => { if (val !== null && val !== undefined && val !== base[k]) out[k] = val; };
  if (spec && spec.presets && typeof cur.preset === "string" && spec.presets.some((p) => p[0] === cur.preset) && cur.preset !== (base.preset || spec.presets[0][0])) out.preset = cur.preset;
  if (Object.hasOwn(TRIGGERS, cur.trigger)) keep("trigger", cur.trigger);
  keep("duration", int(...LIMITS.duration)(cur.duration));
  keep("delay", int(...LIMITS.delay)(cur.delay));
  const ease = cur.easing === undefined || cur.easing === "" ? null : MOTION.normalizeEasing(cur.easing);
  if (ease) keep("easing", ease);
  keep("stagger", int(...LIMITS.stagger)(cur.stagger));
  const it = cur.iterations === "infinite" ? "infinite" : int(...LIMITS.iterations)(cur.iterations);
  if (it !== null && it !== 1) out.iterations = it;
  if (MOTION.DIRECTIONS.includes(cur.direction) && cur.direction !== "normal") out.direction = cur.direction;
  if (cur.repeat === true) out.repeat = true;
  if (cur.scrub && typeof cur.scrub === "object") {
    const start = int(0, 99)(cur.scrub.start), end = int(1, 100)(cur.scrub.end);
    if (start !== null && end !== null && start < end && (start !== 0 || end !== 100)) out.scrub = { start, end };
  }
  if (Array.isArray(cur.off)) {
    const off = SCREENS.filter((k) => cur.off.includes(k));
    if (off.length && off.length < SCREENS.length) out.off = off; // on ne coupe jamais les trois écrans (inutile : retirez le réglage)
  }
  if (cur.rm === "fade") out.rm = "fade";
  if (cur.alwaysMotion === true) out.alwaysMotion = true;
  if (spec && spec.params && cur.params && typeof cur.params === "object") {
    const params = {};
    for (const p of spec.params) {
      const val = cur.params[p.key];
      if (val === undefined) continue;
      let ok = null;
      if (p.kind === "number") { const n = Number(val); if (val !== "" && val !== null && Number.isFinite(n) && n >= p.min && n <= p.max) ok = Math.round(n * 1000) / 1000; }
      else if (p.kind === "select") ok = p.options.some((o) => o[0] === val) ? val : null;
      else if (typeof val === "boolean") ok = val;
      if (ok !== null && ok !== p.default) params[p.key] = ok;
    }
    if (Object.keys(params).length) out.params = params;
  }
  // « selon le défilement » ne se répète pas et ne boucle pas : la progression est celle du défilement
  if ((out.trigger || base.trigger) === "scroll") { delete out.iterations; delete out.repeat; }
  return Object.keys(out).length > 1 || cur === raw && raw.v !== undefined ? out : undefined;
}

// Attributs HTML d'un élément qui porte du Motion Studio : un widget `motion` (même sans réglage enregistré : valeurs par défaut) ou un élément avec `studio`.
// data-kw-ms-module : module d'exécution (widgets) · data-kw-ms : réglages EFFECTIFS en JSON (le runtime n'a pas à connaître les défauts du serveur)
function attrs(n, spec) {
  const studio = n && n.motion && n.motion.studio;
  if (!studio && !spec) return "";
  const esc = (s) => String(s).replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]);
  const eff = effective(studio, spec);
  let a = "";
  if (spec) a += ` data-kw-ms-module="${spec.module}"`;
  a += ` data-kw-ms="${esc(JSON.stringify(eff))}"`;
  if (eff.alwaysMotion) a += " data-kw-motion-always";
  return a;
}

// Ce que la page doit charger : null si aucun élément Motion Studio ; sinon { css, modules: [noms] }
function usage(sections, walk, specOf) {
  const modules = new Set();
  let any = false;
  for (const s of sections || []) {
    if (!s || s.type !== "layout") continue;
    walk(s.children, (n) => {
      const spec = specOf(n.type);
      if (spec) { modules.add(spec.module); any = true; }
      else if (n.motion && n.motion.studio) any = true;
    });
  }
  return any ? { css: modules.size > 0, modules: [...modules].sort() } : null;
}

// Ce que reçoit l'éditeur (une fois, dans editorSpec)
function editorSpec() {
  return {
    v: CURRENT, triggers: Object.entries(TRIGGERS), easings: Object.keys(MOTION.EASINGS), directions: MOTION.DIRECTIONS, reduced: Object.entries(REDUCED), screens: SCREENS,
    limits: LIMITS, defaults: BASE_DEFAULTS, controls: CONTROLS,
  };
}
// Ce que l'éditeur reçoit pour un widget (fiche `motion` + réglages par défaut effectifs)
const widgetSpec = (spec) => spec ? { module: spec.module, presets: spec.presets || null, controls: spec.controls || CONTROLS.filter((c) => c !== "preset" || spec.presets), params: spec.params || [], defaults: effective(null, spec) } : null;

module.exports = { CURRENT, TRIGGERS, SCREENS, REDUCED, CONTROLS, LIMITS, BASE_DEFAULTS, MIGRATIONS, checkSpec, normalize, effective, attrs, usage, editorSpec, widgetSpec };
