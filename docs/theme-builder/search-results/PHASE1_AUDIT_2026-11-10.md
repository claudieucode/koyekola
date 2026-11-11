# Résultats de recherche — Phase 1 : recherche, audit et proposition (10 novembre 2026)

Aucun code n'a été modifié, rien n'a été généré, supprimé ni remplacé. Les mesures ci-dessous ont été faites en lecture seule sur le code et sur le catalogue réel.

## 1. Où en est la catégorie aujourd'hui
La bibliothèque a déjà été refaite une fois (commit `e4a89dd7` puis `b4bf4ed2`) : **100 modèles = 10 contenus × 10 compositions** (blog, magazine, entreprise, portfolio, boutique, formations, pages du site, aide, tout le site, actualités), clés `contenu.composition`. Documentation existante : `../kolakisa-search-results-library.md` (83 lignes) et `../elementor-search-results-reference.md`.

### Mesures faites aujourd'hui sur le catalogue réel
| Mesure | Résultat | Lecture |
|---|---|---|
| Modèles | 100 | OK |
| Dépendance à la charte du site | **97 modèles sur 100** ; 1 528 couleurs liées aux jetons du site contre 452 fixes ; **794 polices « site »**, 0 police de bibliothèque | **Le problème d'indépendance graphique est entier** : les 5 « identités » du kit sont des alias de la charte du site |
| Diversité de structure (similarité de l'arbre d'éléments, 4 950 paires) | **18 paires à 0,90 ou plus (dont des structures identiques à 1,00)**, 10 entre 0,80 et 0,90, 25 entre 0,70 et 0,80 : **53 paires au-dessus de 0,70** | La diversité est celle d'un assemblage 10 × 10, pas de 100 conceptions |
| Éléments utilisés | `archiveinfo`, `search`, grilles à boucle, `catfilter`, `querylist`, `courselist`, `menu`, `account` + conteneurs/textes | Palette de composants étroite |
| Noms | « Blog · Liste », « Boutique · Grille de cartes »… | Noms de combinaisons, pas de créations |

## 2. Elementor / Elementor Pro (recherche web du jour, sources secondaires)
* **Statut Elementor** : la page de résultats est un **modèle d'archive** : Theme Builder → Templates → type « Search Results » (aide Elementor [« Customize the Search Results Archive »](https://elementor.com/help/customize-the-search-results-archive/), dont seul le titre est remonté par la recherche ; le contenu de l'article n'a pas été lu). **Pro**.
* **Widgets** (guide d'un tiers, à recouper avec Elementor) : Search Form, Posts / Archive Posts avec « Query Type = Archive », message « Nothing Found » intégré au widget ; des modules tiers (Search & Filter, No Results for Elementor, Search Query / Search No Results d'un add-on) ajoutent filtres, requête affichée et état vide personnalisé. **Ce ne sont pas des fonctions natives.**
* **Confirmé par des fils de support** (anecdotique) : le message « Nothing Found » du widget peut écraser un texte personnalisé ; un Search Form posé dans un modèle d'archive ne se connecte pas toujours aux résultats.
* **Non vérifié** : conditions d'affichage exactes du type Search Results, priorités, filtres/tri natifs (Elementor n'en fournit pas de façon native selon ces sources), pagination et « load more » des widgets. Les pages officielles n'ont pas été lues intégralement.

## 3. Audit du moteur de recherche de Kolakisa (code lu)
Il existe **trois recherches publiques et une recherche d'administration**, aux règles différentes :
| Recherche | Où | Ce qu'elle fait | Limites constatées |
|---|---|---|---|
| **Résultats du Theme Builder** | `/blog?q=` du site → boucles de modèle (`pages/query.js`, filtre `urlFilter`) | `LIKE` échappé sur titre, extrait et contenu des articles ; produits (nom, description courte), formations (titre, sous-titre), pages ; **seulement du contenu publié**, filtré par site (`mk_content_sites`, `site_id`) ; catégorie d'article cumulable avec le terme ; pagination par numéros ; « charger plus » existe dans le moteur | **Un seul mot-clé en chaîne `LIKE`** (pas de « tous les mots »), `LIKE` insensible à la casse pour l'ASCII seulement : les accents ne sont probablement pas neutralisés (déduit du code, à confirmer par test) ; pas de tri visiteur ; pas de filtres combinés ; pas de classement par pertinence ; nombre de résultats seulement pour les articles |
| **`/recherche`** (historique) | `src/routes/blog.js` | Articles publiés du domaine et pages publiées du **site principal seulement** (`site_id IS NULL`) ; **tous les mots** requis, accents et casse neutralisés ; 30 résultats au plus ; page en `noindex` | **Hors Theme Builder** (page fixe) ; charge **tous les articles publiés en mémoire** puis filtre en JavaScript à chaque requête (coût proportionnel à la taille du site) ; les pages des **sous-sites** ne sont pas cherchées |
| **`/recherche/suggestions`** | idem | Suggestions pendant la frappe (2 caractères mini, 6 résultats, jamais en cache, texte inséré sans HTML) mêmes règles que `/recherche` | Utilisée par le widget Recherche ; articles et pages du site principal seulement |
| Boutique `/…/recherche` | `shopPublic.js` | Recherche de produits | Distincte, à auditer en phase 2 |
| Recherche d'administration | `cmsSearch.js` | Pages, articles, médias, menus selon les permissions | Hors sujet (administration) |
**Constat structurant** : les règles de recherche ne sont pas unifiées (un mot vs tous les mots, accents, périmètre). Les modèles du Theme Builder affichent donc un comportement différent de la recherche historique pour la même saisie.
**Isolation entre sites** : le filtre par site existe dans le moteur de requête et dans `/recherche` (articles) ; testé par `theme-builder-recherche-bibliotheque.test.js`. Les pages du site principal seules sont visibles dans `/recherche` (limite, pas fuite).
**Index** : aucun index plein texte (pas de FTS) ; recherche par `LIKE '%…%'` (balayage de table).
**Données exposées par résultat** (selon le type) : article (titre, extrait, image, catégorie, date, auteur, adresse), produit (nom, prix, image), formation (titre, formateur, prix), page (titre, adresse). Pas de champs personnalisés ni de taxonomies libres.

