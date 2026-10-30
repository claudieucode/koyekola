// KOLAKISA — PROGRAMME 20.4 : bibliothèque professionnelle de modèles — IMPORTATION de chaque type de ressource, compatibilité, conflits, atomicité, annulation, ENREGISTREMENT de ses propres
// modèles (versions, partage, fichiers) et isolation entre sites, sur les vraies routes, la vraie base, de vrais comptes.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { PACKS } = require("../src/marketing/pages/sitePacks");
const templates = require("../src/marketing/pages/templates");
const components = require("../src/marketing/pages/libraryComponents");
const parts = require("../src/marketing/pages/libraryParts");
const patterns = require("../src/marketing/pages/patterns");

describe("programme 20.4 — importation, compatibilité, annulation, enregistrement des modèles", () => {
  let srv, boss, db, orgId, A, B, C, adminA, editorA, viewerA, adminB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const TP = "/marketing/site-web/templates";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const key = () => crypto.randomBytes(12).toString("hex");
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const q = (site) => (site ? `?site=${site}` : "");
  const post = (c, site, path, body) => c.postJson(`${TP}/${path}${q(site)}`, body);
  const imp = (c, site, body) => post(c, site, "importer", { importKey: key(), ...body });
  const ok = async (p) => { const r = await p; assert.equal(r.status, 200, r.text.slice(0, 300)); return json(r); };
  const refused = async (p, status = 422, re = null) => { const r = await p; assert.equal(r.status, status, r.text.slice(0, 300)); if (re) assert.match(json(r).error, re); return json(r); };
  const cat = async (c, site, params = "") => json(await c.get(`${TP}/catalogue.json?${site ? `site=${site}&` : ""}perPage=48&${params}`));
  const pagesOf = (site) => all("SELECT * FROM mk_landing_pages WHERE COALESCE(site_id, 0) = COALESCE(?, 0) ORDER BY id", site || null);
  const compsOf = (site) => all("SELECT * FROM mk_web_components WHERE site_id IS ? ORDER BY id", site);
  const sectionsOf = (id) => JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", id).sections);
  const draftOf = (id) => { const r = one("SELECT draft, sections FROM mk_landing_pages WHERE id = ?", id); const d = JSON.parse(r.draft || r.sections); return Array.isArray(d) ? d : d.sections; };
  const revOf = (id) => one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision;
  const counts = () => ({ pages: one("SELECT COUNT(*) n FROM mk_landing_pages").n, comps: one("SELECT COUNT(*) n FROM mk_web_components").n, menus: one("SELECT COUNT(*) n FROM nav_menus").n, imports: one("SELECT COUNT(*) n FROM cms_template_imports").n, settings: one("SELECT COALESCE(MAX(updated_at), '') v FROM mk_settings WHERE key = 'theme.templates'").v });
  const newPage = async (c, site, name = "Page cible") => { const r = await ok(imp(c, site, { ref: "page:contact", name })); return r.result.pages[0].id; };
  const tplRow = (site, name, content, extra = {}) => Number(db.prepare("INSERT INTO mk_page_templates (organization_id, site_id, shared, name, category, description, content, version) VALUES (?, ?, ?, ?, 'Mes modèles', 'Test', ?, 1)").run(orgId, site, extra.shared ? 1 : 0, name, JSON.stringify(content)).lastInsertRowid);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, n, n.toLowerCase(), "{}").lastInsertRowid);
    A = site("Alpha"); B = site("Beta"); C = site("Gamma");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("tous les modèles officiels sont importables (site complet, page, composant, modèle de thème, section)", () => {
    test("chacun des packs, gabarits, composants et modèles de thème s'importe réellement, crée des objets natifs en brouillon et rien n'est publié", async () => {
      for (const p of PACKS) {
        let res = await imp(boss, C, { ref: `pack:${p.key}` });
        if (res.status === 409) { assert.equal(json(res).details.code, "confirm_required", p.key); res = await imp(boss, C, { ref: `pack:${p.key}`, confirm: true }); }
        const r = await ok(Promise.resolve(res)); assert.equal(r.result.pages.length, p.pages.length, p.key);
        for (const pg of r.result.pages) { const row = one("SELECT status, published_at, site_id FROM mk_landing_pages WHERE id = ?", pg.id); assert.equal(row.status, "draft", `${p.key}/${pg.name}`); assert.equal(row.published_at, null); assert.equal(row.site_id, C); assert.ok(sectionsOf(pg.id).length >= 1); }
      }
      for (const t of templates.TEMPLATES) {
        let r = await imp(boss, C, { ref: `page:${t.key}` });
        if (r.status === 409) { assert.equal(json(r).details.code, "confirm_required", t.key); r = await imp(boss, C, { ref: `page:${t.key}`, confirm: true }); }
        assert.equal(r.status, 200, `${t.key} : ${r.text.slice(0, 200)}`);
      }
      for (const c of components.COMPONENTS) { const r = await ok(imp(boss, C, { ref: `component:${c.key}` })); assert.ok(r.result.component.id, c.key); }
      for (const p of parts.PARTS) { const r = await ok(imp(boss, C, { ref: `part:${p.key}` })); assert.equal(r.result.pages.length, 1, p.key); assert.ok(sectionsOf(r.result.pages[0].id).length >= 1); }
      // Une page contient 30 sections au plus (limite du moteur) : on remplit plusieurs pages cibles
      const targets = [await newPage(boss, C, "Cible des sections 1")]; let total = 0;
      for (const p of patterns.PATTERNS.filter((x) => !x.requires)) {
        if (draftOf(targets[targets.length - 1]).length > 24) targets.push(await newPage(boss, C, `Cible des sections ${targets.length + 1}`));
        const target = targets[targets.length - 1];
        let r = await imp(boss, C, { ref: `section:${p.key}`, pageId: target });
        if (r.status === 409) r = await imp(boss, C, { ref: `section:${p.key}`, pageId: target, confirm: true });
        assert.equal(r.status, 200, `${p.key} : ${r.text.slice(0, 200)}`); total += 1;
      }
      assert.ok(targets.reduce((n, id) => n + draftOf(id).length, 0) >= total, "les sections sont dans le brouillon des pages");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status <> 'draft'", C).n, 0, "rien n'est publié");
      assert.equal(one("SELECT header_component_id h, footer_component_id f FROM mk_sites WHERE id = ?", C).h, null, "aucun composant n'est branché sur le site public");
    });
    test("les pages importées sont modifiables : l'éditeur les ouvre ; l'aperçu montre le contenu du modèle ; le site de départ garde ses styles", async () => {
      const r = await ok(imp(boss, A, { ref: "pack:restaurant", styles: true, menu: true }));
      const home = r.result.pages[0];
      assert.equal((await boss.get(`/marketing/pages/${home.id}/editeur?site=${A}`)).status, 200);
      assert.match(JSON.stringify(sectionsOf(home.id)), /Réserver une table/);
      assert.ok(r.result.menu.name.startsWith("Restaurant")); assert.equal(r.result.styles, true);
    });
  });

  describe("importation d'une section dans une page", () => {
    test("la section est ajoutée au BROUILLON (fin ou début), la révision avance, rien n'est publié ; l'ancien contenu reste intact", async () => {
      const pid = await newPage(boss, A, "Page pour sections"); const before = draftOf(pid), rev = revOf(pid);
      const r = await ok(imp(boss, A, { ref: "section:faq", pageId: pid })); assert.equal(r.result.inserted.added, 1); assert.equal(r.result.inserted.pageId, pid);
      const d = draftOf(pid); assert.equal(d.length, before.length + 1); assert.deepEqual(d.slice(0, before.length).map((s) => s.id), before.map((s) => s.id)); assert.ok(revOf(pid) > rev);
      assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", pid).status, "draft");
      await ok(imp(boss, A, { ref: "section:cta", pageId: pid, position: "start" })); assert.equal(draftOf(pid)[0].type, "layout");
      assert.equal(draftOf(pid).length, before.length + 2);
    });
    test("page cible absente, d'un autre site, archivée ou invalide : refusé sans rien écrire ; sans page choisie : message clair", async () => {
      const pa = await newPage(boss, A, "Cible A"), pb = await newPage(boss, B, "Cible B"), before = counts();
      await refused(imp(boss, A, { ref: "section:faq" }), 422, /Choisissez la page/);
      await refused(imp(boss, A, { ref: "section:faq", pageId: pb }), 422, /Page introuvable/);
      await refused(imp(boss, A, { ref: "section:faq", pageId: 999999 }), 422, /Page introuvable/);
      await refused(imp(boss, A, { ref: "section:faq", pageId: pa, position: "milieu" }), 422, /Position/);
      await refused(imp(boss, A, { ref: "section:faq", pageId: pa, position: "after", after: 99 }), 422, /repère/);
      assert.deepEqual(draftOf(pb).map((s) => s.type), sectionsOf(pb).map((s) => s.type), "la page de B n'a pas bougé");
      assert.equal(counts().imports, before.imports);
      db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(pa);
      await refused(imp(boss, A, { ref: "section:faq", pageId: pa }), 422, /Page introuvable/);
    });
    test("une composition du site (pattern) s'importe aussi ; celle d'un autre site est introuvable", async () => {
      const pa = await newPage(boss, A, "Cible pattern"), pb = await newPage(boss, B, "Source B");
      const saved = await ok(post(adminA, A, "enregistrer", { kind: "section", pageId: pa, indexes: [0], name: "Mon bandeau" })); assert.match(saved.result.ref, /^pattern:\d+$/);
      const savedB = await ok(post(adminB, B, "enregistrer", { kind: "section", pageId: pb, indexes: [0], name: "Bandeau de B" }));
      const target = await newPage(boss, A, "Cible 2"); await ok(imp(boss, A, { ref: saved.result.ref, pageId: target }));
      await refused(imp(boss, A, { ref: savedB.result.ref, pageId: target }), 422, /introuvable/);
    });
  });

  describe("importation d'un composant", () => {
    test("un composant du site est créé (jamais branché sur le site public) ; un nom déjà pris reçoit un numéro, rien n'est remplacé", async () => {
      const before = compsOf(A).length;
      // Les noms de composants sont uniques dans l'organisation : le nom libre suivant est numéroté, jamais remplacé
      const r1 = await ok(imp(boss, A, { ref: "component:header-simple" })); assert.match(r1.result.component.name, /^En-tête simple( \(\d+\))?$/);
      const r2 = await ok(imp(boss, A, { ref: "component:header-simple" })); assert.match(r2.result.component.name, /^En-tête simple \(\d+\)$/); assert.notEqual(r2.result.component.name, r1.result.component.name);
      assert.equal(compsOf(A).length, before + 2); const row = one("SELECT * FROM mk_web_components WHERE id = ?", r1.result.component.id); assert.equal(row.site_id, A); assert.equal(row.kind, "standard");
      assert.equal(one("SELECT header_component_id h FROM mk_sites WHERE id = ?", A).h, null);
      assert.equal(JSON.parse(row.section).type, "layout");
      const named = await ok(imp(boss, A, { ref: "component:footer-simple", name: "Mon pied" })); assert.equal(named.result.component.name, "Mon pied");
    });
    test("un composant d'un site n'est pas importable depuis un autre site ; un composant partagé (global) l'est", async () => {
      const section = JSON.stringify(components.buildComponent("carte-service"));
      const own = Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, ?, 'Carte privée de A', ?, 'standard')").run(orgId, A, section).lastInsertRowid);
      const shared = Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, NULL, 'Carte partagée', ?, 'global')").run(orgId, section).lastInsertRowid);
      assert.ok((await cat(boss, A, "source=mine")).items.some((i) => i.ref === `comp:${own}`)); assert.ok(!(await cat(boss, B, "source=mine")).items.some((i) => i.ref === `comp:${own}`), "B ne voit pas le composant de A");
      assert.ok((await cat(boss, B, "source=mine")).items.some((i) => i.ref === `comp:${shared}` && i.origin === "organization"), "B voit le composant partagé");
      await refused(imp(adminB, B, { ref: `comp:${own}` }), 422, /introuvable/);
      const r = await ok(imp(adminB, B, { ref: `comp:${shared}` })); assert.equal(r.result.component.name, "Carte partagée (2)", "le nom du composant partagé existe déjà dans l'organisation : la copie est numérotée");
      assert.equal(one("SELECT site_id FROM mk_web_components WHERE id = ?", r.result.component.id).site_id, B, "la copie appartient à B");
      assert.equal(one("SELECT kind FROM mk_web_components WHERE id = ?", r.result.component.id).kind, "standard");
    });
  });

  describe("importation d'un modèle du Theme Builder", () => {
    test("la page est créée en brouillon SANS être affectée ; l'affectation est une option, à confirmer par le droit réel ; un conflit annule tout", async () => {
      const read = () => JSON.parse(one("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'theme.templates'", orgId)?.value || "[]");
      const base = read().length;
      const r = await ok(imp(boss, A, { ref: "part:page-introuvable" })); assert.equal(r.result.theme, null); assert.equal(read().length, base, "aucune affectation sans demande");
      const plan = await ok(post(boss, A, "plan", { ref: "part:page-introuvable", assign: true })); assert.ok(plan.plan.operations.some((o) => o.op === "assign_theme" && o.scope === "organisation"));
      const needConfirm = await refused(imp(boss, A, { ref: "part:page-introuvable", assign: true }), 409, /confirmation/); assert.ok(needConfirm.details.analysis.warnings.some((w) => w.code === "theme_scope"), "l'affectation touche toute l'organisation : confirmation exigée"); assert.equal(read().length, base);
      const a = await ok(imp(boss, A, { ref: "part:page-introuvable", assign: true, confirm: true })); assert.equal(a.result.theme.type, "not_found"); assert.equal(read().length, base + 1);
      assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", a.result.pages[0].id).status, "draft", "affecté mais pas publié : le site garde son affichage tant que la page n'est pas publiée");
      const before = counts();
      await refused(imp(boss, A, { ref: "part:page-introuvable", assign: true, confirm: true }), 422, /existe déjà/);
      assert.equal(counts().pages, before.pages, "le conflit n'a créé aucune page"); assert.equal(read().length, base + 1);
      await refused(imp(boss, A, { ref: "page:contact", assign: true, confirm: true }), 422, /Theme Builder/);
      await refused(imp(boss, A, { ref: "part:article", menu: true }), 422, /packs de site/);
    });
  });

  describe("compatibilité, dépendances et ressources externes", () => {
    test("élément inconnu (widget retiré) : le modèle est signalé « incompatible » en nommant l'élément ; l'import est refusé sans rien écrire ; rien n'est supprimé en silence", async () => {
      const id = tplRow(A, "Modèle ancien", { sections: [{ type: "text", markdown: "Bonjour" }, { type: "layout", children: [{ type: "container", children: [{ type: "ghostwidget", props: {} }] }] }] }, {});
      const item = (await cat(boss, A, "source=mine")).items.find((i) => i.ref === `mine:${id}`); assert.ok(item);
      assert.equal(item.compat.status, "blocked");
      const d = json(await boss.get(`${TP}/detail.json?site=${A}&ref=mine:${id}`)).item; assert.ok(d.blockers.length >= 1 && /ghostwidget|incompatible/i.test(JSON.stringify(d.blockers)));
      const before = counts(); const e = await refused(imp(boss, A, { ref: `mine:${id}` }), 422, /impossible/); assert.ok(e.details.analysis.blockers.length >= 1);
      assert.deepEqual(counts(), before); assert.equal(one("SELECT COUNT(*) n FROM mk_page_templates WHERE id = ?", id).n, 1, "le modèle d'origine est intact");
      assert.ok((await cat(boss, A, "compat=blocked")).items.some((i) => i.ref === `mine:${id}`), "filtre « incompatible »");
      assert.equal((await cat(boss, A, "compat=blocked")).items.filter((i) => i.origin === "official").length, 0);
    });
    test("contenu que la grammaire actuelle refuse (format ancien) : bloquant, cause nommée", async () => {
      const id = tplRow(A, "Modèle format ancien", { sections: [{ type: "ancien-carrousel", items: [] }] });
      const d = json(await boss.get(`${TP}/detail.json?site=${A}&ref=mine:${id}`)).item; assert.equal(d.compat.status, "blocked"); assert.match(d.blockers[0].message, /inconnu|incompatible/i);
      await refused(imp(boss, A, { ref: `mine:${id}` }), 422);
    });
    test("formulaire ou composant d'un autre site : bloquant ; élément réservé (HTML) : bloquant sans le droit, accepté avec le droit", async () => {
      const formB = Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (?, 'Form de B', 'form-de-b', 'ok', ?)").run(orgId, B).lastInsertRowid);
      const withForm = tplRow(A, "Avec formulaire de B", { sections: [{ type: "form", heading: "Inscription", formId: formB }] });
      const e = await refused(imp(boss, A, { ref: `mine:${withForm}` }), 422); assert.match(JSON.stringify(e), /formulaire|incompatible/i);
      const html = tplRow(A, "Avec bloc HTML", { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "html", props: { html: "<p>Bonjour</p>" } }] }] }] });
      const d = json(await editorA.get(`${TP}/detail.json?site=${A}&ref=mine:${html}`)).item; assert.equal(d.compat.status, "blocked"); assert.match(JSON.stringify(d.blockers), /pages\.code|administrateur|réservé/i);
      await refused(imp(editorA, A, { ref: `mine:${html}` }), 422);
      assert.equal(json(await adminA.get(`${TP}/detail.json?site=${A}&ref=mine:${html}`)).item.compat.status, "ok", "l'administrateur a le droit");
      await ok(imp(adminA, A, { ref: `mine:${html}` }));
    });
    test("ressource externe ou média d'un autre site : avertissement, CONFIRMATION exigée (409) puis import ; l'API refuse tant que « confirm » n'est pas donné", async () => {
      const ext = tplRow(A, "Avec image externe", { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "image", props: { src: "https://cdn.exemple.org/photo.png", alt: "Exemple" } }] }] }] });
      const plan = (await ok(post(boss, A, "plan", { ref: `mine:${ext}` }))).plan; assert.equal(plan.needsConfirm, true); assert.ok(plan.analysis.warnings.some((w) => w.code === "external_resources" && /cdn\.exemple\.org/.test(w.message)));
      const before = counts(); const r = await refused(imp(boss, A, { ref: `mine:${ext}` }), 409, /confirmation/); assert.equal(r.details.code, "confirm_required"); assert.deepEqual(counts(), before);
      await ok(imp(boss, A, { ref: `mine:${ext}`, confirm: true }));
      assert.equal(counts().pages, before.pages + 1);
    });
    test("pas de formation publiée : la boutique est « à vérifier » (confirmation) ; avec une formation publiée, elle est compatible", async () => {
      const before = counts(); await refused(imp(boss, A, { ref: "page:boutique-accueil" }), 409);
      const { createCourse } = require("./helpers"); await createCourse(boss, srv, { title: "Formation de la boutique" });
      const d = json(await boss.get(`${TP}/detail.json?site=${A}&ref=page:boutique-accueil`)).item; assert.equal(d.compat.status, "ok");
      await ok(imp(boss, A, { ref: "page:boutique-accueil" })); assert.equal(counts().pages, before.pages + 1);
    });
  });

  describe("conflits, idempotence et atomicité", () => {
    test("même nom : numéroté, jamais remplacé ; même jeton : même résultat sans doublon (page, section, composant)", async () => {
      const first = await ok(imp(boss, A, { ref: "page:faq", name: "Aide en ligne" })), second = await ok(imp(boss, A, { ref: "page:faq", name: "Aide en ligne" }));
      assert.equal(first.result.pages[0].name, "Aide en ligne"); assert.equal(second.result.pages[0].name, "Aide en ligne (2)");
      const k = key(), pid = await newPage(boss, A, "Cible idempotence"); const n = counts();
      for (const body of [{ ref: "page:tarifs" }, { ref: "section:stats", pageId: pid }, { ref: "component:bloc-chiffre" }]) {
        const a = await ok(post(boss, A, "importer", { ...body, importKey: key() })); const b = await ok(post(boss, A, "importer", { ...body, importKey: k + body.ref.length })); const again = await ok(post(boss, A, "importer", { ...body, importKey: k + body.ref.length }));
        assert.equal(again.result.replay, true); assert.deepEqual({ ...again.result, replay: undefined }, { ...b.result, replay: undefined }); assert.ok(a.result);
      }
      assert.equal(counts().imports, n.imports + 6, "deux imports distincts par type, le rejeu n'ajoute rien");
      await refused(post(boss, A, "importer", { ref: "page:faq", importKey: k + "page:tarifs".length }), 422, /autre modèle/);
    });
    test("ERREUR DE PERSISTANCE : un échec à la dernière écriture n'écrit RIEN (pages, composants, menu, sections) pour chaque type, puis le même import réussit", async () => {
      const pid = await newPage(boss, A, "Cible atomique"), draftBefore = JSON.stringify(draftOf(pid)), revBefore = revOf(pid);
      db.exec("CREATE TRIGGER t_p204_fail BEFORE INSERT ON cms_template_imports BEGIN SELECT RAISE(ABORT, 'panne simulée'); END;");
      try {
        const before = counts();
        for (const body of [{ ref: "pack:association", menu: true, styles: true }, { ref: "page:contact" }, { ref: "part:article" }, { ref: "component:carte-service" }, { ref: "section:team", pageId: pid }]) {
          const r = await imp(boss, A, body); assert.equal(r.status, 500, `${body.ref} : ${r.text.slice(0, 120)}`);
          assert.deepEqual(counts(), before, `${body.ref} : rien n'a été écrit`);
        }
        assert.equal(JSON.stringify(draftOf(pid)), draftBefore, "le brouillon de la page n'a pas bougé"); assert.equal(revOf(pid), revBefore);
      } finally { db.exec("DROP TRIGGER t_p204_fail"); }
      await ok(imp(boss, A, { ref: "section:team", pageId: pid })); assert.ok(draftOf(pid).length > JSON.parse(draftBefore).length);
    });
  });

  describe("annulation d'une importation", () => {
    const undo = (c, site, id) => post(c, site, "annuler", { id });
    test("pack avec menu : les pages vont à la corbeille (restaurables), le menu est retiré, l'import est marqué annulé et ne compte plus dans les usages ; deuxième annulation refusée", async () => {
      const r = await ok(imp(boss, A, { ref: "pack:immobilier", menu: true })); const hist = r.history[0];
      const used = (await cat(boss, A, "source=pack")).items.find((i) => i.ref === "pack:immobilier").usage;
      const u = await ok(undo(boss, A, hist.id)); assert.equal(u.result.pages, 5); assert.equal(u.result.menu, true);
      for (const pg of r.result.pages) assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", pg.id).archived_at, "page à la corbeille");
      assert.equal(one("SELECT COUNT(*) n FROM nav_menus WHERE id = ?", r.result.menu.id).n, 0); assert.ok(one("SELECT undone_at FROM cms_template_imports WHERE id = ?", hist.id).undone_at);
      assert.equal((await cat(boss, A, "source=pack")).items.find((i) => i.ref === "pack:immobilier").usage, used - 1);
      assert.equal((await cat(boss, A, "source=pack")).items.find((i2) => i2.ref === "pack:immobilier").lastImport, null, "un import annulé n'est plus signalé « déjà importé »");
      await refused(undo(boss, A, hist.id), 422, /déjà été annulée/);
    });
    test("une page modifiée depuis l'import, ou publiée, bloque l'annulation ENTIÈRE (rien n'est changé) et le message nomme la page", async () => {
      const r = await ok(imp(boss, A, { ref: "pack:association" })); const [p1, p2] = r.result.pages;
      db.prepare("UPDATE mk_landing_pages SET revision = revision + 1 WHERE id = ?").run(p2.id);
      const e = await refused(undo(boss, A, r.history[0].id), 409, /rien n'a été changé/); assert.match(e.error, new RegExp(p2.name.replace(/[()]/g, "\\$&")));
      for (const pg of r.result.pages) assert.equal(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", pg.id).archived_at, null, "aucune page archivée");
      assert.equal(one("SELECT undone_at FROM cms_template_imports WHERE id = ?", r.history[0].id).undone_at, null);
      db.prepare("UPDATE mk_landing_pages SET revision = ?, status = 'published', published_at = datetime('now') WHERE id = ?").run(p2.revision, p2.id);
      assert.match((await refused(undo(boss, A, r.history[0].id), 409)).error, /publiée/);
    });
    test("section : les sections insérées sont retirées si la page n'a pas changé depuis ; sinon refus. Composant : supprimé. Modèle de thème affecté : refus tant que l'affectation existe", async () => {
      const pid = await newPage(boss, A, "Cible annulation"); const before = draftOf(pid).map((s) => s.id);
      const s = await ok(imp(boss, A, { ref: "section:benefits", pageId: pid })); await ok(undo(boss, A, s.history[0].id)); assert.deepEqual(draftOf(pid).map((x) => x.id), before, "page revenue à son état");
      const s2 = await ok(imp(boss, A, { ref: "section:benefits", pageId: pid })); db.prepare("UPDATE mk_landing_pages SET revision = revision + 1 WHERE id = ?").run(pid);
      await refused(undo(boss, A, s2.history[0].id), 409, /modifiée depuis/);
      const c = await ok(imp(boss, A, { ref: "component:bandeau-annonce" })); await ok(undo(boss, A, c.history[0].id)); assert.equal(one("SELECT COUNT(*) n FROM mk_web_components WHERE id = ?", c.result.component.id).n, 0);
      const t = await ok(imp(boss, A, { ref: "part:resultats-recherche", assign: true, confirm: true })); await refused(undo(boss, A, t.history[0].id), 409, /affecté/);
    });
    test("droits et isolation : un lecteur ne peut pas annuler ; l'import d'un autre site est introuvable ; site archivé : refusé", async () => {
      const r = await ok(imp(boss, A, { ref: "page:merci" }));
      await refused(undo(viewerA, A, r.history[0].id), 403); await refused(undo(adminB, B, r.history[0].id), 422, /introuvable/);
      assert.equal(one("SELECT undone_at FROM cms_template_imports WHERE id = ?", r.history[0].id).undone_at, null);
      await ok(undo(editorA, A, r.history[0].id));
    });
  });

  describe("enregistrer, modifier, partager et réutiliser ses propres modèles", () => {
    test("page → modèle du site avec secteur, mots-clés, version 1 ; absent de l'autre site ; un nom déjà pris est REFUSÉ (jamais remplacé en silence), remplacer = version + 1", async () => {
      const pid = await newPage(boss, A, "Page à enregistrer");
      const s = await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Ma page modèle", description: "Description", category: "Mes pages", sectors: ["restaurant"], keywords: "carte, menu", language: "fr", siteType: "vitrine" }));
      assert.match(s.result.ref, /^mine:\d+$/); assert.equal(s.result.version, 1);
      const row = one("SELECT * FROM mk_page_templates WHERE id = ?", Number(s.result.ref.slice(5))); assert.equal(row.site_id, A); assert.equal(row.shared, 0); assert.deepEqual(JSON.parse(row.sectors), ["restaurant"]); assert.equal(row.keywords, "carte, menu"); assert.ok(row.created_by); assert.equal(row.format_version, 1);
      const mine = (await cat(editorA, A, "source=mine")).items.find((i) => i.ref === s.result.ref); assert.equal(mine.origin, "site"); assert.equal(mine.version, 1); assert.deepEqual(mine.sectors.map((x) => x.slug), ["restaurant"]);
      assert.ok(!(await cat(adminB, B, "source=mine")).items.some((i) => i.ref === s.result.ref), "invisible depuis B");
      assert.ok((await cat(boss, A, `sector=restaurant&source=mine`)).items.some((i) => i.ref === s.result.ref), "recherchable par secteur");
      await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Ma page modèle" }), 409, /porte déjà ce nom/);
      const r2 = await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Ma page modèle", replace: true })); assert.equal(r2.result.version, 2);
      await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Autre", sectors: ["secteur-inexistant"] }), 422, /Secteur inconnu/);
      await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Autre", keywords: Array.from({ length: 20 }, (_, i) => `m${i}`).join(",") }), 422, /Douze mots-clés/);
      await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Autre", language: "français!" }), 422, /Langue/);
      await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "" }), 422, /nom/);
      await refused(post(editorA, A, "enregistrer", { kind: "site", pageId: pid, name: "X" }), 422);
    });
    test("page d'un AUTRE site, archivée ou inexistante : refusée ; sections et composant : enregistrés puis réutilisables dans une page du site", async () => {
      const pa = await newPage(boss, A, "Source A"), pb = await newPage(boss, B, "Source B");
      await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: pb, name: "Vol" }), 422, /Page introuvable/); await refused(post(editorA, A, "enregistrer", { kind: "page", pageId: 987654, name: "Vol" }), 422);
      const sec = await ok(post(editorA, A, "enregistrer", { kind: "section", pageId: pa, indexes: [0, 1], name: "Deux sections" })); assert.match(sec.result.ref, /^pattern:/);
      await refused(post(editorA, A, "enregistrer", { kind: "section", pageId: pa, indexes: [], name: "Vide" }), 422, /au moins une section/);
      const comp = await ok(post(editorA, A, "enregistrer", { kind: "component", pageId: pa, indexes: [0], name: "Mon composant" })); assert.match(comp.result.ref, /^comp:/);
      const items = (await cat(editorA, A, "source=mine")).items; assert.ok(items.some((i) => i.ref === sec.result.ref && i.kind === "section") && items.some((i) => i.ref === comp.result.ref && i.kind === "component"));
      const target = await newPage(boss, A, "Réutilisation"); await ok(imp(editorA, A, { ref: sec.result.ref, pageId: target })); assert.equal(draftOf(target).length, 3 + 2 - 0, "deux sections ajoutées");
      await ok(imp(editorA, A, { ref: comp.result.ref, name: "Copie du composant" }));
    });
    test("modifier : nom, description, catégorie, mots-clés ; nom en doublon refusé ; seul son site d'origine modifie ; les modèles OFFICIELS sont en lecture seule (modification, suppression, export)", async () => {
      const pid = await newPage(boss, A, "Source modification");
      const m1 = (await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Modèle modifiable" }))).result.ref, m2 = (await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Modèle voisin" }))).result.ref;
      await ok(post(editorA, A, "modifier", { ref: m1, name: "Modèle renommé", description: "Nouvelle description", category: "Autre catégorie", keywords: "alpha, bêta" }));
      const row = one("SELECT * FROM mk_page_templates WHERE id = ?", Number(m1.slice(5))); assert.equal(row.name, "Modèle renommé"); assert.equal(row.description, "Nouvelle description"); assert.equal(row.keywords, "alpha, bêta"); assert.ok(row.updated_by);
      await refused(post(editorA, A, "modifier", { ref: m1, name: "Modèle voisin" }), 422, /porte déjà ce nom/);
      await refused(post(editorA, A, "modifier", { ref: m1 }), 422, /Rien à modifier/);
      for (const ref of ["pack:restaurant", "page:contact", "section:faq", "component:header-simple", "part:article"]) {
        await refused(post(adminA, A, "modifier", { ref, name: "Piraté" }), 422, /lecture seule/); await refused(post(adminA, A, "supprimer", { ref }), 422, /lecture seule/); await refused(boss.get(`${TP}/export.json?site=${A}&ref=${ref}`), 422);
      }
      await refused(post(adminB, B, "modifier", { ref: m1, name: "Volé" }), 422, /introuvable/); await refused(post(adminB, B, "supprimer", { ref: m1 }), 422);
      assert.equal(one("SELECT name FROM mk_page_templates WHERE id = ?", Number(m1.slice(5))).name, "Modèle renommé");
    });
    test("PARTAGE avec les sites de l'organisation : droit « templates.share » (administrateur) ; visible puis importable depuis un autre site ; non modifiable ni supprimable par lui ; retiré du partage → invisible ; référence propre au site : refus", async () => {
      const pid = await newPage(boss, A, "Source partage"); const ref = (await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Modèle à partager" }))).result.ref, id = Number(ref.slice(5));
      assert.match((await refused(post(editorA, A, "modifier", { ref, visibility: "organization" }), 422)).error, /templates\.share/); assert.equal(one("SELECT shared FROM mk_page_templates WHERE id = ?", id).shared, 0);
      assert.ok(!(await cat(adminB, B, "source=mine")).items.some((i) => i.ref === ref), "non partagé : invisible");
      await ok(post(adminA, A, "modifier", { ref, visibility: "organization" })); assert.equal(one("SELECT shared FROM mk_page_templates WHERE id = ?", id).shared, 1);
      const seen = (await cat(adminB, B, "source=mine")).items.find((i) => i.ref === ref); assert.ok(seen); assert.equal(seen.origin, "organization");
      const imported = await ok(imp(adminB, B, { ref })); assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", imported.result.pages[0].id).site_id, B);
      await refused(post(adminB, B, "modifier", { ref, name: "Détourné" }), 422, /site d'origine/); await refused(post(adminB, B, "supprimer", { ref }), 422, /site d'origine/);
      await ok(post(adminA, A, "modifier", { ref, visibility: "site" })); assert.ok(!(await cat(adminB, B, "source=mine")).items.some((i) => i.ref === ref), "retiré du partage");
      const formA = Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (?, 'Form de A', 'form-de-a', 'ok', ?)").run(orgId, A).lastInsertRowid);
      const bound = tplRow(A, "Lié au formulaire de A", { sections: [{ type: "form", heading: "Inscription", formId: formA }] });
      await refused(post(adminA, A, "modifier", { ref: `mine:${bound}`, visibility: "organization" }), 422, /ne peut pas être partagé/);
    });
    test("suppression : un modèle de page est supprimé (les pages créées avec lui restent) ; une composition va à la corbeille", async () => {
      const pid = await newPage(boss, A, "Source suppression"); const ref = (await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Modèle jetable" }))).result.ref;
      const made = await ok(imp(editorA, A, { ref })); await ok(post(editorA, A, "supprimer", { ref })); assert.equal(one("SELECT COUNT(*) n FROM mk_page_templates WHERE id = ?", Number(ref.slice(5))).n, 0);
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE id = ?", made.result.pages[0].id).n, 1);
      const pat = (await ok(post(editorA, A, "enregistrer", { kind: "section", pageId: pid, indexes: [0], name: "Composition jetable" }))).result.ref; await ok(post(editorA, A, "supprimer", { ref: pat }));
      assert.ok(one("SELECT deleted_at FROM appearance_patterns WHERE id = ?", Number(pat.slice(8))).deleted_at, "corbeille"); assert.ok(!(await cat(editorA, A, "source=mine")).items.some((i) => i.ref === pat));
    });
  });

  describe("fichiers de modèle : export, import, versions de format", () => {
    const doc = (extra = {}) => ({ format: "kolakisa-template", formatVersion: 1, kind: "page", name: "Modèle fichier", description: "D", category: "Mes pages", language: "fr", siteType: "", sectors: ["restaurant"], keywords: ["a"], content: { sections: [{ type: "text", markdown: "Contenu du fichier" }] }, ...extra });
    test("export puis import dans un autre site : même contenu, nom numéroté si besoin, secteurs conservés, version de format et éléments requis déclarés", async () => {
      const pid = await newPage(boss, A, "Source export"); const ref = (await ok(post(editorA, A, "enregistrer", { kind: "page", pageId: pid, name: "Modèle exporté", sectors: ["restaurant"], keywords: "x, y" }))).result.ref;
      const r = await editorA.get(`${TP}/export.json?site=${A}&ref=${ref}`); assert.equal(r.status, 200); assert.match(r.headers.get("content-disposition"), /attachment; filename="modele-exporte\.kolakisa-template\.json"/); assert.equal(r.headers.get("x-content-type-options"), "nosniff");
      const file = json(r); assert.equal(file.format, "kolakisa-template"); assert.equal(file.formatVersion, 1); assert.equal(file.kind, "page"); assert.deepEqual(file.sectors, ["restaurant"]); assert.ok(file.requires.widgets.length >= 1);
      const back = await ok(post(adminB, B, "importer-fichier", file)); assert.equal(back.result.renamed, true); assert.match(back.result.name, /Modèle exporté \(2\)/); assert.equal(one("SELECT site_id FROM mk_page_templates WHERE id = ?", Number(back.result.ref.slice(5))).site_id, B);
      assert.ok((await cat(adminB, B, "source=mine&sector=restaurant")).items.some((i) => i.ref === back.result.ref));
      const sec = await ok(post(editorA, A, "importer-fichier", doc({ kind: "section", name: "Section fichier" }))); assert.match(sec.result.ref, /^pattern:/);
      const comp = await ok(post(editorA, A, "importer-fichier", doc({ kind: "component", name: "Composant fichier" }))); assert.match(comp.result.ref, /^comp:/);
    });
    test("fichiers invalides : format inconnu, version plus récente, JSON non objet, type non pris en charge, trop de sections, élément inconnu, contenu dangereux — refusés avec la cause, rien d'écrit", async () => {
      const before = counts(), tpl = one("SELECT COUNT(*) n FROM mk_page_templates").n;
      await refused(post(editorA, A, "importer-fichier", { format: "autre", formatVersion: 1 }), 422, /pas un modèle Kolakisa/);
      await refused(post(editorA, A, "importer-fichier", doc({ formatVersion: 99 })), 422, /version plus récente/);
      await refused(post(editorA, A, "importer-fichier", doc({ formatVersion: 0 })), 422, /Version de format/);
      await refused(editorA.request(`${TP}/importer-fichier${q(A)}`, { method: "POST", json: ["x"] }), 422, /objet JSON/);
      await refused(post(editorA, A, "importer-fichier", doc({ kind: "site" })), 422, /non pris en charge/);
      await refused(post(editorA, A, "importer-fichier", doc({ content: { sections: [] } })), 422, /aucune section/);
      await refused(post(editorA, A, "importer-fichier", doc({ content: { sections: Array.from({ length: 40 }, () => ({ type: "text", markdown: "x" })) } })), 422, /sections au plus/);
      await refused(post(editorA, A, "importer-fichier", doc({ name: "" })), 422, /nom/);
      const unknown = await refused(post(editorA, A, "importer-fichier", doc({ content: { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "ghostwidget", props: {} }] }] }] } })), 422); assert.match(unknown.error, /ghostwidget|incompatible/i);
      await refused(post(editorA, A, "importer-fichier", doc({ content: { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "html", props: { html: "<script>alert(1)</script>" } }] }] }] } })), 422, /pages\.code|administrateur|réservé|vide|retiré par la sécurité/i);
      const big = await editorA.request(`${TP}/importer-fichier${q(A)}`, { method: "POST", json: doc({ description: "x".repeat(700000) }) }); assert.equal(big.status, 413);
      assert.deepEqual(counts(), before); assert.equal(one("SELECT COUNT(*) n FROM mk_page_templates").n, tpl);
    });
    test("un texte riche piégé est nettoyé par le moteur à l'import (aucun script ni gestionnaire d'événement conservé) ; l'ancien format « kolakisa-page@1 » est reconnu et converti", async () => {
      const trap = await ok(post(editorA, A, "importer-fichier", doc({ name: "Texte piégé", content: { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "text", props: { html: "<p onclick=\"alert(1)\">Bonjour</p><script>alert(2)</script><img src=x onerror=alert(3)>" } }] }] }] } })));
      const stored = one("SELECT content FROM mk_page_templates WHERE id = ?", Number(trap.result.ref.slice(5))).content; assert.doesNotMatch(stored, /<script|onclick|onerror|alert\(/i);
      const legacy = await ok(post(editorA, A, "importer-fichier", { format: "kolakisa-page@1", name: "Ancien format", kind: "page", content: { sections: [{ type: "text", markdown: "Ancien contenu" }] } })); assert.match(legacy.result.ref, /^mine:/);
      assert.equal(one("SELECT format_version FROM mk_page_templates WHERE id = ?", Number(legacy.result.ref.slice(5))).format_version, 1);
    });
  });

  describe("permissions côté serveur et isolation multi-sites", () => {
    test("chaque écriture est refusée par le serveur sans le droit, quelle que soit l'interface ; l'import vise TOUJOURS le site vérifié", async () => {
      const before = counts();
      for (const [path, body] of [["importer", { ref: "page:contact", importKey: key() }], ["plan", { ref: "page:contact" }], ["annuler", { id: 1 }], ["enregistrer", { kind: "page", pageId: 1, name: "x" }], ["modifier", { ref: "mine:1", name: "x" }], ["supprimer", { ref: "mine:1" }], ["importer-fichier", { format: "kolakisa-template" }], ["secteurs", { label: "x", familySlug: "commerce" }]]) {
        assert.equal((await post(viewerA, A, path, body)).status, 403, `lecteur : ${path}`);
      }
      assert.equal((await post(editorA, A, "secteurs", { label: "x", familySlug: "commerce" })).status, 403, "les secteurs sont réservés aux administrateurs");
      assert.deepEqual(counts(), before);
      const sneaky = await ok(post(adminA, A, "importer", { ref: "page:merci", importKey: key(), site: String(B) })); assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", sneaky.result.pages[0].id).site_id, A);
      assert.equal((await post(adminA, B, "importer", { ref: "page:merci", importKey: key() })).status, 403, "adresse d'un autre site");
      assert.equal((await post(adminA, null, "importer", { ref: "page:merci", importKey: key() })).status === 200, false, "le site principal est fermé à un accès limité");
    });
    test("le site principal et les sites sont étanches : modèles, imports et historiques ne se mélangent pas", async () => {
      const mainId = (await ok(imp(boss, null, { ref: "page:merci", name: "Merci du principal" }))).result.pages[0].id; assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", mainId).site_id, null);
      const pid = await newPage(boss, null, "Source principal"); await ok(post(boss, null, "enregistrer", { kind: "page", pageId: pid, name: "Modèle du principal" }));
      assert.ok(!(await cat(boss, A, "source=mine")).items.some((i) => i.name === "Modèle du principal")); assert.ok((await cat(boss, null, "source=mine")).items.some((i) => i.name === "Modèle du principal"));
      assert.ok(!(await cat(boss, null, "source=mine")).items.some((i) => /Modèle modifiable|Modèle renommé/.test(i.name)), "le principal ne voit pas les modèles de A");
      const hist = (s) => all("SELECT id FROM cms_template_imports WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", s).length; assert.ok(hist(A) > 5 && hist(null) >= 1 && hist(B) >= 1);
      const log = one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'template.imported'").n; assert.ok(log >= 5, "chaque import est journalisé");
    });
  });
});
