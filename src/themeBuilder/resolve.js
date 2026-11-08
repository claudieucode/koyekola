// Moteur de RÉSOLUTION (programme 23.1) : quel modèle s'applique à un contexte ? Pur (aucune base, aucun serveur) et déterministe.
// Règles (voir docs/theme-builder/ELEMENTOR_DISPLAY_CONDITIONS.md) : brouillon et archivé ne s'appliquent jamais ; une exclusion qui correspond l'emporte ;
// inclusions combinées en OU (aucune = tout le site) ; le plus précis gagne ; à égalité le plus récemment publié, puis l'identifiant le plus petit.
const Types = require("./types");
const C = require("./conditions");
const M = require("./match");

const stamp = (t) => { const n = Date.parse(t.publishedAt || t.published_at || ""); return Number.isFinite(n) ? n : 0; };
const conds = (t) => t.conditions || { include: [], exclude: [] };
// Évalue UN modèle ; renvoie toujours une raison lisible
function evaluate(t, ctx) {
  if (t.status !== "published") return { applies: false, state: "inactive", reason: t.status === "archived" ? "Modèle archivé." : "Modèle en brouillon (jamais appliqué)." };
  if (!Types.appliesTo(t.type, ctx.view)) return { applies: false, state: "incompatible", reason: `Un modèle « ${(Types.TYPES[t.type] || { label: t.type }).label} » ne s'applique pas à cette page.` };
  const { include = [], exclude = [] } = conds(t);
  const ex = exclude.find((c) => M.matches(c, ctx));
  if (ex) return { applies: false, state: "excluded", reason: `Exclu : ${C.describeOne(ex)}.` };
  if (!include.length) return { applies: true, score: 10, matchedBy: "Tout le site", state: "candidate", reason: "Aucune condition : tout le site." };
  let best = null;
  for (const c of include) if (M.matches(c, ctx)) { const s = M.scoreOf(c); if (!best || s > best.s) best = { s, c }; }
  if (!best) return { applies: false, state: "not_matching", reason: "Aucune condition d'inclusion ne correspond à cette page." };
  return { applies: true, score: best.s, matchedBy: C.describeOne(best.c), state: "candidate", reason: `Correspond à : ${C.describeOne(best.c)}.` };
}
const order = (a, b) => b.score - a.score || stamp(b.t) - stamp(a.t) || a.t.id - b.t.id;
// resolve(templates, ctx, { type }) → { winner, candidates, explain }
function resolve(templates, ctx, { type = null } = {}) {
  const pool = (templates || []).filter((t) => (!type || t.type === type));
  const results = pool.map((t) => ({ t, ...evaluate(t, ctx) }));
  const cands = results.filter((r) => r.applies).sort(order);
  const winner = cands.length ? cands[0].t : null;
  const explain = results.map((r) => {
    let state = r.state, reason = r.reason;
    if (r.applies) { const i = cands.indexOf(r); state = i === 0 ? "winner" : "candidate"; if (i > 0) reason = `${r.reason} Écarté : « ${cands[0].t.name} » est ${cands[0].score > r.score ? "plus précis" : "prioritaire à précision égale (plus récent ou plus ancien identifiant)"}.`; }
    return { id: r.t.id, name: r.t.name, type: r.t.type, state, score: r.score ?? null, reason };
  });
  return { winner, candidates: cands.map((c) => ({ id: c.t.id, score: c.score, matchedBy: c.matchedBy })), explain };
}
// Deux conditions peuvent-elles correspondre à une même page ? Conservateur (peut sur-signaler, ne rate pas un chevauchement).
const LISTS = ["ids", "category", "childCategory", "tag", "author", "names", "roles"];
function condOverlap(a, b) {
  const va = C.KINDS[a.kind].views, vb = C.KINDS[b.kind].views;
  if (!va.some((v) => vb.includes(v))) return false;
  if (a.kind !== b.kind) return true;
  if (a.kind === "visitor" && a.who !== b.who) return false; // un visiteur connecté n'est jamais un visiteur non connecté : pas de chevauchement
  for (const k of LISTS) if (a[k] && b[k] && !a[k].some((x) => b[k].map((y) => String(y).toLowerCase()).includes(String(x).toLowerCase()))) return false;
  if (a.kind === "child_of" && a.parent !== b.parent && a.direct && b.direct) return false;
  if (a.sub && b.sub && a.sub !== b.sub) return false;
  if (a.kind === "visitor" && a.state !== b.state) return false;
  return true;
}
const topScore = (t) => { const inc = conds(t).include; return inc.length ? Math.max(...inc.map(M.scoreOf)) : 10; };
const same = (a, b) => JSON.stringify(conds(a)) === JSON.stringify(conds(b));
// Conflits entre modèles PUBLIÉS d'un même type. `blocking` : doublon exact (à refuser) ; `warning` : même précision sur un contexte commun (l'ancienneté tranche).
function conflicts(templates) {
  const pub = (templates || []).filter((t) => t.status === "published"), out = [];
  for (let i = 0; i < pub.length; i += 1) for (let j = i + 1; j < pub.length; j += 1) {
    const a = pub[i], b = pub[j]; if (a.type !== b.type) continue;
    if (same(a, b)) { out.push({ severity: "blocking", kind: "duplicate", a: a.id, b: b.id, message: `« ${a.name} » et « ${b.name} » ont exactement les mêmes conditions : un seul des deux peut être publié.`, suggestion: "Modifiez les conditions de l'un ou archivez-le." }); continue; }
    const ia = conds(a).include.length ? conds(a).include : [{ kind: "site" }], ib = conds(b).include.length ? conds(b).include : [{ kind: "site" }];
    if (!ia.some((x) => ib.some((y) => condOverlap(x, y)))) continue;
    if (topScore(a) === topScore(b)) out.push({ severity: "warning", kind: "ambiguous", a: a.id, b: b.id, message: `« ${a.name} » et « ${b.name} » peuvent s'appliquer à la même page avec la même précision : le plus récemment publié l'emporte.`, suggestion: "Précisez les conditions de l'un (page, catégorie…) ou ajoutez une exclusion." });
  }
  return out;
}
module.exports = { evaluate, resolve, conflicts, condOverlap, topScore };
