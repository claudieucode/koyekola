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
import { DOMParser as PMDOMParser } from "@tiptap/pm/model";
import { BLOG_NODES, CALLOUT_LABELS, reusableContent, forgetReusable } from "./blog/nodes";
import { BlockHandle, moveBlock, startBlockDrag, endBlockDrag, zoneBlockPos, ZONES } from "./blog/dragHandle";
import { createWorkspace } from "./blog/workspace";
import { createSeoData, createRenderers } from "./blog/seoPanels";
import { setupWorkspaceUi } from "./blog/workspaceUi";
import { BlockLock, FindHighlight, LOCKABLE_TYPES, setLocked, isLocked, findMatches, findKey, blockHtml, contentHtml } from "./blog/editing";
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
  // Espace de travail SEO (créé à la fin du démarrage, une fois tous les panneaux prêts)
  let workspace = null;
  let seoData = null;
  let seoRenderers = null;
  let wsUi = null;

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

  // Modification refusée sur un bloc verrouillé (message au plus toutes les 4 s)
  let lockNoticeAt = 0;
  function lockedNotice() {
    if (Date.now() - lockNoticeAt < 4000) return;
    lockNoticeAt = Date.now();
    toast("Bloc verrouillé : clic droit (ou ⋮) → « Déverrouiller » pour le modifier.", "error");
  }

  // ---------- Fenêtres (modales WordPress) ----------
  function modal(title, body, actions = [], { wide = false } = {}) {
    const dlg = h("dialog", { class: `wp-modal${wide ? " is-wide" : ""}`, "aria-labelledby": "wp-modal-title" });
    const close = () => { dlg.close(); dlg.remove(); };
    const foot = actions.length ? h("div", { class: "wp-modal-actions" }, ...actions.map((a) => h("button", { type: "button", class: a.primary ? "wp-btn-primary" : a.danger ? "wp-btn-danger" : "wp-btn-secondary", onclick: async () => { const keep = await a.run?.(close); if (keep !== true) close(); } }, a.label))) : null;
    dlg.append(h("div", { class: "wp-modal-head" }, h("h1", { id: "wp-modal-title" }, title), h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Fermer", onclick: close }, "×")), h("div", { class: "wp-modal-body" }, body), ...(foot ? [foot] : []));
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
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] }, dropcursor: { class: "kb-dropcursor", color: "var(--accent)", width: 2 }, link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: null, target: null, class: null } } }),
      TextStyleKit.configure({ fontFamily: false, fontSize: false, lineHeight: false, backgroundColor: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Subscript, Superscript, TaskList, TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ includeChildren: false, placeholder: ({ node, editor: ed }) => (node.type.name === "heading" ? "Titre" : ed.state.doc.childCount <= 1 ? "Commencez à écrire, ou tapez / pour ajouter un bloc" : "Tapez / pour ajouter un bloc") }),
      ...BLOG_NODES,
      Focus.configure({ mode: "shallowest", className: "has-focus" }),
      BlockHandle.configure({ visual: false }),
      BlockLock.configure({ onBlocked: () => lockedNotice() }),
      FindHighlight,
    ],
    content: codeEditor.value,
    editorProps: { attributes: { class: "be-prose wp-block-list", "aria-label": "Contenu de l'article", role: "textbox", "aria-multiline": "true" } },
  });
  codeEditor.hidden = true;
  $("[data-content-label]").hidden = true;
  root.classList.add("be-ready");
  root.editor = editor; // accès pour les vérifications automatiques (navigateur)
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
  // La largeur de la zone change (panneaux ouverts, fenêtre redimensionnée) : le titre se réajuste
  if ("ResizeObserver" in window) new ResizeObserver(() => growTitle()).observe($(".wp-canvas"));
  else window.addEventListener("resize", debounce(growTitle, 100));

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
  const CONTAINERS = new Set(["kbColumns", "kbButtons", "callout", "kbCta", "kbFaq", "kbFaqItem", "kbFaqAnswer", "kbAccordion", "kbAccordionBody", "kbCompare", "kbCompareCol", "kbSteps", "table", "blockquote", "bulletList", "orderedList", "taskList"]);
  // Bloc complexe : jamais imbriqué par accident ; il remplace un paragraphe vide, sinon il se place après le bloc courant
  const COL = () => ({ type: "kbColumn", content: [p("")] });
  const GOOGLE_MAP = /^https:\/\/www\.google\.com\/maps\/embed\?pb=[A-Za-z0-9!._%~:-]{10,2000}$/;
  // Code d'intégration Google Maps collé tel quel : on n'en garde que l'adresse de la carte
  const mapsUrl = (v) => { const m = String(v || "").match(/src=["']([^"']+)["']/); return (m ? m[1] : String(v || "")).trim().replace(/&amp;/g, "&"); };
  function blk(content) {
    const sel = editor.state.selection;
    const { $from } = sel;
    // Zone d'insertion : le document, ou la colonne / le groupe le plus proche du curseur (blocs imbriqués)
    let zone = 0;
    for (let d = 1; d <= $from.depth; d++) if (ZONES.has($from.node(d).type.name)) zone = d;
    for (let d = zone + 1; d <= $from.depth; d++) if (CONTAINERS.has($from.node(d).type.name)) return placeAfter($from.after(zone + 1), content);
    if (sel instanceof NodeSelection) return placeAfter(sel.to, content);
    const parent = $from.parent;
    if ($from.depth === zone + 1 && parent.type.name === "paragraph" && parent.content.size === 0 && $from.node(zone).childCount > 1) {
      const at = $from.before(zone + 1);
      editor.chain().focus().command(({ tr }) => { tr.delete(at, at + parent.nodeSize); return true; }).run();
      return placeAfter(at, content);
    }
    if ($from.depth === zone + 1 && parent.type.name === "paragraph" && parent.content.size === 0 && zone === 0) {
      const at = $from.before(1);
      editor.chain().focus().command(({ tr }) => { tr.delete(at, at + parent.nodeSize); return true; }).run();
      return placeAfter(at, content);
    }
    return placeAfter($from.after(zone + 1), content);
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
    editor.view.focus(); // tout de suite : la frappe suivante doit arriver dans le bloc inséré
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
    { id: "gcallout-info", title: "Encadré Information", cat: "Mise en forme", icon: "callout", desc: "Mettez une information en évidence.", keywords: "note info", run: () => blk({ type: "callout", attrs: { type: "info" }, content: [p("")] }) },
    { id: "gcallout-conseil", title: "Encadré Conseil", cat: "Mise en forme", icon: "callout", desc: "Un conseil pratique.", keywords: "astuce tip", run: () => blk({ type: "callout", attrs: { type: "conseil" }, content: [p("")] }) },
    { id: "gcallout-attention", title: "Encadré Attention", cat: "Mise en forme", icon: "callout", desc: "Un avertissement.", keywords: "alerte danger", run: () => blk({ type: "callout", attrs: { type: "attention" }, content: [p("")] }) },
    { id: "gcallout-retenir", title: "Encadré À retenir", cat: "Mise en forme", icon: "callout", desc: "L'idée essentielle.", keywords: "résumé essentiel", run: () => blk({ type: "callout", attrs: { type: "a-retenir" }, content: [p("")] }) },
    { id: "gcallout-savoir", title: "Encadré Bon à savoir", cat: "Mise en forme", icon: "callout", desc: "Une information utile.", run: () => blk({ type: "callout", attrs: { type: "bon-a-savoir" }, content: [p("")] }) },
    { id: "buttons", title: "Bouton", cat: "Mise en forme", icon: "button", desc: "Invitez les lecteurs à agir avec un bouton.", run: () => blk({ type: "kbButton", attrs: { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center", newTab: false } }) },
    { id: "pullquote", title: "Citation mise en avant", cat: "Texte", icon: "quote", desc: "Une phrase forte, centrée et en grand.", keywords: "pullquote exergue", run: () => blk({ type: "blockquote", attrs: { pullquote: true }, content: [p("")] }) },
    { id: "heading5", title: "Titre H5", cat: "Texte", icon: "heading", desc: "Petit intertitre.", keywords: "h5", run: () => blk({ type: "heading", attrs: { level: 5 }, content: [] }) },
    { id: "heading6", title: "Titre H6", cat: "Texte", icon: "heading", desc: "Plus petit intertitre.", keywords: "h6", run: () => blk({ type: "heading", attrs: { level: 6 }, content: [] }) },
    { id: "columns2", title: "Colonnes 50 / 50", cat: "Mise en page", icon: "columns", desc: "Deux colonnes égales ; empilées sur mobile. Chaque colonne accepte tous les blocs.", keywords: "colonnes layout grille 2", run: () => blk({ type: "kbColumns", attrs: { layout: "50-50" }, content: [COL(), COL()] }) },
    { id: "columns2b", title: "Colonnes 33 / 67", cat: "Mise en page", icon: "columns", desc: "Une colonne étroite et une large.", keywords: "colonnes layout grille", run: () => blk({ type: "kbColumns", attrs: { layout: "33-67" }, content: [COL(), COL()] }) },
    { id: "columns3", title: "3 colonnes", cat: "Mise en page", icon: "columns", desc: "Trois colonnes égales.", keywords: "colonnes layout grille 3", run: () => blk({ type: "kbColumns", attrs: { layout: "33-33-33" }, content: [COL(), COL(), COL()] }) },
    { id: "columns4", title: "4 colonnes", cat: "Mise en page", icon: "columns", desc: "Quatre colonnes égales.", keywords: "colonnes layout grille 4", run: () => blk({ type: "kbColumns", attrs: { layout: "25-25-25-25" }, content: [COL(), COL(), COL(), COL()] }) },
    { id: "group", title: "Groupe", cat: "Mise en page", icon: "callout", desc: "Regroupez des blocs sur un fond commun (couleur, marges, bordure).", keywords: "section conteneur fond", run: () => blk({ type: "kbGroup", attrs: { bg: "light", pad: "m" }, content: [p("")] }) },
    { id: "spacer", title: "Espaceur", cat: "Mise en page", icon: "separator", desc: "De l'espace vertical (taille réglable, aussi sur mobile).", keywords: "espace vide marge", run: () => blk({ type: "kbSpacer", attrs: { size: "m" } }) },
    { id: "pagebreak", title: "Saut de page", cat: "Mise en page", icon: "separator", desc: "Nouvelle page à l'impression ou en PDF (invisible à l'écran).", keywords: "impression pdf page", run: () => blk({ type: "kbPageBreak" }) },
    { id: "buttonsgroup", title: "Groupe de boutons", cat: "Mise en forme", icon: "button", desc: "Plusieurs boutons côte à côte.", keywords: "boutons", run: () => blk({ type: "kbButtons", attrs: { align: "center" }, content: [{ type: "kbButton", attrs: { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center", newTab: false } }, { type: "kbButton", attrs: { text: "Nous contacter", href: "/contact", variant: "outline", align: "center", newTab: false } }] }) },
    { id: "gcallout-note", title: "Encadré Note", cat: "Mise en forme", icon: "callout", desc: "Une remarque.", keywords: "note remarque", run: () => blk({ type: "callout", attrs: { type: "note" }, content: [p("")] }) },
    { id: "gcallout-important", title: "Encadré Important", cat: "Mise en forme", icon: "callout", desc: "Un point à ne pas manquer.", keywords: "important avertissement", run: () => blk({ type: "callout", attrs: { type: "important" }, content: [p("")] }) },
    { id: "gcallout-astuce", title: "Encadré Astuce", cat: "Mise en forme", icon: "callout", desc: "Une astuce pratique.", keywords: "astuce truc", run: () => blk({ type: "callout", attrs: { type: "astuce" }, content: [p("")] }) },
    { id: "maps", title: "Carte Google Maps", cat: "Intégrations", icon: "embed", desc: "Collez le code « Intégrer une carte » de Google Maps (ou son adresse).", keywords: "carte plan adresse map", run: () => urlPrompt("Carte Google Maps", "Code d'intégration ou adresse (Google Maps → Partager → Intégrer une carte)", "<iframe src=\"https://www.google.com/maps/embed?pb=…", (url) => blk({ type: "kbEmbed", attrs: { url, caption: "" } }), { transform: mapsUrl, check: (v) => GOOGLE_MAP.test(v), error: "Ce n'est pas un code d'intégration Google Maps (Partager → Intégrer une carte → Copier le HTML)." }) },
    { id: "separator", title: "Séparateur", cat: "Mise en forme", icon: "separator", desc: "Créez une coupure entre deux idées.", keywords: "ligne hr", run: () => blk({ type: "horizontalRule" }) },
    { id: "columns", title: "Comparaison", cat: "Mise en forme", icon: "columns", desc: "Deux colonnes : avantages et limites.", keywords: "colonnes pour contre", run: () => blk({ type: "kbCompare", content: [["pro", "Avantages"], ["con", "Limites"]].map(([tone, title]) => ({ type: "kbCompareCol", attrs: { tone }, content: [{ type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: title }] }, { type: "bulletList", content: [{ type: "listItem", content: [p("")] }] }] })) }) },
    { id: "cta", title: "Appel à l'action", cat: "KOLAKISA", brand: true, icon: "cta", desc: "Encadré avec titre, texte et bouton.", keywords: "cta conversion", run: () => blk({ type: "kbCta", content: [{ type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Envie d'aller plus loin ?" }] }, p("Une phrase qui donne envie."), { type: "kbButton", attrs: { text: "Découvrir les formations", href: "/catalogue", variant: "primary", align: "center" } }] }) },
    { id: "faq", title: "FAQ", cat: "KOLAKISA", brand: true, icon: "faq", desc: "Questions et réponses (données structurées FAQPage).", keywords: "questions", run: () => blk(faqNode([{ question: "Question ?", answer: "Réponse." }])) },
    { id: "steps", title: "Étapes", cat: "KOLAKISA", brand: true, icon: "steps", desc: "Guide pas à pas (données structurées HowTo).", keywords: "howto tutoriel", run: () => blk({ type: "kbSteps", attrs: { title: "" }, content: [1, 2, 3].map((n) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: `Étape ${n}`, marks: [{ type: "bold" }] }, { type: "text", text: " : ce qu'il faut faire." }] }] })) }) },
    { id: "course", title: "Formation recommandée", cat: "KOLAKISA", brand: true, icon: "course", desc: "Carte d'une formation du catalogue.", keywords: "cours produit", run: () => { if (!DATA.courses.length) return toast("Aucune formation publiée à recommander.", "error"); return blk({ type: "kbCourse", attrs: { slug: DATA.courses[0].slug } }); } },
    { id: "newsletter", title: "Newsletter", cat: "KOLAKISA", brand: true, icon: "newsletter", desc: "Formulaire d'inscription à la newsletter.", keywords: "inscription email", run: () => blk({ type: "kbNewsletter" }) },
    { id: "embed", title: "Contenu embarqué", cat: "Intégrations", icon: "embed", desc: "Intégrez un contenu externe (YouTube et Vimeo deviennent un lecteur, le reste un lien).", keywords: "embed intégration", run: () => urlPrompt("Contenu embarqué", "Adresse du contenu", "https://…", (url) => blk({ type: "kbEmbed", attrs: { url, caption: "" } })) },
    { id: "youtube", title: "YouTube", cat: "Intégrations", icon: "video", desc: "Intégrez une vidéo YouTube.", run: () => urlPrompt("YouTube", "Adresse de la vidéo YouTube", "https://www.youtube.com/watch?v=…", (url) => blk({ type: "kbVideo", attrs: { url, caption: "" } })) },
    { id: "vimeo", title: "Vimeo", cat: "Intégrations", icon: "video", desc: "Intégrez une vidéo Vimeo.", run: () => urlPrompt("Vimeo", "Adresse de la vidéo Vimeo", "https://vimeo.com/…", (url) => blk({ type: "kbVideo", attrs: { url, caption: "" } })) },
  ];
  const CATS = ["Texte", "KOLAKISA", "Média", "Mise en forme", "Mise en page", "Intégrations"];
  // ---------- Préférences personnelles : favoris, récents, réglages (enregistrées sur le compte) ----------
  let editorPrefs = DATA.editorPrefs || { favorites: [], recents: [], settings: {} };
  const persistPrefs = debounce(() => { api("/formateur/blog/api/preferences", { method: "PUT", json: { favorites: editorPrefs.favorites, recents: editorPrefs.recents, settings: editorPrefs.settings } }).then((r) => { editorPrefs = r.prefs; }).catch(() => toast("Préférences de l'éditeur non enregistrées (connexion ?).", "error")); }, 600);
  const useBlock = (id) => { editorPrefs.recents = [id, ...editorPrefs.recents.filter((x) => x !== id)].slice(0, 8); persistPrefs(); };
  const toggleFavorite = (id) => { editorPrefs.favorites = editorPrefs.favorites.includes(id) ? editorPrefs.favorites.filter((x) => x !== id) : [...editorPrefs.favorites, id]; persistPrefs(); };
  // ---------- Blocs réutilisables ----------
  let reusableList = [];
  const loadReusable = () => api("/formateur/blog/api/blocs").then((r) => { reusableList = r.blocks; return reusableList; }).catch(() => reusableList);
  const insertReusable = (b) => (b.synced ? blk({ type: "kbReusable", attrs: { ref: String(b.id), name: b.name } }) : editor.chain().focus().insertContent(b.content).run());
  const blockButton = (b, after, { star = false, onStar } = {}) => {
    const btn = h("button", { type: "button", class: b.brand ? "wp-block-type is-brand" : "wp-block-type", onclick: () => { after?.(); useBlock(b.id); b.run(); } }, h("span", { class: "wp-block-type-icon" }, svg(b.icon)), h("span", { class: "wp-block-type-title" }, b.title));
    if (!star) return btn;
    const fav = editorPrefs.favorites.includes(b.id);
    return h("div", { class: "wp-block-type-wrap" }, btn, h("button", { type: "button", class: `wp-fav${fav ? " is-on" : ""}`, "aria-pressed": String(fav), "aria-label": fav ? `Retirer « ${b.title} » des favoris` : `Ajouter « ${b.title} » aux favoris`, title: fav ? "Retirer des favoris" : "Ajouter aux favoris", onclick: (e) => { e.stopPropagation(); toggleFavorite(b.id); onStar?.(); } }, fav ? "★" : "☆"));
  };
  const matches = (b, q) => !q || norm(`${b.title} ${b.cat} ${b.keywords || ""} ${b.desc}`).includes(norm(q));
  function urlPrompt(title, label, placeholder, done, { kind, transform, check, error } = {}) {
    const url = input({ type: transform ? "text" : "url", placeholder });
    const body = h("div", {}, control(label, url));
    if (kind === "video") body.append(h("button", { type: "button", class: "wp-btn-secondary", onclick: () => { m.close(); openMediaModal({ kind: "video", onSelect: (media) => done(media.path) }); } }, "Ou téléverser un fichier vidéo…"));
    const m = modal(title, body, [{ label: "Intégrer", primary: true, run: () => { const v = transform ? transform(url.value) : url.value.trim(); if (!/^https:\/\/\S+$/.test(v) || (check && !check(v))) { toast(error || "L'adresse doit commencer par https://", "error"); return true; } done(v); } }]);
    url.focus();
  }

  // ---------- Panneau gauche : outil d'insertion, structure, médias, IA (rail d'outils) ----------
  const secondary = $("[data-secondary]");
  const secondaryDynamic = $("[data-secondary-dynamic]");
  const inserterToggle = $("[data-toggle-inserter]");
  const SECONDARY_TITLES = { inserter: "Ajouter un bloc", list: "Structure de l'article", media: "Médias de l'article", ai: "Assistant IA" };
  let secondaryMode = null;
  function setSecondary(mode) {
    secondaryMode = secondaryMode === mode ? null : mode;
    inserterToggle.setAttribute("aria-pressed", String(secondaryMode === "inserter"));
    inserterToggle.classList.toggle("is-pressed", secondaryMode === "inserter");
    $$("[data-rail]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.rail === secondaryMode)));
    secondary.hidden = !secondaryMode;
    root.classList.toggle("has-secondary", Boolean(secondaryMode));
    $("[data-secondary-title]").textContent = SECONDARY_TITLES[secondaryMode] || "";
    $$("[data-secondary-view]").forEach((v) => { v.hidden = v.dataset.secondaryView !== secondaryMode; });
    secondaryDynamic.hidden = !["inserter", "list"].includes(secondaryMode);
    secondaryDynamic.replaceChildren();
    if (secondaryMode === "inserter") renderInserter();
    if (secondaryMode === "list") renderListView();
    if (secondaryMode === "media") refreshMedia();
  }
  inserterToggle.addEventListener("click", () => setSecondary("inserter"));
  $("[data-secondary-close]").addEventListener("click", () => setSecondary(secondaryMode));
  $$("[data-rail]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.rail === "seo") { revealSeo(); return; }
    setSecondary(b.dataset.rail);
  }));
  function renderInserter() {
    const search = input({ type: "search", placeholder: "Rechercher", "aria-label": "Rechercher un bloc", class: "wp-search" });
    const grid = h("div", { class: "wp-inserter-blocks" });
    const media = h("div", { class: "wp-inserter-media", hidden: true });
    const hidden = new Set((editorPrefs.settings && editorPrefs.settings.hiddenBlocks) || []);
    const visible = BLOCKS.filter((b) => !hidden.has(b.id));
    const byId = (id) => visible.find((b) => b.id === id);
    const section = (title, items) => { if (items.length) grid.append(h("h2", { class: "wp-inserter-cat" }, title), h("div", { class: "wp-block-types" }, ...items.map((b) => blockButton(b, null, { star: true, onStar: render })))); };
    function render() {
      grid.replaceChildren();
      const q = search.value;
      if (!q) {
        section("★ Favoris", editorPrefs.favorites.map(byId).filter(Boolean));
        section("Récents", editorPrefs.recents.map(byId).filter(Boolean).slice(0, 6));
      }
      for (const cat of CATS) section(cat, visible.filter((b) => b.cat === cat && matches(b, q)));
      const reus = reusableList.filter((b) => !q || norm(`${b.name} ${b.category}`).includes(norm(q)));
      grid.append(h("h2", { class: "wp-inserter-cat" }, "Réutilisables"));
      if (reus.length) grid.append(h("div", { class: "wp-reusable-list" }, ...reus.map((b) => h("button", { type: "button", class: "wp-reusable-item", onclick: () => { insertReusable(b); } }, h("strong", {}, b.name), h("small", {}, `${b.synced ? "↻ Synchronisé" : "Copie"}${b.category ? ` · ${b.category}` : ""}${b.synced && b.uses ? ` · ${b.uses} article(s)` : ""}`)))));
      else grid.append(h("p", { class: "wp-help" }, q ? "Aucun bloc réutilisable ne correspond." : "Aucun bloc réutilisable : clic droit sur un bloc → « Enregistrer comme bloc réutilisable »."));
      grid.append(h("button", { type: "button", class: "wp-btn-link", onclick: manageReusable }, "Gérer les blocs réutilisables…"));
      if (!grid.querySelector(".wp-block-type, .wp-reusable-item") && q) grid.prepend(h("p", { class: "wp-help" }, "Aucun résultat."));
    }
    loadReusable().then(() => { if (secondaryMode === "inserter") render(); });
    const tabs = segmentedTabs([["blocs", "Blocs"], ["medias", "Médias"]], (k) => { grid.hidden = k !== "blocs"; media.hidden = k !== "medias"; if (k === "medias") loadMediaTab(media); });
    search.addEventListener("input", render);
    secondaryDynamic.replaceChildren(tabs, h("div", { class: "wp-secondary-body" }, search, grid, media));
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
  const LABEL = { paragraph: "Paragraphe", heading: "Titre", bulletList: "Liste", orderedList: "Liste numérotée", listItem: "Élément de liste", taskList: "Liste de contrôle", taskItem: "Élément", blockquote: "Citation", codeBlock: "Code", horizontalRule: "Séparateur", table: "Tableau", tableRow: "Ligne", tableCell: "Cellule", tableHeader: "En-tête", kbImage: "Image", kbGallery: "Galerie", kbVideo: "Vidéo", kbAudio: "Audio", kbEmbed: "Contenu embarqué", kbCourse: "Formation recommandée", kbNewsletter: "Newsletter", kbButton: "Bouton", callout: "Encadré", kbCta: "Appel à l'action", kbAccordion: "Détails", kbSummary: "Résumé", kbAccordionBody: "Contenu", kbFaq: "FAQ", kbFaqItem: "Question", kbFaqAnswer: "Réponse", kbSteps: "Étapes", kbCompare: "Comparaison", kbCompareCol: "Colonne", kbSpacer: "Espaceur", kbPageBreak: "Saut de page", kbColumns: "Colonnes", kbColumn: "Colonne", kbGroup: "Groupe", kbButtons: "Groupe de boutons", kbReusable: "Bloc synchronisé", kbReusableEdit: "Bloc synchronisé (modification)" };
  const ICON_OF = { paragraph: "paragraph", heading: "heading", bulletList: "list", orderedList: "ordered", taskList: "checklist", blockquote: "quote", codeBlock: "code", horizontalRule: "separator", table: "table", kbImage: "image", kbGallery: "gallery", kbVideo: "video", kbAudio: "audio", kbEmbed: "embed", kbCourse: "course", kbNewsletter: "newsletter", kbButton: "button", callout: "callout", kbCta: "cta", kbAccordion: "details", kbFaq: "faq", kbSteps: "steps", kbCompare: "columns", kbSpacer: "separator", kbPageBreak: "separator", kbColumns: "columns", kbGroup: "callout", kbButtons: "button" };
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
    secondaryDynamic.replaceChildren(tabs, h("div", { class: "wp-secondary-body" }, stats, list, outline));
  }
  function selectBlockAt(pos) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return;
    if (node.isAtom || !node.isTextblock) editor.chain().focus().setNodeSelection(pos).scrollIntoView().run();
    else editor.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  }

  // ---------- Bloc courant ----------
  // Bloc ciblé par la barre d'outils et la barre latérale : bloc entier sélectionné, sinon le plus petit bloc « réglable »
  // Conteneurs de mise en page : on règle leur contenu bloc par bloc ; eux-mêmes se sélectionnent par « Sélectionner le conteneur »
  const LAYOUT_TYPES = new Set(["kbColumns", "kbColumn", "kbGroup", "kbButtons"]);
  // Bloc synchronisé en cours de modification qui contient le curseur (actions dans l'onglet Bloc)
  const editingReusableAt = () => { const $p = editor.state.selection.$from; for (let d = $p.depth; d >= 1; d--) if ($p.node(d).type.name === "kbReusableEdit") return { pos: $p.before(d), node: $p.node(d) }; return null; };
  const SETTINGS_TYPES = new Set(["kbReusable", "kbSpacer", "kbPageBreak", "kbColumns", "kbGroup", "kbButtons", "kbImage", "kbGallery", "kbVideo", "kbAudio", "kbEmbed", "kbCourse", "kbNewsletter", "kbButton", "callout", "kbSteps", "kbCompare", "table", "kbCta", "kbFaq", "kbAccordion", "bulletList", "orderedList", "taskList", "blockquote"]);
  function currentBlock() {
    const sel = editor.state.selection;
    // « top » : le bloc à déplacer / dupliquer / supprimer — au premier niveau, ou dans une colonne / un groupe
    if (sel instanceof NodeSelection) return { node: sel.node, pos: sel.from, top: sel.$from.depth === 0 || ZONES.has(sel.$from.parent.type.name) ? sel.from : zoneBlockPos(editor.state.doc, sel.from) };
    const $from = sel.$from;
    if ($from.depth === 0) return null;
    const top = zoneBlockPos(editor.state.doc, $from.pos);
    // Bloc de texte (paragraphe, titre, code) sauf s'il est dans une liste ou un bloc spécial réglable (hors conteneurs de mise en page)
    for (let d = 1; d <= $from.depth; d++) {
      const node = $from.node(d);
      if (SETTINGS_TYPES.has(node.type.name) && !LAYOUT_TYPES.has(node.type.name) && $from.before(d) >= top) return { node, pos: $from.before(d), top, text: $from.parent.isTextblock ? { node: $from.parent, pos: $from.before($from.depth) } : null };
    }
    return { node: $from.parent, pos: $from.before($from.depth), top, text: { node: $from.parent, pos: $from.before($from.depth) } };
  }
  // Modifie les réglages d'un bloc SANS donner le focus à l'éditeur : sinon, pendant la saisie du texte alternatif,
  // la lettre suivante arrivait dans l'article et remplaçait l'image sélectionnée
  const setAttrsAt = (pos, attrs) => {
    const node = editor.state.doc.nodeAt(pos);
    if (!node) return false;
    const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
    if (editor.state.selection instanceof NodeSelection && editor.state.selection.from === pos) tr.setSelection(NodeSelection.create(tr.doc, pos));
    editor.view.dispatch(tr);
    return true;
  };
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
      ...[1, 2, 3, 4, 5, 6].map((l) => ({ label: `Titre ${l}${l === 2 ? " (section)" : ""}`, icon: "heading", run: () => chain().setHeading({ level: l }).run() })),
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
  // Menu d'un bloc (bouton ⋮ de la barre du bloc, ou clic droit) : seulement les actions possibles pour ce bloc
  let blockClipboard = null;
  const TEXT_TYPES = ["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock"];
  function blockMenuItems(top) {
    const node = editor.state.doc.nodeAt(top);
    if (!node) return [];
    const locked = isLocked(node);
    const copy = async () => {
      blockClipboard = { ...node.toJSON(), attrs: { ...node.attrs, locked: false } };
      const html = blockHtml(editor, top);
      try {
        if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([node.textContent], { type: "text/plain" }) })]);
        else if (navigator.clipboard) await navigator.clipboard.writeText(node.textContent);
      } catch { /* presse-papiers du système refusé : la copie interne suffit pour « Coller » */ }
    };
    const items = [
      { label: "Copier le bloc", run: async () => { await copy(); toast("Bloc copié."); } },
      ...(locked ? [] : [{ label: "Couper le bloc", run: async () => { await copy(); deleteBlock(top); toast("Bloc coupé : « Coller après » pour le replacer."); } }]),
      ...(blockClipboard ? [{ label: "Coller après", run: () => { const at = top + node.nodeSize; editor.chain().focus().insertContentAt(at, blockClipboard).run(); } }] : []),
      { label: "Dupliquer", shortcut: "Ctrl+Maj+D", run: () => duplicateBlock(top) },
      { label: "Insérer un paragraphe avant", run: () => { editor.chain().focus().insertContentAt(top, p("")).setTextSelection(top + 1).run(); } },
      { label: "Insérer un paragraphe après", run: () => { const at = top + node.nodeSize; editor.chain().focus().insertContentAt(at, p("")).setTextSelection(at + 1).run(); } },
      ...(editor.state.doc.resolve(top).nodeBefore ? [{ label: "Déplacer vers le haut", icon: "up", shortcut: "Alt+↑", run: () => { editor.commands.setNodeSelection(top); moveBlock(editor.state, editor.view.dispatch, -1); } }] : []),
      ...(editor.state.doc.resolve(top + node.nodeSize).nodeAfter ? [{ label: "Déplacer vers le bas", icon: "down", shortcut: "Alt+↓", run: () => { editor.commands.setNodeSelection(top); moveBlock(editor.state, editor.view.dispatch, 1); } }] : []),
      ...(!locked && TEXT_TYPES.includes(node.type.name) ? [{ label: "Transformer en…", run: () => { editor.chain().focus().setTextSelection(top + 1).run(); transformMenu(lastMenuAnchor || document.querySelector("[data-block-toolbar]")); } }] : []),
      ...(LOCKABLE_TYPES.includes(node.type.name) && editor.state.doc.resolve(top).depth === 0 ? [{ label: locked ? "🔓 Déverrouiller" : "🔒 Verrouiller (empêche toute modification)", run: () => { setLocked(editor, top, !locked); toast(locked ? "Bloc déverrouillé." : "Bloc verrouillé : il ne peut plus être modifié ni supprimé par erreur."); } }] : []),
      ...(blockMenuExtra ? blockMenuExtra(top, node) : []),
      ...(locked ? [] : ["-", { label: "Supprimer", danger: true, shortcut: "Maj+Alt+Z", run: () => deleteBlock(top) }]),
    ];
    return items;
  }
  // Actions des blocs réutilisables dans le menu du bloc
  const blockMenuExtra = (top, node) => {
    if (node.type.name === "kbReusable") return [{ label: "✎ Modifier l'original (tous les articles)", run: () => editReusable(top) }, { label: "Convertir en blocs normaux", run: () => detachReusable(top) }];
    if (node.type.name === "kbReusableEdit") return [{ label: "✓ Enregistrer le bloc (tous les articles)", run: () => commitReusable(top) }, { label: "Annuler les modifications du bloc", run: () => commitReusable(top, { cancel: true }) }];
    return [{ label: "Enregistrer comme bloc réutilisable…", run: () => saveAsReusable(top) }];
  };
  let lastMenuAnchor = null;
  function blockOptions(anchor, b) {
    lastMenuAnchor = anchor;
    popover(anchor, menuList(blockMenuItems(b.top)));
  }
  // Clic droit sur un bloc : même menu, à l'endroit du pointeur (Maj + clic droit : menu du navigateur)
  function contextMenuAt(event) {
    if (event.shiftKey || root.classList.contains("is-code-mode")) return;
    const found = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
    if (!found) return;
    const top = zoneBlockPos(editor.state.doc, found.inside >= 0 ? found.inside : found.pos);
    if (top === null || !editor.state.doc.nodeAt(top)) return;
    event.preventDefault();
    const anchor = h("span", { class: "wp-context-anchor", style: `position:fixed;left:${event.clientX}px;top:${event.clientY - 6}px;width:1px;height:1px;` });
    document.body.append(anchor);
    lastMenuAnchor = anchor;
    const pop = popover(anchor, h("div", {}, h("p", { class: "wp-menu-label" }, nameOf(editor.state.doc.nodeAt(top))), menuList(blockMenuItems(top))), { className: "is-context" });
    const done = () => setTimeout(() => anchor.remove(), 300);
    pop.addEventListener("click", done);
    setTimeout(done, 60000);
    pop.querySelector("button")?.focus();
  }
  // ---------- Blocs réutilisables : enregistrer, modifier l'original, convertir, gérer ----------
  function saveAsReusable(top) {
    const node = editor.state.doc.nodeAt(top);
    if (!node) return;
    const name = input({ maxlength: 80, placeholder: "Ex. Encadré d'inscription" });
    const cat = input({ maxlength: 40, placeholder: "Ex. Appels à l'action" });
    const synced = h("input", { type: "checkbox", id: "wp-reusable-synced", checked: true });
    const err = h("p", { class: "wp-error", hidden: true });
    modal("Enregistrer comme bloc réutilisable", h("div", {}, control("Nom", name), control("Catégorie (facultatif)", cat),
      h("label", { class: "wp-checkbox", for: "wp-reusable-synced" }, synced, " Synchronisé : une modification du bloc s'appliquera à tous les articles qui l'utilisent"),
      h("p", { class: "wp-help" }, "Non synchronisé : chaque insertion est une copie indépendante."), err), [
      { label: "Annuler" },
      { label: "Enregistrer", primary: true, run: async () => {
        try {
          const json = node.toJSON();
          if (json.attrs && json.attrs.locked) json.attrs = { ...json.attrs, locked: false };
          const html = blockHtml(editor, top).replace(/ data-locked="true"/g, "");
          const { block } = await api("/formateur/blog/api/blocs", { method: "POST", json: { name: name.value, category: cat.value, html, synced: synced.checked } });
          reusableList = [...reusableList, block];
          if (block.synced) {
            const cur = editor.state.doc.nodeAt(top);
            if (cur) editor.view.dispatch(editor.state.tr.replaceWith(top, top + cur.nodeSize, editor.schema.nodes.kbReusable.create({ ref: String(block.id), name: block.name })));
          }
          toast(block.synced ? `Bloc synchronisé « ${block.name} » créé : il est maintenant relié à l'original.` : `Bloc « ${block.name} » enregistré dans les réutilisables.`);
          return false;
        } catch (e) { err.textContent = e.message; err.hidden = false; return true; }
      } },
    ]);
    setTimeout(() => name.focus(), 30);
  }
  async function editReusable(pos) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "kbReusable") return;
    forgetReusable(node.attrs.ref);
    const b = await reusableContent(node.attrs.ref);
    if (!b) { toast("Bloc synchronisé introuvable.", "error"); return; }
    const container = document.createElement("div");
    container.innerHTML = b.content;
    const doc = PMDOMParser.fromSchema(editor.schema).parse(container);
    const edit = editor.schema.nodes.kbReusableEdit.create({ ref: node.attrs.ref, name: b.name }, doc.content);
    const cur = editor.state.doc.nodeAt(pos);
    editor.view.dispatch(editor.state.tr.replaceWith(pos, pos + cur.nodeSize, edit));
    toast(`Vous modifiez l'original de « ${b.name} » : « Enregistrer le bloc » (onglet Bloc) l'appliquera partout.`);
  }
  async function commitReusable(pos, { cancel = false } = {}) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "kbReusableEdit") return true;
    if (!cancel) {
      try {
        await api(`/formateur/blog/api/blocs/${node.attrs.ref}`, { method: "POST", json: { html: contentHtml(editor, node) } });
      } catch (e) { toast(`Bloc non enregistré : ${e.message}`, "error"); return false; }
    }
    forgetReusable(node.attrs.ref);
    let at = pos;
    if (editor.state.doc.nodeAt(at) !== node) editor.state.doc.descendants((n, p2) => { if (n === node) { at = p2; return false; } return true; });
    editor.view.dispatch(editor.state.tr.replaceWith(at, at + node.nodeSize, editor.schema.nodes.kbReusable.create({ ref: node.attrs.ref, name: node.attrs.name })));
    if (!cancel) toast(`Bloc « ${node.attrs.name} » enregistré : modifié dans tous les articles qui l'utilisent.`);
    loadReusable();
    return true;
  }
  // Avant d'enregistrer l'article : les blocs synchronisés en cours de modification sont enregistrés d'abord
  async function commitAllReusableEdits() {
    const edits = [];
    editor.state.doc.descendants((n, p2) => { if (n.type.name === "kbReusableEdit") edits.push(p2); return n.type.name !== "kbReusableEdit"; });
    for (const p2 of edits.reverse()) if (!(await commitReusable(p2))) return false;
    return true;
  }
  async function detachReusable(pos) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "kbReusable") return;
    const b = await reusableContent(node.attrs.ref);
    if (!b) { toast("Bloc synchronisé introuvable.", "error"); return; }
    const cur = editor.state.doc.nodeAt(pos);
    editor.chain().focus().command(({ tr }) => { tr.delete(pos, pos + cur.nodeSize); return true; }).insertContentAt(pos, b.content).run();
    toast("Converti en blocs normaux : ce contenu n'est plus relié à l'original.");
  }
  function manageReusable() {
    const listEl = h("ul", { class: "wp-reusable-manage" });
    const draw = () => listEl.replaceChildren(...(reusableList.length ? reusableList.map((b) => {
      const nm = input({ value: b.name, maxlength: 80, "aria-label": "Nom" });
      const ct = input({ value: b.category, maxlength: 40, placeholder: "Catégorie", "aria-label": "Catégorie" });
      return h("li", {}, h("div", { class: "wp-reusable-manage-fields" }, nm, ct, h("small", {}, `${b.synced ? `↻ Synchronisé · ${b.uses || 0} article(s)` : "Copie"} · modifié le ${fmtDate(b.updatedAt)}`)),
        h("div", { class: "wp-button-row" },
          h("button", { type: "button", class: "wp-btn-secondary", onclick: async () => { try { await api(`/formateur/blog/api/blocs/${b.id}`, { method: "POST", json: { name: nm.value, category: ct.value } }); await loadReusable(); toast("Bloc renommé."); draw(); } catch (e) { toast(e.message, "error"); } } }, "Enregistrer"),
          h("button", { type: "button", class: "wp-btn-link is-danger", onclick: async () => { if (!confirm(`Supprimer le bloc « ${b.name} » ?`)) return; try { await api(`/formateur/blog/api/blocs/${b.id}/supprimer`, { method: "POST" }); await loadReusable(); toast("Bloc supprimé."); draw(); } catch (e) { toast(e.message, "error"); } } }, "Supprimer")));
    }) : [h("li", { class: "wp-help" }, "Aucun bloc réutilisable.")]));
    loadReusable().then(draw);
    draw();
    modal("Blocs réutilisables", h("div", {}, h("p", { class: "wp-help" }, "Pour modifier le contenu d'un bloc synchronisé : insérez-le, puis « Modifier l'original » (onglet Bloc)."), listEl), [{ label: "Fermer" }]);
  }

  // Recadrage d'une image : zone choisie à la souris (libre ou proportions fixes), nouvelle image créée dans la
  // médiathèque (l'originale est conservée), versions réduites générées comme pour tout envoi
  function cropImage(pos) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "kbImage") return;
    const src = node.attrs.src;
    const img = h("img", { src, alt: "", class: "wp-crop-img", draggable: "false" });
    const handle = h("span", { class: "wp-crop-handle", "aria-hidden": "true" });
    const frame = h("div", { class: "wp-crop-box", role: "slider", tabindex: "0", "aria-label": "Zone conservée (flèches : déplacer, Maj + flèches : redimensionner)" }, handle);
    const stage = h("div", { class: "wp-crop-stage" }, img, frame);
    const size = h("p", { class: "wp-help" });
    let ratio = 0;
    let r = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
    const clampR = () => { r.w = Math.min(1, Math.max(0.05, r.w)); r.h = Math.min(1, Math.max(0.05, r.h)); r.x = Math.min(1 - r.w, Math.max(0, r.x)); r.y = Math.min(1 - r.h, Math.max(0, r.y)); };
    const paint = () => { clampR(); Object.assign(frame.style, { left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }); if (img.naturalWidth) size.textContent = `Zone conservée : ${Math.round(r.w * img.naturalWidth)} × ${Math.round(r.h * img.naturalHeight)} px`; };
    const fitRatio = () => { if (!ratio || !img.naturalWidth) return paint(); const W = img.naturalWidth; const H = img.naturalHeight; let hh = (r.w * W) / ratio / H; if (hh > 1) { hh = 1; r.w = (hh * H * ratio) / W; } r.h = hh; paint(); };
    const drag = (e, mode) => {
      e.preventDefault(); e.stopPropagation();
      const box = img.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY, r: { ...r } };
      const move = (ev) => {
        const dx = (ev.clientX - start.x) / box.width; const dy = (ev.clientY - start.y) / box.height;
        if (mode === "move") { r.x = start.r.x + dx; r.y = start.r.y + dy; }
        else { r.w = start.r.w + dx; r.h = ratio ? r.h : start.r.h + dy; if (ratio) fitRatio(); }
        paint();
      };
      const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    };
    frame.addEventListener("pointerdown", (e) => drag(e, "move"));
    handle.addEventListener("pointerdown", (e) => drag(e, "resize"));
    frame.addEventListener("keydown", (e) => {
      const step = 0.01; const k = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!k) return;
      e.preventDefault();
      if (e.shiftKey) { r.w += k[0]; r.h += ratio ? 0 : k[1]; if (ratio) fitRatio(); } else { r.x += k[0]; r.y += k[1]; }
      paint();
    });
    img.addEventListener("load", () => fitRatio());
    const ratios = segmented([["0", "Libre"], ["1.7778", "16:9"], ["1.3333", "4:3"], ["1.5", "3:2"], ["1", "1:1"], ["0.75", "3:4"]], "0", (v) => { ratio = Number(v); fitRatio(); });
    modal("Recadrer l'image", h("div", { class: "wp-crop" }, ratios, stage, size, h("p", { class: "wp-help" }, "Une nouvelle image est créée ; l'originale reste dans la médiathèque.")), [
      { label: "Annuler" },
      { label: "Appliquer le recadrage", primary: true, run: async () => {
        if (!img.naturalWidth) { toast("Image non chargée : impossible de la recadrer.", "error"); return true; }
        const W = img.naturalWidth; const H = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(r.w * W)); canvas.height = Math.max(1, Math.round(r.h * H));
        canvas.getContext("2d").drawImage(img, Math.round(r.x * W), Math.round(r.y * H), canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        const type = /\.png$/i.test(src) ? "image/png" : /\.webp$/i.test(src) ? "image/webp" : "image/jpeg";
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.9));
        if (!blob) { toast("Recadrage impossible dans ce navigateur.", "error"); return true; }
        try {
          const media = await uploadMedia(new File([blob], `recadrage.${type.split("/")[1].replace("jpeg", "jpg")}`, { type }), "image");
          // Le bloc a pu bouger pendant l'envoi : on le retrouve par son image
          let at = pos;
          if (!editor.state.doc.nodeAt(at) || editor.state.doc.nodeAt(at).attrs.src !== src) editor.state.doc.descendants((n, p2) => { if (n.type.name === "kbImage" && n.attrs.src === src) { at = p2; return false; } return true; });
          setAttrsAt(at, { src: media.path, mediaId: media.id });
          toast("Image recadrée : nouvelle image créée, l'originale reste dans la médiathèque.");
        } catch (e) { toast(`Recadrage impossible : ${e.message}`, "error"); return true; }
        return false;
      } },
    ], { wide: false });
    paint();
  }
  function setColumnsLayout(pos, layout) {
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.type.name !== "kbColumns") return;
    const want = layout.split("-").length;
    const cols = [];
    node.forEach((c) => cols.push(c.toJSON()));
    if (cols.length > want) {
      // Les colonnes retirées versent leur contenu dans la dernière colonne conservée
      const kept = cols.slice(0, want);
      for (const extra of cols.slice(want)) kept[want - 1].content.push(...(extra.content || []));
      cols.splice(0, cols.length, ...kept);
    }
    while (cols.length < want) cols.push(COL());
    const json = { ...node.toJSON(), attrs: { ...node.attrs, layout }, content: cols };
    const tr = editor.state.tr.replaceWith(pos, pos + node.nodeSize, editor.schema.nodeFromJSON(json));
    tr.setSelection(NodeSelection.create(tr.doc, pos));
    editor.view.dispatch(tr);
  }
  function duplicateBlock(top) {
    const node = editor.state.doc.nodeAt(top);
    if (!node) return;
    const json = node.toJSON();
    if (json.attrs && json.attrs.locked) json.attrs = { ...json.attrs, locked: false };
    editor.chain().focus().insertContentAt(top + node.nodeSize, json).run();
  }
  function deleteBlock(top) {
    const node = editor.state.doc.nodeAt(top);
    if (!node) return;
    editor.chain().focus().command(({ tr }) => { tr.delete(top, top + node.nodeSize); return true; }).run();
    if (!editor.state.doc.childCount) editor.commands.setContent("<p></p>");
  }
  let toolbarKey = "";
  // Pendant un glisser de bloc, la barre ne doit pas être reconstruite : le bouton « Glisser » en cours de
  // déplacement serait retiré de la page et le navigateur annulerait le glisser.
  let blockDragging = false;
  function renderBlockToolbar() {
    if (blockDragging) return;
    const b = currentBlock();
    const target = topToolbarMode ? topToolbar : blockToolbar;
    (topToolbarMode ? blockToolbar : topToolbar).hidden = true;
    const visible = b && (editor.isFocused || editor.state.selection instanceof NodeSelection || target.contains(document.activeElement)) && !root.classList.contains("is-typing") && !root.classList.contains("is-code-mode");
    if (!visible) { if (!topToolbarMode) { target.hidden = true; return; } if (!b) { target.replaceChildren(); toolbarKey = ""; return; } }
    const key = [topToolbarMode, b.pos, b.top, b.node.type.name, b.text ? b.text.node.type.name : "", b.text ? b.text.node.attrs.level : "", editor.isActive({ textAlign: "center" }), editor.isActive({ textAlign: "right" }), editor.isActive("bold"), editor.isActive("italic"), editor.isActive("link")].join("|");
    if (key === toolbarKey && target.childElementCount) { target.hidden = false; positionToolbar(b); return; }
    toolbarKey = key;
    target.replaceChildren();
    const type = b.node.type.name;
    const textType = b.text ? b.text.node.type.name : null;
    const typeBtn = tbtn(`${nameOf(b.node)} : changer de type`, ICON_OF[type] || "paragraph", (e) => (b.text && !b.node.isAtom ? transformMenu(e.currentTarget) : null));
    // Poignée : pas de preventDefault au mousedown (il empêcherait le navigateur de démarrer le glisser)
    const grip = h("button", { type: "button", class: "wp-tb-btn wp-tb-grip", "aria-label": "Glisser pour déplacer le bloc (au clavier : flèches de la barre)", title: "Glisser pour déplacer le bloc" }, svg("drag"));
    grip.draggable = true;
    const endDrag = () => { if (!blockDragging) return; blockDragging = false; toolbarKey = ""; renderBlockToolbar(); };
    grip.addEventListener("mousedown", () => { blockDragging = true; });
    grip.addEventListener("mouseup", endDrag);
    grip.addEventListener("dragstart", (e) => { blockDragging = true; startBlockDrag(editor.view, b.top, e); });
    grip.addEventListener("dragend", () => { editor.view.dragging = null; endBlockDrag(); endDrag(); });
    const movers = h("div", { class: "wp-tb-movers" }, tbtn("Déplacer vers le haut", "up", () => { editor.commands.setNodeSelection(b.top); moveBlock(editor.state, editor.view.dispatch, -1); }), tbtn("Déplacer vers le bas", "down", () => { editor.commands.setNodeSelection(b.top); moveBlock(editor.state, editor.view.dispatch, 1); }));
    const groups = [tgroup(typeBtn, grip, movers)];
    const parentBox = (() => { const $p = editor.state.doc.resolve(b.pos); for (let d = $p.depth; d >= 1; d--) { const n = $p.node(d); if (["kbColumns", "kbGroup", "kbButtons"].includes(n.type.name)) return { pos: $p.before(d), node: n }; } return null; })();
    if (parentBox && parentBox.pos !== b.pos) groups.unshift(tgroup(tbtn(`Sélectionner le conteneur (${nameOf(parentBox.node)})`, "up", () => { editor.commands.setNodeSelection(parentBox.pos); showSidebarTab("bloc"); })));
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
    positionToolbar(b);
  }
  // Position : juste au-dessus du bloc, aligné à gauche
  function positionToolbar(b) {
    if (topToolbarMode) return;
    const dom = editor.view.nodeDOM(b.text && !SETTINGS_TYPES.has(b.node.type.name) ? b.text.pos : b.pos);
    const el = dom instanceof HTMLElement ? dom : dom && dom.parentElement;
    if (!el) { blockToolbar.hidden = true; return; }
    const hostBox = $(".wp-content").getBoundingClientRect();
    const box = el.getBoundingClientRect();
    const top = `${Math.max(0, Math.round(box.top - hostBox.top - blockToolbar.offsetHeight - 10))}px`;
    const left = `${Math.max(0, Math.round(box.left - hostBox.left))}px`;
    if (blockToolbar.style.top !== top) blockToolbar.style.top = top;
    if (blockToolbar.style.left !== left) blockToolbar.style.left = left;
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
  // « + » entre deux blocs (comme Gutenberg) : il apparaît au survol de la jonction entre deux blocs
  const contentHost = $(".wp-content");
  const between = h("div", { class: "wp-between", hidden: true }, h("span", { class: "wp-between-line", "aria-hidden": "true" }), h("button", { type: "button", class: "wp-between-btn", "aria-label": "Insérer un bloc ici", title: "Insérer un bloc ici" }, svg("plus")));
  contentHost.append(between);
  const betweenBtn = between.querySelector("button");
  let betweenPos = null;
  contentHost.addEventListener("mousemove", (e) => {
    if (between.contains(e.target)) return;
    if (root.classList.contains("is-code-mode") || !editor.isEditable) { between.hidden = true; return; }
    const hostBox = contentHost.getBoundingClientRect();
    const domBox = editor.view.dom.getBoundingClientRect();
    const doc = editor.state.doc;
    let found = null;
    if (e.clientX >= domBox.left - 48 && e.clientX <= domBox.right + 48) {
      let offset = 0;
      for (let i = 0; i < doc.childCount - 1 && !found; i++) {
        const size = doc.child(i).nodeSize;
        const a = editor.view.nodeDOM(offset);
        const b = editor.view.nodeDOM(offset + size);
        if (a instanceof HTMLElement && b instanceof HTMLElement) {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const y = (ra.bottom + rb.top) / 2;
          if (Math.abs(e.clientY - y) <= Math.max(7, (rb.top - ra.bottom) / 2)) found = { pos: offset + size, y };
        }
        offset += size;
      }
    }
    if (!found) { between.hidden = true; return; }
    betweenPos = found.pos;
    between.style.top = `${found.y - hostBox.top}px`;
    between.style.left = `${domBox.left - hostBox.left}px`;
    between.style.width = `${domBox.width}px`;
    between.hidden = false;
  });
  contentHost.addEventListener("mouseleave", () => { between.hidden = true; });
  let dragDepth = 0;
  const filesDragged = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  contentHost.addEventListener("dragenter", (e) => { if (filesDragged(e)) { dragDepth++; contentHost.classList.add("is-dragover"); } });
  contentHost.addEventListener("dragleave", () => { dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) contentHost.classList.remove("is-dragover"); });
  contentHost.addEventListener("drop", () => { dragDepth = 0; contentHost.classList.remove("is-dragover"); });
  // Un fichier lâché à côté de la zone d'écriture ne doit pas ouvrir l'image dans le navigateur (et faire perdre l'article)
  window.addEventListener("dragover", (e) => { if (filesDragged(e)) e.preventDefault(); });
  window.addEventListener("drop", (e) => { if (filesDragged(e) && !e.defaultPrevented) { e.preventDefault(); dragDepth = 0; contentHost.classList.remove("is-dragover"); } });
  betweenBtn.addEventListener("mousedown", (e) => e.preventDefault());
  betweenBtn.addEventListener("click", () => {
    if (betweenPos === null) return;
    // Un paragraphe vide à cet endroit, que le bloc choisi remplace
    editor.chain().focus().insertContentAt(betweenPos, { type: "paragraph" }).setTextSelection(betweenPos + 1).run();
    quickInserter(betweenBtn);
    between.hidden = true;
  });
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
    const found = BLOCKS.filter((b) => !((editorPrefs.settings && editorPrefs.settings.hiddenBlocks) || []).includes(b.id) && matches(b, m[1])).slice(0, 8);
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
      handleDOMEvents: {
        // Premier clic dans l'article après un réglage de la barre latérale : le curseur va exactement où l'on clique
        // (sans cela, la sélection précédente — une image, un bouton — reprenait la main et le curseur « sautait »)
        mousedown: (view, event) => {
          if (view.hasFocus() || event.button !== 0) return false;
          const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
          if (!found) return false;
          const target = found.inside >= 0 ? view.state.doc.nodeAt(found.inside) : null;
          if (target && target.isAtom) return false; // clic sur une image, un bouton… : sélection du bloc (comportement normal)
          const $pos = view.state.doc.resolve(found.pos);
          if (!$pos.parent.isTextblock) return false;
          view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, found.pos)));
          return false;
        },
      },
      // Clic dans la marge d'un bloc conteneur (encadré, appel à l'action, FAQ…) : le curseur entre dans le bloc
      handleClickOn: (view, pos, node, nodePos, event, direct) => {
        if (!direct || node.isTextblock || node.isAtom || !CONTAINERS.has(node.type.name) || node.type.name === "table") return false;
        const inside = TextSelection.findFrom(view.state.doc.resolve(nodePos + 1), 1, true);
        if (!inside || inside.from > nodePos + node.nodeSize) return false;
        view.dispatch(view.state.tr.setSelection(inside));
        view.focus();
        return true;
      },
      handleDrop: (view, event, slice, moved) => {
        if (moved || !event.dataTransfer || !event.dataTransfer.files.length) return false;
        event.preventDefault();
        contentHost.classList.remove("is-dragover");
        const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
        insertFiles(event.dataTransfer.files, found ? blockEndAt(found.pos) : editor.state.doc.content.size);
        return true;
      },
      handlePaste: (view, event) => {
        const files = event.clipboardData ? [...event.clipboardData.files] : [];
        if (!files.length) return false;
        event.preventDefault();
        insertFiles(files, blockEndAt(editor.state.selection.from));
        return true;
      },
      handleKeyDown: (view, event) => {
        const mod = event.ctrlKey || event.metaKey;
        const sel = view.state.selection;
        if (sel instanceof NodeSelection && sel.node.isAtom && !mod && !event.altKey) {
          if (event.key === "Enter") {
            event.preventDefault();
            const after = sel.to;
            editor.chain().insertContentAt(after, { type: "paragraph" }).setTextSelection(after + 1).run();
            return true;
          }
          // Taper avec une image / un bouton… sélectionné : on ne l'efface pas, le texte part dans un nouveau paragraphe juste après
          if (event.key.length === 1) {
            event.preventDefault();
            const after = sel.to;
            editor.chain().insertContentAt(after, { type: "paragraph", content: event.key === " " ? [] : [{ type: "text", text: event.key }] }).setTextSelection(after + 1 + (event.key === " " ? 0 : 1)).run();
            editor.view.focus();
            return true;
          }
        }
        // Frappe dans le texte : la barre d'outils du bloc s'efface jusqu'au prochain mouvement de souris (comme Gutenberg)
        if (!mod && (event.key.length === 1 || event.key === "Backspace" || event.key === "Enter")) setTyping(true);
        else if (/^(Arrow|Escape|Tab|Home|End|Page)/.test(event.key)) setTyping(false); // navigation au clavier : la barre revient
        if (slash && ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
          const options = [...slash.querySelectorAll("button")];
          const i = options.findIndex((o) => o.classList.contains("is-active"));
          if (event.key === "Escape") { slash.remove(); slash = null; return true; }
          if (event.key === "Enter") { if (options[i]) options[i].click(); return true; }
          const next = options[(i + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length];
          options.forEach((o) => o.classList.toggle("is-active", o === next));
          return true;
        }
        if (mod && !event.shiftKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          // Avec du texte sélectionné (ou dans un lien) : lien ; sinon : palette de commandes
          if (!editor.state.selection.empty || editor.isActive("link") || !wsUi) linkPopover(null); else wsUi.openPalette();
          return true;
        }
        if (mod && event.shiftKey && event.key.toLowerCase() === "f") { event.preventDefault(); openFind(); return true; }
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
      else { const to = editor.state.selection.to; chain().extendMarkRange("link").setLink(linkAttrs).setTextSelection(to).unsetMark("link").run(); } // curseur après le lien, sans le prolonger
      pop.close();
      editor.view.focus();
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
    const pop = popover(anchorEl, h("div", { class: "wp-link-control" }, h("div", { class: "wp-link-input" }, url, h("button", { type: "button", class: "wp-btn-primary", onclick: () => apply() }, "Appliquer")), results, settings, attrs.href ? h("button", { type: "button", class: "wp-btn-link is-danger", onclick: () => { chain().extendMarkRange("link").unsetLink().run(); pop.close(); editor.view.focus(); } }, "Supprimer le lien") : null), { className: "is-link" });
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
    // Téléversement : bouton « Sélectionner des fichiers » OU glisser-déposer n'importe où dans la fenêtre
    const status = h("p", { class: "wp-upload-status", role: "status", "aria-live": "polite" });
    async function handleFiles(fileList) {
      const files = [...fileList];
      const ok = files.filter((f) => kindOf(f) === kind);
      const refused = files.length - ok.length;
      if (refused) toast(`${refused} fichier(s) ignoré(s) : format non accepté ici (${ACCEPT_LABEL[kind]}).`, "error");
      if (!ok.length) return;
      const list = multiple ? ok : ok.slice(0, 1);
      if (!multiple) chosen.clear();
      const uploaded = [];
      for (const [i, file] of list.entries()) {
        status.textContent = `Téléversement ${i + 1} sur ${list.length} : ${file.name}…`;
        root.classList.add("is-uploading");
        try { const media = await uploadMedia(file, kind); uploaded.push(media); chosen.set(media.id, media); showDetails(media); }
        catch (e) { toast(`${file.name} : ${e.message}`, "error"); }
      }
      status.textContent = uploaded.length ? `${uploaded.length} fichier(s) téléversé(s).` : "";
      root.classList.remove("is-uploading");
      upload.value = "";
      if (!uploaded.length) return;
      // Ouverte pour insérer : le fichier déposé est inséré tout de suite (comme WordPress), sans clic de plus
      if (onSelect && !multiple) { m.close(); onSelect(uploaded[0], { alt: uploaded[0].alt || "", caption: "", credit: "" }); toast(kind === "image" ? "Image insérée. Ajoutez son texte alternatif dans l'onglet Bloc." : "Fichier inséré."); return; }
      if (multiple && onSelectMany && chosen.size >= 2) { const all = [...chosen.values()]; m.close(); onSelectMany(all); toast("Galerie créée."); return; }
      tabsBar.querySelectorAll("button")[1].click();
      selectBtn.disabled = !chosen.size;
    }
    upload.addEventListener("change", () => handleFiles(upload.files));
    const uploadPane = h("div", { class: "wp-upload-pane", hidden: true }, h("p", { class: "wp-upload-title" }, "Déposez des fichiers pour les téléverser"), h("p", {}, "ou"), h("label", { class: "wp-btn-secondary", for: upload.id }, "Sélectionner des fichiers"), upload, h("p", { class: "wp-help" }, `${ACCEPT_LABEL[kind]}.`), status);
    const libraryPane = h("div", { class: "wp-library-pane" }, h("div", { class: "wp-library-toolbar" }, q), h("div", { class: "wp-library-main" }, grid, details));
    const tabsBar = segmentedTabs([["upload", "Téléverser des fichiers"], ["library", "Médiathèque"]], (k) => { uploadPane.hidden = k !== "upload"; libraryPane.hidden = k !== "library"; if (k === "library") load(); });
    tabsBar.querySelectorAll("button")[0].setAttribute("aria-selected", "false");
    tabsBar.querySelectorAll("button")[1].setAttribute("aria-selected", "true");
    const selectBtn = h("button", { type: "button", class: "wp-btn-primary", disabled: true }, multiple ? "Créer une galerie" : onSelect ? "Sélectionner" : "Fermer");
    const m = modal(kind === "image" ? (multiple ? "Créer une galerie" : "Sélectionner ou téléverser un média") : kind === "video" ? "Sélectionner une vidéo" : "Sélectionner un fichier audio", h("div", { class: "wp-media-modal" }, tabsBar, uploadPane, libraryPane, h("div", { class: "wp-modal-actions" }, selectBtn)), [], { wide: true });
    const dropZone = m.dlg;
    const dropHint = h("div", { class: "wp-drop-hint", "aria-hidden": "true" }, h("span", {}, "Déposez pour téléverser"));
    dropZone.append(dropHint);
    let depth = 0;
    const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
    dropZone.addEventListener("dragenter", (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; dropZone.classList.add("is-dragover"); });
    dropZone.addEventListener("dragover", (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
    dropZone.addEventListener("dragleave", () => { depth = Math.max(0, depth - 1); if (!depth) dropZone.classList.remove("is-dragover"); });
    dropZone.addEventListener("drop", (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; dropZone.classList.remove("is-dragover"); handleFiles(e.dataTransfer.files); });
    selectBtn.addEventListener("click", () => {
      const list = [...chosen.values()];
      m.close();
      if (multiple && onSelectMany) { if (list.length < 2) return toast("Une galerie contient au moins 2 images.", "error"); return onSelectMany(list); }
      if (onSelect && list[0]) onSelect(list[0], { alt: list[0].alt || "", caption: list[0].caption || "", credit: list[0].credit || "" });
    });
    if (!onSelect && !onSelectMany) selectBtn.disabled = false;
    load();
  }
  const ACCEPT = { image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"], video: ["video/mp4", "video/webm"], audio: ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/ogg", "audio/wav", "audio/x-wav", "audio/wave"] };
  const ACCEPT_LABEL = { image: "JPEG, PNG, WebP, GIF ou AVIF", video: "MP4 ou WebM", audio: "MP3, M4A, OGG ou WAV" };
  const kindOf = (file) => Object.keys(ACCEPT).find((k) => ACCEPT[k].includes(file.type)) || null;
  // Fichiers déposés ou collés directement dans l'article : téléversés puis insérés à cet endroit
  async function insertFiles(fileList, at) {
    const files = [...fileList].filter((f) => kindOf(f));
    if (!files.length) { toast(`Format non accepté. Images : ${ACCEPT_LABEL.image} ; vidéo : ${ACCEPT_LABEL.video} ; audio : ${ACCEPT_LABEL.audio}.`, "error"); return; }
    root.classList.add("is-uploading");
    const done = [];
    for (const [i, file] of files.entries()) {
      toast(`Téléversement ${i + 1} sur ${files.length} : ${file.name}…`);
      try { done.push(await uploadMedia(file, kindOf(file))); } catch (e) { toast(`${file.name} : ${e.message}`, "error"); }
    }
    root.classList.remove("is-uploading");
    if (!done.length) return;
    const images = done.filter((m) => m.kind === "image");
    const nodes = [];
    if (images.length >= 2) nodes.push({ type: "kbGallery", attrs: { columns: images.length >= 3 ? "3" : "2", images: images.map((m) => ({ src: m.path, alt: m.alt || "", caption: "" })) } });
    else if (images.length) nodes.push({ type: "kbImage", attrs: { src: images[0].path, mediaId: images[0].id, alt: "", caption: "", credit: "", title: images[0].title || "", width: "100", align: "center" } });
    for (const m of done) {
      if (m.kind === "video") nodes.push({ type: "kbVideo", attrs: { url: m.path, caption: "" } });
      if (m.kind === "audio") nodes.push({ type: "kbAudio", attrs: { src: m.path, title: m.title || "" } });
    }
    placeAfter(Math.min(at, editor.state.doc.content.size), nodes);
    toast(images.length ? `${done.length} fichier(s) inséré(s). Ajoutez le texte alternatif dans l'onglet Bloc.` : `${done.length} fichier(s) inséré(s).`);
  }
  const blockEndAt = (pos) => { const $p = editor.state.doc.resolve(Math.max(0, Math.min(pos, editor.state.doc.content.size))); return $p.depth ? $p.after(1) : $p.pos; };
  async function uploadMedia(file, kind) {
    const body = new FormData();
    body.append(kind === "image" ? "article_image" : kind === "video" ? "article_video" : "article_audio", file);
    if (kind === "image") {
      const url = URL.createObjectURL(file);
      const img = await new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = url; });
      if (img && img.naturalWidth) {
        body.append("width", img.naturalWidth); body.append("height", img.naturalHeight);
        // Versions réduites au format WebP (480, 960, 1600 px) : le site sert à chaque écran l'image adaptée (srcset)
        if (/^image\/(jpeg|png|webp)$/.test(file.type) && (editorPrefs.settings || {}).imageVariants !== false) {
          const widths = [];
          for (const w of [480, 960, 1600].filter((x) => x < img.naturalWidth)) {
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = Math.round((img.naturalHeight * w) / img.naturalWidth);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
            if (blob && blob.type === "image/webp") { body.append("image_variant", new File([blob], `variante-${w}.webp`, { type: "image/webp" })); widths.push(w); }
          }
          if (widths.length) body.append("variant_widths", widths.join(","));
        }
      }
      URL.revokeObjectURL(url);
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
    if (key === "bloc") renderInspector(true);
    if (key === "seo") loadSeoSite();
    afterVisibility();
  }
  sidebarTabs.forEach((t) => t.addEventListener("click", () => showSidebarTab(t.dataset.sidebarTab)));
  $$("[data-toggle-sidebar]").forEach((b) => b.addEventListener("click", () => {
    const open = sidebar.hidden;
    sidebar.hidden = !open;
    root.classList.toggle("is-sidebar-closed", !open);
    $(".wp-header [data-toggle-sidebar]").setAttribute("aria-pressed", String(open));
    afterVisibility();
  }));
  $$("[data-panel-toggle]").forEach((b) => b.addEventListener("click", () => openPanel(b.closest("[data-panel]").dataset.panel)));
  function openPanel(key, force, { silent = false } = {}) {
    const panel = $(`[data-panel="${key}"]`);
    const btn = panel.querySelector("[data-panel-toggle]");
    const open = force ?? btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", String(open));
    panel.classList.toggle("is-open", open);
    panel.querySelector(".wp-panel-body").hidden = !open;
    if (open) { if (key === "structure") refreshStructure(); if (key === "checklist" || key === "revisions") refreshPublication(); if (key === "seo-history") loadSeoHistory(); }
    if (!silent && workspace) workspace.notifyPanelToggle(key, open);
    if (open) afterVisibility();
  }
  // Panneaux devenus visibles : chargement de leurs données (seulement eux)
  function afterVisibility() {
    if (!workspace || !seoRenderers) return;
    seoRenderers.refreshVisible();
    if (workspace.isVisible("seo-site")) loadSeoSite();
  }
  // Ouvre la barre latérale sur l'onglet qui contient la section, puis la déplie
  // Historique SEO de l'article (journal du serveur)
  const SEO_FIELD_LABELS = { title: "Titre", slug: "Lien", seo_title: "Titre SEO", seo_description: "Méta description", canonical_url: "URL canonique", robots_index: "Indexation", robots_follow: "Suivi des liens", og_title: "Titre de partage", og_description: "Description de partage", og_image_path: "Image de partage", twitter_title: "Titre X", twitter_description: "Description X", twitter_card: "Carte X", focus_keyword: "Mot-clé principal", secondary_keywords: "Mots-clés secondaires", schema_type: "Données structurées", status: "Statut", "liens internes": "Liens internes" };
  async function loadSeoHistory() {
    const list = $("[data-seo-history]");
    if (!postId) { list.replaceChildren(h("li", { class: "wp-help" }, "Disponible après le premier enregistrement.")); return; }
    list.replaceChildren(h("li", { class: "wp-help" }, "Chargement…"));
    try {
      const { changes } = await api(`/formateur/blog/${postId}/seo-historique`);
      list.replaceChildren(...changes.map((c) => h("li", {}, h("span", { class: "be-version-when" }, `${SEO_FIELD_LABELS[c.field] || c.field} · ${fmtDate(c.at)}`), h("span", { class: "be-version-who" }, c.by || "—"), h("span", { class: "be-version-note" }, `${c.before ?? "(vide)"} → ${c.after ?? "(vide)"}`))));
      if (!changes.length) list.append(h("li", { class: "wp-help" }, "Aucune modification SEO enregistrée pour l'instant."));
    } catch (e) { list.replaceChildren(h("li", { class: "wp-error" }, e.message)); }
  }
  // Audit du site (SEO CORE) : résultats du dernier audit pour la page publiée, analyse à la demande
  const seoIssueItem = (i) => h("li", { class: `wp-seo-issue is-${i.severity}` },
    h("span", { class: "wp-seo-issue-sev" }, i.severityLabel),
    h("span", { class: "wp-seo-issue-title" }, i.title),
    i.detail ? h("span", { class: "wp-help" }, i.detail) : null,
    i.recommendation ? h("span", { class: "wp-seo-issue-reco" }, i.recommendation) : null);
  const seoIssueList = (issues) => h("ul", { class: "wp-seo-issues" }, ...issues.map(seoIssueItem));
  let seoSiteLoaded = false;
  async function loadSeoSite(force) {
    const box = $("[data-seo-site]");
    if (!box || (seoSiteLoaded && !force)) return;
    const btn = $("[data-seo-analyse]");
    if (!postId) { box.replaceChildren(h("p", { class: "wp-help" }, "Disponible après le premier enregistrement de l'article.")); btn.hidden = true; return; }
    seoSiteLoaded = true;
    box.replaceChildren(h("p", { class: "wp-help" }, "Chargement…"));
    try {
      const r = await api(`/formateur/blog/${postId}/seo-audit`);
      btn.hidden = !r.online;
      $("[data-seo-space]").href = r.online ? r.links.analyse : r.links.space;
      if (!r.online) { box.replaceChildren(h("p", { class: "wp-help" }, "Non disponible : l'article n'est pas en ligne. Le contrôle SEO s'affiche au moment de publier.")); return; }
      if (!r.audit) { box.replaceChildren(h("p", { class: "wp-help" }, "Aucun audit du site n'a encore été lancé. Cliquez sur « Analyser la page en ligne » pour vérifier cet article maintenant.")); return; }
      const when = h("p", { class: "wp-help" }, `Dernier audit : ${fmtDate(r.audit.finishedAt)}.${r.newerThanAudit ? " L'article a changé depuis : relancez une analyse pour voir la version en ligne." : ""}`);
      box.replaceChildren(when, r.issues.length ? seoIssueList(r.issues) : h("p", { class: "wp-seo-ok" }, "Aucun problème trouvé pour cet article lors du dernier audit."));
    } catch (e) { box.replaceChildren(h("p", { class: "wp-error" }, e.message)); seoSiteLoaded = false; }
  }
  $("[data-seo-analyse]")?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    const box = $("[data-seo-site]");
    btn.disabled = true;
    btn.textContent = "Analyse en cours…";
    try {
      const r = await api(`/formateur/blog/${postId}/seo-analyse`, { method: "POST" });
      box.replaceChildren(
        h("p", { class: "wp-help" }, `Page en ligne analysée à l'instant${r.score === null ? "" : ` · note interne ${r.score} / 100`}.`),
        r.issues.length ? seoIssueList(r.issues) : h("p", { class: "wp-seo-ok" }, "Aucun problème trouvé sur la page en ligne."));
    } catch (e) { box.replaceChildren(h("p", { class: "wp-error" }, e.message)); }
    btn.disabled = false;
    btn.textContent = "Analyser la page en ligne";
  });

  const revealPanel = (key) => {
    const panel = $(`[data-panel="${key}"]`);
    // Panneau SEO déplacé hors de la barre latérale (ancré ailleurs, flottant, fermé) : l'espace de travail le montre
    if (workspace && workspace.containsPanel(key) && !panel.closest("[data-sidebar-panel]")) { workspace.reveal(key); return; }
    if (workspace && workspace.containsPanel(key) && panel.closest("[data-wsp-parking]")) { workspace.reveal(key); return; }
    if (sidebar.hidden) $(".wp-header [data-toggle-sidebar]").click();
    showSidebarTab(panel.closest("[data-sidebar-panel]").dataset.sidebarPanel);
    openPanel(key, true);
    panel.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  function revealSeo() {
    if (workspace && !$('[data-panel="score"]').closest("[data-sidebar-panel]")) { workspace.reveal("score"); return; }
    if (sidebar.hidden) $(".wp-header [data-toggle-sidebar]").click();
    showSidebarTab("seo");
    sidebar.scrollTo({ top: 0, behavior: "smooth" });
    const score = $("[data-seo-score]");
    score.classList.remove("is-flash");
    void score.offsetWidth; // relance l'animation à chaque clic
    score.classList.add("is-flash");
  }

  // ---------- Onglet Bloc : réglages du bloc sélectionné ----------
  const inspector = $("[data-block-inspector]");
  const DESC = { paragraph: "Commencez par le bloc de construction de toute narration.", heading: "Introduit une nouvelle section et organise le contenu.", kbImage: "Insérez une image pour illustrer votre propos.", kbGallery: "Affichez plusieurs images dans une galerie.", kbVideo: "Intégrez une vidéo.", kbAudio: "Intégrez un fichier audio.", kbEmbed: "Intégrez un contenu externe.", kbButton: "Invitez les lecteurs à agir.", callout: "Mettez une information en évidence.", kbCourse: "Recommandez une formation du catalogue.", kbNewsletter: "Formulaire d'inscription à la newsletter.", table: "Données structurées en tableau.", kbSteps: "Guide pas à pas (HowTo).", kbFaq: "Questions fréquentes (FAQPage).", kbCompare: "Comparaison en colonnes.", kbCta: "Encadré d'appel à l'action.", bulletList: "Liste à puces.", orderedList: "Liste numérotée.", taskList: "Liste de contrôle.", blockquote: "Mettez en valeur une citation.", codeBlock: "Code en respectant l'espacement.", kbAccordion: "Masquez et affichez du contenu.", kbSpacer: "Ajoutez de l'espace vertical entre deux blocs.", kbPageBreak: "Commence une nouvelle page à l'impression ou en PDF.", kbColumns: "Disposez des blocs côte à côte ; empilés sur mobile.", kbGroup: "Regroupez des blocs sur un fond commun.", kbButtons: "Plusieurs boutons côte à côte." };
  let inspectorKey = "";
  function renderInspector(force = false) {
    if ($('[data-sidebar-panel="bloc"]').hidden) return;
    const b = currentBlock();
    const key = b ? `${b.pos}|${b.node.type.name}|${JSON.stringify(b.node.attrs)}|${b.text ? JSON.stringify(b.text.node.attrs) : ""}` : "";
    if (!force && key === inspectorKey) return;
    // Champ du panneau en cours de saisie (même bloc) : on ne touche à rien, sinon le texte tapé serait perdu
    if (!force && b && inspectorKey.split("|")[0] === String(b.pos) && inspector.contains(document.activeElement)) { inspectorKey = key; return; }
    inspectorKey = key;
    inspector.replaceChildren();
    if (!b) { inspector.append(h("p", { class: "wp-help wp-empty-inspector" }, "Aucun bloc sélectionné.")); return; }
    const node = b.node;
    const t = node.type.name;
    const a = node.attrs;
    const set = (attrs) => setAttrsAt(b.pos, attrs);
    const editingReusable = editingReusableAt();
    if (editingReusable) inspector.append(h("div", { class: "wp-reusable-banner" }, h("p", {}, `✎ Modification de l'original « ${editingReusable.node.attrs.name} »`),
      h("div", { class: "wp-button-row" }, h("button", { type: "button", class: "wp-btn-primary", onclick: () => commitReusable(editingReusable.pos) }, "Enregistrer le bloc (partout)"), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => commitReusable(editingReusable.pos, { cancel: true }) }, "Annuler"))));
    inspector.append(h("div", { class: "wp-block-card" }, h("span", { class: "wp-block-card-icon" }, svg(ICON_OF[t] || "paragraph")), h("div", {}, h("h2", {}, nameOf(node)), h("p", {}, DESC[t] || ""))));
    const section = (title, ...children) => h("div", { class: "wp-panel is-open" }, h("h2", { class: "wp-panel-title is-static" }, title), h("div", { class: "wp-panel-body" }, ...children));
    const bind = (el, key, transform = (x) => x) => { el.addEventListener("input", debounce(() => set({ [key]: transform(el.value) }), 300)); return el; };
    if (t === "paragraph" || t === "heading") {
      const align = node.attrs.textAlign || "left";
      inspector.append(section("Typographie",
        h("p", { class: "wp-label" }, "Alignement"),
        segmented([["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"]], align, (v) => chain().setTextAlign(v).run()),
        t === "heading" ? h("p", { class: "wp-label" }, "Niveau de titre") : null,
        t === "heading" ? segmented([1, 2, 3, 4, 5, 6].map((l) => [l, `H${l}`]), a.level, (l) => chain().setHeading({ level: Number(l) }).run()) : null,
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
        h("p", { class: "wp-label" }, "Proportions"),
        segmented([["", "Originales"], ["16-9", "16:9"], ["4-3", "4:3"], ["3-2", "3:2"], ["1-1", "1:1"], ["3-4", "3:4"]], a.ratio || "", (v) => set({ ratio: v })),
        h("p", { class: "wp-help" }, "Chargement différé et versions réduites (WebP) servies selon l'écran."),
        h("div", { class: "wp-button-row" },
          h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ onSelect: (m, extra) => set({ src: m.path, mediaId: m.id, alt: extra.alt || a.alt }) }) }, "Remplacer"),
          h("button", { type: "button", class: "wp-btn-secondary", onclick: () => cropImage(b.pos) }, "Recadrer…"),
          h("button", { type: "button", class: "wp-btn-secondary", onclick: () => { setCover(a.src, a.alt); toast("Image mise en avant définie."); } }, "Définir comme image mise en avant"))));
      const href = input({ value: a.href || "", placeholder: "https://… ou /cours/…" });
      href.addEventListener("input", debounce(() => { const v = href.value.trim(); if (!v || /^(https?:\/\/\S+|\/(?!\/)\S*|mailto:\S+)$/i.test(v)) set({ href: v }); }, 300));
      inspector.append(section("Lien", control("Lien de l'image", href, "Vide : pas de lien."), checkbox("Ouvrir dans un nouvel onglet", a.newTab, (v) => set({ newTab: v }))));
      const info = h("div", { class: "wp-image-info", "aria-live": "polite" }, h("p", { class: "wp-help" }, "Vérification du fichier…"));
      inspector.append(section("Fichier", info));
      api("/formateur/blog/api/espace-seo/images", { method: "POST", json: { srcs: [a.src] } }).then(({ images }) => {
        const f = images[0] || {};
        if (f.exists === false) return info.replaceChildren(h("p", { class: "wp-warning is-error" }, "⚠ Fichier introuvable sur le serveur : remplacez l'image."));
        if (!f.exists) return info.replaceChildren(h("p", { class: "wp-help" }, "Image externe : non vérifiée."));
        const warn = [];
        if (f.bytes > 500 * 1024) warn.push(`Image lourde (${Math.round(f.bytes / 1024)} Ko) : elle ralentit la page. Les versions réduites sont servies aux petits écrans ; pour les autres, une image de moins de 500 Ko est conseillée.`);
        if (f.width && f.width < 600 && a.width === "100") warn.push(`Image étroite (${f.width} px) affichée en pleine largeur : elle sera floue. Réduisez sa largeur ou choisissez une image plus grande.`);
        if (f.width > 4000 || f.height > 4000) warn.push(`Dimensions très grandes (${f.width} × ${f.height} px) : inutile pour un article.`);
        info.replaceChildren(h("p", { class: "wp-help" }, `${f.width || "?"} × ${f.height || "?"} px · ${f.bytes ? `${Math.round(f.bytes / 1024)} Ko` : "?"} · ${String(f.format || "").toUpperCase()}`), ...warn.map((w) => h("p", { class: "wp-warning" }, `⚠ ${w}`)));
      }).catch(() => info.replaceChildren(h("p", { class: "wp-help" }, "Informations du fichier indisponibles.")));
    } else if (t === "kbGallery") {
      inspector.append(section("Réglages",
        h("p", { class: "wp-label" }, "Colonnes"),
        segmented([["2", "2"], ["3", "3"], ["4", "4"]], a.columns, (v) => set({ columns: v })),
        h("p", { class: "wp-label" }, "Espacement"),
        segmented([["s", "Petit"], ["", "Moyen"], ["l", "Grand"]], a.gap || "", (v) => set({ gap: v })),
        h("p", { class: "wp-label" }, "Images"),
        h("ul", { class: "wp-gallery-items" }, ...(a.images || []).map((img, i) => {
          const alt = input({ value: img.alt || "", placeholder: "Texte alternatif", "aria-label": `Texte alternatif de l'image ${i + 1}` });
          alt.addEventListener("input", debounce(() => { const images = [...currentBlock().node.attrs.images]; images[i] = { ...images[i], alt: alt.value }; set({ images }); }, 300));
          const cap = input({ value: img.caption || "", placeholder: "Légende", "aria-label": `Légende de l'image ${i + 1}` });
          cap.addEventListener("input", debounce(() => { const images = [...currentBlock().node.attrs.images]; images[i] = { ...images[i], caption: cap.value }; set({ images }); }, 300));
          const move = (d) => { const images = [...currentBlock().node.attrs.images]; const j = i + d; if (j < 0 || j >= images.length) return; [images[i], images[j]] = [images[j], images[i]]; set({ images }); renderInspector(true); };
          return h("li", {}, h("img", { src: img.src, alt: "" }), h("div", { class: "wp-gallery-fields" }, alt, cap),
            h("div", { class: "wp-gallery-moves" }, h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Avancer l'image", disabled: i === 0 || null, onclick: () => move(-1) }, "↑"), h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Reculer l'image", disabled: i === a.images.length - 1 || null, onclick: () => move(1) }, "↓"),
              h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Retirer l'image", onclick: () => { const images = [...currentBlock().node.attrs.images]; images.splice(i, 1); set({ images }); renderInspector(true); } }, "×")));
        })),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ multiple: true, onSelectMany: (list) => set({ images: [...a.images, ...list.map((m) => ({ src: m.path, alt: m.alt || "", caption: m.caption || "" }))] }) }) }, "Ajouter des images")));
    } else if (t === "kbVideo" || t === "kbEmbed") {
      inspector.append(section("Réglages", control("Adresse", bind(input({ value: a.url || "", type: "url" }), "url"), t === "kbVideo" ? "YouTube, Vimeo, ou un fichier vidéo téléversé." : "YouTube, Vimeo et les cartes Google Maps deviennent un lecteur ; les autres adresses s'affichent comme un lien (sécurité)."), control("Légende", bind(input({ value: a.caption || "" }), "caption"))));
      if (t === "kbVideo") {
        const isFile = /^\/uploads\/blog\//.test(a.url || "");
        const flag = (k) => (v) => set({ [k]: v ? "true" : "" });
        inspector.append(section("Lecture", ...(isFile ? [
          h("div", { class: "wp-button-row" }, h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ onSelect: (m) => set({ poster: m.path }) }) }, a.poster ? "Changer l'image d'affiche" : "Choisir une image d'affiche"), a.poster ? h("button", { type: "button", class: "wp-btn-link is-danger", onclick: () => set({ poster: "" }) }, "Retirer") : null),
          checkbox("Lecture automatique (toujours sans le son)", a.autoplay === "true", flag("autoplay")),
          checkbox("Muet", a.muted === "true" || a.autoplay === "true", flag("muted")),
          checkbox("En boucle", a.loop === "true", flag("loop")),
          checkbox("Masquer les commandes de lecture", a.nocontrols === "true", flag("nocontrols")),
        ] : [h("p", { class: "wp-help" }, "Affiche, lecture automatique, muet et boucle s'appliquent aux fichiers vidéo téléversés. Pour YouTube et Vimeo, c'est le lecteur du service qui est utilisé.")])));
      }
    } else if (t === "kbAudio") {
      inspector.append(section("Réglages", control("Titre", bind(input({ value: a.title || "" }), "title")), control("Auteur", bind(input({ value: a.author || "" }), "author")), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => openMediaModal({ kind: "audio", onSelect: (m) => set({ src: m.path }) }) }, "Remplacer le fichier")));
    } else if (t === "kbButton") {
      const href = input({ value: a.href || "" });
      href.addEventListener("input", debounce(() => { if (/^(https?:\/\/\S+|\/(?!\/)\S*|mailto:\S+)$/i.test(href.value.trim())) set({ href: href.value.trim() }); }, 300));
      inspector.append(section("Réglages", control("Texte", bind(input({ value: a.text || "" }), "text")), control("Lien", href, "/catalogue, /cours/…, ou https://…"),
        h("p", { class: "wp-label" }, "Style"), segmented([["primary", "Plein"], ["outline", "Contour"]], a.variant, (v) => set({ variant: v })),
        h("p", { class: "wp-label" }, "Alignement"), segmented([["left", "Gauche"], ["center", "Centre"], ["right", "Droite"]], a.align, (v) => set({ align: v })),
        checkbox("Ouvrir dans un nouvel onglet", a.newTab, (v) => set({ newTab: v }))));
      const colorField = (label, key) => {
        const c = h("input", { type: "color", value: a[key] || "#0277b6", "aria-label": label });
        c.addEventListener("input", debounce(() => set({ [key]: c.value }), 150));
        return h("div", { class: "wp-color-row" }, h("span", { class: "wp-label" }, label), c, h("button", { type: "button", class: "wp-btn-link", onclick: () => set({ [key]: "" }) }, a[key] ? "Par défaut" : "(par défaut)"));
      };
      inspector.append(section("Apparence",
        h("p", { class: "wp-label" }, "Taille"), segmented([["s", "Petite"], ["", "Moyenne"], ["l", "Grande"]], a.size || "", (v) => set({ size: v })),
        h("p", { class: "wp-label" }, "Coins"), segmented([["", "Défaut"], ["none", "Carrés"], ["s", "Arrondis"], ["pill", "Pilule"]], a.radius || "", (v) => set({ radius: v })),
        h("p", { class: "wp-label" }, "Largeur"), segmented([["", "Automatique"], ["full", "Pleine largeur"]], a.width || "", (v) => set({ width: v })),
        colorField("Fond", "bg"), colorField("Texte", "fg"), colorField("Bordure", "border")));
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
    } else if (t === "kbReusable") {
      inspector.append(section("Bloc synchronisé", h("p", { class: "wp-help" }, "Ce contenu est partagé : le modifier change tous les articles qui l'utilisent."),
        h("div", { class: "wp-button-row" }, h("button", { type: "button", class: "wp-btn-primary", onclick: () => editReusable(b.pos) }, "Modifier l'original"), h("button", { type: "button", class: "wp-btn-secondary", onclick: () => detachReusable(b.pos) }, "Convertir en blocs normaux"))));
    } else if (t === "blockquote") {
      inspector.append(section("Réglages", checkbox("Citation mise en avant (grande, centrée)", Boolean(a.pullquote), (v) => set({ pullquote: v }))));
    } else if (t === "kbSpacer") {
      const SIZES = [["s", "Petit"], ["m", "Moyen"], ["l", "Grand"], ["xl", "Très grand"]];
      const mobile = select([["", "Comme sur ordinateur"], ...SIZES], a.sizeMobile || "");
      mobile.addEventListener("change", () => set({ sizeMobile: mobile.value }));
      inspector.append(section("Réglages", h("p", { class: "wp-label" }, "Hauteur"), segmented(SIZES, a.size, (v) => set({ size: v })), control("Hauteur sur mobile", mobile)));
    } else if (t === "kbColumns") {
      const layouts = [["50-50", "2 colonnes · 50 / 50"], ["33-67", "2 colonnes · 33 / 67"], ["67-33", "2 colonnes · 67 / 33"], ["25-75", "2 colonnes · 25 / 75"], ["75-25", "2 colonnes · 75 / 25"], ["33-33-33", "3 colonnes · égales"], ["25-50-25", "3 colonnes · 25 / 50 / 25"], ["50-25-25", "3 colonnes · 50 / 25 / 25"], ["25-25-50", "3 colonnes · 25 / 25 / 50"], ["25-25-25-25", "4 colonnes · égales"]];
      const lay = select(layouts, a.layout);
      lay.addEventListener("change", () => setColumnsLayout(b.pos, lay.value));
      const stack = select([["mobile", "Sur mobile (conseillé)"], ["tablet", "Sur tablette et mobile"], ["never", "Jamais"]], a.stack || "mobile");
      stack.addEventListener("change", () => set({ stack: stack.value }));
      inspector.append(section("Disposition", control("Colonnes et largeurs", lay, "Réduire le nombre de colonnes regroupe le contenu des colonnes retirées dans la dernière."),
        h("p", { class: "wp-label" }, "Espacement"), segmented([["none", "Aucun"], ["s", "Petit"], ["", "Moyen"], ["l", "Grand"]], a.gap || "", (v) => set({ gap: v })),
        h("p", { class: "wp-label" }, "Alignement vertical"), segmented([["", "Haut"], ["center", "Centre"], ["bottom", "Bas"]], a.valign || "", (v) => set({ valign: v })),
        control("Empiler les colonnes", stack)));
    } else if (t === "kbGroup") {
      const bg = select([["none", "Aucun fond"], ["light", "Gris clair"], ["accent", "Bleu clair"], ["warm", "Crème"], ["dark", "Bleu nuit (texte blanc)"]], a.bg || "none");
      bg.addEventListener("change", () => set({ bg: bg.value }));
      inspector.append(section("Style", control("Fond", bg),
        h("p", { class: "wp-label" }, "Marges intérieures"), segmented([["none", "Aucune"], ["s", "Petites"], ["m", "Moyennes"], ["l", "Grandes"]], a.pad || "none", (v) => set({ pad: v })),
        h("p", { class: "wp-label" }, "Largeur"), segmented([["", "Normale"], ["wide", "Large (grand écran)"]], a.width || "", (v) => set({ width: v })),
        checkbox("Bordure", a.border === "true", (v) => set({ border: v ? "true" : "" }))));
    } else if (t === "kbButtons") {
      inspector.append(section("Réglages", h("p", { class: "wp-label" }, "Alignement"), segmented([["left", "Gauche"], ["center", "Centre"], ["right", "Droite"]], a.align, (v) => set({ align: v })),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: () => { const n = editor.state.doc.nodeAt(b.pos); editor.chain().focus().insertContentAt(b.pos + n.nodeSize - 1, { type: "kbButton", attrs: { text: "Nouveau bouton", href: "/catalogue", variant: "outline", align: a.align, newTab: false } }).run(); } }, "+ Ajouter un bouton")));
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
    const mobile = googleDevice === "mobile";
    $("[data-google-preview]").replaceChildren(h("span", { class: "be-g-head" }, h("span", { class: "be-g-favicon", "aria-hidden": "true" }, "K"), h("span", {}, h("span", { class: "be-g-site" }, "KOLAKISA"), h("span", { class: "be-g-url" }, `${siteHost} › blog › ${currentSlug()}`))), h("span", { class: "be-g-title" }, cut(`${title} · KOLAKISA`, mobile ? 75 : 62)), h("span", { class: "be-g-desc" }, cut(desc, mobile ? 120 : 158)));
    refreshMeters();
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
    if (seoData) seoData.publishAnalysis(r);
    const groups = {};
    for (const c of r.checks) (groups[c.group] = groups[c.group] || []).push(c);
    $("[data-analysis]").replaceChildren(
      h("p", { class: "be-analysis-summary" }, h("span", { class: "be-pill be-good" }, `${r.summary.good} bon`), h("span", { class: "be-pill be-improve" }, `${r.summary.improve} à améliorer`), h("span", { class: "be-pill be-problem" }, `${r.summary.problem} problème${r.summary.problem > 1 ? "s" : ""}`)),
      ...Object.entries(groups).map(([g, list]) => h("details", { class: "be-analysis-group", open: list.some((c) => c.status !== "good") }, h("summary", {}, GROUP_LABEL[g] || g),
        h("ul", {}, ...list.map((c) => h("li", { class: `be-check be-${c.status}` }, h("span", { class: "be-check-status" }, STATUS_LABEL[c.status]), h("span", {}, h("strong", {}, c.label), c.advice ? h("small", {}, c.advice) : null)))))));
    const dot = $("[data-seo-dot]");
    dot.className = `be-tab-dot ${r.summary.problem ? "be-problem" : r.summary.improve ? "be-improve" : "be-good"}`;
    dot.title = `${r.summary.problem} problème(s), ${r.summary.improve} point(s) à améliorer`;
    $("[data-stats]").textContent = `${r.words} mots · ${r.minutes} min`;
    renderSeoScore(r);
    const minutes = field("reading_minutes").value;
    $("[data-minutes-hint]").textContent = minutes ? `Calcul automatique : ${r.minutes} min (fixé à ${minutes} min).` : `Calculé automatiquement : ${r.minutes} min (230 mots par minute).`;
  }

  // Note sur 100 (bon = 1, à améliorer = ½, problème = 0) et points à corriger en premier
  const FIX = {
    keyword: ["keyword", "#post-keyword"], "kw-title": ["google", "#post-seo-title"], "seo-title": ["google", "#post-seo-title"], "kw-meta": ["google", "#post-seo-desc"], meta: ["google", "#post-seo-desc"],
    "kw-secondary": ["keyword", "#post-keywords2"], "kw-h1": [null, "#post-title"], "kw-slug": ["article", "#post-slug"], slug: ["article", "#post-slug"], canonical: ["indexing", "#post-canonical"],
    cover: ["article", "#post-cover-alt"], images: ["media", null], internal: ["links", "[data-suggest]"],
  };
  function goFix(id) {
    const [where, sel] = FIX[id] || [];
    if (where === "media") { if (secondaryMode !== "media") setSecondary("media"); return; }
    if (where === "article") { if (sidebar.hidden) $(".wp-header [data-toggle-sidebar]").click(); showSidebarTab("article"); }
    else if (where) revealPanel(where);
    const el = sel && $(sel);
    if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); setTimeout(() => el.focus(), 250); return; }
    // Point qui concerne le texte (longueur, intertitres, lisibilité…) : retour dans l'article
    if (window.matchMedia("(max-width: 782px)").matches) $(".wp-header [data-toggle-sidebar]").click();
    editor.chain().focus("start").scrollIntoView().run();
  }
  function renderSeoScore(r) {
    const score = r.score;
    const level = score >= 80 ? "good" : score >= 50 ? "improve" : "problem";
    const ring = $("[data-seo-ring]");
    const c = 2 * Math.PI * 27;
    ring.style.strokeDasharray = `${c}`;
    ring.style.strokeDashoffset = `${c * (1 - score / 100)}`;
    $("[data-seo-score]").dataset.level = level;
    $("[data-seo-value]").textContent = String(score);
    $("[data-seo-verdict]").textContent = level === "good" ? "Très bien optimisé. Repère interne, pas une note de Google." : level === "improve" ? "Correct, quelques points à améliorer." : "À travailler : commencez par les points ci-dessous.";
    const rail = $("[data-rail-score]");
    rail.textContent = String(score);
    rail.dataset.level = level;
    const todo = [...r.checks.filter((x) => x.status === "problem"), ...r.checks.filter((x) => x.status === "improve")].slice(0, 5);
    $("[data-seo-todo]").replaceChildren(...(todo.length ? [h("p", { class: "wp-label" }, "À corriger en priorité"), h("ul", { class: "wp-seo-todo-list" }, ...todo.map((x) => h("li", { class: `is-${x.status}` },
      h("span", { class: "wp-seo-todo-dot", "aria-hidden": "true" }), h("span", { class: "wp-seo-todo-text" }, h("strong", {}, x.label), x.advice ? h("small", {}, x.advice) : null),
      h("button", { type: "button", class: "wp-btn-link", onclick: () => goFix(x.id) }, FIX[x.id] ? "Corriger" : "Aller au texte"))))] : [h("p", { class: "wp-seo-todo-ok" }, "✓ Rien d'important à corriger.")]));
    $("[data-seo-slug]").textContent = `/blog/${currentSlug()}`;
  }
  function refreshMeters() {
    $$("[data-meter-for]").forEach((m) => {
      const el = document.getElementById(m.dataset.meterFor);
      const n = el.value.trim().length;
      const min = Number(m.dataset.min);
      const max = Number(m.dataset.max);
      m.firstElementChild.style.width = `${Math.min(100, Math.round((n / max) * 100))}%`;
      m.dataset.level = !n ? "empty" : n > max ? "problem" : n < min ? "improve" : "good";
    });
  }
  let googleDevice = "desktop";
  $$("[data-google-device]").forEach((b) => b.addEventListener("click", () => {
    googleDevice = b.dataset.googleDevice;
    $$("[data-google-device]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("[data-google-preview]").classList.toggle("is-mobile", googleDevice === "mobile");
    refreshPreviews();
  }));

  // ---------- Images mise en avant, de partage et X ----------
  function makePick(key, initialPath, hiddenField, removeField, fileInput) {
    const box = $(`[data-image-pick="${key}"]`);
    const state = { path: initialPath || null, objectUrl: null };
    const render = () => {
      const img = state.objectUrl || state.path;
      box.replaceChildren(...[
        img ? h("button", { type: "button", class: "wp-featured-image", "aria-label": "Remplacer l'image", onclick: pick }, h("img", { src: img, alt: "" })) : h("button", { type: "button", class: "wp-featured-placeholder", onclick: pick }, key === "cover" ? "Définir l'image mise en avant" : "Choisir une image"),
        img ? h("div", { class: "wp-button-row" }, h("button", { type: "button", class: "wp-btn-secondary", onclick: pick }, "Remplacer"), h("button", { type: "button", class: "wp-btn-link is-danger", onclick: () => { state.path = null; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = ""; field(removeField).value = "1"; render(); changed(); refreshPreviews(); } }, "Retirer")) : null].filter(Boolean));
    };
    function pick() { openMediaModal({ onSelect: (m) => { state.path = m.path; state.objectUrl = null; fileInput.value = ""; field(hiddenField).value = m.path; field(removeField).value = ""; if (key === "cover" && !field("cover_alt").value) field("cover_alt").value = m.alt || ""; render(); changed(); refreshPreviews(); } }); }
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
  const saveState = $("[data-save-state]");
  const saveBtn = $("[data-save]");
  const dateInput = $("[data-date-input]");
  if (dateInput.value && dateInput.dataset.utc === "1") {
    const d = new Date(`${dateInput.value}:00Z`);
    if (!Number.isNaN(d.getTime())) dateInput.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  const initialDate = dateInput.value;
  // Statut choisi (liste « Statut ») = ce qui sera enregistré. Les boutons et l'étiquette du document suivent toujours ce choix.
  const ONLINE = new Set(["published", "scheduled"]);
  const LEAVE_LABEL = { draft: "Repasser en brouillon", review: "Envoyer en relecture", archived: "Archiver" };
  const SAVE_LABEL = { draft: "Enregistrer le brouillon", review: "Enregistrer (en relecture)", archived: "Enregistrer (archivé)" };
  // Bouton principal, comme WordPress : « Publier » tant que l'article n'est pas en ligne ; ensuite « Mettre à jour »,
  // ou l'action qui correspond au statut choisi (repasser en brouillon, archiver…)
  function primaryAction() {
    const want = statusSelect.value;
    if (!ONLINE.has(DATA.status)) return want === "scheduled" ? { label: "Planifier…", run: "prepublish" } : { label: "Publier", run: "prepublish" };
    if (want === DATA.status) return { label: "Mettre à jour", run: "save" };
    if (want === "published") return { label: "Publier maintenant", run: "save" };
    if (want === "scheduled") return { label: "Planifier…", run: "prepublish" };
    return { label: LEAVE_LABEL[want] || "Enregistrer", run: "save" };
  }
  // Statut à enregistrer avec le bouton secondaire (article pas encore en ligne) : jamais « publié » par ce bouton
  const secondaryStatus = () => (ONLINE.has(statusSelect.value) ? "draft" : statusSelect.value);
  function syncStatus() {
    field("status").value = statusSelect.value;
    const scheduled = statusSelect.value === "scheduled";
    $("[data-date-hint]").textContent = scheduled ? "L'article sera publié automatiquement à cette date." : dateInput.value ? "" : "Immédiatement, à la publication.";
    $("[data-publish]").textContent = primaryAction().label;
    // Bouton secondaire : enregistrer sans publier, seulement tant que l'article n'est pas en ligne
    saveBtn.hidden = ONLINE.has(DATA.status);
    saveBtn.textContent = SAVE_LABEL[secondaryStatus()] || "Enregistrer";
    // « Voir l'article » : l'adresse publique, seulement quand l'article est réellement en ligne
    const view = $("[data-view-post]");
    view.hidden = DATA.status !== "published";
    view.href = `/blog/${field("slug").value || DATA.slug}`;
    const chip = $("[data-doc-status]");
    chip.dataset.status = DATA.status;
    chip.textContent = DATA.statuses[DATA.status] || DATA.status;
  }
  field("slug").addEventListener("blur", () => { const v = field("slug").value.trim(); if (v) field("slug").value = slugify(v); });
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
        i > 0 ? h("button", { type: "button", class: "wp-btn-link", onclick: () => compareVersion(r) }, "Comparer") : null,
        i > 0 ? h("button", { type: "button", class: "wp-btn-link", onclick: () => restoreVersion(r) }, "Restaurer") : h("span", { class: "wp-help" }, "actuelle")))));
    if (!DATA.revisions.length) list.append(h("li", { class: "wp-help" }, "Les révisions apparaîtront après le premier enregistrement."));
  }
  // ---------- Comparaison d'une révision avec l'article actuel ----------
  // Texte par blocs (titres, paragraphes, éléments de liste…) ; différences ligne par ligne, puis mot par mot
  const blockLines = (html, format) => {
    if (format && format !== "html") return String(html || "").split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const box = document.createElement("div");
    box.innerHTML = String(html || "");
    const out = [];
    box.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, figcaption, summary, td, th, pre").forEach((el) => {
      if (el.querySelector("p, li, h1, h2, h3, h4, h5, h6")) return;
      const t = el.textContent.replace(/\s+/g, " ").trim();
      const tag = el.tagName.toLowerCase();
      if (t) out.push(/^h[1-6]$/.test(tag) ? `${tag.toUpperCase()} · ${t}` : t);
    });
    box.querySelectorAll("img").forEach((img) => out.push(`Image · ${img.getAttribute("alt") || img.getAttribute("src")}`));
    return out;
  };
  function lcs(a, b) {
    const n = a.length; const m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const ops = [];
    let i = 0; let j = 0;
    while (i < n && j < m) { if (a[i] === b[j]) { ops.push(["=", a[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push(["-", a[i++]]); else ops.push(["+", b[j++]]); }
    while (i < n) ops.push(["-", a[i++]]);
    while (j < m) ops.push(["+", b[j++]]);
    return ops;
  }
  const wordDiff = (a, b) => { const A = a.split(/(\s+)/); const B = b.split(/(\s+)/); if (A.length * B.length > 400000) return null; return lcs(A, B).map(([op, w]) => (op === "=" ? w : h(op === "-" ? "del" : "ins", {}, w))); };
  async function compareVersion(r) {
    try {
      const v = await api(`/formateur/blog/${postId}/versions/${r.id}`);
      const before = [`Titre · ${v.title}`, ...blockLines(v.content, v.content_format)].slice(0, 1500);
      const after = [`Titre · ${field("title").value}`, ...blockLines(editor.getHTML(), "html")].slice(0, 1500);
      const ops = lcs(before, after);
      const rows = [];
      let same = 0;
      const flushSame = () => { if (same) rows.push(h("li", { class: "is-same" }, `… ${same} bloc${same > 1 ? "s" : ""} identique${same > 1 ? "s" : ""}`)); same = 0; };
      for (let k = 0; k < ops.length; k++) {
        const [op, line] = ops[k];
        if (op === "=") { same++; continue; }
        flushSame();
        // Un retrait suivi d'un ajout : bloc modifié → différences mot par mot
        if (op === "-" && ops[k + 1] && ops[k + 1][0] === "+") { const w = wordDiff(line, ops[k + 1][1]); if (w) { rows.push(h("li", { class: "is-changed" }, ...w)); k++; continue; } }
        rows.push(h("li", { class: op === "-" ? "is-removed" : "is-added" }, h(op === "-" ? "del" : "ins", {}, line)));
      }
      flushSame();
      const changed = ops.filter(([op]) => op !== "=").length;
      modal(`Comparer avec la révision du ${fmtDate(v.created_at)}`, h("div", { class: "be-diff" },
        h("p", { class: "wp-help" }, changed ? "En rouge barré : présent dans la révision, absent aujourd'hui. En vert : ajouté depuis." : "Aucune différence de texte avec l'article actuel."),
        h("ol", { class: "be-diff-list" }, ...rows)), [
        { label: "Fermer" },
        { label: "Restaurer cette révision", danger: true, run: () => { restoreVersion(r); } },
      ], { wide: true });
    } catch (e) { toast(e.message, "error"); }
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
    setState("Modifications non enregistrées", "is-dirty");
    localDraft.write();
    scheduleAutosave();
    refreshLater();
  }
  const refreshLater = debounce(() => {
    refreshCounters(); refreshPreviews();
    if ((editorPrefs.settings || {}).seoAnalysis !== false || !$('[data-sidebar-panel="seo"]').hidden) refreshAnalysis();
    if ($('[data-panel="structure"]').classList.contains("is-open")) refreshStructure();
    if ($('[data-panel="checklist"]').classList.contains("is-open")) refreshPublication();
    if (secondaryMode === "media") refreshMedia();
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
  let autosaveTimer = null;
  const scheduleAutosave = () => {
    const st = editorPrefs.settings || {};
    if (st.autosave === false) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => autosave(), Math.max(2, Number(st.autosaveDelay) || 2) * 1000 + 500);
  };
  let autosaveRetry = null;
  async function autosave() {
    if (!dirty || saving) return;
    try {
      setState("Enregistrement automatique…", "is-saving");
      const id = await ensurePost();
      await api(`/formateur/blog/${id}/autosave`, { method: "POST", body: formPayload({ withFiles: false }) });
      setState("Sauvegarde automatique", "is-auto");
    } catch (e) {
      // Jamais masquée : l'erreur est affichée, la copie locale du navigateur est conservée, nouvel essai dans 30 s
      setState("Erreur de sauvegarde automatique (nouvel essai dans 30 s)", "is-error");
      saveState.title = e.message || "";
      clearTimeout(autosaveRetry);
      autosaveRetry = setTimeout(() => autosave(), 30000);
    }
  }
  async function save({ status } = {}) {
    if (saving) return false;
    if (status) { statusSelect.value = status; syncStatus(); }
    if (!field("title").value.trim()) { toast("Ajoutez un titre avant d'enregistrer.", "error"); titleField.focus(); return false; }
    if (!(await commitAllReusableEdits())) return false;
    saving = true;
    setState("Enregistrement…", "is-saving");
    try {
      const url = postId ? `/formateur/blog/${postId}/modifier` : "/formateur/blog/nouveau";
      const r = await api(url, { method: "POST", body: formPayload({ withFiles: true }), headers: { "x-blog-editor": "1" } });
      if (!postId) adopt({ id: r.id });
      dirty = false;
      localDraft.clear();
      DATA.status = r.status;
      seoSiteLoaded = false;
      if (seoData) { seoData.invalidate(); seoData.emit("saved", { status: r.status }); }
      if (!$('[data-sidebar-panel="seo"]').hidden) loadSeoSite();
      DATA.publishedAt = r.publishedAt ?? DATA.publishedAt;
      DATA.updatedAt = r.updatedAt;
      DATA.createdAt = DATA.createdAt || r.updatedAt;
      if (r.revisions) DATA.revisions = r.revisions;
      for (const [key, col] of [["cover", "coverPath"], ["og", "ogImagePath"], ["twitter", "twitterImagePath"]]) if (r[col] !== undefined) imagePicks[key].saved(r[col]);
      if (r.slug) { field("slug").value = r.slug; if (r.publishedAt) $("[data-slug-hint]").textContent = "Article en ligne : si vous changez le lien, l'ancienne adresse redirigera vers la nouvelle."; }
      field("remove_cover").value = ""; field("remove_og_image").value = ""; field("remove_twitter_image").value = "";
      setState("Enregistré", "is-saved");
      syncStatus();
      refreshPublication();
      refreshPreviews();
      return true;
    } catch (e) {
      setState("Erreur d'enregistrement : rien n'est perdu, réessayez", "is-error");
      saveState.title = e.message || "";
      toast(`Enregistrement impossible : ${e.message}`, "error");
      return false;
    } finally { saving = false; }
  }
  // Bouton secondaire (visible seulement avant la mise en ligne)
  form.addEventListener("submit", (e) => { e.preventDefault(); const st = secondaryStatus(); save({ status: st }).then((ok) => ok && toast(st === "draft" ? "Brouillon enregistré." : `Enregistré : ${DATA.statuses[st]}.`)); });
  // Cmd+S : enregistre sans jamais publier ni dépublier par surprise (article en ligne : il reste en ligne)
  const quickSave = () => save({ status: ONLINE.has(DATA.status) ? DATA.status : secondaryStatus() }).then((ok) => ok && toast("Enregistré."));
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); quickSave(); }
    // Cmd+K hors de l'éditeur (après un clic sur un bouton…) : lien sur la sélection de l'article
    if (mod && !e.shiftKey && e.key.toLowerCase() === "k" && !editor.view.hasFocus() && !e.target.closest("input, textarea, select, .wp-popover")) {
      e.preventDefault();
      if (!editor.state.selection.empty && wsUi) { editor.view.focus(); linkPopover(null); } else if (wsUi) wsUi.openPalette(); else { editor.view.focus(); linkPopover(null); }
    }
    if (mod && e.shiftKey && e.key.toLowerCase() === "f" && !e.target.closest(".wsp-palette")) { e.preventDefault(); openFind(); }
    if (e.key === "Escape") closePopovers();
  });
  window.addEventListener("beforeunload", (e) => { if (dirty) { localDraft.write(); e.preventDefault(); e.returnValue = ""; } });
  form.addEventListener("input", (e) => { if (e.target !== codeEditor && !e.target.closest(".wp-modal")) changed(); });
  form.addEventListener("change", (e) => { if (e.target.type === "checkbox" || e.target.tagName === "SELECT") changed(); });
  codeEditor.addEventListener("input", () => changed());
  let lastTypingSignal = 0;
  editor.on("update", () => { changed(); refreshSlash(); if (seoData && Date.now() - lastTypingSignal > 1000) { lastTypingSignal = Date.now(); seoData.emit("typing", {}); } });
  const refreshUi = () => { renderBlockToolbar(); refreshAppender(); renderInspector(); };
  editor.on("selectionUpdate", () => { refreshUi(); refreshSlash(); });
  let uiFrame = 0;
  editor.on("transaction", () => { cancelAnimationFrame(uiFrame); uiFrame = requestAnimationFrame(refreshUi); });
  function setTyping(on) {
    if (root.classList.contains("is-typing") === on) return;
    root.classList.toggle("is-typing", on);
    if (on) { blockToolbar.hidden = true; between.hidden = true; } else renderBlockToolbar();
  }
  let lastMouse = null;
  document.addEventListener("mousemove", (e) => {
    if (lastMouse && Math.abs(e.clientX - lastMouse[0]) + Math.abs(e.clientY - lastMouse[1]) < 4) return;
    lastMouse = [e.clientX, e.clientY];
    setTyping(false);
  }, { passive: true });
  document.addEventListener("mousedown", () => setTyping(false), true);
  editor.on("focus", () => { refreshUi(); requestAnimationFrame(refreshUi); });
  // Sortie de l'éditeur : barre masquée, sauf si le focus est revenu entre-temps (annuler, menu…) ou s'il est dans la barre
  editor.on("blur", () => setTimeout(() => {
    const el = document.activeElement;
    if (editor.isFocused || editor.state.selection instanceof NodeSelection || (el && el.closest(".wp-block-toolbar, .wp-popover, .wp-top-toolbar"))) return;
    blockToolbar.hidden = true;
    appender.hidden = true;
  }, 150));
  window.addEventListener("resize", debounce(refreshUi, 100));
  $(".wp-canvas").addEventListener("scroll", () => requestAnimationFrame(() => { renderBlockToolbar(); refreshAppender(); }), { passive: true });

  // ---------- Publication (panneau « Prêt à publier ? ») ----------
  const publishBtn = $("[data-publish]");
  publishBtn.addEventListener("click", async () => {
    refreshAnalysis();
    const action = primaryAction();
    if (action.run === "prepublish") return openPrePublish();
    const want = statusSelect.value;
    if (DATA.status === "published" && want !== "published" && !confirm(`L'article sera retiré du site (statut : ${DATA.statuses[want]}). Continuer ?`)) return;
    const ok = await save({ status: want });
    if (ok) toast(want === "published" ? "Article mis à jour." : want === DATA.status ? `Enregistré (${DATA.statuses[want]}).` : `Enregistré : ${DATA.statuses[want]}.`);
  });
  function openPrePublish() {
    const items = checklist();
    const blocking = items.filter((c) => c.blocking && !c.ok);
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
        h("div", { class: "wp-panel is-open", "data-seo-guard": "" }, h("h2", { class: "wp-panel-title is-static" }, "Contrôle SEO avant publication"), h("div", { class: "wp-panel-body" }, h("p", { class: "wp-help" }, "Vérification par le serveur…")))));
    // Contrôle SEO fait par le serveur : Critique / Avertissements / Recommandations / Réussi
    (async () => {
      const box = panelEl.querySelector("[data-seo-guard] .wp-panel-body");
      try {
        const data = formPayload({ withFiles: false });
        if (postId) data.append("post_id", postId);
        const r = await api("/formateur/blog/api/seo-check", { method: "POST", body: data });
        const group = (title, list, cls) => (list.length ? h("div", { class: `wp-guard-group ${cls}` }, h("p", { class: "wp-label" }, `${title} (${list.length})`), h("ul", {}, ...list.map((t) => h("li", {}, t)))) : null);
        box.replaceChildren(...[
          group("Critique", r.critical, "is-critical"), group("Avertissements", r.warnings, "is-warning"), group("Recommandations", r.recommendations, "is-reco"), group("Réussi", r.passed, "is-passed"),
          r.blocking ? h("p", { class: "wp-notice-inline is-error" }, "Publication bloquée : corrigez les erreurs critiques (réglage « Bloquer en cas d'erreur critique » dans Mon espace → SEO → Réglages).") : null,
        ].filter(Boolean));
        const btn = panelEl.querySelector("[data-confirm-publish]");
        if (btn && r.blocking) btn.disabled = true;
      } catch (e) { box.replaceChildren(h("p", { class: "wp-error" }, `Contrôle SEO indisponible : ${e.message}`)); }
    })();
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
    optionsMenu.hidden = true;
    const kind = b.dataset.preview;
    if (kind === "google") return revealPanel("google");
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
    if (opt === "appearance") return openAppearance();
    if (opt === "settings") return openEditorSettings();
    if (opt === "shortcuts") return modal("Raccourcis clavier", h("dl", { class: "wp-shortcuts" }, ...[["Ctrl + S", "Enregistrer"], ["Ctrl + Z / Ctrl + Maj + Z", "Annuler / Rétablir"], ["/", "Choisir un bloc (au début d'un paragraphe vide)"], ["Ctrl + B / I / U", "Gras / italique / souligné"], ["Ctrl + K", "Avec du texte sélectionné : lien ; sinon : palette de commandes"], ["Ctrl + Maj + K", "Palette de commandes"], ["Ctrl + Maj + F", "Rechercher et remplacer dans l'article"], ["Clic droit sur un bloc", "Menu du bloc (copier, couper, coller, verrouiller…) ; Maj + clic droit : menu du navigateur"], ["Ctrl + Maj + D", "Dupliquer le bloc"], ["Maj + Alt + Z", "Supprimer le bloc"], ["Alt + ↑ / ↓", "Déplacer le bloc"], ["Tab / Maj + Tab", "Imbriquer / désimbriquer un élément de liste"], ["Ctrl + Maj + P", "Aperçu dans l'appareil par défaut"], ["Échap", "Fermer un menu"]].flatMap(([k, d]) => [h("dt", {}, h("kbd", {}, k)), h("dd", {}, d)])));
    const on = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", String(on));
    if (opt === "focus") root.classList.toggle("is-focus-mode", on);
    if (opt === "toptoolbar") { topToolbarMode = on; topToolbar.hidden = !on; blockToolbar.hidden = true; root.classList.toggle("has-top-toolbar", on); renderBlockToolbar(); }
    return null;
  }));
  // ---------- Réglages de l'éditeur (enregistrés sur le compte, appliqués immédiatement) ----------
  function applyEditorSettings() {
    const st = editorPrefs.settings || {};
    root.dataset.edWidth = st.width || "normal";
    root.dataset.edDensity = st.density || "comfortable";
    $("[data-stats]").hidden = st.counters === false;
    editor.view.dom.spellcheck = st.spellcheck !== false;
    titleField.spellcheck = st.spellcheck !== false;
    const ai = $('[data-rail="ai"]');
    if (ai) ai.hidden = st.aiAssistant === false;
    if (st.aiAssistant === false && secondaryMode === "ai") setSecondary("ai");
    const tt = $('[data-option="toptoolbar"]');
    if (tt && (tt.getAttribute("aria-checked") === "true") !== Boolean(st.topToolbar)) { tt.setAttribute("aria-checked", String(Boolean(st.topToolbar))); topToolbarMode = Boolean(st.topToolbar); topToolbar.hidden = !topToolbarMode; blockToolbar.hidden = true; root.classList.toggle("has-top-toolbar", topToolbarMode); renderBlockToolbar(); }
    $$("[data-preview]").forEach((b) => b.classList.toggle("is-default", b.dataset.preview === (st.previewDevice || "desktop")));
    if (st.autosave === false) clearTimeout(autosaveTimer);
  }
  async function saveEditorSettings(patch) {
    editorPrefs = { ...editorPrefs, settings: { ...editorPrefs.settings, ...patch } };
    applyEditorSettings();
    try { editorPrefs = (await api("/formateur/blog/api/preferences", { method: "PUT", json: { settings: editorPrefs.settings } })).prefs; applyEditorSettings(); }
    catch (e) { toast(`Réglage non enregistré : ${e.message}`, "error"); }
  }
  function openEditorSettings() {
    const st = { ...editorPrefs.settings };
    const sec = (title, ...kids) => h("section", { class: "wp-settings-section" }, h("h2", {}, title), ...kids);
    const tog = (label, key, help) => { const cb = h("input", { type: "checkbox", id: `wp-set-${key}`, checked: st[key] !== false }); cb.addEventListener("change", () => saveEditorSettings({ [key]: cb.checked })); return h("div", {}, h("label", { class: "wp-checkbox", for: cb.id }, cb, ` ${label}`), help ? h("p", { class: "wp-help" }, help) : null); };
    const pick = (label, key, options) => { const s2 = select(options, st[key]); s2.addEventListener("change", () => saveEditorSettings({ [key]: s2.value })); return control(label, s2); };
    const hidden = new Set(st.hiddenBlocks || []);
    const blocksList = h("div", { class: "wp-settings-blocks" }, ...BLOCKS.map((b) => { const cb = h("input", { type: "checkbox", id: `wp-blk-${b.id}`, checked: !hidden.has(b.id) }); cb.addEventListener("change", () => { if (cb.checked) hidden.delete(b.id); else hidden.add(b.id); saveEditorSettings({ hiddenBlocks: [...hidden] }); }); return h("label", { class: "wp-checkbox", for: cb.id }, cb, ` ${b.title}`, h("small", {}, ` · ${b.cat}`)); }));
    const fav = (editorPrefs.favorites || []).map((id) => (BLOCKS.find((b) => b.id === id) || {}).title).filter(Boolean);
    modal("Réglages de l'éditeur", h("div", { class: "wp-settings" },
      sec("Interface", pick("Largeur de la zone d'écriture", "width", [["normal", "Normale"], ["wide", "Large"], ["full", "Toute la largeur"]]), pick("Densité", "density", [["comfortable", "Confortable"], ["compact", "Compacte"]]),
        tog("Barre d'outils fixe en haut", "topToolbar"), tog("Compteurs de mots dans la barre du haut", "counters")),
      sec("Écriture", tog("Sauvegarde automatique", "autosave", "Désactivée : seul « Enregistrer » sauvegarde (une copie reste dans ce navigateur)."), pick("Délai avant la sauvegarde automatique", "autosaveDelay", [["2", "2 secondes"], ["5", "5 secondes"], ["10", "10 secondes"], ["30", "30 secondes"]]), tog("Correcteur orthographique du navigateur", "spellcheck")),
      sec("Blocs", h("p", { class: "wp-help" }, "Blocs proposés dans l'inséreur, le menu « / » et la palette. Les favoris se choisissent avec l'étoile dans l'inséreur."), h("p", { class: "wp-help" }, `Favoris : ${fav.length ? fav.join(", ") : "aucun"}.`), blocksList),
      sec("Médias", tog("Créer les versions réduites WebP des images envoyées (affichage rapide sur mobile)", "imageVariants"), h("p", { class: "wp-help" }, "Chargement différé des images : toujours actif sur la page publique.")),
      sec("SEO", tog("Analyse SEO en direct pendant la frappe", "seoAnalysis", "Désactivée : l'analyse se met à jour à l'ouverture de l'onglet SEO et à l'enregistrement.")),
      sec("IA", tog("Afficher l'assistant IA", "aiAssistant", DATA.aiConfigured ? "L'IA propose, vous décidez : rien ne change sans votre accord." : "Assistant non activé sur le serveur (clé ANTHROPIC_API_KEY absente).")),
      sec("Aperçu", pick("Appareil par défaut (Ctrl + Maj + P)", "previewDevice", [["desktop", "Ordinateur"], ["tablet", "Tablette"], ["mobile", "Mobile"]])),
      sec("Raccourcis", h("button", { type: "button", class: "wp-btn-secondary", onclick: () => $('[data-option="shortcuts"]').click() }, "Voir les raccourcis clavier"), h("p", { class: "wp-help" }, "Les raccourcis suivent les conventions de Gutenberg ; ils ne sont pas personnalisables."))),
    [{ label: "Fermer" }], { wide: true });
  }
  // Aperçu dans l'appareil par défaut
  document.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") { e.preventDefault(); $(`[data-preview="${(editorPrefs.settings || {}).previewDevice || "desktop"}"]`)?.click(); } });

  // Apparence des barres latérales (choix personnel enregistré sur le compte) : 6 couleurs ou une couleur au choix
  function applyTheme(t) {
    if (t.key === "clair") { delete root.dataset.edTheme; delete root.dataset.edContrast; root.style.removeProperty("--ed-sidebar"); }
    else { root.dataset.edTheme = t.key; root.dataset.edContrast = t.contrast; root.style.setProperty("--ed-sidebar", t.color); }
    DATA.editorTheme = t;
  }
  function openAppearance() {
    const current = DATA.editorTheme || { key: "clair", color: "#ffffff" };
    let choice = { ...current };
    const custom = h("input", { type: "color", id: `wp-f${++uid}`, value: current.key === "perso" ? current.color : "#3b5b7a", "aria-label": "Couleur personnalisée" });
    const list = h("div", { class: "wp-theme-list", role: "radiogroup", "aria-label": "Apparence" });
    const preview = (t) => { choice = t; list.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.key === t.key))); applyTheme(t); };
    for (const t of DATA.editorThemes) {
      const isCustom = t.key === "perso";
      list.append(h("button", { type: "button", role: "radio", class: "wp-theme-option", "data-key": t.key, "aria-checked": String(t.key === current.key), onclick: () => preview(isCustom ? { key: "perso", color: custom.value, contrast: contrastOf(custom.value) } : { key: t.key, color: t.color, contrast: contrastOf(t.color) }) },
        h("span", { class: "wp-theme-swatch", style: `background:${isCustom ? custom.value : t.color}`, "aria-hidden": "true" }), h("span", {}, t.label)));
    }
    custom.addEventListener("input", () => { list.querySelector('[data-key="perso"] .wp-theme-swatch').style.background = custom.value; preview({ key: "perso", color: custom.value, contrast: contrastOf(custom.value) }); });
    let saved = false;
    const m = modal("Apparence des barres latérales", h("div", { class: "wp-appearance" },
      h("p", { class: "wp-help" }, "Couleur du rail d'outils, du panneau gauche et de la barre latérale. Le texte s'adapte pour rester lisible. Ce choix vous est propre et ne change rien au site public."),
      list, control("Couleur personnalisée", custom, "Choisissez n'importe quelle couleur, puis « Couleur personnalisée » ci-dessus.")),
    [{ label: "Annuler", run: () => applyTheme(current) }, { label: "Enregistrer", primary: true, run: async () => {
      try { const r = await api("/formateur/blog/api/apparence", { method: "POST", json: { theme: choice.key, color: choice.key === "perso" ? choice.color : null } }); saved = true; applyTheme(r); toast("Apparence enregistrée."); }
      catch (e) { applyTheme(current); toast(e.message, "error"); }
    } }]);
    // Fermée sans enregistrer (×, Échap, Annuler) : l'apparence d'origine revient
    m.dlg.addEventListener("close", () => { if (!saved) applyTheme(current); });
  }
  // Texte clair ou foncé selon la couleur de fond (contraste WCAG)
  function contrastOf(hex) {
    const lum = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
    return 1.05 / (lum + 0.05) > (lum + 0.05) / 0.05 ? "light" : "dark";
  }
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

  // ---------- Rechercher / remplacer dans l'article ----------
  let findBar = null;
  function openFind() {
    if (findBar) { findBar.querySelector("input").focus(); findBar.querySelector("input").select(); return; }
    const q = h("input", { type: "text", class: "wp-find-input", placeholder: "Rechercher dans l'article", "aria-label": "Rechercher dans l'article" });
    const r = h("input", { type: "text", class: "wp-find-input", placeholder: "Remplacer par", "aria-label": "Remplacer par" });
    const cs = h("input", { type: "checkbox", id: "wp-find-case" });
    const count = h("span", { class: "wp-find-count", role: "status", "aria-live": "polite" }, "");
    let matches = [];
    let index = -1;
    const publish = () => editor.view.dispatch(editor.state.tr.setMeta(findKey, { matches, index }));
    const lockedAt = (pos) => { const $p = editor.state.doc.resolve(pos); return $p.depth > 0 && isLocked($p.node(1)); };
    const search = (keepIndex) => {
      matches = findMatches(editor.state.doc, q.value, { caseSensitive: cs.checked });
      index = matches.length ? Math.min(keepIndex ? Math.max(index, 0) : 0, matches.length - 1) : -1;
      count.textContent = q.value ? (matches.length ? `${index + 1} / ${matches.length}` : "Aucun résultat") : "";
      publish();
      if (index >= 0) { const m = matches[index]; editor.commands.setTextSelection({ from: m.from, to: m.to }); editor.commands.scrollIntoView(); }
    };
    const go = (d) => { if (!matches.length) return; index = (index + d + matches.length) % matches.length; count.textContent = `${index + 1} / ${matches.length}`; publish(); const m = matches[index]; editor.commands.setTextSelection({ from: m.from, to: m.to }); editor.commands.scrollIntoView(); };
    const replaceOne = () => {
      if (index < 0) return;
      const m = matches[index];
      if (lockedAt(m.from)) { lockedNotice(); go(1); return; }
      editor.view.dispatch(editor.state.tr.insertText(r.value, m.from, m.to));
      search(true);
    };
    const replaceAll = () => {
      const all = findMatches(editor.state.doc, q.value, { caseSensitive: cs.checked });
      const ok = all.filter((m) => !lockedAt(m.from));
      if (!ok.length) { toast(all.length ? "Toutes les occurrences sont dans des blocs verrouillés." : "Aucun résultat.", all.length ? "error" : "ok"); return; }
      const tr = editor.state.tr;
      for (const m of [...ok].reverse()) tr.insertText(r.value, m.from, m.to);
      editor.view.dispatch(tr);
      toast(`${ok.length} remplacement${ok.length > 1 ? "s" : ""}${all.length > ok.length ? ` (${all.length - ok.length} ignoré${all.length - ok.length > 1 ? "s" : ""} : bloc verrouillé)` : ""}.`);
      search(false);
    };
    const close = () => { matches = []; index = -1; publish(); findBar.remove(); findBar = null; editor.commands.focus(); };
    q.addEventListener("input", () => search(false));
    cs.addEventListener("change", () => search(false));
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(e.shiftKey ? -1 : 1); } if (e.key === "Escape") { e.preventDefault(); close(); } });
    r.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); replaceOne(); } if (e.key === "Escape") { e.preventDefault(); close(); } });
    findBar = h("div", { class: "wp-findbar", role: "search", "aria-label": "Rechercher et remplacer" },
      h("div", { class: "wp-find-row" }, q, count,
        h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Résultat précédent", title: "Précédent (Maj+Entrée)", onclick: () => go(-1) }, "↑"),
        h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Résultat suivant", title: "Suivant (Entrée)", onclick: () => go(1) }, "↓"),
        h("button", { type: "button", class: "wp-btn-icon", "aria-label": "Fermer la recherche", title: "Fermer (Échap)", onclick: close }, "×")),
      h("div", { class: "wp-find-row" }, r,
        h("button", { type: "button", class: "wp-btn-secondary", onclick: replaceOne }, "Remplacer"),
        h("button", { type: "button", class: "wp-btn-secondary", onclick: replaceAll }, "Tout remplacer")),
      h("label", { class: "wp-checkbox wp-find-case", for: "wp-find-case" }, cs, " Respecter les majuscules"));
    findBar.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } });
    $("[data-canvas]").prepend(findBar);
    editor.on("update", () => { if (findBar && q.value) search(true); });
    const sel = editor.state.selection;
    if (!sel.empty && sel.to - sel.from < 80) q.value = editor.state.doc.textBetween(sel.from, sel.to, " ");
    q.focus();
    if (q.value) search(false);
  }

  // ---------- Compteurs de l'article (calculés sur le contenu réel) ----------
  function showCounters(anchor) {
    const r = lastAnalysis;
    if (!r) return;
    const s = r.stats;
    const row = (k, v) => [h("dt", {}, k), h("dd", {}, v)];
    popover(anchor, h("div", { class: "wp-counters" }, h("p", { class: "wp-menu-label" }, "Compteurs de l'article"), h("dl", {},
      ...row("Mots", String(r.words)), ...row("Caractères", `${s.characters} (${s.charactersNoSpaces} sans espaces)`), ...row("Paragraphes", String(s.paragraphs)),
      ...row("Titres", `H2 : ${s.headings.h2} · H3 : ${s.headings.h3} · H4 : ${s.headings.h4}`), ...row("Images", String(s.images.total)),
      ...row("Liens", `${s.internalLinks.length} internes · ${s.externalLinks.length} externes`), ...row("Listes", String(s.lists)), ...row("Temps de lecture", `${r.minutes} min (230 mots/min)`))));
  }
  $("[data-stats]").addEventListener("click", (e) => { e.stopPropagation(); showCounters(e.currentTarget); });
  $("[data-stats]").setAttribute("title", "Voir les compteurs de l'article");
  editor.view.dom.addEventListener("contextmenu", contextMenuAt);

  // ---------- Espace de travail SEO ----------
  seoData = createSeoData({ api, postId: () => postId });
  try {
    workspace = createWorkspace({
      root, api, initial: DATA.seoWorkspace,
      openPanel, isPanelOpen: (key) => $(`[data-panel="${key}"]`).classList.contains("is-open"),
      showSeoTab: () => showSidebarTab("seo"), isSidebarOpen: () => !sidebar.hidden,
      openSidebar: () => $(".wp-header [data-toggle-sidebar]").click(),
      onVisibilityChange: () => afterVisibility(),
      confirmDialog: (text) => Promise.resolve(window.confirm(text)), toast,
    });
    seoRenderers = createRenderers({ h, data: seoData, api, postId: () => postId, isVisible: (k) => workspace.isVisible(k), reveal: (k) => workspace.reveal(k), fmtDate });
    wsUi = setupWorkspaceUi({
      h, modal, control, input, toast, api, ws: workspace, data: seoData, renderers: seoRenderers, DATA, postId: () => postId,
      actions: () => [
        ...BLOCKS.filter((b) => !((editorPrefs.settings && editorPrefs.settings.hiddenBlocks) || []).includes(b.id)).map((b) => ({ id: `insert:${b.id}`, group: "Insérer", label: `Ajouter : ${b.title}`, run: () => { editor.commands.focus(); useBlock(b.id); b.run(); } })),
        ...reusableList.map((b) => ({ id: `reusable:${b.id}`, group: "Réutilisables", label: `Insérer le bloc réutilisable : ${b.name}${b.synced ? " (synchronisé)" : ""}`, run: () => { editor.commands.focus(); insertReusable(b); } })),
        { id: "ed:reusable", group: "Réutilisables", label: "Gérer les blocs réutilisables…", run: () => manageReusable() },
        { id: "ed:save", group: "Article", label: "Enregistrer", run: () => save() },
        { id: "ed:publish", group: "Article", label: $("[data-publish]").textContent.trim(), run: () => $("[data-publish]").click() },
        { id: "ed:preview-desktop", group: "Aperçu", label: "Aperçu ordinateur", run: () => $('[data-preview="desktop"]').click() },
        { id: "ed:preview-tablet", group: "Aperçu", label: "Aperçu tablette", run: () => $('[data-preview="tablet"]').click() },
        { id: "ed:preview-mobile", group: "Aperçu", label: "Aperçu mobile", run: () => $('[data-preview="mobile"]').click() },
        { id: "ed:preview-tab", group: "Aperçu", label: "Prévisualiser dans un nouvel onglet", run: () => $('[data-preview="tab"]').click() },
        { id: "ed:find", group: "Article", label: "Rechercher et remplacer dans l'article", run: () => openFind() },
        { id: "ed:stats", group: "Article", label: "Compteurs de l'article (mots, caractères, titres…)", run: () => showCounters($("[data-stats]")) },
        { id: "ed:tab-article", group: "Panneaux", label: "Ouvrir les réglages de l'article (document)", run: () => { if (sidebar.hidden) $(".wp-header [data-toggle-sidebar]").click(); showSidebarTab("article"); } },
        { id: "ed:tab-seo", group: "Panneaux", label: "Ouvrir le SEO", run: () => revealSeo() },
        { id: "ed:tab-bloc", group: "Panneaux", label: "Ouvrir les réglages du bloc", run: () => { if (sidebar.hidden) $(".wp-header [data-toggle-sidebar]").click(); showSidebarTab("bloc"); } },
        { id: "ed:undo", group: "Édition", label: "Annuler", run: () => editor.chain().focus().undo().run() },
        { id: "ed:redo", group: "Édition", label: "Rétablir", run: () => editor.chain().focus().redo().run() },
        { id: "ed:code", group: "Édition", label: root.classList.contains("is-code-mode") ? "Éditeur visuel" : "Éditeur de code (HTML)", run: () => $(root.classList.contains("is-code-mode") ? '[data-mode="visual"]' : '[data-mode="code"]').click() },
        { id: "ed:settings", group: "Réglages", label: "Réglages de l'éditeur…", run: () => openEditorSettings() },
        { id: "ed:shortcuts", group: "Aide", label: "Raccourcis clavier", run: () => $('[data-option="shortcuts"]').click() },
        { id: "act:analyse", label: "Analyser la page en ligne", run: () => { workspace.reveal("seo-site"); $("[data-seo-analyse]")?.click(); }, disabled: !DATA.everPublished && DATA.status !== "published" },
        { id: "act:links", label: "Proposer des liens internes", run: () => { workspace.reveal("links"); $("[data-suggest]")?.click(); } },
        { id: "act:refresh", label: "Actualiser les données SEO (serveur)", run: () => { seoData.invalidate(); toast("Données SEO actualisées."); } },
        { id: "act:google", label: "Aperçu dans Google", run: () => workspace.reveal("google") },
        { id: "act:space", label: "Ouvrir l'espace SEO du site", run: () => window.open("/formateur/seo", "_blank", "noopener") },
      ],
    });
  } catch (e) {
    // L'espace de travail ne doit jamais empêcher d'écrire : en cas de problème, les panneaux restent dans la barre latérale
    console.error("[KOLAKISA] Espace de travail SEO indisponible :", e);
    workspace = null;
  }
  $("[data-seo-analyse]")?.addEventListener("click", () => seoData.emit("action", { type: "analyse-online" }));

  // ---------- Premier affichage ----------
  loadReusable();
  applyEditorSettings();
  refreshCounters();
  refreshPreviews();
  refreshAnalysis();
  afterVisibility();
  refreshPublication();
  setState(DATA.postId ? "Enregistré" : "", DATA.postId ? "is-saved" : "");
  if (!DATA.aiConfigured) $$("[data-ai]").forEach((x) => { x.disabled = true; });
  if (!titleField.value) titleField.focus();
  // Petit écran : la barre latérale démarre fermée (comme Gutenberg)
  if (window.matchMedia("(max-width: 782px)").matches) { sidebar.hidden = true; root.classList.add("is-sidebar-closed"); $(".wp-header [data-toggle-sidebar]").setAttribute("aria-pressed", "false"); }
}

// Démarrage une fois tout le module défini (les icônes ci-dessus doivent exister)
if (root) start();
