# Archive — vérification visuelle (Chrome sans interface)

Script : `scripts/verification-visuelle-archive.js [dossier] [--captures=toutes|echantillon|aucune] [--un-sur=N]`. Chaque modèle est rendu par l'aperçu de la bibliothèque dans un cadre de largeur exacte (1280 / 820 / 390 px), puis mesuré : débordement horizontal de la page et éléments qui sortent de l'écran.

## Résultats (4-5 novembre 2026)

La machine était très chargée (plusieurs sessions en parallèle) : une mesure complète des 100 modèles × 3 largeurs n'a pas pu aller au bout. Deux échantillons ont été mesurés.

| Échantillon | Modèles | Mesures | Défauts |
|---|---|---|---|
| Un modèle sur 5 (les 20 contenus en pleine largeur) | 20 | 60 | 3, tous sur « carrousel » : cartes suivantes volontairement hors cadre (le carrousel défile) ; aucun débordement de page |
| Un modèle sur 7 (colonne droite/gauche, bandeau, centré) | 15 | 45 | 1 mesure indisponible (Chrome a dépassé 60 s : `actualites.gauche`, tablette), aucun débordement |

Défauts corrigés après examen des captures : boutons de pagination en bleu navigateur (maintenant aux couleurs du site) ; cartes sans image collées en haut (marge haute ajoutée) ; liste étroite en deux colonnes sur tablette avec colonne latérale (maintenant une colonne) ; en-tête du bandeau décalé de 40 px par rapport au contenu (aligné).

## Non couvert
- 65 modèles sur 100 n'ont pas été mesurés dans Chrome ; leur structure est garantie par les tests du catalogue (pas de position absolue, grilles tablette/mobile, rangées qui passent à la ligne) mais pas par une mesure réelle.
- Aucun contrôle sur de vrais contenus avec images (le site de vérification n'a pas d'articles : l'aperçu utilise les articles d'exemple, sans image).
