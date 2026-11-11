# Article individuel v3 — reconstruction de la bibliothèque (10 novembre 2026)

100 modèles créés de zéro, chacun avec sa propre identité graphique (couleurs et polices en valeurs fixes) et sa propre composition, qui remplacent la bibliothèque précédente.

| Document | Contenu |
|---|---|
| `01_AUDIT_ANCIEN_SYSTEME.md` | audit : fichiers, instances, données dynamiques, problèmes |
| `02_ELEMENTOR.md` | Elementor / Elementor Pro : natif, Pro, tiers, conditions, indépendance de style |
| `03_REFERENCES_MARCHE.md` | 8 démos ThemeForest et 13 publications réellement ouvertes ; ce qui n'a pas pu l'être |
| `04_ARCHITECTURE_INDEPENDANCE.md` | mesure réelle des fuites de style dans Chrome, architecture d'isolation, priorités, limites |
| `05_FICHES_100_MODELES.md` | matrice de diversité et 100 fiches de conception (**générées** depuis le catalogue réel) |
| `06_REMPLACEMENT_ET_RETOUR_ARRIERE.md` | ce qui est remplacé, ce qui ne l'est pas, contrôles de base, retour arrière |
| `07_TESTS_ET_RESULTATS.md` | tests réellement exécutés et résultats |

## Décisions prises (délégation complète de l'utilisateur)
1. **Reconstruction complète** de la bibliothèque `single_post` (catalogue en code) ; aucune instance de site, aucun article, commentaire, auteur ni autre catégorie n'est touché.
2. **Un seul mécanisme de modes d'identité** : celui qui existe déjà sur `main` pour la Fiche produit (`identityModes.js`, `identity.js`, colonne `identity_mode`). Il est étendu à l'article. La PR #39 (mécanisme parallèle) est **refermée**.
3. **Concepts → modèles** : 100 fiches (`v3/concepts.js`) × 32 archétypes de composition (`v3/archetypes.js`) × variantes structurelles choisies automatiquement (`scripts/assigner-variantes-article.js`) pour que chaque arbre d'éléments soit réellement différent (similarité maximale **0,68**, seuil de l'audit 0,80).
4. **Honnêteté de périmètre** : les médias riches (galerie, vidéo, audio, tableau, code, carte), la lettrine et les légendes à crédit vivent dans les blocs de l'éditeur d'article ; le modèle ne simule aucune fonction. Pas de texte posé sur l'image (la grammaire n'accepte pas d'image de fond dynamique).
5. **Anciens fichiers v2** (`single_post/v2/*`, `shared.js`, `identities.js`) : plus référencés par rien ; non supprimés car une règle de sécurité de la machine interdit les suppressions dans Downloads — à retirer avec `git rm -r src/themeBuilder/catalog/single_post/v2 src/themeBuilder/catalog/single_post/shared.js src/themeBuilder/catalog/single_post/identities.js`.

## Régénérer
`node scripts/assigner-variantes-article.js` (si un archétype ou un concept change) puis `node scripts/generer-fiches-article.js` ; contrôle : `node scripts/audit-article-individuel.js --all`.
