// Éditeur de texte riche des formations (Tiptap, sans framework).
// Source de public/js/course-editor.js — reconstruire avec : npm run build:editor
//
// Chaque <div data-rich-editor="nom"> du formulaire contient un <textarea> (repli sans JavaScript) et un <template>
// avec le contenu de départ (HTML déjà assaini par le serveur). Ici, on remplace le <textarea> par l'éditeur ;
// à l'envoi du formulaire, le HTML produit repart dans le <textarea> + un indicateur rich_text=1.
// Le serveur assainit de toute façon tout ce qu'il reçoit : ce code n'est jamais la seule protection.
import { Editor, Extension, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";

// ---------- Retrait (augmenter / réduire) ----------
// Dans une liste : imbrique l'élément. Ailleurs : retrait du paragraphe ou du titre par paliers (0 à 6), écrit en data-indent.
const MAX_INDENT = 6;
const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element) => {
              const n = Number.parseInt(element.getAttribute("data-indent") || "0", 10);
              return Number.isInteger(n) && n > 0 && n <= MAX_INDENT ? n : 0;
            },
            renderHTML: (attributes) => (attributes.indent ? { "data-indent": String(attributes.indent) } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    const change = (delta) => ({ state, dispatch }) => {
      let tr = state.tr;
      let changed = false;
      state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
        if (node.type.name === "paragraph" || node.type.name === "heading") {
          const current = node.attrs.indent || 0;
          const next = Math.min(MAX_INDENT, Math.max(0, current + delta));
          if (next !== current) {
            tr = tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            changed = true;
          }
          return false;
        }
        return true;
      });
      if (changed && dispatch) dispatch(tr);
      return changed;
    };
    return {
      indentMore: () => ({ editor, commands }) => {
        if (editor.isActive("taskItem")) return commands.sinkListItem("taskItem");
        if (editor.isActive("listItem")) return commands.sinkListItem("listItem");
        return commands.command(change(1));
      },
      indentLess: () => ({ editor, commands }) => {
        if (editor.isActive("taskItem")) return commands.liftListItem("taskItem");
        if (editor.isActive("listItem")) return commands.liftListItem("listItem");
        return commands.command(change(-1));
      },
      indentReset: () => ({ commands }) => commands.command(change(-MAX_INDENT)),
    };
  },
  // Pas de raccourci Tab : la touche Tab reste réservée à la navigation au clavier de la page (accessibilité)
});

// Champs « liste » : le document est une seule liste à puces (Entrée = nouvel élément, un élément par ligne)
const ListDocument = Node.create({ name: "doc", topNode: true, content: "bulletList" });

