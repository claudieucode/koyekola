# Architecture d'isolation proposée pour les pieds de page (phase 1, aucun code du produit modifié)

Date : 9 novembre 2026. Dépôt : branche `footer-v2-etude`. Seuls des fichiers `docs/footer-v2/*.md` ont été écrits. Prototypes, données brutes et captures : hors dépôt, dans
`/private/tmp/claude-501/-Users-imac-Downloads-Ptojry-google-stich-design/234805b0-e56d-4b6e-a957-09d5db8adc8d/scratchpad/arch-v2/` (désigné `arch-v2/` ci-dessous).
Légende : **[exécuté]** = mesuré dans un vrai Chrome (v150, profil neuf) sur le vrai serveur de test ; **[lu]** = lu dans le code ; **[non vérifié]** = non testé ou tiré de ma mémoire.
Documents liés : `PLAN_EXECUTION_PHASES.md`, `PLAN_REMPLACEMENT_ANCIEN_CATALOGUE.md`, `TESTS_STRATEGIE.md` ; audits : `AUDIT_INDEPENDANCE_GRAPHIQUE.md`, `AUDIT_ARCHITECTURE_FOOTER_ACTUELLE.md`, `AUDIT_RISQUES_ET_REMPLACEMENT.md`.

## 0. Résumé

* **Recommandation** : une « **frontière de pied** » en trois pièces, toutes en CSS/HTML natifs, sans second moteur :
  1. une **balise racine** `<footer data-kw-ft="solo">` posée **hors de `<main>`** (dernier enfant du `<body>`) ;
  2. des **jetons propres au pied** (`--ft-*`) et un **remappage local** des variables `--kw-*` / `--lp-*` lues par les widgets partagés : le pied lit SES valeurs, jamais celles du site ;
  3. une **exclusion explicite du pied dans tout le CSS « du site »** (thèmes, réglages globaux, CSS personnalisé) : chaque sélecteur reçoit le suffixe `:not(:where([data-kw-ft="solo"], [data-kw-ft="solo"] *))` (spécificité ajoutée : 0, donc aucune cascade existante ne bouge ; fonctionne avec `!important`).
  Plus une coupure de l'héritage à la racine (`all: initial`), la ligne légale **dans** le pied, et un mode « hérité » (`data-kw-ft="site"`) pour qui veut suivre la charte.
* **Preuve [exécuté]** : 6 modèles réels × 9 changements du site (couleurs, polices, échelle de texte, réglages « Global », boutons/champs/rayons/espacements, 4 thèmes) × 2 largeurs (390 et 1280 px) = 108 comparaisons par technique. **Sans isolation : 3 694 propriétés changent (96 comparaisons sur 108 touchées) ; avec la frontière : 0 (0 sur 108)**, 0 changement sur l'en-tête et le contenu, 0 écart de largeur (sans isolation : le pied passe de 1280 à 780 px avec `sape` et 820 px avec `volt`).
* **Ce qui ne marche pas** : `@layer` seul (136 propriétés encore changées) ; Shadow DOM (isole, mais casse la sélection d'éléments de l'éditeur et les scripts de `landing.js`, et son mesurage a des limites, voir §3) ; `iframe` (écarté).
* **Compatibilité** : la frontière a été appliquée **sans toucher au contenu stocké des modèles** : elle est donc applicable aux 100 modèles actuels. Je recommande de ne l'activer par défaut que sur les NOUVEAUX pieds et d'offrir un bouton « Rendre ce pied indépendant » (avec aperçu avant/après) pour les copies déjà installées (§7).

## 1. Les 5 canaux d'héritage à fermer (rappel de l'audit)

| N° | Canal | Où il passe |
|---|---|---|
| 1 | CSS du thème de site actif | règles `body[data-kw-pack=…] a/p/.lp-main > …` (129 thèmes sur 130 en ont une pour `a`) |
| 2 | Typographie du corps héritée | `.lp-site { font-family/size/weight/line-height: var(--kw-body-…) }` (`landing.css:491`) |
| 3 | Ligne légale ajoutée hors modèle | `_sections.ejs:93-95`, `_foot-legal.ejs`, `landing.css:499` |
| 4 | Boutons / champs du site | `themeCss.js:47-56, 84-92`, `landing.css:848`, `--lp-accent` (lu par `.kw-btn-primary/.kw-btn-outline`) |
| 5 | Espacement de page | `landing.css:143` (`.lp-block + .lp-block`), `.lp-main > …` des thèmes, `landing.css:911` |

## 2. Comparatif des 6 techniques demandées (+ 2 variantes testées)

Colonnes « protège » = canaux 1 à 5 fermés (O = oui, P = partiellement, N = non). Coût = travail estimé (petit/moyen/grand). Les chiffres « mesuré » viennent du prototype (§3).

