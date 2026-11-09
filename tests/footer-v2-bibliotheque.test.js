// BIBLIOTHÈQUE DE PIEDS DE PAGE « v2 » (docs/footer-v2/) : garde-fous communs à toutes les familles et à tous les modèles v2 déjà écrits. Sans serveur (base en mémoire pour la grammaire du Page Builder).
//  · structure : 14 familles (une par famille de concept), cibles = 100, noms de famille distincts des 15 familles actuelles ;
//  · RÈGLE DE TRANSITION SÛRE : tant que les 14 familles ne sont pas toutes construites, la liste publique est EXACTEMENT celle d'aujourd'hui (aucun modèle v2) ; quand elles le sont, UNIQUEMENT les 100 v2
//    (anciens ouvrables, masqués) ; jamais de mélange, jamais de liste vide ; FOOTER_V2_APERCU=1 (essai seulement) AJOUTE les v2 à la liste actuelle ;
//  · chaque modèle v2 : identifiant stable ft2-<nnn>-<nom>, fiche de concept existante, widgets connus, aucun lien mort, un seul pied, HTML conforme, mode « solo », jetons --ft-*,
//    INDÉPENDANCE (aucun jeton ni variable du site, polices de la bibliothèque, couleurs en hexadécimal), contraste AA calculé (dégradés compris), distinction structurelle (similarité ≤ 0,85) ;
//  · le kit v2 (gestes) produit des nœuds acceptés par le nettoyeur du Page Builder.
// Voir docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Catalog = require("../src/themeBuilder/catalog");
const Footer = require("../src/themeBuilder/catalog/footer");
const V2 = require("../src/themeBuilder/catalog/footer/v2");
const KitV2 = require("../src/themeBuilder/catalog/footer/v2/kit-v2");
const Kit = require("../src/themeBuilder/catalog/footer/kit-conception");
const Emp = require("../src/themeBuilder/catalog/footer/empreinte");
const AliasV2 = require("../src/themeBuilder/catalog/footer/v2/aliases-v2");
const nodes = require("../src/marketing/pages/nodes");
const pages = require("../src/marketing/pages");
const fontLib = require("../src/utils/fontLibrary");
const { kit, layout, withIds } = require("../src/themeBuilder/catalog/kit");
const { freshMarketing } = require("./marketing-helpers");

const CONCEPTS = require("../docs/footer-v2/concepts/concepts.json").concepts;
const FAMILLE_DE_CONCEPT = { "Corporate et institutions": "corporate-institutions", "Finance et assurance": "finance-assurance", "SaaS, tech et startup": "saas-tech-startup", "E-commerce, mode et luxe": "ecommerce-mode-luxe", "Médias et éditorial": "medias", "Agences, portfolios et art": "agences-portfolios-art", "Restauration, hôtellerie et tourisme": "restauration-hotellerie-tourisme", "Immobilier et architecture": "immobilier-architecture", "Éducation et université": "education-universite", "Santé et bien-être": "sante-bienetre", "Culture et événementiel": "culture-evenementiel", "Associatif et ONG": "associatif-ong", "Automobile, sport et mobilité": "auto-sport-mobilite", "Minimalisme et expérimentation": "minimalisme-experimental" };
const CIBLE = { "corporate-institutions": 8, "finance-assurance": 6, "saas-tech-startup": 9, "ecommerce-mode-luxe": 9, medias: 8, "agences-portfolios-art": 11, "restauration-hotellerie-tourisme": 8, "immobilier-architecture": 7, "education-universite": 6, "sante-bienetre": 6, "culture-evenementiel": 6, "associatif-ong": 6, "auto-sport-mobilite": 5, "minimalisme-experimental": 5 };
const walk = (list, fn, depth = 0) => { for (const n of list || []) { fn(n, depth); if (n && n.children) walk(n.children, fn, depth + 1); } };
const KNOWN_TYPES = new Set(nodes.editorSpec().types.map((t) => t.type));
const ROUTES = new Set(Kit.LIENS_PLATEFORME);
const modelesV2 = V2.nouveaux;                      // modèles v2 déjà écrits (toutes familles, construites ou non)
const skinsV2 = new Map(V2.skins.map((s) => [s.key, s]));
const docOf = (e, env = {}) => ({ type: "layout", children: withIds(e.build(kit(skinsV2.get(e.skin)), env)) });
const actuels = Footer.assemble();                  // bibliothèque actuelle (100 modèles ft-…), indépendamment de la variable d'essai

