# Elementor — Single Page : référence consolidée

**Statut des sources.** Aucune page Elementor n'a été relue pendant cet audit (le 2026-11-04, les pages Theme Builder et Conditions avaient renvoyé HTTP 502 ; l'interface réelle n'a jamais été observée). Ce document consolide `../elementor-single-page-reference.md`, `../ELEMENTOR_THEME_BUILDER_REFERENCE.md` et `../ELEMENTOR_DISPLAY_CONDITIONS.md`. Légende : **C** confirmé (page officielle lue, avec date dans le document source), **O** observé, **D** déduit, **N** non vérifiable.

## 1. Theme Builder — Single Page
| Sujet | Comportement | Statut |
|---|---|---|
| Type de modèle | « Single Page » est un type de modèle de contenu à côté de Single Post | C |
| Création | vide ou depuis la bibliothèque, puis éditeur visuel | C |
| Aperçu | « Preview Dynamic Content As » : choisir un contenu réel pour voir les données | C |
| Publication | à la publication, fenêtre de conditions (par défaut « Entire Site ») | C |
| Conditions | Include / Exclude, plusieurs conditions, modifiables ensuite | C |
| Cibles pour une page | toutes les pages, une page précise, enfants d'une page, accueil, propriétés | C pour « pages / page précise », D pour le reste |
| Priorité entre modèles | le plus précis l'emporte ; règle exacte non documentée | N |
| Duplication, suppression, brouillon | cycle de vie général | D (`ELEMENTOR_TEMPLATE_LIFECYCLE.md`) |
| Modèles globaux / personnalisés | Elementor distingue en-tête, pied de page, Single, Archive, etc. | C |
| Bibliothèque de modèles de pages, Template Kits | existent ; contenu non lu | N |
| Contenu de la page dans le modèle | élément « Post Content » | C |

## 2. Natif, Pro, tiers
| Catégorie | Éléments |
|---|---|
| Natif (gratuit) | Heading, Image, Text Editor, Video, Button, Divider, Spacer, Icon, Icon List, Icon Box, Image Box, Image Carousel, Image Gallery, Accordion, Tabs, Toggle, Testimonial, Counter, Progress Bar, Social Icons, Google Maps, HTML, Shortcode, Alert, Anchor, Audio, containers flex/grid |
| Elementor Pro | Page/Post Title, Post Content, Featured Image (selon contexte), Nav Menu, Breadcrumbs, Search Form, Form, Login, Posts/Loop Grid, Call To Action, Flip Box, Price Table, Pricing List, Countdown, Animated Headline, Reviews, Testimonial Carousel, Slides, Popup, Share Buttons, Table of Contents, Site Logo/Title, Dynamic Tags, champs personnalisés dynamiques, conditions d'affichage, visibilité conditionnelle |
| Extensions tierces | cartes avancées, calculateurs de prix, réservation, répétiteurs ACF, formulaires de paiement : **non natifs** |
| Propre à Kolakisa | identités de modèle, jetons du site, copie indépendante par site, module Motion (45 composants), formulaires d'inscription du site |
Le classement gratuit / Pro est celui connu par la documentation générale d'Elementor ; il n'a **pas été revérifié** aujourd'hui (D).

## 3. Personnalisation (D/N)
Typographie, couleurs, arrière-plans (dégradés, images, vidéo), dimensions, marges, paddings, bordures, ombres, flex/grid, positionnement, effets de mouvement, transitions, breakpoints, masquage par appareil, styles globaux, CSS personnalisé (Pro). Le détail des contrôles n'a pas été lu. Les contrôles Kolakisa équivalents sont ceux du Page Builder.

## 4. Contenus dynamiques
Voir `ELEMENTOR_DYNAMIC_CONTENT.md`.
