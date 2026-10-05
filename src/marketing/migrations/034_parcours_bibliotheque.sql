-- Bibliothèque de parcours tout prêts : favoris et historique d'utilisation.
-- Les parcours eux-mêmes sont des données versionnées dans le code (src/marketing/automations/library) : un modèle ne
-- peut donc jamais être modifié par l'utilisation qu'on en fait. Seules deux tables, ajoutées, enregistrent ce qui
-- appartient à l'utilisateur : ses favoris (par personne) et chaque création de parcours (pour « Récemment utilisés »
-- et le compteur d'utilisation). Aucune table existante n'est modifiée.

CREATE TABLE mk_journey_favorites (
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  user_id INTEGER NOT NULL,
  journey_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (organization_id, user_id, journey_key)
);

CREATE TABLE mk_journey_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES mk_organizations(id),
  journey_key TEXT NOT NULL,
  user_id INTEGER,
  automation_id INTEGER,                     -- scénario créé (sans clé étrangère : l'historique reste si on le supprime)
  used_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mk_journey_usage_org ON mk_journey_usage(organization_id, journey_key, used_at);
