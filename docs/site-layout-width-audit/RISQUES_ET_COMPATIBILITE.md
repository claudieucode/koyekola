# Risques et compatibilité

| Risque | Gravité | Atténuation |
|---|---|---|
| Des pièces Theme Builder existantes comptent sur la colonne de 760 px (ex. contenu centré sans `band`) ; les passer en pleine largeur les étire | Élevée | Ne changer que les pièces sans réglage explicite ; comparaison avant/après ; ou option par pièce |
| Packs en `!important` (`base.css:4`) : toute règle plus faible est ignorée | Moyenne | Ne pas lutter ; passer par `var()` de repli |
| ~133 packs avec colonnes internes propres | Moyenne | Étape 11 limitée à `base.css` ; échantillon visuel de packs |
| `100vw` + barre de défilement → défilement horizontal | Moyenne | Mesure `scrollWidth` ; préférer `width:100%` |
| Relever le défaut 760 px modifie le rendu de sites déjà publiés | Élevée | Jeton avec repli = valeur actuelle ; changement du défaut seulement pour les nouveaux sites ou avec accord explicite |
| Vues EJS : grilles plus larges → images étirées | Moyenne | `aspect-ratio` / `object-fit` déjà à vérifier |
| Multi-site : un réglage de largeur fuit vers un autre site | Élevée | Jetons posés par site (`req.kwSite`) ; test à deux sites |
| Doublon header/footer (rendu historique + pièce) | Moyenne | Ne pas toucher à `themeLayout.js`, tester `themeHeader` présent/absent |
| Fichiers de test header déjà modifiés dans l'arbre de travail | Faible | Constater l'état avant de commencer |
| Mouvement : ne pas animer de propriété de mise en page (charte `KOLAKISA_MOTION.md`) | Faible | Aucune transition sur width |

## Dépendances
`themeRender.js` ↔ `landing.css` ↔ `siteSettings.js` ↔ packs `base.css` ; vues EJS indépendantes (style.css/boutique.css) ; éditeur lit les mêmes props `full`/`band`.

## Limites de cet audit
Lecture statique ; aucun rendu navigateur ; captures de la mission non vues ; `appearance()` (`<style id="kw-appearance">`) et `pages/index.js:936` (`partBleeds`) non inspectés en détail ; l'effet exact par pack n'a pas été testé pack par pack.
