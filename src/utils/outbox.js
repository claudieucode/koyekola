// File d'envoi des e-mails du site. Règles (chacune testée) :
//  - queueMail() enregistre l'e-mail et rend la main tout de suite : la page qui l'a demandé n'attend jamais le serveur SMTP ;
//  - l'envoi part juste après, en arrière-plan ; un échec est noté (sans donnée sensible) et réessayé 5 fois au plus,
//    avec une attente croissante (1, 2, 4, 8 min) ; processOutbox() est aussi relancé chaque minute par server.js ;
//  - sans SMTP configuré, l'e-mail est marqué « non envoyé (SMTP absent) » : en local, son contenu est affiché dans le
//    journal pour pouvoir développer ; en production, jamais (il peut contenir un lien de réinitialisation) ;
//  - le texte d'un e-mail « sensible » (lien de réinitialisation, de confirmation) est effacé dès qu'il est parti.
const MAX_ATTEMPTS = 5;
const STUCK_MS = 10 * 60 * 1000;
const MAX_TEXT = 20000;
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const ensured = new WeakSet();

function ensureTable(db) {
  if (ensured.has(db)) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS mail_outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      to_email TEXT NOT NULL,
      reply_to TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      sensitive INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'skipped')),
      attempts INTEGER NOT NULL DEFAULT 0,
      next_attempt_at INTEGER NOT NULL DEFAULT 0,
      last_error TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      sent_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_mail_outbox_due ON mail_outbox(status, next_attempt_at);
  `);
  ensured.add(db);
}

const oneLine = (v) => String(v ?? "").replace(/[\r\n\u2028\u2029]+/g, " ").trim();

// → { queued: true, id } ou { queued: false, reason }. N'attend PAS l'envoi.
function queueMail(db, { kind, to, subject, text, replyTo = "", sensitive = false }, { now = Date.now(), autoSend = true } = {}) {
  ensureTable(db);
  const address = oneLine(to);
  if (!EMAIL.test(address)) return { queued: false, reason: "invalid_recipient" };
  const info = db
    .prepare("INSERT INTO mail_outbox (kind, to_email, reply_to, subject, body, sensitive, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(String(kind).slice(0, 40), address, EMAIL.test(oneLine(replyTo)) ? oneLine(replyTo) : "", oneLine(subject).slice(0, 300), String(text ?? "").slice(0, MAX_TEXT), sensitive ? 1 : 0, now, now);
  const id = Number(info.lastInsertRowid);
  if (autoSend) setImmediate(() => processOutbox(db).catch((error) => console.error("[KOLAKISA] File d'envoi :", error.message)));
  return { queued: true, id };
}

// Erreur SMTP → texte court sans donnée sensible (jamais le message brut du serveur, qui peut citer les identifiants)
function describeError(error) {
  const code = error && (error.code || error.responseCode);
  const known = {
    EAUTH: "identifiants SMTP refusés", ECONNECTION: "serveur SMTP injoignable", ETIMEDOUT: "délai dépassé", ESOCKET: "connexion interrompue",
    EENVELOPE: "adresse refusée", EDNS: "nom du serveur SMTP introuvable", 535: "identifiants SMTP refusés", 550: "adresse refusée par le serveur", 553: "adresse refusée par le serveur",
  };
  return known[code] ? `${known[code]} (${code})` : `échec d'envoi${code ? ` (${String(code).slice(0, 20)})` : ""}`;
}

let running = false;

