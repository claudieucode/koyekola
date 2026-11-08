# 01 - Architecture d'un Header Elementor

Date de consultation : 2026-11-07. Voir 00_RESEARCH_SCOPE.md pour les numéros de sources et la légende [NATIF]/[PRO]/[EXPÉRIMENTAL]/[EXTENSION].

## 1. Idée générale

Un header Elementor est un « site part » (partie de site), un template d'un type particulier géré par le Theme Builder. Il remplace le header du thème WordPress actif, et s'affiche selon des conditions. [PRO] (Theme Builder = Elementor Pro ; les utilisateurs gratuits voient seulement la liste des parts disponibles avec Pro) - https://elementor.com/help/the-elementor-theme-builder/

- Le Theme Builder crée des templates de parties de site qui « s'ajoutent à ou remplacent » la hiérarchie de templates, les réglages de mise en page et le CSS du thème actif. Types cités : Header, Footer, Global Pages and Posts (single), Global Archives, WooCommerce Products et Product Archives. - https://elementor.com/help/the-elementor-theme-builder/
- Accès : Elementor > Theme Builder (admin), menu logo de l'éditeur, ou raccourci Cmd+Shift+E / Ctrl+Shift+E. - https://elementor.com/help/the-elementor-theme-builder/
- Prérequis : REST API WordPress activée (sinon les templates ne s'affichent pas, erreur « not allowed ») ; « unfiltered uploads » activé pour importer des .json/.zip. - https://elementor.com/help/the-elementor-theme-builder/
- Statut visuel : point vert = part actif avec conditions ; point gris = brouillon sans condition ; libellé « Instances » = où il est utilisé. - https://elementor.com/help/the-elementor-theme-builder/

## 2. Theme Locations (côté thème)

- Quatre locations de base : Header (remplace `header.php`), Footer (`footer.php`), Single (`singular.php`, `single.php`, `page.php`, `attachment.php`, `404.php`), Archive (`archive.php`, `taxonomy.php`, `author.php`, `date.php`, `search.php`). Un thème peut en déclarer des personnalisées. - https://developers.elementor.com/theme-locations-api/
- Le thème marque les endroits remplaçables avec quelques lignes qui enveloppent l'existant. Enregistrement via l'action `elementor/theme/register_locations` (nom d'action vu dans un résumé de recherche tiers, NON VÉRIFIÉ dans la page lue ; la page lue renvoie vers un guide « Registering Locations » non lu).
- Comportement de repli quand aucun template n'est affecté : NON VÉRIFIÉ (la page officielle ne le décrit pas).
- Compatibilité : fonctionne avec tout thème suivant les standards WordPress ; si le thème ne supporte pas l'API, remplacer header ET footer ensemble, car un thème ouvre souvent un `div` dans le header et le ferme dans le footer (balises déséquilibrées sinon). - https://elementor.com/help/wp-json/wp/v2/posts/252
- Le thème Hello (ou un thème propre) est recommandé pour toutes les fonctions du Theme Builder. - https://elementor.com/help/wp-json/wp/v2/posts/233

## 3. Cycle de vie d'un Header

| Action | Comportement | Source |
|---|---|---|
| Créer | Elementor > Theme Builder > « + » sur la carte Header > bibliothèque de templates (optionnel) ou départ vide > édition > Publish > choix des conditions | https://elementor.com/help/header-site-part/ |
| Éditer | Carte du Header > Edit (contenu) ou Edit Conditions (où il s'affiche) | idem |
| Balise HTML | Icône Header Settings (barre du haut) > HTML Tag > `header` (aide les lecteurs d'écran) | idem |
| Exporter | Menu 3 points > Export : fichier .json | idem |
| Renommer | 3 points > Rename > dialogue « Rename Part » > Change | idem |
| Supprimer | 3 points > Trash > confirmer | idem |
| Publier | Bouton Publish (nouveau) / Update (existant). Brouillons et privés ne s'affichent pas sur le site public | https://elementor.com/help/wp-json/wp/v2/posts/163845 |
| Conditions | Flèche à côté de Publish > Display Conditions, ou Edit Conditions dans le Theme Builder | https://elementor.com/help/conditions/ |
| Versions | Panneau History : onglets Actions (session) et Revisions (une révision à chaque sauvegarde/publication, clic = restaurer). Undo Ctrl/Cmd+Z, Redo Ctrl/Cmd+Shift+Z | https://elementor.com/help/?p=63 |

Brouillon / « Save Draft », autosave, Discard/Apply : décrits seulement dans des résumés de recherche tiers ; la page officielle lue ne les couvre pas -> NON VÉRIFIÉ.

## 4. Structure interne d'un header (contenu)

Exemple officiel avec conteneurs : un seul conteneur Flexbox en ligne, Content Width Boxed, Justify Content End, Align Items Center, padding 10 px ; widgets de gauche à droite : Site Logo, Menu, icône Search (ouvre un off-canvas), Social Icons. En tablette le menu devient hamburger (réglage du widget Menu). - https://elementor.com/help/creating-a-header-template-with-the-container/

Multi-rangées (barre supérieure + barre principale) : la doc lue ne décrit pas d'exemple dédié -> NON VÉRIFIÉ. On l'obtient en imbriquant des conteneurs (déduction, pas une affirmation de la doc).

## 5. Responsive

- Breakpoints par défaut : 1024 px (tablette), 767 px (mobile) ; Site Settings > Layout > Breakpoints ; breakpoints additionnels possibles, les deux par défaut non supprimables. Cascade descendante : un changement sur un écran large se propage aux plus étroits. - https://elementor.com/help/responsive-mode/
- Aperçu responsive : icônes d'appareils dans la barre du haut, poignées gauche/droite/bas pour redimensionner. - idem
- Masquer par appareil : Advanced > Responsive > Hide on Desktop/Tablet/Mobile (cité comme cause d'un header absent). - https://elementor.com/help/wp-json/wp/v2/posts/163845

## 6. Aperçu (Preview Settings)

- Pour les templates single/archive : engrenage en bas à gauche du panneau de widgets > « Preview Dynamic Content As » > type (Post, Page, Media...) puis élément précis, modifiable à tout moment. - https://elementor.com/help/dynamic-content
- Pour un header, la doc lue ne détaille pas ce réglage (utile surtout pour des widgets dynamiques) -> NON VÉRIFIÉ.

## 7. Import / Export

- Export d'un header seul : .json (voir §3).
- Export de site (kit) : Elementor > Editor > Home > Tools > Website Templates > Export. Contenu exportable : Content, Templates (headers, footers, Theme Builder), Settings (global fonts/colors, theme style, layout, lightbox, background, experiments), Plugins. Zip ou « Save to library ». La doc lue ne mentionne pas les conditions d'affichage dans l'export (une page résumée par recherche dit qu'elles sont incluses : NON VÉRIFIÉ). - https://elementor.com/help/import-and-export-elementor-website-templates/
- Un thème fabriqué avec le Theme Builder ne s'exporte pas comme zip de thème WordPress standard. - https://elementor.com/help/the-elementor-theme-builder/
- Kit / Site Settings : réglages globaux (couleurs, polices, thème, layout) appartiennent au kit actif ; détail du modèle de données NON VÉRIFIÉ.

## 8. Flux de rendu (schéma)

```
  Requête HTTP publique (ex. /boutique/chemise)
            |
            v
  Thème WP charge header (appel de location "header")
            |
            v
  Locations Manager : un template est-il candidat pour "header" ?
            |
            v
  Conditions Manager : évalue les conditions de chaque
  header publié (Include / Exclude, avec la requête courante)
            |
      +-----+--------------------+
      | aucun                    | un ou plusieurs
      v                          v
  repli : header du thème    choix du gagnant (règle de
  (NON VÉRIFIÉ)              priorité : voir fichier 10)
                                 |
                                 v
                  Document Header publié (statut "publish") ?
                                 |
                                 v
        Rendu des données de l'éditeur (conteneurs, widgets)
        + CSS généré du template (cache de fichiers CSS)
        + balise HTML choisie (header)
        + scripts d'effets (sticky, motion) si activés
                                 |
                                 v
                  HTML inséré à la place de header.php
```

Remarque : les étapes « Locations Manager / Conditions Manager » reprennent des noms de classes vus dans des miroirs non officiels et dans la doc développeur (hook `elementor/theme/register_conditions`) ; l'ordre exact interne est une reconstitution, NON VÉRIFIÉ.

## 9. Pannes courantes d'affichage (sources officielles)

1. Pas de condition définie -> mettre « Entire Site ». 2. Page en layout « Elementor Canvas » (masque header/footer volontairement). 3. Template non publié. 4. Masqué par réglages responsifs. 5. Cache : Elementor > Editor > Tools > Clear Files & Data, puis vider caches serveur/CDN. - https://elementor.com/help/wp-json/wp/v2/posts/163845

## 10. Pistes pour Kolakisa (déductions, pas des faits Elementor)

- Un type de document « header » avec statut (brouillon/publié), conditions, révisions.
- Un résolveur de conditions séparé du rendu, avec cache.
- Un layout « canvas » qui supprime header/footer.
- Réserver la hauteur pour un header fixe (voir fichier 06).
