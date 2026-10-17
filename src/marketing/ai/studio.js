// IA Kolakisa (AI Studio) : créer, modifier, adapter au responsive et corriger les pages NATIVES de l'éditeur.
//
// Principes (tous testés) :
//  - l'IA ne renvoie jamais un document : elle renvoie des OPÉRATIONS (modifier des styles d'un écran, modifier des propriétés, insérer, déplacer,
//    supprimer) qui sont appliquées par CE moteur sur une copie du brouillon, puis le résultat entier est revalidé par le moteur de pages
//    (`pages.normalizeContent` : types, propriétés, unités, nombre d'éléments) et par les droits sur les widgets réservés ;
//  - une opération ne peut viser qu'un élément qui existe, dans le périmètre demandé ; une suppression demande une confirmation explicite ;
//  - les modifications d'un écran (tablette, mobile) n'écrivent JAMAIS dans l'écran ordinateur ;
//  - rien n'est enregistré ici : la proposition (opérations, différences, document résultant) revient à l'éditeur, qui l'applique en UNE étape
//    d'historique ; la demande est refusée si le brouillon a changé entre-temps (révision) ;
//  - plafond quotidien, journal sans aucun texte et erreurs explicites : le socle commun (ai/index.js `call`) ;
//  - sans clé ANTHROPIC_API_KEY, les parties IA sont indisponibles (aucune fausse réponse) ; l'analyse responsive par règles reste disponible.
const nodes = require("../pages/nodes");
const pages = require("../pages");
const { MarketingError } = require("../errors");
const ai = require("./index");

const { AiError } = ai;
const BPS = ["desktop", "tablet", "mobile"];
const STATES = ["normal", "hover", "focus", "active"];
const MAX_OPS = 80;
const MAX_INSTRUCTION = 4000;
const MAX_OUTLINE = 260;
const MAX_ANNOTATIONS = 30;
const bad = (m) => new MarketingError("invalid_field", m);
const clone = (v) => JSON.parse(JSON.stringify(v));
const clip = (v, max) => String(v ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// ---------- Parcours du document ----------
function find(sections, id) {
  const walk = (list, parent, depth) => {
    for (let i = 0; i < (list || []).length; i++) {
      const n = list[i];
      if (n && String(n.id) === String(id)) return { node: n, parent, list, index: i, depth };
      const kids = n && Array.isArray(n.children) ? walk(n.children, n, depth + 1) : null;
      if (kids) return kids;
    }
    return null;
  };
  return walk(sections, null, 0);
}
function collectIds(list, into = new Set()) { (list || []).forEach((n) => { if (n) { into.add(String(n.id)); collectIds(n.children, into); } }); return into; }
const labelOf = (n) => {
  const p = (n && n.props) || {};
  const t = p.text || p.label || p.title || p.name || p.html || "";
  const txt = String(t).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 50);
  const def = nodes.NODE_TYPES[n && n.type];
  if (n && n.type === "layout") return `Section${txt ? ` « ${txt} »` : ""}`;
  return `${(def && def.label) || (n && n.type) || "Élément"}${txt ? ` « ${txt} »` : ""}`;
};

