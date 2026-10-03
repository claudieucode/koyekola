// Éditeur éditorial du blog (Tiptap, sans framework). Source de public/js/blog-editor.js — reconstruire : npm run build:editor
//
// Principes :
//  - le serveur reste la seule autorité : il réassainit le HTML, revérifie les statuts et les contrôles bloquants ;
//  - rien n'est perdu : copie locale à chaque frappe, sauvegarde automatique sur le serveur toutes les quelques secondes ;
//  - l'IA et les suggestions de liens PROPOSENT, l'auteur accepte ou refuse.
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Placeholder } from "@tiptap/extensions";
import { NodeSelection } from "@tiptap/pm/state";
import { BLOG_NODES, CALLOUT_LABELS } from "./blog/nodes";
import { BlockHandle, moveBlock } from "./blog/dragHandle";
import { analyze, norm } from "../utils/seoAnalyzer";

const root = document.querySelector("[data-blog-editor]");
if (root) start();

function start() {
  const DATA = JSON.parse(document.getElementById("be-data").textContent);
  const form = document.getElementById("be-form");
  const $ = (sel, el = root) => el.querySelector(sel);
  const $$ = (sel, el = root) => [...el.querySelectorAll(sel)];
  const field = (name) => form.elements[name];
  let postId = DATA.postId;

  // ---------- Petits outils ----------
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
    return el;
  }
  async function api(url, { method = "GET", json, body, headers = {} } = {}) {
    const opts = { method, credentials: "same-origin", headers: { Accept: "application/json", ...headers } };
    if (json !== undefined) { opts.body = JSON.stringify(json); opts.headers["Content-Type"] = "application/json"; }
    if (body !== undefined) opts.body = body;
    const res = await fetch(url, opts);
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) throw new Error((data && data.error) || `Erreur ${res.status} : l'opération n'a pas abouti.`);
    return data || {};
  }
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const fmtDate = (sqlUtc) => (sqlUtc ? new Date(`${sqlUtc.replace(" ", "T")}Z`).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }) : "—");
  const slugify = (t) => norm(t).replace(/'/g, "").trim().replace(/\s+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120);
  const toast = (text, kind = "ok") => {
    const t = h("div", { class: `be-toast be-toast-${kind}`, role: kind === "error" ? "alert" : "status" }, text);
    document.body.append(t);
    setTimeout(() => t.remove(), 4500);
  };

  // ---------- Fenêtres ----------
  function modal(title, body, actions = [], { wide = false } = {}) {
    const dlg = h("dialog", { class: `be-dialog${wide ? " be-dialog-wide" : ""}`, "aria-labelledby": "be-dlg-title" });
    const close = () => { dlg.close(); dlg.remove(); };
    const foot = h("div", { class: "be-dialog-actions" }, ...actions.map((a) => h("button", { type: "button", class: `btn btn-sm ${a.primary ? "btn-primary" : a.danger ? "btn-danger" : "btn-outline"}`, onclick: async () => { const keep = await a.run?.(close); if (keep !== true) close(); } }, a.label)), h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: close }, "Fermer"));
    dlg.append(h("div", { class: "be-dialog-head" }, h("h2", { id: "be-dlg-title" }, title)), h("div", { class: "be-dialog-body" }, body), foot);
    dlg.addEventListener("cancel", () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
    return { dlg, close };
  }
  const labelled = (label, input, hint) => h("div", { class: "field-group" }, h("label", { for: input.id }, label), input, hint ? h("span", { class: "field-hint" }, hint) : null);
  let uid = 0;
  const input = (attrs) => h("input", { type: "text", id: `be-f${++uid}`, ...attrs });
  const select = (options, value, attrs = {}) => h("select", { id: `be-f${++uid}`, ...attrs }, ...options.map(([v, l]) => h("option", { value: v, selected: String(v) === String(value) }, l)));

  // ---------- L'éditeur ----------
  const fallback = $("#post-content");
  const editor = new Editor({
    element: $("#be-editor"),
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: null, target: null, class: null } },
      }),
      TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false, backgroundColor: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: ({ node }) => (node.type.name === "heading" ? "Titre de section" : "Écrivez ici… (le bouton « + » à gauche insère un bloc : image, vidéo, tableau, encadré…)") }),
      ...BLOG_NODES,
      BlockHandle.configure({ onPlus: () => openBlockMenu() }),
    ],
    content: fallback.value,
    editorProps: { attributes: { class: "be-prose", "aria-label": "Contenu de l'article", role: "textbox", "aria-multiline": "true" } },
  });
  fallback.hidden = true;
  $("[data-content-label]").hidden = true;
  root.classList.add("be-ready");

  // ---------- Barre d'outils ----------
  const toolbar = $("[data-toolbar]");
  toolbar.hidden = false;
  const chain = () => editor.chain().focus();
  // Insertion d'un bloc : si un bloc entier est sélectionné (image, formation…), le nouveau se place APRÈS lui
  // au lieu de le remplacer (comportement par défaut de l'éditeur, qui ferait perdre le bloc sélectionné)
  const ins = () => {
    const sel = editor.state.selection;
    const c = editor.chain().focus();
    if (!(sel instanceof NodeSelection)) return c;
    // Bloc entier sélectionné : on écrit après lui (dans un nouveau paragraphe s'il n'y a rien derrière)
    const after = sel.$from.depth > 0 ? sel.$from.after(1) : sel.to;
    if (after >= editor.state.doc.content.size) c.insertContentAt(after, { type: "paragraph" });
    return c.setTextSelection(after + 1);
  };
  // Bloc complexe (FAQ, tableau, image, encadré…) : jamais imbriqué par accident dans l'encadré, la FAQ ou le tableau
  // où se trouve le curseur ; il se place après le bloc de premier niveau courant
  const CONTAINERS = new Set(["callout", "kbCta", "kbFaq", "kbFaqItem", "kbFaqAnswer", "kbAccordion", "kbAccordionBody", "kbCompare", "kbCompareCol", "kbSteps", "table", "blockquote", "bulletList", "orderedList", "taskList"]);
  function blk(content) {
    const sel = editor.state.selection;
    const { $from } = sel;
    // Curseur (ou bloc sélectionné, ex. le bouton d'un appel à l'action) à l'intérieur d'un conteneur : après le bloc de premier niveau
    for (let d = 1; d <= $from.depth; d++) if (CONTAINERS.has($from.node(d).type.name)) return placeAfter($from.after(1), content);
    if (sel instanceof NodeSelection) return placeAfter(sel.to, content);
    return editor.chain().focus().insertContent(content).run();
  }
  // Insère à une position, puis place le curseur juste après le bloc inséré (pour enchaîner les insertions au bon endroit)
  function placeAfter(pos, content) {
    const size = editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(pos, content).run();
    const end = pos + (editor.state.doc.content.size - size);
    const node = editor.state.doc.nodeAt(Math.max(0, end - 1));
    if (end >= editor.state.doc.content.size || (node && node.isAtom)) editor.chain().insertContentAt(end, { type: "paragraph" }).setTextSelection(end + 1).run();
    else editor.commands.setTextSelection(end);
    return true;
  }
  const cell = (type) => ({ type, content: [{ type: "paragraph" }] });
  const tableNode = (rows, cols) => ({ type: "table", content: Array.from({ length: rows }, (_, r) => ({ type: "tableRow", content: Array.from({ length: cols }, () => cell(r === 0 ? "tableHeader" : "tableCell")) })) });
  const COLORS = [["", "Couleur par défaut"], ["#0b2a40", "Bleu nuit"], ["#0277b6", "Bleu"], ["#1e7a34", "Vert"], ["#b45309", "Orange"], ["#d1121f", "Rouge"], ["#6b21a8", "Violet"], ["#5d7182", "Gris"]];
  const HIGHLIGHTS = [["", "Sans surlignage"], ["#fff3a3", "Jaune"], ["#d1fae5", "Vert"], ["#e0f2fe", "Bleu"], ["#fde2e4", "Rose"]];
  const tools = [];
  const btn = (label, title, run, isActive, extra = {}) => {
    const b = h("button", { type: "button", class: "be-tool", title, "aria-label": title, ...extra }, label);
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", run);
    tools.push({ el: b, isActive });
    return b;
  };
  const group = (...items) => h("div", { class: "be-tool-group", role: "group" }, ...items);
  const formatSelect = select([["p", "Paragraphe"], ["h1", "Titre 1"], ["h2", "Titre 2 (section)"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["code", "Code"]], "p", { class: "be-format", "aria-label": "Format du bloc" });
  formatSelect.addEventListener("change", () => {
    const v = formatSelect.value;
    if (v === "p") chain().setParagraph().run();
    else if (v === "code") chain().setCodeBlock().run();
    else chain().setHeading({ level: Number(v[1]) }).run();
  });
  const colorSelect = select(COLORS, "", { class: "be-color", "aria-label": "Couleur du texte" });
  colorSelect.addEventListener("change", () => { colorSelect.value ? chain().setColor(colorSelect.value).run() : chain().unsetColor().run(); });
  const markSelect = select(HIGHLIGHTS, "", { class: "be-color", "aria-label": "Surlignage" });
  markSelect.addEventListener("change", () => { markSelect.value ? chain().setHighlight({ color: markSelect.value }).run() : chain().unsetHighlight().run(); });
  toolbar.append(
    group(btn("↶", "Annuler (Ctrl+Z)", () => chain().undo().run()), btn("↷", "Rétablir (Ctrl+Maj+Z)", () => chain().redo().run())),
    group(formatSelect),
    group(
      btn(h("strong", {}, "G"), "Gras (Ctrl+B)", () => chain().toggleBold().run(), () => editor.isActive("bold")),
      btn(h("em", {}, "I"), "Italique (Ctrl+I)", () => chain().toggleItalic().run(), () => editor.isActive("italic")),
      btn(h("u", {}, "S"), "Souligné (Ctrl+U)", () => chain().toggleUnderline().run(), () => editor.isActive("underline")),
      btn(h("s", {}, "B"), "Barré", () => chain().toggleStrike().run(), () => editor.isActive("strike")),
      btn(h("span", {}, "x²"), "Exposant", () => chain().toggleSuperscript().run(), () => editor.isActive("superscript")),
      btn(h("span", {}, "x₂"), "Indice", () => chain().toggleSubscript().run(), () => editor.isActive("subscript")),
      btn("</>", "Code dans le texte", () => chain().toggleCode().run(), () => editor.isActive("code")),
    ),
    group(colorSelect, markSelect),
    group(
      btn("⇤", "Aligner à gauche", () => chain().setTextAlign("left").run(), () => editor.isActive({ textAlign: "left" })),
      btn("↔", "Centrer", () => chain().setTextAlign("center").run(), () => editor.isActive({ textAlign: "center" })),
      btn("⇥", "Aligner à droite", () => chain().setTextAlign("right").run(), () => editor.isActive({ textAlign: "right" })),
      btn("☰", "Justifier", () => chain().setTextAlign("justify").run(), () => editor.isActive({ textAlign: "justify" })),
    ),
    group(
      btn("• ≡", "Liste à puces", () => chain().toggleBulletList().run(), () => editor.isActive("bulletList")),
      btn("1. ≡", "Liste numérotée", () => chain().toggleOrderedList().run(), () => editor.isActive("orderedList")),
      btn("☑", "Liste de contrôle (cases à cocher)", () => chain().toggleTaskList().run(), () => editor.isActive("taskList")),
      btn("→", "Imbriquer l'élément de liste", () => chain().sinkListItem(editor.isActive("taskItem") ? "taskItem" : "listItem").run()),
      btn("←", "Sortir d'un niveau de liste", () => chain().liftListItem(editor.isActive("taskItem") ? "taskItem" : "listItem").run()),
    ),
    group(
      btn("❝", "Citation", () => chain().toggleBlockquote().run(), () => editor.isActive("blockquote")),
      btn("🔗", "Lien (Ctrl+K)", () => openLinkDialog(), () => editor.isActive("link")),
      btn("🖼", "Image", () => openImageDialog()),
      btn("▶", "Vidéo", () => openMediaMarker("kbVideo")),
      btn("▦", "Tableau", () => blk(tableNode(3, 3))),
      btn("—", "Séparateur", () => ins().setHorizontalRule().run()),
      btn("⌫", "Effacer la mise en forme", () => chain().unsetAllMarks().clearNodes().run()),
    ),
    group(btn("+ Bloc", "Insérer un bloc (image, galerie, FAQ, étapes…)", () => openBlockMenu(), null, { class: "be-tool be-tool-wide" })),
  );
  // Outils de tableau, visibles seulement dans un tableau
  const tableTools = group(
    btn("+ ligne", "Ajouter une ligne", () => chain().addRowAfter().run()),
    btn("+ colonne", "Ajouter une colonne", () => chain().addColumnAfter().run()),
    btn("− ligne", "Supprimer la ligne", () => chain().deleteRow().run()),
    btn("− colonne", "Supprimer la colonne", () => chain().deleteColumn().run()),
    btn("En-tête", "Ligne d'en-tête", () => chain().toggleHeaderRow().run()),
    btn("Fusionner", "Fusionner ou séparer les cellules", () => chain().mergeOrSplit().run()),
    btn("✕ tableau", "Supprimer le tableau", () => chain().deleteTable().run()),
  );
  tableTools.classList.add("be-table-tools");
  toolbar.append(tableTools);
  editor.setOptions({ editorProps: { ...editor.options.editorProps, handleKeyDown: (view, event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openLinkDialog(); return true; } return false; } } });

  function refreshToolbar() {
    for (const t of tools) if (t.isActive) { const on = t.isActive(); t.el.classList.toggle("is-active", on); t.el.setAttribute("aria-pressed", on ? "true" : "false"); }
    const level = [1, 2, 3, 4].find((l) => editor.isActive("heading", { level: l }));
    formatSelect.value = editor.isActive("codeBlock") ? "code" : level ? `h${level}` : "p";
    tableTools.hidden = !editor.isActive("table");
    refreshBlockBar();
  }

  // ---------- Bloc sélectionné : modifier, déplacer, supprimer ----------
  const blockBar = $("[data-block-bar]");
  const EDITABLE = { kbImage: "Image", kbGallery: "Galerie", kbVideo: "Vidéo", kbAudio: "Audio", kbEmbed: "Intégration", kbCourse: "Formation", kbNewsletter: "Newsletter", kbButton: "Bouton", callout: "Encadré", kbSteps: "Étapes", kbCompare: "Comparaison", table: "Tableau" };
  function currentBlock() {
    const sel = editor.state.selection;
    if (sel instanceof NodeSelection && EDITABLE[sel.node.type.name]) return { node: sel.node, pos: sel.from };
    const $from = sel.$from;
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d);
      if (EDITABLE[node.type.name]) return { node, pos: $from.before(d) };
    }
    return null;
  }
  function refreshBlockBar() {
    const b = currentBlock();
    blockBar.replaceChildren();
    blockBar.hidden = !b;
    if (!b) return;
    const name = b.node.type.name;
    blockBar.append(
      h("span", { class: "be-block-name" }, `Bloc : ${EDITABLE[name]}`),
      name !== "table" ? h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => editBlock(b) }, "Modifier") : null,
      h("button", { type: "button", class: "btn btn-ghost btn-sm", title: "Monter (Alt + flèche haut)", onclick: () => { editor.commands.setNodeSelection(topOf(b.pos)); moveBlock(editor.state, editor.view.dispatch, -1); } }, "↑"),
      h("button", { type: "button", class: "btn btn-ghost btn-sm", title: "Descendre (Alt + flèche bas)", onclick: () => { editor.commands.setNodeSelection(topOf(b.pos)); moveBlock(editor.state, editor.view.dispatch, 1); } }, "↓"),
      h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { editor.chain().focus().setNodeSelection(b.pos).deleteSelection().run(); } }, "Supprimer"),
    );
  }
  const topOf = (pos) => { const $p = editor.state.doc.resolve(pos); return $p.depth === 0 ? pos : $p.before(1); };
  const setAttrsAt = (pos, attrs) => editor.chain().focus().command(({ tr }) => { tr.setNodeMarkup(pos, undefined, { ...tr.doc.nodeAt(pos).attrs, ...attrs }); return true; }).run();
  function editBlock({ node, pos }) {
    const t = node.type.name;
    if (t === "kbImage") return openImageDialog({ pos, attrs: node.attrs });
    if (t === "kbGallery") return openGalleryDialog({ pos, attrs: node.attrs });
    if (["kbVideo", "kbAudio", "kbEmbed"].includes(t)) return openMediaMarker(t, { pos, attrs: node.attrs });
    if (t === "kbCourse") return openCourseDialog({ pos, attrs: node.attrs });
    if (t === "kbButton") return openButtonDialog({ pos, attrs: node.attrs });
    if (t === "callout") return openCalloutDialog({ pos, attrs: node.attrs });
    if (t === "kbSteps") {
      const title = input({ value: node.attrs.title || "", maxlength: 120 });
      return modal("Étapes", labelled("Titre du guide (données structurées « HowTo »)", title, "Ex. « Créer son premier site ». Chaque étape : un titre en gras, puis l'explication."), [{ label: "Appliquer", primary: true, run: () => setAttrsAt(pos, { title: title.value.trim() }) }]);
    }
    if (t === "kbCompare") {
      const selects = [];
      node.forEach((col, offset) => selects.push({ pos: pos + 1 + offset, el: select([["pro", "Pour / avantages"], ["con", "Contre / limites"], ["neutral", "Neutre"]], col.attrs.tone) }));
      return modal("Comparaison", h("div", {}, ...selects.map((s, i) => labelled(`Colonne ${i + 1}`, s.el))), [{ label: "Appliquer", primary: true, run: () => selects.forEach((s) => setAttrsAt(s.pos, { tone: s.el.value })) }]);
    }
    if (t === "kbNewsletter") return toast(DATA.newsletterReady ? "Le formulaire affiché se choisit dans la liste des articles (réglage « newsletter »)." : "Aucun formulaire publié : ce bloc n'apparaîtra pas tant qu'un formulaire d'inscription n'est pas publié dans Marketing.", DATA.newsletterReady ? "ok" : "error");
    return null;
  }

  // ---------- Menu « + Bloc » ----------
  const p = (text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] });
  const BLOCKS = [
    ["Texte", [
      ["Paragraphe", "Texte simple", () => ins().insertContent(p("")).run()],
      ["Titre de section (H2)", "Apparaît dans le sommaire", () => ins().insertContent({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Titre de section" }] }).run()],
      ["Sous-titre (H3)", "Apparaît dans le sommaire (H2 + H3)", () => ins().insertContent({ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Sous-titre" }] }).run()],
      ["Titre 4", "Petit titre, hors sommaire", () => ins().insertContent({ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "Titre" }] }).run()],
      ["Citation", "Mise en avant d'une phrase", () => ins().insertContent({ type: "blockquote", content: [p("Une citation marquante.")] }).run()],
      ["Bloc de code", "Code ou commande", () => ins().insertContent({ type: "codeBlock", content: [{ type: "text", text: "// votre code" }] }).run()],
      ["Séparateur", "Ligne horizontale", () => ins().setHorizontalRule().run()],
      ["Liste de contrôle", "Cases à cocher (checklist)", () => ins().insertContent({ type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [p("Première chose à faire")] }, { type: "taskItem", attrs: { checked: false }, content: [p("Deuxième chose à faire")] }] }).run()],
    ]],
    ["Encadrés", Object.entries(CALLOUT_LABELS).map(([type, label]) => [`Encadré « ${label} »`, "Bloc coloré mis en avant", () => blk({ type: "callout", attrs: { type }, content: [p(type === "a-retenir" ? "L'idée essentielle à retenir." : "Votre texte.")] })])],
    ["Médias", [
      ["Image", "Envoi ou médiathèque, texte alternatif, légende", () => openImageDialog()],
      ["Galerie", "Plusieurs images en grille", () => openGalleryDialog()],
      ["Vidéo", "YouTube, Vimeo ou fichier MP4", () => openMediaMarker("kbVideo")],
      ["Audio", "Fichier MP3 (podcast, extrait)", () => openMediaMarker("kbAudio")],
      ["Intégration", "Adresse d'un contenu externe (sécurisée)", () => openMediaMarker("kbEmbed")],
    ]],
    ["Structure", [
      ["Tableau", "3 × 3 avec en-tête", () => blk(tableNode(3, 3))],
      ["Accordéon", "Contenu dépliable", () => blk({ type: "kbAccordion", content: [{ type: "kbSummary", content: [{ type: "text", text: "Cliquez pour en savoir plus" }] }, { type: "kbAccordionBody", content: [p("Le contenu caché.")] }] })],
      ["FAQ", "Questions / réponses (données structurées FAQPage)", () => blk(faqNode([{ question: "Première question ?", answer: "La réponse." }, { question: "Deuxième question ?", answer: "La réponse." }]))],
      ["Étapes", "Guide pas à pas (données structurées HowTo)", () => blk({ type: "kbSteps", attrs: { title: "" }, content: [1, 2, 3].map((n) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `Étape ${n}`, marks: [{ type: "bold" }] }, { type: "text", text: " : ce qu'il faut faire." }] }] })) })],
      ["Comparaison", "Deux colonnes : pour / contre", () => blk({ type: "kbCompare", content: [["pro", "Avantages"], ["con", "Limites"]].map(([tone, title]) => ({ type: "kbCompareCol", attrs: { tone }, content: [{ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: title }] }, { type: "bulletList", content: [{ type: "listItem", content: [p("Un point")] }] }] })) })],
    ]],
    ["Conversion", [
      ["Appel à l'action", "Encadré avec titre, texte et bouton", () => blk({ type: "kbCta", content: [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Envie d'aller plus loin ?" }] }, p("Une phrase qui donne envie."), { type: "kbButton", attrs: { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center" } }] })],
      ["Bouton", "Lien mis en forme de bouton", () => openButtonDialog()],
      ["Formation recommandée", "Carte d'une formation du catalogue", () => openCourseDialog()],
      ["Newsletter", "Formulaire d'inscription", () => blk({ type: "kbNewsletter" })],
    ]],
  ];
  const faqNode = (items) => ({ type: "kbFaq", content: items.map((i) => ({ type: "kbFaqItem", content: [{ type: "kbSummary", content: [{ type: "text", text: i.question }] }, { type: "kbFaqAnswer", content: String(i.answer).split(/\n{2,}/).map((t) => p(t.trim())) }] })) });
  function openBlockMenu() {
    const search = input({ type: "search", placeholder: "Rechercher un bloc…", "aria-label": "Rechercher un bloc" });
    const list = h("div", { class: "be-block-menu" });
    const render = () => {
      const q = norm(search.value);
      list.replaceChildren();
      for (const [cat, items] of BLOCKS) {
        const shown = items.filter(([label, desc]) => !q || norm(`${label} ${desc} ${cat}`).includes(q));
        if (!shown.length) continue;
        list.append(h("p", { class: "be-block-cat" }, cat), ...shown.map(([label, desc, run]) => h("button", { type: "button", class: "be-block-item", onclick: () => { m.close(); run(); } }, h("strong", {}, label), h("span", {}, desc))));
      }
      if (!list.children.length) list.append(h("p", { class: "field-hint" }, "Aucun bloc ne correspond."));
    };
    search.addEventListener("input", render);
    const m = modal("Insérer un bloc", h("div", {}, search, list), [], { wide: true });
    render();
    search.focus();
  }

  // ---------- Liens ----------
  function openLinkDialog() {
    const attrs = editor.getAttributes("link");
    const rel = String(attrs.rel || "").split(/\s+/);
    const url = input({ type: "text", value: attrs.href || "", placeholder: "https://… ou /cours/…", autocomplete: "off" });
    const search = input({ type: "search", placeholder: "Formation, article, catégorie, page…", autocomplete: "off" });
    const results = h("ul", { class: "be-link-results" });
    const newTab = h("input", { type: "checkbox", checked: attrs.target === "_blank" });
    const opts = Object.fromEntries(["nofollow", "sponsored", "ugc"].map((r) => [r, h("input", { type: "checkbox", checked: rel.includes(r) })]));
    const runSearch = debounce(async () => {
      try {
        const { results: found } = await api(`/formateur/blog/api/liens?q=${encodeURIComponent(search.value)}`);
        results.replaceChildren(...found.map((r) => h("li", {}, h("button", { type: "button", onclick: () => { url.value = r.url; newTab.checked = false; } }, h("span", { class: "be-chip" }, r.label), ` ${r.title}`, h("small", {}, r.url)))));
        if (!found.length) results.append(h("li", { class: "field-hint" }, "Aucun contenu trouvé."));
      } catch (e) { results.replaceChildren(h("li", { class: "form-error" }, e.message)); }
    }, 250);
    search.addEventListener("input", runSearch);
    runSearch();
    const body = h("div", {},
      labelled("Adresse", url, "Adresse externe (https://…) ou chemin interne (/blog/…, /cours/…)."),
      labelled("Rechercher un contenu KOYEKOLA", search), results,
      h("fieldset", { class: "be-fieldset" }, h("legend", {}, "Options"),
        h("label", { class: "checkbox-row" }, newTab, " Ouvrir dans un nouvel onglet"),
        h("label", { class: "checkbox-row" }, opts.nofollow, " nofollow (ne pas transmettre d'autorité)"),
        h("label", { class: "checkbox-row" }, opts.sponsored, " sponsored (lien sponsorisé ou affilié)"),
        h("label", { class: "checkbox-row" }, opts.ugc, " ugc (contenu proposé par un utilisateur)")));
    modal("Lien", body, [
      { label: "Appliquer", primary: true, run: () => {
        const href = url.value.trim();
        if (!/^(https?:\/\/\S+|mailto:\S+|\/(?!\/)\S*|#[\w-]+)$/i.test(href)) { toast("Adresse invalide : https://…, /chemin-interne ou mailto:…", "error"); return true; }
        const relValue = ["nofollow", "sponsored", "ugc"].filter((r) => opts[r].checked);
        if (newTab.checked) relValue.push("noopener", "noreferrer");
        const linkAttrs = { href, target: newTab.checked ? "_blank" : null, rel: relValue.length ? relValue.join(" ") : null };
        if (editor.state.selection.empty && !editor.isActive("link")) ins().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: linkAttrs }] }).run();
        else chain().extendMarkRange("link").setLink(linkAttrs).run();
      } },
      ...(attrs.href ? [{ label: "Retirer le lien", danger: true, run: () => chain().extendMarkRange("link").unsetLink().run() }] : []),
    ]);
    url.focus();
  }

  // ---------- Médiathèque ----------
  // Ouvre la médiathèque ; onPick(media) reçoit le fichier choisi (sinon : simple gestion)
  function openLibrary({ kind = "image", onPick = null } = {}) {
    const q = input({ type: "search", placeholder: "Rechercher (texte alternatif, titre, nom)…" });
    const grid = h("div", { class: "be-library" });
    const upload = h("input", { type: "file", id: `be-f${++uid}`, accept: kind === "image" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : kind === "video" ? "video/mp4,video/webm" : "audio/mpeg,audio/mp4,audio/ogg,audio/wav" });
    const load = async () => {
      try {
        const { media } = await api(`/formateur/blog/api/medias?type=${kind}&q=${encodeURIComponent(q.value)}`);
        grid.replaceChildren(...media.map((m) => {
          const card = h("div", { class: "be-library-item" },
            m.kind === "image" ? h("img", { src: m.path, alt: m.alt || "", loading: "lazy" }) : h("span", { class: "be-library-file" }, m.kind === "video" ? "▶ vidéo" : "♪ audio"),
            h("span", { class: m.alt || m.kind !== "image" ? "be-library-meta" : "be-library-meta be-warn" }, m.kind !== "image" ? m.title || m.path.split("/").pop() : m.alt ? m.alt : "⚠ sans texte alternatif"),
            h("div", { class: "be-library-actions" },
              onPick ? h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => { lib.close(); onPick(m); } }, "Choisir") : null,
              h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => editMedia(m, load) }, "Infos"),
              h("button", { type: "button", class: "btn btn-ghost btn-sm", title: m.used ? `Utilisé par ${m.used} article(s)` : "Supprimer", disabled: m.used ? true : null, onclick: async () => { if (!confirm("Supprimer définitivement ce fichier ?")) return; try { await api(`/formateur/blog/api/medias/${m.id}/supprimer`, { method: "POST" }); load(); } catch (e) { toast(e.message, "error"); } } }, "Supprimer")));
          return card;
        }));
        if (!media.length) grid.append(h("p", { class: "field-hint" }, "Aucun fichier pour le moment : envoyez-en un ci-dessus."));
      } catch (e) { grid.replaceChildren(h("p", { class: "form-error" }, e.message)); }
    };
    q.addEventListener("input", debounce(load, 250));
    upload.addEventListener("change", async () => {
      const file = upload.files[0];
      if (!file) return;
      try {
        const media = await uploadMedia(file, kind);
        upload.value = "";
        if (onPick) { lib.close(); onPick(media); } else load();
      } catch (e) { toast(e.message, "error"); }
    });
    const lib = modal(onPick ? "Choisir dans la médiathèque" : "Médiathèque", h("div", {}, labelled(kind === "image" ? "Envoyer une image" : kind === "video" ? "Envoyer une vidéo (MP4, WebM)" : "Envoyer un fichier audio (MP3…)", upload), q, grid), [], { wide: true });
    load();
  }
  async function uploadMedia(file, kind) {
    const body = new FormData();
    body.append(kind === "image" ? "article_image" : kind === "video" ? "article_video" : "article_audio", file);
    if (kind === "image") {
      const dims = await new Promise((resolve) => { const img = new Image(); img.onload = () => resolve([img.naturalWidth, img.naturalHeight]); img.onerror = () => resolve([0, 0]); img.src = URL.createObjectURL(file); });
      if (dims[0]) { body.append("width", dims[0]); body.append("height", dims[1]); }
    }
    const { media } = await api("/formateur/blog/api/medias", { method: "POST", body });
    return media;
  }
  function editMedia(m, after) {
    const f = Object.fromEntries(["alt", "title", "description", "caption", "credit"].map((k) => [k, k === "description" ? h("textarea", { id: `be-f${++uid}`, rows: 3 }, m[k] || "") : input({ value: m[k] || "" })]));
    modal("Informations du fichier", h("div", {},
      m.kind === "image" ? h("img", { class: "be-media-preview", src: m.path, alt: "" }) : null,
      labelled("Texte alternatif", f.alt, "Décrit l'image pour les personnes malvoyantes et pour Google."), labelled("Titre", f.title), labelled("Description", f.description),
      labelled("Légende par défaut", f.caption), labelled("Crédit", f.credit), h("p", { class: "field-hint" }, `${m.path}${m.width ? ` · ${m.width} × ${m.height} px` : ""}`)), [
      { label: "Enregistrer", primary: true, run: async () => { try { await api(`/formateur/blog/api/medias/${m.id}`, { method: "POST", json: Object.fromEntries(Object.entries(f).map(([k, el]) => [k, el.value])) }); after?.(); toast("Informations enregistrées."); } catch (e) { toast(e.message, "error"); return true; } } },
    ]);
  }
  $("[data-open-library]").addEventListener("click", () => openLibrary());

  // ---------- Image ----------
  function openImageDialog(existing = null) {
    const a = existing ? existing.attrs : { src: "", alt: "", title: "", caption: "", credit: "", align: "center", width: "100", mediaId: null };
    const state = { ...a };
    const preview = h("img", { class: "be-media-preview", src: state.src || "", alt: "", hidden: !state.src });
    const pick = h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => openLibrary({ onPick: (m) => { state.src = m.path; state.mediaId = m.id; preview.src = m.path; preview.hidden = false; if (!alt.value) alt.value = m.alt || ""; if (!caption.value) caption.value = m.caption || ""; if (!credit.value) credit.value = m.credit || ""; if (!title.value) title.value = m.title || ""; } }) }, "Choisir ou envoyer…");
    const alt = input({ value: state.alt, maxlength: 300 });
    const title = input({ value: state.title, maxlength: 200 });
    const caption = input({ value: state.caption, maxlength: 300 });
    const credit = input({ value: state.credit, maxlength: 200 });
    const width = select([["100", "100 %"], ["75", "75 %"], ["66", "66 %"], ["50", "50 %"], ["33", "33 %"], ["25", "25 %"]], state.width);
    const align = select([["center", "Centrée"], ["left", "À gauche (texte autour)"], ["right", "À droite (texte autour)"], ["wide", "Pleine largeur"]], state.align);
    const main = h("input", { type: "checkbox" });
    const altWarn = h("p", { class: "be-warn", hidden: Boolean(state.alt) }, "⚠ Sans texte alternatif, l'image est invisible pour les lecteurs d'écran et pour Google Images.");
    alt.addEventListener("input", () => { altWarn.hidden = Boolean(alt.value.trim()); });
    modal(existing ? "Modifier l'image" : "Insérer une image", h("div", {},
      h("div", { class: "be-row" }, pick), preview,
      labelled("Texte alternatif (obligatoire)", alt, "Décrivez ce que montre l'image, en une phrase."), altWarn,
      labelled("Légende (affichée sous l'image)", caption), labelled("Crédit", credit), labelled("Titre (infobulle)", title),
      h("div", { class: "be-row" }, labelled("Largeur", width), labelled("Alignement", align)),
      h("p", { class: "field-hint" }, "Chargement différé automatique : l'image ne se télécharge que lorsqu'elle approche de l'écran."),
      h("label", { class: "checkbox-row" }, main, " Utiliser aussi comme image principale de l'article")), [
      { label: existing ? "Appliquer" : "Insérer", primary: true, run: () => {
        if (!state.src) { toast("Choisissez d'abord une image.", "error"); return true; }
        const attrs = { src: state.src, mediaId: state.mediaId, alt: alt.value.trim(), title: title.value.trim(), caption: caption.value.trim(), credit: credit.value.trim(), width: width.value, align: align.value };
        if (existing) setAttrsAt(existing.pos, attrs);
        else blk({ type: "kbImage", attrs });
        if (main.checked) setCover(state.src, attrs.alt);
        if (!attrs.alt) toast("Image ajoutée sans texte alternatif : pensez à le compléter.", "error");
      } },
    ]);
  }
  function openGalleryDialog(existing = null) {
    const images = existing ? [...existing.attrs.images] : [];
    const list = h("ul", { class: "be-gallery-edit" });
    const cols = select([["2", "2 colonnes"], ["3", "3 colonnes"], ["4", "4 colonnes"]], existing ? existing.attrs.columns : "3");
    const render = () => list.replaceChildren(...images.map((img, i) => {
      const alt = input({ value: img.alt || "", placeholder: "Texte alternatif", "aria-label": `Texte alternatif de l'image ${i + 1}` });
      alt.addEventListener("input", () => { img.alt = alt.value; });
      const cap = input({ value: img.caption || "", placeholder: "Légende (facultatif)", "aria-label": `Légende de l'image ${i + 1}` });
      cap.addEventListener("input", () => { img.caption = cap.value; });
      return h("li", {}, h("img", { src: img.src, alt: "" }), h("div", {}, alt, cap), h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { images.splice(i, 1); render(); } }, "Retirer"));
    }));
    render();
    modal(existing ? "Modifier la galerie" : "Galerie", h("div", {}, labelled("Disposition", cols), list,
      h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => openLibrary({ onPick: (m) => { images.push({ src: m.path, alt: m.alt || "", caption: m.caption || "" }); render(); } }) }, "+ Ajouter une image")), [
      { label: existing ? "Appliquer" : "Insérer", primary: true, run: () => {
        if (images.length < 2) { toast("Une galerie contient au moins 2 images.", "error"); return true; }
        const attrs = { images: images.map((i) => ({ src: i.src, alt: (i.alt || "").trim(), caption: (i.caption || "").trim() })), columns: cols.value };
        if (existing) setAttrsAt(existing.pos, attrs); else blk({ type: "kbGallery", attrs });
      } },
    ], { wide: true });
  }

  // Vidéo, audio, intégration
  function openMediaMarker(type, existing = null) {
    const a = existing ? existing.attrs : {};
    if (type === "kbAudio") {
      const state = { src: a.src || "" };
      const chosen = h("p", { class: "field-hint" }, state.src || "Aucun fichier choisi.");
      const title = input({ value: a.title || "", maxlength: 200 });
      return modal("Audio", h("div", {}, h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => openLibrary({ kind: "audio", onPick: (m) => { state.src = m.path; chosen.textContent = m.path; if (!title.value) title.value = m.title || ""; } }) }, "Choisir ou envoyer un fichier audio…"), chosen, labelled("Titre (affiché sous le lecteur)", title)), [
        { label: existing ? "Appliquer" : "Insérer", primary: true, run: () => { if (!state.src) { toast("Choisissez un fichier audio.", "error"); return true; } const attrs = { src: state.src, title: title.value.trim() }; if (existing) setAttrsAt(existing.pos, attrs); else blk({ type: "kbAudio", attrs }); } },
      ]);
    }
    const url = input({ value: a.url || "", placeholder: type === "kbVideo" ? "https://www.youtube.com/watch?v=… ou https://vimeo.com/…" : "https://…" });
    const caption = input({ value: a.caption || "", maxlength: 200 });
    const upload = type === "kbVideo" ? h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => openLibrary({ kind: "video", onPick: (m) => { url.value = m.path; } }) }, "Ou envoyer un fichier vidéo…") : null;
    return modal(type === "kbVideo" ? "Vidéo" : "Intégration", h("div", {},
      labelled("Adresse", url, type === "kbVideo" ? "YouTube et Vimeo s'affichent dans un lecteur (sans cookies publicitaires pour YouTube)." : "Pour des raisons de sécurité, seuls YouTube et Vimeo deviennent un lecteur intégré ; les autres adresses s'affichent comme un lien."),
      upload, labelled("Légende", caption)), [
      { label: existing ? "Appliquer" : "Insérer", primary: true, run: () => {
        const v = url.value.trim();
        if (!/^(https:\/\/\S+|\/uploads\/blog\/\S+)$/.test(v)) { toast("Adresse invalide : elle doit commencer par https://", "error"); return true; }
        const attrs = { url: v, caption: caption.value.trim() };
        if (existing) setAttrsAt(existing.pos, attrs); else blk({ type, attrs });
      } },
    ]);
  }
  function openCourseDialog(existing = null) {
    if (!DATA.courses.length) return toast("Aucune formation publiée à recommander pour le moment.", "error");
    const sel = select(DATA.courses.map((c) => [c.slug, c.title]), existing ? existing.attrs.slug : DATA.courses[0].slug);
    modal("Formation recommandée", labelled("Formation", sel, "Sa carte (image, titre, prix, lien) est affichée dans l'article ; elle disparaît d'elle-même si la formation est dépubliée."), [
      { label: existing ? "Appliquer" : "Insérer", primary: true, run: () => { const attrs = { slug: sel.value }; if (existing) setAttrsAt(existing.pos, attrs); else blk({ type: "kbCourse", attrs }); } },
    ]);
  }
  function openButtonDialog(existing = null) {
    const a = existing ? existing.attrs : { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center", newTab: false };
    const text = input({ value: a.text, maxlength: 80 });
    const href = input({ value: a.href, placeholder: "/catalogue ou https://…" });
    const variant = select([["primary", "Plein (principal)"], ["outline", "Contour (secondaire)"]], a.variant);
    const align = select([["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], a.align);
    const newTab = h("input", { type: "checkbox", checked: a.newTab });
    modal("Bouton", h("div", {}, labelled("Texte", text), labelled("Adresse", href), h("div", { class: "be-row" }, labelled("Style", variant), labelled("Alignement", align)), h("label", { class: "checkbox-row" }, newTab, " Ouvrir dans un nouvel onglet")), [
      { label: existing ? "Appliquer" : "Insérer", primary: true, run: () => {
        if (!text.value.trim() || !/^(https?:\/\/\S+|\/(?!\/)\S*|mailto:\S+)$/i.test(href.value.trim())) { toast("Texte et adresse valides obligatoires.", "error"); return true; }
        const attrs = { text: text.value.trim(), href: href.value.trim(), variant: variant.value, align: align.value, newTab: newTab.checked };
        if (existing) setAttrsAt(existing.pos, attrs); else blk({ type: "kbButton", attrs });
      } },
    ]);
  }
  function openCalloutDialog(existing) {
    const type = select(Object.entries(CALLOUT_LABELS), existing.attrs.type);
    const title = input({ value: existing.attrs.title || "", placeholder: "Titre par défaut", maxlength: 120 });
    modal("Encadré", h("div", {}, labelled("Type", type), labelled("Titre personnalisé (facultatif)", title)), [{ label: "Appliquer", primary: true, run: () => setAttrsAt(existing.pos, { type: type.value, title: title.value.trim() }) }]);
  }

  // ---------- Panneaux (onglets) ----------
  const tabs = $$("[data-tab]");
  function showTab(key) {
    for (const t of tabs) {
      const on = t.dataset.tab === key;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      $(`#panel-${t.dataset.tab}`).hidden = !on;
    }
    if (key === "structure") refreshStructure();
    if (key === "publication") refreshPublication();
    if (key === "media") refreshMedia();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => showTab(t.dataset.tab));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      showTab(next.dataset.tab);
    });
  });

  // ---------- Contenu : étiquettes, sous-catégories, temps de lecture ----------
  const tagsValue = $("[data-tags-value]");
  const tagList = $("[data-tag-list]");
  const tagInput = $("[data-tag-input]");
  let tags = tagsValue.value.split(",").map((t) => t.trim()).filter(Boolean);
  const renderTags = () => {
    tagsValue.value = tags.join(", ");
    tagList.replaceChildren(...tags.map((t, i) => h("li", { class: "be-chip" }, t, h("button", { type: "button", "aria-label": `Retirer l'étiquette ${t}`, onclick: () => { tags.splice(i, 1); renderTags(); changed(); } }, "×"))));
  };
  const addTag = () => {
    const t = tagInput.value.replace(/,/g, " ").replace(/\s+/g, " ").trim();
    if (!t) return;
    const known = DATA.tags.find((x) => norm(x) === norm(t));
    if (!tags.some((x) => norm(x) === norm(t)) && tags.length < 10) tags.push(known || t);
    tagInput.value = "";
    renderTags();
    changed();
  };
  tagInput.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } });
  tagInput.addEventListener("change", addTag);
  renderTags();
  const subList = $("#dl-subcategories");
  const categoryInput = $("#post-category");
  const refreshSubcategories = () => {
    const cat = norm(categoryInput.value);
    subList.replaceChildren(...DATA.subcategories.filter((s) => norm(s.category) === cat).map((s) => h("option", { value: s.subcategory })));
  };
  categoryInput.addEventListener("input", refreshSubcategories);
  refreshSubcategories();

  // ---------- Compteurs, aperçus, analyse ----------
  const counters = $$("[data-count-for]");
  const refreshCounters = () => counters.forEach((c) => {
    const el = document.getElementById(c.dataset.countFor);
    const n = el.value.length;
    const max = Number(c.dataset.max);
    c.textContent = `${n} / ${max}`;
    c.classList.toggle("is-over", n > max);
  });
  const siteHost = DATA.siteUrl.replace(/^https?:\/\//, "");
  const currentSlug = () => field("slug").value.trim() || slugify(field("title").value) || "article";
  const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trim()}…` : text);
  function refreshPreviews() {
    const title = field("seo_title").value.trim() || field("title").value.trim() || "Titre de l'article";
    const desc = field("seo_description").value.trim() || field("excerpt").value.trim() || "Ajoutez une meta description : sinon Google choisira lui-même un extrait.";
    $("[data-google-preview]").replaceChildren(h("span", { class: "be-g-site" }, "KOYEKOLA"), h("span", { class: "be-g-url" }, `${siteHost} › blog › ${currentSlug()}`), h("span", { class: "be-g-title" }, cut(`${title} · KOYEKOLA`, 62)), h("span", { class: "be-g-desc" }, cut(desc, 158)));
    const ogTitle = field("og_title").value.trim() || title;
    const ogDesc = field("og_description").value.trim() || desc;
    const ogImg = imagePicks.og.current() || imagePicks.cover.current();
    $("[data-social-preview='og']").replaceChildren(ogImg ? h("img", { src: ogImg, alt: "" }) : h("div", { class: "be-s-noimg" }, "Pas d'image : le partage sera peu visible"), h("div", { class: "be-s-body" }, h("span", { class: "be-s-host" }, siteHost.toUpperCase()), h("strong", {}, cut(ogTitle, 88)), h("span", {}, cut(ogDesc, 110))));
    const xImg = imagePicks.twitter.current() || ogImg;
    const large = field("twitter_card").value !== "summary";
    $("[data-social-preview='x']").replaceChildren(h("div", { class: large ? "be-x be-x-large" : "be-x" }, xImg ? h("img", { src: xImg, alt: "" }) : null, h("div", { class: "be-s-body" }, h("strong", {}, cut(field("twitter_title").value.trim() || ogTitle, 70)), h("span", {}, cut(field("twitter_description").value.trim() || ogDesc, 110)), h("span", { class: "be-s-host" }, siteHost))));
  }
  const STATUS_LABEL = { good: "BON", improve: "À AMÉLIORER", problem: "PROBLÈME" };
  const GROUP_LABEL = { keyword: "Mot-clé", seo: "Référencement", structure: "Contenu et structure", media: "Images", links: "Liens", readability: "Lisibilité" };
  let lastAnalysis = null;
  function refreshAnalysis() {
    const html = editor.getHTML();
    const r = analyze({
      title: field("title").value, seoTitle: field("seo_title").value, metaDescription: field("seo_description").value, slug: currentSlug(), canonical: field("canonical_url").value,
      siteUrl: DATA.siteUrl, focusKeyword: field("focus_keyword").value, secondaryKeywords: field("secondary_keywords").value, html,
      hasCover: Boolean(imagePicks.cover.current()), coverAlt: field("cover_alt").value,
    });
    lastAnalysis = r;
    const box = $("[data-analysis]");
    const groups = {};
    for (const c of r.checks) (groups[c.group] = groups[c.group] || []).push(c);
    box.replaceChildren(
      h("p", { class: "be-analysis-summary" }, h("span", { class: "be-pill be-good" }, `${r.summary.good} bon`), h("span", { class: "be-pill be-improve" }, `${r.summary.improve} à améliorer`), h("span", { class: "be-pill be-problem" }, `${r.summary.problem} problème${r.summary.problem > 1 ? "s" : ""}`)),
      ...Object.entries(groups).map(([g, list]) => h("details", { class: "be-analysis-group", open: list.some((c) => c.status !== "good") },
        h("summary", {}, GROUP_LABEL[g] || g),
        h("ul", {}, ...list.map((c) => h("li", { class: `be-check be-${c.status}` }, h("span", { class: "be-check-status" }, STATUS_LABEL[c.status]), h("span", {}, h("strong", {}, c.label), c.advice ? h("small", {}, c.advice) : null)))))),
    );
    const dot = $("[data-seo-dot]");
    dot.className = `be-tab-dot ${r.summary.problem ? "be-problem" : r.summary.improve ? "be-improve" : "be-good"}`;
    dot.title = `${r.summary.problem} problème(s), ${r.summary.improve} point(s) à améliorer`;
    const minutes = field("reading_minutes").value;
    $("[data-stats]").textContent = `${r.words} mots · environ ${r.minutes} min de lecture · ${r.headings.filter((x) => x.level === 2).length} section(s)`;
    $("[data-minutes-hint]").textContent = minutes ? `Calcul automatique : ${r.minutes} min (vous l'avez fixé à ${minutes} min).` : `Calculé automatiquement : ${r.minutes} min (230 mots par minute).`;
  }

  // ---------- Images principale, de partage et X ----------
  const imagePicks = {};
  function makePick(key, initialPath, hiddenField, removeField, fileInput) {
    const box = $(`[data-image-pick="${key}"]`);
    const state = { path: initialPath || null, objectUrl: null };
    const render = () => {
      box.replaceChildren(
        state.objectUrl || state.path ? h("img", { src: state.objectUrl || state.path, alt: "" }) : h("span", { class: "be-s-noimg" }, key === "cover" ? "Aucune image principale" : "Image par défaut"),
        h("div", { class: "be-pick-actions" },
          h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => openLibrary({ onPick: (m) => { state.path = m.path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = m.path; field(removeField).value = ""; if (key === "cover" && !field("cover_alt").value) field("cover_alt").value = m.alt || ""; render(); changed(); } }) }, "Médiathèque"),
          state.objectUrl || state.path ? h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => { state.path = null; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = ""; field(removeField).value = "1"; render(); changed(); } }, "Retirer") : null),
      );
    };
    fileInput.addEventListener("change", () => { const f = fileInput.files[0]; state.objectUrl = f ? URL.createObjectURL(f) : null; field(removeField).value = ""; render(); changed(); });
    render();
    imagePicks[key] = { current: () => state.objectUrl || state.path, set: (path) => { state.path = path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = path; field(removeField).value = ""; render(); }, saved: (path) => { state.path = path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = ""; field(removeField).value = ""; render(); } };
  }
  makePick("cover", DATA.coverPath, "cover_media", "remove_cover", $("#post-cover"));
  makePick("og", DATA.ogImagePath, "og_image_media", "remove_og_image", $("#post-og-image"));
  makePick("twitter", DATA.twitterImagePath, "twitter_image_media", "remove_twitter_image", $("#post-tw-image"));
  function setCover(path, alt) { imagePicks.cover.set(path); if (alt && !field("cover_alt").value) field("cover_alt").value = alt; changed(); }

  // ---------- Structure : plan, fil d'Ariane, schémas, maillage ----------
  function headingsOf() {
    const out = [];
    editor.state.doc.descendants((node, pos) => { if (node.type.name === "heading") out.push({ level: node.attrs.level, text: node.textContent, pos }); });
    return out;
  }
  function refreshStructure() {
    const depth = field("toc_depth").value === "2" ? 2 : 3;
    const enabled = form.querySelector('input[type="checkbox"][name="toc_enabled"]').checked;
    const hs = headingsOf();
    const outline = $("[data-outline]");
    outline.replaceChildren(...hs.map((x) => h("li", { class: `be-outline-l${x.level}${x.level === 1 || x.level === 4 || (x.level === 3 && depth === 2) ? " is-out" : ""}` }, h("button", { type: "button", onclick: () => { editor.chain().focus().setTextSelection(x.pos + 1).scrollIntoView().run(); } }, `H${x.level} · ${x.text || "(titre vide)"}`))));
    if (!hs.length) outline.append(h("li", { class: "field-hint" }, "Aucun titre : ajoutez des titres de section (H2) pour structurer l'article et créer le sommaire."));
    else if (!enabled) outline.prepend(h("li", { class: "field-hint" }, "Sommaire désactivé : les titres restent dans l'article."));
    else if (hs.filter((x) => x.level === 2).length < 2) outline.prepend(h("li", { class: "field-hint" }, "Le sommaire s'affiche à partir de 2 titres H2."));
    const cat = field("category").value.trim();
    $("[data-crumbs]").textContent = ["Accueil", "Blog", ...(cat ? [cat] : []), field("title").value.trim() || "Article"].join(" › ");
    const json = editor.getJSON();
    const has = (type) => JSON.stringify(json).includes(`"type":"${type}"`);
    const schemaType = field("schema_type").value;
    $("[data-schema]").replaceChildren(
      h("li", {}, `✓ ${schemaType} : titre, description, image, auteur, éditeur, dates, page`),
      h("li", {}, `✓ BreadcrumbList : ${cat ? "Accueil › Blog › catégorie › article" : "Accueil › Blog › article"}`),
      h("li", {}, has("kbFaq") ? "✓ FAQPage : généré depuis votre bloc FAQ" : "– FAQPage : ajoutez un bloc FAQ pour l'obtenir"),
      h("li", {}, has("kbSteps") ? "✓ HowTo : généré depuis votre bloc Étapes" : "– HowTo : ajoutez un bloc Étapes pour l'obtenir"),
    );
  }
  $$("[data-toc-option]").forEach((el) => el.addEventListener("change", refreshStructure));
  $("#post-schema").addEventListener("change", refreshStructure);
  const linkedUrls = () => { const out = []; editor.state.doc.descendants((n) => { for (const m of n.marks || []) if (m.type.name === "link") out.push(m.attrs.href); }); return out; };
  $("[data-suggest]").addEventListener("click", async () => {
    const box = $("[data-suggestions]");
    box.replaceChildren(h("li", { class: "field-hint" }, "Analyse du texte…"));
    try {
      const { suggestions } = await api("/formateur/blog/api/suggestions", { method: "POST", json: { text: `${field("title").value} ${editor.getText()}`, postId, linked: linkedUrls() } });
      box.replaceChildren(...suggestions.map((s) => h("li", { class: "be-suggestion" }, h("span", { class: "be-chip" }, s.label), h("strong", {}, s.title), h("small", {}, `${s.url} — ${s.reason}`),
        h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => {
          if (editor.state.selection.empty) { toast("Sélectionnez d'abord, dans l'article, le mot ou l'expression à transformer en lien.", "error"); return; }
          chain().setLink({ href: s.url, target: null, rel: null }).run();
          toast(`Lien ajouté vers « ${s.title} ».`);
        } }, "Lier la sélection"))));
      if (!suggestions.length) box.append(h("li", { class: "field-hint" }, "Aucune suggestion : le texte ne mentionne pas encore de formation ou d'article existant."));
    } catch (e) { box.replaceChildren(h("li", { class: "form-error" }, e.message)); }
  });

  // ---------- Média : images de l'article ----------
  function refreshMedia() {
    const list = $("[data-image-list]");
    const items = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "kbImage") items.push({ src: node.attrs.src, alt: node.attrs.alt, pos, node });
      if (node.type.name === "kbGallery") for (const img of node.attrs.images || []) items.push({ src: img.src, alt: img.alt, pos, node, gallery: true });
    });
    list.replaceChildren(...items.map((it) => h("li", { class: it.alt ? "" : "be-warn" }, h("img", { src: it.src, alt: "" }), h("span", {}, it.alt || "⚠ Texte alternatif manquant"), h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => { editor.commands.setNodeSelection(it.pos); editBlock({ node: it.node, pos: it.pos }); } }, "Modifier"))));
    if (!items.length) list.append(h("li", { class: "field-hint" }, "Aucune image dans le contenu."));
  }

  // ---------- Publication : statut, date, liste de contrôle, versions ----------
  const statusSelect = $("[data-status-select]");
  const dateInput = $("[data-date-input]");
  // La date enregistrée (UTC) est affichée en heure locale
  if (dateInput.value && dateInput.dataset.utc === "1") {
    const d = new Date(`${dateInput.value}:00Z`);
    if (!Number.isNaN(d.getTime())) dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const initialDate = dateInput.value;
  function syncStatus() {
    field("status").value = statusSelect.value;
    const scheduled = statusSelect.value === "scheduled";
    $("[data-date-hint]").textContent = scheduled ? "L'article sera publié automatiquement à cette date." : statusSelect.value === "published" ? "Modifiable : par exemple pour antidater un article importé." : "Utilisée à la publication.";
    $("[data-status-badge]").textContent = DATA.statuses[statusSelect.value];
  }
  statusSelect.addEventListener("change", () => { syncStatus(); refreshPublication(); changed(); });
  dateInput.addEventListener("change", changed);
  syncStatus();
  const dateUtc = () => { if (!dateInput.value) return ""; if (dateInput.value === initialDate && statusSelect.value !== "scheduled") return ""; const d = new Date(dateInput.value); return Number.isNaN(d.getTime()) ? "" : d.toISOString(); };

  function checklist() {
    const html = editor.getHTML();
    const text = editor.getText().trim();
    const r = lastAnalysis || { checks: [] };
    const okCheck = (id) => { const c = r.checks.find((x) => x.id === id); return c ? c.status !== "problem" : true; };
    const images = []; editor.state.doc.descendants((n) => { if (n.type.name === "kbImage") images.push(n.attrs.alt); if (n.type.name === "kbGallery") for (const i of n.attrs.images || []) images.push(i.alt); });
    const canonical = field("canonical_url").value.trim();
    return [
      { label: "Titre présent", ok: Boolean(field("title").value.trim()), blocking: true },
      { label: "Contenu rédigé", ok: Boolean(text) || /<(img|figure)\b|kb-(video|audio|embed|course|newsletter)/.test(html), blocking: true },
      { label: "H1 correct (aucun titre 1 dans le contenu)", ok: !headingsOf().some((x) => x.level === 1) },
      { label: "Résumé présent", ok: Boolean(field("excerpt").value.trim()) },
      { label: "Image principale", ok: Boolean(imagePicks.cover.current()) },
      { label: "Textes alternatifs des images", ok: images.every(Boolean) && (!imagePicks.cover.current() || Boolean(field("cover_alt").value.trim())) },
      { label: "Titre SEO (ou titre court)", ok: okCheck("seo-title") },
      { label: "Meta description", ok: Boolean(field("seo_description").value.trim()) },
      { label: "Adresse (slug)", ok: Boolean(currentSlug()) },
      { label: "Adresse canonique valide", ok: !canonical || /^https:\/\/\S+$/i.test(canonical) },
      { label: "Catégorie", ok: Boolean(field("category").value.trim()) },
      { label: "Étiquettes", ok: tags.length > 0 },
      { label: "Liens internes", ok: linkedUrls().some((u) => /^\//.test(u) || u.startsWith(DATA.siteUrl)) },
      { label: "Aperçu social (image de partage)", ok: Boolean(imagePicks.og.current() || imagePicks.cover.current()) },
      { label: "Données structurées", ok: Boolean(field("title").value.trim()) },
      { label: "Article relu", ok: $("[data-reviewed]").checked },
    ];
  }
  function refreshPublication() {
    $("[data-checklist]").replaceChildren(...checklist().map((c) => h("li", { class: c.ok ? "be-good" : c.blocking ? "be-problem" : "be-improve" }, h("span", { "aria-hidden": "true" }, c.ok ? "☑" : "☐"), ` ${c.label} `, h("small", {}, c.ok ? "" : c.blocking ? "— bloquant" : "— recommandé"))));
    $("[data-dates]").textContent = DATA.createdAt ? `Créé le ${fmtDate(DATA.createdAt)} · modifié le ${fmtDate(DATA.updatedAt)}${DATA.publishedAt ? ` · publication : ${fmtDate(DATA.publishedAt)}` : ""}` : "Pas encore enregistré.";
    renderVersions();
  }
  $("[data-reviewed]").addEventListener("change", refreshPublication);
  function renderVersions() {
    const list = $("[data-versions]");
    list.replaceChildren(...DATA.revisions.map((r, i) => h("li", {},
      h("span", { class: "be-version-when" }, fmtDate(r.created_at)), h("span", { class: "be-version-who" }, r.author || "—"), h("span", { class: "be-version-note" }, r.note || "Enregistrement"),
      h("span", { class: "be-version-actions" },
        h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => viewVersion(r) }, "Consulter"),
        i > 0 ? h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: () => restoreVersion(r) }, "Restaurer") : h("span", { class: "be-hint" }, "actuelle")))));
    if (!DATA.revisions.length) list.append(h("li", { class: "field-hint" }, "Les versions apparaîtront après le premier enregistrement."));
  }
  async function viewVersion(r) {
    try {
      const v = await api(`/formateur/blog/${postId}/versions/${r.id}`);
      const body = h("div", { class: "be-version-view" }, h("p", { class: "field-hint" }, `${fmtDate(v.created_at)} · ${v.note}`), h("h2", {}, v.title), v.excerpt ? h("p", { class: "article-lead" }, v.excerpt) : null);
      const content = h("div", { class: "markdown article-content" });
      content.innerHTML = v.html; // HTML déjà assaini et rendu par le serveur
      body.append(content);
      modal("Version enregistrée", body, [{ label: "Restaurer cette version", primary: true, run: () => restoreVersion(r) }], { wide: true });
    } catch (e) { toast(e.message, "error"); }
  }
  async function restoreVersion(r) {
    if (!confirm(`Restaurer la version du ${fmtDate(r.created_at)} ? La version actuelle reste dans l'historique.`)) return true;
    try {
      await api(`/formateur/blog/${postId}/versions/${r.id}/restaurer`, { method: "POST", headers: { "x-blog-editor": "1" } });
      dirty = false;
      localDraft.clear();
      location.reload();
    } catch (e) { toast(e.message, "error"); }
    return true;
  }

  // ---------- Enregistrement, sauvegarde automatique, copie locale ----------
  const saveState = $("[data-save-state]");
  let dirty = false;
  let saving = false;
  let lastServerAutosave = 0;
  const setState = (text, cls = "") => { saveState.textContent = text; saveState.className = `be-save-state ${cls}`; };
  const localDraft = {
    key: () => `be-draft-${postId || "nouveau"}`,
    write() { try { localStorage.setItem(this.key(), JSON.stringify({ at: Date.now(), title: field("title").value, excerpt: field("excerpt").value, content: editor.getHTML() })); } catch { /* stockage indisponible */ } },
    read() { try { return JSON.parse(localStorage.getItem(this.key()) || "null"); } catch { return null; } },
    clear() { try { localStorage.removeItem(this.key()); localStorage.removeItem("be-draft-nouveau"); } catch { /* rien */ } },
  };
  function changed() {
    dirty = true;
    setState("Modifications non enregistrées", "is-dirty");
    localDraft.write();
    scheduleAutosave();
    refreshLater();
  }
  const refreshLater = debounce(() => { refreshCounters(); refreshPreviews(); refreshAnalysis(); if (!$("#panel-structure").hidden) refreshStructure(); if (!$("#panel-publication").hidden) refreshPublication(); if (!$("#panel-media").hidden) refreshMedia(); }, 350);
  function formPayload({ withFiles }) {
    fallback.value = editor.getHTML();
    field("published_at_utc").value = dateUtc();
    const data = new FormData(form);
    if (!withFiles) for (const name of ["thumbnail", "og_image", "twitter_image"]) data.delete(name);
    return data;
  }
  async function ensurePost() {
    if (postId) return postId;
    const body = new FormData();
    body.append("title", field("title").value);
    const r = await api("/formateur/blog/api/brouillon", { method: "POST", body });
    adopt(r);
    return postId;
  }
  function adopt(r) {
    const before = localDraft.key();
    postId = r.id;
    form.action = `/formateur/blog/${r.id}/modifier`;
    history.replaceState(null, "", `/formateur/blog/${r.id}/modifier`);
    if (r.slug && !field("slug").readOnly && !field("slug").value) field("slug").placeholder = r.slug;
    try { localStorage.removeItem(before); } catch { /* rien */ }
  }
  const scheduleAutosave = debounce(() => autosave(), 2500);
  async function autosave() {
    if (!dirty || saving) return;
    try {
      setState("Enregistrement…", "is-saving");
      const id = await ensurePost();
      await api(`/formateur/blog/${id}/autosave`, { method: "POST", body: formPayload({ withFiles: false }) });
      lastServerAutosave = Date.now();
      setState(`Brouillon enregistré automatiquement à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, "is-auto");
    } catch (e) {
      setState("Modifications non enregistrées (connexion ?)", "is-dirty");
    }
  }
  async function save({ status } = {}) {
    if (saving) return false;
    if (status) { statusSelect.value = status; syncStatus(); }
    if (!field("title").value.trim()) { toast("Le titre est obligatoire.", "error"); field("title").focus(); return false; }
    saving = true;
    setState("Enregistrement…", "is-saving");
    try {
      const url = postId ? `/formateur/blog/${postId}/modifier` : "/formateur/blog/nouveau";
      const r = await api(url, { method: "POST", body: formPayload({ withFiles: true }), headers: { "x-blog-editor": "1" } });
      if (!postId) adopt({ id: r.id, slug: r.slug });
      dirty = false;
      localDraft.clear();
      DATA.status = r.status;
      DATA.publishedAt = r.publishedAt ?? DATA.publishedAt;
      DATA.updatedAt = r.updatedAt;
      if (r.revisions) DATA.revisions = r.revisions;
      for (const [key, col] of [["cover", "coverPath"], ["og", "ogImagePath"], ["twitter", "twitterImagePath"]]) if (r[col] !== undefined) imagePicks[key].saved(r[col]);
      if (r.slug) { field("slug").value = r.slug; if (r.publishedAt) field("slug").readOnly = true; }
      field("remove_cover").value = ""; field("remove_og_image").value = ""; field("remove_twitter_image").value = "";
      setState(`Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`, "is-saved");
      $("[data-publish]").textContent = r.status === "published" ? "Mettre à jour" : "Publier…";
      refreshPublication();
      refreshPreviews();
      return true;
    } catch (e) {
      setState("Modifications non enregistrées", "is-dirty");
      toast(e.message, "error");
      return false;
    } finally { saving = false; }
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); save().then((ok) => ok && toast("Article enregistré.")); });
  document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save().then((ok) => ok && toast("Article enregistré.")); } });
  window.addEventListener("beforeunload", (e) => { if (dirty) { localDraft.write(); e.preventDefault(); e.returnValue = ""; } });
  form.addEventListener("input", (e) => { if (e.target.closest(".be-panels, .be-main") && e.target !== fallback) changed(); });
  form.addEventListener("change", (e) => { if (e.target.type === "checkbox" || e.target.tagName === "SELECT") changed(); });
  editor.on("update", changed);
  editor.on("selectionUpdate", refreshToolbar);
  editor.on("transaction", refreshToolbar);

  // Publier : liste de contrôle, puis publication immédiate ou programmée
  $("[data-publish]").addEventListener("click", () => {
    refreshAnalysis();
    const items = checklist();
    const blocking = items.filter((c) => c.blocking && !c.ok);
    const advice = items.filter((c) => !c.blocking && !c.ok);
    const when = h("input", { type: "datetime-local", id: `be-f${++uid}`, value: statusSelect.value === "scheduled" ? dateInput.value : "" });
    const body = h("div", {},
      blocking.length ? h("div", { class: "be-note be-problem" }, h("strong", {}, "À corriger avant de publier :"), h("ul", {}, ...blocking.map((c) => h("li", {}, c.label)))) : null,
      advice.length ? h("div", { class: "be-note" }, h("strong", {}, "Recommandé (non bloquant) :"), h("ul", {}, ...advice.map((c) => h("li", {}, c.label)))) : h("p", { class: "be-good" }, "✓ Tout est prêt."),
      labelled("Programmer la publication (facultatif)", when, "Laissez vide pour publier tout de suite."));
    modal(DATA.status === "published" ? "Mettre à jour l'article publié" : "Publier l'article", body, blocking.length ? [] : [
      { label: "Publier maintenant", primary: true, run: async () => { if (when.value) { toast("Une date est choisie : utilisez « Programmer ».", "error"); return true; } const ok = await save({ status: "published" }); if (ok) toast("Article publié."); } },
      { label: "Programmer", run: async () => { if (!when.value || new Date(when.value) <= new Date()) { toast("Choisissez une date dans le futur.", "error"); return true; } dateInput.value = when.value; const ok = await save({ status: "scheduled" }); if (ok) toast(`Publication programmée le ${new Date(when.value).toLocaleString("fr-FR")}.`); } },
    ]);
  });

  // Restauration : sauvegarde automatique du serveur ou copie locale plus récente que la version enregistrée
  (function offerRestore() {
    const serverSaved = DATA.updatedAt ? Date.parse(`${DATA.updatedAt.replace(" ", "T")}Z`) : 0;
    const local = localDraft.read() || (postId ? null : null);
    const auto = DATA.autosave ? { at: Date.parse(`${DATA.autosave.savedAt.replace(" ", "T")}Z`), ...DATA.autosave.data } : null;
    const candidates = [local, auto].filter((c) => c && c.at > serverSaved + 1000 && (c.content || c.title));
    const best = candidates.sort((a, b) => b.at - a.at)[0];
    // Même texte que la version enregistrée (seule l'écriture du code diffère) : rien à proposer
    const plain = (html) => new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent.replace(/\s+/g, " ").trim();
    if (!best || (plain(best.content) === plain(editor.getHTML()) && (best.title ?? field("title").value) === field("title").value && (best.excerpt ?? field("excerpt").value) === field("excerpt").value)) return;
    const banner = $("[data-restore]");
    $("[data-restore-text]").textContent = `Une version plus récente (${new Date(best.at).toLocaleString("fr-FR")}) a été enregistrée automatiquement avant la fermeture de la page.`;
    banner.hidden = false;
    $("[data-restore-yes]").addEventListener("click", () => {
      if (typeof best.title === "string") field("title").value = best.title;
      if (typeof best.excerpt === "string") field("excerpt").value = best.excerpt;
      if (typeof best.content === "string") editor.commands.setContent(best.content);
      banner.hidden = true;
      changed();
      toast("Version restaurée : vérifiez-la puis enregistrez.");
    });
    $("[data-restore-no]").addEventListener("click", async () => {
      banner.hidden = true;
      localDraft.clear();
      if (postId && DATA.autosave) { try { await api(`/formateur/blog/${postId}/autosave/abandonner`, { method: "POST" }); } catch { /* rien */ } }
    });
  })();

  // ---------- Aperçus ----------
  const previewMenu = $("[data-preview-menu]");
  const previewToggle = $("[data-preview-toggle]");
  previewToggle.addEventListener("click", () => { previewMenu.hidden = !previewMenu.hidden; previewToggle.setAttribute("aria-expanded", String(!previewMenu.hidden)); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".be-menu-wrap")) { previewMenu.hidden = true; previewToggle.setAttribute("aria-expanded", "false"); } });
  $$("[data-preview]").forEach((b) => b.addEventListener("click", async () => {
    previewMenu.hidden = true;
    const kind = b.dataset.preview;
    if (kind === "google") { showTab("seo"); $("[data-google-preview]").scrollIntoView({ block: "center" }); return; }
    if (kind === "social") { showTab("social"); return; }
    try {
      const id = await ensurePost();
      if (dirty) await autosave(); // l'aperçu montre la version en cours ; sans modification, la version enregistrée
      const widths = { desktop: 1280, tablet: 820, mobile: 390 };
      const frame = h("iframe", { class: "be-preview-frame", title: "Aperçu de l'article", src: `/formateur/blog/${id}/apercu?t=${Date.now()}` });
      const wrap = h("div", { class: "be-preview-wrap" }, frame);
      const setDevice = (k) => { frame.style.width = `${widths[k]}px`; const scale = Math.min(1, (wrap.clientWidth - 8) / widths[k]); frame.style.transform = `scale(${scale})`; frame.style.height = `${Math.round(780 / scale)}px`; wrap.style.height = "780px"; devices.forEach((d) => d.setAttribute("aria-pressed", String(d.dataset.k === k))); };
      const devices = Object.keys(widths).map((k) => h("button", { type: "button", class: "btn btn-outline btn-sm", "data-k": k, onclick: () => setDevice(k) }, { desktop: "Ordinateur", tablet: "Tablette", mobile: "Mobile" }[k]));
      modal("Aperçu", h("div", {}, h("div", { class: "be-row" }, ...devices), wrap), [], { wide: true });
      requestAnimationFrame(() => setDevice(kind));
    } catch (e) { toast(e.message, "error"); }
  }));

  // ---------- Assistant IA ----------
  const aiBox = $("[data-ai-result]");
  const selectionText = () => { const { from, to } = editor.state.selection; return from === to ? "" : editor.state.doc.textBetween(from, to, "\n\n"); };
  const toParagraphs = (text) => String(text).split(/\n{2,}/).map((t) => t.trim()).filter(Boolean).map((t) => p(t));
  function findText(needle) {
    let found = null;
    editor.state.doc.descendants((node, pos) => {
      if (found || !node.isText) return !found;
      const i = node.text.indexOf(needle);
      if (i >= 0) found = { from: pos + i, to: pos + i + needle.length };
      return !found;
    });
    return found;
  }
  $$("[data-ai]").forEach((b) => b.addEventListener("click", async () => {
    const action = b.dataset.ai;
    const range = { from: editor.state.selection.from, to: editor.state.selection.to };
    const selected = selectionText();
    aiBox.replaceChildren(h("p", { class: "field-hint" }, "L'IA réfléchit… (quelques secondes)"));
    $$("[data-ai]").forEach((x) => { x.disabled = true; });
    try {
      const r = await api("/formateur/blog/api/ia", { method: "POST", json: { action, text: selected, article: editor.getText({ blockSeparator: "\n\n" }), title: field("title").value, keyword: field("focus_keyword").value } });
      renderProposal(action, r, range);
    } catch (e) {
      aiBox.replaceChildren(h("p", { class: "form-error" }, e.message));
    } finally { $$("[data-ai]").forEach((x) => { x.disabled = !DATA.aiConfigured; }); }
  }));
  function renderProposal(action, r, range) {
    const res = r.result;
    const reject = h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: () => aiBox.replaceChildren(h("p", { class: "field-hint" }, "Proposition refusée : rien n'a changé.")) }, "Refuser");
    const done = (msg) => { aiBox.replaceChildren(h("p", { class: "be-good" }, `✓ ${msg}`)); changed(); };
    const card = (...children) => aiBox.replaceChildren(h("div", { class: "be-ai-card" }, h("p", { class: "be-ai-label" }, `Proposition — ${r.label}`), ...children));
    if (res.proposals) {
      const name = `ai-${Date.now()}`;
      const radios = res.proposals.map((text, i) => h("label", { class: "checkbox-row" }, h("input", { type: "radio", name, value: text, checked: i === 0 }), ` ${text} `, h("small", {}, `(${text.length} car.)`)));
      return card(...radios, h("div", { class: "be-row" }, h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => {
        const chosen = aiBox.querySelector(`input[name="${name}"]:checked`);
        if (!chosen) return;
        if (action === "titre") field("title").value = chosen.value; else field("seo_description").value = chosen.value;
        done(action === "titre" ? "Titre remplacé." : "Meta description remplie.");
      } }, "Accepter"), reject));
    }
    if (action === "resumer") return card(h("blockquote", {}, res.text), h("div", { class: "be-row" }, h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => { field("excerpt").value = res.text.slice(0, 300); done("Résumé rempli."); } }, "Utiliser comme résumé"), reject));
    if (action === "faq") return card(h("ol", {}, ...res.items.map((i) => h("li", {}, h("strong", {}, i.question), h("br"), i.answer))), h("div", { class: "be-row" }, h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => { editor.chain().focus().insertContentAt(editor.state.doc.content.size, [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Questions fréquentes" }] }, faqNode(res.items)]).run(); done("FAQ ajoutée à la fin de l'article."); } }, "Ajouter à la fin de l'article"), reject));
    if (action === "mots_cles") return card(h("p", {}, h("strong", {}, "Principal : "), res.focus), h("p", {}, h("strong", {}, "Secondaires : "), res.secondary.join(", ")), h("p", { class: "field-hint" }, res.explanation), h("div", { class: "be-row" }, h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => { field("focus_keyword").value = res.focus; field("secondary_keywords").value = res.secondary.join(", "); done("Mots-clés remplis (onglet SEO)."); } }, "Accepter"), reject));
    if (action === "liens") {
      if (!res.links.length) return card(h("p", {}, "Aucun lien pertinent trouvé dans le texte actuel."));
      const boxes = res.links.map((l) => ({ l, cb: h("input", { type: "checkbox", checked: true }) }));
      return card(h("ul", {}, ...boxes.map(({ l, cb }) => h("li", {}, h("label", { class: "checkbox-row" }, cb, ` « ${l.anchor} » → ${l.url}`), h("small", {}, l.reason)))), h("div", { class: "be-row" }, h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => {
        let n = 0;
        for (const { l, cb } of boxes) { if (!cb.checked) continue; const at = findText(l.anchor); if (at) { editor.chain().setTextSelection(at).setLink({ href: l.url, target: null, rel: null }).run(); n++; } }
        done(`${n} lien(s) ajouté(s).`);
      } }, "Ajouter les liens cochés"), reject));
    }
    // Réécriture d'un passage : remplace la sélection faite au moment de la demande
    return card(h("div", { class: "be-ai-text" }, ...toParagraphs(res.text).map((x) => h("p", {}, x.content[0]?.text || ""))), res.changes && res.changes.length ? h("ul", { class: "field-hint" }, ...res.changes.map((c) => h("li", {}, c))) : null,
      h("div", { class: "be-row" }, h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: () => {
        const valid = range.to > range.from && range.to <= editor.state.doc.content.size;
        if (valid) editor.chain().focus().insertContentAt(range, toParagraphs(res.text)).run();
        else editor.chain().focus().insertContent(toParagraphs(res.text)).run();
        done("Passage remplacé (Ctrl+Z pour annuler).");
      } }, "Remplacer le passage"), reject));
  }

  // ---------- Premier affichage ----------
  refreshToolbar();
  refreshCounters();
  refreshPreviews();
  refreshAnalysis();
  renderVersions();
  setState(DATA.postId ? "Enregistré" : "Nouvel article : pas encore enregistré", DATA.postId ? "is-saved" : "");
  if (!DATA.aiConfigured) $$("[data-ai]").forEach((x) => { x.disabled = true; });
}
