#!/usr/bin/env node
// Planche de contrôle des identités graphiques des modèles « Page individuelle » : une pastille par modèle (fond, titre, texte, accent, bouton) pour repérer à l'œil les palettes peu harmonieuses.
// Usage : KW_SINGLE_PAGE_V2=1 node scripts/planche-identites.js sortie.html
const os = require("os"), fs = require("fs"), path = require("path");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "planche-"));
const Catalog = require("../src/themeBuilder/catalog"), fonts = require("../src/utils/fontLibrary");
const skins = require("../src/themeBuilder/catalog/single_page").skins;
const rows = Catalog.entries("single_page").map((e) => { const s = skins.find((x) => x.key === e.skinKey); return `<div class="c" style="background:${s.bg};color:${s.fg}"><b style="font-family:${fonts.stackOf(s.head)};font-size:20px">${e.name}</b><span style="font-family:${fonts.stackOf(s.font)};color:${s.mute}">Texte courant lisible, ${s.head.replace("font.", "")} + ${s.font.replace("font.", "")}</span><i style="background:${s.accent};color:${s.onAccent}">Bouton</i><u style="background:${s.alt};border-color:${s.line}">${e.key.split(".")[0]}</u></div>`; });
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#888;font:13px system-ui}.g{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:6px}.c{padding:12px;min-height:96px;display:flex;flex-direction:column;gap:6px;border-radius:6px}i{font-style:normal;padding:5px 10px;border-radius:5px;width:max-content;font-weight:700}u{text-decoration:none;font-size:11px;padding:2px 6px;border:1px solid;width:max-content}</style><div class="g">${rows.join("")}</div>`;
fs.writeFileSync(process.argv[2] || "planche.html", html); console.log(rows.length, "identités");
