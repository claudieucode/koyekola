// Motion Studio, lot 3 : SCÈNES de la page (timeline multi-éléments), transitions de page / de sections et défilement fluide.
//
//   theme.motionScenes = { v: 1, scenes?: [scène], pageTransition?: { type, duration? }, sectionTransition?: { type, duration? }, smoothScroll?: { on: true, strength?, anchors? } }
//
// STOCKAGE : dans le thème de la page (colonne JSON `theme`, comme `layout` et `scrollSnap`). Aucune migration SQL : le brouillon (`draft`), la version en ligne
// (`theme`), l'historique des versions (`mk_page_versions`), les restaurations, l'annulation de l'éditeur et la copie de page le transportent déjà. Choix le plus sûr :
// aucune colonne ajoutée, aucune base à migrer, les pages existantes restent identiques octet pour octet.
//
// - Additif : une page sans `motionScenes` est inchangée. Tout est validé ici (listes fermées, bornes) ; aucune valeur libre, aucun CSS ni script saisi.
// - Références : un pas vise un élément de la page par son identifiant. Un élément absent (supprimé) fait RETIRER le pas, avec un avertissement renvoyé à l'éditeur
//   (même mécanisme que les interactions : `ctx.__warnings`). Un lien `sync` / `after` vers un pas inconnu ou en boucle est retiré sans bruit.
// - Versionné : `v` absent = 1 ; `MIGRATIONS[n]` fait passer de la version n à n + 1 ; une version plus récente que ce code est ignorée.
// - Les valeurs égales au défaut ne sont pas écrites ; la normalisation est idempotente.
const crypto = require("node:crypto");
const MOTION = require("./motion");
const CORE = require("../../../public/js/motion-studio/scenes-core.js");

const CURRENT = 1;
const MIGRATIONS = {}; // { 1: (v1) => v2, … }
const ID = /^[a-z0-9]{6,20}$/;
const SCREENS = ["desktop", "tablet", "mobile"];
const PAGE_TRANSITIONS = { fade: "Fondu", slide: "Glissement latéral", zoom: "Zoom léger", off: "Aucune pour cette page (même si le site en a une)" };
const SECTION_TRANSITIONS = Object.fromEntries(CORE.SECTION_EFFECTS.map((id) => [id, CORE.EFFECTS[id].label]));
const LIMITS = { ...CORE.LIMITS, pageDuration: [100, 1500], sectionDuration: [200, 1500], strength: [1, 10], maxJson: 60000 };
const DEFAULTS = { trigger: "viewport", pageDuration: 300, sectionDuration: 700, strength: 5 };

const newId = () => crypto.randomBytes(5).toString("hex");
const int = (min, max) => (v) => { if (v === "" || v === null || v === undefined) return null; const n = Number(v); return Number.isInteger(n) && n >= min && n <= max ? n : null; };
const text = (v, max) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

function normalizeStep(raw, { nodeIds, scene, warn }) {
  if (!raw || typeof raw !== "object") return null;
  const target = String(raw.target || "");
  if (!ID.test(target)) return null;
  if (!nodeIds.has(target)) {
    warn({ kind: "scene_target", sceneId: scene.id, sceneName: scene.name || "", target, message: `La scène « ${scene.name || "sans nom"} » visait un élément qui n'existe plus : le pas correspondant a été retiré.` });
    return null;
  }
  const out = { id: ID.test(String(raw.id || "")) ? String(raw.id) : newId(), target };
  if (Object.hasOwn(CORE.EFFECTS, raw.effect) && raw.effect !== CORE.DEFAULT_STEP.effect) out.effect = raw.effect;
  const put = (k, v) => { if (v !== null && v !== CORE.DEFAULT_STEP[k] && !(k === "delay" && v === 0)) out[k] = v; };
  put("at", int(...LIMITS.at)(raw.at));
  put("duration", int(...LIMITS.duration)(raw.duration));
  put("delay", int(...LIMITS.delay)(raw.delay));
  const ease = raw.easing === undefined || raw.easing === "" ? null : MOTION.normalizeEasing(raw.easing);
  if (ease && ease !== CORE.DEFAULT_STEP.easing) out.easing = ease;
  if (ID.test(String(raw.sync || ""))) out.sync = String(raw.sync);
  else if (ID.test(String(raw.after || ""))) out.after = String(raw.after);
  return out;
}

