// Boutique publique (Programme 20.5) : /boutique, fiche produit, panier, commande, confirmation, compte client.
// Monté pour le site principal ET pour chaque domaine de site : la boutique servie est toujours celle de l'hôte (req.kwSite, résolu par le serveur) — jamais un identifiant de site fourni par le navigateur.
// Module « Commerce » activé pour le site ET boutique ouverte, sinon 404 neutre. Aucune réponse transactionnelle n'est mise en cache.
const express = require("express");
const catalog = require("../shop/catalog");
const store = require("../shop/store");
const cart = require("../shop/cart");
const orders = require("../shop/orders");
const deliverySlots = require("../shop/deliverySlots");
const customers = require("../shop/customers");
const payments = require("../shop/payments");
const notify = require("../shop/notify");
const view = require("../shop/view");
const reviews = require("../shop/reviews");
const personalization = require("../shop/personalization");
const wishlist = require("../shop/wishlist");
const access = require("../shop/access");
const giftLists = require("../shop/giftLists");
const compare = require("../shop/compare");
const seo = require("../shop/seo");
const age = require("../shop/age");
const siteModules = require("../siteModules");
const pagesLib = require("../pages");
const { tokensToCss } = require("../pages/tokens");
const themeRender = require("./themeRender");
const { MarketingError } = require("../errors");
const { createRateLimiter } = require("../../middlewares/security");

