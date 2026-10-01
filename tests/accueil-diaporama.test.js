// Accueil : diaporama de photos de personnes qui étudient derrière le bandeau.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { startServer, Client } = require("./helpers");
const { listHeroImages } = require("../src/utils/heroImages");

const ROOT = path.join(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "img", "accueil");
const CSS = fs.readFileSync(path.join(ROOT, "public", "css", "style.css"), "utf8");

describe("liste des images (src/utils/heroImages.js)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "hero-"));
  test("dossier vide ou absent : aucune image, jamais d'erreur", () => {
    assert.deepEqual(listHeroImages(tmp), []);
    assert.deepEqual(listHeroImages(path.join(tmp, "absent")), []);
  });
  test("chaque photo -1600 est associée à sa version -800, dans l'ordre alphabétique", () => {
    for (const f of ["b-1600.jpg", "b-800.jpg", "a-1600.jpg", "a-800.jpg", "notes.txt", "c-800.jpg", "d-1600.webp"]) fs.writeFileSync(path.join(tmp, f), "x");
    const list = listHeroImages(tmp, "/img/accueil");
    assert.deepEqual(list.map((i) => i.src), ["/img/accueil/a-1600.jpg", "/img/accueil/b-1600.jpg", "/img/accueil/d-1600.webp"]);
    assert.equal(list[0].srcset, "/img/accueil/a-800.jpg 800w, /img/accueil/a-1600.jpg 1600w");
    assert.equal(list[2].srcset, "/img/accueil/d-1600.webp 1600w", "sans version -800 : une seule taille");
  });
  test("les noms de fichiers douteux sont ignorés (pas de caractères spéciaux dans les adresses)", () => {
    fs.writeFileSync(path.join(tmp, 'x" onerror="y-1600.jpg'), "x");
    fs.writeFileSync(path.join(tmp, "é a-1600.jpg"), "x");
    assert.ok(listHeroImages(tmp, "/img/accueil").every((i) => /^\/img\/accueil\/[\w.-]+$/.test(i.src)));
  });
});

describe("photos livrées avec le site", () => {
  const files = fs.existsSync(IMG_DIR) ? fs.readdirSync(IMG_DIR) : [];
  test("au moins 4 photos, chacune en 800 et 1600 px", () => {
    const big = files.filter((f) => /-1600\.jpe?g$/.test(f));
    assert.ok(big.length >= 4, `photos : ${big.length}`);
    for (const f of big) assert.ok(files.includes(f.replace("-1600", "-800")), `version 800 manquante pour ${f}`);
  });
  test("poids raisonnable : 1600 px ≤ 350 Ko, 800 px ≤ 130 Ko", () => {
    for (const f of files) {
      const size = fs.statSync(path.join(IMG_DIR, f)).size;
      const limit = /-1600\./.test(f) ? 350 * 1024 : 130 * 1024;
      assert.ok(size <= limit && size > 5000, `${f} : ${Math.round(size / 1024)} Ko`);
    }
  });
  test("ce sont de vrais JPEG", () => {
    for (const f of files.filter((n) => /\.jpe?g$/.test(n))) assert.deepEqual([...fs.readFileSync(path.join(IMG_DIR, f)).subarray(0, 3)], [0xff, 0xd8, 0xff], f);
  });
});

