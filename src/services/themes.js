// KOLAKISA CMS → Apparence → Thèmes : thèmes installés et thème actif PAR SITE.
//
// Un thème est un paquet de DONNÉES (jetons du design system, marketing/themes/catalog.js). Il n'existe pas de second moteur de thèmes :
//   • activer un thème sur un SITE = enregistrer ses jetons avec le moteur du Page Builder (pages.saveSiteDesign → mk_sites.tokens) ;
//   • activer un thème sur le site PRINCIPAL = le publier avec le moteur d'apparence (appearance.setDraft + publish → appearance_configs).
// Le rendu public lit déjà ces deux sources : l'activation a donc un effet réel, vérifié après écriture (sinon l'état précédent est rétabli).
// Portée : site_id NULL = site principal. Chaque lecture/écriture porte sur UN site précis, fourni par l'appelant depuis le contexte vérifié
// de la requête (jamais déduit ici). Les codes d'accès (permissions, accès limité) sont contrôlés par les routes.
const db = require("../config/database");
const catalog = require("../marketing/themes/catalog");
const tokensLib = require("../marketing/pages/tokens");
const appearance = require("./appearance");
const { sameScope } = require("./siteScope");
const { transaction } = require("../marketing/db/tx");
const { recordAudit } = require("../marketing/audit");
const { UserError } = require("../utils/errors");

const ORIGINAL = catalog.ORIGINAL;
const parse = (t) => { try { return t ? JSON.parse(t) : null; } catch { return null; } };
const scope = (siteId) => { if (siteId === null || siteId === undefined) return null; if (Number.isInteger(siteId) && siteId > 0) return siteId; throw new TypeError("Site invalide."); };
const pages = () => require("../marketing/pages");

const rows = (siteId) => db.prepare(`SELECT * FROM cms_themes WHERE ${sameScope("site_id")} ORDER BY installed_at, id`).all(scope(siteId));
const rowOf = (siteId, key) => db.prepare(`SELECT * FROM cms_themes WHERE ${sameScope("site_id")} AND theme_key = ?`).get(scope(siteId), String(key));
const activeRow = (siteId) => db.prepare(`SELECT * FROM cms_themes WHERE ${sameScope("site_id")} AND active = 1`).get(scope(siteId));
const activeKey = (siteId) => { const r = activeRow(siteId); return r ? r.theme_key : catalog.DEFAULT_KEY; };

// Entrée affichable : état = active | inactive | incompatible
function present(manifest, { source, row, active }) {
  const compatible = catalog.isCompatible(manifest);
  return {
    key: manifest.key, name: manifest.name, version: manifest.version, author: manifest.author, description: manifest.description, api: manifest.api, tokens: tokensLib.normalizeTokens(manifest.tokens || {}, { strict: false }), // jamais de rendu cassé par un manifeste ancien ou incomplet
   
    source, builtin: manifest.key === catalog.DEFAULT_KEY, compatible, state: active ? "active" : compatible ? "inactive" : "incompatible",
    removable: Boolean(row) && !active, installedAt: row ? row.installed_at : null, activatedAt: row && row.activated_at, hasPrevious: Boolean(row && row.active && row.previous_tokens),
  };
}
// Thèmes installés sur CE site (le thème d'origine est toujours présent), recherche par nom, auteur ou description
function installed(siteId, { q = "" } = {}) {
  const act = activeKey(siteId);
  const out = [present(ORIGINAL, { source: "integre", row: null, active: act === ORIGINAL.key })];
  for (const r of rows(siteId)) { const m = parse(r.manifest); if (m) out.push(present(m, { source: r.source, row: r, active: r.active === 1 })); }
  const needle = String(q || "").trim().toLowerCase();
  return needle ? out.filter((t) => [t.name, t.author, t.description, t.key].some((v) => String(v).toLowerCase().includes(needle))) : out;
}
// Catalogue Kolakisa avec, pour CE site, l'indication « déjà installé »
function available(siteId, { q = "" } = {}) {
  const have = new Set(rows(siteId).map((r) => r.theme_key));
  const needle = String(q || "").trim().toLowerCase();
  return catalog.catalog().filter((m) => !needle || [m.name, m.author, m.description, m.key].some((v) => String(v).toLowerCase().includes(needle)))
    .map((m) => ({ ...present(m, { source: "catalogue", row: null, active: false }), installed: have.has(m.key), removable: false }));
}
function get(siteId, key) {
  if (key === catalog.DEFAULT_KEY) return present(ORIGINAL, { source: "integre", row: null, active: activeKey(siteId) === ORIGINAL.key });
  const r = rowOf(siteId, key);
  const m = r && parse(r.manifest);
  return m ? present(m, { source: r.source, row: r, active: r.active === 1 }) : null;
}

