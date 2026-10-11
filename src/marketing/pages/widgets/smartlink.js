// Lien intelligent (comme « Contact URL » / liens dynamiques d'Elementor) : un bouton qui ouvre une application ou lance une action — écrire un e-mail,
// appeler, envoyer un SMS, WhatsApp, Messenger, Skype, Viber, itinéraire Waze, ajout à l'agenda (Google, Outlook, Yahoo).
// L'adresse est RECONSTRUITE ici à partir de valeurs validées et encodées : jamais une adresse libre, jamais de script.
const KINDS = {
  email: "Écrire un e-mail", tel: "Appeler", sms: "Envoyer un SMS", whatsapp: "WhatsApp", messenger: "Messenger", skype: "Skype", viber: "Viber",
  waze: "Itinéraire Waze", google: "Agenda Google", outlook: "Agenda Outlook", yahoo: "Agenda Yahoo",
};
const digits = (v) => String(v || "").replace(/[^\d]/g, "");
const DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
// « 2026-11-05T14:00 » en heure de Paris → instant UTC
function parisToUtc(local) {
  const [d, t] = local.split("T"), [y, mo, da] = d.split("-").map(Number), [h, mi] = t.split(":").map(Number);
  let guess = Date.UTC(y, mo - 1, da, h, mi);
  for (let i = 0; i < 2; i++) { // l'écart de Paris (UTC+1 / +2) dépend de la date : deux passes suffisent
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
    const shown = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    guess += Date.UTC(y, mo - 1, da, h, mi) - shown;
  }
  return new Date(guess);
}
const compact = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
function hrefOf(p) {
  const E = encodeURIComponent, msg = p.message || "", t = p.target || "";
  switch (p.kind) {
    case "email": return `mailto:${t}${p.subject || msg ? `?${[p.subject ? `subject=${E(p.subject)}` : "", msg ? `body=${E(msg)}` : ""].filter(Boolean).join("&")}` : ""}`;
    case "tel": return `tel:+${digits(t)}`;
    case "sms": return `sms:+${digits(t)}${msg ? `?body=${E(msg)}` : ""}`;
    case "whatsapp": return `https://wa.me/${digits(t)}${msg ? `?text=${E(msg)}` : ""}`;
    case "messenger": return `https://m.me/${E(t)}`;
    case "skype": return `skype:${E(t)}?chat`;
    case "viber": return `viber://chat?number=%2B${digits(t)}`;
    case "waze": return `https://waze.com/ul?q=${E(t)}&navigate=yes`;
    default: {
      const s = parisToUtc(p.start), e = p.end ? parisToUtc(p.end) : new Date(s.getTime() + 3600000);
      if (p.kind === "google") return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${E(p.subject)}&dates=${compact(s)}/${compact(e)}&details=${E(msg)}&location=${E(t)}`;
      if (p.kind === "outlook") return `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=${E(p.subject)}&startdt=${E(s.toISOString())}&enddt=${E(e.toISOString())}&body=${E(msg)}&location=${E(t)}`;
      return `https://calendar.yahoo.com/?v=60&title=${E(p.subject)}&st=${compact(s)}&et=${compact(e)}&desc=${E(msg)}&in_loc=${E(t)}`;
    }
  }
}
module.exports = {
  type: "smartlink", label: "Lien intelligent", group: "social", icon: "send", version: 1, style: "box", status: "operational",
  description: "Un bouton qui écrit, appelle, ouvre WhatsApp, un itinéraire ou l'agenda",
  keywords: "lien intelligent contact email appeler telephone sms whatsapp messenger skype viber waze itineraire agenda calendrier evenement google outlook yahoo",
  schema: [
    { key: "kind", kind: "select", label: "Action", options: Object.entries(KINDS), default: "email" },
    { key: "label", kind: "text", label: "Texte du bouton", max: 60, required: true, default: "Nous écrire" },
    { key: "variant", kind: "select", label: "Apparence", options: [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], default: "primary" },
    { key: "target", kind: "text", label: "E-mail, numéro (avec l'indicatif), nom d'utilisateur, adresse du lieu ou lieu de l'événement", max: 200, required: true, default: "contact@exemple.fr" },
    { key: "subject", kind: "text", label: "Objet (e-mail) ou titre de l'événement (agenda)", max: 120, default: "" },
    { key: "message", kind: "textarea", label: "Message pré-rempli ou description de l'événement (facultatif)", max: 500, default: "" },
    { key: "start", kind: "text", label: "Début de l'événement (agenda) : AAAA-MM-JJTHH:MM, heure de Paris", max: 16, default: "" },
    { key: "end", kind: "text", label: "Fin de l'événement (facultatif, une heure après le début par défaut)", max: 16, default: "" },
  ],
  validate(p, at) {
    const k = p.kind;
    if (k === "email") { if (!/^[^\s@<>"'`\\]+@[^\s@<>"'`\\]+\.[^\s@<>"'`\\]{2,}$/.test(p.target)) throw new Error(`${at} : adresse e-mail valide attendue.`); }
    else if (["tel", "sms", "whatsapp", "viber"].includes(k)) { const n = digits(p.target); if (n.length < 6 || n.length > 15) throw new Error(`${at} : numéro de 6 à 15 chiffres attendu (avec l'indicatif du pays).`); }
    else if (["messenger", "skype"].includes(k)) { if (!/^[A-Za-z0-9._:-]{3,60}$/.test(p.target)) throw new Error(`${at} : nom d'utilisateur attendu (lettres, chiffres, points).`); }
    else if (k === "waze") { if (p.target.trim().length < 3) throw new Error(`${at} : adresse du lieu attendue.`); }
    else {
      if (!p.subject) throw new Error(`${at} : le titre de l'événement est obligatoire.`);
      if (!DATE.test(p.start)) throw new Error(`${at} : début de l'événement au format AAAA-MM-JJTHH:MM (ex. 2026-11-05T14:00).`);
      if (p.end && !DATE.test(p.end)) throw new Error(`${at} : fin de l'événement au format AAAA-MM-JJTHH:MM.`);
      if (p.end && parisToUtc(p.end) <= parisToUtc(p.start)) throw new Error(`${at} : la fin de l'événement doit venir après son début.`);
    }
  },
  data(ctx, p) { return { href: hrefOf(p), web: /^https:/.test(hrefOf(p)) }; },
};
