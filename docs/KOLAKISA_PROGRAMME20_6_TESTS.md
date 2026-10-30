# Programme 20.6 — tests

Fichier : `tests/assistant-creation-site.test.js` — 18 tests, vrai serveur et vraie base d'essai (aucun appel externe, aucune transaction financière).

| Scénario | Vérifié |
|---|---|
| Catalogues | chaque gabarit, pack et module cité existe ; fuseaux IANA, devises, langues valides ; formats Intl différents FR/US |
| Accueil | trois modes, types, modèles, mention honnête de la boutique |
| A site vierge | site actif, une page d'accueil en brouillon, ligne de progression |
| B modèle | pages importées en brouillon, menu, import tracé ; modèle inconnu → aucun site |
| C boutique | type boutique, Commerce **non** activé seul, pas de panier proposé, activation explicite sans autre module |
| D éducatif | structure créée, module Formations refusé (non ouvert aux sites), Réservation « non disponible » |
| E identité | jetons du site modifiés ; couleur et police invalides refusées sans rien changer |
| F pages | ajout, renommage, accueil protégé, corbeille, ordre, menu dans l'ordre choisi |
| G reprise | brouillon sauvegardé, conflit 409, reprise, liste des créations |
| H aperçu | trois largeurs, vrai aperçu de page (200), textes d'exemple signalés |
| I pays | CD, GB, CH : devise et fuseau ; pays, fuseau, devise, e-mail, langue invalides refusés |
| J intégrations | absente/incluse non activable ; prérequis affichés ; aucune publication sociale créée |
| K isolation | site A ≠ site B (lecture, écriture, sauvegarde, publication, page détournée), création réservée à l'équipe, lecteur, anonyme |
| L publication | refus sans confirmation, refus sans droit, résultat page par page, domaine inchangé |

## Résultats (dernière exécution)
- `tests/assistant-creation-site.test.js` : **18/18**.
- Régression ciblée (9 fichiers : assistant, portee-des-routes, site-manager-central, modules-par-site, apparence-templates, menu-site-inventaire, audit-sites-interface, palier12-migration, cadre-cms-structure) : **100 tests, 100 réussis, 0 échec**.
- La suite complète du projet n'a **pas** été exécutée.

## Non testé
Rendu visuel dans un navigateur (aucun navigateur piloté dans cette session) ; JavaScript du cadre (réorganisation, aperçu des couleurs, envoi du logo) ; performance chiffrée ; appareils mobiles réels.
