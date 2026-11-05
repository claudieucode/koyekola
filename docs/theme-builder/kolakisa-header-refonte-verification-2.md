# En-têtes sectoriels — rapport de vérification (4 novembre 2026)

## Tests automatisés
| Fichier | Résultat |
|---|---|
| `theme-builder-entetes-secteurs` (12 identités, palettes, polices, contraste, `headerFx`, coordonnées, grammaire, CSS/JS ; **Chrome** : hôtel superposé → plein, agence réduite, mouvement réduit, mobile) | 11 / 11, 0 ignoré (avec Playwright) |
| `theme-builder-entetes-bibliotheque` (100 modèles, 10 × 10, 17 identités, composition distincte, responsive, liste, utilisation, rendu) | réussi |
| `theme-builder-en-tete-collant-public`, `theme-builder-catalogue` | réussis |

Attention : sans Playwright (`NODE_PATH`), la suite Chrome est **ignorée** sans échec ; l'exécution du 4 novembre sans Playwright affichait 52 réussites hors Chrome.

## Contrôle visuel (`AUDIT_TYPE=header node scripts/audit-pieds.js <dossier> [clés]`)
**100 modèles × 3 largeurs (300 mesures)** : aucun débordement horizontal, aucun chevauchement, aucun élément hors écran ; seules alertes : le contraste des 10 en-têtes superposés + l'hôtel (faux positif : texte clair mesuré contre le fond blanc de la page ; le script ne mesure plus ces modèles). Relecture à l'œil de 2 planches de 10 (barres supérieures ; classique et collants) : identités nettes, plus de bleu imposé, un défaut vu et corrigé (bouton « Rechercher » resté bleu).

Détail des 12 sectoriels : 12 modèles × 3 largeurs (1280, 820, 390 px) = 36 mesures : débordement, chevauchement, éléments hors écran, contraste.
* 33 mesures sans défaut ; 3 alertes de contraste, toutes sur `hotel-couverture` : **faux positif** (texte clair d'un en-tête superposé mesuré contre le fond blanc de la page ; l'aperçu le pose sur un visuel sombre).
* Polices réellement appliquées (Chrome, `getComputedStyle`) : menu et logo de chacun des 12 modèles prennent la police de leur identité (Lato/Playfair, Nunito, Space Grotesk, Source Sans 3/Lora, DM Sans/Instrument Serif, Inter/Plus Jakarta Sans, Source Sans 3/Libre Baskerville, Jost/Cormorant, Lato/Cinzel, Quicksand, Manrope, Nunito Sans/Lora).
* **Non mesuré** : la police des boutons (sélecteur de la sonde introuvable) ; elle est posée sur l'élément du bouton lui-même, mais n'a pas été vérifiée dans le navigateur.

## Défaut corrigé en cours de route
Le site imposait sa police aux liens (`.lp-site a`) : la police d'un modèle ne les atteignait pas (menu SaaS resté en Figtree). Correction par les parties du widget (voir `kolakisa-header-refonte-audit-2.md` §2).
