// Santé du site (palier 13) : chaque contrôle est une VRAIE vérification (requête au serveur lui-même, lecture de la base, des fichiers, de la
// configuration). Un contrôle qui échoue ou ne peut pas mesurer le dit (« non mesuré ») : jamais de « OK » par défaut.
// Les contrôles réutilisent les moteurs existants : SEO (audit, tâches), URLs (résolveur, redirections, liens cassés), médias (audit des fichiers),
// sauvegardes, file de travaux. Aucun contrôle ne modifie quoi que ce soit.
const fs = require("node:fs");
const path = require("node:path");
const db = require("../../config/database");
const runner = require("./runner");
const runs = require("./runs");
const probe = require("../../seo/probe");

const STATUS = { good: "Bon", warning: "À surveiller", critical: "Critique", info: "Information" };
const CATEGORIES = { configuration: "Configuration", security: "Sécurité", database: "Base de données", urls: "Adresses et indexation", seo: "Référencement", content: "Contenu", media: "Médias", performance: "Performance", integrations: "Intégrations" };
const CHECKS = [];
const check = (id, category, title, fn, { site = true } = {}) => CHECKS.push({ id, category, title, fn, site });
const R = (status, detail, extra = {}) => ({ status, detail, impact: "", recommendation: "", action: null, ...extra });
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// ---------- Configuration ----------
check("environment", "configuration", "Environnement", async (c) => {
  const env = process.env.NODE_ENV === "production" ? "production" : process.env.NODE_ENV === "test" ? "test" : "développement";
  const { indexingAllowed } = require("../../middlewares/siteHost");
  const open = indexingAllowed({ hostname: c.host || "" });
  return R("info", `Environnement : ${env}. Indexation par les moteurs de recherche : ${open ? "autorisée" : "fermée (adresse locale ou ALLOW_INDEXING=0)"}.`, open ? {} : { impact: "Le site est tenu à l'écart des moteurs de recherche.", recommendation: "Normal en développement ; en production, vérifiez SITE_URL." });
}, { site: false });
check("site_url", "configuration", "Adresse publique du site (SITE_URL)", async () => {
  const url = process.env.SITE_URL || "";
  if (!url) return R("warning", "SITE_URL n'est pas définie.", { impact: "Les adresses absolues (canonical, plan du site, e-mails) se déduisent de la requête : risque d'adresses incohérentes derrière un proxy.", recommendation: "Définir SITE_URL chez l'hébergeur (variables d'environnement)." });
  try { new URL(url); } catch { return R("critical", "SITE_URL n'est pas une adresse valide.", { recommendation: "Corriger la variable SITE_URL (ex. https://www.monsite.com)." }); }
  return R("good", `Adresse publique : ${new URL(url).origin}.`);
}, { site: false });
check("https", "configuration", "HTTPS", async (c) => {
  const url = c.site && c.site.base ? c.site.base : process.env.SITE_URL || "";
  if (!url) return R("info", "Adresse publique inconnue : HTTPS non vérifiable.");
  const u = new URL(url);
  if (u.protocol === "https:") return R("good", `${u.origin} utilise HTTPS.`);
  const local = /^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname);
  return R(local ? "info" : "critical", `${u.origin} n'utilise pas HTTPS.`, local ? {} : { impact: "Connexions et formulaires non chiffrés ; les navigateurs avertissent les visiteurs.", recommendation: "Activer le certificat SSL de l'hébergeur et utiliser une adresse https://." });
});
check("secrets", "security", "Secrets de configuration", async () => {
  const miss = [];
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 16) miss.push("ENCRYPTION_KEY");
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) miss.push("SESSION_SECRET");
  return miss.length ? R("critical", `Secret absent ou trop court : ${miss.join(", ")}.`, { impact: "Sessions ou données chiffrées vulnérables.", recommendation: "Définir une valeur aléatoire de 32 caractères ou plus dans les variables d'environnement (jamais dans le code)." }) : R("good", "Les secrets requis sont définis (valeurs non affichées).");
}, { site: false });
check("storage", "configuration", "Stockage des fichiers et de la base", async () => {
  const { storageInfo } = require("../../config/mediaAudit");
  const s = storageInfo();
  if (s.deployedBuild && s.uploadsInsideApp) return R("critical", "Les fichiers envoyés sont dans le dossier de l'application, remplacé à chaque déploiement.", { impact: "Les médias seront perdus au prochain déploiement.", recommendation: "Définir UPLOADS_DIR vers un dossier conservé, hors de l'application." });
  if (s.uploadsInsideApp || s.dataInsideApp) return R("warning", `Stockage dans le dossier de l'application (${[s.uploadsInsideApp && "fichiers", s.dataInsideApp && "base"].filter(Boolean).join(", ")}).`, { impact: "Risque de perte lors d'un redéploiement.", recommendation: "Utiliser des dossiers hors de l'application (UPLOADS_DIR, DATA_DIR)." });
  return R("good", "Fichiers et base sont stockés hors du dossier de l'application.");
}, { site: false });
check("worker", "integrations", "Traitement en arrière-plan", async () => {
  const on = process.env.MARKETING_WORKER === "on";
  const dead = db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE state = 'dead'").get().n;
  const stuck = db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE state = 'running' AND locked_until < ?").get(Date.now()).n;
  const pending = db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE state = 'pending' AND run_at <= ?").get(Date.now()).n;
  if (dead || stuck) return R("warning", `File de travaux : ${plural(dead, "travail abandonné", "travaux abandonnés")}, ${plural(stuck, "bloqué", "bloqués")}, ${pending} en attente.`, { impact: "Des envois ou synchronisations n'ont pas abouti.", recommendation: "Consulter Outils → Diagnostic pour le détail des échecs.", action: { label: "Ouvrir le diagnostic", href: "/marketing/site-web/outils/diagnostic" } });
  if (!on && pending > 20) return R("warning", `Le worker marketing est inactif (MARKETING_WORKER ≠ on) et ${pending} travaux attendent.`, { impact: "Les envois et automatisations programmés ne partent pas.", recommendation: "Activer MARKETING_WORKER=on chez l'hébergeur (les outils d'import / export fonctionnent sans lui)." });
  return R(on ? "good" : "info", on ? `Worker actif ; ${pending} travail(aux) en attente, aucun échec.` : "Worker marketing inactif : les outils du CMS tournent via leur exécuteur local ; les envois programmés ne sont pas traités.");
}, { site: false });
check("email", "integrations", "Envoi d'e-mails", async () => {
  const smtp = Boolean(process.env.SMTP_HOST);
  return smtp ? R("good", "Un serveur d'envoi (SMTP) est configuré (identifiants non affichés).") : R("info", "Aucun serveur d'envoi (SMTP) configuré sur ce serveur.", { impact: "Pas d'e-mails (confirmation, mot de passe oublié, invitations).", recommendation: "Renseigner SMTP_HOST et ses variables si des e-mails sont attendus." });
}, { site: false });

