// Comptes et inscriptions publiques : fonction de la plateforme (site principal)
module.exports = {
  id: "accounts", title: "Comptes et inscriptions", source: "Kolakisa — Comptes", order: 30,
  intro: "Lorsque les inscriptions publiques sont ouvertes, les visiteurs peuvent créer un compte (nom, e-mail, mot de passe protégé).",
  collects: ["Nom et adresse e-mail", "Mot de passe (stocké sous forme protégée, jamais en clair)", "Historique d'achats ou d'accès aux formations, le cas échéant"],
  verify: ["Si les inscriptions publiques sont ouvertes ou fermées.", "Ce que contient un compte et qui peut le consulter.", "Comment un compte est supprimé à la demande de la personne."],
  document: ["Les données du compte et leur finalité.", "La durée de conservation après la dernière activité."],
  detect(env) {
    if (!env.main) return { status: "not_detected", facts: [] };
    const row = env.db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'cms.registration_open'").get(env.organizationId);
    const open = !row || (row.value !== "false" && row.value !== "0");
    return { status: "detected", facts: [open ? "Inscriptions publiques ouvertes" : "Inscriptions publiques fermées (les comptes existants restent)"] };
  },
  link: (env) => (env.main ? { label: "Inscriptions publiques (Général)", href: `${env.settings}` } : null),
};
