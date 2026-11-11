# Audit de l'indépendance graphique du Footer actuel (phase 1, aucun code modifié)

Date : 9 novembre 2026. Dépôt : `/private/tmp/claude-501/inter-wt`, branche `footer-v2-etude` (= `main` à jour, PR #42). Aucun fichier de `src/`, `views/`, `public/`, `tests/` ni migration modifié ; seuls les trois fichiers `docs/footer-v2/AUDIT_*.md` ont été écrits. Scripts, données brutes et captures : `/private/tmp/claude-501/-Users-imac-Downloads-Ptojry-google-stich-design/234805b0-e56d-4b6e-a957-09d5db8adc8d/scratchpad/audit-v2/`.
Légende : **[exécuté]** = mesuré par script sur un vrai serveur de test (base jetable) et un vrai Chrome (profil neuf) ; **[lu]** = lu dans le code, non exécuté.

## 0. Verdict en une page

**Exigence n°1 (indépendance graphique absolue) : NON atteinte. Elle est atteinte à moitié pour les couleurs, pas pour le reste.**

| Question | Résultat [exécuté, 100 modèles × 390 et 1280 px] |
|---|---|
| Les couleurs écrites dans les modèles sont-elles les leurs ? | **Oui** : 6 902 couleurs en dur, 2 764 polices en dur (`font.<famille>`), **0** référence `token:` ni `var(--kw-…)` sur 4 471 éléments (`static-models.json`). |
| Si l'on change les couleurs du site (rouge/vert/noir/blanc), le pied change-t-il ? | **98 modèles sur 100 : non, rien.** 2 modèles : le bouton « Rechercher » du widget de recherche prend la couleur principale du site (bleu marine → rouge). |
| Si l'on change les polices du site ? | **100 modèles sur 100 : oui** (le lien et le texte de la ligne légale ajoutée par la plateforme prennent la police des liens/du texte du site ; Figtree → Georgia / monospace). |
| Si l'on change les réglages de texte du site (tailles, graisses, interlignes) ? | **100/100 : oui** (graisse et interligne des liens, du copyright, de la ligne légale ; taille de 83 modèles : boutons, titres de widgets, champs). |
| Si l'on change les réglages « Global » du Personnaliser ? | **100/100 : oui** (polices, graisse, interligne ; 11 modèles : couleur de fond, de bordure ou de texte d'un widget). |
| Si l'on change les boutons / champs du site ? | **60/100 : oui** (espacement intérieur des boutons de 38+45 modèles, bordure/rayon/fond des champs de 9 modèles). |
| Si l'on active un autre thème de site (4 essayés : maille, noir, sape, volt) ? | **100/100 : le pied est modifié par chacun des 4 thèmes** ; avec `sape` et `volt` il **n'est plus pleine largeur sur ordinateur** (780-820 px sur 1280) ; textes illisibles (< 3:1) dans 78 modèles avec `noir`, 72 avec `volt` ; les **couleurs** changent dans 100/100 (noir), 100/100 (volt), 70/100 (sape), 61/100 (maille) : liens, textes, boutons, icônes, fond des champs. |
| Le pied pollue-t-il l'en-tête, le contenu ou le site ? | **Non** (0 modification mesurée de l'en-tête et du contenu, sur 100 modèles). |
| L'identité survit-elle au rechargement / à la republication ? | **Oui** : 0 écart de style après rechargement et après republication, contenu stocké identique, 100/100. |
| L'aperçu de la bibliothèque montre-t-il le VRAI design ? | **Presque** : fidèle aux couleurs du modèle (un pied noir est noir) ; mais il **suit les polices du site** et **ignore le thème actif**, donc il ne montre pas ce qui sera publié si un thème est actif. |

**Verdicts par modèle** (définitions au §5) :

| Périmètre testé | INDÉPENDANT | PARTIELLEMENT DÉPENDANT | DÉPENDANT |
|---|---|---|---|
| Charte du site : couleurs, polices, « Global », boutons et champs (états C, F, G, R) | **0** | **83** | **17** |
| + réglages de texte du site (état T) | 0 | 25 | 75 |
| + thème de site actif (4 thèmes) | 0 | 0 | **100** |

**Cause racine (une phrase)** : les modèles posent leurs couleurs en dur sur chaque élément mais **le pied n'a aucune portée CSS propre** : il vit dans la page, sous `body.lp-site`, avec des règles globales qui s'appliquent à tout ce que le modèle n'a pas explicitement réglé (police des liens, graisse, interligne, tailles, boutons, champs) et sous le CSS du thème actif (`body[data-kw-pack=…] a`, `p`, `.lp-main > …`) dont la spécificité l'emporte sur les styles du modèle.

## 1. Cartographie des canaux d'héritage (fichier:ligne)

Rang = importance mesurée (nombre de modèles touchés, ampleur).

### 1.1 Les 5 canaux les plus importants

