# Titan XXVIII — « Marine & aurore » (direction artistique, design system, livraison)

Branche `feat/identite-visuelle` (issue de `origin/main` 52494745). Feuille principale : `public/css/kola-vivid.css`. Contrôles : `tests/titan-xxviii-vivid.test.js`.

## 1. Audit (palier A) — ce qui existait déjà

| Couche | Fichier | Contenu |
|---|---|---|
| Jetons d'administration | `kola-ui.css` | marine (`--k-navy-*`, `--primary`), bleu d'action `#0277b6`, fonctionnels (succès/erreur/avertissement), surfaces, ombres teintées, mouvement 120/180 ms |
| Charte « Registre marine » | `kola-brand.css` | `--kb-*` (marine `#0b2a40`, sarcelle `#0e7490`, `#f4f8fb`, `#dde6ed`, `#44596b`, `#5b6b7c`), **accents par espace** (site `#1d5f8f`, marketing `#b83280`, analytics `#0b8a63`, design `#7048c8`), six teintes de données, mouvement adaptatif (`kb-motion.js` : full / lite / off) |
| Illustrations | `src/utils/illustrations.js` + `kola-compose.css` | ~30 scènes SVG générées (cartes, fenêtres, étincelle), palette par variables `--a-*`, déjà teintées par espace |
| États vides | `.mk-empty`, `kx-empty.ejs`, `empty-art.ejs` | 80 vues ; `kola-brand.css` les avait mises « à plat » et sans mouvement |
| Espace élève / catalogue | `style.css` + `kola-v3.css` | aucune illustration, vignette de formation sans image = icône grise |

**Faiblesses relevées (captures avant/après, Chrome réel)** : indicateurs de tableau de bord en gris uni, sans icône ni sens de couleur ; états vides plats ; une seule teinte de remplissage dans les scènes ; **aucun dégradé** ; pas de fonction pour le violet (pédagogie), le turquoise (SEO/lecture), l'ambre ; l'espace « formations » et « tunnels » n'avaient ni accent ni scène ; les écrans `site-web`, `sites`, `commentaires`, `outils`… héritaient à tort de l'accent **marketing** (magenta) hors du mode CMS.

## 2. Direction (palier B)

**Le marine reste la structure** (menus, titres, filets, rail). Les couleurs s'ajoutent *autour*, jamais à la place : une couleur = une fonction, un écran = une couleur dominante (celle de son espace) + un accent, le reste neutre.

| Famille | Fonction | Réf. | Fond | Encre (≥ 4,5:1 sur le fond) |
|---|---|---|---|---|
| azur | action, navigation, site | `#0277b6` | `#e6f2fa` | `#0b5f93` |
| turquoise | construction, SEO, lecture | `#0e7490` | `#e0f4f6` | `#0b5f74` |
| émeraude | croissance, réussite, analyse | `#0b8a63` | `#e2f5ed` | `#076a4c` |
| violet | pédagogie, design, parcours | `#7048c8` | `#eee9fa` | `#5f35b0` |
| magenta | campagnes, création, audience | `#b83280` | `#fbe8f2` | `#9a2569` |
| ambre | attention, mise en valeur | `#c98a00` | `#fff3d3` | `#7a4f00` |

Chaque famille : `--v-<f>` (réf.), `-bg`, `-ink`, `-ui` (icône), `-hv` (survol), et une variante sombre (fonds en transparence, encres éclaircies). Les couleurs **d'état** (succès, avertissement, erreur) ne sont jamais prises par un espace.

**Espaces** (jetons `--vx-a` principal, `--vx-b` secondaire, posés par `body[data-kb-module]`) : site azur+turquoise · marketing magenta+violet · analytics émeraude+turquoise · design violet+azur · **tunnels** violet+magenta · **SEO** turquoise+azur · **formations** violet+turquoise. Le préfixe `vx` évite la collision avec `--kv-*` du design system v3.

