// KOLAKISA Médias — diagnostic d'isolation (LECTURE SEULE, équipe de l'organisation) : repère, sans rien modifier, les médias dont le site propriétaire est absent, incohérent ou ambigu,
// les fichiers sans fiche, les fiches sans fichier, les médias d'un site cités par un autre site, les médias communs encore cités par des sites et les doublons de contenu.
// Il ne réattribue, ne déplace et ne supprime JAMAIS rien : un propriétaire incertain est signalé, pas deviné.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { uploadsRoot } = require("../../config/paths");
const media = require("./index");

const FOLDER = /^\/uploads\/marketing\/(\d{1,9})(?:\/site-(\d{1,9}))?(?:\/\d{4}\/(?:0[1-9]|1[0-2]))?\/[^/]+$/;

function audit(ctx) {
  const db = ctx.db, org = ctx.organizationId;
  const rows = db.prepare("SELECT id, path, name, reach, site_id, size, mime, deleted_at FROM mk_media WHERE organization_id = ? ORDER BY id").all(org);
  const sites = new Set(db.prepare("SELECT id FROM mk_sites WHERE organization_id = ? AND deleted_at IS NULL").all(org).map((r) => r.id));
  const out = { totals: { medias: rows.length, shared: rows.filter((r) => r.reach === "shared").length, site: rows.filter((r) => r.reach === "site").length }, anomalies: [] };
  const add = (kind, row, detail) => out.anomalies.push({ kind, id: row ? row.id : null, name: row ? row.name : null, path: row ? row.path : null, detail });

  for (const r of rows) {
    const m = FOLDER.exec(r.path);
    if (r.reach === "site" && !Number.isInteger(r.site_id)) add("sans_site_proprietaire", r, "média « propre à un site » sans identifiant de site");
    if (r.reach === "shared" && r.site_id !== null) add("commun_avec_site", r, `média commun rattaché au site ${r.site_id}`);
    if (Number.isInteger(r.site_id) && !sites.has(r.site_id)) add("site_inconnu_ou_supprime", r, `site ${r.site_id} absent, supprimé ou d'une autre organisation`);
    if (!m) add("adresse_hors_dossier_des_medias", r, "l'adresse ne suit pas /uploads/marketing/<organisation>[/site-<id>]/<fichier>");
    else {
      if (Number(m[1]) !== org) add("organisation_incoherente", r, `dossier de l'organisation ${m[1]}`);
      const folderSite = m[2] ? Number(m[2]) : null;
      if (folderSite !== (r.site_id ?? null)) add("dossier_different_du_proprietaire", r, `dossier ${folderSite === null ? "commun" : "site-" + folderSite} mais propriétaire ${r.site_id === null ? "commun" : "site " + r.site_id}`);
    }
    const where = m ? media.parsePublicPath(ctx, r.path) : null;
    if (where && !fs.existsSync(where.absolute)) add("fiche_sans_fichier", r, "le fichier n'est pas sur le disque");
  }

  // Fichiers du disque sans fiche (dossier commun et dossiers de site de CETTE organisation ; les versions réduites v/ sont des dérivés)
  const root = path.join(uploadsRoot, "marketing", String(org));
  const known = new Set(rows.map((r) => r.path));
  const scan = (dir, urlBase, owner) => {
    let names = [];
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of names) {
      if (e.isDirectory()) {
        if (/^site-\d{1,9}$/.test(e.name) && owner === null) scan(path.join(dir, e.name), `${urlBase}/${e.name}`, Number(e.name.slice(5)));
        else if (/^\d{4}$/.test(e.name) || (/^(0[1-9]|1[0-2])$/.test(e.name) && /\/\d{4}$/.test(urlBase))) scan(path.join(dir, e.name), `${urlBase}/${e.name}`, owner); // dossiers aaaa/mm (option « organiser par mois et année »)
        continue;
      }
      if (!known.has(`${urlBase}/${e.name}`)) add("fichier_sans_fiche", null, `${urlBase}/${e.name} (${owner === null ? "dossier commun : propriétaire indéterminé" : "dossier du site " + owner}) — conservé, non attribué`);
    }
  };
  scan(root, `/uploads/marketing/${org}`, null);

  // Références croisées : un média propre à un site cité par le contenu d'un AUTRE site (ou de l'organisation)
  for (const c of media.crossSiteUsage(ctx)) add("reference_entre_sites", c.media, c.foreign.map((u) => `${u.kind} « ${u.name} »${u.site_id ? " (site " + u.site_id + ")" : ""}`).join(", "));
  // Médias communs (site principal) encore cités par le contenu d'un site : plus proposés dans sa médiathèque, à attribuer par l'équipe
  for (const r of rows.filter((x) => x.reach === "shared" && !x.deleted_at)) {
    const foreign = media.mediaUsage(ctx, media.getMedia(ctx, r.id) || { path: r.path, id: r.id }).filter((u) => Number.isInteger(u.site_id));
    if (foreign.length) add("commun_cite_par_un_site", r, foreign.map((u) => `${u.kind} « ${u.name} » (site ${u.site_id})`).join(", "));
  }
  // Doublons de contenu (même taille et même type, puis même empreinte)
  const groups = new Map();
  for (const r of rows) { const k = `${r.size}|${r.mime}`; groups.set(k, [...(groups.get(k) || []), r]); }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const byHash = new Map();
    for (const r of list) { const w = media.parsePublicPath(ctx, r.path); try { const h = crypto.createHash("sha256").update(fs.readFileSync(w.absolute)).digest("hex"); byHash.set(h, [...(byHash.get(h) || []), r]); } catch { /* fichier absent : déjà signalé */ } }
    for (const same of byHash.values()) if (same.length > 1) add("doublon_de_contenu", same[0], `${same.length} fiches au contenu identique : ${same.map((x) => `#${x.id} (${x.site_id === null ? "commun" : "site " + x.site_id})`).join(", ")}`);
  }
  out.summary = out.anomalies.reduce((acc, a) => ({ ...acc, [a.kind]: (acc[a.kind] || 0) + 1 }), {});
  return out;
}
module.exports = { audit };
