# Fiche produit — bibliothèque de 100 modèles à identité propre

État livré (branche `single-product-library`). L'audit de départ et la liste des 100 concepts sont dans `kolakisa-single-product-audit.md`.

## 1. Ce qui a changé
| Domaine | Avant | Maintenant |
|---|---|---|
| Catalogue | 20 mises en page × 5 identités du site | 100 modèles à identité propre (`catalog/single_product/*`), 10 familles A à J |
| Couleurs et polices | jetons du site (`token:*`) | valeurs fixes + polices de la bibliothèque locale (aucun `token:` dans un modèle) |
| Modes d'identité | aucun | indépendante (défaut) / héritée du site / hybride, réversibles |
| Fiche publique | formulaire d'achat natif en plus de celui du modèle | un seul formulaire (marqueur `data-kw-shopbuy`), avis et associés natifs masqués si le modèle les fournit |
| Variantes | liste déroulante sans effet sur prix / image / stock | choix par option (liste, boutons, pastilles) ; prix, image et disponibilité de la variante affichés ; le serveur recalcule tout à l'ajout |
| Achat immédiat | absent | `POST /boutique/panier/acheter` : même action que l'ajout au panier (mêmes validations), puis redirection vers `/boutique/commande` |
| Galerie | image seule | `shopgallery` : 8 présentations, miniatures, zoom plein écran clavier / tactile, carrousel |
| Avis, caractéristiques | seulement dans la fiche native | `shopreviews` (avis publiés réels) et `shopspecs` (données réelles) |
| Produits associés | grille « vedettes » | `shopgrid` source `related` (même catégorie que le produit de la page) |
| Conditions | « produit précis » et « étiquette » sans effet sur la fiche publique | `postId` et `tags` transmis au contexte de rendu |
| Aperçu | exemple vide | données d'exemple annoncées dans un bandeau (`demoShop`) |

## 2. Identité graphique
* **Priorité des styles** : valeur posée par l'utilisateur sur un élément > identité du modèle > jetons du site (mode hérité) > défauts du moteur. Les boutons et textes des widgets boutique sont stylés par leurs **parties** (`parts.js`), jamais par `--kw-primary`.
* **Modes** (`catalog/identityModes.js`) : le modèle est construit depuis son identité ; `site` remplace couleurs et polices par les jetons du site ; `hybrid` ne remplace que l'accent et le texte de bouton.
* **Conversion sans perte** (`themeBuilder/identity.js`) : le document courant, le modèle reconstruit dans l'ancien mode et dans le nouveau sont parcourus ensemble ; une valeur n'est remplacée que si elle est encore égale à celle du modèle d'origine. Une valeur personnalisée n'est jamais touchée ; un élément ajouté ou déplacé n'est pas touché. L'état avant conversion est conservé dans l'historique de la page.
* **Stockage** : migration additive `143_tb_identity_mode.sql` (colonne `identity_mode`, NULL = indépendante) ; `origin_key` mémorise le modèle d'origine. Le mode est choisi à l'insertion (liste dans la carte du modèle) ; la route `POST …/modeles/:id/identite { mode }` convertit un modèle existant.
* **Limite connue** : le changement de mode d'un modèle déjà installé n'a pas encore de bouton dans l'interface (route seulement). Le CSS d'un pack de thème n'est pas encore placé dans une `@layer` inférieure (fichiers partagés sensibles).

## 3. Retour arrière
* Catalogue : les modèles déjà installés sont des copies indépendantes dans les sites ; rien n'est supprimé ni réécrit. Annuler = rétablir `catalog/single_product.js` d'avant.
* Migration : colonne nullable ajoutée, aucune donnée modifiée ; la laisser en place ne gêne pas l'ancien code.
* Conversion d'identité : restaurer le point d'historique de la page (« Brouillon enregistré » précédant la conversion).

## 4. Types de produits (réel)
Simple et variable : pris en charge. Numérique : sans livraison, **sans livraison de fichier**. Téléchargeable, groupé, externe : **non pris en charge** par le moteur ; les modèles correspondants (I, J) utilisent des consignes éditables et n'affichent aucune fonction inexistante. Abonnement : l'offre native reste affichée sous le modèle. Personnalisation, contrôle d'âge, accès membre : gérés dans `shopbuy`.

## 5. Tests exécutés
* `scripts/audit-fiche-produit.js` : 100 entrées, 100 identités, 0 `token:`, contrastes ≥ 4,5, similarité max 0,65 (aucune paire ≥ 0,70).
* `tests/theme-builder-fiche-produit-100.test.js`, `tests/theme-builder-catalogue.test.js`, `tests/theme-builder-rendu.test.js`, `tests/programme20-5-boutique-builder.test.js` : réussis.
* `tests/fiche-produit-bout-en-bout.test.js` (vrai serveur) : voir le rapport de livraison pour le résultat final.
* Les serveurs de test demandent `TEST_START_TIMEOUT_MS` élevé sur une machine chargée.

## 6. Non fait / à faire
Rendu visuel dans un navigateur des 100 modèles (aucun navigateur utilisé) · bouton de conversion d'identité dans l'éditeur · `@layer` pour les packs · produits téléchargeables, groupés, externes, abonnement dans le widget · alerte de retour en stock · livraison estimée · « souvent achetés ensemble » · canonical / Open Graph · critères marque / type / taxonomie · recherche ThemeForest / TemplateMonster / Creative Market (non consultés).
