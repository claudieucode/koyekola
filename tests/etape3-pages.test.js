// Étape 3c : pages « À propos », « FAQ » (générale et par formation) et « Contact » (messages enregistrés).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof, eleve, course, other;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const addFaq = (client, body) => client.post("/formateur/faq/ajouter", body);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  eleve = await newStudent(srv);
  course = await createCourse(prof, srv, { title: "Avec FAQ", price: 10 });
  other = await createCourse(prof, srv, { title: "Sans FAQ", price: 10 });
});
after(() => srv.stop());

describe("page À propos", () => {
  test("page publique avec un texte par défaut, un H1 et un fil d'Ariane", async () => {
    const r = await anon().get("/a-propos");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1[^>]*>À propos<\/h1>/);
    assert.match(r.text, /KOYEKOLA/);
    assert.match(r.text, /aria-label="Fil d'Ariane"/);
    assert.match(r.text, /<link rel="canonical" href="[^"]+\/a-propos">/);
  });
  test("le formateur la modifie (Markdown), le HTML saisi est neutralisé", async () => {
    const form = await prof.get("/formateur/pages/a-propos");
    assert.equal(form.status, 200);
    assert.match(form.text, /<label[^>]+for="page-content"/);
    const r = await prof.post("/formateur/pages/a-propos", { content: "## Mon histoire\nJe suis **passionné**.\n\n<script>alert(1)</script>", seo_description: "Qui suis-je ?" });
    assert.equal(r.status, 302);
    const html = (await anon().get("/a-propos")).text;
    assert.match(html, /<h3>Mon histoire<\/h3>/);
    assert.match(html, /<strong>passionné<\/strong>/);
    assert.doesNotMatch(html, /<script>alert\(1\)/);
    assert.match(html, /<meta name="description" content="Qui suis-je \?">/);
    assert.match((await prof.get("/formateur/pages/a-propos")).text, /Mon histoire/);
  });
  test("un contenu vidé rétablit le texte par défaut", async () => {
    await prof.post("/formateur/pages/a-propos", { content: "   ", seo_description: "" });
    assert.match((await anon().get("/a-propos")).text, /plateforme de formation/i);
  });
  test("réservée au formateur", async () => {
    assert.equal((await eleve.get("/formateur/pages/a-propos")).status, 403);
    assert.equal((await eleve.post("/formateur/pages/a-propos", { content: "x" })).status, 403);
    assert.equal((await anon().get("/formateur/pages/a-propos")).status, 302);
  });
  test("une page inconnue ne peut pas être créée par l'adresse", async () => {
    assert.equal((await prof.get("/formateur/pages/nimporte")).status, 404);
  });
});

