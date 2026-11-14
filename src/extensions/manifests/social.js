module.exports = {
  id: "social", name: "Réseaux sociaux", description: "Comptes de réseaux sociaux connectés, publications programmées et suivi, site par site.",
  accent: "#E0457B", added: "2026-11-14", features: ["Publication sur les réseaux connectés", "Planification des publications", "Comptes sociaux propres à chaque site"],
  icon: "network", version: "1.0.0", publisher: "Kolakisa", category: "marketing", availability: "available", maintenance: "stable", scope: "always_on_primary", phase: "R7-6.3",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [],
  entry: { admin: "src/marketing/web/social.js" },
  adminRoutes: ["^\\/reseaux(?:\\/|$)"], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/03_CATALOGUE_DES_EXTENSIONS.md",
};
