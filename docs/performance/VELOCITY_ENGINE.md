# Velocity Engine — mesures de performance (2026-10-28)

Conditions : poste de développement très chargé (load average ≈ 13), serveur réel, base neuve + 30 000 contacts et une liste de 30 000 membres. Mesures de **laboratoire** (médiane de 5 requêtes) ; aucune donnée terrain : le projet n'a pas de collecte Web Vitals fiable, aucun LCP/INP/CLS n'est donc annoncé.

## Constat (avant)
| Mesure | Résultat |
|---|---|
| Production, `/sante` (latence réseau pure) | ≈ 240 ms ; pages publiques 250–390 ms (≈ +10 à +150 ms de traitement) |
| Compression / cache | Brotli en production ; CSS/JS versionnés `immutable` 1 an ; sessions : écriture au plus 1×/min/session (déjà en place) |
| Pages d'administration, base vide | 7–22 ms serveur |
| Poids d'une page Marketing | HTML 44–90 Ko (9–11 Ko en brotli) ; 16 fichiers CSS/JS : 694 Ko bruts, 131 Ko en brotli (mis en cache après la 1re visite) ; `/marketing/pages` : 22 fichiers, 170 Ko brotli |
| Accueil Marketing, 30 000 contacts | 63 ms ; requête de croissance hebdomadaire : **146 ms** (lecture de tous les contacts : `strftime()` sur la colonne empêchait l'index `(organization_id, created_at)`) |

## Corrigé
- `src/marketing/overview/index.js` : la requête de croissance compare directement `created_at` (même format que `newInPeriod`) : l'index sert. Mesuré : 146 ms → 24 ms dans le pire cas (les 30 000 contacts tous dans la fenêtre) ; moins quand l'historique est plus ancien. Résultat identique (tests `marketing-r1-accueil`, `vue-ensemble` verts).

## Constaté, non corrigé (avec raison)
- `SELECT DISTINCT source` (fiche Contacts, 37 ms à 30 000 contacts), `COUNT` des contacts « joignables » (17–35 ms), comptage des membres joignables d'une liste (23 ms) : croissance linéaire, acceptable jusqu'à quelques dizaines de milliers de contacts. Un index demanderait une migration (112) : à regrouper avec un futur lot de migrations, pour ne pas entrer en collision avec les autres chantiers.
- Le CSS public `style.css` (222 Ko) est aussi chargé par l'administration : le retirer exige un audit de couverture CSS par page, trop risqué sans test visuel automatisé.
- Éditeurs (`blog-editor.js` 921 Ko, `page-builder.js` 765 Ko) : chargés uniquement dans leurs écrans ; fluidité déjà traitée par TITAN XX. Aucun profil navigateur n'a été fait ici : **non mesuré**.
- Pas de mesure de fuite mémoire, de LCP/INP/CLS réels, ni de test de charge concurrent.
