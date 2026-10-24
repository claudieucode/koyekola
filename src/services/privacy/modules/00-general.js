// Recommandations générales de Kolakisa : valables pour tout site, indépendantes des modules activés.
module.exports = {
  id: "general", title: "Recommandations générales", source: "Kolakisa", order: 0,
  intro: "Ces points s'appliquent à tout site. Ils ne dépendent d'aucune détection : c'est à vous de les confirmer.",
  collects: [],
  verify: ["Qui est le responsable du site, et comment le joindre.", "La liste réelle des données que le site et ses prestataires reçoivent.", "La finalité de chaque donnée et, si elle s'applique à vous, sa base juridique.", "Les durées de conservation, par catégorie de données.", "Comment une personne peut demander l'accès, la correction ou l'effacement de ses données.", "Les mesures de protection que vous appliquez réellement."],
  document: ["Le nom et les coordonnées du responsable.", "Les droits des personnes et la façon de les exercer.", "La date de dernière mise à jour du texte, et un rappel de le relire régulièrement."],
  detect: () => ({ status: "general", facts: [] }),
  link: (env) => ({ label: "Réglages généraux (e-mail administratif)", href: `${env.settings}${env.q}` }),
};
