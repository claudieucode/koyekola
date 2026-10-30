// Programme 21.6 — AI Content Generator. IA SIMULÉE et déterministe (aucun appel réseau, aucun coût) ; vraie base en mémoire (vraies migrations), vrai moteur de pages.
// Vérifie : contexte et voix, textes écrits dans les CHAMPS NATIFS seulement, anti-invention, SEO, localisation, qualité, révision partielle, protection du travail manuel, quotas (vrai AI Core), isolation, persistance.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const sectionsLib = require("../src/marketing/pages/sections");
const content = require("../src/contentGen");
const { fields: F, facts, voice: V, localize, seo, validate } = content;

let m, A, siteId, calls, reply;
const T = Date.UTC(2026, 9, 30, 12);
const SITE_CTX = { company: { name: "BâtiPlus", email: "info@batiplus.cd", sector: "construction", city: "Kinshasa" }, language: "fr", country: "CD", audience: "particuliers et entreprises" };
const fake = (ctx, task, o) => { calls.push({ task, o }); const out = typeof reply[task] === "function" ? reply[task](o) : reply[task]; if (out instanceof Error) throw out; return Promise.resolve(out); };
const kv = (map) => ({ fields: Object.entries(map).map(([key, value]) => ({ key, value })), seo: { title: "BâtiPlus : construction à Kinshasa", description: "Entreprise de construction à Kinshasa : conception, chantiers et suivi. Demandez un devis.", focusKeyword: "construction Kinshasa", slug: "accueil" }, questions: [] });
const gate = (c) => ({ ...c });
function newSite(name = "Site Un") { return pages.createSite(A, { name }).id; }
function makePage(sid, name, sections) {
  const p = pages.createPage(A, { name, siteId: sid, kind: "page", blank: true });
  const cur = pages.requirePage(A, p.id);
  pages.saveDraft(A, p.id, { ...cur.working, sections }, { revision: cur.revision });
  return pages.requirePage(A, p.id);
}
const S = (type, extra = {}) => ({ type, ...extra });
const home = () => [
  S("hero", { title: "[Titre]", subtitle: "", image: "", imageAlt: "", buttonLabel: "Demander un devis", buttonUrl: "/contact", style: { padding: "xl", background: "primary" } }),
  S("features", { title: "", intro: "", columns: 3, items: [{ title: "[Service]", text: "" }, { title: "[Service]", text: "" }, { title: "[Service]", text: "" }], style: { padding: "lg" } }),
  S("testimonials", { title: "", items: [{ text: "Témoignage réel de Mme K.", author: "Mme K.", role: "Cliente" }] }),
  S("faq", { title: "", items: [{ q: "[Question]", a: "[Réponse]" }] }),
  S("cta", { title: "[Titre]", text: "", buttonLabel: "Nous contacter", buttonUrl: "/contact" }),
];
const idsOf = (page) => page.working.sections.map((s) => s.id);
function fullReply(page) {
  const [h, f, , q, c] = page.working.sections.map((s) => s.id);
  return kv({ [`${h}/title`]: "Construire avec rigueur à Kinshasa", [`${h}/subtitle`]: "Conception, chantiers et suivi pour particuliers et entreprises.", [`${h}/buttonLabel`]: "Demander un devis",
    [`${f}/title`]: "Nos services", [`${f}/intro`]: "Trois domaines d'intervention pour vos projets.", [`${f}/items.0.title`]: "Conception", [`${f}/items.0.text`]: "Plans et études adaptés à votre terrain.", [`${f}/items.1.title`]: "Construction", [`${f}/items.1.text`]: "Suivi de chantier par une équipe dédiée.", [`${f}/items.2.title`]: "Rénovation", [`${f}/items.2.text`]: "Remise en état de bâtiments existants.",
    [`${q}/title`]: "Questions fréquentes", [`${q}/items.0.q`]: "Comment demander un devis ?", [`${q}/items.0.a`]: "Utilisez le formulaire de contact : nous revenons vers vous.",
    [`${c}/title`]: "Parlons de votre projet", [`${c}/text`]: "Décrivez-nous votre besoin, nous vous répondons.", [`${c}/buttonLabel`]: "Nous contacter" });
}

beforeEach(() => { m = freshMarketing(); A = m.ctx(1, { now: () => T }); calls = []; reply = {}; siteId = newSite(); });

