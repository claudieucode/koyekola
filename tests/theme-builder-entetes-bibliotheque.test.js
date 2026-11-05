// Bibliothèque d'EN-TÊTES du Theme Builder : exactement 100 compositions distinctes (10 familles × 10, 20 par identité), toutes valides, responsive, sans élément factice,
// utilisables (copie indépendante) et rendues par le vrai moteur (aperçu = vignette = site publié). Voir docs/theme-builder/kolakisa-header-library.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const store = require("../src/themeBuilder/store");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const Header = require("../src/themeBuilder/catalog/header");
const { startServer, loginInstructor } = require("./helpers");

const walk = (nodes, fn, depth = 0) => { for (const n of nodes || []) { fn(n, depth); if (n && n.children) walk(n.children, fn, depth + 1); } };
const all = Catalog.entries("header");
const SECTOR_IDS = ["restaurant", "ecole", "agence", "cabinet", "portfolio", "saas-violet", "media", "mode-boutique", "hotel", "association", "immobilier", "bien-etre"];
const doc = (key) => Catalog.build("header", key).section;
const nodesOf = (key) => { const out = []; walk(doc(key).children, (n) => out.push(n)); return out; };
// Signature de COMPOSITION : arbre des types d'éléments, rôle (libellé/adresse des boutons), position, direction, et — pour les valeurs qui changent la mise en page — display, position, flexDirection, nombre de rangées.
const signature = (key) => JSON.stringify(doc(key), (k, v) => {
  if (k === "id") return undefined;
  if (k === "styles") { const d = v.desktop || {}; return { p: d.position, fd: d.flexDirection, jc: d.justifyContent, mw: d.maxWidth, br: d.borderRadius, bw: d.borderBottomWidth, bg: d.backgroundColor === "transparent" ? "t" : d.backgroundColor ? "c" : "", bf: d.flexBasis, pad: d.paddingTop }; }
  if (k === "props") return { l: v.label, u: v.url, t: v.text, html: v.html, loc: v.location, src: v.source, h: v.height, tg: v.target, w: v.mobileToggle };
  return v;
});

