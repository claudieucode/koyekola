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

// FAQ : catégorie (questions générales) et publication — colonnes AJOUTÉES avec des valeurs par défaut qui conservent le comportement d'avant (publiée, sans catégorie)
const faqColumns = db.prepare("PRAGMA table_info(faqs)").all().map((col) => col.name);
if (!faqColumns.includes("category")) db.exec("ALTER TABLE faqs ADD COLUMN category TEXT NOT NULL DEFAULT ''");
if (!faqColumns.includes("published")) db.exec("ALTER TABLE faqs ADD COLUMN published INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1))");

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

// Pages du site : contenu en blocs (HTML assaini, éditeur de blocs) en plus du texte Markdown d'origine
const sitePageColumns = db.prepare("PRAGMA table_info(site_pages)").all().map((c) => c.name);
if (!sitePageColumns.includes("content_html")) db.exec("ALTER TABLE site_pages ADD COLUMN content_html TEXT NOT NULL DEFAULT ''");
if (!sitePageColumns.includes("heading")) db.exec("ALTER TABLE site_pages ADD COLUMN heading TEXT NOT NULL DEFAULT ''"); // titre affiché en tête de la page (éditeur de blocs)

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
  toc_depth: "INTEGER NOT NULL DEFAULT 3", // 2 = titres H2 seulement, 3 = H2 + H3, 4 = H2 → H4
  toc_numbering: "TEXT NOT NULL DEFAULT 'h2'", // none | h2 (01, 02…) | full (1, 1.1, 1.1.1)
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
  // CMS (palier 4) : image mise en avant choisie dans la médiathèque du CMS (mk_media.id ; cover_path garde l'adresse affichée)
  // et corbeille (suppression douce : l'article reste en base, hors ligne, restaurable)
  featured_media_id: "INTEGER",
  deleted_at: "TEXT",
  deleted_from_status: "TEXT",
  deleted_by: "INTEGER",
  // Page du site éditée avec l'éditeur de blocs (ex. « a-propos ») : ce n'est PAS un article. La ligne reste hors ligne et « dans la corbeille » (deleted_at) pour
  // être exclue de toutes les listes, recherches, exports et flux d'articles ; elle sert seulement de support à l'éditeur (versions, sauvegarde automatique)
  page_key: "TEXT",
};
for (const [name, definition] of Object.entries(NEW_POST_COLUMNS)) {
  if (!postColumns.includes(name)) db.exec(`ALTER TABLE posts ADD COLUMN ${name} ${definition}`);
}
db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_page_key ON posts(page_key) WHERE page_key IS NOT NULL");
db.exec("CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(published, category)");
db.exec("CREATE INDEX IF NOT EXISTS idx_posts_cms ON posts(deleted_at, status, updated_at)");
db.exec("CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)");

