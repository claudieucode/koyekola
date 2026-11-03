// Catalogue des thèmes de Kolakisa : la SEULE source de thèmes installables avec les paquets importés. Un thème est un paquet de
// DONNÉES (jetons du design system, voir pages/tokens.js) : aucun code, aucun script, aucune ressource externe n'est jamais exécuté ou chargé.
// Le manifeste est validé strictement (champs connus, tailles bornées, jetons revalidés par le moteur de design) avant toute installation.
const crypto = require("crypto");
const tokensLib = require("../pages/tokens");
const { UserError } = require("../../utils/errors");

const THEME_API = 1; // version du format de manifeste comprise par ce moteur
const MAX_PACKAGE_BYTES = 64 * 1024;
const KEY = /^[a-z][a-z0-9-]{1,39}$/;
const SEMVER = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;
const DEFAULT_KEY = "kolakisa";
const KNOWN = new Set(["key", "name", "version", "author", "description", "api", "tokens"]);

const text = (v, max, label, { required = false } = {}) => {
  const s = typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim() : "";
  if (required && !s) throw new UserError(`Paquet de thème invalide : « ${label} » est obligatoire.`);
  if (s.length > max) throw new UserError(`Paquet de thème invalide : « ${label} » dépasse ${max} caractères.`);
  return s;
};

// Manifeste → manifeste propre (jetons complets et valides), ou UserError explicite. Ne lit que des champs connus : tout champ inconnu est refusé.
function validateManifest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new UserError("Paquet de thème invalide : un objet JSON est attendu.");
  for (const k of Object.keys(input)) if (!KNOWN.has(k)) throw new UserError(`Paquet de thème invalide : le champ « ${String(k).slice(0, 30)} » n'est pas reconnu (un thème ne contient que des données de design).`);
  const key = text(input.key, 40, "key", { required: true }).toLowerCase();
  if (!KEY.test(key)) throw new UserError("Paquet de thème invalide : « key » = lettres minuscules, chiffres et tirets (2 à 40 caractères, commence par une lettre).");
  if (key === DEFAULT_KEY) throw new UserError("Paquet de thème invalide : l'identifiant « kolakisa » est réservé au thème d'origine.");
  const version = text(input.version, 12, "version", { required: true });
  if (!SEMVER.test(version)) throw new UserError("Paquet de thème invalide : « version » doit avoir la forme 1.0.0.");
  const api = input.api === undefined ? THEME_API : Number(input.api);
  if (!Number.isInteger(api) || api < 1) throw new UserError("Paquet de thème invalide : « api » doit être un entier positif.");
  if (!input.tokens || typeof input.tokens !== "object" || Array.isArray(input.tokens)) throw new UserError("Paquet de thème invalide : « tokens » (jetons du design) est obligatoire.");
  let tokens;
  try { tokens = tokensLib.normalizeTokens(input.tokens, { strict: true }); } catch (e) { throw new UserError(`Paquet de thème invalide : ${e.message}`); }
  return { key, name: text(input.name, 60, "name", { required: true }), version, author: text(input.author, 60, "author") || "Auteur non précisé", description: text(input.description, 280, "description"), api, tokens };
}

// Paquet reçu (texte JSON) → manifeste validé
function parsePackage(raw) {
  const s = String(raw ?? "");
  if (!s.trim()) throw new UserError("Collez le contenu du paquet de thème (JSON) ou choisissez son fichier.");
  if (Buffer.byteLength(s, "utf8") > MAX_PACKAGE_BYTES) throw new UserError(`Paquet trop volumineux : ${MAX_PACKAGE_BYTES / 1024} Ko au plus.`);
  let data;
  try { data = JSON.parse(s); } catch { throw new UserError("Paquet de thème invalide : ce n'est pas du JSON valide."); }
  return validateManifest(data);
}

const checksumOf = (manifest) => crypto.createHash("sha256").update(JSON.stringify(manifest)).digest("hex");

// Thème d'origine (intégré au moteur) : les jetons par défaut du design system
const ORIGINAL = Object.freeze({
  key: DEFAULT_KEY, name: "Kolakisa — d'origine", version: "1.0.0", author: "Équipe Kolakisa", api: THEME_API,
  description: "L'apparence d'origine de Kolakisa : bleu marine, fond clair, titres Bricolage Grotesque.", tokens: tokensLib.normalizeTokens({}),
});

// Refonte : plus aucun thème codé en dur. Le catalogue = les 360 thèmes de la bibliothèque. Les sites qui avaient installé un ancien thème (ocean, ardoise, savane, foret, editorial…) le gardent : chaque site conserve son instantané de manifeste.
const RAW = [];
// Bibliothèque de thèmes complets (themes/library) : ses manifestes (jetons) rejoignent le catalogue ; les cinq thèmes historiques gardent leur identifiant (une fiche de la bibliothèque de même clé les remplace)
const library = require("./library");
const fromLibrary = new Set(library.manifests().map((m) => m.key));
const CATALOG = Object.freeze([...RAW.filter((m) => !fromLibrary.has(m.key)), ...library.manifests()].map((m) => Object.freeze(validateManifest(m))));

const catalog = () => CATALOG;
const fromCatalog = (key) => CATALOG.find((m) => m.key === key) || null;

// Compatibilité avec ce moteur : un paquet d'une version de format plus récente que celle comprise n'est pas activable
const isCompatible = (manifest) => Number(manifest.api) <= THEME_API;

module.exports = { THEME_API, DEFAULT_KEY, MAX_PACKAGE_BYTES, ORIGINAL, validateManifest, parsePackage, checksumOf, catalog, fromCatalog, isCompatible };