// Modèles factices pour SIMULER 14 familles construites (règle de transition) : jamais listés en vrai
function simulerFamilles({ construites = true } = {}) {
  const identite = (n) => KitV2.identite({ key: `d${String(n).padStart(3, "0")}`, label: `Essai ${n}`, humeur: "light", fond: "#ffffff", texte: "#111827", accent: "#2563eb", police: "font.inter", titres: "font.inter" });
  return V2.FAMILLES_V2_CLES.map((key) => {
    const cs = CONCEPTS.filter((c) => FAMILLE_DE_CONCEPT[c.famille] === key);
    const models = cs.map((c) => KitV2.modeleV2({ id: `ft2-${c.id.slice(2)}`, concept: c.id, name: c.nom, family: key, description: `Essai ${c.nom}`, tags: ["essai"], identity: identite(c.ordre), structure: { rows: [Kit.Z(["copy:c"])] } }, key));
    return { key, label: key, description: "", target: CIBLE[key], built: construites, models };
  });
}

describe("Pied v2 : les 14 familles", () => {
  test("14 modules, un fichier par famille, forme { key, label, description ≤ 280, target, built, models }, cibles = 100, aucune clé commune avec les 15 familles actuelles", () => {
    const dir = path.join(__dirname, "../src/themeBuilder/catalog/footer/v2/familles");
    const fichiers = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => f.replace(/\.js$/, "")).sort();
    assert.deepEqual(fichiers, Object.keys(CIBLE).sort());
    assert.deepEqual([...V2.FAMILLES_V2_CLES].sort(), fichiers);
    assert.deepEqual(V2.CIBLE_V2, CIBLE);
    let total = 0;
    for (const k of fichiers) {
      const f = require(`../src/themeBuilder/catalog/footer/v2/familles/${k}`);
      assert.equal(f.key, k); assert.ok(f.label && f.description && f.description.length <= 280, k); assert.equal(f.target, CIBLE[k], k);
      assert.ok(Array.isArray(f.models) && f.models.length <= f.target, k); assert.equal(typeof f.built, "boolean", k);
      if (f.built) assert.equal(f.models.length, f.target, `${k} construite = cible atteinte`);
      assert.ok(!Footer.FAMILLES_CLES.includes(k), `${k} ne doit pas réutiliser la clé d'une famille actuelle`);
      total += f.target;
    }
    assert.equal(total, 100);
  });
  test("les cibles sont celles de CONCEPTS_100.md : nombre de concepts par famille, ordre 1 à 100", () => {
    const parFamille = {}; for (const c of CONCEPTS) parFamille[FAMILLE_DE_CONCEPT[c.famille]] = (parFamille[FAMILLE_DE_CONCEPT[c.famille]] || 0) + 1;
    assert.deepEqual(parFamille, CIBLE);
    assert.deepEqual(CONCEPTS.map((c) => c.ordre), Array.from({ length: 100 }, (_, i) => i + 1));
    for (const k of V2.FAMILLES_V2_CLES) { const f = require(`../src/themeBuilder/catalog/footer/v2/familles/${k}`); assert.ok(CONCEPTS.some((c) => c.famille === f.label), `libellé « ${f.label} » = famille de concept`); }
  });
});

