// Catégories de formations. Modèle réel (inchangé) : il n'existe pas de table de catégories, la catégorie est un TEXTE porté par chaque formation
// (courses.category). Une catégorie « existe » donc tant qu'au moins une formation la porte ; sa page publique est /categorie/<adresse>, où
// l'adresse est dérivée du nom (slugify) et où toutes les formations publiées de la plateforme portant ce nom sont réunies.
// Ce service ne regarde que les formations du formateur (jamais celles d'un autre) et garde ces règles :
//  - renommer = changer le texte de SES formations, en une seule transaction ;
//  - renommer vers une catégorie qui existe déjà = FUSIONNER : refusé tant que la fusion n'est pas confirmée ;
//  - l'ancienne adresse publique redirige (301) vers la nouvelle, sauf si un autre formateur utilise encore l'ancien nom.
const db = require("../config/database");
const { slugify } = require("../utils/format");
const audit = require("./auditLog");

const MAX = 60;
const DEFAULTS = ["Développement", "Design", "Business", "Marketing", "Musique", "Photographie", "Bien-être", "Langues", "Autre"];
const NOTE = "Catégorie renommée";

const cleanName = (v) => String(v == null ? "" : v).normalize("NFC").replace(/\s+/g, " ").trim();
// clé « presque identique » : sans accents, ni tirets, ni « s » final (« Langue » ≈ « Langues », « Bien être » ≈ « Bien-être »)
const nearKey = (name) => slugify(name).replace(/-/g, "").replace(/s$/, "");

// Catégories du formateur, avec les compteurs réels (tous calculés en une requête, sans charger les formations)
function list(userId) {
  const rows = db.prepare(`SELECT category AS name, COUNT(*) AS total,
      SUM(CASE WHEN published = 1 AND archived = 0 THEN 1 ELSE 0 END) AS visible,
      SUM(CASE WHEN published = 0 AND archived = 0 THEN 1 ELSE 0 END) AS drafts,
      SUM(CASE WHEN archived = 1 THEN 1 ELSE 0 END) AS archived,
      MAX(updated_at) AS updated_at
    FROM courses WHERE instructor_id = ? GROUP BY category ORDER BY category COLLATE NOCASE`).all(userId);
  const bySlug = new Map(), byNear = new Map();
  for (const r of rows) {
    r.slug = slugify(r.name);
    (bySlug.get(r.slug) || bySlug.set(r.slug, []).get(r.slug)).push(r);
    (byNear.get(nearKey(r.name)) || byNear.set(nearKey(r.name), []).get(nearKey(r.name))).push(r);
  }
  for (const r of rows) {
    const same = (bySlug.get(r.slug) || []).filter((o) => o !== r);
    const near = (byNear.get(nearKey(r.name)) || []).filter((o) => o !== r && o.slug !== r.slug);
    r.sameAddress = same.map((o) => o.name);   // même adresse publique : la page publique les confond
    r.similar = near.map((o) => o.name);       // noms voisins : probablement un doublon
  }
  return rows;
}

const find = (userId, name) => list(userId).find((c) => c.name === name) || null;

// Vue d'une catégorie pour la page de modification : conséquences exactes avant de valider
function impact(userId, name) {
  const cat = find(userId, name);
  if (!cat) return null;
  const others = db.prepare("SELECT COUNT(DISTINCT instructor_id) AS n FROM courses WHERE instructor_id != ? AND category = ?").get(userId, name).n;
  const courses = db.prepare("SELECT id, title, published, archived FROM courses WHERE instructor_id = ? AND category = ? ORDER BY title COLLATE NOCASE LIMIT 8").all(userId, name);
  return { ...cat, otherInstructors: others, courses };
}

