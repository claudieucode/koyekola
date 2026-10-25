// « Blog » de Mon espace (/formateur/blog) : espace de travail éditorial. Ce module ne contient que ce qui est propre à cette page : lecture validée des paramètres (état, recherche, tri, page),
// adresses reconstruites à partir de ces seuls paramètres (jamais d'adresse libre : pas de redirection ouverte) et libellés de site. Toute la logique métier (liste, publication, corbeille,
// duplication) reste dans services/articles, partagée avec le CMS.
const db = require("../config/database");
const articles = require("./articles");

const PER_PAGE = 20;
const STATE_LABELS = { toutes: "Tous", publies: "Publiés", programmes: "Programmés", brouillons: "Brouillons", corbeille: "Corbeille" };
// Tris proposés (sous-ensemble des tris du service) : le plus récemment modifié d'abord par défaut
const SORT_LABELS = { modifie: "Modifiés récemment", recent: "Créés récemment", ancien: "Créés en premier", publie: "Date de publication", titre: "Titre (A → Z)", titre_desc: "Titre (Z → A)" };

// Paramètres d'une requête (query ou corps de formulaire) : toute valeur inconnue est ramenée à la valeur par défaut, jamais conservée
function parse(src = {}) {
  const one = (v) => (Array.isArray(v) ? v[v.length - 1] : v);
  const etat = String(one(src.etat) || "");
  const tri = String(one(src.tri) || "");
  return {
    etat: articles.STATES.includes(etat) ? etat : "toutes",
    q: String(one(src.q) || "").trim().slice(0, 100),
    tri: Object.hasOwn(SORT_LABELS, tri) ? tri : "modifie",
    page: Math.max(1, Number.parseInt(one(src.page), 10) || 1),
  };
}

// Adresse de la liste pour un état de la page ; seuls les paramètres qui s'écartent des valeurs par défaut figurent dans l'adresse
function url(state, over = {}) {
  const s = { ...state, ...over };
  const qs = new URLSearchParams();
  if (s.etat && s.etat !== "toutes") qs.set("etat", s.etat);
  if (s.q) qs.set("q", s.q);
  if (s.tri && s.tri !== "modifie") qs.set("tri", s.tri);
  if (s.page > 1) qs.set("page", String(s.page));
  const text = qs.toString();
  return `/formateur/blog${text ? `?${text}` : ""}`;
}

// Site des articles d'une page : null = site principal (rien à indiquer) ; sinon { id, name }. Une seule requête pour toute la page, jamais une par ligne.
function siteLabels(ids) {
  const out = new Map();
  if (!ids.length) return out;
  const marks = ids.map(() => "?").join(", ");
  try {
    const rows = db.prepare(`SELECT cs.content_id AS post_id, s.id, s.name FROM mk_content_sites cs JOIN mk_sites s ON s.id = cs.site_id WHERE cs.content_type = 'post' AND cs.content_id IN (${marks})`).all(...ids);
    for (const r of rows) out.set(r.post_id, { id: r.id, name: r.name });
  } catch { /* module sites indisponible : aucun libellé, la liste reste affichée */ }
  return out;
}

// Phrase de synthèse : uniquement des effectifs réels
function summary(counts) {
  if (!counts.toutes && !counts.corbeille) return "Rédigez, programmez et publiez vos articles.";
  const part = (n, one, many) => (n ? `${n} ${n > 1 ? many : one}` : "");
  const bits = [part(counts.publies, "publié", "publiés"), part(counts.programmes, "programmé", "programmés"), part(counts.brouillons, "brouillon", "brouillons")].filter(Boolean);
  return `${counts.toutes} article${counts.toutes > 1 ? "s" : ""}${bits.length ? ` : ${bits.join(", ")}` : ""}.`;
}

module.exports = { PER_PAGE, STATE_LABELS, SORT_LABELS, parse, url, siteLabels, summary };
