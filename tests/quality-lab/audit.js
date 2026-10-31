// Programme 22.1 — analyse STATIQUE d'une page rendue (HTML) et notation. Aucune appréciation esthétique n'est simulée : tout ce qui n'est pas mesurable sans navigateur est déclaré « non mesuré ».
const strip = (s) => String(s || "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
const text = (h) => strip(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i")); return m ? (m[2] ?? m[3]) : null; };

function analyzePage(html) {
  const body = (html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  const heads = [...strip(body).matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({ level: Number(m[1]), text: text(m[2]) }));
  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const links = [...body.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], "href")).filter((h) => h !== null);
  const inputs = [...body.matchAll(/<(input|select|textarea)\b[^>]*>/gi)].map((m) => m[0]).filter((t) => !/type\s*=\s*["']?(hidden|submit|button|checkbox_)/i.test(t));
  const labelled = inputs.filter((t) => { const id = attr(t, "id"); return attr(t, "aria-label") || (id && new RegExp(`<label[^>]*for\\s*=\\s*["']${id}["']`, "i").test(body)); }).length;
  const levelsOk = heads.every((h, i) => i === 0 || h.level <= heads[i - 1].level + 1);
  const jsonld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => { try { return JSON.parse(m[1]); } catch { return null; } });
  const t = text(body);
  const placeholders = (t.match(/\[[^\]]{2,80}\]/g) || []);
  return {
    bytes: Buffer.byteLength(html), words: t ? t.split(/\s+/).length : 0,
    lang: (html.match(/<html[^>]*\slang="([^"]*)"/i) || [])[1] || "", title: ((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim(),
    description: (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i) || [])[1] || "", canonical: Boolean(/<link[^>]*rel="canonical"/i.test(html)),
    viewport: /<meta[^>]*name="viewport"/i.test(html), og: /<meta[^>]*property="og:title"/i.test(html), jsonld: jsonld.filter(Boolean).length, jsonldInvalid: jsonld.filter((x) => x === null).length,
    h1: heads.filter((h) => h.level === 1).length, headings: heads, headingOrderOk: levelsOk,
    images: imgs.length, imagesNoAlt: imgs.filter((i) => attr(i, "alt") === null).length, imagesEmptyAlt: imgs.filter((i) => attr(i, "alt") === "").length, imagesNoSize: imgs.filter((i) => !attr(i, "width") && !attr(i, "height")).length, imagesLazy: imgs.filter((i) => /loading\s*=\s*["']lazy/i.test(i)).length,
    links: links.length, internalLinks: links.filter((h) => h.startsWith("/") && !h.startsWith("//")), emptyLinks: links.filter((h) => !h || h === "#").length,
    landmarks: { main: /<main\b/i.test(body), nav: /<nav\b/i.test(body), header: /<header\b/i.test(body), footer: /<footer\b/i.test(body) }, skipLink: /href="#(main|contenu|content)[^"]*"/i.test(body),
    formFields: inputs.length, formFieldsLabelled: labelled, buttons: (body.match(/<button\b|class="[^"]*\bbtn\b/gi) || []).length,
    placeholders: placeholders.length, replaceMarkers: (t.match(/Remplacez par|Prénom N\./g) || []).length, placeholderSamples: placeholders.slice(0, 4), text: t,
    cssLinks: [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/gi)].map((m) => m[1]), scripts: (html.match(/<script\b/gi) || []).length,
  };
}
// Affirmations qu'un contenu généré NE doit PAS contenir sans source dans le brief (statistiques, certifications, résultats, promesses médicales)
const INVENTED = [/\b\d{2,}\s?%/, /\b\d+\s*(ans|années) d['’ ]expérience/i, /\bISO\s?\d{3,5}\b/i, /\b\d[\d  ]{2,}\s*(clients|projets|chantiers|patients)\b/i, /\b(garanti|garantie)\s+(à\s+)?100\s?%/i, /\b(guéri|guérison|traitement miracle|sans douleur garantie)\b/i, /n°\s?1\b|numéro un|leader (du|de la|en)/i];
const inventedClaims = (t) => INVENTED.filter((r) => r.test(t)).map(String);

// Statut selon la note ramenée à 100 (mission §16) ; une défaillance critique plafonne le statut
const STATUS = (n) => (n >= 90 ? "EXCELLENT" : n >= 80 ? "TRÈS BON" : n >= 70 ? "SATISFAISANT" : n >= 50 ? "À AMÉLIORER" : "INSUFFISANT");
const CRITERIA = [["brief", "Compréhension du brief", 10], ["architecture", "Architecture du site", 10], ["visuel", "Qualité visuelle", 20], ["sections", "Qualité des sections", 10], ["contenus", "Qualité des contenus", 10], ["medias", "Qualité des médias", 10], ["responsive", "Responsive design", 10], ["ux", "Expérience utilisateur", 10], ["seoa11y", "SEO et accessibilité", 5], ["perf", "Performance technique", 5]];
// `parts` : { critère: { got, measured, notes } } — `measured` = points réellement mesurables par le laboratoire (≤ pondération)
function grade(parts, critical) {
  const rows = CRITERIA.map(([k, label, max]) => { const p = parts[k] || { got: 0, measured: 0, notes: [] }; const measured = Math.min(max, p.measured); return { key: k, label, max, measured, got: Math.min(measured, Math.max(0, Math.round(p.got * 10) / 10)), notes: p.notes || [] }; });
  const got = rows.reduce((a, r) => a + r.got, 0), measured = rows.reduce((a, r) => a + r.measured, 0);
  const pct = measured ? Math.round((got / measured) * 1000) / 10 : 0;
  let status = STATUS(pct), capped = false;
  if (critical.length && pct >= 70) { status = "À AMÉLIORER"; capped = true; }
  return { rows, got: Math.round(got * 10) / 10, measured, pct, status, capped, critical };
}
module.exports = { analyzePage, inventedClaims, grade, STATUS, CRITERIA, text, attr };
