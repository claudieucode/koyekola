# Style Studio — rapport d'implémentation

## Modèle
Un style = classe globale `{ name (identifiant), label (nom affiché), styles, states, meta { source, categories, updated } }`. Le nom saisi est converti en identifiant (sans accents, tirets) ; renommer ne change que `label` : **les liens ne se cassent pas**.
Catégories : `src/marketing/pages/stylePresets.js` (7 catégories, définies par clés de `STYLE_PROPS`/`COMPOSED`, testées : aucune clé inconnue, aucun doublon, structure/contexte parent exclus).

## Fonctions (public/js/page-builder.js)
- **Enregistrer** : dialogue (nom, aperçu réel, catégories repliables avec propriétés, tout/aucun avec case indéterminée, écrans et états, résumé, remplacement signalé, « appliquer à cet élément »).
- **Appliquer** (`applyStyleTo`) : *Compléter* = lien seul, réglages propres prioritaires, rien retiré. *Remplacer* = lien + retrait des réglages propres des **catégories du style** (les autres catégories ne sont pas touchées). Mode mémorisé dans le navigateur.
- **Redéfinir** : dialogue prérempli avec les catégories du style, nombre d'éléments concernés affiché, nom conservé.
- **Dissocier** (`unlinkStyleFrom`, copie) : apparence conservée. **Retirer** : coupe le lien et l'apparence.
- **Supprimer** : dissocie d'abord tous les éléments de la page (apparence conservée) puis supprime.
- **Bibliothèque** : recherche, filtre par catégorie, aperçu, « Appliqué » sur l'élément sélectionné, nombre d'éléments, renommer, dupliquer, redéfinir, supprimer.
- **Menu contextuel** (calques, canevas, « ⋯ ») : section « Style » : Appliquer un style…, Enregistrer comme style…, Modifier le style…, Redéfinir…, Dissocier, Retirer. Barre flottante : bouton « Enregistrer comme style ». Palette : bibliothèque.
- **Styles de texte** : un style limité à la catégorie typographie est un style de bloc de texte (filtrable par catégorie). Pas de style de caractère : le moteur de texte n'a pas de sélection de caractères par style.
- Serveur : `nodes.normalizeClassDefs` valide `meta`; `editorSpec` expose `presetCategories` et le nom CSS des propriétés (aperçus).
