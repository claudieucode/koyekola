# TITAN XXXV — Plus aucun rose dans l'interface Kolakisa

## Source réelle du rose
Un seul mécanisme, pas des dizaines de classes locales :
1. **`public/css/kola-vivid.css`** — la famille de teintes « magenta » (`--v-magn*`, clair et sombre) et le dégradé `--g-orchidee` (violet → magenta).
2. Le module **Marketing** (`body[data-kb-module="marketing"]`) prenait cette famille comme *accent d'espace* : `--vx-a` alimente `--s-tint`, `--s-edge`, `--s-hover`, `--s-active`
   — c'est pourquoi **toutes** les cartes teintées du module (les six cartes de l'Instantané, mais aussi listes, segments, formulaires…) devenaient rose pâle.
3. **`public/css/kola-brand.css`** — même accent codé en dur (`#b83280`, `#e66aa8`, `#ee7ab6`) pour le repère de titre, les onglets, les graphiques (`--kb-data-2`), le menu en thème sombre et les illustrations.
4. Le tunnel (`funnel`) utilisait le magenta en second ton et le dégradé orchidée.
5. Éléments ponctuels : aides de conception du constructeur de pages (guides intelligents `#db2777`, grille `rgba(236,72,153)`, colonnes `rgba(255,64,129)`, rouge-rose `#e11d48`),
   couleur des balises dans l'éditeur de code (`#b4235b`), repli bordeaux `#7a1f3d` (bannière de site), deux couleurs d'avatar, et des fonds d'erreur « rouge pâle » trop rosés (`#fdeaec`, `#fbe7e8`, `#fff1f2`, `#f6e1e3`).

## Remplacements retenus
| Avant | Après | Raison |
|---|---|---|
| famille magenta (`--v-magn*`) | famille **marine** (`--v-marine*` : `#0b2239` / fond `#e9eef4`; sombre `#8fb4d6`) | le marine est la couleur dominante de la marque |
| accent Marketing magenta | **azur `#0277b6`** (ton 2 : marine clair), dégradé `--g-marine` | palette de référence ; Marketing reste distinct du module Site (marine lumière `#1d5f8f`) |
| tunnel : violet + magenta, `--g-orchidee` | violet + azur, `--g-nocturne` (violet → marine) | le violet existant (parcours/design) est conservé, pas de rose déguisé |
| série 2 des graphiques `#b83280` | `#0b2239` (marine) | distincte du bleu `#1d5f8f` ; le jeton est unique, tous les graphiques suivent |
| guides intelligents / grille du constructeur | ambre `#d97706` / azur ; distances et annotations en rouge franc `#dc2626` | contraste sur le canevas conservé, sans rose |
| fonds d'erreur rosés | `#fdecea`, `#fbe9e7`, `#fef1ef`, `#f8e3e0` (teinte ≈ 5°, rouge pâle) | les alertes d'erreur gardent leur sens rouge |

### Cartes de l'Instantané marketing (composant partagé `.mk-kpi`)
Fond **blanc** (`--surface`), bordure fine `--border`, filet supérieur 3 px à la teinte *fonctionnelle*, pastille d'icône discrète, valeur en gros. Plus de fond teinté.
Teintes par fonction, plus par hasard : Contacts = azur (audience), Nouveaux contacts = vert (croissance), Campagnes lancées = marine (volume d'envois),
Taux de clic = turquoise (lecture), Rebonds = ambre (avertissement de réputation), Désinscriptions = neutre.
Le composant est corrigé une fois (`kola-vivid.css`), toutes les pages qui l'utilisent suivent.

## Exceptions documentées (non traitées volontairement)
- **Contenu des sites des clients** : bibliothèque de thèmes (`src/marketing/themes/…`), palettes de style (`stylePalettes.js`, « Bordeaux », « Violet »), préréglages du constructeur (`page-builder-theme.js`), couleur par défaut du sélecteur libre (`site-settings.js`). Ce sont des choix offerts pour les sites publiés, pas l'interface Kolakisa.
- **Surligneur « Rose »** des éditeurs d'articles et de cours : choix de l'auteur ; des articles enregistrés utilisent cette marque.
- **Marque externe** : couleur officielle d'Instagram dans les blocs de réseaux sociaux.
- Faux positif : `#8239` dans `_node.ejs` (fragment d'attribut, pas une couleur).
Ces exceptions sont listées dans `scripts/design/audit-rose.js` ; ajouter un fichier à la liste exige une justification ici.

## Vérifications
- `node scripts/design/audit-rose.js [--detail]` : audit **par teinte** (hex, rgb, hsl, mots-clés, jetons) sur `public/css`, `views`, `src`, `public/js` — 0 occurrence hors exceptions.
- `node scripts/design/controle-rose-navigateur.js [--captures dossier]` : Chrome réel, 22 pages × clair/sombre, couleurs **calculées** de chaque élément visible (styles inline et valeurs dynamiques compris). Avant : 21 éléments rosés sur `/marketing` seul ; après : 0 sur les 44 chargements. Le détecteur a été validé sur l'ancien code (il trouve bien le rose).
- Test de non-régression : `tests/anti-rose.test.js`.