| Rang | Canal | Fichier:ligne | Effet mesuré |
|---|---|---|---|
| 1 | **CSS du thème de site actif** (paquets) : toute règle du thème est préfixée par `body[data-kw-pack="<clé>"]` au chargement et s'applique donc au pied (il est dans `.lp-main`). 129 des 130 paquets de thèmes ont une règle `body[data-kw-pack] a{…}`, 85 des règles `.lp-main > …`, 14 des `h1-h6`, 10 des `p{…}`, 15 mentionnent `footer` | `src/marketing/themes/packs/index.js:54-90` (`scopeCss`), `packs/base.css:1-14`, `packs/<clé>/style.css` ; exemples mesurés : `volt/style.css` `body[data-kw-pack="volt"] .lp-main > :not(.pk-bleed):not(:has(.pk-bleed)) a { color: var(--vl-deep) }`, `noir/style.css` `body[data-kw-pack="noir"] p { margin-bottom }` et `… .lp-main > :not(:has(.pk-bleed)) :is(p, label, legend…) { color }`, `sape/style.css` et `volt/style.css` `… .lp-main > .lp-block-layout:not(:has(.pk-bleed)) { padding }` | 100/100 modèles modifiés par chacun des 4 thèmes ; couleur des liens, boutons, icônes et textes ; **+40 à +64 px de marge intérieure haute et basse sur le bloc du pied** ; interligne ; casse ; espacement des lettres |
| 2 | **Typographie du corps héritée** : tout texte du pied qui ne porte pas sa propre graisse / interligne / taille reprend celle du site | `public/css/landing.css:25` (`.lp-body` 17 px / 1,6), `:491` (`.lp-site { font-family: var(--kw-font-body); font-size: var(--kw-body-size); font-weight: var(--kw-body-weight); line-height: var(--kw-body-lh) }`) ; `src/marketing/pages/tokens.js` (`DEFAULT_TOKENS.type`) ; `globalStyles.js:300-345` | Graisse/interligne : 100/100 (liens 97 modèles, copyright 100, texte 85) ; la plupart des nœuds des modèles ne fixent **ni graisse ni interligne** (copyright 0/100 pour la graisse et l'interligne, liens 28/1014 pour l'interligne, boutons 6/94 pour la taille) : `static-props.json` |
| 3 | **Ligne légale injectée dans chaque pied par la plateforme** (nom du site, Cookies, confidentialité) : contenu et style hors du modèle | `views/marketing-public/_sections.ejs:93-95`, `_foot-legal.ejs`, `landing.css:66-73` (`.lp-foot`), `:1785-1786` (`[data-kw-footer] .lp-foot`), `:499` (`:where(.lp-site) :where(a) { font-family: var(--kw-font-link) }`) | Cause principale de « la police du site change le pied » dans les 100 modèles (élément `a` « nom du site » et `div` de la ligne légale) |
| 4 | **Boutons et champs du site appliqués aux widgets du pied** | `src/marketing/pages/themeCss.js:47-56` (padding/bordure de `.kw-button`, couleurs du bouton principal), `:84-92` (champs `.kw-signup-form`, `.kw-search input`), `landing.css:383-396` (`.kw-button` : `border-radius 8px`, `padding 13px 26px`, `min-height 48px`, `border 2px`), `:848` (`.lp-site :where(.kw-button) { font-size/weight/radius = variables du site }`), `:501` (`.lp-site .lp-btn`) | Padding des boutons : 83 modèles (38 « plein » + 45 « contour »), taille de police des boutons ; recherche : fond du bouton 2 modèles, bordure 9 modèles ; champs : fond/bordure/rayon 9 modèles |
| 5 | **Espacement de page** autour du pied | `landing.css:143` (`.lp-site .lp-block + .lp-block { margin-top: var(--kw-space-lg) }`), `:498`, `:911` | Marge haute du pied : 32 → 60 px quand l'espacement du site change (100/100) ; 0 en aperçu |

### 1.2 Cartographie complète, par catégorie demandée