// ---------- Taxonomies (CMS, palier 5) : termes (catégories, étiquettes, futurs types) et leurs relations avec les contenus ----------
// Générique : une taxonomie (« category », « tag »…) contient des termes ; un contenu (« post » aujourd'hui, pages, produits, cours
// demain) est relié à des termes. Les colonnes posts.category / subcategory / tags restent comme MIROIR de lecture, tenu à jour
// par services/taxonomy.js (les anciens lecteurs : sitemap, listes, SEO, pages dynamiques continuent de fonctionner).
const taxonomyIsNew = !db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'taxonomy_relations'").get();
db.exec(`
  CREATE TABLE IF NOT EXISTS taxonomy_terms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taxonomy TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    parent_id INTEGER REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
    meta TEXT NOT NULL DEFAULT '{}',          -- préparation SEO / réglages futurs (titre, description, canonique, robots…), non utilisé encore
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (taxonomy, slug)
  );
  CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_parent_id ON taxonomy_terms(parent_id);
  CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_parent ON taxonomy_terms(taxonomy, parent_id);
  CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_name ON taxonomy_terms(taxonomy, name COLLATE NOCASE);
  CREATE TABLE IF NOT EXISTS taxonomy_relations (
    content_type TEXT NOT NULL,
    content_id INTEGER NOT NULL,
    term_id INTEGER NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
    is_primary INTEGER NOT NULL DEFAULT 0,    -- catégorie principale du contenu (une au plus par contenu)
    position INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (content_type, content_id, term_id)
  );
  CREATE INDEX IF NOT EXISTS idx_taxonomy_relations_term ON taxonomy_relations(term_id, content_type);
  -- Un article supprimé (corbeille vidée, suppression définitive, ancienne liste) ne laisse jamais de relation orpheline
  CREATE TRIGGER IF NOT EXISTS trg_posts_taxonomy_delete AFTER DELETE ON posts
  BEGIN DELETE FROM taxonomy_relations WHERE content_type = 'post' AND content_id = OLD.id; END;
`);
// Reprise des catégories / sous-catégories / étiquettes déjà saisies dans les articles (une seule fois, à la création des tables)
if (taxonomyIsNew) require("../services/taxonomyBackfill")(db);
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
// Révisions : réglages de l'article (catégorie, étiquettes, image, SEO…) en JSON, type de révision, empreinte (anti-doublon)
const revisionColumns = db.prepare("PRAGMA table_info(post_revisions)").all().map((col) => col.name);
for (const [name, definition] of Object.entries({ meta: "TEXT NOT NULL DEFAULT '{}'", kind: "TEXT NOT NULL DEFAULT 'save'", fingerprint: "TEXT NOT NULL DEFAULT ''" })) {
  if (!revisionColumns.includes(name)) db.exec(`ALTER TABLE post_revisions ADD COLUMN ${name} ${definition}`);
}

// Photo du formateur (chemin d'un fichier envoyé) : colonne ajoutée aux bases déjà existantes
const userColumns = db.prepare("PRAGMA table_info(users)").all().map((col) => col.name);
if (!userColumns.includes("avatar_path")) db.exec("ALTER TABLE users ADD COLUMN avatar_path TEXT");
// Utilisateurs / rôles (palier 9) : état du compte (active | suspended | disabled) et activité. Colonnes additives : tous les comptes existants restent actifs.
if (!userColumns.includes("status")) db.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
if (!userColumns.includes("last_login_at")) db.exec("ALTER TABLE users ADD COLUMN last_login_at TEXT");
if (!userColumns.includes("last_seen_at")) db.exec("ALTER TABLE users ADD COLUMN last_seen_at TEXT");
// Fuseau horaire du navigateur (IANA), relevé à l'inscription et à chaque connexion : sert à l'envoi des e-mails à
// l'heure locale de l'élève (Marketing → heure d'envoi). Vide = inconnu.
if (!userColumns.includes("timezone")) db.exec("ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT ''");
// Compte supprimé à la demande de la personne (RGPD) : la ligne reste, anonymisée, pour l'historique des ventes
if (!userColumns.includes("deleted_at")) db.exec("ALTER TABLE users ADD COLUMN deleted_at TEXT");
// Adresse e-mail confirmée (lien reçu à l'inscription) : informative, ne bloque jamais l'accès au compte
if (!userColumns.includes("email_verified_at")) db.exec("ALTER TABLE users ADD COLUMN email_verified_at TEXT");

