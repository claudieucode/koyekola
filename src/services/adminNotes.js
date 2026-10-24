// Outils → Admin Notes : notes internes d'administration, PAR SITE (table mk_admin_notes, migration 103).
//
// Règles :
//  - une note appartient à UNE portée (organisation, site) ; site null = site principal. Chaque lecture ET chaque écriture porte sur cette portée,
//    fournie par l'appelant depuis le contexte vérifié de la requête : un identifiant de note d'un autre site se comporte comme une note inexistante ;
//  - le texte est stocké en texte brut (retours à la ligne conservés) et ÉCHAPPÉ à l'affichage ; aucun HTML n'est jamais interprété ;
//  - le contenu des notes n'est écrit dans AUCUN journal : seuls l'identifiant et l'action sont tracés par les routes ;
//  - les droits (notes.view / create / edit / delete) sont contrôlés par les routes ; ce service ne connaît que la portée.
const db = require("../config/database");
const { UserError } = require("../utils/errors");

const TITLE_MAX = 200, BODY_MAX = 20000, PAGE_SIZE = 20;
const scope = (siteId) => { if (siteId === null || siteId === undefined) return null; if (Number.isInteger(siteId) && siteId > 0) return siteId; throw new TypeError("Site invalide."); };
const orgOf = (organizationId) => { if (!Number.isInteger(organizationId) || organizationId < 1) throw new TypeError("Organisation invalide."); return organizationId; };

// Normalise un texte saisi : fins de ligne uniformes, caractères de contrôle retirés (sauf retour à la ligne et tabulation), pas de caractère nul
const SEPARATORS = new RegExp("[" + String.fromCharCode(0x2028) + String.fromCharCode(0x2029) + "]", "g");
const clean = (v) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").replace(SEPARATORS, "\n");
function validate({ title, body }) {
  const t = clean(title).replace(/\s+/g, " ").trim();
  const b = clean(body).replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
  const errors = {};
  if (!t) errors.title = "Le titre est obligatoire.";
  else if (t.length > TITLE_MAX) errors.title = `Le titre ne peut pas dépasser ${TITLE_MAX} caractères (${t.length} saisis).`;
  if (!b) errors.body = "Le contenu est obligatoire.";
  else if (b.length > BODY_MAX) errors.body = `Le contenu ne peut pas dépasser ${BODY_MAX} caractères (${b.length} saisis).`;
  return { title: t, body: b, errors, ok: Object.keys(errors).length === 0 };
}
const fail = (errors) => Object.assign(new UserError(Object.values(errors)[0]), { fields: errors });

const SELECT = `SELECT n.id, n.title, n.body, n.created_at, n.updated_at, n.author_id, n.updated_by, a.username AS author_name
  FROM mk_admin_notes n LEFT JOIN users a ON a.id = n.author_id`;
const where = "n.organization_id = ? AND n.site_id IS ?";

function list(organizationId, siteId, { page = 1, pageSize = PAGE_SIZE } = {}) {
  const org = orgOf(organizationId), site = scope(siteId);
  const total = db.prepare("SELECT COUNT(*) n FROM mk_admin_notes n WHERE " + where).get(org, site).n;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, Number.isInteger(page) ? page : 1), pages);
  const notes = db.prepare(`${SELECT} WHERE ${where} ORDER BY n.created_at DESC, n.id DESC LIMIT ? OFFSET ?`).all(org, site, pageSize, (current - 1) * pageSize);
  return { notes, total, page: current, pages, pageSize };
}
const get = (organizationId, siteId, id) => (Number.isInteger(id) ? db.prepare(`${SELECT} WHERE ${where} AND n.id = ?`).get(orgOf(organizationId), scope(siteId), id) || null : null);

function create(organizationId, siteId, userId, input) {
  const v = validate(input);
  if (!v.ok) throw fail(v.errors);
  const org = orgOf(organizationId), site = scope(siteId);
  // Double envoi accidentel : la même note du même auteur dans la même portée, créée il y a moins de 15 s, est renvoyée au lieu d'être dupliquée
  const dup = db.prepare(`SELECT id FROM mk_admin_notes WHERE organization_id = ? AND site_id IS ? AND author_id IS ? AND title = ? AND body = ? AND created_at >= datetime('now', '-15 seconds') ORDER BY id DESC LIMIT 1`).get(org, site, userId ?? null, v.title, v.body);
  if (dup) return { id: dup.id, duplicate: true };
  const info = db.prepare("INSERT INTO mk_admin_notes (organization_id, site_id, title, body, author_id) VALUES (?, ?, ?, ?, ?)").run(org, site, v.title, v.body, userId ?? null);
  return { id: Number(info.lastInsertRowid), duplicate: false };
}
function update(organizationId, siteId, userId, id, input) {
  const v = validate(input);
  if (!v.ok) throw fail(v.errors);
  const r = db.prepare(`UPDATE mk_admin_notes SET title = ?, body = ?, updated_at = datetime('now'), updated_by = ? WHERE id = ? AND organization_id = ? AND site_id IS ?`).run(v.title, v.body, userId ?? null, Number.isInteger(id) ? id : -1, orgOf(organizationId), scope(siteId));
  if (!r.changes) throw new UserError("Cette note n'existe pas (ou plus).", 404);
  return { id };
}
function remove(organizationId, siteId, id) {
  const r = db.prepare("DELETE FROM mk_admin_notes WHERE id = ? AND organization_id = ? AND site_id IS ?").run(Number.isInteger(id) ? id : -1, orgOf(organizationId), scope(siteId));
  if (!r.changes) throw new UserError("Cette note n'existe pas (ou plus) : rien n'a été supprimé.", 404);
  return { id };
}

module.exports = { list, get, create, update, remove, validate, TITLE_MAX, BODY_MAX, PAGE_SIZE };
