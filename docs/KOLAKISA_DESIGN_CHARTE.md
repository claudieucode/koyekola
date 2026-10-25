# KOLAKISA — Charte de design permanente (référence unique)

Ce document est la règle à respecter pour toute intervention sur l'interface. Il complète `docs/KOLAKISA_ADMIN_DESIGN_SYSTEM.md` (historique des paliers v2, v3 et « Registre marine »)
et s'appuie sur la couche `public/css/kola-brand.css` (administration) et `public/css/kola-brand-editors.css` (Page Builder, éditeur d'articles).
Le registre de suivi par écran est `docs/KOLAKISA_DESIGN_INVENTAIRE.md`.

## 1. Identité
Bleu marine maître ; apparence professionnelle, minimaliste, précise. Une seule couleur d'action (bleu). Aucun dégradé décoratif, aucun effet lumineux, aucune ombre pour « faire riche ».

## 2. Couleurs et rôles (jetons `--kb-*`, clair / sombre)
| Jeton | Clair | Sombre | Rôle |
|---|---|---|---|
| `--kb-navy` | `#0b2a40` | `#e8eef7` | titres, chiffres, filets d'accent, structure |
| `--kb-navy-deep` | `#06192a` | — | menus et barre du haut |
| `--kb-action` / `--k-accent-solid` | `#0277b6` | `#1c78bd` | boutons principaux, liens, focus, sélection |
| `--kb-live` | `#0e7490` | `#5fc4d8` | en ligne, actif |
| `--kb-draft` | `#8a5a00` sur `#fff4d6` | `#f1c766` sur ambre translucide | brouillon, à surveiller |
| `--kb-alert` | `#c4161f` | `#f06670` | suppression, erreur |
| `--kb-canvas` | `#f4f8fb` | `#0d1524` | surface de travail |
| `--kb-rule` | `#dde6ed` | `#243349` | filet unique (bordures, séparateurs) |
| `--kb-ink` / `-2` / `-3` | `#0f1f33` / `#44596b` / `#5b6b7c` | `#e6edf6` / `#b3c1d3` / `#8fa1b6` | texte, texte secondaire, aide |

Règles : le sens d'une teinte ne change jamais d'un module à l'autre. Tout texte respecte 4,5:1 (3:1 pour les grands textes) dans **les deux modes** : le mode sombre se conçoit et se vérifie séparément.
**Piège connu** : `background: var(--primary); color: #fff` devient du blanc sur fond clair en mode sombre, et un fond `#fff` écrit en dur avec le texte du thème devient du texte clair sur blanc.
Utiliser `--k-accent-solid` pour les remplissages pleins et `--surface` pour les surfaces ; jamais `#fff` en dur.