**Six dégradés, pas un de plus** (texte blanc ≥ 4,5:1 sur chaque teinte pleine, vérifié par test) : `--g-marine` (structure), `--g-lagon` (action principale d'une mise en avant), `--g-aurore` (azur→violet : pédagogie), `--g-nocturne` (violet→marine : création, tunnels ; Titan XXXV a retiré le magenta), `--g-seve` (vert→turquoise : mesures), `--g-nuit-or` (marine + lumière dorée : accueil). Usage : une mise en avant par écran, le bouton principal d'un état vide ou d'un bandeau, la vignette d'une formation sans image, la valeur d'une barre de progression. Jamais sur les champs, tableaux et boutons de formulaire.

**Surfaces** : neutre (`--surface`), teintée (`--s-tint`, 6 % de l'accent), survol (`--s-hover`), active (`--s-active`), liseré (`--s-edge`), mise en avant (`.v-feature`, dégradé). Les fonds teintés sont des mélanges (`color-mix`) : ils suivent l'espace et le thème.

**Icônes** : navigation = inchangée (compactes) ; cartes = pastille `.v-ico` (36 px, `is-sm` 28, `is-lg` 52) teintée par fonction ; illustratives = scènes SVG. Une seule famille de tracés (`src/utils/icons.js`).

**Illustrations** : même moteur et même grammaire (cartes superposées, barre marine, étincelle dorée) ; les formes « bleues » prennent un **dégradé à deux tons de l'espace** (sprite SVG `#vx-g`, repli bleu uni si absent). Trois scènes ajoutées : `formations` (lecteur + parcours + toque), `tunnels` (entonnoir en trois couches), `succes` (anneau validé). Aucune image externe : aucun droit à vérifier, 1,2 à 2 Ko par scène.

**Mouvement** (aucune bibliothèque) : entrée des états vides et des indicateurs (opacité + 6 px, 260 ms, une fois), barres de graphique qui se déploient (520 ms, `transform`), valeur de progression en dégradé (transition `width` existante), **un seul** flottement continu (3 px, 7 s, scène d'accueil). Tout est sous `prefers-reduced-motion: no-preference` et coupé par les modes « lite » et « off » de `kb-motion.js`. Aucune propriété de mise en page animée (test).

## 3. Livré (paliers C à F)

- **Jetons** : `kola-vivid.css` §1-3 (clair, sombre, espaces).
- **Composants partagés** : indicateurs `.mk-kpi` (liseré et icône de fonction, survol, sélection) ; `.v-ico` ; `.v-feature` ; états vides `.mk-empty` / `.mk-empty-split` / `.empty-state` (halo de l'espace, scène agrandie, bouton principal en dégradé) ; bandeau d'accueil du site `.kx-welcome` (dégradé nuit-or, scène à droite, masquée sous 720 px) ; barres de progression et de graphique.
- **Modules** : tableau de bord marketing (6 indicateurs, une fonction chacun : audience azur, croissance émeraude, campagnes magenta, lecture turquoise, rebonds ambre, désinscriptions neutre) ; accueil du site ; Mes sites ; tunnels (scène dédiée, espace violet+magenta) ; espace élève (« Mes formations », « Mes certificats », catalogue sans résultat : scènes ; vignettes sans image : dégradé aurore).
- **Correction de cohérence** : les écrans Site Web hors CMS (`sites`, `site-web`, `sitedash`, `landing`, `pagetests`, `commentaires`, `corbeille`, `redirections`, `utilisateurs`, `outils`) prennent l'accent **site** (azur/turquoise) et non plus marketing.
- **Refactoring minimal** : la palette des scènes (`.kx-art …`) sort de `kola-compose.css` vers `kola-art.css` pour être partagée avec l'espace élève sans embarquer 52 Ko.

## 4. Règles pour les développements futurs
1. Une couleur vient d'une famille `--v-*` ; jamais d'hexadécimal dans une vue ou une feuille de page.
2. Un nouvel espace = une ligne `body[data-kb-module="…"]` dans `kola-vivid.css` + le module dans `partials/top.ejs`.
3. Un dégradé = un des six ; une mise en avant par écran.
4. Texte sur fond teinté : `--v-<f>-ink` ; sur dégradé : `--v-on-grad`. La couleur n'est jamais le seul signal (libellé, icône ou forme l'accompagnent).
5. Mouvement : sous `@media (prefers-reduced-motion: no-preference)` et `html:not([data-kb-motion="lite"]):not([data-kb-motion="off"])`.
6. Une illustration par grand écran ou état vide ; jamais dans un tableau dense, un formulaire ou un éditeur.

## 5. Limites honnêtes
- Application **ciblée** (tableau de bord marketing, accueil du site, états vides, tunnels, espace élève) : les ~80 écrans à états vides héritent du nouveau traitement par la feuille, mais seuls ceux listés ci-dessus ont été vérifiés visuellement (captures Chrome, clair et sombre, 1360 et 390 px).
- Indicateurs d'autres tableaux de bord (`.kx-kpi`, `.mk-stat`) : pas encore teintés par fonction.
- Espace formateur (`dash-body`, `dashboard.css`) : non modifié ; thèmes de sites créés (`marketing-themes.css`) : non modifiés.
- Pas de nouvelle illustration pour SEO, intégrations, première page ou formulaires (scènes existantes conservées).
- Performance : +18 Ko de CSS (non compressé), aucun JavaScript, un sprite SVG de 0,3 Ko ; mesure de rendu (LCP, GPU) non réalisée.
