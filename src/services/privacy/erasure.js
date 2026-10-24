// KOLAKISA CMS → Outils → Effacer les données : MOTEUR CENTRAL (partagé par tous les sites, aucune copie par site).
// Chaque catégorie de données personnelles est un « traitement » déclaré dans ./erasers (un fichier = un traitement ; un module ajoute le sien sans toucher au cœur) :
//   { id, title, description, categories[], order, scope: "main" | "any", preview(env, sujet, options), run(env, sujet, état, { limit, options }) }
//   run() travaille par LOTS et renvoie { done, cursor?, erased, anonymized, after?: [fonctions exécutées après validation], outcome?: { retained[], manual[] } }
// Le moteur persiste chaque lot avec la ligne de tâche dans UNE transaction : une interruption laisse un état cohérent et la reprise relit ce qui reste (idempotence).
// Le moteur ne supprime JAMAIS un compte et ne touche que les données du SITE de la demande (env.siteId) ; une demande ne se traite jamais deux fois en même temps (verrou).
const fs = require("node:fs");
const path = require("node:path");

const registry = [];
function register(mod) {
  if (!mod || typeof mod.id !== "string" || !mod.title || typeof mod.run !== "function" || typeof mod.preview !== "function") throw new Error("Traitement d'effacement invalide (id, title, preview et run obligatoires).");
  if (registry.some((m) => m.id === mod.id)) throw new Error(`Traitement d'effacement déjà déclaré : ${mod.id}`);
  registry.push({ order: 100, scope: "any", description: "", categories: [], ...mod });
  registry.sort((a, b) => a.order - b.order);
}
const dir = path.join(__dirname, "erasers");
for (const file of fs.readdirSync(dir).filter((f) => /^\d.*\.js$/.test(f)).sort()) register(require(path.join(dir, file)));

// Ce que Kolakisa ne peut PAS effacer lui-même : toujours affiché, jamais présenté comme effacé
const EXTERNAL = Object.freeze([
  { label: "Sauvegardes et archives", reason: "Les copies de la base de données gardées par le site et par l'hébergeur contiennent encore les données jusqu'à leur renouvellement." },
  { label: "Fournisseur d'envoi d'e-mails et journaux du serveur", reason: "Les historiques d'envoi chez le prestataire SMTP et les journaux d'accès de l'hébergeur ne sont pas pilotés par Kolakisa." },
  { label: "Outils d'analyse et services tiers", reason: "Mesure d'audience, paiement, vidéo, réseaux sociaux : à traiter chez chaque prestataire, avec ses propres outils." },
]);

const BATCH = () => Math.max(1, Math.min(1000, Number(process.env.KOLA_ERASURE_BATCH) || 200));
const LOCK_SECONDS = 60;
const sql = (d) => new Date(d).toISOString().slice(0, 19).replace("T", " ");
const parse = (t, fallback) => { try { return JSON.parse(t); } catch { return fallback; } };
// Échec simulé pour les tests (jamais en production) : KOLA_ERASURE_FAIL="<id>:<nombre d'essais qui échouent>"
function injectedFailure(id, attempts) {
  if (process.env.NODE_ENV === "production" || !process.env.KOLA_ERASURE_FAIL) return false;
  const [target, n] = process.env.KOLA_ERASURE_FAIL.split(":");
  return target === id && attempts < (Number(n) || 1);
}

const envOf = (db, ctx, request) => ({ db, ctx, organizationId: request.organization_id, siteId: request.site_id ?? null });
const subjectOf = (request) => ({ email: request.subject_email ? String(request.subject_email).toLowerCase() : "", userId: request.subject_user_id ?? null });
const optionsOf = (request) => parse(request.options, {});
const applicable = (request) => registry.filter((m) => m.scope === "any" || (m.scope === "main" && (request.site_id ?? null) === null));

