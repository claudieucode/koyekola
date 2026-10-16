# MP — Moteur central des pages : audit et rapport (16/10/2026)

> **Désignation corrigée le 16/10/2026** : ce chantier s'appelle **MP** (« moteur des pages »). Le numéro **R6** reste celui du plan officiel (« Contenus par site »), non commencé. La branche (`r6-moteur-pages`), le dossier de ce document et le commit `9f3702a` gardent leur nom d'origine : l'historique Git et les sauvegardes ne sont pas modifiés. Voir `02-feuille-de-route-et-suivi-MP.md`. Dans la suite de ce rapport, « R6 » désignait ce chantier : lire « MP ».

Branche `r6-moteur-pages` (dossier `~/ClaudeProjects/KOYEKOLA-r6-moteur-pages`), créée depuis R5 `1d2606f21a82b579caa5eb384da64d9aefcbaffb` (le plan officiel donne R5 comme prérequis). **HEAD final : `9f3702add471632bc22b55c88530c3535c6ebfaf`.** Locale, non poussée, non fusionnée, non déployée.

## 0. Point d'attention (résolu) : le numéro « R6 » ne désignait pas la même chose que dans le plan officiel
`docs/decision-refonte-sites-2026-10-15/05-plan-par-paliers.md` définit R6 comme **« Contenus par site (articles, taxonomies, commentaires, adresses) »** (migrations avec reconstruction de tables, décision D7). La demande reçue définit R6 comme **le moteur central des pages**. J'ai réalisé la demande reçue, sous le nom R6 ; le R6 du plan officiel (articles/taxonomies/adresses) **n'est pas fait** et n'est pas touché. **Décision prise (16/10/2026)** : ce chantier devient MP ; R6 officiel est préservé.

## 1. Audit : l'existant (réutilisé, rien réécrit)
Le moteur central existe déjà, complet et testé : `src/marketing/pages/index.js` (+ `cmsPages.js`, `nodes.js`, `sections.js`…) et `web/landing.js`. Table unique `mk_landing_pages` (colonnes `site_id`, `status`, `draft`, `sections`, `revision`, `archived_at`…), versions `mk_page_versions`, historique commun `services/revisions`. Déjà présents et vérifiés par de nouveaux tests :
créer (formulaire, JSON, modèles), renommer (nom unique contrôlé), enregistrer avec contrôle de révision (révision périmée ou absente refusée, brouillon intact), publier / mettre hors ligne / programmer / annuler la programmation, versions et restauration d'une version dans le brouillon, dupliquer (hors ligne, nouveaux identifiants de section, références médias conservées), archiver / restaurer / supprimer définitivement (seulement depuis la corbeille, versions supprimées avec la page), actions groupées, export/import d'une page, accueil du site, rendu public (`/p/<adresse>`). Aucun second registre, second système de droits ni second moteur de rendu n'a été créé.

## 2. Écarts réels trouvés (par des tests écrits avant les corrections) et corrigés
1. **Déplacer une page** : le service `movePage` existait mais **aucune route ni écran** ne l'exposait. Ajouté : `POST /marketing/pages/:id/deplacer` (droit d'écrire sur la page, droit sur le site d'arrivée via `ctx.canOn`, site principal réservé à l'équipe, page à la corbeille refusée) + formulaire « Déplacer » dans le menu de chaque ligne de la liste des pages. Le service conserve le contenu, retire l'accueil et les liens hiérarchiques de l'ancien site, suit les tests A/B, refuse un composant propre à l'ancien site ou une étape de tunnel.
2. **Création / import JSON refusés à un accès limité à un site** : `POST /pages/creer.json` (dialogue de nommage de l'éditeur) et `/pages/importer.json` étaient classés « sans site » par la garde, donc **403 pour une personne qui n'a accès qu'à son site**. Règles de portée ajoutées dans `web/index.js` (site lu dans le corps validé) ; le contrôle du nom en direct (`nom.json`) reçoit `?site=` depuis l'éditeur.
3. **Portée absente du service** : seule la garde des routes limitait un accès à son site. Ajouté au service (`getPage`, `createPage`, `duplicatePage`, `movePage`, `importPage`, `bulk`) : un contexte `ctx.siteScope` ne lit ni n'écrit hors de son site (page d'un autre site = introuvable). Défense en profondeur ; les routes restent la première barrière.
4. **Actions groupées** : le droit était évalué une seule fois pour l'organisation. Désormais contrôlé **page par page sur le site de chaque page** (`ctx.canOn`), donc le plafond de droits de R3 s'appliquera automatiquement à l'intégration. Une page refusée est signalée sans arrêter les autres.
5. Une page à la corbeille ne peut plus être déplacée.

