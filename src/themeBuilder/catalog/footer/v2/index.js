// BIBLIOTHÈQUE DE PIEDS DE PAGE « v2 » : 100 modèles issus des concepts (docs/footer-v2/CONCEPTS_100.md), graphiquement INDÉPENDANTS du site (ftMode « solo »).
// Un module par FAMILLE de concept (v2/familles/<famille>.js, 14 familles) ; chaque modèle s'écrit avec ./kit-v2.js. Ce fichier assemble les modèles construits (comme footer.js pour la bibliothèque actuelle)
// et fournit toutesConstruites() : la bibliothèque (footer.js) ne bascule sur la v2 QUE quand les 14 familles sont `built` (100 modèles). Jamais de mélange v2 / actuel dans la liste publique.
const { wrap } = require("../moteur");
const KitV2 = require("./kit-v2");
const { G } = KitV2;

const FAMILLES_V2_CLES = ["corporate-institutions", "finance-assurance", "saas-tech-startup", "ecommerce-mode-luxe", "medias", "agences-portfolios-art", "restauration-hotellerie-tourisme", "immobilier-architecture", "education-universite", "sante-bienetre", "culture-evenementiel", "associatif-ong", "auto-sport-mobilite", "minimalisme-experimental", "artisans-batiment", "commerce-proximite", "services-personne", "professions-liberales", "vie-locale"];
const CIBLE_V2 = { "corporate-institutions": 8, "finance-assurance": 6, "saas-tech-startup": 9, "ecommerce-mode-luxe": 9, medias: 8, "agences-portfolios-art": 11, "restauration-hotellerie-tourisme": 8, "immobilier-architecture": 7, "education-universite": 6, "sante-bienetre": 6, "culture-evenementiel": 6, "associatif-ong": 6, "auto-sport-mobilite": 5, "minimalisme-experimental": 5 , "artisans-batiment": 5, "commerce-proximite": 5, "services-personne": 5, "professions-liberales": 5, "vie-locale": 5 };
const VERSION_DEFAUT = 1, AJOUT_DEFAUT = "2026-11-09";
const charger = (cle) => require(`./familles/${cle}`);

// assemble({ familles }) : pure et testable (les tests simulent des familles construites)
function assemble({ familles = FAMILLES_V2_CLES.map(charger) } = {}) {
  const parCle = new Map(), vus = new Set(), noms = new Set();
  for (const f of familles) {
    if (!f || !f.key || !f.label || !Array.isArray(f.models)) throw new Error("Pied v2 : module de famille invalide (key, label, models).");
    if (parCle.has(f.key)) throw new Error(`Pied v2 : famille « ${f.key} » en double.`);
    const cible = f.target ?? CIBLE_V2[f.key];
    if (f.built && f.models.length !== cible) throw new Error(`Pied v2 : la famille « ${f.key} » est marquée construite mais compte ${f.models.length} modèles (cible ${cible}).`);
    if (f.models.length > cible) throw new Error(`Pied v2 : la famille « ${f.key} » compte plus de modèles que sa cible (${cible}).`);
    parCle.set(f.key, f);
  }
  const nouveaux = [], skins = new Map();
  for (const f of familles) for (const m of f.models) {
    KitV2.modeleV2(m, f.key);
    if (vus.has(m.id)) throw new Error(`Pied v2 : identifiant « ${m.id} » en double.`);
    if (noms.has(m.name)) throw new Error(`Pied v2 : nom « ${m.name} » en double.`);
    vus.add(m.id); noms.add(m.name);
    const skin = m.identity;
    if (skins.has(skin.key)) throw new Error(`Pied v2 : identité « ${skin.key} » partagée (chaque modèle a la sienne).`);
    skins.set(skin.key, skin);
    const resp = m.responsive || {};
    const rows = m.structure ? m.structure.rows.map((r) => ({ ...r, ...(resp.tablet || r.tablet ? { tablet: { ...(resp.tablet || {}), ...(r.tablet || {}) } } : {}), ...(resp.mobile || r.mobile ? { mobile: { ...(resp.mobile || {}), ...(r.mobile || {}) } } : {}) })) : null;
    nouveaux.push({ key: m.id, fullKey: m.id, family: f.key, skin: skin.key, label: m.name, tags: m.tags, desc: m.description, version: m.version ?? VERSION_DEFAUT, addedAt: m.addedAt ?? AJOUT_DEFAUT, model: m,
      ftMode: "solo", ftVars: skin.ftVars, ...(m.racine ? { racine: m.racine } : {}), v2: true, build: (k, env) => (m.compose ? m.compose(k, env || {}, G) : [wrap(k.S, rows, env || {})]) });
  }
  const familleDe = (f) => ({ key: f.key, label: f.label, description: f.description || "", built: f.built === true, target: f.target ?? CIBLE_V2[f.key] });
  const construites = [...parCle.values()].filter((f) => f.built === true);
  const total = nouveaux.length;
  return { familles: [...parCle.values()].map(familleDe), nouveaux, skins: [...skins.values()].map(({ mood: _m, ...x }) => x), total,
    toutesConstruites: parCle.size === FAMILLES_V2_CLES.length && construites.length === parCle.size && total === Object.values(CIBLE_V2).reduce((a, b) => a + b, 0) };
}

const REEL = assemble();
module.exports = { ...REEL, assemble, FAMILLES_V2_CLES, CIBLE_V2, VERSION_DEFAUT, AJOUT_DEFAUT, KitV2 };
