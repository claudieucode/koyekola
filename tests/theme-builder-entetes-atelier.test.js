// Bibliothèque d'EN-TÊTES « Atelier » : exactement 100 modèles (10 secteurs × 10), 36 architectures, composition DISTINCTE pour chacun (pas une affaire de couleur), identité propre (couleurs et polices fixes),
// éléments natifs valides, mouvement et réglages, utilisation (copie indépendante), publication, rendu par le vrai moteur. Voir docs/theme-builder/HEADER_LIBRARY_100_MODELS_REPORT.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const store = require("../src/themeBuilder/store");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const { normalizeSections, newSectionId } = require("../src/marketing/pages/sections");
const { MODELS } = require("../src/themeBuilder/catalog/header"), { SECTORS } = require("../src/themeBuilder/catalog/header/models");
const { audit } = require("../scripts/audit-entetes-atelier");
const { startServer, loginInstructor } = require("./helpers");

const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); if (n && n.children) walk(n.children, fn); } };
const all = Catalog.entries("header");
const doc = (key) => Catalog.build("header", key).section;
const nodesOf = (key) => { const out = []; walk(doc(key).children, (n) => out.push(n)); return out; };
const lum = (h) => { const m = /^#([0-9a-f]{6})/i.exec(h); const v = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe("En-têtes Atelier : le catalogue", () => {
  const A = audit();
  test("exactement 100 modèles : 10 secteurs de 10 ; clés et noms uniques, clés sûres pour une adresse", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100); assert.equal(new Set(all.map((e) => e.name)).size, 100, "deux modèles portent le même nom");
    for (const s of SECTORS) assert.equal(all.filter((e) => e.layoutKey === s.key).length, 10, s.key);
    for (const e of all) assert.match(e.key, /^[a-z0-9-]+\.[a-z0-9-]+$/, e.key);
    assert.equal(Catalog.stats().find((t) => t.type === "header").count, 100);
  });
  test("100 compositions DISTINCTES (aucune paire de même structure) issues d'au moins 30 architectures", () => {
    assert.equal(A.distinct, 100, `groupes identiques : ${JSON.stringify(A.duplicates)}`);
    assert.ok(new Set(A.rows.map((r) => r.arch)).size >= 30, "trop peu d'architectures");
    // aucune architecture ne représente plus de 6 modèles
    const per = {}; for (const r of A.rows) per[r.arch] = (per[r.arch] || 0) + 1; assert.ok(Math.max(...Object.values(per)) <= 6, JSON.stringify(per));
  });
  test("chaque modèle a son identité PROPRE : couleurs fixes, polices de la bibliothèque locale, aucune couleur de la charte du site ni de l'administration", () => {
    assert.equal(new Set(MODELS.map((m) => m.S.key)).size, 100);
    for (const e of all) {
      const raw = JSON.stringify(doc(e.key));
      assert.ok(!/token:/.test(raw), `${e.key} : jeton du site dans un style`);
      const M = MODELS.find((x) => `${x.key}.${x.key}` === e.key);
      for (const c of ["bg", "fg", "accent", "alt", "line"]) assert.match(M.S[c], /^#[0-9a-f]{6}$/i, `${e.key} ${c}`);
      assert.match(M.S.font, /^font\.[a-z0-9-]+$/); assert.match(M.S.head, /^font\.[a-z0-9-]+$/);
    }
    // au moins 60 couples de polices différents et 90 palettes différentes : pas de simple recoloriage
    assert.ok(new Set(MODELS.map((m) => `${m.S.head}|${m.S.font}`)).size >= 60, "polices trop répétées");
    assert.ok(new Set(MODELS.map((m) => `${m.S.bg}|${m.S.accent}`)).size >= 90, "palettes trop répétées");
  });
  test("lisibilité : contraste ≥ 4,5 entre texte et fond, et entre le texte du bouton et sa couleur", () => {
    for (const m of MODELS) {
      assert.ok(contrast(m.S.fg, m.S.bg) >= 4.5, `${m.key} texte/fond ${contrast(m.S.fg, m.S.bg).toFixed(2)}`);
      assert.ok(contrast(m.S.mute, m.S.bg) >= 4.5, `${m.key} texte secondaire ${contrast(m.S.mute, m.S.bg).toFixed(2)}`);
      assert.ok(contrast(m.S.onAccent, m.S.accent) >= 4.5, `${m.key} bouton ${contrast(m.S.onAccent, m.S.accent).toFixed(2)}`);
    }
  });
  test("tous les modèles passent la grammaire du Page Builder (mêmes contrôles que la sauvegarde) ; éléments natifs uniquement", () => {
    const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    const used = new Set();
    for (const e of all) {
      assert.doesNotThrow(() => normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: doc(e.key).children }]), e.key);
      for (const n of nodesOf(e.key)) used.add(n.type);
    }
    for (const t of used) assert.ok(["container", "group", "stack", "grid", "sitelogo", "sitetitle", "menu", "search", "account", "minicart", "button", "social", "dyntext", "text", "iconlist", "divider", "spacer", "heading", "link", "marquee", "motionfsmenu"].includes(t), `type inattendu : ${t}`);
  });
  test("aucun contenu factice : ni image, ni vidéo, ni script, ni HTML libre ; les menus lisent le menu affecté ; coordonnées = consignes", () => {
    for (const e of all) {
      for (const n of nodesOf(e.key)) {
        assert.ok(!["image", "video", "html", "gallery", "carousel"].includes(n.type), `${e.key} : ${n.type}`);
        if (n.type === "menu") { assert.equal(n.props.source, "location", e.key); assert.deepEqual(n.props.items, [], e.key); }
        if (n.type === "button") assert.match(n.props.url, /^\/(catalogue|inscription|contact|blog|connexion)$/, `${e.key} : ${n.props.url}`);
        if (n.type === "social") for (const it of n.props.items) assert.match(it.url, /^https:\/\/www\.(facebook|instagram|linkedin)\.com\/$/);
      }
      assert.doesNotMatch(JSON.stringify(doc(e.key)), /\d{2}[ .]\d{2}[ .]\d{2}[ .]\d{2}|@[a-z0-9-]+\.(com|fr)|rue |avenue /i, `${e.key} : coordonnée inventée`);
    }
  });
  test("responsive : aucune position absolue dans une rangée, menu repliable sur mobile (sauf vertical), grilles repliées en tablette/mobile, éléments secondaires masqués sur mobile", () => {
    for (const e of all) {
      const d = doc(e.key), first = d.children[0];
      // la position (sticky / absolute) n'existe que sur le conteneur d'en-tête
      walk(first.children, (n) => { const p = n.styles && n.styles.desktop && n.styles.desktop.position; assert.ok(!p || p === "static" || p === "relative", `${e.key} : position ${p} dans une rangée`); });
      walk(d.children, (n) => {
        if (n.type === "menu" && !n.props.vertical) assert.equal(n.props.mobileToggle, true, `${e.key} : menu non repliable`);
        if (n.type === "grid") { assert.ok(n.styles.mobile && n.styles.mobile.gridTemplate === "1fr", `${e.key} : grille non repliée sur mobile`); assert.ok(n.styles.tablet, `${e.key} : grille sans réglage tablette`); }
        if (["social", "date", "iconlist"].includes(n.type)) assert.deepEqual(n.hideOn, ["mobile"], `${e.key} : ${n.type} visible sur mobile`);
        const w = n.styles && n.styles.desktop && n.styles.desktop.width; if (n.type !== "search" && w && /px$/.test(w) && n.type !== "group" && n.type !== "divider") assert.ok(parseInt(w) <= 260, `${e.key} : largeur fixe ${w}`);
      });
    }
  });
  test("comportements : collant, superposé, réduit, devient plein, se cache au défilement — portés par le conteneur d'en-tête ; jamais deux positions", () => {
    const A2 = audit().rows; const by = (f) => A2.filter(f).length;
    assert.ok(by((r) => r.mode === "collant") >= 20, "au moins 20 collants"); assert.ok(by((r) => r.mode === "superposé") >= 3, "au moins 3 superposés");
    assert.ok(by((r) => r.fx === "shrink") >= 5 && by((r) => r.fx === "hide") >= 3 && by((r) => r.fx === "solid") >= 2, JSON.stringify({ shrink: by((r) => r.fx === "shrink"), hide: by((r) => r.fx === "hide"), solid: by((r) => r.fx === "solid") }));
    for (const e of all) { const f = doc(e.key).children[0]; assert.equal(f.type, "container"); assert.equal(f.props.full, true); const pos = f.styles.desktop.position; if (f.props.headerFx) assert.ok(pos === "sticky" || pos === "absolute", `${e.key} : effet sans position`); if (f.props.headerFx === "hide") assert.equal(pos, "sticky"); if (f.props.headerFx === "solid") assert.equal(pos, "absolute"); }
  });
  test("mouvement : entrée du logo, de la navigation et des actions (animations natives), survol des boutons ; tout reste réglable et désactivable dans l'éditeur", () => {
    const withMotion = A.rows.filter((r) => r.motion.length).length; assert.ok(withMotion >= 90, `${withMotion} modèles animés`);
    assert.ok(new Set(A.rows.flatMap((r) => r.motion)).size >= 6, "trop peu d'animations d'entrée différentes");
    assert.ok(new Set(A.rows.flatMap((r) => r.hovers)).size >= 8, "trop peu d'effets de survol différents");
    // un nœud animé reste un nœud ordinaire : la propriété « motion » est celle que l'éditeur propose (durée, délai, déclencheur, écrans, mouvement réduit)
    const ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    const out = normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: doc("luxe-01.luxe-01").children }]);
    let seen = 0; walk(out[0].children, (n) => { if (n.motion && n.motion.entrance) { seen++; assert.ok(n.motion.duration >= 100); } }); assert.ok(seen >= 2, "le mouvement n'est pas conservé à l'enregistrement");
  });
  test("diversité typographique et sectorielle : chaque secteur utilise au moins 6 architectures et 8 couples de polices", () => {
    for (const s of SECTORS) {
      const ms = MODELS.filter((m) => m.sector === s.key);
      assert.ok(new Set(ms.map((m) => m.arch)).size >= 6, `${s.key} : architectures`); assert.ok(new Set(ms.map((m) => `${m.S.head}|${m.S.font}`)).size >= 8, `${s.key} : polices`);
    }
    // les modèles e-commerce portent les éléments commerciaux réels (recherche, compte, panier)
    for (const m of MODELS.filter((x) => x.sector === "ecom")) { const types = nodesOf(`${m.key}.${m.key}`).map((n) => n.type); assert.ok(types.includes("minicart") && types.includes("account") && types.includes("search"), `${m.key} : éléments de boutique`); }
  });
  test("liste : recherche, filtre par secteur, pagination ; la liste ne contient jamais les documents", () => {
    const l = Catalog.list("header", { limit: 12, page: 2 }); assert.equal(l.total, 100); assert.equal(l.items.length, 12); assert.ok(!("section" in l.items[0]) && !("build" in l.items[0]));
    assert.equal(Catalog.list("header", { layout: "ecom", limit: 60 }).total, 10);
    assert.ok(Catalog.list("header", { q: "monumentale", limit: 60 }).total >= 1);
    assert.equal(Catalog.list("header", { layout: "luxe", limit: 60 }).layouts.length, 10);
  });
});

