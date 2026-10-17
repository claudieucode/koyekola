// Contrôle (lecture seule) des pages ENREGISTRÉES : réglages de parties de widgets que la partie n'accepte pas.
// Usage : node scripts/scan-property-compat.js    (utilise la base configurée ; ne modifie rien)
const db = require("../src/config/database");
const nodes = require("../src/marketing/pages/nodes");
const parts = require("../src/marketing/pages/parts");
const groupOf = (k) => (k === "backgroundColor" ? "background" : (nodes.STYLE_PROPS[k] || nodes.COMPOSED[k] || {}).group);
let rows = [];
try { rows = db.prepare("SELECT id, name, sections, draft FROM mk_landing_pages").all(); } catch (e) { console.log("Aucune table de pages :", e.message); process.exit(0); }
let found = 0;
for (const r of rows) {
  for (const [label, raw] of [["en ligne", r.sections], ["brouillon", r.draft]]) {
    if (!raw) continue;
    let sections;
    try { const v = JSON.parse(raw); sections = Array.isArray(v) ? v : v.sections; } catch { console.log(`Page ${r.id} (${label}) : JSON illisible`); continue; }
    for (const x of parts.scan(sections, groupOf)) { found++; console.log(`Page ${r.id} « ${r.name} » (${label}) : ${x.type} ${x.id} › ${x.part} › ${x.prop || x.problem}${x.scope ? " (" + x.scope + ")" : ""}`); }
  }
}
console.log(found ? `${found} réglage(s) incompatible(s) trouvé(s).` : `Aucun réglage incompatible (${rows.length} page(s) contrôlée(s)).`);
