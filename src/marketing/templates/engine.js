// Moteur de gabarits À GRAMMAIRE FERMÉE. Aucun eval, aucun accès aux objets internes, un seul passage :
// une valeur (nom d'un contact, propriété…) n'est jamais réinterprétée comme du gabarit.
//
//   {{ chemin }}  {{ chemin | filtre }}  {{ chemin | default:"ami" | upper }}
//   {% if condition %} … {% elif condition %} … {% else %} … {% endif %}
//   condition := terme ( "and" terme )* ( "or" … )*      « and » prioritaire sur « or »
//   terme     := [ "not" ] chemin [ ( "==" | "!=" | "contains" ) littéral ]
//
// Sécurité : les chemins doivent figurer dans une liste blanche fournie par l'appelant (refus à la compilation,
// donc AVANT tout envoi) ; seules les propriétés PROPRES du contexte sont lues ; les valeurs sont échappées selon
// le contexte de sortie (html, texte, en-tête) ; taille du gabarit, nombre de balises, profondeur et taille de la
// sortie sont bornés ; le balayage est linéaire (aucune expression régulière sur le texte du gabarit).
const { MarketingError } = require("../errors");

const MAX_SOURCE = 200000;
const MAX_TAGS = 500;
const MAX_TAG_LENGTH = 500;
const MAX_DEPTH = 5;
const MAX_FILTERS = 4;
const MAX_VALUE = 2000;
const DEFAULT_MAX_OUTPUT = 1000000;
const PATH = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){0,3}$/;
const FORBIDDEN = new Set(["constructor", "prototype"]);
const KEYWORDS = new Set(["and", "or", "not", "contains", "true", "false"]);
// Caractères de contrôle (0-31, 127) et séparateurs de ligne Unicode : construits par code pour rester lisibles
const CONTROLS = new RegExp(`[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127, 0x2028, 0x2029)}]+`, "g");

const FILTERS = {
  default: { arg: "string" }, upper: {}, lower: {}, capitalize: {}, title: {}, trim: {}, truncate: { arg: "int" }, number: {}, date: {},
};

const fail = (line, message) => new MarketingError("invalid_template", line ? `${message} (ligne ${line})` : message);

// ---------- Lecture d'un littéral entre guillemets, avec « \ » pour échapper ----------
function readQuoted(text, start, line) {
  const quote = text[start];
  let value = "";
  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\\" && i + 1 < text.length) { value += text[i + 1]; i++; }
    else if (ch === quote) return { value, end: i + 1 };
    else value += ch;
  }
  throw fail(line, "Guillemet non fermé dans une balise");
}

// ---------- Variables : {{ chemin | filtre:arg }} ----------
function checkPath(path, allowed, line) {
  if (!PATH.test(path)) throw fail(line, `Nom de variable invalide « ${path.slice(0, 40)} »`);
  if (path.split(".").some((s) => FORBIDDEN.has(s)) || !allowed(path)) throw fail(line, `Variable inconnue « ${path} »`);
  return path;
}

// Coupe sur « | » en dehors des guillemets
function splitPipes(expr, line) {
  const parts = [];
  let current = "";
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"' || ch === "'") {
      const q = readQuoted(expr, i, line);
      current += expr.slice(i, q.end);
      i = q.end - 1;
    } else if (ch === "|") { parts.push(current); current = ""; }
    else current += ch;
  }
  parts.push(current);
  return parts;
}

function parseFilter(text, line) {
  const raw = text.trim();
  if (!raw) throw fail(line, "Filtre manquant après « | »");
  const colon = raw.indexOf(":");
  const name = (colon < 0 ? raw : raw.slice(0, colon)).trim();
  if (!Object.hasOwn(FILTERS, name)) throw fail(line, `Filtre inconnu « ${name.slice(0, 30)} » (autorisés : ${Object.keys(FILTERS).join(", ")})`);
  const spec = FILTERS[name];
  const argText = colon < 0 ? null : raw.slice(colon + 1).trim();
  if (!spec.arg) {
    if (argText !== null) throw fail(line, `Le filtre « ${name} » n'attend pas d'argument`);
    return { name };
  }
  if (argText === null || argText === "") throw fail(line, `Le filtre « ${name} » demande un argument`);
  if (spec.arg === "int") {
    if (!/^\d{1,4}$/.test(argText) || Number(argText) < 1 || Number(argText) > MAX_VALUE) throw fail(line, `L'argument de « ${name} » doit être un entier entre 1 et ${MAX_VALUE}`);
    return { name, arg: Number(argText) };
  }
  if (argText[0] !== '"' && argText[0] !== "'") throw fail(line, `L'argument de « ${name} » doit être un texte entre guillemets`);
  const q = readQuoted(argText, 0, line);
  if (q.end !== argText.length) throw fail(line, `Texte inattendu après l'argument de « ${name} »`);
  return { name, arg: q.value };
}

