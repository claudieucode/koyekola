# Stratégie de remplacement de l'ancien catalogue de pieds (proposition, rien n'est appliqué)

Principe (repris de `AUDIT_RISQUES_ET_REMPLACEMENT.md` §4) : **on ajoute, on n'écrase jamais**. Les 100 modèles actuels vivent dans le CODE (`src/themeBuilder/catalog/footer.js` + `footer/familles/*.js`) ; les pieds installés sont des COPIES en base. Remplacer le catalogue ne modifie donc aucun pied installé ; le vrai risque est le **lien d'origine** (`origin_key`), les favoris, les alias et l'affichage de la bibliothèque.

## 1. Sauvegarde avant (le remplacement d'un catalogue en code ne déclenche AUCUNE sauvegarde automatique)
Les sauvegardes `AVANT-MIGRATION-<date>-v<n>.db` ne se font que pour une migration SQL (10 conservées, migration refusée si la copie échoue). Mécanisme concret proposé :
1. **Migration vide dédiée** (ex. `NNN_footer_v2_sauvegarde.sql` ne contenant qu'un commentaire, ou ajoutant la colonne de réglage `ft_mode` du pied si elle est retenue) : son passage déclenche la copie `AVANT-MIGRATION-…` automatique. Une colonne `ft_mode` (`legacy|solo|site`, défaut `legacy`) est de toute façon nécessaire pour l'architecture : on s'en sert. [lu pour le mécanisme ; non rejoué ici]
2. **Sauvegarde manuelle** (`npm run sauvegarde`) juste avant le déploiement, hors migration.
3. **Export des instances et affectations** (script lecture seule, sur le modèle de `scripts/pieds-remplir-origine.js` et des requêtes Q1-Q9 de `docs/footer-builder/PLAN_REMPLACEMENT_BIBLIOTHEQUE.md` §4) : pour chaque site, les pieds (`mk_tb_templates` type `footer` : id, `origin_key`, `origin_version`, statut, `conditions`), les composants (`mk_web_components`), les favoris (`mk_tb_favoris`), le nombre de révisions ; écrit en JSON horodaté **hors du dépôt**. Fournit aussi la liste « avant » pour la comparaison « après ».
4. **Étiquette git** avant et après (ex. `footer-v1-final`, `footer-v2-bascule`) : le retour arrière du code est un simple `git revert`/redéploiement.
5. **Liste figée des 100 identifiants actuels** (fichier gelé, déjà `ANCIENS_IDENTIFIANTS` dans `footer-aliases.js`) + liste des 100 nouveaux.
6. **Empreinte de rendu** : relevé des styles calculés de chaque pied publié (scénario de `AUDIT_INDEPENDANCE_GRAPHIQUE.md`, baseline marine) AVANT ; rejoué APRÈS : tout écart sur un pied `legacy` est une régression.

## 2. Ce qui ne doit PAS être supprimé (voir l'audit des risques §2)
`footer-aliases.js` (`ANCIENS_IDENTIFIANTS`, `ALIAS`, règle « un identifiant publié n'est jamais réutilisé ni retiré ») ; `footer/ancien.js` (utilisé par `originBackfill.js`, `footer.js`, `kit-conception.js`, `scripts/documenter-pieds.js` et 4 tests) tant que `originBackfill` n'a pas tourné sur toutes les bases réelles ; colonnes `origin_key`, `origin_version`, tables `mk_tb_revisions`, `mk_tb_favoris` ; `catalog/kit.js` (partagé avec les en-têtes) ; widgets de données et routes `/p/_pied/inscription` ; **le catalogue Page Builder** (`libraryComponents.js` : 24 composants « pied de page », motif « barre du bas » de `patterns.js`) et les pieds par défaut des paquets de thèmes : **autre catalogue, hors périmètre**, à garder (confirmer avec l'utilisateur).

## 3. Identifiants, alias, favoris, `origin_key`, révisions
* Chaque nouvel identifiant v2 reçoit une entrée d'alias **avant** d'être listé ; chaîne `ancien → actuel (100) → v2` résolue par `resolveAlias` (10 sauts max). Test : « tout identifiant jamais publié se résout vers un modèle existant » (`footer-aliases.test.js` le fait pour les 100 anciens ; à étendre).
* **Choix d'identifiants v2** : proposer de **garder les identifiants actuels** quand un modèle v2 en remplace un ; sinon alias vers le nouveau. Dans les deux cas aucun favori ne devient orphelin.
* `origin_key` : pas de réécriture en masse. « Revenir au modèle d'origine » relit le catalogue avec la clé ; clé via alias → modèle v2 (le pied revient alors au design v2 : à signaler dans l'interface, car ce n'est plus le design d'origine du pied). Décision : proposer « Revenir à l'ancien modèle » tant que `ancien.js` existe.
* Révisions (50 par pied) : inchangées ; la bascule `legacy → solo` crée une révision (retour possible).
* `ancien.js` : conservé ; retrait en dernier, jamais avant `originBackfill` partout et mise à jour des 4 tests.

## 4. Pieds publiés et affectations
Aucune écriture sur `mk_tb_templates.status/conditions/published_at`. Un pied publié continue de se rendre depuis SA copie, en mode `legacy` (aucun attribut, rendu actuel). La bascule en `solo` est par pied, explicite, avec aperçu avant/après et retour possible.

## 5. Caches
Aperçus et vignettes : `Cache-Control: private, max-age=120` (`themeBuilder.js:219-224`) : après déploiement un ancien rendu peut rester 2 minutes ; les vignettes (`thumb`) sont à régénérer pour les nouveaux modèles. Cache des paquets de thèmes (`packs/index.js` `cache`/`reload`) : le suffixe d'exclusion est appliqué à l'émission : vider ce cache au déploiement. Cache des feuilles par `asset()` (`?v=`) : changement de `landing.css` = nouvelle version automatique.

## 6. Retour arrière
(a) Code : `git revert` + redéploiement manuel hPanel (les copies ne bougent pas). (b) Base : restaurer `AVANT-MIGRATION-*` (procédure `docs/KOLAKISA_BACKUP_AND_RESTORE.md`) **seulement** si la colonne `ft_mode` ou une donnée a été écrite ; sinon inutile. (c) Un pied abîmé : révisions ou « Revenir au modèle d'origine ». (d) Un site entier : remettre `ft_mode = 'legacy'` pour tous ses pieds (une requête, sans toucher au contenu).

## 7. Ordre d'exécution
1. Sauvegarde + export + tag. 2. Déployer la frontière (phase 2) avec tous les pieds en `legacy` ; test d'égalité des 100. 3. Ajouter les modèles v2 un groupe à la fois (alias d'abord). 4. Basculer la bibliothèque sur v2 (anciens identifiants toujours ouvrables). 5. Proposer `solo` pied par pied. 6. Plus tard seulement : retrait de `ancien.js`.

## 8. Ce que je n'ai pas pu vérifier
Aucune base réelle lue (nombre d'instances, pieds sans `origin_key`, favoris inconnus) ; la restauration d'une copie `AVANT-MIGRATION` n'a pas été rejouée ; le comportement exact de « Revenir au modèle d'origine » avec un alias vers un design différent n'a pas été exécuté.
