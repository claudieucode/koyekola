# 10 — Plan d'implémentation : fait et reste à faire

## Fait dans cette mission

| Phase | Contenu | Preuve |
|---|---|---|
| 1. Audit initial | deux audits de code indépendants (modules 1–11, 12–21), tests existants rejoués | `00a_…`, `00b_…` (46 fichiers de tests, 1 023 / 1 024 verts pour les modules 1–11) |
| 2. Référence Mailchimp | inventaire en deux parties (≈ 108 + ≈ 110 fonctions), avec lacunes | `01a_…`, `01b_…` |
| 3. Écarts et architecture | matrice par module, décisions | `08_GAP_ANALYSIS.md`, `09_ARCHITECTURE.md` |
| 4. Socle | correction des défauts d'intégrité, de sécurité, de conformité vérifiés dans le code | `08_GAP_ANALYSIS.md` (tableau des défauts) |
| 5. Modules | valeur probante des tests A/B ; pause automatique de réputation ; contrôle HTTP des liens | `02_FUNCTIONAL_SPECIFICATIONS.md` F1–F3 |
| 6. Intégrations externes | état réel et prérequis de chaque connecteur ; aucune intégration factice | `04_API_AND_INTEGRATIONS.md` |
| 7. Validation | tests ciblés puis suite complète hors navigateur | `11_TEST_STRATEGY.md` |
| 8. Parité | comparaison honnête avec Mailchimp | `14_FINAL_PARITY_REPORT.md` |
| 9. Livraison | migration additive 110, sauvegarde, retour arrière | `12_OPERATIONS_AND_DEPLOYMENT.md` |

## Reste à faire, par ordre de priorité

1. **Première campagne réelle contrôlée** (domaine vérifié, Resend, webhook de retour) : c'est la seule façon de valider la délivrabilité. Prérequis dans `07_DELIVERABILITY.md`.
2. **Décisions de produit** à prendre avant de coder : reclasser les relances d'engagement en marketing ; réactiver une fiche archivée sur consentement ; vendre ou non l'accès à l'outil (facturation).
3. **Ré-entrée dans un scénario** puis **déclencheur calendaire** (anniversaires, rappels datés) : conception de la ré-entrée dans `08_GAP_ANALYSIS.md`.
4. **Sécurité secondaire** : confirmation du numéro SMS, idempotence SMS, rotation du secret de webhook, CAPTCHA, limiteur partagé.
5. **Éditeur** : texte brut éditable, contrôle d'accessibilité complet, historique d'annulation conservé.
6. **Statistiques** : une seule source de chiffres, marquage des ouvertures automatiques, rebonds mous.
7. **Programmation** : fuseau de l'organisation à la saisie, replanification.
8. **Bibliothèque** : modèles sectoriels, blocs formation / coupon / articles / sondage dans les modèles de départ.
9. **Rétention** : purge des événements d'e-mail et des travaux « dead » selon une durée à fixer.
10. **Connecteurs de boutiques externes** si la demande existe (étudier l'API et obtenir un compte de test d'abord).

## Reprise du travail

Branche `feat/email-marketing` (fusionnée avec `main` au moment du déploiement). Point d'entrée : lire `08_GAP_ANALYSIS.md` puis `13_KNOWN_LIMITATIONS.md`. Chaque correction a un fichier de test nommé dans `08_GAP_ANALYSIS.md`.
