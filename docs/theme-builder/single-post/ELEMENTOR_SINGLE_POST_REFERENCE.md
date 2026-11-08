# Elementor — Single Post : référence consolidée

**Statut des sources.** Aucune nouvelle page Elementor n'a été relue pendant cet audit. Ce document consolide la lecture officielle du 2026-11-04 détaillée dans `../elementor-single-post-reference.md` (13 pages d'aide lues, listées là-bas). Légende : **C** = confirmé (page officielle lue), **O** = observé indirectement, **D** = déduit, **N** = non vérifiable (interface Pro non ouverte).

## 1. Theme Builder — Single Post

| Sujet | Comportement | Statut |
|---|---|---|
| Création | My Templates / Theme Builder → type « Single » ; fenêtre de blocs prédéfinis ignorable | C |
| Aperçu | Réglage de prévisualisation : choisir un article représentatif pour voir de vraies données | C (geste) / N (libellés exacts) |
| Publication | À la publication, fenêtre de conditions : tous les articles, un article précis, une catégorie, une étiquette | C |
| Conditions | Inclure / Exclure, plusieurs conditions, modifiables via Display Conditions | C |
| Priorité entre modèles concurrents, résolution de conflit | Un conflit est signalé par Elementor ; la règle exacte n'est pas documentée | N |
| Duplication / suppression / sauvegarde brouillon | Cycle de vie général (voir `ELEMENTOR_TEMPLATE_LIFECYCLE.md`) | D |
| Affectation par auteur, type de contenu | Cibles de conditions listées dans `ELEMENTOR_DISPLAY_CONDITIONS.md` | O |
| Bibliothèque de modèles / Template Kits | Existent ; contenu non lu | N |

## 2. Natif, Pro, tiers

| Catégorie | Éléments |
|---|---|
| Natif (gratuit) | Heading, Image, Text Editor, Video, Button, Divider, Spacer, Icon List, Accordion, Tabs, HTML, Shortcode, Social Icons, Image Gallery, Testimonial, conteneurs flex/grid |
| Elementor Pro | Post Title, Post Content, Featured Image, Post Excerpt, Post Info (C), Author Box (C), Post Navigation (C), Table of Contents (C), Post Comments, Share Buttons, Breadcrumbs (existence connue, options non lues), Posts / Loop Grid, Search Form, Form, Theme Builder lui-même, Dynamic Tags |
| Extensions tierces | Reading progress dédié, réactions/likes, ACF dynamique avancé, newsletters : **non natifs** ; jamais présentés comme tels |
| Propre à Kolakisa | Voir `FEATURE_PARITY_MATRIX.md` (jetons de site, identités, copie indépendante par site) |

## 3. Personnalisation (Elementor)
Typographie, couleurs, arrière-plans, dimensions, marges/paddings, bordures, ombres, rayons, flex/grid, position (sticky), effets/animations de mouvement, breakpoints responsive, masquage par appareil, visibilité conditionnelle (Pro). Statut : **D/N** pour le détail des contrôles (pages non lues). Les contrôles Kolakisa équivalents sont ceux du Page Builder (`STYLE_UI`).

## 4. Contenus dynamiques
Voir `ELEMENTOR_DYNAMIC_CONTENT.md`.

## 5. Limites de cette référence
Interface Pro jamais ouverte ; versions non datées dans les pages d'aide ; aucune affirmation de parité ne doit s'appuyer sur un point N.
