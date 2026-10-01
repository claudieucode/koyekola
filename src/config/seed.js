// Peuple la base locale avec des comptes et des formations de démonstration.
// Usage : npm run seed  (destructif : vide les tables avant de réinsérer)

const bcrypt = require("bcryptjs");
const db = require("./database");

db.exec(
  "DELETE FROM quiz_attempts; DELETE FROM quiz_options; DELETE FROM quiz_questions; DELETE FROM quizzes; DELETE FROM order_items; DELETE FROM orders; DELETE FROM reviews; DELETE FROM lesson_progress; DELETE FROM enrollments; DELETE FROM lessons; DELETE FROM sections; DELETE FROM courses; DELETE FROM users;"
);

const password = bcrypt.hashSync("password123", 10);

function createUser(username, email, role, bio) {
  const info = db
    .prepare("INSERT INTO users (username, email, password_hash, role, bio) VALUES (?, ?, ?, ?, ?)")
    .run(username, email, password, role, bio);
  return Number(info.lastInsertRowid);
}

// Un seul compte créateur : c'est votre plateforme personnelle, pas une place de marché.
const claire = createUser(
  "claire_dev",
  "claire@example.com",
  "formateur",
  "Développeuse full-stack depuis 10 ans. Je partage ici tout ce que j'apprends sur le code, le design et l'entrepreneuriat en ligne."
);

const julie = createUser("julie", "julie@example.com", "etudiant", "");
const hugo = createUser("hugo", "hugo@example.com", "etudiant", "");
const nadia = createUser("nadia", "nadia@example.com", "etudiant", "");

const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

function createCourse({ instructor, title, slug, subtitle, description, category, level, price, published = 1 }) {
  const info = db
    .prepare(
      `INSERT INTO courses (instructor_id, title, slug, subtitle, description, category, level, price_cents, published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(instructor, title, slug, subtitle, description, category, level, Math.round(price * 100), published);
  return Number(info.lastInsertRowid);
}

function createSection(courseId, title, position) {
  const info = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)").run(courseId, title, position);
  return Number(info.lastInsertRowid);
}

function createLesson(sectionId, title, position, { duration = 8, preview = false, video = false } = {}) {
  const info = db
    .prepare(`INSERT INTO lessons (section_id, title, video_url, duration_minutes, position, is_preview) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(sectionId, title, video ? SAMPLE_VIDEO : null, duration, position, preview ? 1 : 0);
  return Number(info.lastInsertRowid);
}

function createQuiz(lessonId, title, passPercentage, questions) {
  const quizInfo = db.prepare("INSERT INTO quizzes (lesson_id, title, pass_percentage) VALUES (?, ?, ?)").run(lessonId, title, passPercentage);
  const quizId = Number(quizInfo.lastInsertRowid);
  questions.forEach((q, qi) => {
    const qInfo = db.prepare("INSERT INTO quiz_questions (quiz_id, question, position) VALUES (?, ?, ?)").run(quizId, q.question, qi);
    q.options.forEach((optionText, oi) => {
      db.prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES (?, ?, ?, ?)").run(
        Number(qInfo.lastInsertRowid),
        optionText,
        oi === q.correct ? 1 : 0,
        oi
      );
    });
  });
}

