// KOLAKISA CMS — Barre d'administration supérieure : tout ce qu'elle affiche est calculé ICI, côté serveur, à partir des données réelles et des droits de la personne.
// Aucun bouton n'existe sans destination réelle : chaque entrée (création, action contextuelle, site, profil) vient d'une route déjà montée ; la liste est filtrée par les
// permissions (un lien masqué ne protège rien : les routes de destination vérifient elles-mêmes les droits et la portée du site).
// Notifications : UN seul stock d'états « lu » — celui du centre d'activité (activity_reads / activity_state) — réutilisé tel quel ; les éléments sont ceux de CE site
// (commentaires à modérer d'un site : jamais ceux d'un autre) et, pour le site principal d'un formateur, les ventes, inscriptions et messages déjà suivis par le centre d'activité.
const db = require("../config/database");
const urls = require("./urls");
const siteContent = require("./siteContent");
const activity = require("./gestion/activity");

const ROLE_LABELS = { owner: "Propriétaire", admin: "Administrateur", editor: "Éditeur", viewer: "Lecteur", formateur: "Formateur", etudiant: "Élève" };
const MAX_LIST = 12;
const MAX_MARK = 200;

// ---------- Adresse publique du site actif ----------
// Domaine propre (https) si le site en a un ; sinon l'accueil du site sur le domaine de la plateforme (/p/<adresse>) ; le site principal : la racine. Jamais une adresse déduite d'un nom.
// Domaine propre d'un site : l'adresse publique (https) enregistrée dans SES réglages (relue depuis ses réglages, jamais déduite d'un nom)
function domainOf(site) {
  const url = site && site.settings && site.settings.seo && site.settings.seo.publicUrl;
  if (!url) return null;
  try { const u = new URL(url); return u.protocol === "https:" ? { base: u.origin, host: u.hostname.toLowerCase() } : null; } catch { return null; }
}
function publicHome(site) {
  if (!site) return { href: "/", host: hostOf(process.env.SITE_URL) };
  const own = domainOf(site);
  if (own) return { href: `${own.base}/`, host: own.host };
  const home = site.home_page_id ? db.prepare("SELECT id, slug, site_id, status, archived_at FROM mk_landing_pages WHERE id = ? AND site_id = ?").get(site.home_page_id, site.id) : null;
  const live = home && home.status === "published" && !home.archived_at ? home : db.prepare("SELECT id, slug, site_id, status, archived_at FROM mk_landing_pages WHERE site_id = ? AND status = 'published' AND archived_at IS NULL AND kind = 'page' ORDER BY id LIMIT 1").get(site.id);
  if (!live) return { href: null, host: "", why: "Ce site n'a encore aucune page publiée." };
  return { href: urls.pagePath(live, { hostSite: undefined }), host: hostOf(process.env.SITE_URL) };
}
function hostOf(url) { try { return new URL(url).hostname; } catch { return ""; } }

// ---------- Sites ----------
function sitesOf({ ctx, sites, space }) {
  const teamLevel = ctx.siteScope === undefined;
  const list = sites.map((s) => {
    const own = domainOf(s);
    const fav = s.settings && s.settings.identity && s.settings.identity.faviconUrl;
    return { id: s.id, name: s.name, host: own ? own.host : "", favicon: fav || "", href: `/marketing/site-web/sites/${s.id}/tableau-de-bord`, current: Boolean(space && space.siteId === s.id) };
  });
  const main = teamLevel ? { id: null, name: "Site principal", host: hostOf(process.env.SITE_URL), favicon: "", href: "/marketing/site-web/principal/tableau-de-bord", current: Boolean(space && space.principal) } : null;
  const current = space ? (space.principal ? main : list.find((x) => x.current)) || { id: space.siteId, name: space.name, host: "", favicon: "", href: `${space.base}/tableau-de-bord`, current: true } : null;
  return { current, list: main ? [main, ...list] : list, teamLevel };
}

// ---------- Création rapide ----------
// Chaque entrée = un écran de création qui existe déjà ; elle n'apparaît que si l'entrée correspondante est ouverte DANS ce site et permise à la personne.
function createItems({ can, space, flat, teamLevel }) {
  const find = (key) => flat.find((i) => i.key === key && !i.disabled && i.href);
  const out = [];
  const spaceActive = !space || (space.status === "active" && !space.deleted);
  const push = (cond, item) => { if (cond) out.push(item); };
  const pagesHref = space ? `${space.base}/pages#nouvelle` : "/marketing/pages#nouvelle";
  push(spaceActive && can("forms.write"), { key: "page", label: "Page", hint: "Avec le Page Builder", icon: "layout", href: pagesHref });
  const article = find("articles/ajouter");
  push(spaceActive && article && can("articles.write"), { key: "article", label: "Article", hint: "Dans l'éditeur du blog", icon: "fileText", href: article && article.href });
  const media = find("mediatheque/ajouter");
  push(spaceActive && media && can("media.upload"), { key: "media", label: "Média", hint: "Images, vidéos, documents", icon: "image", href: media && media.href });
  const forms = find("espace/formulaires");
  push(spaceActive && forms && can("forms.write"), { key: "form", label: "Formulaire", hint: "Collecte de contacts", icon: "listChecks", href: forms && `${forms.href}#nouveau` });
  push(teamLevel && can("forms.write"), { key: "site", label: "Site", hint: "Un nouveau site indépendant", icon: "globe", href: "/marketing/site-web/sites#nouveau" });
  return out;
}

