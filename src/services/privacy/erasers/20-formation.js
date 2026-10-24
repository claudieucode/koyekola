// Notes, avis, favoris, préférences et reprise de lecture d'un élève ; l'historique d'achat et de progression est conservé (justificatifs).
const { count } = require("./_kit");
const TABLES = [
  ["lesson_notes", "Notes de leçon"], ["reviews", "Avis sur les formations"], ["favorites", "Favoris"], ["user_prefs", "Préférences d'interface"], ["lesson_state", "Position de lecture"],
];
const userOf = (env, s) => env.db.prepare("SELECT id, role FROM users WHERE deleted_at IS NULL AND (id = ? OR lower(email) = ?) ORDER BY id = ? DESC LIMIT 1").get(s.userId ?? -1, s.email || "", s.userId ?? -1) || null;
const kept = (env, id) => [
  ["Commandes et lignes de commande", count(env.db, "SELECT COUNT(*) n FROM orders WHERE user_id = ?", id), "Pièces comptables : à conserver pour les obligations légales et comptables."],
  ["Inscriptions, progression et résultats de quiz", count(env.db, "SELECT (SELECT COUNT(*) FROM enrollments WHERE user_id = ?) + (SELECT COUNT(*) FROM lesson_progress WHERE user_id = ?) + (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = ?) n", id, id, id), "Historique pédagogique lié au compte conservé (accès aux formations, certificats) ; il disparaît avec la suppression du compte, demandée par la personne."],
  ["Certificats délivrés", count(env.db, "SELECT COUNT(*) n FROM certificates WHERE user_id = ?", id), "Justificatifs délivrés, vérifiables publiquement par leur numéro."],
].filter(([, n]) => n > 0).map(([label, n, reason]) => ({ label, count: n, reason }));

module.exports = {
  id: "learning", order: 20, scope: "main",
  title: "Formations : données personnelles",
  description: "Notes de leçon, avis, favoris, préférences et position de lecture de l'élève.",
  categories: ["Notes", "Avis", "Favoris", "Préférences"],
  preview(env, s) {
    const u = userOf(env, s);
    if (!u) return { erase: 0, anonymize: 0, retained: [], manual: [] };
    return { erase: TABLES.reduce((n, [t]) => n + count(env.db, `SELECT COUNT(*) n FROM ${t} WHERE user_id = ?`, u.id), 0), anonymize: 0, retained: kept(env, u.id), manual: [] };
  },
  // Une table par lot : progression réelle (curseur = position dans la liste) et reprise possible entre deux lots
  run(env, s, state) {
    const u = userOf(env, s);
    if (!u) return { done: true, erased: 0, anonymized: 0 };
    const i = Number(state.cursor) || 0;
    const [table] = TABLES[i];
    const erased = Number(env.db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(u.id).changes) || 0;
    const done = i + 1 >= TABLES.length;
    return { done, cursor: String(i + 1), erased, anonymized: 0, outcome: done ? { retained: kept(env, u.id) } : undefined };
  },
};