// --- Cours 1 : JavaScript moderne ---
const c1 = createCourse({
  instructor: claire,
  title: "Le guide complet de JavaScript moderne",
  slug: "guide-complet-javascript-moderne",
  subtitle: "Des fondamentaux à la programmation asynchrone, avec des projets concrets.",
  description:
    "Apprenez JavaScript de zéro jusqu'à un niveau professionnel : variables, fonctions, manipulation du DOM, programmation asynchrone (promesses, async/await), et bonnes pratiques modernes (ES2020+).\n\nÀ la fin de cette formation, vous serez capable de construire des applications web interactives et de comprendre du code JavaScript professionnel.",
  category: "Développement",
  level: "intermediaire",
  price: 39.99,
});
let sec = createSection(c1, "Introduction", 0);
createLesson(sec, "Bienvenue dans la formation", 0, { duration: 3, preview: true, video: true });
createLesson(sec, "Installer son environnement de travail", 1, { duration: 6, preview: true });
sec = createSection(c1, "Les fondamentaux du langage", 1);
const variablesLessonId = createLesson(sec, "Variables et types de données", 0, { duration: 12 });
createQuiz(variablesLessonId, "Quiz : variables", 70, [
  {
    question: "Quel mot-clé permet de déclarer une variable qui ne peut pas être réassignée ?",
    options: ["var", "let", "const", "static"],
    correct: 2,
  },
  {
    question: "Quel est le type de la valeur `\"12\"` (avec guillemets) en JavaScript ?",
    options: ["number", "string", "boolean", "undefined"],
    correct: 1,
  },
]);
createLesson(sec, "Fonctions et portée", 1, { duration: 15 });
createLesson(sec, "Tableaux et objets", 2, { duration: 18 });
sec = createSection(c1, "Programmation asynchrone", 2);
createLesson(sec, "Callbacks et Promesses", 0, { duration: 20 });
createLesson(sec, "async/await en pratique", 1, { duration: 16 });
sec = createSection(c1, "Projet final", 3);
createLesson(sec, "Construire une mini-application", 0, { duration: 30 });

// --- Cours 2 : Python data ---
const c2 = createCourse({
  instructor: claire,
  title: "Apprendre Python pour l'analyse de données",
  slug: "python-analyse-de-donnees",
  subtitle: "Manipulez, visualisez et interprétez vos données avec Python.",
  description: "Une introduction complète à Python appliqué à la data : syntaxe de base, structures de données, puis manipulation de tableaux avec les bibliothèques courantes de l'écosystème data.",
  category: "Développement",
  level: "debutant",
  price: 29.99,
});
sec = createSection(c2, "Bases de Python", 0);
createLesson(sec, "Syntaxe et variables", 0, { duration: 10, preview: true });
createLesson(sec, "Boucles et conditions", 1, { duration: 14 });
sec = createSection(c2, "Manipulation de données", 1);
createLesson(sec, "Listes, tuples et dictionnaires", 0, { duration: 16 });
createLesson(sec, "Introduction aux tableaux de données", 1, { duration: 22 });

// --- Cours 3 : Figma ---
const c3 = createCourse({
  instructor: claire,
  title: "Design d'interfaces avec Figma",
  slug: "design-interfaces-figma",
  subtitle: "Maîtrisez Figma pour concevoir des interfaces professionnelles.",
  description: "De la prise en main de Figma à la création d'un design system complet : composants, auto-layout, prototypage et handoff développeur.",
  category: "Design",
  level: "debutant",
  price: 24.99,
});
sec = createSection(c3, "Prise en main", 0);
createLesson(sec, "Découverte de l'interface Figma", 0, { duration: 9, preview: true, video: true });
createLesson(sec, "Formes, calques et couleurs", 1, { duration: 11 });
sec = createSection(c3, "Composants et design system", 1);
createLesson(sec, "Créer des composants réutilisables", 0, { duration: 17 });
createLesson(sec, "Auto-layout avancé", 1, { duration: 19 });
createLesson(sec, "Prototypage et animations", 2, { duration: 14 });

// --- Cours 4 : Typographie (gratuit) ---
const c4 = createCourse({
  instructor: claire,
  title: "Typographie et mise en page",
  slug: "typographie-et-mise-en-page",
  subtitle: "Les fondamentaux d'une belle mise en page, gratuit et accessible à tous.",
  description: "Une formation courte et gratuite pour comprendre les bases de la typographie : hiérarchie, espacement, choix des polices.",
  category: "Design",
  level: "debutant",
  price: 0,
});
sec = createSection(c4, "Les bases", 0);
createLesson(sec, "Pourquoi la typographie compte", 0, { duration: 6, preview: true });
createLesson(sec, "Hiérarchie visuelle", 1, { duration: 9, preview: true });

