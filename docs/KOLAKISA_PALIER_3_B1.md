# KOLAKISA — Palier 3 : B1 « fondations et espace CMS indépendant par site » — analyse et plan détaillé

Analyse seulement. **Aucune migration, aucune donnée modifiée, rien de poussé, rien de déployé.** Branche locale `cms-independant` (au-dessus de `bdeaa17`, déjà en production).

## 1. État réel vérifié (12/10/2026)
- **`origin/main` = `aa91976`** : il a avancé de deux commits depuis `bdeaa17` (autre session : icône « Accueil » et « Reprendre mon travail » de l'éditeur de pages — 4 fichiers : `page-builder.css/js/ejs` et un test). **Aucune migration, aucun fichier touché par B1.** Une mise à jour de ma branche (fusion de `main`) sera nécessaire avant toute livraison ; elle est sans conflit prévisible. Je ne l'ai pas faite.
- **Migrations** : 60 fichiers, dernière = `071_isolation_des_sites.sql` (appliquée en production le 12/10). B1 n'en ajoute aucune ; les suivantes restent 072… (B2 et suivantes).
- **Production** : je n'y ai pas d'accès connecté. Mon état de la production = ce que vous m'avez transmis : Livraison 1 en ligne, audit étendu **0 anomalie**, essai de reconstruction **conforme**, 4 tables identiques avant/après, intégrité OK, nettoyage OK.
- **Livraison 1** : aucun défaut nouveau connu. Défaut préexistant hors périmètre, non corrigé : test SMS « double confirmation » (échoue aussi sur main).

## 2. Incohérence du rapport d'audit : « 1 site au total, dont 1 archivé et 1 supprimé »
**Ce n'est pas une erreur de calcul, c'est un libellé trompeur.** Les trois nombres ne sont pas des parts d'un total, ce sont trois comptages qui se recouvrent :
- `total` = toutes les lignes de `mk_sites`, **y compris celles de la corbeille** ;
- `archivé` = `status = 'archived'` ;
- `supprimé` = `deleted_at` renseigné.

Or `deleteSite` (`src/marketing/pages/index.js:611`) **refuse de supprimer un site qui n'est pas d'abord archivé** : un site supprimé est donc toujours aussi archivé. Le message « 1 / 1 / 1 » signifie : **un seul site existe en production, il est archivé et dans la corbeille ; il y a donc 0 site actif.**
Conséquences : (1) l'audit est cohérent ; (2) la production n'a aucun site actif sur lequel essayer B1 : l'essai se fera sur des sites créés dans les tests et, après déploiement, sur un site que vous créerez ; (3) le libellé sera corrigé en B1 (texte seulement) : « 1 site au total : 0 actif, 1 archivé (dont 1 dans la corbeille) », avec un test.

## 3. Ce qui existe déjà (à réutiliser — décision D11, pas de nouveau système)
| Élément | Constat |
|---|---|
| Coque « WordPress » | `cmsNav.js` + `cmsScreens.js` + `cms-screen.ejs` : menu latéral (Pages, Articles, Médias, Navigation, Apparence, Commentaires, Utilisateurs, SEO, Redirections, Tests A/B, Outils, Paramètres), fil d'Ariane, état `live`/`preview`. **Mais elle est globale** : un seul menu, sans notion de site. |
| « Ouvrir » (liste Mes sites) | mène à `/marketing/site-web/sites/:id` = `views/marketing/site.ejs` (172 lignes) : **une page de configuration** (réglages, pages du site, en-tête, design, zone sensible), sans menu CMS. C'est exactement ce que vous ne voulez plus. |
| Contexte de site | `web/index.js` déduit déjà le site de l'adresse `/site-web/sites/:id/…` (ou de la ressource), le **vérifie** (`siteContext.resolve`) et calcule les droits du site (`effectivePermissions`). Toute route placée sous ce préfixe hérite donc gratuitement du contrôle d'accès existant. Les personnes limitées à un site n'accèdent qu'aux adresses de leur site. |
| Modules déjà isolés par site | pages, composants, menus (`nav_menus`), apparence, en-tête/pied, redirections, tests A/B, listes/segments/modèles d'e-mail/campagnes/automatisations/tunnels (palier 16), analytics central (`?site=`), outils et paramètres (`?site=`). |
| Modules non isolés | articles/catégories/commentaires, médias, formulaires, contacts/consentements (partiel), modèles/blocs, SEO du blog. → B2 à B6. |

## 4. Périmètre précis de B1
**Objectif** : chaque site, via « Ouvrir », arrive dans **son espace d'administration complet** (menu latéral type WordPress, bandeau « vous êtes dans le site X », tableau de bord, modules), alimenté par le **même moteur** (mêmes services, mêmes écrans) mais **toujours filtré par le site de l'adresse**.

### B1 livre
1. **Aide de portée de site** (`src/services/siteScope.js`, nouvelle, petite) : une seule fonction qui produit la clause `site_id = ?` / `site_id IS NULL` et refuse un site absent. Utilisée par les nouveaux écrans ; les services existants (déjà filtrés) ne sont pas réécrits.
2. **Espace de site** sous `/marketing/site-web/sites/:id/<module>` (adresse déterministe : le site vient de l'adresse vérifiée, **jamais** d'un champ ou d'un `?site=` envoyé). Menu de site construit par `buildSiteNav` (même registre `cmsNav`, même coque, mêmes composants visuels), avec bandeau permanent : nom du site, domaine, statut (actif/archivé), sélecteur « changer de site », lien « Retour à Mes sites ».
3. **Site principal = même espace** (D10), adresse `/marketing/site-web/principal/<module>` ; les adresses historiques (`/marketing/site-web`, `/marketing/pages`, `/formateur/blog`, `/blog`…) restent valides et inchangées.
4. **Modules montés dans l'espace dès B1 (données déjà isolées, donc réelles)** : Tableau de bord du site · Pages · Composants · Navigation et menus · Apparence (design system, en-tête, pied de page) · Redirections · Tests A/B · Emailing (listes, segments, modèles, campagnes, automatisations, tunnels) · Analytics · Équipe du site (rôles `mk_site_members`) · Réglages (le contenu actuel de `site.ejs` devient l'écran « Réglages ») · Outils du site.
5. **Modules visibles mais honnêtes** (données pas encore isolées) : Articles, Catégories/Étiquettes, Commentaires (B5) · Médias (B2) · Formulaires, Contacts (B4) · Modèles/blocs (B3) · SEO du blog (B6). Selon la convention existante (`status: "preview"`) : entrée du menu avec badge « Bientôt », écran d'état vide explicite, **aucune donnée d'un autre site, aucun bouton simulé**.
6. **Droits par site** : chaque entrée du menu apparaît seulement si `effectivePermissions(user, {siteId})` l'autorise ; l'équipe de l'organisation voit tout, une personne limitée à un site voit son seul site.
7. **Inventaire automatique des tables** (test) : liste des tables de contenu avec ou sans `site_id` et justification ; échoue si une nouvelle table de contenu oublie la colonne (règle « modules futurs » du plan).
8. **Libellé d'audit** corrigé (§2).

### B1 ne livre pas (pour mémoire)
Aucune table, colonne, migration ni déplacement de données ; pas d'isolation des articles/médias/formulaires/contacts/SEO (B2 à B6) ; pas de domaine pour le blog ; pas de nouveau thème/extension (D11) ; pas de Palier 4. **Conséquence à connaître** : tant que B2–B6 ne sont pas faits, l'espace est complet dans sa structure, mais les modules listés au point 5 sont « Bientôt ». L'exigence « espace complet » est entièrement satisfaite à la fin de B5/B6, pas à celle de B1.

## 5. Fichiers concernés
| Fichier | Action |
|---|---|
| `src/services/siteScope.js` | **nouveau** — clause de portée + garde |
| `src/marketing/web/cmsNav.js` | ajout `buildSiteNav` (même registre, hrefs préfixés par le site, droits par site) — l'existant est inchangé |
| `src/marketing/web/siteSpace.js` | **nouveau** — routes `/site-web/sites/:id/<module>` et `/site-web/principal/<module>` ; le site vient de `req.mk.site` |
| `src/marketing/web/index.js` | `siteOfRequest` : reconnaître `/site-web/principal/…` (siteId null) ; rien d'autre (le préfixe `/sites/:id` est déjà géré) |
| `src/marketing/web/siteWeb.js` | route `GET /site-web/sites/:id` : redirige vers le tableau de bord de l'espace ; les POST existants (réglages, archiver, supprimer…) restent |
| `views/marketing/site-space.ejs`, `views/marketing/_site-banner.ejs` | **nouveaux** — coque d'espace de site et bandeau |
| `views/marketing/site.ejs` | devient l'écran « Réglages » (contenu conservé, sans suppression) |
| `views/marketing/sites.ejs` | « Ouvrir » → espace ; sites archivés/supprimés : message adapté |
| `src/services/auditSites.js`, `views/gestion/audit-sites.ejs` | libellé corrigé |
| `tests/site-espace-*.test.js` | **nouveaux** (§7) |
Fichiers **non touchés** : migrations (aucune), `posts`/blog, médias, formulaires, moteur d'envoi, éditeur de pages (autre session).

## 6. Risques
| # | Risque | Parade |
|---|---|---|
| R1 | Un écran de l'espace affiche des données d'un autre site (oubli de filtre) | site pris **uniquement** dans `req.mk.site` ; matrice « écran × site » testée (§7) ; aide de portée unique |
| R2 | Personne limitée au site A qui atteint le site B en changeant l'adresse | contrôle déjà central (`web/index.js`) + test IDOR sur **chaque** route de l'espace |
| R3 | Confusion du site courant (modifier le mauvais site) | bandeau permanent, nom du site dans le titre de page, aucune action sans site dans l'adresse |
| R4 | Casser les adresses actuelles / signets | adresses historiques inchangées ; test de non-régression des routes existantes |
| R5 | Fausse impression de complet | entrées « Bientôt » explicites, sans simulation (règle permanente) |
| R6 | Conflit avec l'autre session (éditeur de pages) | aucun fichier commun prévu ; fusion de `main` avant livraison |
| R7 | Rien à essayer en production (0 site actif) | essais sur sites de test ; après déploiement vous créez un site d'essai |

## 7. Tests prévus (4 catégories, exécutés et comptés séparément)
1. **Unitaires** : aide de portée (site, principal, site absent/supprimé/archivé) ; `buildSiteNav` (droits, hrefs, entrée « Bientôt ») ; inventaire des tables ; libellé d'audit.
2. **Intégration** : pour chaque module de l'espace, deux sites A et B avec données distinctes → l'espace A ne montre que A (pages, composants, menus, redirections, tests A/B, campagnes, listes, équipe) ; site principal idem ; création/modification depuis l'espace A n'écrit que dans A.
3. **Sécurité (IDOR)** : accès croisé A→B par adresse, par identifiant de ressource, par `?site=`/champ forgé (ignoré), par rôle limité (lecteur, rédacteur) ; visiteur → connexion ; élève refusé ; site archivé/supprimé → message ; **aucune différence de réponse révélant l'existence d'un site inaccessible**.
4. **Navigateur réel (Chrome)** + non-régression : « Ouvrir » → espace ; menu, bandeau, changement de site, mobile 375 px sans défilement horizontal, aucune erreur console ; anciennes adresses toujours opérationnelles ; suite complète relancée.

## 8. Critères d'acceptation
1. « Ouvrir » d'un site actif mène à son espace avec menu latéral complet, bandeau du site et tableau de bord.
2. Le site principal a le même espace, ses adresses historiques fonctionnent toujours.
3. Chaque module monté n'affiche et n'écrit que les données du site de l'adresse (tests A/B croisés au vert).
4. Les modules non isolés sont marqués « Bientôt » sans donnée ni action simulée.
5. Aucun accès croisé (IDOR) possible ; une personne limitée à un site ne voit que lui.
6. Zéro migration ; aucune table, colonne ni donnée modifiée (vérifié par test et par comparaison de schéma).
7. Libellé d'audit corrigé ; suite complète sans régression (échecs préexistants nommés et distingués).
8. Compte rendu de livraison avec tests exécutés/réussis/échoués/ignorés, captures, retour arrière (`git revert`, sans effet sur les données).

## 9. Décisions à prendre avant de commencer
- **D13 — Comportement de « Ouvrir » pendant B1.** Recommandation : **ouvrir immédiatement le nouvel espace** (modules isolés réels + modules « Bientôt »), et non attendre B5. Alternative : garder l'ancienne page jusqu'à B5 (vous n'auriez l'espace complet qu'à la fin).
- **D14 — Forme des adresses.** Recommandation : **par chemin** `/marketing/site-web/sites/:id/<module>` (le site est vérifié sur l'adresse, impossible à forger) plutôt que `?site=`.
- **D15 — Site principal.** Recommandation : `/marketing/site-web/principal/<module>`, adresses actuelles conservées comme alias.

**Rien ne sera commencé avant votre autorisation.**
