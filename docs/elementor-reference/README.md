# Référence Elementor pour KOLAKISA

**Objectif** : une documentation vérifiable de ce que propose réellement Elementor, pour guider le développement de l'éditeur KOLAKISA (sans le copier aveuglément).
**Date des vérifications** : 10 octobre 2026. **Méthode** : lecture des pages officielles (help center, developers.elementor.com) et recherches ciblées sur elementor.com. Chaque fait porte sa source (voir `16-official-sources.md`).

## Honnêteté sur le périmètre (à lire d'abord)
- Les pages du centre d'aide sont très longues (plus de 100 000 caractères avec la navigation) : le texte utile se trouve **après** le menu. Il a été lu avec un décalage de 100 000 caractères ; les pages dont l'article n'a pas été lu sont **marquées « non lu »**.
- Couverture : environ **90 articles lus en entier** (≈ 75 widgets, onglet Avancé, responsive, historique, réglages du site, conditions d'affichage, masques, composants, mouvement, étiquettes dynamiques…). Ce qui n'a **pas** été lu est listé dans `17-functional-inventory.md` et `16-official-sources.md`. **Chaque fichier a une section « Non vérifié »**.
- Aucune fonctionnalité n'est supposée : ce qui n'apparaît pas dans une source lue est écrit « non vérifié ».
- Ce dossier **complète** `ELEMENTOR_FEATURE_AUDIT.md` et `ELEMENTOR_FEATURE_INVENTORY.md` (racine du dépôt, phase 1 du 8 octobre 2026), qui comparent déjà Elementor à KOLAKISA widget par widget. Il ne les remplace pas.

## Index
| Fichier | Contenu |
|---|---|
| `01-editor-interface.md` | Panneaux, raccourcis, menus contextuels, Navigator |
| `02-layout-and-containers.md` | Conteneurs, Flexbox, réglages de mise en page |
| `03-widgets-catalog.md` | Liste officielle des widgets par catégorie |
| `04-widget-controls.md` | Réglages détaillés des premiers widgets lus |
| `04b…04i` | Réglages détaillés des autres widgets, fonctions transversales, mouvement, arrière-plans, contenu dynamique |
| `05-images-and-media.md` | Résolutions d'image, tailles WordPress, optimisation |
| `06-style-system.md` | Styles, couleurs et polices globales, Theme Style |
| `07-advanced-controls.md` | Onglet Avancé |
| `08-responsive-system.md` | Points de rupture, héritage |
| `09-interactions-and-animation.md` | Effets de mouvement, animations, interactions V4 |
| `10-components-and-reusability.md` | Classes, variables, composants, modèles |
| `11-save-history-and-recovery.md` | Historique, révisions, enregistrement |
| `12-cms-integrations.md` | Theme Builder, conditions, étiquettes dynamiques, kits |
| `13-advanced-features.md` | Formulaires, IA, MCP, intégrations |
| `14-performance-accessibility-security.md` | Qualité et contraintes |
| `15-versions-and-availability.md` | Éditeur classique (v3) / V4 ; gratuit / Pro |
| `16-official-sources.md` | Registre des sources et état de lecture |
| `17-functional-inventory.md` | Inventaire consolidé avec décomptes |
| `18-kolakisa-elementor-gap-analysis.md` | Matrice Elementor ↔ KOLAKISA (fonctions transversales) |
| `19-widget-mapping.md` | Correspondance widget par widget |

Les rapports de suivi sont à la racine du dépôt : `KOLAKISA_EDITOR_*.md`.
