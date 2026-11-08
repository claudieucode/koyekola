# Page individuelle — architecture existante de Kolakisa (audit du 8 novembre 2026)

Audit en lecture seule : aucun code, aucun modèle, aucune page n'a été modifié.

## 1. Constat principal
La catégorie contient **déjà 100 modèles** (10 familles × 10 : à propos, contact, services, équipe, aide, tarifs, preuves, carrières, juridique, campagnes), livrés le 2026-11-04. Ils sont construits par **assemblage** : chaque famille a 5 « corps » de page, chaque modèle choisit une des 10 « ouvertures » (une permutation par famille), une des 6 « conclusions » et une identité visuelle. C'est précisément le risque que la mission veut éviter : 100 modèles dont l'ossature vient de 10 + 50 + 6 pièces communes.

Mesure faite aujourd'hui (même méthode que l'audit Article : arbre des éléments, similarité de Jaccard, 4 950 paires) :

| Mesure | Résultat |
|---|---|
| Modèles | 100 |
| Similarité maximale entre deux modèles | 0,92 |
| Paires ≥ 0,80 | 4 |
| Paires entre 0,60 et 0,80 | 26 |
| Paires entre 0,40 et 0,60 | 180 |
| Paires < 0,40 | 4 740 |
| Similarité moyenne | 0,10 |
| Types d'éléments utilisés (hors conteneurs) | une trentaine sur plus de 160 disponibles |

Le test existant (`theme-builder-page-individuelle-100`) exige « 100 signatures différentes », ce qui est plus faible que le seuil de 80 % appliqué aux articles : 4 paires dépassent ce seuil.

## 2. Où est quoi
| Élément | Fichier |
|---|---|
| Catalogue | `src/themeBuilder/catalog/single_page.js` (183 lignes : HEROES, TAILS, BODIES, FAMILIES, permutation OPEN) |
| Mécanisme de catalogue | `catalog/index.js` (`entries()` propre à chaque type), `catalog/kit.js` (identités, éléments) |
| Types, vues | `src/themeBuilder/types.js` : `single_page`, vues `front` et `page` |
| Conditions, priorités | `conditions.js`, `match.js`, `resolve.js` : exclusion > inclusion, plus précis, plus récent, plus petit identifiant |
| Rendu public | `render.js` `singleFor` + `withSiteParts` / `themeSingleSections` : le contenu propre de la page **remplace l'élément `postcontent`** du modèle |
| Stockage | « Utiliser » copie le document dans une page (`mk_landing_pages`, kind `page`) + ligne `mk_tb_templates` (brouillon) |
| Éditeur | Page Builder (`public/js/page-builder.js`) |
| Tests | `tests/theme-builder-page-individuelle-100.test.js` (≈ 15 tests), `…-navigateur.test.js` (Chrome) |
| Docs existantes | `docs/theme-builder/elementor-single-page-reference.md`, `kolakisa-single-page-library.md` |

## 3. Particularité décisive : un modèle de page est un cadre, pas une page
Le modèle contient **exactement un `postcontent`** (contrôlé) ; c'est là que vient le contenu réel de chaque page. Autour : titre `{{post.title}}` (H1), ouverture et conclusion fournies par le modèle. Conséquences :
* une page d'accueil, une page de tarifs complète ou une landing page « toute faite » ne peut pas vivre uniquement dans le modèle sans écraser ou dupliquer le contenu de la page ; le modèle sert à ce qui est **commun** aux pages d'un même type (ouverture, bandeau, colonne latérale, conclusion), le reste est saisi dans la page elle-même ;
* une page qui répète son titre dans son contenu a deux titres ;
* l'image mise en avant n'existe pas pour une page : l'élément `{{post.image}}` est retiré.

Kolakisa possède par ailleurs une **bibliothèque de pages complètes** du Page Builder (`src/marketing/pages/templates.js`, `lib100/`, `structures.js`, `blanks.js`). Il y a donc un risque réel de **faire deux fois la même bibliothèque**, ce que la mission interdit. Il faut trancher (voir `TARGET_ARCHITECTURE.md`).

## 4. Contenu dynamique de page (constaté)
`{{post.title}}`, `{{post.excerpt}}` (description de la page), contenu via `postcontent`. Les étiquettes `{{post.*}}` propres aux articles (date, auteur, catégories, commentaires…) n'ont pas de sens pour une page. Champs personnalisés **de page** : aucun. Des « champs personnalisés » existent seulement dans la fiche entreprise du site (`business.custom1` à `custom6`), c'est autre chose.

## 5. Autres constats
1. Formulaires : `signupform` n'est utilisé que si le site possède un formulaire réel ; sinon un encart de contact. C'est correct (pas de fausse saisie).
2. Les icônes de réseaux sociaux pointent vers les pages d'accueil de Facebook et LinkedIn : ce sont des liens génériques, à remplacer par ceux du site.
3. Le compte à rebours des campagnes porte une date fictive (2099) signalée dans le modèle.
4. Textes d'exemple = consignes entre crochets (bon principe : aucun faux chiffre, prix ou témoignage).
5. Pas de sélecteur « Aperçu avec » (page réelle) pour ce type.
6. Widgets disponibles mais jamais utilisés par la bibliothèque : galerie, carrousels, vidéo, audio, compteurs, barres de progression, flip box, appel à l'action, titre animé, avis, bandeau défilant, fenêtre modale, abonnement e-mail, coordonnées entreprise, accroches de défilement, ainsi que les composants « motion » (voir inventaire).
7. Préservation des données : une ligne `mk_tb_templates` ne référence que le document copié, jamais la clé du catalogue. Retirer une clé ne casse aucun site (testé par la bibliothèque précédente).

## 6. Composants réutilisables
Kit d'éléments (`kit.js`), grammaire fermée `nodes.js` (limites `MAX_NODES`, `MAX_DEPTH`), registre de widgets, `signupform`, conditions d'affichage, aperçu/vignette (source unique `build()`), audit statique modèle des articles (`scripts/audit-article-individuel.js`, à dupliquer pour les pages : `scripts/audit-page-individuelle.js` n'existe pas).

## 7. Complément du 8 novembre 2026 — système de styles
Voir `STYLE_INHERITANCE_AND_OVERRIDES.md`. En bref : 99 modèles de page sur 100 sont écrits en jetons du site (1 814 couleurs `token:*`, 486 polices « site », 0 police de bibliothèque), alors que les 200 modèles d'en-tête et de pied de page sont en valeurs fixes (0 jeton). La cause est le choix des identités de `catalog/kit.js` (alias des jetons du site), aggravé par le fait qu'un site neuf porte la charte Kolakisa (`DEFAULT_TOKENS` : bleu `#0277b6`, marine `#0b2a40`). Aucune contamination par le CSS de l'administration n'a été observée dans le rendu public ; en revanche la feuille d'un thème (pack) actif peut passer devant les styles d'un modèle. Il n'existe aucun mode « hériter / indépendant ».

Note : les sections 1 à 6 ont été rédigées avant ce second cahier des charges et restent valables ; la partie « 100 concepts » est complétée par des directions artistiques (`100_TEMPLATES_DIVERSITY_PLAN.md` § 5).
