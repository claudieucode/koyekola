# Responsive et performance — audit 22.10

*Programme 22.10 — 2026-10-30. Légende : ✅ vérifié par un test ou une mesure exécutés ici · 🟡 vérifié par lecture/tests antérieurs (non rejoué) · ⛔ défaut constaté · ⚪ non évalué.*

## Responsive
Le responsive existe depuis les paliers 12-14 (`docs/KOLAKISA_RESPONSIVE*.md`) et 22.3 produit des variantes responsives de mise en page ; 22.8 est réalisé (`src/responsive`, 15 + 4 tests, Chrome en émulation de fenêtre aux largeurs 320 à 1920 sur des pages de test). Aucun rendu des 21 sites générés n'a été capturé sur 7 tailles d'écran dans ce programme : ⚪ **NON ÉVALUÉ pour les sites générés**. Le labo vérifie seulement la présence de la balise viewport, de media queries et d'images fluides (statique).

## Performance
- Mesures de laboratoire existantes (21.11) : 12 pages × 8 sections générées en 17,7 ms, 300 images en ~570 ms.
- Labo 22.10 : temps de réponse médian et poids HTML relevés par page (`results.json`), **serveur local**, charge variable (d'autres sessions de test tournent sur la machine) → mesures indicatives, pas des données réelles.
- 22.9 est réalisé (`src/perfEngine`) ; ses propres mesures : une page de test, machine partagée, 5 relevés, gain LCP démontré sur le profil mobile lent seulement, TBT 140 → 214 ms non expliqué, INP non mesuré, aucune donnée terrain. **Aucun LCP, INP, CLS ou score Lighthouse n'est produit ni inventé ici** pour les sites générés. ⚪ NON ÉVALUÉ.
