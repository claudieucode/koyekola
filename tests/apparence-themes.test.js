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
  const cards = (html) => [...html.matchAll(/<h2>([^<]+?)(?: <span[^>]*>[^<]*<\/span>)?<\/h2>\s*<p class="mk-th-meta">/g)].map((m) => m[1].trim());
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
      for (const f of ["<h1>Thèmes", "Ajouter un thème", "Rechercher des thèmes installés", "Actif : Kolakisa — d&#39;origine", "Aide"]) assert.ok(r.text.includes(f), f);
      assert.match(r.text, /class="mk-th-count"[^>]*>1</, "un seul thème installé : le thème d'origine");
      assert.deepEqual(cards(r.text), ["Kolakisa — d&#39;origine"]);
      assert.doesNotMatch(r.text, /\/activer"/, "le thème actif n'a pas de bouton « Activer »");
      assert.doesNotMatch(r.text, /Elementor|WPForms|Hostinger/);
    });
    test("la page d'ajout liste le vrai catalogue (5 thèmes, tous installables) et le formulaire d'import", async () => {
      const r = await boss.get(`${TH}/ajouter?site=${A}`);
      assert.equal(r.status, 200);
      assert.deepEqual(cards(r.text), ["Océan", "Ardoise sombre", "Savane", "Forêt", "Éditorial"]);
      assert.equal((r.text.match(/>Installer</g) || []).length, 5);
      assert.match(r.text, /name="package"/);
      const s = (await boss.get(`${TH}/ajouter?site=${A}&q=for%C3%AAt`)).text;
      assert.deepEqual(cards(s), ["Forêt"]);
      assert.match((await boss.get(`${TH}/ajouter?site=${A}&q=zzzz`)).text, /Aucun thème du catalogue ne correspond/);
    });
  });

  describe("installation", () => {
    test("installer un thème du catalogue : visible dans la liste du site, actions « inactif », et PAS sur les autres sites", async () => {
      const r = await install(boss, A, "ocean");
      assert.equal(r.status, 302); assert.equal(r.location, `${TH}?site=${A}`);
      const html = (await boss.get(r.location)).text;
      assert.match(flashOf(html), /Océan.*installé/);
      assert.deepEqual(cards(html), ["Kolakisa — d&#39;origine", "Océan"]);
      assert.match(html, /class="mk-th-count"[^>]*>2</);
      assert.match(html, new RegExp(`action="${TH}/ocean/activer"`)); assert.match(html, />Prévisualiser</); assert.match(html, />Détails</);
      assert.deepEqual(cards((await boss.get(`${SP}/${B}/themes`)).text), ["Kolakisa — d&#39;origine"], "le site B n'a pas reçu le thème");
      assert.deepEqual(cards((await boss.get(`${TH}`)).text), ["Kolakisa — d&#39;origine"], "le site principal non plus");
      assert.match((await boss.get(`${TH}/ajouter?site=${A}`)).text, /Installé/);
    });
    test("déjà installé, thème inconnu : refusés avec un message", async () => {
      const dup = await install(boss, A, "ocean");
      assert.match(flashOf((await boss.get(dup.location)).text), /déjà installé/);
      const unk = await install(boss, A, "n-existe-pas");
      assert.match(flashOf((await boss.get(unk.location)).text), /n'existe pas dans le catalogue/);
    });
    test("paquet valide importé ; recherche par nom ; le même identifiant ne s'installe pas deux fois", async () => {
      const r = await boss.post(`${TH}/installer`, { package: pkg(), site: String(A) });
      assert.match(flashOf((await boss.get(r.location)).text), /Mon thème.*installé/);
      const row = one("SELECT * FROM cms_themes WHERE theme_key = 'mon-theme'");
      assert.equal(row.site_id, A); assert.equal(row.source, "import"); assert.equal(JSON.parse(row.manifest).tokens.colors.primary, "#7c3aed"); assert.match(row.checksum, /^[0-9a-f]{64}$/);
      assert.deepEqual(cards((await boss.get(`${TH}?site=${A}&q=mon`)).text), ["Mon thème"]);
      assert.match((await boss.get(`${TH}?site=${A}&q=introuvable`)).text, /Aucun thème ne correspond/);
      const again = await boss.post(`${TH}/installer`, { package: pkg(), site: String(A) });
      assert.match(flashOf((await boss.get(again.location)).text), /déjà installé/);
    });
    test("paquets invalides : refusés, rien n'est écrit, message exploitable", async () => {
      const before = one("SELECT COUNT(*) n FROM cms_themes").n;
      const bad = [
        ["pas du json", "{oups", /pas du JSON valide/], ["vide", "   ", /Collez le contenu/], ["tableau", "[]", /objet JSON/],
        ["champ inconnu (code)", pkg({ script: "alert(1)" }), /n'est pas reconnu/], ["clé invalide", pkg({ key: "Mauvaise Clé!" }), /« key »/], ["clé réservée", pkg({ key: "kolakisa" }), /réservé/],
        ["sans nom", pkg({ name: "" }), /« name » est obligatoire/], ["version", pkg({ version: "v1" }), /1\.0\.0/], ["couleur invalide", pkg({ tokens: { colors: { primary: "rouge" } } }), /invalide/i],
        ["sans jetons", pkg({ tokens: undefined }), /« tokens »/], ["usurpe le catalogue", pkg({ key: "ocean" }), /catalogue Kolakisa, avec un contenu différent/], ["trop gros", pkg({ description: "x".repeat(70000) }), /volumineux/],
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
      for (const [path, body] of [[`${TH}/installer`, { key: "foret", site: String(A) }], [`${TH}/ocean/activer`, { site: String(A) }], [`${TH}/mon-theme/supprimer`, { site: String(A) }], [`${TH}/revenir`, { site: String(A) }]]) {
        assert.equal((await viewerA.post(path, body)).status, 403, path);
      }
      assert.equal(activeOf(A), "kolakisa"); assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'foret'").n, 0);
    });
    test("éditeur : peut installer mais ni activer ni supprimer (réservé aux administrateurs)", async () => {
      assert.equal((await install(editorA, A, "foret")).status, 302);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'foret' AND site_id = ?", A).n, 1);
      assert.equal((await editorA.post(`${TH}/foret/activer`, { site: String(A) })).status, 403);
      assert.equal((await editorA.post(`${TH}/foret/supprimer`, { site: String(A) })).status, 403);
      assert.equal(activeOf(A), "kolakisa");
    });
    test("accès limité au site A : aucune opération possible sur B, ni sur le principal, même forgée", async () => {
      assert.equal((await adminA.get(`${SP}/${B}/themes`)).status, 403);
      assert.equal((await adminA.get(`${TH}?site=${B}`)).status, 403);
      const bare = await adminA.get(`${TH}`); assert.ok(bare.status === 403 || (bare.status === 302 && bare.location === "/marketing/site-web/mes-sites"), "sans site : le principal est réservé à l'équipe (refus ou renvoi vers Mes sites)");
      assert.equal((await adminA.get(`${TH}/ajouter?site=${B}`)).status, 403);
      for (const body of [{ key: "ocean", site: String(B) }, { key: "ocean" }, { key: "ocean", site: "0" }, { key: "ocean", site: "abc" }]) assert.equal((await adminA.post(`${TH}/installer`, body)).status, 403, JSON.stringify(body));
      assert.equal((await adminA.post(`${TH}/ocean/activer`, { site: String(B) })).status, 403);
      assert.equal((await adminA.post(`${TH}/foret/supprimer`, { site: String(B) })).status, 403);
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
      const r = await adminA.post(`${TH}/ocean/activer`, { site: String(A) });
      assert.equal(r.status, 302); assert.equal(r.location, `${TH}?site=${A}`);
      const html = (await adminA.get(r.location)).text;
      assert.match(flashOf(html), /Océan.*activé/);
      assert.match(html, /Actif : Océan/); assert.match(html, /\/revenir"/);
      assert.equal(activeOf(A), "ocean"); assert.equal(tokensOf(A).colors.primary, "#0b6e99"); assert.equal(tokensOf(A).colors.background, "#eff9fd");
      // Rendu : la page de A utilise les jetons du thème
      const prev = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
      assert.ok(prev.toLowerCase().includes("--kw-primary:#0b6e99"), "la page du site A est rendue avec le thème actif");
      // Persistance après rechargement (nouvelle session)
      assert.match((await boss.get(`${SP}/${A}/themes`)).text, /Actif : Océan/);
      const log = one("SELECT * FROM mk_audit_logs WHERE action = 'theme.activated'");
      assert.ok(log && log.site_id === A, "activation journalisée avec son site");
    });
    test("isolation : B, C et le principal gardent leur thème, leurs jetons, leur liste et leur rendu", async () => {
      assert.equal(activeOf(B), "kolakisa"); assert.equal(activeOf(C), "kolakisa"); assert.equal(activeOf(null), "kolakisa");
      assert.deepEqual(tokensOf(B), {}); assert.deepEqual(tokensOf(C), {});
      assert.ok(!(await boss.get(`/marketing/pages/${pageB}/apercu`)).text.toLowerCase().includes("--kw-primary:#0b6e99"), "la page de B n'a pas le thème de A");
      assert.match((await boss.get(`${SP}/${B}/themes`)).text, /Actif : Kolakisa/);
      // Activer un autre thème sur B ne change rien pour A
      assert.equal((await boss.post(`${TH}/installer`, { key: "savane", site: String(B) })).status, 302);
      assert.equal((await boss.post(`${TH}/savane/activer`, { site: String(B) })).status, 302);
      assert.equal(activeOf(B), "savane"); assert.equal(tokensOf(B).colors.primary, "#b45309");
      assert.equal(activeOf(A), "ocean"); assert.equal(tokensOf(A).colors.primary, "#0b6e99");
      // Un thème installé sur A n'est pas activable depuis B (déjà installé là-bas = faux)
      const r = await boss.post(`${TH}/foret/activer`, { site: String(B) });
      assert.match(flashOf((await boss.get(r.location)).text), /n'est pas installé sur ce site/);
      assert.equal(activeOf(B), "savane");
    });
    test("le thème actif ne peut être activé deux fois ; thème non installé et clé invalide refusés", async () => {
      const again = await adminA.post(`${TH}/ocean/activer`, { site: String(A) });
      assert.match(flashOf((await adminA.get(again.location)).text), /déjà actif/);
      assert.equal((await boss.post(`${TH}/Pas%20Valide/activer`, { site: String(A) })).status, 302);
      assert.equal(activeOf(A), "ocean");
    });
    test("thème incompatible : affiché comme tel, sans bouton d'activation, activation refusée côté serveur", async () => {
      const m = { key: "futur", name: "Thème du futur", version: "9.0.0", author: "X", description: "", api: 2, tokens: { colors: { primary: "#111111" } } };
      db.prepare("INSERT INTO cms_themes (site_id, theme_key, name, version, source, manifest, checksum) VALUES (?, 'futur', 'Thème du futur', '9.0.0', 'import', ?, 'x')").run(A, JSON.stringify(m));
      const html = (await boss.get(`${TH}?site=${A}`)).text;
      assert.match(html, /Incompatible/); assert.doesNotMatch(html, /futur\/activer/);
      const r = await boss.post(`${TH}/futur/activer`, { site: String(A) });
      assert.match(flashOf((await boss.get(r.location)).text), /incompatible/);
      assert.equal(activeOf(A), "ocean"); assert.equal(tokensOf(A).colors.primary, "#0b6e99");
      assert.equal((await boss.post(`${TH}/futur/supprimer`, { site: String(A) })).status, 302);
    });
    test("revenir au thème précédent : jetons d'origine rétablis, thème d'origine actif, bouton disparu", async () => {
      const r = await adminA.post(`${TH}/revenir`, { site: String(A) });
      const html = (await adminA.get(r.location)).text;
      assert.match(flashOf(html), /Retour au thème « Kolakisa/);
      assert.equal(activeOf(A), "kolakisa"); assert.notEqual(tokensOf(A).colors && tokensOf(A).colors.primary, "#0b6e99");
      assert.doesNotMatch(html, /\/revenir"/, "plus de bouton de retour");
      assert.ok(!(await boss.get(`/marketing/pages/${pageA}/apercu`)).text.toLowerCase().includes("--kw-primary:#0b6e99"));
      const none = await adminA.post(`${TH}/revenir`, { site: String(A) });
      assert.match(flashOf((await adminA.get(none.location)).text), /Aucun thème précédent/);
    });
    test("les couleurs personnalisées du site survivent au changement de thème", async () => {
      const t = tokensOf(C); t.customColors = [{ key: "c-marque", label: "Marque", hex: "#123456" }];
      db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify(t), C);
      await boss.post(`${TH}/installer`, { key: "foret", site: String(C) }); await boss.post(`${TH}/foret/activer`, { site: String(C) });
      assert.equal(activeOf(C), "foret"); assert.equal(tokensOf(C).customColors[0].key, "c-marque");
    });
    test("site principal : activation = publication de l'apparence du principal, rendu public ; A, B, C inchangés ; brouillon en cours = refus", async () => {
      const appr = () => JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published);
      await boss.post(`${TH}/installer`, { key: "ardoise" });
      const r = await boss.post(`${TH}/ardoise/activer`, {});
      assert.equal(r.status, 302); assert.equal(r.location, TH);
      assert.match((await boss.get(r.location)).text, /Actif : Ardoise sombre/);
      assert.equal(appr().tokens.colors.primary, "#38bdf8"); assert.equal(activeOf(null), "ardoise");
      const home = (await boss.get("/")).text.toLowerCase();
      assert.ok(home.includes("#38bdf8"), "la page publique du site principal utilise le thème");
      assert.equal(activeOf(A), "kolakisa"); assert.equal(activeOf(B), "savane"); assert.equal(tokensOf(B).colors.primary, "#b45309");
      // Brouillon d'apparence en cours : refus clair, rien d'écrasé
      db.prepare("UPDATE appearance_configs SET draft = ? WHERE site_id IS NULL").run(JSON.stringify({ ...appr(), header: { ...appr().header, search: false } }));
      await boss.post(`${TH}/installer`, { key: "editorial" });
      const d = await boss.post(`${TH}/editorial/activer`, {});
      assert.match(flashOf((await boss.get(d.location)).text), /brouillon d'apparence/);
      assert.equal(activeOf(null), "ardoise");
      db.prepare("UPDATE appearance_configs SET draft = NULL WHERE site_id IS NULL").run();
      assert.equal((await boss.post(`${TH}/revenir`, {})).status, 302); assert.equal(activeOf(null), "kolakisa");
      assert.ok(!(await boss.get("/")).text.toLowerCase().includes("#38bdf8"));
    });
  });

  describe("aperçu réel", () => {
    test("la page d'aperçu garde le site, propose retour et activation, et encadre la vraie page du site avec ?kwtheme", async () => {
      const r = await boss.get(`${TH}/foret/apercu?site=${A}`);
      assert.equal(r.status, 200);
      assert.match(r.text, new RegExp(`src="/marketing/pages/${pageA}/apercu\\?kwtheme=foret"`));
      assert.match(r.text, /Retour à la liste des thèmes/); assert.ok(r.text.includes(`href="${TH}?site=${A}"`));
      assert.match(r.text, /Activer ce thème/, "Forêt est installé (inactif) sur A : activation proposée");
      assert.match((await boss.get(`${TH}/editorial/apercu?site=${A}`)).text, /Installer ce thème/, "thème du catalogue non installé sur A : installation proposée");
      const inst = (await boss.get(`${TH}/ocean/apercu?site=${B}`)).text;
      assert.match(inst, new RegExp(`src="/marketing/pages/${pageB}/apercu\\?kwtheme=ocean"`));
    });
    test("la page est rendue avec les jetons du thème, sans rien enregistrer ; hors équipe autorisée, aucun effet", async () => {
      const withTheme = (await boss.get(`/marketing/pages/${pageA}/apercu?kwtheme=editorial`)).text.toLowerCase();
      assert.ok(withTheme.includes("--kw-primary:#9f1239"), "aperçu avec le thème Éditorial");
      assert.equal(activeOf(A), "kolakisa"); assert.notEqual(tokensOf(A).colors && tokensOf(A).colors.primary, "#9f1239");
      const without = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text.toLowerCase();
      assert.ok(!without.includes("--kw-primary:#9f1239"));
      assert.ok(!(await adminA.get(`/marketing/pages/${pageB}/apercu?kwtheme=editorial`)).text.toLowerCase().includes("#9f1239"), "un accès limité à A ne voit pas B");
      const pub = await fetch(`${srv.base}/?kwtheme=editorial`, { redirect: "manual" });
      assert.ok(!(await pub.text()).toLowerCase().includes("#9f1239"), "un visiteur ne déclenche jamais l'aperçu");
      assert.match((await boss.get(`/marketing/pages/${pageA}/apercu?kwtheme=${encodeURIComponent("x';--")}`)).text, /Contenu|lp-/, "clé invalide ignorée");
    });
    test("site sans page : explication claire, aperçu généré affiché ; thème inconnu : 404", async () => {
      const r = await boss.get(`${TH}/ardoise/apercu?site=${C}`);
      assert.match(r.text, /n'a pas encore de page à afficher/); assert.match(r.text, /mk-th-shot/);
      assert.equal((await boss.get(`${TH}/nexiste-pas/apercu?site=${A}`)).status, 404);
    });
    test("fiche de détails : version, auteur, compatibilité, état et actions ; 404 si non installé sur CE site", async () => {
      const r = await boss.get(`${TH}/foret/details?site=${C}`);
      for (const f of ["Forêt", "Version", "1.0.0", "Équipe Kolakisa", "Compatible (format 1)", "Actif", "ne peut pas être supprimé"]) assert.ok(r.text.includes(f), f);
      assert.doesNotMatch(r.text, /\/supprimer"/, "le thème actif n'a pas de bouton de suppression");
      assert.equal((await boss.get(`${TH}/foret/details?site=${B}`)).status, 404, "Forêt n'est pas installé sur B");
      assert.equal((await boss.get(`${TH}/kolakisa/details?site=${B}`)).status, 200);
    });
  });

  describe("suppression", () => {
    test("le thème actif et le thème d'origine ne se suppriment pas", async () => {
      const a = await boss.post(`${TH}/foret/supprimer`, { site: String(C) });
      assert.match(flashOf((await boss.get(a.location)).text), /Le thème actif ne peut pas être supprimé/);
      const o = await boss.post(`${TH}/kolakisa/supprimer`, { site: String(C) });
      assert.match(flashOf((await boss.get(o.location)).text), /thème d'origine/);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'foret' AND site_id = ?", C).n, 1);
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
      await boss.post(`${TH}/installer`, { package: pkg({ key: "commun" }), site: String(A) }); await boss.post(`${TH}/installer`, { package: pkg({ key: "commun" }), site: String(B) });
      await boss.post(`${TH}/commun/supprimer`, { site: String(B) });
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'commun' AND site_id = ?", A).n, 1);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'commun' AND site_id = ?", B).n, 0);
    });
  });

  describe("site archivé, site inconnu, navigation", () => {
    test("site archivé : consultation seule, aucune écriture", async () => {
      db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(C);
      const html = (await boss.get(`${SP}/${C}/themes`)).text;
      assert.match(html, /archivé ou supprimé/); assert.doesNotMatch(html, /\/activer"|\/installer"|\/ajouter\?site|data-confirm/);
      const r = await boss.post(`${TH}/installer`, { key: "ocean", site: String(C) });
      assert.match(flashOf((await boss.get(r.location)).text), /archivé/);
      assert.equal(one("SELECT COUNT(*) n FROM cms_themes WHERE theme_key = 'ocean' AND site_id = ?", C).n, 0);
      db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(C);
    });
    test("site inconnu : 404, jamais le site principal", async () => {
      assert.equal((await boss.get(`${TH}?site=99999`)).status, 404);
      assert.equal((await boss.get(`${SP}/99999/themes`)).status, 404);
    });
    test("tous les liens et formulaires de la liste, de l'ajout, de la fiche et de l'aperçu gardent le site, jamais le principal", async () => {
      for (const url of [`${SP}/${A}/themes`, `${TH}/ajouter?site=${A}`, `${TH}/ocean/details?site=${A}`, `${TH}/ocean/apercu?site=${A}`]) {
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
