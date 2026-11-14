module.exports = {
  id: "ai", name: "Intelligence artificielle", description: "Assistant de création de site, générateurs de contenus et de pages, avec quotas et validation avant publication.",
  icon: "sparkles", version: "1.0.0", publisher: "Kolakisa", category: "ia", availability: "available", maintenance: "stable", scope: "always_on_primary", phase: "R7-6.2",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [],
  entry: { admin: "src/marketing/web/ai.js" },
  adminRoutes: ["^\\/ia(?:\\/|$)"], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/03_CATALOGUE_DES_EXTENSIONS.md",
};