describe("FAQ générale", () => {
  test("vide : message clair, pas de données structurées", async () => {
    const r = await anon().get("/faq");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1[^>]*>Questions fréquentes<\/h1>/);
    assert.match(r.text, /Aucune question/);
    assert.equal(jsonLd(r.text).some((b) => b["@type"] === "FAQPage"), false);
  });
  test("ajouter une question : accordéon accessible (details/summary) + données structurées FAQPage", async () => {
    const r = await addFaq(prof, { question: "Puis-je me faire rembourser ?", answer: "Oui, **sous 14 jours**.\n\n- Sans justification" });
    assert.equal(r.status, 302);
    const html = (await anon().get("/faq")).text;
    assert.match(html, /<details[^>]*>\s*<summary[^>]*>Puis-je me faire rembourser \?<\/summary>/);
    assert.match(html, /<strong>sous 14 jours<\/strong>/);
    const faq = jsonLd(html).find((b) => b["@type"] === "FAQPage");
    assert.equal(faq.mainEntity.length, 1);
    assert.equal(faq.mainEntity[0]["@type"], "Question");
    assert.equal(faq.mainEntity[0].name, "Puis-je me faire rembourser ?");
    assert.match(faq.mainEntity[0].acceptedAnswer.text, /^Oui, sous 14 jours\./, "réponse en texte brut dans les données structurées");
  });
  test("les questions restent dans l'ordre d'ajout", async () => {
    await addFaq(prof, { question: "Deuxième question ?", answer: "Réponse 2" });
    await addFaq(prof, { question: "Troisième question ?", answer: "Réponse 3" });
    const html = (await anon().get("/faq")).text;
    assert.ok(html.indexOf("Puis-je me faire") < html.indexOf("Deuxième question") && html.indexOf("Deuxième question") < html.indexOf("Troisième question"));
  });
  test("le contenu saisi est neutralisé (question et réponse)", async () => {
    await addFaq(prof, { question: "<img src=x onerror=alert(1)> ?", answer: "<script>alert(2)</script>" });
    const html = (await anon().get("/faq")).text;
    assert.doesNotMatch(html, /<img src=x|<script>alert\(2\)/);
    assert.match(html, /&lt;img src=x/);
  });
  test("question ou réponse vide, ou trop longue : refusée sans rien enregistrer", async () => {
    const before = q("SELECT COUNT(*) n FROM faqs")[0].n;
    for (const bad of [{ question: "", answer: "x" }, { question: "x", answer: "  " }, { question: "q".repeat(301), answer: "x" }, { question: "x", answer: "a".repeat(5001) }]) {
      assert.equal((await addFaq(prof, bad)).status, 400);
    }
    assert.equal(q("SELECT COUNT(*) n FROM faqs")[0].n, before);
  });
  test("la page d'administration liste les questions avec un bouton de suppression", async () => {
    const html = (await prof.get("/formateur/faq")).text;
    assert.match(html, /Deuxième question/);
    const id = q("SELECT id FROM faqs WHERE question = 'Deuxième question ?'")[0].id;
    assert.match(html, new RegExp(`/formateur/faq/${id}/supprimer`));
    await prof.post(`/formateur/faq/${id}/supprimer`, {});
    assert.doesNotMatch((await anon().get("/faq")).text, /Deuxième question/);
  });
  test("réservée au formateur", async () => {
    assert.equal((await addFaq(eleve, { question: "x", answer: "y" })).status, 403);
    assert.equal((await eleve.get("/formateur/faq")).status, 403);
    const id = q("SELECT id FROM faqs LIMIT 1")[0].id;
    assert.equal((await eleve.post(`/formateur/faq/${id}/supprimer`, {})).status, 403);
  });
});

describe("FAQ par formation", () => {
  before(async () => {
    await addFaq(prof, { question: "Faut-il un logiciel payant ?", answer: "Non, tout est **gratuit**.", course_id: String(course.id) });
  });
  test("elle s'affiche sur la fiche de cette formation, avec les données structurées", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(html, /<h2>Questions fréquentes<\/h2>/);
    assert.match(html, /<summary[^>]*>Faut-il un logiciel payant \?<\/summary>/);
    assert.match(html, /<strong>gratuit<\/strong>/);
    const blocks = jsonLd(html);
    assert.ok(blocks.some((b) => b["@type"] === "Course") && blocks.some((b) => b["@type"] === "FAQPage"));
  });
  test("elle n'apparaît ni sur une autre formation ni dans la FAQ générale", async () => {
    assert.doesNotMatch((await anon().get(`/cours/${other.slug}`)).text, /Faut-il un logiciel payant|<h2>Questions fréquentes<\/h2>/);
    assert.doesNotMatch((await anon().get("/faq")).text, /Faut-il un logiciel payant/);
  });
  test("gérée depuis une page dédiée à la formation", async () => {
    const r = await prof.get(`/formateur/cours/${course.id}/faq`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Faut-il un logiciel payant/);
    assert.match(r.text, new RegExp(`name="course_id" value="${course.id}"`));
    assert.equal((await prof.get("/formateur/cours/999999/faq")).status, 404);
  });
  test("une question rattachée à une formation inexistante est refusée", async () => {
    assert.equal((await addFaq(prof, { question: "x", answer: "y", course_id: "999999" })).status, 404);
  });
  test("le tableau de bord propose l'accès à la FAQ de chaque formation", async () => {
    assert.match((await prof.get("/formateur")).text, new RegExp(`/formateur/cours/${course.id}/faq`));
  });
});

