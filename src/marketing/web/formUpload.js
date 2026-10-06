// Envoi de formulaire public avec fichier joint (multipart) : un seul fichier, en mémoire, 5 Mo au plus. Le type réel
// est vérifié ensuite dans forms/fields.js (premiers octets). Une erreur de lecture devient un message, jamais une page
// d'erreur brute. Les envois classiques (sans fichier) ne passent pas par ici.
const multer = require("multer");
const { MAX_FILE_BYTES } = require("../forms/fields");

const parser = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 80, fieldSize: 20000 } }).single("file");

module.exports = function formUpload(req, res, next) {
  if (!req.is("multipart/form-data")) return next();
  parser(req, res, (error) => {
    if (error) {
      req.body = req.body || {};
      req.uploadError = error.code === "LIMIT_FILE_SIZE" ? "Fichier refusé : 5 Mo au plus." : "Envoi impossible : un seul fichier, image ou PDF.";
    }
    next();
  });
};
