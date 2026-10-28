# Palier 11 — limitations et points ouverts

Voir aussi [implémentation](KOLAKISA_PALIER11_IMPLEMENTATION.md) et [tests](KOLAKISA_PALIER11_TEST_REPORT.md).

## Parité Elementor : non atteinte

Sur les sept écarts G4, **deux** sont comblés (Marquee, Avant / Après). **Cinq restent ouverts** : Portfolio, Sidebar, Shortcode, Méga-menu, boutons de paiement (raisons dans l'implémentation). Le catalogue passe de 92 à 94 types ; ce n'est pas une parité avec Elementor.

## Limites des deux widgets créés

- Marquee : texte seul (12 éléments), pas de liens ni d'images ; l'animation CSS est continue tant que la page est visible (pas de mise en pause hors écran) ; la case « Pause » n'apparaît qu'au survol ou au focus, ce qui n'est pas découvrable au toucher seul (le défilement reste cependant arrêté par la préférence « réduire les animations »).
- Avant / Après : comparaison horizontale seulement ; images sans variantes de résolution automatiques (adresse directe) ; pas de glissement par la poignée seule (c'est le champ natif sur toute la scène qui reçoit le geste) ; l'animation de position au chargement n'existe pas.
- Non testés : Firefox, Safari, vrai écran tactile, lecteur d'écran (VoiceOver), contrastes automatisés (axe). Les gestes sont éprouvés avec Chrome réel (clavier, souris, préférence « réduire les animations », mobile 390 px).
- Le widget est compté dans la limite de 24 éléments par liste du moteur ; non soumis à permission particulière.

## Problèmes hérités du palier 10 (non résolus, non vérifiés ici)

- `editeur-menu-navigateur` (tests 6 et 7) : 1 échec sur 2 suites complètes, jamais reproduit en 61 exécutions ; cause inconnue.
- Démarrage de Chrome : 6 tests annulés une fois (`browserType.launch` 180 s) ; cause inconnue.
- Tâches longues des widgets variés (fluidité à 300 éléments) toujours ouvertes ; les nouveaux widgets sont légers (pas de script par élément, animation CSS) mais n'ont pas été mesurés dans ce test de charge.
- Firefox / Safari / tactile réel / lecteur d'écran / axe non testés ; pas de tests d'isolation entre organisations pour pages, composants, modèles.

## Livraison (push / fusion / déploiement) : arrêtée

Les conditions d'arrêt du prompt s'appliquent, constatées par commandes :
1. **La branche de livraison a divergé** : `origin/main` a 130 commits que ma branche n'a pas, et ma branche en a 11 de plus que leur base commune (`738322d`) — plus les paliers 8, 9, 9.1, 10 jamais poussés.
2. **Collision de migration** : `origin/main` contient `src/marketing/migrations/071_isolation_des_sites.sql` ; ma branche contient `071_composants_revision.sql` (palier 9). Deux migrations portent le numéro 071 ; `origin/main` va jusqu'à 093 et sa préparation de déploiement indique la production encore à la 071. Les fusionner sans renumérotation étudiée risque une migration dangereuse en production.
3. Le palier 10 est ouvert (points ci-dessus).

Action nécessaire (décision de votre part) : autoriser une session dédiée à rebaser/fusionner ma branche sur `origin/main` en renumérotant la migration de révision des composants (additive), puis refaire la suite complète sur le résultat, avant tout push.

## Dépendances et risques

Aucune dépendance ajoutée. Risque de régression visuelle limité à deux blocs CSS isolés (`kw-marquee*`, `kw-compare*`) et un bloc JS qui ne s'applique qu'aux éléments `[data-kw-compare]`.
