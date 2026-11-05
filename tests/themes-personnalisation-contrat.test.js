// Contrat de personnalisation des thèmes : chaque thème déclare des réglages réellement branchés sur son rendu ; tout thème animé expose le réglage « Animations ».
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const packs = require("../src/marketing/themes/packs");

const animated = (p) => Boolean(p.js) || /@keyframes|animation\s*:|animation-name|transition\s*:/.test(p.css);

describe("contrat de personnalisation des thèmes", () => {
  test("aucun thème en erreur ; 3 réglages au moins ; clés d'options uniques et valides", () => {
    assert.deepEqual(packs.problems(), []);
    for (const s of packs.all()) {
      const keys = (s.options || []).map((o) => o.key);
      assert.ok(keys.length >= 3, `${s.key} : au moins 3 réglages`);
      assert.equal(new Set(keys).size, keys.length, `${s.key} : clés d'options en double`);
      for (const o of s.options) {
        assert.match(o.key, /^[a-z][a-z0-9]*$/, `${s.key}.${o.key}`);
        assert.ok(o.label && ["color", "choice", "range"].includes(o.type), `${s.key}.${o.key} : libellé et type`);
        assert.ok(packs.resolveOptions(s, {})[o.key] !== undefined, `${s.key}.${o.key} : valeur par défaut valide`);
      }
    }
  });

  test("chaque réglage modifie réellement le rendu : branché dans le CSS (variable ou attribut) ou dans le script", () => {
    for (const s of packs.all()) {
      const p = packs.get(s.key);
      for (const o of s.options) {
        const used = p.css.includes(`--pk-${o.key}`) || p.css.includes(`data-pk-${o.key}`) || p.js.includes(o.key);
        assert.ok(used, `${s.key} : le réglage « ${o.key} » n'est lu ni par le CSS ni par le script`);
      }
    }
  });

  test("tout thème animé expose le réglage « Animations » et la valeur choisie arrive sur la page", () => {
    for (const s of packs.all()) {
      const p = packs.get(s.key);
      if (!animated(p)) continue;
      assert.ok(s.options.some((o) => o.key === "motion"), `${s.key} : animé mais sans réglage d'animation`);
      for (const v of ["on", "calm", "off"]) assert.match(packs.headHtml({ key: s.key, options: { motion: v } }).attr, new RegExp(`data-pk-motion="${v}"`));
      assert.match(packs.headHtml({ key: s.key, options: { motion: "x;}" } }).attr, /data-pk-motion="on"/, "valeur invalide = défaut");
      assert.match(p.css, /data-pk-motion="off"\][^{]*\{[^}]*animation:none/, `${s.key} : règle « aucune animation » absente`);
    }
  });

  test("isolation : le réglage d'un thème n'apparaît jamais dans un autre", () => {
    const [a, b] = packs.all();
    const head = packs.headHtml({ key: a.key, options: { motion: "off" } });
    assert.ok(!head.attr.includes(b.key));
    assert.ok(!packs.get(b.key).css.includes(`data-kw-pack="${a.key}"`));
  });
});
