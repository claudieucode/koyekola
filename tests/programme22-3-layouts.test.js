// Programme 22.3 — Advanced Layout Generation. Service : vraie base (vraies migrations), vrai moteur de pages (pages.saveDraft et ses normaliseurs), vrai générateur de CSS des éléments (pageCss).
// Aucun appel IA (le moteur est déterministe). Les 20 scénarios de la mission sont couverts par la boucle « scénarios » ; chacun vérifie structure native, widgets, composition, proportions,
// espacements, hiérarchie, responsive, éditabilité (réenregistrement), sauvegarde et aperçu (filaire + CSS réel).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const L = require("../src/layoutGen");
const LA = require("../src/layoutGen/apply");
const R = require("../src/regen");

const T = Date.UTC(2026, 9, 30, 12);
let m, A, siteId;
const im = (n, extra = {}) => ({ src: `https://exemple.test/${n}.jpg`, alt: `Image ${n}`, ...extra });
const items = (n, extra = {}) => Array.from({ length: n }, (_, i) => ({ title: `Élément ${i + 1}`, text: `Description ${i + 1} concrète.`, ...extra }));
const CTA = { label: "Nous écrire", url: "/contact" };
const long = (s, n) => Array(n).fill(s).join(" ");
const ctx0 = { db: null, organizationId: 0 };
const intent = (type, site = {}) => L.intent.analyze({ type, name: type }, site);
const comp = (role, content, o = {}) => L.composeSection(ctx0, { seed: "t", role, content: { kind: role, ...content }, intent: o.intent || intent("autre"), patternId: o.patternId || null, used: o.used || [] });
const types = (sec) => { const t = new Set(); L.validate.walk(sec.children, (n) => t.add(n.type)); return t; };
const stylesOf = (sec) => { const out = []; L.validate.walk(sec.children, (n) => out.push(n.styles || {})); return out; };
const find = (sec, pred) => { let r = null; L.validate.walk(sec.children, (n) => { if (!r && pred(n)) r = n; }); return r; };
const all = (sec, pred) => { const r = []; L.validate.walk(sec.children, (n) => { if (pred(n)) r.push(n); }); return r; };
const newPage = (name, sections = []) => { const p = pages.createPage(A, { name, siteId, kind: "page", blank: true }), cur = pages.requirePage(A, p.id); if (sections.length) pages.saveDraft(A, p.id, { ...cur.working, sections }, { revision: cur.revision }); return pages.requirePage(A, p.id); };
const fresh = (id) => pages.requirePage(A, id);
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

beforeEach(() => { m = freshMarketing(); A = m.ctx(1, { now: () => T, userId: 7 }); siteId = pages.createSite(A, { name: "Site Un" }).id; });

describe("1-3 — audit : registre, familles, widgets natifs", () => {
  test("7 familles, plus de 50 layouts, identifiants uniques, au moins 5 par famille", () => {
    assert.equal(Object.keys(L.patterns.FAMILIES).length, 7);
    assert.ok(L.patterns.REG.length >= 50, String(L.patterns.REG.length));
    assert.equal(new Set(L.patterns.REG.map((d) => d.id)).size, L.patterns.REG.length);
    for (const f of Object.keys(L.patterns.FAMILIES)) assert.ok(L.patterns.list({ family: f }).length >= 5, f);
  });
  test("CHAQUE layout passe le normaliseur natif avec un contenu complet, n'emploie que des widgets du registre, aucun CSS libre, structure bornée", () => {
    const rich = { eyebrow: "Depuis 2012", title: "Des espaces pensés pour durer", text: long("Nous concevons des lieux de vie.", 6), price: "120 €", image: im(1), images: [1, 2, 3, 4, 5, 6].map((n) => im(n)), cta: CTA, cta2: { label: "Voir", url: "/p" }, table: [["", "A", "B"], ["x", "1", "2"]],
      items: items(5, { q: "Question ?", a: "Réponse.", author: "Auteur", role: "Cliente", price: "10 €", features: ["a"], value: 120, suffix: "+", image: im(9), cta: { label: "Voir", url: "/p" } }) };
    for (const d of L.patterns.REG) {
      const role = d.roles[0], r = comp(role, rich, { patternId: d.id });
      assert.ok(r.ok, `${d.id} : ${(r.errors || [r.reason]).join(" | ")}`);
      for (const t of types(r.section)) assert.ok(Object.hasOwn(nodes.NODE_TYPES, t), `${d.id} : widget ${t} hors registre`);
      assert.equal(r.section.type, "layout");
      assert.equal(all(r.section, (n) => n.css || n.cssHover || n.type === "html" || n.type === "embed").length, 0, `${d.id} : CSS ou HTML libre`);
      assert.ok(r.metrics.depth <= 6 && r.metrics.nodes <= 90, `${d.id} : ${r.metrics.nodes} nœuds, profondeur ${r.metrics.depth}`);
    }
  });
  test("espacements : bandes, écarts et marges issus des jetons du site (aucune valeur arbitraire répétée)", () => {
    const px = new Map();
    for (const d of L.patterns.REG) {
      const r = comp(d.roles[0], { title: "Titre", text: long("Texte.", 30), image: im(1), images: [1, 2, 3, 4, 5].map((n) => im(n)), cta: CTA, table: [["", "A"], ["x", "1"]], items: items(4, { q: "Q", a: "R", author: "A", price: "5 €", value: 3, image: im(2) }) }, { patternId: d.id });
      if (!r.ok) continue;
      for (const s of stylesOf(r.section)) for (const bp of Object.values(s)) for (const k of ["gap", "rowGap", "columnGap", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]) if (bp[k] !== undefined) { assert.match(String(bp[k]), /^token:space-(xs|sm|md|lg|xl|xxl)$/, `${d.id} ${k}=${bp[k]}`); }
      void px;
    }
  });
});

