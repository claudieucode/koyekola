// Tunnels (phase 8) : une suite ordonnée d'étapes, chacune un VRAI objet du logiciel :
//  - une page du moteur commun (même éditeur visuel que Site Web, même adresse /p/<adresse>) ;
//  - ou une formation publiée du catalogue (sa vraie page /cours/<adresse>).
// Le tunnel ne recopie rien : l'étape pointe vers la page. Une page n'appartient qu'à un seul tunnel actif, pour que
// « l'étape suivante » soit toujours sans ambiguïté. Les boutons d'une page dont l'adresse est /etape-suivante mènent à
// l'étape suivante du tunnel ; après une inscription, le visiteur y est conduit aussi.
// Les étapes de paiement (bon de commande, offre complémentaire, offre supérieure, offre de repli) arrivent avec le
// paiement (phase 9) : elles ne sont pas proposées avant d'exister.
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { transaction } = require("../db/tx");
const { line, bad, newSectionId } = require("../pages/sections");
const { getCourse, listCourses } = require("../bridge/catalog");
const pages = require("../pages");

const NEXT_URL = "/etape-suivante";
const MAX_STEPS = 30;

// Types d'étapes disponibles. `template` : gabarit de page proposé pour une nouvelle page ; `course` : étape formation ;
// `advances` : une nouvelle page de ce type sans formulaire reçoit un bouton vers l'étape suivante.
const STEP_TYPES = {
  landing: { label: "Page d'atterrissage", template: "inscription", advances: true },
  optin: { label: "Capture de prospects", template: "lead" },
  page: { label: "Page du site", template: null, advances: true },
  sales: { label: "Page de vente", template: "vente", advances: true },
  product: { label: "Page produit", template: "produit", advances: true },
  webinar: { label: "Webinaire", template: "webinaire" },
  download: { label: "Téléchargement", template: "telechargement" },
  thankyou: { label: "Remerciement", template: "merci" },
  course: { label: "Formation (LMS)", course: true },
  custom: { label: "Étape personnalisée", template: null, advances: true },
};

// ---------- Lecture ----------

function getFunnel(ctx, id) {
  checkCtx(ctx);
  const f = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_funnels WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  if (!f) return null;
  const steps = ctx.db.prepare(`SELECT s.*, p.name AS page_name, p.slug AS page_slug, p.status AS page_status, p.archived_at AS page_archived, p.draft IS NOT NULL AS page_has_draft
      FROM mk_funnel_steps s LEFT JOIN mk_landing_pages p ON p.id = s.page_id WHERE s.funnel_id = ? ORDER BY s.position, s.id`).all(f.id)
    .map((s) => describeStep(ctx, s));
  return { ...f, steps };
}
function requireFunnel(ctx, id, { active = false } = {}) {
  const f = getFunnel(ctx, Number(id));
  if (!f) throw new MarketingError("not_found", "Tunnel introuvable.");
  if (active && f.status !== "active") throw bad("Ce tunnel est archivé : restaurez-le d'abord.");
  return f;
}

// État réel d'une étape : où elle mène, si elle est visible du public, ce qui manque
function describeStep(ctx, s) {
  const type = STEP_TYPES[s.type] || { label: s.type };
  const out = { id: s.id, position: s.position, type: s.type, typeLabel: type.label, name: s.name, pageId: s.page_id, courseId: s.course_id, path: null, live: false, problem: null };
  if (type.course) {
    const c = getCourse(ctx, s.course_id);
    if (!c) out.problem = "La formation n'est plus publiée : choisissez-en une autre ou retirez l'étape.";
    else Object.assign(out, { courseTitle: c.title, path: `/cours/${encodeURIComponent(c.slug)}`, live: true });
  } else if (!s.page_id) out.problem = "La page de cette étape a été supprimée : retirez l'étape ou recréez une page.";
  else {
    Object.assign(out, { pageName: s.page_name, pageSlug: s.page_slug, pageStatus: s.page_status, pageHasDraft: Boolean(s.page_has_draft), path: `/p/${s.page_slug}` });
    if (s.page_archived) out.problem = "La page est archivée : restaurez-la (Site Web → Pages) pour que l'étape fonctionne.";
    else if (s.page_status !== "published") out.problem = "Page pas encore en ligne : les visiteurs ne peuvent pas atteindre cette étape.";
    else out.live = true;
  }
  return out;
}

