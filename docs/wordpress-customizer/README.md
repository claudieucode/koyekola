# Référence WordPress — personnalisation du site (mission TITAN XVIII)

Documentation de **référence** : comment WordPress permet de personnaliser un site, pour guider le « Personnaliser » de Kolakisa. Elle ne décrit pas Kolakisa (voir `../KOLAKISA_PERSONNALISER_TITAN18.md`).

Consultée le **26 octobre 2026**. Chaque affirmation porte un niveau de preuve :

| Marque | Sens |
|---|---|
| **[Doc]** | Lue dans une page officielle wordpress.org / developer.wordpress.org (adresse dans `sources-and-limitations.md`) |
| **[Connu]** | Connaissance générale de WordPress, non relue dans une page ce jour : à revérifier avant d'en dépendre |
| **[Déduit]** | Conclusion tirée de l'analyse, pas écrite telle quelle |

## Deux systèmes à ne pas confondre

1. **Customizer classique** (« Apparence → Personnaliser », depuis WP 3.4) : API PHP/JS (réglages, contrôles, sections, panneaux), aperçu en direct, publication. Disponible si le thème le prend en charge. Les thèmes blocs le masquent sauf si un thème ou une extension en a besoin. [Doc]
2. **Éditeur de site** (« Apparence → Éditeur », WP 5.9+) : modèles, parties de modèles, compositions, styles globaux, navigation, pages, **uniquement avec un thème bloc**. [Doc]

## Sommaire
- `classic-customizer.md` — hiérarchie, sections de base, objets de l'API
- `site-editor.md` — éditeur de site, styles globaux, modèles, parties, compositions
- `preview-save-publish.md` — aperçu, transports, sauvegarde, publication, historique
- `api-permissions-security.md` — API d'extension, droits, validation
- `feature-inventory.md` — inventaire des fonctionnalités (fiche courte par fonction)
- `sources-and-limitations.md` — sources, pages inaccessibles, limites de cette étude
