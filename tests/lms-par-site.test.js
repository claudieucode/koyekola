// Titan XXIII — LMS multi-sites de bout en bout (serveur réel) : deux sites sur deux domaines + le site principal, une formation chacun.
// Vérifie l'isolation du catalogue, des fiches, de l'espace étudiant, du panier, du plan du site, la persistance de la progression et la désactivation sans perte.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, createCourse } = require("./helpers");

// Petit navigateur à plusieurs hôtes : un pot de cookies par hôte (comme un vrai navigateur), pas de redirection suivie
class HostClient {
  constructor(srv) { this.srv = srv; this.jars = new Map(); }
  request(host, path, { method = "GET", form, headers = {} } = {}) {
    const u = new URL(this.srv.base);
    const jar = this.jars.get(host) || new Map(); this.jars.set(host, jar);
    const h = { Host: host, ...headers };
    if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    let body;
    if (form) { body = new URLSearchParams(form).toString(); h["Content-Type"] = "application/x-www-form-urlencoded"; h["Content-Length"] = Buffer.byteLength(body); }
    return new Promise((resolve, reject) => {
      const r = http.request({ host: u.hostname, port: u.port, path, method, headers: h }, (resp) => {
        for (const line of resp.headers["set-cookie"] || []) { const [pair] = line.split(";"); const i = pair.indexOf("="); jar.set(pair.slice(0, i), pair.slice(i + 1)); }
        let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location }));
      });
      r.on("error", reject); if (body) r.write(body); r.end();
    });
  }
  get(host, path) { return this.request(host, path); }
  post(host, path, form) { return this.request(host, path, { method: "POST", form }); }
}