| Technique | Protège les 5 canaux | Ce qu'elle casse / ses limites réelles dans CE moteur | Coût | Risque | Mesuré |
|---|---|---|---|---|---|
| **A. `@layer` + `all: initial` / `revert-layer` + variables locales** | 2 O, 4 P, 1 P, 3 P, 5 P | Les couches ne protègent que contre des règles NORMALES du CSS mis dans une couche : il faut mettre TOUT le CSS du site (landing.css, thèmes, CSS perso, feuilles tierces) dans une couche, sinon une feuille hors couche gagne. Les `!important` des thèmes (883) et de `base.css` (23) passent quand même (en couche, `!important` inverse l'ordre). Une règle de thème qui vise directement `a`, `p`, `.kw-heading` s'applique toujours à tout ce que le pied ne redéclare pas (marges, casse, remplissages). `revert-layer` fait l'inverse de ce qu'on veut (il revient aux couches du site). `all: initial` coupe l'héritage mais pas les règles directes. Aucun impact éditeur. | moyen | **élevé** (toucher à la cascade de tout le site) | **136 propriétés changent encore** (26 comparaisons sur 108) |
| **B. `@scope (…) to (…)` natif** | O (si appliqué au CSS du site) | Équivaut à l'exclusion (E′ ci-dessous) mais avec une syntaxe native. Support : Baseline « Newly available » depuis mars 2026 selon MDN [lu sur MDN] ; versions exactes (Chrome 118, Safari 17.4, Firefox 146) = **ma mémoire, non vérifiée** ; donc des visiteurs avec un navigateur de plus de 8 mois ne sont pas protégés. `@scope` ne peut pas contenir `@font-face` / `@keyframes` ; les règles qui visent `html`/`:root` ne marchent plus dedans ; une règle dans `@scope` gagne l'égalité de spécificité contre une règle hors `@scope` (critère de proximité), ce qui peut changer la cascade du site. Sans aucun usage dans la base de code aujourd'hui. | moyen | moyen | **0** (0 sur 108) sur Chrome 150 ; Safari/Firefox non testés |
| **C. Shadow DOM** (rendu serveur `<template shadowrootmode>`) | O pour les règles ; **N pour l'héritage** (il faut `all: initial` sur l'hôte) ; **N pour le cadre de l'hôte** (le `<footer>` hôte reste soumis aux règles du site) | Casse : (1) la **sélection de nœuds de l'éditeur** (`event.target` est retargeté vers l'hôte : mesuré, `closest('.kw-node')` renvoie `FOOTER` au lieu du nœud ; `elementFromPoint` renvoie l'hôte) ; (2) **les scripts** : `landing.js` fait ~30 `document.querySelectorAll(...)` (accordéon mobile `[data-kw-nacc]`, onglets, carrousel, menus) qui ne voient PAS le contenu d'une racine fantôme (mesuré : 0 trouvé) ; chaque script (landing.js, motion-studio, accordion-engine…) devrait être réécrit ; (3) le CSS du Page Builder, les contours de sélection de l'éditeur et `landing.css` devraient être dupliqués/liés DANS chaque racine ; (4) SEO : un crawler sans prise en charge du « declarative shadow DOM » ne voit que `<template>` [non vérifié] ; (5) liens d'ancre `#id` et `aria-labelledby` ne traversent pas la frontière. Formulaires : fonctionnent (mesuré). Focus clavier : l'ordre de tabulation est préservé (mesuré), l'arbre d'accessibilité aussi (rôle `contentinfo` présent). Support : Chrome 111, Safari 16.4, Firefox 123 (**mémoire, non vérifié**). | grand | **élevé** | **0 réel** (les 104 propriétés relevées sont des images intermédiaires de transitions de 0,15 s dans la racine fantôme, de 0,07 à 0,08 d'opacité) |
| **D. `<iframe srcdoc>`** | O | Écartée sans test : hauteur à synchroniser (script + ResizeObserver, saut de page, `CLS`), liens et formulaires qui s'ouvrent DANS le cadre (`target=_top` partout), pas de partage de la police ni des cookies/consentement, SEO (contenu hors du document), accessibilité (une page dans la page, un repère de plus pour les lecteurs d'écran, « un seul pied » non tenable), impression, double chargement du CSS, éditeur non sélectionnable. Contraire à l'exigence « un seul footer, widgets dans le footer ». | grand | élevé | non testé |
| **E. Sélecteurs à haute spécificité + remise à zéro locale** | P | Ce qui existe de plus proche aujourd'hui. Course à l'armement : un thème en `body[data-kw-pack] .lp-main > :not(.pk-bleed):not(:has(.pk-bleed)) a` a déjà une spécificité (0,5,2) ; il faudrait à chaque règle du pied des identifiants et des `!important`, ce que l'utilisateur interdit. Ne protège pas des règles de thème à `!important`. | moyen | élevé | non testé (conclusion tirée de l'audit : 100/100 modèles déformés avec 4 thèmes alors que les règles du modèle sont déjà en `.kw-n-<id>`) |
| **E′. Exclusion par sélecteur** (`:not(:where([data-kw-ft] *))` ajouté au CSS du site) + jetons locaux + racine hors `<main>` | **O** | Aucune règle du site ne peut atteindre le pied, même avec `!important` ; spécificité inchangée ; support universel (`:not()` avec sélecteur complexe : Chrome 88, Firefox 84, Safari 9 [mémoire]). Limites : (1) tout CSS « site » doit passer par un **point d'émission unique** qui applique le suffixe (sinon fuite : couvert par un test automatique) ; (2) un CSS tiers ajouté à la main hors de ce point n'est pas protégé ; (3) pas de protection contre les règles écrites DANS `landing.css` qui visent le pied (traité à la source : `landing.css` est à nous, voir §4.3) ; (4) l'utilisateur qui veut volontairement styler son pied avec son CSS personnalisé du site ne le peut plus : il aura un champ « CSS du pied » (portée automatique, comme `selector` d'Elementor). Éditeur, scripts, SEO, formulaires : **inchangés** (DOM normal). | petit à moyen | **faible** | **0** (0 sur 108) |
| **F. Mode « hérité » par pied (`data-kw-ft="solo"` / `"site"`)** | — (c'est un interrupteur, pas une isolation) | S'appuie sur E′ : `solo` active la frontière ; `site` la retire et branche `--ft-*` sur les variables du site. Inspiré d'Elementor, qui n'offre qu'un interrupteur global (`ELEMENTOR_ISOLATION_STYLES.md` §5). | petit | faible | non testé (conception) |
| *Variante B′ testée* : le CSS du site enveloppé règle par règle dans `@scope (html) to ([data-kw-ft])` | O | Résultat identique à E′ sur Chrome 150 ; mais plus lourd à émettre (chaque règle enveloppée) et dépendant du support navigateur. À garder comme simplification future. | moyen | moyen | **0** (0 sur 108) |

### Justification du choix

* Seules **E′/B′ (exclusion) et C (ombre)** ont atteint 0 sur le scénario. C coûte l'éditeur et les scripts ; B′ dépend de la date de mise à jour du navigateur du visiteur ; **E′ marche partout, ne change rien à l'éditeur, aux scripts ni au référencement, et peut être validée par un test automatique**.
* Les couches (A) sont attirantes mais protègent mal contre les règles directes et les `!important`, et obligent à mettre TOUT le site dans une couche : le risque de régression sur les 130 thèmes (cascade) est disproportionné.
* Le complément indispensable de E′ est le **remappage des jetons** : sans lui, les widgets du pied lisent encore `--lp-accent` ou `--kw-primary` du site (c'est ce qui restait de 12 changements dans ma première version du prototype, trouvé et corrigé pendant l'étude).

## 3. Prototype jetable : ce qui a été construit et mesuré

### 3.1 Méthode [exécuté]

* Scripts (hors dépôt, `arch-v2/`) : `run.js` (scénario), `iso.js` (l'isolation appliquée EN PAGE sur le rendu publié, donc sur une copie : le dépôt n'est pas touché), `snap2.js` (styles calculés, traverse les racines fantômes), `agg.js`/`sum.js` (agrégation), `feat.js` et `form.js` (éditeur simulé, scripts, accessibilité, impression, mouvement réduit), `montage.js` (planches). Pilote Chrome : copie de `tests/helpers-chrome-cdp.js` avec un accès `cmd` ajouté (`arch-v2/chrome.js`). Serveur de test : celui des tests (`startServer`, une seule instance), site « Proto isolation » avec en-tête publié.
* 6 modèles réels : `ft-minimalistes-01-menu-et-mentions` (clair), `ft-corporate-01-grande-marque-volets` (sombre, accordéon mobile), `ft-saas-tech-04-pied-developpeurs-api` (sombre, police à chasse fixe), `ft-editoriaux-02-grandes-rubriques` (clair, serif, grandes rubriques), `ft-creatifs-portfolios-01-pied-affiche-titre-geant` (sombre, affiche display), `ft-ecommerce-03-place-de-marche` (recherche, boutons, champs).
* Scénario (le même que l'audit) : 1) identité marine ; 2) insertion et publication du pied ; 3) relevé ; 4-5) couleurs du site changées (état C) ; 6-7) polices du site (F) ; échelle de texte (T), réglages « Global » (G), boutons/champs/rayons/ombres/espacements (R) ; 8-9) thèmes `maille`, `noir`, `sape`, `volt` activés par les vraies routes ; 10) rechargement (déjà 0 écart à l'audit, non rejoué). Chaque état est comparé à l'identité marine de LA MÊME technique. Pour chaque élément du pied (jusqu'à ~110), 28 propriétés calculées (couleurs, fond, police, taille, graisse, interligne, casse, bordures, rayon, marges, remplissages, ombre, opacité…) ; **un changement ne compte que s'il est visible** (même règle que l'audit). Largeurs 390 et 1280 px. Les transitions CSS en cours sont terminées avant chaque relevé (un premier jeu de résultats les avait comptées à tort : corrigé).
* Mesures supplémentaires : en-tête (`.lp-site-header`) et contenu (`.lp-block` hors parties du site) comparés à la page non isolée dans le même état ; un seul `<footer>` ; pied hors `<main>` ; défilement horizontal ; largeur de la racine.
* Ce que l'isolation du prototype fait exactement (équivalent de ce que le produit émettrait) : (a) le `<footer>` quitte `<main>` et reçoit `data-kw-ft="solo"` (ses anciennes classes `lp-block …` sont retirées) ; (b) feuille propre au pied : `[data-kw-ft] { all: initial; display: block; … ; --kw-* / --lp-* figés ; --ft-font/size/weight/lh/text ; font: var(--ft-…) }` + règles de la ligne légale en jetons + les règles `.kw-n-<id>` des nœuds du pied (extraites de la feuille de page) ; (c) toute règle des feuilles autres que `landing.css` reçoit `:not(:where([data-kw-ft],[data-kw-ft] *))`. `landing.css` n'est PAS modifié : il reste partagé et ses `var(--kw-…)` lisent les valeurs locales du pied. Les jetons figés sont les valeurs calculées du modèle sous l'identité marine (le moteur les émettra à partir de l'ambiance du modèle).

