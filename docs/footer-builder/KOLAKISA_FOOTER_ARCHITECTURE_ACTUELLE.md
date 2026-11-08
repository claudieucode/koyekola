# Pied de page Kolakisa : architecture actuelle (audit du 7 novembre 2026)

Audit en lecture seule de `main` (branche `footer-builder`, copie de `d0d0f013`). Aucun code modifié.
Légende des preuves : `fichier:ligne` = code lu ; « test » = test exécuté pendant cet audit ; « non vérifié » = lu seulement, ou non exécuté.

## 1. En une phrase

Un pied de page est une **ligne de la table `mk_tb_templates`** (type `footer`, état, conditions) qui pointe vers un **composant** de la table `mk_web_components` (le dessin du pied, fait avec les mêmes éléments que le Page Builder). Au moment d'afficher une page, le serveur cherche quel modèle `footer` publié correspond à la page, lit la **version publiée** du composant et l'insère en bas de page.

## 2. Les données (tables)

| Table | Rôle pour le pied | Preuve |
|---|---|---|
| `mk_tb_templates` | un modèle : `type='footer'`, `status` (draft / published / archived), `conditions` (JSON inclure/exclure), `source_kind='component'`, `source_id` (id du composant), `revision` (compteur anti-conflit), `legacy_ref`, `site_id` (NULL = site principal) | `src/marketing/migrations/124_theme_builder.sql:4`, refaite en `128_theme_builder_site_principal.sql:4` |
| `mk_tb_versions` | une « version » créée à chaque publication (contenu + conditions + nom), 30 conservées | `store.js:125` (publish), purge `n - 30` |
| `mk_web_components` | le dessin : `section` (version publiée), `draft` (copie de travail), `version`, `revision`, `kind`, `site_id` | migrations `036`, `067_composants_cycle_de_vie.sql:6-8` |
| `mk_sites.footer_component_id` | ANCIEN réglage « pied de page du site » (colonne ajoutée par la migration 042) | `042_modeles_et_parties_de_site.sql:19` |
| `appearance_configs` | ANCIEN moteur d'apparence du SITE PRINCIPAL : `draft` / `published` contiennent encore `footer` (marque, slogan, cookies, texte de copyright) | `src/config/database.js:695`, `services/appearance.js:84` |
| `mk_settings` (zones de widgets `footer-1`, `footer-2`) | ANCIENS « widgets de pied » (Apparence → Widgets) | `views/marketing-public/_foot-extra.ejs:2` |

Le catalogue (100 pieds) n'est **pas en base** : c'est du code (`src/themeBuilder/catalog/footer.js`, 323 lignes). « Utiliser ce modèle » en crée une copie indépendante.

## 3. Du « créer » au « afficher » (flux)

1. **Création.** Deux entrées :
   * « Nouveau » : `POST …/constructeur-de-theme/api/modeles` (`src/marketing/web/themeBuilder.js:77`) → `store.create` (`store.js:79`) crée un composant de départ (un seul titre, `starter`, `store.js:52`) + une ligne brouillon.
   * « Bibliothèque » : `POST …/bibliotheque/utiliser` (`themeBuilder.js:186`) → `catalog/use.js` `useTemplate` (copie du document du catalogue + formulaire d'inscription RÉEL du site s'il existe : `siteFormId`, `use.js:13`).
   Le pied naît **toujours en brouillon** avec des conditions vides (= « tout le site »).
2. **Édition.** « Modifier » ouvre l'éditeur du Page Builder sur le composant : `/marketing/site-web/composants/:id/editeur?modele=<id>&retour=tb` (`themeBuilder.js:30`). Enregistrement automatique (1 s après la dernière modification) dans le **brouillon du composant** (`PUT …/composants/:id/brouillon`, `public/js/page-builder.js:8356`). Rien n'est visible du public.
3. **Publication.** Bouton « Publier » de la carte → `POST …/modeles/:tid/publier` (`themeBuilder.js:100`) → `store.publish` (`store.js:125`) :
   * contrôle de révision (anti-conflit 409), recherche des conflits (`conflictsFor`, `store.js:106`) ; doublon exact bloquant, sauf « remplacer » explicite (l'ancien repasse en brouillon, rien n'est supprimé) ;
   * dans une transaction : publie le composant (`P().publishComponent`, le brouillon devient la version diffusée), ajoute une ligne `mk_tb_versions`, passe le modèle en `published`, incrémente `revision`.
