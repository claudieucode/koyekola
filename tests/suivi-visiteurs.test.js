// Suivi des visiteurs (Site Web, phase 6) : RIEN sans accord ; avec accord, événements validés (aucun texte saisi,
// aucune adresse complète, aucune IP), relié au contact à l'inscription ou à la connexion, effacé avec le contact et
// au-delà de 13 mois. Bandeau « Accepter / Refuser » à égalité, page « Cookies ».
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const visitors = require("../src/marketing/visitors");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const VID = "a".repeat(32) + "." + String(Date.now() - 86400000);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";

describe("enregistrement (sans serveur)", () => {
  const { db } = freshMarketing();
  db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug) VALUES (1, 'Offre', 'offre')").run();
  const all = () => db.prepare("SELECT * FROM mk_web_events ORDER BY id").all();

  test("événements validés : types connus, chemins seuls, provenance nettoyée, page reconnue ; robots et identifiants invalides ignorés", () => {
    assert.equal(visitors.record(db, 1, { visitorId: "court", sessionId: "sessionsession", events: [{ t: "page_view", p: "/" }], userAgent: UA }).ok, false);
    assert.equal(visitors.record(db, 1, { visitorId: VID, sessionId: "sessionsession", events: [{ t: "page_view", p: "/" }], userAgent: "Googlebot/2.1" }).ok, false);
    const r = visitors.record(db, 1, { visitorId: VID, sessionId: "sessionsession", userAgent: UA, events: [
      { t: "session_start", p: "/p/offre?email=secret@x.fr#ancre", r: "Google.COM", us: "facebook", uc: "rentree<script>", d: "mobile" },
      { t: "page_view", p: "/p/offre" },
      { t: "form_submit", p: "/p/offre", x: "faux envoi" },
      { t: "inconnu", p: "/" },
      { t: "page_view", p: "https://autre.site/x" },
      { t: "button_click", p: "/catalogue", x: "Je commence", at: 1 },
    ] });
    assert.deepEqual(r, { ok: true, saved: 3 });
    const rows = all();
    assert.equal(rows[0].path, "/p/offre", "jamais la suite de l'adresse (paramètres, ancre)");
    assert.equal(rows[0].referrer, "google.com");
    assert.equal(rows[0].utm_campaign, "rentreescript");
    assert.ok(rows[0].page_id, "page du moteur reconnue");
    assert.ok(Date.now() - rows[2].occurred_at < 60000, "date improbable remplacée par l'heure du serveur");
    assert.equal(db.prepare("SELECT sessions FROM mk_web_visitors WHERE id = ?").get(VID).sessions, 1);
  });

  test("relier au contact (passé et futur) ; conservation de 13 mois", () => {
    db.prepare("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'awa@ex.fr')").run();
    const cid = db.prepare("SELECT id FROM mk_contacts WHERE email = 'awa@ex.fr'").get().id;
    assert.equal(visitors.linkVisitor(db, 1, VID, cid), true);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_web_events WHERE contact_id = ?").get(cid).n, 3);
    visitors.record(db, 1, { visitorId: VID, sessionId: "sessionsession", userAgent: UA, events: [{ t: "page_view", p: "/blog" }] });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_web_events WHERE contact_id = ?").get(cid).n, 4, "visites suivantes reliées aussi");
    assert.equal(visitors.linkVisitor(db, 2, VID, cid), false, "autre organisation : refusé");
    db.prepare("UPDATE mk_web_events SET occurred_at = 1").run();
    db.prepare("UPDATE mk_web_visitors SET last_seen = 1").run();
    assert.deepEqual(visitors.purge(db), { events: 4, visitors: 1 });
  });
});

