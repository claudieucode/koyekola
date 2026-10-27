// Blocs de l'éditeur éditorial du blog (Tiptap). Chaque bloc produit EXACTEMENT le HTML accepté par le serveur
// (src/utils/blogHtml.js) : image, galerie, vidéo, audio, intégration, formation, newsletter, bouton, encadrés, appel à
// l'action, accordéon, FAQ, étapes, comparaison. Les blocs « à risque » (vidéo, intégration…) ne sont que des marqueurs :
// le lecteur réel est fabriqué par le serveur à l'affichage.
import { Node, Extension, mergeAttributes } from "@tiptap/core";
import { STYLE_PROPS, COLOR_VARS, styleDataOf, colorStyle } from "../../shared/blockStyles";
import { DYNAMIC } from "../../shared/dynamicBlocks";

const WIDTHS = ["25", "33", "50", "66", "75", "100"];
const ALIGNS = ["left", "center", "right", "wide"];
export const CALLOUT_LABELS = { info: "Information", conseil: "Conseil", attention: "Attention", "a-retenir": "À retenir", "bon-a-savoir": "Bon à savoir", note: "Note", important: "Important", astuce: "Astuce" };

// Réglages de style (marges, bordure, couleurs…) sur le conteneur d'un bloc dessiné par sa propre vue
export function applyStyleAttrs(dom, attrs) {
  for (const p of STYLE_PROPS) dom.removeAttribute(p.attr);
  for (const [k, v] of Object.entries(styleDataOf(attrs))) dom.setAttribute(k, v);
  for (const cssVar of Object.values(COLOR_VARS)) dom.style.removeProperty(cssVar);
  for (const part of colorStyle(attrs).split(";").filter(Boolean)) { const [name, value] = part.split(":").map((x) => x.trim()); dom.style.setProperty(name, value); }
  if (!dom.getAttribute("style")) dom.removeAttribute("style");
}

// Vue d'un bloc « atome » dans l'éditeur : une carte non modifiable au clavier (on la règle par sa fenêtre)
function atomView(build) {
  return ({ node }) => {
    const dom = document.createElement("div");
    dom.contentEditable = "false";
    const paint = (n) => { dom.replaceChildren(); build(dom, n.attrs); applyStyleAttrs(dom, n.attrs); };
    paint(node);
    return { dom, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } };
  };
}
const span = (cls, text) => { const s = document.createElement("span"); s.className = cls; s.textContent = text; return s; };

// ---------- Image (figure) ----------
export const KbImage = Node.create({
  name: "kbImage",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: "" }, title: { default: "" }, caption: { default: "" }, credit: { default: "" }, align: { default: "center" }, width: { default: "100" }, mediaId: { default: null }, href: { default: "" }, newTab: { default: false }, ratio: { default: "" }, lightbox: { default: false }, fit: { default: "" } };
  },
  parseHTML() {
    return [
      {
        tag: "figure.kb-image",
        priority: 60,
        getAttrs: (el) => {
          const img = el.querySelector("img");
          if (!img) return false;
          return {
            src: img.getAttribute("src"), alt: img.getAttribute("alt") || "", title: img.getAttribute("title") || "",
            caption: (el.querySelector("figcaption") || { textContent: "" }).textContent.trim(), credit: el.getAttribute("data-credit") || "",
            align: ALIGNS.includes(el.getAttribute("data-align")) ? el.getAttribute("data-align") : "center",
            width: WIDTHS.includes(el.getAttribute("data-width")) ? el.getAttribute("data-width") : "100", mediaId: img.getAttribute("data-media-id"),
            href: (el.querySelector("a") || { getAttribute: () => "" }).getAttribute("href") || "", newTab: (el.querySelector("a") || { getAttribute: () => "" }).getAttribute("target") === "_blank",
            ratio: el.getAttribute("data-ratio") || "",
            lightbox: el.getAttribute("data-lightbox") === "true", fit: el.getAttribute("data-fit") === "contain" ? "contain" : "",
          };
        },
      },
      { tag: "img[src]", getAttrs: (img) => ({ src: img.getAttribute("src"), alt: img.getAttribute("alt") || "", title: img.getAttribute("title") || "" }) },
    ];
  },
  renderHTML({ node }) {
    const a = node.attrs;
    const fig = { class: "kb-image", "data-align": a.align, ...lockOf(node) };
    if (a.width && a.width !== "100") fig["data-width"] = a.width;
    if (a.credit) fig["data-credit"] = a.credit;
    if (a.ratio) fig["data-ratio"] = a.ratio;
    if (a.lightbox) fig["data-lightbox"] = "true";
    if (a.fit) fig["data-fit"] = a.fit;
    const img = { src: a.src, alt: a.alt || "" };
    if (a.title) img.title = a.title;
    if (a.mediaId) img["data-media-id"] = String(a.mediaId);
    const picture = a.href ? ["a", { href: a.href, ...(a.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}) }, ["img", img]] : ["img", img];
    return a.caption ? ["figure", fig, picture, ["figcaption", {}, a.caption]] : ["figure", fig, picture];
  },
  addNodeView() {
    return atomView((dom, a) => {
      dom.className = "kb-ed-image";
      dom.dataset.align = a.align;
      dom.dataset.width = a.width;
      if (a.variant) dom.dataset.variant = a.variant; else delete dom.dataset.variant;
      if (a.fit) dom.dataset.fit = a.fit; else delete dom.dataset.fit;
      const img = document.createElement("img");
      // Fichier absent du serveur : on le dit clairement au lieu d'afficher un cadre vide
      img.addEventListener("error", () => {
        if (dom.querySelector(".kb-ed-broken")) return;
        dom.classList.add("is-broken");
        dom.insertBefore(span("kb-ed-broken", `⚠ Fichier image introuvable sur le serveur (${a.src.split("/").pop()}) : sélectionnez le bloc puis « Remplacer » dans l'onglet Bloc.`), img.nextSibling);
      });
      img.src = a.src;
      img.alt = a.alt || "";
      dom.append(img);
      if (a.caption) dom.append(span("kb-ed-caption", a.caption));
      if (!a.alt) dom.append(span("kb-ed-warning", "⚠ Texte alternatif manquant"));
    });
  },
});

