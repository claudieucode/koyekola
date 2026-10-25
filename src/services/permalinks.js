// KOLAKISA — moteur de PERMALIENS (paramètres → Permaliens). UN SEUL moteur, partagé par tous les sites ; la configuration appartient à chaque site.
//   - structure des adresses d'articles (à la WordPress : %year% %monthnum% %day% %hour% %minute% %second% %post_id% %postname% %category% %author%) ;
//   - préfixes facultatifs des archives de catégories et d'étiquettes ;
//   - génération (postPath, termBase), résolution (resolve) et intergiciel (middleware) : les liens générés sont EXACTEMENT ceux que le routeur sert ;
//   - protection des adresses existantes : l'ancienne adresse (« /blog/<adresse> », ancienne structure, « ?p=<id> ») est reconnue et redirigée (301) vers
//     l'adresse canonique CALCULÉE à chaque demande (jamais de chaîne, jamais de table de redirections massive, jamais de boucle).
// Périmètre : une structure s'applique aux articles servis par le DOMAINE d'un site (config du site) ou, sinon, par le domaine principal (config du site principal).
// Les pages (/p/<adresse>, racine d'un domaine), les formations (/cours/<adresse>) et les routes système gardent leur propre système : jamais touchés ici.
// Stockage : mk_settings (clés « permalinks.<main|site_N>.<champ> »).
const db = require("../config/database");
const { slugify } = require("../utils/format");

const DEFAULT_STRUCTURE = "/blog/%postname%"; // l'adresse historique de Kolakisa : aucune adresse publiée ne change tant que rien n'est réglé
const PLAIN = "?p=%post_id%";
const MAX_LEN = 120, MAX_SEGMENTS = 6, MAX_PREVIOUS = 5, MAX_PREFIX = 40;

// Balises : exemple, rôle, motif de reconnaissance
const TAGS = {
  year: { label: "Année", example: "2026", re: "\\d{4}", help: "Année de publication, sur 4 chiffres." },
  monthnum: { label: "Mois", example: "10", re: "\\d{2}", help: "Mois de publication, sur 2 chiffres (01 à 12)." },
  day: { label: "Jour", example: "23", re: "\\d{2}", help: "Jour de publication, sur 2 chiffres." },
  hour: { label: "Heure", example: "14", re: "\\d{2}", help: "Heure de publication (00 à 23)." },
  minute: { label: "Minute", example: "05", re: "\\d{2}", help: "Minute de publication." },
  second: { label: "Seconde", example: "09", re: "\\d{2}", help: "Seconde de publication." },
  post_id: { label: "Identifiant", example: "123", re: "\\d{1,9}", help: "Numéro unique de l'article." },
  postname: { label: "Titre", example: "exemple-article", re: "[a-z0-9][a-z0-9-]*", help: "Adresse (slug) de l'article, tirée de son titre." },
  category: { label: "Catégorie", example: "actualites", re: "[a-z0-9][a-z0-9-]*(?:/[a-z0-9][a-z0-9-]*)*", help: "Catégorie principale ; une catégorie imbriquée donne « parent/enfant » ; sans catégorie : « sans-categorie »." },
  author: { label: "Auteur", example: "claire", re: "[a-z0-9][a-z0-9_-]*", help: "Nom de l'auteur, mis en forme comme une adresse ; sans auteur : « auteur »." },
};
const TAG_NAMES = Object.keys(TAGS);
const PRESETS = [
  { key: "plain", label: "Simple", structure: PLAIN, help: "Adresse technique avec le numéro de l'article." },
  { key: "day", label: "Date et titre", structure: "/%year%/%monthnum%/%day%/%postname%/", help: "Année, mois, jour et titre." },
  { key: "month", label: "Mois et titre", structure: "/%year%/%monthnum%/%postname%/", help: "Année, mois et titre." },
  { key: "numeric", label: "Numérique", structure: "/archives/%post_id%", help: "Le numéro de l'article après /archives/." },
  { key: "postname", label: "Titre de la publication", structure: "/%postname%/", help: "Le titre seul : le plus lisible, recommandé pour le référencement." },
  { key: "blog", label: "Blog (adresse historique de Kolakisa)", structure: DEFAULT_STRUCTURE, help: "/blog/ puis le titre : les adresses existantes ne changent pas." },
];
const presetOf = (structure) => (PRESETS.find((p) => p.structure === structure) || { key: "custom" }).key;

