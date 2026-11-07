// Programme 20.5 — Calculs commerciaux PURS (aucun accès base, aucun navigateur) : remises, taxes, livraison, totaux.
// Tout est en ENTIERS (plus petite unité de la devise). Arrondi : « demi vers le haut » appliqué ligne par ligne, puis les lignes sont additionnées :
// le total est toujours exactement la somme des lignes affichées. Aucun taux fiscal n'est connu ici : les règles viennent de la configuration de la boutique.

const round = (n) => Math.round(n);

// Répartit `amount` entre des parts proportionnelles à `weights` ; la somme des parts vaut EXACTEMENT `amount` (plus grand reste).
function allocate(amount, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  if (!(amount > 0) || total <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (amount * w) / total);
  const base = raw.map(Math.floor);
  let left = amount - base.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; left > 0 && k < order.length; k += 1, left -= 1) base[order[k].i] += 1;
  return base;
}

// Remise d'un coupon sur les lignes éligibles. → montant total de remise (jamais supérieur à la base éligible).
function couponAmount(coupon, eligibleSubtotal) {
  if (!coupon || eligibleSubtotal <= 0) return 0;
  if (coupon.kind === "percent") return Math.min(eligibleSubtotal, round((eligibleSubtotal * coupon.value) / 100));
  return Math.min(eligibleSubtotal, coupon.value);
}

// Règle de taxe applicable à une destination : la plus précise gagne (pays+région > pays > « * »), puis priorité décroissante, puis id.
function pickTaxRule(rules, country, region) {
  const c = String(country || "").toUpperCase();
  const r = String(region || "").trim().toLowerCase();
  const scored = [];
  for (const rule of rules || []) {
    const rc = String(rule.country || "").toUpperCase();
    if (rc !== "*" && rc !== c) continue;
    const rr = String(rule.region || "").trim().toLowerCase();
    if (rr && rr !== r) continue;
    scored.push({ rule, score: (rc === "*" ? 0 : 2) + (rr ? 1 : 0) });
  }
  scored.sort((a, b) => b.score - a.score || (b.rule.priority || 0) - (a.rule.priority || 0) || (a.rule.id || 0) - (b.rule.id || 0));
  return scored.length ? scored[0].rule : null;
}

// Zone de livraison pour un pays : une zone qui LISTE le pays l'emporte sur une zone « tous pays » (liste vide). Aucune zone → pas de livraison possible.
function pickZone(zones, country) {
  const c = String(country || "").toUpperCase();
  const listed = (zones || []).filter((z) => z.countries.length && z.countries.map((x) => String(x).toUpperCase()).includes(c));
  if (listed.length) return listed.sort((a, b) => a.position - b.position || a.id - b.id)[0];
  const all = (zones || []).filter((z) => !z.countries.length);
  return all.length ? all.sort((a, b) => a.position - b.position || a.id - b.id)[0] : null;
}

// Méthodes proposables pour une zone, un sous-total (après remise) et un poids. → [{ id, name, kind, costCents }]
function shippingOptions(methods, { subtotalCents, weightGrams }) {
  const out = [];
  for (const m of methods || []) {
    if (!m.active) continue;
    if (m.kind !== "free_over" && m.min_subtotal_cents != null && subtotalCents < m.min_subtotal_cents) continue;
    if (m.min_weight_grams != null && weightGrams < m.min_weight_grams) continue;
    if (m.max_weight_grams != null && weightGrams > m.max_weight_grams) continue;
    let cost = m.cost_cents;
    // « Gratuite dès X » n'est proposée QUE lorsque le seuil est atteint (sous le seuil, c'est une autre méthode qui s'applique).
    if (m.kind === "free_over") { if (m.min_subtotal_cents == null || subtotalCents < m.min_subtotal_cents) continue; cost = 0; }
    out.push({ id: m.id, name: m.name, kind: m.kind, costCents: cost, requiresSlot: m.requires_slot === 1 });
  }
  return out.sort((a, b) => a.costCents - b.costCents || a.id - b.id);
}

// Totaux d'une commande.
//  lines : [{ key, unitCents, quantity }]            (prix serveur, jamais ceux du navigateur)
//  discount : { amountCents, eligibleKeys:Set|null } (null = toutes les lignes)
//  shippingCents : frais de port déjà décidés
//  tax : { enabled, includesTax, lineRuleBp, shippingRuleBp, ruleName, shippingRuleName }
// → { lines:[{ key, subtotal, discount, net, tax }], subtotal, discount, shipping, shippingTax, tax, total, taxLines }
function computeTotals({ lines, discount, shippingCents = 0, tax }) {
  const t = tax || { enabled: false };
  const sub = lines.map((l) => l.unitCents * l.quantity);
  const subtotal = sub.reduce((a, b) => a + b, 0);

  const eligible = discount && discount.eligibleKeys ? lines.map((l) => discount.eligibleKeys.has(l.key)) : lines.map(() => true);
  const eligibleBase = sub.map((s, i) => (eligible[i] ? s : 0));
  const wanted = discount ? Math.min(discount.amountCents || 0, eligibleBase.reduce((a, b) => a + b, 0)) : 0;
  const shares = allocate(wanted, eligibleBase);

  const rate = t.enabled ? t.lineRuleBp || 0 : 0;
  const taxBuckets = new Map();
  const addTax = (label, bp, amount) => {
    if (!amount) return;
    const k = `${label}|${bp}`;
    const cur = taxBuckets.get(k) || { name: label, rateBp: bp, amountCents: 0 };
    cur.amountCents += amount;
    taxBuckets.set(k, cur);
  };

  const outLines = lines.map((l, i) => {
    const net = sub[i] - shares[i];
    const lineTax = !rate ? 0 : t.includesTax ? round((net * rate) / (10000 + rate)) : round((net * rate) / 10000);
    addTax(t.ruleName || "Taxe", rate, lineTax);
    return { key: l.key, subtotal: sub[i], discount: shares[i], net, tax: lineTax };
  });

  const shipRate = t.enabled ? t.shippingRuleBp || 0 : 0;
  const shippingTax = !shipRate ? 0 : t.includesTax ? round((shippingCents * shipRate) / (10000 + shipRate)) : round((shippingCents * shipRate) / 10000);
  addTax(t.shippingRuleName || t.ruleName || "Taxe", shipRate, shippingTax);

  const netSum = outLines.reduce((a, l) => a + l.net, 0);
  const taxSum = outLines.reduce((a, l) => a + l.tax, 0) + shippingTax;
  const total = t.includesTax || !t.enabled ? netSum + shippingCents : netSum + shippingCents + taxSum;
  return {
    lines: outLines,
    subtotal,
    discount: shares.reduce((a, b) => a + b, 0),
    shipping: shippingCents,
    shippingTax,
    tax: taxSum,
    total,
    taxLines: [...taxBuckets.values()],
  };
}

module.exports = { allocate, couponAmount, pickTaxRule, pickZone, shippingOptions, computeTotals };
