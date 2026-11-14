// Catalogue des extensions (Galerie / Liste, recherche, filtres, tri, fiche) : serveur réel + Chrome ; activation indépendante par site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const registry = require("../src/extensions/registry");

describe("Extensions : catalogue", () => {
  let srv, boss, db, A, B;
  const X = "/marketing/site-web/extensions";
  const on = (site, ext) => (db.prepare("SELECT enabled e FROM mk_site_modules WHERE site_id = ? AND module = ?").get(site, ext) || {}).e === 1;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
  });
  after(() => { db.close(); return srv.stop(); });

  test("chaque extension du registre a son propre logo SVG, léger et distinct", () => {
    const seen = new Set();
    for (const m of registry.load().list()) {
      const f = path.join(__dirname, "..", "public", "img", "extensions", `${m.id}.svg`);
      assert.ok(fs.existsSync(f), `logo manquant : ${m.id}`);
      const svg = fs.readFileSync(f, "utf8");
      assert.ok(svg.length < 2000, `${m.id} : logo léger`); assert.match(svg, /^<svg /); assert.doesNotMatch(svg, /<script|<image|data:/);
      assert.ok(!seen.has(svg), `${m.id} : logo identique à un autre`); seen.add(svg);
      assert.match(m.accent, /^#[0-9a-f]{6}$/i);
    }
  });

  test("Galerie par défaut : une carte par extension avec nom, description, catégorie, version, éditeur, état, action et lien Détails", async () => {
    const r = await boss.get(`${X}?site=${A}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /data-view="gallery"/);
    assert.equal((r.text.replace(/<template[\s\S]*?<\/template>/g, "").match(/data-xc-empty[ >]/g) || []).length, 0, "aucun bloc « aucun résultat » dans le HTML : il n'est créé que lorsque le filtrage ne laisse aucune carte");
    assert.match(r.text, /<template data-xc-empty-tpl>/);
    const cards = r.text.match(/data-xc-item/g) || [];
    assert.equal(cards.length, registry.load().list().length);
    for (const m of registry.load().list()) {
      assert.match(r.text, new RegExp(`/img/extensions/${m.id}\\.svg`)); assert.match(r.text, new RegExp(`${X}/detail/${m.id}\\?site=${A}`));
    }
    assert.match(r.text, /Par <\/span>Kolakisa/); assert.match(r.text, /Version/); assert.match(r.text, /Activer/);
    assert.match(r.text, /data-xc-view="list"/); assert.match(r.text, /data-xc-sort/);
  });

  test("activation depuis le catalogue : seul le site choisi change, retour au catalogue, état conservé après actualisation", async () => {
    const r = await boss.post(`${X}/sites/${A}/commerce/activer`, { retour: "catalogue" });
    assert.equal(r.status, 302); assert.equal(r.location, `${X}?site=${A}&maj=commerce`);
    assert.equal(on(A, "commerce"), true); assert.equal(on(B, "commerce"), false);
    const a = await boss.get(`${X}?site=${A}`), b = await boss.get(`${X}?site=${B}`);
    const stateOf = (html, id) => html.split("<li ").find((c) => c.includes("data-xc-item") && c.includes(`/${id}.svg`)).match(/data-state="(on|off)"/)[1];
    assert.equal(stateOf(a.text, "commerce"), "on"); assert.equal(stateOf(b.text, "commerce"), "off");
    assert.match((await boss.get(`${X}/activees?site=${A}`)).text, /data-preset="on"/);
    assert.match((await boss.get(`${X}/desactivees?site=${B}`)).text, /data-preset="off"/);
  });

  test("fiche détaillée : logo, description, fonctionnalités, compatibilité, dépendances, permissions, actions réelles ; extension inconnue → 404", async () => {
    const r = await boss.get(`${X}/detail/commerce?site=${A}`);
    assert.equal(r.status, 200);
    for (const re of [/Kolakisa Commerce/, /Fonctionnalités/, /Compatibilité/, /Dépendances/, /Permissions/, /shop\.read/, /commerce\.svg/, /Désactiver/, /Ouvrir/, /Activité sur ce site/]) assert.match(r.text, re);
    const off = await boss.get(`${X}/detail/lms?site=${A}`);
    assert.match(off.text, />Activer</); assert.doesNotMatch(off.text, />Ouvrir</);
    assert.equal((await boss.get(`${X}/detail/inconnue?site=${A}`)).status, 404);
    const back = await boss.post(`${X}/sites/${A}/lms/activer`, { retour: "detail" });
    assert.equal(back.location, `${X}/detail/lms?site=${A}`); assert.equal(on(B, "lms"), false);
    const ev = await boss.get(`${X}/detail/lms?site=${A}`);
    assert.match(ev.text, /Activée/);
  });

  test("désactivation : confirmation exigée, données conservées, l'autre site inchangé", async () => {
    const r = await boss.get(`${X}/gestion?site=${A}&extension=lms&confirmer=lms`);
    assert.match(r.text, /Confirmer la désactivation/);
    assert.equal((await boss.post(`${X}/sites/${A}/lms/desactiver`, { confirmer: "1", retour: "catalogue" })).status, 302);
    assert.equal(on(A, "lms"), false); assert.equal(on(A, "commerce"), true);
    assert.ok(db.prepare("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = ? AND module = 'lms'").get(A).n === 1, "la ligne est conservée (désactivée), jamais supprimée");
  });
});
