const { DatabaseSync } = require("node:sqlite");
const { dbFile } = require("./paths");

const db = new DatabaseSync(dbFile);
db.exec("PRAGMA foreign_keys = ON");
// Si la base est brièvement occupée (sauvegarde, écriture simultanée, deux exemplaires du serveur qui démarrent en
// même temps chez l'hébergeur), on patiente jusqu'à 15 s au lieu d'échouer
db.exec("PRAGMA busy_timeout = 15000");

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

  -- Commentaires des articles du blog : écrits par des membres connectés, texte brut (jamais de HTML)
  CREATE TABLE IF NOT EXISTS blog_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, created_at);

  -- Préférences d'interface d'un utilisateur (ex. apparence des barres latérales de l'éditeur d'articles)
  CREATE TABLE IF NOT EXISTS user_prefs (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    editor_theme TEXT,
    editor_color TEXT
  );

  -- Anciennes adresses d'un article dont le lien a été modifié après publication : redirection 301 vers la nouvelle
  CREATE TABLE IF NOT EXISTS post_slug_history (
    old_slug TEXT PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE
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

// Mot de passe oublié : seule l'EMPREINTE (SHA-256) du lien est conservée, jamais le lien lui-même ; valable 1 heure,
// utilisable une seule fois (src/routes/passwordReset.js)
db.exec(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
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

// Blog éditorial : catégorie, étiquettes, auteur, référencement et partage, consultations (colonnes ajoutées aux bases existantes)
const postColumns = db.prepare("PRAGMA table_info(posts)").all().map((col) => col.name);
const NEW_POST_COLUMNS = {
  category: "TEXT NOT NULL DEFAULT ''", // catégorie affichée (ex. « Marketing digital ») ; sa page : /blog/categorie/<adresse>
  tags: "TEXT NOT NULL DEFAULT ''", // étiquettes séparées par des virgules
  author_id: "INTEGER", // compte formateur auteur (sinon : le premier formateur)
  cover_alt: "TEXT NOT NULL DEFAULT ''", // texte alternatif de l'image principale (sinon : le titre)
  focus_keyword: "TEXT NOT NULL DEFAULT ''", // mot-clé principal visé (aide à la rédaction, jamais affiché)
  og_title: "TEXT", // titre pour le partage (Facebook, LinkedIn, X, WhatsApp) ; sinon : titre SEO puis titre
  og_description: "TEXT", // description pour le partage ; sinon : description SEO puis résumé
  og_image_path: "TEXT", // image dédiée au partage ; sinon : l'image principale
  canonical_url: "TEXT", // adresse canonique si l'article est publié ailleurs en premier ; sinon : sa propre adresse
  reading_minutes: "INTEGER", // temps de lecture imposé ; sinon : calculé (230 mots par minute)
  views: "INTEGER NOT NULL DEFAULT 0", // consultations (hors formateur et robots) : « articles populaires »
  // Éditeur éditorial (texte riche) — les articles existants gardent leur format Markdown tant qu'ils ne sont pas réenregistrés
  content_format: "TEXT NOT NULL DEFAULT 'markdown'", // markdown | html (HTML assaini par src/utils/blogHtml.js)
  status: "TEXT NOT NULL DEFAULT 'draft'", // draft | review | scheduled | published | archived (published = 1 seulement pour « published »)
  subcategory: "TEXT NOT NULL DEFAULT ''",
  secondary_keywords: "TEXT NOT NULL DEFAULT ''", // mots-clés secondaires, séparés par des virgules
  robots_index: "INTEGER NOT NULL DEFAULT 1", // 0 = noindex
  robots_follow: "INTEGER NOT NULL DEFAULT 1", // 0 = nofollow
  toc_enabled: "INTEGER NOT NULL DEFAULT 1",
  toc_depth: "INTEGER NOT NULL DEFAULT 3", // 2 = titres H2 seulement, 3 = H2 + H3
  toc_title: "TEXT NOT NULL DEFAULT ''", // sinon « Sommaire »
  language: "TEXT NOT NULL DEFAULT 'fr'",
  featured: "INTEGER NOT NULL DEFAULT 0", // article vedette (en tête du blog)
  twitter_card: "TEXT NOT NULL DEFAULT 'summary_large_image'", // summary | summary_large_image
  twitter_title: "TEXT",
  twitter_description: "TEXT",
  twitter_image_path: "TEXT",
  schema_type: "TEXT NOT NULL DEFAULT 'BlogPosting'", // BlogPosting | Article
  reviewed: "INTEGER NOT NULL DEFAULT 0", // case « Article relu » de la liste de contrôle
  comments_enabled: "INTEGER NOT NULL DEFAULT 1", // commentaires des membres inscrits autorisés sous l'article
};
for (const [name, definition] of Object.entries(NEW_POST_COLUMNS)) {
  if (!postColumns.includes(name)) db.exec(`ALTER TABLE posts ADD COLUMN ${name} ${definition}`);
}
db.exec("CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(published, category)");
// Statut des articles déjà là : publié ou brouillon, d'après l'ancienne colonne (une seule fois : la colonne vient d'être créée)
if (!postColumns.includes("status")) db.exec("UPDATE posts SET status = CASE WHEN published = 1 THEN 'published' ELSE 'draft' END");
db.exec(`
  -- Historique des versions d'un article (une ligne par enregistrement manuel ou restauration)
  CREATE TABLE IF NOT EXISTS post_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    content_format TEXT NOT NULL DEFAULT 'markdown',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_post_revisions_post ON post_revisions(post_id, id);
  -- Sauvegarde automatique (brouillon en cours de frappe, non publié) : une par article
  CREATE TABLE IF NOT EXISTS post_autosaves (
    post_id INTEGER PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER,
    payload TEXT NOT NULL,
    saved_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  -- Médiathèque du blog : images (et fichiers audio/vidéo) envoyés, avec leurs textes
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL DEFAULT 'image', -- image | video | audio
    mime TEXT NOT NULL DEFAULT '',
    size INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    alt TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '',
    credit TEXT NOT NULL DEFAULT '',
    uploaded_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at);
  CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at);
`);

// Photo du formateur (chemin d'un fichier envoyé) : colonne ajoutée aux bases déjà existantes
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((col) => col.name);
if (!userColumns.includes("avatar_path")) db.exec("ALTER TABLE users ADD COLUMN avatar_path TEXT");

module.exports = db;
