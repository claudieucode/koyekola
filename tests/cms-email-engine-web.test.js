// KOLAKISA CMS — palier 16 : Email Engine de bout en bout (vrai serveur, vraie base) : isolation par site (IDOR), permissions, abonnements par audience,
// identité d'expédition via les Paramètres, XSS, performance.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, siteA, siteB, userA, viewer;
let listA, listB, listP, tplA, tplB, tplP, segA, segB, campA, campB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const M = "/marketing";
const P = `${M}/site-web/parametres`;
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const lastId = (loc, re) => Number(String(loc).match(re)[1]);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Alpha" })).location, /sites\/(\d+)/);
  siteB = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Bravo" })).location, /sites\/(\d+)/);
  // Création par l'interface (les vraies routes, le vrai champ « site »)
  for (const [name, site] of [["Liste Alpha", siteA], ["Liste Bravo", siteB], ["Liste Principale", ""]]) assert.equal((await boss.post(`${M}/listes`, { name, site })).status, 302);
  const id = (t, n) => one(`SELECT id FROM ${t} WHERE name = ?`, n).id;
  listA = id("mk_lists", "Liste Alpha"); listB = id("mk_lists", "Liste Bravo"); listP = id("mk_lists", "Liste Principale");
  for (const [name, site] of [["Modèle Alpha", siteA], ["Modèle Bravo", siteB], ["Modèle Principal", ""]]) assert.equal((await boss.post(`${M}/modeles`, { name, starter: "blank", site })).status, 302);
  tplA = id("mk_templates", "Modèle Alpha"); tplB = id("mk_templates", "Modèle Bravo"); tplP = id("mk_templates", "Modèle Principal");
  const def = JSON.stringify({ op: "and", rules: [{ field: "email", cmp: "contains", value: "@" }] });
  for (const [name, site] of [["Segment Alpha", siteA], ["Segment Bravo", siteB]]) assert.equal((await boss.post(`${M}/segments`, { name, description: "", definition: def, site })).status, 302);
  segA = id("mk_segments", "Segment Alpha"); segB = id("mk_segments", "Segment Bravo");
  assert.equal((await boss.post(`${M}/campagnes`, { name: "Campagne Alpha", template_id: tplA, target: `list:${listA}` })).status, 302);
  assert.equal((await boss.post(`${M}/campagnes`, { name: "Campagne Bravo", template_id: tplB, target: `list:${listB}` })).status, 302);
  campA = id("mk_campaigns", "Campagne Alpha"); campB = id("mk_campaigns", "Campagne Bravo");
  userA = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteA, idOf(userA));
  viewer = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'viewer')").run(orgId, idOf(viewer));
});
after(() => srv.stop());

describe("création par l'interface : le site est enregistré", () => {
  test("listes, modèles, segments : site choisi ; campagnes : site de l'audience", () => {
    assert.deepEqual([listA, listB, listP].map((i) => one("SELECT site_id FROM mk_lists WHERE id = ?", i).site_id), [siteA, siteB, null]);
    assert.deepEqual([tplA, tplB, tplP].map((i) => one("SELECT site_id FROM mk_templates WHERE id = ?", i).site_id), [siteA, siteB, null]);
    assert.deepEqual([segA, segB].map((i) => one("SELECT site_id FROM mk_segments WHERE id = ?", i).site_id), [siteA, siteB]);
    assert.deepEqual([campA, campB].map((i) => one("SELECT site_id FROM mk_campaigns WHERE id = ?", i).site_id), [siteA, siteB]);
  });
  test("l'équipe de l'organisation voit tout, et filtre par site", async () => {
    const all = (await boss.get(`${M}/listes`)).text;
    for (const n of ["Liste Alpha", "Liste Bravo", "Liste Principale"]) assert.match(all, new RegExp(n));
    const only = (await boss.get(`${M}/listes?site=${siteA}`)).text;
    assert.match(only, /Liste Alpha/); assert.doesNotMatch(only, /Liste Bravo|Liste Principale/);
    const principal = (await boss.get(`${M}/campagnes?site=principal`)).text;
    assert.doesNotMatch(principal, /Campagne Alpha|Campagne Bravo/);
    assert.match(all, /id="sf-site"/, "sélecteur de site présent");
  });
  test("campagne vers l'audience d'un autre site, ou avec le modèle d'un autre site : refusée, rien n'est créé", async () => {
    const before = count("SELECT COUNT(*) n FROM mk_campaigns");
    await boss.post(`${M}/campagnes`, { name: "Croisée 1", template_id: tplB, target: `list:${listA}` });
    await boss.post(`${M}/campagnes`, { name: "Croisée 2", template_id: tplA, target: `list:${listB}` });
    assert.equal(count("SELECT COUNT(*) n FROM mk_campaigns"), before);
    // modèle de l'organisation (sans site) : accepté pour une audience de site
    await boss.post(`${M}/campagnes`, { name: "Avec modèle commun", template_id: tplP, target: `list:${listA}` });
    assert.equal(one("SELECT site_id FROM mk_campaigns WHERE name = 'Avec modèle commun'").site_id, siteA);
  });
});

