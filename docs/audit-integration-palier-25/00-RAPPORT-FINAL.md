# Palier 25 — Tests d'intégration globaux de KOLAKISA : rapport final

*Date : 2026-10-11. Branche locale `audit-parite-wp` (worktree `KOYEKOLA-audit23`). **Aucun code métier modifié** ; rien n'est poussé ni déployé. Fichiers : `01-plan-de-test.md` · `02-resultats-detailles.md` · `03-matrice-couverture-integrations.md` · `04-registre-anomalies.md` · `05-tests-non-executes-et-simules.md` · `06-plan-palier-26.md` · `resultats/` (résultats bruts). Code de test : `tests/integration-globale.test.js` (nouveau, 21 scénarios) ; générateur : `audit-integration/generer.js`.*

## 1. Résumé exécutif

- **Les moteurs de KOLAKISA échangent correctement leurs données dans les parcours testés**, en environnement de test : 21 scénarios, **177 critères vérifiés ; au premier passage 172 réussis et 5 échecs reproduits (3 anomalies) ; après les trois corrections faites ensuite (A25-02, A25-03, G-03), 177 réussis et 0 échec.**
- **Résultat par scénario** : **état final** : 16 « RÉUSSI — PREUVES COMPLÈTES » ; 0 « RÉUSSI PARTIELLEMENT » ; 5 « SIMULÉ UNIQUEMENT » (paiement avec un faux serveur Stripe, e-mail en mode « console ») ; 0 échec total ; 0 erreur d'exécution. *(Au premier passage : 14 / 3 / 4, avant la correction de A25-02, A25-03 et G-03.)*
- **Anomalies reproduites ou découvertes** : **G-03 (P1)** les rôles Éditeur, Auteur et Contributeur ne pouvaient pas créer d'article (reproduit, puis **corrigée**) ; **A25-02 (P2)** après activation, l'écran d'un scénario d'e-mail n'indiquait plus que le fournisseur « console » n'envoie rien (**corrigée**, voir `07-corrections-apres-tests.md`) ; **A25-03 (P3)** un lot de mesure sans date client rejoué était compté deux fois (**corrigée**). **Aucune P0.**
- **Robustesse** : aucun doublon sous concurrence (6 webhooks de paiement simultanés → 1 commande ; 6 envois simultanés d'un formulaire → 1 contact).
- **Non-régression** : suite complète **4 041 tests, 4 038 réussis, 0 échec, 3 ignorés**. Les 3 échecs du palier 24 ne se sont pas reproduits (cause non établie).
- **Limite principale** : **aucun test n'a touché un fournisseur réel**. Les paiements sont simulés (faux Stripe), l'e-mail est en mode « console ». Le webhook de paiement de **production** répondait 503 (palier 24) : ce palier ne le change pas. **KOLAKISA ne doit pas être déclaré prêt pour la production.**

## 2. Périmètre testé
Serveurs de test jetables (base et dossier d'envois temporaires) : CMS, Page Builder, médiathèque, apparence, SEO/URL, révisions, tunnel, formulaires, Contact Core, consentements, commentaires, automatisations avec worker réel, e-mail (fournisseur « console »), commerce avec faux Stripe, mesure d'audience, Analytics, tests A/B, permissions et isolation, pages programmées, rédaction d'articles par rôle.

## 3. Méthodologie
- **Outils** : `node:test`, `tests/helpers.js` (serveur de test, clients HTTP), faux serveur Stripe local, webhooks signés par le test avec un secret de test, lecture directe de la base de test.
- **Types** : intégration par les vraies routes (REEL-TEST) ; intégration avec faux fournisseur (SIMULE) ; concurrence (requêtes parallèles) ; refus (rôle, site, consentement, signature).
- **Enregistrement des résultats** : chaque critère est enregistré (réussi / échec / preuve) dans `resultats/resultats-scenarios.json`, écrit par l'exécution réelle (`INTEGRATION_RESULTS`). Un critère qui reproduit un défaut connu est marqué `anomalie` et enregistré « ÉCHEC REPRODUIT » sans masquer l'échec ; tout autre échec fait échouer le test.
- **Sécurité des tests** : chaque serveur est lancé avec `DATA_DIR` et `UPLOADS_DIR` temporaires, sans SMTP, sans clé réelle ; Stripe pointe vers un serveur local ; rien n'est envoyé ; aucun secret n'apparaît dans les résultats (le critère de journaux de INT-SEC-015 le vérifie).
- **Aucune modification du code métier, des migrations, des configurations ou des tests existants** ; seul fichier ajouté côté code : `tests/integration-globale.test.js` (n'est pas utilisé par le déploiement).

## 4. Plan de test
`01-plan-de-test.md` : 21 scénarios avec modules, mode de preuve, prérequis et critères.

## 5. Résultats détaillés
`02-resultats-detailles.md` : chaque critère avec sa preuve observée.

| Statut | Scénarios |
|---|---|
| RÉUSSI — PREUVES COMPLÈTES (16) | INT-CMS-001, 002, 003, 004, 006, 007 · INT-SEO-005 · INT-TUN-006, 007 · INT-CON-008, 009, 010 · INT-AUT-010 · INT-ABT-014 · INT-ANA-016 · INT-SEC-015 |
| RÉUSSI PARTIELLEMENT (0) | aucun (INT-CMS-006 passe depuis l'application du correctif G-03) |
| SIMULÉ UNIQUEMENT (5) | INT-COM-012, 013, 017, 018 · INT-EML-011 |
| ÉCHEC REPRODUIT (total) · ERREUR D'EXÉCUTION · BLOQUÉ · NON EXÉCUTÉ | aucun parmi les 21 (les non exécutés du plan sont listés au §9) |

Plan prévu au palier 24 (T01–T18), état de chacun : **réalisés (6)** T01, T02, T04, T11, T12, T14 · **réalisés en partie ou avec un faux fournisseur (7)** T03 (rôles : INT-CMS-006 et matrice du palier 23), T05 (consentement vérifié, envoi réel bloqué), T06 (exécution vérifiée, reprise après redémarrage non exécutée), T07 et T08 (faux Stripe, vrai Stripe bloqué), T09 (session expirée vérifiée, abandon de panier non exécuté), T10 (navigation vérifiée, événements de tunnel non testés ici) · **non exécutés (4)** T13, T15 (couvert par la suite existante), T16, T18 · **non applicable (1)** T17 (fonction absente). Détail au §9 et dans `05-tests-non-executes-et-simules.md`.

## 6. Matrice des intégrations
`03-matrice-couverture-integrations.md` : 27 relations. Décompte : **13 réussies (preuves complètes, en test) · 4 réussies partiellement · 4 simulées uniquement · 6 non exécutées**. « Réussie » = dans l'environnement de test, jamais en production.

## 7. Tests de non-régression
- **Suite complète** (`node --test --test-concurrency=1 "tests/*.test.js"`, sans Chrome) : **4 041 tests, 4 038 réussis, 0 échec, 3 ignorés** (`resultats/suite-complete.txt`). Inclut le nouveau fichier.
- **Chrome** : les 96 fichiers avaient été relancés un par un au palier 24 (tous verts seuls) ; **non relancés** dans ce palier : aucun code métier n'a changé depuis.
- **Syntaxe** : `node --check` sur tous les fichiers de `src`, `scripts` et `server.js` au palier 24 (0 erreur) ; aucun linter ni typage configuré. `npm audit` : voir palier 24.
- Aucun test existant n'a été supprimé, désactivé ou modifié.

## 8. Anomalies reproduites
`04-registre-anomalies.md` : **G-03 (P1, reproduit)**, **A25-02 (P2, nouvelle)**, **A25-03 (P3, nouvelle)**, 3 observations (O25-01 à O25-03).

## 9. Tests non exécutés
`05-tests-non-executes-et-simules.md`. En bref : e-mail réel et paiement réel (**bloqués**, aucun compte de test), reprise après redémarrage, abandon de panier, attribution A/B ↔ achat, webhooks Resend/Twilio signés, régression visuelle (**non exécutés**), perte de travail éditeur (**non applicable** : fonction absente).

## 10. Tests simulés
Même document, §A : INT-COM-012/013/017/018 prouvent **notre code** face à un faux Stripe (signature, idempotence, montants, accès, concurrence) mais **pas** le vrai Stripe ; INT-EML-011 prouve que le consentement décide des destinataires et que le message est enregistré, mais **pas** qu'un e-mail part ou arrive.

## 11. Risques critiques
- **Paiement** : webhook de production non configuré (503 constaté au palier 24) ; paiement réel non validé ; si la clé Stripe était active sans webhook, risque d'un paiement sans commande (G-01).
- **E-mail** : si le fournisseur de production est « console », des scénarios « réussissent » sans rien envoyer et l'écran du scénario actif ne le rappelle plus (A25-02, G-02).
- **Droits** : le blog n'était écrivable que par le créateur (G-03) ; **corrigé** — voir `07-corrections-apres-tests.md`.
- **Données** : aucune perte, aucun doublon, aucune fuite inter-sites constatés dans les parcours testés.

## 12. Plan de correction du palier 26
`06-plan-palier-26.md` : 1) visibilité de la configuration de production + rappel « console » ; 2) correctif des articles (prêt) ; 3) robustesse de la déduplication de mesure ; 4) essais réels avec comptes de test ; 5) travail non fusionné, multi-site, doublons, sauvegarde externe, 2FA. Critères de validation : INT-CMS-006 et INT-EML-011/INT-ANA-016 sans critère « anomalie », suite complète verte.

