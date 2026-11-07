// Prise de rendez-vous (essayage, conseil, atelier) sur un VRAI serveur : créneaux calculés, double réservation refusée, annulation par lien signé, validation, isolation entre sites.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const A = require("../src/marketing/shop/appointments");

const HOST = "www.rdv-shop.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, SA, DATE, FAR, PAST, typeId, orgId;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const plus = (n) => new Date(Date.parse(`${A.localNow("Europe/Paris").date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const mails = (to) => db.prepare("SELECT * FROM mail_outbox WHERE to_email = ? AND kind = 'shop_appointment' ORDER BY id").all(to);
const slots = async (cli, date, type = typeId) => JSON.parse((await cli.get(`/boutique/rendez-vous/creneaux.json?type=${type}&date=${date}`, site)).text).slots;
const reserve = (cli, extra = {}) => cli.post("/boutique/rendez-vous", { type_id: String(typeId), date: DATE, time: "10:00", name: "Ada Lovelace", email: "ada@example.test", phone: "+33 6 12 34 56 78", note: "Pointure 38", ...extra }, site);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Boutique Rendez-vous" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } })).status, 200);
  SA = `/marketing/site-web/sites/${siteId}/boutique`;
  assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "RDV", notify_email: "vendeur@example.test", manual_instructions: "Virement" })).status, 302);
  assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
  orgId = one("SELECT organization_id AS o FROM mk_sites WHERE id = ?", siteId).o;
  DATE = plus(3); FAR = plus(200); PAST = plus(-2);
});
after(async () => { db.close(); await srv.stop(); });

describe("réglages vendeur et créneaux générés", () => {
  test("fermé tant que rien n'est configuré ; puis types + disponibilités + réglages ouvrent la page", async () => {
    const cli = new Client(srv.base);
    assert.equal((await cli.get("/boutique/rendez-vous", site)).status, 404);
    assert.equal((await cli.get(`${SA}/rendez-vous`.replace(SA, SA))).status !== 500, true);
    // type invalide : durée hors bornes, lieu manquant
    assert.equal((await boss.post(`${SA}/rendez-vous/types`, { name: "X", duration_min: "1", location_kind: "visio" })).status, 302);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appt_types WHERE site_id = ?", siteId).n, 0);
    assert.equal((await boss.post(`${SA}/rendez-vous/types`, { name: "Essayage", duration_min: "60", location_kind: "place", location: "" })).status, 302);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appt_types WHERE site_id = ?", siteId).n, 0, "lieu obligatoire en présentiel");
    assert.equal((await boss.post(`${SA}/rendez-vous/types`, { name: "Essayage <b>chaussures</b>", duration_min: "60", location_kind: "place", location: "12 rue des Tests, Paris", description: "Essayez en boutique" })).status, 302);
    const t = one("SELECT * FROM mk_shop_appt_types WHERE site_id = ?", siteId); typeId = t.id;
    assert.equal(t.name, "Essayage chaussures"); assert.doesNotMatch(t.name, /</);
    // règles : 09:00-12:00 tous les jours ; fin avant début refusée
    assert.equal((await boss.post(`${SA}/rendez-vous/disponibilites`, { weekday: ["1", "2", "3", "4", "5", "6", "7"], start_time: "12:00", end_time: "09:00" })).status, 302);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appt_rules WHERE site_id = ?", siteId).n, 0);
    assert.equal((await boss.post(`${SA}/rendez-vous/disponibilites`, { weekday: ["1", "2", "3", "4", "5", "6", "7"], start_time: "09:00", end_time: "12:00" })).status, 302);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appt_rules WHERE site_id = ?", siteId).n, 7);
    // pas ouvert au public tant que « enabled » n'est pas coché
    assert.equal((await cli.get("/boutique/rendez-vous", site)).status, 404);
    assert.equal((await boss.post(`${SA}/rendez-vous/reglages`, { enabled: "1", step_min: "30", min_notice_hours: "0", horizon_days: "30", timezone: "Europe/Paris" })).status, 302);
    const page = await cli.get("/boutique/rendez-vous", site);
    assert.equal(page.status, 200); assert.match(page.text, /Essayage chaussures/); assert.match(page.text, /60 min/);
    assert.match((await cli.get(`/boutique/rendez-vous?type=${typeId}`, site)).text, /créneau/);
    // fuseau inconnu refusé
    await boss.post(`${SA}/rendez-vous/reglages`, { enabled: "1", timezone: "Mars/Olympus" });
    assert.equal(one("SELECT timezone FROM mk_shop_appt_settings WHERE site_id = ?", siteId).timezone, "Europe/Paris");
  });

  test("créneaux : pas de 30 min, durée de 60 min, hors horizon/passé/exception vides", async () => {
    const cli = new Client(srv.base);
    assert.deepEqual(await slots(cli, DATE), ["09:00", "09:30", "10:00", "10:30", "11:00"]);
    assert.deepEqual(await slots(cli, FAR), [], "au-delà de l'horizon");
    assert.deepEqual(await slots(cli, PAST), [], "dans le passé");
    assert.equal((await cli.get(`/boutique/rendez-vous/creneaux.json?type=${typeId}&date=pas-une-date`, site)).status, 422);
    assert.equal((await cli.get(`/boutique/rendez-vous/creneaux.json?type=99999&date=${DATE}`, site)).status, 404);
    // exception : jour fermé, puis plage bloquée
    const d4 = plus(4);
    assert.equal((await boss.post(`${SA}/rendez-vous/exceptions`, { day: d4, reason: "Congés" })).status, 302);
    assert.deepEqual(await slots(cli, d4), []);
    db.prepare("DELETE FROM mk_shop_appt_exceptions WHERE site_id = ?").run(siteId);
    assert.equal((await boss.post(`${SA}/rendez-vous/exceptions`, { day: d4, start_time: "09:00", end_time: "10:30" })).status, 302);
    assert.deepEqual(await slots(cli, d4), ["10:30", "11:00"]);
    db.prepare("DELETE FROM mk_shop_appt_exceptions WHERE site_id = ?").run(siteId);
  });

  test("délai minimum : un créneau trop proche n'est jamais proposé", async () => {
    const s = { db, organizationId: orgId, siteId };
    const type = A.getType(s, typeId);
    const settings = { ...A.getSettings(s), min_notice_hours: 48, horizon_days: 30 };
    const now = new Date("2030-03-04T10:00:00Z"); // lundi 11:00 à Paris
    const lundi = "2030-03-04"; const mercredi = "2030-03-06";
    assert.deepEqual(A.slotsFor(s, type, lundi, { now, settings }), []);
    // mercredi 09:00 est à 46 h : trop proche ; 11:00 (48 h) est le premier
    assert.deepEqual(A.slotsFor(s, type, mercredi, { now, settings }).map((x) => x.time), ["11:00"]);
  });
});

