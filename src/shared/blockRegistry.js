// Registre central des blocs de l'éditeur d'articles (DT-4). UNE description par bloc ; les deux moitiés qui doivent rester d'accord
// en dérivent ou y sont vérifiées par un test (tests/editeur-blocs-registre.test.js) :
//   - le nœud de l'éditeur (src/editor/blog/nodes.js, Tiptap) ;
//   - la règle de sanitisation du serveur (src/utils/blogHtml.js).
// Un bloc déclaré ici sans l'une de ces moitiés fait échouer le test : plus de bloc « perdu au premier enregistrement ».
// CommonJS : utilisable par le serveur et par esbuild (éditeur).
//
// Champs : name (nœud Tiptap) · label · category · tag/cls (HTML enregistré) · top (bloc de premier niveau : verrouillable, avec identité) ·
//          sub (nœud interne, jamais inséré seul) · sample (HTML qui doit survivre à la sanitisation, repère = cls) · since (version de schéma d'apparition)
const { DYNAMIC } = require("./dynamicBlocks");
const BLOCKS = [
  // --- Texte (noyau Tiptap) ---
  { name: "paragraph", label: "Paragraphe", category: "Texte", tag: "p", top: true, sample: "<p>Texte</p>", since: 1 },
  { name: "heading", label: "Titre", category: "Texte", tag: "h2", top: true, sample: "<h2>Titre</h2>", since: 1 },
  { name: "bulletList", label: "Liste", category: "Texte", tag: "ul", top: true, sample: "<ul><li><p>a</p></li></ul>", since: 1 },
  { name: "orderedList", label: "Liste numérotée", category: "Texte", tag: "ol", top: true, sample: "<ol><li><p>a</p></li></ol>", since: 1 },
  { name: "taskList", label: "Liste de contrôle", category: "Texte", tag: "ul", top: true, sample: '<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>a</p></li></ul>', since: 1 },
  { name: "blockquote", label: "Citation", category: "Texte", tag: "blockquote", top: true, sample: "<blockquote><p>q</p></blockquote>", since: 1 },
  { name: "codeBlock", label: "Code", category: "Texte", tag: "pre", top: true, sample: "<pre><code>x</code></pre>", since: 1 },
  { name: "kbPreformatted", label: "Préformaté", category: "Texte", tag: "pre", cls: "kb-preformatted", top: true, sample: '<pre class="kb-preformatted">a  b</pre>', since: 2 },
  { name: "kbVerse", label: "Vers", category: "Texte", tag: "pre", cls: "kb-verse", top: true, sample: '<pre class="kb-verse">a\nb</pre>', since: 2 },
  { name: "table", label: "Tableau", category: "Texte", tag: "table", top: true, sample: "<table><tbody><tr><td><p>1</p></td></tr></tbody></table>", since: 1 },
  { name: "horizontalRule", label: "Séparateur", category: "Mise en forme", tag: "hr", top: true, sample: "<hr>", since: 1 },
  { name: "kbAccordion", label: "Détails", category: "Texte", tag: "details", cls: "kb-accordion", top: true, container: true, sample: '<details class="kb-accordion"><summary>R</summary><div class="kb-accordion-body"><p>x</p></div></details>', since: 1 },
  // --- Média ---
  { name: "kbImage", label: "Image", category: "Média", tag: "figure", cls: "kb-image", top: true, sample: '<figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"></figure>', since: 1 },
  { name: "kbGallery", label: "Galerie", category: "Média", tag: "div", cls: "kb-gallery", top: true, sample: '<div class="kb-gallery" data-columns="3"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"></figure></div>', since: 1 },
  { name: "kbVideo", label: "Vidéo", category: "Média", tag: "div", cls: "kb-video", top: true, sample: '<div class="kb-video" data-url="https://youtu.be/dQw4w9WgXcQ"></div>', since: 1 },
  { name: "kbAudio", label: "Audio", category: "Média", tag: "div", cls: "kb-audio", top: true, sample: '<div class="kb-audio" data-src="/uploads/blog/a.mp3"></div>', since: 1 },
  { name: "kbFile", label: "Fichier", category: "Média", tag: "div", cls: "kb-file", top: true, sample: '<div class="kb-file" data-url="/uploads/blog/a.pdf"></div>', since: 2 },
  { name: "kbCover", label: "Couverture", category: "Média", tag: "div", cls: "kb-cover", top: true, container: true, sample: '<div class="kb-cover" data-src="/uploads/thumbnails/a.png"><p>x</p></div>', since: 2 },
  { name: "kbMediaText", label: "Média et texte", category: "Média", tag: "div", cls: "kb-mediatext", top: true, container: true, sample: '<div class="kb-mediatext"><figure class="kb-image"><img src="/uploads/thumbnails/a.png" alt="x"></figure><div class="kb-mediatext-body"><p>x</p></div></div>', since: 2 },
  { name: "kbEmbed", label: "Contenu embarqué", category: "Intégrations", tag: "div", cls: "kb-embed", top: true, sample: '<div class="kb-embed" data-url="https://example.org/a"></div>', since: 1 },
  // --- Mise en forme et en page ---
  { name: "callout", label: "Encadré", category: "Mise en forme", tag: "div", cls: "callout", top: true, container: true, sample: '<div class="callout callout-info" data-callout="info"><p>x</p></div>', since: 1 },
  { name: "kbButton", label: "Bouton", category: "Mise en forme", tag: "p", cls: "kb-button", top: true, sample: '<p class="kb-button"><a href="/catalogue" class="btn btn-primary">Go</a></p>', since: 1 },
  { name: "kbButtons", label: "Groupe de boutons", category: "Mise en forme", tag: "div", cls: "kb-buttons", top: true, container: true, sample: '<div class="kb-buttons"><p class="kb-button"><a href="/a" class="btn btn-primary">A</a></p></div>', since: 1 },
  { name: "kbSpacer", label: "Espaceur", category: "Mise en page", tag: "div", cls: "kb-spacer", top: true, sample: '<div class="kb-spacer" data-size="m"></div>', since: 1 },
  { name: "kbPageBreak", label: "Saut de page", category: "Mise en page", tag: "div", cls: "kb-pagebreak", top: true, sample: '<div class="kb-pagebreak"></div>', since: 1 },
  { name: "kbMore", label: "Lire la suite", category: "Mise en page", tag: "div", cls: "kb-more", top: true, sample: '<div class="kb-more"></div>', since: 2 },
  { name: "kbColumns", label: "Colonnes", category: "Mise en page", tag: "div", cls: "kb-columns", top: true, container: true, sample: '<div class="kb-columns" data-layout="50-50"><div class="kb-column"><p>a</p></div><div class="kb-column"><p>b</p></div></div>', since: 1 },
  { name: "kbGroup", label: "Groupe", category: "Mise en page", tag: "div", cls: "kb-group", top: true, container: true, sample: '<div class="kb-group" data-bg="light"><p>x</p></div>', since: 1 },
  // --- KOLAKISA ---
  { name: "kbCta", label: "Appel à l'action", category: "KOLAKISA", tag: "div", cls: "kb-cta", top: true, container: true, sample: '<div class="kb-cta"><p>x</p></div>', since: 1 },
  { name: "kbFaq", label: "FAQ", category: "KOLAKISA", tag: "div", cls: "kb-faq", top: true, container: true, sample: '<div class="kb-faq"><details class="kb-faq-item"><summary>Q</summary><div class="kb-faq-answer"><p>R</p></div></details></div>', since: 1 },
  { name: "kbSteps", label: "Étapes", category: "KOLAKISA", tag: "ol", cls: "kb-steps", top: true, sample: '<ol class="kb-steps"><li><p>a</p></li></ol>', since: 1 },
  { name: "kbCompare", label: "Comparaison", category: "KOLAKISA", tag: "div", cls: "kb-compare", top: true, container: true, sample: '<div class="kb-compare"><div class="kb-compare-col" data-tone="pro"><p>a</p></div><div class="kb-compare-col" data-tone="con"><p>b</p></div></div>', since: 1 },
  { name: "kbCourse", label: "Formation recommandée", category: "KOLAKISA", tag: "div", cls: "kb-course", top: true, sample: '<div class="kb-course" data-course="excel"></div>', since: 1 },
  { name: "kbNewsletter", label: "Newsletter", category: "KOLAKISA", tag: "div", cls: "kb-newsletter", top: true, sample: '<div class="kb-newsletter"></div>', since: 1 },
  { name: "kbReusable", label: "Bloc synchronisé", category: "Blocs réutilisables", tag: "div", cls: "kb-reusable", top: true, sample: '<div class="kb-reusable" data-ref="1"></div>', since: 1 },
  // --- Widgets dynamiques (rendus par le serveur à l'affichage, limités au site de l'article) : définis dans src/shared/dynamicBlocks.js ---
  ...DYNAMIC.map((d) => ({ name: d.name, label: d.label, category: "Widgets", tag: "div", cls: d.cls, top: true, sample: `<div class="${d.cls}"${d.cls === "kb-rss" ? ' data-url="https://exemple.org/flux.xml"' : ""}></div>`, since: 3, dynamic: true })),
  { name: "kbNextPage", label: "Page suivante", category: "Mise en page", tag: "div", cls: "kb-nextpage", top: true, sample: '<div class="kb-nextpage"></div>', since: 3 },
  // HTML personnalisé : conservé seulement s'il porte la signature du compte créateur (src/utils/customHtml.js) : pas d'exemple « libre » qui survive à la sanitisation
  { name: "kbHtml", label: "HTML personnalisé", category: "Mise en forme", tag: "div", cls: "kb-html", top: true, signed: true, since: 3 },
  // --- Nœuds internes (jamais insérés seuls) ---
  { name: "kbFootnote", label: "Note de bas de page", sub: true, inline: true, tag: "sup", cls: "kb-fn", sample: '<p>x<sup class="kb-fn" data-note="Une note">1</sup></p>', since: 3 },
  { name: "kbColumn", label: "Colonne", sub: true, tag: "div", cls: "kb-column", since: 1 },
  { name: "kbSummary", label: "Résumé", sub: true, tag: "summary", since: 1 },
  { name: "kbAccordionBody", label: "Contenu", sub: true, tag: "div", cls: "kb-accordion-body", since: 1 },
  { name: "kbFaqItem", label: "Question", sub: true, tag: "details", cls: "kb-faq-item", since: 1 },
  { name: "kbFaqAnswer", label: "Réponse", sub: true, tag: "div", cls: "kb-faq-answer", since: 1 },
  { name: "kbCompareCol", label: "Colonne de comparaison", sub: true, tag: "div", cls: "kb-compare-col", since: 1 },
  { name: "kbMediaTextBody", label: "Texte", sub: true, tag: "div", cls: "kb-mediatext-body", since: 2 },
  { name: "kbReusableEdit", label: "Bloc synchronisé (modification)", sub: true, since: 1 },
];

// Version courante du schéma des blocs : augmente quand un bloc est ajouté ou qu'un attribut change de sens.
// Les contenus enregistrés n'ont pas besoin de migration tant que les anciens blocs restent lisibles (c'est le cas de toutes les versions à ce jour).
const SCHEMA_VERSION = Math.max(...BLOCKS.map((b) => b.since));

const byName = new Map(BLOCKS.map((b) => [b.name, b]));
module.exports = { BLOCKS, SCHEMA_VERSION, byName, topNames: () => BLOCKS.filter((b) => b.top).map((b) => b.name), containerNames: () => BLOCKS.filter((b) => b.top && b.container).map((b) => b.name), containerClasses: () => BLOCKS.filter((b) => b.top && b.container).map((b) => b.cls) };
