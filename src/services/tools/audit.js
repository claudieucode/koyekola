// Journal d'activité des outils : chaque opération sensible (export, import, remplacement, nettoyage, cache, maintenance) est tracée (qui, quoi, combien).
const auditLog = require("../auditLog");
const log = (actor, action, summary, details = {}) => auditLog.record(actor, { action: `tools.${action}`, resourceType: "tools", summary, details });
module.exports = { log };
