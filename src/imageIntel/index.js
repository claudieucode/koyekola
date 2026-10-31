// Advanced AI Image Intelligence (programme 22.7) — façade. Réutilise la médiathèque native (fichiers, empreintes, usages, isolation par site) et le module `aiMedia` (besoins, provenance, fournisseurs) ;
// n'ajoute ni second Media Manager ni second moteur de génération. Aucune migration : les analyses sont calculées à la demande (mémoire, clé = fichier + date + taille) et jamais enregistrées.
const fs = require("node:fs");
const analyzer = require("./analyzer");
const brief = require("./brief");
const relevance = require("./relevance");
const brand = require("./brand");
const crop = require("./crop");
const alt = require("./alt");
const licenses = require("./licenses");
const optimize = require("./optimize");
const { MarketingError } = require("../marketing/errors");

const am = () => require("../aiMedia");
const media = () => require("../marketing/media");
const bad = (m) => new MarketingError("invalid_field", m);

const CACHE = new Map(), CACHE_MAX = 300;
function remember(k, v) { CACHE.delete(k); CACHE.set(k, v); if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value); return v; }
const MAX_ANALYZE_BYTES = 25 * 1024 * 1024; // jamais plus que la limite de la médiathèque (5 Mo pour une image) : protection supplémentaire

// Analyse d'une image de la médiathèque d'UN site (même contrôle d'accès que le reste du module : site de l'adresse, médias visibles par ce site seulement)
async function analyzeMedia(ctx, siteId, mediaId) {
  const m = am().visibleMedia(ctx, siteId, mediaId), parsed = media().parsePublicPath(ctx, m.path);
  if (!parsed) throw new MarketingError("not_found", "Fichier introuvable.");
  let st; try { st = await fs.promises.stat(parsed.absolute); } catch { throw new MarketingError("not_found", "Le fichier n'est plus sur le disque."); }
  if (st.size > MAX_ANALYZE_BYTES) throw bad("Fichier trop volumineux pour l'analyse.");
  const key = `${parsed.absolute}|${st.mtimeMs}|${st.size}`;
  if (CACHE.has(key)) return { media: m, analysis: remember(key, CACHE.get(key)), cached: true };
  if (!analyzer.available()) return { media: m, analysis: { available: false, reason: "Analyse indisponible (bibliothèque d'images absente)." }, cached: false };
  let analysis;
  try { analysis = await analyzer.analyze(await fs.promises.readFile(parsed.absolute), { bytes: st.size }); } catch (e) { analysis = { available: false, reason: `Image illisible : ${e.message}` }; }
  return { media: m, analysis: remember(key, analysis), cached: false };
}

function directionOf(ctx, siteId) { const c = am().contextOf(ctx, siteId); return { context: c, direction: { hue: c.hue, mood: c.mood }, sectorText: `${c.category} ${c.sector} ${c.description} ${c.siteName}` }; }

// Détail d'une image : analyse + cadrage par appareil + optimisation + licence + ALT + correspondance à la marque
async function inspect(ctx, siteId, mediaId, { ratio = "16:9", focal = null } = {}) {
  const { media: m, analysis } = await analyzeMedia(ctx, siteId, mediaId);
  const prov = am().provenance(ctx, siteId, mediaId), dir = directionOf(ctx, siteId);
  const out = { mediaId: m.id, name: m.name, analysis, license: licenses.checkLicense({ license: prov.license, author: prov.author }), provenance: { source: prov.source, aiGenerated: prov.aiGenerated, license: prov.license, author: prov.author } };
  if (analysis.available) {
    const f = focal && Number.isFinite(focal.x) && Number.isFinite(focal.y) ? focal : (prov.focal && Number.isFinite(prov.focal.x) ? prov.focal : null);
    const img = { width: analysis.width, height: analysis.height, focal: f || analysis.focal };
    out.crop = crop.plan(img, { ratio, mode: "cover", focal: f || undefined });
    out.devices = crop.perDevice(img, { focals: f ? { desktop: f, tablet: f, mobile: f } : {} });
    out.optimization = optimize.advise(analysis, {});
    out.brand = brand.match(analysis, dir.direction);
  }
  const cls = alt.classify({ role: "", decorativeHint: false });
  out.alt = { current: m.alt || "", issues: alt.validate(m.alt || "", { imageClass: cls, filename: m.name }), proposal: alt.propose({ imageClass: cls, source: { description: prov.description, caption: prov.caption }, siblings: [] }) };
  return out;
}

