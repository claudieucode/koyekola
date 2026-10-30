// Store Validation Engine : contrôles AVANT publication, calculés sur le catalogue et la configuration RÉELS du moteur e-commerce (jamais sur un état déclaré).
// Quatre niveaux : error (bloquant) · warning (avertissement) · missing (information manquante) · ok (validé) ; « info » pour une remarque.
// La boutique n'est « prête à vendre » que s'il n'y a AUCUNE erreur : paiement utilisable, livraison pour les produits physiques, taxes cohérentes, au moins un produit publiable.
// Le constructeur ne fait aucun paiement : le parcours d'achat est déclaré « prêt » d'après la configuration, pas d'après une commande d'essai.
const caps = require("./capabilities");
const seo = require("./seo");
const store = () => require("../../shop/store");

function validate(ctx, siteId, project = {}) {
  const s = { db: ctx.db, organizationId: ctx.organizationId, siteId };
  const settings = store().getSettings(s), zones = store().listZones(s), tax = store().listTaxRules(s), c = caps.forSite(ctx, siteId);
  const products = ctx.db.prepare("SELECT id, name, type, status, price_cents, image_url, description, requires_shipping, manage_stock, stock_qty, sku FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL").all(ctx.organizationId, siteId);
  const variantsOf = ctx.db.prepare("SELECT COUNT(*) n FROM mk_shop_variants WHERE product_id = ?");
  const categories = ctx.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE organization_id = ? AND site_id IS ?").get(ctx.organizationId, siteId).n;
  const publishable = products.filter((p) => p.status === "published");
  const physical = products.filter((p) => p.type !== "digital" && p.requires_shipping);
  const out = [];
  const add = (key, area, level, label, message) => out.push({ key, area, level, label, message });

  add("module", "configuration", c.commerceModule ? "ok" : "error", "Module Commerce", c.commerceModule ? "Module activé pour ce site." : "Le module « Commerce » n'est pas activé pour ce site (réglé par l'équipe).");
  // Pages
  const plan = project.plan || { pages: [] }; const applied = (project.applied && project.applied.pages) || {};
  const needed = plan.pages.filter((p) => p.kind === "page" && p.required);
  const missingPages = needed.filter((p) => !applied[p.key]);
  add("pages", "pages", !plan.pages.length ? "missing" : missingPages.length ? "warning" : "ok", "Pages nécessaires", !plan.pages.length ? "Aucun plan de boutique." : missingPages.length ? `Pages obligatoires non créées : ${missingPages.map((p) => p.name).join(", ")}.` : "Toutes les pages obligatoires du plan sont créées (brouillons ou publiées).");
  const legal = plan.pages.filter((p) => p.legal);
  if (legal.length) add("legal", "politiques", "warning", "Politiques commerciales", `Les pages « ${legal.map((p) => p.name).join(", ")} » sont des modèles à compléter et à faire vérifier : le constructeur ne garantit aucune conformité juridique.`);
  // Catalogue
  add("categories", "catalogue", categories ? "ok" : "warning", "Catégories", categories ? `${categories} catégorie(s) dans le catalogue.` : "Aucune catégorie créée.");
  add("products", "catalogue", products.length ? (publishable.length ? "ok" : "warning") : "error", "Produits", !products.length ? "Aucun produit dans le catalogue : rien à vendre." : publishable.length ? `${publishable.length} produit(s) publié(s) sur ${products.length}.` : `${products.length} produit(s), aucun publié.`);
  const noPrice = products.filter((p) => !p.price_cents), noImage = products.filter((p) => !p.image_url), noDesc = products.filter((p) => !String(p.description || "").trim());
  add("prices", "catalogue", noPrice.length ? "warning" : products.length ? "ok" : "missing", "Prix", noPrice.length ? `${noPrice.length} produit(s) à prix nul : ${noPrice.slice(0, 3).map((p) => p.name).join(", ")}…` : products.length ? "Tous les produits ont un prix." : "Aucun produit.");
  add("images", "médias", noImage.length ? "warning" : products.length ? "ok" : "missing", "Images des produits", noImage.length ? `${noImage.length} produit(s) sans image.` : products.length ? "Toutes les fiches ont une image." : "Aucun produit.");
  add("descriptions", "contenus", noDesc.length ? "warning" : products.length ? "ok" : "missing", "Descriptions", noDesc.length ? `${noDesc.length} produit(s) sans description.` : products.length ? "Toutes les fiches ont une description." : "Aucun produit.");
  const varNoVariants = products.filter((p) => p.type === "variable" && variantsOf.get(p.id).n === 0);
  add("variants", "variantes", varNoVariants.length ? "error" : "ok", "Variantes", varNoVariants.length ? `Produit(s) variable(s) sans aucune variante : ${varNoVariants.slice(0, 3).map((p) => p.name).join(", ")} (impossible à acheter).` : "Les produits variables ont leurs variantes (ou il n'y en a pas).");
  const unmanaged = products.filter((p) => !p.manage_stock);
  add("stock", "stock", !products.length ? "missing" : unmanaged.length ? "warning" : "ok", "Stock", !products.length ? "Aucun produit." : unmanaged.length ? `${unmanaged.length} produit(s) sans gestion de stock (vendables sans limite). Aucune quantité n'est jamais inventée.` : "Stock géré pour tous les produits.");
  // Paiement, livraison, taxes, devise
  const usable = c.paymentProviders.filter((p) => p.usable);
  add("payments", "paiement", usable.length ? "ok" : "error", "Paiement", usable.length ? `Moyen(s) utilisable(s) : ${usable.map((p) => p.label).join(", ")}.` : "Aucun moyen de paiement utilisable : la boutique ne peut pas être déclarée prête à vendre.");
  if (usable.some((p) => p.id === "manual")) add("manual", "paiement", "warning", "Paiement manuel", "Le paiement manuel n'est pas traité automatiquement : les commandes restent « en attente » jusqu'à votre confirmation.");
  add("shipping", "livraison", physical.length && !zones.length ? "error" : zones.some((z) => !(z.methods || []).length) ? "error" : zones.length ? "ok" : "missing", "Livraison", physical.length && !zones.length ? "Produits physiques sans zone de livraison : aucun tarif ni délai n'est proposé, saisissez les vôtres." : zones.some((z) => !(z.methods || []).length) ? "Une zone de livraison n'a aucune méthode." : zones.length ? `${zones.length} zone(s) de livraison.` : "Aucune livraison nécessaire (ou aucune zone).");
  add("tax", "taxes", settings.tax_enabled && !tax.length ? "error" : settings.tax_enabled ? "ok" : "warning", "Taxes", settings.tax_enabled && !tax.length ? "Taxes activées sans règle." : settings.tax_enabled ? `${tax.length} règle(s) : à faire valider par un professionnel.` : "Taxes désactivées : à confirmer selon la réglementation de votre pays (pas d'avis fiscal).");
  add("currency", "devise", c.currency.current === "EUR" ? "ok" : "warning", "Devise", c.currency.current === "EUR" ? "EUR." : `${c.currency.current} : seul l'euro est testé dans le moteur.`);
  // SEO
  const sc = seo.checkCatalog(ctx.db, ctx.organizationId, siteId);
  add("seo", "SEO", sc.issues.some((i) => i.level === "warn") ? "warning" : products.length ? "ok" : "missing", "SEO", sc.issues.length ? `${sc.issues.length} remarque(s) (voir l'étape SEO).` : products.length ? "Titres et descriptions SEO renseignés." : "Aucun produit.");
  add("mobile", "responsive", "info", "Version mobile", "Non vérifiable automatiquement : contrôlez les pages et les fiches produits sur mobile.");
  const checkout = usable.length && publishable.length && (!physical.length || zones.some((z) => (z.methods || []).length));
  add("checkout", "parcours d'achat", checkout ? "ok" : "error", "Parcours d'achat", checkout ? "Configuration complète pour acheter (paiement, livraison, produit publié) — non testé de bout en bout : aucune commande n'est passée par le constructeur." : "Le parcours d'achat est incomplet (paiement, livraison ou produit publié manquant).");
  add("open", "boutique", settings.enabled ? "ok" : "info", "Boutique ouverte", settings.enabled ? "La boutique est ouverte au public." : "La boutique n'est pas ouverte : elle n'est pas visible tant que vous ne l'ouvrez pas.");
  const errors = out.filter((x) => x.level === "error");
  return { checks: out, errors: errors.length, warnings: out.filter((x) => x.level === "warning").length, missing: out.filter((x) => x.level === "missing").length, readyToSell: errors.length === 0 && publishable.length > 0, blockers: errors.map((e) => e.message), seo: sc };
}
module.exports = { validate };
