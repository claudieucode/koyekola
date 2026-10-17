// Portée de site de l'API publique (R2, décision D4). La portée effective vient UNIQUEMENT de la clé enregistrée (`req.mkApi`, établie par
// `authenticate`), jamais d'un paramètre, d'un en-tête ou du corps de la requête. Une clé « organization » garde exactement l'accès historique ;
// une clé « site » est ramenée au modèle `ctx.siteScope` de l'Email Engine (listes, campagnes) et filtrée ici pour les contacts, qui restent
// dans le Contact Core de l'organisation (un contact appartient à un site par son origine OU par un événement de ce site).
const { recordAudit } = require("../audit");

const isSiteKey = (auth) => auth.reach === "site" && Number.isInteger(auth.siteId);

// Fragment SQL « le contact (alias `a`) est LISIBLE depuis le site » — même définition que partout (R7 : table d'association mk_contact_sites, contactcore/siteAccess.js).
// L'ÉCRITURE est plus étroite : seulement les contacts dont l'origine est ce site (siteAccess.canWrite).
function contactInSite(a, siteId) {
  return {
    sql: `EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = ${a}.id AND cs.site_id = ? AND cs.organization_id = ${a}.organization_id)`,
    params: [siteId],
  };
}

// Le contact de cette adresse ou de cet identifiant est-il HORS de la portée de la clé ? (aucune fuite : l'appelant répond de façon générique)
function contactOutsideScope(db, auth, { contactId = null, contact = null }) {
  if (!isSiteKey(auth)) return false;
  const id = contact ? contact.id : contactId;
  if (!Number.isInteger(id)) return false;
  const f = contactInSite("c", auth.siteId);
  return !db.prepare(`SELECT 1 FROM mk_contacts c WHERE c.id = ? AND c.organization_id = ? AND ${f.sql}`).get(id, auth.organizationId, ...f.params);
}

// Journal : tentative d'une clé de site hors de sa portée (jamais le contenu de la requête, jamais la clé)
function auditDenied(db, auth, route, reason) {
  try {
    recordAudit(db, { organizationId: auth.organizationId, userId: null, action: "api_key.out_of_scope", resourceType: "api_key", resourceId: auth.keyId, metadata: { route, reason, site_id: auth.siteId } });
  } catch { /* le journal ne doit jamais empêcher la réponse de refus */ }
}

module.exports = { isSiteKey, contactInSite, contactOutsideScope, auditDenied };
