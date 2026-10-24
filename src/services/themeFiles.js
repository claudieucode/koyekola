// KOLAKISA CMS → Apparence → Éditeur de fichiers des thèmes : lecture, écriture et historique des « fichiers » d'un thème.
//
// ARCHITECTURE. Un thème Kolakisa est un paquet de DONNÉES (manifeste + jetons du design system, voir marketing/themes/catalog.js) : il n'existe
// aucun fichier PHP, aucun script et aucun accès au système de fichiers. Les « fichiers » présentés ici sont donc des VUES JSON VIRTUELLES du manifeste
// d'un thème installé sur un site précis (theme.json, tokens/*.json) et une feuille CSS GÉNÉRÉE en lecture seule (compiled/style.css). Aucun chemin n'est
// jamais résolu sur le disque : un chemin n'est valable que s'il figure, caractère pour caractère, dans la liste fermée FILES — la traversée de répertoires,
// les liens symboliques et les fichiers sensibles n'ont donc aucune surface d'attaque.
// Enregistrer = reconstruire le manifeste, le faire valider par le moteur de thèmes (catalog.validateManifest, la même validation que l'import d'un paquet),
// puis l'écrire en une transaction avec l'historique (themes.saveManifest). Si le thème est actif, ses jetons sont appliqués au rendu et vérifiés.
// Portée : chaque appel porte sur UN site précis fourni par l'appelant (contexte vérifié de la requête). Les droits sont contrôlés par les routes.
const crypto = require("crypto");
const db = require("../config/database");
const catalog = require("../marketing/themes/catalog");
const tokensLib = require("../marketing/pages/tokens");
const themes = require("./themes");
const { sameScope } = require("./siteScope");
const { UserError } = require("../utils/errors");

const MAX_FILE_BYTES = 64 * 1024;
const MAX_REVISIONS = 50;
const META_KEYS = ["key", "name", "version", "author", "description", "api"];
const KEY = /^[a-z][a-z0-9-]{1,39}$/;

// Liste FERMÉE des fichiers d'un thème. `keys` : groupes de jetons portés par le fichier ; `generated` : calculé, jamais écrit.
const FILES = [
  { path: "theme.json", language: "json", label: "Identité du thème", meta: true },
  { path: "tokens/colors.json", language: "json", label: "Couleurs", keys: ["colors", "customColors"] },
  { path: "tokens/typography.json", language: "json", label: "Typographie", keys: ["fonts", "type", "link", "list"] },
  { path: "tokens/components.json", language: "json", label: "Boutons, images et formulaires", keys: ["buttons", "images", "forms"] },
  { path: "tokens/layout.json", language: "json", label: "Espacements, rayons, ombres et bordures", keys: ["space", "radius", "shadow", "border", "sizes"] },
  { path: "compiled/style.css", language: "css", label: "Feuille de style générée", generated: true },
];
const fileDef = (p) => (typeof p === "string" ? FILES.find((f) => f.path === p) : undefined) || null;
const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const scope = (siteId) => { if (siteId === null || siteId === undefined) return null; if (Number.isInteger(siteId) && siteId > 0) return siteId; throw new TypeError("Site invalide."); };
const pretty = (o) => `${JSON.stringify(o, null, 2)}\n`;

function serialize(def, manifest) {
  if (def.generated) {
    const css = tokensLib.tokensToCss(tokensLib.normalizeTokens(manifest.tokens || {}, { strict: false }));
    return `/* Feuille générée à partir des jetons du thème « ${manifest.name} » : lecture seule.\n   Pour la changer, modifiez les fichiers tokens/*.json. */\n${css}\n`;
  }
  if (def.meta) return pretty(Object.fromEntries(META_KEYS.map((k) => [k, manifest[k]])));
  return pretty(Object.fromEntries(def.keys.map((k) => [k, (manifest.tokens || {})[k]])));
}

