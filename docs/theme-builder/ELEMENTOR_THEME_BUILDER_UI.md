# Elementor Theme Builder — interface et parcours

Décrit d'après la documentation écrite (captures non transmises).
* Barre supérieure « Theme Builder » (titre, « Add New », Import).
* Barre latérale : étiquettes de types avec point vert/gris et « + » au survol.
* Vue « toutes les parties » : grille de cartes avec miniature ; vue par type : liste des modèles du type + détails.
* Détail d'une partie : Edit, Edit Conditions, Instances ; menu ⋯ : Export, Trash, Rename.
* Éditeur de conditions : lignes Inclure/Exclure + cible ; ajout de lignes ; enregistrer.
* Création : choix du type, nom, ouverture de l'éditeur ; options Publier / Brouillon dans l'éditeur.
Cible Kolakisa : mêmes parcours, avec en plus : duplication, archivage, restauration, recherche/filtre, versions (voir parité).

## Refonte visuelle (31/10/2026) — interface calquée sur la capture Elementor
* Plein écran (rattaché au `body`) : barre blanche 56 px (logo, « THEME BUILDER », site, fermeture → tableau de bord du site), navigation latérale 240 px (« Toutes les parties », « Parties du site » + icônes, état actif à barre gauche), zone principale (titre, description, séparateur, outils, grille de cartes 4–5 colonnes sur ordinateur).
* Carte d'un modèle : en-tête (nom + icône d'infos), miniature filaire générée par le serveur à partir du vrai document, état, conditions, actions (Modifier, Conditions, Publier, menu ⋯). Carte d'une partie SANS modèle : pointillés, libellée « Aucun modèle » ; l'infobulle précise que la structure est un exemple et non l'aperçu du site ; « Créer un modèle » préremplit le type.
* Responsive : sous 800 px la navigation devient un bandeau défilant ; aucune barre de défilement horizontale du document (820 et 390 px testés).
* Inchangés : routes, API, services, stockage, permissions, isolation par site, éditeur de pages. Tests : `tests/theme-builder-elementor-ui.test.js` (3) + les tests existants.
