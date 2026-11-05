# Audit de la personnalisation des thèmes

Date : 2026-11-05. Périmètre : les 70 thèmes installables (`src/marketing/themes/packs/<clé>`).

## Comment un réglage circule aujourd'hui
Réglage (Apparence → Thèmes → fiche du thème) → `POST /site-web/themes/:clé/options` → validé par le schéma du thème (`resolveOptions`: couleur hexadécimale, choix dans une liste, nombre borné ; sinon valeur par défaut) → enregistré dans les jetons du site → écrit dans la page publique en variables CSS `--pk-<réglage>` et attributs `data-pk-<réglage>` sur `<body>` → lu par le `style.css` du thème (confiné à `body[data-kw-pack="<clé>"]`). Les textes, images et boutons des pages du thème sont des blocs du Page Builder, modifiables dans l'éditeur ; les thèmes sont isolés par site (un instantané du manifeste par site).

## Constats
| Contrôle | Résultat |
|---|---|
| Thèmes avec au moins 3 réglages | 70 / 70 |
| Réglages non branchés (ni CSS ni script) | 0 |
| Thèmes animés sans réglage d'animation (avant) | 54 |
| Thèmes animés sans réglage d'animation (après) | 0 |
| Erreurs de chargement des thèmes | 0 |

## Lacune corrigée
Les animations (ciel, bulles, défilements, transitions) n'étaient pas réglables dans 54 thèmes. Le moteur partagé ajoute désormais à tout thème animé le réglage « Animations du thème » : *Toutes*, *Calmes* (plus de mouvement continu, transitions gardées), *Aucune*.

## Tableau de suivi
| Thème | Pages | Réglages propres | Animations réglables | Script | État |
|---|---|---|---|---|---|
| abysse | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| albergo | 11 | 5 (color, choice) | oui (standard) | oui | conforme |
| altitude | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| ankara | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| arene | 8 | 4 (color, choice) | oui (standard) | oui | conforme |
| atelier | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| barreau | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| bilan | 9 | 5 (color, choice) | oui (standard) | oui | conforme |
| bitume | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| bouclier | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| boussole | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| cap | 9 | 4 (color, choice) | oui (standard) | oui | conforme |
| chaine | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| charpente | 11 | 5 (color, choice) | oui (standard) | oui | conforme |
| chrome | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| cimaise | 11 | 4 (color, choice) | oui (standard) | oui | conforme |
| circuit | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| civitas | 9 | 5 (color, choice) | oui (standard) | oui | conforme |
| clarte | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| colophon | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| convoi | 11 | 5 (color, choice) | oui (standard) | oui | conforme |
| cursus | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| doudou | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| echo | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| elan | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| encre | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| epiderme | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| essence | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| etoile | 7 | 5 (color, choice) | oui (standard) | oui | conforme |
| facette | 8 | 4 (color, choice) | oui (standard) | oui | conforme |
| fleur | 9 | 5 (color, choice) | oui (standard) | oui | conforme |
| fournil | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| heliade | 11 | 5 (color, choice) | oui (standard) | oui | conforme |
| houblon | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| infusion | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| labo | 9 | 5 (color, choice) | oui (standard) | oui | conforme |
| ledger | 10 | 5 (color, choice, range) | oui (standard) | oui | conforme |
| lyrique | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| manuel | 8 | 5 (color, choice, range) | oui (standard) | oui | conforme |
| meeple | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| millesime | 8 | 4 (color, choice) | oui (standard) | oui | conforme |
| moustache | 12 | 5 (color, choice) | oui (standard) | oui | conforme |
| noir | 9 | 5 (choice) | oui (standard) | oui | conforme |
| obscura | 9 | 5 (color, choice) | oui (standard) | oui | conforme |
| orbite | 8 | 5 (choice, range) | oui (standard) | oui | conforme |
| pellicule | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| petale | 8 | 5 (choice, color) | oui (standard) | oui | conforme |
| pierre | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| pointe | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| potager | 11 | 5 (color, choice) | oui (standard) | oui | conforme |
| poudre | 10 | 5 (color, choice, range) | oui (standard) | oui | conforme |
| pulse | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| rasoir | 8 | 4 (color, choice) | oui (standard) | oui | conforme |
| recueil | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| rideau | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| riviera | 9 | 4 (color, choice) | oui (standard) | oui | conforme |
| roulotte | 7 | 5 (color, choice) | oui (standard) | oui | conforme |
| sape | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| seve | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| signature | 9 | 4 (color, choice) | oui (standard) | oui | conforme |
| souffle | 10 | 5 (color, choice, range) | oui (standard) | oui | conforme |
| speakeasy | 8 | 5 (color, choice) | oui (standard) | oui | conforme |
| talent | 9 | 5 (color, choice) | oui (standard) | oui | conforme |
| tiers | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| une | 10 | 4 (color, choice) | oui (standard) | oui | conforme |
| voeu | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| volt | 8 | 5 (color, range, choice) | oui (standard) | oui | conforme |
| volume | 9 | 5 (choice) | oui (standard) | oui | conforme |
| vortex | 10 | 5 (color, choice) | oui (standard) | oui | conforme |
| zenith | 8 | 4 (color, choice) | oui (standard) | oui | conforme |

## Lacunes restantes
Voir le rapport d'implémentation, section C.
