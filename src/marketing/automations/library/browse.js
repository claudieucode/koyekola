// Recherche, filtres, tri, favoris, récents et pagination de la bibliothèque. Lecture seule : aucune écriture ici.
// Les calculs coûteux mais invariants (texte indexé, durée, contrôle structurel) sont mémorisés par parcours.
const { GROUPS, AUDIENCES, GOALS, CHANNELS, channelOf } = require("./index");
const { evaluate, STATUSES } = require("./availability");
const { TRIGGERS } = require("../catalog");

const PAGE_SIZE = 24;
const STEP_RANGES = { courts: [1, 3], moyens: [4, 7], longs: [8, 99] };
const VIEWS = ["tous", "favoris", "recents"];
const SORTS = { pertinence: "Pertinence", nom: "Nom (A → Z)", etapes: "Moins d'étapes", populaires: "Plus utilisés", duree: "Durée la plus courte" };

// Minuscules, sans accents ni apostrophes ; le pluriel (s, x final) est ignoré pour qu'« élèves » trouve « élève »
const fold = (text) => String(text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, " ");
// Synonymes courants (le site dit « élève » ; on cherche aussi « étudiant », « apprenant »… ; « mail » = « e-mail »)
const SYNONYMS = { etudiant: "eleve", etudiante: "eleve", apprenant: "eleve", apprenante: "eleve", mail: "email", courriel: "email", relancer: "relance", reactiver: "reactivation", abandonne: "abandon" };
const words = (text) => fold(text).split(/[^a-z0-9]+/).filter(Boolean).map((w) => (w.length > 3 ? w.replace(/[sx]$/, "") : w)).map((w) => SYNONYMS[w] || w);

const triggerLabel = (j) => (j.trigger ? (TRIGGERS[j.trigger.event] || { label: `Événement « ${j.trigger.event} » envoyé par votre site` }).label : "");

// Champs indexés avec leur poids (un terme trouvé dans le nom pèse plus que dans une description)
function indexOf(j, stepsText) {
  const fields = [
    [5, j.label], [3, j.objective], [3, triggerLabel(j)], [2, j.description], [2, stepsText], [2, (j.keywords || []).join(" ")],
    [1, GROUPS.find(([k]) => k === j.group)[1]], [1, AUDIENCES[j.audience]], [1, CHANNELS[channelOf(j)]], [1, GOALS[j.goal]], [1, j.note],
  ];
  return fields.map(([weight, text]) => ({ weight, words: new Set(words(text)) }));
}

// ---------- Parties statiques mémorisées (par clé de parcours) ----------
const staticCache = new Map();
function statics(j, describe) {
  if (staticCache.has(j.key)) return staticCache.get(j.key);
  const info = describe(j);
  const out = { ...info, index: indexOf(j, info.stepsText) };
  staticCache.set(j.key, out);
  return out;
}

const score = (entry, terms) => {
  let total = 0;
  for (const t of terms) {
    let best = 0;
    for (const f of entry.index) {
      // un terme est trouvé s'il est un mot, ou le début d'un mot (frappe en cours : « panie » trouve « panier »)
      const hit = f.words.has(t) || (t.length >= 3 && [...f.words].some((w) => w.startsWith(t)));
      if (hit) best = Math.max(best, f.weight);
    }
    if (!best) return 0;
    total += best;
  }
  return total;
};

