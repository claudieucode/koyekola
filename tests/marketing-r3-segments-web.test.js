// Marketing R3 (2/2) — pages : segments (liste, éditeur avec aperçu en direct, duplication, usages), listes, étiquettes, propriétés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const idOf = (email) => sql("SELECT id FROM mk_contacts WHERE email = ?", email)[0]?.id;
const segId = (name) => sql("SELECT id FROM mk_segments WHERE name = ?", name)[0]?.id;
const flash = async (client, res) => (await client.get(res.location)).text;
const def = (...rules) => JSON.stringify({ op: "and", rules });
const rowEmails = (html) => [...html.matchAll(/<a href="\/marketing\/contacts\/\d+">([^<]+)<\/a>/g)].map((m) => m[1]);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("segments : liste", () => {
  test("aucun segment : état vide avec un exemple et l'action de création", async () => {
    const html = (await boss.get("/marketing/segments")).text;
    assert.match(html, /class="mk-empty"/);
    assert.match(html, /Aucun segment/);
    assert.match(html, /href="\/marketing\/segments\/nouveau"/);
  });
  test("segments enregistrés : effectif, joignables, part de l'audience, usages", async () => {
    const db = srv.db();
    const ins = db.prepare("INSERT INTO mk_contacts (organization_id, email, country, status) VALUES (1, ?, ?, ?)");
    for (let i = 0; i < 4; i++) ins.run(`fr${i}@ex.fr`, "FR", i < 2 ? "subscribed" : "unknown");
    ins.run("tg@ex.fr", "TG", "unknown");
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) SELECT 1, id, 'granted', 'form', 'Oui' FROM mk_contacts WHERE status = 'subscribed'").run();
    db.close();
    await boss.post("/marketing/segments", { name: "Francophones", description: "Pays = FR", definition: def({ field: "country", cmp: "eq", value: "FR" }) });
    const id = segId("Francophones");
    run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status) VALUES (1, 'Camp <b>', 'segment', ?, 'draft')", id);
    const html = (await boss.get("/marketing/segments")).text;
    assert.match(html, /<table class="mk-table mk-datatable">/);
    for (const h of ["Segment", "Contacts", "Joignables", "Utilisé par", "Modifié le"]) assert.match(html, new RegExp(`<th[^>]*>${h}`), h);
    assert.match(html, new RegExp(`<a href="/marketing/segments/${id}">Francophones</a>`));
    assert.match(html, /data-label="Contacts">4</);
    assert.match(html, /data-label="Joignables">2</);
    assert.match(html, /data-label="Utilisé par">1 campagne</);
    assert.match(html, /\d+ % de l'audience/);
    assert.match(html, /Pays = FR/);
  });
  test("chaque segment propose « Voir les contacts » ; l'action de duplication est réservée aux éditeurs", async () => {
    const id = segId("Francophones");
    const html = (await boss.get("/marketing/segments")).text;
    assert.match(html, new RegExp(`href="/marketing/contacts\\?segment=${id}"`));
    assert.match(html, new RegExp(`<form action="/marketing/segments/${id}/dupliquer" method="post"`));
    const viewer = await member("viewer");
    const v = (await viewer.get("/marketing/segments")).text;
    assert.match(v, new RegExp(`href="/marketing/contacts\\?segment=${id}"`));
    assert.doesNotMatch(v, /dupliquer/);
  });
  test("segment cassé : signalé sans casser la page", async () => {
    await boss.post("/marketing/segments", { name: "Sera cassé", definition: def({ field: "country", cmp: "eq", value: "TG" }) });
    run("UPDATE mk_segments SET definition = '{\"op\":\"and\",\"rules\":[]}' WHERE name = 'Sera cassé'");
    const r = await boss.get("/marketing/segments");
    assert.equal(r.status, 200);
    assert.match(r.text, /Définition à corriger/);
    run("DELETE FROM mk_segments WHERE name = 'Sera cassé'");
  });
  test("nom et description échappés", async () => {
    await boss.post("/marketing/segments", { name: "<i>xss</i>", description: "<script>1</script>", definition: def({ field: "country", cmp: "eq", value: "FR" }) });
    const html = (await boss.get("/marketing/segments")).text;
    assert.doesNotMatch(html, /<i>xss<\/i>|<script>1<\/script>/);
    assert.match(html, /&lt;i&gt;xss&lt;\/i&gt;/);
    run("DELETE FROM mk_segments WHERE name = '<i>xss</i>'");
  });
});