describe("En-têtes Atelier : utilisation, édition, isolation", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Un" }), s2 = pages.createSite(A, { name: "Deux" });
  test("« Utiliser » crée un composant + un modèle brouillon, copie indépendante : modifier la copie ne touche ni le catalogue ni l'autre site", () => {
    const key = "sport-01.sport-01";
    const t = useTemplate(A, s1.id, "header", key); assert.equal(t.type, "header"); assert.equal(t.status, "draft");
    const comp = pages.getComponent(A, t.sourceId); assert.ok(comp.section.children.length >= 1);
    const before = JSON.stringify(Catalog.build("header", key));
    const section = JSON.parse(JSON.stringify(comp.section)); section.children[0].children[0].children[0].styles.desktop.backgroundColor = "#123456";
    pages.saveComponentDraft(A, t.sourceId, section);
    assert.equal(JSON.stringify(Catalog.build("header", key)), before, "catalogue intact"); assert.equal(store.list(A, s2.id).length, 0, "l'autre site n'a rien reçu");
  });
  test("les 100 modèles s'enregistrent comme composants (édition, sauvegarde, rechargement) et gardent leur identité et leur mouvement", () => {
    for (const e of all) {
      const src = JSON.parse(JSON.stringify(Catalog.build("header", e.key).section));
      const c = pages.createComponent(A, { name: `H ${e.key}`, section: src, siteId: s1.id, kind: "standard" });
      const saved = pages.getComponent(A, c.id); assert.equal(saved.section.children.length, 1, e.key);
      assert.equal(JSON.stringify(saved.section).includes("font."), true, `${e.key} : police propre perdue`);
    }
  });
  test("publication et conditions : un en-tête du catalogue se publie et s'affecte comme tout modèle (mêmes conditions → remplacement explicite)", () => {
    const a = useTemplate(A, s2.id, "header", "tech-01.tech-01"), b = useTemplate(A, s2.id, "header", "luxe-02.luxe-02");
    store.publish(A, s2.id, a.id); assert.throws(() => store.publish(A, s2.id, b.id), /mêmes conditions/);
    const r = store.publish(A, s2.id, b.id, { replace: true }); assert.equal(r.template.status, "published"); assert.equal(r.replaced.length, 1);
  });
});

