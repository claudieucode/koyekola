// Programme 22.7 — Advanced AI Image Intelligence. Modules purs (images synthétiques fabriquées avec sharp : résultats vérifiables), service (base en mémoire + dossier jetable), web (vrai serveur).
// Aucune image d'IA, aucun appel réseau, aucune source externe : l'analyse porte sur des pixels, jamais sur un « sujet » reconnu.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-imgintel-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const sharp = require("sharp");
const { freshMarketing } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const pages = require("../src/marketing/pages");
const am = require("../src/aiMedia");
const planner = require("../src/aiMedia/planner");
const ii = require("../src/imageIntel");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

const solid = (w, h, [r, g, b], fmt = "png") => sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })[fmt]().toBuffer();
const noise = (w, h) => sharp(crypto.randomBytes(w * h * 3), { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 95 }).toBuffer();
const scene = async (w, h, bg, [r, g, b], left, top, size) => sharp({ create: { width: w, height: h, channels: 3, background: { r: bg, g: bg, b: bg } } }).composite([{ input: await solid(size, size, [r, g, b]), left, top }]).png().toBuffer();
const jaccard = (a, b) => { const A = new Set(ii.brief.norm(a).split(/\W+/)), B = new Set(ii.brief.norm(b).split(/\W+/)); const i = [...A].filter((x) => B.has(x)).length; return i / (A.size + B.size - i); };

describe("22.7 · analyse de pixels (réelle, sans reconnaissance de sujet)", () => {
  test("image sombre uniforme : luminosité, contraste, teinte dominante et drapeaux mesurés ; sujet jamais deviné", async () => {
    const a = await ii.analyzer.analyze(await solid(800, 600, [20, 30, 200]));
    assert.equal(a.available, true); assert.equal(a.subject, null); assert.match(a.subjectNote, /pas identifié/);
    assert.ok(a.luminance < 0.2 && a.contrast < 0.02 && a.saturation > 0.7);
    assert.equal(a.dominantHues[0].hue, 225); assert.equal(a.orientation, "paysage"); assert.equal(a.ratio, "4:3");
    assert.deepEqual(a.flags.map((f) => f.code).sort(), ["peu_contrastee", "trop_sombre"]);
  });
  test("netteté : un bruit détaillé est net, un aplat n'a aucun détail ; une petite image est signalée", async () => {
    const sharpImg = await ii.analyzer.analyze(await noise(800, 600)), flat = await ii.analyzer.analyze(await solid(300, 300, [120, 120, 120]));
    assert.ok(sharpImg.sharpness > 100 && flat.sharpness === 0);
    assert.ok(flat.flags.some((f) => f.code === "petite"));
    const soft = await ii.analyzer.analyze(await sharp(await scene(800, 600, 60, [230, 230, 230], 300, 200, 200)).blur(25).png().toBuffer());
    assert.ok(soft.flags.some((f) => f.code === "floue") || soft.sharpness < 15, "une image très floutée est détectée");
  });
  test("point d'intérêt (heuristique de contraste) et côté calme : un carré rouge à droite attire le point focal ; le texte va à gauche", async () => {
    const a = await ii.analyzer.analyze(await scene(800, 600, 120, [220, 30, 30], 520, 200, 200));
    assert.ok(a.focal.x > 0.7 && a.focal.y > 0.35 && a.focal.y < 0.65, JSON.stringify(a.focal));
    assert.equal(a.calmSide, "gauche"); assert.equal(a.dominantHues[0].hue, 15);
  });
  test("poids, format, transparence, orientation portrait ; conseil de PNG lourd sans transparence", async () => {
    const png = await sharp(crypto.randomBytes(900 * 1200 * 3), { raw: { width: 900, height: 1200, channels: 3 } }).png().toBuffer();
    const a = await ii.analyzer.analyze(png); assert.equal(a.format, "png"); assert.equal(a.orientation, "portrait"); assert.equal(a.hasAlpha, false); assert.ok(a.bytes > 400 * 1024);
    assert.ok(a.flags.some((f) => f.code === "lourde" || f.code === "png_sans_transparence"));
    await assert.rejects(() => ii.analyzer.analyze(Buffer.from("pas une image")));
    await assert.rejects(() => ii.analyzer.analyze(Buffer.alloc(0)));
  });
});

