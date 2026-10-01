// Adresses (slugs) : une formation renommée garde ses anciennes adresses, qui redirigent vers la nouvelle
// pour ne perdre ni les liens partagés ni le référencement.
const db = require("../config/database");

// Renvoie l'adresse actuelle de la formation qui a porté ce slug par le passé, ou null
function currentSlugFor(oldSlug) {
  const row = db
    .prepare("SELECT courses.slug FROM course_slug_history JOIN courses ON courses.id = course_slug_history.course_id WHERE course_slug_history.old_slug = ?")
    .get(oldSlug);
  return row ? row.slug : null;
}

// Enregistre le changement d'adresse : l'ancienne adresse et toutes celles déjà mémorisées pointent vers la formation
function recordSlugChange(courseId, oldSlug, newSlug) {
  if (oldSlug === newSlug) return;
  db.prepare("INSERT OR REPLACE INTO course_slug_history (old_slug, course_id) VALUES (?, ?)").run(oldSlug, courseId);
  // Si l'on revient à une adresse déjà utilisée par le passé, elle ne doit plus être une « ancienne » adresse
  db.prepare("DELETE FROM course_slug_history WHERE old_slug = ?").run(newSlug);
}

module.exports = { currentSlugFor, recordSlugChange };