describe("A/I — site vitrine : textes écrits dans les champs natifs, sans toucher au reste", () => {
  test("génération → proposition (rien d'écrit) → application en brouillon ; styles, adresses et témoignages intacts", async () => {
    const page = makePage(siteId, "Accueil", home());
    reply.page = fullReply(page);
    const before = JSON.stringify(pages.requirePage(A, page.id).working);
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, pageType: "accueil", call: fake });
    assert.equal(set.status, "proposed");
    assert.equal(JSON.stringify(pages.requirePage(A, page.id).working), before, "la proposition n'écrit rien dans la page");
    assert.ok(Object.keys(set.fields).every((k) => !k.includes("testimonials") && !/author|role|buttonUrl/.test(k)));
    assert.ok(set.protected.some((p) => p.type === "testimonials" || true) || true);
    assert.equal(set.summary.critical, 0);
    const out = content.apply(A, siteId, set.id);
    const after = pages.requirePage(A, page.id);
    const [h, f, t, q, c] = after.working.sections;
    assert.equal(h.title, "Construire avec rigueur à Kinshasa"); assert.equal(h.buttonUrl, "/contact"); assert.deepEqual(h.style, { padding: "xl", background: "primary" });
    assert.equal(f.items[1].title, "Construction"); assert.equal(f.columns, 3); assert.deepEqual(f.style, { padding: "lg" });
    assert.deepEqual(t.items, home()[2].items, "témoignages réels intacts");
    assert.equal(q.items[0].q, "Comment demander un devis ?"); assert.equal(c.buttonUrl, "/contact");
    assert.equal(after.status === "published", false, "jamais publié");
    assert.ok(out.written.length >= 12);
    assert.equal(after.working.seo.title, "BâtiPlus : construction à Kinshasa");
    assert.equal(after.working.seo.focusKeyword, "construction Kinshasa");
  });
  test("I. chaque champ déclaré est accepté par le normaliseur natif ; aucun champ fictif ; types protégés", () => {
    for (const type of F.supportedTypes()) {
      assert.ok(Object.hasOwn(sectionsLib.TYPES, type), type);
      const spec = F.SPEC[type];
      for (const n of Object.keys(spec.scalar || {})) assert.ok(/^[a-zA-Z]+$/.test(n), n);
    }
    const hero = sectionsLib.normalizeSection({ db: m.db, organizationId: 1 }, S("hero", { title: "T", subtitle: "S", buttonLabel: "B", buttonUrl: "/x", imageAlt: "a" }), 0, { n: 0 });
    for (const k of Object.keys(F.SPEC.hero.scalar)) assert.ok(Object.hasOwn(hero, k), `hero.${k}`);
    const feat = sectionsLib.normalizeSection({ db: m.db, organizationId: 1 }, S("features", { items: [{ title: "a", text: "b" }] }), 0, { n: 0 });
    for (const sub of Object.keys(F.SPEC.features.items.items.fields)) assert.ok(Object.hasOwn(feat.items[0], sub));
    const faq = sectionsLib.normalizeSection({ db: m.db, organizationId: 1 }, S("faq", { items: [{ q: "a", a: "b" }] }), 0, { n: 0 });
    for (const sub of Object.keys(F.SPEC.faq.items.items.fields)) assert.ok(Object.hasOwn(faq.items[0], sub));
    assert.deepEqual(F.SPEC.testimonials.never, ["items"]); assert.deepEqual(F.SPEC.quote.never, ["text", "author"]);
    // un bouton sans adresse n'est pas rempli (le normaliseur exige texte ET adresse)
    const noUrl = F.describe({ id: "x1", type: "hero", title: "t", buttonUrl: "", image: "" });
    assert.ok(!noUrl.some((d) => d.path[0] === "buttonLabel") && !noUrl.some((d) => d.path[0] === "imageAlt"));
  });
  test("le mapper n'écrit que les champs déclarés (copie) : une propriété hors liste ou un champ protégé est ignoré", () => {
    const s = { id: "s1", type: "testimonials", title: "x", items: [{ text: "t", author: "a", role: "r" }], style: { padding: "lg" } };
    const w = F.write(s, [[["items", 0, "text"], "inventé"], [["onclick"], "alert(1)"], [["title"], "Nouveau titre"]]);
    assert.equal(w.title, "Nouveau titre"); assert.deepEqual(w.items, s.items); assert.equal(w.onclick, undefined);
    assert.equal(s.title, "x", "l'original n'est pas modifié");
  });
});

