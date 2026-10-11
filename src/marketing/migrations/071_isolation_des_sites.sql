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

-- Changer une page de site ne doit pas laisser de lien vers l'ancien site : étape de tunnel, page parente, pages enfants, page d'accueil.
-- (Le serveur retire d'abord ces liens ou refuse le déplacement ; ce déclencheur est le filet de la base si un autre chemin d'écriture passait à côté.)
CREATE TRIGGER mk_landing_pages_move_keeps_links BEFORE UPDATE OF site_id ON mk_landing_pages
WHEN NEW.site_id IS NOT OLD.site_id AND (
     EXISTS (SELECT 1 FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE s.page_id = OLD.id AND f.site_id IS NOT NEW.site_id)
  OR EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = OLD.parent_id AND p.site_id IS NOT NEW.site_id)
  OR EXISTS (SELECT 1 FROM mk_landing_pages c WHERE c.parent_id = OLD.id AND c.site_id IS NOT NEW.site_id)
  OR EXISTS (SELECT 1 FROM mk_sites h WHERE h.home_page_id = OLD.id AND h.id IS NOT NEW.site_id))
BEGIN SELECT RAISE(ABORT, 'site différent : cette page est liée (tunnel, page parente ou enfant, page d''accueil) à son site actuel'); END;

-- Changer le site d'un tunnel : toutes ses étapes doivent utiliser des pages du nouveau site
CREATE TRIGGER mk_funnels_move_keeps_steps BEFORE UPDATE OF site_id ON mk_funnels
WHEN NEW.site_id IS NOT OLD.site_id AND EXISTS (SELECT 1 FROM mk_funnel_steps s JOIN mk_landing_pages p ON p.id = s.page_id WHERE s.funnel_id = OLD.id AND p.site_id IS NOT NEW.site_id)
BEGIN SELECT RAISE(ABORT, 'site différent : les étapes de ce tunnel utilisent des pages de son site actuel'); END;
