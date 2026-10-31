// Analyse STATIQUE d'une page publiée (programme 22.9) : le HTML réellement servi est lu avec l'analyseur HTML du produit (htmlparser2), jamais par expressions régulières.
// Tout ce qui sort d'ici est une MESURE du document servi (environnement « analyse-statique ») ; ce qui en est déduit (candidat LCP, risque de décalage) est étiqueté « estimation ».
const { Parser } = require("htmlparser2");
const zlib = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");
const { metric } = require("./vitals");

const hostOf = (u, base) => { try { return new URL(u, base || "http://local.invalid").hostname; } catch { return ""; } };
const isExternal = (u, own) => /^(https?:)?\/\//i.test(u) && hostOf(u) !== own;
const bytes = (s) => Buffer.byteLength(String(s || ""), "utf8");
const gz = (s) => zlib.gzipSync(Buffer.from(String(s || "")), { level: 6 }).length;

// Taille d'un fichier statique LOCAL (/css/…, /js/…) : relevée sur le disque, brute et compressée. Un fichier introuvable → null (jamais inventé).
function localSizer(publicRoot) {
  return (url) => {
    const clean = String(url).split("?")[0].split("#")[0];
    if (!clean.startsWith("/") || clean.startsWith("//") || clean.includes("..")) return null;
    const rel = clean.replace(/^\/+/, ""); const file = path.join(publicRoot, rel);
    if (!file.startsWith(publicRoot + path.sep)) return null;
    try { const buf = fs.readFileSync(file); return { raw: buf.length, gzip: zlib.gzipSync(buf, { level: 6 }).length }; } catch { return null; }
  };
}

