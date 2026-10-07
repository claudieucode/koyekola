# Éditeur de pages KOLAKISA — audit et inventaire (7 octobre 2026)

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
| **Mode « Structure » (éditeur de blocs, façon Gutenberg)** | **non** | — | **à créer** | — | — | moyen |
| Inspecteur par type (Contenu / Style / Avancé), propriétés compactes | oui | oui | — | oui | non | — |
| Responsive par écran + héritage, états (survol, focus, clic) | oui | oui | — | oui | non | — |
| Mise en page : display, flex, grille (colonnes), alignements, gap, z-index, débordement | oui | oui | **écarts lignes / colonnes séparés** | oui | non | faible |
| Marges / intérieurs par côté, liables | oui | oui | — | oui | non | — |
| Bordure : style, épaisseur, couleur, arrondi (par coin) | oui | oui | **épaisseur par côté** | oui | non | faible |
| Fond : couleur, image, dégradé, taille, position | oui | oui | **voile (overlay), répétition, fixe** | oui | non | faible |
| Typographie complète | oui | oui | — | oui | non | — |
| Icônes (bibliothèque du site) | oui | partiel | **choix visuel avec recherche** | oui | non | faible |
| Onglets (fonctionnels, clavier) | oui | oui | **orientation verticale, plus d'onglets** | oui | non | faible |
| Accordéon | oui | oui | **une seule ouverte à la fois (option)** | oui | non | faible |
| Styles globaux (design system de site) | oui | oui | **accès depuis l'éditeur** | oui | non | — |
| Composants réutilisables (instances synchronisées, globaux possibles) | oui | oui | — | oui | non | — |
| Blocs (patterns) : 18 compositions d'éléments réels | oui | oui | — | oui | non | — |
| Modèles de pages : 14 (marketing) | oui | oui | **À propos, Contact, Portfolio, SaaS, Entreprise** | oui | non | faible |
| Copier / coller / dupliquer / copier-coller le style | oui | oui | **réinitialiser le style** | oui | non | — |
| Annuler / rétablir (150 étapes, frappes regroupées) | oui | oui | — | oui | non | — |
| Sauvegarde auto (1 s), manuelle (Ctrl+S), copie locale, reprise après erreur réseau, conflit (409), fermeture protégée | oui | oui | — | oui | non | — |
| Versions : liste, aperçu, restauration | oui | oui | **comparaison de versions** | oui | non | faible |
| Aperçu réel (ordinateur / tablette / mobile) | oui | oui | — | oui | non | — |
| Publication réelle (validation serveur) | oui | oui | — | oui | non | — |
| Glisser-déposer (canevas, calques, bibliothèque), zones de dépôt | oui | oui | — | oui | non | — |
| Règles, guides, grille, zoom | oui | oui | — | oui | non | — |
| Médiathèque | oui | oui | — | oui | non | — |
| Personnalisation (public par élément), tests A/B, tunnels | oui | oui | — | oui | non | — |
| Éléments : badge, barre de progression, chronologie, carrousel, menu de navigation, icône + texte | non | — | **à créer (rendus réels)** | — | — | faible |
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