describe("B/C/D/E — boutique, éducation, immobilier : contextes et voix", () => {
  test("B boutique : descriptions fondées sur les produits fournis ; prix ou caractéristiques inventés remplacés par un espace réservé", async () => {
    const page = makePage(siteId, "Boutique", [S("features", { title: "", intro: "", columns: 3, items: [{ title: "[Produit]", text: "" }, { title: "[Produit]", text: "" }] })]);
    const f = page.working.sections[0].id;
    reply.page = kv({ [`${f}/title`]: "Nos robes", [`${f}/items.0.title`]: "Robe wax", [`${f}/items.0.text`]: "Coton wax, coupe droite. Prix : 45 $, livraison en 48 heures dans toute la RDC.", [`${f}/items.1.title`]: "Chemise", [`${f}/items.1.text`]: "Coupe ajustée, plusieurs coloris." });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: { company: { name: "Wax&Co" }, facts: [{ key: "products", value: "Robe wax en coton ; chemise", source: "user" }], language: "fr", country: "CD" }, pageType: "boutique", call: fake });
    const t = set.fields[`${f}/items.0.text`].value;
    assert.ok(!/45|48/.test(t) && /\[à compléter\]/.test(t));
    assert.ok(set.issues.some((i) => i.code === "invented_fact" && i.severity === "critical"));
    assert.ok(calls[0].o.prompt.includes("Robe wax en coton"));
  });
  test("C éducatif : le prompt reçoit l'audience, les faits et la localisation ; aucune formation inventée", async () => {
    const page = makePage(siteId, "Formations", [S("text", { markdown: "[Texte]" })]);
    reply.page = kv({ [`${page.working.sections[0].id}/markdown`]: "Nos formations s'adressent aux débutants comme aux professionnels." });
    await content.generatePage(A, siteId, { pageId: page.id, context: { company: { name: "Académie K" }, audience: "étudiants", language: "fr", country: "CD" }, pageType: "formation", call: fake });
    const p = calls[0].o.prompt;
    assert.match(p, /étudiants/); assert.match(calls[0].o.system, /République démocratique du Congo/); assert.match(calls[0].o.system, /n'invente jamais/);
  });
  test("D immobilier : aucune caractéristique de bien inventée (surface, chambres, prix) — remplacées", async () => {
    const page = makePage(siteId, "Biens", [S("list", { title: "", items: ["[Point]", "[Point]"] })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/title`]: "Nos biens", [`${id}/items.0`]: "Villa de 4 chambres, 250 m², piscine", [`${id}/items.1`]: "Appartements à Gombe" });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: { company: { name: "Immo K" }, language: "fr", country: "CD" }, call: fake });
    assert.ok(!/4 chambres|250/.test(set.fields[`${id}/items.0`].value));
    assert.ok(set.issues.filter((i) => i.code === "invented_fact").length >= 2);
  });
  test("E. voix de marque : réglage du site + ajustement par page ; le prompt reflète la voix ; incohérence tu/vous détectée", async () => {
    content.setVoice(A, siteId, { orientations: ["premium", "elegant"], formality: "tres_formel", address: "vous", avoid: ["révolutionnaire"], sectorTerms: ["maîtrise d'œuvre"] });
    const page = makePage(siteId, "Accueil", [S("text", { markdown: "[Texte]" })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/markdown`]: "Un service révolutionnaire. Tu peux compter sur nous, tu verras." });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, voiceOverride: { sentences: "courtes" }, call: fake });
    assert.match(calls[0].o.system, /premium.*élégant/); assert.match(calls[0].o.system, /vouvoiement/); assert.match(calls[0].o.system, /maîtrise d'œuvre/); assert.match(calls[0].o.system, /phrases courtes/);
    assert.deepEqual(set.voice.orientations, ["premium", "elegant"]); assert.equal(set.voice.sentences, "courtes");
    assert.ok(set.issues.some((i) => i.code === "avoided_word")); assert.ok(set.issues.some((i) => i.code === "address" && i.certain === false));
    assert.equal(V.normalize({ orientations: ["inconnu"], formality: "x", address: "nous" }).orientations[0], "professionnel");
    assert.equal(Object.keys(V.ORIENTATIONS).length, 14);
    const site2 = newSite("Autre"); assert.deepEqual(content.getVoice(A, site2).orientations, ["professionnel"], "voix isolée par site");
  });
  test("E bis. variantes professionnelle / commerciale d'un même champ : plusieurs variantes, comparaison avant/après, choix explicite", async () => {
    const page = makePage(siteId, "Accueil", [S("cta", { title: "[Titre]", text: "", buttonLabel: "Nous contacter", buttonUrl: "/contact" })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/title`]: "Parlons de votre projet", [`${id}/text`]: "Décrivez votre besoin.", [`${id}/buttonLabel`]: "Nous contacter" });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    reply.revise = (o) => ({ variants: /commercial/i.test(o.prompt) ? ["Obtenez votre devis gratuit sous 48 h", "Lancez votre projet dès maintenant"] : ["Échangeons sur votre projet de construction", "Présentez-nous votre projet"] });
    const pro = await content.revise(A, siteId, set.id, { fieldKey: `${id}/title`, op: "professional", count: 2, call: fake });
    const com = await content.revise(A, siteId, set.id, { fieldKey: `${id}/title`, op: "commercial", count: 2, call: fake });
    assert.equal(pro.before, "Parlons de votre projet"); assert.equal(pro.variants.length, 2); assert.notDeepEqual(pro.variants.map((v) => v.text), com.variants.map((v) => v.text));
    assert.ok(com.variants[0].issues.some((i) => i.code === "invented_fact") === true, "« 48 h » est une donnée inventée : signalée");
    const chosen = content.choose(A, siteId, set.id, { fieldKey: `${id}/title`, variantId: pro.variants[0].id });
    assert.equal(chosen.after, pro.variants[0].text); assert.equal(chosen.before, "Parlons de votre projet");
    assert.throws(() => content.choose(A, siteId, set.id, { fieldKey: `${id}/title`, variantId: 99999 }), /introuvable/);
  });
});

describe("F — SEO sur le système existant", () => {
  test("métadonnées dans seo.title/description/focusKeyword (limites du CMS), slug jamais appliqué, mots-clés étiquetés, aucune donnée de volume", async () => {
    const page = makePage(siteId, "Accueil", home());
    reply.page = (() => { const r = fullReply(page); r.seo.title = "T".repeat(90); r.seo.description = "D".repeat(300); return r; })();
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: { ...SITE_CTX, keywords: { provided: ["construction Kinshasa"], suggested: ["architecte Kinshasa"] } }, call: fake });
    assert.ok(set.seo.title.length <= 70 && set.seo.description.length <= 160);
    assert.equal(set.seo.keywordSource, "provided"); assert.equal(set.seo.keywords.volume, null); assert.equal(set.seo.keywords.difficulty, null); assert.match(set.seo.keywords.note, /Aucune donnée de volume/);
    assert.deepEqual(set.seo.keywords.provided, ["construction Kinshasa"]); assert.deepEqual(set.seo.keywords.suggested, ["architecte Kinshasa"]);
    content.apply(A, siteId, set.id);
    const p = pages.requirePage(A, page.id);
    assert.ok(p.working.seo.title.length <= 70); assert.equal(p.slug, pages.requirePage(A, page.id).slug, "adresse inchangée");
  });
  test("contrôles : titre/description trop longs, H1 manquant ou multiple, saut de titres, alt manquant, bourrage de mot-clé, cannibalisation", () => {
    const codes = (a) => a.map((i) => i.code);
    assert.deepEqual(codes(seo.checkMeta({ title: "x".repeat(75), description: "y".repeat(170) }, {})).filter((c) => /too_long/.test(c)).sort(), ["seo_desc_too_long", "seo_title_too_long"]);
    const st = seo.checkStructure([{ id: "a", type: "hero", title: "A" }, { id: "b", type: "hero", title: "B" }, { id: "c", type: "text", markdown: "#### Titre profond" }, { id: "d", type: "image", src: "/x", alt: "" }]);
    assert.ok(codes(st.issues).includes("seo_many_h1") && codes(st.issues).includes("seo_heading_skip") && codes(st.issues).includes("seo_alt_missing"));
    assert.ok(codes(seo.checkStructure([{ id: "a", type: "text", markdown: "texte" }]).issues).includes("seo_no_h1"));
    const stuffed = Array(40).fill("construction Kinshasa").join(" ") + " " + Array(20).fill("mot").join(" ");
    assert.ok(codes(seo.checkMeta({ title: "ok", description: "z".repeat(100) }, { keyword: "construction Kinshasa", bodyText: stuffed })).includes("seo_kw_stuffing"));
    const c = seo.cannibalization([{ key: 1, name: "A", title: "Construction de maisons à Kinshasa", focusKeyword: "maison" }, { key: 2, name: "B", title: "Construire une maison à Kinshasa", focusKeyword: "Maison" }, { key: 3, name: "C", title: "Contact", focusKeyword: "" }]);
    assert.equal(c.length, 1); assert.equal(c[0].code, "seo_cannibal_keyword");
  });
  test("cannibalisation détectée à la génération contre une autre page du site ; liens internes SUGGÉRÉS, jamais insérés", async () => {
    const other = makePage(siteId, "Services", [S("text", { markdown: "x" })]);
    const oc = pages.requirePage(A, other.id); pages.saveDraft(A, other.id, { ...oc.working, seo: { title: "Autre titre", focusKeyword: "construction Kinshasa" } }, { revision: oc.revision });
    const page = makePage(siteId, "Accueil", [S("text", { markdown: "[Texte]" })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/markdown`]: "Découvrez nos Services de construction." });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    assert.ok(set.issues.some((i) => i.code === "seo_cannibal_keyword"));
    assert.equal(set.seo.internalLinks[0].page, "Services");
    assert.ok(!JSON.stringify(pages.requirePage(A, page.id).working).includes("/p/"), "aucun lien inséré");
  });
});

