# Publication unique — moteur de rendu

## Chaîne de rendu d'un article
1. `routes/blog.js` identifie l'article de CE site (hôte vérifié) ; `singlePostFor(req)` résout les réglages (défauts < thème < site ; brouillon superposé seulement dans l'aperçu autorisé).
2. Données réelles : contenu, métadonnées, auteur, image (`cover_path`), termes, commentaires, voisins (`blog.neighbours`, mode chronologique ou même catégorie), similaires (`blog.relatedCandidates` + `singlePost.related`), articles de l'auteur (`blog.authorRecent`).
3. `views/blog/show.ejs` rend, dans cet ordre : zone de titre (`sp/_header`, éléments dans l'ordre et la visibilité choisis) → partage « avant » → sommaire mobile → contenu (`.sp-content`) → étiquettes → blocs de fin **triés par position** (partage, boîte d'auteur, navigation, commentaires, similaires) → appel à l'action → colonne latérale.
4. `<style data-sp-style>` apporte les valeurs (espacements, typographies, couleurs, bordures, ombres, largeur, colonnes) ; `public/css/single-post.css` apporte la structure selon les attributs `data-sp-*`.

## Règles
- Section désactivée : **non rendue** (aucun conteneur vide). Colonne « aucune » : l'`<aside>` n'est pas émis.
- Titre : toujours présent. Zone de titre désactivée → `<h1 class="sr-only">` (une seule H1 par page).
- Un élément sans valeur réelle (pas d'image, d'auteur, de date…) n'est pas rendu ; les séparateurs de métadonnées ne sont posés qu'**entre** deux éléments rendus.
- Positions de fin d'article (rang croissant) : boîte d'auteur « après le contenu » 10 · partage 20 · boîte d'auteur « après le partage » 30 · navigation « après le partage » 31 / « après la boîte d'auteur » 40 · commentaires 35 (« avant la navigation ») ou 60 · similaires juste avant/après les commentaires ou en bas de page · navigation « après les commentaires » 70.
- Doublons : si un modèle Theme Builder fournit déjà boîte d'auteur, navigation ou commentaires, le moteur ne les ajoute pas.
- Contenu éditorial : `.sp-content` ne force aucun style de bloc ; les espacements configurés ne s'appliquent qu'aux éléments listés ; images/tableaux/vidéos bornés à la largeur (pas de débordement) ; tableau défilant.
- Ombre des images : seulement `.sp-content img` (hors icônes ≤ 32 px et émojis) ; jamais avatars, logos ni icônes.

## Mise en page
| Réglage | Effet (≥ 1024 px) |
|---|---|
| Conteneur pleine largeur | colonnes latérales masquées, texte sur toute la largeur |
| étroit / large | largeur du texte 640 / 980 px |
| Largeur personnalisée | `--sp-main` = valeur choisie (480–1920 px) |
| Colonne gauche / droite / aucune | `grid-template-areas` (sommaire à droite quand la colonne est à gauche) |
| Style Ouvert / Encadré | retire / impose bordure, fond, rayon |
Sous 1024 px : colonne unique ; mobile : colonne après, avant ou masquée.

## Chargement automatique
`public/js/single-post-autoload.js` récupère la page publique de l'article précédent (même rendu), en extrait l'article (sans commentaires, formulaires, identifiants), l'ajoute sous l'article lu. Adresses de même origine ; jamais deux fois le même article ; maximum configurable ; mise à jour de l'adresse (`history.replaceState`, le bouton « retour » n'est pas pollué), du titre, de la canonique et de la description ; erreur → message + « Réessayer » ; fin de liste → message. Désactivé par défaut. Aucune animation de défilement imposée (mouvement réduit respecté).
