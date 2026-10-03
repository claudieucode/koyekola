// Éditeur d'articles du blog, dans l'esprit de l'éditeur de blocs Gutenberg (WordPress) — moteur Tiptap, sans framework.
// Source de public/js/blog-editor.js — reconstruire : npm run build:editor
//
// Interface : barre supérieure (insertion « + », annuler/rétablir, vue d'ensemble, titre du document, brouillon, aperçu,
// publier, réglages, options), barre d'outils flottante au-dessus du bloc sélectionné, commande « / », bouton « + » des
// paragraphes vides, panneau d'insertion et vue en liste à gauche, barre latérale « Article / Bloc », panneau de publication.
// Principes : le serveur reste la seule autorité (il réassainit tout) ; rien n'est perdu (copie locale + sauvegarde
// automatique) ; l'IA et les suggestions de liens PROPOSENT, l'auteur décide.
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Placeholder, Focus } from "@tiptap/extensions";
import { NodeSelection, TextSelection } from "@tiptap/pm/state";
import { BLOG_NODES, CALLOUT_LABELS } from "./blog/nodes";
import { BlockHandle, moveBlock, startBlockDrag } from "./blog/dragHandle";
import { analyze, norm } from "../utils/seoAnalyzer";

const root = document.querySelector("[data-blog-editor]");

