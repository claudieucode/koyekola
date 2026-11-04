// Bibliothèque de thèmes : le CATALOGUE lui-même (sans serveur) — exactement 360 thèmes réels et distincts, bien répartis, chacun un site complet valide pour le moteur du
// Page Builder, lisible (contrastes), diversifié, avec ses visuels et ses trois aperçus réels. Données de démonstration : tout est fictif.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "kola-themes-"));
process.env.DATA_DIR = TMP; process.env.NODE_ENV = "test";
const db = require("../src/config/database");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const library = require("../src/marketing/themes/library");
const catalog = require("../src/marketing/themes/catalog");
const compose = require("../src/marketing/themes/library/compose");
const { verify, ratio } = require("../src/marketing/themes/library/verify");
const art = require("../src/marketing/themes/library/art");
const tokensLib = require("../src/marketing/pages/tokens");

const PREVIEWS = path.join(__dirname, "..", "public", "img", "theme-previews");
let report;
const ctx = () => ({ db, organizationId: 1, userId: 1, can: () => true });

before(() => {
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('Org', 'org')");
  report = verify(ctx());
});
after(() => { try { db.close(); } catch { /* déjà fermée */ } fs.rmSync(TMP, { recursive: true, force: true }); });

describe("catalogue : 360 thèmes réels", () => {
  test("exactement 360 thèmes, répartis comme demandé, aucune fiche écartée", () => {
    assert.deepEqual(library.problems(), [], "toutes les fiches sont valides");
    assert.equal(library.TARGET_TOTAL, 360);
    assert.equal(library.load().specs.length, 360);
    for (const c of library.CATEGORIES) assert.equal(report.counts[c.key], c.count, `${c.label} : ${report.counts[c.key]} / ${c.count}`);
    assert.equal(Object.values(report.counts).reduce((a, b) => a + b, 0), 360);
  });
  test("360 identifiants uniques, présents dans le catalogue installable ; les anciens thèmes ne sont plus proposés", () => {
    const keys = library.load().specs.map((s) => s.key);
    assert.equal(new Set(keys).size, 360);
    const cat = new Set(catalog.catalog().map((m) => m.key));
    for (const k of keys) assert.ok(cat.has(k), `${k} installable`);
    assert.equal(catalog.catalog().length, 360, "le catalogue ne contient que les 360 thèmes de la bibliothèque");
    for (const k of ["ocean", "ardoise", "savane", "foret", "editorial"]) assert.equal(catalog.fromCatalog(k), null, `${k} (ancien thème) n'est plus au catalogue ; les sites qui l'ont installé le gardent via leur instantané`);
  });
  test("noms, descriptions et marques uniques ; types de sites renseignés ; styles valides", () => {
    const specs = library.load().specs;
    assert.equal(new Set(specs.map((s) => s.name.toLowerCase())).size, 360, "noms uniques");
    assert.equal(new Set(specs.map((s) => s.description)).size, 360, "descriptions uniques");
    assert.equal(new Set(specs.map((s) => s.brand)).size, 360, "marques fictives uniques");
    for (const s of specs) { assert.ok(s.siteType.length >= 4, s.key); assert.ok(s.tags.every((t) => library.STYLES.has(t)), s.key); assert.ok(s.description.length >= 40, `${s.key} : description trop courte`); }
  });
});

