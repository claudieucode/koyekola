// KOLAKISA CMS — Apparence → Styles : gestionnaire de styles globaux PAR SITE, sur les vraies routes, la vraie base, de vrais comptes.
// Écran (réglages de design uniquement), palettes lisibles (AA), brouillon PARTAGÉ avec Personnaliser (une seule valeur par réglage), publication réellement appliquée
// au moteur du site et au rendu, validation, conflits, permissions côté serveur, isolation A / B / principal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const palettes = require("../src/services/stylePalettes");
const tokensLib = require("../src/marketing/pages/tokens");

describe("styles : écran, palettes, brouillon partagé, publication, permissions, isolation", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, pageA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const ST = "/marketing/site-web/styles", PZ = "/marketing/site-web/personnaliser";
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const q = (site) => (site ? `?site=${site}` : "");
  const bootOf = (html) => JSON.parse(/<script type="application\/json" id="st-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const draftOf = (site) => one("SELECT * FROM cms_customizer_drafts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site || null);
  const post = (c, path, site, body) => c.postJson(`${PZ}${path}${q(site)}`, { ...(site ? { site: String(site) } : {}), ...body });
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    pageA = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'page-alpha', 'page-alpha', 'page-alpha', ?, 'published', 'page', ?, datetime('now'))").run(orgId, SECTIONS, A).lastInsertRowid);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("écran", () => {
    test("site A : seulement les réglages de DESIGN (palette, typographie, formes, boutons) ; l'identité, l'en-tête et le CSS restent dans Personnaliser", async () => {
      const r = await boss.get(`${ST}?site=${A}`);
      assert.equal(r.status, 200);
      for (const f of ["data-st-root", "data-st-save", "data-st-publish", "data-st-discard", "data-st-undo", "Guide de style", "Page du site", 'id="st-data"']) assert.ok(r.text.includes(f), f);
      const b = bootOf(r.text);
      assert.deepEqual(b.panels.map((p) => p.id), ["couleurs", "typographie", "mise-en-page", "boutons"]);
      const ids = b.panels.flatMap((p) => p.controls.map((c) => c.id));
      for (const id of ["tokens.colors.primary", "tokens.colors.accent", "tokens.fonts.heading", "tokens.type.h1.size", "tokens.radius.md", "tokens.space.md", "tokens.buttons.hover.bg", "tokens.link.color", "settings.layout.containerWidth"]) assert.ok(ids.includes(id), id);
      for (const id of ["name", "settings.identity.logoUrl", "settings.customCss", "header.logo.text", "footer.tagline"]) assert.ok(!ids.includes(id), `${id} n'est pas un réglage de Styles`);
      assert.equal(b.siteId, A); assert.equal(b.principal, false); assert.equal(b.can.edit, true); assert.equal(b.can.publish, true);
      assert.equal(b.base, "/marketing/site-web/personnaliser"); assert.equal(b.siteQuery, `?site=${A}`);
      assert.ok(Object.keys(b.fontStacks).length >= 5, "piles de polices pour le guide de style");
      assert.ok(Object.hasOwn(b.defaults, "tokens.colors.primary"), "valeurs d'origine de Kolakisa proposées");
      assert.match(r.text, /cms-styles\.js/);
    });
    test("site principal : sans « accent » (propre aux sites), avec les largeurs du principal ; autre site inconnu : 404", async () => {
      const b = bootOf((await boss.get(ST)).text);
      assert.equal(b.siteId, null); assert.equal(b.principal, true);
      const ids = b.panels.flatMap((p) => p.controls.map((c) => c.id));
      assert.ok(ids.includes("tokens.colors.primary") && ids.includes("tokens.sizes.content"));
      assert.ok(!ids.includes("tokens.colors.accent"), "accent : sites seulement");
      assert.ok(b.palettes.every((p) => !("accent" in p.colors)), "les palettes du principal n'écrivent pas l'accent");
      assert.equal((await boss.get(`${ST}?site=999999`)).status, 404);
    });
    test("l'entrée « Styles » n'est plus « BIENTÔT » : elle s'ouvre dans le cadre du site et du principal", async () => {
      const r = await boss.get(`/marketing/site-web/sites/${A}/styles`);
      assert.equal(r.status, 200); assert.ok(r.text.includes("data-st-root"));
      const nav = r.text.match(/Styles[\s\S]{0,300}/g) || [];
      assert.ok(nav.length > 0);
      assert.doesNotMatch(r.text.replace(/\s+/g, " "), /Styles<\/span>\s*<span[^>]*>Bientôt/i);
      const main = await boss.get("/marketing/site-web/apparence");
      assert.match(main.text, /href="\/marketing\/site-web\/styles"/);
    });
  });

  describe("palettes", () => {
    test("chaque palette est lisible (AA) : texte/fond, texte/surface, texte discret/fond, bouton/couleur principale", () => {
      assert.ok(palettes.PALETTES.length >= 6);
      for (const p of palettes.PALETTES) {
        const c = p.colors, r = (a, b) => tokensLib.contrast(a, b);
        assert.ok(r(c.text, c.background) >= 4.5, `${p.key} texte/fond`); assert.ok(r(c.text, c.surface) >= 4.5, `${p.key} texte/surface`);
        assert.ok(r(c.muted, c.background) >= 4.5, `${p.key} discret/fond`); assert.ok(r(tokensLib.onColor(c.primary), c.primary) >= 4.5, `${p.key} bouton`);
      }
    });
    test("chaque palette est acceptée par le moteur d'aperçu du site A et du principal (valeurs valides, CSS recalculé)", async () => {
      for (const p of palettes.PALETTES) {
        for (const site of [A, null]) {
          const changes = palettes.changesFor(p.key, site);
          const r = json(await post(boss, "/rendu", site, { changes }));
          assert.equal(r && r.ok, true, `${p.key} / ${site}`);
          assert.equal(r.warnings.length, 0, `${p.key} / ${site} : ${r.warnings.join(" ")}`);
        }
      }
      assert.equal(palettes.changesFor("inconnue", A), null);
    });
  });

  describe("brouillon partagé avec Personnaliser et publication", () => {
    test("une palette enregistrée par Styles apparaît dans Personnaliser (même brouillon, une seule valeur) et inversement", async () => {
      const ch = palettes.changesFor("bordeaux", A);
      const saved = json(await post(adminA, "/brouillon", A, { changes: ch }));
      assert.equal(saved.ok, true); assert.ok(draftOf(A));
      const stBoot = bootOf((await adminA.get(`${ST}?site=${A}`)).text);
      assert.equal(stBoot.changes["tokens.colors.primary"], "#8a1c3a");
      const pzBoot = JSON.parse(/<script type="application\/json" id="kwc-boot">([\s\S]*?)<\/script>/.exec((await adminA.get(`${PZ}?site=${A}`)).text)[1].replace(/\\u003c/g, "<"));
      assert.equal(pzBoot.changes["tokens.colors.primary"], "#8a1c3a", "Personnaliser voit le même brouillon");
      // un changement fait côté Personnaliser (identité) est conservé tel quel par Styles
      const both = { ...ch, "settings.identity.description": "Slogan du brouillon" };
      assert.equal(json(await post(adminA, "/brouillon", A, { changes: both, rev: saved.draft.rev })).ok, true);
      const b2 = bootOf((await adminA.get(`${ST}?site=${A}`)).text);
      assert.deepEqual(b2.outside, { "settings.identity.description": "Slogan du brouillon" }, "réglages hors Styles transmis pour être conservés");
      assert.equal(b2.outsideChanges, 1);
    });
    test("publier : le moteur du site ET le rendu utilisent les nouvelles couleurs ; l'autre site et le principal ne changent pas", async () => {
      const bBefore = JSON.stringify(tokensOf(B));
      const r = json(await post(adminA, "/publier", A, { rev: draftOf(A).rev }));
      assert.equal(r.ok, true); assert.ok(r.changed.includes("tokens.colors.primary"));
      assert.equal(tokensOf(A).colors.primary, "#8a1c3a");
      assert.equal(draftOf(A), undefined, "le brouillon est consommé");
      assert.equal(JSON.stringify(tokensOf(B)), bBefore, "le site B est intact");
      const preview = await boss.get(`/marketing/pages/${pageA}/apercu`);
      assert.match(preview.text, /--kw-primary:#8a1c3a/, "le rendu de la page du site utilise la couleur publiée");
      const stBoot = bootOf((await boss.get(`${ST}?site=${A}`)).text);
      assert.equal(stBoot.live["tokens.colors.primary"], "#8a1c3a"); assert.equal(stBoot.changes["tokens.colors.primary"], undefined);
      assert.ok(stBoot.history.length >= 1, "la publication figure dans les versions");
    });
    test("typographie, formes et boutons : publiés et relus après rechargement", async () => {
      const changes = { "tokens.fonts.heading": "georgia", "tokens.type.h1.size": 52, "tokens.radius.md": 18, "tokens.radius.button": 24, "tokens.shadow.card": "lg", "tokens.link.underline": "always", "tokens.buttons.paddingX": 28 };
      assert.equal(json(await post(adminA, "/brouillon", A, { changes })).ok, true);
      assert.equal(json(await post(adminA, "/publier", A, {})).ok, true);
      const t = tokensOf(A);
      assert.equal(t.fonts.heading, "georgia"); assert.equal(t.type.h1.size, 52); assert.equal(t.radius.md, 18); assert.equal(t.radius.button, 24); assert.equal(t.shadow.card, "lg"); assert.equal(t.link.underline, "always"); assert.equal(t.buttons.paddingX, 28);
      const b = bootOf((await adminA.get(`${ST}?site=${A}`)).text);
      assert.equal(b.live["tokens.fonts.heading"], "georgia"); assert.equal(b.values["tokens.type.h1.size"], 52);
      assert.match((await boss.get(`/marketing/pages/${pageA}/apercu`)).text, /--kw-h1-size:52px/);
    });
    test("annuler le brouillon : retour à la version en ligne ; revenir en arrière : anciennes valeurs placées dans le brouillon, rien n'est publié", async () => {
      assert.equal(json(await post(adminA, "/brouillon", A, { changes: { "tokens.colors.primary": "#000000" } })).ok, true);
      assert.ok(draftOf(A));
      assert.equal(json(await post(adminA, "/annuler", A, {})).ok, true); assert.equal(draftOf(A), undefined);
      assert.equal(tokensOf(A).colors.primary, "#8a1c3a", "rien n'a été publié");
      const hist = bootOf((await adminA.get(`${ST}?site=${A}`)).text).history;
      const first = hist[hist.length - 1];
      assert.equal(json(await post(adminA, "/restaurer", A, { version: first.id })).ok, true);
      assert.ok(draftOf(A), "les anciennes valeurs sont dans le brouillon"); assert.equal(tokensOf(A).colors.primary, "#8a1c3a");
      await post(adminA, "/annuler", A, {});
    });
  });

  describe("validation et conflits", () => {
    test("valeurs invalides refusées avec un message clair, rien n'est écrit : couleur, nombre hors limites, choix inconnu, réglage inexistant", async () => {
      const before = JSON.stringify(tokensOf(A));
      for (const [id, v, msg] of [["tokens.colors.primary", "rouge", /hexadécimal/], ["tokens.colors.primary", "#12345", /hexadécimal/], ["tokens.type.h1.size", 5, /entre 10 et 96/], ["tokens.type.h1.size", "abc", /entre 10 et 96/],
        ["tokens.radius.md", 500, /entre 0 et 48/], ["tokens.shadow.card", "énorme", /choix inconnu/], ["tokens.fonts.heading", "police-inconnue", /choix inconnu/], ["tokens.inexistant", "x", /inconnu/]]) {
        const r = await post(adminA, "/brouillon", A, { changes: { [id]: v } });
        assert.equal(r.status, 422, `${id}=${v}`); assert.match(json(r).error.message, msg);
      }
      assert.equal(draftOf(A), undefined); assert.equal(JSON.stringify(tokensOf(A)), before);
    });
    test("deux sessions : un brouillon périmé est refusé (rien d'écrasé) ; publier sans brouillon est refusé", async () => {
      const first = json(await post(adminA, "/brouillon", A, { changes: { "tokens.colors.secondary": "#14352a" } }));
      assert.equal(json(await post(adminA, "/brouillon", A, { changes: { "tokens.colors.secondary": "#0b2a40" }, rev: first.draft.rev })).ok, true);
      const stale = await post(adminA, "/brouillon", A, { changes: { "tokens.colors.secondary": "#000000" }, rev: first.draft.rev });
      assert.equal(stale.status, 422); assert.match(json(stale).error.message, /modifié depuis/);
      assert.equal(JSON.parse(draftOf(A).changes)["tokens.colors.secondary"], "#0b2a40");
      await post(adminA, "/annuler", A, {});
      const nothing = await post(adminA, "/publier", A, {});
      assert.equal(nothing.status, 422); assert.match(json(nothing).error.message, /Rien à publier/);
    });
  });

  describe("permissions et isolation", () => {
    test("lecteur : voit l'écran sans droit d'édition (le serveur refuse brouillon et publication) ; éditeur : brouillon seulement ; administrateur : tout", async () => {
      const v = bootOf((await viewerA.get(`${ST}?site=${A}`)).text);
      assert.equal(v.can.edit, false); assert.equal(v.can.publish, false);
      const ch = { "tokens.colors.secondary": "#14352a" };
      assert.equal((await post(viewerA, "/brouillon", A, { changes: ch })).status, 403);
      assert.equal(draftOf(A), undefined);
      const e = bootOf((await editorA.get(`${ST}?site=${A}`)).text);
      assert.equal(e.can.publish, false);
      assert.equal(json(await post(editorA, "/brouillon", A, { changes: ch })).ok, true);
      assert.equal((await post(editorA, "/publier", A, {})).status, 403);
      assert.notEqual(tokensOf(A).colors.secondary, "#14352a", "l'éditeur n'a rien publié");
      assert.equal(json(await post(adminA, "/publier", A, {})).ok, true); assert.equal(tokensOf(A).colors.secondary, "#14352a");
    });
    test("un accès limité au site A ne voit ni ne modifie B ni le principal, même en forgeant ?site=, le corps ou l'identifiant", async () => {
      for (const site of [B, null]) {
        const r = await adminA.get(`${ST}${q(site)}`);
        assert.ok([302, 403, 404].includes(r.status), `GET ${site} → ${r.status}`);
        assert.doesNotMatch(r.text, /id="st-data"/, "aucune donnée d'un autre site");
      }
      const bBefore = JSON.stringify(tokensOf(B));
      const forged = [await adminA.postJson(`${PZ}/brouillon?site=${B}`, { site: String(B), changes: { "tokens.colors.primary": "#111111" } }), await adminA.postJson(`${PZ}/brouillon?site=${A}`, { site: String(B), changes: { "tokens.colors.primary": "#111111" } }),
        await adminA.postJson(`${PZ}/publier?site=${B}`, { site: String(B) })];
      for (const f of [forged[0], forged[2]]) assert.ok(f.status === 403 || f.status === 404, `forgé → ${f.status}`);
      // « ?site=A » prime sur le champ du corps : la requête agit sur SON site (A), jamais sur B
      assert.equal(forged[1].status, 200); assert.ok(draftOf(A), "le brouillon forgé est celui du site A"); await post(adminA, "/annuler", A, {});
      assert.equal(draftOf(B), undefined); assert.equal(JSON.stringify(tokensOf(B)), bBefore);
      assert.equal((await adminA.get(`/marketing/site-web/sites/${B}/styles`)).status === 200, false);
    });
    test("anonyme : refusé ; membre simple : refusé", async () => {
      const { Client } = require("./helpers");
      const anon = new Client(srv.base);
      assert.notEqual((await anon.get(`${ST}?site=${A}`)).status, 200);
      const stranger = await newStudent(srv);
      assert.notEqual((await stranger.get(`${ST}?site=${A}`)).status, 200);
    });
    test("le site principal : brouillon puis publication écrivent dans son moteur d'apparence, sans toucher aux sites", async () => {
      const aBefore = JSON.stringify(tokensOf(A));
      assert.equal(json(await post(boss, "/brouillon", null, { changes: palettes.changesFor("foret", null) })).ok, true);
      assert.equal(json(await post(boss, "/publier", null, {})).ok, true);
      const published = JSON.parse(one("SELECT published FROM appearance_configs WHERE site_id IS NULL").published);
      assert.equal(published.tokens.colors.primary, "#1b5e3b");
      assert.equal(JSON.stringify(tokensOf(A)), aBefore);
      assert.match((await new (require("./helpers").Client)(srv.base).get("/")).text, /#1b5e3b/i, "le site public utilise la couleur publiée");
    });
  });
});