function listFunnels(ctx, { archived = false } = {}) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT f.*, (SELECT COUNT(*) FROM mk_funnel_steps s WHERE s.funnel_id = f.id) AS steps
    FROM mk_funnels f WHERE f.organization_id = ? AND f.status = ? ORDER BY f.updated_at DESC, f.id DESC`).all(ctx.organizationId, archived ? "archived" : "active");
}

// ---------- Tunnels ----------

function cleanName(name) {
  const n = line(name, 100);
  if (!n) throw bad("Le nom du tunnel est obligatoire.");
  return n;
}
function assertFreeName(ctx, name, exceptId = null) {
  const dup = ctx.db.prepare("SELECT id FROM mk_funnels WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name);
  if (dup && dup.id !== exceptId) throw new MarketingError("duplicate", "Un tunnel porte déjà ce nom.");
}
function freeName(ctx, table, base) {
  let name = base.slice(0, 100), n = 2;
  while (ctx.db.prepare(`SELECT 1 FROM ${table} WHERE organization_id = ? AND name = ? COLLATE NOCASE`).get(ctx.organizationId, name)) name = `${base.slice(0, 90)} (${n++})`;
  return name;
}

function createFunnel(ctx, { name, description = "", template = null } = {}) {
  checkCtx(ctx);
  const n = cleanName(name);
  assertFreeName(ctx, n);
  const tpl = template ? require("./templates").get(template) : null;
  if (template && !tpl) throw bad("Modèle de tunnel inconnu.");
  if (tpl && tpl.requiresCourse && !listCourses(ctx).length) throw bad("Ce modèle mène à une formation : publiez d'abord une formation dans le catalogue.");
  return transaction(ctx.db, () => {
    const id = Number(ctx.db.prepare("INSERT INTO mk_funnels (organization_id, name, description, template, created_by) VALUES (?, ?, ?, ?, ?)")
      .run(ctx.organizationId, n, line(description, 300), tpl ? tpl.key : null, ctx.userId ?? null).lastInsertRowid);
    if (tpl) for (const st of tpl.steps) {
      addStep(ctx, id, st.type === "course" ? { type: "course", name: st.name, courseId: listCourses(ctx)[0].id } : { type: st.type, name: st.name, newPage: true, template: st.template });
    }
    audit(ctx, "funnel.created", "funnel", id, { template: tpl ? tpl.key : null });
    return getFunnel(ctx, id);
  });
}
function updateFunnel(ctx, id, { name, description } = {}) {
  const f = requireFunnel(ctx, id, { active: true });
  const n = name === undefined ? f.name : cleanName(name);
  assertFreeName(ctx, n, f.id);
  ctx.db.prepare("UPDATE mk_funnels SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?").run(n, description === undefined ? f.description : line(description, 300), f.id);
  audit(ctx, "funnel.updated", "funnel", f.id, {});
  return getFunnel(ctx, f.id);
}
const touch = (ctx, id) => ctx.db.prepare("UPDATE mk_funnels SET updated_at = datetime('now') WHERE id = ?").run(id);

// Archiver : les pages créées POUR le tunnel (nature « étape ») passent hors ligne ; une page de site utilisée comme
// étape reste en ligne (elle appartient aussi au site). Rien n'est effacé.
function archiveFunnel(ctx, id) {
  const f = requireFunnel(ctx, id);
  let offline = 0;
  transaction(ctx.db, () => {
    for (const s of f.steps) if (s.pageId) offline += ctx.db.prepare("UPDATE mk_landing_pages SET status = 'unpublished', updated_at = datetime('now') WHERE id = ? AND kind = 'step' AND status = 'published'").run(s.pageId).changes;
    ctx.db.prepare("UPDATE mk_funnels SET status = 'archived', archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(f.id);
  });
  audit(ctx, "funnel.archived", "funnel", f.id, { offline });
  return { offline };
}
function restoreFunnel(ctx, id) {
  const f = requireFunnel(ctx, id);
  for (const s of f.steps) if (s.pageId) assertPageFree(ctx, s.pageId, f.id);
  ctx.db.prepare("UPDATE mk_funnels SET status = 'active', archived_at = NULL, updated_at = datetime('now') WHERE id = ?").run(f.id);
  audit(ctx, "funnel.restored", "funnel", f.id, {});
}
// Dupliquer : nouvelles pages (copies en brouillon, hors ligne), mêmes formations
function duplicateFunnel(ctx, id) {
  const f = requireFunnel(ctx, id);
  return transaction(ctx.db, () => {
    const name = freeName(ctx, "mk_funnels", `${f.name} (copie)`);
    const newId = Number(ctx.db.prepare("INSERT INTO mk_funnels (organization_id, name, description, template, created_by) VALUES (?, ?, ?, ?, ?)")
      .run(ctx.organizationId, name, f.description, f.template, ctx.userId ?? null).lastInsertRowid);
    f.steps.forEach((s, i) => {
      const pageId = s.pageId ? pages.duplicatePage(ctx, s.pageId, { siteId: null }).id : null;
      if (pageId) ctx.db.prepare("UPDATE mk_landing_pages SET kind = 'step' WHERE id = ?").run(pageId);
      ctx.db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id, course_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(ctx.organizationId, newId, i + 1, s.type, s.name, pageId, s.courseId);
    });
    audit(ctx, "funnel.duplicated", "funnel", newId, { from: f.id });
    return getFunnel(ctx, newId);
  });
}

// ---------- Étapes ----------

// Une page n'est l'étape que d'un seul tunnel actif (sinon « l'étape suivante » serait ambiguë)
function assertPageFree(ctx, pageId, funnelId) {
  const used = ctx.db.prepare(`SELECT f.id, f.name FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    WHERE s.page_id = ? AND f.status = 'active' AND f.organization_id = ? AND f.id != ?`).get(pageId, ctx.organizationId, funnelId);
  if (used) throw new MarketingError("in_use", `Cette page est déjà une étape du tunnel « ${used.name} » : une page ne peut appartenir qu'à un seul tunnel actif (dupliquez-la pour la réutiliser).`);
}

