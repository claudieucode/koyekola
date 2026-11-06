// Lot 2 des widgets animables : avis clients (reviews), texte animé lettre par lettre (splittext), défilement continu avec images,
// transitions des carrousels (fondu, plusieurs éléments visibles), aperçu Lottie dans l'éditeur, parallaxe d'arrière-plan.
// Validation + CSS/JS publics + rendu par le VRAI serveur (aperçu de page ET canevas de l'éditeur).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const n = require("../src/marketing/pages/nodes");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };
const norm = (type, props, extra = {}) => n.normalizeNode({ id: "node" + type.slice(0, 7).padEnd(7, "0"), type, props, ...extra }, type, H, 1, { n: 0, ids: new Set() });
const read = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");

describe("avis clients", () => {
  test("le widget existe, son contenu de départ est valide et entre crochets (aucun faux avis)", () => {
    assert.ok(n.NODE_TYPES.reviews && n.PALETTE.reviews);
    const blank = n.PALETTE.reviews.blank();
    const node = norm("reviews", blank.props);
    assert.equal(node.props.items.length, 3);
    for (const it of node.props.items) assert.match(it.text, /^\[/);
  });
  test("note bornée de 0 à 5, textes obligatoires, 12 avis au plus", () => {
    const base = n.PALETTE.reviews.blank().props;
    assert.throws(() => norm("reviews", { ...base, items: [{ name: "", text: "x", rating: 5 }] }));
    const p = norm("reviews", { ...base, items: [{ name: "A", text: "Bien", rating: 9 }] }).props;
    assert.ok(p.items[0].rating <= 5);
    const many = Array.from({ length: 30 }, (_, i) => ({ name: "N" + i, text: "T", rating: 4 }));
    assert.throws(() => norm("reviews", { ...base, items: many }), /12 élément\(s\) au plus/);
  });
});

describe("texte animé lettre par lettre", () => {
  test("réglages validés, listes fermées", () => {
    const p = norm("splittext", { text: "Bonjour le monde", tag: "h3", split: "words", effect: "blur", stagger: 90, duration: 800, trigger: "load", align: "center" }).props;
    assert.deepEqual([p.tag, p.split, p.effect, p.stagger, p.duration, p.trigger, p.align], ["h3", "words", "blur", 90, 800, "load", "center"]);
    assert.equal(norm("splittext", { text: "x", tag: "script" }).props.tag, "h2", "balise inconnue : retour à la valeur par défaut, jamais écrite telle quelle");
  });
});

describe("défilement continu avec images, transitions de carrousels, parallaxe", () => {
  test("marquee : image facultative par élément, taille réglable", () => {
    const p = norm("marquee", { items: [{ text: "Logo A", image: "https://exemple.test/a.png" }, { text: "Slogan" }], imageSize: "l" }).props;
    assert.equal(p.items[0].image, "https://exemple.test/a.png"); assert.equal(p.imageSize, "l");
  });
  test("carrousels : fondu et éléments visibles (widgets et carrousel d'images)", () => {
    const t = norm("testimonialcarousel", { label: "T", items: [{ quote: "a", name: "A" }, { quote: "b", name: "B" }], effect: "fade", perView: 3 }).props;
    assert.equal(t.effect, "fade"); assert.equal(t.perView, 3);
    const c = norm("carousel", { images: [{ src: "https://e.test/1.jpg", alt: "un" }, { src: "https://e.test/2.jpg", alt: "deux" }], effect: "fade", perView: 2 }).props;
    assert.equal(c.effect, "fade"); assert.equal(c.perView, 2);
    const plain = norm("carousel", { images: [{ src: "https://e.test/1.jpg", alt: "un" }, { src: "https://e.test/2.jpg", alt: "deux" }] }).props;
    assert.ok(!("effect" in plain) && !("perView" in plain));
  });
  test("parallaxe d'arrière-plan : valeurs de la liste seulement, attribut publié", () => {
    const ok = norm("container", {}, { motion: { bgParallax: 35 }, children: [] });
    assert.equal(ok.motion.bgParallax, 35);
    assert.match(n.motionAttrs(ok), /data-kw-bgpar="35"/);
    const bad = norm("container", {}, { motion: { bgParallax: 7 }, children: [] });
    assert.ok(!bad.motion || !("bgParallax" in bad.motion));
  });
});

describe("scripts, styles et éditeur", () => {
  const js = read("public/js/landing.js"), css = read("public/css/landing.css"), par = read("public/js/kw-bgpar.js");
  test("texte animé : état caché seulement une fois le script prêt ; « réduire les animations » respecté", () => {
    assert.match(js, /kw-st-ready/); assert.match(css, /\.kw-splittext\.kw-st-ready \.kw-st-c \{ display: inline-block; opacity: 0/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.kw-splittext\.kw-st-ready \.kw-st-c \{ opacity: 1/);
  });
  test("carrousel en fondu : activé par le script ; transition coupée en mouvement réduit", () => {
    assert.match(js, /data-kw-effect/); assert.match(css, /\[data-kw-carousel\]\.is-fade \.kw-carousel-slide\.is-active/);
    assert.match(css, /prefers-reduced-motion: reduce\) \{ \[data-kw-carousel\]\.is-fade/);
  });
  test("parallaxe : aucun mouvement dans l'éditeur ni en mouvement réduit ; un seul écouteur passif", () => {
    assert.match(par, /data-kw-builder/); assert.match(par, /prefers-reduced-motion: reduce/); assert.match(par, /passive: true/);
    assert.match(read("views/marketing-public/landing.ejs"), /kw-bgpar\.js/);
  });
  test("Lottie : aperçu de la première image dans l'éditeur", () => {
    assert.match(read("views/marketing-public/widgets/lottie.ejs"), /data-kw-still="1"/); assert.match(js, /data-kw-still/);
  });
  test("l'éditeur propose chaque réglage (champs du schéma ; parallaxe dans les effets de mouvement)", () => {
    assert.match(read("public/js/page-builder-effects.js"), /Parallaxe de l'image de fond/);
    assert.match(read("public/js/page-builder.js"), /Transition entre les images/);
    const spec = n.editorSpec().types;
    for (const t of ["reviews", "splittext"]) assert.ok(spec.find((x) => x.type === t), t);
  });
});

describe("rendu par le vrai serveur", () => {
  let srv, boss, db, html, pid, used;
  const origin = { Origin: "" };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    origin.Origin = srv.base;
    boss = await loginInstructor(srv); db = srv.db();
    const created = await boss.post("/marketing/pages", { name: "Widgets lot 2", kind: "page", template: "", ouvrir: "editeur" });
    pid = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    const w = (type, props, id, extra = {}) => ({ id, type, props, ...extra });
    const sections = [{ id: "sect00000001", type: "layout", children: [
      w("reviews", { title: "Avis de test", layout: "grid", columns: 2, showSummary: true, items: [{ name: "Alice", text: "Très bien", rating: 5 }, { name: "Bruno", text: "Bien", rating: 4 }, { name: "Chloé", text: "Sans note", rating: 0 }] }, "rev000000001"),
      w("splittext", { text: "Salut toi", tag: "h2", split: "letters", effect: "rise", stagger: 50, duration: 600, trigger: "viewport", align: "left" }, "spl000000001"),
      w("marquee", { items: [{ text: "Logo", image: "https://exemple.test/logo.png" }, { text: "Slogan" }], imageSize: "m", speed: "normal", direction: "left", separator: "•", pauseHover: true, label: "Partenaires" }, "mar000000001"),
      w("testimonialcarousel", { label: "Avis", items: [{ quote: "a", name: "A" }, { quote: "b", name: "B" }], effect: "fade", perView: 2, dots: true }, "tcr000000001"),
      w("lottie", { src: "https://exemple.test/anim.json", alt: "Anim", trigger: "viewport", loop: true, speed: 1, height: 200, align: "center" }, "lot000000001"),
      w("container", {}, "box000000001", { motion: { bgParallax: 35 }, children: [] }),
    ] }];
    used = sections;
    const put = await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: "Widgets lot 2", sections } } });
    assert.equal(put.status, 200, put.text.slice(0, 500));
    const r = await boss.get(`/marketing/pages/${pid}/apercu`);
    assert.equal(r.status, 200); html = r.text;
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });
  test("avis : note moyenne calculée (4,5 sur 2 notes), étoiles accessibles, carte sans note sans étoiles", () => {
    assert.match(html, /<strong>4,5<\/strong> \/ 5 · 2 avis/);
    assert.match(html, /aria-label="Note : 5 sur 5"/); assert.match(html, /aria-label="Note : 4 sur 5"/);
    assert.equal((html.match(/class="kw-review-stars"/g) || []).length, 2);
    assert.match(html, /kw-reviews[^"]* is-cols-2/);
  });
  test("texte animé : phrase entière pour les lecteurs d'écran, lettres cachées, 8 lettres animées", () => {
    assert.match(html, /<span class="sr-only">Salut toi<\/span>/);
    assert.equal((html.match(/class="kw-st-c"/g) || []).length, 8);
    assert.match(html, /data-kw-stagger="50"/);
  });
  test("défilement continu : image du logo (texte alternatif sur la liste visible, vide sur la copie cachée)", () => {
    assert.match(html, /<img class="kw-marquee-img" src="https:\/\/exemple\.test\/logo\.png" alt="Logo"/);
    assert.match(html, /<img class="kw-marquee-img" src="https:\/\/exemple\.test\/logo\.png" alt=""/);
    assert.match(html, /is-img-m/);
  });
  test("carrousel : attributs de fondu et d'éléments visibles", () => {
    assert.match(html, /data-kw-effect="fade"/); assert.match(html, /data-kw-per="2"/);
  });
  test("parallaxe de fond : attribut publié ; Lottie publique intacte (lecture normale, pas d'image fixe)", () => {
    assert.match(html, /data-kw-bgpar="35"/);
    assert.match(html, /data-kw-lottie="https:\/\/exemple\.test\/anim\.json" data-kw-trigger="viewport"/);
    assert.ok(!/data-kw-still/.test(html));
  });
  test("canevas de l'éditeur : Lottie montre sa première image (aperçu), jamais de lecture ; mouvement coupé", async () => {
    const r = await boss.request(`/marketing/pages/${pid}/rendu`, { method: "POST", headers: origin, json: { content: { title: "x", sections: used } } });
    assert.equal(r.status, 200, r.text.slice(0, 300));
    assert.match(r.text, /data-kw-lottie="https:\/\/exemple\.test\/anim\.json" data-kw-trigger="load" data-kw-still="1"/);
    assert.match(r.text, /data-kw-builder/);
  });
});

