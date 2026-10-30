// Store Configuration Assistant : marchés, devise, paiements, livraison, taxes, informations commerciales.
// RÈGLE : l'assistant PRÉPARE et guide ; il n'invente JAMAIS une valeur commerciale. Un tarif de livraison, un délai, un taux de taxe, une devise, un moyen de paiement ne sont écrits dans le moteur
// que s'ils ont été saisis par la personne (« items » explicites). Les clés de paiement ne passent JAMAIS par ce module ni par l'IA : elles sont des variables du serveur.
// Aucun fournisseur n'est activé sans configuration : « stripe » n'est accepté que si le serveur a ses clés ; l'ouverture de la boutique n'est pas faite ici.
const { MarketingError } = require("../../errors");
const caps = require("./capabilities");
const store = () => require("../../shop/store");
const { COUNTRIES } = require("./analyzer");

const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const iso2 = (c) => { const v = String(c || "").trim().toUpperCase(); if (!/^[A-Z]{2}$/.test(v)) throw bad(`Code pays invalide : « ${String(c).slice(0, 12)} » (deux lettres, ex. CD).`); return v; };

// État de la configuration : ce que le moteur contient, ce qui manque, ce que la personne a préparé
function state(ctx, siteId, proposal = {}) {
  const s = { db: ctx.db, organizationId: ctx.organizationId, siteId };
  const settings = store().getSettings(s), zones = store().listZones(s), tax = store().listTaxRules(s);
  const c = caps.forSite(ctx, siteId);
  const markets = (proposal.markets || []).map((m) => ({ code: m, name: (COUNTRIES.find((x) => x[0] === m) || [m, m])[1] }));
  return {
    engine: { currency: String(settings.currency).toUpperCase(), defaultCountry: settings.default_country, paymentMethods: settings.payment_methods, pricesIncludeTax: Boolean(settings.prices_include_tax), taxEnabled: Boolean(settings.tax_enabled), shopOpen: Boolean(settings.enabled), notifyEmail: settings.notify_email || "", manualInstructions: settings.manual_instructions || "", guestCheckout: Boolean(settings.guest_checkout), lowStockThreshold: settings.low_stock_threshold },
    zones: zones.map((z) => ({ id: z.id, name: z.name, countries: z.countries, methods: (z.methods || []).map((m) => ({ id: m.id, name: m.name, kind: m.kind, costCents: m.cost_cents })) })),
    taxRules: tax.map((t) => ({ id: t.id, name: t.name, country: t.country, rateBp: t.rate_bp })),
    capabilities: { paymentProviders: c.paymentProviders, currency: c.currency, commerceModule: c.commerceModule, absent: c.absent },
    markets, proposal,
    todo: todo(settings, zones, tax, proposal, c),
  };
}
// Ce qu'il reste à renseigner : jamais une valeur proposée
function todo(settings, zones, tax, proposal, c) {
  const t = [];
  if (!c.commerceModule) t.push({ key: "module", level: "blocking", message: "Le module « Commerce » n'est pas activé pour ce site (réglé par l'équipe, Modules du site)." });
  if (!settings.payment_methods.length) t.push({ key: "payments", level: "blocking", message: "Aucun moyen de paiement activé." });
  else if (!c.paymentProviders.some((p) => p.usable)) t.push({ key: "payments", level: "blocking", message: "Les moyens de paiement activés ne sont pas utilisables (clés du serveur manquantes pour la carte bancaire)." });
  if (!zones.length) t.push({ key: "shipping", level: "warning", message: "Aucune zone de livraison : un produit physique ne pourra pas être livré. Saisissez vos zones et vos tarifs (aucun tarif n'est proposé)." });
  else if (zones.some((z) => !(z.methods || []).length)) t.push({ key: "shipping", level: "warning", message: "Une zone de livraison n'a aucune méthode." });
  if (settings.tax_enabled && !tax.length) t.push({ key: "tax", level: "blocking", message: "Les taxes sont activées mais aucune règle n'existe. Saisissez le taux applicable (à faire valider par un professionnel)." });
  if (!settings.tax_enabled) t.push({ key: "tax", level: "info", message: "Taxes désactivées : à confirmer selon la réglementation de votre pays (aucun avis fiscal n'est donné)." });
  if (!settings.default_country) t.push({ key: "country", level: "warning", message: "Pays par défaut non défini." });
  if (c.currency.current !== "EUR") t.push({ key: "currency", level: "warning", message: `Devise ${c.currency.current} : seul l'euro est testé dans le moteur.` });
  if (!settings.notify_email) t.push({ key: "notify", level: "info", message: "Adresse de notification des commandes non renseignée." });
  return t;
}
// Applique UNIQUEMENT ce que la personne a saisi. items : { currency?, defaultCountry?, paymentMethods?, taxEnabled?, pricesIncludeTax?, notifyEmail?, manualInstructions?, zones?: [{name, countries[], methods:[{name, kind, costCents, minSubtotalCents}]}], taxRules?: [{name, country, rateBp}] }
function apply(ctx, siteId, items = {}) {
  const s = { db: ctx.db, organizationId: ctx.organizationId, siteId };
  const done = [], refused = [];
  const set = {};
  if (items.currency !== undefined) { const c = String(items.currency).toLowerCase(); if (!/^[a-z]{3}$/.test(c)) throw bad("Devise : code à trois lettres (ex. eur)."); set.currency = c; }
  if (items.defaultCountry !== undefined) set.default_country = items.defaultCountry === "" ? "" : iso2(items.defaultCountry);
  if (items.taxEnabled !== undefined) set.tax_enabled = items.taxEnabled ? 1 : 0;
  if (items.pricesIncludeTax !== undefined) set.prices_include_tax = items.pricesIncludeTax ? 1 : 0;
  if (items.notifyEmail !== undefined) set.notify_email = String(items.notifyEmail);
  if (items.manualInstructions !== undefined) set.manual_instructions = String(items.manualInstructions).slice(0, 2000);
  if (items.paymentMethods !== undefined) {
    const providers = caps.paymentProviders(s); const ok = [];
    for (const m of [].concat(items.paymentMethods)) {
      const p = providers.find((x) => x.id === m);
      if (!p) refused.push({ item: `paiement ${String(m).slice(0, 20)}`, reason: "Moyen de paiement inconnu." });
      else if (!p.configuredOnServer) refused.push({ item: `paiement ${p.id}`, reason: "Non configuré sur le serveur (clés manquantes) : non activé. Les clés se saisissent dans la configuration du serveur, jamais ici." });
      else ok.push(p.id);
    }
    set.payment_methods = ok;
  }
  if (Object.keys(set).length) { store().saveSettings(s, set); done.push(...Object.keys(set).map((k) => `réglage ${k}`)); }
  for (const z of items.zones || []) {
    const zid = store().saveZone(s, { name: z.name, countries: z.countries }); done.push(`zone ${z.name}`);
    for (const m of z.methods || []) {
      if (m.costCents === undefined || m.costCents === null) { refused.push({ item: `méthode ${m.name}`, reason: "Tarif non saisi : aucun tarif n'est inventé." }); continue; }
      store().saveMethod(s, zid, { name: m.name, kind: m.kind || "flat", cost_cents: m.costCents, min_subtotal_cents: m.minSubtotalCents }); done.push(`méthode ${m.name}`);
    }
  }
  for (const t of items.taxRules || []) { if (t.rateBp === undefined || t.rateBp === null || t.rateBp === "") { refused.push({ item: `taxe ${t.name}`, reason: "Taux non saisi : aucun taux n'est proposé." }); continue; } store().saveTaxRule(s, { name: t.name, country: t.country, rate_bp: t.rateBp }); done.push(`taxe ${t.name}`); }
  return { done, refused };
}
module.exports = { state, apply, todo };
