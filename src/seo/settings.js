// Réglages SEO centraux (Mon espace → SEO → Réglages). Chaque réglage a un type, une validation et une valeur par défaut
// qui reproduit exactement le comportement du site avant le SEO CORE : sans réglage enregistré, rien ne change.
const { db, logChange } = require("./store");
const { unknownVariables } = require("./templates");

const SAFE_PATH = /^\/uploads\/thumbnails\/[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i;
const HTTPS_URL = /^https:\/\/[^\s"'<>]{3,300}$/i;

// group : section de la page Réglages ; vars : variables autorisées dans un modèle
const FIELDS = {
  site_name: { group: "site", label: "Nom du site", type: "text", max: 60, required: true, default: "KOLAKISA" },
  title_separator: { group: "site", label: "Séparateur des titres", type: "choice", choices: [" · ", " | ", " — ", " - "], default: " · " },
  title_template: { group: "site", label: "Modèle du titre des pages", type: "template", max: 120, vars: ["title", "sep", "site_name"], required: true, default: "{title}{sep}{site_name}", help: "Utilisé pour toutes les pages, sauf l'accueil. Variables : {title}, {sep}, {site_name}." },
  default_description: { group: "site", label: "Description par défaut", type: "text", max: 160, required: true, default: "Découvrez et suivez mes formations en ligne, à votre rythme.", help: "Pour les pages qui n'ont pas leur propre description." },
  og_locale: { group: "site", label: "Langue du site (partage)", type: "choice", choices: ["fr_FR", "fr_BE", "fr_CA", "fr_CH", "en_US", "en_GB"], default: "fr_FR" },
  default_social_image: { group: "site", label: "Image de partage par défaut", type: "image", default: "", help: "Utilisée quand une page n'a pas d'image (idéalement 1200 × 630)." },

  home_title: { group: "home", label: "Titre de l'accueil", type: "template", max: 120, vars: ["site_name"], required: true, default: "{site_name} — Formations en ligne, à apprendre à votre rythme", help: "Titre complet (le modèle des pages ne s'y ajoute pas)." },
  home_description: { group: "home", label: "Description de l'accueil", type: "template", max: 160, vars: ["site_name"], required: true, default: "Formations vidéo en ligne : suivez les cours où que vous soyez, à votre rythme, avec des quiz, des ressources à télécharger et un certificat de réussite." },

  org_type: { group: "organization", label: "Type d'organisation", type: "choice", choices: ["Organization", "EducationalOrganization"], default: "Organization", help: "EducationalOrganization (organisme de formation) est plus précis pour une plateforme de cours." },
  org_name: { group: "organization", label: "Nom de l'organisation", type: "text", max: 80, default: "", help: "Vide : le nom du site." },
  org_logo: { group: "organization", label: "Logo", type: "image", default: "", help: "Image carrée ou rectangulaire, au moins 112 × 112 pixels." },
  org_description: { group: "organization", label: "Présentation courte", type: "text", max: 300, default: "" },
  social_profiles: { group: "organization", label: "Profils sociaux officiels", type: "urls", max: 10, default: [], help: "Une adresse https par ligne (Facebook, Instagram, LinkedIn, YouTube, X…). Uniquement vos vrais profils." },

  catalogue_title: { group: "templates", label: "Catalogue : titre", type: "template", max: 70, vars: ["site_name"], required: true, default: "Toutes les formations" },
  catalogue_description: { group: "templates", label: "Catalogue : description", type: "template", max: 200, vars: ["site_name"], required: true, default: "Parcourez toutes les formations {site_name} : filtrez par catégorie, niveau et prix, et trouvez celle qui vous convient." },
  course_category_title: { group: "templates", label: "Catégorie de formations : titre", type: "template", max: 70, vars: ["category", "site_name"], required: true, default: "Formations {category}" },
  course_category_description: { group: "templates", label: "Catégorie de formations : description", type: "template", max: 200, vars: ["category", "courses", "site_name"], required: true, default: "Découvrez {courses} {category} de {site_name} : cours vidéo à suivre à votre rythme, avec quiz et certificat.", help: "{courses} devient « la formation » ou « les 3 formations »." },
  blog_title: { group: "templates", label: "Blog : titre", type: "template", max: 70, vars: ["site_name"], required: true, default: "Blog" },
  blog_description: { group: "templates", label: "Blog : description", type: "template", max: 200, vars: ["site_name"], required: true, default: "Conseils, actualités et ressources autour de nos formations en ligne." },
  blog_category_description: { group: "templates", label: "Catégorie d'articles : description", type: "template", max: 200, vars: ["category", "site_name"], required: true, default: "Nos articles « {category} » : conseils, méthodes et ressources." },
  blog_tag_title: { group: "templates", label: "Étiquette : titre", type: "template", max: 70, vars: ["tag", "site_name"], required: true, default: "Articles : {tag}" },
  blog_tag_description: { group: "templates", label: "Étiquette : description", type: "template", max: 200, vars: ["tag", "site_name"], required: true, default: "Tous nos articles sur « {tag} »." },
  author_title: { group: "templates", label: "Auteur : titre", type: "template", max: 70, vars: ["author", "site_name"], required: true, default: "Articles de {author}" },
  author_description: { group: "templates", label: "Auteur : description", type: "template", max: 200, vars: ["author", "site_name"], required: true, default: "Les articles écrits par {author}." },

  index_blog_tags: { group: "indexing", label: "Indexer les pages d'étiquettes", type: "bool", default: false, help: "Non conseillé : elles reprennent les mêmes articles que les catégories. Leurs liens sont suivis dans tous les cas." },
  index_authors: { group: "indexing", label: "Indexer les pages d'auteurs", type: "bool", default: false, help: "Utile seulement s'il y a plusieurs auteurs." },
  robots_custom: { group: "robots", label: "Règles robots.txt supplémentaires", type: "multiline", max: 4000, default: "", help: "Ajoutées après les règles du site (espaces privés toujours interdits). Exemple : « User-agent: GPTBot » puis « Disallow: / » pour refuser un robot d'IA. Vérifiées à l'enregistrement." },
  publish_guard: { group: "indexing", label: "Contrôle avant publication", type: "choice", choices: ["warn", "block_critical"], labels: { warn: "Avertir seulement", block_critical: "Bloquer en cas d'erreur critique" }, default: "warn" },
};
const GROUPS = { site: "Site", home: "Page d'accueil", organization: "Organisation (données structurées)", templates: "Modèles de titres et descriptions", indexing: "Indexation et publication", robots: "robots.txt" };

let cache = null;
function all() {
  if (cache) return cache;
  const stored = Object.fromEntries(db.prepare("SELECT key, value FROM seo_settings").all().map((r) => [r.key, r.value]));
  const out = {};
  for (const [key, f] of Object.entries(FIELDS)) {
    if (!Object.hasOwn(stored, key)) { out[key] = f.default; continue; }
    try { out[key] = JSON.parse(stored[key]); } catch { out[key] = f.default; }
  }
  out.org_name_effective = out.org_name || out.site_name;
  cache = out;
  return out;
}
const get = (key) => all()[key];

// Valide une valeur saisie ; renvoie { value } ou { error }
function validate(key, raw) {
  const f = FIELDS[key];
  if (!f) return { error: "Réglage inconnu." };
  if (f.type === "bool") return { value: raw === true || raw === "1" || raw === "on" };
  if (f.type === "urls") {
    const list = (Array.isArray(raw) ? raw : String(raw || "").split(/\r?\n/)).map((u) => String(u).trim()).filter(Boolean);
    if (list.length > f.max) return { error: `${f.label} : ${f.max} adresses au plus.` };
    const bad = list.find((u) => !HTTPS_URL.test(u));
    if (bad) return { error: `${f.label} : « ${bad.slice(0, 60)} » n'est pas une adresse https valide.` };
    return { value: [...new Set(list)] };
  }
  if (f.type === "multiline") {
    const v = String(raw ?? "").replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (v.length > f.max) return { error: `${f.label} : ${f.max} caractères au plus.` };
    if (key === "robots_custom") { const problems = require("./robots").check(v).filter((x) => x.level === "error"); if (problems.length) return { error: `${f.label} : ${problems.map((x) => x.message).join(" ")}` }; }
    return { value: v };
  }
  const value = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (f.type === "choice") return f.choices.includes(String(raw)) ? { value: String(raw) } : { error: `${f.label} : choix invalide.` };
  if (f.type === "image") {
    if (!value) return { value: "" };
    return SAFE_PATH.test(value) ? { value } : { error: `${f.label} : choisissez une image de la médiathèque du site.` };
  }
  if (f.required && !value) return { error: `${f.label} : obligatoire.` };
  if (value.length > f.max) return { error: `${f.label} : ${f.max} caractères au plus.` };
  if (f.type === "template") {
    const unknown = unknownVariables(value, f.vars);
    if (unknown.length) return { error: `${f.label} : variable inconnue ${unknown.map((v) => `{${v}}`).join(", ")} (autorisées : ${f.vars.map((v) => `{${v}}`).join(", ")}).` };
  }
  return { value };
}

// Enregistre plusieurs réglages d'un coup (tout ou rien) ; chaque changement est journalisé
function save(input, userId) {
  const errors = [];
  const next = {};
  for (const key of Object.keys(input)) {
    if (!FIELDS[key]) continue;
    const r = validate(key, input[key]);
    if (r.error) errors.push(r.error); else next[key] = r.value;
  }
  if (errors.length) return { ok: false, errors };
  const current = all();
  db.exec("BEGIN");
  try {
    for (const [key, value] of Object.entries(next)) {
      const before = JSON.stringify(current[key]);
      const after = JSON.stringify(value);
      if (before === after) continue;
      db.prepare("INSERT INTO seo_settings (key, value, updated_at, updated_by) VALUES (?, ?, datetime('now'), ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
        .run(key, after, userId ?? null);
      logChange({ entityType: "settings", entityKey: "site", field: key, before: typeof current[key] === "string" ? current[key] : before, after: typeof value === "string" ? value : after, userId });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  cache = null;
  return { ok: true };
}

const resetCache = () => { cache = null; };

const cacheInfo = () => ({ entries: cache ? Object.keys(cache).length : 0, loaded: cache !== null });
module.exports = { FIELDS, GROUPS, all, get, validate, save, resetCache, cacheInfo, SAFE_PATH, HTTPS_URL };