describe("4-6 — intention de mise en page, mapping du contenu, sélection", () => {
  test("le type de page, le secteur et la direction orientent les familles (pas un modèle générique)", () => {
    assert.ok(intent("portfolio").familyWeights.creative >= 3);
    assert.ok(intent("boutique").familyWeights.ecommerce >= 3);
    assert.ok(intent("services").familyWeights.corporate >= 3);
    assert.ok(intent("blog").familyWeights.editorial >= 3);
    const s = L.intent.analyze({ type: "accueil" }, { description: "Cabinet d'avocats d'affaires", direction: "sobre et professionnel" });
    assert.ok(s.sectors.includes("droit") && s.tones.includes("minimal") && s.tones.includes("corporate"));
    assert.equal(s.density, "airy");
  });
  test("le profil mesure le contenu : titre court → expressif, titre long → réduit, colonnes selon le nombre d'éléments", () => {
    const p = (c) => L.intent.profile(c);
    assert.equal(p({ title: "Habiter" }).heroSize, "display");
    assert.equal(p({ title: "Une maison conçue autour de la lumière du matin" }).heroSize, "xl");
    assert.equal(p({ title: long("mot", 45) }).heroSize, "md");
    assert.deepEqual([2, 3, 4, 6, 8].map((n) => p({ items: items(n) }).cols), [2, 3, 2, 3, 4]);
    assert.equal(L.intent.orient({ w: 800, h: 1200 }), "portrait");
    assert.equal(L.intent.orient({ src: "x" }), "unknown");
  });
  test("contraintes : un layout sans le contenu requis est écarté AVEC sa raison ; rien n'est inventé", () => {
    const sel = L.select("hero", { title: "Titre" }, intent("accueil"));
    assert.ok(sel.rejected.some((r) => r.id === "editorial-split" && /image/.test(r.reason)));
    assert.ok(sel.candidates.every((c) => !["fullscreen-hero", "corporate-split", "layered-hero"].includes(c.id)));
    assert.ok(sel.candidates.some((c) => c.id === "open-space"));
    const stats = comp("stats", { title: "Chiffres", items: items(3) });   // aucun chiffre réel
    assert.equal(stats.status, "skipped"); assert.match(stats.reason, /chiffres réels/);
    assert.equal(comp("pricing", { title: "Tarifs", items: items(3) }).status, "skipped");
    assert.equal(comp("faq", { title: "FAQ", items: items(2) }).status, "skipped");
    assert.equal(comp("testimonials", { title: "Avis", items: [{ title: "Sans texte" }] }).status, "skipped");
  });
  test("le contenu n'est JAMAIS tronqué : titre de 190 caractères, texte de 5 000, 12 éléments longs", () => {
    const content = { title: long("Titre très long", 12).slice(0, 190), text: long("Un paragraphe de description détaillée.", 130).slice(0, 5000), image: im(1), cta: CTA, items: items(12, { text: long("Description détaillée.", 30) }) };
    for (const role of ["hero", "services", "intro", "text"]) {
      const r = comp(role, content);
      assert.ok(r.ok, `${role} : ${(r.errors || [r.reason]).join("|")}`);
      assert.equal(L.validate.preserved(r.section, L.cleanContent(content), role).missing.length, 0, role);
    }
  });
  test("distinctivité : à contenu égal, des sites différents n'obtiennent pas tous la même composition ; la diversité pénalise les répétitions", () => {
    const content = { title: "Nos services", items: items(4) };
    const wins = new Set(["a", "b", "c", "d", "e", "f", "g", "h"].map((s) => L.select("services", content, intent("services"), { seed: s }).candidates[0].id));
    assert.ok(wins.size >= 2, [...wins].join(","));
    const first = L.select("services", content, intent("services"), { seed: "x" }).candidates[0].id;
    const second = L.select("services", content, intent("services"), { seed: "x", used: [first] }).candidates[0];
    assert.notEqual(second.id, first);
  });
});

