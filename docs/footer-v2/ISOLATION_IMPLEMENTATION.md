# Isolation graphique des pieds de page : ce qui a été réellement construit (phase 2)

Date : 9 novembre 2026. Branche `footer-v2-etude`. Spécification suivie : `ARCHITECTURE_ISOLATION_PROPOSEE.md` (frontière de pied : balise racine hors de `<main>`, variables locales, exclusion du CSS « du site »).
Légende : **[exécuté]** = mesuré dans un vrai Chrome sur le vrai serveur de test ; **[lu]** = lu dans le code, non exécuté.

## 1. En deux phrases

Un pied de page peut maintenant être dans **trois états**. Dans l'état **indépendant** (`solo`), plus aucun réglage du site (couleurs, polices, échelle de texte, réglages « Global », boutons et champs, thème, CSS personnalisé) ne peut modifier le pied : le scénario en 10 étapes de l'utilisateur, rejoué automatiquement sur 15 modèles (un par famille), donne **0 propriété modifiée sur 300 comparaisons**, et sur les **100 modèles** (version réduite) **0 sur 500** [exécuté]. Tous les pieds déjà installés restent dans l'état **ancien comportement** (`legacy`) et leur apparence n'a pas bougé : **0 écart sur 360 comparaisons** de styles calculés avant/après mon changement [exécuté].

## 2. Les trois états d'un pied

| État | Attribut | Ce qui se passe | Pour qui |
|---|---|---|---|
| `legacy` | `data-kw-ft="legacy"` (repère seulement, aucune règle CSS ne le lit) | Strictement le comportement d'avant : le pied est dans `<main>`, habillé par le thème du site. | **Les 100 modèles actuels, toutes les copies déjà installées, les copies futures des anciens modèles.** Défaut. |
| `solo` | `data-kw-ft="solo"` | `<footer>` posé **après `</main>`**, racine isolée (`all: initial`), variables du site **redéfinies sur sa racine**, aucune règle du site ne le vise. | Défaut des pieds de la **future** bibliothèque (un modèle se déclare avec `ftMode: "solo"`, voir §5) ; au choix pour les autres. |
| `site` | `data-kw-ft="site"` | Posé après `</main>` comme `solo`, mais **sans exclusion ni coupure** : il suit la charte du site. Les jetons `--ft-*` sont branchés sur la charte. | Pour qui veut un pied qui suit le site. |

Libellés affichés à l'utilisateur (Theme Builder, menu de la carte du pied › « Apparence du pied… ») :
« **Indépendante du site** » · « **Suit la charte du site** » · « **Ancien comportement** », chacun avec une phrase d'explication.

## 3. Où est stocké le réglage (et pourquoi)

