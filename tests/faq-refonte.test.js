// FAQ : brouillons invisibles (page, formation, données structurées), modification persistante, ordre, catégories, périmètre (formation d'un autre formateur),
// validation avec conservation de la saisie, neutralisation, accès réservé, page publique (recherche, catégories, liens directs).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof, other, course;
const sql = (q, ...a) => { const db = srv.db(); try { return db.prepare(q).all(...a); } finally { db.close(); } };
const run = (q, ...a) => { const db = srv.db(); try { return db.prepare(q).run(...a); } finally { db.close(); } };
const anon = () => new Client(srv.base);
const add = (c, body) => c.post("/formateur/faq/ajouter", body);
const idOf = (question) => sql("SELECT id FROM faqs WHERE question = ?", question)[0].id;
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1])).flatMap((b) => (b["@graph"] ? b["@graph"] : [b]));

before(async () => {
  srv = await startServer(); prof = await loginInstructor(srv);
  run("INSERT INTO users (username, email, password_hash, role) VALUES ('Autre', 'autre@test.local', ?, 'formateur')", bcrypt.hashSync("MotDePasseAutre123", 10));
  other = await new Client(srv.base).login("autre@test.local", "MotDePasseAutre123");
  course = await createCourse(prof, srv, { title: "Formation FAQ", price: 10 });
});
after(() => srv.stop());

test("colonnes ajoutées avec défauts qui conservent l'existant (publiée, sans catégorie)", () => {
  const cols = sql("PRAGMA table_info(faqs)"); const by = Object.fromEntries(cols.map((c) => [c.name, c]));
  assert.equal(by.category.dflt_value, "''"); assert.equal(by.published.dflt_value, "1");
});

test("ajout avec catégorie ; brouillon absent de la page, des données structurées et de la page formation ; publication le fait apparaître", async () => {
  await add(prof, { question: "Accès après achat ?", answer: "Immédiat.", category: "Accès", published_present: "1", published: "1" });
  await add(prof, { question: "Question brouillon zzd ?", answer: "Pas encore.", category: "Accès", published_present: "1" });
  assert.equal(sql("SELECT published FROM faqs WHERE question = 'Question brouillon zzd ?'")[0].published, 0);
  let html = (await anon().get("/faq")).text;
  assert.match(html, /Accès après achat/); assert.doesNotMatch(html, /zzd/);
  assert.equal(jsonLd(html).find((b) => b["@type"] === "FAQPage").mainEntity.length, 1);
  await add(prof, { question: "Brouillon formation zzf ?", answer: "x", course_id: String(course.id), published_present: "1" });
  assert.doesNotMatch((await anon().get(`/cours/${course.slug}`)).text, /zzf/);
  await prof.post(`/formateur/faq/${idOf("Question brouillon zzd ?")}/publier`, { published: "1" });
  html = (await anon().get("/faq")).text;
  assert.match(html, /zzd/); assert.equal(jsonLd(html).find((b) => b["@type"] === "FAQPage").mainEntity.length, 2);
  assert.match(html, /<h2 id="faq-g-0">Accès<\/h2>/); assert.match(html, /id="faq-\d+"/); assert.match(html, /href="#faq-\d+"/);
});

test("modification : enregistrée après rechargement, erreurs par champ avec saisie conservée, rien d'écrit en cas d'échec", async () => {
  const id = idOf("Accès après achat ?");
  const form = (await prof.get(`/formateur/faq/${id}/modifier`)).text;
  assert.match(form, /value="Accès après achat \?"/);
  const bad = await prof.post(`/formateur/faq/${id}/modifier`, { question: "", answer: "Ma réponse longue conservée", category: "Accès", published_present: "1", published: "1" });
  assert.equal(bad.status, 400); assert.match(bad.text, /La question est obligatoire/); assert.match(bad.text, /Ma réponse longue conservée/);
  assert.equal(sql("SELECT question FROM faqs WHERE id = ?", id)[0].question, "Accès après achat ?");
  const ok = await prof.post(`/formateur/faq/${id}/modifier`, { question: "Accès après paiement ?", answer: "Immédiat, **dès confirmation**.", category: "Paiement", published_present: "1", published: "1" });
  assert.equal(ok.status, 302);
  const row = sql("SELECT * FROM faqs WHERE id = ?", id)[0];
  assert.equal(row.question, "Accès après paiement ?"); assert.equal(row.category, "Paiement"); assert.equal(row.published, 1);
  assert.match((await anon().get("/faq")).text, /<strong>dès confirmation<\/strong>/);
  assert.match((await prof.get("/formateur/faq")).text, /Question enregistrée/);
  assert.doesNotMatch((await prof.get("/formateur/faq")).text, /Question enregistrée/, "message lu une seule fois");
});

