// Bouton flottant de contact (comme « Floating Buttons » d'Elementor) : un bouton rond fixé dans un coin de l'écran qui ouvre WhatsApp, Messenger,
// un e-mail ou un SMS. L'adresse est RECONSTRUITE ici à partir d'un identifiant validé (numéro, nom d'utilisateur, e-mail) : jamais une adresse libre.
const PLATFORMS = { whatsapp: "WhatsApp", messenger: "Messenger", email: "E-mail", sms: "SMS" };
const digits = (v) => String(v || "").replace(/[^\d]/g, "");
const hrefOf = (p) => {
  const msg = encodeURIComponent(p.message || "");
  if (p.platform === "whatsapp") return `https://wa.me/${digits(p.contact)}${p.message ? `?text=${msg}` : ""}`;
  if (p.platform === "messenger") return `https://m.me/${encodeURIComponent(p.contact)}`;
  if (p.platform === "email") return `mailto:${p.contact}${p.message ? `?body=${msg}` : ""}`;
  return `sms:+${digits(p.contact)}${p.message ? `?body=${msg}` : ""}`;
};
module.exports = {
  type: "floatingbutton", label: "Bouton flottant", group: "social", icon: "send", version: 1, style: "box", status: "operational",
  description: "Un bouton fixé dans un coin : WhatsApp, Messenger, e-mail ou SMS",
  keywords: "bouton flottant contact whatsapp messenger sms email chat discuter ecrire coin fixe",
  schema: [
    { key: "platform", kind: "select", label: "Service", options: Object.entries(PLATFORMS), default: "whatsapp" },
    { key: "contact", kind: "text", label: "Numéro (avec l'indicatif), nom d'utilisateur Messenger ou adresse e-mail", max: 120, required: true, default: "33600000000" },
    { key: "message", kind: "text", label: "Message pré-rempli (facultatif)", max: 200, default: "" },
    { key: "label", kind: "text", label: "Texte du bouton (lu par les lecteurs d'écran, affiché au survol)", max: 40, default: "Nous écrire" },
    { key: "side", kind: "select", label: "Coin de l'écran", options: [["right", "En bas à droite"], ["left", "En bas à gauche"]], default: "right" },
  ],
  validate(p, at) {
    if (p.platform === "whatsapp" || p.platform === "sms") { const n = digits(p.contact); if (n.length < 6 || n.length > 15) throw new Error(`${at} : numéro de 6 à 15 chiffres attendu (avec l'indicatif du pays, sans « + »).`); }
    else if (p.platform === "messenger") { if (!/^[A-Za-z0-9.]{3,60}$/.test(p.contact)) throw new Error(`${at} : nom d'utilisateur Messenger attendu (lettres, chiffres et points).`); }
    else if (!/^[^\s@<>"'`\\]+@[^\s@<>"'`\\]+\.[^\s@<>"'`\\]{2,}$/.test(p.contact)) throw new Error(`${at} : adresse e-mail valide attendue.`);
  },
  data(ctx, p) { return { href: hrefOf(p), name: PLATFORMS[p.platform] || "Contact" }; },
};
