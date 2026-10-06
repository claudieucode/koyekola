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

// ---------- Règles d'affichage des pop-ups (toutes combinées par « ET ») ----------
// pages     : { mode: "all" | "include" | "exclude", paths: ["/blog", "/cours/photo*"] } (« * » final = préfixe)
// devices   : ["desktop", "mobile"] (vide = tous)
// minPages  : nombre de pages vues pendant la visite avant d'afficher (1 = dès la première)
// utmSource, utmCampaign, referrer : la visite doit en provenir (contient, sans tenir compte de la casse)
// (pages vues et provenance : mémoire de l'onglet en cours seulement, effacée à sa fermeture, jamais envoyée au serveur.
// « Nouveau / ancien visiteur » demande un marqueur durable : il viendra avec le bandeau de consentement.)
// hideForStudents : jamais pour une personne connectée à son compte ; hideIfSubscribed : jamais pour un contact abonné
function normalizePopupRules(input) {
  const src = input && typeof input === "object" ? input : {};
  const out = {};
  const mode = ["include", "exclude"].includes(src.pagesMode) ? src.pagesMode : "all";
  if (mode !== "all") {
    const paths = String(Array.isArray(src.paths) ? src.paths.join("\n") : src.paths || "").split(/[\n,]/).map((p) => p.trim()).filter(Boolean);
    if (!paths.length) throw bad("Pop-up : indiquez au moins une page (ex. /blog ou /cours/photoshop*).");
    if (paths.length > 20) throw bad("Pop-up : 20 pages au plus.");
    for (const p of paths) if (!/^\/[^\s<>"'`\\]{0,200}$/.test(p)) throw bad(`Pop-up : « ${p.slice(0, 60)} » n'est pas une page du site (elle commence par « / »).`);
    out.pages = { mode, paths };
  }
  const devices = (Array.isArray(src.devices) ? src.devices : src.devices ? [src.devices] : []).filter((d) => ["desktop", "mobile"].includes(d));
  if (devices.length === 1) out.devices = devices;
  const minPages = Number(src.minPages);
  if (Number.isInteger(minPages) && minPages > 1 && minPages <= 20) out.minPages = minPages;
  for (const k of ["utmSource", "utmCampaign", "referrer"]) {
    const v = String(src[k] ?? "").replace(/[\x00-\x1f\x7f<>"'`]/g, "").trim().slice(0, 80);
    if (v) out[k] = v;
  }
  if (src.hideForStudents === true || src.hideForStudents === "1" || src.hideForStudents === "on") out.hideForStudents = true;
  if (src.hideIfSubscribed === true || src.hideIfSubscribed === "1" || src.hideIfSubscribed === "on") out.hideIfSubscribed = true;
  return out;
}
// Règle de pages, vérifiée par le serveur pour l'adresse demandée
function pageMatches(rules, pathname) {
  if (!rules.pages) return true;
  const hit = rules.pages.paths.some((p) => (p.endsWith("*") ? pathname.startsWith(p.slice(0, -1)) : pathname === p || pathname === `${p}/`));
  return rules.pages.mode === "include" ? hit : !hit;
}

module.exports.normalizePopupRules = normalizePopupRules;
module.exports.pageMatches = pageMatches;
