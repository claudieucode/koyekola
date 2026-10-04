// Centre de gestion — Ressources : tous les fichiers réellement enregistrés sur le site, au même endroit.
//  · Médiathèque du site (images, vidéos, audio des articles et pages) : envoi, suppression, réparation ici ;
//  · Fichiers des formations du formateur (miniatures, vidéos, pièces jointes) : gérés dans la formation (réparables ici) ;
//  · Médiathèque marketing (images et PDF des e-mails) : suppression par la logique du module Marketing (mêmes droits).
// Une ressource est DISPONIBLE seulement si sa fiche existe ET que son fichier est réellement dans le stockage
// (src/utils/storage.js, seule règle du site). Sinon elle est « à traiter » : affichée à part, avec la raison, ce qui
// l'utilise encore, et l'action sûre (nettoyer la fiche, remplacer le fichier, ou gérer dans la formation).
const path = require("path");
const db = require("../../config/database");
const blog = require("../blog");
const { fileState, STATE_LABELS } = require("../../utils/storage");
const { paginate, page, cleanQ } = require("./common");

const KIND_LABELS = { image: "Image", video: "Vidéo", audio: "Audio", document: "Document" };
const SOURCE_LABELS = { site: "Médiathèque du site", course: "Formations", marketing: "Marketing" };
const kindOf = (p, mime) => (/^image\//.test(mime || "") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(p) ? "image" : /^video\//.test(mime || "") || /\.(mp4|webm|mov|m4v)$/i.test(p) ? "video" : /^audio\//.test(mime || "") || /\.(mp3|m4a|wav|ogg|aac)$/i.test(p) ? "audio" : "document");
const AVAILABLE = new Set(["ok", "external"]);
function stat(p) { const f = fileState(p); return { size: f.size, mtime: f.mtime, state: f.state, exists: AVAILABLE.has(f.state) }; }

// Chaque provenance est lue séparément : si l'une échoue (table ancienne, donnée inattendue), les autres restent
// affichées et la provenance en échec est signalée avec sa raison (jamais une liste silencieusement incomplète).
// Les utilisations d'un fichier de la médiathèque (recherche dans tous les contenus du site, coûteuse) ne sont calculées
// que pour les fichiers affichés : voir withUsage().
function allResources(instructorId) {
  const out = [];
  const problems = [];
  const part = (source, fn) => {
    try { fn(); } catch (error) {
      console.error(`[KOLAKISA] Centre de gestion · Ressources (${SOURCE_LABELS[source]}) :`, error.message);
      problems.push({ source, label: SOURCE_LABELS[source], message: error.message });
    }
  };
  // 1. Médiathèque du site
  part("site", () => {
    for (const m of db.prepare("SELECT * FROM media ORDER BY created_at DESC, id DESC").all()) {
      const p = String(m.path || "");
      const st = stat(p);
      out.push({ key: `site:${m.id}`, id: m.id, source: "site", kind: m.kind === "image" || m.kind === "video" || m.kind === "audio" ? m.kind : kindOf(p, m.mime), name: m.title || path.basename(p) || `Fichier ${m.id}`, path: p, mime: m.mime,
        size: m.size || st.size, date: m.created_at, exists: st.exists, state: st.state, usedBy: null, deletable: true, width: m.width, height: m.height, alt: m.alt });
    }
  });
  // 2. Fichiers des formations du formateur
  part("course", () => {
    const courses = db.prepare("SELECT id, title, thumbnail_path FROM courses WHERE instructor_id = ?").all(instructorId);
    for (const c of courses) {
      if (c.thumbnail_path) { const st = stat(c.thumbnail_path); out.push({ key: `course-thumb:${c.id}`, source: "course", kind: "image", name: `Miniature — ${c.title}`, path: String(c.thumbnail_path), size: st.size, date: st.mtime, exists: st.exists, state: st.state, usedBy: [`Formation « ${c.title} »`], deletable: false, manageHref: `/formateur/cours/${c.id}/modifier` }); }
    }
    const lessons = db.prepare(`SELECT l.id, l.title, l.video_path, c.id AS course_id, c.title AS course_title FROM lessons l JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.instructor_id = ? AND l.video_path IS NOT NULL AND l.video_path <> ''`).all(instructorId);
    for (const l of lessons) { const st = stat(l.video_path); out.push({ key: `lesson-video:${l.id}`, source: "course", kind: "video", name: `Vidéo — ${l.title}`, path: String(l.video_path), size: st.size, date: st.mtime, exists: st.exists, state: st.state, usedBy: [`Leçon « ${l.title} » (${l.course_title})`], deletable: false, manageHref: `/formateur/cours/${l.course_id}/curriculum` }); }
    const atts = db.prepare(`SELECT a.id, a.title, a.path, a.created_at, l.title AS lesson_title, c.id AS course_id, c.title AS course_title FROM lesson_attachments a JOIN lessons l ON l.id = a.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.instructor_id = ? AND a.kind = 'file' AND a.path IS NOT NULL`).all(instructorId);
    for (const a of atts) { const p = String(a.path); const st = stat(p); out.push({ key: `attachment:${a.id}`, source: "course", kind: kindOf(p), name: a.title || path.basename(p), path: p, size: st.size, date: a.created_at, exists: st.exists, state: st.state, usedBy: [`Leçon « ${a.lesson_title} » (${a.course_title})`], deletable: false, manageHref: `/formateur/cours/${a.course_id}/curriculum` }); }
  });
  // 3. Médiathèque marketing (si le module est en place)
  part("marketing", () => {
    let rows;
    try { rows = db.prepare("SELECT * FROM mk_media ORDER BY created_at DESC").all(); } catch (e) { if (/no such table/i.test(e.message)) return; throw e; }
    for (const m of rows) {
      const p = String(m.path || "");
      const st = stat(p);
      out.push({ key: `marketing:${m.id}`, id: m.id, organizationId: m.organization_id, source: "marketing", kind: kindOf(p, m.mime), name: m.name || path.basename(p), path: p, size: m.size || st.size, date: sqlDate(m.created_at) || st.mtime, exists: st.exists, state: st.state, usedBy: [], deletable: true, manageHref: "/marketing/modeles", manageLabel: "Gérer dans les modèles d'e-mails (onglet Médias)" });
    }
  });
  out.problems = problems;
  return out;
}
// Date enregistrée en texte SQL ou en millisecondes : toujours rendue en texte SQL (UTC), sinon null
function sqlDate(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" || /^\d+$/.test(String(v))) { const d = new Date(Number(v)); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace("T", " "); }
  return String(v);
}
// Ce qui utilise encore un fichier : [{ label, href, blocking }]. « blocking » : supprimer la fiche laisserait ce contenu
// pointer vers un fichier inexistant SANS possibilité de le réparer depuis la médiathèque → suppression refusée.
const like = (p) => `%${String(p).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
function dependenciesOf(r) {
  if (r.source === "site") return blog.imageReferences(r.path).map((label) => ({ label, blocking: true }));
  if (r.source === "marketing") {
    const deps = db.prepare("SELECT id, name FROM mk_templates WHERE organization_id = ? AND blocks LIKE ? ESCAPE '\\'").all(r.organizationId, like(r.path))
      .map((t) => ({ label: `Modèle d'e-mail « ${t.name} »`, href: `/marketing/modeles/${t.id}`, blocking: true }));
    // Campagnes déjà envoyées : leurs e-mails pointent vers ce fichier ; elles n'empêchent pas le nettoyage de la fiche
    // (le module Marketing conserve alors le fichier sur le disque, s'il existe)
    const sent = db.prepare("SELECT id, name FROM mk_campaigns WHERE organization_id = ? AND snapshot LIKE ? ESCAPE '\\'").all(r.organizationId, like(r.path));
    return deps.concat(sent.map((c) => ({ label: `Campagne « ${c.name} » (déjà préparée ou envoyée)`, blocking: false })));
  }
  return (r.usedBy || []).map((label) => ({ label, href: r.manageHref, blocking: true }));
}
// Utilisations des fichiers affichés (recherche dans tous les contenus : calculée seulement pour la page visible).
// Si la vérification échoue, l'usage est « inconnu » et aucune suppression n'est proposée (par sécurité).
function withUsage(rows) {
  for (const r of rows) {
    try { r.deps = dependenciesOf(r); r.usedBy = r.deps.map((d) => d.label); } catch (error) {
      console.error("[KOLAKISA] Centre de gestion · Ressources (utilisations) :", error.message);
      r.deps = null; r.usedBy = null; r.usageUnknown = true;
    }
    const blocking = r.deps ? r.deps.filter((d) => d.blocking) : null;
    // Suppression (fichier disponible) ou nettoyage de la fiche (fichier absent) : seulement si rien ne l'utilise
    r.canDelete = Boolean(r.deletable && blocking && !blocking.length);
    r.deleteBlockedReason = !r.deletable ? "" : r.usageUnknown ? "Utilisation impossible à vérifier : suppression bloquée par sécurité"
      : blocking.length ? `Encore utilisé : ${blocking.slice(0, 3).map((d) => d.label).join(", ")}${blocking.length > 3 ? "…" : ""}` : "";
    // Réparer = remettre un fichier au MÊME emplacement : tous les contenus qui l'utilisent fonctionnent de nouveau
    r.canRepair = r.state === "missing";
  }
  return rows;
}

