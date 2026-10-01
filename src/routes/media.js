// Vidéos et pièces jointes : servies uniquement à ceux qui y ont droit
// (règles dans src/services/access.js). Les miniatures, elles, restent publiques (voir server.js).
const express = require("express");
const path = require("path");
const db = require("../config/database");
const { uploadsRoot } = require("../config/paths");
const { lessonAccess } = require("../services/access");
const { imageMime } = require("../utils/attachments");

const router = express.Router();

// Nom de fichier proposé au téléchargement : version ASCII sûre + version UTF-8 complète
function attachmentHeader(name) {
  const clean = String(name || "fichier").replace(/[\r\n"\\]/g, "_");
  const ascii = clean.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}

// Nom proposé au téléchargement : le titre choisi par le formateur, complété par la vraie extension du fichier
// (« Guide PDF » devient « Guide PDF.pdf ») pour qu'il s'ouvre d'un double-clic.
function downloadName(title, fileName) {
  const ext = path.extname(fileName);
  const base = String(title || fileName);
  return ext && !base.toLowerCase().endsWith(ext.toLowerCase()) ? base + ext : base;
}

// Retrouve la leçon qui référence ce fichier : { is_preview, course_id, title }
const findByVideo = (webPath) =>
  db
    .prepare(
      `SELECT lessons.is_preview, sections.course_id, NULL AS title FROM lessons
       JOIN sections ON sections.id = lessons.section_id WHERE lessons.video_path = ?`
    )
    .get(webPath);
const findByAttachment = (webPath) =>
  db
    .prepare(
      `SELECT lessons.is_preview, sections.course_id, lesson_attachments.title AS title FROM lesson_attachments
       JOIN lessons ON lessons.id = lesson_attachments.lesson_id
       JOIN sections ON sections.id = lessons.section_id WHERE lesson_attachments.path = ?`
    )
    .get(webPath);

function serveProtected(folder, find) {
  return (req, res) => {
    const fileName = path.basename(req.params.file);
    const found = find(`/uploads/${folder}/${fileName}`);
    if (!found) return res.status(404).render("error", { message: "Fichier introuvable." });

    const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(found.course_id);
    const user = req.session.user;
    const access = lessonAccess(user, course, found);
    if (access.hidden) return res.status(404).render("error", { message: "Fichier introuvable." });
    if (!access.canView) {
      return res.status(user ? 403 : 401).render("error", { message: "Vous devez posséder cette formation pour accéder à ce fichier." });
    }

    res.set("Cache-Control", "private, no-cache");
    if (folder === "resources") {
      const image = imageMime(fileName);
      if (image) {
        // Vraie image (jpg, png, webp, gif, avif) : affichable dans la page de la leçon
        res.set("Content-Type", image);
      } else {
        // Tout le reste : toujours en téléchargement, jamais affiché ni exécuté dans le site
        // (un .html envoyé en pièce jointe ne doit pas pouvoir s'exécuter avec les droits de KOYEKOLA)
        res.set("Content-Type", "application/octet-stream");
        res.set("Content-Disposition", attachmentHeader(downloadName(found.title, fileName)));
      }
    }
    // sendFile gère les requêtes « Range » : indispensable pour avancer/reculer dans une vidéo
    res.sendFile(path.join(uploadsRoot, folder, fileName), { cacheControl: false });
  };
}

router.get("/uploads/videos/:file", serveProtected("videos", findByVideo));
router.get("/uploads/resources/:file", serveProtected("resources", findByAttachment));

module.exports = router;
