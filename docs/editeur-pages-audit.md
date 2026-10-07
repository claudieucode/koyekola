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
