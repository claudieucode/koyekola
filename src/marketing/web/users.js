// KOLAKISA CMS → Utilisateurs (palier 9) : équipe, fiche, statut, rôles (système et personnalisés), accès par site, invitations, matrice des
// permissions. TOUT passe par services/cmsAccess.js (une seule logique de droits) et par le compte du site (users) : aucun second système.
// Droits : users.view (voir) · users.create (inviter) · users.edit (statut) · users.manage_roles (attribuer un rôle / un accès de site) ·
// users.delete (retirer de l'équipe) · roles.manage (créer / modifier les rôles). Garde-fous dans cmsAccess : jamais plus de droits que soi,
// jamais soi-même, jamais le dernier Super administrateur.
const express = require("express");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const access = require("../../services/cmsAccess");
const invites = require("./inviteFlow");
const accountNew = require("./accountNew");
const { listAudit } = require("../audit");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/utilisateurs";
const TABS = [["", "Tous", "all"], ["actifs", "Actifs", "active"], ["en-attente", "En attente", "pending"], ["suspendus", "Suspendus", "suspended"], ["desactives", "Désactivés", "disabled"]];
const STATUS = { "": "", actifs: "active", suspendus: "suspended", desactives: "disabled" };
const intOrNull = (v) => (/^\d{1,9}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = () => {
  const router = express.Router();
  const db = require("../../config/database");
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const actor = (req) => ({ id: req.session.user.id, perms: req.mk.perms });
  const org = (req) => req.mk.ctx.organizationId;
  const guard = (req, res, next, back, action) => {
    try { const m = action(); if (m) flash(req, typeof m === "string" ? "ok" : m.type || "ok", typeof m === "string" ? m : m.text, typeof m === "string" ? undefined : m.detail); res.redirect(typeof back === "function" ? back() : back); }
    catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      flash(req, "error", error.message); res.redirect(typeof back === "function" ? back() : back);
    }
  };
  const sites = (req) => db.prepare(`SELECT id, name FROM mk_sites WHERE organization_id = ?${primarySite.excludeSql(db)} AND status = 'active' ORDER BY name COLLATE NOCASE`).all(org(req));
  // Rôles que l'acteur peut réellement attribuer (jamais plus de droits que lui)
  const grantable = (req) => access.allRoles().map((r) => ({ ...r, ok: access.subset(r.permissions, req.mk.perms) }));
  const roleName = (key) => (access.getRole(key) ? access.getRole(key).name : key);

  // Données d'affichage de la liste (réelles) : nom affiché et photo du profil, nombre d'articles dont la personne est l'auteur
  const enrich = (rows) => {
    if (!rows.length) return rows;
    const ids = rows.map((r) => r.id), marks = ids.map(() => "?").join(",");
    const prof = new Map(db.prepare(`SELECT u.id, u.avatar_path, p.display_name, p.nickname, p.first_name, p.last_name FROM users u LEFT JOIN mk_user_profiles p ON p.user_id = u.id WHERE u.id IN (${marks})`).all(...ids).map((r) => [r.id, r]));
    const posts = new Map(db.prepare(`SELECT author_id, COUNT(*) n FROM posts WHERE author_id IN (${marks}) GROUP BY author_id`).all(...ids).map((r) => [r.author_id, r.n]));
    return rows.map((r) => { const p = prof.get(r.id) || {}; return { ...r, avatar_path: p.avatar_path || null, display: p.display_name || p.nickname || "", fullName: [p.first_name, p.last_name].filter(Boolean).join(" "), articles: posts.get(r.id) || 0 }; });
  };

  router.use("/site-web/utilisateurs", (req, res, next) => { res.locals.usersJs = true; next(); }); // script des écrans (envoi unique, modifications non enregistrées)
  // ----- Liste -----
  router.get("/site-web/utilisateurs", need("users.view"), (req, res) => {
    const sub = String(req.query.statut || "");
    const f = { q: String(req.query.q || "").trim().slice(0, 80), role: String(req.query.role || ""), site: intOrNull(req.query.site), tri: ["nom", "email", "role", "recent", "activite"].includes(req.query.tri) ? req.query.tri : "nom", statut: Object.hasOwn(STATUS, sub) || sub === "en-attente" ? sub : "" };
    const counts = access.statusCounts(org(req)), roleCounts = access.roleCounts(org(req));
    const result = f.statut === "en-attente" ? null : access.listMembers(org(req), { q: f.q, status: STATUS[f.statut], role: f.role, siteId: f.site, sort: f.tri, page: req.query.page });
    const rowsPlus = result ? enrich(result.rows) : [];
    res.render("marketing/users", {
      title: "Comptes", active: "utilisateurs", mode: "list", f, tabs: TABS, counts, roleCounts, result, rows: rowsPlus, invitations: f.statut === "en-attente" ? access.listInvitations(org(req), { state: "pending", perPage: 200 }).rows : [],
      roles: grantable(req), sites: sites(req), roleName, BASE, me: req.session.user.id, canCreate: req.mk.can("users.create"), canEdit: req.mk.can("users.edit"), canRoles: req.mk.can("users.manage_roles"), canDelete: req.mk.can("users.delete"), usersJs: true,
    });
  });

  // ----- Ajouter un compte (création directe, avec ou sans e-mail d'activation) -----
  const accountCtx = (req) => ({ mode: "central", org: org(req), actor: { id: req.session.user.id, name: req.session.user.username, perms: req.mk.perms }, scopeSiteId: null, siteName: "", roles: grantable(req), sites: sites(req),
    action: `${BASE}/nouveau`, listUrl: BASE, canCreate: true, detailUrl: (id, role) => (role ? `${BASE}/${id}` : `${BASE}/nouveau?cree=${id}`), BASE });
  router.get("/site-web/utilisateurs/nouveau", need("users.create"), (req, res) => accountNew.show(req, res, accountCtx(req), { created: accountNew.createdOf(req) }));
  router.post("/site-web/utilisateurs/nouveau", need("users.create"), (req, res, next) => accountNew.submit(req, res, next, accountCtx(req)));

  // ----- Actions groupées : chaque personne passe par la MÊME fonction (et les mêmes garde-fous) que la fiche individuelle ; un refus n'arrête pas les autres -----
  const BULK = { role: ["users.manage_roles", "Changer de rôle"], active: ["users.edit", "Réactiver"], suspended: ["users.edit", "Suspendre"], disabled: ["users.edit", "Désactiver"], retirer: ["users.delete", "Retirer de l'équipe"] };
  router.post("/site-web/utilisateurs/groupe", need("users.view"), (req, res, next) => {
    const back = (() => { try { const u = new URL(req.get("referer") || "", "http://x.invalid"); return u.pathname === BASE ? BASE + u.search : BASE; } catch { return BASE; } })();
    try {
      const action = String(req.body.action || "");
      if (!Object.hasOwn(BULK, action)) { flash(req, "error", "Choisissez une action à appliquer."); return res.redirect(back); }
      if (!req.mk.can(BULK[action][0])) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
      const ids = [...new Set([].concat(req.body.ids || []).map((v) => intOrNull(v)).filter((v) => v !== null))].slice(0, 100);
      if (!ids.length) { flash(req, "error", "Cochez au moins une personne."); return res.redirect(back); }
      if (action === "retirer" && req.body.confirm !== "1") { flash(req, "error", "Confirmez le retrait de l'équipe en cochant la case prévue."); return res.redirect(back); }
      if (action === "role" && !access.getRole(String(req.body.role || ""))) { flash(req, "error", "Choisissez le rôle à attribuer."); return res.redirect(back); }
      let done = 0; const refused = [];
      for (const id of ids) {
        try {
          if (!access.memberDetail(org(req), id)) throw new UserError("Cette personne ne fait pas partie de l'équipe.");
          if (action === "role") access.setOrgRole(org(req), actor(req), id, String(req.body.role));
          else if (action === "retirer") access.removeFromTeam(org(req), actor(req), id);
          else access.setStatus(org(req), actor(req), id, action);
          done++;
        } catch (error) {
          if (!(error instanceof UserError) && !(error instanceof MarketingError)) throw error;
          const u = db.prepare("SELECT username FROM users WHERE id = ?").get(id);
          refused.push(`${u ? u.username : "#" + id} : ${error.message}`);
        }
      }
      const label = BULK[action][1];
      if (done && !refused.length) flash(req, "ok", `${label} : ${done} compte${done > 1 ? "s" : ""}.`);
      else if (done) req.session.mkFlash = { type: "ok", text: `${label} : ${done} compte${done > 1 ? "s" : ""} modifié${done > 1 ? "s" : ""}, ${refused.length} refusé${refused.length > 1 ? "s" : ""}.`, detail: refused.join("\n"), noReopen: true };
      else req.session.mkFlash = { type: "error", text: `Aucun compte modifié : ${refused[0]}`, detail: refused.length > 1 ? refused.join("\n") : undefined, noReopen: true };
      res.redirect(back);
    } catch (error) { next(error); }
  });

  // ----- Inviter / ajouter -----
  router.get("/site-web/utilisateurs/ajouter", need("users.create"), (req, res) => {
    res.render("marketing/users", { title: "Inviter", active: "utilisateurs/ajouter", mode: "invite", roles: grantable(req), sites: sites(req), BASE, days: access.INVITE_DAYS, f: {}, tabs: [], counts: {}, rows: [], invitations: [], roleName, canCreate: true, canEdit: false, me: 0 });
  });
  router.post("/site-web/utilisateurs/inviter", need("users.create"), (req, res, next) => {
    guard(req, res, next, `${BASE}/invitations`, () => {
      const siteId = intOrNull(req.body.site_id);
      const r = access.invite(org(req), actor(req), { email: req.body.email, role: String(req.body.role || ""), siteId, name: req.body.name, message: req.body.message, days: Number(req.body.days) || access.INVITE_DAYS });
      if (r.added) return `${r.user.username} a déjà un compte : accès accordé tout de suite (rôle « ${roleName(req.body.role)} »).`;
      const site = siteId ? sites(req).find((s) => s.id === siteId) : null;
      const d = invites.deliver(db, { invitation: r, inviterName: req.session.user.username, roleName: roleName(req.body.role), siteName: site ? site.name : "" });
      return invites.summary(r.email, d, r.days);
    });
  });
  router.get("/site-web/utilisateurs/invitations", need("users.view"), (req, res) => {
    const f = { q: String(req.query.q || "").trim().slice(0, 80), statut: ["pending", "accepted", "expired", "revoked"].includes(req.query.etat) ? req.query.etat : "", role: String(req.query.role || ""), site: intOrNull(req.query.site) };
    const result = access.listInvitations(org(req), { q: f.q, state: f.statut, role: f.role, siteId: f.site, page: req.query.page });
    res.render("marketing/users", { title: "Invitations", active: "utilisateurs/invitations", mode: "invitations", result, invitations: result.rows, f, roleName, BASE, canCreate: req.mk.can("users.create"), tabs: [], counts: {}, rows: [], roles: access.allRoles(), sites: sites(req), frame: false });
  });
  router.post("/site-web/utilisateurs/invitations/:id(\\d+)/renvoyer", need("users.create"), (req, res, next) => {
    guard(req, res, next, `${BASE}/invitations`, () => {
      const r = access.reissue(org(req), actor(req), Number(req.params.id));
      const inv = db.prepare("SELECT role, site_id FROM mk_invitations WHERE id = ?").get(r.id);
      const site = inv.site_id ? sites(req).find((s) => s.id === inv.site_id) : null;
      const d = invites.deliver(db, { invitation: { ...r, days: access.INVITE_DAYS }, inviterName: req.session.user.username, roleName: roleName(inv.role), siteName: site ? site.name : "" });
      return invites.summary(r.email, d, access.INVITE_DAYS, { resent: true });
    });
  });
  router.post("/site-web/utilisateurs/invitations/:id(\\d+)/revoquer", need("users.create"), (req, res, next) => {
    guard(req, res, next, `${BASE}/invitations`, () => { access.revoke(org(req), actor(req), Number(req.params.id)); return "Invitation révoquée : son lien ne fonctionne plus."; });
  });

  // ----- Rôles et permissions -----
  router.get("/site-web/utilisateurs/roles", need("users.view"), (req, res) => {
    const roles = access.allRoles().map((r) => {
      const u = access.roleUsage(r.key);
      return { ...r, members: u.org + u.sites, count: r.permissions.size };
    });
    res.render("marketing/roles", { title: "Rôles", active: "utilisateurs/roles", mode: "list", roles, BASE, canManage: req.mk.can("roles.manage"), groups: access.GROUPS, matrix: null });
  });
  router.get("/site-web/utilisateurs/permissions", need("users.view"), (req, res) => {
    const key = access.getRole(String(req.query.role || "")) ? String(req.query.role) : "editor";
    res.render("marketing/roles", { title: "Permissions", active: "utilisateurs/permissions", mode: "matrix", roles: access.allRoles(), roleKey: key, role: access.getRole(key), matrix: access.matrix(key), actions: access.ACTIONS, BASE, groups: access.GROUPS, canManage: false });
  });
  const roleForm = (req, res, role) => {
    const members = role ? db.prepare(`SELECT u.id, u.username, u.email, u.status, 'équipe' AS scope, NULL AS site FROM mk_org_members m JOIN users u ON u.id = m.user_id WHERE m.role = ?
        UNION ALL SELECT u.id, u.username, u.email, u.status, 'site', s.name FROM mk_site_members sm JOIN users u ON u.id = sm.user_id JOIN mk_sites s ON s.id = sm.site_id WHERE sm.role = ? ORDER BY username LIMIT 200`).all(role.key, role.key) : [];
    res.render("marketing/roles", {
      title: role ? role.name : "Nouveau rôle", active: "utilisateurs/roles", mode: "edit", role, BASE, groups: access.GROUPS, ownerOnly: access.OWNER_ONLY, mine: req.mk.perms, members,
      canManage: req.mk.can("roles.manage"), editable: !role || !role.system, usersJs: true, matrix: role ? access.matrix(role.key) : null, actions: access.ACTIONS,
    });
  };
  router.get("/site-web/utilisateurs/roles/nouveau", need("roles.manage"), (req, res) => {
    const from = access.getRole(String(req.query.depuis || ""));
    roleForm(req, res, null);
    void from;
  });
  router.get("/site-web/utilisateurs/roles/:key", need("users.view"), (req, res) => {
    const role = access.getRole(req.params.key);
    if (!role) return res.status(404).render("error", { message: "Rôle introuvable." });
    roleForm(req, res, role);
  });
  const roleBody = (b) => ({ name: b.name, description: b.description, permissions: [].concat(b.perm || []).flatMap((x) => String(x).split(",")) });
  router.post("/site-web/utilisateurs/roles", need("roles.manage"), (req, res, next) => {
    let created = null;
    guard(req, res, next, () => (created ? `${BASE}/roles/${created.key}` : `${BASE}/roles/nouveau`), () => { created = access.createRole(org(req), actor(req), roleBody(req.body)); return `Rôle « ${created.name} » créé.`; });
  });
  router.post("/site-web/utilisateurs/roles/:key", need("roles.manage"), (req, res, next) => {
    guard(req, res, next, `${BASE}/roles/${req.params.key}`, () => { const r = access.updateRole(org(req), actor(req), req.params.key, roleBody(req.body)); return `Rôle « ${r.name} » enregistré : les changements s'appliquent tout de suite.`; });
  });
  router.post("/site-web/utilisateurs/roles/:key/dupliquer", need("roles.manage"), (req, res, next) => {
    let created = null;
    guard(req, res, next, () => (created ? `${BASE}/roles/${created.key}` : `${BASE}/roles`), () => {
      const src = access.getRole(req.params.key);
      if (!src) throw new UserError("Rôle introuvable.");
      created = access.createRole(org(req), actor(req), { name: `${src.name} (copie)`, description: src.description, permissions: [...src.permissions].filter((p) => access.ASSIGNABLE.includes(p)) });
      return `Copie créée : « ${created.name} ». Vous pouvez la modifier.`;
    });
  });
  router.post("/site-web/utilisateurs/roles/:key/supprimer", need("roles.manage"), (req, res, next) => {
    guard(req, res, next, (/* échec : retour au rôle */) => `${BASE}/roles`, () => { const r = access.deleteRole(org(req), actor(req), req.params.key); return `Rôle « ${r.name} » supprimé.`; });
  });

  // ----- Fiche d'un utilisateur et actions -----
  router.get("/site-web/utilisateurs/:id(\\d+)", need("users.view"), (req, res) => {
    const u = access.memberDetail(org(req), Number(req.params.id));
    if (!u) return res.status(404).render("error", { message: "Cette personne ne fait pas partie de l'équipe." });
    const groups = access.GROUPS.map((g) => ({ ...g, have: g.perms.filter((p) => u.permissions.has(p[0])) })).filter((g) => g.have.length);
    res.render("marketing/user-detail", {
      title: u.username, active: "utilisateurs", u, groups, roles: grantable(req), sites: sites(req), roleName, BASE, me: req.session.user.id, canEdit: req.mk.can("users.edit"), canRoles: req.mk.can("users.manage_roles"), canDelete: req.mk.can("users.delete"),
      activity: listAudit(db, org(req), { limit: 15, resourceType: "user", resourceId: u.id, scope: req.mk && req.mk.ctx }), ownerCount: access.activeOwners(org(req)).length,
    });
  });
  const userRoute = (path, perm, run) => router.post(`/site-web/utilisateurs/:id(\\d+)${path}`, need(perm), (req, res, next) => {
    guard(req, res, next, `${BASE}/${req.params.id}`, () => run(Number(req.params.id), req));
  });
  userRoute("/role", "users.manage_roles", (id, req) => { const r = access.setOrgRole(org(req), actor(req), id, String(req.body.role || "")); return `Rôle de ${r.target.username} : « ${r.role.name} ».`; });
  userRoute("/statut", "users.edit", (id, req) => { access.setStatus(org(req), actor(req), id, String(req.body.status || "")); return { active: "Compte réactivé.", suspended: "Compte suspendu : la personne est déconnectée et ne peut plus se connecter.", disabled: "Compte désactivé : la personne est déconnectée et ne peut plus se connecter." }[req.body.status] || "Statut enregistré."; });
  userRoute("/sites", "users.manage_roles", (id, req) => { const s = access.setSiteRole(org(req), actor(req), id, intOrNull(req.body.site_id), String(req.body.role || ""), req.body.mode ? { mode: String(req.body.mode) } : {}); return `Accès au site « ${s.name} » enregistré.`; });
  // Plafond de droits par site (R3) : « limit » = sur ce site, les droits sont ceux que le rôle d'équipe ET le rôle de site accordent à la fois
  userRoute("/sites/:siteId(\\d+)/mode", "users.manage_roles", (id, req) => { const s = access.setSiteMode(org(req), actor(req), id, Number(req.params.siteId), String(req.body.mode || "")); return String(req.body.mode) === "limit" ? `Droits plafonnés sur le site « ${s.name} ».` : `Plafond retiré sur le site « ${s.name} ».`; });
  userRoute("/sites/:siteId(\\d+)/retirer", "users.manage_roles", (id, req) => { access.removeSiteRole(org(req), actor(req), id, Number(req.params.siteId)); return "Accès au site retiré."; });
  router.post("/site-web/utilisateurs/:id(\\d+)/retirer", need("users.delete"), (req, res, next) => {
    let gone = false;
    guard(req, res, next, () => (gone ? BASE : `${BASE}/${req.params.id}`), () => { access.removeFromTeam(org(req), actor(req), Number(req.params.id)); gone = true; return "Retiré de l'équipe. Son compte du site reste, sans accès au CMS."; });
  });

  // ----- Mes sites : accès limités à certains sites -----
  router.get("/site-web/mes-sites", (req, res) => {
    const mine = access.siteMemberships(req.session.user.id);
    res.render("marketing/users", { title: "Mes sites", active: "sites", mode: "mysites", mine, roleName, BASE, f: {}, tabs: [], counts: {}, rows: [], invitations: [], roles: [], sites: [], canCreate: false, canEdit: false, me: 0 });
  });
  return router;
};
