// Mise en forme des ARTICLES DU BLOG : le Markdown sûr du site (src/utils/markdown.js) + les blocs éditoriaux d'un blog.
// Même principe de sûreté : tout le texte est neutralisé, seules les balises générées ici existent (aucun HTML saisi
// ne peut devenir actif).
//
// En plus du Markdown habituel (paragraphes, **gras**, *italique*, listes, citations >, liens, code, ---) :
//   ## Titre de section          → <h2 id="…">  (sert au sommaire)
//   ### Sous-titre               → <h3 id="…">  (sert au sommaire)
//   :::conseil [titre facultatif]  … texte …  :::     → encadré (conseil, a-retenir, bon-a-savoir, info, attention)
//   ![Texte alternatif](/uploads/… "Titre")          → image (fichiers envoyés sur le site uniquement : pas de pistage)
//   Légende : …  (ligne juste après l'image)          → légende de l'image
//   [[formation:adresse-de-la-formation]]            → carte d'une formation du catalogue (lien interne choisi)
//   [[bouton:Texte du bouton|/adresse]]              → bouton d'appel à l'action
const { renderInline, escapeHtml, isSafeUrl } = require("./markdown");
const { slugify } = require("./format");

const MAX_LENGTH = 100000;
const WORDS_PER_MINUTE = 230;
const CALLOUTS = {
  conseil: "Conseil",
  "a-retenir": "À retenir",
  "bon-a-savoir": "Bon à savoir",
  info: "Information",
  attention: "Attention",
};
const CALLOUT_ALIASES = { "à-retenir": "a-retenir", retenir: "a-retenir", "bon-à-savoir": "bon-a-savoir", astuce: "conseil", important: "attention" };

// Image : seuls les fichiers envoyés sur le site (jamais une image externe, qui permettrait de pister les lecteurs)
const IMAGE = /^!\[([^\]\n]{0,200})\]\((\/uploads\/[A-Za-z0-9/_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif))(?:\s+"([^"\n]{0,200})")?\)\s*$/i;
const CAPTION = /^(?:Légende|Legende)\s*:\s*(.{1,300})$/i;
const COURSE = /^\[\[formation:([a-z0-9-]{1,120})\]\]\s*$/;
const BUTTON = /^\[\[bouton:([^|\]\n]{1,80})\|([^\]\s]{1,500})\]\]\s*$/;

