// Pages d'atterrissage (point 6 de la parité Mailchimp) : pages web publiques /p/<adresse>, faites de sections.
// Grammaire fermée (aucun HTML libre) : chaque section est validée et normalisée à l'enregistrement ; les liens ne
// peuvent viser qu'une adresse https:// ou une page du site (« /… »), les images qu'une adresse https:// ou un fichier
// de la médiathèque marketing. L'inscription passe par un formulaire publié (preuve de consentement, double
// confirmation, liste, étiquettes du formulaire) ; la page ajoute jusqu'à 5 étiquettes à ses inscrits.
// Statistiques : visites (visiteurs uniques par jour, empreinte non réversible, robots exclus), clics, inscriptions.
const crypto = require("crypto");
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { getCourse } = require("../bridge/catalog");

const MAX_SECTIONS = 30;
const MAX_TAGS = 5;
const STATUSES = { draft: "Brouillon", published: "En ligne", unpublished: "Hors ligne" };
const SECTION_TYPES = {
  hero: "Bandeau (titre, sous-titre, image, bouton)", text: "Texte", image: "Image", list: "Liste de points forts",
  course: "Formation du catalogue", button: "Bouton", quote: "Citation ou témoignage", form: "Formulaire d'inscription",
};
const DEFAULT_THEME = { accent: "#0277b6", background: "#f3f8fc", text: "#10222f" };
const HEX = /^#[0-9a-f]{6}$/i;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|monitor/i;

const bad = (message) => new MarketingError("invalid_field", message);
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const line = (v, max) => clean(v, max).replace(/\s+/g, " ");

