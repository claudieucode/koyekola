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

Exécution finale de ces 14 fichiers : **RESULTAT_HEADER_A_REMPLIR**.

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
Contrôle ciblé sur les familles touchées : **RESULTAT_REGRESSION_A_REMPLIR**.
Échecs **déjà présents avant la mission** (vérifiés en relançant les mêmes tests sans mes changements) :
- `widgets-parts-regression` : types de widgets du registre ≠ référence (`motionsplittext`, `sidebar`).
- `theme-builder-apercu-vignette` (rendu d'un modèle de produits) et `theme-builder-catalogue-direct-navigateur` (filtre d'identité du catalogue).
- `site-menu-c1-navigateur` : 4 cas du menu d'administration d'un site.
La suite complète du projet (787 fichiers) n'a **pas** été exécutée en entier : trop longue sur cette machine.

## 8. Publication et déploiement
Voir le rapport final de la session : état du commit, du push et du déploiement, avec ce qui a réellement été confirmé.
