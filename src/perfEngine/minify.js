// Minification à la volée des ressources statiques des PAGES PUBLIQUES (programme 22.9). Le déploiement n'a pas d'étape de build : le fichier source reste la vérité, la version minifiée est
// fabriquée à la première demande puis gardée en mémoire (clé : chemin + date + taille du fichier, donc rafraîchie dès que la source change).
// Garde-fous : liste blanche de 4 fichiers ; seulement les adresses VERSIONNÉES (?v=…, déjà servies en cache immutable) ; production ou KOLAKISA_MINIFY=1 (désactivable par KOLAKISA_MINIFY=0) ;
// esbuild absent (devDependency), erreur ou résultat vide → le fichier d'origine est servi, sans erreur visible.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PUBLIC_ROOT = path.join(__dirname, "..", "..", "public");
const ALLOW = Object.freeze({ "/css/landing.css": "css", "/js/landing.js": "js", "/js/kw-effects.js": "js", "/js/visitor.js": "js" });
const TYPES = { css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8" };
const cache = new Map();
let esbuild; let esbuildTried = false;
const engine = () => { if (!esbuildTried) { esbuildTried = true; try { esbuild = require("esbuild"); } catch { esbuild = null; } } return esbuild; };
const enabled = () => process.env.KOLAKISA_MINIFY === "1" || (process.env.NODE_ENV === "production" && process.env.KOLAKISA_MINIFY !== "0");

// → { code, etag, saved } ou null (servir l'original)
function minified(urlPath) {
  const kind = ALLOW[urlPath]; if (!kind) return null;
  const file = path.join(PUBLIC_ROOT, urlPath);
  let st; try { st = fs.statSync(file); } catch { return null; }
  const key = `${urlPath}|${st.mtimeMs}|${st.size}`;
  if (cache.has(key)) return cache.get(key);
  let out = null;
  try {
    const eng = engine(); if (!eng) return null;
    const src = fs.readFileSync(file, "utf8");
    const code = eng.transformSync(src, { loader: kind, minify: true, legalComments: "none" }).code;
    if (code && code.length > 0 && code.length < src.length) out = { code, etag: `"m-${crypto.createHash("sha1").update(code).digest("hex").slice(0, 16)}"`, saved: Buffer.byteLength(src) - Buffer.byteLength(code), kind };
  } catch { out = null; }
  for (const k of cache.keys()) if (k.startsWith(`${urlPath}|`)) cache.delete(k);
  cache.set(key, out);
  return out;
}
function middleware(req, res, next) {
  if (req.method !== "GET" || !req.query.v || !ALLOW[req.path] || !enabled()) return next();
  const m = minified(req.path); if (!m) return next();
  res.set({ "Content-Type": TYPES[m.kind], ETag: m.etag, "Cache-Control": "public, max-age=31536000, immutable", "X-Kolakisa-Minified": "1" });
  if (req.headers["if-none-match"] === m.etag) return res.status(304).end();
  res.send(m.code);
}
module.exports = { middleware, minified, ALLOW, enabled };
