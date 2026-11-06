// Publication unique — moteur pur (sans serveur) : validation des réglages, CSS généré, temps de lecture réel, métadonnées sans séparateur orphelin,
// publications similaires (jamais l'article lu), liens de partage, forme stockée.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const sp = require("../src/services/singlePost");

describe("réglages de Publication unique", () => {
  test("valeurs d'origine : aucun réglage → rien de stocké, affichage d'origine", () => {
    assert.equal(sp.compact(null), null);
    assert.equal(sp.compact({}), null);
    assert.equal(sp.compact(sp.defaultsOf()), null);
    assert.notEqual(sp.compact({ container: { layout: "narrow" } }), null);
  });
  test("chaque champ du catalogue a une valeur d'origine valide et des bornes cohérentes", () => {
    const d = sp.defaultsOf();
    const again = sp.normalize(d, { strict: true });
    assert.deepEqual(again, d);
    assert.ok(sp.F.length > 200);
    for (const f of sp.F) if (f.kind === "int" || f.kind === "float") assert.ok(f.min < f.max, f.path);
  });
  test("strict : une valeur hors limites ou inconnue est refusée avec un message clair", () => {
    assert.throws(() => sp.normalize({ sidebar: { layout: "diagonale" } }, { strict: true }), /choix inconnu/);
    assert.throws(() => sp.normalize({ content: { widthPx: 99999 } }, { strict: true }), /entre 480 et 1920/);
    assert.throws(() => sp.normalize({ design: { color: { title: { text: "rouge" } } } }, { strict: true }), /hexadécimal/);
    assert.throws(() => sp.normalize({ design: { type: { title: { font: "police-inconnue" } } } }, { strict: true }), /police inconnue/);
    assert.throws(() => sp.normalize({ titleArea: { items: [{ id: "pirate", visible: true }] } }, { strict: true }), /élément inconnu/);
    // lecture d'une ancienne configuration : repli silencieux sur l'origine
    assert.equal(sp.normalize({ sidebar: { layout: "diagonale" } }).sidebar.layout, "default");
  });
  test("le titre ne peut jamais être masqué ; un élément manquant revient à sa place d'origine", () => {
    const c = sp.normalize({ titleArea: { items: [{ id: "meta", visible: false }, { id: "title", visible: false }] } });
    assert.equal(c.titleArea.items.find((i) => i.id === "title").visible, true);
    assert.equal(c.titleArea.items[0].id, "meta");
    assert.equal(c.titleArea.items.length, 6);
    assert.deepEqual(c.titleArea.items.map((i) => i.id).sort(), sp.TITLE_ITEMS.map(([id]) => id).sort());
  });
  test("quatre côtés et valeurs par appareil", () => {
    const c = sp.normalize({ design: { spacing: { outer: { desktop: { top: 10, right: 20, bottom: 30, left: 40, unit: "px", linked: false }, mobile: { top: 4, right: null, bottom: null, left: null, unit: "px" } } } } }, { strict: true });
    assert.equal(c.design.spacing.outer.desktop.left, 40);
    assert.equal(c.design.spacing.outer.tablet, null);
    assert.equal(c.design.spacing.outer.mobile.top, 4);
    assert.throws(() => sp.normalize({ design: { spacing: { inner: { desktop: { top: 99999 } } } } }, { strict: true }), /entre/);
  });
  test("défauts d'un thème < réglages du site", () => {
    const r = sp.resolve({ container: { layout: "wide" } }, { container: { layout: "narrow", style: "open" }, sidebar: { layout: "none" } });
    assert.equal(r.container.layout, "wide");   // réglage du site
    assert.equal(r.container.style, "open");    // défaut du thème
    assert.equal(r.sidebar.layout, "none");
  });
});

