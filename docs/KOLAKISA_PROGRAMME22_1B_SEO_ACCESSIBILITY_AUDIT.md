# KOLAKISA — Audit SEO et accessibilité des sites générés (programme 22.1)

> **Ce document ne déclare aucun site conforme à une norme d'accessibilité.** Les contrôles sont automatiques et partiels (écrits pour ce laboratoire ; ni axe-core ni Lighthouse ne sont installés). Une conformité WCAG exige un audit approprié, avec lecteur d'écran et test manuel.

## Méthode

Dans Chrome, sur la page d'accueil de chaque site (bureau) : titre, description, adresse canonique, balises sociales (`og:`), données structurées JSON-LD, langue du document, nombre de `h1`, sauts de niveau de titres, images sans attribut `alt`, champs de formulaire sans étiquette, boutons ou liens sans nom, repères (`main`, `nav`, `header`, `footer`), contraste de texte calculé (WCAG 2.x, seuils AA 4,5 / 3) sur les éléments dont l'arrière-plan est uni ; au niveau du site : `/sitemap.xml` et `/robots.txt`.

## Résultats

<!--TABLE:Navigateur-->
| Scénario | nav | header | footer | H1 | titre | meta description | canonical | og | JSON-LD | lang | sitemap | robots | alt manquants | champs sans label | contraste KO/vérifiés |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| entreprise | 0 | 1 | 2 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/12 |
| immobilier | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
| construction | 0 | 1 | 2 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/12 |
| tech | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
| photo | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/3 |
| portfolio | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/3 |
| institution | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
| restaurant | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/3 |
| blog | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/3 |
| boutique | 0 | 1 | 1 | 1 | oui | oui | oui | 2 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
| mode | 0 | 1 | 1 | 1 | oui | oui | oui | 2 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
| informatique | 0 | 1 | 1 | 1 | oui | oui | oui | 2 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
| services | 0 | 1 | 2 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/12 |
| education | 0 | 1 | 2 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/12 |
| sante | 0 | 1 | 1 | 1 | oui | oui | oui | 3 | 1 | fr | 200 | 200 | 0 | 0 | 0/10 |
<!--/TABLE-->

## Ce qui est correct

- **SEO technique de base : complet** sur tous les sites : titre, description, adresse canonique, `og:title`/`og:description`/`og:image`, JSON-LD, `lang="fr"`, **un seul H1**, sitemap et robots répondent. C'est le travail du moteur natif de pages.
- **Aucune image sans `alt`** et **aucun champ sans étiquette** parmi les éléments rendus.
- **Contraste** : 0 défaut sur les éléments mesurables.
- **Structure** : `header`, `main`, `footer` présents.

## Ce qui est insuffisant

| Id | Gravité | Constat |
|---|---|---|
| S-1 | P1 | **Aucun élément `nav`** et aucun lien de navigation : les moteurs de recherche ne découvrent les pages que par le plan du site (`sitemap.xml`) ; **aucun maillage interne** (D-N1). |
| S-2 | P2 | **Titre et description génériques** : « Accueil · <nom> » et « Accueil » — pas de description utile ni distincte par page tant que le contenu n'est pas rédigé (D-X1). |
| S-3 | P2 | **Texte alternatif des images d'attente générique** (D-M1) : valide techniquement, sans valeur descriptive. |
| S-4 | P2 | **Couverture du contraste faible** : 3 à 12 éléments mesurés par page ; le texte sur image ou dégradé n'est pas évalué. |
| S-5 | P2 | **Cibles tactiles < 32 px** dans le pied de page (voir `RESPONSIVE`). |
| S-6 | P3 | Pas de lien d'évitement (« aller au contenu ») mesuré ; navigation clavier, lecteur d'écran, zoom 200 %, mouvement réduit : **non testés** dans ce laboratoire (un audit de ce type existe pour l'administration : `scripts/a11y/audit-accessibilite.js`, palier 15). |
| S-7 | P3 | Pas de données structurées spécifiques (organisation, produit, FAQ) : seul le JSON-LD générique du moteur. |

## Causes racines

Navigation absente (génération) ; titres et descriptions à la charge d'une étape de contenu non exécutée ; composants de pied de page (rendu).

## Recommandations

P1 : navigation (22.2). P2 : titres/descriptions par page dans le flux de contenu (22.3) ; alt descriptif (22.7) ; zones cliquables ≥ 44 px (22.7). P3 : intégrer axe-core ou Lighthouse hors production, audit clavier et lecteur d'écran, données structurées `Organization`, `FAQPage`, `Product` (22.7).