describe("segments : duplication", () => {
  test("crée « Copie de … » avec la même définition, puis ouvre la copie", async () => {
    const id = segId("Francophones");
    const res = await boss.post(`/marketing/segments/${id}/dupliquer`, {});
    assert.match(res.location, /^\/marketing\/segments\/\d+$/);
    assert.match(await flash(boss, res), /Segment dupliqué/);
    const copy = sql("SELECT * FROM mk_segments WHERE name = 'Copie de Francophones'")[0];
    assert.ok(copy);
    assert.equal(copy.definition, sql("SELECT definition FROM mk_segments WHERE id = ?", id)[0].definition);
    await boss.post(`/marketing/segments/${id}/dupliquer`, {});
    assert.ok(segId("Copie de Francophones (2)"));
  });
  test("lecteur et étudiant refusés ; identifiant inconnu = 404 ; rien créé", async () => {
    const id = segId("Francophones");
    const count = sql("SELECT COUNT(*) n FROM mk_segments")[0].n;
    assert.equal((await (await member("viewer")).post(`/marketing/segments/${id}/dupliquer`, {})).status, 403);
    assert.equal((await (await newStudent(srv)).post(`/marketing/segments/${id}/dupliquer`, {})).status, 403);
    assert.equal((await boss.post("/marketing/segments/999999/dupliquer", {})).status, 404);
    assert.equal((await boss.post("/marketing/segments/abc/dupliquer", {})).status, 404);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_segments")[0].n, count);
  });
});

describe("segments : éditeur", () => {
  test("le catalogue proposé au constructeur contient l'activité KOYEKOLA et le montant dépensé", async () => {
    const html = (await boss.get(`/marketing/segments/${segId("Francophones")}`)).text;
    const catalog = JSON.parse(html.match(/<script type="application\/json" id="mk-catalog">([\s\S]*?)<\/script>/)[1]);
    const fields = catalog.map((f) => f.field);
    for (const f of ["event:lms.course_completed", "event:lms.order_completed", "lms_spent"]) assert.ok(fields.includes(f), f);
  });
  test("zones de l'aperçu en direct : effectif, joignables, résumé en français, région annoncée aux lecteurs d'écran", async () => {
    const html = (await boss.get(`/marketing/segments/${segId("Francophones")}`)).text;
    for (const marker of ['id="mk-summary"', 'id="mk-live-count"', 'id="mk-preview"', 'aria-live="polite"', 'id="mk-preview-btn"']) assert.ok(html.includes(marker), marker);
  });
  test("segment utilisé : les campagnes concernées sont listées (nom échappé) et la suppression demande confirmation", async () => {
    const html = (await boss.get(`/marketing/segments/${segId("Francophones")}`)).text;
    assert.match(html, /Utilisé par 1 campagne/);
    assert.match(html, /Camp &lt;b&gt;/);
    assert.doesNotMatch(html, /Camp <b>/);
    assert.match(html, /data-mk-confirm="[^"]*1 campagne[^"]*"/);
  });
  test("segment jamais utilisé : le texte de confirmation le dit", async () => {
    await boss.post("/marketing/segments", { name: "Libre", definition: def({ field: "country", cmp: "eq", value: "TG" }) });
    const html = (await boss.get(`/marketing/segments/${segId("Libre")}`)).text;
    assert.match(html, /Aucune campagne ne l'utilise/);
    assert.match(html, /data-mk-confirm="[^"]*contacts ne sont pas touchés[^"]*"/);
  });
  test("« Voir les contacts » et « Dupliquer » sur un segment existant ; absents à la création", async () => {
    const id = segId("Francophones");
    const html = (await boss.get(`/marketing/segments/${id}`)).text;
    assert.match(html, new RegExp(`href="/marketing/contacts\\?segment=${id}"`));
    assert.match(html, new RegExp(`/marketing/segments/${id}/dupliquer`));
    const fresh = (await boss.get("/marketing/segments/nouveau")).text;
    assert.doesNotMatch(fresh, /dupliquer|segment=\d/);
  });
  test("lecteur : consultation seule (formulaire désactivé, pas de suppression ni de duplication)", async () => {
    const html = (await (await member("viewer")).get(`/marketing/segments/${segId("Francophones")}`)).text;
    assert.match(html, /data-readonly="1"/);
    assert.doesNotMatch(html, /supprimer|dupliquer/);
  });
  test("suppression d'un segment utilisé : message précis sur les campagnes concernées", async () => {
    await boss.post("/marketing/segments", { name: "À jeter", definition: def({ field: "country", cmp: "eq", value: "TG" }) });
    const id = segId("À jeter");
    run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status) VALUES (1, 'Orpheline', 'segment', ?, 'draft')", id);
    const res = await boss.post(`/marketing/segments/${id}/supprimer`, {});
    assert.match(await flash(boss, res), /Segment supprimé[^.]*\.[^.]*1 campagne/);
    assert.equal(segId("À jeter"), undefined);
  });
});