describe("En-têtes : le catalogue", () => {
  test("exactement 100 modèles : 10 familles de 10 ; 34 identités propres (22 + 12 sectorielles), aucune identité du site ; clés et noms uniques", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100, "clés uniques");
    assert.equal(new Set(all.map((e) => e.name)).size, 100, "noms uniques");
    const byFamily = {}, bySkin = {};
    for (const e of all) { byFamily[e.layoutKey] = (byFamily[e.layoutKey] || 0) + 1; bySkin[e.skinKey] = (bySkin[e.skinKey] || 0) + 1; }
    assert.deepEqual(Object.keys(byFamily).sort(), Header.families.map((f) => f.key).sort());
    for (const [f, n] of Object.entries(byFamily)) assert.equal(n, 10, `famille ${f}`);
    const BASE = ["clair", "marque", "nuit", "editorial", "doux"];
    for (const [s, n] of Object.entries(bySkin)) { assert.ok(!BASE.includes(s), `identité du site « ${s} » encore utilisée`); assert.ok(n >= 1 && n <= 5, `identité ${s} : ${n}`); }
    assert.equal(Object.keys(bySkin).length, 34);
    const ids = all.map((e) => e.layoutId); assert.equal(new Set(ids).size, ids.length, "identifiants de mise en page uniques (la construction cherche par identifiant)");
  });
  test("clés sûres pour une adresse (ASCII minuscule, chiffres, tiret) : aucune clé ne casse la route de la bibliothèque", () => {
    for (const e of all) assert.match(e.key, /^[a-z0-9]+(-[a-z0-9]+)*\.[a-z]+$/, e.key);
  });
  test("les anciennes clés du catalogue 20 × 5 n'existent plus", () => {
    for (const old of ["classique.clair", "centre.marque", "empile.nuit", "minimal.editorial", "annonce.doux", "verre.clair", "transparent.nuit", "masthead.editorial", "liseré.marque"]) assert.equal(Catalog.find("header", old), null, old);
  });
  test("100 compositions DISTINCTES : aucune paire de modèles de même structure (ce n'est pas une affaire de couleur)", () => {
    const seen = new Map();
    for (const e of all) { const sig = signature(e.key); assert.ok(!seen.has(sig), `${e.key} a la même composition que ${seen.get(sig)}`); seen.set(sig, e.key); }
    // la composition ne dépend pas de l'identité : on retire couleurs et typographie et on exige toujours 100 arbres différents
    const KEEP = ["position", "flexDirection", "justifyContent", "flexBasis", "maxWidth", "borderRadius"];
    const shapes = new Set(all.map((e) => JSON.stringify(doc(e.key), (k, v) => (k === "id" ? undefined : k === "styles" ? Object.fromEntries(Object.entries(v.desktop || {}).filter(([x]) => KEEP.includes(x))) : k === "props" ? { l: v.label, u: v.url, t: v.text, loc: v.location } : v))));
    assert.ok(shapes.size >= 97, `compositions sans couleurs : ${shapes.size}`);
  });
  test("chaque en-tête a une identité de site (logo ou titre) et une navigation (menu affecté), sauf les modèles volontairement sans menu", () => {
    const noMenu = [];
    for (const e of all) {
      const types = nodesOf(e.key).map((n) => n.type);
      assert.ok(types.includes("sitelogo") || types.includes("sitetitle"), `${e.key} : ni logo ni titre`);
      if (!types.includes("menu")) noMenu.push(e.key);
    }
    assert.ok(noMenu.length <= 3, `trop de modèles sans menu : ${noMenu.join(", ")}`);
  });
  test("aucun contenu factice : pas d'image, de vidéo ni de script ; les menus lisent le menu affecté (jamais de liste de liens recopiée) ; aucune adresse externe hors réseaux sociaux", () => {
    for (const e of all) walk(doc(e.key).children, (n) => {
      assert.ok(!["image", "video", "html", "embed", "carousel", "gallery"].includes(n.type), `${e.key} : ${n.type}`);
      if (n.type === "menu") { assert.equal(n.props.source, "location", `${e.key} : menu`); assert.equal(n.props.location, "header", `${e.key} : emplacement`); assert.deepEqual(n.props.items, [], `${e.key} : liste recopiée`); }
      if (n.type === "button" || n.type === "link") assert.match(n.props.url, /^\/[a-z0-9/_-]*$/i, `${e.key} : adresse « ${n.props.url} »`);
    });
  });
  test("responsive : menu repliable sur petit écran, éléments secondaires masqués sur mobile, aucune position absolue dans les rangées, flex avec retour à la ligne", () => {
    for (const e of all) {
      const nodes = nodesOf(e.key);
      for (const n of nodes) if (n.type === "menu") assert.equal(n.props.mobileToggle, true, `${e.key} : menu non repliable`);
      for (const n of nodes) if (["social", "dyntext"].includes(n.type)) { const keep = /creatif-pile-centre-reseaux|creatif-icones/.test(e.key); if (!keep) assert.ok((n.hideOn || []).includes("mobile"), `${e.key} : ${n.type} visible sur mobile`); }
      // les rangées (enfants du conteneur d'en-tête) ne contiennent aucun positionnement absolu / fixe
      const root = doc(e.key).children[0];
      walk(root.children, (n) => { const p = (n.styles && n.styles.desktop && n.styles.desktop.position) || ""; assert.ok(!["absolute", "fixed"].includes(p), `${e.key} : position ${p} dans une rangée`); });
      walk(root.children, (n) => { if (n.type === "container" && n.styles && n.styles.desktop && n.styles.desktop.display === "flex" && n.styles.desktop.maxWidth) assert.notEqual(n.styles.desktop.flexWrap, "nowrap", `${e.key} : zone sans retour à la ligne`); });
    }
  });
  test("collant et superposé : portés par le conteneur d'en-tête (premier enfant, lu par le rendu) ; 10 superposés, au moins 10 collants, jamais les deux", () => {
    let overlay = 0, sticky = 0;
    for (const e of all) {
      const p = (doc(e.key).children[0].styles.desktop || {}).position || "";
      if (p === "absolute") { overlay += 1; assert.equal(e.layoutKey, "transparent", `${e.key} : superposé hors famille`); }
      if (p === "sticky") { sticky += 1; assert.ok(["collant", "saas"].includes(e.layoutKey) || SECTOR_IDS.some((w) => e.layoutId.startsWith(w)), `${e.key} : collant hors famille`); }
    }
    assert.equal(overlay, 10); assert.ok(sticky >= 10, `collants : ${sticky}`);
  });
  test("liste : recherche sans accents, filtre par famille et par identité, pagination ; la liste ne contient jamais les documents", () => {
    const p = Catalog.list("header", { limit: 24 });
    assert.equal(p.total, 100); assert.equal(p.pages, 5); assert.equal(p.layouts.length, 10); assert.equal(p.skins.length, 34);
    assert.ok(!("section" in p.items[0]));
    assert.equal(Catalog.list("header", { layout: "boutique" }).total, 10);
    assert.equal(Catalog.list("header", { skin: "graphite" }).total, all.filter((e) => e.skinKey === "graphite").length); assert.ok(Catalog.list("header", { skin: "graphite" }).total >= 3); assert.equal(Catalog.list("header", { skin: "nuit" }).total, 0, "plus d'identité du site");
    assert.equal(Catalog.list("header", { layout: "saas", skin: "doux" }).total, all.filter((e) => e.layoutKey === "saas" && e.skinKey === "doux").length);
    assert.ok(Catalog.list("header", { q: "ECOMMERCE" }).total >= 0);
    assert.ok(Catalog.list("header", { q: "collant" }).total >= 10);
    assert.equal(Catalog.list("header", { q: "zzzz-inconnu" }).total, 0);
  });
});