// ---------- Centre de gestion ----------
// Codes promo (appliqués au paiement, aux formations du formateur qui les crée ; une seule formation si course_id)
db.exec(`
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE COLLATE NOCASE,
    kind TEXT NOT NULL CHECK (kind IN ('percent', 'fixed')),
    value INTEGER NOT NULL CHECK (value > 0),
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    starts_at TEXT,
    expires_at TEXT,
    max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_coupons_instructor ON coupons(instructor_id);
  -- Notifications du Centre de gestion : état « lu » par formateur (les notifications elles-mêmes viennent des données réelles)
  CREATE TABLE IF NOT EXISTS activity_reads (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_key TEXT NOT NULL,
    read_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, item_key)
  );
  CREATE TABLE IF NOT EXISTS activity_state (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    read_all_before TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
  CREATE INDEX IF NOT EXISTS idx_order_items_course ON order_items(course_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id, created_at);
`);
// Commandes : code promo utilisé et remise ; lignes : prix catalogue (price_cents reste le montant réellement payé)
const orderColumns = db.prepare("PRAGMA table_info(orders)").all().map((col) => col.name);
if (!orderColumns.includes("coupon_id")) db.exec("ALTER TABLE orders ADD COLUMN coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL");
if (!orderColumns.includes("coupon_code")) db.exec("ALTER TABLE orders ADD COLUMN coupon_code TEXT");
if (!orderColumns.includes("discount_cents")) db.exec("ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0");
const itemColumns = db.prepare("PRAGMA table_info(order_items)").all().map((col) => col.name);
if (!itemColumns.includes("list_price_cents")) db.exec("ALTER TABLE order_items ADD COLUMN list_price_cents INTEGER");


// Paiements Stripe en cours : le panier et les montants (fixés par le serveur) sont gardés ici le temps du paiement.
// La commande (orders) et les inscriptions ne sont écrites qu'une fois le paiement confirmé par Stripe (webhook signé) :
// aucune commande impayée n'apparaît donc dans les ventes, le CRM ou les statistiques.
db.exec(`
  CREATE TABLE IF NOT EXISTS checkout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT NOT NULL UNIQUE,                       -- référence interne aléatoire, transmise à Stripe (client_reference_id)
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_intent TEXT,                     -- utile pour un remboursement
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed')),
    items_json TEXT NOT NULL,                       -- [{ course_id, price_cents (payé), list_price_cents }]
    coupon_id INTEGER,
    coupon_code TEXT,
    discount_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'eur',
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    failure_reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user ON checkout_sessions(user_id, status);
`);

// Remboursements (palier 20) : la vérité financière reste chez Stripe ; ici seulement la trace de ce que Stripe annonce (webhook signé « charge.refunded »),
// rattachée à la commande payée par ce paiement. UNIQUE sur l'identifiant du remboursement Stripe : un webhook rejoué n'enregistre rien de plus.
db.exec(`
  CREATE TABLE IF NOT EXISTS order_refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    stripe_refund_id TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'eur',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_order_refunds_order ON order_refunds(order_id);
`);

// Offres : prix spécial d'une formation (lancement, soldes) pendant une période. Le prix standard reste courses.price_cents ;
// une offre ne peut que le BAISSER (voir src/services/pricing.js). instructor_id = propriétaire (comme courses et coupons).
db.exec(`
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    starts_at TEXT,                                 -- UTC « AAAA-MM-JJ HH:MM:SS » ; vide = déjà commencée
    ends_at TEXT,                                   -- UTC, borne exclue ; vide = sans fin
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
  );
  CREATE INDEX IF NOT EXISTS idx_offers_course ON offers(course_id, active);
`);
// Ligne de commande : offre appliquée (le nom est conservé même si l'offre est supprimée ensuite) ; vide = prix standard.
// list_price_cents reste le prix standard du catalogue, price_cents le montant réellement payé.
const itemColumnsOffers = db.prepare("PRAGMA table_info(order_items)").all().map((col) => col.name);
if (!itemColumnsOffers.includes("offer_id")) db.exec("ALTER TABLE order_items ADD COLUMN offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL");
if (!itemColumnsOffers.includes("offer_name")) db.exec("ALTER TABLE order_items ADD COLUMN offer_name TEXT");

// Certificats délivrés : enregistrés une seule fois par élève et par formation (code public unique, impossible à deviner), avec un
// instantané du nom et du titre (le certificat reste vérifiable même si le compte ou la formation changent de nom).
// Un certificat révoqué par le formateur reste visible comme « révoqué » sur la page de vérification.
db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    instructor_id INTEGER,                          -- propriétaire de la formation au moment de la délivrance
    student_name TEXT NOT NULL,
    course_title TEXT NOT NULL,
    instructor_name TEXT NOT NULL DEFAULT '',
    completed_at TEXT,
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT,
    revoked_reason TEXT
  );
  CREATE UNIQUE INDEX IF NOT EXISTS uq_certificates_user_course ON certificates(user_id, course_id) WHERE course_id IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_certificates_instructor ON certificates(instructor_id, issued_at);