// ---------- Opérations ----------
// Une opération = un objet simple, validé champ par champ avant toute modification.
function checkStyleValue(prop, value, at) {
  const def = nodes.STYLE_PROPS[prop];
  if (!def) throw bad(`${at} : propriété de style inconnue « ${prop} ».`);
  if (value === null || value === "") return "";
  const ok = def.check(typeof value === "number" ? value : String(value).trim());
  if (ok === null || ok === undefined) throw bad(`${at} : valeur invalide pour « ${prop} » (${String(value).slice(0, 40)}).`);
  return ok;
}
function normalizeOps(list) {
  if (!Array.isArray(list) || !list.length) throw bad("L'IA n'a proposé aucune modification.");
  if (list.length > MAX_OPS) throw bad(`Trop de modifications d'un coup (${MAX_OPS} au plus) : demandez une partie de la page à la fois.`);
  return list.map((raw, i) => {
    const at = `Modification ${i + 1}`;
    if (!isObj(raw)) throw bad(`${at} : format invalide.`);
    const op = String(raw.op || "");
    const out = { op, why: clip(raw.why, 200) };
    if (!["set_styles", "set_props", "insert", "move", "remove", "set_page"].includes(op)) throw bad(`${at} : type de modification inconnu « ${op} ».`);
    if (op === "set_page") {
      if (raw.title !== undefined) out.title = clip(raw.title, 120);
      if (raw.description !== undefined) out.description = clip(raw.description, 300);
      return out;
    }
    if (op !== "insert") { out.id = String(raw.id || ""); if (!out.id) throw bad(`${at} : élément visé manquant.`); }
    if (op === "set_styles") {
      out.bp = BPS.includes(raw.bp) ? raw.bp : "desktop";
      out.state = STATES.includes(raw.state) ? raw.state : "normal";
      const pairs = Array.isArray(raw.styles) ? raw.styles : Object.entries(raw.styles || {}).map(([prop, value]) => ({ prop, value }));
      out.styles = pairs.map((p) => ({ prop: String(p.prop || p.key || ""), value: p.value === undefined ? "" : p.value })).filter((p) => p.prop);
      if (!out.styles.length) throw bad(`${at} : aucun réglage de style.`);
      out.styles.forEach((p) => { p.value = checkStyleValue(p.prop, p.value, at); });
    } else if (op === "set_props") {
      const pairs = Array.isArray(raw.props) ? raw.props : Object.entries(raw.props || {}).map(([key, value]) => ({ key, value }));
      out.props = pairs.map((p) => ({ key: String(p.key || ""), value: p.value })).filter((p) => p.key && !["__proto__", "constructor", "prototype"].includes(p.key));
      if (!out.props.length) throw bad(`${at} : aucune propriété.`);
    } else if (op === "insert") {
      out.parent = raw.parent === null || raw.parent === undefined || raw.parent === "" ? null : String(raw.parent);
      out.index = Number.isInteger(raw.index) && raw.index >= 0 ? raw.index : -1;
      let node = raw.node;
      if (typeof raw.node_json === "string" && raw.node_json.trim()) { try { node = JSON.parse(raw.node_json); } catch { throw bad(`${at} : élément à insérer illisible.`); } }
      if (!isObj(node) || typeof node.type !== "string") throw bad(`${at} : élément à insérer manquant.`);
      out.node = node;
    } else if (op === "move") {
      out.parent = raw.parent === null || raw.parent === undefined || raw.parent === "" ? null : String(raw.parent);
      out.index = Number.isInteger(raw.index) && raw.index >= 0 ? raw.index : -1;
    }
    return out;
  });
}
// Les nouveaux éléments reçoivent des identifiants créés ICI (jamais ceux du modèle) et les types doivent exister.
function prepareNode(node, at, depth = 0) {
  if (depth > 8) throw bad(`${at} : imbrication trop profonde.`);
  if (!Object.hasOwn(nodes.NODE_TYPES, node.type) && node.type !== "layout") throw bad(`${at} : élément « ${node.type} » inexistant dans l'éditeur.`);
  const out = { ...node, id: nodes.newNodeId() };
  delete out.hidden; delete out.locked;
  if (Array.isArray(node.children)) out.children = node.children.filter(isObj).map((c) => prepareNode(c, at, depth + 1));
  return out;
}
const ancestorsOf = (sections, id) => { const out = []; const walk = (list, path) => { for (const n of list || []) { if (String(n.id) === String(id)) { out.push(...path); return true; } if (n.children && walk(n.children, path.concat(String(n.id)))) return true; } return false; }; walk(sections, []); return out; };

