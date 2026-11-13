// Produits numériques (VRAI serveur) : fichier privé, livraison seulement après paiement, limite de téléchargements, expiration, révocation au remboursement, formats refusés, isolation entre sites.
const fs = require("node:fs");
const path = require("node:path");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const HA = "www.dl-un.example", HB = "www.dl-deux.example";
const hdr = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
let srv, boss, db, A, B;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

async function mkSite(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "D" + id, manual_instructions: "Virement" });
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/produits`, { name: "Guide PDF", type: "digital", status: "published", price: "10,00" });
  return { id, base, host, pid: one("SELECT id FROM mk_shop_products WHERE site_id = ?", id).id };
}
const upload = (S, name, buf, label = "Le guide") => { const fd = new FormData(); fd.set("label", label); fd.set("file", new Blob([buf]), name); return boss.request(`${S.base}/produits/${S.pid}/fichiers`, { method: "POST", multipart: fd }); };
async function buy(S) {
  const cli = new Client(srv.base), h = hdr(S.host);
  await cli.post("/boutique/panier/ajouter", { product_id: String(S.pid), quantity: "1" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => { const m = page.text.match(new RegExp(`name="${n}" value="([^"]+)"`)); assert.ok(m, `champ ${n} absent : ${page.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 300)}`); return m[1]; };
  const body = { email: "lecteur@example.test", ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), payment_method: "manual", expected_total: f("expected_total") };
  const sm = page.text.match(/name="shipping_method" value="(\d+)"/); if (sm) body.shipping_method = sm[1];
  const r = await cli.post("/boutique/commande", body, h);
  assert.equal(r.status, 303, String(r.text).slice(0, 300));
  return { cli, h, order: one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", S.id), k: new URL(r.location, "https://x").search };
}
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Telechargements Un", HA); B = await mkSite("Telechargements Deux", HB);
});
after(async () => { db.close(); await srv.stop(); });

test("formats dangereux ou faux refusés ; un PDF valide est rangé hors du dossier public sous un nom aléatoire", async () => {
  await upload(A, "virus.html", Buffer.from("<script>alert(1)</script>"));
  await upload(A, "faux.pdf", Buffer.from("<html>pas un pdf</html>"));
  await upload(A, "prog.exe", Buffer.from("MZ....."));
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_product_files WHERE site_id = ?", A.id).n, 0);
  const r = await upload(A, "guide complet.pdf", PDF); assert.equal(r.status, 302);
  const f = one("SELECT * FROM mk_shop_product_files WHERE site_id = ?", A.id);
  assert.ok(f && /^[0-9a-f]{32}\.pdf$/.test(f.stored_name));
  assert.ok(fs.existsSync(path.join(srv.dir, "data", "shop-files", f.stored_name)), "rangé dans shop-files");
  assert.equal(fs.existsSync(path.join(srv.dir, "uploads", f.stored_name)), false, "jamais dans le dossier public");
  assert.equal((await new Client(srv.base).get(`/uploads/${f.stored_name}`, hdr(HA))).status, 404);
});

test("rien n'est livré avant le paiement ; après paiement le lien télécharge le vrai fichier, limité à 2 fois ; lien falsifié refusé", async () => {
  await boss.post(`${A.base}/produits/${A.pid}/telechargement`, { download_limit: "2", download_days: "30" });
  const b = await buy(A);
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_downloads WHERE order_id = ?", b.order.id).n, 0, "pas de droit avant paiement");
  assert.equal((await boss.post(`${A.base}/commandes/${b.order.id}/statut`, { statut: "paid" })).status, 302);
  const dl = one("SELECT * FROM mk_shop_downloads WHERE order_id = ?", b.order.id); assert.ok(dl); assert.equal(dl.max_downloads, 2);
  const conf = await b.cli.get(`/boutique/commande/confirmation/${b.order.number}${b.k}`, b.h);
  const link = conf.text.match(/href="(\/boutique\/telechargement\/[0-9]+-[0-9a-f]{32})"/); assert.ok(link, "lien affiché sur la page de commande");
  const g1 = await new Client(srv.base).get(link[1], hdr(HA)); // pas besoin d'être connecté : le lien est le secret
  assert.equal(g1.status, 200); assert.ok(g1.body.equals(PDF)); assert.match(g1.headers.get("content-disposition"), /attachment/); assert.match(g1.headers.get("content-type"), /pdf/);
  assert.equal((await new Client(srv.base).get(link[1], hdr(HA))).status, 200);
  assert.equal((await new Client(srv.base).get(link[1], hdr(HA))).status, 410, "limite atteinte");
  assert.equal(one("SELECT download_count n FROM mk_shop_downloads WHERE id = ?", dl.id).n, 2);
  const forged = link[1].replace(/-[0-9a-f]{32}$/, "-" + "0".repeat(32));
  assert.equal((await new Client(srv.base).get(forged, hdr(HA))).status, 404);
  assert.equal((await new Client(srv.base).get(link[1], hdr(HB))).status, 404, "l'autre site ne sert pas ce lien");
});

test("lien expiré refusé ; remboursement total = téléchargement révoqué", async () => {
  await boss.post(`${A.base}/produits/${A.pid}/telechargement`, { download_limit: "0", download_days: "0" });
  const b = await buy(A); await boss.post(`${A.base}/commandes/${b.order.id}/statut`, { statut: "paid" });
  const dl = one("SELECT * FROM mk_shop_downloads WHERE order_id = ?", b.order.id); assert.equal(dl.max_downloads, null); assert.equal(dl.expires_at, null);
  const conf = await b.cli.get(`/boutique/commande/confirmation/${b.order.number}${b.k}`, b.h);
  const url = conf.text.match(/href="(\/boutique\/telechargement\/[0-9]+-[0-9a-f]{32})"/)[1];
  assert.equal((await new Client(srv.base).get(url, hdr(HA))).status, 200);
  db.prepare("UPDATE mk_shop_downloads SET expires_at = datetime('now','-1 day') WHERE id = ?").run(dl.id);
  assert.equal((await new Client(srv.base).get(url, hdr(HA))).status, 410, "expiré");
  db.prepare("UPDATE mk_shop_downloads SET expires_at = NULL WHERE id = ?").run(dl.id);
  assert.equal((await new Client(srv.base).get(url, hdr(HA))).status, 200);
  const total = one("SELECT total_cents FROM mk_shop_orders WHERE id = ?", b.order.id).total_cents;
  assert.equal((await boss.post(`${A.base}/commandes/${b.order.id}/remboursement`, { amount: (total / 100).toFixed(2).replace(".", ","), idempotency_key: "k-dl-1" })).status, 302);
  assert.equal((await new Client(srv.base).get(url, hdr(HA))).status, 410, "remboursée : plus de téléchargement");
});
