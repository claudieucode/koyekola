// KOLAKISA CMS → Redirections : espace de travail complet (tableau de bord, groupes, liens cassés 404, journaux, changements d'adresse, import / export, outils, paramètres).
// Un seul moteur (src/seo/redirects.js) et ses outils (src/seo/redirectTools.js). Les mêmes écrans servent :
//   - le site principal : /marketing/site-web/redirections/<écran>     (règles communes + sites visibles par la personne) ;
//   - un site          : /marketing/site-web/sites/<id>/redirections/<écran> (règles de CE site seulement ; le site vient de l'adresse vérifiée, jamais d'un champ).
// Droits : redirects.view (consulter, simuler, exporter), redirects.create (créer, importer, valider une proposition), redirects.edit (modifier, groupes, réglages, actions groupées),
// redirects.delete (supprimer, restauration complète), redirects.external (destination extérieure). Un site archivé est en lecture seule.
const express = require("express");
const { need, flashError, flashOk } = require("./kit");
const redirects = require("../../seo/redirects");
const tools = require("../../seo/redirectTools");
const notfound = require("../../seo/notfound");
const pages = require("../pages");

const BASE = "/marketing/site-web";
const SCREENS = ["tableau-de-bord", "groupes", "erreurs-404", "journaux", "adresses", "import-export", "outils", "parametres"];
const TITLES = { "tableau-de-bord": "Tableau de bord des redirections", groupes: "Groupes de redirections", "erreurs-404": "Liens cassés (erreurs 404)", journaux: "Journaux et statistiques",
  adresses: "Permaliens et adresses", "import-export": "Importer / Exporter", outils: "Outils avancés", parametres: "Paramètres des redirections" };
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const list = (v) => [].concat(v === undefined ? [] : v).map((x) => String(x));
const deny = (res, message = "Vous n'avez pas la permission d'effectuer cette action.") => res.status(403).render("error", { message });

