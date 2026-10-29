// Formules mathématiques : un sous-ensemble courant de LaTeX → MathML (présentation), sans dépendance.
// Utilisé par le serveur (rendu public) et par l'éditeur (aperçu). Les navigateurs modernes affichent MathML nativement.
// SÉCURITÉ : la sortie n'est fabriquée que par ce module, avec une liste fermée d'éléments MathML ; tout texte est échappé ; une commande inconnue est affichée
// telle quelle (en texte), jamais interprétée. Aucune balise, aucun attribut n'est repris de la saisie.
// Pris en charge : nombres, lettres, opérateurs, groupes {…}, exposants ^ et indices _, \frac, \sqrt[n]{}, \sum \prod \int \lim avec bornes, lettres grecques,
// opérateurs et relations usuels (\leq \geq \neq \approx \to \Rightarrow \pm \times \cdot \div \infty \partial \nabla…), \text{}, \mathrm \mathbb \mathbf \mathcal,
// \left…\right, \bar \hat \vec \overline \underline, \binom, matrices (matrix, pmatrix, bmatrix, vmatrix, cases), espaces (\, \; \quad \qquad), \ldots \cdots.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const GREEK = { alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ϵ", varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", varpi: "ϖ", rho: "ρ", varrho: "ϱ", sigma: "σ", varsigma: "ς", tau: "τ", upsilon: "υ", phi: "ϕ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω" };
const SYMBOLS = { infty: "∞", partial: "∂", nabla: "∇", forall: "∀", exists: "∃", emptyset: "∅", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", supset: "⊃", cup: "∪", cap: "∩", wedge: "∧", vee: "∨", neg: "¬", ell: "ℓ", hbar: "ℏ", prime: "′", angle: "∠", degree: "°", ldots: "…", cdots: "⋯", vdots: "⋮", ddots: "⋱", dots: "…" };
const OPERATORS = { pm: "±", mp: "∓", times: "×", cdot: "·", div: "÷", ast: "∗", circ: "∘", bullet: "•", oplus: "⊕", otimes: "⊗", leq: "≤", le: "≤", geq: "≥", ge: "≥", neq: "≠", ne: "≠", approx: "≈", equiv: "≡", sim: "∼", simeq: "≃", propto: "∝", ll: "≪", gg: "≫", to: "→", rightarrow: "→", leftarrow: "←", leftrightarrow: "↔", Rightarrow: "⇒", Leftarrow: "⇐", Leftrightarrow: "⇔", mapsto: "↦", uparrow: "↑", downarrow: "↓", implies: "⟹", iff: "⟺", perp: "⊥", parallel: "∥", mid: "∣" };
const BIGOPS = { sum: "∑", prod: "∏", coprod: "∐", int: "∫", iint: "∬", iiint: "∭", oint: "∮", bigcup: "⋃", bigcap: "⋂" };
const FUNCTIONS = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "log", "ln", "lg", "exp", "min", "max", "sup", "inf", "lim", "limsup", "liminf", "det", "dim", "ker", "gcd", "deg", "arg", "mod", "Pr"]);
const SPACES = { ",": "0.1667em", ":": "0.2222em", ";": "0.2778em", quad: "1em", qquad: "2em", " ": "0.25em", "!": "-0.1667em" };
const ACCENTS = { bar: "¯", overline: "¯", hat: "^", widehat: "^", tilde: "~", widetilde: "~", vec: "→", dot: "˙", ddot: "¨", underline: "_" };
const FONTS = { mathbb: { R: "ℝ", N: "ℕ", Z: "ℤ", Q: "ℚ", C: "ℂ", P: "ℙ", H: "ℍ" }, mathcal: null, mathbf: null, mathrm: null, mathit: null, boldsymbol: null, mathsf: null, mathtt: null, mathfrak: null };
const FONT_VARIANTS = { mathbb: "double-struck", mathcal: "script", mathbf: "bold", mathrm: "normal", mathit: "italic", boldsymbol: "bold-italic", mathsf: "sans-serif", mathtt: "monospace", mathfrak: "fraktur" };
const MAX_LATEX = 600;
const MAX_DEPTH = 24;
const DELIMS = { "(": "(", ")": ")", "[": "[", "]": "]", "|": "|", ".": "", "\\{": "{", "\\}": "}", "\\langle": "⟨", "\\rangle": "⟩", "\\|": "‖", "\\lvert": "|", "\\rvert": "|", "\\lceil": "⌈", "\\rceil": "⌉", "\\lfloor": "⌊", "\\rfloor": "⌋" };
const MATRIX_ENVS = { matrix: ["", ""], pmatrix: ["(", ")"], bmatrix: ["[", "]"], Bmatrix: ["{", "}"], vmatrix: ["|", "|"], Vmatrix: ["‖", "‖"], cases: ["{", ""], array: ["", ""], aligned: ["", ""], align: ["", ""], gathered: ["", ""] };

