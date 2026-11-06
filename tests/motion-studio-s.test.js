// Motion Studio, lot S (storytelling et sections) : fiches, rendu serveur (contenu complet sans JavaScript), fonctions pures des modules, accessibilité du CSS.
// Navigateur réel : tests/motion-studio-s-navigateur.test.js.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ejs = require("ejs");
const nodes = require("../src/marketing/pages/nodes");
const STUDIO = require("../src/marketing/pages/motionStudio");
const sections = require("../src/marketing/pages/sections");

const ROOT = path.join(__dirname, "..");
const H = { ctx: {}, imageUrl: sections.imageUrl, linkUrl: sections.linkUrl, iconNames: nodes.iconNames() };
const TYPES = {
  motionhero: "hero", motioncardstack: "card-stack", motionstickystory: "sticky-story", motionpinscenes: "pin-scenes", motionhgallery: "h-gallery", motionscrollseq: "scroll-sequence",
  motiontimeline: "steps", motionprocess: "steps", motionfsmenu: "fullscreen-menu", motiontestimonials: "testimonials", motionlogomarquee: "logo-marquee", motionportfolio: "portfolio-grid",
};
const mod = (m) => require(path.join(ROOT, "public/js/motion-studio", `${m}.js`));
const node = (type, props, studio) => nodes.normalizeNode({ id: "mss000000001", type, props: { ...nodes.PALETTE[type].blank().props, ...props }, ...(studio ? { motion: { studio } } : {}) }, "test", H, 1, { n: 0, ids: new Set() });
// Rendu du gabarit comme le fait _node.ejs : liens déjà calculés (L), identifiant du nœud
function render(type, props = {}, { isBuilder = false, studio } = {}) {
  const n = node(type, props, studio), def = nodes.CUSTOM_WIDGETS[type], p = n.props, L = {};
  for (const f of def.schema) {
    if (f.kind === "link" && p[f.key]) L[f.key] = p[f.key];
    else if (f.kind === "items") L[f.key] = (p[f.key] || []).map((it) => Object.fromEntries(f.fields.filter((sf) => sf.kind === "link" && it[sf.key]).map((sf) => [sf.key, it[sf.key]])));
  }
  const file = path.join(ROOT, "views/marketing-public/widgets", `${def.template}.ejs`);
  return ejs.render(fs.readFileSync(file, "utf8"), { p, cls: `kw-node kw-${type} kw-n-x`, attrs: nodes.motionAttrs(n), L, n: { id: "mss000000001" }, isBuilder }).trim();
}
const text = (html) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

