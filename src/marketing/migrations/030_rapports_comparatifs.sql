-- Rapports comparatifs (point 9 du plan de parité Mailchimp) : comparer des campagnes e-mail et SMS terminées sur une
-- période, par audience, étiquette de campagne, mois, jour, heure ou canal ; enregistrer un rapport pour le rouvrir.
-- Colonnes AJOUTÉES seulement (aucune donnée existante modifiée) + une table nouvelle.

-- Étiquettes de campagne (JSON : liste de noms courts), posées depuis le rapport comparatif. Sans rapport avec les
-- étiquettes de CONTACTS (mk_tags) : elles servent seulement à ranger et comparer les campagnes.
ALTER TABLE mk_campaigns ADD COLUMN report_tags TEXT NOT NULL DEFAULT '[]';
ALTER TABLE mk_sms_campaigns ADD COLUMN report_tags TEXT NOT NULL DEFAULT '[]';

-- Rapport enregistré : un nom + ses filtres (JSON validé côté serveur à chaque ouverture, jamais exécuté tel quel)
CREATE TABLE mk_saved_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  name TEXT NOT NULL COLLATE NOCASE,
  definition TEXT NOT NULL DEFAULT '{}',
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (organization_id, name)
);
