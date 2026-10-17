// R7 (lot 2) — Formulaires par site, protection des contacts et consentements (D2, 16/10/2026). Vrai serveur, base jetable, plusieurs sites et profils :
// éditeur du site A, éditeur du site B, équipe de l'organisation, visiteur anonyme. Les réponses HTTP ET les écritures en base sont vérifiées.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, A, B, edA, edB, F = {}, K = {}, n = 0;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const C = "/marketing/contacts", FO = "/marketing/formulaires";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const add = (email, site = null, extra = {}) => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id, status) VALUES (?, ?, ?, ?)").run(orgId, email, site, extra.status || "unknown").lastInsertRowid);
// une adresse IP différente par envoi (confiance au proxy : X-Forwarded-For) pour ne pas déclencher la limite de débit de 5 envois par heure et par IP
const publicSubmit = (slug, fields) => new Client(srv.base).request(`/f/${slug}`, { method: "POST", form: { ft: srv.formToken(), consent: "1", ...fields }, headers: { "X-Forwarded-For": `203.0.113.${(n += 1)}` } });
const row = (id) => ({ ...one("SELECT first_name, last_name, company, status, origin_site_id, lifecycle_stage, updated_at FROM mk_contacts WHERE id = ?", id) });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  A = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
  B = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bravo" })).location.match(/sites\/(\d+)/)[1]);
  edA = await newStudent(srv); edB = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(A, idOf(edA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(B, idOf(edB));
  // formulaires : A (créé par l'éditeur de A), B (créé par l'éditeur de B), principal (créé par l'équipe) ; publiés, sans double confirmation (inscription immédiate)
  await edA.post(`${FO}?site=${A}`, { name: "Form Alpha", consentText: "J'accepte (Alpha).", site: A });
  await edB.post(`${FO}?site=${B}`, { name: "Form Bravo", consentText: "J'accepte (Bravo).", site: B });
  await boss.post(FO, { name: "Form Principal", consentText: "J'accepte (principal)." });
  for (const [key, name] of [["A", "Form Alpha"], ["B", "Form Bravo"], ["P", "Form Principal"]]) {
    const f = one("SELECT id, slug FROM mk_forms WHERE name = ?", name);
    F[key] = f.id; K[key] = f.slug;
    // les formulaires collectent prénom, nom, société (sinon ces champs envoyés seraient ignorés et les tests de complétion ne prouveraient rien)
    db.prepare("UPDATE mk_forms SET double_optin = 0, status = 'published', fields = '[\"first_name\",\"last_name\",\"company\"]' WHERE id = ?").run(f.id);
  }
});
after(() => { db.close(); return srv.stop(); });

