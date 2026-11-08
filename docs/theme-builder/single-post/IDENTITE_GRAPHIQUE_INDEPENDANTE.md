# Article individuel — identité graphique indépendante (8 novembre 2026)

## 1. Le problème
Les 100 modèles v2 utilisaient 5 « identités » du site (`clair`, `marque`, `nuit`, `editorial`, `doux`, dans `catalog/kit.js`). Quatre écrivaient des **jetons du site** (`token:primary`, `token:background`, rôles de police…) : un modèle « beige et noir » devenait bleu marine sur un site bleu marine. Mesure du 8 novembre (audit Page individuelle) : 87 modèles d'article sur 100 dépendaient de la charte du site.

## 2. Ce qui est livré (option A, validée)
* **33 identités propres** à valeurs fixes (couleurs hexadécimales, polices de la bibliothèque locale `font.<id>`) : les 22 du catalogue partagé (`catalog/identities.js`, déjà utilisées par les en-têtes et pieds de page) + 11 propres à l'article (`catalog/single_post/identities.js` : sable et lagon, ardoise professionnelle, lin gourmand, océan profond, aubergine, nuit et cuivre, encre et cyan, presse crème, encyclopédie, pêche douce, sauge douce).
* **Répartition** : chaque mise en page garde l'ambiance pour laquelle elle a été dessinée (claire, couleur de marque, sombre, éditoriale, douce) et reçoit, à tour de rôle, une identité de cette ambiance. Deux mises en page voisines n'ont jamais la même palette.
* **Clés inchangées** : `page-blanche.clair` reste `page-blanche.clair` (`keySkin`) ; aucun lien d'aperçu existant ne casse. Le filtre « identité » de la bibliothèque liste désormais les 33 identités.
* **Typographie et widgets fixés** (`catalog/single_post/apply.js`, appelé par `build()`) : le contenu de l'article (texte, titres, citations, liens) reçoit police et couleur de l'identité via le réglage natif « parties » (modifiable dans l'éditeur) ; les textes sans taille reçoivent 16 px (sinon `.lp-site` impose la taille de corps du site) ; le badge passe en ton neutre aux couleurs de l'identité ; la barre de progression prend l'accent de l'identité. Une valeur déjà posée par la mise en page n'est jamais écrasée.
* **Polices** : les deux mises en page qui utilisaient le rôle « mono » du site utilisent `font.jetbrains-mono`.

## 3. Priorité des styles (constatée dans le code)
1. Valeur posée par l'utilisateur sur l'élément (`.kw-n-<id>`, la plus forte, jamais réécrite).
2. Identité du modèle (valeurs fixes écrites sur les éléments du modèle).
3. Défauts du moteur (`landing.css`, règles `:where()` de spécificité 0) et styles globaux du site, qui ne s'appliquent qu'aux propriétés que le modèle ne pose pas.
Aucun `!important`. Les modèles insérés ailleurs (copies indépendantes) ne changent pas quand la charte du site change : la copie ne contient plus aucun jeton.

## 4. Les trois modes : livrés (bascule à l'affichage, document jamais réécrit)
Chaque modèle inséré depuis la bibliothèque mémorise son identité (`mk_tb_templates.identity`, migration `142_identite_modele.sql`, ajout seul) : `{ mode, use, own }`. Le mode se choisit dans le Theme Builder : menu « ⋯ » du modèle → **Identité graphique…** (route `POST …/modeles/:id/identite`).

| Mode | Effet à l'affichage public |
|---|---|
| **Indépendant** (défaut) | Document rendu tel quel : couleurs et polices fixes du modèle. |
| **Suit le site** | Les valeurs EXACTES de l'identité (fond, texte, texte secondaire, fond alterné, accent, texte d'accent, 2 polices) sont remplacées par les jetons de la charte du site (`identityMode.js`). Les filets restent fixes. |
| **Hybride** | Le modèle garde son style, sauf les groupes cochés : « fond et textes », « accent », « polices ». |

Garanties (testées) : le document enregistré n'est jamais modifié ; repasser en « indépendant » restitue un rendu **identique à l'octet près** ; une couleur choisie à la main dans l'éditeur (différente de l'identité) n'est jamais touchée ; l'identité mémorisée est conservée d'un mode à l'autre ; « Dupliquer » garde l'identité et le mode ; un modèle d'un autre site, un modèle sans identité mémorisée, une révision périmée ou un utilisateur non connecté sont refusés. Les modèles insérés AVANT cette livraison n'ont pas d'identité mémorisée : ils restent indépendants et n'ont pas le choix de mode (aucune migration de données).

