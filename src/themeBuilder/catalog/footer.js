// Catalogue « Pied de page » : ASSEMBLEUR. Il charge un module par famille métier (footer/familles/<famille>.js, 15 familles, 100 modèles visés) et les anciens modèles (footer/ancien.js) rattachés à leur nouvelle famille.
// Sortie : le même format « catalogue plat » que les en-têtes ({ flat, families, layouts, skins… }) ; chaque modèle devient la section d'un composant du Page Builder, exactement comme avant
// (même insertion par copie, mêmes vignettes et aperçus calculés depuis le document réel).
//
// LOGIQUE DE LISTE (documentée dans docs/footer-builder/FOOTER_RECONSTRUCTION_ARCHITECTURE.md) :
//   · tous les NOUVEAUX modèles écrits dans les modules de famille sont listés ;
//   · un ANCIEN modèle (rattaché à une des 15 familles, voir FAMILLE_ANCIEN) n'est listé que si sa famille n'est pas « built » ET s'il n'a pas été redirigé par un alias vers un nouveau modèle ;
//   · tous les anciens restent OUVRABLES par leur identifiant (alias, voir footer-aliases.js) même quand ils ne sont plus listés ;
//   · cible finale : 15 familles built = exactement 100 nouveaux modèles listés, 0 ancien listé. Tant que ce n'est pas le cas, la liste n'est jamais vide ni dupliquée (un ancien listé ne l'est qu'une fois).
const ancien = require("./footer/ancien");
const { wrap } = require("./footer/moteur");
const Kit = require("./footer/kit-conception");
const Aliases = require("./footer-aliases");
const { IDENT, IDENT2 } = require("./identities");

// VERSION de composition d'un modèle (entier >= 1, 1 par défaut quand le modèle n'en déclare pas) et date d'ajout (AAAA-MM-JJ). Voir docs/footer-builder/FOOTER_BIBLIOTHEQUE_INTERFACE.md.
const VERSION_DEFAUT = 1;
const AJOUT_DEFAUT = "2026-11-08"; // date de la reconstruction : valeur des nouveaux modèles qui ne déclarent pas `addedAt` ; les anciens modèles n'ont pas de date (null)
const FAMILLES_CLES = ["minimalistes", "corporate", "ecommerce", "saas-tech", "editoriaux", "creatifs-portfolios", "education", "communautes", "services", "restauration-hotellerie", "immobilier", "finance-juridique", "ong-associations", "landing-pages", "institutionnels"];
const CIBLE = { minimalistes: 8, corporate: 8, ecommerce: 8, "saas-tech": 8, editoriaux: 7, "creatifs-portfolios": 6, education: 6, communautes: 6, services: 7, "restauration-hotellerie": 6, immobilier: 5, "finance-juridique": 6, "ong-associations": 5, "landing-pages": 6, institutionnels: 8 };

// Rattachement d'un ancien modèle à une des 15 familles (tant que sa famille n'est pas construite, il est listé sous ce nom). Règle : identité sectorielle du modèle (SECTOR) sinon famille d'origine.
const FAMILLE_SECTEUR = { resto: "restauration-hotellerie", cabinet: "finance-juridique", portfolio: "creatifs-portfolios", agence: "creatifs-portfolios", ecole: "education", saas: "saas-tech", media: "editoriaux", mode: "ecommerce", immo: "immobilier", asso: "ong-associations", sante: "services" };
const FAMILLE_ORIGINE = { minimal: "minimalistes", colonnes: "corporate", newsletter: "communautes", contact: "services", reseaux: "communautes", boutique: "ecommerce", editorial: "editoriaux", entreprise: "corporate", creatif: "creatifs-portfolios", centre: "landing-pages" };
const familleAncien = (l) => (ancien.SECTOR[l.key] && FAMILLE_SECTEUR[ancien.SECTOR[l.key]]) || (/^(saas)-/.test(l.key) ? "saas-tech" : FAMILLE_ORIGINE[l.family]);

const charger = (cle) => require(`./footer/familles/${cle}`);

