const { DatabaseSync } = require("node:sqlite");
const { dbFile } = require("./paths");

const db = new DatabaseSync(dbFile);
db.exec("PRAGMA foreign_keys = ON");
// Si la base est brièvement occupée (sauvegarde, écriture simultanée), on patiente 5 s au lieu d'échouer
db.exec("PRAGMA busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'etudiant' CHECK (role IN ('etudiant', 'formateur')),
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Autre',
    level TEXT NOT NULL DEFAULT 'debutant' CHECK (level IN ('debutant', 'intermediaire', 'avance')),
    price_cents INTEGER NOT NULL DEFAULT 0,
    thumbnail_path TEXT,
    published INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    video_path TEXT,
    video_url TEXT,
    resource_path TEXT,
    resource_name TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    is_preview INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Quiz',
    pass_percentage INTEGER NOT NULL DEFAULT 70
  );

  CREATE TABLE IF NOT EXISTS quiz_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quiz_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score_percentage INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS enrollments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id)
  );

  CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, lesson_id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(course_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    price_cents INTEGER NOT NULL DEFAULT 0
  );

  -- Pièces jointes d'une leçon : fichiers (PDF, images, archives…) et liens externes
  CREATE TABLE IF NOT EXISTS lesson_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('file', 'link')),
    title TEXT NOT NULL,
    path TEXT,
    url TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Où en est chaque élève dans chaque leçon : position dans la vidéo et date de dernière consultation
  -- (updated_at en millisecondes : sert à retrouver la dernière leçon consultée d'une formation)
  CREATE TABLE IF NOT EXISTS lesson_state (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    position_seconds REAL NOT NULL DEFAULT 0,
    duration_seconds REAL NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, lesson_id)
  );

  -- Notes personnelles : une par élève et par leçon, jamais visibles par les autres
  CREATE TABLE IF NOT EXISTS lesson_notes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, lesson_id)
  );

  -- Anciennes adresses d'une formation renommée : elles redirigent (301) vers la nouvelle
  CREATE TABLE IF NOT EXISTS course_slug_history (
    old_slug TEXT PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE
  );

  -- Textes modifiables du site (aujourd'hui : la page « À propos »)
  CREATE TABLE IF NOT EXISTS site_pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    seo_description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Questions fréquentes : générales (course_id vide) ou propres à une formation
  CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  );

  -- Messages envoyés par le formulaire de contact (l'adresse IP n'est volontairement pas conservée)
  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read_at TEXT
  );

  -- Articles du blog (brouillon tant que published = 0 ; published_at garde la date de première publication)
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    cover_path TEXT,
    published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    seo_title TEXT,
    seo_description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, course_id)
  );
`);

// Index : accélèrent les jointures et filtres utilisés à chaque page (chapitres d'une formation,
// leçons d'un chapitre, ventes d'une formation…). Créés seulement s'ils n'existent pas déjà.
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id, position);
  CREATE INDEX IF NOT EXISTS idx_lessons_section ON lessons(section_id, position);
  CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(published, created_at);
  CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_order_items_course ON order_items(course_id);
  CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);
  CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, position);
  CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id, position);
  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id, quiz_id);
  CREATE INDEX IF NOT EXISTS idx_attachments_lesson ON lesson_attachments(lesson_id, position);
  CREATE INDEX IF NOT EXISTS idx_state_user_updated ON lesson_state(user_id, updated_at);
  CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON lesson_notes(user_id, updated_at);
  CREATE INDEX IF NOT EXISTS idx_favorites_course ON favorites(course_id);
  CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published, published_at);
  CREATE INDEX IF NOT EXISTS idx_faqs_course ON faqs(course_id, position);
  CREATE INDEX IF NOT EXISTS idx_contact_read ON contact_messages(read_at, created_at);
`);

// Migration : l'ancienne « ressource téléchargeable » (une seule par leçon) devient une pièce jointe.
// Sans danger à chaque démarrage : une ressource déjà migrée n'est jamais recopiée.
db.exec(`
  INSERT INTO lesson_attachments (lesson_id, kind, title, path, position)
  SELECT id, 'file', COALESCE(NULLIF(resource_name, ''), 'Fichier'), resource_path, 0
  FROM lessons
  WHERE resource_path IS NOT NULL AND resource_path != ''
    AND NOT EXISTS (SELECT 1 FROM lesson_attachments a WHERE a.lesson_id = lessons.id AND a.path = lessons.resource_path);
  -- L'ancienne colonne est vidée une fois la copie faite : sinon une pièce jointe supprimée plus tard
  -- « ressusciterait » au démarrage suivant.
  UPDATE lessons SET resource_path = NULL, resource_name = NULL
  WHERE resource_path IS NOT NULL
    AND EXISTS (SELECT 1 FROM lesson_attachments a WHERE a.lesson_id = lessons.id AND a.path = lessons.resource_path);
`);

// Évolutions du schéma pour les bases déjà existantes (CREATE TABLE IF NOT EXISTS ne modifie pas une table existante)
const courseColumns = db.prepare("PRAGMA table_info(courses)").all().map((col) => col.name);
const NEW_COURSE_COLUMNS = {
  objectives: "TEXT NOT NULL DEFAULT ''", // « Ce que vous apprendrez » : un élément par ligne
  prerequisites: "TEXT NOT NULL DEFAULT ''", // prérequis : un par ligne
  target_audience: "TEXT NOT NULL DEFAULT ''", // public visé : un par ligne
  skills: "TEXT NOT NULL DEFAULT ''", // compétences acquises : une par ligne
  intro_video: "TEXT", // vidéo de présentation (lien YouTube/Vimeo, fichier, ou identifiant Bunny)
  archived: "INTEGER NOT NULL DEFAULT 0", // 1 = archivée : hors catalogue, non achetable, conservée
  seo_title: "TEXT", // titre pour les moteurs de recherche (sinon : le titre de la formation)
  seo_description: "TEXT", // description pour les moteurs de recherche (sinon : tirée du sous-titre / de la description)
  language: "TEXT NOT NULL DEFAULT 'fr'", // langue de la formation (code : fr, en, es…)
  rich_text: "INTEGER NOT NULL DEFAULT 0", // 0 = textes de l'ancien format (Markdown / une ligne par élément), 1 = HTML riche assaini (éditeur)
};
for (const [name, definition] of Object.entries(NEW_COURSE_COLUMNS)) {
  if (!courseColumns.includes(name)) db.exec(`ALTER TABLE courses ADD COLUMN ${name} ${definition}`);
}

// Photo du formateur (chemin d'un fichier envoyé) : colonne ajoutée aux bases déjà existantes
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((col) => col.name);
if (!userColumns.includes("avatar_path")) db.exec("ALTER TABLE users ADD COLUMN avatar_path TEXT");

module.exports = db;