describe("En-têtes Atelier : rendu par le vrai moteur (aperçu, vignette, site publié)", () => {
  let srv, boss, site;
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Rendu en-têtes" })).location.match(/sites\/(\d+)/)[1]);
  });
  after(async () => { if (srv) await srv.stop(); });

  test("les 100 aperçus et vignettes répondent 200, affichent l'identité du site, portent leurs polices propres et aucun script", async () => {
    for (const e of all) {
      const M = MODELS.find((x) => `${x.key}.${x.key}` === e.key), fam = (id) => id.replace(/^font\./, "").split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      for (const kind of ["apercu", "vignette"]) {
        const r = await boss.get(U(`/api/bibliotheque/header/${e.key}/${kind}`));
        assert.equal(r.status, 200, `${e.key} ${kind}`);
        assert.match(r.text, /kw-theme-part kw-theme-header/, `${e.key} ${kind} : partie d'en-tête`);
        assert.match(r.text, /kw-sitelogo|kw-sitetitle/, `${e.key} ${kind} : identité du site`);
        assert.ok(!/<script/i.test(r.text), `${e.key} ${kind} : script`);
        assert.ok(r.text.includes("@font-face") && r.text.toLowerCase().includes(fam(M.S.head).toLowerCase()), `${e.key} ${kind} : police propre « ${fam(M.S.head)} » non chargée`);
      }
    }
  });
  test("aperçu = vignette : même composition (mêmes éléments dans le même ordre) pour chaque modèle", async () => {
    const shape = (h) => (h.match(/kw-(sitelogo|sitetitle|menu|search|account|minicart|button|link|social|dyntext)\b/g) || []).join(",");
    for (const e of all.filter((_, i) => i % 5 === 0)) {
      const a = (await boss.get(U(`/api/bibliotheque/header/${e.key}/apercu`))).text, v = (await boss.get(U(`/api/bibliotheque/header/${e.key}/vignette`))).text;
      assert.equal(shape(v), shape(a), e.key);
    }
  });
  test("menu d'exemple : présent dans l'aperçu de la bibliothèque, ABSENT d'une copie sur le site (sans menu affecté : rien)", async () => {
    const lib = (await boss.get(U("/api/bibliotheque/header/tech-01.tech-01/apercu"))).text; assert.match(lib, /Services/, "menu d'exemple dans la bibliothèque");
    const used = JSON.parse((await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key: "tech-01.tech-01" }, headers: { Origin: srv.base } })).text).template;
    const copy = (await boss.get(`/marketing/site-web/composants/${used.sourceId}/apercu`)).text; assert.doesNotMatch(copy, /Services/, "aucun menu d'exemple sur la copie du site");
  });
  test("collant, superposé et « se cache » : le rendu pose les classes de comportement et l'attribut d'effet sur la partie d'en-tête", async () => {
    const sticky = (await boss.get(U("/api/bibliotheque/header/luxe-02.luxe-02/apercu"))).text; assert.match(sticky, /kw-theme-sticky/);
    const hide = MODELS.find((m) => m.mode === "stickyhide"); const h = (await boss.get(U(`/api/bibliotheque/header/${hide.key}.${hide.key}/apercu`))).text; assert.match(h, /kw-theme-fx-hide/);
    const over = MODELS.find((m) => m.mode === "overlay" || m.mode === "overlaysolid"); const o = (await boss.get(U(`/api/bibliotheque/header/${over.key}.${over.key}/apercu`))).text; assert.match(o, /kw-theme-header kw-theme-overlay/);
    const plain = (await boss.get(U("/api/bibliotheque/header/luxe-01.luxe-01/apercu"))).text; assert.doesNotMatch(plain, /kw-theme-header kw-theme-(sticky|overlay)/);
  });
  test("anciennes clés : 404, aucune vignette fantôme", async () => {
    for (const old of ["classique-logo-menu-bouton.clair", "classique.clair", "verre.nuit", "centre-signature.marque"]) for (const kind of ["apercu", "vignette", "miniature"]) assert.equal((await boss.get(U(`/api/bibliotheque/header/${old}/${kind}`))).status, 404, `${old} ${kind}`);
  });
  test("réglage de l'effet d'un en-tête : « se cache en descendant » est accepté, enregistré et relu ; une valeur inconnue est écartée", async () => {
    const hide = MODELS.find((m) => m.mode === "stickyhide"), ctx = { organizationId: 1, db: { prepare: () => ({ get: () => null, all: () => [] }) } };
    const ok = normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: doc(`${hide.key}.${hide.key}`).children }]); assert.equal(ok[0].children[0].props.headerFx, "hide");
    const bad = JSON.parse(JSON.stringify(doc(`${hide.key}.${hide.key}`).children)); bad[0].props.headerFx = "explose";
    assert.equal(normalizeSections(ctx, [{ id: newSectionId(), type: "layout", children: bad }])[0].children[0].props.headerFx, undefined);
  });
});
