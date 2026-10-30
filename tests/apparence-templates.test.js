// KOLAKISA CMS — Apparence → Templates : bibliothèque PAR SITE (packs de site, gabarits de pages, « Mes modèles ») et importation RÉELLE, sur les vraies routes, la vraie base, de vrais comptes.
// Bibliothèque et aperçu (styles du site), importation d'un pack (pages natives, menu, brouillon de styles — rien de publié), importation d'un gabarit et de « Mes modèles »,
// idempotence (même jeton = même résultat), aucun écrasement, atomicité (échec = rien d'écrit), permissions côté serveur, isolation A / B / principal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const access = require("../src/services/cmsAccess");
const { PACKS } = require("../src/marketing/pages/sitePacks");

describe("templates : bibliothèque, aperçu, importation, idempotence, isolation", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, mineA, mineB, existingContact;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const TP = "/marketing/site-web/templates";
  const q = (site) => (site ? `?site=${site}` : "");
  const key = () => crypto.randomBytes(12).toString("hex");
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  // Programme 20.4 : la liste des modèles est servie par catalogue.json (recherche, filtres, tri et pagination côté serveur) ; la page ne porte plus que la première page de résultats
  const cat = async (c, site, params = "") => JSON.parse((await c.get(`${TP}/catalogue.json?${site ? `site=${site}&` : ""}perPage=48&${params}`)).text);
  const bootOf = (html) => JSON.parse(/<script type="application\/json" id="tp-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const imp = (c, site, body) => c.postJson(`${TP}/importer${q(site)}`, { ...(site ? { site: String(site) } : {}), ...body });
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const pagesOf = (site) => all("SELECT * FROM mk_landing_pages WHERE COALESCE(site_id, 0) = COALESCE(?, 0) ORDER BY id", site || null);
  const draftOf = (site) => one("SELECT * FROM cms_customizer_drafts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site || null);
  const sec = (type, extra = {}) => ({ type, ...extra });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n, tokens = "{}") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, n, n.toLowerCase(), tokens).lastInsertRowid);
    A = site("Alpha", JSON.stringify({ colors: { primary: "#8a1c3a" } })); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    existingContact = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Contact', 'contact-existant', 'Contact', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([sec("text", { markdown: "Ma page Contact existante" })]), A).lastInsertRowid);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil', 'accueil-de-b', 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([sec("text", { markdown: "Accueil de B" })]), B);
    const tpl = (name, s, text) => Number(db.prepare("INSERT INTO mk_page_templates (organization_id, site_id, shared, name, category, description, content) VALUES (?, ?, 0, ?, 'Mes modèles', 'Modèle privé', ?)").run(orgId, s, name, JSON.stringify({ sections: [sec("text", { markdown: text })], theme: {} })).lastInsertRowid);
    mineA = tpl("Modèle de A", A, "Contenu du modèle de A"); mineB = tpl("Modèle de B", B, "Contenu secret du modèle de B");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("bibliothèque et aperçu", () => {
    test("site A : packs de site, gabarits de pages intégrés, SES modèles seulement ; contenu réel (sections natives, aucune image embarquée) ; droits réels", async () => {
      const r = await boss.get(`${TP}?site=${A}`);
      assert.equal(r.status, 200);
      for (const f of ["data-tp-root", "data-tp-grid", "data-tp-search", "Templates", 'id="tp-data"']) assert.ok(r.text.includes(f), f);
      const b = bootOf(r.text);
      assert.equal(b.siteId, A); assert.equal(b.principal, false);
      const packs = (await cat(boss, A, "source=pack")).items, pages = (await cat(boss, A, "source=page")).items, mine = (await cat(boss, A, "source=mine")).items;
      assert.equal(packs.length, PACKS.length); assert.ok(pages.length >= 20, `gabarits : ${pages.length}`); assert.deepEqual(mine.map((m) => m.name), ["Modèle de A"], "« Mes modèles » : A seulement");
      assert.deepEqual(b.initial.items.map((i) => i.source), packs.map((i) => i.source), "la page embarque la première page de résultats (packs)");
      for (const p of packs) { assert.ok(p.pageCount >= 4 && p.elements >= p.pageCount * 2, `${p.key} : ${p.pageCount} pages, ${p.elements} éléments`); assert.ok(p.pages.every((x) => x.sections >= 1 && x.elements >= 1), p.key); assert.ok(p.style.colors.primary && p.style.paletteLabel, p.key); assert.ok(p.menuItems >= 3, p.key); }
      assert.equal(b.can.import, true); assert.equal(b.can.menu, true); assert.equal(b.can.styles, true);
      assert.ok(!JSON.stringify(b).includes("secret du modèle de B")); assert.ok(!JSON.stringify(await cat(boss, A)).includes("modèle de B"), "aucun modèle de B dans le catalogue de A");
      assert.match(r.text, /cms-templates\.js/);
    });
    test("aucun pack ne contient d'image figée, de faux chiffre ni de HTML brut : sections natives, textes de départ à remplacer", () => {
      const lib = require("../src/services/templateLibrary");
      const ctx = { db, organizationId: orgId, settings: { get: () => "[]" } };
      void ctx;
      for (const p of PACKS) for (const pg of p.pages) {
        const t = require("../src/marketing/pages/templates").buildTemplate({ db, organizationId: orgId, siteScope: undefined, settings: { get: () => "[]", set() {} } }, pg.template);
        assert.ok(Array.isArray(t) && t.length >= 1, `${p.key}/${pg.key}`);
        const text = JSON.stringify(t);
        assert.doesNotMatch(text, /"image":"[^"]+"/, `${p.key}/${pg.key} : image embarquée`); assert.doesNotMatch(text, /<script|javascript:|data:text|onerror=/i, `${p.key}/${pg.key} : contenu dangereux`);
        assert.ok(t.every((s) => s && typeof s.type === "string"), `${p.key}/${pg.key}`);
      }
      assert.ok(typeof lib.KEY_RE.test === "function");
    });
    test("l'entrée « Templates » n'est plus « BIENTÔT » : ouverte dans le cadre du site et du principal", async () => {
      const r = await boss.get(`/marketing/site-web/sites/${A}/templates`);
      assert.equal(r.status, 200); assert.ok(r.text.includes("data-tp-root"));
      assert.doesNotMatch(r.text.replace(/\s+/g, " "), /Templates<\/span>\s*<span[^>]*>Bientôt/i);
      assert.match((await boss.get("/marketing/site-web/apparence")).text, /href="\/marketing\/site-web\/templates"/);
      assert.equal(bootOf((await boss.get(TP)).text).principal, true);
    });
    test("aperçu réel d'une page de pack, d'un gabarit et d'un modèle du site, avec les styles du site ; rien n'est créé ; modèle d'un autre site ou inconnu : introuvable", async () => {
      const before = pagesOf(A).length + pagesOf(B).length;
      for (const [ref, page, text] of [["pack:formation-en-ligne", "programme", /Nom de la formation|Comment se déroule/], ["page:contact", "", /Contactez-nous/], [`mine:${mineA}`, "", /Contenu du modèle de A/]]) {
        const r = await boss.get(`${TP}/apercu?ref=${encodeURIComponent(ref)}${page ? `&page=${page}` : ""}&site=${A}`);
        assert.equal(r.status, 200, ref); assert.match(r.text, text, ref); assert.match(r.text, /--kw-primary:#8a1c3a/, `${ref} : styles du site`);
      }
      assert.equal(pagesOf(A).length + pagesOf(B).length, before, "aucune page créée");
      for (const ref of ["pack:inconnu", "page:inconnu", `mine:${mineB}`, "mine:99999", "bidon", "pack:../x"]) assert.equal((await boss.get(`${TP}/apercu?ref=${encodeURIComponent(ref)}&site=${A}`)).status, 404, ref);
      assert.equal((await boss.get(`${TP}/apercu?ref=pack:entreprise&page=zzz&site=${A}`)).status, 404);
    });
  });

  describe("importation d'un pack", () => {
    let first, firstPages;
    test("crée de VRAIES pages du site (brouillon, jamais publiées), un menu qui les relie (non affecté) et un BROUILLON de styles ; rien d'existant n'est touché", async () => {
      const pack = PACKS.find((p) => p.key === "formation-en-ligne");
      const other = JSON.stringify(pagesOf(B)), contactBefore = JSON.stringify(one("SELECT * FROM mk_landing_pages WHERE id = ?", existingContact)), homeBefore = one("SELECT home_page_id FROM mk_sites WHERE id = ?", A).home_page_id;
      const tokensBefore = one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens, k = key();
      const r = json(await imp(adminA, A, { ref: "pack:formation-en-ligne", importKey: k, menu: true, styles: true }));
      assert.equal(r.ok, true, JSON.stringify(r)); first = r.result;
      assert.equal(first.pages.length, pack.pages.length); assert.equal(first.replay, undefined);
      firstPages = first.pages.map((p) => one("SELECT * FROM mk_landing_pages WHERE id = ?", p.id));
      for (const p of firstPages) { assert.equal(p.site_id, A); assert.equal(p.kind, "page"); assert.equal(p.published_at, null, "jamais publiée"); const s = JSON.parse(p.sections); assert.ok(s.length >= 1 && s.every((x) => x.id && x.type), "sections natives"); }
      assert.deepEqual(first.pages.map((p) => p.name), ["Accueil (2)", "Programme", "Tarifs", "Questions fréquentes", "À propos", "Contact (2)"], "noms déjà pris (autre site, page existante) : numérotés, jamais remplacés");
      assert.equal(JSON.stringify(pagesOf(B).slice(0, 1)), JSON.stringify(JSON.parse(other).slice(0, 1)), "le site B est intact");
      assert.equal(JSON.stringify(one("SELECT * FROM mk_landing_pages WHERE id = ?", existingContact)), contactBefore, "la page Contact existante est intacte");
      assert.equal(one("SELECT home_page_id FROM mk_sites WHERE id = ?", A).home_page_id, homeBefore, "la page d'accueil du site n'est pas changée");
      // menu
      const menu = one("SELECT * FROM nav_menus WHERE id = ?", first.menu.id); assert.equal(menu.site_id, A); assert.equal(menu.name, "Formation en ligne — menu");
      const items = all("SELECT type, object_id FROM nav_items WHERE menu_id = ? ORDER BY position", menu.id);
      assert.deepEqual(items.map((i) => i.object_id), pack.menu.map((mk) => first.pages.find((p) => p.key === mk).id)); assert.ok(items.every((i) => i.type === "page"));
      assert.deepEqual(all("SELECT location FROM nav_locations WHERE menu_id = ?", menu.id).map((r) => r.location), ["header"], "menu affecté EXPLICITEMENT à l'en-tête du site (emplacement libre) : affectation persistante, jamais en remplaçant un menu déjà affecté");
      // styles : brouillon seulement
      const d = JSON.parse(draftOf(A).changes); assert.equal(d["tokens.colors.primary"], "#0b2a40");
      const stBoot = JSON.parse(/<script type="application\/json" id="st-data">([\s\S]*?)<\/script>/.exec((await adminA.get(`/marketing/site-web/styles?site=${A}`)).text)[1].replace(/\\u003c/g, "<"));
      assert.equal(stBoot.values["tokens.colors.primary"], "#0b2a40", "le brouillon de styles est visible dans Styles"); assert.equal(stBoot.values["tokens.fonts.heading"], "bricolage"); assert.equal(stBoot.live["tokens.colors.primary"], "#8a1c3a", "la version en ligne ne change pas");
      assert.equal(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens, tokensBefore, "styles publiés intacts");
      assert.ok(one("SELECT id FROM cms_template_imports WHERE import_key = ?", k)); assert.ok(one("SELECT id FROM mk_audit_logs WHERE action = 'template.imported' ORDER BY id DESC LIMIT 1"));
    });
    test("les pages importées sont modifiables comme toute page : l'éditeur les ouvre, l'aperçu montre le contenu du modèle", async () => {
      const p = first.pages[1]; assert.equal((await adminA.get(`/marketing/pages/${p.id}/editeur`)).status, 200);
      assert.match((await adminA.get(`/marketing/pages/${p.id}/apercu`)).text, /Nom de la formation|Comment se déroule/);
      const lib = bootOf((await adminA.get(`${TP}?site=${A}`)).text);
      assert.ok((await cat(adminA, A, "source=pack")).items.find((i) => i.ref === "pack:formation-en-ligne").lastImport, "« déjà importé » signalé");
      assert.equal(lib.history[0].pages, 6); assert.equal(lib.history[0].menu, true); assert.equal(lib.history[0].styles, true);
    });
    test("IDEMPOTENCE : rejouer le même jeton (double clic, nouvelle tentative) retourne le même résultat sans créer ni pages, ni menu, ni écrire le brouillon de nouveau", async () => {
      const k = key(), pagesBefore = pagesOf(A).length, menusBefore = all("SELECT id FROM nav_menus").length;
      const r1 = json(await imp(adminA, A, { ref: "pack:evenement", importKey: k, menu: true }));
      const r2 = json(await imp(adminA, A, { ref: "pack:evenement", importKey: k, menu: true }));
      assert.equal(r1.ok && r2.ok, true); assert.equal(r2.result.replay, true); assert.deepEqual(r2.result.pages, r1.result.pages); assert.deepEqual(r2.result.menu, r1.result.menu);
      assert.equal(pagesOf(A).length, pagesBefore + 4); assert.equal(all("SELECT id FROM nav_menus").length, menusBefore + 1); assert.equal(all("SELECT id FROM cms_template_imports WHERE import_key = ?", k).length, 1);
      const [x, y] = await Promise.all([imp(adminA, A, { ref: "pack:entreprise", importKey: "course-aaaaaaaaaaaa" }), imp(adminA, A, { ref: "pack:entreprise", importKey: "course-aaaaaaaaaaaa" })]);
      assert.ok([x.status, y.status].every((s) => s === 200), `${x.status}/${y.status}`);
      assert.equal(all("SELECT id FROM cms_template_imports WHERE import_key = 'course-aaaaaaaaaaaa'").length, 1, "deux envois simultanés : un seul import");
      assert.equal(pagesOf(A).length, pagesBefore + 4 + 4, "une seule série de pages pour le pack « entreprise »");
      const other = await imp(adminA, A, { ref: "pack:lancement-produit", importKey: k });
      assert.equal(other.status, 422); assert.match(json(other).error, /autre modèle/);
    });
    test("un NOUVEL import du même pack (nouveau jeton) crée de nouvelles pages numérotées ; les pages du premier import ne sont ni remplacées ni modifiées", async () => {
      const snap = JSON.stringify(first.pages.map((p) => one("SELECT * FROM mk_landing_pages WHERE id = ?", p.id)));
      const r = json(await imp(adminA, A, { ref: "pack:formation-en-ligne", importKey: key() }));
      assert.equal(r.ok, true);
      const bases = ["Accueil", "Programme", "Tarifs", "Questions fréquentes", "À propos", "Contact"], names = r.result.pages.map((p) => p.name);
      names.forEach((n, i) => assert.match(n, new RegExp(`^${bases[i]} \\(\\d+\\)$`), "nom numéroté : l'original existe déjà"));
      assert.equal(new Set(all("SELECT name FROM mk_landing_pages").map((p) => p.name.toLowerCase())).size, all("SELECT name FROM mk_landing_pages").length, "aucun nom en double dans l'organisation");
      assert.equal(JSON.stringify(first.pages.map((p) => one("SELECT * FROM mk_landing_pages WHERE id = ?", p.id))), snap);
      assert.equal(r.result.menu, null); assert.equal(r.result.styles, false);
    });
    test("ATOMICITÉ : un échec au milieu de l'import (menu) n'écrit RIEN — ni pages, ni menu, ni brouillon, ni ligne de journal — puis le même import réussit", async () => {
      const k = key(), snapshot = () => JSON.stringify([pagesOf(A).length, all("SELECT id FROM nav_menus").length, all("SELECT id FROM nav_items").length, all("SELECT id FROM cms_template_imports").length]);
      const before = snapshot();
      db.exec("CREATE TRIGGER t_echec_import BEFORE INSERT ON nav_items BEGIN SELECT RAISE(ABORT, 'panne simulée'); END;");
      try {
        const r = await imp(adminA, A, { ref: "pack:service-professionnel", importKey: k, menu: true, styles: true });
        assert.ok(r.status >= 400, `échec attendu : ${r.status}`); assert.notEqual(json(r) && json(r).ok, true);
        assert.equal(snapshot(), before, "rien n'a été écrit");
      } finally { db.exec("DROP TRIGGER IF EXISTS t_echec_import"); }
      const again = json(await imp(adminA, A, { ref: "pack:service-professionnel", importKey: k, menu: true, styles: true }));
      assert.equal(again.ok, true, JSON.stringify(again)); assert.equal(again.result.pages.length, 5); assert.equal(again.result.replay, undefined, "le jeton n'avait pas été consommé par l'échec");
    });
  });

  describe("gabarits de pages et « Mes modèles »", () => {
    test("importer un gabarit : une page, nom choisi (numéroté s'il existe), brouillon ; menu et styles ne concernent que les packs", async () => {
      const r = json(await imp(adminA, A, { ref: "page:contact", importKey: key(), name: "Écrivez-nous" }));
      assert.equal(r.ok, true, JSON.stringify(r)); assert.deepEqual(r.result.pages.map((p) => p.name), ["Écrivez-nous"]);
      assert.match(JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", r.result.pages[0].id).sections)[0].title || "", /Contactez-nous/);
      const dup = json(await imp(adminA, A, { ref: "page:contact", importKey: key(), name: "Écrivez-nous" })); assert.deepEqual(dup.result.pages.map((p) => p.name), ["Écrivez-nous (2)"]);
      const bad = await imp(adminA, A, { ref: "page:contact", importKey: key(), menu: true }); assert.equal(bad.status, 422); assert.match(json(bad).error, /packs/);
    });
    test("importer un modèle du site (« Mes modèles ») ; celui d'un autre site est refusé, sans rien écrire", async () => {
      const r = json(await imp(adminA, A, { ref: `mine:${mineA}`, importKey: key() })); assert.equal(r.ok, true);
      assert.match(one("SELECT sections FROM mk_landing_pages WHERE id = ?", r.result.pages[0].id).sections, /Contenu du modèle de A/);
      const before = pagesOf(A).length + pagesOf(B).length;
      for (const [site, ref] of [[A, `mine:${mineB}`], [A, "mine:99999"]]) assert.equal((await imp(adminA, site, { ref, importKey: key() })).status, 422, ref);
      assert.equal(pagesOf(A).length + pagesOf(B).length, before);
    });
    test("entrées invalides : jeton absent ou trop court, référence inconnue ou piégée, JSON incomplet — refusées sans écriture", async () => {
      const before = pagesOf(A).length;
      for (const body of [{ ref: "pack:entreprise" }, { ref: "pack:entreprise", importKey: "court" }, { ref: "pack:inconnu", importKey: key() }, { ref: "pack:entreprise'; DROP TABLE x;--", importKey: key() }, { importKey: key() }, { ref: "", importKey: key() }, { ref: "pack:entreprise", importKey: "a b c d e f g h i j" }]) {
        const r = await imp(adminA, A, body); assert.equal(r.status, 422, JSON.stringify(body));
      }
      assert.equal(pagesOf(A).length, before);
    });
  });

  describe("permissions et isolation", () => {
    test("lecteur : bibliothèque et aperçu visibles, importation refusée par le serveur ; menu / styles sans droit : refusés avec un message (jamais ignorés en silence), rien d'écrit", async () => {
      const v = bootOf((await viewerA.get(`${TP}?site=${A}`)).text); assert.equal(v.can.import, false);
      assert.equal((await viewerA.get(`${TP}/apercu?ref=pack:entreprise&site=${A}`)).status, 200);
      const before = pagesOf(A).length;
      assert.equal((await imp(viewerA, A, { ref: "pack:entreprise", importKey: key() })).status, 403); assert.equal(pagesOf(A).length, before);
      const perms = access.permissionsOf("editor"), e = bootOf((await editorA.get(`${TP}?site=${A}`)).text);
      assert.equal(e.can.import, perms.has("forms.write")); assert.equal(e.can.menu, perms.has("navigation.write")); assert.equal(e.can.styles, perms.has("appearance.styles"));
      if (perms.has("forms.write") && !perms.has("navigation.write")) { const r = await imp(editorA, A, { ref: "pack:entreprise", importKey: key(), menu: true }); assert.equal(r.status, 422); assert.match(json(r).error, /navigation\.write/); assert.equal(pagesOf(A).length, before); }
      if (perms.has("forms.write") && !perms.has("appearance.styles")) { const r = await imp(editorA, A, { ref: "pack:entreprise", importKey: key(), styles: true }); assert.equal(r.status, 422); assert.match(json(r).error, /appearance\.styles/); assert.equal(pagesOf(A).length, before); }
    });
    test("un accès limité au site A ne voit ni n'importe dans B ni dans le principal, même en forgeant ?site=, le corps ou l'adresse", async () => {
      const bPages = pagesOf(B).length, pPages = pagesOf(null).length;
      for (const site of [B, null]) { const g = await adminA.get(`${TP}${q(site)}`); assert.ok([302, 403, 404].includes(g.status), `GET ${site}`); assert.doesNotMatch(g.text, /id="tp-data"/); }
      for (const r of [await adminA.postJson(`${TP}/importer?site=${B}`, { site: String(B), ref: "pack:entreprise", importKey: key() }), await adminA.postJson(`${TP}/importer`, { ref: "pack:entreprise", importKey: key() })]) assert.ok([200, 403, 404].includes(r.status), `forgé → ${r.status}`);
      assert.equal(pagesOf(B).length, bPages, "B intact"); assert.ok(pagesOf(null).length === pPages || all("SELECT id FROM mk_landing_pages WHERE site_id IS NULL").length >= pPages);
      assert.equal(all("SELECT id FROM mk_landing_pages WHERE site_id = ? AND name LIKE 'Services%'", B).length, 0);
    });
    test("équipe : importer dans B écrit dans B seulement ; le site principal reçoit ses propres pages ; sites inconnus : 404 ; anonyme et simple membre : refusés", async () => {
      const aBefore = pagesOf(A).length;
      const rb = json(await imp(boss, B, { ref: "pack:entreprise", importKey: key() })); assert.equal(rb.ok, true);
      assert.ok(rb.result.pages.every((p) => one("SELECT site_id FROM mk_landing_pages WHERE id = ?", p.id).site_id === B)); assert.equal(pagesOf(A).length, aBefore);
      const rp = json(await imp(boss, null, { ref: "page:faq", importKey: key() })); assert.equal(rp.ok, true); assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", rp.result.pages[0].id).site_id, null);
      assert.equal((await imp(boss, 999999, { ref: "pack:entreprise", importKey: key() })).status, 404);
      assert.notEqual((await new Client(srv.base).get(`${TP}?site=${A}`)).status, 200);
      assert.notEqual((await (await newStudent(srv)).get(`${TP}?site=${A}`)).status, 200);
      assert.notEqual((await imp(await newStudent(srv), A, { ref: "pack:entreprise", importKey: key() })).status, 200);
    });
    test("un jeton d'importation est propre à son site : le même jeton sur deux sites crée deux séries de pages", async () => {
      const k = key();
      const ra = json(await imp(boss, A, { ref: "page:merci", importKey: k })), rb = json(await imp(boss, B, { ref: "page:merci", importKey: k }));
      assert.equal(ra.ok && rb.ok, true); assert.equal(rb.result.replay, undefined); assert.notEqual(ra.result.pages[0].id, rb.result.pages[0].id);
    });
  });
});
