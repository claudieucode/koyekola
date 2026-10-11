# Écarts du moteur de propriétés et de contrôles

*Chaque ligne a été constatée dans le code ou par un test, jamais supposée. Statuts : **Corrigé** (avec test), **Conforme** (vérifié, rien à faire), **Choix conservé** (comportement voulu, documenté), **Écart connu** (non traité ici, voir limites).*

## A. Famille par famille (plan de la mission, §4)

| Famille | Constat | Statut |
|---|---|---|
| 4.1 Nombres | Bornes, pas, entier/décimal, vide = hériter, saisie invalide refusée avec message : conformes pour 14 des 16 nombres. **« Colonnes de texte » et « Lignes maximum » n'avaient aucune borne ni caractère entier côté interface (D2).** | Corrigé |
| 4.2 Unités | Chaque menu n'offre que des unités acceptées par le serveur ; mots-clés `auto`, `fit-content`, `min-content`, `max-content` limités aux dimensions où ils ont un sens. Changer d'unité **conserve le nombre** (pas de conversion) et l'annonce par un message. | Conforme / Choix conservé |
| 4.2 Unités | Le serveur accepte aussi `vh`/`vw` là où le menu ne les propose pas (ex. `vh` pour une largeur) ; une unité absente du menu, tapée à la main, est refusée avec un message. | Choix conservé |
| 4.2 Unités | `calc()`, `clamp()`, `min()`/`max()`, `minmax()`, `ch`, `vmin`, `vmax`, `inherit`/`initial`/`unset` : **non pris en charge** (grammaire de longueurs fermée : aucune valeur CSS libre n'atteint la page, car les pages sont servies sur le domaine des comptes des élèves). « Hériter » = champ vide. | Écart connu (voulu pour la sécurité) |
| 4.3 Listes | Toute option proposée est acceptée par le serveur (test automatique sur 110 propriétés) ; valeur inconnue → refus nommant le réglage ; les boutons à icônes retombent sur la liste si la valeur enregistrée n'a pas d'icône (ex. `start` de la grille). | Conforme |
| 4.3 Listes | **Positions du fond et de l'image : 5 mots-clés seulement (D5).** | Corrigé (4 coins ajoutés) |
| 4.4 Couleurs | HEX 3/6/8, `rgb()`, `hsl()`, transparence, jetons du site : conformes. **Contour du texte : le jeton n'était pas converti (D1).** | Corrigé |
| 4.5 Booléens | Un booléen `false` explicite et une clé absente se comportent pareil au rendu ; les valeurs par défaut vraies (ex. « mouvement réduit ») enregistrent bien `false`. Vérifié sur 118 cases de 79 types. | Conforme |
| 4.5 Booléens | **Case « nouvel onglet »** : n'a d'effet que pour une adresse `https://` (le serveur écarte le réglage sinon) ; le libellé l'annonce. | Choix conservé |
| 4.6 Curseurs | 60 déplacements = 1 rendu + 1 enregistrement ; aucune perte de valeur finale. | Conforme |
| 4.7 Typographie | Police (bibliothèque + historiques), graisse 300–900, taille, interligne, espacements, casse, alignement, décoration, ombre : écrits et rendus. Décoration limitée à aucune / soulignée / barrée (pas de style ni de couleur de décoration) ; styles de police normal / italique. | Conforme / Écart connu (modèle) |
| 4.8 Fond, bordures, effets | Propriétés composées : chaque champ modifie sa part sans écraser les autres (ombre, filtres, transformation, dégradé). Arrondi par coin et épaisseur par côté : indépendants quand le mode « délié » est actif. | Conforme |
| 4.9 Médias | Résolutions d'image (miniature … très grande, adaptative) : service unique `media/variants.js`, repli sur l'original ; champ « image dynamique » : **saisie ignorée sans message (D4)**. | Corrigé |
| 4.10 Liens / attributs | Ancres, classes, attributs validés avec message explicite (refus 422 nommant le champ). | Conforme |
| 4.11 Mise en page | Réglages d'enfant selon la mise en page du parent (flex / grille) ; placement en grille écrit en **une** déclaration `grid-column: début / fin`. | Conforme |
| 4.12 Spécialisés | **Séparateur : position du texte perdue sans texte (D3).** Champs en paire (bouton + adresse) : voir B. | Corrigé / Écart connu |

## B. Transversal

| Sujet | Constat | Statut |
|---|---|---|
| Source de vérité | Une seule (`STYLE_PROPS`) ; aucune définition dupliquée à rapprocher à la main, sauf les tables d'interface (bornes `NUM`, unités `UNITS`) désormais **comparées automatiquement** au serveur | Corrigé (test de contrat) |
| Valeur propre / héritée / absente | Voir l'architecture : propre ≠ héritée ≠ absente ; ↺ supprime la surcharge de l'écran ou de l'état affiché | Conforme |
| Champs liés par paires | Bouton de fenêtre, verso de carte : un texte sans adresse (ou l'inverse) est écarté **sans message** à l'enregistrement ; le diaporama, lui, refuse avec un message clair. Incohérence de présentation, pas de perte de document. | Écart connu |
| Contrôles dépendants | Case « agrandir au clic » masquée dès qu'un lien existe (annoncé par une aide) ; valeur d'un contrôle masqué non effacée par l'interface | Conforme |
| Tests d'interface périmés (jsdom absent) | 3 tests de contrôles échouaient depuis des évolutions antérieures sans qu'on le sache (D6) | Corrigé |
| Contrôles « purement visuels » | Aucun trouvé : les 5 éléments × 70 réglages pilotés agissent sur le document, le CSS généré et la page publiée | Conforme |