// ---------- Actions liées à l'écran ou au contenu consulté ----------
// Les identifiants viennent du contenu réellement affiché (jamais d'une saisie) et le contenu doit appartenir au site actif.
function contextItems({ can, space, active, content, site }) {
  const out = [];
  const siteId = space && space.siteId ? space.siteId : null;
  const page = content && content.page;
  if (active === "landing" && page && Number.isInteger(page.id) && (page.site_id ?? null) === (siteId ?? null) && !page.archived_at) {
    if (can("forms.read")) out.push({ key: "page-editor", label: "Modifier avec l'éditeur", short: "Modifier", icon: "edit", href: `/marketing/pages/${page.id}/editeur`, primary: true });
    if (can("forms.read")) out.push({ key: "page-preview", label: "Prévisualiser", short: "Aperçu", icon: "eye", href: `/marketing/pages/${page.id}/apercu`, newTab: true });
    if (page.status === "published") out.push({ key: "page-view", label: "Voir la page", short: "Voir", icon: "externalLink", href: urls.pagePath(page, { hostSite: undefined }), newTab: true });
  }
  if ((active === "sitedash" || active === "espace/tableau-de-bord") && site && site.home_page_id && can("forms.read")) {
    const home = db.prepare("SELECT id, name FROM mk_landing_pages WHERE id = ? AND site_id = ? AND archived_at IS NULL").get(site.home_page_id, site.id);
    if (home) out.push({ key: "home-edit", label: "Modifier la page d'accueil", short: "Page d'accueil", icon: "edit", href: `/marketing/pages/${home.id}/editeur`, primary: true });
  }
  return out;
}

// ---------- Notifications ----------
const siteKey = (siteId) => (siteId === null || siteId === undefined ? 0 : Number(siteId)); // 0 = site principal (comme mk_content_sites)
const sinceOf = (userId) => { const r = db.prepare("SELECT read_all_before FROM activity_state WHERE user_id = ?").get(userId); return r && r.read_all_before ? r.read_all_before : db.prepare("SELECT datetime('now', '-30 days') t").get().t; };
const isRead = (userId, key) => Boolean(db.prepare("SELECT 1 FROM activity_reads WHERE user_id = ? AND item_key = ?").get(userId, key));

// Commentaires à modérer d'UN site (ceux de son article) : seulement pour qui peut modérer
function commentRows({ userId, siteId, can, limit }) {
  if (!can("comments.moderate")) return [];
  const pred = siteContent.scopeForSite("post", "c.content_id", siteKey(siteId));
  const rows = db.prepare(`SELECT c.id, c.created_at AS at, c.body, COALESCE(u.username, NULLIF(c.author_name, ''), 'Anonyme') AS who, p.title AS post
    FROM blog_comments c JOIN posts p ON p.id = c.content_id LEFT JOIN users u ON u.id = c.user_id
    WHERE c.content_type = 'post' AND c.status = 'pending' AND ${pred.sql} ORDER BY c.id DESC LIMIT ?`).all(...pred.params, limit);
  const since = sinceOf(userId);
  return rows.map((r) => ({ key: `comment:${r.id}`, kind: "comment", title: "Commentaire à modérer", detail: `${r.who} · ${r.post}`, excerpt: String(r.body || "").replace(/\s+/g, " ").slice(0, 120), at: r.at, unread: r.at > since && !isRead(userId, `comment:${r.id}`) }));
}
// Ventes, inscriptions et messages : le centre d'activité du formateur (données de la plateforme, donc du site principal)
function platformRows({ userId, limit }) {
  const out = [];
  let unread = 0;
  for (const type of ["ventes", "eleves", "messages"]) {
    try {
      unread += activity.feed(userId, { vue: "notifications", type, etat: "non-lu" }).total;
      for (const r of activity.feed(userId, { vue: "notifications", type }).rows.slice(0, limit)) out.push({ key: r.key, kind: r.kind, title: r.title, detail: r.detail || "", at: r.at, unread: Boolean(r.unread) });
    } catch (error) { console.error("[KOLAKISA] Barre d'administration · activité :", error.message); }
  }
  return { rows: out, unread };
}

