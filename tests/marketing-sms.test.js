// SMS, phase 1 (fondations) : numéros, longueur/segments, heures de silence, réglages, consentement SMS séparé,
// suppression par numéro, fournisseur Twilio (fetch simulé : aucun vrai SMS), pages web.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const sms = require("../src/marketing/sms");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("SMS — numéros au format international", () => {
  const n = (raw, defaultCountry) => sms.normalizePhone(raw, { defaultCountry });
  test("RD Congo : le 0 national est retiré", () => {
    assert.equal(n("081 234 5678", "CD").e164, "+243812345678");
    assert.equal(n("+243 81 234 56 78").e164, "+243812345678");
    assert.equal(n("00243812345678").e164, "+243812345678");
  });
  test("Congo-Brazzaville : le 0 fait partie du numéro", () => {
    assert.equal(n("06 123 4567", "CG").e164, "+242061234567");
    assert.equal(n("+242 06 123 45 67").country, "CG");
  });
  test("France : 06… et +33 06… donnent le même numéro", () => {
    assert.equal(n("06 12 34 56 78", "FR").e164, "+33612345678");
    assert.equal(n("+33 (0)6 12 34 56 78").e164, "+33612345678");
  });
  test("refus clairs : trop court, lettres, + au milieu, national sans pays", () => {
    assert.equal(n("12345", "CD").ok, false);
    assert.equal(n("06 AB", "FR").ok, false);
    assert.equal(n("06+12", "FR").ok, false);
    assert.equal(n("0812345678").ok, false);
    assert.equal(n("", "CD").ok, false);
  });
  test("masquage : jamais le numéro entier", () => {
    assert.equal(sms.maskPhone("+243812345678"), "+243 •••• 5678");
    assert.equal(sms.maskPhone("pas un numéro"), "");
  });
});

describe("SMS — longueur et segments facturés", () => {
  test("GSM-7 : 160 caractères = 1 SMS, 161 = 2", () => {
    assert.deepEqual([sms.smsLength("a".repeat(160)).segments, sms.smsLength("a".repeat(161)).segments, sms.smsLength("a".repeat(306)).segments, sms.smsLength("a".repeat(307)).segments], [1, 2, 2, 3]);
  });
  test("é, è, à restent en GSM-7 ; un seul ê fait tout passer à 70 caractères", () => {
    assert.equal(sms.smsLength("Leçon à réviser, très bien").encoding, "UCS-2"); // ç
    assert.equal(sms.smsLength("Leçon").unsupported[0], "ç");
    assert.equal(sms.smsLength("été à Kinshasa, très chaud").encoding, "GSM-7");
    const r = sms.smsLength("ê" + "a".repeat(70));
    assert.deepEqual([r.encoding, r.segments, r.perSegment], ["UCS-2", 2, 67]);
  });
  test("caractères étendus ({, €…) comptent double", () => {
    assert.equal(sms.smsLength("€").units, 2);
    assert.equal(sms.smsLength("€".repeat(80)).segments, 1);
    assert.equal(sms.smsLength("€".repeat(81)).segments, 2);
  });
  test("toGsm : remplace ê/ç/œ/guillemets, garde é/è/à", () => {
    assert.equal(sms.toGsm("Fête, leçon, œuvre « été »"), "Fete, lecon, oeuvre \" été \"");
    assert.equal(sms.smsLength(sms.toGsm("Fête, leçon, œuvre « été »")).encoding, "GSM-7");
  });
});

