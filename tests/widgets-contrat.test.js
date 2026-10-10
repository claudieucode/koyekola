// Contrat de conformité des widgets : CHAQUE type du registre doit avoir une fiche complète (nom, catégorie, groupe, mots-clés, description, icône,
// contenu de départ) et son contenu de départ doit être accepté par le serveur (ou, pour les widgets qui exigent un contenu réel, refusé avec un
// message clair — jamais une erreur technique). Un widget ajouté sans fiche complète fait échouer ce test.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const n = require("../src/marketing/pages/nodes");

const types = Object.keys(n.NODE_TYPES);
// Mêmes aides que le serveur (sections.js) ; adresses acceptées telles quelles : on contrôle la FICHE, pas la sécurité des adresses (testée ailleurs)
const H = { ctx: {}, imageUrl: (v) => String(v || ""), linkUrl: (v) => String(v || ""), iconNames: n.iconNames() };

describe("contrat des widgets", () => {
  test("le registre n'est pas vide et ses trois tables couvrent les mêmes types", () => {
    assert.ok(types.length >= 80, `types : ${types.length}`);
    for (const t of types) { assert.ok(n.WIDGETS[t], `WIDGETS manque : ${t}`); assert.ok(n.PALETTE[t], `PALETTE manque : ${t}`); }
    for (const t of Object.keys(n.WIDGETS)) assert.ok(n.NODE_TYPES[t], `WIDGETS contient un type inconnu : ${t}`);
    for (const t of Object.keys(n.PALETTE)) assert.ok(n.NODE_TYPES[t], `PALETTE contient un type inconnu : ${t}`);
  });

  test("chaque widget a un nom, une catégorie connue, un groupe, des mots-clés et une icône connue", () => {
    const icons = new Set(typeof n.iconNames === "function" ? n.iconNames() : n.iconNames || []);
    for (const t of types) {
      const d = n.NODE_TYPES[t];
      assert.ok(typeof d.label === "string" && d.label.trim(), `nom manquant : ${t}`);
      assert.ok(Object.hasOwn(n.CATEGORIES, d.category), `catégorie inconnue pour ${t} : ${d.category}`);
      const [group, keywords] = n.WIDGETS[t];
      assert.ok(group && typeof group === "string", `groupe manquant : ${t}`);
      assert.ok(typeof keywords === "string" && keywords.trim(), `mots-clés manquants : ${t}`);
      const icon = n.PALETTE[t].icon;
      assert.ok(icon, `icône manquante : ${t}`);
      if (icons.size) assert.ok(icons.has(icon), `icône inconnue pour ${t} : ${icon}`);
    }
  });

  test("chaque widget a une description lisible (au moins 12 caractères), telle que la fiche envoyée à l'éditeur", () => {
    const fiche = n.editorSpec().types;
    assert.equal(fiche.length, types.length);
    const missing = fiche.filter((f) => !f.description || f.description.trim().length < 12).map((f) => f.type);
    assert.deepEqual(missing, [], `widgets sans description : ${missing.join(", ")}`);
  });

  test("le contenu de départ de chaque widget est accepté par le serveur, ou refusé avec un message clair en français", () => {
    const technical = [];
    for (const t of types) {
      const b = n.PALETTE[t].blank();
      assert.ok(b && typeof b === "object", `contenu de départ invalide : ${t}`);
      const raw = { type: t, props: b.props || {}, ...(n.NODE_TYPES[t].container ? { children: [] } : {}) };
      try { n.normalizeNode(raw, "essai", H, 0, { n: 0, ids: new Set() }); }
      catch (e) { if (!/ : |\./.test(e.message) || /undefined|TypeError|Cannot read/i.test(e.message)) technical.push(`${t} : ${e.message}`); }
    }
    assert.deepEqual(technical, [], `erreurs techniques au lieu d'un message clair :\n${technical.join("\n")}`);
  });

  test("chaque widget personnalisé a son gabarit de rendu", () => {
    const missing = Object.keys(n.CUSTOM_WIDGETS).filter((t) => !fs.existsSync(path.join(__dirname, "..", "views", "marketing-public", "widgets", `${t}.ejs`)));
    assert.deepEqual(missing, [], `gabarit manquant : ${missing.join(", ")}`);
  });

  test("les widgets personnalisés déclarent un statut valide quand ils en ont un", () => {
    const { STATUSES } = require("../src/marketing/pages/widgets");
    const list = Array.isArray(STATUSES) ? STATUSES : Object.keys(STATUSES || {});
    for (const [t, w] of Object.entries(n.CUSTOM_WIDGETS)) if (w.status) assert.ok(list.includes(w.status), `statut inconnu pour ${t} : ${w.status}`);
  });
});
