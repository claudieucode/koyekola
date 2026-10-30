// Product Structure Planner : organisation du catalogue (catégories, sous-catégories, attributs suggérés, filtres). Propositions modifiables AVANT toute création dans le catalogue réel.
// Aucune catégorie redondante : les noms sont comparés sans accents ni pluriel ; une catégorie à enfant unique est signalée. Le moteur n'a ni « marque », ni « collection » natives :
// ils sont proposés comme catégories ou étiquettes seulement si la personne le demande (jamais créés d'office).
const { SECTORS, norm } = require("./library");
const stem = (s) => norm(s).replace(/[^a-z0-9 ]/g, " ").replace(/\b(\w{3,}?)(s|x)\b/g, "$1").replace(/\s+/g, " ").trim();
let counter = 0;
const key = () => `c${Date.now().toString(36)}${(counter++).toString(36)}`;
const clean = (v) => String(v || "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);

function build(sectorKey) {
  const lib = SECTORS[sectorKey] || SECTORS.general;
  const categories = [];
  let n = 0;
  const walk = (list, parent) => list.forEach((c) => { const k = `cat-${++n}`; categories.push({ key: k, name: c.name, parent, attributes: (c.attributes || []).map((a) => ({ name: a.name, values: [...a.values] })), origin: "ai" }); if (c.children) walk(c.children, k); });
  walk(lib.categories, null);
  return { sector: sectorKey, categories, filters: filterSuggestions(categories), notes: lib.notes || [], defaultType: lib.defaultType || "simple", accepted: false };
}
// Filtres proposés = attributs communs (information : le moteur filtre par catégorie et recherche ; les filtres par attribut sont une aide au choix, non créés automatiquement)
function filterSuggestions(categories) {
  const names = new Map();
  for (const c of categories) for (const a of c.attributes) names.set(a.name, [...new Set([...(names.get(a.name) || []), ...a.values])]);
  return [...names].map(([name, values]) => ({ name, values }));
}
function problems(struct) {
  const out = []; const seen = new Map();
  for (const c of struct.categories) {
    const s = `${c.parent || "root"}|${stem(c.name)}`;
    if (seen.has(s)) out.push({ level: "warn", message: `« ${c.name} » ressemble à « ${seen.get(s)} » (même niveau) : catégories redondantes ?` }); else seen.set(s, c.name);
  }
  for (const c of struct.categories.filter((x) => !x.parent)) { const kids = struct.categories.filter((x) => x.parent === c.key); if (kids.length === 1) out.push({ level: "info", message: `« ${c.name} » n'a qu'une sous-catégorie : la fusionner ?` }); }
  if (!struct.categories.length) out.push({ level: "warn", message: "Aucune catégorie : la boutique n'aura qu'un catalogue à plat." });
  return out;
}
const find = (s, k) => { const c = s.categories.find((x) => x.key === k); if (!c) throw new Error("Catégorie introuvable."); return c; };
const depth = (s, c) => { let d = 0, p = c; while (p && p.parent) { d += 1; p = s.categories.find((x) => x.key === p.parent); } return d; };
const ops = {
  add_category(s, o) {
    const name = clean(o.name); if (!name) throw new Error("Nom de catégorie obligatoire.");
    if (o.parent) { const par = find(s, o.parent); if (depth(s, par) >= 2) throw new Error("3 niveaux de catégories au plus."); }
    if (s.categories.some((c) => (c.parent || null) === (o.parent || null) && stem(c.name) === stem(name))) throw new Error(`« ${name} » existe déjà à ce niveau.`);
    if (s.categories.length >= 80) throw new Error("80 catégories au plus.");
    s.categories.push({ key: key(), name, parent: o.parent || null, attributes: [], origin: "user" }); return `Catégorie « ${name} » ajoutée.`;
  },
  rename_category(s, o) { const c = find(s, o.key); const name = clean(o.name); if (!name) throw new Error("Nom obligatoire."); const old = c.name; c.name = name; return `Catégorie « ${old} » renommée « ${name} ».`; },
  move_category(s, o) { const c = find(s, o.key); if (o.parent) { const par = find(s, o.parent); let p = par; while (p) { if (p.key === c.key) throw new Error("Une catégorie ne peut pas devenir son propre descendant."); p = s.categories.find((x) => x.key === p.parent); } if (depth(s, par) >= 2) throw new Error("3 niveaux de catégories au plus."); } c.parent = o.parent || null; return `Catégorie « ${c.name} » déplacée.`; },
  remove_category(s, o) { const c = find(s, o.key); const ids = new Set([c.key]); for (let ch = true; ch;) { ch = false; for (const x of s.categories) if (x.parent && ids.has(x.parent) && !ids.has(x.key)) { ids.add(x.key); ch = true; } } s.categories = s.categories.filter((x) => !ids.has(x.key)); return `Catégorie « ${c.name} »${ids.size > 1 ? ` et ses ${ids.size - 1} sous-catégorie(s)` : ""} retirée(s) du plan.`; },
  set_attributes(s, o) {
    const c = find(s, o.key); if (!Array.isArray(o.attributes) || o.attributes.length > 6) throw new Error("6 attributs au plus.");
    c.attributes = o.attributes.map((a) => ({ name: clean(a.name).slice(0, 40), values: [...new Set((Array.isArray(a.values) ? a.values : String(a.values || "").split(",")).map((v) => clean(v).slice(0, 40)).filter(Boolean))].slice(0, 30) })).filter((a) => a.name && a.values.length);
    return `Attributs de « ${c.name} » modifiés.`;
  },
};
function edit(struct, op) { if (!op || !Object.hasOwn(ops, op.op)) throw new Error("Modification inconnue."); const m = ops[op.op](struct, op); struct.filters = filterSuggestions(struct.categories); struct.accepted = false; return m; }
// Ordre de création : parents avant enfants
const ordered = (s) => { const out = []; const add = (parent) => s.categories.filter((c) => (c.parent || null) === parent).forEach((c) => { out.push(c); add(c.key); }); add(null); return out; };
module.exports = { build, edit, problems, ordered, filterSuggestions, stem };