const mi = (t) => `<mi>${esc(t)}</mi>`;
const mn = (t) => `<mn>${esc(t)}</mn>`;
const mo = (t, attrs = "") => `<mo${attrs}>${esc(t)}</mo>`;
const row = (items) => (items.length === 1 ? items[0] : `<mrow>${items.join("")}</mrow>`);

function tokenize(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === "\\") {
      const m = /^\\([A-Za-z]+|.)/s.exec(src.slice(i));
      if (!m) { i += 1; continue; }
      out.push({ t: "cmd", v: m[1] }); i += m[0].length; continue;
    }
    if (/[0-9.]/.test(c)) { const m = /^[0-9]*\.?[0-9]+|^[0-9]+\.?/.exec(src.slice(i)); if (m && m[0]) { out.push({ t: "num", v: m[0] }); i += m[0].length; continue; } }
    if (/[A-Za-z]/.test(c)) { out.push({ t: "id", v: c }); i += 1; continue; }
    out.push({ t: "ch", v: c }); i += 1;
  }
  return out;
}

class Parser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; this.depth = 0; }
  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }
  // Suite d'éléments jusqu'à un marqueur de fin (« } », « \right », « & », « \\ », « \end » ou la fin)
  sequence(stops = []) {
    const items = [];
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.t === "ch" && (t.v === "}" || t.v === "&") && stops.includes(t.v)) break;
      if (t.t === "cmd" && stops.includes(`\\${t.v}`)) break;
      if (t.t === "ch" && t.v === "}") { this.next(); continue; } // accolade fermante orpheline : ignorée
      items.push(this.scripted());
    }
    return items;
  }
  // Un atome suivi de ses exposants et indices
  scripted() {
    let base = this.atom();
    let sub = null, sup = null;
    for (;;) {
      const t = this.peek();
      if (!t || t.t !== "ch" || (t.v !== "^" && t.v !== "_")) break;
      this.next();
      const arg = this.argument();
      if (t.v === "^") sup = arg; else sub = arg;
    }
    if (sub !== null || sup !== null) {
      const big = base.big;
      const baseHtml = base.html;
      if (sub !== null && sup !== null) return { html: `<${big ? "munderover" : "msubsup"}>${baseHtml}${sub}${sup}</${big ? "munderover" : "msubsup"}>` };
      if (sub !== null) return { html: `<${big ? "munder" : "msub"}>${baseHtml}${sub}</${big ? "munder" : "msub"}>` };
      return { html: `<${big ? "mover" : "msup"}>${baseHtml}${sup}</${big ? "mover" : "msup"}>` };
    }
    return base;
  }
  // Argument : un groupe {…} ou le prochain atome
  argument() {
    const t = this.peek();
    if (!t) return "<mrow></mrow>";
    if (t.t === "ch" && t.v === "{") { this.next(); const inner = this.sequence(["}"]); if (this.peek() && this.peek().v === "}") this.next(); return row(inner.map((x) => x.html)) || "<mrow></mrow>"; }
    return this.atom().html;
  }
  optional() {
    const t = this.peek();
    if (t && t.t === "ch" && t.v === "[") {
      this.next();
      const inner = [];
      while (this.peek() && !(this.peek().t === "ch" && this.peek().v === "]")) inner.push(this.scripted());
      if (this.peek()) this.next();
      return row(inner.map((x) => x.html));
    }
    return null;
  }
  group() {
    this.next(); // {
    const inner = this.sequence(["}"]);
    if (this.peek() && this.peek().v === "}") this.next();
    return { html: inner.length ? row(inner.map((x) => x.html)) : "<mrow></mrow>" };
  }
  atom() {
    if (++this.depth > MAX_DEPTH) { this.depth -= 1; const t = this.next(); return { html: t ? mo(t.v) : "" }; }
    try {
      const t = this.next();
      if (!t) return { html: "" };
      if (t.t === "num") return { html: mn(t.v) };
      if (t.t === "id") return { html: mi(t.v) };
      if (t.t === "ch") {
        if (t.v === "{") { this.pos -= 1; return this.group(); }
        if (t.v === "'") return { html: mo("′") };
        if (t.v === "&") return { html: "" };
        if ("+-=<>/|!,;:*()[]".includes(t.v) || t.v === "−") return { html: mo(t.v === "-" ? "−" : t.v, /[()[\]]/.test(t.v) ? "" : "") };
        return { html: `<mtext>${esc(t.v)}</mtext>` };
      }
      return this.command(t.v);
    } finally { this.depth -= 1; }
  }
  command(name) {
    if (GREEK[name]) return { html: mi(GREEK[name]) };
    if (SYMBOLS[name]) return { html: mi(SYMBOLS[name]) };
    if (OPERATORS[name]) return { html: mo(OPERATORS[name]) };
    if (BIGOPS[name]) return { html: mo(BIGOPS[name], ' largeop="true" movablelimits="true"'), big: name !== "int" && name !== "iint" && name !== "iiint" && name !== "oint" };
    if (FUNCTIONS.has(name)) return { html: `<mi mathvariant="normal">${esc(name)}</mi>`, big: name === "lim" || name === "max" || name === "min" || name === "sup" || name === "inf" || name === "limsup" || name === "liminf" };
    if (name in SPACES) return { html: `<mspace width="${SPACES[name]}"></mspace>` };
    if (name === "frac" || name === "dfrac" || name === "tfrac") { const a = this.argument(); const b = this.argument(); return { html: `<mfrac>${a}${b}</mfrac>` }; }
    if (name === "binom") { const a = this.argument(); const b = this.argument(); return { html: `<mrow>${mo("(")}<mfrac linethickness="0">${a}${b}</mfrac>${mo(")")}</mrow>` }; }
    if (name === "sqrt") { const idx = this.optional(); const a = this.argument(); return { html: idx ? `<mroot>${a}${idx}</mroot>` : `<msqrt>${a}</msqrt>` }; }
    if (name === "text" || name === "textrm" || name === "mbox" || name === "operatorname") {
      const t = this.peek();
      if (t && t.t === "ch" && t.v === "{") {
        // texte brut : on reprend les jetons d'origine jusqu'à l'accolade fermante (sans interpréter de commande)
        this.next(); let text = ""; let level = 1;
        while (this.peek()) { const x = this.next(); if (x.t === "ch" && x.v === "{") level += 1; if (x.t === "ch" && x.v === "}") { level -= 1; if (!level) break; } text += x.t === "cmd" ? (x.v === " " ? " " : "") : x.v; }
        return { html: name === "operatorname" ? `<mi mathvariant="normal">${esc(text)}</mi>` : `<mtext>${esc(text)}</mtext>` };
      }
      return { html: this.argument() };
    }
    if (FONT_VARIANTS[name]) {
      const t = this.peek();
      if (name === "mathbb" && t && t.t === "ch" && t.v === "{") { const save = this.pos; this.next(); const x = this.next(); const close = this.peek(); if (x && x.t === "id" && FONTS.mathbb[x.v] && close && close.v === "}") { this.next(); return { html: mi(FONTS.mathbb[x.v]) }; } this.pos = save; }
      const a = this.argument();
      return { html: `<mstyle mathvariant="${FONT_VARIANTS[name]}">${a}</mstyle>` };
    }
    if (ACCENTS[name]) {
      const a = this.argument();
      return name === "underline" ? { html: `<munder>${a}${mo("_")}</munder>` } : { html: `<mover accent="true">${a}${mo(ACCENTS[name])}</mover>` };
    }
    if (name === "overset" || name === "stackrel") { const top = this.argument(); const base = this.argument(); return { html: `<mover>${base}${top}</mover>` }; }
    if (name === "underset") { const bottom = this.argument(); const base = this.argument(); return { html: `<munder>${base}${bottom}</munder>` }; }
    if (name === "left") {
      const open = this.delimiter();
      const inner = this.sequence(["\\right"]);
      let close = "";
      if (this.peek() && this.peek().t === "cmd" && this.peek().v === "right") { this.next(); close = this.delimiter(); }
      return { html: `<mrow>${open ? mo(open, ' stretchy="true"') : ""}${row(inner.map((x) => x.html))}${close ? mo(close, ' stretchy="true"') : ""}</mrow>` };
    }
    if (name === "begin") return this.environment();
    if (name === "{" || name === "}" || name === "%" || name === "$" || name === "#" || name === "_" || name === "&") return { html: mo(name) };
    if (name === "\\") return { html: "" };
    if (name === "limits" || name === "nolimits" || name === "displaystyle" || name === "textstyle" || name === "right" || name === "end") return { html: "" };
    // commande inconnue : son nom est affiché en texte, jamais interprété
    return { html: `<mtext>${esc(`\\${name}`)}</mtext>` };
  }
  delimiter() {
    const t = this.next();
    if (!t) return "";
    const key = t.t === "cmd" ? `\\${t.v}` : t.v;
    return Object.hasOwn(DELIMS, key) ? DELIMS[key] : "";
  }
  environment() {
    let name = "";
    const open = this.next();
    if (open && open.v === "{") { let x = this.next(); while (x && x.v !== "}") { name += x.v; x = this.next(); } }
    name = name.replace(/\*$/, "");
    const style = Object.hasOwn(MATRIX_ENVS, name) ? MATRIX_ENVS[name] : ["", ""];
    // « array » : colonnes {cc} ignorées
    if (name === "array") { const t = this.peek(); if (t && t.v === "{") { this.next(); while (this.peek() && this.peek().v !== "}") this.next(); if (this.peek()) this.next(); } }
    const rows = []; let cells = []; let current = [];
    const endCell = () => { cells.push(current.length ? row(current.map((x) => x.html)) : "<mrow></mrow>"); current = []; };
    const endRow = () => { endCell(); rows.push(cells); cells = []; };
    for (;;) {
      const t = this.peek();
      if (!t) break;
      if (t.t === "cmd" && t.v === "end") { this.next(); if (this.peek() && this.peek().v === "{") { this.next(); while (this.peek() && this.peek().v !== "}") this.next(); if (this.peek()) this.next(); } break; }
      if (t.t === "ch" && t.v === "&") { this.next(); endCell(); continue; }
      if (t.t === "cmd" && t.v === "\\") { this.next(); endRow(); continue; }
      current.push(this.scripted());
    }
    if (current.length || cells.length) endRow();
    const table = `<mtable${name === "cases" || name === "aligned" || name === "align" ? ' columnalign="left"' : ""}>${rows.filter((r) => r.length).map((r) => `<mtr>${r.map((c) => `<mtd>${c}</mtd>`).join("")}</mtr>`).join("")}</mtable>`;
    return { html: `<mrow>${style[0] ? mo(style[0], ' stretchy="true"') : ""}${table}${style[1] ? mo(style[1], ' stretchy="true"') : ""}</mrow>` };
  }
}

// → { ok, mathml, error } ; mathml = élément <math> complet (avec annotation TeX pour les lecteurs d'écran)
function latexToMathML(latex, { display = true } = {}) {
  const src = String(latex == null ? "" : latex).replace(/\s+/g, " ").trim().slice(0, MAX_LATEX);
  if (!src) return { ok: false, mathml: "", error: "Formule vide." };
  const parser = new Parser(tokenize(src));
  const items = [];
  let guard = 0;
  while (parser.peek() && guard++ < 5000) items.push(parser.scripted());
  const body = row(items.map((x) => x.html)) || "<mrow></mrow>";
  const mathml = `<math xmlns="http://www.w3.org/1998/Math/MathML" display="${display ? "block" : "inline"}"><semantics>${body}<annotation encoding="application/x-tex">${esc(src)}</annotation></semantics></math>`;
  return { ok: true, mathml };
}

module.exports = { latexToMathML, MAX_LATEX };