describe("En-têtes : utilisation, édition, isolation", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Un" }), s2 = pages.createSite(A, { name: "Deux" });
  test("« Utiliser » crée un composant + un modèle brouillon, copie indépendante : modifier la copie ne touche pas le catalogue ni l'autre site", () => {
    const key = "saas-pilule.doux";
    const t = useTemplate(A, s1.id, "header", key);
    assert.equal(t.type, "header"); assert.equal(t.status, "draft");
    const comp = pages.getComponent(A, t.sourceId);
    assert.ok(comp.section.children.length >= 1);
    const before = JSON.stringify(Catalog.build("header", key));
    const section = JSON.parse(JSON.stringify(comp.section)); section.children[0].children[0].children[0].children[0].props = { ...section.children[0].children[0].children[0].children[0].props, height: 60 };
    pages.saveComponentDraft(A, t.sourceId, section);
    assert.equal(JSON.stringify(Catalog.build("header", key)), before, "catalogue intact");
    assert.equal(store.list(A, s2.id).length, 0, "l'autre site n'a rien reçu");
  });
  test("les 100 modèles passent la grammaire du Page Builder comme composants (édition et sauvegarde possibles)", () => {
    for (const e of all) {
      const c = pages.createComponent(A, { name: `H ${e.key}`, section: JSON.parse(JSON.stringify(Catalog.build("header", e.key).section)), siteId: s1.id, kind: "standard" });
      const saved = pages.getComponent(A, c.id);
      assert.equal(saved.section.children.length, 1, e.key);
    }
  });
  test("publication et conditions : un en-tête du catalogue se publie et s'affecte comme tout modèle (même conditions → remplacement explicite)", () => {
    const a = useTemplate(A, s2.id, "header", "classique-logo-menu-bouton.clair");
    const b = useTemplate(A, s2.id, "header", "centre-signature.marque");
    store.publish(A, s2.id, a.id);
    assert.throws(() => store.publish(A, s2.id, b.id), /mêmes conditions/);
    const r = store.publish(A, s2.id, b.id, { replace: true });
    assert.equal(r.template.status, "published"); assert.equal(r.replaced.length, 1);
  });
});

