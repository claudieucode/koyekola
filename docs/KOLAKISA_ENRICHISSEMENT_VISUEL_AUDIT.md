# Enrichissement visuel de Kolakisa — Palier 1 : audit et plan

*Audit en lecture seule de `origin/main` (ce071ea7). Aucune modification de code. Les constats viennent du code ; je n'ai pas encore regardé les pages rendues dans un navigateur (voir §6).*

## 1. Ce qui existe déjà (à réutiliser, pas à refaire)
| Élément | Où | Constat |
|---|---|---|
| Pile technique | Node/Express, EJS (406 vues, dont 169 pour l'administration Marketing), JS natif, 38 feuilles CSS | Aucun framework de composants : les « composants » sont des **partiels EJS** et des **fonctions JS** |
| Jetons de charte | `public/css/style.css` | `--primary #0b2a40` (bleu nuit), `--accent #0277b6`, `--accent-light #e0f2fe`, `--sky #7dd3fc`, `--bg #f3f8fc`, `--surface-alt #eaf3fa`, ombres, rayons, polices Figtree / Bricolage Grotesque. L'identité marine est déjà formalisée |
| Couches de design | `kola-ui`, `kola-brand`, `kola-vivid` (« Marine & aurore »), `kola-soft`, `kola-v3`, `kola-stable` | Une direction artistique existe déjà (docs `TITAN_XXVIII_DIRECTION_ARTISTIQUE`, `TITAN_XXXV_ZERO_ROSE` : **famille rose retirée, marine conservée**). Je dois la respecter, pas la concurrencer |
| **Système d'illustrations SVG** | `src/utils/illustrations.js` + `public/css/kola-art.css` | **30 scènes** (dashboard, pages, articles, média, SEO, formulaires, automatisations, boutique via alias…), 112 alias, SVG en ligne, aux couleurs de la charte, `aria-hidden` ou `role="img"` selon `label`. Utilisé dans ~30 vues |
| États vides | partiels `marketing/partials/empty-art.ejs` (6 types) et `kx-empty.ejs` | Déjà en place ; 66 usages de `mk-empty` |
| Aperçus de thèmes | `public/img/theme-previews/` : 960 fichiers `.webp` (160 thèmes × 6 vues) | De **vraies** vignettes ; base idéale pour les aperçus de sites/modèles (21 Mo d'images au total, polices 118 Mo hors périmètre) |
| Photos d'accueil | `public/img/accueil/` (4 études, 800 et 1600 px) | Diaporama du hero du catalogue de formations |

**Conséquence : la demande « mettre en place un système d'illustrations » ne part pas de zéro.** Créer un second système (composants `FeatureIllustration`, etc.) doublonnerait `illustrations.js` et créerait deux styles. Le plan étend le système existant.

## 2. Écrans sans aucune composition visuelle (constat par vue)
Mesure : occurrences de `illu(` / `empty-art` / `kx-art` / `<svg` / `<img` dans la vue.

| Priorité | Écran (vue) | Constat |
|---|---|---|
| **Haute** | Accueil public (`index.ejs`) | Hero = diaporama de 4 photos + recherche ; **aucun** visuel des fonctionnalités de la plateforme de création de sites (le catalogue de formations est mis en avant, pas le CMS) |
| **Haute** | Création de site par IA (`ai-builder-home.ejs`, `ai-builder.ejs`) | 0 visuel : écran de départ du processus en 5 étapes, texte seul |
| **Haute** | Assistant « Créer un site » (`site-wizard.ejs`, 246 lignes, `site-wizard-hub.ejs`) | 0 visuel, ni pour le choix du type de site ni pour les étapes |
| **Haute** | Bibliothèque de modèles (`apparence-templates.ejs`) | Cartes alimentées par JS (vignettes vivantes du moteur) ; **état vide et en-tête sans illustration** |
| Moyenne | Connexion / inscription (`login.ejs`, `register.ejs`, `partials/auth-aside.ejs` — 9 lignes) | Panneau latéral sans visuel |
| Moyenne | Tableau de bord Marketing (`dashboard.ejs`) | 2 usages seulement : bloc de bienvenue et cartes de découverte sans visuel dédié |
| Moyenne | Cartes de cours (`partials/course-card.ejs`) | Une `<img>` si la formation en a une ; **pas de repli cohérent** sinon |
| Moyenne | Gestion des sites (`sites.ejs`) | 1 usage ; pas de miniature par site |
| Moyenne | À propos, FAQ, contact (`views/pages/*`) | Texte seul |
| Basse | Blog, SEO, formulaires, analytics, e-commerce (CMS) | Déjà dotés d'un état vide illustré (1 usage chacun) ; interfaces denses : **ne pas surcharger** |
| Aucune | Éditeur (canvas), paramètres avancés, tableaux de données | Exclus par vos règles |

35 vues d'administration affichent un état vide (`mk-empty`, `empty-state`, `dash-empty`) **sans** illustration : liste exacte à établir au palier 4 (les états vides de tableaux de bord de données restent sobres si l'illustration n'apporte rien).

## 3. Principes retenus
1. **Étendre `illustrations.js`** (nouvelles scènes, mêmes primitives, mêmes jetons) ; pas de bibliothèque tierce, aucune image distante.
2. **Compositions du site, pas d'images au hasard** : chaque scène illustre une fonction réelle de Kolakisa (éditeur, IA, modèles, formulaires, boutique, formations).
3. **Aperçus de sites/modèles = vrais objets** : vignettes `theme-previews` et aperçus du moteur ; jamais de capture inventée présentée comme un résultat réel. Les **captures d'écran réelles de l'interface** (hero marketing) sont à produire depuis une instance de test avec des données de démonstration **étiquetées comme telles**.
4. **Couleurs** : jetons existants uniquement (marine, accent, `--sky`, `--accent-light`, fonds teintés `--bg` / `--surface-alt`). Le « rose » est interdit (décision Titan XXXV). Mode sombre : à vérifier là où il existe (jetons `--mk-*`).
5. **Performance** : SVG en ligne ou fichiers statiques mis en cache, `loading="lazy"` hors zone visible, pas de nouvelle requête pour les scènes déjà en ligne ; budget à fixer au palier 5 (poids de page avant/après).
6. **Accessibilité** : décoratif → `aria-hidden`, informatif → `role="img"` + `aria-label` ; animations seulement si `prefers-reduced-motion: no-preference` ; contrastes revérifiés.

## 4. Plan par palier
| Palier | Contenu | Fichiers principaux |
|---|---|---|
| **2 — Système** | +12 à 16 scènes dans `illustrations.js` (éditeur de site, IA qui planifie, bibliothèque de modèles, formulaires/newsletter, boutique, formation, statistiques, démarrage) ; partiels EJS `visual-hero`, `site-card-thumb`, `onboarding-steps` ; CSS dans `kola-art.css` ; planche de contrôle `/marketing/…` ou page de test listant toutes les scènes (clair/sombre) ; tests (chaque scène valide, accessible, sans rose, sans lien externe) | `src/utils/illustrations.js`, `public/css/kola-art.css`, `views/partials/` |
| **3 — Pages marketing + tableau de bord** | Hero de l'accueil (composition « créer, publier, vendre » à côté du titre, sans repousser la recherche) ; connexion/inscription ; À propos ; bienvenue et cartes de découverte du tableau de bord ; création de site par IA et assistant de site (visuel du processus et des types de sites) | `index.ejs`, `auth-aside.ejs`, `ai-builder-home.ejs`, `site-wizard*.ejs`, `dashboard.ejs`, CSS associées |
| **4 — Modules et états vides** | Miniatures des sites (`sites.ejs`), état vide et en-tête de la bibliothèque de modèles, repli de miniature des cours, états vides des 35 vues sans illustration (seulement là où ça aide) ; LMS | `sites.ejs`, `apparence-templates.ejs`, `course-card.ejs`, vues listées |
| **5 — Qualité** | Chrome (desktop / tablette / mobile) + Firefox ; mode sombre ; `prefers-reduced-motion` ; sonde d'accessibilité existante (`scripts/a11y/audit-accessibilite.js`) ; poids des pages avant/après ; tests existants des écrans touchés | tests |

Commit + push + déploiement **par palier**, aux conditions de votre §10 : branche confirmée (`main`, déploiement automatique Hostinger), validations vertes, aucun problème bloquant. Les tests existants qui échouent déjà sur `main` sont rapportés, jamais masqués.

## 5. Risques
- **Multi-sessions** : d'autres sessions poussent sans cesse sur `main` ; fusion de `origin/main` avant chaque push.
- **Couches CSS empilées** (`kola-ui` → `kola-soft`…) : les règles s'écrasent dans un ordre précis ; tout ajout se fait dans `kola-art.css`, vérifié rendu.
- **Tests de contenu** existants (comptes d'éléments, textes) : un visuel ajouté peut casser un test de structure ; on corrige le test seulement si l'attente était réellement obsolète.
- **Goût** : une illustration est subjective. Je livre un premier jeu cohérent ; vous jugez sur pièces à chaque palier.

## 6. Limites de cet audit
Aucune page n'a été rendue ni photographiée (pas de session connectée sur kolakisa.com). Les constats sont issus du code ; l'évaluation « trop terne » page par page sera faite sur un serveur local avec captures avant/après dès le palier 2.
