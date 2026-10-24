const feed = require("../feed");
module.exports = {
  id: "flux", name: "Flux (RSS / Atom)", order: 30, kind: "url", version: "1.0",
  description: "Importer des articles depuis un flux RSS 2.0 ou Atom : un fichier envoyé, ou une adresse que le serveur télécharge avec votre accord. Un aperçu précède toute création.",
  formats: [".xml", ".rss", ".atom"], mime: ["text/xml", "application/xml", "application/rss+xml", "application/atom+xml", "text/plain"],
  supports: ["Articles (titre, contenu, résumé, date)", "Étiquettes (depuis les catégories du flux)", "Auteur (correspondance à vos comptes)"],
  limits: ["500 articles au plus ; pas de commentaires, pas de pages.", "Un flux ne contient souvent que les derniers articles.", "Images jointes non téléchargées ; les liens d'images restent vers la source.", "Adresse téléchargée par le serveur : 10 Mo au plus, 15 s, adresses privées et locales refusées."],
  permissions: ["tools.import"], page: "flux", options: ["keepPublished"],
  convert: (input) => feed.convert(input),
};