describe("SMS — heures de silence à l'heure du destinataire", () => {
  test("22 h à Kinshasa = silence ; reprise à 8 h heure locale", () => {
    const at = Date.UTC(2026, 9, 5, 21); // 22 h à Kinshasa (UTC+1)
    assert.equal(sms.quietReason({ at, country: "CD" }), "night");
    assert.equal(new Date(sms.nextAllowedTime({ at, country: "CD" })).toISOString(), "2026-10-06T07:00:00.000Z");
  });
  test("midi à Brazzaville un dimanche : permis ; à Paris : interdit (dimanche)", () => {
    const sunday = Date.UTC(2026, 9, 4, 11);
    assert.equal(sms.quietReason({ at: sunday, country: "CG" }), null);
    assert.equal(sms.quietReason({ at: sunday, country: "FR" }), "sunday");
  });
  test("jours fériés français, y compris ceux liés à Pâques", () => {
    const h = sms.frenchHolidays(2026);
    for (const d of ["1-1", "5-1", "5-8", "7-14", "8-15", "11-1", "11-11", "12-25", "4-6", "5-14", "5-25"]) assert.ok(h.has(d), d);
    assert.equal(sms.quietReason({ at: Date.UTC(2026, 6, 14, 10), country: "FR" }), "holiday");
  });
  test("plage réglable, et plage vide = pas de silence", () => {
    const at = Date.UTC(2026, 9, 5, 12); // 13 h à Kinshasa
    assert.equal(sms.quietReason({ at, country: "CD", start: 12, end: 14 }), "night");
    assert.equal(sms.quietReason({ at: Date.UTC(2026, 9, 5, 23), country: "CD", start: 0, end: 0 }), null);
  });
});

describe("SMS — réglages", () => {
  let m;
  before(() => { m = freshMarketing(); });
  test("par défaut : console (rien ne part), RD Congo, 20 h → 8 h, 3 segments au plus", () => {
    const c = sms.getSmsConfig(m.A);
    assert.deepEqual([c.provider, c.defaultCountry, c.quietStart, c.quietEnd, c.maxSegments, c.authTokenSet], ["console", "CD", 20, 8, 3, false]);
  });
  test("Twilio exige expéditeur, identifiant de compte et jeton", () => {
    assert.throws(() => sms.saveSmsConfig(m.A, { provider: "twilio" }), /expéditeur/);
    assert.throws(() => sms.saveSmsConfig(m.A, { provider: "twilio", sender: "KOYEKOLA" }), /identifiant de compte/i);
    assert.throws(() => sms.saveSmsConfig(m.A, { provider: "twilio", sender: "KOYEKOLA", accountSid: "AC" + "a".repeat(32) }), /jeton/i);
    const c = sms.saveSmsConfig(m.A, { provider: "twilio", sender: "KOYEKOLA", accountSid: "AC" + "a".repeat(32), authToken: "secret-token" });
    assert.deepEqual([c.provider, c.sender, c.authTokenSet], ["twilio", "KOYEKOLA", true]);
  });
  test("le jeton est chiffré en base et jamais rendu par getSmsConfig", () => {
    const row = m.db.prepare("SELECT value, is_secret FROM mk_settings WHERE organization_id = 1 AND key = 'sms.auth_token'").get();
    assert.equal(row.is_secret, 1);
    assert.doesNotMatch(row.value, /secret-token/);
    assert.equal(JSON.stringify(sms.getSmsConfig(m.A)).includes("secret-token"), false);
    assert.equal(sms.getSmsSecrets(m.A).authToken, "secret-token");
  });
  test("expéditeurs refusés : trop long, accent, symbole ; identifiant AC invalide ; heures hors bornes", () => {
    for (const sender of ["KOYEKOLA SHOP", "Koyékola", "KOYE-KOLA", "12345"]) assert.throws(() => sms.saveSmsConfig(m.A, { sender }), /Expéditeur invalide/, sender);
    assert.throws(() => sms.saveSmsConfig(m.A, { accountSid: "ACxyz" }), /AC/);
    assert.throws(() => sms.saveSmsConfig(m.A, { quietStart: 24 }), /entre 0 et 23/);
    assert.throws(() => sms.saveSmsConfig(m.A, { maxSegments: 0 }), /entre 1 et 10/);
  });
  test("effacer le jeton alors que Twilio est actif : refusé", () => {
    assert.throws(() => sms.saveSmsConfig(m.A, { clearAuthToken: true }), /jeton/i);
    sms.saveSmsConfig(m.A, { provider: "console", clearAuthToken: true });
    assert.equal(sms.getSmsConfig(m.A).authTokenSet, false);
  });
  test("isolation : l'organisation B garde ses valeurs par défaut", () => {
    assert.equal(sms.getSmsConfig(m.B).sender, "");
  });
});

