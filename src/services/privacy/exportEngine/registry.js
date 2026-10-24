// KOLAKISA CMS → registre des COLLECTEURS d'export de données personnelles. Le moteur ne contient aucune règle propre à un module :
// chaque module dépose un fichier dans ./collectors (ou appelle register()) qui DÉCLARE les données qu'il détient pour une personne.
//   { id, title, description, category, owner, permission?, orgOnly?, scope: "site" | "principal" | "both",
//     fields[], method, filter, limits, format, collect(ctx) → { sections: [{ id, title, columns: [[clé, libellé]], rows: [{…}] }], note? } }
// ctx : { db, organizationId, siteId (nombre | null = site principal), subject: { email, userId }, can(permission), orgLevel }
// Un collecteur ne lit QUE les données de ce site et de cette personne (relations réelles : identifiant du compte, adresse e-mail identique) ;
// il ne renvoie jamais de mot de passe, de jeton ou de clé (le moteur retire aussi, par sécurité, toute colonne de ce genre).
const fs = require("node:fs");
const path = require("node:path");

const collectors = [];
const externals = [];
const ID = /^[a-z][a-z0-9_-]{1,40}$/;

function register(def) {
  if (!def || !ID.test(String(def.id || ""))) throw new Error("Collecteur invalide : identifiant stable obligatoire (minuscules, chiffres, tirets).");
  if (!def.title || !def.category || typeof def.collect !== "function") throw new Error(`Collecteur « ${def.id} » incomplet (title, category et collect() sont obligatoires).`);
  if (collectors.some((c) => c.id === def.id)) throw new Error(`Collecteur déjà déclaré : ${def.id}`);
  collectors.push({ description: "", owner: "Kolakisa", permission: null, orgOnly: false, scope: "both", fields: [], method: "", filter: "", limits: "", format: "tableau", order: 100, ...def });
}
// Source EXTERNE que Kolakisa ne peut pas lire : signalée (jamais prétendue collectée). detect(env) → true si elle s'applique à ce site.
function registerExternal(def) {
  if (!def || !ID.test(String(def.id || "")) || !def.title || !def.action) throw new Error("Source externe invalide (id, title et action obligatoires).");
  if (externals.some((e) => e.id === def.id)) throw new Error(`Source externe déjà déclarée : ${def.id}`);
  externals.push({ detect: () => true, ...def });
}

const dir = path.join(__dirname, "collectors");
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) {
  const mod = require(path.join(dir, file));
  for (const def of [].concat(mod.collectors || [])) register(def);
  for (const def of [].concat(mod.externals || [])) registerExternal(def);
}

const list = () => collectors.slice().sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
const externalsFor = (env) => externals.filter((e) => { try { return e.detect(env); } catch { return true; } });

module.exports = { register, registerExternal, list, externalsFor };
