// Domaines d'envoi (point 11 de la parité Mailchimp) : ajout, enregistrements à publier, vérification par de vraies
// requêtes DNS (ici un résolveur factice), analyse SPF/DKIM/DMARC, Resend (API factice), avertissement avant envoi.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const domains = require("../src/marketing/domains");
const config = require("../src/marketing/sending/config");
const { startServer, loginInstructor } = require("./helpers");

const NOW = Date.UTC(2026, 9, 5, 12);
const KEY = "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDexampleexampleexampleexampleexampleAB";
let m, A, zone, dnsDown;
const code = async (p) => { try { await (typeof p === "function" ? p() : p); } catch (e) { return e.code; } return null; };
// Zone DNS factice : { "txt:nom": [["morceau", "suite"]], "mx:nom": [{ priority, exchange }] }
function fakeDns() {
  zone = {}; dnsDown = false;
  const get = (kind, name) => {
    if (dnsDown) { const e = new Error("délai"); e.code = "ETIMEOUT"; throw e; }
    if (!Object.hasOwn(zone, `${kind}:${name}`)) { const e = new Error("absent"); e.code = "ENOTFOUND"; throw e; }
    return zone[`${kind}:${name}`];
  };
  domains.setResolverForTests({ resolveTxt: async (n) => get("txt", n), resolveMx: async (n) => get("mx", n) });
}
function fresh() {
  m = freshMarketing();
  A = m.ctx(1, { now: () => NOW });
  fakeDns();
}