// Lien : https://… ou chemin du site (« /catalogue ») ; jamais javascript:, data:, http:// en clair ni « //autre-site »
function linkUrl(v, label) {
  const url = line(v, 2000);
  if (!url) return "";
  if (/^\/(?!\/)[^\s<>"'`\\]*$/.test(url)) return url;
  if (/^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(url)) return url;
  throw bad(`${label} : l'adresse doit commencer par https:// ou être une page du site (« /catalogue »).`);
}
// Image : https://… ou fichier de la médiathèque marketing (/uploads/marketing/…)
function imageUrl(v, label) {
  const url = line(v, 2000);
  if (!url) return "";
  if (/^\/uploads\/marketing\/\d+\/[A-Za-z0-9._-]+$/.test(url)) return url;
  if (/^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(url)) return url;
  throw bad(`${label} : l'image doit venir de la médiathèque ou d'une adresse https://.`);
}

function normalizeSection(ctx, raw, i) {
  if (!raw || typeof raw !== "object") throw bad(`Section ${i + 1} : invalide.`);
  const at = `Section ${i + 1}`;
  switch (raw.type) {
    case "hero": {
      const title = line(raw.title, 150);
      if (!title) throw bad(`${at} (bandeau) : le titre est obligatoire.`);
      const buttonLabel = line(raw.buttonLabel, 60), buttonUrl = linkUrl(raw.buttonUrl, `${at} (bouton du bandeau)`);
      if (Boolean(buttonLabel) !== Boolean(buttonUrl)) throw bad(`${at} (bandeau) : un bouton a besoin d'un texte ET d'une adresse.`);
      return { type: "hero", title, subtitle: clean(raw.subtitle, 300), image: imageUrl(raw.image, `${at} (image du bandeau)`), imageAlt: line(raw.imageAlt, 200), buttonLabel, buttonUrl };
    }
    case "text": {
      const markdown = clean(raw.markdown, 10000);
      if (!markdown) throw bad(`${at} (texte) : le texte est vide.`);
      return { type: "text", markdown };
    }
    case "image": {
      const src = imageUrl(raw.src, `${at} (image)`);
      if (!src) throw bad(`${at} (image) : choisissez une image.`);
      const alt = line(raw.alt, 200);
      if (!alt) throw bad(`${at} (image) : décrivez l'image (texte alternatif, pour les lecteurs d'écran).`);
      return { type: "image", src, alt, caption: line(raw.caption, 200), link: linkUrl(raw.link, `${at} (lien de l'image)`) };
    }
    case "list": {
      const items = (Array.isArray(raw.items) ? raw.items : String(raw.items || "").split("\n")).map((x) => line(x, 200)).filter(Boolean).slice(0, 20);
      if (!items.length) throw bad(`${at} (liste) : ajoutez au moins un point (un par ligne).`);
      return { type: "list", title: line(raw.title, 150), items };
    }
    case "course": {
      const courseId = Number(raw.courseId);
      const course = Number.isInteger(courseId) ? getCourse(ctx, courseId) : null;
      if (!course) throw bad(`${at} (formation) : choisissez une formation publiée du catalogue.`);
      return { type: "course", courseId, cta: line(raw.cta, 60) || "Découvrir la formation" };
    }
    case "button": {
      const label = line(raw.label, 60), url = linkUrl(raw.url, `${at} (bouton)`);
      if (!label || !url) throw bad(`${at} (bouton) : un texte et une adresse sont obligatoires.`);
      return { type: "button", label, url, align: ["left", "center"].includes(raw.align) ? raw.align : "center" };
    }
    case "quote": {
      const text = clean(raw.text, 600);
      if (!text) throw bad(`${at} (citation) : le texte est vide.`);
      return { type: "quote", text, author: line(raw.author, 120) };
    }
    case "form":
      return { type: "form", heading: line(raw.heading, 150) || "Inscrivez-vous", intro: clean(raw.intro, 400) };
    default:
      throw bad(`${at} : type inconnu.`);
  }
}

const parse = (row) => (row ? { ...row, sections: JSON.parse(row.sections || "[]"), theme: { ...DEFAULT_THEME, ...JSON.parse(row.theme || "{}") }, tags: JSON.parse(row.tags || "[]") } : null);
function getPage(ctx, id) {
  checkCtx(ctx);
  return parse(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requirePage(ctx, id) {
  const p = getPage(ctx, id);
  if (!p) throw new MarketingError("not_found", "Page introuvable.");
  return p;
}
function getPublishedPage(db, slug) {
  return parse(SLUG.test(String(slug || "")) ? db.prepare("SELECT * FROM mk_landing_pages WHERE slug = ? AND status = 'published'").get(slug) : null);
}
function listPages(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT p.*,
      (SELECT COUNT(DISTINCT visitor) FROM mk_landing_events e WHERE e.page_id = p.id AND e.type = 'view') AS visitors,
      (SELECT COUNT(*) FROM mk_landing_events e WHERE e.page_id = p.id AND e.type = 'signup') AS signups
    FROM mk_landing_pages p WHERE p.organization_id = ? ORDER BY p.updated_at DESC, p.id DESC`).all(ctx.organizationId).map(parse);
}

function slugify(text) {
  return String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "") || "page";
}
function freeSlug(ctx, base, exceptId = null) {
  let slug = base, n = 2;
  while (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE slug = ? AND id IS NOT ?").get(slug, exceptId)) slug = `${base.slice(0, 55)}-${n++}`;
  return slug;
}

function createPage(ctx, { name } = {}) {
  checkCtx(ctx);
  const clean_ = line(name, 100);
  if (!clean_) throw bad("Le nom de la page est obligatoire.");
  if (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, clean_)) throw new MarketingError("duplicate", "Une page porte déjà ce nom.");
  const sections = [{ type: "hero", title: clean_, subtitle: "Une phrase qui dit clairement ce que la personne y gagne.", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }, { type: "form", heading: "Inscrivez-vous", intro: "" }];
  const id = Number(ctx.db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, clean_, freeSlug(ctx, slugify(clean_)), clean_, JSON.stringify(sections), ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "landing.created", "landing", id, {});
  return getPage(ctx, id);
}

// Enregistrement complet (réglages + sections dans l'ordre donné). Une page en ligne est mise à jour immédiatement.
function savePage(ctx, id, input = {}) {
  const page = requirePage(ctx, id);
  const name = line(input.name, 100);
  if (!name) throw bad("Le nom de la page est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name);
  if (dup && dup.id !== id) throw new MarketingError("duplicate", "Une page porte déjà ce nom.");
  const slug = line(input.slug, 60).toLowerCase();
  if (!SLUG.test(slug)) throw bad("Adresse de la page : lettres minuscules sans accent, chiffres et tirets (ex. « guide-gratuit »).");
  if (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE slug = ? AND id <> ?").get(slug, id)) throw new MarketingError("duplicate", `L'adresse « /p/${slug} » est déjà utilisée par une autre page.`);
  const title = line(input.title, 120) || name;
  const description = line(input.description, 300);
  const rawSections = Array.isArray(input.sections) ? input.sections : [];
  if (rawSections.length > MAX_SECTIONS) throw bad(`Trop de sections (${MAX_SECTIONS} au plus).`);
  const sections = rawSections.map((s, i) => normalizeSection(ctx, s, i));
  const theme = {};
  for (const k of Object.keys(DEFAULT_THEME)) theme[k] = HEX.test(String(input.theme && input.theme[k] || "")) ? input.theme[k].toLowerCase() : DEFAULT_THEME[k];
  let formId = null;
  if (input.formId !== undefined && input.formId !== null && input.formId !== "") {
    formId = Number(input.formId);
    const form = ctx.db.prepare("SELECT id FROM mk_forms WHERE id = ? AND organization_id = ?").get(formId, ctx.organizationId);
    if (!form) throw bad("Formulaire d'inscription introuvable.");
  }
  const tags = [...new Set((Array.isArray(input.tags) ? input.tags : String(input.tags || "").split(",")).map((t) => line(t, 64)).filter(Boolean))];
  if (tags.length > MAX_TAGS) throw bad(`${MAX_TAGS} étiquettes au plus.`);
  ctx.db.prepare("UPDATE mk_landing_pages SET name = ?, slug = ?, title = ?, description = ?, sections = ?, theme = ?, form_id = ?, tags = ?, indexable = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, slug, title, description, JSON.stringify(sections), JSON.stringify(theme), formId, JSON.stringify(tags), input.indexable ? 1 : 0, id);
  audit(ctx, "landing.saved", "landing", id, { sections: sections.length, published: page.status === "published" });
  return getPage(ctx, id);
}

// Vérifications avant publication : contenu présent, formulaire publié si la page a une section d'inscription
function preflight(ctx, page) {
  const errors = [];
  if (!page.sections.length) errors.push("La page ne contient aucune section.");
  if (page.sections.some((s) => s.type === "form")) {
    const form = page.form_id ? ctx.db.prepare("SELECT status, name FROM mk_forms WHERE id = ? AND organization_id = ?").get(page.form_id, ctx.organizationId) : null;
    if (!form) errors.push("La section d'inscription a besoin d'un formulaire : choisissez-en un dans les réglages de la page.");
    else if (form.status !== "published") errors.push(`Le formulaire « ${form.name} » n'est pas publié : publiez-le d'abord (Audience → Formulaires d'inscription).`);
  }
  for (const s of page.sections) if (s.type === "course" && !getCourse(ctx, s.courseId)) errors.push("Une section « formation » vise une formation qui n'est plus publiée.");
  return { ready: errors.length === 0, errors };
}
function publishPage(ctx, id) {
  const page = requirePage(ctx, id);
  const check = preflight(ctx, page);
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.join(" "));
  ctx.db.prepare("UPDATE mk_landing_pages SET status = 'published', published_at = COALESCE(published_at, datetime('now')), updated_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "landing.published", "landing", id, { slug: page.slug });
  return getPage(ctx, id);
}
function unpublishPage(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("UPDATE mk_landing_pages SET status = 'unpublished', updated_at = datetime('now') WHERE id = ?").run(id);
  audit(ctx, "landing.unpublished", "landing", id, {});
}
function deletePage(ctx, id) {
  requirePage(ctx, id);
  ctx.db.prepare("DELETE FROM mk_landing_pages WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "landing.deleted", "landing", id, {});
}

// Données d'affichage : formations relues dans le catalogue (titre, prix, image, adresse à jour)
function viewModel(ctx, page) {
  const sections = page.sections.map((s) => {
    if (s.type !== "course") return s;
    const c = getCourse(ctx, s.courseId);
    if (!c) return null; // formation dépubliée depuis : la section disparaît (jamais un lien mort)
    return { ...s, course: { title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "" } };
  }).filter(Boolean);
  return { ...page, sections };
}
// Liens cliquables d'une page AFFICHÉE (viewModel), dans l'ordre : le même calcul sert au rendu et à /p/<adresse>/clic/<n>
function linksOf(page) {
  const out = [];
  page.sections.forEach((s, i) => {
    if (s.type === "hero" && s.buttonUrl) out.push({ section: i, label: s.buttonLabel, url: s.buttonUrl });
    if (s.type === "button") out.push({ section: i, label: s.label, url: s.url });
    if (s.type === "image" && s.link) out.push({ section: i, label: `Image : ${s.alt}`, url: s.link });
    if (s.type === "course" && s.course) out.push({ section: i, label: `Formation : ${s.course.title}`, url: s.course.url });
  });
  return out;
}

// ---------- Statistiques ----------
// Empreinte de visiteur : non réversible, change chaque jour (aucune adresse IP conservée, aucun cookie)
function visitorOf(req, secret) {
  const day = new Date().toISOString().slice(0, 10);
  return crypto.createHmac("sha256", String(secret || "kolakisa")).update(`${req.ip}|${req.get("user-agent") || ""}|${day}`).digest("hex").slice(0, 32);
}
const isBot = (req) => !req.get("user-agent") || BOT.test(req.get("user-agent"));
function record(db, page, type, visitor, target = "", now = Date.now()) {
  db.prepare("INSERT INTO mk_landing_events (organization_id, page_id, type, visitor, target, occurred_at) VALUES (?, ?, ?, ?, ?, ?)").run(page.organization_id, page.id, type, visitor, String(target).slice(0, 200), now);
}
function pageReport(ctx, id, { days = 30, now = Date.now() } = {}) {
  requirePage(ctx, id);
  const since = now - days * 86400000;
  const one = (sql, ...a) => ctx.db.prepare(sql).get(...a);
  const views = one("SELECT COUNT(*) n, COUNT(DISTINCT visitor) u FROM mk_landing_events WHERE page_id = ? AND type = 'view' AND occurred_at >= ?", id, since);
  const signups = one("SELECT COUNT(*) n FROM mk_landing_events WHERE page_id = ? AND type = 'signup' AND occurred_at >= ?", id, since).n;
  const clicks = ctx.db.prepare("SELECT target, COUNT(*) n, COUNT(DISTINCT visitor) u FROM mk_landing_events WHERE page_id = ? AND type = 'click' AND occurred_at >= ? GROUP BY target ORDER BY n DESC").all(id, since);
  const total = one("SELECT COUNT(DISTINCT visitor) u, (SELECT COUNT(*) FROM mk_landing_events WHERE page_id = ? AND type = 'signup') s FROM mk_landing_events WHERE page_id = ? AND type = 'view'", id, id);
  return { days, views: views.n, visitors: views.u, signups, conversion: views.u ? Math.round((signups / views.u) * 1000) / 10 : null, clicks, allTime: { visitors: total.u, signups: total.s } };
}

module.exports = {
  createPage, savePage, getPage, requirePage, getPublishedPage, listPages, publishPage, unpublishPage, deletePage, preflight, viewModel, linksOf,
  visitorOf, isBot, record, pageReport, normalizeSection, slugify, SECTION_TYPES, STATUSES, DEFAULT_THEME, MAX_TAGS,
};
