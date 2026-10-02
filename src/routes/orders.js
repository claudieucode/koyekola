const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { sendPurchaseWelcomeEmail } = require("../utils/mailer");

const router = express.Router();

// Formations du panier qui peuvent réellement être achetées maintenant : publiées et pas déjà possédées.
// (Une formation dépubliée depuis l'ajout au panier, ou achetée entre-temps, en est écartée.)
function getPurchasableItems(req) {
  const ids = Object.keys(req.session.cart || {});
  if (!ids.length) return [];
  return db
    .prepare(
      `SELECT * FROM courses
       WHERE id IN (${ids.map(() => "?").join(",")}) AND published = 1
         AND id NOT IN (SELECT course_id FROM enrollments WHERE user_id = ?)`
    )
    .all(...ids, req.session.user.id);
}

// Le panier ne garde que ce qui reste achetable
function syncCart(req, items) {
  req.session.cart = Object.fromEntries(items.map((c) => [c.id, true]));
}

router.get("/commande", requireAuth, (req, res) => {
  const items = getPurchasableItems(req);
  syncCart(req, items);
  if (!items.length) return res.redirect("/panier");
  const total = items.reduce((sum, c) => sum + c.price_cents, 0);
  res.render("checkout", { items, total });
});

// Paiement simulé : aucune carte n'est réellement débitée. Voir le README pour brancher
// un vrai prestataire de paiement (Stripe, etc.) avant toute mise en production.
router.post("/commande", requireAuth, async (req, res, next) => {
  // Un gestionnaire async doit intercepter ses erreurs lui-même : Express 4 ne le fait pas,
  // et une erreur non interceptée ferait tomber tout le serveur.
  try {
    const items = getPurchasableItems(req);
    syncCart(req, items);
    if (!items.length) return res.redirect("/panier");
    const total = items.reduce((sum, c) => sum + c.price_cents, 0);

    // Tout ou rien : la commande, ses lignes et les inscriptions sont écrites ensemble,
    // ou pas du tout (jamais de commande orpheline si une écriture échoue en cours de route).
    let orderId;
    db.exec("BEGIN");
    try {
      const orderInfo = db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (?, ?)").run(req.session.user.id, total);
      orderId = Number(orderInfo.lastInsertRowid);
      const insertItem = db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, ?)");
      const insertEnrollment = db.prepare("INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)");
      items.forEach((course) => {
        insertItem.run(orderId, course.id, course.price_cents);
        insertEnrollment.run(req.session.user.id, course.id);
      });
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }

    req.session.cart = {};

    // L'e-mail est mis en file APRÈS l'enregistrement : il part en arrière-plan, son échec (ou un serveur SMTP lent)
    // ne peut ni annuler ni ralentir l'achat
    sendPurchaseWelcomeEmail(db, {
      to: req.session.user.email,
      username: req.session.user.username,
      courseTitles: items.map((c) => c.title),
    });

    res.redirect(`/commande/confirmation/${orderId}`);
  } catch (err) {
    next(err);
  }
});

router.get("/commande/confirmation/:id", requireAuth, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").get(req.params.id, req.session.user.id);
  if (!order) return res.status(404).render("error", { message: "Commande introuvable." });
  const items = db
    .prepare(
      `SELECT order_items.*, courses.title, courses.slug FROM order_items
       JOIN courses ON courses.id = order_items.course_id
       WHERE order_id = ?`
    )
    .all(order.id);
  res.render("order-confirmation", { order, items });
});

module.exports = router;
