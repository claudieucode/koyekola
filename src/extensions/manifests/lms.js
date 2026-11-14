// Kolakisa LMS : les formations EXISTANTES (src/routes/courses|learning|instructor|cart|orders), intégrées sans réécriture. Identifiant technique stable : « lms ».
module.exports = {
  id: "lms", name: "Kolakisa LMS", description: "Formations en ligne : cours, chapitres, leçons, quiz, inscriptions, progression, certificats, paiements et gestion pédagogique.",
  accent: "#0E9F6E", added: "2026-11-14", features: ["Cours, chapitres, leçons et quiz", "Inscriptions et suivi de progression", "Certificats vérifiables", "Catalogue public et paiement des formations", "Espace formateur"],
  icon: "graduation", version: "1.0.0", publisher: "Kolakisa", category: "formation", availability: "available", maintenance: "stable", scope: "always_on_primary", phase: "Titan XXIII",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [],
  permissions: ["lms.manage"],
  migrations: ["core", "119_cours_par_site.sql"],
  entry: { service: "src/services/lmsSites.js", admin: "src/routes/instructor.js", public: "src/routes/courses.js" },
  adminRoutes: [],
  // Pages publiques et administration (/formateur) : sur le domaine d'un site sans l'extension, elles répondent « introuvable ». Le domaine, jamais la requête, désigne le site.
  publicRoutes: ["^\\/formateur(?:\\/|$)", "^\\/catalogue(?:\\/|$)", "^\\/categorie\\/", "^\\/cours\\/", "^\\/apprendre\\/", "^\\/certificat(?:\\/|$)", "^\\/mes-certificats(?:\\/|$)", "^\\/mes-cours(?:\\/|$)", "^\\/verifier-certificat(?:\\/|$)", "^\\/panier(?:\\/|$)", "^\\/commande(?:\\/|$)", "^\\/favoris\\/"],
  menus: [{ key: "formation", label: "Formation", icon: "graduation", items: [
    { key: "formation", label: "Mes formations", href: "/formateur", permission: "lms.manage", external: true },
  ] }],
  settings: [], events: ["lms.enrollment.created", "lms.certificate.issued"], hooks: [], tasks: [], resources: {}, docs: "docs/KOLAKISA_LMS_UNIVERSEL.md",
};
