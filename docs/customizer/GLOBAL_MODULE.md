# Personnaliser › Global

Quatre sous-catégories : **Typographie**, **Couleurs**, **Conteneur**, **Boutons**. Chaque réglage agit réellement sur le site : aperçu en direct (sans rechargement), brouillon enregistré automatiquement, publication, isolation par site.

## 1. Architecture

```
Panneau (public/js/personnaliser/global.js)          Aperçu (iframe, même origine)
   │  K.api.set(« tokens.global.<section> », objet)         ▲ applyAssets : remplace les feuilles
   ▼                                                        │
settings.js ── POST /marketing/site-web/styles/rendu ──► siteStyles.previewFor ──► tokens (en mémoire) ──► themeCss / appearance ──► globalCss
            ── POST …/styles/brouillon (auto, 1,2 s)    ──► cms_customizer_drafts (par site)
            ── POST …/styles/publier                    ──► mk_sites.tokens (site) | appearance_configs (principal)
```

| Rôle | Fichier |
|---|---|
| Modèle de données, validation, génération du CSS | `src/marketing/pages/globalStyles.js` |
| Intégration aux jetons du site | `src/marketing/pages/tokens.js` (`tokens.global`, enregistré seulement s'il diffère des valeurs d'origine) |
| CSS d'un site / du site principal | `src/marketing/pages/themeCss.js` · `src/services/appearance.js` |
| Moteur de brouillon, aperçu, publication (commun avec Apparence → Styles) | `src/services/siteStyles.js` (4 réglages `tokens.global.*`) |
| Données de l'écran (polices, pré-réglages, valeurs d'origine) | `src/marketing/web/personnaliser.js` (`boot.global` = `globalStyles.uiSpec` + `siteStyles.liveBase`) |
| Écrans et contrôles | `public/js/personnaliser/global.js`, `public/css/personnaliser-global.css` |

**Aucun second système de publication** : Global réutilise le brouillon, l'aperçu et la publication du moteur de styles. Une valeur **vide** (`null`, `""`) = « héritée du thème » : aucune règle n'est écrite et le design d'origine reste identique.

## 2. Schéma de stockage (`tokens.global`, par site)

Chaque site stocke ses propres jetons (`mk_sites.tokens`) ; le site principal stocke les siens (`appearance_configs`). Modifier le site A ne lit ni n'écrit le site B.

- **typography** : `preset`, `bodyFont` (famille, unité de taille, taille, graisse, hauteur de ligne, espacement des lettres, espacement des mots, casse, style, décoration, valeurs `tablet` / `mobile`), `headingFont` (famille, graisse), `body` (couleur), `h1…h6` (mêmes champs + couleur), `link` (police, couleur, survol, graisse, soulignement, décoration, transition), `others.{quote,small,caption,list,secondary}`, `readWidth` (caractères), `paragraphMargin`, `underlineLinks`.
- **colors** : `paletteKey`, `palette` (≤ 24 couleurs `{id,name,hex}`), rôles `accent` (principale), `secondary`, `highlight` (accentuation), `complementary`, `link`, `linkHover`, `headings`, `text`, `textSecondary`, `border`, `divider`, `siteBg`, `contentBg` ; `gradients` (≤ 12, 2 à 6 points), `siteBgGradient`, `states.{focus,disabled}`. Valeur d'un rôle : vide, `#rrggbb[aa]`, `transparent`, `p:<id>` (palette), `token:<clé>` (couleur du site), `g:<id>` (dégradé, fonds seulement).
- **container** : `layout` (pleine / encadré / étroit), `style` (ouvert / encadré), `width`, `narrow`, `wide`, `maxWidth`, `padX`, `padY`, `margin`, `sectionGap` (chacun `{d,t,m}` = ordinateur, tablette, mobile), `align`, `overflow`.
- **buttons.primary / secondary** : `preset`, états `normal`, `hover`, `focus`, `active`, `disabled` (texte, fond — dégradé possible —, bordure), `font`, `padding`, `borderWidth`, `radius` (quatre côtés liés ou non, unités px / em / rem), `borderStyle`, `shadow` (aucune/légère/moyenne/forte) ou `shadowCustom` (décalages, flou, diffusion, couleur, transparence), `opacity`, `transition`, `hoverLift`, `hoverScale`, `iconGap`, `align`, `fullWidth`, `width`, `minWidth`, `maxWidth`, `minHeight` (par écran).

Toutes les valeurs sont validées côté serveur (nombres bornés, listes fermées, couleurs par expression régulière, polices connues). Les chevrons sont retirés du CSS généré.

## 3. Variables CSS exposées

Variables du thème (lues par `landing.css`) : `--kw-primary`, `--lp-accent`, `--kw-secondary`, `--kw-accent`, `--kw-complementary`, `--kw-text`, `--kw-muted`, `--kw-background`, `--kw-surface`, `--kw-border-color`, `--kw-divider`, `--kw-font-body`, `--kw-font-heading`, `--kw-body-size|weight|lh`, `--kw-h1…h6-size|weight|lh`, `--kw-radius-button`, `--kw-shadow-button`, `--kw-button-size|weight|height`.

Noms publics (un seul vocabulaire pour les éditeurs et les thèmes), écrits seulement pour les rôles réellement définis : `--site-color-primary`, `-secondary`, `-accent`, `-complementary`, `-text`, `-text-secondary`, `-heading`, `-background`, `-background-alt`, `-border`, `-divider`, `-link`, `-link-hover` ; `--site-gradient-<id>`.