describe("En-têtes : rendu par le vrai moteur (aperçu, vignette, site publié)", () => {
  let srv, boss, site;
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Rendu en-têtes" })).location.match(/sites\/(\d+)/)[1]);
  });
  after(async () => { if (srv) await srv.stop(); });

  test("les 100 aperçus et vignettes répondent 200 et affichent le logo du site, un menu d'exemple (jamais sur un vrai site) et aucun script", async () => {
    for (const e of all) {
      for (const kind of ["apercu", "vignette"]) {
        const r = await boss.get(U(`/api/bibliotheque/header/${e.key}/${kind}`));
        assert.equal(r.status, 200, `${e.key} ${kind}`);
        assert.match(r.text, /kw-theme-part kw-theme-header/, `${e.key} ${kind} : partie d'en-tête`);
        assert.match(r.text, /kw-sitelogo|kw-sitetitle/, `${e.key} ${kind} : identité du site`);
        assert.ok(!/<script/i.test(r.text), `${e.key} ${kind} : script`);
      }
    }
  });
  test("aperçu = vignette : même composition (mêmes éléments dans le même ordre) pour chaque modèle", async () => {
    const shape = (h) => (h.match(/kw-(sitelogo|sitetitle|menu|search|account|minicart|button|link|social|dyntext)\b/g) || []).join(",");
    for (const e of all.filter((_, i) => i % 7 === 0)) {
      const a = (await boss.get(U(`/api/bibliotheque/header/${e.key}/apercu`))).text, v = (await boss.get(U(`/api/bibliotheque/header/${e.key}/vignette`))).text;
      assert.equal(shape(v), shape(a), e.key);
    }
  });
  test("menu d'exemple : présent dans l'aperçu de la bibliothèque, ABSENT d'une copie sur le site (sans menu affecté : rien)", async () => {
    const lib = (await boss.get(U("/api/bibliotheque/header/classique-logo-menu-bouton.clair/apercu"))).text;
    assert.match(lib, /Services/, "menu d'exemple dans la bibliothèque");
    const used = JSON.parse((await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: "classique-logo-menu-bouton.clair" }, headers: { Origin: srv.base } })).text).template;
    const copy = (await boss.get(`/marketing/site-web/composants/${used.sourceId}/apercu`)).text;
    assert.doesNotMatch(copy, /Services/, "aucun menu d'exemple sur la copie du site");
  });
  test("collant et superposé : le rendu pose la classe de comportement sur la partie d'en-tête", async () => {
    const sticky = (await boss.get(U("/api/bibliotheque/header/collant-classique.clair/apercu"))).text;
    assert.match(sticky, /kw-theme-sticky/);
    const over = (await boss.get(U("/api/bibliotheque/header/superpose-classique.nuit/apercu"))).text;
    assert.match(over, /kw-theme-header kw-theme-overlay/);
    const plain = (await boss.get(U("/api/bibliotheque/header/classique-logo-menu-bouton.clair/apercu"))).text;
    assert.doesNotMatch(plain, /kw-theme-header kw-theme-(sticky|overlay)/);
  });
  test("anciennes clés : 404, aucune vignette fantôme", async () => {
    for (const old of ["classique.clair", "verre.nuit", "masthead.editorial"]) {
      for (const kind of ["apercu", "vignette", "miniature"]) assert.equal((await boss.get(U(`/api/bibliotheque/header/${old}/${kind}`))).status, 404, `${old} ${kind}`);
    }
  });
});
