// Contact Core (palier 15) : branche les modules existants sur le journal d'événements, sans les modifier en profondeur.
// Commentaires : « comment.created » / « comment.approved » entrent dans le journal du contact.
//  - un commentaire n'inscrit JAMAIS personne au marketing (aucun consentement, aucune liste, aucune étiquette) ;
//  - AUCUNE fiche n'est créée à partir d'un commentaire (donnée personnelle non nécessaire) : si la personne a déjà une fiche (même adresse,
//    y compris une adresse reprise lors d'une fusion), l'événement s'y rattache ; sinon il reste lié à l'adresse seule et rejoindra la
//    fiche si elle est créée plus tard (formulaire, inscription, import) ;
//  - un commentaire indésirable (spam) n'est pas enregistré du tout.
const core = require("./index");
const { findByEmail } = require("../audience/contacts");

function install({ marketing, db, comments, log = console }) {
  if (!marketing || !marketing.ready || !comments || !comments.events) return false;
  const ctx = () => ({ db, organizationId: marketing.organizationId, userId: null, bus: marketing.bus, settings: marketing.settings, audit: false });

  // Adresse et nom de l'auteur : le compte (si connecté) sinon les champs saisis
  function authorOf(row) {
    if (row.user_id) {
      const u = db.prepare("SELECT id, username, email FROM users WHERE id = ?").get(row.user_id);
      return u ? { email: u.email, name: u.username, userId: u.id } : { email: "", name: "", userId: null };
    }
    return { email: row.author_email || "", name: row.author_name || "", userId: null };
  }

  const record = (name, payload) => {
    try {
      const row = comments.get(payload.commentId);
      if (!row || row.status === "spam") return;
      const c = ctx();
      const who = authorOf(row);
      const contact = who.email ? findByEmail(c, who.email) : null;
      core.recordEvent(c, {
        type: name, contactId: contact ? contact.id : null, email: contact ? null : who.email || null, source: "comments", objectType: "comment", objectId: row.id,
        actorUserId: who.userId, idempotencyKey: `${name}:${row.id}`, metadata: { contentType: row.content_type, contentId: row.content_id, status: row.status, reply: Boolean(row.parent_id) },
      });
    } catch (error) {
      log.error?.("[KOLAKISA] Événement de commentaire non enregistré dans le Contact Core :", error.message);
    }
  };
  comments.events.on("comment.created", (payload) => record("comment.created", payload));
  comments.events.on("comment.approved", (payload) => record("comment.approved", payload));
  return true;
}

module.exports = { install };
