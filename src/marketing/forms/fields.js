// Réglages par champ d'un formulaire (obligatoire, affichage, condition d'affichage) et fichier joint.
// La logique conditionnelle est TOUJOURS recalculée sur le serveur : un champ caché n'est ni exigé ni enregistré, quoi
// que le navigateur envoie. Les conditions ne peuvent viser qu'un champ placé AVANT (aucune boucle possible).
const { MarketingError } = require("../errors");

const OPS = { equals: "vaut", notEquals: "ne vaut pas", filled: "est rempli" };
const ACCEPT = {
  images: { label: "Image (JPEG, PNG, WebP)", mimes: ["image/jpeg", "image/png", "image/webp"], attr: "image/jpeg,image/png,image/webp" },
  pdf: { label: "PDF", mimes: ["application/pdf"], attr: "application/pdf" },
  both: { label: "Image ou PDF", mimes: ["image/jpeg", "image/png", "image/webp", "application/pdf"], attr: "image/jpeg,image/png,image/webp,application/pdf" },
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const bad = (m) => new MarketingError("invalid_field", m);

// Champs du formulaire dans l'ordre d'affichage : standards puis propriétés. key = nom du champ envoyé.
function orderedFields(form, propertyDefs) {
  return [
    ...form.fields.map((key) => ({ key, kind: "standard", type: "text" })),
    ...propertyDefs.map((d) => ({ key: d.name, kind: "property", type: d.type, options: d.options, label: d.label })),
  ];
}

function normalizeFieldSettings(input, form, propertyDefs) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const list = orderedFields(form, propertyDefs);
  const out = {};
  list.forEach((f, i) => {
    const s = src[f.key];
    if (!s || typeof s !== "object") return;
    const r = {};
    if (s.required === true || s.required === "1" || s.required === "on") r.required = true;
    if (s.display === "radio" && f.type === "select") r.display = "radio";
    if (s.display === "textarea" && (f.kind === "standard" || f.type === "text")) r.display = "textarea";
    const c = s.showIf;
    if (c && typeof c === "object" && c.field) {
      const target = list.findIndex((x) => x.key === c.field);
      if (target < 0 || target >= i) throw bad("Condition d'affichage : elle doit porter sur un champ placé AVANT ce champ.");
      if (!Object.hasOwn(OPS, c.op)) throw bad("Condition d'affichage : opérateur inconnu.");
      const value = String(c.value ?? "").trim().slice(0, 100);
      if (c.op !== "filled" && !value) throw bad("Condition d'affichage : indiquez la valeur attendue.");
      r.showIf = { field: c.field, op: c.op, ...(c.op === "filled" ? {} : { value }) };
    }
    if (Object.keys(r).length) out[f.key] = r;
  });
  return out;
}

function normalizeFileField(input) {
  const s = input && typeof input === "object" ? input : {};
  if (!(s.enabled === true || s.enabled === "1" || s.enabled === "on")) return {};
  const label = String(s.label ?? "").replace(/[\x00-\x1f\x7f]/g, " ").trim().slice(0, 80) || "Fichier joint";
  return { enabled: true, label, required: s.required === true || s.required === "1" || s.required === "on", accept: Object.hasOwn(ACCEPT, s.accept) ? s.accept : "both" };
}

const filled = (v) => v !== undefined && v !== null && String(v).trim() !== "" && v !== false;
// Champ affiché pour ces valeurs ? (sa condition ET celle du champ dont il dépend : un champ caché masque ses dépendants)
function isVisible(key, settings, values, seen = new Set()) {
  const c = settings[key] && settings[key].showIf;
  if (!c) return true;
  if (seen.has(key)) return false;
  seen.add(key);
  if (!isVisible(c.field, settings, values, seen)) return false;
  const v = values[c.field];
  const text = Array.isArray(v) ? v.join(",") : String(v ?? "").trim();
  if (c.op === "filled") return filled(v);
  if (c.op === "equals") return text.toLowerCase() === c.value.toLowerCase();
  return text.toLowerCase() !== c.value.toLowerCase();
}

// Valeurs envoyées → champs visibles seulement ; message si un champ visible obligatoire est vide
function applySettings(form, propertyDefs, values, labelOf) {
  const settings = form.fieldSettings || {};
  const hidden = new Set();
  for (const f of orderedFields(form, propertyDefs)) {
    if (!isVisible(f.key, settings, values)) { hidden.add(f.key); continue; }
    if (settings[f.key] && settings[f.key].required && !filled(values[f.key])) return { ok: false, message: `« ${labelOf(f)} » est obligatoire.` };
  }
  return { ok: true, hidden };
}

// Type réel d'un fichier d'après ses premiers octets (jamais d'après son nom ou ce que déclare le navigateur)
function sniffMime(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.slice(0, 4).toString("latin1") === "RIFF" && buffer.slice(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (buffer.slice(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  return null;
}
const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

module.exports = { OPS, ACCEPT, MAX_FILE_BYTES, EXT, orderedFields, normalizeFieldSettings, normalizeFileField, isVisible, applySettings, sniffMime };
