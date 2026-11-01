// Boutons de paiement (comme « Stripe Button » et « PayPal Button » d'Elementor) : un bouton qui ouvre une page de paiement HÉBERGÉE par Stripe ou PayPal
// (lien de paiement Stripe, PayPal.me, bouton hébergé PayPal). DIFFÉRENCE ASSUMÉE avec Elementor : aucune clé API n'est stockée et aucun script externe n'est chargé ;
// le paiement, la facture et le remboursement restent chez le prestataire. L'adresse est vérifiée ICI contre une liste blanche de domaines : jamais un lien libre déguisé en paiement.
const STRIPE_HOSTS = new Set(["buy.stripe.com", "checkout.stripe.com", "donate.stripe.com", "billing.stripe.com"]);
const PAYPAL_HOSTS = new Set(["www.paypal.com", "paypal.com", "paypal.me", "www.paypal.me"]);
// Pages PayPal acceptées sur paypal.com (paypal.me accepte tout chemin : c'est un nom d'utilisateur)
const PAYPAL_PATHS = /^\/(donate|ncp\/|invoice\/|paypalme\/|cgi-bin\/webscr|checkoutnow|webapps\/hermes|billing\/subscriptions)/;
function parse(raw) { try { const u = new URL(String(raw || "")); return u.protocol === "https:" && !u.username && !u.password ? u : null; } catch { return null; } }
const SIZES = [["sm", "Petit"], ["md", "Moyen"], ["lg", "Grand"]];
const ALIGNS = [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]];
const common = (note, label) => [
  { key: "label", kind: "text", label: "Texte du bouton", max: 40, required: true, default: label },
  { key: "size", kind: "select", label: "Taille", options: SIZES, default: "md" },
  { key: "align", kind: "select", label: "Alignement", options: ALIGNS, default: "left" },
  { key: "fullWidth", kind: "bool", label: "Bouton sur toute la largeur", default: false },
  { key: "showIcon", kind: "bool", label: "Afficher le cadenas (paiement sécurisé)", default: true },
  { key: "note", kind: "text", label: "Mention sous le bouton (vide = aucune)", max: 120, default: note },
  { key: "newTab", kind: "bool", label: "Ouvrir dans un nouvel onglet", default: true },
];
module.exports = [
  {
    type: "stripebutton", label: "Bouton Stripe", group: "commerce", icon: "lock", version: 1, style: "box", status: "operational",
    description: "Bouton vers un lien de paiement Stripe (paiement hébergé par Stripe)",
    keywords: "stripe paiement payer carte bancaire lien de paiement acheter don abonnement bouton Stripe Button",
    schema: [{ key: "link", kind: "text", label: "Lien de paiement Stripe (https://buy.stripe.com/…)", max: 500, required: true, default: "https://buy.stripe.com/exemple" }, ...common("Paiement sécurisé par Stripe", "Payer maintenant")],
    validate(p, at) {
      const u = parse(p.link);
      if (!u || !STRIPE_HOSTS.has(u.hostname) || u.pathname.length < 2) throw new Error(`${at} : lien de paiement Stripe attendu (https://buy.stripe.com/…, checkout.stripe.com, donate.stripe.com ou billing.stripe.com).`);
    },
    data(ctx, p) { return { href: parse(p.link).href, brand: "stripe", brandName: "Stripe" }; },
  },
  {
    type: "paypalbutton", label: "Bouton PayPal", group: "commerce", icon: "lock", version: 1, style: "box", status: "operational",
    description: "Bouton vers PayPal.me, un don ou un bouton hébergé PayPal",
    keywords: "paypal paiement payer don donner abonnement acheter bouton PayPal Button paypal.me",
    schema: [{ key: "link", kind: "text", label: "Lien PayPal (https://paypal.me/… ou page PayPal de paiement ou de don)", max: 500, required: true, default: "https://paypal.me/exemple" }, ...common("Paiement sécurisé par PayPal", "Payer avec PayPal")],
    validate(p, at) {
      const u = parse(p.link);
      const ok = u && PAYPAL_HOSTS.has(u.hostname) && (u.hostname.endsWith("paypal.me") ? u.pathname.length > 1 : PAYPAL_PATHS.test(u.pathname));
      if (!ok) throw new Error(`${at} : lien PayPal attendu (https://paypal.me/nom, ou une page PayPal de paiement, de don ou de facture).`);
    },
    data(ctx, p) { return { href: parse(p.link).href, brand: "paypal", brandName: "PayPal" }; },
  },
];
