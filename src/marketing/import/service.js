// Import de contacts (CSV). Trois temps : APERÇU (rien n'est écrit) → ANALYSE à blanc (tout est classé et expliqué)
// → EXÉCUTION par tranches transactionnelles reprenables. Règles de conformité (testées) :
//  - le statut n'est jamais importable ; par défaut les contacts importés restent « unknown » (aucun consentement inventé) ;
//  - un consentement « déclaré » exige une case cochée ET un texte de preuve ; il ne réabonne jamais un désinscrit
//    ni une adresse en liste de suppression (celles-ci sont ignorées) ;
//  - un import ne déclenche pas un événement par contact (pas de tempête d'automatisations) : un seul « contacts.imported ».
const path = require("node:path");
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { validateEmail, normalizeEmail } = require("../audience/email");
const { upsertContact, updateContact, findByEmail, getContact } = require("../audience/contacts");
const { setContactProperties, validatePropertyValues, listProperties } = require("../audience/properties");
const { requireList, addToList } = require("../audience/lists");
const { tagContact } = require("../audience/tags");
const { recordConsent } = require("../compliance/consent");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("../audience/shared");
const { parseCsv, decodeCsv, toCsv, DEFAULT_LIMITS } = require("./csv");

const MAX_BYTES = 10 * 1024 * 1024;
const SAMPLE_ROWS = 10;
const EXAMPLES = 20;
const MAX_REJECTS = 1000;
const MAX_TAGS_PER_ROW = 20;
const TEXT_TARGETS = ["first_name", "last_name", "phone", "company", "country", "language"];
const MODES = ["fill", "skip", "overwrite"];

const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const SYNONYMS = {
  email: ["email", "e mail", "mail", "courriel", "adresse email", "adresse e mail", "adresse mail", "email address"],
  first_name: ["prenom", "first name", "firstname", "given name"],
  last_name: ["nom", "last name", "lastname", "surname", "family name", "nom de famille"],
  phone: ["telephone", "tel", "phone", "mobile", "portable", "gsm"],
  company: ["societe", "entreprise", "company", "organisation", "organization"],
  country: ["pays", "country"],
  language: ["langue", "language", "lang"],
  tags: ["tags", "tag", "etiquettes", "etiquette"],
};

// --- parsing mis en cache (un import en cours est relu à chaque tranche) ---
// Indexé par CONNEXION puis par « organisation:import » : deux bases (ou un import recréé) ne peuvent jamais se croiser.
const caches = new WeakMap();
const cacheOf = (ctx) => {
  if (!caches.has(ctx.db)) caches.set(ctx.db, new Map());
  return caches.get(ctx.db);
};
function parsedOf(ctx, imp) {
  const cache = cacheOf(ctx);
  const key = `${ctx.organizationId}:${imp.id}:${imp.mapping}`;
  if (cache.has(key)) return cache.get(key);
  const parsed = parseCsv(imp.source_text, { delimiter: imp.delimiter, maxRows: 1e7, maxColumns: 1000 });
  const column = emailColumn(imp);
  parsed.emails = parsed.rows.map((cells, i) => (i === 0 ? "" : normalizeEmail(cells[column] ?? "")));
  parsed.firstIndex = new Map();
  parsed.emails.forEach((email, i) => { if (i > 0 && email && !parsed.firstIndex.has(email)) parsed.firstIndex.set(email, i); });
  if (cache.size >= 3) cache.delete(cache.keys().next().value);
  cache.set(key, parsed);
  return parsed;
}
const forget = (ctx, id) => {
  for (const key of cacheOf(ctx).keys()) if (key.startsWith(`${ctx.organizationId}:${id}:`)) cacheOf(ctx).delete(key);
};
const emailColumn = (imp) => JSON.parse(imp.mapping).indexOf("email");

const table = (ctx) => createRepository(ctx.db, ctx.organizationId).table("mk_imports");
const strip = ({ source_text: _omit, ...rest }) => ({ ...rest, headers: JSON.parse(rest.headers), mapping: JSON.parse(rest.mapping), options: JSON.parse(rest.options) });

