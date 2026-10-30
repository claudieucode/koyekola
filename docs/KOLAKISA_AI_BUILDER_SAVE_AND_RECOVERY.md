# KOLAKISA — Sauvegarde, reprise et gestion des pannes

## Principe
Il n'y a **pas de copie de travail dans le navigateur** : chaque action est enregistrée par le serveur **avant** d'être affichée. L'indicateur « Enregistré à HH:MM » n'apparaît donc qu'après la réponse du serveur ; **en cas d'échec il passe à « Échec de l'enregistrement »** et la bannière explique. « Enregistrer » relit le serveur et confirme ce qui y est réellement.

## Ce qui est enregistré où
| Donnée | Où | Reprise |
|---|---|---|
| Brief, analyse, réponses, plan, historique d'actions | `mk_ai_plans`, `mk_ai_plan_events` | « Reprendre mon travail » |
| Annuler / rétablir, conversation, propositions | `mk_ai_builder_states`, `mk_ai_builder_messages` | idem (30 niveaux d'annulation) |
| Générations de pages, de design, jeux de textes, tâches d'images | tables de leurs moteurs | idem |
| Brief en cours de saisie, réponses aux questions non envoyées, consigne de design, dernière étape, assistant replié | **navigateur** (localStorage, facultatif) | rechargement |

## Pannes
| Situation | Comportement |
|---|---|
| Connexion perdue pendant une action | Bannière « Connexion perdue : l'action n'a pas été enregistrée », bouton **Réessayer** ; au retour du réseau, rappel que la dernière action n'a **pas** été enregistrée avec le même bouton. L'écran n'affiche pas la modification comme faite. |
| Deux onglets / deux personnes | Révision : l'enregistrement périmé est refusé (409) avec « Recharger » ; rien n'est écrasé. |
| Fournisseur IA indisponible / quota | Message explicite (503 / 429), le reste de l'interface continue. |
| Fermeture de l'onglet pendant une action | Avertissement du navigateur tant qu'une requête est en cours. |
| Interruption du serveur pendant une génération d'image | La tâche est marquée échouée (expirée) au prochain affichage ; « Réessayer ». |
Les messages d'erreur ne contiennent ni pile, ni clé, ni chemin (les erreurs inattendues passent par le gestionnaire commun).

## Historique des versions
Plan : historique des actions (qui, quoi, révision) affiché ; **pas de comparaison avant/après du plan** (le 21.3 ne conserve pas l'état avant/après ; seules les copies d'annulation existent). Pages : versions natives. Design : annulation par génération. Contenus : historique par champ (moteur 21.6).