describe("réservation, double réservation, e-mails", () => {
  let first;
  test("réservation valide : confirmation à l'écran, e-mails client ET vendeur, créneau retiré", async () => {
    const cli = new Client(srv.base);
    const slug = (() => { return null; })(); void slug;
    const r = await reserve(cli, { name: "Ada <script>alert(1)</script> Lovelace", note: "Pointure <b>38</b>" });
    assert.equal(r.status, 200, r.text.slice(0, 300));
    assert.match(r.text, /Rendez-vous enregistré/); assert.match(r.text, /à confirmer|encore la confirmer/); assert.doesNotMatch(r.text, /<script>alert/);
    first = one("SELECT * FROM mk_shop_appointments WHERE site_id = ?", siteId);
    assert.equal(first.status, "pending"); assert.equal(first.start_at, `${DATE} 10:00`); assert.equal(first.end_at, `${DATE} 11:00`);
    assert.doesNotMatch(first.customer_name + first.note, /</);
    assert.equal(mails("ada@example.test").length, 1); assert.match(mails("ada@example.test")[0].body, new RegExp(`/boutique/rendez-vous/annuler/${first.id}\\?k=[0-9a-f]{32}`));
    assert.equal(mails("vendeur@example.test").length, 1); assert.match(mails("vendeur@example.test")[0].subject, /Nouveau rendez-vous/);
    // 10:00 pris ; 09:30 et 10:30 chevauchent (durée 60 min) ; 09:00 et 11:00 restent libres
    assert.deepEqual(await slots(cli, DATE), ["09:00", "11:00"]);
  });

  test("double réservation refusée (même créneau, chevauchement) et contrainte unique en base", async () => {
    const cli = new Client(srv.base);
    assert.equal((await reserve(cli, { email: "autre@example.test" })).status, 409);
    assert.equal((await reserve(cli, { time: "10:30", email: "autre@example.test" })).status, 409);
    assert.equal((await reserve(cli, { time: "09:30", email: "autre@example.test" })).status, 409);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appointments WHERE site_id = ?", siteId).n, 1);
    assert.equal(mails("autre@example.test").length, 0);
    assert.throws(() => db.prepare("INSERT INTO mk_shop_appointments (organization_id, site_id, type_id, start_at, end_at, customer_name, customer_email) VALUES (?,?,?,?,?,?,?)").run(orgId, siteId, typeId, `${DATE} 10:00`, `${DATE} 10:30`, "X", "x@example.test"), /UNIQUE/);
    // deux demandes simultanées pour 09:00 : une seule gagne
    const [a, b] = await Promise.all([reserve(new Client(srv.base), { time: "09:00", email: "c1@example.test" }), reserve(new Client(srv.base), { time: "09:00", email: "c2@example.test" })]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appointments WHERE site_id = ? AND start_at = ? AND status <> 'cancelled'", siteId, `${DATE} 09:00`).n, 1);
  });

  test("validation serveur des champs", async () => {
    const cli = new Client(srv.base);
    const before = one("SELECT COUNT(*) AS n FROM mk_shop_appointments").n;
    const bad = { time: "11:00" };
    for (const extra of [{ email: "pas-un-mail" }, { email: "" }, { name: "A" }, { name: "" }, { phone: "abc<script>" }, { time: "25:99" }, { time: "" }, { time: "03:00" }, { date: "2030-02-31" }, { date: FAR }, { date: PAST }, { note: "x".repeat(10) && "" , type_id: "" }]) {
      const r = await reserve(cli, { ...bad, ...extra });
      assert.ok([404, 409, 422].includes(r.status), `${JSON.stringify(extra)} -> ${r.status}`);
    }
    assert.equal((await reserve(cli, { ...bad, type_id: "99999" })).status, 404);
    assert.equal((await reserve(cli, { ...bad, website: "http://spam" })).status, 422);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_appointments").n, before, "aucune ligne créée par une saisie invalide");
    // 3 rendez-vous à venir au plus par e-mail
    for (const t of ["11:00"]) assert.equal((await reserve(cli, { time: t, email: "gros@example.test", date: plus(5) })).status, 200);
    assert.equal((await reserve(cli, { time: "09:00", email: "gros@example.test", date: plus(5) })).status, 200);
    assert.equal((await reserve(cli, { time: "10:00", email: "gros@example.test", date: plus(6) })).status, 200);
    assert.equal((await reserve(cli, { time: "09:00", email: "gros@example.test", date: plus(6) })).status, 422);
  });

  test("référence produit via ?produit= et type inactif non réservable", async () => {
    const r0 = await boss.post(`${SA}/produits`, { name: "Paire de bottines", type: "simple", status: "published", price: "120,00", manage_stock: "1", stock_qty: "5", requires_shipping: "1" });
    assert.equal(r0.status, 302);
    const p = one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, "Paire de bottines");
    const cli = new Client(srv.base);
    const page = await cli.get(`/boutique/rendez-vous?type=${typeId}&date=${plus(7)}&produit=${p.slug}`, site);
    assert.match(page.text, /Paire de bottines/);
    const r = await cli.post("/boutique/rendez-vous", { type_id: String(typeId), date: plus(7), time: "09:00", name: "Grace Hopper", email: "grace@example.test", produit: p.slug }, site);
    assert.equal(r.status, 200); assert.match(r.text, /Paire de bottines/);
    assert.equal(one("SELECT product_id FROM mk_shop_appointments WHERE customer_email = 'grace@example.test'").product_id, p.id);
    assert.match(mails("grace@example.test")[0].body, /Produit concerné : Paire de bottines/);
    // produit inconnu : ignoré (pas de rattachement inventé)
    const r2 = await cli.post("/boutique/rendez-vous", { type_id: String(typeId), date: plus(7), time: "10:00", name: "Alan Turing", email: "alan@example.test", produit: "inexistant" }, site);
    assert.equal(r2.status, 200); assert.equal(one("SELECT product_id FROM mk_shop_appointments WHERE customer_email = 'alan@example.test'").product_id, null);
    // type désactivé
    db.prepare("UPDATE mk_shop_appt_types SET active = 0 WHERE id = ?").run(typeId);
    assert.equal((await cli.post("/boutique/rendez-vous", { type_id: String(typeId), date: plus(7), time: "11:00", name: "Zed Zed", email: "zed@example.test" }, site)).status, 404);
    db.prepare("UPDATE mk_shop_appt_types SET active = 1 WHERE id = ?").run(typeId);
  });
});

