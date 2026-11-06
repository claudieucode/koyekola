// Crée le catalogue de démonstration d'un thème de boutique dans une boutique de TEST (jamais sur celle d'un client sans action explicite).
// Usage : node scripts/boutique-demo.js <cle-du-theme> <organisation> [site]    (site absent = boutique du site principal)
const path = require("node:path");
const key = process.argv[2], org = Number(process.argv[3]), site = process.argv[4] ? Number(process.argv[4]) : null;
if (!/^[a-z][a-z0-9-]+$/.test(key || "") || !org) { console.error("Usage : node scripts/boutique-demo.js <cle-du-theme> <organisation> [site]"); process.exit(1); }
const db = require("../src/config/database");
const demo = require(path.join("..", "src", "marketing", "themes", "packs", key, "demo.js"));
const ids = require("../src/marketing/themes/packs/shopkit").seed({ db, organizationId: org, siteId: site }, demo);
console.log(`${ids.length} produits de démonstration créés (thème ${key}).`);
