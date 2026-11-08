# Risques et compatibilité — Page 404

| # | Risque | Gravité | Constat | Atténuation |
|---|---|---|---|---|
| R1 | **Suppression d'une 404 active d'un site** | Critique | **Écartée par construction** : un site utilise une **copie indépendante** ; changer le catalogue ne la touche pas (confirmé dans le code). | Inventaire par site avant l'étape 8 ; aucune suppression de copie ; sauvegarde de la base ; test de restauration |
| R2 | **Statut 200 sur une page inexistante (soft 404)** | Critique | Gestionnaire final : 404 posé avant le rendu dans tous les cas (confirmé). | Tests HTTP sur les 100 modèles ; interdire toute redirection automatique ; revue de tout script de jeu/compte à rebours (aucune navigation automatique) |
| R3 | **Deux apparences de 404** selon l'adresse | Élevée | Confirmé : erreurs de contenu (article, produit, brouillon) sans modèle | Décision D2 (option A recommandée) ; fichiers partagés sensibles : une session à la fois, `git fetch` + rebase avant envoi |
| R4 | **Site sans page d'accueil publiée** : modèle masqué | Moyenne | Confirmé (`site-public-error.ejs`) | Documenter ; ne pas modifier tant que non demandé |
| R5 | **Échecs préexistants** (aperçu ≠ vignette ; en-tête sur 404) | Moyenne | 2 tests rouges sur `main` | Étape 1 ; ne pas empiler du travail sur un baseline rouge |
| R6 | **Photos / vidéos : droits d'auteur et poids** | Élevée | Aucune banque d'images libre de droits dans le projet | Décision D1 ; emplacements remplaçables ; jamais d'image copiée d'un site tiers |
| R7 | **Mini-jeux : sécurité, accessibilité, mouvement** | Moyenne | Pas de précédent dans la bibliothèque | Script sans dépendance, sans réseau, sans stockage ; clavier ; arrêt sous `prefers-reduced-motion` ; respect de la politique de sécurité du contenu |
| R8 | **Performance** (100 modèles animés) | Moyenne | Les widgets `motion*` chargent des scripts | Charger seulement ce qu'utilise le modèle ; budget de poids par modèle ; test de performance |
| R9 | **Diversité de façade** (nouvelles variantes déguisées) | Élevée | Risque principal de la demande | Portes automatiques sur les arbres réels (TEST_PLAN §2) ; échec du test si seuil non tenu |
| R10 | **Travail en parallèle d'autres sessions** | Moyenne | Le dépôt est modifié par plusieurs sessions (consigne dans `CLAUDE.md`) | Branche dédiée, petits groupes, tests `header-*`, `footer-*`, `isolation-*` avant tout envoi ; **un envoi sur `main` met kolakisa.com à jour automatiquement** |
| R11 | **Test existant à 100/20×5/5×20 codés en dur** | Faible | Confirmé | Réécrit à l'étape 2 avec le nouveau modèle de données |
| R12 | **Export portable / marqueurs de clés** | Faible | Non vérifié | Vérifier avant l'étape 8 |
| R13 | **Canonical sur les 404** | Faible | Non vérifié | Test à l'étape 3 |

## Compatibilité
- Anciennes clés (`humour.centre`…) : ne seront plus trouvables dans le catalogue ; les copies existantes continuent de fonctionner.
- Éditeur, Theme Builder, autres catégories : non modifiés par cette mission.
- Aucun nouveau moteur : réutilisation du catalogue, de « Utiliser », de la résolution par conditions et du rendu.
