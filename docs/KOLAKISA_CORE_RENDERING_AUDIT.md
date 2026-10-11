# Audit du rendu

## Chemins
Canevas, aperçu et page publiée passent par le **même** gabarit (`_sections.ejs` → `_node.ejs`) ; la différence est le drapeau `isBuilder` (identifiants de sélection, éléments masqués visibles en transparence). Le style vient de classes `.kw-n-<id>` générées par `pageCss` : une propriété enregistrée mais jamais appliquée est détectée par la garde existante (chaque réglage de STYLE_PROPS a un test d'effet dans `editeur-canvas-proprietes-restantes-navigateur`).

## Défauts trouvés
- **D3** : aucun `try/catch` dans la récursion `_node.ejs` → une exception dans un widget faisait échouer toute la page (HTTP 500). **Correction** : enveloppe `_node-safe.ejs` appelée à chaque niveau. Page publiée : l'élément est omis (rien de technique pour les visiteurs) ; éditeur : repère sélectionnable `kw-node-error` avec message ; l'erreur est journalisée (`console.error`) avec identifiant et type. Aucune donnée n'est modifiée (testé : le brouillon est identique avant/après l'aperçu).
- **D4** : `linksOf` calcule la liste des liens cliquables dans le même ordre que le rendu. Une exception sur un élément faisait échouer tout calcul. **Correction** : par élément, un élément défectueux compte 0 lien. Le compteur du rendu est recalé de la même façon (`href.mark/skip` + `nodeLinkCount`) pour que les liens suivants gardent leur numéro (testé : `/clic/1` mène bien à `/blog`).

## Écarts édition / publication connus (inchangés)
Les sections interactives (onglets, carrousels…) sont rendues comme conteneurs ordinaires dans l'éditeur (volontaire, pour rester modifiables).
