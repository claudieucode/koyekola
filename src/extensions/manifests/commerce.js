// Kolakisa Commerce : la boutique EXISTANTE (src/marketing/shop, web/shop*.js, api/shop.js), intégrée sans réécriture. Identifiant technique stable : « commerce ».
module.exports = {
  id: "commerce", name: "Kolakisa Commerce", description: "Boutique complète : produits, commandes, clients, abonnements, rendez-vous, listes cadeaux, factures, taxes, expédition et paiements.",
  icon: "cart", version: "1.0.0", publisher: "Kolakisa", category: "commerce", availability: "available", maintenance: "stable", scope: "always_on_primary", phase: "R7-6.5",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [],
  permissions: ["shop.read", "shop.write", "shop.orders", "shop.payments"],
  migrations: ["121_boutique.sql", "122_ia_boutique.sql", "127_index_cles_etrangeres_boutique.sql", "131_briques_boutique.sql", "133_comparateur.sql", "134_controle_age.sql", "135_creneaux_livraison.sql", "136_acces_membre.sql", "137_rendez_vous.sql", "138_liste_cadeaux.sql", "139_abonnements.sql", "144_boutique_remboursements.sql", "146_boutique_factures.sql", "147_boutique_telechargements.sql", "148_boutique_taxes_expedition.sql", "150_boutique_paniers_abandonnes.sql", "151_boutique_passerelles.sql", "152_boutique_promotions.sql"],
  entry: { service: "src/marketing/shop/store.js", admin: "src/marketing/web/shopAdmin.js", public: "src/marketing/web/shopPublic.js" },
  // Administration : écrans d'un site (/site-web/sites/N/boutique…), du principal (/site-web/principal/boutique, /site-web/boutique…) et les revenus. Le préfixe d'espace est retiré avant la comparaison (voir runtime.extensionPath).
  adminRoutes: ["^\\/revenus(?:\\/|$)", "^\\/boutique(?:\\/|$)", "^\\/site-web\\/boutique(?:\\/|$)"],
  publicRoutes: ["^\\/boutique(?:\\/|$)"],
  menus: [{ key: "boutique", label: "Boutique", icon: "cart", items: [
    { key: "boutique", label: "Produits", href: "/marketing/site-web/boutique", permission: "shop.read", primary: { label: "Nouveau produit", href: "/marketing/site-web/boutique/produits/nouveau", permission: "shop.write" } },
    { key: "boutique/commandes", label: "Commandes", href: "/marketing/site-web/boutique/commandes", permission: "shop.read" },
    { key: "boutique/clients", label: "Clients", href: "/marketing/site-web/boutique/clients", permission: "shop.read" },
    { key: "boutique/reglages", label: "Réglages de la boutique", href: "/marketing/site-web/boutique/reglages", permission: "shop.read" },
  ] }],
  settings: [], events: ["shop.order.created", "shop.order.paid", "shop.order.refunded"], hooks: [], tasks: [], resources: {}, docs: "docs/boutique/GUIDE_ADMINISTRATION.md",
};
