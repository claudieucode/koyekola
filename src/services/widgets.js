// KOLAKISA CMS → Apparence → Widgets : mise en page des widgets PAR SITE (table cms_widget_layouts, une ligne par site ; site_id NULL = site principal).
//
// Une mise en page = zones (colonne latérale, sections de pied de page) → blocs ordonnés, plus la liste des blocs DÉSACTIVÉS (conservés avec leurs réglages, jamais rendus).
// Tout passe par marketing/widgets/catalog.js : le même code valide à l'enregistrement et produit le HTML public. Chaque lecture/écriture porte sur UN site précis,
// fourni par l'appelant depuis le contexte vérifié de la requête (jamais déduit ici) ; l'accès limité à un site est contrôlé par les routes.
// Aucun cache : le rendu lit la base à chaque page (les blocs dynamiques — articles récents… — doivent rester à jour) ; il n'y a donc pas de clé de cache à isoler.
const db = require("../config/database");
const catalog = require("../marketing/widgets/catalog");
const { sameScope } = require("./siteScope");
const { transaction } = require("../marketing/db/tx");
const { recordAudit } = require("../marketing/audit");
const { UserError } = require("../utils/errors");

const scope = (siteId) => { if (siteId === null || siteId === undefined) return null; if (Number.isInteger(siteId) && siteId > 0) return siteId; throw new TypeError("Site invalide."); };
const rowOf = (siteId) => db.prepare(`SELECT * FROM cms_widget_layouts WHERE ${sameScope("site_id")}`).get(scope(siteId));
const parse = (t) => { try { const v = JSON.parse(t); return v && typeof v === "object" ? v : null; } catch { return null; } };

// Mise en page lue : toujours valide (un contenu corrompu ou ancien est ramené à une mise en page vide, jamais à une erreur)
function get(siteId) {
  const row = rowOf(siteId);
  let layout = catalog.emptyLayout();
  if (row) { try { layout = catalog.cleanLayout(parse(row.layout) || {}); } catch { layout = catalog.emptyLayout(); } }
  return { layout, revision: row ? row.revision : 0, updatedAt: row ? row.updated_at : null, updatedBy: row ? row.updated_by : null };
}

// Enregistrement tout-ou-rien. revision : celle que la personne a chargée (0 = jamais enregistrée) ; périmée → conflit, rien n'est écrit.
function save(ctx, siteId, rawLayout, revision) {
  const id = scope(siteId);
  if (id !== null) require("../marketing/pages").requireSite(ctx, id, { active: true });
  let layout;
  try { layout = catalog.cleanLayout(rawLayout); } catch (e) { throw new UserError(e.message); }
  const asked = Number.isInteger(revision) && revision >= 0 ? revision : -1;
  const json = JSON.stringify(layout);
  if (json.length > 400000) throw new UserError("La mise en page est trop volumineuse.");
  return transaction(db, () => {
    const row = rowOf(id);
    if ((row ? row.revision : 0) !== asked) throw new UserError("Ces widgets ont été modifiés ailleurs depuis votre chargement : rechargez la page pour voir la dernière version avant d'enregistrer.", 409);
    if (row) db.prepare("UPDATE cms_widget_layouts SET layout = ?, revision = revision + 1, updated_by = ?, updated_at = datetime('now') WHERE id = ?").run(json, ctx.userId ?? null, row.id);
    else db.prepare("INSERT INTO cms_widget_layouts (site_id, layout, revision, updated_by) VALUES (?, ?, 1, ?)").run(id, json, ctx.userId ?? null);
    const count = Object.values(layout.zones).reduce((n, z) => n + z.length, 0);
    try { recordAudit(db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action: "widgets.saved", resourceType: "widgets", resourceId: String(id ?? "principal"), siteId: id, metadata: { blocks: count, inactive: layout.inactive.length } }); } catch { /* la journalisation ne bloque jamais l'enregistrement */ }
    return get(id);
  });
}

// ---------- Rendu public ----------
function siteNameOf(siteId) {
  if (siteId === null) return process.env.SITE_NAME || "KOLAKISA";
  try { const r = db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(siteId); return r ? r.name : ""; } catch { return ""; }
}
function siteLive(siteId) {
  if (siteId === null) return true;
  try { const r = db.prepare("SELECT status, deleted_at FROM mk_sites WHERE id = ?").get(siteId); return Boolean(r && r.status === "active" && !r.deleted_at); } catch { return false; }
}

// HTML d'UNE zone d'UN site (chaîne vide si rien à afficher : la page garde alors son affichage d'origine). Les blocs désactivés ne sont jamais rendus.
function renderZone(siteId, zoneKey) {
  try {
    const id = scope(siteId);
    const zone = catalog.ZONES.find((z) => z.key === zoneKey);
    if (!zone || !siteLive(id)) return "";
    const row = rowOf(id);
    if (!row) return "";
    const layout = catalog.cleanLayout(parse(row.layout) || {});
    const urls = require("./urls");
    const env = { db, siteId: id, siteName: siteNameOf(id), scope: urls.contentScope("post", "posts.id", id ? { id } : null) };
    const html = layout.zones[zone.key].map((b) => catalog.renderBlock(b, env)).filter(Boolean).join("");
    if (!html) return "";
    return `<aside class="kw-widget-zone kw-zone-${zone.key}" aria-label="${catalog.esc(zone.label)}"><link rel="stylesheet" href="/css/widgets.css">${html}</aside>`;
  } catch { return ""; } // un défaut de widgets n'empêche jamais une page publique de s'afficher
}

// Aperçu d'une mise en page non enregistrée (éditeur) : mêmes blocs, même rendu, rien n'est écrit
function previewBlock(siteId, rawBlock) {
  const id = scope(siteId);
  const block = catalog.cleanBlock(rawBlock, "Aperçu");
  const urls = require("./urls");
  return catalog.renderBlock(block, { db, siteId: id, siteName: siteNameOf(id), scope: urls.contentScope("post", "posts.id", id ? { id } : null) });
}

module.exports = { get, save, renderZone, previewBlock, ZONES: catalog.ZONES };