// Applique les opérations sur une COPIE ; retourne { content, changes, destructive }.
// scope : null (page entière) ou liste d'identifiants (l'élément choisi et ses descendants) : aucune opération ne peut sortir de ce périmètre.
function applyOperations(content, ops, { scope = null } = {}) {
  const next = clone({ sections: content.sections || [], title: content.title, description: content.description });
  const before = clone(content.sections || []);
  const allowed = scope ? new Set(scope.map(String)) : null;
  const changes = [];
  let destructive = false;
  const inScope = (id, at) => { if (allowed && !allowed.has(String(id))) throw bad(`${at} : l'élément visé est hors du périmètre demandé.`); };
  ops.forEach((op, i) => {
    const at = `Modification ${i + 1}`;
    if (op.op === "set_page") {
      if (allowed) throw bad(`${at} : le titre de la page est hors du périmètre demandé.`);
      if (op.title !== undefined && op.title !== next.title) { changes.push({ kind: "page", target: "page", name: "Titre de la page", prop: "title", before: next.title || "", after: op.title, why: op.why }); next.title = op.title; }
      if (op.description !== undefined && op.description !== next.description) { changes.push({ kind: "page", target: "page", name: "Description de la page", prop: "description", before: next.description || "", after: op.description, why: op.why }); next.description = op.description; }
      return;
    }
    if (op.op === "insert") {
      const parentHit = op.parent === null ? null : find(next.sections, op.parent);
      if (op.parent !== null && !parentHit) throw bad(`${at} : emplacement d'insertion introuvable.`);
      if (op.parent !== null) inScope(op.parent, at);
      else if (allowed) throw bad(`${at} : insertion de section hors du périmètre demandé.`);
      if (parentHit && !(parentHit.node.type === "layout" || (nodes.NODE_TYPES[parentHit.node.type] && nodes.NODE_TYPES[parentHit.node.type].container))) throw bad(`${at} : « ${labelOf(parentHit.node)} » ne peut pas contenir d'éléments.`);
      if (!parentHit && op.node.type !== "layout") throw bad(`${at} : une nouvelle section doit être de type « layout » (section libre).`);
      const node = prepareNode(op.node, at);
      const list = parentHit ? (parentHit.node.children = parentHit.node.children || []) : next.sections;
      const idx = op.index >= 0 && op.index <= list.length ? op.index : list.length;
      list.splice(idx, 0, node);
      changes.push({ kind: "insert", target: node.id, name: labelOf(node), parent: parentHit ? labelOf(parentHit.node) : "Page", why: op.why });
      return;
    }
    const hit = find(next.sections, op.id);
    if (!hit) throw bad(`${at} : élément « ${op.id} » introuvable dans la page.`);
    inScope(op.id, at);
    if (hit.node.locked) throw bad(`${at} : « ${labelOf(hit.node)} » est verrouillé.`);
    if (op.op === "set_styles") {
      hit.node.styles = hit.node.styles || {};
      const holder = op.state === "normal" ? (hit.node.styles[op.bp] = hit.node.styles[op.bp] || {}) : ((hit.node.states = hit.node.states || {})[op.state] = (hit.node.states[op.state] || {}));
      if (op.state !== "normal" && op.bp !== "desktop") throw bad(`${at} : un état (survol…) se règle pour tous les écrans, pas pour « ${op.bp} ».`);
      op.styles.forEach(({ prop, value }) => {
        const was = holder[prop];
        if (value === "") delete holder[prop]; else holder[prop] = value;
        if (String(was ?? "") !== String(value)) changes.push({ kind: "style", target: hit.node.id, name: labelOf(hit.node), bp: op.bp, state: op.state, prop, label: (nodes.editorSpec().styleProps.find((p) => p.key === prop) || {}).label || prop, before: was === undefined ? "" : String(was), after: String(value), why: op.why });
      });
      return;
    }
    if (op.op === "set_props") {
      hit.node.props = hit.node.props || {};
      op.props.forEach(({ key, value }) => {
        const was = hit.node.props[key];
        hit.node.props[key] = value;
        if (JSON.stringify(was) !== JSON.stringify(value)) changes.push({ kind: "prop", target: hit.node.id, name: labelOf(hit.node), prop: key, before: was === undefined ? "" : typeof was === "string" ? was : JSON.stringify(was), after: typeof value === "string" ? value : JSON.stringify(value), why: op.why });
      });
      return;
    }
    if (op.op === "remove") {
      destructive = true;
      hit.list.splice(hit.index, 1);
      changes.push({ kind: "remove", target: String(op.id), name: labelOf(hit.node), destructive: true, why: op.why });
      return;
    }
    if (op.op === "move") {
      const to = op.parent === null ? null : find(next.sections, op.parent);
      if (op.parent !== null && !to) throw bad(`${at} : destination introuvable.`);
      if (op.parent !== null && (String(op.parent) === String(op.id) || ancestorsOf(next.sections, op.parent).includes(String(op.id)) )) throw bad(`${at} : un élément ne peut pas être placé dans lui-même.`);
      if (op.parent !== null) inScope(op.parent, at);
      hit.list.splice(hit.index, 1);
      const list = to ? (to.node.children = to.node.children || []) : next.sections;
      const idx = op.index >= 0 && op.index <= list.length ? op.index : list.length;
      list.splice(idx, 0, hit.node);
      changes.push({ kind: "move", target: String(op.id), name: labelOf(hit.node), parent: to ? labelOf(to.node) : "Page", why: op.why });
    }
  });
  // Suppressions d'éléments voisins non annoncées : on compare les identifiants avant / après
  const lost = [...collectIds(before)].filter((id) => !collectIds(next.sections).has(id) && !changes.some((c) => c.kind === "remove" && String(c.target) === id));
  if (lost.length) { destructive = true; lost.forEach((id) => changes.push({ kind: "remove", target: id, name: labelOf((find(before, id) || {}).node), destructive: true, why: "supprimé avec son parent" })); }
  return { content: next, changes, destructive };
}

