// Registre CENTRAL des extensions : une seule copie de chaque extension, commune à tous les sites. Les manifestes sont lus UNE fois au démarrage (dossier manifests/, un fichier = une extension),
// validés strictement, puis figés. Ajouter une extension = ajouter un fichier manifeste : le noyau n'est pas modifié. L'état par site est ailleurs (state.js, table mk_site_modules).
const fs = require("node:fs");
const path = require("node:path");
const manifest = require("./manifest");
const semver = require("./semver");

const KOLAKISA_VERSION = require("../../package.json").version;

class RegistryError extends Error { constructor(message, list) { super(message); this.code = "invalid_registry"; this.problems = list || []; } }

function createRegistry(manifests, { kolakisaVersion = KOLAKISA_VERSION, knownPermissions = null } = {}) {
  const byId = new Map();
  const all = [];
  for (const m of manifests) {
    manifest.validate(m, { kolakisaVersion });
    if (byId.has(m.id)) throw new RegistryError(`Identifiant d'extension en double : « ${m.id} ».`);
    if (knownPermissions) {
      const unknown = m.permissions.filter((p) => !knownPermissions.has(p));
      if (unknown.length) throw new RegistryError(`Extension « ${m.id} » : permissions inconnues du CMS (${unknown.join(", ")}).`, unknown);
    }
    byId.set(m.id, m); all.push(m);
  }
  const issues = [];
  for (const m of all) {
    for (const d of m.dependencies) {
      const dep = byId.get(d.id);
      if (!dep) issues.push(`« ${m.id} » dépend de « ${d.id} », absente du registre`);
      else if (!semver.satisfies(dep.version, d.range)) issues.push(`« ${m.id} » exige « ${d.id} » ${d.range} (version ${dep.version} fournie)`);
    }
    for (const c of m.conflicts) if (!byId.has(c)) issues.push(`« ${m.id} » déclare un conflit avec « ${c} », absente du registre`);
  }
  // Cycles de dépendances
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) { issues.push(`dépendances circulaires : ${[...trail, id].join(" → ")}`); return; }
    state.set(id, 1);
    for (const d of (byId.get(id) || { dependencies: [] }).dependencies) if (byId.has(d.id)) visit(d.id, [...trail, id]);
    state.set(id, 2);
  };
  for (const m of all) visit(m.id, []);
  if (issues.length) throw new RegistryError(`Registre d'extensions incohérent : ${issues.join(" ; ")}`, issues);

  const deepFreeze = (o) => { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; };
  all.forEach(deepFreeze);
  const sorted = Object.freeze([...all].sort((a, b) => a.name.localeCompare(b.name, "fr")));

  const api = {
    kolakisaVersion,
    ids: Object.freeze(all.map((m) => m.id)),
    list: () => sorted,
    has: (id) => typeof id === "string" && byId.has(id),
    get: (id) => (typeof id === "string" ? byId.get(id) || null : null),
    // Extensions qui dépendent de `id` (directement)
    dependentsOf: (id) => all.filter((m) => m.dependencies.some((d) => d.id === id)).map((m) => m.id),
    // Extension propriétaire d'un chemin (dans une liste d'expressions du manifeste) — null si aucune
    ownerOfPath(kind, p) {
      const key = kind === "admin" ? "adminRoutes" : "publicRoutes";
      for (const m of all) if (m[key].some((r) => new RegExp(r).test(p))) return m.id;
      return null;
    },
    menuGroups: () => all.flatMap((m) => m.menus.map((g) => ({ ...g, extension: m.id }))),
  };
  return Object.freeze(api);
}

// Registre du produit : lit src/extensions/manifests/*.js. Les permissions déclarées doivent exister dans le catalogue du CMS.
let instance = null;
function load() {
  if (instance) return instance;
  const dir = path.join(__dirname, "manifests");
  const manifests = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort().map((f) => {
    const m = require(path.join(dir, f));
    if (m && m.id && f !== `${m.id}.js`) throw new RegistryError(`Le fichier ${f} doit s'appeler « ${m.id}.js ».`);
    return m;
  });
  let known = null;
  try { known = new Set(require("../services/cmsAccess").GROUPS.flatMap((g) => g.perms.map((p) => p[0]))); } catch { known = null; }
  instance = createRegistry(manifests, { knownPermissions: known });
  return instance;
}
// Tests : remplace temporairement le registre du produit par un registre de fixtures ; renvoie la fonction de restauration.
function override(r) { const previous = instance; instance = r; return () => { instance = previous; }; }
module.exports = { createRegistry, load, override, RegistryError, KOLAKISA_VERSION };
