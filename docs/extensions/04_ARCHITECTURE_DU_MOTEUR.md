# Architecture du moteur d'extensions

## Vue d'ensemble
```
src/extensions/
  manifests/<id>.js   un fichier = une extension (donnée déclarative, validée au démarrage)
  manifest.js         format et validation stricte d'un manifeste
  semver.js           versions et plages de compatibilité (sans dépendance)
  registry.js         REGISTRE CENTRAL : lit manifests/, valide, vérifie dépendances/conflits/cycles, fige
  state.js            ÉTAT PAR SITE (lecture de mk_site_modules) + cache invalidé
  activation.js       activer / désactiver (atomique), plan, historique, paramètres par site
  runtime.js          garde serveur des pages publiques d'un domaine de site
src/marketing/siteModules.js   adaptateur : l'interface historique (MODULES, isEnabled, assertEnabled, denies, listFor, setEnabled)
src/marketing/web/extensions.js + views/marketing/extensions.ejs   menu « Extensions » (5 rubriques)
```
Trois niveaux, comme demandé :
- **A. Registre central** : les manifestes (identité, version, éditeur, catégorie, disponibilité, compatibilité, dépendances, permissions, migrations, points d'entrée, routes, menus, paramètres, événements, hooks, tâches, ressources, documentation, maintenance). Une seule copie, commune à tous les sites, versionnée avec le code.
- **B. Installations par site** : `mk_site_modules(site_id, organization_id, module, enabled)` (migration 084, inchangée) ; `mk_extension_events` (historique, append-only) et `mk_extension_settings` (paramètres par site) — migration 153.
- **C. Moteur d'exécution** : gardes serveur (administration + domaine), menus calculés, étapes de cycle de vie, paramètres.

## Règles d'état (inchangées pour l'existant)
- Pas de ligne = désactivé. Le site principal n'est jamais soumis à l'activation pour une extension `always_on_primary` (les six extensions historiques).
- Désactiver = `enabled = 0`. Aucune table d'extension n'est touchée ; réactiver retrouve tout.
- L'activation s'ajoute aux permissions et à l'isolation par site : elle ne les remplace pas.

## Cycle d'une activation (activation.js)
1. Contrôles : équipe seulement ; permission `sites.modules` ; extension connue ; site de l'organisation, non supprimé, hors ligne dédiée du principal.
2. Plan (`plan()`) : disponibilité, maintenance, dépendances présentes, conflits, dépendants actifs (désactivation), obsolescence. Un blocage est journalisé (`refused`) et renvoyé.
3. Confirmation : exigée pour toute désactivation et pour une extension obsolète.
4. **Transaction unique** (SAVEPOINT) : écriture de l'état + étape `lifecycle.onEnable/onDisable` de l'extension (si déclarée) + événement. Au moindre échec : annulation totale, état inchangé, événement `failed` écrit après l'annulation.
5. Cache invalidé, audit du CMS écrit.

## Gardes serveur (jamais l'interface seule)
| Surface | Garde | Où |
|---|---|---|
| Écrans d'administration | `siteModules.denies` : adresse `/site-web/sites/N/…` → refus pour tous (équipe comprise) si l'extension n'est pas activée pour N ; écrans centraux → refus pour un accès limité à un site | `web/index.js` |
| Services | `assertEnabled(ctx, id)` | services SMS, IA boutique, revenus… |
| Domaine d'un site | `runtime.publicGuard` : chemin d'une extension non activée pour CE site → 404 (le site vient du domaine, jamais de la requête) | `server.js`, après le routage des pages du site |
| Boutique publique, API, webhooks, widgets, plan du site | `isEnabled(…, "commerce")` (déjà en place) | `shopPublic.js`, `api/shop.js`, `shopWebhooks.js`… |
| Menus | `projectSections` ne montre un groupe d'extension que si `space.extensions` le contient (calculé par requête depuis la base) | `cmsNav.js`, `siteSpace.js` |

## Navigation
Les groupes de menu sont **déclarés dans les manifestes** (`menus`) et injectés dans le registre de navigation par `extensionSections()` : plus de menu d'extension écrit en dur. Un groupe porte l'identifiant de son extension ; dans l'espace d'un site il n'apparaît que si l'extension y est activée et si la personne a la permission de chaque entrée. Le site principal garde tous ses menus.

## Cache
`state.js` met en cache, par connexion, l'ensemble des extensions activées d'un site (clé organisation + site). Validation par `PRAGMA data_version` (change quand un autre processus écrit) ; invalidation explicite à chaque activation. Testé : écriture d'une autre connexion vue au contrôle suivant.

## Ce qui n'est PAS fait (honnêteté)
- Les routeurs de la boutique et du LMS restent montés au démarrage (ils le sont tous dans la même application) ; la désactivation les **ferme** par garde, elle ne les décharge pas de la mémoire. Les extensions **nouvelles** peuvent fournir leur point d'entrée (`entry.lifecycle`) chargé seulement à l'activation.
- Le LMS garde son administration `/formateur` et ses rôles historiques (compte créateur) : l'extension commande son accès par domaine et son entrée de menu (`lms.manage`), pas ses rôles internes.
- Les tâches planifiées et hooks sont déclarés dans le manifeste (validés) ; leur exécution par le moteur reste à brancher quand une extension en aura besoin (aucune des six n'en déclare).
