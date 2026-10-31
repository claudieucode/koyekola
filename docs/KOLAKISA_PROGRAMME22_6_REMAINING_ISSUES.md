# Programme 22.6 — points restants (état honnête)

## Demandé et NON fait
1. ~~hreflang absent du `<head>`~~ **Corrigé** (`tests/programme22-6-hreflang-head.test.js`). Reste : `x-default`, articles de blog.
2. **Couverture sémantique** (sous-thèmes, entités, questions manquantes) : non implémentée. Elle demande une IA configurée ou une source de données ; ni l'une ni l'autre n'est vérifiée.
3. **Aucun connecteur de recherche de mots-clés** (volumes, difficulté) : volontairement, car aucune source réelle n'est configurée. SEMrush/Ahrefs : ni intégrés ni simulés.
4. **Traitement asynchrone** : évaluations synchrones et mises en cache (quelques ms par page, 200 pages au plus par tableau de bord). Pas de file de travail ; un site de plusieurs milliers de pages demanderait d'en ajouter une.
5. ~~Interface en lecture seule pour plusieurs réglages~~ **Corrigé** : faits, marché, genre de page, mots-clés (saisie manuelle, suppression) et liaison des traductions se saisissent dans l'écran (testé dans Chrome). Reste : la provenance « API externe » n'est pas saisissable (volontaire).
6. ~~Assistant d'optimisation~~ **Branché dans l'écran « Contenu et SEO »** (onglet « Analyse d'une page ») : 14 actions, proposition avant/après, accepter (avec confirmation expresse si le périmètre s'étend) ou refuser, annulation et historique par « Modifier avec l'IA et historique ». **Reste : pas de menu contextuel sur une sélection DANS l'éditeur visuel** (travail sur l'éditeur de blocs, hors de ce palier). Sans fournisseur d'IA configuré l'action affiche un message et ne modifie rien (testé) ; le rendu réel d'une proposition n'a été vérifié qu'avec un faux fournisseur (tests HTTP).
7. **Blog Studio** : pas de bouton d'évaluation ; l'API `evaluer-texte` est prête, non branchée dans l'éditeur d'articles. Les articles du blog (table `posts`, base centrale) ne sont pas dans le tableau de bord d'un site.
8. ~~Constructeur 21.8~~ **Corrigé** : `workspace.applyPages` joint le contrôle éditorial (`editorial` : éléments à compléter, compteurs) au résultat et l'étape « Pages » l'affiche (rien n'est modifié ni inventé). Un échec du contrôle n'empêche jamais l'application des pages.
9. **Termes « à privilégier »** de la voix : non contrôlés (seuls les termes « à éviter » le sont).

## Échecs préexistants constatés (hors périmètre)
8 tests navigateur échouent sur `origin/main` indépendamment de 22.6 (menu d'un site : `seo-site-outils-navigateur`, `site-espace-navigateur`, `site-menu-c1-navigateur`). Ils décrivent un menu qui a changé depuis leur écriture. À traiter par la session propriétaire du menu.

## Limites de méthode
- Intention de recherche : règles lexicales fr/en/es, **estimation**, pas une mesure. Lisibilité : formules validées pour le français et l'anglais seulement.
- Originalité : comparaison avec les autres pages du **même site** uniquement.
- Détection des formules creuses : liste courte, orientée français.
- Les liens acceptés ne s'insèrent que dans une section « texte » (Markdown), à la première occurrence trouvée.

## Vérifications non faites
- **Aucun fournisseur d'IA réel** n'a été appelé : les tests utilisent une IA simulée.
- **Migrations** : aucune (tables à la demande) ; création vérifiée sur base de test, **non vérifiée en production** avant le déploiement.
- **Navigateur réel** : le script de l'écran passe `node --check` et est servi (test HTTP) mais l'interaction (onglets, boutons accepter/refuser) n'a pas été exécutée dans Chrome par un test automatisé.
- **Lint, typecheck, build** : aucun script de ce type n'existe dans le dépôt pour ce code ; seul `node --check` a été exécuté. La suite complète `npm test` n'a pas été lancée.
- Les chiffres de **trafic, position et clics** ne sont affichés nulle part (aucune source connectée à ce niveau).

## Suites possibles
menu contextuel dans l'éditeur ; appel automatique de `review` par le constructeur ; connecteur de mots-clés quand un fournisseur est choisi et autorisé.
