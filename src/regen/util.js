const crypto = require("node:crypto");
const zlib = require("node:zlib");
const { MarketingError } = require("../marketing/errors");
const bad = (m, code = "invalid_field") => new MarketingError(code, m);
// JSON canonique (clés triées) : deux états identiques ont la même empreinte, quel que soit l'ordre des propriétés
function canon(v) { if (Array.isArray(v)) return v.map(canon); if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon(v[k])])); return v; }
const fp = (v) => crypto.createHash("sha1").update(JSON.stringify(canon(v === undefined ? null : v))).digest("hex");
const pack = (v) => zlib.gzipSync(Buffer.from(JSON.stringify(v))).toString("base64");
const unpack = (s) => JSON.parse(zlib.gunzipSync(Buffer.from(String(s), "base64")).toString("utf8"));
const clone = (v) => JSON.parse(JSON.stringify(v));
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
// Parcours des éléments (arbre d'une section libre)
function walkNodes(list, fn, parent = null) { for (const n of Array.isArray(list) ? list : []) { fn(n, parent); walkNodes(n.children, fn, n); } }
function findNode(sections, nodeId) { let out = null; for (const s of sections) walkNodes(s.children, (n, parent) => { if (!out && String(n.id) === String(nodeId)) out = { node: n, parent, section: s }; }); return out; }
module.exports = { bad, canon, fp, pack, unpack, clone, norm, walkNodes, findNode };
