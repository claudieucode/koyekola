# Barre d'actions contextuelle de l'éditeur de pages

Barre flottante posée sur l'élément sélectionné du canevas, et son menu « Plus d'actions » (⋯, clic droit, calques).
Code : `public/js/page-builder.js` (registre `CANVAS_ACTIONS`, `canvasActionsFor`, `openMenu`), outils avancés chargés à la demande :
`public/js/page-builder-ctx.js`. Aucun changement serveur, hors une clé (`userId`) ajoutée aux données de démarrage de l'éditeur
(`src/marketing/web/landing.js`) pour isoler les préférences par compte.

## Principe : améliorer sans reconstruire
La barre et le menu existaient déjà et branchent de vrais mécanismes (historique `change()`, sauvegarde, composants, styles enregistrés).
Rien n'a été remplacé : les actions manquantes ont été ajoutées au même registre, le menu a été regroupé, et les défauts trouvés ont été corrigés.

## Inventaire (état avant / après)

| | Commande | Avant | Maintenant |
|---|---|---|---|
| A (existait, OK) | Sélectionner le parent, déplacer (glisser, Alt+↑/↓), dupliquer, masquer, verrouiller, supprimer, réinitialiser, enregistrer comme style, copier / couper / coller, copier / coller le style, grouper, renommer (F2), enregistrer comme composant, détacher | oui | inchangées |
| B (à améliorer) | Menu « Plus » | liste plate de 25 lignes | 5 groupes : Organisation, Presse-papiers, Apparence, Réutilisation, Avancé |
| B | Masquage | un seul interrupteur, libellé flou | « Masquer (désactivé sur le site publié) » distinct des écrans ; état lisible |
| B | Suppression | sans confirmation | confirmation à partir de 15 éléments imbriqués ; toujours annulable |
| B | Sortie de la barre | disparition sèche | sortie douce (opacité + recul), mouvement réduit respecté |
| B | Clavier | Entrée sur un bouton de la barre lançait l'écriture du texte ; Échap fermait le menu mais **désélectionnait** l'élément ; le focus n'était pas rendu | corrigés (voir « Défauts corrigés ») |
| C (absent) | Visibilité par écran dans la barre (bouton ordinateur / tablette / mobile) | menu inspecteur seulement | bouton + entrées du menu |
| C | Déplacer vers un autre conteneur | glisser seulement | fenêtre de choix (jamais un descendant ni un emplacement verrouillé) |
| C | Sélectionner premier enfant / élément précédent / suivant | absent | menu |
| C | Ouvrir dans Structure | absent | menu |
| C | Ajouter à l'intérieur | barre, pour certains conteneurs | menu, pour tout conteneur |
| C | Enregistrer comme élément global | choix seulement avec plusieurs éléments | entrée dédiée, pré-cochée « global » |
| C | Insérer un composant existant | absent du menu | ouvre Éléments › Composants |
| C | Note de l'équipe, classes / CSS / attributs | inspecteur seulement | accès direct (ouvre le bon groupe) |
| C | Informations sur l'élément | absent | fenêtre : type, identifiant, chemin, enfants, états, styles par écran, classes, ancre, attributs, note, composant |
| C | Personnaliser la barre | absent | choix des raccourcis visibles, restauration par défaut |

## Ce qui n'a PAS été fait (et pourquoi)
- **Éditeur d'images avancé** : n'existe pas, aucune commande n'y mène.
- **« Masquer temporairement dans l'éditeur seulement »** : n'existe pas dans le modèle de données (`hidden` désactive l'élément sur la page publiée). Ajouter cette notion demande un champ et un rendu serveur : non fait pour ne pas inventer de donnée.
- **Visibilité « grand écran »** : le serveur n'accepte que ordinateur / tablette / mobile pour `hideOn` ; l'option « grand écran » était offerte par l'inspecteur mais ignorée en silence. Elle a été retirée de l'inspecteur et n'est pas proposée dans le menu.
- **Historique propre à un élément, liste des dépendances** : pas de source de données ; « Informations » donne les faits disponibles (composant lié + nombre d'utilisations).
- **Préférences de la barre** : mémorisées dans le navigateur (`localStorage`, clé `pb:cbar-hide-<identifiant utilisateur>`), propres au compte **sur ce navigateur** ; elles ne suivent pas l'utilisateur d'un navigateur à l'autre (il faudrait une table serveur).
- **Barre déplaçable** : non faite (elle se replace seule au-dessus / dessous / dans l'élément pour ne jamais gêner).

## Défauts corrigés au passage
1. **Entrée sur un bouton de la barre** déclenchait l'édition du texte au lieu d'activer le bouton (inaccessible au clavier).
2. **Échap sur le menu** désélectionnait aussi l'élément (la barre disparaissait, le focus était perdu).
3. **Focus** : après fermeture du menu, il revient au bouton de la barre qui l'avait ouvert (même si la barre a été redessinée).
4. **Visibilité « grand écran »** acceptée par l'interface puis supprimée par le serveur.

## Raccourcis (inchangés, listés dans la boîte « Raccourcis clavier »)
Ctrl/⌘ + D dupliquer · C copier · X couper · V coller · Ctrl+Alt+C copier le style · Ctrl+Maj+V coller le style · Ctrl+Maj+H masquer · Ctrl+Maj+L verrouiller · Ctrl+G grouper · Alt+↑/↓ déplacer · F2 renommer · Suppr supprimer · Ctrl+Z / Ctrl+Maj+Z annuler / rétablir. Aucun raccourci n'est intercepté dans un champ de saisie.

## Architecture
- **Registre** `CANVAS_ACTIONS` : identifiant → { icône, libellé, état « désactivé », action }. `TYPE_ACTIONS` liste les actions propres à chaque type ; `canvasActionsFor` ajoute les communes et retire celles masquées par l'utilisateur. Ajouter une action = une entrée de registre.
- **Menu** `openMenu` : une liste ordonnée d'entrées `[libellé, action, désactivée, raccourci]` ; les entrées incompatibles sont absentes (ex. pas d'enfant pour un titre) ou désactivées (élément verrouillé).
- **Chargement à la demande** `withCtx` : `page-builder-ctx.js` n'est téléchargé qu'à la première utilisation de « Informations », « Déplacer vers… » ou « Personnaliser » ; il n'est jamais chargé sur le site publié.
- **Historique** : toute modification passe par `change()` ; une action = une entrée (libellée), annulable et rétablissable.
- **Mouvement** : jetons `--kol-motion-*` et `KolMotion` existants ; `transform`/`opacity`/`scale`/`translate` uniquement ; durées à 0 en `prefers-reduced-motion`.

## Tests
`tests/editeur-barre-contextuelle-navigateur.test.js` (Chrome réel, 12 scénarios, vérifie le brouillon ENREGISTRÉ en base) et
`tests/editeur-barre-contextuelle-perf-navigateur.test.js` (mesures sur 280 éléments ; `PERF_OUT=fichier.json`).
