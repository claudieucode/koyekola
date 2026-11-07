# HEADER — Audit final (Header Builder Kolakisa)

Branche : `header-builder-elementor` (créée depuis `themes-extension5-phase0`). Périmètre exclusif : HEADER. Footer, publications, archives, 404 : non touchés.
Règle appliquée : **aucune ligne n'est « validée » sans preuve de test** ; ce qui n'est pas fait est dit.

## 1. Verdict honnête

**Le Header Builder est utilisable et testé pour son cœur, mais il n'atteint PAS 100 % de la liste demandée.**
Ce qui est fait et prouvé : réglages d'en-tête enregistrés dans le document (collé, fixé, superposé, appareils, décalage, seuil, effets, masquage au défilement), styles « Après défilement » et « Menu ouvert », logos par état et mobile, menus à trois niveaux (icône, description, classe), tiroir mobile accessible, méga-menu composé dans l'éditeur, recherche plein écran avec suggestions, menu du compte, mini-panier en tiroir (panier des formations), condition d'affichage « visiteur », accessibilité de base, isolation entre sites, performance (CLS).
Ce qui n'est **pas** fait : voir § 6.

## 2. Étude et documentation
- 15 documents d'étude Elementor (`00` à `14`) produits par 4 agents de recherche : ~130 pages consultées ; toutes les affirmations importantes sont sourcées ; les points non vérifiés sont marqués « NON VÉRIFIÉ » (priorité des conditions, effets Transparence/Flou/Échelle, clavier du méga-menu, statut Pro de plusieurs widgets, etc.). Aucun test n'a été fait dans un vrai Elementor.
- Audit du code Kolakisa (5ᵉ agent) vérifié sur ses constats critiques avant usage (voir `15_KOLAKISA_HEADER_ARCHITECTURE.md` § 9).
- Documents de synthèse : `15_KOLAKISA_HEADER_ARCHITECTURE.md`, `HEADER_FEATURE_MATRIX.md`, `HEADER_GAP_ANALYSIS.md`, `HEADER_IMPLEMENTATION_PLAN.md`, ce document.
- Limites de la documentation : les fichiers `05` (design) et `07` (responsive) sont courts ; l'étude n'a pas pu lire plusieurs pages Elementor (redirigées vers l'accueil).

## 3. Matrice de couverture (recomptée par script)
Voir `HEADER_FEATURE_MATRIX.md` : **72** fonctionnalités ; **35 testées** (preuve citée), **5 développées partiellement**, **29 documentées** (déjà présentes dans le code avant la mission, preuve non reprise), **1 à développer**, **2 exclues** (justifiées : sélecteur de langue/devise, liste de souhaits/comparaison). **0 « validée »** au sens strict : la validation de bout en bout n'a pas été faite sur un environnement de production.

## 4. Preuves (tests écrits pour la mission)
| Fichier | Portée | Cas |
|---|---|---|
| `tests/header-reglages.test.js` | validation du bloc `header`, lecture de l'ancien format, états de style (CSS) | 16 |
| `tests/header-reglages-navigateur.test.js` | panneau « En-tête » de l'éditeur, enregistrement, rechargement, publication, méga-menu dans l'éditeur, tiroir | 9 |
| `tests/header-etats-navigateur.test.js` | fixé, appareils, décalage, masquage, états, logos (site publié, Chrome réel) | 9 |
| `tests/header-responsive-navigateur.test.js` | ordre, direction, visibilité par appareil, points de rupture du site | 5 |
| `tests/header-menus-navigateur.test.js` | trois niveaux, clavier, tiroir, focus piégé, suivi des clics | 9 |
| `tests/header-megamenu-navigateur.test.js` | panneau : survol, clic, clavier, pleine largeur, mobile, isolation, republication, suivi des clics | 9 |
| `tests/header-recherche-navigateur.test.js` | recherche plein écran, suggestions, route, XSS, widget inchangé | 7 |
| `tests/header-compte-navigateur.test.js` | menu du compte (visiteur réel) | 4 |
| `tests/header-minipanier-navigateur.test.js` | tiroir du panier (vrai panier) | 5 |
| `tests/header-visiteur.test.js` | condition « visiteur » : validation, priorité, conflits | 9 |
| `tests/header-visiteur-public.test.js` | invité et membre réels, cache partagé exclu | 4 |
| `tests/header-accessibilite-navigateur.test.js` | repères, noms, focus, cibles, contraste | 6 |
| `tests/header-isolation.test.js` | isolation entre deux sites | 5 |
| `tests/header-performance-navigateur.test.js` | CLS de cinq modes, tâches longues | 7 |
| **Total** | | **104** |

Exécution finale (7 novembre 2026, une seule exécution séquentielle avec le contrôle ciblé du § 7) : **les 14 fichiers passent intégralement — 19 suites ✔, 0 ✖.**

## 5. Défauts réels trouvés ET corrigés pendant la mission (par les tests)
1. **Régression de mon lot menus** : les liens des sous-menus étaient numérotés avant celui de leur rubrique (suivi des clics décalé) — attrapée par `tests/editeur-v2`, corrigée, test dédié ajouté.
2. **Mode « fixé » faisait sauter la page** (CLS 0,16) à cause d'un espaceur ajouté par script — refait dans le flux (position collée), CLS < 0,1 pour les cinq modes.
3. **Mouvement réduit non respecté par le tiroir gauche** (règle plus spécifique qui annulait la désactivation) — corrigé.
4. **Échap ne fermait pas un sous-menu / panneau** tant que le focus restait dans la rubrique — corrigé (`is-dismissed`), bénéfice pour les sous-menus existants.
5. **Panneau de méga-menu pouvant dépasser de l'écran** — recalé par script.
6. **Le visiteur n'était pas transmis** à la résolution des en-têtes des pages publiques (la condition « visiteur » aurait toujours vu un invité) — transmis ; vérifié avec un compte réel.
7. **Cibles tactiles de 28 px** pour les bascules du tiroir — portées à 44 px.
8. **Tests existants devenus faux** après la refonte précédente du Theme Builder (7) — mis à jour et documentés (voir l'historique Git).

## 6. Non fait, ou fait partiellement (à lire)
- **Calques orientés rangées/zones** et **bascule d'état de défilement sur le canevas** de l'éditeur : non faits (le canevas ne montre pas l'état « défilé »).
- **Vignettes** : pictogrammes dédiés pour recherche/compte/panier/réseaux : non faits.
- **Menu** : image et badge d'un élément : non faits (icône, description, classe : faits).
- **Mini-panier** : branché sur le panier des **formations** ; le panier de la **boutique de produits** n'est pas branché.
- **Barre d'annonce, horaires, contact** : pas de widget dédié (composition des widgets existants).
- **Tiroir à contenu libre** (hors menu) : non construit ; le tiroir mobile affiche le menu.
- **Sélecteur de langue/devise** : exclu (aucun site multilingue à commuter ; Elementor n'a pas non plus de widget natif).
- **Structure HTML** : l'en-tête reste dans `<main>` (structure historique) avec `role="banner"` ; le sortir de `<main>` demanderait de revoir tout le gabarit de page.
- **Pas testé** : un vrai écran tactile ; un lecteur d'écran réel (VoiceOver/NVDA) ; l'INP réel ; Safari et Firefox (tests en Chrome seulement) ; les performances sous charge.
- **Étude Elementor** : aucune vérification dans un Elementor installé.

## 7. Régressions
Contrôle ciblé de **73 fichiers** (tous les `theme-builder-*`, `header-*`, les tests qui touchent la recherche, le compte, le mini-panier, les menus et les widgets modifiés) : **687 tests, 681 réussis, 6 échecs — tous déjà présents avant la mission**.
Un contrôle plus large (familles `editeur-*`, `apparence-*`, `widgets-*`, etc.) a été lancé puis arrêté : trop lent. Il avait déjà révélé 3 échecs d'`apparence-styles-navigateur` / `apparence-templates-navigateur`, **vérifiés identiques sur le code d'avant la mission**.
Échecs **déjà présents avant la mission** (vérifiés en relançant les mêmes tests sans mes changements) :
- `widgets-parts-regression` : types de widgets du registre ≠ référence (`motionsplittext`, `sidebar`).
- `widgets-interactions-navigateur` (diaporama / carrousels), `widgets-parties-rendu-navigateur` (parties), `widgets-publie-navigateur` (2 cas) : mêmes échecs sur le code d'avant la mission (vérifié par relance isolée).
- `apparence-styles-navigateur` (1 cas) et `apparence-templates-navigateur` (2 cas) : idem.
- `theme-builder-apercu-vignette` (rendu d'un modèle de produits) et `theme-builder-catalogue-direct-navigateur` (filtre d'identité du catalogue).
- `site-menu-c1-navigateur` : 4 cas du menu d'administration d'un site.
La suite complète du projet (787 fichiers) n'a **pas** été exécutée en entier : trop longue sur cette machine.

## 8. Publication et déploiement (état réel)
- **Commits** : 20 commits sur `header-builder-elementor` (documentation, lots L0 à L8, audit).
- **Push** : la branche `header-builder-elementor` est poussée sur GitHub (`claudieucode/koyekola`). **Confirmé** par la réponse du dépôt distant.
- **Fusion dans `main` : NON FAITE.** Pendant la mission, `main` a reçu d'autres travaux sur les en-têtes (nouvelle bibliothèque « Atelier », identité du modèle ou du site, effet « masquer », logo alternatif au défilement). Un essai de fusion dans un espace isolé donne **8 zones de conflit dans 6 fichiers** (`nodes.js`, `landing/index.js`, `themeRender.js`, `_node.ejs`, `_sections.ejs`, `landing.css`) : les deux travaux modifient les mêmes mécanismes (lecture des réglages d'en-tête sur le premier enfant, effets de défilement, logo). Les concilier demande des décisions de fond (un seul modèle de réglages, un seul effet « masquer ») et de refaire les tests des deux côtés : ce n'est pas une opération à faire en aveugle.
- **Déploiement : NON FAIT.** Les outils Hostinger n'étaient pas connectés et le déploiement se fait à la main dans hPanel depuis `main`. Rien n'a été déployé ; aucun test de fumée en production n'a été fait.