describe("page d'accueil", () => {
  let srv, html;
  before(async () => {
    srv = await startServer();
    html = (await new Client(srv.base).get("/")).text;
  });
  after(() => srv.stop());

  const slides = () => [...html.matchAll(/<img[^>]+class="hero-slide[^"]*"[^>]*>/g)].map((m) => m[0]);

  test("le bandeau contient le diaporama, décoratif et masqué aux lecteurs d'écran", () => {
    assert.match(html, /<div class="hero-slides" aria-hidden="true"[^>]*>/);
    assert.ok(slides().length >= 4);
    for (const s of slides()) assert.match(s, /alt=""/, "image décorative : texte alternatif vide");
  });
  test("seule la première image est chargée tout de suite (les autres après le chargement de la page)", () => {
    const [first, ...others] = slides();
    assert.match(first, /\ssrc="\/img\/accueil\/[^"]+-1600\.jpg"/);
    assert.match(first, /srcset="[^"]*-800\.jpg 800w, [^"]*-1600\.jpg 1600w"/);
    assert.match(first, /fetchpriority="high"/);
    assert.match(first, /is-active/);
    for (const s of others) {
      assert.doesNotMatch(s, /\ssrc=/, "chargement différé");
      assert.match(s, /data-src="\/img\/accueil\//);
      assert.doesNotMatch(s, /is-active/);
    }
  });
  test("dimensions déclarées (pas de saut de mise en page) et aucune image externe", () => {
    for (const s of slides()) assert.match(s, /width="1600"[^>]*height="\d+"|height="\d+"[^>]*width="1600"/);
    assert.doesNotMatch(html.slice(html.indexOf("hero-slides"), html.indexOf("hero-inner")), /https?:\/\//);
  });
  test("bouton pause accessible (critère WCAG : un mouvement automatique doit pouvoir être arrêté)", () => {
    assert.match(html, /<button[^>]+type="button"[^>]+class="hero-pause"[^>]+aria-label="Mettre en pause le diaporama"[^>]*aria-pressed="false"/);
  });
  test("chiffres sous la barre de recherche : formations et inscriptions, sans le nombre de sous-chapitres", () => {
    const hero = html.slice(html.indexOf('class="hero"'), html.indexOf('class="category-strip"'));
    assert.ok(hero.indexOf("hero-search") < hero.indexOf("hero-stats"), "les chiffres doivent suivre la recherche");
    assert.match(hero, /class="hero-stat"><strong>\d+<\/strong><span>formations? publiées?<\/span>/);
    assert.match(hero, /class="hero-stat"><strong>\d+<\/strong><span>inscriptions?<\/span>/);
    assert.equal((hero.match(/class="hero-stat"/g) || []).length, 2);
    assert.doesNotMatch(hero, /sous-chapitre|hero-panel|hero-visual/);
  });
  test("le texte du bandeau reste dans le bandeau, au-dessus du diaporama", () => {
    assert.ok(html.indexOf("hero-slides") < html.indexOf("hero-inner"));
    assert.match(html, /<h1>Apprenez les compétences dont vous avez besoin pour avancer\.<\/h1>/);
    assert.doesNotMatch(html, /<h1>[^<]*<span/, "aucun mot du titre n'est mis en couleur à part");
    assert.doesNotMatch(html, /Apprenez de nouvelles compétences/);
  });
  test("les photos sont servies (200, image/jpeg, cache navigateur)", async () => {
    const src = html.match(/<img[^>]+class="hero-slide[^"]*"[^>]+src="([^"]+)"/)[1];
    const r = await fetch(srv.base + src);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get("content-type"), "image/jpeg");
    assert.match(r.headers.get("cache-control"), /max-age=\d{6,}/);
  });
  test("toutes les photos référencées existent", async () => {
    for (const m of html.matchAll(/(?:src|data-src)="(\/img\/accueil\/[^"]+)"/g)) {
      assert.equal((await fetch(srv.base + m[1])).status, 200, m[1]);
    }
  });
});

describe("style du diaporama", () => {
  test("photos sombres comme à l'origine : voile bleu nuit de 0,92 (gauche) à 0,78 (droite)", () => {
    const overlay = CSS.match(/\.hero-slides::after\s*\{([^}]*)\}/);
    assert.ok(overlay, "voile introuvable");
    const alphas = [...overlay[1].matchAll(/rgba\(6,\s*25,\s*42,\s*(0?\.\d+)\)/g)].map((m) => Number(m[1]));
    assert.deepEqual(alphas, [0.92, 0.84, 0.78]);
  });
  test("quadrillage de carrés bleu clair par-dessus les photos, comme à l'origine (traits à 16 %, carrés de 56 px)", () => {
    const grid = CSS.match(/\.hero-stage::before\s*\{([^}]*)\}/);
    assert.ok(grid, "quadrillage introuvable");
    const alphas = [...grid[1].matchAll(/rgba\(125,\s*211,\s*252,\s*(0?\.\d+)\)/g)].map((m) => Number(m[1]));
    assert.deepEqual(alphas, [0.16, 0.16]);
    assert.match(grid[1], /background-size:\s*56px 56px/);
    assert.match(grid[1], /pointer-events:\s*none/);
  });
  test("fondu enchaîné, et aucune animation pour qui a demandé de réduire les mouvements", () => {
    assert.match(CSS, /\.hero-slide\s*\{[^}]*transition:\s*opacity/);
    assert.match(CSS, /prefers-reduced-motion:\s*reduce/);
  });
  test("le bouton pause a une zone tactile de 44 px", () => {
    const rule = CSS.match(/\.hero-pause\s*\{([^}]*)\}/);
    assert.ok(rule);
    assert.match(rule[1], /min-width:\s*44px/);
    assert.match(rule[1], /min-height:\s*44px/);
  });
});