function parseVariable(expr, allowed, line) {
  if (!expr.trim()) throw fail(line, "Variable vide dans « {{ }} »");
  const [head, ...rest] = splitPipes(expr, line);
  const path = checkPath(head.trim(), allowed, line);
  if (rest.length > MAX_FILTERS) throw fail(line, `Trop de filtres (${MAX_FILTERS} au plus)`);
  return { t: "var", path, filters: rest.map((f) => parseFilter(f, line)) };
}

// ---------- Conditions ----------
function lexCondition(expr, line) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") { i++; continue; }
    if (ch === '"' || ch === "'") { const q = readQuoted(expr, i, line); tokens.push({ k: "str", v: q.value }); i = q.end; continue; }
    if (ch === "=" && expr[i + 1] === "=") { tokens.push({ k: "op", v: "==" }); i += 2; continue; }
    if (ch === "!" && expr[i + 1] === "=") { tokens.push({ k: "op", v: "!=" }); i += 2; continue; }
    let j = i;
    while (j < expr.length && /[A-Za-z0-9_.-]/.test(expr[j])) j++;
    if (j === i) throw fail(line, `Caractère inattendu « ${ch} » dans la condition`);
    const word = expr.slice(i, j);
    tokens.push(/^-?\d+(\.\d+)?$/.test(word) ? { k: "num", v: Number(word) } : { k: "word", v: word });
    i = j;
  }
  return tokens;
}

function parseCondition(expr, allowed, line) {
  const tokens = lexCondition(expr, line);
  if (!tokens.length) throw fail(line, "Condition manquante après « if »");
  let pos = 0;
  const peek = () => tokens[pos];
  const isWord = (t, w) => t && t.k === "word" && t.v === w;

  function literal(after) {
    const t = tokens[pos++];
    if (!t) throw fail(line, `Valeur manquante après « ${after} »`);
    if (t.k === "str" || t.k === "num") return t.v;
    if (isWord(t, "true")) return true;
    if (isWord(t, "false")) return false;
    throw fail(line, "Après « == », « != » ou « contains », seule une valeur littérale est permise (texte entre guillemets, nombre, true ou false)");
  }
  function term() {
    const t = tokens[pos++];
    if (!t) throw fail(line, "Condition incomplète");
    if (isWord(t, "not")) return { k: "not", item: term() };
    if (t.k !== "word" || KEYWORDS.has(t.v)) throw fail(line, `Condition invalide près de « ${String(t.v).slice(0, 30)} »`);
    const path = checkPath(t.v, allowed, line);
    const next = peek();
    if (next && next.k === "op") { pos++; return { k: "cmp", path, op: next.v === "==" ? "eq" : "ne", value: literal(next.v) }; }
    if (isWord(next, "contains")) { pos++; return { k: "cmp", path, op: "contains", value: literal("contains") }; }
    return { k: "cmp", path, op: "truthy" };
  }
  function andExpr() {
    const items = [term()];
    while (isWord(peek(), "and")) { pos++; if (pos >= tokens.length) throw fail(line, "Condition incomplète après « and »"); items.push(term()); }
    return items.length === 1 ? items[0] : { k: "and", items };
  }
  function orExpr() {
    const items = [andExpr()];
    while (isWord(peek(), "or")) { pos++; if (pos >= tokens.length) throw fail(line, "Condition incomplète après « or »"); items.push(andExpr()); }
    return items.length === 1 ? items[0] : { k: "or", items };
  }
  const result = orExpr();
  if (pos < tokens.length) throw fail(line, `Condition invalide près de « ${String(tokens[pos].v).slice(0, 30)} »`);
  return result;
}