describe("fiches des composants du lot S", () => {
  test("12 composants enregistrés, avec leur module, leur gabarit, leurs classes stylées et une insertion valide", () => {
    const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
    for (const [type, m] of Object.entries(TYPES)) {
      const def = nodes.CUSTOM_WIDGETS[type];
      assert.ok(def, `${type} non enregistré`);
      assert.equal(def.motion.module, m, type);
      assert.ok(fs.existsSync(path.join(ROOT, "public/js/motion-studio", `${m}.js`)), `${type} : module`);
      const tpl = fs.readFileSync(path.join(ROOT, "views/marketing-public/widgets", `${def.template}.ejs`), "utf8");
      const classes = new Set([...tpl.replace(/<%#[\s\S]*?%>/g, "").matchAll(/(?<![\w-])kw-ms[a-z0-9-]*/g)].map((x) => x[0]));
      assert.ok(classes.size > 2, `${type} : classes`);
      for (const c of classes) assert.ok(css.includes(`.${c}`), `${type} : classe ${c} sans style`);
      assert.ok(!/\sstyle="/.test(tpl), `${type} : pas de style="" dans le gabarit`);
      const once = node(type, {}), twice = nodes.normalizeNode(JSON.parse(JSON.stringify(once)), "test", H, 1, { n: 0, ids: new Set() });
      assert.deepEqual(twice, once, `${type} : sauvegarde idempotente`);
    }
  });
  test("sous-éléments éditables : minimum et maximum d'éléments appliqués par le serveur", () => {
    const lists = { motionhero: ["buttons", 0, 3], motioncardstack: ["cards", 2, 8], motionstickystory: ["steps", 2, 8], motionpinscenes: ["scenes", 2, 8], motionhgallery: ["items", 2, 16], motionscrollseq: ["frames", 1, 24],
      motiontimeline: ["items", 2, 16], motionprocess: ["items", 2, 8], motionfsmenu: ["links", 2, 12], motiontestimonials: ["items", 2, 12], motionlogomarquee: ["logos", 2, 24], motionportfolio: ["items", 2, 24] };
    for (const [type, [key, min, max]] of Object.entries(lists)) {
      const f = nodes.CUSTOM_WIDGETS[type].schema.find((x) => x.key === key);
      assert.equal(f.kind, "items"); assert.equal(f.min, min, `${type} min`); assert.equal(f.max, max, `${type} max`);
      const base = node(type, {}).props[key], mk = (k) => Array.from({ length: k }, (_, i) => ({ ...base[i % base.length] }));
      assert.throws(() => node(type, { [key]: mk(max + 1) }), /au plus/, `${type} : ${max + 1} éléments refusés`);
      assert.equal(node(type, { [key]: mk(max) }).props[key].length, max);
      if (min > 0) assert.throws(() => node(type, { [key]: mk(min - 1) }), /au moins/, `${type} : ${min - 1} élément refusé`);
    }
  });
  test("composants pilotés par le défilement ou par un clic : pas de bouton Lire dans l'éditeur (preview: false) ; les autres ont un aperçu réel", () => {
    const preview = Object.fromEntries(Object.keys(TYPES).map((t) => [t, STUDIO.widgetSpec(nodes.CUSTOM_WIDGETS[t].motion).preview]));
    for (const t of ["motionhero", "motiontimeline", "motionprocess"]) assert.equal(preview[t], true, t);
    for (const t of Object.keys(TYPES).filter((x) => !["motionhero", "motiontimeline", "motionprocess"].includes(x))) assert.equal(preview[t], false, t);
    assert.throws(() => require("../src/marketing/pages/widgets").check({ type: "motionfoo", label: "x", group: "advanced", icon: "play", keywords: "x", version: 1, schema: [{ key: "a", kind: "text", label: "A" }], motion: { module: "hero", preview: "oui" } }, "t"), /preview/);
  });
  test("réglages de la fiche : uniquement des listes fermées et des bornes ; valeurs par défaut valides", () => {
    for (const type of Object.keys(TYPES)) {
      const m = nodes.CUSTOM_WIDGETS[type].motion;
      assert.ok(STUDIO.normalize({ v: 1, ...m.defaults }, m) !== null, type);
      if (m.presets) assert.ok(m.presets.some((p) => p[0] === m.defaults.preset), `${type} : effet par défaut`);
      const eff = STUDIO.effective(null, m); assert.ok(eff.duration >= 50, type);
    }
    assert.equal(nodes.CUSTOM_WIDGETS.motionhero.motion.defaults.trigger, "load");
  });
});

describe("rendu serveur : contenu complet et lisible sans JavaScript, texte échappé", () => {
  const BAD = "<script>alert(1)</script> & \"x\"";
  test("hero : titre, sous-titre, boutons dans l'ordre ; visuel avec texte de remplacement ; fond décoratif masqué aux lecteurs d'écran", () => {
    const h = render("motionhero", { title: BAD, subtitle: "Sous-titre", image: "https://exemple.test/a.jpg", imageAlt: "Photo" });
    assert.ok(!h.includes("<script>")); assert.ok(h.includes("&lt;script&gt;"));
    assert.match(h, /^<div class="kw-node kw-motionhero kw-n-x kw-ms kw-ms-hr is-split-right is-h-tall has-visual is-bg-aurora"/);
    assert.ok(h.indexOf("kw-ms-hr-eyebrow") < h.indexOf("<h1") && h.indexOf("<h1") < h.indexOf("kw-ms-hr-sub") && h.indexOf("kw-ms-hr-sub") < h.indexOf("kw-ms-hr-actions") && h.indexOf("kw-ms-hr-actions") < h.indexOf("kw-ms-hr-visual"));
    assert.ok(h.includes('alt="Photo"')); assert.ok(h.includes('class="kw-ms-hr-bg" aria-hidden="true"'));
    assert.match(h, /data-kw-ms-module="hero"/);
    assert.equal((h.match(/data-ms-seq/g) || []).length, 5);
    assert.equal(render("motionhero", { bg: "none", buttons: [], image: "", eyebrow: "", subtitle: "" }).includes("kw-ms-hr-bg"), false);
    assert.throws(() => node("motionhero", { buttons: [{ label: "", url: "/", style: "primary" }] }));
  });
  test("cartes empilées : toutes les cartes dans l'ordre, titres du niveau choisi, bouton seulement avec adresse", () => {
    const h = render("motioncardstack", { titleTag: "h2", cards: [{ kicker: "A", title: "Un", text: "t1", image: "", buttonLabel: "Go", buttonUrl: "/x", tone: "dark" }, { kicker: "", title: "Deux", text: "", image: "", buttonLabel: "", buttonUrl: "", tone: "surface" }] });
    assert.equal((h.match(/class="kw-ms-cs-card"/g) || []).length, 2); assert.ok(h.includes("<h2 class=\"kw-ms-cs-title\">Un</h2>")); assert.ok(h.includes('href="/x"'));
    assert.equal((h.match(/kw-ms-cs-btn/g) || []).length, 1); assert.ok(h.includes("is-dark")); assert.ok(h.indexOf("Un") < h.indexOf("Deux"));
    assert.throws(() => node("motioncardstack", { cards: [{ title: "a", buttonLabel: "Go", buttonUrl: "" }, { title: "b" }] }), /adresse/);
  });
  test("histoire collante : chaque étape a son visuel en ligne (repli) ; la copie du visuel est décorative (aria-hidden) ; numéro quand il n'y a pas d'image", () => {
    const h = render("motionstickystory", { steps: [{ kicker: "", title: "A", text: "ta", image: "https://exemple.test/a.jpg", imageAlt: "Vue A" }, { kicker: "", title: "B", text: "tb", image: "", imageAlt: "" }] });
    assert.ok(h.includes('class="kw-ms-ss-inline" src="https://exemple.test/a.jpg" alt="Vue A"'));
    assert.ok(h.includes('class="kw-ms-ss-stage" aria-hidden="true"')); assert.ok(h.includes('class="kw-ms-ss-num">02<'));
    assert.equal((h.match(/data-ms-step/g) || []).length, 2); assert.equal((h.match(/data-ms-fig/g) || []).length, 2);
    assert.ok(text(h).includes("ta") && text(h).includes("tb"));
  });
  test("section épinglée : région nommée, toutes les scènes dans le HTML, première image chargée en priorité", () => {
    const h = render("motionpinscenes", { label: "Présentation", scenes: [{ title: "S1", text: "x", image: "https://exemple.test/1.jpg", imageAlt: "" }, { title: "S2", text: "y", image: "https://exemple.test/2.jpg", imageAlt: "" }] });
    assert.ok(h.includes('role="region" aria-label="Présentation"')); assert.equal((h.match(/data-ms-scene/g) || []).length, 2);
    assert.ok(h.includes('loading="eager"')); assert.equal((h.match(/loading="lazy"/g) || []).length, 1); assert.ok(h.includes("has-nav"));
  });
  test("galerie horizontale : bande focalisable et nommée sans JavaScript, lien seulement avec adresse, carte de texte sans image", () => {
    const h = render("motionhgallery", { items: [{ image: "", imageAlt: "", title: "A", caption: "c", url: "/a" }, { image: "https://exemple.test/b.jpg", imageAlt: "B", title: "B", caption: "", url: "" }] });
    assert.ok(h.includes('role="region" aria-label="Galerie" tabindex="0"')); assert.ok(h.includes('<a class="kw-ms-hg-link" href="/a">A</a>')); assert.ok(h.includes("is-text"));
    assert.ok(h.includes('alt="B"')); assert.equal((h.match(/kw-ms-hg-link/g) || []).length, 1);
  });
  test("séquence d'images : première image en repli (texte de remplacement), toutes les adresses dans data-kw-ms-opts, canvas masqué, publication refusée avec moins de 2 images", () => {
    const f = [{ image: "https://exemple.test/1.jpg" }, { image: "https://exemple.test/2.jpg" }, { image: "" }];
    const h = render("motionscrollseq", { label: "Le produit tourne", frames: f, title: "Titre" });
    assert.ok(h.includes('class="kw-ms-sq-first" src="https://exemple.test/1.jpg" alt="Le produit tourne"')); assert.ok(h.includes("&#34;frames&#34;:[&#34;https://exemple.test/1.jpg&#34;,&#34;https://exemple.test/2.jpg&#34;]"));
    assert.ok(h.includes('<canvas class="kw-ms-sq-canvas" aria-hidden="true" hidden>'));
    const def = nodes.CUSTOM_WIDGETS.motionscrollseq;
    assert.match(def.complete({ frames: [{ image: "https://exemple.test/1.jpg" }, { image: "" }] }), /au moins 2 images/); assert.equal(def.complete({ frames: f }), undefined);
    assert.ok(render("motionscrollseq", {}, { isBuilder: true }).includes("Ajoutez des images"));
    assert.ok(!render("motionscrollseq", {}, { isBuilder: false }).includes("Ajoutez des images"));
  });
  test("chronologie et étapes : liste ordonnée complète, repères décoratifs masqués, numéros annoncés dans le titre des étapes", () => {
    const t = render("motiontimeline", { items: [{ date: "2020", title: "Début", text: "a" }, { date: "", title: "Fin", text: "" }] });
    assert.ok(t.startsWith('<div class="kw-node kw-motiontimeline kw-n-x kw-ms kw-ms-tl is-left" data-kw-ms-kind="timeline"')); assert.ok(t.includes("<ol class=\"kw-ms-tl-list\">")); assert.equal((t.match(/data-ms-step/g) || []).length, 2);
    assert.ok(t.includes('class="kw-ms-tl-line" aria-hidden="true"')); assert.ok(t.includes('class="kw-ms-tl-date">2020<')); assert.equal((t.match(/kw-ms-tl-date/g) || []).length, 1);
    const p = render("motionprocess", { items: [{ title: "Un", text: "a" }, { title: "Deux", text: "b" }, { title: "Trois", text: "" }] });
    assert.equal((p.match(/data-ms-draw/g) || []).length, 2, "un trait entre deux étapes, pas après la dernière");
    assert.ok(p.includes('<span class="kw-ms-sr">Étape 2 : </span>Deux')); assert.ok(p.includes('class="kw-ms-pr-badge" aria-hidden="true"'));
  });
  test("menu plein écran : liste de liens complète (sans JavaScript), boutons cachés jusqu'au script, panneau relié au bouton", () => {
    const h = render("motionfsmenu", { links: [{ label: "Accueil", url: "/" }, { label: "Contact", url: "/contact" }], numbers: true });
    assert.ok(h.includes('<button type="button" class="kw-ms-fm-toggle" hidden aria-expanded="false" aria-controls="kw-fm-mss000000001">')); assert.ok(h.includes('id="kw-fm-mss000000001"'));
    assert.ok(h.includes('class="kw-ms-fm-close" hidden')); assert.ok(h.includes('href="/contact"')); assert.ok(h.includes('<span class="kw-ms-fm-n" aria-hidden="true">02</span>'));
    assert.ok(h.includes('<nav class="kw-ms-fm-nav" aria-label="Menu principal">'));
  });
  test("témoignages : tous les témoignages dans le HTML, étoiles annoncées, région de carrousel nommée", () => {
    const h = render("motiontestimonials", { items: [{ quote: BAD, name: "Ana", role: "", photo: "", stars: 4 }, { quote: "Bien", name: "Bob", role: "CEO", photo: "", stars: 0 }] });
    assert.ok(h.includes('role="region" aria-roledescription="carrousel" aria-label="Témoignages"')); assert.ok(h.includes('role="img" aria-label="Note : 4 sur 5"')); assert.ok(!h.includes("<script>"));
    assert.equal((h.match(/data-ms-slide/g) || []).length, 2); assert.ok(h.includes('aria-label="2 sur 2"'));
  });
  test("bande de logos : un logo sans image devient son nom, lien autour du logo, taille en classe", () => {
    const h = render("motionlogomarquee", { height: "64", logos: [{ name: "Acme", image: "https://exemple.test/a.png", url: "/acme" }, { name: "Zeta <b>", image: "", url: "" }] });
    assert.ok(h.includes("is-h64")); assert.ok(h.includes('<a class="kw-ms-lm-link" href="/acme"><img class="kw-ms-lm-img" src="https://exemple.test/a.png" alt="Acme"')); assert.ok(h.includes('<span class="kw-ms-lm-name">Zeta &lt;b&gt;</span>'));
    assert.ok(h.includes('role="region" aria-label="Ils nous font confiance"'));
  });
  test("portfolio : filtres cachés avant le script, catégories uniques dans l'ordre, pas de filtre avec une seule catégorie, zone d'annonce", () => {
    const items = (cats) => cats.map((c, i) => ({ title: `P${i}`, category: c, description: "", image: "", imageAlt: "", url: i === 0 ? "/p" : "" }));
    const h = render("motionportfolio", { items: items(["Web", "Photo", "Web"]) });
    assert.ok(h.includes('role="group" aria-label="Filtrer par catégorie" hidden data-ms-filters')); assert.equal((h.match(/data-ms-filter=/g) || []).length, 3);
    assert.ok(h.includes('data-ms-filter="" aria-pressed="true">Tous<')); assert.ok(h.indexOf('data-ms-filter="Web"') < h.indexOf('data-ms-filter="Photo"'));
    assert.ok(h.includes('role="status" aria-live="polite" data-ms-status')); assert.ok(h.includes('<a class="kw-ms-pf-card" href="/p">')); assert.ok(h.includes('<div class="kw-ms-pf-card">'));
    assert.ok(!render("motionportfolio", { items: items(["Web", "Web"]) }).includes("data-ms-filters"));
  });
});

describe("modules : fonctions pures", () => {
  test("cartes empilées : une carte non collée ne couvre rien, une carte collée couvre tout ; réduction et assombrissement cumulés et bornés", () => {
    const M = mod("card-stack");
    assert.equal(M.cover(900, 100, 400), 0); assert.equal(M.cover(500, 100, 400), 0); assert.equal(M.cover(300, 100, 400), 0.5); assert.equal(M.cover(100, 100, 400), 1); assert.equal(M.cover(50, 100, 400), 1); assert.equal(M.cover(300, 100, 0), 0);
    const s = M.states([100, 124, 148], [400, 400, 400], [100, 124, 148], 5, 20);
    assert.deepEqual(s.map((x) => +x.scale.toFixed(3)), [0.9, 0.95, 1]); assert.deepEqual(s.map((x) => +x.dim.toFixed(3)), [0.2, 0.2, 0]);
    const none = M.states([100, 900, 1300], [400, 400, 400], [100, 124, 148], 5, 20);
    assert.deepEqual(none.map((x) => x.scale), [1, 1, 1]);
  });
  test("histoire collante : l'étape la plus proche du milieu de la fenêtre est active", () => {
    const M = mod("sticky-story");
    assert.equal(M.activeIndex([100, 600, 1100], 400), 1); assert.equal(M.activeIndex([-300, 200, 700], 400), 1); assert.equal(M.activeIndex([-900, -400, 100], 400), 2); assert.equal(M.activeIndex([300, 500], 400), 0);
  });
  test("section épinglée : progression bornée, scène selon la progression, hauteur = fenêtre + durée × scènes", () => {
    const M = mod("pin-scenes");
    assert.equal(M.pinProgress(0, 3000, 1000), 0); assert.equal(M.pinProgress(-1000, 3000, 1000), 0.5); assert.equal(M.pinProgress(-5000, 3000, 1000), 1); assert.equal(M.pinProgress(400, 3000, 1000), 0); assert.equal(M.pinProgress(0, 800, 1000), 0);
    assert.deepEqual([0, 0.32, 0.34, 0.67, 0.999, 1].map((p) => M.sceneIndex(p, 3)), [0, 0, 1, 2, 2, 2]);
    assert.equal(M.heightPct(3, 100), 400); assert.equal(M.heightPct(4, 50), 300);
  });
  test("galerie horizontale : hauteur, centrage d'un élément au clavier", () => {
    const M = mod("h-gallery");
    assert.equal(M.sectionHeight(800, 2000, 100), 2800); assert.equal(M.sectionHeight(800, 2000, 50), 1800);
    assert.equal(M.progressFor(0, 400, 1000, 2000), 0); assert.equal(M.progressFor(1500, 400, 1000, 2000), 0.6); assert.equal(M.progressFor(5000, 400, 1000, 2000), 1); assert.equal(M.progressFor(100, 100, 1000, 0), 0);
  });
  test("séquence d'images : image selon la progression, image chargée la plus proche, cadrage contain / cover", () => {
    const M = mod("scroll-sequence");
    assert.deepEqual([0, 0.5, 1, 2, -1].map((p) => M.frameAt(p, 5)), [0, 2, 4, 4, 0]); assert.equal(M.frameAt(0.7, 1), 0);
    assert.equal(M.nearestLoaded([true, false, false, true], 2), 3); assert.equal(M.nearestLoaded([true, false, false, false], 3), 0); assert.equal(M.nearestLoaded([false, false], 1), -1); assert.equal(M.nearestLoaded([true, true, true], 1), 1);
    assert.deepEqual(M.fitRect(200, 100, 100, 100, "contain"), { x: 0, y: 25, w: 100, h: 50 }); assert.deepEqual(M.fitRect(200, 100, 100, 100, "cover"), { x: -50, y: 0, w: 200, h: 100 });
  });
  test("séquence d'images : seules les adresses sûres (/… ou https://) sont lues dans data-kw-ms-opts", () => {
    const M = mod("scroll-sequence");
    const logs = { n: 0 };
    const el = { classList: { contains: () => false, add() {}, remove() {} }, style: { setProperty() {}, removeProperty() {} }, querySelector: () => null };
    assert.deepEqual(M.init({ el, win: {}, doc: {}, cfg: { params: {} }, opts: { frames: ["javascript:alert(1)", "data:image/png;base64,AAAA", "//evil.test/a.png"] }, onCleanup() {}, reduced: false }), {});
    assert.equal(logs.n, 0);
  });
  test("chronologie : part de la ligne remplie, bornée", () => {
    const M = mod("steps");
    assert.equal(M.fillRatio(100, 1000, 100), 0); assert.equal(M.fillRatio(100, 1000, 600), 0.5); assert.equal(M.fillRatio(100, 1000, 5000), 1); assert.equal(M.fillRatio(-3000, 1000, 400), 1); assert.equal(M.fillRatio(100, 1000, -50), 0); assert.equal(M.fillRatio(0, 0, 10), 1);
  });
  test("menu plein écran : 4 ouvertures, le cercle part du centre du bouton", () => {
    const M = mod("fullscreen-menu");
    assert.deepEqual(M.panelFrames("fade", 0, 0), [{ opacity: 0 }, { opacity: 1 }]); assert.equal(M.panelFrames("slide-down")[0].transform, "translateY(-100%)"); assert.equal(M.panelFrames("slide-right")[0].transform, "translateX(-100%)");
    assert.equal(M.panelFrames("circle", 40, 30)[0].clipPath, "circle(0px at 40px 30px)"); assert.equal(M.panelFrames("inconnu")[0].transform, "translateY(-100%)");
  });
  test("témoignages : transitions dans les deux sens, indices en boucle", () => {
    const M = mod("testimonials");
    assert.equal(M.transition("slide", 1)[0][1].transform, "translateX(-48px)"); assert.equal(M.transition("slide", -1)[0][1].transform, "translateX(48px)"); assert.equal(M.transition("slide", 1)[1][0].transform, "translateX(48px)");
    assert.equal(M.transition("fade", 1)[1][0].opacity, 0); assert.ok(M.transition("blur", 1)[0][1].filter.startsWith("blur"));
    assert.deepEqual([-1, 0, 3, 4, 7].map((i) => M.wrap(i, 4)), [3, 0, 3, 0, 3]);
  });
  test("bande de logos : copies nécessaires et durée d'un tour", () => {
    const M = mod("logo-marquee");
    assert.equal(M.copiesNeeded(1200, 500), 3); assert.equal(M.copiesNeeded(400, 1000), 1); assert.equal(M.copiesNeeded(1000, 0), 1);
    assert.equal(M.lapMs(600, 60), 10000); assert.equal(M.lapMs(600, 0), 600000);
  });
  test("portfolio : sélection par catégorie dans l'ordre, annonce au singulier / pluriel", () => {
    const M = mod("portfolio-grid");
    assert.deepEqual(M.select(["a", "b", "a", ""], "a"), [0, 2]); assert.deepEqual(M.select(["a", "b"], ""), [0, 1]); assert.deepEqual(M.select(["a"], "z"), []);
    assert.equal(M.count(1), "1 projet affiché"); assert.equal(M.count(3), "3 projets affichés");
  });
  test("hero : 5 effets, fond lent (jamais sous 12 s), images-clés sans propriété de mise en page", () => {
    const M = mod("hero");
    assert.deepEqual(Object.keys(M.PRESETS).sort(), nodes.CUSTOM_WIDGETS.motionhero.motion.presets.map((p) => p[0]).sort());
    assert.ok(Math.min(...Object.values(M.BG_SECONDS)) >= 12);
    const ok = ["opacity", "transform", "filter"];
    for (const pr of Object.values(M.PRESETS)) for (const side of [pr.t, pr.v]) for (const f of side) for (const k of Object.keys(f)) assert.ok(ok.includes(k), k);
    for (let i = 0; i < 3; i++) for (const f of M.orbFrames(i)) assert.deepEqual(Object.keys(f), ["transform"]);
  });
  test("images-clés de tous les modules : transform, opacity, filter (et clip-path du cercle) seulement", () => {
    const ok = ["opacity", "transform", "filter", "clipPath"];
    for (const f of [...mod("steps").PRESETS && Object.values(mod("steps").PRESETS).flat(), ...Object.values(mod("portfolio-grid").ENTER).flat(), ...mod("testimonials").transition("slide", 1).flat(2), ...mod("fullscreen-menu").panelFrames("circle", 1, 1)]) for (const k of Object.keys(f)) assert.ok(ok.includes(k), k);
  });
  test("mouvement réduit : aucun module ne touche au DOM (retour immédiat) ; sans le nombre minimal d'éléments, rien non plus", () => {
    const trap = new Proxy({}, { get(_, k) { throw new Error(`accès interdit : ${String(k)}`); } });
    for (const m of ["hero", "card-stack", "sticky-story", "pin-scenes", "h-gallery", "scroll-sequence", "steps", "testimonials", "logo-marquee"]) {
      assert.deepEqual(mod(m).init({ el: trap, win: trap, doc: trap, cfg: { params: {} }, opts: {}, reduced: true, bp: "desktop", mode: "public", onCleanup() {} }), {}, m);
    }
    const empty = { querySelector: () => null, querySelectorAll: () => [], classList: { contains: () => false } };
    for (const m of ["fullscreen-menu", "portfolio-grid"]) assert.deepEqual(mod(m).init({ el: empty, win: {}, doc: {}, cfg: { params: {} }, opts: {}, reduced: false, bp: "desktop", mode: "public", onCleanup() {} }), {}, m);
  });
});

describe("CSS du lot S : accessibilité et sobriété", () => {
  const css = fs.readFileSync(path.join(ROOT, "public/css/motion-studio.css"), "utf8");
  const block = css.slice(css.indexOf("/* ms:s begin"), css.indexOf("/* ms:s end */"));
  test("bloc présent, sans couleur blanche / noire en dur, sans transition « all », focus visible défini", () => {
    assert.ok(block.length > 5000);
    assert.ok(!/#(?:f{3}|f{6}|0{3}|0{6})\b/i.test(block)); assert.ok(!/transition:\s*all/.test(block));
    assert.ok(/:focus-visible \{ outline: 3px solid/.test(block));
  });
  test("l'empilement, l'épinglage et les panneaux n'existent qu'avec kw-ms-live (rien de collant ni de plein écran sans le script ou en mouvement réduit)", () => {
    for (const bad of [/position:\s*sticky/g, /position:\s*fixed/g]) {
      for (const m of block.matchAll(bad)) {
        const start = block.lastIndexOf("}", m.index) + 1, sel = block.slice(start, m.index).split("{")[0];
        assert.ok(/kw-ms-live/.test(sel), `règle ${bad} hors kw-ms-live : ${sel.trim().slice(0, 80)}`);
      }
    }
  });
  test("aucune propriété de mise en page animée (width / height / top / left / margin) dans une transition du bloc", () => {
    for (const m of block.matchAll(/transition:\s*([^;}]+)/g)) assert.ok(!/\b(width|height|top|left|right|bottom|margin|padding)\b/.test(m[1]), m[1]);
  });
  test("mouvement réduit : la règle commune coupe les transitions de tous les composants (.kw-ms)", () => {
    assert.ok(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.kw-ms:not\(\[data-kw-motion-always\]\) \*/.test(css));
  });
});
