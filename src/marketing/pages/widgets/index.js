// Widgets personnalisés : un widget = un fichier de description dans ce dossier (+ son gabarit d'affichage
// views/marketing-public/widgets/<type>.ejs et, si besoin, ses styles dans public/css/landing.css).
// Le moteur (nodes.js) en tire tout le reste : validation et nettoyage des réglages, fiche de bibliothèque, contenu de
// départ, champs de l'inspecteur, comptage des liens, versions (mise à niveau des pages existantes).
// Mode d'emploi : docs/widgets-personnalises.md.
const fs = require("fs");
const path = require("path");

// Types de champ : ce que le moteur sait valider (et l'inspecteur afficher). Rien d'autre n'atteint la page.
// « items » : liste d'éléments répétés (diapositives, liens, témoignages…), chacun décrit par des sous-champs « simples » (jamais une liste dans une liste)
const KINDS = ["text", "textarea", "number", "select", "bool", "link", "image", "icon", "color", "items"];
const SCALAR_KINDS = KINDS.filter((k) => k !== "items");
const STATUSES = ["operational", "partial", "dependency"];
const TYPE = /^[a-z][a-z0-9]{2,30}$/;
const KEY = /^[a-z][a-zA-Z0-9]{0,30}$/;
const TEMPLATE = /^[a-z][a-z0-9-]{2,40}$/; // gabarit views/marketing-public/widgets/<template>.ejs (les composants Motion Studio : motion-<nom>)

// Vérifie une description de widget ; lève une erreur claire (au démarrage, jamais en pleine page) sinon
function check(def, where = "widget") {
  const bad = (m) => { throw new Error(`Widget personnalisé (${where}) : ${m}`); };
  if (!def || typeof def !== "object") bad("description absente.");
  if (!TYPE.test(String(def.type || ""))) bad("« type » : lettres minuscules et chiffres (3 à 31), commence par une lettre.");
  for (const k of ["label", "group", "icon", "keywords"]) if (typeof def[k] !== "string" || !def[k].trim()) bad(`« ${k} » obligatoire.`);
  if (!Number.isInteger(def.version) || def.version < 1) bad("« version » : entier, 1 ou plus.");
  if (def.data !== undefined && typeof def.data !== "function") bad("« data » : fonction (ctx, réglages, env) → données pour le gabarit.");
  if (def.complete !== undefined && typeof def.complete !== "function") bad("« complete » : fonction (réglages) → message si le widget est incomplet pour la PUBLICATION (le brouillon, lui, reste enregistrable), sinon rien.");
  if (def.validate !== undefined && typeof def.validate !== "function") bad("« validate » : fonction (réglages validés, lieu) qui lève une erreur claire si l'ensemble est incohérent (ex. adresse d'un service refusée).");
  if (def.template !== undefined && !TEMPLATE.test(String(def.template))) bad("« template » : nom de gabarit invalide (minuscules, chiffres et tirets).");
  if (def.motion !== undefined) require("../motionStudio").checkSpec(def.motion, where); // composant Motion Studio : module d'exécution, préréglages, réglages
  if (def.style !== undefined && !["text", "box"].includes(def.style)) bad("« style » : text ou box.");
  if (!Array.isArray(def.schema) || !def.schema.length) bad("« schema » : au moins un champ.");
  if (def.description !== undefined && (typeof def.description !== "string" || !def.description.trim() || def.description.length > 160)) bad("« description » : phrase courte (160 caractères au plus), affichée en infobulle dans la bibliothèque.");
  if (def.status !== undefined && !STATUSES.includes(def.status)) bad(`« status » : ${STATUSES.join(", ")}.`);
  if (def.dependencies !== undefined && (!Array.isArray(def.dependencies) || !def.dependencies.every((d) => typeof d === "string" && d.trim()))) bad("« dependencies » : liste de textes (ce que le widget exige : service, clé, formation…).");
  const checkField = (f, keys, nested) => {
    if (!KEY.test(String(f.key || ""))) bad(`champ « ${f.key} » : nom invalide.`);
    if (keys.has(f.key)) bad(`champ « ${f.key} » en double.`);
    keys.add(f.key);
    if (!(nested ? SCALAR_KINDS : KINDS).includes(f.kind)) bad(`champ « ${f.key} » : type « ${f.kind} » ${nested ? "non permis dans une liste" : "inconnu"} (${(nested ? SCALAR_KINDS : KINDS).join(", ")}).`);
    if (typeof f.label !== "string" || !f.label.trim()) bad(`champ « ${f.key} » : libellé obligatoire.`);
    if (f.kind === "select" && (!Array.isArray(f.options) || !f.options.length || !f.options.every((o) => Array.isArray(o) && o.length === 2))) bad(`champ « ${f.key} » : options [[valeur, libellé], …] obligatoires.`);
    if (f.kind === "number" && !(Number.isFinite(f.min) && Number.isFinite(f.max) && f.min < f.max)) bad(`champ « ${f.key} » : bornes min et max obligatoires.`);
    // Le contenu de départ doit être valide : un champ obligatoire a une valeur par défaut (sauf image, demandée à part)
    if (f.required && (f.default === undefined || f.default === "")) bad(`champ « ${f.key} » obligatoire sans valeur par défaut.`);
    if (f.kind === "items") {
      if (!Array.isArray(f.fields) || !f.fields.length) bad(`champ « ${f.key} » : « fields » (sous-champs de chaque élément) obligatoire.`);
      if (!Number.isInteger(f.max) || f.max < 1 || f.max > 24) bad(`champ « ${f.key} » : « max » (nombre d'éléments, 1 à 24) obligatoire.`);
      if (f.min !== undefined && (!Number.isInteger(f.min) || f.min < 0 || f.min > f.max)) bad(`champ « ${f.key} » : « min » entre 0 et « max ».`);
      if (f.default !== undefined && !Array.isArray(f.default)) bad(`champ « ${f.key} » : « default » est une liste d'éléments.`);
      if ((f.min || 0) > 0 && (!Array.isArray(f.default) || f.default.length < f.min)) bad(`champ « ${f.key} » : au moins ${f.min} élément(s) par défaut (le widget ajouté doit être valide).`);
      const sub = new Set();
      f.fields.forEach((sf) => checkField(sf, sub, true));
    }
  };
  const keys = new Set();
  for (const f of def.schema) checkField(f, keys, false);
  for (let v = 2; v <= def.version; v++) if (!def.migrate || typeof def.migrate[v] !== "function") bad(`version ${def.version} : il manque migrate[${v}] (réglages de la version ${v - 1} → ${v}).`);
  return def;
}

// Widgets du dossier (ordre alphabétique des fichiers) ; chacun doit avoir son gabarit d'affichage
function load() {
  const out = [];
  for (const f of fs.readdirSync(__dirname).filter((x) => x.endsWith(".js") && x !== "index.js").sort()) {
    const mod = require(path.join(__dirname, f));
    // Un fichier peut déclarer plusieurs widgets d'une même famille (liste de descriptions)
    for (const raw of Array.isArray(mod) ? mod : [mod]) {
      const def = check(raw, f);
      const tpl = def.template || def.type;
      if (!fs.existsSync(path.join(__dirname, "../../../../views/marketing-public/widgets", `${tpl}.ejs`))) throw new Error(`Widget personnalisé (${f}) : gabarit views/marketing-public/widgets/${tpl}.ejs introuvable.`);
      out.push(def);
    }
  }
  return out;
}

module.exports = { KINDS, SCALAR_KINDS, STATUSES, check, load };