// ---------- Galerie ----------
export const KbGallery = Node.create({
  name: "kbGallery",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { images: { default: [] }, columns: { default: "3" }, gap: { default: "" }, natural: { default: false }, lightbox: { default: false } }; },
  parseHTML() {
    return [{
      tag: "div.kb-gallery",
      priority: 70,
      getAttrs: (el) => ({
        columns: ["2", "3", "4"].includes(el.getAttribute("data-columns")) ? el.getAttribute("data-columns") : "3",
        gap: ["s", "m", "l"].includes(el.getAttribute("data-gap")) ? el.getAttribute("data-gap") : "",
        natural: el.getAttribute("data-natural") === "true", lightbox: el.getAttribute("data-lightbox") === "true",
        images: [...el.querySelectorAll("figure")].map((f) => {
          const img = f.querySelector("img");
          return img ? { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "", caption: (f.querySelector("figcaption") || { textContent: "" }).textContent.trim(), href: (f.querySelector("a") || { getAttribute: () => "" }).getAttribute("href") || "" } : null;
        }).filter(Boolean),
      }),
    }];
  },
  renderHTML({ node }) {
    const figures = (node.attrs.images || []).map((i) => {
      const img = ["img", { src: i.src, alt: i.alt || "" }];
      const picture = i.href ? ["a", { href: i.href }, img] : img; // lien par image
      return i.caption ? ["figure", { class: "kb-image" }, picture, ["figcaption", {}, i.caption]] : ["figure", { class: "kb-image" }, picture];
    });
    return ["div", { class: "kb-gallery", "data-columns": node.attrs.columns, ...(node.attrs.gap ? { "data-gap": node.attrs.gap } : {}), ...(node.attrs.natural ? { "data-natural": "true" } : {}), ...(node.attrs.lightbox ? { "data-lightbox": "true" } : {}), ...lockOf(node) }, ...figures];
  },
  addNodeView() {
    return atomView((dom, a) => {
      dom.className = "kb-ed-gallery";
      if (a.gap) dom.dataset.gap = a.gap;
      if (a.natural) dom.dataset.natural = "true";
      dom.style.setProperty("--cols", a.columns);
      for (const i of a.images || []) { const img = document.createElement("img"); img.src = i.src; img.alt = i.alt || ""; dom.append(img); }
      if (!(a.images || []).length) dom.append(span("kb-ed-empty", "Galerie vide : sélectionnez-la, puis « Ajouter des images » dans l'onglet Bloc"));
    });
  },
});

// Bloc verrouillé : marqueur conservé dans le HTML enregistré (attribut global « locked », voir editing.js)
// Repères communs aux blocs dessinés par leur propre renderHTML : verrou, identité du bloc, bloc masqué
export const lockOf = (node) => ({
  ...styleDataOf(node.attrs),
  ...(colorStyle(node.attrs) ? { style: colorStyle(node.attrs) } : {}),
  ...(node.attrs.anchor ? { id: node.attrs.anchor } : {}),
  ...(node.attrs.xclass ? { "data-class": node.attrs.xclass } : {}),
  ...(node.attrs.variant ? { "data-variant": node.attrs.variant } : {}),
  ...(node.attrs.blockName ? { "data-name": node.attrs.blockName } : {}),
  ...(node.attrs.hide ? { "data-hide": node.attrs.hide } : {}),
  ...(node.attrs.locked ? { "data-locked": "true" } : {}),
  ...(node.attrs.blockId ? { "data-block-id": node.attrs.blockId } : {}),
  ...(node.attrs.hidden ? { "data-hidden": "true" } : {}),
});

