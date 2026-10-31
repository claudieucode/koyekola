# Programme 22.9 — points restants

## Non réalisé (par phase)
| Phase | Statut | Raison |
|---|---|---|
| 14 Assistant IA de performance | **non fait** | aucun appel IA non configuré ; données prêtes (voir doc dédié) |
| 10 Cache de pages publiques | **non fait, volontaire** | pages personnalisées par visiteur : risque d'exposition > gain |
| 5 CSS critique / CSS inutilisé | non fait | règles partagées avec l'éditeur et les états dynamiques ; aucun gain mesuré |
| 6 Code splitting / chargement conditionnel | non fait | 38 Ko de JS après minification, aucun gain mesuré |
| 8 Sous-ensembles de polices, size-adjust | non fait | aucune mesure de CLS lié aux polices |
| 4 Aplatissement automatique du DOM | non fait | risque de casser des widgets ; constat seulement |
| 11 Base de données | aucun changement | aucun problème mesuré |
| 3 / 13 / 15 Données terrain (RUM) | **indisponibles** | aucune collecte (consentement et vie privée à cadrer) |
| 13 Ingestion des mesures de laboratoire | non fait | script manuel ; résultats documentés |
| INP | non mesuré | aucune interaction pilotée |
| 7 AVIF, images de fond CSS, galeries | non fait | |

## Réserves
1. **Déploiement non vérifiable** (Hostinger inaccessible, pas de compte de production) : l'écran, l'optimisation LCP et les dimensions ne peuvent être constatés qu'en ligne. La minification dépend de la présence d'`esbuild` (devDependency) en production : sinon repli sans effet (en-tête `X-Kolakisa-Minified` absent).
2. Candidat LCP **estimé** par heuristique : sur une page dont le premier grand visuel est un arrière-plan CSS, la correction ne s'applique pas ; sur une page dont la première image est une petite carte, elle est prioritaire sans être le LCP (coût négligeable : une seule image).
3. Mesures de laboratoire : une page de test, une machine partagée (charge 7,4), 5 relevés. Gain LCP démontré sur le profil mobile lent uniquement ; TBT 140 → 214 ms non expliqué.
4. L'effet des `width/height` sur le CLS réel n'a pas été mesuré en laboratoire (couvert par tests de rendu, pas par mesure de décalage).
5. Aucun lien de menu vers l'écran Performance.
6. Programmes 22.7 et 22.8 : aucun résultat dans le dépôt.
7. Lint/typecheck/build : inexistants pour ce code ; seule la syntaxe a été vérifiée (`node --check`).