// Fournisseur d'envoi du moteur d'e-mails (palier 26, G-02) : « console » n'envoie RIEN, mais les messages sont enregistrés « envoyés ».
check("sending_provider", "integrations", "Fournisseur d'envoi des e-mails marketing", async (c) => {
  const { getSendingConfig } = require("../../marketing/sending/config");
  const cfg = getSendingConfig({ db, organizationId: c.organizationId, can: () => true, orgLevel: true, settings: runner.config && runner.config.settings });
  if (cfg.provider === "console") return R("warning", "Le fournisseur d'envoi est « console » : aucun e-mail de campagne ou de scénario ne quitte le serveur.", { impact: "Les messages sont enregistrés comme « envoyés » sans être transmis à personne.", recommendation: "Choisir Resend ou SMTP dans les réglages d'envoi du marketing.", action: { label: "Ouvrir les réglages d'envoi", href: "/marketing/envoi" } });
  return R("good", `Fournisseur d'envoi : ${cfg.provider}${cfg.from ? "" : " (adresse d'expédition à renseigner)"}.`);
}, { site: false });
// Paiement (palier 26, G-01) : lecture de la PRÉSENCE des variables, jamais de leur valeur.
check("payments", "integrations", "Paiement en ligne (Stripe)", async () => {
  const key = Boolean(process.env.STRIPE_SECRET_KEY), hook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  if (key && !hook) return R("critical", "Stripe est configuré mais le secret du webhook est absent : les paiements seraient encaissés sans être enregistrés.", { impact: "Pas de commande, pas d'accès à la formation après un paiement.", recommendation: "Renseigner STRIPE_WEBHOOK_SECRET (secret de signature du webhook Stripe) chez l'hébergeur." });
  if (!key && hook) return R("warning", "Le secret du webhook Stripe est présent mais la clé secrète Stripe est absente : aucun paiement ne peut être lancé.", { recommendation: "Renseigner STRIPE_SECRET_KEY chez l'hébergeur." });
  if (!key) return R("info", "Stripe n'est pas configuré : le paiement en ligne est désactivé.", { recommendation: "Renseigner STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET si des ventes en ligne sont prévues." });
  return R("good", "Stripe est configuré (clé secrète et secret du webhook présents ; valeurs non affichées).");
}, { site: false });

