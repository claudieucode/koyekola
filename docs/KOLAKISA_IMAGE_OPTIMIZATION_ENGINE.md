# Optimisation des images

## Déjà en place (non dupliqué)
Variantes WebP à la demande (qualité 80, 8 largeurs, jamais d'agrandissement), original conservé, `srcset`/`sizes`, `loading="lazy"`, limite 5 Mo à l'envoi.

## Ajouté (`optimize.js`)
- `advise` : image trop grande pour son affichage (largeur × 2), fichier > 1,5 Mo, PNG/GIF fixe lourd sans transparence → conseils ; **animation et transparence préservées** (jamais de conversion vers JPEG d'une image transparente, jamais d'aplatissement d'un GIF animé).
- `derive` : dérivation en mémoire vers WebP/JPEG/AVIF/PNG (refus si animation ou transparence → JPEG) ; l'original n'est pas touché (testé octet pour octet).
- `scanSvg` : liste script, événements, `javascript:`, `foreignObject`, contenu embarqué, entités XML, références externes. **Politique : les SVG restent refusés à l'envoi** (testé) ; ce contrôle sert au diagnostic, il ne rend jamais un SVG acceptable.

## Non fait
Pas de génération d'AVIF dans le rendu public (la dérivation existe mais n'est pas branchée), pas d'optimisation de métadonnées EXIF, pas de compression en tâche de fond, pas de conversion automatique des originaux (volontaire).