function load(siteId, key) {
  if (!KEY.test(String(key))) throw new UserError("Thème inconnu.");
  const m = themes.manifestOf(siteId, String(key));
  if (!m) throw new UserError("Ce thème n'est pas installé sur ce site.");
  return m;
}

const describe = (def, manifest, builtin) => {
  const content = serialize(def, manifest);
  return { path: def.path, name: def.path.split("/").pop(), dir: def.path.includes("/") ? def.path.split("/").slice(0, -1).join("/") : "", label: def.label, language: def.language,
    editable: !def.generated && !builtin, generated: Boolean(def.generated), bytes: Buffer.byteLength(content, "utf8") };
};

// Arborescence autorisée d'un thème de CE site
function tree(siteId, key) {
  const { manifest, builtin, active, source } = load(siteId, key);
  return { theme: { key: manifest.key, name: manifest.name, version: manifest.version, author: manifest.author, active, builtin, source }, files: FILES.map((d) => describe(d, manifest, builtin)) };
}

// Contenu d'un fichier + empreinte (utilisée pour détecter un conflit d'écriture)
function read(siteId, key, path) {
  const def = fileDef(path);
  if (!def) throw new UserError("Fichier introuvable dans ce thème.");
  const { manifest, builtin } = load(siteId, key);
  const content = serialize(def, manifest);
  return { ...describe(def, manifest, builtin), content, etag: sha(content) };
}

// ---------- Historique ----------
const revRows = (siteId, key, path) => db.prepare(`SELECT r.id, r.note, r.created_at, r.etag, length(r.content) bytes, u.username FROM cms_theme_revisions r LEFT JOIN users u ON u.id = r.created_by
  WHERE ${sameScope("r.site_id")} AND r.theme_key = ? AND r.file_path = ? ORDER BY r.id DESC LIMIT 20`).all(scope(siteId), String(key), path);
function revisions(siteId, key, path) {
  const def = fileDef(path);
  if (!def || def.generated) return [];
  load(siteId, key);
  return revRows(siteId, key, path).map((r) => ({ id: r.id, note: r.note, at: r.created_at, by: r.username || "Système", bytes: r.bytes, etag: r.etag }));
}
function revision(siteId, key, path, id) {
  const def = fileDef(path);
  if (!def || def.generated || !Number.isInteger(id) || id < 1) throw new UserError("Version introuvable.");
  load(siteId, key);
  const r = db.prepare(`SELECT id, content, note, created_at FROM cms_theme_revisions WHERE ${sameScope("site_id")} AND theme_key = ? AND file_path = ? AND id = ?`).get(scope(siteId), String(key), path, id);
  if (!r) throw new UserError("Version introuvable.");
  return { id: r.id, content: r.content, note: r.note, at: r.created_at, etag: sha(r.content) };
}

