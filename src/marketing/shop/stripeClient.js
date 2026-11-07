// Client Stripe de la boutique, INJECTABLE. Par défaut il réutilise le client du serveur (src/services/payments.js : clés Stripe du serveur, jamais envoyées au navigateur).
// Les tests peuvent le remplacer (setClient) ou, comme les autres tests de paiement, pointer STRIPE_API_BASE vers un faux serveur Stripe local.
const gateway = require("../../services/payments");

let injected = null;
// request(method, path, params) → objet JSON de Stripe ; lève une Error si Stripe refuse.
const request = (method, path, params) => (injected || gateway.stripeRequest)(method, path, params);
const setClient = (fn) => { injected = typeof fn === "function" ? fn : null; };
// Vrai si les clés Stripe du serveur sont posées ET le secret de webhook aussi (sans lui, aucune confirmation n'arriverait).
const configured = () => gateway.stripeEnabled() && Boolean(process.env.STRIPE_WEBHOOK_SECRET);

module.exports = { request, setClient, configured, MIN_AMOUNT_CENTS: gateway.MIN_AMOUNT_CENTS };