// ---------- Réglages (palier 14) : cohérence de la configuration ----------
const settingsScope = (c) => ({ siteId: c.siteId });
check("settings_homepage", "configuration", "Page d'accueil choisie", async (c) => {
  const engine = require("../settings");
  const scope = settingsScope(c);
  const ctx = { organizationId: c.organizationId, can: () => true, orgLevel: true };
  const id = engine.readAll(scope, ctx).homepage_page.value;
  if (!id) return R("info", c.siteId ? "Aucune page d'accueil choisie pour ce site." : "L'accueil standard de KOLAKISA est affiché (aucune page choisie dans Paramètres → Lecture).");
  const p = db.prepare("SELECT status, archived_at, site_id, name FROM mk_landing_pages WHERE id = ?").get(Number(id));
  if (!p || p.archived_at) return R("critical", `La page d'accueil choisie (n° ${id}) n'existe plus ou est à la corbeille.`, { impact: c.siteId ? "L'accueil du site est introuvable." : "L'accueil standard est affiché à la place.", recommendation: "Choisir une autre page dans Paramètres → Lecture.", action: { label: "Ouvrir les paramètres", href: `/marketing/site-web/parametres/lecture${c.siteId ? `?site=${c.siteId}` : ""}` } });
  if (p.status !== "published") return R("warning", `La page d'accueil choisie « ${p.name} » n'est pas publiée.`, { impact: c.siteId ? "L'accueil du site est introuvable." : "L'accueil standard est affiché à la place.", recommendation: "Publier la page ou en choisir une autre.", action: { label: "Ouvrir les paramètres", href: `/marketing/site-web/parametres/lecture${c.siteId ? `?site=${c.siteId}` : ""}` } });
  if ((p.site_id ?? null) !== (c.siteId ?? null)) return R("critical", "La page d'accueil choisie appartient à un autre site.", { recommendation: "Choisir une page de ce site." });
  return R("good", `Page d'accueil : « ${p.name} » (publiée).`);
});
check("settings_locale", "configuration", "Langue et fuseau horaire", async (c) => {
  const engine = require("../settings");
  const ctx = { organizationId: c.organizationId, can: () => true, orgLevel: true };
  const v = engine.readAll(settingsScope(c), ctx);
  if (!engine.validTimezone(String(v.timezone.value))) return R("critical", `Fuseau horaire inconnu : ${String(v.timezone.value).slice(0, 40)}.`, { impact: "Les dates sont affichées avec le fuseau de Paris par défaut.", recommendation: "Choisir un fuseau reconnu dans Paramètres → Général." });
  return R("good", `Langue « ${v.language.value} », fuseau « ${v.timezone.value} », date ${v.date_format.value}, heure ${v.time_format.value}.`);
});
check("settings_visibility", "configuration", "Visibilité pour les moteurs de recherche", async (c) => {
  const engine = require("../settings");
  const ctx = { organizationId: c.organizationId, can: () => true, orgLevel: true };
  const closed = engine.readAll(settingsScope(c), ctx).search_visibility.value === "closed";
  const production = process.env.NODE_ENV === "production";
  if (closed) return R(production ? "critical" : "warning", "Le site est masqué aux moteurs de recherche (Paramètres → Indexation).", { impact: "Aucune page n'apparaît dans les résultats de recherche.", recommendation: "Si ce n'est pas voulu, rendre le site visible.", action: { label: "Ouvrir les paramètres", href: `/marketing/site-web/parametres/indexation${c.siteId ? `?site=${c.siteId}` : ""}` } });
  return R("good", "Le site est visible pour les moteurs de recherche.");
});
check("settings_admin_email", "configuration", "E-mail administratif", async (c) => {
  if (c.siteId !== null) return R("info", "L'e-mail administratif est un réglage du site principal.");
  const engine = require("../settings");
  const e = engine.main().adminEmail;
  return e ? R("good", "Un e-mail administratif est défini (les messages du formulaire de contact lui sont envoyés).") : R("info", "Aucun e-mail administratif défini : l'adresse de l'hébergeur est utilisée.", { recommendation: "Renseigner Paramètres → Général → E-mail administratif.", action: { label: "Ouvrir les paramètres", href: "/marketing/site-web/parametres" } });
}, { site: true });
check("settings_privacy_page", "configuration", "Page de confidentialité", async (c) => {
  const engine = require("../settings");
  const ctx = { organizationId: c.organizationId, can: () => true, orgLevel: true };
  const id = engine.readAll(settingsScope(c), ctx).privacy_page.value;
  if (!id) return R("info", "Aucune page de confidentialité choisie.", { recommendation: "Si le site collecte des données, choisir la page qui présente votre politique (Paramètres → Confidentialité)." });
  const p = db.prepare("SELECT status, archived_at, name FROM mk_landing_pages WHERE id = ?").get(Number(id));
  return !p || p.archived_at || p.status !== "published" ? R("warning", "La page de confidentialité choisie n'est plus publiée : aucun lien n'est affiché.", { recommendation: "Publier la page ou en choisir une autre." }) : R("good", `Page de confidentialité : « ${p.name} ».`);
});

// Tunnels (palier 18) : chaque étape active doit désigner une vraie page CMS, du même site, non archivée et en ligne
check("funnel_references", "content", "Étapes de tunnels", async (c) => {
  const funnels = require("../../marketing/funnels");
  const ctx = { db, organizationId: c.organizationId };
  const siteWhere = c.siteId ? "AND site_id = ?" : "AND site_id IS NULL";
  const rows = db.prepare(`SELECT id FROM mk_funnels WHERE organization_id = ? AND status = 'active' ${siteWhere}`).all(c.organizationId, ...(c.siteId ? [c.siteId] : []));
  if (!rows.length) return R("info", "Aucun tunnel actif.");
  const broken = [];
  for (const r of rows) { const f = funnels.getFunnel(ctx, r.id); for (const s of f.steps) if (s.problem) broken.push(`« ${f.name} » — étape « ${s.name} » : ${s.problem}`); }
  return broken.length
    ? R("warning", `${plural(broken.length, "étape de tunnel a un problème", "étapes de tunnels ont un problème")} : ${broken.slice(0, 3).join(" ; ")}${broken.length > 3 ? " …" : ""}`, { impact: "Les visiteurs d'un tunnel peuvent tomber sur une étape sans page ou hors ligne.", recommendation: "Ouvrir le tunnel et associer, republier ou remplacer la page de l'étape.", action: { label: "Voir les tunnels", href: "/marketing/tunnels" } })
    : R("good", `${plural(rows.length, "tunnel actif", "tunnels actifs")} : toutes les étapes pointent vers une page en ligne.`);
});

