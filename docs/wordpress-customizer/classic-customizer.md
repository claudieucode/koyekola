# Customizer classique

## Accès et conditions
- Accès : Apparence → Personnaliser, ou barre d'outils « Personnaliser ». [Doc]
- Disponible seulement si le thème actif prend en charge le Customizer. Pour un thème bloc il est masqué, sauf si un thème/une extension en dépend. [Doc]
- L'écran diffère selon le thème (chaque thème ajoute ses sections). [Doc]

## Usage
- Panneau de réglages à gauche, aperçu du vrai site à droite ; les liens internes de l'aperçu sont cliquables et conservent les réglages en cours. [Doc]
- Boutons d'aperçu d'appareil en bas du panneau : ordinateur, tablette, mobile. [Doc]
- Crayon bleu dans l'aperçu : ouvre le contrôle correspondant (édition directe, 4.7+ via Selective Refresh). [Doc]
- Bouton « Publier » applique les changements au site. [Doc]

## Sections du cœur (identifiant, priorité) [Doc]
| Titre | id | Priorité |
|---|---|---|
| Identité du site | `title_tagline` | 20 |
| Couleurs | `colors` | 40 |
| Image d'en-tête | `header_image` | 60 |
| Image d'arrière-plan | `background_image` | 80 |
| Menus (panneau) | `nav_menus` | 100 |
| Widgets (panneau) | `widgets` | 110 |
| Page d'accueil statique | `static_front_page` | 120 |
| Par défaut (thème) | — | 160 |
| CSS additionnel | `custom_css` | 200 |

### Contenu de chaque section (page « Customizer » de la documentation) [Doc]
- **Identité** : logo (bibliothèque de médias), titre, slogan, case « afficher titre et slogan », icône du site (carrée, 512 px minimum).
- **Couleurs et mode sombre** (thème Twenty Twenty-One) : couleur d'arrière-plan (HEX, sélecteur, « Par défaut »), prise en charge du mode sombre.
- **Arrière-plan** : image, préréglage (défaut, remplir, ajuster, répéter, personnalisé), position, taille, répétition, défilement avec la page.
- **Menus** : créer des menus, ajouter pages, articles, catégories, étiquettes, formats, liens personnalisés ; affecter à des emplacements (le thème en déclare).
- **Widgets** : depuis 5.8, blocs dans les zones de widgets (haut, bas de page, barres latérales) ; ajout, réorganisation (flèches, glisser), « Plus de réglages », annuler/rétablir, suppression, multi-sélection.
- **Page d'accueil** : derniers articles, ou page statique (page d'accueil + page des articles).
- **Extraits** : texte intégral ou résumé pour blog et archives (la recherche affiche toujours le résumé).
- **CSS additionnel** : règles qui surchargent le thème.

## Objets de l'API [Doc : page « Customizer Objects »]
- **Panneau** (4.0+) : groupe de sections ; paramètres `title`, `description`, `priority`. Les thèmes ne devraient en général pas en créer. Affiché seulement s'il contient une section avec au moins un contrôle. Une section sans panneau apparaît à la racine.
- **Section** : `title`, `description`, `panel`, `priority`, `capability`, `theme_supports`.
- **Réglage** (`add_setting`) : `type` (`theme_mod` ou `option`), `capability`, `theme_supports`, `default`, `transport` (`refresh` | `postMessage`), `sanitize_callback` (le plus important avec `default`), `sanitize_js_callback`.
  - `theme_mod` : lié au thème actif. `option` : global au site, indépendant du thème (plutôt pour les extensions).
  - Identifiants réservés : préfixes `widget_`, `sidebars_widgets[`, `nav_menu[`, `nav_menu_item[`.
- **Contrôle** (`add_control`) : `type`, `section` (obligatoire), `priority`, `label`, `description`, `input_attrs`, `active_callback`, `choices`, `allow_addition`, `mime_type`.
  - Types intégrés : `checkbox`, `textarea`, `radio`, `select`, `dropdown-pages`, et tout type d'`input` HTML (`text`, `number`, `range`, `url`, `tel`, `email`, `search`, `time`, `date`, `datetime`, `week`).
  - Contrôles du cœur : couleur, média (enregistre l'**identifiant** de la pièce jointe), téléversement (enregistre l'**URL**), image recadrée (4.3).
- **Objets personnalisés** : sous-classes de `WP_Customize_Control` / `Section` / `Panel` ; `render_content()` est la méthode surchargée.

## Contexte [Doc]
- `active_callback` masque/affiche contrôles, sections, panneaux selon la page prévisualisée ; un conteneur dont tous les contrôles sont masqués se masque ; filtre global `customize_control_active`.
- Les zones de widgets n'apparaissent que si elles sont visibles sur la page prévisualisée.

## Limites [Déduit]
- Le Customizer ne décrit pas la **structure** des pages (modèles, en-tête, pied) : c'est le rôle de l'éditeur de site.
- Les réglages dépendent du thème : « parité » signifie couvrir les familles de réglages (identité, couleurs, fond, menus, zones, accueil, CSS), pas copier chaque réglage.
