// KOLAKISA CMS → Utilisateurs → Ajouter un compte : écran et enregistrement, PARTAGÉS par l'administration centrale (équipe de l'organisation) et l'espace d'un site.
// Toute la logique (validation, droits, création, notification) est dans services/accounts + services/cmsAccess : ici, seulement l'écran et le cycle requête → réponse.
//   • le site d'un administrateur LOCAL vient de l'adresse vérifiée par le serveur (scopeSiteId), jamais du formulaire ;
//   • une soumission répétée (double clic, rechargement) ne crée jamais deux comptes : jeton de formulaire à usage unique + unicité de l'identifiant et de l'adresse ;
//   • le mot de passe n'est jamais renvoyé dans la page, ni journalisé ; le lien d'activation n'apparaît que dans le message destiné à l'administrateur, quand aucun e-mail ne peut partir.
const crypto = require("node:crypto");
const accounts = require("../../services/accounts");
const { LANGUAGES } = require("../../utils/format");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");

const flash = (req, m) => { req.session.mkFlash = { type: m.type || "ok", text: m.text, ...(m.detail ? { detail: m.detail } : {}), noReopen: true }; };
const newRequestId = (req) => {
  const id = crypto.randomBytes(12).toString("hex");
  const forms = req.session.accountForms || {};
  const keep = Object.entries(forms).sort((a, b) => b[1] - a[1]).slice(0, 19);
  req.session.accountForms = { ...Object.fromEntries(keep), [id]: Date.now() };
  return id;
};

// ctx : { mode: "central" | "site", org, actor: { id, name, perms }, scopeSiteId, siteName, roles, sites, action, listUrl, detailUrl(userId, created), canCreate }
function show(req, res, ctx, extra = {}) {
  res.set("Cache-Control", "no-store").status(extra.status || 200).render("marketing/account-new", {
    title: "Ajouter un compte", active: "utilisateurs/nouveau", accountNewJs: true, ctx,
    values: extra.values || { role: "", site_id: "", language: "", notify: true }, fieldErrors: extra.fieldErrors || {}, errors: extra.errors || [], requestId: newRequestId(req),
    languages: Object.entries(LANGUAGES), smtp: Boolean(process.env.SMTP_HOST), created: extra.created || null,
    pwMin: accounts.PASSWORD_MIN, pwMax: accounts.PASSWORD_MAX,
  });
}

function submit(req, res, next, ctx) {
  const body = req.body || {};
  const rid = /^[0-9a-f]{24}$/.test(String(body.request_id || "")) ? String(body.request_id) : "";
  if (!ctx.canCreate) { flash(req, { type: "error", text: "Ce site est archivé : on n'y ajoute plus de compte." }); return res.redirect(ctx.listUrl); }
  // Même formulaire déjà traité (double clic, rechargement de la page de résultat) : aucun second compte
  const done = rid && req.session.accountDone && req.session.accountDone[rid];
  if (done) { flash(req, { type: "ok", text: "Ce formulaire a déjà été envoyé : le compte existe, rien n'a été créé en double." }); return res.redirect(ctx.detailUrl(done.id, done.role)); }
  const values = { username: body.username, email: body.email, first_name: body.first_name, last_name: body.last_name, website: body.website, language: body.language, notify: body.notify === "1", role: String(body.role || ""), site_id: String(body.site_id || "") };
  try {
    const r = accounts.create(ctx.org, ctx.actor, { ...values, password: body.password, notify: body.notify === "1", site_id: ctx.scopeSiteId !== null ? ctx.scopeSiteId : body.site_id }, { scopeSiteId: ctx.scopeSiteId });
    req.session.accountDone = { ...(req.session.accountDone || {}), ...(rid ? { [rid]: { id: r.user.id, role: r.role } } : {}) };
    flash(req, accounts.summary(r));
    return res.redirect(ctx.detailUrl(r.user.id, r.role));
  } catch (error) {
    if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
    // Le mot de passe saisi n'est JAMAIS renvoyé dans la page : la personne le ressaisit ou en génère un autre
    return show(req, res, ctx, { status: 422, values: { ...values, notify: values.notify }, fieldErrors: error.fields || {}, errors: error.fields ? [] : [error.message] });
  }
}

// Compte qui vient d'être créé par CETTE session (jamais un identifiant pris dans l'adresse sans contrôle) : sert à la page de confirmation d'un compte sans accès à l'administration
function createdOf(req) {
  const id = /^\d{1,9}$/.test(String(req.query.cree || "")) ? Number(req.query.cree) : null;
  if (!id || !Object.values(req.session.accountDone || {}).some((d) => d.id === id)) return null;
  const u = require("../../config/database").prepare("SELECT id, username, email, first_name, last_name, language, website FROM users WHERE id = ?").get(id);
  return u || null;
}

module.exports = { show, submit, createdOf };
