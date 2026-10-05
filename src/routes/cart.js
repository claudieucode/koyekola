const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { refererPath } = require("../utils/safeRedirect");
const { applyEffectivePrices } = require("../services/pricing");

const router = express.Router();

router.post("/panier/ajouter/:id", requireAuth, (req, res) => {
  const courseId = req.params.id;
  const course = db.prepare("SELECT id FROM courses WHERE id = ? AND published = 1").get(courseId);
  if (course) {
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
  const ids = Object.keys(req.session.cart);
  const found = ids.length
    ? db
        .prepare(
          `SELECT courses.*, users.username AS instructor_name FROM courses
           JOIN users ON users.id = courses.instructor_id
           WHERE courses.id IN (${ids.map(() => "?").join(",")})`
        )
        .all(...ids)
    : [];
  const items = applyEffectivePrices(found); // price_cents = prix à payer (offre en cours comprise)
  const total = items.reduce((sum, c) => sum + c.price_cents, 0);
  res.render("cart", { items, total });
});

module.exports = router;
