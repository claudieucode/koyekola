# Création guidée comme seul mode de création d'une page

**2026-10-31.** L'écran de démarrage d'une page vide ne propose plus « Création classique » : toute nouvelle page ouvre directement le catalogue de gabarits de la création guidée.

## Audit (état avant)
- Écran : `public/js/page-builder.js` (« Écran de démarrage d'une page vide »), conteneur `[data-pb-start]`. Il n'apparaît que pour un vrai état vide (écriture permise, aucune section, aucun format, aucune modification).
- **Classique** : ouvrait le sélecteur de structures **sans écrire de format** (`theme.layout` absent). **Guidée** : écrit `theme.layout` (format, largeur maximale, marge latérale, verrou) par `setLayout`, la même voie que l'onglet « Page ».
- **Cause des marges incohérentes** : une page sans `theme.layout` n'a ni largeur maximale ni marge latérale initiales ; chaque conteneur les règle séparément, d'où marges cumulées et largeurs différentes entre canevas et site publié.
- Une page n'enregistre pas de « mode » : seul `theme.layout` (présent ou non) distingue les deux origines. **Aucune migration de données n'est donc nécessaire.**

## Changement
- Une page vide ouvre le catalogue (`beginGuided`) avec le format recommandé (`standard`, verrouillé). « Continuer avec une page vide » ou « Appliquer le gabarit » écrit toujours un format. Il n'y a plus ni carte « classique », ni illustration, ni bouton « Commencer », ni **Annuler/Retour** sur cet écran (ils auraient laissé une page sans format) ; Échap ne le ferme pas.
- Supprimés : `startCard`, l'illustration `classic`, le corps non-accueil de `paintStartChoice`.
- **Conservé volontairement** : l'accueil rouvert à la demande (icône Accueil) sur une page qui a du contenu garde « Reprendre », « Ajouter une structure » (ajoute des conteneurs à la page courante : ce n'est pas un mode de création), « Choisir un gabarit » et « Nouvelle page vierge ».
- **Pages existantes** : non converties, ouvertes et modifiées comme avant (l'écran ne revient pas dès qu'une section ou un format existe).

## Tests
`canvas-vide-choix`, `canvas-vide-compatibilite`, `accueil-catalogue`, `accueil-reprise`, `nommage-page` (navigateur) adaptés ; helper `dismissStart` mis à jour (traverse le parcours guidé).

## Limites
- Le format est verrouillé par défaut ; la personne peut le déverrouiller ou changer de format dans l'onglet « Page ».
- Une page vierge dont l'écran est quitté par navigation (sans valider) reste sans format jusqu'à la prochaine ouverture, où l'écran réapparaît.
- Retour en arrière : rétablir le bloc supprimé dans `page-builder.js` (historique Git) ; aucune donnée à restaurer.