**(i) Jetons du site** (`--kw-primary/secondary/accent/background/surface/text/muted/success/warning/error`, `--kw-on-primary/-accent`, `--kw-font-heading/body/button/link`, `--kw-h1…h6-size/weight/lh`, `--kw-body-*`, `--kw-space-*`, `--kw-radius-*`, `--kw-shadow-*`, `--kw-border`, `--kw-content`, `--kw-button-height`, `--kw-field-height`) : définis par `tokens.js:214` (`tokensToCss`) et posés **en ligne sur `<body class="lp-body lp-site">`** (page publique, relevé : `style="--kw-primary: #0b2545; …"`) et sur `<div class="kw-theme-part … lp-site" style="…">` (aperçu : `themeRender.js:37-49`). Écrasés avec `!important` par `siteSettings.js:236-255` (tailles responsives, mode sombre) et `globalStyles.js:224-258` (`emit()` ajoute `!important` à toute variable). **Les modèles n'y font pas référence** (0 `var(--kw-…)`), sauf indirectement par les règles de `landing.css` qui lisent ces variables pour tout ce que le modèle ne règle pas.
**(ii) CSS partagé** : `landing.css` (1 815 l., 106 occurrences de `var(--kw-…)`), `marketing.css`, `kola-v3.css` : le pied est servi avec `landing.css` seule (relevé des feuilles de la page : `css/landing.css` + `<style>` en ligne). Règles qui l'atteignent : `.kw-container/.kw-group/.kw-stack/.kw-node/.kw-heading` (structure), `.kw-button`, `.kw-link` (`:396` `color: var(--lp-accent)`), `.kw-menu*` (`:624-642`), `.kw-social*` (`:816-821`, fond `rgba(16,34,47,.08)`), `.lp-site :where(h1.kw-heading…)` (`:841-846`), `.lp-foot*` (`:66-73, 1424-1431`).
**(iii) CSS des thèmes** : voir rang 1. Isolation « par construction » du thème vers les AUTRES thèmes (préfixe `body[data-kw-pack]`) mais **aucune protection du pied** : ni `:not([data-kw-footer])`, ni exception.
**(iv) Classes globales / composants globaux** : `classCss`/`GLOBAL_CLASS_MAX = 40` (`nodes.js:2018, 2075`) sont **opt-in** (un nœud doit les porter) : aucun modèle de pied n'en porte [exécuté : 0 occurrence dans `catalog/footer`] ; le CSS personnalisé du site (`siteSettings.js:160-163`, `assets.custom`, injecté par `themeRender.js:49` dans aperçus et rendus) peut cibler le pied par conception [lu, non exécuté].
**(v) Polices** : `declarations()` (`nodes.js:340`) écrit `font-family` **et** `--kw-font-link/-button/-heading` sur tout nœud qui a une police ; c'est ce qui protège les liens/titres/boutons *des nœuds qui ont une police*. Ce qui n'en a pas (ligne légale, widgets sans police) reprend `:where(.lp-site) :where(a) { font-family: var(--kw-font-link) }` (`landing.css:499`) et `.lp-site { font-family: var(--kw-font-body) }`. Gestionnaire de polices : les `@font-face` des polices du modèle sont chargés **globalement** dans la page (93 modèles sur 100 ajoutent au moins une police à la page ; noms de famille propres : sans conflit).
**(vi) Kit de conception** : `kit-conception.js:47-70` : couleurs **fixes** (hex) vérifiées AA ; `moteur.js:166-178` (`ownFont`) pose la police sur chaque élément de texte ; `tone('ink')` a un repli `token:text/background` (`moteur.js:10`) **jamais utilisé** par les 100 modèles (0 `token:`). Valeurs en dur / variables : 6 902 / 0 pour les couleurs, 2 764 / 0 pour les polices.
**(vii) Aperçu bibliothèque** (`themeRender.js:205-229`, `wrapHtml` :37-52) : injecte les jetons du site visé en ligne (`style="--kw-primary…"`), `landing.css`, le CSS du site (`siteOk.assets.theme`, `assets.custom`) et `.kw-theme-part { color: var(--kw-text) }` ; **ne charge pas le CSS du thème actif** ; priorité donnée à `appearance.publishedTokens()` (apparence du site principal) sur les jetons du site visé (`main || siteOk.tokens`, `:42-49`) [lu, non exécuté].
**(viii) Rendu publié** : `_sections.ejs:17-21` (balise `<footer data-kw-footer="1" role="contentinfo">` + classes `lp-block lp-block-layout lp-part-bleed lp-site-part lp-site-footer`), `landing.ejs:30` (`<body class="lp-body lp-site" …data-kw-pack…>`), feuille du thème liée dans le `<head>` si un thème est actif.
**(ix) Éditeur (Page Builder du composant)** : même `landing.css`, `<body class="lp-body lp-site lp-builder pb-dm-on">` ; **les thèmes ne sont pas chargés** (0 changement avec « noir » sur 13 modèles) et les jetons du site n'y changent rien (13 modèles × 3 états : 12 sans aucun écart, 1 écart de police : modèle restauration-01). Le canevas n'ajoute pas la ligne légale.
**(x) Fuites dans l'autre sens** : `[data-kw-footer] …` (`landing.css:1785-1789`) sont toutes préfixées par l'attribut du pied (n'affectent que lui) ; `landing.css:911` (`.lp-main:has(> .lp-block.lp-site-footer:last-child) { padding-bottom: 0 }`) agit sur le conteneur de la page quand le pied est le dernier bloc. **0 pollution mesurée** (§3).
**(xi) `!important`** : `landing.css` 10, `marketing.css` 9, `kola-v3.css` 4, `widgets.css` 0, `packs/base.css` 23 (appliqués à `.lp-main > .lp-block-layout`, donc au pied), `siteSettings.js` 13, `globalStyles.js` 2, `nodes.js` 3 (réduction de mouvement), fichiers du catalogue de pieds 0, **883 dans les feuilles des thèmes** (`packs/*/style.css`). Le pied lui-même n'émet aucun `!important` ; il en subit.

## 2. Le scénario en 10 étapes (exécuté)

Méthode : un serveur de test, un site « Audit indépendance », 100 modèles insérés et publiés **un par un** par l'API réelle (`/api/bibliotheque/utiliser` puis `/publier`), page publique chargée dans Chrome à **390 et 1280 px**, **tous les éléments du pied** (jusqu'à ~150) relevés en styles **calculés** (30 propriétés : couleurs, fond, police, taille, graisse, interligne, casse, bordures, rayons, marges, espacements, ombre, opacité). Un changement ne compte que s'il est **visible** (texte sur un élément qui porte du texte, bordure seulement si son épaisseur est > 0, etc.). Entre deux essais le site revient à l'identité marine.

| Étape | Action | Résultat |
|---|---|---|
| 1 | Site à identité bleu marine (`primary #0b2545, secondary #13315c, accent #ffb703, background #0a1a33, surface #12284a, text #e8eef7`) enregistré par l'API des réglages | **PASSE** (jetons relus : identiques) |
| 2 | Insérer le pied (100 modèles, 100 insertions + publications) | **PASSE** : 100/100, 0 erreur |
| 3 | Relevé des styles calculés (390 et 1280 px) | **PASSE** : 100 relevés × 2 largeurs |
| 4-5 | **Couleurs globales changées** (primaire rouge `#e11d48`, secondaire vert `#16a34a`, accent noir, fond blanc, surface jaune, texte noir) | **PASSE sauf 2 modèles** : 98/100 sans aucun écart. Écarts : `ft-education-02-plateforme-de-cours-vivante` et `ft-institutionnels-01-portail-national-six-colonnes`, widget `search`, bouton « Rechercher » : fond `rgb(11,37,69)` → `rgb(225,29,72)` |
| 5b | **Couleurs « Global » du Personnaliser** (accent, secondaire, accentuation, texte, fond, surface, liens, titres, texte discret ; bouton principal rose/vert/bleu ; couleur du texte courant magenta) | **PASSE sauf 11 modèles** : bouton de recherche (bordure 9 modèles `rgba(0,0,0,0) → rgb(0,0,255)`, fond 2 modèles `rgb(11,37,69) → rgb(255,0,255)`) ; texte du widget « bascule » (`toggle`) 2 modèles (education-05, restauration-05) : `rgb(43,58,34) → rgb(255,0,255)` |
| 6-7 | **Polices du site changées** (titres Georgia, corps/boutons monospace, liens Georgia) | **ÉCHOUE 100/100** : `a` (nom du site dans la ligne légale) `Figtree → Georgia`, `div` (ligne légale) `Figtree → monospace` ; en plus 28 modèles (accordéon mobile) : titre des volets `Figtree → monospace` ; 2 modèles : champ + libellé de recherche |
| 6b | **Typographie du site** (corps 22 px graisse 700 interligne 1,9 ; titres 300…) | **ÉCHOUE 100/100** : liens `line-height 20,8 → 24,7 px` (97 modèles), `font-weight 400 → 700` (copyright et ligne légale 100/100, texte 85), `font-size` boutons `16 → 22 px` (83 modèles), titre de widget `17 → 22 px` (36 modèles) |
| 6c | **Réglages « Global » du Personnaliser** (polices, tailles, graisse, liens soulignés, titre h3 40 px, bouton principal) | **ÉCHOUE 100/100** (mêmes causes + 11 modèles de couleur, voir 5b) |
| 6d | **Boutons / champs / rayons / bordures / ombres / espacements du site** | **ÉCHOUE 60/100** : `padding` des boutons `13/26 px → 30/50 px` (83 modèles), champs : bordure `1 → 4 px`, rayon `8 → 30 px`, fond blanc → jaune (9 modèles) ; marge haute du pied `32 → 60 px` (100) |
| 8-9 | **Thème de site changé** (`maille`, `noir`, `sape`, `volt`, installés puis activés par les routes réelles) | **ÉCHOUE 100/100 pour chacun des 4** (voir §4) |
| 10 | Rechargement, **republication** du même modèle, nouveau relevé ; contenu stocké comparé | **PASSE 100/100** : 0 écart après rechargement, 0 après republication (statut 200), contenu du composant en base identique avant/après tous les changements de jetons |