// ---------- Sécurité ----------
check("admin_protected", "security", "Administration protégée", async (c) => {
  const r = await probe.request(c.port, "/marketing", { host: c.host });
  if (r.status === 0) return R("info", "Vérification impossible (pas de réponse).");
  return r.status >= 300 && r.status < 400 || r.status === 401 || r.status === 403 ? R("good", `/marketing répond ${r.status} sans connexion : accès protégé.`) : R("critical", `/marketing répond ${r.status} sans connexion.`, { impact: "L'administration pourrait être accessible publiquement.", recommendation: "Vérifier immédiatement l'authentification." });
});
check("sensitive_files", "security", "Fichiers sensibles non exposés", async (c) => {
  const bad = [];
  for (const p of ["/.env", "/data/KOYEKOLA.db", "/package.json", "/server.js", "/.git/config"]) { const r = await probe.request(c.port, p, { host: c.host }); if (r.status === 200) bad.push(p); }
  return bad.length ? R("critical", `Accessible publiquement : ${bad.join(", ")}.`, { impact: "Fuite possible de configuration ou de données.", recommendation: "Bloquer l'accès à ces fichiers au niveau du serveur web." }) : R("good", "Aucun fichier sensible n'est servi (.env, base de données, code).");
}, { site: false });
check("headers", "security", "En-têtes de sécurité", async (c) => {
  const r = await probe.request(c.port, "/", { host: c.host });
  const h = r.headers || {};
  const missing = ["x-content-type-options", "x-frame-options", "content-security-policy"].filter((k) => !h[k]);
  return missing.length ? R("warning", `En-têtes absents : ${missing.join(", ")}.`, { impact: "Protection réduite contre le détournement de clic et l'injection.", recommendation: "Vérifier la configuration des en-têtes de sécurité." }) : R("good", "En-têtes de sécurité présents (nosniff, cadres, politique de contenu).");
}, { site: false });

// ---------- Base de données ----------
check("db_integrity", "database", "Intégrité de la base", async () => {
  const quick = db.prepare("PRAGMA quick_check").all().map((r) => Object.values(r)[0]);
  const fk = db.prepare("PRAGMA foreign_key_check").all();
  if (quick[0] !== "ok") return R("critical", `La vérification interne signale : ${quick.slice(0, 2).join(" ; ")}.`, { impact: "Base abîmée.", recommendation: "Restaurer la dernière sauvegarde saine (Outils → Sauvegardes)." });
  if (fk.length) return R("warning", `${plural(fk.length, "relation brisée", "relations brisées")} détectée(s) entre tables.`, { impact: "Des enregistrements pointent vers des éléments qui n'existent plus.", recommendation: "Lancer le contrôle d'intégrité (Outils → Diagnostic) pour le détail." });
  return R("good", "La base est cohérente (vérification interne et clés étrangères).");
}, { site: false });
check("backups", "database", "Sauvegardes", async () => {
  const list = require("../backups").list();
  const last = list.find((b) => b.kind === "auto" || b.kind === "manuelle");
  if (!last) return R("warning", "Aucune sauvegarde trouvée.", { impact: "Aucune copie en cas de problème.", recommendation: "Créer une sauvegarde et en télécharger une copie hors du serveur.", action: { label: "Voir les sauvegardes", href: "/marketing/site-web/outils/sauvegardes" } });
  const hours = Math.round((Date.now() - new Date(last.createdAt).getTime()) / 3600e3);
  return hours > 48 ? R("warning", `Dernière sauvegarde il y a ${hours} h.`, { impact: "Les changements récents ne sont pas protégés.", recommendation: "Vérifier la sauvegarde automatique." }) : R("good", `Dernière sauvegarde il y a ${hours} h (${list.length} copie(s) conservée(s)).`);
}, { site: false });