const audit = (ctx, siteId, action, key, metadata = {}) => {
  try { recordAudit(db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action, resourceType: "theme", resourceId: key, siteId, metadata }); } catch { /* la journalisation ne bloque jamais l'opération */ }
};
// Le site visé existe, appartient à l'organisation et accepte les écritures (actif, non supprimé) ; null = site principal
function writableSite(ctx, siteId) {
  const id = scope(siteId);
  if (id !== null) return pages().requireSite(ctx, id, { active: true });
  return null;
}

// ---------- Installation (données uniquement) ----------
function insert(ctx, siteId, manifest, source) {
  if (!catalog.isCompatible(manifest)) throw new UserError(`Le thème « ${manifest.name} » utilise un format plus récent (api ${manifest.api}) que celui de ce Kolakisa (api ${catalog.THEME_API}) : il ne peut pas être installé.`);
  const dup = rowOf(siteId, manifest.key);
  if (dup) throw new UserError(`Le thème « ${manifest.name} » est déjà installé sur ce site${dup.active ? " (et actif)" : ""}. Supprimez-le d'abord pour installer une autre version.`);
  if (db.prepare(`SELECT COUNT(*) n FROM cms_themes WHERE ${sameScope("site_id")}`).get(scope(siteId)).n >= 30) throw new UserError("30 thèmes installés au plus par site : supprimez-en un avant d'en installer un autre.");
  try {
    db.prepare("INSERT INTO cms_themes (site_id, theme_key, name, version, source, manifest, checksum, installed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(scope(siteId), manifest.key, manifest.name, manifest.version, source, JSON.stringify(manifest), catalog.checksumOf(manifest), ctx.userId ?? null);
  } catch (e) { if (/UNIQUE/i.test(String(e.message))) throw new UserError(`Le thème « ${manifest.name} » vient d'être installé par une autre personne.`); throw e; }
  audit(ctx, siteId, "theme.installed", manifest.key, { version: manifest.version, source, checksum: catalog.checksumOf(manifest) });
  return get(siteId, manifest.key);
}
function installFromCatalog(ctx, siteId, key) {
  writableSite(ctx, siteId);
  const m = catalog.fromCatalog(String(key));
  if (!m) throw new UserError("Ce thème n'existe pas dans le catalogue Kolakisa.");
  return insert(ctx, siteId, m, "catalogue");
}
function installPackage(ctx, siteId, rawJson) {
  writableSite(ctx, siteId);
  const m = catalog.parsePackage(rawJson);
  // Un paquet ne peut pas se faire passer pour un thème du catalogue avec un contenu différent
  const official = catalog.fromCatalog(m.key);
  if (official && catalog.checksumOf(official) !== catalog.checksumOf(m)) throw new UserError(`L'identifiant « ${m.key} » est celui d'un thème du catalogue Kolakisa, avec un contenu différent : changez l'identifiant du paquet.`);
  return insert(ctx, siteId, m, official ? "catalogue" : "import");
}

// ---------- Application des jetons au moteur de design du site ----------
// Retourne les jetons effectivement en vigueur AVANT l'application (pour le retour au thème précédent)
function currentTokens(ctx, siteId) {
  const id = scope(siteId);
  return id === null ? appearance.state(null).published.tokens : pages().requireSite(ctx, id).tokens;
}
function applyTokens(ctx, siteId, tokens, label) {
  const id = scope(siteId);
  const keepCustom = currentTokens(ctx, id).customColors || []; // les couleurs ajoutées par l'équipe survivent : des pages peuvent les utiliser
  const next = tokensLib.normalizeTokens({ ...tokens, customColors: keepCustom }, { strict: false });
  if (id === null) {
    const st = appearance.state(null);
    if (st.hasDraft) throw new UserError("Un brouillon d'apparence est en cours sur le site principal : publiez-le ou annulez-le (Apparence → Éditeur du site) avant de changer de thème.");
    if (JSON.stringify(st.published.tokens) !== JSON.stringify(next)) {
      appearance.setDraft(null, { ...st.published, tokens: next }, ctx.userId ?? null);
      appearance.publish(null, ctx.userId ?? null, label);
    }
    appearance.bump();
  } else {
    const site = pages().requireSite(ctx, id, { active: true });
    pages().saveSiteDesign(ctx, id, { tokens: next, revision: site.settings_revision });
  }
  return next;
}
// Le rendu public lit bien les nouveaux jetons (même source que les pages publiques)
function verifyApplied(ctx, siteId, next) {
  const id = scope(siteId);
  if (id === null) {
    const parts = appearance.parts({ preview: false });
    const same = JSON.stringify(appearance.state(null).published.tokens) === JSON.stringify(next);
    return same && (!parts.css || parts.css.toLowerCase().includes(String(next.colors.primary).toLowerCase()) || next.colors.primary === tokensLib.DEFAULT_TOKENS.colors.primary);
  }
  const site = pages().getSite(ctx, id);
  return Boolean(site) && JSON.stringify(site.tokens) === JSON.stringify(next) && tokensLib.tokensToCss(site.tokens).toLowerCase().includes(String(next.colors.primary).toLowerCase()); // même source que la page publique du site (variables --kw-…)
}

// ---------- Activation ----------
function activate(ctx, siteId, key) {
  writableSite(ctx, siteId);
  const theme = get(siteId, String(key));
  if (!theme) throw new UserError("Ce thème n'est pas installé sur ce site.");
  if (!theme.compatible) throw new UserError(`Le thème « ${theme.name} » est incompatible avec cette version de Kolakisa : il ne peut pas être activé.`);
  const cur = activeRow(siteId);
  if ((cur ? cur.theme_key : catalog.DEFAULT_KEY) === theme.key) throw new UserError(`Le thème « ${theme.name} » est déjà actif sur ce site.`);
  const before = currentTokens(ctx, siteId);
  const previousKey = cur ? cur.theme_key : "";
  let next;
  try {
    transaction(db, () => {
      next = applyTokens(ctx, siteId, theme.tokens, `Thème « ${theme.name} »`);
      db.prepare(`UPDATE cms_themes SET active = 0 WHERE ${sameScope("site_id")} AND active = 1`).run(scope(siteId));
      if (theme.key !== catalog.DEFAULT_KEY) {
        const info = db.prepare(`UPDATE cms_themes SET active = 1, activated_by = ?, activated_at = datetime('now'), previous_key = ?, previous_tokens = ? WHERE ${sameScope("site_id")} AND theme_key = ?`)
          .run(ctx.userId ?? null, previousKey, JSON.stringify(before), scope(siteId), theme.key);
        if (info.changes !== 1) throw new UserError("Ce thème vient d'être supprimé : rechargez la liste.");
      } else if (cur) {
        // Retour au thème d'origine : on garde de quoi revenir en arrière sur la ligne du thème quitté
        db.prepare("UPDATE cms_themes SET previous_tokens = ?, previous_key = '' WHERE id = ?").run(JSON.stringify(before), cur.id);
      }
    });
  } catch (e) {
    try { rollbackTokens(ctx, siteId, before); } catch { /* état d'origine déjà en place */ }
    throw e;
  }
  if (!verifyApplied(ctx, siteId, next)) {
    // Le rendu public ne reflète pas le thème : retour à l'état précédent, jamais d'affichage « activé » trompeur
    try { rollbackTokens(ctx, siteId, before); } catch { /* ignoré */ }
    db.prepare(`UPDATE cms_themes SET active = 0 WHERE ${sameScope("site_id")}`).run(scope(siteId));
    if (cur) db.prepare("UPDATE cms_themes SET active = 1 WHERE id = ?").run(cur.id);
    throw new UserError("Le thème n'a pas pu être appliqué au rendu du site : l'apparence précédente a été rétablie.");
  }
  audit(ctx, siteId, "theme.activated", theme.key, { from: previousKey || catalog.DEFAULT_KEY, version: theme.version });
  return get(siteId, theme.key);
}
function rollbackTokens(ctx, siteId, tokens) {
  const id = scope(siteId);
  if (id === null) {
    const st = appearance.state(null);
    if (JSON.stringify(st.published.tokens) !== JSON.stringify(tokens) && !st.hasDraft) { appearance.setDraft(null, { ...st.published, tokens }, ctx.userId ?? null); appearance.publish(null, ctx.userId ?? null, "Retour au thème précédent"); }
    appearance.bump();
  } else {
    const site = pages().getSite(ctx, id);
    if (site) pages().saveSiteDesign(ctx, id, { tokens, revision: site.settings_revision });
  }
}
// « Revenir au thème précédent » : restaure les jetons d'avant l'activation et le thème qui était actif
function revert(ctx, siteId) {
  writableSite(ctx, siteId);
  const cur = activeRow(siteId);
  if (!cur || !cur.previous_tokens) throw new UserError("Aucun thème précédent à rétablir sur ce site.");
  const before = parse(cur.previous_tokens);
  if (!before) throw new UserError("L'état précédent est illisible : activez un thème manuellement.");
  const prevKey = cur.previous_key || catalog.DEFAULT_KEY;
  const prevRow = prevKey === catalog.DEFAULT_KEY ? null : rowOf(siteId, prevKey);
  const now = currentTokens(ctx, siteId);
  let next;
  transaction(db, () => {
    next = applyTokens(ctx, siteId, before, "Retour au thème précédent");
    db.prepare("UPDATE cms_themes SET active = 0, previous_tokens = NULL, previous_key = NULL WHERE id = ?").run(cur.id);
    if (prevRow) db.prepare("UPDATE cms_themes SET active = 1, activated_by = ?, activated_at = datetime('now') WHERE id = ?").run(ctx.userId ?? null, prevRow.id);
  });
  if (!verifyApplied(ctx, siteId, next)) { try { rollbackTokens(ctx, siteId, now); } catch { /* ignoré */ } throw new UserError("Le rendu du site n'a pas pris en compte le retour au thème précédent."); }
  audit(ctx, siteId, "theme.reverted", cur.theme_key, { to: prevKey });
  return get(siteId, prevKey);
}

// ---------- Suppression : uniquement la ligne de ce site (aucun fichier, aucune autre donnée) ----------
function remove(ctx, siteId, key) {
  writableSite(ctx, siteId);
  if (String(key) === catalog.DEFAULT_KEY) throw new UserError("Le thème d'origine fait partie de Kolakisa : il ne peut pas être supprimé.");
  const r = rowOf(siteId, key);
  if (!r) throw new UserError("Ce thème n'est pas installé sur ce site.");
  if (r.active === 1) throw new UserError("Le thème actif ne peut pas être supprimé : activez d'abord un autre thème.");
  // Un thème inactif peut servir de « thème précédent » à l'actif : ce lien est retiré (le retour utilisera l'apparence d'origine mémorisée)
  transaction(db, () => {
    db.prepare(`UPDATE cms_themes SET previous_key = '' WHERE ${sameScope("site_id")} AND previous_key = ?`).run(scope(siteId), r.theme_key);
    db.prepare(`DELETE FROM cms_themes WHERE id = ? AND ${sameScope("site_id")}`).run(r.id, scope(siteId));
  });
  audit(ctx, siteId, "theme.removed", r.theme_key, { version: r.version });
  return { key: r.theme_key, name: r.name };
}

// ---------- Aperçu : jetons du site avec ceux du thème (sans rien enregistrer) ----------
// baseTokens : jetons en vigueur du site, fournis par l'appelant (les couleurs ajoutées par l'équipe sont conservées, comme à l'activation)
function previewTokens(siteId, key, baseTokens) {
  const k = String(key);
  const m = get(siteId, k) || (catalog.fromCatalog(k) && present(catalog.fromCatalog(k), { source: "catalogue", row: null, active: false }));
  if (!m || !m.compatible) return null;
  return { theme: m, tokens: tokensLib.normalizeTokens({ ...m.tokens, customColors: (baseTokens && baseTokens.customColors) || [] }, { strict: false }) };
}

// ---------- Éditeur de fichiers : manifeste brut et enregistrement ----------
// Manifeste complet d'un thème de CE site (brut, tel qu'enregistré) ; le thème d'origine est intégré au moteur : lisible, jamais modifiable.
function manifestOf(siteId, key) {
  if (key === catalog.DEFAULT_KEY) return { manifest: ORIGINAL, builtin: true, active: activeKey(siteId) === ORIGINAL.key, source: "integre" };
  const r = rowOf(siteId, key);
  const m = r && parse(r.manifest);
  return m ? { manifest: m, builtin: false, active: r.active === 1, source: r.source, row: r } : null;
}
// Remplace le manifeste d'un thème installé par une version DÉJÀ validée (catalog.validateManifest). Si le thème est actif, ses jetons sont
// appliqués au rendu (vérifié ; sinon l'état précédent est rétabli). Tout ou rien : rien n'est enregistré si l'application échoue.
function saveManifest(ctx, siteId, key, next, { revisions } = {}) {
  writableSite(ctx, siteId);
  const row = rowOf(siteId, String(key));
  if (!row) throw new UserError("Ce thème n'est pas installé sur ce site.");
  if (next.key !== row.theme_key) throw new UserError("L'identifiant d'un thème ne peut pas être modifié.");
  if (!catalog.isCompatible(next)) throw new UserError(`Le format (api ${next.api}) est plus récent que celui de ce Kolakisa : enregistrement refusé.`);
  const wasActive = row.active === 1;
  const before = wasActive ? currentTokens(ctx, siteId) : null;
  let applied = null;
  try {
    transaction(db, () => {
      const info = db.prepare(`UPDATE cms_themes SET name = ?, version = ?, manifest = ?, checksum = ? WHERE id = ? AND checksum = ?`).run(next.name, next.version, JSON.stringify(next), catalog.checksumOf(next), row.id, row.checksum);
      if (info.changes !== 1) throw new UserError("Ce thème vient d'être modifié par une autre personne : rechargez le fichier.");
      if (wasActive) applied = applyTokens(ctx, siteId, next.tokens, `Thème « ${next.name} » (fichier modifié)`);
      if (typeof revisions === "function") revisions();
    });
  } catch (e) {
    if (wasActive && applied) { try { rollbackTokens(ctx, siteId, before); } catch { /* état d'origine déjà en place */ } }
    throw e;
  }
  if (wasActive && !verifyApplied(ctx, siteId, applied)) {
    try { rollbackTokens(ctx, siteId, before); } catch { /* ignoré */ }
    db.prepare("UPDATE cms_themes SET name = ?, version = ?, manifest = ?, checksum = ? WHERE id = ?").run(row.name, row.version, row.manifest, row.checksum, row.id);
    throw new UserError("Le rendu du site n'a pas pris en compte la modification : le thème a été rétabli tel qu'avant.");
  }
  audit(ctx, siteId, "theme.file_saved", row.theme_key, { version: next.version, checksum: catalog.checksumOf(next), active: wasActive });
  return get(siteId, row.theme_key);
}

module.exports = { installed, available, get, activeKey, installFromCatalog, installPackage, activate, revert, remove, previewTokens, manifestOf, saveManifest, audit };