function normalizeScene(raw, ctx) {
  if (!raw || typeof raw !== "object") return null;
  const scene = { id: ID.test(String(raw.id || "")) ? String(raw.id) : newId() };
  const name = text(raw.name, LIMITS.name);
  if (name) scene.name = name;
  const { nodeIds, warn } = ctx;
  if (Object.hasOwn(CORE.TRIGGERS, raw.trigger) && raw.trigger !== DEFAULTS.trigger) scene.trigger = raw.trigger;
  const steps = [], seen = new Set();
  for (const s of (Array.isArray(raw.steps) ? raw.steps : []).slice(0, LIMITS.steps)) {
    const step = normalizeStep(s, { nodeIds, scene: { id: scene.id, name }, warn });
    if (!step || seen.has(step.id)) continue;
    seen.add(step.id); steps.push(step);
  }
  // Liens : vers un autre pas qui existe encore, sans boucle
  for (const s of steps) {
    for (const k of ["sync", "after"]) if (s[k] && (s[k] === s.id || !seen.has(s[k]))) delete s[k];
    if (s.sync && s.after) delete s.after;
  }
  for (const id of CORE.cycles(steps)) { const s = steps.find((x) => x.id === id); if (s) { delete s.sync; delete s.after; } }
  // Élément déclencheur (visible / clic / défilement) : s'il n'existe plus, on revient au premier pas
  if (raw.anchor !== undefined && raw.anchor !== null && raw.anchor !== "") {
    const a = String(raw.anchor);
    if (ID.test(a) && nodeIds.has(a)) { if (!steps.length || a !== steps[0].target) scene.anchor = a; }
    else warn({ kind: "scene_target", sceneId: scene.id, sceneName: name, target: a, anchor: true, message: `La scène « ${name || "sans nom"} » se déclenchait sur un élément qui n'existe plus : elle utilise désormais son premier pas.` });
  }
  const trigger = scene.trigger || DEFAULTS.trigger;
  if (raw.repeat === true && (trigger === "viewport")) scene.repeat = true;
  if (trigger === "scroll" && raw.scrub && typeof raw.scrub === "object") {
    const start = int(0, 99)(raw.scrub.start), end = int(1, 100)(raw.scrub.end);
    if (start !== null && end !== null && start < end && (start !== 0 || end !== 100)) scene.scrub = { start, end };
  }
  if (Array.isArray(raw.off)) { const off = SCREENS.filter((k) => raw.off.includes(k)); if (off.length && off.length < SCREENS.length) scene.off = off; }
  scene.steps = steps;
  return scene;
}

// Validation + migration. ctx : { nodeIds: Set d'identifiants d'éléments de la page, warn(w) }. Renvoie l'objet normalisé ou undefined (rien à enregistrer)
function normalize(raw, ctx = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  let v = raw.v === undefined ? 1 : Number(raw.v);
  if (!Number.isInteger(v) || v < 1 || v > CURRENT) return undefined; // inconnue ou plus récente que ce code
  let cur = raw;
  while (v < CURRENT) { cur = MIGRATIONS[v](cur); v++; }
  const c = { nodeIds: ctx.nodeIds || new Set(), warn: ctx.warn || (() => {}) };
  const out = { v: CURRENT };
  const scenes = [], seen = new Set();
  for (const s of (Array.isArray(cur.scenes) ? cur.scenes : []).slice(0, LIMITS.scenes)) {
    const sc = normalizeScene(s, c);
    if (!sc || seen.has(sc.id)) continue;
    seen.add(sc.id); scenes.push(sc);
  }
  if (scenes.length) out.scenes = scenes;
  const pt = cur.pageTransition;
  if (pt && typeof pt === "object" && Object.hasOwn(PAGE_TRANSITIONS, pt.type)) {
    out.pageTransition = { type: pt.type };
    const d = int(...LIMITS.pageDuration)(pt.duration);
    if (pt.type !== "off" && d !== null && d !== DEFAULTS.pageDuration) out.pageTransition.duration = d;
  }
  const st = cur.sectionTransition;
  if (st && typeof st === "object" && Object.hasOwn(SECTION_TRANSITIONS, st.type)) {
    out.sectionTransition = { type: st.type };
    const d = int(...LIMITS.sectionDuration)(st.duration);
    if (d !== null && d !== DEFAULTS.sectionDuration) out.sectionTransition.duration = d;
  }
  const ss = cur.smoothScroll;
  if (ss && typeof ss === "object" && ss.on === true) {
    out.smoothScroll = { on: true };
    const n = int(...LIMITS.strength)(ss.strength);
    if (n !== null && n !== DEFAULTS.strength) out.smoothScroll.strength = n;
    if (ss.anchors === false) out.smoothScroll.anchors = false;
  }
  if (Object.keys(out).length === 1) return undefined;
  if (JSON.stringify(out).length > LIMITS.maxJson) return undefined;
  return out;
}