// ---------- Icônes (traits, 24×24, même style que le reste du site) ----------
const ICONS = {
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>',
  bold: '<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>',
  italic: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
  underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/>',
  strike: '<path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" y1="12" x2="20" y2="12"/>',
  color: '<path d="M6 16 12 3l6 13"/><path d="M8.5 11h7"/>',
  highlight: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
  bullet: '<line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  ordered: '<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  task: '<rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 18h8"/>',
  alignLeft: '<line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/>',
  alignCenter: '<line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/>',
  alignRight: '<line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/>',
  alignJustify: '<line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/>',
  outdent: '<polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/>',
  indent: '<polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  unlink: '<path d="m18.84 12.25 1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="8" y1="2" x2="8" y2="5"/><line x1="2" y1="8" x2="5" y2="8"/><line x1="16" y1="19" x2="16" y2="22"/><line x1="19" y1="16" x2="22" y2="16"/>',
  rule: '<line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/>',
  clear: '<path d="M4 7V4h16v3"/><path d="M5 20h6"/><path d="M13 4 8 20"/><path d="m15 15 5 5"/><path d="m20 15-5 5"/>',
};
const svg = (name) => `<svg class="rt-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

// Couleurs proposées (texte : toutes lisibles sur fond blanc, contraste AA)
const TEXT_COLORS = [
  ["#10222f", "Noir bleuté"], ["#5d7182", "Gris"], ["#0277b6", "Bleu"], ["#1e7a34", "Vert"],
  ["#d1121f", "Rouge"], ["#9a5809", "Ambre"], ["#6d28d9", "Violet"], ["#0b2a40", "Bleu nuit"],
];
const HIGHLIGHT_COLORS = [
  ["#fff3a3", "Jaune"], ["#c8f0d2", "Vert"], ["#cfe9fb", "Bleu"], ["#ffd6d9", "Rose"], ["#e6ddff", "Violet"], ["#ffe1b8", "Orange"],
];
const FONTS = [["", "Police par défaut"], ["Arial, sans-serif", "Sans-serif"], ["Georgia, serif", "Serif"], ["monospace", "Monospace"]];
const SIZES = [["", "Taille normale"], ["0.875em", "Petit"], ["1.25em", "Grand"], ["1.5em", "Très grand"]];

// Raccourcis affichés dans les infobulles : ⌘ sur Mac, Ctrl ailleurs
const MOD = /Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘" : "Ctrl+";

// ---------- Petits utilitaires DOM ----------
function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value; // uniquement nos propres constantes (icônes)
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) node.append(child);
  return node;
}

// Adresse saisie → adresse enregistrable, ou null si elle n'est pas acceptée (http, https, mailto, adresse interne)
function normalizeUrl(input) {
  const value = input.trim();
  if (!value) return "";
  if (/^(https?:\/\/[^\s"'<>]+|mailto:[^\s"'<>]+)$/i.test(value)) return value;
  if (/^\/(?!\/)[^\s"'<>]*$/.test(value)) return value;
  if (/^[^\s@"'<>:]+@[^\s@"'<>:]+\.[^\s@"'<>:]{2,}$/.test(value)) return `mailto:${value}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // javascript:, data:, etc.
  if (/^[^\s"'<>]+\.[^\s"'<>]{2,}(\/[^\s"'<>]*)?$/.test(value)) return `https://${value}`;
  return null;
}

