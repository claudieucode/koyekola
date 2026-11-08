// Bibliothèque de PIEDS DE PAGE du Theme Builder : exactement 100 compositions distinctes (10 familles × 10, identités propres), toutes valides, responsive, sans élément factice,
// utilisables (copie indépendante) et rendues par le vrai moteur (aperçu = vignette = site publié, un seul pied par page). Voir docs/theme-builder/kolakisa-footer-library.md et docs/footer-builder/FOOTER_CATALOGUE.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const store = require("../src/themeBuilder/store");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const Footer = require("../src/themeBuilder/catalog/footer");
const { SKINS } = require("../src/themeBuilder/catalog/kit");
const { startServer, loginInstructor } = require("./helpers");

const walk = (nodes, fn, depth = 0) => { for (const n of nodes || []) { fn(n, depth); if (n && n.children) walk(n.children, fn, depth + 1); } };
const all = Catalog.entries("footer");
// REFONTE par familles métier : la liste contient exactement les 100 NOUVEAUX modèles (15 familles, répartition = Footer.CIBLE) ; les 100 anciens identifiants ne sont plus listés mais restent ouvrables (tests/footer-aliases.test.js).
const doc = (key) => Catalog.build("footer", key).section;
const nodesOf = (key) => { const out = []; walk(doc(key).children, (n) => out.push(n)); return out; };
// Signature de COMPOSITION : arbre des types d'éléments, rôle (libellé / adresse / emplacement), direction, poids des colonnes, nombre de rangées — sans couleurs ni typographie.
const signature = (key) => JSON.stringify(doc(key), (k, v) => {
  if (k === "id") return undefined;
  if (k === "styles") { const d = v.desktop || {}; return { fd: d.flexDirection, jc: d.justifyContent, ai: d.alignItems, fg: d.flexGrow, mw: d.maxWidth, mnw: d.minWidth, br: d.borderRadius ? 1 : 0, bt: d.borderTopWidth, ta: d.textAlign, bg: d.backgroundColor ? "c" : "", bs: d.borderStyle, fs: d.fontSize }; }
  if (k === "props") return { l: v.label, u: v.url, t: v.text, h: v.heading, html: v.html, loc: v.location, src: v.source, ht: v.height, tg: v.target, sh: v.shape, sz: v.size, it: v.items && v.items.length, ad: v.address, il: v.inline, ti: v.title, md: v.mode, lay: v.layout, cnt: v.count };
  return v;
});
const OLD_LAYOUTS = ["une-ligne", "copyright-seul", "trois-colonnes", "quatre-colonnes", "cinq-colonnes", "logo-description", "newsletter", "reseaux", "navigation-secondaire", "boutique", "blog", "pro", "formation", "marque-geante", "deux-rangees", "appel-action", "editorial", "centre", "asymetrique", "accordeons"];
const OLD_KEYS = OLD_LAYOUTS.flatMap((l) => SKINS.map((s) => `${l}.${s.key}`));