function getImport(ctx, id) {
  checkCtx(ctx);
  const row = table(ctx).get(id);
  return row ? strip(row) : null;
}
const listImports = (ctx) => (checkCtx(ctx), table(ctx).list({ limit: 200, orderBy: { column: "id", direction: "desc" } }).rows.map(strip));

function requireImport(ctx, id) {
  checkCtx(ctx);
  const row = table(ctx).get(id);
  if (!row) throw new MarketingError("not_found", "Import introuvable.");
  return row;
}

// Données d'affichage d'un import à configurer : colonnes, quelques lignes d'exemple, correspondance suggérée
function describeImport(ctx, id, { sampleRows = 5 } = {}) {
  const imp = requireImport(ctx, id);
  if (imp.status !== "previewed" || !imp.source_text) return null;
  const parsed = parseCsv(imp.source_text, { delimiter: imp.delimiter, maxRows: 1e7, maxColumns: 1000 });
  const headers = JSON.parse(imp.headers);
  return { headers, sample: parsed.rows.slice(1, 1 + sampleRows), suggestedMapping: suggestMapping(headers, listProperties(ctx)), properties: listProperties(ctx) };
}

function suggestMapping(headers, properties) {
  const used = new Set();
  return headers.map((header) => {
    const h = norm(header);
    let target = Object.keys(SYNONYMS).find((t) => SYNONYMS[t].includes(h));
    if (!target) {
      const prop = properties.find((p) => norm(p.key) === h || norm(p.label) === h);
      if (prop) target = `property:${prop.key}`;
    }
    if (!target || used.has(target)) return "ignore";
    used.add(target);
    return target;
  });
}

function previewImport(ctx, { filename = "import.csv", data, limits = {} } = {}) {
  checkCtx(ctx);
  if (typeof data !== "string" && !(data instanceof Uint8Array)) throw new MarketingError("invalid_csv", "Le fichier est illisible.");
  const maxBytes = limits.maxBytes ?? MAX_BYTES;
  if ((typeof data === "string" ? Buffer.byteLength(data) : data.length) > maxBytes) throw new MarketingError("csv_too_large", `Fichier trop volumineux (${Math.round(maxBytes / 1048576)} Mo au plus).`);
  const text = decodeCsv(data);
  const parsed = parseCsv(text, { maxRows: limits.maxRows ?? DEFAULT_LIMITS.maxRows, maxColumns: limits.maxColumns ?? DEFAULT_LIMITS.maxColumns });
  if (parsed.rows.length < 2) throw new MarketingError("invalid_csv", "Le fichier doit contenir une ligne d'en-têtes puis au moins une ligne de données.");
  const headers = parsed.rows[0].map((h) => h.trim().slice(0, 100));
  const suggestedMapping = suggestMapping(headers, listProperties(ctx));
  const safeName = path.basename(String(filename).replace(/\\/g, "/")).replace(/[\x00-\x1f\x7f]/g, "").slice(0, 120) || "import.csv";
  const row = table(ctx).insert({
    user_id: ctx.userId ?? null, filename: safeName, delimiter: parsed.delimiter, headers: JSON.stringify(headers),
    total_rows: parsed.rows.length - 1, source_text: text,
  });
  return { id: row.id, filename: safeName, delimiter: parsed.delimiter, headers, sample: parsed.rows.slice(1, 1 + SAMPLE_ROWS), totalRows: row.total_rows, suggestedMapping };
}

