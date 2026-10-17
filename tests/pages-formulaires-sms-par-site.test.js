// R7 (lot 3) — Isolation page × formulaire et site de collecte des consentements SMS (décisions du 17/10/2026). Bases synthétiques jetables ; réponses HTTP et écritures en base vérifiées.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const forms = require("../src/marketing/forms");
const pages = require("../src/marketing/pages");
const landing = require("../src/marketing/landing");
const core = require("../src/marketing/contactcore");
const { auditDb } = require("../src/services/auditFormulairesPages");

const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));
const widget = (formId, id = "wdgform01") => ({ type: "layout", children: [{ id, type: "signupform", props: { formId, heading: "Rejoindre", intro: "", button: "OK" } }] });

describe("pages × formulaires : un formulaire d'un autre site n'est jamais référencé (service, base synthétique)", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const mkForm = (name, siteId) => { const f = forms.createForm(m.A, { name, fields: [], consentText: "J'accepte ceci.", siteId }); forms.setStatus(m.A, f.id, "published"); return f; };
    const f1 = mkForm("F1", 1), f2 = mkForm("F2", 2), fm = mkForm("FM", null);
    const mkPage = (name, siteId) => pages.createPage(m.A, { name, siteId, kind: "page" });
    return { ...m, f1, f2, fm, p1: mkPage("P1", 1), p2: mkPage("P2", 2), pm: mkPage("PM", null) };
  };
  const draft = (w, page, sections) => pages.saveDraft(w.A, page.id, { sections, title: "T" }, { revision: pages.requirePage(w.A, page.id).revision });
  const formOf = (w, id) => w.db.prepare("SELECT form_id f FROM mk_landing_pages WHERE id = ?").get(id).f;

  test("réglage de la page : le formulaire de SON site seulement (site principal compris comme un site) ; refus sans rien modifier", () => {
    const w = world();
    const settings = (page, formId) => landing.saveSettings(w.A, page.id, { name: page.name, slug: page.slug, formId, tags: [], indexable: false });
    settings(w.p1, w.f1.id); assert.equal(formOf(w, w.p1.id), w.f1.id);
    for (const bad of [w.f2.id, w.fm.id]) { assert.throws(() => settings(w.p1, bad), /autre site/); assert.equal(formOf(w, w.p1.id), w.f1.id, "inchangé"); }
    settings(w.pm, w.fm.id); assert.equal(formOf(w, w.pm.id), w.fm.id);
    assert.throws(() => settings(w.pm, w.f1.id), /autre site/);
    assert.throws(() => settings(w.p1, 99999), /introuvable/);
  });
  test("contenu (widget « Formulaire ») : enregistrement refusé pour le formulaire d'un autre site, y compris identifiant falsifié en texte ; accepté pour le sien", () => {
    const w = world();
    assert.doesNotThrow(() => draft(w, w.p1, [widget(w.f1.id)]));
    for (const forged of [w.f2.id, String(w.f2.id), w.fm.id]) assert.throws(() => draft(w, w.p1, [widget(forged)]), /autre site/, String(forged));
    assert.throws(() => draft(w, w.pm, [widget(w.f1.id)]), /autre site/);
    assert.doesNotThrow(() => draft(w, w.pm, [widget(w.fm.id)]));
    const saved = pages.requirePage(w.A, w.p1.id).working.sections;
    assert.equal(JSON.stringify(saved).includes(`"formId":${w.f2.id}`), false, "rien du formulaire refusé n'a été enregistré");
  });
  test("publication : un formulaire d'un autre site bloque la mise en ligne (réglage ou widget), même si l'enregistrement du brouillon l'a laissé passer (donnée historique)", () => {
    const w = world();
    draft(w, w.p1, [widget(w.f1.id)]);
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(w.f2.id, w.p1.id); // donnée historique forcée en base
    w.db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ sections: [widget(w.f2.id)] }), w.p1.id);
    assert.throws(() => pages.publish(w.A, w.p1.id), /autre site/);
    assert.equal(w.db.prepare("SELECT status s FROM mk_landing_pages WHERE id = ?").get(w.p1.id).s, "draft");
  });
  test("publication : la section d'inscription de la page (formulaire du réglage) d'un autre site bloque aussi la mise en ligne ; le formulaire du bon site la laisse passer", () => {
    const w = world();
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ?, draft = ? WHERE id = ?").run(w.f2.id, JSON.stringify({ sections: [{ type: "form", id: "sec00001", heading: "Inscription" }], title: "T" }), w.p1.id);
    assert.throws(() => pages.publish(w.A, w.p1.id), /autre site/);
    assert.equal(w.db.prepare("SELECT status s FROM mk_landing_pages WHERE id = ?").get(w.p1.id).s, "draft");
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(w.f1.id, w.p1.id);
    assert.doesNotThrow(() => pages.publish(w.A, w.p1.id));
    assert.equal(w.db.prepare("SELECT status s FROM mk_landing_pages WHERE id = ?").get(w.p1.id).s, "published");
  });
  test("références historiques : un enregistrement ordinaire les CONSERVE sans les réécrire ; en ajouter une nouvelle reste refusé ; rien n'est supprimé ni modifié en silence", () => {
    const w = world();
    w.db.prepare("UPDATE mk_landing_pages SET sections = ?, form_id = ? WHERE id = ?").run(JSON.stringify([widget(w.f2.id)]), w.f2.id, w.p1.id);
    assert.doesNotThrow(() => draft(w, w.p1, [widget(w.f2.id), { type: "text", markdown: "Nouveau texte" }]));
    assert.equal(formOf(w, w.p1.id), w.f2.id, "le réglage historique n'est pas touché");
    assert.throws(() => draft(w, w.p1, [widget(w.f2.id), widget(w.fm.id, "wdgform02")]), /autre site/);
  });
  test("déplacement et copie : refusés si un formulaire propre à l'ancien site suivrait la page ; autorisés une fois retiré ; la copie dans le même site reste possible", () => {
    const w = world();
    draft(w, w.p1, [widget(w.f1.id)]);
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(w.f1.id, w.p1.id);
    assert.throws(() => pages.movePage(w.A, w.p1.id, 2), /autre site/);
    assert.equal(w.db.prepare("SELECT site_id s FROM mk_landing_pages WHERE id = ?").get(w.p1.id).s, 1, "page non déplacée");
    assert.throws(() => pages.duplicatePage(w.A, w.p1.id, { siteId: 2 }), /autre site/);
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, 3, "aucune copie créée");
    assert.doesNotThrow(() => pages.duplicatePage(w.A, w.p1.id, { siteId: 1 }));
    draft(w, w.p1, []); w.db.prepare("UPDATE mk_landing_pages SET form_id = NULL WHERE id = ?").run(w.p1.id);
    assert.doesNotThrow(() => pages.movePage(w.A, w.p1.id, 2));
  });
  test("création depuis un gabarit enregistré : un formulaire d'un autre site est refusé et la page créée est annulée", () => {
    const w = world();
    const tpl = pages.savePageTemplate(w.A, { name: "Modèle", category: "autre", description: "", content: { sections: [widget(w.f2.id)], theme: {}, title: "T", description: "" } });
    const before = w.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n;
    assert.throws(() => pages.createPage(w.A, { name: "Depuis modèle", siteId: 1, kind: "page", template: `mine:${tpl.id}` }), /autre site/);
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_landing_pages").get().n, before);
    assert.doesNotThrow(() => pages.createPage(w.A, { name: "Depuis modèle 2", siteId: 2, kind: "page", template: `mine:${tpl.id}` }));
  });
  test("audit en lecture seule des références historiques : nombres agrégés, rien n'est modifié, aucun nom de page", () => {
    const w = world();
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ?, sections = ?, status = 'published' WHERE id = ?").run(w.f2.id, JSON.stringify([widget(w.fm.id)]), w.p1.id); // site 1 → formulaire du site 2 + principal
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(w.f1.id, w.pm.id); // principal → site 1
    w.db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(w.f2.id, w.p2.id); // conforme
    const before = JSON.stringify(rows(w.db, "SELECT * FROM mk_landing_pages ORDER BY id"));
    const r = auditDb(w.db);
    assert.equal(r.pages, 3); assert.equal(r.pages_avec_formulaire, 3); assert.equal(r.pages_concernees, 2); assert.equal(r.pages_concernees_en_ligne, 1);
    assert.deepEqual(r.references_autre_site, { reglage_page: 2, widget_contenu: 1 });
    assert.deepEqual(r.par_situation, { site_vers_principal: 1, principal_vers_site: 1, site_vers_autre_site: 1 });
    assert.equal(JSON.stringify(rows(w.db, "SELECT * FROM mk_landing_pages ORDER BY id")), before);
    assert.ok(!/P1|PM|F1|F2/.test(JSON.stringify(r)));
  });
});