Aucun modèle ne présente de défilement horizontal ni de débordement dans ces essais (voir §6).

## 3. Contamination inverse : le pied modifie-t-il le reste ? (exécuté, 100 modèles × 2 largeurs)

Méthode : en-tête publié (modèle `luxe-01.luxe-01`) + page de contenu ; relevé complet des styles de l'en-tête, du contenu, du `<body>`/`<html>` et de la liste des sélecteurs CSS de la page **avant** puis **après** insertion de chacun des 100 pieds.

| Mesure | Résultat |
|---|---|
| Éléments de l'en-tête dont un style change | **0** sur 100 modèles |
| Éléments du contenu dont un style change | **0** sur 100 modèles |
| Géométrie de l'en-tête / du contenu qui bouge (hors le pied lui-même) | 0 / 0 |
| `style`, `class` de `<body>` et `<html>` modifiés | 0 modèle |
| Nombre de feuilles de style | inchangé (3) ; largeur de défilement inchangée |
| Règles CSS ajoutées à la page par le pied | **toutes en `.kw-n-<id>`** (≈ 50 par modèle) ; **seul écart** : 1 modèle ajoute les classes utilitaires `.lp-hide-desktop/-wide/-tablet/-mobile` (visibilité par écran, déjà présentes dans les autres pages) |
| Polices chargées globalement | 93 modèles ajoutent un `@font-face` global (ex. `Mulish/200-1000`) ; sans effet sur le reste (noms propres) |

Conclusion : **le pied ne contamine pas l'en-tête ni le contenu**, [lu] car ses règles sont toutes en `.kw-n-<id>`. Réserve : une règle de la page (`landing.css:911`) retire le bas de marge du conteneur de page quand le pied est le dernier bloc (comportement voulu).

## 4. Effet de chaque thème de site sur le pied (exécuté, 100 modèles)

| Thème essayé | Modèles modifiés | Dont couleurs modifiées | Propriétés les plus touchées (nombre de modèles) | Règles responsables (extrait) |
|---|---|---|---|---|
| `noir` | 100 | **100** | police (100), graisse (100), marge intérieure haut/bas du pied (100, 0 → 64 px), couleur du copyright/liens (100), marge basse des paragraphes (100), taille (68), espacement des lettres (45), fond (32), bordures (32) | `body[data-kw-pack="noir"] p`, `… .lp-main > :not(.pk-bleed):not(:has(.pk-bleed))` |
| `volt` | 100 | **100** | **couleur des liens, boutons, icônes (100)**, interligne (100), police (100), marge intérieure (100, 0 → 48/64 px), taille (73), casse (64), italique (63) | `body[data-kw-pack="volt"] .lp-main > :not(.pk-bleed):not(:has(.pk-bleed)) a`, `… .lp-block-layout:not(:has(.pk-bleed))` |
| `sape` | 100 | 70 | police (100), marge intérieure (100), couleur (70), interligne (65), taille (63), graisse (48), fond/bordure/rayon (32) | `body[data-kw-pack="sape"] .lp-main > .lp-block-layout:not(:has(.pk-bleed))` |
| `maille` | 100 | 61 | interligne (100), police (100), couleur (61), casse (47) | `body[data-kw-pack="maille"]` (héritage du corps) |

**Largeur** (relevé à 1280 px sur les 100 modèles, `packwidth.jsonl`) : avec **`sape`** le pied n'est plus pleine largeur dans **100/100** modèles (780 px au lieu de 1280, collé à gauche) ; avec **`volt`** dans **99/100** (820 px) ; `noir` et `maille` : pleine largeur partout. À 390 px : pleine largeur partout, aucun défilement horizontal, pour les 4 thèmes. Preuve visuelle : `shots2/amb-saas-terminal__3-theme-volt.png`.

Constat clé : **la couleur d'un lien ou d'un bouton écrite dans le modèle est écrasée par le thème** (exemple mesuré avec `volt` : lien `rgb(29,29,27)` → `rgb(14,107,59)`, icône claire `rgb(232,234,238)` → vert foncé, bouton plein blanc → vert), parce que la règle du thème a une spécificité supérieure à `.kw-n-<id>`. Voir §8 pour les conséquences de lisibilité.

## 5. Définition des verdicts par modèle

