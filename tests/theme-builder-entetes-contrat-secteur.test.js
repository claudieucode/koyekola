// Contrat des fichiers de secteur d'en-têtes (header/sectors/<secteur>.js) : chargement, remplacement des modèles hérités sans clé orpheline, refus des fichiers invalides.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { MODELS: BASE, SECTORS } = require("../src/themeBuilder/catalog/header/models");
const contract = require("../src/themeBuilder/catalog/header/contract");
const B = require("../src/themeBuilder/catalog/header/blocks");
const X = require("../src/themeBuilder/catalog/header/blocks2");
const Catalog = require("../src/themeBuilder/catalog");
const HEADER = require("../src/themeBuilder/catalog/header");
const { withIds, kit } = require("../src/themeBuilder/catalog/kit");

const DIR = path.join(__dirname, "..", "src", "themeBuilder", "catalog", "header", "sectors");
// Modèle de secteur valide minimal (sert aux essais ; jamais livré)
const model = (sector, i, over = {}) => {
  const key = `${sector}-${String(i).padStart(2, "0")}`;
  return { key, name: `Essai ${sector} ${i}`, art: "Essai", desc: "Un modèle d'essai.", S: B.ID(key, `Essai ${i}`, { bg: "#101820", fg: "#f4f4f4", accent: "#ff5a36", onAccent: "#111111", alt: "#1b2630", line: "#33414d", mute: "#b8c2cc", font: "font.inter", head: "font.syne" }),
    build: (k) => [{ type: "container", props: { full: true }, children: [B.g([B.mark(k), X.slash(k)])], styles: { desktop: { display: "flex", flexDirection: "column" } } }], mode: "static", anim: "rise", hover: "", dark: true, tags: ["essai"], features: ["a", "b", "c"], animations: [], settings: ["Couleurs"], ...over };
};
const sector = (s, over = {}, n = 10) => ({ sector: s, models: Array.from({ length: n }, (_, i) => model(s, i + 1, over)).map((m, i) => ({ ...m, name: `Essai ${s} ${i + 1}` })) });

describe("Contrat de secteur : fichiers livrés", () => {
  test("les 10 fichiers existent, portent le bon secteur et sont valides (models: null ou 10 modèles conformes)", () => {
    for (const s of SECTORS) {
      const file = path.join(DIR, `${s.key}.js`); assert.ok(fs.existsSync(file), `fichier manquant : ${s.key}`);
      const mod = require(file); assert.doesNotThrow(() => contract.validateShape(s.key, mod, `${s.key}.js`), s.key);
    }
    assert.equal(fs.readdirSync(DIR).filter((f) => f.endsWith(".js")).length, 10, "fichier de secteur inconnu");
  });
  test("le catalogue chargé garde 100 modèles, mêmes clés et même ordre que l'existant, aucune clé orpheline ni nom en double", () => {
    const e = Catalog.entries("header"); assert.equal(e.length, 100);
    assert.deepEqual(e.map((x) => x.key), BASE.map((m) => `${m.key}.${m.key}`));
    assert.equal(new Set(e.map((x) => x.name)).size, 100);
    assert.deepEqual(HEADER.MODELS.map((m) => m.key), BASE.map((m) => m.key));
  });
  test("chaque modèle de secteur déjà livré (s'il y en a) construit des nœuds acceptés par la grammaire et annonce des animations réelles", () => {
    for (const M of HEADER.MODELS.filter((m) => m.custom)) {
      const nodes = withIds(Catalog.build("header", `${M.key}.${M.key}`).section.children); assert.doesNotThrow(() => contract.validateBuilt(M, nodes), M.key);
    }
  });
});