describe("Pied v2 : RÈGLE DE TRANSITION SÛRE (jamais de mélange, jamais de liste vide)", () => {
  const anciensActuels = actuels.layouts.map((l) => l.fullKey);
  test("état courant : tant que les 14 familles ne sont pas toutes construites, la liste publique est exactement la liste actuelle (aucun modèle v2)", () => {
    assert.equal(V2.toutesConstruites, V2.familles.every((f) => f.built) && V2.total === 100);
    if (V2.toutesConstruites) return; // état final : couvert par le test suivant
    const base = Footer.integrerV2(actuels, V2, { apercu: false });
    assert.equal(base.v2.mode, "actuel");
    assert.deepEqual(base.layouts.map((l) => l.fullKey), anciensActuels, "liste inchangée");
    assert.ok(base.layouts.length >= 1 && !base.layouts.some((l) => l.v2));
    if (process.env.FOOTER_V2_APERCU !== "1") { const cles = Catalog.entries("footer").map((e) => e.key); assert.ok(cles.length >= 1 && !cles.some((c) => c.startsWith("ft2-")), "aucun v2 dans la liste publique"); assert.equal(new Set(cles).size, cles.length); }
  });
  test("une famille v2 partiellement construite (ou quelques modèles écrits) ne change RIEN à la liste", () => {
    const fam = simulerFamilles({ construites: false }), partiel = fam.map((f, i) => (i === 0 ? { ...f, built: true } : f));
    const v2 = V2.assemble({ familles: partiel });
    assert.equal(v2.toutesConstruites, false);
    const r = Footer.integrerV2(actuels, v2, { apercu: false });
    assert.equal(r.v2.mode, "actuel"); assert.deepEqual(r.layouts.map((l) => l.fullKey), anciensActuels);
  });
  test("14 familles construites (simulation, 100 modèles) : la liste ne contient QUE les 100 v2 ; les 100 modèles actuels et les anciens restent OUVRABLES (masqués) ; aucun alias mort", () => {
    const v2 = V2.assemble({ familles: simulerFamilles() });
    assert.equal(v2.total, 100); assert.equal(v2.toutesConstruites, true);
    const r = Footer.integrerV2(actuels, v2, { apercu: false, aliasV2: {} });
    assert.equal(r.v2.mode, "v2");
    assert.equal(r.layouts.length, 100); assert.ok(r.layouts.every((l) => l.v2 && /^ft2-/.test(l.fullKey)), "uniquement des v2");
    assert.equal(r.anciensListes, 0); assert.equal(r.nouveaux, 100);
    const listes = new Set(r.layouts.map((l) => l.fullKey));
    for (const l of r.hiddenLayouts) assert.ok(!listes.has(l.fullKey), `${l.fullKey} listé ET masqué`);
    const cachees = new Set(r.hiddenLayouts.map((l) => l.fullKey));
    for (const id of anciensActuels) { assert.ok(cachees.has(id), `${id} masqué mais présent`); assert.equal(r.resolveAlias(id), id, `${id} reste ouvrable`); }
    for (const ancien of Object.keys(actuels.aliases)) assert.ok(r.resolveAlias(ancien), `${ancien} (ancien identifiant) reste ouvrable`);
    const parFam = {}; for (const l of r.layouts) parFam[l.family] = (parFam[l.family] || 0) + 1;
    assert.deepEqual(parFam, CIBLE, "répartition = cible");
    // une table d'alias complétée plus tard : l'ancien identifiant mène à un modèle v2 existant ; une cible inexistante est refusée
    const [premier] = r.layouts, ancienId = anciensActuels[0];
    const r2 = Footer.integrerV2(actuels, v2, { aliasV2: { [ancienId]: premier.fullKey } });
    assert.equal(r2.resolveAlias(ancienId), premier.fullKey);
    assert.throws(() => Footer.integrerV2(actuels, v2, { aliasV2: { [ancienId]: "ft2-999-inexistant" } }), /n'existe pas/);
  });
  test("mode d'essai (FOOTER_V2_APERCU) : les modèles v2 écrits sont AJOUTÉS à la liste actuelle (jamais un remplacement)", () => {
    const r = Footer.integrerV2(actuels, V2, { apercu: true });
    if (V2.nouveaux.length) {
      assert.equal(r.v2.mode, "apercu"); assert.equal(r.layouts.length, anciensActuels.length + V2.nouveaux.length);
      assert.deepEqual(r.layouts.slice(0, anciensActuels.length).map((l) => l.fullKey), anciensActuels);
      assert.equal(new Set(r.layouts.map((l) => l.fullKey)).size, r.layouts.length, "aucun doublon");
    }
  });
  test("la table d'alias v2 (aliases-v2.js) ne contient que des clés connues et des modèles v2 existants", () => {
    const connus = new Set([...anciensActuels, ...Object.keys(actuels.aliases)]);
    for (const [k, v] of Object.entries(AliasV2)) { assert.ok(connus.has(k), `clé inconnue ${k}`); assert.match(v, /^ft2-\d{3}-/); }
  });
});

describe("Pied v2 : chaque modèle écrit (paramétré)", () => {
  const ids = new Set(), noms = new Set();
  for (const e of modelesV2) {
    test(`${e.fullKey} : fiche, widgets connus, aucun lien mort, un seul pied, HTML conforme, mode solo, jetons --ft-*`, () => {
      const m = e.model;
      assert.match(e.fullKey, KitV2.ID_V2); assert.ok(e.fullKey.length <= 80);
      assert.ok(!ids.has(e.fullKey) && !noms.has(e.label), "identifiant et nom uniques"); ids.add(e.fullKey); noms.add(e.label);
      const c = CONCEPTS.find((x) => x.id === m.concept);
      assert.ok(c, `fiche de concept ${m.concept} introuvable`);
      assert.equal(`ft2-${c.id.slice(2)}`, e.fullKey, "id = ft2-<nnn>-<slug du concept>");
      assert.equal(FAMILLE_DE_CONCEPT[c.famille], e.family, "famille du concept");
      assert.ok(e.desc.length <= 280 && e.desc.length >= 40 && e.label.length <= 80);
      assert.equal(e.ftMode, "solo");
      for (const env of [{}, { formId: 7 }]) {
        const doc = docOf(e, env); let footers = 0;
        walk(doc.children, (n) => {
          assert.ok(KNOWN_TYPES.has(n.type), `type inconnu ${n.type}`);
          const p = n.props || {};
          if (n.type === "link" || n.type === "button") assert.ok(/^(https:\/\/|tel:|mailto:|#)/.test(p.url) || ROUTES.has(p.url), `lien mort ? ${p.url}`);
          if (p.tag === "footer" || /<footer/i.test(String(p.html || ""))) footers++;
          if (n.type === "text") assert.equal(nodes.sanitizeRich(p.html).replace(/<[^>]+>/g, ""), String(p.html).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, "\u00a0"), "HTML non conforme au nettoyeur");
        });
        assert.equal(footers, 0, "aucun second <footer> dans le modèle");
      }
      if (m.widgets) { const types = new Set(); walk(docOf(e).children, (n) => types.add(n.type)); for (const w of m.widgets) assert.ok(types.has(w), `widget déclaré absent : ${w}`); }
    });
    test(`${e.fullKey} : accepté par le nettoyeur du Page Builder, ftMode solo et ftVars conservés`, () => {
      const section = { ...layout(withIds(e.build(kit(skinsV2.get(e.skin)), {}))), ftMode: "solo", ftVars: { ...e.ftVars }, ...(e.racine ? { styles: JSON.parse(JSON.stringify(e.racine)) } : {}) };
      const { A } = freshMarketing();
      const c = pages.createComponent(A, { name: "Pied v2 essai", section: JSON.parse(JSON.stringify(section)), kind: "standard" });
      const saved = pages.getComponent(A, c.id).section;
      assert.equal(saved.ftMode, "solo");
      for (const k of ["--ft-bg", "--ft-text", "--ft-accent", "--ft-font", "--ft-font-head"]) assert.ok(saved.ftVars && saved.ftVars[k], `${k} conservé`);
    });
    test(`${e.fullKey} : INDÉPENDANCE (aucun jeton ni variable du site, couleurs hexadécimales, polices de la bibliothèque) et contraste AA calculé`, () => {
      const doc = docOf(e), json = JSON.stringify(doc);
      assert.ok(!/token:/.test(json), "aucun jeton du site (token:…)");
      assert.ok(!/var\(--kw-/.test(json), "aucune variable du site (var(--kw-…))");
      assert.ok(!/"fontFamily":"(heading|body|system|serif|mono)"/.test(json), "aucune police « du site » (heading, body…)");
      for (const v of Object.values(e.ftVars)) assert.ok(!/var\(--kw-/.test(v), "jetons --ft-* sans référence au site");
      const fams = new Set(); walk(doc.children, (n) => { for (const st of Object.values(n.styles || {})) if (st.fontFamily) fams.add(st.fontFamily); for (const part of Object.values(n.parts || {})) for (const st of Object.values(part.styles || {})) if (st.fontFamily) fams.add(st.fontFamily); });
      for (const f of fams) assert.ok(fontLib.byId(f), `police ${f} absente de la bibliothèque auto-hébergée`);
      assert.ok(fams.size >= 1, "le modèle déclare ses propres polices");
      assert.ok(fontLib.byId(e.model.identity.font) && fontLib.byId(e.model.identity.head), "polices de l'identité");
      assert.deepEqual(Kit.verifierAmbiance(e.model.identity), [], "contrastes de l'identité");
      // contraste de CHAQUE texte contre TOUS les fonds possibles de sa bande (fond uni + extrémités d'un dégradé), seuil 4,5:1 (3:1 pour le grand texte ≥ 24 px)
      const echecs = [];
      const sur = (n, fg, bgs, taille, quoi) => { for (const bg of bgs) if (/^#[0-9a-f]{6}$/i.test(fg) && /^#[0-9a-f]{6}$/i.test(bg)) { const r = Kit.contrastOf(fg, bg), seuil = taille >= 24 || (taille >= 18.66 && false) ? 3 : 4.5; if (r < seuil) echecs.push(`${quoi} ${fg} sur ${bg} = ${r.toFixed(2)} (${taille}px)`); } };
      const visit = (list, fg, bgs) => {
        for (const n of list || []) {
          const d = (n.styles && n.styles.desktop) || {};
          let b = bgs;
          if (/^#[0-9a-f]{6}$/i.test(d.backgroundColor || "")) b = [d.backgroundColor]; // fond uni local (carte, pastille) : remplace le fond hérité
          if (d.gradient) b = [d.gradient.from, d.gradient.to, ...(d.gradient.extra || []).map((x) => x.color)];
          const f = /^#[0-9a-f]{6}$/i.test(d.color || "") ? d.color : fg, taille = parseFloat(d.fontSize) || (String(d.fontSize || "").startsWith("fluid:") ? Number(String(d.fontSize).split("-")[0].slice(6)) : 14);
          if (["text", "heading", "link", "button", "bizphone", "bizemail", "copyright"].includes(n.type)) {
            const html = String((n.props && n.props.html) || "");
            if (n.type === "text") for (const m of html.matchAll(/color:(#[0-9a-f]{6})/gi)) sur(n, m[1], b, taille, `${n.type} (span)`);
            sur(n, f, n.type === "button" && /^#/.test(d.backgroundColor || "") ? [d.backgroundColor] : b, taille, n.type);
          }
          for (const [pn, part] of Object.entries(n.parts || {})) { const pd = (part.styles && part.styles.desktop) || {}; if (pd.color) sur(n, pd.color, /^#[0-9a-f]{6}$/i.test(pd.backgroundColor || "") ? [pd.backgroundColor] : b, parseFloat(pd.fontSize) || 14, `${n.type}.${pn}`); }
          visit(n.children, f, b);
        }
      };
      visit(doc.children, e.model.identity.fg, [e.model.identity.bg]);
      assert.deepEqual(echecs, [], `contraste AA insuffisant :\n${echecs.slice(0, 8).join("\n")}`);
    });
  }
  test("bilan : identifiants et noms uniques ; aucun modèle v2 trop proche d'un autre (similarité ≤ 0,85) ni d'un modèle de la bibliothèque actuelle", () => {
    assert.equal(new Set(modelesV2.map((e) => e.fullKey)).size, modelesV2.length);
    assert.equal(new Set(modelesV2.map((e) => e.label)).size, modelesV2.length);
    const t = modelesV2.map((e) => ({ k: e.fullKey, t: Emp.jetons(docOf(e)) }));
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) assert.ok(Emp.similarite(t[i].t, t[j].t) <= Emp.SEUIL_SIMILARITE, `${t[i].k} ≈ ${t[j].k}`);
    const cur = actuels.layouts.filter((l) => !l.legacy).map((l) => ({ k: l.fullKey, t: Emp.jetons({ type: "layout", children: withIds(l.build(kit(actuels.skins.find((s) => s.key === l.skin)), {})) }) }));
    for (const a of t) for (const b of cur) assert.ok(Emp.similarite(a.t, b.t) <= Emp.SEUIL_SIMILARITE, `${a.k} ≈ ${b.k} (modèle actuel) : ${Emp.similarite(a.t, b.t).toFixed(2)}`);
  });
  test("état final (14 familles construites) : exactement 100 modèles, répartition = cible, un modèle par concept", () => {
    if (!V2.toutesConstruites) { assert.ok(V2.total < 100 || V2.familles.some((f) => !f.built)); return; }
    assert.equal(modelesV2.length, 100);
    const parFam = {}; for (const e of modelesV2) parFam[e.family] = (parFam[e.family] || 0) + 1;
    assert.deepEqual(parFam, CIBLE);
    assert.equal(new Set(modelesV2.map((e) => e.model.concept)).size, 100);
  });
});

describe("Pied v2 : le kit (identité, modèle, gestes)", () => {
  test("polices : toute famille de la bibliothèque est utilisable (auto-hébergée) ; une police absente est refusée en clair", () => {
    assert.equal(KitV2.police("font.unbounded"), "font.unbounded");
    assert.equal(KitV2.pile("font.inter"), "'Inter', sans-serif");
    assert.throws(() => KitV2.police("font.inconnue-xyz"), /absente de la bibliothèque/);
    const fichiers = fs.readdirSync(path.join(__dirname, "../public/fonts/library"));
    assert.ok(fichiers.length > 1000, "bibliothèque locale de polices");
  });
  test("polices des 100 concepts : toutes disponibles dans la bibliothèque (liste documentée dans le guide)", () => {
    for (const c of CONCEPTS) for (const n of [c.typographies.titre, c.typographies.corps, c.typographies.accent].filter(Boolean)) assert.ok(fontLib.byName(n.toLowerCase()), `${c.id} : police « ${n} » absente`);
  });
  test("identite() : jetons --ft-* complets, contraste AA vérifié (erreur sinon), texte discret relevé s'il est trop pâle sur la surface", () => {
    const id = KitV2.identite({ key: "essai1", label: "Essai", humeur: "dark", fond: "#4b2bff", texte: "#ffffff", discret: "#d6d0ff", accent: "#caff3d", surface: "#6347ff", police: "font.inter", titres: "font.unbounded" });
    assert.equal(id.v2, true); assert.ok(id.ftVars["--ft-font"].includes("Inter") && id.ftVars["--ft-font-head"].includes("Unbounded"));
    assert.ok(Kit.contrastOf(id.mute, id.bg) >= 4.5 && Kit.contrastOf(id.mute, id.alt) >= 4.5);
    assert.throws(() => KitV2.identite({ key: "essai2", label: "x", fond: "#777777", texte: "#888888", accent: "#999999", police: "font.inter" }), /contraste AA/);
    assert.throws(() => KitV2.identite({ key: "essai3", label: "x", fond: "#ffffff", texte: "#111111", accent: "#2563eb", police: "font.nexiste-pas" }), /absente/);
  });
  test("modeleV2() refuse un modèle incomplet ou dont l'identifiant ne correspond pas à la fiche", () => {
    const identity = KitV2.identite({ key: "essai4", label: "x", humeur: "light", fond: "#ffffff", texte: "#111827", accent: "#2563eb", police: "font.inter" });
    const ok = { id: "ft2-017-essai", concept: "c-017-essai", name: "Essai", family: "saas-tech-startup", description: "d", tags: ["t"], identity, structure: { rows: [Kit.Z(["copy:c"])] } };
    assert.equal(KitV2.modeleV2(ok, "saas-tech-startup"), ok);
    assert.throws(() => KitV2.modeleV2({ ...ok, concept: "c-018-essai" }, "saas-tech-startup"), /concept/);
    assert.throws(() => KitV2.modeleV2({ ...ok, id: "ft-017-essai" }, "saas-tech-startup"), /identifiant invalide/);
    assert.throws(() => KitV2.modeleV2({ ...ok, family: "medias" }, "saas-tech-startup"), /family/);
    assert.throws(() => KitV2.modeleV2({ ...ok, identity: { key: "x" } }, "saas-tech-startup"), /identite/);
    assert.throws(() => KitV2.modeleV2({ ...ok, structure: undefined }, "saas-tech-startup"), /compose/);
    assert.equal(KitV2.identifiantV2(7, "mon-nom"), "ft2-007-mon-nom");
  });
  test("tous les gestes G.* produisent des nœuds acceptés par le nettoyeur du Page Builder (modèle d'essai jamais listé)", () => {
    const G = KitV2.G;
    const identity = KitV2.identite({ key: "essai5", label: "Essai", humeur: "dark", fond: "#101820", texte: "#ffffff", accent: "#ff6b35", surface: "#1d2a35", police: "font.inter", titres: "font.syne" });
    const k = kit(identity), env = {};
    const bandes = [G.bande(k, [
      G.geant("<p>Un <span style=\"color:#ff6b35\">mot</span></p>", { taille: [40, 120] })(k, env), G.libelle("Étiquette")(k, env), G.phrase("Texte courant")(k, env), G.filet()(k, env),
      G.lienFleche("Instagram", "https://www.instagram.com/")(k, env), G.pilule("FAQ", "/faq")(k, env), G.pilules([["Blog", "/blog"], ["Contact", "/contact"]])(k, env),
      G.liens([["Blog", "/blog"]])(k, env), G.indexNumerote([["01", "Blog", "/blog"]])(k, env), G.boutons(["Écrire", "/contact"], ["FAQ", "/faq"])(k, env), G.pastilles(["Nouveau"])(k, env),
      G.chiffres([["12", "exemple"]])(k, env), G.carte([G.phrase("Dans une carte")])(k, env), G.cadre([G.phrase("Dans un cadre")])(k, env), G.nomRogne("ATELIER")(k, env), G.ruban(["Un", "Deux"])(k, env),
      G.abonnement({ titre: "Newsletter", intro: "Intro" })(k, env), G.ligneLegale()(k, env), G.reseauxTexte([["X", "https://x.com/"]])(k, env), G.code("socials:facebook+x|plain")(k, env), G.cote(["cta|Contact|/contact", "phone"])(k, env),
      G.colonne(k, [G.phrase("a")(k, env)], { poids: 2 }), G.ligne(k, [G.phrase("b")(k, env)], { gap: "10px 20px" }),
    ], { colonne: true, degrade: { from: "#101820", to: "#1d2a35", angle: 160 }, filetHaut: { epaisseur: "2px", couleur: "#ff6b35" } })];
    const { A } = freshMarketing();
    const section = { ...layout(withIds([G.racine(k, bandes)])), ftMode: "solo", ftVars: identity.ftVars };
    const c = pages.createComponent(A, { name: "Gestes", section: JSON.parse(JSON.stringify(section)), kind: "standard" });
    const types = new Set(); walk(pages.getComponent(A, c.id).section.children, (n) => types.add(n.type));
    for (const t of ["text", "link", "divider", "emailsubscribe", "copyright", "social", "bizphone"]) assert.ok(types.has(t), `${t} conservé`);
  });
});
