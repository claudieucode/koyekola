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

const RAW = [
  { key: "ocean", name: "Océan", version: "1.0.0", author: "Équipe Kolakisa", description: "Bleus profonds et fond glacé : sobre, lumineux, adapté aux sites de formation.",
    tokens: { colors: { primary: "#0b6e99", secondary: "#073b4c", accent: "#06b6a4", background: "#eff9fd", surface: "#ffffff", text: "#0c2230", muted: "#4d6675" }, border: { width: 1, color: "#c5dfeb" } } },
  { key: "ardoise", name: "Ardoise sombre", version: "1.0.0", author: "Équipe Kolakisa", description: "Thème sombre à fort contraste : fond ardoise, texte clair, accent bleu ciel.",
    tokens: { colors: { primary: "#38bdf8", secondary: "#0b1220", accent: "#fbbf24", background: "#0f172a", surface: "#1e293b", text: "#e2e8f0", muted: "#9fb0c6" }, border: { width: 1, color: "#334155" }, shadow: { card: "lg", button: "none" } } },
  { key: "savane", name: "Savane", version: "1.0.0", author: "Équipe Kolakisa", description: "Tons chauds de terre et d'ocre, titres en Georgia : un site chaleureux et éditorial.",
    tokens: { colors: { primary: "#b45309", secondary: "#3b2412", accent: "#4d7c0f", background: "#fbf5ea", surface: "#fffdf8", text: "#2a1b0e", muted: "#6f5a45" }, fonts: { heading: "georgia", body: "figtree", button: "figtree", link: "figtree" }, border: { width: 1, color: "#e6d6bd" } } },
  { key: "foret", name: "Forêt", version: "1.0.0", author: "Équipe Kolakisa", description: "Verts profonds et surfaces douces : calme, naturel, très lisible.",
    tokens: { colors: { primary: "#166534", secondary: "#052e16", accent: "#ca8a04", background: "#f1f8f3", surface: "#ffffff", text: "#10261a", muted: "#4b6556" }, radius: { sm: 8, md: 14, lg: 24, button: 999, field: 10, card: 20 }, border: { width: 1, color: "#cfe3d5" } } },
  { key: "editorial", name: "Éditorial", version: "1.0.0", author: "Équipe Kolakisa", description: "Mise en page de magazine : fond blanc, titres serif larges, angles francs.",
    tokens: { colors: { primary: "#9f1239", secondary: "#111827", accent: "#1d4ed8", background: "#ffffff", surface: "#f8fafc", text: "#111827", muted: "#4b5563" }, fonts: { heading: "georgia", body: "georgia", button: "figtree", link: "georgia" }, type: { h1: { size: 52, weight: 700, lineHeight: 1.1 }, h2: { size: 36, weight: 700, lineHeight: 1.15 } }, radius: { sm: 2, md: 4, lg: 6, button: 2, field: 2, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#d1d5db" } } },
];
// Bibliothèque de thèmes complets (themes/library) : ses manifestes (jetons) rejoignent le catalogue ; les cinq thèmes historiques gardent leur identifiant (une fiche de la bibliothèque de même clé les remplace)
const library = require("./library");
const fromLibrary = new Set(library.manifests().map((m) => m.key));
const CATALOG = Object.freeze([...RAW.filter((m) => !fromLibrary.has(m.key)), ...library.manifests()].map((m) => Object.freeze(validateManifest(m))));

const catalog = () => CATALOG;
const fromCatalog = (key) => CATALOG.find((m) => m.key === key) || null;

// Compatibilité avec ce moteur : un paquet d'une version de format plus récente que celle comprise n'est pas activable
const isCompatible = (manifest) => Number(manifest.api) <= THEME_API;

module.exports = { THEME_API, DEFAULT_KEY, MAX_PACKAGE_BYTES, ORIGINAL, validateManifest, parsePackage, checksumOf, catalog, fromCatalog, isCompatible };
