// Kolakisa Advanced Layout Generation Engine (programme 22.3) — point d'entrée. Voir docs/KOLAKISA_ADVANCED_LAYOUT_GENERATION_ENGINE.md.
// Flux : intention (intent) → profil du contenu → sélection (patterns) → construction (builders, nœuds NATIFS) → transformation responsive → validation par le normaliseur natif
//        → analyse d'équilibre (+ une correction automatique ciblée) → proposition. Aucun appel IA : la composition est déterministe et gratuite. Rien n'est écrit ici (voir apply.js).
const { performance } = require("node:perf_hooks");
const B = require("./base");
const patterns = require("./patterns");
const intentLib = require("./intent");
const responsive = require("./responsive");
const validateLib = require("./validate");
const balance = require("./balance");

const KIND_ROLE = { hero: "hero", intro: "intro", services: "services", benefits: "benefits", steps: "steps", gallery: "gallery", portfolio: "gallery", testimonials: "testimonials", faq: "faq", contact: "contact", cta: "cta", pricing: "pricing",
  stats: "stats", team: "team", logos: "logos", text: "text", products: "products", listing: "products", categories: "categories", detail: "detail", compare: "compare" };
const str = (v, n) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, n) : "");
const img = (v) => (v && typeof v === "object" && str(v.src, 2000) ? { src: str(v.src, 2000), alt: str(v.alt, 200), caption: str(v.caption, 200), ...(Number(v.w) > 0 ? { w: Number(v.w) } : {}), ...(Number(v.h) > 0 ? { h: Number(v.h) } : {}), ...(v.orient ? { orient: str(v.orient, 12) } : {}) } : null);
const cta = (v) => (v && typeof v === "object" && str(v.label, 60) && str(v.url, 2000) ? { label: str(v.label, 60), url: str(v.url, 2000) } : null);

// Contenu d'une section : borné et nettoyé (donnée non fiable), JAMAIS complété ni raccourci au-delà des bornes du moteur natif
function cleanContent(raw = {}) {
  const items = (Array.isArray(raw.items) ? raw.items : []).slice(0, 24).map((i) => (typeof i === "string" ? { title: str(i, 120) } : i && typeof i === "object" ? {
    title: str(i.title, 120), text: str(i.text, 1200), q: str(i.q, 200), a: str(i.a, 2000), author: str(i.author, 120), role: str(i.role, 120), price: str(i.price, 40), period: str(i.period, 40), badge: str(i.badge, 40),
    prefix: str(i.prefix, 10), suffix: str(i.suffix, 16), icon: str(i.icon, 30), highlight: i.highlight === true, features: (Array.isArray(i.features) ? i.features : []).slice(0, 20).map((f) => str(f, 160)).filter(Boolean),
    ...(Number.isFinite(Number(i.value)) && i.value !== "" && i.value !== null && i.value !== undefined ? { value: Number(i.value) } : {}), image: img(i.image), cta: cta(i.cta) } : null)).filter((i) => i && Object.values(i).some((v) => (Array.isArray(v) ? v.length : Boolean(v))));
  return {
    kind: str(raw.kind, 20) || "text", eyebrow: str(raw.eyebrow, 60), title: str(raw.title, 200), text: str(raw.text, 6000), price: str(raw.price, 40), items,
    image: img(raw.image), images: (Array.isArray(raw.images) ? raw.images : []).slice(0, 24).map(img).filter(Boolean), cta: cta(raw.cta), cta2: cta(raw.cta2),
    table: Array.isArray(raw.table) ? raw.table.slice(0, 40).map((r) => (Array.isArray(r) ? r.slice(0, 8).map((x) => str(String(x ?? ""), 200)) : [])) : null,
  };
}
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };

// ── Layout Selection Engine ──────────────────────────────────────────────────────────────────────────────────────────────────
// Classement des patterns d'un rôle : écarte ceux dont les contraintes ne sont pas satisfaites (avec la raison), note les autres (famille, ton, secteur, ajustement au contenu, diversité).
function select(role, c, intent, { used = [], seed = "" } = {}) {
  const pf = intentLib.profile(c);
  const cands = [], rejected = [];
  for (const def of patterns.list({ role })) {
    const why = def.needs(c);
    if (why) { rejected.push({ id: def.id, label: def.label, reason: `demande ${why.replace(/^demande /, "")}` }); continue; }
    const reasons = [];
    let score = (intent.familyWeights[def.family] || 0) * 3;
    if (intent.familyWeights[def.family]) reasons.push(`famille ${patterns.FAMILIES[def.family]} adaptée à la page`);
    const tm = (def.tags.tones || []).filter((t) => intent.tones.includes(t)), sm = (def.tags.sectors || []).filter((t) => intent.sectors.includes(t));
    if (tm.length) { score += 2 * tm.length; reasons.push(`ton ${tm.join("/")}`); }
    if (sm.length) { score += 2 * sm.length; reasons.push(`secteur ${sm.join("/")}`); }
    if (def.ideal) { const n = pf.items; if (n >= def.ideal[0] && n <= def.ideal[1]) { score += 2; reasons.push(`${n} éléments : dans la plage idéale`); } else score -= 1; }
    if (def.fn === "cards" && pf.avgItem > 260 && def.params.flat) score -= 1;
    const seen = used.filter((u) => u === def.id).length;
    if (seen) { score -= 6 * seen; reasons.push("déjà utilisé sur la page : pénalisé (diversité)"); }
    if (used.length && patterns.get(used[used.length - 1]) && patterns.get(used[used.length - 1]).fn === def.fn) { score -= 3; reasons.push("même structure que la section précédente : pénalisé"); }
    score += hash(`${seed}:${def.id}`) * 1.5;   // départage stable : deux sites différents n'obtiennent pas toujours la même composition
    cands.push({ id: def.id, family: def.family, label: def.label, score: Math.round(score * 100) / 100, reasons });
  }
  cands.sort((a, b) => b.score - a.score);
  return { candidates: cands, rejected, profile: pf };
}

// ── Construction d'UNE section ───────────────────────────────────────────────────────────────────────────────────────────────
function composeSection(ctx, { seed, role, content, intent, patternId = null, used = [], over = {}, name = "" }) {
  const t0 = performance.now();
  const c = cleanContent(content);
  const sel = select(role, c, intent || intentLib.analyze({}), { used, seed });
  const pick = patternId ? patterns.get(patternId) : sel.candidates[0] && patterns.get(sel.candidates[0].id);
  if (!pick) return { ok: false, role, status: "skipped", reason: sel.rejected.length ? `Aucun layout ne convient au contenu fourni : ${sel.rejected.slice(0, 3).map((r) => `${r.label} ${r.reason}`).join(" ; ")}.` : `Aucun layout n'existe pour le rôle « ${role} ».`, rejected: sel.rejected };
  if (!pick.roles.includes(role) && !patternId) return { ok: false, role, status: "skipped", reason: "Layout incompatible avec le rôle.", rejected: sel.rejected };
  const t1 = performance.now();
  const build = (extra) => {
    B.resetIds();
    const x = { seed: `${seed}:${pick.id}` };
    const nodes = patterns.build(pick, x, c, sel.profile, { ...intentLib.adapt(pick, sel.profile, c), ...over, ...extra });
    const changes = responsive.transform(nodes);
    responsive.strip(nodes);
    const section = validateLib.toSection(`${seed}:${pick.id}:${role}`, nodes, name || pick.label);
    const val = validateLib.validate(ctx, section);
    return { nodes, changes, section, val };
  };
  let built;
  try { built = build({}); } catch (e) { if (e.code === "needs") return { ok: false, role, status: "skipped", reason: e.message, rejected: sel.rejected }; throw e; }
  let bal = built.val.ok ? balance.analyze(built.val.section, { profile: sel.profile }) : { score: 0, findings: [], measures: {} };
  let corrected = null;
  // Une correction automatique ciblée (une seule passe) : on garde la version corrigée seulement si elle est meilleure et valide
  const fix = built.val.ok && bal.findings.find((f) => f.fix);
  if (fix) {
    try {
      const again = build(fix.fix);
      if (again.val.ok) { const b2 = balance.analyze(again.val.section, { profile: sel.profile }); if (b2.score > bal.score) { corrected = { rule: fix.rule, applied: fix.fix, before: bal.score, after: b2.score }; built = again; bal = b2; } }
    } catch { /* la correction n'a pas pu être construite : on garde la composition d'origine */ }
  }
  const t2 = performance.now();
  const keep = built.val.ok ? validateLib.preserved(built.val.section, c, role) : { ok: false, missing: [] };
  return {
    ok: built.val.ok && keep.ok, role, status: built.val.ok && keep.ok ? "ok" : "invalid", patternId: pick.id, family: pick.family, label: pick.label, mode: pick.mode,
    section: built.val.ok ? built.val.section : null, errors: [...built.val.errors, ...(keep.ok ? [] : [`Contenu non repris : ${keep.missing.slice(0, 3).join(" | ")}`])],
    metrics: built.val.metrics, balance: bal, corrected, adaptation: built.changes, profile: sel.profile, alternatives: sel.candidates.slice(0, 6), rejected: sel.rejected,
    timing: { planMs: +(t1 - t0).toFixed(2), buildMs: +(t2 - t1).toFixed(2) },
  };
}