function validateMapping(ctx, mapping, columns) {
  const bad = (msg) => new MarketingError("invalid_mapping", msg);
  if (!Array.isArray(mapping) || mapping.length !== columns) throw bad(`La correspondance doit être une liste avec une cible par colonne (le fichier a ${columns} colonne${columns > 1 ? "s" : ""}).`);
  const known = new Set(listProperties(ctx).map((p) => p.key));
  const seen = new Set();
  for (const target of mapping) {
    if (typeof target !== "string") throw bad("Cible de colonne invalide.");
    if (target === "ignore") continue;
    if (target === "status") throw bad("Le statut ne peut pas être importé : il dépend du consentement, qui se prouve (voir « consentement déclaré »).");
    if (target.startsWith("property:")) {
      if (!known.has(target.slice(9))) throw bad(`Propriété « ${target.slice(9, 49)} » inconnue : créez-la d'abord.`);
    } else if (target !== "email" && target !== "tags" && !TEXT_TARGETS.includes(target)) throw bad(`Cible inconnue « ${target.slice(0, 40)} ».`);
    if (seen.has(target)) throw bad(`La cible « ${target} » ne peut être utilisée qu'une seule fois.`);
    seen.add(target);
  }
  if (!seen.has("email")) throw bad("Une colonne doit être associée à l'e-mail.");
  return mapping;
}

function normalizeOptions(ctx, options = {}) {
  const out = { updateExisting: options.updateExisting ?? "fill", listId: null, tag: "", consent: null };
  if (!MODES.includes(out.updateExisting)) throw new MarketingError("invalid_field", "Mode de mise à jour inconnu (fill, skip, overwrite).");
  if (options.listId !== undefined && options.listId !== null) {
    requireList(ctx, options.listId);
    out.listId = options.listId;
  }
  if (options.tag) out.tag = cleanText(options.tag, { max: 64, field: "tag" });
  if (options.consent?.declared) {
    const text = cleanText(options.consent.text, { max: 1000, field: "consent.text" });
    if (options.consent.confirm !== true || text.length < 10) {
      throw new MarketingError("consent_required", "Pour abonner les contacts importés, cochez la déclaration et décrivez la preuve du consentement (au moins 10 caractères : où, quand, comment il a été recueilli).");
    }
    out.consent = { text };
  }
  return out;
}

const splitTags = (raw) => [...new Set(String(raw ?? "").split(/[,;|]/).map((t) => t.trim()).filter(Boolean))];

function newCounters() {
  return { created: 0, updated: 0, unchanged: 0, invalid: 0, duplicatesInFile: 0, suppressed: 0, subscribed: 0, blockedUnsubscribed: 0 };
}

