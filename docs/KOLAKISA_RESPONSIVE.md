# KOLAKISA — Responsivité (référence permanente)

Deux périmètres **distincts**, testés séparément : (1) l'**interface d'administration** (ce document) ; (2) les **sites créés** avec Kolakisa (moteur partagé : styles par écran du Page Builder, aperçus téléphone / tablette / ordinateur, tests `responsive-apercu-navigateur`, `responsive-largeurs-navigateur`, `responsive-isolation-navigateur`). Ne jamais confondre les deux.

## 1. Principes
- **La disposition suit la largeur du contenu, pas une liste d'appareils.** Le menu latéral retire plus de 300 px : une grille réglée sur la largeur de la *fenêtre* déborde dans la zone de contenu. Utiliser `repeat(auto-fit, minmax(min(100%, N px), 1fr))`, `min-width: 0` sur les éléments de grille et de flex, `clamp()` pour les tailles, et jamais une grille sans colonnes déclarées (son contenu le plus large l'élargit).
- **Le tactile se détecte par `@media (pointer: coarse)`**, pas par la largeur : une fenêtre de bureau étroite garde la densité du bureau, une tablette garde ses cibles larges.
- **Points de rupture de référence** (là où le contenu change vraiment) : 1300 (onglets sur plusieurs lignes) · 1100 (en-têtes d'éditeur) · 980 (empilement des panneaux de la galerie) · 900 (lignes de registre des sites) · 640 (cartes à la place des tableaux, barres d'enregistrement empilées) · 560 (libellés courts de l'éditeur d'articles) · 380 (en-tête d'éditeur en 320 px).
- Aucune fonction essentielle n'est retirée sur petit écran ; une fonction réduite a une alternative signalée.

## 2. Règles de composants (code : `public/css/kola-stable.css` §Responsive, `kola-brand-editors.css`)
| Sujet | Règle |
|---|---|
| Cibles tactiles | `pointer: coarse` → boutons, onglets, icônes, entrées de menu, champs : **44 px** de hauteur (icônes 44 × 44). Les en-têtes d'éditeurs plein écran à 320 px gardent 32 px (au-dessus du minimum de 24 px de WCAG 2.2) faute de place. |
| Champs | `pointer: coarse` → **16 px minimum** (en dessous, iOS zoome la page à la prise de focus). |
| Boîtes de dialogue | largeur `calc(100vw − 16px)`, hauteur `calc(100dvh − 16px)` sous 640 px, défilement interne. `dvh` suit le clavier virtuel. |
| Tableaux | défilement horizontal local, ou lignes de registre / cartes en gardant toutes les données (Mes sites). |
| Formulaires | colonnes `auto-fit` ; une colonne dès que le conteneur est étroit ; actions d'enregistrement collantes. |
| Zones de sécurité | viewport sans `viewport-fit=cover` : le navigateur garde les encoches hors du contenu. Si `cover` est un jour activé, ajouter `env(safe-area-inset-*)` aux barres fixes. |
| Éditeurs | tiroirs / onglets du bas sous 782 px (Page Builder), rail d'icônes, panneaux superposés sous 1100 px ; aperçu du site par appareil (téléphone 390, tablette 768, ordinateur) via les boutons d'écran. Sur téléphone la page se lit et se retouche (sélection, propriétés, aperçu) ; la composition fine reste confortable à partir de la tablette. |

## 3. Matrice de test
Largeurs : 320 · 360 · 390 · 430 · 600 · 768 · 900 · 1024 · 1280 · 1440 · 1920 (+ intermédiaires 600 et 900 pour les ruptures). Tactile émulé (`hasTouch`, `isMobile`, ×2) jusqu'à 768 px.
- `scripts/audit-responsive.js [--shard i/n] [--widths …] [--only …]` : 116 écrans × 11 largeurs ; débordement de page, éléments hors cadre, cibles tactiles, champs < 16 px, dialogues, barres collantes.
- `scripts/audit-editeurs.js` (`ED_W=320,390,768,1024`) : Page Builder, e-mails, scénarios, articles, éditeur du site, Personnaliser.
- `tests/responsive-admin-navigateur.test.js` : 12 écrans × 6 largeurs sans défilement horizontal ; tactile : champs ≥ 16 px et boutons ≥ 44 px ; dialogue dans la fenêtre.
Limite : tout est mesuré dans Chrome (émulation). Aucun test sur appareil réel (Safari iOS, claviers virtuels, rotation) : à faire avant de déclarer l'iPhone « compatible ».

## 4. Éviter les régressions
Un nouvel écran : aucune largeur fixe en px sur un conteneur, `min-width: 0` dans les grilles, test d'abord à 320 et 1024 (la zone de contenu y est la plus étroite), puis `scripts/audit-responsive.js --only <route>`. Une règle de taille de bouton ou de champ s'écrit dans `kola-stable.css` (une seule fois), jamais écran par écran.
