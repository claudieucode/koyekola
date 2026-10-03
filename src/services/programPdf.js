// Programme d'une formation en PDF (« Télécharger le programme PDF »).
// Généré à la demande avec pdfkit, avec les polices standard des PDF (Helvetica) : aucun fichier de police à installer.
const PDFDocument = require("pdfkit");
const { formatPrice, formatDuration, levelLabel } = require("../utils/format");
const { plainText } = require("../utils/seo");

const BLUE = "#0277b6";
const NAVY = "#0b2a40";
const MUTED = "#5d7182";

// Les polices standard d'un PDF ne savent écrire que le jeu de caractères Windows-1252 (français inclus).
// Tout le reste (flèches, émojis, coches…) est remplacé par « ? » au lieu de produire des caractères illisibles.
const WIN1252_EXTRA = new Set("‘’“”‚„–—…•€œŒšŠžŽŸƒˆ˜†‡‰‹›™");
function pdfSafe(value) {
  return Array.from(String(value == null ? "" : value).replace(/[   ]/g, " "))
    .map((ch) => {
      const c = ch.codePointAt(0);
      if (ch === "\n") return ch;
      if (c < 0x20) return " ";
      if ((c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || WIN1252_EXTRA.has(ch)) return ch;
      return "?";
    })
    .join("");
}

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// course, sections (avec .lessons), lists { objectives, prerequisites, audience, skills } (tableaux), siteUrl, date
// descriptionBlocks : description en blocs (texte riche) ; absent = ancienne description en Markdown simplifié
function buildProgramPdf({ course, sections, lists, siteUrl, date = new Date(), descriptionBlocks = null }) {
  const lessonCount = sections.reduce((n, s) => n + s.lessons.length, 0);
  const totalMinutes = sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.duration_minutes || 0), 0), 0);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 56, bottom: 64, left: 56, right: 56 },
    bufferPages: true,
    compress: false, // texte lisible et vérifiable par les tests ; le poids reste de quelques Ko
    info: { Title: pdfSafe(`Plan complet de la formation : ${course.title}`), Author: "KOLAKISA", Subject: "Plan complet de la formation" },
  });
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  const ensureSpace = (height) => {
    if (doc.y + height > bottom()) doc.addPage();
  };

  function heading(text) {
    ensureSpace(60);
    doc.moveDown(0.9);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(BLUE).text(pdfSafe(text), { width: contentWidth });
    const y = doc.y + 2;
    doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + contentWidth, y).lineWidth(0.8).strokeColor("#d5e3ee").stroke();
    doc.moveDown(0.5);
    doc.fillColor(NAVY);
  }
  const paragraph = (text) => {
    ensureSpace(30);
    doc.font("Helvetica").fontSize(10.5).fillColor(NAVY).text(pdfSafe(text), { width: contentWidth, lineGap: 2 });
    doc.moveDown(0.4);
  };
  const bullet = (text) => {
    ensureSpace(22);
    doc.font("Helvetica").fontSize(10.5).fillColor(NAVY).text(pdfSafe(`•  ${text}`), { width: contentWidth, indent: 6, lineGap: 2 });
  };
  const list = (title, items) => {
    if (!items.length) return;
    heading(title);
    items.forEach(bullet);
  };

  // ---- Bandeau de marque ----
  doc.rect(0, 0, doc.page.width, 64).fill(BLUE);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20).text("KOLAKISA", doc.page.margins.left, 22);
  doc.font("Helvetica").fontSize(10).text("Plan de la formation", doc.page.margins.left, 28, { width: contentWidth, align: "right" });
  doc.y = 88;
  doc.x = doc.page.margins.left;

  // ---- Titre du document, puis titre de la formation et informations clés ----
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BLUE).text("PLAN COMPLET DE LA FORMATION", { width: contentWidth, characterSpacing: 1 });
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(NAVY).text(pdfSafe(course.title), { width: contentWidth });
  if (course.subtitle) doc.moveDown(0.3).font("Helvetica").fontSize(12).fillColor(MUTED).text(pdfSafe(course.subtitle), { width: contentWidth });
  doc.moveDown(0.8);
  const facts = [
    `Niveau : ${levelLabel(course.level)}`,
    totalMinutes ? `Durée : ${formatDuration(totalMinutes)}` : null,
    `${plural(sections.length, "chapitre", "chapitres")} · ${plural(lessonCount, "leçon", "leçons")}`,
    `Prix : ${formatPrice(course.price_cents)}`,
  ].filter(Boolean);
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(BLUE).text(pdfSafe(facts.join("     ")), { width: contentWidth });

  // ---- Description (Markdown simplifié : titres et listes conservés, symboles retirés) ----
  if (descriptionBlocks && descriptionBlocks.length) {
    heading("Description");
    for (const block of descriptionBlocks) {
      if (block.type === "heading") {
        ensureSpace(30);
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(NAVY).text(pdfSafe(block.text), { width: contentWidth });
        doc.moveDown(0.2);
      } else if (block.type === "paragraph") {
        paragraph(block.text);
      } else {
        ensureSpace(22);
        const mark = block.type === "number" ? `${block.n}.` : "•";
        doc.font("Helvetica").fontSize(10.5).fillColor(NAVY).text(pdfSafe(`${mark}  ${block.text}`), { width: contentWidth, indent: 6 + block.depth * 14, lineGap: 2 });
      }
    }
  } else if (!descriptionBlocks && course.description && course.description.trim()) {
    heading("Description");
    let buffer = [];
    const flush = () => {
      if (buffer.length) paragraph(plainText(buffer.join(" "), 4000));
      buffer = [];
    };
    for (const line of course.description.split(/\r?\n/)) {
      if (!line.trim()) flush();
      else if (/^\s{0,3}#{1,6}\s+/.test(line)) {
        flush();
        ensureSpace(30);
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(NAVY).text(pdfSafe(plainText(line, 200)), { width: contentWidth });
        doc.moveDown(0.2);
      } else if (/^\s{0,3}[-*+]\s+/.test(line)) {
        flush();
        bullet(plainText(line, 500));
      } else buffer.push(line);
    }
    flush();
  }

  list("Objectifs", lists.objectives);
  list("Prérequis", lists.prerequisites);
  list("À qui s'adresse cette formation ?", lists.audience);
  list("Compétences acquises", lists.skills);

  // ---- Programme détaillé ----
  heading("Programme détaillé");
  if (!sections.length) paragraph("Le programme sera publié prochainement.");
  sections.forEach((section, i) => {
    ensureSpace(48);
    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(11.5).fillColor(NAVY).text(pdfSafe(`Chapitre ${i + 1} — ${section.title}`), { width: contentWidth });
    doc.moveDown(0.2);
    section.lessons.forEach((lesson, j) => {
      ensureSpace(20);
      const meta = [lesson.is_preview ? "Aperçu gratuit" : null, lesson.duration_minutes ? formatDuration(lesson.duration_minutes) : null].filter(Boolean);
      doc.font("Helvetica").fontSize(10).fillColor(NAVY).text(pdfSafe(`${i + 1}.${j + 1}  ${lesson.title}${meta.length ? `   (${meta.join(", ")})` : ""}`), {
        width: contentWidth,
        indent: 14,
        lineGap: 1.5,
      });
    });
  });

  // ---- Pied de page sur chaque page ----
  const stamp = date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(pages.start + i);
    doc.page.margins.bottom = 0; // sinon pdfkit ajouterait une page en écrivant dans la marge du bas
    doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(pdfSafe(`${siteUrl}  ·  Programme généré le ${stamp}  ·  Page ${i + 1}/${pages.count}`), doc.page.margins.left, doc.page.height - 36, {
      width: contentWidth,
      align: "center",
      lineBreak: false,
    });
  }
  return doc;
}

module.exports = { buildProgramPdf, pdfSafe };
