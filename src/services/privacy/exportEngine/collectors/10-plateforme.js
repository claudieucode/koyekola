// Données du COMPTE de la plateforme (élève ou formateur) : portée « site principal » seulement — un compte n'appartient pas à un site du Page Builder.
// Relation réelle : l'identifiant du compte retrouvé par l'adresse e-mail (ou l'identifiant saisi), jamais un nom ressemblant. Jamais de mot de passe ni de jeton.
const { tableExists, pick, when, section } = require("./_helpers");

const needUser = (ctx) => ctx.subject.userId || null;
const money = (cents) => `${(Number(cents || 0) / 100).toFixed(2).replace(".", ",")} €`;

const collectors = [
  {
    id: "compte", title: "Compte et profil", category: "Compte", owner: "Kolakisa — Comptes", order: 10, scope: "principal", orgOnly: true,
    description: "Informations de compte et de profil de la personne sur la plateforme.",
    fields: ["identifiant", "adresse e-mail", "rôle", "présentation", "fuseau horaire", "dates de création, de dernière connexion et de vérification de l'adresse", "statut du compte"],
    method: "Lecture du compte (table users) retrouvé par l'adresse e-mail ou l'identifiant saisi.", filter: "Un seul compte : celui de la personne. Le mot de passe et les jetons ne sont jamais lus.",
    limits: "Les photos de profil ne sont pas incluses (seul leur chemin existe côté serveur).",
    collect(ctx) {
      const id = needUser(ctx); if (!id) return { sections: [] };
      const cols = pick(ctx.db, "users", ["username", "email", "role", "bio", "timezone", "status", "created_at", "last_login_at", "email_verified_at"]);
      const row = ctx.db.prepare(`SELECT ${cols.join(", ")} FROM users WHERE id = ?`).get(id);
      if (!row) return { sections: [] };
      const labels = { username: "Identifiant", email: "Adresse e-mail", role: "Rôle", bio: "Présentation", timezone: "Fuseau horaire", status: "Statut du compte", created_at: "Compte créé le", last_login_at: "Dernière connexion", email_verified_at: "Adresse vérifiée le" };
      const dates = new Set(["created_at", "last_login_at", "email_verified_at"]);
      const rows = cols.filter((c) => row[c] !== null && row[c] !== "").map((c) => ({ champ: labels[c], valeur: dates.has(c) ? when(row[c]) : String(row[c]) }));
      return { sections: [section("compte", "Compte", [["champ", "Champ"], ["valeur", "Valeur"]], rows)] };
    },
  },
  {
    id: "preferences", title: "Préférences d'interface", category: "Compte", owner: "Kolakisa — Comptes", order: 11, scope: "principal", orgOnly: true,
    description: "Thème et couleur choisis par la personne dans l'éditeur.", fields: ["thème de l'éditeur", "couleur de l'éditeur"], method: "Lecture de user_prefs pour le compte.", filter: "Compte de la personne.", limits: "",
    collect(ctx) {
      const id = needUser(ctx); if (!id || !tableExists(ctx.db, "user_prefs")) return { sections: [] };
      const row = ctx.db.prepare("SELECT editor_theme, editor_color FROM user_prefs WHERE user_id = ?").get(id);
      if (!row) return { sections: [] };
      return { sections: [section("preferences", "Préférences", [["theme", "Thème"], ["couleur", "Couleur"]], [{ theme: row.editor_theme || "", couleur: row.editor_color || "" }])] };
    },
  },
  {
    id: "formation", title: "Formations et progression", category: "Formation", owner: "Kolakisa — Formations", order: 20, scope: "principal", orgOnly: true,
    description: "Inscriptions, leçons terminées, tentatives de quiz, notes personnelles, favoris, avis et certificats de l'apprenant.",
    fields: ["formations suivies", "leçons terminées", "scores de quiz", "notes de leçon", "favoris", "avis", "certificats"],
    method: "Lectures des tables enrollments, lesson_progress, quiz_attempts, lesson_notes, favorites, reviews et certificates pour l'identifiant du compte.", filter: "Uniquement les lignes dont user_id est celui du compte.",
    limits: "Le contenu des formations n'est pas exporté : seules les références (titres) et les traces de la personne le sont.",
    collect(ctx) {
      const id = needUser(ctx); if (!id) return { sections: [] };
      const q = (sql) => ctx.db.prepare(sql).all(id);
      const out = [];
      out.push(section("inscriptions", "Formations suivies", [["formation", "Formation"], ["inscrit_le", "Inscrit le"]],
        q("SELECT c.title AS formation, e.created_at FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY e.id").map((r) => ({ formation: r.formation, inscrit_le: when(r.created_at) }))));
      out.push(section("lecons", "Leçons terminées", [["formation", "Formation"], ["lecon", "Leçon"], ["terminee_le", "Terminée le"]],
        q("SELECT c.title AS formation, l.title AS lecon, p.completed_at FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE p.user_id = ? ORDER BY p.id").map((r) => ({ formation: r.formation, lecon: r.lecon, terminee_le: when(r.completed_at) }))));
      out.push(section("quiz", "Tentatives de quiz", [["quiz", "Quiz"], ["score", "Score (%)"], ["reussi", "Réussi"], ["date", "Date"]],
        q("SELECT q.title AS quiz, a.score_percentage, a.passed, a.created_at FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id WHERE a.user_id = ? ORDER BY a.id").map((r) => ({ quiz: r.quiz || "", score: r.score_percentage, reussi: r.passed ? "oui" : "non", date: when(r.created_at) }))));
      out.push(section("notes", "Notes personnelles de leçon", [["lecon", "Leçon"], ["note", "Note"]],
        q("SELECT l.title AS lecon, n.content FROM lesson_notes n JOIN lessons l ON l.id = n.lesson_id WHERE n.user_id = ? ORDER BY l.id").map((r) => ({ lecon: r.lecon, note: r.content }))));
      out.push(section("favoris", "Formations favorites", [["formation", "Formation"], ["ajoutee_le", "Ajoutée le"]],
        q("SELECT c.title AS formation, f.created_at FROM favorites f JOIN courses c ON c.id = f.course_id WHERE f.user_id = ? ORDER BY f.created_at").map((r) => ({ formation: r.formation, ajoutee_le: when(r.created_at) }))));
      out.push(section("avis", "Avis publiés", [["formation", "Formation"], ["note", "Note (sur 5)"], ["commentaire", "Commentaire"], ["date", "Date"]],
        q("SELECT c.title AS formation, r.rating, r.comment, r.created_at FROM reviews r JOIN courses c ON c.id = r.course_id WHERE r.user_id = ? ORDER BY r.id").map((r) => ({ formation: r.formation, note: r.rating, commentaire: r.comment, date: when(r.created_at) }))));
      out.push(section("certificats", "Certificats", [["code", "Code"], ["formation", "Formation"], ["delivre_le", "Délivré le"], ["revoque", "Révoqué"]],
        q("SELECT code, course_title, issued_at, revoked_at FROM certificates WHERE user_id = ? ORDER BY id").map((r) => ({ code: r.code, formation: r.course_title, delivre_le: when(r.issued_at), revoque: r.revoked_at ? `oui (${when(r.revoked_at)})` : "non" }))));
      return { sections: out };
    },
  },
  {
    id: "commandes", title: "Commandes", category: "Commandes", owner: "Kolakisa — Paiement", order: 30, scope: "principal", orgOnly: true,
    description: "Commandes passées par la personne et formations achetées.", fields: ["date", "montant", "formations achetées et prix"],
    method: "Lecture de orders et order_items pour l'identifiant du compte.", filter: "Commandes dont user_id est celui du compte.",
    limits: "Les données de carte bancaire ne sont jamais détenues par Kolakisa : elles restent chez le prestataire de paiement (voir « Sources externes »).",
    collect(ctx) {
      const id = needUser(ctx); if (!id) return { sections: [] };
      const orders = ctx.db.prepare("SELECT id, total_cents, created_at FROM orders WHERE user_id = ? ORDER BY id").all(id);
      const items = ctx.db.prepare("SELECT i.order_id, c.title, i.price_cents FROM order_items i JOIN courses c ON c.id = i.course_id JOIN orders o ON o.id = i.order_id WHERE o.user_id = ? ORDER BY i.id").all(id);
      return { sections: [
        section("commandes", "Commandes", [["numero", "Commande n°"], ["date", "Date"], ["total", "Total"]], orders.map((o) => ({ numero: o.id, date: when(o.created_at), total: money(o.total_cents) }))),
        section("lignes", "Détail des commandes", [["numero", "Commande n°"], ["formation", "Formation"], ["prix", "Prix"]], items.map((i) => ({ numero: i.order_id, formation: i.title, prix: money(i.price_cents) }))),
      ] };
    },
  },
  {
    id: "support", title: "Assistance, messages et notifications", category: "Échanges", owner: "Kolakisa — Assistance", order: 40, scope: "principal", orgOnly: true,
    description: "Demandes d'assistance et leurs réponses, notifications reçues et messages envoyés par le formulaire de contact avec cette adresse.",
    fields: ["sujets et messages des demandes", "notifications", "nom, adresse, sujet et message du formulaire de contact"],
    method: "Lectures de support_tickets/support_messages et notifications (identifiant du compte) ; contact_messages (adresse e-mail identique).", filter: "Tickets du compte ; messages de contact dont l'adresse est exactement celle de la personne.",
    limits: "Les réponses du personnel sont incluses (elles font partie de l'historique de la personne) sans nom d'auteur.",
    collect(ctx) {
      const out = [];
      const id = needUser(ctx);
      if (id) {
        out.push(section("tickets", "Demandes d'assistance", [["sujet", "Sujet"], ["statut", "Statut"], ["ouverte_le", "Ouverte le"]],
          ctx.db.prepare("SELECT subject, status, created_at FROM support_tickets WHERE user_id = ? ORDER BY id").all(id).map((t) => ({ sujet: t.subject, statut: t.status, ouverte_le: when(t.created_at) }))));
        out.push(section("messages-support", "Messages d'assistance", [["sujet", "Demande"], ["de", "De"], ["message", "Message"], ["date", "Date"]],
          ctx.db.prepare("SELECT t.subject, m.is_staff, m.body, m.created_at FROM support_messages m JOIN support_tickets t ON t.id = m.ticket_id WHERE t.user_id = ? ORDER BY m.id").all(id).map((m) => ({ sujet: m.subject, de: m.is_staff ? "L'équipe" : "Vous", message: m.body, date: when(m.created_at) }))));
        out.push(section("notifications", "Notifications reçues", [["titre", "Titre"], ["texte", "Texte"], ["date", "Date"]],
          ctx.db.prepare("SELECT title, body, created_at FROM notifications WHERE user_id = ? ORDER BY id").all(id).map((n) => ({ titre: n.title, texte: n.body, date: when(n.created_at) }))));
      }
      if (tableExists(ctx.db, "contact_messages")) {
        out.push(section("messages-contact", "Messages envoyés par le formulaire de contact", [["nom", "Nom"], ["sujet", "Sujet"], ["message", "Message"], ["date", "Date"]],
          ctx.db.prepare("SELECT name, subject, message, created_at FROM contact_messages WHERE lower(email) = ? ORDER BY id").all(ctx.subject.email).map((m) => ({ nom: m.name, sujet: m.subject, message: m.message, date: when(m.created_at) }))));
      }
      return { sections: out };
    },
  },
];

module.exports = { collectors };
