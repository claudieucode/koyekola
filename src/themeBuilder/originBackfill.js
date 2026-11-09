// Remplissage PRUDENT de l'origine des pieds de page installés avant les migrations 141/142 (identifiant d'origine et version d'origine).
// Règle : on ne remplit une valeur que si elle est déductible SANS AMBIGUÏTÉ ; sinon elle reste vide (NULL), jamais inventée.
// Idempotent (on peut le relancer sans effet) et non destructif : seules les colonnes origin_key / origin_version VIDES sont remplies, jamais une valeur déjà présente ; aucun document n'est modifié.
//   1. origin_key connue mais origin_version vide :
//        · modèle ANCIEN gelé (footer-aliases.js) : sa composition n'a jamais changé → version 1 ;
//        · autre modèle : version 1 seulement si le modèle est aujourd'hui encore en version 1 (la numérotation commence à 1, donc une installation antérieure à la numérotation ne peut pas avoir une autre version) ;
//          s'il est en version > 1, on ne sait pas quelle version a été installée → vide.
//   2. origin_key vide : le contenu actuel (brouillon ou version en ligne) du pied est comparé, sans les identifiants d'éléments, à la composition de CHAQUE modèle de la bibliothèque (listés ou cachés).
//      Exactement UNE correspondance → origine = ce modèle (version 1 si ancien gelé, sinon sa version) ; zéro ou plusieurs correspondances → vide.
// Usage : fillOrigins(db) → { examined, keyFilled, versionFilled, ambiguous, unknown } ; { dryRun: true } compte sans rien écrire.
const Catalog = require("./catalog");
const Aliases = require("./catalog/footer-aliases");
const { siteFormId } = require("./catalog/use");

// Le document enregistré dans le site peut avoir reçu des valeurs par défaut en plus (ex. « newTab: false ») : il « contient » le modèle si chaque propriété du modèle s'y retrouve à l'identique
// (identifiants d'éléments ignorés, mêmes listes, mêmes longueurs). Un document plus riche qu'un modèle plus pauvre = plusieurs correspondances = ambiguïté = origine laissée vide.
function contains(stored, built) {
  if (Array.isArray(built)) return Array.isArray(stored) && stored.length === built.length && built.every((b, i) => contains(stored[i], b));
  if (built && typeof built === "object") return Boolean(stored) && typeof stored === "object" && !Array.isArray(stored) && Object.keys(built).every((k) => k === "id" || contains(stored[k], built[k]));
  return stored === built;
}
// Même arbre d'éléments (types dans le même ordre) : garde-fou en plus de « contient »
const shape = (n) => (n && typeof n === "object" ? `${n.type || "?"}(${(Array.isArray(n.children) ? n.children : []).map(shape).join(",")})` : "");
const json = (s) => { try { return JSON.parse(s); } catch { return null; } };
const frozen = new Set(Aliases.ANCIENS_IDENTIFIANTS);
// Modèles distincts : un ancien identifiant redirigé par un alias ouvre le NOUVEAU modèle ; on dédoublonne par identifiant actuel (plusieurs anciens identifiants vers un même modèle ne sont pas une ambiguïté).
const allKeys = () => { const d = require("./catalog/footer"); const out = new Set(); for (const k of [...Catalog.entries("footer").map((e) => e.key), ...(d.hiddenLayouts || []).map((l) => l.fullKey)]) { const m = Catalog.find("footer", k); if (m) out.add(m.key); } return [...out]; };

function fillOrigins(db, { dryRun = false } = {}) {
  const out = { examined: 0, keyFilled: 0, versionFilled: 0, ambiguous: 0, unknown: 0 };
  const rows = db.prepare("SELECT id, organization_id, site_id, source_id, origin_key, origin_version FROM mk_tb_templates WHERE type = 'footer' AND source_kind = 'component' AND (origin_key IS NULL OR origin_version IS NULL)").all();
  const keys = allKeys(), built = new Map(); // modèles construits, par formulaire d'inscription du site
  const models = (ctx, siteId) => {
    const f = siteFormId(ctx, siteId) || 0;
    if (!built.has(f)) built.set(f, keys.map((k) => { const doc = Catalog.build("footer", k, { formId: f || undefined }); return doc && doc.section ? { key: k, section: doc.section, shape: shape(doc.section) } : null; }).filter(Boolean));
    return built.get(f);
  };
  for (const r of rows) {
    out.examined += 1;
    let key = r.origin_key, version = r.origin_version;
    if (!key) {
      const ctx = { db, organizationId: r.organization_id }, c = db.prepare("SELECT section, draft FROM mk_web_components WHERE id = ? AND organization_id = ?").get(r.source_id, r.organization_id);
      const found = new Set();
      for (const s of c ? [c.section, c.draft] : []) { const doc = json(s); if (doc) { const sh = shape(doc); for (const m of models(ctx, r.site_id)) if (m.shape === sh && contains(doc, m.section)) found.add(m.key); } } // identifiant gardé tel quel : un ancien identifiant reste valable (« Revenir au modèle d'origine » suit l'alias)
      if (found.size === 1) key = [...found][0]; else { if (found.size > 1) out.ambiguous += 1; else out.unknown += 1; continue; }
      version = null;
    }
    if (version === null || version === undefined) {
      const m = Catalog.find("footer", key);
      if (m && (frozen.has(key) || m.version === 1)) version = 1; // sinon : version inconnue, on laisse vide
    }
    const keyNew = !r.origin_key && key, verNew = (r.origin_version === null || r.origin_version === undefined) && version != null;
    if (!keyNew && !verNew) { if (r.origin_key && r.origin_version == null) out.unknown += 1; continue; }
    if (!dryRun) db.prepare("UPDATE mk_tb_templates SET origin_key = COALESCE(origin_key, ?), origin_version = COALESCE(origin_version, ?) WHERE id = ?").run(key, version, r.id);
    if (keyNew) out.keyFilled += 1; if (verNew) out.versionFilled += 1;
  }
  return out;
}
module.exports = { fillOrigins };
