# Audit de l'architecture du Footer actuel de Kolakisa (phase 1, aucun code modifié)

Date : 9 novembre 2026. Dépôt : branche `footer-v2-etude` (= `main` à jour, PR #42 fusionnée). Rien dans `src/`, `views/`, `public/`, `tests/` ni les migrations n'a été modifié ; seuls des fichiers `docs/footer-v2/AUDIT_*.md` ont été ajoutés.
Légende : **[exécuté]** = mesuré par un script sur un vrai serveur de test et un vrai Chrome (scripts et données brutes hors dépôt, voir la fin) ; **[lu]** = lu dans le code, non exécuté.
Le résultat de l'audit d'indépendance graphique est dans `AUDIT_INDEPENDANCE_GRAPHIQUE.md`, la stratégie de remplacement dans `AUDIT_RISQUES_ET_REMPLACEMENT.md`.

## 1. Chaîne complète d'un pied de page, de la bibliothèque au visiteur

| Étape | Où | Ce qui se passe |
|---|---|---|
| 1. Catalogue (100 modèles) | `src/themeBuilder/catalog/footer.js` (assembleur) + `footer/familles/*.js` (15 familles, 2 904 lignes) | Un modèle est un objet déclaratif `{id, structure.rows, identity, responsive}`. Rien en base tant qu'on ne l'utilise pas. [lu] |
| 2. Moteur | `footer/moteur.js` (254 l.) + `footer/kit-conception.js` (143 l.) + `catalog/kit.js` (`kit(S)`) | Les rangées `C/L/T/Z/A` deviennent des bandes pleine largeur ; `kit(S)` fabrique les nœuds (`heading`, `text`, `link`, `button`…) avec les couleurs de l'**ambiance** `S` ; `finishNode()` ajoute survol/focus et cibles de 44 px. [lu + exécuté] |
| 3. Identité (« ambiance ») | `kit-conception.js:47-70` (`ambiance()`, `AMBIANCES`) | 12 ambiances à **couleurs hexadécimales fixes** et polices `font.<famille>` fixes ; contrastes AA vérifiés à la création. |
| 4. « Utiliser ce modèle » | `catalog/use.js` | Copie indépendante (`JSON.parse(JSON.stringify(doc))`) dans un composant du site (`mk_web_components`) + un modèle du Theme Builder (`mk_tb_templates`, type `footer`, brouillon). `origin_key` + `origin_version` mémorisent l'origine (migrations 141-142). |
| 5. Édition | Page Builder du composant (`/marketing/site-web/composants/:id/editeur`) | Même éditeur que les pages ; le pied est une `layout` d'éléments natifs. |
| 6. Publication / affectation | `store.publishScoped`, `conditions.js`, `resolve.js`, `publication.js` | Statut `published` + `conditions` JSON `{include, exclude}` ; le plus précis gagne, puis le plus récent. |
| 7. Rendu public | `views/marketing-public/_sections.ejs:17-21, 93-100` | Une balise `<footer data-kw-footer="1" role="contentinfo">` posée une seule fois par la vue ; le CSS des nœuds sort de `nodes.pageCss()` en classes `.kw-n-<id>` ; la page charge `landing.css`. |
| 8. Aperçu bibliothèque | `src/marketing/web/themeRender.js` `previewDoc` (l.205-229) et `wrapHtml` (l.37-52) | Même vue `_sections.ejs`, enveloppe `<div class="kw-theme-part kw-theme-footer lp-site" style="--kw-…">` + `landing.css` + `<style>` des nœuds. |

## 2. Le point d'architecture qui décide de tout : il n'y a PAS d'isolation CSS

Constats [lus, puis confirmés par exécution] :

* Le pied n'a **aucun identifiant ni classe de portée unique**. Ses nœuds sont de simples `.kw-n-<id>` (spécificité 0,1,0), posés dans la même page que le reste, sous `<body class="lp-body lp-site">` (`landing.css:25, 491`).
* Il n'a **aucune variable CSS propre** : les couleurs et polices du modèle sont **écrites en dur dans chaque nœud** (6 902 couleurs hexadécimales et 2 764 polices `font.xxx` sur 4 471 nœuds, 0 `token:`, 0 `var(--kw-…)` : `static-models.json`). C'est ce qui protège les couleurs.
* Tout ce que le modèle **n'écrit pas** (graisse, hauteur de ligne, taille héritée, police du lien dans un widget, marges, bordures, rayons de champs…) vient donc du site : variables `--kw-*`, `.lp-site`, règles globales de `landing.css`, CSS du thème actif.
* Le moteur lui-même a une rustine, pas une isolation : `nodes.js:340` (`declarations()`) écrit `--kw-font-link/button/heading` sur chaque nœud qui a une `fontFamily`, pour que les liens, boutons et titres « enfants » reprennent la police du modèle plutôt que celle du site.

## 3. Rendu : ce que le pied émet vers l'extérieur et ce qu'il reçoit

* Émet : 52 sélecteurs CSS ajoutés pour un modèle, **tous** en `.kw-n-<id>` du pied (0 règle globale) [exécuté, 2 modèles × 2 largeurs, puis 100 modèles voir audit indépendance]. Charge aussi des `@font-face` globaux pour ses polices (ex. `Mulish`) : inoffensif (nom de famille propre) mais global.
* Reçoit : cf. `AUDIT_INDEPENDANCE_GRAPHIQUE.md` (canaux d'héritage).
* **Le pied contient du contenu qui n'est pas dans le modèle** : la « ligne légale du site » (nom du site, Cookies, confidentialité) est ajoutée **dans chaque pied** par `_sections.ejs:95` + `_foot-legal.ejs`, stylée par `landing.css:66-73, 1785-1786` (`.lp-foot`, `[data-kw-footer] .lp-foot`) et par la police des liens du site. Aucun modèle ne la contrôle.

## 4. Un seul pied, widgets dans le pied (exigence (f))

Résultats connus conservés (docs/footer-builder/VERIFICATION_COMPORTEMENTS_REELS.md, tests `footer-comportements-*.test.js`) et re-vus dans cet audit [exécuté] : pour chaque modèle publié, une seule balise `<footer>` et un seul repère `data-kw-footer` sur la page publique (relevé par `run-structure.js` sur les 100 modèles à 390, 820, 1280 et 1920 px : 100/100 avec exactement 1 `<footer>`, 1 repère `data-kw-footer`, 0 `<footer>/<header>/<main>` imbriqué, 0 `<header>` ajouté, pied pleine largeur, 0 défilement horizontal, 0 élément hors fenêtre) ; widgets (menu, réseaux, coordonnées, abonnement…) sont des **nœuds du pied**, pas des zones extérieures. La zone « widgets de pied » du site (Apparence → Widgets) est rendue à l'intérieur du même `<footer>` (`_sections.ejs:93`). Écarts relevés : voir §9.

## 5. Widgets demandés versus widgets existants

Types de nœuds du Page Builder (`nodes.js` : `NODE_TYPES`, 161 types). État : OK / partiel / absent.

| Widget demandé | Équivalent Kolakisa (type de nœud, élément du moteur) | État |
|---|---|---|
| Site Logo | `sitelogo` (« Logo du site »), élément `logo:N` | OK |
| Site Title | `sitetitle`, élément `title:N` | OK |
| Tagline | `dyntext` avec `{{site.tagline}}` ou `{{business.tagline}}` (`dynamic.js:101,106`) | OK (via texte dynamique) |
| Brand Description | `text` (élément `about`) ; pas de champ « description de marque » dédié dans les Données de l'entreprise | partiel |
| Custom Image / Custom Text | `image`, `text`, `heading`, `html` | OK |
| Copyright dynamique | `copyright` (année + raison sociale ou nom du site) | OK |
| Navigation / Footer Menu | `menu` (`source: location`, emplacement « Pied de page »), `cmsmenu` | OK |
| Custom Links / Quick Links | `link`, `iconlist`, `menu` (éléments saisis) | OK |
| Sitemap | `sitemap` (« Plan du site ») | OK |
| Legal Links | `bizlegal` + liens `Cookies`/`Contact` (élément `legal`, `legallinks`) | OK |
| Address / Phone / Email / Contact | `bizcontact`, `bizphone`, `bizemail` (Données de l'entreprise) | OK |
| Hours | `bizhours` | OK |
| Contact Button | `button`, `cta` | OK |
| Map | `map` (« Google Maps ») | OK |
| Social Icons / Follow | `social` (13 réseaux) | OK |
| Sharing | `sharebuttons` | OK |
| Newsletter / Subscription | `emailsubscribe` (+ `signupform`) branchés sur un formulaire du site ; message explicite sans formulaire | OK |
| CTA | `cta`, `button` | OK |
| Promo Banner | aucun widget dédié ; se compose avec `container` + `heading`/`badge`/`button` ou `marquee` | partiel |
| Contact Form | `emailsubscribe` en mode `fields: "all"` (pas un widget « formulaire de contact » autonome) | partiel |
| Download Button | `button` vers un fichier ; aucune propriété « téléchargement » trouvée dans `nodes.js` | partiel |
| Shop Links / Order Tracking / Shipping / Returns | `shoplinks` (suivi, panier, souhaits), `bizdelivery` (livraison et retours), `shopcategories` | OK |
| Account | `account`, `minicart` | OK |
| Support | `bizcontact` + `cta` ; pas de widget « support » dédié | partiel |
| Payment | `bizpayments` | OK |
| Recent Posts | `querylist` (source `posts`, mode `recent`), `posts` | OK |
| Categories / Tags | `querylist` (sources catégories / étiquettes), `postterms` (contenu en cours seulement) | OK |
| Custom HTML | `html` (« HTML (sécurisé) » : assaini, pas de HTML libre | OK (avec limites de sécurité) |
| Shortcode | rien dans `nodes.js` | absent |
| Dynamic Content | `dyntext`, étiquettes `{{…}}` | OK |
| Image Gallery | `gallery` | OK |
| Éléments décoratifs | `divider`, `spacer`, `icon`, `marquee`, formes de bord (`shapes`), `motion*` (Motion Studio) | OK |

## 6. Animations, interactions, survol (exigence f)

* Survol et focus : `finishNode()` (`moteur.js:53-82`) donne à chaque lien un soulignement au survol (et la couleur d'accent **seulement** si elle reste lisible ≥ 4,5:1), aux boutons l'inversion fond/texte, aux icônes sociales `opacity .8`, contour de focus de 2 px ; cibles tactiles de 44 px sur mobile. Ce sont des états du nœud (classes `.kw-n-<id>:hover`).
* Aucune animation d'entrée n'est posée par les 100 modèles (une seule mention `motion` dans `familles/creatifs-portfolios.js`). Les widgets `motion*` existent mais ne sont pas utilisés par défaut.
* Interactions : accordéon mobile (28 modèles), retour en haut (`backtotop`, 40 modèles), bascule `toggle`.

## 7. Multisite, conditions, publication

* Le catalogue est **commun (code)** ; l'insertion est **par site** (`site_id` sur `mk_tb_templates` et `mk_web_components`). Isolation testée par `footer-rendu-unifie.test.js` et `theme-builder-pieds-bibliotheque.test.js` (déjà documenté) ; pas retestée ici sauf l'effet de nos essais sur UN site.
* Conditions : `conditions.js` (schéma fermé, 20 règles max, 50 valeurs max), `resolve.js` (le plus précis gagne, puis le plus récent, puis le plus petit id), `publication.js`. Déjà documenté dans `docs/footer-builder/FOOTER_CONDITIONS_ET_PUBLICATION.md` et `docs/theme-builder/ELEMENTOR_DISPLAY_CONDITIONS.md` : non revu ici.

## 8. Ancienne bibliothèque (100 anciens identifiants)

* Code : `footer/ancien.js` (189 l., 100 compositions « mise en page × identité ») et `catalog/footer-aliases.js` (229 l. : `ANCIENS_IDENTIFIANTS` gelé + table `ALIAS` ancien → nouveau).
* `footer.js` : les anciens ne sont **plus listés** (`hiddenLayouts`) mais restent **ouvrables** : `find()` suit l'alias (`index.js:87-95`).
* Utilisateurs du code ancien : `footer.js`, `footer/kit-conception.js`, `catalog/index.js`, `originBackfill.js` (rapprochement du contenu stocké avec les compositions connues, pour remplir `origin_key`), `scripts/documenter-pieds.js`, tests `footer-aliases`, `footer-100-integration`, `footer-bibliotheque-interface`, `theme-builder-pieds-bibliotheque`.
* Ce qui peut être supprimé / ce qui ne le peut pas : voir `AUDIT_RISQUES_ET_REMPLACEMENT.md`.
* Trois niveaux à ne pas confondre : **catalogue** (code, pas de base) ; **instances installées** (`mk_web_components` + `mk_tb_templates`, copies indépendantes, `origin_key`) ; **publiés / affectations** (`mk_tb_templates.status = 'published'` + `conditions`) ; **historique** (`mk_tb_revisions`, 50 par pied).

## 9. Écarts relevés par cet audit (à ne pas perdre)

1. Aperçu bibliothèque (`wrapHtml`, `themeRender.js:42-49`) : les jetons viennent de `appearance.publishedTokens()` (apparence du **site principal** de la plateforme) **avant** ceux du site visé (`main || siteOk.tokens`). Si l'apparence principale est publiée, l'aperçu d'un pied d'un sous-site utilise ses jetons. [lu, non exécuté : demande de publier l'apparence principale]
2. Aperçu vs publié [exécuté, 100 modèles] : sur les 74 modèles comparables élément par élément, la seule différence de style est la marge haute du pied (32 px publiés, 0 en aperçu) et aucun élément ne diffère de plus de 1 px (l'écart de ~3 px relevé le 8 novembre n'apparaît plus) ; 26 modèles ont 16 éléments de plus en aperçu (menu d'exemple annoncé). **Mais l'aperçu ne charge pas le CSS du thème actif** (0/100 modèles changent avec le thème « noir » en aperçu, 100/100 en publié) et **suit les polices du site** (100/100).
3. Éditeur [exécuté, 13 modèles] : même `landing.css`, `<body class="lp-body lp-site lp-builder pb-dm-on">`, ne charge pas le thème actif, n'affiche pas la ligne légale ; textes du modèle identiques à la page publiée (couleur, police, taille, graisse).
4. Ligne légale du site injectée dans chaque pied (voir §3).
5. Pas de « shortcode » ; formulaire de contact autonome absent ; « promo banner » et « support » absents en tant que widgets.

## 10. Ce qui est réutilisable tel quel pour un futur système

* Les widgets natifs et leur contenu dynamique (Données de l'entreprise, menus affectés, formulaire d'abonnement réel) : c'est la valeur fonctionnelle, déjà testée.
* La grammaire de rangées `C/L/T/Z/A`, la grille 12 colonnes, les échelles (espacements, rayons, ombres), la vérification de contraste AA (`ambiance`, `verifierAmbiance`).
* Les états survol/focus/44 px (`finishNode`), l'accordéon mobile, les conditions et la publication, les révisions, l'import/export, les alias et `origin_key`.
* Les tests d'intégration existants (20 fichiers `footer-*.test.js`).
* **À NE PAS réutiliser tel quel** : l'absence de portée CSS (point 2), la ligne légale injectée hors modèle (point 3) et le fait que le pied n'embarque pas ses propres valeurs de typographie (graisse, interligne, tailles).

## Données et scripts (hors dépôt)

Dossier : `/private/tmp/claude-501/-Users-imac-Downloads-Ptojry-google-stich-design/234805b0-e56d-4b6e-a957-09d5db8adc8d/scratchpad/audit-v2/` (`lib.js`, `snap.js`, `run-scenario.js`, `run-contam-preview.js`, `static-models.js`, `aggregate.js`, `*.jsonl`, `*.json`).
