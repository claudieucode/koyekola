// KOLAKISA CMS — Paramètres dans l'espace d'un site : les dix sections (Écriture, Lecture, Commentaires, Médias, Permaliens, SEO, Indexation, Emailing, Tunnels, Avancé) sont ouvertes (plus « Bientôt »),
// montrent les réglages PROPRES au site (enregistrés, validés, isolés) et, pour le reste, ce qui s'applique réellement à lui en lecture seule ; aucune écriture d'un réglage commun depuis un site.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Paramètres : sections ouvertes dans l'espace d'un site", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const R = "/marketing/site-web";
  const SECTIONS = { ecriture: "Écriture", lecture: "Lecture", commentaires: "Commentaires", medias: "Médias", permaliens: "Permaliens", seo: "SEO", indexation: "Indexation", emailing: "Emailing", tunnels: "Tunnels", avance: "Avancé" };
  const frame = (site, k) => `${R}/sites/${site}/parametres-${k}`;
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const emailOf = (id) => JSON.stringify(db.prepare("SELECT key, value FROM mk_settings WHERE organization_id = ? AND key LIKE ?").all(orgId, `email.site_${id}.%`));
  const form = (client, slug, site, body) => client.request(`${R}/parametres/${slug}?site=${site}`, { method: "POST", form: { site, frame: "1", ...body }, redirect: "manual" });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await newStudent(srv); viewerA = await newStudent(srv); outsider = await newStudent(srv);
    const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, idOf(viewerA));
  });
  after(() => { db.close(); return srv.stop(); });

  test("le menu d'un site : les dix entrées sont des liens vers le cadre du site, plus aucune « Bientôt » dans Paramètres", async () => {
    const menu = (await boss.get(`${R}/sites/${A}/reglages`)).text;
    for (const k of Object.keys(SECTIONS)) assert.match(menu, new RegExp(`href="${frame(A, k)}"`), k);
    assert.ok(!/Lecture<\/span><span class="mk-cms-tag">Bientôt/.test(menu) && !/Tunnels<\/span><span class="mk-cms-tag">Bientôt/.test(menu), "Lecture et Tunnels ne portent plus « Bientôt »");
  });

  test("chaque section s'ouvre dans le cadre du site (200, titre, aucun onglet central ni choix de site) ; l'ensemble est cohérent pour l'équipe et l'admin du site", async () => {
    for (const client of [boss, adminA]) for (const [k, label] of Object.entries(SECTIONS)) {
      const r = await client.get(frame(A, k)); assert.equal(r.status, 200, `${label} : ${r.status}`);
      assert.match(r.text, new RegExp(`<h1>${label}</h1>`), label); assert.ok(!/Réglages de<\/label>/.test(r.text), `${label} : pas de choix de site central`);
      assert.ok(!/class="mk-tab"/.test(r.text), `${label} : pas d'onglets centraux`);
    }
  });

  test("sections sans réglage propre au site (Commentaires, Médias, Tunnels) : valeurs réelles de la plateforme en lecture seule, aucun formulaire ; impossible de les modifier depuis un site", async () => {
    for (const k of ["commentaires", "medias", "tunnels"]) {
      const r = await adminA.get(frame(A, k)); assert.equal(r.status, 200);
      assert.match(r.text, /Ce qui s(?:'|&#39;)applique à ce site/); assert.ok(!/data-st-form/.test(r.text), `${k} : aucun formulaire`);
      assert.match(r.text, /réservées? à l'équipe|depuis le site principal|Elles se modifient/, k);
    }
    // Permaliens : écran dédié ; un site sans domaine propre suit les permaliens du principal, en lecture seule, sans bouton d'enregistrement
    const pl = await adminA.get(frame(A, "permaliens")); assert.equal(pl.status, 200);
    assert.match(pl.text, /suit les permaliens du site principal/); assert.ok(!/<button[^>]*data-pl-save/.test(pl.text), "permaliens : aucun enregistrement possible");
    const before = one("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'cms.media_max_image_mb'", orgId);
    for (const [slug, body] of [["medias", { media_max_image_mb: "1" }], ["commentaires", { comments_moderation: "all" }]]) {
      const r = await form(adminA, slug, A, body); assert.ok([200, 302, 303, 403].includes(r.status), `${slug} : ${r.status}`);
    }
    assert.deepEqual(one("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'cms.media_max_image_mb'", orgId), before, "le réglage commun n'a pas bougé");
    const comments = await boss.get(`${R}/parametres/commentaires`); assert.ok(!/<strong>Toutes<\/strong>/.test(comments.text)); // l'écran central garde son formulaire
    assert.match(comments.text, /data-st-form/);
  });

  test("Emailing : le site règle SES propres expéditeur et réponse, enregistrés, validés, isolés ; l'enregistrement reste dans le cadre du site ; le site voisin est intact", async () => {
    // Un site n'envoie que depuis un domaine déclaré : sans lui, le serveur refuse (protection existante)
    const refused = await form(adminA, "emailing", A, { email_from_name: "Alpha Studio", email_from_address: "hello@alpha.example" });
    assert.equal(refused.status, 422); assert.match(refused.text, /n(?:'|&#39;)est pas déclaré dans Marketing → Domaines/); assert.ok(!emailOf(A).includes("hello@alpha.example"));
    db.prepare("INSERT INTO mk_sending_domains (organization_id, domain, token) VALUES (?, 'alpha.example', 'tok')").run(orgId);
    const ok = await form(adminA, "emailing", A, { email_from_name: "Alpha Studio", email_from_address: "hello@alpha.example", email_reply_to: "reply@alpha.example", _b_x: "1" });
    assert.equal(ok.status, 302, `${ok.status} ${(/Rien n.a été enregistré :<\/p><ul>([\s\S]*?)<\/ul>/.exec(ok.text) || [])[1]}`); assert.equal(ok.headers.get("location"), frame(A, "emailing"), "retour dans le cadre du site");
    const st = emailOf(A); assert.ok(st.includes("Alpha Studio") && st.includes("hello@alpha.example"));
    assert.ok(!emailOf(B).includes("Alpha Studio"), "Beta intact");
    const html = (await adminA.get(frame(A, "emailing"))).text; assert.match(html, /value="Alpha Studio"/); assert.match(html, /value="hello@alpha.example"/);
    const bad = await form(adminA, "emailing", A, { email_from_name: "X", email_from_address: "pas-une-adresse", email_reply_to: "" });
    assert.equal(bad.status, 422); assert.match(bad.text, /Rien n'a été enregistré/); assert.match(bad.text, /name="frame" value="1"/, "le cadre est conservé après l'erreur"); assert.match(bad.text, /value="pas-une-adresse"/, "valeur saisie conservée");
    assert.ok(emailOf(A).includes("hello@alpha.example"), "valeur valide précédente conservée");
    assert.ok([403, 404].includes((await form(adminA, "emailing", B, { email_from_name: "Pirate" })).status), "pas d'écriture sur Beta");
    assert.ok(!emailOf(B).includes("Pirate"));
  });

  test("outils liés : l'équipe voit les liens vers l'envoi, les domaines (SPF, DKIM, DMARC) et les tunnels ; l'accès limité voit qu'ils sont réservés", async () => {
    const team = (await boss.get(frame(A, "emailing"))).text; assert.match(team, /href="\/marketing\/envoi"/); assert.match(team, /href="\/marketing\/domaines"/); assert.match(team, /SPF, DKIM et DMARC/);
    const limited = (await adminA.get(frame(A, "emailing"))).text; assert.ok(!/href="\/marketing\/envoi"/.test(limited)); assert.match(limited, /réservés à l'équipe/);
    assert.match((await boss.get(frame(A, "tunnels"))).text, /href="\/marketing\/tunnels"/);
    assert.equal((await boss.get(`${R}/parametres/tunnels`)).status, 200, "l'écran central garde ses outils");
  });

  test("Lecture et Indexation propres au site : page d'accueil et visibilité du site, avec confirmation des réglages sensibles", async () => {
    const lecture = (await boss.get(frame(A, "lecture"))).text; assert.match(lecture, /name="homepage_page"/);
    const closed = await form(boss, "indexation", A, { search_visibility: "closed" });
    assert.equal(closed.status, 409, "réglage sensible : confirmation exigée"); assert.match(closed.text, /Confirmer ce changement sensible/);
    assert.notEqual(JSON.stringify(settingsOf(A)).includes('"closed"'), true, "rien d'écrit sans confirmation");
    const done = await form(boss, "indexation", A, { search_visibility: "closed", confirm: "1" });
    assert.equal(done.status, 302); assert.equal(done.headers.get("location"), frame(A, "indexation"));
    assert.match((await boss.get(frame(A, "indexation"))).text, /<option value="closed" selected>/);
    assert.doesNotMatch((await boss.get(frame(B, "indexation"))).text, /<option value="closed" selected>/, "Beta reste ouvert aux moteurs");
  });

  test("droits et isolation : le lecteur n'écrit pas ; l'admin d'Alpha n'ouvre jamais Beta ; l'étranger et l'anonyme sont refusés ; Avancé s'ouvre sans lien central pour un accès limité", async () => {
    assert.equal((await viewerA.get(frame(A, "emailing"))).status === 200 ? (await form(viewerA, "emailing", A, { email_from_name: "Lecteur" })).status !== 302 : true, true);
    assert.ok(!emailOf(A).includes("Lecteur") && !JSON.stringify(settingsOf(A)).includes("Lecteur"), "le lecteur n'a rien écrit");
    for (const k of Object.keys(SECTIONS)) { assert.notEqual((await adminA.get(frame(B, k))).status, 200, `Beta/${k}`); assert.notEqual((await outsider.get(frame(A, k))).status, 200, `étranger/${k}`); assert.notEqual((await anon.get(frame(A, k))).status, 200, `anonyme/${k}`); }
    const adv = await adminA.get(frame(A, "avance")); assert.equal(adv.status, 200); assert.ok(!/outils\/systeme/.test(adv.text), "pas de lien vers un écran central");
    assert.match((await boss.get(frame(A, "avance"))).text, /outils\/systeme/);
  });
});