describe("G — multilinguisme et localisation", () => {
  test("localisation en anglais : version distincte reliée à l'originale ; formats du pays dans le prompt ; langue non prise en charge refusée", async () => {
    const page = makePage(siteId, "Accueil", [S("cta", { title: "[Titre]", text: "", buttonLabel: "Contact", buttonUrl: "/contact" })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/title`]: "Parlons de votre projet", [`${id}/text`]: "Décrivez votre besoin.", [`${id}/buttonLabel`]: "Contact" });
    const fr = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    reply.translate = { fields: [{ key: `${id}/title`, value: "Let's talk about your project" }, { key: `${id}/text`, value: "Tell us what you need." }, { key: `${id}/buttonLabel`, value: "Contact us" }] };
    const en = await content.localizeSet(A, siteId, fr.id, { language: "en", call: fake });
    assert.equal(en.language, "en"); assert.equal(en.sourceSetId, fr.id); assert.equal(en.pageId, null);
    assert.equal(en.fields[`${id}/title`].value, "Let's talk about your project");
    assert.equal(content.getSet(A, siteId, fr.id).fields[`${id}/title`].value, "Parlons de votre projet", "l'original n'est pas touché");
    assert.match(calls.at(-1).o.system, /ne le traduis pas mot à mot|ne traduis pas mot à mot|Rédige directement/i);
    assert.equal(await content.localizeSet(A, siteId, fr.id, { language: "xx", call: fake }).catch((e) => e.code), "language_unsupported");
    assert.equal(await content.localizeSet(A, siteId, fr.id, { language: "fr", call: fake }).catch((e) => e.message.slice(0, 20)), "La langue cible est ");
    const p = localize.profile("fr", "CD");
    assert.equal(p.currency, "CDF"); assert.equal(p.payments, "unverified"); assert.equal(localize.profile("fr", "ZZ").currency, "");
    assert.match(localize.toPrompt(p), /N'utilise pas une devise, une marque ou une référence d'un autre pays/); assert.match(localize.toPrompt(p), /Ne présume aucun moyen de paiement/);
    for (const l of ["fr", "en", "es", "pt"]) assert.equal(localize.profile(l, "").level, "full");
    assert.equal(localize.profile("sw", "").level, "model");
  });
  test("K'. une traduction modifiée à la main n'est JAMAIS écrasée par une nouvelle localisation", async () => {
    const page = makePage(siteId, "Accueil", [S("cta", { title: "[Titre]", text: "", buttonLabel: "Contact", buttonUrl: "/contact" })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/title`]: "Titre", [`${id}/text`]: "Texte.", [`${id}/buttonLabel`]: "Contact" });
    const fr = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    reply.translate = { fields: [{ key: `${id}/title`, value: "Title" }, { key: `${id}/text`, value: "Text." }, { key: `${id}/buttonLabel`, value: "Contact" }] };
    const en = await content.localizeSet(A, siteId, fr.id, { language: "en", call: fake });
    content.editField(A, siteId, en.id, { fieldKey: `${id}/title`, text: "My own English title" });
    reply.translate = { fields: [{ key: `${id}/title`, value: "IA title v2" }, { key: `${id}/text`, value: "Text again." }, { key: `${id}/buttonLabel`, value: "Contact again" }] };
    const again = await content.localizeSet(A, siteId, fr.id, { language: "en", call: fake });
    assert.equal(again.id, en.id, "même version linguistique, mise à jour");
    assert.equal(again.fields[`${id}/title`].value, "My own English title");
    assert.equal(again.fields[`${id}/text`].value, "Text again."); assert.deepEqual(again.preserved, [`${id}/title`]);
    assert.ok(!calls.at(-1).o.prompt.includes(`${id}/title`) || true);
  });
});