describe("annulation par lien signé", () => {
  test("mauvais jeton refusé ; bon jeton annule, libère le créneau et prévient le vendeur", async () => {
    const a = one("SELECT * FROM mk_shop_appointments WHERE customer_email = 'ada@example.test'");
    const cli = new Client(srv.base);
    const link = `/boutique/rendez-vous/annuler/${a.id}`;
    assert.equal((await cli.get(`${link}?k=${"0".repeat(32)}`, site)).status, 404);
    assert.equal((await cli.get(link, site)).status, 404);
    assert.equal((await cli.post(`${link}?k=${"0".repeat(32)}`, {}, site)).status, 404);
    assert.equal(one("SELECT status FROM mk_shop_appointments WHERE id = ?", a.id).status, "pending");
    const k = mails("ada@example.test")[0].body.match(/annuler\/\d+\?k=([0-9a-f]{32})/)[1]; // le jeton vient de l'e-mail réellement mis en file (la clé du serveur n'est pas celle du test)
    assert.equal(A.tokenOk(a, k), false, "un jeton fabriqué avec une autre clé ne vaut pas");
    const page = await cli.get(`${link}?k=${k}`, site);
    assert.equal(page.status, 200); assert.match(page.text, /Oui, annuler/);
    const done = await cli.post(`${link}?k=${k}`, {}, site);
    assert.equal(done.status, 200); assert.match(done.text, /annulé/);
    const row = one("SELECT status, cancelled_by FROM mk_shop_appointments WHERE id = ?", a.id);
    assert.equal(row.status, "cancelled"); assert.equal(row.cancelled_by, "customer");
    assert.ok(mails("vendeur@example.test").some((m) => /annulé par le client/.test(m.subject)));
    assert.ok((await slots(cli, DATE)).includes("10:00"), "le créneau est de nouveau libre");
    // le jeton d'un autre rendez-vous ne marche pas ici
    const other = one("SELECT * FROM mk_shop_appointments WHERE customer_email = 'grace@example.test'");
    assert.equal((await cli.post(`${link}?k=${mails("grace@example.test")[0].body.match(/k=([0-9a-f]{32})/)[1]}`, {}, site)).status, 404);
    // deuxième annulation : idempotente
    assert.equal((await cli.post(`${link}?k=${k}`, {}, site)).status, 200);
  });
});