// Nom à enregistrer pour une formation : l'orthographe d'une catégorie déjà existante du formateur (même nom à la casse ou aux accents près
// ou même adresse publique) plutôt qu'un doublon ; « Autre » si rien n'est saisi.
function canonical(userId, input) {
  const name = cleanName(input).slice(0, MAX);
  if (!name) return "Autre";
  const slug = slugify(name);
  const own = db.prepare("SELECT DISTINCT category FROM courses WHERE instructor_id = ?").all(userId).map((r) => r.category);
  return own.find((c) => c === name) || own.find((c) => c.toLowerCase() === name.toLowerCase()) || (slug && own.find((c) => slugify(c) === slug)) || DEFAULTS.find((c) => slugify(c) === slug) || name;
}

// Choix proposés dans le formulaire d'une formation : les catégories habituelles, celles du formateur, et celle de la formation (jamais perdue)
function choices(userId, current) {
  const own = db.prepare("SELECT DISTINCT category FROM courses WHERE instructor_id = ? ORDER BY category COLLATE NOCASE").all(userId).map((r) => r.category);
  const seen = new Set();
  return [...DEFAULTS, ...own, current].map((c) => cleanName(c)).filter((c) => c && !seen.has(c) && seen.add(c));
}

function rename(req, from, to, { merge = false } = {}) {
  const userId = req.session.user.id;
  const source = find(userId, String(from || ""));
  if (!source) return { ok: false, error: "Cette catégorie n'existe plus parmi vos formations." };
  const name = cleanName(to);
  if (!name) return { ok: false, error: "Saisissez un nom de catégorie." };
  if (name.length > MAX) return { ok: false, error: `Le nom est limité à ${MAX} caractères.` };
  if (!slugify(name)) return { ok: false, error: "Le nom doit contenir au moins une lettre ou un chiffre." };
  if (name === source.name) return { ok: false, error: "Le nouveau nom est identique à l'actuel." };
  // Une autre catégorie du formateur porte déjà ce nom (ou la même adresse publique) : c'est une fusion, à confirmer
  const target = list(userId).find((c) => c.name !== source.name && (c.name.toLowerCase() === name.toLowerCase() || c.slug === slugify(name)));
  if (target && !merge) return { ok: false, needsMerge: true, target: target.name, error: `« ${target.name} » existe déjà : confirmez la fusion pour y regrouper ${source.total} formation${source.total > 1 ? "s" : ""}.` };
  const finalName = target ? target.name : name;
  const oldSlug = slugify(source.name), newSlug = slugify(finalName);

  let moved = 0;
  db.exec("BEGIN IMMEDIATE");
  try {
    moved = db.prepare("UPDATE courses SET category = ? WHERE instructor_id = ? AND category = ?").run(finalName, userId, source.name).changes;
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); throw e; }

  // Ancienne adresse publique → nouvelle (301), sauf si quelqu'un d'autre utilise encore l'ancien nom ou s'il s'agit d'un simple changement de casse
  let redirected = false;
  if (oldSlug && newSlug && oldSlug !== newSlug) {
    const stillUsed = db.prepare("SELECT DISTINCT category FROM courses").all().some((r) => slugify(r.category) === oldSlug);
    const redirects = require("../seo/redirects");
    // revenir à un ancien nom : la redirection automatique inverse est devenue fausse
    const back = db.prepare("SELECT id FROM seo_redirects WHERE source_path = ? AND note = ? AND site_id IS NULL").get(`/categorie/${newSlug}`, NOTE);
    if (back) redirects.remove(back.id, userId);
    if (!stillUsed) redirected = redirects.create({ source: `/categorie/${oldSlug}`, target: `/categorie/${newSlug}`, status: 301, note: NOTE }, userId, { source: "categories" }).ok;
  }
  audit.record(req, { action: "category.renamed", resourceType: "category", resourceId: null, summary: `Catégorie « ${source.name} » ${target ? "fusionnée dans" : "renommée en"} « ${finalName} » (${moved} formation${moved > 1 ? "s" : ""})`, details: { de: source.name, vers: finalName, formations: moved, fusion: Boolean(target), redirection: redirected } });
  return { ok: true, moved, merged: Boolean(target), name: finalName, from: source.name, redirected };
}

module.exports = { MAX, DEFAULTS, cleanName, nearKey, list, find, impact, canonical, choices, rename };
