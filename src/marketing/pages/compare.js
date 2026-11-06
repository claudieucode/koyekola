// Comparaison de deux contenus de page (une version et l'état actuel) : chaque section et chaque élément porte un
// identifiant stable, la comparaison se fait donc élément par élément — ajouté, retiré, contenu modifié, style
// modifié, déplacé, masqué / affiché, verrouillé / déverrouillé — plus le titre, la description et le référencement.
const nodes = require("./nodes");
const sections = require("./sections");

const STYLE_KEYS = ["styles", "states", "style", "hideOn"];
const FLAG_KEYS = ["hidden", "locked"];
const OWN_KEYS = new Set(["id", "children", "name", "audience", ...STYLE_KEYS, ...FLAG_KEYS]);

function labelOf(item, isNode) {
  const type = isNode ? (nodes.NODE_TYPES[item.type] || {}).label : item.type === "layout" ? "Section libre" : ((sections.TYPES[item.type] || {}).label || item.type);
  const p = item.props || {};
  const text = String(p.text || p.label || (p.html ? p.html.replace(/<[^>]+>/g, " ") : "") || item.title || item.heading || item.label || "").replace(/\s+/g, " ").trim().slice(0, 60);
  return item.name ? `${type || item.type} « ${item.name} »` : text ? `${type || item.type} · ${text}` : (type || item.type);
}
// Contenu propre d'un élément (sans ses enfants, son style, ses drapeaux) : sert à savoir si son contenu a changé
function contentOf(item) {
  const out = {};
  for (const [k, v] of Object.entries(item)) if (!OWN_KEYS.has(k)) out[k] = v;
  if (item.name !== undefined) out.name = item.name;
  if (item.audience !== undefined) out.audience = item.audience;
  return JSON.stringify(out);
}
function flatten(content) {
  const map = new Map();
  (content.sections || []).forEach((s, i) => {
    if (!s || !s.id) return;
    map.set(s.id, { item: s, isNode: false, parent: null, index: i });
    if (s.type === "layout") {
      const visit = (list, parent) => (list || []).forEach((n, j) => { if (!n || !n.id) return; map.set(n.id, { item: n, isNode: true, parent, index: j }); visit(n.children, n.id); });
      visit(s.children, s.id);
    }
  });
  return map;
}
function compareContents(before, after) {
  const a = flatten(before || {}), b = flatten(after || {});
  const changes = { page: [], added: [], removed: [], modified: [] };
  const field = (k, label) => { if (JSON.stringify((before || {})[k] ?? "") !== JSON.stringify((after || {})[k] ?? "")) changes.page.push(label); };
  field("title", "Titre de la page");
  field("description", "Description de la page");
  field("seo", "Référencement (SEO)");
  const noMotion = (c) => { const t = { ...((c || {}).theme || {}) }; delete t.motionScenes; return { theme: t }; };
  { const x = noMotion(before), y = noMotion(after); if (JSON.stringify(x) !== JSON.stringify(y)) changes.page.push("Couleurs de la page"); }
  if (JSON.stringify(((before || {}).theme || {}).motionScenes ?? null) !== JSON.stringify(((after || {}).theme || {}).motionScenes ?? null)) changes.page.push("Scènes et mouvement de la page");
  for (const [id, x] of b) if (!a.has(id)) changes.added.push({ id, label: labelOf(x.item, x.isNode) });
  for (const [id, x] of a) if (!b.has(id)) changes.removed.push({ id, label: labelOf(x.item, x.isNode) });
  // Rang d'un élément parmi ses voisins présents dans les DEUX contenus (un ajout ou un retrait ne déplace pas les autres)
  const rank = (map, other) => {
    const groups = new Map();
    for (const [id, x] of map) if (other.has(id) && other.get(id).parent === x.parent) { const g = groups.get(x.parent) || []; g.push([x.index, id]); groups.set(x.parent, g); }
    const out = new Map();
    for (const g of groups.values()) g.sort((p, q) => p[0] - q[0]).forEach(([, id], i) => out.set(id, i));
    return out;
  };
  const ra = rank(a, b), rb = rank(b, a);
  for (const [id, y] of b) {
    const x = a.get(id);
    if (!x) continue;
    const what = [];
    if (contentOf(x.item) !== contentOf(y.item)) what.push("contenu");
    if (STYLE_KEYS.some((k) => JSON.stringify(x.item[k] ?? null) !== JSON.stringify(y.item[k] ?? null))) what.push("style");
    if (x.parent !== y.parent) what.push("déplacé dans un autre conteneur");
    else if (ra.get(id) !== rb.get(id)) what.push("déplacé");
    if (Boolean(x.item.hidden) !== Boolean(y.item.hidden)) what.push(y.item.hidden ? "masqué" : "affiché");
    if (Boolean(x.item.locked) !== Boolean(y.item.locked)) what.push(y.item.locked ? "verrouillé" : "déverrouillé");
    if (what.length) changes.modified.push({ id, label: labelOf(y.item, y.isNode), what });
  }
  changes.total = changes.page.length + changes.added.length + changes.removed.length + changes.modified.length;
  return changes;
}

module.exports = { compareContents };
