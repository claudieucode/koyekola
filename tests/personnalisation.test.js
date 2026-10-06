// Phase 13b — personnalisation des pages : chaque section ou élément peut s'adresser à un public (contacts connus,
// inconnus, abonnés, clients, élèves connectés, étiquette, score minimal), évalué avec ce que le site sait RÉELLEMENT
// du visiteur (compte connecté, ou contact relié à son navigateur avec accord). Les liens comptés suivent le même filtre.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";

describe("règles", () => {
  test("validation et correspondance", () => {
    assert.equal(nodes.normalizeAudience(undefined, "x"), undefined);
    assert.deepEqual(nodes.normalizeAudience({ who: "tag", value: " Photoshop " }, "x"), { who: "tag", value: "Photoshop" });
    assert.throws(() => nodes.normalizeAudience({ who: "tag" }, "x"), /indiquez l'étiquette/);
    assert.throws(() => nodes.normalizeAudience({ who: "score_min", value: -3 }, "x"), /score minimal invalide/);
    assert.throws(() => nodes.normalizeAudience({ who: "admin" }, "x"), /public d'affichage inconnu/);
    const anon = { known: false, student: false, subscribed: false, customer: false, tags: new Set(), score: 0 };
    const vip = { known: true, student: true, subscribed: true, customer: true, tags: new Set(["photoshop"]), score: 80 };
    for (const [who, value, a, v] of [["known", undefined, false, true], ["anonymous", undefined, true, false], ["customer", undefined, false, true], ["not_customer", undefined, true, false], ["subscribed", undefined, false, true], ["tag", "PhotoShop", false, true], ["not_tag", "photoshop", true, false], ["score_min", 50, false, true]]) {
      assert.equal(nodes.audienceMatches({ who, value }, anon), a, `${who} (inconnu)`);
      assert.equal(nodes.audienceMatches({ who, value }, vip), v, `${who} (client)`);
    }
  });
});

describe("page publique (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", PAIEMENT_SIMULE: "1" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("chaque visiteur voit ce qui lui est destiné ; canevas de l'éditeur : tout, avec l'étiquette du public", async () => {
    const id = Number((await boss.post("/marketing/pages", { name: "Personnalisée" })).location.match(/(\d+)$/)[1]);
    const H = (id0, text, audience) => ({ id: id0, type: "heading", props: { text, level: "2" }, ...(audience ? { audience } : {}) });
    const sections = [{ id: "sectperso001", type: "layout", children: [
      H("perso0000001", "Pour tout le monde"), H("perso0000002", "Bienvenue, inconnu", { who: "anonymous" }), H("perso0000003", "Content de vous revoir", { who: "known" }),
      H("perso0000004", "Spécial Photoshop", { who: "tag", value: "photoshop" }), H("perso0000005", "Merci pour votre achat", { who: "customer" }),
      { id: "perso0000006", type: "button", props: { label: "Offre clients", url: "/catalogue" }, audience: { who: "customer" } },
      { id: "perso0000007", type: "button", props: { label: "Découvrir", url: "/blog" } },
    ] }];
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const put = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } });
    assert.equal(put.status, 200, put.text);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const visible = (html) => ["Pour tout le monde", "Bienvenue, inconnu", "Content de vous revoir", "Spécial Photoshop", "Merci pour votre achat", "Offre clients"].filter((t) => html.includes(t));
    // Visiteur inconnu
    const anon = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.deepEqual(visible(anon), ["Pour tout le monde", "Bienvenue, inconnu"]);
    // Le bouton « Découvrir » est le 1er lien compté pour l'inconnu (le bouton réservé aux clients n'existe pas pour lui)
    const clic = anon.match(/href="(\/p\/[^"]+\/clic\/0)"[^>]*>Découvrir/);
    assert.ok(clic, "liens comptés dans l'ordre de CE que voit le visiteur");
    assert.equal((await new Client(srv.base).get(clic[1], { headers: { "User-Agent": UA } })).location, "/blog");
    // Élève connecté : connu ; avec l'étiquette ; puis client après un achat
    const student = await newStudent(srv);
    let html = (await student.get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.deepEqual(visible(html), ["Pour tout le monde", "Content de vous revoir"]);
    const contact = db.prepare("SELECT id FROM mk_contacts WHERE email = ?").get(student.email);
    const tag = db.prepare("INSERT INTO mk_tags (organization_id, name) VALUES (1, 'Photoshop') RETURNING id").get();
    db.prepare("INSERT INTO mk_contact_tags (organization_id, contact_id, tag_id) VALUES (1, ?, ?)").run(contact.id, tag.id);
    html = (await student.get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.ok(visible(html).includes("Spécial Photoshop"));
    const course = await createCourse(boss, srv, { title: "Retouche", price: 19 });
    await student.post(`/panier/ajouter/${course.id}`, {});
    await student.post("/commande", {});
    html = (await student.get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.deepEqual(visible(html), ["Pour tout le monde", "Content de vous revoir", "Spécial Photoshop", "Merci pour votre achat", "Offre clients"]);
    // Navigateur relié à un contact (mesure acceptée), sans être connecté : reconnu
    const vid = "a".repeat(32) + "." + String(Date.now() - 1000);
    db.prepare("INSERT INTO mk_web_visitors (id, organization_id, contact_id, first_seen, last_seen) VALUES (?, 1, ?, ?, ?)").run(vid, contact.id, Date.now(), Date.now());
    const linked = new Client(srv.base);
    linked.cookies.set("kw_consent", "1"); linked.cookies.set("kw_vid", vid);
    assert.ok(visible((await linked.get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text).includes("Content de vous revoir"));
    // Même navigateur sans accord : inconnu
    const refused = new Client(srv.base);
    refused.cookies.set("kw_consent", "0"); refused.cookies.set("kw_vid", vid);
    assert.ok(visible((await refused.get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text).includes("Bienvenue, inconnu"));
    // Canevas de l'éditeur : tout est montré, avec le public indiqué
    const canvas = await boss.postJson(`/marketing/pages/${id}/rendu`, { content: { sections } });
    assert.match(canvas.text, /data-audience-label="Clients \(au moins un achat\)"/);
    assert.match(canvas.text, /data-audience-label="Contacts avec l&#39;étiquette : photoshop"|data-audience-label="Contacts avec l'étiquette : photoshop"/);
  });
});