module.exports = () => {
  const router = express.Router({ mergeParams: true });
  const SITE = "/site-web/sites/:id(\\d+)/redirections";
  const MAIN = "/site-web/redirections";

  // ----- Contexte : périmètre, adresses de base, droits -----
  const sitesOf = (ctx) => pages.listSites(ctx).filter((s) => s.status === "active").map((s) => ({ id: s.id, name: s.name }));
  function spaceCtx(req, res, next) {
    const space = res.locals.siteSpace;
    if (!space || space.principal || !Number.isInteger(space.siteId) || !req.mk.site || req.mk.site.id !== space.siteId) {
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      return res.status(reason === "forbidden" ? 403 : 404).render("error", { message: reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable." });
    }
    req.rd = { scope: { siteId: space.siteId }, base: `${space.base}/redirections`, space, readonly: space.status === "archived" || Boolean(space.deleted), principal: false, sites: [] };
    next();
  }
  function mainCtx(req, res, next) {
    const sites = sitesOf(req.mk.ctx);
    req.rd = { scope: { siteId: null, visible: sites.map((s) => s.id) }, base: `${BASE}/redirections`, space: null, readonly: false, principal: true, sites };
    next();
  }
  router.use(SITE, spaceCtx);
  router.use(MAIN, (req, res, next) => (req.path === "/" || [...SCREENS, "actions"].some((s) => req.path === `/${s}` || req.path.startsWith(`/${s}/`)) ? mainCtx(req, res, next) : next("router")));
  // Les écrans ci-dessous existent pour les deux périmètres : le routeur est monté deux fois (principal et site)
  const both = (method, sub, ...handlers) => {
    router[method](`${SITE}${sub}`, ...handlers);
    router[method](`${MAIN}${sub}`, ...handlers);
  };
  const can = (req) => ({
    view: req.mk.can("redirects.view"), create: req.mk.can("redirects.create") && !req.rd.readonly, edit: req.mk.can("redirects.edit") && !req.rd.readonly,
    del: req.mk.can("redirects.delete") && !req.rd.readonly, external: req.mk.can("redirects.external"),
  });
  const guard = (perm) => (req, res, next) => {
    if (req.rd.readonly && perm !== "redirects.view") { flashError(req, "Ce site est archivé : ses redirections sont en lecture seule."); return res.redirect(req.rd.base); }
    return need(perm)(req, res, next);
  };
  const go = (req, screen, qs = "") => `${req.rd.base}${screen ? `/${screen}` : ""}${qs}`;
  const ACTIVE = { "tableau-de-bord": "redirections/tableau", groupes: "redirections/groupes", "erreurs-404": "redirections/liens-casses", journaux: "redirections/journaux", adresses: "redirections/permaliens",
    "import-export": "redirections/import-export", outils: "redirections/outils", parametres: "redirections/parametres" };
  const render = (req, res, screen, extra = {}) => res.render("marketing/redirections-hub", {
    title: TITLES[screen], active: ACTIVE[screen], screen, rd: req.rd, can: can(req), space: req.rd.space || undefined, query: req.query, rdJs: true, ...extra,
  });
  const siteOfScope = (req) => (req.rd.principal ? null : req.rd.scope.siteId);
  const ext = (req, target) => !(redirects.isExternal(target) && !req.mk.can("redirects.external"));

  // ----- Tableau de bord -----
  both("get", "/tableau-de-bord", need("redirects.view"), (req, res) => {
    const d = tools.dashboard(req.rd.scope, { days: req.query.jours });
    render(req, res, "tableau-de-bord", { d });
  });

  // ----- Groupes -----
  both("get", "/groupes", need("redirects.view"), (req, res) => {
    render(req, res, "groupes", { groups: tools.listGroups(req.rd.scope), edit: req.query.modifier ? tools.getGroup(req.rd.scope, req.query.modifier) : null });
  });
  both("post", "/groupes", guard("redirects.edit"), (req, res) => {
    const r = tools.createGroup(req.rd.scope, { name: req.body.name, description: req.body.description, siteId: intOrNull(req.body.site_id) }, req.session.user.id);
    if (r.ok) flashOk(req, "Groupe créé."); else flashError(req, r.errors.join(" "));
    res.redirect(go(req, "groupes"));
  });
  both("post", "/groupes/:gid(\\d+)", guard("redirects.edit"), (req, res) => {
    const r = tools.updateGroup(req.rd.scope, req.params.gid, { name: req.body.name, description: req.body.description, enabled: req.body.enabled === undefined ? undefined : req.body.enabled === "1" }, req.session.user.id);
    if (r.ok) flashOk(req, "Groupe enregistré."); else flashError(req, r.errors.join(" "));
    res.redirect(go(req, "groupes"));
  });
  both("post", "/groupes/:gid(\\d+)/supprimer", guard("redirects.delete"), (req, res) => {
    if (tools.removeGroup(req.rd.scope, req.params.gid, req.session.user.id)) flashOk(req, "Groupe supprimé : ses règles sont conservées, sans groupe."); else flashError(req, "Groupe introuvable.");
    res.redirect(go(req, "groupes"));
  });
  // Actions groupées sur les règles (depuis la liste) : activer, désactiver, supprimer, déplacer dans un groupe
  both("post", "/actions", guard("redirects.edit"), (req, res) => {
    const ids = list(req.body.ids);
    const action = String(req.body.action || "");
    const back = /^\/marketing\/site-web\/(?:sites\/\d+\/)?redirections(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : go(req, "");
    if (!ids.length) { flashError(req, "Cochez au moins une redirection."); return res.redirect(back); }
    if (action === "move") {
      const r = tools.moveToGroup(req.rd.scope, ids, req.body.group || null, req.session.user.id);
      if (r.ok) flashOk(req, `${r.moved} redirection(s) déplacée(s).`); else flashError(req, r.errors.join(" "));
    } else if (["enable", "disable", "delete"].includes(action)) {
      if (action === "delete" && !req.mk.can("redirects.delete")) return deny(res);
      const r = tools.bulk(req.rd.scope, action, ids, req.session.user.id, { canDelete: req.mk.can("redirects.delete") });
      if (r.errors.length) flashError(req, `${r.done} traitée(s), ${r.skipped} ignorée(s) : ${r.errors.slice(0, 3).join(" ")}`); else flashOk(req, `${r.done} redirection(s) traitée(s)${r.skipped ? `, ${r.skipped} ignorée(s)` : ""}.`);
    } else flashError(req, "Action inconnue.");
    res.redirect(back);
  });

  // ----- Liens cassés : erreurs 404 réelles + suggestions + actions -----
  const NF_STATES = { open: "À traiter", handled: "Traitées", ignored: "Ignorées", all: "Toutes" };
  both("get", "/erreurs-404", need("redirects.view"), (req, res) => {
    const site = siteOfScope(req);
    const state = NF_STATES[req.query.etat] ? req.query.etat : "open";
    const q = String(req.query.q || "").slice(0, 120);
    const filter = ["human", "bot"].includes(req.query.filtre) ? req.query.filtre : "all";
    let rows = notfound.list({ filter: state === "ignored" ? "ignored" : filter === "all" ? "all" : filter, q, limit: 400, site });
    if (state === "ignored") rows = notfound.list({ filter: "ignored", q, limit: 400, site });
    const handledOf = (r) => Boolean(r.handled_at);
    if (state === "open") rows = rows.filter((r) => !handledOf(r)); else if (state === "handled") rows = rows.filter(handledOf);
    const sort = ["visites", "recent", "adresse"].includes(req.query.tri) ? req.query.tri : "visites";
    if (sort === "recent") rows.sort((a, b) => String(b.last_seen).localeCompare(String(a.last_seen))); else if (sort === "adresse") rows.sort((a, b) => a.path.localeCompare(b.path));
    const shown = rows.slice(0, 100);
    const suggestions = {};
    for (const r of shown.slice(0, 25)) { try { const s = tools.suggestFor(req.rd.scope, r.path, 2); if (s.length) suggestions[r.path] = s; } catch { /* suggestions indisponibles */ } }
    // Regroupement des adresses similaires : même dossier de premier niveau
    const groupsOf = {};
    for (const r of rows) { const k = `/${r.path.split("/").filter(Boolean)[0] || ""}`; groupsOf[k] = (groupsOf[k] || 0) + 1; }
    const clusters = Object.entries(groupsOf).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 5);
    render(req, res, "erreurs-404", { rows: shown, totalRows: rows.length, state, states: NF_STATES, q, filter, sort, suggestions, clusters, stats: notfound.stats({ site }), daily: tools.notFoundDaily(req.rd.scope, 30),
      canHandle: Number.isInteger(site), referrers: Object.fromEntries(shown.map((r) => [r.path, r.last_referrer])) });
  });
  both("post", "/erreurs-404/rediriger", guard("redirects.create"), (req, res) => {
    const site = siteOfScope(req);
    const target = String(req.body.target || "").trim();
    if (!ext(req, target)) { flashError(req, "Rediriger vers un site extérieur demande la permission « redirects.external »."); return res.redirect(go(req, "erreurs-404")); }
    const input = { source: req.body.path, target, status: [301, 302, 303, 307, 308].includes(Number(req.body.status)) ? Number(req.body.status) : 301, note: "Créée depuis les liens cassés", origin: req.body.from === "suggestion" ? "suggestion" : "404" };
    const r = Number.isInteger(site) ? redirects.createForSite(site, input, req.session.user.id) : redirects.create({ ...input, siteId: null }, req.session.user.id, { source: "404" });
    if (!r.ok) flashError(req, r.errors.join(" "));
    else { try { notfound.remove(String(req.body.path || "").slice(0, 300), { site }); } catch { /* ligne déjà absente */ } flashOk(req, "Redirection créée : l'adresse sort de la liste des liens cassés."); }
    res.redirect(go(req, "erreurs-404"));
  });
  both("post", "/erreurs-404/actions", guard("redirects.edit"), (req, res) => {
    const site = siteOfScope(req);
    const paths = list(req.body.path).map((p) => p.slice(0, 300)).slice(0, 300);
    const action = String(req.body.action || "");
    if (!paths.length) { flashError(req, "Cochez au moins une adresse."); return res.redirect(go(req, "erreurs-404")); }
    let n = 0;
    for (const p of paths) {
      let ok = false;
      if (action === "ignorer") ok = notfound.setIgnored(p, true, { site });
      else if (action === "rouvrir") ok = Boolean(notfound.setIgnored(p, false, { site })) | (Number.isInteger(site) && notfound.setHandled(p, false, { site }));
      else if (action === "traitee") ok = Number.isInteger(site) && notfound.setHandled(p, true, { site, userId: req.session.user.id });
      else if (action === "supprimer") ok = req.mk.can("redirects.delete") && notfound.remove(p, { site });
      if (ok) n++;
    }
    flashOk(req, `${n} adresse(s) mise(s) à jour.`);
    res.redirect(go(req, "erreurs-404"));
  });
  // ----- Journaux et statistiques -----
  both("get", "/journaux", need("redirects.view"), (req, res) => {
    const days = [7, 30, 90].includes(Number(req.query.jours)) ? Number(req.query.jours) : 30;
    const d = tools.dashboard(req.rd.scope, { days });
    const w = tools.where(req.rd.scope, "r");
    const db = require("../../seo/store").db;
    const inactive = db.prepare(`SELECT r.id, r.source_path, r.target, r.status, r.created_at, r.last_hit_at FROM seo_redirects r WHERE ${w.sql} AND r.enabled = 1 AND r.hits = 0 ORDER BY r.id LIMIT 20`).all(...w.args);
    const targets = db.prepare(`SELECT r.target, SUM(r.hits) hits, COUNT(*) rules FROM seo_redirects r WHERE ${w.sql} AND r.hits > 0 AND r.status NOT IN (410, 451) GROUP BY r.target ORDER BY hits DESC LIMIT 8`).all(...w.args);
    const page = Math.max(1, Number(req.query.page) || 1);
    const site = tools.own(req.rd.scope) ? req.rd.scope.siteId : null;
    const hist = db.prepare(`SELECT c.id, c.entity_type, c.field, c.old_value, c.new_value, c.source, c.created_at, u.username FROM seo_changes c LEFT JOIN users u ON u.id = c.user_id WHERE c.entity_type IN ('redirect', 'redirect-group', 'redirect-settings')${site ? " AND c.site_id = ?" : ""} ORDER BY c.id DESC LIMIT 30 OFFSET ?`).all(...(site ? [site] : []), (page - 1) * 30);
    render(req, res, "journaux", { d, days, inactive, targets, hist, page, nfDaily: tools.notFoundDaily(req.rd.scope, days > 30 ? 30 : days) });
  });
  both("get", "/journaux/export.csv", need("redirects.view"), (req, res) => {
    const db = require("../../seo/store").db;
    const site = tools.own(req.rd.scope) ? req.rd.scope.siteId : null;
    const rows = db.prepare(`SELECT c.created_at, c.entity_type, c.field, c.old_value, c.new_value, c.source, u.username FROM seo_changes c LEFT JOIN users u ON u.id = c.user_id WHERE c.entity_type IN ('redirect', 'redirect-group', 'redirect-settings')${site ? " AND c.site_id = ?" : ""} ORDER BY c.id DESC LIMIT 5000`).all(...(site ? [site] : []));
    const body = `﻿${["date,type,champ,avant,apres,origine,utilisateur", ...rows.map((r) => [r.created_at, r.entity_type, r.field, r.old_value, r.new_value, r.source, r.username || ""].map(redirects.csvCell).join(","))].join("\n")}\n`;
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="journal-redirections.csv"', "Cache-Control": "no-store" }).send(body);
  });

  // ----- Permaliens et adresses : changements d'adresse, migration -----
  both("get", "/adresses", need("redirects.view"), (req, res) => {
    const settings = tools.getSettings(req.rd.scope);
    const proposals = tools.proposals(req.rd.scope).slice(0, 100);
    let migration = null;
    if (req.query.anciennes) migration = coverage(req, String(req.query.anciennes).slice(0, 20000));
    render(req, res, "adresses", { settings, modes: tools.AUTO_MODES, proposals, migration, anciennes: String(req.query.anciennes || "") });
  });
  both("post", "/adresses/accepter", guard("redirects.create"), (req, res) => {
    const ids = list(req.body.id);
    let n = 0; const errs = [];
    for (const id of ids.slice(0, 200)) { const r = tools.acceptProposal(req.rd.scope, id, req.session.user.id); if (r.ok) n++; else errs.push(r.errors.join(" ")); }
    if (errs.length && !n) flashError(req, errs[0]); else flashOk(req, `${n} redirection(s) créée(s) à partir des changements d'adresse${errs.length ? ` (${errs.length} refusée(s))` : ""}.`);
    res.redirect(go(req, "adresses"));
  });
  both("post", "/adresses/prefixe", guard("redirects.create"), (req, res) => {
    const from = String(req.body.from || "").trim(), to = String(req.body.to || "").trim();
    if (!ext(req, to)) { flashError(req, "Rediriger vers un site extérieur demande la permission « redirects.external »."); return res.redirect(go(req, "adresses")); }
    const input = { source: from, target: to, status: [301, 302, 307, 308].includes(Number(req.body.status)) ? Number(req.body.status) : 301, matchType: "prefix", note: "Remplacement de préfixe (migration)", origin: "migration" };
    const site = siteOfScope(req);
    const r = Number.isInteger(site) ? redirects.createForSite(site, input, req.session.user.id) : redirects.create({ ...input, siteId: null }, req.session.user.id, { source: "migration" });
    if (r.ok) flashOk(req, `Règle créée : tout ce qui commence par ${from} mène désormais vers ${to}.`); else flashError(req, r.errors.join(" "));
    res.redirect(go(req, "adresses"));
  });
  // Rapport de couverture : chaque ancienne adresse est suivie à travers les vraies règles actives
  function coverage(req, text) {
    const rows = tools.simulateBatch(req.rd.scope, text, 300).filter((x) => x.ok !== false);
    const covered = rows.filter((x) => x.steps && x.steps.length), loops = rows.filter((x) => x.verdict === "loop"), chained = rows.filter((x) => x.steps && x.steps.length > 1);
    const uncovered = rows.filter((x) => !x.steps || !x.steps.length);
    return { total: rows.length, covered: covered.length, uncovered, loops: loops.length, chained: chained.length, rows };
  }

  // ----- Importer / Exporter -----
  both("get", "/import-export", need("redirects.view"), (req, res) => {
    render(req, res, "import-export", { formats: tools.FORMATS, groups: tools.listGroups(req.rd.scope), snapshot: tools.lastSnapshot(req.rd.scope), preview: null, restorePreview: null });
  });
  const importText = (req) => String(req.body.text || "").slice(0, 2_000_000);
  both("post", "/import-export/apercu", guard("redirects.create"), (req, res) => {
    const text = importText(req);
    const parsed = tools.parseImport(text, String(req.body.format || ""));
    if (!parsed.ok) { flashError(req, parsed.errors.join(" ")); return res.redirect(go(req, "import-export")); }
    const preview = tools.previewImport(req.rd.scope, parsed, { allowExternal: req.mk.can("redirects.external") });
    render(req, res, "import-export", { formats: tools.FORMATS, groups: tools.listGroups(req.rd.scope), snapshot: tools.lastSnapshot(req.rd.scope), preview: { ...preview, text, source: parsed.format }, restorePreview: null });
  });
  both("post", "/import-export/appliquer", guard("redirects.create"), (req, res) => {
    if (req.body.confirm !== "1") { flashError(req, "Cochez la confirmation pour lancer l'import."); return res.redirect(go(req, "import-export")); }
    const parsed = tools.parseImport(importText(req), String(req.body.format || ""));
    if (!parsed.ok) { flashError(req, parsed.errors.join(" ")); return res.redirect(go(req, "import-export")); }
    const sel = list(req.body.sel).map(Number).filter(Number.isInteger);
    if (!sel.length) { flashError(req, "Sélectionnez au moins une règle à importer."); return res.redirect(go(req, "import-export")); }
    const report = tools.applyImport(req.rd.scope, parsed, sel, req.session.user.id, { allowExternal: req.mk.can("redirects.external") });
    if (report.errors.length) flashError(req, `${report.created} règle(s) importée(s) ; ${report.skipped} ignorée(s) : ${report.errors.slice(0, 3).join(" ")}`); else flashOk(req, `${report.created} règle(s) importée(s). Une copie de sécurité d'avant l'import est conservée (Importer / Exporter → Annuler).`);
    res.redirect(go(req, "import-export"));
  });
  both("get", "/import-export/export", need("redirects.view"), (req, res) => {
    const kind = String(req.query.contenu || "regles");
    const out = kind === "404" ? tools.export404(req.rd.scope)
      : tools.exportRules(req.rd.scope, { format: ["csv", "json", "apache", "nginx"].includes(req.query.format) ? req.query.format : "csv", groupId: req.query.groupe || "", state: req.query.etat || "", ids: req.query.ids ? String(req.query.ids).split(",") : null });
    res.set({ "Content-Type": out.mime, "Content-Disposition": `attachment; filename="${out.filename}"`, "Cache-Control": "no-store" }).send(out.body);
  });
  both("get", "/import-export/sauvegarde.json", need("redirects.view"), (req, res) => {
    const out = tools.backupDownload(req.rd.scope);
    res.set({ "Content-Type": out.mime, "Content-Disposition": `attachment; filename="${out.filename}"`, "Cache-Control": "no-store" }).send(out.body);
  });
  both("post", "/import-export/restaurer", guard("redirects.edit"), (req, res) => {
    const mode = req.body.mode === "replace" ? "replace" : "merge";
    if (mode === "replace" && !req.mk.can("redirects.delete")) return deny(res);
    if (req.body.confirm !== "1") { flashError(req, "Cochez la confirmation pour restaurer."); return res.redirect(go(req, "import-export")); }
    const r = tools.restore(req.rd.scope, String(req.body.text || "").slice(0, 2_000_000), mode, req.session.user.id, { allowExternal: req.mk.can("redirects.external") });
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, `Sauvegarde appliquée : ${r.created} règle(s) créée(s)${r.removed ? `, ${r.removed} ancienne(s) remplacée(s)` : ""}. Une copie d'avant est conservée.`);
    res.redirect(go(req, "import-export"));
  });
  both("post", "/import-export/annuler", guard("redirects.delete"), (req, res) => {
    const r = tools.undoLast(req.rd.scope, req.session.user.id, { allowExternal: req.mk.can("redirects.external") });
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, `Dernière copie de sécurité restaurée (${r.created} règle(s)).`);
    res.redirect(go(req, "import-export"));
  });

  // ----- Outils avancés -----
  both("get", "/outils", need("redirects.view"), (req, res) => {
    const address = String(req.query.adresse || "").trim().slice(0, 400);
    const sim = address ? tools.simulate(req.rd.scope, address) : null;
    const diag = tools.analyze(req.rd.scope);
    const batchText = String(req.query.lot || "").slice(0, 20000);
    const batch = batchText ? tools.simulateBatch(req.rd.scope, batchText, 100) : null;
    render(req, res, "outils", { address, sim, diag, batch, batchText, regex: null, regexForm: { pattern: "", replacement: "", samples: "" } });
  });
  both("post", "/outils/regex", need("redirects.view"), (req, res) => {
    const f = { pattern: String(req.body.pattern || "").slice(0, 200), replacement: String(req.body.replacement || "").slice(0, 300), samples: String(req.body.samples || "").slice(0, 5000) };
    render(req, res, "outils", { address: "", sim: null, diag: tools.analyze(req.rd.scope), batch: null, batchText: "", regex: tools.testRegex(f.pattern, f.replacement, f.samples), regexForm: f });
  });
  both("post", "/outils/raccourcir", guard("redirects.edit"), (req, res) => {
    const id = Number(req.body.id);
    const rule = redirects.get(id);
    const r = rule && tools.inScope(req.rd.scope, rule.site_id) ? redirects.fixChain(id, req.session.user.id) : { ok: false, errors: ["Redirection introuvable."] };
    if (r.ok) flashOk(req, "Chaîne raccourcie : la redirection mène directement à la destination finale."); else flashError(req, r.errors.join(" "));
    res.redirect(go(req, "outils"));
  });
  both("post", "/outils/desactiver-inutilisees", guard("redirects.edit"), (req, res) => {
    const ids = tools.analyze(req.rd.scope).items.filter((i) => i.kind === "dead" && i.id).map((i) => i.id);
    const r = tools.bulk(req.rd.scope, "disable", ids, req.session.user.id);
    flashOk(req, `${r.done} règle(s) inutilisée(s) désactivée(s) (rien n'est supprimé : vous pouvez les réactiver).`);
    res.redirect(go(req, "outils"));
  });

  // ----- Paramètres -----
  both("get", "/parametres", need("redirects.view"), (req, res) => {
    render(req, res, "parametres", { settings: tools.getSettings(req.rd.scope), modes: tools.AUTO_MODES });
  });
  both("post", "/parametres", guard("redirects.edit"), (req, res) => {
    const r = tools.saveSettings(req.rd.scope, { autoMode: req.body.autoMode, retentionDays: req.body.retentionDays, deadDays: req.body.deadDays, allowedHosts: req.body.allowedHosts }, req.session.user.id);
    if (r.ok) flashOk(req, "Paramètres enregistrés."); else flashError(req, r.errors.join(" "));
    res.redirect(go(req, "parametres"));
  });
  both("post", "/parametres/purger-404", guard("redirects.delete"), (req, res) => {
    const site = siteOfScope(req);
    if (!Number.isInteger(site)) { flashError(req, "Le nettoyage automatique du journal concerne les sites ; le journal du site principal est borné à 5 000 adresses."); return res.redirect(go(req, "parametres")); }
    const n = notfound.purge({ site, days: tools.getSettings(req.rd.scope).retentionDays });
    flashOk(req, `${n} adresse(s) ancienne(s), traitée(s) ou ignorée(s), supprimée(s) du journal.`);
    res.redirect(go(req, "parametres"));
  });

  return router;
};
