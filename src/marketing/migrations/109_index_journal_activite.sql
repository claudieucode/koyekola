-- Journal d'activité : index pour les filtres de l'écran (période, action, acteur) et le tri par identifiant sous filtre. Migration ADDITIVE (index seulement ; aucune ligne touchée,
-- l'écriture seule de la migration 001 est inchangée). Annulation : DROP INDEX de chacun des index ci-dessous.
CREATE INDEX IF NOT EXISTS idx_mk_audit_created ON mk_audit_logs (organization_id, created_at, id);
CREATE INDEX IF NOT EXISTS idx_mk_audit_action ON mk_audit_logs (organization_id, action, id DESC);
CREATE INDEX IF NOT EXISTS idx_mk_audit_user ON mk_audit_logs (organization_id, user_id, id DESC) WHERE user_id IS NOT NULL;
