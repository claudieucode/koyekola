// Abonnements récurrents : pages publiques (/boutique/abonnements) et écrans d'administration. Migration 139.
// Branché par UNE ligne dans shopPublic.js (hérite du garde « module Commerce + boutique ouverte ») et UNE ligne dans shopAdmin.js (hérite des droits et du site vérifié).
// Le site vient toujours de l'hôte vérifié par le serveur ; un abonnement d'une autre boutique est « introuvable ». Les clés Stripe ne quittent jamais le serveur.
const { MarketingError } = require("../errors");
const { flashOk } = require("./kit");
const subs = require("../shop/subscriptions");
const catalog = require("../shop/catalog");
const orders = require("../shop/orders");
const view = require("../shop/view");

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const frDate = (sql) => { if (!sql) return ""; const [y, m, d] = String(sql).slice(0, 10).split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const INFO = { pause: "Votre abonnement est en pause : plus aucun prélèvement tant que vous ne le reprenez pas.", reprise: "Votre abonnement a repris.", formule: "Votre formule est changée. Le nouveau prix s'applique à la prochaine échéance.", resilie: "Votre résiliation est enregistrée. Un e-mail de confirmation vous est envoyé.", deja: "Cet abonnement était déjà résilié." };

function mountPublic({ router, BASE, render, present, limiter }) {
  const PATH = `${BASE}/abonnements`;
  const origin = (req) => `${req.protocol}://${req.get("host")}`;
  const keyOf = (req) => String(req.query.k || (req.body && req.body.k) || "").slice(0, 64);
  const notFound = (res) => res.status(404).render("error", { message: "Cet abonnement est introuvable ou le lien n'est plus valide." });
  // Accès : le compte connecté propriétaire, OU le lien signé reçu par e-mail. Toujours dans la boutique de l'hôte.
  const authorize = (req, res) => {
    const { s } = req.shop;
    const sub = subs.get(s, req.params.id);
    const ok = sub && sub.status !== "incomplete" && ((req.shopCustomer && sub.customer_id === req.shopCustomer.id) || subs.tokenOk(sub, keyOf(req)));
    if (!ok) { notFound(res); return null; }
    return sub;
  };
  const guard = (req, res, next) => (subs.hasAny(req.shop.s) ? next() : res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." }));
  const detail = (req, res, sub, extra = {}, status = 200) => {
    const { s } = req.shop;
    const k = req.shopCustomer && sub.customer_id === req.shopCustomer.id ? "" : keyOf(req);
    const plans = sub.product_id ? subs.listPlans(s, sub.product_id) : [];
    render(req, res, "abonnement", { title: "Mon abonnement", sub, k, kq: k ? `?k=${encodeURIComponent(k)}` : "", plans, statusLabel: subs.statusLabel(sub), cadence: subs.cadence, frDate, history: subs.ordersOf(s, sub.id).map((o) => ({ ...o, key: view.orderToken({ id: o.id, number: o.number, created_at: o.created_at }) })), info: INFO[req.query.ok] || null, error: null, ...extra }, status);
  };

  router.get(PATH, guard, (req, res) => {
    const { s } = req.shop;
    render(req, res, "abonnements", { title: "Mes abonnements", list: req.shopCustomer ? subs.listForCustomer(s, req.shopCustomer.id) : [], statusLabel: subs.statusLabel, cadence: subs.cadence, frDate, sent: req.query.envoye === "1", error: null });
  });
  router.post(`${PATH}/lien`, guard, (req, res) => {
    const { s } = req.shop;
    const key = `sublink|${req.ip}|${s.siteId}`;
    if (limiter.isLimited(key)) return res.status(429).render("error", { message: "Trop de demandes. Réessayez dans quelques minutes." });
    limiter.hit(key);
    const email = String((req.body && req.body.email) || "").trim().toLowerCase().slice(0, 200);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) subs.sendManageLinks(s, email, { origin: origin(req), name: present(req).shop.name });
    res.redirect(303, `${PATH}?envoye=1`); // même réponse que l'adresse soit connue ou non
  });
  router.post(`${PATH}/souscrire`, async (req, res, next) => {
    const { s } = req.shop;
    const b = req.body || {};
    const slug = (() => { try { const p = catalog.productById(s, b.product_id); return p ? p.slug : ""; } catch { return ""; } })();
    const back = (msg) => res.redirect(303, `${BASE}/produit/${encodeURIComponent(slug)}?erreur=${encodeURIComponent(msg)}`);
    const key = `subnew|${req.ip}|${s.siteId}`;
    if (limiter.isLimited(key)) return back("Trop de tentatives. Réessayez dans quelques minutes.");
    limiter.hit(key);
    try {
      const r = await subs.startCheckout(s, { productId: b.product_id, planId: b.plan_id, variantId: b.variant_id, email: req.shopCustomer ? req.shopCustomer.email : b.email, customerId: req.shopCustomer ? req.shopCustomer.id : null, origin: origin(req) });
      res.redirect(303, r.url);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      if (!slug) return res.status(404).render("error", { message: error.message });
      back(error.message);
    }
  });
  router.get(`${PATH}/merci`, async (req, res, next) => {
    try {
      const { s } = req.shop;
      let sub = subs.get(s, req.query.s);
      if (!sub || !subs.tokenOk(sub, req.query.k)) return notFound(res);
      sub = await subs.reconcile(s, sub); // jamais confiance à l'adresse de retour : l'état est relu chez Stripe
      render(req, res, "abonnement-merci", { title: "Merci", sub, cadence: subs.cadence, frDate, link: `${PATH}/${sub.id}?k=${encodeURIComponent(String(req.query.k))}` });
    } catch (error) { next(error); }
  });
  router.get(`${PATH}/:id(\\d+)`, (req, res) => { const sub = authorize(req, res); if (sub) detail(req, res, sub); });
  const action = (name, run, okCode) => router.post(`${PATH}/:id(\\d+)/${name}`, async (req, res, next) => {
    const sub = authorize(req, res);
    if (!sub) return;
    const { s } = req.shop;
    const k = req.shopCustomer && sub.customer_id === req.shopCustomer.id ? "" : keyOf(req);
    try {
      const r = await run(s, sub, req);
      res.redirect(303, `${PATH}/${sub.id}?${k ? `k=${encodeURIComponent(k)}&` : ""}ok=${r && r.already ? "deja" : okCode}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      detail(req, res, subs.get(s, sub.id), { error: error.message }, error.code === "payment_unavailable" ? 503 : 422);
    }
  });
  action("pause", (s, sub) => subs.pause(s, sub), "pause");
  action("reprise", (s, sub) => subs.resume(s, sub), "reprise");
  action("formule", (s, sub, req) => subs.changePlan(s, sub, req.body && req.body.plan_id), "formule");
  action("resilier", (s, sub) => subs.cancel(s, sub, { actor: "customer" }), "resilie"); // UNE requête = résiliation : aucune étape dissuasive
}

function mountAdmin({ route, render, audit }) {
  const back = (req) => `${req.shopSpace.base}/boutique/abonnements`;
  route("get", "/abonnements", "shop.read", (req, res, s) => {
    const list = subs.adminList(s, { status: req.query.statut, page: req.query.page });
    render(req, res, "abonnements", "Boutique — abonnements", "boutique/abonnements", { list, statusLabel: subs.statusLabel, STATUS_LABELS: subs.STATUS_LABELS, cadence: subs.cadence, frDate, orderStatus: orders.STATUS_LABELS });
  });
  route("post", "/abonnements/:sid(\\d+)/annuler", "shop.orders", (req, res, s, next) => {
    const sub = subs.get(s, req.params.sid);
    if (!sub) throw new MarketingError("not_found", "Abonnement introuvable.");
    subs.cancel(s, sub, { actor: `user:${req.mk.ctx.userId}`, immediate: true }).then((r) => {
      audit(req, s, "shop_subscription.cancelled", "shop_subscription", sub.id);
      flashOk(req, r.already ? "Cet abonnement était déjà résilié." : "Abonnement arrêté ; le client est prévenu par e-mail.");
      res.redirect(back(req));
    }).catch((error) => {
      if (error instanceof MarketingError) { require("./kit").flashError(req, error.message); return res.redirect(back(req)); }
      next(error);
    });
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/formules", "shop.write", (req, res, s) => {
    const b = req.body;
    const cents = b.price === undefined || String(b.price).trim() === "" ? undefined : Math.round(Number(String(b.price).replace(",", ".")) * 100);
    subs.savePlan(s, req.params.pid, { label: b.label, interval_unit: b.interval_unit, interval_count: b.interval_count, price_cents: Number.isNaN(cents) ? "x" : cents, discount_percent: b.discount_percent });
    audit(req, s, "shop_subscription.plan_added", "shop_product", req.params.pid);
    flashOk(req, "Formule d'abonnement ajoutée.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/formules/:fid(\\d+)/supprimer", "shop.write", (req, res, s) => {
    const plan = subs.getPlan(s, req.params.fid);
    if (!plan || plan.product_id !== Number(req.params.pid)) throw new MarketingError("not_found", "Formule introuvable.");
    subs.removePlan(s, plan.id);
    audit(req, s, "shop_subscription.plan_removed", "shop_product", req.params.pid);
    flashOk(req, "Formule retirée. Les abonnements déjà en cours continuent au prix convenu.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
}

module.exports = { mountPublic, mountAdmin };