// ---------- Barre d'outils ----------
function buildToolbar(editor, wrapper, variant) {
  const toolbar = h("div", { class: "rt-toolbar", role: "toolbar", "aria-label": "Mise en forme du texte", "aria-orientation": "horizontal" });
  const popover = h("div", { class: "rt-popover", hidden: true });
  const status = h("p", { class: "sr-only", role: "status", "aria-live": "polite" });
  const refreshers = [];
  let lastFocusedButton = null;

  const run = (fn) => () => {
    fn(editor.chain().focus());
    closePopover(false);
  };

  function closePopover(returnFocus = true) {
    if (popover.hidden) return;
    popover.hidden = true;
    popover.replaceChildren();
    if (popover.owner) popover.owner.setAttribute("aria-expanded", "false");
    popover.owner = null;
    if (returnFocus) editor.commands.focus();
  }
  function openPopover(button, content) {
    if (!popover.hidden && popover.owner === button) return closePopover();
    closePopover(false);
    popover.replaceChildren(content);
    popover.hidden = false;
    popover.owner = button;
    button.setAttribute("aria-expanded", "true");
    const box = wrapper.getBoundingClientRect();
    const buttonBox = button.getBoundingClientRect();
    const width = Math.min(popover.offsetWidth, box.width);
    popover.style.top = `${toolbar.offsetHeight + 4}px`;
    popover.style.left = `${Math.max(0, Math.min(buttonBox.left - box.left, box.width - width))}px`;
    const first = popover.querySelector("input, button");
    if (first) first.focus();
  }

  function button({ name, label, shortcut, icon, text, active, enabled, onClick, popup }) {
    const btn = h("button", {
      type: "button", class: "rt-btn", "aria-label": label, title: shortcut ? `${label} (${MOD}${shortcut})` : label, "data-rt": name,
      "aria-pressed": active ? "false" : null, "aria-haspopup": popup ? "true" : null, "aria-expanded": popup ? "false" : null,
      tabindex: "-1", html: icon ? svg(icon) : null,
    });
    if (text) btn.textContent = text;
    // Garde la sélection du texte dans l'éditeur quand on clique sur un bouton
    btn.addEventListener("mousedown", (e) => e.preventDefault());
    btn.addEventListener("click", () => onClick(btn));
    btn.addEventListener("focus", () => (lastFocusedButton = btn));
    refreshers.push(() => {
      if (active) {
        const on = Boolean(active());
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", String(on));
      }
      if (enabled) btn.disabled = !enabled();
    });
    return btn;
  }

  function select({ name, label, options, current, apply }) {
    const sel = h("select", { class: "rt-select", "aria-label": label, title: label, "data-rt": name }, options.map(([value, text]) => h("option", { value }, text)));
    sel.addEventListener("change", () => {
      apply(sel.value);
      editor.commands.focus();
    });
    refreshers.push(() => {
      const value = current() || "";
      sel.value = options.some(([v]) => v === value) ? value : "";
    });
    return sel;
  }

  function swatchPopover({ title, colors, apply, reset, resetLabel }) {
    const grid = h("div", { class: "rt-swatches", role: "group", "aria-label": title });
    for (const [value, name] of colors) {
      const swatch = h("button", { type: "button", class: "rt-swatch", style: `background:${value}`, "aria-label": name, title: name });
      swatch.addEventListener("click", () => {
        apply(value);
        closePopover();
      });
      grid.append(swatch);
    }
    const resetBtn = h("button", { type: "button", class: "rt-popover-action" }, resetLabel);
    resetBtn.addEventListener("click", () => {
      reset();
      closePopover();
    });
    return h("div", {}, [h("p", { class: "rt-popover-title" }, title), grid, resetBtn]);
  }

  function linkPopover() {
    const current = editor.getAttributes("link").href || "";
    const input = h("input", { type: "text", class: "rt-input", id: `rt-link-${Math.random().toString(36).slice(2, 8)}`, value: current, placeholder: "https://exemple.fr", autocomplete: "off", inputmode: "url", "aria-label": "Adresse du lien" });
    const error = h("p", { class: "rt-popover-error", role: "alert" });
    const apply = () => {
      const url = normalizeUrl(input.value);
      if (url === null) {
        error.textContent = "Adresse non valide. Utilisez https://…, mailto:… ou une adresse du site.";
        input.focus();
        return;
      }
      const chain = editor.chain().focus().extendMarkRange("link");
      if (!url) chain.unsetLink().run();
      else if (editor.state.selection.empty && !editor.isActive("link")) {
        chain.insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] }).run();
      } else chain.setLink({ href: url }).run();
      status.textContent = url ? "Lien appliqué." : "Lien retiré.";
      closePopover(false);
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        apply();
      }
    });
    const ok = h("button", { type: "button", class: "btn btn-primary btn-sm" }, current ? "Modifier" : "Appliquer");
    ok.addEventListener("click", apply);
    const remove = h("button", { type: "button", class: "btn btn-outline btn-sm" }, "Retirer le lien");
    remove.addEventListener("click", () => {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      status.textContent = "Lien retiré.";
      closePopover(false);
    });
    const actions = h("div", { class: "rt-popover-actions" }, current ? [ok, remove] : [ok]);
    return h("div", {}, [h("label", { class: "rt-popover-title", for: input.id }, "Adresse du lien"), input, error, actions]);
  }

  const sep = () => h("span", { class: "rt-sep", role: "separator", "aria-orientation": "vertical" });
  const group = (...items) => h("div", { class: "rt-group", role: "group" }, items);
  const inlineGroup = () => [
    button({ name: "bold", label: "Gras", shortcut: "B", icon: "bold", active: () => editor.isActive("bold"), onClick: run((c) => c.toggleBold().run()) }),
    button({ name: "italic", label: "Italique", shortcut: "I", icon: "italic", active: () => editor.isActive("italic"), onClick: run((c) => c.toggleItalic().run()) }),
    button({ name: "underline", label: "Souligné", shortcut: "U", icon: "underline", active: () => editor.isActive("underline"), onClick: run((c) => c.toggleUnderline().run()) }),
    button({ name: "strike", label: "Barré", icon: "strike", active: () => editor.isActive("strike"), onClick: run((c) => c.toggleStrike().run()) }),
  ];
  const colorGroup = () => [
    button({
      name: "color", label: "Couleur du texte", icon: "color", popup: true,
      onClick: (btn) => openPopover(btn, swatchPopover({ title: "Couleur du texte", colors: TEXT_COLORS, apply: (v) => editor.chain().focus().setColor(v).run(), reset: () => editor.chain().focus().unsetColor().run(), resetLabel: "Couleur par défaut" })),
    }),
    button({
      name: "highlight", label: "Surlignage", icon: "highlight", popup: true, active: () => editor.isActive("highlight"),
      onClick: (btn) => openPopover(btn, swatchPopover({ title: "Surlignage", colors: HIGHLIGHT_COLORS, apply: (v) => editor.chain().focus().setHighlight({ color: v }).run(), reset: () => editor.chain().focus().unsetHighlight().run(), resetLabel: "Retirer le surlignage" })),
    }),
  ];
  const linkGroup = () => [
    button({ name: "link", label: "Insérer ou modifier un lien", icon: "link", popup: true, active: () => editor.isActive("link"), onClick: (btn) => openPopover(btn, linkPopover()) }),
    button({ name: "unlink", label: "Supprimer le lien", icon: "unlink", enabled: () => editor.isActive("link"), onClick: run((c) => c.extendMarkRange("link").unsetLink().run()) }),
  ];
  const historyGroup = () => [
    button({ name: "undo", label: "Annuler", shortcut: "Z", icon: "undo", enabled: () => editor.can().undo(), onClick: run((c) => c.undo().run()) }),
    button({ name: "redo", label: "Rétablir", shortcut: "Maj+Z", icon: "redo", enabled: () => editor.can().redo(), onClick: run((c) => c.redo().run()) }),
  ];
  const clearButton = () =>
    button({
      name: "clear", label: "Effacer la mise en forme", icon: "clear",
      // Retire gras, couleurs, liens… ; un titre redevient paragraphe ; alignement et retrait sont réinitialisés (les listes sont conservées)
      onClick: run((c) => {
        if (variant === "full") c.unsetAllMarks().setParagraph().unsetTextAlign().indentReset().run();
        else c.unsetAllMarks().run();
      }),
    });

  if (variant === "full") {
    toolbar.append(
      group(...historyGroup()), sep(),
      group(
        button({ name: "p", label: "Paragraphe normal", text: "¶", active: () => editor.isActive("paragraph") && !editor.isActive("listItem") && !editor.isActive("taskItem"), onClick: run((c) => c.setParagraph().run()) }),
        ...[1, 2, 3].map((level) => button({ name: `h${level}`, label: `Titre ${level}`, text: `H${level}`, active: () => editor.isActive("heading", { level }), onClick: run((c) => c.toggleHeading({ level }).run()) }))
      ),
      sep(),
      group(
        select({ name: "font", label: "Police", options: FONTS, current: () => editor.getAttributes("textStyle").fontFamily, apply: (v) => (v ? editor.chain().focus().setFontFamily(v).run() : editor.chain().focus().unsetFontFamily().run()) }),
        select({ name: "size", label: "Taille du texte", options: SIZES, current: () => editor.getAttributes("textStyle").fontSize, apply: (v) => (v ? editor.chain().focus().setFontSize(v).run() : editor.chain().focus().unsetFontSize().run()) })
      ),
      sep(), group(...inlineGroup()), sep(), group(...colorGroup()), sep(),
      group(
        button({ name: "bullet", label: "Liste à puces", icon: "bullet", active: () => editor.isActive("bulletList"), onClick: run((c) => c.toggleBulletList().run()) }),
        button({ name: "ordered", label: "Liste numérotée", icon: "ordered", active: () => editor.isActive("orderedList"), onClick: run((c) => c.toggleOrderedList().run()) }),
        button({ name: "task", label: "Liste avec cases à cocher", icon: "task", active: () => editor.isActive("taskList"), onClick: run((c) => c.toggleTaskList().run()) })
      ),
      sep(),
      group(
        ...[["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"], ["justify", "Justifier", "alignJustify"]].map(([value, label, icon]) =>
          button({
            name: `align-${value}`, label, icon,
            // « À gauche » est l'alignement par défaut : actif tant qu'aucun autre alignement n'est choisi
            active: () => (value === "left" ? !["center", "right", "justify"].some((v) => editor.isActive({ textAlign: v })) : editor.isActive({ textAlign: value })),
            onClick: run((c) => (value === "left" ? c.unsetTextAlign().run() : c.setTextAlign(value).run())),
          })
        ),
        button({ name: "outdent", label: "Réduire le retrait", icon: "outdent", onClick: run((c) => c.indentLess().run()) }),
        button({ name: "indent", label: "Augmenter le retrait", icon: "indent", onClick: run((c) => c.indentMore().run()) })
      ),
      sep(),
      group(...linkGroup(), button({ name: "rule", label: "Insérer une ligne horizontale", icon: "rule", onClick: run((c) => c.setHorizontalRule().run()) })),
      sep(), group(clearButton())
    );
  } else {
    toolbar.append(group(...historyGroup()), sep(), group(...inlineGroup()), sep(), group(...colorGroup()), sep(), group(...linkGroup()), sep(), group(clearButton()));
  }

  // Un seul bouton de la barre est dans l'ordre de tabulation ; les flèches passent de l'un à l'autre
  const buttons = () => [...toolbar.querySelectorAll(".rt-btn:not(:disabled)")];
  const setRoving = (target) => {
    toolbar.querySelectorAll(".rt-btn").forEach((b) => b.setAttribute("tabindex", b === target ? "0" : "-1"));
  };
  toolbar.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT") return;
    const list = buttons();
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    let next = null;
    if (e.key === "ArrowRight") next = list[(i + 1) % list.length];
    else if (e.key === "ArrowLeft") next = list[(i - 1 + list.length) % list.length];
    else if (e.key === "Home") next = list[0];
    else if (e.key === "End") next = list[list.length - 1];
    if (next) {
      e.preventDefault();
      setRoving(next);
      next.focus();
    }
  });
  toolbar.addEventListener("focusin", (e) => {
    if (e.target.classList.contains("rt-btn")) setRoving(e.target);
  });
  wrapper.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !popover.hidden) {
      e.preventDefault();
      e.stopPropagation();
      closePopover();
    }
  });
  document.addEventListener("mousedown", (e) => {
    if (!popover.hidden && !popover.contains(e.target) && !(popover.owner && popover.owner.contains(e.target))) closePopover(false);
  });

  // Le point d'entrée au clavier ne doit jamais être un bouton désactivé (« Annuler » l'est au départ) :
  // sinon la barre serait sautée par la touche Tab
  const ensureRoving = () => {
    const current = toolbar.querySelector('.rt-btn[tabindex="0"]');
    if (current && !current.disabled) return;
    setRoving(lastFocusedButton && !lastFocusedButton.disabled ? lastFocusedButton : toolbar.querySelector(".rt-btn:not(:disabled)"));
  };
  const refresh = () => {
    refreshers.forEach((fn) => fn());
    ensureRoving();
  };
  editor.on("transaction", refresh);
  editor.on("selectionUpdate", refresh);
  refresh();
  wrapper.append(toolbar, popover, status);
  return toolbar;
}

