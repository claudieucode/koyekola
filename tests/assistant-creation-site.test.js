// Programme 20.6 — assistant de création de site. Vrai serveur, vraie base d'essai : chaque scénario (A à L) passe par les adresses réelles.
// Aucun fournisseur externe n'est appelé ; aucune transaction financière n'a lieu ; aucune publication sans confirmation.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const catalog = require("../src/siteWizard/catalog");
const wizard = require("../src/siteWizard");

describe("assistant de création : catalogues (aucune promesse hors de ce qui existe)", () => {
  test("chaque page proposée utilise un gabarit réel, chaque pack conseillé existe, chaque module est dans le registre", () => {
    const tpl = new Set(require("../src/marketing/pages/templates").catalog().map((t) => t.key));
    const packs = new Set(require("../src/marketing/pages/sitePacks").PACKS.map((p) => p.key));
    const modules = require("../src/marketing/siteModules").MODULES;
    for (const c of catalog.CATEGORIES) {
      assert.ok(catalog.ICONS[c.icon], `icône de ${c.key}`);
      for (const p of c.pages) assert.ok(!p.template || tpl.has(p.template), `${c.key}/${p.key} : gabarit ${p.template}`);
      assert.ok(!c.pack || packs.has(c.pack), `${c.key} : pack ${c.pack}`);
      for (const m of c.modules) assert.ok(catalog.FEATURES[m], `${c.key} : fonctionnalité ${m}`);
      assert.ok(c.pages.some((p) => p.home), `${c.key} : une page d'accueil`);
    }
    for (const f of Object.values(catalog.FEATURES)) if (f.kind === "module") assert.ok(modules[f.module], `module ${f.module}`);
    assert.ok(catalog.CATEGORIES.length >= 18);
  });
  test("pays : fuseau IANA, devise ISO et langue valides ; formats régionaux produits par Intl, sans valeur américaine imposée", () => {
    for (const [code, c] of Object.entries(catalog.COUNTRIES)) {
      assert.doesNotThrow(() => new Intl.DateTimeFormat("en", { timeZone: c.tz }), `${code} fuseau`);
      assert.ok(catalog.CURRENCIES.includes(c.currency), `${code} devise`);
      assert.ok(catalog.LANGUAGES[c.lang], `${code} langue`);
    }
    const fr = wizard.formats({ country: "FR", lang: "fr", currency: "EUR", timezone: "Europe/Paris" }), us = wizard.formats({ country: "US", lang: "en", currency: "USD", timezone: "America/New_York" });
    assert.match(fr.date, /mars/); assert.match(us.date, /March/);
    assert.notEqual(fr.money, us.money);
  });
});

