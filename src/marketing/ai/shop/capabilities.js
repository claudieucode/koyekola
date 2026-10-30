// CAPACITÉS RÉELLES du moteur e-commerce (programme 20.5), lues dans le code et la base : c'est la seule source d'une affirmation « pris en charge » du constructeur.
// Rien n'est annoncé parce qu'il apparaît dans une liste : un modèle commercial est « supported » seulement si le moteur sait le traiter, « partial » s'il le traite en partie
// (avec la limite écrite), « unsupported » sinon.
const siteModules = require("../../siteModules");
const catalog = () => require("../../shop/catalog");
const store = () => require("../../shop/store");
const payments = () => require("../../shop/payments");

// Fonctions que le moteur n'a PAS (liste tenue avec docs/KOLAKISA_PROGRAMME20_5_REMAINING_ISSUES.md) : le constructeur ne les simule jamais
const ABSENT = Object.freeze({
  csvImportNative: "Import CSV natif : absent du moteur (le constructeur prépare des brouillons à partir d'un CSV, puis crée les produits un à un).",
  bulkEdit: "Modification en masse native : absente.",
  reviews: "Avis clients : absents (aucune note ni avis n'est jamais généré).",
  downloadableFiles: "Livraison de fichiers téléchargeables : absente (un produit numérique est vendu, le fichier doit être transmis autrement).",
  schemaOrgProduct: "Données structurées schema.org pour les produits : absentes.",
  wholesale: "Prix de gros / paliers par quantité : absents.",
  dropshipping: "Intégration de fournisseurs (dropshipping) : absente.",
  services: "Vente de services avec réservation : absente du moteur de boutique.",
  perProductImageGeneration: "Génération d'images de produits : le générateur de médias (21.7) ne couvre que les bandeaux et sections « Image » des pages.",
});

function productTypes() {
  const ops = catalog().OPERATIONAL_TYPES;
  return { simple: ops.includes("simple"), variable: ops.includes("variable"), digital: ops.includes("digital"), downloadable: false, grouped: false };
}
function paymentProviders(s) {
  const settings = store().getSettings(s);
  return payments().status(settings).map((p) => ({ id: p.key, label: p.label, enabledForShop: p.enabled, configuredOnServer: p.configured, usable: p.enabled && p.configured,
    availability: p.key === "stripe" ? "Dépend de la configuration du serveur (clés Stripe et secret de webhook) ; mode test uniquement vérifié ; une seule paire de clés pour toute la plateforme ; la disponibilité par pays de votre compte Stripe n'est pas vérifiée par Kolakisa." : "Toujours disponible (virement, paiement à la livraison) : aucun traitement automatique du paiement." }));
}
function forSite(ctx, siteId) {
  const s = { db: ctx.db, organizationId: ctx.organizationId, siteId };
  const settings = store().getSettings(s);
  return {
    productTypes: productTypes(), paymentProviders: paymentProviders(s),
    currency: { current: String(settings.currency).toUpperCase(), tested: ["EUR"], note: "Le moteur accepte tout code à trois lettres mais seul l'euro est testé ; aucune conversion de devise n'existe (jamais de taux inventé)." },
    shopOpen: Boolean(settings.enabled), commerceModule: siteModules.isEnabled(ctx.db, ctx.organizationId, siteId, "commerce"),
    native: { variants: true, stock: true, shippingZones: true, taxRules: true, coupons: true, guestCheckout: true, productStatuses: catalog().STATUSES }, absent: ABSENT,
  };
}
// Un modèle commercial reconnu par l'analyseur → son état réel de prise en charge
const MODEL_SUPPORT = Object.freeze({
  physical: { status: "supported", label: "Produits physiques", reason: "Produits simples et variables, stock, livraison par zones, taxes configurables." },
  digital: { status: "partial", label: "Produits numériques", reason: ABSENT.downloadableFiles },
  custom: { status: "partial", label: "Produits personnalisés", reason: "Pas de champs de personnalisation par commande : seules les variantes (options prédéfinies) existent." },
  service: { status: "unsupported", label: "Vente de services", reason: ABSENT.services },
  single_product: { status: "supported", label: "Boutique mono-produit", reason: "Un seul produit dans le catalogue : pris en charge." },
  multi_category: { status: "supported", label: "Boutique multi-catégories", reason: "Catégories hiérarchiques natives." },
  multi_brand: { status: "partial", label: "Boutique multimarque", reason: "Pas de champ « marque » natif : les marques peuvent être des catégories ou des étiquettes." },
  wholesale: { status: "unsupported", label: "Vente en gros", reason: ABSENT.wholesale },
  dropshipping: { status: "unsupported", label: "Dropshipping", reason: ABSENT.dropshipping },
});
module.exports = { forSite, productTypes, paymentProviders, MODEL_SUPPORT, ABSENT };