// Validation finale : le moteur de pages valide le document entier (types, valeurs, limites) ; droits sur les widgets réservés.
function validate(ctx, page, before, after) {
  const normalized = pages.normalizeContent(ctx, page, { ...page.working, ...after });
  // Format verrouillé : l'IA ne contourne jamais le verrou (ni ne le lève en silence)
  try { require("../pages/layoutFormat").checkLocked({ ...before, theme: page.working.theme }, normalized); } catch (e) { throw new MarketingError(e.code || "format_locked", `${e.message} L'IA ne déverrouille jamais le format : déverrouillez-le vous-même, ou demandez une modification qui ne touche pas à ces réglages.`); }
  if (typeof ctx.can === "function") {
    try { nodes.lockedWidgetChanges(before.sections || [], normalized.sections || [], ctx.can); } catch (e) { throw new MarketingError("forbidden_widget", e.message); }
  }
  return normalized;
}

// ---------- Contexte transmis à l'IA : seulement ce qu'il faut ----------
function outline(sections, { focus = null, max = MAX_OUTLINE } = {}) {
  const lines = [];
  const walk = (list, depth) => {
    for (const n of list || []) {
      if (lines.length >= max) return;
      const st = (n.styles && n.styles.desktop) || {};
      const brief = Object.entries(st).slice(0, 8).map(([k, v]) => `${k}=${typeof v === "object" ? "…" : v}`).join(" ");
      const mob = n.styles && (n.styles.tablet || n.styles.mobile) ? ` | écrans: ${["tablet", "mobile"].filter((b) => n.styles[b]).join("+")}` : "";
      lines.push(`${"  ".repeat(depth)}${n.id} ${n.type}${focus && String(n.id) === String(focus) ? " [SÉLECTION]" : ""} ${labelOf(n)}${brief ? ` | ${brief}` : ""}${mob}`);
      if (n.children) walk(n.children, depth + 1);
    }
  };
  walk(sections, 0);
  if (lines.length >= max) lines.push("… (document tronqué : demandez une partie à la fois)");
  return lines.join("\n");
}
function catalogue() {
  const spec = nodes.editorSpec();
  const types = spec.types.map((t) => `- ${t.type} : ${t.label}${t.container ? " (conteneur)" : ""}${t.blank && t.blank.props ? ` ; propriétés : ${Object.keys(t.blank.props).join(", ")}` : ""}`).join("\n");
  const props = spec.styleProps.map((p) => `${p.key}${p.options ? `[${p.options.map((o) => (Array.isArray(o) ? o[0] : o.value || o)).join("|")}]` : ""}`).join(", ");
  return { types, props };
}
function systemPrompt(ctx, mode) {
  const c = catalogue();
  return [
    "Tu es l'assistant IA de l'éditeur de pages KOLAKISA (plateforme francophone de formations en ligne). Tu ne rédiges pas de HTML : tu décris des MODIFICATIONS sous forme d'opérations sur le document natif de l'éditeur.",
    "Le document est un arbre : des sections (type « layout ») contiennent des éléments ; les conteneurs (container, columns, column, stack, grid, group…) contiennent d'autres éléments. Chaque élément a un identifiant (12 caractères), un type, des propriétés (props) et des styles par écran (desktop, tablet, mobile).",
    "Opérations possibles : set_styles (écran + état + liste {prop, value} ; valeur vide = retirer), set_props (propriétés de contenu), insert (parent = identifiant du conteneur ou vide pour une nouvelle section ; node_json = JSON de l'élément SANS identifiant, avec type, props, styles, children), move, remove, set_page (titre, description).",
    "Le texte d'un élément « text » se trouve dans la propriété html (balises simples : <p>, <strong>, <em>, <ul>, <li>, <a>) ; les titres utilisent text et level. Utilise exactement les noms de propriétés listés pour chaque type.",
    "Règles : utilise UNIQUEMENT les types d'éléments et les propriétés de style listés ci-dessous, avec des valeurs valides (px, rem, em, %, couleurs #rrggbb, valeurs du site token:primary…). Ne crée jamais d'image, de vidéo ni d'adresse inventée : si une image est nécessaire, propose un élément sans image (texte, icône, bouton) ou laisse la personne l'ajouter. N'invente ni chiffres, ni prix, ni témoignages réels : utilise des textes d'exemple clairement génériques.",
    "Périmètre : ne modifie que ce qui est nécessaire à la demande. Une modification d'écran (tablet, mobile) ne touche jamais desktop. Ne supprime que sur demande explicite. Style cohérent : espacements réguliers (8, 16, 24, 32, 48 px), contraste lisible.",
    mode === "create" ? "Pour créer une page ou une section : une opération insert par section (parent vide), contenu en français soigné, structure claire (en-tête, bloc principal, contenus, appel à l'action, pied)." : "",
    "Réponds uniquement avec l'objet JSON demandé : un résumé court en français et la liste des opérations.",
    "TYPES D'ÉLÉMENTS :\n" + c.types,
    "PROPRIÉTÉS DE STYLE : " + c.props,
  ].filter(Boolean).join("\n\n");
}
const str = { type: "string" };
const SCHEMA = {
  type: "object", additionalProperties: false, required: ["summary", "operations", "question"],
  properties: {
    summary: str, question: str,
    operations: { type: "array", items: { type: "object", additionalProperties: false, required: ["op", "id", "bp", "state", "parent", "index", "props", "styles", "node_json", "title", "description", "why"],
      properties: { op: { type: "string", enum: ["set_styles", "set_props", "insert", "move", "remove", "set_page"] }, id: str, bp: { type: "string", enum: ["desktop", "tablet", "mobile"] }, state: { type: "string", enum: ["normal", "hover", "focus", "active"] }, parent: str, index: { type: "integer" },
        props: { type: "array", items: { type: "object", additionalProperties: false, required: ["key", "value"], properties: { key: str, value: str } } },
        styles: { type: "array", items: { type: "object", additionalProperties: false, required: ["prop", "value"], properties: { prop: str, value: str } } },
        node_json: str, title: str, description: str, why: str } } },
  },
};