function countWords(text) {
  const plain = String(text || "").replace(/```[\s\S]*?```/g, " ").replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\[\[[^\]]*\]\]/g, " ").replace(/[#>*_`[\]():-]/g, " ");
  return (plain.match(/[\p{L}\p{N}’']+/gu) || []).length;
}

// → { html, toc: [{ level: 2|3, id, text }], words, minutes, images: [{ src, alt }] }
// options.courseCard(slug) → HTML de la carte d'une formation publiée, ou null (la ligne disparaît alors)
function renderArticle(source, { courseCard = () => null } = {}) {
  const toc = [];
  const images = [];
  const usedIds = new Set();
  const uniqueId = (text) => {
    const base = slugify(text).slice(0, 60) || "section";
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  };
  const plainOf = (raw) => raw.replace(/\*\*|\*|`/g, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();

  function render(lines, { nested = false } = {}) {
    const blocks = [];
    let paragraph = [];
    let list = null;
    let quote = [];
    let code = null;
    const flushParagraph = () => { if (paragraph.length) blocks.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`); paragraph = []; };
    const flushList = () => { if (list) blocks.push(`<${list.type}>${list.items.map((i) => `<li>${renderInline(i)}</li>`).join("")}</${list.type}>`); list = null; };
    const flushQuote = () => { if (quote.length) blocks.push(`<blockquote>${quote.map((q) => `<p>${renderInline(q)}</p>`).join("")}</blockquote>`); quote = []; };
    const flushAll = () => { flushParagraph(); flushList(); flushQuote(); };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (code) {
        if (/^```/.test(line)) { blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = null; } else code.push(line);
        continue;
      }
      if (/^```/.test(line)) { flushAll(); code = []; continue; }
      if (!line.trim()) { flushAll(); continue; }

      let m;
      // Encadré : jusqu'à la ligne « ::: » (les encadrés ne s'imbriquent pas)
      if (!nested && (m = line.match(/^:::\s*([\p{L}-]{2,30})(?:\s+(.{1,120}))?\s*$/u))) {
        const key = CALLOUT_ALIASES[m[1].toLowerCase()] || m[1].toLowerCase();
        if (Object.hasOwn(CALLOUTS, key)) {
          flushAll();
          const inner = [];
          let j = i + 1;
          for (; j < lines.length && !/^:::\s*$/.test(lines[j]); j++) inner.push(lines[j]);
          i = j; // la ligne « ::: » de fin (ou la fin du texte) est consommée
          const title = m[2] ? renderInline(m[2]) : CALLOUTS[key];
          blocks.push(`<aside class="callout callout-${key}" role="note"><p class="callout-title">${title}</p>${render(inner, { nested: true }).html}</aside>`);
          continue;
        }
      }
      if ((m = line.match(/^(#{1,3})\s+(.{1,300})$/))) {
        flushAll();
        const level = m[1].length === 3 ? 3 : 2; // « # » et « ## » → h2 : le h1 de la page reste unique
        if (nested) { blocks.push(`<p class="callout-heading"><strong>${renderInline(m[2])}</strong></p>`); continue; }
        const text = plainOf(m[2]);
        const id = uniqueId(text);
        toc.push({ level, id, text });
        blocks.push(`<h${level} id="${id}">${renderInline(m[2])}</h${level}>`);
      } else if ((m = line.match(IMAGE))) {
        flushAll();
        const [, alt, src, title] = m;
        const next = lines[i + 1];
        const caption = next && next.match(CAPTION);
        if (caption) i++;
        images.push({ src, alt });
        const img = `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy" decoding="async">`;
        blocks.push(`<figure class="article-figure">${img}${caption ? `<figcaption>${renderInline(caption[1])}</figcaption>` : ""}</figure>`);
      } else if ((m = line.match(COURSE))) {
        flushAll();
        const card = courseCard(m[1]);
        if (card) blocks.push(card);
      } else if ((m = line.match(BUTTON))) {
        flushAll();
        const url = m[2];
        if (isSafeUrl(url)) blocks.push(`<p class="article-cta"><a class="btn btn-primary" href="${escapeHtml(url)}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(m[1].trim())}</a></p>`);
        else paragraph.push(line);
      } else if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
        flushAll();
        blocks.push("<hr>");
      } else if ((m = line.match(/^\s{0,3}[-*+]\s+(.{1,1000})$/))) {
        flushParagraph(); flushQuote();
        if (!list || list.type !== "ul") { flushList(); list = { type: "ul", items: [] }; }
        list.items.push(m[1]);
      } else if ((m = line.match(/^\s{0,3}\d{1,3}[.)]\s+(.{1,1000})$/))) {
        flushParagraph(); flushQuote();
        if (!list || list.type !== "ol") { flushList(); list = { type: "ol", items: [] }; }
        list.items.push(m[1]);
      } else if ((m = line.match(/^>\s?(.{0,1000})$/))) {
        flushParagraph(); flushList();
        quote.push(m[1]);
      } else {
        flushList(); flushQuote();
        // Image refusée (adresse externe ou format inconnu) : simple lien, jamais une image chargée
        paragraph.push(/^!\[/.test(line) ? line.slice(1) : line);
      }
    }
    if (code) blocks.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    flushAll();
    return { html: blocks.join("\n") };
  }

  if (typeof source !== "string" || !source.trim()) return { html: "", toc, words: 0, minutes: 1, images };
  const text = source.slice(0, MAX_LENGTH).replace(/[\u0000-\u0008\u000b-\u001f]/g, "");
  const { html } = render(text.split(/\r?\n/));
  const words = countWords(text);
  return { html, toc, words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)), images };
}

module.exports = { renderArticle, countWords, CALLOUTS, WORDS_PER_MINUTE };
