-- Marketing 016 — Éditeur graphique des scénarios (canvas). Le format d'EXÉCUTION reste `steps` (inchangé,
-- automations/engine.js n'est pas touché par cette migration) : `canvas` n'est qu'une représentation d'ÉDITION
-- (nœuds + positions x/y + arêtes), traduite vers/depuis `steps` par src/marketing/automations/graph.js.
-- Vide = aucun graphe dessiné pour l'instant (les scénarios déjà créés avant cette phase sont convertis à la volée
-- à la première ouverture, jamais réécrits en base tant qu'ils ne sont pas enregistrés depuis le nouvel éditeur).
ALTER TABLE mk_automations ADD COLUMN canvas TEXT NOT NULL DEFAULT '';