function parse(html) {
  const out = { nodes: 0, maxDepth: 0, wrapperChains: 0, longestWrapperChain: 0, images: [], scripts: [], styles: [], inlineStyleBytes: 0, inlineScriptBytes: 0, iframes: [], videos: [], links: [], fontFaces: [], headings: 0, hasMain: false, hasViewport: false };
  const stack = []; let inMain = false, inHeaderNav = 0, styleBuf = null, scriptBuf = null, order = 0;
  const parser = new Parser({
    onopentag(name, a) {
      out.nodes += 1; const depth = stack.length + 1; if (depth > out.maxDepth) out.maxDepth = depth;
      const top = stack[stack.length - 1];
      // enveloppes inutiles : un <div> sans classe ni attribut significatif dont le seul enfant est un <div>
      const bare = name === "div" && !a.class && !a.id && Object.keys(a).filter((k) => !/^(style|data-)/.test(k)).length === 0;
      const frame = { name, bare, kids: 0, firstKid: "", wchain: 0, kidChain: 0 };
      if (top) { top.kids += 1; if (top.kids === 1) top.firstKid = name; }
      stack.push(frame);
      if (name === "main") { inMain = true; out.hasMain = true; }
      if (name === "header" || name === "nav") inHeaderNav += 1;
      if (/^h[1-6]$/.test(name)) out.headings += 1;
      if (name === "meta" && a.name === "viewport") out.hasViewport = true;
      if (name === "img") out.images.push({ src: a.src || "", order: order++, inMain, inHeaderNav: inHeaderNav > 0, width: a.width || "", height: a.height || "", loading: a.loading || "", fetchpriority: a.fetchpriority || "", decoding: a.decoding || "", srcset: Boolean(a.srcset), alt: a.alt === undefined ? null : a.alt, cls: a.class || "", style: a.style || "" });
      if (name === "script") { out.scripts.push({ src: a.src || "", defer: a.defer !== undefined, async: a.async !== undefined, module: a.type === "module", inline: !a.src, type: a.type || "" }); scriptBuf = a.src ? null : []; }
      if (name === "style") styleBuf = [];
      if (name === "link") out.links.push({ rel: (a.rel || "").toLowerCase(), href: a.href || "", as: a.as || "", media: a.media || "", crossorigin: a.crossorigin !== undefined, fetchpriority: a.fetchpriority || "" });
      if (name === "iframe") out.iframes.push({ src: a.src || "", loading: a.loading || "" });
      if (name === "video") out.videos.push({ preload: a.preload || "", autoplay: a.autoplay !== undefined, poster: a.poster || "" });
    },
    ontext(t) { if (styleBuf) styleBuf.push(t); else if (scriptBuf) scriptBuf.push(t); },
    onclosetag(name) {
      const f = stack.pop();
      // enveloppe inutile : <div> nu dont l'unique enfant est un <div> ; une chaîne = enveloppes consécutives
      if (f) {
        f.wchain = f.bare && f.kids === 1 && f.firstKid === "div" ? 1 + f.kidChain : 0;
        const par = stack[stack.length - 1];
        if (par) par.kidChain = f.wchain;
        if (f.wchain >= 2 && !(par && par.bare && par.kids === 1 && par.firstKid === "div")) { out.wrapperChains += 1; out.longestWrapperChain = Math.max(out.longestWrapperChain, f.wchain); }
      }
      if (name === "main") inMain = false;
      if (name === "header" || name === "nav") inHeaderNav = Math.max(0, inHeaderNav - 1);
      if (name === "style" && styleBuf) { const css = styleBuf.join(""); out.inlineStyleBytes += bytes(css); for (const m of css.matchAll(/@font-face\s*\{[^}]*\}/g)) out.fontFaces.push({ display: /font-display\s*:\s*(\w+)/.exec(m[0])?.[1] || "", src: /url\(([^)]+)\)/.exec(m[0])?.[1]?.replace(/["']/g, "") || "", family: /font-family\s*:\s*([^;}]+)/.exec(m[0])?.[1]?.trim().replace(/["']/g, "") || "" }); styleBuf = null; }
      if (name === "script" && scriptBuf) { out.inlineScriptBytes += bytes(scriptBuf.join("")); scriptBuf = null; }
    },
  }, { decodeEntities: true });
  parser.write(html); parser.end();
  return out;
}

// html : document servi ; opts.headers : en-têtes de la réponse ; opts.host : hôte de la page (pour distinguer l'externe) ; opts.sizer : localSizer(publicRoot)
function analyzeHtml(html, { headers = {}, host = "", sizer = null, ttfbMs = null } = {}) {
  const p = parse(String(html || ""));
  const H = (k) => String(headers[k] || headers[k.toLowerCase()] || "");
  const own = String(host || "").split(":")[0];
  const scripts = p.scripts.map((s) => ({ ...s, external: s.src ? isExternal(s.src, own) : false, blocking: Boolean(s.src) && !s.defer && !s.async && !s.module, size: s.src && sizer && !isExternal(s.src, own) ? sizer(s.src) : null }));
  const sheets = p.links.filter((l) => l.rel.split(/\s+/).includes("stylesheet")).map((l) => ({ ...l, external: isExternal(l.href, own), blocking: !l.media || l.media === "all" || l.media === "screen", size: sizer && !isExternal(l.href, own) ? sizer(l.href) : null }));
  const preloads = p.links.filter((l) => l.rel === "preload"), preconnects = p.links.filter((l) => l.rel === "preconnect" || l.rel === "dns-prefetch");
  const origins = new Set(); for (const u of [...scripts.map((s) => s.src), ...sheets.map((s) => s.href), ...p.images.map((i) => i.src), ...p.iframes.map((i) => i.src)]) if (u && isExternal(u, own)) origins.add(hostOf(u));
  // candidat LCP (ESTIMATION) : première image du contenu principal hors en-tête/navigation, hors petites icônes déclarées
  const small = (i) => (Number(i.width) > 0 && Number(i.width) <= 120) || /logo|avatar|icon/i.test(i.cls);
  const lcp = p.images.find((i) => i.inMain && !i.inHeaderNav && !small(i)) || null;
  const noDims = p.images.filter((i) => !(Number(i.width) > 0 && Number(i.height) > 0) && !/aspect-ratio/i.test(i.style));
  const jsRaw = scripts.reduce((a, s) => a + (s.size ? s.size.raw : 0), 0) + p.inlineScriptBytes, jsGz = scripts.reduce((a, s) => a + (s.size ? s.size.gzip : 0), 0);
  const cssRaw = sheets.reduce((a, s) => a + (s.size ? s.size.raw : 0), 0) + p.inlineStyleBytes, cssGz = sheets.reduce((a, s) => a + (s.size ? s.size.gzip : 0), 0);
  const unsized = scripts.filter((s) => s.src && !s.external && !s.size).length + sheets.filter((s) => !s.external && !s.size).length;
  const S = { env: "analyse-statique", source: "HTML servi" };
  const m = {
    htmlBytes: metric("htmlBytes", bytes(html), { ...S }), htmlGzipBytes: metric("htmlGzipBytes", gz(html), { ...S }),
    domNodes: metric("domNodes", p.nodes, { ...S }), domDepth: metric("domDepth", p.maxDepth, { ...S }),
    requests: metric("requests", scripts.filter((s) => s.src).length + sheets.length + p.images.length + p.iframes.length, { ...S, kind: "estimation", note: "références présentes dans le HTML ; hors polices, requêtes dynamiques et ressources CSS" }),
    jsBytes: metric("jsBytes", jsRaw, { ...S, source: "fichiers locaux lus sur le disque + scripts en ligne" }), jsGzipBytes: metric("jsGzipBytes", jsGz, { ...S, source: "fichiers locaux compressés (gzip niveau 6)" }),
    cssBytes: metric("cssBytes", cssRaw, { ...S, source: "feuilles locales lues sur le disque + styles en ligne" }), cssGzipBytes: metric("cssGzipBytes", cssGz, { ...S, source: "feuilles locales compressées (gzip niveau 6)" }),
    inlineCssBytes: metric("inlineCssBytes", p.inlineStyleBytes, { ...S }),
    images: metric("images", p.images.length, { ...S }), blockingScripts: metric("blockingScripts", scripts.filter((s) => s.blocking).length, { ...S }),
    blockingStyles: metric("blockingStyles", sheets.filter((s) => s.blocking).length, { ...S }), externalOrigins: metric("externalOrigins", origins.size, { ...S }),
    lcp: metric("lcp", null, { env: "laboratoire", note: "non mesurable sur le HTML seul : nécessite un navigateur (tests/manuel/perf-lab.js) ou des données terrain" }),
    inp: metric("inp", null, { env: "terrain", note: "mesurable seulement avec des interactions (laboratoire simulé ou données terrain)" }),
    cls: metric("cls", null, { env: "laboratoire", note: "non mesurable sur le HTML seul" }),
    ttfb: ttfbMs === null ? metric("ttfb", null, { env: "serveur" }) : metric("ttfb", ttfbMs, { env: "serveur", source: "réponse HTTP locale du serveur (hors réseau)" }),
  };
  return {
    metrics: m,
    facts: {
      compressed: /gzip|br|deflate/.test(H("content-encoding")) || null, cacheControl: H("cache-control"), contentEncoding: H("content-encoding"),
      lcpCandidate: lcp ? { src: lcp.src, loading: lcp.loading, fetchpriority: lcp.fetchpriority, hasDimensions: Boolean(Number(lcp.width) > 0 && Number(lcp.height) > 0), hasSrcset: lcp.srcset, estimation: true } : null,
      imagesWithoutDimensions: noDims.length, imagesWithoutAlt: p.images.filter((i) => i.alt === null).length, imagesLazy: p.images.filter((i) => i.loading === "lazy").length, imagesWithSrcset: p.images.filter((i) => i.srcset).length,
      scripts: scripts.map((s) => ({ src: s.src, defer: s.defer, async: s.async, module: s.module, inline: s.inline, external: s.external, blocking: s.blocking, bytes: s.size ? s.size.raw : null, gzip: s.size ? s.size.gzip : null })),
      stylesheets: sheets.map((s) => ({ href: s.href, external: s.external, blocking: s.blocking, bytes: s.size ? s.size.raw : null, gzip: s.size ? s.size.gzip : null })),
      preloads: preloads.length, preconnects: preconnects.length, externalOrigins: [...origins], unmeasuredFiles: unsized,
      iframesWithoutLazy: p.iframes.filter((i) => i.loading !== "lazy").length, videosAutoPreload: p.videos.filter((v) => v.preload === "auto" || (v.autoplay && !v.poster)).length,
      fontFaces: p.fontFaces.length, fontFacesWithoutDisplay: p.fontFaces.filter((f) => !f.display).length, fontFamilies: [...new Set(p.fontFaces.map((f) => f.family).filter(Boolean))], googleFonts: [...sheets.map((s) => s.href), ...preconnects.map((l) => l.href)].some((u) => /fonts\.(googleapis|gstatic)\.com/.test(u)),
      wrapperChains: p.wrapperChains, longestWrapperChain: p.longestWrapperChain, hasMain: p.hasMain, hasViewport: p.hasViewport,
    },
  };
}
module.exports = { analyzeHtml, localSizer, parse };