const CART_COOKIE = "kola_cart";
const CUSTOMER_COOKIE = "kola_cust";
const WISH_COOKIE = "kola_wish";
const AGE_COOKIE = "kola_age";
const CMP_COOKIE = "kola_cmp";
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
    res.set("Cache-Control", /^\/(panier|commande|compte|liste|invitation)/.test(req.path) || req.method !== "GET" ? "no-store" : "no-cache");
    const token = view.readCookie(req, CUSTOMER_COOKIE);
    req.shopCustomer = token ? customers.fromSession(s, token) : null;
    s.viewerCustomerId = req.shopCustomer ? req.shopCustomer.id : null; // accès membre : le visiteur est celui de la session, jamais une valeur du navigateur
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
  // Âge déclaré par le visiteur dans cette boutique (cookie signé, lié à la boutique) ; 0 = aucune déclaration valide
  const ageOf = (req) => age.confirmedAge(req.shop.s, view.readCookie(req, AGE_COOKIE));
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
    const done = (themeTemplate) => render(req, res, "catalogue", { title, result, category, categories, q, query: req.query, themeTemplate: themeTemplate || null, gates: access.gates(s, result.items.map((p) => p.id)), ratings: reviews.summaries(s, result.items.map((p) => p.id)) });
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

  const wishOf = (req) => wishlist.find(req.shop.s, view.readCookie(req, WISH_COOKIE));
  router.get(`${BASE}/produit/:slug`, (req, res) => {
    const { s, settings } = req.shop;
    const product = catalog.publicProduct(s, req.params.slug);
    if (!product) return res.status(404).render("error", { message: "Ce produit n'existe pas ou n'est plus en vente." });
    const related = catalog.relatedProducts(s, product, 4);
    const sum = settings.reviews_enabled ? reviews.forProduct(s, product.id) : { items: [], count: 0, average: null, distribution: {} };
    const origin = `${req.protocol}://${req.get("host")}`;
    const crumb = seo.productBreadcrumb(product, { origin, base: BASE, shopName: present(req).shop.name });
    const jsonLd = [seo.safeJson(seo.productLd(product, { origin, base: BASE, currency: settings.currency, reviews: sum, shopName: present(req).shop.name })), seo.safeJson(crumb.ld)];
    const wished = new Set(wishlist.productIds(s, wishOf(req)));
    const compared = new Set(compare.products(s, compare.parseCookie(view.readCookie(req, CMP_COOKIE))).map((p) => p.id));
    region(req, res, "product", { category: product.categories[0] ? product.categories[0].name : "", categories: product.categories.map((c) => c.name), scope: { product: view.productScope(product, { base: BASE, currency: settings.currency }) } },
      (themeTemplate) => render(req, res, "produit", { title: product.name, product, related, themeTemplate: themeTemplate || null, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null,
        gate: access.gate(s, product.id), personalization: personalization.get(db, product.id), ageGate: { required: age.requiredForProduct(db, product.id), confirmed: ageOf(req) }, reviews: sum, breadcrumb: crumb.items, jsonLd, wished, compared, ratings: reviews.summaries(s, related.map((p) => p.id)) }));
  });

  // ── Accès membre : code d'invitation et demande d'accès (compte client obligatoire) ──
  const inviteLimiter = createRateLimiter(10, 15 * 60 * 1000);
  const invitePage = (req, res, extra = {}, status = 200) => render(req, res, "invitation", { title: "Accès membre", error: null, info: null, member: req.shopCustomer ? access.memberRow(req.shop.s, req.shopCustomer.id) : null, ...extra }, status);
  router.get(`${BASE}/invitation`, (req, res) => invitePage(req, res));
  router.post(`${BASE}/invitation`, (req, res) => {
    const key = `inv|${req.ip}|${req.shop.s.siteId}|${req.shopCustomer ? req.shopCustomer.id : 0}`;
    if (inviteLimiter.isLimited(key)) return invitePage(req, res, { error: "Trop de tentatives. Réessayez dans quelques minutes." }, 429);
    try {
      const r = access.redeem(req.shop.s, req.shopCustomer ? req.shopCustomer.id : null, req.body.code);
      invitePage(req, res, { info: r.already ? "Vous êtes déjà membre." : "Bienvenue ! Votre accès membre est activé.", member: access.memberRow(req.shop.s, req.shopCustomer.id) });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      inviteLimiter.hit(key);
      invitePage(req, res, { error: error.message }, error.code === "auth" ? 401 : 422);
    }
  });
  router.post(`${BASE}/invitation/demande`, (req, res) => {
    try {
      if (!req.shopCustomer) throw new MarketingError("auth", "Connectez-vous à votre compte pour demander l'accès.");
      access.requestAccess(req.shop.s, req.shopCustomer.id);
      invitePage(req, res, { info: "Votre demande est envoyée. Le vendeur l'examinera.", member: access.memberRow(req.shop.s, req.shopCustomer.id) });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      invitePage(req, res, { error: error.message }, error.code === "auth" ? 401 : 422);
    }
  });

  // ── Souhaits ──
  const safeBack = (b, fallback) => (/^\/boutique\/[A-Za-z0-9\-_/]*$/.test(b || "") ? b : fallback);
  router.get(`${BASE}/souhaits`, (req, res) => {
    const { s } = req.shop;
    const list = wishOf(req);
    const ids = wishlist.productIds(s, list);
    const items = ids.map((id) => catalog.productById(s, id)).filter((p) => p && p.status === "published" && !access.isHidden(s, p.id));
    render(req, res, "souhaits", { title: "Mes souhaits", items, ratings: reviews.summaries(s, ids) });
  });
  const wishAction = (mutate) => (req, res) => {
    try {
      const { s } = req.shop;
      let list = wishOf(req);
      if (!list) { const made = wishlist.create(s, req.shopCustomer ? req.shopCustomer.id : null); view.setCookie(req, res, WISH_COOKIE, made.token, { days: 365 }); list = wishlist.find(s, made.token); }
      if (req.shopCustomer && !list.customer_id) list = wishlist.attachCustomer(s, list, req.shopCustomer.id);
      mutate(s, list, req.body.product_id);
      if (wantsJson(req)) return res.json({ ok: true, count: wishlist.productIds(s, list).length });
      res.redirect(303, safeBack(req.body.retour, `${BASE}/souhaits`));
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      if (wantsJson(req)) return res.status(422).json({ ok: false, message: error.message });
      res.redirect(303, `${safeBack(req.body.retour, BASE)}?erreur=${encodeURIComponent(error.message)}`);
    }
  };
  router.post(`${BASE}/souhaits/ajouter`, wishAction((s, list, pid) => wishlist.add(s, list, pid)));
  router.post(`${BASE}/souhaits/retirer`, wishAction((s, list, pid) => wishlist.remove(s, list, pid)));

  // ── Comparateur (4 produits au maximum, liste dans un cookie propre à la boutique) ──
  const cmpIds = (req) => compare.products(req.shop.s, compare.parseCookie(view.readCookie(req, CMP_COOKIE))).map((p) => p.id);
  const cmpTable = (req) => compare.table(req.shop.s, cmpIds(req), { money: (c) => view.money(c, req.shop.settings.currency) });
  router.get(`${BASE}/comparer`, (req, res) => render(req, res, "comparer", { title: "Comparer des produits", cmp: cmpTable(req), error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null }));
  router.get(`${BASE}/comparer.json`, (req, res) => {
    const t = cmpTable(req);
    res.json({ ok: true, count: t.products.length, max: t.max,
      products: t.products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, url: `${BASE}/produit/${encodeURIComponent(p.slug)}`, image: p.image_url || null })),
      rows: t.rows.map((r) => ({ label: r.label, differs: r.differs, values: r.cells.map((c) => c.text || null) })) });
  });
  const cmpAction = (mutate) => (req, res) => {
    try {
      const ids = mutate(req.shop.s, cmpIds(req), req.body.product_id);
      if (ids.length) view.setCookie(req, res, CMP_COOKIE, compare.toCookie(ids), { days: 30 }); else view.clearCookie(res, CMP_COOKIE);
      if (wantsJson(req)) return res.json({ ok: true, count: ids.length });
      res.redirect(303, safeBack(req.body.retour, `${BASE}/comparer`));
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      if (wantsJson(req)) return res.status(422).json({ ok: false, message: error.message });
      res.redirect(303, `${safeBack(req.body.retour, `${BASE}/comparer`)}?erreur=${encodeURIComponent(error.message)}`);
    }
  };
  router.post(`${BASE}/comparer/ajouter`, cmpAction((s, ids, pid) => compare.add(s, ids, pid)));
  router.post(`${BASE}/comparer/retirer`, cmpAction((s, ids, pid) => compare.remove(ids, pid)));
  router.post(`${BASE}/comparer/vider`, cmpAction(() => []));

  // ── Avis (acheteurs vérifiés uniquement : jeton de la commande ou compte du client) ──
  const reviewContext = (req, res) => {
    const { s } = req.shop;
    const order = orders.orderByNumber(s, req.params.number);
    const allowed = order && (view.orderTokenOk(order, req.query.k) || (req.shopCustomer && order.customer_id === req.shopCustomer.id));
    if (!allowed) { res.status(404).render("error", { message: "Commande introuvable." }); return null; }
    const product = catalog.productById(s, req.params.pid);
    if (!product) { res.status(404).render("error", { message: "Ce produit n'existe plus." }); return null; }
    return { order, product, key: view.orderToken(order) };
  };
  router.get(`${BASE}/avis/:number/:pid(\\d+)`, (req, res) => {
    const c = reviewContext(req, res); if (!c) return;
    let error = null;
    try { reviews.eligibleOrder(req.shop.s, c.order, c.product.id); if (!req.shop.settings.reviews_enabled) error = "Les avis sont désactivés sur cette boutique."; } catch (e) { if (!(e instanceof MarketingError)) throw e; error = e.message; }
    render(req, res, "avis", { title: "Donner mon avis", ...c, error, values: {}, done: null }, error ? 403 : 200);
  });
  router.post(`${BASE}/avis/:number/:pid(\\d+)`, (req, res) => {
    const c = reviewContext(req, res); if (!c) return;
    try {
      const r = reviews.submit(req.shop.s, req.shop.settings, c.order, c.product.id, req.body || {});
      render(req, res, "avis", { title: "Merci pour votre avis", ...c, error: null, values: {}, done: r.status });
    } catch (e) {
      if (!(e instanceof MarketingError)) throw e;
      render(req, res, "avis", { title: "Donner mon avis", ...c, error: e.message, values: req.body || {}, done: null }, e.code === "conflict" ? 409 : 422);
    }
  });

  // ── Contrôle d'âge : déclaration de majorité (cookie signé propre à la boutique) ──
  const ageContext = (req, res, source) => {
    const product = catalog.productById(req.shop.s, Number(source.p) || 0);
    const need = product && product.status === "published" ? age.requiredForProduct(db, product.id) : 0;
    if (!product || !need) { res.status(404).render("error", { message: "Ce produit n'est pas soumis à un contrôle d'âge." }); return null; }
    return { product, need, retour: safeBack(source.retour, `${BASE}/produit/${encodeURIComponent(product.slug)}`) };
  };
  router.get(`${BASE}/age`, (req, res) => {
    const c = ageContext(req, res, req.query); if (!c) return;
    render(req, res, "age", { title: "Produit réservé aux adultes", ...c, refused: false, already: ageOf(req) >= c.need });
  });
  router.post(`${BASE}/age`, (req, res) => {
    const c = ageContext(req, res, req.body || {}); if (!c) return;
    if (req.body.choix !== "oui") return render(req, res, "age", { title: "Produit réservé aux adultes", ...c, refused: true, already: false });
    view.setCookie(req, res, AGE_COOKIE, age.makeCookie(req.shop.s, Math.max(c.need, ageOf(req))), { days: age.COOKIE_DAYS });
    res.redirect(303, c.retour);
  });

  // ── Listes de naissance / de cadeaux ──
  // Le lien public (jeton long) montre la liste ; la gestion exige le secret de gestion (?m=…) ou le compte du client propriétaire. Aucune adresse n'est jamais affichée.
  const giftHeaders = (res) => { res.set("Referrer-Policy", "no-referrer"); res.set("X-Robots-Tag", "noindex, nofollow"); };
  const giftOr404 = (req, res) => {
    const list = giftLists.findByToken(req.shop.s, req.params.token);
    if (!list) { res.status(404).render("error", { message: "Cette liste n'existe pas ou n'est plus partagée." }); return null; }
    return list;
  };
  const giftManager = (req, res) => {
    const list = giftOr404(req, res); if (!list) return null;
    const raw = String((req.body && req.body.m) || req.query.m || "");
    const m = /^[0-9a-f]{48}$/.test(raw) ? raw : "";
    if (!giftLists.canManage(list, { manageToken: m, customer: req.shopCustomer })) { res.status(403).render("error", { message: "Le lien de gestion de cette liste est invalide." }); return null; }
    return { list, m };
  };
  const giftManageUrl = (list, m) => `${BASE}/liste/${list.public_token}/gerer${m ? `?m=${m}` : ""}`;
  const giftListPage = (req, res, extra = {}, status = 200) => {
    giftHeaders(res);
    const mine = req.shopCustomer ? giftLists.listsOfCustomer(req.shop.s, req.shopCustomer.id) : [];
    render(req, res, "listes", { title: "Listes de naissance et de cadeaux", mine, error: null, values: {}, ...extra }, status);
  };
  router.get(`${BASE}/listes`, (req, res) => giftListPage(req, res));
  router.post(`${BASE}/listes`, (req, res) => {
    try {
      const made = giftLists.create(req.shop.s, req.body || {}, req.shopCustomer);
      const list = giftLists.findByToken(req.shop.s, made.publicToken);
      const origin = `${req.protocol}://${req.get("host")}`;
      if (list.owner_email) {
        require("../../utils/outbox").queueMail(db, { kind: "shop_gift_list", to: list.owner_email, subject: `Votre liste « ${list.title} »`, sensitive: true,
          text: `Votre liste est créée.\n\nLien à partager avec vos proches :\n${origin}${BASE}/liste/${made.publicToken}\n\nLien privé pour la gérer (ne le partagez pas) :\n${origin}${giftManageUrl(list, made.manageToken)}` });
      }
      giftHeaders(res);
      res.redirect(303, `${giftManageUrl(list, made.manageToken)}${req.shopCustomer ? "" : "&nouvelle=1"}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      giftListPage(req, res, { error: error.message, values: req.body || {} }, 422);
    }
  });
  router.get(`${BASE}/liste/:token([0-9a-f]{40})`, (req, res) => {
    const list = giftOr404(req, res); if (!list) return;
    giftHeaders(res);
    const items = giftLists.itemsView(req.shop.s, list);
    render(req, res, "liste", { title: list.title, list, items, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null, canDeliver: Boolean(list.allow_recipient_delivery && list.recipient_address) });
  });
  router.post(`${BASE}/liste/:token([0-9a-f]{40})/offrir`, (req, res) => {
    const list = giftOr404(req, res); if (!list) return;
    const back = `${BASE}/liste/${list.public_token}`;
    try {
      const k = myCart(req, res, { create: true });
      giftLists.offer(req.shop.s, list, k, { itemId: req.body.item_id, quantity: req.body.quantity || 1, fromName: req.body.from_name, note: req.body.note });
      res.redirect(303, `${BASE}/panier`);
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      res.redirect(303, `${back}?erreur=${encodeURIComponent(error.message)}`);
    }
  });
  const giftManagePage = (req, res, g, extra = {}, status = 200) => {
    giftHeaders(res);
    const { s } = req.shop;
    const choices = [];
    for (const row of db.prepare(`SELECT id FROM mk_shop_products WHERE organization_id = ? AND ${s.siteId == null ? "site_id IS NULL" : "site_id = ?"} AND status = 'published' AND deleted_at IS NULL ORDER BY name LIMIT 200`).all(s.organizationId, ...(s.siteId == null ? [] : [s.siteId]))) {
      const p = catalog.productById(s, row.id);
      if (!p || personalization.get(db, p.id)) continue;
      if (p.type === "variable") p.variants.forEach((v) => choices.push({ value: `${p.id}:${v.id}`, label: `${p.name} — ${Object.values(v.options).join(" / ")}` }));
      else choices.push({ value: `${p.id}:`, label: p.name });
    }
    const origin = `${req.protocol}://${req.get("host")}`;
    render(req, res, "liste-gerer", { title: `Gérer : ${g.list.title}`, list: g.list, m: g.m, items: giftLists.itemsView(s, g.list), gifts: giftLists.contributions(s, g.list), choices,
      address: g.list.recipient_address ? JSON.parse(g.list.recipient_address) : {}, shareUrl: `${origin}${BASE}/liste/${g.list.public_token}`, fresh: req.query.nouvelle === "1", info: req.query.ok ? "Modifications enregistrées." : null, error: null, ...extra }, status);
  };
  router.get(`${BASE}/liste/:token([0-9a-f]{40})/gerer`, (req, res) => { const g = giftManager(req, res); if (g) giftManagePage(req, res, g); });
  const giftManageAction = (apply) => (req, res) => {
    const g = giftManager(req, res); if (!g) return;
    try {
      apply(req.shop.s, g.list, req.body || {});
      giftHeaders(res);
      res.redirect(303, `${giftManageUrl(g.list, g.m)}${g.m ? "&" : "?"}ok=1`);
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      giftManagePage(req, res, { list: giftLists.findByToken(req.shop.s, g.list.public_token), m: g.m }, { error: error.message }, 422);
    }
  };
  router.post(`${BASE}/liste/:token([0-9a-f]{40})/gerer/details`, giftManageAction((s, list, b) => giftLists.update(s, list, b)));
  router.post(`${BASE}/liste/:token([0-9a-f]{40})/gerer/statut`, giftManageAction((s, list, b) => giftLists.setStatus(s, list, b.statut)));
  router.post(`${BASE}/liste/:token([0-9a-f]{40})/gerer/article`, giftManageAction((s, list, b) => {
    const [pid, vid] = String(b.choice || "").split(":");
    giftLists.setItem(s, list, { productId: Number(pid), variantId: vid ? Number(vid) : null, wanted: b.wanted });
  }));
  router.post(`${BASE}/liste/:token([0-9a-f]{40})/gerer/article/:item(\\d+)`, giftManageAction((s, list, b) => {
    const it = giftLists.getItem(s, list, b.item_id);
    if (!it) throw new MarketingError("not_found", "Article introuvable dans la liste.");
    giftLists.setItem(s, list, { productId: it.product_id, variantId: it.variant_id, wanted: b.wanted });
  }));
  router.post(`${BASE}/liste/:token([0-9a-f]{40})/gerer/retirer`, giftManageAction((s, list, b) => giftLists.removeItem(s, list, b.item_id)));

  // ── Panier ──
  router.get(`${BASE}/panier`, (req, res) => {
    const k = myCart(req, res);
    const priced = k ? cart.priceCart(req.shop.s, k, { dest: dest(req), email: req.shopCustomer && req.shopCustomer.email }) : null;
    const gifts = k ? Object.fromEntries(giftLists.cartGiftLines(req.shop.s, k.id).map((g) => [g.cart_item_id, g.title])) : {};
    render(req, res, "panier", { title: "Panier", priced, gifts, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null });
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
      if (error.code === "age_required" && req.body && Number(req.body.product_id) > 0) return res.redirect(303, `${BASE}/age?p=${Number(req.body.product_id)}&retour=${encodeURIComponent(back)}`);
      res.redirect(303, `${back}?erreur=${encodeURIComponent(error.message)}`);
    }
  };
  router.post(`${BASE}/panier/ajouter`, cartAction((req, k) => cart.addItem(req.shop.s, k, { productId: Number(req.body.product_id), variantId: req.body.variant_id ? Number(req.body.variant_id) : null, quantity: req.body.quantity || 1, expectedVersion: req.body.version, customText: req.body.custom_text, ageConfirmed: ageOf(req) }), () => `${BASE}/panier`));
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
    const giftLines = giftLists.cartGiftLines(s, k.id);
    const giftInfo = giftLines.length ? { titles: [...new Set(giftLines.map((g) => g.title))], canDeliver: giftLines.length === priced.lines.length && new Set(giftLines.map((g) => g.list_id)).size === 1 && Boolean(giftLines[0].allow_recipient_delivery && giftLines[0].recipient_address) } : null;
    render(req, res, "commande", { title: "Commande", priced, giftInfo, ageRequired: age.requiredForProducts(db, priced.lines.map((l) => l.productId)), error, values: { email: req.shopCustomer ? req.shopCustomer.email : "", ...values, country }, methods: payments.available(settings).map((m) => ({ key: m, label: payments.PROVIDERS[m].label })), idempotencyKey: require("node:crypto").randomBytes(12).toString("hex"), slots: deliverySlots.forCheckout(s, priced) }, status);
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
    const values = { email: b.email, country: shipping.country, region: shipping.region, shippingMethodId: b.shipping_method, deliverySlot: b.delivery_slot, paymentMethod: b.payment_method, ...Object.fromEntries(Object.entries(b).filter(([key]) => /^(ship|bill)_/.test(key))) };
    try {
      let customerId = req.shopCustomer ? req.shopCustomer.id : null;
      if (!customerId && !settings.guest_checkout) throw new MarketingError("auth", "Connectez-vous ou créez un compte pour commander.");
      const email = req.shopCustomer ? req.shopCustomer.email : b.email;
      // Un moyen de paiement activé mais non configuré (clés absentes) n'est jamais accepté : aucune commande ne doit réserver du stock sans pouvoir être payée
      if (!payments.available(settings).includes(String(b.payment_method || ""))) throw new MarketingError("invalid_field", "Ce moyen de paiement n'est pas disponible pour le moment.");
      const { order, duplicate } = orders.createFromCart(s, k, { email, billing, shipping, shippingMethodId: b.shipping_method, deliverySlot: b.delivery_slot, paymentMethod: b.payment_method, idempotencyKey: b.idempotency_key, expectedTotalCents: b.expected_total, giftDelivery: b.gift_delivery === "recipient" ? "recipient" : "", customerId, ageConfirmed: b.age_confirm === "1" });
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
    render(req, res, "confirmation", { title: `Commande ${order.number}`, slotText: deliverySlots.describe(order), order: orders.orderDetail(req.shop.s, order), reviewable: req.shop.settings.reviews_enabled ? new Set(db.prepare("SELECT product_id FROM mk_shop_order_items WHERE order_id = ? AND product_id IS NOT NULL").all(order.id).map((r) => r.product_id)) : new Set(), key: view.orderToken(order), statusLabels: orders.STATUS_LABELS, instructions: order.payment_method === "manual" ? req.shop.settings.manual_instructions : null, error: req.query.erreur ? String(req.query.erreur).slice(0, 200) : null });
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

  require("./shopRdv").mountPublic({ router, BASE, render, present, wantsJson, limiter: createRateLimiter(20, 15 * 60 * 1000) }); // prise de rendez-vous (migration 137)

  return router;
};