// Élément de la page par identifiant (sections libres uniquement : les éléments d'un composant partagé n'appartiennent pas à la page)
function nodeIdsOf(sections, walk) {
  const ids = new Set();
  for (const s of sections || []) if (s && s.type === "layout") walk(s.children, (n) => { if (n && n.id) ids.add(n.id); });
  return ids;
}

// Branche le modèle dans le thème normalisé d'une page (appelé par normalizeContent) : l'avertissement est ajouté à ctx.__warnings (50 au plus)
function applyToTheme(theme, input, ctx, sections, walk) {
  const warn = (w) => { if (ctx && Array.isArray(ctx.__warnings) && ctx.__warnings.length < 50) ctx.__warnings.push(w); };
  const ms = normalize(input && input.motionScenes, { nodeIds: nodeIdsOf(sections, walk), warn });
  if (ms) theme.motionScenes = ms; else delete theme.motionScenes;
  return theme;
}

// Données pour la page publique : null s'il n'y a rien à jouer. N'embarque que ce que le runtime lit.
// Revalidation sans liste d'éléments (page déjà enregistrée) : on accepte tout identifiant bien formé
const lenient = { has: (id) => ID.test(String(id)) };
function forRender(ms) {
  const m = normalize(ms, { nodeIds: lenient, warn: () => {} });
  if (!m) return null;
  const data = {};
  if (m.scenes) data.scenes = m.scenes;
  if (m.sectionTransition) data.sectionTransition = m.sectionTransition;
  if (m.smoothScroll) data.smoothScroll = m.smoothScroll;
  return Object.keys(data).length ? { v: CURRENT, ...data } : null;
}

// Transition entre les pages (API View Transitions, navigation de document). Réglage de la PAGE ; sans réglage la page suit celui du site (siteSettings.transitions).
// Amélioration progressive : un navigateur qui ne connaît pas l'API change de page normalement. Jamais en mouvement réduit.
function css(ms) {
  const m = ms && typeof ms === "object" ? normalize(ms, { nodeIds: lenient, warn: () => {} }) : null;
  const t = m && m.pageTransition;
  if (!t) return "";
  if (t.type === "off") return "@view-transition{navigation:none}";
  const d = t.duration || DEFAULTS.pageDuration;
  const move = { fade: ["", ""], slide: ["translateX(-24px)", "translateX(24px)"], zoom: ["scale(.97)", "scale(1.03)"] }[t.type];
  return [
    "@media (prefers-reduced-motion:no-preference){",
    "@view-transition{navigation:auto}",
    `::view-transition-old(root){animation:${d}ms ease both kw-vtp-out}`,
    `::view-transition-new(root){animation:${d}ms ease both kw-vtp-in}`,
    `@keyframes kw-vtp-out{to{opacity:0${move[0] ? `;transform:${move[0]}` : ""}}}`,
    `@keyframes kw-vtp-in{from{opacity:0${move[1] ? `;transform:${move[1]}` : ""}}}`,
    "}",
  ].join("");
}

function editorSpec() {
  return {
    v: CURRENT, effects: Object.entries(CORE.EFFECTS).map(([id, e]) => [id, e.label, e.kind]), triggers: Object.entries(CORE.TRIGGERS), easings: Object.keys(MOTION.EASINGS),
    pageTransitions: Object.entries(PAGE_TRANSITIONS), sectionTransitions: Object.entries(SECTION_TRANSITIONS), limits: LIMITS, defaults: { ...CORE.DEFAULT_STEP, ...DEFAULTS },
  };
}

module.exports = { CURRENT, MIGRATIONS, PAGE_TRANSITIONS, SECTION_TRANSITIONS, LIMITS, DEFAULTS, normalize, applyToTheme, nodeIdsOf, forRender, css, editorSpec, newId };
