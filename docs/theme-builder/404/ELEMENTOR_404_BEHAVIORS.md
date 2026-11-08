# Comportements d'Elementor pour une page 404 (et équivalent Kolakisa)

> Niveau de confiance : voir ELEMENTOR_404_REFERENCE.md. Colonne « Kolakisa » vérifiée dans le code (références dans KOLAKISA_EXISTING_ARCHITECTURE.md).

| Comportement | Elementor | Kolakisa aujourd'hui |
|---|---|---|
| Créer un modèle 404 | Theme Builder → Single → 404 [officiel] | « Utiliser » un modèle de la catégorie Page 404 : crée une page-modèle (copie) + un modèle en brouillon (`catalog/use.js:17-31`) |
| Partir d'un modèle prédéfini ou vide | Oui [blog] | Oui (bibliothèque de 100 modèles actuels ; modèle vide possible) |
| Éditer avec les widgets | Éditeur visuel [officiel] | Éditeur de pages Kolakisa (même moteur de widgets) |
| Conditions d'affichage | Include/Exclude, plusieurs règles [officiel] | Include/Exclude, score par règle, départage par date de publication puis id (`resolve.js`, `match.js`) |
| Un seul modèle 404 actif | Oui, le plus récent selon un guide [tiers] | Oui : meilleur score, puis le plus récent, puis plus petit id |
| Prévisualiser | Aperçu depuis l'éditeur | Aperçu et vignette de la bibliothèque (`/apercu`, `/vignette`) ; aperçu avec le site réel |
| Publier / brouillon | Point de publication [officiel] | Brouillon → publication (`replace:true` remplace l'ancien modèle) |
| Statut HTTP | Non garanti par l'aide officielle [à vérifier] | **404 réel**, fixé par le routage avant le rendu (`server.js:198`) |
| Indexation | À vérifier avec un outil [tiers] | `noindex` en balise et en en-tête `X-Robots-Tag` sur les domaines de site |
| Redirections | Extension / réglage séparé | Redirections gérées **avant** la 404 (`seo/redirects`), anciennes adresses en 301 |
| Modèle différent par site | Un site WordPress = une installation | Un modèle par site, résolution par `req.kwSite` (jamais par la requête) |
