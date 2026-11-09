# Bibliothèque de pieds de page : familles, tri, favoris, version et origine (étapes 8, 9 et 10)

Date : 8 novembre 2026. Branche `footer-reconstruction`. Ce document décrit ce qui est construit, comment l'utiliser, et ses limites. Les autres types de modèles du Theme Builder (en-tête, page, article, archive, recherche, 404, produit, archive produit) ne changent pas : tout ce qui est décrit ici est réservé au type « Pied de page » (un test de non-régression le prouve).

## 1. Ce que voit l'utilisateur

- **Famille** : à la place de « Mise en page », le filtre du pied de page liste les **15 familles métier** avec leur nombre de modèles, par exemple « Corporate (8) ». Les 15 familles sont toujours présentes (même vides). Sous les filtres, une phrase décrit la famille choisie. Le compte de chaque famille tient compte de la recherche, de l'identité et du filtre Favoris (mais pas du choix de famille lui-même).
- **Trier par** : Ordre de la bibliothèque (défaut) · Nom (A → Z) · Famille · Plus récents d'abord · Favoris d'abord. Le choix est **conservé** dans le navigateur (`localStorage`, clé `kola.themeBuilder.libSort`) et rejoué à l'ouverture. La recherche et la pagination suivent le tri.
- **Favoris** : une étoile sur chaque carte et un bouton « ★ Favoris (n) » qui filtre la liste.
- **Version** : « version 1 » est affichée sur chaque carte et dans l'aperçu.
- Les mêmes outils existent dans la bibliothèque (fenêtre « Bibliothèque de modèles ») et dans le catalogue direct de la catégorie « Pied de page ».

## 2. Familles : comportement de la liste

La logique de `catalog/footer.js` n'est pas modifiée : tant qu'une famille n'est pas `built`, ses anciens modèles restent listés sous son nom ; une fois `built`, ils sont cachés (mais restent ouvrables). Le filtre et les comptes reposent sur `layoutKey` (la famille). À l'état actuel de la branche : 15 familles, 100 résultats sans filtre (test `footer-bibliotheque-interface`, qui exige 100 et, pour une famille `built`, exactement sa cible).

## 3. Tri (détail)

| Clé `tri` | Règle |
|---|---|
| (vide) | ordre du catalogue |
| `nom` | nom, A → Z, sans tenir compte des accents ni de la casse, chiffres dans l'ordre naturel |
| `famille` | ordre des 15 familles (celui de `FAMILLES_CLES`), puis nom |
| `recent` | date d'ajout décroissante, puis version décroissante |
| `favoris` | favoris de l'utilisateur sur ce site d'abord |

Égalité : toujours l'ordre du catalogue (tri stable). Une clé inconnue est ignorée. Le tri n'agit que sur le pied de page ; sur les autres types le paramètre est ignoré.

## 4. Version et date d'ajout d'un modèle

- **Version de composition** : entier de 1 à 9999, **1 par défaut** quand le modèle n'écrit rien. Un modèle peut déclarer `version: 2` dans son fichier de famille. **Règle de gestion** : on augmente la version quand la composition d'un modèle change de façon visible (structure, contenu fixe, style). Une simple correction de faute ne change pas la version. L'identifiant ne change JAMAIS (c'est lui qui est stable).
- **Date d'ajout** : `addedAt: "AAAA-MM-JJ"` optionnelle. Défaut des nouveaux modèles : `2026-11-08` (la reconstruction) ; les anciens modèles n'ont pas de date (`null`) et passent après dans le tri « récents ». Le tri « récents » utilise donc : date d'ajout, puis version.
- L'assembleur refuse une version non entière ou hors limites et une date mal écrite (erreur en français au chargement, comme les autres contrôles).

## 5. Favoris

### Schéma (migration `142_pied_favoris_origine.sql`, additive)

```
mk_tb_favoris(
  id PK,
  organization_id NOT NULL → mk_organizations(id),
  site_id NULL → mk_sites(id) ON DELETE CASCADE      -- NULL = site principal
  user_id NOT NULL → users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                                  -- aujourd'hui « footer »
  modele_id TEXT NOT NULL,                             -- identifiant ACTUEL du modèle (jamais un ancien alias)
  created_at )
UNIQUE (organization_id, COALESCE(site_id,0), user_id, type, modele_id)
INDEX (user_id, site_id, type)
```

