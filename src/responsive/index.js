// Responsive Intelligence Core (programme 22.8) : point d'entrée unique. Réutilise le moteur natif (nodes.pageCss, siteSettings.breakpoints, transformateur 22.3, historique 21.9).
module.exports = { fluid: require("./fluid"), breakpoints: require("./breakpoints"), audit: require("./audit"), browser: require("./browser"), apply: require("./apply") };
