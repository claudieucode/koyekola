// En-tête collant / superposé sur les PAGES PUBLIÉES du Page Builder : la position est portée par l'ENVELOPPE de l'en-tête (la bande seule restait dans une enveloppe de sa hauteur : `sticky` ne collait jamais).
// Cause racine et décisions : docs/theme-builder/kolakisa-header-library.md §4.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });

describe("En-tête collant / superposé : pages publiées", () => {
  let srv, boss, db, site, pageId;
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const origin = { Origin: "" };
  const slug = () => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
  const live = async () => (await new Client(srv.base).get(`/p/${slug()}`, { headers: UA })).text;
  const header = (html) => (html.match(/<div class="[^"]*lp-site-header[^"]*"/) || [""])[0];
  const adopt = async (key) => {
    const used = await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: "header", key }, headers: origin });
    assert.equal(used.status, 200, used.text.slice(0, 200));
    const t = JSON.parse(used.text).template;
    const pub = await boss.request(U(`/api/modeles/${t.id}/publier`), { method: "POST", json: { replace: true }, headers: origin });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    return t;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    origin.Origin = srv.base;
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site collant" })).location.match(/sites\/(\d+)/)[1]);
    pageId = Number((await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: "Accueil", sections: [sect("sect00000001", "CORPS")] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${pageId}/publier.json`, { method: "POST", json: {}, headers: origin })).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("en-tête ordinaire : aucune classe de comportement", async () => {
    await adopt("classique-logo-menu-bouton.clair");
    const h = header(await live()); assert.match(h, /lp-site-header/); assert.doesNotMatch(h, /kw-theme-(sticky|overlay)/);
  });
  test("en-tête collant et verre dépoli : l'enveloppe porte kw-theme-sticky", async () => {
    await adopt("collant-classique.clair"); assert.match(header(await live()), /kw-theme-sticky/);
    await adopt("saas-verre-depoli.clair"); assert.match(header(await live()), /kw-theme-sticky/);
  });
  test("en-tête superposé : l'enveloppe porte kw-theme-overlay (jamais les deux)", async () => {
    await adopt("superpose-classique.nuit"); const h = header(await live());
    assert.match(h, /kw-theme-overlay/); assert.doesNotMatch(h, /kw-theme-sticky/);
  });
  test("collant à plusieurs rangées : tout l'en-tête colle ensemble (une seule enveloppe)", async () => {
    await adopt("collant-deux-rangees.marque"); const html = await live();
    assert.match(header(html), /kw-theme-sticky/);
    assert.equal((html.match(/lp-site-header/g) || []).length >= 1, true);
  });
  test("retour à un en-tête ordinaire : les classes disparaissent (rien ne reste d'un modèle remplacé)", async () => {
    await adopt("classique-sobre.doux"); assert.doesNotMatch(header(await live()), /kw-theme-(sticky|overlay)/);
  });
  test("feuille de style : règles collant / superposé et suppression de la marge de colonne au-dessus de l'en-tête", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "public", "css", "landing.css"), "utf8");
    assert.match(css, /\.lp-block\.lp-site-header\.kw-theme-sticky\s*\{[^}]*position:\s*sticky[^}]*top:\s*0/);
    assert.match(css, /\.lp-block\.lp-site-header\.kw-theme-overlay\s*\{[^}]*position:\s*absolute[^}]*left:\s*0[^}]*right:\s*0/);
    assert.match(css, /\.lp-main:has\(> \.lp-block\.lp-site-header:first-child\)\s*\{\s*padding-top:\s*0/);
  });
});