## 3. Fichiers modifiés
`src/marketing/pages/index.js`, `src/marketing/pages/cmsPages.js`, `src/marketing/web/landing.js`, `src/marketing/web/index.js`, `public/js/page-builder.js` (une ligne : `&site=`), `views/marketing/landing-list.ejs` ; tests `tests/moteur-pages.test.js` (16, bout en bout) et `tests/moteur-pages-unitaire.test.js` (3, service). **Aucune migration** : aucune n'est nécessaire (aucune donnée à ajouter).

## 4. Tests réellement exécutés (environnement jetable `env -i`)
- Nouveaux : 19/19 (cycle de vie, conflit de révision 409 sans écrasement, publication/programmation, duplication, archivage/suppression, actions groupées, déplacement, isolation d'un accès limité au site A sur 15 routes de la page du site B plus création/import/déplacement/masse vers B, rendu public d'une page existante identique après des opérations sur d'autres pages, formulaire de déplacement de la liste).
- Non-régression : 540/540 (pages, révisions, URLs, outils, tunnels, A/B, contacts, e-mail, éditeur, modèles, en-tête, isolation des sites, espace de site, menu, formats, médias par site) puis 77/77 après la dernière modification de vue.
- Mutations de contrôle (7) : 4 détectées (garde de création JSON, portée de `getPage`, droit page par page, page à la corbeille). 3 survivent car **redondantes avec une autre couche** (droit sur le site d'arrivée côté route ; site principal réservé à l'équipe côté route ; portée dans `movePage`) : retirer une seule couche laisse l'autre refuser. La couche « route » ne devient indispensable qu'avec le plafond de droits de R3 (non intégré ici) : elle n'est donc pas démontrable seule aujourd'hui.
- Non exécuté : aucun test navigateur ; la présentation du formulaire « Déplacer » dans le menu n'a **pas été vérifiée visuellement** (aucune règle CSS ajoutée). Suite complète non relancée.

## 5. Risques et limites
- Rendu responsive, structure (sections/conteneurs/composants) et références médias : **non modifiés** ; vérifiés seulement par conservation du contenu lors du déplacement/duplication et rendu public identique. La refonte graphique du tableau de bord Site Web et le constructeur visuel ne sont pas touchés (livrable à suivre séparément).
- Le déplacement ne propose que « une page vers un site » (pas de réorganisation hiérarchique parent/enfant) ; les liens parent/enfant sont retirés.
- Le droit « sur le site d'arrivée » des actions groupées utilise `canOn` qui refuse les sites archivés : les pages d'un site archivé ne se traitent pas en masse (comportement voulu et testé).
- Le modèle où les pages sont de site (`site_id`) ou de site principal (NULL) reste inchangé ; l'unicité d'adresse reste globale (traitée par le R6 du plan officiel, non fait).

## 6. Dépendances
R2 : aucune. R3 : à l'intégration, les règles de portée de `routeScopes.js` devront inclure `/pages/creer.json`, `/pages/importer.json`, `/pages/nom.json` ; le plafond de droits s'appliquera aux actions groupées par `canOn`. R4 : la liste des pages (`/pages`) devra utiliser son filtre de visibilité. R5 : les médias des pages (adresses `/uploads/marketing/…`) sont conservés tels quels ; aucun fichier n'est touché.

## 7. État Git
Autres branches inchangées : R2 `3a01d4a`, R3 `a26b362`, R4 `c03fde9`, R5 `1d2606f`, C `49a587d`, source `70c3f51`. Aucun push, aucune fusion, aucun déploiement ; R7 non commencée. Neuf processus `server.js` tournent sur la machine ; origine établie par leur dossier de lancement et leur date : ils datent de 4 à 5 jours (ou de ce matin pour `KOYEKOLA-accueil`) et dépendent des dossiers `KOYEKOLA-deploy`, `KOYEKOLA-studio`, `KOYEKOLA-accueil` et `/private/tmp/wt-base` : ce sont d'autres sessions, aucun ne vient de mes tests. Non touchés.

## 8. Critères MP restant à satisfaire
Vérification visuelle réelle de la liste et du menu « Déplacer » ; refonte graphique du tableau de bord Site Web (explicitement hors R6) ; test de non-régression complet ; démonstration de la couche « route » du droit d'arrivée avec R3 intégré ; R6 officiel (contenus par site) à réaliser.


---

## 9. Finalisation des vérifications MP (16/10/2026, suite)
HEAD final : **`0df611ff30103bae18707b06a0d3d0f5c0df4632`** (un commit de plus que `9f3702a`, base R5, branche `r6-moteur-pages`, locale, non poussée).

**Contrôle visuel réel effectué** : Chrome (Playwright, vrai serveur, base jetable), test `tests/moteur-pages-navigateur.test.js` 6/6, 7 captures **regardées une par une**. Constatations : formulaire « Déplacer » (liste déroulante + bouton) visible, aligné et lisible dans le menu de la ligne, dans la fenêtre à 1280 px comme à 390 px, sans débordement ni défilement horizontal, sans erreur de script ; confirmation « Déplacer cette page ? » lisible ; refus de destination invalide / non autorisée affichés par un message rouge en haut de la page de la page concernée, la page ne bouge pas ; aucun formulaire dans la Corbeille et envoi forcé refusé par le serveur. Premières captures prises pendant l'animation d'ouverture (menu à demi transparent) : le test attend maintenant la fin de l'animation. États « chargement » : n'existent pas (envoi de formulaire classique). Limites visuelles : navigateur unique (Chrome), pas de test tactile, pas de contrôle des contrastes mesuré ; le bouton de confirmation est **rouge** (composant commun `mkConfirm`, style « danger » pour toutes les confirmations) : non modifié ici.

**Défaut démontré et corrigé** : un compte autorisé en écriture sur la page source ET sur le site d'arrivée ne pouvait pas déplacer la page (la portée « un seul site » du service refusait le site d'arrivée). Corrigé dans la route : droits vérifiés sur la source et sur la destination (`canOn`), puis portée levée pour ce seul déplacement. Test multi-comptes ajouté (autorisé ; lecteur sur la destination ; sans accès à la destination ; sans accès à la source ; site principal) ; confirmé par mutation (retirer la levée fait échouer le test).

