// Content Quality Evaluator : 14 critères, chacun noté de 0 à 100 SEULEMENT s'il est évaluable avec les données présentes (sinon `score: null` et la raison).
// Le score global est la moyenne des critères évaluables et indique combien l'étaient. Ce n'est PAS une prédiction de classement Google : c'est un repère éditorial.
// Chaque problème porte : explication, priorité, recommandation, correction proposée (jamais appliquée ici), et bloquant ou facultatif.
// Réutilise les contrôles existants (contentGen/seo, contentGen/facts, contentGen/voice, seo/text) : aucun second moteur.
const seoLib = require("../contentGen/seo");
const factsLib = require("../contentGen/facts");
const voiceLib = require("../contentGen/voice");
const textLib = require("../seo/text");
const readability = require("./readability");
const intentLib = require("./intent");
const kindsLib = require("./kinds");
const { norm } = factsLib;

const CRITERIA = Object.freeze([
  ["relevance", "Pertinence par rapport à l'objectif"], ["intent", "Correspondance avec l'intention de recherche"], ["writing", "Qualité rédactionnelle"], ["clarity", "Clarté"], ["structure", "Structure"],
  ["consistency", "Cohérence éditoriale"], ["originality", "Originalité"], ["completeness", "Complétude"], ["information", "Qualité des informations"], ["seo", "Optimisation SEO"],
  ["readability", "Lisibilité"], ["cta", "Appels à l'action"], ["audience", "Adaptation à la cible"], ["brand", "Cohérence avec la marque"],
]);
const DISCLAIMER = "Repère éditorial calculé par Kolakisa sur ce contenu. Ce n'est pas une prédiction de classement ni une note de Google.";
// Formules creuses (fr, en) : détectées telles quelles, jamais jugées « fausses », seulement peu informatives
const FILLER = ["n'hésitez pas", "nhésitez pas", "solutions innovantes", "à la pointe", "de qualité", "sur mesure", "clé en main", "dans un monde en constante évolution", "au service de nos clients", "savoir-faire", "expertise reconnue", "satisfaction client", "passionnés", "cutting-edge", "state-of-the-art", "world-class", "innovative solutions", "don't hesitate", "one-stop shop", "tailor-made", "in today's fast-paced world"];
const GENERIC_CTA = ["cliquez ici", "en savoir plus", "lire la suite", "click here", "read more", "learn more", "submit", "valider", "envoyer", "ok"];
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

// Un problème. severity : blocking (empêche une publication de qualité) | important | optional. priority 1 (à traiter d'abord) à 3.
function issue(criterion, id, severity, explanation, recommendation, correction = null, extra = {}) {
  return { criterion, id, severity, priority: severity === "blocking" ? 1 : severity === "important" ? 2 : 3, blocking: severity === "blocking", explanation, recommendation, correction, ...extra };
}
const find = (haystack, list) => { const h = norm(haystack); return list.filter((p) => h.includes(norm(p))); };