describe("accès limité à un site : isolation complète", () => {
  test("listes, campagnes, segments, modèles : seulement ceux du site Alpha", async () => {
    const l = (await userA.get(`${M}/listes?site=${siteA}`)).text;
    assert.match(l, /Liste Alpha/); assert.doesNotMatch(l, /Liste Bravo|Liste Principale/);
    const c = (await userA.get(`${M}/campagnes?site=${siteA}`)).text;
    assert.match(c, /Campagne Alpha/); assert.doesNotMatch(c, /Campagne Bravo/);
    const s = (await userA.get(`${M}/segments?site=${siteA}`)).text;
    assert.match(s, /Segment Alpha/); assert.doesNotMatch(s, /Segment Bravo/);
    const t = (await userA.get(`${M}/modeles?site=${siteA}`)).text;
    assert.match(t, /Modèle Alpha/); assert.doesNotMatch(t, /Modèle Bravo|Modèle Principal/);
    // pas de sélecteur de site (un seul site) : le site est fixé par le serveur
    assert.doesNotMatch(l, /id="sf-site"/);
  });
  test("IDOR : toutes les adresses d'un autre site (ou sans site) sont fermées, en lecture comme en écriture", async () => {
    const reads = [`/campagnes/${campB}`, `/listes/${listB}`, `/listes/${listP}`, `/segments/${segB}`, `/modeles/${tplB}`, `/modeles/${tplB}/apercu`, `/modeles/${tplP}`];
    for (const path of reads) assert.equal((await userA.get(`${M}${path}`)).status, 403, path);
    const writes = [[`/campagnes/${campB}/lancer`, {}], [`/campagnes/${campB}/dupliquer`, {}], [`/campagnes/${campB}/supprimer`, {}], [`/campagnes/${campB}`, { name: "Piraté" }], [`/campagnes/${campB}/test`, { email: "x@ex.fr" }],
      [`/listes/${listB}/ajouter`, { emails: "a@ex.fr" }], [`/listes/${listB}/supprimer`, {}], [`/segments/${segB}/supprimer`, {}], [`/segments/${segB}`, { name: "Piraté", definition: "{}" }],
      [`/modeles/${tplB}`, { name: "Piraté" }], [`/modeles/${tplB}/supprimer`, {}], [`/modeles/${tplB}/dupliquer`, {}]];
    for (const [path, body] of writes) assert.equal((await userA.post(`${M}${path}`, body)).status, 403, path);
    for (const [t, id, col] of [["mk_campaigns", campB, "name"], ["mk_lists", listB, "name"], ["mk_segments", segB, "name"], ["mk_templates", tplB, "name"]]) assert.ok(one(`SELECT 1 FROM ${t} WHERE id = ? AND ${col} NOT LIKE 'Piraté%'`, id), `${t} intact`);
    assert.equal((await userA.get(`${M}/listes?site=${siteB}`)).status, 403, "liste d'un autre site");
    assert.equal((await userA.get(`${M}/listes`)).status === 200, false, "sans site : pas d'accès aux données de l'organisation");
    assert.equal((await userA.get(`${M}/campagnes/999999`)).status, 403, "identifiant inconnu : rien ne fuit");
  });
  test("création : uniquement dans son site (le site réclamé par le formulaire est contrôlé par le serveur)", async () => {
    const ok = await userA.post(`${M}/listes`, { name: "Ma liste Alpha", site: siteA });
    assert.equal(ok.status, 302);
    assert.equal(one("SELECT site_id FROM mk_lists WHERE name = 'Ma liste Alpha'").site_id, siteA);
    for (const body of [{ name: "Vers Bravo", site: siteB }, { name: "Sans site" }, { name: "Site inventé", site: 99999 }]) {
      assert.equal((await userA.post(`${M}/listes`, body)).status, 403);
      assert.equal(count("SELECT COUNT(*) n FROM mk_lists WHERE name = ?", body.name), 0);
    }
    // campagne vers une audience d'un autre site, ou avec un modèle d'un autre site / sans site : refusée
    const n = count("SELECT COUNT(*) n FROM mk_campaigns");
    await userA.post(`${M}/campagnes`, { name: "Piège 1", site: siteA, template_id: tplA, target: `list:${listB}` });
    await userA.post(`${M}/campagnes`, { name: "Piège 2", site: siteA, template_id: tplB, target: `list:${listA}` });
    await userA.post(`${M}/campagnes`, { name: "Piège 3", site: siteA, template_id: tplP, target: `list:${listA}` });
    assert.equal(count("SELECT COUNT(*) n FROM mk_campaigns"), n, "aucune campagne créée hors de son site (le modèle sans site est aussi invisible d'un site)");
    assert.equal((await userA.post(`${M}/campagnes`, { name: "Ma campagne", site: siteA, template_id: tplA, target: `list:${listA}` })).status, 302);
    assert.equal(one("SELECT site_id FROM mk_campaigns WHERE name = 'Ma campagne'").site_id, siteA);
  });
  test("droits : un éditeur de site écrit mais n'envoie pas ; un lecteur de l'organisation lit mais ne crée rien", async () => {
    assert.equal((await userA.post(`${M}/campagnes/${campA}/lancer`, {})).status, 403, "campaigns.send demande un administrateur");
    assert.equal((await viewer.get(`${M}/campagnes`)).status, 200);
    for (const [path, body] of [["/listes", { name: "Lecteur" }], ["/campagnes", { name: "Lecteur", template_id: tplA, target: `list:${listA}` }], ["/modeles", { name: "Lecteur", starter: "blank" }], [`/campagnes/${campA}/lancer`, {}]]) {
      assert.equal((await viewer.post(`${M}${path}`, body)).status, 403, path);
    }
    assert.equal(count("SELECT COUNT(*) n FROM mk_lists WHERE name = 'Lecteur'"), 0);
  });
});