test("ordre : monter / descendre échangent bien les voisines, sans effet aux extrémités", async () => {
  for (const q of ["Ordre A ?", "Ordre B ?", "Ordre C ?"]) await add(prof, { question: q, answer: "r", published_present: "1", published: "1" });
  const order = () => sql("SELECT question FROM faqs WHERE course_id IS NULL AND question LIKE 'Ordre %' ORDER BY position, id").map((r) => r.question[6]).join("");
  assert.equal(order(), "ABC");
  await prof.post(`/formateur/faq/${idOf("Ordre C ?")}/monter`, {}); assert.equal(order(), "ACB");
  await prof.post(`/formateur/faq/${idOf("Ordre A ?")}/monter`, {}); assert.equal(order(), "ACB");
  await prof.post(`/formateur/faq/${idOf("Ordre C ?")}/descendre`, {}); assert.equal(order(), "ABC");
  const html = (await anon().get("/faq")).text;
  assert.ok(html.indexOf("Ordre A") < html.indexOf("Ordre B") && html.indexOf("Ordre B") < html.indexOf("Ordre C"));
});

test("périmètre : la FAQ d'une formation n'est ni visible ni modifiable par un autre formateur (404) ; les questions générales le sont", async () => {
  await add(prof, { question: "Privée formation ?", answer: "Réponse.", course_id: String(course.id), published_present: "1", published: "1" });
  const id = idOf("Privée formation ?");
  for (const [m, url, body] of [["get", `/formateur/faq/${id}/modifier`], ["post", `/formateur/faq/${id}/modifier`, { question: "Piraté", answer: "x" }], ["post", `/formateur/faq/${id}/supprimer`, {}], ["post", `/formateur/faq/${id}/publier`, { published: "0" }], ["post", `/formateur/faq/${id}/monter`, {}]]) {
    const r = await (m === "get" ? other.get(url) : other.post(url, body)); assert.equal(r.status, 404, `${m} ${url}`);
  }
  assert.equal((await other.get(`/formateur/cours/${course.id}/faq`)).status, 404);
  assert.equal((await other.post("/formateur/faq/ajouter", { question: "Intrus", answer: "x", course_id: String(course.id) })).status, 404);
  assert.equal(sql("SELECT question FROM faqs WHERE id = ?", id)[0].question, "Privée formation ?");
  assert.equal((await other.get("/formateur/faq")).status, 200);
});

test("accès réservé au formateur ; suppression réelle", async () => {
  const e = await newStudent(srv);
  assert.equal((await e.get("/formateur/faq")).status, 403);
  assert.equal((await e.post("/formateur/faq/ajouter", { question: "x", answer: "y" })).status, 403);
  assert.equal((await anon().get("/formateur/faq")).status, 302);
  const id = idOf("Privée formation ?");
  assert.equal((await prof.post(`/formateur/faq/${id}/supprimer`, {})).status, 302);
  assert.equal(sql("SELECT COUNT(*) n FROM faqs WHERE id = ?", id)[0].n, 0);
  assert.equal((await prof.post(`/formateur/faq/${id}/supprimer`, {})).status, 404, "déjà supprimée");
});

test("contenu neutralisé dans la question, la catégorie et la réponse (page publique et administration)", async () => {
  await add(prof, { question: "<img src=x onerror=alert(1)> ?", answer: "<script>alert(2)</script> [x](javascript:alert(3))", category: "<b>Cat</b>", published_present: "1", published: "1" });
  for (const html of [(await anon().get("/faq")).text, (await prof.get("/formateur/faq")).text]) {
    assert.doesNotMatch(html, /<img src=x|<script>alert\(2\)|href="javascript:|<b>Cat<\/b>/);
  }
});

test("page publique : recherche et catégories présentes à partir de 6 questions, script chargé, lien de support, état vide propre", async () => {
  for (let i = 0; i < 4; i++) await add(prof, { question: `Volume ${i} ?`, answer: "Texte.", published_present: "1", published: "1" });
  const html = (await anon().get("/faq")).text;
  assert.match(html, /data-faq-q/); assert.match(html, /data-faq-cat=""/); assert.match(html, /\/js\/faq\.js/); assert.match(html, /role="status"/); assert.match(html, /href="\/support"/);
  assert.match(html, /data-text="[^"]*volume 1/);
  assert.match(html, /data-faq-none/);
});
