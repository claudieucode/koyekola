# Stratégie de tests de la nouvelle bibliothèque de pieds (proposition)

Les outils du prototype (`arch-v2/run.js`, `snap2.js`, `iso.js`, `feat.js`) et de l'audit (`scratchpad/audit-v2/run-scenario.js`, `snap.js`) sont la base : relevé de styles calculés par élément, comparaison « avant/après un changement du site », règle « un changement ne compte que s'il est visible ». Règle absolue : un test n'est dit « validé » que s'il a été **exécuté** ; une capture n'est dite « contrôlée » que si elle a été **regardée**.

## 1. Existant (à réutiliser ou adapter)
| Existant | Rôle | À adapter pour v2 |
|---|---|---|
| `tests/footer-100-integration.test.js`, `footer-comportements-reels.test.js` | un serveur de test, 100 modèles insérés/publiés | ajouter les cas `solo` |
| `tests/footer-rendu-unifie.test.js` | un seul pied, multisite, trois chemins de rendu | structure : pied après `</main>` |
| `tests/footer-aliases.test.js` | 100 anciens identifiants → actuels | chaîne vers v2 |
| `tests/footer-bibliotheque-interface.test.js`, `footer-bibliotheque-navigateur.test.js`, `footer-panneau-navigateur.test.js` | interface de la bibliothèque, aperçu | aperçu sans CSS de site |
| `tests/footer-comportements-editeur-navigateur.test.js`, `footer-editeur-etats.test.js` | éditeur (12 modèles) | racine de frontière dans le canevas |
| `tests/footer-accordeon-mobile-navigateur.test.js` | accordéon mobile | inchangé (DOM normal) |
| `tests/footer-conditions.test.js`, `footer-revisions.test.js`, `footer-import-export.test.js`, `footer-widgets-entreprise.test.js`, `footer-catalogue-widgets.test.js`, `footer-elements-refonte.test.js`, `footer-reconstruction.test.js` | conditions, révisions, import/export, widgets | régression telles quelles |
| `tests/theme-builder-pieds-bibliotheque.test.js`, `theme-builder-pieds-identites.test.js` | copies indépendantes, identités | origine / `ft_mode` |
| `scripts/audit-pieds.js`, `audit-pieds-cdp.js`, `audit-pieds-donnees.js`, `audit-pieds-planches.js` | audit visuel 100 modèles | base du contrôle visuel et des planches |
| Scripts d'audit de la phase 1 (`scratchpad/audit-v2/`) | scénario en 10 étapes, contamination, structure, contraste, largeur sous thème | à **transformer en test du dépôt** |