// ---------- Marqueurs (rendus par le serveur) ----------
function marker({ name, cls, attrs, icon, label }) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() { return Object.fromEntries(Object.keys(attrs).map((k) => [k, { default: "" }])); },
    parseHTML() { return [{ tag: `div.${cls}`, priority: 70, getAttrs: (el) => Object.fromEntries(Object.entries(attrs).map(([k, d]) => [k, el.getAttribute(d) || ""])) }]; },
    renderHTML({ node }) {
      const out = { class: cls, ...lockOf(node) };
      for (const [k, d] of Object.entries(attrs)) if (node.attrs[k]) out[d] = node.attrs[k];
      return ["div", out];
    },
    addNodeView() {
      return atomView((dom, a) => {
        dom.className = "kb-ed-marker";
        dom.append(span("kb-ed-marker-icon", icon), span("kb-ed-marker-label", label(a)));
      });
    },
  });
}
export const KbVideo = marker({ name: "kbVideo", cls: "kb-video", attrs: { url: "data-url", caption: "data-caption", poster: "data-poster", autoplay: "data-autoplay", muted: "data-muted", loop: "data-loop", preload: "data-preload", nocontrols: "data-nocontrols", track: "data-track", tracklang: "data-track-lang", tracklabel: "data-track-label" }, icon: "▶", label: (a) => `Vidéo · ${a.url || "adresse à compléter"}${a.caption ? ` · ${a.caption}` : ""}` });
export const KbAudio = marker({ name: "kbAudio", cls: "kb-audio", attrs: { src: "data-src", title: "data-title", author: "data-author", loop: "data-loop", preload: "data-preload", autoplay: "data-autoplay" }, icon: "♪", label: (a) => `Audio · ${a.title || a.src || "fichier à choisir"}${a.author ? ` — ${a.author}` : ""}` });
export const KbEmbed = marker({ name: "kbEmbed", cls: "kb-embed", attrs: { url: "data-url", caption: "data-caption" }, icon: "⧉", label: (a) => `Intégration · ${a.url || "adresse à compléter"} (services reconnus : lecteur ; le reste : lien)` });
export const KbCourse = marker({ name: "kbCourse", cls: "kb-course", attrs: { slug: "data-course" }, icon: "🎓", label: (a) => `Formation recommandée · ${a.slug || "à choisir"}` });
export const KbNewsletter = marker({ name: "kbNewsletter", cls: "kb-newsletter", attrs: {}, icon: "✉", label: () => "Inscription à la newsletter (formulaire choisi dans Blog → réglages)" });

export const KbMore = marker({ name: "kbMore", cls: "kb-more", attrs: { label: "data-label" }, icon: "⋯", label: (a) => `Lire la suite${a.label ? ` — « ${a.label} »` : ""} · le texte qui précède sert d'extrait si l'extrait est vide` });
export const KbFile = marker({ name: "kbFile", cls: "kb-file", attrs: { url: "data-url", title: "data-title", download: "data-download", preview: "data-preview" }, icon: "📄", label: (a) => `Fichier à télécharger · ${a.title || (a.url || "").split("/").pop() || "fichier à choisir"}${a.download === "true" ? " (téléchargement direct)" : ""}` });

// ---------- Préformaté et vers : texte dont les espaces et les retours à la ligne sont conservés ----------
function preBlock({ name, cls, placeholder }) {
  return Node.create({
    name,
    group: "block",
    content: "inline*",
    marks: "_", // mise en forme en ligne (gras, italique, lien…) permise, comme dans Gutenberg
    whitespace: "pre",
    defining: true,
    addAttributes() { return {}; },
    parseHTML() { return [{ tag: `pre.${cls}`, priority: 90, preserveWhitespace: "full" }]; },
    renderHTML({ node }) { return ["pre", { class: cls, ...lockOf(node) }, 0]; },
    addKeyboardShortcuts() {
      return {
        // Entrée = retour à la ligne dans le bloc ; une ligne vide à la fin (Entrée deux fois de plus) en sort vers un nouveau paragraphe
        Enter: ({ editor }) => {
          const { $from, empty } = editor.state.selection;
          if ($from.parent.type.name !== name || !empty) return false;
          const text = $from.parent.textContent;
          if ($from.parentOffset === $from.parent.content.size && text.endsWith("\n\n")) {
            const end = $from.after();
            return editor.chain().command(({ tr }) => { tr.delete($from.pos - 2, $from.pos); return true; }).insertContentAt(end - 2, { type: "paragraph" }).focus().run();
          }
          return editor.commands.insertContent("\n");
        },
        "Mod-Enter": ({ editor }) => {
          const { $from } = editor.state.selection;
          if ($from.parent.type.name !== name) return false;
          return editor.chain().insertContentAt($from.after(), { type: "paragraph" }).focus().run();
        },
      };
    },
  });
}
export const KbPreformatted = preBlock({ name: "kbPreformatted", cls: "kb-preformatted" });
export const KbVerse = preBlock({ name: "kbVerse", cls: "kb-verse" });

