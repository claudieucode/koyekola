// Opérations composées (plusieurs appels, ou calcul local) : import CSV avec protection du consentement, export, vérification d'existence, bounces, comparaison, aperçu de modèle, tableau de bord.
const { run, subscriberHash } = require("./operations");
const { clientFor } = require("./connection");
const { MarketingError } = require("../errors");
const { validateEmail } = require("../audience/email");
const { audit } = require("../audience/shared");

const MAX_IMPORT = 5000;
const BATCH = 500;
const FIELD_TAG = /^[A-Z][A-Z0-9_]{0,9}$/;
const bad = (message) => new MarketingError("invalid_request", message);

// Adresses à NE PAS pousser : déjà désinscrites, rebondies, plaignantes ou supprimées dans Kolakisa (le plus restrictif gagne) ; les autres adresses d'un contact fusionné comptent aussi
function blockedLocally(ctx, email) {
  const c = require("../audience/contacts").findByEmail(ctx, email);
  if (c && ["unsubscribed", "bounced", "complained", "suppressed"].includes(c.status)) return true;
  return Boolean(ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email IN (?, ?)").get(ctx.organizationId, String(email).toLowerCase(), c ? c.email : String(email).toLowerCase()));
}

// rows : [{ email, FNAME?, LNAME?, <TAG>?, tags?: "a,b" }] (le navigateur a déjà appliqué la correspondance des colonnes). Sans attestation de consentement, les contacts sont importés « pending » :
// Mailchimp leur envoie lui-même l'e-mail de confirmation.
async function importMembers(ctx, listId, { rows, attestConsent = false, updateExisting = false, tags: commonTags = [] } = {}) {
  if (!Array.isArray(rows) || !rows.length) throw bad("Aucune ligne à importer.");
  if (rows.length > MAX_IMPORT) throw bad(`${MAX_IMPORT} lignes au plus par import : découpez le fichier.`);
  const status = attestConsent === true ? "subscribed" : "pending";
  const common = Array.isArray(commonTags) ? commonTags : [];
  const report = { received: rows.length, sent: 0, created: 0, updated: 0, invalid: [], blocked: 0, duplicates: 0, errors: [], status };
  const seen = new Set(), members = [];
  rows.forEach((row, index) => {
    const check = validateEmail(row && row.email);
    if (!check.ok) { if (report.invalid.length < 50) report.invalid.push({ line: index + 1, reason: check.reason }); return; }
    if (seen.has(check.email)) { report.duplicates++; return; }
    seen.add(check.email);
    if (blockedLocally(ctx, check.email)) { report.blocked++; return; }
    const merge = {};
    for (const [k, v] of Object.entries(row)) if (FIELD_TAG.test(k) && typeof v === "string" && v.trim()) merge[k] = v.trim().slice(0, 255);
    const rowTags = String(row.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
    members.push({ email_address: check.email, status_if_new: status, status, merge_fields: merge, tags: [...new Set([...common.map(String), ...rowTags])].slice(0, 20) });
  });
  for (let i = 0; i < members.length; i += BATCH) {
    const chunk = members.slice(i, i + BATCH).map(({ status_if_new, ...m }) => (updateExisting ? { ...m, status: undefined, status_if_new } : m));
    let res;
    try { res = await run(ctx, "audiences.batchSubscribe", { params: { listId }, body: { members: chunk.map((m) => JSON.parse(JSON.stringify(m))), update_existing: Boolean(updateExisting), sync_tags: false } }); }
    catch (error) {
      if (!report.sent) throw error; // rien n'est parti : l'erreur est simplement remontée
      report.aborted = `Import interrompu après ${report.sent} ligne(s) : ${error.message}`; // les lots déjà acceptés par Mailchimp restent comptés
      report.errors.push({ email: "(lot suivant)", message: error.message });
      break;
    }
    report.sent += chunk.length;
    report.created += Number(res && res.total_created) || 0;
    report.updated += Number(res && res.total_updated) || 0;
    for (const e of (res && res.errors || []).slice(0, 20)) if (report.errors.length < 50) report.errors.push({ email: String(e.email_address || ""), message: String(e.error || e.error_code || "refusé").slice(0, 200) });
  }
  audit(ctx, "mailchimp.members_imported", "mailchimp", null, { listId, sent: report.sent, status });
  return report;
}

// Neutralise l'injection de formules dans un tableur (=, +, -, @ en tête d'une cellule non numérique)
const cell = (value) => {
  let t = String(value ?? "");
  if (/^[=@\t\r]/.test(t) || (/^[+-]/.test(t) && !/^[+-]?[\d\s().-]+$/.test(t))) t = `'${t}`;
  return /[",\n\r;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};
async function exportMembers(ctx, listId, status = "") {
  const client = clientFor(ctx);
  if (status && !["subscribed", "unsubscribed", "cleaned", "pending", "transactional", "archived"].includes(status)) throw bad("Statut inconnu.");
  const { items, truncated } = await client.collect(`/lists/${encodeURIComponent(listId)}/members`, "members", {
    query: { fields: "members.email_address,members.status,members.merge_fields,members.tags,members.timestamp_opt,total_items", ...(status ? { status } : {}) }, pageSize: 1000, maxItems: 50000,
  });
  const lines = [["email", "statut", "prénom", "nom", "tags", "inscrit le"].join(",")];
  for (const m of items) lines.push([m.email_address, m.status, m.merge_fields && m.merge_fields.FNAME, m.merge_fields && m.merge_fields.LNAME, (m.tags || []).map((t) => t.name).join("|"), m.timestamp_opt].map(cell).join(","));
  audit(ctx, "mailchimp.members_exported", "mailchimp", null, { listId, count: items.length });
  return { csv: `﻿${lines.join("\r\n")}\r\n`, count: items.length, truncated };
}

async function memberExists(ctx, listId, who) {
  const hash = subscriberHash(who);
  try {
    const m = await run(ctx, "members.get", { params: { listId, hash }, query: { fields: "id,email_address,status" } });
    return { exists: true, status: m.status, email: m.email_address };
  } catch (error) { if (error.code === "not_found") return { exists: false }; throw error; }
}

async function bounces(ctx, campaignId, { count = 500 } = {}) {
  const res = await run(ctx, "reports.emailActivity", { params: { campaignId }, query: { count: Math.min(Number(count) || 500, 1000), fields: "emails.email_address,emails.activity,total_items" } });
  const out = { hard: [], soft: [] };
  for (const e of res.emails || []) for (const a of e.activity || []) if (a.action === "bounce") (a.type === "soft" ? out.soft : out.hard).push({ email: e.email_address, at: a.timestamp || null });
  return { hard: out.hard, soft: out.soft, total: out.hard.length + out.soft.length };
}

// Comparaison de campagnes (2 à 10), mêmes indicateurs pour toutes
async function compare(ctx, ids) {
  const list = [...new Set((Array.isArray(ids) ? ids : []).map(String))];
  if (list.length < 2 || list.length > 10) throw bad("Choisissez de 2 à 10 campagnes à comparer.");
  const rows = [];
  for (const id of list) {
    const r = await run(ctx, "reports.get", { params: { campaignId: id }, query: { fields: "id,campaign_title,subject_line,send_time,emails_sent,opens.open_rate,opens.unique_opens,clicks.click_rate,clicks.unique_clicks,bounces,unsubscribed,ecommerce.total_revenue" } });
    rows.push({ id: r.id, title: r.campaign_title || "", subject: r.subject_line || "", sendTime: r.send_time || null, sent: r.emails_sent || 0, openRate: r.opens && r.opens.open_rate || 0, clickRate: r.clicks && r.clicks.click_rate || 0,
      bounces: (r.bounces && (r.bounces.hard_bounces + r.bounces.soft_bounces)) || 0, unsubscribed: r.unsubscribed || 0, revenue: r.ecommerce && r.ecommerce.total_revenue || 0 });
  }
  return { campaigns: rows, best: { openRate: [...rows].sort((a, b) => b.openRate - a.openRate)[0].id, clickRate: [...rows].sort((a, b) => b.clickRate - a.clickRate)[0].id } };
}

// Aperçu LOCAL d'un modèle : remplace les balises de fusion *|TAG|* par des valeurs d'exemple (l'API Marketing n'a pas de point d'accès de rendu ; Mailchimp fait le rendu réel à l'envoi).
// Les valeurs sont échappées ; les balises inconnues sont laissées visibles.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const SAMPLE = { FNAME: "Camille", LNAME: "Martin", EMAIL: "camille.martin@exemple.fr", "MC:SUBJECT": "Objet de l'e-mail", UNSUB: "#desabonnement", UPDATE_PROFILE: "#profil", ARCHIVE: "#archive", FORWARD: "#transferer", "LIST:COMPANY": "Votre société", "LIST:ADDRESSLINE": "1 rue de l'Exemple, 75001 Paris", CURRENT_YEAR: String(new Date().getFullYear()) };
function renderTemplate(html, variables = {}) {
  if (typeof html !== "string" || !html.trim()) throw bad("Le HTML du modèle est vide.");
  if (html.length > 1_000_000) throw bad("Modèle trop volumineux (1 Mo au plus).");
  const values = { ...SAMPLE };
  for (const [k, v] of Object.entries(variables || {})) if (/^[A-Z0-9_:]{1,30}$/.test(k) && ["string", "number"].includes(typeof v)) values[k] = String(v).slice(0, 500);
  const used = new Set(), unknown = new Set();
  const out = html.replace(/\*\|([A-Z0-9_:]{1,30})\|\*/g, (all, tag) => { if (Object.hasOwn(values, tag)) { used.add(tag); return /^(UNSUB|UPDATE_PROFILE|ARCHIVE|FORWARD)$/.test(tag) ? values[tag] : esc(values[tag]); } unknown.add(tag); return all; });
  return { html: out, used: [...used], unknown: [...unknown] };
}

// Tableau de bord : lit les miroirs locaux (aucun appel réseau) ; l'évolution des abonnés (30 jours) est lue en direct si une audience existe
async function dashboard(ctx, { live = true } = {}) {
  const org = ctx.organizationId;
  const audiences = ctx.db.prepare("SELECT remote_id AS id, name, member_count AS members, unsubscribe_count AS unsubscribed, cleaned_count AS cleaned, open_rate AS openRate, click_rate AS clickRate, local_list_id AS localListId FROM mk_mc_audiences WHERE organization_id = ? ORDER BY member_count DESC").all(org);
  const campaigns = ctx.db.prepare("SELECT remote_id AS id, type, status, title, subject, send_time AS sendTime, emails_sent AS sent, report FROM mk_mc_campaigns WHERE organization_id = ? ORDER BY COALESCE(send_time, synced_at) DESC").all(org)
    .map((c) => ({ ...c, report: (() => { try { return JSON.parse(c.report || "{}"); } catch { return {}; } })() }));
  const sent = campaigns.filter((c) => c.status === "sent" && c.report && c.report.emailsSent);
  const totalSent = sent.reduce((n, c) => n + c.report.emailsSent, 0);
  const avgOpen = totalSent ? sent.reduce((n, c) => n + c.report.openRate * c.report.emailsSent, 0) / totalSent : 0;
  const recent = sent.filter((c) => c.sendTime && Date.now() - Date.parse(c.sendTime) < 7 * 86400000);
  const rsent = recent.reduce((n, c) => n + c.report.emailsSent, 0);
  const alerts = [];
  if (rsent >= 100) {
    const bounce = recent.reduce((n, c) => n + c.report.hardBounces + c.report.softBounces, 0) / rsent;
    const unsub = recent.reduce((n, c) => n + c.report.unsubscribed, 0) / rsent;
    const abuse = recent.reduce((n, c) => n + c.report.abuse, 0);
    if (bounce >= 0.05) alerts.push({ level: "danger", text: `Taux de rebond élevé sur 7 jours : ${(bounce * 100).toFixed(1)} % (seuil d'alerte 5 %). Nettoyez vos adresses.` });
    if (unsub >= 0.01) alerts.push({ level: "warning", text: `Désabonnements anormaux sur 7 jours : ${(unsub * 100).toFixed(1)} % (seuil d'alerte 1 %). Revoyez la fréquence et le ciblage.` });
    if (abuse > 0 && abuse / rsent >= 0.001) alerts.push({ level: "danger", text: `Plaintes : ${abuse} signalement(s) d'abus sur 7 jours (seuil 0,1 %). Risque pour la réputation d'expéditeur.` });
  }
  let growth = [];
  if (live && audiences.length) {
    try { const a = await run(ctx, "audiences.activity", { params: { listId: audiences[0].id }, query: { count: 30 } }); growth = (a.activity || []).map((d) => ({ day: d.day, subscribed: d.subs || 0, unsubscribed: d.unsubs || 0 })); } catch { growth = []; }
  }
  return { audiences, totals: { audiences: audiences.length, contacts: audiences.reduce((n, a) => n + a.members, 0), campaigns: campaigns.length, avgOpenRate: avgOpen, revenue: sent.reduce((n, c) => n + (c.report.revenue || 0), 0) },
    recentCampaigns: campaigns.slice(0, 8), growth, alerts };
}

module.exports = { blockedLocally, importMembers, exportMembers, memberExists, bounces, compare, renderTemplate, dashboard, cell };
