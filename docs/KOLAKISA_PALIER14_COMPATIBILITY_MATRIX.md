# Palier 14 — Matrice de compatibilité

Légende : **T** = testé automatiquement dans ce palier ; **E** = émulation (fenêtre redimensionnée dans un navigateur de bureau) ; **—** = non testé.

## Navigateurs
| Navigateur | Version | Pilote | Statut |
|---|---|---|---|
| Chrome | (installé, Playwright) | Playwright | **T** matrice complète + tests |
| Firefox | 153.0.4 (moteur Gecko) | WebDriver BiDi natif, aucune installation | **T** matrice complète + tests |
| Edge | installé (Chromium) | Playwright, `CHROME_PATH` | voir `KOLAKISA_PALIER14_TEST_REPORT.md` |
| Safari (WebKit) | installé | `safaridriver` non activé (nécessite une action administrateur) | **—** non testé |
| Appareils physiques iOS / Android | — | — | **—** non testés |

## Tailles (largeur × hauteur) — toutes **E**
| Cas | Taille | Pages publiques | Widgets (8 pages) | Admin (14) | Éditeur |
|---|---|---|---|---|---|
| Grand écran | 1920×1080 | E | E | E | E |
| Portable | 1440×900 | E | E | E | E |
| Fenêtre réduite | 1024×768 | E | E | E | E |
| Tablette portrait | 820×1180 | E | E | E | E |
| Tablette paysage | 1180×820 | E | E | E | E |
| Téléphone portrait | 390×844 | E | E | E | E |
| Téléphone paysage | 844×390 | E | E | E | E |
| Petit téléphone | 320×568 | E | E | E | E |

## Résultat (avant → après correction, Chrome + Firefox cumulés, comptés par page × taille × navigateur)
| Constat | Avant | Après |
|---|---|---|
| Défilement horizontal du document | 4 | **0** |
| Élément dépassant le bord droit | 14 | 6 (tous `textpath` Firefox : artefact de mesure, document non défilable) |
| Cible tactile < 24 px, hors éditeur | 94 | 15 (bouton « Filtrer » masqué volontairement ; liens d'administration à 23,6–24 px arrondis) |
| Cible tactile < 24 px, éditeur | 22 | 22 (non traité : interface de bureau) |
| **Total** | **134** | **43** |
