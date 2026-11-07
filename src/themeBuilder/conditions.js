// Conditions d'affichage (programme 23.1). Un modèle porte { include: [Condition], exclude: [Condition] }. Une condition est un objet à clé `kind` + critères ; les critères d'une condition se combinent en ET,
// les inclusions entre elles en OU, et toute exclusion qui correspond retire le modèle. Aucune expression libre : schéma fermé, valeurs bornées.
const Types = require("./types");

const MAX_RULES = 20, MAX_LIST = 50, MAX_NAME = 80;
const SUBS = Object.freeze({ archive: ["all", "blog", "category", "tag", "author", "date", "search"], product_archive: ["all", "shop", "search", "category", "tag"] });
// kind → vues où la condition peut correspondre (sert à refuser une condition absurde pour le type du modèle)
const KINDS = Object.freeze({
  site: { label: "Tout le site", views: Types.VIEWS },
  front_page: { label: "Page d'accueil", views: ["front"] },
  singular: { label: "Tout contenu individuel", views: ["front", "page", "post", "product"] },
  page: { label: "Pages", views: ["front", "page"] },
  post: { label: "Articles", views: ["post"] },
  child_of: { label: "Enfants d'une page", views: ["page", "post"] },
  author: { label: "Contenus d'un auteur", views: ["page", "post", "product", "archive"] },
  not_found: { label: "Page 404", views: ["not_found"] },
  archive: { label: "Archives", views: ["archive", "search"] },
  search: { label: "Résultats de recherche", views: ["search"] },
  product: { label: "Produits", views: ["product"] },
  product_archive: { label: "Archives de produits", views: ["product_archive", "search"] },
  custom: { label: "Condition personnalisée", views: Types.VIEWS },
  // Visiteur (Header Builder) : connecté ou non ; utilisable en inclusion (« pour les membres ») ou en exclusion (« sauf pour les visiteurs non connectés »)
  visitor: { label: "Visiteur", views: Types.VIEWS },
});
// Critères autorisés par kind : ids (entiers), names (textes), booléens
const CRITERIA = Object.freeze({
  site: [], front_page: [], singular: [], not_found: [], search: [],
  page: ["ids", "author"], post: ["ids", "category", "childCategory", "tag", "author"], product: ["ids", "category", "childCategory", "tag", "author"],
  child_of: ["parent", "direct"], author: ["ids"], archive: ["sub", "names", "child"], product_archive: ["sub", "names", "child"], custom: ["id", "args"], visitor: ["who"],
});
const custom = new Map(); // conditions personnalisées enregistrées par le code serveur (jamais saisies par l'utilisateur)
function registerCondition(id, def) {
  if (!/^[a-z][a-z0-9_]{1,40}$/.test(id) || custom.has(id)) throw new Error(`Condition « ${id} » : nom invalide ou déjà pris.`);
  if (typeof def.check !== "function" || !def.label) throw new Error(`Condition « ${id} » : libellé et fonction check obligatoires.`);
  custom.set(id, { label: def.label, check: def.check, score: Number.isInteger(def.score) ? def.score : 50 });
}
const customDef = (id) => custom.get(id) || null;

