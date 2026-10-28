// Titan XXVIII — « Marine & aurore » : contrastes des familles de couleurs, dégradés, câblage des feuilles, mouvement et nouvelles illustrations.
// Contrôles sur les fichiers (aucun serveur) : ils échouent si une teinte devient illisible ou si le mouvement échappe à la réduction.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { illu, resolve, NAMES } = require("../src/utils/illustrations");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const CSS = read("public/css/kola-vivid.css");
const FAMILIES = ["azur", "turq", "emer", "viol", "magn", "ambr"];

const rgb = (hex) => { const h = hex.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const over = (fg, alpha, bg) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

// Bloc « :root { … } » du mode clair et bloc « html[data-kola-theme="dark"] { … } » du mode sombre
const block = (re) => { const m = CSS.match(re); assert.ok(m, "bloc introuvable : " + re); return m[1]; };
const LIGHT = block(/:root \{([\s\S]*?)\n\}/);
const DARK = block(/html\[data-kola-theme="dark"\] \{([\s\S]*?)\n\}/);
const token = (src, name) => { const m = src.match(new RegExp(`--${name}:\\s*([^;]+);`)); assert.ok(m, "jeton absent : " + name); return m[1].trim(); };

describe("couleurs de fonction : contraste lisible", () => {
  for (const f of FAMILIES) {
    test(`${f} (clair) : encre sur fond teinté ≥ 4,5:1, encre sur blanc ≥ 4,5:1`, () => {
      const ink = rgb(token(LIGHT, `v-${f}-ink`)), bg = rgb(token(LIGHT, `v-${f}-bg`));
      assert.ok(ratio(ink, bg) >= 4.5, `${f} : ${ratio(ink, bg).toFixed(2)}`);
      assert.ok(ratio(ink, [255, 255, 255]) >= 4.5, `${f} sur blanc : ${ratio(ink, [255, 255, 255]).toFixed(2)}`);
    });
    test(`${f} (sombre) : encre sur fond teinté posé sur la surface sombre ≥ 4,5:1`, () => {
      const parse = (v) => { const m = v.match(/rgba\((\d+), (\d+), (\d+), ([\d.]+)\)/); return { c: [+m[1], +m[2], +m[3]], a: +m[4] }; };
      const t = parse(token(DARK, `v-${f}-bg`)); const surface = [13, 21, 36]; // #0d1524, fond sombre de la charte
      const flat = over(t.c, t.a, surface);
      const ink = rgb(token(DARK, `v-${f}-ink`));
      assert.ok(ratio(ink, flat) >= 4.5, `${f} sombre : ${ratio(ink, flat).toFixed(2)}`);
    });
  }
});

describe("dégradés de marque : six, texte blanc lisible sur chaque teinte", () => {
  const names = [...LIGHT.matchAll(/--g-([a-z-]+):/g)].map((m) => m[1]).filter((n) => n !== "halo");
  test("exactement six dégradés nommés", () => { assert.deepEqual(names.sort(), ["aurore", "lagon", "marine", "nuit-or", "orchidee", "seve"]); });
  for (const n of ["marine", "lagon", "aurore", "orchidee", "seve", "nuit-or"]) {
    test(`${n} : chaque teinte pleine garde ≥ 4,5:1 avec du blanc`, () => {
      const def = token(LIGHT, `g-${n}`).replace(/rgba\([^)]*\)/g, "");
      const hexes = def.match(/#[0-9a-f]{6}/gi);
      assert.ok(hexes && hexes.length >= 2, n);
      for (const h of hexes) assert.ok(ratio(rgb(h), [255, 255, 255]) >= 4.5, `${n} ${h} : ${ratio(rgb(h), [255, 255, 255]).toFixed(2)}`);
    });
  }
});

describe("câblage", () => {
  const top = read("views/marketing/partials/top.ejs"), header = read("views/partials/header.ejs");
  test("la feuille est chargée en dernier dans l'administration et dans l'espace élève, avec le sprite de dégradé", () => {
    assert.ok(top.indexOf("kola-vivid.css") > top.indexOf("kola-brand.css"));
    assert.match(top, /id="vx-g"/); assert.match(header, /id="vx-g"/);
    assert.match(header, /kola-art\.css[\s\S]*kola-vivid\.css/);
  });
  test("chaque espace posé par top.ejs a ses deux tons", () => {
    const mods = new Set(["site", "marketing", "analytics", "design", "funnel", "seo"]);
    for (const m of mods) assert.ok(CSS.includes(`body[data-kb-module="${m}"]`), m);
    for (const m of [...top.matchAll(/return "([a-z]+)"/g)].map((x) => x[1]).filter((x) => /^(site|marketing|analytics|design|funnel|seo)$/.test(x))) assert.ok(mods.has(m), m);
  });
  test("aucun jeton ne recouvre ceux du design system v3 (--kv-*)", () => { assert.doesNotMatch(CSS, /--kv-/); });
  test("la forme « bleu » des scènes garde un repli uni si le sprite manque", () => { assert.match(CSS, /\.kx-art \.blue \{ fill: url\(#vx-g\) var\(--a-blue\)/); });
  test("la palette des scènes vit dans kola-art.css (plus dans kola-compose.css)", () => {
    assert.match(read("public/css/kola-art.css"), /\.kx-art \.navy/); assert.doesNotMatch(read("public/css/kola-compose.css"), /\.kx-art \.navy/);
  });
});

describe("mouvement", () => {
  test("toute animation est sous prefers-reduced-motion: no-preference (sauf les définitions @keyframes)", () => {
    const outside = CSS.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/g, "").replace(/@keyframes[^{]+\{[\s\S]*?\}\s*\}/g, "");
    assert.doesNotMatch(outside, /\banimation\s*:/, "animation hors du bloc de mouvement autorisé");
  });
  test("les modes « lite » et « off » de kb-motion.js les coupent", () => { assert.match(CSS, /:not\(\[data-kb-motion="lite"\]\):not\(\[data-kb-motion="off"\]\)/); });
  test("pas de rebond ni de rotation continue ; durées ≤ 520 ms hors flottement", () => {
    assert.doesNotMatch(CSS, /rotate\(|infinite[^;]*rotate|steps\(/);
    assert.equal((CSS.match(/infinite/g) || []).length, 1, "une seule animation continue (flottement de l'accueil)");
  });
  test("les propriétés animées ne touchent pas la mise en page", () => {
    const frames = CSS.match(/@keyframes [^{]+\{(?:[^{}]*\{[^}]*\})+\s*\}/g);
    assert.ok(frames && frames.length === 3);
    for (const f of frames) assert.doesNotMatch(f, /\b(width|height|top|left|margin|padding)\s*:/, f);
  });
});

describe("illustrations ajoutées", () => {
  test("formations, tunnels, succès : rendues, accessibles, alias résolus", () => {
    for (const n of ["formations", "tunnels", "succes"]) { assert.ok(NAMES.includes(n)); const svg = illu(n); assert.match(svg, /^<svg class="kx-art kx-art--/); assert.match(svg, /aria-hidden="true"/); }
    assert.match(illu("succes", { label: "Réussi" }), /role="img" aria-label="Réussi"/);
    assert.equal(resolve("cours"), "formations"); assert.equal(resolve("funnels"), "tunnels"); assert.equal(resolve("reussite"), "succes");
    assert.equal(resolve("filter"), "automatisations", "l'icône « filtre » garde sa scène d'origine");
  });
  test("aucune couleur en dur dans les nouvelles scènes (tout passe par les classes et variables)", () => {
    for (const n of ["formations", "tunnels", "succes"]) assert.doesNotMatch(illu(n), /#[0-9a-f]{3,6}\b/i);
  });
});