// ---------- Montage d'un éditeur ----------
function mount(host, form) {
  const name = host.dataset.richEditor;
  const variant = host.dataset.variant === "list" ? "list" : "full";
  const textarea = host.querySelector("textarea");
  const source = host.querySelector("template");
  if (!textarea) return null;

  const wrapper = h("div", { class: `rt-editor rt-${variant}` });
  const surface = h("div", { class: "rt-surface" });
  wrapper.append(surface);
  host.append(wrapper);

  const listExtensions = variant === "list";
  const extensions = [
    StarterKit.configure(
      listExtensions
        ? { document: false, heading: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false, orderedList: false, trailingNode: false, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }
        : { heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }
    ),
    TextStyleKit.configure({ backgroundColor: false, lineHeight: false }),
    Highlight.configure({ multicolor: true }),
    // Champs liste : le paragraphe vide est dans un élément de liste, donc un niveau plus bas
    Placeholder.configure({ placeholder: host.dataset.placeholder || "", includeChildren: listExtensions }),
  ];
  if (listExtensions) extensions.push(ListDocument);
  else extensions.push(TextAlign.configure({ types: ["heading", "paragraph"] }), TaskList, TaskItem.configure({ nested: true }), Indent);

  const label = form.querySelector(`label[for="${textarea.id}"]`);
  let content = source ? source.innerHTML.trim() : "";
  if (listExtensions && !content) content = "<ul><li><p></p></li></ul>";

  const editor = new Editor({
    element: surface,
    extensions,
    content,
    editorProps: {
      attributes: {
        class: "rt-content",
        role: "textbox",
        "aria-multiline": "true",
        ...(label ? { "aria-labelledby": label.id } : {}),
        lang: "fr",
        spellcheck: "true",
      },
    },
  });
  wrapper.insertBefore(buildToolbar(editor, wrapper, variant), surface);
  // Toolbar + popover sont ajoutés au wrapper : le popover doit passer après la barre
  textarea.hidden = true;
  textarea.removeAttribute("required");
  if (label) label.addEventListener("click", (e) => { e.preventDefault(); editor.commands.focus(); });

  return { name, textarea, editor };
}

