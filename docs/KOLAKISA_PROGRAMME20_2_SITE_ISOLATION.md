# Programme 20.2 — Isolation des sites

## Mécanisme (existant, vérifié)
- Le site visé vient de l'**adresse** (`/sites/:id/...`) puis est **revérifié côté serveur** à chaque requête (`cmsAccess` / `siteContext`) ; un membre limité à un site n'obtient que celui-ci. Un identifiant envoyé par le navigateur n'est jamais cru seul.
- Les objets (pages, brouillons, domaines, modules) sont chargés **avec** leur site ; une page d'un autre site est refusée même avec son identifiant exact.
- Écritures : mêmes contrôles ; la sauvegarde d'un brouillon est de plus conditionnée à la révision (`UPDATE … AND revision = ?`).

## Preuves exécutées (`tests/programme20-2-site-builder.test.js`, serveur et base réels)
Membre limité au site A, site B secret avec une page :
- GET `/sites/B`, `/reglages`, `/domaines`, `/modules`, `/tableau-de-bord`, `/pages` → 403 ou 404, aucun nom ni titre du site B dans la réponse.
- POST nom, archiver, dupliquer, ajouter un domaine sur B → 403 ou 404 ; le site B reste inchangé et sans domaine.
- GET page B (éditeur, aperçu) et PUT brouillon avec l'identifiant seul → refusés ; le brouillon de B reste vide.
En complément, les fichiers `isolation-des-sites*.test.js`, `modules-par-site.test.js`, `medias-par-site*.test.js`, `contenus-par-site*.test.js`, etc. (voir le rapport de tests).

## Risques résiduels (déjà documentés ailleurs, non modifiés ici)
`KOLAKISA_ADMIN_MULTISITE.md` §6 : organisation unique supposée, sauvegardes globales, `/formateur` réservé au rôle formateur, slugs de formations uniques à toute la plateforme.
