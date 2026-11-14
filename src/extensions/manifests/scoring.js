module.exports = {
  id: "scoring", name: "Score des contacts", description: "Règles de score et classement des contacts selon leur activité, site par site.",
  icon: "activity", version: "1.0.0", publisher: "Kolakisa", category: "analyse", availability: "available", maintenance: "stable", scope: "always_on_primary", phase: "R7-6.4",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [],
  entry: { admin: "src/marketing/web/scoring.js" },
  adminRoutes: ["^\\/score(?:\\/|$)"], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/03_CATALOGUE_DES_EXTENSIONS.md",
};
