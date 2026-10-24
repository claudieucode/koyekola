// Commentaires du blog : auteur anonymisé (compte, nom, e-mail, empreinte d'adresse), texte conservé ou remplacé selon le choix de l'administrateur.
// Seuls les commentaires des contenus DU SITE de la demande sont traités.
const { count } = require("./_kit");
const comments = () => require("../../comments");
const REMOVED = "[Commentaire supprimé à la demande de son auteur]";
const siteOfRow = (r) => comments().siteIdOf(r.content_type || "post", r.content_id || r.post_id);
const WHERE = "(user_id = ? OR (author_email <> '' AND lower(author_email) = ?))";
const args = (s) => [s.userId ?? -1, s.email || ""];

module.exports = {
  id: "comments", order: 30, scope: "any",
  title: "Commentaires",
  description: "Commentaires publiés sur le site, par la personne ou à son adresse e-mail.",
  categories: ["Commentaires", "Nom et e-mail de l'auteur", "Empreinte d'adresse IP"],
  preview(env, s, options = {}) {
    const rows = env.db.prepare(`SELECT id, content_type, content_id, post_id FROM blog_comments WHERE ${WHERE}`).all(...args(s)).filter((r) => (siteOfRow(r) ?? null) === env.siteId);
    const del = options.comments === "delete";
    const retained = del ? [] : [{ label: "Texte des commentaires", count: rows.length, reason: "Contribution publique conservée : seul l'auteur est rendu anonyme. Si le texte identifie la personne, choisissez « supprimer le texte »." }].filter((x) => x.count > 0);
    return { erase: del ? rows.length : 0, anonymize: rows.length, retained, manual: [] };
  },
  run(env, s, state, { limit, options }) {
    const del = options.comments === "delete";
    const rows = env.db.prepare(`SELECT id, content_type, content_id, post_id FROM blog_comments WHERE id > ? AND ${WHERE} ORDER BY id LIMIT ?`).all(Number(state.cursor) || 0, ...args(s), limit);
    let anonymized = 0, erased = 0;
    for (const r of rows) {
      if ((siteOfRow(r) ?? null) !== env.siteId) continue;
      env.db.prepare(`UPDATE blog_comments SET user_id = NULL, author_name = 'Anonyme', author_email = '', ip_hash = ''${del ? ", body = ?" : ""}, updated_at = datetime('now') WHERE id = ?`).run(...(del ? [REMOVED, r.id] : [r.id]));
      anonymized += 1; if (del) erased += 1;
    }
    const last = rows.length ? rows[rows.length - 1].id : Number(state.cursor) || 0;
    const done = rows.length < limit;
    return { done, cursor: String(last), erased, anonymized, outcome: done && !del ? { retained: [{ label: "Texte des commentaires anonymisés", reason: "Contribution publique conservée ; l'auteur n'est plus identifiable." }] } : undefined };
  },
};
