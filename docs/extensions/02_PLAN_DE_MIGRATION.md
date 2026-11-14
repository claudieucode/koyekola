# Extensions — plan de migration par paliers

Principe : **faire grandir le socle R7**, ne rien reconstruire. Chaque palier est indépendant, testé, documenté, et ne démarre que si le précédent est sans erreur. Aucune migration destructive ; les tables `mk_site_modules`, `mk_shop_*`, `mk_course_sites` et celles du LMS ne sont ni renommées ni vidées.

| Palier | Contenu | Fichiers principaux | Risque | Retour arrière |
|---|---|---|---|---|
| **P1** (fait) | Audit + plan | `docs/extensions/*` | nul | supprimer les 2 fichiers |
| **P2** | **Registre central + manifeste** : format de manifeste (identité, version, compatibilité, dépendances, permissions, menus, routes, migrations, paramètres, ressources), validation stricte, versionnement semver ; les 6 modules actuels déclarés par manifeste (même clés : `sms, ai, social, scoring, commerce, lms`) ; `siteModules.MODULES` devient une vue du registre | nouveau `src/extensions/` ; `siteModules.js` (adaptateur) | faible | l'adaptateur relit l'ancien objet |
| **P3** | **Activations par site atomiques** : migration additive `mk_extension_events` (historique), transaction unique, vérification des dépendances et incompatibilités, confirmation, journal ; cache par site invalidé à chaque changement | `src/extensions/activation.js`, migration 153 | moyen | DROP de la nouvelle table seulement |
| **P4** | **Moteur d'exécution** : routes, menus, permissions, hooks, événements, tâches déclarés par le manifeste ; montage **à la demande** et garde serveur unique `extensionGuard` | `src/extensions/runtime.js` | moyen | garde désactivable par une constante |
| **P5** | **Menu Extensions complet** : Toutes / Activées / Désactivées / Gestion / Historique, aux jetons du design system ; choix du site ; confirmations | `cmsNav.js` (en une session), vues | moyen (fichier partagé) | retour à la rubrique « Modules » |
| **P6** | **Commerce → « Kolakisa Commerce »** : manifeste, garde des routes `/boutique/*` d'admin et des API, navigation dynamique ; aucune ligne de logique commerciale déplacée | `shopAdmin.js` (une garde), `cmsNav.js` | élevé (58 tables, paiements) | retirer la garde |
| **P7** | **LMS → « Kolakisa LMS »** : manifeste, garde de `/formateur` et des routes élève selon le site, entrée « Formation » dans le menu ; pont de droits `/formateur` ↔ permissions | `routes/instructor.js` (garde), `cmsNav.js` | élevé | retirer la garde |
| **P8** | **Sécurité et isolation** : tests croisés site A / B (Commerce, LMS, API, routes), permissions, élévation de droits | tests | — | — |
| **P9** | **Performance** : mesure avant/après du démarrage et d'une requête ; chargement à la demande | tests de charge | — | — |
| **P10** | **Tests de bout en bout et régression** (suites boutique-*, lms-*, isolation-*, header/footer) | `tests/extensions-*.test.js` | — | — |
| **P11** | **Documentation développeur** : créer une extension en 12 étapes, exemple complet | `docs/extensions/` | — | — |

## Décisions de conception proposées (à valider ou à trancher par défaut)
1. **Site principal** : reste « toujours actif » pour les extensions historiques (aucun changement de comportement). Les nouvelles extensions peuvent, via leur manifeste, être soumises à l'activation aussi sur le principal.
2. **Clés stables** : `commerce` et `lms` gardent leur identifiant technique ; noms affichés « Kolakisa Commerce » et « Kolakisa LMS ».
3. **Registre en code** (manifestes versionnés dans le dépôt, validés au démarrage) plutôt qu'en base : une extension n'est pas dupliquée par site, et un déploiement unique la rend disponible partout. L'état par site reste en base.
4. **Désactivation** : refuse l'accès (404 public / 403 admin), masque les menus, met les tâches en pause ; **ne supprime jamais de données**.
5. **Activation** réservée à l'équipe de l'organisation, comme aujourd'hui (la permission `sites.modules` reste), avec confirmation et dépendances vérifiées.

## Ce qui sera vérifié à chaque palier
Suites de référence à rejouer avant et après : `modules-par-site`, `lms-par-site`, `lms-par-site-unitaire`, `boutique-*`, `isolation-*`, `header-isolation`, `footer-isolation*`, `admin-multisite`, `centre-gestion-isolation`, plus `scripts/audit-interface.js` pour toute vue.
