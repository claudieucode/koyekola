# Sécurité et isolation multisite

| Exigence | Mécanisme | Preuve (test) |
|---|---|---|
| Un administrateur de site ne peut pas activer/désactiver | `activation.access` : `siteScope` défini → `forbidden` ; routes `need("sites.modules")` + `teamOnly` | `extensions-activation` (accès), `extensions-serveur` (rubriques, POST refusé), `modules-par-site` |
| Pas d'action sur un autre site | `loadSite` : site de l'organisation du contexte, non supprimé, hors ligne du principal ; déclencheurs SQL (même organisation) | `extensions-activation` (accès, migration 153), `modules-par-site` (migration 084) |
| Rien n'est cru de l'interface | Toute écriture passe par le moteur ; états falsifiés / extensions inconnues refusés ; le site d'une requête publique vient du **domaine** | `extensions-serveur` (erreurs, domaines) |
| Écrans d'administration d'une extension désactivée | `siteModules.denies` sur l'adresse `/sites/N/…` (équipe comprise) | `extensions-serveur` (Commerce désactivé : lecture et écriture, aucune donnée créée) |
| Pages publiques d'une extension désactivée | `runtime.publicGuard` (404) | `extensions-serveur` (LMS, Commerce, trois sites en parallèle) |
| Données du site A invisibles du site B | tables d'extension filtrées par `site_id` (inchangé) ; états et paramètres indexés par (organisation, site) | `extensions-serveur` (boutique B ne montre pas le produit de A), `commerce-par-site`, `lms-par-site` |
| Journal infalsifiable | `mk_extension_events` : UPDATE/DELETE interdits par déclencheur ; accès limité = son site seulement | `extensions-activation` |
| Pas d'escalade par le manifeste | registre en code (déploiement), validé strictement ; `entry.lifecycle` doit rester dans le dépôt | `extensions-registre`, `activation.lifecycle` |
| Atomicité | transaction unique ; échec → annulation + événement `failed` | `extensions-activation` (ATOMIQUE) |
| Cache sans état périmé | `data_version` + invalidation explicite | `extensions-activation` (cache), `extensions-performance` |

Limites : un `entry.lifecycle` s'exécute avec les droits du serveur (code du dépôt, revu à la fusion) ; il n'y a pas de marché d'extensions tierces ni de bac à sable.