describe("CSS généré", () => {
  test("espacements, typographie, couleurs, bordures et ombres, par appareil", () => {
    const c = sp.normalize({
      imageShadow: { enabled: true },
      design: {
        spacing: { outer: { desktop: { top: 10, right: null, bottom: 20, left: null, unit: "px" } }, inner: { tablet: { top: 8, right: 8, bottom: 8, left: 8, unit: "em" } } },
        type: { title: { size: { desktop: 40, tablet: 32, mobile: 26 }, weight: "700", lineHeight: 1.2, letterSpacing: -0.5, transform: "uppercase" } },
        color: { links: { text: "#112233", hover: "#445566" } },
        border: { container: { width: { top: 1, right: 1, bottom: 1, left: 1, unit: "px" }, color: "#cccccc", radius: { top: 8, right: 8, bottom: 8, left: 8, unit: "px" } } },
        shadow: { images: { x: 2, y: 4, blur: 10, spread: 1, color: "#000000", opacity: 30 } },
      },
    });
    const css = sp.css(c);
    assert.match(css, /\.sp-page \.sp-article\{margin-top:10px;margin-bottom:20px;\}/);
    assert.match(css, /@media \(max-width: 1023px\)\{[\s\S]*padding-top:8em/);
    assert.match(css, /\.sp-page \.sp-header \.post-title\{font-weight:700;line-height:1\.2;letter-spacing:-0\.5px;text-transform:uppercase;\}/);
    assert.match(css, /\.post-title\{font-size:40px;\}/);
    assert.match(css, /@media \(max-width: 767px\)\{[\s\S]*font-size:26px/);
    assert.match(css, /\.sp-content a\{color:#112233;\}/);
    assert.match(css, /\.sp-content a:hover\{color:#445566;\}/);
    assert.match(css, /border-style:solid;border-color:#cccccc/);
    assert.match(css, /box-shadow:2px 4px 10px 1px rgba\(0,0,0,0\.3\)/);
  });
  test("l'ombre des images ne s'applique pas aux avatars, icônes ni logos, et seulement si activée", () => {
    const on = sp.css(sp.normalize({ imageShadow: { enabled: true } }));
    assert.match(on, /\.sp-content img:not\(\.emoji\)/);
    assert.doesNotMatch(on, /\.sp-avatar[^{]*\{[^}]*box-shadow|authorbox[^{]*\{[^}]*box-shadow/);
    assert.doesNotMatch(sp.css(sp.normalize({})), /box-shadow:0px 8px/);
  });
  test("aucune balise ne peut s'échapper du CSS", () => {
    assert.doesNotMatch(sp.css(sp.normalize({ related: { title: "</style><script>" } })), /[<>]/);
  });
  test("largeur personnalisée : variable posée seulement en mode personnalisé", () => {
    assert.match(sp.css(sp.normalize({ content: { width: "custom", widthPx: 1200 } })), /--sp-content-width:1200px/);
    assert.doesNotMatch(sp.css(sp.normalize({})), /--sp-content-width/);
  });
  test("l'image mise en avant garde ses proportions (ratio, object-fit)", () => {
    const css = sp.css(sp.normalize({ featured: { ratio: "4/3", fit: "contain", position: "top", align: "right" } }));
    assert.match(css, /object-fit:contain;object-position:top/);
    assert.match(css, /aspect-ratio:4\/3/);
  });
});

describe("temps de lecture réel", () => {
  const cfg = sp.normalize({});
  test("calculé sur le texte réel, hors code, scripts, légendes et tableaux", () => {
    const words = (n) => "mot ".repeat(n);
    const html = `<p>${words(400)}</p><pre>${words(5000)}</pre><script>${words(900)}</script><figure><img src="x"><figcaption>${words(300)}</figcaption></figure><table><tr><td>${words(200)}</td></tr></table>`;
    const r = sp.readingTime(html, cfg);
    assert.equal(r.words, 400);
    assert.equal(r.minutes, 2);
    assert.equal(r.text, "2 min de lecture");
  });
  test("vitesse, texte et fourchette configurables ; désactivé ou vide : rien (jamais une durée fictive)", () => {
    const html = `<p>${"mot ".repeat(450)}</p>`;
    assert.equal(sp.readingTime(html, sp.normalize({ readingTime: { wpm: 150, label: "{n} minutes" } })).text, "3 minutes");
    assert.equal(sp.readingTime(html, sp.normalize({ readingTime: { format: "range" } })).text, "2–3 min de lecture");
    assert.equal(sp.readingTime(html, sp.normalize({ readingTime: { enabled: false } })), null);
    assert.equal(sp.readingTime("<p></p><img src=x>", cfg), null);
  });
  test("multilingue : accents, apostrophes et alphabets non latins comptés", () => {
    assert.equal(sp.countWords("<p>L'été dernier, nous sommes allés à Besançon</p>"), 7);
    assert.equal(sp.countWords("<p>Привет мир как дела</p>"), 4);
  });
});

describe("métadonnées, partage, similaires", () => {
  const data = { date: { text: "1 mars 2026", iso: "2026-03-01T00:00:00Z" }, author: { name: "Ada", url: "/blog/auteur/1" }, readTime: { text: "3 min" }, updated: null, commentCount: 0, tags: [] };
  test("l'ordre choisi est respecté et un élément sans valeur disparaît (pas de séparateur orphelin)", () => {
    const c = sp.normalize({ meta: { items: [{ id: "author", visible: true }, { id: "updated", visible: true }, { id: "date", visible: true }, { id: "readtime", visible: false }] } });
    assert.deepEqual(sp.metaParts(c, data).map((m) => m.id), ["author", "date"]);
    assert.deepEqual(sp.metaParts(sp.normalize({}), { ...data, author: null, readTime: null, date: null }).map((m) => m.id), []);
  });
  test("liens de partage : URL réelle, réseaux choisis seulement, aucun compteur", () => {
    const c = sp.normalize({ share: { nets: { facebook: false, x: true, pinterest: true, telegram: true, email: true, copy: true, whatsapp: false, linkedin: false } } });
    const links = sp.shareLinks(c, { url: "https://exemple.fr/blog/mon-article?a=1&b=2", title: "Titre & co" });
    assert.deepEqual(links.map((l) => l.id), ["x", "pinterest", "telegram", "email", "copy"]);
    assert.ok(links.find((l) => l.id === "x").href.includes(encodeURIComponent("https://exemple.fr/blog/mon-article?a=1&b=2")));
    assert.ok(links.find((l) => l.id === "email").href.startsWith("mailto:?subject=Titre%20%26%20co"));
    assert.equal(links.find((l) => l.id === "copy").href, null);
  });
  const tags = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const pool = [
    { id: 2, title: "B", category: "SEO", tags: "a,b", published_at: "2026-01-02" },
    { id: 3, title: "A", category: "SEO", tags: "", published_at: "2026-01-03" },
    { id: 4, title: "C", category: "Vidéo", tags: "a", published_at: "2026-01-04" },
    { id: 5, title: "D", category: "Autre", tags: "z", published_at: "2026-01-05" },
    { id: 3, title: "A (doublon)", category: "SEO", tags: "", published_at: "2026-01-03" },
    { id: 1, title: "L'article lu", category: "SEO", tags: "a", published_at: "2026-01-06" },
  ];
  const me = { id: 1, category: "SEO", tags: "a,b" };
  test("jamais l'article lu, jamais de doublon, pertinence d'abord, limite respectée", () => {
    const out = sp.related(me, pool, sp.normalize({ related: { count: 2 } }), { parseTags: tags });
    assert.deepEqual(out.map((p) => p.id), [2, 3]);
    assert.ok(!out.some((p) => p.id === 1));
  });
  test("correspondance, exclusion de catégories et ordre configurables ; aucune correspondance → liste vide (état vide)", () => {
    assert.deepEqual(sp.related(me, pool, sp.normalize({ related: { match: "tags", count: 5 } }), { parseTags: tags }).map((p) => p.id), [2, 4]);
    assert.deepEqual(sp.related(me, pool, sp.normalize({ related: { excludeCategories: "seo", count: 5 } }), { parseTags: tags }).map((p) => p.id), [4]);
    assert.deepEqual(sp.related(me, pool, sp.normalize({ related: { order: "title", count: 5 } }), { parseTags: tags }).map((p) => p.id), [3, 2, 4]);
    assert.deepEqual(sp.related({ id: 1, category: "Rien", tags: "" }, pool, sp.normalize({}), { parseTags: tags }), []);
    assert.deepEqual(sp.related(me, pool, sp.normalize({ related: { enabled: false } }), { parseTags: tags }), []);
  });
  test("dates : formats et valeur invalide", () => {
    assert.equal(sp.formatDate("2026-03-15 10:00:00", "short"), "15/03/2026");
    assert.equal(sp.formatDate("2026-03-15 10:00:00", "iso"), "2026-03-15");
    assert.equal(sp.formatDate("pas une date", "long"), "");
  });
});