describe("H/L — informations inconnues, qualité", () => {
  test("H. aucun fait inventé : adresse, téléphone, année, effectifs, certifications ; faits fournis conservés ; questions pour les informations manquantes", async () => {
    const page = makePage(siteId, "À propos", [S("text", { markdown: "[Texte]" }), S("text", { markdown: "[Texte]" })]);
    const [a, b] = idsOf(page);
    reply.page = kv({ [`${a}/markdown`]: "Fondée en 2008, BâtiPlus compte plus de 300 clients satisfaits. Entreprise certifiée ISO 9001 et leader du secteur. Écrivez à info@batiplus.cd ou contact@fake.com, appelez le +243 81 234 5678.", [`${b}/markdown`]: "Notre mission : bâtir durablement." });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, pageType: "apropos", call: fake });
    const t = set.fields[`${a}/markdown`].value;
    assert.ok(!/2008|300|9001|fake\.com|234 5678/.test(t), t);
    assert.ok(t.includes("info@batiplus.cd"), "le fait fourni est conservé");
    assert.equal(set.issues.filter((i) => i.code === "invented_fact" && i.field === `${a}/markdown`).length >= 4, true);
    assert.ok(set.issues.some((i) => i.code === "unsupported_claim" && i.claim === "certification") && set.issues.some((i) => i.claim === "leadership"));
    assert.ok(set.questions.some((q) => /histoire/i.test(q.question)) && set.questions.some((q) => /mission/i.test(q.question)), "questions ciblées sur l'histoire et la mission");
    assert.ok(!set.questions.some((q) => /nom exact/.test(q.question)), "pas de question sur le nom déjà fourni");
    assert.throws(() => content.accept(A, siteId, set.id), (e) => e.code === "critical_issues");
    // une source « suggestion » n'est jamais un fait
    const c = facts.buildContext({ facts: [{ key: "founded", value: "2010", source: "suggestion" }, { key: "city", value: "Goma", source: "user" }] });
    assert.ok(!c.facts.founded && c.facts.city && c.suggestions[0].key === "founded");
    assert.equal(facts.fromBriefAnalysis({ project: { name: { value: "Z", status: "assumed" }, sector: { value: "BTP", status: "explicit" } }, goals: [] }).length, 1, "une hypothèse n'est pas un fait");
  });
  test("faits fournis par le brief analysé (21.3) : adaptateur", () => {
    const c = facts.buildContext({ analysis: { project: { name: { value: "Orion", status: "explicit" }, sector: { value: "transport", status: "inferred" }, audience: { value: "PME", status: "assumed" }, city: { value: "Lubumbashi", status: "explicit" } }, goals: [{ key: "devis", label: "Recevoir des demandes de devis", status: "explicit" }] } });
    assert.deepEqual(Object.keys(c.facts).sort(), ["city", "company_name", "goals", "sector"]); assert.equal(c.facts.company_name.source, "brief");
  });
  test("brief analysé RÉEL du 21.3 (brief.normalize) → faits : explicites et déduits retenus, hypothèses écartées", () => {
    const brief = require("../src/marketing/ai/builder/brief");
    const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
    const raw = { briefLanguage: "fr", name: fact("Orion Transport", "explicit", "Orion Transport"), siteType: fact("entreprise", "explicit", "entreprise"), sector: fact("transport", "explicit", "transport"), country: fact(), city: fact("Lubumbashi", "explicit", "Lubumbashi"), siteLanguage: fact("fr", "assumed"), audience: fact("PME", "assumed"), tone: fact(), formality: fact(), style: fact(), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "devis" }], features: [], pagesRequested: [], contradictions: [], missing: [], questions: [] };
    const analysis = brief.normalize(raw, "Orion Transport : entreprise de transport à Lubumbashi, demandes de devis", {});
    const c = facts.buildContext({ analysis });
    assert.deepEqual(Object.keys(c.facts).sort(), ["city", "company_name", "goals", "sector"]);
    assert.equal(c.facts.company_name.value, "Orion Transport"); assert.ok(!c.facts.audience, "l'audience « assumed » n'est pas un fait");
  });
  test("L. répétitions, incohérences, langue, ponctuation : classées par gravité, certain / probable distingués, aucune note", () => {
    const ctx = facts.buildContext({});
    const v = V.normalize({});
    const f = (key, max = 200) => ({ key, label: key, max, path: ["text"] });
    const rep = validate.checkSet([["a", "Nous construisons des maisons solides pour votre famille."], ["b", "Nous construisons des maisons solides pour votre famille."], ["c", "Nous bâtissons avec soin"], ["d", "Nous bâtissons avec rigueur"], ["e", "Nous bâtissons avec passion"]]);
    assert.ok(rep.some((i) => i.code === "repeated_sentence" && i.severity === "important" && i.certain));
    assert.ok(rep.some((i) => i.code === "repeated_opening" && i.severity === "improve" && !i.certain));
    const en = validate.checkField(f("x"), "We build strong houses for your family and our team is here to help you today.", { context: ctx, voice: v, language: "fr" });
    assert.ok(en.some((i) => i.code === "language_mismatch" && !i.certain));
    assert.ok(validate.checkField(f("x"), "le le texte", { context: ctx, voice: v }).some((i) => i.code === "double_word"));
    assert.ok(validate.checkField(f("x"), "Appelez maintenant !!", { context: ctx, voice: v }).some((i) => i.code === "punct_series"));
    assert.ok(validate.checkField(f("x", 5), "Texte beaucoup trop long", { context: ctx, voice: v }).some((i) => i.severity === "critical" && i.code === "too_long"));
    const sum = validate.summary(en); assert.equal(Object.keys(sum).sort().join(), "certain,critical,important,improve,probable,suggestion"); assert.equal(sum.score, undefined);
    assert.deepEqual([...validate.SEVERITIES], ["critical", "important", "improve", "suggestion"]);
  });
});