// Éléments visibles pour CE site et CETTE personne ; unread = total exact des non lus de ce périmètre
function notifications({ userId, siteId, can, isFormateur, limit = MAX_LIST }) {
  const comments = commentRows({ userId, siteId, can, limit: 50 });
  let rows = [...comments], unread = comments.filter((c) => c.unread).length;
  if (siteId === null && isFormateur) { const p = platformRows({ userId, limit }); rows = rows.concat(p.rows); unread += p.unread; }
  rows.sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.key).localeCompare(String(a.key)));
  return { items: rows.slice(0, limit), unread, total: rows.length };
}
// Le total de l'activité de la plateforme est mémorisé 20 s par personne (la barre est affichée sur chaque écran du CMS) ; toute lecture / « tout lu » l'invalide aussitôt
const platformCache = new Map();
function platformUnread(userId) {
  const hit = platformCache.get(userId);
  if (hit && Date.now() - hit.t < 20000) return hit.n;
  let n = 0;
  for (const type of ["ventes", "eleves", "messages"]) { try { n += activity.feed(userId, { vue: "notifications", type, etat: "non-lu" }).total; } catch { /* source indisponible : aucun faux chiffre */ } }
  platformCache.set(userId, { n, t: Date.now() });
  return n;
}
function unreadCount({ userId, siteId, can, isFormateur }) {
  let n = commentRows({ userId, siteId, can, limit: 200 }).filter((c) => c.unread).length;
  if (siteId === null && isFormateur) n += platformUnread(userId);
  return n;
}
// Adresse de l'élément, calculée par le serveur (jamais fournie par le navigateur)
function hrefOf(key, { space, userId }) {
  const m = /^([a-z]+):(\d+)/.exec(String(key || ""));
  if (!m) return null;
  if (m[1] === "comment") return `${space && space.siteId ? space.base : "/marketing/site-web"}/commentaires/en-attente`;
  const it = activity.item(userId, key);
  return it && it.href ? it.href : null;
}
// Un élément n'est marquable que s'il fait partie de ceux que CE site montre à CETTE personne
function visibleKeys(args) { return new Set(notifications({ ...args, limit: MAX_MARK }).items.map((i) => i.key)); }
function markRead(args, key) {
  if (!visibleKeys(args).has(key)) return false;
  db.prepare("INSERT OR IGNORE INTO activity_reads (user_id, item_key) VALUES (?, ?)").run(args.userId, key);
  platformCache.delete(args.userId);
  return true;
}
function markAllRead(args) {
  const keys = [...visibleKeys(args)];
  const ins = db.prepare("INSERT OR IGNORE INTO activity_reads (user_id, item_key) VALUES (?, ?)");
  for (const k of keys.slice(0, MAX_MARK)) ins.run(args.userId, k);
  platformCache.delete(args.userId);
  return keys.length;
}

// ---------- Assemblage ----------
// Entrées : mk (droits, rôle, contexte), user (session), space (espace du site ou null), cms (menu calculé), sites (sites autorisés), active, content (variables de l'écran : page…)
function build({ mk, user, space, cms, sites, active, content = {}, site = null }) {
  const can = mk.can;
  const ctx = mk.ctx;
  const sw = sitesOf({ ctx, sites: sites || [], space });
  const flat = cms && cms.sections ? cms.sections.flatMap((s) => s.items || []) : [];
  const siteId = space ? (space.principal ? null : space.siteId) : null;
  const siteRow = site || (space && space.siteId ? require("../marketing/pages").getSite(ctx, space.siteId) : null);
  const retired = Boolean(siteRow && (siteRow.status !== "active" || siteRow.deleted_at));
  const pub = retired ? { href: null, host: "", why: "Ce site est archivé ou supprimé : il n'est plus servi publiquement." } : publicHome(siteRow);
  const isFormateur = user.role === "formateur";
  const unread = unreadCount({ userId: user.id, siteId, can, isFormateur });
  const mySpace = isFormateur ? { href: "/formateur", label: "Mon espace" } : { href: "/mes-cours", label: "Mes formations" };
  return {
    siteId, siteQuery: siteId ? `?site=${siteId}` : "",
    brand: { href: space ? (space.principal ? "/marketing/site-web/principal/tableau-de-bord" : `${space.base}/tableau-de-bord`) : "/marketing/site-web/sites", label: "Tableau de bord" },
    sites: sw, publicLink: { href: pub.href, host: pub.host, why: pub.why || "" },
    create: createItems({ can, space, flat, teamLevel: sw.teamLevel }),
    context: contextItems({ can, space, active, content, site: siteRow }),
    notifications: {
      unread, label: unread > 9 ? "9+" : String(unread), enabled: can("comments.moderate") || (siteId === null && isFormateur),
      more: siteId === null && isFormateur ? { href: "/formateur/gestion/activite?vue=notifications", label: "Ouvrir le centre d'activité" } : can("comments.moderate") ? { href: `${space && space.siteId ? space.base : "/marketing/site-web"}/commentaires/en-attente`, label: "Modérer les commentaires" } : null,
    },
    user: { name: user.username, initial: String(user.username || "?").slice(0, 1).toUpperCase(), role: ROLE_LABELS[user.role === "formateur" ? "formateur" : mk.role] || ROLE_LABELS[user.role] || "", isFormateur, mySpace, profileHref: isFormateur ? "/formateur/profil" : "/mon-compte", accountHref: "/mon-compte" },
  };
}

module.exports = { build, notifications, unreadCount, markRead, markAllRead, hrefOf, publicHome, MAX_LIST };