describe("page Contact", () => {
  test("formulaire accessible, avec un champ piège invisible contre les robots", async () => {
    const r = await anon().get("/contact");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1[^>]*>Contact<\/h1>/);
    for (const name of ["name", "email", "subject", "message"]) {
      assert.match(r.text, new RegExp(`<label[^>]+for="contact-${name}"`));
      assert.match(r.text, new RegExp(`<(?:input|textarea)[^>]+id="contact-${name}"`));
    }
    assert.match(r.text, /name="website"[^>]*tabindex="-1"[^>]*autocomplete="off"|name="website"[^>]*autocomplete="off"[^>]*tabindex="-1"/);
    assert.match(r.text, /aria-hidden="true"/);
  });
  test("un message valide est enregistré, puis un message de confirmation s'affiche", async () => {
    const r = await anon().post("/contact", { name: "Julie Martin", email: "julie@exemple.fr", subject: "Question", message: "Bonjour, j'aimerais des précisions sur la formation." });
    assert.equal(r.status, 302);
    assert.equal(r.location, "/contact?envoye=1");
    const m = q("SELECT * FROM contact_messages")[0];
    assert.deepEqual([m.name, m.email, m.subject], ["Julie Martin", "julie@exemple.fr", "Question"]);
    assert.equal(m.read_at, null);
    assert.match((await anon().get("/contact?envoye=1")).text, /Merci, votre message a bien été envoyé/);
  });
  test("champs invalides : erreur claire, saisie conservée (échappée), rien enregistré", async () => {
    const before = q("SELECT COUNT(*) n FROM contact_messages")[0].n;
    const cases = [
      [{ name: "", email: "a@b.fr", message: "Un message assez long." }, /nom/i],
      [{ name: "A", email: "pas-un-email", message: "Un message assez long." }, /adresse e-mail/i],
      [{ name: "A", email: "a@b.fr", message: "court" }, /message/i],
      [{ name: "A", email: "a@b.fr", message: "x".repeat(5001) }, /message/i],
    ];
    for (const [body, pattern] of cases) {
      const r = await anon().post("/contact", body);
      assert.equal(r.status, 400);
      assert.match(r.text, /<p class="form-error"[^>]*>[^<]*/);
      assert.match(r.text.match(/<p class="form-error"[^>]*>([^<]*)/)[1], pattern);
    }
    const r = await anon().post("/contact", { name: '"><script>alert(1)</script>', email: "pas-un-email", message: "Un message assez long." });
    assert.doesNotMatch(r.text, /<script>alert\(1\)/);
    assert.equal(q("SELECT COUNT(*) n FROM contact_messages")[0].n, before);
  });
  test("champ piège rempli (robot) : réponse « réussie » mais rien n'est enregistré", async () => {
    const before = q("SELECT COUNT(*) n FROM contact_messages")[0].n;
    const r = await anon().post("/contact", { name: "Robot", email: "bot@spam.io", message: "Achetez des montres bon marché maintenant !", website: "http://spam.io" });
    assert.equal(r.status, 302);
    assert.equal(q("SELECT COUNT(*) n FROM contact_messages")[0].n, before);
  });
  test("les retours à la ligne sont retirés du nom, de l'email et du sujet (pas d'injection d'en-têtes d'email)", async () => {
    await anon().post("/contact", { name: "Pierre\r\nBcc: x@y.z", email: "p@q.fr", subject: "Sujet\r\nBcc: evil@y.z", message: "Un message assez long pour passer." });
    const m = q("SELECT * FROM contact_messages ORDER BY id DESC")[0];
    assert.doesNotMatch(m.name + m.subject, /[\r\n]/);
  });
  test("sans messagerie configurée, l'envoi ne plante pas", async () => {
    const r = await anon().post("/contact", { name: "Sans SMTP", email: "s@t.fr", message: "Ce message doit être enregistré sans erreur." });
    assert.equal(r.status, 302);
    assert.equal(q("SELECT COUNT(*) n FROM contact_messages WHERE name = 'Sans SMTP'")[0].n, 1);
  });
});