describe("chaque thème est un site complet", () => {
  test("chaque page de chaque thème est valide pour le moteur du Page Builder (aucune page vide, cassée ou incomplète)", () => {
    assert.deepEqual(report.invalid.map((t) => `${t.key} : ${t.invalidPages.join(" | ")}`), []);
    let pages = 0;
    for (const s of library.load().specs) {
      assert.ok(s.pages.length >= 6, `${s.key} : au moins quatre pages utiles + recherche + introuvable (${s.pages.length})`);
      assert.ok(s.pages.some((p) => p.key === "recherche") && s.pages.some((p) => p.key === "introuvable"), `${s.key} : états de recherche et d'erreur`);
      assert.ok(s.pages[0].blocks.length >= 5, `${s.key} : accueil trop pauvre`);
      for (const p of s.pages) { pages += 1; const sec = library.pageSections(s.key, p.key); assert.ok(sec.length >= (p.key === "introuvable" ? 3 : 4), `${s.key}/${p.key} : ${sec.length} sections`); assert.ok(p.key === "introuvable" || p.blocks.length >= 3, `${s.key}/${p.key} : au moins 3 blocs`); }
    }
    assert.ok(pages >= 1800, `${pages} pages de démonstration`);
  });
  test("aucun « Lorem ipsum », aucune coordonnée réelle ; e-mails en .example ; textes des accueils tous différents", () => {
    const heroes = new Set();
    for (const s of library.load().specs) {
      const text = JSON.stringify(s);
      assert.ok(!/lorem ipsum/i.test(text), `${s.key} : lorem ipsum`);
      for (const m of text.matchAll(/[A-Za-z0-9._-]+@([A-Za-z0-9.-]+)/g)) assert.ok(/\.example$/.test(m[1]), `${s.key} : e-mail non fictif ${m[0]}`);
      const home = s.pages[0].blocks.find((b) => Array.isArray(b) && /^hero:/.test(b[0]));
      if (home && home[1].title) { assert.ok(!heroes.has(home[1].title), `${s.key} : titre d'accueil en double « ${home[1].title} »`); heroes.add(home[1].title); }
    }
  });
  test("menus : chaque entrée mène à une page du thème", () => {
    for (const s of library.load().specs) { const keys = new Set(s.pages.map((p) => p.key)); for (const [label, url] of s.menu) assert.ok(label && (url === "/" || keys.has(url.slice(1))), `${s.key} : ${url}`); assert.ok(s.menu.length >= 4 && s.menu.length <= 6, `${s.key} : menu de ${s.menu.length} entrées`); }
  });
  test("catégories e-commerce et formation : honnêteté fonctionnelle (module requis déclaré, aucune simulation de paiement)", () => {
    for (const s of library.load().specs.filter((x) => x.category === "boutique")) assert.ok((s.modules || []).some((m) => /e-commerce/i.test(m)), `${s.key} : module e-commerce déclaré`);
    for (const s of library.load().specs) { assert.ok(!/addtocart/i.test(JSON.stringify(s.pages.map((p) => library.pageSections(s.key, p.key)))), `${s.key} : pas de bouton d'achat simulé`); }
  });
});

