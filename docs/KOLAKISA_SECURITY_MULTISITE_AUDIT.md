# Sécurité et isolation multisite — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

## Périmètre réellement couvert
Cet audit **s'appuie sur les tests existants** (21.11, 22.3, 22.6, palier 17, portée des routes) rejoués dans la suite complète de ce programme, et non sur un nouveau pentest. Aucun test destructif en production.

| Scénario demandé | Preuve | Statut |
|---|---|---|
| 1. Utilisateur du site A modifie une page du site B | `programme21-securite-multisite` (23 actions d'écriture inter-sites refusées), `programme22-6-…-http` (écritures hors site), `page-generator` M | ✅ |
| 2. Composant privé de B intégré dans A | tests de composants par site (palier 12 `migration-composants-revision`, portée des routes) — non rejoué en scénario dédié | 🟡 |
| 3. Médias privés d'un autre site | `programme21-securite-multisite` (métadonnées de médias), audit médias | 🟡 |
| 4. Paramètres d'un autre site | `portee-des-routes` (oracle des routes), `site-espace` | ✅ |
| 5. Génération IA hors périmètre | `programme21-securite-regen-boutique` (régénération/boutique inter-sites), `programme22-6` (`guard`, site_id dans toutes les tables `mk_ci_*`, mutation vérifiée) | ✅ |
| 6. Contournement des permissions par l'API | `forms.read` seul refusé (faille F1 du 21.11 déjà corrigée) ; lecteur sans écriture ; anonyme → connexion | ✅ |

## Résultats connus et réserves
- `npm audit --omit=dev` : 0 vulnérabilité (relevé 21.11, non relancé ici).
- Clés et secrets : chiffrés, jamais renvoyés au navigateur (tests 21.x).
- Aucun fournisseur d'IA ni Stripe réel : la sécurité de ces intégrations n'est vérifiée que contre des faux serveurs.
- Restes déclarés (21.11) : pas d'antivirus, EXIF conservés, permission `ai.use` sans rôle.
- **Aucune vulnérabilité critique ou élevée nouvelle n'a été observée dans ce programme.** Cela ne prouve pas leur absence : couverture = tests écrits par les équipes précédentes.
