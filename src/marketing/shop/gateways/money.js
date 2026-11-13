// Conversion centimes ↔ montant « majeur » selon la devise (devises sans décimales : XAF, XOF, JPY…)
const ZERO_DECIMAL = new Set(["xaf", "xof", "jpy", "krw", "vnd", "clp", "ugx", "rwf", "gnf", "kmf", "pyg", "djf", "bif"]);
const toMajor = (cents, currency) => (ZERO_DECIMAL.has(String(currency).toLowerCase()) ? Number(cents) : Number(cents) / 100);
const toMinor = (major, currency) => (ZERO_DECIMAL.has(String(currency).toLowerCase()) ? Math.round(Number(major)) : Math.round(Number(major) * 100));
module.exports = { ZERO_DECIMAL, toMajor, toMinor };