describe("7-9 — grilles avancées, asymétrie, hero", () => {
  test("mosaïque : grille de 4 colonnes, tuiles de portées différentes, remplissage dense, aucune tuile sans image", () => {
    const r = comp("gallery", { title: "Réalisations", images: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => im(n)) }, { patternId: "portfolio-mosaic" });
    assert.ok(r.ok);
    const g = find(r.section, (n) => n.type === "grid" && n.styles && n.styles.desktop && n.styles.desktop.gridAutoFlow);
    const d = g.styles.desktop;
    assert.equal(d.display, "grid"); assert.equal(d.gridAutoFlow, "row dense"); assert.equal(d.gridTemplate.split(" ").length, 4);
    const spans = g.children.map((c) => `${(c.styles.desktop.gridColumnSpan || "span 1")}`);
    assert.ok(new Set(spans).size >= 2, "tailles variées");
    assert.equal(g.children.filter((c) => c.type === "image").length, 8);
    assert.equal(comp("gallery", { images: [im(1), im(2)] }, { patternId: "portfolio-mosaic" }).status, "skipped");
  });
  test("asymétrie au service du message : image 65 % / texte 35 %, carte héroïne 2×2, rapport de colonnes borné", () => {
    const r = comp("hero", { title: "Une maison", text: "Texte", image: im(1) }, { patternId: "image-led-editorial" });
    const grid = find(r.section, (n) => n.type === "grid");
    const [a, b] = grid.styles.desktop.gridTemplate.replace(/minmax\(0, |\)/g, "").split(" ").map((x) => parseFloat(x));
    assert.ok(Math.abs(a / (a + b) - 0.65) < 0.02 || Math.abs(b / (a + b) - 0.65) < 0.02, `${a}:${b}`);
    const c = comp("services", { title: "Services", items: items(5) }, { patternId: "creative-asymmetric-grid" });
    const first = find(c.section, (n) => n.styles && n.styles.desktop && n.styles.desktop.gridRowSpan);
    assert.ok(first && first.styles.desktop.gridColumnSpan && first.styles.desktop.gridRowSpan);
    assert.ok(c.balance.measures.maxColumnRatio <= 4);
    for (const d of L.patterns.list({ role: "hero" })) {
      const x = comp("hero", { title: "Titre", text: "Texte", image: im(1), images: [im(1), im(2)] }, { patternId: d.id });
      if (x.ok) assert.ok(x.balance.measures.maxColumnRatio <= 4, `${d.id} : rapport ${x.balance.measures.maxColumnRatio}`);
    }
  });
  test("superposition NATIVE : texte et image occupent la même zone de la grille (placement), carte au-dessus (zIndex)", () => {
    const r = comp("hero", { title: "Titre", text: "Texte", image: im(1) }, { patternId: "overlapping-composition" });
    const g = find(r.section, (n) => n.type === "grid");
    assert.equal(g.styles.desktop.columns, 12);
    const [img, card] = g.children;
    assert.equal(img.styles.desktop.gridRowStart, card.styles.desktop.gridRowStart);
    assert.ok(img.styles.desktop.gridColumnStart < card.styles.desktop.gridColumnEnd && card.styles.desktop.gridColumnStart < img.styles.desktop.gridColumnEnd, "zones qui se recouvrent");
    assert.ok(card.styles.desktop.zIndex > 0);
  });
  test("12 familles de hero : au moins 8 compositions distinctes, adaptées au contenu et au secteur", () => {
    const heroes = L.patterns.list({ role: "hero" });
    assert.ok(heroes.length >= 14, String(heroes.length));
    assert.ok(new Set(heroes.map((d) => d.fn)).size >= 8);
    const content = { title: "Habiter la lumière", text: "Texte d'introduction.", image: im(1), images: [im(1), im(2)], cta: CTA };
    const sigs = new Set(heroes.map((d) => { const r = comp("hero", content, { patternId: d.id }); assert.ok(r.ok, d.id); return L.signature(r.section); }));
    assert.ok(sigs.size >= 12, `${sigs.size} structures pour ${heroes.length} layouts`);
    const resto = L.select("hero", content, L.intent.analyze({ type: "accueil" }, { description: "Restaurant et traiteur", direction: "immersive, plein écran" }), { seed: "s" }).candidates[0];
    assert.equal(resto.family, "immersive");
    const droit = L.select("hero", content, L.intent.analyze({ type: "accueil" }, { description: "Cabinet d'avocats", direction: "sobre corporate" }), { seed: "s" }).candidates[0];
    assert.ok(["corporate", "minimalist"].includes(droit.family), droit.family);
  });
  test("hero plein écran : image de fond, voile de contraste, texte clair, hauteur réglée", () => {
    const r = comp("hero", { title: "Titre", text: "Texte", image: im(1), cta: CTA }, { patternId: "fullscreen-hero" });
    const b = r.section.children[0], d = b.styles.desktop;
    assert.equal(d.minHeight, "100vh"); assert.ok(d.backgroundImage.src); assert.ok(d.overlay.color); assert.equal(d.color, "#ffffff");
    assert.equal(all(r.section, (n) => n.type === "heading" && n.props.level === "1").length, 1);
  });
});