describe("SMS — consentement séparé de l'e-mail", () => {
  let m, c;
  before(() => {
    m = freshMarketing();
    c = audience.upsertContact(m.A, { email: "marie@exemple.cd", phone: "081 234 5678" }).contact;
  });
  const proof = { source: "form", textShown: "J'accepte de recevoir des SMS de KOYEKOLA." };

  test("un abonné e-mail n'est PAS abonné aux SMS", () => {
    compliance.recordConsent(m.A, c.id, proof);
    assert.equal(compliance.isSendable(m.A, c.id).ok, true);
    assert.deepEqual(sms.isSmsSendable(m.A, c.id), { ok: false, reason: "not_subscribed" });
  });
  test("preuve obligatoire", () => {
    assert.throws(() => sms.recordSmsConsent(m.A, c.id, { source: "form", textShown: "" }), /preuve/);
  });
  test("accord SMS : numéro de la fiche converti, preuve gardée avec le numéro", () => {
    const r = sms.recordSmsConsent(m.A, c.id, { ...proof, ip: "41.243.12.34" });
    assert.deepEqual([r.ok, r.phone], [true, "+243812345678"]);
    assert.deepEqual(sms.isSmsSendable(m.A, c.id), { ok: true, phone: "+243812345678" });
    const k = m.db.prepare("SELECT purpose, channel_address, ip FROM mk_consents WHERE contact_id = ? ORDER BY id DESC LIMIT 1").get(c.id);
    assert.deepEqual({ ...k }, { purpose: "sms", channel_address: "+243812345678", ip: "41.243.12.0" });
  });
  test("le consentement SMS ne change rien à l'e-mail, et inversement", () => {
    compliance.unsubscribe(m.A, c.id, { source: "link" });
    assert.equal(compliance.isSendable(m.A, c.id).ok, false);
    assert.equal(sms.isSmsSendable(m.A, c.id).ok, true);
  });
  test("désinscription SMS : idempotente, e-mail intact, preuve de retrait écrite", () => {
    const d = audience.upsertContact(m.A, { email: "jean@exemple.cg", phone: "+242 06 123 4567" }).contact;
    compliance.recordConsent(m.A, d.id, proof);
    sms.recordSmsConsent(m.A, d.id, proof);
    assert.equal(sms.unsubscribeSms(m.A, d.id, { source: "link" }).already, false);
    assert.equal(sms.unsubscribeSms(m.A, d.id, { source: "link" }).already, true);
    assert.equal(sms.isSmsSendable(m.A, d.id).reason, "unsubscribed");
    assert.equal(compliance.isSendable(m.A, d.id).ok, true);
    assert.equal(m.db.prepare("SELECT COUNT(*) AS n FROM mk_consents WHERE contact_id = ? AND purpose = 'sms' AND action = 'withdrawn'").get(d.id).n, 1);
  });
  test("après un retrait, l'équipe/un import ne peuvent pas réabonner ; la personne elle-même le peut", () => {
    const d = audience.findByEmail(m.A, "jean@exemple.cg");
    assert.deepEqual(sms.recordSmsConsent(m.A, d.id, { source: "admin", textShown: "Accord oral" }), { ok: false, reason: "unsubscribed" });
    assert.deepEqual(sms.recordSmsConsent(m.A, d.id, { source: "import", textShown: "Fichier CSV" }), { ok: false, reason: "unsubscribed" });
    assert.equal(sms.recordSmsConsent(m.A, d.id, proof).ok, true);
  });
  test("le consentement vaut pour SON numéro : changer sms_phone en douce ne rend pas joignable", () => {
    const d = audience.findByEmail(m.A, "jean@exemple.cg");
    m.db.prepare("UPDATE mk_contacts SET sms_phone = '+242069999999' WHERE id = ?").run(d.id);
    assert.equal(sms.isSmsSendable(m.A, d.id).reason, "no_consent");
    m.db.prepare("UPDATE mk_contacts SET sms_phone = '+242061234567' WHERE id = ?").run(d.id);
  });
  test("numéro invalide : refus clair", () => {
    const e = audience.upsertContact(m.A, { email: "x@exemple.fr", phone: "123" }).contact;
    assert.throws(() => sms.recordSmsConsent(m.A, e.id, proof), (err) => err.code === "invalid_phone");
  });
});

