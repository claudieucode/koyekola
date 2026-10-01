// Favoris : l'élève met de côté les formations qui l'intéressent (liste dans son espace personnel).
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { refererPath } = require("../utils/safeRedirect");

const router = express.Router();

// Bascule : ajoute la formation aux favoris, ou l'en retire si elle y est déjà.
// Seule une formation publiée peut être ajoutée (retirer reste toujours possible).
router.post("/favoris/:courseId", requireAuth, (req, res) => {
  const courseId = Number(req.params.courseId);
  const userId = req.session.user.id;
  const existing = Number.isInteger(courseId) && db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND course_id = ?").get(userId, courseId);

  if (existing) {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND course_id = ?").run(userId, courseId);
  } else {
    const course = Number.isInteger(courseId) && db.prepare("SELECT id FROM courses WHERE id = ? AND published = 1 AND archived = 0").get(courseId);
    if (!course) return res.status(404).render("error", { message: "Formation introuvable." });
    db.prepare("INSERT INTO favorites (user_id, course_id) VALUES (?, ?)").run(userId, courseId);
  }
  res.redirect(refererPath(req, "/mes-cours"));
});

module.exports = router;
