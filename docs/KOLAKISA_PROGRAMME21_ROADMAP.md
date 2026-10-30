# Feuille de route — Programme 21

Chaque palier : tests, documentation, aucun appel payant sans autorisation, aucun déploiement sans confirmation. Aucun palier ne démarre automatiquement.

| Palier | Contenu | Livrables clés | Dépend de | Critère de sortie |
|---|---|---|---|---|
| **21.1** | Audit, étude, architecture (ce palier) | 8 documents | — | Revue humaine |
| **21.2** | AI Core | Interface fournisseur extraite d'`aiCore` (comportement identique), modèle configurable, orchestrateur à étapes, migration `mk_ai_generations`, plafond par site, journal d'audit, simulateur de fournisseur pour tests | Préconditions §ci-dessous | Tests `ia-*` existants verts + nouveaux tests d'isolation/quota ; **aucun appel réel** |
| **21.3** | Brief Analyzer + Site Planner | `Brief`, `SitePlan`, validation, API `POST …/ia/site/plan` sans écriture | 21.2 | Plans valides contre fournisseur simulé ; 1 essai réel **autorisé** documenté |
| **21.4** | Page Generator + Component Mapper + Adapter | Création atomique de pages en brouillon + menu via mécanismes de packs | 21.3 | Rejets de propriétés inconnues testés ; sites ouvrables dans l'éditeur |
| **21.5** | Design Generator | `DesignProposal` → brouillon de styles, contrôle de contraste | 21.4 | Contraste ≥ 4,5:1 garanti par test |
| **21.6** | Content Generator | Textes, FAQ, SEO, espaces réservés, détection de faits inventés | 21.4 | Aucune donnée factuelle hors `knownFacts` dans les tests hostiles |
| **21.7** | Médias | Choix médiathèque/placeholder ; étude puis (si validé) fournisseur d'images avec étiquetage | décision fournisseur | Droits et coûts documentés avant code |
| **21.8** | Interface | Écran guidé, progression, aperçu, accessibilité, marine | 21.3–21.6 | Tests navigateur, mobile, `data-mk-once` |
| **21.9** | Régénération et historique | Empreintes, éléments modifiés protégés, comparaison, annulation | 21.4 | Le travail manuel n'est jamais écrasé (test) |
| **21.10** | E-commerce | Seulement si le Builder e-commerce existe et est validé ; sinon reporté | état du e-commerce (non audité ici) | À auditer d'abord |
| **21.11** | Audit final | Sécurité, performances, suite complète, rapport | tout | Statut honnête |

## Préconditions du palier 21.2
1. Décision humaine sur la **place de 20.2** (fusion dans `main`) et sur le statut de 20.3–20.7 (non exécutés).
2. Réparer ou isoler les tests déjà en échec sur `main` (registre de menu, `cms-urls`, `effacer-donnees`) pour qu'un échec du builder soit lisible.
3. Autorisation écrite pour **un** essai réel borné (budget maximal, modèle, clé) ; sinon fournisseur simulé uniquement.
4. Décision commerciale : clé centrale Kolakisa ou clé du client ; quotas par site.
5. Lecture de la politique de rétention du fournisseur retenu.
6. Numéro de migration libre vérifié le jour J (116 si la branche LMS n'est pas fusionnée ; sinon plus haut).

## Risques principaux
Coût incontrôlé (plafonds) · sorties hors schéma (validation + réessai unique) · faits inventés (contrôle serveur) · écrasement du travail manuel (empreintes) · dépendance à un fournisseur (adaptateur) · CI GitHub inutilisable (tests locaux seulement) · machine/ressources partagées pour les tests.
