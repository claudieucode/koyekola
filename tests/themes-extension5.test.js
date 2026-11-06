// Extension n°5 : 30 thèmes classiques et professionnels (12 « blog », 18 « pro ») — conformité structurelle et anti-clone à 14 axes.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const packs = require("../src/marketing/themes/packs");
const audit = require("../src/marketing/themes/packs/audit");

const BLOG = "plume rubrique syntaxe mijote etape courrier obturateur bulletin sou berceau chronique jardin".split(" ");
const PRO = "comptoir socle amorce defile coulisse glane mandat preface gradin balance relais ricochet fichier communique repere jalon commun ossature".split(" ");
const AXES = ["hero", "header", "grid", "typo", "shapes", "motion", "rhythm", "signature", "palette", "image", "list", "article", "sidebar", "reading"];
const byKey = (k) => packs.all().find((s) => s.key === k);

describe("extension n°5 : 30 thèmes", () => {
  test("les 30 thèmes existent, regroupés en 12 « blog » et 18 « pro », et la bibliothèque est saine", () => {
    assert.deepEqual(packs.problems(), []);
    for (const k of BLOG) assert.equal(byKey(k)?.collection, "blog", k);
    for (const k of PRO) assert.equal(byKey(k)?.collection, "pro", k);
    assert.equal(BLOG.length + PRO.length, 30);
    assert.ok(packs.all().length >= 100);
  });

  test("chaque thème : 14 axes décrits, 4+ pages métier, page de blocs, 404, recherche, contact, mentions légales, 7+ options", () => {
    for (const k of [...BLOG, ...PRO]) {
      const s = byKey(k);
      for (const a of AXES) assert.ok(s.dna && typeof s.dna[a] === "string" && s.dna[a].length > 3, `${k} : axe « ${a} »`);
      assert.ok(s.pages.length >= 10, `${k} : ${s.pages.length} pages`);
      assert.ok(s.pages.some((p) => /introuvable|404/.test(p.key)), `${k} : 404`);
      assert.ok(s.pages.some((p) => /recherche/.test(p.key)), `${k} : recherche`);
      assert.ok(s.pages.some((p) => /contact/.test(p.key)), `${k} : contact`);
      assert.ok(s.pages.some((p) => /mention/.test(p.key)), `${k} : mentions légales`);
      assert.ok(s.pages.some((p) => /bloc/.test(p.key)), `${k} : page des blocs`);
      assert.ok((s.options || []).length >= 7, `${k} : options`);
    }
  });

  test("anti-clone : jamais plus de 4 axes identiques sur 14 entre deux nouveaux thèmes, ni de paire de polices ou de couleur principale en double", () => {
    const keys = [...BLOG, ...PRO];
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
      const a = byKey(keys[i]), b = byKey(keys[j]);
      const same = AXES.filter((x) => a.dna[x] === b.dna[x]);
      assert.ok(same.length <= 4, `${a.key}/${b.key} : ${same.length} axes communs (${same})`);
      assert.notEqual(`${a.tokens.fonts.heading}+${a.tokens.fonts.body}`, `${b.tokens.fonts.heading}+${b.tokens.fonts.body}`, `${a.key}/${b.key} : même paire de polices`);
      assert.notEqual(a.tokens.colors.primary.toLowerCase(), b.tokens.colors.primary.toLowerCase(), `${a.key}/${b.key} : même couleur principale`);
    }
  });

  test("audit de contenu (filtre de sécurité, liens, titres, alt) et de diversité sur l'ensemble de la bibliothèque", () => {
    for (const k of [...BLOG, ...PRO]) assert.deepEqual(audit.auditPack(byKey(k)), [], k);
    assert.deepEqual(audit.auditDiversity(packs.all()), []);
  });

  test("lecture et poids : prefers-reduced-motion, impression, CSS ≤ 50 Ko, JS ≤ 50 Ko (blog) / 80 Ko (pro)", () => {
    for (const k of [...BLOG, ...PRO]) {
      const p = packs.get(k);
      assert.match(p.css, /prefers-reduced-motion/, `${k} : reduced-motion`);
      assert.match(p.css, /@media print/, `${k} : impression`);
      assert.ok(Buffer.byteLength(p.css) <= 50 * 1024 + 4096, `${k} : CSS ${Buffer.byteLength(p.css)}`);
      assert.ok(Buffer.byteLength(p.js) <= (BLOG.includes(k) ? 50 : 80) * 1024, `${k} : JS`);
    }
  });
});