const bad = (m) => Object.assign(new Error(m), { code: "invalid_field" });
const names = (v, where) => {
  const list = (Array.isArray(v) ? v : String(v ?? "").split(",")).map((x) => String(x).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, MAX_NAME)).filter(Boolean);
  const out = [...new Set(list)];
  if (out.length > MAX_LIST) throw bad(`${where} : ${MAX_LIST} valeurs au plus.`);
  return out;
};
const ids = (v, where) => {
  const list = (Array.isArray(v) ? v : String(v ?? "").split(",")).map((x) => String(x).trim()).filter(Boolean).map(Number);
  for (const n of list) if (!Number.isInteger(n) || n < 1 || n > 2147483647) throw bad(`${where} : identifiant invalide.`);
  const out = [...new Set(list)];
  if (out.length > MAX_LIST) throw bad(`${where} : ${MAX_LIST} identifiants au plus.`);
  return out;
};
function normalizeOne(raw, where) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw bad(`${where} : condition invalide.`);
  const kind = String(raw.kind || "");
  if (!Object.hasOwn(KINDS, kind)) throw bad(`${where} : type de condition inconnu.`);
  const allowed = CRITERIA[kind], out = { kind };
  for (const k of Object.keys(raw)) if (k !== "kind" && !allowed.includes(k)) throw bad(`${where} : critère « ${k} » non pris en charge pour « ${KINDS[kind].label} ».`);
  for (const k of allowed) {
    const v = raw[k]; if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (k === "ids") { const l = ids(v, where); if (l.length) out.ids = l; }
    else if (k === "author") { const l = ids(v, `${where} (auteur)`); if (l.length) out.author = l; }
    else if (k === "category" || k === "childCategory" || k === "tag" || k === "names") { const l = names(v, where); if (l.length) out[k] = l; }
    else if (k === "parent") { const n = Number(v); if (!Number.isInteger(n) || n < 1) throw bad(`${where} : page parente invalide.`); out.parent = n; }
    else if (k === "direct" || k === "child") out[k] = v === true || v === "true" || v === "1" || v === 1;
    else if (k === "sub") { if (!SUBS[kind].includes(v)) throw bad(`${where} : sous-type d'archive inconnu.`); if (v !== "all") out.sub = v; }
    else if (k === "who") { if (v !== "guest" && v !== "member") throw bad(`${where} : choisissez « visiteur connecté » ou « visiteur non connecté ».`); out.who = v; }
    else if (k === "id") { if (!customDef(String(v))) throw bad(`${where} : condition personnalisée inconnue.`); out.id = String(v); }
    else if (k === "args") { if (typeof v !== "object" || Array.isArray(v) || JSON.stringify(v).length > 500) throw bad(`${where} : arguments trop volumineux.`); out.args = v; }
  }
  if (kind === "child_of" && !out.parent) throw bad(`${where} : choisissez la page parente.`);
  if (kind === "custom" && !out.id) throw bad(`${where} : condition personnalisée manquante.`);
  if (kind === "visitor" && !out.who) throw bad(`${where} : choisissez « visiteur connecté » ou « visiteur non connecté ».`);
  return out;
}
// Normalise { include, exclude } ; vide = « tout le site ». Si `type` est donné, refuse une condition qui ne peut jamais correspondre à une vue de ce type.
function normalize(raw, type = null) {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const side = (list, label) => {
    if (list === undefined || list === null) return [];
    if (!Array.isArray(list)) throw bad(`${label} : liste attendue.`);
    if (list.length > MAX_RULES) throw bad(`${label} : ${MAX_RULES} conditions au plus.`);
    return list.map((c, i) => normalizeOne(c, `${label} ${i + 1}`));
  };
  const include = side(src.include, "Inclusion"), exclude = side(src.exclude, "Exclusion");
  if (type && Types.has(type) && !Types.TYPES[type].global) {
    const views = Types.TYPES[type].views;
    for (const c of include) if (!KINDS[c.kind].views.some((v) => views.includes(v))) throw bad(`« ${KINDS[c.kind].label} » ne peut jamais correspondre à un modèle « ${Types.TYPES[type].label} ».`);
  }
  const keyOf = (c) => JSON.stringify(c);
  if (new Set(include.map(keyOf)).size !== include.length) throw bad("Inclusions en double.");
  if (include.some((c) => exclude.some((e) => keyOf(c) === keyOf(e)))) throw bad("Une condition ne peut pas être à la fois incluse et exclue.");
  return { include, exclude };
}
// Texte lisible (français) d'une condition et d'un jeu de conditions
function describeOne(c) {
  const list = (a) => a.map((x) => `« ${x} »`).join(", ");
  const idl = (a) => a.map((n) => `n° ${n}`).join(", ");
  switch (c.kind) {
    case "site": return "Tout le site";
    case "front_page": return "Page d'accueil";
    case "singular": return "Tout contenu individuel";
    case "not_found": return "Page 404";
    case "search": return "Résultats de recherche";
    case "child_of": return `${c.direct ? "Enfants directs" : "Tous les descendants"} de la page n° ${c.parent}`;
    case "author": return c.ids ? `Contenus des auteurs ${idl(c.ids)}` : "Contenus de tout auteur";
    case "custom": return (customDef(c.id) || { label: c.id }).label;
    case "visitor": return c.who === "member" ? "Visiteurs connectés" : "Visiteurs non connectés";
    case "archive": case "product_archive": {
      const base = c.kind === "archive" ? "Archives" : "Archives de produits";
      const sub = { blog: "du blog", category: "de catégorie", tag: "d'étiquette", author: "d'auteur", date: "par date", search: "(recherche)", shop: "(boutique)" }[c.sub] || "";
      return `${base}${sub ? ` ${sub}` : ""}${c.names ? ` ${list(c.names)}${c.child ? " et sous-éléments" : ""}` : ""}`;
    }
    default: {
      const bits = [];
      if (c.ids) bits.push(idl(c.ids)); if (c.category) bits.push(`catégorie ${list(c.category)}`); if (c.childCategory) bits.push(`sous-catégorie de ${list(c.childCategory)}`);
      if (c.tag) bits.push(`étiquette ${list(c.tag)}`); if (c.author) bits.push(`auteur ${idl(c.author)}`);
      return `${KINDS[c.kind].label}${bits.length ? ` (${bits.join(" ET ")})` : ""}`;
    }
  }
}
const describe = (cond) => {
  const c = cond || { include: [], exclude: [] };
  return { include: c.include && c.include.length ? c.include.map(describeOne).join(" OU ") : "Tout le site", exclude: c.exclude && c.exclude.length ? c.exclude.map(describeOne).join(", ") : "" };
};
module.exports = { KINDS, CRITERIA, SUBS, MAX_RULES, MAX_LIST, normalize, normalizeOne, describe, describeOne, registerCondition, customDef };