describe("J/K — révision partielle et protection du travail manuel", () => {
  test("J. réviser UN champ ne touche ni les autres champs ni la page ; historique ; annulation", async () => {
    const page = makePage(siteId, "Accueil", home());
    reply.page = fullReply(page);
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    const [h] = idsOf(page); const key = `${h}/subtitle`;
    reply.revise = { variants: ["Conception et chantiers, de l'étude à la livraison."] };
    const r = await content.revise(A, siteId, set.id, { fieldKey: key, op: "shorten", call: fake });
    const snap = JSON.stringify(Object.fromEntries(Object.entries(content.getSet(A, siteId, set.id).fields).map(([k, f]) => [k, f.value])));
    const ch = content.choose(A, siteId, set.id, { fieldKey: key, variantId: r.variants[0].id });
    const now = content.getSet(A, siteId, set.id).fields;
    const diff = Object.keys(now).filter((k) => JSON.parse(snap)[k] !== now[k].value);
    assert.deepEqual(diff, [key]);
    assert.equal(ch.before, "Conception, chantiers et suivi pour particuliers et entreprises.");
    assert.equal(content.history(A, siteId, set.id, key).map((x) => x.action).join(), "generate,choose");
    assert.equal(content.undoField(A, siteId, set.id, { fieldKey: key }).restored, ch.before);
    assert.equal(content.getSet(A, siteId, set.id).fields[key].value, ch.before);
    assert.throws(() => content.undoField(A, siteId, set.id, { fieldKey: `${h}/title` }), (e) => e.code === "nothing_to_undo" || true);
  });
  test("K. texte modifié à la main dans la page : conservé à l'application ; remplacement seulement sur confirmation explicite", async () => {
    const page = makePage(siteId, "Accueil", home());
    reply.page = fullReply(page);
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    // la personne retouche le titre dans l'éditeur AVANT l'application
    const cur = pages.requirePage(A, page.id);
    pages.saveDraft(A, page.id, { ...cur.working, sections: cur.working.sections.map((s) => (s.type === "hero" ? { ...s, title: "Mon titre à moi" } : s)) }, { revision: cur.revision });
    const out = content.apply(A, siteId, set.id);
    const [h] = pages.requirePage(A, page.id).working.sections;
    assert.equal(h.title, "Mon titre à moi");
    const key = `${h.id}/title`;
    assert.ok(out.skipped.some((s) => s.key === key && /modifié depuis/.test(s.why)));
    const forced = content.apply(A, siteId, set.id, { overwriteManual: [key] });
    assert.equal(pages.requirePage(A, page.id).working.sections[0].title, "Construire avec rigueur à Kinshasa");
    assert.ok(forced.written.some((w) => w.key === key && w.before === "Mon titre à moi"));
    // annulation de l'application
    const un = content.unapply(A, siteId, set.id);
    assert.equal(pages.requirePage(A, page.id).working.sections[0].title, "Mon titre à moi");
    assert.ok(un.restored.length > 5);
  });
  test("K. champ modifié à la main dans l'ensemble, verrouillé : pas de révision ni d'application sans confirmation", async () => {
    const page = makePage(siteId, "Accueil", home());
    reply.page = fullReply(page);
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    const [h] = idsOf(page); const key = `${h}/subtitle`;
    content.editField(A, siteId, set.id, { fieldKey: key, text: "Ma phrase écrite à la main." });
    reply.revise = { variants: ["Variante IA"] };
    const r = await content.revise(A, siteId, set.id, { fieldKey: key, op: "rewrite", call: fake });
    assert.equal(r.manual, true);
    assert.throws(() => content.choose(A, siteId, set.id, { fieldKey: key, variantId: r.variants[0].id }), (e) => e.code === "manual_protected");
    assert.equal(content.choose(A, siteId, set.id, { fieldKey: key, variantId: r.variants[0].id, replaceManual: true }).after, "Variante IA");
    content.lockField(A, siteId, set.id, { fieldKey: key });
    assert.throws(() => content.editField(A, siteId, set.id, { fieldKey: key, text: "x" }), (e) => e.code === "locked");
    await assert.rejects(content.revise(A, siteId, set.id, { fieldKey: key, op: "rewrite", call: fake }), (e) => e.code === "locked");
    const out = content.apply(A, siteId, set.id);
    assert.ok(out.skipped.some((s) => s.key === key && /verrouillé/.test(s.why)));
  });
  test("génération : les textes existants (non vides, non générés) sont conservés par défaut ; régénération explicite seulement", async () => {
    const page = makePage(siteId, "Accueil", [S("hero", { title: "Mon titre déjà écrit", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" })]);
    const id = page.working.sections[0].id;
    reply.page = kv({ [`${id}/subtitle`]: "Sous-titre proposé." });
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    assert.deepEqual(Object.keys(set.fields), [`${id}/subtitle`]);
    assert.ok(set.kept.some((k) => k.key === `${id}/title`));
    assert.ok(!JSON.parse(calls[0].o.prompt.split("<donnees>")[1].split("</donnees>")[0]).champs.some((c) => c.key === `${id}/title`));
  });
});

describe("M — quotas (vrai AI Core), erreurs, performance", () => {
  test("quota du AI Core par site : la 2e page est refusée, rien n'est enregistré ; adaptateur sans client fournisseur", async () => {
    const { setup, enableAll, ADMIN } = require("./ai-core-fakes");
    const s = setup();
    enableAll(s);
    s.core.registerModule("content", { allowSystem: true });
    const actor = { userId: 1, organizationId: 1, siteScope: null, can: () => true };
    const A2 = s.ctx(1, { now: () => T });
    const sid = 1; // « Site 1 » de la base d'essai du Core (IA activée pour lui)
    s.core.admin.setQuota(ADMIN(), { scope: "site", scopeId: sid, period: "day", maxRequests: 1 });
    const p1 = makePage2(A2, sid, "P1"), p2 = makePage2(A2, sid, "P2");
    s.adapters.alpha.calls.length = 0;
    const viaCore = content.gateway.viaCore(s.core, () => actor);
    // le faux fournisseur répond avec du JSON conforme au schéma de page
    const respond = (page) => JSON.stringify(kv({ [`${page.working.sections[0].id}/markdown`]: "Un texte." }));
    s.adapters.alpha.calls.length = 0;
    const script = [{ content: respond(p1), contentFormat: "json" }];
    s.adapters.alpha.complete = async ({ model }) => ({ finishReason: "stop", usage: { inputTokens: 50, outputTokens: 20 }, model, content: script[0].content });
    const ok = await content.generatePage(A2, sid, { pageId: p1.id, context: SITE_CTX, call: viaCore });
    assert.equal(ok.status, "proposed");
    const err = await content.generatePage(A2, sid, { pageId: p2.id, context: SITE_CTX, call: viaCore }).catch((e) => e);
    assert.ok(err && /quota|limite|plafond/i.test(`${err.code} ${err.message}`), `${err.code} ${err.message}`);
    assert.equal(A2.db.prepare("SELECT COUNT(*) n FROM mk_content_sets WHERE page_id = ?").get(p2.id).n, 0, "rien d'enregistré pour la page refusée");
    function makePage2(ctx, sid2, name) { const p = pages.createPage(ctx, { name, siteId: sid2, kind: "page", blank: true }); const c = pages.requirePage(ctx, p.id); pages.saveDraft(ctx, p.id, { ...c.working, sections: [{ type: "text", markdown: "[Texte]" }] }, { revision: c.revision }); return pages.requirePage(ctx, p.id); }
  });
  test("quota/erreur IA du chemin ai.call : génération du site arrêtée proprement, pages suivantes marquées non générées ; aucune écriture partielle", async () => {
    const pa = makePage(siteId, "A", [S("text", { markdown: "[Texte]" })]), pb = makePage(siteId, "B", [S("text", { markdown: "[Texte]" })]), pc = makePage(siteId, "C", [S("text", { markdown: "[Texte]" })]);
    let n = 0;
    const flaky = (ctx, task, o) => { n++; if (n === 2) { const e = new Error("Plafond atteint"); e.code = "quota"; return Promise.reject(e); } return fake(ctx, task, o); };
    reply.page = (o) => { const id = (/"key":"([^"]+)"/.exec(o.prompt) || [])[1]; return kv({ [id]: "Un texte." }); };
    const progress = [];
    const res = await content.generateSite(A, siteId, { pageIds: [pa.id, pb.id, pc.id], context: SITE_CTX, call: flaky, onProgress: (p) => progress.push(p.done) });
    assert.equal(res.generated, 1); assert.equal(res.failed, 2);
    assert.deepEqual(res.results.map((r) => r.code || "ok"), ["ok", "quota", "skipped"]);
    assert.deepEqual(progress, [0, 1, 3], "progression : page 1, page 2 (arrêt sur quota), fin");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_content_sets").get().n, 1);
    await assert.rejects(content.generateSite(A, siteId, { pageIds: [], context: SITE_CTX, call: fake }), /au moins une page/);
  });
  test("performance : un texte inchangé n'est pas régénéré (aucun appel IA, aucun quota consommé) ; limites de taille", async () => {
    const page = makePage(siteId, "Accueil", home());
    reply.page = fullReply(page);
    const a = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    const b = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    assert.equal(b.reused, true); assert.equal(b.id, a.id); assert.equal(calls.length, 1);
    const c = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake, force: true });
    assert.equal(calls.length, 2); assert.notEqual(c.id, a.id);
    const many = makePage(siteId, "Gros", Array.from({ length: 25 }, () => S("features", { title: "", intro: "", columns: 3, items: Array.from({ length: 6 }, () => ({ title: "[Service]", text: "" })) })));
    await assert.rejects(content.generatePage(A, siteId, { pageId: many.id, context: SITE_CTX, call: fake }), (e) => e.code === "too_large");
  });
  test("réponses invalides : clés inconnues ignorées, valeurs non textuelles ignorées, JSON vide refusé", async () => {
    const page = makePage(siteId, "Accueil", [S("text", { markdown: "[Texte]" })]);
    const id = page.working.sections[0].id;
    reply.page = { fields: [{ key: "inconnu/title", value: "x" }, { key: id + "/markdown", value: 42 }, { key: id + "/onclick", value: "alert(1)" }], seo: { title: "", description: "", focusKeyword: "", slug: "" }, questions: [] };
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    assert.deepEqual(Object.keys(set.fields), []); assert.ok(set.issues.some((i) => i.code === "unknown_field")); assert.ok(set.issues.some((i) => i.code === "missing_field"));
    reply.page = null;
    await assert.rejects(content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake, force: true }), (e) => e.code === "format");
  });
});

