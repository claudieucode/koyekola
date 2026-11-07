-- Retrait du module « Personnaliser » : suppression des seuls éléments qui n'appartenaient qu'à lui.
-- CONSERVÉ (partagé avec Apparence → Styles) : cms_customizer_drafts et cms_customizer_versions, ainsi que tous les sites, pages, médias, thèmes et modèles.
-- Retiré : liens d'aperçu partageables (jetons à durée limitée), planification de publication, réglages de personnalisation rangés par thème.
-- Exception documentée à la règle « migrations additives » : ces éléments n'ont plus aucun code qui les lise ; les lignes ne contenaient que des données dérivées (liens expirables, planification, copie des options d'un thème).
DROP INDEX IF EXISTS idx_cms_customizer_shares_site;
DROP TABLE IF EXISTS cms_customizer_shares;
DROP INDEX IF EXISTS idx_cms_theme_settings_site_theme;
DROP TABLE IF EXISTS cms_theme_settings;
DROP INDEX IF EXISTS idx_cms_customizer_drafts_due;
ALTER TABLE cms_customizer_drafts DROP COLUMN publish_at;
ALTER TABLE cms_customizer_drafts DROP COLUMN scheduled_by;
ALTER TABLE cms_customizer_drafts DROP COLUMN publish_error;
