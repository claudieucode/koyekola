# Palier 11 — extension du catalogue de widgets

Rapports liés : [tests](KOLAKISA_PALIER11_TEST_REPORT.md) · [limitations](KOLAKISA_PALIER11_LIMITATIONS.md) · catalogue précédent : [écarts G4](KOLAKISA_WIDGETS_GAP_ANALYSIS.md).

## État initial (vérifié dans le dépôt le 2026-10-18)

Branche `theme-builder-brouillon-parties` (HEAD `f4a33b8` au départ), arbre propre, 92 types dans le registre. Recherche faite dans le code : aucun des sept widgets n'existait sous un nom équivalent ; deux sont créés ici, cinq sont examinés et reportés (voir tableau). Le palier 10 reste ouvert (voir limitations).

## Décision pour les sept widgets

| Widget | État avant | Décision | Pourquoi |
|---|---|---|---|
| **Marquee** (défilement continu) | absent | **créé** | purement visuel, sans dépendance, risque faible ; le mouvement est contrôlable |
| **Avant / Après** | absent | **créé** | aucune dépendance ; champ « range » natif, donc clavier et tactile gratuits |
| Portfolio | absent en tant que widget ; la **galerie** a déjà des filtres (`[data-kw-gal-filters]`) et l'agrandissement | **reporté** | une grille de projets utile demande une source de données (projets) qui n'existe pas ; la galerie couvre partiellement le besoin ; ne pas créer un second système |
| Sidebar | absent ; la structure `grid-sidebar` et les **composants globaux** (Theme Builder) existent | **reporté, sans doublon** | une zone latérale réutilisable se fait déjà avec une structure + un composant ; un « widget Sidebar » style WordPress serait un second système |
| Shortcode | absent ; aucun système de shortcodes dans Kolakisa ; le widget HTML existe (réservé aux administrateurs, `pages.code`) | **reporté** | exécuter du contenu arbitraire est un risque de sécurité ; à définir avec un format fermé et des permissions avant tout développement |
| Méga-menu | absent ; le widget `menu` (liens, sous-menus, bouton mobile) existe | **reporté** | demande de repenser le menu (panneaux riches, tactile, clavier, responsive) ; risque de casser les menus ordinaires ; palier dédié |
| Boutons de paiement | absent ; Stripe est utilisé pour les commandes de formations, mais aucun point d'entrée « paiement d'un montant libre » | **reporté, non opérationnel** | toute opération financière exige API officielle, validations serveur et clés ; l'audit précédent signale Stripe de production non opérationnel ; rien n'a été simulé |

## Marquee — « Défilement continu »

- Fichiers : `src/marketing/pages/widgets/marquee.js` (description, 12 textes au plus, vitesse, sens, séparateur, pause au survol, nom de la bande), `views/marketing-public/widgets/marquee.ejs`, bloc de styles dans `public/css/landing.css`.
- Comportement : deux listes identiques bout à bout, la piste glisse d'une moitié (boucle sans à-coup) ; chaque liste couvre au moins la largeur visible (`min-width: 100cqw`). Aucun script.
- Mouvement contrôlable : pause au survol, pause au clavier (`:focus-within`), case « Pause » (vraie case à cocher, accessible au clavier, visible au survol ou au focus) ; avec « réduire les animations » : aucune animation, la copie est supprimée, les textes passent à la ligne.
- Lecteurs d'écran : région nommée, une seule liste lue, la copie est `aria-hidden`. Texte échappé.
- Choix : texte seul (pas de liens ni d'images) pour ne pas dupliquer des liens comptés ni du contenu focalisable.

## Avant / Après — `beforeafter`

- Fichiers : `src/marketing/pages/widgets/beforeafter.js` (deux images + descriptions, étiquettes, position de départ 0–100, format 16:9 / 4:3 / 3:2 / carré), `views/marketing-public/widgets/beforeafter.ejs`, styles dans `landing.css`, quelques lignes dans `public/js/landing.js` (`[data-kw-compare]` relie le champ à la variable `--kw-cmp-pos`).
- Comportement : l'image « Avant » est rognée par `clip-path` ; un champ `<input type="range">` transparent couvre la scène (flèches, Début, Fin, souris, doigt) avec un nom accessible ; la ligne et la poignée suivent. Sans script : affichage à la position de départ. Images absentes : message guide dans l'éditeur, rien d'inutile sur la page publiée.
- Images : médiathèque ou `https://` (validation du moteur) ; `javascript:` refusé.

## Fichiers modifiés (production)

`public/css/landing.css` (deux blocs ajoutés ; ombres en bleu nuit comme l'exige l'identité visuelle), `public/js/landing.js` (un bloc ajouté). Créés : 2 descriptions, 2 gabarits. Aucune migration, aucun changement de schéma, aucune dépendance. Référence de non-régression `tests/fixtures/widgets-regression.json` régénérée avec `UPDATE_FIXTURE=1` : **8 lignes ajoutées, 0 supprimée** (les 92 types existants sont inchangés).

## Livraison

Rien n'a été poussé, fusionné ni déployé : voir [limitations](KOLAKISA_PALIER11_LIMITATIONS.md) (arrêt justifié).
