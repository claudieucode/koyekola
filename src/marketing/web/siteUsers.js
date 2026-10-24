// KOLAKISA CMS → Utilisateurs d'UN site (administration locale) : personnes qui ont un rôle propre à ce site, invitations de ce site, rôles et permissions (en lecture : les rôles sont communs
// à l'organisation). Tout passe par services/cmsAccess (une seule logique de droits). Le site vient de l'adresse vérifiée par le serveur (siteTarget), JAMAIS d'un identifiant du navigateur :
//   • une personne n'est visible, modifiable ou retirable que si elle a un rôle sur CE site (sinon « introuvable » — on ne révèle pas l'existence d'un compte hors du site) ;
//   • on n'invite, renvoie, révoque que pour CE site ; jamais « toute l'équipe » ; jamais un rôle que l'on ne possède pas soi-même ;
//   • le statut du COMPTE (suspendre, désactiver) et l'équipe de l'organisation restent à l'administration centrale ;
//   • les droits sont ceux de la personne SUR CE SITE (rôle d'équipe + rôle de site), calculés par le serveur.
const express = require("express");
const access = require("../../services/cmsAccess");
const invites = require("./inviteFlow");
const accountNew = require("./accountNew");
const target = require("./siteTarget");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");

const BASE = "/marketing/site-web/equipe-site";
const intOrNull = (v) => (/^\d{1,9}$/.test(String(v ?? "")) ? Number(v) : null);
const FRAME = { list: "equipe", create: "equipe-ajouter", invite: "equipe-inviter", invitations: "equipe-invitations", roles: "equipe-roles", permissions: "equipe-permissions" };
const frameUrl = (siteId, screen, qs = "") => `/marketing/site-web/sites/${siteId}/${FRAME[screen]}${qs}`;

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };

  // Contexte commun : site vérifié, droits sur CE site, acteur. Renvoie null (réponse déjà envoyée) si l'accès est refusé.
  const open = (req, res, perm) => {
    const t = target(req, res); if (!t) return null;
    if (!t.siteId) { res.redirect("/marketing/site-web/utilisateurs"); return null; } // le site principal a l'administration centrale
    const org = req.mk.ctx.organizationId;
    const perms = access.effectivePermissions(req.session.user.id, { organizationId: org, siteId: t.siteId });
    if (perm && !perms.has(perm)) { res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." }); return null; }
    return { t, org, perms, siteId: t.siteId, actor: { id: req.session.user.id, perms } };
  };
  const writable = (req, res, c) => {
    if (c.t.readOnly) { flash(req, "error", "Ce site est archivé : on n'y modifie plus l'équipe."); return false; }
    return true;
  };
  const roleName = (key) => (access.getRole(key) ? access.getRole(key).name : key);
  const grantable = (c) => access.allRoles().filter((r) => r.key !== "owner").map((r) => ({ ...r, ok: access.subset(r.permissions, c.perms) }));
  const guard = (req, res, next, back, action) => {
    try { const m = action(); if (m) flash(req, typeof m === "string" ? "ok" : m.type || "ok", typeof m === "string" ? m : m.text, typeof m === "string" ? undefined : m.detail); res.redirect(typeof back === "function" ? back() : back); }
    catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      flash(req, "error", error.message); res.redirect(typeof back === "function" ? back() : back);
    }
  };
  const render = (req, res, c, view, extra = {}) => {
    res.set("Cache-Control", "no-store");
    res.render("marketing/site-users", { title: extra.title || "Comptes", active: extra.active || "utilisateurs", siteUsersJs: true, usersJs: true, mode: view, T: c.t, SITE: { id: c.siteId, name: c.t.name, readOnly: c.t.readOnly }, FRAME, frameUrl: (s, qs) => frameUrl(c.siteId, s, qs), BASE, roleName,
      can: (p) => c.perms.has(p), teamUser: !req.mk.siteOnly, ...extra });
  };
  // Les formulaires de ce module postent vers BASE (adresse centrale) avec le site en champ caché : le serveur le revérifie (siteTarget) avant tout.
  const back = (c, screen, qs) => () => frameUrl(c.siteId, screen, qs || "");

  // ----- Tous les utilisateurs (du site) : liste, recherche, filtres ; fiche via ?membre=<id> -----
  router.get("/site-web/equipe-site", (req, res) => {
    const c = open(req, res, "users.view"); if (!c) return;
    const memberId = intOrNull(req.query.membre);
    if (req.query.membre !== undefined) {
      const m = memberId ? access.siteMemberDetail(c.org, c.siteId, memberId) : null;
      if (!m) return res.status(404).render("error", { message: "Cette personne n'a pas de rôle sur ce site." });
      return render(req, res, c, "detail", { title: m.username, member: m, roles: grantable(c), perms: c.perms, groups: access.GROUPS, canEdit: c.perms.has("users.manage_roles") && !c.t.readOnly && m.id !== req.session.user.id, canRemove: c.perms.has("users.delete") && !c.t.readOnly && m.id !== req.session.user.id, me: req.session.user.id });
    }
    const f = { q: String(req.query.q || "").trim().slice(0, 80), role: String(req.query.role || ""), statut: ["active", "suspended", "disabled"].includes(req.query.statut) ? req.query.statut : "", tri: ["nom", "recent", "activite"].includes(req.query.tri) ? req.query.tri : "nom" };
    const result = access.listSiteMembers(c.org, c.siteId, { ...f, status: f.statut, sort: f.tri, page: req.query.page });
    render(req, res, c, "list", { f, result, rows: result.rows, counts: access.siteStatusCounts(c.siteId), roles: access.allRoles(), canInvite: c.perms.has("users.create") && !c.t.readOnly });
  });
  router.post("/site-web/equipe-site/:id(\\d+)/role", (req, res, next) => {
    const c = open(req, res, "users.manage_roles"); if (!c) return;
    guard(req, res, next, back(c, "list", `?membre=${req.params.id}`), () => {
      if (!writable(req, res, c)) return null;
      const id = Number(req.params.id);
      if (!access.siteMemberDetail(c.org, c.siteId, id)) throw new UserError("Cette personne n'a pas de rôle sur ce site.");
      const before = access.siteRoleOf(id, c.siteId);
      access.setSiteRole(c.org, c.actor, id, c.siteId, String(req.body.role || ""), { mode: before ? before.mode : undefined });
      return `Rôle enregistré : « ${roleName(String(req.body.role))} » sur ${c.t.name}. Les droits de la personne changent tout de suite.`;
    });
  });
  router.post("/site-web/equipe-site/:id(\\d+)/retirer", (req, res, next) => {
    const c = open(req, res, "users.delete"); if (!c) return;
    guard(req, res, next, back(c, "list"), () => {
      if (!writable(req, res, c)) return null;
      const id = Number(req.params.id);
      if (!access.siteMemberDetail(c.org, c.siteId, id)) throw new UserError("Cette personne n'a pas de rôle sur ce site.");
      access.removeSiteRole(c.org, c.actor, id, c.siteId);
      return "Accès retiré à ce site. Le compte lui-même, ses autres sites et son appartenance à l'équipe de l'organisation ne changent pas.";
    });
  });

  // ----- Ajouter un compte (pour CE site) : le site vient de l'adresse vérifiée, un administrateur local ne crée que pour le sien -----
  const accountCtx = (c) => ({ mode: "site", org: c.org, actor: { id: c.actor.id, name: undefined, perms: c.perms }, scopeSiteId: c.siteId, siteName: c.t.name, roles: grantable(c), sites: [],
    action: `${BASE}/nouveau?site=${c.siteId}`, listUrl: frameUrl(c.siteId, "list"), canCreate: !c.t.readOnly, detailUrl: (id, role) => (role ? frameUrl(c.siteId, "list", `?membre=${id}`) : frameUrl(c.siteId, "create", `?cree=${id}`)), BASE });
  router.get("/site-web/equipe-site/nouveau", (req, res) => {
    const c = open(req, res, "users.create"); if (!c) return;
    accountNew.show(req, res, accountCtx(c), { created: accountNew.createdOf(req) });
  });
  router.post("/site-web/equipe-site/nouveau", (req, res, next) => {
    const c = open(req, res, "users.create"); if (!c) return;
    const ctx = accountCtx(c); ctx.actor.name = req.session.user.username;
    accountNew.submit(req, res, next, ctx);
  });

  // ----- Inviter (pour CE site) -----
  router.get("/site-web/equipe-site/inviter", (req, res) => {
    const c = open(req, res, "users.create"); if (!c) return;
    render(req, res, c, "invite", { title: "Inviter", active: "utilisateurs/ajouter", roles: grantable(c), days: access.INVITE_DAYS, canInvite: !c.t.readOnly });
  });
  router.post("/site-web/equipe-site/inviter", (req, res, next) => {
    const c = open(req, res, "users.create"); if (!c) return;
    guard(req, res, next, back(c, "invitations"), () => {
      if (!writable(req, res, c)) return null;
      // Le site vient du serveur : le champ « site » du formulaire ne sert qu'à choisir l'espace et est revérifié ; scopeSiteId interdit tout autre site
      const r = access.invite(c.org, c.actor, { email: req.body.email, role: String(req.body.role || ""), siteId: c.siteId, scopeSiteId: c.siteId, name: req.body.name, message: req.body.message, days: Number(req.body.days) || access.INVITE_DAYS });
      if (r.added) return `${r.user.username} a déjà un compte : accès accordé tout de suite à ${c.t.name} (rôle « ${roleName(req.body.role)} »).`;
      const d = invites.deliver(req.mk.ctx.db, { invitation: r, inviterName: req.session.user.username, roleName: roleName(req.body.role), siteName: c.t.name });
      return invites.summary(r.email, d, r.days);
    });
  });

  // ----- Invitations de CE site -----
  router.get("/site-web/equipe-site/invitations", (req, res) => {
    const c = open(req, res, "users.view"); if (!c) return;
    const f = { q: String(req.query.q || "").trim().slice(0, 80), statut: ["pending", "accepted", "expired", "revoked"].includes(req.query.etat) ? req.query.etat : "", role: String(req.query.role || ""), site: null };
    const result = access.listInvitations(c.org, { scopeSiteId: c.siteId, q: f.q, state: f.statut, role: f.role, page: req.query.page });
    render(req, res, c, "invitations", { title: "Invitations", active: "utilisateurs/invitations", f, result, roles: access.allRoles(), canInvite: c.perms.has("users.create") && !c.t.readOnly });
  });
  router.post("/site-web/equipe-site/invitations/:id(\\d+)/renvoyer", (req, res, next) => {
    const c = open(req, res, "users.create"); if (!c) return;
    guard(req, res, next, back(c, "invitations"), () => {
      if (!writable(req, res, c)) return null;
      const r = access.reissue(c.org, c.actor, Number(req.params.id), { scopeSiteId: c.siteId });
      const inv = req.mk.ctx.db.prepare("SELECT role FROM mk_invitations WHERE id = ?").get(r.id);
      const d = invites.deliver(req.mk.ctx.db, { invitation: { ...r, days: access.INVITE_DAYS }, inviterName: req.session.user.username, roleName: roleName(inv.role), siteName: c.t.name });
      return invites.summary(r.email, d, access.INVITE_DAYS, { resent: true });
    });
  });
  router.post("/site-web/equipe-site/invitations/:id(\\d+)/revoquer", (req, res, next) => {
    const c = open(req, res, "users.create"); if (!c) return;
    guard(req, res, next, back(c, "invitations"), () => {
      if (!writable(req, res, c)) return null;
      access.revoke(c.org, c.actor, Number(req.params.id), { scopeSiteId: c.siteId });
      return "Invitation révoquée : son lien ne fonctionne plus.";
    });
  });

  // ----- Rôles et permissions (lecture : communs à l'organisation) -----
  router.get("/site-web/equipe-site/roles", (req, res) => {
    const c = open(req, res, "users.view"); if (!c) return;
    const counts = access.siteRoleCounts(c.siteId);
    render(req, res, c, "roles", { title: "Rôles", active: "utilisateurs/roles", roles: access.allRoles().map((r) => ({ ...r, here: counts[r.key] || 0, count: r.permissions.size, ok: access.subset(r.permissions, c.perms) })) });
  });
  router.get("/site-web/equipe-site/permissions", (req, res) => {
    const c = open(req, res, "users.view"); if (!c) return;
    const key = access.getRole(String(req.query.role || "")) ? String(req.query.role) : "editor";
    render(req, res, c, "permissions", { title: "Permissions", active: "utilisateurs/permissions", roles: access.allRoles(), roleKey: key, role: access.getRole(key), groups: access.GROUPS, mine: c.perms });
  });
  return router;
};
module.exports.BASE = BASE;
