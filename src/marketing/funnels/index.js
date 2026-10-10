// Tunnels (phase 8) : une suite ordonnée d'étapes, chacune un VRAI objet du logiciel :
//  - une page du moteur commun (même éditeur visuel que Site Web, même adresse /p/<adresse>) ;
//  - ou une formation publiée du catalogue (sa vraie page /cours/<adresse>).
// Le tunnel ne recopie rien : l'étape pointe vers la page. Une page n'appartient qu'à un seul tunnel actif, pour que
// « l'étape suivante » soit toujours sans ambiguïté. Les boutons d'une page dont l'adresse est /etape-suivante mènent à
// l'étape suivante du tunnel ; après une inscription, le visiteur y est conduit aussi.
// Les étapes de paiement (bon de commande, offre complémentaire, offre supérieure, offre de repli) arrivent avec le
// paiement (phase 9) : elles ne sont pas proposées avant d'exister.
const { MarketingError } = require("../errors");
const { checkCtx, audit, resolveSite, siteSql } = require("../audience/shared");
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

// Réglages de CONTEXTE d'une étape (jamais écrits dans la page CMS : la même page sert aussi hors tunnel) :
//  noindex : l'étape n'est pas proposée aux moteurs de recherche (par défaut pour remerciement et téléchargement) ; hideFooter : pied de page masqué ;
//  goal : objectif de conversion, pour vous (texte libre court).
const DEFAULT_SETTINGS = { noindex: false, hideFooter: false, goal: "" };
const NOINDEX_BY_DEFAULT = new Set(["thankyou", "download"]);
function cleanSettings(raw, base = DEFAULT_SETTINGS) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw bad("Réglages d'étape invalides.");
  const out = { ...DEFAULT_SETTINGS, ...base };
  if (raw.noindex !== undefined) out.noindex = raw.noindex === true || raw.noindex === "on" || raw.noindex === "1" || raw.noindex === 1;
  if (raw.hideFooter !== undefined) out.hideFooter = raw.hideFooter === true || raw.hideFooter === "on" || raw.hideFooter === "1" || raw.hideFooter === 1;
  if (raw.goal !== undefined) out.goal = line(raw.goal, 120);
  return out;
}
const parseSettings = (text) => { try { const v = JSON.parse(text || "{}"); return { ...DEFAULT_SETTINGS, ...(v && typeof v === "object" && !Array.isArray(v) ? { noindex: Boolean(v.noindex), hideFooter: Boolean(v.hideFooter), goal: typeof v.goal === "string" ? v.goal.slice(0, 120) : "" } : {}) }; } catch { return { ...DEFAULT_SETTINGS }; } };

// ---------- Lecture ----------

function getFunnel(ctx, id) {
  checkCtx(ctx);
  const site = siteSql({ ...ctx, siteFilter: undefined }, "f"); // lecture par identifiant : seul l'accès limité à un site restreint (jamais le simple filtre d'affichage)
  const f = Number.isInteger(id) ? ctx.db.prepare(`SELECT f.* FROM mk_funnels f WHERE f.id = ? AND f.organization_id = ? AND ${site.sql}`).get(id, ctx.organizationId, ...site.params) : null;
  if (!f) return null;
  const steps = ctx.db.prepare(`SELECT s.*, p.name AS page_name, p.slug AS page_slug, p.status AS page_status, p.archived_at AS page_archived, p.site_id AS page_site_id, p.draft IS NOT NULL AS page_has_draft
      FROM mk_funnel_steps s LEFT JOIN mk_landing_pages p ON p.id = s.page_id WHERE s.funnel_id = ? ORDER BY s.position, s.id`).all(f.id)
    .map((s) => describeStep(ctx, s, f.site_id ?? null));
  return { ...f, steps };
}
function requireFunnel(ctx, id, { active = false } = {}) {
  const f = getFunnel(ctx, Number(id));
  if (!f) throw new MarketingError("not_found", "Tunnel introuvable.");
  if (active && f.status !== "active") throw bad("Ce tunnel est archivé : restaurez-le d'abord.");
  return f;
}

