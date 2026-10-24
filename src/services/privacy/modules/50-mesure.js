// Mesure d'audience du site principal (visites suivies après consentement)
module.exports = {
  id: "analytics", title: "Statistiques et mesure d'audience", source: "Kolakisa — Mesure", order: 50,
  intro: "Kolakisa ne suit les visites du site principal qu'avec le consentement du visiteur (bandeau de cookies).",
  collects: ["Pages vues et clics des visiteurs ayant accepté la mesure", "Identifiant de visiteur pseudonyme (cookie)", "Source de la visite"],
  verify: ["Les outils d'analyse que vous avez ajoutés vous-même (Google Analytics, pixels publicitaires…) : Kolakisa ne peut pas les détecter.", "La durée de conservation des visites suivies.", "Le texte et le fonctionnement du bandeau de consentement."],
  document: ["La liste des cookies et leur durée.", "Les outils de mesure réellement utilisés, ou « aucun ».", "Comment retirer son consentement."],
  detect(env) {
    if (!env.main) return { status: "not_detected", facts: [] };
    const row = env.db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'cms.analytics_retention_days'").get(env.organizationId);
    const days = row && /^\d+$/.test(row.value) ? Number(row.value) : 395;
    return { status: "detected", facts: [`Suivi des visites après consentement, conservé ${days} jours`] };
  },
  link: (env) => (env.main ? { label: "Durée de conservation des visites (réglage ci-dessus)", href: "#reglages-conservation" } : null),
};
