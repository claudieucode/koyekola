# 17 - Administration, permissions, import/export, sauvegardes, multisite

Date de consultation : 2026-10-29. Statuts : officiel / observation / hypothèse.

## 1. Role Manager (officiel, `kb/role-manager/`)

- Module activable : Rank Math SEO > Dashboard > Modules. Niveau : listé comme fonction cœur (« Role Manager ») sur free-vs-pro.
- Rôles WordPress gérés : Administrator, Editor, Author, Contributor, Subscriber, Customer, Shop Manager, Keymaster, Spectator, Blocked, Moderator, Participant, plus rôles personnalisés.
- 16 capacités par rôle : Titles and Meta, General Settings, Sitemap Settings, 404 Monitor Log, Link Builder, Redirections, Role Manager, Analytics, Site-Wide Analysis, On-Page Analysis, On-Page General / Advanced / Schema / Social Settings, Content AI, Top Admin Bar.
- Comportement : une capacité retirée disparaît du menu et est bloquée par URL directe (« Sorry, you're not allowed to access this page »). Bouton Toggle All, Reset. La capacité Role Manager de l'administrateur est désactivée par défaut pour éviter les erreurs. Autres valeurs par défaut non listées.
- Pertinence Kolakisa : élevée. Mapper ces 16 capacités sur les rôles `/formateur` et par site (`site_id`), avec vérification côté serveur de chaque route (pas seulement masquage de menu). Dépendance WP : système de rôles/capacités WordPress, à remplacer par le modèle de Kolakisa.

## 2. Import / export (officiel, `kb/import-export-settings/`)

- Emplacement : Status & Tools > Import & Export (mode avancé).
- Export, combinaison au choix : General Settings, Titles and Meta, Sitemap Settings, Role Manager Settings, Redirections. Fichier horodaté sans trace des sections choisies ; format non précisé.
- Import : écrase les réglages courants ; une sauvegarde automatique est créée avant.
- Sauvegardes : bouton « Create Backup » (un clic, horodatée). La restauration écrase sans nouvelle sauvegarde.
- Importeurs d'autres extensions : Yoast, All in One SEO, SEOPress ; redirections/schema depuis Redirection, Schema Pro, All in One Schema (free-vs-pro : « 1 Click Import »).
- CSV (PRO) : export/import des métadonnées SEO d'articles, termes, utilisateurs. Free-vs-pro liste aussi « Import/Export Focus Keywords », « Import Redirections Data via CSV » et « Export 404 Log ».
- Pertinence Kolakisa : export JSON versionné par site, import avec diff + sauvegarde obligatoire, importeur CSV de méta SEO, et importeurs Yoast/Rank Math en lecture (hypothèse de design). Ne pas copier le format propriétaire.

## 3. Multisite

- Free-vs-pro : « Multisite Compatible » (listé sur toutes les offres).
- Page KB multisite : `kb/rank-math-multisite/` et `kb/multisite/` renvoient 404 ; détails réseau (réglages réseau, licence) **non documentés** ici. L'import/export ne mentionne pas le multisite.
- Licences : PRO = sites personnels illimités ; Business = 200 sites clients et personnels ; Agency = 750 sites clients (pricing). Plateforme « Support for Client Sites » / « Client Management » listés sur free-vs-pro (détail non lu).
- Pertinence Kolakisa : multi-sites natif (`site_id`). Reprendre : paramètres globaux par défaut + surcharge par site, export/import par site, quotas par site.

## 4. Autres éléments d'administration

- Rank Math Vault (vault.rankmath.com) : partage de identifiants au support via lien secret autodestructible, passphrase optionnelle, expiration 7 jours (officiel, `kb/how-to-use-vault/`). Service externe lié à SEO Care ; offre non précisée. Non pertinent pour Kolakisa.
- Mode simple/avancé de l'interface (les menus Import/Export, Link Counter reset, Others n'apparaissent qu'en mode avancé).
- Support 24/7, contrôle de version (rollback du plugin, free-vs-pro), mises à jour auto.
- Sécurité des intégrations : mot de passe d'application WordPress pour MCP (voir 15).
- Éditeur .htaccess et robots.txt avec sauvegarde automatique avant modification (`kb/general-settings/`) : dépendant d'Apache/WordPress ; équivalent Kolakisa = robots.txt par site stocké en base.

## 5. Sources

| URL | Date | Statut |
|---|---|---|
| https://rankmath.com/kb/role-manager/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/import-export-settings/ | 2026-10-29 | officiel |
| https://rankmath.com/kb/general-settings/ | 2026-10-29 | officiel (100 000 caractères sur 105 082 lus) |
| https://rankmath.com/kb/how-to-use-vault/ | 2026-10-29 | officiel |
| https://rankmath.com/free-vs-pro/ | 2026-10-29 | officiel |
| https://rankmath.com/pricing/ | 2026-10-29 | officiel |

## 6. Lacunes

- Pages multisite : 404 sur deux URL devinées ; comportement réseau non documenté.
- Format de fichier des exports, valeurs par défaut des rôles, détail « Client Management » : non documentés.
