# Kolakisa — bibliothèque « Page individuelle » (100 modèles)

Rédigé le 2026-11-04. Référence Elementor : `elementor-single-page-reference.md`.

## 1. Périmètre
Type de modèle `single_page` du Theme Builder : une **page** (à propos, contact, services, équipe, aide, tarifs, preuves, carrières, juridique, campagnes). Ce ne sont ni des articles ni des archives : aucun élément `posts`, `postmeta`, `postnav`, `postcomments`, `archiveinfo` ni boutique n'y figure (vérifié par test). Seule exception admise : la liste dynamique des **auteurs** (page Équipe).

## 2. Audit initial (avant remplacement)
| Constat | Détail |
|---|---|
| Ancienne bibliothèque | 20 mises en page × 5 identités = 100 entrées, mais **chaque mise en page n'existait qu'en 5 variantes de couleur/arrondi** : 20 compositions réelles seulement |
| Clés | `mise-en-page.identité` (ex. `classique.clair`) |
| Source unique | le catalogue est du code (`src/themeBuilder/catalog/single_page.js`) ; la vignette, l'aperçu et « Utiliser » partent du même `Catalog.build` (cause racine déjà corrigée pour les pieds de page, `KOLAKISA_THEME_BUILDER_PIED_DE_PAGE_CAUSES_RACINES.md`) |
| **Effet public** | **un modèle `single_page` publié n'avait aucun effet sur les pages d'un site** : seule la page « À propos » historique (site principal) passait par la région `static_page`. Reproduit : modèle publié, page `/contact` du site → page inchangée |
| Données | une ligne `mk_tb_templates` ne référence que le **document** copié (page), jamais la clé du catalogue : supprimer l'ancien catalogue ne casse aucun site |

