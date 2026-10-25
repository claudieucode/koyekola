# KOLAKISA — Système de mouvement (référence permanente)

Complète `docs/KOLAKISA_DESIGN_CHARTE.md` §8. Règle absolue : **le mouvement sert l'utilisateur, il ne le retarde jamais**. Aucune action n'attend la fin d'un effet ; aucune fonction n'est retirée pour économiser du coût.

## 1. Vocabulaire (jetons dans `public/css/kola-brand.css`)
| Jeton | Valeur | Usage |
|---|---|---|
| `--kb-dur-fast` | 120 ms | survol, focus, changement de couleur, menus déroulants |
| `--kb-dur` | 180 ms | ouverture d'une fenêtre, d'un panneau, d'un groupe de menu |
| `--kb-dur-slow` | 260 ms | changement de vue (rare) |
| `--kb-ease` | `cubic-bezier(0.22, 0.8, 0.3, 1)` | seule courbe : départ vif, arrivée douce |
Propriétés animées : **couleur, opacité, `transform` / `translate` uniquement**. Jamais `width`, `height`, `top`, `left`, `margin`, `padding`, jamais `transition: all`. Pas de rebond, de rotation décorative ni de parallaxe. Une seule animation d'entrée par élément ; pas d'animations concurrentes.
Entrées existantes : fenêtre (`kb-dialog-in`, opacité + 6 px + échelle 0,985, `--kb-dur`), fond de fenêtre (`kb-fade-in`), menu déroulant (`kb-pop-in`, opacité + `translate` 4 px, `--kb-dur-fast`). `translate` (propriété individuelle) se combine avec le `transform` propre d'un menu sans le remplacer.
Le changement de thème coupe toutes les transitions pendant deux images (`html[data-kola-switching]`) : aucun scintillement.

## 2. Trois niveaux, posés sur `<html data-kb-motion>` par `public/js/kb-motion.js`
| Niveau | Quand | Effet |
|---|---|---|
| `full` | par défaut | vocabulaire ci-dessus |
| `lite` | économie de données, ≤ 2 Go ou ≤ 2 cœurs annoncés, choix explicite, ou **fluidité mesurée insuffisante** | durées 80 / 100 / 140 ms, plus d'animation d'entrée ni d'illustration animée, plus de `backdrop-filter`, ombres allégées |
| `off` | le système demande moins de mouvement (`prefers-reduced-motion`) | plus aucune transition (`transition: none`) ; les animations durent 0,01 ms (leurs événements de fin restent émis) ; les indicateurs de chargement et d'enregistrement gardent leur rotation (ils signalent un état réel) |
Signaux, dans l'ordre : mouvement réduit → économie de données → mémoire / cœurs → choix explicite (`localStorage.kbMotion`) → **mesure**. Pas de test de puissance, pas de User-Agent, aucune donnée envoyée.
**Mesure** : après un clic ou une touche, la durée des images est échantillonnée 1,5 s (une fois toutes les 10 s au plus). Deux fenêtres de suite dont 25 % des images dépassent 50 ms → `lite` ; trois fenêtres fluides de suite → retour à `full`. Ce niveau mesuré ne vaut que pour la session (`sessionStorage`) : réversible, jamais de changement incessant. Sans mesure fiable : expérience légère et prévisible (`full` ne contient déjà aucun effet coûteux).
API : `KolaMotion.level()`, `KolaMotion.set("full" | "lite" | "off" | "auto")`, événement `kb-motion` sur `document`.
Le script est chargé par la coque (`partials/top.ejs`), le Page Builder et l'éditeur d'articles. Test : `tests/mouvement-adaptatif-navigateur.test.js` (5 scénarios dans Chrome, dont le passage en `lite` sous charge simulée et le retour en `full`).

## 3. Glisser-déposer (état audité)
- **Poignée de manipulation directe** (Page Builder) : page de 300 éléments, médiane 16,7 ms par image (≈ 60 i/s), maximum 33 ms, 0 image > 50 ms ; survol 0,026 ms (`tests/editeur-manipulation-directe-navigateur.test.js`, ligne « MESURE »).
- **Arbre Structure** : glisser-déposer natif du navigateur (indicateur d'insertion avant / après / dedans), lignes hors écran non stylées (`content-visibility`) ; sélection → ligne visible sans déplacer la page (`scrollInside`).
- **Alternatives non glissées** (obligatoires pour toute opération essentielle) : boutons « Monter / Descendre », raccourcis `Alt + ↑ / ↓`, couper / coller, menu contextuel.
- Règles pour tout nouveau glisser-déposer : événements pointeur + `touch-action: none` sur la poignée ; aucune lecture de dimensions dans le gestionnaire de déplacement ; un seul travail visuel par image (`requestAnimationFrame`) ; nettoyage des écouteurs au dépôt, à l'annulation et à Échap ; dépôt invalide = retour exact à l'état précédent ; une alternative clavier.

## 4. Mesurer avant de modifier
`scripts/audit-performance.js` (chargement, tâches longues, latence d'interaction clic → 2 images) · tests `*navigateur*` des éditeurs (lignes « MESURE ») · `scripts/audit-qualite.js` (animations statiques : 0 règle animant la mise en page). Objectifs de repère (laboratoire, à interpréter) : LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1, ≈ 60 images par seconde pendant un déplacement.