## 4. Ce que le cahier des charges demande et que le moteur ne sait pas faire
| Demande | État | Conséquence |
|---|---|---|
| Tri (pertinence, date, prix, alphabétique) | **Absent** (ordre fixé par le modèle) | Aucun contrôle de tri ne sera livré tant que le moteur n'en a pas (règle du cahier des charges) |
| Filtres combinés (types, tags, dates, auteurs, prix, attributs) | **Absent** ; seule la catégorie d'article | Décision de développement à valider avant les modèles |
| Pertinence / classement | Absent | idem |
| Recherche instantanée | Suggestions seulement (route dédiée) | Utilisable dans des modèles « suggestions » |
| Défilement infini | Absent (« charger plus » existe) | Non prévu |
| Conservation de la requête et des filtres dans l'URL | **Oui** (`?q=`, `?categorie=`, paramètres de page) | OK |
| États (vide, aucun résultat) | Oui ; chargement et erreur : page rendue côté serveur donc pas d'état de chargement | Documenté |
| Indépendance graphique | **Non** pour 97 modèles | Chantier principal |

## 5. Références professionnelles et bonnes pratiques (sources secondaires, à lire comme des opinions)
* Pages « aucun résultat » : [LogRocket](https://blog.logrocket.com/ux-design/no-results-found-page-ux), [Algolia](https://www.algolia.com/blog/ux/3-examples-to-help-you-transform-the-no-results-search-results-page), [Maersk Design System](https://designsystem.maersk.com/guidelines/search-filter-and-sort/handling-no-results/), [Baymard](https://baymard.com/blog/no-results-page) (seul le titre a remonté) : afficher la requête saisie, proposer de reformuler ou d'effacer les filtres, ne jamais laisser une impasse ; un état vide sans moyen de retirer le filtre responsable est un piège.
* Tri et filtres : tâches distinctes, ne pas cacher le tri dans le filtre ; pertinence par défaut ; filtres actifs visibles et effaçables ; nombre de résultats affiché ([Algolia](https://www.algolia.com/de/blog/ux/best-practices-for-site-search-ui-design-patterns), [UI/UX Atlas](https://uiux-atlas.pages.dev/lessons/information-architecture/search-findability-and-faceted-navigation)).
* Limite : ni Nielsen Norman Group ni les démonstrations Envato / ThemeForest / TemplateMonster n'ont été lues ; aucune démonstration payante n'a été ouverte ; je ne cite donc aucun chiffre de marché.
* **Frontend Design** (consultée) : direction artistique propre au sujet, deux polices au plus, lignes courtes, pas d'étiquettes en majuscules espacées, pas de cartes toutes identiques, mouvement rare. À appliquer à une page de résultats : lisibilité d'abord (densité contrôlée, hiérarchie titre / extrait / méta), l'identité vient de la typographie, de la couleur et du rythme plutôt que d'effets.

## 6. Ce qui peut être réutilisé (le « système v2 » de Page individuelle, déjà éprouvé)
* Identités en **valeurs fixes** (couleurs hexadécimales, polices `font.<id>` de la bibliothèque locale), variables `--kw-*` / `--lp-*` redéfinies **une fois sur la racine du modèle**, racine sans espacement du site, visuels vectoriels originaux (`art.js`).
* **Modes d'identité** (indépendante / héritée / hybride) et conversion sans perte : `identityModes.js`, `identity.js`, colonne `identity_mode`, liste déroulante à l'insertion : déjà branchés sur fiche produit et page individuelle ; `MODE_TYPES` à étendre.
* Contrôles : audit statique (identité, contraste, polices, similarité < 0,70), contrôle d'isolement dans Chrome (deux chartes de site opposées, 0 fuite), captures d'écran relues par un œil humain, test de rendu à trois largeurs.
Aucun nouveau moteur de rendu ni de widgets n'est nécessaire pour l'**apparence** ; l'**expérience de recherche** demande en revanche des décisions sur le moteur (§ 8).

## 7. Architecture cible proposée
1. **Catalogue** : un fichier par groupe de 10 concepts, une conception écrite à la main par modèle, 100 identités fixes, aucune combinaison contenu × composition.
2. **Isolation** : variables d'identité sur la racine du modèle ; les champs de recherche, cartes, puces de catégories, pagination et messages d'état prennent la police, la couleur et les rayons du modèle. Contrôle d'isolement dans Chrome obligatoire (inclure les états « aucun résultat »).
3. **États** : « aucun résultat » conçu pour chaque modèle (requête affichée, nouveau champ, catégories de secours, lectures conseillées) ; « terme vide » : le modèle n'est pas utilisé (liste du blog) ; « chargement » et « erreur » : sans objet tant que la page est rendue côté serveur (documenté) ; « résultats nombreux » : pagination côté serveur, 8 à 12 par page.
4. **Moteur** (voir § 8) : ne rien promettre dans les modèles que le moteur ne fait pas.
5. **Theme Builder** : mêmes conditions et priorités que les autres types ; la page `/blog?q=` reste le point d'entrée ; un modèle de recherche n'affecte ni page individuelle, ni archive, ni 404, ni en-tête / pied de page.

## 8. Décisions de moteur à prendre (le design seul ne les résout pas)
| Sujet | Option A (recommandée pour la phase 2) | Option B (plus ambitieuse) |
|---|---|---|
| Règles de recherche | Unifier `/blog?q=` et `/recherche` : **tous les mots**, accents et casse neutralisés, plafond de résultats | Index plein texte SQLite (FTS5) avec classement par pertinence, mise à jour à l'enregistrement |
| Performance de `/recherche` | Remplacer le chargement complet des articles par une requête SQL bornée | FTS5 |
| Tri | Ajouter un paramètre de tri (date récente/ancienne, alphabétique, prix pour produits) appliqué côté serveur aux boucles ; contrôles de tri **uniquement** dans les modèles quand il existe | + pertinence |
| Filtres | Garder la catégorie ; ajouter **type de contenu** et **tag** (cumulables) si les données le permettent | Auteurs, dates, prix, attributs |
| Pages des sous-sites dans `/recherche` | Chercher les pages du site courant (par `site_id`) | idem |
Sans ces décisions, les 100 modèles se différencieront par la **conception** (composition, rythme, lecture) mais pas par des **fonctions** de tri et de filtre : c'est conforme à la règle « pas de faux contrôles », et c'est dit explicitement.

## 9. Les 100 concepts et la matrice de diversité
Voir `CONCEPTS_AND_DIVERSITY_PLAN.md` : 20 univers × 5 compositions distinctes, avec la faisabilité réelle de chaque composition et une direction artistique (palette fixe + paires de polices). La matrice de diversité réelle (structure, widgets, similarité) sera générée à partir du catalogue construit, comme pour Page individuelle, et le seuil de 0,70 sera un critère de refus.

## 10. Plan de migration et de remplacement sécurisé
* **Inventaire avant toute suppression** (à faire en phase 2) : modèles `search_results` installés par site (`mk_tb_templates`, type `search_results`), leur état (brouillon / publié / archivé), leurs conditions, leurs pages sources ; clés du catalogue référencées (liens d'aperçu partagés) ; `origin_key`.
* **Principe déjà vérifié sur Article, Page, 404** : « Utiliser » **copie** le document dans le site ; le catalogue est du code. Remplacer le catalogue ne supprime aucune page, aucun contenu, aucun modèle de site. Les anciennes clés cessent d'exister dans la bibliothèque (liens d'aperçu partagés mis à part).
* **Sauvegarde et retour arrière** : un commit par étape ; ancien catalogue restitué par `git revert` ; aucune migration de données.
* **Moteur** : toute modification du moteur de recherche passe par une migration additive et des tests de non-régression de `/recherche`, `/blog?q=`, de la boutique et de l'isolation entre sites ; rien n'est supprimé (index, données).

## 11. Plan de tests (à construire par étapes)
Bibliothèque (100, unicité, similarité < 0,70, identités fixes) ; moteur (un mot, plusieurs mots, accents, casse, caractères spéciaux, très longues requêtes, injection `%` `_`, résultats par type, pagination, combinaison terme + catégorie) ; isolation (deux sites, contenu privé, brouillons, corbeille) ; états (vide, aucun résultat, nombreux) ; Chrome (isolement des deux chartes, trois largeurs, états) ; performance (temps de réponse sur un site de plusieurs milliers d'articles) ; non-régression (archives, pages, 404, en-têtes / pieds de page, boutique).

## 12. Décisions attendues de votre part
1. Faut-il **améliorer le moteur** (règles unifiées « tous les mots » + accents ; plafond de performance ; tri ; filtres de type et de tag) en plus de la reconstruction des modèles ? Recommandé : oui, option A.
2. Brancher les **modes d'identité** (indépendante / héritée / hybride) aussi sur les résultats de recherche (recommandé).
3. Valider les **20 univers × 5 compositions** (ou en proposer d'autres).
4. Choisir le **modèle de référence** de la phase 3.
