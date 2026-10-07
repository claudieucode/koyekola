# Éditeur de pages KOLAKISA — audit, inventaire et suivi (7 octobre 2026)

Référence de la rénovation « éditeur professionnel ». Rien de ce qui est marqué « conservé » ne doit être remplacé :
on complète et on améliore dans l'architecture existante.

## Architecture existante (conservée)

- **Document unique** : `mk_landing_pages` (brouillon, publiée, versions). Contenu = `{ sections, title, description,
  seo, theme }`. Une section « libre » (`layout`) contient un **arbre d'éléments** (`src/marketing/pages/nodes.js`) ;
  les sections prêtes (bandeau, formulaire, points forts…) sont dans `sections.js`.
- **Grammaire fermée et validée côté serveur** : registre `NODE_TYPES` (types, catégories, normalisation des
  propriétés), `STYLE_PROPS` (une propriété de style = un validateur), styles par écran (ordinateur / tablette / mobile,
  hérités du plus grand) et par état (survol, focus, clic). Le CSS est généré sous `.kw-n-<id>` : aucune valeur libre,
  aucun HTML / CSS / JS libre (les pages sont sur le même domaine que les comptes des élèves).
- **Rendu unique** : `views/marketing-public/_sections.ejs` + `_node.ejs`, utilisé par le canevas de l'éditeur
  (`POST /rendu`, mode éditeur), l'aperçu (`/apercu`) et la page publique (`/p/<adresse>`). Canevas = page réelle.
- **Éditeur** : `public/js/page-builder.js` (vanilla, sans dépendance), `views/marketing/page-builder.ejs`,
  `public/css/page-builder.css` ; aides du canevas dans `public/css/landing.css`.
- **Design system de site** : `tokens.js` (couleurs, polices, tailles h1–h4 / texte / bouton, espacements, rayons,
  ombres, champs), variables `--kw-*`, édité dans Site Web › Design system.

## Inventaire