// → { entries (page), total, shownCount, hasMore, counts: { groups, statuses }, facets, query, ... }
function browse({ journeys, describe, env, favorites, usage, recents, query = {} }) {
  const all = journeys.map((j) => {
    const s = statics(j, describe);
    const verdict = evaluate(j, env);
    return { j, ...s, verdict, favorite: favorites.has(j.key), uses: usage.get(j.key) || 0, order: 0 };
  });
  all.forEach((e, i) => { e.order = i; });

  const q = {
    q: String(query.q || "").trim().slice(0, 80),
    categorie: GROUPS.some(([k]) => k === query.categorie) ? query.categorie : "",
    canal: Object.hasOwn(CHANNELS, query.canal) ? query.canal : "",
    objectif: Object.hasOwn(GOALS, query.objectif) ? query.objectif : "",
    declencheur: String(query.declencheur || "").slice(0, 80),
    audience: Object.hasOwn(AUDIENCES, query.audience) ? query.audience : "",
    statut: query.statut === "tous" || Object.hasOwn(STATUSES, query.statut) ? query.statut : "",
    etapes: Object.hasOwn(STEP_RANGES, query.etapes) ? query.etapes : "",
    vue: VIEWS.includes(query.vue) ? query.vue : "tous",
    tri: Object.hasOwn(SORTS, query.tri) ? query.tri : "",
    page: Math.min(50, Math.max(1, Number.parseInt(query.page, 10) || 1)),
  };
  const terms = words(q.q);

  const base = (e, { ignoreCategory = false, ignoreStatus = false } = {}) => {
    if (!ignoreStatus) {
      if (q.statut === "") { if (!e.verdict.usable) return false; }
      else if (q.statut !== "tous" && e.verdict.status !== q.statut) return false;
    }
    if (!ignoreCategory && q.categorie && e.j.group !== q.categorie) return false;
    if (q.canal && e.channel !== q.canal) return false;
    if (q.objectif && e.j.goal !== q.objectif) return false;
    if (q.declencheur && !(e.j.trigger && e.j.trigger.event === q.declencheur)) return false;
    if (q.audience && e.j.audience !== q.audience) return false;
    if (q.etapes) { const [lo, hi] = STEP_RANGES[q.etapes]; if (!(e.stepCount >= lo && e.stepCount <= hi)) return false; }
    if (q.vue === "favoris" && !e.favorite) return false;
    if (q.vue === "recents" && !recents.includes(e.j.key)) return false;
    return true;
  };

  let list = all.filter((e) => base(e));
  if (terms.length) {
    list = list.map((e) => ({ e, s: score(e, terms) })).filter((x) => x.s > 0);
    list.forEach((x) => { x.e.relevance = x.s; });
    list = list.map((x) => x.e);
  }

  const sort = q.tri || (terms.length ? "pertinence" : q.vue === "recents" ? "recents" : "");
  const cmp = {
    pertinence: (a, b) => (b.relevance || 0) - (a.relevance || 0) || a.order - b.order,
    nom: (a, b) => a.j.label.localeCompare(b.j.label, "fr"),
    etapes: (a, b) => a.stepCount - b.stepCount || a.order - b.order,
    populaires: (a, b) => b.uses - a.uses || a.order - b.order,
    duree: (a, b) => a.duration - b.duration || a.order - b.order,
    recents: (a, b) => recents.indexOf(a.j.key) - recents.indexOf(b.j.key),
    "": (a, b) => a.order - b.order,
  }[sort];
  list.sort(cmp);

  const limit = q.page * PAGE_SIZE;
  const searching = terms.length > 0 || Object.entries(q).some(([k, v]) => !["page", "tri", "vue"].includes(k) && v) || q.vue !== "tous";

  // Effectifs : par catégorie (autres filtres appliqués), par statut, favoris et récents (vue d'ensemble)
  const counts = { groups: {}, statuses: {}, favorites: all.filter((e) => e.favorite).length, recents: recents.length, usable: all.filter((e) => e.verdict.usable).length, total: all.length };
  const termFilter = (e) => !terms.length || score(e, terms) > 0;
  for (const e of all) {
    if (base(e, { ignoreCategory: true }) && termFilter(e)) counts.groups[e.j.group] = (counts.groups[e.j.group] || 0) + 1;
    counts.statuses[e.verdict.status] = (counts.statuses[e.verdict.status] || 0) + 1;
  }

  // Valeurs proposées par les filtres (uniquement celles qui existent réellement)
  const triggers = new Map();
  for (const e of all) if (e.verdict.usable && e.j.trigger) triggers.set(e.j.trigger.event, triggerLabel(e.j));

  return {
    q, searching, sort,
    entries: list.slice(0, limit),
    total: list.length, hasMore: list.length > limit, nextPage: q.page + 1, pageSize: PAGE_SIZE,
    counts,
    facets: {
      groups: GROUPS, channels: Object.entries(CHANNELS), goals: Object.entries(GOALS), audiences: Object.entries(AUDIENCES),
      triggers: [...triggers].sort((a, b) => a[1].localeCompare(b[1], "fr")), sorts: Object.entries(SORTS),
      stepRanges: [["courts", "1 à 3 étapes"], ["moyens", "4 à 7 étapes"], ["longs", "8 étapes et plus"]],
      statuses: Object.entries(STATUSES).map(([key, s]) => [key, s.label]),
    },
    recentEntries: q.vue === "tous" && !searching ? recents.map((key) => all.find((e) => e.j.key === key)).filter((e) => e && e.verdict.usable).slice(0, 4) : [],
  };
}

module.exports = { browse, PAGE_SIZE, SORTS, words, fold };
