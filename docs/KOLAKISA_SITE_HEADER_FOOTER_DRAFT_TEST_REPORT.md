# Mission 9.1 — rapport de tests

Machine : Chrome 150 / macOS, 4 cœurs, chargée par d'autres sessions. Aucun test désactivé, aucun seuil modifié.

## Nouveaux tests (12)
| Fichier | Tests | Couvre |
|---|---|---|
| `tests/parties-brouillon-serveur.test.js` (vrai serveur) | 8 | cycle complet en-tête **et** pied de page (brouillon → rechargement → aperçu → « Mettre à jour » ; public intact avant, à jour après ; version identique sans nouvelle version ; autre site intact) ; 409 sur enregistrement et mise à jour périmés ; avertissement d'aperçu de révision périmée et abandon du brouillon ; exceptions par page et variante ; permissions (anonyme, compte extérieur, lecteur) ; isolation entre sites et chemin direct `section` refusé ; copie de site et page hors site |
| `tests/parties-brouillon-navigateur.test.js` (Chrome réel) | 4 | en-tête et pied de page : édition dans l'éditeur, statut « brouillon non publié », public intact, rechargement, aperçu privé dans la boîte de dialogue, « Mettre à jour », public à jour ; publication refusée par session expirée (401) puis conflit (409) : message, brouillon conservé, public intact, puis réussite ; deux onglets sur le pied de page |

**Preuve que les tests détectent le défaut :** en remettant temporairement l'ancienne écriture directe dans `landing.js`, 7 des 8 tests serveur échouent ; le code a été rétabli.

## Tests d'anciens contrats adaptés (5)
- `site-web-entete.test.js` : 3 tests (« mise à jour immédiate ») → vérifient désormais « brouillon invisible, puis Mettre à jour diffuse ».
- `site-web-entete-navigateur.test.js` : B2, B3 → statut « En-tête : publié, à jour », pas de bouton de publication sans brouillon, brouillon invisible en public puis diffusé par « Mettre à jour ».
- `theme-builder-navigateur.test.js` (mission 9) : l'en-tête est publié par « Mettre à jour » avant la comparaison canevas / page publiée.
Les autres assertions de ces fichiers sont inchangées.

## Résultats
| Lot | Fichiers | Réussis | Échoués | Ignorés |
|---|---|---|---|---|
| Serveur (nouveaux + pages, tunnels, A/B, sites, en-tête, composants, blocs, modèles de thème, widgets, classes, apparence, persistance, révisions, URLs, SEO, duplication, éditeur) | 27 | **446** | 0 | 0 |
| Navigateur (nouveaux + persistance, composants, en-tête, apparence, noyau, canevas, structure, corrections widgets, édition visuelle, Theme Builder) | 11 | 84 | **3** | 0 |
| Rejeu après adaptation des 3 tests d'ancien contrat (`site-web-entete-navigateur`, `theme-builder-navigateur`) | 2 | **13** | 0 | 0 |

Les 3 échecs du lot navigateur étaient exactement les tests de l'ancien contrat « publication à chaque enregistrement » (B2, B3 et l'en-tête de la mission 9) ; ils sont adaptés ci-dessus. Aucune autre régression observée.

## Non exécuté / bloqué
- **Suite complète (~4 840 tests) : non lancée**, comme annoncé ; à exécuter seule, concurrence 1, sans autre session (`node --test --test-concurrency=1 tests/`).
- 2 tests (`elementor-parite-3-navigateur`) exigent `sharp`, absent localement.
- Test de fluidité de la mission 6 : non relancé (intermittent, ouvert pour la mission 10).
- Firefox, Safari, tactile, lecteur d'écran réel, contrastes : non testés.
- Non testé : reprise automatique de l'aperçu à l'enregistrement d'une nouvelle révision (non implémentée, voir LIMITATIONS), copie du brouillon avec un site.