**Choix : dans le DOCUMENT du pied** (la section racine du composant, champ `ftMode`, plus `ftVars`), **pas** dans une colonne `ft_mode` d'une nouvelle migration 143.
Raisons :
* **Aucune migration, donc aucun risque pour les bases existantes** (jamais de modification de schéma, rien à sauvegarder en plus). Le numéro 143 n'a donc pas été utilisé.
* Le réglage **voyage avec le pied** : copie (« Dupliquer »), export/import JSON, révisions (50 par pied), versions du Theme Builder, restauration. Avec une colonne sur l'instance, il aurait fallu corriger chacun de ces chemins un par un. J'ai vérifié par test que la copie, l'export et l'import le conservent [exécuté].
* « Legacy » = **absence de champ** : un pied existant n'a rien à migrer, par construction.
* Prévisualiser avant/après est gratuit : le réglage est écrit dans la **copie de travail** ; l'aperçu de la copie de travail montre « après », le site publié montre « avant ».
Inconvénient assumé : le réglage est publié avec le pied (il faut « publier » pour l'appliquer au site), ce qui est le comportement attendu.

`ftVars` : quand on rend un pied indépendant, **la charte actuelle du site est figée dans le pied** (jetons `--kw-*` : couleurs, polices, tailles, rayons, ombres + largeur des conteneurs). Ainsi **l'aspect ne change pas au moment de la bascule**, et ne bougera plus ensuite. Un pied né indépendant (sans `ftVars`) utilise les valeurs par défaut de la plateforme, plus ses propres jetons `--ft-*` s'il en déclare.

## 4. Les points d'émission du CSS « du site » traités (exclusion à spécificité 0)

Suffixe ajouté au sujet de chaque sélecteur : `:not(:where([data-kw-ft="solo"] *)):not(:where([data-kw-ft="solo"]))` (deux `:not(:where())` à la suite, sans virgule). Spécificité ajoutée : **0** (aucune cascade existante ne bouge, `!important` compris). `:root`, `html`, `@font-face`, `@keyframes`, `@view-transition` sont laissés intacts. Fonction : `excludeFooter(css)` dans `src/marketing/pages/footerFrontier.js`.

| Point d'émission | Fichier | Traitement |
|---|---|---|
| Thème du site (typographie, boutons, champs, images, réglages « Global », mise en page, classes globales) → `assets.theme` | `src/marketing/pages/siteSettings.js` (`siteAssets`) | `excludeFooter` à l'émission (source unique : pages, aperçus, boutique, démo) |
| CSS personnalisé du site → `assets.custom` | idem | `excludeFooter` |
| Feuille de chacun des 130 thèmes (paquets) | `src/marketing/themes/packs/index.js` (`load`) + `src/marketing/web/themePackPublic.js` | `excludeFooter` appliqué après `scopeCss` ; la feuille **servie** (`served`) est la feuille exclue, la feuille d'origine (`css`) reste celle que les tests d'audit des thèmes contrôlent |
| Apparence du site principal (`Apparence → Styles`) | `src/services/appearance.js` (`buildCss`) | `excludeFooter` sur ses règles |
| Modèles rendus hors Page Builder (blog, 404, boutique) : thème, bande, CSS perso | `src/marketing/web/themeRender.js` (`wrapHtml`) | `excludeFooter` ; pas de jetons du site sur l'enveloppe d'un pied solo ; plus de colonne `.lp-main` autour |
| CSS personnalisé de la page | `src/marketing/landing/index.js` (`viewModel`) | `excludeFooter` |
| Page d'erreur d'un site (feuille en ligne) | `views/site-public-error.ejs` | suffixe écrit à la main sur `h1` et `p` |
| `landing.css` (base partagée des widgets) | `public/css/landing.css` | **non filtré** (technique du prototype) : il lit les variables locales de la racine du pied. Le bloc « Frontière de pied » y ajoute : `all: initial`, mise en colonne identique à l'ancien pied (`display:flex; gap:16px`), `overflow-wrap: anywhere` (hérité autrefois de `.lp-main`), les `--lp-*`, le mouvement réduit |
| CSS des nœuds du pied (`.kw-n-<id>`) | `nodes.js` / `pageCss` | non filtré : il appartient au pied et reste valable |
| Transition entre pages (`@view-transition`) | `siteSettings.js`, `landing.ejs` | **non filtrée** : elle ne vise aucun élément |
| Feuilles statiques de la plateforme (`style.css`, `boutique.css`…) sur blog / boutique / 404 | — | **non filtrées** (voir §10, limites) |

**Test de couverture** (`tests/footer-isolation-couverture.test.js`) : (1) le thème du site, le CSS personnalisé et **les 130 thèmes** n'ont aucune règle sans exclusion ; (2) tout fichier source qui produit du CSS « de thème / personnalisé » doit figurer dans une liste connue, sinon le test **échoue** en disant d'appliquer `excludeFooter` ; (3) toute variable `--kw-*` / `--lp-*` lue par `landing.css` / `motion-studio.css` / `widgets.css` est soit remplacée sur la racine du pied (liste explicite `siteVars()`), soit posée par l'élément lui-même, soit connue comme ayant un repli. Ce dernier test a **trouvé en cours de route une variable oubliée** (`--kw-band-w`, la largeur des conteneurs du site, qui aurait traversé la frontière par héritage) : corrigée.

## 5. Le rendu

* `views/marketing-public/landing.ejs` : les pieds `solo` et `site` sont rendus **après `</main>`** (second appel de `_sections` avec `part: "footer"`, compteur de liens partagé pour garder l'ordre des liens comptés). Les pieds `legacy` restent à leur place historique (dans `<main>`).
* `views/marketing-public/_sections.ejs` : la balise `<footer>` porte `data-kw-ft` ; en `solo` elle porte aussi ses variables (attribut `style`) et ne garde que `kw-ft`, son éventuelle classe de style (`kw-n-…`) et les classes « masquer sur … ».
* **La ligne légale du site** (« Nom du site · Cookies ») était **déjà** rendue dans la balise `<footer>` ; elle y reste. En `solo` elle prend la police et la couleur du pied (variables locales) ; en `legacy` et `site` comme avant.
* Pages hors Page Builder (blog, boutique, page introuvable, domaine d'un site) : le pied était déjà après le `</main>` de la page ; en `solo` il n'est plus entouré de la colonne `.lp-main` ni des jetons du site.
* **Mouvement réduit** : `@media (prefers-reduced-motion: reduce)` dans la frontière : 0 élément animé sous « mouvement réduit » pour un pied solo (3 pour un pied legacy, mesuré) [exécuté].
* **Marge haute** : un pied solo n'a plus de marge haute implicite, et la colonne de contenu n'a plus de remplissage bas au-dessus de lui (`.lp-main:has(+ [data-kw-ft])`). Réglable par le style du nœud racine du pied.
* Points de rupture responsive : ceux du site (inchangés).

## 6. L'aperçu de la bibliothèque et l'éditeur

* **Aperçu et vignette** (`themeRender.previewDoc`) : le pied est montré **en mode indépendant et sans aucun CSS de site** (ni jetons, ni thème, ni polices, ni CSS personnalisé) : c'est le vrai design du modèle. **0 changement** sous 7 changements du site [exécuté]. Case « voir avec mon thème » : paramètre `?theme=1` de l'aperçu (désactivé par défaut) : le site habille l'aperçu (jetons, thème, feuille du paquet actif) avec le mode propre du modèle. L'interface n'a pas encore de case à cocher : seul le paramètre d'adresse existe.
* **Éditeur** du composant pied : servi par la même vue (`landing.ejs`, `builder`) ; la racine reçoit les mêmes attributs et variables. Le serveur **reprend le réglage du document** même si l'éditeur ne le renvoie pas (`keepFooterAppearance`), sinon l'éditeur l'aurait effacé à l'enregistrement. Fidélité mesurée : mêmes styles calculés (par identifiant d'élément) dans le canevas et sur le site publié [exécuté].

## 7. L'API et le contrôle

* `GET  …/constructeur-de-theme/api/modeles/:id/apparence-pied` : état (`mode` de la copie de travail, `publishedMode`, options avec libellés) · `POST` même adresse `{ mode }` : écrit dans la **copie de travail** (révision « brouillon » tracée), fige la charte du site en passant à `solo`. Droits : `forms.read` / `forms.write`. Refuse un modèle qui n'est pas un pied (422). Fichier : `src/marketing/web/footerAppearance.js`.
* Contrôle : menu de la carte d'un pied dans le Theme Builder › « **Apparence du pied…** » (`public/js/theme-builder.js`) : trois choix, enregistrement dans la copie de travail, lien « Voir l'aperçu de la copie de travail (après) ». Le site en ligne montre « avant » jusqu'à la publication. **Limite** : le contrôle est dans le Theme Builder, pas dans la barre d'outils du Page Builder.
* Nouvelle bibliothèque : une entrée du catalogue qui déclare `ftMode: "solo"` s'insère en `solo` (crochets `catalog/footer.js` et `catalog/index.js`) ; aucune des 100 entrées actuelles ne le déclare (testé).
* « Revenir au modèle d'origine » remet le pied tel que dans la bibliothèque (donc `legacy` pour les modèles actuels).

## 8. Résultats chiffrés

(Tous **[exécuté]**, Chrome 150, profil neuf, vrai serveur de test.)

| Mesure | Résultat |
|---|---|
| Scénario en 10 étapes, pieds `solo` : 15 modèles (un par famille) × 9 changements du site (couleurs, polices, échelle de texte, « Global », boutons/champs/rayons, thèmes `maille` `noir` `sape` `volt`) × 390 et 1280 px + étape 10 (retour, republication) | **300 comparaisons, 0 propriété visible modifiée**, 0 écart de largeur, 0 défilement horizontal |
| Même relevé sur des pieds `legacy` (témoin : le test voit-il les déformations ?) | 30 comparaisons, **907 propriétés modifiées** par le site (comportement historique conservé, et test sensible) |
| Pieds `legacy`, avant (code de `main`) / après mon changement : 6 modèles × 10 états × 2 largeurs × (pied, en-tête, contenu) | **360 comparaisons, 0 écart** de styles calculés, structure identique |
| Structure `solo` : un seul `<footer>`, enfant direct du `<body>`, après `</main>`, aucun `<header>` ajouté, tous les éléments du pied et la ligne légale DANS le pied | OK, 3 modèles × 5 états × 2 largeurs |
| Fuite vers l'en-tête / le contenu (avec pied / sans pied, mêmes états) | **0 propriété** |
| Aperçu de la bibliothèque sous 7 changements du site | **0 changement** |
| Blog et page introuvable (site principal) : pied publié comparé à l'aperçu (34 éléments appariés) | **0 écart** |
| Éditeur (canevas) comparé au site publié | **0 écart** (éléments appariés) |
| Pied `site` | suit la charte (plus de 20 propriétés changent sous polices/échelle/thèmes) |
| Multisite (même modèle, un site en `solo`, l'autre en `legacy`, thèmes différents) | le solo reste à 0, le legacy suit son thème |
| 5 largeurs (320, 390, 820, 1280, 1920) | pied = largeur de la fenêtre, 0 défilement horizontal |
| Les 3 états sur la page publiée | 200, un seul `<footer>` |

| **Les 100 modèles** en `solo` : 4 changements du site (polices, boutons/champs, thèmes `noir` et `volt`) + republication, à 1280 px (`FOOTER_ISO_ALL=1`) | **500 comparaisons, 0 propriété modifiée** (la première passe en avait relevé 2 : un bouton redevenait bleu par défaut à la republication ; cause : redemander « indépendant » sur un pied déjà indépendant effaçait la charte figée ; corrigé et testé) |
| Bascule `legacy → solo` d'un pied ancien (identité marine), 15 modèles × 2 largeurs | 30 comparaisons : **seule différence = la marge haute du pied (32 px → 0)**, voulue ; 0 autre propriété, 0 écart de largeur, 0 effet sur l'en-tête et le contenu |
| Test existant « aperçu = publié » (20 modèles × 3 largeurs, aperçu désormais en `solo` sans thème, publié en `legacy` sur un site par défaut) | 60/60 identiques (mise en colonne et `overflow-wrap` du pied ancien reproduits dans la racine solo : ce test a servi à les trouver) |

## 9. Non-régression [exécuté, état final du code]

Chaque fichier est lancé seul (`TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 <fichier>`), relancé une fois en cas d'échec.
* **Nouveaux** : `footer-isolation-couverture` 15/15 · `footer-isolation-surfaces` 7/7 · `footer-isolation` 5/5 (15 modèles ; le passage sur 100 modèles se lance avec `FOOTER_ISO_ALL=1`).
* **Pied** (`tests/footer-*.test.js`, 21 fichiers) : tous verts, sauf `footer-panneau-navigateur` (0 test exécuté : Playwright absent sur cette machine) et `footer-comportements-reels` (**échec intermittent préexistant** : « isolation : un autre site n'hérite d'aucun pied du site boutique » ; sur le code de `main` non modifié il échoue aussi, 2 essais sur 3 ; ici il passe 19/19 quand il est relancé seul).
* **Theme Builder non navigateur** (≈ 50 fichiers), `themes-packs` 17/17, `themes-boutique` 91/91, `site-web-entete`, `isolation-conteneur`, `isolation-proprietes`, `apparence-themes`, `commerce-par-site`, `editeur-widgets`, `tunnels`, `marketing-forms-public`, `panneau-style-disposition`, `marketing-public` (page publiée en 200), `menus-site-public`, `theme-builder-pieds-*`, `theme-builder-site-principal` : verts, **sauf deux échecs identiques sur `main`** : `theme-builder-apercu-vignette` (4/5) et `theme-builder-entetes-atelier` (19/20, « script autre que landing.js » dans les aperçus d'en-tête ; vérifié sur une copie de `main`).
* **Non exécutés** (Playwright absent) : `theme-builder-elementor-ui`, `-kolakisa-ui`, `-modeles-editeur`, `-proprietes-rendu`, `site-web-entete-navigateur`, `header-visiteur-public`, `footer-panneau-navigateur`.
* **Pieds `legacy`, avant/après** : relevé des styles calculés (pied, en-tête, contenu) de 6 modèles × 10 états × 2 largeurs sur une copie de `main` puis sur le code final : **360 comparaisons, 0 écart**. Ce relevé est un script jetable (hors dépôt) ; dans le dépôt, le test témoin vérifie que le comportement historique est conservé (le pied legacy reste dans `<main>`, reste modifié par le site : 907 propriétés).

## 10. Limites et choses non vérifiées

* **Les pieds `legacy` ne sont PAS sortis de `<main>`** (écart avec la décision 2). Raison : les sortir changerait la cascade de 85 thèmes (règles `.lp-main > …`) et donc l'apparence de pieds existants, ce que la décision 1 interdit. Conséquence : les pieds legacy gardent le défaut d'accessibilité d'origine (repère `contentinfo` dans `<main>`). Basculer le pied en `solo` ou `site` le corrige.
* **Feuilles statiques de la plateforme** (`style.css`, `boutique.css`, …) sur blog / boutique / 404 : non filtrées. Mesuré : 0 écart sur les éléments à classe `kw-n-…` du pied (34 appariés, blog et 404) ; les éléments sans classe propre (balises nues) n'ont pas été comparés à ce niveau ; la boutique n'est vérifiée que par la structure HTML (un seul pied solo, après `</main>`), pas par les styles calculés (Chrome du test ne peut pas fixer l'en-tête d'hôte).
* **Largeur des conteneurs du site** : à la bascule, la valeur du site est figée dans le pied (`--kw-band-w`) ; la règle de mise en page `max-width` des `.kw-container` du site ne l'atteint plus (par conception).
* **Mode sombre automatique** du site, réglages **par appareil** (tablette/mobile) : ils posent des variables sur le corps de page ; la racine du pied les redéfinit en ligne, donc ils n'agissent pas sur un pied solo (par conception). Non testés en navigateur.
* **Avant/après** : « avant » = le site publié, « après » = l'aperçu de la copie de travail, dans deux onglets ; pas de comparaison côte à côte intégrée.
* **Contrôle d'apparence** : dans le menu du Theme Builder, pas dans l'éditeur visuel. La sélection d'un nœud dans l'éditeur avec une vraie souris sur un pied solo n'a pas été rejouée (le rendu du canevas a été comparé, pas les clics).
* **Navigateurs** : Chrome seulement (Firefox, Safari non testés). Le suffixe `:not(:where(…))` est standard depuis 2021 [mémoire, non vérifié version par version].
* **Un CSS tiers ajouté à la main** hors des points listés (§4) n'est pas protégé ; le test de couverture ne détecte que les fichiers du dépôt qui produisent du CSS de thème.
* **Pas de champ « CSS du pied »** ni de points de rupture propres au pied (décision 7 : ceux du site).
* **Polices** : les polices de la bibliothèque utilisées par les variables figées sont livrées avec la page ; le poids n'a pas été mesuré.
* Performance du suffixe sur les 130 feuilles de thème : non mesurée (chargement des 130 thèmes ≈ 0,9 s au premier appel, mesuré dans le test de couverture).

## 11. Fichiers touchés

Nouveaux : `src/marketing/pages/footerFrontier.js` · `src/marketing/web/footerAppearance.js` · `tests/helpers-footer-isolation.js` · `tests/footer-isolation.test.js` · `tests/footer-isolation-surfaces.test.js` · `tests/footer-isolation-couverture.test.js` · ce document.
Modifiés : `src/marketing/pages/sections.js` (grammaire : `ftMode`, `ftVars`) · `src/marketing/pages/index.js` (`keepFooterAppearance`, `setFooterAppearance`) · `src/marketing/landing/index.js` · `src/marketing/pages/siteSettings.js` · `src/marketing/themes/packs/index.js` · `src/services/appearance.js` · `src/marketing/web/themeRender.js` · `src/marketing/web/themeBuilder.js` (paramètre `theme`) · `src/marketing/web/landing.js` (éditeur) · `src/marketing/web/index.js` (montage) · `src/marketing/web/themePackPublic.js` (feuille servie) · `src/themeBuilder/catalog/index.js` et `catalog/footer.js` (déclaration `ftMode`) · `views/marketing-public/_sections.ejs`, `landing.ejs`, `views/site-public-error.ejs` · `public/css/landing.css` (bloc « Frontière de pied ») · `public/js/theme-builder.js` (menu « Apparence du pied… »).
Aucune migration, aucune suppression, aucun fichier retiré.