// Alternance des fonds : deux sections consécutives de même fond neutre → la seconde prend l'autre fond neutre (rythme de lecture)
function rhythm(sections) {
  let prev = null;
  for (const s of sections) {
    const root = s && s.children && s.children[0], st = root && root.styles && root.styles.desktop;
    if (!st) { prev = null; continue; }
    const bg = st.backgroundColor;
    if (bg === prev && (bg === "token:background" || bg === "token:surface")) { st.backgroundColor = bg === "token:background" ? "token:surface" : "token:background"; }
    prev = st.backgroundColor;
  }
}

// ── Page entière ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// page : { key, name, type, goal, sections:[{ kind, ...contenu, patternId? }] } ; site : { name, description, direction }
function composePage(ctx, page, site = {}, { seed = null } = {}) {
  const t0 = performance.now();
  const sd = seed || `${site.name || ""}:${page.key || page.name || ""}`;
  const intent = intentLib.analyze(page, site);
  const used = [], out = [], report = [];
  (page.sections || []).forEach((s, i) => {
    const role = KIND_ROLE[s.kind] || "text";
    const r = composeSection(ctx, { seed: `${sd}:${i}`, role, content: s, intent, patternId: s.patternId || null, used, name: s.name || "" });
    if (r.ok) { out.push(r.section); used.push(r.patternId); }
    report.push({ index: i, kind: s.kind, role, status: r.status, patternId: r.patternId || null, family: r.family || null, label: r.label || null, score: r.balance ? r.balance.score : null, reason: r.reason || (r.errors && r.errors[0]) || "", alternatives: (r.alternatives || []).map((a) => a.id), corrected: r.corrected || null });
  });
  rhythm(out);
  const t1 = performance.now();
  const metrics = out.reduce((a, s) => { const m = validateLib.metrics(s); return { nodes: a.nodes + m.nodes, depth: Math.max(a.depth, m.depth), grids: a.grids + m.grids }; }, { nodes: 0, depth: 0, grids: 0 });
  return { intent, sections: out, report, metrics: { ...metrics, sections: out.length, aiCalls: 0, totalMs: +(t1 - t0).toFixed(2) } };
}

// Signature STRUCTURELLE d'une section (types, grilles, portées, sens du flex ; ni identifiants ni textes) : deux compositions de même signature ne sont pas deux variantes
const SIG = ["display", "gridTemplate", "columns", "flexDirection", "gridColumnSpan", "gridRowSpan", "gridColumnStart", "gridColumnEnd", "minHeight", "columnCount"];
function signature(section) {
  const conv = (n) => [n.type, SIG.map((k) => ((n.styles && n.styles.desktop) || {})[k] ?? ""), n.props && n.props.band ? 1 : 0, (n.children || []).map(conv)];
  return JSON.stringify((section.children || []).map(conv));
}
// ── Variantes d'une section (structures réellement différentes) ────────────────────────────────────────────────────────────────
// Une variante par structure distincte (constructeur + paramètres de structure) : on garde la meilleure de chaque famille de structure.
function variants(ctx, { seed, role, content, intent, max = 6 }) {
  const c = cleanContent(content);
  const sel = select(role, c, intent || intentLib.analyze({}), { seed });
  const seen = new Set(), out = [];
  for (const cand of sel.candidates) {
    const r = composeSection(ctx, { seed, role, content, intent, patternId: cand.id });
    if (!r.ok) continue;
    const key = signature(r.section);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ patternId: r.patternId, family: r.family, label: r.label, mode: r.mode, score: r.balance.score, findings: r.balance.findings.length, metrics: r.metrics, section: r.section, adaptation: r.adaptation, signature: key.length });
    if (out.length >= max) break;
  }
  return { variants: out, rejected: sel.rejected };
}
module.exports = { cleanContent, select, composeSection, composePage, variants, signature, KIND_ROLE, patterns, intent: intentLib, balance, validate: validateLib, responsive, base: B };
