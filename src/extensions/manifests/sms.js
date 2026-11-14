module.exports = {
  id: "sms", name: "SMS", description: "Campagnes de SMS, contacts joignables, désinscriptions et journal d'envoi, site par site.",
  accent: "#0A8FCB", added: "2026-11-14", features: ["Campagnes de SMS", "Contacts joignables et désinscriptions", "Journal d'envoi par site"],
  icon: "smartphone", version: "1.0.0", publisher: "Kolakisa", category: "communication", availability: "available", maintenance: "stable", scope: "always_on_primary", phase: "R7-6.1",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [],
  entry: { admin: "src/marketing/web/sms.js" },
  adminRoutes: ["^\\/(?:sms(?:\\/|$)|contacts\\/\\d+\\/sms(?:\\/|$))"], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/03_CATALOGUE_DES_EXTENSIONS.md",
};
