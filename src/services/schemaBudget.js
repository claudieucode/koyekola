// Budget de complexité des schémas JSON envoyés à Anthropic (sortie structurée, `output_config.format`).
// Anthropic compile chaque schéma en grammaire avant de répondre ; un schéma trop gros est refusé en 400
// (« The compiled grammar is too large »). La limite exacte n'est pas publiée : les seuils ci-dessous sont des
// garde-fous EMPIRIQUES de Kolakisa, choisis sous la complexité du schéma qui a été refusé. Ils servent à détecter
// le problème AVANT l'appel (message clair, rien d'envoyé), pas à garantir l'acceptation par Anthropic.

// Mesure un schéma : nombre d'objets, de propriétés, d'énumérations (et de valeurs), profondeur, octets.
function measure(schema) {
  const m = { bytes: 0, objects: 0, properties: 0, enums: 0, enumValues: 0, arrays: 0, depth: 0 };
  const walk = (node, depth) => {
    if (!node || typeof node !== "object") return;
    m.depth = Math.max(m.depth, depth);
    if (Array.isArray(node.enum)) { m.enums += 1; m.enumValues += node.enum.length; }
    if (node.type === "array") { m.arrays += 1; walk(node.items, depth + 1); }
    if (node.type === "object" || node.properties) {
      m.objects += 1;
      for (const v of Object.values(node.properties || {})) { m.properties += 1; walk(v, depth + 1); }
    }
    for (const k of ["anyOf", "oneOf", "allOf"]) if (Array.isArray(node[k])) node[k].forEach((n) => walk(n, depth + 1));
    for (const v of Object.values(node.$defs || {})) walk(v, depth + 1);
  };
  walk(schema, 0);
  m.bytes = JSON.stringify(schema).length;
  return m;
}

// Seuils (voir l'en-tête). Le schéma d'analyse refusé par Anthropic comptait 19 objets, 17 énumérations (≈ 80 valeurs).
const LIMITS = Object.freeze({ objects: 14, enumValues: 60, properties: 80, depth: 7, bytes: 9000 });

// Liste des dépassements (vide = dans le budget).
function exceeded(m, limits = LIMITS) {
  return Object.keys(limits).filter((k) => m[k] > limits[k]).map((k) => `${k} ${m[k]} > ${limits[k]}`);
}

module.exports = { measure, exceeded, LIMITS };