describe("22.7 · recadrage et point focal (non destructif)", () => {
  const img = { width: 2000, height: 1000, focal: { x: 0.8, y: 0.5 } };
  test("cover 16:9 sur une image large : région dans l'image, centrée sur le point focal, original intact", () => {
    const p = ii.crop.plan({ ...img, height: 1200 }, { ratio: "16:9" });
    assert.equal(p.destructive, false); assert.ok(p.region.x >= 0 && p.region.x + p.region.w <= 2000 && p.region.y + p.region.h <= 1200);
    assert.equal(Math.round((p.region.w / p.region.h) * 100) / 100, 1.78); assert.equal(p.focalSource, "analyse (heuristique)");
    assert.match(p.objectPosition, /^80% 50%$/); assert.equal(p.nativePosition, "right");
  });
  test("correction manuelle : le point focal choisi remplace celui de l'analyse", () => {
    const p = ii.crop.plan(img, { ratio: "1:1", focal: { x: 0.1, y: 0.5 } });
    assert.equal(p.focalSource, "manuel"); assert.equal(p.region.x, 0); assert.equal(p.nativePosition, "left");
  });
  test("modes : contain/none gardent tout ; fill déformant est signalé ; custom hors image refusé", () => {
    assert.equal(ii.crop.plan(img, { mode: "contain", ratio: "1:1" }).kept, 1);
    assert.match(ii.crop.plan(img, { mode: "fill", ratio: "1:1" }).warnings[0], /déforme/);
    assert.deepEqual(ii.crop.plan(img, { mode: "custom", region: { x: 100, y: 100, w: 500, h: 300 } }).region, { x: 100, y: 100, w: 500, h: 300 });
    assert.throws(() => ii.crop.plan(img, { mode: "custom", region: { x: 1900, y: 0, w: 500, h: 300 } }), /hors de l'image/);
    assert.throws(() => ii.crop.plan(img, { mode: "bizarre" }), /Mode inconnu/); assert.throws(() => ii.crop.plan(img, { ratio: "abc" }), /invalides/);
  });
  test("responsive : un hero large perd beaucoup sur mobile → variante dédiée conseillée ; pas de fichier de plus par défaut", () => {
    const d = ii.crop.perDevice({ width: 3000, height: 1000, focal: { x: 0.75, y: 0.5 } });
    assert.equal(d.desktop.dedicatedVariantAdvised, false); assert.equal(d.mobile.dedicatedVariantAdvised, true); assert.ok(d.mobile.warnings.length > 0);
    assert.deepEqual(Object.keys(d), ["desktop", "tablet", "mobile"]);
  });
});

describe("22.7 · fiche de besoin visuel et propositions", () => {
  const base = { role: "service", mood: "luxe", hue: 222 };
  test("secteurs demandés : immobilier, technologie, santé, restauration, portfolio → sujets propres à chacun", () => {
    const cases = { "agence immobilière": /salon|cuisine|chambre|bain/, "éditeur de logiciel saas": /interface|serveur|circuits|appareil/, "cabinet médical": /soins|médical|santé|attente/, "restaurant gastronomique": /plat|ingrédients|dessert|brigade/, "portfolio de photographe": /projet|matière|outils|maquette/ };
    for (const [sector, re] of Object.entries(cases)) {
      const subjects = new Set([0, 1, 2, 3].map((i) => ii.brief.visualBrief({ ...base, sectorText: sector, index: i }).subject));
      assert.ok([...subjects].some((s) => re.test(s)), `${sector} : ${[...subjects].join(" | ")}`);
    }
  });
  test("facette : « visite des intérieurs » privilégie l'intérieur et écarte l'immeuble ; le texte « quartier » demande l'extérieur", () => {
    const i = ii.brief.visualBrief({ ...base, sectorText: "agence immobilière", sectionText: "Visitez nos intérieurs : salon et cuisine" });
    assert.equal(i.facet, "interior"); assert.ok(i.avoid.includes("immeuble")); assert.ok(i.wanted.includes("salon"));
    assert.equal(ii.brief.visualBrief({ ...base, sectorText: "agence immobilière", sectionText: "Le quartier et ses jardins" }).facet, "exterior");
  });
  test("composition : sujet à droite / texte à gauche pour un bandeau, ratio de génération pris en charge, jamais de texte dans l'image", () => {
    const b = ii.brief.visualBrief({ ...base, role: "hero", sectorText: "restaurant" });
    assert.deepEqual([b.composition.subjectSide, b.composition.textSide, b.ratio, b.displayRatio], ["right", "left", "3:2", "16:9"]);
    assert.match(b.prompt, /placé à droite, espace libre à gauche/); assert.match(b.prompt, /Aucun texte, lettrage, logo/);
    const left = ii.brief.visualBrief({ ...base, role: "hero", sectorText: "restaurant", side: "left" });
    assert.match(left.prompt, /placé à gauche, espace libre à droite/);
    for (const r of Object.keys(ii.brief.ROLES)) assert.ok(["1:1", "3:2", "2:3"].includes(ii.brief.ROLES[r].gen), r);
  });
  test("plusieurs propositions réellement différentes (sujets, angles, côté), même identité visuelle", () => {
    const ps = ii.brief.proposals({ ...base, sectorText: "agence immobilière" }, 3);
    assert.equal(ps.length, 3); assert.equal(new Set(ps.map((p) => p.angle)).size, 3); assert.equal(new Set(ps.map((p) => p.subject)).size, 3);
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.ok(jaccard(ps[i].prompt, ps[j].prompt) < 0.7, `propositions ${i}/${j} trop proches`);
    for (const p of ps) assert.match(p.prompt, /bleu marine/);
  });
  test("témoignage : aucune photo générée pour une personne (droit à l'image)", () => {
    const t = ii.brief.visualBrief({ ...base, role: "testimonial", sectorText: "x" });
    assert.equal(t.allowed, false); assert.match(t.reason, /droit à l'image/); assert.deepEqual(ii.brief.proposals({ ...base, role: "testimonial" }, 3), []);
  });
  test("planificateur 21.7 : la consigne du bandeau précise désormais le côté du sujet et du texte", () => {
    const p = planner.promptFor({ siteName: "A", category: "immobilier", sector: "", description: "", mood: "luxe", hue: 222 }, "hero");
    assert.match(p, /Sujet placé à droite, grand espace libre à gauche/);
    assert.notEqual(planner.promptFor({ category: "immobilier", mood: "luxe", hue: 222 }, "extra", 0), planner.promptFor({ category: "immobilier", mood: "luxe", hue: 222 }, "extra", 1));
  });
});

describe("22.7 · pertinence, cohérence avec la marque", () => {
  const brief = ii.brief.visualBrief({ role: "service", sectorText: "agence immobilière", sectionText: "Visite des intérieurs : salon et cuisine", mood: "luxe", hue: 222 });
  test("un salon passe avant l'immeuble ; une image sans description n'est pas évaluable (sujet non deviné)", () => {
    const r = ii.relevance.rank([{ id: 1, name: "immeuble-facade-ville.jpg", alt: "Immeuble en centre-ville" }, { id: 2, name: "salon.jpg", alt: "Salon lumineux avec grandes baies", tags: ["intérieur"] }, { id: 3, name: "IMG_20240101_123456.jpg" }], brief);
    assert.deepEqual(r.map((x) => x.id), [2, 3, 1]); assert.ok(r[0].score > 50 && r[2].score === 0);
    assert.equal(r[1].evaluable, false); assert.equal(r[1].score, 0); assert.match(r[1].reasons[0], /pas deviné/);
    assert.ok(r[2].reasons.some((x) => /éviter/.test(x)), "l'image désignée hors sujet passe après l'image inconnue");
  });
  test("avec l'analyse : orientation et côté calme pris en compte (preuve « métadonnées + pixels »)", async () => {
    const a = await ii.analyzer.analyze(await scene(800, 600, 120, [220, 30, 30], 520, 200, 200));
    const hero = ii.brief.visualBrief({ role: "hero", sectorText: "agence immobilière", mood: "luxe", hue: 222 });
    const r = ii.relevance.score({ id: 1, name: "facade.jpg", alt: "Façade d'une maison contemporaine avec jardin", analysis: a }, hero);
    assert.equal(r.evidence, "métadonnées + pixels"); assert.ok(r.reasons.some((x) => /plus calme/.test(x)) && r.reasons.some((x) => /Orientation adaptée/.test(x)));
  });
  test("correspondance à la teinte : proche / éloignée / neutre ; ambiance sombre", async () => {
    const blue = await ii.analyzer.analyze(await solid(500, 500, [30, 60, 200])), red = await ii.analyzer.analyze(await solid(500, 500, [210, 30, 30])), grey = await ii.analyzer.analyze(await solid(500, 500, [128, 128, 128]));
    const dir = { hue: 222, mood: "creatif" };
    assert.equal(ii.brand.match(blue, dir).score, 100); assert.ok(ii.brand.match(red, dir).score <= 65); assert.match(ii.brand.match(grey, dir).notes[0], /neutre/);
    assert.equal(ii.brand.match(null, dir).evaluable, false);
    const dark = await ii.analyzer.analyze(await solid(500, 500, [10, 10, 12])); assert.ok(ii.brand.match(dark, { hue: 222, mood: "minimaliste" }).notes.some((n) => /sombre/.test(n)));
  });
  test("cohérence : une image sombre parmi des claires = avertissement ; dans un portfolio = information (variété volontaire)", async () => {
    const light = [0, 1, 2].map(async () => ii.analyzer.analyze(await solid(500, 500, [220, 215, 205]))), dark = ii.analyzer.analyze(await solid(500, 500, [12, 12, 14]));
    const items = (await Promise.all([...light, dark])).map((analysis, id) => ({ id, analysis }));
    const strict = ii.brand.consistency(items), loose = ii.brand.consistency(items, { variety: true });
    assert.equal(strict.issues.length, 1); assert.equal(strict.issues[0].id, 3); assert.equal(strict.issues[0].level, "warn");
    assert.equal(loose.issues[0].level, "info"); assert.equal(loose.issues[0].voluntary, true);
    assert.equal(ii.brand.consistency(items.slice(0, 2)).evaluable, false);
  });
});

describe("22.7 · texte alternatif, licences, optimisation", () => {
  test("classes : décorative = ALT vide ; fonctionnelle = libellé de l'action ; informative sans source = « à décrire » (rien d'inventé)", () => {
    assert.equal(ii.alt.classify({ role: "background" }), "decorative"); assert.equal(ii.alt.classify({ linked: true }), "functional"); assert.equal(ii.alt.classify({ chart: true }), "complex");
    assert.deepEqual(ii.alt.propose({ imageClass: "decorative", source: { description: "x" } }).alt, "");
    assert.equal(ii.alt.propose({ imageClass: "functional", actionLabel: "Voir la fiche du bien" }).alt, "Voir la fiche du bien");
    const none = ii.alt.propose({ imageClass: "informative" }); assert.equal(none.status, "to_describe"); assert.equal(none.alt, "");
    const ok = ii.alt.propose({ imageClass: "informative", source: { description: "Photo de la façade en pierre claire au coucher du soleil" } }); assert.equal(ok.alt, "La façade en pierre claire au coucher du soleil"); assert.equal(ok.status, "ok");
    assert.equal(ii.alt.propose({ imageClass: "complex", source: { description: "Schéma" } }).status, "needs_long_description");
    assert.equal(ii.alt.propose({ imageClass: "informative", source: { description: "Salon" }, siblings: ["Salon"] }).status, "duplicate");
  });
  test("contrôle : absent, trop long, préfixe inutile, nom de fichier, bourrage de mots-clés, doublon", () => {
    const codes = (a, o) => ii.alt.validate(a, o).map((x) => x.code);
    assert.deepEqual(codes(""), ["missing"]); assert.deepEqual(codes("", { imageClass: "decorative" }), []); assert.deepEqual(codes("x", { imageClass: "decorative" }), ["decorative_not_empty"]);
    assert.ok(codes("a".repeat(130)).includes("too_long")); assert.ok(codes("Photo de la façade").includes("redundant_prefix")); assert.ok(codes("IMG_2024.jpg").includes("filename"));
    assert.ok(codes("immobilier paris, immobilier luxe, immobilier pas cher, immobilier agence").includes("keyword_stuffing"));
    assert.ok(codes("Salon", { siblings: ["salon"] }).includes("duplicate")); assert.deepEqual(codes("Salon lumineux ouvert sur la terrasse"), []);
  });
  test("licences : inconnue ≠ libre de droits ; CC BY exige un crédit ; NC interdit au commerce ; CC0 seul est « libre de droits »", () => {
    assert.equal(ii.licenses.checkLicense({}).canClaimRoyaltyFree, false); assert.equal(ii.licenses.checkLicense({ license: "libre de droits" }).usable, "unverified");
    assert.equal(ii.licenses.checkLicense({ license: "cc-by" }).usable, "crédit manquant"); assert.equal(ii.licenses.checkLicense({ license: "cc-by", author: "A. B." }).usable, "ok");
    assert.equal(ii.licenses.checkLicense({ license: "cc-by-nc", author: "x" }).usable, "non commercial seulement");
    assert.equal(ii.licenses.checkLicense({ license: "CC0" }).canClaimRoyaltyFree, true); assert.equal(ii.licenses.checkLicense({ license: "unsplash" }).canClaimRoyaltyFree, false);
    assert.equal(ii.licenses.checkLicense({ license: "ai-generated" }).commercial, "unknown");
  });
  test("sources externes : aucune n'est intégrée ni vérifiée ; l'import automatique est refusé ; chaque fiche a ses champs", () => {
    const ext = ii.licenses.SOURCES.filter((s) => !["internal", "ai-demo", "ai-openai"].includes(s.id));
    assert.ok(ext.length >= 8); for (const s of ext) { assert.equal(s.integrated, false, s.id); assert.equal(s.verified, false, s.id); for (const k of ["access", "auth", "cost", "license", "attribution", "commercial", "fallback"]) assert.ok(s[k], `${s.id}.${k}`); assert.equal(ii.licenses.autoImportAllowed(s.id), false); }
    assert.equal(ii.licenses.byId("ai-openai").verified, false);
  });
  test("optimisation : animation et transparence préservées ; dérivation WebP plus légère ; l'original n'est pas modifié", async () => {
    const photo = await noise(1600, 1000); const copy = Buffer.from(photo);
    const d = await ii.optimize.derive(photo, { width: 800, format: "webp", quality: 70 });
    assert.equal(d.format, "webp"); assert.equal(d.width, 800); assert.ok(d.bytes < photo.length); assert.ok(photo.equals(copy), "original intact");
    const alpha = await sharp({ create: { width: 50, height: 50, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } }).png().toBuffer();
    await assert.rejects(() => ii.optimize.derive(alpha, { format: "jpeg" }), /Transparence/);
    assert.equal((await ii.optimize.derive(alpha, { format: "webp" })).format, "webp");
    const gif = await sharp([await solid(30, 30, [255, 0, 0]), await solid(30, 30, [0, 0, 255])], { join: { animated: true } }).gif({ loop: 0 }).toBuffer();
    await assert.rejects(() => ii.optimize.derive(gif, { format: "webp" }), /animée/);
    const adv = ii.optimize.advise({ available: true, animated: true, hasAlpha: false, format: "gif", width: 300, bytes: 5e6 }); assert.ok(adv.keep[0].includes("animée"));
    assert.ok(ii.optimize.advise({ available: true, animated: false, hasAlpha: false, format: "png", width: 4000, bytes: 3e6 }, { displayWidth: 800 }).advice.length >= 2);
  });
  test("SVG : le contrôle liste les constructions dangereuses ; l'envoi de SVG reste refusé par la médiathèque", () => {
    const s = ii.optimize.scanSvg("<svg xmlns='http://www.w3.org/2000/svg' onload='x()'><script>a()</script><image href='https://evil.test/a.png'/></svg>");
    assert.equal(s.isSvg, true); assert.equal(s.dangerous, true); assert.ok(s.found.length >= 3); assert.equal(ii.optimize.scanSvg("<svg><path d='M0 0'/></svg>").dangerous, false);
  });
});

describe("22.7 · intégration à la médiathèque d'un site (base réelle, isolation)", () => {
  let m, A, sid, other;
  const upload = async (buf, name, siteId = sid, fmt = "image/jpeg") => require("../src/marketing/media").saveUpload({ ...A, siteFilter: siteId }, { buffer: buf, originalName: name, declaredType: fmt, allow: ["image"], siteId });
  beforeEach(() => { m = freshMarketing(); A = m.ctx(1); sid = pages.createSite(A, { name: "Agence" }).id; other = pages.createSite(A, { name: "Autre" }).id; });

  test("analyse d'une image du site : analyse + cadrage par appareil + licence inconnue + ALT à décrire ; mise en cache", async () => {
    const up = await upload(await noise(1200, 800), "salon.jpg");
    const r = await ii.inspect(A, sid, up.id, { ratio: "16:9" });
    assert.equal(r.analysis.available, true); assert.equal(r.crop.destructive, false); assert.ok(r.devices.mobile); assert.equal(r.license.canClaimRoyaltyFree, false); assert.equal(r.license.usable, "unverified");
    assert.ok(r.alt.issues.some((i) => i.code === "missing"));
    assert.equal((await ii.analyzeMedia(A, sid, up.id)).cached, true);
    const f = await ii.inspect(A, sid, up.id, { ratio: "1:1", focal: { x: 0.1, y: 0.2 } }); assert.equal(f.crop.focalSource, "manuel");
  });
  test("isolation : l'image d'un autre site est introuvable (analyse, inspection)", async () => {
    const foreign = await upload(await noise(600, 400), "autre.jpg", other);
    await assert.rejects(() => ii.analyzeMedia(A, sid, foreign.id), (e) => e.code === "not_found");
    await assert.rejects(() => ii.inspect(A, sid, foreign.id), (e) => e.code === "not_found");
    const d = await ii.siteDiagnostic(A, sid); assert.equal(d.count, 0);
  });
  test("diagnostic : doublon strict, image inutilisée, image lourde/petite, licence non vérifiée, cohérence", async () => {
    const same = await noise(900, 600);
    const a = await upload(same, "a.jpg"), b = await upload(Buffer.from(same), "b.jpg");
    const tiny = await upload(await solid(120, 80, [200, 200, 200], "png"), "mini.png", sid, "image/png");
    const d = await ii.siteDiagnostic(A, sid);
    assert.equal(d.count >= 3, true);
    assert.equal(d.summary.duplicates, 1, JSON.stringify(d.duplicates)); assert.deepEqual(d.duplicates[0].sort(), [a.id, b.id].sort());
    assert.equal(d.summary.unused, d.count); assert.ok(d.summary.lowQuality >= 1); assert.equal(d.summary.licenseUnverified, d.count);
    assert.ok(d.items.find((i) => i.id === tiny.id).flags.includes("petite")); assert.match(d.limits, /sujet des images n'est pas identifié/);
    assert.equal(d.consistency.evaluable, true);
  });
  test("recommandations : propositions différentes pour le bandeau planifié + classement des images de la médiathèque", async () => {
    m.db.prepare("UPDATE mk_sites SET description = 'Agence immobilière haut de gamme' WHERE id = ?").run(sid);
    const p = pages.createPage(A, { name: "Accueil", siteId: sid, kind: "page", blank: true }), fresh = pages.requirePage(A, p.id);
    pages.saveDraft(A, p.id, { ...fresh.working, sections: [{ type: "hero", title: "Bienvenue" }] }, { revision: fresh.revision });
    const needs = am.plan(A, sid), hero = needs.find((n) => n.widget === "hero");
    const up = await upload(await noise(1200, 800), "salon.jpg"); am.describe(A, sid, up.id, { tags: ["salon", "intérieur"], alt: "Salon lumineux" });
    const r = await ii.recommend(A, sid, hero.key, { proposals: 3 });
    assert.equal(r.proposals.length, 3); assert.equal(new Set(r.proposals.map((x) => x.subject)).size >= 2, true); assert.equal(r.brief.role, "hero");
    assert.equal(r.ranking[0].id, up.id); assert.match(r.note, /sujet réel de l'image n'est pas reconnu/);
    await assert.rejects(() => ii.recommend(A, sid, "inconnu:x:y"), (e) => e.code === "not_found");
  });
  test("SVG : l'envoi reste refusé par la médiathèque (code potentiellement actif)", async () => {
    await assert.rejects(async () => upload(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' onload='x()'><script>a()</script></svg>"), "a.svg", sid, "image/svg+xml"), /SVG/);
  });
  test("aucune dépense : l'intelligence visuelle n'appelle aucun fournisseur (aucune tâche, aucune consommation)", async () => {
    const p = await upload(await noise(600, 400), "x.jpg"); await ii.inspect(A, sid, p.id); await ii.siteDiagnostic(A, sid);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n, 0);
  });
});

describe("22.7 · web : routes, droits et isolation entre sites", () => {
  let srv, boss, db, A, B, adminB, viewerA;
  const G = (id, rest) => `/marketing/site-web/sites/${id}/medias-ia${rest}`;
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" }); boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => { await boss.post("/marketing/site-web/sites", { name: n }); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(n).id; };
    A = await mk("Intel A"); B = await mk("Intel B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminB = await member(B, "admin"); viewerA = await member(A, "viewer");
  });
  after(() => { db.close(); return srv.stop(); });
  test("diagnostic et sources : lecture autorisée à l'équipe ; JSON sans cache ; jamais d'appel de fournisseur", async () => {
    const d = await boss.get(G(A, "/diagnostic.json")); assert.equal(d.status, 200); const j = JSON.parse(d.text); assert.equal(j.count, 0); assert.ok(j.limits);
    const s = JSON.parse((await boss.get(G(A, "/sources.json"))).text); assert.ok(s.sources.every((x) => x.id.startsWith("internal") || x.id.startsWith("ai-") || x.integrated === false)); assert.match(s.note, /aucune source externe/);
    const r = await boss.get(G(A, "/recommandations.json?besoin=nope")); assert.equal(r.status, 404);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n, 0);
  });
  test("un administrateur du site B ne lit ni le diagnostic ni l'analyse du site A", async () => {
    for (const rest of ["/diagnostic.json", "/sources.json", "/medias/1/analyse.json", "/recommandations.json?besoin=x"]) assert.ok([403, 404].includes((await adminB.get(G(A, rest))).status), rest);
  });
  test("un lecteur du site peut consulter (lecture seule) ; une image inexistante répond 404", async () => {
    assert.equal((await viewerA.get(G(A, "/diagnostic.json"))).status, 200);
    assert.equal((await boss.get(G(A, "/medias/999999/analyse.json"))).status, 404);
  });
});