`);
// Support : tickets des élèves au formateur. status : open = en attente du formateur, answered = le formateur a répondu,
// closed = clos (un nouveau message de l'élève le rouvre). instructor_id = formateur destinataire (propriétaire de la formation
// concernée, sinon le formateur de la plateforme) : un formateur ne voit que SES tickets.
db.exec(`
  CREATE TABLE IF NOT EXISTS support_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    instructor_id INTEGER,
    course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, updated_at);
  CREATE INDEX IF NOT EXISTS idx_support_tickets_instructor ON support_tickets(instructor_id, status, updated_at);
  CREATE TABLE IF NOT EXISTS support_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_staff INTEGER NOT NULL DEFAULT 0,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id, id);
  -- Notifications des élèves (centre de notifications) : écrites par les modules (support, certificats, commandes…) via
  -- src/services/notifications.js ; read_at vide = non lue. (Le formateur garde le flux d'activité du Centre de gestion.)
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    read_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, id);
`);
// Journal d'activité du site : qui a fait quoi, sur quelle ressource, quand, avec quel résultat. EN ÉCRITURE SEULE : des
// déclencheurs refusent toute modification ou suppression d'une ligne (aucune interface ni requête du site ne les efface).
// Pas de clé étrangère : l'entrée survit à la suppression du compte (actor_name garde le nom au moment de l'action).
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    at TEXT NOT NULL DEFAULT (datetime('now')),
    actor_id INTEGER,
    actor_name TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,                           -- ressource.verbe, ex. course.price_changed
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    summary TEXT NOT NULL,                          -- phrase lisible (français)
    details TEXT NOT NULL DEFAULT '{}',             -- JSON : avant / après, jamais de secret
    result TEXT NOT NULL DEFAULT 'ok' CHECK (result IN ('ok', 'refused', 'error')),
    ip TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_audit_log_at ON audit_log(at, id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, id);
  CREATE TRIGGER IF NOT EXISTS audit_log_no_update BEFORE UPDATE ON audit_log BEGIN SELECT RAISE(ABORT, 'Le journal d''activité est en écriture seule.'); END;
  CREATE TRIGGER IF NOT EXISTS audit_log_no_delete BEFORE DELETE ON audit_log BEGIN SELECT RAISE(ABORT, 'Le journal d''activité est en écriture seule.'); END;
`);
// Quiz : nombre maximal de tentatives (vide = illimité)
const quizColumns = db.prepare("PRAGMA table_info(quizzes)").all().map((col) => col.name);
if (!quizColumns.includes("max_attempts")) db.exec("ALTER TABLE quizzes ADD COLUMN max_attempts INTEGER CHECK (max_attempts IS NULL OR max_attempts > 0)");

// Index des clés étrangères qui n'en avaient pas : suppressions en cascade (une leçon, un quiz, un compte…) et jointures
// sans parcourir toute la table quand le volume grandit
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
  CREATE INDEX IF NOT EXISTS idx_orders_coupon ON orders(coupon_id);
  CREATE INDEX IF NOT EXISTS idx_lesson_state_lesson ON lesson_state(lesson_id);
  CREATE INDEX IF NOT EXISTS idx_lesson_notes_lesson ON lesson_notes(lesson_id);
  CREATE INDEX IF NOT EXISTS idx_course_slug_history_course ON course_slug_history(course_id);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_post_slug_history_post ON post_slug_history(post_id);
  CREATE INDEX IF NOT EXISTS idx_coupons_course ON coupons(course_id);
