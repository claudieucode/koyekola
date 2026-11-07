// Accès membre + ventes privées à durée limitée sur un VRAI serveur : non-membre refusé, membre accepté, codes d'invitation (plafond, expiration), vente hors fenêtre, isolation entre sites.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const H1 = "www.membre-un.example";
const H2 = "www.membre-deux.example";
const host = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
const s1 = host(H1); const s2 = host(H2);
let srv, boss, db, A, B, SA, SB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const sql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const when = (ms) => sql(new Date(Date.now() + ms)).replace(" ", "T").slice(0, 16);
const DAY = 86400000;

async function mkSite(name, hostName) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${hostName}` } } } })).status, 200);
  const base = `/marketing/site-web/sites/${id}/boutique`;
  assert.equal((await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  assert.equal((await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "MB" + id, manual_instructions: "Virement" })).status, 302);
  assert.equal((await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" })).status, 302);
  return { id, base };
}
const product = async (base, siteId, name) => {
  const r = await boss.post(`${base}/produits`, { name, type: "simple", status: "published", price: "30,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1" });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
const rule = (base, pid, mode) => boss.post(`${base}/acces/regles`, { kind: "product", product_id: String(pid), mode });
const customer = async (host, email) => {
  const c = new Client(srv.base);
  const r = await c.post("/boutique/compte/inscription", { email, password: "motdepasse-solide", name: "Client Test" }, host);
  assert.equal(r.status, 303, String(r.text).slice(0, 200));
  return c;
};
const customerId = (siteId, email) => one("SELECT id FROM mk_shop_customers WHERE site_id = ? AND email = ?", siteId, email).id;
const add = (cli, host, pid) => cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, host);
const cartCount = (cli) => one("SELECT COUNT(*) n FROM mk_shop_cart_items").n; // sert avant/après
const checkout = async (cli, host, email) => {
  const page = await cli.get("/boutique/commande?pays=FR", host);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const method = (page.text.match(/name="shipping_method" value="(\d+)"/) || assert.fail(`pas de méthode de livraison : ${page.status} ${page.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`))[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  return cli.post("/boutique/commande", { email, ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: method, payment_method: "manual", expected_total: expected }, host);
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Boutique Membre Un", H1); B = await mkSite("Boutique Membre Deux", H2);
  SA = A.base; SB = B.base;
});
after(async () => { db.close(); await srv.stop(); });

describe("réservé aux membres", () => {
  test("non-membre : produit verrouillé visible avec cadenas, ajout et commande refusés par le serveur", async () => {
    const p = await product(SA, A.id, "Sac privé");
    assert.equal((await rule(SA, p.id, "lock")).status, 302);
    const visitor = new Client(srv.base);
    const page = await visitor.get(`/boutique/produit/${p.slug}`, s1);
    assert.equal(page.status, 200);
    assert.match(page.text, /réservé aux membres/);
    assert.doesNotMatch(page.text, /action="\/boutique\/panier\/ajouter"/);
    const cat = await visitor.get("/boutique", s1);
    assert.match(cat.text, /Sac privé/); assert.match(cat.text, /Réservé aux membres/);
    // Contournement : on poste directement l'ajout
    const r = await add(visitor, s1, p.id);
    assert.equal(r.status, 303); assert.match(decodeURIComponent(r.location), /erreur=.*réservé aux membres/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_cart_items WHERE product_id = ?", p.id).n, 0);
    // Client connecté mais pas membre : même refus
    const c = await customer(s1, "simple@example.test");
    const r2 = await add(c, s1, p.id);
    assert.match(decodeURIComponent(r2.location), /réservé aux membres/);
  });

  test("produit masqué : absent du catalogue, de la recherche et de la fiche (404), ajout refusé ; visible pour un membre approuvé", async () => {
    const p = await product(SA, A.id, "Pièce cachée");
    await rule(SA, p.id, "hide");
    const visitor = new Client(srv.base);
    assert.doesNotMatch((await visitor.get("/boutique", s1)).text, /Pièce cachée/);
    assert.doesNotMatch((await visitor.get("/boutique/recherche?q=cach%C3%A9e", s1)).text, /Pièce cachée/);
    assert.equal((await visitor.get(`/boutique/produit/${p.slug}`, s1)).status, 404);
    assert.match(decodeURIComponent((await add(visitor, s1, p.id)).location), /erreur/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_cart_items WHERE product_id = ?", p.id).n, 0);

    const m = await customer(s1, "membre@example.test");
    assert.equal((await m.get(`/boutique/produit/${p.slug}`, s1)).status, 404, "membre pas encore approuvé");
    assert.equal((await m.post("/boutique/invitation/demande", {}, s1)).status, 200);
    assert.equal(one("SELECT status FROM mk_shop_members WHERE customer_id = ?", customerId(A.id, "membre@example.test")).status, "pending");
    assert.equal((await m.get(`/boutique/produit/${p.slug}`, s1)).status, 404, "demande en attente = pas membre");

    assert.equal((await boss.post(`${SA}/acces/membres/${customerId(A.id, "membre@example.test")}/statut`, { statut: "approved" })).status, 302);
    const seen = await m.get("/boutique", s1);
    assert.match(seen.text, /Pièce cachée/);
    assert.equal((await m.get(`/boutique/produit/${p.slug}`, s1)).status, 200);
    const ok = await add(m, s1, p.id);
    assert.equal(ok.status, 303); assert.doesNotMatch(ok.location, /erreur/);

    // Commande d'un membre : acceptée
    const done = await checkout(m, s1, "membre@example.test");
    assert.equal(done.status, 303, String(done.text).slice(0, 300));
    assert.match(done.location, /confirmation/);

    // Révocation : ni catalogue, ni ajout, ni commande d'un panier déjà rempli
    const lock = await product(SA, A.id, "Verrou membre");
    await rule(SA, lock.id, "lock");
    assert.doesNotMatch((await add(m, s1, lock.id)).location, /erreur/);
    assert.equal((await boss.post(`${SA}/acces/membres/${customerId(A.id, "membre@example.test")}/statut`, { statut: "revoked" })).status, 302);
    assert.doesNotMatch((await m.get("/boutique", s1)).text, /Pièce cachée/);
    assert.match(decodeURIComponent((await add(m, s1, p.id)).location), /erreur/);
    // La page de commande ne montre plus la ligne (panier sans article achetable) et un POST direct est refusé par le serveur
    const page = await m.get("/boutique/commande?pays=FR", s1);
    assert.equal(page.status, 303); assert.match(page.location, /panier/);
    assert.match((await m.get("/boutique/panier", s1)).text, /réservé aux membres/);
    const orders0 = one("SELECT COUNT(*) n FROM mk_shop_orders WHERE email = ?", "membre@example.test").n;
    const direct = await m.post("/boutique/commande", { email: "membre@example.test", ship_name: "Ada", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: "abc123", shipping_method: "1", payment_method: "manual" }, s1);
    assert.ok(!/confirmation/.test(direct.location || ""), `POST direct sans commande (${direct.status} ${direct.location})`);
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_orders WHERE email = ?", "membre@example.test").n, orders0);
  });

  test("règle sur une catégorie : couvre ses produits et sous-catégories", async () => {
    assert.equal((await boss.post(`${SA}/categories`, { name: "Collection privée" })).status, 302);
    const cat = one("SELECT id FROM mk_shop_categories WHERE site_id = ? AND name = ?", A.id, "Collection privée");
    assert.equal((await boss.post(`${SA}/categories`, { name: "Sous-collection", parent_id: String(cat.id) })).status, 302);
    const sub = one("SELECT id, parent_id FROM mk_shop_categories WHERE site_id = ? AND name = ?", A.id, "Sous-collection");
    assert.equal(sub.parent_id, cat.id);
    const p = await product(SA, A.id, "Foulard collection");
    db.prepare("INSERT INTO mk_shop_product_categories (product_id, category_id) VALUES (?,?)").run(p.id, sub.id);
    assert.equal((await boss.post(`${SA}/acces/regles`, { kind: "category", category_id: String(cat.id), mode: "hide" })).status, 302);
    assert.equal((await new Client(srv.base).get(`/boutique/produit/${p.slug}`, s1)).status, 404);
  });
});

describe("codes d'invitation", () => {
  const code = async (fields) => {
    const before = one("SELECT COALESCE(MAX(id),0) m FROM mk_shop_invitations").m;
    const r = await boss.post(`${SA}/acces/codes`, fields);
    assert.equal(r.status, 302, String(r.text).slice(0, 200));
    return one("SELECT * FROM mk_shop_invitations WHERE id > ? AND site_id = ? ORDER BY id DESC", before, A.id);
  };
  const redeem = (cli, c) => cli.post("/boutique/invitation", { code: c }, s1);

  test("usage maximum : le 2e client est refusé ; un membre déjà entré ne consomme rien ; l'accès donne la fiche réservée", async () => {
    const inv = await code({ max_uses: "1", note: "VIP" });
    assert.match(inv.code, /^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
    const p = await product(SA, A.id, "Montre invitée");
    await rule(SA, p.id, "hide");
    const a = await customer(s1, "a@example.test"); const b = await customer(s1, "b@example.test");
    const ra = await redeem(a, inv.code.toLowerCase());
    assert.equal(ra.status, 200); assert.match(ra.text, /Bienvenue/);
    assert.equal((await a.get(`/boutique/produit/${p.slug}`, s1)).status, 200);
    assert.match((await redeem(a, inv.code)).text, /déjà membre/);
    assert.equal(one("SELECT used_count FROM mk_shop_invitations WHERE id = ?", inv.id).used_count, 1);
    const rb = await redeem(b, inv.code);
    assert.equal(rb.status, 422); assert.match(rb.text, /déjà été utilisé/);
    assert.equal((await b.get(`/boutique/produit/${p.slug}`, s1)).status, 404);
    assert.equal(one("SELECT used_count FROM mk_shop_invitations WHERE id = ?", inv.id).used_count, 1);
  });

  test("code expiré, inconnu, désactivé ou sans compte : refusés", async () => {
    const inv = await code({ max_uses: "5", expires_at: when(DAY) });
    db.prepare("UPDATE mk_shop_invitations SET expires_at = ? WHERE id = ?").run(sql(new Date(Date.now() - 60000)), inv.id);
    const c = await customer(s1, "c@example.test");
    const r = await redeem(c, inv.code);
    assert.equal(r.status, 422); assert.match(r.text, /expiré/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_members WHERE customer_id = ?", customerId(A.id, "c@example.test")).n, 0);
    assert.equal((await redeem(c, "ZZZZZ-ZZZZZ")).status, 422);
    const off = await code({ max_uses: "5", code: "OFF-CODE" });
    await boss.post(`${SA}/acces/codes/${off.id}/etat`, { actif: "0" });
    assert.match((await redeem(c, "OFF-CODE")).text, /pas valable/);
    const anon = await redeem(new Client(srv.base), off.code);
    assert.equal(anon.status, 401);
    // expiration passée refusée à la création
    const n0 = one("SELECT COUNT(*) n FROM mk_shop_invitations WHERE site_id = ?", A.id).n;
    await boss.post(`${SA}/acces/codes`, { max_uses: "1", expires_at: when(-DAY) });
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_invitations WHERE site_id = ?", A.id).n, n0);
  });

  test("un membre dont l'accès a été retiré ne peut pas revenir avec un code", async () => {
    const inv = await code({ max_uses: "5" });
    const d = await customer(s1, "d@example.test");
    await redeem(d, inv.code);
    await boss.post(`${SA}/acces/membres/${customerId(A.id, "d@example.test")}/statut`, { statut: "revoked" });
    const r = await redeem(d, inv.code);
    assert.equal(r.status, 422); assert.match(r.text, /retiré/);
    assert.equal(one("SELECT used_count FROM mk_shop_invitations WHERE id = ?", inv.id).used_count, 1);
  });
});

describe("ventes privées à durée limitée", () => {
  const sale = (base, fields) => boss.post(`${base}/acces/ventes`, fields);

  test("fenêtre invalide refusée (fin avant début, aucune cible)", async () => {
    const p = await product(SA, A.id, "Vase test");
    const n0 = one("SELECT COUNT(*) n FROM mk_shop_sales").n;
    await sale(SA, { name: "X", starts_at: when(DAY), ends_at: when(-DAY), product_ids: String(p.id) });
    await sale(SA, { name: "Y", starts_at: when(-DAY), ends_at: when(DAY) });
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_sales").n, n0);
  });

  test("avant l'ouverture et après la fin : refus clair avec dates ; pendant : achat possible et date de fin issue de la base", async () => {
    const before = await product(SA, A.id, "Vente à venir");
    const during = await product(SA, A.id, "Vente en cours");
    const after = await product(SA, A.id, "Vente close");
    assert.equal((await sale(SA, { name: "Bientôt", starts_at: when(DAY), ends_at: when(2 * DAY), product_ids: String(before.id) })).status, 302);
    assert.equal((await sale(SA, { name: "Maintenant", starts_at: when(-DAY), ends_at: when(DAY), product_ids: String(during.id) })).status, 302);
    assert.equal((await sale(SA, { name: "Hier", starts_at: when(-3 * DAY), ends_at: when(-DAY), product_ids: String(after.id) })).status, 302);
    const cli = new Client(srv.base);

    const pb = await cli.get(`/boutique/produit/${before.slug}`, s1);
    assert.match(pb.text, /ouverture le \d{2}\/\d{2}\/\d{4}/); assert.doesNotMatch(pb.text, /action="\/boutique\/panier\/ajouter"/);
    assert.match(decodeURIComponent((await add(cli, s1, before.id)).location), /erreur=.*Bientôt/);
    const pa = await cli.get(`/boutique/produit/${after.slug}`, s1);
    assert.match(pa.text, /est terminée depuis le/);
    assert.match(decodeURIComponent((await add(cli, s1, after.id)).location), /erreur=.*terminée/);

    const pd = await cli.get(`/boutique/produit/${during.slug}`, s1);
    const end = one("SELECT ends_at FROM mk_shop_sales WHERE name = ?", "Maintenant").ends_at;
    const label = `${end.slice(8, 10)}/${end.slice(5, 7)}/${end.slice(0, 4)} ${end.slice(11, 16)} UTC`;
    assert.ok(pd.text.includes(label), "la date de fin affichée est celle de la base");
    assert.match(pd.text, /datetime="[0-9T:-]+Z"/);
    const ok = await add(cli, s1, during.id);
    assert.doesNotMatch(ok.location, /erreur/);

    // La vente se termine PENDANT que le panier est rempli : la commande est refusée par le serveur
    db.prepare("UPDATE mk_shop_sales SET starts_at = ?, ends_at = ? WHERE name = ?").run(sql(new Date(Date.now() - 2 * DAY)), sql(new Date(Date.now() - 60000)), "Maintenant");
    const late = await checkout(cli, s1, "retard@example.test").catch((e) => ({ status: 0, text: String(e) }));
    assert.ok(!/confirmation/.test(late.location || ""), "aucune commande créée");
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_orders WHERE email = ?", "retard@example.test").n, 0);
    const cartPage = await cli.get("/boutique/panier", s1);
    assert.match(cartPage.text, /terminée depuis le/);
    // Prolonger la fenêtre rend l'achat à nouveau possible (la base fait foi)
    const sid = one("SELECT id FROM mk_shop_sales WHERE name = ?", "Maintenant").id;
    assert.equal((await boss.post(`${SA}/acces/ventes/${sid}`, { name: "Maintenant", starts_at: when(-DAY), ends_at: when(DAY) })).status, 302);
    const back = await checkout(cli, s1, "retard@example.test");
    assert.equal(back.status, 303, String(back.text).slice(0, 300)); assert.match(back.location, /confirmation/);
  });

  test("vente rattachée à une catégorie", async () => {
    assert.equal((await boss.post(`${SA}/categories`, { name: "Soldes privés" })).status, 302);
    const cat = one("SELECT id FROM mk_shop_categories WHERE site_id = ? AND name = ?", A.id, "Soldes privés");
    const p = await product(SA, A.id, "Chaise soldée");
    db.prepare("INSERT INTO mk_shop_product_categories (product_id, category_id) VALUES (?,?)").run(p.id, cat.id);
    assert.equal((await sale(SA, { name: "Cat close", starts_at: when(-3 * DAY), ends_at: when(-DAY), category_ids: String(cat.id) })).status, 302);
    assert.match(decodeURIComponent((await add(new Client(srv.base), s1, p.id)).location), /erreur=.*terminée/);
  });
});

describe("isolation entre sites", () => {
  test("membre, code, règle et vente d'une boutique ne touchent jamais l'autre", async () => {
    // Même e-mail sur les deux boutiques : comptes distincts
    const a = await customer(s1, "partage@example.test"); const b = await customer(s2, "partage@example.test");
    const idA = customerId(A.id, "partage@example.test"); const idB = customerId(B.id, "partage@example.test");
    assert.notEqual(idA, idB);
    const pa = await product(SA, A.id, "Réservé A"); const pb = await product(SB, B.id, "Réservé B");
    await rule(SA, pa.id, "lock"); await rule(SB, pb.id, "lock");
    assert.equal((await boss.post(`${SA}/acces/membres/${idA}/statut`, { statut: "approved" })).status, 302);
    assert.doesNotMatch((await add(a, s1, pa.id)).location, /erreur/, "membre sur A");
    assert.match(decodeURIComponent((await add(b, s2, pb.id)).location), /réservé aux membres/, "non membre sur B malgré le même e-mail");
    // Un identifiant de client ou de produit de A, présenté à l'admin de B, est introuvable
    await boss.post(`${SB}/acces/membres/${idA}/statut`, { statut: "approved" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_members WHERE customer_id = ? AND site_id = ?", idA, B.id).n, 0);
    await boss.post(`${SB}/acces/regles`, { kind: "product", product_id: String(pa.id), mode: "hide" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_access_rules WHERE target_id = ? AND site_id = ?", pa.id, B.id).n, 0);
    await boss.post(`${SB}/acces/ventes`, { name: "Étrangère", starts_at: when(-DAY), ends_at: when(DAY), product_ids: String(pa.id) });
    assert.equal(one("SELECT COUNT(*) n FROM mk_shop_sales WHERE name = ? AND site_id = ?", "Étrangère", B.id).n, 0);
    // Code de A inutilisable sur B
    await boss.post(`${SA}/acces/codes`, { max_uses: "3", code: "SEULEMENT-A" });
    const r = await b.post("/boutique/invitation", { code: "SEULEMENT-A" }, s2);
    assert.equal(r.status, 422);
    assert.equal(one("SELECT used_count FROM mk_shop_invitations WHERE code = 'SEULEMENT-A'").used_count, 0);
    // Règle de A : le produit de B de même nom reste libre ; la liste admin ne montre que les règles du site
    const listB = await boss.get(`${SB}/acces`);
    assert.equal(listB.status, 200);
    assert.doesNotMatch(listB.text, /Réservé A/);
    assert.match(listB.text, /Réservé B/);
  });
});
