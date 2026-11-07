// KOLAKISA CMS — Apparence → Thèmes : thèmes installés et thème actif PAR SITE, sur les vraies routes, la vraie base, de vrais comptes.
// Liste, recherche, catalogue et import (paquets valides / invalides), activation, rendu réel, retour au thème précédent, suppression, aperçu réel,
// permissions côté serveur et isolation entre deux sites (+ le site principal).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("apparence-thèmes : installation, activation, aperçu, suppression, isolation", () => {
  let srv, boss, db, orgId, A, B, C, adminA, editorA, viewerA, pageA, pageB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const TH = "/marketing/site-web/themes", SP = "/marketing/site-web/sites";
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<svg[\s\S]*?<\/svg>/g, "").replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/\s+/g, " ");
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const activeOf = (site) => (one("SELECT theme_key FROM cms_themes WHERE COALESCE(site_id, 0) = COALESCE(?, 0) AND active = 1", site) || {}).theme_key || "kolakisa";
  // Noms des cartes de la galerie (titre en <h3>) ; « installés » = filtre « Affichage : Installés » (le thème d'origine est toujours installé)
  const cards = (html) => [...html.matchAll(/data-th-card[\s\S]*?<h3><a [^>]*>([^<]+)<\/a>/g)].map((m) => m[1].trim());
  const installedOf = async (c, site, extra = "") => cards((await c.get(`${TH}?${site ? `site=${site}&` : ""}etat=installed&taille=60${extra}`)).text);
  const activeRe = (name) => new RegExp(`Thème actif</p>\\s*<h2>${name}`);
  const install = (c, site, key) => c.post(`${TH}/installer`, { key, ...(site ? { site: String(site) } : {}) });
  const pkg = (o = {}) => JSON.stringify({ key: "mon-theme", name: "Mon thème", version: "1.2.0", author: "Tester", description: "Thème d'essai", tokens: { colors: { primary: "#7c3aed" } }, ...o });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta"); C = site("Gamma");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const page = (slug, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, slug, slug, slug, SECTIONS, s).lastInsertRowid);
    pageA = page("page-alpha", A); pageB = page("page-beta", B);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("interface", () => {
    test("liste : titre, compteur, recherche, thème actif, « Ajouter un thème », aucune carte factice", async () => {
      const r = await boss.get(`${SP}/${A}/themes`);
      assert.equal(r.status, 200);
      for (const f of ["<h1>Thèmes", "Importer un paquet de thème", "Rechercher un thème", "Thème actif", "Kolakisa — d&#39;origine", "Aide"]) assert.ok(r.text.includes(f), f);
      assert.match(r.text, /class="mk-th-count"[^>]*>\d+</, "nombre de thèmes de la bibliothèque");
      assert.deepEqual(await installedOf(boss, A), ["Kolakisa — d&#39;origine"], "un seul thème installé : le thème d'origine");
      assert.doesNotMatch((await boss.get(`${TH}?site=${A}&etat=installed`)).text, /\/activer"/, "le thème actif n'a pas de bouton « Utiliser »");
      assert.doesNotMatch(r.text, /Elementor|WPForms|Hostinger/);
    });
    test("la page d'import propose le formulaire de paquet ; le catalogue complet est dans la galerie, tous installables", async () => {
      const r = await boss.get(`${TH}/ajouter?site=${A}`);
      assert.equal(r.status, 200);
      assert.match(r.text, /name="package"/); assert.match(r.text, /bibliothèque de thèmes/);
      for (const [q, name] of [["arene", "Arène"], ["fleur", "Fleur de sel"], ["labo", "Laboratoire"], ["volume", "Volume"], ["orbite", "Orbite"]]) {
        const html = (await boss.get(`${TH}?site=${A}&q=${q}`)).text;
        assert.ok(cards(html).includes(name), `${name} est dans la galerie`);
        assert.match(html, new RegExp(`name="key" value="${q}"`), `${name} est installable`);
      }
      assert.match((await boss.get(`${TH}?site=${A}&q=zzzz`)).text, /Aucun thème ne correspond/);
    });
  });

  describe("installation", () => {
    test("installer un thème du catalogue : visible dans la liste du site, actions « inactif », et PAS sur les autres sites", async () => {
      const r = await install(boss, A, "arene");
      assert.equal(r.status, 302); assert.equal(r.location, `${TH}?site=${A}`);
      const html = (await boss.get(r.location)).text;
      assert.match(flashOf(html), /Arène.*installé/);
      assert.deepEqual(await installedOf(boss, A), ["Kolakisa — d&#39;origine", "Arène"]);
      const list = (await boss.get(`${TH}?site=${A}&etat=installed`)).text;
      assert.match(list, new RegExp(`action="${TH}/arene/activer"`)); assert.match(list, />Prévisualiser</); assert.match(list, /\/arene\/details/);
      assert.deepEqual(await installedOf(boss, B), ["Kolakisa — d&#39;origine"], "le site B n'a pas reçu le thème");
      assert.deepEqual(await installedOf(boss, null), ["Kolakisa — d&#39;origine"], "le site principal non plus");
      assert.match((await boss.get(`${TH}?site=${A}&q=arene`)).text, /mk-tg-flag">Installé/);
    });
    test("déjà installé, thème inconnu : refusés avec un message", async () => {
      const dup = await install(boss, A, "arene");
      assert.match(flashOf((await boss.get(dup.location)).text), /déjà installé/);
      const unk = await install(boss, A, "n-existe-pas");
      assert.match(flashOf((await boss.get(unk.location)).text), /n'existe pas dans le catalogue/);
    });
    test("paquet valide importé ; recherche par nom ; le même identifiant ne s'installe pas deux fois", async () => {
      const r = await boss.post(`${TH}/installer`, { package: pkg(), site: String(A) });
      assert.match(flashOf((await boss.get(r.location)).text), /Mon thème.*installé/);
      const row = one("SELECT * FROM cms_themes WHERE theme_key = 'mon-theme'");
      assert.equal(row.site_id, A); assert.equal(row.source, "import"); assert.equal(JSON.parse(row.manifest).tokens.colors.primary, "#7c3aed"); assert.match(row.checksum, /^[0-9a-f]{64}$/);
      assert.deepEqual(await installedOf(boss, A, "&q=mon"), ["Mon thème"]);
      assert.match((await boss.get(`${TH}?site=${A}&etat=installed&q=introuvable`)).text, /Aucun thème ne correspond/);
      const again = await boss.post(`${TH}/installer`, { package: pkg(), site: String(A) });
      assert.match(flashOf((await boss.get(again.location)).text), /déjà installé/);
    });
    test("paquets invalides : refusés, rien n'est écrit, message exploitable", async () => {
      const before = one("SELECT COUNT(*) n FROM cms_themes").n;
      const bad = [
        ["pas du json", "{oups", /pas du JSON valide/], ["vide", "   ", /Collez le contenu/], ["tableau", "[]", /objet JSON/],
        ["champ inconnu (code)", pkg({ script: "alert(1)" }), /n'est pas reconnu/], ["clé invalide", pkg({ key: "Mauvaise Clé!" }), /« key »/], ["clé réservée", pkg({ key: "kolakisa" }), /réservé/],
        ["sans nom", pkg({ name: "" }), /« name » est obligatoire/], ["version", pkg({ version: "v1" }), /1\.0\.0/], ["couleur invalide", pkg({ tokens: { colors: { primary: "rouge" } } }), /invalide/i],
        ["sans jetons", pkg({ tokens: undefined }), /« tokens »/], ["usurpe le catalogue", pkg({ key: "arene" }), /catalogue Kolakisa, avec un contenu différent/], ["trop gros", pkg({ description: "x".repeat(70000) }), /volumineux/],
        ["format trop récent", pkg({ key: "futur", api: 2 }), /plus récent/],
      ];
      for (const [label, body, re] of bad) {
        const r = await boss.post(`${TH}/installer`, { package: body, site: String(A) });
        assert.equal(r.status, 302, label);
        assert.match(r.location, /\/ajouter/, label);
        assert.match(flashOf((await boss.get(r.location)).text), re, label);
      }
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes").n, before, "aucune ligne écrite");
    });
  });

  describe("permissions côté serveur", () => {
    test("lecteur : voit la liste, sans bouton ; installer, activer, supprimer refusés (403) et rien ne change", async () => {
      const list = (await viewerA.get(`${SP}/${A}/themes`)).text;
      assert.doesNotMatch(list, /\/activer"|\/supprimer"|\/installer"|\/ajouter\?site|data-confirm/);
      for (const [path, body] of [[`${TH}/installer`, { key: "volume", site: String(A) }], [`${TH}/arene/activer`, { site: String(A) }], [`${TH}/mon-theme/supprimer`, { site: String(A) }], [`${TH}/revenir`, { site: String(A) }]]) {
        assert.equal((await viewerA.post(path, body)).status, 403, path);
      }
      assert.equal(activeOf(A), "kolakisa"); assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'volume'").n, 0);
    });
    test("éditeur : peut installer mais ni activer ni supprimer (réservé aux administrateurs)", async () => {
      assert.equal((await install(editorA, A, "volume")).status, 302);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'volume' AND site_id = ?", A).n, 1);
      assert.equal((await editorA.post(`${TH}/volume/activer`, { site: String(A) })).status, 403);
      assert.equal((await editorA.post(`${TH}/volume/supprimer`, { site: String(A) })).status, 403);
      assert.equal(activeOf(A), "kolakisa");
    });
    test("accès limité au site A : aucune opération possible sur B, ni sur le principal, même forgée", async () => {
      assert.equal((await adminA.get(`${SP}/${B}/themes`)).status, 403);
      assert.equal((await adminA.get(`${TH}?site=${B}`)).status, 403);
      const bare = await adminA.get(`${TH}`); assert.ok(bare.status === 403 || (bare.status === 302 && bare.location === "/marketing/site-web/mes-sites"), "sans site : le principal est réservé à l'équipe (refus ou renvoi vers Mes sites)");
      assert.equal((await adminA.get(`${TH}/ajouter?site=${B}`)).status, 403);
      for (const body of [{ key: "arene", site: String(B) }, { key: "arene" }, { key: "arene", site: "0" }, { key: "arene", site: "abc" }]) assert.equal((await adminA.post(`${TH}/installer`, body)).status, 403, JSON.stringify(body));
      assert.equal((await adminA.post(`${TH}/arene/activer`, { site: String(B) })).status, 403);
      assert.equal((await adminA.post(`${TH}/volume/supprimer`, { site: String(B) })).status, 403);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE site_id = ?", B).n, 0);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE site_id IS NULL").n, 0);
    });
    test("personne de non connecté : redirigé vers la connexion", async () => {
      const r = await fetch(`${srv.base}${TH}?site=${A}`, { redirect: "manual" });
      assert.ok([301, 302, 303, 401, 403].includes(r.status)); assert.doesNotMatch(await r.text(), /Thèmes installés|mk-th-grid/);
    });
  });

  describe("activation, rendu réel, retour, isolation", () => {
    test("activer sur A : thème actif de A uniquement, jetons du site mis à jour, rendu de la page de A, persistance", async () => {
      const r = await adminA.post(`${TH}/arene/activer`, { site: String(A) });
      assert.equal(r.status, 302); assert.equal(r.location, `${TH}?site=${A}`);
      const html = (await adminA.get(r.location)).text;
      assert.match(flashOf(html), /Arène.*activé/);
      assert.match(html, activeRe("Arène")); assert.match(html, /\/revenir"/);
      assert.equal(activeOf(A), "arene"); assert.equal(tokensOf(A).colors.primary, "#ff4b1f"); assert.equal(tokensOf(A).colors.background, "#f3efe6");
      // Rendu : la page de A utilise les jetons du thème
      const prev = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
      assert.ok(prev.toLowerCase().includes("--kw-primary:#ff4b1f"), "la page du site A est rendue avec le thème actif");
      // Persistance après rechargement (nouvelle session)
      assert.match((await boss.get(`${SP}/${A}/themes`)).text, activeRe("Arène"));
      const log = one("SELECT * FROM mk_audit_logs WHERE action = 'theme.activated'");
      assert.ok(log && log.site_id === A, "activation journalisée avec son site");
    });
    test("isolation : B, C et le principal gardent leur thème, leurs jetons, leur liste et leur rendu", async () => {
      assert.equal(activeOf(B), "kolakisa"); assert.equal(activeOf(C), "kolakisa"); assert.equal(activeOf(null), "kolakisa");
      assert.deepEqual(tokensOf(B), {}); assert.deepEqual(tokensOf(C), {});
      assert.ok(!(await boss.get(`/marketing/pages/${pageB}/apercu`)).text.toLowerCase().includes("--kw-primary:#ff4b1f"), "la page de B n'a pas le thème de A");
      assert.match((await boss.get(`${SP}/${B}/themes`)).text, activeRe("Kolakisa"));
      // Activer un autre thème sur B ne change rien pour A
      assert.equal((await boss.post(`${TH}/installer`, { key: "labo", site: String(B) })).status, 302);
      assert.equal((await boss.post(`${TH}/labo/activer`, { site: String(B) })).status, 302);
      assert.equal(activeOf(B), "labo"); assert.equal(tokensOf(B).colors.primary, "#00c2e0");
      assert.equal(activeOf(A), "arene"); assert.equal(tokensOf(A).colors.primary, "#ff4b1f");
      // Un thème installé sur A n'est pas activable depuis B (déjà installé là-bas = faux)
      const r = await boss.post(`${TH}/volume/activer`, { site: String(B) });
      assert.match(flashOf((await boss.get(r.location)).text), /n'est pas installé sur ce site/);
      assert.equal(activeOf(B), "labo");
    });
    test("le thème actif ne peut être activé deux fois ; thème non installé et clé invalide refusés", async () => {
      const again = await adminA.post(`${TH}/arene/activer`, { site: String(A) });
      assert.match(flashOf((await adminA.get(again.location)).text), /déjà actif/);
      assert.equal((await boss.post(`${TH}/Pas%20Valide/activer`, { site: String(A) })).status, 302);
      assert.equal(activeOf(A), "arene");
    });
    test("thème incompatible : affiché comme tel, sans bouton d'activation, activation refusée côté serveur", async () => {
      const m = { key: "futur", name: "Thème du futur", version: "9.0.0", author: "X", description: "", api: 2, tokens: { colors: { primary: "#111111" } } };
      db.prepare("INSERT INTO cms_themes (site_id, theme_key, name, version, source, manifest, checksum) VALUES (?, 'futur', 'Thème du futur', '9.0.0', 'import', ?, 'x')").run(A, JSON.stringify(m));
      const html = (await boss.get(`${TH}?site=${A}&etat=installed`)).text;
      assert.match(html, /Incompatible/); assert.doesNotMatch(html, /futur\/activer/);
      const r = await boss.post(`${TH}/futur/activer`, { site: String(A) });
      assert.match(flashOf((await boss.get(r.location)).text), /incompatible/);
      assert.equal(activeOf(A), "arene"); assert.equal(tokensOf(A).colors.primary, "#ff4b1f");
      assert.equal((await boss.post(`${TH}/futur/supprimer`, { site: String(A) })).status, 302);
    });
    test("revenir au thème précédent : jetons d'origine rétablis, thème d'origine actif, bouton disparu", async () => {
      const r = await adminA.post(`${TH}/revenir`, { site: String(A) });
      const html = (await adminA.get(r.location)).text;
      assert.match(flashOf(html), /Retour au thème « Kolakisa/);
      assert.equal(activeOf(A), "kolakisa"); assert.notEqual(tokensOf(A).colors && tokensOf(A).colors.primary, "#ff4b1f");
      assert.doesNotMatch(html, /\/revenir"/, "plus de bouton de retour");
      assert.ok(!(await boss.get(`/marketing/pages/${pageA}/apercu`)).text.toLowerCase().includes("--kw-primary:#ff4b1f"));
      const none = await adminA.post(`${TH}/revenir`, { site: String(A) });
      assert.match(flashOf((await adminA.get(none.location)).text), /Aucun thème précédent/);
    });
    test("les couleurs personnalisées du site survivent au changement de thème", async () => {
      const t = tokensOf(C); t.customColors = [{ key: "c-marque", label: "Marque", hex: "#123456" }];
      db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), C);
      await boss.post(`${TH}/installer`, { key: "volume", site: String(C) }); await boss.post(`${TH}/volume/activer`, { site: String(C) });
      assert.equal(activeOf(C), "volume"); assert.equal(tokensOf(C).customColors[0].key, "c-marque");
    });
    test("site principal : activation = publication de l'apparence du principal, rendu public ; A, B, C inchangés ; brouillon en cours = refus", async () => {
      const appr = () => JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published);
      await boss.post(`${TH}/installer`, { key: "fleur" });
      const r = await boss.post(`${TH}/fleur/activer`, {});
      assert.equal(r.status, 302); assert.equal(r.location, TH);
      assert.match((await boss.get(r.location)).text, activeRe("Fleur de sel"));
      assert.equal(appr().tokens.colors.primary, "#143127"); assert.equal(activeOf(null), "fleur");
      const home = (await boss.get("/")).text.toLowerCase();
      assert.ok(home.includes("#143127"), "la page publique du site principal utilise le thème");
      assert.equal(activeOf(A), "kolakisa"); assert.equal(activeOf(B), "labo"); assert.equal(tokensOf(B).colors.primary, "#00c2e0");
      // Brouillon d'apparence en cours : refus clair, rien d'écrasé
      db.prepare("UPDATE appearance_configs SET draft = ? WHERE site_id IS NULL").run(JSON.stringify({ ...appr(), header: { ...appr().header, search: false } }));
      await boss.post(`${TH}/installer`, { key: "orbite" });
      const d = await boss.post(`${TH}/orbite/activer`, {});
      assert.match(flashOf((await boss.get(d.location)).text), /brouillon d'apparence/);
      assert.equal(activeOf(null), "fleur");
      db.prepare("UPDATE appearance_configs SET draft = NULL WHERE site_id IS NULL").run();
      assert.equal((await boss.post(`${TH}/revenir`, {})).status, 302); assert.equal(activeOf(null), "kolakisa");
      assert.ok(!(await boss.get("/")).text.toLowerCase().includes("#143127"));
    });
  });

  describe("aperçu réel", () => {
    test("la page d'aperçu garde le site, propose retour et activation, et encadre le site de démonstration isolé ; l'aperçu avec le contenu du site reste disponible", async () => {
      const r = await boss.get(`${TH}/volume/apercu?site=${A}`);
      assert.equal(r.status, 200);
      assert.match(r.text, new RegExp(`src="${TH}/volume/demo/accueil\\?site=${A}"`));
      assert.ok(r.text.includes(`href="${TH}?site=${A}"`)); assert.match(r.text, /← Thèmes/);
      assert.match(r.text, /Utiliser ce thème/, "Volume est installé (inactif) sur A : activation proposée");
      assert.match((await boss.get(`${TH}/orbite/apercu?site=${A}`)).text, />Installer</, "thème du catalogue non installé sur A : installation proposée");
      const inst = (await boss.get(`${TH}/arene/apercu?site=${B}&mode=site`)).text;
      assert.match(inst, new RegExp(`src="/marketing/pages/${pageB}/apercu\\?kwtheme=arene"`));
      const real = (await boss.get(`${TH}/volume/apercu?site=${A}&mode=site`)).text;
      assert.match(real, new RegExp(`src="/marketing/pages/${pageA}/apercu\\?kwtheme=volume"`)); assert.match(real, /Retour à la liste des thèmes/); assert.match(real, /Activer ce thème/);
    });
    test("la page est rendue avec les jetons du thème, sans rien enregistrer ; hors équipe autorisée, aucun effet", async () => {
      const withTheme = (await boss.get(`/marketing/pages/${pageA}/apercu?kwtheme=orbite`)).text.toLowerCase();
      assert.ok(withTheme.includes("--kw-primary:#a285ff"), "aperçu avec le thème Orbite");
      assert.equal(activeOf(A), "kolakisa"); assert.notEqual(tokensOf(A).colors && tokensOf(A).colors.primary, "#a285ff");
      const without = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text.toLowerCase();
      assert.ok(!without.includes("--kw-primary:#a285ff"));
      assert.ok(!(await adminA.get(`/marketing/pages/${pageB}/apercu?kwtheme=orbite`)).text.toLowerCase().includes("#a285ff"), "un accès limité à A ne voit pas B");
      const pub = await fetch(`${srv.base}/?kwtheme=orbite`, { redirect: "manual" });
      assert.ok(!(await pub.text()).toLowerCase().includes("#a285ff"), "un visiteur ne déclenche jamais l'aperçu");
      assert.match((await boss.get(`/marketing/pages/${pageA}/apercu?kwtheme=${encodeURIComponent("x';--")}`)).text, /Contenu|lp-/, "clé invalide ignorée");
    });
    test("site sans page : explication claire, aperçu généré affiché ; thème inconnu : 404", async () => {
      const r = await boss.get(`${TH}/fleur/apercu?site=${C}&mode=site`);
      assert.match(r.text, /n'a pas encore de page à afficher/); assert.match(r.text, /mk-th-shot/);
      assert.equal((await boss.get(`${TH}/nexiste-pas/apercu?site=${A}`)).status, 404);
    });
    test("fiche de détails : version, auteur, compatibilité, état et actions ; 404 si non installé sur CE site", async () => {
      const r = await boss.get(`${TH}/volume/details?site=${C}`);
      for (const f of ["Volume", "Version", "2.0.0", "Équipe Kolakisa", "Compatible avec ce Kolakisa", "Actif sur ce site", "ne peut pas être supprimé"]) assert.ok(r.text.includes(f), f);
      assert.doesNotMatch(r.text, /\/supprimer"/, "le thème actif n'a pas de bouton de suppression");
      const onB = await boss.get(`${TH}/volume/details?site=${B}`);
      assert.equal(onB.status, 200, "la fiche d'un thème du catalogue est visible depuis tout site"); assert.match(onB.text, /Disponible/); assert.match(onB.text, /name="key" value="volume"/, "installable sur B");
      assert.equal((await boss.get(`${TH}/kolakisa/details?site=${B}`)).status, 200);
    });
  });

  describe("suppression", () => {
    test("le thème actif et le thème d'origine ne se suppriment pas", async () => {
      const a = await boss.post(`${TH}/volume/supprimer`, { site: String(C) });
      assert.match(flashOf((await boss.get(a.location)).text), /Le thème actif ne peut pas être supprimé/);
      const o = await boss.post(`${TH}/kolakisa/supprimer`, { site: String(C) });
      assert.match(flashOf((await boss.get(o.location)).text), /thème d'origine/);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'volume' AND site_id = ?", C).n, 1);
    });
    test("un thème inactif se supprime : sa ligne seulement ; pages, jetons et thèmes des autres sites intacts", async () => {
      const before = { pages: one("SELECT COUNT(*) n FROM mk_landing_pages").n, tokensB: tokensOf(B), themes: one("SELECT COUNT(*) n FROM cms_themes").n };
      const r = await adminA.post(`${TH}/mon-theme/supprimer`, { site: String(A) });
      assert.match(flashOf((await adminA.get(r.location)).text), /Mon thème.*supprimé/);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'mon-theme'").n, 0);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes").n, before.themes - 1);
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, before.pages); assert.deepEqual(tokensOf(B), before.tokensB);
      assert.match(flashOf((await adminA.get((await adminA.post(`${TH}/mon-theme/supprimer`, { site: String(A) })).location)).text), /n'est pas installé/);
    });
    test("supprimer depuis un autre site ne touche pas le thème du site A (même identifiant)", async () => {
      // Identifiant libre : « commun » est devenu un thème du catalogue Kolakisa (installation refusée), il ne convient plus à ce test.
      await boss.post(`${TH}/installer`, { package: pkg({ key: "partage-essai" }), site: String(A) }); await boss.post(`${TH}/installer`, { package: pkg({ key: "partage-essai" }), site: String(B) });
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'partage-essai' AND site_id = ?", A).n, 1, "installé sur A");
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'partage-essai' AND site_id = ?", B).n, 1, "installé sur B");
      await boss.post(`${TH}/partage-essai/supprimer`, { site: String(B) });
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'partage-essai' AND site_id = ?", A).n, 1);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'partage-essai' AND site_id = ?", B).n, 0);
    });
  });

  describe("site archivé, site inconnu, navigation", () => {
    test("site archivé : consultation seule, aucune écriture", async () => {
      db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(C);
      const html = (await boss.get(`${SP}/${C}/themes`)).text;
      assert.match(html, /archivé ou supprimé/); assert.doesNotMatch(html, /\/activer"|\/installer"|\/ajouter\?site|data-confirm/);
      const r = await boss.post(`${TH}/installer`, { key: "arene", site: String(C) });
      assert.match(flashOf((await boss.get(r.location)).text), /archivé/);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'arene' AND site_id = ?", C).n, 0);
      db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(C);
    });
    test("site inconnu : 404, jamais le site principal", async () => {
      assert.equal((await boss.get(`${TH}?site=99999`)).status, 404);
      assert.equal((await boss.get(`${SP}/99999/themes`)).status, 404);
    });
    test("tous les liens et formulaires de la liste, de l'ajout, de la fiche et de l'aperçu gardent le site, jamais le principal", async () => {
      for (const url of [`${SP}/${A}/themes`, `${TH}/ajouter?site=${A}`, `${TH}/arene/details?site=${A}`, `${TH}/arene/apercu?site=${A}`]) {
        const html = (await boss.get(url)).text;
        const hrefs = [...html.matchAll(/href="(\/marketing\/site-web\/themes[^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
        assert.ok(hrefs.length > 0, url);
        for (const h of hrefs) assert.match(h, new RegExp(`[?&]site=${A}(&|$)`), `${url} → ${h}`);
        const forms = [...html.matchAll(/<form[^>]*action="(\/marketing\/site-web\/themes[^"]*)"[^>]*method="post"[^>]*>([\s\S]*?)<\/form>/g)];
        for (const f of forms) assert.ok(f[2].includes(`name="site" value="${A}"`), `${url} → formulaire ${f[1]} sans site`);
      }
      assert.match((await boss.get(`${SP}/${A}/themes`)).text, /Site : <strong>Alpha<\/strong>/);
    });
    test("menu : « Thèmes » est dans le groupe Apparence du site et mène à l'écran du site", async () => {
      const html = (await boss.get(`${SP}/${B}/themes`)).text;
      assert.ok(html.includes(`href="${SP}/${B}/themes"`), "entrée de menu du site B");
      assert.match((await boss.get(`${TH}`)).text, /href="\/marketing\/site-web\/themes"/);
    });
  });
});
