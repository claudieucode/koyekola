# KOLAKISA — Interface « Assistant IA » : ce qui fonctionne réellement

Entrée : **Marketing → Site Web → Mes sites → Créer un site → « Créer avec l'IA »**, ou `/marketing/ia/studio`. Un membre limité à un site ajoute `?site=<id>`.

## Zones
Barre supérieure fixe (logo, projet, **état de sauvegarde**, progression, Annuler, Rétablir, Assistant (écrans étroits), Prévisualiser, Enregistrer, Publier **seulement si les conditions sont réunies**, Paramètres) · navigation latérale à 8 étapes avec leur état · zone de travail · panneau de l'assistant (repliable).

## Les 8 étapes
| Étape | Ce que l'utilisateur peut faire | Moteur réellement appelé |
|---|---|---|
| 1 Brief | Lire son brief, répondre aux questions de l'IA (brouillon gardé dans le navigateur), créer le plan, accepter de continuer avec des hypothèses | `plans.answerQuestions`, `plans.createPlan` (21.3) |
| 2 Plan | Renommer le site, ajouter / renommer / dupliquer / supprimer / ordonner des pages, ajouter / modifier / déplacer / retirer des sections, accepter ou refuser les suggestions, valider | opérations du Site Planner via `workspace.edit` |
| 3 Pages | Générer, **voir la proposition**, choisir une stratégie par page existante, appliquer en brouillon, régénérer une page, annuler la génération, ouvrir l'éditeur natif | Page Generator (21.4) via la passerelle |
| 4 Design | 3 propositions, comparer avant/après (réglages manuels protégés), appliquer, annuler, aller affiner dans le personnalisateur | Design Generator (21.5) |
| 5 Contenus | Générer les textes d'une page, modifier un champ, réviser (reformuler, raccourcir, développer, plus professionnel/commercial, simplifier, corriger), verrouiller, valider, appliquer au brouillon ; origine de chaque texte (IA / modifié par vous / verrouillé) | Content Generator (21.6) |
| 6 Images et médias | Analyser les besoins visuels, **coût estimé avant** génération, générer, accepter ou refuser une variante, choisir dans la médiathèque, modifier la consigne, suivre les tâches | Media Generator + Asset Manager (21.7) |
| 7 Prévisualisation | Voir chaque page en ordinateur / tablette / mobile (rendu natif), vérifications automatiques | aperçu natif |
| 8 Publication | Liste de contrôle réelle, publication des pages générées | `pages.publish` natif |

## Ce qui n'est PAS fait (voir REMAINING_ISSUES)
Assistant sans IA (règles) · pas de modification du brief après analyse · pas d'écran du ton éditorial · génération d'images réelle non vérifiée · publication = pages seulement (menu, domaine, personnalisateur à publier à part).