// État réel d'une étape : où elle mène, si elle est visible du public, ce qui manque
function describeStep(ctx, s, funnelSite = null) {
  const type = STEP_TYPES[s.type] || { label: s.type };
  const out = { id: s.id, position: s.position, type: s.type, typeLabel: type.label, name: s.name, pageId: s.page_id, courseId: s.course_id, path: null, live: false, problem: null, settings: parseSettings(s.settings) };
  if (type.course) {
    const c = getCourse(ctx, s.course_id);
    if (!c) out.problem = "La formation n'est plus publiée : choisissez-en une autre ou retirez l'étape.";
    else Object.assign(out, { courseTitle: c.title, path: `/cours/${encodeURIComponent(c.slug)}`, live: true });
  } else if (!s.page_id) out.problem = "Aucune page n'est associée à cette étape (détachée ou supprimée) : sélectionnez une page existante ou créez-en une avec KOLAKISA CMS.";
  else {
    Object.assign(out, { pageName: s.page_name, pageSlug: s.page_slug, pageStatus: s.page_status, pageHasDraft: Boolean(s.page_has_draft), path: `/p/${s.page_slug}` });
    out.pageSiteId = s.page_site_id ?? null;
    if ((s.page_site_id ?? null) !== (funnelSite ?? null) && s.page_site_id !== undefined) out.problem = "Cette page appartient à un autre site que le tunnel : associez une page du même site (l'étape ne sera pas servie).";
    else if (s.page_archived) out.problem = "La page est archivée : restaurez-la (Site Web → Pages) pour que l'étape fonctionne.";
    else if (s.page_status !== "published") out.problem = "Page pas encore en ligne : les visiteurs ne peuvent pas atteindre cette étape.";
    else out.live = true;
    if (out.problem && out.problem.startsWith("Cette page appartient à un autre site")) out.live = false;
  }
  return out;
}

