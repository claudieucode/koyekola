// KOLAKISA — réglages du moteur média, PAR SITE (principal = « main ») : tailles des images (miniature, moyenne, grande) et organisation des nouveaux envois.
//  - Un seul moteur de traitement : src/marketing/media/variants.js (sharp, versions fabriquées à la demande puis conservées). Ce module ne fait que dire QUELLES dimensions
//    appliquer à l'image d'un site ; il ne traite aucune image.
//  - Dimensions = boîte maximale en pixels. Largeur ET hauteur bornent l'image sans la déformer ni l'agrandir ; hauteur 0 = libre (largeur seule, comportement historique de Kolakisa).
//    Miniature recadrée : dimensions exactes (recadrage centré, sans déformation) ; une image plus petite que la cible n'est jamais agrandie (l'original est servi).
//  - Valeurs par défaut = comportement historique de Kolakisa (miniature 150 de large, moyenne 640, grande 1024, dossier unique) : aucune page publiée ne change tant que rien n'est réglé.
//  - Les nouvelles dimensions s'appliquent aux nouvelles demandes d'image ; les versions déjà fabriquées ne bougent pas (leurs adresses restent valides : « known »).
// Stockage : mk_settings (clés « mediasize.<main|site_N>.<champ> »).
const db = require("../config/database");