// ---------- Couverture : image de fond sous un voile, contenu modifiable par-dessus ----------
export const KbCover = Node.create({
  name: "kbCover",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() { return { src: { default: "" }, alt: { default: "" }, overlay: { default: "40" }, height: { default: "m" }, fx: { default: "" }, fy: { default: "" }, fixed: { default: "" }, shade: { default: "" }, pos: { default: "" } }; },
  parseHTML() {
    return [{ tag: "div.kb-cover", priority: 85, getAttrs: (el) => ({ src: el.getAttribute("data-src") || "", alt: el.getAttribute("data-alt") || "", overlay: el.getAttribute("data-overlay") || "40", height: el.getAttribute("data-height") || "m", fx: el.getAttribute("data-fx") || "", fy: el.getAttribute("data-fy") || "", fixed: el.getAttribute("data-fixed") || "", shade: el.getAttribute("data-shade") || "", pos: el.getAttribute("data-pos") || "" }) }];
  },
  renderHTML({ node }) {
    const a = node.attrs;
    return ["div", { class: "kb-cover", "data-src": a.src, ...(a.alt ? { "data-alt": a.alt } : {}), "data-overlay": a.overlay || "40", "data-height": a.height || "m", ...(a.fx ? { "data-fx": a.fx } : {}), ...(a.fy ? { "data-fy": a.fy } : {}), ...(a.fixed ? { "data-fixed": a.fixed } : {}), ...(a.shade ? { "data-shade": a.shade } : {}), ...(a.pos ? { "data-pos": a.pos } : {}), ...lockOf(node) }, 0];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      const paint = (n) => {
        dom.className = "kb-ed-cover";
        dom.dataset.height = n.attrs.height || "m";
        for (const k of ["fx", "fy", "shade", "pos"]) { if (n.attrs[k]) dom.dataset[k] = n.attrs[k]; else delete dom.dataset[k]; }
        dom.style.setProperty("--fx", n.attrs.fx ? `${n.attrs.fx}%` : "50%"); dom.style.setProperty("--fy", n.attrs.fy ? `${n.attrs.fy}%` : "50%");
        applyStyleAttrs(dom, n.attrs);
        dom.style.setProperty("--ov", String((Number(n.attrs.overlay) || 0) / 100));
        dom.style.setProperty("--cover-src", n.attrs.src ? `url("${String(n.attrs.src).replace(/["\\]/g, "")}")` : "none");
      };
      paint(node);
      return { dom, contentDOM: dom, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } };
    };
  },
});

// ---------- Média et texte : une image à côté d'un texte ----------
export const KbMediaText = Node.create({
  name: "kbMediaText",
  group: "block",
  content: "kbImage kbMediaTextBody",
  defining: true,
  addAttributes() { return { side: { default: "left" }, width: { default: "50" }, valign: { default: "" }, crop: { default: "" }, stack: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-mediatext", priority: 85, getAttrs: (el) => ({ side: el.getAttribute("data-side") === "right" ? "right" : "left", width: ["25", "33", "40", "50", "60", "66", "75"].includes(el.getAttribute("data-width")) ? el.getAttribute("data-width") : "50", valign: el.getAttribute("data-valign") || "", crop: el.getAttribute("data-crop") || "", stack: el.getAttribute("data-stack") || "" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-mediatext", "data-side": node.attrs.side, "data-width": node.attrs.width, ...dataAttrs(node, ["valign", "crop", "stack"]), ...lockOf(node) }, 0]; },
  addNodeView() { return layoutView("kb-ed-mediatext", ["side", "width", "valign", "crop", "stack"]); },
});

// ---------- Bouton ----------
export const KbButton = Node.create({
  name: "kbButton",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { text: { default: "Découvrir les formations" }, href: { default: "/catalogue" }, variant: { default: "primary" }, align: { default: "center" }, newTab: { default: false }, size: { default: "" }, radius: { default: "" }, width: { default: "" }, bg: { default: "" }, fg: { default: "" }, border: { default: "" } }; },
  parseHTML() {
    return [{
      tag: "p.kb-button",
      priority: 70,
      getAttrs: (el) => {
        const a = el.querySelector("a");
        if (!a) return false;
        const d = (k) => el.getAttribute(`data-${k}`) || "";
        return { text: a.textContent.trim(), href: a.getAttribute("href") || "", variant: /btn-outline/.test(a.className) ? "outline" : "primary", align: el.getAttribute("data-align") || "left", newTab: a.getAttribute("target") === "_blank", size: d("size"), radius: d("radius"), width: d("width"), bg: d("bg"), fg: d("fg"), border: d("border") };
      },
    }];
  },
  renderHTML({ node }) {
    const a = node.attrs;
    const link = { href: a.href, class: `btn btn-${a.variant === "outline" ? "outline" : "primary"}` };
    if (a.newTab) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
    const style = Object.fromEntries(["size", "radius", "width", "bg", "fg", "border"].filter((k) => a[k]).map((k) => [`data-${k}`, a[k]]));
    return ["p", { class: "kb-button", "data-align": a.align, ...style, ...lockOf(node) }, ["a", link, a.text]];
  },
  addNodeView() {
    return atomView((dom, a) => {
      dom.className = "kb-ed-button";
      dom.dataset.align = a.align;
      dom.append(span(`btn btn-${a.variant === "outline" ? "outline" : "primary"}`, a.text), span("kb-ed-caption", a.href));
    });
  },
});

