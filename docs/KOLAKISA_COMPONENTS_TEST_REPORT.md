# KOLAKISA — Composants réutilisables : rapport de tests

Seuls les tests réellement exécutés sont marqués ✅. Environnement : Chrome réel piloté par Playwright, serveur réel, SQLite de test.

## Exécutés
- `tests/composants-cycle-de-vie.test.js` — 17/17 ✅ (service : natures, brouillon/diffusion, comptes d'instances, suppression modes A et B, isolation organisation/site, atomicité, révisions).
- `tests/composants-navigateur.test.js` — 5/5 ✅ :
  1. bloc unique : aucun choix global ; annuler ne change rien ; enregistrer crée un standard
  2. plusieurs blocs : choix Standard/Global ; nom en doublon refusé ; global créé et listé
  3. insertion standard (copie) et global (instance liée) ; recherche ; renommage (identité conservée)
  4. détachement (ids uniques) et annulation
  5. suppression avec instance : deux options ; conversion en bloc indépendant ; aucune référence orpheline

## Régressions
Fichiers existants liés aux composants, exécutés après la refonte (✅ = 0 échec) :
- editeur-v3 7/7 ✅ · editeur-widgets 18/18 ✅ · site-web-entete 12/12 ✅ · site-web-entete-navigateur 7/7 ✅
- site-web-editeur 9/9 ✅ et site-web-fondations 22/22 ✅ : deux assertions mises à jour exprès, car l'ancien message de refus (« utilisé par 1 page ») est remplacé par le choix à deux options.
Suite complète du dépôt : non relancée.

## Non exécutés / non couverts
- Propagation globale à plusieurs pages publiées via l'interface « Mettre à jour » (couverte côté service uniquement).
- Mode « supprimer composant + instances » dans le navigateur (service seulement).
- Test de performance chiffré après insertion/mise à jour (non mesuré).
- Thème sombre : non vérifié visuellement.
