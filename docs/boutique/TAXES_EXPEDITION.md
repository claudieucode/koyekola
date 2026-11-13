# Taxes avancées et expédition

## Taxes
- **Classes de taxe** (ex. « Taux réduit ») : chaque produit a une classe (ou « standard »). Une règle ne s'applique qu'aux produits de sa classe.
- **Règles** : pays, région, **codes postaux** (`75*`, `13000-13999`, `1000`), taux, application à la livraison, priorité. Précision : code postal > pays+région > pays > « * ».
- **Calcul par ligne** : chaque ligne reçoit le taux de sa classe ; la commande peut mêler plusieurs taux (ventilation sur la facture). Une classe sans règle pour la destination = aucune taxe inventée.
- **Exonération** : un client **connecté** marqué « exonéré » ne paie pas de taxe (prix TTC : la taxe contenue est retirée du total). Jamais déduite d'un e-mail saisi.
- Arrondi : demi vers le haut ligne par ligne, total = somme exacte des lignes.

## Expédition
- **Zones** par pays et, en option, par **codes postaux** (une zone limitée ne s'applique jamais hors de ses codes ; à pays égal, la zone au code postal précis l'emporte).
- **Classes d'expédition** (ex. « Encombrant ») : chaque méthode peut ajouter un **supplément par classe**, une fois par classe présente dans le panier ; la méthode « gratuite dès X » reste gratuite.
- Méthodes : forfait, gratuite dès un montant, par poids ; créneaux de livraison (existant).

Administration : Boutique → **Taxes et expédition** ; classes d'un produit dans sa fiche ; exonération dans Clients.
Tests : `tests/boutique-taxes-expedition.test.js`. Migration : `148_boutique_taxes_expedition.sql`.
