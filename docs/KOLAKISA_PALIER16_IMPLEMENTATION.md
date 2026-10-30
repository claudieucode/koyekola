# Palier 16 — Implémentation

## Modifié
| Fichier | Changement | Pourquoi |
|---|---|---|
| `src/services/blog.js` | Le cache `variantCache` (variantes WebP d'images, clé = adresse de l'image) est borné à 2 000 entrées ; la plus ancienne est retirée en premier (`rememberVariants`). Exports ajoutés : `rememberVariants`, `variantCacheSize`, `VARIANT_CACHE_MAX` | La carte n'avait ni borne ni éviction : une entrée par image distincte rencontrée, jusqu'au redémarrage du processus. Même borne et même principe que `media/variants.js` (`sizes`, 2 000) |
| `tests/palier16-stabilite.test.js` | Nouveau (2 tests) | Non-régression de la borne ; une adresse hors du dossier des vignettes n'entre jamais dans le cache |

Comportement visible : aucun (les entrées plus anciennes sont simplement recalculées à la demande ; TTL inchangé, 60 s).

## Examiné et volontairement NON modifié (aucune mesure ne le justifie)
- Requêtes SQL du blog, du plan de site et du flux : 1 à 3 ms de SQL par page.
- Éditeur de pages : 60 images/s aux interactions mesurées ; rendu serveur de la frappe (déjà documenté).
- Découpage du paquet de l'éditeur d'articles (921 Ko minifiés) : gain non démontré, risque de régression sur l'éditeur ; à traiter avec un profil sur machine au repos.
- Sauvegarde, autosave, historique, conflits : sains (écriture conditionnelle sur la révision, une requête en vol, reprise, copie locale). Rien n'a été regroupé ni différé.
- `connectors/index.js` `windows` : clé par connexion en base, taille négligeable.
