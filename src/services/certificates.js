// Certificats de réussite : délivrés UNE fois par élève et par formation, quand le parcours est réellement terminé
// (vérifié par la route : toutes les leçons faites, quiz réussis compris). Le code public est aléatoire (32^12 possibilités,
// sans caractères ambigus) : impossible à deviner, la page de vérification ne permet donc pas de parcourir les certificats.
const crypto = require("node:crypto");
const db = require("../config/database");

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // ni 0/O, ni 1/I/L
const PREFIX = "KLK";

function newCode() {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
  return `${PREFIX}-${part()}-${part()}-${part()}`;
}

// Saisie tolérante (minuscules, espaces, tirets absents) → code canonique « KLK-XXXX-XXXX-XXXX », ou null si impossible
function normalizeCode(input) {
  const raw = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = raw.startsWith(PREFIX) ? raw.slice(PREFIX.length) : raw;
  if (body.length !== 12 || [...body].some((c) => !ALPHABET.includes(c))) return null;
  return `${PREFIX}-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8)}`;
}

const byUserCourse = (userId, courseId) => db.prepare("SELECT * FROM certificates WHERE user_id = ? AND course_id = ?").get(userId, courseId) || null;

// Délivre le certificat (ou renvoie celui déjà délivré : jamais de doublon). `course` doit contenir id, title, instructor_id, instructor_name.
// → { certificate, created }
function issue({ userId, userName, course, completedAt }) {
  const existing = byUserCourse(userId, course.id);
  if (existing) return { certificate: existing, created: false };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      db.prepare("INSERT INTO certificates (code, user_id, course_id, instructor_id, student_name, course_title, instructor_name, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(newCode(), userId, course.id, course.instructor_id, userName, course.title, course.instructor_name || "", completedAt || null);
      return { certificate: byUserCourse(userId, course.id), created: true };
    } catch (error) {
      // Code déjà pris (quasi impossible) → nouveau tirage ; certificat créé entre-temps par une requête simultanée → on le renvoie
      const again = byUserCourse(userId, course.id);
      if (again) return { certificate: again, created: false };
      if (!/UNIQUE/i.test(String(error.message))) throw error;
    }
  }
  throw new Error("Impossible de générer un code de certificat unique.");
}

const findByCode = (code) => { const c = normalizeCode(code); return c ? db.prepare("SELECT * FROM certificates WHERE code = ?").get(c) || null : null; };
const listForUser = (userId) => db.prepare("SELECT c.*, co.slug AS course_slug FROM certificates c LEFT JOIN courses co ON co.id = c.course_id WHERE c.user_id = ? ORDER BY c.issued_at DESC, c.id DESC").all(userId);
// Certificats d'un élève pour les formations d'UN formateur (jamais ceux des autres formateurs)
const listForStudent = (instructorId, userId) => db.prepare("SELECT * FROM certificates WHERE user_id = ? AND instructor_id = ? ORDER BY issued_at DESC, id DESC").all(userId, instructorId);

function revoke(instructorId, id, reason = "") {
  return db.prepare("UPDATE certificates SET revoked_at = datetime('now'), revoked_reason = ? WHERE id = ? AND instructor_id = ? AND revoked_at IS NULL")
    .run(String(reason || "").trim().slice(0, 200) || null, id, instructorId).changes === 1;
}
function restore(instructorId, id) {
  return db.prepare("UPDATE certificates SET revoked_at = NULL, revoked_reason = NULL WHERE id = ? AND instructor_id = ? AND revoked_at IS NOT NULL").run(id, instructorId).changes === 1;
}

module.exports = { newCode, normalizeCode, issue, findByCode, listForUser, listForStudent, revoke, restore, byUserCourse };