describe("messages reçus (administration)", () => {
  before(async () => {
    await anon().post("/contact", { name: "<b>Gras</b>", email: "g@h.fr", subject: "<script>x</script>", message: "Message avec <i>balises</i> à neutraliser complètement." });
  });
  test("liste des messages, contenu neutralisé, non lus signalés", async () => {
    const html = (await prof.get("/formateur/messages")).text;
    assert.match(html, /Julie Martin/);
    assert.doesNotMatch(html, /<b>Gras<\/b>|<script>x<\/script>|<i>balises/);
    assert.match(html, /&lt;b&gt;Gras/);
    assert.match(html, /Non lu/);
  });
  test("le tableau de bord indique le nombre de messages non lus", async () => {
    const n = q("SELECT COUNT(*) n FROM contact_messages WHERE read_at IS NULL")[0].n;
    assert.match((await prof.get("/formateur")).text, new RegExp(`Messages[^<]*\\(${n}\\)|Messages \\(${n}\\)`));
  });
  test("marquer comme lu, puis supprimer", async () => {
    const id = q("SELECT id FROM contact_messages WHERE name = 'Julie Martin'")[0].id;
    await prof.post(`/formateur/messages/${id}/lu`, {});
    assert.notEqual(q("SELECT read_at FROM contact_messages WHERE id = ?", id)[0].read_at, null);
    await prof.post(`/formateur/messages/${id}/supprimer`, {});
    assert.equal(q("SELECT COUNT(*) n FROM contact_messages WHERE id = ?", id)[0].n, 0);
  });
  test("réservés au formateur", async () => {
    assert.equal((await eleve.get("/formateur/messages")).status, 403);
    assert.equal((await anon().get("/formateur/messages")).status, 302);
    const id = q("SELECT id FROM contact_messages LIMIT 1")[0].id;
    assert.equal((await eleve.post(`/formateur/messages/${id}/supprimer`, {})).status, 403);
  });
});

describe("protection contre l'envoi massif", () => {
  test("au plus 5 messages par heure et par adresse IP (le 6e reçoit 429)", async () => {
    const s2 = await startServer();
    try {
      const c = new Client(s2.base);
      for (let i = 0; i < 5; i++) {
        assert.equal((await c.post("/contact", { name: `N${i}`, email: "a@b.fr", message: "Un message suffisamment long." })).status, 302, `message ${i + 1}`);
      }
      const r = await c.post("/contact", { name: "N6", email: "a@b.fr", message: "Un message suffisamment long." });
      assert.equal(r.status, 429);
      assert.match(r.text, /Trop de messages/);
      const db = s2.db();
      assert.equal(db.prepare("SELECT COUNT(*) n FROM contact_messages").get().n, 5);
      db.close();
    } finally {
      await s2.stop();
    }
  });
});

describe("liens et référencement", () => {
  test("pied de page : À propos, FAQ, Contact", async () => {
    const html = (await anon().get("/")).text;
    for (const p of ["/a-propos", "/faq", "/contact"]) assert.match(html, new RegExp(`<footer[\\s\\S]*href="${p}"`));
  });
  test("sitemap : les trois pages", async () => {
    const sm = (await anon().get("/sitemap.xml")).text;
    for (const p of ["/a-propos", "/faq", "/contact"]) assert.match(sm, new RegExp(`<loc>[^<]*${p}</loc>`));
  });
  test("chaque page a un titre, une description et un seul H1", async () => {
    for (const [url, title] of [["/a-propos", "À propos"], ["/faq", "Questions fréquentes"], ["/contact", "Contact"]]) {
      const html = (await anon().get(url)).text;
      assert.match(html, new RegExp(`<title>[^<]*${title}[^<]* · KOYEKOLA</title>`));
      assert.match(html, /<meta name="description" content="[^"]{20,}"/);
      assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    }
  });
});
