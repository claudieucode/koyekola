# Extension n°5 — 30 thèmes classiques et professionnels : plan et règles

Décision : autorisation donnée par l'utilisateur de poursuivre sans validation intermédiaire (2026-11-05). Les capacités manquantes du CMS (voir `EXTENSION5_PHASE0_CAPACITES.md`) sont traitées ainsi : le moteur reçoit les données structurées éditoriales ; les composants « signature » qui demanderaient un type de contenu personnalisé sont réalisés avec les blocs natifs + le `motion.js` du thème (filtres, calculs, recherche côté navigateur sur des données **écrites dans les pages du thème**), et déclarés comme tels dans la fiche (jamais présentés comme un type de contenu du CMS).

## Les 30 thèmes (clé : usage — concept)
| # | Clé | Usage | Concept | Lot |
|---|---|---|---|---|
| 1 | plume | Blog personnel minimaliste | une voix, une colonne, archives par année en liste de texte | A |
| 13 | comptoir | Vitrine PME polyvalente | comptoir de boutique de quartier, devis en 3 questions | A |
| 15 | amorce | Landing de lancement | amorce de mèche : une seule action, double validation | A |
| 21 | repere | Centre d'aide | recherche instantanée, catégories, « utile ? » | A |
| 26 | jalon | Changelog et feuille de route | bornes kilométriques, versions filtrables | A |
| 2 | rubrique | Blog magazine multi-catégories | une couleur par rubrique, accueil en blocs | B |
| 14 | socle | Corporate grande entreprise | institutionnel, chiffres, implantations, gouvernance | B |
| 18 | defile | One-page polyvalent | ancres, section active, récit continu | B |
| 22 | coulisse | Conférence professionnelle | programme multi-salles filtrable, intervenants | B |
| 27 | glane | Curation et veille | liens commentés par thème, source, date | B |
| 3 | syntaxe | Blog technique | monospace en accent, code copiable, sommaire flottant | C |
| 16 | mandat | Freelance / consultant | offres, tarifs, prise de rendez-vous | C |
| 19 | preface | Bientôt disponible | compte à rebours réel, liste d'attente | C |
| 23 | gradin | Créateur de formations | programme par modules, tarifs, FAQ | C |
| 28 | balance | Avis et comparatifs | tableaux comparatifs, notes, affiliation transparente | C |
| 4 | mijote | Blog de recettes | fiche recette, portions ajustables, impression | D |
| 17 | relais | Agence généraliste | études de cas chiffrées, processus | D |
| 20 | ricochet | Page de liens (link in bio) | mobile d'abord, liens configurables | D |
| 24 | fichier | Annuaire / répertoire | fiches filtrables par catégorie et lieu | D |
| 29 | communique | Salle de presse | communiqués, kit média, contacts presse | D |
| 5 | etape | Blog de voyage | carnet de route, destinations, itinéraires | E |
| 6 | courrier | Publication et newsletter | abonnement mis en avant, archives des numéros | E |
| 7 | obturateur | Photo-journal | l'image d'abord, légendes, données de prise de vue | E |
| 8 | bulletin | Actualités d'entreprise | actualités filtrables, espace presse lié | E |
| 25 | commun | Association polyvalente | adhésion, agenda, appel aux bénévoles | E |
| 9 | sou | Finances personnelles | encadrés pédagogiques, calculateurs simples | F |
| 10 | berceau | Famille et parentalité | rubriques par âge, listes à cocher | F |
| 11 | chronique | Long format | lecture concentrée, progression, lettrines | F |
| 12 | jardin | Notes et jardin numérique | notes courtes reliées, liens de retour | F |
| 30 | ossature | Thème universel professionnel | bibliothèque de sections la plus riche | F |

Collections : **Blog et publication** = 1-12 ; **Sites professionnels** = 13-30. Recommandé : `ossature`.

## Les 14 axes (champ `dna` de la fiche, 14 clés)
`hero, header, grid, typo, shapes, motion, rhythm, signature, palette, image, list, article, sidebar, reading`.
Règles : deux thèmes (nouveaux ou existants) ne partagent jamais plus de 4 axes sur 14 ; dans une même famille, au plus 2 valeurs communes sur `list, article, sidebar, reading` ; au moins 8 valeurs d'axes inédites sur la collection. Chaque valeur est une courte description kebab-case propre au thème (comme les `dna` existants). Aucune paire de polices ni palette dominante déjà utilisée.
