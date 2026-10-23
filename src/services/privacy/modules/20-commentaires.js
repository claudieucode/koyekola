// Commentaires des articles : fonction de la plateforme (site principal) ; les sites du CMS n'ont pas de commentaires
module.exports = {
  id: "comments", title: "Commentaires", source: "Kolakisa — Commentaires", order: 20,
  intro: "Les commentaires des articles du blog enregistrent un nom, une adresse e-mail et le texte publié.",
  collects: ["Nom et adresse e-mail du commentateur", "Texte du commentaire", "Date et état de modération"],
  verify: ["Si les invités peuvent commenter ou seulement les comptes connectés.", "Si l'adresse e-mail est affichée ou seulement conservée.", "Combien de temps les commentaires (et ceux en corbeille) sont conservés."],
  document: ["L'usage de l'adresse e-mail des commentateurs.", "La procédure pour faire retirer un commentaire."],
  detect(env) {
    if (!env.main) return { status: "not_detected", facts: [] };
    const n = env.count("SELECT COUNT(*) AS n FROM blog_comments");
    return n ? { status: "detected", facts: [`${n} commentaire${n > 1 ? "s" : ""} enregistré${n > 1 ? "s" : ""}`] } : { status: "not_detected", facts: [] };
  },
  link: (env) => (env.main ? { label: "Réglages des commentaires", href: `${env.settings}/commentaires` } : null),
};
