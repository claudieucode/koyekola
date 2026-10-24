// Formulaires publiés du site (mk_forms.site_id : NULL = site principal)
module.exports = {
  id: "forms", title: "Formulaires", source: "Kolakisa — Formulaires", order: 10,
  intro: "Un formulaire publié collecte au minimum une adresse e-mail et enregistre le texte de consentement affiché.",
  collects: ["Adresse e-mail (toujours demandée)", "Champs facultatifs configurés dans chaque formulaire", "Preuve de consentement : texte présenté, date, adresse IP tronquée"],
  verify: ["Les champs réellement demandés par chaque formulaire.", "Le texte de consentement affiché, et ce qui est envoyé ensuite (e-mails, listes).", "Qui peut consulter les réponses.", "Combien de temps les contacts et leurs preuves sont conservés."],
  document: ["La finalité de chaque formulaire.", "Les destinataires des données (équipe, prestataire d'e-mailing).", "Comment se désinscrire ou demander l'effacement."],
  detect(env) {
    const n = env.count("SELECT COUNT(*) AS n FROM mk_forms WHERE organization_id = ? AND site_id IS ? AND status = 'published'", env.organizationId, env.siteId);
    return n ? { status: "detected", facts: [`${n} formulaire${n > 1 ? "s" : ""} publié${n > 1 ? "s" : ""}`] } : { status: "not_detected", facts: [] };
  },
  link: () => ({ label: "Ouvrir les formulaires", href: "/marketing/formulaires" }),
};
