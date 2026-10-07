// Formulaires d'inscription publics (jalon M5 — Capture, partie 1) : un formulaire = une adresse /f/:slug, un texte de
// consentement présenté (preuve enregistrée), des champs facultatifs, une liste optionnelle. Un contact créé par un
// formulaire suit EXACTEMENT les mêmes règles que partout ailleurs (compliance/consent.js) : aucun raccourci ici.
const { checkCtx, cleanText, audit, emit, MarketingError } = require("../audience/shared");
const { upsertContact, getContact } = require("../audience/contacts");
const { cleanTimeZone } = require("../sending/sendtime");
const { addToList } = require("../audience/lists");
const { recordConsent } = require("../compliance/consent");
const { setContactProperties, validatePropertyValues } = require("../audience/properties");
const { tagContact } = require("../audience/tags");
const crypto = require("crypto");
const { truncateIp } = require("../compliance/consent");
const { recordSmsConsent } = require("../sms/consent");
const { normalizePhone } = require("../sms/phone");
const { getSmsConfig } = require("../sms/config");
const fs = require("fs");
const path = require("path");
const fieldRules = require("./fields");

const BLOCKED = new Set(["bounced", "complained", "suppressed"]);

// Champs facultatifs proposables (l'adresse est TOUJOURS demandée, en plus, jamais dans cette liste)
const FIELD_CATALOG = { first_name: "Prénom", last_name: "Nom", phone: "Téléphone", company: "Société", country: "Pays" };
const STATUSES = ["draft", "published"];
const MAX_SLUG = 80;
// Déclencheurs de pop-up : delay (secondes avant affichage), scroll (% de la page défilé), exit (intention de quitter, souris vers le haut)
const POPUP_TRIGGERS = ["delay", "scroll", "exit"];
const POPUP_TRIGGER_RANGE = { delay: [1, 120], scroll: [1, 100], exit: [0, 0] };
const POPUP_FREQUENCY_RANGE = [1, 90];
const MAX_PROPERTY_FIELDS = 10;
const MAX_TAGS = 5;
// Préfixe des propriétés dans le formulaire public : jamais de collision avec email, consent ou le champ piège « website »
const PROP_PREFIX = "prop_";

const slugify = (text) =>
  String(text ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, MAX_SLUG) || "formulaire";

function uniqueSlug(ctx, base, excludeId) {
  let slug = base;
  for (let n = 2; ; n++) {
    const row = ctx.db.prepare("SELECT id FROM mk_forms WHERE organization_id = ? AND slug = ?").get(ctx.organizationId, slug);
    if (!row || row.id === excludeId) return slug;
    slug = `${base}-${n}`.slice(0, MAX_SLUG);
  }
}

function validateFields(input) {
  const list = [...new Set((Array.isArray(input) ? input : []).map((v) => String(v).trim()).filter(Boolean))];
  for (const f of list) if (!Object.hasOwn(FIELD_CATALOG, f)) throw new MarketingError("invalid_field", `Champ inconnu : « ${f} ».`);
  return list;
}