describe("formulaires : rattachement et administration par site", () => {
  test("un formulaire créé par un accès limité reçoit SON site (même si le corps de la requête en désigne un autre) ; l'équipe choisit ; sans choix = site principal", async () => {
    assert.equal(one("SELECT site_id s FROM mk_forms WHERE id = ?", F.A).s, A);
    assert.equal(one("SELECT site_id s FROM mk_forms WHERE id = ?", F.B).s, B);
    assert.equal(one("SELECT site_id s FROM mk_forms WHERE id = ?", F.P).s, null);
    await edA.post(`${FO}?site=${A}`, { name: "Form Triche", consentText: "J'accepte.", site: B, site_id: B });
    assert.equal(one("SELECT site_id s FROM mk_forms WHERE name = 'Form Triche'").s, A, "le site vient du serveur");
    await boss.post(FO, { name: "Form Équipe B", consentText: "J'accepte.", site: B });
    assert.equal(one("SELECT site_id s FROM mk_forms WHERE name = 'Form Équipe B'").s, B);
  });
  test("lecture : l'éditeur du site B ne voit ni ne lit les formulaires du site A ni ceux du site principal ; l'équipe voit tout", async () => {
    const list = (await edB.get(`${FO}?site=${B}`)).text;
    assert.match(list, /Form Bravo/); assert.doesNotMatch(list, /Form Alpha|Form Principal/);
    // refus par la portée des routes : le site visé est celui du formulaire (autre site ou site principal) → 403, jamais 200
    for (const id of [F.A, F.P]) { const r = await edB.get(`${FO}/${id}?site=${B}`); assert.ok([403, 404].includes(r.status), `formulaire ${id} : ${r.status}`); assert.doesNotMatch(r.text, /Form Alpha|Form Principal/); }
    assert.equal((await edB.get(`${FO}?site=${A}`)).status, 403, "autre site");
    const all = (await boss.get(FO)).text;
    for (const t of ["Form Alpha", "Form Bravo", "Form Principal"]) assert.match(all, new RegExp(t));
  });
  test("écriture : modifier, publier, dépublier, supprimer le formulaire d'un autre site est refusé et ne change rien ; le sien, oui", async () => {
    const before = { ...one("SELECT name, status, consent_text FROM mk_forms WHERE id = ?", F.A) };
    for (const [p, body] of [[`${FO}/${F.A}?site=${B}`, { name: "PIRATE", consentText: "Piraté", site: B }], [`${FO}/${F.A}/depublier?site=${B}`, { site: B }], [`${FO}/${F.A}/supprimer?site=${B}`, { site: B }], [`${FO}/${F.P}/supprimer?site=${B}`, { site: B }]]) {
      const r = await edB.post(p, body);
      assert.ok([404, 403].includes(r.status) || (r.status === 302 && /formulaires/.test(String(r.location))), `${p} -> ${r.status}`);
    }
    assert.deepEqual({ ...one("SELECT name, status, consent_text FROM mk_forms WHERE id = ?", F.A) }, before);
    assert.equal(count("SELECT COUNT(*) n FROM mk_forms WHERE id IN (?, ?)", F.A, F.P), 2);
    const own = await edA.post(`${FO}/${F.A}/depublier?site=${A}`, { site: A });
    assert.ok([200, 302].includes(own.status), String(own.status));
    assert.equal(one("SELECT status s FROM mk_forms WHERE id = ?", F.A).s, "draft");
    db.prepare("UPDATE mk_forms SET status = 'published' WHERE id = ?").run(F.A);
  });
});