### 3.2 Résultats [exécuté] — 6 modèles × 9 états × 2 largeurs = 108 comparaisons par technique

| Technique | Propriétés visibles qui changent (total) | Comparaisons touchées | Contamination en-tête / contenu (propriétés) | Largeur du pied altérée |
|---|---|---|---|---|
| **AVANT : aucune isolation** | **3 694** (≈ 1 938 éléments) | **96 / 108** | 0 | oui : 780 px (`sape`) et 820 px (`volt`) au lieu de 1280, sur les 6 modèles |
| `@layer` (A) | 136 | 26 / 108 | 0 | non |
| **Exclusion + jetons locaux (E′, recommandée)** | **0** | **0 / 108** | **0** | **non** |
| `@scope` donut (B′) | 0 | 0 / 108 | 0 | non |
| Shadow DOM (C) | 0 réel (104 relevés = images intermédiaires de transitions) | — | 0 | non |

Détail de l'AVANT (propriétés qui changent, 6 modèles, 2 largeurs) : couleurs du site 0 · polices 52 · échelle de texte 572 · « Global » 578 · boutons/champs/espacements 632 · `maille` 358 · `noir` 506 · `sape` 198 · `volt` 798. (Les couleurs du site seules ne changent presque rien : les modèles ont leurs couleurs en dur ; c'est ce que l'audit avait déjà constaté.)
Détail du résidu `@layer` : `margin-bottom` des paragraphes/titres (règle `body[data-kw-pack="noir"] p`), `text-transform` (`.lp-site :where(h2.kw-heading)`), remplissage et taille des boutons, rayon des champs, fond des pastilles sociales (règles directes qu'une couche ne bloque pas).
Détail du résidu `ombre` : aucun écart de style réel ; les relevés sont `rgba(16,34,47,0.07)` contre `0.075` (transitions dans la racine fantôme non terminées par mon script : **limite de ma mesure**, à reprendre si on retient C).

Fidélité (le design est-il conservé ?) [exécuté] : sous identité marine, la frontière E′ ne change que **3 propriétés de la racine** par modèle : `margin-top` 32 → 0 px (voulu : le pied n'a plus de marge de page), `row-gap`/`column-gap` 16 px → `normal` (la racine n'est plus un conteneur flexible ; voir §5.3). Pour tous les autres éléments : **0 écart**. Contrôle visuel (planches `arch-v2/montages/*.png`) : voir §3.4.

Structure [exécuté, 120 comparaisons] : 1 seul `<footer>`, 0 pied dans `<main>`, 0 défilement horizontal, 0 `<header>` ajouté, widgets (liens, boutons, recherche, réseaux, accordéon) tous dans le pied.

### 3.3 Fonctionnalités testées par technique [exécuté, fichier `arch-v2/feat.json`, 3 modèles à 390 px]

| Test | Sans isolation | `@layer` | Exclusion (E′) | Shadow DOM |
|---|---|---|---|---|
| Accordéon mobile de `landing.js` (clic réel sur le volet) | s'ouvre | s'ouvre | s'ouvre | **ne s'ouvre pas** dans mon essai ; `document.querySelectorAll("[data-kw-nacc]")` renvoie 0 dans le contenu fantôme |
| Sélection d'un nœud comme le ferait l'éditeur (clic réel, délégation `e.target.closest(".kw-node")`) | nœud trouvé | nœud trouvé | nœud trouvé | **`FOOTER` (l'hôte)** ; le nœud n'est retrouvé que par `composedPath()[0]` et `elementFromPoint` renvoie l'hôte : le code de l'éditeur serait à réécrire |
| Formulaire du pied (recherche) : `requestSubmit`, validité, clic du bouton | OK | — | OK | OK |
| Arbre d'accessibilité (`contentinfo` exposé) | 1 | 1 | 1 | 1 |
| Ordre de tabulation (parcours Tab réel) | identique (15 éléments focalisables sur corporate-01) | identique | identique | identique, sauf accordéon (11 éléments car non amélioré) |
| Contour de focus visible (2 à 3 px) | oui | oui | oui | oui |
| Impression (`@media print`) | pied affiché | affiché | affiché | affiché |
| `prefers-reduced-motion: reduce` | 3 à 6 éléments animés restent (transitions de 0,15 s des boutons/liens) | idem | idem | idem |

Lecture : l'isolation ne change **rien** à l'accessibilité de base (focus, ordre, repère `contentinfo`). Constat à traiter dans la nouvelle version, indépendamment de la technique : le pied n'éteint pas ses transitions sous `prefers-reduced-motion` (3 à 6 éléments animés sur 71 à 74) ; à corriger dans la feuille de la frontière (§4.6). Autre constat : dans la page actuelle, le `<footer role="contentinfo">` est **à l'intérieur de `<main>`**, ce qui est incorrect pour les repères d'accessibilité (un repère `contentinfo` doit être de premier niveau) ; la frontière le sort de `<main>`.

### 3.4 Captures AVANT / APRÈS (regardées avec l'outil Read, planches `arch-v2/montages/`)

Chaque planche : colonne gauche AVANT (page publiée actuelle), colonne droite APRÈS (frontière), lignes : identité marine, thème `noir`, thème `volt`.

* `montages/corporate-01-grande-m.png` (sombre) : AVANT, le thème `volt` rétrécit le pied à ~65 % de la largeur (collé à gauche), les liens deviennent vert foncé sur fond marine (presque invisibles) et les icônes sociales sont vert sombre ; avec `noir`, les liens perdent leur contraste. APRÈS : les trois lignes sont **visuellement identiques** (même fond marine, mêmes liens clairs, pleine largeur).
* `montages/saas-tech-04-pied-dev.png` (terminal, police fixe) : AVANT, avec `noir` le titre « Construisez sur Kernlab » devient énorme (le thème force une grande taille de titre), avec `volt` le pied est rétréci et tout est vert pâle sur noir ; APRÈS : stable, le bouton « Lire la documentation » garde sa bordure verte.
* `montages/editoriaux-02-grandes.png` (clair, serif) : AVANT, avec `noir` les titres « Société / Culture / Idées / Vivre » deviennent **ivoire sur fond blanc (invisibles)** et « Ne ratez aucun numéro » change de police et de taille ; avec `volt` tout passe en majuscules grasses italiques et la 4ᵉ colonne tombe à la ligne. APRÈS : identique à l'identité marine.
* `montages/creatifs-portfolios-0.png` (affiche display) : AVANT, avec `volt` le mot « isolation » est coupé en deux lignes (« isolatio / n ») et en vert foncé ; APRÈS : le grand titre blanc est intact dans les trois cas.
* Autres planches générées : `minimalistes-01-menu-.png`, `ecommerce-03-place-de-.png` (même constat ; ecommerce-03 non commenté ici car moins parlant à l'œil).
* Honnêteté : l'APRÈS est décalé de quelques pixels vers le haut/bas par rapport à l'AVANT (la marge du pied et le remplissage de `<main>` ont disparu) ; je ne l'ai pas corrigé, c'est un choix de conception à confirmer (§4.1). Je n'ai pas comparé les 6 modèles pixel à pixel, seulement les styles calculés (0 écart hors les trois propriétés de la racine) et les planches à l'œil.

## 4. Design détaillé de l'architecture retenue

### 4.1 Où la frontière est posée
* **Enveloppe** : `<footer class="kw-ft" data-kw-ft="solo|site" data-kw-footer="1" role="contentinfo">`, émise par la vue (`views/marketing-public/_sections.ejs`, aujourd'hui lignes 17-21 et 93-100) et par `themeRender`/`footer.ejs` pour les pages hors Page Builder (blog, boutique, 404 : `views/partials/footer.ejs`, `views/boutique/_bottom.ejs`, `views/site-public-error.ejs`).
* **Position** : après `</main>`. Aujourd'hui `landing.ejs:38-40` inclut `_sections` DANS `<main class="lp-main">` ; il faudra **séparer** les sections de contenu (dans `main`) du pied (après `main`). Effet : plus de `.lp-main > …` (85 thèmes), plus de `.lp-block + .lp-block`, et repère `contentinfo` correct. L'en-tête reste traité comme aujourd'hui (non concerné par ce lot ; il pourrait suivre le même principe plus tard).
* **Un attribut, deux valeurs** : `data-kw-ft="solo"` (indépendant, défaut des nouveaux pieds) ; `data-kw-ft="site"` (hérité : pas d'exclusion, `--ft-*` branchés sur `--kw-*`). Pas d'attribut = comportement actuel (pieds installés non migrés).

### 4.2 Jetons locaux `--ft-*`
Famille proposée (valeurs fixes émises par le moteur à partir de l'ambiance, pas d'une valeur du site) : `--ft-bg`, `--ft-bg-alt`, `--ft-text`, `--ft-muted`, `--ft-accent`, `--ft-on-accent`, `--ft-line`, `--ft-font`, `--ft-font-head`, `--ft-size`, `--ft-weight`, `--ft-lh`, `--ft-radius`, `--ft-radius-btn`, `--ft-btn-py`, `--ft-btn-px`, `--ft-btn-size`, `--ft-btn-weight`, `--ft-field-bg`, `--ft-field-line`, `--ft-field-radius`, `--ft-gap`, `--ft-pad-x`, `--ft-pad-y`, `--ft-legal-bg`, `--ft-legal-text`, `--ft-legal-size`. Émission : `catalog/footer/kit-conception.js` (`ambiance()` : déjà `bg, fg, mute, alt, accent, onAccent, line…` + `police/titres`) fournit les valeurs ; `catalog/footer/moteur.js` (`wrap()`) pose la racine avec une propriété `ftTokens` que `src/marketing/pages/nodes.js` (`declarations`/`pageCss`) transforme en règle `[data-kw-ft="solo"][data-kw-ft-id="<id>"] { --ft-…: … }`. Les noeuds des modèles continuent à écrire leurs valeurs en dur (compatibilité des 100 modèles) ; les NOUVEAUX modèles les écrivent en `var(--ft-…)`, ce qui rend la thématisation propre au pied (changer l'ambiance sans réécrire 50 nœuds).
Chargement des polices : `@font-face` des polices du modèle émis dans la feuille du pied (aujourd'hui globale dans la page : `fontLibrary.faceCssFor`), noms de familles uniques (déjà le cas : 93 modèles sur 100) ; `font-display: swap`, `preload` seulement de la police du premier titre ; budget à fixer en phase 3 (poids par modèle, §Tests).

### 4.3 Remappage de l'API partagée (widgets de `landing.css` inertes vis-à-vis du site)
La racine redéfinit **toutes** les variables lues par `landing.css`/`widgets.css`/`motion-studio.css` (relevé : une soixantaine de `--kw-*` et `--lp-accent/-on-accent/-text/-bg/-div`) avec des valeurs du pied (`--kw-primary: var(--ft-accent)` etc.). Les widgets restent fonctionnels et gardent leur CSS partagé (aucun second jeu de widgets) mais lisent le pied. Un **test de couverture** vérifie que toute variable utilisée par ces feuilles est remappée (si quelqu'un ajoute `var(--kw-nouveau)` à `landing.css`, le test échoue). C'est la pièce qui manquait à mon premier essai du prototype (12 changements résiduels sur `--lp-accent`, corrigés ensuite).
Les règles de `landing.css` qui visent le pied lui-même (`.lp-site .lp-block + .lp-block`, `.lp-main:has(> .lp-block.lp-site-footer:last-child)`, `.lp-foot…`, `[data-kw-footer] …`) seront nettoyées à la source (fichier à nous).

### 4.4 Exclusion du CSS du site
Un module unique (nouveau, ex. `src/marketing/pages/footerFrontier.js`) exporte `excludeFooter(css)` (analyse des règles, ajout du suffixe au sujet de chaque sélecteur, y compris dans `@media/@supports`, avant un éventuel pseudo-élément ; ignore `@font-face`, `@keyframes`, `html`, `:root`) et le CSS de la frontière. Points d'émission à passer par ce module : `packs/index.js:scopeCss` (CSS des thèmes), `themeCss.js` (boutons/champs du site), `globalStyles.js` (réglages « Global »), `siteSettings.js` (`assets.theme`, `assets.custom`), `themeRender.wrapHtml` (`siteOk.assets.*`, `vm.customCss`). Le prototype a appliqué ce traitement à toutes les feuilles sauf `landing.css`, et obtient 0.
Le **CSS personnalisé du site** ne peut plus atteindre le pied (par défaut) : un champ « CSS du pied » séparé (portée automatique) le remplace (décision utilisateur, §8).

### 4.5 Ligne légale
Ne plus l'injecter hors du modèle : le moteur ajoute au pied un **widget `legal`** (dernière bande) dont le contenu est fourni par la plateforme (nom du site, Cookies, confidentialité, copyright) mais dont le **style est celui du modèle** (`--ft-legal-bg/-text/-size`, police `--ft-font`). Pour les copies installées, `_foot-legal.ejs` est conservé avec les mêmes classes (`.lp-foot`) et la frontière lui donne la police/le poids/l'interligne du pied (le prototype fait déjà cela : fidélité, et le test montre que la police du site ne la change plus).

### 4.6 États, interactions, responsive
Survol/focus/actif : déjà portés par chaque nœud (`finishNode`, `linkStates`, `buttonStates`) : inchangé. Responsive : déjà propre à chaque nœud (`band`/`pageCss` avec media queries) : inchangé ; les largeurs de coupure restent celles du site (`siteX.layout.breakpoints`) tant qu'un point de rupture propre au pied n'est pas décidé (décision §8). Mouvement réduit : ajouter dans la feuille de la frontière un bloc `@media (prefers-reduced-motion: reduce) { [data-kw-ft] *, … { transition-duration: .01ms; animation-duration: .01ms } }`. Impression : fond et couleurs du pied conservés (mesuré : le pied s'imprime).

### 4.7 Aperçu de la bibliothèque (décision)
Constat [exécuté, audit] : l'aperçu ignore le thème actif et suit les polices du site. Décision proposée : l'aperçu rend le pied **avec sa frontière** et **sans aucun CSS de site** (ni thème, ni jetons, ni CSS perso) : il montre ainsi exactement ce qui sera publié si le pied est « indépendant », quel que soit le site. Case à cocher « Voir avec mon thème actuel » (charge le CSS du thème actif, exclusion comprise) pour que l'utilisateur VOIE la preuve d'indépendance. Fichiers : `themeRender.js` (`wrapHtml`, `previewDoc` l.37-52, 205-229).
### 4.8 Éditeur
Le Page Builder du composant charge `landing.css` mais pas les thèmes [exécuté, audit] : il suffit d'ajouter la même racine (`data-kw-ft`) et la même feuille de frontière au canevas ; DOM normal : sélection, glisser-déposer et outils inchangés (testé par simulation, §3.3). Il faudra **tester en vrai** que les contours de sélection (CSS du builder) s'affichent toujours dans une racine `all: initial` (non testé ici).
### 4.9 Widgets
Restent dans le pied (jamais un second pied/en-tête : vérifié 120/120). Les widgets de données (`bizcontact`, `emailsubscribe`, `shoplinks`) et leurs routes ne changent pas.

## 5. Changements de code prévus (aucun appliqué)

| Fichier | Nature |
|---|---|
| `src/marketing/pages/footerFrontier.js` (nouveau) | `excludeFooter(css)`, CSS de la frontière, table de remappage `--kw-*`/`--lp-*` |
| `src/marketing/themes/packs/index.js` (`scopeCss`) | appliquer `excludeFooter` à la sortie ; test : toute règle de thème porte le suffixe |
| `src/marketing/pages/themeCss.js`, `globalStyles.js`, `siteSettings.js` | idem sur le CSS émis |
| `src/marketing/web/themeRender.js` | aperçu sans CSS de site (+ option), racine `data-kw-ft`, `wrapHtml` : CSS du site via `excludeFooter` |
| `views/marketing-public/_sections.ejs`, `landing.ejs`, `views/partials/footer.ejs`, `boutique/_bottom.ejs`, `site-public-error.ejs` | balise racine, pied après `</main>`, légale dans le pied |
| `views/marketing-public/_foot-legal.ejs` | classes à la place des styles en ligne |
| `src/themeBuilder/catalog/footer/moteur.js`, `kit-conception.js` | émission des `--ft-*` et de la racine ; nouveaux modèles en `var(--ft-…)` |
| `src/marketing/pages/nodes.js` | règle de jetons de la racine ; sortie des règles du pied dans leur propre bloc (pas indispensable : le prototype a marché sans) |
| `public/css/landing.css` | retrait/neutralisation des règles qui visent le pied (l.143, 491/499 pour le pied, 911, 1785-1789 à reprendre), bloc `prefers-reduced-motion` |
| Page Builder (vue de l'éditeur de composant pied) | racine de frontière dans le canevas |
| `tests/…` | voir `TESTS_STRATEGIE.md` |

### 5.1 Risques
1. **Fuite par un point d'émission oublié** (CSS ajouté sans `excludeFooter`) : test automatique (le scénario en 10 étapes) + liste fermée des émetteurs.
2. **Pieds installés visiblement modifiés** à l'activation (police de la ligne légale, remplissage des boutons, largeurs avec certains thèmes) : activation par attribut, jamais silencieuse (§7).
3. **Variables oubliées dans le remappage** : test de couverture sur `landing.css` / `widgets.css` / `motion-studio.css`.
4. **Pages hors Page Builder** (blog, boutique, 404) : non étudiées en exécution ici ; à tester en phase 2.
5. **Navigateurs anciens** : E′ n'en dépend pas (`:not()` complexe depuis 2021).
6. **Performance** : le suffixe alourdit chaque sélecteur du site (non mesuré) ; la feuille du pied se charge deux fois si `landing.css` est lié deux fois (le prototype ne le fait pas).

## 6. Ce que cette étude n'a PAS pu vérifier
* Les **100 modèles** (seulement 6) ; les 130 thèmes (seulement `maille`, `noir`, `sape`, `volt`).
* Le **vrai éditeur** (sélection, enregistrement) et le **vrai aperçu de la bibliothèque** : simulés ou lus, pas exécutés avec la nouvelle isolation. L'étape 10 (rechargement/republication) n'a pas été rejouée sur la copie isolée.
* **Firefox et Safari** ; le support de `@scope` et du Shadow DOM déclaratif est tiré de MDN (Baseline « Newly available », mars 2026) et de ma mémoire (non vérifié version par version).
* Les pages **hors Page Builder**, le **multisite**, le **mode sombre automatique** du site, la **performance** (poids CSS/polices, LCP, CLS) et le **CSS personnalisé** d'un vrai site.
* L'effet visuel d'un pied sans marge ni remplissage de `<main>` sur un vrai site (§3.4).
* Le lecteur d'écran réel (seul l'arbre d'accessibilité de Chrome a été lu).

## 7. Compatibilité avec les pieds déjà installés (copies) et migration douce

* Une copie installée est un **document indépendant** stocké en base (`mk_web_components`, `mk_tb_templates`) : le prototype montre que la frontière peut s'appliquer **sans modifier ce document** (tout est posé au rendu : balise racine, jetons figés, exclusion). La migration est donc une décision de **rendu**, pas de données.
* Trois états par pied, portés par un réglage du pied (pas par le contenu) : `legacy` (aucun attribut : rendu actuel, **valeur des 100 copies existantes au déploiement**) ; `solo` (frontière active, défaut des pieds créés depuis la nouvelle bibliothèque) ; `site` (hérité, pour qui veut suivre la charte).
* Bouton dans l'éditeur « Rendre ce pied indépendant » : affiche l'aperçu avant/après (3 thèmes) puis bascule en `solo` ; réversible (« Revenir à l'ancien rendu »), tracé dans les révisions (50 par pied).
* Jetons d'une copie sans `--ft-*` : à la bascule, dérivés à partir du document lui-même (police majoritaire, couleur de texte majoritaire, graisse 400, interligne 1,5) et figés dans le réglage du pied pour que le rendu ne dépende plus jamais du site. Cas limites à tester : copies modifiées à la main, modèles à police multiple.
* Rétroactif pour tous (script en une fois) : **non recommandé par défaut** (changements visibles : police de la ligne légale, remplissage des boutons, largeur avec les thèmes `sape`/`volt`, suppression de la marge haute) ; proposé comme décision à l'utilisateur après la phase 3 (§8).

## 8. Décisions à prendre par l'utilisateur
1. Activer la frontière **par défaut seulement sur les nouveaux pieds** (recommandé) ou aussi, en une fois, sur les copies existantes.
2. Le CSS personnalisé du site doit-il pouvoir encore atteindre le pied (non par défaut ; champ « CSS du pied » séparé à la place) ?
3. Le pied a-t-il des **points de rupture propres** (comme Elementor) ou garde-t-il ceux du site ?
4. Aperçu : sans aucun CSS de site (recommandé) avec case « voir avec mon thème », ou toujours avec le thème actif ?
5. Le pied sort de `<main>` (recommandé : repère `contentinfo` correct) : la marge haute disparaît ; la garder comme réglage du pied ?
6. Le mode « hérité » existe-t-il dès la première version (recommandé : oui, petit coût) ?

## 9. État d'implémentation (phase 2, ajouté après coup)

La frontière de pied décrite ci-dessus est **implémentée** (détail, fichiers, résultats chiffrés et limites : `ISOLATION_IMPLEMENTATION.md`). Écarts avec la proposition :
* **Stockage du réglage** : dans le document du pied (`ftMode`, `ftVars`), pas dans une colonne d'instance : aucune migration, le réglage suit copie, export, révisions et versions.
* **Trois états** `legacy` (absence de réglage, défaut de tous les pieds existants) · `solo` · `site`. Les pieds `legacy` restent **dans `<main>`** (les sortir changerait la cascade des thèmes `.lp-main > …`) ; `solo` et `site` sont posés après `</main>`.
* **Jetons figés** : passer un pied ancien en `solo` fige la charte du site dans le pied (`ftVars`), donc son aspect ne change pas à la bascule.
* **Variables remplacées** : liste explicite `siteVars()` (jetons + `--lp-*` + `--kw-lb-overlay` + `--kw-band-w`), vérifiée par un test de couverture qui avait déjà attrapé `--kw-band-w`.
* **Décisions de la section 8** : 1 (nouveaux pieds seulement) · 2 (CSS perso ne traverse plus `solo`) · 3 (points de rupture du site) · 4 (aperçu sans CSS de site, paramètre `?theme=1`, pas encore de case à cocher) · 5 (marge haute à 0 en `solo`) · 6 (mode `site` livré).
