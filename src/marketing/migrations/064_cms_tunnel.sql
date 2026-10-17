-- Marketing 064 — CMS ↔ Tunnel (palier 18). AJOUTS UNIQUEMENT.
--  - mk_funnels.site_id : contexte de site du tunnel (NULL = site principal / organisation, comme avant). Une étape ne référence qu'une page du MÊME site.
--  - mk_funnel_steps.settings : réglages de contexte de l'ÉTAPE (JSON : noindex, hideFooter, goal) — jamais écrits dans la page CMS elle-même.
-- Le contenu d'une étape reste dans la page CMS (mk_landing_pages) : l'étape ne stocke qu'une référence (page_id, déjà présente).
ALTER TABLE mk_funnels ADD COLUMN site_id INTEGER REFERENCES mk_sites(id);
ALTER TABLE mk_funnel_steps ADD COLUMN settings TEXT NOT NULL DEFAULT '{}';
CREATE INDEX idx_mk_funnels_site ON mk_funnels(site_id) WHERE site_id IS NOT NULL;

-- Droits propres aux tunnels (jusqu'ici partagés avec les formulaires). Les rôles personnalisés existants gardent exactement ce qu'ils pouvaient faire.
UPDATE mk_roles SET permissions = json_insert(permissions, '$[#]', 'funnels.read')
  WHERE EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'forms.read') AND NOT EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'funnels.read');
UPDATE mk_roles SET permissions = json_insert(permissions, '$[#]', 'funnels.write')
  WHERE EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'forms.write') AND NOT EXISTS (SELECT 1 FROM json_each(mk_roles.permissions) WHERE value = 'funnels.write');