describe("rendu public : une page ne montre ni n'accepte le formulaire d'un autre site (serveur réel)", () => {
  const { startServer, Client, loginInstructor } = require("./helpers");
  let srv, db, boss, S1, S2, org;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const form = (name, slug, site) => Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, fields, consent_text, status, double_optin, site_id) VALUES (?, ?, ?, '[\"first_name\"]', 'J''accepte ceci.', 'published', 0, ?)").run(org, name, slug, site).lastInsertRowid);
  const page = (slug, site, formId, widgetForm) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, kind, form_id, sections, published_at) VALUES (?, ?, ?, ?, 'published', ?, 'page', ?, ?, datetime('now'))")
    .run(org, slug, slug, slug, site, formId, JSON.stringify([...(formId ? [{ type: "form", id: "sec00001", heading: "Inscription" }] : []), ...(widgetForm ? [widget(widgetForm)] : [])])).lastInsertRowid);
  let fA, fB, ipN = 0;
  const post = (slug, body) => new Client(srv.base).request(`/p/${slug}/inscription`, { method: "POST", form: { ft: srv.formToken(), consent: "1", ...body }, headers: { "X-Forwarded-For": `198.51.100.${(ipN += 1)}` } });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    S1 = Number((await boss.post("/marketing/site-web/sites", { name: "Site Un" })).location.match(/sites\/(\d+)/)[1]);
    S2 = Number((await boss.post("/marketing/site-web/sites", { name: "Site Deux" })).location.match(/sites\/(\d+)/)[1]);
    fA = form("Form A", "form-a", S1); fB = form("Form B", "form-b", S2);
    page("page-ok", S1, fA, fA);          // conforme
    page("page-croisee", S1, fB, fB);     // historique : formulaire d'un autre site (réglage ET widget)
    page("page-principale", null, fA, null); // principal → formulaire de site
  });
  after(() => { db.close(); return srv.stop(); });

  test("page conforme : le formulaire s'affiche et l'inscription crée un contact d'origine du site", async () => {
    const html = (await new Client(srv.base).get("/p/page-ok")).text;
    assert.match(html, /inscription/i);
    const r = await post("page-ok", { email: "ok@ex.fr", first_name: "Ok" });
    assert.ok([200, 302].includes(r.status), String(r.status));
    assert.equal(one("SELECT origin_site_id o FROM mk_contacts WHERE email = 'ok@ex.fr'").o, S1);
  });
  test("page avec le formulaire d'un AUTRE site (donnée historique) : formulaire non affiché, inscription refusée, aucun contact créé ni rattaché au mauvais site", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_contacts").n;
    const html = (await new Client(srv.base).get("/p/page-croisee")).text;
    assert.doesNotMatch(html, /Form B|name="email"/, "formulaire de l'autre site non rendu");
    for (const body of [{ email: "croise@ex.fr" }, { email: "croise2@ex.fr", w: "wdgform01" }]) {
      const r = await post("page-croisee", body);
      assert.ok(r.status >= 400 || /disponible/.test(r.text), `statut ${r.status}`);
    }
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts").n, before);
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email LIKE 'croise%'").n, 0);
  });
  test("page du site principal avec un formulaire de site : non affiché non plus (le site principal est un site)", async () => {
    const html = (await new Client(srv.base).get("/p/page-principale")).text;
    assert.doesNotMatch(html, /name="email"/);
    const r = await post("page-principale", { email: "principal.croise@ex.fr" });
    assert.ok(r.status >= 400 || /disponible/.test(r.text));
    assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'principal.croise@ex.fr'").n, 0);
  });
  test("identifiant de widget ou de page falsifié par le navigateur : aucun effet", async () => {
    const r = await post("page-ok", { email: "forge@ex.fr", w: "wdgform99", form_id: fB, formId: fB });
    assert.ok(r.status >= 400 || /disponible/.test(r.text) || r.status === 302);
    assert.notEqual(one("SELECT origin_site_id o FROM mk_contacts WHERE email = 'forge@ex.fr'")?.o, S2, "jamais attribué à l'autre site");
  });
  test("contact d'une autre origine inscrit par la page : étiquettes de la page et du formulaire non écrites, aucune fiche rattachée", async () => {
    const other = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (?, 'autre.origine@ex.fr', ?)").run(org, S2).lastInsertRowid);
    db.prepare("UPDATE mk_landing_pages SET tags = '[\"vip\"]' WHERE slug = 'page-ok'").run();
    await post("page-ok", { email: "autre.origine@ex.fr", first_name: "Intrus" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_contact_tags WHERE contact_id = ?", other).n, 0);
    assert.equal(one("SELECT COALESCE(first_name,'') f FROM mk_contacts WHERE id = ?", other).f, "");
    assert.equal(one("SELECT COUNT(*) n FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", other, S1).n, 0);
  });
});

