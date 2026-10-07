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
