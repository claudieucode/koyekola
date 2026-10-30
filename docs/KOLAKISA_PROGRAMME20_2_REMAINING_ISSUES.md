# Programme 20.2 — Points restants

## Défauts existants sur `main`, hors périmètre (10 tests en échec, reproduits sans les modifications du programme)
Registre de menu des sites : `site-menu-c1.test.js`, `site-menu-c1-unitaire.test.js`, `site-menu-p1a-unitaire.test.js`, `entrees-fermees-preuves.test.js`, `portee-des-routes.test.js`. Ils attendent 68, 70 ou 75 entrées de registre ; le registre actuel diffère (l'écart vient d'un autre chantier). À reprendre avant tout travail sur la navigation des sites. Autres échecs reproduits sans les modifications : `cms-urls` (redirections), `effacer-donnees` (e-mail non envoyé), `sante-du-site` (instable à l'enchaînement, vert seul).

## Fonctions de la spécification non réalisées
- Langue, pays, fuseau, identité graphique à la création : colonnes absentes de `mk_sites`.
- Création à partir d'un modèle de site : absent (la duplication existe).
- Lien public « Voir le site » dans la liste : sans adresse publique fiable pour un site sans domaine.
- Rôle propriétaire par site, organisations multiples, slugs de formations par site : voir `KOLAKISA_ADMIN_MULTISITE.md` §6.

## Non vérifié
Rendu d'un domaine réel (DNS, HTTPS), prévisualisation = rendu public dans un navigateur réel, clic réel sur la double soumission, Firefox et Safari.

## Pour le Programme 20.3
Corriger les tests de registre de menu, puis décider des champs de création (langue, fuseau…) avec une migration dédiée.
