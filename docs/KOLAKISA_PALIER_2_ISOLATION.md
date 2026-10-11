# KOLAKISA — Palier 2 : contexte de site et isolation des données (rapport actualisé)

## 1. État initial (vérifié)
SQLite (pas de Supabase : pas de RLS) ; une organisation ; `mk_sites` + `mk_site_members` ; Palier 1 en place (migration 070) ; contrôle d'accès par adresse dans `src/marketing/web/index.js`, avec refus par défaut des écrans non rattachés à un site pour un accès limité à un site.

Failles réelles trouvées par les tests d'accès croisé (corrigées) :
1. un accès limité au site A pouvait déplacer sa page vers le site B ou le site principal (champ `site_id` du formulaire) ;
2. une page du site A pouvait embarquer un composant propre au site B ;
3. (trouvées au contrôle des déclencheurs) déplacer une page laissait des liens vers l'ancien site : étape de tunnel, page parente / enfants, page d'accueil, variante d'en-tête propre à l'ancien site, expériences A/B ; et réserver un composant global à un site était possible s'il servait d'en-tête à un autre site.

## 2. Protections réellement actives
**Serveur** (`src/services/siteContext.js`, `web/index.js`, `web/landing.js`, `pages/index.js`)
- Contexte de site calculé à chaque requête (`req.mk.site`, `req.mk.siteContext`) : existence, état (supprimé / archivé), accès. Aucune variable partagée.
- `ctx.canOn(site, permission)` : toute opération touchant un second site (déplacement) exige les droits sur la destination.
- Composant propre à un site : insérable seulement dans une page du même site (enregistrement, import, déplacement) ; réservation d'un composant global refusée s'il est utilisé ailleurs (pages, en-tête / pied de page, variantes).
- Déplacement d'une page : refusé si elle est étape d'un tunnel d'un autre site ; sinon retire proprement parent / enfants / accueil / variante d'en-tête, et aligne les expériences A/B.

**Base de données — 7 déclencheurs (migration 071, additive)**
| Déclencheur | Interdit |
|---|---|
| `mk_funnel_steps_same_site_insert/update` | étape de tunnel ↔ page d'un autre site |
| `mk_landing_pages_parent_same_site_insert/update` | page parente d'un autre site |
| `mk_sites_home_same_site` | page d'accueil d'un autre site |
| `mk_landing_pages_move_keeps_links` | changer le site d'une page liée (étape, parent, enfant, accueil) |
| `mk_funnels_move_keeps_steps` | changer le site d'un tunnel dont les étapes sont d'un autre site |
Vérifié : chaque chemin d'écriture existant (`funnels/index.js`, `cmsPages.setParent`, `pages.movePage/setHomePage/duplicatePage/createPage`, `updateComponent`) a été relu ; les opérations légitimes passent (suite complète). Ils ne couvrent PAS : les composants (JSON dans les sections : contrôle serveur seulement), les listes / segments / campagnes (contrôlés par `siteScope` du moteur d'e-mailing).

## 3. Caches (audit)
| Cache | Contenu | Risque entre sites | Verdict |
|---|---|---|---|
| Domaines (`services/urls.js`, 5 s) | domaine → site, accueil, nom | un ancien domaine pourrait servir un site | invalidé à chaque changement de domaine, accueil, archivage, restauration, suppression, déplacement, renommage (2 invalidations manquantes ajoutées : renommage et mise à la corbeille de l'accueil). Testé : effet immédiat |
| Redirections (`seo/redirects.js`) | source → cible, site | redirection d'un site appliquée à un autre | la redirection n'est appliquée que sur le domaine de son site ; testé |
| Rôles (`cmsAccess`) | définition des rôles | — | pas de données de site ni d'utilisateur ; les droits effectifs sont relus en base à chaque requête (retrait d'accès immédiat, testé) |
| `apCache`, `menus` (`locals.js`) | par requête | — | durée = une requête |
| Pages publiques | HTTP | cache partagé (CDN/proxy) | `Cache-Control: no-store` (pages `/p`) / `private, no-cache` (autres) ; testé |
| Réglages SEO, dimensions d'images, empreintes de fichiers | globaux au site principal / aux fichiers | — | pas de donnée privée de site |
Aucun autre cache serveur propre à un site n'a été trouvé (recherche des `Map` / `WeakMap` / `cache` dans `src/`). Non audité : cache éventuel du serveur d'hébergement (Hostinger) devant l'application — les en-têtes ci-dessus l'excluent pour les pages dynamiques.