// ---------- Adresses et indexation ----------
check("homepage", "urls", "Page d'accueil", async (c) => {
  const r = await probe.request(c.port, "/", { host: c.host });
  return r.status === 200 ? R("good", `L'accueil répond 200 en ${r.ms} ms.`) : R("critical", `L'accueil répond ${r.status || "aucune réponse"}.`, { impact: "Les visiteurs n'accèdent pas au site.", recommendation: c.site ? "Choisir une page d'accueil publiée pour ce site (fiche du site)." : "Vérifier le serveur." });
});
check("not_found", "urls", "Page introuvable (404)", async (c) => {
  const r = await probe.request(c.port, `/controle-sante-${Date.now()}`, { host: c.host });
  return r.status === 404 ? R("good", "Une adresse inexistante répond bien HTTP 404.") : R("critical", `Une adresse inexistante répond ${r.status}.`, { impact: "Pages d'erreur indexables (soft 404).", recommendation: "Vérifier la gestion des 404." });
});
check("sitemap", "urls", "Plan du site (sitemap.xml)", async (c) => {
  const r = await probe.request(c.port, "/sitemap.xml", { host: c.host, body: true, maxBody: 5e6 });
  if (r.status !== 200) return R("critical", `sitemap.xml répond ${r.status}.`, { impact: "Les moteurs ne découvrent pas les pages.", recommendation: "Vérifier le SEO (Outils → Régénération)." });
  const n = (r.text.match(/<loc>/g) || []).length;
  if (!/<(urlset|sitemapindex)/.test(r.text)) return R("critical", "sitemap.xml n'est pas un document valide.");
  return n ? R("good", `Plan du site valide : ${plural(n, "adresse", "adresses")}.`) : R("warning", "Le plan du site est vide.", { impact: "Aucune page n'est proposée aux moteurs.", recommendation: "Publier des pages indexables." });
});
check("robots", "urls", "robots.txt", async (c) => {
  const r = await probe.request(c.port, "/robots.txt", { host: c.host, body: true });
  if (r.status !== 200) return R("warning", `robots.txt répond ${r.status}.`);
  const closed = /^Disallow:\s*\/\s*$/m.test(r.text);
  const { indexingAllowed } = require("../../middlewares/siteHost");
  if (closed && indexingAllowed({ hostname: c.host || "" })) return R("critical", "robots.txt interdit TOUT le site alors que l'indexation est autorisée.", { impact: "Le site disparaît des moteurs de recherche.", recommendation: "Retirer la règle « Disallow: / » (Espace SEO → Réglages)." });
  return R("good", closed ? "robots.txt ferme le site (environnement non public)." : `robots.txt valide${/Sitemap:/i.test(r.text) ? " et annonce le plan du site" : ""}.`);
});
check("redirects", "urls", "Redirections", async (c) => {
  const redirects = require("../../seo/redirects");
  const chains = redirects.chains();
  const loops = chains.filter((x) => x.loop);
  if (loops.length) return R("critical", `${plural(loops.length, "boucle de redirections", "boucles de redirections")}.`, { impact: "Pages inaccessibles.", recommendation: "Corriger les redirections concernées.", action: { label: "Gérer les redirections", href: "/marketing/site-web/redirections" } });
  const rows = db.prepare("SELECT source_path, target FROM seo_redirects WHERE enabled = 1 AND site_id IS ? LIMIT 40").all(c.siteId);
  const broken = [];
  for (const r of rows) { if (/^https:/i.test(r.target)) continue; const t = await probe.trace(c.port, r.source_path, { host: c.host }); if (t.final.status === 404 || t.final.status >= 500) broken.push(r.source_path); }
  if (broken.length || chains.length) return R("warning", `${chains.length ? `${plural(chains.length, "chaîne", "chaînes")} de redirections. ` : ""}${broken.length ? `${plural(broken.length, "redirection mène", "redirections mènent")} vers une page introuvable (${broken.slice(0, 3).join(", ")}).` : ""}`.trim(), { impact: "Perte de référencement et visiteurs perdus.", recommendation: "Corriger les destinations ou raccourcir les chaînes.", action: { label: "Gérer les redirections", href: "/marketing/site-web/redirections" } });
  return R("good", `${plural(rows.length, "redirection vérifiée", "redirections vérifiées")} : aucune boucle, chaîne ni destination cassée.`);
});
check("pages_reachable", "content", "Pages publiées accessibles", async (c) => {
  const urls = require("../urls");
  const rows = db.prepare("SELECT id, slug, name, site_id FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL ORDER BY id LIMIT 40").all(c.organizationId, c.siteId);
  if (!rows.length) return R("info", "Aucune page publiée dans ce périmètre.");
  const bad = [];
  for (const p of rows) {
    const path = c.host ? urls.pagePath(p, { hostSite: c.site }) : urls.pagePath(p, { hostSite: null });
    const r = await probe.request(c.port, path, { host: c.host });
    if (r.status !== 200) bad.push(`${p.name} (${r.status || "pas de réponse"})`);
  }
  return bad.length ? R("critical", `${plural(bad.length, "page publiée inaccessible", "pages publiées inaccessibles")} : ${bad.slice(0, 3).join(", ")}.`, { impact: "Contenu publié mais introuvable.", recommendation: "Ouvrir ces pages et corriger (adresse, site, état)." }) : R("good", `${plural(rows.length, "page publiée vérifiée", "pages publiées vérifiées")} : toutes répondent 200.`);
});
check("posts_reachable", "content", "Articles publiés accessibles", async (c) => {
  if (c.siteId !== null) return R("info", "Les articles appartiennent au site principal.");
  const rows = db.prepare("SELECT id, slug, title FROM posts WHERE published = 1 AND deleted_at IS NULL ORDER BY id DESC LIMIT 40").all();
  if (!rows.length) return R("info", "Aucun article publié.");
  const bad = [];
  for (const p of rows) { const r = await probe.request(c.port, require("../urls").publicPath("post", p), { host: c.host }); if (r.status !== 200) bad.push(`${p.title} (${r.status || "?"})`); }
  return bad.length ? R("critical", `${plural(bad.length, "article publié inaccessible", "articles publiés inaccessibles")} : ${bad.slice(0, 3).join(", ")}.`, { recommendation: "Ouvrir ces articles et corriger." }) : R("good", `${plural(rows.length, "article vérifié", "articles vérifiés")} : tous répondent 200.`);
});
check("broken_links", "urls", "Liens internes cassés", async (c) => {
  const r = await require("../brokenLinks").scan({ port: c.port });
  const broken = r.issues.filter((i) => i.status === "broken");
  const moved = r.issues.filter((i) => i.status === "redirected");
  if (broken.length) return R("warning", `${plural(broken.length, "lien cassé", "liens cassés")} sur ${r.links} lien(s) connu(s) (${broken.slice(0, 2).map((i) => i.path || "ressource supprimée").join(", ")}).`, { impact: "Des visiteurs arrivent sur une page introuvable.", recommendation: "Corriger ces liens (la liste dit où ils se trouvent).", action: { label: "Voir les liens cassés", href: "/marketing/site-web/liens-casses" } });
  if (moved.length) return R("info", `${plural(moved.length, "lien passe", "liens passent")} par une redirection (à mettre à jour sans urgence).`, { action: { label: "Voir les liens", href: "/marketing/site-web/liens-casses" } });
  return R("good", `${r.links} lien(s) interne(s) connu(s) vérifié(s) : aucun cassé.`);
});
check("canonical", "urls", "Adresses canoniques cohérentes", async (c) => {
  const urls = require("../urls");
  const rows = db.prepare("SELECT id, slug, name, site_id, seo FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL AND indexable = 1 ORDER BY id LIMIT 20").all(c.organizationId, c.siteId);
  const bad = [];
  let tested = 0;
  for (const p of rows) {
    let seo = {}; try { seo = JSON.parse(p.seo || "{}"); } catch { seo = {}; }
    if (seo.canonical || seo.noindex) continue; // canonical choisi à la main : voulu
    const path = urls.pagePath(p, { hostSite: c.host ? c.site : null });
    const r = await probe.request(c.port, path, { host: c.host, body: true });
    if (r.status !== 200) continue;
    tested++;
    const m = /<link rel="canonical" href="([^"]+)"/.exec(r.text);
    if (!m) bad.push(`${p.name} : aucun canonical`);
    else { const base = c.site && c.site.base ? c.site.base : process.env.SITE_URL || ""; if (base && new URL(m[1]).origin !== new URL(base.startsWith("http") ? base : `https://${base}`).origin && !p.site_id) bad.push(`${p.name} : domaine inattendu`); }
  }
  return bad.length ? R("warning", `${plural(bad.length, "page", "pages")} avec un canonical douteux : ${bad.slice(0, 3).join(" ; ")}.`, { impact: "Risque de contenu dupliqué aux yeux des moteurs.", recommendation: "Vérifier le canonical de ces pages (panneau SEO)." }) : R(tested ? "good" : "info", tested ? `${plural(tested, "page vérifiée", "pages vérifiées")} : canonical cohérent.` : "Aucune page indexable à vérifier.");
});

