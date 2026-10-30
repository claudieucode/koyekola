# KOLAKISA — Palier 18 : matrice de tests

Statuts : PASS · FAIL · BLOCKED · NOT_TESTED · NOT_IMPLEMENTED. Gravité : P0 critique · P1 bloquant · P2 important · P3 mineur. « Preuve » = fichier de test ou commande rejouable (voir `KOLAKISA_PALIER18_GLOBAL_AUDIT.md` §3).

| Domaine | Scénario | Attendu | Observé | Statut | Preuve | Gravité | Action |
|---|---|---|---|---|---|---|---|
| Sites | Créer un site, ouvrir son administration, modifier ses paramètres | Site isolé, paramètres propres | OK (suites sites, paramètres, modules) | PASS | `admin-multisite`, `site-espace*`, `site-manager-central` | — | — |
| Sites | Site créé à l'instant : nom affiché dans « Informations » | Nom du site | Affichait « Site (identifiant N) » (cache) → corrigé | PASS (après correction) | `sante-du-site.test.js` ×3 | P3 | Corrigé |
| Éditeur de pages | Ouvrir, ajouter / déplacer / supprimer / dupliquer, enregistrer, recharger, publier | Persistance, rendu publié identique | Couvert par les tests navigateur (Chrome réel) | PASS | `*-navigateur.test.js` (175 fichiers), `page-builder*` | — | — |
| Éditeur de pages | Perte de connexion, très grand document | Message d'erreur, pas de perte | Non rejoué dans cette passe | NOT_TESTED | — | — | Palier 19 |
| Widgets | Insérer chaque widget, enregistrer, publier, rendre | Registre = rendu | 94/94 enregistrés, canevas OK ; 86 rendus ; 7 dans leur contexte ; « menu » sans rendu sans menu configuré | PASS avec réserve | `scripts/audit-widgets.js` | P3 | Voir défauts restants |
| Widgets | Comparer le registre à la liste documentée de widgets de référence | Écarts connus | Non refait : l'inventaire de parité existe dans `docs/audit-parite-wordpress/` | NOT_TESTED | — | — | Palier 19 |
| Contenu | Créer / modifier / publier un article ou une page, brouillon, aperçu | Statuts et permaliens corrects | OK | PASS | `articles-*`, `cms-urls`, `apparence-*` | — | — |
| Redirections | Refuser boucle, chemin interne, adresse invalide, type inconnu | Aucune ligne ajoutée | OK après mise à jour du test (307 est désormais valide) | PASS | `cms-urls.test.js` | P3 | Test corrigé |
| Thèmes / modèles | Styles globaux, modèles, rendu public | Effet visible côté public | OK | PASS | `apparence-*`, `themes-*` | — | — |
| SEO | Titres, robots, sitemap, schéma, redirections, liens internes, positions, connexions, export/import | Métadonnées produites, sauvegarde | Tests SEO passent ; connexions Google non éprouvées en réel | PASS (local) / NOT_TESTED (Google réel) | `seo-*`, `infobulles` | — | Palier 19 |
| SEO | 4 écrans du lot 2 présents dans infobulles, registres et menus | Cohérence des registres | Manquaient → ajoutés | PASS (après correction) | `infobulles`, `registre-pages`, `site-menu-*`, `entrees-fermees-preuves` | P3 | Corrigé |
| Modules | Activer / désactiver un module par site, absence de régression | Isolation, pas de casse | OK | PASS | `sante-du-site`, `modules-par-site` | — | — |
| Intégrations | E-mail, SMS, paiement, réseaux sociaux, Google | Fonctionnement réel avec le service | Logique testée avec doublures ; service réel non connecté | NOT_TESTED (externe) | — | — | Palier 19 |
| Rôles | Rôles et restrictions | Droits appliqués côté serveur | OK | PASS | `utilisateurs-droits-par-site`, `admin-multisite`, `palier18-isolation` | — | — |
| Isolation | Compte limité au site A ne lit/écrit pas le site B (accès direct, `?site=` falsifié, champ de formulaire falsifié) | Refus, données B intactes | OK, avec contrôle positif | PASS | `palier18-isolation.test.js` (7 cas) | — | — |
| Isolation | Table de portée : adresse × méthode × variante | Mêmes résultats que l'oracle | OK après mise à jour du test pour 16 règles postérieures | PASS | `portee-des-routes.test.js` | P3 | Test corrigé |
| Domaines | Hôte forgé, domaines vérifiés, routes publiques / admin | 421 / bon site | OK | PASS | `domaines-*`, `cms-urls` | — | — |
| Sécurité | Entrées malveillantes, CSP, en-têtes | Échappement, refus | OK | PASS | `securite-*`, `audit-corrections` | — | — |
| Sécurité | Dépendances à vulnérabilité connue | 0 vulnérabilité haute | 6 → 0 | PASS (après correction) | `npm audit --omit=dev` | P2 | Corrigé |
| Téléversements | Taille, type, nom, traitement | Refus des fichiers dangereux | OK avec multer 2.5.0 | PASS | 157 fichiers (2 207 tests) | — | — |
| Base de données | Clés étrangères indexées | Aucun index manquant | 2 manquants → migration 115 | PASS (après correction) | `audit-corrections.test.js` (D3) | P2 | Corrigé |
| Base de données | Migrations : ordre, idempotence, mise à niveau depuis 113 | Appliquées dans l'ordre, sans perte | OK ; test mis à jour pour attendre 114 puis 115 | PASS | `palier12-migration-composants-revision.test.js`, `site-espace.test.js` | — | — |
| Base de données | Migration R9 « site maître » : application et retour arrière sous trafic | Pas d'annulation à tort | Écriture concurrente (journal 404) l'annulait → comptage sous verrou | PASS (après correction) | `r9-site-maitre-effets-application.test.js` | P2 | Corrigé |
| Base de données | Inventaire des tables classées par isolation | Toute table classée | 3 tables à classer → ajoutées | PASS (après correction) | `site-espace-unitaire.test.js` | P3 | Corrigé |
| Sauvegarde | Sauvegarde cohérente + vérification d'intégrité + restauration | Base relue et intègre | OK | PASS | `sauvegarde-restauration.test.js` | — | — |
| Sauvegarde | Lanceur SSH de recette de production | Diagnostic, simulation, sauvegarde | 4 tests en échec (environnement : Node ≥ 22, branche `r8-recette-outil`) | FAIL (préexistant) | `r9-lancer-recette-prod.test.js` | P3 | Défauts restants |
| Effacement de données | Création, e-mail, confirmation, effacement | Demande « Échouée » si e-mail non parti | 1 test en échec (étiquette absente dans la liste filtrée) | FAIL (préexistant) | `effacer-donnees.test.js` | P3 | Défauts restants |
| Design | Violet, ombres dures, bandeaux, classes orphelines | Charte respectée | 5 tests en échec (≈ 95 classes sans style, options d'ombre franche et dégradé violet de l'éditeur de blocs) | FAIL (préexistant) | `refonte-design.test.js`, `etape0-design.test.js` | P3 | Défauts restants |
| CSS | Listes déroulantes gardent leur flèche ; échelle de superposition | Pas de `background:` sur `select`, pas de `z-index` ≥ 500 | 2 violations → corrigées | PASS (après correction) | `listes-deroulantes`, `menus-flottants` | P3 | Corrigé |
| Responsive | 120 écrans × 390/768/1280 px | Pas de débordement | 0 débordement de page ; 1 élément hors cadre (éditeur d'articles à 390 px, 16 px) ; 46 petites cibles | PASS avec réserve | `scripts/audit-responsive.js` | P3 | Défauts restants |
| Accessibilité | Focus, libellés, contrastes, WCAG complet | Conformité démontrée | Vérifications partielles seulement | NOT_TESTED (WCAG complet) | tests de contraste/libellés existants | — | Palier 19 |
| Performance | Poids des feuilles de style et scripts ; compression | Compression active | gzip actif (`compression`) ; `style.css` 223 Ko → 45 Ko gzip ; plus gros scripts : blog-editor 922 Ko, page-builder 770 Ko (non compressés) | PASS (statique) | `server.js`, mesures de taille | — | Mesures temporelles : NOT_TESTED |
| Qualité | Lint, types, compilation de production | Contrôles exécutés | N'existent pas dans le projet | NOT_IMPLEMENTED | `package.json` | — | Palier 19 |
| Déploiement | Retour arrière, publication Hostinger | Vérifiés | Aucun accès | BLOCKED | — | — | Palier 19 |
