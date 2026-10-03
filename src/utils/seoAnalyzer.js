// Analyse SEO et de lisibilité d'un article — module partagé : l'éditeur (navigateur) et les tests l'utilisent tel quel.
// Ce sont des REPÈRES RÉDACTIONNELS INTERNES : ils ne reproduisent pas les critères (secrets) de Google et ne garantissent
// aucun classement. Ils n'encouragent jamais la répétition d'un mot-clé (trop de répétitions est signalé comme un problème).
// Statuts : "good" (BON), "improve" (À AMÉLIORER), "problem" (PROBLÈME).

const TRANSITIONS = ["cependant", "toutefois", "pourtant", "ainsi", "donc", "en effet", "par exemple", "notamment", "de plus", "en outre", "par ailleurs",
  "d'abord", "ensuite", "enfin", "finalement", "en revanche", "au contraire", "c'est pourquoi", "par consequent", "en resume", "en conclusion", "autrement dit",
  "premierement", "deuxiemement", "puis", "alors", "car", "c'est-a-dire", "bref", "aussi"];

function norm(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, " ").replace(/\s+/g, " ").trim();
}
const slugNorm = (text) => norm(text).replace(/'/g, "").replace(/\s+/g, "-");
const decode = (s) => String(s).replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const stripTags = (html) => decode(String(html || "").replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/summary|\/td|\/th)[^>]*>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const wordsOf = (text) => (String(text || "").match(/[\p{L}\p{N}’']+/gu) || []);

function countPhrase(haystack, phrase) {
  const h = ` ${norm(haystack)} `;
  const p = norm(phrase);
  if (!p) return 0;
  let n = 0;
  let i = h.indexOf(` ${p} `);
  while (i !== -1) { n++; i = h.indexOf(` ${p} `, i + p.length + 1); }
  return n;
}
const contains = (haystack, phrase) => countPhrase(haystack, phrase) > 0;

// Éléments d'un HTML d'article (celui de l'éditeur, déjà assaini) — expressions simples, le HTML est sous contrôle
function extract(html) {
  const source = String(html || "");
  const headings = [...source.matchAll(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: Number(m[1]), text: stripTags(m[2]) }));
  const paragraphs = [...source.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1])).filter(Boolean);
  const images = [...source.matchAll(/<img\b([^>]*)>/gi)].map((m) => ({ alt: decode((m[1].match(/\balt="([^"]*)"/i) || [])[1] || "").trim(), src: (m[1].match(/\bsrc="([^"]*)"/i) || [])[1] || "" }));
  const links = [...source.matchAll(/<a\b([^>]*)>/gi)].map((m) => (m[1].match(/\bhref="([^"]*)"/i) || [])[1] || "").filter(Boolean);
  const lists = (source.match(/<(ul|ol)\b/gi) || []).length;
  // Blocs de texte successifs (pour la répartition des intertitres) : un titre coupe le bloc
  const sections = [];
  let current = 0;
  for (const part of source.split(/<h[2-4][^>]*>[\s\S]*?<\/h[2-4]>/i)) { current = wordsOf(stripTags(part)).length; sections.push(current); }
  return { text: stripTags(source), headings, paragraphs, images, links, lists, sections };
}

function sentencesOf(text) {
  return String(text || "").split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ0-9«"])/u).map((s) => s.trim()).filter((s) => wordsOf(s).length >= 3);
}

// input : { title, seoTitle, metaDescription, slug, canonical, siteUrl, focusKeyword, secondaryKeywords, html, hasCover, coverAlt, excerpt }
function analyze(input = {}) {
  const x = extract(input.html);
  const words = wordsOf(x.text).length;
  const checks = [];
  const add = (group, id, status, label, advice = "") => checks.push({ group, id, status, label, advice });
  const kw = String(input.focusKeyword || "").trim();
  const seoTitle = String(input.seoTitle || input.title || "").trim();
  const meta = String(input.metaDescription || "").trim();

  // ---------- Mot-clé principal ----------
  if (!kw) {
    add("keyword", "keyword", "improve", "Aucun mot-clé principal", "Indiquez l'expression que vos lecteurs taperaient dans Google (ex. « formation en ligne ») : l'analyse vous dira où l'ajouter naturellement.");
  } else {
    const intro = x.paragraphs.slice(0, 2).join(" ") || x.text.split(/\s+/).slice(0, 60).join(" ");
    const subs = x.headings.filter((h) => h.level >= 2);
    add("keyword", "kw-title", contains(seoTitle, kw) ? "good" : "problem", "Mot-clé dans le titre SEO", contains(seoTitle, kw) ? "" : "Placez l'expression dans le titre affiché par Google, de préférence au début.");
    add("keyword", "kw-h1", contains(input.title, kw) ? "good" : "improve", "Mot-clé dans le titre de l'article (H1)", contains(input.title, kw) ? "" : "Le titre visible de l'article devrait contenir l'expression, ou une formulation très proche.");
    add("keyword", "kw-intro", contains(intro, kw) ? "good" : "improve", "Mot-clé dans l'introduction", contains(intro, kw) ? "" : "Mentionnez le sujet dès les premières phrases : le lecteur sait tout de suite qu'il est au bon endroit.");
    add("keyword", "kw-subheadings", subs.some((h) => contains(h.text, kw)) ? "good" : "improve", "Mot-clé dans au moins un intertitre", subs.length ? "Reprenez l'expression (ou une variante) dans un titre de section, si c'est naturel." : "Ajoutez des titres de section (H2) : ils structurent l'article et servent au sommaire.");
    add("keyword", "kw-slug", slugNorm(input.slug).includes(slugNorm(kw)) ? "good" : "improve", "Mot-clé dans l'adresse (slug)", slugNorm(input.slug).includes(slugNorm(kw)) ? "" : "Une adresse courte qui reprend l'expression est plus parlante (modifiable tant que l'article n'est pas publié).");
    add("keyword", "kw-meta", contains(meta, kw) ? "good" : "improve", "Mot-clé dans la meta description", contains(meta, kw) ? "" : "Google met en gras les mots recherchés dans la description : intégrez l'expression dans une phrase naturelle.");
    // Densité : jamais de « bourrage »
    const n = countPhrase(x.text, kw);
    const kwWords = Math.max(1, wordsOf(kw).length);
    const density = words ? (n * kwWords * 100) / words : 0;
    const d = Math.round(density * 10) / 10;
    if (n === 0) add("keyword", "kw-density", "problem", "Mot-clé absent du contenu", "Le texte ne parle jamais explicitement de l'expression visée.");
    else if (density > 3) add("keyword", "kw-density", "problem", `Mot-clé trop répété (${n} fois, ${d} %)`, "Répéter une expression nuit à la lecture et peut être considéré comme du « bourrage de mots-clés ». Remplacez certaines occurrences par des synonymes ou des pronoms.");
    else if (density > 2.5) add("keyword", "kw-density", "improve", `Mot-clé très présent (${n} fois, ${d} %)`, "C'est un peu insistant : variez avec des synonymes.");
    else if (words >= 300 && density < 0.5) add("keyword", "kw-density", "improve", `Mot-clé peu présent (${n} fois, ${d} %)`, "Le sujet pourrait être nommé un peu plus souvent, sans forcer : une à deux fois tous les 300 mots suffit.");
    else add("keyword", "kw-density", "good", `Utilisation naturelle du mot-clé (${n} fois, ${d} %)`);
    const secondary = String(input.secondaryKeywords || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (secondary.length) {
      const missing = secondary.filter((s) => !contains(x.text, s));
      add("keyword", "kw-secondary", missing.length ? "improve" : "good", "Mots-clés secondaires", missing.length ? `Absents du texte : ${missing.join(", ")}. Utilisez-les seulement s'ils ont leur place.` : "Tous présents dans le texte.");
    }
  }

  // ---------- Titre, description, adresse, canonique ----------
  if (!input.seoTitle) add("seo", "seo-title", seoTitle ? "improve" : "problem", "Titre SEO", seoTitle ? "Non renseigné : Google utilisera le titre de l'article. Rédigez-en un de 30 à 60 caractères si le titre est long." : "Ajoutez un titre.");
  else if (seoTitle.length > 60) add("seo", "seo-title", "improve", `Titre SEO un peu long (${seoTitle.length} caractères)`, "Au-delà d'environ 60 caractères, Google le coupe souvent. Placez l'essentiel au début.");
  else if (seoTitle.length < 30) add("seo", "seo-title", "improve", `Titre SEO court (${seoTitle.length} caractères)`, "Vous avez de la place pour un titre plus descriptif (30 à 60 caractères).");
  else add("seo", "seo-title", "good", `Titre SEO (${seoTitle.length} caractères)`);
  if (!meta) add("seo", "meta", "problem", "Meta description absente", "Sans elle, Google choisit un extrait au hasard. Résumez l'article en 120 à 160 caractères, avec une raison de cliquer.");
  else if (meta.length < 70) add("seo", "meta", "improve", `Meta description courte (${meta.length} caractères)`, "Visez 120 à 160 caractères.");
  else if (meta.length > 160) add("seo", "meta", "improve", `Meta description longue (${meta.length} caractères)`, "Au-delà de 160 caractères, elle sera coupée.");
  else add("seo", "meta", "good", `Meta description (${meta.length} caractères)`);
  if (!input.slug) add("seo", "slug", "problem", "Adresse (slug) absente", "Elle sera tirée du titre à l'enregistrement.");
  else if (String(input.slug).length > 75) add("seo", "slug", "improve", "Adresse longue", "Une adresse courte (3 à 6 mots) est plus lisible et se partage mieux.");
  else add("seo", "slug", "good", "Adresse (slug)");
  const canonical = String(input.canonical || "").trim();
  if (!canonical) add("seo", "canonical", "good", "Adresse canonique : celle de l'article");
  else if (!/^https:\/\/[^\s]+$/i.test(canonical)) add("seo", "canonical", "problem", "Adresse canonique invalide", "Elle doit commencer par https://.");
  else if (input.siteUrl && !canonical.startsWith(String(input.siteUrl).replace(/\/+$/, ""))) add("seo", "canonical", "improve", "Adresse canonique vers un autre site", "Vous indiquez à Google que l'original est ailleurs : cet article ne sera alors pas mis en avant. À n'utiliser que pour un article republié.");
  else add("seo", "canonical", "good", "Adresse canonique");

  // ---------- Contenu et structure ----------
  if (words < 300) add("structure", "length", "problem", `Contenu court (${words} mots)`, "Moins de 300 mots, c'est rarement assez pour répondre complètement à une question. Repère indicatif : 600 mots et plus pour un article de fond.");
  else if (words < 600) add("structure", "length", "improve", `Contenu de ${words} mots`, "Correct pour un article court ; développez exemples et explications si le sujet le demande.");
  else add("structure", "length", "good", `Contenu de ${words} mots`);
  const h1InContent = x.headings.filter((h) => h.level === 1).length;
  add("structure", "h1", h1InContent ? "improve" : "good", h1InContent ? "Titre H1 dans le contenu" : "Un seul H1 (le titre de l'article)", h1InContent ? "Le titre de l'article est déjà le H1 de la page : les H1 du contenu seront affichés comme des H2. Utilisez plutôt « Titre 2 »." : "");
  const h2 = x.headings.filter((h) => h.level === 2).length;
  add("structure", "h2", h2 >= 2 ? "good" : words >= 300 ? "improve" : "good", h2 >= 2 ? `${h2} titres de section (H2)` : "Peu de titres de section", h2 >= 2 ? "" : "Découpez l'article avec des titres H2 (au moins 2) : la lecture est plus facile et le sommaire apparaît.");
  let skipped = false;
  let last = 1;
  for (const h of x.headings) { if (h.level > last + 1) skipped = true; last = h.level === 1 ? 1 : h.level; }
  add("structure", "hierarchy", skipped ? "improve" : "good", skipped ? "Niveau de titre sauté" : "Hiérarchie des titres", skipped ? "Un H3 doit suivre un H2 (et un H4 un H3) : ne sautez pas de niveau." : "");
  const noAlt = x.images.filter((i) => !i.alt);
  if (!input.hasCover) add("media", "cover", "improve", "Pas d'image principale", "Une image principale rend l'article plus attrayant, notamment lors d'un partage sur les réseaux.");
  else add("media", "cover", input.coverAlt ? "good" : "improve", "Image principale", input.coverAlt ? "" : "Ajoutez son texte alternatif (sinon le titre de l'article est utilisé).");
  if (!x.images.length) add("media", "images", "improve", "Aucune image dans le contenu", "Une image, un schéma ou une capture aide souvent à comprendre.");
  else add("media", "images", noAlt.length ? "problem" : "good", noAlt.length ? `${noAlt.length} image${noAlt.length > 1 ? "s" : ""} sans texte alternatif` : `${x.images.length} image${x.images.length > 1 ? "s" : ""} avec texte alternatif`, noAlt.length ? "Décrivez chaque image : c'est indispensable aux personnes malvoyantes et utile au référencement des images." : "");
  const internal = x.links.filter((h) => /^\/(?!\/)/.test(h) || (input.siteUrl && h.startsWith(String(input.siteUrl).replace(/\/+$/, ""))));
  const external = x.links.filter((h) => /^https?:/i.test(h) && !internal.includes(h));
  add("links", "internal", internal.length ? "good" : "improve", internal.length ? `${internal.length} lien${internal.length > 1 ? "s" : ""} interne${internal.length > 1 ? "s" : ""}` : "Aucun lien interne", internal.length ? "" : "Reliez l'article à une formation ou à un autre article (onglet SEO, section « Maillage interne »).");
  add("links", "external", external.length ? "good" : "improve", external.length ? `${external.length} lien${external.length > 1 ? "s" : ""} externe${external.length > 1 ? "s" : ""}` : "Aucun lien externe", external.length ? "" : "Citer une source fiable (étude, documentation officielle) renforce la crédibilité.");

  // ---------- Lisibilité ----------
  const sentences = sentencesOf(x.paragraphs.join(" ") || x.text);
  if (sentences.length >= 3) {
    const long = sentences.filter((s) => wordsOf(s).length > 25);
    const share = Math.round((long.length * 100) / sentences.length);
    add("readability", "sentences", share > 25 ? "improve" : "good", share > 25 ? `${share} % de phrases longues` : "Longueur des phrases", share > 25 ? "Plus d'une phrase sur quatre dépasse 25 mots : coupez-en quelques-unes en deux." : "");
    const transitions = sentences.filter((s) => TRANSITIONS.some((t) => ` ${norm(s)} `.includes(` ${t} `))).length;
    const tShare = Math.round((transitions * 100) / sentences.length);
    add("readability", "transitions", tShare >= 20 ? "good" : "improve", `Mots de liaison (${tShare} % des phrases)`, tShare >= 20 ? "" : "Des mots comme « ainsi », « par exemple », « ensuite » guident le lecteur d'une idée à l'autre.");
    let repeated = 0;
    for (let i = 2; i < sentences.length; i++) {
      const first = (s) => norm(s).split(" ")[0];
      if (first(sentences[i]) && first(sentences[i]) === first(sentences[i - 1]) && first(sentences[i]) === first(sentences[i - 2])) repeated++;
    }
    add("readability", "repetition", repeated ? "improve" : "good", repeated ? "Débuts de phrases répétitifs" : "Variété des débuts de phrases", repeated ? "Trois phrases de suite commencent par le même mot : variez les tournures." : "");
  }
  const longParagraphs = x.paragraphs.filter((p) => wordsOf(p).length > 150).length;
  add("readability", "paragraphs", longParagraphs ? "improve" : "good", longParagraphs ? `${longParagraphs} paragraphe${longParagraphs > 1 ? "s" : ""} très long${longParagraphs > 1 ? "s" : ""}` : "Longueur des paragraphes", longParagraphs ? "Au-delà de 150 mots, un paragraphe décourage la lecture (surtout sur téléphone) : coupez-le." : "");
  const wall = x.sections.some((n) => n > 300);
  add("readability", "subheadings", wall ? "improve" : "good", wall ? "Longs passages sans intertitre" : "Répartition des intertitres", wall ? "Un passage dépasse 300 mots sans titre : ajoutez un H2 ou un H3 pour aérer." : "");
  if (words >= 400) add("readability", "lists", x.lists ? "good" : "improve", x.lists ? "Listes à puces ou numérotées" : "Aucune liste", x.lists ? "" : "Une liste rend les étapes et les énumérations bien plus faciles à parcourir.");

  const summary = { good: 0, improve: 0, problem: 0 };
  checks.forEach((c) => { summary[c.status]++; });
  // Mesures brutes (lues par les panneaux de l'espace de travail : aucun calcul n'est refait côté interface)
  const allKeywords = [...(kw ? [{ phrase: kw, kind: "principal" }] : []), ...String(input.secondaryKeywords || "").split(",").map((k) => k.trim()).filter(Boolean).map((phrase) => ({ phrase, kind: "secondaire" }))];
  const keywordStats = allKeywords.map((k) => {
    const n = countPhrase(x.text, k.phrase);
    const density = words ? Math.round(((n * Math.max(1, wordsOf(k.phrase).length) * 100) / words) * 10) / 10 : 0;
    return { ...k, count: n, density, inTitle: contains(seoTitle, k.phrase) || contains(input.title, k.phrase), inHeadings: x.headings.filter((h) => contains(h.text, k.phrase)).length, inMeta: contains(meta, k.phrase) };
  });
  const sentenceWords = sentences.map((s) => wordsOf(s).length);
  const stats = {
    title: String(input.title || "").trim(), seoTitle, metaDescription: meta,
    h1: (String(input.title || "").trim() ? 1 : 0) + h1InContent, h1InContent,
    headings: { h2: x.headings.filter((h) => h.level === 2).length, h3: x.headings.filter((h) => h.level === 3).length, h4: x.headings.filter((h) => h.level === 4).length },
    characters: x.text.length, charactersNoSpaces: x.text.replace(/\s+/g, "").length,
    paragraphs: x.paragraphs.length, lists: x.lists, sentences: sentences.length,
    avgSentenceWords: sentenceWords.length ? Math.round((sentenceWords.reduce((a, b) => a + b, 0) / sentenceWords.length) * 10) / 10 : null,
    longSentences: sentenceWords.filter((n) => n > 25).length,
    images: { total: x.images.length, withoutAlt: noAlt.length },
    internalLinks: internal, externalLinks: external,
  };
  return { checks, summary, score: scoreOf({ checks, summary }), words, minutes: Math.max(1, Math.round(words / 230)), headings: x.headings, images: x.images, links: { internal: internal.length, external: external.length }, stats, keywordStats };
}

// Note sur 100 : bon = 1 point, à améliorer = ½, problème = 0, rapporté au nombre de contrôles. Repère interne.
function scoreOf(r) {
  const total = r.checks.length || 1;
  return Math.round((100 * (r.summary.good + r.summary.improve * 0.5)) / total);
}

module.exports = { analyze, scoreOf, norm, countPhrase, extract, TRANSITIONS };