**Routes et protections (distinguées)**
| Route | Protection présente dans MP | Dépend de R3 | Dépend de R4 |
|---|---|---|---|
| `POST /pages/:id/deplacer` | garde de portée par la page (source) ; droit d'écriture sur la source et sur la destination (`canOn`) ; site principal réservé à l'équipe ; page à la corbeille refusée ; portée dans le service | plafond de droits par site sur source et destination (via `canOn`/`effectivePermissions`, automatique) ; **aucune nouvelle règle de portée à ajouter** : la règle « page par identifiant » de R3 (`/pages/<id>`) la couvre déjà | — |
| `POST /pages/creer.json`, `POST /pages/importer.json` | règle de garde sur `siteId` du corps ; portée dans le service | **règles à ajouter** dans `routeScopes.js` de R3 (R3 ne résout pas ces adresses : un accès limité y serait refusé) | — |
| `GET /pages/nom.json` | règle de garde sur `?site=` ; le nom reste unique à l'organisation | **règle à ajouter** dans R3 | — |
| `POST /pages/actions` | droit par page sur son site ; pages d'un autre site « introuvables » pour un contexte limité | le plafond s'applique via `canOn` | filtre de visibilité de la liste `/pages` à appliquer |
Distinction importante : ce qui est dit « dépend de R3/R4 » n'est **pas testé** ici (branches non intégrées) ; seules les protections de la colonne MP sont testées.

**Tests (résultats réels)** : nouveaux 19 + 2 (multi-comptes) + 6 navigateur ; non-régression ciblée **693/693** (pages, révisions, éditeur, modèles, outils, tunnels, A/B, contacts, e-mail, navigation, SEO, articles, isolation, espace de site, médias par site) ; mutations 9 : 7 détectées, 2 survivantes (`deplacer-principal`, `source-droit`) car chacune est doublée par un autre contrôle de la même route (`canOn` refuse déjà le site principal à un accès limité ; la garde de la route couvre déjà la source). **Suite complète NON lancée** : 407 fichiers de tests, machine partagée (charge ~3, neuf serveurs d'autres sessions actifs) ; à lancer sur une machine disponible à l'intégration. Aucun test ignoré dans les lots exécutés.

**Documents** : intégrés au suivi Git de la branche `r6-moteur-pages` sous `docs/mp-moteur-pages/` par un commit documentaire séparé (voir l'historique de la branche). Le plan officiel cité (`docs/decision-refonte-sites-2026-10-15/05-plan-par-paliers.md`) n'est **pas** dans cette branche : il reste dans le dossier de travail `KOYEKOLA-deploy` (non suivi) et n'a pas été modifié.
