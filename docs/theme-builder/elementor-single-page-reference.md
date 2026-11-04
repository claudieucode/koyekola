# Elementor — périmètre « Single Page » : référence et écarts Kolakisa

Rédigé le 2026-11-04. Complète `ELEMENTOR_THEME_BUILDER_REFERENCE.md`, `ELEMENTOR_DISPLAY_CONDITIONS.md`, `ELEMENTOR_TEMPLATE_LIFECYCLE.md` et `elementor-single-post-reference.md` sans les répéter.

Règle : une information n'est « confirmée » que si le texte officiel a été lu **dans ce travail**. Les textes sont reformulés, jamais recopiés.

## 1. Sources et limites de la consultation

| Source | Statut le 2026-11-04 |
|---|---|
| elementor.com/help/the-elementor-theme-builder/ | **Non lue aujourd'hui** : HTTP 502 (deux tentatives) |
| elementor.com/help/conditions/ | **Non lue aujourd'hui** : HTTP 502 |
| Pages d'aide déjà consultées le 2026-10-31 / 2026-10-10 et consignées dans `ELEMENTOR_THEME_BUILDER_REFERENCE.md`, `ELEMENTOR_DISPLAY_CONDITIONS.md`, `docs/elementor-reference/16-official-sources.md` | Reprises telles quelles (elles portent leur propre date) |
| Interface réelle d'Elementor | **Jamais observée** : aucune installation Elementor n'est disponible ici |

Conséquence : tout ce qui suit est classé en trois niveaux. Aucune capture d'écran, aucune valeur de réglage par défaut d'Elementor n'est avancée.

## 2. Comportements confirmés (pages d'aide déjà lues, voir les documents ci-dessus)
* Le Theme Builder range les modèles par type ; « Single Page » (Page individuelle) est un type de modèle de contenu, au même titre que Single Post.
* Un modèle se crée vide ou depuis la bibliothèque, se dessine dans l'éditeur visuel, puis se **publie** ; à la publication, une fenêtre de **conditions** s'ouvre (par défaut « Entire Site », puis Include / Exclude), modifiable ensuite.
* Les conditions décident où le modèle s'affiche ; plusieurs modèles peuvent correspondre, le plus précis l'emporte (règle détaillée dans `ELEMENTOR_DISPLAY_CONDITIONS.md`).
* Le contenu propre de la page s'insère dans le modèle par un élément dynamique de contenu (équivalent de « Post Content ») ; titre et image mise en avant ont leurs éléments dynamiques.
* Un aperçu avec un contenu réel (« Preview Dynamic Content As ») existe pour vérifier le rendu.

## 3. Comportements observés
Aucun (pas d'accès à l'interface d'Elementor).

## 4. Non vérifiables ici
Réglages exacts des panneaux, valeurs par défaut des contrôles, comportement précis du redimensionnement responsive d'Elementor, contenu exact de sa bibliothèque de modèles de pages. Kolakisa ne prétend pas les reproduire pixel pour pixel.

## 5. Choix propres à Kolakisa pour « Page individuelle »
| Sujet | Choix |
|---|---|
| Bibliothèque | 100 compositions de **pages** (10 familles × 10), construites en éléments natifs du Page Builder ; aucune image, prix, témoignage ou chiffre inventé (consignes entre crochets) |
| Éléments | grille / flex et points de rupture natifs (tablette ≤ 2 colonnes, mobile 1) ; aucun positionnement absolu |
| Contenu de la page | élément `postcontent` ; sur une page du Page Builder, le **contenu propre de la page prend sa place** dans le modèle |
| Titre / résumé | `{{post.title}}` et `{{post.excerpt}}` deviennent le titre et la description de la page ; l'image mise en avant (absente d'une page) retire l'élément image |
| Conditions | mêmes règles que les autres types (page précise, enfants, accueil = vue « front ») |
| Repli | pas de modèle publié applicable, page à sections historiques, tunnel : rendu inchangé |
