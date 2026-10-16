# Audit expérience utilisateur — état au 14/10/2026

Document de suivi (lecture : comment est organisée l'interface, ce qui a été corrigé, ce qui reste ouvert). Les chiffres viennent de comptages dans le code et de mesures Chrome ponctuelles ; ce qui n'a pas été mesuré est signalé « non vérifié ».

## 1. Cartographie des coques d'interface

| Zone | Gabarit | Vues | Feuilles de style | Remarque |
|---|---|---|---|---|
| Marketing et CMS (Sites, Pages, Articles, Médias, Navigation, Apparence, Commentaires, Utilisateurs, SEO du CMS, Redirections, Tests A/B, Outils, Paramètres, Campagnes, SMS, Automatisations, Formulaires, Tunnels, Audience, Analytics, Intégrations) | `views/marketing/partials/top.ejs` | 118 | `style.css`, `marketing.css`, `cms.css`, `app-rail.css` | jetons `--mk-*` |
| « Mon espace » (formateur), SEO, Gestion | `views/partials/header.ejs` puis `dash-open.ejs` | 16 + 23 + 19 | `dashboard.css`, `seo-workspace.css`, `app-rail.css` | jetons `--dash-*` calculés par `src/services/dashboard.js` |
| Éditeur de pages | écran plein écran | 1 | `page-builder.css` | jetons `--editor-*`, **exception** |
| Éditeurs d'articles, de cours, d'e-mails | écrans propres | — | `blog-editor.css`, etc. | **exceptions** |
| Site public (catalogue, panier, apprentissage, pages publiques) | `partials/header.ejs` | ~66 | `style.css`, `landing.css` | aspect public |

## 2. Design system (inventaire)

- Palette : bleu nuit `#0b2a40`, bleu ciel `#0277b6` (`style.css`, `:root`). Polices Bricolage Grotesque (titres) et Figtree (texte), hébergées localement.
- Jetons : base (`--primary`, `--accent`, `--border`, `--line`, `--field-border`…), `--mk-*`, `--dash-*`, `--editor-*`.
- Icônes : un seul fichier, `src/utils/icons.js` (143 icônes linéaires, trait 2, 24 px). Pas d'emoji.
- Thème par défaut de « Mon espace » : bleu foncé (marine). Thème de barre latérale Marketing : clair par défaut, choix Bleu foncé / Gris / Noir.
- Mouvement : `kol-motion.js` (éditeur de pages uniquement) ; fenêtres Marketing en CSS (`@starting-style`) ; menus Marketing/CMS animés en CSS (0,14 s).

## 3. Registre des problèmes

| ID | Problème | Statut |
|---|---|---|
| A-01 | Gris secondaire de « Mon espace » jugé sous 4,5:1 | **Retiré** : la valeur servie est corrigée par le code (5,30:1) ; seule la valeur brute du thème était à 4,46 |
| A-02 | Contour des champs à 1,56:1 (WCAG 1.4.11 demande 3:1) | **Corrigé** (jeton `--field-border` `#7a90a4`, ≈ 3,3:1 ; « Mon espace » calculé depuis la couleur du texte). Éditeurs exclus (voir S-01) |
| A-04 | Règles `outline: none` | **Pas de défaut trouvé** dans les 4 feuilles principales (3 règles bénignes) ; non contrôlé dans les éditeurs |
| A-05 | Images sans `alt` | **Retiré** : analyse complète des vues (balises multi-lignes incluses), 0 image sans attribut `alt` |
| U-01 | Tableau Contacts : défilement horizontal à 1440 px | **Corrigé** (marges de cellule 12 px) ; reste normal à 1280 px |
| U-02 | « Mon espace », SEO, Gestion plafonnés à 1240 px (centrés) | **Ouvert**, décision : harmoniser ou non avec Marketing/CMS |
| U-03 | Menus et sous-menus sans transition | **Corrigé pour Marketing/CMS** ; non fait pour les menus de « Mon espace » |
| U-04 | Bouton principal : ombre et soulèvement au survol dans « Mon espace » | **Corrigé** ; reste voulu sur le site public |
| P-02 | Mouvement réduit inégalement géré | **Corrigé** pour Marketing/CMS et « Mon espace » ; éditeurs avaient déjà leurs règles |
| V-01 | Couleurs en dur (61 / 43 / 120 hexadécimaux distincts dans `style.css` / `marketing.css` / `page-builder.css`) | **Ouvert** (risque moyen) |
| V-02 | Tailles de police (40 / 33) et ombres (21 / 28) très variées | **Ouvert** |
| V-03 | Trois jeux de jetons parallèles pour des valeurs proches | **Ouvert** : à traiter par alias, sans changer les valeurs, avec captures avant/après |
| V-04 | Pas d'accent secondaire sémantique commun | **Ouvert**, basse priorité |
| P-01 | Scripts volumineux (`page-builder.js` 760 Ko, `blog-editor.js` 760 Ko, `course-editor.js` 403 Ko, bruts) ; styles servis compressés (≈ 32 + 34 + 5 Ko) | **Non mesuré** en conditions réelles |
| S-01 | Champs de l'éditeur d'articles gardent l'ancien contour clair (exception volontaire) | **Ouvert**, à traiter avec l'éditeur |

## 4. Décisions prises dans ce programme

- Marine par défaut pour « Mon espace » et le rail (les choix enregistrés par les utilisateurs sont conservés).
- Largeur du contenu Marketing/CMS : plafond 1760 px, centré ; tableaux CMS à marges réduites.
- Aucun changement de route, de permission ni de données.

## 5. Ce qui n'est pas couvert

Accessibilité automatisée (aucun outil installé), performance mesurée sur pages complexes, relecture visuelle de tous les écrans e-commerce, LMS, emailing et des 17 pages Marketing/CMS (seule leur largeur a été mesurée), éditeurs (exceptions).
