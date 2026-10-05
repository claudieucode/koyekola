// Mode « Document » de l'éditeur d'articles : une SECONDE INTERFACE autour du MÊME éditeur Tiptap (même document,
// même historique annuler/rétablir, même sauvegarde automatique, mêmes panneaux Article / SEO / Bloc). Aucune conversion :
// passer d'un mode à l'autre ne change pas une seule balise de l'article.
//
// Interface : ruban d'outils (style, police, taille, gras…, couleurs, alignement, listes, insertion), feuille centrée,
// bande contextuelle de hauteur fixe (image, tableau, lien, bloc KOLAKISA), mode plein écran. Le ruban se replie : les
// groupes les moins utilisés passent dans « Plus » quand la largeur manque (jamais de débordement horizontal).
// Toutes les commandes sont celles de l'éditeur existant (mêmes règles, mêmes valeurs acceptées par le serveur).
import { NodeSelection } from "@tiptap/pm/state";
import { icon } from "../../utils/icons";

// Polices : uniquement celles que le site charge réellement (style.css) ou des familles système. Le serveur n'accepte que
// ces valeurs exactes (src/utils/blogHtml.js) : rien d'autre ne survivrait à l'enregistrement.
export const DOC_FONTS = [
  ["", "Police du site"],
  ["Figtree, sans-serif", "Figtree"],
  ["Bricolage Grotesque, sans-serif", "Bricolage Grotesque"],
  ["Georgia, serif", "Georgia (serif)"],
  ["ui-monospace, Menlo, monospace", "Monospace"],
];
// Tailles : les 4 valeurs acceptées par le serveur (même menu que « Plus » du mode blocs)
const SIZES = [["0.875em", "Petit"], ["", "Normal"], ["1.25em", "Grand"], ["1.5em", "Très grand"]];
const COLORS = [["#0b2a40", "Bleu nuit"], ["#3858e9", "Bleu"], ["#1e7a34", "Vert"], ["#b45309", "Orange"], ["#cc1818", "Rouge"], ["#6b21a8", "Violet"], ["#757575", "Gris"]];
const MARKS = [["#fff3a3", "Jaune"], ["#d1fae5", "Vert"], ["#e0f2fe", "Bleu"], ["#fde2e4", "Rose"]];
const IMAGE_WIDTHS = [["25", "25 %"], ["33", "33 %"], ["50", "50 %"], ["66", "66 %"], ["75", "75 %"], ["100", "Pleine largeur"]];
const IMAGE_ALIGNS = [["left", "À gauche"], ["center", "Centrée"], ["right", "À droite"], ["wide", "Large (déborde la colonne)"]];
// Blocs « KOLAKISA » et autres blocs spéciaux : signalés dans la bande contextuelle, réglables dans l'onglet Bloc
const SPECIAL = new Set(["kbGallery", "kbVideo", "kbAudio", "kbEmbed", "kbCourse", "kbNewsletter", "kbButton", "kbButtons", "callout", "kbAccordion", "kbFaq", "kbSteps", "kbCompare", "kbSpacer", "kbPageBreak", "kbColumns", "kbGroup", "kbCta", "kbReusable", "taskList"]);

