// Santé du site → onglet « Informations » : photographie technique d'UN site, collectée à partir des vrais composants de KOLAKISA.
//
// Principes :
//  - un REGISTRE de sections (register) : chaque section déclare son identifiant, son titre, sa portée (site ou infrastructure centrale) et sa collecte.
//    Un module peut ajouter une section sans toucher à l'écran ni à la copie : tout passe par collect() ;
//  - une valeur inconnue est « Non disponible », jamais inventée ; une section qui échoue le dit (statut « unavailable ») sans bloquer les autres ;
//  - UN SEUL filtre de confidentialité (scrub) s'applique à toutes les valeurs, pour l'écran, l'API et le texte copié : jamais de secret, de clé,
//    de jeton, de mot de passe ni de chaîne de connexion ; les chemins système ne sont montrés qu'à l'équipe (jamais à un accès limité à un site) ;
//  - lecture seule : aucune écriture, aucune modification de droits, aucune requête sortante.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const v8 = require("node:v8");
const db = require("../../config/database");
const paths = require("../../config/paths");

const pkg = require("../../../package.json");
const NA = "Non disponible";
const REGISTRY = [];
const register = (section) => {
  if (!section || !/^[a-z][a-z0-9_]{1,40}$/.test(section.id || "") || typeof section.collect !== "function") throw new TypeError("Section de diagnostic invalide.");
  const i = REGISTRY.findIndex((s) => s.id === section.id);
  const entry = { order: 500, central: false, title: section.id, ...section };
  if (i >= 0) REGISTRY[i] = entry; else REGISTRY.push(entry);
};

