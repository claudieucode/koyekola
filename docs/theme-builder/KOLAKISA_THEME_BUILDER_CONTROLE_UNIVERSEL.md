# Theme Builder — centre de contrôle du design d'un site (audit, architecture, inventaire, tests, performances)

*État : livré par paliers (voir §10). Les affirmations ci-dessous sont celles qui ont été vérifiées par un test ou une mesure ; ce qui ne l'a pas été est dit en §9.*

## 1. Cartographie des systèmes qui contrôlent le design d'un site (avant)
| Système | Où | Ce qu'il imposait | Conflit avec le Theme Builder |
|---|---|---|---|
| Habillage d'apparence (`ap.header`, `ap.footer`) | `views/partials/header.ejs`, `footer.ejs` | En-tête et pied du blog, de la recherche, de la boutique, de la 404 | Remplaçait le modèle publié (corrigé : RENDU_CAUSES_RACINES) |
| Parties du site (`mk_sites.header_component_id` / `footer_component_id`) | Réglages du site → en-tête / pied | En-tête et pied des pages du Page Builder | Doublon de l'en-tête/pied du Theme Builder ; repris par « Récupérer l'existant » |
| Modèles de thème (`themeTemplates`) | `pages/themeTemplates.js` | Modèles article, archives, 404, produit (ancien système) | Deux systèmes de modèles ; le Theme Builder passe **avant**, l'ancien reste en repli |
| Navigation automatique (`lp-autohead`, `lp-foot`) | `marketing-public/landing.ejs` | En-tête/pied minimaux d'une page sans partie | Repli seulement |
| Zones de widgets (footer-1, footer-2) | Apparence → Widgets | Blocs au-dessus du pied de page | Complément, pas un concurrent |
| Jetons du site (couleurs, polices, espacements) | Apparence → Styles | Charte | **Source commune** : le Theme Builder s'y branche, il ne la remplace pas |
| Listes dynamiques (`posts`, `querylist`, boucles) | `pages/query.js` | Contenu | **Faille corrigée** : ces listes ne filtraient pas par site (voir §6) |

