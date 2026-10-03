// Blocs de l'éditeur éditorial du blog (Tiptap). Chaque bloc produit EXACTEMENT le HTML accepté par le serveur
// (src/utils/blogHtml.js) : image, galerie, vidéo, audio, intégration, formation, newsletter, bouton, encadrés, appel à
// l'action, accordéon, FAQ, étapes, comparaison. Les blocs « à risque » (vidéo, intégration…) ne sont que des marqueurs :
// le lecteur réel est fabriqué par le serveur à l'affichage.
import { Node, mergeAttributes } from "@tiptap/core";

const WIDTHS = ["25", "33", "50", "66", "75", "100"];
const ALIGNS = ["left", "center", "right", "wide"];
export const CALLOUT_LABELS = { info: "Information", conseil: "Conseil", attention: "Attention", "a-retenir": "À retenir", "bon-a-savoir": "Bon à savoir" };

// Vue d'un bloc « atome » dans l'éditeur : une carte non modifiable au clavier (on la règle par sa fenêtre)
function atomView(build) {
  return ({ node }) => {
    const dom = document.createElement("div");
    dom.contentEditable = "false";
    const paint = (n) => { dom.replaceChildren(); build(dom, n.attrs); };
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
    return { src: { default: null }, alt: { default: "" }, title: { default: "" }, caption: { default: "" }, credit: { default: "" }, align: { default: "center" }, width: { default: "100" }, mediaId: { default: null } };
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
          };
        },
      },
      { tag: "img[src]", getAttrs: (img) => ({ src: img.getAttribute("src"), alt: img.getAttribute("alt") || "", title: img.getAttribute("title") || "" }) },
    ];
  },
  renderHTML({ node }) {
    const a = node.attrs;
    const fig = { class: "kb-image", "data-align": a.align };
    if (a.width && a.width !== "100") fig["data-width"] = a.width;
    if (a.credit) fig["data-credit"] = a.credit;
    const img = { src: a.src, alt: a.alt || "" };
    if (a.title) img.title = a.title;
    if (a.mediaId) img["data-media-id"] = String(a.mediaId);
    return a.caption ? ["figure", fig, ["img", img], ["figcaption", {}, a.caption]] : ["figure", fig, ["img", img]];
  },
  addNodeView() {
    return atomView((dom, a) => {
      dom.className = "kb-ed-image";
      dom.dataset.align = a.align;
      dom.dataset.width = a.width;
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
  addAttributes() { return { images: { default: [] }, columns: { default: "3" } }; },
  parseHTML() {
    return [{
      tag: "div.kb-gallery",
      priority: 70,
      getAttrs: (el) => ({
        columns: ["2", "3", "4"].includes(el.getAttribute("data-columns")) ? el.getAttribute("data-columns") : "3",
        images: [...el.querySelectorAll("figure")].map((f) => {
          const img = f.querySelector("img");
          return img ? { src: img.getAttribute("src"), alt: img.getAttribute("alt") || "", caption: (f.querySelector("figcaption") || { textContent: "" }).textContent.trim() } : null;
        }).filter(Boolean),
      }),
    }];
  },
  renderHTML({ node }) {
    const figures = (node.attrs.images || []).map((i) => (i.caption ? ["figure", { class: "kb-image" }, ["img", { src: i.src, alt: i.alt || "" }], ["figcaption", {}, i.caption]] : ["figure", { class: "kb-image" }, ["img", { src: i.src, alt: i.alt || "" }]]));
    return ["div", { class: "kb-gallery", "data-columns": node.attrs.columns }, ...figures];
  },
  addNodeView() {
    return atomView((dom, a) => {
      dom.className = "kb-ed-gallery";
      dom.style.setProperty("--cols", a.columns);
      for (const i of a.images || []) { const img = document.createElement("img"); img.src = i.src; img.alt = i.alt || ""; dom.append(img); }
      if (!(a.images || []).length) dom.append(span("kb-ed-empty", "Galerie vide : sélectionnez-la, puis « Ajouter des images » dans l'onglet Bloc"));
    });
  },
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
      const out = { class: cls };
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
export const KbVideo = marker({ name: "kbVideo", cls: "kb-video", attrs: { url: "data-url", caption: "data-caption" }, icon: "▶", label: (a) => `Vidéo · ${a.url || "adresse à compléter"}${a.caption ? ` · ${a.caption}` : ""}` });
export const KbAudio = marker({ name: "kbAudio", cls: "kb-audio", attrs: { src: "data-src", title: "data-title" }, icon: "♪", label: (a) => `Audio · ${a.title || a.src || "fichier à choisir"}` });
export const KbEmbed = marker({ name: "kbEmbed", cls: "kb-embed", attrs: { url: "data-url", caption: "data-caption" }, icon: "⧉", label: (a) => `Intégration · ${a.url || "adresse à compléter"} (YouTube et Vimeo deviennent un lecteur ; le reste, un lien)` });
export const KbCourse = marker({ name: "kbCourse", cls: "kb-course", attrs: { slug: "data-course" }, icon: "🎓", label: (a) => `Formation recommandée · ${a.title || a.slug || "à choisir"}` });
export const KbNewsletter = marker({ name: "kbNewsletter", cls: "kb-newsletter", attrs: {}, icon: "✉", label: () => "Inscription à la newsletter (formulaire choisi dans Blog → réglages)" });

// ---------- Bouton ----------
export const KbButton = Node.create({
  name: "kbButton",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() { return { text: { default: "Découvrir les formations" }, href: { default: "/catalogue" }, variant: { default: "primary" }, align: { default: "center" }, newTab: { default: false } }; },
  parseHTML() {
    return [{
      tag: "p.kb-button",
      priority: 70,
      getAttrs: (el) => {
        const a = el.querySelector("a");
        if (!a) return false;
        return { text: a.textContent.trim(), href: a.getAttribute("href") || "", variant: /btn-outline/.test(a.className) ? "outline" : "primary", align: el.getAttribute("data-align") || "left", newTab: a.getAttribute("target") === "_blank" };
      },
    }];
  },
  renderHTML({ node }) {
    const a = node.attrs;
    const link = { href: a.href, class: `btn btn-${a.variant === "outline" ? "outline" : "primary"}` };
    if (a.newTab) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
    return ["p", { class: "kb-button", "data-align": a.align }, ["a", link, a.text]];
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
    const out = { class: `callout callout-${node.attrs.type}`, "data-callout": node.attrs.type };
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
  parseHTML() { return [{ tag: "details.kb-accordion", priority: 70 }, { tag: "details", priority: 40 }]; },
  renderHTML() { return ["details", { class: "kb-accordion" }, 0]; },
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
  renderHTML({ node }) { return ["ol", node.attrs.title ? { class: "kb-steps", "data-title": node.attrs.title } : { class: "kb-steps" }, 0]; },
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

export const BLOG_NODES = [KbImage, KbGallery, KbVideo, KbAudio, KbEmbed, KbCourse, KbNewsletter, KbButton, Callout, KbCta, KbSummary, KbAccordionBody, KbAccordion, KbFaqAnswer, KbFaqItem, KbFaq, KbSteps, KbCompareCol, KbCompare];
