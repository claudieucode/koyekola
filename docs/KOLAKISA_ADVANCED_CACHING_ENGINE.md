# Cache

## État (audit)
| Couche | État |
|---|---|
| Navigateur, statique | `?v=hash` + `immutable` 1 an (CSS/JS) ; polices et `/uploads` 30 j |
| Navigateur, pages | `private, no-cache` (ETag Express) |
| Pages publiques `/p/*` | `no-store` |
| Serveur, pages | **aucun cache** |

## Décision : pas de cache de pages publiques
Les pages publiées sont **personnalisées par visiteur** (sections filtrées par audience/segment, test A/B collant, bannière de consentement, jeton anti-robot du formulaire, tunnels). Un cache partagé servirait le jeton ou le contenu d'un visiteur à un autre, ou mélangerait les sites d'un même domaine. Sans clé de variation sûre, **le risque dépasse le gain** ; non implémenté. Les en-têtes `private/no-store` sont **vérifiés par test** (`programme22-9-perf-http`).

## Ajouté
- Cache mémoire des ressources minifiées (clé : chemin + date + taille : invalidation automatique à la modification).
- Réglage d'optimisation lu directement en base (une requête indexée par page vue).

## Non fait
Cache applicatif de métadonnées, purge ciblée, invalidation par dépendance : pas de cache de pages, donc sans objet. À reprendre après définition d'une clé de variation (site + domaine + audience + A/B + consentement).