// Diagnostic de la médiathèque d'un site (Media Manager : doublons, inutilisées, lourdes, basse qualité, cohérence, licences, ALT)
async function siteDiagnostic(ctx, siteId, { limit = 40 } = {}) {
  const items = am().library(ctx, siteId, { limit: Math.min(100, Math.max(1, Number(limit) || 40)) });
  const dir = directionOf(ctx, siteId), variety = Boolean(brief.sectorOf(dir.sectorText).variety);
  const sha = new Map(ctx.db.prepare(`SELECT id, sha256 FROM mk_media WHERE organization_id = ? AND id IN (${items.map(() => "?").join(",") || "NULL"})`).all(ctx.organizationId, ...items.map((i) => i.id)).map((r) => [r.id, r.sha256]));
  const rows = [];
  for (let i = 0; i < items.length; i += 3) {
    rows.push(...await Promise.all(items.slice(i, i + 3).map(async (it) => {
      const row = { id: it.id, name: it.name, path: it.path, size: it.size, width: it.width, height: it.height, flags: [], used: null, license: null, altIssues: [] };
      try { const { analysis } = await analyzeMedia(ctx, siteId, it.id); row.analysis = analysis.available ? { orientation: analysis.orientation, luminance: analysis.luminance, saturation: analysis.saturation, contrast: analysis.contrast, sharpness: analysis.sharpness, focal: analysis.focal, dominantHues: analysis.dominantHues, flags: analysis.flags.map((f) => f.code) } : null; row.full = analysis; if (analysis.available) row.flags.push(...analysis.flags.map((f) => f.code)); row.brand = brand.match(analysis, dir.direction); } catch (e) { row.error = e.message; }
      try { row.used = am().usageOf(ctx, siteId, it.id).length; } catch { row.used = null; }
      const prov = am().provenance(ctx, siteId, it.id);
      row.license = licenses.checkLicense({ license: prov.license, author: prov.author });
      row.altIssues = alt.validate(it.alt || "", { imageClass: "informative", filename: it.name }).map((x) => x.code);
      return row;
    })));
  }
  const bySha = new Map(); for (const r of rows) { const h = sha.get(r.id); if (h) bySha.set(h, [...(bySha.get(h) || []), r.id]); }
  const duplicates = [...bySha.values()].filter((g) => g.length > 1);
  const cons = brand.consistency(rows.map((r) => ({ id: r.id, analysis: r.full })), { variety });
  for (const r of rows) delete r.full;
  const unused = rows.filter((r) => r.used === 0).map((r) => r.id);
  return {
    analyzedAt: new Date().toISOString(), count: rows.length, method: analyzer.available() ? "pixels (sharp)" : "indisponible",
    summary: { duplicates: duplicates.length, unused: unused.length, heavy: rows.filter((r) => r.flags.includes("lourde")).length, lowQuality: rows.filter((r) => r.flags.some((f) => ["floue", "petite", "trop_sombre", "surexposee"].includes(f))).length, licenseUnverified: rows.filter((r) => r.license.usable === "unverified").length, altProblems: rows.filter((r) => r.altIssues.length).length, consistencyIssues: cons.issues.length },
    duplicates, unused, consistency: cons, items: rows,
    limits: "Analyse de pixels uniquement : le sujet des images n'est pas identifié. Un doublon est un fichier à contenu strictement identique (empreinte SHA-256), pas une image « semblable ».",
  };
}

// Besoin visuel → propositions différentes + images de la médiathèque classées par pertinence
async function recommend(ctx, siteId, needKey, { proposals = 3 } = {}) {
  const need = am().getNeed(ctx, siteId, needKey), dir = directionOf(ctx, siteId);
  const role = need.widget === "hero" ? "hero" : "illustration";
  const input = { sectorText: dir.sectorText, role, sectionText: `${need.description} ${need.pageName}`, mood: dir.direction.mood, hue: dir.direction.hue, index: 0 };
  const b = brief.visualBrief(input), props = brief.proposals(input, proposals);
  const lib = am().library(ctx, siteId, { limit: 40 });
  const cand = [];
  for (let i = 0; i < lib.length; i += 3) cand.push(...await Promise.all(lib.slice(i, i + 3).map(async (it) => { let a = null; try { a = (await analyzeMedia(ctx, siteId, it.id)).analysis; } catch { /* sans analyse */ } return { id: it.id, name: it.name, alt: it.alt, description: it.description, tags: it.tags, category: it.category, analysis: a }; })));
  return { need: { key: need.key, widget: need.widget, status: need.status }, brief: b, proposals: props, ranking: relevance.rank(cand, b).slice(0, 10), note: "Classement d'après les descriptions et étiquettes (et les pixels lorsqu'ils sont analysables) ; le sujet réel de l'image n'est pas reconnu." };
}
module.exports = { analyzer, brief, relevance, brand, crop, alt, licenses, optimize, analyzeMedia, inspect, siteDiagnostic, recommend, directionOf };
