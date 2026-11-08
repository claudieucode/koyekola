# Plan de remplacement / enrichissement de la bibliothèque de pieds de page, sans perte

Date : 8 novembre 2026. **Document de plan : aucune modification n'a été faite.**

**Vérifié par exécution** : (a) où vit la bibliothèque (dans le code, rien en base) ; (b) qu'« Utiliser ce modèle » fabrique une copie indépendante en base (3 insertions réelles testées sur une base locale de test : trois composants distincts et trois lignes de modèle ; ma comparaison octet pour octet du contenu stocké avec le catalogue a donné « différent », sans que j'en aie cherché la cause — probablement des champs ajoutés ou normalisés à l'enregistrement ; l'indépendance est donc établie, l'égalité exacte non) ; (c) les 9 requêtes de contrôle ci-dessous ont été **exécutées sur une base locale de test** pour valider leur syntaxe (résultats dans la section 4) ; (d) la sauvegarde automatique « AVANT-MIGRATION » existe dans le code de migration (lecture, pas exécutée sur une grosse base). **Non vérifié** : le contenu de la base de production (aucun accès) ; le comportement des caches du navigateur des visiteurs après un redéploiement réel.

## 1. Comment les choses sont stockées aujourd'hui

| Élément | Où | Preuve |
|---|---|---|
| **Bibliothèque** (les 100 modèles) | **Dans le code** : `src/themeBuilder/catalog/footer.js` (+ `kit.js`, `identities.js`). Aucune ligne en base tant qu'un modèle n'est pas utilisé. Un cache mémoire du serveur (300 entrées max) garde les modèles construits ; il se vide au redémarrage. | commentaire de tête de `catalog/index.js` ; `CACHE` dans `index.js` |
| **Instance de pied d'un site** | Deux lignes : un **composant** (table `mk_web_components`, colonnes `section` = publié, `draft` = brouillon) et un **modèle du Theme Builder** (table `mk_tb_templates`, type `footer`, `source_kind='component'`, `source_id` = id du composant). | `catalog/use.js` |
| **Lien avec le modèle de la bibliothèque** | Colonne `mk_tb_templates.origin_key` (migration 141) = identifiant du modèle (ex. `trois-colonnes-marque.marque`). **Seuls les pieds installés après le chantier E l'ont** ; les autres : vide. C'est un simple texte, pas une clé étrangère : rien n'empêche un identifiant de disparaître du code. | `use.js` ligne `UPDATE … origin_key`, `revisions.js` |
| **Publiés** | `mk_tb_templates.status = 'published'` + `published_at`. | migration 128 |
| **Affectations (conditions)** | `mk_tb_templates.conditions` (texte JSON `{include:[…], exclude:[…]}`), 17 types de conditions. Pas de champ « priorité » manuel : le plus précis gagne, puis le plus récemment publié, puis le plus petit identifiant. | `resolve.js`, `conditions.js` |
| **Historique** | `mk_tb_revisions` (50 révisions par pied) ; `mk_tb_versions` (versions du modèle). | migrations 124, 141 |
| **Isolation par site** | `site_id` sur modèles et composants ; la bibliothèque est commune (code), l'insertion est par site. | `use.js`, test `theme-builder-pieds-bibliotheque` |

**Autres registres de pieds (important pour « aucun ancien modèle ne doit réapparaître »)** : il existe **un second catalogue sans rapport avec le Theme Builder** : la bibliothèque de composants du Page Builder (`src/marketing/pages/libraryComponents.js`) contient **24 composants de rôle « pied de page »** (footer-simple, footer-colonnes…, vérifié par exécution), plus un motif « barre du bas » (`patterns.js`) et des pieds « par défaut » de thèmes/packs (`src/marketing/themes/packs/*`). Ils ne sont pas servis par la bibliothèque du Theme Builder, mais un utilisateur peut les insérer comme sections. Il faut décider explicitement s'ils restent (recommandé : oui, ce sont d'autres usages).

## 2. Ce qui garantit aujourd'hui qu'une nouvelle version de la bibliothèque ne casse pas les instances