// Sections d'une page créée pour une étape : les boutons provisoires du gabarit (« /catalogue ») mènent à l'étape
// suivante ; sur une page d'inscription, c'est le formulaire qui fait avancer (bouton du bandeau retiré). Une page qui
// doit faire avancer sans formulaire ni bouton vers l'étape suivante en reçoit un (« Continuer »), modifiable ensuite.
function stepSections(sections, { advances = false } = {}) {
  const hasForm = sections.some((s) => s.type === "form");
  const out = sections.map((s) => {
    if (s.type === "hero" && s.buttonUrl === "/catalogue") return hasForm ? { ...s, buttonLabel: "", buttonUrl: "" } : { ...s, buttonUrl: NEXT_URL };
    if ((s.type === "cta") && s.buttonUrl === "/catalogue") return { ...s, buttonUrl: NEXT_URL };
    if (s.type === "button" && s.url === "/catalogue") return { ...s, url: NEXT_URL };
    return s;
  });
  const leads = out.some((s) => s.buttonUrl === NEXT_URL || s.url === NEXT_URL);
  if (advances && !hasForm && !leads) out.push({ id: newSectionId(), type: "button", label: "Continuer", url: NEXT_URL, align: "center" });
  return out;
}

function addStep(ctx, funnelId, { type, name, pageId = null, courseId = null, newPage = false, template } = {}) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const t = STEP_TYPES[type];
  if (!t) throw bad("Type d'étape inconnu.");
  if (f.steps.length >= MAX_STEPS) throw bad(`Un tunnel compte au plus ${MAX_STEPS} étapes.`);
  const stepName = line(name, 80) || t.label;
  let page = null, course = null;
  if (t.course) {
    course = getCourse(ctx, Number(courseId));
    if (!course) throw bad("Choisissez une formation publiée du catalogue.");
  } else if (newPage) {
    const tplKey = template === undefined ? t.template : template;
    page = pages.createPage(ctx, { name: freeName(ctx, "mk_landing_pages", `${f.name} — ${stepName}`), kind: "step", template: tplKey || null });
    ctx.db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(stepSections(page.published.sections, { advances: Boolean(t.advances) }).map((s) => (s.id ? s : { ...s, id: newSectionId() }))), page.id);
  } else {
    page = pages.getPage(ctx, Number(pageId));
    if (!page) throw bad("Choisissez une page existante, ou créez-en une nouvelle.");
    if (page.archived_at) throw bad("Cette page est archivée : restaurez-la d'abord.");
    if (f.steps.some((s) => s.pageId === page.id)) throw bad("Cette page est déjà une étape de ce tunnel.");
    assertPageFree(ctx, page.id, f.id);
  }
  const position = (f.steps.length ? Math.max(...f.steps.map((s) => s.position)) : 0) + 1;
  const id = Number(ctx.db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id, course_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, f.id, position, type, stepName, page ? page.id : null, course ? course.id : null).lastInsertRowid);
  touch(ctx, f.id);
  audit(ctx, "funnel.step_added", "funnel", f.id, { step: id, type, page: page ? page.id : null });
  return { id, pageId: page ? page.id : null, created: Boolean(newPage && page) };
}

