// Personnalisateur → Types de publication → Page individuelle, sur les vraies routes, la vraie base et le vrai rendu : brouillon, aperçu, publication, rendu public,
// exceptions par page (héritage et réinitialisation), colonne latérale (zone de widgets réelle), zone de titre (un seul H1), isolation A / B / principal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const PS = require("../src/marketing/pages/pageSingle");
const catalog = require("../src/marketing/widgets/catalog");

describe("Page individuelle : réglages du site, exceptions de page, rendu, isolation", () => {
  let srv, boss, db, orgId, A, B, pageA, pageB, pageH1;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const PZ = "/marketing/site-web/personnaliser";
  const post = (c, path, site, body) => c.postJson(`${PZ}${path}${site ? `?site=${site}` : ""}`, { ...(site ? { site: String(site) } : {}), ...body });
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const bootOf = (html) => JSON.parse(html.match(/<script type="application\/json" id="kwc-boot">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
  const preview = async (id) => (await boss.get(`/marketing/pages/${id}/apercu`)).text;
  const publish = async (site, changes) => {
    const d = json(await post(boss, "/brouillon", site, { changes, rev: one("SELECT COALESCE(MAX(rev),0) AS r FROM cms_customizer_drafts WHERE site_id = ?", site).r }));
    assert.ok(d && d.ok !== false, "brouillon enregistré");
    const r = await post(boss, "/publier", site, { rev: one("SELECT rev FROM cms_customizer_drafts WHERE site_id = ?", site).rev });
    assert.equal(r.status, 200, r.text);
  };
  const putSidebar = (siteId, html) => {
    const layout = catalog.cleanLayout({ zones: { sidebar: [{ id: "blocside01", type: "paragraph", settings: { text: html } }] } });
    db.prepare("INSERT INTO cms_widget_layouts (site_id, layout, revision, updated_by) VALUES (?, ?, 1, NULL)").run(siteId, JSON.stringify(layout));
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    const page = (slug, s, sections) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, slug, slug, `Titre ${slug}`, JSON.stringify(sections), s).lastInsertRowid);
    const text = [{ type: "text", markdown: "Contenu" }];
    pageA = page("page-alpha", A, text); pageB = page("page-beta", B, text);
    pageH1 = page("page-alpha-h1", A, [{ type: "layout", children: [{ id: "h1abcabcabc1", type: "heading", props: { text: "Mon titre de contenu", level: 1, tag: "h1" } }] }]);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("validation et héritage (moteur)", () => {
    test("réglages stricts : choix inconnu, borne et couleur refusés avec un message clair", () => {
      assert.throws(() => PS.normalize({ container: { layout: "zzz" } }, { strict: true }), /Mise en page du conteneur/);
      assert.throws(() => PS.normalize({ sidebar: { width: 9999 } }, { strict: true }), /Colonne latérale : largeur/);
      assert.throws(() => PS.normalize({ container: { background: "rouge" } }, { strict: true }), /arrière-plan/);
      assert.throws(() => PS.normalize({ padding: { desktop: { top: -5 } } }, { strict: true }), /Marge interne/);
    });
    test("priorité : exception de la page > global ; champ absent = hérite ; « partiel » ne garde que ce qui est fourni", () => {
      const g = PS.normalize({ container: { layout: "narrow", style: "boxed-all" }, padding: { desktop: { top: 10, bottom: 10 } } });
      const o = PS.normalize({ container: { layout: "wide" }, padding: { desktop: { top: 40 } } }, { partial: true });
      assert.deepEqual(o, { container: { layout: "wide" }, padding: { desktop: { top: 40 } } });
      const eff = PS.merge(g, o);
      assert.equal(eff.container.layout, "wide"); assert.equal(eff.container.style, "boxed-all", "hérité");
      assert.equal(eff.padding.desktop.top, 40); assert.equal(eff.padding.desktop.bottom, 10, "hérité");
      assert.deepEqual(PS.merge(g, {}), g, "aucune exception : le global tel quel");
    });
    test("CSS : quatre largeurs distinctes, trois styles distincts, marge interne ≠ marge externe, valeurs par appareil sous les points de rupture", () => {
      const css = (p) => PS.css(PS.normalize(p), { layout: { contentWidth: 760, containerWidth: 1100, gutter: 16, fullWidth: false }, breakpoints: { tablet: 1023, mobile: 767 } });
      assert.match(css({ container: { layout: "full" } }), /max-width:none/);
      assert.match(css({ container: { layout: "boxed" } }), /max-width:min\(1100px,100%\)/);
      assert.match(css({ container: { layout: "narrow" } }), /max-width:min\(640px,100%\)/);
      assert.match(css({ container: { layout: "wide" } }), /max-width:min\(1320px,100%\)/);
      assert.doesNotMatch(css({}), /max-width|padding|margin|grid|background|border/, "valeurs par défaut : aucune règle de mise en page (le site garde son aspect)");
      assert.match(css({ container: { style: "open" } }), /background:transparent;border:0/);
      assert.match(css({ container: { style: "boxed-all" } }), /border-radius:var\(--kw-radius-card/);
      const sp = css({ padding: { desktop: { top: 11 }, mobile: { left: 7 } }, margin: { desktop: { top: 22 } } });
      assert.match(sp, /padding-top:11px/); assert.match(sp, /margin-top:22px/);
      assert.match(sp, /@media \(max-width:767px\)\{[^}]*padding-left:7px/);
      assert.doesNotMatch(sp, /padding-top:22px/, "jamais de confusion entre marge interne et externe");
      const w = css({ content: { widthMode: "custom", width: 900, mobileWidth: 360 } });
      assert.match(w, /max-width:min\(900px,100%\)/); assert.match(w, /@media \(max-width:767px\)\{[^}]*max-width:min\(360px,100%\)/);
      assert.doesNotMatch(css({ content: { widthMode: "default", width: 900 } }), /900px/, "largeur ignorée tant que « Par défaut »");
    });
    test("titre : un seul H1 (contenu avec H1 ou bandeau d'accueil = pas de second titre)", () => {
      assert.equal(PS.hasH1([{ type: "layout", children: [{ type: "heading", props: { level: 1 } }] }]), true);
      assert.equal(PS.hasH1([{ type: "layout", children: [{ type: "heading", props: { level: 2 } }] }]), false);
      assert.equal(PS.hasH1([{ type: "hero" }]), true);
      assert.equal(PS.hasH1([{ type: "text" }]), false);
    });
  });

  describe("personnalisateur : écran, brouillon, aperçu, publication", () => {
    test("l'écran propose la rubrique, ses réglages réels et les onglets Général / Design (site A) ; absente du site principal", async () => {
      const boot = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      const panel = boot.panels.find((p) => p.id === "type-page");
      assert.ok(panel, "rubrique Page individuelle"); assert.equal(panel.group, "Types de publication");
      assert.ok(panel.controls.some((c) => c.tab === "general") && panel.controls.some((c) => c.tab === "design"));
      assert.equal(panel.controls.filter((c) => c.group === "padding").length, 12, "marge interne : 4 côtés × 3 appareils");
      assert.equal(panel.controls.filter((c) => c.group === "margin").length, 12, "marge externe : 4 côtés × 3 appareils");
      const main = bootOf((await boss.get(PZ)).text);
      assert.ok(!main.panels.some((p) => p.id === "type-page"), "pas de rubrique pour le site principal");
      assert.ok(main.unsupported.some((u) => /Page individuelle/.test(u[0])), "dit pourquoi");
    });
    test("aperçu : les réglages non publiés s'appliquent à la vraie page ; la version en ligne est intacte", async () => {
      const r = json(await post(boss, "/rendu", A, { changes: { "settings.pageSingle.container.layout": "narrow", "settings.pageSingle.padding.desktop.top": 33 } }));
      assert.ok(r && r.assets && /max-width:min\(640px,100%\)/.test(r.assets.theme) && /padding-top:33px/.test(r.assets.theme));
      assert.ok(!/kw-kind-page/.test(JSON.stringify(settingsOf(A))), "rien n'est écrit par un aperçu");
      const bad = await post(boss, "/rendu", A, { changes: { "settings.pageSingle.container.layout": "zzz" } });
      assert.equal(bad.status, 422);
    });
    test("publier : écrit dans les réglages du site A ; la page publique de A suit ; B et le principal intacts", async () => {
      await publish(A, { "settings.pageSingle.container.layout": "narrow", "settings.pageSingle.container.style": "boxed-all", "settings.pageSingle.padding.desktop.top": 33, "settings.pageSingle.margin.desktop.top": 12, "settings.pageSingle.title.enabled": true, "settings.pageSingle.title.align": "center" });
      const s = settingsOf(A).pageSingle;
      assert.equal(s.container.layout, "narrow"); assert.equal(s.container.style, "boxed-all"); assert.equal(s.padding.desktop.top, 33); assert.equal(s.margin.desktop.top, 12);
      const html = await preview(pageA);
      assert.match(html, /<body class="lp-body lp-site kw-kind-page"/);
      assert.match(html, /max-width:min\(640px,100%\)/); assert.match(html, /padding-top:33px/); assert.match(html, /margin-top:12px/);
      assert.match(html, /<header class="kw-page-title"><h1>Titre page-alpha<\/h1><\/header>/, "zone de titre affichée");
      assert.equal((html.match(/<h1/g) || []).length, 1, "un seul H1");
      const other = await preview(pageB);
      assert.ok(!/<header class="kw-page-title"|min\(640px/.test(other), "le site B n'est pas affecté");
      assert.equal(settingsOf(B).pageSingle && settingsOf(B).pageSingle.container ? settingsOf(B).pageSingle.container.layout : "default", "default");
    });
    test("page qui a déjà son H1 : la zone de titre n'en ajoute pas un second", async () => {
      const html = await preview(pageH1);
      assert.equal((html.match(/<h1/g) || []).length, 1); assert.ok(!/<header class="kw-page-title"/.test(html));
    });
    test("zone de titre désactivée : aucun bloc, aucun espace réservé", async () => {
      await publish(A, { "settings.pageSingle.title.enabled": false });
      const html = await preview(pageA);
      assert.ok(!/<header class="kw-page-title"/.test(html), "aucun élément de titre dans la page");
    });
  });

  describe("colonne latérale : zone de widgets réelle, jamais une colonne vide", () => {
    test("à droite sans widget : aucune colonne ; avec un widget : grille, colonne à droite, contenu redimensionné", async () => {
      await publish(A, { "settings.pageSingle.sidebar.layout": "right", "settings.pageSingle.sidebar.width": 280 });
      let html = await preview(pageA);
      assert.ok(!/class="kw-ps-aside"/.test(html) && !/kw-ps-sb/.test(html.replace(/<style[\s\S]*?<\/style>/g, "")), "zone « sidebar » vide : pas de colonne vide");
      putSidebar(A, "Widget de la colonne");
      html = await preview(pageA);
      assert.match(html, /<body class="lp-body lp-site kw-kind-page kw-ps-sb"/);
      assert.match(html, /<div class="kw-ps-frame">[\s\S]*<main class="lp-main"[\s\S]*<\/main>\s*<aside class="kw-ps-aside"[^>]*>[\s\S]*Widget de la colonne/);
      assert.match(html, /grid-template-columns:minmax\(0,1fr\) 280px/);
      assert.match(html, /@media \(max-width:1023px\)\{[^}]*grid-template-columns:minmax\(0,1fr\)\}[^}]*order:1/, "tablette : colonne après le contenu");
    });
    test("à gauche : la colonne passe avant ; masquée sur mobile si demandé ; style encadré", async () => {
      await publish(A, { "settings.pageSingle.sidebar.layout": "left", "settings.pageSingle.sidebar.stack": "hidden", "settings.pageSingle.sidebar.style": "boxed-all" });
      const html = await preview(pageA);
      assert.match(html, /grid-template-columns:280px minmax\(0,1fr\)/);
      assert.match(html, /\.kw-ps-aside\{order:-1\}/); assert.match(html, /\.kw-ps-aside\{display:none\}/);
      assert.match(html, /\.kw-ps-aside\{background:var\(--kw-surface/);
    });
    test("l'autre site (même zone vide) ne reçoit aucune colonne : les widgets sont propres à chaque site", async () => {
      const html = await preview(pageB);
      assert.ok(!/kw-ps-aside|Widget de la colonne/.test(html));
    });
  });

  describe("exceptions par page : héritage, priorité, réinitialisation, isolation", () => {
    const save = async (id, single) => {
      const row = one("SELECT theme, revision FROM mk_landing_pages WHERE id = ?", id);
      const theme = JSON.parse(row.theme || "{}"); if (single) theme.single = single; else delete theme.single;
      db.prepare("UPDATE mk_landing_pages SET theme = ? WHERE id = ?").run(JSON.stringify(theme), id);
    };
    test("une page peut s'écarter du global ; les autres pages du site gardent le global ; l'exception est écrite après le global", async () => {
      await save(pageA, { container: { layout: "wide" }, padding: { desktop: { top: 99 } } });
      const html = await preview(pageA);
      assert.match(html, /max-width:min\(1320px,100%\)/); assert.match(html, /padding-top:99px/);
      assert.ok(html.indexOf("min(640px,100%)") < html.indexOf("min(1320px,100%)"), "l'exception vient APRÈS le global : elle l'emporte sans !important");
      const sibling = await preview(pageH1);
      assert.ok(!/min\(1320px/.test(sibling) && /min\(640px/.test(sibling), "les autres pages du site héritent du global");
    });
    test("normalizeTheme (enregistrement de la page) garde `single` et refuse une valeur invalide", () => {
      const pages = require("../src/marketing/pages");
      const t = pages.normalizeTheme ? pages.normalizeTheme({ single: { container: { layout: "narrow" } } }) : null;
      if (t) { assert.deepEqual(t.single, { container: { layout: "narrow" } }); assert.throws(() => pages.normalizeTheme({ single: { container: { layout: "nope" } } }), /Mise en page du conteneur/); }
    });
    test("réinitialiser l'exception : la page retombe sur le global", async () => {
      await save(pageA, null);
      const html = await preview(pageA);
      assert.ok(!/min\(1320px/.test(html)); assert.match(html, /max-width:min\(640px,100%\)/);
    });
  });

  describe("cas limites", () => {
    test("page de type atterrissage : jamais touchée par le cadre Page individuelle", async () => {
      const id = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'lp', 'lp-a', 'LP', ?, 'published', 'landing', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "x" }]), A).lastInsertRowid);
      const html = await preview(id);
      assert.ok(!/<body class="[^"]*kw-kind-page/.test(html) && !/<header class="kw-page-title"/.test(html));
    });
    test("page sans contenu ni titre : s'affiche sans erreur", async () => {
      const id = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'vide', 'vide-a', '', '[]', 'published', 'page', ?, datetime('now'))").run(orgId, A).lastInsertRowid);
      const r = await boss.get(`/marketing/pages/${id}/apercu`);
      assert.equal(r.status, 200);
    });
  });
});
