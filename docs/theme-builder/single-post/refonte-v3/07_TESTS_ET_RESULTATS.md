# Tests et résultats réels — Article individuel v3 (10 novembre 2026)

Tous les chiffres ci-dessous viennent d'exécutions réelles (machine très chargée : `TEST_START_TIMEOUT_MS=900000`, Playwright installé hors projet pour le test Chrome). Aucun test n'est déclaré réussi sans exécution.

| Contrôle | Résultat |
|---|---|
| `node scripts/audit-article-individuel.js --all` (100 modèles, noms et clés uniques, grammaire du moteur, un titre, un contenu, aucune donnée inventée, grilles à 1 colonne sur mobile, similarité de structure < 0,80) | **100 / 100, 0 défaut** ; similarité maximale mesurée par l'assignation des variantes : **0,68** |
| `tests/theme-builder-article-identite.test.js` (réécrit) : 100 identités distinctes à valeurs fixes et contraste WCAG ; 9 teintes d'accent au moins ; 45 polices au moins ; aucun jeton du site ni police hors bibliothèque dans les 100 modèles ; racine isolée ; fiches AI-001 à AI-100 ; modes « suit le site » / « hybride » sur les 100 modèles ; **scénario bleu marine → charte hostile** (polices, titres 90 px, liens, boutons) : règles du modèle identiques ; **trois modes de bout en bout** (retour « indépendant » identique à une installation indépendante, hybride, refus, isolation entre sites, sans connexion) | **6 / 6** |
| `tests/theme-builder-article-individuel.test.js` : 100 modèles utilisés puis publiés, bon article, aucune fuite d'un autre article ou site ; sommaire et partage liés à l'article ; modification, enregistrement, rechargement ; droits ; miniature et aperçu des 100 | **9 / 9** |
| `tests/theme-builder-article-individuel-navigateur.test.js` : Chrome, 100 modèles × 1440 / 820 / 390 px, article riche, sans débordement, chevauchement ni mot coupé | **réussi** (1ʳᵉ exécution : 1 défaut réel, « Marge Infinie » en tablette → règle de repli des grilles asymétriques ajoutée ; 2ᵉ exécution : réussi) |
| `single-post-moteur`, `single-post-serveur`, `theme-builder-catalogue`, `theme-builder-apercu-contenu`, `theme-builder-contexte-rendu`, `theme-builder-identite`, `theme-builder-routes` | 19/19, 9/9, 21/21, 3/3, 7/7, 7/7, 10/10 |
| `fiche-produit-bout-en-bout` (mécanisme de modes partagé avec la Fiche produit) | **12 / 12** sur `main` propre et sur cette branche. Sur cette branche, 2 exécutions sur 3 ont eu 3 tests « annulés » (délais dépassés pendant que d'autres suites tournaient en parallèle, charge machine 9 à 15) ; relancée seule, elle passe. `theme-builder-identite` : même constat (7/7 ; un échec « pas de réponse en 30 s » sous charge, puis 7/7). |
| `theme-builder-apercu-vignette` | **4 / 5 : l'échec (`not_found/page-blanche`, catégorie 404) est identique sur un `main` propre** (vérifié sur une copie de `origin/main`) ; sans rapport avec l'article |

## Défauts trouvés par les tests et corrigés pendant le travail
Palettes limites (19 contrastes insuffisants → ajustement automatique de l'accent) ; quasi-doublons de structure (variantes structurelles + rééquilibrage des archétypes) ; valeur `aspectRatio` refusée par le moteur ; carte de titre à marge négative qui remontait hors de la page sans image à la une (supprimée) ; grille asymétrique illisible en tablette ; `css` de la racine non restitué au retour en mode indépendant (conversion partagée corrigée, sans effet sur la Fiche produit) ; test de bascule qui ne republiait pas.

## Non exécuté ou limites
- Les autres suites du dépôt (hors celles listées) ; 1920 et 1280 px ; relecture humaine des 100 rendus (seulement une dizaine de captures examinées).
- L'image à la une de contrôle s'affiche comme icône cassée dans le test (le serveur de test ne sert pas ce fichier) : la **géométrie** des zones d'image est vérifiée, pas le rendu photographique.
- Interface « choix d'identité » à l'insertion : branchée par une ligne (`single_post` ajouté au sélecteur de la Fiche produit), non testée dans un navigateur.
- `theme-builder-catalogue-public` et `theme-builder-catalogue-direct-navigateur` : non relancés (3 échecs connus sur la catégorie En-tête, antérieurs).
