// Audit des médias (lecture seule : ne modifie et ne supprime JAMAIS rien).
// 1. Emplacement réel des fichiers envoyés : dossier conservé, ou dossier de l'application (perdu au prochain déploiement).
// 2. Chaque référence à un fichier envoyé (articles, pages, formations, leçons, profils, médiathèques, e-mails) classée :
//    VALID (fichier présent) · MISSING (fichier absent) · TEMPORARY_URL (blob:, data:, localhost) · EXTERNAL (autre site).
// 3. Fiches de médiathèque sans fichier, et fichiers présents sans fiche (ORPHAN : signalés, jamais supprimés).
// Utilisé au démarrage (résumé dans les journaux du serveur) et par `npm run audit:medias` (rapport détaillé).
const fs = require("fs");
const path = require("path");
const paths = require("./paths");
// Chargé à la demande : storage dépend de paths, déjà chargé ici
const storage = require("../utils/storage");

const UPLOAD_RE = /(?:https?:\/\/[^"'\s)<>]*?)?(\/uploads\/[A-Za-z0-9_.\/-]+\.[A-Za-z0-9]{2,5})/g;
const TEMP_RE = /(blob:[^"'\s)<>]+|data:image\/[^"'\s)<>]{0,40}|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/[^"'\s)<>]+)/g;

// Le dossier des fichiers est-il DANS le dossier de l'application (remplacé à chaque déploiement chez Hostinger) ?
function storageInfo({ uploadsRoot = paths.uploadsRoot, projectRoot = paths.projectRoot, dataDir = paths.dataDir } = {}) {
  const real = (p) => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
  const up = real(uploadsRoot), proj = real(projectRoot), data = real(dataDir);
  const inside = (child, parent) => child === parent || child.startsWith(parent + path.sep);
  return { uploadsRoot: up, projectRoot: proj, dataDir: data, uploadsInsideApp: inside(up, proj), dataInsideApp: inside(data, proj), deployedBuild: /[\\/]hbuilds[\\/]/.test(proj) };
}

// Références à des fichiers envoyés, par table (les tables absentes sont ignorées)
const SOURCES = [
  ["posts", "SELECT id, title AS label, COALESCE(cover_path,'') || ' ' || COALESCE(og_image_path,'') || ' ' || COALESCE(twitter_image_path,'') || ' ' || COALESCE(content,'') AS txt FROM posts", (r) => `Article « ${r.label} »`],
  ["site_pages", "SELECT slug AS id, title AS label, content AS txt FROM site_pages", (r) => `Page « ${r.label} »`],
  ["courses", "SELECT id, title AS label, COALESCE(thumbnail_path,'') || ' ' || COALESCE(description,'') AS txt FROM courses", (r) => `Formation « ${r.label} »`],
  ["lessons", "SELECT id, title AS label, COALESCE(video_path,'') || ' ' || COALESCE(resource_path,'') || ' ' || COALESCE(description,'') AS txt FROM lessons", (r) => `Leçon « ${r.label} »`],
  ["lesson_attachments", "SELECT id, title AS label, path AS txt FROM lesson_attachments", (r) => `Pièce jointe « ${r.label} »`],
  ["users", "SELECT id, id AS label, avatar_path AS txt FROM users WHERE avatar_path IS NOT NULL", (r) => `Photo de profil (compte n° ${r.label})`],
  ["blog_reusable_blocks", "SELECT id, name AS label, content AS txt FROM blog_reusable_blocks", (r) => `Bloc réutilisable « ${r.label} »`],
  ["mk_templates", "SELECT id, name AS label, blocks AS txt FROM mk_templates", (r) => `Modèle d'e-mail « ${r.label} »`],
];

// Même règle que le reste du site (src/utils/storage.js) ; un autre dossier racine n'est utilisé que par les tests
function fileExists(uploadsRoot, publicPath) {
  if (path.resolve(uploadsRoot) === storage.uploadsRoot) return storage.fileExists(publicPath);
  const p = String(publicPath || "");
  if (!/^\/uploads\//.test(p) || p.includes("..")) return false;
  try { return fs.statSync(path.join(uploadsRoot, p.replace(/^\/uploads\//, ""))).isFile(); } catch { return false; }
}

function auditMedia(db, { uploadsRoot = paths.uploadsRoot, siteHost = "" } = {}) {
  const refs = { VALID: 0, MISSING: 0, TEMPORARY_URL: 0, EXTERNAL: 0 };
  const missing = [], temporary = [];
  for (const [table, sql, label] of SOURCES) {
    let rows = [];
    try { rows = db.prepare(sql).all(); } catch (e) { if (/no such (table|column)/i.test(e.message)) continue; throw e; }
    for (const r of rows) {
      const txt = String(r.txt || "");
      const seen = new Set();
      for (const m of txt.matchAll(UPLOAD_RE)) {
        const full = m[0], p = m[1];
        if (/^https?:\/\//.test(full) && siteHost && !full.includes(siteHost) && !/localhost|127\.0\.0\.1/.test(full)) { refs.EXTERNAL++; continue; }
        if (seen.has(p)) continue;
        seen.add(p);
        if (fileExists(uploadsRoot, p)) refs.VALID++;
        else { refs.MISSING++; missing.push({ path: p, where: label(r), table }); }
      }
      for (const m of txt.matchAll(TEMP_RE)) { refs.TEMPORARY_URL++; temporary.push({ url: m[0].slice(0, 80), where: label(r), table }); }
    }
  }
  // Médiathèques : fiche sans fichier ; fichiers sans fiche (orphelins, simplement comptés)
  const library = { blog: { valid: 0, missing: 0 }, marketing: { valid: 0, missing: 0 } };
  const known = new Set();
  for (const [key, sql] of [["blog", "SELECT path FROM media"], ["marketing", "SELECT path FROM mk_media"]]) {
    let rows = [];
    try { rows = db.prepare(sql).all(); } catch (e) { if (/no such table/i.test(e.message)) continue; throw e; }
    for (const { path: p } of rows) { known.add(p); if (fileExists(uploadsRoot, p)) library[key].valid++; else library[key].missing++; }
  }
  let orphanFiles = 0;
  try {
    for (const f of fs.readdirSync(path.join(uploadsRoot, "thumbnails"))) {
      if (f.startsWith(".") || /-\d+w\.webp$/.test(f)) continue; // versions réduites : rattachées à leur original
      if (!known.has(`/uploads/thumbnails/${f}`)) orphanFiles++;
    }
  } catch { /* dossier absent : rien à compter */ }
  return { refs, missing, temporary, library, orphanFiles };
}

// Résumé pour les journaux du serveur (chemins et nombres seulement : aucune donnée personnelle ni secret)
function logStartupAudit(db, { log = console.log, warn = console.error } = {}) {
  const s = storageInfo();
  if (paths.uploadsEnvIgnored) warn("[médias] ERREUR : la variable UPLOADS_DIR n'est pas un chemin absolu (valeur masquée) — elle est ignorée. Donnez-lui un chemin complet commençant par « / » hors du dossier de l'application, ou supprimez-la (les fichiers vont alors dans DATA_DIR/uploads).");
  if (s.deployedBuild && s.uploadsInsideApp) warn("[médias] ERREUR : les fichiers envoyés sont rangés dans le dossier de l'application, remplacé à chaque déploiement — ils seront perdus. Définissez UPLOADS_DIR (chemin absolu) ou DATA_DIR vers un dossier conservé.");
  else log(`[médias] Stockage des fichiers envoyés : ${s.uploadsRoot}${s.uploadsInsideApp ? " (dossier de l'application)" : " (dossier conservé, hors application)"} · base : ${s.dataInsideApp ? "dans l'application" : "dossier conservé"}`);
  let a;
  try { a = auditMedia(db, { siteHost: (process.env.SITE_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "") }); } catch (e) { warn("[médias] Audit impossible :", e.message); return null; }
  log(`[médias] Références : ${a.refs.VALID} valides, ${a.refs.MISSING} fichiers introuvables, ${a.refs.TEMPORARY_URL} adresses temporaires, ${a.refs.EXTERNAL} externes · médiathèque blog : ${a.library.blog.valid} présents / ${a.library.blog.missing} introuvables · marketing : ${a.library.marketing.valid} / ${a.library.marketing.missing} · fichiers sans fiche : ${a.orphanFiles}`);
  for (const m of a.missing.slice(0, 15)) warn(`[médias] MEDIA_NOT_FOUND ${m.path} — ${m.where}`);
  if (a.missing.length > 15) warn(`[médias] … et ${a.missing.length - 15} autre(s) fichier(s) introuvable(s) (npm run audit:medias pour la liste complète).`);
  return a;
}

module.exports = { auditMedia, storageInfo, logStartupAudit, fileExists };
