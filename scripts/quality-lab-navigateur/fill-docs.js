// Programme 22.1 — Remplace les marqueurs <!--TABLE:<début du titre>--><!--/TABLE--> des documents par les tableaux calculés par summarize.js (les chiffres des rapports viennent donc des mesures, pas de la main).
//   node scripts/quality-lab-navigateur/fill-docs.js
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.join(__dirname, "..", "..");
const md = execFileSync(process.execPath, [path.join(__dirname, "summarize.js")], { encoding: "utf8" });
const blocks = md.split(/^### /m).slice(1).map((b) => { const i = b.indexOf("\n"); return { title: b.slice(0, i).trim(), body: b.slice(i + 1).trim() }; });
const docs = fs.readdirSync(path.join(root, "docs")).filter((f) => /^KOLAKISA_PROGRAMME22_1B_/.test(f));
let n = 0;
for (const f of docs) {
  const p = path.join(root, "docs", f); let t = fs.readFileSync(p, "utf8"); const before = t;
  t = t.replace(/<!--TABLE:([^>]+?)-->[\s\S]*?<!--\/TABLE-->/g, (m, key) => { const b = blocks.find((x) => x.title.startsWith(key.trim())); if (!b) throw new Error(`${f} : tableau introuvable « ${key} »`); n += 1; return `<!--TABLE:${key}-->\n${b.body}\n<!--/TABLE-->`; });
  if (t !== before) fs.writeFileSync(p, t);
}
console.log(`${n} tableau(x) inséré(s)`);