// ---------- Configuration par site ----------
const scopeKey = (siteId) => (siteId ? `site_${Number(siteId)}` : "main");
const orgId = (ctx) => (ctx && ctx.organizationId) || (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;
let memo = new Map();
const invalidate = () => { memo = new Map(); };
function readRaw(siteId) {
  const k = scopeKey(siteId);
  if (memo.has(k)) return memo.get(k);
  // Base pas encore migrée (tables des réglages absentes) : structure par défaut plutôt qu'une exception qui viderait silencieusement les listes d'articles
  let rows = [];
  try { const org = orgId(); rows = org ? db.prepare("SELECT key, value FROM mk_settings WHERE organization_id = ? AND key LIKE ?").all(org, `permalinks.${k}.%`) : []; } catch (e) { if (!/no such table/i.test(String(e.message))) throw e; return {}; } // pas mémorisé : la base peut être migrée ensuite
  const m = Object.fromEntries(rows.map((r) => [r.key.slice(`permalinks.${k}.`.length), r.value]));
  memo.set(k, m);
  return m;
}
function get(siteId = null) {
  const m = readRaw(siteId);
  let previous = [];
  try { previous = JSON.parse(m.previous || "[]").filter((s) => typeof s === "string"); } catch { previous = []; }
  return { structure: m.structure || DEFAULT_STRUCTURE, categoryBase: m.category_base || "", tagBase: m.tag_base || "", previous, custom: Boolean(m.structure || m.category_base || m.tag_base) };
}
function put(siteId, fields, ctx) {
  const org = orgId(ctx);
  if (!org) throw new Error("Aucune organisation.");
  const set = db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')");
  const del = db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?");
  for (const [f, v] of Object.entries(fields)) {
    const key = `permalinks.${scopeKey(siteId)}.${f}`;
    if (v === "" || v === null || v === undefined) del.run(org, key); else set.run(org, key, String(v));
  }
  invalidate();
}

// ---------- Validation ----------
const reserved = (seg) => require("./urls").isReserved(seg);
const tokenRe = /%([^%/]*)%/g;
// Normalise la partie littérale d'un segment : minuscules, sans accents, [a-z0-9_-] seulement
const literal = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/-{2,}/g, "-");
function validateStructure(input) {
  const raw = String(input ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  const errors = [];
  if (!raw) return { ok: false, errors: ["La structure est vide : saisissez-en une, ou choisissez un des réglages courants."] };
  if (raw === PLAIN) return { ok: true, value: PLAIN, plain: true, errors: [], tags: ["post_id"] };
  if (raw.length > MAX_LEN) return { ok: false, errors: [`La structure est trop longue (${MAX_LEN} caractères au plus).`] };
  if (/[?#\\]/.test(raw)) errors.push("Les caractères ? # et \\ ne sont pas autorisés dans une structure.");
  if (/^https?:\/\//i.test(raw)) errors.push("Saisissez seulement le chemin (par exemple /%year%/%postname%/), sans le domaine.");
  // Balises : toutes connues, bien formées, une seule fois chacune
  const withoutTokens = raw.replace(tokenRe, "");
  if (withoutTokens.includes("%")) errors.push("Une balise est mal formée : chaque balise s'écrit entre deux signes % (par exemple %postname%).");
  const used = [];
  for (const m of raw.matchAll(tokenRe)) {
    if (!TAGS[m[1]]) errors.push(`Balise inconnue : %${m[1].slice(0, 30)}%. Balises disponibles : ${TAG_NAMES.map((t) => `%${t}%`).join(", ")}.`);
    else if (used.includes(m[1])) errors.push(`La balise %${m[1]}% apparaît plusieurs fois : une seule fois suffit.`);
    else used.push(m[1]);
  }
  if (!used.includes("post_id") && !used.includes("postname") && !errors.length) errors.push("La structure doit contenir %postname% ou %post_id% : sans eux, plusieurs articles auraient la même adresse.");
  if (errors.length) return { ok: false, errors };
  // Normalisation : « / » initial, segments sans doublon, partie littérale simplifiée (accents, espaces, caractères spéciaux)
  const trailing = /\/$/.test(raw);
  const segs = raw.split("/").filter((s) => s !== "").map((seg) => {
    const out = [];
    let last = 0;
    for (const m of seg.matchAll(tokenRe)) { out.push(literal(seg.slice(last, m.index))); out.push(m[0]); last = m.index + m[0].length; }
    out.push(literal(seg.slice(last)));
    return out.join("");
  });
  if (segs.some((s) => s === "" || s === "-")) return { ok: false, errors: ["Un segment de la structure est vide une fois nettoyé (accents, espaces et caractères spéciaux sont simplifiés)."] };
  if (segs.length > MAX_SEGMENTS) return { ok: false, errors: [`${MAX_SEGMENTS} segments au plus.`] };
  for (const seg of segs) if (/%[a-z_]+%%[a-z_]+%/.test(seg)) return { ok: false, errors: ["Séparez deux balises voisines par un tiret ou une barre (par exemple %year%-%monthnum%)."] };
  // Le premier segment ne peut pas être une route du site (sauf « blog » seul : l'adresse historique)
  const first = segs[0];
  if (!/%/.test(first) && reserved(first) && first !== "blog") return { ok: false, errors: [`« ${first} » est une adresse réservée du site : choisissez un autre premier segment.`] };
  if (first === "blog" && segs.length === 1) return { ok: false, errors: ["« /blog » seul est la liste des articles : ajoutez %postname% ou %post_id%."] };
  if (segs.length >= 2 && /^(categorie|etiquette|auteur|commentaires|feed)$/.test(segs[1]) && first === "blog") return { ok: false, errors: [`« /blog/${segs[1]} » est réservé aux archives du blog.`] };
  const value = `/${segs.join("/")}${trailing ? "/" : ""}`;
  const tags = [...value.matchAll(tokenRe)].map((m) => m[1]);
  const warnings = [];
  if (tags.includes("category")) warnings.push("L'adresse d'un article change quand sa catégorie principale change (l'ancienne adresse redirige automatiquement).");
  if (tags.includes("author")) warnings.push("L'adresse d'un article change si son auteur change (l'ancienne adresse redirige automatiquement).");
  if (/%(hour|minute|second)%/.test(value)) warnings.push("L'heure, la minute et la seconde rendent l'adresse longue : peu utile pour le référencement.");
  return { ok: true, value, plain: false, tags, trailingSlash: trailing, errors: [], warnings };
}
// Préfixe de catégories / d'étiquettes : 1 ou 2 segments [a-z0-9-], vide = valeur par défaut de Kolakisa
function validatePrefix(input, label, structure) {
  const v = String(input ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().replace(/^\/+|\/+$/g, "");
  if (!v) return { ok: true, value: "" };
  if (/[?#\\%\s]/.test(v)) return { ok: false, error: `${label} : lettres, chiffres et tirets seulement, séparés au besoin par une barre (par exemple sujets).` };
  const segs = v.split("/").map((x) => literal(x).replace(/^-+|-+$/g, "")).filter(Boolean);
  const n = segs.join("/");
  if (!segs.length || segs.some((s) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) return { ok: false, error: `${label} : lettres, chiffres et tirets seulement (par exemple sujets ou blog-sujets).` };
  if (segs.length > 2 || n.length > MAX_PREFIX) return { ok: false, error: `${label} : 2 segments et ${MAX_PREFIX} caractères au plus.` };
  if (reserved(segs[0]) || /^(archives|page)$/.test(segs[0])) return { ok: false, error: `${label} : « ${segs[0]} » est une adresse réservée du site, choisissez-en une autre.` };
  const st = structure && !structure.plain ? structure.value : null;
  if (st) { const f = st.split("/").filter(Boolean)[0]; if (f && !/%/.test(f) && f === segs[0]) return { ok: false, error: `${label} : « ${segs[0]} » est déjà le début de la structure des articles : l'adresse serait ambiguë.` }; }
  return { ok: true, value: segs.join("/") };
}

// ---------- Génération ----------
const pad = (n) => String(n).padStart(2, "0");
function dateParts(post) {
  const s = String(post.published_at || post.created_at || "").replace("T", " ");
  const m = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}):(\d{2}))?/.exec(s);
  if (!m) { const d = new Date(); return { year: String(d.getUTCFullYear()), monthnum: pad(d.getUTCMonth() + 1), day: pad(d.getUTCDate()), hour: pad(d.getUTCHours()), minute: pad(d.getUTCMinutes()), second: pad(d.getUTCSeconds()) }; }
  return { year: m[1], monthnum: m[2], day: m[3], hour: m[4] || "00", minute: m[5] || "00", second: m[6] || "00" };
}
// Règle documentée de %category% : catégorie PRINCIPALE de l'article (sinon la première par position, puis par nom) ; une catégorie imbriquée donne « parent/enfant »
function categoryPath(postId) {
  const row = db.prepare("SELECT t.id, t.slug FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = 'post' AND r.content_id = ? AND t.taxonomy = 'category' ORDER BY r.is_primary DESC, r.position, t.name COLLATE NOCASE LIMIT 1").get(postId);
  if (!row) return "sans-categorie";
  const up = require("./taxonomy").ancestors(row.id).map((a) => a.slug);
  return [...up, row.slug].join("/");
}
const authorSlug = (post) => {
  const u = post.author_id ? db.prepare("SELECT username FROM users WHERE id = ?").get(post.author_id) : null;
  return (u && slugify(u.username)) || "auteur";
};
const urlsSvc = () => require("./urls");
// Site dont la configuration s'applique : celui qui sert l'article sur SON domaine ; sinon le site principal (null)
const homeOf = (postId) => urlsSvc().publicHomeOf("post", postId); // site qui sert l'article sur SON domaine
// Site propriétaire d'un contenu (rattachement), avec ou sans domaine propre ; null = site principal. C'est sa configuration qui s'applique.
const ownerOf = (type, id) => { try { const r = db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = ? AND content_id = ?").get(type, id); return r ? r.site_id : null; } catch { return null; } };
// Sites SANS domaine propre qui ont une configuration de permaliens : leurs articles sont servis sous le domaine principal, avec leur propre structure
function domainlessConfigured() {
  let ids = [];
  try { ids = db.prepare("SELECT DISTINCT key FROM mk_settings WHERE key LIKE 'permalinks.site_%'").all().map((r) => { const m = /^permalinks\.site_(\d+)\./.exec(r.key); return m ? Number(m[1]) : null; }).filter(Boolean); } catch { ids = []; }
  return [...new Set(ids)].filter((id) => { const i = urlsSvc().siteInfo(id); return i && !i.base; });
}
// Configurations à essayer pour une requête : le site du domaine demandé ; sur le domaine principal, le principal puis les sites sans domaine configurés
const candidates = (hostSite) => (hostSite ? [hostSite.id] : [null, ...domainlessConfigured()]);
const nameOf = (post) => (homeOf(post.id) ? urlsSvc().addressOf("post", post) : post.slug);
function buildPath(structure, post, name) {
  if (structure === PLAIN) return `/?p=${post.id}`;
  const d = dateParts(post);
  const trailing = structure.endsWith("/");
  const out = structure.replace(tokenRe, (_, t) => {
    if (t in d) return d[t];
    if (t === "post_id") return String(post.id);
    if (t === "postname") return name;
    if (t === "category") return categoryPath(post.id);
    if (t === "author") return authorSlug(post);
    return "";
  });
  return out.replace(/\/{2,}/g, "/") || (trailing ? "/" : "");
}
const legacyPath = (post) => `/blog/${nameOf(post)}`;
// Adresse publique (chemin) d'un article, selon la structure de SON site. Une adresse qui entrerait en collision avec une route du site ou une page
// du site (premier segment variable) retombe sur l'adresse historique /blog/<adresse> : l'article reste toujours joignable.
const NEEDED = ["id", "slug", "published_at", "created_at", "author_id"];
// Une ligne partielle (quelques colonnes seulement) est relue en entier : la date, l'auteur et la catégorie viennent toujours de l'article réel
function full(post) {
  if (post && NEEDED.every((k) => Object.hasOwn(post, k))) return post;
  const row = post && post.id ? db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(post.id)) : post && post.slug ? db.prepare("SELECT * FROM posts WHERE slug = ?").get(String(post.slug)) : null;
  return row || post;
}
function postPath(input, opts = {}) {
  const owner = opts.siteId !== undefined ? opts.siteId : (input && input.id ? ownerOf("post", input.id) : null);
  const cfg = opts.config || get(owner || null);
  const post = cfg.structure === DEFAULT_STRUCTURE ? input : full(input);
  const name = nameOf(post);
  if (cfg.structure === DEFAULT_STRUCTURE) return `/blog/${name}`;
  const p = buildPath(cfg.structure, post, name);
  if (collides(p, cfg.structure, homeOf(post.id) || null)) return `/blog/${name}`;
  return p;
}
function collides(path, structure, home) {
  if (structure === PLAIN) return false;
  const first = String(path).split("/").filter(Boolean)[0] || "";
  const structFirst = structure.split("/").filter(Boolean)[0] || "";
  if (!/%/.test(structFirst)) return false; // premier segment littéral : déjà validé (jamais réservé)
  if (reserved(first.toLowerCase())) return true;
  if (home) { try { if (db.prepare("SELECT 1 FROM mk_landing_pages WHERE site_id = ? AND slug = ? AND archived_at IS NULL").get(home, first)) return true; } catch { /* table absente */ } }
  return false;
}

// ---------- Préfixes des archives ----------
const DEFAULT_BASES = { category: "/blog/categorie", tag: "/blog/etiquette" };
function baseFor(key, siteId = null) {
  const cfg = get(siteId || null);
  const custom = key === "category" ? cfg.categoryBase : key === "tag" ? cfg.tagBase : "";
  return custom ? `/${custom}` : null;
}
// Base d'un terme : la configuration du site qui le sert sur son domaine, sinon du principal ; sinon la base par défaut (env ou historique)
function termBase(term, defaultBase) {
  const owner = term && term.id ? ownerOf("term", term.id) : null;
  return baseFor(term.taxonomy, owner) || defaultBase;
}

// ---------- Résolution ----------
const compiled = new Map();
function compile(structure) {
  if (compiled.has(structure)) return compiled.get(structure);
  const segs = structure.split("/").filter(Boolean);
  const body = segs.map((seg) => {
    let out = "", last = 0;
    for (const m of seg.matchAll(tokenRe)) { out += seg.slice(last, m.index).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); out += `(?<${m[1]}>${TAGS[m[1]].re})`; last = m.index + m[0].length; }
    return out + seg.slice(last).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  const re = new RegExp(`^/${body}/?$`);
  compiled.set(structure, re);
  return re;
}
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
// Cherche l'article désigné par un chemin selon UNE structure ; ne vérifie PAS l'état (publié ou non) : l'appelant décide
function lookup(path, structure, hostSite, cfgSite = hostSite ? hostSite.id : null) {
  if (structure === PLAIN) return null;
  const m = compile(structure).exec(path);
  if (!m) return null;
  const g = m.groups || {};
  let row = null;
  if (g.post_id) row = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(g.post_id));
  else if (g.postname && SLUG.test(g.postname)) { const r = urlsSvc().resolvePost(g.postname, hostSite || null); row = r ? r.row : null; }
  if (!row) return null;
  // L'article doit être servi par CE domaine (jamais le contenu d'un autre site)
  // Servi par CE domaine, et propriétaire = le site dont c'est la structure (un article d'un autre site n'est jamais reconnu)
  if ((hostSite ? hostSite.id : null) !== (homeOf(row.id) || null)) return null;
  if ((ownerOf("post", row.id) || null) !== (cfgSite || null)) return null;
  return row;
}
const withQuery = (path, req) => { const i = req.originalUrl.indexOf("?"); const q = i >= 0 ? req.originalUrl.slice(i) : ""; return `${path}${path.includes("?") ? q.replace(/^\?/, "&") : q}`; };
const isRead = (req) => req.method === "GET" || req.method === "HEAD";
const NOT_POSTS = /^\/blog\/(categorie|etiquette|auteur|commentaires|feed)(\/|$)/;

// Article public (publié, non supprimé) ? Les brouillons ne déclenchent jamais de redirection (rien n'est révélé) ; le routeur du blog répond comme avant.
const live = (row) => row && row.published && !row.deleted_at;

function middleware(req, res, next) {
  if (!isRead(req)) return next();
  try {
    const hostSite = req.kwSite || null;
    const hostId = hostSite ? hostSite.id : null;
    const cands = candidates(hostSite);
    const cfgs = cands.map((id) => ({ id, cfg: get(id) }));
    const path = req.path;
    // 1. Adresse simple « /?p=<id> » : l'article est cherché dans le périmètre du domaine ; sa structure est celle de SON site
    if (path === "/" && /^\d{1,9}$/.test(String(req.query.p || ""))) {
      const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(req.query.p));
      if (row && (homeOf(row.id) || null) === hostId) {
        const owner = ownerOf("post", row.id) || null;
        const cfg = get(owner);
        if (cfg.structure === PLAIN) { const q = new URLSearchParams(); for (const [k, v] of Object.entries(req.query)) if (k !== "p" && typeof v === "string") q.set(k, v); req.url = `/blog/${nameOf(row)}${q.toString() ? `?${q}` : ""}`; return next(); }
        if (live(row)) return res.redirect(301, postPath(row, { siteId: owner, config: cfg }));
      }
      return next();
    }
    // 2. Archives : préfixe de catégories / d'étiquettes (du domaine, ou du principal et des sites sans domaine)
    for (const key of ["category", "tag"]) {
      const std = DEFAULT_BASES[key];
      for (const { id, cfg } of cfgs) {
        const custom = key === "category" ? cfg.categoryBase : cfg.tagBase;
        if (!custom) continue;
        const base = `/${custom}`;
        if (path.startsWith(`${base}/`)) { const m = /^\/([a-z0-9][a-z0-9-]*)\/?$/.exec(path.slice(base.length)); if (m) { req.url = withQuery(`${std}/${m[1]}`, req); return next(); } }
        if (path.startsWith(`${std}/`)) {
          const m = /^\/([a-z0-9][a-z0-9-]*)\/?$/.exec(path.slice(std.length));
          const term = m ? urlsSvc().resolveTerm(key, m[1], hostSite) : null;
          if (term && (hostSite ? id === hostId : (ownerOf("term", term.id) || null) === (id || null))) return res.redirect(301, withQuery(`${base}/${m[1]}`, req));
        }
      }
    }
    // 3. Adresse historique /blog/<adresse> quand la structure du site propriétaire est autre
    let m;
    if ((m = /^\/blog\/([a-z0-9][a-z0-9-]*)\/?$/.exec(path)) && !NOT_POSTS.test(path)) {
      const found = urlsSvc().resolvePost(m[1], hostSite);
      const row = found && found.row;
      if (row && live(row) && (homeOf(row.id) || null) === hostId) {
        const owner = ownerOf("post", row.id) || null;
        const cfg = get(owner);
        if (cfg.structure !== DEFAULT_STRUCTURE) { const target = postPath(row, { siteId: owner, config: cfg }); if (target !== path && target !== `${path}/`) return res.redirect(301, withQuery(target, req)); }
      }
      return next();
    }
    // 4. Structure du site (ou ancienne structure) : l'article est servi par le routeur du blog, ou redirigé vers son adresse canonique
    if (!cfgs.some(({ cfg }) => cfg.structure !== DEFAULT_STRUCTURE && cfg.structure !== PLAIN || cfg.previous.length)) return next();
    if (path === "/" || /^\/(p|cours|catalogue|marketing|formateur|api|uploads|css|js|img|fonts|connexion|inscription)(\/|$)/.test(path) || path.includes(".")) return next();
    const rooted = path.split("/").filter(Boolean).length === 1;
    // Sur le domaine d'un site, une PAGE de ce site à cette adresse l'emporte toujours
    if (hostId && rooted) { const pg = urlsSvc().resolve(path, { hostSite }); if (pg.type === "page" && pg.state === "live") return next(); }
    const first = path.split("/").filter(Boolean)[0] || "";
    for (const { id, cfg } of cfgs) {
      for (const structure of [cfg.structure, ...cfg.previous].filter((x) => x !== PLAIN && x !== DEFAULT_STRUCTURE)) {
        if (/%/.test(structure.split("/").filter(Boolean)[0] || "") && reserved(first.toLowerCase())) continue;
        const row = lookup(path, structure, hostSite, id);
        if (!row) continue;
        const canonical = postPath(row, { siteId: id, config: cfg });
        if (live(row)) {
          if (canonical !== path) return res.redirect(301, withQuery(canonical, req));
          req.url = withQuery(`/blog/${nameOf(row)}`, req);
          return next();
        }
        // Brouillon / programmé / corbeille : le routeur du blog décide (aperçu du formateur, sinon 404) — seulement à l'adresse canonique
        if (canonical === path) { req.url = withQuery(`/blog/${nameOf(row)}`, req); return next(); }
        return next();
      }
    }
  } catch (error) { console.error("[permaliens]", error.message); }
  next();
}
// Article désigné par un chemin selon la structure du site (ou une ancienne) — pour le moteur d'adresses (résolution, trace) ; null sinon
function rowForPath(path, hostSite) {
  try {
    for (const id of candidates(hostSite)) {
      const cfg = get(id);
      for (const st of [cfg.structure, ...cfg.previous]) {
        if (st === DEFAULT_STRUCTURE || st === PLAIN) continue;
        const sf = st.split("/").filter(Boolean)[0] || "", f = path.split("/").filter(Boolean)[0] || "";
        if (/%/.test(sf) && reserved(f.toLowerCase())) continue;
        const row = lookup(path, st, hostSite || null, id);
        if (row) return row;
      }
    }
  } catch { /* structure illisible : résolution historique */ }
  return null;
}
// L'adresse est-elle un permalien actif d'un article en ligne ? (la normalisation des adresses ne doit pas la réécrire)
function owns(path, hostSite) {
  try {
    for (const id of candidates(hostSite || null)) {
      const cfg = get(id);
      if (cfg.structure === DEFAULT_STRUCTURE || cfg.structure === PLAIN) continue;
      const row = lookup(path, cfg.structure, hostSite || null, id);
      if (live(row) && postPath(row, { siteId: id, config: cfg }) === path) return true;
    }
  } catch { /* sans effet */ }
  return false;
}

// ---------- Aperçu, impact, conflits ----------
// Articles dont CE site est propriétaire (null = site principal : aucun rattachement)
const ownedBy = (siteId) => (siteId ? { sql: "EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = p.id AND cs.site_id = ?)", params: [Number(siteId)] } : { sql: "NOT EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = p.id)", params: [] });
const sampleOf = (siteId) => {
  const scope = ownedBy(siteId);
  const row = db.prepare(`SELECT p.* FROM posts p WHERE p.published = 1 AND p.deleted_at IS NULL AND ${scope.sql} ORDER BY p.published_at DESC LIMIT 1`).get(...scope.params);
  if (row) return { post: row, real: true };
  const d = new Date();
  const iso = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  return { post: { id: 123, slug: "exemple-article", title: "Exemple d'article", published_at: iso, created_at: iso, author_id: null }, real: false };
};
// Articles de ce site (ou du principal) : publiés et non supprimés
function livePosts(siteId, limit = 5000) {
  const scope = ownedBy(siteId);
  return db.prepare(`SELECT p.* FROM posts p WHERE p.published = 1 AND p.deleted_at IS NULL AND ${scope.sql} ORDER BY p.id LIMIT ?`).all(...scope.params, limit);
}
// Effet d'un changement : combien d'adresses publiées changent, redirections manuelles en conflit, articles qui retombent sur /blog/ (collision)
function impact(siteId, next) {
  const cur = get(siteId || null);
  const posts = livePosts(siteId);
  let changed = 0, collisions = 0;
  const examples = [];
  const manual = new Map();
  try { for (const r of db.prepare("SELECT source_path, target FROM seo_redirects WHERE enabled = 1").all()) manual.set(String(r.source_path).replace(/\/+$/, "") || "/", r.target); } catch { /* table absente */ }
  const conflicts = [];
  for (const p of posts) {
    const before = postPath(p, { siteId: siteId || null, config: cur });
    const after = postPath(p, { siteId: siteId || null, config: next });
    if (after !== before) { changed++; if (examples.length < 4) examples.push({ title: p.title, before, after }); }
    if (next.structure !== DEFAULT_STRUCTURE && after === `/blog/${nameOf(p)}` && buildPath(next.structure, p, nameOf(p)) !== after) collisions++;
    const key = after.split("?")[0].replace(/\/+$/, "") || "/";
    if (manual.has(key) && conflicts.length < 8) conflicts.push({ path: after, target: manual.get(key) });
  }
  return { total: posts.length, changed, examples, collisions, conflicts };
}

// ---------- Enregistrement ----------
// input : { structure, category_base, tag_base } (valeurs brutes) ; renvoie { ok, errors[], warnings[], impact, confirmRequired?, saved? }
function plan(siteId, input) {
  const errors = [], warnings = [];
  const st = validateStructure(input.structure);
  if (!st.ok) errors.push(...st.errors); else warnings.push(...(st.warnings || []));
  const base = st.ok ? st : null;
  const cat = validatePrefix(input.category_base, "Préfixe des catégories", base);
  const tag = validatePrefix(input.tag_base, "Préfixe des étiquettes", base);
  if (!cat.ok) errors.push(cat.error);
  if (!tag.ok) errors.push(tag.error);
  if (cat.ok && tag.ok && cat.value && cat.value === tag.value) errors.push("Les préfixes des catégories et des étiquettes doivent être différents.");
  if (errors.length) return { ok: false, errors, warnings };
  const next = { structure: st.value, categoryBase: cat.value, tagBase: tag.value, previous: get(siteId || null).previous };
  const im = impact(siteId, next);
  if (im.conflicts.length) return { ok: false, errors: [`Des redirections manuelles existent déjà sur ${im.conflicts.length > 1 ? "des adresses que cette structure utiliserait" : "une adresse que cette structure utiliserait"} (${im.conflicts.map((c) => c.path).slice(0, 3).join(", ")}) : elles créeraient des boucles. Supprimez-les ou modifiez-les dans SEO → Redirections avant de changer la structure.`], warnings, impact: im };
  return { ok: true, next, impact: im, warnings, errors: [] };
}
function save(siteId, input, { ctx = null, confirm = false, actor = null } = {}) {
  const p = plan(siteId, input);
  if (!p.ok) return p;
  const cur = get(siteId || null);
  const same = p.next.structure === cur.structure && p.next.categoryBase === cur.categoryBase && p.next.tagBase === cur.tagBase;
  if (same) return { ...p, saved: false, unchanged: true };
  // Changement qui modifie des adresses déjà publiées : confirmation explicite après explication
  if (p.impact.changed > 0 && !confirm) return { ...p, ok: false, confirmRequired: true };
  const previous = cur.structure !== p.next.structure && cur.structure !== PLAIN ? [cur.structure, ...cur.previous.filter((s) => s !== cur.structure)].filter((s) => s !== p.next.structure).slice(0, MAX_PREVIOUS) : cur.previous.filter((s) => s !== p.next.structure);
  db.exec("BEGIN");
  try {
    put(siteId || null, { structure: p.next.structure === DEFAULT_STRUCTURE ? "" : p.next.structure, category_base: p.next.categoryBase, tag_base: p.next.tagBase, previous: previous.length ? JSON.stringify(previous) : "" }, ctx);
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); invalidate(); throw e; }
  try { require("./urls").invalidateSites(); } catch { /* cache d'hôtes : sans effet ici */ }
  try { require("./auditLog").record(actor || (ctx ? { id: ctx.userId } : null), { action: "settings.permalinks", resourceType: "settings", summary: `Permaliens modifiés (${siteId ? `site n° ${siteId}` : "site principal"}) : ${cur.structure} → ${p.next.structure}`, details: { site: siteId || null, before: cur.structure, after: p.next.structure, changed: p.impact.changed } }); } catch { /* journal indisponible */ }
  // Relecture depuis la source persistante : la valeur confirmée est celle qui est réellement enregistrée
  return { ...p, saved: true, config: get(siteId || null) };
}

module.exports = { ownerOf, rowForPath, TAGS, TAG_NAMES, PRESETS, PLAIN, DEFAULT_STRUCTURE, DEFAULT_BASES, presetOf, get, save, plan, validateStructure, validatePrefix, postPath, termBase, baseFor, buildPath, sampleOf, impact, livePosts, middleware, owns, invalidate, lookup, categoryPath, nameOf, homeOf };
