// KOLAKISA CMS — Apparence → Personnaliser : brouillon, aperçu en direct, publication et versions PAR SITE, sur les vraies routes, la vraie base et de vrais comptes.
// Couleurs, typographie, identité, mise en page, CSS ; erreurs de validation (réseau simulé : conflit de version) ; permissions côté serveur ; isolation A / B / principal ;
// publication réelle vérifiée dans le moteur du site ET dans le rendu public, jamais sur la seule réponse de l'API.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("personnalisateur : brouillon, aperçu, publication, permissions, isolation", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, pageA, pageB, mediaA, mediaB, mediaMain;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const PZ = "/marketing/site-web/personnaliser";
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const draftOf = (site) => one("SELECT * FROM cms_customizer_drafts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site);
  const bootOf = (html) => JSON.parse(html.match(/<script type="application\/json" id="kwc-boot">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
  const q = (site) => (site ? `?site=${site}` : "");
  const post = (c, path, site, body) => c.postJson(`${PZ}${path}${q(site)}`, { ...(site ? { site: String(site) } : {}), ...body });
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const home = (c) => c.get("/");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const page = (slug, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, slug, slug, slug, SECTIONS, s).lastInsertRowid);
    pageA = page("page-alpha", A); pageB = page("page-beta", B);
    const med = (name, reach, siteId) => Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, name, path, mime, size, reach, site_id) VALUES (?, 'image', 'image', ?, ?, 'image/png', 10, ?, ?)").run(orgId, name, `/uploads/marketing/${name}.png`, reach, siteId).lastInsertRowid);
    mediaA = med("logo-a", "site", A); mediaB = med("logo-b", "site", B); mediaMain = med("logo-main", "shared", null);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("écran", () => {
    test("site A : écran plein cadre, réglages réels de CE site, médiathèque du site, aucune option sans effet", async () => {
      const r = await boss.get(`${PZ}?site=${A}`);
      assert.equal(r.status, 200);
      assert.ok(r.text.includes(`content="${A}"`), "le sélecteur d'images vise la médiathèque du site A");
      const boot = bootOf(r.text);
      assert.equal(boot.siteId, A); assert.equal(boot.siteName, "Alpha"); assert.equal(boot.principal, false);
      const ids = boot.panels.flatMap((p) => p.controls.map((c) => c.id));
      for (const id of ["tokens.colors.primary", "tokens.fonts.heading", "settings.layout.containerWidth", "settings.identity.logoUrl", "settings.identity.faviconUrl", "settings.customCss", "name"]) assert.ok(ids.includes(id), id);
      for (const id of ["header.logo.text", "footer.tagline", "tokens.sizes.content"]) assert.ok(!ids.includes(id), `${id} n'existe pas pour un site`);
      assert.deepEqual(boot.panels.map((p) => p.id), ["identite", "couleurs", "typographie", "mise-en-page", "arriere-plan", "images", "formulaires", "appareils", "mode-sombre", "palette", "en-tete", "menus", "pied", "boutons", "css"].filter((x) => boot.panels.some((p) => p.id === x)));
      assert.ok(boot.unsupported.length > 0, "ce que le moteur ne sait pas rendre est dit, pas caché");
      assert.doesNotMatch(r.text, /Elementor|WPForms|Astra/);
    });
    test("site principal : réglages du moteur d'apparence principal (en-tête, pied), pas ceux des sites", async () => {
      const boot = bootOf((await boss.get(PZ)).text);
      assert.equal(boot.siteId, null); assert.equal(boot.principal, true);
      const ids = boot.panels.flatMap((p) => p.controls.map((c) => c.id));
      for (const id of ["header.logo.text", "header.cta.label", "footer.copyright", "tokens.colors.primary", "tokens.sizes.content"]) assert.ok(ids.includes(id), id);
      for (const id of ["settings.identity.logoUrl", "settings.customCss", "name"]) assert.ok(!ids.includes(id), id);
    });
    test("site inconnu : 404 ; identifiant invalide : refusé", async () => {
      assert.equal((await boss.get(`${PZ}?site=999999`)).status, 404);
      assert.equal((await boss.get(`${PZ}?site=abc`)).status, 404);
    });
  });

  describe("aperçu en direct et validation", () => {
    test("une couleur change le CSS recalculé du site (et seulement celui-ci) ; rien n'est enregistré", async () => {
      const r = json(await post(boss, "/rendu", A, { changes: { "tokens.colors.primary": "#7c3aed" } }));
      assert.equal(r.ok, true); assert.equal(r.structural, false);
      assert.ok(r.assets.bodyStyle.includes("--kw-primary:#7c3aed"));
      assert.deepEqual(tokensOf(A), {}); assert.equal(draftOf(A), undefined, "l'aperçu n'écrit rien");
    });
    test("valeurs refusées : couleur invalide, nombre hors limites, réglage inconnu, réglage d'un autre type de site", async () => {
      const bad = [
        [{ "tokens.colors.primary": "rouge" }, /hexadécimal/], [{ "tokens.type.h1.size": 500 }, /entre 10 et 96/], [{ "tokens.fonts.heading": "comic" }, /inconnu/],
        [{ "n.existe.pas": 1 }, /Réglage inconnu/], [{ "header.logo.text": "X" }, /Réglage inconnu/], [{ "settings.layout.containerWidth": 5 }, /entre 480 et 1920/],
      ];
      for (const [changes, re] of bad) {
        const r = await post(boss, "/rendu", A, { changes });
        assert.equal(r.status, 422, JSON.stringify(changes));
        assert.match(json(r).error.message, re, JSON.stringify(changes));
      }
      assert.equal((await post(boss, "/rendu", A, { changes: [] })).status, 422);
    });
    test("un réglage qui change le contenu (nom) demande de recharger le cadre ; le CSS additionnel est validé", async () => {
      assert.equal(json(await post(boss, "/rendu", A, { changes: { name: "Alpha Nouveau" } })).structural, true);
      const css = await post(boss, "/rendu", A, { changes: { "settings.customCss": "@import url(x);" } });
      assert.equal(css.status, 422); assert.match(json(css).error.message, /CSS du site/);
      const ok = json(await post(boss, "/rendu", A, { changes: { "settings.customCss": ".ma-classe { color: #0b2a40; }" } }));
      assert.ok(ok.assets.custom.includes(".lp-site .ma-classe"), "le CSS du site est isolé par son préfixe");
    });
    test("avertissement de lisibilité quand le contraste est insuffisant", async () => {
      const r = json(await post(boss, "/rendu", A, { changes: { "tokens.colors.text": "#cccccc", "tokens.colors.background": "#ffffff" } }));
      assert.ok(r.warnings.some((w) => /contraste/.test(w)));
    });
    test("l'aperçu réel de la page applique la copie de travail de la session, pour CE site seulement", async () => {
      await post(boss, "/rendu", A, { changes: { name: "Alpha Aperçu", "tokens.colors.primary": "#7c3aed" } });
      const withParam = (await boss.get(`/marketing/pages/${pageA}/apercu?kwcustom=1`)).text;
      assert.ok(withParam.toLowerCase().includes("--kw-primary:#7c3aed"), "jetons du travail en cours");
      assert.ok(withParam.includes("Alpha Aperçu"), "nom du site en cours");
      const without = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
      assert.ok(!without.toLowerCase().includes("#7c3aed"), "sans le paramètre, la version en ligne");
      const other = (await boss.get(`/marketing/pages/${pageB}/apercu?kwcustom=1`)).text;
      assert.ok(!other.toLowerCase().includes("#7c3aed") && !other.includes("Alpha Aperçu"), "le site B n'est pas affecté");
      const visitor = await fetch(`${srv.base}/`, { redirect: "manual" });
      assert.ok(!(await visitor.text()).includes("#7c3aed"));
    });
  });

  describe("brouillon", () => {
    test("enregistrer, relire, conflit entre deux sessions, vider", async () => {
      const r = json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.secondary": "#102a43", "tokens.type.h1.size": 52 }, rev: 0 }));
      assert.equal(r.ok, true); assert.equal(r.draft.rev, 1); assert.equal(r.draft.count, 2);
      assert.deepEqual(JSON.parse(draftOf(A).changes), { "tokens.colors.secondary": "#102a43", "tokens.type.h1.size": 52 });
      const boot = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      assert.equal(boot.values["tokens.colors.secondary"], "#102a43"); assert.equal(boot.live["tokens.colors.secondary"], "#0b2a40"); assert.equal(boot.draft.rev, 1);
      // Une autre session enregistre pendant que la première a encore la version 1 sous les yeux
      assert.equal(json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.secondary": "#003366" }, rev: 1 })).draft.rev, 2);
      const stale = await post(boss, "/brouillon", A, { changes: { "tokens.type.h1.size": 40 }, rev: 1 });
      assert.equal(stale.status, 422); assert.match(json(stale).error.message, /modifié depuis/);
      assert.deepEqual(JSON.parse(draftOf(A).changes), { "tokens.colors.secondary": "#003366" }, "rien n'a été écrasé");
      // Un brouillon identique à la version en ligne disparaît
      json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.secondary": "#0b2a40" }, rev: 2 }));
      assert.equal(draftOf(A), undefined);
    });
    test("le brouillon d'un site n'est pas celui d'un autre ; annuler ne touche que ce site", async () => {
      json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.accent": "#ff6600" }, rev: 0 }));
      json(await post(boss, "/brouillon", B, { changes: { "tokens.colors.accent": "#00aa55" }, rev: 0 }));
      assert.equal(bootOf((await boss.get(`${PZ}?site=${A}`)).text).values["tokens.colors.accent"], "#ff6600");
      assert.equal(bootOf((await boss.get(`${PZ}?site=${B}`)).text).values["tokens.colors.accent"], "#00aa55");
      assert.equal(json(await post(boss, "/annuler", A, {})).ok, true);
      assert.equal(draftOf(A), undefined); assert.ok(draftOf(B), "le brouillon de B reste");
      json(await post(boss, "/annuler", B, {}));
    });
  });

  describe("publication réelle", () => {
    test("publier sur A : moteur du site, rendu de la page de A, version, journal ; B et le principal intacts", async () => {
      const principalBefore = one("SELECT published FROM appearance_configs WHERE site_id IS NULL");
      json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.primary": "#7c3aed", "tokens.fonts.heading": "georgia", "settings.layout.containerWidth": 1200, name: "Alpha Pro", "settings.identity.description": "Le meilleur" }, rev: 0 }));
      const r = await post(boss, "/publier", A, { rev: 1 });
      assert.equal(r.status, 200, r.text); const out = json(r);
      assert.equal(out.ok, true); assert.ok(out.changed.includes("tokens.colors.primary"));
      const site = one("SELECT * FROM mk_sites WHERE id = ?", A);
      assert.equal(site.name, "Alpha Pro"); assert.equal(tokensOf(A).colors.primary, "#7c3aed"); assert.equal(tokensOf(A).fonts.heading, "georgia");
      assert.equal(settingsOf(A).layout.containerWidth, 1200); assert.equal(settingsOf(A).identity.description, "Le meilleur");
      assert.equal(draftOf(A), undefined, "le brouillon est consommé");
      const prev = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text;
      assert.ok(prev.toLowerCase().includes("--kw-primary:#7c3aed"), "la page de A est rendue avec les nouveaux jetons"); assert.ok(prev.includes("Alpha Pro"));
      const v = one("SELECT * FROM cms_customizer_versions WHERE site_id = ?", A);
      assert.ok(v && JSON.parse(v.previous)["tokens.colors.primary"] === "#0277b6", "l'ancienne valeur est gardée pour revenir en arrière");
      const log = one("SELECT * FROM mk_audit_logs WHERE action = 'customizer.published'");
      assert.ok(log && log.site_id === A);
      // Persistance après rechargement (nouvelle lecture) + isolation
      assert.equal(bootOf((await boss.get(`${PZ}?site=${A}`)).text).live["tokens.colors.primary"], "#7c3aed");
      assert.deepEqual(tokensOf(B), {}); assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", B).name, "Beta");
      assert.ok(!(await boss.get(`/marketing/pages/${pageB}/apercu`)).text.toLowerCase().includes("#7c3aed"));
      assert.deepEqual(one("SELECT published FROM appearance_configs WHERE site_id IS NULL"), principalBefore);
    });
    test("rien à publier, ou version du brouillon périmée : refusé, rien n'est publié", async () => {
      assert.equal((await post(boss, "/publier", A, { rev: 1 })).status, 422);
      json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.accent": "#ff6600" }, rev: 0 }));
      const stale = await post(boss, "/publier", A, { rev: 99 });
      assert.equal(stale.status, 422); assert.match(json(stale).error.message, /changé depuis/);
      assert.equal(tokensOf(A).colors.accent, "#f59e0b", "la couleur du brouillon n'est pas publiée");
      assert.ok(draftOf(A), "le brouillon est conservé");
      // L'apparence du site a été publiée ailleurs depuis le début du brouillon : conflit, rien n'est appliqué
      db.prepare("UPDATE mk_sites SET settings_revision = settings_revision + 1 WHERE id = ?").run(A);
      const conflict = await post(boss, "/publier", A, { rev: draftOf(A).rev });
      assert.equal(conflict.status, 422); assert.match(json(conflict).error.message, /publiée par ailleurs/);
      json(await post(boss, "/annuler", A, {}));
    });
    test("revenir à une version : les anciennes valeurs vont dans le brouillon, rien n'est publié", async () => {
      const v = one("SELECT id FROM cms_customizer_versions WHERE site_id = ? ORDER BY id DESC", A).id;
      assert.equal(json(await post(boss, "/restaurer", A, { version: v })).ok, true);
      const d = JSON.parse(draftOf(A).changes);
      assert.equal(d["tokens.colors.primary"], "#0277b6"); assert.equal(tokensOf(A).colors.primary, "#7c3aed", "toujours en ligne tant qu'on ne publie pas");
      assert.equal(json(await post(boss, "/publier", A, { rev: draftOf(A).rev })).ok, true);
      assert.equal(tokensOf(A).colors.primary, "#0277b6");
      assert.equal((await post(boss, "/restaurer", A, { version: 99999 })).status, 422);
    });
    test("site principal : publier met à jour le moteur d'apparence et le site public", async () => {
      json(await post(boss, "/brouillon", null, { changes: { "tokens.colors.primary": "#7c3aed", "footer.copyright": "© Principal d'essai {année}", "header.announcement.enabled": true, "header.announcement.text": "Bienvenue" }, rev: 0 }));
      const r = await post(boss, "/publier", null, { rev: 1 });
      assert.equal(r.status, 200, r.text);
      const row = one("SELECT * FROM appearance_configs WHERE site_id IS NULL");
      assert.equal(JSON.parse(row.published).tokens.colors.primary, "#7c3aed");
      assert.equal(row.draft, null, "aucun brouillon d'apparence résiduel");
      const html = (await home(boss)).text;
      assert.ok(html.toLowerCase().includes("--accent:#7c3aed"), "le site public utilise la nouvelle couleur"); assert.ok(html.includes("Bienvenue")); assert.ok(html.includes("© Principal d&#39;essai") || html.includes("© Principal d'essai"));
      assert.deepEqual(tokensOf(B), {}, "les sites ne reçoivent rien du principal");
      assert.deepEqual(tokensOf(A).colors.primary, "#0277b6");
    });
    test("principal : un brouillon de l'Éditeur du site en cours bloque la publication (rien n'est publié par erreur)", async () => {
      db.prepare("UPDATE appearance_configs SET draft = published, draft_at = datetime('now') WHERE site_id IS NULL").run();
      const cfg = JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published); cfg.tokens.colors.secondary = "#223344";
      db.prepare("UPDATE appearance_configs SET draft = ? WHERE site_id IS NULL").run(JSON.stringify(cfg));
      json(await post(boss, "/brouillon", null, { changes: { "tokens.colors.secondary": "#102a43" }, rev: 0 }));
      const r = await post(boss, "/publier", null, { rev: draftOf(null).rev });
      assert.equal(r.status, 422); assert.match(json(r).error.message, /Éditeur du site/);
      db.prepare("UPDATE appearance_configs SET draft = NULL WHERE site_id IS NULL").run(); json(await post(boss, "/annuler", null, {}));
    });
  });

  describe("médias : uniquement ceux du site actif", () => {
    test("logo : image de A acceptée sur A ; image de B ou inconnue refusée ; image commune acceptée", async () => {
      const A1 = await post(boss, "/rendu", A, { changes: { "settings.identity.logoUrl": `/uploads/marketing/logo-a.png` } });
      assert.equal(A1.status, 200, A1.text);
      const B1 = await post(boss, "/rendu", A, { changes: { "settings.identity.logoUrl": `/uploads/marketing/logo-b.png` } });
      assert.equal(B1.status, 422); assert.match(json(B1).error.message, /n'appartient pas à la médiathèque de ce site/);
      assert.equal((await post(boss, "/rendu", A, { changes: { "settings.identity.faviconUrl": "/uploads/marketing/inconnu.png" } })).status, 422);
      assert.equal((await post(boss, "/rendu", A, { changes: { "settings.identity.logoUrl": `/uploads/marketing/logo-main.png` } })).status, 200);
      // Principal : image du site B refusée
      assert.equal((await post(boss, "/rendu", null, { changes: { "header.logo.mode": "image", "header.logo.mediaId": mediaB } })).status, 422);
      assert.equal((await post(boss, "/rendu", null, { changes: { "header.logo.mode": "image", "header.logo.mediaId": mediaMain } })).status, 200);
      void mediaA;
    });
  });

  describe("polices téléversées (Apparence → Polices)", () => {
    test("la police téléversée par A est proposée et acceptée pour A ; celle de B est refusée pour A ; un site qui l'utilise reste personnalisable", async () => {
      const font = (siteId, name) => Number(db.prepare("INSERT INTO cms_fonts (site_id, source, font_key, family, category) VALUES (?, 'upload', 'pending', ?, 'sans-serif')").run(siteId, name).lastInsertRowid);
      const fa = font(A, "Maison A"), fb = font(B, "Maison B");
      db.prepare("UPDATE cms_fonts SET font_key = 'font.u' || id WHERE id IN (?, ?)").run(fa, fb);
      const heading = bootOf((await boss.get(`${PZ}?site=${A}`)).text).panels.flatMap((p) => p.controls).find((c) => c.id === "tokens.fonts.heading");
      assert.ok(heading.options.some(([v]) => v === `font.u${fa}`), "la police de A est proposée à A");
      assert.ok(!heading.options.some(([v]) => v === `font.u${fb}`), "la police de B n'est jamais proposée à A");
      assert.equal((await post(boss, "/rendu", A, { changes: { "tokens.fonts.heading": `font.u${fb}` } })).status, 422, "police d'un autre site refusée");
      const ok = await post(boss, "/rendu", A, { changes: { "tokens.fonts.heading": `font.u${fa}` } });
      assert.equal(ok.status, 200, ok.text);
      // Publier la police puis changer AUTRE chose : la validation stricte ne doit pas refuser la police déjà en place
      json(await post(boss, "/brouillon", A, { changes: { "tokens.fonts.heading": `font.u${fa}` }, rev: 0 }));
      assert.equal((await post(boss, "/publier", A, { rev: draftOf(A).rev })).status, 200);
      assert.equal(tokensOf(A).fonts.heading, `font.u${fa}`);
      json(await post(boss, "/brouillon", A, { changes: { "tokens.colors.accent": "#ff6600" }, rev: 0 }));
      assert.equal((await post(boss, "/publier", A, { rev: draftOf(A).rev })).status, 200);
      json(await post(boss, "/brouillon", A, { changes: { "tokens.fonts.heading": "bricolage" }, rev: 0 }));
      assert.equal((await post(boss, "/publier", A, { rev: draftOf(A).rev })).status, 200);
    });
  });

  describe("permissions et isolation côté serveur", () => {
    test("lecteur de A : voit l'écran en lecture seule ; aperçu, brouillon, publication, annulation refusés (403)", async () => {
      const r = await viewerA.get(`${PZ}?site=${A}`); assert.equal(r.status, 200);
      const boot = bootOf(r.text); assert.equal(boot.can.edit, false); assert.equal(boot.can.publish, false);
      for (const path of ["/rendu", "/brouillon", "/publier", "/annuler", "/restaurer"]) assert.equal((await post(viewerA, path, A, { changes: { "tokens.colors.primary": "#111111" }, rev: 0, version: 1 })).status, 403, path);
    });
    test("éditeur de A : brouillon oui, publication non ; le CSS additionnel exige pages.code", async () => {
      assert.equal(bootOf((await editorA.get(`${PZ}?site=${A}`)).text).can.publish, false);
      const saved = await post(editorA, "/brouillon", A, { changes: { "tokens.colors.muted": "#445566" }, rev: 0 });
      assert.equal(saved.status, 200, saved.text);
      assert.equal((await post(editorA, "/publier", A, { rev: draftOf(A).rev })).status, 403);
      assert.equal(tokensOf(A).colors.muted, "#5b6b78", "rien n'est publié par un éditeur");
      const css = await post(editorA, "/rendu", A, { changes: { "settings.customCss": ".x { color: red; }" } });
      assert.equal(css.status, 422); assert.match(json(css).error.message, /pages\.code/);
      json(await post(editorA, "/annuler", A, {}));
    });
    test("administrateur de A : publie sur A ; CSS additionnel permis", async () => {
      json(await post(adminA, "/brouillon", A, { changes: { "settings.customCss": ".ma-classe { color: #0b2a40; }", "tokens.colors.accent": "#ff6600" }, rev: 0 }));
      assert.equal((await post(adminA, "/publier", A, { rev: draftOf(A).rev })).status, 200);
      assert.equal(settingsOf(A).customCss, ".ma-classe { color: #0b2a40; }"); assert.equal(tokensOf(A).colors.accent, "#ff6600");
    });
    test("accès limité à A : rien sur B ni sur le principal, même avec un site forgé (requête, formulaire, valeur invalide)", async () => {
      const snapB = JSON.stringify([one("SELECT * FROM mk_sites WHERE id = ?", B), draftOf(B)]), snapMain = JSON.stringify(one("SELECT * FROM appearance_configs WHERE site_id IS NULL"));
      assert.equal((await adminA.get(`${PZ}?site=${B}`)).status, 403);
      const bare = await adminA.get(PZ); assert.ok(bare.status === 403 || bare.status === 302, "sans site : le principal est réservé à l'équipe");
      for (const path of ["/rendu", "/brouillon", "/publier", "/annuler", "/restaurer"]) {
        for (const site of [B, null, "0", "abc"]) {
          const body = { changes: { "tokens.colors.primary": "#111111" }, rev: 0, version: 1, ...(site !== null ? { site: String(site) } : {}) };
          const r = await adminA.postJson(`${PZ}${path}${site !== null ? `?site=${site}` : ""}`, body);
          assert.equal(r.status, 403, `${path} site=${site}`);
        }
      }
      assert.equal(JSON.stringify([one("SELECT * FROM mk_sites WHERE id = ?", B), draftOf(B)]), snapB, "B inchangé");
      assert.equal(JSON.stringify(one("SELECT * FROM appearance_configs WHERE site_id IS NULL")), snapMain, "le principal est inchangé");
    });
    test("un site archivé est en lecture seule : aucune écriture", async () => {
      const arch = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, 'Vieux', 'vieux', '{}', 'archived')").run(orgId).lastInsertRowid);
      const boot = bootOf((await boss.get(`${PZ}?site=${arch}`)).text); assert.equal(boot.readOnly, true); assert.equal(boot.can.edit, false);
      for (const path of ["/rendu", "/brouillon", "/publier"]) assert.equal((await post(boss, path, arch, { changes: { "tokens.colors.primary": "#111111" }, rev: 0 })).status, 409, path);
      assert.equal(draftOf(arch), undefined);
    });
    test("visiteur non connecté : aucune réponse utile", async () => {
      const r = await fetch(`${srv.base}${PZ}?site=${A}`, { redirect: "manual" });
      assert.ok([301, 302, 303, 401, 403].includes(r.status)); assert.doesNotMatch(await r.text(), /kwc-boot/);
      const p = await fetch(`${srv.base}${PZ}/publier?site=${A}`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/json" }, body: "{}" });
      assert.ok([301, 302, 303, 401, 403].includes(p.status));
    });
  });

  describe("menu", () => {
    test("« Personnaliser » est dans Apparence, pour le site principal et pour un site (avec son identifiant)", async () => {
      assert.match((await boss.get("/marketing/site-web/themes")).text, /href="\/marketing\/site-web\/personnaliser"/);
      assert.match((await boss.get(`/marketing/site-web/sites/${A}/themes`)).text, new RegExp(`href="/marketing/site-web/personnaliser\\?site=${A}"`));
    });
  });
});
