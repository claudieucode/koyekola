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
Voir tableau ci-dessous (rempli après exécution).

## Non exécutés / non couverts
- Propagation globale à plusieurs pages publiées via l'interface « Mettre à jour » (couverte côté service uniquement).
- Mode « supprimer composant + instances » dans le navigateur (service seulement).
- Test de performance chiffré après insertion/mise à jour (non mesuré).
- Thème sombre : non vérifié visuellement.
