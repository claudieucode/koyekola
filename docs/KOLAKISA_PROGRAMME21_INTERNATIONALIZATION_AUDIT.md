# Programme 21 — audit international

Test : `tests/programme21-international-migrations.test.js` (4 marchés) + tests des moteurs.
| Pays | Devise | Langue proposée | Fuseau | Remarque |
|---|---|---|---|---|
| États-Unis | USD | en | America/New_York | formats de date et de nombre propres (mars → « March ») |
| RD Congo | CDF | fr | Africa/Kinshasa | détecté depuis « Kinshasa » |
| France | EUR | fr | Europe/Paris | — |
| Canada | CAD | fr (et en) | America/Toronto | « Montréal » détecté |
Constats :
- Table de pays **prudente** (Brief Analyzer : 12 pays ; assistant de création : 18 pays, 6 langues, 11 devises) ; un pays absent donne un contexte « inconnu », **jamais** une valeur américaine par défaut.
- Moyens de paiement et obligations légales sont toujours **« non vérifiés »** : l'application n'affirme aucune disponibilité de paiement, de livraison ni de règle fiscale par pays.
- Contenus : français et anglais pris en charge par le Content Generator ; autres langues du profil (es, pt, de, it, sw, ln, ar) signalées selon le profil, langue inconnue refusée explicitement.
- Interface : **en français seulement**.
- Formats régionaux (date, heure, nombre, devise) : `Intl` selon le pays dans l'assistant de création ; **non propagés** au rendu public ni à la devise des ventes.
- Unités de mesure, configuration fiscale, livraison : **non implémentées** (aucune fonction de ce type dans le CMS).
- Géographie des paiements : Stripe pour les formations uniquement ; pas de moyen de paiement local (mobile money, etc.).

## Boutique (21.10 et moteur 20.5)
19 pays reconnus (dont RDC, France, Canada, États-Unis) ; **devise détectée si écrite, sinon HYPOTHÈSE signalée** ; montants en plus petite unité (devises sans décimale gérées pour le CSV) ; zones de livraison et règles de taxe **saisies** (aucune règle locale fournie, aucune règle américaine codée en dur). **Seul l'euro est testé** ; pas de conversion ni de multi-devises ; pas de formats/unités propres au pays ; pas de traduction de la boutique ; disponibilité des paiements par pays **non vérifiée** (dépend du compte Stripe) ; une règle de taxe par commande (pas d'OSS).
