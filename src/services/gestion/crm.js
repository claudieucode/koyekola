// CRM — pont entre la fiche élève (Centre de gestion) et la fiche contact (KOLAKISA Marketing).
// Aucune donnée n'est copiée ni dupliquée : chaque fiche LIT l'autre. Un contact est lié à un compte par lms_user_id ET par
// adresse e-mail (les identifiants sont réutilisés après un « npm run seed » : même règle que le pont marketing).
const db = require("../../config/database");
const { normalizeEmail } = require("../../marketing/audience/email");
const students = require("./students");
const mkHelpers = require("../../marketing/web/helpers");

const RELATIONS = {
  client: { label: "Client", hint: "A acheté au moins une formation." },
  etudiant: { label: "Étudiant", hint: "Inscrit à au moins une formation, sans achat (formations gratuites)." },
  prospect: { label: "Prospect", hint: "Aucune inscription ni achat." },
};

// Relation commerciale, calculée sur les données réelles (jamais saisie à la main, donc jamais fausse)
function relationOf(userId) {
  if (!userId) return "prospect";
  if (db.prepare("SELECT 1 FROM orders WHERE user_id = ? LIMIT 1").get(userId)) return "client";
  if (db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? LIMIT 1").get(userId)) return "etudiant";
  return "prospect";
}

// Fiche contact marketing d'un compte du LMS, ou null (module indisponible, compte sans contact, contact d'une autre organisation)
function contactOfUser(marketing, userId) {
  if (!marketing || !marketing.ready) return null;
  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  const contact = db
    .prepare("SELECT id, email, status, source, sms_status, created_at FROM mk_contacts WHERE organization_id = ? AND lms_user_id = ? AND email = ?")
    .get(marketing.organizationId, user.id, normalizeEmail(user.email));
  if (!contact) return null;
  return {
    ...contact,
    status_label: mkHelpers.statusLabel(contact.status), // mêmes libellés que dans KOLAKISA Marketing
    tags: db
      .prepare("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? AND ct.organization_id = ? ORDER BY t.name COLLATE NOCASE")
      .all(contact.id, marketing.organizationId).map((t) => t.name),
    lists: db
      .prepare("SELECT l.name FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id WHERE m.contact_id = ? AND m.organization_id = ? ORDER BY l.name COLLATE NOCASE")
      .all(contact.id, marketing.organizationId).map((l) => l.name),
  };
}

// Données du LMS pour une fiche contact : seulement si le contact est lié à un compte portant la MÊME adresse.
// Le formateur ne voit que ses propres formations et commandes (getStudent) ; relation sur l'ensemble des données du compte.
function lmsOfContact(instructorId, contact) {
  if (!contact || !contact.lms_user_id) return null;
  const user = db.prepare("SELECT id, username, email, created_at FROM users WHERE id = ?").get(contact.lms_user_id);
  if (!user || normalizeEmail(user.email) !== contact.email) return null;
  const student = students.getStudent(instructorId, user.id); // null si le compte n'est inscrit à aucune de vos formations
  return { user, relation: relationOf(user.id), student };
}

module.exports = { RELATIONS, relationOf, contactOfUser, lmsOfContact };