## 4. Priorité des styles

Du plus général au plus local ; le plus local gagne :

1. **Valeurs d'origine du thème** : jetons du site, `landing.css`, paquet de thème.
2. **Réglages Global** (ce module) : variables `--kw-…` (posées avec `!important`, car le moteur les écrit aussi en ligne sur `<body>`) et règles à **faible spécificité** (`:where`, ou `.lp-site :where(…) a` pour les liens).
3. **Réglages d'un composant ou d'une page** (`.kw-n-<id>`, CSS de page) : écrits **après** la feuille Global, donc prioritaires.
4. États (survol, focus, clic, désactivé) et écrans (tablette `max-width:1023px`, mobile `max-width:767px`) à chaque niveau.

Cas particulier documenté : la feuille du thème lit des **variables** pour certains boutons (`.lp-site .lp-btn { border-radius: var(--kw-radius-button) … }`, sélecteur plus fort qu'une règle `:where`). Global pose donc ces variables (rayon, ombre, hauteur, taille et graisse du bouton principal) plutôt qu'une règle concurrente : aucune surenchère de sélecteurs. Les liens sont ciblés par un sélecteur d'une spécificité égale à celle du thème, départagé par l'ordre des feuilles (Global après le thème, avant les éléments locaux).

Conséquence : un composant qui définit explicitement sa couleur, sa taille ou sa largeur la garde ; une valeur Global ne détruit jamais un réglage local.

## 5. Responsive

Tablette et mobile **surchargent** l'ordinateur et ne l'écrasent jamais : leurs valeurs sont écrites dans des `@media` (tablette `(max-width: 1023px)`, mobile `(max-width: 767px)`, comme le Page Builder). Dans le panneau, le sélecteur Ordinateur / Tablette / Mobile du bas détermine quelle valeur est modifiée ; une icône d'appareil signale les réglages concernés. L'aperçu prend la largeur de l'appareil choisi.

## 6. Polices

Les familles viennent des polices du système, de la bibliothèque Kolakisa et des polices importées du site (Apparence → Polices : WOFF, WOFF2, TTF, OTF). Le site ne charge que les familles et variantes réellement utilisées (le CSS `@font-face` est généré à partir des variables effectivement posées). Les graisses proposées : 100 à 900 ; styles : normal / italique.

## 7. Interface

- **Global** : en-tête « Vous personnalisez / Global », quatre lignes avec flèche, retour sans perte (les valeurs sont conservées dans le brouillon commun).
- **Contrôles** : curseurs avec champ numérique, listes, boutons segmentés, interrupteurs, sélecteur de couleur (teinte, saturation, luminosité, transparence, saisie HEX / RGB / RGBA / HSL, copier, coller, palette, dégradés), quatre côtés liés, réinitialisation par réglage et par groupe, valeurs héritées indiquées (« Hérité »).
- **Boutons** : aperçu du bouton dans le panneau (normal / survol), en plus de l'aperçu réel du site.

## 8. Sauvegarde

États : valeur par défaut (héritée) → modifiée (aperçu direct) → enregistrée (brouillon automatique, verrou de révision) → publiée. Erreurs : un réglage refusé par le serveur est signalé et « Publier » reste inactif. Un ancien brouillon est rechargé à l'ouverture. Historique : versions publiées (`cms_customizer_versions`), 40 par site.

## 9. API utilisées

`POST /marketing/site-web/styles/{rendu,brouillon,annuler,publier,restaurer}` (droits `appearance.styles` / `appearance.publish`). Le site vient de l'adresse vérifiée par le serveur (`?site=`).

## 10. Tests

- `tests/personnaliser-global.test.js` : modèle, CSS, aperçu, brouillon, publication, réinitialisation, isolation, site principal.
- `tests/personnaliser-global-extensions.test.js` : unités, éléments annexes, rôles, dégradés, états, conteneur, boutons, sécurité.
- `tests/personnaliser-global-navigateur.test.js` (Chrome réel) : navigation interne, Typographie (H1 / H2 / texte / liens / taille mobile seule), Couleurs (couleur saisie en HSL, palette ajout / renommage / copie / suppression, dégradé en fond), Conteneur (largeur, marges, largeur mobile), Boutons (couleur, rayon, ombre, survol), isolation A / B, éditeur de pages / widgets / Theme Builder accessibles.

## 11. Limites connues

- Les polices ne sont pas importées depuis ce panneau : le lien « Apparence → Polices » ouvre l'écran d'import existant.
- « Espacement entre colonnes » et « Espacement horizontal / vertical » d'un conteneur sont couverts par les marges internes (`padX`, `padY`) et l'espacement entre sections ; il n'existe pas de réglage propre aux colonnes (leur gouttière est définie par le Page Builder).
- Un composant dont la feuille du thème lit directement une variable (boutons) suit Global ; un composant qui écrit une valeur en dur dans sa propre feuille la conserve (priorité locale).
- Les réglages Global ne modifient pas les anciens réglages de couleurs et de polices d'Apparence → Styles : si les deux sont renseignés, Global l'emporte sur les variables qu'il pose.
- Le site principal : typographie, couleurs, conteneur et boutons s'appliquent à ses pages publiques (`main`, `.btn-primary`…), pas aux pages d'administration.
