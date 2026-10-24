-- Comptes → Profil : informations et préférences PERSONNELLES d'un compte (propres à la personne, jamais à un site). Migration ADDITIVE : la table users n'est pas modifiée
-- (identifiant, e-mail, mot de passe, biographie et photo restent dans users : une seule source pour l'authentification).
--   mk_user_profiles : une ligne par compte, créée à la première modification du profil. prefs = JSON fermé (voir services/accountProfile.js : thème, barre du haut…).
--   pending_email / pending_email_at : adresse demandée par la personne, NON active tant que le lien envoyé à cette adresse n'a pas été ouvert (l'adresse vérifiée n'est jamais remplacée avant).
-- Retour arrière : DROP TABLE mk_user_profiles ; (les prénom, nom, pseudo, site web et préférences sont alors perdus : ils n'existent qu'ici).
CREATE TABLE IF NOT EXISTS mk_user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '' CHECK (length(first_name) <= 80),
  last_name TEXT NOT NULL DEFAULT '' CHECK (length(last_name) <= 80),
  nickname TEXT NOT NULL DEFAULT '' CHECK (length(nickname) <= 80),
  display_name TEXT NOT NULL DEFAULT '' CHECK (length(display_name) <= 120),
  website TEXT NOT NULL DEFAULT '' CHECK (length(website) <= 300),
  prefs TEXT NOT NULL DEFAULT '{}' CHECK (length(prefs) <= 4000),
  pending_email TEXT,
  pending_email_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