## 4. Données : audit sur une copie
- **Base de production : non accessible depuis cette session, aucun audit n'a été fait dessus.** La base locale `data/KOYEKOLA.db` est vide.
- Outils livrés : `scripts/copie-base-audit.js <source> <copie>` (copie cohérente par `VACUUM INTO`, source en lecture seule, refuse d'écraser, vérifie l'intégrité et les nombres de lignes) puis `scripts/audit-sites.js <copie>` (lecture seule, code 1 si anomalie).
- Exécution réelle sur une copie d'une base **représentative construite pour l'occasion** (serveur migré 001→071, 3 sites, 9 pages, tunnel, composant, listes + 5 anomalies « d'avant » simulées) : copie fidèle (intégrité ok, 155 tables, 0 écart), refus d'écraser vérifié, les 5 anomalies détectées, rien modifié.
| Anomalie détectée | Cause probable en production | Correction (jamais automatique) |
|---|---|---|
| Étape de tunnel → page d'un autre site | page déplacée après coup, avant le palier 2 | décider : détacher l'étape ou déplacer la page ; l'application la signale déjà comme étape cassée |
| Page dont le parent est d'un autre site | déplacement de page avant le palier 2 | mettre `parent_id` à NULL |
| Accueil d'un site = page d'un autre site | idem | mettre `home_page_id` à NULL |
| Page contenant un composant d'un autre site | composant réservé après coup | rendre le composant global ou retirer l'instance |
| Page en ligne dans un site archivé/supprimé | archivage avant la mise hors ligne automatique | mettre la page hors ligne |
Références orphelines : 0 (les clés étrangères sont actives, elles empêchent ce cas).
**Action manuelle requise** : lancer ces deux scripts sur une copie de la production et m'envoyer la sortie ; chaque ligne signalée sera examinée avec vous avant toute correction.

## 5. Tests
Détail au §7 du message de rapport (résultats mis à jour à la fin de la suite complète). Fichiers : `tests/isolation-des-sites.test.js` (isolation, contexte, déclencheurs, cas limites, migration, audit), `tests/isolation-des-sites-caches.test.js` (caches, domaines, redirections, permissions, requêtes simultanées).

## 6. Test instable `marketing-interface-5` (« parcours réel avec le worker »)
- Cause trouvée : le test attend que le message passe à `sent`, puis lit tout de suite le passage du scénario ; le worker écrit le message `sent` AVANT de marquer le passage `completed` (deux écritures successives) : sous charge, le test lit l'état intermédiaire `running`. Reproduit sous charge (1 échec sur 3, message exact `'running' ≠ 'completed'`).
- Rapport avec les sites : aucun dans le code (le worker et le moteur d'automatisations ne sont pas modifiés). Mesure sous charge identique : 0/12 échecs sur la version d'avant le palier 2 et 0/12 sur la version avec palier 2 : l'échec est rare dans les deux cas, donc ces chiffres ne le démontrent pas ; la preuve est l'analyse de la cause.
- Correction : le test attend maintenant la fin du passage (`completed`) comme il attend déjà celle du message.
- Risque résiduel : d'autres tests qui lisent deux écritures successives du worker pourraient avoir la même fragilité ; non recherchés.

## 7. Limites du périmètre (non isolé, état actuel documenté)
| Donnée | État réel aujourd'hui | Risque pour le Palier 3 |
|---|---|---|
| Articles `posts` | aucune colonne de site ; sur le domaine d'un site, le blog principal n'est plus servi (404, voir §10) | blog PROPRE à chaque site à construire ; unicité du slug globale |
| Catégories / étiquettes | globales, unicité `(taxonomy, slug)` globale | fusion involontaire entre sites |
| Commentaires | suivent l'article | idem articles |
| Médias `media` / `mk_media` | par organisation, sans site ; deux tables | un site voit et utilise les fichiers des autres |
| Formulaires `mk_forms`, prospects | par organisation | un formulaire d'un site utilisable sur un autre |
| Modèles de pages `mk_page_templates` | par organisation | idem |
| Réglages SEO `seo_settings` / `seo_meta` | globaux au site principal | métadonnées partagées |
| Contacts et consentements | par organisation (`origin_site_id` seulement) ; **conservés tels quels, décision métier requise** | un désabonnement vaut pour tous les sites |
Rien n'a été rattaché artificiellement au site principal ; aucune colonne n'a été ajoutée à ces tables.

## 8. Fichiers
Créés : `src/services/siteContext.js`, `src/marketing/migrations/071_isolation_des_sites.sql`, `scripts/audit-sites.js`, `scripts/copie-base-audit.js`, `tests/isolation-des-sites.test.js`, `tests/isolation-des-sites-caches.test.js`, ce rapport.
Modifiés : `src/marketing/web/index.js`, `web/landing.js`, `src/marketing/pages/index.js`, `tests/cms-tunnel.test.js`, `tests/marketing-interface-5.test.js`.
Migrations : 070 (Palier 1) et 071 (Palier 2) — jamais appliquées en production ; additives.
Retour arrière : `DROP TRIGGER` pour les 7 déclencheurs ; le code serveur se retire avec le commit.

## 9. Contrôles de compilation / types / lint
Le projet n'a ni lint ni vérification de types. `node --check` sur tous les fichiers JS modifiés : OK. Les scripts de build (`build:editor`, `build:automation-flow`) ne dépendent d'aucun fichier modifié et n'ont pas été relancés.

## 10. Blog du site principal sur le domaine d'un autre site (traité au palier 2)
**Cause (vérifiée)** : `siteHost.siteRouting` ne réécrit que `/` et `/<adresse>` ; tous les autres routeurs Express (`blog`, `courses`, catalogue, pages éditoriales, panier…) sont montés globalement et ne regardent jamais `req.kwSite`. Donc n'importe quel chemin demandé sur n'importe quel nom de domaine atteint les routeurs du site principal. De plus, `attachSite` n'associe un domaine qu'aux sites ACTIFS : le domaine d'un site archivé ou supprimé retombait sur le site principal.
**Nature du défaut** : problème de routage / d'identité, pas une fuite de données privées. Seul du contenu déjà public sur le site principal était servi (les brouillons, articles privés ou programmés restent filtrés par les routes : testé). Conséquences réelles : contenu dupliqué sous un autre domaine (SEO), mélange d'identités, domaine retiré qui affiche le site principal.
**Correction (sans refonte du CMS)** : `siteHost.siteIsolation` (monté avant les routeurs) :
- sur le domaine d'un site actif : `/blog`, `/cours`, `/catalogue`, `/categorie`, `/a-propos`, `/faq`, `/feed`, `/recherche`, `/panier`, `/favoris`, `/formation(s)` répondent 404 (mêmes chemins en majuscules ou avec barre finale : redirigés puis 404) ; restent servis : les pages du site, fichiers statiques, `robots.txt` et plan du site (adaptés au site, testé : ne listent rien du site principal), formulaires et suivi, connexion / comptes (communs à la plateforme), `/sante` ;
- sur le domaine d'un site archivé ou supprimé : 404 partout (sauf `/sante`) ; un domaine repris par un autre site actif sert ce site.
**Tests** (`tests/isolation-des-sites-caches.test.js`) : témoin (le site principal sert toujours son blog, sans brouillon), 14 chemins × domaine de site, variantes d'écriture, plan du site / robots, domaine archivé, restauré, repris, domaine inconnu.
**Résiduel (non corrigé, choix explicite)** : (1) un nom de domaine simplement pointé vers le serveur mais NON enregistré dans un site sert encore le site principal (comportement d'origine ; le corriger exigerait de refuser tout hôte inconnu, risquant de casser l'accès légitime — à décider : liste des hôtes autorisés) ; (2) `/contact`, `/cookies`, connexion / inscription restent communs ; (3) le blog PROPRE à un site (articles rattachés à un site) est le Palier 3.

## 11. Mise à niveau d'une base existante (testée)
Essai réel : base créée par la version précédente (jusqu'à la migration 070) avec données et une incohérence « ancienne », puis démarrée par le nouveau code. Résultats : migration 071 appliquée une fois ; **aucune table n'a changé de nombre de lignes** (seule `schema_migrations` gagne 1 ligne) ; l'incohérence ancienne est CONSERVÉE (rien n'est corrigé ni supprimé) ; 7 déclencheurs présents ; intégrité ok ; une **sauvegarde automatique AVANT migration** est créée (`data/backups/AVANT-MIGRATION-…-v071.db`). La migration ne contient que des `CREATE TRIGGER` (aucun `DELETE`, `UPDATE`, `DROP` de donnée). Reproductible : fichier numéroté, appliqué dans une transaction, empreinte vérifiée aux démarrages suivants.
**Retour arrière** (si nécessaire, après avoir arrêté le site) : `DROP TRIGGER` des 7 déclencheurs (`mk_funnel_steps_same_site_insert`, `mk_funnel_steps_same_site_update`, `mk_landing_pages_parent_same_site_insert`, `mk_landing_pages_parent_same_site_update`, `mk_sites_home_same_site`, `mk_landing_pages_move_keeps_links`, `mk_funnels_move_keeps_steps`) puis `DELETE FROM schema_migrations WHERE scope='marketing' AND version='071'`. Les colonnes de la migration 070 peuvent rester (inoffensives). Restauration complète possible depuis la sauvegarde `AVANT-MIGRATION-…`.
