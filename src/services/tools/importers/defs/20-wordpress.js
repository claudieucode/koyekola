const wordpress = require("../wordpress");
module.exports = {
  id: "wordpress", name: "WordPress", order: 20, kind: "file", version: "1.0",
  description: "Importer des articles, pages, commentaires, catégories et étiquettes depuis un fichier d'exportation WordPress (WXR, Outils → Exporter → Tout le contenu).",
  formats: [".xml"], mime: ["text/xml", "application/xml", "application/rss+xml", "text/plain"],
  supports: ["Articles", "Pages", "Commentaires approuvés, en attente ou indésirables", "Catégories (avec parents) et étiquettes", "Auteurs (avec correspondance à vos comptes)", "Dates d'origine", "Image mise en avant", "Médias (téléchargement facultatif)", "Titres et résumés SEO (Yoast)"],
  limits: ["Format WXR 1.0 à 1.2 seulement ; 5 000 éléments au plus par fichier.", "Types de contenu personnalisés, taxonomies personnalisées et champs personnalisés : signalés, non convertis.", "Hiérarchie des pages non conservée ; commentaires de pages non importés ; pings et rétroliens ignorés.", "Les codes courts et blocs d'extensions absentes restent dans le texte tels quels.", "Les mots de passe et jetons ne sont jamais importés ; aucun compte n'est créé (associez les auteurs à des comptes existants).", "Articles et pages arrivent en brouillon, sauf si vous demandez de publier ceux qui l'étaient (droit de publication requis)."],
  permissions: ["tools.import"], page: "wordpress", options: ["downloadMedia", "keepPublished"],
  convert: (input, opts) => wordpress.convert(input, opts),
};