const PROBLEM_REASONS = {
  missing: "La fiche existe mais le fichier n'est plus dans le stockage du site (supprimé, ou perdu lors d'un ancien déploiement quand les envois étaient rangés dans le dossier de l'application).",
  invalid: "L'adresse enregistrée n'est pas un fichier du site (adresse vide, temporaire ou hors du dossier des envois).",
};

// view : « bibliotheque » (fichiers disponibles uniquement) ou « a-traiter » (fiches dont le fichier est absent/invalide)
function listResources(instructorId, query = {}) {
  const q = cleanQ(query.q).toLowerCase();
  const kind = KIND_LABELS[query.type] ? query.type : "";
  const source = SOURCE_LABELS[query.source] ? query.source : "";
  const view = query.etat === "a-traiter" ? "a-traiter" : "bibliotheque";
  const all = allResources(instructorId);
  const available = all.filter((r) => r.exists);
  const problems = all.filter((r) => !r.exists);
  // Compteurs de la médiathèque : fichiers réellement disponibles seulement
  const counts = { all: available.length, image: 0, video: 0, audio: 0, document: 0, bytes: available.reduce((s, r) => s + (Number(r.size) || 0), 0), problems: problems.length, total: all.length };
  available.forEach((r) => { counts[r.kind] = (counts[r.kind] || 0) + 1; });
  const pool = view === "a-traiter" ? problems : available;
  const rows = pool.filter((r) => (!kind || r.kind === kind) && (!source || r.source === source) && (!q || `${r.name} ${r.path} ${(r.usedBy || []).join(" ")}`.toLowerCase().includes(q)));
  if (query.tri === "taille") rows.sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0));
  else if (query.tri === "nom") rows.sort((a, b) => String(a.name).localeCompare(String(b.name), "fr"));
  else rows.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const pg = paginate(rows.length, page(query), 24);
  const shown = withUsage(rows.slice(pg.offset, pg.offset + pg.limit));
  for (const r of shown) { r.stateLabel = STATE_LABELS[r.state]; r.reason = PROBLEM_REASONS[r.state] || ""; }
  return { rows: shown, ...pg, counts, kind, source, view, q: cleanQ(query.q), sort: query.tri || "recent", problems: all.problems };
}

// Une ressource précise (clé « site:12 », « marketing:4 », « course-thumb:3 », « lesson-video:8 », « attachment:5 »),
// limitée à ce que ce formateur peut voir, avec son état et ses dépendances
function findResource(instructorId, key) {
  const r = allResources(instructorId).find((x) => x.key === String(key || ""));
  return r ? withUsage([r])[0] : null;
}

module.exports = { listResources, allResources, withUsage, findResource, dependenciesOf, KIND_LABELS, SOURCE_LABELS };