describe("SMS — numéros bloqués", () => {
  let m, c;
  const proof = { source: "form", textShown: "J'accepte les SMS." };
  before(() => {
    m = freshMarketing();
    c = audience.upsertContact(m.A, { email: "a@exemple.cd", phone: "0812345678" }).contact;
    sms.recordSmsConsent(m.A, c.id, proof);
  });
  test("bloquer un numéro désabonne tout contact qui l'utilise (preuve de retrait)", () => {
    const r = sms.addSmsSuppression(m.A, { phone: "+243 81 234 5678", reason: "stop" });
    assert.deepEqual([r.added, r.contacts], [true, 1]);
    assert.equal(sms.isSmsSendable(m.A, c.id).ok, false);
    assert.equal(m.db.prepare("SELECT source FROM mk_consents WHERE contact_id = ? ORDER BY id DESC LIMIT 1").get(c.id).source, "sms_stop");
  });
  test("un numéro bloqué ne peut jamais redonner son accord, même par la personne", () => {
    assert.deepEqual(sms.recordSmsConsent(m.A, c.id, proof), { ok: false, reason: "suppressed" });
  });
  test("effacer puis recréer le contact ne débloque pas le numéro", () => {
    audience.deleteContact(m.A, c.id);
    const again = audience.upsertContact(m.A, { email: "a@exemple.cd", phone: "0812345678" }).contact;
    assert.equal(sms.recordSmsConsent(m.A, again.id, proof).reason, "suppressed");
  });
  test("STOP / invalide : non levables ; blocage manuel : levable", () => {
    assert.throws(() => sms.removeSmsSuppression(m.A, "+243812345678"), /ne peut pas être levé/);
    sms.addSmsSuppression(m.A, { phone: "+33612345678", reason: "manual" });
    assert.equal(sms.removeSmsSuppression(m.A, "+33612345678").removed, true);
  });
  test("motif inconnu refusé ; isolation entre organisations", () => {
    assert.throws(() => sms.addSmsSuppression(m.A, { phone: "+33612345678", reason: "bounced" }), /Motif/);
    assert.equal(sms.listSmsSuppressions(m.B).length, 0);
  });
});

describe("SMS — la règle en masse (SQL) concorde avec isSmsSendable", () => {
  test("mêmes contacts joignables, cas par cas", () => {
    const m = freshMarketing();
    const proof = { source: "form", textShown: "J'accepte les SMS." };
    const mk = (email, phone) => audience.upsertContact(m.A, { email, phone }).contact;
    const ok = mk("ok@x.cd", "0812345671"); sms.recordSmsConsent(m.A, ok.id, proof);
    mk("jamais@x.cd", "0812345672");
    const unsub = mk("stop@x.cd", "0812345673"); sms.recordSmsConsent(m.A, unsub.id, proof); sms.unsubscribeSms(m.A, unsub.id, { source: "link" });
    const blocked = mk("bloque@x.cd", "0812345674"); sms.recordSmsConsent(m.A, blocked.id, proof); sms.addSmsSuppression(m.A, { phone: "0812345674", reason: "manual" });
    const swapped = mk("change@x.cd", "0812345675"); sms.recordSmsConsent(m.A, swapped.id, proof);
    m.db.prepare("UPDATE mk_contacts SET sms_phone = '+243899999999' WHERE id = ?").run(swapped.id);
    const garbage = mk("vide@x.cd", ""); m.db.prepare("UPDATE mk_contacts SET sms_status = 'subscribed', sms_phone = 'abc' WHERE id = ?").run(garbage.id);
    const { sql, params } = sms.smsSendableSql("c");
    const bulk = m.db.prepare(`SELECT id FROM mk_contacts c WHERE c.organization_id = 1 AND ${sql} ORDER BY id`).all(...params).map((r) => r.id);
    const single = m.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = 1 ORDER BY id").all().map((r) => r.id).filter((id) => sms.isSmsSendable(m.A, id).ok);
    assert.deepEqual(bulk, single);
    assert.deepEqual(bulk, [ok.id]);
  });
});