const stepOf = (f, stepId) => {
  const s = f.steps.find((x) => x.id === Number(stepId));
  if (!s) throw new MarketingError("not_found", "Étape introuvable.");
  return s;
};
function renameStep(ctx, funnelId, stepId, name) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const s = stepOf(f, stepId);
  const n = line(name, 80);
  if (!n) throw bad("Le nom de l'étape est obligatoire.");
  ctx.db.prepare("UPDATE mk_funnel_steps SET name = ?, updated_at = datetime('now') WHERE id = ?").run(n, s.id);
  touch(ctx, f.id);
}
// Déplacer d'un cran vers le haut (-1) ou le bas (+1) ; les positions sont renumérotées 1..n
function moveStep(ctx, funnelId, stepId, delta) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const order = f.steps.map((s) => s.id);
  const i = order.indexOf(stepOf(f, stepId).id), j = i + (delta < 0 ? -1 : 1);
  if (j < 0 || j >= order.length) return false;
  [order[i], order[j]] = [order[j], order[i]];
  transaction(ctx.db, () => order.forEach((id, k) => ctx.db.prepare("UPDATE mk_funnel_steps SET position = ? WHERE id = ?").run(k + 1, id)));
  touch(ctx, f.id);
  return true;
}
// Retirer une étape : la page n'est PAS effacée (elle reste dans Site Web → Pages)
function removeStep(ctx, funnelId, stepId) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const s = stepOf(f, stepId);
  transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM mk_funnel_steps WHERE id = ?").run(s.id);
    f.steps.filter((x) => x.id !== s.id).forEach((x, k) => ctx.db.prepare("UPDATE mk_funnel_steps SET position = ? WHERE id = ?").run(k + 1, x.id));
  });
  touch(ctx, f.id);
  audit(ctx, "funnel.step_removed", "funnel", f.id, { step: s.id, page: s.pageId });
  return s;
}

// Mettre en ligne toutes les étapes prêtes (chaque page passe les mêmes contrôles qu'une publication normale)
function publishFunnel(ctx, id) {
  const f = requireFunnel(ctx, id, { active: true });
  const published = [], failed = [];
  for (const s of f.steps) {
    if (!s.pageId || (s.pageStatus === "published" && !s.pageHasDraft)) continue;
    try { pages.publish(ctx, s.pageId); published.push(s.name); }
    catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      failed.push({ name: s.name, message: error.message });
    }
  }
  touch(ctx, f.id);
  return { published, failed };
}

// Tunnels dont la page est une étape (affiché sur la fiche de la page)
function funnelsOfPage(ctx, pageId) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT f.id, f.name, f.status, s.position, s.name AS step FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    WHERE s.page_id = ? AND f.organization_id = ? ORDER BY f.status, f.name`).all(pageId, ctx.organizationId);
}

// ---------- Côté public ----------

// Adresse de l'étape suivante d'une page (tunnel actif), si elle est atteignable ; sinon null
function nextUrlForPage(db, page) {
  const ctx = { db, organizationId: page.organization_id };
  const step = db.prepare(`SELECT s.funnel_id, s.position FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    WHERE s.page_id = ? AND f.status = 'active' AND f.organization_id = ? ORDER BY s.id LIMIT 1`).get(page.id, page.organization_id);
  if (!step) return null;
  const rows = db.prepare(`SELECT s.*, p.slug AS page_slug, p.status AS page_status, p.archived_at AS page_archived FROM mk_funnel_steps s
    LEFT JOIN mk_landing_pages p ON p.id = s.page_id WHERE s.funnel_id = ? AND s.position > ? ORDER BY s.position, s.id`).all(step.funnel_id, step.position);
  // L'étape suivante ATTEIGNABLE (une étape hors ligne est sautée plutôt que de mener à une page d'erreur)
  for (const r of rows) {
    const d = describeStep(ctx, r);
    if (d.live) return d.path;
  }
  return null;
}

module.exports = {
  STEP_TYPES, NEXT_URL, MAX_STEPS, getFunnel, requireFunnel, listFunnels, createFunnel, updateFunnel, archiveFunnel, restoreFunnel, duplicateFunnel,
  addStep, renameStep, moveStep, removeStep, publishFunnel, nextUrlForPage, funnelsOfPage, stepSections,
};