`);

// Journal WAL : les lectures (pages du site) ne sont plus bloquées pendant une écriture (file d'envoi marketing…).
// Les sauvegardes (VACUUM INTO) restent cohérentes dans ce mode.
db.exec("PRAGMA journal_mode = WAL");

// ---------- Moteur d'apparence (palier 8) ----------
// Configuration d'apparence du site public : jetons de design (la source de vérité des styles, même schéma que le design system des
// sites du Page Builder : src/marketing/pages/tokens.js), en-tête et pied de page. Brouillon et version publiée séparés ; chaque
// publication est conservée (historique). site_id vide = le site public principal ; les sites du Page Builder gardent leurs jetons
// dans mk_sites.tokens (même validation). Patterns enregistrés par l'équipe : sections du Page Builder réutilisables.
db.exec(`
  CREATE TABLE IF NOT EXISTS appearance_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    draft TEXT,
    published TEXT,
    published_css TEXT NOT NULL DEFAULT '',
    revision INTEGER NOT NULL DEFAULT 0,
    draft_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    draft_at TEXT,
    published_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    published_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_appearance_configs_site ON appearance_configs(COALESCE(site_id, 0));
  CREATE INDEX IF NOT EXISTS idx_appearance_configs_draft_by ON appearance_configs(draft_by);
  CREATE INDEX IF NOT EXISTS idx_appearance_configs_published_by ON appearance_configs(published_by);

  CREATE TABLE IF NOT EXISTS appearance_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    config TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_appearance_revisions_site ON appearance_revisions(COALESCE(site_id, 0), id);
  CREATE INDEX IF NOT EXISTS idx_appearance_revisions_by ON appearance_revisions(created_by);

  CREATE TABLE IF NOT EXISTS appearance_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Mes patterns',
    description TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL DEFAULT 'static' CHECK (mode IN ('static')),
    sections TEXT NOT NULL,
    source_page_id INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_appearance_patterns_name ON appearance_patterns(COALESCE(site_id, 0), name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_appearance_patterns_by ON appearance_patterns(created_by);
`);

// ---------- Révisions communes (palier 10) ----------
// Couche commune d'historique, SANS remplacer les historiques qui fonctionnent : les articles gardent post_revisions, les versions publiées des
// pages gardent mk_page_versions, les versions publiées de l'apparence gardent appearance_revisions. cms_revisions ajoute ce qui manquait :
// les états de BROUILLON des pages et de l'apparence, les états « avant restauration », l'historique des patterns. La corbeille des patterns
// (deleted_at) complète celle des pages, articles, médias et commentaires.
db.exec(`
  CREATE TABLE IF NOT EXISTS cms_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type TEXT NOT NULL,
    content_id INTEGER NOT NULL,
    site_id INTEGER,
    kind TEXT NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL,
    fingerprint TEXT NOT NULL DEFAULT '',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_cms_revisions_item ON cms_revisions(content_type, content_id, id);
  CREATE INDEX IF NOT EXISTS idx_cms_revisions_by ON cms_revisions(created_by);
  CREATE INDEX IF NOT EXISTS idx_cms_revisions_site ON cms_revisions(site_id);
`);
const appearanceColumns = db.prepare("PRAGMA table_info(appearance_configs)").all().map((c) => c.name);
if (!appearanceColumns.includes("draft_rev")) db.exec("ALTER TABLE appearance_configs ADD COLUMN draft_rev INTEGER NOT NULL DEFAULT 0");
const patternColumns = db.prepare("PRAGMA table_info(appearance_patterns)").all().map((c) => c.name);
if (!patternColumns.includes("deleted_at")) db.exec("ALTER TABLE appearance_patterns ADD COLUMN deleted_at TEXT");
// Un pattern à la corbeille ne bloque pas le nom d'un nouveau : l'unicité ne concerne que les patterns vivants
db.exec("DROP INDEX IF EXISTS idx_appearance_patterns_name; CREATE UNIQUE INDEX IF NOT EXISTS idx_appearance_patterns_live_name ON appearance_patterns(COALESCE(site_id, 0), name COLLATE NOCASE) WHERE deleted_at IS NULL;");
if (!patternColumns.includes("deleted_by")) db.exec("ALTER TABLE appearance_patterns ADD COLUMN deleted_by INTEGER");

// ---------- Moteur de navigation (palier 7) ----------
// Menus, éléments de menu (hiérarchie, ordre) et emplacements (header, footer, mobile). Un élément qui pointe vers une ressource KOLAKISA
// (page, article, catégorie, étiquette) garde sa RÉFÉRENCE (type + object_id), jamais une copie de son adresse : si le slug change,
// le lien suit. site_id vide = le site public principal (en-tête et pied de page du site) ; sinon un site du Page Builder (mk_sites).
db.exec(`
  CREATE TABLE IF NOT EXISTS nav_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_nav_menus_slug ON nav_menus(COALESCE(site_id, 0), slug);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_nav_menus_name ON nav_menus(COALESCE(site_id, 0), name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_nav_menus_creator ON nav_menus(created_by);

  CREATE TABLE IF NOT EXISTS nav_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id INTEGER NOT NULL REFERENCES nav_menus(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES nav_items(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('page', 'article', 'category', 'tag', 'home', 'custom')),
    object_id INTEGER,
    url TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    new_tab INTEGER NOT NULL DEFAULT 0,
    rel TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '',
    visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'guests', 'members')),
    description TEXT NOT NULL DEFAULT '',
    media_id INTEGER,
    meta TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_nav_items_menu ON nav_items(menu_id, parent_id, position);
  CREATE INDEX IF NOT EXISTS idx_nav_items_parent ON nav_items(parent_id);
  CREATE INDEX IF NOT EXISTS idx_nav_items_target ON nav_items(type, object_id);
  -- Supprimer un élément ne perd pas ses sous-éléments : ils remontent d'un niveau
  CREATE TRIGGER IF NOT EXISTS trg_nav_items_reparent BEFORE DELETE ON nav_items
    BEGIN UPDATE nav_items SET parent_id = OLD.parent_id WHERE parent_id = OLD.id; END;

  CREATE TABLE IF NOT EXISTS nav_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    location TEXT NOT NULL,
    menu_id INTEGER NOT NULL REFERENCES nav_menus(id) ON DELETE CASCADE,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_nav_locations_slot ON nav_locations(COALESCE(site_id, 0), location);
  CREATE INDEX IF NOT EXISTS idx_nav_locations_menu ON nav_locations(menu_id);
`);
// Éditeur de menus (Apparence → Menus) : version du menu (refus d'un enregistrement fait sur une version périmée), classes CSS et attribut title des éléments.
// Colonnes additives à valeur par défaut, ajoutées ici (comme les tables ci-dessus, qui ne sont pas créées par les migrations du marketing). Annulation : DROP COLUMN.
const navMenuColumns = db.prepare("PRAGMA table_info(nav_menus)").all().map((c) => c.name);
if (!navMenuColumns.includes("revision")) db.exec("ALTER TABLE nav_menus ADD COLUMN revision INTEGER NOT NULL DEFAULT 1");
if (!navMenuColumns.includes("auto_add_pages")) db.exec("ALTER TABLE nav_menus ADD COLUMN auto_add_pages INTEGER NOT NULL DEFAULT 0");
const navItemColumns = db.prepare("PRAGMA table_info(nav_items)").all().map((c) => c.name);
if (!navItemColumns.includes("css_class")) db.exec("ALTER TABLE nav_items ADD COLUMN css_class TEXT NOT NULL DEFAULT ''");
if (!navItemColumns.includes("title_attr")) db.exec("ALTER TABLE nav_items ADD COLUMN title_attr TEXT NOT NULL DEFAULT ''");

// Profil d'un compte créé par un administrateur (CMS → Utilisateurs → Ajouter un compte) : prénom, nom, site web, langue préférée.
// Colonnes additives à valeur par défaut (les comptes existants gardent '' = « non renseigné », langue '' = valeur par défaut du site). Annulation : DROP COLUMN.
const accountProfileColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
for (const [col, ddl] of [["first_name", "TEXT NOT NULL DEFAULT ''"], ["last_name", "TEXT NOT NULL DEFAULT ''"], ["website", "TEXT NOT NULL DEFAULT ''"], ["language", "TEXT NOT NULL DEFAULT ''"]]) {
  if (!accountProfileColumns.includes(col)) db.exec(`ALTER TABLE users ADD COLUMN ${col} ${ddl}`);
}

// ---------- Moteur de commentaires (palier 6) ----------
// Le système de commentaires existant (blog_comments : membres connectés, publication immédiate) est RÉUTILISÉ et étendu, pas doublé :
// même table, mêmes lignes (toutes conservées, statut « approved »), mais rattachée à un contenu générique (content_type + content_id),
// avec réponses (parent_id), invités (user_id facultatif + nom/e-mail), statut de modération et empreinte d'adresse IP (jamais l'adresse).
// post_id est conservé pour les articles : lecteurs historiques et suppression en cascade avec l'article.
if (!db.prepare("PRAGMA table_info(blog_comments)").all().some((c) => c.name === "status")) {
  db.exec(`
    SAVEPOINT comments_engine;
    ALTER TABLE blog_comments RENAME TO blog_comments_old;
    CREATE TABLE blog_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      content_type TEXT NOT NULL DEFAULT 'post',
      content_id INTEGER,
      parent_id INTEGER REFERENCES blog_comments(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL DEFAULT '',
      author_email TEXT NOT NULL DEFAULT '',
      ip_hash TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'spam', 'trash')),
      prev_status TEXT NOT NULL DEFAULT '',
      approved_at TEXT,
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      deleted_at TEXT,
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO blog_comments (id, post_id, content_type, content_id, user_id, body, status, approved_at, created_at, updated_at)
      SELECT id, post_id, 'post', post_id, user_id, body, 'approved', created_at, created_at, created_at FROM blog_comments_old;
    DROP TABLE blog_comments_old;
    RELEASE comments_engine;
  `);
}
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_blog_comments_content ON blog_comments(content_type, content_id, status, created_at);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_parent ON blog_comments(parent_id);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_status ON blog_comments(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON blog_comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_email ON blog_comments(author_email);
  CREATE INDEX IF NOT EXISTS idx_blog_comments_approver ON blog_comments(approved_by);
  -- Les écritures historiques (post_id seul) restent valides : le contenu générique en est déduit
  CREATE TRIGGER IF NOT EXISTS trg_blog_comments_content AFTER INSERT ON blog_comments WHEN NEW.content_id IS NULL AND NEW.post_id IS NOT NULL
    BEGIN UPDATE blog_comments SET content_id = NEW.post_id WHERE id = NEW.id; END;
  -- Un commentaire supprimé (compte effacé, suppression définitive) : ses réponses remontent d'un niveau, rien d'autre n'est perdu
  CREATE TRIGGER IF NOT EXISTS trg_blog_comments_reparent BEFORE DELETE ON blog_comments
    BEGIN UPDATE blog_comments SET parent_id = OLD.parent_id WHERE parent_id = OLD.id; END;
`);

// Index des clés étrangères des tables ajoutées (offres, paiements, certificats, support) : suppressions en cascade et jointures
// sans parcourir toute la table (même règle que les index ci-dessus ; vérifié par tests/audit-corrections.test.js).
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_order_items_offer ON order_items(offer_id);
  CREATE INDEX IF NOT EXISTS idx_checkout_sessions_order ON checkout_sessions(order_id);
  CREATE INDEX IF NOT EXISTS idx_offers_instructor ON offers(instructor_id);
  CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id);
  CREATE INDEX IF NOT EXISTS idx_support_tickets_course ON support_tickets(course_id);
  CREATE INDEX IF NOT EXISTS idx_support_messages_author ON support_messages(author_id);
`);

module.exports = db;