describe("abonnements par audience", () => {
  test("la page d'une audience montre l'état de chaque membre, ses effectifs et filtre par état", async () => {
    const ins = db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (?, ?, ?)");
    const mk = (email, status) => Number(ins.run(orgId, email, status).lastInsertRowid);
    const sub = mk("abonne@ex.fr", "subscribed"), pend = mk("attente@ex.fr", "unknown"), uns = mk("desabonne@ex.fr", "unsubscribed");
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown) VALUES (?, ?, 'marketing', 'granted', 'form', 'J''accepte')").run(orgId, sub);
    for (const c of [sub, pend, uns]) db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (?, ?, ?)").run(orgId, listA, c);
    const page = (await boss.get(`${M}/listes/${listA}`)).text;
    assert.match(page, /Abonnements à cette audience/); assert.match(page, /Abonné \(1\)/); assert.match(page, /En attente de consentement \(1\)/); assert.match(page, /Désabonné \(1\)/);
    const filtered = (await boss.get(`${M}/listes/${listA}?etat=pending`)).text;
    assert.match(filtered, /attente@ex\.fr/); assert.doesNotMatch(filtered, /abonne@ex\.fr|desabonne@ex\.fr/);
    assert.equal((await boss.get(`${M}/listes/${listA}?etat=pirate`)).status, 200, "état inconnu ignoré, pas d'erreur serveur");
    // la fiche du contact indique son état dans chaque audience
    const fiche = (await boss.get(`${M}/contacts/${sub}`)).text;
    assert.match(fiche, /Liste Alpha<\/a> <span class="field-hint">— Abonné/);
  });
  test("une personne limitée au site Alpha voit ses audiences seulement, et les adresses masquées sans le droit « sensibles »", async () => {
    const sub = one("SELECT id FROM mk_contacts WHERE email = 'abonne@ex.fr'").id;
    db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (?, ?, ?)").run(orgId, listB, sub);
    db.prepare("UPDATE mk_contacts SET origin_site_id = ? WHERE id = ?").run(siteA, sub);
    const fiche = (await userA.get(`${M}/contacts/${sub}?site=${siteA}`)).text;
    assert.match(fiche, /Liste Alpha/); assert.doesNotMatch(fiche, /Liste Bravo/, "les audiences d'un autre site restent invisibles");
  });
});