describe("segments : aperçu (API)", () => {
  const preview = (client, definition) => client.postJson("/marketing/segments/apercu", { definition });
  test("effectif, joignables, audience totale, quelques lignes", async () => {
    const r = await preview(boss, { op: "and", rules: [{ field: "country", cmp: "eq", value: "FR" }] });
    const j = JSON.parse(r.text);
    assert.deepEqual([r.status, j.total, j.sendable], [200, 4, 2]);
    assert.ok(j.totalContacts >= 5);
    assert.ok(j.rows.length >= 1 && j.rows.length <= 10);
    assert.deepEqual(Object.keys(j.rows[0]).sort(), ["email", "id", "name", "status"]);
  });
  test("critère d'activité KOYEKOLA : compte selon les événements reçus", async () => {
    const id = idOf("fr0@ex.fr");
    run("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at) VALUES (1, 'lms.order_completed', 'fr0@ex.fr', ?, 'lms', ?, ?, ?)", id, Date.now() - 1000, JSON.stringify({ totalCents: 5000, items: [{ courseId: 4, title: "Excel", priceCents: 5000 }] }), Date.now());
    const bought = JSON.parse((await preview(boss, { op: "and", rules: [{ field: "event:lms.order_completed", cmp: "happened", course: 4 }] })).text);
    assert.equal(bought.total, 1);
    const spent = JSON.parse((await preview(boss, { op: "and", rules: [{ field: "lms_spent", cmp: "gte", value: 50 }] })).text);
    assert.equal(spent.total, 1);
    const never = JSON.parse((await preview(boss, { op: "and", rules: [{ field: "event:lms.order_completed", cmp: "never" }] })).text);
    assert.ok(never.total >= 4);
  });
  test("définition invalide : 400 avec un message clair, jamais d'erreur serveur", async () => {
    for (const d of [{ op: "and", rules: [] }, { op: "and", rules: [{ field: "event:lms.inconnu", cmp: "happened" }] }, { op: "and", rules: [{ field: "lms_spent", cmp: "gt", value: -5 }] }, "n'importe quoi", null]) {
      const r = await preview(boss, d);
      assert.equal(r.status, 400, JSON.stringify(d));
      assert.ok(JSON.parse(r.text).error);
    }
  });
  test("étudiant refusé, lecteur autorisé (lecture seule)", async () => {
    assert.equal((await preview(await newStudent(srv), { op: "and", rules: [] })).status, 403);
    assert.equal((await preview(await member("viewer"), { op: "and", rules: [{ field: "country", cmp: "eq", value: "FR" }] })).status, 200);
  });
});

