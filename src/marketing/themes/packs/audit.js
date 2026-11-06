// Contrôles automatiques d'un paquet de thème (utilisés par les tests et par scripts/themes-check.js) :
//  1. aucune balise ni attribut de ses blocs HTML n'est supprimé par le filtre de sécurité du Page Builder (sinon le rendu diffère de ce qui est écrit) ;
//  2. aucun lien « mort » : chaque adresse interne est une page du thème (ou une page système connue), chaque ancre est reconnue ;
//  3. un seul titre de niveau 1 par page, des niveaux de titres sans trou, des images avec texte alternatif ;
//  4. diversité : deux thèmes ne peuvent pas partager la même empreinte de structure (en-tête, hero, grille, mouvement) ni des polices de titres identiques avec une teinte proche.
const nodes = require("../../pages/nodes");
const packs = require("./index");

const SYSTEM_PATHS = new Set(["/", "/recherche", "/introuvable", "/contact", "/blog", "/panier", "/compte", "/connexion"]);
const tagsOf = (html) => [...String(html).matchAll(/<\s*([a-zA-Z][a-zA-Z0-9]*)/g)].map((m) => m[1].toLowerCase());
const attrsOf = (html) => [...String(html).matchAll(/\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)=/g)].map((m) => m[1].toLowerCase());
const count = (arr) => arr.reduce((m, k) => (m[k] = (m[k] || 0) + 1, m), {});
const diff = (a, b) => { const A = count(a), B = count(b), out = []; for (const k of Object.keys(A)) if ((B[k] || 0) < A[k]) out.push(`${k} (${A[k] - (B[k] || 0)})`); return out; };

function htmlNodes(sections) { const out = []; const walk = (n) => { if (Array.isArray(n)) return n.forEach(walk); if (!n || typeof n !== "object") return; if (n.type === "html" && n.props) out.push(n.props.html); if (n.children) walk(n.children); }; walk(sections); return out; }

function auditPack(spec) {
  const problems = [];
  const pageKeys = new Set(spec.pages.map((p) => p.key));
  for (const page of spec.pages) {
    const at = `${spec.key}/${page.key}`;
    let sections;
    try { sections = page.render({ key: spec.key, name: spec.name, brand: spec.brand || spec.name, menu: spec.menu.map(([label, url]) => ({ label, url })), cta: spec.cta || null, contact: spec.contact || {}, options: packs.resolveOptions(spec, {}) }); } catch (e) { problems.push(`${at} : rendu impossible (${e.message})`); continue; }
    let h1 = 0;
    for (const html of htmlNodes(sections)) {
      if (html.length > 20000) problems.push(`${at} : bloc HTML de ${html.length} caractères (20 000 au plus)`);
      const out = nodes.sanitizeHtmlBlock(html);
      const lostTags = diff(tagsOf(html), tagsOf(out)), lostAttrs = diff(attrsOf(html), attrsOf(out));
      if (lostTags.length) problems.push(`${at} : balises supprimées par le filtre de sécurité : ${lostTags.join(", ")}`);
      if (lostAttrs.length) problems.push(`${at} : attributs supprimés par le filtre de sécurité : ${lostAttrs.join(", ")}`);
      for (const m of html.matchAll(/href="([^"]*)"/g)) {
        const h = m[1];
        if (h.startsWith("#")) continue;
        if (/^https:\/\//.test(h) || h.startsWith("mailto:")) continue;
        const slug = h.replace(/^\//, "").split(/[?#]/)[0];
        if (!(SYSTEM_PATHS.has(h.split(/[?#]/)[0]) || /^\/boutique(\/[a-z0-9\/-]*)?$/.test(h.split(/[?#]/)[0]) || pageKeys.has(slug))) problems.push(`${at} : lien mort « ${h} »`);
      }
      for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) problems.push(`${at} : image sans texte alternatif`);
      h1 += (html.match(/aria-level="1"/g) || []).length;
    }
    const nativeH1 = JSON.stringify(sections).includes('"level":"1"') ? 1 : 0;
    if (h1 + nativeH1 !== 1) problems.push(`${at} : ${h1 + nativeH1} titre(s) de niveau 1 (il en faut exactement un)`);
  }
  return problems;
}

// Ressemblance entre deux fiches : 0 = identiques, 1 = très différentes
const hue = (hex) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return 0; const d = mx - mn; const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return ((h * 60) + 360) % 360; };
function distance(a, b) {
  let d = 0;
  for (const k of ["header", "hero", "grid", "motion"]) if (a.dna[k] !== b.dna[k]) d += 0.2;
  if (a.tokens.fonts.heading !== b.tokens.fonts.heading) d += 0.15;
  if (a.tokens.fonts.body !== b.tokens.fonts.body) d += 0.05;
  const dh = Math.abs(hue(a.tokens.colors.primary) - hue(b.tokens.colors.primary)); d += Math.min(dh, 360 - dh) / 360 * 0.3;
  if (a.tokens.colors.background.toLowerCase() !== b.tokens.colors.background.toLowerCase()) d += 0.1;
  return Math.min(1, d);
}
// Les 8 axes de l'empreinte structurelle : navigation, hero, grille, paire typographique, formes, animation, rythme, composant signature
const AXES = ["header", "hero", "grid", "typo", "shapes", "motion", "rhythm", "signature"];
const axisValue = (s, k) => (k === "typo" ? `${s.tokens.fonts.heading}+${s.tokens.fonts.body}` : s.dna[k]);
const sharedAxes = (a, b) => AXES.filter((k) => axisValue(a, k) !== undefined && axisValue(a, k) === axisValue(b, k));
function auditDiversity(specs, min = 0.6, maxShared = 3) {
  const problems = [];
  for (const s of specs) for (const k of ["shapes", "rhythm", "signature"]) if (!s.dna[k]) problems.push(`${s.key} : axe « ${k} » manquant dans l'empreinte`);
  for (let i = 0; i < specs.length; i++) for (let j = i + 1; j < specs.length; j++) {
    const sh = sharedAxes(specs[i], specs[j]);
    if (sh.length > maxShared) problems.push(`${specs[i].key} et ${specs[j].key} partagent ${sh.length} axes sur 8 (${sh.join(", ")}) : maximum ${maxShared}`);
    if (axisValue(specs[i], "typo") === axisValue(specs[j], "typo")) problems.push(`${specs[i].key} et ${specs[j].key} utilisent la même paire typographique`);
    if (specs[i].tokens.colors.primary.toLowerCase() === specs[j].tokens.colors.primary.toLowerCase() && specs[i].tokens.colors.background.toLowerCase() === specs[j].tokens.colors.background.toLowerCase()) problems.push(`${specs[i].key} et ${specs[j].key} ont la même palette dominante`);
  }
  for (let i = 0; i < specs.length; i++) for (let j = i + 1; j < specs.length; j++) {
    const d = distance(specs[i], specs[j]);
    if (d < min) problems.push(`${specs[i].key} et ${specs[j].key} se ressemblent trop (distance ${d.toFixed(2)} < ${min})`);
    for (const k of ["header", "hero", "grid", "motion"]) if (specs[i].dna[k] === specs[j].dna[k]) problems.push(`${specs[i].key} et ${specs[j].key} partagent la même composition « ${k} » (${specs[i].dna[k]})`);
  }
  return problems;
}

module.exports = { auditPack, auditDiversity, distance, htmlNodes, AXES, sharedAxes };
