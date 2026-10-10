# KOLAKISA — Matrice de perfectionnement de l'éditeur (LOT 0 : audit des acquis)

État : **audit seulement, aucun code modifié.** Date : 2026-10-10. Faits vérifiés dans le code (fichier cité) ou par exécution ; ce qui n'a pas été vérifié est marqué « À ÉTUDIER ».
Statuts : CONFORME · À PERFECTIONNER · DÉFECTUEUX · ABSENT · À ÉTUDIER · NON APPLICABLE.

## Références Elementor consultées (documentation publique, recherche web du jour)
- Raccourcis : copier / coller (Ctrl/Cmd + C / V), **coller le style (Ctrl/Cmd + Maj + V)**, Navigator (Ctrl/Cmd + I), liste des raccourcis (Ctrl/Cmd + ?) — https://elementor.com/blog/tips-to-improve-workflow/ , https://element.how/elementor-keyboard-shortcuts
- Conteneurs Flexbox : direction (ligne / colonne) **réglable par point de rupture**, hauteurs et largeurs par point de rupture, **ordre personnalisé par point de rupture** — https://elementor.com/help/container-element/ , https://elementor.com/help/?p=29134
- Styles globaux : couleurs et polices globales ; variables (« une valeur définie une fois, appliquée partout ; changer la variable met à jour tous les éléments qui la référencent ») — https://elementor.com/blog/tips-to-improve-workflow/ , https://theplusaddons.com/blog/elementor-v4-design-system/ (source tierce, à recouper avec la documentation officielle avant toute décision)
Limite : ces pages décrivent des comportements documentés ; la disponibilité par édition / version d'Elementor n'est pas vérifiée. Aucun code Elementor n'est utilisé.

## Inventaire des acquis (vérifié dans le code)
| Système | Réalité | Fichier |
|---|---|---|
| Éditeur | script unique sans framework (~6 300 lignes), canevas = iframe du vrai rendu serveur | `public/js/page-builder.js` |
| Modèle | arbre JSON `sections → éléments`, styles par écran (3 : ordinateur / tablette / mobile) et par état (survol / focus / clic), 86 propriétés de style, 86 types d'éléments, 43 raccourcis de bibliothèque | `src/marketing/pages/nodes.js` |
| Layout | Flexbox et Grille (direction, retour à la ligne, répartition, alignements, écarts, colonnes, lignes, ordre, dimensions min / max, position, débordement, proportions) — toutes les propriétés sont des **propriétés de style par écran** | `nodes.js` STYLE_PROPS |
| Sélection | simple, multiple (Maj / Ctrl), Ctrl + A, parent, depuis canevas et calques | `select()` |
| Structure | calques repliables, filtre, renommage (double-clic, F2), glisser-déposer, masquer, verrouiller, dupliquer, supprimer, menu contextuel, navigation clavier, mode flottant / ancré | `renderTree` |
| Raccourcis | Ctrl+S, Z, Y / Maj+Z, C, X, V, D, A, G / Maj+G (grouper), Maj+H (masquer), Maj+L (verrouiller), Alt+C / Alt+V (copier / coller le style), K (commandes), R, Maj+R / G / M (aides), V / H / T / I / B (outils) | `keydown` global |
| Commandes | palette Ctrl/⌘ + K : ajouter chaque widget et bloc, plus ~45 actions réelles | `commandList()` |
| Historique | annuler / rétablir, 150 étapes, libellés, menu d'historique, regroupement des saisies | `change()` |
| Enregistrement | automatique 1 s après la dernière modification, un enregistrement à la fois, copie locale, détection de conflit (409) | `save()` |
| Réutilisable | blocs, composants (par site ou globaux), modèles de page, éléments réutilisables | `renderComponents` |
| Styles globaux | couleurs : **vraies références** (`token:primary`, couleurs personnalisées) ; polices : réglages du site + Font Manager | `nodes.js` l.50–53 ; `tokens.js` |
| Performance | banc reproductible (`scripts/perf/bench-page-builder.js`), budget de 50 ms atteint sauf extrêmes | `docs/perf-page-builder.md` |

## Matrice

