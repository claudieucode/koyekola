// Programme 22.1 — LABORATOIRE de qualité des sites générés. Il enchaîne, sur un VRAI serveur (vraie base, vrai rendu public), les moteurs déterministes de Kolakisa pour 15 scénarios de référence :
//   parcours guidé (catalogue 20.6) → plan → Page Generator (21.4) → Direction artistique (21.5) → publication native → lecture de la page publique → analyse statique + notation (grille §16).
// Aucun fournisseur d'IA n'est appelé (aucun coût) : ce qui dépend d'un modèle (compréhension réelle d'un brief, qualité rédactionnelle, images) n'est PAS noté comme réussi — il est déclaré non mesuré.
const { startServer, loginInstructor, Client } = require("../helpers");
const { TEST_KEY } = require("../marketing-helpers");
const catalog = require("../../src/siteWizard/catalog");
const planLib = require("../../src/pageGen/plan");
const briefLib = require("../../src/marketing/ai/builder/brief");
const locale = require("../../src/marketing/ai/builder/locale");
const registry = require("../../src/marketing/ai/builder/registry");
const sections = require("../../src/marketing/pages/sections");
const { SCENARIOS, BRIEF_CASES } = require("./scenarios");
const { analyzePage, inventedClaims, grade } = require("./audit");

const R = "/marketing/site-web";
// Copie de la table du Page Generator (pageGen/index.js : TYPE_OF) — le laboratoire mesure ce que le parcours guidé produit réellement
const TYPE_OF = { accueil: "accueil", "a-propos": "apropos", services: "services", realisations: "realisations", blog: "blog", contact: "contact", tarifs: "tarifs", faq: "faq", temoignages: "temoignages", formations: "formation", programme: "formation", catalogue: "formation", enseignants: "equipe", biens: "immobilier", carte: "services", chambres: "services", missions: "apropos", adherer: "autre", inscription: "autre", merci: "autre", rdv: "contact" };
const EQUIV = { galerie: ["realisations"], realisations: ["galerie"], boutique: ["catalogue", "formation"], catalogue: ["boutique"] };
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// ───────────── Brief Analyzer : parties déterministes et garde-fous (le modèle est SIMULÉ) ─────────────
function briefAudit() {
  const cases = BRIEF_CASES.map((c) => {
    const out = { id: c.id, kind: c.kind, chars: c.text.length };
    try { briefLib.precheck(c.text); out.accepted = true; } catch (e) { out.accepted = false; out.refusal = e.code || e.message; }
    out.country = locale.detectCountry(c.text) || ""; out.language = locale.detectLanguage(c.text).code;
    out.contradictions = briefLib.ruleContradictions(c.text).map((x) => x.code);
    return out;
  });
  // Un modèle qui INVENTE : tous les faits « explicit » avec une citation absente du brief + une fonctionnalité/type inconnus. Le serveur doit tout déclasser et ne rien inventer.
  const text = "Je veux un site pour mon cabinet.";
  const fake = { name: { value: "ACME Corporation", status: "explicit", evidence: "ACME Corporation", confidence: 1 }, sector: { value: "aérospatiale", status: "explicit", evidence: "aérospatiale", confidence: 1 }, audience: { value: "ministères", status: "explicit", evidence: "ministères", confidence: 1 }, city: { value: "Tokyo", status: "explicit", evidence: "Tokyo", confidence: 1 }, siteType: { value: "licorne", status: "explicit", evidence: "licorne", confidence: 1 }, features: [{ key: "teleportation", status: "explicit", evidence: "teleportation", confidence: 1 }] };
  const n = briefLib.normalize(fake, text);
  const facts = [n.project.name, n.project.sector, n.project.audience, n.project.city];
  const guards = { invented: facts.length, downgraded: facts.filter((f) => f.status !== "explicit").length, retainedWithValue: facts.filter((f) => f.value).length, retainedConfidence: facts.map((f) => f.confidence), unknownTypeRejected: n.project.siteType.value !== "licorne", unknownFeatureDropped: n.features.length === 0, confidenceCapped: facts.every((f) => f.confidence <= 0.8) };
  return { cases, guards, readinessOfInventedBrief: n.readiness.level };
}

