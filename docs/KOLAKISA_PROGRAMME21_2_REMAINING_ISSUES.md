# KOLAKISA — Programme 21.2 : points restants

## Prérequis non satisfaits
| # | Point | Effet |
|---|---|---|
| P1 | Documents du Programme 21.1 inexistants | Aucune décision de 21.1 n'a pu être reprise ; à rédiger ou à confirmer avant 21.3 |
| P2 | **Aucune clé de fournisseur réelle** utilisée | Les 4 adaptateurs sont testés contre un faux serveur local uniquement. **Aucun fournisseur n'est déclaré opérationnel.** Mistral (adaptateur + connecteur) n'a jamais rencontré le vrai service |
| P3 | Tarifs, limites de contexte, limites de débit, disponibilité géographique, conditions d'utilisation **non vérifiés** | Les modèles livrés n'ont aucun tarif ; les limites de coût exigent un tarif saisi et daté par un administrateur |

## Fonctions non réalisées
| # | Fonction | État |
|---|---|---|
| R1 | Routes HTTP et écrans d'administration (fournisseurs, modèles, quotas, métriques, réglages de site) | **Absents** : seuls les services existent, avec leurs contrôles de droits ; les permissions `ai.use` / `ai.site_admin` / `ai.admin` ne sont pas encore déclarées dans le système de rôles du CMS |
| R2 | Branchement des modules existants (blog, marketing) sur le Core | Non fait : ils utilisent toujours `services/aiCore.js` (Anthropic seul, quota quotidien propre). Deux comptabilités coexistent |
| R3 | Persistance du registre des modèles (modèles, tarifs, vérifications) | En mémoire du processus ; perdue au redémarrage. À persister avant tout usage réel |
| R4 | Images, fichiers, flux (streaming), appels d'outils | Absents pour tous les fournisseurs |
| R5 | Sortie structurée native (schéma imposé par le fournisseur) | Non utilisée : consigne + validation locale |
| R6 | Routage selon la latence et la qualité | Non modélisé (niveau « économique/standard/premium » indicatif seulement) |
| R7 | Coût confirmé par la facturation du fournisseur | Absent |
| R8 | Vérification automatique des modèles (test réel puis `markVerified`) | Non automatisée |
| R9 | Idempotence et disjoncteur multi-processus | Valables pour un seul processus Node (cas actuel de l'hébergement) |
| R10 | Lecture de `Retry-After`, alertes de seuil de quota, reprise d'une requête interrompue par un redémarrage (ligne « started » orpheline) | Non faits |

## Dette de tests
`tests/palier12-migration-composants-revision.test.js` : liste attendue des migrations passée de `["114","115"]` à `["114","115","116"]` (conséquence directe de la migration 116). Suite complète `npm test` non lancée.

## Pour passer au Programme 21.3
Rédiger ou retrouver 21.1 ; définir les permissions IA dans les rôles ; persister le registre ; fournir une clé de **test** par fournisseur et exécuter une vérification réelle (une requête minimale, hors tests automatisés) ; saisir et dater les tarifs ; décider du sort de `services/aiCore.js`.