| # | Fonctionnalité | Catégorie | Statut | Constat (fait vérifié) | Écart / impact | Risque | Tests à prévoir |
|---|---|---|---|---|---|---|---|
| 1 | Copier / coller le style | Productivité | **À PERFECTIONNER** | `copyStyle()` copie tout (`styles`, `states`, `style`, tous écrans) ; `pasteStyle()` **remplace** les styles de la cible (supprime ses propres réglages, ex. marges, même sans rapport) et n'écarte pas les propriétés inapplicables | destructif ; pas de choix de groupe (typographie, couleurs, fond, bordure, espacement, dimensions, effets) ; raccourci Alt+C / Alt+V, alors qu'Elementor documente Ctrl/Cmd + Maj + V | moyen (écrit sur le document) | fusion non destructive, groupes, compatibilité par type, annuler / rétablir, enregistrement, rendu publié |
| 2 | Références globales : espacements, rayons, tailles de texte | Design system | **ABSENT** (couleurs : CONFORME) | les jetons `--kw-space-*`, `--kw-radius-*`, `--kw-h1-size…` existent pour le site, mais `paddingTop`, `borderRadius`, `fontSize` **refusent** `token:…` et `var(--kw-…)` (vérifié par exécution : `null`) : un élément ne peut qu'en copier la valeur | changer l'espacement ou le rayon global ne met pas à jour les éléments ; écart avec le principe documenté « variable = référence réelle » | moyen : nouvelle forme de valeur, additive (aucune migration nécessaire) | valeur référencée → CSS `var()`, changement du jeton → mise à jour, valeur propre intacte, rechargement, publication |
| 3 | Latence des opérations structurelles et valeurs extrêmes de sélection | Fluidité | **À PERFECTIONNER** | mesuré (400 éléments) : annuler / rétablir / supprimer 37–48 ms, dupliquer 41–56 ms ; sélection médiane 36–48 ms mais pointes 100–130 ms | pointes non expliquées ; aucun garde-fou automatique contre une régression | faible | banc en test « fumée » avec budgets larges |
| 4 | Commande dupliquée « Vider la page… » | Commandes | **DÉFECTUEUX** (mineur) | `commandList()` déclare deux fois la même commande (l. 6006–6007) | doublon dans la palette | très faible | test : aucune commande en double |
| 5 | Raccourcis : conformité Elementor | Productivité | **À PERFECTIONNER** | paste-style = Alt+V ; Navigator = Ctrl+Maj+Y ; panneau « Raccourcis clavier » présent (menu) | Ctrl/Cmd + Maj + V (coller le style) et Ctrl/Cmd + I (Structure) non liés ; à vérifier macOS / Windows et conflits navigateur | faible | clavier réel, champs de saisie exclus |
| 6 | Composants : instance / copie / global | Réutilisation | **À ÉTUDIER** | composants par site ou globaux existent ; non vérifié : ce que l'interface annonce avant de modifier un composant partagé (« N pages concernées ») | risque de modification silencieuse de plusieurs pages si ce n'est pas annoncé | élevé (données partagées) | audit de l'écran d'édition d'un composant, puis test |
| 7 | Responsive : direction, ordre, dimensions, visibilité par écran | Layout | **CONFORME** (à confirmer par test) | `flexDirection`, `order`, dimensions, `hideOn` : propriétés par écran ; 3 écrans (≤ 1023 / ≤ 767) | écrans personnalisés non prévus (NON APPLICABLE tant que 3 suffisent) | faible | test de bout en bout par écran : contrôle → données → rendu → rechargement → public |
| 8 | Structure / Navigator | Structure | **CONFORME** | toutes les actions listées existent et fonctionnent (tests navigateur) ; reconstruction différentielle ; ne déplace pas le canevas (test de stabilité) | sélection multiple dans les calques : Maj / Ctrl OK | faible | existants |
| 9 | Recherche et commandes | Productivité | **À PERFECTIONNER** | palette réelle ; ne cherche ni réglages, ni pages, ni aide ; widgets ajoutables | extension utile mais **seulement si** les résultats restent des actions réelles | moyen | résultats ⇔ actions disponibles |
| 10 | Barre d'actions contextuelle | Ergonomie | **À ÉTUDIER** | existe (`placeCanvasBar`) ; non audité ici : liste exacte des actions et stabilité | — | faible | stabilité du canevas |
| 11 | Contrôles communs | Cohérence | **À ÉTUDIER** | NumericControl, couleur, police, médiathèque partagés ; non audité : cohérence des 86 propriétés | — | moyen | parcours de tous les contrôles |
| 12 | Extensions : contrat de conformité d'un widget | Évolutivité | **À PERFECTIONNER** | contrat de widget documenté (`docs/widgets-personnalises.md`) et validé au démarrage ; **aucun test automatique ne parcourt tous les widgets** (ajout → réglage → enregistrement → rechargement → rendu) ni ne limite leur coût | un futur widget pourrait dégrader les performances sans alerte | moyen | test de conformité générique + budget |

## Les cinq améliorations prioritaires
Voir le message de LOT 0 (justification, méthode, protection des acquis). Résumé : (1) références globales pour espacements / rayons / tailles ; (2) coller le style non destructif et sélectif (+ Ctrl/Cmd + Maj + V) ; (3) garde-fou de performance automatisé + pointes de sélection ; (4) audit des composants partagés (annonce avant modification) ; (5) test de conformité des widgets.
