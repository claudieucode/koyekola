// Programme 20.5 — Notifications commerciales. Elles passent par la file d'envoi existante (src/utils/outbox.js : réessais, journal, « SMTP non configuré » = ignoré, jamais « envoyé » à tort).
// Chaque tentative est notée dans mk_shop_notifications : « queued » = remis à la file (l'envoi réel et ses échecs se lisent dans la file d'e-mails), « failed » = refusé avant la file, « not_configured » = aucun serveur d'e-mail.
// Le texte reflète l'état RÉEL de la commande au moment de l'appel ; un échec de notification n'annule jamais une commande.
const { queueMail } = require("../../utils/outbox");
const deliverySlots = require("./deliverySlots");

const money = (cents, cur) => `${(cents / 100).toFixed(2)} ${String(cur).toUpperCase()}`;
const one = (v) => String(v == null ? "" : v).replace(/[\r\n\u2028\u2029]+/g, " ").trim();

const SUBJECTS = {
  order_created: (o) => `Commande ${o.number} reçue`,
  order_paid: (o) => `Paiement confirmé — commande ${o.number}`,
  payment_failed: (o) => `Paiement non abouti — commande ${o.number}`,
  order_shipped: (o) => `Commande ${o.number} expédiée`,
  order_updated: (o) => `Mise à jour de la commande ${o.number}`,
  order_cancelled: (o) => `Commande ${o.number} annulée`,
  order_refunded: (o) => `Remboursement — commande ${o.number}`,
  admin_new_order: (o) => `Nouvelle commande ${o.number}`,
};

function body(event, order, items, extra) {
  const lines = items.map((i) => `- ${one(i.name)}${i.variant_label ? ` (${one(i.variant_label)})` : ""}${i.custom_text ? ` — ${one(i.custom_label || "Personnalisation")} : « ${one(i.custom_text)} »` : ""} × ${i.quantity} : ${money(i.line_subtotal_cents - i.discount_cents, order.currency)}`);
  const slot = deliverySlots.describe(order);
  const recap = [`Commande ${order.number}`, ...lines, ...(slot ? ["", `Créneau de livraison : ${slot}`] : []), "", `Total : ${money(order.total_cents, order.currency)}`];
  const intro = {
    order_created: "Nous avons bien reçu votre commande. Elle sera traitée une fois le paiement confirmé.",
    order_paid: "Votre paiement est confirmé. Merci pour votre achat !",
    payment_failed: "Votre paiement n'a pas abouti. Vous n'avez pas été débité ; vous pouvez réessayer depuis la boutique.",
    order_shipped: `Votre commande est expédiée.${order.tracking_number ? ` Suivi : ${one(order.tracking_number)}.` : ""}`,
    order_updated: "Le statut de votre commande a changé.",
    order_cancelled: "Votre commande a été annulée.",
    order_refunded: "Votre commande a été remboursée. Le délai d'apparition sur votre relevé dépend de votre banque.",
    admin_new_order: `Nouvelle commande de ${one(order.email)}. Statut de paiement : ${order.payment_status}.`,
  }[event];
  return [intro, "", ...recap, ...(extra ? ["", extra] : [])].join("\n");
}

