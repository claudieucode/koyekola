// Page « À propos » : le contenu éditable (Markdown, table site_pages) est découpé en un titre, une introduction et des sections, pour une mise en page éditoriale.
//   « # Titre »            première ligne de titre = titre de la page (sinon le titre par défaut) ;
//   premier paragraphe      = introduction (grand texte d'ouverture) ;
//   « ## Section »          = une section (titre à gauche, texte à droite sur grand écran).
// Le texte reste du Markdown simplifié et sûr (utils/markdown.js : aucune balise HTML saisie ne devient active). Fonction pure : testable sans serveur.
const { renderMarkdown } = require("../utils/markdown");
const { slugify } = require("../utils/format");

const DEFAULT_TITLE = "KOLAKISA, la plateforme pour apprendre à votre rythme";
// Texte par défaut : uniquement des fonctions réellement présentes dans la plateforme (aucune histoire, date, chiffre ni témoignage inventé)
const DEFAULT_ABOUT = `Des formations vidéo, des quiz pour vérifier ce que vous retenez, des ressources à télécharger et un certificat de réussite : tout est réuni au même endroit, sur ordinateur, tablette et mobile.

## Comment se déroule une formation

- **Un programme clair.** Chaque formation est découpée en chapitres et sous-chapitres : vous savez toujours où vous en êtes et ce qu'il reste à voir.
- **Des quiz pour vérifier.** Un seuil de réussite et, selon la formation, un nombre de tentatives limité : le quiz sert à confirmer que l'essentiel est compris.
- **Des ressources à garder.** Les documents associés à une leçon se téléchargent et restent à votre disposition.
- **Votre progression enregistrée.** Vous reprenez exactement là où vous vous étiez arrêté, depuis n'importe quel appareil.

## Un certificat qui se vérifie

Une fois tous les sous-chapitres terminés, quiz réussis compris, un certificat de réussite est délivré. Il porte un numéro : toute personne qui le reçoit peut en contrôler l'authenticité sur le site.

## Un accès durable

L'accès à une formation n'est pas limité dans le temps. Votre espace rassemble vos formations, votre progression et vos certificats.

## Une question avant de commencer ?

Les réponses les plus courantes sont dans la [foire aux questions](/faq). Pour tout le reste, la page [Contact](/contact) vous permet d'écrire directement.`;

const fence = (line) => /^\s*```/.test(line);

// → { title, lead, intro, sections: [{ id, title, html }] } ; title vide = utiliser le titre par défaut
function parse(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  let title = "", inCode = false, current = null;
  const pre = [], sections = [], used = new Set();
  for (const line of lines) {
    if (fence(line)) inCode = !inCode;
    const h = !inCode && /^(#{1,2})\s+(\S.*)$/.exec(line);
    if (h && h[1] === "#" && !title && !sections.length && !pre.some((l) => l.trim())) { title = h[2].trim().replace(/\s+#+\s*$/, "").slice(0, 120); continue; }
    if (h) {
      let id = slugify(h[2]) || "section"; const base = id; for (let i = 2; used.has(id); i += 1) id = `${base}-${i}`; used.add(id);
      current = { id, title: h[2].trim().replace(/\s+#+\s*$/, "").slice(0, 120), lines: [] }; sections.push(current); continue;
    }
    (current ? current.lines : pre).push(line);
  }
  // introduction = premier paragraphe du texte d'ouverture ; le reste de l'ouverture suit en texte courant
  const text = pre.join("\n").trim();
  const cut = text.search(/\n\s*\n/);
  const lead = cut === -1 ? text : text.slice(0, cut), rest = cut === -1 ? "" : text.slice(cut).trim();
  return {
    title, lead: renderMarkdown(lead), intro: renderMarkdown(rest),
    sections: sections.map((s) => ({ id: s.id, title: s.title, html: renderMarkdown(s.lines.join("\n").trim()) })),
  };
}

// Chiffres réels du catalogue (jamais saisis à la main) : formations publiées et non archivées, catégories distinctes
function stats(db) {
  const r = db.prepare("SELECT COUNT(*) n, COUNT(DISTINCT category) c FROM courses WHERE published = 1 AND archived = 0").get();
  return { courses: r.n, categories: r.c };
}

module.exports = { parse, stats, DEFAULT_ABOUT, DEFAULT_TITLE };
