// Manifeste d'une extension Kolakisa : format, validation STRICTE. Une extension invalide n'entre jamais dans le registre (le démarrage échoue avec la liste des défauts).
// Le manifeste est de la DONNÉE déclarative (plus de petites fonctions optionnelles : hooks) ; il ne charge aucun code d'extension tant que l'extension n'est pas activée pour un site.
const semver = require("./semver");

const ID_RE = /^[a-z][a-z_]{1,29}$/; // même règle que le CHECK de mk_site_modules.module
const CATEGORIES = ["commerce", "formation", "communication", "marketing", "ia", "analyse", "contenu", "outils"];
const AVAILABILITY = ["available", "beta", "unavailable"];
const MAINTENANCE = ["stable", "maintenance", "deprecated"];
const SCOPES = ["optional", "always_on_primary"]; // always_on_primary : le site principal n'est jamais soumis à l'activation (comportement historique)
const SETTING_TYPES = ["string", "number", "boolean", "select"];
const KEYS = new Set(["id", "name", "description", "icon", "version", "publisher", "category", "availability", "maintenance", "compatibility", "dependencies", "conflicts", "permissions",
  "scope", "migrations", "entry", "adminRoutes", "publicRoutes", "menus", "settings", "events", "hooks", "tasks", "resources", "docs", "phase"]);

const isStr = (v, min = 1, max = 400) => typeof v === "string" && v.trim().length >= min && v.length <= max;
const isRegex = (s) => { try { new RegExp(s); return typeof s === "string"; } catch { return false; } };

// Retourne la liste des défauts (vide = valide). Ne lance rien : le registre décide.
function problems(m, { kolakisaVersion } = {}) {
  const p = [];
  const bad = (msg) => p.push(msg);
  if (!m || typeof m !== "object" || Array.isArray(m)) return ["le manifeste doit être un objet"];
  for (const k of Object.keys(m)) if (!KEYS.has(k)) bad(`champ inconnu « ${k} »`);
  if (!ID_RE.test(m.id || "")) bad("id : 2 à 30 lettres minuscules ou « _ », commence par une lettre");
  if (!isStr(m.name, 2, 80)) bad("name : 2 à 80 caractères");
  if (!isStr(m.description, 10, 400)) bad("description : 10 à 400 caractères");
  if (!isStr(m.icon, 2, 30) || !/^[a-z][a-z0-9-]*$/.test(m.icon)) bad("icon : nom d'icône du CMS (minuscules)");
  if (!semver.valid(m.version)) bad("version : majeur.mineur.correctif");
  if (!isStr(m.publisher, 2, 80)) bad("publisher : requis");
  if (!CATEGORIES.includes(m.category)) bad(`category : une de ${CATEGORIES.join(", ")}`);
  if (!AVAILABILITY.includes(m.availability)) bad(`availability : une de ${AVAILABILITY.join(", ")}`);
  if (!MAINTENANCE.includes(m.maintenance)) bad(`maintenance : une de ${MAINTENANCE.join(", ")}`);
  if (!SCOPES.includes(m.scope)) bad(`scope : une de ${SCOPES.join(", ")}`);
  const c = m.compatibility;
  if (!c || typeof c !== "object" || !semver.validRange(c.kolakisa)) bad("compatibility.kolakisa : plage de versions (ex. « >=1.0.0 »)");
  else if (kolakisaVersion && semver.valid(kolakisaVersion) && !semver.satisfies(kolakisaVersion, c.kolakisa)) bad(`incompatible avec Kolakisa ${kolakisaVersion} (exige ${c.kolakisa})`);
  if (!Array.isArray(m.dependencies)) bad("dependencies : liste (peut être vide)");
  else m.dependencies.forEach((d, i) => { if (!d || !ID_RE.test(d.id || "") || !semver.validRange(d.range)) bad(`dependencies[${i}] : { id, range } valides`); else if (d.id === m.id) bad("une extension ne dépend pas d'elle-même"); });
  if (!Array.isArray(m.conflicts) || m.conflicts.some((x) => !ID_RE.test(x || "") || x === m.id)) bad("conflicts : liste d'identifiants (peut être vide)");
  if (!Array.isArray(m.permissions) || m.permissions.some((x) => !/^[a-z]+\.[a-z_]+$/.test(x || ""))) bad("permissions : liste de clés « domaine.action »");
  if (!Array.isArray(m.migrations) || m.migrations.some((x) => !/^\d{3}_[a-z0-9_]+\.sql$|^core$/.test(x || ""))) bad("migrations : noms de fichiers « 123_nom.sql » (ou « core » pour un schéma historique)");
  const e = m.entry;
  if (!e || typeof e !== "object") bad("entry : points d'entrée { service?, admin?, public?, lifecycle? }");
  else for (const k of ["service", "admin", "public", "lifecycle"]) if (e[k] !== undefined && !/^[\w./-]+$/.test(e[k])) bad(`entry.${k} : chemin relatif invalide`);
  for (const key of ["adminRoutes", "publicRoutes"]) {
    if (!Array.isArray(m[key])) bad(`${key} : liste d'expressions régulières (peut être vide)`);
    else m[key].forEach((r, i) => { if (!isRegex(r)) bad(`${key}[${i}] : expression régulière invalide`); });
  }
  if (!Array.isArray(m.menus)) bad("menus : liste (peut être vide)");
  else m.menus.forEach((g, i) => {
    if (!g || !/^[a-z][a-z0-9_-]*$/.test(g.key || "") || !isStr(g.label, 2, 40) || !isStr(g.icon, 2, 30)) bad(`menus[${i}] : { key, label, icon, items }`);
    else if (!Array.isArray(g.items) || !g.items.length || g.items.some((it) => !it || !/^[a-z][a-z0-9/_-]*$/.test(it.key || "") || !isStr(it.label, 2, 60) || !isStr(it.href, 1, 300) || !isStr(it.permission, 3, 60))) bad(`menus[${i}].items : { key, label, href, permission } requis`);
  });
  if (!Array.isArray(m.settings)) bad("settings : liste (peut être vide)");
  else m.settings.forEach((s, i) => { if (!s || !/^[a-z][a-z0-9_]*$/.test(s.key || "") || !SETTING_TYPES.includes(s.type) || !isStr(s.label, 2, 80) || !("default" in s)) bad(`settings[${i}] : { key, type, label, default }`); else if (s.type === "select" && (!Array.isArray(s.options) || !s.options.length)) bad(`settings[${i}] : un réglage « select » liste ses options`); });
  for (const key of ["events", "hooks", "tasks"]) if (!Array.isArray(m[key]) || m[key].some((x) => !/^[a-z][\w.:-]{1,60}$/.test(x || ""))) bad(`${key} : liste de noms (peut être vide)`);
  const r = m.resources;
  if (!r || typeof r !== "object" || ["css", "js"].some((k) => r[k] !== undefined && (!Array.isArray(r[k]) || r[k].some((x) => !/^\/[\w./-]+$/.test(x))))) bad("resources : { css?: [chemins publics], js?: [chemins publics] }");
  if (!isStr(m.docs, 3, 200)) bad("docs : chemin du document de l'extension");
  return p;
}

class ManifestError extends Error { constructor(id, list) { super(`Extension « ${id} » invalide : ${list.join(" ; ")}`); this.id = id; this.problems = list; this.code = "invalid_manifest"; } }
function validate(m, opts) { const list = problems(m, opts); if (list.length) throw new ManifestError(m && m.id ? m.id : "?", list); return m; }

module.exports = { problems, validate, ManifestError, ID_RE, CATEGORIES, AVAILABILITY, MAINTENANCE, SCOPES };