// ---------- Conteneurs (contenu modifiable à l'intérieur) ----------
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() { return { type: { default: "info" }, title: { default: "" } }; },
  parseHTML() {
    return [{ tag: "div.callout", priority: 70, getAttrs: (el) => ({ type: el.getAttribute("data-callout") || (el.className.match(/callout-([a-z-]+)/) || [])[1] || "info", title: el.getAttribute("data-title") || "" }) }];
  },
  renderHTML({ node }) {
    const out = { class: `callout callout-${node.attrs.type}`, "data-callout": node.attrs.type, ...lockOf(node) };
    if (node.attrs.title) out["data-title"] = node.attrs.title;
    return ["div", out, 0];
  },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      const head = document.createElement("div");
      head.className = "kb-ed-callout-head";
      head.contentEditable = "false";
      const body = document.createElement("div");
      const paint = (n) => { dom.className = `callout callout-${n.attrs.type}`; head.textContent = n.attrs.title || CALLOUT_LABELS[n.attrs.type] || "Encadré"; };
      paint(node);
      dom.append(head, body);
      return { dom, contentDOM: body, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } };
    };
  },
});

const simpleBlock = (name, tag, cls, content, extra = {}) => Node.create({
  name,
  group: extra.group === undefined ? "block" : extra.group || undefined,
  content,
  defining: true,
  ...(extra.isolating ? { isolating: true } : {}),
  parseHTML() { return [{ tag: `${tag}.${cls}`, priority: 70 }]; },
  renderHTML({ HTMLAttributes }) { return [tag, mergeAttributes(HTMLAttributes, { class: cls }), 0]; },
  ...(extra.view ? { addNodeView() { return () => { const dom = document.createElement("div"); dom.className = extra.view; return { dom, contentDOM: dom }; }; } } : {}),
});

export const KbCta = simpleBlock("kbCta", "div", "kb-cta", "block+");
// Accordéon et FAQ : <details> sur la page publique ; toujours ouverts dans l'éditeur (pour pouvoir écrire dedans)
export const KbSummary = Node.create({
  name: "kbSummary",
  content: "inline*",
  defining: true,
  parseHTML() { return [{ tag: "summary" }]; },
  renderHTML() { return ["summary", {}, 0]; },
  addNodeView() { return () => { const dom = document.createElement("div"); dom.className = "kb-ed-summary"; return { dom, contentDOM: dom }; }; },
});
export const KbAccordionBody = simpleBlock("kbAccordionBody", "div", "kb-accordion-body", "block+", { group: null });
export const KbAccordion = Node.create({
  name: "kbAccordion",
  group: "block",
  content: "kbSummary kbAccordionBody",
  defining: true,
  addAttributes() { return { open: { default: false, parseHTML: (el) => el.getAttribute("data-open") === "true", renderHTML: () => ({}) } }; },
  parseHTML() { return [{ tag: "details.kb-accordion", priority: 70 }, { tag: "details", priority: 40 }]; },
  renderHTML({ node }) { return ["details", { class: "kb-accordion", ...(node.attrs.open ? { "data-open": "true" } : {}), ...lockOf(node) }, 0]; },
  addNodeView() { return () => { const dom = document.createElement("div"); dom.className = "kb-ed-accordion"; return { dom, contentDOM: dom }; }; },
});
export const KbFaqAnswer = simpleBlock("kbFaqAnswer", "div", "kb-faq-answer", "block+", { group: null });
export const KbFaqItem = Node.create({
  name: "kbFaqItem",
  content: "kbSummary kbFaqAnswer",
  defining: true,
  parseHTML() { return [{ tag: "details.kb-faq-item", priority: 80 }]; },
  renderHTML() { return ["details", { class: "kb-faq-item" }, 0]; },
  addNodeView() { return () => { const dom = document.createElement("div"); dom.className = "kb-ed-accordion kb-ed-faq-item"; return { dom, contentDOM: dom }; }; },
});
export const KbFaq = simpleBlock("kbFaq", "div", "kb-faq", "kbFaqItem+", { view: "kb-ed-faq" });

// Étapes : liste numérotée spéciale (données structurées HowTo à l'affichage)
export const KbSteps = Node.create({
  name: "kbSteps",
  group: "block list",
  content: "listItem+",
  addAttributes() { return { title: { default: "" } }; },
  parseHTML() { return [{ tag: "ol.kb-steps", priority: 70, getAttrs: (el) => ({ title: el.getAttribute("data-title") || "" }) }]; },
  renderHTML({ node }) { return ["ol", { ...(node.attrs.title ? { class: "kb-steps", "data-title": node.attrs.title } : { class: "kb-steps" }), ...lockOf(node) }, 0]; },
});