// ---------- Référencement (réutilise le moteur SEO) ----------
check("seo_audit", "seo", "Audit SEO", async () => {
  let a = null;
  try { a = db.prepare("SELECT id, finished_at, score FROM seo_audits WHERE status = 'done' ORDER BY id DESC LIMIT 1").get(); } catch { a = null; }
  if (!a) return R("info", "Aucun audit SEO complet n'a encore été lancé.", { recommendation: "Lancer un audit depuis l'Espace SEO pour un contrôle détaillé.", action: { label: "Ouvrir l'Espace SEO", href: "/formateur/seo" } });
  const crit = db.prepare("SELECT COUNT(*) n FROM seo_issues WHERE audit_id = ? AND fixed_at IS NULL AND severity = 'critical'").get(a.id).n;
  return crit ? R("warning", `Dernier audit (${String(a.finished_at).slice(0, 10)}) : ${plural(crit, "problème critique ouvert", "problèmes critiques ouverts")}.`, { impact: "Des erreurs bloquent ou dégradent le référencement.", recommendation: "Traiter les tâches SEO ouvertes.", action: { label: "Ouvrir l'Espace SEO", href: "/formateur/seo" } }) : R("good", `Dernier audit (${String(a.finished_at).slice(0, 10)}) : aucun problème critique ouvert.`);
}, { site: false });
check("seo_meta", "seo", "Titres et descriptions des pages publiées", async (c) => {
  const rows = db.prepare("SELECT id, name, title, description, seo FROM mk_landing_pages WHERE organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL AND indexable = 1").all(c.organizationId, c.siteId);
  const noDesc = [], noTitle = [];
  for (const p of rows) { let seo = {}; try { seo = JSON.parse(p.seo || "{}"); } catch { seo = {}; } if (!seo.description && !p.description) noDesc.push(p.name); if (!seo.title && !p.title) noTitle.push(p.name); }
  if (!rows.length) return R("info", "Aucune page publiée et indexable.");
  if (noDesc.length || noTitle.length) return R("warning", `${noTitle.length ? `${plural(noTitle.length, "page sans titre", "pages sans titre")}. ` : ""}${noDesc.length ? `${plural(noDesc.length, "page sans description", "pages sans description")} (${noDesc.slice(0, 3).join(", ")}).` : ""}`.trim(), { impact: "Extraits de résultats choisis au hasard par les moteurs.", recommendation: "Renseigner le panneau SEO de ces pages (ou la description du site).", action: { label: "Ouvrir les pages", href: "/marketing/pages" } });
  return R("good", `${plural(rows.length, "page", "pages")} : titre et description renseignés.`);
});
check("noindex_home", "seo", "Accueil indexable", async (c) => {
  const r = await probe.request(c.port, "/", { host: c.host, body: true });
  if (r.status !== 200) return R("info", "Accueil non lu : voir le contrôle « Page d'accueil ».");
  const m = /<meta name="robots" content="([^"]+)"/.exec(r.text);
  return m && /noindex/.test(m[1]) ? R("critical", `L'accueil est en « ${m[1]} ».`, { impact: "Le site n'apparaît pas dans les moteurs.", recommendation: "Retirer le noindex de la page d'accueil (panneau SEO ou réglages du site)." }) : R("good", "L'accueil n'est pas bloqué à l'indexation.");
});