describe("site (vrai serveur)", () => {
  let srv, boss, db;
  const beacon = (cookie, body, headers = {}) => fetch(`${srv.base}/w/e`, { method: "POST", headers: { "Content-Type": "application/json", cookie, "User-Agent": UA, Origin: srv.base, ...headers }, body: JSON.stringify(body) });
  const count = () => db.prepare("SELECT COUNT(*) n FROM mk_web_events").get().n;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("pages publiques : bandeau (Accepter / Refuser), script, lien « Cookies » ; page Cookies ; jamais dans Mon espace", async () => {
    const home = (await new Client(srv.base).get("/catalogue")).text;
    assert.match(home, /id="kw-consent"[^>]*hidden/);
    assert.match(home, /data-kw-refuse>Refuser<\/button>\s*<button type="button" class="kw-consent-btn" data-kw-accept>Accepter/);
    assert.match(home, /src="\/js\/visitor\.js/);
    assert.match(home, /href="\/cookies" data-kw-consent-open>Cookies/);
    const cookies = await new Client(srv.base).get("/cookies");
    assert.equal(cookies.status, 200);
    assert.match(cookies.text, /13 mois/);
    assert.doesNotMatch((await boss.get("/formateur")).text, /id="kw-consent"/);
    assert.doesNotMatch((await boss.get("/marketing")).text, /visitor\.js/);
  });

  test("sans accord (aucun choix, ou refus) : rien n'est enregistré ; identifiant envoyé dans le corps ignoré", async () => {
    const before_ = count();
    const ev = { s: "sessionsession", e: [{ t: "page_view", p: "/" }] };
    assert.equal((await beacon("", ev)).status, 204);
    assert.equal((await beacon(`kw_consent=0; kw_vid=${VID}`, ev)).status, 204);
    assert.equal((await beacon("kw_consent=1", { ...ev, v: VID })).status, 204);
    assert.equal(count(), before_);
  });

  test("avec accord : événements enregistrés ; personne connectée reliée à son contact", async () => {
    const r = await beacon(`kw_consent=1; kw_vid=${VID}`, { s: "sessionsession", e: [{ t: "session_start", p: "/", us: "newsletter" }, { t: "page_view", p: "/catalogue" }] });
    assert.equal(r.status, 204);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_web_events WHERE visitor_id = ?").get(VID).n, 2);
    const student = await newStudent(srv);
    const vid2 = "b".repeat(32) + "." + String(Date.now() - 1000);
    await beacon(`kw_consent=1; kw_vid=${vid2}; ${[...student.cookies].map(([k, v]) => `${k}=${v}`).join("; ")}`, { s: "sessionsession", e: [{ t: "page_view", p: "/mes-cours" }] });
    const contact = db.prepare("SELECT id FROM mk_contacts WHERE email = ?").get(student.email);
    assert.equal(db.prepare("SELECT contact_id FROM mk_web_visitors WHERE id = ?").get(vid2).contact_id, contact.id);
  });

  test("inscription par un visiteur suivi : « formulaire envoyé » enregistré par le serveur, parcours sur la fiche, effacé avec le contact", async () => {
    const id = Number((await boss.post("/marketing/formulaires", { name: "Lettre", consentText: "Oui, je veux la lettre KOLAKISA." })).location.match(/(\d+)$/)[1]);
    db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(id);
    await boss.post(`/marketing/formulaires/${id}/publier`, {});
    const slug = db.prepare("SELECT slug FROM mk_forms WHERE id = ?").get(id).slug;
    const vid3 = "c".repeat(32) + "." + String(Date.now() - 1000);
    await beacon(`kw_consent=1; kw_vid=${vid3}`, { s: "sessionsession", e: [{ t: "session_start", p: "/blog", r: "google.com" }, { t: "page_view", p: `/f/${slug}` }] });
    const visitor = new Client(srv.base);
    visitor.cookies.set("kw_consent", "1");
    visitor.cookies.set("kw_vid", vid3);
    assert.equal((await visitor.post(`/f/${slug}`, { ft: srv.formToken(), email: "suivi@ex.fr", consent: "1" })).status, 302);
    const contact = db.prepare("SELECT id FROM mk_contacts WHERE email = 'suivi@ex.fr'").get();
    const types = db.prepare("SELECT type FROM mk_web_events WHERE contact_id = ? ORDER BY id").all(contact.id).map((r) => r.type);
    assert.deepEqual(types, ["session_start", "page_view", "form_submit"]);
    const page = (await boss.get(`/marketing/contacts/${contact.id}`)).text;
    assert.match(page, /Début de visite : \/blog \(venant de google\.com\)/);
    assert.match(page, /Formulaire envoyé : « Lettre »/);
    await boss.post(`/marketing/contacts/${contact.id}/effacer`, { confirm: "on" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_web_events WHERE visitor_id = ?").get(vid3).n, 0, "visites effacées avec le contact");
  });

  test("pages du site : sections repérables pour la mesure (data-sid), règle pop-up « nouveaux / anciens visiteurs »", async () => {
    const pid = Number((await boss.post("/marketing/pages", { name: "Mesure", template: "inscription" })).location.match(/(\d+)$/)[1]);
    const sections = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(pid).sections);
    db.prepare("UPDATE mk_landing_pages SET status = 'published', sections = ? WHERE id = ?").run(JSON.stringify(sections.filter((s) => s.type !== "form")), pid);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pid).slug;
    const html = (await new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html, new RegExp(`data-sid="${sections[0].id}" data-stype="hero"`));
    assert.match(html, /id="kw-consent"/);
    const id = db.prepare("SELECT id FROM mk_forms WHERE name = 'Lettre'").get().id;
    await boss.post(`/marketing/formulaires/${id}`, { name: "Lettre", consentText: "Oui, je veux la lettre KOLAKISA.", popupEnabled: "1", tags: "", redirectUrl: "", rulesShown: "1", "rules[visitors]": "returning" });
    const json = JSON.parse((await new Client(srv.base).get("/f/popup.json?page=%2F")).text);
    assert.equal(json.forms.find((f) => f.name === "Lettre").rules.visitors, "returning");
  });
});