4. **Résolution** (quel pied pour quelle page) : `themeBuilder/resolve.js:11` (`evaluate`) et `resolve` ; filtre : brouillon/archivé jamais ; une exclusion qui correspond l'emporte ; inclusions en OU ; le plus précis (`match.js:13` `scoreOf`) gagne ; à égalité le plus récemment publié, puis le plus petit identifiant. Liste des modèles publiés du site mise en cache, invalidée par `store.stampOf` (`render.js:12`).
5. **Affichage** — il existe **trois chemins de rendu public** (c'est le point d'attention n° 1 pour la reconstruction) :

| Chemin | Pages concernées | Code | Balise du pied | Ajouts « historiques » |
|---|---|---|---|---|
| A. Pages du Page Builder | `/p/<adresse>`, accueil, pages libres du site | `landingPublic.js:48` → `pages.withSiteParts(…, { themeBuilder: true })` (`pages/index.js:961`) → `render.partsFor` (`render.js:85`) ; le pied est la **dernière section** de la page ; classes `lp-site-part lp-site-footer` (`_sections.ejs:19`) | `<div>` (aucun `<footer>`) | `_foot-extra.ejs` ajoute DANS le pied les zones de widgets `footer-1/2` + la ligne légale (cookies, confidentialité) (`_sections.ejs:92`, `landing.ejs:37`) |
| B. Pages « habillées » du site (blog, article, recherche, 404, formations…) | tout ce qui passe par `res.render` d'une page complète sur un domaine de site ou le site principal | middleware `themeLayout.js:12` → `themeRender.renderParts` (`themeRender.js:99`) → `res.locals.themeFooter`, injecté par `views/partials/footer.ejs:8` à la place du pied d'origine ; classes `kw-theme-part kw-theme-footer` | `<div>` | **aucun** : ni zones `footer-1/2`, ni ligne légale (le pied d'origine entier est remplacé) |
| C. Pages boutique | catalogue, panier, compte, commande… | `views/boutique/_bottom.ejs:2` : propre `<footer class="sh-foot">` | `<footer>` fixe | le Theme Builder **ne les touche pas** (aucune référence à `themeFooter` hors `partials/footer.ejs` et `site-public-error.ejs`) ; non vérifié en exécution |

   Contexte de la page (quelle « vue » : accueil, page, article, archive, recherche, 404, produit…) : pour A, `partsFor` ne connaît que `front`/`page` (`render.js:85-97`) ; pour B, `res.locals.themeCtx` est posé par `renderRegion` quand la route le demande (`themeRender.js:85` ; appelants : `routes/blog.js:208,393`, `routes/pages.js:47`, `routes/courses.js:260`, `shopPublic.js:87`) ; sinon `defaultContext` (accueil si `/`, sinon page) (`render.js:48`). Conséquence : une page non déclarée (ex. liste de formations, `login`) est vue comme « page ».

## 4. Règle « un seul footer rendu » : où et comment

Garanties **par construction** (code) :
* Un seul gagnant par type : `Res.resolve(pool, c, { type }).winner` (`render.js:51-56`) → au plus un composant `footer`.
* Chemin A : `tbFoot = page.sections.some(sitePart === "footer")` (`landing.ejs:37`) ; s'il y a un pied TB, le pied par défaut `<footer class="lp-foot">` n'est **pas** écrit (`landing.ejs:43`, condition `!tbFoot`) ; ses ajouts historiques entrent DANS le pied TB.
* Chemin B : `partials/footer.ejs:8` : `if (themeFooter) { sortie TB } else { pied d'origine }`.
* `withSiteParts` : l'ancien pied du site (`footer_component_id`) n'est repris que s'il n'existe AUCUN modèle publié de type `footer` sur le site (`pages/index.js:966-969`, drapeau `managed`). Si le Theme Builder gère le pied mais qu'aucun modèle ne s'applique à la page (exclusion), **la page n'a pas de pied TB et l'ancien réglage n'est pas repris** ; c'est le repli d'origine (`<footer class="lp-foot">`) qui s'affiche.
* Aperçu : `force` injecte exactement le composant prévisualisé (`pages/index.js:975`).

Garanties **testées** :
* `tests/theme-builder-pied-unique.test.js` — 4 tests, **4 réussis** (exécution de cet audit, 209 s) : repli unique ; pied TB rendu 1 fois et sans pied par défaut ni zones de widgets ; page exclue : repli 1 fois ; isolation entre deux sites.
* Autres suites présentes (non relancées en entier ici, voir `RISQUES_ET_CONTRAINTES`) : `theme-builder-pied-de-page-coherence` (10 tests, dont Chrome), `theme-builder-pieds-bibliotheque` (« UNE seule fois par page : accueil, blog, article, 404 », ligne 225), `widgets-theme-builder-unicite`.
* Purs et rapides, exécutés : `theme-builder-noyau` 14/14 ; `theme-builder-regles` 12/12.

Failles potentielles de la règle (à traiter dans la reconstruction) :
1. **Deux balises « pied » possibles** : le pied TB est un `<div>`, le repli un `<footer>`. Aucun des 100 modèles ne met `tag: "footer"` (comptage fait par script : 0 sur 100) alors que le moteur l'accepte (`nodes.js:389`, `_node.ejs:44`). Résultat : sur les pages avec pied TB, **aucun repère `contentinfo`** pour les lecteurs d'écran (sauf si l'utilisateur règle la balise lui-même sur un conteneur).
2. **Comportement différent A / B** : sur une page du Page Builder, les zones `footer-1/2` et la ligne légale s'ajoutent dans le pied TB ; sur une page de blog, elles disparaissent. Même pied, deux rendus.
3. Chemin C (boutique) : pied indépendant, non piloté (conditions « produit » / « boutique » ne l'atteignent pas).

## 5. Anciens mécanismes et leurs dépendances (à ne pas casser, à clarifier)

| Ancien mécanisme | État aujourd'hui | Dépendances | Preuve |
|---|---|---|---|
| `mk_sites.footer_component_id` | Toujours lu comme **repli** quand le site n'a aucun modèle `footer` publié ; toujours écrit par `setSiteParts` ; protège le composant contre la suppression (`componentRole`) ; copié à la duplication d'un site | `pages/index.js:708,797,894,947,1030-1046,1103` ; `services/siteEditor.js:33` ; `services/siteStyles.js:268` ; importé (idempotent) dans le Theme Builder par `legacy.js:37` | lu |
| `partsFor.managed` | Drapeau « le Theme Builder gère cette partie » : coupe le repli sur l'ancien réglage | `render.js:91`, `pages/index.js:968` | lu + test `pied-unique` |
| Import des anciens pieds | Au démarrage (`server.js:260` → `legacy.adoptAllSites`) et à chaque ouverture du tableau de bord (`themeBuilder.js` `listAll` → `adoptSiteParts`) : le pied désigné par `footer_component_id` devient un modèle **publié** (`legacy_ref='site-part:footer'`). Lecture seule des anciennes colonnes | `legacy.js:37-58` | lu |
| `appearance_configs.footer` + `partials/footer.ejs` | Pied « d'origine » du **site principal** (marque, slogan, cookies, copyright) : toujours affiché quand aucun pied TB ne s'applique. Son écran d'édition n'existe plus (`/site-web/apparence/pied-de-page` redirige vers le Theme Builder, `appearanceEditor.js:130`) mais la donnée est encore lue | `views/partials/footer.ejs:13-60` | lu |
| Zones de widgets `footer-1` / `footer-2` | Encore rendues (si non vides) dans le pied d'origine ET dans le pied TB du chemin A uniquement | `_foot-extra.ejs`, `landing.ejs:43`, `footer.ejs:56` | lu |
| `components` « variantes » / `header_mode` | concernent l'en-tête seulement | — | — |

Règle d'or pour la reconstruction : **ne jamais supprimer** ces colonnes/lectures sans migration de repli ; l'import `legacy.js` les lit.

## 6. Isolation multisite et permissions

* Le site vient toujours de l'**adresse** (`/site-web/sites/:id/…` ou `/site-web/principal/…`), jamais du corps de requête (`themeBuilder.js:14-16`), et est revérifié par `store.site()` (`store.js:15-24`) : un compte limité à un site (`ctx.siteScope`) ne voit pas le site principal ni un autre site.
* Chaque requête SQL filtre `organization_id` ET `site_id IS ?` (`store.js` partout ; `row()` ligne 26).
* À la création depuis un document existant : le composant/page doit appartenir au site (`store.js:84-87`).
* Rendu public : `pageRowOf`/`pickRegion` filtrent `site_id IS ?` et `organization_id` (`render.js:73,121`) ; test d'isolation `pied-unique` « le pied d'un site ne retire pas le repli de l'autre ».
* Exception connue : `store.byDocument` (`store.js:44`) cherche par organisation seulement (le site est celui de la ligne) ; usage éditeur.
* Droits : **`forms.read`** (voir, simuler, exporter), **`forms.write`** (créer, modifier, publier, importer), **`pages.delete`** (suppression définitive) (`themeBuilder.js:2`). Particularité : le pied de page est protégé par les droits « formulaires », pas par un droit propre au thème/site ; à discuter.
* Médias : le dessin du pied ne référence que des adresses validées par `imageUrl` (`pages/sections.js:29-38`) : `/uploads/marketing/<n>/(site-<n>/)…` — **le motif accepte n'importe quel numéro d'organisation ou de site** (validation de forme, pas d'appartenance). Un pied exporté d'un site vers un autre garde donc ses images par adresse, qui continuent de s'afficher tant que le fichier existe (non vérifié : contrôle d'accès du dossier `uploads`).
* Formulaire d'inscription dans un pied : `signupform` vérifie `mk_forms.id` + `organization_id` seulement (`nodes.js:845-851`), donc un formulaire d'un autre site de la même organisation passerait ; `use.js` choisit en priorité celui du site.
* Site principal : lignes `site_id NULL` depuis la migration 128 ; `adoptSiteParts(ctx, null)` ne cherche pas de colonne (`legacy.js:36` : `P().getSite` n'est pas appelé pour `null`, les parties du site principal sont des « réglages d'apparence »).

## 7. Cycle de vie (états)

`draft → published → (draft | archived)` ; `archived → draft` (restaurer) ; suppression définitive seulement depuis `archived` (le composant reste dans « Composants ») : `store.js:154-170`. Dupliquer : copie du composant + nouvelle ligne brouillon, mêmes conditions (`store.js:171`).
Depuis l'éditeur, « Publier » / « Dépublier » du composant passent par la même logique de modèle (correction de stabilisation, `docs/theme-builder/KOLAKISA_THEME_BUILDER_STABILISATION.md` anomalies 2 et 4 ; test `theme-builder-stabilisation`, non relancé ici).

## 8. Fichiers à connaître

`src/themeBuilder/{store,resolve,match,conditions,render,instances,portable,legacy,thumb,types}.js` · `catalog/{footer,index,kit,use,identities}.js` · `src/marketing/web/themeBuilder.js` (195 l., routes) · `src/marketing/web/themeRender.js` · `src/middlewares/themeLayout.js` · `src/marketing/pages/index.js` (zones 930-1060) · `views/marketing-public/{landing,_sections,_foot-extra,_foot-legal}.ejs` · `views/partials/footer.ejs` · `views/marketing/theme-builder.ejs` + `public/js/theme-builder.js` (537 l.) · `public/js/page-builder.js` (8735 l.) · `src/marketing/pages/nodes.js` (2177 l., registre des éléments).
