// « Mon profil » du formateur : biographie et photo, affichées sur la page de chacune de ses formations.
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const { removeUploadedFile } = require("../utils/uploads");
const { UserError } = require("../utils/errors");
const accountProfile = require("../services/accountProfile");
const { settingsData } = require("../utils/accountSettingsView");

const router = express.Router();
const MAX_BIO = 600;

// Vérifié AVANT la réception d'une image : un élève ne peut rien envoyer
router.use("/formateur/profil", requireInstructor);

router.get("/formateur/profil", (req, res) => {
  const user = db.prepare("SELECT id, username, bio, avatar_path FROM users WHERE id = ?").get(req.session.user.id);
  res.render("instructor/profile", { ...settingsData(req), profile: user, saved: req.query.enregistre === "1", error: null });
});

router.post("/formateur/profil", upload.single("thumbnail"), (req, res) => {
  const user = db.prepare("SELECT id, username, bio, avatar_path FROM users WHERE id = ?").get(req.session.user.id);
  const bio = String(req.body.bio || "").replace(/\r\n/g, "\n").trim().slice(0, MAX_BIO);

  // La photo est contrôlée sur son CONTENU (signature) et sa taille (2 Mo), jamais sur le type déclaré par le navigateur : même règle que le profil du CMS
  if (req.file) {
    try { accountProfile.checkImageFile(req.file); } catch (error) {
      removeUploadedFile(`/uploads/thumbnails/${req.file.filename}`);
      if (!(error instanceof UserError)) throw error;
      return res.status(400).render("instructor/profile", { ...settingsData(req), profile: { ...user, bio }, saved: false, error: error.message });
    }
  }
  let avatar = user.avatar_path;
  if (req.file) avatar = `/uploads/thumbnails/${req.file.filename}`;
  else if (req.body.remove_avatar) avatar = null;

  db.prepare("UPDATE users SET bio = ?, avatar_path = ? WHERE id = ?").run(bio, avatar, user.id); // users.bio est NOT NULL : une biographie vide s'enregistre en chaîne vide
  // L'ancienne photo n'est effacée du disque qu'une fois la base à jour
  if (user.avatar_path && user.avatar_path !== avatar) removeUploadedFile(user.avatar_path);
  res.redirect("/formateur/profil?enregistre=1");
});

module.exports = router;
