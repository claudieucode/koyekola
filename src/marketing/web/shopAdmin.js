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
const refunds = require("../shop/refunds");
const deliverySlots = require("../shop/deliverySlots");
const age = require("../shop/age");
const compare = require("../shop/compare");
const reports = require("../shop/reports");
const invoices = require("../shop/invoices");
const downloads = require("../shop/downloads");
const multer = require("multer");
const fileUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: downloads.MAX_BYTES, files: 1, fields: 10 } }).single("file");

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
    render(req, res, "produit", product.name, "boutique", { product, categories: catalog.listCategories(s), variants: catalog.listVariants(s, product.id), values: {}, personalization: personalization.get(s.db, product.id), ageLevel: age.productLevel(s.db, product.id), specs: compare.specsToText(compare.getSpecs(s.db, product.id)), plans: require("../shop/subscriptions").listPlans(s, product.id), stripeReady: require("../shop/stripeClient").configured(), files: downloads.listFiles(s, product.id), dl: s.db.prepare("SELECT download_limit, download_days FROM mk_shop_products WHERE id = ?").get(product.id) });
  });
  route("post", "/produits/:pid(\\d+)", "shop.write", (req, res, s) => {
    catalog.updateProduct(s, Number(req.params.pid), productInput(req.body));
    audit(req, s, "shop_product.updated", "shop_product", req.params.pid);
    flashOk(req, "Produit enregistré.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  // ── Produits numériques : fichiers à télécharger ──
  // Le fichier arrive en mémoire (25 Mo au plus) ; le droit et le site sont vérifiés AVANT d'écrire quoi que ce soit.
  for (const P of PREFIXES) {
    router.post(`${P}/boutique/produits/:pid(\\d+)/fichiers`, need("shop.write"), (req, res, next) => {
      const s = scopeOf(req, res);
      if (!s) return undefined;
      if (!writable(req.shopSpace)) { flashError(req, "Ce site est archivé : sa boutique est en lecture seule."); return res.redirect(req.shopSpace.base + "/boutique"); }
      return fileUpload(req, res, (err) => {
        const back = `${req.shopSpace.base}/boutique/produits/${req.params.pid}`;
        try {
          if (err) throw new MarketingError("invalid", err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (25 Mo au plus)." : "Envoi impossible.");
          if (!req.file) throw new MarketingError("invalid", "Choisissez un fichier.");
          const id = downloads.addFile(s, Number(req.params.pid), { label: req.body.label, buffer: req.file.buffer, originalName: req.file.originalname });
          audit(req, s, "shop_file.added", "shop_file", id, { product: req.params.pid });
          flashOk(req, "Fichier ajouté : il sera proposé au téléchargement aux acheteurs de ce produit.");
        } catch (error) {
          if (!(error instanceof MarketingError)) return next(error);
          flashError(req, error.message);
        }
        return res.redirect(back);
      });
    });
  }
  route("post", "/produits/:pid(\\d+)/fichiers/:fid(\\d+)/supprimer", "shop.write", (req, res, s) => {
    downloads.removeFile(s, Number(req.params.fid));
    audit(req, s, "shop_file.removed", "shop_file", req.params.fid, { product: req.params.pid });
    flashOk(req, "Fichier supprimé.");
    res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/telechargement", "shop.write", (req, res, s) => {
    const n = (v, max) => { const x = Math.floor(Number(String(v).replace(",", "."))); return Number.isFinite(x) && x >= 0 && x <= max ? x : null; };
    const lim = req.body.download_limit === "" ? null : n(req.body.download_limit, 1000);
    const days = req.body.download_days === "" ? null : n(req.body.download_days, 3650);
    if ((req.body.download_limit !== "" && lim === null) || (req.body.download_days !== "" && days === null)) throw new MarketingError("invalid", "Valeurs de téléchargement invalides.");
    if (!catalog.productById(s, req.params.pid)) throw new MarketingError("not_found", "Produit introuvable.");
    s.db.prepare("UPDATE mk_shop_products SET download_limit = ?, download_days = ? WHERE id = ? AND organization_id = ?").run(lim, days, Number(req.params.pid), s.organizationId);
    flashOk(req, "Règles de téléchargement enregistrées (elles s'appliquent aux prochaines commandes).");
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
    const next = orders.TRANSITIONS[order.status].filter((t) => (t !== "paid" || order.payment_method === "manual") && t !== "refunded");
    render(req, res, "commande", `Commande ${order.number}`, "boutique/commandes", { order: detail, slotText: deliverySlots.describe(detail), statusLabels: orders.STATUS_LABELS, next, docs: invoices.forOrder(s, order.id) });
  });
  route("post", "/commandes/:oid(\\d+)/statut", "shop.orders", (req, res, s, next) => {
    const { order } = orderCtx(req, s);
    if (!order) return res.status(404).render("error", { message: "Commande introuvable." });
    const to = String(req.body.statut || "");
    if (to === "refunded") { // « Remboursée » = remboursement TOTAL réel du reste (fournisseur de paiement inclus), jamais un simple changement d'étiquette
      if (!req.mk.can("shop.payments")) throw new MarketingError("forbidden", "Vous n'avez pas le droit d'enregistrer un remboursement.");
      const back = `${req.shopSpace.base}/boutique/commandes/${order.id}`;
      return void refunds.create(s, order.id, { reason: req.body.note, actor: actor(req), idempotencyKey: req.body.idempotency_key })
        .then((r) => { audit(req, s, "shop_order.refunded", "shop_order", order.id, { refund: r.refund.id, amount_cents: r.refund.amount_cents, full: r.full }); if (r.full && !r.duplicate) notify.notify(s, r.order, "order_refunded"); flashOk(req, `Commande ${order.number} : remboursée.`); res.redirect(back); })
        .catch((error) => { if (!(error instanceof MarketingError)) return next(error); flashError(req, error.message); return res.redirect(back); });
    }
    if ((to === "paid" || to === "refunded") && !req.mk.can("shop.payments")) throw new MarketingError("forbidden", "Vous n'avez pas le droit de confirmer un paiement ou d'enregistrer un remboursement.");
    const updated = orders.changeStatus(s, order.id, to, { actor: actor(req), note: req.body.note, canMarkPaid: req.mk.can("shop.payments"), tracking: req.body.tracking });
    audit(req, s, "shop_order.status_changed", "shop_order", order.id, { from: order.status, to });
    const event = { paid: "order_paid", shipped: "order_shipped", cancelled: "order_cancelled", refunded: "order_refunded", processing: "order_updated", completed: "order_updated" }[to];
    if (event) notify.notify(s, updated, event);
    flashOk(req, `Commande ${order.number} : ${orders.STATUS_LABELS[to].toLowerCase()}.`);
    res.redirect(`${req.shopSpace.base}/boutique/commandes/${order.id}`);
  }, { write: true });

  // Remboursement réel (total ou partiel) : appelle le fournisseur de paiement, remet les articles en stock si demandé. Droit « shop.payments ».
  route("post", "/commandes/:oid(\\d+)/remboursement", "shop.payments", (req, res, s, next) => {
    const { order } = orderCtx(req, s);
    if (!order) return res.status(404).render("error", { message: "Commande introuvable." });
    const b = req.body || {};
    const back = `${req.shopSpace.base}/boutique/commandes/${order.id}`;
    const amount = String(b.amount || "").trim() === "" ? null : euros(b.amount);
    const items = Object.keys(b).filter((k) => /^qty_\d+$/.test(k)).map((k) => ({ order_item_id: Number(k.slice(4)), quantity: Number(b[k]) })).filter((i) => i.quantity >= 1);
    Promise.resolve().then(() => refunds.create(s, order.id, { amountCents: amount, items, restock: b.restock === "1", shippingToo: b.shipping === "1", reason: b.reason, actor: actor(req), idempotencyKey: b.idempotency_key }))
      .then((r) => {
        audit(req, s, "shop_order.refunded", "shop_order", order.id, { refund: r.refund.id, amount_cents: r.refund.amount_cents, full: r.full });
        if (r.full && !r.duplicate) notify.notify(s, r.order, "order_refunded");
        flashOk(req, r.duplicate ? "Ce remboursement avait déjà été enregistré." : r.full ? `Commande ${order.number} : remboursée.` : `Remboursement partiel de ${view.money(r.refund.amount_cents, order.currency)} enregistré.`);
        res.redirect(back);
      })
      .catch((error) => { if (!(error instanceof MarketingError)) return next(error); flashError(req, error.message); return res.redirect(back); });
  }, { write: true });

  // ── Clients ──
  // ── Factures et avoirs ──
  route("get", "/factures", "shop.read", (req, res, s) => {
    render(req, res, "factures", "Boutique — factures", "boutique/factures", { company: invoices.getCompany(s), list: invoices.list(s, { page: req.query.page, perPage: PAGE }), canPaySettings: req.mk.can("shop.write") });
  });
  route("post", "/factures/vendeur", "shop.write", (req, res, s) => {
    invoices.saveCompany(s, req.body);
    audit(req, s, "shop_company.saved", "shop_company", s.siteId ?? "principal");
    flashOk(req, "Informations du vendeur enregistrées : elles figureront sur les prochaines factures (les factures déjà émises ne changent pas).");
    res.redirect(`${req.shopSpace.base}/boutique/factures`);
  }, { write: true });
  route("get", "/commandes/:oid(\\d+)/factures/:iid(\\d+)", "shop.read", (req, res, s) => {
    const { order } = orderCtx(req, s);
    const inv = order && invoices.get(s, order.id, req.params.iid);
    if (!inv) throw new MarketingError("not_found", "Document introuvable.");
    res.set("Cache-Control", "no-store");
    res.render("marketing/boutique/facture", { inv, money: (c) => view.money(c, inv.currency) });
  });

  // ── Rapports et exports CSV ──
  route("get", "/rapports", "shop.read", (req, res, s) => {
    const settings = store.getSettings(s);
    render(req, res, "rapports", "Boutique — rapports", "boutique/rapports", { rep: reports.report(s, req.query, settings), statusLabels: orders.STATUS_LABELS, canExportPeople: req.mk.can("shop.orders") });
  });
  route("get", "/rapports/export/:kind", "shop.read", (req, res, s) => {
    const kind = String(req.params.kind);
    if (!Object.prototype.hasOwnProperty.call(reports.EXPORTS, kind)) throw new MarketingError("not_found", "Export inconnu.");
    if ((kind === "commandes" || kind === "lignes" || kind === "clients") && !req.mk.can("shop.orders")) return res.status(403).render("error", { message: "Vous n'avez pas le droit d'exporter les commandes et les clients." });
    const p = reports.period(req.query);
    const csv = reports.EXPORTS[kind](s, p);
    audit(req, s, "shop.export", "shop_export", kind, { from: p.from, to: p.to });
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="boutique-${kind}-${p.from}_${p.to}.csv"`, "Cache-Control": "no-store" });
    res.send(csv);
  });
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
    store.saveTaxRule(s, { name: b.name, country: b.country, region: b.region, rate_bp: Math.round(Number(String(b.rate).replace(",", ".")) * 100), applies_to_shipping: b.applies_to_shipping ? 1 : 0, priority: b.priority, tax_class_id: b.tax_class_id, postcode: b.postcode });
    audit(req, s, "shop_tax.created", "shop_settings", s.siteId ?? "principal", { country: b.country });
    flashOk(req, "Règle de taxe ajoutée."); res.redirect(`${req.shopSpace.base}/boutique/${b.back === "classes" ? "classes" : "reglages#taxes"}`);
  }, { write: true });
  route("post", "/taxes/:tid(\\d+)/supprimer", "shop.write", (req, res, s) => { store.deleteTaxRule(s, Number(req.params.tid)); flashOk(req, "Règle supprimée."); res.redirect(`${req.shopSpace.base}/boutique/reglages#taxes`); }, { write: true });
  // ── Classes de taxe et d'expédition, codes postaux, exonération ──
  route("get", "/classes", "shop.read", (req, res, s) => {
    render(req, res, "classes", "Boutique — taxes et expédition", "boutique/classes", { taxClasses: store.listClasses(s, "tax"), shipClasses: store.listClasses(s, "shipping"), zones: store.listZones(s), taxRules: store.listTaxRules(s) });
  });
  route("post", "/classes/:kind(tax|shipping)", "shop.write", (req, res, s) => {
    store.saveClass(s, req.params.kind, req.body.name);
    audit(req, s, "shop_class.created", "shop_class", req.params.kind, { name: req.body.name });
    flashOk(req, "Classe ajoutée."); res.redirect(`${req.shopSpace.base}/boutique/classes`);
  }, { write: true });
  route("post", "/classes/:kind(tax|shipping)/:id(\\d+)/supprimer", "shop.write", (req, res, s) => {
    store.deleteClass(s, req.params.kind, Number(req.params.id));
    audit(req, s, "shop_class.deleted", "shop_class", req.params.id, { kind: req.params.kind });
    flashOk(req, "Classe supprimée : les produits concernés repassent en classe standard."); res.redirect(`${req.shopSpace.base}/boutique/classes`);
  }, { write: true });
  route("post", "/produits/:pid(\\d+)/classes", "shop.write", (req, res, s) => {
    store.setProductClasses(s, Number(req.params.pid), { taxClassId: req.body.tax_class_id, shippingClassId: req.body.shipping_class_id });
    flashOk(req, "Classes du produit enregistrées."); res.redirect(`${req.shopSpace.base}/boutique/produits/${req.params.pid}`);
  }, { write: true });
  route("post", "/livraison/methodes/:mid(\\d+)/classes", "shop.write", (req, res, s) => {
    store.setClassCost(s, Number(req.params.mid), Number(req.body.class_id), req.body.cost === "" ? "" : euros(req.body.cost));
    flashOk(req, "Supplément enregistré."); res.redirect(`${req.shopSpace.base}/boutique/classes`);
  }, { write: true });
  route("post", "/livraison/zones/:zid(\\d+)/postcodes", "shop.write", (req, res, s) => {
    const z = store.listZones(s).find((x) => x.id === Number(req.params.zid));
    if (!z) throw new MarketingError("not_found", "Zone introuvable.");
    store.saveZone(s, { name: z.name, countries: z.countries, postcodes: req.body.postcodes }, z.id);
    flashOk(req, "Codes postaux de la zone enregistrés."); res.redirect(`${req.shopSpace.base}/boutique/classes`);
  }, { write: true });
  route("post", "/clients/:cid(\\d+)/exoneration", "shop.write", (req, res, s) => {
    const r = s.db.prepare(`UPDATE mk_shop_customers SET tax_exempt = ? WHERE id = ? AND organization_id = ? AND ${s.siteId == null ? "site_id IS NULL" : "site_id = ?"}`).run(req.body.exempt ? 1 : 0, Number(req.params.cid), s.organizationId, ...(s.siteId == null ? [] : [s.siteId]));
    if (!r.changes) throw new MarketingError("not_found", "Client introuvable.");
    audit(req, s, "shop_customer.tax_exempt", "shop_customer", req.params.cid, { exempt: Boolean(req.body.exempt) });
    flashOk(req, req.body.exempt ? "Client exonéré de taxe (compte connecté uniquement)." : "Exonération retirée."); res.redirect(`${req.shopSpace.base}/boutique/clients`);
  }, { write: true });
  route("post", "/coupons", "shop.write", (req, res, s) => {
    const b = req.body;
    store.saveCoupon(s, { code: b.code, kind: b.kind, value: b.kind === "fixed" ? euros(b.value) : Number(b.value), min_subtotal_cents: euros(b.min_subtotal), starts_at: b.starts_at, ends_at: b.ends_at, max_uses: int(b.max_uses), per_customer_limit: int(b.per_customer_limit), product_ids: [].concat(b.product_ids || []).map(Number) });
    audit(req, s, "shop_coupon.created", "shop_coupon", b.code);
    flashOk(req, "Coupon créé."); res.redirect(`${req.shopSpace.base}/boutique/reglages#coupons`);
  }, { write: true });
  route("post", "/coupons/:kid(\\d+)/etat", "shop.write", (req, res, s) => { store.setCouponActive(s, Number(req.params.kid), Boolean(req.body.actif)); flashOk(req, "Coupon mis à jour."); res.redirect(`${req.shopSpace.base}/boutique/reglages#coupons`); }, { write: true });

  require("./shopRdv").mountAdmin({ route, render, audit }); // prise de rendez-vous (migration 137)

  require("./shopAbonnements").mountAdmin({ route, render, audit }); // abonnements (migration 139)

  return router;
};