## 3. Suppression de l'ancienne bibliothèque
Le catalogue est du code : les 100 anciennes entrées sont retirées d'un coup (`Catalog.find("single_page", "classique.clair")` → `null`, testé). Aucune donnée n'est supprimée : les pages et modèles que les sites ont déjà créés sont des **copies indépendantes** et restent intacts. Aucun cache de vignette ne ressert un ancien modèle (les clés de cache incluent la clé du catalogue ; les anciennes clés n'existent plus).

## 4. Architecture
* `src/themeBuilder/catalog/single_page.js` : `standalone: true` (une entrée par modèle, chacun avec SA composition et SON identité : mécanisme de `catalog/index.js`). Clés `famille-NN` + identité (ex. `tarifs-03.editorial`).
* Un modèle = **ouverture** (10 compositions de haut de page) + **corps** (5 par famille) + **conclusion** (6 appels à l'action). Chaque famille utilise les 10 ouvertures une fois chacune (permutation) ; le test impose 100 structures différentes.
* Éléments natifs uniquement (`iconbox`, `accordion`, `tabs`, `timeline`, `pricing`, `testimonial`, `profilecard`, `table`, `alert`, `countdown`, `toc`, `breadcrumb`, `map`, `signupform`, `menu`, `social`…), validés par la grammaire réelle du Page Builder (`normalizeSections`).
* Identités : `clair`, `doux`, `editorial`, `marque`, `nuit` (jetons du site ; seule « Nuit » pose ses teintes).

## 5. Schéma de données
Aucune nouvelle table, aucune migration. « Utiliser » crée une page (`mk_landing_pages`, `kind = page`, `site_id`) contenant le document, puis la ligne `mk_tb_templates` (`type = single_page`, brouillon, `source_kind = page`).

## 6. Règles de rendu public (nouveau)
`withSiteParts` (pages publiées et leur aperçu) appelle `themeSingleSections` :
1. `themeBuilder/render.singleFor` choisit le modèle `single_page` **publié** qui s'applique (vue « front » pour l'accueil, sinon « page » ; ancêtres pour « enfants de… ») avec les règles habituelles (exclusion > inclusion, plus précis, plus récent, plus petit identifiant).
2. Le contenu propre de la page remplace l'élément `postcontent` du modèle ; `{{post.title}}` / `{{post.excerpt}}` = titre / description de la page ; l'élément image `{{post.image}}` est retiré (une page n'a pas d'image mise en avant).
3. Repli inchangé si : aucun modèle applicable ; page d'un tunnel (`kind ≠ page`) ; page qui sert elle-même de modèle ; page à sections historiques (non « layout ») ; modèle sans exactement un `postcontent` ; toute erreur.
4. En-tête, pied de page, barre latérale et modèles personnalisés s'ajoutent comme avant, autour du résultat.
Conséquence à connaître : le modèle apporte le **titre H1** ; une page qui le répète dans son propre contenu aura deux titres (même principe qu'Elementor).

## 7. Responsive
Grilles : 3-4 colonnes en bureau, ≤ 2 en tablette, 1 en mobile (réglé dans le kit, vérifié par test). Aucune largeur en pixels sur les colonnes (%, `maxWidth` centré), aucun positionnement absolu ou fixe. Contrôle navigateur (3 largeurs, débordement horizontal) : `tests/theme-builder-page-individuelle-navigateur.test.js`.

## 8. Règles d'affichage, sauvegarde et publication
Identiques aux autres types (`ELEMENTOR_DISPLAY_CONDITIONS.md`, `ELEMENTOR_TEMPLATE_LIFECYCLE.md`) : brouillon → conditions → publication (révision, 409 en cas de conflit), jamais d'application d'un brouillon.

## 9. Tests
| Fichier | Contrôle |
|---|---|
| `tests/theme-builder-page-individuelle-100.test.js` | 100 exactement, 10 familles de 10, 100 structures distinctes, H1 + contenu présents, ni article ni archive, aucune donnée inventée, mise en page robuste, grammaire du Page Builder, filtres, formulaire réel ; vrai serveur : API, « Utiliser » ×100, aperçu = vignette, publication → page publique réelle, isolation entre sites |
| `tests/theme-builder-page-individuelle-navigateur.test.js` | rendu dans Chrome des 100 modèles à 1280 / 820 / 390 px : aucun débordement horizontal, titre visible |

## 10. Ajouter ou modifier un modèle
1. Ouvrir `single_page.js`. Un nouveau **corps** : ajouter une fonction à `BODIES[famille]` ; une nouvelle **ouverture** : `HEROES` ; une conclusion : `TAILS`.
2. Pour un modèle de plus, ajouter son nom à `FAMILIES[…].names` et adapter la permutation `OPEN` : le test refuse deux modèles à la structure identique.
3. Textes d'exemple : consignes entre crochets, jamais de prix, nom, chiffre, adresse ou lien inventés (test).
4. Lancer `node --test tests/theme-builder-page-individuelle-100.test.js`.

## 11. Limites connues
* Pas d'image ni de photo d'exemple (le Page Builder exige une vraie image) : les modèles utilisent des cartes, icônes et consignes.
* Pages à sections historiques (non « layout ») : pas enveloppées.
* Le compte à rebours des modèles de campagne porte une date fictive lointaine (2099) à remplacer ; le modèle le dit.
* Sélecteur « Aperçu avec » (choix d'une page réelle) : non fait pour ce type.
* Parité visuelle exacte avec l'éditeur d'Elementor : non vérifiable (voir la référence).

## 12. Liste des 100 modèles

### À propos

| Clé | Nom | Identité |
|---|---|---|
| `apropos-01.clair` | À propos classique | Clair épuré |
| `apropos-02.doux` | Notre histoire | Doux et arrondi |
| `apropos-03.editorial` | Entreprise : mission et vision | Éditorial |
| `apropos-04.marque` | Association : qui nous sommes | Couleur de marque |
| `apropos-05.nuit` | Présentation d'entreprise | Nuit |
| `apropos-06.clair` | Notre manifeste | Clair épuré |
| `apropos-07.doux` | Une équipe, une vocation | Doux et arrondi |
| `apropos-08.editorial` | Nos valeurs | Éditorial |
| `apropos-09.marque` | Notre engagement | Couleur de marque |
| `apropos-10.nuit` | Présentation institutionnelle | Nuit |

### Contact

| Clé | Nom | Identité |
|---|---|---|
| `contact-01.doux` | Contact et coordonnées | Doux et arrondi |
| `contact-02.editorial` | Formulaire de contact | Éditorial |
| `contact-03.marque` | Contact avec plan d'accès | Couleur de marque |
| `contact-04.nuit` | Contact avec trois canaux | Nuit |
| `contact-05.clair` | Nous rendre visite | Clair épuré |
| `contact-06.doux` | Contact minimaliste | Doux et arrondi |
| `contact-07.editorial` | Contact en bandeau | Éditorial |
| `contact-08.marque` | Prendre rendez-vous | Couleur de marque |
| `contact-09.nuit` | Contact et FAQ | Nuit |
| `contact-10.clair` | Contact en carte | Clair épuré |

### Services

| Clé | Nom | Identité |
|---|---|---|
| `services-01.editorial` | Services en trois colonnes | Éditorial |
| `services-02.marque` | Services et méthode | Couleur de marque |
| `services-03.nuit` | Service détaillé avec devis | Nuit |
| `services-04.clair` | Services par onglets | Clair épuré |
| `services-05.doux` | Domaines d'intervention | Doux et arrondi |
| `services-06.editorial` | Offre de services en bandeau | Éditorial |
| `services-07.marque` | Présentation d'un service SaaS | Couleur de marque |
| `services-08.nuit` | Service et processus | Nuit |
| `services-09.clair` | Catalogue de prestations | Clair épuré |
| `services-10.doux` | Service unique mis en avant | Doux et arrondi |

### Équipe

| Clé | Nom | Identité |
|---|---|---|
| `equipe-01.marque` | Équipe en trois portraits | Couleur de marque |
| `equipe-02.nuit` | Équipe en quatre colonnes | Nuit |
| `equipe-03.clair` | Équipe et auteurs du site | Clair épuré |
| `equipe-04.doux` | Équipe et métiers | Doux et arrondi |
| `equipe-05.editorial` | Équipe et manière de travailler | Éditorial |
| `equipe-06.marque` | Équipe dirigeante | Couleur de marque |
| `equipe-07.nuit` | Équipe pédagogique | Nuit |
| `equipe-08.clair` | Les membres de l'association | Clair épuré |
| `equipe-09.doux` | Équipe en deux temps | Doux et arrondi |
| `equipe-10.editorial` | Équipe en bandeau | Éditorial |

### Aide et FAQ

| Clé | Nom | Identité |
|---|---|---|
| `aide-01.nuit` | FAQ simple | Nuit |
| `aide-02.clair` | FAQ avec rubriques | Clair épuré |
| `aide-03.doux` | FAQ par onglets | Doux et arrondi |
| `aide-04.editorial` | Centre d'aide avec sommaire | Éditorial |
| `aide-05.marque` | Centre d'aide en guides | Couleur de marque |
| `aide-06.nuit` | FAQ du produit | Nuit |
| `aide-07.clair` | FAQ de l'association | Clair épuré |
| `aide-08.doux` | FAQ pratique | Doux et arrondi |
| `aide-09.editorial` | FAQ en carte | Éditorial |
| `aide-10.marque` | FAQ éditoriale | Couleur de marque |

### Tarifs

| Clé | Nom | Identité |
|---|---|---|
| `tarifs-01.clair` | Trois offres | Clair épuré |
| `tarifs-02.doux` | Offre mensuelle ou annuelle | Doux et arrondi |
| `tarifs-03.editorial` | Comparatif des offres | Éditorial |
| `tarifs-04.marque` | Offre principale mise en avant | Couleur de marque |
| `tarifs-05.nuit` | Tarifs par profil | Nuit |
| `tarifs-06.clair` | Tarifs en bandeau | Clair épuré |
| `tarifs-07.doux` | Tarifs SaaS | Doux et arrondi |
| `tarifs-08.editorial` | Tarifs de l'association | Éditorial |
| `tarifs-09.marque` | Tarifs détaillés | Couleur de marque |
| `tarifs-10.nuit` | Tarifs minimalistes | Nuit |

### Preuves et références

| Clé | Nom | Identité |
|---|---|---|
| `preuves-01.doux` | Témoignages en trois citations | Doux et arrondi |
| `preuves-02.editorial` | Témoignages et références | Éditorial |
| `preuves-03.marque` | Portfolio de réalisations | Couleur de marque |
| `preuves-04.nuit` | Témoignages avec présentation | Nuit |
| `preuves-05.clair` | Études de cas par onglets | Clair épuré |
| `preuves-06.doux` | Réalisations en bandeau | Doux et arrondi |
| `preuves-07.editorial` | Avis clients | Éditorial |
| `preuves-08.marque` | Références institutionnelles | Couleur de marque |
| `preuves-09.nuit` | Portfolio minimal | Nuit |
| `preuves-10.clair` | Preuves sociales | Clair épuré |

### Carrières

| Clé | Nom | Identité |
|---|---|---|
| `carrieres-01.editorial` | Carrières et atouts | Éditorial |
| `carrieres-02.marque` | Processus de recrutement | Couleur de marque |
| `carrieres-03.nuit` | Postuler en carte | Nuit |
| `carrieres-04.clair` | Offres ouvertes | Clair épuré |
| `carrieres-05.doux` | Notre culture | Doux et arrondi |
| `carrieres-06.editorial` | Rejoindre l'association | Éditorial |
| `carrieres-07.marque` | Stages et alternance | Couleur de marque |
| `carrieres-08.nuit` | Bénévolat | Nuit |
| `carrieres-09.clair` | Carrières en bandeau | Clair épuré |
| `carrieres-10.doux` | Recrutement sobre | Doux et arrondi |

### Juridique

| Clé | Nom | Identité |
|---|---|---|
| `juridique-01.marque` | Politique de confidentialité | Couleur de marque |
| `juridique-02.nuit` | Conditions d'utilisation avec sommaire | Nuit |
| `juridique-03.clair` | Mentions légales datées | Clair épuré |
| `juridique-04.doux` | Conditions générales en colonnes | Doux et arrondi |
| `juridique-05.editorial` | Politique de cookies | Éditorial |
| `juridique-06.marque` | Mentions légales sobres | Couleur de marque |
| `juridique-07.nuit` | Charte d'utilisation | Nuit |
| `juridique-08.clair` | Politique de remboursement | Clair épuré |
| `juridique-09.doux` | Conditions de service | Doux et arrondi |
| `juridique-10.editorial` | Informations légales en bandeau | Éditorial |

### Campagnes (lancement, événement, inscription, confirmation)

| Clé | Nom | Identité |
|---|---|---|
| `campagne-01.nuit` | Lancement de produit | Nuit |
| `campagne-02.clair` | Événement avec compte à rebours | Clair épuré |
| `campagne-03.doux` | Événement et programme | Doux et arrondi |
| `campagne-04.editorial` | Page d'inscription | Éditorial |
| `campagne-05.marque` | Page de confirmation | Couleur de marque |
| `campagne-06.nuit` | Lancement en bandeau | Nuit |
| `campagne-07.clair` | Webinaire | Clair épuré |
| `campagne-08.doux` | Campagne de soutien | Doux et arrondi |
| `campagne-09.editorial` | Annonce d'ouverture | Éditorial |
| `campagne-10.marque` | Page de remerciement | Couleur de marque |