### 2 bis. Direction chromatique « Marine & pierres fines » (accents par espace de travail)
Le bleu marine reste la structure de toutes les pages (menus, titres, filets, chiffres). Chaque espace de travail ajoute **un seul** accent, posé par `partials/top.ejs` sur `<body data-kb-module="…">` (jetons `--kb-mod`, `--kb-mod-ink`, `--kb-mod-ui` dans `kola-brand.css`).
| Espace | Pages concernées (clé `active`) | Remplissage / repères | Texte (clair → sombre) | Icône sur menu marine |
|---|---|---|---|---|
| `site` — marine lumière | Site Web, médias, utilisateurs, SEO, outils, réglages | `#1d5f8f` (sombre `#4aa3dc`) | `#1d5f8f` → `#7dbbea` | bleu `#5cbdf5` (référence) |
| `marketing` — baie | accueil Marketing, audience, campagnes, SMS, automatisations, tunnels, intégrations | `#b83280` (sombre `#e66aa8`) | `#a02a6f` → `#f08cc0` | `#ee7ab6` |
| `analytics` — émeraude | statistiques, revenus, comparaisons | `#0b8a63` (sombre `#34c79a`) | `#087554` → `#6fdcb4` | `#4fd8ad` |
| `design` — violet | Apparence, thèmes, styles, composants | `#7048c8` (sombre `#9b7ae8`) | `#6439bb` → `#b7a0f2` | `#b39af2` |
**Où l'accent apparaît, et seulement là** : liseré vertical devant le titre de page, icône et liseré de l'entrée active du menu, soulignement de l'onglet courant, barres des graphiques, étiquette de rubrique (`kx-eyebrow`), teinte des illustrations (`--a-blue`, `--a-sky`, `--a-ice`).
**Ce qui ne change jamais d'un espace à l'autre** : boutons d'action et focus (bleu), bouton « Créer » et pastille de marque (bleu), couleurs d'état (sarcelle = en ligne, ambre = brouillon, rouge = erreur, vert = succès), surfaces, filets, texte.
**Sémantique** : `--kb-ok` (succès), `--kb-warn` (ambre), `--kb-err` (rouge), `--kb-info` (bleu d'action). **Données** : six teintes distinctes dans cet ordre, `--kb-data-1..6` = marine lumière `#1d5f8f`, baie `#b83280`, émeraude `#0b8a63`, violet `#7048c8`, or `#c98a00`, lagon `#0e7490`. **Neutres** : `--kb-canvas`, `--kb-rule`, `--kb-ink*`, `--kb-navy-soft` (`#e4edf4`) et `--kb-navy-mid` (`#164a6e`, états sélectionnés).
**À éviter** : un accent d'espace sur un bouton, un lien ou un état ; deux accents d'espace sur un même écran ; un texte d'accent sous 4,5:1 (utiliser `--kb-mod-ink`, jamais `--kb-mod`) ; une information transmise par la seule couleur ; un dégradé décoratif.
**Ajouter un espace** : ajouter ses trois jetons (clair + sombre) dans `kola-brand.css`, l'ajouter à la fonction `kbModule` de `top.ejs`, ses teintes d'illustration, puis relancer `scripts/audit-qualite.js`.

## 3. Typographie
Bricolage Grotesque : titres, chiffres clés, noms de sites. Figtree : interface. Titre de page `clamp(1.7rem, 1.3rem + 1.1vw, 2.15rem)`, interlettrage −0,025 em, graisse 700. Titre de panneau 1,05–1,25 rem. Texte 0,875–0,95 rem ; aide 0,8 rem au plus petit.
Lignes de 62 caractères au plus pour les textes d'aide. Chiffres tabulaires pour toute donnée. **Pas de capitales espacées** : étiquettes en minuscules grasses (0,78–0,82 rem, graisse 650) ; seule exception, le sigle de marque.

## 4. Espacement, rayons, filets
Échelle : 4 · 8 · 12 · 16 · 24 · 40 px. Rayons : 8 px (champs, boutons) · 12 px (panneaux, tableaux) · 999 px (pastilles). Un seul filet (`--kb-rule`), pas d'ombre sur les panneaux. Marge de page 24 px ; intervalle entre blocs 16–24 px.

## 5. Composants (dimensions)
- **Bouton** : hauteur 36 px (44 px sur écran tactile ≤ 640 px) ; padding 0 16 px ; icône 16 px à 8 px du libellé ; largeur = contenu (`width: fit-content`), jamais étiré sauf `.btn-block`, barre d'enregistrement mobile et boutons d'accordéon. Variantes : primaire (bleu plein), contour (blanc, filet), discret (`btn-ghost`), destructif (contour rouge, plein au survol).
- **Champ / liste / bouton d'une même rangée** : même hauteur (36 px, `--kx-ctl-h`) ; cases à cocher exclues.
- **Panneau** : filet 1 px, rayon 12, pas d'ombre. **Bande de chiffres** : un seul conteneur à filets (`.mk-stats`), pas de cartes identiques.
- **Tableau** : en-têtes en minuscules grasses, chiffres alignés, survol discret. **Pastille d'état** : sens fixe des teintes (§2).
- **Onglets** : soulignement marine de 3 px ; effectifs discrets qui héritent la couleur de l'onglet.
- **État vide** : consigne claire + action ; illustration réduite (≤ 132 px) et pertinente pour la page.

## 6. Panneaux, menus, boîtes de dialogue
Largeur de dialogue 549 px (formulaire) ; 980 px pour les tableaux larges ; jamais plus de 92 % de la hauteur de la fenêtre ; défilement interne. Titre à gauche, fermeture à droite, actions alignées à droite avec l'action principale en dernier.
Le premier champ reçoit le focus à l'ouverture (`focusFirst`, `public/js/mk/shell.js`) ; Échap et clic sur le fond ferment ; le focus revient au déclencheur. Les menus s'ouvrent sans être coupés par les bords de la fenêtre.
Panneaux latéraux : largeurs fixes par type, états actif / survolé / sélectionné / désactivé distincts, aucune translation de la zone de travail à l'ouverture ou à la fermeture.

## 7. Infobulles et aide
Système existant : `public/js/kola-tips-data.js` (registre) et `public/js/kola-pages.js` (attribut `data-tip`). Règles : une icône sans libellé a toujours une infobulle (`data-tip`) ; texte court, sans répéter le libellé ; au survol et au focus clavier ; accès tactile sans dépendre du survol ; jamais d'empilement. Les procédures longues vont dans un texte d'aide ou un lien de documentation.

## 8. Animation
Référence détaillée : `docs/KOLAKISA_MOTION.md` (jetons, trois niveaux adaptatifs, glisser-déposer).
Durées 120–180 ms, courbe `cubic-bezier(.22,.8,.3,1)`. On n'anime que la couleur, l'opacité et `transform` : jamais `width`, `height`, `top`, `left`, `margin`, `padding` ni `transition: all`. Tout mouvement non déclenché par l'utilisateur est interdit hors état vide. `prefers-reduced-motion` coupe les animations. Aucun scintillement au changement de thème (le thème est résolu avant le premier affichage).

## 9. Responsive
Référence détaillée : `docs/KOLAKISA_RESPONSIVE.md`.
Points de rupture : 1300 · 1100 · 900 · 640 px. Aucun défilement horizontal de page. Les tableaux denses se replient en lignes de registre (≥ 640 px) puis en cartes (< 640 px) en gardant toutes les données.

## 10. Accessibilité
Focus clavier toujours visible (anneau 2 px bleu décalé de 2 px) ; noms accessibles pour toute commande ; cibles de 44 px au tactile ; contrastes §2 ; un seul `h1` par page.

## 11. Illustrations
Une illustration par écran de présentation ou d'état vide, jamais dans un écran de travail. SVG originaux en ligne (`illu("nom")`, 38 scènes, `partials/empty-art.ejs`), couleurs prises dans les jetons, rendu clair et sombre. Aucune image lourde ni bibliothèque supplémentaire.

## 12. Performance (règles et mesures)
- **Mesurer avant d'optimiser** : `scripts/audit-performance.js` (poids par type, requêtes, DCL / load / FCP / LCP / CLS, tâches longues, durées de script, de mise en page et de recalcul de style, latence d'interactions) et `scripts/audit-css-usage.js` (part de CSS utilisée). Les chiffres d'une machine chargée se comparent entre eux, ils ne sont pas des temps de production.
- **Référence mesurée (24/10/2026)** : écran d'administration 220–280 Ko transférés (CSS 127–165 Ko, polices 61 Ko, JavaScript 24–36 Ko exécuté en 10–35 ms) ; interactions 11–25 ms ; décalage de mise en page ≤ 0,02. Le coût dominant est le CSS qui bloque l'affichage, pas le JavaScript.
- **Images** : jamais une image plus grande que son emplacement. Les cartes de la galerie de thèmes utilisent `<clé>-card.webp` (480×300) et `<clé>-phone.webp` (128×277), générées par `scripts/themes-thumbs.js` ; les aperçus complets ne servent qu'à la page d'aperçu.
- **Listes longues** : ne pas utiliser `content-visibility: auto` sur des cartes à images différées (essayé : les images hors écran se chargent plus tard, cartes vides au défilement rapide, test de la galerie en échec) ; pas de `contain: layout` sur les panneaux (il casse les menus et fenêtres positionnés à l'intérieur).
- **Polices** préchargées (`partials/font-preload.ejs`) ; thème résolu avant le premier affichage ; aucune propriété de mise en page animée.

## 13. Validation visuelle obligatoire avant livraison
`scripts/audit-interface.js` (géométrie, 4 largeurs) · `scripts/audit-qualite.js` (contrastes clair/sombre, noms, focus, dialogues, animations) · `scripts/audit-editeurs.js` (éditeurs) · `scripts/audit-captures.js` (captures, `THEME=dark`). Puis les tests `tests/*navigateur*` concernés. Ne jamais déclarer un écran vérifié sans capture ni mesure.

## 7. Règles ajoutées par la passe de finition (design-finition-01)
- **Cibles tactiles** : `@media (pointer: coarse)` donne 44 px de côté à tout ce qui se touche. Les gabarits `.mk-body` sont couverts par `kola-stable.css` ; les éditeurs qui ne chargent pas ce fichier (articles `.wp-body`, personnalisateur `.kwc-*`) portent leur propre bloc à la fin de leur feuille. Tout nouveau contrôle d'un éditeur doit y être ajouté. Les liens dans une phrase en sont exemptés.
- **Anneau de focus** : un champ enveloppé dans un libellé qui dessine l'anneau (`:focus-within`) doit avoir un anneau d'au moins 2 px (barre globale).
- **Ombres** : jamais `rgba(0,0,0,…)` ; utiliser `rgba(11, 42, 64, …)` (testé par `refonte-design.test.js`).
- **Écarts connus, non traités** : `refonte-design.test.js` signale des classes sans style (dont `mk-crumb`, `col-site`, `md-know`, `pl-field`, `mk-px-*`) venues d'autres modules ; `grille-interface.test.js` échoue sur les marges.
