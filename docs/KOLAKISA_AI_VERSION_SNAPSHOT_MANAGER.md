# Version Snapshot Manager

`src/regen/snapshots.js`, table `mk_regen_snapshots`.

## Niveaux et contenu
| Niveau | Contenu |
|---|---|
| `node` | élément d'une section libre (+ section, parent, position) |
| `section` | section complète (+ position) |
| `page` | contenu du brouillon : sections, titre, description, SEO, thème, révision |
| `design` | changements du brouillon du personnalisateur (+ révision) |
| `site` | liste de références vers des snapshots de pages + du design (pas de copie) |

## Stockage
JSON canonique compressé (gzip, base64) ; **déduplication par empreinte** (un état identique au dernier snapshot de la même référence réutilise l'identifiant) ; un snapshot de site ne contient que des références. **Aucun fichier média n'est copié** : seulement les chemins de la médiathèque (testé). Limite 3 Mo par snapshot.

## Conservation
**Aucune suppression automatique.** `prune` (réservé à `revisions.delete`) : simulation par défaut ; ne supprime jamais un snapshot rattaché à une opération, le plus récent de chaque référence (au moins 3 gardés), ni un snapshot référencé par un snapshot de site. Paramètres : ancienneté (≥ 30 jours), nombre à garder. Statistiques (nombre, octets) exposées.

## Limites
Pas de stockage différentiel entre versions successives d'une même page (déduplication d'états identiques seulement) ; pas de politique de conservation planifiée.
