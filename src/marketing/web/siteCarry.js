// R8 lot 3 — Conserver le SITE courant dans les écrans Contacts et Formulaires (deux familles dont les vues ont été écrites avant les espaces de site).
// Le site vient du contexte vérifié par le serveur (ctx.siteScope pour un accès limité, ctx.siteFilter pour l'équipe), jamais du HTML ; il est AJOUTÉ aux seuls liens et formulaires qui mènent aux familles
// /marketing/contacts et /marketing/formulaires, s'ils n'en portent pas déjà un. Ainsi, dans le cadre d'un site, chaque lien, filtre, pagination et formulaire garde le site (sans quoi un accès limité
// serait refusé : la portée d'une adresse de ces familles est lue dans « ?site= » ou dans le champ « site »). Les adresses réservées à l'équipe (doublons, fusion, traitement des demandes) restent telles quelles.
const TARGET = /^\/marketing\/(?:contacts|formulaires|site-web\/navigation|site-web\/apparence\/menus)(?:[/?#]|$)/;
const TEAM_ONLY = /^\/marketing\/contacts\/(?:doublons|fusion|demandes\/traiter|demandes\/\d+)/;

function withSite(url, site) {
  if (!TARGET.test(url) || TEAM_ONLY.test(url) || /(?:[?]|&(?:amp;)?)site=/.test(url)) return url;
  const hash = url.indexOf("#");
  const base = hash >= 0 ? url.slice(0, hash) : url, frag = hash >= 0 ? url.slice(hash) : "";
  return `${base}${base.includes("?") ? "&amp;" : "?"}site=${site}${frag}`; // « &amp; » : valide dans un attribut HTML
}

// → html avec le site conservé ; site invalide → html inchangé
function carry(html, site) {
  if (!Number.isInteger(site) || site < 1 || typeof html !== "string") return html;
  // 1. formulaires : champ caché « site » (sauf si le formulaire en porte déjà un ou si son action est hors des deux familles / réservée à l'équipe)
  let out = html.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, (block) => {
    const open = /^<form\b[^>]*>/i.exec(block)[0];
    const action = /\baction="([^"]*)"/i.exec(open);
    if (!action || !TARGET.test(action[1]) || TEAM_ONLY.test(action[1]) || /name="site"/i.test(block)) return block;
    return `${open}<input type="hidden" name="site" value="${site}">${block.slice(open.length)}`;
  });
  // 2. liens
  out = out.replace(/(<a\b[^>]*\shref=")([^"]*)(")/gi, (m, a, url, c) => `${a}${withSite(url, site)}${c}`);
  return out;
}

// Enveloppe res.render : le HTML produit est complété avant l'envoi (erreurs et rendus avec rappel inchangés)
function install(req, res, site) {
  if (!Number.isInteger(site) || site < 1) return;
  // Redirections après une action (« retour à la fiche », « retour à la liste ») : même règle, sinon l'accès limité serait renvoyé hors de son site
  const redirect = res.redirect.bind(res);
  res.redirect = function carryRedirect(a, b) {
    const status = typeof a === "number" ? a : undefined, url = status !== undefined ? b : a;
    const next = typeof url === "string" ? withSite(url, site) : url;
    return status !== undefined ? redirect(status, next) : redirect(next);
  };
  const original = res.render.bind(res);
  res.render = function render(view, options, callback) {
    const opts = typeof options === "function" ? undefined : options, done = typeof options === "function" ? options : callback;
    return original(view, opts, (err, html) => {
      if (done) return done(err, err ? html : carry(html, site));
      if (err) return req.next(err);
      return res.send(carry(html, site));
    });
  };
}
module.exports = { carry, withSite, install, TARGET };
