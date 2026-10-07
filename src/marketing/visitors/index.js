// Suivi des visiteurs (Site Web, phase 6). N'enregistre RIEN sans l'accord du visiteur : la route publique ne lit
// l'identifiant de visiteur que dans le cookie posé après son accord (voir public/js/visitor.js). Aucune adresse IP,
// aucun texte saisi, aucune adresse complète : chemin de la page, élément concerné, provenance (domaine + utm), appareil.
const { checkCtx } = require("../audience/shared");

const TYPES = ["session_start", "page_view", "button_click", "section_view", "form_view", "form_submit", "popup_view", "popup_close", "video_start", "download"];
const DEVICES = ["mobile", "tablet", "desktop"];
const VISITOR_ID = /^[A-Za-z0-9_-]{16,40}\.\d{13}$/; // aléatoire + date de première visite (ms)
const RETENTION_MS = 395 * 24 * 3600 * 1000; // 13 mois
const MAX_BATCH = 30;
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|monitor/i;

const cut = (v, max) => (typeof v === "string" ? v.replace(/[\x00-\x1f\x7f<>"'`\\]/g, "").trim().slice(0, max) : "");
// Chemin de page du site (« /… »), sans paramètres ni ancre
const cleanPath = (v) => { const p = cut(v, 300).split(/[?#]/)[0]; return /^\/[^\s]*$/.test(p) ? p : null; };

const isVisitorId = (v) => typeof v === "string" && VISITOR_ID.test(v);
const firstSeenOf = (id) => Number(String(id).split(".")[1]);

// Lot d'événements envoyé par le navigateur d'un visiteur ayant accepté le suivi
function record(db, organizationId, { visitorId, sessionId, events, userAgent = "", now = Date.now() } = {}) {
  if (!isVisitorId(visitorId) || BOT.test(userAgent || "") || !userAgent) return { ok: false, reason: "ignored" };
  const sid = cut(sessionId, 40);
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(sid)) return { ok: false, reason: "invalid_session" };
  const list = (Array.isArray(events) ? events : []).slice(0, MAX_BATCH);
  const first = Math.min(firstSeenOf(visitorId), now);
  const visitor = db.prepare("SELECT * FROM mk_web_visitors WHERE id = ?").get(visitorId);
  if (visitor && visitor.organization_id !== organizationId) return { ok: false, reason: "ignored" };
  const starts = list.filter((e) => e && e.t === "session_start").length;
  if (!visitor) db.prepare("INSERT INTO mk_web_visitors (id, organization_id, first_seen, last_seen, sessions) VALUES (?, ?, ?, ?, ?)").run(visitorId, organizationId, first, now, starts);
  else db.prepare("UPDATE mk_web_visitors SET last_seen = ?, sessions = sessions + ? WHERE id = ?").run(now, starts, visitorId);
  const contactId = visitor ? visitor.contact_id : null;
  const insert = db.prepare(`INSERT INTO mk_web_events (organization_id, visitor_id, session_id, contact_id, type, path, page_id, target, referrer, utm_source, utm_medium, utm_campaign, device, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const pageIdOf = db.prepare("SELECT id FROM mk_landing_pages WHERE organization_id = ? AND slug = ?");
  let saved = 0;
  const pageViews = []; // pages du moteur vues dans ce lot (déclencheurs d'automatisation, voir visitors/triggers.js)
  const signals = [];   // formations consultées, ajouts au panier, commande commencée (déclencheurs e-commerce)
  const signal = (s) => { if (!signals.some((x) => x.kind === s.kind && x.key === s.key)) signals.push(s); };
  for (const e of list) {
    if (!e || !TYPES.includes(e.t) || e.t === "form_submit") continue; // l'envoi d'un formulaire est enregistré par le serveur lui-même
    const path = cleanPath(e.p);
    if (!path) continue;
    const m = /^\/p\/([a-z0-9-]{1,60})\/?$/.exec(path);
    const page = m ? pageIdOf.get(organizationId, m[1]) : null;
    // Date envoyée par le navigateur : acceptée seulement si plausible (dans les 10 dernières minutes)
    const at = Number.isInteger(e.at) && e.at <= now && now - e.at < 10 * 60000 ? e.at : now;
    const ref = cut(e.r, 120).toLowerCase();
    insert.run(organizationId, visitorId, sid, contactId, e.t, path, page ? page.id : null, cut(e.x, 120), /^[a-z0-9.-]+$/.test(ref) ? ref : "",
      cut(e.us, 80), cut(e.um, 80), cut(e.uc, 80), DEVICES.includes(e.d) ? e.d : "", at);
    saved += 1;
    if (e.t === "page_view" && page && !pageViews.some((v) => v.pageId === page.id)) pageViews.push({ pageId: page.id, path });
    const course = e.t === "page_view" ? /^\/cours\/([a-z0-9-]{1,120})\/?$/.exec(path) : null;
    if (course) signal({ kind: "course", key: course[1] });
    if (e.t === "page_view" && /^\/commande\/?$/.test(path)) signal({ kind: "checkout", key: "commande" });
    const cart = e.t === "button_click" ? /^add_to_cart:(\d{1,9})$/.exec(String(e.x || "")) : null;
    if (cart) signal({ kind: "cart", key: cart[1] });
  }
  return { ok: true, saved, sessionId: sid, pageViews, signals };
}

// Le visiteur devient un contact connu (inscription, connexion) : ses visites passées et futures sont reliées à sa fiche
function linkVisitor(db, organizationId, visitorId, contactId) {
  if (!isVisitorId(visitorId) || !Number.isInteger(contactId)) return false;
  const v = db.prepare("SELECT organization_id FROM mk_web_visitors WHERE id = ?").get(visitorId);
  if (!v || v.organization_id !== organizationId) return false;
  db.prepare("UPDATE mk_web_visitors SET contact_id = ? WHERE id = ?").run(contactId, visitorId);
  db.prepare("UPDATE mk_web_events SET contact_id = ? WHERE visitor_id = ? AND contact_id IS NULL").run(contactId, visitorId);
  return true;
}

// Envoi d'un formulaire par un visiteur suivi : événement enregistré côté serveur (jamais falsifiable par le navigateur)
function recordFormSubmit(db, organizationId, { visitorId, contactId, path, formName, now = Date.now() }) {
  if (!isVisitorId(visitorId)) return false;
  const v = db.prepare("SELECT organization_id FROM mk_web_visitors WHERE id = ?").get(visitorId);
  if (!v || v.organization_id !== organizationId) return false;
  linkVisitor(db, organizationId, visitorId, contactId);
  const p = cleanPath(path) || "/";
  const m = /^\/p\/([a-z0-9-]{1,60})\/?$/.exec(p);
  const page = m ? db.prepare("SELECT id FROM mk_landing_pages WHERE organization_id = ? AND slug = ?").get(organizationId, m[1]) : null;
  db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, contact_id, type, path, page_id, target, occurred_at) VALUES (?, ?, 'serveur', ?, 'form_submit', ?, ?, ?, ?)")
    .run(organizationId, visitorId, contactId, p, page ? page.id : null, cut(formName, 120), now);
  return true;
}

// Parcours d'un contact (fiche contact) : ses visites, du plus récent au plus ancien
function journey(ctx, contactId, { limit = 100 } = {}) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT type, path, target, referrer, utm_source, device, occurred_at FROM mk_web_events WHERE organization_id = ? AND contact_id = ? ORDER BY occurred_at DESC, id DESC LIMIT ?")
    .all(ctx.organizationId, contactId, Math.min(Math.max(Number(limit) || 100, 1), 500));
}

// Conservation : 13 mois au plus
function purge(db, now = Date.now()) {
  const limit = now - RETENTION_MS;
  const events = db.prepare("DELETE FROM mk_web_events WHERE occurred_at < ?").run(limit).changes;
  const visitors = db.prepare("DELETE FROM mk_web_visitors WHERE last_seen < ?").run(limit).changes;
  return { events, visitors };
}

const LABELS = {
  session_start: "Début de visite", page_view: "Page vue", button_click: "Clic", section_view: "Section atteinte", form_view: "Formulaire affiché",
  form_submit: "Formulaire envoyé", popup_view: "Pop-up affiché", popup_close: "Pop-up fermé", video_start: "Vidéo lancée", download: "Téléchargement",
};

module.exports = { TYPES, LABELS, RETENTION_MS, isVisitorId, firstSeenOf, record, linkVisitor, recordFormSubmit, journey, purge, cleanPath };