describe("Contrat de secteur : validation", () => {
  const bad = (mod, re, what) => assert.throws(() => contract.validateShape("luxe", mod, "luxe.js"), re, what);
  test("fichier valide accepté ; « models: null » = repli sur l'existant (renvoie false)", () => {
    assert.equal(contract.validateShape("luxe", sector("luxe"), "luxe.js"), true); assert.equal(contract.validateShape("luxe", { sector: "luxe", models: null }, "luxe.js"), false);
  });
  test("refuse : mauvais secteur, pas 10 modèles, mauvaise clé, nom en double, identité par jeton, police inconnue, mode ou animation inconnus, fonctionnalités insuffisantes", () => {
    bad({ sector: "sport", models: null }, /attendu « luxe »/); bad(sector("luxe", {}, 9), /EXACTEMENT 10/);
    const wrongKey = sector("luxe"); wrongKey.models[2].key = "luxe-07"; bad(wrongKey, /luxe-03/);
    const dup = sector("luxe"); dup.models[4].name = dup.models[3].name; bad(dup, /double/);
    const tok = sector("luxe"); tok.models[0].S = { ...tok.models[0].S, bg: "token:background" }; bad(tok, /S\.bg/);
    const font = sector("luxe"); font.models[0].S = { ...font.models[0].S, head: "Arial" }; bad(font, /polices/);
    bad(sector("luxe", { mode: "flottant" }), /mode inconnu/); bad(sector("luxe", { anim: "explose" }), /anim inconnue/);
    bad(sector("luxe", { features: ["a"] }), /au moins 3/); bad(sector("luxe", { dark: undefined }), /dark/); bad(sector("luxe", { build: null }), /build/);
    const s2 = sector("luxe"); s2.models[1].S = B.ID("autre", "x", s2.models[1].S); bad(s2, /S\.key/);
  });
  test("validation profonde : nœud refusé par la grammaire, animation annoncée absente", () => {
    const M = { ...model("luxe", 1), sector: "luxe" }, k = kit(M.S);
    assert.doesNotThrow(() => contract.validateBuilt(M, withIds(M.build(k))));
    assert.throws(() => contract.validateBuilt({ ...M, animations: ["fade-in-up"] }, withIds(M.build(k))), /absente des nœuds/);
    assert.throws(() => contract.validateBuilt(M, withIds([{ type: "html", props: { html: "<script>1</script>" } }])), /grammaire/);
    assert.throws(() => contract.validateBuilt(M, withIds([{ type: "container", children: [], styles: { desktop: { width: "99ZZ" } } }])), /grammaire/);
    const withMotion = { ...M, animations: ["fade-in-up"] };
    assert.doesNotThrow(() => contract.validateBuilt(withMotion, withIds([B.mv({ type: "container", children: [] }, "fade-in-up", 0)])));
  });
  test("fusion : un secteur remplace exactement ses 10 modèles (mêmes clés), les autres restent ; clé inconnue ou nom déjà pris : refus", () => {
    const loader = (s) => { if (s === "luxe") return sector("luxe"); if (s === "sport") return { sector: "sport", models: null }; const e = new Error("absent"); e.code = "MODULE_NOT_FOUND"; e.message = `Cannot find module './header/sectors/${s}'`; throw e; };
    const { models, overridden } = contract.merge(BASE, SECTORS, loader);
    assert.deepEqual(overridden, ["luxe"]); assert.equal(models.length, 100); assert.deepEqual(models.map((m) => m.key), BASE.map((m) => m.key));
    assert.ok(models.filter((m) => m.sector === "luxe").every((m) => m.custom && m.arch === m.key && m.n)); assert.ok(models.filter((m) => m.sector !== "luxe").every((m) => !m.custom));
    // nom déjà pris par un modèle d'un autre secteur
    const clash = sector("luxe"); clash.models[0].name = BASE.find((m) => m.sector === "sport").name;
    assert.throws(() => contract.merge(BASE, SECTORS, (s) => (s === "luxe" ? clash : { sector: s, models: null })), /double/);
    // un fichier de secteur qui se trompe d'erreur de chargement (autre que « absent ») remonte
    assert.throws(() => contract.merge(BASE, SECTORS, () => { throw new Error("syntaxe"); }), /syntaxe/);
  });
});
