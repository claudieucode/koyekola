// Contacts et e-mails marketing (organisation, site principal)
module.exports = {
  id: "emailing", title: "Communications et newsletters", source: "Kolakisa — Emailing", order: 60,
  intro: "Les contacts enregistrés peuvent recevoir des e-mails marketing avec preuve de consentement et liste de désinscription.",
  collects: ["Adresse e-mail et informations du contact", "Historique des envois, ouvertures et clics", "Preuves de consentement et désinscriptions"],
  verify: ["Le prestataire qui envoie les e-mails.", "Si les ouvertures et clics sont suivis.", "Comment une personne se désinscrit ou demande l'effacement."],
  document: ["La finalité des envois et leur fréquence.", "La durée de conservation des contacts inactifs."],
  detect(env) {
    if (!env.main) return { status: "not_detected", facts: [] };
    const n = env.count("SELECT COUNT(*) AS n FROM mk_contacts WHERE organization_id = ?", env.organizationId);
    return n ? { status: "detected", facts: [`${n} contact${n > 1 ? "s" : ""} enregistré${n > 1 ? "s" : ""}`] } : { status: "not_detected", facts: [] };
  },
  link: (env) => (env.main ? { label: "Réglages d'emailing", href: `${env.settings}/emailing` } : null),
};