// ---------- Compilation ----------
function compile(source, { allowed = () => false } = {}) {
  if (typeof source !== "string") throw fail(0, "Le gabarit doit être un texte");
  if (source.length > MAX_SOURCE) throw fail(0, `Gabarit trop long (${MAX_SOURCE} caractères au plus)`);

  const root = [];
  const stack = []; // { node, seenElse, line, parent }
  let body = root;
  let tags = 0;
  let line = 1;
  let i = 0;

  const countLines = (text) => { for (let k = 0; k < text.length; k++) if (text.charCodeAt(k) === 10) line++; };

  while (i < source.length) {
    const a = source.indexOf("{{", i);
    const b = source.indexOf("{%", i);
    const start = a < 0 ? b : b < 0 ? a : Math.min(a, b);
    if (start < 0) { body.push({ t: "text", v: source.slice(i) }); break; }
    if (start > i) { const text = source.slice(i, start); body.push({ t: "text", v: text }); countLines(text); }
    const isVar = source.startsWith("{{", start);
    const end = source.indexOf(isVar ? "}}" : "%}", start + 2);
    if (end < 0) throw fail(line, isVar ? "Balise « {{ » non fermée (il manque « }} »)" : "Balise « {% » non fermée (il manque « %} »)");
    const inner = source.slice(start + 2, end);
    if (inner.length > MAX_TAG_LENGTH) throw fail(line, `Balise trop longue (${MAX_TAG_LENGTH} caractères au plus)`);
    if (++tags > MAX_TAGS) throw fail(line, `Trop de balises (${MAX_TAGS} au plus)`);
    const tagLine = line;

    if (isVar) body.push(parseVariable(inner, allowed, tagLine));
    else {
      const trimmed = inner.trim();
      const space = trimmed.search(/\s/);
      const keyword = space < 0 ? trimmed : trimmed.slice(0, space);
      const rest = space < 0 ? "" : trimmed.slice(space + 1).trim();
      if (keyword === "if") {
        if (stack.length >= MAX_DEPTH) throw fail(tagLine, `Conditions imbriquées trop profondes (${MAX_DEPTH} niveaux au plus)`);
        const frame = { node: { t: "if", branches: [{ cond: parseCondition(rest, allowed, tagLine), body: [] }], else: null }, seenElse: false, line: tagLine, parent: body };
        frame.parent.push(frame.node);
        stack.push(frame);
        body = frame.node.branches[0].body;
      } else if (keyword === "elif") {
        const frame = stack[stack.length - 1];
        if (!frame) throw fail(tagLine, "« elif » sans « if » ouvert");
        if (frame.seenElse) throw fail(tagLine, "« elif » impossible après « else »");
        const branch = { cond: parseCondition(rest, allowed, tagLine), body: [] };
        frame.node.branches.push(branch);
        body = branch.body;
      } else if (keyword === "else") {
        const frame = stack[stack.length - 1];
        if (rest) throw fail(tagLine, "« else » n'a pas de condition");
        if (!frame) throw fail(tagLine, "« else » sans « if » ouvert");
        if (frame.seenElse) throw fail(tagLine, "Un seul « else » par condition");
        frame.seenElse = true;
        frame.node.else = [];
        body = frame.node.else;
      } else if (keyword === "endif") {
        if (rest) throw fail(tagLine, "« endif » n'a pas d'argument");
        const frame = stack.pop();
        if (!frame) throw fail(tagLine, "« endif » sans « if » correspondant");
        body = frame.parent;
      } else throw fail(tagLine, `Balise inconnue « ${keyword.slice(0, 30)} » (autorisées : if, elif, else, endif)`);
    }
    countLines(source.slice(start, end + 2));
    i = end + 2;
  }
  if (stack.length) throw fail(stack[stack.length - 1].line, `Il manque « endif » pour le « if » ouvert ligne ${stack[stack.length - 1].line}`);
  return root;
}

// ---------- Rendu ----------
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const stripControls = (s) => s.replace(CONTROLS, " ");

