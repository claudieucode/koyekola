// Coloration syntaxique du widget « Code » : un petit analyseur lexical (aucune dépendance, aucun script côté visiteur).
// Le texte est TOUJOURS échappé ; seuls des <span class="kw-tok-…"> générés ici s'y ajoutent. Les langages inconnus ne sont pas colorés.
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const kw = (words) => new RegExp(`\\b(?:${words.join("|")})\\b`, "y");
const STR = /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y;
const NUM = /\b\d+(?:\.\d+)?\b/y;
const FN = /\b[A-Za-z_$][\w$]*(?=\()/y;
const LANGS = {
  js: [["com", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y], ["str", /"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y], ["num", NUM], ["kw", kw(["const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "class", "extends", "new", "import", "export", "from", "default", "async", "await", "try", "catch", "finally", "throw", "switch", "case", "break", "continue", "typeof", "instanceof", "this", "null", "true", "false", "undefined", "of", "in"])], ["fn", FN]],
  json: [["str", /"(?:\\.|[^"\\\n])*"/y], ["num", /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y], ["kw", kw(["true", "false", "null"])]],
  html: [["com", /<!--[\s\S]*?-->/y], ["tag", /<\/?[A-Za-z][\w:-]*|\/?>/y], ["attr", /\b[A-Za-z_:][\w:.-]*(?==)/y], ["str", STR]],
  css: [["com", /\/\*[\s\S]*?\*\//y], ["str", STR], ["num", /-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg)?\b/y], ["kw", /@[\w-]+/y], ["attr", /[a-zA-Z-]+(?=\s*:)/y]],
  bash: [["com", /#[^\n]*/y], ["str", STR], ["kw", kw(["if", "then", "else", "fi", "for", "do", "done", "while", "case", "esac", "function", "in", "export", "echo", "cd", "sudo", "npm", "git"])], ["num", NUM]],
  python: [["com", /#[^\n]*/y], ["str", /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y], ["num", NUM], ["kw", kw(["def", "class", "return", "if", "elif", "else", "for", "while", "in", "import", "from", "as", "try", "except", "finally", "raise", "with", "lambda", "pass", "break", "continue", "None", "True", "False", "and", "or", "not", "is", "yield", "async", "await"])], ["fn", FN]],
  sql: [["com", /--[^\n]*|\/\*[\s\S]*?\*\//y], ["str", /'(?:''|[^'])*'/y], ["num", NUM], ["kw", /\b(?:select|from|where|insert|into|values|update|set|delete|create|table|alter|drop|join|left|right|inner|outer|on|group|by|order|having|limit|offset|and|or|not|null|as|distinct|union|index|primary|key|foreign|references|default)\b/iy]],
  php: [["com", /\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//y], ["str", STR], ["num", NUM], ["kw", kw(["function", "return", "if", "else", "elseif", "foreach", "for", "while", "class", "new", "public", "private", "protected", "static", "echo", "use", "namespace", "try", "catch", "throw", "null", "true", "false", "array", "isset", "empty"])], ["attr", /\$[A-Za-z_]\w*/y], ["fn", FN]],
};
const LABELS = { text: "Texte brut (sans coloration)", js: "JavaScript", json: "JSON", html: "HTML", css: "CSS", bash: "Shell / terminal", python: "Python", sql: "SQL", php: "PHP" };
const MAX = 20000;

function highlight(text, lang) {
  const rules = LANGS[lang];
  const src = String(text || "").slice(0, MAX);
  if (!rules) return esc(src);
  let out = "", plain = "", i = 0;
  const flush = () => { if (plain) { out += esc(plain); plain = ""; } };
  while (i < src.length) {
    let hit = null;
    for (const [cls, re] of rules) { re.lastIndex = i; const m = re.exec(src); if (m && m[0].length) { hit = [cls, m[0]]; break; } }
    if (hit) { flush(); out += `<span class="kw-tok-${hit[0]}">${esc(hit[1])}</span>`; i += hit[1].length; } else { plain += src[i]; i += 1; }
  }
  flush();
  return out;
}
module.exports = { highlight, LABELS, LANGUAGES: Object.keys(LABELS) };
