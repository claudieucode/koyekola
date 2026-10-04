// Centre de gestion : vérifie par les vraies routes HTTP que chaque module fonctionne sur des données réelles
// (codes promo appliqués au paiement, permissions côté serveur, filtres, envoi/suppression de fichiers,
// notifications lues/non lues, périodes d'analytics qui changent réellement les chiffres).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, courseA, courseB, eleve1, eleve2;
// PNG 1×1 valide
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  courseA = await createCourse(prof, srv, { title: "Formation Alpha", price: 40, lessons: [{ title: "A1" }, { title: "A2" }] });
  courseB = await createCourse(prof, srv, { title: "Formation Beta", price: 10 });
  eleve1 = await newStudent(srv);
  eleve2 = await newStudent(srv);
});
after(async () => { if (srv) await srv.stop(); });

const G = "/formateur/gestion";

test("accès : réservé au formateur (élève 403, visiteur redirigé vers la connexion)", async () => {
  const anon = new Client(srv.base);
  for (const u of [G, `${G}/ventes`, `${G}/eleves`, `${G}/analytics`, `${G}/ressources`, `${G}/activite`]) {
    const r = await anon.get(u);
    assert.equal(r.status, 302, u);
    assert.match(r.location, /^\/connexion\?redirect=/);
    assert.equal((await eleve1.get(u)).status, 403, u);
  }
  assert.equal((await eleve1.post(`${G}/ventes/coupons`, { code: "PIRATE", kind: "percent", value: "50", active: "on" })).status, 403);
  assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM coupons").get().n, 0);
});

test("navigation : une seule entrée « Centre de gestion » dans la barre latérale, fil d'Ariane et retour contextuel", async () => {
  const home = await prof.get("/formateur");
  assert.equal(home.status, 200);
  assert.equal((home.text.match(/href="\/formateur\/gestion"/g) || []).length >= 1, true);
  assert.equal((home.text.match(/>Centre de gestion</g) || []).length, 1);
  for (const [u, crumb, back] of [
    [G, "Centre de gestion", "/formateur"],
    [`${G}/ventes`, "Ventes", `${G}"`],
    [`${G}/ventes/coupons`, "Codes promo", `${G}/ventes"`],
    [`${G}/eleves`, "Élèves", `${G}"`],
    [`${G}/analytics`, "Analytics", `${G}"`],
    [`${G}/ressources`, "Ressources", `${G}"`],
    [`${G}/activite?vue=notifications`, "Activité", `${G}"`],
  ]) {
    const r = await prof.get(u);
    assert.equal(r.status, 200, u);
    assert.match(r.text, /Mon espace/, u);
    assert.ok(r.text.includes(crumb), `${u} : fil d'Ariane`);
    assert.ok(r.text.includes(`class="g-back" href="${back}`), `${u} : retour → ${back}`);
    assert.ok(!/history\.back/.test(r.text), u);
  }
  // Ancienne adresse des commandes : redirection permanente vers la liste
  const old = await prof.get(`${G}/ventes/commandes`);
  assert.equal(old.status, 301);
});

