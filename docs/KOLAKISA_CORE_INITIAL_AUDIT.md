# Noyau de l'éditeur KOLAKISA — audit initial (11 octobre 2026)

Branche `noyau-editeur` (créée depuis `origin/main`). Tout ce qui est écrit ici a été lu dans le code ou mesuré ; ce qui n'a pas été vérifié est dit.

## Verdict en une page
Le noyau est **globalement sain** : la normalisation est idempotente pour les 92 types d'éléments, aucun réglage du modèle vierge n'est perdu, l'enregistrement est protégé (révision, conflit, reprise automatique), l'historique et la sélection reposent sur les identifiants. L'audit a pourtant trouvé **cinq défauts réels**, tous reproduits par un test qui échoue avant la correction :

| # | Défaut | Preuve avant correction | Corrigé |
|---|---|---|---|
| D1 | Dupliquer/coller un conteneur : les interactions de la copie continuaient de piloter les éléments **d'origine** | `noyau-integrite-navigateur` : l'interaction de la copie visait `head00000001` au lieu du titre copié | oui |
| D2 | Supprimer un élément laissait des interactions vers lui ; un élément « masqué au chargement » dont l'interaction disparaît reste **caché pour toujours** | `noyau-integrite` : interaction vers `disparu00001` conservée | oui (client + serveur) |
| D3 | Un seul élément aux données corrompues faisait échouer **toute la page** (500 sur la page publiée et l'aperçu) | `noyau-resilience` : statut 500 | oui |
| D4 | Le calcul des liens cliquables (`linksOf`) échouait pour toute la page à cause d'un seul élément ; `/p/<page>/clic/<n>` renvoyait 500 | `noyau-resilience` : 500 sur `/clic/1` | oui |
| D5 | Les limites du serveur (400 éléments, 8 niveaux) n'étaient jamais vérifiées côté éditeur : l'ajout était accepté à l'écran, refusé à l'enregistrement, le travail restait non enregistré | `noyau-integrite-navigateur` (limites) | oui |

Ce qui n'a **pas** été jugé défectueux (mesures, voir `KOLAKISA_CORE_PERFORMANCE_BASELINE.md`) : latence de modification (20–35 ms), enregistrement groupé (40 frappes → 1 rendu, 1 enregistrement), sérialisation (0,02 ms pour 11 Ko).

## Ce qui a été examiné
Éditeur (`public/js/page-builder.js`, 8 019 lignes + 11 modules `page-builder-*.js`), modèle serveur (`src/marketing/pages/nodes.js` 2 088 lignes, `sections.js`, `index.js`), rendu (`src/marketing/landing/index.js`, `views/marketing-public/_sections.ejs`, `_node.ejs`), enregistrement (`PUT /pages/:id/brouillon`), tests existants (359 fichiers, 4 750 tests avant cette mission).

## Principe de la mission respecté
Aucune interface, aucun panneau, aucun réglage n'a été déplacé ou renommé. Aucun moteur n'a été réécrit : cinq corrections ciblées, un nouveau fichier de gabarit (`_node-safe.ejs`, enveloppe de sécurité) et une pastille de repère visible seulement quand un élément ne peut pas s'afficher.