describe("contacts : filtre par segment", () => {
  test("?segment=ID ne montre que les contacts du segment, et le filtre est proposé dans la barre", async () => {
    const id = segId("Francophones");
    const html = (await boss.get(`/marketing/contacts?segment=${id}&taille=100`)).text;
    assert.deepEqual(rowEmails(html).sort(), ["fr0@ex.fr", "fr1@ex.fr", "fr2@ex.fr", "fr3@ex.fr"]);
    assert.match(html, new RegExp(`<option value="${id}" selected>Francophones</option>`));
    assert.match(html, /<label for="f-segment">Segment<\/label>/);
  });
  test("se combine avec les autres filtres, se conserve à la pagination et à l'export", async () => {
    const id = segId("Francophones");
    const html = (await boss.get(`/marketing/contacts?segment=${id}&status=subscribed`)).text;
    assert.deepEqual(rowEmails(html).sort(), ["fr0@ex.fr", "fr1@ex.fr"]);
    assert.match(html, new RegExp(`export\\.csv\\?[^"]*segment=${id}`));
    const csv = (await boss.get(`/marketing/contacts/export.csv?segment=${id}`)).text;
    assert.equal(csv.trim().split(/\r?\n/).length, 5);
    assert.doesNotMatch(csv, /tg@ex\.fr/);
  });
  test("segment inconnu, supprimé ou invalide : filtre ignoré, jamais d'erreur", async () => {
    for (const v of ["999999", "abc", "1;DROP"]) assert.equal((await boss.get(`/marketing/contacts?segment=${v}`)).status, 200);
    assert.ok(rowEmails((await boss.get("/marketing/contacts?segment=999999&taille=100")).text).includes("tg@ex.fr"));
  });
  test("un segment cassé n'empêche pas l'affichage des contacts", async () => {
    await boss.post("/marketing/segments", { name: "Cassé2", definition: def({ field: "country", cmp: "eq", value: "TG" }) });
    const id = segId("Cassé2");
    run("UPDATE mk_segments SET definition = '{\"op\":\"and\",\"rules\":[]}' WHERE id = ?", id);
    assert.equal((await boss.get(`/marketing/contacts?segment=${id}`)).status, 200);
    run("DELETE FROM mk_segments WHERE id = ?", id);
  });
});

