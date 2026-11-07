# 00 - Périmètre et méthode de la recherche Elementor (HEADER)

Projet : Kolakisa (CMS qui reproduit des fonctionnalités avec son propre code). Aucune ligne de code propriétaire n'est copiée : seuls fonctionnalités, comportements, contrôles et architecture sont décrits.
Date de consultation de toutes les sources : 2026-11-07.

## 1. Périmètre

1. Création / modification / enregistrement / publication / versions d'un Header.
2. Conditions d'affichage (Include/Exclude), priorité, conflits.
3. Sticky / fixed / transparent / shrink / scroll-up.
4. Motion Effects (scrolling effects, mouse effects).
5. Aperçu (Preview Settings) et aperçu responsive.
6. Rendu côté serveur/public.

Hors périmètre : footer, popups (cités seulement quand la doc les mélange), widgets de contenu.

## 2. Légende des marques

- [NATIF] : présent dans Elementor gratuit (ou thème Hello) selon la source.
- [PRO] : nécessite Elementor Pro.
- [EXPÉRIMENTAL] : fonction derrière un « experiment » Elementor.
- [EXTENSION] : fourni par un plugin/add-on tiers, pas par Elementor.
- NON VÉRIFIÉ : je n'ai pas pu le confirmer dans une source lue.

## 3. Sources réellement LUES (contenu récupéré via WebFetch)

| # | URL | Utilité |
|---|-----|---------|
| 1 | https://elementor.com/help/header-site-part/ (offset 100000) | Créer/éditer/exporter/renommer/supprimer un Header, balise HTML |
| 2 | https://elementor.com/help/conditions/ (offset 100000) | Liste des conditions d'affichage |
| 3 | https://elementor.com/help/sticky-headers/ | Sticky v3 (Motion Effects) et v4 (Fixed + conteneur espaceur) |
| 4 | https://elementor.com/help/motion-effects/ | Vue d'ensemble Motion Effects, reduced motion, navigateurs |
| 5 | https://elementor.com/help/creating-a-header-template-with-the-container/ | Header avec conteneur Flexbox |
| 6 | https://elementor.com/help/sticky-transparent-header/ (+ https://elementor.com/help/wp-json/wp/v2/posts/403) | Sticky transparent (sections/colonnes), classe `elementor-sticky--effects` |
| 7 | https://developers.elementor.com/theme-locations-api/ | Theme Locations (header, footer, single, archive) |
| 8 | https://elementor.com/help/dynamic-content | Preview Dynamic Content As |
| 9 | https://elementor.com/help/the-elementor-theme-builder/ | Theme Builder : types, accès, prérequis, portabilité |
| 10 | https://elementor.com/help/wp-json/wp/v2/posts/252 | Compatibilité Theme Builder (Considerations) |
| 11 | https://elementor.com/help/wp-json/wp/v2/posts/163845 | Header/footer manquant : 5 causes |
| 12 | https://elementor.com/help/wp-json/wp/v2/posts/141 | Conditions / Triggers / Advanced Rules (popups, pour contraste) |
| 13 | https://elementor.com/help/scrolling-effects-vertical-scroll/ | Vertical Scroll |
| 14 | https://elementor.com/help/scrolling-effects-rotate | Rotate |
| 15 | https://elementor.com/help/mouse-effects-3d-tilt | 3D Tilt |
| 16 | https://elementor.com/help/mouse-effects-mouse-track/ | Mouse Track |
| 17 | https://elementor.com/blog/introducing-motion-effects/ | Effets Pro 2.5 : directions transparence/blur/scale |
| 18 | https://elementor.com/help/?p=63 | Historique, undo/redo, onglet Revisions |
| 19 | https://developers.elementor.com/docs/theme-conditions/simple-example | API conditions : enregistrer une condition « utilisateur connecté » |
| 20 | http://developers.elementor.com/docs/theme-conditions/sub-conditions | API conditions : sous-conditions |
| 21 | https://elementor.com/help/responsive-mode/ | Mode responsive, breakpoints |
| 22 | https://elementor.com/help/import-and-export-elementor-website-templates/ | Import/Export de kits |
| 23 | https://elementor.com/help/wp-json/wp/v2/posts/233 | Compatibilité thèmes (Hello recommandé) |

Total : 23 pages lues (certaines pages ne livraient que la navigation sur la première tranche ; le corps de l'article était dans la tranche offset 100000).

## 4. Sources tentées sans contenu exploitable

- https://elementor.com/help/customize-your-website/editing-hello-theme et https://elementor.com/help/?p=25214 (Hello Theme header/footer) : la récupération a renvoyé la page d'accueil ou rien. Le contenu Hello n'est connu que par des résumés de recherche (voir 5).
- https://elementor.com/help/wp-json/wp/v2/posts/289 : 404.
- https://elementor.com/help/conditions-triggers-and-advanced-rules : seulement résumé de recherche ; la page concerne les popups.

## 5. Sources secondaires (résumés de recherche uniquement, non lues en entier)

- https://elementor.com/help/how-to-fix-a-missing-header-or-footer-in-elementor/ (confirmé par #11)
- https://elementor.com/help/considerations-for-theme-builder-compatibility/ (confirmé par #10)
- https://elementor.com/help/scrolling-effects-transparency (non lue), Blur, Scale, Horizontal Scroll : NON LUES individuellement ; seul le blog (#17) et la page motion-effects (#4) ont été lus.
- https://elementor.com/help/export-kit, https://elementor.com/help/import-kit (résumés de recherche).
- Tiers (EXTENSION) : plugin « Sticky Header Effects for Elementor » (POSIMYTH, wordpress.org), theplusaddons.com, element.how : cités uniquement pour dire que « hide on scroll down / scroll up » n'est pas documenté comme natif.
- Hello Theme : l'option « Disable theme header and footer » (menu Hello > Settings) vient d'un article tiers (divibooster.com) ; NON VÉRIFIÉ côté Elementor.

## 6. Méthode et limites

- Les pages elementor.com/help renvoient ~120 000 caractères de menu : le corps est à `offset=100000`. L'outil de lecture résume par un petit modèle : les valeurs numériques peuvent être incomplètes.
- Pas de test dans un vrai Elementor installé : aucun comportement n'a été observé en live.
- Les documents developers.elementor.com consultés sont courts ; l'algorithme interne de priorité des conditions n'est PAS décrit dans les docs lues (voir fichier 10).
- Ne pas compléter de mémoire : quand le texte l'indique, c'est marqué « (mémoire, NON VÉRIFIÉ) ».

## 7. Différences de versions relevées

- Elementor v3 (sections/colonnes puis conteneurs) : Sticky dans Advanced > Motion Effects (source #3).
- Elementor v4 (« Atomic Editor ») : pas de réglage Sticky de Motion Effects dans la doc lue ; on utilise Position Fixed + conteneur espaceur (source #3).
- Sticky transparent par CSS personnalisé : valable pour sections/colonnes uniquement (source #6).
- Import/Export : ancienne doc = experiment à activer ; nouvelle doc = Elementor > Editor > Home > Tools > Website Templates (résumé de recherche + #22).
- Motion Effects introduits avec Elementor Pro 2.5 (source #17).
