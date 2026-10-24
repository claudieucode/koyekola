// En-tête du site : état réel (statut, type, pages qui l'utilisent), exceptions par page (aucun en-tête / variante),
// variantes, édition de la source dans l'éditeur, protections. Par les vraies routes d'un vrai serveur ; l'effet est
// contrôlé sur les pages PUBLIÉES (même rendu que les visiteurs).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
// Message affiché (le HTML écrit l'apostrophe en &#39;)
const flashOf = (html) => ((html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0]).replace(/&#39;/g, "'").replace(/&amp;/g, "&");

describe("en-tête du site (vrai serveur)", () => {
  let srv, boss, db, editor, siteId, otherSiteId;
  const pagesOf = {};
  const html = async (slug) => (await new Client(srv.base).get(`/p/${slug}`, { headers: UA })).text;
  const hasHeader = (h) => /lp-site-part lp-site-header/.test(h);
  const slugOf = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const panel = async (who = boss) => (await who.get(`/marketing/site-web/sites/${siteId}/reglages/en-tete`)).text;
  const choose = (pageId, choice, who = boss) => who.post(`/marketing/site-web/sites/${siteId}/entete/pages/${pageId}`, { choice });
  const putComponent = (cid, content, who = boss) => who.request(`/marketing/site-web/composants/${cid}/brouillon`, { method: "PUT", json: { content, revision: 0 }, headers: { Origin: srv.base } });
  let headerId, variantId;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    editor = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'editor')").run(editor.email);
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Atelier en-tête" })).location);
    otherSiteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Autre site" })).location);
    for (const name of ["Accueil", "Formations", "Tunnel Photoshop", "Landing campagne"]) {
      const id = idFrom((await boss.post("/marketing/pages", { name, site_id: String(siteId) })).location);
      assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
      pagesOf[name] = id;
    }
  });
  after(() => srv.stop());

  test("migration 044 : colonnes d'exception sur les pages et de lien sur les composants", () => {
    const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
    assert.ok(cols("mk_landing_pages").includes("header_mode") && cols("mk_landing_pages").includes("header_component_id"));
    assert.ok(cols("mk_web_components").includes("variant_of"));
    assert.equal(db.prepare("SELECT header_mode FROM mk_landing_pages WHERE id = ?").get(pagesOf["Accueil"]).header_mode, "inherit", "par défaut : en-tête du site");
  });

  test("site sans en-tête : état vide honnête, aucune page n'affiche d'en-tête, bouton « Créer un en-tête »", async () => {
    const h = await panel();
    assert.match(h, /Ce site n'a pas encore d'en-tête/);
    assert.match(h, /Créer un en-tête/);
    assert.doesNotMatch(h, /data-header-facts/);
    assert.equal(hasHeader(await html(slugOf(pagesOf["Accueil"]))), false);
  });

  test("créer un en-tête : composant du site (logo + nom du site), choisi comme en-tête, affiché sur TOUTES les pages publiées", async () => {
    const r = await boss.post(`/marketing/site-web/sites/${siteId}/entete/creer`, {});
    assert.match(flashOf((await boss.get(r.location)).text), /En-tête « En-tête principal » créé/);
    const site = db.prepare("SELECT header_component_id FROM mk_sites WHERE id = ?").get(siteId);
    headerId = site.header_component_id;
    assert.ok(headerId);
    const comp = db.prepare("SELECT name, site_id, section FROM mk_web_components WHERE id = ?").get(headerId);
    assert.equal(comp.site_id, siteId);
    const types = JSON.stringify(JSON.parse(comp.section));
    assert.match(types, /"type":"sitelogo"/);
    assert.match(types, /"type":"sitetitle"/);
    for (const id of Object.values(pagesOf)) assert.equal(hasHeader(await html(slugOf(id))), true, `page ${id}`);
    assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/entete/creer`, {})).status, 302);
    assert.match(flashOf((await boss.get(`/marketing/site-web/sites/${siteId}/reglages/en-tete`)).text), /déjà un en-tête/);
  });

  test("fiche du site : statut Publié, type Global, « Utilisé par 4 pages sur 4 », liste des pages, bouton Modifier", async () => {
    const h = await panel();
    assert.match(h, /data-header-name>En-tête principal</);
    assert.match(h, /data-header-status>Publié</);
    assert.match(h, /data-header-type>Global</);
    assert.match(h, /data-header-count>4 pages sur 4</);
    const using = h.match(/data-header-using>[\s\S]*?<\/table>/)[0];
    for (const name of Object.keys(pagesOf)) assert.match(using, new RegExp(`>${name}</a>`));
    assert.match(h, new RegExp(`href="/marketing/site-web/composants/${headerId}/editeur"[^>]*data-header-edit`));
    assert.match(h, /Aucune exception/);
  });

  test("exception « Aucun en-tête » : la page publiée n'en affiche plus, les autres gardent le leur ; la fiche liste l'exception", async () => {
    const tunnel = pagesOf["Tunnel Photoshop"];
    const r = await choose(tunnel, "none");
    assert.match(flashOf((await boss.get(r.location)).text), /n'affiche plus d'en-tête/);
    assert.equal(db.prepare("SELECT header_mode FROM mk_landing_pages WHERE id = ?").get(tunnel).header_mode, "none");
    assert.equal(hasHeader(await html(slugOf(tunnel))), false);
    assert.equal(hasHeader(await html(slugOf(pagesOf["Accueil"]))), true);
    const h = await panel();
    assert.match(h, /data-header-count>3 pages sur 4</);
    const exc = h.match(/data-header-exceptions>[\s\S]*?<\/table>/)[0];
    assert.match(exc, />Tunnel Photoshop</);
    assert.match(exc, /Aucun en-tête/);
    assert.doesNotMatch(h.match(/data-header-using>[\s\S]*?<\/table>/)[0], /Tunnel Photoshop/);
  });

  test("variante : copie liée à sa source, nom automatique, modifiable sans toucher à l'en-tête du site ; affectée à une page, elle s'affiche seulement là", async () => {
    const r = await boss.post(`/marketing/site-web/sites/${siteId}/entete/variante`, {});
    assert.match(flashOf((await boss.get(r.location)).text), /Variante « En-tête principal — variante 1 » créée/);
    const v = db.prepare("SELECT id, name, variant_of, section FROM mk_web_components WHERE variant_of = ?").get(headerId);
    variantId = v.id;
    assert.equal(v.name, "En-tête principal — variante 1");
    assert.equal(v.section, db.prepare("SELECT section FROM mk_web_components WHERE id = ?").get(headerId).section, "copie conforme de la source");
    assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/entete/variante`, {}).then((x) => boss.get(x.location))).status, 200);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_web_components WHERE variant_of = ?").get(headerId).n, 2, "numérotation : variante 2");
    // la variante se modifie dans l'éditeur (une seule section), sans changer l'en-tête du site
    const content = { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "heading", props: { text: "Variante spéciale", level: "2" } }] }] }] };
    assert.equal((await putComponent(variantId, content)).status, 200);
    const campagne = pagesOf["Landing campagne"];
    await choose(campagne, `variant:${variantId}`);
    const hc = await html(slugOf(campagne));
    assert.match(hc, /Variante spéciale/);
    assert.equal(hasHeader(hc), true);
    assert.doesNotMatch(await html(slugOf(pagesOf["Accueil"])), /Variante spéciale/, "les autres pages gardent l'en-tête du site");
    const h = await panel();
    assert.match(h, /Variante : En-tête principal — variante 1/);
    assert.match(h, /data-header-count>2 pages sur 4</);
  });

  test("éditeur de l'en-tête : une seule section, enregistrement = mise à jour immédiate sur TOUTES les pages qui l'utilisent", async () => {
    const page = (await boss.get(`/marketing/site-web/composants/${headerId}/editeur`));
    assert.equal(page.status, 200);
    const boot = JSON.parse(page.text.match(/<script type="application\/json" id="pb-boot">([\s\S]*?)<\/script>/)[1]);
    assert.equal(boot.page.base, `/marketing/site-web/composants/${headerId}`);
    assert.equal(boot.page.component.role, "header");
    assert.equal(boot.content.sections.length, 1, "le contenu de l'éditeur est la source du composant");
    assert.match(page.text, /href="\/marketing\/site-web\/sites\/\d+\/reglages\/en-tete#entete"/, "retour à l'en-tête du site");
    // refus : plusieurs sections
    const two = { sections: [boot.content.sections[0], { type: "text", markdown: "Une seconde section" }] };
    const bad = await putComponent(headerId, two);
    assert.equal(bad.status, 422);
    assert.match(JSON.parse(bad.text).error.message, /UNE seule section/);
    // enregistrement valide
    const content = { sections: [{ id: boot.content.sections[0].id, type: "layout", children: [{ type: "container", children: [{ type: "heading", props: { text: "Mon nouvel en-tête", level: "2" } }] }] }] };
    assert.equal((await putComponent(headerId, content)).status, 200);
    for (const name of ["Accueil", "Formations"]) assert.match(await html(slugOf(pagesOf[name])), /Mon nouvel en-tête/, name);
    assert.doesNotMatch(await html(slugOf(pagesOf["Tunnel Photoshop"])), /Mon nouvel en-tête/, "exception : aucun en-tête");
    assert.doesNotMatch(await html(slugOf(pagesOf["Landing campagne"])), /Mon nouvel en-tête/, "exception : variante");
  });

  test("canevas de l'éditeur de composant : rendu de la source seule (jamais l'en-tête en double), en mode éditeur", async () => {
    const r = await boss.request(`/marketing/site-web/composants/${headerId}/rendu`, { method: "POST", json: { content: { sections: [{ type: "layout", children: [{ type: "container", children: [{ type: "heading", props: { text: "Aperçu source", level: "2" } }] }] }] } }, headers: { Origin: srv.base } });
    assert.equal(r.status, 200);
    assert.match(r.text, /Aperçu source/);
    assert.match(r.text, /data-kw-builder/);
    assert.equal((r.text.match(/lp-site-header/g) || []).length, 0, "pas d'en-tête de site autour de l'en-tête en cours de modification");
  });

  test("validations : variante inconnue, en-tête du site comme variante, page d'un autre site, page sans site, mode inconnu", async () => {
    const accueil = pagesOf["Accueil"];
    const keep = (id) => db.prepare("SELECT header_mode FROM mk_landing_pages WHERE id = ?").get(id).header_mode;
    for (const [choice, re] of [[`variant:${headerId}`, /déjà l'en-tête du site/], ["variant:99999", /Variante introuvable/]]) {
      const r = await choose(accueil, choice);
      assert.match(flashOf((await boss.get(r.location)).text), re);
      assert.equal(keep(accueil), "inherit");
    }
    const otherPage = idFrom((await boss.post("/marketing/pages", { name: "Page autre site", site_id: String(otherSiteId) })).location);
    const wrong = await boss.post(`/marketing/site-web/sites/${siteId}/entete/pages/${otherPage}`, { choice: "none" });
    assert.match(flashOf((await boss.get(wrong.location)).text), /n'appartient pas à ce site/);
    assert.equal(keep(otherPage), "inherit");
    const pages = require("../src/marketing/pages");
    const ctx = { db, organizationId: 1, userId: null };
    const free = idFrom((await boss.post("/marketing/pages", { name: "Sans site" })).location);
    assert.throws(() => pages.setPageHeader(ctx, free, { mode: "none" }), /n'appartient à aucun site/);
    assert.throws(() => pages.setPageHeader(ctx, accueil, { mode: "inconnu" }), /Choix d'en-tête inconnu/);
    // variante d'un autre site refusée
    const foreign = pages.createComponent(ctx, { name: "Composant étranger", section: { type: "text", markdown: "x" }, siteId: otherSiteId });
    assert.throws(() => pages.setPageHeader(ctx, accueil, { mode: "variant", componentId: foreign.id }), /autre site/);
  });

  test("protections : un en-tête ou une variante utilisés ne peuvent pas être supprimés (détail des pages)", async () => {
    const del = (id) => boss.request(`/marketing/site-web/composants/${id}/supprimer`, { method: "POST", json: {}, headers: { Origin: srv.base } });
    const a = await del(headerId);
    assert.equal(a.status, 409);
    assert.match(JSON.parse(a.text).error.message, /en-tête ou le pied de page du site « Atelier en-tête »/);
    const b = await del(variantId);
    assert.equal(b.status, 409);
    assert.match(JSON.parse(b.text).error.message, /Landing campagne/);
    // une variante inutilisée (la numéro 2) se supprime
    const spare = db.prepare("SELECT id FROM mk_web_components WHERE variant_of = ? AND id <> ?").get(headerId, variantId).id;
    assert.equal((await del(spare)).status, 200);
  });

  test("retour à l'en-tête du site : la page redevient « héritée » ; retirer l'en-tête du site le retire des pages", async () => {
    await choose(pagesOf["Landing campagne"], "inherit");
    assert.match(await html(slugOf(pagesOf["Landing campagne"])), /Mon nouvel en-tête/);
    assert.match(await panel(), /data-header-count>3 pages sur 4</);
    await boss.post(`/marketing/site-web/sites/${siteId}/parties`, { header: "", footer: "" });
    assert.equal(hasHeader(await html(slugOf(pagesOf["Accueil"]))), false);
    assert.match(await panel(), /Ce site n'a pas encore d'en-tête/);
    await boss.post(`/marketing/site-web/sites/${siteId}/parties`, { header: String(headerId), footer: "" });
    assert.equal(hasHeader(await html(slugOf(pagesOf["Accueil"]))), true);
  });

  test("droits : un rédacteur gère l'en-tête ; un élève n'a accès ni à la fiche ni à l'éditeur du composant", async () => {
    assert.equal((await editor.get(`/marketing/site-web/composants/${headerId}/editeur`)).status, 200);
    const ok = await editor.post(`/marketing/site-web/sites/${siteId}/entete/pages/${pagesOf["Formations"]}`, { choice: "none" });
    assert.match(flashOf((await editor.get(ok.location)).text), /n'affiche plus/);
    await choose(pagesOf["Formations"], "inherit");
    const student = await newStudent(srv);
    assert.notEqual((await student.get(`/marketing/site-web/composants/${headerId}/editeur`)).status, 200);
    assert.notEqual((await student.request(`/marketing/site-web/composants/${headerId}/brouillon`, { method: "PUT", json: { content: { sections: [] }, revision: 0 } })).status, 200);
    assert.equal(db.prepare("SELECT header_mode FROM mk_landing_pages WHERE id = ?").get(pagesOf["Formations"]).header_mode, "inherit");
  });
});
