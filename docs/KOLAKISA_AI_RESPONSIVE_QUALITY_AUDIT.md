# Audit responsive (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

## Limite principale
**Aucun test sur écran réel** : Chrome/Playwright sont absents de la machine (les ≈ 190 suites navigateur du projet n'ont pas pu être exécutées non plus). Les quatre formats demandés (desktop, laptop, tablette, mobile), la navigation mobile, les débordements, les textes coupés, la page produit, le panier et le checkout sont donc **NON ÉVALUÉS visuellement**. Ce qui suit est une vérification **statique** du HTML et du CSS réellement servis.

## Mesures statiques (15 sites, première page de chacun)
| Contrôle | Résultat |
|---|---|
| Balise `viewport` (`width=device-width`) | 53 / 53 pages publiées |
| Règles `@media` dans les feuilles servies | 36 (identiques pour tous les sites) |
| Images fluides (`img { max-width: 100% }`) | oui |
| Largeur fixe ≥ 600 px dans le HTML rendu | aucune détectée |
| Cartes « Points forts » | 2 à 4 colonnes, empilées sur mobile par le rendu (documenté par le mapper, non vérifié visuellement) |
| Masquage par écran (`hideOn`) | disponible dans l'éditeur ; non utilisé par la génération |

## Constats
- **R1 (info)** Le socle responsive existe et il est partagé par tous les sites (même feuille de style). Un défaut de rendu mobile serait donc **systémique**, pas propre à un secteur : un seul jeu de captures de référence suffirait à le voir.
- **R2 (non évalué)** Navigation mobile : le laboratoire n'exécute pas l'étape « menu » du studio ; les pages publiées lues n'ont pas de menu (non noté). À contrôler avec le menu réel.
- **R3 (non évalué)** Boutiques : pages produit, panier, checkout. Le moteur de boutique natif (20.5) a ses propres tests serveur ; son rendu mobile n'a pas été vu dans ce palier.
- **R4 (P3)** Pas de composant de galerie : les images s'empilent verticalement, ce qui allonge fortement la page mobile pour les portfolios.

## Plan de mesure réel (palier 22.2)
Captures Playwright à 1440, 1024, 768 et 390 px des 15 sites (accueil + une page interne + contact) ; détection automatique de défilement horizontal (`scrollWidth > clientWidth`) ; taille des zones tactiles (≥ 44 px) ; contrôle des textes tronqués ; parcours panier/checkout mobile pour les 3 boutiques.
