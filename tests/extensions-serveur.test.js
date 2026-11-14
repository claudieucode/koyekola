// Extensions — de bout en bout sur un serveur réel : écrans, activation individuelle par site, routes d'administration et pages publiques fermées quand l'extension est désactivée,
// navigation dynamique, isolation entre trois sites, conservation des données, historique.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

class HostClient {
  constructor(srv) { this.srv = srv; this.jars = new Map(); }
  request(host, path, { method = "GET", form } = {}) {
    const u = new URL(this.srv.base);
    const jar = this.jars.get(host) || new Map(); this.jars.set(host, jar);
    const h = { Host: host };
    if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h["Content-Type"] = "application/x-www-form-urlencoded"; h["Content-Length"] = Buffer.byteLength(body); }
    return new Promise((resolve, reject) => {
      const r = http.request({ host: u.hostname, port: u.port, path, method, headers: h }, (resp) => {
        for (const line of resp.headers["set-cookie"] || []) { const [pair] = line.split(";"); const i = pair.indexOf("="); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
        let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location }));
      });
      r.on("error", reject); if (body) r.write(body); r.end();
    });
  }
  get(host, path) { return this.request(host, path); }
}

describe("Extensions : serveur réel, trois sites indépendants", () => {
  let srv, boss, db, A, B, C, adminA, orgAdmin, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const ORIGIN = () => ({ Origin: srv.base });
  const X = "/marketing/site-web/extensions";
  const toggle = (client, site, ext, etat, confirmer) => client.post(`${X}/sites/${site}/${ext}/${etat}`, confirmer ? { confirmer: "1" } : {});
  const on = (site, ext) => (one("SELECT enabled e FROM mk_site_modules WHERE site_id = ? AND module = ?", site, ext) || {}).e === 1;
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const space = (site) => `/marketing/site-web/sites/${site}`;
  const mkLater = async () => Number((await boss.post("/marketing/site-web/sites", { name: "Site Delta" })).location.match(/sites\/(\d+)/)[1]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo"); C = await mk("Site Charlie");
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200); assert.equal((await setDomain(C, "https://c.test")).status, 200);
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    orgAdmin = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, 'admin')").run(idOf(orgAdmin));
    anon = new HostClient(srv);
  });
  after(() => { db.close(); return srv.stop(); });

  test("les cinq rubriques existent, affichent les vraies extensions et le vrai état ; l'équipe y accède, une personne limitée à un site n'y entre jamais", async () => {
    const pages = [["", /Toutes les extensions/], ["/activees", /Extensions activées/], ["/desactivees", /Extensions désactivées/], ["/gestion", /Gestion des extensions/], ["/historique", /Historique et activité/]];
    for (const [p, re] of pages) { const r = await boss.get(X + p); assert.equal(r.status, 200, p); assert.match(r.text, re); }
    const all = await boss.get(X);
    for (const n of ["Kolakisa Commerce", "Kolakisa LMS", "SMS", "Réseaux sociaux", "Score des contacts", "Intelligence artificielle"]) assert.match(all.text, new RegExp(n));
    assert.equal((await orgAdmin.get(X)).status, 200);
    for (const p of ["", "/activees", "/gestion", "/historique"]) { const r = await adminA.get(X + p + `?site=${A}`); assert.ok([302, 403].includes(r.status), `${p} ${r.status}`); assert.doesNotMatch(r.text, /Kolakisa Commerce/); }
    assert.ok([302, 403].includes((await toggle(adminA, A, "commerce", "activer")).status)); assert.equal(on(A, "commerce"), false, "une personne limitée ne peut pas activer");
    assert.equal((await anon.get("k.test", X)).status === 200, false, "visiteur : refusé");
  });

  test("Commerce désactivé : écrans d'administration de la boutique fermés (lecture ET écriture), même pour l'équipe ; aucune donnée créée", async () => {
    for (const p of ["/boutique", "/boutique/commandes", "/boutique/clients", "/boutique/reglages", "/boutique/produits/nouveau", "/boutique/abonnements", "/boutique/factures"]) {
      const r = await boss.get(space(A) + p); assert.equal(r.status, 403, p); assert.match(r.text, /pas activé/);
    }
    assert.equal((await boss.post(`${space(A)}/boutique/produits`, { name: "Produit fantôme", price: "5,00", status: "published", type: "simple" })).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE name = 'Produit fantôme'").n, 0);
  });

  test("activation individuelle de Commerce sur A : A s'ouvre, B et C restent fermés ; boutique utilisable de bout en bout", async () => {
    assert.equal((await toggle(boss, A, "commerce", "activer")).status, 302); assert.equal(on(A, "commerce"), true);
    assert.equal((await boss.get(`${space(A)}/boutique`)).status, 200);
    assert.equal((await boss.post(`${space(A)}/boutique/reglages`, { enabled: "1", currency: "eur", default_country: "FR", order_prefix: "CMD", low_stock_threshold: "3", payment_methods: ["manual"] })).status, 302);
    assert.equal((await boss.post(`${space(A)}/boutique/produits`, { name: "Tasse Alpha", price: "12,00", status: "published", type: "simple" })).status, 302);
    assert.match((await boss.get(`${space(A)}/boutique`)).text, /Tasse Alpha/);
    for (const s of [B, C]) assert.equal((await boss.get(`${space(s)}/boutique`)).status, 403, `site ${s}`);
    assert.equal(on(B, "commerce"), false); assert.equal(on(C, "commerce"), false);
  });

  test("boutique publique : le domaine de A sert sa boutique ; B et C (désactivée) répondent introuvable", async () => {
    assert.notEqual((await anon.get("a.test", "/boutique")).status, 404, "A : boutique ouverte");
    for (const host of ["b.test", "c.test"]) assert.equal((await anon.get(host, "/boutique")).status, 404, host);
  });

  test("désactivation : confirmation exigée ; une fois confirmée, tout se ferme, AUCUNE donnée n'est supprimée ; la réactivation retrouve produits et réglages", async () => {
    await toggle(boss, A, "commerce", "desactiver"); assert.equal(on(A, "commerce"), true, "sans confirmation : rien ne change");
    assert.match((await boss.get(`${X}/gestion?site=${A}&extension=commerce&confirmer=commerce`)).text, /Aucune donnée n.{1,6}est supprimée/);
    assert.equal((await toggle(boss, A, "commerce", "desactiver", true)).status, 302); assert.equal(on(A, "commerce"), false);
    assert.equal((await boss.get(`${space(A)}/boutique`)).status, 403);
    assert.equal((await anon.get("a.test", "/boutique")).status, 404, "boutique publique fermée");
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE name = 'Tasse Alpha' AND site_id = ?", A).n, 1, "produit conservé");
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_settings WHERE site_id = ?", A).n, 1, "réglages conservés");
    assert.equal((await toggle(boss, A, "commerce", "activer")).status, 302);
    assert.match((await boss.get(`${space(A)}/boutique`)).text, /Tasse Alpha/, "réactivation : le produit est retrouvé");
  });

  test("navigation dynamique : le menu Boutique et le menu Formation n'existent dans l'espace d'un site que si l'extension y est activée ; le principal garde son menu ; pas de doublon", async () => {
    const menu = async (site) => (await boss.get(`${space(site)}/tableau-de-bord`)).text;
    const hasShop = (h, s) => h.includes(`href="${space(s)}/boutique"`);
    const shopLinks = (h, s) => (h.match(new RegExp(`href="${space(s)}/boutique"`, "g")) || []).length;
    const a1 = await menu(A), b1 = await menu(B);
    assert.equal(hasShop(a1, A), true, "A : Commerce activé → menu Boutique"); assert.equal(hasShop(b1, B), false, "B : désactivé → pas de menu Boutique");
    assert.ok(shopLinks(a1, A) <= 2, "pas de duplication du menu");
    const lmsLinks = (h) => (h.match(/Mes formations/g) || []).length;
    const before = lmsLinks(b1);
    assert.equal((await toggle(boss, B, "lms", "activer")).status, 302);
    assert.ok(lmsLinks(await menu(B)) > before, "B : LMS activé → menu Formation");
    assert.equal(lmsLinks(await menu(C)), before, "C : inchangé");
    assert.equal(lmsLinks(await menu(A)), before, "A : LMS non activé → pas de menu Formation");
    assert.equal((await toggle(boss, B, "lms", "desactiver", true)).status, 302);
    assert.equal(lmsLinks(await menu(B)), before, "B : LMS désactivé → le menu disparaît");
    const principal = (await boss.get("/marketing/site-web/principal/tableau-de-bord")).text;
    assert.match(principal, /\/marketing\/site-web\/(?:principal\/)?boutique/, "le site principal n'est jamais soumis à l'activation");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id IS NULL").n, 0);
  });

  test("LMS : pages publiques d'un domaine fermées sans l'extension, ouvertes avec ; le site principal et les autres sites ne bougent pas", async () => {
    const paths = ["/catalogue", "/mes-cours", "/panier", "/formateur"];
    for (const host of ["a.test", "b.test", "c.test"]) for (const p of paths) assert.equal((await anon.get(host, p)).status, 404, `${host}${p} fermé par défaut`);
    assert.notEqual((await anon.get("k.test", "/catalogue")).status, 404, "principal : toujours ouvert");
    assert.equal((await toggle(boss, C, "lms", "activer")).status, 302);
    assert.notEqual((await anon.get("c.test", "/catalogue")).status, 404, "C : ouvert");
    for (const host of ["a.test", "b.test"]) assert.equal((await anon.get(host, "/catalogue")).status, 404, `${host} reste fermé`);
    assert.equal((await toggle(boss, C, "lms", "desactiver", true)).status, 302);
    assert.equal((await anon.get("c.test", "/catalogue")).status, 404, "C : refermé");
  });

  test("trois configurations simultanées : A = Commerce, B = LMS, C = rien ; chaque site ne voit que les siennes, en parallèle", async () => {
    await toggle(boss, B, "lms", "activer");
    const [a1, a2, b1, b2, c1, c2, a3, b3] = await Promise.all([
      boss.get(`${space(A)}/boutique`), anon.get("a.test", "/catalogue"), boss.get(`${space(B)}/boutique`), anon.get("b.test", "/catalogue"), boss.get(`${space(C)}/boutique`), anon.get("c.test", "/catalogue"), anon.get("a.test", "/boutique"), anon.get("b.test", "/boutique"),
    ]);
    assert.deepEqual([a1.status, a2.status, b1.status, b2.status, c1.status, c2.status], [200, 404, 403, 200, 403, 404]);
    assert.notEqual(a3.status, 404); assert.equal(b3.status, 404);
    assert.deepEqual([on(A, "commerce"), on(A, "lms"), on(B, "commerce"), on(B, "lms"), on(C, "commerce"), on(C, "lms")], [true, false, false, true, false, false]);
  });

  test("dépendances et erreurs : extension inconnue, site inconnu ; état falsifié refusé ; rien d'inattendu dans la table", async () => {
    for (const bad of ["inconnue", "SMS", "x"]) { const r = await toggle(boss, A, bad, "activer"); assert.ok([302, 404].includes(r.status)); }
    assert.ok([302, 404].includes((await toggle(boss, 99999, "commerce", "activer")).status)); assert.equal(one("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = 99999").n, 0);
    assert.equal((await boss.post(`${X}/sites/${A}/commerce/nimportequoi`, {})).status, 404);
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_modules WHERE module NOT IN ('sms', 'ai', 'social', 'scoring', 'commerce', 'lms')").n, 0);
  });

  test("historique : chaque activation et désactivation est journalisée avec le site et la version ; filtre par site ; un refus de confirmation est consigné", async () => {
    const h = await boss.get(`${X}/historique`); assert.equal(h.status, 200);
    assert.match(h.text, /Activée/); assert.match(h.text, /Désactivée/); assert.match(h.text, /Kolakisa Commerce/); assert.match(h.text, /Refusée/);
    const onlyB = await boss.get(`${X}/historique?site=${B}`);
    const rows = onlyB.text.slice(onlyB.text.indexOf("<tbody>"), onlyB.text.indexOf("</tbody>")); assert.match(rows, /Site Bravo/); assert.doesNotMatch(rows, /Site Alpha/);
    assert.ok(one("SELECT COUNT(*) n FROM mk_extension_events WHERE action = 'enable' AND version = '1.0.0'").n >= 4);
    assert.throws(() => db.prepare("DELETE FROM mk_extension_events").run(), /lecture seule/);
  });


  test("Extensions est dans le menu de CHAQUE site (y compris créé plus tard), pour l'équipe ; l'écran du site ne montre et ne change que CE site ; accès limité refusé", async () => {
    const D = await mkLater();
    for (const site of [A, B, C, D]) {
      const dash = (await boss.get(`${space(site)}/tableau-de-bord`)).text;
      for (const slug of ["", "/activees", "/desactivees", "/gestion", "/historique"]) assert.ok(dash.includes(`href="${space(site)}/extensions${slug}"`), `site ${site} : rubrique ${slug || "Toutes"}`);
    }
    const page = await boss.get(`${space(D)}/extensions/gestion`); assert.equal(page.status, 200);
    const main = page.text.slice(page.text.indexOf('class="mk-head"')); assert.doesNotMatch(main, /name="site"/, "aucun sélecteur de site dans l'écran"); assert.doesNotMatch(main, /Site Alpha|Site Bravo/, "seul ce site est concerné");
    assert.equal((await boss.post(`${X}/sites/${D}/sms/activer`, { espace: "1" })).location, `${space(D)}/extensions/gestion?extension=sms`, "retour dans l'espace du site");
    assert.equal(on(D, "sms"), true); assert.equal(on(A, "sms"), false); assert.equal(on(B, "sms"), false);
    const act = await boss.get(`${space(D)}/extensions/activees`); assert.match(act.text, /data-name="sms"/);
    assert.equal((await boss.get(`${space(A)}/extensions/activees`)).text.includes('data-name="sms"'), false, "A n'a pas SMS");
    assert.equal((await boss.get(`${space(99999)}/extensions`)).status, 404);
    const limited = await adminA.get(`${space(A)}/extensions`); assert.ok([302, 403].includes(limited.status), String(limited.status));
    assert.doesNotMatch((await adminA.get(`${space(A)}/tableau-de-bord`)).text, /\/extensions/, "pas dans le menu d'une personne limitée au site");
    const hist = await boss.get(`${space(D)}/extensions/historique`); const rows = hist.text.slice(hist.text.indexOf("<tbody>"), hist.text.indexOf("</tbody>"));
    assert.match(rows, /Site Delta/); assert.doesNotMatch(rows, /Site Alpha|Site Bravo/, "historique limité à ce site");
  });

  test("ancien écran « Modules du site » : toujours fonctionnel, mêmes règles (même moteur)", async () => {
    const M = `${space(C)}/modules`;
    assert.equal((await boss.get(M)).status, 200);
    assert.equal((await boss.post(`${M}/sms`, { etat: "activer" })).status, 302); assert.equal(on(C, "sms"), true);
    assert.equal((await boss.post(`${M}/sms`, { etat: "desactiver" })).status, 302); assert.equal(on(C, "sms"), false);
    assert.ok(one("SELECT COUNT(*) n FROM mk_extension_events WHERE site_id = ? AND extension = 'sms'", C).n >= 2, "journalisé par le même moteur");
  });
});