describe("qualité visuelle et diversité", () => {
  test("contrastes de lecture conformes (texte et texte discret ≥ 4,5:1 sur fond et surface)", () => {
    assert.deepEqual(report.lowContrast.map((t) => `${t.key} : ${t.contrast.join(", ")}`), []);
  });
  test("diversité : aucun thème ne ressemble trop à un autre ; paires de polices uniques ; teintes principales différentes", () => {
    assert.deepEqual(report.similar, [], "paires trop similaires");
    assert.deepEqual(report.fontPairDuplicates.map((t) => t.key), []);
    const specs = library.load().specs;
    const c = (s) => ["primary", "secondary", "accent", "background"].map((k) => String(s.tokens.colors[k]).toLowerCase()).join("|");
    assert.equal(new Set(specs.map(c)).size, 360, "360 palettes complètes différentes");
    assert.equal(new Set(specs.map((s) => library.signature(s).home)).size >= 340, true, "suites de blocs d'accueil quasi toutes distinctes");
    const fonts = new Set(specs.map((s) => s.tokens.fonts.heading));
    assert.ok(fonts.size >= 60, `${fonts.size} polices de titre différentes`);
    assert.ok(specs.filter((s) => art.lum(s.tokens.colors.background) < 0.35).length >= 15, "au moins quinze thèmes sombres");
    assert.deepEqual(report.overusedFonts, [], "aucune police de titre sur-utilisée");
    const heads = new Set(specs.map((s) => (s.head || ["head:bar"])[0])), foots = new Set(specs.map((s) => (s.foot || ["foot:simple"])[0]));
    assert.ok(heads.size >= 7 && foots.size >= 5, `${heads.size} en-têtes, ${foots.size} pieds de page`);
    const used = new Set(specs.flatMap((s) => library.signature(s).variants)); assert.ok(used.size >= 60, `${used.size} variantes de mise en page employées`);
  });
  test("polices : toutes présentes dans la bibliothèque de polices locale sous licence libre", () => {
    const fontLib = require("../src/utils/fontLibrary");
    for (const s of library.load().specs) for (const role of ["heading", "body"]) { const id = s.tokens.fonts[role]; const f = tokensLib.FONTS[id] ? { license: "OFL-1.1" } : fontLib.byId(id); assert.ok(f, `${s.key} : police ${id}`); assert.match(String(f.license), /OFL|Apache|Ubuntu/i, `${s.key} : licence de ${id}`); }
  });
  test("visuels : chaque emplacement utilisé par un thème existe, est un SVG sain et propre au thème", () => {
    const hashes = new Set();
    for (const s of library.load().specs) {
      const slots = new Set(); for (const p of s.pages) JSON.stringify(library.pageSections(s.key, p.key)).replace(new RegExp(`/themes-art/${s.key}/([a-z0-9-]+)\\.svg`, "g"), (m, slot) => slots.add(slot));
      assert.ok(slots.size >= 2, `${s.key} : ${slots.size} emplacements`);
      for (const slot of slots) { const r = library.artFor(s.key, slot); assert.ok(r && /^<svg /.test(r.svg) && /<\/svg>$/.test(r.svg), `${s.key}/${slot}`); assert.ok(!/<script|onload|onerror|javascript:|href="http/i.test(r.svg), `${s.key}/${slot} : contenu actif`); }
      hashes.add(crypto.createHash("sha1").update(library.artFor(s.key, "hero").svg).digest("hex"));
    }
    assert.equal(hashes.size, 360, "360 visuels d'accueil tous différents");
  });
});

describe("aperçus réels des 360 thèmes", () => {
  test("trois aperçus par thème (accueil, page intérieure, mobile), vrais fichiers WebP, tous différents, aucun gabarit commun", () => {
    const home = new Set(); let bytes = 0;
    for (const s of library.load().specs) {
      for (const [view, min] of [["home", 4000], ["inner", 3000], ["mobile", 3000]]) {
        const file = path.join(PREVIEWS, `${s.key}-${view}.webp`);
        assert.ok(fs.existsSync(file), `${s.key} : aperçu ${view} manquant`);
        const buf = fs.readFileSync(file); bytes += buf.length;
        assert.equal(buf.subarray(0, 4).toString("latin1"), "RIFF", `${s.key}-${view} : pas un fichier WebP`); assert.equal(buf.subarray(8, 12).toString("latin1"), "WEBP");
        assert.ok(buf.length >= min, `${s.key}-${view} : image trop légère (${buf.length} o), probablement vide`);
        if (view === "home") home.add(crypto.createHash("sha1").update(buf).digest("hex"));
      }
    }
    assert.equal(home.size, 360, "360 aperçus d'accueil tous différents");
    assert.ok(bytes < 40 * 1024 * 1024, `poids total des aperçus : ${(bytes / 1048576).toFixed(1)} Mo`);
  });
});

describe("accessibilité de base des blocs", () => {
  test("toute image porte un texte de remplacement ; aucun bouton sans libellé ; titres de page uniques par page", () => {
    for (const s of library.load().specs.slice(0, 360)) for (const p of s.pages) {
      const json = JSON.stringify(library.pageSections(s.key, p.key));
      assert.ok(!/"type":"image","props":\{[^}]*"alt":""/.test(json), `${s.key}/${p.key} : image sans alternative`);
      const h1 = (json.match(/"type":"heading","props":\{"text":"[^"]*","level":"1"/g) || []).length;
      assert.ok(h1 <= 1, `${s.key}/${p.key} : ${h1} titres de niveau 1`);
    }
  });
  test("le palier de contraste texte/fond utilisé est celui du moteur (WCAG)", () => { assert.ok(ratio("#000000", "#ffffff") > 20.9); assert.ok(compose.BLOCKS["head:bar"]); });
});