## 2. À créer
1. **`footer-v2-independance.test.js`** : le scénario en 10 étapes automatisé sur les 100 (par lots, voir §9 lenteur) : site marine → insertion du pied → relevé → couleurs → polices → échelle de texte → « Global » → boutons/champs/rayons → 4 thèmes (au minimum `maille`, `noir`, `sape`, `volt` ; puis un échantillon de 10 autres thèmes) → rechargement → republication. Critère : **0 propriété visible modifiée** (390 et 1280 px) pour tout pied en `solo`, 0 pour la largeur de la racine. Les cas `legacy` doivent rester égaux à la baseline enregistrée AVANT déploiement.
2. **Aperçu** : relevé de l'aperçu de la bibliothèque vs page publiée (styles calculés égaux) ; aperçu inchangé quand couleurs/polices/thème du site changent (0/100) ; case « avec mon thème » : même rendu qu'en public.
3. **Éditeur** : ouvrir le pied dans le Page Builder du composant, sélectionner un nœud (clic réel), modifier un texte et une couleur, enregistrer, recharger, republier : identité inchangée ; contours de sélection visibles dans la racine.
4. **Contamination inverse** : pour chaque pied, styles de l'en-tête et du contenu identiques avant/après l'insertion du pied et sous chaque changement de site (déjà 0 mesuré ; à garder en test).
5. **Couverture du remappage** : toute `var(--kw-…)` / `var(--lp-…)` de `landing.css`, `widgets.css`, `motion-studio.css`, `kola-v3.css` est redéfinie à la racine du pied.
6. **Couverture de l'exclusion** : pour chaque feuille « site » émise (thème, `themeCss`, `globalStyles`, CSS perso), 100 % des règles de style portent le suffixe d'exclusion ; test d'API sur `excludeFooter` (virgules dans `:is()`, pseudo-éléments, `@media`, `@supports`, `@font-face`/`@keyframes` intacts, `html`/`:root` intacts).
7. **Absence de feuille hors du circuit** : en navigateur, aucune règle de `document.styleSheets` ne correspond à un élément du pied sans passer par `[data-kw-ft]` ni appartenir à `landing.css`.
8. **Structure** : 1 seul `<footer>`, 0 `<header>` ajouté, 0 pied dans `<main>`, widgets dans le pied, 0 fuite CSS dans les deux sens, défilement horizontal nul, largeur de la racine = fenêtre.
9. **Responsive** : 5 largeurs (320, 390, 820, 1280, 1920) × 100 : pas de débordement, cibles ≥ 44 px sur écran étroit, lisibilité.
10. **Multisite** : deux sites avec deux thèmes différents sur la même installation : chaque pied indépendant de SON site ; pied d'un site absent de l'autre.
11. **Migration `legacy → solo`** : une copie existante de chaque famille bascule, rendu avant/après comparé, retour arrière, révision créée.
12. **Aliases/remplacement** : tout ancien et actuel identifiant se résout ; favoris et `origin_key` valides (voir le plan de remplacement).
13. **Accessibilité** : contraste AA **calculé** sur chaque couple texte/fond rendu (4,5:1 ; 3:1 pour le grand texte) dans tous les états ; cibles ≥ 44 px ; parcours Tab complet (aucun piège, ordre = ordre de lecture) ; contour de focus visible ; arbre d'accessibilité (`contentinfo` unique, liens nommés) ; `prefers-reduced-motion` (0 transition > 0,01 ms) ; impression.
14. **Performance** : poids CSS (feuille du pied) et polices par modèle, nombre de requêtes de polices, LCP/CLS indicatifs en Chrome ; budget fixé en phase 3 ; alerte si dépassé.

## 3. Diversité (matrice)
Tableau famille × ambiance (clair/sombre/couleur) × structure (colonnes, centré, asymétrique, affiche) × polices (sans, serif, chasse fixe, display) × widgets (recherche, lettre, accordéon, réseaux, plan) : chaque case des groupes de la phase 4 doit être renseignée avant production ; contrôle automatique : pas deux modèles dont les relevés (types d'éléments, couleurs dominantes, polices) coïncident à plus de 85 %.

## 4. Contrôle visuel
Captures des 100 modèles (identité marine, 3 thèmes de site, 390 et 1280 px, aperçu, éditeur) **regardées** par planches de 4 à 6 modèles (comme `arch-v2/montages/`) ; critères : lisibilité, hiérarchie, alignements, débordements, cohérence avec l'ambiance, aucun défaut de découpe de texte ; chaque planche reçoit un commentaire écrit.

## 5. Régression à relancer avant chaque livraison
Les 20 fichiers `tests/footer-*.test.js`, `theme-builder-pieds-bibliotheque.test.js`, `theme-builder-pieds-identites.test.js`, les tests de thèmes de site (paquets), `tests/` du Page Builder (rendu des pages, éditeur), tests des en-têtes (`header-*`), des gabarits (blog, 404, boutique), des widgets de données, de la ligne légale / consentement. Les tests étant lents (un serveur par suite, `--test-concurrency=1`), les lancer par lots et ne pas lancer deux sessions en parallèle sur la même machine.

## 6. Définition de « indépendant » pour un test
Aucune propriété visible (couleurs, fond, police, taille, graisse, interligne, casse, bordure, rayon, marges, remplissages, ombre, opacité, largeur) d'aucun élément du pied ne change quand on modifie couleurs, polices, échelle de texte, « Global », boutons/champs/rayons/ombres/espacements ou thème du site, à 390 et 1280 px, ni après rechargement et republication ; et le contenu/l'en-tête ne changent pas quand on insère ou modifie le pied.

## 7. Limites connues de la méthode (à ne pas oublier)
Transitions CSS : terminer les animations avant de relever (`document.getAnimations()`), sinon fausses différences (rencontrées pendant l'étude). Navigateur unique (Chrome) : ajouter Firefox/Safari avant de promettre quoi que ce soit hors Chrome. Serveur chargé par d'autres sessions : mesures de styles calculés insensibles, mesures de temps non.
