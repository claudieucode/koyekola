// Ce que le site sait RÉELLEMENT du visiteur d'une page, pour la personnalisation (phase 13) : son compte s'il est
// connecté, sinon le contact relié à son navigateur (seulement si la mesure d'audience est acceptée). Rien d'autre :
// sans information, le visiteur est « inconnu ».
const { consentedVisitor } = require("../web/visitorsPublic");

function visitorContext(db, organizationId, req) {
  if (req._kwVisitor) return req._kwVisitor;
  const user = req.session && req.session.user ? req.session.user : null;
  let contact = null;
  if (user && user.email) contact = db.prepare("SELECT id, status, score, first_name FROM mk_contacts WHERE organization_id = ? AND email = lower(trim(?))").get(organizationId, user.email) || null;
  if (!contact) {
    const vid = consentedVisitor(req);
    const v = vid ? db.prepare("SELECT contact_id FROM mk_web_visitors WHERE id = ? AND organization_id = ?").get(vid, organizationId) : null;
    if (v && v.contact_id) contact = db.prepare("SELECT id, status, score, first_name FROM mk_contacts WHERE id = ? AND organization_id = ?").get(v.contact_id, organizationId) || null;
  }
  const tags = new Set(contact ? db.prepare("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ?").all(contact.id).map((t) => t.name.toLowerCase()) : []);
  // Client : commande reçue par le pont, ou (compte connecté) commande enregistrée sur le site, même ancienne
  const customer = Boolean((contact && db.prepare("SELECT 1 FROM mk_events WHERE organization_id = ? AND contact_id = ? AND name = 'lms.order_completed' LIMIT 1").get(organizationId, contact.id))
    || (user && require("../bridge/catalog").userHasOrder({ db, organizationId }, user.id)));
  // Prénom (contact connu), connexion et panier : pour les éléments « Texte dynamique » et « Compte du visiteur »
  const cart = req.session && req.session.cart && typeof req.session.cart === "object" ? Object.keys(req.session.cart).length : 0;
  req._kwVisitor = { known: Boolean(contact || user), student: Boolean(user), subscribed: Boolean(contact && contact.status === "subscribed"), customer, tags, score: contact ? contact.score : 0,
    firstName: contact && contact.first_name ? String(contact.first_name).trim().slice(0, 60) : "", loggedIn: Boolean(user), cartCount: cart };
  return req._kwVisitor;
}

module.exports = { visitorContext };