// Classe (et, hors « dryRun », écrit) les lignes de données [from, to[ ; renvoie compteurs, rejets et exemples
function processRows(ctx, imp, parsed, from, to, { mapping, options, dryRun }) {
  const counters = newCounters();
  const rejects = [];
  const examples = { invalid: [], duplicatesInFile: [], suppressed: [], blockedUnsubscribed: [] };
  const rowCtx = { ...ctx, audit: false, bus: null };
  const headerCount = parsed.rows[0].length;
  const col = (target) => mapping.indexOf(target);
  const reject = (kind, line, email, reason, extra = {}) => {
    counters[kind]++;
    if (rejects.length < MAX_REJECTS) rejects.push({ line, email, reason, raw: JSON.stringify(parsed.rows[current] ?? []) });
    if (examples[kind] && examples[kind].length < EXAMPLES) examples[kind].push({ line, email, ...(kind === "invalid" ? { reason } : extra) });
  };
  let current = 0; // indice de la ligne en cours (pour conserver ses cellules brutes dans un rejet)
  let willCreate = 0;
  let willUpdate = 0;
  let willSubscribe = 0;

  for (let i = from; i < to; i++) {
    const idx = i + 1;
    current = idx;
    const cells = parsed.rows[idx];
    const line = parsed.lines[idx];
    const rawEmail = cells[col("email")] ?? "";
    if (cells.length > headerCount && cells.slice(headerCount).some((c) => c.trim() !== "")) { reject("invalid", line, normalizeEmail(rawEmail), "Trop de cellules dans la ligne (plus que d'en-têtes)."); continue; }
    const check = validateEmail(rawEmail);
    if (!check.ok) { reject("invalid", line, normalizeEmail(rawEmail), check.reason); continue; }
    const first = parsed.firstIndex.get(check.email);
    if (first !== idx) {
      const firstLine = parsed.lines[first];
      reject("duplicatesInFile", line, check.email, `Doublon dans le fichier : déjà présent à la ligne ${firstLine}.`, { firstLine });
      continue;
    }
    if (ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(ctx.organizationId, check.email)) {
      reject("suppressed", line, check.email, "Adresse en liste de suppression : ignorée.");
      continue;
    }
    const fields = {};
    for (const target of TEXT_TARGETS) if (col(target) >= 0) fields[target] = cells[col(target)] ?? "";
    const properties = {};
    mapping.forEach((target, c) => { if (target.startsWith("property:")) properties[target.slice(9)] = cells[c] ?? ""; });
    const tags = splitTags(col("tags") >= 0 ? cells[col("tags")] : "");
    if (options.tag) tags.push(options.tag);
    let rowError = null;
    try {
      validatePropertyValues(ctx, properties);
      if (tags.length > MAX_TAGS_PER_ROW) rowError = `Trop d'étiquettes sur la ligne (${MAX_TAGS_PER_ROW} au plus).`;
      else if (tags.some((t) => t.length > 64)) rowError = "Étiquette trop longue (64 caractères au plus).";
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      rowError = error.message;
    }
    if (rowError) { reject("invalid", line, check.email, rowError); continue; }

    const existing = findByEmail(ctx, check.email);
    const cleanFields = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, cleanText(v, { max: 200, field: k })]));
    const filled = Object.entries(cleanFields).some(([k, v]) => v !== "" && (existing ? existing[k] === "" : true));
    const differs = existing && Object.entries(cleanFields).some(([k, v]) => v !== "" && existing[k] !== v.slice(0, { first_name: 100, last_name: 100, phone: 40, country: 100, language: 20 }[k] ?? 200));
    const hasProps = Object.values(properties).some((v) => String(v).trim() !== "");
    const outcome = !existing ? "create" : options.updateExisting === "skip" ? "unchanged" : options.updateExisting === "overwrite" ? (differs || hasProps ? "update" : "unchanged") : filled || hasProps ? "update" : "unchanged";
    const statusNow = existing?.status ?? "unknown";
    const wantsConsent = Boolean(options.consent) && (statusNow === "unknown" || statusNow === "unsubscribed");

    if (dryRun) {
      if (outcome === "create") willCreate++;
      else if (outcome === "update") willUpdate++;
      else counters.unchanged++;
      if (wantsConsent) {
        if (statusNow === "unsubscribed") { counters.blockedUnsubscribed++; if (examples.blockedUnsubscribed.length < EXAMPLES) examples.blockedUnsubscribed.push({ line, email: check.email }); }
        else willSubscribe++;
      }
      continue;
    }

    try {
      transaction(ctx.db, () => {
        let contactId;
        if (outcome === "create") {
          contactId = upsertContact(rowCtx, { email: check.email, ...cleanFields, source: "import", properties }, { failIfExists: true }).contact.id;
        } else {
          contactId = existing.id;
          if (outcome === "update") {
            if (options.updateExisting === "overwrite") {
              const patch = Object.fromEntries(Object.entries(cleanFields).filter(([, v]) => v !== ""));
              updateContact(rowCtx, contactId, { ...patch, properties: hasProps ? properties : undefined });
            } else upsertContact(rowCtx, { email: check.email, ...cleanFields, properties }, {});
          }
        }
        for (const tag of tags) tagContact(rowCtx, contactId, tag);
        if (options.listId) addToList(rowCtx, options.listId, [contactId]);
        if (wantsConsent) {
          const result = recordConsent(rowCtx, contactId, { source: "import", textShown: options.consent.text });
          if (result.ok && !result.already) counters.subscribed++;
          else if (!result.ok && result.reason === "unsubscribed") {
            counters.blockedUnsubscribed++;
            if (examples.blockedUnsubscribed.length < EXAMPLES) examples.blockedUnsubscribed.push({ line, email: check.email });
          }
        }
      });
      if (outcome === "create") counters.created++;
      else if (outcome === "update") counters.updated++;
      else counters.unchanged++;
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      reject("invalid", line, check.email, error.message);
    }
  }
  return { counters, rejects, examples, willCreate, willUpdate, willSubscribe };
}

