# Kolakisa — architecture des formats de mise en page et de l'inspecteur de qualité

## Composants réutilisés
Canevas / `viewModel` / `pageCss`, `normalizeTheme` (thème versionné), `saveDraft` (point d'entrée unique des écritures), historique `change()`, SEO `webPages.analyze`, IA Kolakisa (`studio.validate`), `pbDirect`/inspecteur existants.

## Nouveaux composants (strict nécessaire)
1. `src/marketing/pages/layoutFormat.js` — modèle des formats, CSS, propriétés protégées, contrôle de verrou, application avec levée des conflits.
2. `public/js/page-builder-quality.js` — moteur de contrôles sur le DOM rendu + rapport.
3. Ponts dans `page-builder.js` (section « Format » des réglages de la page, bandeau d'inspecteur, garde `refuseFormat`, `applyStyles`, compteur de version du document).

## Persistance : `theme.layout`
`{ mode: "guided", format, maxWidth, gutter, locked }` — **absent = conception libre**. Niveau « page » : la configuration est déjà dans le thème (enregistré, publié, versionné, dupliqué) ; aucune migration, aucun système parallèle. Niveau site : non implémenté (voir limites).

## Formats
`compact` 960 · `standard` 1200 · `large` 1440 · `fluid` (sans plafond) · `custom` (320–2400 px, marges 0–96). Valeurs de départ modifiables ; **pas** des tailles d'écran : largeur fluide `min(100% − 2×marge, max)`. L'aperçu ordinateur/tablette/mobile n'est pas touché.

## Règle CSS émise (pages guidées uniquement)
```
body.lp-body .lp-main { max-width: none; padding-left: 0; padding-right: 0; }
:where(.kw-layout) > .kw-node, :where(.lp-main) > .lp-section { width: min(calc(100% - 2g), max); margin-inline: auto; box-sizing: border-box; }
```
`:where()` = spécificité nulle : le réglage d'un auteur l'emporte quand le format est déverrouillé ; verrouillé, ce réglage est interdit.

## Verrouillage
Propriétés protégées (éléments de **premier niveau** des sections, tous écrans et états) : `width, minWidth, maxWidth, marginLeft, marginRight`. Protégé aussi : le format lui-même. Libres : textes, images, couleurs, widgets, sections, éléments imbriqués, toutes les autres propriétés.
- Moteur : `layoutFormat.checkLocked(avant, après)` dans `saveDraft` et dans `studio.validate` (IA). L'état « avant » fait foi : on ne peut pas se déverrouiller et modifier une propriété protégée dans la même requête.
- Interface : garde `refuseFormat` (message clair), bandeau « Format verrouillé » dans l'inspecteur, champs du format désactivés.
- Déverrouillage : action explicite, enregistrée immédiatement. L'IA ne déverrouille jamais.
- Pages existantes : jamais converties ; application d'un format verrouillé avec des largeurs existantes → confirmation puis remise à zéro annulable.

## Inspecteur de qualité
Contrôles du **DOM rendu** (pas d'heuristique sur des valeurs brutes) reliés aux éléments par `data-node-id`. Catégories : HTML/CSS (structure), Accessibilité (WCAG 2.2 : alt, noms accessibles, libellés, hiérarchie, contraste 1.4.3, taille de cible 2.5.8, clavier), Responsive (débordement, largeur fixe effective par écran), SEO (moteur du serveur, audit complet seulement), Performance (images, CLS estimé ; CLS/LCP observés signalés « non représentatifs »), Qualité générale (sections vides, réglages contradictoires).
- États : jamais lancé · en cours · partiel (écran affiché) · complet (3 écrans + SEO) · obsolète (le document a changé) · impossible.
- Coût : contrôle local seul en continu (écran affiché), après 1,1 s de calme, en temps mort ; arrêt possible ; audit complet manuel ; cache par version du document.
- Corrections : modifications natives annulables ; relecture du rendu ; « corrigé » seulement si le problème a disparu ; sinon message « le problème persiste ».
- Ignorés : mémorisés par page dans le navigateur.
- Publication : un message non bloquant signale les problèmes critiques.