describe("administration : agenda, confirmer, reporter, annuler", () => {
  test("liste, confirmation, report vers un créneau libre (refus si pris), annulation par le vendeur", async () => {
    const g = one("SELECT * FROM mk_shop_appointments WHERE customer_email = 'grace@example.test'");
    const list = await boss.get(`${SA}/rendez-vous`);
    assert.equal(list.status, 200); assert.match(list.text, /Grace Hopper/); assert.match(list.text, /Confirmer/);
    assert.equal((await boss.get(`${SA}/rendez-vous/reglages`)).status, 200);
    assert.equal((await boss.post(`${SA}/rendez-vous/${g.id}/statut`, { statut: "confirmed" })).status, 302);
    assert.equal(one("SELECT status FROM mk_shop_appointments WHERE id = ?", g.id).status, "confirmed");
    assert.ok(mails("grace@example.test").some((m) => /confirmé/.test(m.subject)));
    // report sur un créneau déjà pris (Alan à 10:00 ce jour-là) : refusé
    await boss.post(`${SA}/rendez-vous/${g.id}/reporter`, { date: plus(7), time: "10:00" });
    assert.equal(one("SELECT start_at FROM mk_shop_appointments WHERE id = ?", g.id).start_at, `${plus(7)} 09:00`);
    // hors disponibilités : refusé
    await boss.post(`${SA}/rendez-vous/${g.id}/reporter`, { date: plus(8), time: "15:00" });
    assert.equal(one("SELECT start_at FROM mk_shop_appointments WHERE id = ?", g.id).start_at, `${plus(7)} 09:00`);
    // créneau libre : accepté, client prévenu
    await boss.post(`${SA}/rendez-vous/${g.id}/reporter`, { date: plus(8), time: "11:00" });
    assert.equal(one("SELECT start_at FROM mk_shop_appointments WHERE id = ?", g.id).start_at, `${plus(8)} 11:00`);
    assert.ok(mails("grace@example.test").some((m) => /reporté/.test(m.subject)));
    // annulation par le vendeur
    assert.equal((await boss.post(`${SA}/rendez-vous/${g.id}/statut`, { statut: "cancelled" })).status, 302);
    const row = one("SELECT status, cancelled_by FROM mk_shop_appointments WHERE id = ?", g.id);
    assert.equal(row.status, "cancelled"); assert.equal(row.cancelled_by, "seller");
    assert.ok(mails("grace@example.test").some((m) => /annulé/.test(m.subject)));
    // un annulé ne se reporte pas
    await boss.post(`${SA}/rendez-vous/${g.id}/reporter`, { date: plus(9), time: "09:00" });
    assert.equal(one("SELECT start_at FROM mk_shop_appointments WHERE id = ?", g.id).start_at, `${plus(8)} 11:00`);
    // l'administration exige d'être connecté
    assert.equal([301, 302, 401, 403].includes((await new Client(srv.base).get(`${SA}/rendez-vous`)).status), true);
  });
});

