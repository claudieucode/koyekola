// Header Builder, lot L8 — ISOLATION ENTRE SITES sur le site publié : chaque site garde SES réglages d'en-tête, SES états, SES panneaux de méga-menu et SES visiteurs ;
// rien ne passe d'un site à l'autre. Deux sites dans la même organisation, deux pages publiées. Ignoré si Playwright / Chrome sont absents.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { setup, SKIP } = require("./header-aides");
const { Client } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });

describe("Header Builder : isolation entre sites (site publié)", { skip: SKIP }, () => {
  let env, siteB, pageB;
  const slugB = () => env.db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageB).slug;
  const headerOf = async (slug) => { const html = (await new Client(env.srv.base).get(`/p/${slug}`, { headers: UA })).text; const m = html.match(/<div class="[^"]*lp-site-header[^"]*"[^>]*>/); return m ? m[0] : ""; };
  const publishFor = async (siteId, key, header, mutate) => {
    const U = (p = "") => `/marketing/site-web/sites/${siteId}/constructeur-de-theme${p}`;
    const used = await env.boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: env.origin }); assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template, cid = Number(t.editUrl.match(/composants\/(\d+)/)[1]);
    const comp = JSON.parse((await env.boss.get(`/marketing/site-web/composants/${cid}.json`)).text).component;
    const section = JSON.parse(JSON.stringify(comp.draft || comp.section)); if (header) section.header = header; if (mutate) mutate(section);
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${cid}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: comp.revision, content: { title: comp.name, sections: [section] } } })).status, 200);
    assert.equal((await env.boss.request(`/marketing/site-web/composants/${cid}/mettre-a-jour`, { method: "POST", json: {}, headers: env.origin })).status, 200);
    assert.equal((await env.boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: env.origin })).status, 200);
    return { t, cid };
  };

  before(async () => {
    env = await setup({ siteName: "Site A" });
    siteB = Number((await env.boss.post("/marketing/site-web/sites", { name: "Site B" })).location.match(/sites\/(\d+)/)[1]);
    pageB = Number((await env.boss.post("/marketing/pages", { name: "Accueil B", site_id: siteB, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = env.db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageB).revision;
    assert.equal((await env.boss.request(`/marketing/pages/${pageB}/brouillon`, { method: "PUT", headers: env.origin, json: { revision: rev, content: { title: "Accueil B", sections: [sect("sectb0000001", "CORPS B")] } } })).status, 200);
    assert.equal((await env.boss.request(`/marketing/pages/${pageB}/publier.json`, { method: "POST", json: {}, headers: env.origin })).status, 200);
  });
  after(async () => { if (env) await env.close(); });

  test("réglages d'en-tête : le site A colle son en-tête avec décalage et masquage, le site B garde un en-tête ordinaire ; aucun réglage ne passe de l'un à l'autre", async () => {
    await publishFor(env.site, "luxe-01.luxe-01", { mode: "sticky", offset: 30, zIndex: 80, hideOnScroll: { enabled: true, tolerance: 10 } });
    await publishFor(siteB, "luxe-01.luxe-01", { mode: "static" });
    const a = await headerOf(env.slug()), b = await headerOf(slugB());
    assert.match(a, /kw-theme-sticky/); assert.match(a, /--kw-hdr-top:30px/); assert.match(a, /--kw-hdr-z:80/); assert.match(a, /data-kw-hide="1"/);
    assert.doesNotMatch(b, /kw-theme-sticky|--kw-hdr|data-kw-hide|data-kw-scroll/, `le site B reste ordinaire : ${b}`);
  });

  test("états de style et logos : un style « Après défilement » du site A n'apparaît jamais dans la page du site B", async () => {
    await publishFor(env.site, "luxe-01.luxe-01", { mode: "sticky" }, (s) => { s.children[0].states = { scrolled: { backgroundColor: "#ff0000" } }; });
    await publishFor(siteB, "luxe-01.luxe-01", { mode: "sticky" });
    const htmlA = (await new Client(env.srv.base).get(`/p/${env.slug()}`, { headers: UA })).text, htmlB = (await new Client(env.srv.base).get(`/p/${slugB()}`, { headers: UA })).text;
    assert.match(htmlA, /is-scrolled[^{]*\{[^}]*#ff0000/i, "le site A porte son état"); assert.doesNotMatch(htmlB, /#ff0000/i, "le site B n'a pas la couleur du site A");
  });

  test("méga-menu : le panneau du site A n'est jamais rendu sur le site B, même si le menu de B y fait référence (identifiant deviné)", async () => {
    const db = env.db, menuA = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(env.site).lastInsertRowid);
    const itemA = Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, 0, 'custom', '/a', 'Rubrique A', 'published')").run(menuA).lastInsertRowid);
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(env.site, menuA);
    const menuB = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, status) VALUES (?, 'Principal', 'principal', 'published')").run(siteB).lastInsertRowid);
    const itemB = Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, status) VALUES (?, NULL, 0, 'custom', '/b', 'Rubrique B', 'published')").run(menuB).lastInsertRowid);
    db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, 'header', ?)").run(siteB, menuB);
    const panel = await env.boss.request("/marketing/site-web/composants", { method: "POST", json: { name: "Panneau secret du site A", siteId: env.site, global: false, kind: "standard", section: { type: "layout", children: [{ id: "secretpanel01", type: "heading", props: { text: "CONFIDENTIEL SITE A", level: "3" } }] } }, headers: env.origin });
    assert.equal(panel.status, 201, panel.text.slice(0, 200)); const panelId = JSON.parse(panel.text).component.id;
    const mega = (menuItem) => (s) => { const walk = (nodes) => { for (const n of nodes) { if (n.type === "menu") n.props = { ...n.props, source: "location", location: "header", mega: { [String(menuItem)]: panelId } }; if (n.children) walk(n.children); } }; walk(s.children); };
    await publishFor(env.site, "luxe-01.luxe-01", { mode: "static" }, mega(itemA));
    await publishFor(siteB, "luxe-01.luxe-01", { mode: "static" }, mega(itemB)); // B référence le panneau de A
    const htmlA = (await new Client(env.srv.base).get(`/p/${env.slug()}`, { headers: UA })).text, htmlB = (await new Client(env.srv.base).get(`/p/${slugB()}`, { headers: UA })).text;
    assert.match(htmlA, /CONFIDENTIEL SITE A/, "le site A affiche son panneau"); assert.doesNotMatch(htmlB, /CONFIDENTIEL SITE A/, "le site B ne reçoit jamais le panneau de A"); assert.doesNotMatch(htmlB, /has-mega/);
  });

  test("route menu.json de l'éditeur : un composant ne voit que les rubriques et panneaux de SON site", async () => {
    const compB = env.db.prepare("SELECT id FROM mk_web_components WHERE site_id = ? ORDER BY id DESC LIMIT 1").get(siteB).id;
    const panelA = env.db.prepare("SELECT id FROM mk_web_components WHERE name = 'Panneau secret du site A'").get().id;
    const r = JSON.parse((await env.boss.get(`/marketing/site-web/composants/${compB}/menu.json?source=location&location=header&ids=${panelA}`)).text);
    assert.deepEqual(r.items.map((i) => i.label), ["Rubrique B"], "seul le menu du site B est listé");
    assert.deepEqual(r.components, {}, "le nom du panneau du site A n'est jamais révélé au site B");
  });

  test("suivi : aucune erreur de script", () => { assert.deepEqual(env.errors, []); });
});
