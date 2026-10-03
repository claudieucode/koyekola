// Contrôle SEO avant publication d'un article (« SEO Check Before Publish »), fait par le SERVEUR sur les données envoyées.
//   critical : erreur objective qui empêche une publication correcte (titre vide, contenu vide, canonical invalide,
//              adresse interdite par robots.txt, image introuvable) — peut bloquer la publication si le réglage le demande
//   warnings : problème probable (lien interne cassé, noindex, image sans texte alternatif, H1 dans le contenu…)
//   recommendations : conseils de l'analyse éditoriale (jamais bloquants)
//   passed : contrôles réussis
const db = require("../config/database");
const settings = require("./settings");
const robots = require("./robots");
const images = require("./images");
const { analyze } = require("../utils/seoAnalyzer");
const { slugify } = require("../utils/format");

// La page interne existe-t-elle (contenu publié) ? Seules les adresses connues sont vérifiées.
function internalExists(path) {
  const p = path.split("#")[0].split("?")[0].replace(/\/+$/, "") || "/";
  let m;
  if ((m = /^\/blog\/([a-z0-9-]+)$/.exec(p)) && !["categorie", "etiquette", "auteur"].includes(m[1])) return Boolean(db.prepare("SELECT 1 FROM posts WHERE slug = ? AND published = 1").get(m[1]) || db.prepare("SELECT 1 FROM post_slug_history WHERE old_slug = ?").get(m[1]));
  if ((m = /^\/cours\/([a-z0-9-]+)$/.exec(p))) return Boolean(db.prepare("SELECT 1 FROM courses WHERE slug = ? AND published = 1 AND archived = 0").get(m[1]) || db.prepare("SELECT 1 FROM course_slug_history WHERE old_slug = ?").get(m[1]));
  if ((m = /^\/categorie\/([a-z0-9-]+)$/.exec(p))) return db.prepare("SELECT DISTINCT category FROM courses WHERE published = 1 AND archived = 0").all().some((r) => slugify(r.category) === m[1]);
  if (db.prepare("SELECT 1 FROM seo_redirects WHERE source_path = ? AND enabled = 1").get(p)) return true;
  return null; // autre page du site : non vérifiée ici (l'audit complet la vérifie)
}

function checkPost(f, { req, postId = null } = {}) {
  const critical = [];
  const warnings = [];
  const recommendations = [];
  const passed = [];
  const c = (ok, list, message, okMessage) => (ok ? passed.push(okMessage || message) : list.push(message));
  const html = String(f.content || "");
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const slug = slugify(f.slug || f.title || "");
  c(Boolean(String(f.title || "").trim()), critical, "Le titre est vide.", "Titre présent");
  c(Boolean(text) || /<(img|figure)\b|kb-(video|audio|embed|course|newsletter)/.test(html), critical, "Le contenu est vide.", "Contenu rédigé");
  const canonical = String(f.canonical_url || "").trim();
  c(!canonical || /^https:\/\/\S+$/i.test(canonical), critical, "L'URL canonique est invalide (adresse complète en https:// attendue).", "Canonical valide");
  if (slug) c(robots.allowed(robots.text(req).split("\n").filter((l) => !/^sitemap:/i.test(l)).join("\n"), "Googlebot", `/blog/${slug}`), critical, `robots.txt interdit l'adresse /blog/${slug} à Google.`, "Adresse autorisée par robots.txt");
  // Images du contenu : fichier présent, texte alternatif
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ src: (m[0].match(/src="([^"]+)"/i) || [])[1] || "", alt: (m[0].match(/alt="([^"]*)"/i) || [])[1] || "" }));
  const missing = imgs.filter((i) => i.src.startsWith("/uploads/") && !images.probe(i.src).exists);
  c(!missing.length, critical, `Image introuvable : ${missing.map((i) => i.src).join(", ")}.`, "Images présentes sur le site");
  for (const key of ["cover_path", "og_image_path"]) if (f[key] && !images.probe(f[key]).exists) critical.push(`Image ${key === "cover_path" ? "mise en avant" : "de partage"} introuvable : ${f[key]}.`);
  const noAlt = imgs.filter((i) => !i.alt.trim());
  c(!noAlt.length, warnings, `${noAlt.length} image(s) sans texte alternatif.`, "Textes alternatifs des images");
  // Liens internes vers des contenus inexistants
  const links = [...html.matchAll(/<a\b[^>]*href="(\/[^"]*)"/gi)].map((m) => m[1]);
  const broken = links.filter((l) => internalExists(l) === false);
  c(!broken.length, warnings, `Lien(s) interne(s) vers une page inexistante ou non publiée : ${[...new Set(broken)].join(", ")}.`, "Liens internes valides");
  c(!/<h1\b/i.test(html), warnings, "Le contenu contient un titre 1 (le titre de l'article est déjà le H1) : utilisez Titre 2.", "Un seul H1");
  c(f.robots_index !== 0, warnings, "L'article est réglé en noindex : il ne sera pas proposé à Google.", "Indexable");
  if (!String(f.seo_description || "").trim() && !String(f.excerpt || "").trim()) warnings.push("Ni méta description ni extrait : Google choisira lui-même un passage.");
  else passed.push("Description pour Google");
  if (!String(f.category || "").trim()) recommendations.push("Choisir une catégorie aide à classer l'article et crée un lien depuis la page de catégorie.");
  // Analyse éditoriale existante (mot-clé, structure, lisibilité) : conseils, jamais bloquants
  const r = analyze({ title: f.title, seoTitle: f.seo_title, metaDescription: f.seo_description, slug, canonical, siteUrl: "", focusKeyword: f.focus_keyword, secondaryKeywords: f.secondary_keywords, html, hasCover: Boolean(f.cover_path), coverAlt: f.cover_alt });
  for (const ch of r.checks) {
    if (ch.status === "problem") recommendations.push(`${ch.label}${ch.advice ? ` — ${ch.advice}` : ""}`);
    else if (ch.status === "improve") recommendations.push(`${ch.label}${ch.advice ? ` — ${ch.advice}` : ""}`);
  }
  const mode = settings.get("publish_guard");
  return { critical, warnings, recommendations: [...new Set(recommendations)].slice(0, 15), passed, blocking: mode === "block_critical" && critical.length > 0, mode, postId };
}

module.exports = { checkPost, internalExists };
