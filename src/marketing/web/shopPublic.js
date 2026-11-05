// Boutique publique (Programme 20.5) : /boutique, fiche produit, panier, commande, confirmation, compte client.
// Monté pour le site principal ET pour chaque domaine de site : la boutique servie est toujours celle de l'hôte (req.kwSite, résolu par le serveur) — jamais un identifiant de site fourni par le navigateur.
// Module « Commerce » activé pour le site ET boutique ouverte, sinon 404 neutre. Aucune réponse transactionnelle n'est mise en cache.
const express = require("express");
const catalog = require("../shop/catalog");
const store = require("../shop/store");
const cart = require("../shop/cart");
const orders = require("../shop/orders");
const customers = require("../shop/customers");
const payments = require("../shop/payments");
const notify = require("../shop/notify");
const view = require("../shop/view");
const siteModules = require("../siteModules");
const pagesLib = require("../pages");
const { tokensToCss } = require("../pages/tokens");
const themeRender = require("./themeRender");
const { MarketingError } = require("../errors");
const { createRateLimiter } = require("../../middlewares/security");

const CART_COOKIE = "kola_cart";
const CUSTOMER_COOKIE = "kola_cust";
const BASE = "/boutique";

module.exports = ({ db }) => {
  const router = express.Router();
  const authLimiter = createRateLimiter(10, 15 * 60 * 1000);
  const resetLimiter = createRateLimiter(5, 60 * 60 * 1000);

  router.use(BASE, (req, res, next) => {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "La boutique est momentanément indisponible." });
    const siteId = req.kwSite && Number.isInteger(req.kwSite.id) ? req.kwSite.id : null;
    const s = { db, organizationId: marketing.organizationId, siteId };
    if (!siteModules.isEnabled(db, s.organizationId, siteId, "commerce")) return res.status(404).render("error", { message: "Cette page n'existe pas ou n'est plus en ligne." });
    const settings = store.getSettings(s);
    if (!settings.enabled) return res.status(404).render("error", { message: "Cette boutique n'est pas ouverte." });
    req.shop = { s, settings, marketing };
    res.set("Cache-Control", /^\/(panier|commande|compte)/.test(req.path) || req.method !== "GET" ? "no-store" : "no-cache");
    const token = view.readCookie(req, CUSTOMER_COOKIE);
    req.shopCustomer = token ? customers.fromSession(s, token) : null;
    // Une page publique ne retarde jamais le catalogue : le nettoyage des commandes périmées est borné (une requête) et fait au passage en caisse
    next();
  });

  const present = (req) => {
    const { s, settings } = req.shop;
    const k = cart.findCart(s, view.readCookie(req, CART_COOKIE));
    const count = k ? db.prepare("SELECT COALESCE(SUM(quantity),0) AS n FROM mk_shop_cart_items WHERE cart_id = ?").get(k.id).n : 0;
    let site = null;
    try { site = s.siteId ? pagesLib.getSite({ db, organizationId: s.organizationId }, s.siteId) : null; } catch { site = null; }
    if (site && site.status !== "active") site = null;
    let siteName = (site && site.name) || (req.kwSite && req.kwSite.name) || "";
    if (!siteName) siteName = "Boutique";
    return { shop: { base: BASE, name: siteName, cartCount: count, customer: req.shopCustomer, currency: settings.currency, settings }, site, tokensToCss, money: (c) => view.money(c, settings.currency), flash: null };
  };
  const render = (req, res, tpl, locals = {}, status = 200) => res.status(status).render(`boutique/${tpl}`, { ...present(req), ...locals });
  const wantsJson = (req) => /json/.test(req.get("accept") || "") || req.get("x-requested-with") === "fetch";
  const myCart = (req, res, { create = false } = {}) => {
    const { s } = req.shop;
    let k = cart.findCart(s, view.readCookie(req, CART_COOKIE));
    if (!k && create) {
      const made = cart.createCart(s, req.shopCustomer ? req.shopCustomer.id : null);
      view.setCookie(req, res, CART_COOKIE, made.token);
      k = cart.findCart(s, made.token);
    }
    return k;
  };
  const dest = (req) => ({ country: String(req.query.pays || req.body && req.body.pays || "").toUpperCase().slice(0, 2) || undefined });

  // Modèle de thème (Theme Builder) pour une famille de la boutique ; null → affichage par défaut. Un modèle d'un autre site ne s'applique jamais.
  const region = (req, res, type, opts, cb) => themeRender.renderRegion(req, res, db, type, { siteId: req.shop.s.siteId, ...opts }, cb);
  const archiveScope = (title, count, extra = {}) => ({ archive: { type: "shop", title, description: "", count, url: BASE, search: "", ...extra } });

  // ── Catalogue ──
  const listing = (req, res, { categorySlug = null, tagName = null } = {}) => {
    const { s } = req.shop;
    const q = {
      q: String(req.query.q || "").slice(0, 80), category: categorySlug || String(req.query.categorie || ""), tag: tagName || String(req.query.etiquette || "").slice(0, 40), minPrice: req.query.min ? Math.round(Number(req.query.min) * 100) : undefined,
      maxPrice: req.query.max ? Math.round(Number(req.query.max) * 100) : undefined, sort: String(req.query.tri || ""), inStock: req.query.stock === "1", onSale: req.query.promo === "1",
      featured: req.query.vedette === "1", page: req.query.page, perPage: 12,
    };
    if ((q.minPrice != null && !(q.minPrice >= 0)) || (q.maxPrice != null && !(q.maxPrice >= 0))) { q.minPrice = undefined; q.maxPrice = undefined; }
    const result = catalog.catalogQuery(s, q);
    const category = q.category ? catalog.categoryBySlug(s, q.category) : null;
    const title = category ? category.name : q.tag ? `Étiquette : ${q.tag}` : q.q ? `Résultats pour « ${q.q} »` : "Boutique";
    const categories = catalog.listCategories(s);
    const done = (themeTemplate) => render(req, res, "catalogue", { title, result, category, categories, q, query: req.query, themeTemplate: themeTemplate || null });
    // Le modèle de thème reçoit TOUS les critères de l'adresse (recherche, étiquette, prix, stock, promotion, tri, page) : sa grille, ses filtres et son compteur lisent le même contexte que cette page.
    const ctxQuery = { categorie: category ? category.slug : "", q: q.q, etiquette: q.tag };
    for (const k of ["min", "max", "stock", "promo", "vedette", "tri", "page"]) if (typeof req.query[k] === "string") ctxQuery[k] = req.query[k].slice(0, 40);
    region(req, res, "product_archive", { category: category ? category.name : "", tag: q.tag, tags: q.tag ? [q.tag] : [], query: ctxQuery, scope: archiveScope(title, result.total, { name: category ? category.name : q.tag || "" }) }, done);
  };
  router.get(BASE, (req, res) => listing(req, res));
  router.get(`${BASE}/recherche`, (req, res) => listing(req, res));
  router.get(`${BASE}/etiquette/:tag`, (req, res) => listing(req, res, { tagName: String(req.params.tag || "").slice(0, 40) }));
  router.get(`${BASE}/categorie/:slug`, (req, res) => {
    if (!catalog.categoryBySlug(req.shop.s, req.params.slug)) return res.status(404).render("error", { message: "Cette catégorie n'existe pas." });
    listing(req, res, { categorySlug: req.params.slug });
  });

  router.get(`${BASE}/produit/:slug`, (req, res) => {
    const { s, settings } = req.shop;
    const product = catalog.publicProduct(s, req.params.slug);
    if (!product) return res.status(404).render("error", { message: "Ce produit n'existe pas ou n'est plus en vente." });
    const related = catalog.relatedProducts(s, product, 4);
    region(req, res, "product", { category: product.categories[0] ? product.categories[0].name : "", categories: product.categories.map((c) => c.name), scope: { product: view.productScope(product, { base: BASE, currency: settings.currency }) } },
      (themeTemplate) => render(req, res, "produit", { title: product.name, product, related, themeTemplate: themeTemplate || null, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null }));
  });

  // ── Panier ──
  router.get(`${BASE}/panier`, (req, res) => {
    const k = myCart(req, res);
    const priced = k ? cart.priceCart(req.shop.s, k, { dest: dest(req), email: req.shopCustomer && req.shopCustomer.email }) : null;
    render(req, res, "panier", { title: "Panier", priced, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null });
  });
  router.get(`${BASE}/panier.json`, (req, res) => {
    const k = myCart(req, res);
    if (!k) return res.json({ count: 0, version: 0 });
    const priced = cart.priceCart(req.shop.s, k, { dest: dest(req) });
    res.json({ count: priced.lines.reduce((a, l) => a + l.quantity, 0), version: k.version, total: priced.totals.total, currency: priced.currency });
  });
  const cartAction = (fn, okTo) => (req, res) => {
    try {
      const k = myCart(req, res, { create: true });
      fn(req, k);
      const fresh = cart.findCart(req.shop.s, view.readCookie(req, CART_COOKIE)) || k;
      if (wantsJson(req)) return res.json({ ok: true, version: fresh.version });
      res.redirect(303, okTo(req));
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      if (wantsJson(req)) return res.status(error.code === "conflict" ? 409 : 422).json({ ok: false, code: error.code, message: error.message });
      const back = req.body && /^\/boutique\/[A-Za-z0-9\-_/]*$/.test(req.body.retour || "") ? req.body.retour : `${BASE}/panier`;
      res.redirect(303, `${back}?erreur=${encodeURIComponent(error.message)}`);
    }
  };
  router.post(`${BASE}/panier/ajouter`, cartAction((req, k) => cart.addItem(req.shop.s, k, { productId: Number(req.body.product_id), variantId: req.body.variant_id ? Number(req.body.variant_id) : null, quantity: req.body.quantity || 1, expectedVersion: req.body.version }), () => `${BASE}/panier`));
  router.post(`${BASE}/panier/ligne/:id(\\d+)`, cartAction((req, k) => cart.setQuantity(req.shop.s, k, Number(req.params.id), req.body.quantity, req.body.version), () => `${BASE}/panier`));
  router.post(`${BASE}/panier/ligne/:id(\\d+)/supprimer`, cartAction((req, k) => cart.removeItem(req.shop.s, k, Number(req.params.id), req.body.version), () => `${BASE}/panier`));
  router.post(`${BASE}/panier/coupon`, cartAction((req, k) => cart.setCoupon(req.shop.s, k, req.body.retirer ? "" : req.body.code), () => `${BASE}/panier`));

  // ── Commande ──
  const checkoutPage = (req, res, { error = null, values = {}, status = 200 } = {}) => {
    const { s, settings } = req.shop;
    const k = myCart(req, res);
    if (!k) return res.redirect(303, `${BASE}/panier`);
    orders.expireStale(s, 60);
    const country = String(values.country || req.query.pays || (req.shopCustomer && "") || settings.default_country || "").toUpperCase().slice(0, 2);
    const priced = cart.priceCart(s, k, { dest: { country, region: values.region }, shippingMethodId: values.shippingMethodId || req.query.livraison || null, email: values.email || (req.shopCustomer && req.shopCustomer.email) });
    if (!priced.lines.length) return res.redirect(303, `${BASE}/panier`);
    render(req, res, "commande", { title: "Commande", priced, error, values: { email: req.shopCustomer ? req.shopCustomer.email : "", ...values, country }, methods: payments.available(settings).map((m) => ({ key: m, label: payments.PROVIDERS[m].label })), idempotencyKey: require("node:crypto").randomBytes(12).toString("hex") }, status);
  };
  router.get(`${BASE}/commande`, (req, res) => checkoutPage(req, res));

  router.post(`${BASE}/commande`, async (req, res, next) => {
    const { s, settings } = req.shop;
    const k = myCart(req, res);
    if (!k) return res.redirect(303, `${BASE}/panier`);
    const b = req.body || {};
    const addr = (p) => ({ name: b[`${p}_name`], line1: b[`${p}_line1`], line2: b[`${p}_line2`], postal_code: b[`${p}_postal_code`], city: b[`${p}_city`], region: b[`${p}_region`], country: b[`${p}_country`], phone: b[`${p}_phone`] });
    const shipping = addr("ship");
    const billing = b.same_billing ? { ...shipping } : addr("bill");
    const values = { email: b.email, country: shipping.country, region: shipping.region, shippingMethodId: b.shipping_method, paymentMethod: b.payment_method, ...Object.fromEntries(Object.entries(b).filter(([key]) => /^(ship|bill)_/.test(key))) };
    try {
      let customerId = req.shopCustomer ? req.shopCustomer.id : null;
      if (!customerId && !settings.guest_checkout) throw new MarketingError("auth", "Connectez-vous ou créez un compte pour commander.");
      const email = req.shopCustomer ? req.shopCustomer.email : b.email;
      // Un moyen de paiement activé mais non configuré (clés absentes) n'est jamais accepté : aucune commande ne doit réserver du stock sans pouvoir être payée
      if (!payments.available(settings).includes(String(b.payment_method || ""))) throw new MarketingError("invalid_field", "Ce moyen de paiement n'est pas disponible pour le moment.");
      const { order, duplicate } = orders.createFromCart(s, k, { email, billing, shipping, shippingMethodId: b.shipping_method, paymentMethod: b.payment_method, idempotencyKey: b.idempotency_key, expectedTotalCents: b.expected_total, customerId });
      if (!customerId) { customerId = customers.ensureGuest(s, order.email, shipping.name); db.prepare("UPDATE mk_shop_orders SET customer_id = ? WHERE id = ? AND customer_id IS NULL").run(customerId, order.id); }
      const key = view.orderToken(order);
      const confirmation = `${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${key}`;
      if (duplicate) return res.redirect(303, confirmation); // double soumission : même commande, aucun second paiement lancé
      notify.onOrderEvent(s, order, "order_created", settings);
      let started;
      try {
        const origin = `${req.protocol}://${req.get("host")}`;
        started = await payments.start(s, order, { settings, successUrl: `${origin}${BASE}/commande/retour/${encodeURIComponent(order.number)}?k=${key}`, cancelUrl: `${origin}${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${key}` });
      } catch (error) {
        if (!(error instanceof MarketingError)) throw error;
        notify.notify(s, orders.getOrder(s, order.id), "payment_failed");
        return res.redirect(303, `${confirmation}&erreur=${encodeURIComponent(error.message)}`);
      }
      if (started.kind === "paid") notify.notify(s, orders.getOrder(s, order.id), "order_paid");
      if (started.kind === "redirect") return res.redirect(303, started.url);
      res.redirect(303, confirmation);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      checkoutPage(req, res, { error: error.message, values, status: error.code === "price_changed" || error.code === "stock" ? 409 : 422 });
    }
  });

  const loadOrderFor = (req, res) => {
    const { s } = req.shop;
    const order = orders.orderByNumber(s, req.params.number);
    const allowed = order && (view.orderTokenOk(order, req.query.k) || (req.shopCustomer && order.customer_id === req.shopCustomer.id));
    if (!allowed) { res.status(404).render("error", { message: "Commande introuvable." }); return null; }
    return order;
  };
  // Retour du fournisseur : une page de succès ne prouve rien — l'état est relu auprès du fournisseur avant d'afficher quoi que ce soit
  router.get(`${BASE}/commande/retour/:number`, async (req, res, next) => {
    try {
      const order = loadOrderFor(req, res);
      if (!order) return;
      const before = order.payment_status;
      const after = await payments.reconcile(req.shop.s, order);
      if (before !== "paid" && after.payment_status === "paid") notify.notify(req.shop.s, after, "order_paid");
      res.redirect(303, `${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${view.orderToken(order)}`);
    } catch (error) { next(error); }
  });
  router.get(`${BASE}/commande/confirmation/:number`, (req, res) => {
    const order = loadOrderFor(req, res);
    if (!order) return;
    render(req, res, "confirmation", { title: `Commande ${order.number}`, order: orders.orderDetail(req.shop.s, order), key: view.orderToken(order), statusLabels: orders.STATUS_LABELS, instructions: order.payment_method === "manual" ? req.shop.settings.manual_instructions : null, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null });
  });
  // Nouvelle tentative de paiement d'une commande en attente (carte)
  router.post(`${BASE}/commande/:number/payer`, async (req, res, next) => {
    try {
      const order = loadOrderFor(req, res);
      if (!order) return;
      const { s, settings } = req.shop;
      const key = view.orderToken(order);
      if (order.status !== "pending" || order.payment_status === "paid") return res.redirect(303, `${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${key}`);
      try {
        const origin = `${req.protocol}://${req.get("host")}`;
        const started = await payments.start(s, order, { settings, successUrl: `${origin}${BASE}/commande/retour/${encodeURIComponent(order.number)}?k=${key}`, cancelUrl: `${origin}${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${key}` });
        if (started.kind === "redirect") return res.redirect(303, started.url);
      } catch (error) {
        if (!(error instanceof MarketingError)) throw error;
        return res.redirect(303, `${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${key}&erreur=${encodeURIComponent(error.message)}`);
      }
      res.redirect(303, `${BASE}/commande/confirmation/${encodeURIComponent(order.number)}?k=${key}`);
    } catch (error) { next(error); }
  });

  // ── Compte client ──
  const loginPage = (req, res, extra = {}, status = 200) => render(req, res, "compte-connexion", { title: "Mon compte", error: null, info: null, values: {}, ...extra }, status);
  router.get(`${BASE}/compte`, (req, res) => {
    if (!req.shopCustomer) return loginPage(req, res);
    const list = orders.listOrders(req.shop.s, { customerId: req.shopCustomer.id, perPage: 50 });
    render(req, res, "compte", { title: "Mon compte", customerOrders: list.items.map((o) => ({ ...o, key: view.orderToken(o) })), statusLabels: orders.STATUS_LABELS, info: req.query.ok ? "Modifications enregistrées." : null });
  });
  router.post(`${BASE}/compte/connexion`, (req, res) => {
    const key = `${req.ip}|${req.shop.s.siteId}|${String(req.body.email || "").toLowerCase()}`;
    if (authLimiter.isLimited(key)) return loginPage(req, res, { error: "Trop de tentatives. Réessayez dans quelques minutes.", values: { email: req.body.email } }, 429);
    try {
      const { token, customerId } = customers.login(req.shop.s, req.body.email, req.body.password);
      view.setCookie(req, res, CUSTOMER_COOKIE, token);
      const k = myCart(req, res);
      if (k && !k.customer_id) db.prepare("UPDATE mk_shop_carts SET customer_id = ? WHERE id = ?").run(customerId, k.id); // le panier du visiteur suit le client connecté
      res.redirect(303, `${BASE}/compte`);
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      authLimiter.hit(key);
      loginPage(req, res, { error: error.message, values: { email: req.body.email } }, 401);
    }
  });
  router.post(`${BASE}/compte/inscription`, (req, res) => {
    const key = `reg|${req.ip}|${req.shop.s.siteId}`;
    if (authLimiter.isLimited(key)) return loginPage(req, res, { error: "Trop de tentatives. Réessayez plus tard." }, 429);
    authLimiter.hit(key);
    try {
      customers.register(req.shop.s, { email: req.body.email, password: req.body.password, name: req.body.name });
      const { token } = customers.login(req.shop.s, req.body.email, req.body.password);
      view.setCookie(req, res, CUSTOMER_COOKIE, token);
      res.redirect(303, `${BASE}/compte`);
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      loginPage(req, res, { error: error.message, values: { email: req.body.email, name: req.body.name } }, 422);
    }
  });
  router.post(`${BASE}/compte/deconnexion`, (req, res) => {
    customers.logout(req.shop.s, view.readCookie(req, CUSTOMER_COOKIE));
    view.clearCookie(res, CUSTOMER_COOKIE);
    res.redirect(303, BASE);
  });
  router.post(`${BASE}/compte/mot-de-passe-oublie`, (req, res) => {
    const key = `reset|${req.ip}|${req.shop.s.siteId}`;
    if (!resetLimiter.isLimited(key)) {
      resetLimiter.hit(key);
      const r = customers.requestReset(req.shop.s, req.body.email);
      if (r) {
        const origin = `${req.protocol}://${req.get("host")}`;
        require("../../utils/outbox").queueMail(db, { kind: "shop_reset", to: r.customer.email, subject: "Réinitialisation de votre mot de passe", text: `Pour choisir un nouveau mot de passe, ouvrez ce lien (valable une heure) :\n${origin}${BASE}/compte/reinitialiser?t=${r.token}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`, sensitive: true });
      }
    }
    // Réponse identique que le compte existe ou non
    loginPage(req, res, { info: "Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d'être envoyé." });
  });
  router.get(`${BASE}/compte/reinitialiser`, (req, res) => render(req, res, "compte-reinitialiser", { title: "Nouveau mot de passe", token: String(req.query.t || "").slice(0, 64), error: null }));
  router.post(`${BASE}/compte/reinitialiser`, (req, res) => {
    try {
      customers.resetPassword(req.shop.s, String(req.body.t || ""), req.body.password);
      loginPage(req, res, { info: "Mot de passe modifié. Vous pouvez vous connecter." });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      render(req, res, "compte-reinitialiser", { title: "Nouveau mot de passe", token: String(req.body.t || "").slice(0, 64), error: error.message }, 422);
    }
  });
  router.post(`${BASE}/compte/profil`, (req, res) => {
    if (!req.shopCustomer) return res.redirect(303, `${BASE}/compte`);
    customers.updateProfile(req.shop.s, req.shopCustomer.id, { name: req.body.name, phone: req.body.phone });
    res.redirect(303, `${BASE}/compte?ok=1`);
  });

  return router;
};
