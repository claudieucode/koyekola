// Suppression d'un fichier envoyé par le formateur (miniature, vidéo, pièce jointe, image d'article).
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../config/paths");

// relativePath est de la forme "/uploads/videos/xxx.mp4" (valeur stockée en base)
function removeUploadedFile(relativePath) {
  if (!relativePath) return;
  const filePath = path.join(uploadsRoot, relativePath.replace(/^\/uploads\//, ""));
  fs.rmSync(filePath, { force: true });
}

module.exports = { removeUploadedFile };
