// Suppression d'un fichier envoyé par le formateur (miniature, vidéo, pièce jointe, image d'article).
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../config/paths");

// relativePath est de la forme "/uploads/videos/xxx.mp4" (valeur stockée en base)
// Toute suppression physique est tracée (MEDIA_DELETED) : on peut toujours savoir quand et pourquoi un fichier a disparu.
function removeUploadedFile(relativePath, reason = "non précisée") {
  if (!relativePath) return;
  const filePath = path.join(uploadsRoot, relativePath.replace(/^\/uploads\//, ""));
  const existed = fs.existsSync(filePath);
  fs.rmSync(filePath, { force: true });
  if (existed && process.env.NODE_ENV !== "test") console.log(`[médias] MEDIA_DELETED ${relativePath} — raison : ${reason}`);
}

module.exports = { removeUploadedFile };
