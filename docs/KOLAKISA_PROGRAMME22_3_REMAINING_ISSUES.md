# Points restants — programme 22.3

1. **Programme 22.2 :** aucune décision retrouvée ; non prise en compte.
2. **Page Generator / Plan de site :** non branchés sur `layoutGen.composePage` ; l'écran de sélection est le point d'entrée. Les sections générées ne passent pas par `pageGen/mapper.js`.
3. **Hero vidéo, sections à défilement animé, formulaire dans l'arbre :** non générés.
4. **Analyse d'équilibre :** structurelle et textuelle, pas de mesure sur rendu pixel ; dimensions d'image inconnues sauf si fournies (`w`/`h`).
5. **Aperçu :** filaire (structure réelle), pas un rendu fidèle des couleurs/typographies du site. L'aperçu fidèle reste l'éditeur de la page.
6. **Direction artistique :** lue par mots-clés (description, ton) ; pas de lecture directe des jetons du Design Generator.
7. **Régénération globale d'une page :** possible par plusieurs éléments en une opération (confirmation requise) ; pas d'écran « page entière ».
8. **Protections :** appliquées par ce moteur (section verrouillée/validée/modifiée). Un verrou posé sur un nœud interne n'est pas contrôlé (granularité = section).
9. **Accessibilité :** onglets/groupes/aria-live présents ; pas d'essai lecteur d'écran. Contraste des sections foncées garanti par règle (couleur de texte associée), pas mesuré sur le thème du site.
10. **Performance :** composition de 12 sections en < 2 s (test) ; pas de mesure du temps de rendu ni de prévisualisation côté navigateur.
11. **Navigation :** aucun lien vers l'écran depuis le menu du site (adresse directe).
