// Page individuelle : identité graphique indépendante / héritée / hybride, sur un VRAI serveur (insertion, bascule, retour, personnalisation conservée, isolation entre sites).
// Scénario fondamental : un modèle inséré garde SON identité (aucun jeton du site, variables --kw-* redéfinies sur ses sections) ; en mode hérité il lit la charte du site ; le retour au mode indépendant
// restitue exactement l'identité d'origine ; une valeur modifiée à la main survit aux bascules.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");

let srv, boss, db, A, B;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
const api = async (s, path, json) => JSON.parse((await boss.request(U(s, path), { method: "POST", json })).text);
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); walk(n.children, fn); } };
const contentOf = (pageId) => { const r = one("SELECT draft, sections FROM mk_landing_pages WHERE id = ?", pageId); return JSON.parse(r.draft || r.sections); };
const tokens = (doc) => JSON.stringify(doc).match(/token:[a-z-]+/g) || [];
const asList = (doc) => (Array.isArray(doc) ? doc : (doc && doc.sections) || []);
const scopes = (doc) => { const out = []; walk(asList(doc), (n) => { if (typeof n.css === "string" && n.css.includes("--kw-primary") || (typeof n.css === "string" && n.css.includes("--kw-font-heading"))) out.push(n.css); }); return out; };

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site identité A" })).location).match(/sites\/(\d+)/)[1]);
  B = Number(String((await boss.post("/marketing/site-web/sites", { name: "Site identité B" })).location).match(/sites\/(\d+)/)[1]);
});
after(async () => { db.close(); await srv.stop(); });

describe("Page individuelle : identité graphique indépendante, héritée, hybride", () => {
  let tpl, key, pageId;
  before(async () => {
    key = Catalog.entries("single_page").find((e) => e.layoutId === "accueil-corporate").key;
    tpl = (await api(A, "/api/bibliotheque/utiliser", { type: "single_page", key })).template;
    pageId = tpl.sourceId;
  });
  test("à l'insertion : aucun jeton du site, variables d'identité sur chaque section, mode indépendant", () => {
    const doc = contentOf(pageId);
    assert.deepEqual(tokens(doc), []);
    assert.equal(scopes(doc).length, 1, "la racine du modèle porte la portée de l'identité");
    assert.equal(one("SELECT identity_mode, origin_key FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "own");
  });
  test("mode hérité : les couleurs deviennent des jetons du site, la portée disparaît, une valeur personnalisée est conservée", async () => {
    const doc = contentOf(pageId);
    let marked = null; walk(doc.sections || doc, (n) => { if (!marked && n.styles && n.styles.desktop && typeof n.styles.desktop.backgroundColor === "string" && n.styles.desktop.backgroundColor.startsWith("#")) { n.styles.desktop.backgroundColor = "#123456"; marked = n.id; } });
    assert.ok(marked, "un élément coloré à personnaliser");
    const col = one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageId).draft ? "draft" : "sections";
    db.prepare(`UPDATE mk_landing_pages SET ${col} = ? WHERE id = ?`).run(JSON.stringify(doc), pageId);
    const r = await api(A, `/api/modeles/${tpl.id}/identite`, { mode: "site" });
    assert.ok(r.ok, JSON.stringify(r)); assert.ok(r.changed > 0);
    const after = contentOf(pageId);
    assert.ok(tokens(after).length > 0, "des jetons du site apparaissent");
    assert.deepEqual(scopes(after), [], "la portée d'identité du modèle est retirée : le site s'applique");
    let kept = null; walk(after.sections || after, (n) => { if (n.id === marked) kept = n.styles.desktop.backgroundColor; });
    assert.equal(kept, "#123456", "la personnalisation n'est pas écrasée");
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "site");
  });
  test("retour au mode indépendant : jetons retirés, portée restituée à l'identique, personnalisation conservée", async () => {
    const r = await api(A, `/api/modeles/${tpl.id}/identite`, { mode: "own" });
    assert.ok(r.ok, JSON.stringify(r));
    const after = contentOf(pageId), ref = Catalog.build("single_page", key, {}).sections;
    assert.deepEqual(tokens(after), [], "plus aucun jeton");
    assert.deepEqual(scopes(after), scopes(ref), "la portée d'origine est restituée à l'identique");
    assert.ok(JSON.stringify(after).includes("#123456"));
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "own");
  });
  test("mode hybride : seules les couleurs de marque suivent le site ; fonds, textes et polices du modèle restent", async () => {
    const r = await api(A, `/api/modeles/${tpl.id}/identite`, { mode: "hybrid" });
    assert.ok(r.ok, JSON.stringify(r));
    const doc = contentOf(pageId);
    for (const x of new Set(tokens(doc))) assert.ok(["token:primary", "token:on-primary"].includes(x), x);
    const sc = scopes(doc); assert.equal(sc.length, 1);
    for (const c of sc) { assert.ok(!c.includes("--kw-primary"), "la couleur de marque vient du site"); assert.ok(c.includes("--kw-background"), "le fond reste celui du modèle"); }
    await api(A, `/api/modeles/${tpl.id}/identite`, { mode: "own" });
  });
  test("insertion directe en mode hérité ; mode inconnu refusé ; autre site non affecté", async () => {
    const t2 = (await api(A, "/api/bibliotheque/utiliser", { type: "single_page", key, identity: "site" })).template;
    assert.deepEqual(scopes(contentOf(t2.sourceId)), []);
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", t2.id).identity_mode, "site");
    const bad = await boss.request(U(A, `/api/modeles/${tpl.id}/identite`), { method: "POST", json: { mode: "nimporte" } });
    assert.ok(bad.status >= 400);
    const cross = await boss.request(U(B, `/api/modeles/${tpl.id}/identite`), { method: "POST", json: { mode: "site" } });
    assert.ok([403, 404].includes(cross.status) || JSON.parse(cross.text).ok === false, `le site B ne peut pas convertir le modèle du site A (${cross.status})`);
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "own");
  });
  test("chaque modèle de la bibliothèque se construit dans les trois modes ; indépendant = zéro jeton, hérité = zéro police de bibliothèque", () => {
    for (const e of Catalog.entries("single_page")) {
      const own = JSON.stringify(Catalog.build("single_page", e.key, { identity: "own" })), site = JSON.stringify(Catalog.build("single_page", e.key, { identity: "site" })), hyb = JSON.stringify(Catalog.build("single_page", e.key, { identity: "hybrid" }));
      assert.ok(!/token:/.test(own), `${e.key} : jeton du site en mode indépendant`);
      assert.ok(!/"fontFamily":"font\./.test(site) && !/--kw-primary/.test(site), `${e.key} : mode hérité`);
      assert.ok(/token:primary/.test(hyb) || !/--kw-primary/.test(hyb), `${e.key} : mode hybride`);
    }
  });
});