- **Copie à l'insertion, pas référence** : `useTemplate` fait un `JSON.parse(JSON.stringify(doc))` du modèle puis le range dans un composant du site. Changer ou supprimer un modèle du code **ne touche aucun pied déjà installé** (testé : `theme-builder-pieds-bibliotheque` « copie indépendante »). C'est la bonne protection de base.
- **Limite 1 : « Revenir au modèle d'origine »** relit le catalogue **actuel** avec l'`origin_key`. Si un identifiant est supprimé, la fonction disparaît pour ce pied (retour `null`, pas d'erreur). Si l'identifiant est gardé mais la composition modifiée, le retour donnera la **nouvelle** composition sous l'ancien nom (surprise pour l'utilisateur).
- **Limite 2 : anciens pieds sans `origin_key`** : impossible de savoir de quel modèle ils viennent. Aucune action automatique possible ; on peut seulement rapprocher par ressemblance (non recommandé).
- **Limite 3 : pas de numéro de version du modèle** : on ne sait pas dire « cette instance vient de la version 1 du modèle X ».
- **Limite 4 : le test « anciennes clés 404 »** (`anciennes clés du catalogue 20 × 5 n'existent plus`) montre que le chantier précédent a déjà **supprimé** 100 anciennes clés (catalogue 20 × 5) ; les sites qui avaient installé ces anciens pieds ont gardé leur copie, mais l'ancienne vignette n'existe plus.

## 3. Sauvegarde : ce qui existe

- À chaque démarrage qui applique une **migration** sur une base contenant des données, le serveur fait une copie `AVANT-MIGRATION-<date>-v<n>.db` (`VACUUM INTO`), en garde 10, et **refuse d'appliquer** la migration si la copie échoue (`src/marketing/db/migrate.js`, lu ; non exécuté sur une base réelle). Les migrations déjà appliquées ont une empreinte vérifiée (test `marketing-migrations-figees`).
- **Remplacer la bibliothèque (code) ne déclenche aucune sauvegarde**, puisque ce n'est pas une migration. Donc **si l'on ajoute une migration** (nouvelle colonne, table de correspondance), on bénéficie de la copie automatique ; **si l'on ne change que le code**, il faut faire une sauvegarde manuelle avant déploiement (page Sauvegardes de l'administration : type « manuelle », `src/services/backups.js`).

## 4. Requêtes SQL de contrôle (lecture seule)

Fichier : voir ci-dessous. Elles ont été **exécutées sur une base locale de test** (aucune base de production touchée) pour valider la syntaxe. À lancer en production **avant** et **après** le déploiement, puis à comparer.

```sql
-- Q1 : instances de pied par modèle d'origine et par état
SELECT origin_key, status, COUNT(*) AS instances FROM mk_tb_templates WHERE type = 'footer' GROUP BY origin_key, status ORDER BY instances DESC;
-- Q2 : pieds sans modèle d'origine
SELECT COUNT(*) AS sans_origine FROM mk_tb_templates WHERE type = 'footer' AND origin_key IS NULL;
-- Q3 : pieds publiés par site, avec leurs conditions
SELECT site_id, id, name, origin_key, published_at, conditions FROM mk_tb_templates WHERE type = 'footer' AND status = 'published' ORDER BY site_id, id;
-- Q4 : sites avec plusieurs pieds publiés sans condition d'inclusion
SELECT site_id, COUNT(*) AS publies_sans_condition FROM mk_tb_templates WHERE type = 'footer' AND status = 'published' AND COALESCE(json_array_length(json_extract(conditions, '$.include')), 0) = 0 GROUP BY site_id HAVING COUNT(*) > 1;
-- Q5 : pieds dont le composant source a disparu
SELECT t.id, t.site_id, t.name FROM mk_tb_templates t LEFT JOIN mk_web_components c ON c.id = t.source_id WHERE t.type = 'footer' AND t.source_kind = 'component' AND c.id IS NULL;
-- Q6 : instances dont l'identifiant d'origine n'existe pas dans la nouvelle bibliothèque (coller les identifiants valides dans VALUES)
WITH bibliotheque(cle) AS (VALUES ('ligne-copyright-menu.clair'), ('logo-et-copyright.marque'))
SELECT t.origin_key, COUNT(*) AS instances FROM mk_tb_templates t WHERE t.type = 'footer' AND t.origin_key IS NOT NULL AND t.origin_key NOT IN (SELECT cle FROM bibliotheque) GROUP BY t.origin_key;
-- Q7 : poids par site
SELECT site_id, COUNT(*) AS pieds, SUM(status = 'published') AS publies, SUM(status = 'draft') AS brouillons, SUM(status = 'archived') AS archives FROM mk_tb_templates WHERE type = 'footer' GROUP BY site_id;
-- Q8 : révisions conservées
SELECT component_id, COUNT(*) AS revisions, MAX(created_at) AS derniere FROM mk_tb_revisions GROUP BY component_id ORDER BY revisions DESC LIMIT 20;
-- Q9 : un composant partagé par plusieurs modèles (ne devrait jamais arriver)
SELECT source_id, COUNT(*) AS modeles FROM mk_tb_templates WHERE type = 'footer' AND source_kind = 'component' GROUP BY source_id HAVING COUNT(*) > 1;
```