// ---------- Confidentialité ----------
const SECRET_NAME = /(KEY|SECRET|TOKEN|PASS|PWD|DSN|CREDENTIAL|PRIVATE|SALT|AUTH)/i;
const secretValues = () => Object.entries(process.env).filter(([k, v]) => SECRET_NAME.test(k) && typeof v === "string" && v.length >= 6).map(([, v]) => v);
const PATTERNS = [
  [/\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{6,}/g, "[secret masqué]"], [/\bwhsec_[A-Za-z0-9]{4,}/g, "[secret masqué]"], [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [masqué]"],
  [/\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/gi, "[connexion masquée]@"], [/\b(password|passwd|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi, "$1=[masqué]"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(-----END [A-Z ]*PRIVATE KEY-----|$)/g, "[clé privée masquée]"],
];
function redact(value) {
  let s = String(value ?? "");
  for (const secret of secretValues()) if (s.includes(secret)) s = s.split(secret).join("[secret masqué]");
  for (const [re, to] of PATTERNS) s = s.replace(re, to);
  return s;
}
const scrub = (value) => redact(value).replace(/[\u0000-\u001f\u007f]+/g, " ").slice(0, 600);
// Chemin système : seulement pour l'équipe ; sinon un nom logique
const shownPath = (ctx, p, logical) => (ctx.showPaths ? p : logical);

// ---------- Mesure de taille (bornée et mise en cache : aucune exploration illimitée à chaque ouverture) ----------
const SIZE_TTL = 10 * 60 * 1000, MAX_ENTRIES = 40000, BUDGET_MS = 1200;
const sizeCache = new Map();
function sizeOf(dir, { skip = null } = {}) {
  const key = `${dir}|${skip ? skip.source : ""}`;
  const hit = sizeCache.get(key);
  if (hit && Date.now() - hit.at < SIZE_TTL) return hit.value;
  let value;
  try {
    if (!fs.existsSync(dir)) value = { bytes: 0, files: 0, partial: false, missing: true };
    else {
      const t0 = Date.now();
      let bytes = 0, files = 0, entries = 0, partial = false;
      const stack = [dir];
      outer: while (stack.length) {
        const d = stack.pop();
        let list;
        try { list = fs.readdirSync(d, { withFileTypes: true }); } catch { partial = true; continue; }
        for (const e of list) {
          if (++entries > MAX_ENTRIES || Date.now() - t0 > BUDGET_MS) { partial = true; break outer; }
          if (e.isSymbolicLink()) continue;
          const p = path.join(d, e.name);
          if (e.isDirectory()) { if (!(skip && d === dir && skip.test(e.name))) stack.push(p); }
          else if (e.isFile()) { try { bytes += fs.statSync(p).size; files++; } catch { partial = true; } }
        }
      }
      value = { bytes, files, partial, missing: false };
    }
  } catch { value = null; }
  sizeCache.set(key, { at: Date.now(), value });
  return value;
}
const fmtBytes = (n) => (n < 1024 ? `${n} o` : n < 1048576 ? `${(n / 1024).toFixed(1)} Ko` : n < 1073741824 ? `${(n / 1048576).toFixed(n > 10485760 ? 0 : 1)} Mo` : `${(n / 1073741824).toFixed(2)} Go`);
const fmtSize = (s) => (!s ? NA : s.missing ? "0 o (dossier absent)" : `${s.partial ? "au moins " : ""}${fmtBytes(s.bytes)} (${s.files} fichier${s.files > 1 ? "s" : ""})`);

const row = (label, value, extra = {}) => ({ label, value: value === null || value === undefined || value === "" ? NA : String(value), ...extra });
const count = (sql, ...a) => { try { return db.prepare(sql).get(...a).n; } catch { return null; } };
const accessOf = (p) => {
  if (!fs.existsSync(p)) return "Inexistant";
  const can = (m) => { try { fs.accessSync(p, m); return true; } catch { return false; } };
  return can(fs.constants.R_OK) ? (can(fs.constants.W_OK) ? "Lecture et écriture autorisées" : "Lecture seule (écriture refusée)") : "Accès refusé";
};

// ---------- Sections ----------
const siteUrlOf = (ctx) => { const s = ctx.siteId ? require("../urls").siteInfo(ctx.siteId) : null; if (s && s.base) return s.base; try { return new URL(process.env.SITE_URL).origin; } catch { return ""; } };
register({ id: "kolakisa", title: "Kolakisa", order: 10, collect: async (ctx) => {
  const settings = require("../settings");
  let lang = null, tz = null;
  try { const v = settings.readAll({ siteId: ctx.siteId }, { db, organizationId: ctx.organizationId, can: () => true, orgLevel: true }); lang = v.language.value; tz = v.timezone.value; } catch { /* réglages illisibles : non disponible */ }
  const site = ctx.siteId ? require("../urls").siteInfo(ctx.siteId) : null;
  // Le nom vient de la base (pas du cache des adresses : un site créé il y a un instant n'y figure pas encore)
  const siteName = ctx.siteId ? ((db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(ctx.siteId) || {}).name || (site && site.name) || "Site") : "";
  const env = process.env.NODE_ENV === "production" ? "Production" : process.env.NODE_ENV === "test" ? "Test" : "Développement";
  const pub = siteUrlOf(ctx);
  const sites = count("SELECT COUNT(*) n FROM mk_sites WHERE status = 'active'");
  return [
    row("Version de Kolakisa", pkg.version), row("Environnement", env), row("Langue du site", lang), row("Fuseau horaire", tz),
    row("Adresse publique", pub || "Non définie"), row("Adresse de l'administration", pub ? `${pub}/marketing` : null),
    row("Site", ctx.siteId ? `${siteName} (identifiant ${ctx.siteId})` : "Site principal"),
    row("Domaine propre", ctx.siteId ? (site && site.host ? site.host : "Aucun (pages sous /p/ du site principal)") : "Non applicable (site principal)"),
    ...(ctx.showCentral ? [row("Sites actifs sur l'installation", sites, { central: true })] : []),
    row("Mises à jour", "Par déploiement du code : aucun mécanisme de mise à jour automatique depuis le CMS"),
    row("Mode de débogage", process.env.NODE_ENV === "production" ? "Inactif (production)" : `Actif (environnement « ${env.toLowerCase()} »)`),
  ];
} });

register({ id: "repertoires", title: "Répertoires et tailles", order: 20, collect: async (ctx) => {
  const rows = [];
  const mediaDir = path.join(paths.uploadsRoot, "marketing", String(ctx.organizationId), ...(ctx.siteId ? [`site-${ctx.siteId}`] : []));
  rows.push(row("Médias de ce site", fmtSize(sizeOf(mediaDir, ctx.siteId ? {} : { skip: /^site-\d+$/ }))));
  if (ctx.showCentral) {
    const root = paths.projectRoot;
    const core = ["src", "views", "public"].map((d) => sizeOf(path.join(root, d)));
    const coreOk = core.every(Boolean);
    const coreSize = coreOk ? { bytes: core.reduce((a, b) => a + b.bytes, 0), files: core.reduce((a, b) => a + b.files, 0), partial: core.some((c) => c.partial), missing: false } : null;
    let dbBytes = null; try { dbBytes = fs.statSync(paths.dbFile).size; } catch { dbBytes = null; }
    rows.push(row("Cœur de Kolakisa (src, views, public)", fmtSize(coreSize), { central: true }), row("Base de données (fichier)", dbBytes === null ? NA : fmtBytes(dbBytes), { central: true }));
    const up = sizeOf(paths.uploadsRoot);
    rows.push(row("Fichiers envoyés (toute l'installation)", fmtSize(up), { central: true }));
    if (coreSize && up && dbBytes !== null) rows.push(row("Total mesuré (cœur + base + fichiers envoyés)", `${coreSize.partial || up.partial ? "au moins " : ""}${fmtBytes(coreSize.bytes + up.bytes + dbBytes)}`, { central: true }));
    else rows.push(row("Total mesuré", NA, { central: true }));
    rows.push(row("Emplacement des données", shownPath(ctx, paths.dataDir, "Dossier de données (chemin masqué)"), { central: true }), row("Emplacement des fichiers envoyés", shownPath(ctx, paths.uploadsRoot, "Dossier des fichiers (chemin masqué)"), { central: true }));
  }
  rows.push(row("Thèmes et extensions", "Aucun dossier : ce sont des données de la base (voir les sections correspondantes)"));
  return rows;
} });

const present = (t) => `version ${t.version || NA} · ${t.author || "auteur inconnu"} · ${t.state === "active" ? "actif" : t.state === "incompatible" ? "incompatible" : "inactif"}`;
register({ id: "theme_actif", title: "Thème actif", order: 30, collect: async (ctx) => {
  const themes = require("../themes");
  const t = themes.get(ctx.siteId, themes.activeKey(ctx.siteId));
  if (!t) return [row("Thème actif", NA)];
  return [row("Nom", t.name), row("Version", t.version), row("Auteur", t.author), row("Description", t.description), row("Thème parent", "Aucun (Kolakisa n'a pas de thèmes enfants)"),
    row("Origine", { integre: "Intégré à Kolakisa", catalogue: "Catalogue Kolakisa", paquet: "Paquet importé" }[t.source] || t.source), row("Version de l'API de thèmes", t.api),
    row("Compatibilité", t.compatible ? "Compatible avec cette version" : "Incompatible avec cette version"), row("Mises à jour automatiques", "Non applicable (un thème est mis à jour en le réinstallant)")];
} });
register({ id: "themes_inactifs", title: "Thèmes inactifs", order: 40, collect: async (ctx) => {
  const list = require("../themes").installed(ctx.siteId).filter((t) => t.state !== "active");
  return list.map((t) => row(t.name, present(t)));
}, countable: true });

const modules = () => require("../../marketing/siteModules");
function moduleRows(ctx, enabled) {
  const M = modules();
  return Object.keys(M.MODULES).map((k) => {
    const on = M.isEnabled(db, ctx.organizationId, ctx.siteId, k);
    return { k, on, def: M.MODULES[k] };
  }).filter((m) => m.on === enabled).map((m) => row(m.def.label, `${m.on ? (ctx.siteId ? "activé sur ce site" : "toujours actif (site principal)") : "désactivé sur ce site"} · module intégré à Kolakisa${m.on && !m.def.ready ? " · activé mais sans effet visible tant que sa livraison n'est pas terminée" : ""}`));
}
register({ id: "extensions_actives", title: "Extensions actives (modules)", order: 60, collect: async (ctx) => moduleRows(ctx, true), countable: true });
register({ id: "extensions_inactives", title: "Extensions inactives (modules)", order: 70, collect: async (ctx) => moduleRows(ctx, false), countable: true });

register({ id: "medias", title: "Traitement des médias", order: 80, collect: async (ctx) => {
  const variants = require("../../marketing/media/variants");
  const media = require("../../marketing/media");
  const cfg = media.uploadConfig();
  let sharpVersion = null, libvips = null;
  try { const s = require("sharp"); sharpVersion = require("sharp/package.json").version; libvips = s.versions && s.versions.vips; } catch { sharpVersion = null; }
  let works = null; try { works = await variants.selfTest(); } catch { works = false; }
  return [
    row("Moteur d'images", variants.available() ? `sharp ${sharpVersion || ""}`.trim() : "Absent : seules les images d'origine sont servies"), row("Bibliothèque libvips", libvips),
    row("Essai réel de fabrication WebP", variants.available() ? (works ? "Réussi" : "Échec") : "Non applicable (moteur absent)"),
    row("Formats d'image acceptés", "JPEG, PNG, WebP, AVIF, GIF, SVG nettoyé"), row("Variantes de largeur", `${Object.keys(variants.SIZES).length} tailles (WebP), fabriquées à la demande`),
    row("Taille maximale d'un fichier (par type, Mo)", Object.entries(cfg.limits).map(([k, v]) => `${k} ${v}`).join(", ")), row("Taille maximale d'une requête d'envoi", `${cfg.requestMax} Mo`),
    row("Fichiers par envoi simultané", "20"), row("Téléversement", "Autorisé selon les droits de l'utilisateur"),
  ];
} });

register({ id: "serveur", title: "Serveur", order: 90, central: true, collect: async (ctx) => {
  const mem = process.memoryUsage();
  const pub = siteUrlOf(ctx);
  return [
    row("Serveur d'application", `Express ${require("express/package.json").version} (Node.js)`), row("Node.js", process.version), row("Moteur JavaScript (V8)", process.versions.v8),
    row("Système", `${os.type()} ${os.release()}`), row("Architecture", `${os.arch()} (${process.platform})`), row("Processeurs", os.cpus().length),
    row("Mémoire du processus", fmtBytes(mem.rss)), row("Limite mémoire du tas V8", fmtBytes(v8.getHeapStatistics().heap_size_limit)), row("Mémoire système libre / totale", `${fmtBytes(os.freemem())} / ${fmtBytes(os.totalmem())}`),
    row("Démarré depuis", `${Math.floor(process.uptime() / 3600)} h ${Math.floor((process.uptime() % 3600) / 60)} min`), row("Charge moyenne (1 min)", os.loadavg()[0].toFixed(2)),
    row("HTTPS de l'adresse publique", pub ? (pub.startsWith("https:") ? "Oui" : "Non") : NA), row("Routes", "Gérées par l'application elle-même (aucun fichier de réécriture)"),
    row("Tâches planifiées", process.env.MARKETING_WORKER === "on" ? "Exécuteur de travaux actif" : "Exécuteur de travaux inactif (MARKETING_WORKER ≠ on)"),
    row("Connexions sortantes", "Non testées : aucune requête sortante n'est lancée depuis cet écran"),
  ];
} });

register({ id: "base_de_donnees", title: "Base de données", order: 100, central: true, collect: async () => {
  let version = null, tables = null, enc = null, journal = null, ok = "Échec";
  try { version = db.prepare("SELECT sqlite_version() v").get().v; ok = "Connectée"; } catch { ok = "Échec de la connexion"; }
  tables = count("SELECT COUNT(*) n FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
  try { enc = Object.values(db.prepare("PRAGMA encoding").get())[0]; journal = Object.values(db.prepare("PRAGMA journal_mode").get())[0]; } catch { /* non disponible */ }
  let applied = null, last = null, files = null;
  try { const r = db.prepare("SELECT COUNT(*) n, MAX(version) v FROM schema_migrations WHERE scope = 'marketing'").get(); applied = r.n; last = r.v; } catch { applied = null; }
  try { files = fs.readdirSync(path.join(paths.projectRoot, "src", "marketing", "migrations")).filter((f) => f.endsWith(".sql")).length; } catch { files = null; }
  let size = null; try { size = fs.statSync(paths.dbFile).size; } catch { size = null; }
  return [
    row("Type", "SQLite (node:sqlite)"), row("Version du serveur", version), row("Connexion", ok), row("Tables", tables), row("Taille du fichier", size === null ? NA : fmtBytes(size)),
    row("Jeu de caractères", enc), row("Mode de journal", journal),
    row("Migrations appliquées", applied === null ? NA : `${applied}${last ? ` (dernière : ${last})` : ""}`), row("Migrations livrées avec le code", files),
    row("État des migrations", applied === null || files === null ? NA : applied >= files ? "À jour" : `${files - applied} en attente`),
    row("Chaîne de connexion", "Aucune (fichier local) : jamais affichée"),
  ];
} });

const ENV_SHOWN = ["NODE_ENV", "PORT", "ALLOW_INDEXING", "MARKETING_WORKER", "TRUST_PROXY", "COOKIE_SECURE"];
const ENV_PRESENCE = ["ENCRYPTION_KEY", "SESSION_SECRET", "SMTP_HOST", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SITE_URL", "DATA_DIR", "UPLOADS_DIR"];
register({ id: "constantes", title: "Constantes et configuration", order: 110, central: true, collect: async (ctx) => {
  const rows = ENV_SHOWN.filter((k) => process.env[k] !== undefined).map((k) => row(k, process.env[k]));
  let origin = ""; try { origin = new URL(process.env.SITE_URL).origin; } catch { origin = ""; }
  rows.push(row("SITE_URL (origine seulement)", origin || "Non définie"));
  for (const k of ENV_PRESENCE.filter((x) => x !== "SITE_URL")) rows.push(row(k, process.env[k] ? "Définie (valeur jamais affichée)" : "Non définie"));
  rows.push(row("Mise en cache des pages publiques", "Désactivée (en-tête no-store)"), row("Limite de corps JSON des pages", "1 Mo"));
  return rows;
} });

register({ id: "droits_fichiers", title: "Droits des fichiers système", order: 120, central: true, collect: async (ctx) => {
  const entries = [["Dossier de données", paths.dataDir], ["Base de données (fichier)", paths.dbFile], ["Dossier des fichiers envoyés", paths.uploadsRoot], ["Médias marketing", path.join(paths.uploadsRoot, "marketing")], ["Dossier public (code)", path.join(paths.projectRoot, "public")]];
  return entries.map(([label, p]) => row(shownPath(ctx, `${label} — ${p}`, label), accessOf(p)));
} });

// ---------- Collecte ----------
// ctx : { organizationId, siteId, showPaths, showCentral }. Résultat : sections filtrées par portée, valeurs nettoyées.
async function collect(ctx) {
  const out = [];
  for (const s of REGISTRY.slice().sort((a, b) => a.order - b.order)) {
    if (s.central && !ctx.showCentral) continue;
    let rows = [], status = "ok", note = "";
    try {
      const got = await Promise.race([s.collect(ctx), new Promise((_, rej) => setTimeout(() => rej(new Error("délai dépassé")), 4000).unref())]);
      rows = got.filter((r) => ctx.showCentral || !r.central).map((r) => ({ label: scrub(r.label), value: scrub(r.value) }));
    } catch (error) { status = "unavailable"; note = `Collecte impossible : ${scrub(error && error.message)}`; }
    out.push({ id: s.id, title: s.title, count: s.countable ? rows.length : null, status, note, rows });
  }
  return { at: new Date().toISOString(), siteId: ctx.siteId, sections: out };
}

// Texte à copier : exactement les sections et valeurs affichées (déjà nettoyées), en blocs lisibles
function toText(info, { siteName = "" } = {}) {
  const lines = [`### Informations techniques Kolakisa${siteName ? ` — ${siteName}` : ""} ###`, `Relevé du ${info.at}`, ""];
  for (const s of info.sections) {
    lines.push(`### ${s.title}${s.count !== null ? ` (${s.count})` : ""} ###`);
    if (s.status !== "ok") lines.push(s.note);
    else if (!s.rows.length) lines.push("(aucun)");
    for (const r of s.rows) lines.push(`${r.label}: ${r.value}`);
    lines.push("");
  }
  return redact(lines.join("\n"));
}
const clearSizeCache = () => sizeCache.clear();

module.exports = { register, collect, toText, scrub, sizeOf, clearSizeCache, REGISTRY, NA };
