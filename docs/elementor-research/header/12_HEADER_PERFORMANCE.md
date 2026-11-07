# 12 - Performance d'un header (recherche Elementor, pour Kolakisa)

Légende : [NATIF] [PRO] [EXPÉRIMENTAL] [EXTENSION] ; « NON VÉRIFIÉ » = non confirmé par une source lue. « Recommandation Kolakisa » = proposition de conception, pas un fait Elementor.

## 1. Fonctions de performance d'Elementor et leur statut
Source principale : https://elementor.com/help/what-are-performance-experiments/ (fin de page lue ; le début était tronqué) et https://developers.elementor.com/elementor-3-24-developers-update/ (lue).

| Fonction | Principe | Statut |
|---|---|---|
| Optimized Control Loading | Charge les contrôles de l'éditeur seulement quand nécessaire (effet côté éditeur) | [EXPÉRIMENTAL] (onglet Features) |
| Element Caching | Stocke le HTML rendu d'un élément et le réutilise au lieu de le re-rendre. Détection automatique des widgets « statiques » ; réglage par élément (onglet Avancé) ; expiration configurable ; conteneurs, Grid et Off-Canvas mis en cache d'office ; déconseillé avec balises dynamiques | [EXPÉRIMENTAL] selon l'aide. Sources : https://elementor.com/help/element-caching-help/ (snippet) ; gain TTFB ~50 % entre 3.18 et 3.22 = chiffre interne Elementor, non indépendant |
| Inline Font Icons | Icônes rendues en SVG inline : Font Awesome et eicons non chargés | [NATIF] stable (Features) |
| Optimized Image Loading | `fetchpriority` haut sur l'image LCP, lazy-load sous le pli | [NATIF] (onglet Performance) |
| Optimized Gutenberg Loading | Retire scripts/styles Gutenberg inutiles | [NATIF] |
| Lazy Load Background Images | Lazy-load de tous les fonds sauf le premier ; devenu réglage cœur (Settings > Performance) en 3.24 | [NATIF] |
| Improved CSS Loading | Découpe le gros `frontend.min.css` en fichiers par widget chargés à la demande. En 3.24 : devenu comportement par défaut, l'expérience est masquée/inactive ; base gratuite passée de 206 ko à 61 ko ; styles de widget toujours en `<link>` externes (fin de l'inline à cause des problèmes de spécificité) | [NATIF] depuis 3.24. Source : developers update 3.24 |
| Cache des dépendances de style | Après la 1re visite, les dépendances de style de la page sont gardées en post meta et chargées dans `<head>` -> moins de CLS | [NATIF] 3.24 |
| Animations découpées | Fichier animations de 18,4 ko découpé en fichiers par animation (0,077 à 0,835 ko) | [NATIF] 3.24 |
| Nettoyage JS | `waypoints.js` supprimé, Swiper chargé à la demande | [NATIF] 3.24 |
| Nested Elements / Containers | Actif par défaut sur nouveaux sites (3.24) ; les conteneurs flex remplacent section/colonne/colonne interne | [NATIF] |
| Optimized Markup / Optimized DOM Output | Retire des `div` enveloppes superflus pour réduire la taille du DOM. Aucune page officielle trouvée | NON VÉRIFIÉ officiellement (source tierce : https://onlinemediamasters.com/speed-up-elementor/ ; snippet) |
| Chargement de scripts/styles à la demande (API) | Les widgets enregistrent leurs assets ; Elementor ne les charge que si la page utilise le widget | [NATIF]. Source : https://developers.elementor.com/docs/scripts-styles/ (lue) |
| Google Fonts | Option de méthode de chargement ; désactivation des polices/couleurs par défaut | [NATIF] (titres d'articles de l'aide seulement lus) : https://elementor.com/help/what-are-performance-experiments/ |

Distinction demandée : « expérimental » (Optimized Control Loading, Element Caching selon l'aide) vs « natif stable » (Inline Font Icons, Optimized Image Loading, Gutenberg, Lazy BG, Improved CSS Loading depuis 3.24). Le statut évolue ; à revérifier dans les notes de version.

## 2. Header : où se joue la performance
1. Poids du DOM : un header Elementor ancien = section > colonne > widget (enveloppes multiples). Les conteneurs flex réduisent la profondeur. Mesurer le nombre de nœuds du header (cible Kolakisa : < 150 nœuds, desktop + mobile compris). Recommandation Kolakisa.
2. Double rendu desktop/mobile : cacher une version en CSS laisse les deux dans le DOM. Préférer un seul balisage adaptatif, sinon charger la version non utilisée différée. Recommandation Kolakisa.
3. CSS : un fichier CSS par document « post-ID.css » généré par Elementor (voir fichier 13) ; le header étant sur toutes les pages, son CSS est critique. Kolakisa : inline le CSS critique du header (< ~10 ko), charger le reste à la demande.
4. JS : hydrater uniquement les widgets interactifs (burger, sous-menus, recherche, sticky). Pas de jQuery imposé. Charger en `defer`/module.
5. Images : logo avec `width`/`height`, `fetchpriority="high"` s'il est LCP, SVG de préférence ; jamais de lazy-load sur le logo au-dessus du pli (Elementor lazy-load tous les fonds sauf le premier : même logique).
6. Polices : limiter le nombre de graisses, `font-display: swap`, précharger la police du header ; icônes en SVG inline (comme « Inline Font Icons »).
7. Cache : le header est le meilleur candidat au cache de fragment (identique sur toutes les pages) sauf zones dynamiques (panier, compte, langue). Elementor recommande de ne pas cacher les éléments à balises dynamiques (source Element Caching). Kolakisa : séparer fragment statique et « îlots » dynamiques.

## 3. Sticky, animations : impact CLS / INP
- CLS : la cause classique est un header qui change de hauteur en devenant sticky, ce qui décale le contenu. Solution : réserver l'espace (placeholder de hauteur fixe) ; le plugin tiers Sticky Elementor ajoute un « Dynamic Spacer » pour cela. Sources : https://theplusaddons.com/blog/sticky-header-in-elementor/ et https://wordpress.org/plugins/sticky-elementor/ (snippets ; allégations non mesurées de façon indépendante).
- Le sticky natif d'Elementor est dans Motion Effects > Sticky (haut/bas) [PRO]. Source : snippet https://elementor.com/academy/?p=7656.
- Rétrécissement au scroll : change la hauteur -> risque de CLS (inférence, NON VÉRIFIÉ par une source). Recommandation Kolakisa : animer `transform`/`opacity` uniquement, garder la hauteur de la boîte réservée constante, ou utiliser `position: sticky` natif avec hauteur stable.
- Les écouteurs de scroll lourds dégradent l'INP : utiliser `IntersectionObserver` ou `position: sticky`, `passive: true`, pas de lecture de layout dans le scroll.
- Flou (`backdrop-filter`) et grosses ombres coûtent en rendu mobile ; limiter.
- Transparence sur scroll : documenté par Elementor (titre d'article seul lu) ; veiller au contraste (fichier 11).
- Animations d'entrée : Elementor charge désormais les fichiers d'animation à la demande (3.24). Éviter toute animation d'entrée sur le header (retarde le LCP, provoque du décalage).

## 4. Budgets proposés pour Kolakisa (Recommandation Kolakisa, à calibrer)
- Header : <= 150 nœuds DOM, <= 15 ko CSS compressé, <= 10 ko JS compressé, 0 requête bloquante hors CSS critique, CLS imputable au header = 0, INP du burger < 200 ms.
- Référence Core Web Vitals : seuils Google (LCP <= 2,5 s, INP <= 200 ms, CLS <= 0,1) - connaissance générale, non issue de la doc Elementor.

## 5. NON VÉRIFIÉ
- Définition officielle de « Optimized Markup » et son statut actuel.
- Statut actuel d'Element Caching (experimental ou stable) dans la dernière version.
- Fonctionnement interne du cache (clé, invalidation).
- Page « Improve performance features » : début tronqué à la lecture.
