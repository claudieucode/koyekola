// Reconstruction de la bibliothèque de PIEDS DE PAGE par familles métier : garde-fous communs à toutes les familles.
// · tant que toutes les familles ne sont pas construites (built), des tests paramétrés vérifient la cohérence de chaque famille construite et la liste de transition ;
// · dès que les 15 familles sont construites : exactement 100 nouveaux modèles listés, 0 ancien, répartition = cible, aucune paire de structure trop proche (> 0,85) ni empreinte identique.
// Sans serveur (le seul accès base est en mémoire pour vérifier la grammaire du Page Builder). Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Catalog = require("../src/themeBuilder/catalog");
const Footer = require("../src/themeBuilder/catalog/footer");
const Kit = require("../src/themeBuilder/catalog/footer/kit-conception");
const Moteur = require("../src/themeBuilder/catalog/footer/moteur");
const Emp = require("../src/themeBuilder/catalog/footer/empreinte");
const nodes = require("../src/marketing/pages/nodes");
const pages = require("../src/marketing/pages");
const { kit, layout, withIds } = require("../src/themeBuilder/catalog/kit");
const { freshMarketing } = require("./marketing-helpers");

const CIBLE = { minimalistes: 8, corporate: 8, ecommerce: 8, "saas-tech": 8, editoriaux: 7, "creatifs-portfolios": 6, education: 6, communautes: 6, services: 7, "restauration-hotellerie": 6, immobilier: 5, "finance-juridique": 6, "ong-associations": 5, "landing-pages": 6, institutionnels: 8 };
const walk = (list, fn, depth = 0) => { for (const n of list || []) { fn(n, depth); if (n && n.children) walk(n.children, fn, depth + 1); } };
const listes = Footer.layouts.filter((l) => !l.legacy);           // nouveaux modèles listés
const construites = Footer.familles.filter((f) => f.built);
const toutConstruit = construites.length === 15;
const KNOWN_TYPES = new Set(nodes.editorSpec().types.map((t) => t.type));
const ROUTES = new Set(Kit.LIENS_PLATEFORME);
const docOf = (l, env = {}) => ({ type: "layout", children: l.build(kit(Footer.skins.find((s) => s.key === l.skin)), env) });

describe("Pied de page : les 15 familles", () => {
  test("15 modules de famille, un fichier par famille, forme { key, label, description, target, built, models }, cibles = 100 au total", () => {
    const dir = path.join(__dirname, "../src/themeBuilder/catalog/footer/familles");
    const fichiers = fs.readdirSync(dir).filter((f) => f.endsWith(".js")).map((f) => f.replace(/\.js$/, "")).sort();
    assert.deepEqual(fichiers, Object.keys(CIBLE).sort());
    assert.deepEqual([...Footer.FAMILLES_CLES].sort(), fichiers);
    let total = 0;
    for (const k of fichiers) {
      const f = require(`../src/themeBuilder/catalog/footer/familles/${k}`);
      assert.equal(f.key, k); assert.ok(f.label && f.description.length <= 280, k); assert.equal(f.target, CIBLE[k], k); assert.ok(Array.isArray(f.models), k);
      assert.equal(typeof f.built, "boolean", k);
      total += f.target;
    }
    assert.equal(total, 100);
  });
  test("transition : la liste n'est jamais vide ni dupliquée ; nouveaux listés + anciens des familles non construites ; les anciens des familles construites sont masqués", () => {
    const entrees = Catalog.entries("footer"), cles = entrees.map((e) => e.key);
    assert.ok(cles.length >= 1);
    assert.equal(new Set(cles).size, cles.length);
    assert.equal(cles.length, Footer.nouveaux + Footer.anciensListes);
    for (const f of construites) assert.ok(!entrees.some((e) => e.legacy && e.layoutKey === f.key), `anciens encore listés dans ${f.key}`);
    if (!toutConstruit) assert.ok(Footer.anciensListes > 0, "des familles restent à construire : leurs anciens modèles sont encore listés");
  });
  for (const f of Footer.familles) {
    test(`famille « ${f.key} » (${f.built ? "construite" : "à construire"}) : cohérence`, () => {
      const mod = require(`../src/themeBuilder/catalog/footer/familles/${f.key}`);
      assert.ok(mod.models.length <= f.target, "pas plus de modèles que la cible");
      if (f.built) assert.equal(mod.models.length, f.target, "famille construite = cible atteinte");
      for (const m of mod.models) { Kit.modele(m, f.key); assert.ok(listes.some((l) => l.fullKey === m.id), `${m.id} non listé`); }
    });
  }
});

