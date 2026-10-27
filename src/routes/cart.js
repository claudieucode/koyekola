const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { refererPath } = require("../utils/safeRedirect");
const { applyEffectivePrices } = require("../services/pricing");

const lmsSites = require("../services/lmsSites");

const router = express.Router();

router.post("/panier/ajouter/:id", requireAuth, (req, res) => {
  const courseId = req.params.id;
  const course = db.prepare("SELECT id FROM courses WHERE id = ? AND published = 1").get(courseId);
  // Une formation d'un autre site (ou d'un domaine sans module actif) ne s'ajoute jamais au panier de ce site
  if (course && lmsSites.belongsTo(db, course.id, req.lmsSite)) {
    const alreadyOwned = db
      .prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?")
      .get(req.session.user.id, courseId);
    if (!alreadyOwned) req.session.cart[courseId] = true;
  }
  res.redirect(req.body.buyNow ? "/commande" : refererPath(req, "/catalogue"));
});

router.post("/panier/retirer/:id", requireAuth, (req, res) => {
  delete req.session.cart[req.params.id];
  res.redirect("/panier");
});

router.get("/panier", requireAuth, (req, res) => {
  const sc = lmsSites.scopeSql(req.lmsSite, "courses");
  const ids = Object.keys(req.session.cart);
  const found = ids.length
    ? db
        .prepare(
          `SELECT courses.*, users.username AS instructor_name FROM courses
           JOIN users ON users.id = courses.instructor_id
           WHERE courses.id IN (${ids.map(() => "?").join(",")}) AND ${sc.sql}`
        )
        .all(...ids, ...sc.params)
    : [];
  const items = applyEffectivePrices(found); // price_cents = prix à payer (offre en cours comprise)
  const total = items.reduce((sum, c) => sum + c.price_cents, 0);
  res.render("cart", { items, total });
});

module.exports = router;
