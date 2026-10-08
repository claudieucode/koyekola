# Inventaire des capacités Elementor et situation dans KOLAKISA (phase 1, 8 octobre 2026)

**Sources** (consultées le 8 octobre 2026) : elementor.com/help/build-with-the-editor/widgets/ (liste officielle des widgets),
elementor.com/help/elementor-pro-vs-free/ (fonctions Pro), pages Éditeur V4 (éléments atomiques, classes, variables,
composants, interactions). Ces pages sont longues : la liste des widgets a été lue à 100 000 caractères sur 117 000 ;
**cet inventaire n'est pas définitif** (règle 46 : toute découverte est ajoutée ici).

**Légende « Existe »** : ✅ oui, équivalent natif · 🔄 oui mais plus pauvre · ⚠️ partiel · ❌ non · 🚫 refusé (raison) · ➡️ couvert par un autre module KOLAKISA.
**Preuve** : « type » = présent dans `nodes.editorSpec().types` (vérifié) ; « doc » = indiqué comme fait et testé dans
`docs/editeur-pages-audit.md` (non revérifié ligne à ligne) ; « — » = rien trouvé dans le code.
**Priorité** : P1 écart structurant, P2 utile, P3 confort, — rien à faire.

## A. Structure et mise en page
| ID | Catégorie | Fonctionnalité Elementor | Existe | État / preuve | Action | Prio | Dépendances | Test requis |
|---|---|---|---|---|---|---|---|---|
| A01 | Structure | Container flex / grid / imbriqué | ✅ | type container, grid, stack, group, columns | conserver | — | — | existant |
| A02 | Structure | Direction, wrap (inversé), justify, align, gap, order, grow, shrink, basis | ✅ | doc V2 parties 4–5 | conserver | — | — | existant |
| A03 | Structure | Largeur, hauteur, min/max, overflow, z-index | ✅ | STYLE_PROPS | conserver | — | — | existant |
| A04 | Structure | Position relative / sticky / absolute / fixed + décalages | ✅ | doc V2 partie 4 | conserver | — | — | existant |
| A05 | Structure | Grille : colonnes, lignes, étendue, modèle de colonnes | ✅ | doc V2 partie 5 | conserver | — | — | existant |
| A06 | Structure | Grille : `auto-fit` / `auto-fill` / `minmax`, zones nommées | ⚠️ | modèle de colonnes libre (« 2fr 1fr »), pas de zones nommées (à vérifier pour minmax/auto-fit) | vérifier puis compléter | P3 | grid | serveur + navigateur |
| A07 | Structure | Largeur de section (étroite…pleine) | ✅ | doc V2 partie 60 | conserver | — | — | existant |
| A08 | Structure | Éléments « Inner Section » (legacy) | ✅ | colonnes / groupes imbriqués | conserver | — | — | — |