// --- Cours 5 : Business ---
const c5 = createCourse({
  instructor: claire,
  title: "Lancer son business en ligne",
  slug: "lancer-son-business-en-ligne",
  subtitle: "De l'idée au premier client : le guide pas à pas.",
  description: "Structurez votre projet entrepreneurial : validation d'idée, choix du statut juridique, premiers outils, et acquisition de vos premiers clients en ligne.",
  category: "Business",
  level: "debutant",
  price: 49.99,
});
sec = createSection(c5, "Valider son idée", 0);
createLesson(sec, "Trouver une idée rentable", 0, { duration: 13, preview: true });
createLesson(sec, "Étudier son marché", 1, { duration: 15 });
sec = createSection(c5, "Se lancer", 1);
createLesson(sec, "Choisir son statut juridique", 0, { duration: 11 });
createLesson(sec, "Trouver ses premiers clients", 1, { duration: 20 });

// --- Cours 6 : Marketing digital ---
const c6 = createCourse({
  instructor: claire,
  title: "Marketing digital pour débutants",
  slug: "marketing-digital-debutants",
  subtitle: "Les bases du marketing en ligne : réseaux sociaux, emailing, référencement.",
  description: "Une formation généraliste pour comprendre les leviers du marketing digital et construire votre première stratégie.",
  category: "Marketing",
  level: "debutant",
  price: 22.0,
});
sec = createSection(c6, "Fondamentaux", 0);
createLesson(sec, "Comprendre le marketing digital", 0, { duration: 8, preview: true });
createLesson(sec, "Les réseaux sociaux pour son business", 1, { duration: 14 });

// --- Cours 7 : brouillon (non publié) ---
const c7 = createCourse({
  instructor: claire,
  title: "Node.js avancé — API et bases de données",
  slug: "nodejs-avance-api-bases-de-donnees",
  subtitle: "Formation en cours de préparation.",
  description: "Contenu en cours de rédaction.",
  category: "Développement",
  level: "avance",
  price: 44.99,
  published: 0,
});
sec = createSection(c7, "Introduction", 0);
createLesson(sec, "Présentation du programme", 0, { duration: 5 });

// --- Achats, progression et avis ---

function purchase(userId, courseId) {
  const course = db.prepare("SELECT price_cents FROM courses WHERE id = ?").get(courseId);
  const orderInfo = db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (?, ?)").run(userId, course.price_cents);
  db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, ?)").run(Number(orderInfo.lastInsertRowid), courseId, course.price_cents);
  db.prepare("INSERT OR IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)").run(userId, courseId);
}

purchase(julie, c1);
purchase(julie, c3);
purchase(hugo, c1);
purchase(nadia, c2);
purchase(nadia, c5);
purchase(hugo, c4);

function markComplete(userId, lessonTitle, courseId) {
  const lesson = db
    .prepare(
      `SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id
       WHERE sections.course_id = ? AND lessons.title = ?`
    )
    .get(courseId, lessonTitle);
  if (lesson) db.prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(userId, lesson.id);
}

markComplete(julie, "Bienvenue dans la formation", c1);
markComplete(julie, "Installer son environnement de travail", c1);
markComplete(julie, "Variables et types de données", c1);
markComplete(hugo, "Bienvenue dans la formation", c1);

db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)").run(c1, julie, 5, "Formation très claire, parfaite pour reprendre les bases sérieusement.");
db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)").run(c1, hugo, 4, "Bon contenu, un peu rapide sur la partie asynchrone.");
db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)").run(c3, julie, 5, "J'utilise Figma tous les jours maintenant, merci !");
db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)").run(c2, nadia, 4, "Bonne intro, j'aurais aimé plus d'exercices.");

console.log("Base de données peuplée :");
console.log("- Compte créateur (le vôtre) : claire@example.com / password123");
console.log("- Étudiants de démo : julie / hugo / nadia @example.com (mot de passe : password123)");
console.log(`- ${db.prepare("SELECT COUNT(*) c FROM courses").get().c} formations, ${db.prepare("SELECT COUNT(*) c FROM lessons").get().c} sous-chapitres.`);
