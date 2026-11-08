# Inventaire des widgets Elementor utiles à une page 404

> Étude du 2026-11-08. Sources : aide Elementor et articles publics. **Aucune liste officielle complète widget par widget n'a pu être extraite** : les comptes ci-dessous sont des ordres de grandeur issus d'articles tiers et doivent être confirmés sur le tableau officiel « Free vs Pro » (https://elementor.com/help/elementor-pro-vs-free/).

## 1. Ordres de grandeur [tiers — à vérifier]
- Elementor gratuit : environ 30 à 32 widgets de base. Elementor Pro : environ 90 à 118 widgets au total (articles tiers non concordants).
- Un article annonçant « plus de 250 widgets dans la version gratuite » compte vraisemblablement les extensions tierces : **ignoré**.

## 2. Famille de widgets pertinents pour une 404 et équivalent Kolakisa
Légende — **Natif** : fonction d'Elementor (gratuit ou Pro) · **Tiers** : extension, jamais présentée comme native · **?** : niveau non confirmé.
Colonne « Kolakisa » : type d'élément **déjà présent** dans le moteur (liste mesurée, voir KOLAKISA_EXISTING_ARCHITECTURE.md §4).

| Besoin d'une 404 | Elementor | Statut Elementor | Kolakisa |
|---|---|---|---|
| Structure | Container (Flexbox), Grid | Natif | `container`, `grid`, `columns`, `stack`, `group` |
| Titre, texte | Heading, Text Editor | Natif (gratuit) | `heading`, `text`, `animatedheading` |
| Image, vidéo, icône | Image, Video, Icon, Icon Box | Natif (gratuit) | `image`, `video`, `icon`, `iconbox`, `imagebox` |
| Bouton, lien | Button | Natif (gratuit) | `button`, `link` |
| Recherche | Search Form | Natif **Pro** ? | `search` (moteur du site), `shopsearch` |
| Articles dynamiques | Posts / Loop Grid | Natif **Pro** ? | `posts`, `querylist`, `postnav` |
| Menu | Nav Menu | Natif **Pro** ? | `menu`, `cmsmenu`, `breadcrumb` |
| Formulaire | Form | Natif **Pro** ? | `signupform`, `emailsubscribe`, formulaires du moteur |
| Animation | Animated Headline, animations d'entrée, Lottie | Natif (Pro pour certaines) ? | `animatedheading`, `lottie`, `motion*` (≈ 45 widgets de mouvement) |
| Onglets, accordéon | Tabs, Accordion, Toggle | Natif (gratuit) | `tabs`, `accordion`, `toggle` |
| Compte à rebours, compteur | Countdown, Counter | Natif **Pro** ? (Counter gratuit) | `countdown`, `counter` |
| Témoignages, avis | Testimonial, Reviews | Natif ? | `testimonial`, `reviews`, `testimonialcarousel` |
| Boutique | Products, Add to Cart (WooCommerce) | Natif **Pro** + WooCommerce | `shopgrid`, `shopsearch`, `shopbuy`, `cart` |
| Mini-jeu | — (aucun widget natif) | **Tiers / HTML** | `html` / `embed` (jeu écrit pour Kolakisa) |
| Effets d'arrière-plan animés | Effets de mouvement, arrière-plans | Natif (Pro) ? | `motionanimatedbg`, `motionimageparallax`, `marquee` |

## 3. Conséquence pour la parité
Les widgets de Kolakisa couvrent déjà les besoins structurels, dynamiques et d'animation d'une 404. Le **manque réel** est ailleurs : la bibliothèque actuelle n'en utilise qu'une petite partie (17 types sur les 159 disponibles, aucun widget d'animation, d'image ni de jeu). La parité à construire est donc surtout un travail de **composition et de contenu**, pas de nouveaux moteurs.
