# Palier 11 — rapport de tests

Voir [implémentation](KOLAKISA_PALIER11_IMPLEMENTATION.md) et [limitations](KOLAKISA_PALIER11_LIMITATIONS.md).

## Tests ajoutés (13)

`tests/widgets-marquee-avant-apres.test.js` (8, sans navigateur et avec vrai serveur) :
- registre : les deux widgets déclarés, opérationnels, décrits, ajoutables avec leur contenu de départ ;
- marquee : 1 à 12 textes, texte obligatoire, valeurs inconnues ramenées au défaut ; rendu publié et canevas (une liste lisible + une copie `aria-hidden`, texte HTML échappé, case Pause nommée), réglages enregistrés ;
- beforeafter : position hors bornes ou non numérique ramenée à 50 (convention du moteur), format limité, `javascript:` refusé ; rendu publié (deux images avec description, champ de curseur nommé, position de départ), images absentes (pas de curseur sur la page publiée, message guide dans le canevas) ;
- serveur : adresse d'image dangereuse et 40 textes refusés à l'enregistrement ;
- styles/script : arrêt de l'animation avec « réduire les animations », au survol, au focus et par Pause ; script du curseur.

`tests/widgets-marquee-avant-apres-navigateur.test.js` (5, Chrome 150 réel, page publiée) : curseur au clavier (Début, Fin, flèches → 0 %, 100 %, 80 %) avec la ligne réellement à 80 % de la scène et l'image rognée ; glisser à la souris ; piste qui avance vers la gauche, figée par la case Pause (clavier) ; boucle continue (liste ≥ largeur visible) ; préférence « réduire les animations » (animation `none`, copie masquée, 3 textes lisibles dans l'écran) ; mobile 390 px sans débordement.

## Corrections de conformité faites en cours de route (aucun test assoupli)

- `refonte-design` exigeait des ombres bleu nuit : mes ombres `rgba(0,0,0,…)` remplacées par `rgba(11,42,64,…)`.
- « aucune classe orpheline » : `kw-compare-after` a reçu un style.
- Référence de non-régression `tests/fixtures/widgets-regression.json` régénérée (`UPDATE_FIXTURE=1`) : **+8 lignes, 0 supprimée** — les 92 types existants sont inchangés.
- Une première hypothèse de mon test (position hors bornes = erreur) était fausse ; le moteur ramène au défaut. Test corrigé selon le comportement réel documenté du moteur, pas pour masquer un défaut.

## Séries ciblées avant la suite complète

Tests de widgets existants (non-navigateur) + `refonte-design` : 78/78 après corrections. Navigateur ciblé (éditeur, accessibilité, sécurité, publié, interactions, corrections, nouveaux widgets, imbriqués, contrat) : 57/57 ; les parcours « tous les widgets, 8 largeurs, sans débordement ni erreur » incluent désormais les deux nouveaux types.

## Suite complète officielle

- Commande : `NODE_PATH=<jsdom 30.1.2>:<playwright-core 1.64>:<sharp 0.35.5> npm test` (concurrence 1), branche `theme-builder-brouillon-parties`, commit `57ac472`.
- 2026-10-18 20:05:04 → 21:56:05 UTC (1 h 51). Isolation : 111 relevés, 0 processus de test d'une autre session.
- **Tests 5 032 · suites 1 055 · réussis 5 032 · échoués 0 · annulés 0 · ignorés 0.** (Précédente : 5 019, dont 6 annulés et 0 échec ; +13 tests ajoutés.)
- Pas de trace d'échec du menu navigateur ni du démarrage de Chrome dans cette exécution — ce qui ne résout pas ces problèmes intermittents du palier 10 (non reproduits, non expliqués).

## Non testé

Firefox, Safari, écran tactile réel, lecteur d'écran, contrastes automatisés ; performance des deux widgets dans le test de charge de 300 éléments ; édition dans l'éditeur réel au-delà des parcours génériques « tous les widgets ».