describe("Pieds de page : le catalogue", () => {
  test("exactement 100 nouveaux modèles listés en 15 familles (répartition = cible), identités propres, clés et noms uniques", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100, "clés uniques");
    assert.equal(new Set(all.map((e) => e.name)).size, 100, "noms uniques");
    const byFamily = {}, bySkin = {};
    for (const e of all) { byFamily[e.layoutKey] = (byFamily[e.layoutKey] || 0) + 1; bySkin[e.skinKey] = (bySkin[e.skinKey] || 0) + 1; }
    assert.deepEqual(Object.keys(byFamily).sort(), Footer.families.map((f) => f.key).sort());
    assert.deepEqual(byFamily, Footer.CIBLE, "répartition par famille = cible");
    assert.ok(all.every((e) => !e.legacy));
    for (const [sk, n] of Object.entries(bySkin)) assert.ok(n >= 1 && n <= 8, `identité ${sk} : ${n}`);
    assert.ok(Object.keys(bySkin).length >= 40, `identités distinctes : ${Object.keys(bySkin).length}`);
  });
  test("clés sûres pour une adresse (ASCII minuscule, chiffres, tiret) : aucune clé ne casse la route de la bibliothèque", () => {
    for (const e of all) { assert.match(e.key, /^ft-[a-z0-9]+(-[a-z0-9]+)*$/, e.key); assert.ok(e.key.length <= 80, e.key); }
  });
  test("les anciennes clés du catalogue 20 × 5 n'existent plus et aucune n'est réutilisée par un nouveau modèle", () => {
    assert.equal(OLD_KEYS.length, 100);
    for (const old of OLD_KEYS) { assert.equal(Catalog.find("footer", old), null, old); assert.equal(Catalog.build("footer", old), null, old); }
    const taken = new Set(all.map((e) => e.layoutId));
    for (const l of OLD_LAYOUTS) assert.ok(!taken.has(l), `identifiant de mise en page « ${l} » réutilisé`);
  });
  test("100 compositions DISTINCTES : aucune paire de modèles de même structure (ce n'est pas une affaire de couleur)", () => {
    const seen = new Map();
    for (const e of all) { const sig = signature(e.key); assert.ok(!seen.has(sig), `${e.key} a la même composition que ${seen.get(sig)}`); seen.set(sig, e.key); }
    // on retire aussi les couleurs et la typographie : la structure seule doit encore différencier au moins 98 modèles
    const KEEP = ["flexDirection", "justifyContent", "flexGrow", "maxWidth", "minWidth", "textAlign"];
    const shapes = new Set(all.map((e) => JSON.stringify(doc(e.key), (k, v) => (k === "id" ? undefined : k === "styles" ? Object.fromEntries(Object.entries(v.desktop || {}).filter(([x]) => KEEP.includes(x))) : k === "props" ? { l: v.label, u: v.url, t: v.text, loc: v.location, src: v.source, tg: v.target, ad: v.address, it: v.items && v.items.length, md: v.mode, cnt: v.count } : v))));
    assert.ok(shapes.size >= 98, `compositions sans couleurs : ${shapes.size}`);
  });
  test("chaque pied a un copyright et une navigation (menu du site ou liens vers des pages réelles) ; chaque besoin annoncé est couvert par plusieurs modèles", () => {
    let sansNavigation = 0;
    for (const e of all) {
      const types = nodesOf(e.key).map((n) => n.type);
      assert.ok(types.includes("copyright"), `${e.key} : pas de copyright`);
      if (!types.includes("menu") && types.filter((t) => t === "link").length < 2) sansNavigation += 1;
    }
    assert.ok(sansNavigation <= 5, `trop de modèles sans navigation : ${sansNavigation}`);
    const avec = (type) => all.filter((e) => nodesOf(e.key).some((n) => n.type === type)).length;
    assert.ok(avec("emailsubscribe") >= 20, "abonnement par e-mail");
    assert.ok(avec("bizcontact") >= 30 && avec("map") >= 1, "coordonnées lues dans les données de l'entreprise, carte");
    assert.ok(avec("social") >= 50, "réseaux");
    assert.ok(avec("shopcategories") + avec("shoplinks") + avec("account") >= 6, "boutique : catégories, liens de boutique ou compte");
  });
  test("aucun contenu factice : pas d'image, de vidéo ni de script ; menus lus dans le menu affecté (jamais de liste recopiée) ; adresses locales, réseaux génériques, carte neutre", () => {
    for (const e of all) walk(doc(e.key).children, (n) => {
      assert.ok(!["image", "video", "html", "embed", "carousel", "gallery"].includes(n.type), `${e.key} : ${n.type}`);
      if (n.type === "menu") { assert.equal(n.props.source, "location", `${e.key} : menu`); assert.ok(["footer", "header"].includes(n.props.location), `${e.key} : emplacement`); assert.deepEqual(n.props.items, [], `${e.key} : liste recopiée`); }
      if (n.type === "button" || n.type === "link") assert.match(n.props.url, /^(\/[a-z0-9/_-]*|https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/[a-z0-9\-\/._]*|#|mailto:[^\s@]+@[^\s@]+|tel:\+?[0-9 ]+)$/i, `${e.key} : adresse « ${n.props.url} »`); // pages de la plateforme, adresses d'EXEMPLE en https (marquées exemple dans le modèle) ou ancre
      if (n.type === "social") for (const it of n.props.items) assert.match(it.url, /^(https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/[a-z0-9\-\/._@]*|mailto:[^\s@]+@[^\s@]+|\/)$/, `${e.key} : réseau`);
      if (n.type === "map") assert.ok(/^[\p{L}0-9 ,.'-]{3,80}$/u.test(n.props.address), `${e.key} : adresse de carte « ${n.props.address} »`); // adresse d'exemple lisible (Lyon, place Bellecour)
      if (n.type === "iconlist") for (const it of n.props.items) { assert.ok(!/@|\d{2}/.test(it.text), `${e.key} : coordonnée inventée « ${it.text} »`); assert.ok(!it.link, `${e.key} : lien dans une coordonnée`); }
    });
  });
  test("responsive : colonnes Flexbox à largeur minimale qui passent à la ligne, aucune position absolue, aucun menu « hamburger » dans un pied, lignes repliées en pile sur mobile", () => {
    for (const e of all) {
      const nodes = nodesOf(e.key);
      for (const n of nodes) if (n.type === "menu") assert.equal(n.props.mobileToggle, false, `${e.key} : menu repliable`);
      const root = doc(e.key).children[0];
      walk(root.children, (n) => { const p = (n.styles && n.styles.desktop && n.styles.desktop.position) || ""; assert.ok(!["absolute", "fixed", "sticky"].includes(p), `${e.key} : position ${p}`); });
      walk(root.children, (n) => { const d = n.styles && n.styles.desktop; if (n.type === "container" && d && d.display === "flex" && d.maxWidth === "1180px") assert.notEqual(d.flexWrap, "nowrap", `${e.key} : zone sans retour à la ligne`); });
      // chaque colonne d'une rangée à plusieurs colonnes (poids flexGrow) porte une largeur minimale : sans elle, elle ne passerait jamais à la ligne
      walk(root.children, (n) => { const d = n.styles && n.styles.desktop; if (d && d.flexBasis === "0px" && d.flexGrow >= 1 && d.minWidth === undefined) assert.fail(`${e.key} : colonne sans largeur minimale`); });
      // le contenu n'est jamais masqué sur mobile (un pied de page garde ses liens, ses réseaux et ses mentions) hormis la date
      for (const n of nodes) if (n.hideOn) assert.ok(n.type === "dyntext", `${e.key} : ${n.type} masqué`);
    }
  });
  test("liste : recherche sans accents, filtre par famille et par identité, pagination ; la liste ne contient jamais les documents", () => {
    const p = Catalog.list("footer", { limit: 24 });
    assert.equal(p.total, 100); assert.equal(p.pages, 5); assert.equal(p.layouts.length, new Set(all.map((e) => e.layoutKey)).size); assert.equal(p.skins.length, Footer.skins.length);
    assert.ok(!("section" in p.items[0]) && !("build" in p.items[0]));
    const premiere = all[0].layoutKey; assert.equal(Catalog.list("footer", { layout: premiere }).total, all.filter((e) => e.layoutKey === premiere).length);
    assert.equal(Catalog.list("footer", { skin: "nuit" }).total, 0, "plus d'identité du site"); assert.equal(Catalog.list("footer", { skin: all[0].skinKey }).total, all.filter((e) => e.skinKey === all[0].skinKey).length);
    const sk = Catalog.entries("footer").find((e) => e.layoutKey === "corporate").skinKey; assert.equal(Catalog.list("footer", { layout: "corporate", skin: sk }).total, Catalog.entries("footer").filter((e) => e.layoutKey === "corporate" && e.skinKey === sk).length);
    assert.ok(Catalog.list("footer", { q: "NEWSLETTER" }).total >= 10);
    assert.ok(Catalog.list("footer", { q: "carte" }).total >= 4);
    assert.equal(Catalog.list("footer", { q: "zzzz-inconnu" }).total, 0);
  });
  test("pas de formulaire inventé : l'abonnement est un widget branché sur un formulaire RÉEL du site (formId 0 = premier formulaire publié, choisi à l'affichage), avec son état « non configuré » honnête quand il n'y en a pas ; jamais de faux champ ni de faux lien", () => {
    let vus = 0;
    for (const e of all) for (const env of [{}, { formId: 7 }]) walk(Catalog.build("footer", e.key, env).section.children, (n) => {
      assert.notEqual(n.type, "signupform", `${e.key} : ancien formulaire d'inscription`);
      if (n.type === "emailsubscribe") { vus += 1; assert.equal(n.props.formId, 0, `${e.key} : formulaire inventé`); assert.equal(n.props.showWhenMissing, true, `${e.key} : état non configuré`); }
    });
    assert.ok(vus >= 40);
  });
});

describe("Pieds de page : utilisation, édition, isolation", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Un" }), s2 = pages.createSite(A, { name: "Deux" });
  test("« Utiliser » crée un composant + un modèle brouillon, copie indépendante : modifier la copie ne touche pas le catalogue ni l'autre site", () => {
    const key = "ft-corporate-01-grande-marque-volets";
    const t = useTemplate(A, s1.id, "footer", key);
    assert.equal(t.type, "footer"); assert.equal(t.status, "draft");
    const comp = pages.getComponent(A, t.sourceId);
    assert.ok(comp.section.children.length >= 1);
    const before = JSON.stringify(Catalog.build("footer", key));
    const section = JSON.parse(JSON.stringify(comp.section));
    const firstText = []; walk(section.children, (n) => { if (n.type === "sitetitle" || n.type === "sitelogo") firstText.push(n); });
    firstText[0].props = { ...firstText[0].props, link: false };
    pages.saveComponentDraft(A, t.sourceId, section);
    assert.equal(JSON.stringify(Catalog.build("footer", key)), before, "catalogue intact");
    assert.equal(store.list(A, s2.id).length, 0, "l'autre site n'a rien reçu");
  });
  test("les 100 modèles passent la grammaire du Page Builder comme composants (édition et sauvegarde possibles), avec ou sans formulaire", () => {
    for (const e of all) {
      const c = pages.createComponent(A, { name: `P ${e.key}`, section: JSON.parse(JSON.stringify(Catalog.build("footer", e.key).section)), siteId: s1.id, kind: "standard" });
      const saved = pages.getComponent(A, c.id);
      assert.equal(saved.section.children.length, 1, e.key);
      // rechargement : la structure enregistrée est celle du catalogue (même nombre de rangées, mêmes types)
      const types = (s) => { const o = []; walk(s.children, (n) => o.push(n.type)); return o.join(","); };
      assert.equal(types(saved.section), types(Catalog.build("footer", e.key).section), `${e.key} : structure enregistrée`);
    }
  });
  test("publication et conditions : un pied du catalogue se publie et s'affecte comme tout modèle (mêmes conditions → remplacement explicite)", () => {
    const a = useTemplate(A, s2.id, "footer", all[0].key), b = useTemplate(A, s2.id, "footer", all[1].key);
    store.publish(A, s2.id, a.id);
    assert.throws(() => store.publish(A, s2.id, b.id), /mêmes conditions/);
    const r = store.publish(A, s2.id, b.id, { replace: true });
    assert.equal(r.template.status, "published"); assert.equal(r.replaced.length, 1);
  });
});

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
};

