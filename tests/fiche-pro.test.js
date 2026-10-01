// Page de détail d'une formation : structure professionnelle (résumé, contenu, formateur, avis, similaires).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy, INSTRUCTOR } = require("./helpers");

let srv, prof, eleve, course;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const run = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).run(...a);
  db.close();
  return r;
};
const flat = (html) => html.replace(/\s+/g, " ");
const page = async (client, slug, query = "") => flat((await client.get(`/cours/${slug}${query}`)).text);
const pos = (html, needle) => html.indexOf(needle);

// Insère des avis réels (élèves inscrits) directement en base : plus rapide que 12 achats
function addReviews(courseId, ratings) {
  const db = srv.db();
  ratings.forEach((rating, i) => {
    const email = `avis${courseId}-${i}-${Date.now()}@ex.fr`;
    const uid = Number(db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, 'x', 'etudiant')").run(`Élève${courseId}_${i}`, email).lastInsertRowid);
    db.prepare("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)").run(uid, courseId);
    db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment, created_at) VALUES (?, ?, ?, ?, datetime('now', ?))").run(courseId, uid, rating, `Commentaire numéro ${i + 1}`, `-${i} minutes`);
  });
  db.close();
}

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  eleve = await newStudent(srv);
  course = await createCourse(prof, srv, {
    title: "Formation vitrine",
    price: 40,
    lessons: [{ title: "Bienvenue", preview: true }, { title: "Lecture sans vidéo" }, { title: "Vidéo en ligne", videoUrl: "https://www.youtube.com/watch?v=abc123def45" }, { title: "Quiz final" }],
    extra: {
      subtitle: "Maîtrisez l'essentiel en quelques heures", level: "intermediaire",
      objectives: "<ul><li><p>Objectif A</p></li><li><p>Objectif B</p></li></ul>", prerequisites: "<p>Un ordinateur</p>", target_audience: "<p>Débutants</p><p>Freelances</p>", skills: "<p>Compétence X</p><p>Compétence Y</p>",
      rich_text: "1", description: "<h2>Présentation</h2><p>Un <strong>long</strong> texte.</p>",
    },
  });
  await prof.post(`/formateur/lecons/${course.lessons[3].id}/quiz`, {});
  await buy(eleve, course);
});
after(() => srv.stop());