// Icônes (24 × 24) dans le style de la bibliothèque d'icônes de WordPress
const ICONS = {
  paragraph: "M18.3 4H9.9v-.1l-.9.2c-2.3.4-4 2.4-4 4.8s1.7 4.4 4 4.8l.7.1V20h1.5V5.5h2.9V20h1.5V5.5h2.7V4z",
  heading: "M6 5V18.5911L12 13.8473L18 18.5911V5H6Z",
  h: "M6.2 5.2v13.4l5.8-4.8 5.8 4.8V5.2z",
  list: "M4 4v1.5h16V4H4zm8 8.5h8V11h-8v1.5zM4 20h16v-1.5H4V20zm4-8c0-1.1-.9-2-2-2s-2 .9-2 2 .9 2 2 2 2-.9 2-2z",
  ordered: "M11.1 15.8H20v-1.5h-8.9v1.5zm0-8.6v1.5H20V7.2h-8.9zM6 13c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1zM6 6.6c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z",
  quote: "M13 6v6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H13zm-9 6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8V6H4v6z",
  code: "M20.8 10.7l-4.3-4.3-1.1 1.1 4.3 4.3c.1.1.1.3 0 .4l-4.3 4.3 1.1 1.1 4.3-4.3c.7-.8.7-1.9 0-2.6zM4.2 11.8l4.3-4.3-1-1-4.3 4.3c-.7.7-.7 1.8 0 2.5l4.3 4.3 1.1-1.1-4.3-4.3c-.2-.1-.2-.3-.1-.4z",
  separator: "M4.5 12.5v4H3V7h1.5v3.987h15V7H21v9.5h-1.5v-4h-15Z",
  image: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 4.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0L11.9 14 9 12c-.3-.2-.6-.2-.8 0l-3.6 2.6V5c-.1-.3.1-.5.4-.5zm14 15H5c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1L16 12l3.5 3.4V19c0 .3-.2.5-.5.5z",
  gallery: "M16.375 4.5H4.625a.125.125 0 0 0-.125.125v8.254l2.859-1.54a.75.75 0 0 1 .68-.016l2.384 1.142 2.89-2.074a.75.75 0 0 1 .874 0l2.313 1.66V4.625a.125.125 0 0 0-.125-.125ZM18 12.65V4.625A1.625 1.625 0 0 0 16.375 3H4.625A1.625 1.625 0 0 0 3 4.625v11.75A1.625 1.625 0 0 0 4.625 18h11.75A1.625 1.625 0 0 0 18 16.375V12.65ZM6 21v-1.5h13.25a.25.25 0 0 0 .25-.25V6H21v13.25A1.75 1.75 0 0 1 19.25 21H6Z",
  video: "M18.7 3H5.3C4 3 3 4 3 5.3v13.4C3 20 4 21 5.3 21h13.4c1.3 0 2.3-1 2.3-2.3V5.3C21 4 20 3 18.7 3zm.8 15.7c0 .4-.4.8-.8.8H5.3c-.4 0-.8-.4-.8-.8V5.3c0-.4.4-.8.8-.8h13.4c.4 0 .8.4.8.8v13.4zM10 15l5-3-5-3v6z",
  audio: "M17.7 4.3c-1.2 0-2.8 0-3.8 1-.6.6-.9 1.5-.9 2.6V14c-.6-.6-1.5-1-2.5-1C8.6 13 7 14.6 7 16.5S8.6 20 10.5 20c1.5 0 2.8-1 3.3-2.3.5-.8.7-1.8.7-2.5V7.9c0-.7.2-1.2.5-1.6.6-.6 1.8-.6 2.8-.6h.3V4.3h-.4z",
  embed: "M19 3H5c-.6 0-1 .4-1 1v7c0 .5.4 1 1 1h14c.5 0 1-.4 1-1V4c0-.6-.4-1-1-1zM5.5 10.5v-.4l1.8-1.3 1.3.8c.3.2.7.2.9-.1L11 8.1l2.4 2.4H5.5zm13 0h-2.9l-4-4c-.3-.3-.8-.3-1.1 0L8.9 8l-1.2-.8c-.3-.2-.6-.2-.9 0l-1.3 1V4.5h13v6zM4 20h9v-1.5H4V20zm0-4h16v-1.5H4V16z",
  table: "M4 6v11.5h16V6H4zm1.5 1.5h6V11h-6V7.5zm0 8.5v-3.5h6V16h-6zm13 0H13v-3.5h5.5V16zM13 11V7.5h5.5V11H13z",
  details: "M4 16h10v1.5H4V16Zm0-4.5h16V13H4v-1.5ZM10 7h10v1.5H10V7Z M4 6.4l3 1.85-3 1.85V6.4Z",
  faq: "M12 4.75a7.25 7.25 0 100 14.5 7.25 7.25 0 000-14.5zM3.25 12a8.75 8.75 0 1117.5 0 8.75 8.75 0 01-17.5 0zM12 8.75a1.5 1.5 0 01.167 2.99c-.465.052-.917.44-.917 1.01V14h1.5v-.845A3 3 0 109 10.25h1.5a1.5 1.5 0 011.5-1.5zM11.25 15v1.5h1.5V15h-1.5z",
  steps: "M5 5.5h3V7H5V5.5Zm0 5h3V12H5v-1.5Zm0 5h3V17H5v-1.5ZM10 6h9v1.5h-9V6Zm0 5h9v1.5h-9V11Zm0 5h9v1.5h-9V16Z",
  columns: "M19 6H6c-1.1 0-2 .9-2 2v9c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-4.1 1.5v10H10v-10h4.9zM5.5 17V8c0-.3.2-.5.5-.5h2.5v10H6c-.3 0-.5-.2-.5-.5zm14 0c0 .3-.2.5-.5.5h-2.6v-10H19c.3 0 .5.2.5.5v9z",
  button: "M8 12.5h8V11H8v1.5Z M19 6.5H5a2 2 0 0 0-2 2V15a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2ZM5 8h14a.5.5 0 0 1 .5.5V15a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8.5A.5.5 0 0 1 5 8Z",
  cta: "M4 5h16v14H4V5zm1.5 1.5v11h13v-11h-13zM7 9h10v1.5H7V9zm2 4h6v2.5H9V13z",
  course: "M12 3 2 8l10 5 8-4v6h1.5V8L12 3zm-6 9.4V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.6l-6 3-6-3z",
  newsletter: "M3 7c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm2-.5h14c.1 0 .2 0 .3.1L12 12 4.7 6.6c.1-.1.2-.1.3-.1Zm-.5 1.9V17c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5V8.4l-7.6 5.6a.75.75 0 0 1-.8 0L4.5 8.4Z",
  checklist: "M17 7H9v1.5h8V7Zm0 4H9v1.5h8V11Zm-8 4h8v1.5H9V15ZM5.8 6.6l1-1 .7.7-1.7 1.7-1-1 .7-.7.3.3Zm0 4l1-1 .7.7-1.7 1.7-1-1 .7-.7.3.3Zm0 4l1-1 .7.7-1.7 1.7-1-1 .7-.7.3.3Z",
  callout: "M12 3.2c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8 0-4.8-4-8.8-8.8-8.8zm0 16c-4 0-7.2-3.3-7.2-7.2C4.8 8 8 4.8 12 4.8s7.2 3.3 7.2 7.2c0 4-3.2 7.2-7.2 7.2zM11 17h2v-6h-2v6zm0-8h2V7h-2v2z",
  bold: "M14.7 11.3c1-.6 1.5-1.6 1.5-3 0-2.3-1.3-3.4-4-3.4H7v14h5.8c1.4 0 2.5-.3 3.3-1 .8-.7 1.2-1.7 1.2-2.9.1-1.9-.8-3.1-2.6-3.7zm-5.1-4h2.3c.6 0 1.1.1 1.4.4.3.3.5.7.5 1.2s-.2 1-.5 1.2c-.3.3-.8.4-1.4.4H9.6V7.3zm4.6 9c-.4.3-1 .4-1.7.4H9.6v-3.9h2.9c.7 0 1.3.2 1.7.5.4.3.6.8.6 1.5s-.2 1.2-.6 1.5z",
  italic: "M12.5 5L10 19h1.9l2.5-14z",
  link: "M10 17.389H8.444A5.194 5.194 0 1 1 8.444 7H10v1.5H8.444a3.694 3.694 0 0 0 0 7.389H10v1.5ZM14 7h1.556a5.194 5.194 0 0 1 0 10.39H14v-1.5h1.556a3.694 3.694 0 0 0 0-7.39H14V7Zm-4.5 6h5v-1.5h-5V13Z",
  chevronDown: "M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z",
  more: "M13 19h-2v-2h2v2zm0-6h-2v-2h2v2zm0-6h-2V5h2v2z",
  up: "M6.5 12.4L12 8l5.5 4.4-.9 1.2L12 10l-4.5 3.6-1-1.2z",
  down: "M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z",
  drag: "M8 7h2V5H8v2zm0 6h2v-2H8v2zm0 6h2v-2H8v2zm6-14v2h2V5h-2zm0 8h2v-2h-2v2zm0 6h2v-2h-2v2z",
  alignLeft: "M13 5.5H4V4h9v1.5Zm7 7H4V11h16v1.5Zm-7 7H4V18h9v1.5Z",
  alignCenter: "M7.5 5.5h9V4h-9v1.5Zm-3.5 7h16V11H4v1.5Zm3.5 7h9V18h-9v1.5Z",
  alignRight: "M11.111 5.5H20V4h-8.889v1.5ZM4 12.5h16V11H4v1.5Zm7.111 7H20V18h-8.889v1.5Z",
  plus: "M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z",
  search: "M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6S16.3 5 13 5zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z",
};

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
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
    return el;
  }
  function svg(name, size = 24) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", size);
    s.setAttribute("height", size);
    s.setAttribute("aria-hidden", "true");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", ICONS[name] || ICONS.paragraph);
    p.setAttribute("fill", "currentColor");
    s.append(p);
    return s;
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
  // Avis en bas à gauche (« snackbar » de WordPress)
  const toast = (text, kind = "ok") => {
    const t = h("div", { class: `wp-snackbar${kind === "error" ? " is-error" : ""}`, role: kind === "error" ? "alert" : "status" }, text);
    document.body.append(t);
    setTimeout(() => t.remove(), 4500);
  };

  // ---------- Fenêtres (modales WordPress) ----------
  function modal(title, body, actions = [], { wide = false } = {}) {
    const dlg = h("dialog", { class: `wp-modal${wide ? " is-wide" : ""}`, "aria-labelledby": "wp-modal-title" });
    const close = () => { dlg.close(); dlg.remove(); };
    const foot = actions.length ? h("div", { class: "wp-modal-actions" }, ...actions.map((a) => h("button", { type: "button", class: a.primary ? "wp-btn-primary" : a.danger ? "wp-btn-danger" : "wp-btn-secondary", onclick: async () => { const keep = await a.run?.(close); if (keep !== true) close(); } }, a.label))) : null;
    dlg.append(h("div", { class: "wp-modal-head" }, h("h1", { id: "wp-modal-title" }, title), h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Fermer", onclick: close }, "×")), h("div", { class: "wp-modal-body" }, body), foot);
    dlg.addEventListener("cancel", () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
    return { dlg, close };
  }
  let uid = 0;
  const input = (attrs) => h("input", { type: "text", id: `wp-f${++uid}`, ...attrs });
  const textarea = (attrs, value = "") => h("textarea", { id: `wp-f${++uid}`, rows: 3, ...attrs }, value);
  const select = (options, value, attrs = {}) => h("select", { id: `wp-f${++uid}`, ...attrs }, ...options.map(([v, l]) => h("option", { value: v, selected: String(v) === String(value) }, l)));
  const control = (label, el, help) => h("div", { class: "wp-control" }, h("label", { for: el.id, class: "wp-label" }, label), el, help ? h("p", { class: "wp-help" }, help) : null);
  const checkbox = (label, checked, onchange) => { const cb = h("input", { type: "checkbox", id: `wp-f${++uid}`, checked }); cb.addEventListener("change", () => onchange(cb.checked)); return h("label", { class: "wp-checkbox", for: cb.id }, cb, ` ${label}`); };
  const segmented = (options, value, onchange) => {
    const wrap = h("div", { class: "wp-segmented", role: "group" });
    for (const [v, label, icon] of options) wrap.append(h("button", { type: "button", "aria-pressed": String(String(v) === String(value)), title: label, "aria-label": label, onclick: (e) => { wrap.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false")); e.currentTarget.setAttribute("aria-pressed", "true"); onchange(v); } }, icon ? svg(icon) : label));
    return wrap;
  };

  // ---------- L'éditeur ----------
  const codeEditor = $("#post-content");
  const editor = new Editor({
    element: $("#be-editor"),
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: null, target: null, class: null } } }),
      TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false, backgroundColor: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript, Superscript, TaskList, TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ includeChildren: false, placeholder: ({ node, editor: ed }) => (node.type.name === "heading" ? "Titre" : ed.state.doc.childCount <= 1 ? "Saisissez / pour choisir un bloc" : "Saisissez / pour choisir un bloc") }),
      ...BLOG_NODES,
      Focus.configure({ mode: "shallowest", className: "has-focus" }),
      BlockHandle.configure({ visual: false }),
    ],
    content: codeEditor.value,
    editorProps: { attributes: { class: "be-prose wp-block-list", "aria-label": "Contenu de l'article", role: "textbox", "aria-multiline": "true" } },
  });
  codeEditor.hidden = true;
  $("[data-content-label]").hidden = true;
  root.classList.add("be-ready");
  const chain = () => editor.chain().focus();

  // Titre : grandit avec le texte, Entrée passe au premier bloc
  const titleField = field("title");
  const growTitle = () => { titleField.style.height = "auto"; titleField.style.height = `${titleField.scrollHeight}px`; };
  titleField.addEventListener("input", growTitle);
  titleField.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Focus immédiat (synchrone) : la frappe suivante doit arriver dans le premier bloc, pas dans le titre
    editor.view.dispatch(editor.state.tr.setSelection(TextSelection.atStart(editor.state.doc)));
    editor.view.focus();
  });
  titleField.addEventListener("input", () => { const t = titleField.value.trim() || "Sans titre"; $("[data-doc-title]").textContent = t; $("[data-card-title]").textContent = t; });
  requestAnimationFrame(growTitle);
  window.addEventListener("resize", debounce(growTitle, 100));

  // ---------- Insertion ----------
  // Bloc entier sélectionné (image…) : on écrit après lui au lieu de le remplacer
  const ins = () => {
    const sel = editor.state.selection;
    const c = editor.chain().focus();
    if (!(sel instanceof NodeSelection)) return c;
    const after = sel.$from.depth > 0 ? sel.$from.after(1) : sel.to;
    if (after >= editor.state.doc.content.size) c.insertContentAt(after, { type: "paragraph" });
    return c.setTextSelection(after + 1);
  };
  const CONTAINERS = new Set(["callout", "kbCta", "kbFaq", "kbFaqItem", "kbFaqAnswer", "kbAccordion", "kbAccordionBody", "kbCompare", "kbCompareCol", "kbSteps", "table", "blockquote", "bulletList", "orderedList", "taskList"]);
  // Bloc complexe : jamais imbriqué par accident ; il remplace un paragraphe vide, sinon il se place après le bloc courant
  function blk(content) {
    const sel = editor.state.selection;
    const { $from } = sel;
    for (let d = 1; d <= $from.depth; d++) if (CONTAINERS.has($from.node(d).type.name)) return placeAfter($from.after(1), content);
    if (sel instanceof NodeSelection) return placeAfter(sel.to, content);
    const parent = $from.parent;
    if ($from.depth === 1 && parent.type.name === "paragraph" && parent.content.size === 0) {
      const at = $from.before(1);
      editor.chain().focus().command(({ tr }) => { tr.delete(at, at + parent.nodeSize); return true; }).run();
      return placeAfter(at, content);
    }
    return placeAfter($from.after(1), content);
  }
  function placeAfter(pos, content) {
    const size = editor.state.doc.content.size;
    editor.chain().focus().insertContentAt(pos, content).run();
    const end = pos + (editor.state.doc.content.size - size);
    const node = editor.state.doc.nodeAt(Math.max(0, end - 1));
    const inserted = editor.state.doc.nodeAt(pos);
    if (end >= editor.state.doc.content.size || (node && node.isAtom)) editor.chain().insertContentAt(end, { type: "paragraph" }).run();
    // Curseur dans le bloc inséré (titre, encadré…) ; après lui s'il n'a pas de texte (image, séparateur…)
    if (inserted && !inserted.isAtom && inserted.type.name !== "horizontalRule") editor.view.dispatch(editor.state.tr.setSelection(TextSelection.near(editor.state.doc.resolve(pos + 1))));
    else editor.commands.setTextSelection(Math.min(end + 1, editor.state.doc.content.size));
    return true;
  }
  const p = (text) => ({ type: "paragraph", content: text ? [{ type: "text", text }] : [] });
  const cell = (type) => ({ type, content: [{ type: "paragraph" }] });
  const tableNode = (rows, cols) => ({ type: "table", content: Array.from({ length: rows }, (_, r) => ({ type: "tableRow", content: Array.from({ length: cols }, () => cell(r === 0 ? "tableHeader" : "tableCell")) })) });
  const faqNode = (items) => ({ type: "kbFaq", content: items.map((i) => ({ type: "kbFaqItem", content: [{ type: "kbSummary", content: [{ type: "text", text: i.question }] }, { type: "kbFaqAnswer", content: String(i.answer).split(/\n{2,}/).map((t) => p(t.trim())) }] })) });

  // Bibliothèque de blocs (catégories de l'outil d'insertion de WordPress)
  const BLOCKS = [
    { id: "paragraph", title: "Paragraphe", cat: "Texte", icon: "paragraph", desc: "Commencez par le bloc de construction de toute narration.", run: () => blk(p("")) },
    { id: "heading", title: "Titre", cat: "Texte", icon: "heading", desc: "Introduit une nouvelle section et organise le contenu (apparaît dans le sommaire).", keywords: "h2 h3 sous-titre section", run: () => blk({ type: "heading", attrs: { level: 2 }, content: [] }) },
    { id: "list", title: "Liste", cat: "Texte", icon: "list", desc: "Une liste à puces.", keywords: "puces", run: () => blk({ type: "bulletList", content: [{ type: "listItem", content: [p("")] }] }) },
    { id: "ordered", title: "Liste numérotée", cat: "Texte", icon: "ordered", desc: "Une liste dans l'ordre.", keywords: "numéros ordonnée", run: () => blk({ type: "orderedList", content: [{ type: "listItem", content: [p("")] }] }) },
    { id: "quote", title: "Citation", cat: "Texte", icon: "quote", desc: "Mettez en valeur une citation.", run: () => blk({ type: "blockquote", content: [p("")] }) },
    { id: "code", title: "Code", cat: "Texte", icon: "code", desc: "Affichez du code en respectant l'espacement.", run: () => blk({ type: "codeBlock", content: [] }) },
    { id: "table", title: "Tableau", cat: "Texte", icon: "table", desc: "Créez des données structurées dans un tableau.", run: () => blk(tableNode(3, 3)) },
    { id: "checklist", title: "Liste de contrôle", cat: "Texte", icon: "checklist", desc: "Cases à cocher.", keywords: "tâches checklist", run: () => blk({ type: "taskList", content: [{ type: "taskItem", attrs: { checked: false }, content: [p("")] }] }) },
    { id: "details", title: "Détails", cat: "Texte", icon: "details", desc: "Masquez et affichez du contenu (accordéon).", keywords: "accordéon dépliable", run: () => blk({ type: "kbAccordion", content: [{ type: "kbSummary", content: [{ type: "text", text: "Résumé" }] }, { type: "kbAccordionBody", content: [p("")] }] }) },
    { id: "image", title: "Image", cat: "Média", icon: "image", desc: "Insérez une image pour illustrer votre propos.", keywords: "photo", run: () => openMediaModal({ onSelect: (m, extra) => blk({ type: "kbImage", attrs: { src: m.path, mediaId: m.id, alt: extra.alt, caption: extra.caption, credit: extra.credit, title: m.title || "", width: "100", align: "center" } }) }) },
    { id: "gallery", title: "Galerie", cat: "Média", icon: "gallery", desc: "Affichez plusieurs images dans une galerie.", run: () => openMediaModal({ multiple: true, onSelectMany: (list) => blk({ type: "kbGallery", attrs: { columns: "3", images: list.map((m) => ({ src: m.path, alt: m.alt || "", caption: m.caption || "" })) } }) }) },
    { id: "video", title: "Vidéo", cat: "Média", icon: "video", desc: "Vidéo YouTube, Vimeo ou fichier téléversé.", run: () => urlPrompt("Vidéo", "Adresse de la vidéo (YouTube, Vimeo)", "https://www.youtube.com/watch?v=…", (url) => blk({ type: "kbVideo", attrs: { url, caption: "" } }), { kind: "video" }) },
    { id: "audio", title: "Audio", cat: "Média", icon: "audio", desc: "Lecteur audio (MP3).", keywords: "podcast son", run: () => openMediaModal({ kind: "audio", onSelect: (m) => blk({ type: "kbAudio", attrs: { src: m.path, title: m.title || "" } }) }) },
    { id: "gcallout-info", title: "Encadré Information", cat: "Design", icon: "callout", desc: "Mettez une information en évidence.", keywords: "note info", run: () => blk({ type: "callout", attrs: { type: "info" }, content: [p("")] }) },
    { id: "gcallout-conseil", title: "Encadré Conseil", cat: "Design", icon: "callout", desc: "Un conseil pratique.", keywords: "astuce tip", run: () => blk({ type: "callout", attrs: { type: "conseil" }, content: [p("")] }) },
    { id: "gcallout-attention", title: "Encadré Attention", cat: "Design", icon: "callout", desc: "Un avertissement.", keywords: "alerte danger", run: () => blk({ type: "callout", attrs: { type: "attention" }, content: [p("")] }) },
    { id: "gcallout-retenir", title: "Encadré À retenir", cat: "Design", icon: "callout", desc: "L'idée essentielle.", keywords: "résumé essentiel", run: () => blk({ type: "callout", attrs: { type: "a-retenir" }, content: [p("")] }) },
    { id: "gcallout-savoir", title: "Encadré Bon à savoir", cat: "Design", icon: "callout", desc: "Une information utile.", run: () => blk({ type: "callout", attrs: { type: "bon-a-savoir" }, content: [p("")] }) },
    { id: "buttons", title: "Bouton", cat: "Design", icon: "button", desc: "Invitez les lecteurs à agir avec un bouton.", run: () => blk({ type: "kbButton", attrs: { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center", newTab: false } }) },
    { id: "separator", title: "Séparateur", cat: "Design", icon: "separator", desc: "Créez une coupure entre deux idées.", keywords: "ligne hr", run: () => blk({ type: "horizontalRule" }) },
    { id: "columns", title: "Comparaison", cat: "Design", icon: "columns", desc: "Deux colonnes : avantages et limites.", keywords: "colonnes pour contre", run: () => blk({ type: "kbCompare", content: [["pro", "Avantages"], ["con", "Limites"]].map(([tone, title]) => ({ type: "kbCompareCol", attrs: { tone }, content: [{ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: title }] }, { type: "bulletList", content: [{ type: "listItem", content: [p("")] }] }] })) }) },
    { id: "cta", title: "Appel à l'action", cat: "Design", icon: "cta", desc: "Encadré avec titre, texte et bouton.", keywords: "cta conversion", run: () => blk({ type: "kbCta", content: [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Envie d'aller plus loin ?" }] }, p("Une phrase qui donne envie."), { type: "kbButton", attrs: { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center" } }] }) },
    { id: "faq", title: "FAQ", cat: "Widgets", icon: "faq", desc: "Questions et réponses (données structurées FAQPage).", keywords: "questions", run: () => blk(faqNode([{ question: "Question ?", answer: "Réponse." }])) },
    { id: "steps", title: "Étapes", cat: "Widgets", icon: "steps", desc: "Guide pas à pas (données structurées HowTo).", keywords: "howto tutoriel", run: () => blk({ type: "kbSteps", attrs: { title: "" }, content: [1, 2, 3].map((n) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `Étape ${n}`, marks: [{ type: "bold" }] }, { type: "text", text: " : ce qu'il faut faire." }] }] })) }) },
    { id: "course", title: "Formation recommandée", cat: "Widgets", icon: "course", desc: "Carte d'une formation du catalogue.", keywords: "cours produit", run: () => { if (!DATA.courses.length) return toast("Aucune formation publiée à recommander.", "error"); return blk({ type: "kbCourse", attrs: { slug: DATA.courses[0].slug } }); } },
    { id: "newsletter", title: "Newsletter", cat: "Widgets", icon: "newsletter", desc: "Formulaire d'inscription à la newsletter.", keywords: "inscription email", run: () => blk({ type: "kbNewsletter" }) },
    { id: "embed", title: "Contenu embarqué", cat: "Intégrations", icon: "embed", desc: "Intégrez un contenu externe (YouTube et Vimeo deviennent un lecteur, le reste un lien).", keywords: "embed intégration", run: () => urlPrompt("Contenu embarqué", "Adresse du contenu", "https://…", (url) => blk({ type: "kbEmbed", attrs: { url, caption: "" } })) },
    { id: "youtube", title: "YouTube", cat: "Intégrations", icon: "video", desc: "Intégrez une vidéo YouTube.", run: () => urlPrompt("YouTube", "Adresse de la vidéo YouTube", "https://www.youtube.com/watch?v=…", (url) => blk({ type: "kbVideo", attrs: { url, caption: "" } })) },
    { id: "vimeo", title: "Vimeo", cat: "Intégrations", icon: "video", desc: "Intégrez une vidéo Vimeo.", run: () => urlPrompt("Vimeo", "Adresse de la vidéo Vimeo", "https://vimeo.com/…", (url) => blk({ type: "kbVideo", attrs: { url, caption: "" } })) },
  ];
  const CATS = ["Texte", "Média", "Design", "Widgets", "Intégrations"];
  const blockButton = (b, after) => h("button", { type: "button", class: "wp-block-type", onclick: () => { after?.(); b.run(); } }, h("span", { class: "wp-block-type-icon" }, svg(b.icon)), h("span", { class: "wp-block-type-title" }, b.title));
  const matches = (b, q) => !q || norm(`${b.title} ${b.cat} ${b.keywords || ""} ${b.desc}`).includes(norm(q));
  function urlPrompt(title, label, placeholder, done, { kind } = {}) {
    const url = input({ type: "url", placeholder });
    const body = h("div", {}, control(label, url));
    if (kind === "video") body.append(h("button", { type: "button", class: "wp-btn-secondary", onclick: () => { m.close(); openMediaModal({ kind: "video", onSelect: (media) => done(media.path) }); } }, "Ou téléverser un fichier vidéo…"));
    const m = modal(title, body, [{ label: "Intégrer", primary: true, run: () => { const v = url.value.trim(); if (!/^https:\/\/\S+$/.test(v)) { toast("L'adresse doit commencer par https://", "error"); return true; } done(v); } }]);
    url.focus();
  }

  // ---------- Panneau gauche : outil d'insertion et vue d'ensemble ----------
  const secondary = $("[data-secondary]");
  const inserterToggle = $("[data-toggle-inserter]");
  const listToggle = $("[data-toggle-listview]");
  let secondaryMode = null;
  function setSecondary(mode) {
    secondaryMode = secondaryMode === mode ? null : mode;
    inserterToggle.setAttribute("aria-pressed", String(secondaryMode === "inserter"));
    inserterToggle.classList.toggle("is-pressed", secondaryMode === "inserter");
    listToggle.setAttribute("aria-pressed", String(secondaryMode === "list"));
    secondary.hidden = !secondaryMode;
    root.classList.toggle("has-secondary", Boolean(secondaryMode));
    if (secondaryMode === "inserter") renderInserter();
    if (secondaryMode === "list") renderListView();
  }
  inserterToggle.addEventListener("click", () => setSecondary("inserter"));
  listToggle.addEventListener("click", () => setSecondary("list"));
  function renderInserter() {
    const search = input({ type: "search", placeholder: "Rechercher", "aria-label": "Rechercher un bloc", class: "wp-search" });
    const grid = h("div", { class: "wp-inserter-blocks" });
    const media = h("div", { class: "wp-inserter-media", hidden: true });
    const render = () => {
      grid.replaceChildren();
      for (const cat of CATS) {
        const items = BLOCKS.filter((b) => b.cat === cat && matches(b, search.value));
        if (!items.length) continue;
        grid.append(h("h2", { class: "wp-inserter-cat" }, cat), h("div", { class: "wp-block-types" }, ...items.map((b) => blockButton(b))));
      }
      if (!grid.children.length) grid.append(h("p", { class: "wp-help" }, "Aucun résultat."));
    };
    const tabs = segmentedTabs([["blocs", "Blocs"], ["medias", "Médias"]], (k) => { grid.hidden = k !== "blocs"; media.hidden = k !== "medias"; if (k === "medias") loadMediaTab(media); });
    search.addEventListener("input", render);
    secondary.replaceChildren(h("div", { class: "wp-secondary-head" }, h("span", {}, "Ajouter un bloc"), h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Fermer l'outil d'insertion", onclick: () => setSecondary("inserter") }, "×")), tabs, h("div", { class: "wp-secondary-body" }, search, grid, media));
    render();
    search.focus();
  }
  function segmentedTabs(items, onchange) {
    const bar = h("div", { class: "wp-tabs", role: "tablist" });
    items.forEach(([k, label], i) => bar.append(h("button", { type: "button", role: "tab", "aria-selected": String(i === 0), onclick: (e) => { bar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", "false")); e.currentTarget.setAttribute("aria-selected", "true"); onchange(k); } }, label)));
    return bar;
  }
  async function loadMediaTab(box) {
    box.replaceChildren(h("p", { class: "wp-help" }, "Chargement…"));
    try {
      const { media } = await api("/formateur/blog/api/medias?type=image");
      box.replaceChildren(h("div", { class: "wp-media-grid" }, ...media.map((m) => h("button", { type: "button", class: "wp-media-thumb", title: m.alt || "Insérer", onclick: () => blk({ type: "kbImage", attrs: { src: m.path, mediaId: m.id, alt: m.alt || "", caption: m.caption || "", credit: m.credit || "", title: m.title || "", width: "100", align: "center" } }) }, h("img", { src: m.path, alt: m.alt || "" })))), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal() }, "Ouvrir la médiathèque"));
      if (!media.length) box.prepend(h("p", { class: "wp-help" }, "Aucune image téléversée pour l'instant."));
    } catch (e) { box.replaceChildren(h("p", { class: "wp-error" }, e.message)); }
  }
  const LABEL = { paragraph: "Paragraphe", heading: "Titre", bulletList: "Liste", orderedList: "Liste numérotée", listItem: "Élément de liste", taskList: "Liste de contrôle", taskItem: "Élément", blockquote: "Citation", codeBlock: "Code", horizontalRule: "Séparateur", table: "Tableau", tableRow: "Ligne", tableCell: "Cellule", tableHeader: "En-tête", kbImage: "Image", kbGallery: "Galerie", kbVideo: "Vidéo", kbAudio: "Audio", kbEmbed: "Contenu embarqué", kbCourse: "Formation recommandée", kbNewsletter: "Newsletter", kbButton: "Bouton", callout: "Encadré", kbCta: "Appel à l'action", kbAccordion: "Détails", kbSummary: "Résumé", kbAccordionBody: "Contenu", kbFaq: "FAQ", kbFaqItem: "Question", kbFaqAnswer: "Réponse", kbSteps: "Étapes", kbCompare: "Comparaison", kbCompareCol: "Colonne" };
  const ICON_OF = { paragraph: "paragraph", heading: "heading", bulletList: "list", orderedList: "ordered", taskList: "checklist", blockquote: "quote", codeBlock: "code", horizontalRule: "separator", table: "table", kbImage: "image", kbGallery: "gallery", kbVideo: "video", kbAudio: "audio", kbEmbed: "embed", kbCourse: "course", kbNewsletter: "newsletter", kbButton: "button", callout: "callout", kbCta: "cta", kbAccordion: "details", kbFaq: "faq", kbSteps: "steps", kbCompare: "columns" };
  const nameOf = (node) => (node.type.name === "heading" ? `Titre H${node.attrs.level}` : node.type.name === "callout" ? `Encadré ${CALLOUT_LABELS[node.attrs.type] || ""}` : LABEL[node.type.name] || node.type.name);
  function renderListView() {
    const list = h("ol", { class: "wp-list-view", role: "tree", "aria-label": "Blocs" });
    const outline = h("ol", { class: "wp-outline", hidden: true });
    const current = currentBlock();
    editor.state.doc.forEach((node, offset) => {
      const preview = node.isAtom ? "" : node.textContent.slice(0, 40);
      const item = h("li", { role: "treeitem", class: current && current.pos === offset ? "is-selected" : "" }, h("button", { type: "button", onclick: () => selectBlockAt(offset) }, svg(ICON_OF[node.type.name] || "paragraph", 20), h("span", { class: "wp-list-name" }, nameOf(node)), preview ? h("span", { class: "wp-list-preview" }, preview) : null));
      list.append(item);
    });
    const hs = headingsOf();
    outline.append(...hs.map((x) => h("li", { class: `wp-outline-l${x.level}` }, h("button", { type: "button", onclick: () => editor.chain().focus().setTextSelection(x.pos + 1).scrollIntoView().run() }, h("span", { class: "wp-outline-level" }, `H${x.level}`), x.text || "(titre vide)"))));
    if (!hs.length) outline.append(h("li", { class: "wp-help" }, "Le plan s'affiche à partir des titres (blocs Titre)."));
    const tabs = segmentedTabs([["liste", "Vue en liste"], ["plan", "Plan"]], (k) => { list.hidden = k !== "liste"; outline.hidden = k !== "plan"; });
    const stats = lastAnalysis ? h("p", { class: "wp-help wp-outline-stats" }, `Caractères : ${editor.getText().length} · Mots : ${lastAnalysis.words} · Temps de lecture : ${lastAnalysis.minutes} min`) : null;
    secondary.replaceChildren(h("div", { class: "wp-secondary-head" }, h("span", {}, "Vue d'ensemble du document"), h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Fermer la vue d'ensemble", onclick: () => setSecondary("list") }, "×")), tabs, h("div", { class: "wp-secondary-body" }, stats, list, outline));
  }
  function selectBlockAt(pos) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    if (node.isAtom || !node.isTextblock) editor.chain().focus().setNodeSelection(pos).scrollIntoView().run();
    else editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  }

  // ---------- Bloc courant ----------
  // Bloc ciblé par la barre d'outils et la barre latérale : bloc entier sélectionné, sinon le plus petit bloc « réglable »
  const SETTINGS_TYPES = new Set(["kbImage", "kbGallery", "kbVideo", "kbAudio", "kbEmbed", "kbCourse", "kbNewsletter", "kbButton", "callout", "kbSteps", "kbCompare", "table", "kbCta", "kbFaq", "kbAccordion", "bulletList", "orderedList", "taskList", "blockquote"]);
  function currentBlock() {
    const sel = editor.state.selection;
    if (sel instanceof NodeSelection) return { node: sel.node, pos: sel.from, top: sel.$from.depth === 0 ? sel.from : sel.$from.before(1) };
    const $from = sel.$from;
    if ($from.depth === 0) return null;
    // Bloc de texte (paragraphe, titre, code) sauf s'il est dans une liste ou un bloc spécial réglable
    for (let d = 1; d <= $from.depth; d++) {
      const node = $from.node(d);
      if (SETTINGS_TYPES.has(node.type.name)) return { node, pos: $from.before(d), top: $from.before(1), text: $from.parent.isTextblock ? { node: $from.parent, pos: $from.before($from.depth) } : null };
    }
    return { node: $from.parent, pos: $from.before($from.depth), top: $from.before(1), text: { node: $from.parent, pos: $from.before($from.depth) } };
  }
  const setAttrsAt = (pos, attrs) => editor.chain().focus().command(({ tr }) => { const node = tr.doc.nodeAt(pos); if (!node) return false; tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs }); return true; }).run();
  const topOf = (pos) => { const $p = editor.state.doc.resolve(pos); return $p.depth === 0 ? pos : $p.before(1); };

  // ---------- Barre d'outils du bloc (flottante, ou en haut en mode « Barre d'outils supérieure ») ----------
  const blockToolbar = $("[data-block-toolbar]");
  const topToolbar = $("[data-top-toolbar]");
  let topToolbarMode = false;
  const tbtn = (label, icon, run, { pressed, text } = {}) => {
    const b = h("button", { type: "button", class: "wp-tb-btn", "aria-label": label, title: label, "aria-pressed": pressed === undefined ? null : String(pressed) }, icon ? svg(icon) : null, text || null);
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", run);
    return b;
  };
  const tgroup = (...items) => h("div", { class: "wp-tb-group" }, ...items.filter(Boolean));
  function popover(anchor, content, { className = "" } = {}) {
    closePopovers();
    const pop = h("div", { class: `wp-popover ${className}`, role: "dialog" }, content);
    document.body.append(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.top = `${window.scrollY + r.bottom + 6}px`;
    pop.style.left = `${Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + window.innerWidth - pop.offsetWidth - 8))}px`;
    setTimeout(() => document.addEventListener("mousedown", outside), 0);
    function outside(e) { if (!pop.contains(e.target) && e.target !== anchor) { pop.remove(); document.removeEventListener("mousedown", outside); } }
    pop.close = () => { pop.remove(); document.removeEventListener("mousedown", outside); };
    return pop;
  }
  function closePopovers() { document.querySelectorAll(".wp-popover").forEach((x) => x.close ? x.close() : x.remove()); }
  const menuList = (items) => h("div", { class: "wp-menu-list", role: "menu" }, ...items.map((it) => (it === "-" ? h("hr") : h("button", { type: "button", role: "menuitem", class: it.danger ? "is-danger" : "", onclick: () => { closePopovers(); it.run(); } }, it.icon ? svg(it.icon) : null, h("span", {}, it.label), it.shortcut ? h("kbd", {}, it.shortcut) : null))));

  // Transformations du bloc de texte (comme le sélecteur de type de Gutenberg)
  function transformMenu(anchor) {
    const items = [
      { label: "Paragraphe", icon: "paragraph", run: () => chain().setParagraph().run() },
      ...[1, 2, 3, 4].map((l) => ({ label: `Titre ${l}${l === 2 ? " (section)" : ""}`, icon: "heading", run: () => chain().setHeading({ level: l }).run() })),
      { label: "Liste", icon: "list", run: () => chain().toggleBulletList().run() },
      { label: "Liste numérotée", icon: "ordered", run: () => chain().toggleOrderedList().run() },
      { label: "Liste de contrôle", icon: "checklist", run: () => chain().toggleTaskList().run() },
      { label: "Citation", icon: "quote", run: () => chain().toggleBlockquote().run() },
      { label: "Code", icon: "code", run: () => chain().setCodeBlock().run() },
    ];
    popover(anchor, h("div", {}, h("p", { class: "wp-menu-label" }, "Transformer en"), menuList(items)));
  }
  function moreFormats(anchor) {
    const colors = [["#0b2a40", "Bleu nuit"], ["#3858e9", "Bleu"], ["#1e7a34", "Vert"], ["#b45309", "Orange"], ["#cc1818", "Rouge"], ["#6b21a8", "Violet"], ["#757575", "Gris"]];
    const marks = [["#fff3a3", "Jaune"], ["#d1fae5", "Vert"], ["#e0f2fe", "Bleu"], ["#fde2e4", "Rose"]];
    popover(anchor, h("div", {},
      menuList([
        { label: "Code en ligne", icon: "code", run: () => chain().toggleCode().run() },
        { label: "Souligné", run: () => chain().toggleUnderline().run(), shortcut: "Ctrl+U" },
        { label: "Barré", run: () => chain().toggleStrike().run() },
        { label: "Exposant", run: () => chain().toggleSuperscript().run() },
        { label: "Indice", run: () => chain().toggleSubscript().run() },
        { label: "Effacer la mise en forme", run: () => chain().unsetAllMarks().run() },
      ]),
      h("p", { class: "wp-menu-label" }, "Couleur du texte"),
      h("div", { class: "wp-swatches" }, ...colors.map(([c, l]) => h("button", { type: "button", class: "wp-swatch", style: `background:${c}`, title: l, "aria-label": `Couleur ${l}`, onclick: () => { chain().setColor(c).run(); closePopovers(); } })), h("button", { type: "button", class: "wp-swatch is-none", title: "Par défaut", "aria-label": "Couleur par défaut", onclick: () => { chain().unsetColor().run(); closePopovers(); } })),
      h("p", { class: "wp-menu-label" }, "Surligneur"),
      h("div", { class: "wp-swatches" }, ...marks.map(([c, l]) => h("button", { type: "button", class: "wp-swatch", style: `background:${c}`, title: l, "aria-label": `Surligner en ${l}`, onclick: () => { chain().setHighlight({ color: c }).run(); closePopovers(); } })), h("button", { type: "button", class: "wp-swatch is-none", title: "Sans surlignage", "aria-label": "Sans surlignage", onclick: () => { chain().unsetHighlight().run(); closePopovers(); } }))), { className: "is-formats" });
  }
  function blockOptions(anchor, b) {
    const top = b.top;
    popover(anchor, menuList([
      { label: "Copier", run: () => { const node = editor.state.doc.nodeAt(top); if (node && navigator.clipboard) navigator.clipboard.writeText(node.textContent).then(() => toast("Texte du bloc copié.")); } },
      { label: "Dupliquer", shortcut: "Ctrl+Maj+D", run: () => duplicateBlock(top) },
      { label: "Insérer avant", run: () => { editor.chain().focus().insertContentAt(top, p("")).setTextSelection(top + 1).run(); } },
      { label: "Insérer après", run: () => { const node = editor.state.doc.nodeAt(top); const at = top + node.nodeSize; editor.chain().focus().insertContentAt(at, p("")).setTextSelection(at + 1).run(); } },
      { label: "Déplacer vers le haut", icon: "up", run: () => { editor.commands.setNodeSelection(top); moveBlock(editor.state, editor.view.dispatch, -1); } },
      { label: "Déplacer vers le bas", icon: "down", run: () => { editor.commands.setNodeSelection(top); moveBlock(editor.state, editor.view.dispatch, 1); } },
      "-",
      { label: "Supprimer", danger: true, shortcut: "Maj+Alt+Z", run: () => deleteBlock(top) },
    ]));
  }
  function duplicateBlock(top) {
    const node = editor.state.doc.nodeAt(top);
    if (!node) return;
    editor.chain().focus().insertContentAt(top + node.nodeSize, node.toJSON()).run();
  }
  function deleteBlock(top) {
    const node = editor.state.doc.nodeAt(top);
    if (!node) return;
    editor.chain().focus().command(({ tr }) => { tr.delete(top, top + node.nodeSize); return true; }).run();
    if (!editor.state.doc.childCount) editor.commands.setContent("<p></p>");
  }
  function renderBlockToolbar() {
    const b = currentBlock();
    const target = topToolbarMode ? topToolbar : blockToolbar;
    (topToolbarMode ? blockToolbar : topToolbar).hidden = true;
    if (!b || !editor.isFocused && !(editor.state.selection instanceof NodeSelection)) { target.hidden = !topToolbarMode; if (!topToolbarMode) return; }
    target.replaceChildren();
    if (!b) return;
    const type = b.node.type.name;
    const textType = b.text ? b.text.node.type.name : null;
    const typeBtn = tbtn(`${nameOf(b.node)} : changer de type`, ICON_OF[type] || "paragraph", (e) => (b.text && !b.node.isAtom ? transformMenu(e.currentTarget) : null));
    const grip = tbtn("Glisser", "drag", () => {});
    grip.draggable = true;
    grip.classList.add("wp-tb-grip");
    grip.addEventListener("dragstart", (e) => startBlockDrag(editor.view, b.top, e));
    const movers = h("div", { class: "wp-tb-movers" }, tbtn("Déplacer vers le haut", "up", () => { editor.commands.setNodeSelection(b.top); moveBlock(editor.state, editor.view.dispatch, -1); }), tbtn("Déplacer vers le bas", "down", () => { editor.commands.setNodeSelection(b.top); moveBlock(editor.state, editor.view.dispatch, 1); }));
    const groups = [tgroup(typeBtn, grip, movers)];
    if (textType === "paragraph" || textType === "heading") {
      const align = editor.isActive({ textAlign: "center" }) ? "alignCenter" : editor.isActive({ textAlign: "right" }) ? "alignRight" : "alignLeft";
      groups.push(tgroup(tbtn("Aligner le texte", align, (e) => popover(e.currentTarget, menuList([["left", "Aligner le texte à gauche", "alignLeft"], ["center", "Centrer le texte", "alignCenter"], ["right", "Aligner le texte à droite", "alignRight"]].map(([v, l, i]) => ({ label: l, icon: i, run: () => chain().setTextAlign(v).run() })))))));
    }
    if (textType === "heading") groups.push(tgroup(tbtn("Changer le niveau de titre", null, (e) => popover(e.currentTarget, menuList([1, 2, 3, 4].map((l) => ({ label: `Titre ${l}`, run: () => chain().setHeading({ level: l }).run() })))), { text: `H${b.text.node.attrs.level}` })));
    if (type === "kbImage") groups.push(tgroup(tbtn("Remplacer", null, () => openMediaModal({ onSelect: (m, extra) => setAttrsAt(b.pos, { src: m.path, mediaId: m.id, alt: extra.alt || b.node.attrs.alt }) }), { text: "Remplacer" })));
    if (type === "table") groups.push(tgroup(tbtn("Modifier le tableau", "table", (e) => popover(e.currentTarget, menuList([
      { label: "Insérer une ligne avant", run: () => chain().addRowBefore().run() }, { label: "Insérer une ligne après", run: () => chain().addRowAfter().run() },
      { label: "Supprimer la ligne", run: () => chain().deleteRow().run() }, { label: "Insérer une colonne avant", run: () => chain().addColumnBefore().run() },
      { label: "Insérer une colonne après", run: () => chain().addColumnAfter().run() }, { label: "Supprimer la colonne", run: () => chain().deleteColumn().run() },
      { label: "Fusionner / séparer les cellules", run: () => chain().mergeOrSplit().run() }])))));
    if (b.text && !b.node.isAtom && textType !== "codeBlock") {
      groups.push(tgroup(
        tbtn("Gras", "bold", () => chain().toggleBold().run(), { pressed: editor.isActive("bold") }),
        tbtn("Italique", "italic", () => chain().toggleItalic().run(), { pressed: editor.isActive("italic") }),
        tbtn("Lien", "link", (e) => linkPopover(e.currentTarget), { pressed: editor.isActive("link") }),
        tbtn("Plus", "chevronDown", (e) => moreFormats(e.currentTarget)),
      ));
    }
    groups.push(tgroup(tbtn("Options", "more", (e) => blockOptions(e.currentTarget, b))));
    target.append(...groups);
    target.hidden = false;
    if (topToolbarMode) return;
    // Position : juste au-dessus du bloc, aligné à gauche
    const dom = editor.view.nodeDOM(b.text && !SETTINGS_TYPES.has(type) ? b.text.pos : b.pos);
    const el = dom instanceof HTMLElement ? dom : dom && dom.parentElement;
    if (!el) { target.hidden = true; return; }
    const host = blockToolbar.offsetParent || $(".wp-content");
    const hostBox = host.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    target.style.top = `${Math.max(0, box.top - hostBox.top - target.offsetHeight - 10)}px`;
    target.style.left = `${Math.max(0, box.left - hostBox.left)}px`;
  }

  // ---------- Bouton « + » des paragraphes vides et commande « / » ----------
  const appender = h("button", { type: "button", class: "wp-inline-appender", "aria-label": "Ajouter un bloc", title: "Ajouter un bloc", hidden: true }, svg("plus"));
  $(".wp-content").append(appender);
  appender.addEventListener("mousedown", (e) => e.preventDefault());
  appender.addEventListener("click", () => quickInserter(appender));
  function refreshAppender() {
    const { $from, empty } = editor.state.selection;
    const show = empty && $from.depth === 1 && $from.parent.type.name === "paragraph" && $from.parent.content.size === 0 && editor.isFocused;
    appender.hidden = !show;
    if (!show) return;
    const dom = editor.view.nodeDOM($from.before(1));
    if (!(dom instanceof HTMLElement)) { appender.hidden = true; return; }
    const hostBox = $(".wp-content").getBoundingClientRect();
    const box = dom.getBoundingClientRect();
    appender.style.top = `${box.top - hostBox.top + box.height / 2 - 12}px`;
    appender.style.left = `${box.right - hostBox.left - 28}px`;
  }
  function quickInserter(anchor, { query = "", replaceRange = null } = {}) {
    const search = input({ type: "search", placeholder: "Rechercher", "aria-label": "Rechercher un bloc", value: query });
    const list = h("div", { class: "wp-block-types is-quick" });
    const render = () => {
      const found = BLOCKS.filter((b) => matches(b, search.value)).slice(0, search.value ? 9 : 6);
      list.replaceChildren(...found.map((b) => blockButton(b, () => { pop.close(); if (replaceRange) editor.chain().focus().deleteRange(replaceRange).run(); })));
      if (!found.length) list.append(h("p", { class: "wp-help" }, "Aucun résultat."));
    };
    search.addEventListener("input", render);
    const pop = popover(anchor, h("div", { class: "wp-quick-inserter" }, search, list, h("button", { type: "button", class: "wp-btn-primary wp-browse-all", onclick: () => { pop.close(); if (secondaryMode !== "inserter") setSecondary("inserter"); } }, "Tout parcourir")));
    render();
    search.focus();
  }
  // Commande « / » : saisie au début d'un paragraphe vide → liste des blocs filtrée par la suite du texte
  let slash = null;
  function refreshSlash() {
    const { $from, empty } = editor.state.selection;
    const text = $from.parent.type.name === "paragraph" ? $from.parent.textContent : "";
    const m = empty && /^\/([\p{L}\p{N} '-]{0,30})$/u.exec(text);
    if (!m || $from.parentOffset !== text.length) { if (slash) { slash.remove(); slash = null; } return; }
    const range = { from: $from.start(), to: $from.end() };
    const found = BLOCKS.filter((b) => matches(b, m[1])).slice(0, 8);
    if (!slash) { slash = h("div", { class: "wp-popover wp-slash", role: "listbox", "aria-label": "Blocs" }); document.body.append(slash); }
    slash.replaceChildren(...found.map((b, i) => h("button", { type: "button", role: "option", class: i === 0 ? "is-active" : "", onmousedown: (e) => e.preventDefault(), onclick: () => applySlash(b, range) }, svg(b.icon, 20), h("span", {}, b.title))));
    if (!found.length) slash.append(h("p", { class: "wp-help" }, "Aucun bloc trouvé."));
    const coords = editor.view.coordsAtPos($from.pos);
    slash.style.top = `${window.scrollY + coords.bottom + 6}px`;
    slash.style.left = `${window.scrollX + coords.left}px`;
    slash.dataset.range = JSON.stringify(range);
  }
  function applySlash(b, range) {
    if (slash) { slash.remove(); slash = null; }
    editor.chain().focus().deleteRange(range).run();
    b.run();
  }
  editor.setOptions({
    editorProps: {
      ...editor.options.editorProps,
      handleKeyDown: (view, event) => {
        const mod = event.ctrlKey || event.metaKey;
        if (slash && ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
          const options = [...slash.querySelectorAll("button")];
          const i = options.findIndex((o) => o.classList.contains("is-active"));
          if (event.key === "Escape") { slash.remove(); slash = null; return true; }
          if (event.key === "Enter") { if (options[i]) options[i].click(); return true; }
          const next = options[(i + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length];
          options.forEach((o) => o.classList.toggle("is-active", o === next));
          return true;
        }
        if (mod && event.key.toLowerCase() === "k") { event.preventDefault(); linkPopover(null); return true; }
        if (mod && event.shiftKey && event.key.toLowerCase() === "d") { event.preventDefault(); const b = currentBlock(); if (b) duplicateBlock(b.top); return true; }
        if (event.shiftKey && event.altKey && event.key.toLowerCase() === "z") { event.preventDefault(); const b = currentBlock(); if (b) deleteBlock(b.top); return true; }
        return false;
      },
    },
  });

  // ---------- Liens (fenêtre surgissante « Rechercher ou saisir l'URL ») ----------
  function linkPopover(anchor) {
    const attrs = editor.getAttributes("link");
    const rel = String(attrs.rel || "").split(/\s+/);
    const url = input({ type: "text", value: attrs.href || "", placeholder: "Rechercher ou saisir l'URL", autocomplete: "off", "aria-label": "Rechercher ou saisir l'URL" });
    const results = h("ul", { class: "wp-link-results", role: "listbox" });
    const opts = { tab: attrs.target === "_blank", nofollow: rel.includes("nofollow"), sponsored: rel.includes("sponsored"), ugc: rel.includes("ugc") };
    const apply = (href) => {
      href = String(href || url.value).trim();
      if (!/^(https?:\/\/\S+|mailto:\S+|\/(?!\/)\S*|#[\w-]+)$/i.test(href)) { if (/^[\w-]+(\.[\w-]+)+/.test(href)) href = `https://${href}`; else { toast("Adresse invalide : https://…, /chemin-interne ou mailto:…", "error"); return; } }
      const relValue = ["nofollow", "sponsored", "ugc"].filter((r) => opts[r]);
      if (opts.tab) relValue.push("noopener", "noreferrer");
      const linkAttrs = { href, target: opts.tab ? "_blank" : null, rel: relValue.length ? relValue.join(" ") : null };
      if (editor.state.selection.empty && !editor.isActive("link")) ins().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: linkAttrs }] }).run();
      else chain().extendMarkRange("link").setLink(linkAttrs).run();
      pop.close();
    };
    const runSearch = debounce(async () => {
      const q = url.value.trim();
      if (/^(https?:|\/|mailto:)/.test(q)) { results.replaceChildren(h("li", {}, h("button", { type: "button", onclick: () => apply(q) }, h("span", { class: "wp-link-title" }, q), h("span", { class: "wp-link-type" }, "Appuyer sur Entrée pour ajouter ce lien")))); return; }
      try {
        const { results: found } = await api(`/formateur/blog/api/liens?q=${encodeURIComponent(q)}`);
        results.replaceChildren(...found.map((r) => h("li", {}, h("button", { type: "button", onclick: () => apply(r.url) }, h("span", { class: "wp-link-title" }, r.title), h("span", { class: "wp-link-url" }, r.url), h("span", { class: "wp-link-type" }, r.label)))));
      } catch (e) { results.replaceChildren(h("li", { class: "wp-error" }, e.message)); }
    }, 200);
    url.addEventListener("input", runSearch);
    url.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } if (e.key === "Escape") pop.close(); });
    const settings = h("div", { class: "wp-link-settings" },
      checkbox("Ouvrir dans un nouvel onglet", opts.tab, (v) => { opts.tab = v; }),
      checkbox("nofollow (ne pas transmettre d'autorité)", opts.nofollow, (v) => { opts.nofollow = v; }),
      checkbox("sponsored (lien sponsorisé ou affilié)", opts.sponsored, (v) => { opts.sponsored = v; }),
      checkbox("ugc (contenu proposé par un utilisateur)", opts.ugc, (v) => { opts.ugc = v; }));
    const anchorEl = anchor || (() => { const c = editor.view.coordsAtPos(editor.state.selection.from); const ghost = h("span", { class: "wp-anchor-ghost" }); ghost.style.top = `${window.scrollY + c.bottom}px`; ghost.style.left = `${window.scrollX + c.left}px`; document.body.append(ghost); setTimeout(() => ghost.remove(), 50); return ghost; })();
    const pop = popover(anchorEl, h("div", { class: "wp-link-control" }, h("div", { class: "wp-link-input" }, url, h("button", { type: "button", class: "wp-btn-primary", onclick: () => apply() }, "Appliquer")), results, settings, attrs.href ? h("button", { type: "button", class: "wp-btn-link is-danger", onclick: () => { chain().extendMarkRange("link").unsetLink().run(); pop.close(); } }, "Supprimer le lien") : null), { className: "is-link" });
    url.focus();
    runSearch();
  }

  // ---------- Médiathèque (fenêtre « Médiathèque » de WordPress) ----------
  // onSelect(media, { alt, caption, credit }) ; multiple : onSelectMany(liste)
  function openMediaModal({ kind = "image", onSelect = null, onSelectMany = null, multiple = false } = {}) {
    const chosen = new Map();
    const grid = h("ul", { class: "wp-attachments", role: "listbox", "aria-multiselectable": String(multiple) });
    const details = h("div", { class: "wp-attachment-details" }, h("p", { class: "wp-help" }, "Sélectionnez un fichier pour voir ses détails."));
    const q = input({ type: "search", placeholder: "Rechercher des médias", class: "wp-search" });
    const upload = h("input", { type: "file", id: `wp-f${++uid}`, accept: kind === "image" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : kind === "video" ? "video/mp4,video/webm" : "audio/mpeg,audio/mp4,audio/ogg,audio/wav", multiple: multiple || null, class: "wp-upload-input" });
    let current = null;
    const fields = {};
    const showDetails = (m) => {
      current = m;
      for (const k of ["alt", "title", "caption", "description", "credit"]) fields[k] = k === "description" || k === "alt" || k === "caption" ? textarea({}, m[k] || "") : input({ value: m[k] || "" });
      const saveMeta = debounce(async () => { try { const r = await api(`/formateur/blog/api/medias/${m.id}`, { method: "POST", json: Object.fromEntries(Object.entries(fields).map(([k, el]) => [k, el.value])) }); Object.assign(m, r.media); } catch (e) { toast(e.message, "error"); } }, 500);
      Object.values(fields).forEach((el) => el.addEventListener("input", saveMeta));
      details.replaceChildren(
        h("h2", {}, "Détails du fichier"),
        m.kind === "image" ? h("img", { src: m.path, alt: "" }) : h("p", { class: "wp-help" }, m.kind === "video" ? "Vidéo" : "Audio"),
        h("p", { class: "wp-help" }, `${m.path.split("/").pop()}${m.width ? ` · ${m.width} × ${m.height} pixels` : ""}`),
        h("button", { type: "button", class: "wp-btn-link is-danger", disabled: m.used ? true : null, title: m.used ? `Utilisé par ${m.used} article(s)` : null, onclick: async () => { if (!confirm("Supprimer définitivement ce fichier ?")) return; try { await api(`/formateur/blog/api/medias/${m.id}/supprimer`, { method: "POST" }); load(); details.replaceChildren(); } catch (e) { toast(e.message, "error"); } } }, "Supprimer définitivement"),
        m.kind === "image" ? control("Texte alternatif", fields.alt, "Décrivez le but de l'image. Laissez vide si l'image est purement décorative.") : null,
        control("Titre", fields.title), control("Légende", fields.caption), control("Description", fields.description), control("Crédit", fields.credit));
      if (m.kind === "image" && !m.alt) details.append(h("p", { class: "wp-warning" }, "⚠ Cette image n'a pas de texte alternatif."));
    };
    const load = async () => {
      try {
        const { media } = await api(`/formateur/blog/api/medias?type=${kind}&q=${encodeURIComponent(q.value)}`);
        grid.replaceChildren(...media.map((m) => {
          const li = h("li", { role: "option", tabindex: 0, class: chosen.has(m.id) ? "is-selected" : "", "aria-selected": String(chosen.has(m.id)), "aria-label": m.alt || m.title || m.path.split("/").pop() },
            m.kind === "image" ? h("img", { src: m.path, alt: "" }) : h("span", { class: "wp-attachment-file" }, m.kind === "video" ? "▶" : "♪", h("small", {}, m.title || m.path.split("/").pop())));
          const toggle = () => {
            if (!multiple) { chosen.clear(); grid.querySelectorAll(".is-selected").forEach((x) => { x.classList.remove("is-selected"); x.setAttribute("aria-selected", "false"); }); }
            if (chosen.has(m.id)) chosen.delete(m.id); else chosen.set(m.id, m);
            li.classList.toggle("is-selected", chosen.has(m.id));
            li.setAttribute("aria-selected", String(chosen.has(m.id)));
            showDetails(m);
            selectBtn.disabled = !chosen.size;
          };
          li.addEventListener("click", toggle);
          li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
          return li;
        }));
        if (!media.length) grid.append(h("li", { class: "wp-help wp-empty" }, "Aucun fichier. Utilisez « Téléverser des fichiers »."));
      } catch (e) { grid.replaceChildren(h("li", { class: "wp-error" }, e.message)); }
    };
    q.addEventListener("input", debounce(load, 250));
    upload.addEventListener("change", async () => {
      for (const file of upload.files) {
        try { const m = await uploadMedia(file, kind); chosen.set(m.id, m); showDetails(m); } catch (e) { toast(e.message, "error"); }
      }
      upload.value = "";
      tabsBar.querySelectorAll("button")[1].click();
      selectBtn.disabled = !chosen.size;
    });
    const uploadPane = h("div", { class: "wp-upload-pane", hidden: true }, h("p", { class: "wp-upload-title" }, "Déposez des fichiers pour les téléverser"), h("p", {}, "ou"), h("label", { class: "wp-btn-secondary", for: upload.id }, "Sélectionner des fichiers"), upload, h("p", { class: "wp-help" }, kind === "image" ? "JPEG, PNG, WebP, GIF ou AVIF." : kind === "video" ? "MP4 ou WebM." : "MP3, M4A, OGG ou WAV."));
    const libraryPane = h("div", { class: "wp-library-pane" }, h("div", { class: "wp-library-toolbar" }, q), h("div", { class: "wp-library-main" }, grid, details));
    const tabsBar = segmentedTabs([["upload", "Téléverser des fichiers"], ["library", "Médiathèque"]], (k) => { uploadPane.hidden = k !== "upload"; libraryPane.hidden = k !== "library"; if (k === "library") load(); });
    tabsBar.querySelectorAll("button")[0].setAttribute("aria-selected", "false");
    tabsBar.querySelectorAll("button")[1].setAttribute("aria-selected", "true");
    const selectBtn = h("button", { type: "button", class: "wp-btn-primary", disabled: true }, multiple ? "Créer une galerie" : onSelect ? "Sélectionner" : "Fermer");
    const m = modal(kind === "image" ? (multiple ? "Créer une galerie" : "Sélectionner ou téléverser un média") : kind === "video" ? "Sélectionner une vidéo" : "Sélectionner un fichier audio", h("div", { class: "wp-media-modal" }, tabsBar, uploadPane, libraryPane, h("div", { class: "wp-modal-actions" }, selectBtn)), [], { wide: true });
    selectBtn.addEventListener("click", () => {
      const list = [...chosen.values()];
      m.close();
      if (multiple && onSelectMany) { if (list.length < 2) return toast("Une galerie contient au moins 2 images.", "error"); return onSelectMany(list); }
      if (onSelect && list[0]) onSelect(list[0], { alt: list[0].alt || "", caption: list[0].caption || "", credit: list[0].credit || "" });
    });
    if (!onSelect && !onSelectMany) selectBtn.disabled = false;
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
  $("[data-open-library]").addEventListener("click", () => openMediaModal());

  // ---------- Barre latérale : onglets Article / Bloc, sections repliables ----------
  const sidebar = $("[data-sidebar]");
  const sidebarTabs = $$("[data-sidebar-tab]");
  function showSidebarTab(key) {
    for (const t of sidebarTabs) {
      const on = t.dataset.sidebarTab === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(`[data-sidebar-panel="${t.dataset.sidebarTab}"]`).hidden = !on;
    }
    if (key === "bloc") renderInspector();
  }
  sidebarTabs.forEach((t) => t.addEventListener("click", () => showSidebarTab(t.dataset.sidebarTab)));
  $$("[data-toggle-sidebar]").forEach((b) => b.addEventListener("click", () => {
    const open = sidebar.hidden;
    sidebar.hidden = !open;
    root.classList.toggle("is-sidebar-closed", !open);
    $(".wp-header [data-toggle-sidebar]").setAttribute("aria-pressed", String(open));
  }));
  $$("[data-panel-toggle]").forEach((b) => b.addEventListener("click", () => openPanel(b.closest("[data-panel]").dataset.panel)));
  function openPanel(key, force) {
    const panel = $(`[data-panel="${key}"]`);
    const btn = panel.querySelector("[data-panel-toggle]");
    const open = force ?? btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    panel.querySelector(".wp-panel-body").hidden = !open;
    if (open) { if (key === "structure") refreshStructure(); if (key === "checklist" || key === "revisions") refreshPublication(); if (key === "media") refreshMedia(); }
  }
  const revealPanel = (key) => { if (sidebar.hidden) $(".wp-header [data-toggle-sidebar]").click(); showSidebarTab("article"); openPanel(key, true); $(`[data-panel="${key}"]`).scrollIntoView({ block: "start", behavior: "smooth" }); };

  // ---------- Onglet Bloc : réglages du bloc sélectionné ----------
  const inspector = $("[data-block-inspector]");
  const DESC = { paragraph: "Commencez par le bloc de construction de toute narration.", heading: "Introduit une nouvelle section et organise le contenu.", kbImage: "Insérez une image pour illustrer votre propos.", kbGallery: "Affichez plusieurs images dans une galerie.", kbVideo: "Intégrez une vidéo.", kbAudio: "Intégrez un fichier audio.", kbEmbed: "Intégrez un contenu externe.", kbButton: "Invitez les lecteurs à agir.", callout: "Mettez une information en évidence.", kbCourse: "Recommandez une formation du catalogue.", kbNewsletter: "Formulaire d'inscription à la newsletter.", table: "Données structurées en tableau.", kbSteps: "Guide pas à pas (HowTo).", kbFaq: "Questions fréquentes (FAQPage).", kbCompare: "Comparaison en colonnes.", kbCta: "Encadré d'appel à l'action.", bulletList: "Liste à puces.", orderedList: "Liste numérotée.", taskList: "Liste de contrôle.", blockquote: "Mettez en valeur une citation.", codeBlock: "Code en respectant l'espacement.", kbAccordion: "Masquez et affichez du contenu." };
  function renderInspector() {
    if ($('[data-sidebar-panel="bloc"]').hidden) return;
    const b = currentBlock();
    inspector.replaceChildren();
    if (!b) { inspector.append(h("p", { class: "wp-help wp-empty-inspector" }, "Aucun bloc sélectionné.")); return; }
    const node = b.node;
    const t = node.type.name;
    const a = node.attrs;
    const set = (attrs) => setAttrsAt(b.pos, attrs);
    inspector.append(h("div", { class: "wp-block-card" }, h("span", { class: "wp-block-card-icon" }, svg(ICON_OF[t] || "paragraph")), h("div", {}, h("h2", {}, nameOf(node)), h("p", {}, DESC[t] || ""))));
    const section = (title, ...children) => h("div", { class: "wp-panel is-open" }, h("h2", { class: "wp-panel-title is-static" }, title), h("div", { class: "wp-panel-body" }, ...children));
    const bind = (el, key, transform = (x) => x) => { el.addEventListener("input", debounce(() => set({ [key]: transform(el.value) }), 300)); return el; };
    if (t === "paragraph" || t === "heading") {
      const align = node.attrs.textAlign || "left";
      inspector.append(section("Typographie",
        h("p", { class: "wp-label" }, "Alignement"),
        segmented([["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"]], align, (v) => chain().setTextAlign(v).run()),
        t === "heading" ? h("p", { class: "wp-label" }, "Niveau de titre") : null,
        t === "heading" ? segmented([1, 2, 3, 4].map((l) => [l, `Titre ${l}`]), a.level, (l) => chain().setHeading({ level: Number(l) }).run()) : null,
        t === "heading" ? h("p", { class: "wp-help" }, "H2 et H3 apparaissent dans le sommaire. Le titre de l'article est déjà le H1 de la page.") : null));
      inspector.append(section("Couleur", h("p", { class: "wp-help" }, "Sélectionnez du texte, puis utilisez « Plus » (˅) dans la barre d'outils du bloc pour la couleur et le surligneur.")));
    } else if (t === "kbImage") {
      inspector.append(h("img", { class: "wp-inspector-preview", src: a.src, alt: "" }));
      const alt = textarea({ rows: 3 }, a.alt || "");
      bind(alt, "alt");
      inspector.append(section("Réglages",
        control("Texte alternatif (alternative textuelle)", alt, "Décrivez le but de l'image. Laissez vide si elle est purement décorative."),
        !a.alt ? h("p", { class: "wp-warning" }, "⚠ Texte alternatif manquant : l'image est invisible pour les lecteurs d'écran et Google Images.") : null,
        control("Légende", bind(input({ value: a.caption || "" }), "caption")),
        control("Crédit", bind(input({ value: a.credit || "" }), "credit")),
        control("Titre (infobulle)", bind(input({ value: a.title || "" }), "title")),
        h("p", { class: "wp-label" }, "Largeur"),
        segmented([["25", "25 %"], ["50", "50 %"], ["75", "75 %"], ["100", "100 %"]], a.width, (v) => set({ width: v })),
        h("p", { class: "wp-label" }, "Alignement"),
        segmented([["left", "Gauche"], ["center", "Centre"], ["right", "Droite"], ["wide", "Large"]], a.align, (v) => set({ align: v })),
        h("p", { class: "wp-help" }, "Chargement différé automatique."),
        h("div", { class: "wp-button-row" },
          h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ onSelect: (m, extra) => set({ src: m.path, mediaId: m.id, alt: extra.alt || a.alt }) }) }, "Remplacer"),
          h("button", { type: "button", class: "wp-btn-secondary", onclick: () => { setCover(a.src, a.alt); toast("Image mise en avant définie."); } }, "Définir comme image mise en avant"))));
    } else if (t === "kbGallery") {
      inspector.append(section("Réglages",
        h("p", { class: "wp-label" }, "Colonnes"),
        segmented([["2", "2"], ["3", "3"], ["4", "4"]], a.columns, (v) => set({ columns: v })),
        h("p", { class: "wp-label" }, "Images"),
        h("ul", { class: "wp-gallery-items" }, ...(a.images || []).map((img, i) => {
          const alt = input({ value: img.alt || "", placeholder: "Texte alternatif", "aria-label": `Texte alternatif de l'image ${i + 1}` });
          alt.addEventListener("input", debounce(() => { const images = [...currentBlock().node.attrs.images]; images[i] = { ...images[i], alt: alt.value }; set({ images }); }, 300));
          return h("li", {}, h("img", { src: img.src, alt: "" }), alt, h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Retirer l'image", onclick: () => { const images = [...currentBlock().node.attrs.images]; images.splice(i, 1); set({ images }); renderInspector(); } }, "×"));
        })),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ multiple: true, onSelectMany: (list) => set({ images: [...a.images, ...list.map((m) => ({ src: m.path, alt: m.alt || "", caption: m.caption || "" }))] }) }) }, "Ajouter des images")));
    } else if (t === "kbVideo" || t === "kbEmbed") {
      inspector.append(section("Réglages", control("Adresse", bind(input({ value: a.url || "", type: "url" }), "url"), t === "kbVideo" ? "YouTube, Vimeo, ou un fichier vidéo téléversé." : "YouTube et Vimeo deviennent un lecteur ; les autres adresses s'affichent comme un lien (sécurité)."), control("Légende", bind(input({ value: a.caption || "" }), "caption"))));
    } else if (t === "kbAudio") {
      inspector.append(section("Réglages", control("Titre", bind(input({ value: a.title || "" }), "title")), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ kind: "audio", onSelect: (m) => set({ src: m.path }) }) }, "Remplacer le fichier")));
    } else if (t === "kbButton") {
      const href = input({ value: a.href || "" });
      href.addEventListener("input", debounce(() => { if (/^(https?:\/\/\S+|\/(?!\/)\S*|mailto:\S+)$/i.test(href.value.trim())) set({ href: href.value.trim() }); }, 300));
      inspector.append(section("Réglages", control("Texte", bind(input({ value: a.text || "" }), "text")), control("Lien", href, "/catalogue, /cours/…, ou https://…"),
        h("p", { class: "wp-label" }, "Style"), segmented([["primary", "Plein"], ["outline", "Contour"]], a.variant, (v) => set({ variant: v })),
        h("p", { class: "wp-label" }, "Alignement"), segmented([["left", "Gauche"], ["center", "Centre"], ["right", "Droite"]], a.align, (v) => set({ align: v })),
        checkbox("Ouvrir dans un nouvel onglet", a.newTab, (v) => set({ newTab: v }))));
    } else if (t === "callout") {
      inspector.append(section("Réglages", control("Type", (() => { const s = select(Object.entries(CALLOUT_LABELS), a.type); s.addEventListener("change", () => set({ type: s.value })); return s; })()), control("Titre personnalisé", bind(input({ value: a.title || "", placeholder: CALLOUT_LABELS[a.type] }), "title"))));
    } else if (t === "kbCourse") {
      inspector.append(section("Réglages", control("Formation", (() => { const s = select(DATA.courses.map((c) => [c.slug, c.title]), a.slug); s.addEventListener("change", () => set({ slug: s.value })); return s; })(), "La carte disparaît d'elle-même si la formation est dépubliée.")));
    } else if (t === "kbSteps") {
      inspector.append(section("Réglages", control("Titre du guide", bind(input({ value: a.title || "" }), "title"), "Utilisé dans les données structurées HowTo. Chaque étape : un titre en gras, puis l'explication.")));
    } else if (t === "kbCompare") {
      const cols = [];
      node.forEach((col, offset) => cols.push({ pos: b.pos + 1 + offset, tone: col.attrs.tone }));
      inspector.append(section("Colonnes", ...cols.map((c, i) => control(`Colonne ${i + 1}`, (() => { const s = select([["pro", "Pour / avantages"], ["con", "Contre / limites"], ["neutral", "Neutre"]], c.tone); s.addEventListener("change", () => setAttrsAt(c.pos, { tone: s.value })); return s; })()))));
    } else if (t === "kbNewsletter") {
      inspector.append(section("Réglages", h("p", { class: "wp-help" }, DATA.newsletterReady ? "Le formulaire affiché se choisit dans la liste des articles (réglage « newsletter »)." : "Aucun formulaire publié : ce bloc n'apparaîtra pas tant qu'un formulaire d'inscription n'est pas publié dans Marketing.")));
    } else if (t === "table") {
      inspector.append(section("Réglages", h("div", { class: "wp-button-row" },
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => chain().toggleHeaderRow().run() }, "Ligne d'en-tête"),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => chain().addRowAfter().run() }, "+ Ligne"),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => chain().addColumnAfter().run() }, "+ Colonne"))));
    } else if (t === "bulletList" || t === "orderedList") {
      inspector.append(section("Réglages", segmented([["bulletList", "Liste à puces", "list"], ["orderedList", "Liste numérotée", "ordered"]], t, (v) => (v === "orderedList" ? chain().toggleOrderedList().run() : chain().toggleBulletList().run())), h("p", { class: "wp-help" }, "Tabulation : imbriquer un élément. Maj + Tabulation : le sortir d'un niveau.")));
    }
    inspector.append(section("Avancé", h("div", { class: "wp-button-row" }, h("button", { type: "button", class: "wp-btn-secondary", onclick: () => duplicateBlock(b.top) }, "Dupliquer"), h("button", { type: "button", class: "wp-btn-danger", onclick: () => deleteBlock(b.top) }, "Supprimer le bloc"))));
  }

  // ---------- Article : étiquettes, catégories, sous-catégories ----------
  const tagsValue = $("[data-tags-value]");
  const tagList = $("[data-tag-list]");
  const tagInput = $("[data-tag-input]");
  let tags = tagsValue.value.split(",").map((t) => t.trim()).filter(Boolean);
  const renderTags = () => {
    tagsValue.value = tags.join(", ");
    tagList.replaceChildren(...tags.map((t, i) => h("li", { class: "wp-token" }, h("span", {}, t), h("button", { type: "button", "aria-label": `Retirer l'étiquette ${t}`, onclick: () => { tags.splice(i, 1); renderTags(); changed(); } }, "×"))));
  };
  const addTag = () => {
    for (const raw of tagInput.value.split(",")) {
      const t = raw.replace(/\s+/g, " ").trim();
      if (!t) continue;
      const known = DATA.tags.find((x) => norm(x) === norm(t));
      if (!tags.some((x) => norm(x) === norm(t)) && tags.length < 10) tags.push(known || t);
    }
    tagInput.value = "";
    renderTags();
    changed();
  };
  tagInput.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } if (e.key === "Backspace" && !tagInput.value && tags.length) { tags.pop(); renderTags(); changed(); } });
  tagInput.addEventListener("change", addTag);
  renderTags();
  const subList = $("#dl-subcategories");
  const categoryInput = $("#post-category");
  const refreshSubcategories = () => { const cat = norm(categoryInput.value); subList.replaceChildren(...DATA.subcategories.filter((s) => norm(s.category) === cat).map((s) => h("option", { value: s.subcategory }))); };
  categoryInput.addEventListener("input", refreshSubcategories);
  $$("[data-pick-category]").forEach((b) => b.addEventListener("click", () => { categoryInput.value = b.dataset.pickCategory; refreshSubcategories(); changed(); }));
  refreshSubcategories();

  // ---------- Compteurs, aperçus, analyse SEO ----------
  const counters = $$("[data-count-for]");
  const refreshCounters = () => counters.forEach((c) => { const el = document.getElementById(c.dataset.countFor); const n = el.value.length; c.textContent = `${n} / ${c.dataset.max}`; c.classList.toggle("is-over", n > Number(c.dataset.max)); });
  const siteHost = DATA.siteUrl.replace(/^https?:\/\//, "");
  const currentSlug = () => field("slug").value.trim() || slugify(field("title").value) || "article";
  const cut = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trim()}…` : text);
  const imagePicks = {};
  function refreshPreviews() {
    const title = field("seo_title").value.trim() || field("title").value.trim() || "Titre de l'article";
    const desc = field("seo_description").value.trim() || field("excerpt").value.trim() || "Ajoutez une méta description : sinon Google choisira lui-même un extrait.";
    $("[data-google-preview]").replaceChildren(h("span", { class: "be-g-site" }, "KOYEKOLA"), h("span", { class: "be-g-url" }, `${siteHost} › blog › ${currentSlug()}`), h("span", { class: "be-g-title" }, cut(`${title} · KOYEKOLA`, 62)), h("span", { class: "be-g-desc" }, cut(desc, 158)));
    const ogTitle = field("og_title").value.trim() || title;
    const ogDesc = field("og_description").value.trim() || desc;
    const ogImg = imagePicks.og.current() || imagePicks.cover.current();
    $("[data-social-preview='og']").replaceChildren(ogImg ? h("img", { src: ogImg, alt: "" }) : h("div", { class: "be-s-noimg" }, "Pas d'image : le partage sera peu visible"), h("div", { class: "be-s-body" }, h("span", { class: "be-s-host" }, siteHost.toUpperCase()), h("strong", {}, cut(ogTitle, 88)), h("span", {}, cut(ogDesc, 110))));
    const xImg = imagePicks.twitter.current() || ogImg;
    const large = field("twitter_card").value !== "summary";
    $("[data-social-preview='x']").replaceChildren(h("div", { class: large ? "be-x be-x-large" : "be-x" }, xImg ? h("img", { src: xImg, alt: "" }) : null, h("div", { class: "be-s-body" }, h("strong", {}, cut(field("twitter_title").value.trim() || ogTitle, 70)), h("span", {}, cut(field("twitter_description").value.trim() || ogDesc, 110)), h("span", { class: "be-s-host" }, siteHost))));
    $("[data-doc-title]").textContent = field("title").value.trim() || "Sans titre";
    $("[data-card-title]").textContent = field("title").value.trim() || "Sans titre";
  }
  const STATUS_LABEL = { good: "BON", improve: "À AMÉLIORER", problem: "PROBLÈME" };
  const GROUP_LABEL = { keyword: "Mot-clé", seo: "Référencement", structure: "Contenu et structure", media: "Images", links: "Liens", readability: "Lisibilité" };
  let lastAnalysis = null;
  function refreshAnalysis() {
    const r = analyze({
      title: field("title").value, seoTitle: field("seo_title").value, metaDescription: field("seo_description").value, slug: currentSlug(), canonical: field("canonical_url").value,
      siteUrl: DATA.siteUrl, focusKeyword: field("focus_keyword").value, secondaryKeywords: field("secondary_keywords").value, html: editor.getHTML(),
      hasCover: Boolean(imagePicks.cover.current()), coverAlt: field("cover_alt").value,
    });
    lastAnalysis = r;
    const groups = {};
    for (const c of r.checks) (groups[c.group] = groups[c.group] || []).push(c);
    $("[data-analysis]").replaceChildren(
      h("p", { class: "be-analysis-summary" }, h("span", { class: "be-pill be-good" }, `${r.summary.good} bon`), h("span", { class: "be-pill be-improve" }, `${r.summary.improve} à améliorer`), h("span", { class: "be-pill be-problem" }, `${r.summary.problem} problème${r.summary.problem > 1 ? "s" : ""}`)),
      ...Object.entries(groups).map(([g, list]) => h("details", { class: "be-analysis-group", open: list.some((c) => c.status !== "good") }, h("summary", {}, GROUP_LABEL[g] || g),
        h("ul", {}, ...list.map((c) => h("li", { class: `be-check be-${c.status}` }, h("span", { class: "be-check-status" }, STATUS_LABEL[c.status]), h("span", {}, h("strong", {}, c.label), c.advice ? h("small", {}, c.advice) : null)))))));
    const dot = $("[data-seo-dot]");
    dot.className = `be-tab-dot ${r.summary.problem ? "be-problem" : r.summary.improve ? "be-improve" : "be-good"}`;
    dot.title = `${r.summary.problem} problème(s), ${r.summary.improve} point(s) à améliorer`;
    $("[data-stats]").textContent = `${r.words} mots · ${r.minutes} min de lecture`;
    const minutes = field("reading_minutes").value;
    $("[data-minutes-hint]").textContent = minutes ? `Calcul automatique : ${r.minutes} min (fixé à ${minutes} min).` : `Calculé automatiquement : ${r.minutes} min (230 mots par minute).`;
  }

  // ---------- Images mise en avant, de partage et X ----------
  function makePick(key, initialPath, hiddenField, removeField, fileInput) {
    const box = $(`[data-image-pick="${key}"]`);
    const state = { path: initialPath || null, objectUrl: null };
    const render = () => {
      const img = state.objectUrl || state.path;
      box.replaceChildren(
        img ? h("button", { type: "button", class: "wp-featured-image", "aria-label": "Remplacer l'image", onclick: pick }, h("img", { src: img, alt: "" })) : h("button", { type: "button", class: "wp-featured-placeholder", onclick: pick }, key === "cover" ? "Définir l'image mise en avant" : "Choisir une image"),
        img ? h("div", { class: "wp-button-row" }, h("button", { type: "button", class: "wp-btn-secondary", onclick: pick }, "Remplacer"), h("button", { type: "button", class: "wp-btn-link is-danger", onclick: () => { state.path = null; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = ""; field(removeField).value = "1"; render(); changed(); } }, "Retirer")) : null);
    };
    function pick() { openMediaModal({ onSelect: (m) => { state.path = m.path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = m.path; field(removeField).value = ""; if (key === "cover" && !field("cover_alt").value) field("cover_alt").value = m.alt || ""; render(); changed(); } }); }
    fileInput.addEventListener("change", () => { const f = fileInput.files[0]; state.objectUrl = f ? URL.createObjectURL(f) : null; field(removeField).value = ""; render(); changed(); });
    render();
    imagePicks[key] = { current: () => state.objectUrl || state.path, set: (path) => { state.path = path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = path; field(removeField).value = ""; render(); }, saved: (path) => { state.path = path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = ""; field(removeField).value = ""; render(); } };
  }
  makePick("cover", DATA.coverPath, "cover_media", "remove_cover", $("#post-cover"));
  makePick("og", DATA.ogImagePath, "og_image_media", "remove_og_image", $("#post-og-image"));
  makePick("twitter", DATA.twitterImagePath, "twitter_image_media", "remove_twitter_image", $("#post-tw-image"));
  function setCover(path, alt) { imagePicks.cover.set(path); if (alt && !field("cover_alt").value) field("cover_alt").value = alt; changed(); }

  // ---------- Structure, schémas, maillage interne ----------
  function headingsOf() {
    const out = [];
    editor.state.doc.descendants((node, pos) => { if (node.type.name === "heading") out.push({ level: node.attrs.level, text: node.textContent, pos }); });
    return out;
  }
  function refreshStructure() {
    const cat = field("category").value.trim();
    $("[data-crumbs]").textContent = ["Accueil", "Blog", ...(cat ? [cat] : []), field("title").value.trim() || "Article"].join(" › ");
    const json = JSON.stringify(editor.getJSON());
    const has = (type) => json.includes(`"type":"${type}"`);
    $("[data-schema]").replaceChildren(
      h("li", {}, `✓ ${field("schema_type").value} : titre, description, image, auteur, éditeur, dates, page`),
      h("li", {}, `✓ BreadcrumbList : ${cat ? "Accueil › Blog › catégorie › article" : "Accueil › Blog › article"}`),
      h("li", {}, has("kbFaq") ? "✓ FAQPage : généré depuis votre bloc FAQ" : "– FAQPage : ajoutez un bloc FAQ pour l'obtenir"),
      h("li", {}, has("kbSteps") ? "✓ HowTo : généré depuis votre bloc Étapes" : "– HowTo : ajoutez un bloc Étapes pour l'obtenir"));
  }
  $$("[data-toc-option]").forEach((el) => el.addEventListener("change", refreshStructure));
  $("#post-schema").addEventListener("change", refreshStructure);
  const linkedUrls = () => { const out = []; editor.state.doc.descendants((n) => { for (const m of n.marks || []) if (m.type.name === "link") out.push(m.attrs.href); }); return out; };
  $("[data-suggest]").addEventListener("click", async () => {
    const box = $("[data-suggestions]");
    box.replaceChildren(h("li", { class: "wp-help" }, "Analyse du texte…"));
    try {
      const { suggestions } = await api("/formateur/blog/api/suggestions", { method: "POST", json: { text: `${field("title").value} ${editor.getText()}`, postId, linked: linkedUrls() } });
      box.replaceChildren(...suggestions.map((s) => h("li", { class: "be-suggestion" }, h("span", { class: "be-chip" }, s.label), h("strong", {}, s.title), h("small", {}, `${s.url} — ${s.reason}`),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => {
          if (editor.state.selection.empty) { toast("Sélectionnez d'abord, dans l'article, le mot ou l'expression à lier.", "error"); return; }
          chain().setLink({ href: s.url, target: null, rel: null }).run();
          toast(`Lien ajouté vers « ${s.title} ».`);
        } }, "Lier la sélection"))));
      if (!suggestions.length) box.append(h("li", { class: "wp-help" }, "Aucune suggestion : le texte ne mentionne pas encore de formation ou d'article existant."));
    } catch (e) { box.replaceChildren(h("li", { class: "wp-error" }, e.message)); }
  });
  function refreshMedia() {
    const list = $("[data-image-list]");
    const items = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "kbImage") items.push({ src: node.attrs.src, alt: node.attrs.alt, pos });
      if (node.type.name === "kbGallery") for (const img of node.attrs.images || []) items.push({ src: img.src, alt: img.alt, pos });
    });
    list.replaceChildren(...items.map((it) => h("li", { class: it.alt ? "" : "be-warn" }, h("img", { src: it.src, alt: "" }), h("span", {}, it.alt || "⚠ Texte alternatif manquant"), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => { editor.chain().focus().setNodeSelection(it.pos).scrollIntoView().run(); showSidebarTab("bloc"); } }, "Modifier"))));
    if (!items.length) list.append(h("li", { class: "wp-help" }, "Aucune image dans le contenu."));
  }

  // ---------- Publication : statut, date, liste de contrôle, révisions ----------
  const statusSelect = $("[data-status-select]");
  const dateInput = $("[data-date-input]");
  if (dateInput.value && dateInput.dataset.utc === "1") {
    const d = new Date(`${dateInput.value}:00Z`);
    if (!Number.isNaN(d.getTime())) dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const initialDate = dateInput.value;
  function syncStatus() {
    field("status").value = statusSelect.value;
    const scheduled = statusSelect.value === "scheduled";
    $("[data-date-hint]").textContent = scheduled ? "L'article sera publié automatiquement à cette date." : dateInput.value ? "" : "Immédiatement, à la publication.";
    $("[data-publish]").textContent = DATA.status === "published" ? "Mettre à jour" : scheduled ? "Planifier…" : "Publier";
  }
  statusSelect.addEventListener("change", () => { syncStatus(); refreshPublication(); changed(); });
  dateInput.addEventListener("change", () => { syncStatus(); changed(); });
  syncStatus();
  const dateUtc = () => { if (!dateInput.value) return ""; if (dateInput.value === initialDate && statusSelect.value !== "scheduled") return ""; const d = new Date(dateInput.value); return Number.isNaN(d.getTime()) ? "" : d.toISOString(); };
  function checklist() {
    const html = editor.getHTML();
    const text = editor.getText().trim();
    const r = lastAnalysis || { checks: [] };
    const okCheck = (id) => { const c = r.checks.find((x) => x.id === id); return c ? c.status !== "problem" : true; };
    const images = [];
    editor.state.doc.descendants((n) => { if (n.type.name === "kbImage") images.push(n.attrs.alt); if (n.type.name === "kbGallery") for (const i of n.attrs.images || []) images.push(i.alt); });
    const canonical = field("canonical_url").value.trim();
    return [
      { label: "Titre présent", ok: Boolean(field("title").value.trim()), blocking: true },
      { label: "Contenu rédigé", ok: Boolean(text) || /<(img|figure)\b|kb-(video|audio|embed|course|newsletter)/.test(html), blocking: true },
      { label: "H1 correct (aucun titre 1 dans le contenu)", ok: !headingsOf().some((x) => x.level === 1) },
      { label: "Extrait présent", ok: Boolean(field("excerpt").value.trim()) },
      { label: "Image mise en avant", ok: Boolean(imagePicks.cover.current()) },
      { label: "Textes alternatifs des images", ok: images.every(Boolean) && (!imagePicks.cover.current() || Boolean(field("cover_alt").value.trim())) },
      { label: "Titre SEO", ok: okCheck("seo-title") },
      { label: "Méta description", ok: Boolean(field("seo_description").value.trim()) },
      { label: "Lien (slug)", ok: Boolean(currentSlug()) },
      { label: "URL canonique valide", ok: !canonical || /^https:\/\/\S+$/i.test(canonical) },
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
    $("[data-dates]").textContent = DATA.createdAt ? `Modifié le ${fmtDate(DATA.updatedAt)}${DATA.publishedAt ? ` · publication : ${fmtDate(DATA.publishedAt)}` : ""}` : "Pas encore enregistré.";
    renderVersions();
  }
  $("[data-reviewed]").addEventListener("change", refreshPublication);
  function renderVersions() {
    const list = $("[data-versions]");
    $("[data-revision-count]").textContent = DATA.revisions.length ? String(DATA.revisions.length) : "";
    list.replaceChildren(...DATA.revisions.map((r, i) => h("li", {},
      h("span", { class: "be-version-when" }, fmtDate(r.created_at)), h("span", { class: "be-version-who" }, r.author || "—"), h("span", { class: "be-version-note" }, r.note || "Enregistrement"),
      h("span", { class: "be-version-actions" },
        h("button", { type: "button", class: "wp-btn-link", onclick: () => viewVersion(r) }, "Consulter"),
        i > 0 ? h("button", { type: "button", class: "wp-btn-link", onclick: () => restoreVersion(r) }, "Restaurer") : h("span", { class: "wp-help" }, "actuelle")))));
    if (!DATA.revisions.length) list.append(h("li", { class: "wp-help" }, "Les révisions apparaîtront après le premier enregistrement."));
  }
  async function viewVersion(r) {
    try {
      const v = await api(`/formateur/blog/${postId}/versions/${r.id}`);
      const body = h("div", { class: "be-version-view" }, h("p", { class: "wp-help" }, `${fmtDate(v.created_at)} · ${v.note}`), h("h2", {}, v.title), v.excerpt ? h("p", { class: "article-lead" }, v.excerpt) : null);
      const content = h("div", { class: "markdown article-content" });
      content.innerHTML = v.html; // HTML déjà assaini et rendu par le serveur
      body.append(content);
      modal("Révision", body, [{ label: "Restaurer cette révision", primary: true, run: () => restoreVersion(r) }], { wide: true });
    } catch (e) { toast(e.message, "error"); }
  }
  async function restoreVersion(r) {
    if (!confirm(`Restaurer la révision du ${fmtDate(r.created_at)} ? La version actuelle reste dans l'historique.`)) return true;
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
  const saveBtn = $("[data-save]");
  let dirty = false;
  let saving = false;
  const setState = (text, cls = "") => { saveState.textContent = text; saveState.className = `wp-save-state ${cls}`; };
  const localDraft = {
    key: () => `be-draft-${postId || "nouveau"}`,
    write() { try { localStorage.setItem(this.key(), JSON.stringify({ at: Date.now(), title: field("title").value, excerpt: field("excerpt").value, content: editor.getHTML() })); } catch { /* stockage indisponible */ } },
    read() { try { return JSON.parse(localStorage.getItem(this.key()) || "null"); } catch { return null; } },
    clear() { try { localStorage.removeItem(this.key()); localStorage.removeItem("be-draft-nouveau"); } catch { /* rien */ } },
  };
  function changed() {
    dirty = true;
    setState("", "is-dirty");
    saveBtn.textContent = DATA.status === "published" ? "Enregistrer" : "Enregistrer le brouillon";
    saveBtn.disabled = false;
    localDraft.write();
    scheduleAutosave();
    refreshLater();
  }
  const refreshLater = debounce(() => {
    refreshCounters(); refreshPreviews(); refreshAnalysis();
    if ($('[data-panel="structure"]').classList.contains("is-open")) refreshStructure();
    if ($('[data-panel="checklist"]').classList.contains("is-open")) refreshPublication();
    if ($('[data-panel="media"]').classList.contains("is-open")) refreshMedia();
    if (secondaryMode === "list") renderListView();
  }, 350);
  function formPayload({ withFiles }) {
    if (!codeEditor.hidden) editor.commands.setContent(codeEditor.value);
    codeEditor.value = editor.getHTML();
    field("published_at_utc").value = dateUtc();
    const data = new FormData(form);
    if (!withFiles) for (const name of ["thumbnail", "og_image", "twitter_image"]) data.delete(name);
    return data;
  }
  async function ensurePost() {
    if (postId) return postId;
    const body = new FormData();
    body.append("title", field("title").value);
    adopt(await api("/formateur/blog/api/brouillon", { method: "POST", body }));
    return postId;
  }
  function adopt(r) {
    const before = localDraft.key();
    postId = r.id;
    form.action = `/formateur/blog/${r.id}/modifier`;
    history.replaceState(null, "", `/formateur/blog/${r.id}/modifier`);
    try { localStorage.removeItem(before); } catch { /* rien */ }
  }
  const scheduleAutosave = debounce(() => autosave(), 2500);
  async function autosave() {
    if (!dirty || saving) return;
    try {
      setState("Enregistrement automatique…", "is-saving");
      const id = await ensurePost();
      await api(`/formateur/blog/${id}/autosave`, { method: "POST", body: formPayload({ withFiles: false }) });
      setState("Brouillon enregistré automatiquement", "is-auto");
    } catch { setState("Modifications non enregistrées", "is-dirty"); }
  }
  async function save({ status } = {}) {
    if (saving) return false;
    if (status) { statusSelect.value = status; syncStatus(); }
    if (!field("title").value.trim()) { toast("Ajoutez un titre avant d'enregistrer.", "error"); titleField.focus(); return false; }
    saving = true;
    setState("Enregistrement…", "is-saving");
    saveBtn.disabled = true;
    try {
      const url = postId ? `/formateur/blog/${postId}/modifier` : "/formateur/blog/nouveau";
      const r = await api(url, { method: "POST", body: formPayload({ withFiles: true }), headers: { "x-blog-editor": "1" } });
      if (!postId) adopt({ id: r.id });
      dirty = false;
      localDraft.clear();
      DATA.status = r.status;
      DATA.publishedAt = r.publishedAt ?? DATA.publishedAt;
      DATA.updatedAt = r.updatedAt;
      DATA.createdAt = DATA.createdAt || r.updatedAt;
      if (r.revisions) DATA.revisions = r.revisions;
      for (const [key, col] of [["cover", "coverPath"], ["og", "ogImagePath"], ["twitter", "twitterImagePath"]]) if (r[col] !== undefined) imagePicks[key].saved(r[col]);
      if (r.slug) { field("slug").value = r.slug; if (r.publishedAt) field("slug").readOnly = true; }
      field("remove_cover").value = ""; field("remove_og_image").value = ""; field("remove_twitter_image").value = "";
      setState("Enregistré", "is-saved");
      saveBtn.textContent = "Enregistré";
      syncStatus();
      refreshPublication();
      refreshPreviews();
      return true;
    } catch (e) {
      setState("Modifications non enregistrées", "is-dirty");
      saveBtn.disabled = false;
      toast(e.message, "error");
      return false;
    } finally { saving = false; }
  }
  form.addEventListener("submit", (e) => { e.preventDefault(); save({ status: DATA.status === "published" ? undefined : statusSelect.value === "published" ? "draft" : undefined }).then((ok) => ok && toast(DATA.status === "published" ? "Article mis à jour." : "Brouillon enregistré.")); });
  document.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save().then((ok) => ok && toast("Enregistré.")); } if (e.key === "Escape") closePopovers(); });
  window.addEventListener("beforeunload", (e) => { if (dirty) { localDraft.write(); e.preventDefault(); e.returnValue = ""; } });
  form.addEventListener("input", (e) => { if (e.target !== codeEditor && !e.target.closest(".wp-modal")) changed(); });
  form.addEventListener("change", (e) => { if (e.target.type === "checkbox" || e.target.tagName === "SELECT") changed(); });
  codeEditor.addEventListener("input", () => changed());
  editor.on("update", () => { changed(); refreshSlash(); });
  const refreshUi = () => { renderBlockToolbar(); refreshAppender(); refreshBreadcrumb(); renderInspector(); };
  editor.on("selectionUpdate", () => { refreshUi(); refreshSlash(); });
  editor.on("transaction", () => requestAnimationFrame(refreshUi));
  editor.on("focus", refreshUi);
  editor.on("blur", () => setTimeout(() => { if (!document.activeElement || !document.activeElement.closest(".wp-block-toolbar, .wp-popover, .wp-top-toolbar")) { blockToolbar.hidden = true; appender.hidden = true; } }, 150));
  window.addEventListener("resize", debounce(refreshUi, 100));
  $(".wp-canvas").addEventListener("scroll", () => requestAnimationFrame(() => { renderBlockToolbar(); refreshAppender(); }), { passive: true });

  // Fil du bloc (pied de page)
  function refreshBreadcrumb() {
    const crumbs = $("[data-breadcrumb]");
    const { $from } = editor.state.selection;
    const items = [h("li", {}, h("button", { type: "button", onclick: () => editor.commands.blur() }, "Document"))];
    const sel = editor.state.selection;
    const depthNodes = [];
    for (let d = 1; d <= $from.depth; d++) depthNodes.push({ node: $from.node(d), pos: $from.before(d) });
    if (sel instanceof NodeSelection) depthNodes.push({ node: sel.node, pos: sel.from });
    for (const { node, pos } of depthNodes) if (LABEL[node.type.name]) items.push(h("li", {}, h("button", { type: "button", onclick: () => (node.isTextblock ? editor.chain().focus().setTextSelection(pos + 1).run() : editor.chain().focus().setNodeSelection(pos).run()) }, nameOf(node))));
    crumbs.replaceChildren(...items);
  }

  // ---------- Publication (panneau « Prêt à publier ? ») ----------
  const publishBtn = $("[data-publish]");
  publishBtn.addEventListener("click", async () => {
    refreshAnalysis();
    if (DATA.status === "published") { const ok = await save({ status: "published" }); if (ok) toast("Article mis à jour."); return; }
    openPrePublish();
  });
  function openPrePublish() {
    const items = checklist();
    const blocking = items.filter((c) => c.blocking && !c.ok);
    const advice = items.filter((c) => !c.blocking && !c.ok);
    const when = h("input", { type: "datetime-local", id: `wp-f${++uid}`, value: statusSelect.value === "scheduled" ? dateInput.value : "" });
    const panelEl = h("div", { class: "wp-prepublish", role: "region", "aria-label": "Panneau de prépublication" },
      h("div", { class: "wp-prepublish-head" },
        blocking.length ? null : h("button", { type: "button", class: "wp-btn-primary", "data-confirm-publish": "", onclick: confirmPublish }, "Publier"),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => panelEl.remove() }, "Annuler")),
      h("div", { class: "wp-prepublish-body" },
        h("p", { class: "wp-prepublish-title" }, blocking.length ? "Encore un effort avant de publier" : "Confirmez-vous la publication ?"),
        h("p", { class: "wp-help" }, "Vérifiez vos réglages avant de publier."),
        blocking.length ? h("div", { class: "wp-notice-inline is-error" }, h("strong", {}, "À corriger :"), h("ul", {}, ...blocking.map((c) => h("li", {}, c.label)))) : null,
        h("div", { class: "wp-panel is-open" }, h("h2", { class: "wp-panel-title is-static" }, "Visibilité : ", h("strong", {}, "Publique"))),
        h("div", { class: "wp-panel is-open" }, h("h2", { class: "wp-panel-title is-static" }, "Publier : ", h("strong", { "data-when-label": "" }, when.value ? new Date(when.value).toLocaleString("fr-FR") : "Immédiatement")),
          h("div", { class: "wp-panel-body" }, control("Planifier (facultatif)", when, "Laissez vide pour publier tout de suite."))),
        advice.length ? h("div", { class: "wp-panel is-open" }, h("h2", { class: "wp-panel-title is-static" }, "Suggestions"), h("div", { class: "wp-panel-body" }, h("ul", { class: "be-checklist" }, ...advice.map((c) => h("li", { class: "be-improve" }, "☐ ", c.label))))) : null));
    when.addEventListener("change", () => {
      const future = when.value && new Date(when.value) > new Date();
      panelEl.querySelector("[data-when-label]").textContent = when.value ? new Date(when.value).toLocaleString("fr-FR") : "Immédiatement";
      const btn = panelEl.querySelector("[data-confirm-publish]");
      if (btn) btn.textContent = future ? "Planifier" : "Publier";
    });
    async function confirmPublish() {
      const future = when.value && new Date(when.value) > new Date();
      if (when.value && !future) { toast("Choisissez une date dans le futur pour planifier.", "error"); return; }
      if (future) dateInput.value = when.value;
      const ok = await save({ status: future ? "scheduled" : "published" });
      if (!ok) return;
      panelEl.replaceChildren(h("div", { class: "wp-prepublish-body" },
        h("p", { class: "wp-prepublish-title" }, future ? `« ${field("title").value} » est planifié.` : `« ${field("title").value} » est maintenant en ligne.`),
        h("p", { class: "wp-label" }, "Adresse de l'article"),
        h("div", { class: "wp-link-input" }, h("input", { type: "text", readonly: true, value: `${DATA.siteUrl}/blog/${field("slug").value}`, "aria-label": "Adresse de l'article" }), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => navigator.clipboard && navigator.clipboard.writeText(`${DATA.siteUrl}/blog/${field("slug").value}`).then(() => toast("Adresse copiée.")) }, "Copier")),
        h("div", { class: "wp-button-row" }, future ? null : h("a", { class: "wp-btn-primary", href: `/blog/${field("slug").value}`, target: "_blank", rel: "noopener" }, "Voir l'article"), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => panelEl.remove() }, "Fermer"))));
    }
    $(".wp-layout").append(panelEl);
    (panelEl.querySelector("[data-confirm-publish]") || panelEl.querySelector("button")).focus();
  }

  // Restauration d'une sauvegarde automatique ou d'une copie locale plus récente que la version enregistrée
  (function offerRestore() {
    const serverSaved = DATA.updatedAt ? Date.parse(`${DATA.updatedAt.replace(" ", "T")}Z`) : 0;
    const local = localDraft.read();
    const auto = DATA.autosave ? { at: Date.parse(`${DATA.autosave.savedAt.replace(" ", "T")}Z`), ...DATA.autosave.data } : null;
    const best = [local, auto].filter((c) => c && c.at > serverSaved + 1000 && (c.content || c.title)).sort((a, b) => b.at - a.at)[0];
    const plain = (html) => new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent.replace(/\s+/g, " ").trim();
    if (!best || (plain(best.content) === plain(editor.getHTML()) && (best.title ?? titleField.value) === titleField.value && (best.excerpt ?? field("excerpt").value) === field("excerpt").value)) return;
    const banner = $("[data-restore]");
    $("[data-restore-text]").textContent = `La sauvegarde de cet article sur ce navigateur (${new Date(best.at).toLocaleString("fr-FR")}) est différente de la version ci-dessous.`;
    banner.hidden = false;
    $("[data-restore-yes]").addEventListener("click", () => {
      if (typeof best.title === "string") titleField.value = best.title;
      if (typeof best.excerpt === "string") field("excerpt").value = best.excerpt;
      if (typeof best.content === "string") editor.commands.setContent(best.content);
      banner.hidden = true;
      growTitle();
      changed();
      toast("Sauvegarde restaurée : vérifiez-la puis enregistrez.");
    });
    $("[data-restore-no]").addEventListener("click", async () => {
      banner.hidden = true;
      localDraft.clear();
      if (postId && DATA.autosave) { try { await api(`/formateur/blog/${postId}/autosave/abandonner`, { method: "POST" }); } catch { /* rien */ } }
    });
  })();
  $$("[data-notice-close]").forEach((b) => b.addEventListener("click", () => b.closest("[data-notice]").remove()));

  // ---------- Menus de la barre supérieure ----------
  const dropdown = (toggleSel, menuSel) => {
    const toggle = $(toggleSel);
    const menu = $(menuSel);
    toggle.addEventListener("click", () => { const open = menu.hidden; $$(".wp-menu").forEach((m) => { m.hidden = true; }); menu.hidden = !open; toggle.setAttribute("aria-expanded", String(open)); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".wp-dropdown")) { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); } });
    return menu;
  };
  const previewMenu = dropdown("[data-preview-toggle]", "[data-preview-menu]");
  const optionsMenu = dropdown("[data-options-toggle]", "[data-options-menu]");
  $$("[data-preview]").forEach((b) => b.addEventListener("click", async () => {
    previewMenu.hidden = true;
    const kind = b.dataset.preview;
    if (kind === "google") return revealPanel("seo");
    if (kind === "social") return revealPanel("social");
    try {
      const id = await ensurePost();
      if (dirty) await autosave();
      if (kind === "tab") return window.open(`/formateur/blog/${id}/apercu?t=${Date.now()}`, "_blank", "noopener");
      // Aperçu dans la page : largeur de l'appareil, comme le sélecteur d'appareil de Gutenberg
      const widths = { desktop: 1280, tablet: 820, mobile: 390 };
      const frame = h("iframe", { class: "be-preview-frame", title: "Aperçu de l'article", src: `/formateur/blog/${id}/apercu?t=${Date.now()}` });
      const wrap = h("div", { class: "be-preview-wrap" }, frame);
      const setDevice = (k) => { frame.style.width = `${widths[k]}px`; const scale = Math.min(1, (wrap.clientWidth - 8) / widths[k]); frame.style.transform = `scale(${scale})`; frame.style.height = `${Math.round(760 / scale)}px`; wrap.style.height = "760px"; devices.querySelectorAll("button").forEach((d) => d.setAttribute("aria-pressed", String(d.dataset.k === k))); };
      const devices = h("div", { class: "wp-segmented" }, ...Object.keys(widths).map((k) => h("button", { type: "button", "data-k": k, onclick: () => setDevice(k) }, { desktop: "Ordinateur", tablet: "Tablette", mobile: "Mobile" }[k])));
      modal("Aperçu", h("div", {}, devices, wrap), [], { wide: true });
      requestAnimationFrame(() => setDevice(kind));
    } catch (e) { toast(e.message, "error"); }
  }));
  // Éditeur visuel / éditeur de code
  $$("[data-mode]").forEach((b) => b.addEventListener("click", () => {
    const code = b.dataset.mode === "code";
    $$("[data-mode]").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    optionsMenu.hidden = true;
    if (code) { codeEditor.value = editor.getHTML(); codeEditor.hidden = false; $("#be-editor").hidden = true; blockToolbar.hidden = true; root.classList.add("is-code-mode"); codeEditor.focus(); }
    else { editor.commands.setContent(codeEditor.value); codeEditor.hidden = true; $("#be-editor").hidden = false; root.classList.remove("is-code-mode"); editor.commands.focus("start"); }
  }));
  $$("[data-option]").forEach((b) => b.addEventListener("click", () => {
    const opt = b.dataset.option;
    optionsMenu.hidden = true;
    if (opt === "shortcuts") return modal("Raccourcis clavier", h("dl", { class: "wp-shortcuts" }, ...[["Ctrl + S", "Enregistrer"], ["Ctrl + Z / Ctrl + Maj + Z", "Annuler / Rétablir"], ["/", "Choisir un bloc (au début d'un paragraphe vide)"], ["Ctrl + B / I / U", "Gras / italique / souligné"], ["Ctrl + K", "Ajouter un lien"], ["Ctrl + Maj + D", "Dupliquer le bloc"], ["Maj + Alt + Z", "Supprimer le bloc"], ["Alt + ↑ / ↓", "Déplacer le bloc"], ["Tab / Maj + Tab", "Imbriquer / désimbriquer un élément de liste"], ["Échap", "Fermer un menu"]].flatMap(([k, d]) => [h("dt", {}, h("kbd", {}, k)), h("dd", {}, d)])));
    const on = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", String(on));
    if (opt === "focus") root.classList.toggle("is-focus-mode", on);
    if (opt === "toptoolbar") { topToolbarMode = on; topToolbar.hidden = !on; blockToolbar.hidden = true; root.classList.toggle("has-top-toolbar", on); renderBlockToolbar(); }
    return null;
  }));
  $("[data-undo]").addEventListener("click", () => editor.chain().focus().undo().run());
  $("[data-redo]").addEventListener("click", () => editor.chain().focus().redo().run());
  $("[data-focus-title]").addEventListener("click", () => { titleField.focus(); titleField.scrollIntoView({ block: "center" }); });

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
  let aiRange = null;
  $$("[data-ai]").forEach((b) => b.addEventListener("mousedown", () => { aiRange = { from: editor.state.selection.from, to: editor.state.selection.to, text: selectionText() }; }));
  $$("[data-ai]").forEach((b) => b.addEventListener("click", async () => {
    const action = b.dataset.ai;
    const range = aiRange || { from: editor.state.selection.from, to: editor.state.selection.to, text: selectionText() };
    aiBox.replaceChildren(h("p", { class: "wp-help" }, "L'IA réfléchit… (quelques secondes)"));
    $$("[data-ai]").forEach((x) => { x.disabled = true; });
    try {
      const r = await api("/formateur/blog/api/ia", { method: "POST", json: { action, text: range.text, article: editor.getText({ blockSeparator: "\n\n" }), title: titleField.value, keyword: field("focus_keyword").value } });
      renderProposal(action, r, range);
    } catch (e) { aiBox.replaceChildren(h("p", { class: "wp-error" }, e.message)); }
    finally { $$("[data-ai]").forEach((x) => { x.disabled = !DATA.aiConfigured; }); }
  }));
  function renderProposal(action, r, range) {
    const res = r.result;
    const reject = h("button", { type: "button", class: "wp-btn-link", onclick: () => aiBox.replaceChildren(h("p", { class: "wp-help" }, "Proposition refusée : rien n'a changé.")) }, "Refuser");
    const done = (msg) => { aiBox.replaceChildren(h("p", { class: "be-good" }, `✓ ${msg}`)); changed(); };
    const card = (...children) => aiBox.replaceChildren(h("div", { class: "be-ai-card" }, h("p", { class: "be-ai-label" }, `Proposition — ${r.label}`), ...children));
    const row = (...x) => h("div", { class: "wp-button-row" }, ...x);
    if (res.proposals) {
      const name = `ai-${Date.now()}`;
      return card(...res.proposals.map((text, i) => h("label", { class: "wp-checkbox" }, h("input", { type: "radio", name, value: text, checked: i === 0 }), ` ${text} `, h("small", {}, `(${text.length} car.)`))),
        row(h("button", { type: "button", class: "wp-btn-primary", onclick: () => { const chosen = aiBox.querySelector(`input[name="${name}"]:checked`); if (!chosen) return; if (action === "titre") { titleField.value = chosen.value; growTitle(); } else field("seo_description").value = chosen.value; done(action === "titre" ? "Titre remplacé." : "Méta description remplie."); } }, "Accepter"), reject));
    }
    if (action === "resumer") return card(h("blockquote", {}, res.text), row(h("button", { type: "button", class: "wp-btn-primary", onclick: () => { field("excerpt").value = res.text.slice(0, 300); done("Extrait rempli."); } }, "Utiliser comme extrait"), reject));
    if (action === "faq") return card(h("ol", {}, ...res.items.map((i) => h("li", {}, h("strong", {}, i.question), h("br"), i.answer))), row(h("button", { type: "button", class: "wp-btn-primary", onclick: () => { editor.chain().focus().insertContentAt(editor.state.doc.content.size, [{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Questions fréquentes" }] }, faqNode(res.items)]).run(); done("FAQ ajoutée à la fin de l'article."); } }, "Ajouter à la fin de l'article"), reject));
    if (action === "mots_cles") return card(h("p", {}, h("strong", {}, "Principal : "), res.focus), h("p", {}, h("strong", {}, "Secondaires : "), res.secondary.join(", ")), h("p", { class: "wp-help" }, res.explanation), row(h("button", { type: "button", class: "wp-btn-primary", onclick: () => { field("focus_keyword").value = res.focus; field("secondary_keywords").value = res.secondary.join(", "); done("Mots-clés remplis (section Référencement)."); } }, "Accepter"), reject));
    if (action === "liens") {
      if (!res.links.length) return card(h("p", {}, "Aucun lien pertinent trouvé dans le texte actuel."));
      const boxes = res.links.map((l) => ({ l, cb: h("input", { type: "checkbox", checked: true }) }));
      return card(h("ul", {}, ...boxes.map(({ l, cb }) => h("li", {}, h("label", { class: "wp-checkbox" }, cb, ` « ${l.anchor} » → ${l.url}`), h("small", {}, l.reason)))), row(h("button", { type: "button", class: "wp-btn-primary", onclick: () => {
        let n = 0;
        for (const { l, cb } of boxes) { if (!cb.checked) continue; const at = findText(l.anchor); if (at) { editor.chain().setTextSelection(at).setLink({ href: l.url, target: null, rel: null }).run(); n++; } }
        done(`${n} lien(s) ajouté(s).`);
      } }, "Ajouter les liens cochés"), reject));
    }
    return card(h("div", { class: "be-ai-text" }, ...toParagraphs(res.text).map((x) => h("p", {}, x.content[0]?.text || ""))), res.changes && res.changes.length ? h("ul", { class: "wp-help" }, ...res.changes.map((c) => h("li", {}, c))) : null,
      row(h("button", { type: "button", class: "wp-btn-primary", onclick: () => {
        const valid = range.to > range.from && range.to <= editor.state.doc.content.size;
        if (valid) editor.chain().focus().insertContentAt({ from: range.from, to: range.to }, toParagraphs(res.text)).run();
        else ins().insertContent(toParagraphs(res.text)).run();
        done("Passage remplacé (Ctrl+Z pour annuler).");
      } }, "Remplacer le passage"), reject));
  }

  // ---------- Premier affichage ----------
  refreshCounters();
  refreshPreviews();
  refreshAnalysis();
  refreshPublication();
  refreshBreadcrumb();
  setState(DATA.postId ? "Enregistré" : "", DATA.postId ? "is-saved" : "");
  if (DATA.postId) { saveBtn.textContent = "Enregistré"; saveBtn.disabled = true; }
  if (!DATA.aiConfigured) $$("[data-ai]").forEach((x) => { x.disabled = true; });
  if (!titleField.value) titleField.focus();
  // Petit écran : la barre latérale démarre fermée (comme Gutenberg)
  if (window.matchMedia("(max-width: 782px)").matches) { sidebar.hidden = true; root.classList.add("is-sidebar-closed"); $(".wp-header [data-toggle-sidebar]").setAttribute("aria-pressed", "false"); }
}

// Démarrage une fois tout le module défini (les icônes ci-dessus doivent exister)
if (root) start();
