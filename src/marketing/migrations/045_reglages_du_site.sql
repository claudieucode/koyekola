-- Réglages du site (éditeur de pages) : le centre de configuration global d'un site.
-- Les couleurs, polices et styles du thème vivent dans mk_sites.tokens (design system, voir pages/tokens.js).
-- Les autres réglages (identité, arrière-plan, mise en page, visionneuse, transitions, CSS personnalisé, réglages
-- supplémentaires) vivent dans cette colonne JSON, validée par pages/siteSettings.js : l'ajout d'un réglage ne demande
-- donc plus de migration. La révision détecte les enregistrements concurrents (autre onglet, autre personne).
ALTER TABLE mk_sites ADD COLUMN settings TEXT NOT NULL DEFAULT '{}';
ALTER TABLE mk_sites ADD COLUMN settings_revision INTEGER NOT NULL DEFAULT 0;
