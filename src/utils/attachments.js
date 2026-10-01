// Pièces jointes d'une leçon : quels fichiers peuvent s'afficher directement dans la page (images)
// et lesquels sont toujours proposés en téléchargement.
//
// Le SVG est volontairement absent : il peut contenir du script. Un fichier .html ou .svg envoyé en
// pièce jointe est donc toujours servi en téléchargement, jamais affiché ni exécuté dans le site.
const IMAGE_MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

function extensionOf(filePath) {
  const m = String(filePath || "").toLowerCase().match(/\.[a-z0-9]{1,8}$/);
  return m ? m[0] : "";
}

function imageMime(filePath) {
  return IMAGE_MIME[extensionOf(filePath)] || null;
}

module.exports = { imageMime, isInlineImage: (filePath) => Boolean(imageMime(filePath)) };