// Comparaison : 2 ou 3 colonnes (pour / contre / neutre)
export const KbCompareCol = Node.create({
  name: "kbCompareCol",
  content: "block+",
  defining: true,
  addAttributes() { return { tone: { default: "neutral" } }; },
  parseHTML() { return [{ tag: "div.kb-compare-col", priority: 80, getAttrs: (el) => ({ tone: el.getAttribute("data-tone") || "neutral" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-compare-col", "data-tone": node.attrs.tone }, 0]; },
});
export const KbCompare = simpleBlock("kbCompare", "div", "kb-compare", "kbCompareCol{2,3}");

// ---------- Mise en page : espaceur, saut de page, colonnes, groupe, groupe de boutons ----------
export const KbSpacer = Node.create({
  name: "kbSpacer",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { size: { default: "m" }, sizeMobile: { default: "" }, px: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-spacer", priority: 70, getAttrs: (el) => ({ size: el.getAttribute("data-size") || "m", sizeMobile: el.getAttribute("data-size-mobile") || "", px: el.getAttribute("data-px") || "" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-spacer", "data-size": node.attrs.size, ...(node.attrs.sizeMobile ? { "data-size-mobile": node.attrs.sizeMobile } : {}), ...(node.attrs.px ? { "data-px": node.attrs.px } : {}), ...lockOf(node) }]; },
  addNodeView() { return atomView((dom, a) => { dom.className = "kb-ed-spacer"; dom.dataset.size = a.size; if (a.px) { dom.dataset.px = a.px; dom.style.setProperty("--kb-px", `${a.px}px`); } else delete dom.dataset.px; dom.append(span("kb-ed-spacer-label", `Espace ${a.px ? `${a.px} px` : ({ s: "petit", m: "moyen", l: "grand", xl: "très grand" })[a.size] || ""}${a.sizeMobile ? ` · mobile : ${({ s: "petit", m: "moyen", l: "grand", xl: "très grand" })[a.sizeMobile]}` : ""}`)); }); },
});
export const KbPageBreak = Node.create({
  name: "kbPageBreak",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML() { return [{ tag: "div.kb-pagebreak", priority: 70 }]; },
  renderHTML({ node }) { return ["div", { class: "kb-pagebreak", ...lockOf(node) }]; },
  addNodeView() { return atomView((dom) => { dom.className = "kb-ed-pagebreak"; dom.append(span("kb-ed-pagebreak-label", "Saut de page (impression / PDF)")); }); },
});
// Conteneur dont les réglages sont des attributs data-* et le contenu modifiable
const layoutView = (cls, keys) => ({ node }) => {
  const dom = document.createElement("div");
  const paint = (n) => { dom.className = cls; for (const k of keys) { const v = n.attrs[k]; if (v) dom.dataset[k] = v; else delete dom.dataset[k]; } applyStyleAttrs(dom, n.attrs); };
  paint(node);
  return { dom, contentDOM: dom, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } };
};
const dataAttrs = (node, keys) => Object.fromEntries(keys.filter((k) => node.attrs[k]).map((k) => [`data-${k}`, node.attrs[k]]));
const readData = (el, keys) => Object.fromEntries(keys.map((k) => [k, el.getAttribute(`data-${k}`) || ""]));
export const KbColumn = Node.create({
  name: "kbColumn",
  content: "block+",
  defining: true,
  isolating: true,
  addAttributes() { return { basis: { default: "" }, valign: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-column", priority: 80, getAttrs: (el) => ({ basis: el.getAttribute("data-basis") || "", valign: el.getAttribute("data-valign") || "" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-column", ...dataAttrs(node, ["basis", "valign"]), ...lockOf(node) }, 0]; },
  addNodeView() { return ({ node }) => { const dom = document.createElement("div"); const paint = (n) => { dom.className = "kb-ed-column"; if (n.attrs.valign) dom.dataset.valign = n.attrs.valign; else delete dom.dataset.valign; }; paint(node); return { dom, contentDOM: dom, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } }; }; },
});
const COLUMN_KEYS = ["layout", "gap", "stack", "valign"];
export const KbColumns = Node.create({
  name: "kbColumns",
  group: "block",
  content: "kbColumn{2,4}",
  defining: true,
  addAttributes() { return { layout: { default: "50-50" }, gap: { default: "" }, stack: { default: "mobile" }, valign: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-columns", priority: 80, getAttrs: (el) => ({ ...readData(el, COLUMN_KEYS), stack: el.getAttribute("data-stack") || "mobile" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-columns", ...dataAttrs(node, COLUMN_KEYS), ...lockOf(node) }, 0]; },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      const paint = (n) => {
        dom.className = "kb-ed-columns";
        for (const k of COLUMN_KEYS) { const v = n.attrs[k]; if (v) dom.dataset[k] = v; else delete dom.dataset[k]; }
        applyStyleAttrs(dom, n.attrs);
        if (n.attrs.layout === "custom") dom.style.setProperty("--kb-cols", columnsTemplate(n)); else dom.style.removeProperty("--kb-cols");
      };
      paint(node);
      return { dom, contentDOM: dom, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } };
    };
  },
});
// Largeurs libres : « 30fr 70fr » ; les colonnes sans largeur se partagent le reste (même règle que le serveur)
export function columnsTemplate(node) {
  const set = []; node.forEach((c) => set.push(Number(c.attrs.basis) || 0));
  const free = set.filter((v) => !v).length;
  const rest = Math.max(5, 100 - set.reduce((a, b) => a + b, 0));
  return set.map((v) => `${v || Math.round((rest / (free || 1)) * 10) / 10}fr`).join(" ");
}
const GROUP_KEYS = ["bg", "pad", "border", "width", "variant", "layout", "justify", "gridcols", "valign"];
export const KbGroup = Node.create({
  name: "kbGroup",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() { return { bg: { default: "light" }, pad: { default: "m" }, border: { default: "" }, width: { default: "" }, layout: { default: "" }, justify: { default: "" }, gridcols: { default: "" }, valign: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-group", priority: 80, getAttrs: (el) => readData(el, GROUP_KEYS) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-group", ...dataAttrs(node, GROUP_KEYS), ...lockOf(node) }, 0]; },
  addNodeView() { return layoutView("kb-ed-group", GROUP_KEYS); },
});
export const KbButtons = Node.create({
  name: "kbButtons",
  group: "block",
  content: "kbButton+",
  defining: true,
  addAttributes() { return { align: { default: "left" } }; },
  parseHTML() { return [{ tag: "div.kb-buttons", priority: 80, getAttrs: (el) => ({ align: el.getAttribute("data-align") || "left" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-buttons", "data-align": node.attrs.align, ...lockOf(node) }, 0]; },
  addNodeView() { return layoutView("kb-ed-buttons", ["align"]); },
});
// Citation mise en avant : variante de la citation (classe kb-pullquote)
export const PullquoteAttr = Extension.create({
  name: "kbPullquote",
  addGlobalAttributes() {
    return [{ types: ["blockquote"], attributes: { pullquote: { default: false, parseHTML: (el) => el.classList.contains("kb-pullquote"), renderHTML: (a) => (a.pullquote ? { class: "kb-pullquote" } : {}) } } }];
  },
});

// ---------- Blocs réutilisables synchronisés ----------
// Repère vers un bloc enregistré : le contenu est lu sur le serveur (lecture seule ici, modifiable via « Modifier l'original »)
const reusableCache = new Map();
export const reusableContent = (ref) => {
  if (!reusableCache.has(ref)) reusableCache.set(ref, fetch(`/formateur/blog/api/blocs/${ref}`, { credentials: "same-origin", headers: { Accept: "application/json" } }).then((r) => (r.ok ? r.json() : null)).then((d) => (d ? d.block : null)).catch(() => null));
  return reusableCache.get(ref);
};
export const forgetReusable = (ref) => reusableCache.delete(ref);
export const KbReusable = Node.create({
  name: "kbReusable",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { ref: { default: "" }, name: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-reusable", priority: 80, getAttrs: (el) => (/^\d+$/.test(el.getAttribute("data-ref") || "") ? { ref: el.getAttribute("data-ref") } : false) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-reusable", "data-ref": node.attrs.ref, ...lockOf(node) }]; },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "kb-ed-reusable";
      dom.contentEditable = "false";
      const head = span("kb-ed-reusable-head", "↻ Bloc synchronisé…");
      const body = document.createElement("div");
      body.className = "kb-ed-reusable-body";
      dom.append(head, body);
      const draw = () => reusableContent(node.attrs.ref).then((b) => {
        if (!b) { head.textContent = "⚠ Bloc synchronisé introuvable (supprimé ?)"; dom.classList.add("is-missing"); body.replaceChildren(); return; }
        dom.classList.remove("is-missing");
        head.textContent = `↻ Bloc synchronisé : « ${b.name} »${b.occurrences > 1 ? ` — utilisé ${b.occurrences} fois` : ""} — le modifier le change partout`;
        body.innerHTML = b.content; // contenu déjà filtré par le serveur à l'enregistrement
      });
      // Le bloc a été modifié (bibliothèque, autre occurrence) : nouvelle version affichée aussitôt
      const onChange = (e) => { if (e.detail && String(e.detail.ref) === String(node.attrs.ref)) draw(); };
      window.addEventListener("kb-reusable-changed", onChange);
      draw();
      return { dom, destroy: () => window.removeEventListener("kb-reusable-changed", onChange) };
    };
  },
});
// Bloc synchronisé en cours de modification : contenu modifiable ; enregistré comme repère (jamais dupliqué dans l'article)
export const KbReusableEdit = Node.create({
  name: "kbReusableEdit",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,
  addAttributes() { return { ref: { default: "" }, name: { default: "" } }; },
  parseHTML() { return []; },
  renderHTML({ node }) { return ["div", { class: "kb-reusable", "data-ref": node.attrs.ref }]; },
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement("div");
      dom.className = "kb-ed-reusable is-editing";
      const head = span("kb-ed-reusable-head", `✎ Modification du bloc synchronisé « ${node.attrs.name} » — s'appliquera partout (onglet Bloc : Enregistrer / Annuler)`);
      head.contentEditable = "false";
      const body = document.createElement("div");
      dom.append(head, body);
      return { dom, contentDOM: body };
    };
  },
});

