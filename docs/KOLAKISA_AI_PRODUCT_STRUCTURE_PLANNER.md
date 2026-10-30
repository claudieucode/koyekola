# KOLAKISA — Product Structure Planner

## Bibliothèque par secteur (`library.js`)
Informatique et électronique, mode, beauté, maison/déco/mobilier, alimentation, numérique, accessoires et bijoux, sport, **général** (secteur non reconnu → 3 catégories minimales, signalé). Chaque entrée : catégories (jusqu'à 3 niveaux), attributs usuels (Taille, Couleur, Pointure, Capacité…). **Aucune marque, aucun modèle, aucun prix.**

## Règles
- Pas de catégorie redondante : noms comparés sans accents ni pluriel (« Robe » ≈ « Robes ») ; une catégorie à enfant unique est signalée ; refus d'un doublon au même niveau.
- Déplacement sans cycle ; 3 niveaux et 80 catégories au plus.
- **Acceptation exigée** avant création ; si des avertissements subsistent, l'acceptation est refusée.
- Création dans le catalogue réel : parents avant enfants, **idempotente** (une catégorie existante d'adresse identique est réutilisée).
- Marques et collections : le moteur n'a pas de champ natif ; ils ne sont jamais créés d'office.
- Filtres : proposés à titre **indicatif** (le moteur filtre par catégorie et recherche, pas par attribut).
- Alimentation et numérique : des notes rappellent les limites (réglementation locale ; pas de livraison de fichier).