L'unicité couvre aussi le site principal (où `site_id` est vide). Supprimer un site supprime ses favoris ; ceux des autres sites restent.

### API (mêmes adresses que le reste du Theme Builder : `/site-web/sites/:id/constructeur-de-theme/api/…` et `/site-web/principal/constructeur-de-theme/api/…`)

| Méthode | Adresse | Rôle |
|---|---|---|
| GET | `/bibliotheque?type=footer&tri=nom&favoris=1&mise=<famille>&q=…&identite=…&page=…&limite=…` | Liste. Pour le pied de page, la réponse ajoute : `familles` (15 × `{key,label,description,built,target,count}`), `sorts`, `sort`, `favorites:{enabled,count}` et, sur chaque carte, `favorite` (booléen), `version`, `addedAt`. |
| GET | `/bibliotheque/favoris?type=footer` | Clés des favoris de l'utilisateur sur ce site |
| POST | `/bibliotheque/favoris` corps `{type,key}` | Ajoute (idempotent). Réponse `{key,favorite:true}` ; `key` = identifiant actuel |
| DELETE | `/bibliotheque/favoris/:type/:key` | Retire (idempotent) |

### Sécurité et isolation

- Droit : **`forms.read`**, le même que consulter la bibliothèque (voir, c'est pouvoir mettre en favori). Sans ce droit : refus (403/redirection), comme la liste.
- Protection CSRF : le contrôle d'origine existant (`sameOriginOnly`) s'applique aussi au POST et au DELETE (testé avec une origine étrangère : 403, rien d'écrit).
- **Par utilisateur ET par site** : toutes les requêtes filtrent sur l'organisation, le site (ou site principal) et l'utilisateur de la session. Le site vient de l'adresse et est revérifié par `store.site()` ; l'utilisateur vient de la session, jamais du corps de la requête. Testé : site 1 / site 2 et utilisateur 1 / utilisateur 2 (aucune fuite dans les deux sens, retrait indépendant).
- **Identifiants inconnus refusés (404)**, y compris : mauvaise forme, modèle inexistant, modèle ouvrable mais plus listé. Un **ancien identifiant** (alias) est suivi jusqu'au modèle qui le remplace et le favori est enregistré sous l'identifiant actuel.
- Types : seul `footer` a des favoris ; pour tout autre type, POST renvoie 422.
- Un favori dont le modèle n'est plus listé n'est plus renvoyé (aucune erreur) ; la ligne reste en base.

## 6. Version et origine d'un pied installé (étape 10)

- À l'insertion (`catalog/use.js`) : on enregistre sur le modèle du site **l'identifiant d'origine** (`origin_key`, déjà créé par la migration 141) **et la version d'origine** (`origin_version`, nouvelle colonne entière, migration 142). Si le client envoie un ancien identifiant, c'est l'identifiant actuel qui est enregistré.
- La fiche du pied (`origin`) annonce `{ key, name, version, currentVersion }` ; `version` est la version installée (vide si inconnue), `currentVersion` celle de la bibliothèque aujourd'hui.
- **« Revenir au modèle d'origine »** (`revisions.revertToOrigin`) : relit l'identifiant d'origine, **suit les alias** jusqu'au modèle actuel, recrée le brouillon depuis la bibliothèque (révision de sécurité avant, rien n'est publié), met dans la révision « Retour au modèle d'origine « X » (version N) », puis **met à jour** l'origine mémorisée (identifiant actuel + version actuelle). La réponse indique `original.version` (restaurée) et `original.installedVersion` (celle qui avait été installée). La fenêtre de confirmation l'annonce aussi.
- Aucun autre comportement n'a changé (même route, même révision de sécurité).

### Remplissage prudent des anciens pieds (`src/themeBuilder/originBackfill.js`)

Pour les pieds installés avant les migrations 141/142. **Jamais une valeur inventée** : on remplit seulement ce qui est déductible sans ambiguïté, sinon la valeur reste vide.

1. Origine connue, version vide : version **1** si le modèle est un ancien modèle gelé (sa composition n'a jamais changé), ou si le modèle est encore en version 1 aujourd'hui (la numérotation commence à 1, donc une installation antérieure ne peut pas avoir une autre version). Si le modèle est en version > 1 : version laissée vide.
2. Origine vide : le contenu actuel du pied (brouillon ou en ligne) est comparé (identifiants d'éléments ignorés, valeurs par défaut ajoutées par l'éditeur tolérées) à chaque modèle de la bibliothèque, listé ou caché. **Exactement une correspondance** : on enregistre l'identifiant (tel quel, un ancien identifiant reste valable) ; zéro ou plusieurs : vide. Un pied modifié par l'utilisateur ne correspond plus : origine vide.
3. Idempotent. Ne remplace jamais une valeur déjà présente. Ne modifie aucun document.

Outil : `node scripts/pieds-remplir-origine.js <base.sqlite>` (simulation : compte sans écrire) puis `… --ecrire`. **À lancer sur une copie ou après une sauvegarde.** Ce n'est PAS fait automatiquement par la migration (la migration ne change aucune donnée).

## 7. Migration 142 et sauvegarde

- Fichier : `src/marketing/migrations/142_pied_favoris_origine.sql` : une table, deux index, une colonne. Aucune donnée existante n'est touchée.
- Le moteur de migrations fait avant toute migration sur une base qui contient des données une copie `AVANT-MIGRATION-<date>-v142.db` (voir `src/marketing/db/migrate.js`) : le test de migration l'applique sur une copie d'une base contenant des pieds, vérifie le fichier de sauvegarde (état d'avant, sans la colonne), la ligne de journal `[KOLAKISA] Sauvegarde avant migration : …`, que les lignes de `mk_tb_templates` sont identiques avant/après et que rejouer ne fait rien.
- Retour arrière manuel possible (rien ne dépend de la table) : `DROP TABLE mk_tb_favoris` et `ALTER TABLE mk_tb_templates DROP COLUMN origin_version`, puis retirer la ligne 142 de `schema_migrations`.
- Cette migration n'est pas dans le test des migrations figées (`marketing-migrations-figees.test.js` s'arrête à la 046) : rien à y mettre à jour.

## 8. Accessibilité

- Étoile = vrai `<button type="button">` avec `aria-pressed` et libellé « Ajouter/Retirer « X » aux favoris » ; cible de 44 × 44 px ; contour de focus visible (`:focus-visible`) ; activable à la touche Entrée et Espace (essayé dans Chrome). Elle n'est jamais désactivée pendant l'enregistrement (un bouton désactivé perdrait le focus) : le focus reste sur l'étoile.
- Quand le filtre « Favoris » est actif et qu'on retire un favori, la liste est rechargée et le focus est redonné à l'étoile du même modèle s'il reste affiché.
- « Trier par » et « Famille » sont des listes déroulantes natives (clavier, lecteurs d'écran). Le bouton Favoris porte `aria-pressed`.
- Thème sombre : couleurs via les variables `--tb-*` du Theme Builder ; l'étoile active passe en ambre clair (`html[data-kola-theme="dark"]`). Animations coupées avec `prefers-reduced-motion`.

## 9. Tests

- `tests/footer-bibliotheque-interface.test.js` (serveur réel) : familles et comptes, 100 résultats, tri, recherche + famille, favoris, **isolation site A/site B et utilisateur 1/2**, CSRF, droits, version, origine + version à l'insertion, retour à l'origine (alias simulés), non-régression des 8 autres types, site principal, migration 142 + sauvegarde, remplissage prudent.
- `tests/footer-bibliotheque-navigateur.test.js` (Chrome piloté par `tests/helpers-chrome-cdp.js` ; ignoré proprement si Chrome est absent) : filtres, tri conservé, étoiles, clavier, favoris, 390/820/1280, thème sombre, autres types, catalogue direct, aucune erreur JavaScript. Le pilote a reçu une méthode ajoutée `pressActivation` (Entrée/Espace avec texte) ; `key()` n'a pas changé.

## 10. Limites connues

- La table d'alias (`footer-aliases.js`) est encore vide : les tests d'alias utilisent un alias simulé en mémoire ; le premier vrai alias sera exercé dès qu'une famille en déclare un.
- Les favoris ne sont proposés que pour le pied de page. Le tri n'est conservé que dans le navigateur (pas par compte).
- Les favoris dont le modèle disparaît restent en base (invisibles). Pas de nettoyage automatique.
- Le remplissage de l'origine n'est pas lancé automatiquement et ne retrouve que les pieds restés identiques à un modèle ; les autres restent sans origine (« Revenir au modèle d'origine » indisponible pour eux, comme avant).
- Le tri « récents » ne distingue pas les anciens modèles entre eux (pas de date connue).
