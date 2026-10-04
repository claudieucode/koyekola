// Point UNIQUE de vérification des fichiers envoyés : le site sert /uploads/… depuis un seul dossier (uploadsRoot,
// voir server.js et routes/media.js) ; c'est donc là, et seulement là, qu'un fichier « existe ».
// Utilisé par le Centre de gestion (Ressources), l'audit des médias et la suppression des fichiers.
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../config/paths");

const ROOT = path.resolve(uploadsRoot);
// Chemin public « /uploads/dossier/fichier.ext » → chemin absolu DANS le dossier des envois, sinon null
// (adresse externe, chemin vide, « .. » ou tout ce qui sortirait du dossier : jamais lu ni supprimé)
function resolveUpload(publicPath) {
  const p = String(publicPath || "");
  if (!/^\/uploads\/[^\0?#\\]+$/.test(p) || p.split("/").includes("..")) return null;
  const abs = path.resolve(ROOT, p.replace(/^\/uploads\//, ""));
  return abs.startsWith(ROOT + path.sep) ? abs : null;
}

// État réel d'un fichier référencé :
//   ok       : présent dans le stockage (taille et date réelles)
//   missing  : chemin valide mais fichier absent (supprimé, perdu lors d'un ancien déploiement…)
//   external : adresse d'un autre site (non vérifiable depuis le serveur sans requête réseau)
//   invalid  : adresse inutilisable (vide, temporaire « blob: », chemin hors du dossier des envois…)
function fileState(publicPath) {
  const p = String(publicPath || "");
  if (/^https?:\/\//i.test(p)) return { state: "external", size: 0, mtime: null };
  const abs = resolveUpload(p);
  if (!abs) return { state: "invalid", size: 0, mtime: null };
  try {
    const s = fs.statSync(abs);
    if (!s.isFile()) return { state: "missing", size: 0, mtime: null };
    return { state: "ok", size: s.size, mtime: s.mtime.toISOString().slice(0, 19).replace("T", " ") };
  } catch {
    return { state: "missing", size: 0, mtime: null };
  }
}
const fileExists = (publicPath) => fileState(publicPath).state === "ok";

const STATE_LABELS = { ok: "Disponible", missing: "Fichier absent du stockage", external: "Adresse externe", invalid: "Adresse invalide" };

module.exports = { resolveUpload, fileState, fileExists, STATE_LABELS, uploadsRoot: ROOT };