## 5. Limites connues
* Les widgets dont l'apparence vient de feuilles CSS du moteur (cartes d'articles liés, pastilles de catégories…) héritent de la couleur du texte du modèle (`color: inherit`) ; un thème (pack) actif peut encore cibler `a`, `h1`… (voir `single-page/STYLE_INHERITANCE_AND_OVERRIDES.md` § 3, `@layer` à ajouter dans un chantier moteur séparé).
* **Univers sectoriels (13e famille, 6 mises en page)** : essai automobile, projet d'architecture, guide immobilier, lookbook mode, critique d'exposition, publication de recherche. Elles remplacent 6 mises en page voisines d'autres familles (captures d'écran commentées, images alternées, lieux et plan d'accès, infographie et sources, blog d'agence, article de conseil) ; leurs anciens liens d'aperçu mènent à la mise en page voisine (`aliases`). Gastronomie et finance sont déjà couverts par `blog-cuisinier`, `gastronomie-adresse` et `article-financier`.
* **Le canevas de l'éditeur** montre le document enregistré (identité du modèle) ; seul l'affichage public, l'aperçu complet de la liste et la miniature de la carte appliquent le mode « suit le site » / « hybride ».
* Pas de relecture humaine des 300 rendus ; contrôle automatique uniquement.

## 6. Tests
Voir `tests/theme-builder-article-identite.test.js` (catalogue : 33 identités, contraste WCAG, aucun jeton, polices de la bibliothèque, réglages conservés par le moteur ; serveur réel : site bleu marine → modèle beige → charte du site changée → règles du modèle identiques → autre site intact) et la mise à jour de `tests/theme-builder-article-individuel.test.js`. Résultats réellement obtenus le 8 novembre 2026 (machine chargée, `TEST_START_TIMEOUT_MS=900000`) :

| Contrôle | Résultat |
|---|---|
| `tests/theme-builder-article-identite.test.js` (nouveau) | 5 / 5 réussis (dont le scénario bleu marine → rouge, serveur réel) |
| `node scripts/audit-article-individuel.js --all` | 100 / 100, 0 défaut |
| `tests/theme-builder-article-individuel.test.js` (100 modèles utilisés, publiés, bon article, isolation) | 9 / 9 |
| `tests/theme-builder-article-individuel-navigateur.test.js` (Chrome, 100 modèles × 1440 / 820 / 390 px) | réussi (Playwright installé hors projet pour l'occasion : le test se saute seul sans lui) |
| `single-post-moteur`, `single-post-serveur`, `theme-builder-catalogue`, `theme-builder-apercu-vignette` | 19 / 19, 9 / 9, 21 / 21, 5 / 5 |
Non exécuté : les autres suites du dépôt (hors Article individuel et Theme Builder ci-dessus), 1920 et 1280 px, relecture humaine des rendus.

## 7. Références étudiées (recherche du 8 novembre, partielle)
Lues : guide Elementor « Single Post templates » et liste des widgets Single ; fiche ThemeForest « Zogue » (kit Elementor Pro). Vues par extraits : kits Envato « Mora » et « Milan » (deux variantes d'article), thème Stream (barre de progression), docs aThemes, Rometheme, The Plus Addons. **Non consultés** : démos Newspaper, Jannah, Soledad, Gillion ; Creative Market ; TemplateMonster. Enseignements : enchaînement image → titre → auteur/date → sommaire → texte → partage → newsletter → auteur → précédent/suivant → liés → commentaires ; colonne étroite sans sidebar en hausse ; barre de progression, sommaire, partage collant courants ; détails premium (échelle typographique fluide, colonne de 60–75 caractères, légendes, citations, lettrine, mobile pensé à part, mode sombre). Les 10 détails « haut de gamme » viennent de la connaissance générale, pas des démos.

## 8. Résultats de la 2e livraison (bascule des modes + univers sectoriels, 8 novembre 2026)
| Contrôle | Résultat |
|---|---|
| `theme-builder-article-identite` (33 identités, contraste, 100 modèles sans jeton, famille « secteurs », anciens liens, scénario bleu marine → rouge) | 7 / 7 |
| `theme-builder-article-modes` (nouveau : transformation sur les 100 modèles, trois modes de bout en bout, retour identique à l'octet, refus, copie, isolation) | 7 / 7 |
| `audit-article-individuel --all` | 100 / 100, 0 défaut |
| `theme-builder-article-individuel` | 9 / 9 |
| `theme-builder-article-individuel-navigateur` (Chrome, 100 modèles × 1440 / 820 / 390 px) | réussi |
| `single-post-moteur`, `single-post-serveur`, `theme-builder-catalogue`, `theme-builder-apercu-vignette`, `theme-builder-identite`, `theme-builder-routes` | 19/19, 9/9, 21/21, 5/5, 7/7, 10/10 |
Non exécuté : les autres suites du dépôt, 1920 et 1280 px, relecture humaine, interface « Identité graphique… » dans un navigateur (le menu et la boîte de dialogue ne sont contrôlés que par la syntaxe du script et par la route serveur).
