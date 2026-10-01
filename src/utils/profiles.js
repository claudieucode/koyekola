// Profils du public visé (« À qui s'adresse cette formation ? ») : chaque élément d'une liste devient
// { title, description, icon }. Fonctionne pour toutes les formations, quel que soit le format enregistré :
//  - ancien format : texte collé tel quel (souvent du Markdown : « * **Les débutants** qui souhaitent… »),
//  - nouveau format : liste de l'éditeur, où le titre est écrit en gras au début de l'élément.
// Aucun caractère Markdown ne sort de ce module : ni « * », ni « ** », ni tiret de liste.
const MAX_PROFILES = 30;
const BULLET = /^([*+-]|\d{1,3}[.)])\s+/;

const escapeHtml = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Lignes d'une liste saisie en texte : puces retirées, ligne d'introduction (« Cette formation s'adresse à : ») ignorée
function listLines(text) {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const severalLines = lines.length > 1;
  return lines
    .filter((l) => !(severalLines && !BULLET.test(l) && /:\s*$/.test(l)))
    .map((l) => l.replace(BULLET, "").trim())
    .filter((l) => l.replace(/[*_\s-]/g, ""));
}

// Texte → HTML sûr : **gras** et *italique* deviennent de vraies balises, tout le reste est échappé.
// Les astérisques mal fermés sont supprimés : ils ne doivent jamais s'afficher.
function inlineMarkdownToHtml(text) {
  let html = escapeHtml(text);
  html = html.replace(/\*\*([^*\n]{1,300}?)\*\*/g, "<strong>$1</strong>").replace(/__([^_\n]{1,300}?)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*\s][^*\n]{0,300}?)\*(?!\*)/g, "$1<em>$2</em>");
  return html.replace(/\*+/g, "");
}

// Texte brut sans aucune marque Markdown
function stripMarkdown(text) {
  return String(text)
    .replace(BULLET, "")
    .replace(/\*\*([^*]*?)\*\*/g, "$1")
    .replace(/__([^_]*?)__/g, "$1")
    .replace(/\*+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const tidyTitle = (text) => text.replace(/^[\s:—–-]+|[\s:.,;—–-]+$/g, "").trim();

// Un élément → { title, description }
//  1. « **Titre** suite »  : le gras de tête est le titre ; une suite qui prolonge la phrase est recollée au titre
//  2. « début **gras** fin » : le titre est « début + gras », la description est la phrase entière
//  3. sans mise en forme  : court = titre seul ; long = début de phrase en titre, phrase entière en description
function parseProfile(raw) {
  const s = String(raw).replace(/\s+/g, " ").trim();
  let title = "";
  let description = "";

  const lead = s.match(/^\*\*([^*]+?)\*\*(.*)$/);
  const middle = lead ? null : s.match(/^([^*]*?)\*\*([^*]+?)\*\*(.*)$/);
  if (lead) {
    title = tidyTitle(stripMarkdown(lead[1]));
    const explicitSeparator = /^\s*[:—–-]/.test(lead[2]);
    const rest = stripMarkdown(lead[2]).replace(/^[\s:—–-]+/, "").trim();
    if (rest) {
      if (explicitSeparator) description = rest.charAt(0).toUpperCase() + rest.slice(1);
      else description = /^\p{Ll}/u.test(rest) ? `${title} ${rest}` : rest;
    }
  } else if (middle && middle[1].trim()) {
    title = tidyTitle(stripMarkdown(middle[1] + middle[2]));
    description = stripMarkdown(s);
  } else {
    const plain = stripMarkdown(s);
    if (plain.length <= 90) {
      title = tidyTitle(plain);
    } else {
      const cut = [...plain.matchAll(/,| qui | que | pour | afin | et | souhaitant /g)].map((m) => m.index).find((i) => i >= 10 && i <= 90);
      title = tidyTitle(cut === undefined ? plain : plain.slice(0, cut));
      description = plain;
    }
  }

  if (!title) return null;
  if (description === title) description = "";
  return { title, description, icon: audienceIcon(title) };
}

// Icône selon le sens du profil (sans tenir compte des accents ni de la casse)
function audienceIcon(title) {
  const t = String(title).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/etudiant|apprenant|eleve|passionn|universit/.test(t)) return "graduation";
  if (/entrepreneur|professionnel|freelance|independant|salarie|dirigeant|manager|artisan|commercant|patron/.test(t)) return "briefcase";
  if (/createur|videaste|video|contenu|youtub|montage|realisat|cinema|photograph/.test(t)) return "video";
  if (/\btoutes?\b|\btous\b|\bpublic\b|equipe|groupe|curieux/.test(t)) return "users";
  return "user";
}

// Profils à partir de lignes déjà séparées (avec ou sans marques Markdown)
const parseAudience = (lines) => lines.map(parseProfile).filter(Boolean).slice(0, MAX_PROFILES);

// Ancien format : texte enregistré tel quel
const audienceFromText = (text) => parseAudience(listLines(text).filter((l) => !/:\s*$/.test(l)));

// Nouveau format : éléments de l'éditeur ({ html }) ; le gras devient « ** » pour réutiliser la même analyse
function audienceFromItems(items) {
  const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  return parseAudience(items.map((item) => decode(item.html.replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**").replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, ""))));
}

module.exports = { listLines, inlineMarkdownToHtml, stripMarkdown, parseAudience, audienceFromText, audienceFromItems, audienceIcon, escapeHtml };
