// Contrat des fichiers de secteur de la bibliothèque d'en-têtes : header/sectors/<secteur>.js (voir docs/theme-builder/HEADER_SECTOR_CONTRACT.md).
// Un fichier de secteur peut REMPLACER les 10 modèles hérités de models.js pour son secteur (mêmes clés « <secteur>-NN ») ; `models: null` = on garde l'existant.
// Toute entrée est validée au chargement : un fichier invalide fait échouer le démarrage du catalogue (jamais un modèle à moitié valide en production).
const MODES = ["static", "sticky", "stickyhide", "stickyshrink", "glass", "overlay", "overlaysolid"];
const ANIMS = ["none", "rise", "soft", "reveal", "slide", "zoom"];
const HEX = /^#[0-9a-f]{6}$/i, FONT = /^font\.[a-z0-9-]+$/;
const IDENTITY = ["bg", "fg", "mute", "alt", "accent", "onAccent", "line"];
const fail = (where, msg) => { throw new Error(`En-têtes, secteur ${where} : ${msg}`); };
const strings = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim());

const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };

// Validation structurelle d'un fichier de secteur (sans construire les nœuds)
function validateShape(sector, mod, file) {
  const at = `${sector} (${file})`;
  if (!mod || typeof mod !== "object") fail(at, "le fichier doit exporter un objet { sector, models }.");
  if (mod.sector !== sector) fail(at, `« sector » vaut ${JSON.stringify(mod.sector)}, attendu « ${sector} ».`);
  if (mod.models === null || mod.models === undefined) return false;
  if (!Array.isArray(mod.models) || mod.models.length !== 10) fail(at, "« models » doit être null (repli sur l'existant) ou un tableau de EXACTEMENT 10 modèles.");
  const names = new Set();
  mod.models.forEach((M, i) => {
    const key = `${sector}-${String(i + 1).padStart(2, "0")}`, w = `${at} ${key}`;
    if (!M || M.key !== key) fail(w, `la clé doit être « ${key} » (ordre 01 à 10, mêmes clés que l'existant).`);
    for (const f of ["name", "art", "desc"]) if (typeof M[f] !== "string" || !M[f].trim()) fail(w, `« ${f} » manquant.`);
    if (names.has(M.name.toLowerCase())) fail(w, `nom en double dans le secteur : ${M.name}`); names.add(M.name.toLowerCase());
    if (!M.S || M.S.key !== key) fail(w, "« S » doit être créé par ID(\"<clé>\", nom, {...}) de header/blocks.js (S.key = clé du modèle).");
    for (const c of IDENTITY) if (!HEX.test(M.S[c] || "")) fail(w, `S.${c} doit être une couleur fixe #rrggbb (jamais un jeton du site).`);
    if (!FONT.test(M.S.font || "") || !FONT.test(M.S.head || "")) fail(w, "S.font et S.head doivent être des polices de la bibliothèque locale (font.<nom>).");
    if (typeof M.build !== "function") fail(w, "« build(k) » doit être une fonction qui renvoie un tableau de nœuds.");
    if (M.mode !== undefined && !MODES.includes(M.mode)) fail(w, `mode inconnu « ${M.mode} » (${MODES.join(", ")}).`);
    if (M.anim !== undefined && !ANIMS.includes(M.anim)) fail(w, `anim inconnue « ${M.anim} » (${ANIMS.join(", ")}).`);
    if (typeof M.dark !== "boolean") fail(w, "« dark » (true/false) obligatoire.");
    if (!strings(M.tags)) fail(w, "« tags » : tableau de mots-clés (au moins un).");
    if (!strings(M.features) || M.features.length < 3) fail(w, "« features » : au moins 3 fonctionnalités réelles du modèle.");
    if (M.animations !== undefined && !Array.isArray(M.animations)) fail(w, "« animations » doit être un tableau.");
    if (!strings(M.settings)) fail(w, "« settings » : liste des réglages réellement proposés par ce modèle.");
  });
  return true;
}

// Validation profonde d'un modèle construit : grammaire du Page Builder (mêmes contrôles que la sauvegarde), mouvements annoncés réellement présents
function validateBuilt(M, nodes) {
  const w = `${M.sector} ${M.key}`;
  if (!Array.isArray(nodes) || nodes.length < 1) fail(w, "build(k) doit renvoyer un tableau non vide de nœuds.");
  const { normalizeSections, newSectionId } = require("../../../marketing/pages/sections");
  const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
  try { normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: JSON.parse(JSON.stringify(nodes)) }]); } catch (e) { fail(w, `nœuds refusés par la grammaire : ${e.message}`); }
  const entr = new Set(), hov = new Set();
  walk(nodes, (n) => { if (n.motion && n.motion.entrance) entr.add(n.motion.entrance); if (n.motion && n.motion.hover) hov.add(n.motion.hover); });
  for (const a of M.animations || []) if (!entr.has(a) && !hov.has(a)) fail(w, `animation annoncée « ${a} » absente des nœuds (une animation annoncée doit exister).`);
}

// Fusion : base = modèles hérités (models.js), sectors = [{ key }] ; renvoie { models, overridden: [secteurs remplacés] }
function merge(base, sectors, load) {
  const out = base.slice(), overridden = [];
  for (const s of sectors) {
    const file = `header/sectors/${s.key}.js`; let mod;
    try { mod = load(s.key); } catch (e) { if (e && e.code === "MODULE_NOT_FOUND" && String(e.message).includes(`sectors/${s.key}`)) continue; throw e; }
    if (!validateShape(s.key, mod, file)) continue;
    overridden.push(s.key);
    for (const M of mod.models) {
      const i = out.findIndex((x) => x.key === M.key);
      if (i < 0) fail(`${s.key} ${M.key}`, "clé inconnue de l'existant (aucune clé orpheline autorisée).");
      out[i] = { ...M, sector: s.key, n: out[i].n, arch: M.arch || M.key, P: { ...out[i].P, ...(M.P || {}) }, V: M.V || {}, anim: M.anim === undefined ? "rise" : M.anim, hover: M.hover || "", mode: M.mode || "static", custom: true };
    }
  }
  const names = new Set();
  for (const M of out) { if (names.has(M.name.toLowerCase())) fail(M.sector, `nom en double dans la bibliothèque : ${M.name}`); names.add(M.name.toLowerCase()); }
  return { models: out, overridden };
}
module.exports = { MODES, ANIMS, validateShape, validateBuilt, merge };
