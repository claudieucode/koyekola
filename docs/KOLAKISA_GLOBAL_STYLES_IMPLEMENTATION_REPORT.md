# Rapport d'implémentation — mission 5

## Code de production modifié (2 fichiers)
| Fichier | Modification | Défaut |
|---|---|---|
| `src/marketing/pages/nodes.js` | `colorCss` : repli sur la valeur d'origine du système (`var(--kw-primary, #0277b6)`) ; `on-primary` / `on-accent` calculés comme dans le thème | D2 |
| `src/marketing/pages/index.js` | `saveSiteDesign` : refus de supprimer une couleur personnalisée référencée par les réglages du site (classes globales, boutons, liens, listes, champs, images / textes / bordures, fond) ; message nommant l'endroit (`siteColorHolders`) | D1 |

## Tests
| Fichier | Contenu |
|---|---|
| `tests/styles-globaux-navigateur.test.js` (7) | références / locales / personnalisées / classes / police / duplication / suppression protégée / page hors site, publié ET canevas, Chrome réel |
| `tests/controles-contrat.test.js`, `controles-coherence.test.js`, `controles-matrice-navigateur.test.js` | assertions mises à jour pour la nouvelle forme `var(--kw-clé, valeur)` (même exigence : la référence est conservée) |

Chaque correction a un test qui **échoue sans elle** (vérifié en retirant le correctif).

## Non modifié
Interface, points de rupture, classes globales, composants, polices, priorités (aucun défaut).