// Une page est modifiée par UNE demande à la fois (évite deux propositions concurrentes sur le même brouillon)
const busy = new Set();
// Format de mise en page de la page : l'IA le connaît et ne contourne jamais le verrou
function formatNote(content) {
  const lf = require("../pages/layoutFormat");
  const l = content.theme && content.theme.layout;
  if (!lf.guided(l)) return "Conception libre : aucun format de mise en page imposé.";
  const head = `FORMAT DE MISE EN PAGE : « ${lf.FORMATS[l.format].label} » (largeur maximale ${l.maxWidth || "aucune"} px, marges ${l.gutter} px), ${l.locked ? "VERROUILLÉ" : "déverrouillé"}.`;
  return l.locked
    ? `${head} Propriétés protégées sur les éléments de premier niveau de chaque section : ${lf.PROTECTED.join(", ")}. Ne les modifie JAMAIS, ne tente pas de déverrouiller le format. Si la demande l'exige, renvoie une liste vide et explique le conflit dans « question ».`
    : `${head} Respecte ce format : ne définis pas de largeur fixe sur les éléments de premier niveau sans raison.`;
}

// mode : "create" | "modify" | "fix". selection : identifiant de l'élément choisi ; scope : "page" | "selection".
async function propose(ctx, pageId, input = {}) {
  const page = pages.getPage(ctx, Number(pageId));
  if (!page) throw bad("Page introuvable.");
  if (page.archived_at) throw bad("Cette page est archivée : restaurez-la pour la modifier.");
  const instruction = clip(input.instruction, MAX_INSTRUCTION);
  if (!instruction) throw bad("Décrivez ce que vous voulez obtenir.");
  const mode = ["create", "modify", "fix"].includes(input.mode) ? input.mode : "modify";
  if (Number(input.revision) !== Number(page.revision)) throw new MarketingError("conflict", "La page a été modifiée depuis l'envoi de votre demande : enregistrez puis recommencez.");
  const content = page.working;
  const selection = input.selection ? String(input.selection) : "";
  let scope = null;
  if (input.scope === "selection") {
    const hit = selection && find(content.sections, selection);
    if (!hit) throw bad("Sélectionnez d'abord l'élément ou la section à modifier.");
    scope = [...collectIds([hit.node])];
  }
  const bp = BPS.includes(input.bp) ? input.bp : "desktop";
  const history = (Array.isArray(input.history) ? input.history : []).slice(-6).map((h) => `${h.role === "ai" ? "Assistant" : "Personne"} : ${clip(h.text, 400)}`).join("\n");
  const annotations = (Array.isArray(input.annotations) ? input.annotations : []).slice(0, MAX_ANNOTATIONS).map((a) => ({ kind: clip(a.kind, 12), text: clip(a.text, 300), elements: (Array.isArray(a.elements) ? a.elements : []).slice(0, 6).map(String) }));
  const measures = (Array.isArray(input.measures) ? input.measures : []).slice(0, 40).map((m) => `${clip(m.id, 16)} ${clip(m.type, 20)} ${clip(m.rect, 60)} ${clip(m.computed, 600)}`);
  const prompt = [
    `Écran affiché dans l'éditeur : ${bp}.`,
    selection ? `Élément sélectionné : ${selection}.` : "Aucun élément sélectionné.",
    scope ? `PÉRIMÈTRE AUTORISÉ : uniquement l'élément ${selection} et ses descendants.` : "Périmètre : toute la page.",
    formatNote(content),
    mode === "fix" ? "Mode correction visuelle : la personne a annoté la page. Détermine la CAUSE dans les propriétés du document (marge, intérieur, largeur, alignement, parent, disposition…) et corrige-la ; ne déplace pas l'élément « à l'œil »." : "",
    annotations.length ? "ANNOTATIONS (éléments recouverts, du plus probable au moins probable) :\n" + annotations.map((a, i) => `${i + 1}. ${a.kind}${a.text ? ` « ${a.text} »` : ""} → ${a.elements.join(", ") || "aucun élément"}`).join("\n") : "",
    measures.length ? "MESURES RÉELLES DE L'ÉCRAN (id type rectangle styles calculés) :\n" + measures.join("\n") : "",
    history ? "ÉCHANGES PRÉCÉDENTS :\n" + history : "",
    "DOCUMENT :\n" + outline(content.sections, { focus: selection }),
    "DEMANDE :\n" + instruction,
    "Si la cible est ambiguë, renvoie une liste d'opérations vide et pose UNE question courte dans « question ».",
  ].filter(Boolean).join("\n\n");
  const key = `${ctx.organizationId}:${page.id}`;
  if (busy.has(key)) throw new MarketingError("busy", "Une demande à l'IA est déjà en cours pour cette page.");
  busy.add(key);
  try {
    const r = await ai.call(ctx, `studio_${mode}`, { prompt: prompt, schema: SCHEMA, effort: mode === "create" ? "medium" : "low", system: systemPrompt(ctx, mode), siteId: page.site_id ?? undefined }); // R7 lot 6.2 : consommation attribuée au site de la page (relu en base)
    if (!r.operations || !r.operations.length) return { ok: true, summary: clip(r.summary, 400), question: clip(r.question, 300), changes: [], operations: [], needsConfirm: false, revision: page.revision };
    const ops = normalizeOps(r.operations.map((o) => ({ ...o, parent: o.parent || null, index: Number.isInteger(o.index) && o.index >= 0 ? o.index : -1 })));
    return finalize(ctx, page, ops, { scope, summary: clip(r.summary, 400), mode });
  } finally { busy.delete(key); }
}