| Fonctionnalité | Existe | Fonctionnelle | À améliorer | Conserver | Doublon | Risque |
|---|---|---|---|---|---|---|
| Canevas visuel (rendu réel, sélection, édition directe des textes) | oui | oui | — | oui | non | — |
| Barre d'actions sur l'élément, menu clic droit, palette de commandes (Ctrl+K) | oui | oui | — | oui | non | — |
| Calques / navigateur (renommer, masquer, verrouiller, glisser, supprimer, dupliquer) | oui | oui | — | oui | non | — |
| Mode « Structure » (éditeur de blocs, façon Gutenberg) | **fait (2a03e7e)** | oui | — | oui | non | — |
| Inspecteur par type (Contenu / Style / Avancé), propriétés compactes | oui | oui | — | oui | non | — |
| Responsive par écran + héritage, états (survol, focus, clic) | oui | oui | — | oui | non | — |
| Mise en page : display, flex, grille (colonnes), alignements, gap, z-index, débordement | oui | oui | écarts lignes / colonnes séparés : **fait** | oui | non | — |
| Marges / intérieurs par côté, liables | oui | oui | — | oui | non | — |
| Bordure : style, épaisseur, couleur, arrondi (par coin) | oui | oui | épaisseur par côté (liable) : **fait** | oui | non | — |
| Fond : couleur, image, dégradé, taille, position | oui | oui | voile, répétition, fond fixe : **fait** | oui | non | — |
| Typographie complète | oui | oui | — | oui | non | — |
| Icônes (bibliothèque du site) | oui | oui | choix visuel avec recherche : **fait** | oui | non | — |
| Onglets (fonctionnels, clavier) | oui | oui | verticaux, jusqu'à 20 : **fait** | oui | non | — |
| Accordéon | oui | oui | une seule ouverte (option), apparition douce : **fait** | oui | non | — |
| Styles globaux (design system de site) | oui | oui | accès depuis l'éditeur : **fait** | oui | non | — |
| Composants réutilisables (instances synchronisées, globaux possibles) | oui | oui | — | oui | non | — |
| Blocs (patterns) : 20 compositions d'éléments réels (+ icône + texte, équipe, étapes) | oui | oui | — | oui | non | — |
| Modèles de pages : 19 (dont À propos, Contact, Portfolio, SaaS, Entreprise) | oui | oui | — | oui | non | — |
| Copier / coller / dupliquer / copier-coller le style | oui | oui | réinitialiser le style : **fait** | oui | non | — |
| Annuler / rétablir (150 étapes, frappes regroupées) | oui | oui | — | oui | non | — |
| Sauvegarde auto (1 s), manuelle (Ctrl+S), copie locale, reprise après erreur réseau, conflit (409), fermeture protégée | oui | oui | — | oui | non | — |
| Versions : liste, aperçu, restauration | oui | oui | comparaison élément par élément : **faite** | oui | non | — |
| Aperçu réel (ordinateur / tablette / mobile) | oui | oui | — | oui | non | — |
| Publication réelle (validation serveur) | oui | oui | — | oui | non | — |
| Glisser-déposer (canevas, calques, bibliothèque), zones de dépôt | oui | oui | — | oui | non | — |
| Règles, guides, grille, zoom | oui | oui | — | oui | non | — |
| Médiathèque | oui | oui | — | oui | non | — |
| Personnalisation (public par élément), tests A/B, tunnels | oui | oui | — | oui | non | — |
| Éléments : badge, barre de progression, chronologie, carrousel, menu de navigation (liens et ancres #) | **faits** | oui | — | oui | non | — |
| Éléments déjà couverts par des blocs (cartes, témoignages, tarifs, chiffres clés, FAQ) | oui (blocs) | oui | — | oui | non | — |
| Formulaire de contact / inscription | oui (section formulaire, module Formulaires) | oui | — | oui | non | — |
| Pop-ups | oui (module Marketing › Pop-ups) | oui | — | oui | non | — |

## Écarts volontaires (non construits, avec la raison)

- **HTML / CSS / JS libres, attributs personnalisés, classes CSS** : refusés. Les pages sont servies sur le même
  domaine que les comptes des élèves ; du code libre permettrait de voler leurs sessions.
- **Position absolue libre** : refusée (mise en page en flux, responsive garanti) ; positions relative et collante
  disponibles, décalages et transformations aussi.
- **Fenêtre modale / pop-up dans la page** : déjà fournie par le module Pop-ups (déclencheurs, ciblage, mesure) ;
  pas de deuxième système.
- **Icônes de réseaux sociaux** : la bibliothèque d'icônes du site ne contient pas les logos des marques ; pas de faux
  logos. Les liens sociaux se font avec des liens ou boutons.

---

# Mission V2 (7 octobre 2026) — inventaire des 70 parties

Légende : **E** existe et fonctionne · **P** partiel (à compléter) · **M** manquant (à construire) · **R** refusé (raison) · **X** existe ailleurs dans KOLAKISA (réutilisé, pas de doublon).

| Partie | État avant | Ce qui est fait dans la V2 |
|---|---|---|
| 1 Deux modes, un document | E | — |
| 2 Bibliothèque : recherche, catégories, composants, blocs | E · favoris / récents **M** | favoris et récents |
| 3 Structures (section, conteneur, colonnes, grille, pile, groupe, espace, séparateur) | E | — |
| 4 Flex : direction, répartition, alignement, retour à la ligne, écarts, dimensions, plan | E · retour inversé, positions absolue / fixe **M** | retour inversé ; positions absolue et fixe avec décalages haut / droite / bas / gauche |
| 5 Grille : colonnes, écarts | E · largeurs de colonnes, lignes, étendue **M** | modèle de colonnes (ex. 2fr 1fr), lignes, étendue d'un enfant sur plusieurs colonnes / lignes |
| 6 Texte | E · ombre du texte **M** | ombre du texte |
| 7 Image | E · titre, nouvel onglet **M** | titre, lien dans un nouvel onglet |
| 8 Galerie | P | visionneuse (agrandissement), légendes, liens, mosaïque |
| 9 Vidéo | E · proportions **P** | proportions dans le style |
| 10 Audio | P | lecture en boucle |
| 11 Bouton | E · icône, rel **M** · désactivé **R** (un bouton de page est un lien) | icône avant / après, lien sponsorisé / nofollow |
| 12 Icône | E · lien **M** · envoi de SVG **R** (un SVG peut contenir du script) | lien |
| 13 Icône + texte | E (bloc) | — |
| 14 Séparateur | P | style, épaisseur, couleur |
| 15 Espace | E (hauteur par écran) | — |
| 16 Onglets | E · icône **M** | icône par onglet |
| 17 Accordéon | E · forme de l'icône **M** | flèche, plus / moins ou aucune |
| 18 Bascule (toggle) | M | élément « Bascule » |
| 19 Carrousel | P | points, lecture automatique (intervalle), boucle |
| 20 Formulaires | X (module Formulaires : champs, obligatoires, conditions, fichier, propriétés) · mot de passe **R** (une page marketing ne collecte pas de mot de passe) | — |
| 21 Pop-ups | X (module Pop-ups, déclencheurs) · fenêtre dans la page **M** | élément « Fenêtre (modale) » |
| 22 Alerte | M | élément « Alerte » |
| 23 Progression | E · animation **M** | animation à l'apparition |
| 24 Compteur | M | élément « Compteur » animé |
| 25 Témoignage | E (bloc) · avatar, note **M** | élément « Témoignage » |
| 26 Tarif | E (bloc) · élément dédié **M** | élément « Offre tarifaire » |
| 27 FAQ | E | — |
| 28 Réseaux sociaux | M | élément « Réseaux sociaux » (pictogrammes dessinés pour KOLAKISA) |
| 29 Fil d'Ariane | M | élément « Fil d'Ariane » (+ données structurées) |
| 30 Navigation | P | sous-menus, menu mobile (bouton), pages du site en un clic |
| 31 Tableau | P | pied de tableau, lignes alternées, alignement |
| 32–34 Conteneur, fond, bordure | E | — |
| 35 Ombre | P (préréglages) | ombre personnalisée (décalages, flou, étendue, couleur) |
| 36 États | E (survol, focus, clic) · visité **R** (le navigateur le limite aux couleurs, pour la vie privée) · désactivé **R** | — |
| 37 Responsive | E | — |
| 38 Avancé | E · visibilité par écran des éléments **M** · classes / attributs libres **R** (sécurité) | visibilité par écran |
| 39 Animations | M | animations d'entrée (fondu, glissement, zoom ; durée, délai) ; effets au survol ; transition |
| 40 Transformations | P | inclinaison, origine |
| 41–43 Couleurs, typographies, design system | E (site) · titres 5 et 6 **M** | titres 5 et 6 |
| 44 Composants réutilisables | E | — |
| 45 Modèles (pages, sections, en-têtes, pieds) | E · en-tête / pied **M** | blocs « En-tête » et « Pied de page » |
| 46 Blocs (patterns) | E (composants insérables en copie indépendante = blocs enregistrés) | — |
| 47–52 Copier / coller, annuler, navigateur, palette, versions, médias | E | — |
| 53 SEO | E (moteur SEO du site) | — |
| 55–59 Glisser-déposer, édition directe, multi-sélection, guides, duplication | E | — |
| 60 Réglages de page | E · largeur des sections libres **M** | largeur de section (étroite, normale, large, pleine) |
| 61–63 Aperçu, enregistrement, performances | E | — |

**État au 7 octobre 2026 (soir)** : tout ce qui figure dans la colonne « Ce qui est fait dans la V2 » est construit,
rendu sur la page publique et testé (serveur : tests/editeur-v2.test.js ; navigateur : éditeur et page publiée, dont
mobile et « animations réduites »). Une vérification de plus a mis en évidence et corrigé : la typographie globale du site
(tailles de titres, texte, boutons) ne s'appliquait pas aux éléments des sections libres ; elle s'y applique désormais,
le réglage propre d'un élément restant prioritaire.

---

# Mission V3 (7 octobre 2026) — état fonctionnalité par fonctionnalité

États : **IMPLEMENTÉE** (fonctionne de bout en bout, testée) · **PARTIELLE** · **NON IMPLÉMENTÉE** · **À CORRIGER**.
Tests : serveur `tests/editeur-v3.test.js`, `editeur-v2`, `editeur-pro`, `page-builder-*` ; navigateur : 13 scénarios.

| Fonctionnalité | État | Réellement fonctionnelle ? | Testée ? | Emplacement |
|---|---|---|---|---|
| Éditeur visuel / Éditeur en blocs, même document | IMPLEMENTÉE | oui | oui | page-builder.js (setMode, renderDoc) |
| Barre supérieure sombre, menu principal, menu de publication | IMPLEMENTÉE | oui | oui | page-builder.ejs, page-builder.js (showMenuEntries) |
| Historique des actions (libellés, retour à un point, rétablir) | IMPLEMENTÉE | oui | oui | page-builder.js (pastLabels, openHistory) |
| Révisions persistées (versions publiées, aperçu, comparaison, restauration) | IMPLEMENTÉE | oui | oui | pages/index.js, compare.js |
| Sauvegarde automatique, copie locale, conflits, reprise réseau | IMPLEMENTÉE | oui | oui | page-builder.js (save, backup) |
| Navigateur (calques) : arbre, glisser, renommer, masquer, verrouiller, dupliquer, supprimer, recherche | IMPLEMENTÉE | oui | oui | page-builder.js (renderTree) |
| Bibliothèque : recherche par pertinence, catégories, favoris, récents, composants, blocs | IMPLEMENTÉE | oui | oui | page-builder.js (renderElements) |
| Structures : section, conteneur, flex, grille (modèle de colonnes, étendue), colonnes, groupe, pile | IMPLEMENTÉE | oui | oui | nodes.js |
| Éléments de base : titre, texte, liste, citation, code, tableau, image, vidéo, audio, bouton, icône, séparateur, espace | IMPLEMENTÉE | oui | oui | nodes.js, _node.ejs |
| HTML (nettoyé : sans script, style, cadre, formulaire, événement ; SVG sûr) | IMPLEMENTÉE | oui | oui (attaques testées) | nodes.js (sanitizeHtmlBlock) |
| Contenu intégré (YouTube, Vimeo, Google Maps, Calendly, Spotify, SoundCloud, Google Forms, Typeform, Loom, Canva) | IMPLEMENTÉE | oui | oui | nodes.js (embedOf) |
| Interactifs : onglets, accordéon, bascule, carrousel, galerie + visionneuse, fenêtre, panneau latéral, menu (sous-menus, mobile), infobulle, image à points, compteur, barre de progression, compte à rebours | IMPLEMENTÉE | oui | oui | nodes.js, landing.js |
| Contenu : liste d'icônes, témoignage, offre tarifaire, FAQ, chronologie, badge, alerte, fil d'Ariane, réseaux sociaux | IMPLEMENTÉE | oui | oui | nodes.js |
| Contenu dynamique : derniers articles, formations du catalogue, recherche (blog / catalogue), compte du visiteur + panier, texte dynamique (prénom, date, compteurs) | IMPLEMENTÉE | oui | oui | landing/index.js (dynamicProps), bridge/catalog.js |
| Styles : affichage (bloc, flex, grille, en ligne), dimensions, débordement, alignements, écarts, marges, typographie, fond (couleur, image, dégradé, voile, répétition, fixe), bordures par côté, arrondis par coin, ombres (préréglage et personnalisée), opacité, transformations (inclinaison, origine), filtres, flou d'arrière-plan, transitions | IMPLEMENTÉE | oui | oui | nodes.js (STYLE_PROPS), inspecteur |
| Vidéo de fond (conteneurs) | IMPLEMENTÉE | oui | oui (validation, rendu) | nodes.js, _node.ejs |
| Responsive : ordinateur / tablette / mobile, héritage, visibilité par écran | IMPLEMENTÉE | oui | oui | nodes.js (pageCss), inspecteur |
| États : survol, focus, clic | IMPLEMENTÉE | oui | oui | nodes.js (STATES) |
| Interactions : au clic, au survol, à l'arrivée à l'écran, au chargement → afficher, masquer, basculer, défiler, ouvrir une fenêtre, rejouer une animation ; état de départ masqué | IMPLEMENTÉE | oui | oui | nodes.js, landing.js |
| Animations : fondu, glissements, zoom, rebond, rotation, dévoilement, bascule 3D ; durée, délai, courbe, répétition ; effets au survol | IMPLEMENTÉE | oui | oui | landing.css, landing.js |
| Conditions d'affichage : public (contacts, clients, étiquettes, score…) et programmation par dates | IMPLEMENTÉE | oui | oui | nodes.js (visibleTree) |
| CSS de l'élément (+ survol), CSS de la page (confiné), classes, ID (ancre), attributs data- / aria- | IMPLEMENTÉE | oui | oui | nodes.js (cssDeclarations, normalizePageCss) |
| Styles globaux (couleurs, typographies h1–h6, boutons, espacements) appliqués aux éléments | IMPLEMENTÉE | oui | oui | tokens.js, landing.css |
| Modèles : de pages (enregistrer, réutiliser, supprimer), blocs (22), composants synchronisés / copies, export / import JSON | IMPLEMENTÉE | oui | oui | pages/index.js, migration 042 |
| En-tête et pied de page de site (parties globales) | IMPLEMENTÉE | oui | oui | pages/index.js (withSiteParts), site.ejs |
| Transformer un bloc (titre, paragraphe, citation, liste) | IMPLEMENTÉE | oui | oui | page-builder.js (transformNode) |
| Aperçu ordinateur / tablette / mobile, publication, mise hors ligne | IMPLEMENTÉE | oui | oui | landing.js (web) |
| SEO (titre, description, adresse, canonique, partage) : moteur SEO existant réutilisé | IMPLEMENTÉE | oui | oui (existant) | pages/index.js (normalizeSeo) |
| Formulaires (champs, validation, conditions, fichier, succès) | IMPLEMENTÉE (module Formulaires existant, relié à la page) | oui | oui (existant) | marketing/forms |
| Champs de formulaire comme éléments séparés dans la page | NON IMPLÉMENTÉE | — | — | doublon du module Formulaires : refusé volontairement |
| JavaScript libre, attributs d'événement, CSS avec ressources externes, classes kw-/lp- | NON IMPLÉMENTÉE | — | — | refus de sécurité (domaine des comptes élèves) |
| CSS de page avec @media | NON IMPLÉMENTÉE | — | — | @ refusé ; le responsive se règle par écran dans l'inspecteur |
| Lottie, envoi de fichiers SVG, liste de lecture vidéo | NON IMPLÉMENTÉE | — | — | pas de bibliothèque Lottie locale ; un SVG envoyé peut contenir du script (le SVG collé dans l'élément HTML est accepté, nettoyé) |
| Modèles de thème : article de blog, archives, résultats de recherche, 404 | NON IMPLÉMENTÉE | — | — | ces pages sont rendues par le blog et le site principal, pas par le moteur de pages |
| États « visité » et « désactivé » | NON IMPLÉMENTÉE | — | — | visité : limité par les navigateurs ; un bouton de page est un lien |

# Étape 1 — bibliothèque de widgets façon Elementor (7 octobre 2026)

## 1A — Audit (avant tout code)

| Point | Où / comment |
|---|---|
| Éditeur | `views/marketing/page-builder.ejs` + `public/js/page-builder.js` (JS sans framework) |
| Panneau de gauche | onglets Éléments / Blocs / Page ; bibliothèque rendue par `elementGroups()` / `renderElements()` |
| Canevas | iframe `srcdoc` rendue par le serveur (`POST /marketing/pages/:id/rendu`), même gabarit que la page publique |
| Définition des widgets | `src/marketing/pages/nodes.js` : `NODE_TYPES` (validation), `PALETTE` (icône, contenu de départ), `WIDGETS` (fiche de bibliothèque), `STYLE_PROPS` ; envoyé au navigateur par `editorSpec()` |
| Rendu | `views/marketing-public/_node.ejs` (éditeur, aperçu, page publique) + comportements `public/js/landing.js` |
| Données | `mk_landing_pages` : brouillon JSON (`draft`) et version en ligne ; versions `mk_page_versions` |
| Sauvegarde | automatique (`PUT /brouillon`, 1 s), révision anti-conflit, copie de secours locale |
| Sélection | `select()` : calques, inspecteur, canevas et mode Structure synchronisés |
| Glisser-déposer | `draggableSource` / `canvasDropTarget` / `performDrop` / `moveTo` |
| Responsive | `styles.desktop / tablet / mobile` (héritage de l'écran plus grand), media queries générées |
| Styles | `pageCss()` : règles `.kw-n-<id>` par écran et par état, valeurs validées |
| Publication | `POST /publier.json` → version, comparaison, restauration, programmation |
| Permissions | rôles `viewer / editor / admin / owner` (`organizations.js`), `req.mk.can()` ; l'éditeur demande `forms.write` |

## 1B — Bibliothèque

- Onglet **Éléments** → sous-onglets **Widgets** (bibliothèque), **Composants** (composants de ce site) et **Globales** (composants partagés par tous les sites, `site_id` nul). L'ancien onglet « Composants » du haut est fusionné ici (pas de doublon). Sous-onglet mémorisé.
- Recherche « Rechercher un widget... » en temps réel : nom, catégorie et mots associés (fiche `WIDGETS`), triés par pertinence.
- Catégories dans l'ordre d'Elementor (Mise en page, Basique, Général, Formulaire, Avancé, Site, E-commerce, Réseaux sociaux, puis Sections prêtes), repliables, repli mémorisé ; la barre d'outils peut n'en afficher qu'une.
- **Cadenas réel** : une fiche peut exiger une permission (`requires`). Aujourd'hui : HTML → `pages.code` (rôle administrateur). Sans elle : cadenas et explication dans la bibliothèque, ajout / copie / duplication / détachement refusés dans l'éditeur, contenu non modifiable dans l'inspecteur, et **refus du serveur** (`lockedWidgetChanges`, erreur `forbidden_widget`) à l'enregistrement du brouillon, à la création depuis un modèle et pour les composants. Déplacer ou supprimer un widget réservé existant reste permis.
- Version du schéma de chaque widget exposée (`version`, 1 pour tous) ; la migration des réglages entre versions est prévue au lot 9 (widgets personnalisés).

## Lot 1 — Mise en page

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Conteneur (flexbox, imbricable) | oui | oui : balise HTML (div, section, header, footer, article, aside, nav), largeur encadrée / pleine largeur, direction, alignements, retour à la ligne, écart | oui | oui (styles par écran) | unitaire + navigateur |
| Grille | oui | oui : colonnes, largeurs libres, lignes, remplissage (dont « sans trous »), alignement des cases, écarts, balise HTML | oui | oui : 2 colonnes au plus sur tablette et 1 sur mobile d'elles-mêmes, sauf réglage propre à l'écran | unitaire + navigateur + page publiée (1280 / 900 / 390 px) |
| Colonnes / Colonne | oui (existant) | oui | oui | oui (empilées sur mobile) | suites existantes |
| Pile / Groupe | oui | oui (+ balise HTML) | oui | oui | unitaire |
| Section libre | oui (existant) | oui | oui | oui | suites existantes |

Non fait dans ce lot : conteneur cliquable en entier (lien sur toute la zone : il faudrait interdire les liens et boutons à l'intérieur), sélecteur de structures prêtes à l'ajout d'un conteneur (les « Blocs » couvrent déjà ce besoin).

## Lot 2 — Basique

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Titre | oui | oui + **lien sur tout le titre** (nouvel onglet), compté dans les clics | oui | oui | unitaire + navigateur + page publiée |
| Image | oui (existant) | lien, légende, titre, texte de remplacement obligatoire | oui | oui | suites existantes |
| Éditeur de texte | oui (existant) | texte riche, édition directe dans la page | oui | oui | suites existantes |
| Vidéo | oui (existant) | YouTube / Vimeo / fichier, lecture auto, boucle, commandes | oui | oui | suites existantes |
| Bouton | oui | oui + **taille** (petite / normale / grande) ; icône, apparence, nature du lien | oui | oui | unitaire + navigateur |
| Séparateur | oui | oui + **texte au milieu du trait** (gauche / centre / droite) | oui | oui | unitaire + navigateur |
| Espaceur | oui (existant) | tailles prêtes + hauteur libre (Style › Dimensions) | oui | oui (par écran) | suites existantes |
| **Google Maps** (nouveau) | oui (Basique, recherche « maps », « carte », « adresse ») | adresse, zoom, hauteur, titre accessible ; sans clé d'API ; représentée dans le canevas, chargée en aperçu et en ligne | oui | oui (largeur 100 %) | unitaire + navigateur + page publiée 1280 / 390 px |
| Icône | oui (existant) | icône, taille, lien, description | oui | oui | suites existantes |
| WPForms | — | **non construit** : aucune intégration WPForms réelle dans KOLAKISA (pas de WordPress). Les formulaires KOLAKISA arrivent au lot 4. | — | — | — |

## Lot 3 — Général

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Onglets, Accordéon, Carrousel d'images, Galerie, Liste d'icônes, Compteur, Barre de progression, Témoignage, Icônes réseaux sociaux, Alerte, HTML | oui (existants, rangés dans « Général » ; réseaux sociaux dans sa catégorie) | oui | oui | oui | suites existantes |
| **Boîte d'image** (nouveau) | oui (médiathèque à l'ajout) | image, titre (niveau), texte, lien (image + titre = un seul lien compté), visuel en haut / à gauche / à droite | oui | oui (empilé sur mobile) | unitaire + page publiée ; navigateur : ouverture de la médiathèque seulement |
| **Boîte d'icône** (nouveau) | oui | icône, taille, titre, texte, lien, position | oui | oui (empilé sur mobile) | unitaire + navigateur + page publiée mobile |
| **Évaluation** (nouveau) | oui (note réelle demandée à l'ajout) | demi-étoiles, sur 5 ou sur 10, libellé, note en chiffres, lisible par les lecteurs d'écran | oui | oui | unitaire + navigateur |
| **Ancre de menu** (nouveau) | oui (nom demandé, doublon refusé) | point d'arrivée invisible des liens « #nom » | oui | — | unitaire + navigateur (le bouton « #tarifs » fait défiler) |
| **SoundCloud** (raccourci) | oui | crée un « Contenu intégré » limité aux adresses SoundCloud (pas de second système) | oui | oui | unitaire + navigateur + page publiée |
| Code court | — | **non construit** : notion WordPress (shortcode) sans équivalent dans KOLAKISA | — | — | — |
| Colonne latérale | — | **non construit** : affiche une zone de widgets WordPress ; KOLAKISA n'en a pas | — | — | — |

## Lot 4 — Formulaire (module « Formulaires d'inscription » réutilisé)

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| **Formulaire** (nouveau) | oui : choix parmi les vrais formulaires (état publié / non publié indiqué), titre, introduction, texte du bouton, lien « Modifier le formulaire » | le formulaire du module (champs, propriétés, conditions, fichier, consentement prouvé, accord SMS, double confirmation, étiquettes, remerciement, tunnel) ; plusieurs par page, chacun avec ses erreurs et son message ; anti-robot (pot de miel, jeton, limite par IP) ; formulaire non publié : signalé dans l'éditeur, absent de la page publique, publication de la page refusée | oui | oui | unitaire + page publiée + navigateur (vraie inscription à 1280 et 390 px) |
| Formulaire d'inscription (section existante) | oui | inchangé (formulaire choisi dans les réglages de la page) | oui | oui | suites existantes |

Le circuit d'envoi est celui de la section existante (`POST /p/:adresse/inscription`) : le champ `w` désigne le widget, revérifié côté serveur (il doit exister dans la page publiée, être visible, et viser un formulaire publié).

# Étape — canevas, structure, Flexbox, Grille, calques dockables (7 octobre 2026)

## Audit (avant tout code)

| Point | Existant | Décision |
|---|---|---|
| Canevas | iframe rendue par le serveur (`POST /rendu`), même gabarit que la page publiée | conservé |
| Document | `content.sections` : sections (`layout`) → arbre d'éléments (`container`, `grid`, `columns`…), identifiants stables, `styles` par écran | conservé (aucun deuxième modèle) |
| Sélection | un seul état `selection`, synchronisé avec calques, inspecteur, canevas, mode blocs | conservé |
| Historique | `change()` : instantanés complets du document, 150 étapes, libellés | réutilisé pour toute création de structure |
| Calques | arbre : glisser-déposer, replier, renommer, masquer, verrouiller, dupliquer, supprimer, copier / couper / coller (menu et clavier) | conservé ; devient « Structure » |
| Flex / Grille | direction, retour à la ligne, répartition, alignement, écarts, colonnes, lignes, étendues | complété : `align-content`, `flex-shrink`, `flex-basis`, `order`, `justify-self`, placement (début / fin) de colonne et de ligne, hauteurs de lignes (`grid-template-rows`), `flex-grow` à 0 |
| Page vide / zone vide | texte « Déposez des éléments ici » | remplacé par un seul « + » |
| Panneau de calques | fixe en haut du panneau droit (repliable) | attachable, détachable, déplaçable, redimensionnable, fermable |

## Ce qui a été construit

- **« + »** : une zone vide (page, section libre, conteneur, grille) n'affiche qu'un « + ». Il n'existe que dans l'éditeur (jamais sur l'aperçu ni la page publiée).
- **« Quelle mise en page utiliser ? »** : deux choix, FLEXBOX et GRILLE ; 16 structures Flexbox, 12 structures Grille. Chaque structure est un VRAI arbre d'éléments (`src/marketing/pages/structures.js`) avec ses réglages tablette et mobile ; la miniature est redessinée à partir de cet arbre. L'insertion passe par l'historique (annuler / rétablir).
- **Flexbox** : la case d'une ligne porte `flex-basis`, `flex-grow: 0`, `flex-shrink: 1` ; sur tablette, trois colonnes et plus passent à deux par ligne ; sur mobile, la ligne devient une colonne.
- **Grille** : colonnes (nombre ou modèle `1fr 2fr`), lignes, écart, cases à étendue ; tablette 2 colonnes au plus, mobile 1.
- **Cases de grille** : une case ne crée jamais de colonne en trop sur un petit écran (le CSS généré la ramène au nombre de colonnes de l'écran).
- **Réglages d'un enfant** selon le parent : flex (croissance, rétrécissement, base, ordre, alignement) ou grille (début, fin, étendue, alignement dans la case, ordre).
- **Panneau Structure** : « Page · N sections · M éléments », ajout de structure, tout déplier / replier ; mode attaché / flottant / fermé (même panneau, rien n'est recréé : sélection, niveaux ouverts et défilement conservés) ; déplacement par l'en-tête (souris ou flèches), redimensionnement par le coin (souris ou Maj + flèches) ; position, taille et mode mémorisés ; réouverture par le bouton de la barre du haut ou la palette de commandes.
- **Corrigés au passage** (trouvés par le test navigateur) : les boutons de la page étaient inertes dans l'éditeur (le « + » aussi) ; la hauteur de confort de 48 px écrasait « Hauteur min. » dans le canevas.

## Tests

- `tests/editeur-structure.test.js` (serveur) : 28 structures enregistrées et relues à l'identique, propriétés validées, CSS, placement, ramenage des cases, « + » du rendu.
- `tests/editeur-structure-navigateur.test.js` (Chrome piloté par Playwright, vrai serveur) : 21 scénarios — « + », choix, structures, imbrication, sélection dans les deux sens, glisser-déposer des calques, annuler / rétablir, enregistrer / recharger, Grille, responsive (ordinateur / tablette / mobile), docking complet, suppression, propriétés Flexbox et enfant, copier / couper / coller, replier / déplier, erreurs de console. Ignoré avec la raison si Playwright ou Chrome sont absents (`npm i --no-save playwright-core`).

## Lot 5 — Avancé

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Compte à rebours, Offre tarifaire, Fenêtre (modale), Infobulle, Image à points d'intérêt, Contenu intégré, Texte dynamique | oui (existants, rangés dans « Avancé ») | oui | oui | oui | suites existantes |
| **Titre animé** (nouveau) | oui | mots qui se succèdent (fondu ou machine à écrire, durée réglable) ; phrase entière lue par les lecteurs d'écran ; immobile si le visiteur réduit les animations | oui | oui | unitaire + navigateur |
| **Boîte retournable** (nouveau) | oui | recto (icône, titre, texte) / verso (titre, texte, bouton compté) ; survol, clavier (Entrée), toucher ; fondu si animations réduites | oui | oui | unitaire + navigateur (ordinateur, mobile tactile) |
| **Liste de prix** (nouveau) | oui (lignes à répéter) | prestation, prix réel, description, lien compté ; points de conduite | oui | oui | unitaire + navigateur |
| **Table des matières** (nouveau) | oui | construite à l'affichage depuis les titres de la page (niveaux 2 à 2/3/4), ancres automatiques `kw-h-…` ou ancre choisie ; numérotée ou non | oui | oui | unitaire + navigateur (le lien mène au titre) |
| **Barre de lecture** (nouveau) | oui | progression du défilement, en haut ou en bas, épaisseur et couleur réglables | oui | oui | unitaire + navigateur |
| Appel à l'action | — | non dupliqué : existe déjà en section « Appel à l'action » et dans les Blocs | — | — | — |

## Lot 6 — Site

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Menu de navigation, Fil d'Ariane, Recherche, Compte du visiteur, Derniers articles | oui (existants, rangés dans « Site ») | oui | oui | oui | suites existantes |
| **Logo du site** (nouveau) | oui | logo des réglages SEO (Organisation › Logo, adresse vérifiée) ; sans logo : nom du site + explication dans l'éditeur ; lien (compté) vers l'accueil du site s'il est en ligne, sinon l'accueil de KOLAKISA ; hauteur réglable | oui (réglages d'affichage seulement) | oui | unitaire + navigateur + page publiée |
| **Titre du site** (nouveau) | oui | nom du site de la page (sinon nom du site des réglages SEO), balise et lien réglables | oui | oui | unitaire + navigateur |
| **Copyright** (nouveau) | oui | « © année titulaire. texte » ; année calculée à l'affichage, titulaire = nom du site par défaut | oui | oui | unitaire + navigateur |
| **Titre de la page** (raccourci) | oui | texte dynamique « titre de la page » préréglé (pas de second système) | oui | oui | unitaire + navigateur |
## Lot 7 — E-commerce (équivalents KOLAKISA natifs, sur le vrai panier)

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Formation, Formations du catalogue | existants | inchangés | oui | oui | suites existantes |
| **Bouton d'achat** (nouveau) | oui : formation, action (panier ou commande directe), texte, apparence, taille, prix affiché | formulaire vers le VRAI panier (`POST /panier/ajouter/:id`, retour sur la page de vente) ; « Acheter maintenant » mène à la commande ; prix du catalogue (« Gratuit » si gratuit) ; la formation doit exister et être publiée, sinon le bouton disparaît ; inactif dans l'éditeur | oui | oui | unitaire + serveur + navigateur |
| **Avis de la formation** (nouveau) | oui : formation, nombre d'avis affiché ou non, texte sans avis | note moyenne et nombre d'avis RÉELS lus dans la table des avis ; sans avis : « Pas encore d'avis » (aucune étoile inventée) | oui | oui | unitaire + serveur |
| Prix de la formation | — | non dupliqué : option « Afficher le prix » du Bouton d'achat et carte « Formation » | — | — | — |
| Panier, commande, compte | — | non dupliqués : « Compte du visiteur » (avec le nombre d'articles du panier) et les pages /panier et /commande existent déjà | — | — | — |

Non construit (aucune intégration réelle) : coupons dans la page, variations de produit, suivi de commande, liste de souhaits (hors favoris), avis écrits depuis la page.

## Lot 8 — Réseaux sociaux

| Widget | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Réseaux sociaux (liens vers vos profils) | existant | inchangé | oui | oui | suites existantes |
| **Boutons de partage** (nouveau) | oui : réseaux (Facebook, X, LinkedIn, WhatsApp, e-mail), taille, forme, texte proposé | de vrais liens de partage vers l'adresse PUBLIQUE de la page (construite et encodée par le serveur, jamais saisie) ; nouvel onglet ; rien n'est affiché sur la page publiée si l'adresse du site n'est pas en https ; dans l'éditeur, boutons dessinés mais inertes | oui | oui | unitaire + serveur + navigateur |

Non construit : intégrations de plateformes (commentaires Facebook, fil de publications, « J'aime » : demanderaient des scripts de tiers et des clés d'API sur des pages servies sur le domaine des comptes) ; bouton « copier le lien » (JavaScript dans `landing.js` pour un seul usage).

## Lot 10 — Modèles, composants, globales

| Fonction | Interface | Fonctionnel | Persistant | Responsive | Testé |
|---|---|---|---|---|---|
| Composants (ce site) / Globales (tous les sites) | oui (Éléments › Composants / Globales) | insertion synchronisée ou en copie (existant) ; **recherche** ; **utilisation** (« utilisé sur N pages ») ; **renommer** (nom unique) ; **rendre global** / **réserver à ce site** (refusé, avec la liste des pages, s'il sert à une page d'un autre site) | oui (serveur) | — (panneau de l'éditeur) | serveur + navigateur |
| Modèles de l'équipe | oui (onglet Blocs › « Modèles de l'équipe ») | **insertion dans la page en cours** (copie des sections, nouveaux identifiants, annulable ; un seul formulaire d'inscription par page ; widgets réservés vérifiés) ; création d'une page depuis un modèle, enregistrement, export / import (existants) | oui | oui | serveur + navigateur |
| Blocs prêts à l'emploi (22) | oui (existant) | oui | oui | oui | suites existantes |