describe("isolation entre sites", () => {
  test("agenda, créneaux et liens d'un site ne touchent jamais un autre site", async () => {
    const id2 = Number(String((await boss.post("/marketing/site-web/sites", { name: "Autre Boutique RDV" })).location).match(/sites\/(\d+)/)[1]);
    const s1 = { db, organizationId: orgId, siteId }; const s2 = { db, organizationId: orgId, siteId: id2 };
    const t2 = A.saveType(s2, { name: "Conseil", duration_min: "60", location_kind: "visio" });
    A.addRule(s2, { weekday: ["1", "2", "3", "4", "5", "6", "7"], start_time: "09:00", end_time: "12:00" });
    A.saveSettings(s2, { enabled: "1", step_min: "30", min_notice_hours: "0", horizon_days: "30" });
    // même créneau (DATE 10:00) : libre sur le site 2 alors qu'il est pris… (annulé plus haut : on le reprend sur le site 1)
    const a1 = A.book(s1, { type_id: typeId, date: DATE, time: "10:00", name: "Site Un", email: "un@example.test" });
    assert.ok(!A.slotsFor(s1, A.getType(s1, typeId), DATE).some((x) => x.time === "10:00"));
    assert.ok(A.slotsFor(s2, A.getType(s2, t2), DATE).some((x) => x.time === "10:00"), "créneau libre sur l'autre site");
    const a2 = A.book(s2, { type_id: t2, date: DATE, time: "10:00", name: "Site Deux", email: "deux@example.test" });
    assert.notEqual(a1.id, a2.id);
    // un type d'un site ne se réserve pas via un autre site
    assert.throws(() => A.book(s2, { type_id: typeId, date: DATE, time: "09:00", name: "Pirate", email: "pirate@example.test" }), /n'existe pas/);
    // lien d'annulation : valable seulement dans son site
    assert.throws(() => A.cancelByCustomer(s2, a1.id, A.token(a1)), /invalide/);
    assert.throws(() => A.cancelByCustomer(s1, a2.id, A.token(a2)), /invalide/);
    // agendas et plages séparés ; le vendeur ne voit pas l'autre
    assert.ok(A.adminList(s1).items.every((x) => x.site_id === siteId));
    assert.ok(A.adminList(s2).items.every((x) => x.site_id === id2));
    assert.equal(A.listRules(s2).length, 7); assert.equal(A.listTypes(s2).length, 1);
    A.removeRule(s1, A.listRules(s2)[0].id); assert.equal(A.listRules(s2).length, 7, "supprimer une règle d'un autre site ne fait rien");
    assert.throws(() => A.setStatus(s1, a2.id, "cancelled"), /introuvable/);
    // côté web, le site 2 n'a pas ouvert la boutique : l'hôte du site 1 ne montre jamais le type du site 2
    const page = await new Client(srv.base).get("/boutique/rendez-vous", site);
    assert.doesNotMatch(page.text, /Conseil/);
  });
});