describe("SMS — fournisseur Twilio (réseau simulé : aucun vrai SMS)", () => {
  const SID = "AC" + "0".repeat(32);
  const reply = (status, body) => async () => ({ status, json: async () => body });
  const make = (fetchImpl) => sms.createSmsProvider({ provider: "twilio", accountSid: SID, authToken: "tok" }, { fetch: fetchImpl, log: quiet });

  test("requête conforme : adresse, authentification, To/From/Body ; MG… = service de messagerie", async () => {
    let seen;
    const p = make(async (url, init) => { seen = { url, init }; return { status: 201, json: async () => ({ sid: "SM123", num_segments: "2" }) }; });
    const r = await p.send({ from: "KOYEKOLA", to: "+243812345678", body: "Bonjour" });
    assert.deepEqual(r, { providerMessageId: "SM123", segments: 2 });
    assert.equal(seen.url, `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`);
    assert.equal(seen.init.headers.Authorization, `Basic ${Buffer.from(`${SID}:tok`).toString("base64")}`);
    assert.deepEqual(Object.fromEntries(new URLSearchParams(seen.init.body)), { To: "+243812345678", Body: "Bonjour", From: "KOYEKOLA" });
    await p.send({ from: "MG" + "1".repeat(32), to: "+243812345678", body: "x" });
    assert.equal(new URLSearchParams(seen.init.body).get("MessagingServiceSid"), "MG" + "1".repeat(32));
  });
  test("erreurs classées, sans jamais relayer le texte de Twilio", async () => {
    const cases = [
      [401, { code: 20003, message: "Authenticate AC… tok" }, "config"], [400, { code: 21408, message: "region" }, "config"],
      [400, { code: 21211, message: "+243812345678 invalid" }, "recipient_rejected"], [400, { code: 21610, message: "unsubscribed" }, "opted_out"],
      [429, { code: 20429 }, "rate_limited"], [503, {}, "temporary"], [400, { code: 21617 }, "permanent"],
    ];
    for (const [status, body, kind] of cases) {
      await assert.rejects(make(reply(status, body)).send({ from: "KOYEKOLA", to: "+243812345678", body: "x" }), (e) => {
        assert.equal(e.kind, kind, `${status}/${body.code}`);
        assert.doesNotMatch(e.message, /tok|\+243|Authenticate/);
        return true;
      });
    }
  });
  test("panne réseau = temporaire", async () => {
    await assert.rejects(make(async () => { throw new Error("ECONNRESET"); }).send({ from: "K", to: "+243812345678", body: "x" }), (e) => e.kind === "temporary");
  });
  test("identifiants absents : refus avant tout appel réseau", () => {
    assert.throws(() => sms.createSmsProvider({ provider: "twilio", accountSid: "bad", authToken: "t" }), /AC/);
    assert.throws(() => sms.createSmsProvider({ provider: "twilio", accountSid: SID }), /jeton/);
  });
  test("SMS de test : texte fixe, numéro masqué, mode console sans réseau", async () => {
    const m = freshMarketing();
    const r = await sms.sendTestSms(m.A, { to: "081 234 5678" }, { log: quiet });
    assert.deepEqual([r.ok, r.provider, r.to], [true, "console", "+243 •••• 5678"]);
    await assert.rejects(sms.sendTestSms(m.A, { to: "12" }, { log: quiet }), (e) => e.code === "invalid_phone");
  });
  test("SMS de test via Twilio : échec renvoyé proprement (code d'erreur gardé)", async () => {
    const m = freshMarketing();
    sms.saveSmsConfig(m.A, { provider: "twilio", sender: "KOYEKOLA", accountSid: SID, authToken: "tok" });
    const r = await sms.sendTestSms(m.A, { to: "+243812345678" }, { fetch: reply(400, { code: 21408 }), log: quiet });
    assert.deepEqual([r.ok, r.kind, r.code], [false, "config", 21408]);
  });
});

