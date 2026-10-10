# Plan de non-régression — contrôle des widgets (parties de style)

*Établi au LOT 0. Rien n'est implémenté ; ce plan doit être **vert avant** et **vert après** chaque lot. Il réutilise l'existant : `scripts/audit-widgets.js` (banc d'essai de bout en bout des 86 types, voir `docs/WIDGETS-INVENTAIRE.md`),
`tests/widgets-contrat.test.js`, `tests/editeur-widgets*.test.js`, `tests/editeur-canvas-*-navigateur.test.js`, `scripts/perf/bench-page-builder.js` (`docs/perf-page-builder.md`), Playwright + Chrome système.*

## 1. Principe directeur

> Une page enregistrée avant l'évolution produit **exactement le même HTML et le même CSS** après l'évolution, tant qu'aucune partie n'est stylée.

Tout le plan sert à démontrer cette phrase, puis à prouver que chaque nouvelle capacité va jusqu'au bout (interface → modèle → rendu → enregistrement → rechargement → annuler / rétablir → écrans → aperçu → publication).

## 2. Filet de sécurité (à créer en LOT 4a, avant tout code fonctionnel)

| Test | Méthode | Critère |
|---|---|---|
| Instantané du rendu des 86 types | Pour chaque type : insérer un exemple (`PALETTE[type].blank()`), rendre via `renderPreview` (HTML) et `pageCss()` ; enregistrer dans `tests/fixtures/widgets-rendu/<type>.{html,css}` | différence = 0 octet après chaque lot, tant qu'aucune partie n'est utilisée |
| Instantané de pages réelles | Copies anonymisées de pages existantes (modèles livrés avec l'éditeur, bibliothèque de blocs, pages de démonstration) | idem |
| Aller-retour sans modification | Ouvrir une page dans l'éditeur réel, ne rien changer, laisser l'enregistrement automatique se faire | brouillon identique (hors horodatage) ; CSS publié identique |
| Anciennes données | Charger le brouillon d'une page créée avant le lot (fichier figé dans `tests/fixtures`) | `normalizeNode` l'accepte, rendu identique |
| Clé inconnue | Page contenant `parts` ouverte par l'ancien code (branche précédente) | pas d'erreur, partie ignorée |

## 3. Tests unitaires du moteur de parties (LOT 4b)

1. `normalizeNode` : une partie déclarée est validée par la grammaire fermée ; une propriété hors `groups` de la partie est refusée avec un message en français ; une partie inconnue est refusée ; `parts` absent → nœud inchangé.
2. `pageCss()` : sélecteur = `.kw-n-<id> <select>` ; écrans (`@media`) et états corrects ; aucune règle pour une partie vide ; identifiant invalide ignoré.
3. Sécurité : aucun sélecteur ni déclaration saisis par l'auteur ne sont jamais recopiés ; valeurs de longueur / couleur / ombre hors grammaire refusées ; `expression`, `url(javascript:)`, `}` injectés refusés.
4. Contrat de widget (`widgets-contrat.test.js` étendu) : pour chaque widget qui déclare `parts`, rendre le gabarit et vérifier que chaque `select` existe dans le HTML ; chaque classe a un style par défaut (test « aucune classe orpheline » existant) ; les défauts de la partie sont en `:where()`.
5. Limites : taille du document, profondeur, nombre d'éléments (400) inchangés.

## 4. Tests dans un vrai Chrome (Playwright) — par widget modifié

Pour chaque widget dont les parties sont déclarées (à jouer dans l'ordre d'arrivée des lots) :

| Étape | Vérification |
|---|---|
| Sélection | l'Inspector propose « Partie : … » ; seuls les groupes autorisés de la partie s'affichent ; la racine garde son profil actuel |
| Réglage | modifier rayon, fond, bordure, ombre, remplissage (carte) ; hauteur, rayon, ajustement (image) ; police, taille, graisse, couleur, interligne (titre) ; taille, couleur, espacement (date) ; taille, couleur, interligne, lignes maximum (extrait) : le canevas change **immédiatement**, sans perdre la sélection, le défilement ni le zoom |
| Écrans | ordinateur / tablette / mobile : valeurs distinctes ; un champ vide reprend la valeur de l'écran plus grand ; vérification des valeurs calculées dans l'iframe pour chaque écran |
| États | survol / focus d'une partie déclarée : valeurs calculées via `page.hover()` / `focus()` |
| Enregistrer | attendre l'enregistrement, relire le brouillon en base : `parts` présent et complet |
| Recharger | recharger la page de l'éditeur : mêmes valeurs dans l'Inspector et dans le canevas |
| Annuler / rétablir | une étape par geste (curseur compris) ; retour exact des valeurs ; la partie vide disparaît du JSON |
| Réinitialiser | « Réinitialiser la partie » supprime son jeu de styles et rend les valeurs par défaut du thème (pas zéro) |
| Aperçu | l'aperçu en fenêtre et l'onglet d'aperçu montrent les mêmes valeurs calculées |
| Publier | page publiée : mêmes valeurs calculées ; aucun élément d'éditeur dans le HTML (pas de classes `pb-*`, pas d'overlay) ; CSS publié ne contient que les parties stylées |
| Copier / coller | style d'une carte collé sur une autre carte de même type ; type différent : seules les parties de même clé |
| Sans modification | un widget jamais touché garde la sortie de l'instantané |

Cas particulier « Derniers articles » (LOT 5) : page de test avec ≥ 3 articles publiés, réglages de la mission § 44 (carte, image, titre, date, extrait), 3 écrans, puis enregistrer → recharger → annuler → rétablir → aperçu → publier, relevés de valeurs calculées pour chaque partie.

## 5. Accessibilité

* Contrôle automatique du contraste texte / fond pour les parties typographiques de la page de test (réutilise les outils de contraste de l'éditeur, `tests/editeur-contraste-navigateur.test.js` pour l'Inspector).
* HTML : aucune différence de balisage entre une page avec et sans `parts` (comparaison d'arbre DOM sans `class="kw-n-…"`).
* Focus clavier : une partie interactive (lien de la carte) garde un focus visible ; `outline` n'est pas dans la grammaire de style, il ne peut donc pas être supprimé.
* Images : l'attribut `alt` n'est jamais modifié par un réglage de style.

## 6. Performance (LOT 13)

Protocole existant : `scripts/perf/bench-page-builder.js --sizes=20,100,300,400` (le produit plafonne à **400 éléments** : un banc à 500 n'est pas réalisable sans changer cette limite).
Mesures avant / après chaque lot, mêmes machines : insertion, sélection, ouverture de l'Inspector, modification d'une propriété, curseur (images par seconde), glisser, défilement, zoom, enregistrement, annuler / rétablir, poids du CSS généré, temps de `POST /rendu`.

| Critère de réussite | Seuil |
|---|---|
| Temps d'une modification de propriété (400 éléments) | ≤ référence + 5 % |
| Temps d'ouverture de l'Inspector sur un widget à parties | ≤ référence + 5 ms |
| Poids du CSS d'une page sans partie | identique à l'octet |
| Poids du CSS d'une page avec 50 cartes stylées | proportionnel aux parties stylées (pas d'inflation par élément) |
| Mémoire / fuite | aucune croissance sur 200 modifications |

## 7. Régressions à surveiller en priorité (risques propres à cette évolution)

1. Spécificité CSS : une règle par défaut de `landing.css` plus forte que celle de l'auteur (effet « mon réglage ne marche pas ») ou plus faible que le style de la racine (régression visuelle d'une page existante).
2. Options de widget qui changent la structure (`posts` : grille / liste) : sélecteurs stables pour les deux.
3. Copie de pages / blocs / composants / modèles de page / révisions : `parts` conservé partout.
4. Limite de taille du document et temps de validation.
5. Widgets personnalisés existants : aucun n'est modifié tant qu'il ne déclare pas `parts`.
6. Historique : taille des captures (le document grossit un peu) ; limite de 150 étapes inchangée.
7. États : les états ne sont pas déclinés par écran (comportement conservé, documenté).

## 8. Suites existantes à relancer à chaque lot

`tests/widgets-contrat.test.js`, `tests/editeur-widgets.test.js`, `tests/editeur-widgets-personnalises.test.js`, `tests/editeur-conformite-widgets.test.js`, `tests/site-widgets*.test.js`,
`tests/page-builder-editeur.test.js`, `tests/editeur-canvas-*-navigateur.test.js`, `tests/editeur-rendu-en-place-navigateur.test.js`, `tests/editeur-mouvement-navigateur.test.js`,
`tests/page-builder-performance-navigateur.test.js`, `tests/refonte-design.test.js` + `node scripts/audit-widgets.js` (banc complet 86 types).
Remarque de fiabilité : sous forte charge de la machine, certains tests navigateur échouent « à tort » (déjà observé) ; un échec se confirme en relançant le test seul.

## 9. Critère de fin de chaque lot

Un lot est terminé quand : (a) l'instantané « sortie identique » est vert, (b) les tests du lot sont verts en Chrome réel, (c) le banc de performance est dans les seuils, (d) la matrice (`KOLAKISA_WIDGET_CONTROL_MATRIX.md`) est mise à jour avec le nouveau statut, (e) la mise en ligne a été vérifiée.