describe("Pied de page : le kit de conception", () => {
  test("échelles : espacement 4/8/12/16/24/32/48/64/96, grille 12 colonnes vérifiée", () => {
    assert.deepEqual(Object.keys(Kit.ESPACEMENT).map(Number), [4, 8, 12, 16, 24, 32, 48, 64, 96]);
    assert.equal(Kit.espace(24), "24px"); assert.throws(() => Kit.espace(20), /hors échelle/);
    assert.equal(Kit.GRILLE, 12);
    assert.deepEqual(Kit.colonnes12([[4, "logo"], [8, "menu"]]).cols.length, 2);
    assert.throws(() => Kit.colonnes12([[4, "logo"], [4, "menu"]]), /il en faut 12/);
  });
  test("ambiances : 12 jetons de couleur, contrastes AA (4,5:1) vérifiés pour texte, texte secondaire, bouton et rangées colorées (alt, accent, encre)", () => {
    assert.ok(Kit.AMBIANCES.length >= 12);
    for (const a of Kit.AMBIANCES) {
      assert.deepEqual(Kit.verifierAmbiance(a), [], a.key);
      for (const bg of ["alt", "accent", "ink"]) {
        const t = Moteur.legible(Moteur.tone(a, bg));
        assert.ok(Kit.contrastOf(t.fg, t.bg) >= 4.5, `${a.key}/${bg} texte ${Kit.contrastOf(t.fg, t.bg).toFixed(2)}`);
        assert.ok(Kit.contrastOf(t.mute, t.bg) >= 4.5, `${a.key}/${bg} secondaire ${Kit.contrastOf(t.mute, t.bg).toFixed(2)}`);
      }
    }
    assert.throws(() => Kit.ambiance({ key: "x", fond: "#777777", texte: "#888888", accent: "#999999", police: "font.inter" }), /contraste AA/);
  });
  test("modele() refuse les modèles incomplets avec un message en clair", () => {
    const ok = { id: "ft-corporate-01-essai", name: "Essai", family: "corporate", description: "d", tags: ["t"], identity: "neutre", structure: { rows: [Kit.Z(["copy:c"])] } };
    assert.equal(Kit.modele(ok, "corporate"), ok);
    assert.throws(() => Kit.modele({ ...ok, family: "services" }, "corporate"), /family/);
    assert.throws(() => Kit.modele({ ...ok, id: "ft-services-01-essai" }, "corporate"), /commencer par/);
    assert.throws(() => Kit.modele({ ...ok, description: "x".repeat(281) }, "corporate"), /280/);
    assert.throws(() => Kit.modele({ ...ok, tags: [] }, "corporate"), /étiquette/);
    assert.throws(() => Kit.modele({ ...ok, identity: "inconnue" }, "corporate"), /identité inconnue/);
    assert.throws(() => Kit.modele({ ...ok, structure: { rows: [{ cols: [], l: [] }] } }, "corporate"), /exactement un type/);
    assert.equal(Kit.identifiantModele("corporate", 3, "grande-marque"), "ft-corporate-03-grande-marque");
  });
  test("empreinte : indépendante des couleurs et des textes, sensible à l'ordre et aux widgets", () => {
    const fam = (rows, identity = "neutre") => Footer.assemble({ familles: Footer.FAMILLES_CLES.map((k) => ({ key: k, label: k, description: "", target: 0, models: k === "corporate" ? [{ id: "ft-corporate-01-a", name: "A", family: "corporate", description: "d", tags: ["t"], identity, structure: { rows } }] : [] })) }).layouts.find((l) => l.fullKey === "ft-corporate-01-a");
    const doc = (l) => docOf(l);
    const a = doc(fam([Kit.C([[2, "logo", "about"], ["head|Navigation", "menu"]]), Kit.Z(["copy:c"])], "neutre"));
    const b = doc(fam([Kit.C([[2, "logo", "text|Autre texte"], ["head|Autre titre", "menu"]]), Kit.Z(["copy:c"])], "ardoise"));
    const c = doc(fam([Kit.Z(["copy:c"]), Kit.C([[2, "logo", "about"], ["head|Navigation", "menu"]])]));
    assert.equal(Emp.empreinte(a), Emp.empreinte(b), "couleurs et textes ignorés");
    assert.notEqual(Emp.empreinte(a), Emp.empreinte(c), "l'ordre des blocs compte");
    assert.equal(Emp.similarite(a, b), 1);
    assert.ok(Emp.similarite(a, c) < 1);
  });
});