const MIN = 16, MAX = 4000;
const DEFAULTS = Object.freeze({ thumb_w: 150, thumb_h: 0, thumb_crop: false, medium_w: 640, medium_h: 0, large_w: 1024, large_h: 0, organize: false });
const NAMED = ["thumbnail", "medium", "large"];
const FIELD = { thumbnail: ["thumb_w", "thumb_h"], medium: ["medium_w", "medium_h"], large: ["large_w", "large_h"] };
const scopeKey = (siteId) => (siteId ? `site_${Number(siteId)}` : "main");
const orgId = (ctx) => (ctx && ctx.organizationId) || (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;

let memo = new Map();
const invalidate = () => { memo = new Map(); };
function readRaw(siteId) {
  const k = scopeKey(siteId);
  if (memo.has(k)) return memo.get(k);
  let rows = [];
  try { const org = orgId(); rows = org ? db.prepare("SELECT key, value FROM mk_settings WHERE organization_id = ? AND key LIKE ?").all(org, `mediasize.${k}.%`) : []; } catch { rows = []; } // base sans tables du marketing (contexte isolé) : valeurs d'origine
  const m = Object.fromEntries(rows.map((r) => [r.key.slice(`mediasize.${k}.`.length), r.value]));
  memo.set(k, m);
  return m;
}
const intOf = (v, d) => (/^\d{1,5}$/.test(String(v ?? "")) ? Number(v) : d);
function get(siteId = null) {
  const m = readRaw(siteId);
  let known = [];
  try { known = JSON.parse(m.known || "[]").filter((c) => /^\d{2,4}x\d{1,4}c?$/.test(c)); } catch { known = []; }
  return {
    thumb_w: intOf(m.thumb_w, DEFAULTS.thumb_w), thumb_h: intOf(m.thumb_h, DEFAULTS.thumb_h), thumb_crop: m.thumb_crop === "1",
    medium_w: intOf(m.medium_w, DEFAULTS.medium_w), medium_h: intOf(m.medium_h, DEFAULTS.medium_h),
    large_w: intOf(m.large_w, DEFAULTS.large_w), large_h: intOf(m.large_h, DEFAULTS.large_h),
    organize: m.organize === "1", known,
  };
}
// Dimensions d'une taille nommée : { w, h, crop, code }. « code » est la forme de l'adresse de la version (w x h, « c » si recadrée).
function spec(siteId, key) {
  const c = get(siteId);
  const [fw, fh] = FIELD[key];
  const crop = key === "thumbnail" && c.thumb_crop && c[fh] > 0;
  return { key, w: c[fw], h: crop ? c[fh] : c[fh], crop, code: `${c[fw]}x${c[fh]}${crop ? "c" : ""}` };
}
// Réglage identique à l'historique : l'adresse de la version reste celle d'avant (largeur seule), les pages publiées ne changent pas d'un octet
const LEGACY = { thumbnail: 150, medium: 640, large: 1024 };
const isLegacy = (siteId, key) => { const s = spec(siteId, key); return s.w === LEGACY[key] && s.h === 0 && !s.crop; };
// Formes d'adresse acceptées pour un site : les trois tailles actuelles et toutes celles qui ont été utilisées (une page publiée peut les citer)
function allowedCodes(siteId) {
  const c = get(siteId);
  return new Set([...NAMED.map((k) => spec(siteId, k).code), ...c.known]);
}

// ---------- Validation ----------
function validate(input) {
  const errors = [];
  const num = (v, label, { min, allowZero = false }) => {
    const raw = String(v ?? "").trim();
    if (raw === "") { errors.push(`${label} : valeur obligatoire.`); return null; }
    if (!/^-?\d+$/.test(raw)) { errors.push(`${label} : nombre entier de pixels attendu.`); return null; }
    const n = Number(raw);
    if (allowZero && n === 0) return 0;
    if (n < min) { errors.push(`${label} : ${min} pixels au moins${allowZero ? " (ou 0 pour ne pas limiter)" : ""}.`); return null; }
    if (n > MAX) { errors.push(`${label} : ${MAX} pixels au plus.`); return null; }
    return n;
  };
  const out = {
    thumb_w: num(input.thumb_w, "Miniatures · largeur", { min: MIN }), thumb_h: num(input.thumb_h, "Miniatures · hauteur", { min: MIN, allowZero: true }),
    medium_w: num(input.medium_w, "Taille moyenne · largeur maximale", { min: MIN }), medium_h: num(input.medium_h, "Taille moyenne · hauteur maximale", { min: MIN, allowZero: true }),
    large_w: num(input.large_w, "Grande taille · largeur maximale", { min: MIN }), large_h: num(input.large_h, "Grande taille · hauteur maximale", { min: MIN, allowZero: true }),
    thumb_crop: input.thumb_crop === true || input.thumb_crop === "1" || input.thumb_crop === "on" || input.thumb_crop === "true",
    organize: input.organize === true || input.organize === "1" || input.organize === "on" || input.organize === "true",
  };
  if (!errors.length && out.thumb_crop && out.thumb_h === 0) errors.push("Miniatures : le recadrage exige une hauteur (dimensions exactes).");
  if (!errors.length) {
    if (out.thumb_w > out.medium_w && out.medium_w > 0 && !out.thumb_crop) errors.push("La miniature ne peut pas être plus large que la taille moyenne.");
    if (out.medium_w > out.large_w) errors.push("La taille moyenne ne peut pas être plus large que la grande taille.");
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: out };
}

// ---------- Enregistrement ----------
function save(siteId, input, ctx) {
  const v = validate(input);
  if (!v.ok) return v;
  const org = orgId(ctx);
  if (!org) throw new Error("Aucune organisation.");
  const before = get(siteId);
  const val = v.value;
  const next = { ...before, ...val };
  // Mémorise les formes d'adresse des dimensions précédentes : leurs versions déjà publiées restent servies
  const known = new Set(before.known);
  for (const k of NAMED) { const [fw, fh] = FIELD[k]; const crop = k === "thumbnail" && before.thumb_crop && before[fh] > 0; if (!(before[fw] === LEGACY[k] && before[fh] === 0 && !crop)) known.add(`${before[fw]}x${before[fh]}${crop ? "c" : ""}`); }
  const set = db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')");
  const del = db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?");
  const k = scopeKey(siteId);
  const fields = { thumb_w: val.thumb_w, thumb_h: val.thumb_h, thumb_crop: val.thumb_crop ? "1" : "", medium_w: val.medium_w, medium_h: val.medium_h, large_w: val.large_w, large_h: val.large_h, organize: val.organize ? "1" : "", known: [...known].slice(-30).length ? JSON.stringify([...known].slice(-30)) : "" };
  db.exec("BEGIN");
  try {
    for (const [f, value] of Object.entries(fields)) {
      const key = `mediasize.${k}.${f}`;
      const isDefault = f === "known" ? value === "" : String(value) === String(DEFAULTS[f] === true ? "1" : DEFAULTS[f] === false ? "" : DEFAULTS[f]);
      if (isDefault) del.run(org, key); else set.run(org, key, String(value));
    }
    db.exec("COMMIT");
  } catch (e) { db.exec("ROLLBACK"); invalidate(); throw e; }
  invalidate();
  return { ok: true, config: get(siteId), changed: JSON.stringify(before) !== JSON.stringify(get(siteId)), next };
}

// Écriture d'UN champ (API des réglages) : la configuration entière est revalidée (cohérence entre champs)
function setField(siteId, field, value, ctx) {
  if (!Object.hasOwn(DEFAULTS, field)) throw new Error("Champ inconnu.");
  const cur = get(siteId);
  const r = save(siteId, { thumb_w: cur.thumb_w, thumb_h: cur.thumb_h, thumb_crop: cur.thumb_crop, medium_w: cur.medium_w, medium_h: cur.medium_h, large_w: cur.large_w, large_h: cur.large_h, organize: cur.organize, [field]: value }, ctx);
  if (!r.ok) { const { UserError } = require("../utils/errors"); throw new UserError(r.errors[0]); }
  return r;
}

module.exports = { setField, DEFAULTS, NAMED, FIELD, LEGACY, MIN, MAX, get, spec, isLegacy, allowedCodes, validate, save, invalidate };