## 13. Éléments bloquants (décisions et autorisations)
1. **Comptes de test** (Stripe en mode test, fournisseur d'e-mail en bac à sable, secrets de webhook de test) : qui les fournit ? Sans eux, T05, T07–T08 et T16 restent non exécutés.
2. **Autorisation d'appliquer le correctif des articles** (`audit-parite/patch-articles-multi-auteurs.diff`) : à appliquer par toi ou à autoriser explicitement.
3. **État de production** (worker, fournisseur d'envoi, clés Stripe) : à communiquer par le propriétaire ; jamais lu par moi.
4. Décisions D1 à D10 du palier 24 (multi-site, droits du Lecteur, branches non fusionnées, tunnel avec paiement, sauvegarde externe, 2FA…).

## Chiffres de référence
- **Scénarios exécutés : 21** (état final : 16 réussis avec preuves complètes · 0 réussi partiellement · 5 simulés uniquement · 0 échec total · 0 bloqué · 0 non exécuté parmi eux). **Critères : 177 exécutés, 177 réussis, 0 en échec.** Premier passage : 172 réussis, 5 en échec.
- **Plan du palier 24 : 18 scénarios** — 6 réalisés, 7 réalisés en partie ou simulés, 4 non exécutés, 1 non applicable (voir §5).
- **Intégrations (27)** : 13 réussies, 4 partiellement, 4 simulées, 6 non exécutées.
- **Suite complète** : 4 041 tests, 4 038 réussis, 0 échec, 3 ignorés.
Ces chiffres ne sont pas des pourcentages de qualité du produit.

**Je ne corrige rien, je ne déploie rien et je ne lance pas le palier 26 : j'attends ton autorisation explicite.**