// Récapitulatif AVANT toute opération : comptages réels, aucune écriture
function preview(db, ctx, request) {
  const env = envOf(db, ctx, request), subject = subjectOf(request), options = optionsOf(request);
  const items = applicable(request).map((m) => {
    let r;
    try { r = m.preview(env, subject, options); } catch { r = { erase: 0, anonymize: 0, retained: [], manual: [], error: true }; }
    return { id: m.id, title: m.title, description: m.description, categories: m.categories, erase: r.erase || 0, anonymize: r.anonymize || 0, retained: r.retained || [], manual: r.manual || [], error: Boolean(r.error) };
  });
  const outOfScope = registry.filter((m) => !applicable(request).includes(m)).map((m) => ({ id: m.id, title: m.title, reason: "Données de la plateforme (comptes, formulaire de contact) : elles se traitent depuis le site principal." }));
  return { items, outOfScope, external: EXTERNAL, total: items.reduce((n, i) => n + i.erase + i.anonymize, 0) };
}

function ensureTasks(db, request) {
  const ins = db.prepare("INSERT OR IGNORE INTO mk_erasure_tasks (request_id, eraser_id) VALUES (?, ?)");
  for (const m of applicable(request)) ins.run(request.id, m.id);
}
const tasksOf = (db, id) => db.prepare("SELECT * FROM mk_erasure_tasks WHERE request_id = ?").all(id).sort((a, b) => registry.findIndex((m) => m.id === a.eraser_id) - registry.findIndex((m) => m.id === b.eraser_id));

// Progression RÉELLE : seulement des lots et des tâches effectivement enregistrés
function progress(db, request) {
  const tasks = tasksOf(db, request.id);
  const done = tasks.filter((t) => t.status === "done").length;
  return {
    total: tasks.length, done, failed: tasks.filter((t) => t.status === "failed").length,
    percent: request.status === "completed" ? 100 : tasks.length ? Math.round((100 * done) / tasks.length) : 0,
    erased: tasks.reduce((n, t) => n + t.erased, 0), anonymized: tasks.reduce((n, t) => n + t.anonymized, 0),
    tasks: tasks.map((t) => ({ id: t.eraser_id, title: (registry.find((m) => m.id === t.eraser_id) || {}).title || t.eraser_id, status: t.status, erased: t.erased, anonymized: t.anonymized, batches: t.batches, error: t.error, outcome: parse(t.outcome, {}) })),
  };
}

const lock = (db, id) => Number(db.prepare("UPDATE mk_erasure_requests SET lock_until = ? WHERE id = ? AND (lock_until IS NULL OR lock_until < ?)").run(sql(Date.now() + LOCK_SECONDS * 1000), id, sql(Date.now())).changes) === 1;
const unlock = (db, id) => db.prepare("UPDATE mk_erasure_requests SET lock_until = NULL WHERE id = ?").run(id);