export const KbMediaTextBody = simpleBlock("kbMediaTextBody", "div", "kb-mediatext-body", "block+", { group: null });

// ---------- Blocs dynamiques (widgets) : marqueurs, le contenu réel est fabriqué par le serveur à l'affichage ----------
export const DynamicBlocks = DYNAMIC.map((d) => marker({
  name: d.name, cls: d.cls,
  attrs: Object.fromEntries(Object.entries(d.attrs).map(([key, [attr]]) => [key, attr])),
  icon: "☰",
  label: (a) => `${d.label}${d.name === "kbLatest" ? ` · ${a.count || 5} article(s)${a.category ? ` · ${a.category}` : ""}` : d.name === "kbRss" ? ` · ${a.url || "adresse du flux à compléter"}` : d.name === "kbSocial" ? ` · ${(a.links || "").split(/\s+/).filter(Boolean).length} lien(s)` : ""} · affiché sur le site`,
}));
// Valeurs par défaut à l'insertion d'un bloc dynamique
export const dynamicDefaults = (name) => { const d = DYNAMIC.find((x) => x.name === name); return d ? Object.fromEntries(Object.entries(d.attrs).map(([k, [, , def]]) => [k, def])) : {}; };

// ---------- Page suivante : découpe l'article en plusieurs pages (?page=N) ----------
export const KbNextPage = Node.create({
  name: "kbNextPage",
  group: "block",
  atom: true,
  draggable: true,
  parseHTML() { return [{ tag: "div.kb-nextpage", priority: 70 }]; },
  renderHTML({ node }) { return ["div", { class: "kb-nextpage", ...lockOf(node) }]; },
  addNodeView() { return atomView((dom) => { dom.className = "kb-ed-nextpage"; dom.append(span("kb-ed-pagebreak-label", "Page suivante : le texte qui suit s'affiche sur une nouvelle page du site")); }); },
});

