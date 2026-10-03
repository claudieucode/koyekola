const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { uploadsRoot } = require("../config/paths");
const { UserError } = require("../utils/errors");

// Types acceptés, avec l'extension imposée au fichier enregistré. L'extension ne vient JAMAIS du nom
// envoyé par l'utilisateur (un « evil.html » déclaré image/png serait sinon servi comme une page web).
// Le SVG est volontairement exclu : il peut contenir du script.
const IMAGE_TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" };
const AUDIO_TYPES = { "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/mp4": ".m4a", "audio/x-m4a": ".m4a", "audio/aac": ".aac", "audio/ogg": ".ogg", "audio/wav": ".wav", "audio/x-wav": ".wav", "audio/wave": ".wav" };
const VIDEO_TYPES = { "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "video/x-m4v": ".m4v", "video/ogg": ".ogv" };

// Champs d'image : miniature/couverture, image de partage et images insérées dans un article (mêmes règles, même dossier)
const IMAGE_FIELDS = new Set(["thumbnail", "og_image", "article_image", "image_variant"]);

function destinationFor(fieldname) {
  if (IMAGE_FIELDS.has(fieldname)) return path.join(uploadsRoot, "thumbnails");
  if (fieldname === "article_video" || fieldname === "article_audio") return path.join(uploadsRoot, "blog"); // médias publics du blog
  if (fieldname === "video") return path.join(uploadsRoot, "videos");
  return path.join(uploadsRoot, "resources");
}

// Extension d'une ressource : lettres et chiffres seulement, 8 caractères maximum
function safeExtension(originalName) {
  const ext = path.extname(originalName || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  return /^\.[a-z0-9]{1,8}$/.test(ext) ? ext : "";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, destinationFor(file.fieldname)),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString("hex");
    let ext;
    if (IMAGE_FIELDS.has(file.fieldname)) ext = IMAGE_TYPES[file.mimetype];
    else if (file.fieldname === "video" || file.fieldname === "article_video") ext = VIDEO_TYPES[file.mimetype];
    else if (file.fieldname === "article_audio") ext = AUDIO_TYPES[file.mimetype];
    else ext = safeExtension(file.originalname);
    cb(null, `${Date.now()}-${unique}${ext || ""}`);
  },
});

function fileFilter(req, file, cb) {
  if (IMAGE_FIELDS.has(file.fieldname) && !IMAGE_TYPES[file.mimetype]) {
    return cb(new UserError(file.fieldname === "thumbnail" ? "La miniature doit être une image JPEG, PNG, WebP, GIF ou AVIF." : "L'image doit être au format JPEG, PNG, WebP, GIF ou AVIF."));
  }
  if (file.fieldname === "article_audio" && !AUDIO_TYPES[file.mimetype]) {
    return cb(new UserError("Le fichier audio doit être au format MP3, M4A, AAC, OGG ou WAV."));
  }
  if ((file.fieldname === "video" || file.fieldname === "article_video") && !VIDEO_TYPES[file.mimetype]) {
    return cb(new UserError("La vidéo doit être un fichier MP4, WebM, MOV, M4V ou OGG."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 300 * 1024 * 1024 },
});

module.exports = { upload, uploadsRoot, IMAGE_TYPES, VIDEO_TYPES, AUDIO_TYPES };
