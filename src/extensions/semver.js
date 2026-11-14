// Versions « majeur.mineur.correctif » et plages simples (>=, >, <=, <, ^, ~, =, exacte, jokers) : assez pour la compatibilité des extensions, sans dépendance.
const RE = /^(\d{1,6})\.(\d{1,6})\.(\d{1,6})$/;
const parse = (v) => { const m = RE.exec(String(v)); return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null; };
const valid = (v) => parse(v) !== null;
function compare(a, b) {
  const x = parse(a), y = parse(b);
  if (!x || !y) throw new Error(`Version invalide : ${!x ? a : b}`);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}
// Une plage = une ou plusieurs conditions séparées par des espaces (toutes doivent être vraies).
function satisfies(version, range) {
  if (!valid(version) || typeof range !== "string" || !range.trim()) return false;
  const [maj, min] = parse(version);
  return range.trim().split(/\s+/).every((cond) => {
    let m;
    if (cond === "*") return true;
    if ((m = /^\^(\d+\.\d+\.\d+)$/.exec(cond))) { const [a] = parse(m[1]); return compare(version, m[1]) >= 0 && maj === a; }
    if ((m = /^~(\d+\.\d+\.\d+)$/.exec(cond))) { const [a, b] = parse(m[1]); return compare(version, m[1]) >= 0 && maj === a && min === b; }
    if ((m = /^(>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/.exec(cond))) {
      const c = compare(version, m[2]);
      return { ">=": c >= 0, "<=": c <= 0, ">": c > 0, "<": c < 0, "=": c === 0, undefined: c === 0 }[m[1]];
    }
    return false;
  });
}
const validRange = (range) => typeof range === "string" && range.trim() !== "" && range.trim().split(/\s+/).every((c) => c === "*" || /^(\^|~|>=|<=|>|<|=)?\d+\.\d+\.\d+$/.test(c));
module.exports = { parse, valid, compare, satisfies, validRange };
