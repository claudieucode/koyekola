// PAGES-02 — parcours « Ajouter une page » : la boîte « Nouvelle page » est la première étape ; « Créer et ouvrir l'éditeur » crée UN vrai brouillon dans le site vérifié par le serveur
// puis ouvre l'éditeur du mode choisi. Vrai serveur, vraie base. Les modèles, les médias et les pages de chaque site restent isolés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

describe("PAGES-02 : Ajouter une page", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, tplA, tplB;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const dialog = (html) => (html.match(/<dialog[^>]*id="nouvelle"[\s\S]*?<\/dialog>/) || [""])[0];
  const banner = (html) => (html.match(/mk-site-banner-name">([^<]*)</) || [])[1];
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const count = () => one("SELECT COUNT(*) n FROM mk_landing_pages").n;
  const row = (name) => one("SELECT * FROM mk_landing_pages WHERE name = ?", name);
  let seq = 0; const token = () => `tok${String(++seq).padStart(4, "0")}abcdefghijklmnop`;
  // Ce que fait la boîte : un formulaire POST /marketing/pages avec le site de l'espace en champ caché
  const create = (client, fields) => client.post("/marketing/pages", { request_id: token(), ouvrir: "editeur", template: "", ...fields });
  const withTpl = async (site, name, markdown) => { const r = await boss.postJson("/marketing/site-web/modeles", { name, category: "autre", description: `Modèle de ${name}`, siteId: site, content: { title: "T", description: "", theme: {}, sections: [{ type: "text", markdown }] } }); assert.equal(r.status, 201, r.text); return JSON.parse(r.text).template; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    A = await mkSite("Alpha Pages"); B = await mkSite("Bravo Pages");
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    tplA = await withTpl(A, "Modèle privé Alpha", "Texte du modèle Alpha"); tplB = await withTpl(B, "Modèle privé Bravo", "Texte du modèle Bravo");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("étape 1 : « Ajouter une page » ouvre d'abord la boîte, dans le site courant", () => {
    for (const [label, S, who, name] of [["Alpha", () => A, () => adminA, "Alpha Pages"], ["Bravo", () => B, () => adminB, "Bravo Pages"]]) {
      test(`site ${label} : le bouton du menu et celui de la barre mènent à la liste DE CE SITE avec la boîte ; rien n'est créé en ouvrant`, async () => {
        const site = S(), client = who(), n = count();
        const dash = (await client.get(`${SP}/${site}/tableau-de-bord`)).text;
        assert.ok(dash.includes(`href="${SP}/${site}/pages#nouvelle"`), "lien « Ajouter une page » dans le cadre du site (menu et barre du haut)");
        for (const url of [`${SP}/${site}/pages`, `${SP}/${site}/pages?nouvelle=1`]) {
          const r = await client.get(url); assert.equal(r.status, 200, url); assert.equal(banner(r.text), name);
          const d = dialog(r.text); assert.ok(d.includes("Nouvelle page") && d.includes("Créer et ouvrir l’éditeur") && d.includes("Annuler"), "la boîte est dans la page");
          assert.match(d, new RegExp(`<input type="hidden" name="site_id" value="${site}">`), "le site de l'espace, en champ caché (revérifié par le serveur)");
        }
        assert.match(dialog((await client.get(`${SP}/${site}/pages?nouvelle=1`)).text), /<dialog[^>]* open[ >]/, "?nouvelle=1 : ouverte dès le rendu, sans dépendre de l'ancre ni de JavaScript");
        assert.doesNotMatch(dialog((await client.get(`${SP}/${site}/pages`)).text), /<dialog[^>]* open[ >]/, "sans ?nouvelle : fermée");
        assert.equal(count(), n, "ouvrir la boîte ne crée AUCUNE page");
      });
    }
    test("chaque ouverture porte son propre jeton ; les nouvelles pages ne se créent pas à l'ouverture, même répétée", async () => {
      const t = (h) => (dialog(h).match(/name="request_id" value="([^"]+)"/) || [])[1];
      const a = t((await adminA.get(`${SP}/${A}/pages`)).text), b = t((await adminA.get(`${SP}/${A}/pages`)).text);
      assert.ok(a && b && a !== b && /^[0-9a-f]{32}$/.test(a));
    });
    test("la boîte propose : nom, modèles (page vierge, MES modèles, modèles intégrés), éditeur, mise en page ; les modèles privés de B n'apparaissent pas chez A", async () => {
      const d = dialog((await adminA.get(`${SP}/${A}/pages`)).text);
      assert.match(d, /name="name"[^>]*required/); assert.match(d, /Modèle de départ/); assert.match(d, /Page vierge/); assert.match(d, /Modèle privé Alpha/); assert.ok(!d.includes("Modèle privé Bravo"));
      assert.match(d, /Page de vente/); assert.match(d, /Inscription à un webinaire/); assert.match(d, /Présentation d(?:'|&#39;)une formation/); assert.match(d, /Aimant à prospects/);
      assert.match(d, /value="editeur" checked/); assert.match(d, /value="fiche"/); assert.match(d, /Éditeur visuel KOLAKISA/); assert.match(d, /Édition par sections/);
      assert.match(d, /value="free" checked/); assert.match(d, /value="guided"/); assert.match(d, /data-mk-modal-close/);
      const b = dialog((await adminB.get(`${SP}/${B}/pages`)).text); assert.match(b, /Modèle privé Bravo/); assert.ok(!b.includes("Modèle privé Alpha"));
      assert.match(d, /Gutenberg/, "limite honnête : le moteur de blocs Gutenberg est celui des articles");
    });
    test("accès : un lecteur ne voit pas la boîte et ne peut pas créer ; anonyme refusé", async () => {
      assert.doesNotMatch((await viewerA.get(`${SP}/${A}/pages`)).text, /id="nouvelle"/);
      const n = count();
      assert.equal((await create(viewerA, { name: "Pirate lecteur", site_id: String(A) })).status, 403);
      const anon = await create(new Client(srv.base), { name: "Pirate anonyme" }); assert.ok([302, 401, 403].includes(anon.status) && !/\/marketing\/pages\/\d+/.test(anon.location || ""));
      assert.equal(count(), n);
    });
  });

  describe("étapes 2 et 3 : création réelle puis ouverture directe de l'éditeur", () => {
    test("nom + modèle intégré + éditeur visuel : brouillon du site A, contenu du modèle, redirection DIRECTE vers l'éditeur de cette page (retour = liste du site)", async () => {
      const r = await create(adminA, { name: "  Vente   Alpha  ", template: "vente", site_id: String(A) });
      assert.equal(r.status, 302); const p = row("Vente Alpha"); assert.ok(p, "nom nettoyé (espaces superflus retirés)");
      assert.equal(r.location, `/marketing/pages/${p.id}/editeur?retour=pages`, "directement l'éditeur, sans liste ni écran intermédiaire");
      assert.deepEqual([p.site_id, p.status, p.kind, p.published_at], [A, "draft", "page", null], "site vérifié, brouillon, jamais publié");
      const sections = JSON.parse(p.sections); assert.ok(sections.length >= 3, "contenu du modèle « Page de vente »");
      assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ? AND slug <> ''", p.id), "adresse (slug) générée");
      const editor = await adminA.get(r.location); assert.equal(editor.status, 200);
      assert.ok(editor.text.includes("Vente Alpha"), "titre prérempli"); assert.match(editor.text, new RegExp(`name="mk-media-site" content="${A}"`), "le sélecteur de médias est celui du site A");
      assert.match(editor.text, new RegExp(`${SP}/${A}/pages`), "retour vers la liste des pages DU site");
    });
    test("page vierge : aucune section, brouillon ; mise en page guidée appliquée seulement dans l'éditeur visuel", async () => {
      const r = await create(adminA, { name: "Vierge guidée", site_id: String(A), layoutMode: "guided", layoutFormat: "standard" });
      const p = row("Vierge guidée"); assert.equal(r.location, `/marketing/pages/${p.id}/editeur?retour=pages`);
      assert.deepEqual(JSON.parse(p.sections), []); assert.equal(p.status, "draft");
      assert.match(p.draft || p.sections || "", /\[\]|layout/);
      const lay = one("SELECT theme FROM mk_landing_pages WHERE id = ?", p.id).theme; assert.match(String(lay), /guided|standard|layout/i, "mise en page guidée enregistrée");
    });
    test("mode « édition par sections » : ouvre la fiche de la page (pas l'éditeur visuel) ; la mise en page guidée n'est pas appliquée ni annoncée", async () => {
      const r = await create(adminA, { name: "Par sections", ouvrir: "fiche", template: "lead", site_id: String(A), layoutMode: "guided", layoutFormat: "standard" });
      const p = row("Par sections"); assert.equal(r.location, `/marketing/pages/${p.id}`);
      assert.ok(JSON.parse(p.sections).length >= 2); assert.doesNotMatch(String(one("SELECT theme FROM mk_landing_pages WHERE id = ?", p.id).theme), /guided/);
      const fiche = await adminA.get(r.location); assert.equal(fiche.status, 200); assert.ok(fiche.text.includes("Par sections")); assert.equal(banner(fiche.text), "Alpha Pages");
    });
    test("modèle personnel du site : appliqué ; la page contient son contenu", async () => {
      const r = await create(adminA, { name: "Depuis mon modèle", template: `mine:${tplA.id}`, site_id: String(A) });
      const p = row("Depuis mon modèle"); assert.ok(p); assert.match(p.sections, /Texte du modèle Alpha/); assert.equal(p.site_id, A);
      assert.equal(r.location, `/marketing/pages/${p.id}/editeur?retour=pages`);
    });
    test("l'éditeur enregistre et conserve le contenu (brouillon), l'aperçu fonctionne ; la publication reste explicite et soumise au droit de publier", async () => {
      const p = row("Vente Alpha"); const cur = JSON.parse(p.draft || "null") || { seo: {} };
      const save = await adminA.request(`/marketing/pages/${p.id}/brouillon`, { method: "PUT", json: { revision: p.revision, content: { title: "Vente Alpha", description: "", seo: cur.seo || {}, sections: [{ type: "text", markdown: "Contenu saisi dans l'éditeur" }] } } });
      assert.equal(save.status, 200, save.text.slice(0, 200));
      assert.match(one("SELECT draft FROM mk_landing_pages WHERE id = ?", p.id).draft, /Contenu saisi dans l'éditeur/);
      assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", p.id).status, "draft", "enregistrer ne publie pas");
      assert.equal((await adminA.get(`/marketing/pages/${p.id}/apercu`)).status, 200);
      assert.equal((await viewerA.post(`/marketing/pages/${p.id}/publier`, {})).status, 403, "un lecteur ne publie pas");
      assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", p.id).status, "draft");
    });
  });

  describe("validation et erreurs : rien n'est créé, la saisie est conservée", () => {
    test("nom vide ou d'espaces : erreur explicite, la boîte se rouvre, aucune page", async () => {
      for (const name of ["", "   ", "   "]) {
        const n = count(), r = await create(adminA, { name, site_id: String(A) });
        assert.equal(r.status, 302); const back = await adminA.get(r.location);
        assert.equal(back.status, 200); assert.match(flashOf(back.text), /nom/i); assert.match(back.text, /data-mk-modal-reopen="nouvelle"/, "la boîte se rouvre avec le message"); assert.equal(count(), n);
        assert.equal(banner(back.text), "Alpha Pages", "le retour reste dans le site");
      }
    });
    test("modèle indisponible (supprimé, inconnu, ou PRIVÉ À UN AUTRE SITE) : message clair, aucune page orpheline", async () => {
      const n = count();
      for (const [tpl, expect] of [[`mine:${tplB.id}`, /pas disponible pour ce site/], ["mine:999999", /pas disponible pour ce site/], ["inexistant", /Modèle de page inconnu/]]) {
        const r = await create(adminA, { name: `Refus ${tpl}`, template: tpl, site_id: String(A) });
        const back = await adminA.get(r.location); assert.match(flashOf(back.text), expect, tpl); assert.equal(count(), n, `${tpl} : aucune page créée`);
      }
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE name LIKE 'Refus %'").n, 0);
    });
    test("mode d'édition inconnu : refusé, rien n'est créé ni annoncé", async () => {
      const n = count(), r = await create(adminA, { name: "Mode inconnu", ouvrir: "gutenberg", site_id: String(A) });
      assert.match(flashOf((await adminA.get(r.location)).text), /Mode d(?:'|&#39;)édition inconnu/); assert.equal(count(), n);
    });
    test("nom déjà pris dans le site : erreur du serveur affichée, aucune seconde page", async () => {
      const n = count(), r = await create(adminA, { name: "Vente Alpha", site_id: String(A) });
      assert.match(flashOf((await adminA.get(r.location)).text), /porte déjà ce nom/i); assert.equal(count(), n);
    });
  });

  describe("double création impossible", () => {
    test("même formulaire envoyé deux fois (double clic, requête répétée, nouvelle tentative) : UNE page ; la seconde réponse rouvre la même", async () => {
      const t = token(), n = count();
      const first = await adminA.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Double clic", site_id: String(A) });
      const second = await adminA.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Double clic", site_id: String(A) });
      assert.equal(count(), n + 1); assert.equal(second.location, first.location, "même éditeur, même page");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Double clic'").n, 1);
    });
    test("requêtes simultanées avec le même jeton : une seule page", async () => {
      const t = token(), n = count();
      const rs = await Promise.all([1, 2, 3, 4].map(() => adminA.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Simultanées", site_id: String(A) })));
      assert.equal(count(), n + 1); assert.equal(new Set(rs.map((r) => r.location)).size, 1);
    });
    test("un jeton ne ressert pas à une autre personne ni à un autre site (pas de page « récupérée » ailleurs)", async () => {
      const t = token();
      const mine = await adminA.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Page jetonnée", site_id: String(A) });
      const other = await adminB.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Page de B", site_id: String(B) });
      assert.notEqual(other.location, mine.location); assert.equal(row("Page de B").site_id, B);
    });
    test("échec d'ouverture de l'éditeur : le brouillon existe (liste du site) et rouvrir le même formulaire redonne la même page", async () => {
      const t = token(), r = await adminA.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Éditeur à rouvrir", site_id: String(A) });
      const p = row("Éditeur à rouvrir"); assert.ok(p);
      assert.ok((await adminA.get(`${SP}/${A}/pages`)).text.includes("Éditeur à rouvrir"), "le brouillon reste listé");
      const again = await adminA.post("/marketing/pages", { request_id: t, ouvrir: "editeur", name: "Éditeur à rouvrir", site_id: String(A) });
      assert.equal(again.location, r.location); assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Éditeur à rouvrir'").n, 1);
    });
  });

  describe("multisite : aucun mélange, aucun retour au site principal", () => {
    test("A et B créent chacun leur page : propriétaires distincts, chaque liste ne montre que ses pages, retour de l'éditeur dans le bon site", async () => {
      const ra = await create(adminA, { name: "Page chez Alpha", site_id: String(A) }), rb = await create(adminB, { name: "Page chez Bravo", site_id: String(B) });
      const pa = row("Page chez Alpha"), pb = row("Page chez Bravo"); assert.deepEqual([pa.site_id, pb.site_id], [A, B]);
      const la = (await adminA.get(`${SP}/${A}/pages`)).text, lb = (await adminB.get(`${SP}/${B}/pages`)).text;
      assert.ok(la.includes("Page chez Alpha") && !la.includes("Page chez Bravo")); assert.ok(lb.includes("Page chez Bravo") && !lb.includes("Page chez Alpha"));
      assert.equal((await adminA.get(rb.location)).status === 200, false, "A n'ouvre pas la page de B"); assert.equal((await adminB.get(ra.location)).status === 200, false);
      assert.ok((await adminB.get(rb.location)).text.includes(`${SP}/${B}/pages`) && !(await adminB.get(rb.location)).text.includes(`href="${SP}/${A}/pages`));
    });
    test("site falsifié : l'administrateur de A ne crée rien dans B ; l'équipe crée dans le site choisi ; sans site, une page du principal (jamais d'un site « par défaut »)", async () => {
      const n = count();
      const intrus = await create(adminA, { name: "Intrus dans B", site_id: String(B) });
      assert.ok([302, 403].includes(intrus.status)); assert.equal(count(), n, "refusé : rien n'est créé");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Intrus dans B'").n, 0);
      await create(boss, { name: "Équipe dans B", site_id: String(B) }); assert.equal(row("Équipe dans B").site_id, B);
      await create(boss, { name: "Du principal" }); assert.equal(row("Du principal").site_id, null);
      const noSite = await create(adminA, { name: "Sans site transmis" }); assert.ok([302, 403].includes(noSite.status)); const r = row("Sans site transmis"); assert.ok(!r || r.site_id === A, "un accès limité sans site transmis : son site (jamais le principal)");
    });
    test("médias de l'éditeur : seuls ceux du site de la page (A / B) ; le site principal reste séparé", async () => {
      const pa = row("Page chez Alpha"), pb = row("Page chez Bravo");
      assert.match((await adminA.get(`/marketing/pages/${pa.id}/editeur`)).text, new RegExp(`name="mk-media-site" content="${A}"`));
      assert.match((await adminB.get(`/marketing/pages/${pb.id}/editeur`)).text, new RegExp(`name="mk-media-site" content="${B}"`));
    });
  });
});

// Logique de la boîte côté navigateur (sous Node, sans DOM)
describe("PAGES-02 : logique du navigateur", () => {
  const U = require("../public/js/new-page-dialog.js");
  test("nom : espaces retirés, vide refusé, trop long refusé", () => {
    assert.equal(U.cleanName("  Guide \n  gratuit  "), "Guide gratuit");
    assert.equal(U.nameState("   ").ok, false); assert.match(U.nameState("").message, /Donnez un nom/);
    assert.deepEqual(U.nameState("  Ma page "), { ok: true, name: "Ma page", message: "" });
    assert.equal(U.nameState("x".repeat(101)).ok, false); assert.equal(U.nameState("x".repeat(100)).ok, true);
  });
  test("double envoi : un seul départ par ouverture ; remis à zéro seulement par un retour explicite", () => {
    const g = U.createGuard();
    assert.equal(g.begin(), true); assert.equal(g.begin(), false); assert.equal(g.begin(), false); assert.equal(g.sent(), true);
    g.reset(); assert.equal(g.begin(), true);
  });
});
