// Content Mapper — registre des champs TEXTE réels des sections natives (pages/sections.js). Un champ n'est écrit que s'il est déclaré ici ET accepté par le normaliseur natif :
// les tests rejouent chaque champ à travers `sections.normalizeSection`. Aucune propriété fictive, aucun style, aucune image, aucune adresse n'est jamais touché.
//   scalar : champ simple ; list : liste de textes (strings) ; items : liste d'objets dont seuls les sous-champs déclarés sont écrits.
//   never  : champs qui contiennent des FAITS ou des personnes (auteur, rôle, témoignage…) : jamais générés.
//   needs  : le champ n'est rempli que si la section possède déjà ce champ (ex. un bouton exige texte ET adresse : on ne crée pas une adresse).
const sectionsLib = require("../marketing/pages/sections");

const SPEC = Object.freeze({
  hero: { scalar: { title: { max: 150, line: true, label: "Titre principal" }, subtitle: { max: 300, label: "Sous-titre" }, buttonLabel: { max: 60, line: true, label: "Texte du bouton", needs: "buttonUrl" }, imageAlt: { max: 200, line: true, label: "Texte alternatif de l'image", needs: "image" } } },
  text: { scalar: { markdown: { max: 10000, label: "Texte", multiline: true } } },
  list: { scalar: { title: { max: 150, line: true, label: "Titre" } }, list: { items: { max: 200, maxCount: 20, label: "Points" } } },
  features: { scalar: { title: { max: 150, line: true, label: "Titre de section" }, intro: { max: 400, label: "Introduction" } }, items: { items: { fields: { title: { max: 80, line: true }, text: { max: 400 } }, maxCount: 12, label: "Cartes" } } },
  faq: { scalar: { title: { max: 150, line: true, label: "Titre" } }, items: { items: { fields: { q: { max: 200, line: true }, a: { max: 2000 } }, maxCount: 20, label: "Questions" } } },
  cta: { scalar: { title: { max: 150, line: true, label: "Titre" }, text: { max: 400, label: "Texte" }, buttonLabel: { max: 60, line: true, label: "Texte du bouton", needs: "buttonUrl" } } },
  form: { scalar: { heading: { max: 150, line: true, label: "Titre du formulaire" }, intro: { max: 400, label: "Introduction" } } },
  button: { scalar: { label: { max: 60, line: true, label: "Texte du bouton", needs: "url" } } },
  quote: { scalar: {}, never: ["text", "author"] },
  testimonials: { scalar: { title: { max: 150, line: true, label: "Titre du bloc" } }, never: ["items"] },
  image: { scalar: { alt: { max: 200, line: true, label: "Texte alternatif" }, caption: { max: 200, line: true, label: "Légende" } } },
  video: { scalar: { title: { max: 150, line: true, label: "Titre de la vidéo" }, caption: { max: 200, line: true, label: "Légende" } } },
  course: { scalar: { cta: { max: 60, line: true, label: "Texte du bouton" } } },
});
const supportedTypes = () => Object.keys(SPEC).filter((t) => Object.hasOwn(sectionsLib.TYPES, t));

// Texte propre : pas de caractères de contrôle ; champ « ligne » sur une seule ligne ; borné
function clean(v, f) {
  let s = typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").replace(/\r\n?/g, "\n").trim() : "";
  if (f.line) s = s.replace(/\s+/g, " ");
  return s.slice(0, f.max);
}

// Liste des champs d'une section (clé de champ stable = « <idSection>/<chemin> »), avec la valeur ACTUELLE dans la page
function describe(section) {
  const spec = SPEC[section.type];
  if (!spec || !section.id) return [];
  const out = [];
  for (const [name, f] of Object.entries(spec.scalar || {})) {
    if (f.needs && !section[f.needs]) continue;
    out.push({ key: `${section.id}/${name}`, sectionId: section.id, type: section.type, path: [name], label: f.label || name, max: f.max, line: Boolean(f.line), multiline: Boolean(f.multiline), current: String(section[name] ?? "") });
  }
  for (const [name, f] of Object.entries(spec.list || {})) (Array.isArray(section[name]) ? section[name] : []).slice(0, f.maxCount).forEach((v, i) => out.push({ key: `${section.id}/${name}.${i}`, sectionId: section.id, type: section.type, path: [name, i], label: `${f.label} ${i + 1}`, max: f.max, line: true, current: String(v ?? "") }));
  for (const [name, f] of Object.entries(spec.items || {})) (Array.isArray(section[name]) ? section[name] : []).slice(0, f.maxCount).forEach((it, i) => { for (const [sub, sf] of Object.entries(f.fields)) out.push({ key: `${section.id}/${name}.${i}.${sub}`, sectionId: section.id, type: section.type, path: [name, i, sub], label: `${f.label} ${i + 1} — ${sub}`, max: sf.max, line: Boolean(sf.line), current: String((it && it[sub]) ?? "") }); });
  return out;
}
const specFor = (type) => SPEC[type] || null;

// Écrit des valeurs dans une COPIE de la section : seuls les champs déclarés, jamais le reste (styles, images, adresses, identifiants…)
function write(section, values) {
  const next = JSON.parse(JSON.stringify(section));
  const spec = SPEC[section.type];
  if (!spec) return next;
  const applied = [];
  for (const [path, value] of values) {
    const [name, i, sub] = path;
    if (spec.scalar && spec.scalar[name] && path.length === 1) { const f = spec.scalar[name]; if (f.needs && !next[f.needs]) continue; next[name] = clean(value, f); applied.push(path); }
    else if (spec.list && spec.list[name] && path.length === 2 && Number.isInteger(i)) { const f = spec.list[name]; next[name] = Array.isArray(next[name]) ? next[name] : []; if (i <= next[name].length && i < f.maxCount) { next[name][i] = clean(value, { ...f, line: true }); applied.push(path); } }
    else if (spec.items && spec.items[name] && path.length === 3 && Number.isInteger(i) && spec.items[name].fields[sub]) { const f = spec.items[name]; next[name] = Array.isArray(next[name]) ? next[name] : []; if (i <= next[name].length && i < f.maxCount) { next[name][i] = { ...(next[name][i] || {}) }; next[name][i][sub] = clean(value, f.fields[sub]); applied.push(path); } }
  }
  return Object.assign(next, { __applied: applied.length });
}
const pathKey = (path) => path.join(".");
module.exports = { SPEC, supportedTypes, describe, write, clean, specFor, pathKey };