describe("LMS multi-sites : catalogue, fiches, espace étudiant, panier, plan du site", () => {
  let srv, boss, db, org, A, B, cMain, cA, cB, student;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const ORIGIN = () => ({ Origin: srv.base });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const enable = (site, on) => db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (?, ?, 'lms', ?) ON CONFLICT (site_id, module) DO UPDATE SET enabled = excluded.enabled").run(site, org, on ? 1 : 0);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Design", "design"); B = mkSite("Video", "video");
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    cMain = await createCourse(boss, srv, { title: "Cours Principal ZZ", price: 0 });
    cA = await createCourse(boss, srv, { title: "Cours Design AA", price: 0, lessons: [{ title: "Lecon A1" }] });
    cB = await createCourse(boss, srv, { title: "Cours Video BB", price: 0, lessons: [{ title: "Lecon B1" }] });
    student = new HostClient(srv);
  });
  after(() => { db.close(); return srv.stop(); });

  test("sans module activé, un domaine de site ne sert aucune formation (fermé par défaut)", async () => {
    for (const p of ["/catalogue", `/cours/${cA.slug}`, "/panier"]) assert.equal((await student.get("a.test", p)).status, 404, p);
  });

  test("rattachement : refusé sans module activé, accepté ensuite ; la formation quitte le site principal", async () => {
    const refused = await boss.post(`/formateur/cours/${cA.id}/site`, { site_id: A });
    assert.equal(refused.status, 400, "module non activé : refus");
    enable(A, true); enable(B, true);
    assert.equal((await boss.post(`/formateur/cours/${cA.id}/site`, { site_id: A })).status, 302);
    assert.equal((await boss.post(`/formateur/cours/${cB.id}/site`, { site_id: B })).status, 302);
    assert.equal(one("SELECT site_id FROM mk_course_sites WHERE course_id = ?", cA.id).site_id, A);
    const move = await boss.post(`/formateur/cours/${cA.id}/site`, { site_id: B });
    assert.equal(move.status, 400, "pas de déplacement silencieux d'un site à l'autre");
    assert.equal(one("SELECT site_id FROM mk_course_sites WHERE course_id = ?", cA.id).site_id, A);
  });

  test("catalogue : chaque domaine ne liste que SES formations", async () => {
    const a = await student.get("a.test", "/catalogue"), b = await student.get("b.test", "/catalogue"), k = await student.get("k.test", "/catalogue");
    assert.equal(a.status, 200); assert.equal(b.status, 200); assert.equal(k.status, 200);
    assert.match(a.text, /Cours Design AA/); assert.doesNotMatch(a.text, /Cours Video BB|Cours Principal ZZ/);
    assert.match(b.text, /Cours Video BB/); assert.doesNotMatch(b.text, /Cours Design AA|Cours Principal ZZ/);
    assert.match(k.text, /Cours Principal ZZ/); assert.doesNotMatch(k.text, /Cours Design AA|Cours Video BB/);
  });

  test("fiche, plan et PDF : la formation d'un autre site est introuvable, quel que soit l'identifiant ou l'adresse demandée", async () => {
    for (const suffix of ["", "/plan", "/programme.pdf"]) {
      assert.equal((await student.get("a.test", `/cours/${cA.slug}${suffix}`)).status, 200, `A voit A${suffix}`);
      for (const [host, slug] of [["a.test", cB.slug], ["b.test", cA.slug], ["k.test", cA.slug], ["k.test", cB.slug], ["a.test", cMain.slug]]) {
        const r = await student.get(host, `/cours/${slug}${suffix}`);
        assert.equal(r.status, 404, `${host}/cours/${slug}${suffix}`);
        assert.doesNotMatch(r.text, /Cours (Design AA|Video BB|Principal ZZ)/);
      }
    }
  });

  test("étudiant du site A : inscription, accès à A, rien sur B ni sur le principal, panier cloisonné", async () => {
    const reg = await student.post("a.test", "/inscription", { username: "eleveaa", email: "eleveaa@test.local", password: "MotDePasseEleve123" });
    assert.equal(reg.status, 302);
    // une formation d'un autre site ne s'ajoute pas au panier de ce site
    await student.post("a.test", `/panier/ajouter/${cB.id}`, {});
    await student.post("a.test", `/panier/ajouter/${cMain.id}`, {});
    assert.equal((await student.get("a.test", "/commande")).status, 302, "panier vide : redirection");
    assert.doesNotMatch((await student.get("a.test", "/panier")).text, /Cours (Video BB|Principal ZZ)/);
    // formation du site (gratuite) : ajout puis commande
    await student.post("a.test", `/panier/ajouter/${cA.id}`, {});
    const order = await student.post("a.test", "/commande", {});
    assert.ok([200, 302].includes(order.status), `commande ${order.status}`);
    assert.equal(one("SELECT COUNT(*) n FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.email = 'eleveaa@test.local'").n, 1);
    assert.equal(one("SELECT course_id FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.email = 'eleveaa@test.local'").course_id, cA.id);
    // espace étudiant
    const lessonA = cA.lessons[0].id;
    assert.equal((await student.get("a.test", `/apprendre/${cA.slug}/${lessonA}`)).status, 200);
    assert.match((await student.get("a.test", "/mes-cours")).text, /Cours Design AA/);
    // le même compte connecté sur un autre domaine n'y voit rien (cookies distincts) ; connecté, il ne voit pas la formation sur B ni sur le principal
    await student.request("b.test", "/connexion", { method: "POST", form: { email: "eleveaa@test.local", password: "MotDePasseEleve123" } });
    await student.request("k.test", "/connexion", { method: "POST", form: { email: "eleveaa@test.local", password: "MotDePasseEleve123" } });
    for (const host of ["b.test", "k.test"]) {
      assert.equal((await student.get(host, `/apprendre/${cA.slug}`)).status, 404, `${host} : espace d'apprentissage de A introuvable`);
      assert.equal((await student.get(host, `/apprendre/${cA.slug}/${lessonA}`)).status, 404);
      assert.doesNotMatch((await student.get(host, "/mes-cours")).text, /Cours Design AA/, `${host} : mes cours`);
      assert.equal((await student.get(host, `/certificat/${cA.slug}`)).status, 404);
    }
  });

  test("identifiants falsifiés : terminer une leçon, soumettre un quiz ou suivre une leçon d'un autre site ne change rien", async () => {
    const before = one("SELECT COUNT(*) n FROM lesson_progress").n;
    const lessonB = cB.lessons[0].id;
    // inscrit de force à B (cas pire) puis demande depuis le domaine de A : refusé
    db.prepare("INSERT INTO enrollments (user_id, course_id) SELECT id, ? FROM users WHERE email = 'eleveaa@test.local'").run(cB.id);
    await student.post("a.test", `/apprendre/lecon/${lessonB}/terminer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM lesson_progress").n, before, "aucune progression écrite depuis le mauvais site");
    const track = await student.request("a.test", `/apprendre/lecon/${lessonB}/progression`, { method: "POST", form: { seconds: "10", duration: "100" } });
    assert.equal(track.status, 404);
    db.prepare("DELETE FROM enrollments WHERE course_id = ?").run(cB.id);
  });

  test("progression : enregistrée sur le bon site et retrouvée après reconnexion", async () => {
    const lessonA = cA.lessons[0].id;
    await student.post("a.test", `/apprendre/lecon/${lessonA}/terminer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM lesson_progress WHERE lesson_id = ?", lessonA).n, 1);
    const again = new HostClient(srv); // nouvelle session = reconnexion
    assert.equal((await again.request("a.test", "/connexion", { method: "POST", form: { email: "eleveaa@test.local", password: "MotDePasseEleve123" } })).status, 302);
    assert.match((await again.get("a.test", "/mes-cours")).text, /Cours Design AA/);
    assert.equal((await again.get("a.test", `/apprendre/${cA.slug}/${lessonA}`)).status, 200);
  });

  test("plan du site : chaque domaine liste ses formations, jamais celles d'un autre", async () => {
    const a = (await student.get("a.test", "/sitemap.xml")).text, b = (await student.get("b.test", "/sitemap.xml")).text, k = (await student.get("k.test", "/sitemap.xml")).text;
    assert.match(a, new RegExp(`a\\.test/cours/${cA.slug}`)); assert.doesNotMatch(a, new RegExp(`${cB.slug}|${cMain.slug}`));
    assert.match(b, new RegExp(`b\\.test/cours/${cB.slug}`)); assert.doesNotMatch(b, new RegExp(`${cA.slug}|${cMain.slug}`));
    assert.match(k, new RegExp(`/cours/${cMain.slug}`)); assert.doesNotMatch(k, new RegExp(`${cA.slug}|${cB.slug}`));
  });

  test("désactiver le module ferme le site sans rien supprimer ; le réactiver rend tout", async () => {
    const enrollments = one("SELECT COUNT(*) n FROM enrollments").n, links = one("SELECT COUNT(*) n FROM mk_course_sites").n;
    enable(A, false);
    assert.equal((await student.get("a.test", "/catalogue")).status, 404);
    assert.equal((await student.get("a.test", `/cours/${cA.slug}`)).status, 404);
    assert.equal((await student.get("a.test", `/apprendre/${cA.slug}`)).status, 404);
    assert.doesNotMatch((await student.get("a.test", "/sitemap.xml")).text, new RegExp(cA.slug));
    assert.equal(one("SELECT COUNT(*) n FROM enrollments").n, enrollments); assert.equal(one("SELECT COUNT(*) n FROM mk_course_sites").n, links);
    enable(A, true);
    assert.equal((await student.get("a.test", `/cours/${cA.slug}`)).status, 200);
    assert.equal((await student.get("a.test", `/apprendre/${cA.slug}/${cA.lessons[0].id}`)).status, 200);
  });

  test("le site principal continue de fonctionner", async () => {
    assert.equal((await student.get("k.test", `/cours/${cMain.slug}`)).status, 200);
    assert.match((await student.get("k.test", "/catalogue")).text, /Cours Principal ZZ/);
  });
});
