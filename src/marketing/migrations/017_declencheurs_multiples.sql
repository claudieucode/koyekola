-- Marketing 017 — Déclencheurs multiples par scénario (jusqu'à 3, comme les flux d'automatisation Mailchimp).
-- `trigger_event`/`trigger_filter` restent EN PLACE (elles reflètent toujours le PREMIER déclencheur, mises à jour
-- à chaque écriture) : tout code qui les lit encore telles quelles (affichage de la liste, nœud déclencheur du
-- canevas côté « déclencheur principal ») continue de fonctionner sans changement. `triggers` (JSON, 1 à 3 entrées
-- {event, filter}) devient la source de vérité COMPLÈTE, la seule que le moteur consulte pour démarrer un passage.
-- Sans CHECK (SQLite valide mal les contraintes ajoutées après coup sur ALTER TABLE) : validé en JS, comme canvas
-- (016), popups (015) et webhooks (013) avant elle.
ALTER TABLE mk_automations ADD COLUMN triggers TEXT NOT NULL DEFAULT '[]';
UPDATE mk_automations SET triggers = json_array(json_object('event', trigger_event, 'filter', json(trigger_filter)));
