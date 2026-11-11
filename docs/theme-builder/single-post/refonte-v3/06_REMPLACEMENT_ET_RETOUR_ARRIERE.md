# Remplacement de l'ancien catalogue — stratégie, contrôles et retour arrière

## Ce qui est remplacé, ce qui ne l'est pas
| | Remplacé | Conservé |
|---|---|---|
| **Catalogue (code)** | `catalog/single_post.js`, `single_post/v2/*`, `shared.js`, `identities.js` (anciennes 100 mises en page v2) | `catalog/kit.js`, `catalog/index.js`, `use.js`, moteur de rendu, conditions, widgets, `apply.js` (étendu) |
| **Instances installées dans les sites** | **rien** | Elles sont des **copies indépendantes** (page du Page Builder + ligne `mk_tb_templates`) : aucune ne référence une clé du catalogue ; elles continuent de s'afficher à l'identique |
| **Modèles publiés / conditions / affectations** | rien | Inchangés |
| **Articles, commentaires, auteurs, taxonomies, autres catégories du Theme Builder** | rien | Inchangés |
| **Aperçus partagés avec d'anciennes clés** (`nom.clair`…) | **cassés** (réponse « introuvable ») | Les copies déjà installées ne sont pas concernées |

## Sauvegarde et retour arrière
- Aucune donnée n'est migrée ni supprimée : la base n'est pas modifiée par cette livraison (pas de nouvelle migration ; `identity_mode` existe déjà via la migration 143).
- **Retour arrière complet** : `git revert` du commit de la reconstruction (ou du merge de la PR) ; le catalogue précédent revient tel quel. Les modèles installés entre-temps avec une clé v3 restent valables (copies indépendantes).
- Avant le déploiement sur l'hébergement : copie de la base (fichier `.db`) comme pour toute mise en ligne.

## Contrôle d'intégrité côté production (à lancer avant et après le déploiement)
```sql
-- modèles Article individuel par site et par état (aucune ligne n'est modifiée)
SELECT site_id, status, COUNT(*) FROM mk_tb_templates WHERE type = 'single_post' GROUP BY site_id, status;
-- modèles installés depuis la bibliothèque avec mémoire d'origine (Fiche produit et Article)
SELECT type, identity_mode, COUNT(*) FROM mk_tb_templates WHERE origin_key IS NOT NULL GROUP BY type, identity_mode;
```
Les deux requêtes doivent donner les mêmes nombres avant et après.

## Ce qui change pour l'utilisateur
Le choix de l'identité (propre, suit le site, hybride) apparaît à côté de « Utiliser ce modèle » pour l'Article individuel, comme pour la Fiche produit. Les modèles installés **avant** cette version n'ont pas de mémoire d'origine : ils restent indépendants et ne proposent pas de bascule.