// assemble({ familles, legacy, alias }) : pure et testable (les tests simulent des familles construites). Par défaut : les vrais modules, l'ancien catalogue et la vraie table d'alias.
function assemble({ familles = FAMILLES_CLES.map(charger), legacy = ancien, alias = Aliases.ALIAS, anciens = Aliases.ANCIENS_IDENTIFIANTS } = {}) {
  const parCle = new Map();
  for (const f of familles) {
    if (!f || !f.key || !f.label || !Array.isArray(f.models)) throw new Error("Pied de page : module de famille invalide (key, label, models).");
    if (parCle.has(f.key)) throw new Error(`Pied de page : famille « ${f.key} » en double.`);
    if (f.built && f.models.length !== (f.target ?? CIBLE[f.key])) throw new Error(`Pied de page : la famille « ${f.key} » est marquée construite mais compte ${f.models.length} modèles (cible ${f.target ?? CIBLE[f.key]}).`);
    parCle.set(f.key, f);
  }
  const ambiances = new Map(Kit.AMBIANCES.map((a) => [a.key.replace(/^amb-/, ""), a]));
  const seen = new Set();
  const nouveaux = [];
  for (const f of familles) for (const m of f.models) {
    Kit.modele(m, f.key);
    if (seen.has(m.id)) throw new Error(`Pied de page : identifiant « ${m.id} » en double.`);
    if (anciens.includes(m.id)) throw new Error(`Pied de page : « ${m.id} » est un ancien identifiant (réservé).`);
    seen.add(m.id);
    const skin = typeof m.identity === "string" ? ambiances.get(m.identity) : m.identity;
    if (!skin) throw new Error(`Pied de page : identité inconnue pour « ${m.id} ».`);
    if (typeof m.identity !== "string") ambiances.set(skin.key.replace(/^amb-/, ""), skin);
    if (m.version !== undefined && !(Number.isInteger(m.version) && m.version >= 1 && m.version <= 9999)) throw new Error(`Pied de page : version de « ${m.id} » invalide (entier de 1 à 9999 attendu).`);
    if (m.addedAt !== undefined && !(/^\d{4}-\d{2}-\d{2}$/.test(String(m.addedAt)) && !Number.isNaN(Date.parse(m.addedAt)))) throw new Error(`Pied de page : addedAt de « ${m.id} » invalide (AAAA-MM-JJ attendu).`);
    const resp = m.responsive || {};
    const rows = m.structure.rows.map((r) => ({ ...r, ...(resp.tablet || r.tablet ? { tablet: { ...(resp.tablet || {}), ...(r.tablet || {}) } } : {}), ...(resp.mobile || r.mobile ? { mobile: { ...(resp.mobile || {}), ...(r.mobile || {}) } } : {}) }));
    nouveaux.push({ key: m.id, fullKey: m.id, family: f.key, skin: skin.key, label: m.name, tags: m.tags, desc: m.description, version: m.version ?? VERSION_DEFAUT, addedAt: m.addedAt ?? AJOUT_DEFAUT, model: m, build: (k, env) => [wrap(k.S, rows, env)] });
  }
  // anciens : rattachés à une famille ; listés seulement si leur famille n'est pas construite et qu'ils ne sont pas redirigés
  const tous = legacy.layouts.map((l) => {
    const id = `${l.key}.${l.keySkin || l.skin}`;
    return { ...l, family: familleAncien(l), legacy: true, version: VERSION_DEFAUT, addedAt: null, legacyFamily: l.family, fullKey: id };
  });
  const listes = [], caches = [];
  for (const l of tous) {
    const redirige = alias[l.fullKey] && alias[l.fullKey] !== l.fullKey;
    const construite = parCle.has(l.family) && parCle.get(l.family).built === true;
    (redirige || construite ? caches : listes).push(l);
  }
  const layouts = [...nouveaux, ...listes];
  const familleDe = (cle) => { const f = parCle.get(cle); return { key: cle, label: f ? f.label : cle, description: f ? f.description : "", built: !!(f && f.built), target: f ? f.target ?? CIBLE[cle] : CIBLE[cle] }; };
  // familles affichées dans le filtre : celles qui ont au moins un modèle listé (toutes les 15 à la fin)
  const utiles = new Set(layouts.map((l) => l.family));
  const families = [...parCle.keys()].filter((c) => utiles.has(c)).map(familleDe);
  const hiddenFamilies = [...parCle.keys()].filter((c) => !utiles.has(c)).map(familleDe);
  const skins = [...IDENT2.map(({ mood: _m, ...x }) => x), ...IDENT, ...[...ambiances.values()].map(({ mood: _m, ...x }) => x)];
  const resolveAlias = (cle) => {
    if (!Object.hasOwn(alias, cle)) return null;
    let cur = cle;
    for (let i = 0; i < 10 && Object.hasOwn(alias, cur) && alias[cur] !== cur; i++) cur = alias[cur];
    return cur;
  };
  return { type: "footer", kind: "component", flat: true, sortable: true, ownSkins: true, families, hiddenFamilies, layouts, hiddenLayouts: caches, skins, aliases: alias, resolveAlias,
    familles: [...parCle.values()].map((f) => familleDe(f.key)), nouveaux: nouveaux.length, anciensListes: listes.length };
}

module.exports = { ...assemble(), assemble, VERSION_DEFAUT, AJOUT_DEFAUT, FAMILLES_CLES, CIBLE, familleAncien };
