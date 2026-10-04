// Architecture de navigation de « Mon espace » : fil d'Ariane réel sur chaque page, rail de la navigation générale
// dans les modules qui ont leur propre menu (SEO, Marketing), liens de retour vers les vraies vues d'ensemble.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, createCourse } = require("./helpers");
const dashboard = require("../src/services/dashboard");
const { buildNav } = require("../src/marketing/web/nav");

let srv, prof, course;
// Fil d'Ariane d'une page : [{ label, href }] tel qu'affiché (href null pour la page courante)
const trailOf = (html) => {
  const m = html.match(/<nav class="(?:dash-crumbs|mk-breadcrumb)" aria-label="Fil d'Ariane">([\s\S]*?)<\/nav>/);
  if (!m) return null;
  return [...m[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((li) => {
    const a = li[1].match(/<a href="([^"]+)">([^<]+)<\/a>/);
    return a ? { label: a[2].replace(/&#39;/g, "'"), href: a[1] } : { label: li[1].replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").trim(), href: null };
  });
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Excel avancé", price: 19 });
});
after(() => srv.stop());

describe("Fil d'Ariane de Mon espace", () => {
  test("rubriques : Mon espace (lien) → rubrique (page actuelle)", async () => {
    for (const [url, label] of [["/formateur/formations", "Mes formations"], ["/formateur/chapitres", "Chapitres"], ["/formateur/categories", "Catégories"], ["/formateur/messages", "Messages"], ["/formateur/blog", "Blog"], ["/formateur/faq", "FAQ"], ["/formateur/pages/a-propos", "Page À propos"], ["/formateur/apparence", "Apparence"], ["/formateur/profil", "Profil et paramètres"]]) {
      assert.deepEqual(trailOf((await prof.get(url)).text), [{ label: "Mon espace", href: "/formateur" }, { label, href: null }], url);
    }
  });
  test("vue d'ensemble : pas de fil d'Ariane (on est à la racine)", async () => {
    assert.equal(trailOf((await prof.get("/formateur")).text), null);
  });
  test("pages profondes d'une formation (accès direct par l'adresse)", async () => {
    const t = trailOf((await prof.get(`/formateur/cours/${course.id}/modifier`)).text);
    assert.deepEqual(t.slice(0, 2), [{ label: "Mon espace", href: "/formateur" }, { label: "Mes formations", href: "/formateur/formations" }]);
    assert.equal(t[2].href, null);
    const hub = trailOf((await prof.get(`/formateur/cours/${course.id}`)).text);
    assert.deepEqual(hub[2], { label: "Excel avancé", href: null });
    // plus de double bouton « Retour aux formations » : le fil d'Ariane suffit
    assert.doesNotMatch((await prof.get(`/formateur/cours/${course.id}`)).text, /Retour aux formations/);
  });
  test("chaque lien du fil d'Ariane mène à une vraie page", async () => {
    const seen = new Set();
    for (const url of ["/formateur/formations", `/formateur/cours/${course.id}/curriculum`, "/formateur/seo/contenus/page/contact", "/formateur/seo/regles", "/marketing/segments", "/marketing/campagnes/nouvelle"]) {
      for (const c of trailOf((await prof.get(url)).text)) if (c.href) seen.add(c.href);
    }
    for (const href of seen) assert.equal((await prof.get(href)).status, 200, href);
  });
  test("règles du constructeur (fonction pure)", () => {
    assert.deepEqual(dashboard.crumbs("/formateur/messages", "Messages reçus").map((c) => c.label), ["Mon espace", "Messages"]);
    assert.deepEqual(dashboard.crumbs("/formateur/seo/regles", "SEO · Règles").map((c) => c.label), ["Mon espace", "SEO", "Audit", "Règles"]);
    assert.deepEqual(dashboard.crumbs("/formateur/seo", "SEO · Vue d'ensemble"), [{ label: "Mon espace", href: "/formateur" }, { label: "SEO" }]);
  });
});

describe("Modules avec leur propre menu : le contexte général reste visible", () => {
  test("SEO : rail « Mon espace » (SEO actif), menu du module, fil d'Ariane", async () => {
    const html = (await prof.get("/formateur/seo/audit")).text;
    assert.match(html, /<nav class="app-rail"/);
    assert.match(html, /href="\/formateur\/seo" class="app-rail-link" data-tip="SEO" aria-label="SEO" aria-current="true"/);
    for (const href of ["/formateur", "/formateur/formations", "/formateur/messages", "/marketing", "/formateur/profil"]) assert.match(html, new RegExp(`href="${href.replace(/\//g, "\\/")}" class="app-rail-(?:link|brand)"`), href);
    assert.match(html, /class="dash-module-head"/);
    assert.deepEqual(trailOf(html), [{ label: "Mon espace", href: "/formateur" }, { label: "SEO", href: "/formateur/seo" }, { label: "Audit", href: null }]);
  });
  test("Marketing : rail « Mon espace » (Marketing actif) à côté du menu marketing, contenu inchangé", async () => {
    const html = (await prof.get("/marketing/segments")).text;
    assert.match(html, /class="mk-app has-rail"/);
    assert.match(html, /href="\/marketing" class="app-rail-link" data-tip="Marketing" aria-label="Marketing" aria-current="true"/);
    assert.match(html, /aria-label="Menu marketing"/);
    assert.deepEqual(trailOf(html), [{ label: "Mon espace", href: "/formateur" }, { label: "Marketing", href: "/marketing" }, { label: "Audience", href: "/marketing/contacts" }, { label: "Segments", href: null }]);
    assert.deepEqual(trailOf((await prof.get("/marketing")).text), [{ label: "Mon espace", href: "/formateur" }, { label: "Marketing", href: null }]);
  });
  test("pages ordinaires : barre complète, pas de rail", async () => {
    const html = (await prof.get("/formateur/formations")).text;
    assert.doesNotMatch(html, /class="app-rail"/);
    assert.match(html, /href="\/formateur\/formations" class="dash-link" data-tip="Mes formations" aria-current="page"/);
  });
  test("marketing : fil d'Ariane avec adresses (fonction pure)", () => {
    const can = () => true;
    assert.deepEqual(buildNav({ can, active: "segments" }).trail, [{ label: "Audience", href: "/marketing/contacts" }, { label: "Segments", href: "/marketing/segments" }]);
    assert.deepEqual(buildNav({ can, active: "campaigns" }).trail, [{ label: "Campagnes", href: "/marketing/campagnes" }]);
    assert.deepEqual(buildNav({ can, active: "dashboard" }).trail, []);
    assert.deepEqual(buildNav({ can, active: "segments" }).breadcrumb, ["Audience", "Segments"], "ancien format conservé");
  });
});
