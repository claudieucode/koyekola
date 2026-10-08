// Réglages du site (lot 1) : couleurs globales (système + personnalisées) et polices globales, par les vraies routes
// d'un vrai serveur. Un réglage enregistré doit être relu après rechargement, contrôlé par une révision, refusé s'il est
// invalide, et se retrouver dans la page EN LIGNE du site (même source de vérité : mk_sites.tokens).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
let srv, boss, db;
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
const row = (id) => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
});
after(() => srv.stop());

describe("réglages du site : couleurs et polices globales", () => {
  let siteId, pageId, rev, tokens;
  const url = () => `/marketing/site-web/sites/${siteId}/reglages.json`;
  const load = async () => JSON.parse((await boss.get(url())).text);
  const save = (t, revision = rev) => boss.request(url(), { method: "PUT", json: { tokens: t, revision } });

  test("chargement : les réglages viennent du vrai site (jetons, révision, catalogue de polices, usage)", async () => {
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Atelier Réglages" })).location);
    pageId = idFrom((await boss.post("/marketing/pages", { name: "Accueil réglages", site_id: String(siteId) })).location);
    const data = await load();
    rev = data.revision;
    tokens = data.tokens;
    assert.equal(data.site.name, "Atelier Réglages");
    assert.equal(data.canWrite, true);
    assert.equal(rev, 0);
    assert.equal(tokens.colors.primary, "#0277b6");
    assert.deepEqual(tokens.customColors, []);
    assert.deepEqual(data.catalog.fontRoles, ["heading", "body", "button", "link"]);
    assert.ok(data.catalog.fonts.georgia.stack.includes("Georgia"));
    assert.equal(data.usage.primary.pages, 0, "aucune page n'utilise encore la couleur : zéro réel");
  });

  test("modifier une couleur du système + ajouter une couleur personnalisée : enregistré, relu, révision +1", async () => {
    const next = JSON.parse(JSON.stringify(tokens));
    next.colors.primary = "#6b1e2e";
    next.customColors.push({ key: "c-sable", label: "Sable", hex: "#D7D5CE" });
    const r = await save(next);
    assert.equal(r.status, 200);
    const out = JSON.parse(r.text);
    assert.equal(out.revision, rev + 1);
    rev = out.revision;
    const again = await load();
    assert.equal(again.tokens.colors.primary, "#6b1e2e", "valeur conservée après rechargement");
    assert.deepEqual(again.tokens.customColors, [{ key: "c-sable", label: "Sable", hex: "#d7d5ce" }]);
    tokens = again.tokens;
  });

  test("polices : les quatre rôles sont enregistrés et deviennent des variables CSS réelles", async () => {
    const next = JSON.parse(JSON.stringify(tokens));
    Object.assign(next.fonts, { heading: "georgia", body: "system", button: "mono", link: "georgia" });
    const out = JSON.parse((await save(next)).text);
    rev = out.revision;
    tokens = out.tokens;
    assert.deepEqual(out.tokens.fonts, { heading: "georgia", body: "system", button: "mono", link: "georgia" });
  });

  test("la page EN LIGNE du site suit les réglages : couleur, couleur personnalisée et polices (sans republication)", async () => {
    await boss.post(`/marketing/pages/${pageId}/publier`, {});
    assert.equal(row(pageId).status, "published");
    const pub = (await new Client(srv.base).get(`/p/${row(pageId).slug}`, { headers: UA })).text;
    assert.match(pub, /--kw-primary:#6b1e2e;/);
    assert.match(pub, /--kw-c-sable:#d7d5ce;/, "la couleur personnalisée est une variable du site");
    assert.match(pub, /--kw-font-heading:Georgia/);
    assert.match(pub, /--kw-font-button:ui-monospace/);
    assert.match(pub, /--kw-font-link:Georgia/);
  });

  test("le canevas de l'éditeur utilise les mêmes réglages que la page publiée (une seule source de vérité)", async () => {
    const r = await boss.request(`/marketing/pages/${pageId}/rendu`, { method: "POST", json: { content: { sections: [{ type: "hero", title: "Aperçu", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }] } } });
    assert.equal(r.status, 200);
    assert.match(r.text, /--kw-primary:#6b1e2e;/);
    assert.match(r.text, /--kw-c-sable:#d7d5ce;/);
  });

  test("usage : une couleur personnalisée utilisée par un widget est comptée ; sa suppression est refusée avec le détail", async () => {
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [{ id: "head00000001", type: "heading", props: { text: "Titre", level: "2" }, styles: { desktop: { color: "token:c-sable" } } }] }] }] };
    const put = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { content, revision: row(pageId).revision } });
    assert.equal(put.status, 200, put.text);
    const usage = (await load()).usage;
    assert.equal(usage["c-sable"].pages, 1);
    assert.ok(usage["c-sable"].refs >= 1);
    const without = JSON.parse(JSON.stringify(tokens));
    without.customColors = [];
    const refused = await save(without);
    assert.equal(refused.status, 422);
    assert.match(JSON.parse(refused.text).error.message, /Sable.*utilisée dans 1 page/);
    assert.equal((await load()).tokens.customColors.length, 1, "rien n'a été supprimé");
  });

  test("renommer / recolorer une couleur personnalisée utilisée est permis (la référence reste la clé)", async () => {
    const next = JSON.parse(JSON.stringify(tokens));
    next.customColors[0] = { key: "c-sable", label: "Sable chaud", hex: "#e0c9a6" };
    const r = await save(next);
    assert.equal(r.status, 200);
    rev = JSON.parse(r.text).revision;
    tokens = JSON.parse(r.text).tokens;
    assert.equal(tokens.customColors[0].label, "Sable chaud");
  });

  test("valeurs invalides refusées sans rien écraser : hexadécimal, police inconnue, doublon de nom, trop de couleurs", async () => {
    const mk = (fn) => { const n = JSON.parse(JSON.stringify(tokens)); fn(n); return n; };
    const cases = [
      [mk((n) => { n.colors.primary = "rouge\"><script>"; }), /hexadécimal/],
      [mk((n) => { n.fonts.body = "comic-sans"; }), /Police inconnue/],
      [mk((n) => { n.customColors.push({ key: "c-autre", label: "sable chaud", hex: "#111111" }); }), /même nom/],
      [mk((n) => { n.customColors.push({ key: "mauvaise cle", label: "X", hex: "#111111" }); }), /Couleur personnalisée invalide/],
      [mk((n) => { n.customColors = Array.from({ length: 31 }, (_, i) => ({ key: `c-x${i}`, label: `X${i}`, hex: "#111111" })); }), /30 couleurs/],
    ];
    for (const [bad, re] of cases) {
      const r = await save(bad);
      assert.equal(r.status, 422);
      assert.match(JSON.parse(r.text).error.message, re);
    }
    assert.equal((await load()).revision, rev, "aucune révision consommée par un refus");
  });

  test("deux onglets : un enregistrement sur une révision dépassée est refusé (409) et n'écrase rien", async () => {
    const stale = JSON.parse(JSON.stringify(tokens));
    stale.colors.accent = "#123456";
    const r = await save(stale, rev - 1);
    assert.equal(r.status, 409);
    assert.match(JSON.parse(r.text).error.message, /modifiés ailleurs/);
    assert.notEqual((await load()).tokens.colors.accent, "#123456");
    const missing = await boss.request(url(), { method: "PUT", json: { tokens: stale } });
    assert.equal(missing.status, 422, "révision manquante refusée");
  });

  test("la page « Design system » du site garde les couleurs personnalisées (même source, pas de perte)", async () => {
    await boss.post(`/marketing/site-web/sites/${siteId}/design`, { color_primary: "#aa1100" });
    const after_ = await load();
    assert.equal(after_.tokens.colors.primary, "#aa1100");
    assert.equal(after_.tokens.customColors.length, 1, "l'ancien formulaire ne supprime pas les couleurs personnalisées");
    assert.equal(after_.tokens.fonts.button, "mono", "ni les polices des boutons et des liens");
    rev = after_.revision;
  });

  test("droits : un élève ne lit ni ne modifie ; l'archivage d'un site bloque l'écriture", async () => {
    const student = await newStudent(srv);
    assert.notEqual((await student.get(url())).status, 200);
    assert.notEqual((await student.request(url(), { method: "PUT", json: { tokens, revision: rev } })).status, 200);
    await boss.post(`/marketing/site-web/sites/${siteId}/archiver`, {});
    const r = await save(tokens);
    assert.equal(r.status, 422);
    assert.match(JSON.parse(r.text).error.message, /archivé/);
  });
});