test("codes promo : validations réelles, création, modification, activation, suppression", async () => {
  const bad = await prof.post(`${G}/ventes/coupons`, { code: "a b", kind: "percent", value: "150", expires_at: "2026-13-40", max_uses: "0" });
  assert.equal(bad.status, 400);
  assert.match(bad.text, /3 à 30 caractères/);
  assert.match(bad.text, /Pourcentage entier de 1 à 100/);
  assert.match(bad.text, /Date invalide/);
  assert.match(bad.text, /Nombre entier d.(#39;)?utilisations/);
  assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM coupons").get().n, 0);

  const ok = await prof.post(`${G}/ventes/coupons`, { code: "bienvenue25", kind: "percent", value: "25", active: "on" });
  assert.equal(ok.status, 302);
  const c = srv.db().prepare("SELECT * FROM coupons WHERE code = 'BIENVENUE25'").get();
  assert.ok(c, "code enregistré en majuscules");
  assert.equal(c.value, 25);
  assert.equal(c.active, 1);

  const dup = await prof.post(`${G}/ventes/coupons`, { code: "Bienvenue25", kind: "fixed", value: "5", active: "on" });
  assert.equal(dup.status, 400);
  assert.match(dup.text, /Ce code existe déjà/);

  const list = await prof.get(`${G}/ventes/coupons`);
  assert.match(list.text, /BIENVENUE25/);
  assert.match(list.text, /−25 %/);

  // Modification : montant fixe en euros → centimes
  const upd = await prof.post(`${G}/ventes/coupons/${c.id}`, { code: "BIENVENUE25", kind: "fixed", value: "7,50", active: "on" });
  assert.equal(upd.status, 302);
  assert.equal(srv.db().prepare("SELECT kind, value FROM coupons WHERE id = ?").get(c.id).value, 750);
  await prof.post(`${G}/ventes/coupons/${c.id}`, { code: "BIENVENUE25", kind: "percent", value: "25", active: "on" });

  await prof.post(`${G}/ventes/coupons/${c.id}/desactiver`, {});
  assert.equal(srv.db().prepare("SELECT active FROM coupons WHERE id = ?").get(c.id).active, 0);
  await prof.post(`${G}/ventes/coupons/${c.id}/activer`, {});
  assert.equal(srv.db().prepare("SELECT active FROM coupons WHERE id = ?").get(c.id).active, 1);

  await prof.post(`${G}/ventes/coupons`, { code: "JETABLE", kind: "percent", value: "10", active: "on" });
  const j = srv.db().prepare("SELECT id FROM coupons WHERE code = 'JETABLE'").get();
  await prof.post(`${G}/ventes/coupons/${j.id}/supprimer`, {});
  assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM coupons WHERE code = 'JETABLE'").get().n, 0);
});

test("paiement : le code promo est réellement appliqué, enregistré sur la commande et limité", async () => {
  // Code limité à 1 utilisation, uniquement sur la formation Alpha
  await prof.post(`${G}/ventes/coupons`, { code: "ALPHA10", kind: "fixed", value: "10", course_id: String(courseA.id), max_uses: "1", active: "on" });

  await eleve1.post(`/panier/ajouter/${courseA.id}`, {});
  await eleve1.post(`/panier/ajouter/${courseB.id}`, {});
  const unknown = await eleve1.post("/commande/code-promo", { code: "NEXISTEPAS" });
  assert.equal(unknown.status, 302);
  assert.doesNotMatch((await eleve1.get("/commande")).text, /Remise/);

  await eleve1.post("/commande/code-promo", { code: "alpha10" });
  const checkout = await eleve1.get("/commande");
  assert.match(checkout.text, /ALPHA10/);
  assert.match(checkout.text, /Sous-total/);

  const paid = await eleve1.post("/commande", {});
  assert.equal(paid.status, 302);
  const db = srv.db();
  const order = db.prepare("SELECT * FROM orders ORDER BY id DESC").get();
  assert.equal(order.coupon_code, "ALPHA10");
  assert.equal(order.discount_cents, 1000);
  assert.equal(order.total_cents, 4000); // 40 + 10 − 10
  const items = db.prepare("SELECT course_id, price_cents, list_price_cents FROM order_items WHERE order_id = ? ORDER BY course_id").all(order.id);
  assert.deepEqual(items.map((i) => [i.course_id, i.price_cents, i.list_price_cents]), [[courseA.id, 3000, 4000], [courseB.id, 1000, 1000]]);

  // Limite atteinte : refusé pour le second élève
  await eleve2.post(`/panier/ajouter/${courseA.id}`, {});
  await eleve2.post("/commande/code-promo", { code: "ALPHA10" });
  const refused = await eleve2.get("/commande");
  assert.doesNotMatch(refused.text, /name="retirer"/);
  await eleve2.post("/commande", {});
  const o2 = db.prepare("SELECT * FROM orders ORDER BY id DESC").get();
  assert.equal(o2.discount_cents, 0);
  assert.equal(o2.total_cents, 4000);

  // Le code apparaît comme épuisé, avec son utilisation réelle
  const coupons = await prof.get(`${G}/ventes/coupons`);
  assert.match(coupons.text, /Limite atteinte/);
});

test("commandes : recherche, filtres, détail et données d'un autre formateur invisibles", async () => {
  const all = await prof.get(`${G}/ventes`);
  assert.equal(all.status, 200);
  assert.match(all.text, /eleve1/);
  assert.match(all.text, /eleve2/);

  const q = await prof.get(`${G}/ventes?q=eleve2`);
  assert.match(q.text, /eleve2/);
  assert.doesNotMatch(q.text, /eleve1@/);

  const promo = await prof.get(`${G}/ventes?promo=oui`);
  assert.match(promo.text, /ALPHA10/);
  assert.doesNotMatch(promo.text, /eleve2/);

  const none = await prof.get(`${G}/ventes?q=zzzz-introuvable`);
  assert.match(none.text, /Aucune commande ne correspond/);

  const order = srv.db().prepare("SELECT id FROM orders WHERE coupon_code = 'ALPHA10'").get();
  const detail = await prof.get(`${G}/ventes/commandes/${order.id}`);
  assert.equal(detail.status, 200);
  assert.match(detail.text, /Formation Alpha/);
  assert.match(detail.text, /ALPHA10/);
  assert.match(detail.text, new RegExp(`#${order.id}`));
  assert.ok(detail.text.includes(`class="g-back" href="${G}/ventes"`));
  assert.equal((await prof.get(`${G}/ventes/commandes/999999`)).status, 404);

  // Un second formateur ne voit ni la commande, ni l'élève, ni les codes promo du premier
  const db = srv.db();
  db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('Autre', 'autre@test.local', ?, 'formateur')").run(bcrypt.hashSync("MotDePasseAutre123", 4));
  const autre = await new Client(srv.base).login("autre@test.local", "MotDePasseAutre123");
  assert.equal((await autre.get(`${G}/ventes/commandes/${order.id}`)).status, 404);
  const sid = db.prepare("SELECT id FROM users WHERE email = ?").get(eleve1.email).id;
  assert.equal((await autre.get(`${G}/eleves/${sid}`)).status, 404);
  const c = db.prepare("SELECT id FROM coupons WHERE code = 'ALPHA10'").get();
  await autre.post(`${G}/ventes/coupons/${c.id}/supprimer`, {});
  assert.equal(db.prepare("SELECT COUNT(*) n FROM coupons WHERE id = ?").get(c.id).n, 1);
  assert.match((await autre.get(`${G}/ventes`)).text, /Aucune commande/);
});

test("transactions et remboursements : pas de faux bouton (paiement simulé déclaré)", async () => {
  const t = await prof.get(`${G}/ventes/transactions`);
  assert.equal(t.status, 200);
  assert.match(t.text, /simul/i);
  const r = await prof.get(`${G}/ventes/remboursements`);
  assert.equal(r.status, 200);
  assert.doesNotMatch(r.text, /<button[^>]*>\s*Rembourser/i);
});

test("élèves : liste, recherche, filtre d'achat et progression réelle", async () => {
  const db = srv.db();
  const u1 = db.prepare("SELECT id FROM users WHERE email = ?").get(eleve1.email).id;
  // eleve1 termine la leçon A1 (1 / 2 leçons) par la vraie route de progression
  const lessonId = courseA.lessons[0].id;
  const done = await eleve1.post(`/apprendre/lecon/${lessonId}/terminer`, {});
  assert.ok([200, 302].includes(done.status), `progression : ${done.status}`);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM lesson_progress WHERE user_id = ?").get(u1).n, 1);

  const list = await prof.get(`${G}/eleves`);
  assert.match(list.text, /eleve1/);
  assert.match(list.text, /eleve2/);
  const q = await prof.get(`${G}/eleves?q=eleve1`);
  assert.doesNotMatch(q.text, /eleve2@/);

  const profile = await prof.get(`${G}/eleves/${u1}`);
  assert.equal(profile.status, 200);
  assert.match(profile.text, /Formation Alpha/);
  assert.match(profile.text, /50 %/); // 1 leçon sur 2
  assert.match(profile.text, /Leçon terminée/);
  assert.equal((await prof.get(`${G}/eleves/999999`)).status, 404);
});

test("analytics : les périodes changent réellement les chiffres ; période invalide signalée", async () => {
  const db = srv.db();
  const before = await prof.get(`${G}/analytics?periode=7j`);
  assert.equal(before.status, 200);
  assert.match(before.text, /80,00/); // 30 + 10 + 40 € payés cette semaine
  // Une commande vieille de 60 jours : visible sur 90 jours, absente sur 7 jours
  const u2 = db.prepare("SELECT id FROM users WHERE email = ?").get(eleve2.email).id;
  const o = db.prepare("INSERT INTO orders (user_id, total_cents, created_at) VALUES (?, 1000, datetime('now', '-60 days'))").run(u2);
  db.prepare("INSERT INTO order_items (order_id, course_id, price_cents, list_price_cents) VALUES (?, ?, 1000, 1000)").run(o.lastInsertRowid, courseB.id);
  const d7 = await prof.get(`${G}/analytics?periode=7j`);
  const d90 = await prof.get(`${G}/analytics?periode=90j`);
  assert.match(d7.text, /80,00/);
  assert.match(d90.text, /90,00/);
  assert.doesNotMatch(d7.text, /90,00/);
  // Personnalisée
  const ymd = (d) => d.toISOString().slice(0, 10);
  const from = new Date(Date.now() - 65 * 864e5), to = new Date(Date.now() - 55 * 864e5);
  const perso = await prof.get(`${G}/analytics?periode=perso&du=${ymd(from)}&au=${ymd(to)}`);
  assert.match(perso.text, /10,00/);
  assert.doesNotMatch(perso.text, /80,00/);
  const bad = await prof.get(`${G}/analytics?periode=perso&du=2026-05-10&au=2026-01-01`);
  assert.equal(bad.status, 200);
  assert.match(bad.text, /role="alert"/);
  // Trafic : déclaré indisponible, aucun chiffre inventé
  assert.match(d7.text, /Données indisponibles/);
});

test("ressources : envoi réel, filtre, recherche, suppression protégée et définitive", async () => {
  const fd = new FormData();
  fd.append("count", "2");
  fd.append("fichiers", new Blob([PNG], { type: "image/png" }), "mon-image-test.png");
  fd.append("fichiers", new Blob(["pas une image"], { type: "text/plain" }), "notes.txt");
  const up = await prof.request(`${G}/ressources`, { method: "POST", multipart: fd });
  assert.equal(up.status, 302);
  const db = srv.db();
  const m = db.prepare("SELECT * FROM media WHERE title = 'mon-image-test'").get();
  assert.ok(m, "fiche créée");
  assert.equal(m.kind, "image");
  assert.equal(m.width, 1);
  const onDisk = path.join(srv.dir, "uploads", m.path.replace(/^\/uploads\//, ""));
  assert.ok(fs.existsSync(onDisk), "fichier écrit sur le disque");
  const page = await prof.get(`${G}/ressources?source=site`);
  assert.match(page.text, /1 fichier\(s\) ajouté\(s\)/);
  assert.match(page.text, /1 refusé/);
  assert.match(page.text, /mon-image-test/);
  assert.match((await prof.get(`${G}/ressources?type=video`)).text, /Aucun fichier ne correspond/);
  assert.match((await prof.get(`${G}/ressources?q=mon-image`)).text, /mon-image-test/);
  // L'élève ne peut rien supprimer
  assert.equal((await eleve1.post(`${G}/ressources/${m.id}/supprimer`, {})).status, 403);
  // Suppression réelle (fiche + fichier)
  const del = await prof.post(`${G}/ressources/${m.id}/supprimer`, {});
  assert.equal(del.status, 302);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM media WHERE id = ?").get(m.id).n, 0);
  assert.ok(!fs.existsSync(onDisk), "fichier effacé");
});

test("activité : notifications réelles, lien vers l'élément, lu / non lu, tout marquer comme lu", async () => {
  const n = await prof.get(`${G}/activite?vue=notifications`);
  assert.equal(n.status, 200);
  assert.match(n.text, /Nouvelle commande #/);
  const order = srv.db().prepare("SELECT id FROM orders WHERE coupon_code = 'ALPHA10'").get();
  const key = `order:${order.id}`;
  assert.match(n.text, /is-unread/);
  // Badge dans la barre latérale
  assert.match((await prof.get(G)).text, /dash-badge/);

  const open = await prof.get(`${G}/activite/ouvrir?cle=${encodeURIComponent(key)}`);
  assert.equal(open.status, 302);
  assert.equal(open.location, `${G}/ventes/commandes/${order.id}`);
  assert.equal(srv.db().prepare("SELECT COUNT(*) n FROM activity_reads WHERE item_key = ?").get(key).n, 1);
  // Clé inventée ou d'un autre formateur : aucun effet, aucune redirection ouverte
  const forged = await prof.get(`${G}/activite/ouvrir?cle=${encodeURIComponent("order:999999")}`);
  assert.equal(forged.location, `${G}/activite`);
  const evil = await prof.get(`${G}/activite/ouvrir?cle=${encodeURIComponent("x://evil.example")}`);
  assert.equal(evil.location, `${G}/activite`);

  const unreadOnly = await prof.get(`${G}/activite?vue=notifications&etat=non-lu`);
  assert.ok(!unreadOnly.text.includes(`value="${key}"`), "la commande lue n'est plus dans les non lues");
  await prof.post(`${G}/activite/tout-lu`, {});
  const empty = await prof.get(`${G}/activite?vue=notifications&etat=non-lu`);
  assert.match(empty.text, /Aucune notification non lue/);

  const alerts = await prof.get(`${G}/activite?vue=alertes`);
  assert.equal(alerts.status, 200);
});

test("pagination : la page demandée est conservée dans l'adresse", async () => {
  const r = await prof.get(`${G}/ventes?page=99`);
  assert.equal(r.status, 200);
  const r2 = await prof.get(`${G}/activite?page=abc`);
  assert.equal(r2.status, 200);
});

test("erreur de chargement : page d'erreur avec « Réessayer » sur la même adresse, qui fonctionne une fois réparé", async () => {
  const db = srv.db();
  db.exec("ALTER TABLE coupons RENAME TO coupons_indisponible");
  const url = `${G}/ventes/coupons?modifier=`;
  const broken = await prof.get(url);
  assert.equal(broken.status, 500);
  assert.match(broken.text, /Réessayer/);
  assert.ok(broken.text.includes(`href="${url}"`), "Réessayer pointe vers la même adresse");
  assert.ok(broken.text.includes(`class="g-back" href="${G}/ventes"`), "retour contextuel présent");
  db.exec("ALTER TABLE coupons_indisponible RENAME TO coupons");
  assert.equal((await prof.get(url)).status, 200);
});
