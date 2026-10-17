// Site Web et Tunnels — phase 2 : fondations du moteur de pages commun (sur une vraie base marketing migrée).
// Brouillon séparé de la version en ligne, publication avec versions, restauration dans le brouillon, révisions
// concurrentes, design system, sites, composants globaux/locaux, isolation entre organisations.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const landing = require("../src/marketing/landing");
const { normalizeTokens, tokensToCss, DEFAULT_TOKENS } = require("../src/marketing/pages/tokens");
const { normalizeSection } = require("../src/marketing/pages/sections");

const hero = (title) => ({ type: "hero", title, subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" });
const text = (markdown) => ({ type: "text", markdown });
const row = (db, id) => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);

describe("brouillon, publication, versions", () => {
  const { db, A, B } = freshMarketing();
  let page;

  test("une page créée par le moteur est une page du même système que les pages d'atterrissage (/p/<adresse>)", () => {
    page = pages.createPage(A, { name: "Guide Photoshop" });
    assert.equal(page.kind, "page");
    assert.equal(landing.getPage(A, page.id).slug, "guide-photoshop", "même table, même adresse publique");
    assert.equal(page.hasDraft, false);
  });

  test("enregistrer le brouillon ne touche jamais la version en ligne", () => {
    pages.saveDraft(A, page.id, { sections: [hero("Version 1")], title: "Titre 1" }, { revision: 0 });
    pages.publish(A, page.id);
    const before = row(db, page.id);
    const { revision } = pages.saveDraft(A, page.id, { sections: [hero("Brouillon 2"), text("Nouveau")], title: "Titre 2" }, { revision: pages.getPage(A, page.id).revision });
    const after = row(db, page.id);
    assert.equal(after.sections, before.sections, "contenu en ligne inchangé");
    assert.equal(after.title, "Titre 1");
    assert.equal(JSON.parse(after.draft).sections[0].title, "Brouillon 2");
    assert.equal(landing.getPublishedPage(db, page.slug).sections[0].title, "Version 1", "le visiteur voit toujours la version en ligne");
    const p = pages.getPage(A, page.id);
    assert.equal(p.hasDraft, true);
    assert.equal(p.revision, revision);
    assert.equal(p.working.sections.length, 2);
  });

  test("chaque section reçoit un identifiant stable, conservé d'un enregistrement à l'autre", () => {
    const p = pages.getPage(A, page.id);
    const ids = p.working.sections.map((s) => s.id);
    assert.ok(ids.every((id) => /^[a-f0-9]{12}$/.test(id)));
    pages.saveDraft(A, page.id, { ...p.working }, { revision: p.revision });
    assert.deepEqual(pages.getPage(A, page.id).working.sections.map((s) => s.id), ids);
  });

  test("révision dépassée (autre onglet) : rien n'est écrasé, erreur claire", () => {
    const p = pages.getPage(A, page.id);
    pages.saveDraft(A, page.id, { sections: [hero("Onglet 1")] }, { revision: p.revision });
    assert.throws(() => pages.saveDraft(A, page.id, { sections: [hero("Onglet 2")] }, { revision: p.revision }), (e) => e.code === "conflict" && /modifiée ailleurs/.test(e.message));
    assert.equal(pages.getPage(A, page.id).working.sections[0].title, "Onglet 1");
  });

  test("publier : le brouillon passe en ligne, une version est créée, le brouillon est vidé", () => {
    const r = pages.publish(A, page.id);
    assert.equal(r.version, 2);
    const p = pages.getPage(A, page.id);
    assert.equal(p.hasDraft, false);
    assert.equal(p.status, "published");
    assert.equal(p.published.sections[0].title, "Onglet 1");
    assert.deepEqual(pages.listVersions(A, page.id).map((v) => v.number), [2, 1]);
  });

  test("restaurer une version : elle revient dans le BROUILLON, la version en ligne ne change pas", () => {
    const restored = pages.restoreVersion(A, page.id, 1);
    assert.equal(restored.working.sections[0].title, "Version 1");
    assert.equal(restored.published.sections[0].title, "Onglet 1", "en ligne : inchangé tant qu'on ne publie pas");
    assert.equal(landing.getPublishedPage(db, page.slug).sections[0].title, "Onglet 1");
    pages.discardDraft(A, page.id);
    assert.equal(pages.getPage(A, page.id).hasDraft, false);
    assert.throws(() => pages.getVersion(A, page.id, 99), /Version introuvable/);
  });

  test("publication refusée si la page n'est pas prête (section d'inscription sans formulaire) : rien ne change", () => {
    const p = pages.getPage(A, page.id);
    pages.saveDraft(A, page.id, { sections: [hero("Avec formulaire"), { type: "form", heading: "Inscription" }] }, { revision: p.revision });
    assert.throws(() => pages.publish(A, page.id), (e) => e.code === "preflight_failed");
    assert.equal(pages.getPage(A, page.id).published.sections[0].title, "Onglet 1");
    assert.equal(pages.listVersions(A, page.id).length, 2, "aucune version créée");
  });

  test("SEO de la page : validé (adresse canonique https, image de la médiathèque)", () => {
    const p = pages.getPage(A, page.id);
    const r = pages.saveDraft(A, page.id, { sections: [hero("x")], seo: { title: "Titre SEO", description: "Desc", canonical: "https://kolakisa.com/p/guide", noindex: true, ogImage: "/uploads/marketing/1/a.png" } }, { revision: p.revision });
    assert.deepEqual(r.content.seo, { title: "Titre SEO", description: "Desc", canonical: "https://kolakisa.com/p/guide", noindex: true, ogImage: "/uploads/marketing/1/a.png" });
    assert.throws(() => pages.saveDraft(A, page.id, { seo: { canonical: "javascript:alert(1)" } }, { revision: r.revision }), /canonique/);
  });

  test("isolation : une autre organisation ne voit ni ne modifie la page", () => {
    assert.equal(pages.getPage(B, page.id), null);
    assert.throws(() => pages.saveDraft(B, page.id, { sections: [] }, { revision: 0 }), /introuvable/);
    assert.throws(() => pages.publish(B, page.id), /introuvable/);
    assert.throws(() => pages.restoreVersion(B, page.id, 1), /introuvable/);
  });

  test("dupliquer : copie hors ligne, nouvelle adresse, nouveaux identifiants de section ; archiver puis restaurer", () => {
    const copy = pages.duplicatePage(A, page.id);
    assert.equal(copy.name, "Guide Photoshop (copie)");
    assert.equal(copy.status, "draft");
    assert.notEqual(copy.slug, page.slug);
    const ids = new Set(pages.getPage(A, page.id).working.sections.map((s) => s.id));
    assert.ok(copy.working.sections.every((s) => !ids.has(s.id)));
    pages.archivePage(A, page.id);
    assert.equal(landing.getPublishedPage(db, page.slug), null, "archivée : hors ligne");
    assert.throws(() => pages.saveDraft(A, page.id, { sections: [] }, { revision: pages.getPage(A, page.id).revision }), /archivée/);
    pages.restorePage(A, page.id);
    assert.equal(pages.getPage(A, page.id).status, "unpublished", "jamais republiée d'office");
  });
});

describe("design system", () => {
  test("jetons complets : valeurs invalides remplacées par défaut, ou refusées à l'enregistrement", () => {
    const t = normalizeTokens({ colors: { primary: "#FF0000", text: "rouge" }, space: { md: 9999 }, fonts: { heading: "comic" } });
    assert.equal(t.colors.primary, "#ff0000");
    assert.equal(t.colors.text, DEFAULT_TOKENS.colors.text);
    assert.equal(t.space.md, DEFAULT_TOKENS.space.md);
    assert.equal(t.fonts.heading, DEFAULT_TOKENS.fonts.heading);
    assert.throws(() => normalizeTokens({ colors: { text: "rouge" } }, { strict: true }), /Texte/);
    assert.equal(Object.keys(t.colors).length, 10);
    assert.deepEqual(Object.keys(t.type), ["h1", "h2", "h3", "h4", "h5", "h6", "body", "caption", "button"]);
    assert.deepEqual(Object.keys(t.space), ["xs", "sm", "md", "lg", "xl", "xxl"]);
  });

  test("variables CSS : une modification de jeton change réellement la variable ; aucune injection possible", () => {
    const css = tokensToCss({ colors: { primary: "#123456" }, type: { h1: { size: 50 } } });
    assert.match(css, /--kw-primary:#123456;/);
    assert.match(css, /--kw-h1-size:50px;/);
    assert.match(css, /--kw-space-xxl:96px;/);
    assert.match(css, /--kw-font-heading:'Bricolage Grotesque'/);
    const evil = tokensToCss({ colors: { primary: "red;}</style><script>" }, border: { color: "#000;x" } });
    assert.doesNotMatch(evil, /<|script|;x/);
  });
});

describe("sites", () => {
  const { db, A, B } = freshMarketing();
  let site;

  test("créer, renommer, modifier le design system (refus des valeurs invalides)", () => {
    site = pages.createSite(A, { name: "Académie Photoshop" });
    assert.equal(site.tokens.colors.primary, DEFAULT_TOKENS.colors.primary);
    assert.throws(() => pages.createSite(A, { name: "académie photoshop" }), /déjà ce nom/);
    const up = pages.updateSite(A, site.id, { name: "Académie Photo", tokens: { ...site.tokens, colors: { ...site.tokens.colors, primary: "#aa0000" } } });
    assert.equal(up.name, "Académie Photo");
    assert.equal(up.tokens.colors.primary, "#aa0000");
    assert.throws(() => pages.updateSite(A, site.id, { tokens: { colors: { primary: "rouge" } } }), /hexadécimal/);
    assert.equal(pages.getSite(B, site.id), null);
  });

  test("pages du site, page d'accueil, déplacement ; une page d'un autre site ne peut pas être l'accueil", () => {
    const home = pages.createPage(A, { name: "Accueil", siteId: site.id });
    const other = pages.createPage(A, { name: "Libre" });
    pages.setHomePage(A, site.id, home.id);
    assert.equal(pages.getSite(A, site.id).home_page_id, home.id);
    assert.throws(() => pages.setHomePage(A, site.id, other.id), /page de ce site/);
    pages.movePage(A, other.id, site.id);
    assert.deepEqual(pages.sitePages(A, site.id).map((p) => p.name), ["Accueil", "Libre"]);
    assert.equal(pages.listSites(A)[0].pages, 2);
  });

  test("dupliquer un site : design system et pages copiés en brouillon, accueil reporté", () => {
    const copy = pages.duplicateSite(A, site.id);
    assert.equal(copy.name, "Académie Photo (copie)");
    assert.equal(copy.tokens.colors.primary, "#aa0000");
    const copied = pages.sitePages(A, copy.id);
    assert.equal(copied.length, 2);
    assert.ok(copied.every((p) => p.status === "draft"));
    assert.equal(pages.getPage(A, copy.home_page_id).name, "Accueil (copie)");
  });

  test("archiver un site : ses pages en ligne passent hors ligne ; restaurer ne republie rien", () => {
    const home = pages.sitePages(A, site.id).find((p) => p.name === "Accueil");
    pages.saveDraft(A, home.id, { sections: [hero("Bienvenue")] }, { revision: pages.getPage(A, home.id).revision });
    pages.publish(A, home.id);
    pages.archiveSite(A, site.id);
    assert.equal(row(db, home.id).status, "unpublished");
    assert.equal(pages.listSites(A, { archived: true })[0].id, site.id);
    assert.throws(() => pages.createPage(A, { name: "Nouvelle", siteId: site.id }), /archivé/);
    pages.restoreSite(A, site.id);
    assert.equal(row(db, home.id).status, "unpublished");
  });
});

describe("composants réutilisables", () => {
  const { A, B } = freshMarketing();
  let comp, page;

  test("enregistrer une section comme composant (global) ; jamais un composant dans un composant", () => {
    comp = pages.createComponent(A, { name: "Bandeau promo", section: hero("Promo -20 %") });
    assert.equal(comp.global, true);
    assert.throws(() => pages.createComponent(A, { name: "Boucle", section: { type: "component", componentId: comp.id } }), /autre composant/);
    assert.throws(() => pages.createComponent(A, { name: "bandeau PROMO", section: hero("x") }), /déjà ce nom/);
  });

  test("inséré synchronisé : l'affichage suit la dernière version du composant", () => {
    page = pages.createPage(A, { name: "Avec composant" });
    pages.saveDraft(A, page.id, { sections: [{ type: "component", componentId: comp.id }, text("Suite")] }, { revision: 0 });
    pages.updateComponent(A, comp.id, { section: hero("Promo -30 %") });
    const shown = pages.resolveSections(A, pages.getPage(A, page.id).working.sections);
    assert.equal(shown[0].title, "Promo -30 %");
    assert.equal(shown[0].fromComponent, comp.id);
    assert.ok(shown[0].id, "l'identifiant de la section est gardé");
  });

  test("suppression refusée tant qu'une page l'utilise ; composant d'une autre organisation refusé", () => {
    assert.throws(() => pages.deleteComponent(A, comp.id), /instances liées dans 1 page/);
    assert.throws(() => normalizeSection(B, { type: "component", componentId: comp.id }, 0), /introuvable/);
    pages.saveDraft(A, page.id, { sections: [text("Sans composant")] }, { revision: pages.getPage(A, page.id).revision });
    pages.deleteComponent(A, comp.id);
    assert.equal(pages.getComponent(A, comp.id), null);
  });
});

test("les pages d'atterrissage existantes restent identiques (aucun attribut ajouté à leurs sections)", () => {
  const { A } = freshMarketing();
  const p = landing.createPage(A, { name: "Ancienne" });
  const saved = landing.savePage(A, p.id, { name: "Ancienne", slug: "ancienne", sections: [hero("Titre"), text("Texte")] });
  assert.deepEqual(saved.sections, [hero("Titre"), text("Texte")]);
});

test("migration 036 : nouvelle migration seulement (les migrations publiées restent intactes)", () => {
  const dir = path.join(__dirname, "../src/marketing/migrations");
  assert.ok(fs.existsSync(path.join(dir, "036_site_web_fondations.sql")));
});

test("migration 036 sur une base qui a déjà des pages d'atterrissage : pages intactes, nature « landing », en ligne inchangées", () => {
  const os = require("os");
  const { DatabaseSync } = require("node:sqlite");
  const { migrate } = require("../src/marketing/db/migrate");
  const quiet = { log() {}, warn() {}, error() {} };
  const all = path.join(__dirname, "../src/marketing/migrations");
  const before = fs.mkdtempSync(path.join(os.tmpdir(), "mig035-"));
  for (const f of fs.readdirSync(all)) if (f < "036") fs.copyFileSync(path.join(all, f), path.join(before, f));
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', created_at TEXT DEFAULT (datetime('now')))");
  migrate(db, { dir: before, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')");
  db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, status, sections) VALUES (1, 'Existante', 'existante', 'published', ?)").run(JSON.stringify([hero("En ligne")]));
  migrate(db, { dir: all, dbPath: ":memory:", log: quiet });
  const r = db.prepare("SELECT * FROM mk_landing_pages WHERE slug = 'existante'").get();
  assert.equal(r.kind, "landing");
  assert.equal(r.status, "published");
  assert.equal(r.draft, null);
  assert.equal(r.revision, 0);
  assert.equal(JSON.parse(r.sections)[0].title, "En ligne");
  assert.equal(landing.getPublishedPage(db, "existante").sections[0].title, "En ligne");
  fs.rmSync(before, { recursive: true, force: true });
});