// Envoie les e-mails dus. transport/now/log injectables (tests). Ne lève jamais pour un échec d'envoi.
async function processOutbox(db, { transport, now = Date.now, log = console, limit = 20 } = {}) {
  ensureTable(db);
  if (running) return { skipped: true };
  running = true;
  const summary = { sent: 0, failed: 0, retry: 0, skipped: 0 };
  try {
    const t = now();
    // Un envoi resté « en cours » (serveur arrêté pendant l'envoi) est remis en file : mieux vaut un rare doublon qu'un
    // lien de réinitialisation jamais reçu.
    db.prepare("UPDATE mail_outbox SET status = 'pending', updated_at = ? WHERE status = 'sending' AND updated_at < ?").run(t, t - STUCK_MS);
    const rows = db.prepare("SELECT * FROM mail_outbox WHERE status = 'pending' AND next_attempt_at <= ? ORDER BY id LIMIT ?").all(t, limit);
    if (!rows.length) return summary;
    const { buildTransport, fromAddress } = require("./mailer");
    const smtp = transport !== undefined ? transport : buildTransport();
    const production = process.env.NODE_ENV === "production";
    for (const row of rows) {
      if (!db.prepare("UPDATE mail_outbox SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'pending'").run(now(), row.id).changes) continue;
      if (!smtp) {
        db.prepare("UPDATE mail_outbox SET status = 'skipped', last_error = 'SMTP non configuré (SMTP_HOST vide)', updated_at = ? WHERE id = ?").run(now(), row.id);
        if (production) log.warn?.(`[KOLAKISA] E-mail « ${row.kind} » non envoyé : SMTP non configuré.`);
        else log.log?.(`--- [KOLAKISA] SMTP non configuré : e-mail non envoyé ---\nÀ : ${row.to_email}\nSujet : ${row.subject}\n\n${row.body}\n--- fin de l'e-mail ---`);
        summary.skipped++;
        continue;
      }
      try {
        await smtp.sendMail({ from: fromAddress(), to: row.to_email, ...(row.reply_to ? { replyTo: row.reply_to } : {}), subject: row.subject, text: row.body });
        db.prepare(`UPDATE mail_outbox SET status = 'sent', sent_at = ?, updated_at = ?, last_error = '', body = CASE WHEN sensitive = 1 THEN '' ELSE body END WHERE id = ?`).run(now(), now(), row.id);
        summary.sent++;
      } catch (error) {
        const attempts = row.attempts + 1;
        const reason = describeError(error);
        if (attempts >= MAX_ATTEMPTS) {
          db.prepare("UPDATE mail_outbox SET status = 'failed', attempts = ?, last_error = ?, updated_at = ?, body = CASE WHEN sensitive = 1 THEN '' ELSE body END WHERE id = ?").run(attempts, reason, now(), row.id);
          summary.failed++;
        } else {
          db.prepare("UPDATE mail_outbox SET status = 'pending', attempts = ?, last_error = ?, next_attempt_at = ?, updated_at = ? WHERE id = ?").run(attempts, reason, now() + 60000 * 2 ** (attempts - 1), now(), row.id);
          summary.retry++;
        }
        log.error?.(`[KOLAKISA] E-mail « ${row.kind} » non envoyé (essai ${attempts}/${MAX_ATTEMPTS}) : ${reason}`);
      }
    }
    return summary;
  } finally {
    running = false;
  }
}

// Pour la page Réglages d'envoi : derniers e-mails du site (le contenu n'est jamais renvoyé) et compteurs
function outboxOverview(db, { limit = 20 } = {}) {
  ensureTable(db);
  const rows = db.prepare("SELECT id, kind, to_email, subject, status, attempts, last_error, created_at, sent_at FROM mail_outbox ORDER BY id DESC LIMIT ?").all(limit);
  const counts = Object.fromEntries(db.prepare("SELECT status, COUNT(*) n FROM mail_outbox GROUP BY status").all().map((r) => [r.status, r.n]));
  return { rows, counts };
}

// Relance périodique (nouvelles tentatives) ; l'intervalle ne retient pas le processus
function startOutboxTimer(db, { everyMs = 60000 } = {}) {
  const timer = setInterval(() => processOutbox(db).catch((error) => console.error("[KOLAKISA] File d'envoi :", error.message)), everyMs);
  timer.unref?.();
  return timer;
}

module.exports = { MAX_ATTEMPTS, ensureTable, queueMail, processOutbox, outboxOverview, startOutboxTimer, describeError };