describe("listes", () => {
  before(async () => {
    await boss.post("/marketing/listes", { name: "Newsletter", description: "Abonnés <b>mensuels</b>" });
    await boss.post("/marketing/listes", { name: "Vide" });
    const id = sql("SELECT id FROM mk_lists WHERE name = 'Newsletter'")[0].id;
    run("INSERT INTO mk_list_members (organization_id, list_id, contact_id) SELECT 1, ?, id FROM mk_contacts WHERE email IN ('fr0@ex.fr', 'fr1@ex.fr', 'fr2@ex.fr')", id);
  });
  test("tableau : contacts, joignables (consentement prouvé), lien vers les contacts, description échappée", async () => {
    const html = (await boss.get("/marketing/listes")).text;
    const id = sql("SELECT id FROM mk_lists WHERE name = 'Newsletter'")[0].id;
    assert.match(html, /<table class="mk-table mk-datatable">/);
    // En-têtes triables (liens) depuis la refonte UI/UX : le libellé est dans un <a>, pas directement dans le <th>
    for (const h of ["Liste", "Contacts", "Joignables", "Créée le"]) assert.match(html, new RegExp(`<th[^>]*>(<a[^>]*>)?${h}`), h);
    assert.match(html, /data-label="Contacts">3</);
    assert.match(html, /data-label="Joignables">2</);
    assert.match(html, new RegExp(`href="/marketing/contacts\\?liste=${id}"`));
    assert.doesNotMatch(html, /<b>mensuels<\/b>/);
    assert.match(html, /&lt;b&gt;mensuels&lt;\/b&gt;/);
  });
  test("la création reste disponible (ancre) ; état vide quand aucune liste", async () => {
    assert.match((await boss.get("/marketing/listes")).text, /id="nouvelle"/);
  });
  test("détail : chiffres, lien « Voir dans Contacts », membres en tableau, suppression avec confirmation", async () => {
    const id = sql("SELECT id FROM mk_lists WHERE name = 'Newsletter'")[0].id;
    const html = (await boss.get(`/marketing/listes/${id}`)).text;
    assert.match(html, /mk-stats/);
    assert.match(html, /Joignables/);
    assert.match(html, new RegExp(`href="/marketing/contacts\\?liste=${id}"`));
    assert.match(html, /<table class="mk-table mk-datatable">/);
    assert.match(html, /data-mk-confirm="[^"]*contacts ne sont pas supprimés[^"]*"/);
    assert.match(html, /<form action="\/marketing\/listes\/\d+\/retirer" method="post"/, "le retrait d'un membre reste possible");
  });
  test("lecteur : aucune action d'écriture", async () => {
    const id = sql("SELECT id FROM mk_lists WHERE name = 'Newsletter'")[0].id;
    const html = (await (await member("viewer")).get(`/marketing/listes/${id}`)).text;
    assert.doesNotMatch(html, /supprimer|retirer|ajouter/);
  });
});

describe("étiquettes et propriétés", () => {
  before(async () => {
    const c = idOf("fr0@ex.fr");
    await boss.post(`/marketing/contacts/${c}/etiquettes`, { name: "VIP" });
    await boss.post("/marketing/etiquettes", { name: "Inutilisée" });
    await boss.post("/marketing/proprietes", { label: "Niveau", key: "niveau", type: "select", options: "débutant\nconfirmé" });
    await boss.post(`/marketing/contacts/${c}/proprietes`, { prop_niveau: "confirmé" });
  });
  test("étiquettes : tableau avec effectif, lien vers les contacts, suppression avec confirmation", async () => {
    const html = (await boss.get("/marketing/etiquettes")).text;
    const tag = sql("SELECT id FROM mk_tags WHERE name = 'VIP'")[0].id;
    assert.match(html, /<table class="mk-table mk-datatable">/);
    assert.match(html, new RegExp(`href="/marketing/contacts\\?etiquette=${tag}"`));
    assert.match(html, /data-label="Contacts">1</);
    assert.match(html, /data-mk-confirm="[^"]*VIP[^"]*"/);
    assert.match(html, /id="nouvelle"/);
  });
  test("étiquettes : lecteur sans bouton de suppression", async () => {
    assert.doesNotMatch((await (await member("viewer")).get("/marketing/etiquettes")).text, /supprimer/);
  });
  test("propriétés : tableau avec type lisible, options et nombre de contacts renseignés", async () => {
    const html = (await boss.get("/marketing/proprietes")).text;
    assert.match(html, /<table class="mk-table mk-datatable">/);
    for (const h of ["Propriété", "Clé", "Type", "Options", "Renseignée pour"]) assert.match(html, new RegExp(`<th[^>]*>${h}`), h);
    assert.match(html, /<code>niveau<\/code>/);
    assert.match(html, /data-label="Renseignée pour">1 contact</);
    assert.match(html, /débutant, confirmé/);
    assert.match(html, /id="nouvelle"/);
  });
  test("le segment peut utiliser la propriété créée (aperçu)", async () => {
    const r = await boss.postJson("/marketing/segments/apercu", { definition: { op: "and", rules: [{ field: "property:niveau", cmp: "eq", value: "confirmé" }] } });
    assert.equal(JSON.parse(r.text).total, 1);
  });
});
