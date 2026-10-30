-- Programme 20.4 — bibliothèque professionnelle de modèles. Migration ADDITIVE (colonnes avec valeur par défaut + une table nouvelle ; aucune donnée existante modifiée).
--
-- 1. « Mes modèles » de pages (mk_page_templates, déjà isolés par site) reçoivent les métadonnées d'une vraie bibliothèque : version (incrémentée à chaque mise à jour du contenu),
--    version du format (pour les futures migrations de format), mots-clés, secteurs (liste JSON de clés de cms_template_sectors), langue, type de site, auteur de la dernière modification.
--    La visibilité réutilise la colonne existante « shared » : 0 = réservé à son site (défaut), 1 = partagé avec tous les sites de l'organisation (action explicite, droit « templates.share »).
-- 2. cms_template_sectors : taxonomie ADMINISTRABLE des secteurs d'activité. organization_id NULL = secteurs officiels Kolakisa (lecture seule pour les organisations) ;
--    sinon secteur ajouté par une organisation (visible d'elle seule). Rien n'est codé en dur : le catalogue officiel référence ces clés, l'écran les lit ici.
-- 3. cms_template_imports : date et auteur de l'ANNULATION d'un import (les pages créées sont mises à la corbeille, jamais supprimées ; un import annulé ne compte plus dans les usages).
-- Annulation : DROP TABLE cms_template_sectors ; les colonnes ajoutées sont inoffensives (ignorées par l'ancien code).
ALTER TABLE mk_page_templates ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE mk_page_templates ADD COLUMN format_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE mk_page_templates ADD COLUMN keywords TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_page_templates ADD COLUMN sectors TEXT NOT NULL DEFAULT '[]';
ALTER TABLE mk_page_templates ADD COLUMN language TEXT NOT NULL DEFAULT 'fr';
ALTER TABLE mk_page_templates ADD COLUMN site_type TEXT NOT NULL DEFAULT '';
ALTER TABLE mk_page_templates ADD COLUMN updated_by INTEGER;

ALTER TABLE cms_template_imports ADD COLUMN undone_at TEXT;
ALTER TABLE cms_template_imports ADD COLUMN undone_by INTEGER;

CREATE TABLE cms_template_sectors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER REFERENCES mk_organizations(id),
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  family_slug TEXT NOT NULL,
  family_label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX uq_cms_template_sectors_slug ON cms_template_sectors (COALESCE(organization_id, 0), slug);
CREATE INDEX idx_cms_template_sectors_family ON cms_template_sectors (family_slug, position);

INSERT INTO cms_template_sectors (organization_id, slug, label, family_slug, family_label, position) VALUES
  (NULL, 'corporate', 'Corporate', 'entreprises-services', 'Entreprises et services', 10),
  (NULL, 'conseil', 'Conseil', 'entreprises-services', 'Entreprises et services', 20),
  (NULL, 'services-professionnels', 'Services professionnels', 'entreprises-services', 'Entreprises et services', 30),
  (NULL, 'immobilier', 'Immobilier', 'entreprises-services', 'Entreprises et services', 40),
  (NULL, 'finance', 'Finance', 'entreprises-services', 'Entreprises et services', 50),
  (NULL, 'juridique', 'Juridique', 'entreprises-services', 'Entreprises et services', 60),
  (NULL, 'assurance', 'Assurance', 'entreprises-services', 'Entreprises et services', 70),
  (NULL, 'architecture', 'Architecture', 'entreprises-services', 'Entreprises et services', 80),
  (NULL, 'construction', 'Construction', 'entreprises-services', 'Entreprises et services', 90),
  (NULL, 'agence-digitale', 'Agences digitales', 'creation-communication', 'Création et communication', 10),
  (NULL, 'graphisme', 'Graphisme', 'creation-communication', 'Création et communication', 20),
  (NULL, 'photographie', 'Photographie', 'creation-communication', 'Création et communication', 30),
  (NULL, 'video', 'Vidéo', 'creation-communication', 'Création et communication', 40),
  (NULL, 'marketing', 'Marketing', 'creation-communication', 'Création et communication', 50),
  (NULL, 'communication', 'Communication', 'creation-communication', 'Création et communication', 60),
  (NULL, 'portfolio-creatif', 'Portfolio créatif', 'creation-communication', 'Création et communication', 70),
  (NULL, 'boutique-en-ligne', 'Boutique en ligne', 'commerce', 'Commerce', 10),
  (NULL, 'mode', 'Mode', 'commerce', 'Commerce', 20),
  (NULL, 'beaute', 'Beauté', 'commerce', 'Commerce', 30),
  (NULL, 'electronique', 'Électronique', 'commerce', 'Commerce', 40),
  (NULL, 'maison-decoration', 'Maison et décoration', 'commerce', 'Commerce', 50),
  (NULL, 'produits-numeriques', 'Produits numériques', 'commerce', 'Commerce', 60),
  (NULL, 'catalogue-produits', 'Catalogue de produits', 'commerce', 'Commerce', 70),
  (NULL, 'ecole', 'Écoles', 'education-formation', 'Éducation et formation', 10),
  (NULL, 'centre-formation', 'Centres de formation', 'education-formation', 'Éducation et formation', 20),
  (NULL, 'lms', 'Plateformes LMS', 'education-formation', 'Éducation et formation', 30),
  (NULL, 'formation-en-ligne', 'Formations en ligne', 'education-formation', 'Éducation et formation', 40),
  (NULL, 'universite', 'Universités', 'education-formation', 'Éducation et formation', 50),
  (NULL, 'cours-particuliers', 'Cours particuliers', 'education-formation', 'Éducation et formation', 60),
  (NULL, 'cabinet', 'Cabinets', 'sante-bien-etre', 'Santé et bien-être', 10),
  (NULL, 'clinique', 'Cliniques', 'sante-bien-etre', 'Santé et bien-être', 20),
  (NULL, 'bien-etre', 'Centres de bien-être', 'sante-bien-etre', 'Santé et bien-être', 30),
  (NULL, 'fitness', 'Fitness', 'sante-bien-etre', 'Santé et bien-être', 40),
  (NULL, 'coaching-sportif', 'Coaching sportif', 'sante-bien-etre', 'Santé et bien-être', 50),
  (NULL, 'blog', 'Blogs', 'medias-contenus', 'Médias et contenus', 10),
  (NULL, 'magazine', 'Magazines', 'medias-contenus', 'Médias et contenus', 20),
  (NULL, 'actualites', 'Actualités', 'medias-contenus', 'Médias et contenus', 30),
  (NULL, 'portail-editorial', 'Portails éditoriaux', 'medias-contenus', 'Médias et contenus', 40),
  (NULL, 'restaurant', 'Restaurants', 'restauration-hotellerie', 'Restauration et hôtellerie', 10),
  (NULL, 'cafe', 'Cafés', 'restauration-hotellerie', 'Restauration et hôtellerie', 20),
  (NULL, 'hotel', 'Hôtels', 'restauration-hotellerie', 'Restauration et hôtellerie', 30),
  (NULL, 'tourisme', 'Tourisme', 'restauration-hotellerie', 'Restauration et hôtellerie', 40),
  (NULL, 'evenementiel', 'Événementiel', 'restauration-hotellerie', 'Restauration et hôtellerie', 50),
  (NULL, 'association', 'Associations', 'organisations-communautes', 'Organisations et communautés', 10),
  (NULL, 'ong', 'ONG', 'organisations-communautes', 'Organisations et communautés', 20),
  (NULL, 'fondation', 'Fondations', 'organisations-communautes', 'Organisations et communautés', 30),
  (NULL, 'organisation-professionnelle', 'Organisations professionnelles', 'organisations-communautes', 'Organisations et communautés', 40),
  (NULL, 'communaute', 'Communautés', 'organisations-communautes', 'Organisations et communautés', 50);
