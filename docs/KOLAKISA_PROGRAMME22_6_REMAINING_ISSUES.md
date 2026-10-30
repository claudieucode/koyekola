# Programme 22.6 — points restants (état honnête)

## Demandé et NON fait
1. **hreflang absent du `<head>` public.** Relations, validation et calcul des balises existent (`i18n.alternates`), mais `seo/resolver.js` n'émet rien : modification volontairement reportée (risque sur toutes les pages publiques).
2. **Couverture sémantique** (sous-thèmes, entités, questions manquantes) : non implémentée. Elle demande une IA configurée ou une source de données ; ni l'une ni l'autre n'est vérifiée.
3. **Aucun connecteur de recherche de mots-clés** (volumes, difficulté) : volontairement, car aucune source réelle n'est configurée. SEMrush/Ahrefs : ni intégrés ni simulés.
4. **Traitement asynchrone** : évaluations synchrones et mises en cache (quelques ms par page, 200 pages au plus par tableau de bord). Pas de file de travail ; un site de plusieurs milliers de pages demanderait d'en ajouter une.
5. **Interface en lecture seule pour plusieurs réglages** : faits de l'entreprise, marché, genre de page, mots-clés, liaison des traductions ne se saisissent que par l'API (routes `POST …/contenu-seo/api/…`, testées). L'écran affiche, analyse, et accepte/refuse les liens.
6. **Assistant d'optimisation dans l'éditeur visuel** : les 14 actions sont des demandes vers la régénération 21.9 (`POST …/api/optimiser`) ; il n'y a **pas de menu contextuel « sélection → action » dans l'éditeur** : l'acceptation, le refus et l'annulation se font dans l'écran 21.9.
7. **Blog Studio** : pas de bouton d'évaluation ; l'API `evaluer-texte` est prête, non branchée dans l'éditeur d'articles. Les articles du blog (table `posts`, base centrale) ne sont pas dans le tableau de bord d'un site.
8. **Constructeur 21.8** : n'appelle pas automatiquement `review` après génération (voir `KOLAKISA_AI_WEBSITE_BUILDER_CONTENT_INTEGRATION.md`).
9. **Termes « à privilégier »** de la voix : non contrôlés (seuls les termes « à éviter » le sont).

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
Émettre hreflang dans le `<head>` ; formulaires de saisie sur l'écran ; menu contextuel dans l'éditeur ; appel automatique de `review` par le constructeur ; connecteur de mots-clés quand un fournisseur est choisi et autorisé.
