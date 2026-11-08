-- Pied de page (chantier E) : historique des révisions et mémoire du modèle d'origine. Ajout seul : aucune donnée existante n'est modifiée.
-- Une révision = copie du contenu de travail d'un composant « pied de page » (enregistrement du brouillon, publication, sécurité avant un retour ou une restauration).
-- Pas de clé étrangère vers le modèle : les révisions survivent à la suppression définitive du modèle (le document, lui, reste dans les composants).
CREATE TABLE mk_tb_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  site_id INTEGER,
  template_id INTEGER,
  component_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('draft', 'publish', 'safety', 'restore')),
  hash TEXT NOT NULL,
  section TEXT NOT NULL,
  widgets INTEGER NOT NULL DEFAULT 0,
  summary TEXT NOT NULL DEFAULT '',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_tb_revisions_component ON mk_tb_revisions (component_id, id);

-- Clé du modèle de la bibliothèque dont ce pied est issu (« Revenir au modèle d'origine ») ; vide pour un pied créé autrement
ALTER TABLE mk_tb_templates ADD COLUMN origin_key TEXT;
