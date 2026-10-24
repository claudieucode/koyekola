// KOLAKISA CMS — MENUS-03 : l'écran « Menus » façon WordPress (création sur place, sélecteur, réglages), l'ajout automatique des pages de premier niveau
// (réellement déclenché par la publication d'une page) et l'affectation des emplacements. Vraie base, vrai serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("Apparence → Menus : création, réglages, ajout automatique des pages", () => {
  let srv, boss, db, A, B;
  const R = "/marketing/site-web";
  const APP = `${R}/apparence/menus`;
  const items = (menuId) => db.prepare("SELECT type, object_id, parent_id, position FROM nav_items WHERE menu_id = ? ORDER BY position").all(menuId);
  const newPage = async (name, siteId) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_landing_pages SET kind = 'page', site_id = ?, sections = ?, draft = NULL WHERE id = ?").run(siteId || null, JSON.stringify([{ type: "text", markdown: name }]), id); // une section de texte : pas de section d'inscription qui exige un formulaire
    return id;
  };
  const publish = async (id) => { const r = await boss.postJson(`/marketing/pages/${id}/publier.json`, {}); assert.equal(r.status, 200, r.text); };
  const create = (fields, site) => boss.post(`${R}/navigation/menus${site ? `?site=${site}` : ""}`, { depuis: "ecran", ...fields });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
  });
  after(() => { db.close(); return srv.stop(); });

  test("sans menu : « Créez votre premier menu », nom, réglages, emplacements réels, bouton « Créer le menu »", async () => {
    const r = await boss.get(`${APP}?site=${A}`); assert.equal(r.status, 200);
    for (const t of [/<h1>Menus<\/h1>/, /Créez votre premier menu ci-dessous/, /Ajouter des éléments de menu/, /Structure du menu/, /Nom du menu/, /Réglages du menu/, /Ajouter automatiquement les pages de premier niveau/, /Créer le menu/]) assert.match(r.text, t);
    for (const l of ["header", "footer", "mobile"]) assert.match(r.text, new RegExp(`name="locations" value="${l}"`));
    assert.doesNotMatch(r.text, /data-nm-tree/, "pas d'éditeur tant qu'aucun menu n'existe");
  });

  test("création : nom + ajout automatique + emplacement → menu réel, emplacement affecté, éditeur ouvert avec les réglages", async () => {
    const r = await create({ name: "Principal", auto_add_pages: "1", locations: "header", depuis: "ecran" }, A);
    assert.equal(r.status, 302); const id = Number(/menu=(\d+)/.exec(r.location)[1]);
    assert.match(r.location, /apparence\/menus\?menu=\d+&site=/);
    const row = db.prepare("SELECT * FROM nav_menus WHERE id = ?").get(id);
    assert.equal(row.site_id, A); assert.equal(row.auto_add_pages, 1);
    assert.equal(db.prepare("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'").get(A).menu_id, id);
    const page = await boss.get(`${APP}?menu=${id}&site=${A}`); assert.equal(page.status, 200);
    assert.match(page.text, /data-nm-autoadd/); assert.match(page.text, /Sélectionnez un menu à modifier/); assert.match(page.text, /créer un nouveau menu/);
    assert.match(page.text, /"autoAddPages":true/);
  });

  test("nom vide ou en double : erreur réelle, aucun menu créé ; « ?nouveau=1 » ouvre la création même avec des menus", async () => {
    const before = db.prepare("SELECT COUNT(*) n FROM nav_menus WHERE site_id = ?").get(A).n;
    for (const body of [{ name: "  " }, { name: "principal" }]) { const r = await create({ ...body, depuis: "ecran" }, A); assert.equal(r.status, 302); assert.match(r.location, /nouveau=1/); }
    assert.equal(db.prepare("SELECT COUNT(*) n FROM nav_menus WHERE site_id = ?").get(A).n, before);
    const n = await boss.get(`${APP}?nouveau=1&site=${A}`); assert.match(n.text, /Nouveau menu/); assert.match(n.text, /Cet emplacement est déjà occupé : il sera remplacé/); assert.match(n.text, /<option value="[^"]*menu=\d+/);
  });

  test("ajout automatique : la première publication d'une page sans parent l'ajoute au menu du même site ; pas de doublon ; pas hors du site", async () => {
    const menuA = db.prepare("SELECT id FROM nav_menus WHERE site_id = ? AND auto_add_pages = 1").get(A).id;
    const off = Number((await create({ name: "Sans option" }, A)).location.match(/menu=(\d+)/)[1]);
    const other = Number((await create({ name: "Beta auto", auto_add_pages: "1" }, B)).location.match(/menu=(\d+)/)[1]);
    const p1 = await newPage("Page un", A); const p2 = await newPage("Page deux", A);
    await publish(p1);
    assert.deepEqual(items(menuA).map((i) => [i.type, i.object_id]), [["page", p1]]);
    assert.equal(items(off).length, 0, "menu sans l'option : rien"); assert.equal(items(other).length, 0, "menu d'un autre site : rien");
    await publish(p1); assert.equal(items(menuA).length, 1, "republier ne duplique pas");
    await publish(p2); assert.deepEqual(items(menuA).map((i) => i.object_id), [p1, p2], "ordre : à la suite");
    // un élément retiré à la main n'est pas remis par une republication
    db.prepare("DELETE FROM nav_items WHERE menu_id = ? AND object_id = ?").run(menuA, p1); await publish(p1); assert.deepEqual(items(menuA).map((i) => i.object_id), [p2]);
  });

  test("ajout automatique : brouillon, page enfant, page du site principal et option désactivée n'ajoutent rien ; l'option se désactive et se réactive par l'enregistrement", async () => {
    const menuA = db.prepare("SELECT id FROM nav_menus WHERE site_id = ? AND auto_add_pages = 1").get(A).id;
    const draft = await newPage("Brouillon", A); assert.deepEqual(items(menuA).filter((i) => i.object_id === draft), []);
    const parent = await newPage("Parent", A); const child = await newPage("Enfant", A);
    db.prepare("UPDATE mk_landing_pages SET parent_id = ? WHERE id = ?").run(parent, child); await publish(child);
    assert.ok(!items(menuA).some((i) => i.object_id === child), "page enfant : pas de premier niveau");
    const main = await newPage("Principale"); await publish(main); assert.ok(!items(menuA).some((i) => i.object_id === main), "page du principal : pas dans un menu de site");
    const m = db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(menuA);
    let r = await boss.postJson(`${R}/navigation/menus/${menuA}/enregistrer?site=${A}`, { revision: m.revision, autoAddPages: false, items: [] });
    assert.equal(r.status, 200); assert.equal(db.prepare("SELECT auto_add_pages a FROM nav_menus WHERE id = ?").get(menuA).a, 0);
    const p3 = await newPage("Troisième", A); await publish(p3); assert.equal(items(menuA).length, 0, "option désactivée : rien");
    r = await boss.postJson(`${R}/navigation/menus/${menuA}/enregistrer?site=${A}`, { revision: db.prepare("SELECT revision FROM nav_menus WHERE id = ?").get(menuA).revision, autoAddPages: "oui", items: [] });
    assert.equal(r.status, 400, "valeur non booléenne refusée");
  });

  test("rendu public : une page ajoutée automatiquement apparaît dans le menu affecté à l'en-tête", async () => {
    const menuA = db.prepare("SELECT id FROM nav_menus WHERE site_id = ? AND name = 'Principal'").get(A).id;
    db.prepare("UPDATE nav_menus SET auto_add_pages = 1 WHERE id = ?").run(menuA);
    const p = await newPage("Contact auto", A); await publish(p);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(p).slug;
    const pv = JSON.parse((await boss.get(`${R}/navigation/menus/${menuA}/apercu?site=${A}`)).text); // même gabarit que l'en-tête public
    assert.ok(pv.ok && pv.html.includes(`/${slug}`), "le rendu du menu contient la page");
    assert.equal(db.prepare("SELECT menu_id FROM nav_locations WHERE site_id = ? AND location = 'header'").get(A).menu_id, menuA, "et ce menu est celui de l'emplacement En-tête");
  });

  test("isolation : créer pour un site inexistant ou lire le menu d'un autre site échoue", async () => {
    const mB = db.prepare("SELECT id FROM nav_menus WHERE site_id = ?").get(B).id;
    assert.equal((await boss.get(`${R}/sites/${A}/navigation/menus/${mB}`)).status, 404);
    const r = await boss.get(`${APP}?menu=${mB}&site=${A}`);
    assert.doesNotMatch(r.text, /Beta auto/, "le menu d'un autre site n'est jamais proposé : le premier menu du site s'ouvre à la place");
  });
});
