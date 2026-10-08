// Chronologie d'un contact : tout ce qui lui est arrivé, du plus récent au plus ancien (lecture seule).
// Sources : création, consentements, désinscriptions, listes, étiquettes, e-mails reçus, scénarios, événements KOLAKISA.
const { checkCtx } = require("./shared");
const { TRIGGERS } = require("../automations/catalog");

const fromSql = (text) => { const t = Date.parse(`${String(text).replace(" ", "T")}Z`); return Number.isFinite(t) ? t : 0; };
// Événements déjà représentés par une autre source (création, étiquette, liste, abonnement)
const COVERED_EVENTS = ["contact.created", "contact.subscribed", "tag.added", "list.member_added"];

function contactTimeline(ctx, contactId, { limit = 50 } = {}) {
  checkCtx(ctx);
  const org = ctx.organizationId;
  const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const db = ctx.db;
  const contact = db.prepare("SELECT id, source, created_at FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, org);
  if (!contact) return [];
  const items = [];
  const push = (at, type, icon, text, href = null, permission = "contacts.read") => { if (at) items.push({ at, type, icon, text, href, permission }); };

  push(fromSql(contact.created_at), "created", "user", `Contact créé (source : ${contact.source}).`);

  // Parcours sur le site (visites suivies avec l'accord de la personne : voir src/marketing/visitors)
  const VISIT = { session_start: "Début de visite", page_view: "Page vue", button_click: "Clic sur", section_view: "Section lue", form_view: "Formulaire affiché", form_submit: "Formulaire envoyé", popup_view: "Pop-up affiché", popup_close: "Pop-up fermé", video_start: "Vidéo lancée", download: "Téléchargement" };
  for (const w of db.prepare("SELECT type, path, target, referrer, utm_source, occurred_at FROM mk_web_events WHERE contact_id = ? AND organization_id = ? ORDER BY occurred_at DESC, id DESC LIMIT ?").all(contactId, org, cap)) {
    const where = w.type === "session_start" ? `${w.path}${w.referrer ? ` (venant de ${w.referrer})` : ""}${w.utm_source ? ` — source « ${w.utm_source} »` : ""}` : w.type === "button_click" || w.type === "download" || w.type === "form_submit" || w.type === "popup_view" ? `« ${w.target} » (${w.path})` : w.path;
    push(w.occurred_at, "visit", "globe", `${VISIT[w.type] || w.type} : ${where}`);
  }

  for (const k of db.prepare("SELECT action, purpose, source, created_at FROM mk_consents WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?").all(contactId, org, cap)) {
    push(fromSql(k.created_at), "consent", "shield", k.action === "granted" ? `Consentement donné (${k.source}).` : `Consentement retiré (${k.source}).`);
  }
  for (const u of db.prepare("SELECT u.scope, u.source, u.created_at, l.name AS list_name, u.list_id FROM mk_unsubscribes u LEFT JOIN mk_lists l ON l.id = u.list_id WHERE u.contact_id = ? AND u.organization_id = ? ORDER BY u.id DESC LIMIT ?").all(contactId, org, cap)) {
    push(fromSql(u.created_at), "unsubscribe", "close", u.scope === "list" ? `Désinscrit de la liste « ${u.list_name} » (${u.source}).` : `Désinscrit de tous les envois (${u.source}).`);
  }
  for (const l of db.prepare("SELECT m.added_at, l.id, l.name FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id WHERE m.contact_id = ? AND m.organization_id = ? ORDER BY m.id DESC LIMIT ?").all(contactId, org, cap)) {
    push(fromSql(l.added_at), "list", "list", `Ajouté à la liste « ${l.name} ».`, `/marketing/listes/${l.id}`, "lists.read");
  }
  for (const t of db.prepare("SELECT t.name, ct.created_at FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? AND ct.organization_id = ? ORDER BY ct.id DESC LIMIT ?").all(contactId, org, cap)) {
    push(fromSql(t.created_at), "tag", "tag", `Étiquette « ${t.name} » ajoutée.`);
  }
  // Notes (écrites par un scénario d'automatisation : action « Ajouter une note »)
  for (const n of db.prepare("SELECT n.body, n.source, n.created_at, n.automation_id, a.name AS automation FROM mk_contact_notes n LEFT JOIN mk_automations a ON a.id = n.automation_id WHERE n.contact_id = ? AND n.organization_id = ? ORDER BY n.id DESC LIMIT ?").all(contactId, org, cap)) {
    const body = n.body.length > 300 ? `${n.body.slice(0, 297)}…` : n.body;
    push(fromSql(n.created_at), "note", "stickyNote", `Note${n.source === "automation" && n.automation ? ` (scénario « ${n.automation} »)` : ""} : ${body}`, n.automation_id ? `/marketing/automatisations/${n.automation_id}` : null, n.automation_id ? "automations.read" : "contacts.read");
  }
  for (const m of db
    .prepare("SELECT m.campaign_id, m.subject, m.sent_at, m.first_open_at, m.first_click_at, m.bounced_at, m.complained_at, c.name AS campaign FROM mk_messages m JOIN mk_campaigns c ON c.id = m.campaign_id WHERE m.contact_id = ? AND m.organization_id = ? ORDER BY m.id DESC LIMIT ?")
    .all(contactId, org, cap)) {
    const subject = m.subject || "(sans objet)";
    const href = `/marketing/campagnes/${m.campaign_id}`;
    push(m.sent_at, "message", "mail", `E-mail « ${subject} » envoyé (campagne « ${m.campaign} »).`, href, "campaigns.read");
    push(m.first_open_at, "open", "eye", `E-mail « ${subject} » ouvert (indicatif : les ouvertures ne sont pas fiables).`, href, "campaigns.read");
    push(m.first_click_at, "click", "externalLink", `Clic dans l'e-mail « ${subject} ».`, href, "campaigns.read");
    push(m.bounced_at, "bounce", "alertTriangle", `Rebond de l'e-mail « ${subject} ».`, href, "campaigns.read");
    push(m.complained_at, "complaint", "alertTriangle", `Plainte après l'e-mail « ${subject} ».`, href, "campaigns.read");
  }
  for (const r of db
    .prepare("SELECT r.automation_id, r.status, r.entered_at, r.finished_at, a.name FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.contact_id = ? AND r.organization_id = ? ORDER BY r.id DESC LIMIT ?")
    .all(contactId, org, cap)) {
    const href = `/marketing/automatisations/${r.automation_id}`;
    push(r.entered_at, "automation", "zap", `Entré dans le scénario « ${r.name} ».`, href, "automations.read");
    if (r.finished_at) push(r.finished_at, "automation", "zap", r.status === "completed" ? `Parcours terminé : scénario « ${r.name} ».` : r.status === "failed" ? `Échec dans le scénario « ${r.name} ».` : `Sorti du scénario « ${r.name} ».`, href, "automations.read");
  }
  for (const e of db
    .prepare(`SELECT name, occurred_at FROM mk_events WHERE contact_id = ? AND organization_id = ? AND name NOT IN (${COVERED_EVENTS.map(() => "?").join(",")}) ORDER BY occurred_at DESC, id DESC LIMIT ?`)
    .all(contactId, org, ...COVERED_EVENTS, cap)) {
    push(e.occurred_at, "event", "book", `${TRIGGERS[e.name] ? TRIGGERS[e.name].label : e.name}.`);
  }
  return items.sort((a, b) => b.at - a.at).slice(0, cap);
}

// Petits chiffres de l'en-tête de la fiche
function contactSummary(ctx, contactId) {
  checkCtx(ctx);
  const org = ctx.organizationId;
  const m = ctx.db
    .prepare("SELECT COALESCE(SUM(CASE WHEN status <> 'pending' AND sent_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS messages, COALESCE(SUM(CASE WHEN first_click_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS clicked FROM mk_messages WHERE contact_id = ? AND organization_id = ?")
    .get(contactId, org);
  const running = ctx.db.prepare("SELECT COUNT(*) n FROM mk_automation_runs WHERE contact_id = ? AND organization_id = ? AND status = 'running'").get(contactId, org).n;
  const c = ctx.db.prepare("SELECT last_activity_at FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, org);
  return { messages: m.messages, clicked: m.clicked, runningAutomations: running, lastActivity: c ? c.last_activity_at : null };
}

module.exports = { contactTimeline, contactSummary };