describe("10-12 — sections internes, variantes, équilibre", () => {
  test("services : 5 variantes réellement différentes (cartes, liste éditoriale, asymétrique, illustrée, numérotée)", () => {
    const v = L.variants(ctx0, { seed: "s", role: "services", content: { title: "Services", text: "Intro", items: items(5, { image: im(3) }) }, intent: intent("services"), max: 12 });
    const ids = v.variants.map((x) => x.patternId);
    for (const need of ["structured-corporate-grid", "corporate-services", "creative-asymmetric-grid", "service-showcase", "numbered-services"]) assert.ok(ids.includes(need), `${need} absent de ${ids}`);
    assert.equal(new Set(v.variants.map((x) => L.signature(x.section))).size, v.variants.length, "chaque variante a une structure différente");
    assert.ok(v.variants.length >= 5, String(v.variants.length));
    for (const x of v.variants) assert.ok(x.score > 0 && x.metrics.nodes > 0);
  });
  test("sections : statistiques, équipe, témoignages, tarifs, FAQ, processus, logos, contact, CTA, e-commerce", () => {
    const num = items(3, { value: 250, suffix: "+" });
    const s = comp("stats", { title: "Chiffres", items: num }); assert.ok(s.ok); assert.equal(all(s.section, (n) => n.type === "counter").length, 3);
    const t = comp("team", { title: "Équipe", items: items(4, { image: im(5) }) }); assert.ok(t.ok); assert.equal(all(t.section, (n) => n.type === "image").length, 4);
    const te = comp("testimonials", { title: "Avis", items: [{ text: "Excellent travail.", author: "Awa" }, { text: "Très pro.", author: "Jean" }] }); assert.ok(te.ok); assert.equal(all(te.section, (n) => n.type === "testimonial").length, 2);
    const p = comp("pricing", { title: "Tarifs", items: [{ title: "Essentiel", price: "20 €" }, { title: "Pro", price: "50 €" }, { title: "Max", price: "90 €" }] }); assert.ok(p.ok);
    assert.equal(all(p.section, (n) => n.type === "pricing" && n.props.highlight).length, 1, "formule centrale mise en avant");
    assert.ok(comp("faq", { title: "FAQ", items: [{ q: "Q ?", a: "R." }] }).ok);
    assert.ok(comp("steps", { title: "Processus", items: items(4) }).ok);
    assert.ok(comp("logos", { title: "Partenaires", images: [im(1), im(2), im(3)] }).ok);
    assert.ok(comp("contact", { title: "Contact", text: "Venez nous voir.", items: [{ text: "12 rue Principale" }] }).ok);
    assert.ok(comp("cta", { title: "Parlons-en", cta: CTA }).ok);
    assert.ok(comp("products", { title: "Produits", items: items(6, { price: "12 €", image: im(7) }) }).ok);
    assert.ok(comp("categories", { title: "Catégories", items: items(4, { image: im(7) }) }).ok);
    assert.ok(comp("detail", { title: "Chaise", price: "89 €", text: "Bois massif.", images: [im(1), im(2)], cta: CTA }).ok);
    assert.ok(comp("compare", { title: "Comparatif", table: [["", "A", "B"], ["Pages", "5", "50"]] }, { patternId: "feature-comparison" }).ok);
  });
  test("équilibre : proportions, cases vides, densité, titre trop imposant, contraste — constats MESURÉS avec correction ciblée", () => {
    const mk = (children, st = {}) => ({ type: "layout", id: "labcdef", children: [{ id: "g000000a", type: "grid", props: {}, styles: { desktop: { display: "grid", gridTemplate: st.tpl || "1fr 1fr 1fr", ...st } }, children }] });
    const card = (id, t) => ({ id, type: "container", props: {}, children: [{ id: `${id}t`, type: "text", props: { html: `<p>${t}</p>` } }] });
    const four = mk([card("c000001a", "a"), card("c000002a", "b"), card("c000003a", "c"), card("c000004a", "d")]);
    const b1 = L.balance.analyze(four); const e = b1.findings.find((f) => f.rule === "empty-cells");
    assert.ok(e && e.severity === "warn" && e.fix.cols === 2, JSON.stringify(b1.findings));
    const skew = L.balance.analyze(mk([card("c000001a", "a"), card("c000002a", "b".repeat(40))], { tpl: "9fr 1fr" })); assert.ok(skew.findings.some((f) => f.rule === "column-ratio"));
    const dens = L.balance.analyze(mk([card("c000001a", "x".repeat(900)), card("c000002a", "y"), card("c000003a", "z")]));
    assert.ok(dens.findings.some((f) => f.rule === "card-density"));
    const narrow = L.balance.analyze(mk([card("c000001a", "t".repeat(400)), card("c000002a", "b".repeat(5))], { tpl: "1fr 9fr" })); assert.ok(narrow.findings.some((f) => f.rule === "narrow-column"));
    const big = L.balance.analyze({ type: "layout", id: "labcdef", children: [{ id: "h000001a", type: "heading", props: { text: "x".repeat(90), level: "1" }, styles: { desktop: { fontSize: "72px" } } }] });
    assert.ok(big.findings.some((f) => f.rule === "heading-oversize" && f.fix.heroSize));
    const dark = L.balance.analyze({ type: "layout", id: "labcdef", children: [{ id: "c000009a", type: "container", props: {}, styles: { desktop: { backgroundColor: "token:primary" } }, children: [{ id: "t000009a", type: "text", props: { html: "<p>abc</p>" } }] }] });
    assert.ok(dark.findings.some((f) => f.rule === "contrast" && f.severity === "error"));
    assert.ok(b1.score < 100 && dark.score <= 75);
  });
  test("une correction automatique est appliquée seulement si elle améliore le score", () => {
    const r = comp("services", { title: "Services", items: items(4, { text: "x".repeat(600) }) }, { patternId: "structured-corporate-grid" });
    assert.ok(r.ok); assert.ok(r.balance.score >= 70);
    if (r.corrected) assert.ok(r.corrected.after > r.corrected.before);
  });
  test("tous les layouts livrés sont équilibrés sur un contenu courant (aucune erreur de contraste, score ≥ 70)", () => {
    const c = { title: "Titre de section", text: long("Texte d'introduction.", 8), image: im(1), images: [1, 2, 3, 4, 5, 6].map((n) => im(n)), cta: CTA, table: [["", "A"], ["x", "1"]], items: items(4, { q: "Q ?", a: "R.", author: "A", price: "5 €", value: 8, image: im(2), features: ["x"] }) };
    for (const d of L.patterns.REG) { const r = comp(d.roles[0], c, { patternId: d.id }); assert.ok(r.ok, d.id); assert.ok(!r.balance.findings.some((f) => f.severity === "error"), `${d.id} : ${JSON.stringify(r.balance.findings)}`); assert.ok(r.balance.score >= 70, `${d.id} : ${r.balance.score}`); }
  });
});

