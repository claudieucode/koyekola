# Risques et stratégie de remplacement sûre de la bibliothèque de pieds de page (phase 1, aucun code modifié)

Date : 9 novembre 2026. S'appuie sur `AUDIT_ARCHITECTURE_FOOTER_ACTUELLE.md` et `AUDIT_INDEPENDANCE_GRAPHIQUE.md`, et reprend sans le contredire `docs/footer-builder/PLAN_REMPLACEMENT_BIBLIOTHEQUE.md` (8 novembre). **[lu]** = lu dans le code ; **[exécuté]** = mesuré.

## 1. Ce que l'on touche quand on « remplace la bibliothèque »

| Niveau | Où | Ce que fait un remplacement du catalogue |
|---|---|---|
| Catalogue (les 100 modèles) | CODE : `src/themeBuilder/catalog/footer.js` + `footer/familles/*.js` ; aucune ligne en base | Seul niveau modifié par un remplacement. Pas de migration, donc **aucune sauvegarde automatique** (`AVANT-MIGRATION-*` ne se déclenche que pour une migration SQL). |
| Instances installées | BASE : `mk_web_components` (`section` = en ligne, `draft` = brouillon) + `mk_tb_templates` (`type='footer'`, `source_kind='component'`, `origin_key`, `origin_version`) | **Copies indépendantes** (`use.js`, `JSON.parse(JSON.stringify(doc))`). Un changement de catalogue ne les modifie pas. [lu ; déjà testé par `theme-builder-pieds-bibliotheque.test.js`] |
| Publiés | `mk_tb_templates.status='published'`, `published_at` | Idem : inchangés. |
| Affectations | `mk_tb_templates.conditions` (JSON `{include, exclude}`) | Inchangées. |
| Historique | `mk_tb_revisions` (50 par pied), `mk_tb_versions` | Inchangé. |
| Favoris | `mk_tb_favoris` (par utilisateur ET par site) | **Touché** : la clé stockée est l'identifiant ACTUEL du modèle ; un ancien identifiant est suivi par les alias (`favoris.js`, ligne 2). Un identifiant sans alias deviendrait orphelin. [lu] |
| Lien d'origine | `mk_tb_templates.origin_key` | **Touché** : « Revenir au modèle d'origine » relit le catalogue avec cette clé (`revisions.js:151-166`) ; clé introuvable = fonction indisponible pour ce pied (retour `null`, pas d'erreur). |

Conclusion vérifiée par la lecture du code : remplacer le catalogue **ne supprime ni ne modifie aucun pied déjà installé, publié ou affecté**. Le vrai risque est de casser le **lien d'origine** (clé, alias, favoris, vignettes) et de faire **réapparaître ou disparaître** des modèles dans la bibliothèque.

## 2. Ce qui NE DOIT PAS être supprimé

1. `footer-aliases.js` : `ANCIENS_IDENTIFIANTS` (100, gelé) et `ALIAS`. Règle écrite dans le fichier : un identifiant publié n'est jamais réutilisé ni retiré. Si le futur système remplace les 100 identifiants `ft-<famille>-<nn>-<nom>`, ceux-ci doivent à leur tour recevoir un alias vers les nouveaux (chaîne ancien → actuel → futur, `resolveAlias` suit jusqu'à 10 sauts).
2. `footer/ancien.js` : tant que `ALIAS` pointe des anciens vers les 100 actuels, le code ancien n'est plus **listé** mais n'est plus nécessaire non plus pour l'ouverture (l'alias suffit). Il reste utilisé par `footer.js`, `footer/kit-conception.js`, `originBackfill.js` (rapprochement des anciens pieds sans `origin_key` en comparant leur contenu aux compositions connues), `scripts/documenter-pieds.js` et les tests `footer-aliases`, `footer-100-integration`, `footer-bibliotheque-interface`, `theme-builder-pieds-bibliotheque`. **Ne pas le supprimer avant** d'avoir exécuté `originBackfill` sur toutes les bases réelles (sinon des pieds sans `origin_key` ne pourront plus jamais être rattachés) et mis à jour ces 4 tests.
3. Colonnes `origin_key`, `origin_version`, tables `mk_tb_revisions`, `mk_tb_favoris` (migrations 141-142).
4. `catalog/kit.js` (`kit(S)`, `SKINS`, `sty`) : partagé avec les EN-TÊTES et d'autres types (`header.js`, `header/*`, `not_found2`, `product_archive`, `index.js`). Le moteur de pied `footer/moteur.js` ne sert qu'aux pieds mais dépend de `kit.js` : modifier `kit(S)` change aussi ces autres types. [lu]
5. Les widgets de données (`bizcontact`, `emailsubscribe`, `shoplinks`…), les routes publiques `/p/_pied/inscription`, la ligne légale (`_foot-legal.ejs`) : fonctionnalité, pas graphisme.
6. Le **second catalogue** sans rapport (bibliothèque de composants du Page Builder, `src/marketing/pages/libraryComponents.js`, 24 composants « pied de page », motif « barre du bas » dans `patterns.js`) et les pieds par défaut des paquets de thèmes : autres usages, à garder (décision à confirmer par l'utilisateur).

## 3. Risques identifiés par cet audit (nouveaux)

| N° | Risque | Gravité | Preuve |
|---|---|---|---|
| R1 | Un futur pied « indépendant » qui garderait la structure actuelle (`.kw-n-<id>` sans portée, dans `lp-main`) serait de nouveau déformé par le CSS des 130 dossiers de thèmes (129 ont une règle `body[data-kw-pack=…] a`, 85 des règles `.lp-main > …`) et par `landing.css` | **Haute** | essais d'indépendance (étapes 8-9) |
| R2 | La ligne légale ajoutée dans chaque pied par la vue échappe au modèle ; un futur pied isolé devra décider si elle est dedans (style propre) ou dehors | Moyenne | `_sections.ejs:95`, `_foot-legal.ejs` |
| R3 | `declarations()` (`nodes.js:340`) réécrit `--kw-font-link/button/heading` sur tout nœud qui a une police : effet de bord sur les widgets enfants ; à ne pas supprimer sans mesure (les 100 modèles actuels en dépendent pour garder leur police) | Moyenne | lu + essais |
| R4 | Aperçu : `wrapHtml` donne la priorité aux jetons de l'apparence PUBLIÉE du site principal (`main || siteOk.tokens`) sur ceux du site visé | Moyenne (à confirmer par exécution) | `themeRender.js:42-49` [lu] |
| R5 | Supprimer l'ancien catalogue sans migration : aucune sauvegarde automatique | Moyenne | `migrate.js` ne sauvegarde que pour une migration |
| R6 | Les vignettes/aperçus servis depuis un cache navigateur privé de 2 minutes (`Cache-Control: private, max-age=120`) : après déploiement, un ancien rendu peut rester 2 min | Faible | `themeBuilder.js:219-224` |
| R7 | Les 20 fichiers `tests/footer-*.test.js` (+ 2 `theme-builder-pieds-*`) encodent la structure actuelle (10 familles → 15 familles, `data-kw-footer`, classes `kw-*`) ; un remplacement doit les adapter, pas les contourner | Moyenne | `ls tests | grep footer` |

## 4. Stratégie de remplacement sûre (proposition, non appliquée)

Principe : **on ajoute, on n'écrase jamais.** Un nouveau système de pied indépendant doit cohabiter avec l'ancien jusqu'à validation, derrière un type de modèle ou un drapeau explicite, puis basculer.

1. **Photographier avant** (aucun code) : sauvegarde manuelle de la base (`npm run sauvegarde`) ; exécuter en lecture seule les requêtes Q1-Q9 de `docs/footer-builder/PLAN_REMPLACEMENT_BIBLIOTHEQUE.md` §4 (instances par `origin_key`, pieds sans origine, publiés + conditions, sites avec plusieurs pieds sans condition, composants orphelins, révisions) ; figer la liste des 100 identifiants actuels dans un fichier.
2. **Identifiants et alias** : les 100 identifiants `ft-…` actuels ne sont jamais réutilisés ; chaque nouvel identifiant reçoit une entrée de la table d'alias (ancien → nouveau) AVANT d'être listé ; test automatique « aucun identifiant publié n'a disparu sans alias » (le test `footer-aliases` le fait déjà pour les 100 anciens).
3. **Nouveau moteur à portée CSS propre** (ce que l'audit indépendance montre être le seul vrai correctif) : un nouveau type de rendu qui pose une portée unique (identifiant de pied) et emporte ses propres variables ; l'ajouter **à côté** de l'actuel (même table `mk_tb_templates`, nouvelle valeur de version de composition `origin_version`), jamais en remplacement silencieux des 100 instances existantes.
4. **Migration des données** : aucune réécriture des pieds installés. Option : un script idempotent et non destructif (comme `originBackfill.js`) qui propose « remplacer par la version indépendante » pied par pied, jamais en lot automatique ; la version en ligne ne bouge JAMAIS sans publication explicite (règle des révisions, `revisions.js`).
5. **Sauvegarde automatique** : si on ajoute une colonne ou une table, une migration SQL déclenche la copie `AVANT-MIGRATION-<date>-v<n>.db` (10 conservées, la migration est refusée si la copie échoue). Sans migration, sauvegarde manuelle obligatoire avant déploiement.
6. **Retour arrière** : (a) code : `git revert` + redéploiement manuel hPanel — les instances ne bougent pas ; (b) base : restaurer la copie `AVANT-MIGRATION-*` correspondante (procédure `docs/KOLAKISA_BACKUP_AND_RESTORE.md`) ; (c) un pied abîmé : restauration par ses révisions (50 par pied) ou « Revenir au modèle d'origine » (suit l'alias).
7. **Contrôles après déploiement** : Q1-Q9 à comparer avant/après ; Q6 doit renvoyer 0 ligne (aucune `origin_key` sans alias ni modèle) ; le test d'indépendance de cet audit (`run-scenario.js`, scénario en 10 étapes sur les 100 modèles) doit afficher 0 changement de couleur/police/rayon dans les états C, F, G, R, T et P (voir `AUDIT_INDEPENDANCE_GRAPHIQUE.md`).
8. **Ordre conseillé** : (1) corriger d'abord la contamination par le thème et `landing.css` pour les pieds actuels si on veut un gain immédiat (voir le plan de correction de l'audit d'indépendance), sans toucher au catalogue ; (2) puis seulement concevoir de nouveaux modèles sur la base indépendante ; (3) retirer l'ancien code en dernier, après `originBackfill` sur les bases réelles.

## 5. Ce que cet audit n'a pas pu vérifier

* Aucune base de production n'a été lue : le nombre réel d'instances par site, de pieds sans `origin_key` et de favoris est inconnu (requêtes Q1-Q9 à lancer par l'utilisateur ou sur une copie).
* La restauration d'une copie `AVANT-MIGRATION-*` n'a pas été rejouée ici (documentée dans `KOLAKISA_BACKUP_AND_RESTORE.md`).
* R4 (jetons de l'apparence principale prioritaires dans l'aperçu) est lu dans le code, pas exécuté.