// Analyse à blanc : ne modifie RIEN (ni contacts, ni rejets, ni compteurs)
function analyzeImport(ctx, id, { mapping, options } = {}) {
  const imp = requireImport(ctx, id);
  if (imp.status === "done") throw new MarketingError("already_done", "Cet import est terminé.");
  const headers = JSON.parse(imp.headers);
  const valid = validateMapping(ctx, mapping, headers.length);
  const opts = normalizeOptions(ctx, options);
  const parsed = parsedOf(ctx, { ...imp, mapping: JSON.stringify(valid) });
  const r = processRows(ctx, imp, parsed, 0, imp.total_rows, { mapping: valid, options: opts, dryRun: true });
  const c = r.counters;
  return {
    total: imp.total_rows, willCreate: r.willCreate, willUpdate: r.willUpdate, unchanged: c.unchanged, invalid: c.invalid,
    duplicatesInFile: c.duplicatesInFile, suppressed: c.suppressed, willSubscribe: r.willSubscribe, blockedUnsubscribed: c.blockedUnsubscribed,
    examples: r.examples,
  };
}

function startImport(ctx, id, { mapping, options } = {}) {
  const imp = requireImport(ctx, id);
  if (imp.status === "done") throw new MarketingError("already_done", "Cet import est déjà terminé : il ne peut pas être relancé.");
  if (imp.status !== "previewed") throw new MarketingError("invalid_state", "Cet import a déjà démarré.");
  const valid = validateMapping(ctx, mapping, JSON.parse(imp.headers).length);
  const opts = normalizeOptions(ctx, options);
  forget(ctx, id);
  table(ctx).update(id, { mapping: JSON.stringify(valid), options: JSON.stringify(opts), status: "running", started_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
  audit(ctx, "import.started", "import", id, { total: imp.total_rows, updateExisting: opts.updateExisting, consentDeclared: Boolean(opts.consent), list: opts.listId, tag: Boolean(opts.tag) });
  return getImport(ctx, id);
}

function resumeImport(ctx, id) {
  const imp = requireImport(ctx, id);
  if (imp.status !== "failed") throw new MarketingError("invalid_state", "Seul un import en échec peut être repris.");
  forget(ctx, id);
  table(ctx).update(id, { status: "running", error: "" });
  return getImport(ctx, id);
}

const reportOf = (imp) => ({
  total: imp.total_rows, created: imp.created_count, updated: imp.updated_count, unchanged: imp.unchanged_count, invalid: imp.invalid_count,
  duplicatesInFile: imp.duplicate_count, suppressed: imp.suppressed_count, subscribed: imp.subscribed_count, blockedUnsubscribed: imp.blocked_unsubscribed_count,
});

// Traite au plus maxRows lignes dans UNE transaction : une erreur inattendue annule toute la tranche (aucune écriture partielle)
function runImportSlice(ctx, id, { maxRows = 1000 } = {}) {
  const imp = requireImport(ctx, id);
  if (imp.status === "done") return { done: true, processed: imp.processed_rows, report: reportOf(imp) };
  if (imp.status !== "running") throw new MarketingError("invalid_state", "Cet import n'est pas démarré (ou est en échec : reprenez-le).");
  const mapping = JSON.parse(imp.mapping);
  const options = JSON.parse(imp.options);
  const parsed = parsedOf(ctx, imp);
  const from = imp.processed_rows;
  const to = Math.min(from + maxRows, imp.total_rows);
  try {
    return transaction(ctx.db, () => {
      const r = processRows(ctx, imp, parsed, from, to, { mapping, options, dryRun: false });
      const c = r.counters;
      const rejectsSoFar = ctx.db.prepare("SELECT COUNT(*) n FROM mk_import_rejects WHERE import_id = ?").get(id).n;
      const insert = ctx.db.prepare("INSERT INTO mk_import_rejects (organization_id, import_id, line, email, reason, raw) VALUES (?, ?, ?, ?, ?, ?)");
      for (const rej of r.rejects.slice(0, Math.max(MAX_REJECTS - rejectsSoFar, 0))) insert.run(ctx.organizationId, id, rej.line, rej.email, rej.reason, rej.raw);
      const done = to >= imp.total_rows;
      ctx.db
        .prepare(
          `UPDATE mk_imports SET processed_rows = ?, created_count = created_count + ?, updated_count = updated_count + ?, unchanged_count = unchanged_count + ?,
             invalid_count = invalid_count + ?, duplicate_count = duplicate_count + ?, suppressed_count = suppressed_count + ?, subscribed_count = subscribed_count + ?,
             blocked_unsubscribed_count = blocked_unsubscribed_count + ? WHERE id = ? AND organization_id = ?`
        )
        .run(to, c.created, c.updated, c.unchanged, c.invalid, c.duplicatesInFile, c.suppressed, c.subscribed, c.blockedUnsubscribed, id, ctx.organizationId);
      if (done) {
        ctx.db.prepare("UPDATE mk_imports SET status = 'done', finished_at = datetime('now'), source_text = '' WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
        const final = reportOf(requireImport(ctx, id));
        if (ctx.bus) ctx.bus.emit({ organizationId: ctx.organizationId, name: "contacts.imported", source: "marketing", idempotencyKey: `contacts.imported:${id}`, metadata: { importId: id, ...final } });
        audit(ctx, "import.completed", "import", id, final);
        forget(ctx, id);
        return { done: true, processed: to, report: final };
      }
      return { done: false, processed: to };
    });
  } catch (error) {
    table(ctx).update(id, { status: "failed", error: String(error.message).slice(0, 500) });
    forget(ctx, id);
    throw error;
  }
}

// Import complet en une fois (petits fichiers, tests) ; les gros fichiers passent par la file (jobHandlers)
function runImport(ctx, id, { mapping, options, sliceSize = 1000 } = {}) {
  startImport(ctx, id, { mapping, options });
  let result;
  do result = runImportSlice(ctx, id, { maxRows: sliceSize });
  while (!result.done);
  return result.report;
}

function rejectsCsv(ctx, id) {
  const imp = requireImport(ctx, id);
  const headers = JSON.parse(imp.headers);
  const rows = ctx.db.prepare("SELECT line, email, reason, raw FROM mk_import_rejects WHERE import_id = ? AND organization_id = ? ORDER BY line").all(id, ctx.organizationId);
  return toCsv([["ligne", "e-mail", "raison", ...headers], ...rows.map((r) => [r.line, r.email, r.reason, ...JSON.parse(r.raw)])]);
}

// Tâche de la file : traite l'import par tranches, en rendant la main entre deux ; au-delà de 20 s, se relance elle-même
function jobHandlers({ db, bus = null, budgetMs = 20000 }) {
  const { enqueue } = require("../queue/jobs");
  return {
    "import.run": async ({ organizationId, importId, userId = null }) => {
      const ctx = { db, organizationId, userId, bus };
      const started = Date.now();
      for (;;) {
        const result = runImportSlice(ctx, importId, { maxRows: 500 });
        if (result.done) return;
        if (Date.now() - started > budgetMs) {
          enqueue(db, { organizationId, type: "import.run", payload: { organizationId, importId, userId }, idempotencyKey: `import:${importId}:${Date.now()}` });
          return;
        }
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
  };
}

module.exports = { describeImport, previewImport, analyzeImport, startImport, resumeImport, runImportSlice, runImport, getImport, listImports, rejectsCsv, jobHandlers, suggestMapping };
