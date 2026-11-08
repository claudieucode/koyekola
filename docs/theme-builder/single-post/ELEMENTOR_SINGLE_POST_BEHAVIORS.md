# Comportements Single Post : Elementor ↔ Kolakisa

| Comportement | Elementor | Kolakisa (constaté) |
|---|---|---|
| Création d'un modèle | Type Single, bibliothèque ou toile vierge (C) | « Utiliser ce modèle » → copie en **brouillon**, sans condition |
| Édition | Éditeur Elementor | Page Builder (brouillon versionné, révisions) |
| Aperçu | Choix d'un article d'exemple (C) | « Aperçu avec » (article choisi ou plus récent) |
| Publication | Fenêtre de conditions (C) | « Publier » avec condition obligatoire à choisir ; rien n'est publié sans action explicite |
| Conditions | Inclure/Exclure : tous, article, catégorie, étiquette (C) | Inclure/Exclure : tous, ids, catégorie, sous-catégorie, étiquette, auteur (ET) ; vide = tout |
| Priorité | Non documentée (N) | Précis 100 › descendants 80 › taxonomie/auteur 60 › type 40 › général 20 › site 10 ; égalité par date puis id ; égalité parfaite refusée (choix Kolakisa) |
| Un seul modèle effectif | Conflit signalé (C) | Un gagnant par article |
| Duplication / archivage / suppression | Général (D) | Dupliquer, archiver, supprimer côté site |
| Header/footer conservés | Oui | Oui (types globaux séparés) |
| Multi-site | WordPress multisite (hors périmètre) | Copie indépendante par site, testée |
| Post Content unique | Oui, requis (C) | Un `postcontent` et un `{{post.title}}` par modèle (contrôlé) |
| Sidebar | Widget Sidebar / zones (N) | Type `sidebar` global affiché sous le contenu |
