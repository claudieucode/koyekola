// Centre de gestion — Ressources : tous les fichiers réellement enregistrés sur le site, au même endroit.
//  · Médiathèque du site (images, vidéos, audio des articles et pages) : envoi et suppression ici (protégée : un fichier
//    encore utilisé ne peut pas être supprimé) ;
//  · Fichiers des formations du formateur (miniatures, vidéos, documents, pièces jointes) : gérés dans la formation ;
//  · Médiathèque marketing (images et PDF des e-mails) : gérée dans Marketing.
// Taille et date réelles (fiche, sinon fichier sur le disque) ; un fichier absent du serveur est signalé.
const fs = require("fs");
const path = require("path");
const db = require("../../config/database");
const { uploadsRoot } = require("../../config/paths");
const blog = require("../blog");
const { paginate, page, cleanQ } = require("./common");

const KIND_LABELS = { image: "Image", video: "Vidéo", audio: "Audio", document: "Document" };
const SOURCE_LABELS = { site: "Médiathèque du site", course: "Formations", marketing: "Marketing" };
const DOC = /\.(pdf|docx?|xlsx?|pptx?|txt|csv|zip|odt|ods|odp|rtf|epub)$/i;
const kindOf = (p, mime) => (/^image\//.test(mime || "") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(p) ? "image" : /^video\//.test(mime || "") || /\.(mp4|webm|mov|m4v)$/i.test(p) ? "video" : /^audio\//.test(mime || "") || /\.(mp3|m4a|wav|ogg)$/i.test(p) ? "audio" : "document");
function stat(p) {
  try { const s = fs.statSync(path.join(uploadsRoot, String(p).replace(/^\/uploads\//, ""))); return { size: s.size, mtime: s.mtime.toISOString().slice(0, 19).replace("T", " "), exists: true }; } catch { return { size: 0, mtime: null, exists: false }; }
}

function allResources(instructorId) {
  const out = [];
  // 1. Médiathèque du site
  for (const m of db.prepare("SELECT * FROM media ORDER BY created_at DESC, id DESC").all()) {
    const st = stat(m.path);
    const used = blog.imageReferences(m.path);
    out.push({ key: `site:${m.id}`, id: m.id, source: "site", kind: m.kind === "image" || m.kind === "video" || m.kind === "audio" ? m.kind : kindOf(m.path, m.mime), name: m.title || path.basename(m.path), path: m.path, mime: m.mime,
      size: m.size || st.size, date: m.created_at, exists: st.exists, usedBy: used, deletable: true, width: m.width, height: m.height, alt: m.alt });
  }
  // 2. Fichiers des formations du formateur
  const courses = db.prepare("SELECT id, title, thumbnail_path FROM courses WHERE instructor_id = ?").all(instructorId);
  for (const c of courses) {
    if (c.thumbnail_path) { const st = stat(c.thumbnail_path); out.push({ key: `course-thumb:${c.id}`, source: "course", kind: "image", name: `Miniature — ${c.title}`, path: c.thumbnail_path, size: st.size, date: st.mtime, exists: st.exists, usedBy: [`Formation « ${c.title} »`], deletable: false, manageHref: `/formateur/cours/${c.id}/modifier` }); }
  }
  const lessons = db.prepare(`SELECT l.id, l.title, l.video_path, c.id AS course_id, c.title AS course_title FROM lessons l JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.instructor_id = ? AND l.video_path IS NOT NULL AND l.video_path <> ''`).all(instructorId);
  for (const l of lessons) { const st = stat(l.video_path); out.push({ key: `lesson-video:${l.id}`, source: "course", kind: "video", name: `Vidéo — ${l.title}`, path: l.video_path, size: st.size, date: st.mtime, exists: st.exists, usedBy: [`Leçon « ${l.title} » (${l.course_title})`], deletable: false, manageHref: `/formateur/cours/${l.course_id}/curriculum` }); }
  const atts = db.prepare(`SELECT a.id, a.title, a.path, a.created_at, l.title AS lesson_title, c.id AS course_id, c.title AS course_title FROM lesson_attachments a JOIN lessons l ON l.id = a.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.instructor_id = ? AND a.kind = 'file' AND a.path IS NOT NULL`).all(instructorId);
  for (const a of atts) { const st = stat(a.path); out.push({ key: `attachment:${a.id}`, source: "course", kind: kindOf(a.path), name: a.title || path.basename(a.path), path: a.path, size: st.size, date: a.created_at, exists: st.exists, usedBy: [`Leçon « ${a.lesson_title} » (${a.course_title})`], deletable: false, manageHref: `/formateur/cours/${a.course_id}/curriculum` }); }
  // 3. Médiathèque marketing (si le module est en place)
  try {
    for (const m of db.prepare("SELECT * FROM mk_media ORDER BY created_at DESC").all()) {
      const st = stat(m.path);
      const created = typeof m.created_at === "number" ? new Date(m.created_at).toISOString().slice(0, 19).replace("T", " ") : m.created_at;
      out.push({ key: `marketing:${m.id}`, source: "marketing", kind: kindOf(m.path, m.mime), name: m.name || path.basename(m.path), path: m.path, size: m.size || st.size, date: created, exists: st.exists, usedBy: [], deletable: false, manageHref: "/marketing/modeles", manageLabel: "Gérer dans les modèles d'e-mails (onglet Médias)" });
    }
  } catch (e) { if (!/no such table/i.test(e.message)) throw e; }
  return out;
}

function listResources(instructorId, query = {}) {
  const q = cleanQ(query.q).toLowerCase();
  const kind = KIND_LABELS[query.type] ? query.type : "";
  const source = SOURCE_LABELS[query.source] ? query.source : "";
  const all = allResources(instructorId);
  const counts = { all: all.length, image: 0, video: 0, audio: 0, document: 0, missing: all.filter((r) => !r.exists).length, bytes: all.reduce((s, r) => s + (r.size || 0), 0) };
  all.forEach((r) => { counts[r.kind]++; });
  let rows = all.filter((r) => (!kind || r.kind === kind) && (!source || r.source === source) && (!q || `${r.name} ${r.path} ${(r.usedBy || []).join(" ")}`.toLowerCase().includes(q)));
  if (query.tri === "taille") rows.sort((a, b) => (b.size || 0) - (a.size || 0));
  else if (query.tri === "nom") rows.sort((a, b) => a.name.localeCompare(b.name, "fr"));
  else rows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const pg = paginate(rows.length, page(query), 24);
  return { rows: rows.slice(pg.offset, pg.offset + pg.limit), ...pg, counts, kind, source, q: cleanQ(query.q), sort: query.tri || "recent" };
}

module.exports = { listResources, allResources, KIND_LABELS, SOURCE_LABELS };
