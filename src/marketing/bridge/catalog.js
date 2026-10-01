// Catalogue des formations du LMS, en LECTURE SEULE, pour le bloc « formation » des e-mails. Comme le pont d'événements,
// c'est le seul endroit (avec bridge/) où le module marketing lit les tables du LMS. Un LMS absent ou incomplet donne une liste vide.
const { checkCtx } = require("../audience/shared");

// Formations publiées proposées dans l'éditeur (identifiant et titre seulement)
function listCourses(ctx) {
  checkCtx(ctx);
  try {
    return ctx.db.prepare("SELECT id, title FROM courses WHERE published = 1 ORDER BY title COLLATE NOCASE LIMIT 300").all().map((c) => ({ id: c.id, title: c.title }));
  } catch {
    return [];
  }
}

// Une formation publiée, avec de quoi construire l'instantané (titre, sous-titre, prix, adresse de la page et de l'image)
function getCourse(ctx, id) {
  checkCtx(ctx);
  if (!Number.isInteger(id) || id < 1) return null;
  try {
    return ctx.db.prepare("SELECT id, title, slug, subtitle, price_cents, thumbnail_path FROM courses WHERE id = ? AND published = 1").get(id) ?? null;
  } catch {
    return null;
  }
}

module.exports = { listCourses, getCourse };