// ---------- HTML personnalisé : code libre, réservé au compte créateur (signature vérifiée par le serveur, voir src/utils/customHtml.js) ----------
const b64e = (value) => { const bytes = new TextEncoder().encode(String(value)); let bin = ""; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const b64d = (value) => { try { const bin = atob(String(value).replace(/-/g, "+").replace(/_/g, "/")); return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); } catch { return ""; } };
export const KbHtml = Node.create({
  name: "kbHtml",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { code: { default: "" }, sig: { default: "" } }; },
  parseHTML() { return [{ tag: "div.kb-html", priority: 80, getAttrs: (el) => ({ code: b64d(el.getAttribute("data-code") || ""), sig: el.getAttribute("data-sig") || "" }) }]; },
  renderHTML({ node }) { return ["div", { class: "kb-html", "data-code": b64e(node.attrs.code), ...(node.attrs.sig ? { "data-sig": node.attrs.sig } : {}), ...lockOf(node) }]; },
  addNodeView() {
    return atomView((dom, a) => {
      dom.className = "kb-ed-html";
      dom.append(span("kb-ed-marker-icon", "</>"), span("kb-ed-marker-label", "HTML personnalisé · le code s'exécute sur le site publié, pas dans l'éditeur"));
      if (a.code) {
        const frame = document.createElement("iframe");
        frame.setAttribute("sandbox", ""); // aucun script, aucun accès à la page de l'éditeur
        frame.setAttribute("title", "Aperçu du code (sans scripts)");
        frame.srcdoc = a.code;
        dom.append(frame);
      }
    });
  },
});

// ---------- Note de bas de page : nœud en ligne ; le serveur numérote et rassemble les notes en fin d'article ----------
export const KbFootnote = Node.create({
  name: "kbFootnote",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() { return { note: { default: "" } }; },
  parseHTML() { return [{ tag: "sup.kb-fn", priority: 100, getAttrs: (el) => ({ note: (el.getAttribute("data-note") || "").slice(0, 500) }) }]; },
  renderHTML({ node }) { return ["sup", { class: "kb-fn", "data-note": node.attrs.note }, "*"]; },
  addNodeView() {
    return ({ node, getPos }) => {
      const dom = document.createElement("sup");
      const paint = (n) => { dom.className = "kb-ed-footnote"; dom.title = n.attrs.note || "Note vide"; dom.setAttribute("aria-label", `Note de bas de page : ${n.attrs.note || "vide"}`); dom.tabIndex = 0; dom.setAttribute("role", "button"); };
      const edit = () => dom.dispatchEvent(new CustomEvent("kb-footnote-edit", { bubbles: true, detail: { pos: getPos() } }));
      // « mousedown » et non « click » : la sélection du nœud fait apparaître la barre d'outils du bloc sous le pointeur, le relâchement du bouton tomberait dessus
      dom.addEventListener("mousedown", (e) => { if (e.button === 0) { e.preventDefault(); edit(); } });
      dom.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); edit(); } });
      paint(node);
      return { dom, update: (n) => { if (n.type !== node.type) return false; paint(n); return true; } };
    };
  },
});

export const BLOG_NODES = [...DynamicBlocks, KbNextPage, KbHtml, KbFootnote, KbMore, KbFile, KbPreformatted, KbVerse, KbCover, KbMediaTextBody, KbMediaText, KbReusable, KbReusableEdit, KbSpacer, KbPageBreak, KbColumn, KbColumns, KbGroup, KbButtons, PullquoteAttr, KbImage, KbGallery, KbVideo, KbAudio, KbEmbed, KbCourse, KbNewsletter, KbButton, Callout, KbCta, KbSummary, KbAccordionBody, KbAccordion, KbFaqAnswer, KbFaqItem, KbFaq, KbSteps, KbCompareCol, KbCompare];