// ───────────── Un scénario ─────────────
async function runScenario({ srv, boss, db, anon }, sc, bGuards) {
  const t0 = Date.now(), timings = {};
  const cat = catalog.category(sc.wizard);
  const planPages = cat.pages.map((p) => ({ key: p.key, name: p.name, type: TYPE_OF[p.key] || "autre" }));
  const types = planPages.map((p) => p.type);
  const plan = planLib.planFor({ siteName: sc.label, description: sc.brief.split(".")[0], pages: planPages });
  const mk = async (name) => Number((await boss.post(`${R}/sites`, { name })).location.match(/(\d+)(#.*)?$/)[1]);
  const siteId = await mk(`${sc.label} (labo 22.1)`);

  // Direction artistique (déterministe, sans IA)
  let t = Date.now();
  const dr = await boss.post(`${R}/sites/${siteId}/direction-artistique/generer`, { brief: sc.design.text, category: sc.design.category, sector: sc.design.sector, country: sc.design.country, lang: sc.design.lang });
  timings.designMs = Date.now() - t;
  const drId = Number((dr.location || "").match(/(\d+)$/)?.[1] || 0);
  const run = drId ? db.prepare("SELECT proposals FROM mk_design_runs WHERE id = ?").get(drId) : null;
  const proposals = run ? JSON.parse(run.proposals) : [];
  if (proposals.length) await boss.post(`${R}/sites/${siteId}/direction-artistique/${drId}/appliquer`, { variante: proposals[0].key });

  // Pages
  t = Date.now();
  const gr = await boss.post(`${R}/sites/${siteId}/generateur/generer`, { plan: JSON.stringify(plan) });
  timings.generateMs = Date.now() - t;
  const rid = Number((gr.location || "").match(/(\d+)$/)?.[1] || 0);
  t = Date.now();
  // Un site neuf reçoit des pages de même nom que celles d'autres sites : le moteur impose alors un choix explicite (« nouvelle page ») — le laboratoire le fait pour toutes les pages
  let applyFlash = "";
  if (rid) { const ap = await boss.post(`${R}/sites/${siteId}/generateur/${rid}/appliquer`, Object.fromEntries(plan.pages.map((p) => [`strategie_${p.key}`, "create"]))); applyFlash = ap.status === 302 ? "" : String(ap.status); }
  timings.applyMs = Date.now() - t;
  const rows = db.prepare("SELECT id, name, slug, draft FROM mk_landing_pages WHERE site_id = ? ORDER BY id").all(siteId);
  const pubStart = Date.now(); const published = [];
  for (const r of rows) { const p = await boss.request(`/marketing/pages/${r.id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } }); let msg = ""; try { const j = JSON.parse(p.text); const e = j.error; msg = String((e && (e.message || e.code)) || e || j.message || ""); } catch { msg = p.text.slice(0, 120); } published.push({ id: r.id, name: r.name, status: p.status, message: p.status >= 400 ? msg : "", needsForm: p.status >= 400 && /formulaire/i.test(msg) }); }
  timings.publishMs = Date.now() - pubStart;
  const slugs = db.prepare("SELECT id, name, slug, draft, sections FROM mk_landing_pages WHERE site_id = ? ORDER BY id").all(siteId);

  // Lecture publique + analyse
  const pagesOut = [];
  for (const r of slugs) {
    const secs = (() => { try { return JSON.parse(r.draft || r.sections || "{}").sections || JSON.parse(r.sections || "[]"); } catch { return []; } })();
    const pub = published.find((x) => x.id === r.id);
    if (pub && pub.status >= 400) { pagesOut.push({ name: r.name, slug: r.slug, status: 0, unpublished: pub, ms: 0, sectionTypes: secs.map((x) => x.type), sectionBackgrounds: secs.map((x) => (x.style && x.style.background) || "default"), analysis: null }); continue; }
    const ms = []; let res;
    for (let i = 0; i < 5; i++) { const s = Date.now(); res = await anon.get(`/p/${r.slug}`); ms.push(Date.now() - s); }
    const a = res.status === 200 ? analyzePage(res.text) : null;
    pagesOut.push({ name: r.name, slug: r.slug, status: res.status, ms: median(ms), sectionTypes: secs.map((s) => s.type), sectionBackgrounds: secs.map((s) => (s.style && s.style.background) || "default"), analysis: a });
  }
  const ok = pagesOut.filter((p) => p.analysis);
  const unpub = pagesOut.filter((p) => p.unpublished);
  // CSS (responsive) : les feuilles liées à la 1re page rendue
  let mediaQueries = 0, imgFluid = false, cssBytes = 0;
  if (ok[0]) for (const href of ok[0].analysis.cssLinks.slice(0, 4)) { const c = await anon.get(href.startsWith("http") ? new URL(href).pathname : href); if (c.status === 200) { cssBytes += c.text.length; mediaQueries += (c.text.match(/@media/g) || []).length; imgFluid = imgFluid || /img[^{]*\{[^}]*max-width:\s*100%/i.test(c.text); } }
  // Liens internes (échantillon de la 1re page)
  const linkChecks = []; if (ok[0]) for (const h of [...new Set(ok[0].analysis.internalLinks)].slice(0, 12)) { const l = await anon.get(h.split("#")[0] || "/"); linkChecks.push({ href: h, status: l.status }); }

  // ── Notation ──
  const home = ok.find((p) => /^accueil$/i.test(p.name)) || ok[0];
  const allText = ok.map((p) => p.analysis.text).join(" ");
  const claims = inventedClaims(allText);
  const essentialFound = sc.essential.filter((e) => types.includes(e) || (EQUIV[e] || []).some((x) => types.includes(x)));
  const essentialNeedingShop = sc.shop ? ["panier", "commande", "fiche-produit"] : [];
  const essentialScope = sc.essential.filter((e) => !essentialNeedingShop.includes(e));
  const covered = essentialScope.filter((e) => types.includes(e) || (EQUIV[e] || []).some((x) => types.includes(x)));
  const unrelated = [...new Set(types)].filter((x) => ![...sc.essential, ...sc.allowed].includes(x) && x !== "autre");
  const wrongModule = (types.includes("formation") && !sc.essential.includes("formation") && !(sc.allowed.includes("formation"))) ? ["formation"] : [];
  const parts = {};
  const g = briefAuditCache;
  const country = locale.detectCountry(sc.brief) || "", lang = locale.detectLanguage(sc.brief).code;
  const briefPts = [country === sc.expect.country, lang === "fr", g.guards.downgraded === g.guards.invented, briefLib.ruleContradictions(sc.brief).length === 0].filter(Boolean).length;
  parts.brief = { got: briefPts, measured: 4, notes: [`pays détecté par règles : ${country || "—"} (attendu ${sc.expect.country})`, `langue du brief : ${lang}`, "compréhension réelle (secteur, public, fonctionnalités) : NON MESURÉE — dépend du modèle d'IA"] };
  parts.architecture = { got: 6 * (essentialScope.length ? covered.length / essentialScope.length : 1) + 2 * (1 - Math.min(1, unrelated.length / 2)) + (wrongModule.length ? 0 : 2), measured: 10, notes: [`pages : ${planPages.map((p) => p.name).join(", ")}`, `essentielles couvertes : ${covered.length}/${essentialScope.length}${essentialScope.length === covered.length ? "" : ` (manquent : ${essentialScope.filter((e) => !covered.includes(e)).join(", ")})`}`, unrelated.length ? `pages peu pertinentes : ${unrelated.join(", ")}` : "aucune page hors sujet", wrongModule.length ? "type de page « formation » appliqué à un projet qui ne vend pas de formations" : ""].filter(Boolean) };
  // Visuel (proxy structurel)
  const contrastOk = proposals.length ? proposals.filter((p) => p.report && p.report.ok).length / proposals.length : 0;
  const hues = new Set(proposals.map((p) => p.design && p.design.palette && p.design.palette.primary)); const fonts = new Set(proposals.map((p) => JSON.stringify(p.design && p.design.typography || p.design && p.design.fonts || "")));
  const dirDiv = proposals.length >= 2 ? (hues.size >= 2 || fonts.size >= 2 ? 1 : 0) : 0;
  const types2 = home ? home.sectionTypes : []; const variety = types2.length ? new Set(types2).size / types2.length : 0;
  const bgs = home ? home.sectionBackgrounds : []; const alt = bgs.length > 1 ? bgs.slice(1).filter((b, i) => b !== bgs[i]).length / (bgs.length - 1) : 0;
  const hasHero = types2.includes("hero"); const h = home && home.analysis;
  parts.visuel = { got: 3 * contrastOk + 2 * dirDiv + (hasHero ? 1.5 : 0) + 2 * Math.min(1, variety / 0.6) + 1.5 * Math.min(1, alt / 0.5) + (h && h.h1 === 1 && h.headingOrderOk ? 2 : 0), measured: 12, notes: [`contrastes des ${proposals.length} directions vérifiés : ${round(contrastOk * 100, 0)} %`, `variété des sections de l'accueil : ${round(variety, 2)} (${types2.join(" > ")})`, `alternance des fonds : ${round(alt, 2)}`, "jugement esthétique (originalité, harmonie, personnalité) : NON MESURÉ — aucun navigateur ni évaluation humaine dans ce palier"] };
  const secTotal = ok.reduce((a, p) => a + p.sectionTypes.length, 0), ph = ok.reduce((a, p) => a + p.analysis.placeholders, 0);
  const phRatio = secTotal ? Math.min(1, ph / secTotal) : 1;
  parts.sections = { got: 3 + 4 * (1 - phRatio) + 3 * (ok.length ? ok.filter((p) => p.analysis.words > 40).length / ok.length : 0), measured: 10, notes: [`${secTotal} sections, ${ph} textes d'exemple entre crochets (${round(phRatio * 100, 0)} %)`, `pages de plus de 40 mots : ${ok.filter((p) => p.analysis.words > 40).length}/${ok.length}`] };
  const words = ok.reduce((a, p) => a + p.analysis.words, 0);
  parts.contenus = { got: (claims.length ? 0 : 2) + 2 * (1 - Math.min(1, (ph * 4) / Math.max(1, words) / 0.3)), measured: 4, notes: [claims.length ? `affirmations non sourcées détectées : ${claims.join(" ")}` : "aucune statistique, certification ou promesse inventée", `${words} mots rendus, dont ${ph} blocs d'exemple`, "qualité rédactionnelle réelle : NON MESURÉE — le contenu rédigé par IA n'est pas généré dans le laboratoire"] };
  const imgs = ok.reduce((a, p) => a + p.analysis.images, 0), noAlt = ok.reduce((a, p) => a + p.analysis.imagesNoAlt, 0);
  parts.medias = { got: imgs ? 5 * (1 - noAlt / imgs) : 0, measured: 5, notes: [imgs ? `${imgs} images, ${noAlt} sans attribut alt` : "AUCUNE image dans le site généré (le Media Generator est une étape séparée)", "pertinence, cadrage, cohérence stylistique : NON MESURÉS"] };
  const vp = ok.length ? ok.every((p) => p.analysis.viewport) : false;
  parts.responsive = { got: (vp ? 1.5 : 0) + (mediaQueries >= 2 ? 2 : mediaQueries ? 1 : 0) + (imgFluid ? 1 : 0) + (ok.every((p) => !/width:\s*[6-9]\d\dpx|width:\s*\d{4}px/.test(p.analysis.text)) ? 0.5 : 0), measured: 5, notes: [`balise viewport : ${vp ? "oui" : "non"} · règles @media dans le CSS : ${mediaQueries} · images fluides : ${imgFluid ? "oui" : "non"}`, "rendu réel mobile/tablette (débordements, texte coupé) : NON MESURÉ — Chrome absent"] };
  // nav : observé mais NON noté (ce chemin n'exécute pas l'étape « menu » du studio)
  const nav = home && home.analysis.landmarks.nav; const broken = linkChecks.filter((l) => l.status >= 400);
  const cta = home && (home.analysis.buttons > 0);
  const contactPage = ok.find((p) => /contact|rendez/i.test(p.name)); const contactForm = contactPage ? contactPage.analysis.formFields > 0 : null;
  parts.ux = { got: 2 * (linkChecks.length ? 1 - broken.length / linkChecks.length : 0) + (cta ? 1.5 : 0) + (contactForm === null ? 0 : contactForm ? 1 : 0), measured: 4.5, notes: [`menu de navigation dans la page : ${nav ? "oui" : "non (non noté)"} · liens internes testés : ${linkChecks.length}, cassés : ${broken.length}${broken.length ? ` (${broken.map((b) => `${b.href}→${b.status}`).join(", ")})` : ""}`, `appel à l'action sur l'accueil : ${cta ? "oui" : "non"} · formulaire sur la page de contact : ${contactForm === null ? (unpub.some((p) => /contact/i.test(p.name)) ? "page de contact NON PUBLIABLE sans formulaire associé" : "pas de page contact") : contactForm ? "oui" : "NON"}`] };
  const seoPts = (a) => (a.title ? 0.5 : 0) + (a.description ? 0.5 : 0) + (a.h1 === 1 ? 1 : 0) + (a.lang ? 0.5 : 0) + (a.canonical ? 0.5 : 0) + (a.imagesNoAlt === 0 ? 0.5 : 0) + (a.formFields === a.formFieldsLabelled ? 0.5 : 0) + (a.landmarks.main && a.landmarks.nav && a.landmarks.footer ? 0.5 : 0) + (a.jsonld > 0 ? 0.5 : 0);
  parts.seoa11y = { got: ok.length ? ok.reduce((a, p) => a + seoPts(p.analysis), 0) / ok.length : 0, measured: 5, notes: [`pages avec exactement un h1 : ${ok.filter((p) => p.analysis.h1 === 1).length}/${ok.length}`, `meta description : ${ok.filter((p) => p.analysis.description).length}/${ok.length} · canonical : ${ok.filter((p) => p.analysis.canonical).length}/${ok.length} · JSON-LD : ${ok.filter((p) => p.analysis.jsonld > 0).length}/${ok.length}`, "conformité WCAG : NON ÉVALUÉE (audit statique partiel, pas de lecteur d'écran ni de clavier)"] };
  const ttfb = median(ok.map((p) => p.ms)), kb = home ? home.analysis.bytes / 1024 : 0;
  parts.perf = { got: (ttfb < 250 ? 2 : ttfb < 600 ? 1 : 0) + (kb < 150 ? 1.5 : kb < 400 ? 0.75 : 0) + ((home ? home.analysis.scripts : 99) <= 8 ? 1 : 0) + ((home ? home.analysis.cssLinks.length : 9) <= 4 ? 0.5 : 0), measured: 5, notes: [`temps de réponse médian ${ttfb} ms (machine partagée, charge variable) · accueil ${round(kb, 1)} Ko · ${home ? home.analysis.scripts : "?"} balises script · CSS ${round(cssBytes / 1024, 1)} Ko`, "Lighthouse / Core Web Vitals : NON EXÉCUTÉS (Chrome absent)"] };

  // Défaillances critiques (plafonnent le statut)
  const critical = [];
  if (!pagesOut.length) critical.push(`aucune page générée${applyFlash ? ` (application : HTTP ${applyFlash})` : ""}`);
  if (ok.some((p) => p.status !== 200)) critical.push("page publiée illisible (statut ≠ 200)");
  const refused = unpub.filter((p) => !p.unpublished.needsForm); if (refused.length) critical.push(`publication refusée : ${refused.map((p) => `${p.name} (${p.unpublished.message})`).join(", ")}`);
  if (broken.length) critical.push(`${broken.length} lien(s) interne(s) cassé(s) sur l'accueil`);
  if (claims.length) critical.push("affirmations commerciales/médicales non sourcées dans le contenu généré");
  if (sc.shop && (wrongModule.length || !types.includes("boutique"))) critical.push("parcours d'achat non démontré : le parcours guidé crée un « catalogue » de FORMATIONS, sans fiche produit, panier ni commande de produits");
  const fb = registry.feature("boutique"); if (sc.shop && fb.status !== "available") critical.push(`le planificateur déclare la boutique « ${fb.status} »`);
  const score = grade(parts, critical);
  return { id: sc.id, label: sc.label, siteId, wizard: sc.wizard, unpublished: unpub.map((p) => ({ name: p.name, reason: p.unpublished.message, needsForm: p.unpublished.needsForm })), pages: pagesOut.map((p) => ({ name: p.name, slug: p.slug, status: p.status, ms: p.ms, sections: p.sectionTypes, bytes: p.analysis && p.analysis.bytes, words: p.analysis && p.analysis.words, h1: p.analysis && p.analysis.h1, h1Text: p.analysis && (p.analysis.headings.find((x) => x.level === 1) || {}).text, title: p.analysis && p.analysis.title, placeholders: p.analysis && p.analysis.placeholders, replaceMarkers: p.analysis && p.analysis.replaceMarkers, description: p.analysis && Boolean(p.analysis.description), images: p.analysis && p.analysis.images })),
    types, essentialMissing: essentialScope.filter((e) => !covered.includes(e)), unrelated, wrongModule, design: proposals.map((p) => ({ key: p.key, name: p.name, fontPair: p.design && p.design.typography && p.design.typography.pair, direction: p.design && p.design.direction, primary: p.design && p.design.palette && p.design.palette.primary, contrastOk: Boolean(p.report && p.report.ok), changes: (p.changes || []).length })),
    homeSignature: home ? home.sectionTypes.join(">") : "", linkChecks, mediaQueries, timings: { ...timings, totalMs: Date.now() - t0 }, claims, score };
}

// ───────────── Gardes du Content Generator (le modèle est SIMULÉ : on lui fait « écrire » des textes dangereux et on mesure ce que le serveur détecte) ─────────────
function contentAudit() {
  const facts = require("../../src/contentGen/facts"), validate = require("../../src/contentGen/validate");
  const ctx = facts.buildContext({ facts: [{ key: "company_name", value: "BâtiPlus", source: "user" }, { key: "city", value: "Kinshasa", source: "user" }], language: "fr" });
  const field = { key: "t", label: "Texte", max: 600, path: ["text"] };
  const BAD = [
    ["statistique", "Plus de 95 % de nos clients recommandent nos services."], ["années", "Forte de 25 ans d'expérience, notre équipe vous accompagne."], ["clients", "Nous avons réalisé 1 200 chantiers avec succès."],
    ["certification", "Entreprise certifiée ISO 9001 pour la qualité de ses travaux."], ["classement", "Le numéro 1 de la rénovation à Kinshasa."], ["promesse médicale", "Notre méthode garantit la guérison de votre dos en trois séances."],
    ["téléphone inventé", "Appelez-nous au +243 812 345 678 dès maintenant."], ["e-mail inventé", "Écrivez à contact@batiplus-rdc.com pour un devis."], ["témoignage inventé", "« Un travail impeccable ! » — Jean K., client satisfait depuis 2019."],
    ["prix inventé", "Devis dès 450 € pour une rénovation complète."], ["garantie", "Résultats garantis à 100 % ou remboursé."], ["année inventée", "Fondée en 1998, notre entreprise est un leader du secteur."],
  ];
  const GOOD = ["Nous construisons et rénovons des bâtiments à Kinshasa.", "Décrivez votre projet, nous revenons vers vous avec un devis.", "Une équipe à l'écoute pour chaque étape de votre chantier.", "Découvrez nos services et nos réalisations.", "Demander un devis", "Questions fréquentes sur nos chantiers."];
  const flagged = (t) => { const i = validate.checkField(field, t, { context: ctx, language: "fr" }); return i.some((x) => x.severity === "critical"); };
  const bad = BAD.map(([kind, t]) => ({ kind, text: t, detected: flagged(t) })), good = GOOD.map((t) => ({ text: t, falsePositive: flagged(t) }));
  const repetitive = validate.checkSet([["a", "Notre équipe vous accompagne dans chaque projet de construction."], ["b", "Notre équipe vous accompagne dans chaque projet de construction."], ["c", "Notre équipe est à votre écoute pour votre projet de rénovation."], ["d", "Notre équipe propose des solutions adaptées à votre projet."]], { language: "fr" }).map((x) => x.code);
  return { bad, good, detectionRate: round(bad.filter((b) => b.detected).length / bad.length, 2), falsePositiveRate: round(good.filter((g) => g.falsePositive).length / good.length, 2), undetected: bad.filter((b) => !b.detected).map((b) => b.kind), repetitionCodes: repetitive };
}
// Ce que le Component Mapper produit pour CHAQUE genre de section lorsque le plan est vide (cas d'un brief sans détails) : composant, section ignorée, exemples, composants natifs manquants
function sectionAudit() {
  const mapper = require("../../src/pageGen/mapper"), plan = planLib;
  const page = { name: "Page", type: "autre" };
  return plan.KINDS.map((kind) => {
    const sec = { key: `${kind}-1`, kind, title: "", text: "", items: [], image: null, images: [], cta: null, courseIds: [], url: "", columns: 0 };
    const r = mapper.mapSection(sec, page, { courseOk: false });
    return { kind, status: r.status, components: r.components, example: Boolean(r.example), missing: r.missing, limitations: r.limitations.length, alternative: Boolean(r.alternative) };
  });
}
function mediaAudit() {
  const prov = require("../../src/aiMedia/providers"), planner = require("../../src/aiMedia/planner");
  return { providers: prov.list().map((p) => ({ id: p.id, kind: p.kind, integration: p.integration, priceStatus: p.models[0].price.status })), notIntegrated: prov.NOT_INTEGRATED.map((p) => p.id), ratios: prov.RATIOS, altSample: planner.altFor({ description: "Chantier de construction à Kinshasa" }), altHeroSample: planner.altFor({ description: "Image principale du bandeau" }) };
}
const offlineAudit = () => ({ brief: briefAudit(), content: contentAudit(), sections: sectionAudit(), media: mediaAudit() });

let briefAuditCache = null;

async function runLab({ log = () => {} } = {}) {
  briefAuditCache = briefAudit();
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  const boss = await loginInstructor(srv), db = srv.db(), anon = new Client(srv.base);
  const out = [];
  let homonym = null;
  try {
    for (const sc of SCENARIOS) { log(`→ ${sc.id}`); out.push(await runScenario({ srv, boss, db, anon }, sc, briefAuditCache)); }
    // Sonde : appliquer une génération SANS choisir de stratégie sur un site neuf alors qu'un autre site possède des pages homonymes
    const sid = Number((await boss.post(`${R}/sites`, { name: "Sonde homonymes (labo 22.1)" })).location.match(/(\d+)(#.*)?$/)[1]);
    const plan = planLib.planFor({ siteName: "Sonde", pages: [{ key: "accueil", name: "Accueil", type: "accueil" }, { key: "contact", name: "Contact", type: "contact" }] });
    const gr = await boss.post(`${R}/sites/${sid}/generateur/generer`, { plan: JSON.stringify(plan) }); const rid = Number((gr.location || "").match(/(\d+)$/)?.[1] || 0);
    const ap = await boss.post(`${R}/sites/${sid}/generateur/${rid}/appliquer`, {}); const page = await boss.get(ap.location || `${R}/sites/${sid}/generateur/${rid}`);
    homonym = { pagesCreated: db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?").get(sid).n, message: (page.text.match(/existe déjà[^<]{0,160}/) || [""])[0] };
  }
  finally { db.close(); await srv.stop(); }
  return { homonym, generatedAt: new Date().toISOString(), node: process.version, brief: briefAuditCache, content: contentAudit(), sections: sectionAudit(), media: mediaAudit(), scenarios: out, diversity: diversity(out) };
}

// ───────────── Diversité inter-sites ─────────────
function diversity(list) {
  const sig = list.map((s) => s.homeSignature);
  const jacc = (a, b) => { const x = new Set(a.split(">")), y = new Set(b.split(">")); const i = [...x].filter((t) => y.has(t)).length; return i / new Set([...x, ...y]).size; };
  const pairs = []; for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) pairs.push({ a: list[i].id, b: list[j].id, identicalHome: sig[i] === sig[j], jaccard: round(jacc(sig[i], sig[j]), 2), identicalPages: list[i].types.join() === list[j].types.join() });
  const primaries = list.map((s) => (s.design[0] || {}).primary).filter(Boolean);
  const dirs = list.map((s) => s.design.map((d) => d.primary).join("/"));
  return { distinctHomeSignatures: new Set(sig).size, total: list.length, identicalHomePairs: pairs.filter((p) => p.identicalHome).length, identicalPageSetPairs: pairs.filter((p) => p.identicalPages).length, meanJaccard: round(pairs.reduce((a, p) => a + p.jaccard, 0) / pairs.length, 2), distinctPrimaryColors: new Set(primaries).size, primaries, distinctDirectionTriples: new Set(dirs).size, architectureGroups: Object.entries(list.reduce((m, s) => ((m[s.types.join(">")] = (m[s.types.join(">")] || []).concat(s.id)), m), {})).map(([k, v]) => ({ types: k, scenarios: v })), pairs };
}
module.exports = { runLab, briefAudit, contentAudit, sectionAudit, mediaAudit, offlineAudit, diversity };
if (require.main === module) {
  const fs = require("node:fs"), path = require("node:path");
  runLab({ log: (m) => console.error(m) }).then((r) => { const f = path.join(__dirname, "..", "..", "docs", "quality-lab"); fs.mkdirSync(f, { recursive: true }); fs.writeFileSync(path.join(f, "results.json"), JSON.stringify(r, null, 1)); console.log(r.scenarios.map((s) => `${s.id.padEnd(15)} ${String(s.score.pct).padStart(5)} % (${s.score.got}/${s.score.measured}) ${s.score.status}${s.score.capped ? " (plafonné)" : ""}`).join("\n")); }).catch((e) => { console.error(e); process.exit(1); });
}