export function setupDocumentMode(api) {
  const { editor, root, h, svg, chain, BLOCKS, CATS, blk, openMediaModal, linkPopover, popover, menuList, closePopovers, setAttrsAt, toast, modal, showSidebarTab, openSidebar, pastePlain, nameOf, getMode, saveMode, onToggle } = api;
  const canvas = root.querySelector("[data-canvas]");
  const content = root.querySelector(".wp-content");
  const switches = [...root.querySelectorAll("[data-edit-mode]")];
  let active = false;

  // ---------- Petits composants ----------
  const ico = (name, size = 18) => { const s = h("span", { class: "doc-ico", "aria-hidden": "true" }); s.innerHTML = icon(name, { size }); return s; };
  const keep = (b) => { b.addEventListener("mousedown", (e) => e.preventDefault()); return b; }; // la sélection reste dans le texte
  const btn = (label, iconEl, run, { cls = "", text = null, shortcut = "" } = {}) => keep(h("button", { type: "button", class: `doc-btn ${cls}`.trim(), "aria-label": label, title: shortcut ? `${label} (${shortcut})` : label, onclick: (e) => run(e) }, iconEl, text));
  const group = (key, priority, ...items) => h("div", { class: "doc-group", "data-group": key, "data-priority": String(priority), role: "group" }, ...items);
  const seg = (label, ...items) => h("div", { class: "doc-seg", role: "group", "aria-label": label }, ...items);
  const select = (label, width, onclick) => {
    const val = h("span", { class: "doc-select-value" });
    const b = keep(h("button", { type: "button", class: "doc-select", style: `width:${width}px`, "aria-haspopup": "true", "aria-label": label, title: label, onclick: (e) => onclick(e.currentTarget) }, val, ico("chevronDown", 14)));
    b.setValue = (t) => { if (val.textContent !== t) val.textContent = t; b.setAttribute("aria-label", `${label} : ${t}`); };
    return b;
  };
  const choiceMenu = (anchor, items, current) => popover(anchor, h("div", { class: "wp-menu-list doc-choice", role: "menu" }, ...items.map(([v, l, run, extra]) => keep(h("button", { type: "button", role: "menuitemradio", "aria-checked": String(v === current), class: extra || "", onclick: () => { closePopovers(); run(); } }, h("span", { class: "doc-check", "aria-hidden": "true" }, v === current ? "✓" : ""), h("span", {}, l))))), { className: "doc-pop" });
  const swatches = (anchor, title, list, apply, clear, clearLabel) => popover(anchor, h("div", { class: "doc-swatch-pop" },
    h("p", { class: "wp-menu-label" }, title),
    h("div", { class: "wp-swatches" }, ...list.map(([c, l]) => keep(h("button", { type: "button", class: "wp-swatch", style: `background:${c}`, title: l, "aria-label": `${title} : ${l}`, onclick: () => { apply(c); closePopovers(); } }))),
      keep(h("button", { type: "button", class: "wp-swatch is-none", title: clearLabel, "aria-label": clearLabel, onclick: () => { clear(); closePopovers(); } })))), { className: "doc-pop" });

  // ---------- Style de paragraphe ----------
  const STYLES = [
    ["p", "Paragraphe", () => chain().setParagraph().run()],
    ...[1, 2, 3, 4, 5, 6].map((l) => [`h${l}`, `Titre ${l}`, () => chain().setHeading({ level: l }).run(), `doc-style-h${l}`]),
    ["quote", "Citation", () => chain().toggleBlockquote().run()],
    ["code", "Bloc de code", () => chain().toggleCodeBlock().run()],
  ];
  const styleOf = () => {
    if (editor.isActive("codeBlock")) return "code";
    for (let l = 1; l <= 6; l++) if (editor.isActive("heading", { level: l })) return `h${l}`;
    if (editor.isActive("blockquote")) return "quote";
    return "p";
  };
  const styleSel = select("Style de paragraphe", 148, (a) => choiceMenu(a, STYLES, styleOf()));
  // Le navigateur relit « Bricolage Grotesque » entre guillemets : comparaison sans guillemets
  const fontOf = () => String(editor.getAttributes("textStyle").fontFamily || "").replace(/["']/g, "");
  const fontSel = select("Police", 152, (a) => choiceMenu(a, DOC_FONTS.map(([v, l]) => [v, l, () => (v ? chain().setFontFamily(v).run() : chain().unsetFontFamily().run())]), fontOf()));
  const sizeOf = () => editor.getAttributes("textStyle").fontSize || "";
  const sizeSel = select("Taille du texte", 112, (a) => choiceMenu(a, SIZES.map(([v, l]) => [v, l, () => (v ? chain().setFontSize(v).run() : chain().unsetFontSize().run())]), sizeOf()));

  // ---------- Mise en forme ----------
  const marks = [
    ["bold", "Gras", "bold", "Ctrl+B", () => chain().toggleBold().run()],
    ["italic", "Italique", "italic", "Ctrl+I", () => chain().toggleItalic().run()],
    ["underline", "Souligné", "underline", "Ctrl+U", () => chain().toggleUnderline().run()],
    ["strike", "Barré", "strike", "Ctrl+Maj+S", () => chain().toggleStrike().run()],
  ].map(([mark, label, ic, sc, run]) => { const b = btn(label, svg(ic, 20), run, { shortcut: sc }); b.dataset.mark = mark; return b; });
  const moreFormat = btn("Autres mises en forme", ico("chevronDown", 16), (e) => popover(e.currentTarget, menuList([
    { label: "Exposant", run: () => chain().toggleSuperscript().run() },
    { label: "Indice", run: () => chain().toggleSubscript().run() },
    { label: "Code en ligne", icon: "code", run: () => chain().toggleCode().run() },
    "-",
    { label: "Effacer la mise en forme", run: () => chain().unsetAllMarks().run() },
    { label: "Coller sans mise en forme", shortcut: "Ctrl+Maj+V", run: () => pastePlain() },
  ]), { className: "doc-pop" }), { cls: "doc-btn-narrow" });

  const colorBar = h("span", { class: "doc-colorbar" });
  const colorBtn = btn("Couleur du texte", h("span", { class: "doc-glyph" }, h("span", { class: "doc-letter" }, "A"), colorBar), (e) => swatches(e.currentTarget, "Couleur du texte", COLORS, (c) => chain().setColor(c).run(), () => chain().unsetColor().run(), "Couleur automatique"));
  const markBar = h("span", { class: "doc-colorbar" });
  const markBtn = btn("Couleur de surbrillance", h("span", { class: "doc-glyph" }, ico("highlighter", 16), markBar), (e) => swatches(e.currentTarget, "Surbrillance", MARKS, (c) => chain().setHighlight({ color: c }).run(), () => chain().unsetHighlight().run(), "Sans surbrillance"));

  const aligns = [["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"], ["justify", "Justifier", "alignJustify"]]
    .map(([v, l, ic]) => { const b = btn(l, svg(ic, 20), () => chain().setTextAlign(v).run()); b.dataset.align = v; return b; });

  const listBtns = [
    ["bulletList", "Liste à puces", "list", () => chain().toggleBulletList().run()],
    ["orderedList", "Liste numérotée", "ordered", () => chain().toggleOrderedList().run()],
    ["taskList", "Liste de contrôle", "checklist", () => chain().toggleTaskList().run()],
  ].map(([n, l, ic, run]) => { const b = btn(l, svg(ic, 20), run); b.dataset.node = n; return b; });
  const outdent = btn("Diminuer le retrait", svg("outdent", 20), () => chain().outdent().run(), { shortcut: "Maj+Tab" });
  const indent = btn("Augmenter le retrait", svg("indent", 20), () => chain().indent().run(), { shortcut: "Tab" });

  // ---------- Insertion ----------
  const run = (id) => { const b = BLOCKS.find((x) => x.id === id); if (b) b.run(); };
  const linkBtn = btn("Lien", svg("link", 20), (e) => linkPopover(e.currentTarget), { shortcut: "Ctrl+K" });
  linkBtn.dataset.mark = "link";
  const imageBtn = btn("Image", svg("image", 20), () => run("image"));
  // Tableau : grille de choix (lignes × colonnes) comme dans un traitement de texte
  const tableBtn = btn("Tableau", svg("table", 20), (e) => {
    const label = h("p", { class: "doc-grid-label", "aria-live": "polite" }, "Tableau 3 × 3");
    const grid = h("div", { class: "doc-grid", role: "grid", "aria-label": "Taille du tableau" });
    const cells = [];
    const mark = (r, c) => { cells.forEach((x) => x.classList.toggle("is-on", Number(x.dataset.r) <= r && Number(x.dataset.c) <= c)); label.textContent = `Tableau ${r} × ${c}`; };
    for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) {
      const cell = keep(h("button", { type: "button", class: "doc-grid-cell", "data-r": String(r), "data-c": String(c), "aria-label": `Insérer un tableau de ${r} lignes et ${c} colonnes`, onmouseenter: () => mark(r, c), onfocus: () => mark(r, c), onclick: () => { closePopovers(); blk({ type: "table", content: Array.from({ length: r }, (_, i) => ({ type: "tableRow", content: Array.from({ length: c }, () => ({ type: i === 0 ? "tableHeader" : "tableCell", content: [{ type: "paragraph" }] })) })) }); } }));
      cells.push(cell); grid.append(cell);
    }
    popover(e.currentTarget, h("div", { class: "doc-grid-pop" }, grid, label), { className: "doc-pop" });
    mark(3, 3);
  });
  const videoBtn = btn("Vidéo", ico("video", 18), () => run("video"));
  // « Insérer » : tous les blocs de l'éditeur (mêmes commandes que l'outil d'insertion du mode blocs), par catégorie
  const insertBtn = keep(h("button", { type: "button", class: "doc-insert", "aria-haspopup": "true", title: "Insérer un élément (image, citation, code, bloc KOLAKISA…)", onclick: (e) => {
    const sections = CATS.map((cat) => {
      const items = BLOCKS.filter((b) => b.cat === cat);
      return items.length ? h("section", { class: "doc-insert-cat" }, h("p", { class: "wp-menu-label" }, cat), h("div", { class: "doc-insert-grid" }, ...items.map((b) => keep(h("button", { type: "button", class: `doc-insert-item${b.brand ? " is-brand" : ""}`, onclick: () => { closePopovers(); b.run(); } }, h("span", { class: "doc-insert-icon" }, svg(b.icon, 20)), h("span", {}, b.title)))))) : null;
    }).filter(Boolean);
    popover(e.currentTarget, h("div", { class: "doc-insert-pop" }, ...sections), { className: "doc-pop doc-pop-wide" });
  } }, ico("plus", 16), h("span", {}, "Insérer")));

  // ---------- Annuler / rétablir, plein écran ----------
  const undoBtn = btn("Annuler", ico("undo"), () => chain().undo().run(), { shortcut: "Ctrl+Z" });
  const redoBtn = btn("Rétablir", ico("redo"), () => chain().redo().run(), { shortcut: "Ctrl+Maj+Z" });
  const focusBtn = btn("Plein écran (masquer les panneaux)", ico("maximize"), () => setFocus(!root.classList.contains("is-doc-focus")), { cls: "doc-focus-btn" });
  focusBtn.setAttribute("aria-pressed", "false");

  // ---------- Ruban et repli « Plus » ----------
  // Priorité : plus le nombre est grand, plus le groupe passe tôt dans « Plus » quand la largeur manque (0 = jamais).
  // Lien / image / tableau / vidéo partent avant l'alignement : ils restent aussi dans « Insérer » et « Plus ».
  const groups = [
    group("history", 0, undoBtn, redoBtn),
    group("style", 0, styleSel),
    group("font", 6, fontSel, sizeSel),
    group("marks", 0, seg("Mise en forme du texte", ...marks), moreFormat),
    group("colors", 5, colorBtn, markBtn),
    group("align", 3, seg("Alignement", ...aligns)),
    group("lists", 2, seg("Listes", ...listBtns), seg("Retrait", outdent, indent)),
    group("insert", 4, linkBtn, imageBtn, tableBtn, videoBtn),
    group("more-insert", 0, insertBtn),
  ];
  const overflowItems = {
    // Menus ouverts sous « Plus » (le bouton d'origine est masqué) : après la fermeture du menu courant
    font: () => [
      { label: "Police…", run: () => setTimeout(() => choiceMenu(moreBtn, DOC_FONTS.map(([v, l]) => [v, l, () => (v ? chain().setFontFamily(v).run() : chain().unsetFontFamily().run())]), fontOf()), 0) },
      { label: "Taille du texte…", run: () => setTimeout(() => choiceMenu(moreBtn, SIZES.map(([v, l]) => [v, l, () => (v ? chain().setFontSize(v).run() : chain().unsetFontSize().run())]), sizeOf()), 0) },
    ],
    colors: () => [...COLORS.map(([c, l]) => ({ label: `Couleur du texte : ${l}`, run: () => chain().setColor(c).run() })), { label: "Couleur automatique", run: () => chain().unsetColor().run() }, "-", ...MARKS.map(([c, l]) => ({ label: `Surbrillance : ${l}`, run: () => chain().setHighlight({ color: c }).run() })), { label: "Sans surbrillance", run: () => chain().unsetHighlight().run() }],
    align: () => [["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"], ["justify", "Justifier", "alignJustify"]].map(([v, l, i]) => ({ label: l, icon: i, run: () => chain().setTextAlign(v).run() })),
    lists: () => [{ label: "Liste à puces", icon: "list", run: () => chain().toggleBulletList().run() }, { label: "Liste numérotée", icon: "ordered", run: () => chain().toggleOrderedList().run() }, { label: "Liste de contrôle", icon: "checklist", run: () => chain().toggleTaskList().run() }, { label: "Diminuer le retrait", icon: "outdent", run: () => chain().outdent().run() }, { label: "Augmenter le retrait", icon: "indent", run: () => chain().indent().run() }],
    insert: () => [{ label: "Lien…", icon: "link", run: () => linkPopover(null) }, { label: "Image…", icon: "image", run: () => run("image") }, { label: "Tableau 3 × 3", icon: "table", run: () => run("table") }, { label: "Vidéo…", icon: "video", run: () => run("video") }],
  };
  const moreBtn = keep(h("button", { type: "button", class: "doc-btn doc-more", "aria-haspopup": "true", "aria-label": "Plus d'outils", title: "Plus d'outils", hidden: true, onclick: (e) => {
    const hiddenGroups = groups.filter((g) => g.hidden).map((g) => g.dataset.group);
    const items = hiddenGroups.flatMap((k, i) => [...(i ? ["-"] : []), ...(overflowItems[k] ? overflowItems[k]() : [])]);
    popover(e.currentTarget, menuList(items), { className: "doc-pop" });
  } }, ico("moreHorizontal")));
  const ribbon = h("div", { class: "doc-ribbon", role: "toolbar", "aria-label": "Barre d'outils du document" }, h("div", { class: "doc-groups" }, ...groups), h("div", { class: "doc-ribbon-end" }, moreBtn, focusBtn));
  const ctxBar = h("div", { class: "doc-context", role: "region", "aria-label": "Outils de l'élément sélectionné" });
  const chrome = h("div", { class: "doc-chrome", hidden: true }, ribbon, ctxBar);
  canvas.insertBefore(chrome, content);

  // Disposition : les groupes vont à la ligne (deux lignes au plus, comme un ruban de traitement de texte). Au-delà, les
  // groupes les moins prioritaires passent dans « Plus ». Le premier groupe de chaque ligne perd son filet de séparation.
  const MAX_LINES = 2;
  const wrap = ribbon.querySelector(".doc-groups");
  const linesOf = (list) => new Set(list.map((g) => g.offsetTop)).size;
  const fit = () => {
    if (!active) return;
    groups.forEach((g) => { g.hidden = false; g.classList.remove("is-line-start"); });
    moreBtn.hidden = true;
    const order = groups.filter((g) => Number(g.dataset.priority) > 0).sort((a, b) => Number(b.dataset.priority) - Number(a.dataset.priority));
    for (const g of order) {
      const shown = groups.filter((x) => !x.hidden);
      if (linesOf(shown) <= MAX_LINES && wrap.scrollWidth <= wrap.clientWidth + 1) break;
      g.hidden = true;
      moreBtn.hidden = false;
    }
    let top = null;
    groups.filter((g) => !g.hidden).forEach((g) => { if (g.offsetTop !== top) { g.classList.add("is-line-start"); top = g.offsetTop; } });
  };
  const ro = new ResizeObserver(() => fit());
  ro.observe(ribbon);

  // ---------- Bande contextuelle (hauteur fixe : jamais de saut de mise en page) ----------
  const ctxLabel = (t) => h("span", { class: "doc-ctx-label" }, t);
  const ctxBtn = (label, run2, { danger = false } = {}) => keep(h("button", { type: "button", class: `doc-ctx-btn${danger ? " is-danger" : ""}`, onclick: (e) => run2(e) }, label));
  const ctxSelect = (label, items, current, onpick) => keep(h("button", { type: "button", class: "doc-ctx-btn has-menu", "aria-haspopup": "true", onclick: (e) => choiceMenu(e.currentTarget, items.map(([v, l]) => [v, l, () => onpick(v)]), current) }, `${label} : ${(items.find((x) => x[0] === current) || [null, "—"])[1]}`, ico("chevronDown", 14)));
  const imageProps = (pos, a) => {
    const f = (label, el) => h("label", { class: "doc-field" }, h("span", {}, label), el);
    const alt = h("input", { type: "text", value: a.alt || "", maxlength: "200" });
    const caption = h("input", { type: "text", value: a.caption || "", maxlength: "300" });
    const href = h("input", { type: "text", value: a.href || "", maxlength: "2000", placeholder: "https://… ou /chemin" });
    const tab = h("input", { type: "checkbox" }); tab.checked = Boolean(a.newTab);
    modal("Propriétés de l'image", h("div", { class: "doc-form" },
      f("Texte alternatif (décrit l'image aux lecteurs d'écran et à Google)", alt), f("Légende (affichée sous l'image)", caption), f("Lien au clic (facultatif)", href),
      h("label", { class: "wp-checkbox" }, tab, " Ouvrir le lien dans un nouvel onglet")), [
      { label: "Annuler" },
      { label: "Appliquer", primary: true, run: () => {
        const link = href.value.trim();
        // Lien invalide : la fenêtre reste ouverte (true), rien n'est appliqué
        if (link && !/^(https?:\/\/\S+|\/(?!\/)\S*|mailto:\S+)$/i.test(link)) { toast("Lien invalide : https://…, /chemin-interne ou mailto:…", "error"); return true; }
        setAttrsAt(pos, { alt: alt.value.trim(), caption: caption.value.trim(), href: link, newTab: Boolean(link) && tab.checked });
        return undefined;
      } },
    ]);
  };
  let ctxKey = "";
  function renderContext() {
    const sel = editor.state.selection;
    const node = sel instanceof NodeSelection ? sel.node : null;
    let key; let parts;
    if (node && node.type.name === "kbImage") {
      const pos = sel.from; const a = node.attrs;
      key = `img|${pos}|${a.width}|${a.align}|${a.src}`;
      parts = [ctxLabel("Image"),
        ctxBtn("Remplacer…", () => openMediaModal({ onSelect: (m, extra) => setAttrsAt(pos, { src: m.path, mediaId: m.id, alt: extra.alt || a.alt }) })),
        ctxSelect("Largeur", IMAGE_WIDTHS, a.width || "100", (v) => setAttrsAt(pos, { width: v })),
        ctxSelect("Position", IMAGE_ALIGNS, a.align || "center", (v) => setAttrsAt(pos, { align: v })),
        ctxBtn("Texte alternatif, légende, lien…", () => imageProps(pos, a)),
        ctxBtn("Supprimer l'image", () => chain().deleteSelection().run(), { danger: true })];
    } else if (editor.isActive("table")) {
      key = "table";
      parts = [ctxLabel("Tableau"),
        ctxBtn("+ Ligne au-dessus", () => chain().addRowBefore().run()), ctxBtn("+ Ligne en dessous", () => chain().addRowAfter().run()), ctxBtn("Supprimer la ligne", () => chain().deleteRow().run()),
        ctxBtn("+ Colonne à gauche", () => chain().addColumnBefore().run()), ctxBtn("+ Colonne à droite", () => chain().addColumnAfter().run()), ctxBtn("Supprimer la colonne", () => chain().deleteColumn().run()),
        ctxBtn("Fusionner / séparer", () => chain().mergeOrSplit().run()), ctxBtn("Ligne d'en-tête", () => chain().toggleHeaderRow().run()),
        ctxBtn("Supprimer le tableau", () => chain().deleteTable().run(), { danger: true })];
    } else if (editor.isActive("link")) {
      const href = editor.getAttributes("link").href || "";
      key = `link|${href}`;
      parts = [ctxLabel("Lien"), h("span", { class: "doc-ctx-url", title: href }, href),
        ctxBtn("Modifier…", (e) => linkPopover(e.currentTarget)),
        ctxBtn("Ouvrir ↗", () => window.open(/^\//.test(href) ? href : href, "_blank", "noopener")),
        ctxBtn("Retirer le lien", () => chain().extendMarkRange("link").unsetLink().run(), { danger: true })];
    } else {
      // Bloc spécial sélectionné, ou curseur à l'intérieur d'un bloc spécial (encadré, FAQ, colonnes…)
      let special = node && SPECIAL.has(node.type.name) ? node : null;
      if (!special) { const $f = sel.$from; for (let d = $f.depth; d >= 1; d--) if (SPECIAL.has($f.node(d).type.name)) { special = $f.node(d); break; } }
      if (special) {
        key = `special|${special.type.name}`;
        parts = [ctxLabel(`Bloc KOLAKISA · ${nameOf(special)}`),
          ctxBtn("Réglages du bloc", () => { openSidebar(); showSidebarTab("bloc"); }),
          ctxBtn("Ouvrir en mode Blocs", () => setMode("blocks", { save: true }))];
      } else {
        key = "none";
        parts = [h("span", { class: "doc-ctx-hint" }, "Sélectionnez une image, un tableau, un lien ou un bloc KOLAKISA pour ses outils. Ctrl + K : lien · Ctrl + Z / Ctrl + Maj + Z : annuler / rétablir.")];
      }
    }
    if (key === ctxKey) return;
    ctxKey = key;
    ctxBar.replaceChildren(...parts);
  }

  // ---------- États (gras actif, style courant…) : une mise à jour par image affichée au plus ----------
  let raf = 0;
  const pressed = (b, on) => { const v = String(Boolean(on)); if (b.getAttribute("aria-pressed") !== v) b.setAttribute("aria-pressed", v); };
  function refresh() {
    raf = 0;
    if (!active) return;
    const style = STYLES.find((s) => s[0] === styleOf());
    styleSel.setValue(style ? style[1] : "Paragraphe");
    const font = DOC_FONTS.find((f) => f[0] === fontOf());
    fontSel.setValue(font ? font[1] : "Police personnalisée");
    const size = SIZES.find((s) => s[0] === sizeOf());
    sizeSel.setValue(size ? size[1] : "Normal");
    marks.forEach((b) => pressed(b, editor.isActive(b.dataset.mark)));
    pressed(linkBtn, editor.isActive("link"));
    const align = ["center", "right", "justify"].find((v) => editor.isActive({ textAlign: v })) || "left";
    aligns.forEach((b) => pressed(b, b.dataset.align === align));
    listBtns.forEach((b) => pressed(b, editor.isActive(b.dataset.node)));
    colorBar.style.background = editor.getAttributes("textStyle").color || "currentColor";
    markBar.style.background = editor.getAttributes("highlight").color || "transparent";
    undoBtn.disabled = !editor.can().undo();
    redoBtn.disabled = !editor.can().redo();
    // Mise en forme impossible dans un bloc de code (comme dans le mode blocs)
    const inCode = editor.isActive("codeBlock");
    [...marks, colorBtn, markBtn, fontSel, sizeSel, moreFormat].forEach((b) => { b.disabled = inCode; });
    renderContext();
  }
  const schedule = () => { if (active && !raf) raf = requestAnimationFrame(refresh); };
  editor.on("transaction", schedule);
  editor.on("selectionUpdate", schedule);
  editor.on("focus", schedule);

  // ---------- Plein écran ----------
  function setFocus(on) {
    root.classList.toggle("is-doc-focus", on);
    focusBtn.setAttribute("aria-pressed", String(on));
    focusBtn.setAttribute("aria-label", on ? "Quitter le plein écran (Échap)" : "Plein écran (masquer les panneaux)");
    focusBtn.title = on ? "Quitter le plein écran (Échap)" : "Plein écran (masquer les panneaux)";
    requestAnimationFrame(fit);
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("is-doc-focus") && !document.querySelector(".wp-popover, dialog[open]")) { e.preventDefault(); setFocus(false); }
  });

  // ---------- Bascule de mode ----------
  function setMode(mode, { save = false } = {}) {
    const doc = mode === "document";
    active = doc;
    root.classList.toggle("is-doc-mode", doc);
    chrome.hidden = !doc;
    if (!doc) setFocus(false);
    switches.forEach((b) => b.setAttribute("aria-checked", String((b.dataset.editMode === "document") === doc)));
    closePopovers();
    onToggle(doc);
    if (doc) { ctxKey = ""; refresh(); requestAnimationFrame(fit); }
    if (save) saveMode(doc ? "document" : "blocks");
  }
  switches.forEach((b) => {
    b.addEventListener("click", () => {
      const target = b.dataset.editMode;
      if ((target === "document") === active) return;
      setMode(target, { save: true });
      editor.view.focus();
    });
    // Groupe de boutons radio : flèches gauche / droite
    b.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      const other = switches.find((x) => x !== b);
      other.focus(); other.click();
    });
  });
  if (getMode() === "document") setMode("document");

  return { isActive: () => active, setMode, refresh: schedule };
}