function finalize(ctx, page, ops, { scope = null, summary = "", mode = "modify" } = {}) {
  const applied = applyOperations(page.working, ops, { scope });
  const normalized = validate(ctx, page, page.working, applied.content);
  return {
    ok: true, mode, summary, question: "", operations: ops, changes: applied.changes, needsConfirm: applied.destructive, revision: page.revision,
    content: { sections: normalized.sections, title: normalized.title, description: normalized.description },
    stats: { changed: new Set(applied.changes.map((c) => c.target)).size, ops: ops.length },
  };
}

// ---------- Responsive : règles déterministes sur des MESURES RÉELLES de l'éditeur ----------
// Le navigateur mesure le rendu à chaque écran (débordement, taille de texte, zones tactiles…) et envoie des constats ; ce moteur décide des corrections
// à partir du document (jamais des valeurs brutes du navigateur sans contrôle) et les écrit UNIQUEMENT dans l'écran concerné.
const KINDS = {
  overflow: "Contenu plus large que l'écran", fixedWidth: "Largeur fixe trop grande", columns: "Colonnes trop étroites", smallText: "Texte trop petit", bigText: "Texte trop grand",
  tapTarget: "Zone tactile trop petite", bigPadding: "Marges intérieures excessives", image: "Image plus large que l'écran", noWrap: "Éléments en ligne sans retour",
};
const VIEWPORT = { tablet: 820, mobile: 390 };
const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
function proposeFix(issue, hit, bp) {
  const own = ((hit.node.styles || {})[bp]) || {};
  const base = ((hit.node.styles || {}).desktop) || {};
  const set = [];
  const put = (prop, value, why) => set.push({ prop, value, why });
  const vw = VIEWPORT[bp];
  switch (issue.kind) {
    case "overflow": case "fixedWidth": case "image":
      if (issue.kind !== "image") put("width", "100%", "occupe la largeur de l'écran au lieu d'une largeur fixe");
      put("maxWidth", "100%", "ne dépasse jamais l'écran");
      break;
    case "columns":
      if (hit.node.type === "grid" || base.display === "grid" || own.display === "grid") put("columns", bp === "mobile" ? 1 : 2, "moins de colonnes : chaque case reste lisible");
      else { put("flexDirection", "column", "éléments empilés sur l'écran étroit"); }
      break;
    case "noWrap": put("flexWrap", "wrap", "les éléments passent à la ligne au lieu de déborder"); break;
    case "smallText": put("fontSize", "14px", "taille de lecture minimale"); break;
    case "bigText": { const was = px(issue.value) || px(own.fontSize) || px(base.fontSize); if (was) put("fontSize", `${Math.max(24, Math.round(was * (bp === "mobile" ? 0.7 : 0.85)))}px`, "titre réduit pour tenir sur l'écran"); break; }
    case "tapTarget": put("minHeight", "44px", "zone tactile de 44 px au moins"); break;
    case "bigPadding": ["paddingLeft", "paddingRight"].forEach((p) => put(p, bp === "mobile" ? "16px" : "24px", "marge intérieure adaptée à l'écran")); break;
    default: break;
  }
  void vw;
  return set.length ? { op: "set_styles", id: String(hit.node.id), bp, state: "normal", styles: set.map(({ prop, value }) => ({ prop, value })), why: set.map((s) => s.why).join(" ; ") } : null;
}
function responsiveFixes(ctx, pageId, input = {}) {
  const page = pages.getPage(ctx, Number(pageId));
  if (!page) throw bad("Page introuvable.");
  if (Number(input.revision) !== Number(page.revision)) throw new MarketingError("conflict", "La page a été modifiée depuis l'analyse : relancez l'analyse.");
  const issues = (Array.isArray(input.issues) ? input.issues : []).slice(0, 200);
  const report = [], ops = [];
  const seen = new Set();
  issues.forEach((raw) => {
    const bp = raw && VIEWPORT[raw.bp] ? raw.bp : null;
    const kind = raw && Object.hasOwn(KINDS, raw.kind) ? raw.kind : null;
    if (!bp || !kind) return;
    const hit = find(page.working.sections, raw.id);
    if (!hit) { report.push({ id: String(raw.id || ""), kind, bp, label: KINDS[kind], status: "ignoré", reason: "élément introuvable dans la page" }); return; }
    if (hit.node.locked) { report.push({ id: String(raw.id), kind, bp, label: KINDS[kind], name: labelOf(hit.node), status: "ignoré", reason: "élément verrouillé" }); return; }
    const key = `${raw.id}:${kind}:${bp}`;
    if (seen.has(key)) return; seen.add(key);
    const op = proposeFix({ kind, value: raw.value }, hit, bp);
    const row = { id: String(raw.id), name: labelOf(hit.node), kind, label: KINDS[kind], bp, cause: clip(raw.detail, 160), status: op ? "correction proposée" : "à traiter à la main", reason: op ? op.why : "aucune règle sûre pour ce cas" };
    if (op) { try { normalizeOps([op]); row.opIndex = ops.length; ops.push(op); } catch (e) { row.status = "à traiter à la main"; row.reason = e.message; } }
    report.push(row);
  });
  // Regrouper les opérations d'un même élément et d'un même écran (une opération par élément et par écran)
  const merged = new Map();
  ops.forEach((op, i) => { const k = `${op.id}:${op.bp}`; if (!merged.has(k)) merged.set(k, { ...op, styles: [] }); const m = merged.get(k); op.styles.forEach((s) => { if (!m.styles.some((x) => x.prop === s.prop)) m.styles.push(s); }); m.why = [m.why, op.why].filter(Boolean).join(" ; "); void i; });
  const finalOps = [...merged.values()];
  if (!finalOps.length) return { ok: true, report, operations: [], changes: [], revision: page.revision, summary: report.length ? "Aucune correction automatique sûre : traitez ces cas à la main." : "Aucun problème détecté sur les écrans mesurés." };
  const result = finalize(ctx, page, finalOps, { summary: `${finalOps.length} élément(s) à corriger sur ${[...new Set(finalOps.map((o) => o.bp))].join(" et ")}.`, mode: "adapt" });
  // Garantie : l'écran ordinateur n'a pas bougé
  const before = JSON.stringify((page.working.sections || []).map(function strip(n) { return { id: n.id, d: (n.styles || {}).desktop || null, c: (n.children || []).map(strip) }; }));
  const after = JSON.stringify((result.content.sections || []).map(function strip(n) { return { id: n.id, d: (n.styles || {}).desktop || null, c: (n.children || []).map(strip) }; }));
  if (before !== after) throw bad("Contrôle interne : la correction aurait modifié l'écran ordinateur ; elle est refusée.");
  return { ...result, report };
}

module.exports = { propose, responsiveFixes, applyOperations, normalizeOps, validate, outline, find, SCHEMA, KINDS, VIEWPORT, MAX_OPS, systemPrompt, finalize, AiError };
