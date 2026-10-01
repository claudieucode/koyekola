function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect(`/connexion?redirect=${encodeURIComponent(req.originalUrl)}`);
  next();
}

function requireInstructor(req, res, next) {
  if (!req.session.user) return res.redirect(`/connexion?redirect=${encodeURIComponent(req.originalUrl)}`);
  if (req.session.user.role !== "formateur") {
    return res.status(403).render("error", { message: "Réservé au compte créateur." });
  }
  next();
}

module.exports = { requireAuth, requireInstructor };
