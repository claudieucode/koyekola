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
