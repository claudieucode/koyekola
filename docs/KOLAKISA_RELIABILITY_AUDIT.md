# Fiabilité et reprise sur incident — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

| Situation | Preuve | Statut |
|---|---|---|
| Fournisseur IA indisponible / erreur / quota / réponse invalide | AI Core : routeur, quotas, journal, repli ; `ai-core` 48 tests, `ai-core-adapters` 8 (faux serveurs) ; labo : le constructeur ne casse pas sans fournisseur | 🟡 (simulé) |
| Génération interrompue / partielle | plans et tâches d'images à états ; régénération par instantanés | 🟡 |
| Sauvegarde échouée, conflit de modification | révisions de page (`revision` exigée par `saveDraft`, erreur `conflict`) ; `linking.accept` renvoie `conflict` ; tests `page-generator` | ✅ |
| Versions précédentes récupérables | instantanés 21.9 (annuler/restaurer) ; `linking.accept` prend un instantané avant d'écrire | ✅ |
| Publication échouée | refus clairs (page sans formulaire : 26 pages non publiables d'origine, message explicite) ; publication du studio avec confirmation serveur | ✅ |
| Upload interrompu / fichier invalide | type réel par signature, taille, SVG refusé (tests 21.x) | 🟡 |
| Perte de connexion, session expirée | redirection vers `/connexion` (vérifié aussi en production sur les routes 22.6) | 🟡 |
| Opération présentée comme réussie sans confirmation | aucun cas observé dans le labo ; `generate` ne publie jamais | ✅ |

**Réserves :** pas de pile d'annulation unifiée (21.9) ; aucun test de coupure réseau navigateur dans ce programme ; aucune panne de fournisseur réel éprouvée.