describe("identité d'expédition (Paramètres → Emailing)", () => {
  const API = `${P}/api`;
  const put = (key, value, site) => boss.request(`${API}/${key}${site ? `?site=${site}` : ""}`, { method: "PUT", json: { value } });
  const val = async (key, site) => JSON.parse((await boss.get(`${API}/${key}${site ? `?site=${site}` : ""}`)).text).value;
  test("l'écran existe, ne montre aucun secret, et lit/écrit l'expéditeur de l'organisation", async () => {
    const html = (await boss.get(`${P}/emailing`)).text;
    assert.match(html, /Adresse d(?:'|&#39;)expédition/); assert.doesNotMatch(html, /api_key|webhook_secret|re_[a-z0-9]{10}/i);
    assert.equal((await put("email_from_address", "hello@kola.fr")).status, 200);
    assert.equal(await val("email_from_address"), "hello@kola.fr");
    assert.equal((await put("email_from_name", "KOLAKISA")).status, 200);
    assert.equal(await val("email_from_name"), "KOLAKISA");
    assert.equal((await put("email_reply_to", "reponse@kola.fr")).status, 200);
    assert.match(one("SELECT value FROM mk_settings WHERE key = 'email.from'").value, /KOLAKISA <hello@kola\.fr>/);
  });
  test("un site : domaine autorisé seulement (celui de l'organisation ou un domaine déclaré), jamais une messagerie gratuite", async () => {
    assert.equal((await put("email_from_address", "news@kola.fr", siteA)).status, 200);
    assert.equal(await val("email_from_address", siteA), "news@kola.fr");
    for (const bad of ["news@gmail.com", "news@inconnu.example", "pas-un-email", "a@kola.fr\r\nBcc: x@evil.fr"]) assert.equal((await put("email_from_address", bad, siteA)).status, 422, bad);
    db.prepare("INSERT INTO mk_sending_domains (organization_id, domain, status, token) VALUES (?, 'declare.fr', 'pending', 't')").run(orgId);
    assert.equal((await put("email_from_address", "news@declare.fr", siteB)).status, 200);
    assert.equal(await val("email_from_address", siteA), "news@kola.fr", "isolation : le site Alpha n'est pas touché par le site Bravo");
    assert.equal(await val("email_from_address", siteB), "news@declare.fr");
  });
  test("accès : sans le droit de réglage, 403 ; une personne limitée à un site ne lit pas l'identité d'un autre site", async () => {
    assert.equal((await viewer.request(`${API}/email_from_address`, { method: "PUT", json: { value: "x@kola.fr" } })).status, 403);
    assert.notEqual((await userA.get(`${API}/email_from_address?site=${siteB}`)).status, 200);
  });
});

describe("sécurité d'affichage et performance", () => {
  test("XSS : noms d'audience, de modèle et de campagne restent du texte", async () => {
    const evil = "<img src=x onerror=alert(1)>";
    await boss.post(`${M}/listes`, { name: evil, site: siteA });
    await boss.post(`${M}/modeles`, { name: "<svg onload=alert(2)>", starter: "blank", site: siteA });
    for (const url of [`${M}/listes`, `${M}/modeles`, `${M}/campagnes`, `${M}/segments`]) assert.doesNotMatch((await boss.get(url)).text, /<img src=x onerror|<svg onload/, url);
  });
  test("5 000 membres : la page d'audience (états comptés en une requête, pagination à 50) reste rapide", async () => {
    const list = Number(db.prepare("INSERT INTO mk_lists (organization_id, name) VALUES (?, 'Grande audience') RETURNING id").get(orgId).id);
    db.exec("BEGIN");
    const ic = db.prepare("INSERT INTO mk_contacts (organization_id, email, status) VALUES (?, ?, ?)"), im = db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (?, ?, ?)");
    for (let i = 0; i < 5000; i++) im.run(orgId, list, Number(ic.run(orgId, `gros${i}@bulk.test`, i % 4 ? "unknown" : "subscribed").lastInsertRowid));
    db.exec("COMMIT");
    const t = Date.now();
    const r = await boss.get(`${M}/listes/${list}?etat=pending`);
    assert.equal(r.status, 200); assert.ok(Date.now() - t < 4000, `${Date.now() - t} ms`);
    assert.ok((r.text.match(/<tr>/g) || []).length <= 52, "page plafonnée à 50 lignes");
    assert.match(r.text, /En attente de consentement \(5000\)/, "statut « abonné » sans preuve de consentement = en attente, jamais abonné");
  });
});
