-- R7 (lot 6.2) — Consommation de l'assistant IA attribuée au SITE (décision produit du 17/10/2026) : une colonne AJOUTÉE, aucune donnée existante modifiée ; le quota reste commun à l'organisation.
--   mk_ai_requests.site_id : site à l'origine de la demande (NULL = organisation / site principal / historique : TOUTES les lignes existantes, dont le site est inconnu et n'est jamais deviné).
-- Aucun prompt, aucun texte généré n'est stocké (le journal ne contient que action, résultat et tailles) : rien d'autre à cloisonner. Les clés du fournisseur (ANTHROPIC_API_KEY) sont des variables du serveur.
--
-- TRANSITION EXPLICITE (décision 2) : le studio de pages IA (`/pages/<id>/ia/proposer`) est DÉJÀ utilisable aujourd'hui par les membres d'un site sur les pages de leur site. Pour qu'aucun site existant ne perde cette
-- fonction par la seule introduction de l'activation, le module « ai » est activé UNE FOIS, ici, pour les sites existants (non supprimés) qui ont au moins un membre. Les sites créés ensuite restent désactivés par
-- défaut. Cette activation (qui ouvre aussi l'aide à la rédaction e-mail et SMS aux membres de ces sites) se révoque site par site (écran « Modules ») ou en bloc par la commande de retour arrière ci-dessous.
-- Retour arrière (hors production, après sauvegarde) : UPDATE mk_site_modules SET enabled = 0 WHERE module = 'ai' ; DROP INDEX idx_mk_ai_requests_site ; ALTER TABLE mk_ai_requests DROP COLUMN site_id.

ALTER TABLE mk_ai_requests ADD COLUMN site_id INTEGER;
CREATE INDEX idx_mk_ai_requests_site ON mk_ai_requests(organization_id, site_id, created_at) WHERE site_id IS NOT NULL;

INSERT OR IGNORE INTO mk_site_modules (site_id, organization_id, module, enabled)
SELECT s.id, s.organization_id, 'ai', 1 FROM mk_sites s
WHERE s.deleted_at IS NULL AND EXISTS (SELECT 1 FROM mk_site_members m WHERE m.site_id = s.id);