## 2. Décision sur les systèmes concurrents (supprimés / remplacés / conservés)
La consigne demandait de supprimer les systèmes redondants « après avoir sécurisé les données ». Choix argumenté :
* **Remplacés dans le rendu, conservés comme repli** : l'habillage d'apparence et les anciens modèles de thème restent le comportement **uniquement quand aucun modèle publié ne correspond** (règle de la consigne : « les templates par défaut ne servent que lorsqu'aucun modèle publié ne correspond »). Les supprimer casserait les sites sans Theme Builder (dont le **site principal**, qui n'en a pas : décision R9-4) et supprimerait des données (réglages d'apparence).
* **Données migrées sans perte** : « Récupérer l'existant » importe l'en-tête, le pied et les modèles de thème d'un site vers le Theme Builder (lecture seule des anciennes données, idempotent).
* **Aucune suppression irréversible** n'a été faite : le retour arrière reste possible. La suppression définitive des écrans concurrents est une décision produit à prendre une fois les sites migrés (liste des écrans concernés : Apparence → En-tête, Pied de page, Réglages du site → parties).

## 3. Architecture cible
```
requête publique (domaine d'un site)
 → siteHost.attachSite (req.kwSite)
 → themeLayout : résout l'en-tête / le pied du modèle publié (themeBuilder/render.resolveParts)
 → route (blog, boutique, 404, page…) → renderRegion → pickRegion (modèle de page du Theme Builder, sinon ancien système, sinon vue d'origine)
 → même rendu que le Page Builder (landing.viewModel + marketing-public/_sections) + CSS du site (jetons → thème → éléments)
bibliothèque : catalog/{type}.js (20 mises en page) × kit.SKINS (5 identités) → build() → use() → copie du site (composant ou page) + modèle en brouillon
```
* Résolution : `themeBuilder/{conditions,match,resolve}.js` (condition la plus précise, puis la plus récente ; exclusions prioritaires ; brouillons et archivés jamais appliqués).
* Rendu public = aperçu de la bibliothèque = aperçu d'un modèle = même fonction (`themeRender.renderVm`).
* Comportements : un en-tête dont la première bande est « collant » (`position: sticky`) colle réellement en haut sur les pages de la plateforme (classe `kw-theme-sticky` posée sur la zone) ; « superposé » (`absolute`) se pose sur le visuel d'ouverture. Un modèle fait de bandes pleine largeur n'est plus limité à la colonne de texte (`kw-theme-bleed`).

## 4. Entrée de barre latérale
Apparence → **Theme Builder** (`cmsNav.js`, clé `apparence/theme-builder`) : visible pour les sites créés (droit `forms.read`), absente du site principal, conserve le site actif (adresse du site), icône et groupe du registre. Les tests de registre (menu, infobulles, inventaire) ont été mis à jour pour cette entrée.

## 5. Bibliothèque : 9 types × 100 modèles
Voir `KOLAKISA_THEME_BUILDER_CATALOGUE.md` (principe, écriture) et `KOLAKISA_THEME_BUILDER_CATALOGUE_MATRICE.md` (matrice par type et par mise en page). Interface : bouton « Bibliothèque de modèles » → grille / liste, recherche sans accents, filtres (type, identité, mise en page), pagination serveur (24 par page), miniature filaire chargée à la demande, **Prévisualiser** (rendu réel avec les jetons du site, appareils ordinateur/tablette/mobile), **Utiliser ce modèle** (copie en brouillon), puis **Modifier / Dupliquer / Publier** sur les modèles du site (écrans existants).
**Honnêteté sur « 100 modèles distincts »** : chaque type a 20 mises en page de structures différentes (arbre d'éléments et réglages distincts, testé : ≥ 20 structures par type, 100 documents tous différents) × 5 identités visuelles. Les 5 identités d'une même mise en page partagent la même structure ; elles diffèrent par bordures, relief, casse, arrondis, densité, fond. Ce n'est donc pas « 100 structures » : c'est 20 structures × 5 identités.
Types sans bibliothèque : **Barre latérale** et **Modèle personnalisé** (aucune zone publique ne les affiche).

## 6. Isolation multisite
* Chaque site a ses modèles (`mk_tb_templates.site_id`), ses copies de documents, ses conditions, ses publications ; « Utiliser » copie dans le site de l'adresse (jamais du corps de la requête).
* Le catalogue est partagé en lecture seule ; une copie n'a aucun lien avec lui.
* **Faille trouvée et corrigée** : les boucles et listes d'articles du Page Builder (`pages/query.js`, source `posts`) ne filtraient pas par site : un site pouvait lister les articles d'un autre. Désormais une page d'un site ne liste que ses articles (`mk_content_sites`), une page du site principal que les articles sans site. Test : `theme-builder-catalogue-public` (archive du site A ne montre pas l'article du site B) et 123 tests de listes dynamiques inchangés au vert.
* Les sources `courses`, `products` étaient déjà filtrées par site ; les sources catégories/étiquettes/auteurs n'ont pas été auditées dans cette mission.

## 7. Performances (mesurées, Node 24, machine de développement)
| Mesure | Résultat |
|---|---|
| Métadonnées des 900 modèles | 10 ms (une fois par processus) |
| Liste filtrée et paginée (recherche + page de 24) | 0,27 ms en moyenne |
| Construction des 900 documents | 115 ms au total ; 2,3 Ko par document (2 Mo au total) |
| Mémoire | cache de documents borné à 300 entrées |
| Chargement | la liste ne contient jamais les documents ; miniature et aperçu à la demande (IntersectionObserver côté navigateur, 4 requêtes simultanées au plus pour les modèles du site) |
Aucune mesure de charge sur le serveur de production n'a été faite (consigne : pas de test de charge en production).

## 8. Tests
| Fichier | Couvre |
|---|---|
| `theme-builder-catalogue` (21) | 100 modèles × 9 types valides, distincts, ≥ 20 structures ; liste, recherche, filtres, pagination ; utilisation (brouillon, indépendante, isolée) ; module Commerce désactivé refusé |
| `theme-builder-catalogue-public` (4) | API (types, pagination, miniature, aperçu des 9 types), droits (anonyme refusé, rien créé), en-tête/pied/article/archive/recherche/404 réellement rendus sur le site A et pas sur B, copie indépendante, export puis import dans un autre site |
| `theme-builder-bibliotheque-navigateur` (3) | Chrome réel : ouverture, 24 cartes sur 5 pages, changement de type, recherche, aperçu réel, « Utiliser », mobile 390 px sans débordement, 0 erreur JavaScript |
| `theme-builder-couverture-rendu` (9) et `-contexte-rendu` (7) | Moteur de résolution et rendu de tous les types (mission précédente) |
| Tests de menu (registre, infobulles, inventaire, parité principal/site) | Entrée Apparence → Theme Builder |
| 123 tests de listes dynamiques, boucles, widgets | Non-régression de la correction d'isolation |

## 9. Limites connues (non vérifiées ou non faites)
* **Rendu visuel** : vérifié par captures Chrome sur 2 modèles par type (18 sur 900), pas sur les 900. Les 900 sont validés par la grammaire et rendus sans erreur côté serveur seulement pour un échantillon.
* **Boutique** : les modèles produit / archives produits ne sont pas rendus de bout en bout sur un site réel avec produits dans les tests (aperçu avec données d'exemple uniquement). Le bouton d'achat et les filtres dépendent de la boutique ouverte du site.
* **Aperçu** : données d'exemple pour produit, archive, recherche (annoncées comme telles) ; articles réels s'il y en a.
* **Page individuelle** : s'applique à la page statique « À propos », pas aux pages du Page Builder (limite L4).
* **Contrôle total de chaque propriété** : les éléments sont ceux de l'éditeur de pages (grammaire fermée, styles par écran et par état) ; les copies s'éditent donc dans cet éditeur, non dans un second éditeur.
* **Liens d'exemple** : les icônes de réseaux des modèles pointent vers les pages d'accueil génériques des réseaux, à remplacer ; la navigation est le menu affecté dans Apparence → Menus (vide tant qu'aucun menu n'est affecté).
* **Newsletter** : le formulaire n'est inséré que si le site a un formulaire d'inscription ; sinon un bouton de contact.
* La liste des sources de contenu autres que `posts` (catégories, étiquettes, auteurs) n'a pas été auditée pour l'isolation.
* Suite de tests complète non exécutée sur l'ensemble du dépôt (voir le rapport final pour le périmètre exécuté). Échecs préexistants hors périmètre : `mk_tb_*` non classées dans l'inventaire des tables, infobulles et registre pour la boutique et Mailchimp.

## 10. Paliers
1. Moteur de rendu unifié (mission précédente, `a4f9651b`).
2. Catalogue (moteur, kit, 9 types), API, bibliothèque, entrée de menu, corrections de rendu (bandes pleines, collant, images dynamiques vides) et d'isolation (ce palier).
