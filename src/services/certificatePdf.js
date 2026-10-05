// Certificat de réussite en PDF (A4 paysage), généré à la demande avec pdfkit et les polices standard (Helvetica).
const PDFDocument = require("pdfkit");
const { pdfSafe } = require("./programPdf");
const { formatDate } = require("../utils/format");

const BLUE = "#0277b6";
const NAVY = "#0b2a40";
const MUTED = "#5d7182";

// certificate : ligne de la table certificates ; verifyUrl : adresse publique de vérification
function buildCertificatePdf({ certificate, verifyUrl }) {
  const doc = new PDFDocument({
    size: "A4", layout: "landscape", margin: 50,
    info: { Title: pdfSafe(`Certificat — ${certificate.course_title}`), Author: "KOLAKISA", Subject: "Certificat de réussite" },
  });
  const W = doc.page.width, H = doc.page.height;
  doc.rect(24, 24, W - 48, H - 48).lineWidth(3).stroke(BLUE);
  doc.rect(32, 32, W - 64, H - 64).lineWidth(0.8).stroke(BLUE);

  const center = (text, y, size, color, font = "Helvetica") =>
    doc.font(font).fontSize(size).fillColor(color).text(pdfSafe(text), 70, y, { width: W - 140, align: "center" });

  center("KOLAKISA", 70, 20, BLUE, "Helvetica-Bold");
  center("CERTIFICAT DE RÉUSSITE", 108, 13, MUTED);
  center(certificate.student_name, 160, 34, NAVY, "Helvetica-Bold");
  center("a terminé avec succès la formation", 215, 14, MUTED);
  center(certificate.course_title, 245, 24, NAVY, "Helvetica-Bold");
  const y = doc.y + 14;
  if (certificate.instructor_name) center(`dispensée par ${certificate.instructor_name}`, y, 14, MUTED);
  const dateY = certificate.instructor_name ? doc.y + 10 : y;
  center(certificate.completed_at ? formatDate(certificate.completed_at) : formatDate(certificate.issued_at), dateY, 14, NAVY);

  center(`Certificat n° ${certificate.code}`, H - 110, 11, NAVY, "Helvetica-Bold");
  center(`Authenticité à vérifier sur : ${verifyUrl}`, H - 92, 10, MUTED);
  doc.end();
  return doc;
}

module.exports = { buildCertificatePdf };
