const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { uploadsRoot } = require("../config/paths");
const { UserError } = require("../utils/errors");

// Types acceptés, avec l'extension imposée au fichier enregistré. L'extension ne vient JAMAIS du nom
// envoyé par l'utilisateur (un « evil.html » déclaré image/png serait sinon servi comme une page web).
// Le SVG est volontairement exclu : il peut contenir du script.
const IMAGE_TYPES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif" };
const VIDEO_TYPES = { "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov", "video/x-m4v": ".m4v", "video/ogg": ".ogv" };

function destinationFor(fieldname) {
  if (fieldname === "thumbnail") return path.join(uploadsRoot, "thumbnails");
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
    if (file.fieldname === "thumbnail") ext = IMAGE_TYPES[file.mimetype];
    else if (file.fieldname === "video") ext = VIDEO_TYPES[file.mimetype];
    else ext = safeExtension(file.originalname);
    cb(null, `${Date.now()}-${unique}${ext || ""}`);
  },
});

function fileFilter(req, file, cb) {
  if (file.fieldname === "thumbnail" && !IMAGE_TYPES[file.mimetype]) {
    return cb(new UserError("La miniature doit être une image JPEG, PNG, WebP, GIF ou AVIF."));
  }
  if (file.fieldname === "video" && !VIDEO_TYPES[file.mimetype]) {
    return cb(new UserError("La vidéo doit être un fichier MP4, WebM, MOV, M4V ou OGG."));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 300 * 1024 * 1024 },
});

module.exports = { upload, uploadsRoot };
