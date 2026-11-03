// KOLAKISA CMS → Paramètres → Général : centre de configuration générale d'UN site (ou du site principal pour l'équipe).
// Ce n'est PAS un second système de réglages : chaque champ est un réglage du moteur (services/settings) — même validation, mêmes droits, même journal d'activité, même
// source de vérité (mk_sites / mk_settings / moteurs propriétaires). Cet écran ne fait que les présenter par sections et les enregistrer EN UNE FOIS (tout ou rien).
// Le site vient de l'adresse vérifiée par le serveur (/sites/<id>/reglages ou « ?site= »), jamais d'un état global ni du navigateur.
const engine = require("../../services/settings");
const db = require("../../config/database");
const pages = require("../pages");
const { safeJson } = require("./kit");

// Réglages présentés ici, dans l'ordre des sections. « homepage_page » appartient au groupe Lecture du moteur : une seule valeur, deux écrans qui la lisent.
const SECTIONS = {
  identite: ["site_name", "description", "favicon", "logo", "site_slug", "site_type", "site_note"],
  adresses: ["homepage_page", "public_url"],
  comptes: ["registration_open", "admin_email"],
  langue: ["language", "timezone"],
  dates: ["date_format", "time_format", "week_start"],
};
const KEYS = Object.values(SECTIONS).flat();

const origin = () => { try { return new URL(process.env.SITE_URL).origin; } catch { return ""; } };

// Fuseaux IANA regroupés par zone (Europe, America…) pour le sélecteur ; « UTC » en tête
function timezoneGroups() {
  const groups = {};
  for (const tz of engine.TIMEZONES) { const [zone, ...rest] = tz.split("/"); if (!rest.length) continue; (groups[zone] = groups[zone] || []).push(tz); }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([zone, list]) => ({ zone, list }));
}

// Données de l'écran : valeurs réelles lues au moteur, droits réels de la personne, choix proposés (pages publiées, images de la médiathèque)
function build(req, t) {
  const scope = { siteId: t.siteId };
  const ctx = { ...req.mk.ctx, can: req.mk.can, orgLevel: !req.mk.siteOnly };
  const values = engine.readAll(scope, ctx);
  const fields = {};
  for (const d of engine.defsFor(scope)) {
    if (!KEYS.includes(d.key)) continue;
    fields[d.key] = {
      key: d.key, label: d.label, help: d.help || "", type: d.type, sensitive: Boolean(d.sensitive), impact: d.impact || "", nullable: Boolean(d.nullable), required: Boolean(d.required),
      max: scope.siteId && d.maxSite ? d.maxSite : d.max, value: values[d.key].value, def: values[d.key].default,
      options: d.type === "enum" ? d.options(scope) : null,
      editable: !t.readOnly && ctx.can(d.perm) && (!d.sensitive || ctx.can("settings.sensitive")),
      locked: !t.readOnly && ctx.can(d.perm) && d.sensitive && !ctx.can("settings.sensitive") ? "Réglage sensible : permission « settings.sensitive » requise." : "",
    };
  }
  const org = req.mk.ctx.organizationId;
  const choices = {
    pages: db.prepare("SELECT id, name FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL AND kind <> 'step' ORDER BY name COLLATE NOCASE LIMIT 300").all(org, scope.siteId),
    images: db.prepare("SELECT path, name FROM mk_media WHERE organization_id = ? AND type = 'image' AND deleted_at IS NULL ORDER BY id DESC LIMIT 300").all(org),
  };
  const site = t.site || null;
  const base = origin();
  const q = t.siteId ? `?site=${t.siteId}` : "";
  const publicUrl = site ? (fields.public_url && fields.public_url.value) || "" : "";
  const info = {
    principal: t.principal,
    // Adresse publique : le domaine du site s'il en a un ; sinon le domaine de la plateforme (les pages du CMS vivent sous /p/…)
    publicAddress: publicUrl || base, hostedAddress: base ? `${base}/p/` : "", customDomain: Boolean(publicUrl),
    platformUrl: base, admin: t.siteId ? `/marketing/site-web/sites/${t.siteId}/tableau-de-bord` : "/marketing/site-web/principal/tableau-de-bord",
  };
  const links = {
    pages: t.siteId ? `/marketing/site-web/sites/${t.siteId}/pages` : "/marketing/pages",
    users: t.siteId ? `/marketing/site-web/sites/${t.siteId}/equipe` : "/marketing/site-web/utilisateurs",
    header: t.siteId ? `/marketing/site-web/sites/${t.siteId}/constructeur-de-theme?type=header` : "/marketing/site-web/apparence/en-tete",
    footer: t.siteId ? `/marketing/site-web/sites/${t.siteId}/constructeur-de-theme?type=footer` : "/marketing/site-web/apparence/pied-de-page",
    styles: `/marketing/site-web/styles${q}`, designSystem: t.siteId ? `/marketing/site-web/sites/${t.siteId}/reglages/design-system` : null,
    customizer: `/marketing/site-web/personnaliser${q}`, media: t.siteId ? `/marketing/site-web/sites/${t.siteId}/medias` : "/marketing/site-web/mediatheque",
  };
  return {
    scope, fields, choices, info, links, sections: SECTIONS, readOnly: t.readOnly,
    save: `/marketing/site-web/parametres/api/general${q}`,
    timezones: timezoneGroups(), canSave: Object.values(fields).some((f) => f.editable),
    locale: scope.siteId ? "site" : "main",
  };
}

// Rendu de l'écran : `active` est la clé du menu latéral (le même écran sert « Paramètres → Général » du principal et « Réglages » de l'espace d'un site)
function render(req, res, t, active, extra = {}) {
  const data = build(req, t);
  res.set("Cache-Control", "no-store");
  res.render("marketing/settings-general", {
    title: "Général", active, T: t, G: data, bootJson: safeJson({ ...data, siteName: t.name, siteId: t.siteId }), generalJs: true, siteSpaceActions: extra.siteSpaceActions || null,
    ...extra,
  });
}

module.exports = { render, build, KEYS, SECTIONS };