// Lecture prudente : seules les propriétés propres sont suivies ; jamais de prototype
function lookup(context, path) {
  let current = context;
  for (const segment of path.split(".")) {
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, segment)) return undefined;
    current = current[segment];
  }
  return current;
}

const isScalar = (v) => typeof v === "string" || typeof v === "boolean" || (typeof v === "number" && Number.isFinite(v));
const toText = (v) => (isScalar(v) ? String(v) : "");

function truthy(v) {
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "number") return Number.isFinite(v) && v !== 0;
  return v === true;
}

function evalCondition(cond, context) {
  switch (cond.k) {
    case "or": return cond.items.some((c) => evalCondition(c, context));
    case "and": return cond.items.every((c) => evalCondition(c, context));
    case "not": return !evalCondition(cond.item, context);
    default: {
      const v = lookup(context, cond.path);
      if (cond.op === "truthy") return truthy(v);
      const has = isScalar(v);
      if (cond.op === "eq") return has && String(v) === String(cond.value);
      if (cond.op === "ne") return !has || String(v) !== String(cond.value);
      return has && String(v).toLowerCase().includes(String(cond.value).toLowerCase());
    }
  }
}

function applyFilter(text, filter) {
  switch (filter.name) {
    case "default": return text === "" ? filter.arg : text;
    case "upper": return text.toUpperCase();
    case "lower": return text.toLowerCase();
    case "capitalize": return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : text;
    case "title": return text.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_m, sep, letter) => sep + letter.toUpperCase());
    case "trim": return text.trim();
    case "truncate": return text.length > filter.arg ? `${text.slice(0, filter.arg)}…` : text;
    case "number": {
      const n = Number(text.trim().replace(",", "."));
      return text.trim() !== "" && Number.isFinite(n) ? n.toLocaleString("fr-FR") : "";
    }
    case "date": {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
      if (!m) return "";
      const [y, mo, d] = [+m[1], +m[2], +m[3]];
      const date = new Date(Date.UTC(y, mo - 1, d));
      return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d ? `${m[3]}/${m[2]}/${m[1]}` : "";
    }
    default: return text;
  }
}

function render(ast, context, { escape = "html", maxOutput = DEFAULT_MAX_OUTPUT } = {}) {
  const escapeValue = escape === "html" ? escapeHtml : escape === "header" ? stripControls : (s) => s;
  const parts = [];
  let size = 0;
  const push = (s) => {
    size += s.length;
    if (size > maxOutput) throw new MarketingError("invalid_template", "Le message généré dépasse la taille maximale autorisée.");
    parts.push(s);
  };
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.t === "text") push(node.v);
      else if (node.t === "var") {
        let text = toText(lookup(context, node.path)).slice(0, MAX_VALUE);
        for (const f of node.filters) text = applyFilter(text, f);
        push(escapeValue(text.slice(0, MAX_VALUE)));
      } else {
        const branch = node.branches.find((b) => evalCondition(b.cond, context));
        if (branch) walk(branch.body);
        else if (node.else) walk(node.else);
      }
    }
  };
  walk(ast);
  const result = parts.join("");
  return escape === "header" ? stripControls(result) : result;
}

// Compile une condition seule (« contact.country == "FR" ») : sert aux conditions d'affichage d'un bloc
function compileCondition(expr, { allowed = () => false } = {}) {
  if (typeof expr !== "string" || !expr.trim()) throw fail(0, "Condition vide");
  return parseCondition(expr, allowed, 0);
}

const renderString = (source, context, options = {}) => render(compile(source, { allowed: options.allowed }), context, options);

function variablesUsed(ast) {
  const found = new Set();
  const cond = (c) => { if (c.k === "cmp") found.add(c.path); else if (c.k === "not") cond(c.item); else c.items.forEach(cond); };
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.t === "var") found.add(n.path);
      else if (n.t === "if") { n.branches.forEach((b) => { cond(b.cond); walk(b.body); }); if (n.else) walk(n.else); }
    }
  };
  walk(ast);
  return [...found];
}

module.exports = { compile, compileCondition, render, renderString, variablesUsed, MAX_SOURCE, MAX_TAGS, MAX_DEPTH };
