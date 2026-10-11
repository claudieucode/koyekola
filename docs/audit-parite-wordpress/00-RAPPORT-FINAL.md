# Palier 23 — Audit de parité fonctionnelle WordPress / KOLAKISA : rapport final

*Date : 2026-10-10. Branche locale `audit-parite-wp`, worktree `KOYEKOLA-audit23`, basée sur `origin/main` (7a6f804). **Aucun code de l'application n'a été modifié.** Rien n'est poussé.*

Fichiers du dossier : `01-matrice-parite.md` (+ `.csv`) · `02-registre-anomalies.md` · `03-inventaire.md` · `04-plan-remediation.md` · `05-score-parite.md` · `06-preuves.md`. Sondes et sorties brutes : `audit-parite/`.

---

## 1. Résumé exécutif

- **Verdict** : KOLAKISA est un vrai CMS, pas une façade. Sur 182 capacités examinées (4 non applicables), **119 sont complètes et validées**, 29 partielles ou non validées, 24 absentes, 4 en doublon, 2 décoratives (commandes désactivées et libellées), **0 buguée**.
- **Score central de parité fonctionnelle : 80 %** (fourchette 73 % strict → 85 % optimiste). Il vaut pour **ma liste de capacités**, pas pour « tout WordPress ». Détails et limites : `05-score-parite.md`.
- **Aucune anomalie critique (P0)**. Aucune route d'administration ouverte à un anonyme (360 sur 360 redirigées) ni à un compte non membre (360 sur 360 refusées). Aucune donnée de production modifiée.
- **Un seul problème élevé (P1)** : **seul le compte créateur peut écrire des articles**. Éditeur, Auteur, Contributeur et même Administrateur ne peuvent ni créer ni ouvrir l'éditeur (vérifié, 403). C'est le plus gros écart avec WordPress pour un travail d'équipe.
- **Écarts moyens (P2) les plus visibles** : pas de flux RSS, pas de recherche globale, pages non indexées par défaut, pas de programmation des pages, multi-site limité aux pages (le blog, les catégories, les commentaires et les médias n'ont pas de site), pas de copie locale de secours dans le Page Builder, sauvegardes sur le même disque, pas de double authentification, pas d'API de contenu.
- **Ce qui est solide** (prouvé par tests et sondes) : pages et Page Builder, SEO réellement présent dans le HTML, redirections, navigation, taxonomies, médiathèque, commentaires, révisions, permissions côté serveur, XSS, import/export, et les 7 moteurs KOLAKISA.
- **Le défaut de lisibilité de la Médiathèque signalé dans l'éditeur n'a pas été reproduit** : 10 textes mesurés, aucun sous le seuil de contraste, en thème clair et sombre (la fenêtre reste blanche en thème sombre : esthétique).
- **Limite honnête** : la plupart des « validés » reposent sur les suites écrites aux paliers précédents. Je les ai relancées et recoupées par mes propres sondes, mais ce n'est pas un audit externe.

## 2. Périmètre réellement audité

Audité en profondeur : Pages, Page Builder (par ses tests Chrome), Articles, Taxonomies, Médiathèque, Commentaires, Navigation, Apparence, Utilisateurs/rôles, Révisions, SEO, URL/redirections, Outils (import/export/santé/sauvegardes), Paramètres, sécurité, UX/accessibilité/responsive, performance, et les 7 moteurs transversaux (par leurs suites).

**Non audité ou audité en surface** (voir §12) : widgets un par un (86 types, banc d'essai documenté mais non rejoué), parcours clavier complet, production au-delà de la lecture d'en-têtes, sauvegardes de l'hébergeur, e-mails réels.

## 3. Architecture identifiée

- **Pile** : Node ≥ 22 (`node:sqlite`), Express 4, EJS, SQLite ; sessions `express-session` ; pas de framework front. 57 migrations marketing numérotées + tables applicatives dans `src/config/database.js`. 351 fichiers de tests.
- **Deux familles de contenu** : **Pages** (`mk_landing_pages`, adresse `/p/<slug>`, édition par le Page Builder) et **Articles** (`posts`, adresse `/blog/<slug>`, éditeur de document Tiptap). Les taxonomies, commentaires et révisions sont des services communs.
- **Barrière unique d'accès** : `src/marketing/web/index.js` appelle `cmsAccess.effectivePermissions(utilisateur, site)` à chaque requête ; les routes appliquent `need(permission)`. Les droits sont relus à chaque requête.
- **Rendu public** : `/p/…` en `no-store`, `/blog/…` en `private, no-cache`, pas de génération statique ; SEO produit par `src/seo/*` ; sitemap construit depuis la base (publié ET indexable).
- **Multi-site** : portée par `mk_sites` ; les pages, redirections, réglages, outils, e-mails, tests A/B ont un `site_id` ; les articles, termes, commentaires et médias n'en ont pas.
- **Sauvegarde** : copie quotidienne de la base (14 gardées) sur le même disque ; téléchargement manuel base + fichiers.
- **Déploiement** : `origin/main` → Hostinger automatique.

## 4. Méthode de comparaison avec WordPress

WordPress est une **référence fonctionnelle**, pas un modèle à copier. Pour chaque capacité : l'équivalent WordPress, l'état réel de KOLAKISA, un statut parmi 8, la preuve, le test. Les capacités sont réparties en catégories A (essentielle), B (avancée), C (administration), D (sécurité/données), E (propre à KOLAKISA, hors parité), F (non pertinente). Les différences volontaires (permaliens fixes, pas de thèmes tiers, pas de champ CSS libre) sont classées « partielle » ou « non applicable » avec leur raison, pas comptées comme défaut caché.

**Équivalences documentées** : Éditeur de site WordPress ↔ Apparence + modèles de thème ; Menus ↔ Navigation ; Révisions ↔ couche `revisions.js` ; Réglages ↔ moteur de réglages ; Rôles WordPress ↔ rôles système + rôles personnalisés + accès par site ; Importateur/Exportateur ↔ Outils (JSON propre à KOLAKISA).

## 5. Matrice de parité fonctionnelle

`01-matrice-parite.md` : 182 lignes par domaine, avec ID, exigence, équivalent WordPress, état réel, statut, preuve, test, gravité, dépendances, recommandation (et `.csv`). Répartition :

| Statut | Nombre |
|---|---|
| Complète et validée | 119 |
| Partielle | 23 |
| Présente mais non validée | 6 |
| Décorative / non fonctionnelle | 2 |
| Buguée | 0 |
| Absente | 24 |
| Doublon | 4 |
| Non applicable | 4 |

## 6. Inventaire des fonctionnalités validées

`03-inventaire.md` §A. Les principales, avec preuves : création, publication, dépublication, duplication, corbeille, adresses et redirections des pages ; Page Builder (structure, propriétés, responsive, annuler/rétablir, historique) ; articles (publication, programmation, archives, corbeille, révisions) ; taxonomies (hiérarchie, fusion, suppression sûre) ; médiathèque (validation, références, corbeille) ; commentaires (modération, anti-spam, échappement) ; navigation ; apparence ; rôles et permissions ; SEO dans le HTML (titre, description, canonical, Open Graph, JSON-LD, sitemap, robots) ; import/export ; paramètres qui changent vraiment le rendu ; les moteurs Contact, E-mail, Automatisation, Tunnel, Commerce, Analytics, A/B, Orchestration.

## 7. Fonctionnalités partielles ou non validées (29)

`03-inventaire.md` §B. Exemples : hiérarchie des pages (le parent est enregistré, l'adresse reste `/p/…`) ; recherche (blog seulement) ; indexation par défaut des pages ; 404 (modèle disponible, page générique par défaut) ; sauvegardes ; export (sans les fichiers médias) ; protection CSRF ; CSP ; dépendances ; performance de l'éditeur ; fidélité éditeur/public ; journal d'activité (vide sur site neuf) ; parcours clavier ; revue SQL non exhaustive.

## 8. Fonctionnalités absentes (24)

Rédaction par d'autres rôles que le créateur (**P1**) ; flux RSS ; recherche globale ; programmation des pages ; archives par date ; contenus privés ou protégés par mot de passe ; blog, catégories, commentaires, médias par site ; variantes d'image et `srcset` ; retouche d'image ; notification des commentaires ; blocage d'auteurs ; effacement RGPD d'un invité ; copie locale du Page Builder ; purge automatique de la corbeille ; historique des menus ; connexions journalisées ; double authentification ; import WordPress ; API REST de contenu ; mesure des requêtes lentes ; slogan et début de semaine.

## 9. Fonctionnalités défectueuses

**Aucune fonctionnalité buguée n'a été reproduite.** Deux commandes sont **décoratives mais honnêtes** : « Notifications » et « Aide » du bandeau sont désactivées et libellées « bientôt » ; le champ « Rechercher… » du CMS est désactivé (« Disponible dans un prochain palier »). Aucun faux bouton actif, aucun lien `href="#"` sur 45 écrans parcourus.

## 10. Doublons

`03-inventaire.md` §D et AN-14 : deux éditeurs (pages / articles, assumé) ; deux systèmes de styles de site (principal / sites du Page Builder) ; en-tête d'origine codé en dur comme repli ; deux A/B (pages / e-mails) ; deux stockages d'images (anciennes miniatures du blog / médiathèque) ; commandes sans `site_id`. **Aucune incohérence visible reproduite**, mais un coût de maintenance et un risque à décider (D6).

## 11. Résultats des tests exécutés

| Test | Résultat |
|---|---|
| Suites CMS + SEO + audit des clés (40 fichiers, **833 tests**) | **833 / 833 réussis** |
| Tests Chrome relancés fichier par fichier | 68 fichiers sur 94 ; 66 verts du premier coup ; 2 échecs sous charge (`editeur-structure-navigateur`, `automatisations-palette-navigateur`) **réussis seuls** (25/25 et 15/15) |
| Sonde permissions : 360 routes × 6 profils | anonyme 360/360 → connexion ; élève non membre 360/360 → 403 ; lecteur/contributeur/auteur : aucune écriture permise hors prévisualisation et préférences personnelles |
| Sonde scénarios (SEO, URL, menus, paramètres, XSS, performance) | 51 contrôles, 4 signalés « écart » : 3 réels (pas de flux RSS, pas de recherche globale, page publiée absente du sitemap = indexation par défaut) et 1 **erreur de ma sonde** (enregistrement du brouillon refusé en 422 parce que mon contenu de test était invalide ; ce comportement est couvert par `cms-pages`, 31/31) |
| Sonde navigateur (Chrome réel) : 24 écrans × 2 largeurs | 0 erreur console, 0 requête échouée, 0 débordement horizontal, 0 champ sans nom |
| Sonde contraste : 8 écrans × 4 thèmes + médiathèque clair/sombre | 1 seule combinaison sous AA (avatar, 3,75:1) |
| Sonde export / import | aller-retour : « ignorer » = aucun doublon ; « dupliquer » = copies ; JSON cassé refusé |
| Production (lecture seule) | accueil 200, en-têtes de sécurité dont HSTS, robots.txt, sitemap 200 |

Détail : `06-preuves.md`.

## 12. Tests non exécutés et raisons

- **26 fichiers de tests Chrome** non relancés (le balayage a été arrêté pour ne pas traîner).
- **Widgets un par un** (86 types) : banc d'essai documenté (`docs/WIDGETS-INVENTAIRE.md`), non rejoué.
- **Copie locale / coupure réseau** du Page Builder : lu dans la documentation, non reproduit.
- **Parcours clavier complet** de chaque écran : non testé.
- **Sauvegardes de l'hébergeur** et restauration complète : hors de ma portée.
- **Envoi d'e-mails réels** : serveur de test sans SMTP.
- **Mesures en production** (requêtes lentes) : « non mesuré » par conception du produit.
- **Aucun test destructif sur la production** (interdit par la consigne).

## 13. Problèmes de sécurité

Aucun P0/P1 de sécurité. P2 : pas de double authentification, connexions non journalisées (AN-09) ; le Lecteur voit contacts et revenus (décision D3, AN-16). P3 : CSRF sans jeton (un POST sans `Origin` ni `Referer` est accepté ; Origin étranger refusé) ; CSP partielle ; 1 dépendance haute indirecte (`source-map-js`) ; revue SQL non exhaustive. Vérifié sain : XSS (4 vecteurs), dépôts de fichiers, cookies de session, IDOR entre sites, secrets absents du dépôt, requêtes préparées sans donnée de requête interpolée.

## 14. Problèmes de persistance et d'intégrité

Pas de perte de données constatée. Risques : copie locale absente du Page Builder (AN-07) ; sauvegardes sur le même disque (AN-08) ; export sans fichiers médias (AN-29). Protections vérifiées : conflits de révision (409), restauration transactionnelle, suppression refusée si l'élément sert, import avec aperçu et annulation.

## 15. Problèmes d'intégration

Événements du CMS émis mais sans abonné (AN-13) ; doublons entre moteurs (AN-14) ; multi-site incomplet (AN-02) ; commandes sans site. À l'inverse, les 7 moteurs ont leurs suites vertes et un commentaire n'inscrit jamais à une liste marketing (testé).

## 16. Problèmes UX et responsive

Très peu : commandes désactivées (recherche, notifications, aide), 1 à 8 petites cibles par écran, fenêtre de médiathèque blanche en thème sombre, avatar à 3,75:1. Pas de débordement horizontal ni de champ sans étiquette sur les écrans mesurés. Navigation au clavier non testée globalement.

## 17. Problèmes de performance

Rien d'alarmant mesuré : blog à 1 000 articles 26 à 460 ms ; sitemap 82 Ko en 90–160 ms ; écrans d'administration 0,7 à 1,8 s dans Chrome (~515 Ko décodés, compressés par le serveur) ; éditeur 1,3 à 2,6 s et 1,2–1,8 Mo. Limites : machine de développement chargée, base de test. Pas de variantes d'image. Requêtes lentes en production non mesurées.

## 18. Score de parité et méthode

Méthode complète dans `05-score-parite.md` (pondérations, trois lectures, exclusions, incertitudes).

| Dimension | Strict | **Central** | Optimiste |
|---|---|---|---|
| Parité fonctionnelle | 73 % | **80 %** | 85 % |
| Sécurité et gestion des données | 67 % | **77 %** | 83 % |
| Fiabilité opérationnelle | 66 % | **74 %** | 80 % |
| Expérience utilisateur | 56 % | **67 %** | 81 % |
| Performance (4 capacités seulement) | 25 % | **50 %** | 63 % |
| Intégration entre modules KOLAKISA | 80 % | **90 %** | 98 % |

Couverture : 79 % des capacités s'appuient sur un test automatisé ou une sonde. La performance repose sur 4 lignes : chiffre peu robuste, à lire avec prudence. Ces chiffres ne sont pas un « pourcentage de qualité » du produit.

## 19. Liste des risques P0, P1, P2, P3

- **P0** : aucun.
- **P1** : AN-01 (rédaction réservée au créateur).
- **P2** : AN-02 à AN-17 (multi-site du blog, RSS, recherche, indexation par défaut, programmation des pages, copie locale, sauvegardes, 2FA/journal, API de contenu, variantes d'image, notifications et RGPD des commentaires, événements, doublons, import WordPress, droits du Lecteur, collisions de migrations).
- **P3** : AN-18 à AN-32.

Détail et reproductions : `02-registre-anomalies.md`.

## 20. Plan de remédiation priorisé

`04-plan-remediation.md` : classement en 9 niveaux, 6 décisions humaines à prendre d'abord (D1 à D6), ordre conseillé : décisions → articles multi-auteurs → exploitation (sauvegarde externe, journal de connexions) → contenu public (RSS, recherche, indexation, programmation) → multi-site du blog si décidé. **Rien n'est exécuté.**

## 21. Fichiers examinés

Documents : `docs/cms-*.md` (articles, taxonomy, comments, navigation, appearance, utilisateurs, revisions, seo, urls, outils, parametres), `docs/WIDGETS-INVENTAIRE.md`. Code lu : `src/marketing/web/index.js`, `landing.js`, `settings.js`, `tools.js`, `mediaLibrary.js`, `cmsScreens.js`, `src/middlewares/security.js`, `src/services/backups.js`, `src/marketing/media/index.js`, `src/marketing/api/router.js`, `src/marketing/pages/*` (extraits), `server.js`, `public/js/media-picker.js`, `public/css/media-picker.css`, `scripts/sauvegarde.js`, `tests/helpers.js` et extraits de `tests/cms-*.test.js`. Recherches transversales : `git grep` (secrets, SQL dynamique), `PRAGMA table_info`, liste des 681 routes extraite automatiquement.

## 22. Fichiers créés pour les rapports

- `docs/audit-parite-wordpress/` : `00-RAPPORT-FINAL.md`, `01-matrice-parite.md`, `01-matrice-parite.csv`, `02-registre-anomalies.md`, `03-inventaire.md`, `04-plan-remediation.md`, `05-score-parite.md`, `06-preuves.md`.
- `audit-parite/` : `matrice-donnees.js`, `generer.js`, `sonde-publique.js`, `sonde-permissions.js`, `sonde-scenarios.js`, `sonde-complements.js`, `sonde-export.js`, `sonde-navigateur.js`, `sonde-contraste.js`, `sonde-contraste-admin.js`, `sonde-decoratif.js`, `resultats/` (sorties brutes, captures).

Les sondes démarrent un **serveur de test jetable** (base temporaire) ; elles n'écrivent rien dans le code ni dans la production.

## 23. Modifications de code effectuées

**Aucune** sur l'application (pas de migration, pas de route, pas de modèle, pas de permission changés). Seuls des fichiers de rapport et de sondes ont été ajoutés dans le worktree d'audit, **non poussés**. Un lien symbolique `node_modules` (ignoré par git) a été créé dans ce worktree pour pouvoir lancer les tests.

## 24. Éléments nécessitant une décision humaine

D1 (multi-site du blog et des médias) · D2 (rédaction par les autres rôles) · D3 (droits de lecture sensibles du Lecteur) · D4 (indexation par défaut des pages) · D5 (API de contenu, import WordPress) · D6 (quels doublons fusionner). Voir `04-plan-remediation.md`.

## 25. Recommandation pour la suite

1. Tu valides (ou non) les décisions D1 à D6.
2. Premier chantier utile : **articles multi-auteurs** (seul P1, de portée limitée).
3. Avant la production : copie de sauvegarde hors serveur et journal des connexions.
4. Le multi-site du blog (AN-02) est le chantier le plus lourd : à ne lancer qu'après décision D1.
5. Règle de travail à garder : vérifier le dernier numéro de migration juste avant chaque envoi (incident 067 du palier 22).

**Je ne commence aucune correction et je ne passe pas au palier 24 sans ta validation.**

---

### Conditions de validation du palier 23 (§33)

| Condition | État |
|---|---|
| Architecture cartographiée | ✓ (§3) |
| Principales fonctionnalités inventoriées | ✓ (182 capacités) |
| Page Builder audité | ✓ par ses tests Chrome et la sonde (limites §12) |
| Moteurs transversaux examinés | ✓ par leurs suites (833 tests CMS/SEO inclus) |
| Matrice de parité | ✓ |
| Statuts fondés sur des preuves | ✓ (colonne Preuve et Test) |
| Fonctionnalités décoratives identifiées | ✓ (2, désactivées et libellées) |
| Non-testé signalé | ✓ (§12, colonne Test) |
| Anomalies classées par gravité | ✓ |
| Sécurité examinée | ✓ |
| Permissions et isolation multi-site vérifiées | ✓ (360 routes × 6 profils ; IDOR par les suites) |
| Persistance examinée | ✓ |
| UX et responsive documentés | ✓ |
| Performance examinée | ✓ (limites §17) |
| Doublons recherchés | ✓ |
| Score justifié | ✓ (trois lectures, incertitudes) |
| Plan de remédiation | ✓ |
| Aucun changement risqué | ✓ |
| Aucune régression introduite | ✓ (aucun code de l'application touché) |
| Rapport vérifiable | ✓ (sondes rejouables : `node audit-parite/sonde-*.js`) |