// → { queued: boolean }
function notify(s, order, event, { to, extra } = {}) {
  const recipient = to || order.email;
  const log = (status, error) => { try { s.db.prepare("INSERT OR IGNORE INTO mk_shop_notifications (organization_id, site_id, order_id, event, recipient, status, error) VALUES (?,?,?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, order.id, event, recipient, status, error || null); } catch { /* le journal ne bloque jamais */ } };
  try {
    if (!recipient) { log("failed", "aucun destinataire"); return { queued: false }; }
    const dup = s.db.prepare("SELECT 1 FROM mk_shop_notifications WHERE order_id = ? AND event = ? AND recipient = ? AND status = 'queued'").get(order.id, event, recipient);
    if (dup) return { queued: false, duplicate: true };
    const items = s.db.prepare("SELECT * FROM mk_shop_order_items WHERE order_id = ?").all(order.id);
    const r = queueMail(s.db, { kind: "shop_order", to: recipient, subject: SUBJECTS[event](order), text: body(event, order, items, extra) });
    if (!r.queued) { log("failed", r.reason || "refusée par la file"); return { queued: false }; }
    log(process.env.SMTP_HOST ? "queued" : "not_configured", process.env.SMTP_HOST ? null : "SMTP non configuré : le message restera « ignoré » dans la file");
    return { queued: true };
  } catch (error) { log("failed", String(error.message).slice(0, 200)); return { queued: false }; }
}

// Événements vers client + administrateur de la boutique.
function onOrderEvent(s, order, event, settings, extra) {
  notify(s, order, event, { extra });
  if (event === "order_created" && settings && settings.notify_email) notify(s, order, "admin_new_order", { to: settings.notify_email });
}

// Rendez-vous (essayage, conseil, atelier) : même file d'envoi. Le texte dit l'état RÉEL (demande à confirmer ou confirmé).
const fmtWhen = (a) => `${a.start_at.slice(8, 10)}/${a.start_at.slice(5, 7)}/${a.start_at.slice(0, 4)} à ${a.start_at.slice(11)} (durée ${a.duration_min} min)`;
function notifyAppointment(s, a, event, { to, shopName, cancelUrl, bookingUrl } = {}) {
  const where = a.location_kind === "visio" ? "En visioconférence (le lien vous sera communiqué)" : `Lieu : ${one(a.location)}`;
  const recap = [`${one(a.type_name)} — ${fmtWhen(a)}`, where, ...(a.product_name ? [`Produit concerné : ${one(a.product_name)}`] : []), ...(a.note ? [`Note : ${one(a.note)}`] : [])];
  const subjects = { customer_created: a.status === "confirmed" ? "Rendez-vous confirmé" : "Demande de rendez-vous reçue", customer_confirmed: "Rendez-vous confirmé", customer_cancelled: "Rendez-vous annulé", customer_rescheduled: "Rendez-vous reporté",
    admin_created: "Nouveau rendez-vous", admin_cancelled: "Rendez-vous annulé par le client" };
  const intro = {
    customer_created: a.status === "confirmed" ? "Votre rendez-vous est confirmé." : "Nous avons bien reçu votre demande : le créneau est réservé pour vous et le vendeur doit encore la confirmer. Vous recevrez un message.",
    customer_confirmed: "Votre rendez-vous est confirmé par le vendeur.", customer_cancelled: "Votre rendez-vous a été annulé par le vendeur.", customer_rescheduled: "Votre rendez-vous a été reporté à une nouvelle date.",
    admin_created: `Nouveau rendez-vous de ${one(a.customer_name)} (${one(a.customer_email)}${a.customer_phone ? `, ${one(a.customer_phone)}` : ""}). Statut : ${a.status === "confirmed" ? "confirmé" : "à confirmer"}.`, admin_cancelled: `${one(a.customer_name)} a annulé son rendez-vous.`,
  }[event];
  const tail = event.startsWith("customer_") && a.status !== "cancelled" && cancelUrl ? ["", `Un empêchement ? Annulez en un clic : ${cancelUrl}`] : event === "customer_cancelled" && bookingUrl ? ["", `Reprendre rendez-vous : ${bookingUrl}`] : [];
  try {
    const r = queueMail(s.db, { kind: "shop_appointment", to: to || a.customer_email, subject: `${subjects[event]}${shopName ? ` — ${one(shopName)}` : ""}`, text: [intro, "", ...recap, ...tail].join("\n"), replyTo: event.startsWith("admin_") ? a.customer_email : "" });
    return { queued: !!r.queued };
  } catch { return { queued: false }; }
}

module.exports = { notify, onOrderEvent, notifyAppointment, SUBJECTS };