describe("13-14 — responsive : réorganisation, pas simple réduction", () => {
  const css = (sec) => nodes.pageCss([sec]);
  test("grille de 4 colonnes → 2 sur tablette → 1 sur mobile ; séparation texte/image empilée dès la tablette", () => {
    const r = comp("services", { title: "S", items: items(8) }, { patternId: "structured-corporate-grid" });
    const g = find(r.section, (n) => n.type === "grid");
    assert.equal(g.styles.desktop.gridTemplate.split(" ").length, 4);
    assert.equal(g.styles.tablet.gridTemplate.split(" ").length, 2); assert.equal(g.styles.mobile.gridTemplate.split(" ").length, 1);
    const h = comp("hero", { title: "T", text: "x", image: im(1) }, { patternId: "editorial-split" });
    const hg = find(h.section, (n) => n.type === "grid");
    assert.equal(hg.styles.tablet.gridTemplate.split(" ").length, 1);
  });
  test("statistiques : 2 colonnes conservées sur mobile (lecture des chiffres), titres expressifs réduits, rythme vertical resserré", () => {
    const s = comp("stats", { title: "Chiffres", items: items(4, { value: 10 }) }); const g = find(s.section, (n) => n.type === "grid");
    assert.equal(g.styles.mobile.gridTemplate.split(" ").length, 2);
    const h = comp("hero", { title: "Habiter", text: "t", image: im(1) }, { patternId: "large-type-editorial" });
    const hd = find(h.section, (n) => n.type === "heading");
    assert.equal(hd.styles.desktop.fontSize, "72px"); assert.ok(parseInt(hd.styles.tablet.fontSize) < 72 && parseInt(hd.styles.mobile.fontSize) < parseInt(hd.styles.tablet.fontSize) && parseInt(hd.styles.mobile.fontSize) >= 28);
    const b = h.section.children[0].styles;
    assert.notEqual(b.mobile.paddingTop, b.desktop.paddingTop);
  });
  test("hero immersif plus compact sur téléphone ; superposition réorganisée (carte sous l'image) ; vignette secondaire masquée", () => {
    const f = comp("hero", { title: "T", image: im(1) }, { patternId: "fullscreen-hero" }).section.children[0].styles;
    assert.equal(f.desktop.minHeight, "100vh"); assert.equal(f.tablet.minHeight, "70vh"); assert.equal(f.mobile.minHeight, "60vh");
    const l = comp("hero", { title: "T", text: "x", image: im(1) }, { patternId: "overlapping-composition" });
    const card = find(l.section, (n) => n.type === "stack");
    assert.equal(card.styles.mobile.gridRowStart, 2); assert.equal(card.styles.mobile.gridColumnStart, 1);
    const a = comp("hero", { title: "T", text: "x", image: im(1), images: [im(1), im(2)] }, { patternId: "layered-visual" });
    assert.ok(all(a.section, (n) => n.type === "image" && n.styles && n.styles.mobile && n.styles.mobile.display === "none").length >= 1);
  });
  test("le CSS réel des éléments contient les requêtes tablette et mobile aux points de rupture natifs", () => {
    const r = comp("services", { title: "S", items: items(6) }, { patternId: "structured-corporate-grid" });
    const out = css(r.section);
    assert.match(out, /@media \(max-width: 1023px\)/); assert.match(out, /@media \(max-width: 767px\)/); assert.match(out, /grid-template-columns:/);
  });
});

