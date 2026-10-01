// Webhooks sortants : points d'accès, catalogue d'événements, livraison (jalon M5 — Intégrations, partie 2).
module.exports = { ...require("./endpoints"), ...require("./catalog"), ...require("./delivery") };
