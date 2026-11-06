// Context Resolver + Dependency Analyzer + Impact Analyzer. Tout se résout par IDENTIFIANT stable (page, section, élément, champ) ; un nom visible n'est qu'un indice et une correspondance multiple devient une ambiguïté.
// L'accès au site est revérifié ici (appartenance, portée) ; les droits d'action sont ceux de la route.
const { bad, norm, walkNodes, findNode, fp } = require("./util");
const protect = require("./protect");
const pagesLib = () => require("../marketing/pages");
const fieldsLib = () => require("../contentGen/fields");
const TYPE_LABEL = { hero: "bandeau", features: "services / cartes", faq: "questions fréquentes", form: "formulaire", testimonials: "témoignages", cta: "appel à l'action", text: "texte", video: "vidéo", list: "liste", image: "image", layout: "section libre", component: "composant réutilisable", course: "formation" };

function siteGuard(ctx, siteId) {
  if (!Number.isInteger(siteId) || siteId < 1) throw bad("Site introuvable.", "not_found");
  if (ctx.siteScope !== undefined && ctx.siteScope !== null && ctx.siteScope !== siteId) throw bad("Site introuvable.", "not_found");
  const site = pagesLib().getSite(ctx, siteId);
  if (!site || site.deleted_at) throw bad("Site introuvable.", "not_found");
  if (site.status !== "active") throw bad("Ce site est archivé : restaurez-le avant de le modifier.");
  return site;
}
const pageOf = (ctx, siteId, pageId) => { const p = Number.isInteger(Number(pageId)) ? pagesLib().requirePage(ctx, Number(pageId)) : null; if (!p || p.site_id !== siteId || p.archived_at) throw bad("Page introuvable pour ce site.", "not_found"); return p; };
const label = (s) => `${TYPE_LABEL[s.type] || s.type}${s.title || s.heading ? ` « ${String(s.title || s.heading).slice(0, 40)} »` : ""}`;

// Résout la cible : sélection (identifiants) d'abord, indices du texte ensuite. Retourne { page, section, node, fieldKey, ambiguities[] } ; jamais de choix arbitraire entre plusieurs candidats.
function resolve(ctx, siteId, analysis, selection = {}) {
  siteGuard(ctx, siteId);
  const out = { page: null, section: null, node: null, fieldKey: null, ambiguities: [...analysis.ambiguities] };
  const sitePages = pagesLib().sitePages(ctx, siteId);
  let page = null;
  if (selection.pageId) page = pageOf(ctx, siteId, selection.pageId);
  else if (analysis.target.pageHint) {
    const h = norm(analysis.target.pageHint), cands = sitePages.filter((p) => norm(p.name) === h || norm(p.slug) === h || norm(p.name).includes(h) || h.includes(norm(p.name)));
    const exact = cands.filter((p) => norm(p.name) === h || norm(p.slug) === h);
    const pick = exact.length === 1 ? exact : cands;
    if (pick.length === 1) page = pageOf(ctx, siteId, pick[0].id);
    else out.ambiguities.push({ field: "page", question: pick.length ? "Plusieurs pages correspondent : laquelle ?" : `Je ne trouve pas de page « ${analysis.target.pageHint} ».`, candidates: (pick.length ? pick : sitePages).slice(0, 8).map((p) => ({ id: p.id, label: p.name })) });
  } else if (["rewrite_text", "change_style", "replace_image", "add_section", "redesign_page"].includes(analysis.intent) && analysis.target.kind !== "design") out.ambiguities.push({ field: "page", question: "Sur quelle page ?", candidates: sitePages.slice(0, 8).map((p) => ({ id: p.id, label: p.name })) });
  out.page = page;
  if (!page) return out;
  const sections = (page.working || {}).sections || [];
  if (selection.sectionId) { const s = sections.find((x) => x.id === selection.sectionId); if (!s) throw bad("Section introuvable dans cette page.", "not_found"); out.section = s; }
  if (selection.nodeId) { const f = findNode(sections, selection.nodeId); if (!f) throw bad("Élément introuvable dans cette page.", "not_found"); out.node = f.node; out.section = out.section || f.section; }
  if (selection.fieldKey) {
    const [secId] = String(selection.fieldKey).split("/"), s = sections.find((x) => x.id === secId);
    if (!s) throw bad("Champ introuvable dans cette page.", "not_found");
    if (!fieldsLib().describe(s).some((d) => d.key === selection.fieldKey)) throw bad("Ce champ n'est pas un texte modifiable de cette section.", "not_found");
    out.fieldKey = selection.fieldKey; out.section = out.section || s;
  }
  // section désignée par le TEXTE : par type, avec ambiguïté si plusieurs
  if (!out.section && analysis.target.typeHint && ["rewrite_text", "change_style", "replace_image"].includes(analysis.intent)) {
    const cands = sections.filter((s) => s.type === analysis.target.typeHint);
    if (cands.length === 1) out.section = cands[0];
    else if (cands.length > 1) out.ambiguities.push({ field: "section", question: `Plusieurs sections « ${TYPE_LABEL[analysis.target.typeHint] || analysis.target.typeHint} » : laquelle ?`, candidates: cands.slice(0, 8).map((s) => ({ id: s.id, label: label(s) })) });
    else out.ambiguities.push({ field: "section", question: `Cette page n'a pas de section « ${TYPE_LABEL[analysis.target.typeHint] || analysis.target.typeHint} ».`, candidates: sections.slice(0, 8).map((s) => ({ id: s.id, label: label(s) })) });
  }
  // un champ désigné par le texte (« titre ») sur une section résolue
  if (out.section && !out.fieldKey && analysis.intent === "rewrite_text" && analysis.target.fieldHint) {
    const cands = fieldsLib().describe(out.section).filter((d) => d.path[0] === analysis.target.fieldHint || (analysis.target.fieldHint === "button" && /label|buttonLabel/i.test(d.path.join(".")))).filter((d) => d.path.length === 1);
    if (cands.length === 1) out.fieldKey = cands[0].key;
  }
  return out;
}