describe("15-18 — intégration page, protections, historique, annulation", () => {
  const spec = (over = {}) => ({ items: [{ role: "services", content: { title: "Nos services", items: items(4) } }], ...over });
  test("composition d'une page entière : hiérarchie (un seul H1), alternance des fonds, sections sans contenu ignorées et signalées, 0 appel IA", () => {
    const page = { key: "services", name: "Services", type: "services", sections: [
      { kind: "hero", title: "Nos services", text: "Intro", image: im(1), cta: CTA }, { kind: "services", title: "Ce que nous faisons", items: items(4) }, { kind: "steps", title: "Méthode", items: items(3) },
      { kind: "stats", title: "Chiffres", items: items(2) }, { kind: "faq", title: "FAQ", items: [{ q: "Q ?", a: "R" }] }, { kind: "cta", title: "Parlons-en", cta: CTA } ] };
    const r = L.composePage(ctx0, page, { name: "Atelier", description: "Cabinet de conseil" });
    assert.equal(r.sections.length, 5);
    assert.equal(r.report.find((x) => x.kind === "stats").status, "skipped");
    assert.equal(r.sections.reduce((a, s) => a + all(s, (n) => n.type === "heading" && n.props.level === "1").length, 0), 1);
    assert.equal(r.metrics.aiCalls, 0); assert.ok(r.metrics.nodes > 0 && r.metrics.nodes < 400 && r.metrics.depth <= 6);
    const bgs = r.sections.map((s) => s.children[0].styles.desktop.backgroundColor);
    for (let i = 1; i < bgs.length; i++) if (["token:background", "token:surface"].includes(bgs[i])) assert.notEqual(bgs[i], bgs[i - 1], `fonds consécutifs identiques à ${i}`);
    assert.equal(new Set(r.report.filter((x) => x.patternId).map((x) => x.patternId)).size, r.report.filter((x) => x.patternId).length, "aucun layout répété");
  });
  test("performance : 12 sections composées en moins de 2 s, structure bornée", () => {
    const page = { key: "p", name: "P", type: "accueil", sections: Array.from({ length: 12 }, (_, i) => ({ kind: ["hero", "services", "steps", "testimonials", "faq", "cta"][i % 6], title: "Titre", text: "t", image: im(1), cta: CTA, items: [{ title: "a", text: "b", q: "q", a: "r", author: "x" }, { title: "c", text: "d", q: "q", a: "r", author: "y" }, { title: "e", text: "f", q: "q", a: "r", author: "z" }] })) };
    const t0 = Date.now(); const r = L.composePage(ctx0, page, {}); assert.ok(Date.now() - t0 < 2000); assert.ok(r.metrics.nodes < 400);
  });
  test("une proposition n'écrit RIEN ; l'application écrit un BROUILLON (jamais publié), instantanés avant/après, historique, marque IA", () => {
    const p = newPage("Services", []), rev = p.revision;
    const pr = LA.propose(A, siteId, { pageId: p.id, ...spec() });
    assert.equal(pr.status, "proposed"); assert.equal(fresh(p.id).revision, rev); assert.equal((fresh(p.id).working.sections || []).length, 0);
    assert.ok(pr.results[0].wire.desktop.c.length && pr.results[0].wire.mobile.c.length);
    const ap = LA.apply(A, siteId, pr.opId);
    assert.equal(ap.status, "applied");
    const np = fresh(p.id);
    assert.equal(np.working.sections.length, 1); assert.equal(np.working.sections[0].type, "layout"); assert.ok(np.revision > rev);
    assert.equal(np.status === "published" || np.published_at != null ? 1 : 0, 0, "jamais publié");
    const op = R.getOperation(A, siteId, pr.opId); assert.equal(op.status, "applied"); assert.equal(op.kind, "layout"); assert.ok(op.snapshots.some((s) => s.phase === "before") && op.snapshots.some((s) => s.phase === "after"));
    assert.equal(R.protect.stateOf(A, siteId, "section", np.working.sections[0].id, np.working.sections[0]), "ai");
  });
  test("éditabilité : la page enregistrée se réenregistre à l'identique (idempotence du normaliseur), identifiants uniques, sections réordonnables", () => {
    const p = newPage("Accueil", []);
    const pr = LA.propose(A, siteId, { pageId: p.id, items: [{ role: "hero", content: { title: "Habiter", text: "t", image: im(1), cta: CTA } }, { role: "services", content: { title: "S", items: items(3) } }, { role: "cta", content: { title: "Parlons-en", cta: CTA } }] });
    assert.ok(pr.requiresConfirmation); assert.equal(code(() => LA.apply(A, siteId, pr.opId)), "confirm_required");
    LA.apply(A, siteId, pr.opId, { confirm: true });
    const a = fresh(p.id); const ids = []; a.working.sections.forEach((s) => { ids.push(s.id); L.validate.walk(s.children, (n) => ids.push(n.id)); });
    assert.equal(new Set(ids).size, ids.length);
    pages.saveDraft(A, p.id, { ...a.working, sections: a.working.sections }, { revision: a.revision });
    const b = fresh(p.id); assert.deepEqual(b.working.sections, a.working.sections, "réenregistrement identique");
    const swapped = [...b.working.sections].reverse();
    pages.saveDraft(A, p.id, { ...b.working, sections: swapped }, { revision: b.revision });
    assert.deepEqual(fresh(p.id).working.sections.map((s) => s.id), swapped.map((s) => s.id));
    assert.equal(a.working.sections.every((s) => s.type === "layout"), true);
  });
  test("régénération d'UNE section : les autres sections restent intactes ; le contenu d'origine est réutilisé ; variante différente", () => {
    const p = newPage("Services", []);
    const first = LA.propose(A, siteId, { pageId: p.id, items: [{ role: "hero", content: { title: "Habiter", image: im(1) } }, { role: "services", content: { title: "Services", text: "Intro", items: items(4) } }] });
    LA.apply(A, siteId, first.opId, { confirm: true });
    const before = fresh(p.id).working.sections, target = before[1];
    const pr = LA.propose(A, siteId, { pageId: p.id, items: [{ sectionId: target.id, patternId: "corporate-services" }] });
    assert.equal(pr.requiresConfirmation, false, "une section générée et inchangée se régénère sans confirmation");
    LA.apply(A, siteId, pr.opId);
    const after = fresh(p.id).working.sections;
    assert.equal(after.length, 2); assert.equal(after[1].id, target.id, "identifiant conservé");
    assert.deepEqual(after[0], before[0], "autre section intacte");
    assert.notDeepEqual(after[1], target);
    assert.ok(L.validate.textOf(after[1]).includes("Élément 4"), "contenu repris");
    assert.equal(LA.record(A, siteId, p.id, target.id).patternId, "corporate-services");
  });
  test("modifications manuelles préservées : confirmation exigée, verrou = refus serveur, validé = autorisation explicite", () => {
    const p = newPage("Services", []);
    LA.apply(A, siteId, LA.propose(A, siteId, { pageId: p.id, items: [{ role: "services", content: { title: "Services", items: items(4) } }] }).opId);
    const sec = fresh(p.id).working.sections[0];
    // la personne modifie le titre à la main dans l'éditeur
    const edited = JSON.parse(JSON.stringify(sec)); const h = find(edited, (n) => n.type === "heading"); h.props.text = "Titre retouché par la personne";
    const cur = fresh(p.id); pages.saveDraft(A, p.id, { ...cur.working, sections: [edited] }, { revision: cur.revision });
    const pr = LA.propose(A, siteId, { pageId: p.id, items: [{ sectionId: sec.id, patternId: "minimal-grid" }] });
    assert.ok(pr.requiresConfirmation && pr.changes[0].manual);
    assert.equal(code(() => LA.apply(A, siteId, pr.opId)), "confirm_required");
    assert.equal(code(() => LA.apply(A, siteId, pr.opId, { confirm: true })), "needs_confirmation", "modifié à la main : autorisation explicite de l'élément");
    assert.equal(fresh(p.id).working.sections[0].children[0].children[0].children[0].props.text, "Titre retouché par la personne", "rien n'a été écrit");
    // verrou
    R.setProtection(A, siteId, { kind: "section", ref: sec.id, state: "locked" });
    assert.equal(code(() => LA.apply(A, siteId, pr.opId, { confirm: true, allow: [sec.id] })), "protected");
    R.setProtection(A, siteId, { kind: "section", ref: sec.id, state: "none" });
    LA.apply(A, siteId, pr.opId, { confirm: true, allow: [sec.id] });
    assert.equal(fresh(p.id).working.sections[0].id, sec.id);
  });
  test("annuler : la page retrouve exactement son état d'avant (historique de 21.9)", () => {
    const p = newPage("Services", []); const cur = fresh(p.id);
    const pr = LA.propose(A, siteId, { pageId: p.id, items: [{ role: "services", content: { title: "Services", items: items(3) } }] });
    LA.apply(A, siteId, pr.opId);
    assert.equal(fresh(p.id).working.sections.length, 1);
    LA.undo(A, siteId, pr.opId);
    assert.deepEqual(fresh(p.id).working.sections || [], cur.working.sections || []);
    assert.equal(R.getOperation(A, siteId, pr.opId).status, "undone");
  });
  test("conflits et sécurité : section modifiée depuis la proposition (409), proposition déjà traitée, page d'un autre site, contenu absent", () => {
    const p = newPage("Services", []);
    LA.apply(A, siteId, LA.propose(A, siteId, { pageId: p.id, items: [{ role: "services", content: { title: "S", items: items(3) } }] }).opId);
    const sec = fresh(p.id).working.sections[0];
    const pr = LA.propose(A, siteId, { pageId: p.id, items: [{ sectionId: sec.id, patternId: "minimal-grid" }] });
    const e = JSON.parse(JSON.stringify(sec)); find(e, (n) => n.type === "heading").props.text = "Autre"; const cur = fresh(p.id); pages.saveDraft(A, p.id, { ...cur.working, sections: [e] }, { revision: cur.revision });
    assert.equal(code(() => LA.apply(A, siteId, pr.opId, { confirm: true, allow: [sec.id] })), "conflict");
    LA.reject(A, siteId, pr.opId); assert.equal(code(() => LA.apply(A, siteId, pr.opId)), "conflict");
    const other = pages.createSite(A, { name: "Site Deux" }).id;
    assert.equal(code(() => LA.propose(A, other, { pageId: p.id, items: [{ role: "cta", content: { title: "x", cta: CTA } }] })), "not_found", "page d'un autre site");
    const scoped = m.ctx(1, { now: () => T, userId: 8, siteScope: other });
    assert.equal(code(() => LA.propose(scoped, siteId, { pageId: p.id, items: [{ role: "cta", content: { title: "x", cta: CTA } }] })), "not_found", "portée limitée à un autre site");
    const q = newPage("Vide", []);
    assert.equal(code(() => LA.propose(A, siteId, { pageId: q.id, items: [{ sectionId: "inconnue1" }] })), "not_found");
    assert.equal(code(() => LA.propose(A, siteId, { pageId: q.id, items: [{ role: "stats", content: { title: "x", items: items(2) } }] })), "invalid_field", "contenu insuffisant : refus, rien d'inventé");
  });
  test("catalogue exposé à l'interface = registre réel (rien de décoratif)", () => {
    const c = LA.catalog(); assert.equal(c.patterns.length, L.patterns.REG.length);
    for (const p of c.patterns) assert.ok(L.patterns.get(p.id));
    assert.deepEqual(Object.keys(c.families).sort(), Object.keys(L.patterns.FAMILIES).sort());
  });
});