// ---------- Contenu ----------
check("scheduled", "content", "Publications programmées", async () => {
  const late = db.prepare("SELECT COUNT(*) n FROM posts WHERE status = 'scheduled' AND deleted_at IS NULL AND published_at < datetime('now', '-2 hours')").get().n;
  return late ? R("warning", `${plural(late, "article programmé en retard", "articles programmés en retard")} (date dépassée de plus de 2 h).`, { impact: "Contenu annoncé mais non publié.", recommendation: "Ouvrir la liste des articles programmés et republier." }) : R("good", "Aucune publication programmée en retard.");
}, { site: false });
check("moderation", "content", "Commentaires en attente", async () => {
  let n = 0; try { n = db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE status = 'pending'").get().n; } catch { return R("info", "Modération non mesurable."); }
  return n ? R("info", `${plural(n, "commentaire attend", "commentaires attendent")} une modération.`, { action: { label: "Modérer", href: "/marketing/site-web/commentaires" } }) : R("good", "Aucun commentaire en attente.");
}, { site: false });

// ---------- Médias (réutilise l'audit des médias) ----------
check("media", "media", "Fichiers et références médias", async (c) => {
  const a = require("../../config/mediaAudit").auditMedia(db, { siteHost: (process.env.SITE_URL || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "") });
  const missingLib = a.library.marketing.missing + a.library.blog.missing;
  const problems = [];
  if (a.refs.MISSING) problems.push(`${plural(a.refs.MISSING, "référence", "références")} à un fichier introuvable (${a.missing.slice(0, 2).map((m) => m.path.split("/").pop()).join(", ")})`);
  if (missingLib) problems.push(`${plural(missingLib, "fiche de médiathèque", "fiches de médiathèque")} sans fichier`);
  if (a.refs.TEMPORARY_URL) problems.push(`${plural(a.refs.TEMPORARY_URL, "adresse temporaire", "adresses temporaires")} (blob:, localhost)`);
  if (problems.length) return R(a.refs.MISSING || missingLib ? "critical" : "warning", `${problems.join(" ; ")}.`, { impact: "Images cassées sur le site.", recommendation: "Réimporter les fichiers manquants ou retirer les références.", action: { label: "Ouvrir la médiathèque", href: "/marketing/site-web/medias" } });
  return R("good", `${a.refs.VALID} référence(s) vérifiée(s), aucun fichier manquant${a.orphanFiles ? ` (${plural(a.orphanFiles, "fichier sans fiche", "fichiers sans fiche")}, voir le diagnostic)` : ""}.`);
}, { site: false });
check("media_weight", "media", "Poids et description des images", async (c) => {
  const heavy = db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND kind = 'image' AND size > 2000000").get(c.organizationId).n;
  const noAlt = db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND kind = 'image' AND TRIM(alt) = ''").get(c.organizationId).n;
  const total = db.prepare("SELECT COUNT(*) n FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND kind = 'image'").get(c.organizationId).n;
  if (!total) return R("info", "Aucune image dans la médiathèque.");
  if (heavy || noAlt) return R("warning", `${heavy ? `${plural(heavy, "image dépasse", "images dépassent")} 2 Mo. ` : ""}${noAlt ? `${plural(noAlt, "image sans texte alternatif", "images sans texte alternatif")}.` : ""}`.trim(), { impact: "Pages lentes et images inaccessibles aux lecteurs d'écran.", recommendation: "Compresser les images lourdes et renseigner leur texte alternatif.", action: { label: "Ouvrir la médiathèque", href: "/marketing/site-web/medias" } });
  return R("good", `${total} image(s) : poids raisonnable et textes alternatifs renseignés.`);
}, { site: false });

// ---------- Performance (mesures réelles ou « non mesuré ») ----------
check("response_time", "performance", "Temps de réponse", async (c) => {
  const paths = ["/", "/blog", "/catalogue"];
  const times = [];
  for (const p of paths) { const r = await probe.request(c.port, p, { host: c.host }); if (r.status === 200) times.push(r.ms); }
  if (!times.length) return R("info", "Temps de réponse non mesuré (aucune page n'a répondu 200).");
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const detail = `Médiane ${median} ms sur ${times.length} page(s), mesurée depuis le serveur lui-même (sans réseau ni navigateur).`;
  return median > 1500 ? R("critical", detail, { impact: "Pages très lentes.", recommendation: "Examiner les pages lentes et la charge du serveur." }) : median > 500 ? R("warning", detail, { recommendation: "Surveiller : la mesure exclut le temps réseau." }) : R("good", detail);
});
check("assets", "performance", "Poids des fichiers CSS et JS principaux", async () => {
  const root = path.join(__dirname, "..", "..", "..", "public");
  const files = [["css/style.css", 400000], ["css/cms.css", 300000], ["js/page-builder.js", 1500000], ["css/landing.css", 200000]];
  const rows = [];
  for (const [f, max] of files) { try { const size = fs.statSync(path.join(root, f)).size; rows.push({ f, size, over: size > max }); } catch { /* fichier absent */ } }
  const heavy = rows.filter((r) => r.over);
  const detail = rows.map((r) => `${r.f} ${Math.round(r.size / 1024)} Ko`).join(", ");
  return heavy.length ? R("warning", `Fichiers volumineux : ${heavy.map((r) => r.f).join(", ")} (${detail}).`, { impact: "Chargement plus lent (avant compression).", recommendation: "Compresser ou découper ces fichiers." }) : R("good", `Tailles avant compression : ${detail} (le serveur compresse en gzip).`);
}, { site: false });
check("unmeasured", "performance", "Requêtes lentes et erreurs serveur", async () => R("info", "Non mesuré : aucun journal des requêtes lentes ni des erreurs serveur n'est tenu par le CMS.", { recommendation: "Consulter les journaux de l'hébergeur ; une journalisation centralisée est prévue plus tard." }), { site: false });

// ---------- Intégrité (résumé ; détail dans Diagnostic) ----------
check("integrity", "database", "Références entre contenus", async () => {
  const r = require("./integrity").scan({ quick: true });
  return r.total ? R("warning", `${plural(r.total, "anomalie", "anomalies")} de références détectée(s) (${r.groups.filter((g) => g.count).map((g) => `${g.count} ${g.label.toLowerCase()}`).slice(0, 3).join(", ")}).`, { impact: "Éléments qui pointent vers des ressources supprimées.", recommendation: "Ouvrir le diagnostic pour voir le détail ; rien n'est corrigé automatiquement.", action: { label: "Ouvrir le diagnostic", href: "/marketing/site-web/outils/diagnostic" } }) : R("good", "Aucune référence brisée détectée entre menus, articles, catégories, révisions et commentaires.");
}, { site: false });

// ---------- Exécution ----------
function summarize(results) {
  const by = { good: 0, warning: 0, critical: 0, info: 0 };
  for (const r of results) by[r.status]++;
  return { ...by, overall: by.critical ? "critical" : by.warning ? "warning" : "good" };
}

runner.register("health", async (run, api) => {
  const opts = JSON.parse(run.options || "{}");
  const siteId = run.site_id;
  const urls = require("../urls");
  const site = siteId ? urls.siteInfo(siteId) : null;
  const c = { organizationId: run.organization_id, siteId, site, port: opts.port, host: site && site.host ? site.host : null };
  const list = CHECKS.filter((k) => siteId === null || k.site);
  api.setTotal(list.length);
  api.reset();
  const results = [];
  for (const k of list) {
    if (api.cancelled()) return { status: "cancelled", report: { results, summary: summarize(results), partial: true }, message: "Analyse annulée." };
    api.message(`Contrôle : ${k.title}`);
    let r;
    try { r = await k.fn(c); } catch (error) { r = R("info", `Contrôle impossible : ${runner.messageOf(error)}`, { measured: false }); }
    results.push({ id: k.id, category: k.category, title: k.title, ...r });
    api.advance({ done: 1, failed: r.status === "critical" ? 1 : 0 });
    await api.yieldTurn();
  }
  return { status: "done", report: { results, summary: summarize(results), siteId, host: c.host, at: new Date().toISOString() }, message: "Analyse terminée." };
});

function start(ctx, { siteId = null, port }) {
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "health", options: { port } });
  runner.start(run, "health");
  return run;
}

module.exports = { start, CHECKS, CATEGORIES, STATUS, summarize };