describe("résumé de la formation", () => {
  test("bloc de résumé avec titre, promesse, note, avis, inscrits, durée, sous-chapitres, niveau et langue réels", async () => {
    addReviews(course.id, [5, 4]);
    const html = await page(anon(), course.slug);
    const box = html.slice(pos(html, 'class="course-summary"'), pos(html, 'id="apprendre"'));
    assert.match(box, /Formation vitrine/);
    assert.match(box, /Maîtrisez l'essentiel en quelques heures|Maîtrisez l&#39;essentiel en quelques heures/);
    assert.match(box, /4\.5/);
    assert.match(box, /2 avis/);
    assert.match(box, /20 min/);
    assert.match(box, /<strong>4<\/strong> <span>sous-chapitres<\/span>/);
    assert.match(box, /Intermédiaire/);
    assert.match(box, /Français/);
  });
  test("le nombre d'inscrits suit les données réelles", async () => {
    const real = q("SELECT COUNT(*) n FROM enrollments WHERE course_id = ?", course.id)[0].n;
    assert.match(await page(anon(), course.slug), new RegExp(`class="course-summary"[\\s\\S]*?<strong>${real}</strong> <span>inscrit`));
  });
  test("le résumé est juste après la vidéo de présentation / la zone principale et avant « Ce que vous apprendrez »", async () => {
    const html = await page(anon(), course.slug);
    assert.ok(pos(html, 'class="course-summary"') > pos(html, 'class="course-hero"'));
    assert.ok(pos(html, 'class="course-summary"') < pos(html, 'id="apprendre"'));
  });
  test("formation sans avis, sans sous-titre : pas d'erreur, texte honnête, promesse tirée de la description", async () => {
    const c = await createCourse(prof, srv, { title: "Sans avis", price: 0, extra: { description: "Une description qui sert de promesse quand il n'y a pas de sous-titre." } });
    const html = await page(anon(), c.slug);
    assert.match(html, /class="course-summary"[\s\S]*Pas encore d'avis/);
    assert.match(html, /class="course-summary"[\s\S]*Une description qui sert de promesse/);
  });
});

describe("ordre des blocs demandé", () => {
  test("résumé → apprendre → contenu → prérequis → public → compétences → description → formateur → avis → similaires", async () => {
    const other = await createCourse(prof, srv, { title: "Autre de la même catégorie", price: 10 });
    const html = await page(anon(), course.slug);
    const ids = ['class="course-summary"', 'id="apprendre"', 'id="contenu"', 'id="prerequis"', 'id="public"', 'id="competences"', 'id="description"', 'id="formateur"', 'id="avis"', 'id="similaires"'];
    const at = ids.map((i) => pos(html, i));
    assert.ok(at.every((p, i) => p >= 0 && (i === 0 || p > at[i - 1])), `positions : ${JSON.stringify(Object.fromEntries(ids.map((k, i) => [k, at[i]])))}`);
    assert.ok(other.id);
  });
  test("titres exacts", async () => {
    const html = await page(anon(), course.slug);
    for (const h of ["Ce que vous apprendrez", "Contenu du cours", "Prérequis", "À qui s'adresse cette formation ?", "Compétences acquises", "Description", "Votre formateur", "Avis des étudiants", "Vous pourriez également aimer"]) {
      assert.match(html, new RegExp(`<h2[^>]*>${h.replace(/[?']/g, (m) => (m === "'" ? "(?:'|&#39;)" : "\\?"))}</h2>`), h);
    }
  });
  test("tout l'existant est conservé : vidéo, FAQ, favoris, plan du cours, formulaire d'avis, carte d'achat", async () => {
    await prof.post("/formateur/faq/ajouter", { question: "Une question ?", answer: "Une réponse.", course_id: String(course.id) });
    const html = await page(eleve, course.slug);
    assert.match(html, /id="faq"/);
    assert.match(html, /Ajouter aux favoris/);
    assert.match(html, /data-plan-url/);
    assert.match(html, /Publier mon avis|Modifier mon avis/);
    assert.match(html, /purchase-card/);
    assert.match(html, /Continuer la formation/);
  });
});

describe("ce que vous apprendrez, prérequis, public, compétences", () => {
  test("objectifs en grille, un par élément, issus des données de la formation", async () => {
    const html = await page(anon(), course.slug);
    const block = html.slice(pos(html, 'id="apprendre"'), pos(html, 'id="contenu"'));
    assert.match(block, /class="objectives-list"/);
    assert.equal((block.match(/<li>/g) || []).length, 2);
    assert.match(block, /Objectif A/);
  });
  test("compétences en badges", async () => {
    const html = await page(anon(), course.slug);
    const block = html.slice(pos(html, 'id="competences"'), pos(html, 'id="description"'));
    assert.equal((block.match(/class="skill-chip"/g) || []).length, 2);
    assert.match(block, /Compétence X/);
  });
  test("aucun prérequis : message propre ; objectifs, public et compétences vides : blocs masqués sans erreur", async () => {
    const c = await createCourse(prof, srv, { title: "Sans détails", price: 0 });
    const res = await anon().get(`/cours/${c.slug}`);
    assert.equal(res.status, 200);
    const html = flat(res.text);
    assert.match(html, /id="prerequis"[\s\S]*Aucun prérequis particulier n'est nécessaire|id="prerequis"[\s\S]*Aucun prérequis particulier n&#39;est nécessaire/);
    for (const id of ["apprendre", "public", "competences"]) assert.doesNotMatch(html, new RegExp(`id="${id}"`), id);
  });
  test("la formation à l'ancien format (Markdown) s'affiche aussi", async () => {
    const c = await createCourse(prof, srv, { title: "Ancien format", price: 0, extra: { objectives: "Un\nDeux", prerequisites: "Un PC", skills: "Savoir A\nSavoir B" } });
    const html = await page(anon(), c.slug);
    assert.match(html, /id="apprendre"[\s\S]*Un[\s\S]*Deux/);
    assert.equal((html.match(/class="skill-chip"/g) || []).length, 2);
  });
});

describe("contenu du cours", () => {
  test("titre, décompte des chapitres, des sous-chapitres et durée totale", async () => {
    const html = await page(anon(), course.slug);
    const block = html.slice(pos(html, 'id="contenu"'), pos(html, 'id="prerequis"'));
    assert.match(block, /1 chapitre · 4 sous-chapitres · 20 min/);
  });
  test("chaque chapitre est dépliable et indique son nombre de sous-chapitres et sa durée", async () => {
    const html = await page(anon(), course.slug);
    assert.match(html, /class="accordion-toggle"[^>]*aria-expanded="(?:true|false)"[^>]*aria-controls="section-\d+"/);
    assert.match(html, /class="section-meta">4 sous-chapitres · 20 min</);
  });
  test("type de chaque sous-chapitre : vidéo, texte ou quiz, avec durée", async () => {
    const html = await page(anon(), course.slug);
    const types = Object.fromEntries([...html.matchAll(/data-lesson-type="(\w+)"[^>]*>[\s\S]*?class="lesson-title">[\s\S]*?(Bienvenue|Lecture sans vidéo|Vidéo en ligne|Quiz final)/g)].map((m) => [m[2], m[1]]));
    assert.equal(types["Vidéo en ligne"], "video");
    assert.equal(types["Lecture sans vidéo"], "texte");
    assert.equal(types["Quiz final"], "quiz");
    assert.match(html, /class="lesson-type">Quiz</);
    assert.match(html, /class="lesson-type">Texte</);
    assert.match(html, /class="lesson-duration">5 min</);
  });
  test("visiteur : pas de progression ; aperçus gratuits et verrous inchangés", async () => {
    const html = await page(anon(), course.slug);
    assert.doesNotMatch(html, /course-progress|is-done/);
    assert.match(html, /Aperçu gratuit/);
  });
  test("élève inscrit : sa progression réelle (barre et coches) apparaît dans le contenu", async () => {
    let html = await page(eleve, course.slug);
    assert.match(html, /class="course-progress"[\s\S]*0 \/ 4 terminés/);
    await eleve.post(`/apprendre/lecon/${course.lessons[0].id}/terminer`, {});
    await eleve.post(`/apprendre/lecon/${course.lessons[1].id}/terminer`, {});
    html = await page(eleve, course.slug);
    assert.match(html, /2 \/ 4 terminés/);
    assert.match(html, /role="progressbar"[^>]*aria-valuenow="50"/);
    assert.equal((html.match(/lesson-row[^"]*is-done/g) || []).length, 2);
    const doneRow = html.match(/<div class="lesson-row[^"]*is-done[^>]*>[\s\S]*?<\/div>/)[0];
    assert.match(doneRow, /Terminé/);
  });
  test("la progression d'un autre élève n'apparaît pas", async () => {
    const autre = await newStudent(srv);
    await buy(autre, course);
    assert.match(await page(autre, course.slug), /0 \/ 4 terminés/);
  });
  test("formateur propriétaire : pas de barre de progression", async () => {
    assert.doesNotMatch(await page(prof, course.slug), /class="course-progress"/);
  });
  test("grosse formation (15 chapitres, 150 sous-chapitres) : tout est présent, page rapide", async () => {
    const c = await createCourse(prof, srv, { title: "Très grosse formation", price: 0, lessons: [], publish: false });
    const db = srv.db();
    const insSec = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)");
    const insLes = db.prepare("INSERT INTO lessons (section_id, title, duration_minutes, position) VALUES (?, ?, 3, ?)");
    for (let i = 0; i < 15; i++) {
      const sid = Number(insSec.run(c.id, `Chapitre géant ${i + 1}`, i + 1).lastInsertRowid);
      for (let j = 0; j < 10; j++) insLes.run(sid, `Sous-chapitre ${i + 1}.${j + 1}`, j);
    }
    db.close();
    await prof.post(`/formateur/cours/${c.id}/publier`, {});
    const t0 = Date.now();
    const res = await anon().get(`/cours/${c.slug}`);
    const ms = Date.now() - t0;
    const html = flat(res.text);
    assert.equal(res.status, 200);
    assert.equal((html.match(/class="accordion-item/g) || []).length, 16); // 15 + le chapitre vide créé par défaut
    assert.match(html, /Sous-chapitre 15\.10/);
    assert.match(html, /16 chapitres · 150 sous-chapitres · 7 h 30/);
    assert.match(html, /id="toggleAllSections"/, "« Tout déplier » avec plusieurs chapitres");
    assert.ok(ms < 2000, `temps : ${ms} ms`);
  });
});

describe("description", () => {
  test("texte riche affiché en entier, sans troncature", async () => {
    const long = "<h2>Longue</h2>" + Array.from({ length: 60 }, (_, i) => `<p>Paragraphe ${i + 1} avec <em>italique</em> et <a href="https://exemple.fr">lien</a>.</p>`).join("") + "<blockquote><p>Une citation</p></blockquote><ol><li><p>Un</p></li></ol>";
    const c = await createCourse(prof, srv, { title: "Description longue", price: 0, extra: { rich_text: "1", description: long } });
    const html = await page(anon(), c.slug);
    const block = html.slice(pos(html, 'id="description"'), pos(html, 'id="formateur"'));
    assert.match(block, /Paragraphe 60 /);
    assert.match(block, /<blockquote>/);
    assert.match(block, /<ol>/);
    assert.match(block, /<em>italique<\/em>/);
    assert.doesNotMatch(block, /Lire la suite|Voir plus|\.\.\.\s*<\/p>/);
  });
});

describe("formateur", () => {
  test("nom, biographie, nombre de formations, d'étudiants et note moyenne réels", async () => {
    run("UPDATE users SET bio = ? WHERE email = ?", "Formatrice depuis dix ans, passionnée de pédagogie.", INSTRUCTOR.email);
    const html = await page(anon(), course.slug);
    const block = html.slice(pos(html, 'id="formateur"'), pos(html, 'id="avis"'));
    assert.match(block, new RegExp(INSTRUCTOR.username || "claire"));
    assert.match(block, /Formatrice depuis dix ans/);
    const courses = q("SELECT COUNT(*) n FROM courses WHERE published = 1 AND archived = 0 AND instructor_id = (SELECT instructor_id FROM courses WHERE id = ?)", course.id)[0].n;
    assert.match(block, new RegExp(`<strong>${courses}</strong> formation${courses > 1 ? "s" : ""}`));
    const students = q("SELECT COUNT(*) n FROM enrollments WHERE course_id IN (SELECT id FROM courses WHERE instructor_id = (SELECT instructor_id FROM courses WHERE id = ?))", course.id)[0].n;
    assert.match(block, new RegExp(`<strong>${students}</strong> étudiant`));
    assert.match(block, /Note moyenne|★|4\.\d/);
  });
  test("sans photo : initiale colorée ; sans bio : pas de paragraphe vide", async () => {
    run("UPDATE users SET bio = '', avatar_path = NULL WHERE email = ?", INSTRUCTOR.email);
    const html = await page(anon(), course.slug);
    const block = html.slice(pos(html, 'id="formateur"'), pos(html, 'id="avis"'));
    assert.match(block, /class="avatar avatar-lg"/);
    assert.doesNotMatch(block, /class="instructor-bio"/);
  });
  test("avec photo : l'image du formateur est affichée", async () => {
    run("UPDATE users SET avatar_path = ? WHERE email = ?", "/uploads/thumbnails/photo-test.png", INSTRUCTOR.email);
    const block = (() => null)();
    const html = await page(anon(), course.slug);
    assert.match(html.slice(pos(html, 'id="formateur"'), pos(html, 'id="avis"')), /<img[^>]+src="\/uploads\/thumbnails\/photo-test\.png"[^>]+alt="Photo de/);
    assert.equal(block, null);
    run("UPDATE users SET avatar_path = NULL WHERE email = ?", INSTRUCTOR.email);
  });
});

describe("avis", () => {
  let c;
  before(async () => {
    c = await createCourse(prof, srv, { title: "Beaucoup d'avis", price: 0 });
    addReviews(c.id, [5, 5, 5, 4, 4, 3, 2, 1, 5, 4, 5, 3]);
  });
  test("note moyenne, total et répartition par étoile (5 lignes avec le nombre réel)", async () => {
    const html = await page(anon(), c.slug);
    const block = html.slice(pos(html, 'id="avis"'), pos(html, 'id="similaires"') > 0 ? pos(html, 'id="similaires"') : undefined);
    const avg = (5 + 5 + 5 + 4 + 4 + 3 + 2 + 1 + 5 + 4 + 5 + 3) / 12;
    assert.match(block, new RegExp(avg.toFixed(1).replace(".", "\\.")));
    assert.match(block, /12 avis/);
    const rows = [...block.matchAll(/class="rating-row" data-stars="(\d)"[\s\S]*?class="rating-count">(\d+)</g)].map((m) => [Number(m[1]), Number(m[2])]);
    assert.deepEqual(rows, [[5, 5], [4, 3], [3, 2], [2, 1], [1, 1]]);
    assert.match(block, /role="progressbar"[^>]*aria-valuenow="\d+"[^>]*aria-label="\d étoiles?/);
  });
  test("5 avis affichés d'abord, avec nom, date, note et commentaire ; lien « Voir plus d'avis »", async () => {
    const html = await page(anon(), c.slug);
    assert.equal((html.match(/class="review-item"/g) || []).length, 5);
    assert.match(html, /Commentaire numéro 1\b/);
    assert.match(html, /<a[^>]+href="\/cours\/[^"]+\?avis=10#avis"[^>]*data-more-reviews[^>]*>Voir plus d'avis|<a[^>]+data-more-reviews[^>]+href="[^"]*\?avis=10#avis"/);
  });
  test("« Voir plus » charge 5 avis de plus, puis le lien disparaît quand tout est affiché", async () => {
    let html = await page(anon(), c.slug, "?avis=10");
    assert.equal((html.match(/class="review-item"/g) || []).length, 10);
    assert.match(html, /avis=15/);
    html = await page(anon(), c.slug, "?avis=15");
    assert.equal((html.match(/class="review-item"/g) || []).length, 12);
    assert.doesNotMatch(html, /data-more-reviews/);
  });
  test("paramètre invalide : retour aux 5 premiers, aucune erreur", async () => {
    for (const bad of ["abc", "-5", "0", "99999999", "1e9", "5;drop"]) {
      const res = await anon().get(`/cours/${c.slug}?avis=${bad}`);
      assert.equal(res.status, 200, bad);
      const n = (res.text.match(/class="review-item"/g) || []).length;
      assert.ok(n >= 5 && n <= 12, `${bad} → ${n}`);
    }
  });
  test("aucun avis : message clair, pas de répartition inventée", async () => {
    const empty = await createCourse(prof, srv, { title: "Zéro avis", price: 0 });
    const html = await page(anon(), empty.slug);
    assert.match(html, /Aucun avis pour le moment/);
    assert.doesNotMatch(html, /class="rating-row"/);
  });
});

describe("formations similaires", () => {
  test("même catégorie d'abord, sans la formation elle-même, sans brouillons ni archivées", async () => {
    const same = await createCourse(prof, srv, { title: "Sœur de catégorie", price: 15, extra: { category: "Photographie" } });
    const twin = await createCourse(prof, srv, { title: "Jumelle de catégorie", price: 15, extra: { category: "Photographie" } });
    const draft = await createCourse(prof, srv, { title: "Brouillon photo", price: 15, extra: { category: "Photographie" }, publish: false });
    const archived = await createCourse(prof, srv, { title: "Archivée photo", price: 15, extra: { category: "Photographie" } });
    await prof.post(`/formateur/cours/${archived.id}/archiver`, {});
    const html = await page(anon(), same.slug);
    const block = html.slice(pos(html, 'id="similaires"'));
    assert.match(block, /Jumelle de catégorie/);
    assert.doesNotMatch(block, /Sœur de catégorie/);
    assert.doesNotMatch(block, /Brouillon photo|Archivée photo/);
    assert.ok(twin.id && draft.id);
  });
  test("cartes réutilisées : miniature, titre, formateur, note, inscrits, durée, prix", async () => {
    const html = await page(anon(), course.slug);
    const block = html.slice(pos(html, 'id="similaires"'));
    assert.match(block, /class="course-card"/);
    assert.match(block, /class="course-title"/);
    assert.match(block, /class="course-instructor"/);
    assert.match(block, /class="course-price/);
    assert.ok((block.match(/class="course-card"/g) || []).length <= 4);
  });
  test("aucune autre formation publiée : la section n'apparaît pas", async () => {
    const solo = await startServer();
    try {
      const p = await loginInstructor(solo);
      const only = await createCourse(p, solo, { title: "Toute seule", price: 5 });
      const html = flat((await new Client(solo.base).get(`/cours/${only.slug}`)).text);
      assert.doesNotMatch(html, /id="similaires"/);
    } finally {
      solo.stop();
    }
  });
});

describe("langue de la formation", () => {
  test("colonne courses.language (défaut « fr ») et users.avatar_path", () => {
    const cols = q("PRAGMA table_info(courses)").map((c) => c.name);
    assert.ok(cols.includes("language"));
    assert.ok(q("PRAGMA table_info(users)").map((c) => c.name).includes("avatar_path"));
    assert.equal(q("SELECT language FROM courses WHERE id = ?", course.id)[0].language, "fr");
  });
  test("le formulaire propose la langue ; elle est enregistrée puis affichée", async () => {
    const form = (await prof.get(`/formateur/cours/${course.id}/modifier`)).text;
    assert.match(form, /<select[^>]+name="language"/);
    assert.match(form, /<option value="fr" selected>Français<\/option>/);
    const fd = new FormData();
    Object.entries({ title: "Formation vitrine", category: "Test", level: "intermediaire", price: "40", rich_text: "1", description: "<p>x</p>", language: "en" }).forEach(([k, v]) => fd.append(k, v));
    await prof.request(`/formateur/cours/${course.id}/modifier`, { method: "POST", multipart: fd });
    assert.equal(q("SELECT language FROM courses WHERE id = ?", course.id)[0].language, "en");
    assert.match(await page(anon(), course.slug), /class="course-summary"[\s\S]*Anglais/);
    assert.match(await page(anon(), course.slug), /"inLanguage":"en"/);
  });
  test("langue inconnue refusée : retour à « fr »", async () => {
    const fd = new FormData();
    Object.entries({ title: "Formation vitrine", category: "Test", level: "intermediaire", price: "40", rich_text: "1", description: "<p>x</p>", language: "klingon" }).forEach(([k, v]) => fd.append(k, v));
    await prof.request(`/formateur/cours/${course.id}/modifier`, { method: "POST", multipart: fd });
    assert.equal(q("SELECT language FROM courses WHERE id = ?", course.id)[0].language, "fr");
  });
  test("dupliquer copie la langue", async () => {
    run("UPDATE courses SET language = 'es' WHERE id = ?", course.id);
    await prof.post(`/formateur/cours/${course.id}/dupliquer`, {});
    assert.equal(q("SELECT language FROM courses WHERE title LIKE 'Formation vitrine%' AND id != ? ORDER BY id DESC", course.id)[0].language, "es");
    run("UPDATE courses SET language = 'fr' WHERE id = ?", course.id);
  });
});

describe("Mon profil (biographie et photo du formateur)", () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const send = (client, fields, file) => {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("thumbnail", new Blob([file.data], { type: file.type }), file.name);
    return client.request("/formateur/profil", { method: "POST", multipart: fd });
  };
  test("page accessible au formateur, refusée aux élèves et aux visiteurs", async () => {
    assert.equal((await prof.get("/formateur/profil")).status, 200);
    assert.equal((await eleve.get("/formateur/profil")).status, 403);
    assert.equal((await anon().get("/formateur/profil")).status, 302);
    assert.equal((await send(eleve, { bio: "x" })).status, 403);
  });
  test("le tableau de bord propose « Mon profil »", async () => {
    assert.match((await prof.get("/formateur")).text, /href="\/formateur\/profil"/);
  });
  test("biographie enregistrée (limitée à 600 caractères) puis affichée sur la fiche", async () => {
    await send(prof, { bio: "Ma nouvelle biographie de formateur. ".repeat(40) });
    const bio = q("SELECT bio FROM users WHERE email = ?", INSTRUCTOR.email)[0].bio;
    assert.ok(bio.length <= 600 && bio.startsWith("Ma nouvelle biographie"));
    assert.match(await page(anon(), course.slug), /class="instructor-bio">Ma nouvelle biographie/);
  });
  test("photo : image acceptée (extension imposée), affichée sur la fiche ; SVG et HTML refusés", async () => {
    const r = await send(prof, { bio: "Bio" }, { data: png, type: "image/png", name: "evil.html" });
    assert.equal(r.status, 302);
    const avatar = q("SELECT avatar_path FROM users WHERE email = ?", INSTRUCTOR.email)[0].avatar_path;
    assert.match(avatar, /^\/uploads\/thumbnails\/.+\.png$/);
    assert.ok(fs.existsSync(path.join(srv.dir, "uploads", avatar.replace("/uploads/", ""))));
    assert.match(await page(anon(), course.slug), new RegExp(`<img[^>]+src="${avatar.replace(/[.\\/]/g, "\\$&")}"`));
    const bad = await send(prof, { bio: "Bio" }, { data: Buffer.from("<svg onload=alert(1)/>"), type: "image/svg+xml", name: "a.svg" });
    assert.equal(bad.status, 400);
    assert.equal(q("SELECT avatar_path FROM users WHERE email = ?", INSTRUCTOR.email)[0].avatar_path, avatar, "l'ancienne photo est conservée");
  });
  test("remplacer la photo efface l'ancienne du disque ; « retirer la photo » aussi", async () => {
    const old = q("SELECT avatar_path FROM users WHERE email = ?", INSTRUCTOR.email)[0].avatar_path;
    await send(prof, { bio: "Bio" }, { data: png, type: "image/png", name: "n.png" });
    const fresh = q("SELECT avatar_path FROM users WHERE email = ?", INSTRUCTOR.email)[0].avatar_path;
    assert.notEqual(fresh, old);
    assert.equal(fs.existsSync(path.join(srv.dir, "uploads", old.replace("/uploads/", ""))), false);
    await send(prof, { bio: "Bio", remove_avatar: "1" });
    assert.equal(q("SELECT avatar_path FROM users WHERE email = ?", INSTRUCTOR.email)[0].avatar_path, null);
    assert.equal(fs.existsSync(path.join(srv.dir, "uploads", fresh.replace("/uploads/", ""))), false);
  });
  test("un profil sans biographie s'enregistre sans erreur", async () => {
    const r = await send(prof, { bio: "   " });
    assert.equal(r.status, 302);
    assert.equal(q("SELECT bio FROM users WHERE email = ?", INSTRUCTOR.email)[0].bio, "");
  });
  test("le contenu de la biographie est neutralisé à l'affichage", async () => {
    await send(prof, { bio: '<script>alert(1)</script> <img src=x onerror=alert(2)>' });
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.doesNotMatch(html, /<script>alert\(1\)|<img src=x/);
  });
});

describe("robustesse et sécurité", () => {
  test("aucune erreur : formation inconnue, brouillon, archivée", async () => {
    assert.equal((await anon().get("/cours/inconnue")).status, 404);
    const d = await createCourse(prof, srv, { title: "Brouillon fiche", price: 0, publish: false });
    assert.equal((await anon().get(`/cours/${d.slug}`)).status, 404);
    assert.equal((await prof.get(`/cours/${d.slug}`)).status, 200);
  });
  test("les formations similaires n'exposent aucun brouillon même pour un visiteur connecté", async () => {
    const html = flat((await eleve.get(`/cours/${course.slug}`)).text);
    assert.doesNotMatch(html.slice(pos(html, 'id="similaires"')), /Brouillon fiche/);
  });
  test("tous les titres de la page sont bien ordonnés : un seul h1, des h2 pour les blocs", async () => {
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  });
});
