# Audit de la manipulation et de l'édition visuelle

*Mission 6. Branche `edition-visuelle` (partie de `58a75a1`). Rapports des missions 1 à 5 lus (état partagé et historique : mission 1 ; aperçu immédiat : missions 3 et 4 ; références et classes : mission 5).*

## 1. Système réel (code et comportement)
| Fonction | Mécanisme (`public/js/page-builder.js`) |
|---|---|
| Sélection | une liste `selection`, partagée entre le canevas (iframe) et les calques ; contour `.pb-sel-box`, badge nom × taille, boîte du parent |
| Clics du canevas | interceptés par l'éditeur : liens, boutons et texte ne se comportent pas comme chez le visiteur |
| Redimensionnement | poignées **Largeur (e)**, **Hauteur (s)**, **les deux (se)** (`resizeStart`) : magnétisme (Alt le coupe), Maj = proportions, mesure de la pente réelle (Flexbox, Grille), geste `gesture` sans enregistrement, **une** étape d'annulation à la fin |
| Poignées d'écart / marge intérieure | `pbDirect` (module séparé), ✓ testées en mission préexistante |
| Déplacement | calques (glisser-déposer HTML5), poignée « Déplacer » de la barre d'actions, Alt + ↑ / ↓ |
| Dupliquer / supprimer | Ctrl + D, Suppr, calques, barre d'actions ; `reIdAll` (mission 1) |
| Historique | instantanés complets (150 pas), clé de regroupement pour les gestes continus |

## 2. Vérifié dans Chrome (nouveaux tests, vraies souris)
| Question | Résultat |
|---|---|
| Un clic sur un bouton externe (`newTab`), un lien dans un texte, un conteneur navigue-t-il ? | **Non** : aucune navigation, aucun onglet ; l'élément cliqué est sélectionné (pas son parent) |
| Une poignée écrit-elle la bonne propriété, pour l'appareil affiché seulement ? | Oui : tablette → `styles.tablet.width` ; ordinateur et mobile intacts ; relu après rechargement |
| Largeur automatique figée en px ? | Non : tirer la poignée « Hauteur » n'écrit que la hauteur |
| Annuler un redimensionnement | une seule étape |
| Glisser un conteneur sur son propre descendant | refusé, arbre inchangé |
| Déplacer un élément dans un autre conteneur | identité, contenu, styles gardés ; 0 nœud perdu ; annuler / rétablir exacts ; persiste |
| Dupliquer un conteneur imbriqué | tous les identifiants neufs et uniques (parent **et** enfants) ; classe, couleur du site (`token:`) et valeur de tablette conservées ; copie sélectionnée ; annuler retire la copie ET ses enfants ; supprimer la copie laisse l'original |
| Écouteurs / mémoire | 120 sélections de plus ne font pas grossir le nombre d'écouteurs (stable après 40 premières : +95 une fois) |

## 3. Défauts démontrés et corrigés
**D1 — l'unité d'origine était perdue.** Tirer la poignée d'un élément réglé à `50 %` écrivait `500px` : l'élément fluide devenait fixe, au détriment du responsive. Même effet pour `rem`, `em`, `vw`, `vh`. Correction : l'unité est conservée (le facteur px ↔ unité est mesuré sur l'élément au début du geste) ; un élément sans valeur propre ou en mots-clés (`auto`, `fit-content`) reçoit des pixels, car l'utilisateur vient de fixer une taille.

**D2 — valeur inatteignable enregistrée.** Tirer au-delà d'une largeur (ou hauteur) **max.** déclarée enregistrait une valeur (`529px` pour un élément plafonné à `300px`) que la page n'affichait jamais, et que l'inspecteur montrait comme réelle. Correction : si une borne min. / max. **déclarée** empêche la taille demandée, elle n'est pas enregistrée et un message l'explique. Un premier essai fondé sur la taille rendue était trop large (en Flexbox la taille rendue diffère normalement de la valeur) : il avait cassé le test de magnétisme ; remplacé par la détection d'une borne déclarée.

## 4. Non constaté
Aucune perte de nœud, aucun cycle, aucune fuite d'écouteurs, aucune navigation involontaire, aucun doublon d'identifiant.