describe("consentements SMS : site de collecte, falsification, désinscriptions, double confirmation, historique", () => {
  const world = () => {
    const m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}')");
    const mk = (name, siteId, doubleOptin) => { const f = forms.createForm(m.A, { name, fields: [], consentText: "J'accepte ceci.", siteId, doubleOptin }); forms.updateForm(m.A, f.id, { name, fields: [], consentText: "J'accepte ceci.", listId: null, smsConsentText: "J'accepte de recevoir des SMS. STOP pour arrêter.", doubleOptin }); forms.setStatus(m.A, f.id, "published"); return f; };
    return { ...m, f1: mk("F1", 1, false), f1d: mk("F1D", 1, true), fm: mk("FM", null, false) };
  };
  const smsRows = (w, id) => rows(w.db, "SELECT action, source, site_id, channel_address FROM mk_consents WHERE contact_id = ? AND purpose = 'sms' ORDER BY id", id);
  const submit = (w, f, email, extra = {}) => forms.submitForm(w.A, f.id, { email, consent: "1", sms_consent: "1", sms_phone: "+243812345678", ip: "203.0.113.9", ...extra });

  test("le site de collecte est celui du FORMULAIRE (lu en base) ; le site principal et les preuves existantes restent NULL ; un site envoyé par le navigateur est ignoré", () => {
    const w = world();
    const r = submit(w, w.f1, "a@x.fr", { site_id: 2, siteId: 2, site: 2, sms_site_id: 2 });
    assert.equal(r.ok, true);
    const c = rows(w.db, "SELECT id FROM mk_contacts WHERE email = 'a@x.fr'")[0];
    assert.deepEqual(smsRows(w, c.id), [{ action: "granted", source: "form", site_id: 1, channel_address: "+243812345678" }]);
    assert.equal(rows(w.db, "SELECT site_id s FROM mk_consents WHERE contact_id = ? AND purpose = 'marketing'", c.id)[0].s, 1);
    const p = submit(w, w.fm, "p@x.fr"); assert.equal(p.ok, true);
    const cp = rows(w.db, "SELECT id FROM mk_contacts WHERE email = 'p@x.fr'")[0];
    assert.equal(smsRows(w, cp.id)[0].site_id, null, "formulaire du site principal : site NULL");
    // preuve historique (écrite avant le lot) : inchangée
    w.db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, channel_address) VALUES (1, ?, 'sms', 'granted', 'form', 'ancienne preuve', '+243800000000')").run(c.id);
    assert.equal(smsRows(w, c.id).at(-1).site_id, null);
  });
  test("la case SMS non cochée : aucun accord SMS n'est supposé ; un site inconnu ou d'une autre organisation n'est jamais enregistré", () => {
    const w = world();
    assert.equal(forms.submitForm(w.A, w.f1.id, { email: "b@x.fr", consent: "1" }).ok, true);
    const c = rows(w.db, "SELECT id, sms_status s FROM mk_contacts WHERE email = 'b@x.fr'")[0];
    assert.deepEqual(smsRows(w, c.id), []); assert.equal(c.s, "none");
    const { recordSmsConsent } = require("../src/marketing/sms/consent");
    recordSmsConsent(w.A, c.id, { phone: "+243812345678", source: "form", textShown: "Preuve valable", siteId: 9999 });
    assert.equal(smsRows(w, c.id)[0].site_id, null, "site inexistant : ignoré");
  });
  test("contact désinscrit des SMS (d'une autre origine) : pas réabonné par un envoi simple depuis ce site ; réabonné après double confirmation par la personne (preuve avec le site de collecte)", () => {
    const w = world();
    const simple = core.identify(w.A, { email: "u1@x.fr", siteId: 2 }).contact;
    w.db.prepare("UPDATE mk_contacts SET sms_status = 'unsubscribed', sms_phone = '+243812345678' WHERE id = ?").run(simple.id);
    assert.equal(submit(w, w.f1, "u1@x.fr").ok, true);
    assert.equal(rows(w.db, "SELECT sms_status s FROM mk_contacts WHERE id = ?", simple.id)[0].s, "unsubscribed", "envoi simple : pas réabonné");
    assert.deepEqual(smsRows(w, simple.id), []);
    const other = core.identify(w.A, { email: "u2@x.fr", siteId: 2 }).contact;
    w.db.prepare("UPDATE mk_contacts SET sms_status = 'unsubscribed', sms_phone = '+243812345678' WHERE id = ?").run(other.id);
    const r = submit(w, w.f1d, "u2@x.fr"); assert.equal(r.pending, true);
    assert.deepEqual(smsRows(w, other.id), [], "rien avant la confirmation");
    assert.equal(forms.confirmSubscription(w.A, r.token).ok, true);
    assert.equal(rows(w.db, "SELECT sms_status s FROM mk_contacts WHERE id = ?", other.id)[0].s, "subscribed");
    assert.equal(smsRows(w, other.id)[0].site_id, 1);
  });
  test("contact d'une autre origine déjà abonné avec un autre numéro : son numéro n'est pas remplacé depuis ce site", () => {
    const w = world();
    const other = core.identify(w.A, { email: "n@x.fr", siteId: 2 }).contact;
    w.db.prepare("UPDATE mk_contacts SET sms_status = 'subscribed', sms_phone = '+243899999999' WHERE id = ?").run(other.id);
    assert.equal(submit(w, w.f1, "n@x.fr", { sms_phone: "+243812345678" }).ok, true);
    assert.equal(rows(w.db, "SELECT sms_phone p FROM mk_contacts WHERE id = ?", other.id)[0].p, "+243899999999");
    assert.deepEqual(smsRows(w, other.id), []);
  });
  test("compatibilité STOP commune : un numéro bloqué (liste d'organisation, sans site) reste refusé quel que soit le site du formulaire ; le blocage n'a pas de colonne de site", () => {
    const w = world();
    w.db.prepare("INSERT INTO mk_sms_suppressions (organization_id, phone, reason) VALUES (1, '+243812345678', 'stop')").run();
    assert.equal(submit(w, w.f1, "s@x.fr").ok, true, "l'inscription e-mail aboutit, le SMS reste non joignable");
    const c = rows(w.db, "SELECT id, sms_status s FROM mk_contacts WHERE email = 's@x.fr'")[0];
    assert.notEqual(c.s, "subscribed"); assert.deepEqual(smsRows(w, c.id), []);
    assert.equal(rows(w.db, "SELECT COUNT(*) n FROM pragma_table_info('mk_sms_suppressions') WHERE name = 'site_id'")[0].n, 0, "la liste STOP reste commune à l'organisation");
  });
});
