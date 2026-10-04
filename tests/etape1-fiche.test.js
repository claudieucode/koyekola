// Étape 1a : fiche formation enrichie (prérequis, public visé, compétences, vidéo de présentation,
// description en Markdown) et archivage à la place de la suppression.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof;
before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
});
after(() => srv.stop());
const anon = () => new Client(srv.base);
const row = (sql, ...args) => {
  const db = srv.db();
  const r = db.prepare(sql).get(...args);
  db.close();
  return r;
};

describe("fiche formation enrichie", () => {
  let course;
  before(async () => {
    course = await createCourse(prof, srv, {
      title: "Fiche riche",
      price: 25,
      lessons: [{ title: "L1", preview: true }],
      extra: {
        description: "## Pour qui ?\nUne formation **complète** et pratique.\n\n<script>alert(1)</script>",
        objectives: "Maîtriser les bases",
        prerequisites: "Savoir utiliser un ordinateur\nAvoir un compte gratuit",
        target_audience: "Débutants complets\nReconversions",
        skills: "Monter une vidéo\nExporter en 4K",
        intro_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    });
  });

  test("les champs sont enregistrés", () => {
    const c = row("SELECT prerequisites, target_audience, skills, intro_video FROM courses WHERE id = ?", course.id);
    assert.equal(c.prerequisites, "Savoir utiliser un ordinateur\nAvoir un compte gratuit");
    assert.equal(c.target_audience, "Débutants complets\nReconversions");
    assert.equal(c.skills, "Monter une vidéo\nExporter en 4K");
    assert.match(c.intro_video, /youtube/);
  });
  test("la fiche affiche prérequis, public visé et compétences sous forme de listes", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    // chaque élément peut porter une icône ou un badge : on accepte des balises à l'intérieur de <li>
    assert.match(html, /<h2>Prérequis<\/h2>[\s\S]*<li[^>]*>[\s\S]*?Savoir utiliser un ordinateur/);
    assert.match(html, /<h2[^>]*>À qui s'adresse cette formation \?<\/h2>[\s\S]*<h3 class="audience-title">Débutants complets<\/h3>/); // un profil = une carte avec son titre
    assert.match(html, /<h2>Compétences acquises<\/h2>[\s\S]*<li[^>]*>[\s\S]*?Exporter en 4K/);
    assert.match(html, /<h2>Ce que vous apprendrez<\/h2>/);
  });
  test("la description est mise en forme (Markdown) et le HTML saisi est neutralisé", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(html, /<h3>Pour qui \?<\/h3>/);
    assert.match(html, /<strong>complète<\/strong>/);
    assert.doesNotMatch(html, /<script>alert\(1\)/);
    assert.match(html, /&lt;script&gt;/);
  });
  test("la vidéo de présentation est intégrée sur la fiche", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(html, /<iframe[^>]+youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  });
  test("le formulaire de modification réaffiche les valeurs saisies", async () => {
    const html = (await prof.get(`/formateur/cours/${course.id}/modifier`)).text;
    assert.match(html, /Savoir utiliser un ordinateur/);
    assert.match(html, /Débutants complets/);
    assert.match(html, /name="intro_video"[^>]*value="https:\/\/www\.youtube\.com/);
  });
  test("une formation sans ces champs n'affiche pas de sections vides", async () => {
    const vide = await createCourse(prof, srv, { title: "Fiche vide", price: 0 });
    const html = (await anon().get(`/cours/${vide.slug}`)).text;
    // Les prérequis s'affichent toujours, avec un message clair quand il n'y en a pas (plus de liste vide)
    assert.match(html, /<h2>Prérequis<\/h2>[\s\S]*Aucun prérequis particulier/);
    assert.doesNotMatch(html.slice(html.indexOf("<h2>Prérequis</h2>"), html.indexOf("<h2>Description</h2>")), /<li/);
    assert.doesNotMatch(html, /<h2>Compétences acquises<\/h2>/);
    assert.doesNotMatch(html, /<h2>À qui s'adresse cette formation \?<\/h2>/);
    assert.doesNotMatch(html, /<iframe/);
  });
  test("un lien de présentation dangereux (javascript:) n'est jamais enregistré", async () => {
    const c = await createCourse(prof, srv, { title: "Présentation piégée", price: 0, extra: { intro_video: "javascript:alert(1)" } });
    assert.ok(!row("SELECT intro_video FROM courses WHERE id = ?", c.id).intro_video);
  });
  test("modifier la formation conserve et met à jour les champs", async () => {
    await prof.post(`/formateur/cours/${course.id}/modifier`, {
      title: "Fiche riche",
      category: "Test",
      level: "debutant",
      price: "25",
      description: "nouveau",
      prerequisites: "Un seul prérequis",
    });
    const c = row("SELECT prerequisites, target_audience FROM courses WHERE id = ?", course.id);
    assert.equal(c.prerequisites, "Un seul prérequis");
    assert.equal(c.target_audience, "", "un champ vidé dans le formulaire est bien vidé");
  });
});

describe("archivage (à la place de la suppression)", () => {
  let course, eleve;
  before(async () => {
    course = await createCourse(prof, srv, { title: "À archiver", price: 30, lessons: [{ title: "L", preview: true }] });
    eleve = await newStudent(srv);
    await buy(eleve, course);
    await prof.post(`/formateur/cours/${course.id}/archiver`, {});
  });

  test("archiver dépublie et marque la formation", () => {
    const c = row("SELECT published, archived FROM courses WHERE id = ?", course.id);
    assert.equal(c.published, 0);
    assert.equal(c.archived, 1);
  });
  test("elle disparaît du catalogue et de la fiche publique", async () => {
    assert.doesNotMatch((await anon().get("/catalogue")).text, /À archiver/);
    assert.equal((await anon().get(`/cours/${course.slug}`)).status, 404);
  });
  test("les étudiants qui l'ont achetée gardent leur accès", async () => {
    assert.equal((await eleve.get(`/apprendre/${course.slug}`)).status, 302);
    assert.match((await eleve.get("/mes-cours")).text, /À archiver/);
  });
  test("elle ne peut plus être achetée", async () => {
    const autre = await newStudent(srv);
    await autre.post(`/panier/ajouter/${course.id}`, {});
    await autre.post("/commande", {});
    assert.equal(row("SELECT COUNT(*) n FROM enrollments WHERE course_id = ?", course.id).n, 1);
  });
  test("l'espace la range dans le filtre « Archivées »", async () => {
    assert.match((await prof.get("/formateur/formations")).text, /href="\/formateur\/formations\?statut=archivees"/);
    const html = (await prof.get("/formateur/formations?statut=archivees")).text;
    assert.match(html, /Archivée/);
    assert.match(html, /À archiver/);
    assert.match(html, new RegExp(`/formateur/cours/${course.id}/restaurer`));
  });
  test("publier une formation archivée ne fait rien", async () => {
    await prof.post(`/formateur/cours/${course.id}/publier`, {});
    assert.equal(row("SELECT published FROM courses WHERE id = ?", course.id).published, 0);
  });
  test("restaurer la remet en brouillon (jamais publiée d'office)", async () => {
    await prof.post(`/formateur/cours/${course.id}/restaurer`, {});
    const c = row("SELECT published, archived FROM courses WHERE id = ?", course.id);
    assert.equal(c.archived, 0);
    assert.equal(c.published, 0);
  });
  test("un étudiant ne peut pas archiver une formation", async () => {
    const r = await eleve.post(`/formateur/cours/${course.id}/archiver`, {});
    assert.equal(r.status, 403);
  });
});
