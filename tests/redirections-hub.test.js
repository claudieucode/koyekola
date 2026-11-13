// Redirections : espace de travail (vrai serveur) — navigation complète, écrans du site principal et d'un site, formulaires réels, redirections réellement servies (303, 451, contient, période).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor } = require("./helpers");

describe("Redirections : espace de travail (serveur)", () => {
  let srv, boss, db, siteA;
  const MAIN = "/marketing/site-web/redirections";
  const SCREENS = ["tableau-de-bord", "groupes", "erreurs-404", "journaux", "adresses", "import-export", "outils", "parametres"];
  const LABELS = ["Tableau de bord", "Toutes les redirections", "Groupes", "Liens cassés \\(404\\)", "Journaux et statistiques", "Permaliens et adresses", "Importer / Exporter", "Outils avancés", "Paramètres"];
  const create = (fields) => boss.post(MAIN, { retour: MAIN, ...fields });
  const go = (p) => boss.request(p, {});
  const pairs = (obj) => Object.entries(obj).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]));
  const postMulti = (url, obj) => boss.post(url, pairs(obj));
  before(async () => {
    srv = await startServer({ SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    siteA = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site A', 'site-a', '{}')").run(org).lastInsertRowid);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("chaque écran du site principal répond 200 avec les 9 onglets ; aucune mention « Bientôt »", async () => {
    for (const s of SCREENS) {
      const r = await boss.get(`${MAIN}/${s}`);
      assert.equal(r.status, 200, s);
      for (const l of LABELS) assert.match(r.text, new RegExp(l), `${s} : onglet ${l}`);
      assert.doesNotMatch(r.text, /Bientôt|BIENTÔT/, s);
    }
    for (const p of [MAIN, "/marketing/site-web/liens-casses", "/marketing/site-web/permaliens"]) { const r = await boss.get(p); assert.equal(r.status, 200, p); assert.match(r.text, /Importer \/ Exporter/, `${p} : onglets communs`); }
  });
  test("les écrans d'un site répondent 200, au nom du site, et le menu du site ouvre toute la rubrique (plus de « Bientôt »)", async () => {
    for (const s of SCREENS) {
      const r = await boss.get(`/marketing/site-web/sites/${siteA}/redirections/${s}`);
      assert.equal(r.status, 200, `${s} : ${r.text.slice(0, 200)}`);
      assert.match(r.text, /Site « Site A »/, s);
    }
    const page = await boss.get(`/marketing/site-web/sites/${siteA}/redirections/groupes`);
    const nav = page.text.slice(page.text.indexOf('aria-label="Redirections"') - 200);
    for (const label of ["Groupes", "Journaux et statistiques", "Importer / Exporter", "Outils avancés", "Paramètres"]) assert.doesNotMatch(page.text, new RegExp(`is-soon[^>]*>[^<]*<span>${label}`), `menu du site : ${label}`);
    assert.ok(nav.length > 0);
    assert.ok([403, 404].includes((await boss.get("/marketing/site-web/sites/999999/redirections/tableau-de-bord")).status), "site inconnu");
  });
  test("créer par le formulaire avec options avancées : 303, 451, contient, période, groupe ; ce que le serveur répond est ce qui est enregistré", async () => {
    await boss.post(`${MAIN}/groupes`, { name: "Anciennes pages", description: "test" });
    const g = db.prepare("SELECT id FROM seo_redirect_groups WHERE name = 'Anciennes pages'").get(); assert.ok(g);
    await create({ source: "/vieux-303", target: "/nouveau", status: "303", match_type: "exact", group_id: String(g.id), priority: "100" });
    await create({ source: "/retire-451", target: "", status: "451", match_type: "exact" });
    await create({ source: "/archive-2019/", target: "/blog", status: "301", match_type: "contains", priority: "50" });
    await create({ source: "/promo-finie", target: "/offre", status: "302", match_type: "exact", starts_at: "2020-01-01T00:00", ends_at: "2020-02-01T00:00" });
    await create({ source: "/sans-param", target: "/dest", status: "301", match_type: "exact", query_mode: "drop" });
    const row = db.prepare("SELECT * FROM seo_redirects WHERE source_path = '/vieux-303'").get();
    assert.equal(row.status, 303); assert.equal(row.group_id, g.id);
    assert.equal(db.prepare("SELECT match_type FROM seo_redirects WHERE source_path = '/archive-2019/' OR source_path = '/archive-2019'").get().match_type, "contains", "la correspondance choisie est enregistrée");
    const a = await go("/vieux-303"); assert.equal(a.status, 303); assert.equal(a.location, "/nouveau");
    assert.equal((await go("/retire-451")).status, 451);
    const c = await go("/dossier/archive-2019/page"); assert.equal(c.status, 301); assert.equal(c.location, "/blog");
    assert.equal((await go("/promo-finie")).status, 404, "hors période");
    assert.equal((await go("/sans-param?utm=1")).location, "/dest");
    const list = await boss.get(`${MAIN}?groupe=${g.id}`); assert.match(list.text, /vieux-303/); assert.match(list.text, /groupe : Anciennes pages/);
    const filtered = await boss.get(`${MAIN}?corr=contains`); assert.match(filtered.text, /archive-2019/); assert.doesNotMatch(filtered.text, /vieux-303/);
  });
  test("groupe désactivé : la règle ne s'applique plus ; réactivé, elle revient", async () => {
    const g = db.prepare("SELECT id FROM seo_redirect_groups WHERE name = 'Anciennes pages'").get();
    await boss.post(`${MAIN}/groupes/${g.id}`, { enabled: "0", name: "Anciennes pages" });
    assert.equal((await go("/vieux-303")).status, 404);
    await boss.post(`${MAIN}/groupes/${g.id}`, { enabled: "1", name: "Anciennes pages" });
    assert.equal((await go("/vieux-303")).status, 303);
  });
  test("actions groupées de la liste : désactiver puis supprimer plusieurs règles", async () => {
    await create({ source: "/lot-a", target: "/la", status: "301" }); await create({ source: "/lot-b", target: "/lb", status: "301" });
    const ids = db.prepare("SELECT id FROM seo_redirects WHERE source_path IN ('/lot-a', '/lot-b')").all().map((r) => String(r.id));
    await postMulti(`${MAIN}/actions`, { ids, action: "disable", retour: MAIN });
    assert.equal((await go("/lot-a")).status, 404);
    await postMulti(`${MAIN}/actions`, { ids, action: "enable", retour: MAIN });
    assert.equal((await go("/lot-a")).status, 301);
    await postMulti(`${MAIN}/actions`, { ids, action: "delete", retour: MAIN });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path IN ('/lot-a', '/lot-b')").get().n, 0);
  });
  test("import : l'aperçu n'écrit rien ; sans confirmation rien ; avec confirmation seules les lignes cochées et valides entrent", async () => {
    const csv = "/imp-1,/dest-1,301\n/imp-2,/dest-2,302\n/formateur/x,/y,301\n";
    const prev = await boss.post(`${MAIN}/import-export/apercu`, { text: csv });
    assert.equal(prev.status, 200); assert.match(prev.text, /Aperçu de l'import/); assert.match(prev.text, /Refusée/); assert.match(prev.text, /Prête/);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/imp-1'").get().n, 0);
    await postMulti(`${MAIN}/import-export/appliquer`, { text: csv, sel: ["0", "1", "2"] });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/imp-1'").get().n, 0, "sans confirmation : rien");
    await postMulti(`${MAIN}/import-export/appliquer`, { text: csv, sel: ["0", "2"], confirm: "1" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/imp-1'").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/imp-2'").get().n, 0, "ligne non cochée");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/formateur/x'").get().n, 0, "ligne invalide cochée : refusée");
    assert.equal((await go("/imp-1")).location, "/dest-1");
  });
  test("exports téléchargeables : CSV, JSON, Apache, Nginx, 404 et sauvegarde", async () => {
    for (const [q, re, mime] of [["format=csv", /\/imp-1,\/dest-1,301/, /text\/csv/], ["format=json", /kolakisa-redirects/, /json/], ["format=apache", /Redirect 301 \/imp-1 \/dest-1/, /text\/plain/], ["format=nginx", /location = \/imp-1/, /text\/plain/], ["contenu=404", /adresse,visites/, /text\/csv/]]) {
      const r = await boss.get(`${MAIN}/import-export/export?${q}`);
      assert.equal(r.status, 200, q); assert.match(r.text, re, q); assert.match(r.headers.get("content-type"), mime, q);
      assert.match(r.headers.get("content-disposition"), /attachment/);
    }
    const b = await boss.get(`${MAIN}/import-export/sauvegarde.json`); assert.equal(b.status, 200); assert.equal(JSON.parse(b.text).format, "kolakisa-redirects");
  });
  test("outils : le simulateur montre les étapes sans compter de visite ; le testeur de regex refuse une expression coûteuse", async () => {
    await create({ source: "/sim-a", target: "/sim-b", status: "301" }); await create({ source: "/sim-b", target: "/sim-c", status: "301" });
    const before = db.prepare("SELECT hits FROM seo_redirects WHERE source_path = '/sim-a'").get().hits;
    const r = await boss.get(`${MAIN}/outils?adresse=${encodeURIComponent("/sim-a")}`);
    assert.match(r.text, /règle n° /); assert.match(r.text, /2 étapes/); assert.match(r.text, /successives/);
    assert.equal(db.prepare("SELECT hits FROM seo_redirects WHERE source_path = '/sim-a'").get().hits, before);
    const re = await boss.post(`${MAIN}/outils/regex`, { pattern: "^/ancien/(.*)$", replacement: "/nouveau/$1", samples: "/ancien/page" });
    assert.match(re.text, /\/nouveau\/page/);
    assert.match((await boss.post(`${MAIN}/outils/regex`, { pattern: "^(a+)+$", replacement: "/x", samples: "/a" })).text, /Quantificateurs imbriqués|ralentir/);
  });
  test("liens cassés : une adresse introuvable réellement visitée est listée ; « Rediriger » crée la règle et la retire de la liste", async () => {
    await boss.get("/ancienne-recette-tarte-xyz");
    db.prepare("INSERT OR IGNORE INTO seo_404 (path, hits_human, hits_bot) VALUES ('/ancienne-recette-tarte-xyz', 3, 0)").run();
    const page = await boss.get(`${MAIN}/erreurs-404?etat=all`);
    assert.match(page.text, /ancienne-recette-tarte-xyz/); assert.match(page.text, /vérifiez-les avant de rediriger/);
    await boss.post(`${MAIN}/erreurs-404/rediriger`, { path: "/ancienne-recette-tarte-xyz", target: "/blog", status: "301" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE source_path = '/ancienne-recette-tarte-xyz'").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_404 WHERE path = '/ancienne-recette-tarte-xyz'").get().n, 0);
  });
  test("tableau de bord et paramètres : chiffres de la base ; mode « à valider » enregistré ; valeur invalide refusée", async () => {
    const total = db.prepare("SELECT COUNT(*) n FROM seo_redirects").get().n;
    const d = await boss.get(`${MAIN}/tableau-de-bord`);
    assert.match(d.text, new RegExp(`<strong>${total}</strong>`));
    await boss.post(`${MAIN}/parametres`, { autoMode: "validate", retentionDays: "90", deadDays: "120", allowedHosts: "exemple.com" });
    const p = await boss.get(`${MAIN}/parametres`); assert.match(p.text, /value="validate" checked/); assert.match(p.text, /exemple\.com/);
    await boss.post(`${MAIN}/parametres`, { autoMode: "nimporte" });
    assert.match((await boss.get(`${MAIN}/parametres`)).text, /value="validate" checked/, "valeur invalide : réglage inchangé");
    await boss.post(`${MAIN}/parametres`, { autoMode: "auto", allowedHosts: "" });
  });
  test("aucune erreur de rendu : les écrans d'import / outils / adresses acceptent des entrées hostiles sans planter", async () => {
    for (const q of ["adresse=%3Cscript%3Ealert(1)%3C%2Fscript%3E", "adresse=" + "a".repeat(600), "lot=%2F%0A%2F%0A%2F"]) assert.equal((await boss.get(`${MAIN}/outils?${q}`)).status, 200, q);
    assert.equal((await boss.get(`${MAIN}/adresses?anciennes=${encodeURIComponent("<b>x</b>\n/ok\n" + "z".repeat(500))}`)).status, 200);
    assert.ok([200, 302].includes((await boss.post(`${MAIN}/import-export/apercu`, { text: "<script>" })).status));
    const x = await boss.get(`${MAIN}/outils?adresse=${encodeURIComponent("/<img src=x onerror=alert(1)>")}`);
    assert.doesNotMatch(x.text, /<img src=x onerror/);
  });
});
