// Apparence → Thèmes : bibliothèque de thèmes complets, sur les vraies routes, la vraie base, de vrais comptes.
// Galerie (recherche, catégories, styles, état, tri, pagination), fiche, aperçu COMPLET isolé, visuels, installation, activation, pages de démonstration (brouillons),
// protection des contenus, isolation entre sites et permissions. Aucune donnée de production.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const library = require("../src/marketing/themes/library");

describe("Thèmes : bibliothèque, aperçu complet, installation et activation par site", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const TH = "/marketing/site-web/themes", SP = "/marketing/site-web/sites";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
  const decode = (t) => String(t).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  const cardsOf = (html) => [...(html.includes("data-th-grid") ? html.slice(html.indexOf("data-th-grid")) : html).matchAll(/data-th-card[\s\S]*?<h3><a href="[^"]*\/([a-z0-9-]+)\/details[^"]*"/g)].map((m) => m[1]);
  const specs = library.load().specs;
  const sample = (n) => specs.filter((_, i) => i % Math.max(1, Math.floor(specs.length / n)) === 0).slice(0, n);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer"); outsider = await newStudent(srv);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Page existante', 'existante', 'Page existante', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "Mon contenu à préserver" }]), A);
  });
  after(() => { db.close(); return srv.stop(); });

  test("galerie : nombre réel de thèmes, catégories, aperçus réels, état par site, aucune carte factice", async () => {
    const html = decode((await adminA.get(`${TH}?site=${A}`)).text);
    assert.match(html, new RegExp(`mk-th-count"[^>]*>${specs.length}<`));
    assert.match(html, /Rechercher un thème/); assert.match(html, /Tous les styles/); assert.match(html, /Pertinence/);
    const cards = cardsOf(html);
    assert.ok(cards.length >= 1 && cards.length <= 28, `une page de résultats raisonnable (${cards.length})`);
    for (const k of cards) assert.ok(library.has(k) || ["kolakisa", "ocean", "ardoise", "savane", "foret", "editorial"].includes(k), `thème réel : ${k}`);
    assert.match(html, /\/img\/theme-previews\/[a-z0-9-]+-(?:home|card)\.webp/);
    assert.match(html, /loading="lazy"/);
    for (const c of library.CATEGORIES.slice(0, 3)) assert.match(html, new RegExp(c.label.replace(/[()]/g, "\\$&").replace(/ et /, " et ")));
  });

  test("recherche, catégorie, style, affichage et tri : filtres côté serveur, cohérents avec le catalogue", async () => {
    const first = specs[0];
    const bySearch = decode((await adminA.get(`${TH}?site=${A}&q=${encodeURIComponent(first.name)}`)).text);
    assert.ok(cardsOf(bySearch).includes(first.key), "la recherche par nom retrouve le thème");
    const accentless = decode((await adminA.get(`${TH}?site=${A}&q=${encodeURIComponent(first.siteType.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())}`)).text);
    assert.ok(cardsOf(accentless).includes(first.key), "recherche insensible à la casse et aux accents (type de site)");
    const none = decode((await adminA.get(`${TH}?site=${A}&q=zzzintrouvablezzz`)).text);
    assert.match(none, /Aucun thème ne correspond/); assert.equal(cardsOf(none).length, 0);
    const cat = first.category, inCat = specs.filter((s) => s.category === cat).length;
    const byCat = decode((await adminA.get(`${TH}?site=${A}&categorie=${cat}&taille=60`)).text);
    assert.ok(cardsOf(byCat).length >= 1 && cardsOf(byCat).length <= Math.max(inCat, 24));
    for (const k of cardsOf(byCat)) assert.equal(library.specOf(k) ? library.specOf(k).category : cat, cat, `${k} appartient à la catégorie`);
    const style = first.tags[0], byStyle = decode((await adminA.get(`${TH}?site=${A}&style=${style}`)).text);
    assert.ok(cardsOf(byStyle).every((k) => !library.specOf(k) || library.specOf(k).tags.includes(style)));
    const byName = cardsOf(decode((await adminA.get(`${TH}?site=${A}&tri=name`)).text));
    const nameOf = (k) => (library.specOf(k) ? library.specOf(k).name : k === "kolakisa" ? "Kolakisa — d'origine" : k);
    assert.deepEqual(byName, [...byName].sort((a, b) => nameOf(a).localeCompare(nameOf(b), "fr")));
    const bogus = decode((await adminA.get(`${TH}?site=${A}&categorie=pirate&style=pirate&etat=pirate&tri=pirate&page=-5`)).text);
    assert.ok(cardsOf(bogus).length >= 1, "valeurs inconnues ignorées : la galerie reste affichée");
    if (specs.length > 24) {
      const p1 = cardsOf(decode((await adminA.get(`${TH}?site=${A}`)).text)), p2 = cardsOf(decode((await adminA.get(`${TH}?site=${A}&page=2`)).text));
      assert.ok(p2.length >= 1 && !p2.some((k) => p1.includes(k)), "la page 2 ne répète pas la page 1");
    }
  });

  test("fragment (recherche instantanée) : mêmes résultats sans le cadre de la page", async () => {
    const frag = await adminA.get(`${TH}?site=${A}&q=${encodeURIComponent(specs[0].name)}&fragment=1`);
    assert.equal(frag.status, 200); assert.ok(!/<html/i.test(frag.text) && /data-th-card/.test(frag.text));
    assert.match(String(frag.headers.get("cache-control")), /no-store/);
  });

  test("aperçus et visuels : site de démonstration complet et isolé, page par page ; visuels originaux ; jamais de contenu du site", async () => {
    for (const s of sample(6)) {
      for (const p of s.pages) {
        const r = await adminA.get(`${TH}/${s.key}/demo/${p.key}?site=${A}`);
        assert.equal(r.status, 200, `${s.key}/${p.key}`);
        assert.ok(!r.text.includes("Mon contenu à préserver") && !r.text.includes("Page existante"), "aucun contenu du site dans l'aperçu isolé");
        assert.match(decode(r.text), new RegExp(s.brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "la marque fictive du thème est affichée");
        assert.match(r.text, /Site de démonstration/);
        assert.match(String(r.headers.get("x-robots-tag")), /noindex/);
      }
      const art = await anon.get(`/themes-art/${s.key}/hero.svg`);
      assert.equal(art.status, 200); assert.match(art.headers.get("content-type"), /image\/svg\+xml/); assert.match(art.text, /^<svg /); assert.ok(!/<script|onload=|href="http/i.test(art.text));
    }
    const s = specs[0];
    assert.equal((await anon.get(`/themes-art/${s.key}/inconnu.svg`)).status, 404);
    assert.equal((await anon.get(`/themes-art/pas-un-theme/hero.svg`)).status, 404);
    assert.equal((await anon.get(`/themes-art/${s.key}/hero-99.svg`)).status, 404);
    const etag = (await anon.get(`/themes-art/${s.key}/hero.svg`)).headers.get("etag");
    assert.equal((await anon.get(`/themes-art/${s.key}/hero.svg`, { headers: { "If-None-Match": etag } })).status, 304);
    assert.equal((await adminA.get(`${TH}/${s.key}/demo/page-inconnue?site=${A}`)).status, 404);
    assert.equal((await adminA.get(`${TH}/pas-un-theme/demo/accueil?site=${A}`)).status, 404);
    assert.equal((await anon.get(`${TH}/${s.key}/demo/accueil`)).status, 302, "anonyme : redirigé vers la connexion");
    assert.equal((await outsider.get(`${TH}/${s.key}/demo/accueil?site=${A}`)).status, 403);
  });

  test("page d'aperçu : pages du thème, appareils, état réel et bouton d'action distinct ; liens internes du site de démonstration", async () => {
    const s = specs[0];
    const r = decode((await adminA.get(`${TH}/${s.key}/apercu?site=${A}`)).text);
    for (const p of s.pages) assert.ok(r.includes(`data-tp-page="${p.key}"`), `onglet ${p.key}`);
    assert.match(r, /data-tp-width="390px"/); assert.match(r, /Ordinateur/); assert.match(r, /Tablette/); assert.match(r, /Mobile/);
    assert.match(r, /demo\/accueil\?site=/);
    assert.match(r, /Installer/, "thème disponible : « Installer », jamais « Utiliser » avant l'installation");
    const demo = (await adminA.get(`${TH}/${s.key}/demo/accueil?site=${A}`)).text;
    assert.ok(new RegExp(`href="${TH}/${s.key}/demo/${s.pages[1].key}\\?site=${A}"`).test(demo), "les liens du menu restent dans l'aperçu");
    assert.match((await adminA.get(`${TH}/${s.key}/apercu?site=${A}&mode=site`)).text, /Aperçu : /, "l'aperçu avec le contenu du site reste disponible");
  });

  test("fiche : aperçus, pages, couleurs, polices, compatibilité, crédits et licences", async () => {
    const s = specs[0];
    const r = decode((await adminA.get(`${TH}/${s.key}/details?site=${A}`)).text);
    assert.match(r, new RegExp(s.name)); assert.match(r, /Compatible avec ce Kolakisa/); assert.match(r, /Crédits et licences/); assert.match(r, /illustrations originales/);
    assert.match(r, /OFL/); assert.match(r, /Changer de thème ne supprime jamais/);
    for (const p of s.pages) assert.ok(r.includes(p.name), `page ${p.name}`);
    assert.equal((await adminA.get(`${TH}/pas-un-theme/details?site=${A}`)).status, 404);
  });

  test("installer puis utiliser : état réel par site, activation, rendu, contenus préservés, B et le principal inchangés", async () => {
    const s = specs[0];
    const inst = await adminA.post(`${TH}/installer`, { key: s.key, site: String(A) });
    assert.equal(inst.status, 302);
    assert.match(flashOf((await adminA.get(inst.location)).text), /installé/);
    assert.ok(one("SELECT 1 FROM cms_themes WHERE theme_key = ? AND site_id = ?", s.key, A));
    assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = ? AND COALESCE(site_id,0) <> ?", s.key, A).n, 0, "installé sur A seulement");
    assert.match(decode((await adminA.get(`${TH}/${s.key}/apercu?site=${A}`)).text), /Utiliser ce thème/);
    const before = { pages: one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", A).n, tokensB: one("SELECT tokens FROM mk_sites WHERE id = ?", B).tokens };
    const act = await adminA.post(`${TH}/${s.key}/activer`, { site: String(A) });
    assert.match(flashOf((await adminA.get(act.location)).text), new RegExp(`${s.name}.*activé`));
    const tokensA = JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens);
    assert.equal(tokensA.colors.primary, s.tokens.colors.primary.toLowerCase());
    assert.equal(tokensA.fonts.heading, s.tokens.fonts.heading);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", A).n, before.pages, "aucune page ajoutée ni supprimée");
    assert.equal(one("SELECT sections FROM mk_landing_pages WHERE slug = 'existante'").sections.includes("Mon contenu à préserver"), true);
    assert.equal(one("SELECT tokens FROM mk_sites WHERE id = ?", B).tokens, before.tokensB, "le site B n'a pas changé");
    const gallery = decode((await adminA.get(`${TH}?site=${A}`)).text);
    assert.match(gallery, /Thème actif/); assert.match(gallery, /Personnaliser/);
    const galleryB = decode((await adminA.get(`${TH}?site=${B}`)).text);
    assert.equal(adminA.cookies.size > 0, true);
    assert.ok(!/Thème actif[\s\S]{0,200}/.test(galleryB) || !galleryB.includes(`${s.name}</h2>`), "B n'affiche pas ce thème comme actif");
    const back = await adminA.post(`${TH}/revenir`, { site: String(A) });
    assert.match(flashOf((await adminA.get(back.location)).text), /Retour au thème/);
  });

  test("pages de démonstration : brouillons ajoutés sans rien remplacer ; menu en option ; droits requis ; B intact", async () => {
    const s = specs[1];
    await adminA.post(`${TH}/installer`, { key: s.key, site: String(A) });
    const pagesBefore = all("SELECT id, name, status, sections FROM mk_landing_pages WHERE site_id = ? ORDER BY id", A);
    const r = await adminA.post(`${TH}/${s.key}/activer`, { site: String(A), demo: "1", menu: "1" });
    const msg = flashOf((await adminA.get(r.location)).text);
    assert.match(msg, /pages de démonstration ont été ajoutées en brouillon/); assert.match(msg, /menu/);
    const created = all("SELECT id, name, status, kind FROM mk_landing_pages WHERE site_id = ? AND id > ? ORDER BY id", A, pagesBefore[pagesBefore.length - 1].id);
    assert.equal(created.length, library.specOf(s.key).pages.length);
    assert.ok(created.every((p) => p.status === "draft" && p.kind === "page"), "toutes en brouillon : rien n'est publié");
    assert.ok(created.every((p) => p.name.endsWith(`· ${s.name}`)));
    const after = all("SELECT id, name, status, sections FROM mk_landing_pages WHERE id <= ? AND site_id = ? ORDER BY id", pagesBefore[pagesBefore.length - 1].id, A);
    assert.deepEqual(after, pagesBefore, "les pages existantes sont strictement identiques");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", B).n, 0, "aucune page ajoutée à B");
    assert.ok(one("SELECT 1 FROM nav_menus WHERE site_id = ? AND name LIKE ?", A, `${s.name} — menu%`));
    // 2e ajout : noms libres, aucun écrasement
    const again = await adminA.post(`${TH}/${s.key}/demo`, { site: String(A) });
    assert.match(flashOf((await adminA.get(again.location)).text), /pages de démonstration ajoutées/);
    const names = all("SELECT name FROM mk_landing_pages WHERE site_id = ?", A).map((x) => x.name);
    assert.equal(new Set(names.map((n) => n.toLowerCase())).size, names.length, "aucun doublon de nom");
    // droits
    const v = await viewerA.post(`${TH}/${s.key}/demo`, { site: String(A) }); assert.equal(v.status, 403);
    const o = await outsider.post(`${TH}/${s.key}/demo`, { site: String(A) }); assert.equal(o.status, 403);
  });

  test("droits et isolation : lecteur sans action d'écriture, accès limité à un site, anonyme redirigé, site inconnu 404", async () => {
    const s = specs[2];
    assert.equal((await viewerA.get(`${TH}?site=${A}`)).status, 200);
    assert.equal((await viewerA.post(`${TH}/installer`, { key: s.key, site: String(A) })).status, 403);
    assert.equal((await viewerA.post(`${TH}/${s.key}/activer`, { site: String(A) })).status, 403);
    assert.equal((await adminA.post(`${TH}/installer`, { key: s.key, site: String(B) })).status, 403, "un administrateur de A ne touche pas à B");
    assert.equal((await adminA.get(`${TH}/${s.key}/apercu?site=${B}`)).status, 403);
    assert.equal((await adminA.get(`${TH}/${s.key}/demo/accueil?site=${B}`)).status, 403);
    assert.equal((await anon.get(`${TH}?site=${A}`)).status, 302);
    assert.equal((await boss.get(`${TH}?site=999999`)).status, 404);
    assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = ? AND site_id = ?", s.key, B).n, 0);
  });
});