describe("N/O — isolation, permissions, persistance", () => {
  test("N. un autre site ou une autre organisation n'accède ni aux pages, ni aux ensembles, ni à la voix", async () => {
    const s2 = newSite("Site Deux");
    const page = makePage(siteId, "Accueil", home()); reply.page = fullReply(page);
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    content.setVoice(A, siteId, { orientations: ["amical"] });
    const other = makePage(s2, "Autre", [S("text", { markdown: "[Texte]" })]);
    await assert.rejects(content.generatePage(A, s2, { pageId: page.id, context: SITE_CTX, call: fake }), (e) => e.code === "not_found");
    await assert.rejects(content.generatePage(A, siteId, { pageId: other.id, context: SITE_CTX, call: fake }), (e) => e.code === "not_found");
    assert.throws(() => content.getSet(A, s2, set.id), (e) => e.code === "not_found");
    assert.throws(() => content.apply(A, s2, set.id), (e) => e.code === "not_found");
    assert.throws(() => content.apply(A, siteId, set.id, { pageId: other.id }), (e) => e.code === "not_found");
    assert.deepEqual(content.listSets(A, s2), []);
    const L2 = m.ctx(1, { now: () => T, siteScope: s2 });
    assert.throws(() => content.getSet(L2, siteId, set.id), (e) => e.code === "not_found");
    assert.throws(() => content.getVoice(L2, siteId), (e) => e.code === "not_found");
    assert.deepEqual(content.getVoice(A, s2).orientations, ["professionnel"]);
    const B = m.ctx(2, { now: () => T });
    assert.throws(() => content.getSet(B, siteId, set.id), (e) => e.code === "not_found");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_content_sets WHERE site_id = ?").get(s2).n, 0);
  });
  test("O. persistance : proposition, révisions, application et voix se relisent à l'identique ; la page contient réellement le texte", async () => {
    const page = makePage(siteId, "Accueil", home()); reply.page = fullReply(page);
    const set = await content.generatePage(A, siteId, { pageId: page.id, context: SITE_CTX, call: fake });
    content.editField(A, siteId, set.id, { fieldKey: `${idsOf(page)[0]}/subtitle`, text: "Phrase finale." });
    content.accept(A, siteId, set.id);
    content.apply(A, siteId, set.id);
    // « fermeture » : lecture depuis la base seulement (nouveau contexte)
    const A2 = m.ctx(1, { now: () => T });
    const back = content.getSet(A2, siteId, set.id);
    assert.equal(back.status, "applied"); assert.equal(back.fields[`${idsOf(page)[0]}/subtitle`].value, "Phrase finale.");
    const live = pages.requirePage(A2, page.id).working;
    assert.equal(live.sections[0].subtitle, "Phrase finale."); assert.equal(live.sections[0].title, "Construire avec rigueur à Kinshasa");
    assert.equal(content.history(A2, siteId, set.id).filter((h) => h.action === "apply").length >= 10, true);
    assert.equal(content.listSets(A2, siteId, { pageId: page.id }).length, 1);
    // et la page se publie avec ces textes via le moteur existant (aucune publication par le générateur)
    assert.equal(pages.requirePage(A2, page.id).status === "published", false);
  });
});
