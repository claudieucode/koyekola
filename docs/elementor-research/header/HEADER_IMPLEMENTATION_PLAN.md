# HEADER — Plan d'implémentation par lots

Date : 2026-11-07. Branche de travail : `header-builder-elementor` (créée depuis `themes-extension5-phase0`).
Principe : lots **ordonnés par dépendance**, chacun livré **implémenté + testé + rendu éditeur identique au rendu public** (règle déjà utilisée dans `docs/ELEMENTOR_IMPLEMENTATION_ROADMAP.md`). Aucun lot n'est déclaré terminé sans preuve dans `HEADER_FEATURE_MATRIX.md`.
Les écarts traités sont ceux de `HEADER_GAP_ANALYSIS.md` (G-xx). Architecture : `15_KOLAKISA_HEADER_ARCHITECTURE.md`.

## Prérequis à chaque lot
1. Lire `docs/KOLAKISA_DESIGN_CHARTE.md`, `KOLAKISA_MOTION.md`, `KOLAKISA_WIDGET_STYLE_ARCHITECTURE.md` (un seul chemin `styleSet`).
2. Aucune migration destructive. Colonnes/clés ajoutées avec valeurs par défaut ; lecture de l'ancien format conservée.
3. Tests avant/après : `theme-builder-*`, `editeur-*`, `widgets-*`, `apparence-menus*`. Les tests de navigateur exigent `npm install --no-save playwright-core` (déjà utilisé dans ce dépôt).
4. Base de référence connue : 2 échecs préexistants sans rapport avec les en-têtes (`theme-builder-apercu-vignette`, `theme-builder-catalogue-direct-navigateur`) — à ne pas confondre avec une régression.

## Lots

### L0 — Fondation (G-01, G-02)
- `section.header` validé dans `nodes.js` ; lecteur unique (remplace `partMode` + logique de `_sections.ejs`) ; lecture de l'ancien `headerFx`/position du premier enfant.
- Panneau « En-tête » minimal dans l'éditeur (position, décalage, appareils concernés, seuil, rétrécissement).
- **Acceptation** : les 6 tests `theme-builder-en-tete-collant-public` passent à l'identique ; un en-tête ancien rend pareil ; réglage → enregistrement → rechargement → rendu public vérifié en navigateur.

### L1 — États et comportements (G-03 → G-07)
- Runtime `public/js/kw-header.js` (seuil, `is-scrolled`/`is-hidden`, `--kw-header-h`, espaceur anti-CLS, `prefers-reduced-motion`).
- État de style `scrolled` (et `menuOpen`) dans la grammaire ; CSS généré par écran.
- Masquage en descendant / réapparition ; logo par état.
- **Acceptation** : CLS mesuré < 0,1 ; pas de tremblement ; focus clavier révèle l'en-tête masqué ; isolation des médias par site.

### L2 — Responsive par élément (G-08)
- `order` par écran, rangées visibles par appareil ; prévisualisation des trois écrans.
- **Acceptation** : test d'héritage (modifier mobile ne change jamais le bureau) ; passage entre points de rupture sans perte.

### L3 — Navigation et tiroir (G-09, G-11)
- Menu à 3 niveaux, icônes/badges/descriptions/images par élément ; clavier ; hamburger → tiroir (`drawer`) avec focus piégé.
- **Acceptation** : tests `apparence-menus*` inchangés ; nouveaux tests clavier/tactile ; tiroir : Échap, retour du focus, verrouillage du défilement.

### L4 — Méga-menu (G-10)
- Composant `megapanel` du site, édité dans l'éditeur existant, rendu serveur ; survol (délai d'intention), clic, tactile ; repli mobile.
- **Acceptation** : ouverture/fermeture, fermeture extérieure, Échap, navigation clavier ; sécurité (aucun script) ; isolation (un panneau d'un autre site est introuvable).

### L5 — Interactions (G-12, G-13, G-17)
- Recherche plein écran + suggestions ; tiroir panier ; menu compte ; barre d'annonce/horaires/contact par composition.
- **Acceptation** : données réelles (jamais simulées) ; panier vide ; invité/membre ; limites de débit ; isolation.

### L6 — Conditions étendues (G-14)
- Condition « visiteur » (invité/membre) et date, **après vérification du cache de rendu** (risque G-14).
- **Acceptation** : pas de fuite d'un en-tête membre à un invité via le cache ; tests de priorité inchangés.

### L7 — Ergonomie de l'éditeur (G-15, G-16)
- Calques orientés rangées/zones ; bascule d'état sur le canevas (haut / défilé / menu ouvert) ; vignettes enrichies.

### L8 — Qualité transversale (G-18, G-19, G-21, G-22)
- Audit d'accessibilité (clavier, lecteur d'écran, contrastes), sécurité des attributs, performance, scénarios 2–3 sites, correction des documents périmés, non-régression complète.

### L9 — Audit final, commit, push, déploiement
- `HEADER_FINAL_AUDIT.md` avec preuves ; `npm test` complet ; contrôle de sécurité ; commit ; push ; déploiement selon le workflow du projet (hPanel : manuel côté utilisateur) ; tests de fumée sur le site publié.

## Ordre et dépendances
```
L0 ─► L1 ─► L2
 │      └──► L3 ─► L4
 │             └──► L5
 └──► L6 (indépendant, après vérification du cache)
L1..L5 ─► L7 ─► L8 ─► L9
```

## Estimation honnête
Chaque lot représente un travail substantiel (grammaire, éditeur, rendu, runtime, tests navigateur). L0–L1 sont la base de tout le reste. Il ne serait pas sérieux de promettre l'ensemble en une seule session : l'avancement est suivi dans la matrice, ligne par ligne.