function listFunnels(ctx, { archived = false } = {}) {
  checkCtx(ctx);
  const site = siteSql(ctx, "f");
  return ctx.db.prepare(`SELECT f.*, (SELECT COUNT(*) FROM mk_funnel_steps s WHERE s.funnel_id = f.id) AS steps
    FROM mk_funnels f WHERE f.organization_id = ? AND f.status = ? AND ${site.sql} ORDER BY f.updated_at DESC, f.id DESC`).all(ctx.organizationId, archived ? "archived" : "active", ...site.params);
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

function createFunnel(ctx, { name, description = "", template = null, siteId } = {}) {
  checkCtx(ctx);
  const n = cleanName(name);
  assertFreeName(ctx, n);
  const tpl = template ? require("./templates").get(template) : null;
  if (template && !tpl) throw bad("Modèle de tunnel inconnu.");
  if (tpl && tpl.requiresCourse && !listCourses(ctx).length) throw bad("Ce modèle mène à une formation : publiez d'abord une formation dans le catalogue.");
  const site = resolveSite(ctx, siteId);
  return transaction(ctx.db, () => {
    const id = Number(ctx.db.prepare("INSERT INTO mk_funnels (organization_id, name, description, template, created_by, site_id) VALUES (?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, n, line(description, 300), tpl ? tpl.key : null, ctx.userId ?? null, site).lastInsertRowid);
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
// Dupliquer. Deux comportements, au choix : « copy » (défaut) = nouvelles pages (copies en brouillon, hors ligne, nouveaux identifiants et adresses) ;
// « none » = mêmes étapes SANS page, à associer ensuite. Réutiliser les MÊMES pages dans deux tunnels actifs est refusé (l'étape suivante serait ambiguë).
function duplicateFunnel(ctx, id, { pages: mode = "copy" } = {}) {
  const f = requireFunnel(ctx, id);
  if (!["copy", "none"].includes(mode)) throw bad("Mode de duplication inconnu (copy, none).");
  return transaction(ctx.db, () => {
    const name = freeName(ctx, "mk_funnels", `${f.name} (copie)`);
    const newId = Number(ctx.db.prepare("INSERT INTO mk_funnels (organization_id, name, description, template, created_by, site_id) VALUES (?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, name, f.description, f.template, ctx.userId ?? null, f.site_id ?? null).lastInsertRowid);
    f.steps.forEach((s, i) => {
      const pageId = s.pageId && mode === "copy" ? pages.duplicatePage(ctx, s.pageId, { siteId: f.site_id ?? null }).id : null;
      if (pageId) ctx.db.prepare("UPDATE mk_landing_pages SET kind = 'step' WHERE id = ?").run(pageId);
      ctx.db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id, course_id, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(ctx.organizationId, newId, i + 1, s.type, s.name, pageId, s.courseId, JSON.stringify(s.settings));
    });
    audit(ctx, "funnel.duplicated", "funnel", newId, { from: f.id, pages: mode });
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

// Une page utilisable comme étape : du MÊME site que le tunnel (vérifié ici, côté serveur — jamais seulement par le formulaire), non archivée, libre
function assertPageUsable(ctx, funnel, page) {
  if (page.archived_at) throw bad("Cette page est archivée : restaurez-la d'abord.");
  if ((page.site_id ?? null) !== (funnel.site_id ?? null)) throw new MarketingError("invalid_field", "Cette page appartient à un autre site que le tunnel : une étape ne peut utiliser qu'une page du même site.");
  assertPageFree(ctx, page.id, funnel.id);
}

// Remplacer la page d'une étape par une autre page CMS existante (l'ancienne page n'est jamais touchée)
function replaceStepPage(ctx, funnelId, stepId, pageId) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const s = stepOf(f, stepId);
  if (STEP_TYPES[s.type] && STEP_TYPES[s.type].course) throw bad("Une étape « Formation » n'a pas de page : choisissez une autre formation.");
  const page = pages.getPage(ctx, Number(pageId));
  if (!page) throw bad("Choisissez une page existante.");
  if (f.steps.some((x) => x.pageId === page.id && x.id !== s.id)) throw bad("Cette page est déjà une autre étape de ce tunnel.");
  assertPageUsable(ctx, f, page);
  ctx.db.prepare("UPDATE mk_funnel_steps SET page_id = ?, updated_at = datetime('now') WHERE id = ?").run(page.id, s.id);
  touch(ctx, f.id);
  audit(ctx, "funnel.step_page_replaced", "funnel", f.id, { step: s.id, from: s.pageId, to: page.id });
  return { pageId: page.id };
}
// Détacher : l'étape reste (sans page), la page CMS n'est PAS supprimée et reste dans Pages
function detachStepPage(ctx, funnelId, stepId) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const s = stepOf(f, stepId);
  if (!s.pageId) throw bad("Cette étape n'a pas de page.");
  ctx.db.prepare("UPDATE mk_funnel_steps SET page_id = NULL, updated_at = datetime('now') WHERE id = ?").run(s.id);
  touch(ctx, f.id);
  audit(ctx, "funnel.step_page_detached", "funnel", f.id, { step: s.id, page: s.pageId });
  return { pageId: s.pageId };
}
// « Créer avec KOLAKISA CMS » pour une étape qui n'a pas (ou plus) de page : une NOUVELLE page CMS (brouillon, même site), associée à l'étape ;
// l'appelant ouvre ensuite l'éditeur visuel existant. Tout ou rien : si la création échoue, l'étape reste inchangée.
function createStepPage(ctx, funnelId, stepId, { template } = {}) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const s = stepOf(f, stepId);
  const t = STEP_TYPES[s.type] || {};
  if (t.course) throw bad("Une étape « Formation » n'a pas de page.");
  if (s.pageId) throw bad("Cette étape a déjà une page : détachez-la d'abord.");
  return transaction(ctx.db, () => {
    const tplKey = template === undefined ? t.template : template;
    const page = pages.createPage(ctx, { name: freeName(ctx, "mk_landing_pages", `${f.name} — ${s.name}`), kind: "step", template: tplKey || null, siteId: f.site_id ?? null });
    ctx.db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(stepSections(page.published.sections, { advances: Boolean(t.advances) }).map((x) => (x.id ? x : { ...x, id: newSectionId() }))), page.id);
    ctx.db.prepare("UPDATE mk_funnel_steps SET page_id = ?, updated_at = datetime('now') WHERE id = ?").run(page.id, s.id);
    touch(ctx, f.id);
    audit(ctx, "funnel.step_page_created", "funnel", f.id, { step: s.id, page: page.id });
    return { pageId: page.id };
  });
}
// Réglages de contexte d'une étape (noindex, pied de page masqué, objectif) : propres à l'étape, jamais copiés dans la page
function updateStepSettings(ctx, funnelId, stepId, raw) {
  const f = requireFunnel(ctx, funnelId, { active: true });
  const s = stepOf(f, stepId);
  const next = cleanSettings(raw, s.settings);
  ctx.db.prepare("UPDATE mk_funnel_steps SET settings = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(next), s.id);
  touch(ctx, f.id);
  audit(ctx, "funnel.step_settings", "funnel", f.id, { step: s.id });
  return next;
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
    page = pages.createPage(ctx, { name: freeName(ctx, "mk_landing_pages", `${f.name} — ${stepName}`), kind: "step", template: tplKey || null, siteId: f.site_id ?? null });
    ctx.db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(stepSections(page.published.sections, { advances: Boolean(t.advances) }).map((s) => (s.id ? s : { ...s, id: newSectionId() }))), page.id);
  } else {
    page = pages.getPage(ctx, Number(pageId));
    if (!page) throw bad("Choisissez une page existante, ou créez-en une nouvelle.");
    if (page.archived_at) throw bad("Cette page est archivée : restaurez-la d'abord.");
    if (f.steps.some((s) => s.pageId === page.id)) throw bad("Cette page est déjà une étape de ce tunnel.");
    assertPageUsable(ctx, f, page);
  }
  const position = (f.steps.length ? Math.max(...f.steps.map((s) => s.position)) : 0) + 1;
  const settings = JSON.stringify({ ...DEFAULT_SETTINGS, noindex: NOINDEX_BY_DEFAULT.has(type) });
  const id = Number(ctx.db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name, page_id, course_id, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, f.id, position, type, stepName, page ? page.id : null, course ? course.id : null, settings).lastInsertRowid);
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

// Automatisations déclenchées par ce tunnel (ses étapes, son achèvement) ou par la visite d'une de ses pages
function linkedAutomations(ctx, funnel) {
  checkCtx(ctx);
  const stepIds = new Set(funnel.steps.map((s) => String(s.id)));
  const pageIds = new Set(funnel.steps.filter((s) => s.pageId).map((s) => String(s.pageId)));
  return ctx.db.prepare("SELECT id, name, status, triggers FROM mk_automations WHERE organization_id = ? ORDER BY name COLLATE NOCASE").all(ctx.organizationId).filter((a) => {
    let triggers = [];
    try { triggers = JSON.parse(a.triggers || "[]"); } catch { triggers = []; }
    return triggers.some((t) => {
      const v = t.filter && t.filter.value !== undefined ? String(t.filter.value) : "";
      if (t.event === "funnel.step_reached") return !v || stepIds.has(v);
      if (t.event === "funnel.completed") return !v || v === String(funnel.id);
      if (t.event === "page.visited") return v && pageIds.has(v);
      return false;
    });
  }).map(({ id, name, status }) => ({ id, name, status }));
}

// Tunnels dont la page est une étape (affiché sur la fiche de la page)
function funnelsOfPage(ctx, pageId) {
  checkCtx(ctx);
  return ctx.db.prepare(`SELECT f.id, f.name, f.status, s.id AS step_id, s.position, s.name AS step FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    WHERE s.page_id = ? AND f.organization_id = ? ORDER BY f.status, f.name`).all(pageId, ctx.organizationId);
}
// Une page utilisée par un tunnel ACTIF ne part pas à la corbeille ni ne se supprime en silence : le service refuse en listant les tunnels,
// sauf si l'appelant demande explicitement de la détacher (les étapes restent, sans page ; la page n'est jamais touchée par le détachement).
function guardPageRemoval(ctx, pageId, { detach = false, action = "archivée" } = {}) {
  const used = funnelsOfPage(ctx, pageId).filter((u) => u.status === "active");
  if (used.length && !detach) {
    throw new MarketingError("in_use", `Cette page est utilisée par ${used.length} tunnel${used.length > 1 ? "s" : ""} : ${used.map((u) => `« ${u.name} » (étape « ${u.step} »)`).join(", ")}. Elle ne peut pas être ${action} tant qu'elle y est associée : détachez-la du tunnel, ou confirmez le détachement.`);
  }
  if (used.length) {
    for (const u of used) ctx.db.prepare("UPDATE mk_funnel_steps SET page_id = NULL, updated_at = datetime('now') WHERE id = ?").run(u.step_id);
    audit(ctx, "funnel.page_detached_by_removal", "landing", pageId, { funnels: used.map((u) => u.id) });
  }
  return used;
}
// Contexte d'une page servie dans un tunnel ACTIF (rendu public, SEO, plan du site) : réglages de l'étape, ou null hors tunnel
function contextForPage(db, page) {
  const row = db.prepare(`SELECT s.id, s.name, s.type, s.position, s.settings, f.id AS funnel_id, f.name AS funnel_name FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    WHERE s.page_id = ? AND f.status = 'active' AND f.organization_id = ? AND (f.site_id IS ? OR f.site_id IS NULL AND ? IS NULL) ORDER BY s.id LIMIT 1`).get(page.id, page.organization_id, page.site_id ?? null, page.site_id ?? null);
  if (!row) return null;
  return { funnelId: row.funnel_id, funnelName: row.funnel_name, stepId: row.id, stepName: row.name, stepType: row.type, position: row.position, ...parseSettings(row.settings) };
}
// Adresse d'une étape PRÉCISE du même tunnel que la page (bouton « étape spécifique »), si elle est atteignable
function stepUrlForPage(db, page, stepId) {
  const ctx = { db, organizationId: page.organization_id };
  const mine = db.prepare(`SELECT s.funnel_id FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE s.page_id = ? AND f.status = 'active' AND f.organization_id = ? ORDER BY s.id LIMIT 1`).get(page.id, page.organization_id);
  if (!mine) return null;
  const r = db.prepare(`SELECT s.*, p.slug AS page_slug, p.status AS page_status, p.archived_at AS page_archived, p.site_id AS page_site_id, f.site_id AS funnel_site FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    LEFT JOIN mk_landing_pages p ON p.id = s.page_id WHERE s.id = ? AND s.funnel_id = ?`).get(stepId, mine.funnel_id);
  if (!r) return null;
  const d = describeStep(ctx, r, r.funnel_site ?? null);
  return d.live ? d.path : null;
}

// ---------- Côté public ----------

// Adresse de l'étape suivante d'une page (tunnel actif), si elle est atteignable ; sinon null
function nextUrlForPage(db, page) {
  const ctx = { db, organizationId: page.organization_id };
  const step = db.prepare(`SELECT s.funnel_id, s.position FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id
    WHERE s.page_id = ? AND f.status = 'active' AND f.organization_id = ? ORDER BY s.id LIMIT 1`).get(page.id, page.organization_id);
  if (!step) return null;
  const rows = db.prepare(`SELECT s.*, p.slug AS page_slug, p.status AS page_status, p.archived_at AS page_archived, p.site_id AS page_site_id, f.site_id AS funnel_site FROM mk_funnel_steps s
    JOIN mk_funnels f ON f.id = s.funnel_id LEFT JOIN mk_landing_pages p ON p.id = s.page_id WHERE s.funnel_id = ? AND s.position > ? ORDER BY s.position, s.id`).all(step.funnel_id, step.position);
  // L'étape suivante ATTEIGNABLE (une étape hors ligne est sautée plutôt que de mener à une page d'erreur)
  for (const r of rows) {
    const d = describeStep(ctx, r, r.funnel_site ?? null);
    if (d.live) return d.path;
  }
  return null;
}

module.exports = {
  STEP_TYPES, NEXT_URL, MAX_STEPS, getFunnel, requireFunnel, listFunnels, createFunnel, updateFunnel, archiveFunnel, restoreFunnel, duplicateFunnel,
  addStep, renameStep, moveStep, removeStep, publishFunnel, nextUrlForPage, funnelsOfPage, linkedAutomations, stepSections,
  replaceStepPage, detachStepPage, createStepPage, updateStepSettings, guardPageRemoval, contextForPage, stepUrlForPage, parseSettings, DEFAULT_SETTINGS,
};
