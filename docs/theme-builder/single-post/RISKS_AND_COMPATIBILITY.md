# Risques et compatibilité

| Risque | Gravité | Mesure |
|---|---|---|
| Remplacer le catalogue casse les modèles déjà utilisés | Faible | « Utiliser » copie le document ; aucune clé n'est mémorisée dans les sites. Non vérifié sur les données réelles de production (non consultables) : à contrôler par un inventaire avant toute suppression. |
| Liens d'aperçu partagés qui utilisent d'anciennes clés | Moyenne | Ne pas renommer ; en voie B, rediriger ou conserver les anciennes clés en alias. |
| Perte du travail déjà livré (100 compositions auditées) | Moyenne | Voie A recommandée. |
| Double balisage JSON-LD | Moyenne | Le blog produit déjà le graphe ; interdire tout JSON-LD dans les modèles (test). |
| Contenu fictif présenté comme réel | Élevée | Aucune image ni texte d'exemple ; replis neutres modifiables. |
| Champs personnalisés absents | Moyenne | Vérifier d'abord si le CMS les stocke (étape 3). |
| Avertissements médicaux/financiers/juridiques | Moyenne | Textes génériques modifiables, à relire par le propriétaire du site. |
| Charge des tests (machine partagée) | Faible | `TEST_START_TIMEOUT_MS` élevé. |
| Widgets à ajouter (quiz, comparateur, carte) | Moyenne | Ne pas livrer de modèles qui simulent la fonction ; ajouter la brique d'abord. |
| Hors périmètre | — | Autres catégories du Theme Builder, éditeur central, articles et commentaires : aucune modification. |

Sauvegarde et restauration : avant toute étape qui touche le catalogue, le commit précédent sert de point de retour ; aucune donnée de site n'est modifiée par le catalogue.