describe("domaines : service", () => {
  beforeEach(fresh);
  after(() => { domains.setResolverForTests(null); domains.setFetchForTests(null); });

  test("nom de domaine : normalisé (adresse, majuscules, accents) ; messageries gratuites et domaines non publics refusés ; doublon refusé", async () => {
    assert.equal(domains.normalizeDomain("  News@KOLAKISA.com "), "kolakisa.com");
    assert.equal(domains.normalizeDomain("https://Formation-Éclair.fr/accueil"), "xn--formation-clair-knb.fr");
    for (const bad of ["gmail.com", "x@yahoo.fr", "localhost", "192.168.1.1", "site.test", "pas un domaine", "a..b.com"]) assert.throws(() => domains.normalizeDomain(bad), /messagerie gratuite|invalide|public/, bad);
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    assert.equal(domain.status, "pending");
    assert.match(domain.txtValue, /^kolakisa-verification=[0-9a-f]{32}$/);
    assert.equal(await code(domains.addDomain(A, "KOLAKISA.COM")), "duplicate");
    assert.equal(domains.getDomain(m.B, domain.id), null, "jamais visible d'une autre organisation");
  });

  test("enregistrements à publier (SMTP) : vérification, SPF, DKIM avec sélecteur, DMARC p=none", async () => {
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    domains.setSelector(A, domain.id, "hostingermail1");
    const recs = domains.recordsToPublish(domains.getDomain(A, domain.id));
    assert.deepEqual(recs.map((r) => [r.purpose, r.type, r.name]), [["Vérification", "TXT", "kolakisa.com"], ["SPF", "TXT", "kolakisa.com"], ["DKIM", "TXT", "hostingermail1._domainkey.kolakisa.com"], ["DMARC", "TXT", "_dmarc.kolakisa.com"]]);
    assert.equal(recs[3].value, "v=DMARC1; p=none; rua=mailto:dmarc@kolakisa.com");
    assert.throws(() => domains.setSelector(A, domain.id, "a b"), /Sélecteur DKIM invalide/);
  });

  test("vérification : rien de publié → à vérifier, chaque point expliqué", async () => {
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    const d = await domains.checkDomain(A, domain.id);
    assert.equal(d.status, "pending");
    assert.deepEqual(["ownership", "spf", "dkim", "dmarc"].map((k) => d.checks[k].state), ["missing", "missing", "missing", "missing"]);
    assert.equal(d.checks.mx.state, "warn");
    assert.match(d.checks.dmarc.message, /Gmail et Yahoo/);
    assert.equal(d.checked_at, NOW);
  });

  test("propriété seule → vérifié ; tout publié → authentifié ; un retrait fait redescendre l'état", async () => {
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    zone["txt:kolakisa.com"] = [[domain.txtValue], ["google-site-verification=abc"]];
    let d = await domains.checkDomain(A, domain.id);
    assert.equal(d.status, "verified");
    assert.equal(d.verified_at, NOW);
    zone["txt:kolakisa.com"].push(["v=spf1 include:_spf.mail.hostinger.com ", "~all"]); // TXT découpé en morceaux : recollé
    zone["txt:hostingermail1._domainkey.kolakisa.com"] = [[`v=DKIM1; k=rsa; p=${KEY}`]];
    zone["txt:_dmarc.kolakisa.com"] = [["v=DMARC1; p=none; rua=mailto:dmarc@kolakisa.com"]];
    zone["mx:kolakisa.com"] = [{ priority: 5, exchange: "mx1.hostinger.com" }];
    d = await domains.checkDomain(A, domain.id);
    assert.equal(d.status, "authenticated");
    assert.equal(d.checks.dkim.selector, "hostingermail1", "trouvé parmi les sélecteurs courants");
    assert.equal(d.checks.dmarc.policy, "none");
    assert.equal(d.checks.mx.value, "5 mx1.hostinger.com");
    assert.ok(m.db.prepare("SELECT 1 FROM mk_audit_logs WHERE action = 'domain.status_changed'").get());
    delete zone["txt:_dmarc.kolakisa.com"];
    d = await domains.checkDomain(A, domain.id);
    assert.equal(d.status, "verified");
    zone["txt:kolakisa.com"] = [["v=spf1 ~all"]];
    d = await domains.checkDomain(A, domain.id);
    assert.equal(d.status, "pending");
    assert.equal(d.verified_at, null);
  });

  test("DNS injoignable : rien n'est conclu (état « inconnu »), le domaine n'est pas marqué vérifié", async () => {
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    dnsDown = true;
    const d = await domains.checkDomain(A, domain.id);
    assert.equal(d.checks.dnsError, true);
    assert.deepEqual([d.checks.ownership.state, d.checks.spf.state, d.checks.dmarc.state], ["unknown", "unknown", "unknown"]);
    assert.equal(d.status, "pending");
  });

  test("analyse SPF et DMARC : doublon, +all, trop de recherches, politique invalide", () => {
    assert.equal(domains.analyzeSpf(["v=spf1 include:a ~all", "v=spf1 include:b -all"]).state, "error");
    assert.match(domains.analyzeSpf(["v=spf1 +all"]).message, /n'importe qui/);
    assert.equal(domains.analyzeSpf([`v=spf1 ${"include:x.fr ".repeat(11)}~all`]).state, "error");
    assert.equal(domains.analyzeSpf(["v=spf1 include:a"]).state, "warn");
    assert.equal(domains.analyzeSpf(["v=spf1 redirect=_spf.example.com"]).state, "ok");
    assert.equal(domains.analyzeDmarc(["v=DMARC1; rua=mailto:x@y.fr"]).state, "error");
    assert.equal(domains.analyzeDmarc(["v=DMARC1; p=reject"]).policy, "reject");
  });

  test("Resend : domaine déclaré chez Resend, ses enregistrements affichés, leur statut vient de Resend", async () => {
    config.saveSendingConfig(A, { provider: "resend", from: "KOLAKISA <news@kolakisa.com>", apiKey: "re_test_cle" });
    const calls = [];
    let state = "not_started";
    const records = (st) => [
      { record: "SPF", name: "send", type: "MX", ttl: "Auto", status: st, value: "feedback-smtp.eu-west-1.amazonses.com", priority: 10 },
      { record: "SPF", name: "send", type: "TXT", ttl: "Auto", status: st, value: "v=spf1 include:amazonses.com ~all" },
      { record: "DKIM", name: "resend._domainkey", type: "TXT", ttl: "Auto", status: st, value: `p=${KEY}` },
    ];
    domains.setFetchForTests(async (url, opts) => {
      calls.push([opts.method, url.replace("https://api.resend.com", ""), opts.headers.Authorization]);
      const json = url.endsWith("/verify") ? { object: "domain", id: "dom_1" } : { id: "dom_1", name: "kolakisa.com", status: state, records: records(state) };
      return { status: 200, json: async () => json };
    });
    const { domain, note } = await domains.addDomain(A, "kolakisa.com");
    assert.equal(note, "");
    assert.deepEqual(calls[0], ["POST", "/domains", "Bearer re_test_cle"]);
    const shown = domains.recordsToPublish(domain);
    assert.deepEqual(shown.map((r) => [r.purpose, r.type, r.name]), [["Vérification", "TXT", "kolakisa.com"], ["SPF (Resend) — retour", "MX", "send.kolakisa.com"], ["SPF (Resend)", "TXT", "send.kolakisa.com"], ["DKIM (Resend)", "TXT", "resend._domainkey.kolakisa.com"], ["DMARC", "TXT", "_dmarc.kolakisa.com"]]);
    let d = await domains.checkDomain(A, domain.id);
    assert.deepEqual(calls.slice(1).map((c) => [c[0], c[1]]), [["POST", "/domains/dom_1/verify"], ["GET", "/domains/dom_1"]]);
    assert.equal(d.checks.dkim.state, "missing");
    state = "verified";
    zone["txt:_dmarc.kolakisa.com"] = [["v=DMARC1; p=quarantine"]];
    d = await domains.checkDomain(A, domain.id);
    assert.equal(d.checks.ownership.message, "Domaine vérifié chez Resend.");
    assert.equal(d.status, "authenticated", "SPF et DKIM vérifiés par Resend + DMARC publié");
    assert.equal(d.provider_status, "verified");
  });

  test("Resend avec une clé « envoi seulement » : ajout quand même, explication, vérification DNS seule", async () => {
    config.saveSendingConfig(A, { provider: "resend", from: "news@kolakisa.com", apiKey: "re_restreinte" });
    domains.setFetchForTests(async () => ({ status: 401, json: async () => ({ name: "restricted_api_key" }) }));
    const { domain, note } = await domains.addDomain(A, "kolakisa.com");
    assert.match(note, /Full access/);
    assert.equal(domain.provider_id, "");
    assert.equal(domains.recordsToPublish(domain)[1].purpose, "SPF");
  });

  test("avertissement avant envoi : messagerie gratuite, domaine non ajouté, non authentifié, puis plus rien", async () => {
    assert.equal(domains.senderWarning(A), null, "aucun expéditeur");
    config.saveSendingConfig(A, { from: "Moi <moi@gmail.com>" });
    assert.match(domains.senderWarning(A), /messagerie gratuite/);
    config.saveSendingConfig(A, { from: "KOLAKISA <news@kolakisa.com>" });
    assert.match(domains.senderWarning(A), /n'est pas ajouté/);
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    assert.match(domains.senderWarning(A), /pas encore authentifié/);
    m.db.prepare("UPDATE mk_sending_domains SET status = 'authenticated' WHERE id = ?").run(domain.id);
    assert.equal(domains.senderWarning(A), null);
    assert.deepEqual({ ...domains.senderDomainStatus(A), checkedAt: undefined }, { domain: "kolakisa.com", free: false, id: domain.id, status: "authenticated", checkedAt: undefined });
  });

  test("le contrôle avant envoi d'une campagne affiche l'avertissement (sans bloquer)", async () => {
    const audience = require("../src/marketing/audience");
    const templates = require("../src/marketing/templates");
    const sending = require("../src/marketing/sending");
    config.saveSendingConfig(A, { provider: "smtp", from: "KOLAKISA <news@kolakisa.com>" });
    const list = audience.createList(A, { name: "L" });
    const t = templates.createTemplate(A, { name: "T", kind: "marketing", subject: "S", blocks: [{ type: "text", markdown: "Bonjour" }] });
    const c = sending.createCampaign(A, { name: "C", templateId: t.id, targetType: "list", targetId: list.id });
    const pre = sending.preflight(A, c.id, { workerOn: true, smtpAvailable: true });
    const w = pre.warnings.find((x) => x.code === "sender_domain");
    assert.match(w.message, /kolakisa\.com/);
    assert.equal(pre.errors.some((e) => e.code === "sender_domain"), false);
  });
});

describe("domaines : pages web", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("menu, ajout, page du domaine (enregistrements), sélecteur, retrait", async () => {
    let r = await boss.get("/marketing/domaines");
    assert.equal(r.status, 200);
    assert.match(r.text, /href="\/marketing\/domaines"/);
    r = await boss.post("/marketing/domaines", { domain: "gmail.com" });
    assert.match((await boss.get(r.location)).text, /messagerie gratuite/);
    r = await boss.post("/marketing/domaines", { domain: "exemple-kolakisa.fr" });
    assert.match(r.location, /^\/marketing\/domaines\/\d+$/);
    const page = await boss.get(r.location);
    assert.match(page.text, /kolakisa-verification=[0-9a-f]{32}/);
    assert.match(page.text, /_dmarc\.exemple-kolakisa\.fr/);
    assert.match(page.text, /Vérifier maintenant/);
    const id = r.location.split("/").pop();
    r = await boss.post(`/marketing/domaines/${id}/selecteur`, { selector: "hostingermail1" });
    assert.match((await boss.get(r.location)).text, /hostingermail1\._domainkey\.exemple-kolakisa\.fr/);
    r = await boss.post(`/marketing/domaines/${id}/supprimer`);
    assert.equal(r.location, "/marketing/domaines");
    assert.equal((await boss.get(`/marketing/domaines/${id}`)).status, 404);
  });

  test("réglages d'envoi : état du domaine de l'expéditeur", async () => {
    await boss.post("/marketing/envoi", { provider: "console", from: "KOLAKISA <news@kolakisa-envoi.fr>", rate_per_minute: "60", daily_limit: "1000" });
    const r = await boss.get("/marketing/envoi");
    assert.match(r.text, /Domaine <strong>kolakisa-envoi\.fr<\/strong>/);
    assert.match(r.text, /Ajouter ce domaine/);
  });
});

describe("domaines : enregistrements déjà en place", () => {
  beforeEach(fresh);
  after(() => domains.setResolverForTests(null));
  test("un enregistrement valide est montré tel qu'il est publié, sans modèle à recopier", async () => {
    const { domain } = await domains.addDomain(A, "kolakisa.com");
    zone["txt:kolakisa.com"] = [["v=spf1 include:_spf.mail.hostinger.com ~all"]];
    zone["txt:resend._domainkey.kolakisa.com"] = [[`p=${KEY}`]];
    const d = await domains.checkDomain(A, domain.id);
    const recs = domains.recordsToPublish(d);
    assert.deepEqual(recs.map((r) => Boolean(r.done)), [false, true, true, false]);
    assert.equal(recs[1].value, "v=spf1 include:_spf.mail.hostinger.com ~all");
    assert.equal(recs[2].name, "resend._domainkey.kolakisa.com");
  });
});
