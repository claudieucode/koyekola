# Tests et résultats (exécutés le 14/11/2026)

## Nouveaux tests (40, tous verts)
| Suite | Tests | Couvre |
|---|---|---|
| `extensions-registre` | 9 | versions et plages ; 30 défauts de manifeste refusés ; cohérence du registre (doublon, dépendance absente, version non satisfaite, cycle, conflit, permission inconnue, incompatibilité Kolakisa) ; registre figé ; six extensions réelles (icônes, documentation, migrations, fichiers d'entrée) ; une seule extension par chemin ; « un fichier = une extension » |
| `extensions-activation` | 15 | migration 153 (journal en lecture seule, organisation cohérente, rejouable) ; activation/désactivation confirmée, idempotence, journal avec version ; dépendances ; conflits, indisponible, maintenance, obsolète ; plan sans écriture ; **atomicité** (échec d'une étape → état identique, échec journalisé) ; étape exécutée dans la transaction ; accès (limité au site, permission, autre organisation, site supprimé, extension inconnue) ; 3 sites indépendants ; principal ; cache (cette connexion et autre processus) ; **conservation des données** et réactivation ; paramètres par site validés et isolés ; historique filtré |
| `extensions-serveur` | 11 | serveur réel, 3 sites : cinq rubriques, accès équipe / refus limité ; Commerce désactivé (écrans d'admin en lecture et écriture 403, aucune donnée créée) ; activation individuelle ; boutique publique par domaine ; désactivation confirmée, données conservées, réactivation ; **navigation dynamique** (menu Boutique / Formation par site, pas de doublon, principal inchangé) ; LMS par domaine ; **3 configurations simultanées** en parallèle ; erreurs ; historique ; ancien écran « Modules du site » |
| `extensions-performance` | 5 | registre chargé une fois ; 20 000 contrôles en cache < 2 s ; requête hors extension = 0 requête SQL ; un site ne lit que sa ligne ; étape de cycle de vie chargée à l'activation seulement |

## Régression (suites existantes, rejouées sur le code final)
Passent : modules-par-site (14), lms-par-site (10), lms-par-site-unitaire (13), admin-multisite (26), isolation-des-sites (28), isolation-des-sites-caches (17), centre-gestion-isolation (5), commerce-par-site (7), revenus-par-site (11), sms/score/reseaux/ia-par-site, r7-coherence-moteurs (6), r7-retours-arriere (4), cms-users (42), navigation-par-site (8), matrice-droits-espace (17), utilisateurs-droits-par-site (4), assistant-creation-site (18), marketing-fondations (31), programme20-5-boutique-builder (12), et les **24 suites boutique** (rdv, securite, factures, abonnements, admin-complements, api-evenements, age, briques, charge, comparateur, compte-invite, creneaux, liste-cadeaux, lot2-robustesse, membre, passerelles, rapports, remboursements, taxes-expedition, telechargements, theme-builder-pages, widgets-fiche, admin-refonte, editeur-boutique).

## Ce que les tests ont attrapé (corrigé)
- Les anciens tests boutique **configuraient la boutique avant d'activer le module** : c'est exactement ce que la nouvelle règle interdit. Ordre corrigé dans 21 fichiers de test (le code métier n'a pas bougé).
- Un test unitaire modifiait `mk_site_modules` en SQL direct sur la même connexion : le cache ne le voyait pas. Le cache surveille maintenant aussi `total_changes()`.
- Menus : les tests de structure comptaient des entrées codées en dur ; adaptés (Extensions = 5 rubriques, groupe « Formation »).

## Échecs déjà présents sur `main` (vérifié sur une copie propre, non causés par ce chantier)
cms-01-navigation « tous les écrans du registre », cms-interface « chaque écran répond 200 », site-menu-c1 « entrées non ouvertes », site-menu-p1a « aucune migration ajoutée », menu-site-inventaire (3), entrees-fermees-preuves (2), site-espace (3), site-espace-unitaire (2 : tables non classées, dont beaucoup `mk_shop_*`), theme-builder-catalogue « footer : 100 modèles ».

## Vérification visuelle (Chrome, 3 largeurs : 1440 / 820 / 390)
7 écrans × 3 largeurs : aucun débordement horizontal, aucune image cassée ; tableaux en cartes sur mobile ; menu d'un site avec Boutique seulement si Commerce est activé.

## Limites
- Les routeurs Commerce et LMS ne sont pas déchargés de la mémoire à la désactivation : ils sont fermés par garde (voir `04_ARCHITECTURE_DU_MOTEUR.md`).
- Les 6 extensions historiques ne déclarent ni tâche planifiée ni hook : l'exécution de ces deux types n'est donc pas encore branchée (déclarés et validés dans le manifeste).
- Pas de test de charge réel avec des centaines de sites ; le coût mesuré est celui du contrôle d'activation (20 000 en < 2 s) et des requêtes hors extension (0 requête SQL).
