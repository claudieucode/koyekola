// Contrat entre l'écran et l'API : CHAQUE appel `api("MÉTHODE", "/chemin…")` écrit dans public/js/mailchimp*.js doit correspondre à une route réelle (même méthode) et n'utiliser que des
// paramètres de requête acceptés par l'opération du catalogue. Une dérive (route renommée, paramètre retiré) échoue ici, même si le parcours n'est pas joué dans le navigateur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { OPS } = require("../src/marketing/mailchimp/catalog");
const tx = require("../src/marketing/mailchimp/transactional");

const ROOT = path.join(__dirname, "..");
const FILES = ["mailchimp.js", "mailchimp-a.js", "mailchimp-b.js", "mailchimp-c.js"];

// ---- routes connues : catalogue + routes écrites à la main dans web/mailchimp.js ----
const rx = (route) => new RegExp(`^${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\:[A-Za-z]+/g, "[^/]+").replace(/:[A-Za-z]+/g, "[^/]+")}$`);
const routes = OPS.map((o) => ({ method: o.method, re: rx(o.route), op: o, label: o.id }));
const server = fs.readFileSync(path.join(ROOT, "src", "marketing", "web", "mailchimp.js"), "utf8");
for (const m of server.matchAll(/router\.(get|post|put|delete|patch)\(`\$\{P\}([^`]+)`/g)) routes.push({ method: m[1].toUpperCase(), re: rx(m[2]), op: null, label: `${m[1]} ${m[2]}` });
routes.push({ method: "POST", re: rx("/transactionnel/:op"), op: null, label: "transactionnel" });

// ---- mini-évaluateur d'expressions de chemin ----
function splitTop(text, sep) {
  const out = []; let depth = 0, cur = "", str = null;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (str) { cur += c; if (c === "\\") { cur += text[++i]; } else if (c === str) str = null; continue; }
    if (c === '"' || c === "'") { str = c; cur += c; continue; }
    if ("([{".includes(c)) depth++; if (")]}".includes(c)) depth--;
    if (c === sep && depth === 0) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}
function balanced(text, start) { // texte entre la parenthèse ouvrante à `start` et sa fermante
  let depth = 0, str = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (str) { if (c === "\\") i++; else if (c === str) str = null; continue; }
    if (c === '"' || c === "'") { str = c; continue; }
    if (c === "(") depth++; if (c === ")" && --depth === 0) return text.slice(start + 1, i);
  }
  return null;
}
// Évalue une expression de chemin ; renvoie la liste des chemins possibles (une condition « a ? b : c » en donne deux)
function evalPath(expr, vars) {
  let acc = [""];
  for (const tok0 of splitTop(expr, "+")) {
    let tok = tok0, alts;
    while (tok.startsWith("(") && balanced(tok, 0) === tok.slice(1, -1)) tok = tok.slice(1, -1).trim();
    const cond = splitTop(tok, "?");
    if (cond.length === 2 && !tok.startsWith("q(")) { const branches = splitTop(cond[1], ":"); alts = branches.flatMap((b) => evalPath(b, vars)); }
    else if (/^"([^"\\]|\\.)*"$/.test(tok) || /^'([^'\\]|\\.)*'$/.test(tok)) alts = [tok.slice(1, -1)];
    else if (tok.startsWith("q(")) { const keys = [...tok.matchAll(/([A-Za-z_]+)\s*:/g)].map((m) => m[1]); alts = [keys.length ? `?${keys.map((k) => `${k}=X`).join("&")}` : ""]; }
    else if (/^[A-Za-z_$][\w$]*$/.test(tok) && vars[tok] !== undefined) alts = [vars[tok]];
    else { const call = /^([A-Za-z_$][\w$]*)\(.*\)$/.exec(tok); alts = [call && vars[`${call[1]}()`] !== undefined ? vars[`${call[1]}()`] : "X"]; }
    acc = acc.flatMap((a) => alts.map((b) => a + b));
  }
  return acc;
}

function callsOf(file) {
  const text = fs.readFileSync(path.join(ROOT, "public", "js", file), "utf8");
  const vars = {}, calls = [];
  const re = /(\bvar\s+(base)\s*=\s*([^;]+);)|(\bvar\s+(path)\s*=\s*function\s*\(e\)\s*\{\s*return\s+([^;]+);\s*\};)|(\bapi\()|(\btx\()|(\bdel\()/g;
  let m;
  const lineOf = (i) => text.slice(0, i).split("\n").length;
  while ((m = re.exec(text))) {
    if (m[1]) { vars[m[2]] = evalPath(m[3], vars)[0]; continue; }
    if (m[4]) { vars["path()"] = evalPath(m[6], vars)[0]; continue; }
    if (m[8]) { // tx("op") : uniquement dans mailchimp-c.js (ailleurs, « tx » est un utilitaire local de formulaire)
      if (file !== "mailchimp-c.js") continue;
      const args = splitTop(balanced(text, m.index + 2) || "", ",");
      const op = /^"([^"]+)"$/.exec(args[0]); calls.push({ file, kind: "tx", op: op && op[1], line: lineOf(m.index) }); continue;
    }
    if (m[9]) { // del(titre, texte, chemin, …) : suppression
      const args = splitTop(balanced(text, m.index + 3) || "", ",");
      if (args.length >= 3 && !/^function|^var/.test(args[0])) for (const p of evalPath(args[2], vars)) calls.push({ file, kind: "api", method: "DELETE", path: p, line: lineOf(m.index) });
      continue;
    }
    const args = splitTop(balanced(text, m.index + 3) || "", ",");
    const method = /^"(GET|POST|PUT|PATCH|DELETE)"$/.exec(args[0] || "");
    if (!method || !args[1]) continue; // définition `async function api(method, path…)` ou appel interne
    for (const p of evalPath(args[1], vars)) if (!/^X([?&]|$)/.test(p)) calls.push({ file, kind: "api", method: method[1], path: p, line: lineOf(m.index) });
  }
  return calls;
}

describe("contrat écran ↔ API Mailchimp", () => {
  const all = FILES.flatMap(callsOf);
  test("l'analyse trouve les appels de l'écran (garde-fou contre une analyse qui ne verrait plus rien)", () => {
    assert.ok(all.filter((c) => c.kind === "api").length >= 120, `${all.length} appels trouvés`);
    assert.ok(all.filter((c) => c.kind === "tx").length >= 10);
  });
  test("chaque appel api(…) vise une route existante avec la bonne méthode et des paramètres de requête acceptés", () => {
    const problems = [];
    for (const c of all.filter((x) => x.kind === "api")) {
      const [p, query = ""] = c.path.split("?");
      const hit = routes.find((r) => r.method === c.method && r.re.test(p));
      if (!hit) { problems.push(`${c.file}:${c.line} ${c.method} ${c.path} → aucune route`); continue; }
      if (hit.op) for (const part of query.split("&").filter(Boolean)) { const key = part.split("=")[0]; if (key !== "confirm" && !hit.op.query.includes(key)) problems.push(`${c.file}:${c.line} ${hit.op.id} : paramètre « ${key} » non accepté`); }
    }
    assert.deepEqual(problems, []);
  });
  test("chaque opération Transactionnel appelée par l'écran existe", () => {
    const ops = new Set(Object.keys(tx.OPS));
    const bad = all.filter((c) => c.kind === "tx" && c.op && !ops.has(c.op)).map((c) => `${c.file}:${c.line} ${c.op}`);
    assert.deepEqual(bad, []);
  });
});
