// Registre des IMPORTATEURS (Outils → Importer) : une seule liste, alimentée par des déclarations (./defs/*.js) et par les extensions qui appellent register().
// Un importateur ne figure ici que s'il fonctionne réellement. Le moteur d'import (exchange.js : analyse → confirmation → lots → rapport → annulation) est UNIQUE ;
// un importateur fournit seulement la conversion de sa source vers le format interne (convert) ou, pour un outil, sa propre page.
//   { id, name, description, order, kind: "file"|"url"|"native"|"tool", version, formats[], mime[], supports[], limits[], dependencies[], permissions[], requires, convert(input, opts), status(env) }
// Installation : les importateurs fournis sont INSTALLÉS avec l'application (aucune installation à faire) ; l'activation est une vraie préférence de l'organisation
// (table mk_importer_state) : un importateur désactivé n'ouvre plus son parcours (routes et moteur refusent).
const fs = require("node:fs");
const path = require("node:path");

const registry = [];
const ID = /^[a-z][a-z0-9-]{1,30}$/;
function register(def) {
  if (!def || typeof def.id !== "string" || !ID.test(def.id)) throw new Error("Importateur invalide : identifiant (a-z, 0-9, tirets) obligatoire.");
  if (!def.name || !def.description) throw new Error(`Importateur « ${def.id} » invalide : nom et description obligatoires.`);
  if (registry.some((m) => m.id === def.id)) throw new Error(`Importateur déjà déclaré : ${def.id}`);
  if (def.kind !== "tool" && def.kind !== "native" && typeof def.convert !== "function") throw new Error(`Importateur « ${def.id} » invalide : convert() obligatoire.`);
  registry.push({ order: 100, version: "1.0", formats: [], mime: [], supports: [], limits: [], dependencies: [], permissions: ["tools.import"], requires: "", status: () => ({ compatible: true, reason: "" }), ...def });
  registry.sort((a, b) => a.order - b.order);
  return def.id;
}
const dir = path.join(__dirname, "defs");
for (const file of fs.readdirSync(dir).filter((f) => /^\d.*\.js$/.test(f)).sort()) register(require(path.join(dir, file)));

// Sources connues mais NON prises en charge : affichées honnêtement, jamais comme importateurs
const UNSUPPORTED = Object.freeze([
  { id: "blogger", name: "Blogger", reason: "Demande un compte Google (OAuth) et l'API Blogger, ou la conversion préalable de son export : non pris en charge pour l'instant." },
  { id: "tumblr", name: "Tumblr", reason: "Demande l'authentification à l'API Tumblr (clés et autorisation du compte) : non pris en charge pour l'instant." },
  { id: "livejournal", name: "LiveJournal", reason: "Demande l'authentification au service : non pris en charge pour l'instant." },
  { id: "movabletype", name: "Movable Type et TypePad", reason: "Leur format d'exportation propre n'est pas lu pour l'instant. Si votre blog peut produire un flux RSS ou un export WordPress, utilisez ces importateurs." },
]);

const all = () => registry.slice();
const get = (id) => registry.find((m) => m.id === id) || null;

function enabled(db, orgId, id) {
  try { const r = db.prepare("SELECT enabled FROM mk_importer_state WHERE organization_id = ? AND importer_id = ?").get(orgId, id); return r ? r.enabled === 1 : true; } catch { return true; }
}
function setEnabled(db, orgId, id, value, userId = null) {
  if (!get(id)) throw Object.assign(new Error("Importateur inconnu."), { user: true });
  db.prepare("INSERT INTO mk_importer_state (organization_id, importer_id, enabled, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(organization_id, importer_id) DO UPDATE SET enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = datetime('now')").run(orgId, id, value ? 1 : 0, userId);
}
// État affiché : disponible (installé + activé + compatible), désactivé, ou incompatible (avec la raison)
function stateOf(db, orgId, def, env = {}) {
  let st; try { st = def.status(env) || { compatible: true }; } catch { st = { compatible: false, reason: "Vérification impossible." }; }
  const on = enabled(db, orgId, def.id);
  return { installed: true, enabled: on, compatible: st.compatible !== false, reason: st.reason || "", label: !st.compatible && st.compatible !== undefined ? "Incompatible" : on ? "Installé et activé" : "Installé, désactivé" };
}

module.exports = { register, all, get, enabled, setEnabled, stateOf, UNSUPPORTED };