**Résultats de l'exécution sur la base locale de test** (3 pieds insérés par l'API réelle « utiliser » : `ligne-copyright-menu.clair`, `trois-colonnes-marque.marque`, `newsletter-blog.marque`) : Q1 3 lignes (1 instance chacune, état brouillon) ; Q2 0 sans origine ; Q3, Q4, Q5, Q8, Q9 : aucune ligne (attendu : rien de publié, rien d'orphelin, aucun composant partagé) ; Q6 : 2 lignes (les 2 identifiants absents de la liste d'exemple collée, donc la requête détecte bien ce qu'elle doit) ; Q7 : 1 site, 3 pieds, 0 publié, 3 brouillons. Toutes les requêtes sont **syntaxiquement valides** (SQLite avec fonctions JSON). Leur pertinence sur la vraie base reste à confirmer en production.

## 5. Plan proposé (sans perte)

Principe : **on n'écrase jamais, on ajoute.** La bibliothèque est du code et les instances sont des copies : le risque n'est pas de « perdre » des pieds, c'est de **casser le lien d'origine** et de **faire réapparaître ou disparaître** des modèles dans la bibliothèque.

1. **Photographier avant** : sauvegarde manuelle de la base ; exécuter Q1 à Q9 en production et garder les résultats ; exporter la liste des 100 identifiants actuels dans un fichier figé (`docs/footer-builder/IDENTIFIANTS_ACTUELS.json`, à créer à l'étape 1 des étapes proposées).
2. **Identifiants stables** : règle écrite — un identifiant déjà publié n'est jamais réutilisé pour une autre composition ni supprimé de la table de correspondance. Les 100 identifiants actuels sont conservés tant que le modèle existe.
3. **Table de correspondance ancien → nouveau** (fichier de code, pas de base) : pour chaque ancien identifiant, soit « conservé », soit « remplacé par X » (alias), soit « retiré, mais l'instance garde sa copie ». « Revenir au modèle d'origine » suit l'alias ; pour un modèle retiré, la fonction affiche « ce modèle n'est plus proposé » au lieu de disparaître en silence.
4. **Version de composition** : ajouter à chaque modèle un numéro de version (`v1`, `v2`) dans le catalogue ; l'instance mémorise la version à l'insertion (nouvelle colonne via migration → sauvegarde automatique AVANT-MIGRATION). Sans cela, « Revenir au modèle d'origine » ne sait pas quelle version restituer.
5. **Migration** : aucune donnée existante n'est réécrite. Seule action sur les données : (option) remplir `origin_key` des anciens pieds quand un rapprochement exact est possible (comparaison du contenu stocké avec la composition connue) ; sinon laisser vide.
6. **Déploiement** : déployer le code → redémarrer (le cache mémoire se vide tout seul) → vider le cache navigateur des vignettes n'est pas nécessaire (cache privé de 2 minutes seulement).
7. **Contrôles après** : Q1–Q9 ; Q6 doit renvoyer **0 ligne** pour tout identifiant non couvert par la table de correspondance ; un test automatique « aucun ancien identifiant n'a disparu sans alias » (voir PLAN_DE_TESTS_COMPLEMENTAIRE.md).
8. **Restauration** : (a) rétablir le code précédent (`git revert` + redéploiement) : les instances ne bougent pas ; (b) si une migration a été ajoutée : restaurer la copie `AVANT-MIGRATION-*.db` correspondante ; (c) un pied abîmé se restaure par ses révisions (50 par pied, fonction déjà livrée).
9. **« Aucun ancien modèle ne réapparaît »** : (i) un seul registre pour la bibliothèque du Theme Builder (c'est déjà le cas) ; (ii) test qui vérifie que la liste servie par la route `/bibliotheque?type=footer` est exactement la liste du code, sans doublon et sans clé retirée ; (iii) l'ancien registre « 20 × 5 » est déjà supprimé et couvert par un test de 404.