// doc : document de text.js · opts : { kind, keyword, voice, facts, language, siblings:[{id,name,words,text}], audience, brand, isCta }
function evaluate(doc, opts = {}) {
  const lang = opts.language || "fr", voice = voiceLib.normalize(opts.voice || {}, voiceLib.DEFAULT), kindInfo = kindsLib.KINDS[opts.kind] || null;
  const keyword = String(opts.keyword || doc.seo.focusKeyword || "").trim();
  const issues = [], scores = {}, notes = {};
  const set = (key, score, why) => { scores[key] = score === null ? null : clamp(score); if (why) notes[key] = why; };
  const read = readability.analyze(doc, lang);
  const wc = doc.words.length;
  const hasText = wc >= 5;

  // 1 pertinence : le genre de page est connu et ses sections requises sont présentes
  if (!kindInfo) { set("relevance", null, "Genre de page non déterminé : déclarez-le pour évaluer la pertinence."); }
  else {
    const have = new Set(doc.types.concat(doc.faq.length ? ["faq"] : []));
    const lacking = kindInfo.requires.filter((t) => !have.has(t) && !(doc.origin === "text" && t === "text"));
    set("relevance", doc.origin === "text" ? 100 - (wc < kindInfo.minWords ? 25 : 0) : 100 - (lacking.length / Math.max(1, kindInfo.requires.length)) * 70 - (wc < kindInfo.minWords ? 15 : 0));
    for (const t of lacking) issues.push(issue("relevance", `missing_section_${t}`, "important", `Une ${kindInfo.label.toLowerCase()} comporte en général une section « ${t} », absente ici.`, `Ajouter une section « ${t} » (section native du CMS).`, null, { section: t }));
  }
  // 2 intention
  const intent = intentLib.analyze(keyword, { kind: opts.kind, city: (opts.facts || {}).city, brand: opts.brand });
  if (intent.basis === "no_keyword" || intent.intent === "undetermined") set("intent", null, intent.note);
  else { const m = intentLib.matchStructure(intent, doc); set("intent", m.ratio * 100, `Intention estimée : ${intent.label}.`);
    if (m.missing.length) issues.push(issue("intent", "intent_structure_gap", "optional", `Pour une intention ${intent.label.toLowerCase()}, la structure attendue comprend aussi : ${m.missing.join(", ")}.`, intent.structure.advice, null, { missing: m.missing })); }
  // 3 rédaction : répétitions, formules creuses, espaces réservés
  if (!hasText) set("writing", null, "Pas assez de texte.");
  else {
    const filler = find(doc.text, FILLER);
    const freq = new Map(); for (const w of doc.words.filter((x) => x.length > 4)) freq.set(w, (freq.get(w) || 0) + 1);
    const rep = [...freq].filter(([, n]) => wc >= 80 && n / wc > 0.04).map(([w]) => w);
    const startRepeat = (() => { const starts = doc.sentences.map((s) => s.split(/\s+/).slice(0, 2).join(" ").toLowerCase()); const c = new Map(); starts.forEach((s) => c.set(s, (c.get(s) || 0) + 1)); return [...c].filter(([, n]) => n >= 3).map(([s]) => s); })();
    set("writing", 100 - filler.length * 8 - rep.length * 6 - startRepeat.length * 6);
    if (filler.length) issues.push(issue("writing", "filler_phrases", "optional", `Formules peu informatives : ${filler.slice(0, 4).map((f) => `« ${f} »`).join(", ")}.`, "Remplacer par un fait précis fourni par vous (ce que vous faites, pour qui, comment).", null, { matches: filler }));
    if (rep.length) issues.push(issue("writing", "repeated_words", "optional", `Mots très répétés : ${rep.slice(0, 4).join(", ")}.`, "Varier le vocabulaire ou fusionner les passages redondants.", null, { matches: rep }));
    if (startRepeat.length) issues.push(issue("writing", "repeated_openings", "optional", `Plusieurs phrases commencent de la même façon : « ${startRepeat[0]} … ».`, "Varier les débuts de phrase.", null, { matches: startRepeat }));
  }
  // 4 clarté et 11 lisibilité (même mesure, lectures différentes)
  if (!read.evaluable) { set("clarity", null, read.reason); set("readability", null, read.reason); }
  else {
    set("clarity", 100 - read.longRatio * 100 - Math.max(0, read.avgSentence - 22) * 2);
    set("readability", read.index === null ? null : read.index + 20, read.index === null ? "Pas d'indice validé pour cette langue : mesures seulement." : `Indice ${read.index}/100 (${read.level}).`);
    if (read.longRatio > 0.25) issues.push(issue("clarity", "long_sentences", "important", `${read.longSentences} phrase(s) de plus de 30 mots sur ${read.sentences}.`, "Couper les phrases longues : une idée par phrase.", null, { measure: read }));
    if (read.index !== null && read.index < 30 && voice.vocabulary !== "expert") issues.push(issue("readability", "hard_to_read", "important", `Texte difficile à lire (indice ${read.index}/100) pour une voix de vocabulaire « ${voice.vocabulary} ».`, "Raccourcir les phrases et simplifier le vocabulaire (ou régler la voix du site sur « expert »).", null, { measure: read }));
  }
  // 5 structure
  const st = seoLib.checkStructure(doc.sections.length ? doc.sections : (doc.headings.length ? [{ type: "hero", title: doc.h1, id: "t" }] : []));
  if (doc.origin === "text") {
    const hh = doc.headings, h1 = hh.filter((h) => h.level === 1).length, long = wc > 300 && hh.filter((h) => h.level >= 2).length === 0;
    set("structure", 100 - (h1 === 0 ? 25 : 0) - (h1 > 1 ? 15 : 0) - (long ? 25 : 0));
    if (!h1) issues.push(issue("structure", "no_h1", "important", "Aucun titre principal (H1).", "Ajouter un titre qui annonce le sujet."));
    if (long) issues.push(issue("structure", "long_without_headings", "important", `${wc} mots sans intertitre.`, "Découper avec des intertitres (H2)."));
  } else {
    const bad = st.issues.filter((i) => i.severity !== "suggestion");
    set("structure", 100 - bad.length * 20);
    for (const i of st.issues) issues.push(issue("structure", i.code, i.severity === "important" ? "important" : "optional", i.message, i.code === "seo_no_h1" ? "Ajouter un bandeau avec un titre." : "Corriger la hiérarchie des titres.", null, { section: (i.field || "").replace(/\/$/, "") || null }));
  }
  // 6 cohérence éditoriale : adresse, longueur des phrases attendue
  if (!hasText) set("consistency", null, "Pas assez de texte.");
  else {
    let s = 100; const addr = voiceLib.addressIssues(doc.text, voice);
    if (addr) { s -= 40; issues.push(issue("consistency", "address_mismatch", "important", `${addr[0].toUpperCase()}${addr.slice(1)}.`, "Harmoniser l'adresse au lecteur avec la voix du site.")); }
    if (read.evaluable) { const target = { courtes: 15, moyennes: 22, longues: 30 }[voice.sentences]; if (read.avgSentence > target + 8) { s -= 20; issues.push(issue("consistency", "sentences_longer_than_voice", "optional", `Phrases de ${read.avgSentence} mots en moyenne ; la voix du site vise « ${voice.sentences} » (environ ${target}).`, "Raccourcir pour rester dans la voix du site.")); } }
    set("consistency", s);
  }
  // 7 originalité : ressemblance avec les AUTRES pages du même site (jamais avec le web : non mesurable ici)
  const sibs = Array.isArray(opts.siblings) ? opts.siblings : [];
  if (!sibs.length || wc < 40) set("originality", null, "Aucune autre page du site à comparer, ou texte trop court. La comparaison avec le reste du web n'est pas mesurable dans Kolakisa.");
  else {
    const mine = textLib.normalizeWords(doc.text); let best = { sim: 0 };
    for (const o of sibs) { const sim = textLib.similarity(mine, textLib.normalizeWords(o.text || "")); if (sim > best.sim) best = { sim, page: o }; }
    set("originality", 100 - Math.min(100, best.sim * 160), "Comparaison avec les autres pages du site uniquement.");
    if (best.sim >= 0.35) issues.push(issue("originality", "near_duplicate", best.sim >= 0.6 ? "blocking" : "important", `Texte proche à ${Math.round(best.sim * 100)} % de « ${best.page.name} » (méthode : bardeaux de 5 mots).`, "Différencier ce contenu, le fusionner avec l'autre page, ou indiquer une canonical.", null, { with: best.page.id, similarity: Math.round(best.sim * 100) / 100 }));
  }
  // 8 complétude : espaces réservés restants, volume attendu
  const placeholders = (doc.text.match(/\[[^\]\n]{1,80}\]/g) || []).filter((p) => /compl|todo|à remplir|to fill|placeholder/i.test(p));
  const lorem = /lorem ipsum|texte à venir|coming soon|à rédiger/i.test(doc.text);
  if (!hasText && !doc.types.length) set("completeness", null, "Contenu vide.");
  else {
    let s = 100 - placeholders.length * 12 - (lorem ? 40 : 0); if (kindInfo && wc < kindInfo.minWords) s -= Math.min(30, ((kindInfo.minWords - wc) / kindInfo.minWords) * 40);
    set("completeness", s, kindInfo ? `Longueur de repère pour ce genre : environ ${kindInfo.minWords} mots (indicatif).` : null);
    if (placeholders.length) issues.push(issue("completeness", "placeholders_left", "blocking", `${placeholders.length} information(s) à compléter encore présente(s) dans le texte.`, "Renseigner chaque information manquante avant publication.", null, { matches: placeholders.slice(0, 10) }));
    if (lorem) issues.push(issue("completeness", "filler_text", "blocking", "Texte provisoire détecté (« lorem ipsum », « à rédiger », « coming soon »).", "Remplacer par le contenu réel."));
    if (kindInfo && wc < kindInfo.minWords * 0.5 && doc.origin === "text") issues.push(issue("completeness", "thin_content", "optional", `${wc} mots pour ${kindInfo.minWords} de repère.`, "Développer seulement si le sujet le demande : la longueur n'est pas un but."));
  }
  // 9 qualité des informations : affirmations et chiffres non étayés par les faits fournis (à VÉRIFIER, jamais déclarés faux)
  if (!hasText) set("information", null, "Pas assez de texte.");
  else {
    const ctxFacts = factsLib.buildContext({ facts: Object.entries(opts.facts || {}).map(([key, value]) => ({ key, value, source: "user" })), language: lang });
    const g = factsLib.guard(doc.text, ctxFacts);
    const claims = g.claims, numbers = g.replaced.filter((r) => r.kind === "number" || r.kind === "year");
    set("information", 100 - claims.length * 18 - Math.min(30, numbers.length * 4), "Affirmations à justifier selon les informations fournies sur l'entreprise.");
    for (const c of claims) issues.push(issue("information", `unverified_claim_${c.kind.replace(/\W+/g, "_")}`, "important", `Affirmation non étayée par vos informations : « ${c.match} » (${c.kind}).`, "Conserver seulement si c'est exact et prouvable ; ajouter l'information correspondante dans les faits du site, sinon retirer.", null, { match: c.match, kind: c.kind }));
    if (numbers.length) issues.push(issue("information", "numbers_to_verify", "optional", `${numbers.length} chiffre(s) ou année(s) absents des informations fournies : ${numbers.slice(0, 5).map((n) => n.match).join(", ")}.`, "Vérifier chaque chiffre ; ajouter la source dans les faits du site.", null, { matches: numbers.map((n) => n.match) }));
  }
  // 10 SEO : réutilise checkMeta
  const meta = seoLib.checkMeta({ title: doc.seo.title, description: doc.seo.description, slug: opts.slug }, { bodyText: doc.text, keyword, h1: doc.h1 });
  {
    const penalty = { critical: 30, important: 18, improve: 8, suggestion: 4 };
    set("seo", 100 - meta.reduce((n, i) => n + (penalty[i.severity] || 0), 0), keyword ? null : "Aucun mot-clé principal : correspondances mot-clé non évaluées.");
    for (const i of meta) issues.push(issue("seo", i.code, i.severity === "critical" ? "blocking" : i.severity === "important" ? "important" : "optional", i.message, "Corriger la métadonnée signalée.", null, { certain: i.certain }));
    for (const im of doc.images.filter((x) => !x.alt)) issues.push(issue("seo", "image_alt_missing", "important", "Image sans texte alternatif.", "Décrire l'image (alt vide seulement si elle est décorative).", null, { section: im.section || null }));
  }
  // 12 appels à l'action
  if (!kindInfo) set("cta", null, "Genre de page non déterminé.");
  else if (kindInfo.cta === "optional" && !doc.ctas.length) set("cta", null, "Appel à l'action facultatif pour ce genre de page.");
  else {
    const generic = doc.ctas.filter((c) => GENERIC_CTA.includes(norm(c.label).trim()));
    let s = doc.ctas.length ? 100 - generic.length * 25 : (kindInfo.cta === "required" ? 30 : 100);
    set("cta", s);
    if (!doc.ctas.length && kindInfo.cta === "required") issues.push(issue("cta", "cta_missing", "important", `Une ${kindInfo.label.toLowerCase()} gagne à proposer une action claire ; aucun bouton trouvé.`, "Ajouter un bouton dont le libellé décrit l'action (ex. « Demander un devis »)."));
    for (const c of generic) issues.push(issue("cta", "cta_generic", "optional", `Libellé de bouton générique : « ${c.label} ».`, "Nommer l'action ou le bénéfice.", null, { section: c.section }));
  }
  // 13 cible : vocabulaire vs lisibilité, selon la cible DÉCLARÉE
  if (!opts.audience) set("audience", null, "Aucune cible déclarée.");
  else if (!read.evaluable || read.index === null) set("audience", null, "Mesure de lisibilité indisponible.");
  else {
    const wantEasy = voice.vocabulary === "simple" || /grand public|debutant|particulier|beginner|general/.test(norm(opts.audience));
    const gap = wantEasy ? Math.max(0, 55 - read.index) : voice.vocabulary === "expert" ? 0 : Math.max(0, 35 - read.index);
    set("audience", 100 - gap * 2, `Cible déclarée : ${opts.audience}.`);
    if (gap > 10) issues.push(issue("audience", "level_vs_audience", "optional", `Le niveau de langue (indice ${read.index}/100) semble élevé pour la cible « ${opts.audience} ».`, "Simplifier le vocabulaire et raccourcir les phrases."));
  }
  // 14 marque : termes à éviter, termes du secteur, nom de l'entreprise
  if (!hasText) set("brand", null, "Pas assez de texte.");
  else {
    const avoid = find(doc.text, voice.avoid || []);
    let s = 100 - avoid.length * 20;
    if (avoid.length) issues.push(issue("brand", "avoided_terms", "important", `Termes que la voix du site demande d'éviter : ${avoid.map((a) => `« ${a} »`).join(", ")}.`, "Les remplacer par la terminologie préférée du site.", null, { matches: avoid }));
    if (opts.brand && wc >= 100 && !norm(doc.text).includes(norm(opts.brand))) { s -= 10; issues.push(issue("brand", "brand_name_absent", "optional", `Le nom « ${opts.brand} » n'apparaît pas dans le texte.`, "Le citer au moins une fois si le contexte s'y prête.")); }
    set("brand", s);
  }

  if (!doc.words.length && !doc.types.length && !doc.headings.length) {
    // rien à évaluer : aucune note n'est fabriquée à partir d'un contenu vide
    const empty = issue("completeness", "empty_content", "blocking", "Le contenu est vide.", "Rédiger le contenu avant toute analyse.");
    return { global: null, evaluable: 0, total: CRITERIA.length, disclaimer: DISCLAIMER, criteria: CRITERIA.map(([key, label]) => ({ key, label, score: null, note: "Contenu vide." })), issues: [empty], blocking: 1, optional: 0, intent: { intent: intent.intent, label: intent.label, basis: intent.basis }, readability: read, words: 0, kind: opts.kind || null };
  }
  const evaluated = CRITERIA.filter(([k]) => scores[k] !== null && scores[k] !== undefined);
  const global = evaluated.length ? clamp(evaluated.reduce((n, [k]) => n + scores[k], 0) / evaluated.length) : null;
  for (const i of issues) if (!i.correction) i.correction = propose(i, doc, opts);
  const order = { blocking: 0, important: 1, optional: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  return {
    global, evaluable: evaluated.length, total: CRITERIA.length, disclaimer: DISCLAIMER,
    criteria: CRITERIA.map(([key, label]) => ({ key, label, score: scores[key] ?? null, note: notes[key] || null })),
    issues, blocking: issues.filter((i) => i.blocking).length, optional: issues.filter((i) => i.severity === "optional").length,
    intent: { intent: intent.intent, label: intent.label, basis: intent.basis }, readability: read, words: wc, kind: opts.kind || null,
  };
}
// Corrections PROPOSÉES (jamais appliquées ici) : uniquement celles qu'on peut dériver du contenu existant, sans rien inventer
function propose(i, doc, opts) {
  const cut = (t, n) => { const s = String(t).replace(/\s+/g, " ").trim(); if (s.length <= n) return s; const c = s.slice(0, n); const at = Math.max(c.lastIndexOf(". "), c.lastIndexOf(" ")); return `${c.slice(0, at > n * 0.5 ? at : n).replace(/[\s,;:.]+$/, "")}…`; };
  if (i.id === "seo_desc_missing" && doc.sentences.length) return { type: "set_field", field: "seo.description", value: cut(doc.sentences.slice(0, 2).join(" "), 155), note: "Extrait de votre texte ; à relire." };
  if (i.id === "seo_title_missing" && doc.h1) return { type: "set_field", field: "seo.title", value: cut(doc.h1, 60), note: "Repris de votre titre principal." };
  if (i.id === "seo_title_long" || i.id === "seo_title_too_long") return { type: "set_field", field: "seo.title", value: cut(doc.seo.title || "", 60), note: "Coupé à 60 caractères : relisez la fin." };
  if (i.id === "seo_desc_too_long") return { type: "set_field", field: "seo.description", value: cut(doc.seo.description || "", 155), note: "Coupé à 155 caractères : relisez la fin." };
  if (i.id === "cta_generic" && ["contact", "service", "landing", "product"].includes(opts.kind)) return { type: "set_field", field: `${i.section || ""}/buttonLabel`, value: "Nous contacter", note: "Libellé neutre qui ne promet rien ; remplacez-le par l'action réelle (devis, réservation…)." };
  if (i.id === "long_sentences" || i.id === "hard_to_read" || i.id === "filler_phrases" || i.id === "avoided_terms") return { type: "rewrite", op: i.id === "avoided_terms" ? "tone" : "simplify", note: "Proposition via l'assistant d'optimisation (avant/après, rien n'est remplacé sans votre accord)." };
  if (i.id === "numbers_to_verify" || i.id.startsWith("unverified_claim")) return { type: "ask", note: "Confirmez l'information (ou fournissez la preuve) ; sinon retirez l'affirmation." };
  return null;
}
module.exports = { evaluate, propose, CRITERIA, DISCLAIMER, FILLER, GENERIC_CTA, issue };
