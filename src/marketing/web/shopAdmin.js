// Administration de la boutique d'UN site (Programme 20.5) : produits, variantes, stocks, catégories, commandes, clients, livraison, taxes, coupons, paiements.
// Le site vient UNIQUEMENT de l'adresse vérifiée par le serveur (res.locals.siteSpace / req.mk.site) : aucun « site » reçu du navigateur n'est lu.
// Droits réels : shop.read (voir), shop.write (produits, réglages), shop.orders (traiter les commandes), shop.payments (confirmer un paiement manuel, rembourser, moyens de paiement).
const express = require("express");
const { need, flashError, flashOk } = require("./kit");
const { MarketingError } = require("../errors");
const { recordAudit } = require("../audit");
const catalog = require("../shop/catalog");
const store = require("../shop/store");
const orders = require("../shop/orders");
const customers = require("../shop/customers");
const payments = require("../shop/payments");
const notify = require("../shop/notify");
const view = require("../shop/view");
const siteModules = require("../siteModules");
const reviews = require("../shop/reviews");
const access = require("../shop/access");
const personalization = require("../shop/personalization");
const giftLists = require("../shop/giftLists");
const deliverySlots = require("../shop/deliverySlots");
const age = require("../shop/age");
const compare = require("../shop/compare");

const PAGE = 25;
module.exports = () => {
  const router = express.Router({ mergeParams: true });
  const PREFIXES = ["/site-web/sites/:id(\\d+)", "/site-web/principal", "/site-web"]; // site, espace du principal, adresse historique du principal (menu CMS)

  // Portée commerciale de la requête : site de l'adresse (vérifié) ou principal (équipe seulement) — sinon refus, jamais de repli
  function scopeOf(req, res) {
    const space = res.locals.siteSpace || (req.path.startsWith("/site-web/boutique") ? res.locals.principalFrame : null);
    const ok = space && (space.principal ? req.mk.siteId === null : Number.isInteger(space.siteId) && req.mk.site && req.mk.site.id === space.siteId);
    if (!ok) {
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      res.status(reason === "forbidden" ? 403 : 404).render("error", { message: reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable." });
      return null;
    }
    req.shopSpace = space;
    return { db: req.mk.ctx.db, organizationId: req.mk.ctx.organizationId, siteId: space.principal ? null : space.siteId };
  }
  const writable = (space) => space.status !== "archived" && !space.deleted;
  const audit = (req, s, action, resourceType, resourceId, metadata = {}) => {
    try { recordAudit(s.db, { organizationId: s.organizationId, userId: req.mk.ctx.userId ?? null, action, resourceType, resourceId: String(resourceId ?? ""), metadata, siteId: s.siteId ?? undefined }); } catch { /* la trace ne bloque jamais */ }
  };
  const actor = (req) => `user:${req.mk.ctx.userId}`;

  // Enregistre une route sous les deux préfixes (site et principal). `perm` : permission exigée ; `write` : refusé sur un site archivé.
  function route(method, tail, perm, handler, { write = false } = {}) {
    for (const P of PREFIXES) {
      router[method](`${P}/boutique${tail}`, need(perm), (req, res, next) => {
        const s = scopeOf(req, res);
        if (!s) return undefined;
        if (write && !writable(req.shopSpace)) { flashError(req, "Ce site est archivé : sa boutique est en lecture seule."); return res.redirect(req.shopSpace.base + "/boutique"); }
        try { return handler(req, res, s, next); } catch (error) {
          if (error instanceof MarketingError) { flashError(req, error.message); return res.redirect(req.get("referer") && /^https?:\/\/[^/]+\/marketing\//.test(req.get("referer")) ? req.get("referer") : `${req.shopSpace.base}/boutique`); }
          return next(error);
        }
      });
    }
  }
  const render = (req, res, tpl, title, active, extra = {}) => {
    const s = { db: req.mk.ctx.db, organizationId: req.mk.ctx.organizationId, siteId: req.shopSpace.principal ? null : req.shopSpace.siteId };
    const settings = store.getSettings(s);
    const moduleOn = siteModules.isEnabled(s.db, s.organizationId, s.siteId, "commerce");
    res.render(`marketing/boutique/${tpl}`, { title, active, space: req.shopSpace, base: `${req.shopSpace.base}/boutique`, shopSettings: settings, moduleOn, canWrite: req.mk.can("shop.write") && writable(req.shopSpace), canOrders: req.mk.can("shop.orders") && writable(req.shopSpace),
      canPay: req.mk.can("shop.payments") && writable(req.shopSpace), money: (c) => view.money(c, settings.currency), query: req.query, ...extra });
  };
  const int = (v) => (v === undefined || v === "" ? undefined : Number(v));
  const euros = (v) => { if (v === undefined || v === null || String(v).trim() === "") return undefined; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? Math.round(n * 100) : NaN; };
  const productInput = (b) => ({
    name: b.name, type: b.type, status: b.status, sku: b.sku, short_description: b.short_description, description: b.description,
    price_cents: euros(b.price), sale_price_cents: b.sale_price === "" ? null : euros(b.sale_price), sale_starts_at: b.sale_starts_at, sale_ends_at: b.sale_ends_at,
    manage_stock: b.manage_stock ? 1 : 0, stock_qty: int(b.stock_qty), weight_grams: b.weight_grams === "" ? null : int(b.weight_grams), length_mm: b.length_mm === "" ? null : int(b.length_mm), width_mm: b.width_mm === "" ? null : int(b.width_mm), height_mm: b.height_mm === "" ? null : int(b.height_mm),
    requires_shipping: b.requires_shipping ? 1 : 0, image_url: b.image_url, gallery: b.gallery, tags: b.tags, is_featured: b.is_featured ? 1 : 0, seo_title: b.seo_title, seo_description: b.seo_description,
    category_ids: [].concat(b.category_ids || []).map(Number),
    attributes: String(b.attributes || "").split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [name, ...rest] = l.split(":"); return { name: name.trim(), values: rest.join(":").split(",").map((x) => x.trim()).filter(Boolean) }; }),
  });
  const orderCtx = (req, s) => ({ s, order: orders.getOrder(s, req.params.oid) });

  // ── Produits ──
  route("get", "", "shop.read", (req, res, s) => {
    const list = catalog.adminList(s, { q: req.query.q, status: req.query.statut, page: req.query.page, perPage: PAGE });
    render(req, res, "produits", "Boutique — produits", "boutique", { list });
  });
  route("get", "/produits/nouveau", "shop.write", (req, res, s) => render(req, res, "produit", "Nouveau produit", "boutique", { product: null, categories: catalog.listCategories(s), variants: [], values: {} }), { write: true });
  route("post", "/produits", "shop.write", (req, res, s) => {
    try {
      const id = catalog.createProduct(s, productInput(req.body), req.mk.ctx.userId);
      audit(req, s, "shop_product.created", "shop_product", id, { name: req.body.name });
      flashOk(req, "Produit créé.");
      res.redirect(`${req.shopSpace.base}/boutique/produits/${id}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      res.status(422); flashError(req, error.message);
      render(req, res, "produit", "Nouveau produit", "boutique", { product: null, categories: catalog.listCategories(s), variants: [], values: req.body });
    }
  }, { write: true });
  route("get", "/produits/:pid(\\d+)", "shop.read", (req, res, s) => {
    const product = catalog.productById(s, req.params.pid);
    if (!product) return res.status(404).render("error", { message: "Produit introuvable." });
    render(req, res, "produit", product.name, "boutique", { product, categories: catalog.listCategories(s), variants: catalog.listVariants(s, product.id), values: {}, personalization: personalization.get(s.db, product.id), ageLevel: age.productLevel(s.db, product.id), specs: compare.specsToText(compare.getSpecs(s.db, product.id)) });
  });
  route("post", "/produits/:pid(\\d+)", "shop.write", (req, res, s) => {
    catalog.updateProduct(s, Number(req.params.pid), productInput(req.body));
    audit(req, s, "shop_product.updated", "shop_product", req.params.pid);
    flashOk(req, "Produit enregistré.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/supprimer", "shop.write", (req, res, s) => {
    catalog.deleteProduct(s, Number(req.params.pid));
    audit(req, s, "shop_product.deleted", "shop_product", req.params.pid);
    flashOk(req, "Produit supprimé du catalogue (les commandes passées sont conservées).");
    res.redirect(`${req.shopSpace.base}/boutique`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/variantes", "shop.write", (req, res, s) => {
    const b = req.body;
    const options = {};
    for (const [k, v] of Object.entries(b)) if (k.startsWith("opt_")) options[k.slice(4)] = v;
    catalog.saveVariant(s, Number(req.params.pid), { options, sku: b.sku, price_cents: b.price === "" ? null : euros(b.price), sale_price_cents: b.sale_price === "" ? null : euros(b.sale_price), stock_qty: int(b.stock_qty), weight_grams: b.weight_grams === "" ? null : int(b.weight_grams), manage_stock: 1 }, b.variant_id ? Number(b.variant_id) : null);
    audit(req, s, "shop_variant.saved", "shop_product", req.params.pid);
    flashOk(req, "Variante enregistrée.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/variantes/:vid(\\d+)/supprimer", "shop.write", (req, res, s) => {
    catalog.deleteVariant(s, Number(req.params.pid), Number(req.params.vid));
    audit(req, s, "shop_variant.deleted", "shop_product", req.params.pid);
    flashOk(req, "Variante supprimée.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/stock", "shop.write", (req, res, s) => {
    catalog.adjustStock(s, Number(req.params.pid), req.body.variant_id ? Number(req.body.variant_id) : null, req.body.delta, req.mk.ctx.userId);
    audit(req, s, "shop_stock.adjusted", "shop_product", req.params.pid, { delta: req.body.delta });
    flashOk(req, "Stock ajusté.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });

  route("post", "/produits/:pid(\\d+)/personnalisation", "shop.write", (req, res, s) => {
    if (!catalog.getProduct(s, req.params.pid)) throw new MarketingError("not_found", "Produit introuvable.");
    personalization.save(s.db, Number(req.params.pid), { enabled: req.body.enabled ? 1 : 0, label: req.body.label, hint: req.body.hint, max_length: req.body.max_length, required: req.body.required ? 1 : 0 });
    audit(req, s, "shop_product.personalization", "shop_product", req.params.pid);
    flashOk(req, "Personnalisation enregistrée.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });

  route("post", "/produits/:pid(\\d+)/specifications", "shop.write", (req, res, s) => {
    if (!catalog.getProduct(s, req.params.pid)) throw new MarketingError("not_found", "Produit introuvable.");
    compare.saveSpecs(s.db, Number(req.params.pid), req.body.specs);
    audit(req, s, "shop_product.specs", "shop_product", req.params.pid);
    flashOk(req, "Caractéristiques enregistrées.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });

  // Contrôle d'âge légal : âge minimum d'un produit (0 = aucun, 16, 18, 21)
  route("post", "/produits/:pid(\\d+)/age", "shop.write", (req, res, s) => {
    if (!catalog.getProduct(s, req.params.pid)) throw new MarketingError("not_found", "Produit introuvable.");
    age.saveProduct(s.db, Number(req.params.pid), req.body.min_age);
    audit(req, s, "shop_product.age", "shop_product", req.params.pid, { min_age: req.body.min_age });
    flashOk(req, "Contrôle d'âge enregistré.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/categories/:cid(\\d+)/age", "shop.write", (req, res, s) => {
    if (!catalog.categoryById(s, req.params.cid)) throw new MarketingError("not_found", "Catégorie introuvable.");
    age.saveCategory(s.db, Number(req.params.cid), req.body.min_age);
    audit(req, s, "shop_category.age", "shop_category", req.params.cid, { min_age: req.body.min_age });
    flashOk(req, "Contrôle d'âge enregistré.");
    res.redirect(`${req.shopSpace.base}/boutique/categories`);
  }, { write: true });

  // ── Avis clients (modération) ──
  route("get", "/avis", "shop.read", (req, res, s) => {
    const list = reviews.adminList(s, { status: req.query.statut, page: req.query.page, perPage: PAGE });
    render(req, res, "avis", "Boutique — avis", "boutique/avis", { list });
  });
  route("post", "/avis/:rid(\\d+)/statut", "shop.write", (req, res, s) => {
    reviews.moderate(s, req.params.rid, req.body.statut);
    audit(req, s, "shop_review.moderated", "shop_review", req.params.rid, { status: req.body.statut });
    flashOk(req, "Avis mis à jour.");
    res.redirect(`${req.shopSpace.base}/boutique/avis`);
  }, { write: true });
  route("post", "/avis/:rid(\\d+)/supprimer", "shop.write", (req, res, s) => {
    reviews.remove(s, req.params.rid);
    audit(req, s, "shop_review.deleted", "shop_review", req.params.rid);
    flashOk(req, "Avis supprimé.");
    res.redirect(`${req.shopSpace.base}/boutique/avis`);
  }, { write: true });

  // ── Accès membre et ventes privées ──
  const back = (req) => `${req.shopSpace.base}/boutique/acces`;
  const done = (req, res, s, action, type, id, msg, meta) => { audit(req, s, action, type, id, meta); flashOk(req, msg); res.redirect(back(req)); };
  route("get", "/acces", "shop.read", (req, res, s) => {
    render(req, res, "acces", "Boutique — accès membre", "boutique/acces", {
      members: access.listMembers(s, { status: req.query.statut }), invitations: access.listInvitations(s), rules: access.listRules(s), sales: access.listSales(s),
      productChoices: catalog.adminList(s, { perPage: 100 }).items.map((p) => ({ id: p.id, name: p.name })), categoryChoices: catalog.listCategories(s).map((c) => ({ id: c.id, name: c.name })), fmt: access.fmt, inputValue: access.inputValue,
    });
  });
  route("post", "/acces/membres", "shop.write", (req, res, s) => { access.addByEmail(s, req.body.email); done(req, res, s, "shop_member.added", "shop_member", "", "Membre ajouté."); }, { write: true });
  route("post", "/acces/membres/:cid(\\d+)/statut", "shop.write", (req, res, s) => {
    if (!["approved", "revoked"].includes(req.body.statut)) throw new MarketingError("invalid_field", "État inconnu.");
    access.setMember(s, req.params.cid, req.body.statut, "admin");
    done(req, res, s, "shop_member.status", "shop_member", req.params.cid, req.body.statut === "approved" ? "Membre approuvé." : "Accès retiré.", { status: req.body.statut });
  }, { write: true });
  route("post", "/acces/codes", "shop.write", (req, res, s) => {
    const r = access.createInvitation(s, { code: req.body.code, note: req.body.note, maxUses: req.body.max_uses, expiresAt: req.body.expires_at }, req.mk.ctx.userId ?? null);
    done(req, res, s, "shop_invitation.created", "shop_invitation", r.id, `Code créé : ${r.code}`);
  }, { write: true });
  route("post", "/acces/codes/:iid(\\d+)/etat", "shop.write", (req, res, s) => { access.setInvitationActive(s, req.params.iid, req.body.actif === "1"); done(req, res, s, "shop_invitation.toggled", "shop_invitation", req.params.iid, "Code mis à jour."); }, { write: true });
  route("post", "/acces/regles", "shop.write", (req, res, s) => {
    const kind = req.body.kind === "category" ? "category" : "product";
    access.saveRule(s, { kind, targetId: kind === "category" ? req.body.category_id : req.body.product_id, mode: req.body.mode });
    done(req, res, s, "shop_access_rule.saved", "shop_access_rule", "", "Règle enregistrée.");
  }, { write: true });
  route("post", "/acces/regles/:rid(\\d+)/supprimer", "shop.write", (req, res, s) => { access.deleteRule(s, req.params.rid); done(req, res, s, "shop_access_rule.deleted", "shop_access_rule", req.params.rid, "Règle supprimée."); }, { write: true });
  route("post", "/acces/ventes", "shop.write", (req, res, s) => {
    const id = access.createSale(s, { name: req.body.name, starts_at: req.body.starts_at, ends_at: req.body.ends_at, product_ids: req.body.product_ids, category_ids: req.body.category_ids });
    done(req, res, s, "shop_sale.created", "shop_sale", id, "Vente privée créée.");
  }, { write: true });
  route("post", "/acces/ventes/:vid(\\d+)", "shop.write", (req, res, s) => { access.updateSaleWindow(s, req.params.vid, req.body); done(req, res, s, "shop_sale.updated", "shop_sale", req.params.vid, "Dates de la vente mises à jour."); }, { write: true });
  route("post", "/acces/ventes/:vid(\\d+)/supprimer", "shop.write", (req, res, s) => { access.deleteSale(s, req.params.vid); done(req, res, s, "shop_sale.deleted", "shop_sale", req.params.vid, "Vente supprimée."); }, { write: true });

  // ── Listes de naissance / de cadeaux (lecture : chiffres réels ; l'adresse du bénéficiaire n'est visible que sur les commandes) ──
  route("get", "/listes-cadeaux", "shop.read", (req, res, s) => {
    const list = giftLists.adminList(s, { page: req.query.page, perPage: PAGE });
    render(req, res, "listes-cadeaux", "Boutique — listes de cadeaux", "boutique/listes-cadeaux", { list });
  });

  // ── Catégories ──
  route("get", "/categories", "shop.read", (req, res, s) => render(req, res, "categories", "Boutique — catégories", "boutique", { categories: (() => { const lv = age.categoryLevels(s.db); return catalog.listCategories(s).map((c) => ({ ...c, minAge: lv.get(c.id) || 0 })); })() }));
  route("post", "/categories", "shop.write", (req, res, s) => { catalog.saveCategory(s, req.body); flashOk(req, "Catégorie enregistrée."); res.redirect(`${req.shopSpace.base}/boutique/categories`); }, { write: true });
  route("post", "/categories/:cid(\\d+)/supprimer", "shop.write", (req, res, s) => { catalog.deleteCategory(s, Number(req.params.cid)); flashOk(req, "Catégorie supprimée."); res.redirect(`${req.shopSpace.base}/boutique/categories`); }, { write: true });

  // ── Commandes ──
  route("get", "/commandes", "shop.read", (req, res, s) => {
    const list = orders.listOrders(s, { status: req.query.statut, q: req.query.q, page: req.query.page, perPage: PAGE });
    render(req, res, "commandes", "Boutique — commandes", "boutique/commandes", { list, statusLabels: orders.STATUS_LABELS });
  });
  route("get", "/commandes/:oid(\\d+)", "shop.read", (req, res, s) => {
    const { order } = orderCtx(req, s);
    if (!order) return res.status(404).render("error", { message: "Commande introuvable." });
    const detail = orders.orderDetail(s, order);
    const next = orders.TRANSITIONS[order.status].filter((t) => t !== "paid" || order.payment_method === "manual");
    render(req, res, "commande", `Commande ${order.number}`, "boutique/commandes", { order: detail, slotText: deliverySlots.describe(detail), statusLabels: orders.STATUS_LABELS, next });
  });
  route("post", "/commandes/:oid(\\d+)/statut", "shop.orders", (req, res, s) => {
    const { order } = orderCtx(req, s);
    if (!order) return res.status(404).render("error", { message: "Commande introuvable." });
    const to = String(req.body.statut || "");
    if ((to === "paid" || to === "refunded") && !req.mk.can("shop.payments")) throw new MarketingError("forbidden", "Vous n'avez pas le droit de confirmer un paiement ou d'enregistrer un remboursement.");
    const updated = orders.changeStatus(s, order.id, to, { actor: actor(req), note: req.body.note, canMarkPaid: req.mk.can("shop.payments"), tracking: req.body.tracking });
    audit(req, s, "shop_order.status_changed", "shop_order", order.id, { from: order.status, to });
    const event = { paid: "order_paid", shipped: "order_shipped", cancelled: "order_cancelled", refunded: "order_refunded", processing: "order_updated", completed: "order_updated" }[to];
    if (event) notify.notify(s, updated, event);
    flashOk(req, `Commande ${order.number} : ${orders.STATUS_LABELS[to].toLowerCase()}.`);
    res.redirect(`${req.shopSpace.base}/boutique/commandes/${order.id}`);
  }, { write: true });

  // ── Clients ──
  route("get", "/clients", "shop.read", (req, res, s) => render(req, res, "clients", "Boutique — clients", "boutique/clients", { list: customers.listCustomers(s, { q: req.query.q, page: req.query.page, perPage: PAGE }) }));
  route("post", "/clients/:cid(\\d+)/statut", "shop.write", (req, res, s) => {
    customers.setStatus(s, Number(req.params.cid), req.body.statut);
    audit(req, s, "shop_customer.status_changed", "shop_customer", req.params.cid, { statut: req.body.statut });
    flashOk(req, "Statut du client modifié.");
    res.redirect(`${req.shopSpace.base}/boutique/clients`);
  }, { write: true });

  // ── Réglages : boutique, paiement, livraison, taxes, coupons ──
  route("get", "/reglages", "shop.read", (req, res, s) => render(req, res, "reglages", "Boutique — réglages", "boutique/reglages", { slots: deliverySlots.list(s), zones: store.listZones(s), taxRules: store.listTaxRules(s), coupons: store.listCoupons(s), providers: payments.status(store.getSettings(s)), products: catalog.adminList(s, { perPage: 100 }).items }));
  route("post", "/reglages", "shop.write", (req, res, s) => {
    const b = req.body;
    const input = { currency: b.currency, prices_include_tax: b.prices_include_tax ? 1 : 0, tax_enabled: b.tax_enabled ? 1 : 0, default_country: b.default_country, guest_checkout: b.guest_checkout ? 1 : 0, reviews_enabled: b.reviews_enabled ? 1 : 0, reviews_auto_publish: b.reviews_auto_publish ? 1 : 0, low_stock_threshold: b.low_stock_threshold, notify_email: b.notify_email, order_prefix: b.order_prefix };
    // Ouvrir la boutique et choisir les moyens de paiement : droit « shop.payments » (réglages sensibles)
    if (req.mk.can("shop.payments")) { input.enabled = b.enabled ? 1 : 0; input.payment_methods = [].concat(b.payment_methods || []).flatMap((x) => String(x).split(",")); input.manual_instructions = b.manual_instructions; }
    store.saveSettings(s, input);
    audit(req, s, "shop_settings.updated", "shop_settings", s.siteId ?? "principal", { enabled: input.enabled, payment_methods: input.payment_methods });
    flashOk(req, "Réglages enregistrés.");
    res.redirect(`${req.shopSpace.base}/boutique/reglages`);
  }, { write: true });
  route("post", "/livraison/zones", "shop.write", (req, res, s) => { store.saveZone(s, { name: req.body.name, countries: req.body.countries }); flashOk(req, "Zone ajoutée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#livraison`); }, { write: true });
  route("post", "/livraison/zones/:zid(\\d+)/supprimer", "shop.write", (req, res, s) => { store.deleteZone(s, Number(req.params.zid)); flashOk(req, "Zone supprimée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#livraison`); }, { write: true });
  route("post", "/livraison/zones/:zid(\\d+)/methodes", "shop.write", (req, res, s) => {
    const b = req.body;
    const methodId = store.saveMethod(s, Number(req.params.zid), { name: b.name, kind: b.kind, cost_cents: euros(b.cost), min_subtotal_cents: euros(b.min_subtotal), min_weight_grams: int(b.min_weight_grams), max_weight_grams: int(b.max_weight_grams) });
    if (b.requires_slot) deliverySlots.setMethodRequires(s, methodId, true);
    flashOk(req, "Méthode ajoutée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#livraison`);
  }, { write: true });
  // Créneaux de livraison : méthode qui exige un créneau, créneaux récurrents
  route("post", "/livraison/methodes/:mid(\\d+)/creneau", "shop.write", (req, res, s) => { deliverySlots.setMethodRequires(s, Number(req.params.mid), Boolean(req.body.requires_slot)); audit(req, s, "shop_shipping.slot_required", "shop_shipping_method", req.params.mid, { requires_slot: req.body.requires_slot ? 1 : 0 }); flashOk(req, "Méthode mise à jour."); res.redirect(`${req.shopSpace.base}/boutique/reglages#creneaux`); }, { write: true });
  route("post", "/creneaux", "shop.write", (req, res, s) => { const id = deliverySlots.save(s, req.body); audit(req, s, "shop_delivery_slot.created", "shop_delivery_slot", id); flashOk(req, "Créneau ajouté."); res.redirect(`${req.shopSpace.base}/boutique/reglages#creneaux`); }, { write: true });
  route("post", "/creneaux/:cid(\\d+)/etat", "shop.write", (req, res, s) => { deliverySlots.setActive(s, Number(req.params.cid), Boolean(req.body.actif)); flashOk(req, "Créneau mis à jour."); res.redirect(`${req.shopSpace.base}/boutique/reglages#creneaux`); }, { write: true });
  route("post", "/creneaux/:cid(\\d+)/supprimer", "shop.write", (req, res, s) => { deliverySlots.remove(s, Number(req.params.cid)); audit(req, s, "shop_delivery_slot.deleted", "shop_delivery_slot", req.params.cid); flashOk(req, "Créneau supprimé."); res.redirect(`${req.shopSpace.base}/boutique/reglages#creneaux`); }, { write: true });
  route("post", "/livraison/methodes/:mid(\\d+)/supprimer", "shop.write", (req, res, s) => { store.deleteMethod(s, Number(req.params.mid)); flashOk(req, "Méthode supprimée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#livraison`); }, { write: true });
  route("post", "/taxes", "shop.write", (req, res, s) => {
    const b = req.body;
    store.saveTaxRule(s, { name: b.name, country: b.country, region: b.region, rate_bp: Math.round(Number(String(b.rate).replace(",", ".")) * 100), applies_to_shipping: b.applies_to_shipping ? 1 : 0, priority: b.priority });
    audit(req, s, "shop_tax.created", "shop_settings", s.siteId ?? "principal", { country: b.country });
    flashOk(req, "Règle de taxe ajoutée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#taxes`);
  }, { write: true });
  route("post", "/taxes/:tid(\\d+)/supprimer", "shop.write", (req, res, s) => { store.deleteTaxRule(s, Number(req.params.tid)); flashOk(req, "Règle supprimée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#taxes`); }, { write: true });
  route("post", "/coupons", "shop.write", (req, res, s) => {
    const b = req.body;
    store.saveCoupon(s, { code: b.code, kind: b.kind, value: b.kind === "fixed" ? euros(b.value) : Number(b.value), min_subtotal_cents: euros(b.min_subtotal), starts_at: b.starts_at, ends_at: b.ends_at, max_uses: int(b.max_uses), per_customer_limit: int(b.per_customer_limit), product_ids: [].concat(b.product_ids || []).map(Number) });
    audit(req, s, "shop_coupon.created", "shop_coupon", b.code);
    flashOk(req, "Coupon créé."); res.redirect(`${req.shopSpace.base}/boutique/reglages#coupons`);
  }, { write: true });
  route("post", "/coupons/:kid(\\d+)/etat", "shop.write", (req, res, s) => { store.setCouponActive(s, Number(req.params.kid), Boolean(req.body.actif)); flashOk(req, "Coupon mis à jour."); res.redirect(`${req.shopSpace.base}/boutique/reglages#coupons`); }, { write: true });

  require("./shopRdv").mountAdmin({ route, render, audit }); // prise de rendez-vous (migration 137)

  return router;
};