function init() {
  const hosts = document.querySelectorAll("[data-rich-editor]");
  if (!hosts.length) return;
  const form = hosts[0].closest("form");
  const editors = [];
  hosts.forEach((host) => {
    try {
      const instance = mount(host, form);
      if (instance) editors.push(instance);
    } catch (error) {
      // Si un éditeur échoue, son <textarea> reste visible et utilisable (repli)
      console.error("[KOYEKOLA] Éditeur indisponible pour", host.dataset.richEditor, error);
      const textarea = host.querySelector("textarea");
      if (textarea) textarea.hidden = false;
    }
  });
  if (!editors.length) return;

  // Indicateur de format : le serveur sait que les champs contiennent du HTML
  let flag = form.querySelector('input[name="rich_text"]');
  if (!flag) {
    flag = h("input", { type: "hidden", name: "rich_text" });
    form.append(flag);
  }
  flag.value = "1";

  const htmlOf = ({ editor }) => (editor.isEmpty ? "" : editor.getHTML());
  const sync = () => editors.forEach((e) => (e.textarea.value = htmlOf(e)));

  // Avertit avant de quitter la page avec des modifications non enregistrées
  let dirty = false;
  let submitting = false;
  editors.forEach(({ editor }) => editor.on("update", () => (dirty = true)));
  form.addEventListener("input", () => (dirty = true));
  form.addEventListener("submit", () => {
    submitting = true;
    sync();
  });
  form.addEventListener("formdata", (event) => editors.forEach((e) => event.formData.set(e.textarea.name, htmlOf(e))));
  window.addEventListener("beforeunload", (event) => {
    if (dirty && !submitting) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  window.__koyekolaEditors = editors; // pour les tests dans le navigateur
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
