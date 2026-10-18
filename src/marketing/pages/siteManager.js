// R8 lot 1 — Gestionnaire central de sites : DONNÉES de la vue « Mes sites » (site principal + sites), lues côté serveur, jamais saisies par le navigateur.
// Le site principal est présenté comme un site normal (même colonnes, mêmes actions d'ouverture) ; ses chiffres sont ceux du site principal (site_id NULL), sans mélange avec les sites.
// Équipe de l'organisation seulement pour le site principal et pour les chiffres d'équipe/modules d'un site (un accès limité à un site passe par « Mes sites » de son profil, pas par ici).
const { checkCtx } = require("../audience/shared");
const siteModules = require("../siteModules");
const urls = require("../../services/urls");
const primarySite = require("../../services/primarySite");

const safeCount = (ctx, sql, ...a) => { try { return ctx.db.prepare(sql).get(...a).n; } catch { return 0; } };

// Modules ACTIVÉS (et réellement ouverts aux sites) de chaque site de la liste → Map(siteId → [{ key, label }])
function enabledModules(ctx, ids) {
  const out = new Map(ids.map((id) => [id, []]));
  if (!ids.length) return out;
  let rows = [];
  try { rows = ctx.db.prepare(`SELECT site_id, module FROM mk_site_modules WHERE organization_id = ? AND enabled = 1 AND site_id IN (${ids.map(() => "?").join(",")}) ORDER BY module`).all(ctx.organizationId, ...ids); } catch { /* base d'avant 084 */ }
  for (const r of rows) if (siteModules.isModule(r.module) && siteModules.MODULES[r.module].ready) out.get(r.site_id).push({ key: r.module, label: siteModules.MODULES[r.module].label });
  return out;
}

// Enrichit les sites déjà lus (pages.listSites) : équipe du site, contacts rattachés, modules activés, dernière modification
function enrich(ctx, sites) {
  checkCtx(ctx);
  const ids = sites.map((s) => s.id);
  const mods = enabledModules(ctx, ids);
  return sites.map((s) => ({
    ...s,
    members: safeCount(ctx, "SELECT COUNT(*) n FROM mk_site_members WHERE site_id = ?", s.id),
    contacts: safeCount(ctx, "SELECT COUNT(*) n FROM mk_contact_sites WHERE site_id = ? AND organization_id = ?", s.id, ctx.organizationId),
    modules: mods.get(s.id) || [],
    lastEdit: (() => { try { return ctx.db.prepare("SELECT MAX(updated_at) AS d FROM mk_landing_pages WHERE organization_id = ? AND site_id = ? AND archived_at IS NULL").get(ctx.organizationId, s.id).d; } catch { return null; } })(),
  }));
}

// Le site principal, présenté comme un site (mêmes champs que enrich) — ses contacts : ceux sans rattachement à un site
function mainSite(ctx) {
  checkCtx(ctx);
  const org = ctx.organizationId;
  let host = "";
  try { host = urls.mainHost(); } catch { /* sans SITE_URL */ }
  // R9-4 : si la ligne dédiée existe (migration R9-3 appliquée), elle IDENTIFIE le principal (nom, adresse lisible, description) ; ses contenus restent site_id NULL (id: null).
  const dedicated = primarySite.row(ctx.db, org);
  return {
    id: null, principal: true, dedicated: Boolean(dedicated), rowId: dedicated ? dedicated.id : null,
    name: dedicated ? dedicated.name : "Site principal", slug: dedicated ? dedicated.slug : "principal",
    description: dedicated && dedicated.description ? dedicated.description : "Le site historique de l'organisation : ses pages, son blog et ses formations.", status: "active", deleted_at: null,
    domain: host,
    pages: safeCount(ctx, "SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND site_id IS NULL AND archived_at IS NULL", org),
    published: safeCount(ctx, "SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND site_id IS NULL AND archived_at IS NULL AND status = 'published'", org),
    members: safeCount(ctx, "SELECT COUNT(*) n FROM mk_org_members WHERE organization_id = ?", org),
    contacts: safeCount(ctx, "SELECT COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND NOT EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = c.id)", org),
    modules: [], allModules: true,
    lastEdit: (() => { try { return ctx.db.prepare("SELECT MAX(updated_at) AS d FROM mk_landing_pages WHERE organization_id = ? AND site_id IS NULL AND archived_at IS NULL").get(org).d; } catch { return null; } })(),
    openHref: "/marketing/site-web/principal/tableau-de-bord",
  };
}

// Bande de chiffres du gestionnaire (sites actifs et archivés, pages en ligne, modules activés — tous sites confondus de l'organisation)
function totals(ctx, counts) {
  const org = ctx.organizationId;
  return {
    actifs: counts.actifs, archives: counts.archives,
    publiees: safeCount(ctx, "SELECT COUNT(*) n FROM mk_landing_pages p JOIN mk_sites s ON s.id = p.site_id WHERE p.organization_id = ? AND s.deleted_at IS NULL AND s.status = 'active' AND p.archived_at IS NULL AND p.status = 'published'", org) +
      safeCount(ctx, "SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND site_id IS NULL AND archived_at IS NULL AND status = 'published'", org),
    // seulement les modules réellement ouverts aux sites (comme les pastilles des lignes)
    modules: (() => { const ready = Object.keys(siteModules.MODULES).filter((k) => siteModules.MODULES[k].ready); return safeCount(ctx, `SELECT COUNT(*) n FROM mk_site_modules m JOIN mk_sites s ON s.id = m.site_id WHERE m.organization_id = ? AND m.enabled = 1 AND s.deleted_at IS NULL AND m.module IN (${ready.map(() => "?").join(",") || "NULL"})`, org, ...ready); })(),
  };
}

module.exports = { enrich, mainSite, totals, enabledModules };
