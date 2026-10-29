# TITAN XX — Éditeur d'articles Kolakisa : fluidité, performances et mouvement

Branche `feat/editeur-fluidite-titan-xx` (depuis `origin/main` 67134ee5). Source : `src/editor/blog-editor.js`, `public/css/blog-editor.css`, bundle `public/js/blog-editor.js` (`npm run build:editor`).
Banc de mesure : `scripts/perf/mesure-fluidite-editeur.js` (Chrome réel, Playwright). Mesures brutes : `mesures-avant.json`, `mesures-apres.json`.
Tests : `tests/editeur-fluidite-navigateur.test.js`.

## 1. Audit (état de départ)

| Constat | Mesure / preuve | Gravité |
|---|---|---|
| `changed()` appelait `localDraft.write()` à **chaque frappe** : `editor.getHTML()` (≈ 8 ms sur 800 blocs) + `JSON.stringify` + écriture `localStorage`, tout en synchrone sur le fil principal | getHTML 8 ms mesuré ; frappe médiane 26,7 ms | Réelle |
| Analyse SEO complète (`getHTML` + `analyze`) lancée 350 ms après chaque pause, sur le fil principal | tâches longues 227 ms et 75 ms après la frappe | Réelle |
| Aucune animation sur les fenêtres, le panneau d'insertion, les popovers ; fenêtre retirée du DOM instantanément | `animation: none`, `transition: all 0s` | Confort |
| Aucun jeton de mouvement ; durées et courbes codées en dur (`0.2s ease-out`, `120ms`, `0.15s ease`…) | grep, 5 définitions différentes | Cohérence |
| `transition: all` (aperçu de dépôt) et transition sur `width` | grep | Mineure |
| Réduction de mouvement traitée règle par règle, jamais globalement | 9 blocs `prefers-reduced-motion` isolés | Accessibilité |
| Échap sur une fenêtre : retrait brutal sans passer par la fermeture commune | `cancel` → `dlg.remove()` | Mineure |

Points sains, conservés tels quels : `refreshUi` est déjà regroupé par `requestAnimationFrame` et protégé par des clés (`toolbarKey`, `inspectorKey`) ; `refreshLater` est déjà dé-bouncé ; le chargement initial a un CLS réel de ≈ 0,018.
Le « CLS 0,34 » du premier passage était un **artefact du banc** (clic synthétique sur le panneau d'insertion qui pousse le canevas) et non un défaut au chargement.

## 2. Ce qui a été fait

**Performance (cause à la source, pas de masquage)**
- `localDraft` : écriture différée de 600 ms après la dernière frappe (`schedule`), `flush` immédiat sur `visibilitychange` (onglet masqué), `pagehide` et `beforeunload` ; `clear()` annule l'écriture en attente (un brouillon supprimé après enregistrement ne peut pas revenir).
- Analyse SEO : pause de 900 ms puis `requestIdleCallback` (délai max 2,5 s) au lieu de 350 ms sur la frappe.

**Système de mouvement** (`:root` de `blog-editor.css`)
- Jetons : `--kolakisa-motion-fast/menu/menu-out/dialog/dialog-out/panel/toast` (120 / 160 / 110 / 200 / 150 / 220 / 200 ms) et courbes `--kolakisa-ease-standard/enter/exit`. `--bs-ease` (micro-interactions existantes) en dérive.
- Uniquement `transform` et `opacity` ; aucune courbe élastique ; aucun `will-change` ajouté (aucune mesure n'en démontre le besoin).

**Composants**
- Fenêtres : zoom `0,97 → 1` + 4 px, voile qui s'estompe ; sortie `→ 0,98` en 150 ms ; Échap, croix et boutons passent par la même sortie ; focus rendu à l'élément d'origine.
- Popovers et sélecteurs (dont le sélecteur de date) : entrée `0,97 → 1`, sortie courte ; positionnement inchangé (`floating.js` utilise `top/left`).
- Menus d'en-tête : entrée animée (la sortie reste immédiate, voir limites).
- Panneau d'insertion / liste / médias : le contenu entre en translation de 12 px + opacité ; la mise en page n'est pas modifiée.
- Pré-publication et notifications : durées et courbes alignées sur les jetons.
- Micro-interactions : appui `scale(0.98 / 0.96)` sur les boutons, transitions de focus des champs ; aucune ne modifie la mise en page.

**Réduction de mouvement** : jetons à 0 ms, animations neutralisées (fenêtres, popovers, menus, notifications, panneaux, appui), fermeture immédiate côté JS (`reducedMotion()`), fonctionnalités et focus intacts.

## 3. Mesures avant / après (Chrome 150, 800 blocs, machine chargée par d'autres sessions)

| Mesure | Avant | Après |
|---|---|---|
| Frappe, médiane (touche → image suivante) | 26,7 ms | 17,3 ms |
| Frappe, 95e centile | 37,2 ms | 33,9 ms |
| Tâche longue après frappe | 227 ms + 75 ms | 211 ms (reportée après 900 ms de pause, en temps mort) |
| Animation d'ouverture d'une fenêtre | aucune | `kolakisa-dialog-in` 200 ms |
| Animation du panneau d'insertion | aucune | `kolakisa-panel-in` 220 ms |
| Réduction de mouvement | partielle | aucune animation, fermeture immédiate |
| Erreurs de console | 0 | 0 |

Les valeurs absolues dépendent de la machine (charge moyenne ≈ 9 pendant les mesures) ; seule la comparaison avant/après est significative.

## 4. Limites connues et points non traités

- La tâche longue d'analyse SEO (~210 ms sur 800 blocs) existe encore : elle n'a plus lieu pendant la frappe mais elle est synchrone. La lever demande de découper `analyze()` (fichier partagé `src/utils/seoAnalyzer`) ou de la déplacer dans un Worker : chantier séparé.
- Le canevas se décale de 236 px et se rétrécit de 122 px à l'ouverture du panneau d'insertion : c'est la mise en page docked d'origine (comme Gutenberg) ; seul le contenu du panneau est animé.
- Les menus d'en-tête (`.wp-menu`, bascule `hidden`) et la fenêtre « Révisions » (sa propre fermeture) n'ont pas d'animation de sortie ; seule l'entrée est animée.
- 60 images/s n'a pas été mesuré image par image : la cible est celle d'un matériel courant, non garantie sur tous les appareils.
- Pas de bascule clair/sombre testée (non présente dans l'éditeur).
