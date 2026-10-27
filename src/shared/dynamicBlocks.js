// Blocs « dynamiques » de l'éditeur d'articles (équivalents des blocs de widgets de Gutenberg) : sommaire, derniers articles, catégories, étiquettes,
// archives, calendrier, recherche, réseaux sociaux, liste des pages, flux RSS. Dans le contenu enregistré ce ne sont que des MARQUEURS (<div class="kb-latest" data-count="5">) ;
// le contenu réel est fabriqué par le serveur à l'AFFICHAGE, limité au site de l'article (jamais d'articles d'un autre site).
// Cette table décrit, pour chaque bloc, les attributs acceptés et leur validation : le serveur (assainissement) et l'éditeur (panneau de réglages) s'y réfèrent.
// CommonJS : utilisable par le serveur et par esbuild.
const text = (max) => (v) => { const s = String(v == null ? "" : v).replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max); return s; };
const oneOf = (...list) => (v) => (list.includes(String(v)) ? String(v) : "");
const bool = (v) => (String(v) === "true" ? "true" : "");
const int = (min, max) => (v) => (/^\d{1,3}$/.test(String(v)) && Number(v) >= min && Number(v) <= max ? String(Number(v)) : "");

// Réseaux sociaux reconnus : nom d'affichage, hôtes autorisés (https), ou mailto pour l'e-mail
const NETWORKS = {
  facebook: { label: "Facebook", hosts: ["facebook.com", "fb.com"] },
  x: { label: "X", hosts: ["x.com", "twitter.com"] },
  instagram: { label: "Instagram", hosts: ["instagram.com"] },
  linkedin: { label: "LinkedIn", hosts: ["linkedin.com"] },
  youtube: { label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  tiktok: { label: "TikTok", hosts: ["tiktok.com"] },
  whatsapp: { label: "WhatsApp", hosts: ["wa.me", "whatsapp.com"] },
  telegram: { label: "Telegram", hosts: ["t.me", "telegram.me"] },
  pinterest: { label: "Pinterest", hosts: ["pinterest.com", "pinterest.fr"] },
  github: { label: "GitHub", hosts: ["github.com"] },
  threads: { label: "Threads", hosts: ["threads.net"] },
  bluesky: { label: "Bluesky", hosts: ["bsky.app"] },
  mastodon: { label: "Mastodon", hosts: [] }, // instance libre : tout hôte https public
  twitch: { label: "Twitch", hosts: ["twitch.tv"] },
  snapchat: { label: "Snapchat", hosts: ["snapchat.com"] },
  reddit: { label: "Reddit", hosts: ["reddit.com"] },
  email: { label: "E-mail", hosts: [] },
};
const URL_OK = /^https:\/\/[^\s"'<>]{4,300}$/;
const MAIL_OK = /^mailto:[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{3,100}$/;
// "facebook=https://… x=https://…" → valeur nettoyée (réseaux connus, adresses conformes à l'hôte du réseau), 12 au maximum
function cleanSocial(raw) {
  const out = []; const seen = new Set();
  for (const token of String(raw || "").split(/\s+/).filter(Boolean)) {
    const at = token.indexOf("=");
    if (at < 1) continue;
    const net = token.slice(0, at); const url = token.slice(at + 1);
    const def = NETWORKS[net];
    if (!def || seen.has(net) || out.length >= 12) continue;
    if (net === "email") { if (!MAIL_OK.test(url)) continue; }
    else {
      if (!URL_OK.test(url)) continue;
      let host; try { host = new URL(url).hostname.toLowerCase().replace(/^www\./, ""); } catch { continue; }
      if (def.hosts.length && !def.hosts.some((h) => host === h || host.endsWith(`.${h}`))) continue;
    }
    seen.add(net); out.push(`${net}=${url}`);
  }
  return out.join(" ");
}
const feedUrl = (v) => { const s = String(v || "").trim(); if (!/^https:\/\/[^\s"'<>]{4,300}$/.test(s)) return ""; try { const u = new URL(s); return u.username || u.password || (u.port && u.port !== "443") ? "" : u.href; } catch { return ""; } };

// cls : classe du marqueur · name : nœud Tiptap · attrs : { nom d'attribut Tiptap: [attribut HTML, nettoyage, valeur par défaut à l'insertion, champ du panneau de réglages] }
// champ : { label, kind: "text" | "number" | "check" | "select" | "textarea", options?, min?, max?, help?, placeholder? }
const T = (label, extra = {}) => ({ label, kind: "text", ...extra });
const DYNAMIC = [
  { name: "kbToc", cls: "kb-toc", label: "Sommaire", icon: "toc", desc: "Table des matières de l'article, construite à partir de ses titres.", keywords: "table des matières plan navigation",
    attrs: { depth: ["data-depth", oneOf("2", "3", "4"), "3", { label: "Niveaux de titres", kind: "select", options: [["2", "Titres de niveau 2"], ["3", "Niveaux 2 et 3"], ["4", "Niveaux 2 à 4"]] }], title: ["data-title", text(80), "", T("Titre du bloc", { placeholder: "Sommaire" })] } },
  { name: "kbLatest", cls: "kb-latest", label: "Derniers articles", icon: "list", desc: "Liste des articles les plus récents du site.", keywords: "articles récents blog liste actualités",
    attrs: { count: ["data-count", int(1, 12), "5", { label: "Nombre d'articles", kind: "number", min: 1, max: 12 }], view: ["data-view", oneOf("list", "grid"), "list", { label: "Présentation", kind: "select", options: [["list", "Liste"], ["grid", "Grille"]] }], date: ["data-date", bool, "true", { label: "Afficher la date", kind: "check" }], excerpt: ["data-excerpt", bool, "", { label: "Afficher l'extrait", kind: "check" }], image: ["data-image", bool, "", { label: "Afficher l'image", kind: "check" }], category: ["data-category", text(60), "", T("Seulement cette catégorie", { placeholder: "Toutes les catégories" })], title: ["data-title", text(80), "", T("Titre du bloc")] } },
  { name: "kbCategories", cls: "kb-categories", label: "Catégories", icon: "list", desc: "Liste des catégories du blog.", keywords: "rubriques thèmes taxonomie",
    attrs: { count: ["data-count", bool, "true", { label: "Afficher le nombre d'articles", kind: "check" }], title: ["data-title", text(80), "", T("Titre du bloc")] } },
  { name: "kbTags", cls: "kb-tags", label: "Nuage d'étiquettes", icon: "list", desc: "Les étiquettes les plus utilisées.", keywords: "tags mots-clés nuage",
    attrs: { max: ["data-max", int(5, 50), "20", { label: "Nombre d'étiquettes", kind: "number", min: 5, max: 50 }], title: ["data-title", text(80), "", T("Titre du bloc")] } },
  { name: "kbArchives", cls: "kb-archives", label: "Archives", icon: "list", desc: "Les articles classés par mois.", keywords: "mois historique calendrier",
    attrs: { count: ["data-count", bool, "true", { label: "Afficher le nombre d'articles", kind: "check" }], max: ["data-max", int(1, 24), "12", { label: "Nombre de mois", kind: "number", min: 1, max: 24 }], title: ["data-title", text(80), "", T("Titre du bloc")] } },
  { name: "kbCalendar", cls: "kb-calendar", label: "Calendrier", icon: "list", desc: "Le mois en cours, avec un lien sur chaque jour où un article a paru.", keywords: "date mois jours publication", attrs: {} },
  { name: "kbSearch", cls: "kb-search", label: "Recherche", icon: "list", desc: "Un champ de recherche dans les articles du blog.", keywords: "chercher trouver formulaire",
    attrs: { title: ["data-title", text(80), "", T("Titre du bloc")], placeholder: ["data-placeholder", text(60), "Rechercher un article", T("Texte d'aide du champ")], button: ["data-button", text(30), "Rechercher", T("Texte du bouton")] } },
  { name: "kbSocial", cls: "kb-social", label: "Réseaux sociaux", icon: "list", desc: "Liens vers vos comptes de réseaux sociaux.", keywords: "facebook instagram linkedin youtube suivre partage",
    attrs: { links: ["data-links", cleanSocial, "", { label: "Comptes (un par ligne : réseau=adresse)", kind: "textarea", placeholder: "facebook=https://facebook.com/mapage\nlinkedin=https://linkedin.com/in/moi\nemail=mailto:contact@exemple.fr", help: "Réseaux reconnus : facebook, x, instagram, linkedin, youtube, tiktok, whatsapp, telegram, pinterest, github, threads, bluesky, mastodon, twitch, snapchat, reddit, email. L'adresse doit appartenir au réseau." }], size: ["data-size", oneOf("s", "m", "l"), "m", { label: "Taille", kind: "select", options: [["s", "Petite"], ["m", "Moyenne"], ["l", "Grande"]] }], title: ["data-title", text(80), "", T("Titre du bloc")] } },
  { name: "kbPageList", cls: "kb-pagelist", label: "Liste des pages", icon: "list", desc: "Les pages du site (À propos, Contact, FAQ…).", keywords: "plan du site navigation pages",
    attrs: { title: ["data-title", text(80), "", T("Titre du bloc")] } },
  { name: "kbRss", cls: "kb-rss", label: "Flux RSS", icon: "list", desc: "Les derniers éléments d'un flux RSS ou Atom (mis en cache, actualisé toutes les heures).", keywords: "rss atom actualités externe flux",
    attrs: { url: ["data-url", feedUrl, "", T("Adresse du flux (https)", { placeholder: "https://exemple.org/feed.xml" })], count: ["data-count", int(1, 10), "5", { label: "Nombre d'éléments", kind: "number", min: 1, max: 10 }], date: ["data-date", bool, "true", { label: "Afficher la date", kind: "check" }], excerpt: ["data-excerpt", bool, "", { label: "Afficher l'extrait", kind: "check" }], title: ["data-title", text(80), "", T("Titre du bloc")] } },
];
const BY_CLASS = new Map(DYNAMIC.map((d) => [d.cls, d]));
const BY_NAME = new Map(DYNAMIC.map((d) => [d.name, d]));

// Attributs nettoyés d'un marqueur (clé HTML → valeur) ; ce qui est vide ou égal à la valeur par défaut implicite n'est pas écrit
function cleanAttrs(def, attribs) {
  const out = {};
  for (const [, [attr, clean]] of Object.entries(def.attrs)) {
    const v = clean(attribs[attr]);
    if (v) out[attr] = v;
  }
  return out;
}
module.exports = { DYNAMIC, BY_CLASS, BY_NAME, NETWORKS, cleanAttrs, cleanSocial, feedUrl };
