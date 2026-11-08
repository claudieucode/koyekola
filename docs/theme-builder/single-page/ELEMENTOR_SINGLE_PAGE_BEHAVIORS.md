# Comportements Single Page : Elementor ↔ Kolakisa

| Comportement | Elementor | Kolakisa (constaté) |
|---|---|---|
| Création | Type Single Page, vide ou bibliothèque (C) | « Utiliser ce modèle » → copie en **brouillon** sans condition |
| Édition | Éditeur Elementor | Page Builder (brouillon versionné, révisions) |
| Aperçu | « Preview Dynamic Content As » (C) | Aperçu de bibliothèque ; **pas** de choix d'une page réelle pour ce type |
| Publication | Fenêtre de conditions (C) | « Publier » avec conditions ; rien n'est publié sans action explicite |
| Conditions | Include / Exclude (C) | Toutes pages, page précise, enfants de…, accueil (vue « front ») ; exclusion > inclusion |
| Priorité | Non documentée (N) | Plus précis, puis plus récent, puis plus petit identifiant ; égalité parfaite refusée |
| Un seul modèle effectif | Conflit signalé (C) | Un gagnant par page |
| Page qui sert de modèle | — | Jamais enveloppée par elle-même |
| Pages à sections historiques, tunnels (landing en entonnoir) | — | Rendu inchangé |
| Contenu de la page | Post Content (C) | `postcontent` unique par modèle, remplacé par le contenu de la page |
| Titre en double | Possible | Possible : le modèle apporte le H1 |
| En-tête / pied de page | Modèles séparés | Idem (types globaux) ; ajoutés autour du résultat |
| Multi-site | WordPress multisite (hors périmètre) | Copie indépendante par site, testée |
| Dépublier | Retour au rendu d'origine | Testé : la page retrouve son rendu d'origine |
