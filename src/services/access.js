// Règles d'accès aux formations et aux leçons : UN SEUL endroit, utilisé par la page de lecture
// et par la livraison des vidéos/ressources. Ne jamais dupliquer ces règles ailleurs.
const db = require("../config/database");

function isEnrolled(user, courseId) {
  return Boolean(user) && Boolean(db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, courseId));
}

// course : ligne de la table courses ; lesson : ligne de la table lessons (ou null)
//  - hidden      : l'existence même de la formation doit être cachée (brouillon sans droits) → 404
//  - canView     : le contenu de cette leçon est accessible
//  - fullAccess  : accès à toute la formation (propriétaire ou étudiant inscrit)
function lessonAccess(user, course, lesson) {
  const isOwner = Boolean(user) && course.instructor_id === user.id;
  const enrolled = isEnrolled(user, course.id);
  const fullAccess = isOwner || enrolled;
  // Un brouillon n'est visible que par son auteur et par ceux qui l'ont déjà acheté
  const hidden = !course.published && !fullAccess;
  const canView = fullAccess || Boolean(course.published && lesson && lesson.is_preview);
  return { isOwner, enrolled, fullAccess, hidden, canView };
}

module.exports = { isEnrolled, lessonAccess };