// Fait avancer le traitement pendant `budgetMs` au plus. → { busy } si un autre traitement tient le verrou ; sinon { finished, status, progress }
function step(db, ctx, requestId, { budgetMs = 1500, onFinish } = {}) {
  let request = db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(requestId);
  if (!request || request.status !== "confirmed") return { notRunnable: true, status: request && request.status };
  if (!lock(db, request.id)) return { busy: true, progress: progress(db, request) };
  const t0 = Date.now();
  try {
    if (!request.started_at) db.prepare("UPDATE mk_erasure_requests SET started_at = datetime('now') WHERE id = ?").run(request.id);
    ensureTasks(db, request);
    const env = envOf(db, ctx, request), subject = subjectOf(request), options = optionsOf(request), limit = BATCH();
    for (;;) {
      const task = tasksOf(db, request.id).find((t) => t.status === "pending" || t.status === "running");
      if (!task) break;
      const mod = registry.find((m) => m.id === task.eraser_id);
      let after = [];
      db.exec("BEGIN IMMEDIATE");
      try {
        if (!mod) throw new Error("Traitement introuvable.");
        if (injectedFailure(task.eraser_id, task.attempts)) throw new Error("Échec simulé (test).");
        const r = mod.run(env, subject, { cursor: task.cursor }, { limit, options });
        after = r.after || [];
        const outcome = r.outcome ? { ...parse(task.outcome, {}), ...r.outcome } : parse(task.outcome, {});
        db.prepare("UPDATE mk_erasure_tasks SET status = ?, erased = erased + ?, anonymized = anonymized + ?, batches = batches + 1, cursor = ?, outcome = ?, error = '', updated_at = datetime('now') WHERE id = ?")
          .run(r.done ? "done" : "running", r.erased || 0, r.anonymized || 0, r.cursor ?? task.cursor, JSON.stringify(outcome), task.id);
        db.exec("COMMIT");
      } catch (error) {
        try { db.exec("ROLLBACK"); } catch { /* déjà annulé */ }
        // Message court, sans donnée personnelle (jamais l'adresse du sujet)
        const note = String(error && error.message || "erreur").replace(/[\w.+-]+@[\w.-]+/g, "[adresse]").slice(0, 200);
        db.prepare("UPDATE mk_erasure_tasks SET status = 'failed', attempts = attempts + 1, error = ?, updated_at = datetime('now') WHERE id = ?").run(note, task.id);
      }
      for (const fn of after) { try { fn(); } catch { /* fichier déjà absent : sans conséquence */ } }
      if (Date.now() - t0 > budgetMs) break;
    }
    const tasks = tasksOf(db, request.id);
    const open = tasks.some((t) => t.status === "pending" || t.status === "running");
    if (open) return { finished: false, status: "confirmed", progress: progress(db, request) };
    const failed = tasks.filter((t) => t.status === "failed");
    request = db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(request.id);
    if (failed.length) {
      db.prepare("UPDATE mk_erasure_requests SET status = 'failed', failure_code = 'erase_failed', failure_note = ? WHERE id = ? AND status = 'confirmed'")
        .run(`${failed.length} catégorie(s) en échec : ${failed.map((t) => (registry.find((m) => m.id === t.eraser_id) || {}).title || t.eraser_id).join(", ")}. Les autres sont traitées ; reprenez pour réessayer seulement celles-ci.`, request.id);
      if (onFinish) onFinish("failed", db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(request.id));
      return { finished: true, status: "failed", progress: progress(db, request) };
    }
    const p = progress(db, request);
    const summary = {
      erased: p.erased, anonymized: p.anonymized, completedAt: new Date().toISOString(),
      categories: p.tasks.map((t) => ({ id: t.id, title: t.title, erased: t.erased, anonymized: t.anonymized })),
      retained: p.tasks.flatMap((t) => (t.outcome.retained || []).map((r) => ({ ...r, from: t.title }))),
      manual: [...p.tasks.flatMap((t) => (t.outcome.manual || []).map((r) => ({ ...r, from: t.title }))), ...EXTERNAL.map((e) => ({ ...e, from: "Hors périmètre" }))],
      notProcessed: registry.filter((m) => !applicable(request).includes(m)).map((m) => m.title),
    };
    db.prepare("UPDATE mk_erasure_requests SET status = 'completed', completed_at = datetime('now'), failure_code = NULL, failure_note = '', summary = ? WHERE id = ? AND status = 'confirmed'").run(JSON.stringify(summary), request.id);
    if (onFinish) onFinish("completed", db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(request.id));
    // Minimisation : l'adresse de la personne ne reste pas dans la demande terminée (empreinte et forme masquée seulement)
    db.prepare("UPDATE mk_erasure_requests SET subject_email = NULL, token_hash = NULL WHERE id = ?").run(request.id);
    return { finished: true, status: "completed", progress: progress(db, request) };
  } finally {
    unlock(db, request.id);
  }
}

// Reprise des catégories en échec : seules celles-ci repartent ; les terminées ne sont jamais refaites
function resumeFailed(db, requestId) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const r = db.prepare("SELECT * FROM mk_erasure_requests WHERE id = ?").get(requestId);
    if (!r || r.status !== "failed" || r.failure_code !== "erase_failed") { db.exec("ROLLBACK"); return false; }
    db.prepare("UPDATE mk_erasure_tasks SET status = 'pending' WHERE request_id = ? AND status = 'failed'").run(requestId);
    db.prepare("UPDATE mk_erasure_requests SET status = 'confirmed', failure_code = NULL, failure_note = '' WHERE id = ?").run(requestId);
    db.exec("COMMIT");
    return true;
  } catch (error) { try { db.exec("ROLLBACK"); } catch { /* */ } throw error; }
}

module.exports = { register, registry, EXTERNAL, preview, step, progress, resumeFailed, tasksOf, applicable, LOCK_SECONDS };
