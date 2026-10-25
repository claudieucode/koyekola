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
Durées 120–180 ms, courbe `cubic-bezier(.22,.8,.3,1)`. On n'anime que la couleur, l'opacité et `transform` : jamais `width`, `height`, `top`, `left`, `margin`, `padding` ni `transition: all`. Tout mouvement non déclenché par l'utilisateur est interdit hors état vide. `prefers-reduced-motion` coupe les animations. Aucun scintillement au changement de thème (le thème est résolu avant le premier affichage).

## 9. Responsive
Points de rupture : 1300 · 1100 · 900 · 640 px. Aucun défilement horizontal de page. Les tableaux denses se replient en lignes de registre (≥ 640 px) puis en cartes (< 640 px) en gardant toutes les données.

## 10. Accessibilité
Focus clavier toujours visible (anneau 2 px bleu décalé de 2 px) ; noms accessibles pour toute commande ; cibles de 44 px au tactile ; contrastes §2 ; un seul `h1` par page.

## 11. Illustrations
Une illustration par écran de présentation ou d'état vide, jamais dans un écran de travail. SVG originaux en ligne (`illu("nom")`, 38 scènes, `partials/empty-art.ejs`), couleurs prises dans les jetons, rendu clair et sombre. Aucune image lourde ni bibliothèque supplémentaire.

## 12. Validation visuelle obligatoire avant livraison
`scripts/audit-interface.js` (géométrie, 4 largeurs) · `scripts/audit-qualite.js` (contrastes clair/sombre, noms, focus, dialogues, animations) · `scripts/audit-editeurs.js` (éditeurs) · `scripts/audit-captures.js` (captures, `THEME=dark`). Puis les tests `tests/*navigateur*` concernés. Ne jamais déclarer un écran vérifié sans capture ni mesure.