## B. Widgets de contenu
| ID | Catégorie | Widget Elementor | Existe | Équivalent KOLAKISA | Action | Prio |
|---|---|---|---|---|---|---|
| B01 | Contenu | Heading | ✅ | heading (h1–h6) | — | — |
| B02 | Contenu | Text Editor | ✅ | text (riche nettoyé) | — | — |
| B03 | Contenu | Image / Image Box | ✅ | image, imagebox | — | — |
| B04 | Contenu | Icon / Icon Box / Icon List | ✅ | icon, iconbox, iconlist | — | — |
| B05 | Contenu | Button | ✅ | button (icône, rel) | — | — |
| B06 | Contenu | Divider / Spacer | ✅ | divider, spacer | — | — |
| B07 | Contenu | Google Maps | ✅ | map | — | — |
| B08 | Contenu | Video | ✅ | video, embed (YouTube, Vimeo…) | — | — |
| B09 | Contenu | Image Carousel / Basic Gallery / Gallery | ✅ | carousel, gallery (visionneuse) | — | — |
| B10 | Contenu | Audio / SoundCloud | ✅ | audio, embed | — | — |
| B11 | Contenu | HTML | ✅ | html (nettoyé) | — | — |
| B12 | Contenu | Shortcode | ❌ | — ; l'équivalent sûr serait les **étiquettes dynamiques** (D01) | via D01 | P1 |
| B13 | Contenu | Text Path | ❌ | — | construire (SVG interne, texte échappé) | P3 |
| B14 | Contenu | Lottie | 🚫 | pas de bibliothèque locale, pas de JSON externe exécuté | documenter | — |
| B15 | Contenu | Video Playlist | ❌ | — | construire sur embed (liste d'URL validées) | P3 |
| B16 | Contenu | Slides (diaporama plein cadre avec texte et bouton) | ⚠️ | carousel d'images seulement | compléter : diapositives avec titre / texte / bouton | P2 |
| B17 | Contenu | Blockquote | ✅ | quote | — | — |
| B18 | Contenu | Read More | ❌ | — | construire (lien « lire la suite » lié au contexte de boucle) | P3 |
| B19 | Contenu | Call to Action | ⚠️ | blocs prêts (bandeau) mais pas d'élément unique | construire l'élément | P2 |
| B20 | Contenu | Alert | ✅ | alert | — | — |
| B21 | Contenu | Code Highlight | ✅ | code | — | — |
| B22 | Contenu | Menu Anchor | ✅ | menuanchor | — | — |
| B23 | Contenu | Sidebar | ❌ | — | construire (zone de widgets du site) ou refuser | P3 |
| B24 | Contenu | Template (insérer un modèle) | ⚠️ | composants synchronisés jouent ce rôle | documenter | — |

## C. Widgets interactifs et marketing
| ID | Widget Elementor | Existe | Équivalent | Action | Prio |
|---|---|---|---|---|---|
| C01 | Accordion / Toggle / Tabs (+ imbriqués) | ✅ | accordion, toggle, tabs (icônes, verticaux) | — | — |
| C02 | Flip Box | ✅ | flipbox | — | — |
| C03 | Progress Bar / Counter / Countdown / Rating | ✅ | progress, counter, countdown, rating | — | — |
| C04 | Testimonial / Testimonial Carousel / Reviews | ⚠️ | testimonial seul ; pas de carrousel ni d'avis liés aux formations | compléter (carrousel) ; Reviews → courserating existant à relier | P2 |
| C05 | Price Table / Price List | ✅ | pricing, pricelist | — | — |
| C06 | Animated Headline | ✅ | animatedheading | — | — |
| C07 | Hotspot | ✅ | hotspot | — | — |
| C08 | Social Icons / Share Buttons | ✅ | social, sharebuttons (pictogrammes dessinés) | — | — |
| C09 | Facebook Like / Page / Comments / Embed, Instagram | ⚠️ | embed couvre une liste blanche ; pas de Facebook / Instagram | vérifier la liste ; ajouter seulement via URL de partage sûre | P3 |
| C10 | Off-Canvas / Popup in page | ✅ | modal (fenêtre et panneau latéral) | — | — |
| C11 | Popup Builder (déclencheurs, fréquence) | ➡️ | module Marketing › Pop-ups | pas de doublon | — |
| C12 | Form (multi-étapes, conditions, upload, e-mail, webhook, intégrations, anti-spam) | ➡️ | module Formulaires (champs, conditions, fichier) + automatisations (action webhook ajoutée le 8 oct.) | vérifier : multi-étapes, honeypot, redirections | P2 |
| C13 | Login / Register | ⚠️ | account (état + panier) ; pas de formulaire de connexion dans la page | construire des liens/formulaires vers l'authentification existante | P2 |
| C14 | PayPal Button / Stripe | ➡️ | paiement par Stripe côté serveur | — | — |
| C15 | Tooltip, Reading progress | ✅ | tooltip, readingprogress | — | — |

## D. Données dynamiques, boucles, thème
| ID | Fonctionnalité | Existe | État | Action | Prio | Dépendances | Test |
|---|---|---|---|---|---|---|---|
| D01 | **Étiquettes dynamiques** `{{post.title}}`, `{{product.price}}`… utilisables dans texte, image, lien, bouton, fond, attributs, avec repli, format, conditions | ⚠️ | seul `dyntext` (prénom, date, compteurs) ; aucun branchement d'une propriété quelconque | **construire un moteur de sources** (`registerDynamicSource`) + insertion dans les champs | **P1** | blog, formations, contact, site | serveur + navigateur + publication |
| D02 | **Loop Grid / Loop Carousel / Loop Item** (modèle d'élément répété, requête, filtres, tri, pagination, nombre, taxonomies, recherche, responsive) | ⚠️ | `posts` (derniers articles, nombre, grille/liste) et `courselist` seulement | **construire** un conteneur de boucle avec un modèle d'élément libre, sur articles et formations | **P1** | D01, blog, catalogue | idem |
| D03 | Posts / Portfolio / Archive Posts | ⚠️ | posts, courselist | couvert par D02 | P1 | D02 | — |
| D04 | Taxonomy Filter / Search Results | ⚠️ | `search` (champ) ; pas de filtre par catégorie | construire le filtre (catégories du blog / catalogue) | P2 | D02 | idem |
| D05 | Widgets de page unique : Post Title / Content / Excerpt / Featured Image / Info / Navigation / Author Box / Comments | ❌ | le blog les rend lui-même | construire comme **sources dynamiques + éléments** utilisables dans un modèle d'article | P1 | D01, D07 | idem |
| D06 | Breadcrumbs / Sitemap / Table of Contents | ✅ / ❌ / ✅ | breadcrumb, toc ; pas de plan du site | Sitemap : construire (pages publiées) | P3 | pages | idem |
| D07 | **Theme Builder** : Single Post, Single Page, Archive, Category, Tag, Author, Search Results, 404, Header, Footer, avec conditions d'affichage | ⚠️ | en-tête et pied (+ variantes par page) ✅ ; **article, archives, recherche, 404 non gérés par le moteur de pages** | **construire** les modèles de thème (rendu du blog par un modèle choisi, avec repli sur le rendu actuel) | **P1** | D01, D05, blog | idem |
| D08 | Conditions d'affichage (utilisateur connecté, rôle, page, catégorie, tag, produit, panier, date, appareil, URL, paramètre) | ⚠️ | audience (11 règles) + dates ✅ ; **absents** : appareil (déjà par écran), paramètre d'URL, page / catégorie, panier, rôle formateur | compléter (`registerCondition`) | P2 | — | serveur + publication |
| D09 | Champs personnalisés / taxonomies / données utilisateur | ❌ | pas de champs personnalisés dans le CMS actuel | à décider avec D01 (exposer étiquettes et catégories du blog ; champs personnalisés = hors périmètre sans modèle de données) | P3 | — | — |

## E. E-commerce (équivalents natifs sur le panier des formations)
| ID | Widget Elementor / Woo | Existe | Équivalent | Action | Prio |
|---|---|---|---|---|---|
| E01 | Add To Cart / Custom Add To Cart | ✅ | addtocart | — | — |
| E02 | Product title / price / image / description / rating | ⚠️ | `course` (carte), `courserating` ; pas d'éléments séparés prêts pour un modèle de fiche | construire des éléments de fiche **liés à la formation du contexte** (via D01/D07) | P1 |
| E03 | Product Images / Gallery / Meta / Stock / Related / Upsells / Data Tabs / Short Description | ❌ | — ; **stock : sans objet** pour des formations (accès numérique) ; related/upsells possibles | construire sauf stock (documenté) | P2 |
| E04 | Products / Product Categories / Shop / Archive | ⚠️ | courselist | couvert par D02 + filtre catalogue | P1 |
| E05 | Cart / Mini cart (Menu Cart) | ⚠️ | `account` affiche le panier | construire mini-panier (compteur + lien) | P2 |
| E06 | Checkout / My Account / Notice / Purchase Summary | ❌ | pages serveur existantes (`/panier`, `/commande`, `/mes-formations`) | liens / intégrations, pas de réécriture du paiement | P3 |

## F. Système de design
| ID | Fonctionnalité | Existe | État | Action | Prio |
|---|---|---|---|---|---|
| F01 | Couleurs et typographies globales (h1–h6, texte, boutons) | ✅ | tokens + variables `--kw-*` | — | — |
| F02 | Variables personnalisées (espacements, etc.) | ⚠️ | espacements, rayons, ombres ✅ ; pas de variables libres nommées | compléter (variables utilisateur nommées → `--kw-*`) | P2 |
| F03 | **Classes globales** (V4) : une classe appliquée à plusieurs éléments, modifiée en un endroit | ❌ | « classes CSS » = simple attribut ; pas de classe qui porte des styles | **construire** (classe = ensemble de styles par écran / état, héritage, surcharge locale) | **P1** |
| F04 | Composants réutilisables (instances, synchro, détacher) | ✅ | composants synchronisés ou copies | vérifier : surcharges de propriétés par instance | P2 |
| F05 | Styles copier / coller, réinitialiser | ✅ | — | — | — |
| F06 | Export / import de classes et variables entre sites | ❌ | export de page seulement | après F02/F03 | P3 |
| F07 | Polices personnalisées (envoi) | ⚠️ | polices hébergées ; envoi libre non vérifié | vérifier | P3 |

## G. Avancé, mouvement, effets
| ID | Fonctionnalité | Existe | Preuve | Action | Prio |
|---|---|---|---|---|---|
| G01 | Marges, intérieurs, bordures par côté, arrondis par coin, ombres, filtres, transformations, opacité, mélange | ✅ | STYLE_PROPS (86) | vérifier : filtres et modes de mélange complets | P3 |
| G02 | Fonds : couleur, dégradé, image, vidéo, voile, répétition, fixe, survol, responsive | ✅ | doc V3 | diaporama de fond : ❌ | P3 |
| G03 | Animations d'entrée / survol / sortie, transitions, défilement, parallaxe, sticky, souris, 3D | ✅ | motion.js, MOTION | animations de sortie : à vérifier | P3 |
| G04 | Interactions (clic, survol, arrivée à l'écran → afficher, masquer, ouvrir…) | ✅ | ixTriggers / ixActions | — | — |
| G05 | CSS personnalisé de l'élément et de la page (confiné), classes, ID, attributs data-/aria- | ✅ | normalizePageCss | — | — |
| G06 | JavaScript personnalisé | 🚫 | sécurité (domaine des comptes élèves) | documenter | — |
| G07 | Visibilité par écran | ✅ | doc V2 | — | — |
| G08 | Fenêtres flottantes, barre / bouton flottants | ⚠️ | modal ; barre flottante = position fixe d'un conteneur | vérifier qu'une barre fixe est réalisable sans code | P3 |

## H. Outils de l'éditeur
| ID | Fonctionnalité | Existe | Action |
|---|---|---|---|
| H01 | Annuler / rétablir, historique, versions, restauration, autosave, reprise après plantage | ✅ | — |
| H02 | Copier / coller (éléments, style, plusieurs, entre pages), dupliquer | ✅ | — |
| H03 | Menu contextuel (modifier, dupliquer, copier, coller, coller le style, supprimer, enregistrer, masquer, verrouiller, renommer) | ✅ | « copier l'ID / la classe » : à vérifier |
| H04 | Navigateur / calques (hiérarchie, masquer, verrouiller, renommer, glisser) | ✅ | — |
| H05 | Recherche, catégories, favoris, récents, widgets désactivés | ✅ | — |
| H06 | Glisser-déposer imbriqué, multi-sélection (déplacement, suppression, duplication, édition groupée) | ✅ | édition groupée : à vérifier |
| H07 | Modèles : page, bloc, conteneur, composant ; exporter / importer ; catégoriser ; prévisualiser | ✅ | catégories de modèles : à vérifier |
| H08 | Règles, guides, grille, magnétisme | ✅ | fait le 8 octobre (fusionné) |
| H09 | Panneaux Contenu / Style / Avancé cohérents | ✅ | — |
| H10 | Aperçu responsive réel, publication | ✅ | — |
| H11 | Registre d'extension : `registerWidget` ✅ ; `registerControl`, `registerDynamicSource`, `registerTemplate`, `registerCondition`, `registerExtension` | ⚠️ | **construire** les 5 manquants avec D01 / D02 / D07 / D08 |
| H12 | Accessibilité (ARIA, clavier, focus, contraste), SEO (hiérarchie des titres, alt, lazy loading) | ✅ | vérifier les nouveaux éléments à chaque lot |
| H13 | Éditeur V4 : édition en ligne, éléments atomiques, composants atomiques | ✅ | édition directe des textes ✅ |
| H14 | IA (Angie) | ❌ | hors périmètre ; le module IA du marketing existe | — |

## Synthèse
Le chiffrage de couverture sera calculé en phase 12 à partir de cet inventaire et des tests (pas d'estimation ici).
**Les 5 écarts structurants (P1)** : D01 étiquettes dynamiques, D02 boucles, D07 modèles de thème (article, archives,
recherche, 404), F03 classes globales, E02 éléments de fiche formation. Viennent ensuite les écarts P2 (diapositives,
appel à l'action, mini-panier, conditions d'affichage supplémentaires, variables libres, filtre par catégorie, connexion).
