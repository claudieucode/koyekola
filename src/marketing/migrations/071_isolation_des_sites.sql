-- Palier 2 — isolation des sites : garde-fous DANS LA BASE (en plus des contrôles du serveur) contre l'association de données de deux sites différents.
-- Additif : aucun déclencheur ne modifie ni ne supprime de donnée ; ils ne s'appliquent qu'aux écritures FUTURES (les lignes existantes ne sont pas revérifiées).
-- Convention inchangée : site_id NULL = site principal. « Même site » veut donc dire « même valeur, NULL compris » (opérateur IS).
-- Retour arrière : DROP TRIGGER pour chacun des déclencheurs ci-dessous.

-- Une étape de tunnel n'utilise qu'une page du MÊME site que le tunnel
CREATE TRIGGER mk_funnel_steps_same_site_insert BEFORE INSERT ON mk_funnel_steps
WHEN NEW.page_id IS NOT NULL AND (SELECT site_id FROM mk_landing_pages WHERE id = NEW.page_id) IS NOT (SELECT site_id FROM mk_funnels WHERE id = NEW.funnel_id)
BEGIN SELECT RAISE(ABORT, 'site différent : une étape de tunnel ne peut utiliser qu''une page du même site'); END;
CREATE TRIGGER mk_funnel_steps_same_site_update BEFORE UPDATE OF page_id, funnel_id ON mk_funnel_steps
WHEN NEW.page_id IS NOT NULL AND (SELECT site_id FROM mk_landing_pages WHERE id = NEW.page_id) IS NOT (SELECT site_id FROM mk_funnels WHERE id = NEW.funnel_id)
BEGIN SELECT RAISE(ABORT, 'site différent : une étape de tunnel ne peut utiliser qu''une page du même site'); END;

-- La page parente d'une page est du même site
CREATE TRIGGER mk_landing_pages_parent_same_site_insert BEFORE INSERT ON mk_landing_pages
WHEN NEW.parent_id IS NOT NULL AND (SELECT site_id FROM mk_landing_pages WHERE id = NEW.parent_id) IS NOT NEW.site_id
BEGIN SELECT RAISE(ABORT, 'site différent : la page parente doit être du même site'); END;
CREATE TRIGGER mk_landing_pages_parent_same_site_update BEFORE UPDATE OF parent_id ON mk_landing_pages
WHEN NEW.parent_id IS NOT NULL AND (SELECT site_id FROM mk_landing_pages WHERE id = NEW.parent_id) IS NOT NEW.site_id
BEGIN SELECT RAISE(ABORT, 'site différent : la page parente doit être du même site'); END;

-- La page d'accueil d'un site est une page de CE site
CREATE TRIGGER mk_sites_home_same_site BEFORE UPDATE OF home_page_id ON mk_sites
WHEN NEW.home_page_id IS NOT NULL AND (SELECT site_id FROM mk_landing_pages WHERE id = NEW.home_page_id) IS NOT NEW.id
BEGIN SELECT RAISE(ABORT, 'site différent : la page d''accueil doit être une page de ce site'); END;