describe("SMS — pages web", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).run(...args); db.close(); return r; };
  const get = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).get(...args); db.close(); return r; };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("« Réglages SMS » est dans le menu", async () => {
    assert.match((await boss.get("/marketing")).text, /href="\/marketing\/sms\/reglages"/);
  });
  test("page des réglages : mode console par défaut", async () => {
    const html = (await boss.get("/marketing/sms/reglages")).text;
    assert.match(html, /<h1>Réglages SMS<\/h1>/);
    assert.match(html, /Mode « console »/);
  });
  test("enregistrer Twilio ; le jeton n'est jamais réaffiché", async () => {
    const res = await boss.post("/marketing/sms/reglages", { provider: "twilio", sender: "KOYEKOLA", default_country: "CG", account_sid: "AC" + "b".repeat(32), auth_token: "jeton-tres-secret", quiet_start: "21", quiet_end: "7", rate: "30", daily: "500", max_segments: "3" });
    assert.equal(res.status, 302);
    const html = (await boss.get("/marketing/sms/reglages")).text;
    assert.match(html, /Réglages SMS enregistrés/);
    assert.doesNotMatch(html, /jeton-tres-secret/);
    assert.match(html, /value="CG" selected/);
    assert.match(html, /value="21" selected/);
  });
  test("expéditeur invalide : message d'erreur, rien d'enregistré", async () => {
    await boss.post("/marketing/sms/reglages", { sender: "Koyékola Formation" });
    const html = (await boss.get("/marketing/sms/reglages")).text;
    assert.match(html, /Expéditeur invalide/);
    assert.match(html, /value="KOYEKOLA"/);
    await boss.post("/marketing/sms/reglages", { provider: "console" });
  });
  test("SMS de test en mode console : rien ne part, message clair", async () => {
    await boss.post("/marketing/sms/test", { to: "06 123 4567" });
    assert.match((await boss.get("/marketing/sms/reglages")).text, /Mode essai \(console\) : aucun SMS n(?:'|&#39;)est réellement parti vers \+242 •••• 4567/);
  });
  test("bloquer puis débloquer un numéro ; numéro masqué dans la liste", async () => {
    await boss.post("/marketing/sms/blocages", { phone: "+33 6 12 34 56 78", note: "demande orale" });
    const html = (await boss.get("/marketing/sms/reglages")).text;
    assert.match(html, /\+33 •••• 5678/);
    assert.doesNotMatch(html, /612345678/);
    const id = get("SELECT id FROM mk_sms_suppressions WHERE phone = '+33612345678'").id;
    await boss.post(`/marketing/sms/blocages/${id}/retirer`);
    assert.equal(get("SELECT COUNT(*) AS n FROM mk_sms_suppressions").n, 0);
  });
  test("fiche contact : verdict SMS, accord enregistré avec preuve, puis désinscription", async () => {
    run("INSERT INTO mk_contacts (organization_id, email, phone) VALUES (1, 'sms@exemple.cg', '06 123 4567')");
    const id = get("SELECT id FROM mk_contacts WHERE email = 'sms@exemple.cg'").id;
    let html = (await boss.get(`/marketing/contacts/${id}`)).text;
    assert.match(html, /Peut-on lui envoyer des SMS/);
    assert.match(html, /Pas d(?:'|&#39;)accord SMS enregistré/);
    await boss.post(`/marketing/contacts/${id}/sms/consentement`, { phone: "+242 06 123 4567", text: "Case cochée sur le bulletin papier du 3 mars" });
    html = (await boss.get(`/marketing/contacts/${id}`)).text;
    assert.match(html, /Accord SMS prouvé pour le \+242 •••• 4567/);
    await boss.post(`/marketing/contacts/${id}/sms/desinscrire`);
    html = (await boss.get(`/marketing/contacts/${id}`)).text;
    assert.match(html, /A retiré son accord SMS/);
    assert.equal(get("SELECT status FROM mk_contacts WHERE id = ?", id).status, "unknown"); // l'e-mail n'a pas bougé
  });
  test("permissions : un rédacteur (editor) ne voit ni ne modifie les réglages SMS", async () => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'editor')", c.email);
    assert.equal((await c.get("/marketing/sms/reglages")).status, 403);
    assert.equal((await c.post("/marketing/sms/reglages", { provider: "twilio" })).status, 403);
    assert.equal((await c.post("/marketing/sms/test", { to: "+243812345678" })).status, 403);
  });
});