* **INDÉPENDANT** : aucune propriété visible ne change dans aucun des états testés.
* **DÉPENDANT** : au moins une **couleur** visible change, ou au moins **30 %** des éléments visibles changent (estimation par type d'élément).
* **PARTIELLEMENT DÉPENDANT** : des propriétés changent mais ni couleur ni ≥ 30 % des éléments.
* Trois lectures : **charte** (états C, F, G, R : couleurs du site, polices, « Global », boutons/champs/rayons/ombres/espacements), **+ échelle de texte** (état T), **+ thèmes** (4 thèmes).

Résultat (100 modèles) : charte → 0 / 83 / 17 ; + échelle de texte → 0 / 25 / 75 ; + thèmes → 0 / 0 / 100. Les 17 « dépendants » sur la charte seule : **11 par une couleur** (bouton de recherche : ecommerce-03, -06, editoriaux-04, education-02, communautes-02, immobilier-02, -04, institutionnels-01, -03 ; texte de bascule : education-05, restauration-05) et **6 par ≥ 30 % d'éléments** dont taille/graisse suivent le texte « Global » (minimalistes-02, -05, -08, corporate-07, saas-tech-01, services-06).

Propriétés qui font basculer un modèle (état « charte + échelle », nombre de modèles) : `fontFamily` 100, `fontWeight` 100, `fontSize` 83, `lineHeight` 83 (100 pour T), padding des boutons 60, bordure/rayon de champ 9, `color` 4, `backgroundColor` 2.

Éléments / widgets responsables (état « charte + échelle »), du plus fréquent au moins fréquent : **ligne légale du site** (`a`, `div`, `_foot-legal.ejs`) 100 ; **`kw-copyright`** (100) ; **`kw-link`** (interligne 97) ; **`kw-button` plein/contour** (padding 83, taille) ; **`kw-biz-title`** (36) ; **`p` du texte d'accroche** (85) ; **`kw-nacc-head`** (28 accordéons mobiles) ; **`search`** (`kw-btn-primary`, `input`, `label` : 9) ; `kw-toggle-title`, `kw-account-link`, `kw-dyn-empty` (1-2).

### Élément responsable → règle CSS → fichier:ligne (mesuré par l'explication de règle de `snap.js`)

| Élément / widget du pied | Propriété qui change | Règle responsable | Fichier:ligne |
|---|---|---|---|
| Ligne légale (`a` du nom du site, `div`) | police | `:where(.lp-site) :where(a) { font-family: var(--kw-font-link) }` et `.lp-site { font-family: var(--kw-font-body) }` | `landing.css:499`, `:491` |
| Ligne légale, `kw-copyright`, `p` d'accroche, `kw-link` | graisse, interligne, taille (héritées) | `.lp-site { font-weight: var(--kw-body-weight); line-height: var(--kw-body-lh); font-size: var(--kw-body-size) }` | `landing.css:491` |
| `kw-button` plein / contour | marge intérieure | `.lp-site :where(.kw-button, .lp-btn) { padding-block/inline }` | `themeCss.js:47-52` |
| `kw-button` plein / contour | taille de police (et graisse, rayon pour les boutons sans valeur propre) | `.lp-site :where(.kw-button) { font-size: var(--kw-button-size); font-weight: var(--kw-button-weight); border-radius: var(--kw-radius-button) }` | `landing.css:848`, `:501` (`.lp-btn`), `globalStyles.js:385` (variable) |
| `search` : `kw-btn-primary`, `input`, `label` | fond, bordure, rayon, police | `.lp-site :where(.kw-btn-primary, .lp-btn) { background; border-color }` ; champs `.lp-site .kw-search input` | `themeCss.js:53-56`, `:84-92` ; `globalStyles.js` (boutons) |
| `kw-biz-title` (titre de widget de données) | taille | taille du corps héritée (`.lp-site`), le titre ne porte que `margin` et `font-weight` | `landing.css:491`, `:1732` |
| `kw-nacc-head` (titre de volet, accordéon mobile) | police | `font-family` du corps (le bouton n'a pas de police) | `landing.css:491` |
| Bloc `<footer>` | marge haute | `.lp-site .lp-block + .lp-block { margin-top: var(--kw-space-lg) }` | `landing.css:143` |
| Bloc `<footer>`, liens, textes | marge intérieure haut/bas, couleur, graisse, casse, interligne | `body[data-kw-pack="<clé>"] .lp-main > :not(.pk-bleed)… a / p / :is(p,label,legend)` | `packs/<clé>/style.css` (via `packs/index.js:54-90` `scopeCss`) |

## 6. Structure et responsive (exécuté, 100 modèles × 390 / 820 / 1280 / 1920 px)

| Contrôle | Résultat (100/100 modèles à chaque largeur) |
|---|---|
| Une seule balise `<footer>` par page | **100/100** (4 largeurs) |
| Un seul repère `data-kw-footer` | **100/100** |
| `<footer>`, `<header>` ou `<main>` imbriqué dans le pied | **0** |
| `<header>` ajouté à la page par le pied | **0** |
| Pied pleine largeur (x = 0, largeur = fenêtre) | **100/100** |
| Défilement horizontal | **0** |
| Éléments qui débordent de la fenêtre | **0** |
| Hauteur du pied | 390 px : 182 à 2 340 px ; 1280 px : 113 à 1 111 px |

C'est la partie solide : exigence (f) (un seul pied, widgets dans le pied, pas de second en-tête/pied) **atteinte**, responsive propre à chaque modèle (styles tablette/mobile portés par chaque nœud : `moteur.js:band`, `nodes.js:pageCss` et ses media queries).

## 7. Aperçu de la bibliothèque, éditeur, publié (exécuté, 100 modèles ; éditeur sur 13)

| Comparaison | Résultat |
|---|---|
| Aperçu vs page publiée, mêmes jetons (marine) | **couleurs, polices, tailles, bordures identiques** ; seul écart de style : marge haute du pied `32 px` publié contre `0` en aperçu (74 modèles comparables) ; **0 élément dont la taille diffère** de plus de 1 px (l'écart de 3 px relevé hier a disparu) ; 26 modèles ont **plus d'éléments** en aperçu (16 de plus : le menu d'exemple annoncé « (menu d'exemple) ») |
| Aperçu quand on change les COULEURS du site | **inchangé** pour 98/100 ; 2 modèles : bouton de recherche rouge |
| Aperçu quand on change les POLICES du site | **change** pour 100/100 (ligne légale `a`, `div`), 20 icônes sociales, 2 champs de recherche |
| Aperçu quand on active un thème de site (noir) | **inchangé : 0/100** (l'aperçu ne charge pas le CSS du thème) alors que la page publiée change pour 100/100 : **l'aperçu ne montre pas ce que l'utilisateur obtiendra quand un thème est actif** |
| Éditeur (Page Builder du composant) vs publié | mêmes couleurs/polices/tailles pour les textes du modèle ; différence : la ligne légale n'est pas affichée dans l'éditeur (1 texte « absent » par modèle) |
| Éditeur quand on change couleurs / polices / thème du site (13 modèles × 3) | **0 écart** (1 écart de police sur 39 mesures : restauration-01, état « polices ») ; l'éditeur ne charge pas le thème |
| Un pied noir apparaît-il noir en aperçu ? | **Oui** : fond et couleurs identiques à ceux de la page publiée (les 74 modèles comparables, 0 écart de couleur) ; aucun jeton de couleur du CMS n'est injecté dans les éléments du modèle (ils sont en dur) |

Captures de contrôle (hors dépôt, `…/scratchpad/audit-v2/shots2/`) : 6 modèles (sombres, clairs, serif, couleur) dans 5 états : identité marine, couleurs radicales, thème volt, thème noir, aperçu de la bibliothèque.

## 8. Conséquence visible : un thème actif peut rendre le pied illisible (exécuté, 100 modèles)

Pour chaque texte visible du pied, contraste réel (WCAG) contre le fond réellement dessiné ; seuil volontairement bas (3:1). Départ : identité marine.

| État du site | Modèles avec au moins un texte sous 3:1 | Textes sous 3:1 / 2 463 |
|---|---|---|
| Identité marine (départ) | **0** | 0 |
| Couleurs du site radicalement changées | **0** | 0 |
| Thème `maille` | 38 | 43 |
| Thème `sape` | 38 | 43 |
| Thème `volt` | **72** | **523** |
| Thème `noir` | **78** | **653** |

Exemples (mesurés) : thème `noir` sur un pied clair (communautes-02) : texte `rgb(242,236,225)` (ivoire du thème) sur fond `rgb(245,241,232)` : contraste **1,04** (invisible) ; thème `volt` sur un pied sombre (minimalistes-05, -06) : liens `rgb(14,107,59)` (vert foncé du thème) sur `rgb(21,18,15)` : **2,8**. La capture `shots2/amb-min-craie__3-theme-noir.png` montre le copyright d'un pied clair devenu illisible.
Les couleurs du site seules ne provoquent jamais ce défaut (le modèle impose les siennes) ; c'est **le CSS du thème de site** qui écrase les couleurs du modèle.

## 9. Les exigences de l'utilisateur confrontées à l'état actuel

| Exigence | État | Preuve |
|---|---|---|
| (a) Pas de récupération automatique des couleurs globales | **Atteinte à 98 %** (2 modèles : bouton de recherche) | §2 étapes 4-5 |
| (a) … des typographies globales | **Non atteinte** (100/100) | §2 étapes 6-7 |
| (a) … des styles du thème, boutons, bordures, fonds globaux | **Non atteinte** (thèmes 100/100 ; boutons 83 ; champs 9) | §2, §4 |
| (a) … des composants visuels de l'admin | Atteinte (l'aperçu est un document séparé ; aucun style d'interface d'administration chargé) | §1.2 (vii) [lu] |
| (b) Variables CSS propres au Footer | **Absentes** : aucune variable `--ft-…` ; couleurs et polices en dur sur chaque nœud | §1.2 (vi) |
| (b) Portée CSS isolée (identifiant/classe unique) | **Absente** : `.kw-n-<id>` + `data-kw-footer` (pas utilisé comme portée par les règles qui le subissent) | §1.1 |
| (b) Styles propres à chaque modèle / widget | **Partiels** : couleurs, police, taille de texte oui ; graisse, interligne, bouton (taille, padding), champs, titres de widgets non | `static-props.json` |
| (b) Responsive propre | **Atteint** (§6) | §6 |
| (b) Pas de `!important` en cascade | Le pied n'en émet aucun ; il subit ceux de `base.css` (23) et des réglages du site | §1.2 (xi) |
| (c) Le pied ne contamine pas En-tête / contenu | **Atteint** (0 écart, 100 modèles) | §3 |
| (c) Les styles globaux ne déforment pas le pied | **Non atteint** | §2, §4, §8 |
| (d) Identité intacte à l'insertion, la publication, le rechargement | **Atteinte** (0 écart, contenu identique) | §2 étape 10 |
| (d) … à l'ouverture dans l'éditeur | **Atteinte** (13 modèles : l'éditeur reproduit les textes du modèle) | §7 |
| (d) … quand la charte du site est modifiée | **Non atteinte** (polices, texte, boutons, thèmes) | §2 |
| (d) … modification / enregistrement | **Non rejoué ici** : couvert par `footer-comportements-editeur-navigateur.test.js` (12 modèles, résultats du 8 novembre) | doc existant |
| (e) L'aperçu affiche le vrai design sans couleurs du CMS | **Couleurs : oui** ; **polices du site : non** (100/100) ; **thème actif : ignoré** (0/100 vs 100/100 en publié) | §7 |
| (f) Un seul footer / header, widgets dans le footer | **Atteint** | §6 |

## 10. Cause racine, en clair

1. **Pas de frontière.** Le pied est un morceau de la page, pas un bloc isolé. Les règles du site s'y appliquent comme à n'importe quel contenu.
2. **Un modèle ne dit pas tout.** Il fixe ses couleurs et ses polices sur chaque élément, mais pas la graisse, l'interligne, les tailles de boutons, les champs, ni la ligne légale que la plateforme ajoute : ces valeurs-là viennent du site.
3. **Le thème l'emporte.** Les règles des thèmes (`a`, `p`, `.lp-main > …`) sont plus « fortes » (spécificité) que `.kw-n-<id>`, donc elles écrasent même les couleurs écrites dans le modèle.
4. **Rustine existante** : `declarations()` copie la police du nœud dans `--kw-font-link/-button/-heading` pour protéger ses enfants ; ça protège les liens/titres des éléments qui ont une police, pas le reste.

Ce qu'un futur système devrait garantir (à vérifier par ce même script, cf. `AUDIT_RISQUES_ET_REMPLACEMENT.md` §4) : une portée unique par pied (identifiant) avec **variables propres** ; **toutes** les propriétés visibles posées par le modèle (couleur, police, graisse, interligne, tailles, rayons, espacements, champs, boutons, ligne légale incluse) ; une protection explicite contre les règles de thème (`@layer`, `all: revert-layer`/`initial` à la racine du pied ou `isolation` complète) ; et un aperçu/éditeur qui chargent **le même CSS que la page publiée** (thème actif compris) ou l'indiquent clairement.

## 11. Ce que je n'ai pas pu vérifier

* **Thème « actif » : 4 thèmes sur 130** (maille, noir, sape, volt) ; les 126 autres ne sont pas testés, mais 129 dossiers ont une règle `a{…}` confinée au thème, donc le constat est probablement général : **non mesuré**.
* **Mode sombre automatique** du site (`siteSettings.js:248-258`, `color-scheme: dark` + variables) : lu, non exécuté.
* **CSS personnalisé du site** (`assets.custom`) et **classes globales** : lus, non exécutés ; elles sont volontairement capables d'atteindre le pied.
* **Priorité des jetons de l'apparence principale dans l'aperçu** (`themeRender.js:42`) : lue, non exécutée.
* **Modification et enregistrement dans l'éditeur** : non rejoués ici (tests existants du 8 novembre).
* **Isolation multisite** : non retestée (déjà testée, `footer-rendu-unifie.test.js`) ; l'audit n'a utilisé qu'un site.
* **États de survol / focus** : non mesurés (les couleurs de survol viennent des états du nœud, `moteur.js:55-58`).
* **Hors Chrome** (Safari, Firefox) : non testé. Le serveur de test tournait sur une machine chargée par d'autres sessions ; les mesures sont des styles calculés, insensibles à la lenteur.
* Les 10 « Invalid parameters » du journal `structure.log` viennent de **mon script de capture** (aperçu : paramètre de capture invalide), pas du produit ; les mesures de structure ont bien été enregistrées pour les 100 modèles.

## 12. Verdict par modèle (les 100)

PART = partiellement dépendant ; DEP = dépendant ; IND = indépendant. « Charte » = couleurs du site, polices, « Global », boutons/champs ; « échelle » = tailles, graisses, interlignes du site ; « thèmes » = 4 thèmes de site. La dernière colonne donne les nombres de couleurs / polices écrites **en dur** dans le modèle (la dépendance ne vient donc pas de ce qu'il écrit mais de ce qu'il omet).

| Modèle (sans « ft- ») | Charte (couleurs, polices, boutons) | + échelle de texte | + thèmes | Propriétés qui changent (charte + échelle) | Thèmes qui changent des COULEURS | Couleurs / polices en dur |
|---|---|---|---|---|---|---|
| minimalistes-01-menu-et-mentions | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 31/11 |
| minimalistes-02-signature-typographique | DEP | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 7/3 |
| minimalistes-03-barre-fine-retour-en-haut | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 15/6 |
| minimalistes-04-marque-phrase-reseaux | PART | PART | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 12/3 |
| minimalistes-05-cartouche-centre | DEP | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 14/5 |
| minimalistes-06-index-numerote | PART | PART | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 25/10 |
| minimalistes-07-deux-zones-asymetriques | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 24/7 |
| minimalistes-08-trois-volets-compacts | DEP | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 37/13 |
| corporate-01-grande-marque-volets | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 61/26 |
| corporate-02-bandeau-appel-cinq-colonnes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 76/31 |
| corporate-03-double-navigation-services | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 93/36 |
| corporate-04-rendez-vous-en-cartes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 72/28 |
| corporate-05-implantations-en-colonnes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 64/29 |
| corporate-06-certifications-centre | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 45/25 |
| corporate-07-affiche-noir-et-or | DEP | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 55/21 |
| corporate-08-contact-et-trois-niveaux-legaux | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 35/16 |
| ecommerce-01-mega-enseigne | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 73/36 |
| ecommerce-02-maison-luxe-sobre | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 66/31 |
| ecommerce-03-place-de-marche | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 82/35 |
| ecommerce-04-boutique-de-niche | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 44/21 |
| ecommerce-05-confiance-paiement-livraison | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 53/22 |
| ecommerce-06-mobile-first | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 62/27 |
| ecommerce-07-club-newsletter | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 53/25 |
| ecommerce-08-service-client-en-deux-volets | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 59/26 |
| saas-tech-01-mega-pied-six-colonnes | DEP | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 110/40 |
| saas-tech-02-pied-minimal-produit | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 39/13 |
| saas-tech-03-grand-appel-essai-gratuit | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 87/32 |
| saas-tech-04-pied-developpeurs-api | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 72/24 |
| saas-tech-05-statut-et-securite | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 63/28 |
| saas-tech-06-startup-decontracte-centre | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 33/17 |
| saas-tech-07-lettre-et-nouveautes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 57/23 |
| saas-tech-08-integrations-et-expert | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 67/23 |
| editoriaux-01-pied-de-journal | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 71/26 |
| editoriaux-02-grandes-rubriques | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 75/30 |
| editoriaux-03-carnet-chaleureux | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 36/12 |
| editoriaux-04-media-numerique-nuit | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 69/27 |
| editoriaux-05-revue-et-colophon | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 60/25 |
| editoriaux-06-journal-de-quartier | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 65/21 |
| editoriaux-07-lettre-independante | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 51/18 |
| creatifs-portfolios-01-pied-affiche-titre-geant | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 62/27 |
| creatifs-portfolios-02-cadre-exposition | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 52/24 |
| creatifs-portfolios-03-invitation-a-ecrire | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 35/11 |
| creatifs-portfolios-04-index-projets-reseaux | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 78/30 |
| creatifs-portfolios-05-signature-artiste | PART | PART | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 24/9 |
| creatifs-portfolios-06-bande-annonce-neon | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 47/22 |
| education-01-universite-cinq-colonnes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 128/47 |
| education-02-plateforme-de-cours-vivante | DEP | DEP | DEP | backgroundColor, borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, color, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 79/28 |
| education-03-ecole-chaleureuse-parents | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 62/24 |
| education-04-centre-de-formation-inscription | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 100/41 |
| education-05-cours-ouvert-questions | DEP | DEP | DEP | color, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | noir+volt | 39/17 |
| education-06-campus-plan-et-horaires | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 81/30 |
| communautes-01-reseau-social-dense | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 96/37 |
| communautes-02-forum-rubriques-et-charte | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 106/51 |
| communautes-03-club-accueil-et-gazette | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 98/41 |
| communautes-04-developpeurs-contribuer | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 106/35 |
| communautes-05-evenement-agenda-billets | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 80/40 |
| communautes-06-groupes-grandes-pastilles | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 102/44 |
| services-01-artisan-grand-telephone | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 73/30 |
| services-02-consultant-rendez-vous-sobre | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 39/15 |
| services-03-freelance-parlons-projet | PART | PART | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 32/17 |
| services-04-agence-devis-formulaire | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 78/32 |
| services-05-domicile-zone-horaires | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 63/27 |
| services-06-cabinet-de-soins-accueillant | DEP | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 52/20 |
| services-07-depannage-urgent-24h | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | noir+volt | 77/38 |
| restauration-hotellerie-01-bistrot-ardoise-du-jour | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 68/35 |
| restauration-hotellerie-02-hotel-sobre-chambres-bons-cadeaux | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 78/30 |
| restauration-hotellerie-03-cafe-boulangerie-cartes-chaudes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | noir+volt | 57/23 |
| restauration-hotellerie-04-table-gastronomique-centree | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 50/19 |
| restauration-hotellerie-05-maison-hotes-carte-horaires | DEP | DEP | DEP | color, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 68/25 |
| restauration-hotellerie-06-bar-nocturne-ouvert-ce-soir | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 62/27 |
| immobilier-01-agence-de-quartier-estimation | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 98/33 |
| immobilier-02-reseau-national-mentions-renforcees | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 121/47 |
| immobilier-03-promoteur-programmes-numerotes | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 47/25 |
| immobilier-04-portail-annonces-recherche | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | noir+sape+volt | 142/49 |
| immobilier-05-gestion-locative-espaces | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 109/43 |
| finance-juridique-01-banque-en-ligne-securite | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 108/39 |
| finance-juridique-02-assurance-sinistre-et-produits | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 127/45 |
| finance-juridique-03-cabinet-avocats-discret | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 67/30 |
| finance-juridique-04-cabinet-comptable-echeances | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 81/31 |
| finance-juridique-05-courtier-avertissement-reglementaire | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 77/34 |
| finance-juridique-06-fintech-moderne-statut | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+sape+volt | 90/39 |
| ong-associations-01-ong-humanitaire-appel-au-don | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 113/44 |
| ong-associations-02-association-quartier-chaleureuse | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 81/34 |
| ong-associations-03-fondation-sobre-institutionnelle | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 95/44 |
| ong-associations-04-collectif-militant-ton-fort | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 63/25 |
| ong-associations-05-tiers-lieu-adhesion-agenda | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | maille+noir+sape+volt | 83/53 |
| landing-pages-01-bouton-achat-final | PART | PART | DEP | fontFamily, fontWeight, lineHeight | maille+noir+sape+volt | 36/14 |
| landing-pages-02-garantie-satisfait-rembourse | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | maille+noir+sape+volt | 32/12 |
| landing-pages-03-inscription-courte-honnete | PART | PART | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 32/15 |
| landing-pages-04-webinaire-inscription | PART | PART | DEP | fontFamily, fontWeight, lineHeight | maille+noir+sape+volt | 43/19 |
| landing-pages-05-lancement-ligne-confiance | PART | PART | DEP | fontFamily, fontWeight, lineHeight | maille+noir+sape+volt | 50/20 |
| landing-pages-06-capture-sobre-colonne | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 28/10 |
| institutionnels-01-portail-national-six-colonnes | DEP | DEP | DEP | backgroundColor, borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, color, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 163/50 |
| institutionnels-02-mairie-horaires-et-demarches | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 110/35 |
| institutionnels-03-agence-plan-du-site-trois-niveaux | DEP | DEP | DEP | borderBottomColor, borderBottomWidth, borderTopColor, borderTopLeftRadius, borderTopWidth, fontFamily, fontSize, fontWeight, lineHeight, paddingBottom, paddingLeft, paddingRight, paddingTop | maille+noir+sape+volt | 148/48 |
| institutionnels-04-etablissement-de-sante-visiteurs | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 97/39 |
| institutionnels-05-musee-index-numerote | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 80/31 |
| institutionnels-06-organisme-europeen-multilingue | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 114/42 |
| institutionnels-07-prefecture-bandeau-officiel | PART | DEP | DEP | fontFamily, fontWeight, lineHeight | noir+volt | 69/26 |
| institutionnels-08-intercommunalite-services-en-cartes | PART | DEP | DEP | fontFamily, fontSize, fontWeight, lineHeight | noir+volt | 113/40 |

## Données brutes et scripts (hors dépôt)

Dossier `/private/tmp/claude-501/-Users-imac-Downloads-Ptojry-google-stich-design/234805b0-e56d-4b6e-a957-09d5db8adc8d/scratchpad/audit-v2/` :
`lib.js` (serveur + site + Chrome), `snap.js` (relevé des styles calculés et explication par règle CSS), `run-scenario.js` → `scenario-a.jsonl`, `scenario-b.jsonl` (100 modèles × 9 états × 2 largeurs, avec la règle CSS responsable), `run-contam-preview.js` → `contam.jsonl` (contamination inverse, aperçu, éditeur), `run-structure.js` → `structure.jsonl`, `run-contrast.js` → `contrast.jsonl`, `run-shots.js` → `shots2/*.png`, `static-models.js`/`static-props.js` → `static-*.json`, `aggregate.js` → `aggregate.json` (verdicts), `table-100.md`.
Relancer : `TEST_START_TIMEOUT_MS=900000 node run-scenario.js` (variables `LIMIT`, `OFFSET`, `OUT`, `PACKS`) depuis ce dossier ; `NODE` du dépôt `/private/tmp/claude-501/inter-wt`.