describe("assistant de création de site", () => {
  let srv, boss, db;
  const row = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const W = (id, rest = "") => `/marketing/site-web/sites/${id}/assistant${rest}`;
  const start = async (form) => { const r = await boss.post("/marketing/site-web/assistant/demarrer", form); const m = /sites\/(\d+)\/assistant/.exec(r.location || ""); return { r, id: m ? Number(m[1]) : null }; };
  const flash = async (client, url) => (await client.get(url)).text;
  // Les noms de pages sont uniques dans l'organisation : « Accueil (2) » vaut « Accueil »
  const base = (rows) => rows.map((p) => p.name.replace(/ \(\d+\)$/, "")).sort();
  const m_count = (id) => row("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = ? AND module = 'lms' AND enabled = 1", id).n;
  const idOf = (c) => row("SELECT id FROM users WHERE email = ?", c.email).id;

  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    boss = await loginInstructor(srv); db = srv.db();
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'accueil de l'assistant s'affiche avec les trois modes, les 18 types et les modèles de la bibliothèque", async () => {
    const r = await boss.get("/marketing/site-web/assistant");
    assert.equal(r.status, 200);
    for (const t of ["Site vierge", "Modèle professionnel", "Boutique en ligne", "Site vitrine", "Plateforme de formation", "Hôtel et hébergement", "Formation en ligne"]) assert.ok(r.text.includes(t), t);
    assert.match(r.text, /panier de produits n'est pas encore disponible|n'existe pas encore/);
  });

  test("A. site vierge : un brouillon avec une seule page d'accueil, rien de publié, progression enregistrée", async () => {
    const { r, id } = await start({ mode: "blank", category: "vitrine", name: "Site A vierge" });
    assert.equal(r.status, 302); assert.ok(id);
    const site = row("SELECT * FROM mk_sites WHERE id = ?", id);
    assert.equal(site.status, "active"); assert.equal(site.site_type, "vitrine");
    const pages = all("SELECT name, status FROM mk_landing_pages WHERE site_id = ?", id);
    assert.equal(pages.length, 1); assert.match(pages[0].name, /^Accueil/); assert.equal(pages[0].status, "draft");
    assert.ok(site.home_page_id);
    const w = row("SELECT * FROM mk_site_wizard WHERE site_id = ?", id);
    assert.equal(w.mode, "blank"); assert.equal(w.category, "vitrine");
    const page = await boss.get(W(id));
    assert.equal(page.status, 200); assert.match(page.text, /Informations générales/); assert.match(page.text, /role="progressbar"/);
  });

  test("B. modèle professionnel : import par la Template Library (pages, menu), tout en brouillon", async () => {
    const { id } = await start({ mode: "template", category: "services", name: "Site B modèle", pack: "service-professionnel" });
    assert.ok(id);
    const pages = all("SELECT name, status FROM mk_landing_pages WHERE site_id = ?", id);
    assert.ok(pages.length >= 4); assert.ok(pages.every((p) => p.status !== "published"));
    assert.ok(row("SELECT home_page_id FROM mk_sites WHERE id = ?", id).home_page_id);
    assert.equal(row("SELECT COUNT(*) n FROM nav_menus WHERE site_id = ?", id).n, 1);
    assert.equal(row("SELECT COUNT(*) n FROM cms_template_imports WHERE site_id = ?", id).n, 1);
    const refused = await boss.post("/marketing/site-web/assistant/demarrer", { mode: "template", category: "services", name: "Sans modèle", pack: "inconnu" });
    assert.equal(row("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Sans modèle'").n, 0, "un modèle inconnu ne crée aucun site");
    assert.equal(refused.status, 302);
  });

  test("C. boutique : honnête sur ce qui existe ; le module Commerce n'est PAS activé tout seul ; le panier n'est pas proposé", async () => {
    const { id } = await start({ mode: "shop", name: "Boutique C" });
    assert.ok(id);
    assert.equal(row("SELECT site_type FROM mk_sites WHERE id = ?", id).site_type, "boutique");
    assert.equal(row("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = ?", id).n, 0);
    const pages = await flash(boss, W(id, "?etape=pages"));
    assert.match(pages, /non disponibles/); assert.doesNotMatch(pages, /value="panier"|>Panier</);
    const created = await boss.post(W(id, "/pages/proposees"), { keys: ["accueil", "catalogue"] });
    assert.equal(created.status, 302);
    assert.deepEqual(base(all("SELECT name FROM mk_landing_pages WHERE site_id = ?", id)), ["Accueil", "Catalogue"]);
    const f = await flash(boss, W(id, "?etape=fonctions"));
    assert.match(f, /Commerce \(vente de formations\)/); assert.match(f, /compte de paiement \(Stripe\)/);
    await boss.post(W(id, "/fonctions/commerce"), { etat: "activer" });
    assert.equal(row("SELECT enabled FROM mk_site_modules WHERE site_id = ? AND module = 'commerce'", id).enabled, 1);
    assert.equal(row("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = ? AND module <> 'commerce'", id).n, 0, "aucun autre module activé");
  });

  test("D. site éducatif : structure proposée (formations, enseignants, blog, contact) créée par les services existants", async () => {
    const { id } = await start({ mode: "blank", category: "education", name: "École D" });
    const r = await boss.post(W(id, "/pages/proposees"), { keys: ["formations", "enseignants", "blog", "contact"] });
    assert.equal(r.status, 302);
    assert.deepEqual(base(all("SELECT name FROM mk_landing_pages WHERE site_id = ?", id)), ["Accueil", "Blog", "Contact", "Enseignants", "Formations"]);
    const f = await flash(boss, W(id, "?etape=fonctions"));
    assert.match(f, /Formations en ligne/);
    // Le module « Formations » est ouvert aux sites (LMS multi-sites) : activable par l'équipe, jamais activé seul ; s'il ne l'était pas, l'activation serait refusée
    const open = require("../src/marketing/siteModules").MODULES.lms.ready;
    assert.equal(m_count(id), 0, "jamais activé tout seul");
    await boss.post(W(id, "/fonctions/lms"), { etat: "activer" });
    assert.equal(m_count(id), open ? 1 : 0, open ? "module ouvert aux sites : activation explicite possible" : "un module non ouvert aux sites ne s'active pas");
    assert.match(await flash(boss, W(id, "?etape=fonctions")), /Réservation[\s\S]*Non disponible/);
  });

  test("E. identité visuelle : orientation, couleurs, polices écrites dans les styles du site ; valeurs invalides refusées", async () => {
    const { id } = await start({ mode: "blank", category: "vitrine", name: "Identité E" });
    const r = await boss.post(W(id, "/identite"), { style: "corporate", color_primary: "#112233", font_heading: "georgia" });
    assert.equal(r.status, 302);
    const t = JSON.parse(row("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
    assert.equal(t.colors.primary, "#112233"); assert.equal(t.fonts.heading, "georgia");
    assert.equal(t.colors.secondary, require("../src/services/stylePalettes").PALETTES.find((p) => p.key === "marine").colors.secondary);
    await boss.post(W(id, "/identite"), { color_primary: "rouge" });
    assert.equal(JSON.parse(row("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens).colors.primary, "#112233", "une couleur invalide ne remplace rien");
    await boss.post(W(id, "/identite"), { font_body: "police-inconnue" });
    assert.equal(JSON.parse(row("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens).fonts.body, "figtree");
    assert.equal(JSON.parse(row("SELECT steps FROM mk_site_wizard WHERE site_id = ?", id).steps).identite, "done");
  });

  test("F. pages : ajout, renommage, retrait (corbeille), page d'accueil, ordre et menu", async () => {
    const { id } = await start({ mode: "blank", category: "vitrine", name: "Pages F" });
    const home = row("SELECT home_page_id h FROM mk_sites WHERE id = ?", id).h;
    await boss.post(W(id, "/pages/action"), { action: "add", name: "Nos tarifs F", template: "tarifs" });
    await boss.post(W(id, "/pages/action"), { action: "add", name: "Contact F", template: "contact" });
    const tarifs = row("SELECT id FROM mk_landing_pages WHERE site_id = ? AND name = 'Nos tarifs F'", id).id, contact = row("SELECT id FROM mk_landing_pages WHERE site_id = ? AND name = 'Contact F'", id).id;
    await boss.post(W(id, "/pages/action"), { action: "rename", pageId: tarifs, name: "Tarifs 2026" });
    assert.equal(row("SELECT name FROM mk_landing_pages WHERE id = ?", tarifs).name, "Tarifs 2026");
    await boss.post(W(id, "/pages/action"), { action: "remove", pageId: home });
    assert.equal(row("SELECT archived_at FROM mk_landing_pages WHERE id = ?", home).archived_at, null, "la page d'accueil ne part pas à la corbeille");
    await boss.post(W(id, "/pages/action"), { action: "home", pageId: tarifs });
    assert.equal(row("SELECT home_page_id h FROM mk_sites WHERE id = ?", id).h, tarifs);
    await boss.post(W(id, "/pages/action"), { action: "remove", pageId: contact });
    assert.ok(row("SELECT archived_at FROM mk_landing_pages WHERE id = ?", contact).archived_at, "page retirée = corbeille, récupérable");
    await boss.post(W(id, "/pages/action"), { action: "order", ids: `${tarifs},${home}` });
    await boss.post(W(id, "/pages/action"), { action: "nav", nav: [String(home), String(tarifs)] });
    const m = await boss.post(W(id, "/pages/menu"), {});
    assert.equal(m.status, 302);
    const items = all("SELECT i.object_id FROM nav_items i JOIN nav_menus m ON m.id = i.menu_id WHERE m.site_id = ? ORDER BY i.position, i.id", id).map((x) => x.object_id);
    assert.deepEqual(items, [tarifs, home]);
    const ok = await boss.post(W(id, "/pages/terminer"), { revision: row("SELECT revision r FROM mk_site_wizard WHERE site_id = ?", id).r });
    assert.equal(ok.status, 302);
    assert.equal(JSON.parse(row("SELECT steps FROM mk_site_wizard WHERE site_id = ?", id).steps).pages, "done");
  });

  test("G. sauvegarde automatique et reprise : brouillon de formulaire, conflit détecté, reprise depuis la liste", async () => {
    const { id } = await start({ mode: "blank", category: "blog", name: "Reprise G" });
    let rev = row("SELECT revision r FROM mk_site_wizard WHERE site_id = ?", id).r;
    const a = await boss.postJson(W(id, "/brouillon"), { step: "infos", fields: { name: "Reprise G", city: "Lyon", country: "BE" }, revision: rev });
    assert.equal(a.status, 200); assert.equal(JSON.parse(a.text).ok, true);
    const stale = await boss.postJson(W(id, "/brouillon"), { step: "infos", fields: { city: "Paris" }, revision: rev });
    assert.equal(stale.status, 409, "révision périmée : rien n'est écrasé en silence");
    assert.equal((await boss.postJson(W(id, "/brouillon"), { step: "pages", fields: {}, revision: rev + 1 })).status, 422);
    const back = await boss.get(W(id, "?etape=infos"));
    assert.match(back.text, /value="Lyon"/); assert.match(back.text, /<option value="BE"[^>]* selected/);
    assert.equal(row("SELECT name FROM mk_sites WHERE id = ?", id).name, "Reprise G", "le brouillon ne modifie pas le site");
    const hub = await boss.get("/marketing/site-web/assistant");
    assert.match(hub.text, /Reprise G/); assert.ok(hub.text.includes(`/sites/${id}/assistant`));
  });

  test("I. pays, langues et devises : les valeurs par pays sont proposées, enregistrées, et validées côté serveur", async () => {
    for (const [code, cur, tz] of [["CD", "CDF", "Africa/Kinshasa"], ["GB", "GBP", "Europe/London"], ["CH", "CHF", "Europe/Zurich"]]) {
      const { id } = await start({ mode: "blank", category: "autre", name: `Pays ${code}` });
      const rev = row("SELECT revision r FROM mk_site_wizard WHERE site_id = ?", id).r;
      const r = await boss.post(W(id, "/infos"), { name: `Pays ${code}`, country: code, revision: rev, email: "contact@exemple.fr", phone: "+243 81 000 00 00", city: "Ville" });
      assert.equal(r.status, 302);
      const infos = JSON.parse(row("SELECT data FROM mk_site_wizard WHERE site_id = ?", id).data).infos;
      assert.equal(infos.currency, cur); assert.equal(infos.timezone, tz); assert.equal(infos.country, code);
      assert.equal(require("../src/seo/settings").storedFor(id).org_city === undefined || require("../src/seo/settings").storedFor(id).org_city === "Ville", true);
    }
    const { id } = await start({ mode: "blank", category: "autre", name: "Pays invalide" });
    const rev = () => row("SELECT revision r FROM mk_site_wizard WHERE site_id = ?", id).r;
    for (const bad of [{ country: "ZZ" }, { country: "FR", timezone: "Mars/Olympus" }, { country: "FR", currency: "XXX" }, { country: "FR", email: "pas-un-mail" }, { country: "FR", lang: "klingon" }]) {
      await boss.post(W(id, "/infos"), { name: "Pays invalide", revision: rev(), ...bad });
      assert.equal(JSON.parse(row("SELECT data FROM mk_site_wizard WHERE site_id = ?", id).data).infos, undefined, `refusé : ${JSON.stringify(bad)}`);
    }
  });

  test("H. aperçu ordinateur, tablette, mobile : le moteur de rendu des pages, aux trois largeurs, avec alertes non bloquantes", async () => {
    const { id } = await start({ mode: "template", category: "entreprise", name: "Aperçu H", pack: "entreprise" });
    const pageId = row("SELECT home_page_id h FROM mk_sites WHERE id = ?", id).h;
    for (const [d, w] of [["ordinateur", 1280], ["tablette", 820], ["mobile", 390]]) {
      const r = await boss.get(W(id, `?etape=apercu&appareil=${d}`));
      assert.equal(r.status, 200);
      assert.ok(r.text.includes(`style="width:${w}px"`), d); assert.ok(r.text.includes(`/marketing/pages/${pageId}/apercu`));
    }
    const r = await boss.get(W(id, "?etape=apercu"));
    assert.match(r.text, /d(?:'|&#39;)exemple entre crochets/, "les contenus d'exemple sont signalés");
    assert.equal((await boss.get(`/marketing/pages/${pageId}/apercu`)).status, 200, "le cadre charge le vrai aperçu");
  });

  describe("K. isolation entre sites et droits", () => {
    let A, B, adminA, viewerA, adminB;
    before(async () => {
      A = (await start({ mode: "blank", category: "vitrine", name: "Isolation A" })).id; B = (await start({ mode: "blank", category: "vitrine", name: "Isolation B" })).id;
      const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
      adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    });
    test("un administrateur du site A voit et modifie A, jamais B (lecture, écriture, sauvegarde automatique, publication)", async () => {
      assert.equal((await adminA.get(W(A))).status, 200);
      for (const p of [W(B), W(B, "?etape=pages"), W(B, "?etape=publication")]) assert.ok([403, 404].includes((await adminA.get(p)).status), p);
      const before = row("SELECT name FROM mk_sites WHERE id = ?", B).name;
      const infosB = await adminA.post(W(B, "/infos"), { name: "Piraté", country: "FR", revision: 0 });
      assert.ok([302, 403, 404].includes(infosB.status));
      assert.equal(row("SELECT name FROM mk_sites WHERE id = ?", B).name, before);
      assert.ok([403, 404].includes((await adminA.postJson(W(B, "/brouillon"), { step: "infos", fields: { name: "X" }, revision: 0 })).status));
      const pageB = row("SELECT id FROM mk_landing_pages WHERE site_id = ?", B).id;
      await adminA.post(W(B, "/publier"), { pages: [String(pageB)], confirmer: "oui" });
      assert.notEqual(row("SELECT status FROM mk_landing_pages WHERE id = ?", pageB).status, "published");
      // une page de B désignée depuis l'adresse de A est refusée
      await adminA.post(W(A, "/pages/action"), { action: "rename", pageId: pageB, name: "Détournée" });
      assert.notEqual(row("SELECT name FROM mk_landing_pages WHERE id = ?", pageB).name, "Détournée");
      await adminA.post(W(A, "/pages/action"), { action: "home", pageId: pageB });
      assert.notEqual(row("SELECT home_page_id h FROM mk_sites WHERE id = ?", A).h, pageB);
      await adminA.post(W(A, "/contenus/" + pageB), { title: "Détourné" });
      assert.notEqual(row("SELECT name FROM mk_landing_pages WHERE id = ?", pageB).name, "Détournée");
    });
    test("la création d'un site est réservée à l'équipe ; l'accueil de l'assistant n'expose que ce qui est autorisé", async () => {
      const n = row("SELECT COUNT(*) n FROM mk_sites").n;
      await adminA.post("/marketing/site-web/assistant/demarrer", { mode: "blank", category: "autre", name: "Création interdite" });
      assert.equal(row("SELECT COUNT(*) n FROM mk_sites").n, n);
      const hub = await adminA.get("/marketing/site-web/assistant");
      assert.ok([200, 302, 403, 404].includes(hub.status));
      assert.doesNotMatch(hub.text, /Isolation B/);
      assert.equal(wizard.listInProgress({ db, organizationId: 1, siteScope: A }).every((c) => c.siteId === A), true);
    });
    test("lecteur : consultation seulement ; visiteur anonyme : renvoyé vers la connexion", async () => {
      assert.equal((await viewerA.get(W(A))).status, 200);
      const before = row("SELECT name FROM mk_sites WHERE id = ?", A).name;
      const w = await viewerA.post(W(A, "/infos"), { name: "Lecteur", country: "FR", revision: 0 });
      assert.ok([302, 403].includes(w.status)); assert.equal(row("SELECT name FROM mk_sites WHERE id = ?", A).name, before);
      const a = await new Client(srv.base).get(W(A)); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
    });
    test("un administrateur de B ne peut ni lire ni publier A ; la table de progression reste rattachée à son site", async () => {
      assert.ok([403, 404].includes((await adminB.get(W(A))).status));
      assert.equal(row("SELECT COUNT(*) n FROM mk_site_wizard WHERE site_id = ? AND organization_id = 1", A).n, 1);
    });
  });

  test("J. intégration indisponible : un module qui exige des identifiants s'active SANS rien connecter et le dit ; une fonctionnalité absente n'est jamais activable", async () => {
    const { id } = await start({ mode: "blank", category: "vitrine", name: "Intégrations J" });
    const before = row("SELECT COUNT(*) n FROM mk_site_modules").n;
    await boss.post(W(id, "/fonctions/reservation"), { etat: "activer" });
    await boss.post(W(id, "/fonctions/blog"), { etat: "activer" });
    assert.equal(row("SELECT COUNT(*) n FROM mk_site_modules").n, before, "ni absente ni 'incluse' ne s'active");
    await boss.post(W(id, "/fonctions/social"), { etat: "activer" });
    const flashText = await flash(boss, W(id, "?etape=fonctions"));
    assert.match(flashText, /Rien n(?:'|&#39;)est connecté automatiquement|À configurer par vous/);
    assert.equal(row("SELECT COUNT(*) n FROM mk_social_posts WHERE site_id = ?", id).n, 0, "aucune publication sociale créée");
    assert.match(flashText, /L(?:'|&#39;)autorisation de vos comptes/);
  });

  test("L. publication : refusée sans confirmation, refusée sans droit, jamais implicite ; le domaine n'est pas touché", async () => {
    const { id } = await start({ mode: "blank", category: "vitrine", name: "Publication L" });
    const pageId = row("SELECT home_page_id h FROM mk_sites WHERE id = ?", id).h;
    const domainsBefore = row("SELECT COUNT(*) n FROM mk_site_domains WHERE site_id = ?", id).n;
    await boss.post(W(id, "/publier"), { pages: [String(pageId)] });
    assert.notEqual(row("SELECT status FROM mk_landing_pages WHERE id = ?", pageId).status, "published", "sans confirmation : rien n'est publié");
    const view = await boss.get(W(id, "?etape=publication"));
    assert.match(view.text, /terminer en brouillon/); assert.match(view.text, /À vérifier avant publication/);
    // le service refuse aussi sans confirmation explicite, quel que soit l'appelant
    const ctx = { db, organizationId: 1, userId: 1 };
    assert.throws(() => wizard.publish(ctx, id, { confirm: "oui", pageIds: [pageId], can: () => true }), /confirmée explicitement/);
    assert.throws(() => wizard.publish(ctx, id, { confirm: true, pageIds: [pageId], can: () => false }), /pages\.publish/);
    // avec confirmation : le moteur contrôle chaque page ; le résultat est rapporté page par page
    const r = await boss.post(W(id, "/publier"), { pages: [String(pageId)], confirmer: "oui" });
    assert.equal(r.status, 302);
    const out = await flash(boss, W(id, "?etape=publication"));
    assert.match(out, /page\(s\) publiée\(s\)|refusée/);
    const st = row("SELECT status FROM mk_landing_pages WHERE id = ?", pageId).status;
    assert.ok(st === "published" || /refusée/.test(out), "publiée, ou refusée avec son motif");
    assert.equal(row("SELECT COUNT(*) n FROM mk_site_domains WHERE site_id = ?", id).n, domainsBefore, "aucun domaine créé ni modifié");
  });
});