// Propriétés personnalisées demandées (clés de mk_property_defs, affichées dans l'ordre de la liste des propriétés) : chacune doit exister
function validatePropertyFields(ctx, input) {
  const list = [...new Set((Array.isArray(input) ? input : []).map((v) => String(v).trim()).filter(Boolean))];
  if (list.length > MAX_PROPERTY_FIELDS) throw new MarketingError("invalid_field", `${MAX_PROPERTY_FIELDS} propriétés au plus par formulaire.`);
  for (const key of list) {
    if (!ctx.db.prepare("SELECT 1 FROM mk_property_defs WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key)) {
      throw new MarketingError("invalid_field", `Propriété inconnue : « ${key.slice(0, 40)} ».`);
    }
  }
  return list;
}

// Étiquettes posées à l'inscription : texte séparé par des virgules (ou tableau) → noms nettoyés, sans doublon
// (insensible à la casse, comme les étiquettes elles-mêmes), 5 au plus. Créées à la volée à la première inscription.
function validateTags(input) {
  const raw = Array.isArray(input) ? input : String(input ?? "").split(",");
  const seen = new Set();
  const list = [];
  for (const item of raw) {
    const name = String(item).replace(/[\x00-\x1f\x7f]/g, "").trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    if (name.length > 64) throw new MarketingError("invalid_field", "Une étiquette fait 64 caractères au plus.");
    seen.add(name.toLowerCase());
    list.push(name);
  }
  if (list.length > MAX_TAGS) throw new MarketingError("invalid_field", `${MAX_TAGS} étiquettes au plus par formulaire.`);
  return list;
}

// Redirection après inscription : une adresse web complète (http/https, sans identifiants) ou un chemin du site
// (« /… », jamais « // » ni « /\ » qui mèneraient ailleurs). Tout autre protocole (javascript:, data:…) est refusé.
function validateRedirect(input) {
  const text = String(input ?? "").trim();
  if (!text) return null;
  const invalid = () => new MarketingError("invalid_field", "Adresse de redirection invalide : une adresse web complète (https://…) ou un chemin du site (/…) est attendu.");
  if (text.length > 2048 || /[\s\x00-\x1f]/.test(text)) throw invalid();
  if (text.startsWith("/")) {
    if (/^\/[\/\\]/.test(text)) throw invalid();
    return text;
  }
  let url;
  try { url = new URL(text); } catch { throw invalid(); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw invalid();
  return url.href;
}

// Un entier borné, ou la valeur par défaut si absent/hors bornes (jamais une exception pour un réglage secondaire)
function boundedInt(value, [min, max], fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

const parseJson = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };

function rowToForm(row) {
  return {
    id: row.id, name: row.name, slug: row.slug, status: row.status, fields: JSON.parse(row.fields), consentText: row.consent_text,
    listId: row.list_id, thankYouText: row.thank_you_text, viewCount: row.view_count, submitCount: row.submit_count,
    propertyFields: JSON.parse(row.property_fields || "[]"), tags: JSON.parse(row.tags || "[]"), redirectUrl: row.redirect_url || null,
    doubleOptin: Boolean(row.double_optin), smsConsentText: row.sms_consent_text || "",
    popupEnabled: Boolean(row.popup_enabled), popupTrigger: row.popup_trigger, popupTriggerValue: row.popup_trigger_value, popupFrequencyDays: row.popup_frequency_days,
    fieldSettings: parseJson(row.field_settings, {}), fileField: parseJson(row.file_field, {}), popupRules: parseJson(row.popup_rules, {}),
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

// doubleOptin : activé par la page de création (nouveaux formulaires) ; désactivé par défaut ici pour les appelants existants
function createForm(ctx, { name, fields, consentText, listId, doubleOptin = false }) {
  checkCtx(ctx);
  const cleanName = cleanText(name, { max: 80, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom est obligatoire.");
  const cleanConsent = cleanText(consentText, { max: 500, field: "consentText" });
  if (cleanConsent.length < 3) throw new MarketingError("invalid_field", "Le texte de consentement est obligatoire (c'est la preuve présentée à la personne).");
  const cleanFields = validateFields(fields);
  const list = Number.isInteger(listId) ? listId : null;
  const slug = uniqueSlug(ctx, slugify(name));
  const id = Number(
    ctx.db
      .prepare("INSERT INTO mk_forms (organization_id, name, slug, fields, consent_text, list_id, created_by, double_optin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, cleanName, slug, JSON.stringify(cleanFields), cleanConsent, list, ctx.userId ?? null, doubleOptin ? 1 : 0).lastInsertRowid
  );
  audit(ctx, "form.created", "form", id, { name: cleanName, slug });
  return getForm(ctx, id);
}

function listForms(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT * FROM mk_forms WHERE organization_id = ? ORDER BY id DESC").all(ctx.organizationId).map(rowToForm);
}

function requireFormRow(ctx, id) {
  const row = ctx.db.prepare("SELECT * FROM mk_forms WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
  if (!row) throw new MarketingError("not_found", "Formulaire introuvable.");
  return row;
}

function getForm(ctx, id) {
  checkCtx(ctx);
  return rowToForm(requireFormRow(ctx, id));
}

// Texte de la case « accepter les SMS » : vide = pas de SMS proposé ; sinon une vraie phrase (c'est la preuve)
function validateSmsConsentText(value) {
  const text = cleanText(value ?? "", { max: 500, field: "smsConsentText" });
  if (text && text.length < 10) throw new MarketingError("invalid_field", "Le texte d'accord SMS est trop court : écrivez la phrase exacte que la personne accepte (ex. « J'accepte de recevoir des SMS de KOLAKISA. Désinscription : STOP »).");
  return text;
}

function updateForm(ctx, id, { name, fields, consentText, listId, thankYouText, popupEnabled, popupTrigger, popupTriggerValue, popupFrequencyDays, propertyFields, tags, redirectUrl, doubleOptin, smsConsentText, fieldSettings, fileField, popupRules }) {
  checkCtx(ctx);
  const current = rowToForm(requireFormRow(ctx, id)); // existe et appartient à l'organisation
  // Réglages absents de l'appel (ancien appelant) : on garde la valeur actuelle plutôt que de l'effacer
  const cleanPropertyFields = propertyFields === undefined ? current.propertyFields : validatePropertyFields(ctx, propertyFields);
  const cleanTags = tags === undefined ? current.tags : validateTags(tags);
  const cleanRedirect = redirectUrl === undefined ? current.redirectUrl : validateRedirect(redirectUrl);
  const cleanSms = smsConsentText === undefined ? current.smsConsentText : validateSmsConsentText(smsConsentText);
  const cleanName = cleanText(name, { max: 80, field: "name" });
  if (!cleanName) throw new MarketingError("invalid_field", "Le nom est obligatoire.");
  const cleanConsent = cleanText(consentText, { max: 500, field: "consentText" });
  if (cleanConsent.length < 3) throw new MarketingError("invalid_field", "Le texte de consentement est obligatoire.");
  const cleanFields = validateFields(fields);
  const cleanThanks = cleanText(thankYouText, { max: 300, field: "thankYouText" });
  const list = Number.isInteger(listId) ? listId : null;
  const trigger = POPUP_TRIGGERS.includes(popupTrigger) ? popupTrigger : "delay";
  const triggerValue = boundedInt(popupTriggerValue, POPUP_TRIGGER_RANGE[trigger], trigger === "delay" ? 8 : trigger === "scroll" ? 50 : 0);
  const frequencyDays = boundedInt(popupFrequencyDays, POPUP_FREQUENCY_RANGE, 7);
  // Réglages par champ et fichier joint (absents de l'appel = inchangés), vérifiés sur les champs ENREGISTRÉS ici
  const defs = propertyFieldDefs(ctx.db, ctx.organizationId, { propertyFields: cleanPropertyFields });
  const cleanSettings = fieldRules.normalizeFieldSettings(fieldSettings === undefined ? current.fieldSettings : fieldSettings, { fields: cleanFields }, defs);
  const cleanFile = fileField === undefined ? current.fileField : fieldRules.normalizeFileField(fileField);
  const cleanRules = popupRules === undefined ? current.popupRules : fieldRules.normalizePopupRules(popupRules);
  if (popupEnabled && cleanFile.enabled) throw new MarketingError("invalid_field", "Un formulaire avec fichier joint ne peut pas s'afficher en pop-up (l'envoi de fichier se fait sur sa page /f/… ou dans une page du site).");
  ctx.db
    .prepare(
      `UPDATE mk_forms SET name = ?, fields = ?, consent_text = ?, list_id = ?, thank_you_text = ?,
         popup_enabled = ?, popup_trigger = ?, popup_trigger_value = ?, popup_frequency_days = ?,
         property_fields = ?, tags = ?, redirect_url = ?, double_optin = ?, sms_consent_text = ?, field_settings = ?, file_field = ?, popup_rules = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(cleanName, JSON.stringify(cleanFields), cleanConsent, list, cleanThanks, popupEnabled ? 1 : 0, trigger, triggerValue, frequencyDays,
      JSON.stringify(cleanPropertyFields), JSON.stringify(cleanTags), cleanRedirect, (doubleOptin === undefined ? current.doubleOptin : doubleOptin) ? 1 : 0, cleanSms,
      JSON.stringify(cleanSettings), JSON.stringify(cleanFile), JSON.stringify(cleanRules), id);
  audit(ctx, "form.updated", "form", id, { name: cleanName, popupEnabled: Boolean(popupEnabled) });
  return getForm(ctx, id);
}

function setStatus(ctx, id, status) {
  checkCtx(ctx);
  if (!STATUSES.includes(status)) throw new MarketingError("invalid_field", "Statut invalide.");
  const row = requireFormRow(ctx, id);
  ctx.db.prepare("UPDATE mk_forms SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  audit(ctx, status === "published" ? "form.published" : "form.unpublished", "form", id, { name: row.name });
  return status === "published" ? `« ${row.name} » est publié : /f/${row.slug} est maintenant accessible.` : `« ${row.name} » n'est plus publié.`;
}

function deleteForm(ctx, id) {
  checkCtx(ctx);
  const row = requireFormRow(ctx, id);
  ctx.db.prepare("DELETE FROM mk_forms WHERE id = ?").run(id);
  audit(ctx, "form.deleted", "form", id, { name: row.name });
  return `« ${row.name} » supprimé.`;
}

// ---------- Côté public (/f/:slug, /f/popup.json), aucune session ni droit ----------

// Le pop-up actif le plus récemment mis à jour (un seul affiché à la fois : plusieurs superposés serait une mauvaise expérience) ; null si aucun
function getActivePopup(db, organizationId) {
  // id en second critère : updated_at (précision à la seconde) peut être identique pour deux mises à jour rapprochées
  const row = db.prepare("SELECT * FROM mk_forms WHERE organization_id = ? AND status = 'published' AND popup_enabled = 1 ORDER BY updated_at DESC, id DESC LIMIT 1").get(organizationId);
  return row ? rowToForm(row) : null;
}

// Tous les pop-ups actifs, du plus récemment modifié au plus ancien : le premier dont les règles sont remplies s'affiche
function getActivePopups(db, organizationId) {
  return db.prepare("SELECT * FROM mk_forms WHERE organization_id = ? AND status = 'published' AND popup_enabled = 1 ORDER BY updated_at DESC, id DESC LIMIT 20").all(organizationId).map(rowToForm);
}

function getPublishedForm(db, organizationId, slug) {
  const row = db.prepare("SELECT * FROM mk_forms WHERE organization_id = ? AND slug = ? AND status = 'published'").get(organizationId, slug);
  return row ? rowToForm(row) : null;
}

// Définitions des propriétés demandées par un formulaire (ordre de la liste des propriétés) ; une propriété supprimée depuis est
// simplement ignorée (le formulaire continue de fonctionner sans elle). name = nom du champ dans le formulaire public.
function propertyFieldDefs(db, organizationId, form) {
  return form.propertyFields
    .map((key) => db.prepare("SELECT key, label, type, options FROM mk_property_defs WHERE organization_id = ? AND key = ?").get(organizationId, key))
    .filter(Boolean)
    .map((d) => ({ key: d.key, name: PROP_PREFIX + d.key, label: d.label, type: d.type, options: JSON.parse(d.options || "[]") }));
}

function recordView(db, formId) {
  db.prepare("UPDATE mk_forms SET view_count = view_count + 1 WHERE id = ?").run(formId);
}

// { ok: true } ou { ok: false, reason } — jamais une exception pour une entrée utilisateur invalide (page publique)
function submitForm(ctx, formId, input = {}) {
  checkCtx(ctx);
  const row = requireFormRow(ctx, formId);
  if (row.status !== "published") return { ok: false, reason: "not_published" };
  const form = rowToForm(row);
  const defs = propertyFieldDefs(ctx.db, ctx.organizationId, form);
  // Logique conditionnelle et champs obligatoires, recalculées ICI (jamais confiance au navigateur) : un champ caché
  // n'est ni exigé ni enregistré
  const values = {};
  for (const key of form.fields) values[key] = input[key];
  for (const d of defs) values[d.name] = input[d.name];
  const rules = fieldRules.applySettings(form, defs, values, (f) => (f.kind === "standard" ? FIELD_CATALOG[f.key] : f.label));
  if (!rules.ok) return { ok: false, reason: "required", message: rules.message };
  const fields = {};
  for (const key of form.fields) if (input[key] !== undefined && !rules.hidden.has(key)) fields[key] = input[key];
  // Fichier joint : type réel lu dans le contenu, taille bornée ; vérifié AVANT de créer quoi que ce soit
  let upload = null;
  if (form.fileField.enabled) {
    const f = input.file;
    const accept = fieldRules.ACCEPT[form.fileField.accept] || fieldRules.ACCEPT.both;
    if (!f || !f.buffer || !f.size) {
      if (form.fileField.required) return { ok: false, reason: "required", message: `« ${form.fileField.label} » est obligatoire.` };
    } else {
      const mime = fieldRules.sniffMime(f.buffer);
      if (f.size > fieldRules.MAX_FILE_BYTES || !mime || !accept.mimes.includes(mime)) return { ok: false, reason: "invalid_file", message: `Fichier refusé : ${accept.label} uniquement, 5 Mo au plus.` };
      upload = { buffer: f.buffer, mime, size: f.size, name: String(f.originalname || "fichier").replace(/[^\p{L}\p{N} ._()-]/gu, "_").slice(0, 120) || "fichier" };
    }
  }
  // Propriétés : vérifiées AVANT de créer quoi que ce soit (une date impossible ne doit laisser ni contact ni
  // consentement à moitié enregistrés). Case à cocher non cochée = rien de dit, donc rien d'enregistré.
  const properties = {};
  for (const def of defs) {
    if (rules.hidden.has(def.name)) continue;
    const raw = input[def.name];
    if (raw === undefined || raw === null || String(raw).trim() === "") continue;
    try {
      validatePropertyValues(ctx, { [def.key]: raw });
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      return { ok: false, reason: "invalid_value", message: error.message.replace(`« ${def.key} »`, `« ${def.label} »`) };
    }
    properties[def.key] = raw;
  }
  // Accord SMS (seconde case, facultative) : numéro vérifié AVANT de créer quoi que ce soit, comme les propriétés
  let sms = null;
  if (form.smsConsentText && input.sms_consent) {
    const raw = String(input.sms_phone || input.phone || "").trim();
    if (!raw) return { ok: false, reason: "invalid_phone", message: "Indiquez votre numéro de mobile pour recevoir les SMS (ou décochez la case SMS)." };
    const r = normalizePhone(raw, { defaultCountry: ctx.settings ? getSmsConfig(ctx).defaultCountry : undefined });
    if (!r.ok) return { ok: false, reason: "invalid_phone", message: `Numéro de mobile invalide : ${r.reason}` };
    sms = { phone: r.e164, text: form.smsConsentText };
  }
  let contact;
  try {
    // Fuseau du navigateur (champ caché rempli par le formulaire) : seulement s'il est valide, jamais bloquant
    const timezone = cleanTimeZone(input.tz);
    ({ contact } = upsertContact(ctx, { email: input.email, ...fields, ...(timezone ? { timezone } : {}), source: "form" }));
  } catch (error) {
    if (error instanceof MarketingError) return { ok: false, reason: error.code, message: error.message };
    throw error;
  }
  if (upload) storeUpload(ctx, form, contact.id, upload);
  // Double confirmation : rien n'est accordé maintenant ; un lien est envoyé (par l'appelant, qui connaît l'adresse du site)
  if (form.doubleOptin && contact.status !== "subscribed") {
    if (BLOCKED.has(contact.status) || ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(ctx.organizationId, contact.email)) {
      return { ok: false, reason: "suppressed" };
    }
    const token = crypto.randomBytes(32).toString("base64url");
    const now = ctx.now ? ctx.now() : Date.now();
    ctx.db.prepare("DELETE FROM mk_pending_confirmations WHERE contact_id = ? AND form_id = ? AND confirmed_at IS NULL").run(contact.id, formId);
    ctx.db
      .prepare("INSERT INTO mk_pending_confirmations (organization_id, form_id, contact_id, token_hash, consent_text, ip, payload, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, formId, contact.id, tokenHash(token), form.consentText, truncateIp(input.ip), JSON.stringify({ properties, ...(sms ? { sms } : {}) }), now + CONFIRM_TTL_MS, now);
    ctx.db.prepare("UPDATE mk_forms SET submit_count = submit_count + 1 WHERE id = ?").run(formId);
    audit(ctx, "form.pending_confirmation", "form", formId, {});
    emitSubmitted(ctx, form, contact, { pending: true, page: input.page });
    return { ok: true, pending: true, token, email: contact.email, contact: getContact(ctx, contact.id) };
  }
  const consent = recordConsent(ctx, contact.id, { source: "form", textShown: form.consentText, ip: input.ip, formId });
  if (!consent.ok) return { ok: false, reason: consent.reason };
  applyFormExtras(ctx, form, contact.id, properties);
  const smsResult = sms ? applySmsConsent(ctx, form, contact.id, sms, input.ip) : null;
  ctx.db.prepare("UPDATE mk_forms SET submit_count = submit_count + 1 WHERE id = ?").run(formId);
  emitSubmitted(ctx, form, contact, { pending: false, page: input.page });
  // `contact` date d'AVANT recordConsent (qui vient de faire passer son statut à « subscribed ») : on renvoie l'état à jour, pas l'instantané périmé
  return { ok: true, contact: getContact(ctx, contact.id), sms: smsResult };
}

// Événement « formulaire envoyé » (déclencheur de scénario, journal du contact) : formulaire, page d'origine, confirmation
// en attente ou non. La page est un chemin du site (jamais une adresse complète venue du navigateur).
function emitSubmitted(ctx, form, contact, { pending, page }) {
  const where = typeof page === "string" && /^\/[^\s<>"'`\\]{0,300}$/.test(page) ? page : `/f/${form.slug}`;
  emit(ctx, "form.submitted", { contact, source: "form", metadata: { formId: String(form.id), formName: form.name, page: where, pending: Boolean(pending) } });
}

// Fichier joint : rangé hors des dossiers publics (uploads/forms/<organisation>/), nom aléatoire, lisible seulement par
// l'équipe (route protégée de la fiche du contact)
function storeUpload(ctx, form, contactId, upload) {
  const { uploadsRoot } = require("../../config/paths");
  const dir = path.join(uploadsRoot, "forms", String(ctx.organizationId));
  fs.mkdirSync(dir, { recursive: true });
  const file = `${crypto.randomBytes(12).toString("hex")}.${fieldRules.EXT[upload.mime]}`;
  fs.writeFileSync(path.join(dir, file), upload.buffer, { flag: "wx" });
  ctx.db.prepare("INSERT INTO mk_form_files (organization_id, form_id, contact_id, path, original_name, mime, size) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, form.id, contactId, `/uploads/forms/${ctx.organizationId}/${file}`, upload.name, upload.mime, upload.size);
}

// Fichiers envoyés par un contact (fiche du contact) et chemin disque d'un fichier (contrôlé : dossier des formulaires)
function contactFiles(ctx, contactId) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT f.id, f.original_name, f.mime, f.size, f.created_at, m.name AS form_name FROM mk_form_files f LEFT JOIN mk_forms m ON m.id = f.form_id WHERE f.organization_id = ? AND f.contact_id = ? ORDER BY f.id DESC").all(ctx.organizationId, contactId);
}
function formFile(ctx, id) {
  checkCtx(ctx);
  const row = ctx.db.prepare("SELECT * FROM mk_form_files WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
  if (!row) return null;
  const { resolveUpload } = require("../../utils/storage");
  const abs = row.path.startsWith(`/uploads/forms/${ctx.organizationId}/`) ? resolveUpload(row.path) : null;
  return abs ? { ...row, abs } : null;
}

// Accord SMS donné dans le formulaire : enregistré avec SA preuve (texte de la case + numéro + IP tronquée + formulaire).
// Jamais bloquant pour l'inscription e-mail : un numéro bloqué (STOP) reste simplement non joignable par SMS.
function applySmsConsent(ctx, form, contactId, sms, ip) {
  try {
    return recordSmsConsent(ctx, contactId, { phone: sms.phone, source: "form", textShown: sms.text, ip, formId: form.id });
  } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    return { ok: false, reason: error.code };
  }
}

// Liste, propriétés et étiquettes du formulaire : appliquées à l'inscription (ou à la confirmation, en double opt-in)
function applyFormExtras(ctx, form, contactId, properties) {
  const contact = { id: contactId };
  if (form.listId) {
    try {
      addToList(ctx, form.listId, [contact.id]);
    } catch (error) {
      // la liste choisie a été supprimée depuis : le formulaire continue de fonctionner, simplement sans y ajouter personne
      console.error(`[KOLAKISA] Formulaire ${form.id} : contact non ajouté à la liste ${form.listId} :`, error.message);
    }
  }
  if (Object.keys(properties).length) setContactProperties(ctx, contact.id, properties, { skipEmpty: true });
  for (const tag of form.tags) tagContact(ctx, contact.id, tag);
}

// ---------- Double confirmation ----------
const CONFIRM_TTL_MS = 7 * 24 * 3600 * 1000;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Lien → { pending, form } si valable (non confirmé, non expiré), sinon null. Sert la page de confirmation (GET).
function findPendingConfirmation(db, token, { now = Date.now() } = {}) {
  if (typeof token !== "string" || !TOKEN.test(token)) return null;
  const pending = db.prepare("SELECT * FROM mk_pending_confirmations WHERE token_hash = ?").get(tokenHash(token));
  if (!pending || pending.confirmed_at !== null || pending.expires_at <= now) return null;
  const row = db.prepare("SELECT * FROM mk_forms WHERE id = ?").get(pending.form_id);
  return row ? { pending, form: rowToForm(row) } : null;
}

// Bouton « Confirmer » : le consentement est enregistré MAINTENANT, avec le texte présenté au départ et la mention de
// la confirmation par e-mail ; puis liste, propriétés et étiquettes. Usage unique.
function confirmSubscription(ctx, token, { now = Date.now() } = {}) {
  checkCtx(ctx);
  const found = findPendingConfirmation(ctx.db, token, { now });
  if (!found || found.pending.organization_id !== ctx.organizationId) return { ok: false, reason: "invalid" };
  const { pending, form } = found;
  const claimed = ctx.db.prepare("UPDATE mk_pending_confirmations SET confirmed_at = ? WHERE id = ? AND confirmed_at IS NULL").run(now, pending.id).changes;
  if (!claimed) return { ok: false, reason: "invalid" };
  const consent = recordConsent(ctx, pending.contact_id, {
    source: "form", textShown: `${pending.consent_text} [Inscription confirmée par e-mail (double opt-in)]`, ip: pending.ip, formId: form.id,
  });
  if (!consent.ok) return { ok: false, reason: consent.reason };
  let payload = {};
  try { payload = JSON.parse(pending.payload) || {}; } catch { payload = {}; }
  applyFormExtras(ctx, form, pending.contact_id, payload.properties || {});
  // Accord SMS donné au moment du formulaire : enregistré à la confirmation, avec le texte présenté à l'époque
  if (payload.sms && payload.sms.phone && payload.sms.text) applySmsConsent(ctx, form, pending.contact_id, payload.sms, pending.ip);
  audit(ctx, "form.confirmed", "form", form.id, {});
  return { ok: true, form };
}

module.exports = {
  FIELD_CATALOG, STATUSES, MAX_TAGS, propertyFieldDefs, POPUP_TRIGGERS, POPUP_TRIGGER_RANGE, POPUP_FREQUENCY_RANGE,
  createForm, listForms, getForm, updateForm, setStatus, deleteForm, getPublishedForm, getActivePopup, getActivePopups, recordView, submitForm, slugify,
  findPendingConfirmation, confirmSubscription, CONFIRM_TTL_MS, contactFiles, formFile,
};
