# Plan de correction du palier 26 (préparé, NON exécuté) — mis à jour après les tests d'intégration

Il complète `docs/audit-global-palier-24/07-plan-palier-26-corrections-transversales.md` avec ce que le palier 25 a confirmé ou découvert. **Aucune correction n'est lancée sans ton autorisation.**

| Rang | Groupe (cause racine) | Anomalies | Ce que le palier 25 a ajouté | Critère de validation |
|---|---|---|---|---|
| 1 | Configuration de production invérifiable | G-01, G-02, A25-02 | Le worker et le pont fonctionnent en test (INT-AUT-010, INT-COM-013) : le problème est **la visibilité**, pas le code. Découvert : l'écran d'un scénario actif ne rappelle plus que « console » n'envoie rien (A25-02) | Écran d'état : worker, fournisseur, webhook ; l'avertissement « console » reste affiché sur les scénarios actifs ; URL de santé |
| 2 | Droits d'écriture des articles | G-03 | Reproduit par INT-CMS-006 (3 critères en échec) ; correctif prêt (`audit-parite/patch-articles-multi-auteurs.diff`) validé en copie jetable | INT-CMS-006 passe sans critère « anomalie » ; `cms-articles-multi-auteurs` vert |
| 3 | Mesure d'audience robuste | A25-03 | Un lot sans date client rejoué est compté deux fois (le vrai script envoie la date, donc pas d'effet pour les navigateurs) | Le serveur dérive une clé de déduplication indépendante de l'heure d'arrivée, ou borne les rejeux ; INT-ANA-016 sans anomalie |
| 4 | Essais réels avec comptes de test | T05–T09, T16 | Plan prêt (voir 05) ; débloqué seulement si le propriétaire fournit des comptes de test | Scénarios exécutés en bac à sable : états « accepté » / « livré » observés |
| 5 | Travail non fusionné, multi-site, doublons, sauvegarde externe, 2FA | G-04, G-05, G-07, G-09, G-11 | Inchangés (hors périmètre des tests de ce palier) | Voir plan du palier 24 |

Ordre conseillé : 1 → 2 → 3 (petits, bornés) puis 4 (dépend de toi), puis 5 selon les décisions D1–D10 du palier 24.

**Tests de non-régression requis pour chaque groupe** : `tests/integration-globale.test.js` (21 scénarios), suite complète, matrice de permissions (`audit-parite/sonde-permissions.js`), `tests/audit-corrections.test.js` après toute migration.
