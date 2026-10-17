-- R7 (lot 6.2) — Consommation de l'assistant IA attribuée au SITE (décision produit du 17/10/2026) : une colonne AJOUTÉE, aucune donnée existante modifiée ; le quota reste commun à l'organisation.
--   mk_ai_requests.site_id : site à l'origine de la demande (NULL = organisation / site principal / historique : TOUTES les lignes existantes, dont le site est inconnu et n'est jamais deviné).
-- Aucun prompt, aucun texte généré n'est stocké (le journal ne contient que action, résultat et tailles) : rien d'autre à cloisonner. Les clés du fournisseur (ANTHROPIC_API_KEY) sont des variables du serveur.
--
-- Cette migration ne pose AUCUNE ligne d'activation. La transition du module « ai » pour les sites qui utilisaient déjà le studio de pages IA (décision 2, option A) est faite UNE FOIS par
-- src/marketing/transitions.js (critères techniques explicites, repère `schema_migrations(scope = 'transition', version = '086')`) : elle a besoin des droits RÉELS des membres (rôles personnalisés,
-- compte actif, appartenance à l'équipe), que le SQL d'une migration ne peut pas évaluer de façon fiable. Voir docs/r7-contacts-par-site-2026-10-16/11-rapport-R7-lot-6-2-transition-ia.md.
-- Retour arrière (hors production, après sauvegarde) : DROP INDEX idx_mk_ai_requests_site ; ALTER TABLE mk_ai_requests DROP COLUMN site_id ; et, si la transition a eu lieu,
-- UPDATE mk_site_modules SET enabled = 0 WHERE module = 'ai' ; DELETE FROM schema_migrations WHERE scope = 'transition' AND version = '086'.

ALTER TABLE mk_ai_requests ADD COLUMN site_id INTEGER;
CREATE INDEX idx_mk_ai_requests_site ON mk_ai_requests(organization_id, site_id, created_at) WHERE site_id IS NOT NULL;
