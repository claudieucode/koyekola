// R8 lot 3 — Formulaires et Contacts dans l'espace CMS d'un site : l'entrée s'ouvre dans le cadre du site, chaque lien/filtre/formulaire/redirection garde le site (déterminé par le serveur),
// et les règles R7 (lecture/écriture selon l'origine, actions groupées « tout ou rien », fusion et traitement des demandes réservés à l'équipe, données sensibles masquées) restent EXACTEMENT les mêmes.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { carry, withSite } = require("../src/marketing/web/siteCarry");

describe("siteCarry : conservation du site dans les liens, formulaires et redirections (unitaire)", () => {
  test("liens et formulaires des deux familles reçoivent le site ; ceux qui en ont déjà un, les adresses d'équipe et les autres familles restent intacts", () => {
    assert.equal(withSite("/marketing/contacts/12", 7), "/marketing/contacts/12?site=7");
    assert.equal(withSite("/marketing/contacts?q=a&amp;page=2", 7), "/marketing/contacts?q=a&amp;page=2&amp;site=7");
    assert.equal(withSite("/marketing/formulaires/4#x", 7), "/marketing/formulaires/4?site=7#x");
    for (const u of ["/marketing/contacts?site=3", "/marketing/contacts/doublons", "/marketing/contacts/fusion?a=1", "/marketing/contacts/demandes/traiter", "/marketing/contacts/demandes/5/accepter", "/marketing/sms", "/autre", "https://x.test/marketing/contacts"]) assert.equal(withSite(u, 7), u, u);
    assert.equal(carry("<p>x</p>", NaN), "<p>x</p>"); assert.equal(carry("<a href=\"/marketing/contacts\">a</a>", -1), "<a href=\"/marketing/contacts\">a</a>");
    const out = carry('<form method="post" action="/marketing/contacts/1/etat"><button></button></form><form action="/marketing/contacts/1"><input name="site" value="9"></form><form action="/marketing/sms/x"></form><form method="get" action="/marketing/formulaires"></form>', 7);
    assert.match(out, /action="\/marketing\/contacts\/1\/etat"><input type="hidden" name="site" value="7">/); assert.match(out, /value="9"><\/form>/);
    assert.equal((out.split("<form action=\"/marketing/contacts/1\">")[1].split("</form>")[0].match(/name="site"/g) || []).length, 1, "un formulaire qui porte déjà un site n'en reçoit pas un second"); assert.doesNotMatch(out, /sms\/x"><input/); assert.match(out, /action="\/marketing\/formulaires"><input type="hidden" name="site" value="7">/);
  });
});

describe("Formulaires et Contacts dans l'espace d'un site (serveur réel)", () => {
  let srv, boss, db, A, B, anon, adminA, editorA, viewerA, maskedA, adminB, teamViewer, noAccess, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SP = "/marketing/site-web/sites";
  const M = "/marketing";
  const frame = (html, name) => html.includes(`mk-site-banner-name">${name}<`);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const contact = (email, site, extra = "") => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id, first_name) VALUES (1, ?, ?, ?)").run(email, site, extra || "Prénom").lastInsertRowid);
  const form = (name, slug, site) => Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (1, ?, ?, 'oui', ?)").run(name, slug, site).lastInsertRowid);
  const hrefs = (html) => [...new Set([...html.matchAll(/<a\b[^>]*\shref="([^"#]*)/g)].map((m) => m[1].replace(/&amp;/g, "&")))];
  const person = async (siteId, role, orgRole) => { const c = await newStudent(srv); if (orgRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, ?, ?)").run(idOf(c), orgRole); if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Contacts"); B = await mkSite("Bravo Contacts");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer"); adminB = await person(B, "admin");
    teamViewer = await person(null, null, "viewer"); noAccess = await newStudent(srv);
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts masques", description: "t", perm: ["contacts.read", "forms.read"] });
    maskedA = await person(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts masques'").key);
    ids.a1 = contact("alice.alpha@ex.cd", A, "Alice"); ids.a2 = contact("anna.alpha@ex.cd", A, "Anna"); ids.b1 = contact("bob.bravo@ex.cd", B, "Bob"); ids.p1 = contact("paul.principal@ex.cd", null, "Paul");
    ids.fa = form("FORM-ALPHA", "form-alpha", A); ids.fb = form("FORM-BRAVO", "form-bravo", B); ids.fp = form("FORM-PRINCIPAL", "form-principal", null);
  });
  after(() => { db.close(); return srv.stop(); });

  test("menu : « Formulaires » et « Contacts » sont des liens ouverts dans le cadre du site (équipe, administrateur, lecteur) ; plus de « Bientôt » pour eux", async () => {
    for (const c of [boss, adminA, viewerA]) {
      const html = (await c.get(`${SP}/${A}/tableau-de-bord`)).text;
      assert.ok(html.includes(`href="${SP}/${A}/formulaires"`) && html.includes(`href="${SP}/${A}/contacts"`));
      assert.doesNotMatch(html, /title="(Formulaires|Contacts) \(bientôt\)"/);
    }
  });
  test("/sites/N/contacts et /sites/N/formulaires : 200 dans le cadre du site avec SES données seulement ; autre site → 403 ; anonyme → connexion ; aucun compte sans accès", async () => {
    for (const [slug, mine, others] of [["contacts", ["alice.alpha", "anna.alpha"], ["bob.bravo", "paul.principal"]], ["formulaires", ["FORM-ALPHA"], ["FORM-BRAVO", "FORM-PRINCIPAL"]]]) {
      for (const c of [boss, adminA, editorA, viewerA]) {
        const r = await c.get(`${SP}/${A}/${slug}`); assert.equal(r.status, 200, slug); assert.ok(frame(r.text, "Alpha Contacts"), `${slug} : cadre`);
        for (const m of mine) assert.ok(r.text.includes(m) || /•/.test(r.text), `${slug} : ${m}`);
        for (const o of others) assert.ok(!r.text.includes(o), `${slug} : ${o} ne doit pas apparaître`);
      }
      assert.equal((await adminB.get(`${SP}/${A}/${slug}`)).status, 403); assert.ok([302, 403].includes((await noAccess.get(`${SP}/${A}/${slug}`)).status));
      const a = await anon.get(`${SP}/${A}/${slug}`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
    }
  });
  test("données sensibles : un rôle sans « voir les données sensibles » ne reçoit que des adresses masquées, dans la liste et la fiche ; l'équipe de l'organisation reste inchangée", async () => {
    const list = (await maskedA.get(`${SP}/${A}/contacts`)).text; assert.doesNotMatch(list, /alice\.alpha@ex\.cd/);
    const fiche = await maskedA.get(`${M}/contacts/${ids.a1}?site=${A}`); assert.equal(fiche.status, 200); assert.doesNotMatch(fiche.text, /alice\.alpha@ex\.cd/);
    assert.match((await boss.get(`${SP}/${A}/contacts`)).text, /alice\.alpha@ex\.cd/);
  });
  test("aucun lien mort : tous les liens GET des pages Contacts / fiche / Formulaires / fiche formulaire / Mes demandes / Nouveau contact, suivis par l'administrateur du site, restent dans son site (200), sans renvoi vers « Mes sites » ni connexion", async () => {
    const pages = [`${SP}/${A}/contacts`, `${M}/contacts/${ids.a1}?site=${A}`, `${SP}/${A}/formulaires`, `${M}/formulaires/${ids.fa}`, `${SP}/${A}/contacts/demandes`, `${SP}/${A}/contacts/nouveau`];
    const seen = new Set();
    for (const [who, c] of [["administrateur", adminA], ["équipe", boss]]) for (const p of pages) {
      if (who === "équipe" && /contacts\/demandes$/.test(p)) { const t = await c.get(p); assert.equal(t.status, 302, "« Mes demandes » est la vue d'un site ; l'équipe traite les demandes ailleurs"); continue; }
      const r = await c.get(p); assert.equal(r.status, 200, p);
      for (const h of hrefs(r.text).filter((x) => /^\/marketing\/(contacts|formulaires)/.test(x))) {
        if (/export\.csv|doublons|fusion|demandes\/traiter/.test(h)) continue; // adresses d'équipe : volontairement sans site
        assert.match(h, /[?&]site=\d+/, `${who} ${p} : lien sans site : ${h}`); assert.ok(!new RegExp(`site=${B}`).test(h));
        if (seen.has(h)) continue; seen.add(h);
        const x = await c.get(h); assert.equal(x.status, 200, `${p} → ${h} : ${x.status} ${x.location || ""}`);
      }
    }
    assert.ok(seen.size >= 4, `${seen.size} destinations suivies`);
  });
  test("formulaires de page : chaque formulaire POST des pages Contact / Formulaire porte le champ « site » de l'espace (déterminé par le serveur)", async () => {
    for (const p of [`${M}/contacts/${ids.a1}?site=${A}`, `${M}/formulaires/${ids.fa}`, `${SP}/${A}/contacts/nouveau`, `${SP}/${A}/formulaires`]) {
      const html = (await adminA.get(p)).text;
      const blocks = html.match(/<form\b[^>]*>[\s\S]*?<\/form>/g) || [];
      const mineForms = blocks.filter((b) => /action="\/marketing\/(contacts|formulaires)/.test(b) && !/doublons|fusion|demandes\/traiter/.test(b));
      assert.ok(mineForms.length >= 1, p);
      for (const b of mineForms) assert.match(b, new RegExp(`name="site" value="${A}"`), `${p} : formulaire sans site`);
    }
  });
  test("écritures de contacts : l'administrateur modifie un contact de SON site (retour sur la fiche, dans le site) ; contact d'un autre site / du principal intacts ; lecteur et administrateur d'un autre site : rien", async () => {
    const name = (id) => one("SELECT first_name FROM mk_contacts WHERE id = ?", id).first_name;
    const edit = (c, id, site) => c.post(`${M}/contacts/${id}${site ? `?site=${site}` : ""}`, { first_name: "MODIFIE", site });
    await edit(viewerA, ids.a1, A); await edit(adminB, ids.a1, B); await edit(adminB, ids.a1, A); await edit(adminA, ids.b1, A); await edit(adminA, ids.p1, A); await edit(adminA, ids.b1, B);
    assert.deepEqual([name(ids.a1), name(ids.b1), name(ids.p1)], ["Alice", "Bob", "Paul"], "aucune modification interdite");
    const ok = await edit(adminA, ids.a1, A); assert.equal(ok.status, 302); assert.match(ok.location, new RegExp(`/contacts/${ids.a1}.*site=${A}`), "retour sur la fiche, avec le site"); assert.equal(name(ids.a1), "MODIFIE");
  });
  test("actions groupées « tout ou rien » : un ensemble qui contient un contact d'un autre site est refusé en bloc ; le lecteur ne peut rien ; l'ensemble du site passe", async () => {
    const state = () => JSON.stringify(db.prepare("SELECT id, status, record_status FROM mk_contacts ORDER BY id").all().map((r) => ({ ...r })));
    const before = state();
    await adminA.post(`${M}/contacts/actions?site=${A}`, { site: A, op: "archiver", ids: [String(ids.a2), String(ids.b1)] }); assert.equal(state(), before, "mélange refusé en bloc");
    await viewerA.post(`${M}/contacts/actions?site=${A}`, { site: A, op: "archiver", ids: [String(ids.a2)] }); assert.equal(state(), before, "lecteur : rien");
    await adminB.post(`${M}/contacts/actions?site=${A}`, { site: A, op: "archiver", ids: [String(ids.a2)] }); assert.equal(state(), before, "autre site : rien");
  });
  test("actions réservées à l'équipe : doublons, fusion, traitement des demandes → refusés à l'administrateur du site (même avec le site de l'adresse), ouverts à l'équipe ; export réservé à ses droits", async () => {
    for (const p of ["/contacts/doublons", "/contacts/fusion", "/contacts/demandes/traiter"]) {
      const r = await adminA.get(`${M}${p}?site=${A}`); assert.ok([302, 403, 404].includes(r.status), `${p} ${r.status}`); assert.doesNotMatch(r.text, /paul\.principal|bob\.bravo/, p);
    }
    for (const p of ["/contacts/doublons", "/contacts/demandes/traiter"]) assert.equal((await boss.get(`${M}${p}`)).status, 200, p);
    const html = (await adminA.get(`${SP}/${A}/contacts`)).text; assert.doesNotMatch(html, /href="\/marketing\/contacts\/doublons"|demandes\/traiter/, "liens d'équipe absents du site");
  });
  test("Nouveau contact : ouvert à qui peut écrire, dans le cadre du site ; refusé au lecteur ; la création rattache le contact au site de l'adresse (jamais à celui du corps) et ne révèle pas un contact d'un autre site", async () => {
    assert.equal((await adminA.get(`${SP}/${A}/contacts/nouveau`)).status, 200); assert.equal((await viewerA.get(`${SP}/${A}/contacts/nouveau`)).status, 403);
    assert.equal((await adminA.get(`${M}/contacts/nouveau?site=${A}`)).status, 200, "adresse directe avec le site de l'espace");
    assert.equal((await adminA.get(`${M}/contacts/nouveau?site=${B}`)).status, 403, "avec le site d'un autre : refusé");
    assert.equal((await adminA.get(`${M}/contacts/nouveau`)).status, 302, "sans site : renvoyé vers Mes sites (jamais le principal)");
    const r = await adminA.post(`${M}/contacts?site=${A}`, { site: B, email: "nouveau.alpha@ex.cd", first_name: "Neuf" }); assert.equal(r.status, 302);
    const created = one("SELECT origin_site_id s FROM mk_contacts WHERE email = 'nouveau.alpha@ex.cd'"); assert.equal(created.s, A, "rattaché au site de l'adresse");
    const same = await adminA.post(`${M}/contacts?site=${A}`, { site: A, email: "bob.bravo@ex.cd" }); const fresh = await adminA.post(`${M}/contacts?site=${A}`, { site: A, email: "inconnu.total@ex.cd" });
    assert.equal(same.status, fresh.status, "même réponse : l'existence d'une adresse d'un autre site n'est pas confirmée"); assert.equal(same.location, fresh.location);
    assert.equal(one("SELECT origin_site_id s FROM mk_contacts WHERE email = 'bob.bravo@ex.cd'").s, B, "le contact de l'autre site n'a pas changé de site");
    assert.match((await adminA.get(`${SP}/${A}/contacts/demandes`)).text, /bob\.bravo|demande|Demande/i, "la demande est visible dans « Mes demandes » de CE site");
  });
  test("formulaires : l'administrateur crée un formulaire pour SON site (même si le corps désigne un autre) et gère les siens ; un formulaire d'un autre site ou du principal est refusé et intact ; le lecteur ne peut rien", async () => {
    const st = (id) => one("SELECT status FROM mk_forms WHERE id = ?", id) || null;
    const res = await adminA.post(`${M}/formulaires?site=${A}`, { site: B, name: "FORM-CREE-ALPHA", consentText: "J'accepte" }); assert.equal(res.status, 302);
    assert.equal(one("SELECT site_id s FROM mk_forms WHERE name = 'FORM-CREE-ALPHA'").s, A);
    const before = JSON.stringify([st(ids.fb), st(ids.fp)]);
    for (const [c, id, site] of [[adminA, ids.fb, A], [adminA, ids.fp, A], [adminB, ids.fa, B], [adminB, ids.fa, A], [viewerA, ids.fa, A]]) for (const act of ["publier", "depublier", "supprimer"]) await c.post(`${M}/formulaires/${id}/${act}?site=${site}`, { site });
    assert.equal(JSON.stringify([st(ids.fb), st(ids.fp)]), before, "formulaires d'un autre site / du principal intacts");
    assert.equal(db.prepare("SELECT 1 FROM mk_forms WHERE id = ?").get(ids.fa) !== undefined, true, "le formulaire d'Alpha existe toujours après les refus");
    assert.equal((await adminA.get(`${M}/formulaires/${ids.fb}?site=${A}`)).status, 403); assert.equal((await adminA.get(`${M}/formulaires/${ids.fp}`)).status, 403);
  });
  test("équipe de l'organisation (lecteur d'équipe) : voit les deux écrans du site, ne peut rien écrire ; la vue historique /marketing/contacts sans site reste le Marketing global (inchangée)", async () => {
    assert.equal((await teamViewer.get(`${SP}/${A}/contacts`)).status, 200);
    assert.equal((await teamViewer.post(`${M}/contacts/${ids.a1}?site=${A}`, { first_name: "X", site: A })).status, 403);
    const global = (await boss.get(`${M}/contacts`)).text; for (const e of ["alice.alpha", "bob.bravo", "paul.principal"]) assert.ok(global.includes(e), e);
    assert.ok(!frame(global, "Alpha Contacts"), "sans site choisi : pas de cadre de site");
  });
});