describe("soumissions publiques : site réel du formulaire, origine du contact, consentement", () => {
  test("le contact créé par le formulaire du site A a pour origine A ; le site du consentement et l'événement sont A ; un site/identifiant envoyé par le navigateur est ignoré", async () => {
    const r = await publicSubmit(K.A, { email: "nouveau.alpha@ex.fr", site: B, site_id: B, origin_site_id: B, siteId: B });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const c = one("SELECT id, origin_site_id o, status FROM mk_contacts WHERE email = 'nouveau.alpha@ex.fr'");
    assert.equal(c.o, A); assert.equal(c.status, "subscribed");
    assert.equal(one("SELECT site_id s, form_id f FROM mk_consents WHERE contact_id = ?", c.id).s, A);
    assert.equal(one("SELECT link FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", c.id, A).link, "origin");
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", c.id, B), 0);
    assert.equal(one("SELECT site_id s FROM mk_events WHERE contact_id = ? AND name = 'form.submitted'", c.id).s, A);
  });
  test("compatibilité historique : le formulaire du site principal crée un contact sans origine de site, consentement sans site, comme avant", async () => {
    assert.equal((await publicSubmit(K.P, { email: "principal@ex.fr" })).status, 302);
    const c = one("SELECT id, origin_site_id o, status FROM mk_contacts WHERE email = 'principal@ex.fr'");
    assert.equal(c.o, null); assert.equal(c.status, "subscribed");
    assert.equal(one("SELECT site_id s FROM mk_consents WHERE contact_id = ?", c.id).s, null);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ?", c.id), 0);
  });
  test("adresse déjà connue d'un autre site ou de l'historique : réponse identique à une adresse inconnue ; fiche NON complétée ; AUCUNE association avec le site du formulaire", async () => {
    const own = add("existant.bravo@ex.fr", B), legacy = add("existant.historique@ex.fr");
    const before = [row(own), row(legacy)];
    const rOwn = await publicSubmit(K.A, { email: "existant.bravo@ex.fr", first_name: "Pirate", last_name: "Intrus", company: "X" });
    const rLegacy = await publicSubmit(K.A, { email: "existant.historique@ex.fr", first_name: "Pirate" });
    const rNew = await publicSubmit(K.A, { email: "inconnu.total@ex.fr", first_name: "Neuf" });
    for (const r of [rOwn, rLegacy, rNew]) assert.equal(r.status, 302);
    assert.equal(rOwn.location, rNew.location, "même redirection"); assert.equal(rLegacy.location, rNew.location);
    const strip = (t) => t.replace(/[0-9a-f]{20,}/g, "").replace(/\s+/g, " ");
    assert.equal(strip(rOwn.text), strip(rNew.text), "même corps");
    const a = row(own), b = row(legacy);
    assert.equal(a.first_name || "", before[0].first_name || ""); assert.equal(b.first_name || "", before[1].first_name || "");
    assert.equal(a.company || "", ""); assert.equal(a.last_name || "", "");
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id IN (?, ?) AND site_id = ?", own, legacy, A), 0, "le site A n'obtient aucun accès à ces fiches");
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE contact_id IN (?, ?) AND site_id = ?", own, legacy, A), 0);
    assert.equal((await edA.get(`${C}/${own}?site=${A}`)).status, 404);
    assert.equal((await edA.get(`${C}/${legacy}?site=${A}`)).status, 404);
    // le contact créé par la même voie reste, lui, de l'origine A et complété
    assert.equal(one("SELECT first_name f, origin_site_id o FROM mk_contacts WHERE email = 'inconnu.total@ex.fr'").o, A);
  });
  test("un contact de l'origine du formulaire est complété comme avant (comportement légitime conservé)", async () => {
    const mine = add("deja.alpha@ex.fr", A);
    assert.equal((await publicSubmit(K.A, { email: "deja.alpha@ex.fr", first_name: "Alice" })).status, 302);
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE id = ?", mine).f, "Alice");
  });
  test("consentement : un contact désinscrit d'un autre site n'est PAS réabonné par un envoi simple depuis ce site ; une désinscription (all) est conservée ; réponse identique", async () => {
    const un = add("desinscrit@ex.fr", B, { status: "unsubscribed" });
    db.prepare("INSERT INTO mk_unsubscribes (organization_id, contact_id, scope, list_id, source) VALUES (?, ?, 'all', NULL, 'link')").run(orgId, un);
    const consentsBefore = count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", un);
    const r = await publicSubmit(K.A, { email: "desinscrit@ex.fr" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT status s FROM mk_contacts WHERE id = ?", un).s, "unsubscribed");
    assert.equal(count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", un), consentsBefore);
    assert.equal(count("SELECT COUNT(*) n FROM mk_unsubscribes WHERE contact_id = ? AND scope = 'all'", un), 1);
  });
  test("consentement : adresse bloquée (rebond, plainte, suppression) jamais réabonnée ; l'équipe ni l'API ne réabonnent un désinscrit (règles existantes préservées)", async () => {
    const sup = add("supprime@ex.fr", A, { status: "suppressed" });
    db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (?, 'supprime@ex.fr', 'manual')").run(orgId);
    await publicSubmit(K.A, { email: "supprime@ex.fr" });
    assert.equal(one("SELECT status s FROM mk_contacts WHERE id = ?", sup).s, "suppressed");
    const { recordConsent } = require("../src/marketing/compliance/consent");
    const un = add("desinscrit2@ex.fr", A, { status: "unsubscribed" });
    const r = recordConsent({ db, organizationId: orgId, userId: 7, bus: null }, un, { source: "admin", textShown: "Ajout par l'équipe" });
    assert.equal(r.ok, false); assert.equal(r.reason, "unsubscribed");
  });
  test("un membre limité ne modifie pas le consentement d'un contact hors de son périmètre (route de consentement)", async () => {
    const other = add("consent.bravo@ex.fr", B, { status: "unsubscribed" });
    const before = count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", other);
    const r = await edA.post(`${C}/${other}/consentement?site=${A}`, { site: A, action: "grant", texte: "x" });
    assert.ok([403, 404, 302].includes(r.status));
    assert.equal(count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", other), before);
    assert.equal(one("SELECT status s FROM mk_contacts WHERE id = ?", other).s, "unsubscribed");
  });
});

describe("contacts : écriture limitée à l'origine et non-divulgation des doublons", () => {
  let cB, cLegacy, cAct;
  before(() => {
    cB = add("prive.bravo@ex.fr", B); cLegacy = add("prive.historique@ex.fr"); cAct = add("activite.alpha@ex.fr", B);
    db.prepare("INSERT INTO mk_events (organization_id, name, contact_id, source, occurred_at, created_at, site_id) VALUES (?, 'page.viewed', ?, 'cms', ?, ?, ?)").run(orgId, cAct, Date.now(), Date.now(), A);
  });
  test("le membre du site A n'écrit ni le contact du site B, ni l'historique sans association, ni un contact seulement actif sur A", async () => {
    for (const id of [cB, cLegacy, cAct]) {
      const before = row(id);
      assert.equal((await edA.post(`${C}/${id}?site=${A}`, { first_name: "PIRATE", site: A })).status, 404);
      assert.equal((await edA.post(`${C}/${id}/etiquettes?site=${A}`, { name: "intrus", site: A })).status, 404);
      assert.deepEqual(row(id), before);
    }
    assert.equal((await edA.get(`${C}/${cAct}?site=${A}`)).status, 200, "la lecture reste permise pour l'activité");
  });
  test("création : adresse nouvelle, adresse d'un autre site, adresse de l'historique → MÊME réponse HTTP (statut, redirection, message) ; aucune fiche exposée ni modifiée", async () => {
    const outcomes = [];
    for (const email of ["creation.neuve@ex.fr", "prive.bravo@ex.fr", "prive.historique@ex.fr"]) {
      const r = await edA.post(`${C}?site=${A}`, { email, first_name: "Test", site: A });
      outcomes.push({ status: r.status, location: String(r.location) });
      assert.doesNotMatch(r.text, /prive\.bravo|prive\.historique|Bravo|existe déjà/);
    }
    assert.deepEqual(outcomes[1], outcomes[0]); assert.deepEqual(outcomes[2], outcomes[0]);
    assert.doesNotMatch(outcomes[0].location, /contacts\/\d+/, "aucun identifiant dans la redirection");
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE id = ?", cB).f || "", "");
    assert.equal(one("SELECT origin_site_id o FROM mk_contacts WHERE id = ?", cLegacy).o, null);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE email IN ('prive.bravo@ex.fr', 'prive.historique@ex.fr')"), 2, "aucun doublon créé");
    assert.equal(one("SELECT origin_site_id o FROM mk_contacts WHERE email = 'creation.neuve@ex.fr'").o, A);
  });
  test("l'équipe garde le message « existe déjà » (aucune fuite à protéger) ; un doublon visible de son propre site aussi", async () => {
    const r = await boss.post(C, { email: "prive.bravo@ex.fr" });
    assert.equal(r.status, 302); assert.match(String(r.location), /contacts\/nouveau/);
    const mine = add("visible.alpha@ex.fr", A);
    const r2 = await edA.post(`${C}?site=${A}`, { email: "visible.alpha@ex.fr", site: A });
    assert.match(String(r2.location), /contacts\/nouveau/, "doublon de son propre site : retour au formulaire avec l'erreur");
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE id = ?", mine), 1);
  });
  test("actions groupées : refus de l'ensemble si UN contact est hors de l'origine du site (activité, autre site, historique)", async () => {
    const own = add("groupe.alpha@ex.fr", A);
    for (const bad of [cB, cLegacy, cAct]) {
      await edA.post(`${C}/actions?site=${A}`, { op: "tag_add", tag: "lot", ids: `${own},${bad}`, site: A });
      assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'lot'"), 0, `rien n'est fait avec ${bad}`);
    }
    await edA.post(`${C}/actions?site=${A}`, { op: "tag_add", tag: "lot", ids: String(own), site: A });
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'lot' AND ct.contact_id = ?", own), 1);
  });
  test("capacités légitimes conservées : l'éditeur de A modifie son contact ; l'équipe modifie tout", async () => {
    const own = add("legitime.alpha@ex.fr", A);
    assert.equal((await edA.post(`${C}/${own}?site=${A}`, { first_name: "Légitime", site: A })).status, 302);
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE id = ?", own).f, "Légitime");
    assert.equal((await boss.post(`${C}/${cB}`, { first_name: "ParÉquipe" })).status, 302);
    assert.equal(one("SELECT first_name f FROM mk_contacts WHERE id = ?", cB).f, "ParÉquipe");
  });
});