// Dépendances de la cible : qui d'autre utilise cet élément ?
function dependencies(ctx, siteId, analysis, resolved) {
  const dep = { scopeKind: "local", pages: [], related: [], tokens: [], media: [], modules: [], notes: [] };
  const sitePages = pagesLib().sitePages(ctx, siteId);
  const contentOf = (id) => { try { return pageOf(ctx, siteId, id).working || {}; } catch { return {}; } };
  if (analysis.intent === "change_design") {
    dep.scopeKind = "global"; const tok = analysis.property && analysis.property.token;
    dep.tokens.push(tok || "(couleur)");
    for (const p of sitePages) { const txt = JSON.stringify(contentOf(p.id).sections || []); const n = tok ? (txt.match(new RegExp(`token:${tok}\\b`, "g")) || []).length + (txt.match(new RegExp(`"background":"${tok === "secondary" ? "dark" : tok}"`, "g")) || []).length : 0; dep.pages.push({ id: p.id, name: p.name, uses: n }); }
    dep.notes.push("Une couleur du design est lue par tout le site (boutons, fonds, liens) : toutes les pages publiées après publication du brouillon des styles.");
    return dep;
  }
  const s = resolved.section;
  if (s && s.type === "component") {
    dep.scopeKind = "component";
    for (const p of sitePages) if (JSON.stringify(contentOf(p.id).sections || []).includes(`"componentId":${s.componentId}`)) dep.pages.push({ id: p.id, name: p.name });
    dep.notes.push("Composant réutilisable : une modification de sa source se répercute sur toutes les pages qui l'affichent.");
  }
  if (s) {
    const urls = []; for (const k of ["image", "src", "poster"]) if (typeof s[k] === "string" && s[k].startsWith("/uploads/")) urls.push(s[k]);
    for (const u of urls) { const users = sitePages.filter((p) => p.id !== (resolved.page && resolved.page.id) && JSON.stringify(contentOf(p.id).sections || []).includes(u)); dep.media.push({ path: u, alsoUsedOn: users.map((p) => ({ id: p.id, name: p.name })) }); if (users.length && dep.scopeKind === "local") dep.scopeKind = "shared"; }
    if (s.type === "course") dep.modules.push("lms");
    if (s.type === "form") dep.notes.push("Le formulaire est associé à la page dans ses réglages : non modifié par cette opération.");
  }
  if (resolved.page && ["rewrite_text", "change_style", "replace_image"].includes(analysis.intent) && !s && analysis.scope.requested === "page") dep.scopeKind = "page";
  if (resolved.page && !dep.pages.length) dep.pages.push({ id: resolved.page.id, name: resolved.page.name });
  return dep;
}

// Impact : ce qui sera touché, directement ou non, et ce qui bloque ou exige une confirmation
function impact(ctx, siteId, analysis, resolved, dep, plan) {
  const items = (plan.targets || []);
  const direct = items.map((t) => ({ kind: t.kind, ref: t.ref, label: t.label }));
  const indirect = [];
  for (const m of dep.media) if (m.alsoUsedOn.length) indirect.push({ kind: "media", ref: m.path, label: `Image aussi utilisée sur : ${m.alsoUsedOn.map((p) => p.name).join(", ")}` });
  if (dep.scopeKind === "component") for (const p of dep.pages) indirect.push({ kind: "page", ref: String(p.id), label: `Page « ${p.name} » (composant partagé)` });
  const globals = dep.scopeKind === "global" ? dep.tokens.map((t) => `design : ${t}`) : [];
  const reasons = [];
  if (dep.scopeKind === "global") reasons.push("modification globale du design : tout le site est concerné");
  if (dep.scopeKind === "component" && dep.pages.length > 1) reasons.push(`composant partagé par ${dep.pages.length} pages`);
  if (dep.scopeKind === "shared") reasons.push("ressource partagée avec d'autres pages");
  if (plan.executor === "text_page") reasons.push("remplacement de plusieurs textes d'une page");
  const protectedHit = [];
  for (const t of items) { const st = protect.stateOf(ctx, siteId, t.kind, t.ref, t.value); if (st !== "user" && st !== "ai" && st !== "pending") protectedHit.push({ kind: t.kind, ref: t.ref, label: t.label, state: st }); }
  const level = reasons.length ? "high" : protectedHit.length || indirect.length ? "medium" : "low";
  return { direct, indirect, pages: [...new Map([...(resolved.page ? [[resolved.page.id, { id: resolved.page.id, name: resolved.page.name }]] : []), ...dep.pages.map((p) => [p.id, { id: p.id, name: p.name }])]).values()], contents: items.filter((t) => t.kind === "field" || t.executor === "text").length, media: dep.media.map((m) => m.path), globals, protectedHit, level, requiresConfirmation: level === "high", reasons, notes: dep.notes };
}
module.exports = { siteGuard, pageOf, resolve, dependencies, impact, label, TYPE_LABEL, fp, walkNodes };