// ---------- Écriture ----------
const jsonError = (e) => `JSON invalide : ${String(e.message).replace(/\s+/g, " ").slice(0, 160)}.`;
function candidate(def, manifest, content) {
  let data;
  try { data = JSON.parse(content); } catch (e) { throw new UserError(jsonError(e)); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new UserError("Le fichier doit contenir un objet JSON ({ … }).");
  const allowed = def.meta ? META_KEYS : def.keys;
  for (const k of Object.keys(data)) if (!allowed.includes(k)) throw new UserError(`Le champ « ${String(k).slice(0, 30)} » n'appartient pas à ${def.path}.`);
  for (const k of allowed) if (!(k in data)) throw new UserError(`Le champ « ${k} » est obligatoire dans ${def.path}.`);
  if (def.meta) {
    if (data.key !== manifest.key) throw new UserError("L'identifiant (« key ») d'un thème ne peut pas être modifié.");
    return { ...manifest, ...data, tokens: manifest.tokens };
  }
  return { ...manifest, tokens: { ...manifest.tokens, ...data } };
}

/**
 * Enregistre un fichier. `etag` = empreinte du contenu telle que lue à l'ouverture : si le fichier a changé depuis, l'écriture est refusée (conflit).
 * Renvoie le contenu CANONIQUE enregistré (le moteur normalise les jetons) et sa nouvelle empreinte.
 */
function write(ctx, siteId, key, path, content, etag, { note = "" } = {}) {
  const def = fileDef(path);
  if (!def) throw new UserError("Fichier introuvable dans ce thème.");
  if (def.generated) throw new UserError("Ce fichier est généré à partir des jetons : il n'est pas modifiable.");
  const { manifest, builtin, row } = load(siteId, key);
  if (builtin || !row) throw new UserError("Le thème d'origine de Kolakisa est intégré au moteur : il se consulte mais ne se modifie pas. Installez une copie ou un autre thème pour le personnaliser.");
  if (typeof content !== "string") throw new UserError("Contenu invalide.");
  if (content.includes("\u0000")) throw new UserError("Le contenu contient des caractères binaires : enregistrement refusé.");
  if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) throw new UserError(`Fichier trop volumineux : ${MAX_FILE_BYTES / 1024} Ko au plus.`);
  const current = serialize(def, manifest);
  if (typeof etag !== "string" || etag !== sha(current)) {
    const err = new UserError("Ce fichier a été modifié depuis son ouverture (par vous dans un autre onglet, ou par une autre personne). Rechargez-le avant d'enregistrer ; votre texte reste dans l'éditeur pour être comparé.");
    err.code = "conflit";
    throw err;
  }
  const next = candidate(def, manifest, content);
  let valid;
  try { valid = catalog.validateManifest(next); } catch (e) { throw new UserError(String(e.message).replace(/^Paquet de thème invalide : /, "Thème invalide : ")); }
  if (Buffer.byteLength(JSON.stringify(valid), "utf8") > catalog.MAX_PACKAGE_BYTES) throw new UserError("Le thème dépasserait la taille maximale d'un thème.");
  const saved = serialize(def, valid);
  const savedEtag = sha(saved);
  if (savedEtag === sha(current)) return { changed: false, content: saved, etag: savedEtag, ...describe(def, valid, false) };
  themes.saveManifest(ctx, siteId, key, valid, {
    revisions: () => {
      // Première modification de ce fichier : on garde d'abord la version d'origine, pour pouvoir y revenir
      if (!db.prepare(`SELECT 1 FROM cms_theme_revisions WHERE ${sameScope("site_id")} AND theme_key = ? AND file_path = ? LIMIT 1`).get(scope(siteId), String(key), path)) {
        db.prepare("INSERT INTO cms_theme_revisions (site_id, theme_key, file_path, content, etag, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(scope(siteId), String(key), path, current, sha(current), "Version d'origine", ctx.userId ?? null);
      }
      db.prepare("INSERT INTO cms_theme_revisions (site_id, theme_key, file_path, content, etag, note, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(scope(siteId), String(key), path, saved, savedEtag, String(note).slice(0, 80), ctx.userId ?? null);
      db.prepare(`DELETE FROM cms_theme_revisions WHERE ${sameScope("site_id")} AND theme_key = ? AND file_path = ? AND id NOT IN (SELECT id FROM cms_theme_revisions WHERE ${sameScope("site_id")} AND theme_key = ? AND file_path = ? ORDER BY id DESC LIMIT ${MAX_REVISIONS})`)
        .run(scope(siteId), String(key), path, scope(siteId), String(key), path);
    },
  });
  return { changed: true, content: saved, etag: savedEtag, ...describe(def, valid, false) };
}

// Restaure une version précédente (le résultat est une NOUVELLE version : l'historique n'est jamais réécrit)
function restore(ctx, siteId, key, path, id, etag) {
  const r = revision(siteId, key, path, id);
  return write(ctx, siteId, key, path, r.content, etag, { note: `Restauration de la version du ${String(r.at).slice(0, 16)}` });
}

module.exports = { FILES, MAX_FILE_BYTES, tree, read, write, restore, revisions, revision };
