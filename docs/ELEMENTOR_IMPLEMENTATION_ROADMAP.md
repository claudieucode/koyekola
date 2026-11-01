# Feuille de route de la parité Elementor (programme 22.8)

_Écarts (225 au départ ; **216** après le lot 5) calculés depuis la matrice : **225** lignes « Partiel » ou « Absent » (P1 : 8 · P2 : 48 · P3 : 112 · P4 : 57). Les lots ci-dessous sont ordonnés par dépendance réelle, pas par facilité._

## Règle de fin d'un lot
Une ligne ne passe « Complet » que si : implémentée, paramètres fonctionnels, rendu éditeur = rendu publié vérifié, sauvegarde/restauration testées, tests verts, matrice mise à jour par régénération.

## Lots
| Lot | Contenu | Lignes clés | Dépendances | Risque |
|---|---|---|---|---|
| 1 | **Custom Code** (head, début et fin de body) | EL-SS044 à 046 | réglages du site, rôle administrateur | Sécurité : XSS par conception → réservé aux administrateurs, comme le widget HTML |
| 2 | **Boucle sur les produits** (source « produits » du moteur de requêtes, pagination, compteur, galerie produit, produits apparentés) | EL-WC001, 003, 012, 022, 030 | `pages/query.js`, boutique 20.5 | Moyen : touche au moteur de boucle |
| 3 | Formulaires : champs libres, mise en page, messages | EL-FM* | module Formulaires | Élevé : modèle de données du formulaire |
| 4 | Formulaires : actions après envoi (e-mail configurable, webhook), soumissions + export | EL-FM* | automatisations | Sortie réseau → liste d'hôtes, pas de SSRF |
| 5 | **FAIT (2026-11-01)** — Popups du widget Modal : animations d'entrée/sortie, superposition (couleur, flou), blocage du défilement, déclencheurs « élément visible » et « remontée de page », période d'affichage, « Ne plus afficher ». Reste : conditions de session inter-visites, navigateur, gabarit de popup global, actions fermer/basculer, période pour les pop-ups Formulaires | EL-PU* | `landing.js` | Faible |
| 6 | Réglages : couleurs globales extensibles, polices et icônes téléversées, kit complet | EL-SS* | `tokens.js`, médiathèque | Élevé : SVG refusé, polices = nouveau type de fichier |
| 7 | Navigation : méga-menu, menu mobile en panneau | EL-NV* | `nodes.js` | Moyen |
| 8 | Éditeur : raccourcis officiels, Finder global, aperçu du contenu dynamique | EL-UI*, EL-TB021, EL-DY045 | `page-builder.js` | Faible |
| 9 | Style : transformations 3D/flip, ombres libres, filtre drop-shadow, overlay dégradé | EL-ST* | `nodes.js` | Faible |
| 10 | Panier, commande, compte éditables dans le Builder ; avis produit | EL-WC016–019, 005 | boutique | Élevé : paiement |

## Impossibilités / exclusions déjà établies (avec raison)
SVG (peut contenir du script), Shortcode (sécurité), Sidebar (notion WordPress), boutons PayPal/Stripe directs (module Commerce unique), Facebook Commentaires (ID d'application Facebook).

## Honnêteté sur l'ampleur
Ce programme dépasse une session : la matrice est la **vérité de départ**, les lots se font l'un après l'autre avec tests, commit et déploiement à chaque fin de lot.