describe("Pied de page : chaque nouveau modèle listé (paramétré)", () => {
  const seulsNoms = new Set(), seulsId = new Set();
  for (const l of listes) {
    test(`${l.fullKey} : widgets connus, aucun lien mort, un seul pied, HTML conforme, descriptions courtes`, () => {
      assert.match(l.fullKey, Kit.ID_RE);
      assert.ok(!seulsId.has(l.fullKey), "identifiant unique"); seulsId.add(l.fullKey);
      assert.ok(!seulsNoms.has(l.label), "nom unique"); seulsNoms.add(l.label);
      assert.ok(l.desc.length <= 280 && l.label.length <= 80);
      assert.ok(l.fullKey.startsWith(`ft-${l.family}-`) && Object.hasOwn(CIBLE, l.family));
      for (const env of [{}, { formId: 7 }]) {
        const doc = withIds(docOf(l, env).children);
        let footers = 0;
        walk(doc, (n) => {
          assert.ok(KNOWN_TYPES.has(n.type), `type inconnu ${n.type}`);
          const p = n.props || {};
          if (n.type === "link" || n.type === "button") assert.ok(/^(https:\/\/|tel:|mailto:|#)/.test(p.url) || ROUTES.has(p.url), `lien mort ? ${p.url}`);
          if (p.tag === "footer" || /<footer/i.test(String(p.html || ""))) footers++;
          if (n.type === "text") assert.equal(nodes.sanitizeRich(p.html).replace(/<[^>]+>/g, ""), String(p.html).replace(/<[^>]+>/g, ""), "HTML non conforme au nettoyeur");
        });
        assert.equal(footers, 0, "le pied est posé par le thème : aucun second <footer> dans le modèle");
      }
      const m = Footer.layouts.find((x) => x.fullKey === l.fullKey).model;
      if (m && m.widgets) { const types = new Set(); walk(docOf(l).children, (n) => types.add(n.type)); for (const w of m.widgets) assert.ok(types.has(w), `widget déclaré absent : ${w}`); }
    });
  }
  test("bilan : identifiants et noms uniques sur tous les nouveaux modèles listés", () => {
    assert.equal(new Set(listes.map((l) => l.fullKey)).size, listes.length);
    assert.equal(new Set(listes.map((l) => l.label)).size, listes.length);
  });
  test("distinction structurelle : jamais deux empreintes identiques parmi les nouveaux modèles", () => {
    const vus = new Map();
    for (const l of listes) { const e = Emp.empreinte(docOf(l)); assert.ok(!vus.has(e), `${l.fullKey} a la même structure que ${vus.get(e)}`); vus.set(e, l.fullKey); }
  });
});

describe("Pied de page : état final (appliqué quand les 15 familles sont construites)", () => {
  test("exactement 100 nouveaux modèles listés, 0 ancien, répartition par famille = cible", { skip: toutConstruit ? false : `familles construites : ${construites.length}/15` }, () => {
    const entrees = Catalog.entries("footer");
    assert.equal(entrees.length, 100);
    assert.equal(entrees.filter((e) => e.legacy).length, 0);
    assert.ok(entrees.every((e) => /^ft-/.test(e.key)));
    const parFamille = {}; for (const e of entrees) parFamille[e.layoutKey] = (parFamille[e.layoutKey] || 0) + 1;
    assert.deepEqual(parFamille, CIBLE);
    assert.equal(new Set(entrees.map((e) => e.name)).size, 100);
  });
  test("aucune paire de modèles de structure trop proche : similarité ≤ 0,85", { skip: toutConstruit ? false : "familles non toutes construites" }, () => {
    const docs = listes.map((l) => ({ k: l.fullKey, t: Emp.jetons(docOf(l)) }));
    for (let i = 0; i < docs.length; i++) for (let j = i + 1; j < docs.length; j++) {
      const s = Emp.similarite(docs[i].t, docs[j].t);
      assert.ok(s <= Emp.SEUIL_SIMILARITE, `${docs[i].k} ≈ ${docs[j].k} : ${s.toFixed(2)}`);
    }
  });
});

describe("Pied de page : éléments de la refonte validés par la grammaire du Page Builder (modèle d'essai, base en mémoire)", () => {
  // Modèle d'essai (JAMAIS listé) qui utilise tous les éléments ajoutés : prouve qu'ils sont acceptés par le nettoyeur du Page Builder
  const essai = () => {
    const famille = Footer.FAMILLES_CLES.map((k) => ({ key: k, label: k, description: "", target: 0, models: k !== "corporate" ? [] : [{
      id: "ft-corporate-01-essai", name: "Essai", family: "corporate", description: "Modèle d'essai de tous les éléments ajoutés.", tags: ["essai"], identity: "marine",
      structure: { rows: [
        Kit.A([["Produits", "shopcats:5"], ["Aide", "shoplinks"], ["Contact", "contactform|Écrivez-nous|Une question ?"], ["Newsletter", "newsletter|Restez informé|Une fois par mois."]], { pad: "lg" }),
        Kit.C([[6, "socials:facebook+instagram+linkedin+youtube+x+tiktok+whatsapp+telegram+pinterest+reddit+threads+website|big"], [6, "pay|Paiement accepté", "legallinks"]]),
        Kit.L([Kit.menuDeroulant("Liens utiles", ["menu", "hmenu"])], [Kit.widget("bizhours", { title: "Horaires" }, { mobile: { fontSize: "13px" }, hideOn: ["mobile"] })], { mobile: { gap: "8px" } }),
      ] },
    }] }));
    return Footer.assemble({ familles: famille }).layouts.find((l) => l.fullKey === "ft-corporate-01-essai");
  };
  test("tous les éléments ajoutés sont acceptés et conservés à l'enregistrement (réglages, accordéon mobile, 13 réseaux)", () => {
    const { A } = freshMarketing();
    const site = pages.createSite(A, { name: "Essai" }).id;
    const l = essai();
    const section = layout(withIds(l.build(kit(Footer.skins.find((s) => s.key === l.skin)), {})));
    const c = pages.createComponent(A, { name: "Pied d'essai", section: JSON.parse(JSON.stringify(section)), siteId: site, kind: "standard" });
    const saved = pages.getComponent(A, c.id).section, byType = {};
    walk(saved.children, (n) => { (byType[n.type] = byType[n.type] || []).push(n); });
    for (const t of ["shopcategories", "shoplinks", "emailsubscribe", "social", "bizpayments", "bizlegal", "bizhours", "menu"]) assert.ok(byType[t], `${t} conservé`);
    const subs = byType.emailsubscribe;
    assert.equal(subs.length, 2);
    assert.ok(subs.every((n) => n.props.showWhenMissing === true), "état « non configuré » conservé");
    assert.deepEqual(subs.map((n) => n.props.fields).sort(), ["all", "email"]);
    assert.equal(byType.social[0].props.items.length, 12 + 0, "12 réseaux demandés (email exclu) conservés");
    const acc = byType.container.filter((n) => n.props && n.props.mode === "accordion");
    assert.ok(acc.length >= 2 && acc.every((n) => n.props.accMobile === true), "accordéon mobile conservé");
    assert.deepEqual(byType.bizhours[0].hideOn, ["mobile"]);
  });
  test("les 13 réseaux du widget sont acceptés (email avec une vraie adresse mailto:)", () => {
    const { A } = freshMarketing();
    const sec = (items) => layout(withIds([{ type: "container", props: { full: true }, children: [{ type: "social", props: { items, size: "32", shape: "circle", label: "Nos réseaux" } }] }]));
    const tous = Kit.NETWORK_KEYS;
    const items = tous.map((network) => ({ network, url: network === "email" ? "mailto:contact@exemple.fr" : network === "website" ? "/" : `https://${network}.exemple.fr/` }));
    const c = pages.createComponent(A, { name: "13 réseaux", section: sec(items), kind: "standard" });
    let n = null; walk(pages.getComponent(A, c.id).section.children, (x) => { if (x.type === "social") n = x; });
    assert.equal(n.props.items.length, 13);
  });
});
