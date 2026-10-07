// Widgets personnalisés : un widget = un fichier de description dans ce dossier (+ son gabarit d'affichage
// views/marketing-public/widgets/<type>.ejs et, si besoin, ses styles dans public/css/landing.css).
// Le moteur (nodes.js) en tire tout le reste : validation et nettoyage des réglages, fiche de bibliothèque, contenu de
// départ, champs de l'inspecteur, comptage des liens, versions (mise à niveau des pages existantes).
// Mode d'emploi : docs/widgets-personnalises.md.
const fs = require("fs");
const path = require("path");

// Types de champ : ce que le moteur sait valider (et l'inspecteur afficher). Rien d'autre n'atteint la page.
const KINDS = ["text", "textarea", "number", "select", "bool", "link", "image", "icon", "color"];
const TYPE = /^[a-z][a-z0-9]{2,30}$/;
const KEY = /^[a-z][a-zA-Z0-9]{0,30}$/;

// Vérifie une description de widget ; lève une erreur claire (au démarrage, jamais en pleine page) sinon
function check(def, where = "widget") {
  const bad = (m) => { throw new Error(`Widget personnalisé (${where}) : ${m}`); };
  if (!def || typeof def !== "object") bad("description absente.");
  if (!TYPE.test(String(def.type || ""))) bad("« type » : lettres minuscules et chiffres (3 à 31), commence par une lettre.");
  for (const k of ["label", "group", "icon", "keywords"]) if (typeof def[k] !== "string" || !def[k].trim()) bad(`« ${k} » obligatoire.`);
  if (!Number.isInteger(def.version) || def.version < 1) bad("« version » : entier, 1 ou plus.");
  if (def.style !== undefined && !["text", "box"].includes(def.style)) bad("« style » : text ou box.");
  if (!Array.isArray(def.schema) || !def.schema.length) bad("« schema » : au moins un champ.");
  const keys = new Set();
  for (const f of def.schema) {
    if (!KEY.test(String(f.key || ""))) bad(`champ « ${f.key} » : nom invalide.`);
    if (keys.has(f.key)) bad(`champ « ${f.key} » en double.`);
    keys.add(f.key);
    if (!KINDS.includes(f.kind)) bad(`champ « ${f.key} » : type « ${f.kind} » inconnu (${KINDS.join(", ")}).`);
    if (typeof f.label !== "string" || !f.label.trim()) bad(`champ « ${f.key} » : libellé obligatoire.`);
    if (f.kind === "select" && (!Array.isArray(f.options) || !f.options.length || !f.options.every((o) => Array.isArray(o) && o.length === 2))) bad(`champ « ${f.key} » : options [[valeur, libellé], …] obligatoires.`);
    if (f.kind === "number" && !(Number.isFinite(f.min) && Number.isFinite(f.max) && f.min < f.max)) bad(`champ « ${f.key} » : bornes min et max obligatoires.`);
    // Le contenu de départ doit être valide : un champ obligatoire a une valeur par défaut (sauf image, demandée à part)
    if (f.required && (f.default === undefined || f.default === "")) bad(`champ « ${f.key} » obligatoire sans valeur par défaut.`);
  }
  for (let v = 2; v <= def.version; v++) if (!def.migrate || typeof def.migrate[v] !== "function") bad(`version ${def.version} : il manque migrate[${v}] (réglages de la version ${v - 1} → ${v}).`);
  return def;
}

// Widgets du dossier (ordre alphabétique des fichiers) ; chacun doit avoir son gabarit d'affichage
function load() {
  return fs.readdirSync(__dirname).filter((f) => f.endsWith(".js") && f !== "index.js").sort().map((f) => {
    const def = check(require(path.join(__dirname, f)), f);
    if (!fs.existsSync(path.join(__dirname, "../../../../views/marketing-public/widgets", `${def.type}.ejs`))) throw new Error(`Widget personnalisé (${f}) : gabarit views/marketing-public/widgets/${def.type}.ejs introuvable.`);
    return def;
  });
}

module.exports = { KINDS, check, load };
