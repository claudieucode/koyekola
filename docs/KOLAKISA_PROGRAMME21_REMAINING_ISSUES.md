# Programme 21 — problèmes restants (priorisés)

## P0 — critique
Aucun ouvert. Aucune fuite entre sites, aucune faille d'écriture, aucun paiement non sécurisé trouvé (F1 et F2 corrigés).

## P1 — important
| # | Problème | Action |
|---|---|---|
| 1 | **Aucun fournisseur réel vérifié** : IA (texte, images) et Stripe ; qualité des générations non évaluée | essai réel supervisé (clés, budget, relecture), puis passage « non vérifié » → « vérifié » |
| 2 | **I1** : le registre du Site Planner (et les types de pages `boutique`, `panier`…) déclare la boutique indisponible alors qu'elle existe | aligner le registre sur le moteur Boutique et orienter le planificateur général vers le constructeur de boutique |
| 3 | **Aucun test navigateur exécuté** (Chrome absent) : responsive, accessibilité, interactions du studio, de la régénération et de la boutique | exécuter la suite navigateur sur une machine équipée |

## P2 — moyen
4. **I2/I3/I4** : 21.9 non relié au studio, protections non consultées par le Page Generator / Design Generator / médias appelés directement, catalogue (produits, catégories, config) hors historique 21.9 ; **piles d'annulation séparées**.
5. AI Core non branché pour le texte (deux socles IA) ; pas de modèle d'image dans son registre ; `ai.use` sans rôle.
6. Assistants à règles locales (studio, boutique, régénération) : formulations inhabituelles non comprises ; pas de contexte « composant/produit sélectionné ».
7. Boutique : fiche produit non générée, pas d'images de produits générées, variantes à compléter à la main (stock 0, sans SKU), promotions non pilotées, brouillons limités à 500 sans file asynchrone, vérification du checkout statique.
8. Pas de dépublication dans le studio (existe dans le moteur de pages) ; pas d'environnement de test distinct de la production.
9. Médias : alt sans analyse d'image, pas d'AVIF, pas d'antivirus, EXIF des originaux conservés ; un fichier supprimé de la médiathèque n'est pas récupérable par restauration.
10. International : interface française seule ; seul l'euro testé ; pas de conversion de devises ; formats régionaux non propagés au rendu public.
11. Performance non mesurée à grande échelle ni en navigateur.

## P3 — mineur
12. `public/js/automation-flow.js` versionné diffère d'une construction fraîche d'une ligne.
13. Échecs préexistants hors programme 21 : `refonte-design` (4), `r9-lancer-recette-prod` (4, branche `r8-recette-outil` absente), `editeur-blocs-firefox` (Firefox absent).
14. Réalisation alternative de 21.8 non fusionnée (branches `alt/programme-21-8-createur-ia`, `feat/ai-builder-interface-mine`) : à archiver ou supprimer.
15. Inventaire d'isolation des tables à la demande à tenir à jour si elles passent un jour en migration.
