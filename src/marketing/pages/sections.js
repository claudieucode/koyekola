// Grammaire des sections de page : UNE seule source pour les pages d'atterrissage, les pages des sites (Site Web) et les
// étapes des tunnels (Tunnels). Grammaire fermée (aucun HTML libre) : chaque section est validée et normalisée à
// l'enregistrement ; les liens ne visent qu'une adresse https:// ou une page du site (« /… »), les images qu'une adresse
// https:// ou un fichier de la médiathèque marketing.
// Chaque type est déclaré dans le registre TYPES (libellé + normalisation) : un nouveau type s'ajoute ici, sans toucher
// au reste du moteur.
const crypto = require("crypto");
const { MarketingError } = require("../errors");
const { getCourse } = require("../bridge/catalog");
const { parseVideoUrl } = require("../../utils/video");
const nodes = require("./nodes");

const MAX_SECTIONS = 30;
const bad = (message) => new MarketingError("invalid_field", message);
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const line = (v, max) => clean(v, max).replace(/\s+/g, " ");

// Lien : https://… ou chemin du site (« /catalogue ») ; jamais javascript:, data:, http:// en clair ni « //autre-site »
function linkUrl(v, label) {
  const url = line(v, 2000);
  if (!url) return "";
  if (/^\/(?!\/)[^\s<>"'`\\]*$/.test(url)) return url;
  if (/^#[a-z][a-z0-9-]{0,39}$/.test(url)) return url; // ancre d'un élément de la même page
  if (/^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(url)) return url;
  throw bad(`${label} : l'adresse doit commencer par https://, être une page du site (« /catalogue ») ou une ancre de la page (« #tarifs »).`);
}
// Image : https://…, fichier de la médiathèque marketing (/uploads/marketing/…) ou de la médiathèque du site
// (/uploads/thumbnails/…, images publiques du blog et du Centre de gestion)
function imageUrl(v, label) {
  const url = line(v, 2000);
  if (!url) return "";
  if (/^\/uploads\/marketing\/\d+\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?[A-Za-z0-9._-]+$/.test(url)) return url;
  if (/^\/uploads\/thumbnails\/[A-Za-z0-9._-]+$/.test(url)) return url;
  if (/^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(url)) return url;
  throw bad(`${label} : l'image doit venir de la médiathèque ou d'une adresse https://.`);
}

// Liste d'éléments (cartes, questions, témoignages) : tableau d'objets, borné
// (au plus 100 lus ; la limite du type s'applique APRÈS le retrait des éléments vides)
const listOf = (v) => (Array.isArray(v) ? v : []).filter((x) => x && typeof x === "object").slice(0, 100);

const TYPES = {
  hero: {
    label: "Bandeau (titre, sous-titre, image, bouton)",
    normalize(ctx, raw, at) {
      const title = line(raw.title, 150);
      if (!title) throw bad(`${at} (bandeau) : le titre est obligatoire.`);
      const buttonLabel = line(raw.buttonLabel, 60), buttonUrl = linkUrl(raw.buttonUrl, `${at} (bouton du bandeau)`);
      if (Boolean(buttonLabel) !== Boolean(buttonUrl)) throw bad(`${at} (bandeau) : un bouton a besoin d'un texte ET d'une adresse.`);
      return { type: "hero", title, subtitle: clean(raw.subtitle, 300), image: imageUrl(raw.image, `${at} (image du bandeau)`), imageAlt: line(raw.imageAlt, 200), buttonLabel, buttonUrl };
    },
  },
  text: {
    label: "Texte",
    normalize(ctx, raw, at) {
      const markdown = clean(raw.markdown, 10000);
      if (!markdown) throw bad(`${at} (texte) : le texte est vide.`);
      return { type: "text", markdown };
    },
  },
  image: {
    label: "Image",
    normalize(ctx, raw, at) {
      const src = imageUrl(raw.src, `${at} (image)`);
      if (!src) throw bad(`${at} (image) : choisissez une image.`);
      const alt = line(raw.alt, 200);
      if (!alt) throw bad(`${at} (image) : décrivez l'image (texte alternatif, pour les lecteurs d'écran).`);
      return { type: "image", src, alt, caption: line(raw.caption, 200), link: linkUrl(raw.link, `${at} (lien de l'image)`) };
    },
  },
  list: {
    label: "Liste de points forts",
    normalize(ctx, raw, at) {
      const items = (Array.isArray(raw.items) ? raw.items : String(raw.items || "").split("\n")).map((x) => line(x, 200)).filter(Boolean).slice(0, 20);
      if (!items.length) throw bad(`${at} (liste) : ajoutez au moins un point (un par ligne).`);
      return { type: "list", title: line(raw.title, 150), items };
    },
  },
  course: {
    label: "Formation du catalogue",
    normalize(ctx, raw, at) {
      const courseId = Number(raw.courseId);
      const course = Number.isInteger(courseId) ? getCourse(ctx, courseId) : null;
      if (!course) throw bad(`${at} (formation) : choisissez une formation publiée du catalogue.`);
      return { type: "course", courseId, cta: line(raw.cta, 60) || "Découvrir la formation" };
    },
  },
  button: {
    label: "Bouton",
    normalize(ctx, raw, at) {
      const label = line(raw.label, 60), url = linkUrl(raw.url, `${at} (bouton)`);
      if (!label || !url) throw bad(`${at} (bouton) : un texte et une adresse sont obligatoires.`);
      return { type: "button", label, url, align: ["left", "center"].includes(raw.align) ? raw.align : "center" };
    },
  },
  quote: {
    label: "Citation ou témoignage",
    normalize(ctx, raw, at) {
      const text = clean(raw.text, 600);
      if (!text) throw bad(`${at} (citation) : le texte est vide.`);
      return { type: "quote", text, author: line(raw.author, 120) };
    },
  },
  form: {
    label: "Formulaire d'inscription",
    normalize(ctx, raw) {
      return { type: "form", heading: line(raw.heading, 150) || "Inscrivez-vous", intro: clean(raw.intro, 400) };
    },
  },
  features: {
    label: "Points forts en cartes",
    normalize(ctx, raw, at) {
      const items = listOf(raw.items).map((it) => ({ title: line(it && it.title, 80), text: clean(it && it.text, 400) })).filter((it) => it.title || it.text).slice(0, 12);
      if (!items.length) throw bad(`${at} (points forts) : ajoutez au moins une carte.`);
      return { type: "features", title: line(raw.title, 150), intro: clean(raw.intro, 400), columns: [2, 3, 4].includes(Number(raw.columns)) ? Number(raw.columns) : 3, items };
    },
  },
  faq: {
    label: "Questions fréquentes",
    normalize(ctx, raw, at) {
      const items = listOf(raw.items).map((it) => ({ q: line(it && it.q, 200), a: clean(it && it.a, 2000) })).filter((it) => it.q || it.a).slice(0, 20);
      if (!items.length) throw bad(`${at} (questions fréquentes) : ajoutez au moins une question.`);
      if (items.some((it) => !it.q || !it.a)) throw bad(`${at} (questions fréquentes) : chaque question a besoin d'une réponse.`);
      return { type: "faq", title: line(raw.title, 150) || "Questions fréquentes", items };
    },
  },
  cta: {
    label: "Appel à l'action",
    normalize(ctx, raw, at) {
      const title = line(raw.title, 150);
      const buttonLabel = line(raw.buttonLabel, 60), buttonUrl = linkUrl(raw.buttonUrl, `${at} (bouton de l'appel à l'action)`);
      if (!title) throw bad(`${at} (appel à l'action) : le titre est obligatoire.`);
      if (!buttonLabel || !buttonUrl) throw bad(`${at} (appel à l'action) : un bouton (texte et adresse) est obligatoire.`);
      return { type: "cta", title, text: clean(raw.text, 400), buttonLabel, buttonUrl };
    },
  },
  video: {
    label: "Vidéo",
    normalize(ctx, raw, at) {
      const url = line(raw.url, 500);
      const v = url ? parseVideoUrl(url) : null;
      if (!v || !["youtube", "vimeo", "file"].includes(v.kind) || !/^https:/i.test(v.src || "")) throw bad(`${at} (vidéo) : une adresse YouTube, Vimeo ou de fichier vidéo en https://.`);
      const title = line(raw.title, 150);
      if (!title) throw bad(`${at} (vidéo) : donnez un titre à la vidéo (lu par les lecteurs d'écran).`);
      return { type: "video", url, title, caption: line(raw.caption, 200) };
    },
  },
  testimonials: {
    label: "Témoignages",
    normalize(ctx, raw, at) {
      const items = listOf(raw.items).map((it) => ({ text: clean(it && it.text, 600), author: line(it && it.author, 120), role: line(it && it.role, 120) })).filter((it) => it.text).slice(0, 12);
      if (!items.length) throw bad(`${at} (témoignages) : ajoutez au moins un témoignage.`);
      return { type: "testimonials", title: line(raw.title, 150), items };
    },
  },
  divider: {
    label: "Séparateur ou espace",
    normalize(ctx, raw) {
      return { type: "divider", line: raw.line !== false && raw.line !== "false", size: ["sm", "md", "lg"].includes(raw.size) ? raw.size : "md" };
    },
  },
  // Composant réutilisable inséré « synchronisé » : seule la référence est enregistrée ; l'affichage reprend toujours
  // la dernière version du composant (voir components.js)
  // Section libre (Page Builder) : un arbre d'éléments imbriqués (conteneurs, colonnes, titres, boutons…), voir nodes.js
  layout: {
    label: "Section libre",
    builderOnly: true, // ajoutée par le Page Builder (palette d'éléments), pas par la liste des types de section
    normalize(ctx, raw, at, counter) {
      const h = { ctx, imageUrl, linkUrl, iconNames: nodes.iconNames() };
      const kids = Array.isArray(raw.children) ? raw.children : [];
      try {
        return { type: "layout", children: kids.map((c, i) => nodes.normalizeNode(c, `${at} › élément ${i + 1}`, h, 1, counter || { n: 0, ids: new Set() })) };
      } catch (error) {
        if (error instanceof MarketingError) throw error;
        throw bad(error.message);
      }
    },
  },
  component: {
    label: "Composant réutilisable",
    builderOnly: true,
    normalize(ctx, raw, at) {
      const componentId = Number(raw.componentId);
      const ok = Number.isInteger(componentId) && ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE id = ? AND organization_id = ?").get(componentId, ctx.organizationId);
      if (!ok) throw bad(`${at} (composant) : composant introuvable.`);
      return { type: "component", componentId };
    },
  },
};
// Types proposés dans l'éditeur des pages d'atterrissage actuel (le composant n'y a pas encore d'interface)
const SECTION_TYPES = Object.fromEntries(Object.entries(TYPES).filter(([, t]) => !t.builderOnly).map(([k, t]) => [k, t.label]));

// ---------- Attributs communs (éditeur visuel) ----------
// Présents seulement s'ils sont fournis : une section des pages d'atterrissage actuelles reste exactement identique.
const SECTION_ID = /^[a-z0-9]{6,20}$/;
const BREAKPOINTS = ["desktop", "tablet", "mobile"];
const STYLE = {
  padding: ["none", "sm", "md", "lg", "xl"],            // espacements du design system (tokens.js)
  background: ["default", "surface", "primary", "accent", "dark"],
  align: ["left", "center", "right"],
  width: ["narrow", "normal", "wide", "full"],
};
function common(raw, at = "Section") {
  const out = {};
  if (raw.id !== undefined) {
    if (!SECTION_ID.test(String(raw.id))) throw bad("Identifiant de section invalide.");
    out.id = String(raw.id);
  }
  if (raw.name !== undefined && line(raw.name, 60)) out.name = line(raw.name, 60);
  if (raw.hidden === true) out.hidden = true;
  if (raw.locked === true) out.locked = true;
  if (Array.isArray(raw.hideOn)) {
    const hideOn = [...new Set(raw.hideOn.filter((b) => BREAKPOINTS.includes(b)))];
    if (hideOn.length === BREAKPOINTS.length) throw bad("Une section ne peut pas être masquée sur tous les écrans (utilisez « Masquer »).");
    if (hideOn.length) out.hideOn = hideOn;
  }
  if (raw.style && typeof raw.style === "object") {
    const style = {};
    for (const [k, allowed] of Object.entries(STYLE)) if (allowed.includes(raw.style[k])) style[k] = raw.style[k];
    if (Object.keys(style).length) out.style = style;
  }
  // Personnalisation : public d'affichage de la section
  if (raw.audience) {
    try {
      const a = nodes.normalizeAudience(raw.audience, at);
      if (a) out.audience = a;
    } catch (error) {
      throw bad(error.message);
    }
  }
  // Styles visuels libres mais validés (Page Builder) : par écran et par état, sur toute section
  if (raw.styles || raw.states) {
    try {
      const st = nodes.normalizeStyles(raw.styles, raw.states, at, { imageUrl, linkUrl });
      if (st.styles) out.styles = st.styles;
      if (st.states) out.states = st.states;
    } catch (error) {
      if (error instanceof MarketingError) throw error;
      throw bad(error.message);
    }
  }
  return out;
}

function normalizeSection(ctx, raw, i, counter) {
  if (!raw || typeof raw !== "object") throw bad(`Section ${i + 1} : invalide.`);
  const def = Object.hasOwn(TYPES, raw.type) ? TYPES[raw.type] : null;
  if (!def) throw bad(`Section ${i + 1} : type inconnu.`);
  return { ...def.normalize(ctx, raw, `Section ${i + 1}`, counter), ...common(raw, `Section ${i + 1}`) };
}

// Une interaction (« au clic, afficher tel élément ») dont la cible n'existe plus ne peut rien faire ; pire, un élément « masqué au
// chargement » dont l'interaction a disparu resterait caché pour toujours. Elles sont écartées à l'enregistrement, avec un avertissement
// non bloquant (l'éditeur retire la même interaction de son document, voir healIgnored).
function pruneDanglingInteractions(nodes, known, ctx) {
  const walk = (list) => (list || []).forEach((n) => {
    if (n && Array.isArray(n.interactions)) {
      const kept = n.interactions.filter((x) => known.has(x.target));
      n.interactions.filter((x) => !known.has(x.target)).forEach((x) => {
        const w = ctx && ctx.__warnings;
        if (Array.isArray(w) && w.length < 50) w.push({ kind: "interaction_target", nodeId: n.id, target: x.target, message: "Une interaction visait un élément qui n'existe plus : elle a été retirée." });
      });
      if (kept.length) n.interactions = kept; else delete n.interactions;
    }
    walk(n && n.children);
  });
  walk(nodes);
}

function normalizeSections(ctx, list) {
  const raw = Array.isArray(list) ? list : [];
  if (raw.length > MAX_SECTIONS) throw bad(`Trop de sections (${MAX_SECTIONS} au plus).`);
  const counter = { n: 0, ids: new Set() }; // éléments des sections libres : nombre total et identifiants uniques
  const out = raw.map((s, i) => normalizeSection(ctx, s, i, counter));
  const ids = out.map((s) => s.id).filter(Boolean);
  if (new Set(ids).size !== ids.length) throw bad("Deux sections portent le même identifiant.");
  if (ids.some((id) => counter.ids.has(id))) throw bad("Une section et un élément portent le même identifiant.");
  pruneDanglingInteractions(out, new Set([...ids, ...counter.ids]), ctx);
  return out;
}

const newSectionId = () => crypto.randomBytes(6).toString("hex");

module.exports = { TYPES, SECTION_TYPES, MAX_SECTIONS, BREAKPOINTS, STYLE, normalizeSection, normalizeSections, newSectionId, linkUrl, imageUrl, clean, line, bad };
