# Catalogue des extensions : Galerie et Liste

- **Vues** : `views/marketing/extensions.ejs` (onglets Toutes / Activées / Désactivées via `partials/extensions-catalogue.ejs`), fiche `views/marketing/extension-detail.ejs` (`/extensions/detail/<id>`, aussi sous `/sites/N/extensions/detail/<id>`).
- **Une seule liste de données, deux présentations** : le CSS (`public/css/extensions.css`) bascule `data-view="gallery|list"`. Recherche, catégorie, état, tri (nom, récentes, version) et présentation sont gérés dans la page (`public/js/extensions.js`), sans requête ; la présentation est mémorisée (`kxExtView`). Sous 960 px de large utile, la Liste devient des fiches compactes.
- **Logos** : `public/img/extensions/<id>.svg` (Flat Design, 96×96, moins de 2 Ko). Une nouvelle extension dépose son SVG ; sans fichier, la carte affiche l'initiale sur sa couleur.
- **Champs optionnels du manifeste** : `accent` (#RRGGBB), `features` (liste de phrases), `added` (AAAA-MM-JJ).
- **Activation** : formulaire `POST …/sites/<site>/<ext>/activer` (champ `retour` = `catalogue` ou `detail`) ; la désactivation passe par l'écran de confirmation existant. Moteur inchangé : état par site, journal, dépendances, données conservées.
- **Réconciliation** : `node scripts/extensions-reconcile.js [base] [--reparer]`.
- Pas de favoris : le moteur n'en possède pas.