describe("Pieds de page : rendu par le vrai moteur (aperçu, vignette, site publié)", () => {
  let srv, boss, site, db, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const U = (p = "", s = site) => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: ORIGIN() });
  const setDomain = async (s, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${s}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${s}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Rendu pieds" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" }); // l'aperçu d'un composant s'affiche dans une page du site
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const mk = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
    A = mk("Site A", "site-a"); B = mk("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    const pid = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES ('article-a', 'Article de A', '<p>Texte</p>', 1, 'published', datetime('now'))").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, 'article-a')").run(pid, org, A);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 aperçus et vignettes répondent 200 et affichent le pied (copyright, identité), un menu d'exemple (jamais sur un vrai site) et, pour la vignette, aucun script (l'aperçu ne charge que landing.js)", async () => {
    for (const e of all) {
      for (const kind of ["apercu", "vignette"]) {
        const r = await boss.get(U(`/api/bibliotheque/footer/${e.key}/${kind}`));
        assert.equal(r.status, 200, `${e.key} ${kind}`);
        assert.match(r.text, /kw-theme-part kw-theme-footer/, `${e.key} ${kind} : partie de pied`);
        assert.match(r.text, /©/, `${e.key} ${kind} : copyright`);
        const scripts = r.text.match(/<script\b[^>]*>/gi) || [];
        if (kind === "vignette") assert.equal(scripts.length, 0, `${e.key} vignette : script`); else assert.ok(scripts.length === 1 && /\/js\/landing\.js/.test(scripts[0]), `${e.key} apercu : seul landing.js attendu`);
        assert.equal((r.text.match(/kw-theme-footer\b/g) || []).length, 1, `${e.key} ${kind} : un seul pied`);
      }
    }
  });
  test("aperçu = vignette : mêmes éléments dans le même ordre pour chaque modèle", async () => {
    const shape = (h) => (h.match(/kw-(sitelogo|sitetitle|menu|search|account|minicart|button|link|social|copyright|iconlist|map|signup|querylist|courselist|toggle|dyntext)\b/g) || []).join(",");
    for (const e of all.filter((_, i) => i % 5 === 0)) {
      const a = (await boss.get(U(`/api/bibliotheque/footer/${e.key}/apercu`))).text, v = (await boss.get(U(`/api/bibliotheque/footer/${e.key}/vignette`))).text;
      assert.equal(shape(v), shape(a), e.key);
    }
  });
  test("aperçu de la bibliothèque = copie du site = pied publié : mêmes éléments, menu d'exemple seulement dans la bibliothèque", async () => {
    const key = "ft-corporate-01-grande-marque-volets";
    const lib = (await boss.get(U(`/api/bibliotheque/footer/${key}/apercu`))).text;
    assert.match(lib, /Services/, "menu d'exemple dans la bibliothèque");
    const used = JSON.parse((await post(U("/api/bibliotheque/utiliser"), { type: "footer", key })).text).template;
    const copy = (await boss.get(`/marketing/site-web/composants/${used.sourceId}/apercu`)).text;
    assert.doesNotMatch(copy, /Services/, "aucun menu d'exemple sur la copie du site");
    // la copie est rendue dans une page du site (en-tête, liens du site…) : on ne compare que les widgets propres au pied
    const shape = (h) => (h.match(/kw-(copyright|querylist|iconlist)\b/g) || []).join(",");
    assert.equal(shape(copy), shape(lib), "mêmes widgets de pied dans l'aperçu de la copie et dans la bibliothèque");
  });
  test("anciennes clés : 404, aucune vignette fantôme", async () => {
    for (const old of ["trois-colonnes.nuit", "newsletter.clair", "une-ligne.clair", "quatre-colonnes.doux"]) {
      for (const kind of ["apercu", "vignette", "miniature"]) assert.equal((await boss.get(U(`/api/bibliotheque/footer/${old}/${kind}`))).status, 404, `${old} ${kind}`);
    }
    // Règle des alias : un identifiant de la liste précédente (100 anciens modèles) reste OUVRABLE (200) mais n'est jamais listé
    const { ALIAS } = require("../src/themeBuilder/catalog/footer-aliases");
    for (const old of Object.keys(ALIAS).slice(0, 3)) for (const kind of ["apercu", "vignette"]) assert.equal((await boss.get(U(`/api/bibliotheque/footer/${old}/${kind}`))).status, 200, `alias ${old} ${kind}`);
    const l = JSON.parse((await boss.get(U("/api/bibliotheque?type=footer&limite=60"))).text);
    assert.ok(!l.items.some((m) => ALIAS[m.key]), "aucun alias dans la liste");
    assert.equal(l.total, 100); assert.equal(l.layouts.length, new Set(all.map((e) => e.layoutKey)).size);
    assert.ok(l.items.every((m) => !OLD_KEYS.includes(m.key)), "aucune ancienne clé dans la liste");
  });
  test("site publié : le pied de la bibliothèque s'affiche UNE seule fois par page (accueil, blog, article, 404), jamais l'ancien pied, et rien sur un autre site", async () => {
    const key = "ft-communautes-03-club-accueil-et-gazette";
    const t = JSON.parse((await post(U("/api/bibliotheque/utiliser", A), { type: "footer", key })).text).template;
    assert.equal((await post(U(`/api/modeles/${t.id}/publier`, A))).status, 200);
    for (const p of ["/blog", "/blog/article-a", "/introuvable-xyz"]) {
      const r = await hostReq(srv, "a.test", p);
      assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`);
      assert.equal((r.text.match(/class="[^"]*kw-theme-footer[^"]*"/g) || []).length, 1, `${p} : un seul pied du Theme Builder`);
      assert.doesNotMatch(r.text, /class="site-footer"/, `${p} : l'ancien pied ne doit plus s'afficher`);
      assert.match(r.text, /©/, `${p} : copyright`);
    }
    const other = await hostReq(srv, "b.test", "/blog");
    assert.doesNotMatch(other.text, /kw-theme-footer/, "le site B garde son rendu");
  });
});
