# KOLAKISA — Médias des produits

## Réalisé
- Étape « Images et médias » : liste des produits **du catalogue réel** avec leur image ; « Choisir / Remplacer » ouvre la **médiathèque du site** (fichiers du site seulement, `aiMedia.library`) et écrit `image_url` par le service natif `catalog.updateProduct`. La provenance et les droits restent portés par le gestionnaire de médias ; l'interface signale « générée par IA » si c'est le cas.
- Droit exigé : `shop.write`. Une image d'un autre site n'est jamais proposée ni acceptée.
- Une fiche sans image est signalée (vérifications) et la fiche créée par l'IA rappelle qu'**une photo réelle est recommandée** : une image générée ne représente pas fidèlement un produit réel.

## Non réalisé (limites réelles)
- **Génération d'images de produits** : le générateur de médias (21.7) ne couvre que les bandeaux et sections « Image » des pages ; aucun emplacement « image de produit » n'existe. Le constructeur le dit à l'étape (il ne simule pas).
- Galerie de plusieurs images par produit, visuels de catégories, bannières promotionnelles, variantes visuelles : non pris en charge par cette intégration.
- Texte alternatif : généré dans le brouillon de contenu (SEO) mais **le moteur n'a pas de champ « alt » produit** : il n'est pas écrit dans le catalogue (l'alt reste dans la médiathèque).
