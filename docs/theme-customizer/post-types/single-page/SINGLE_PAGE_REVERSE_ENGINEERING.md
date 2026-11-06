# Page individuelle dans le Personnalisateur : rétro-ingénierie de l'existant

Dépôt : `/Users/imac/Downloads/koyekola-ext5-f` (branche `page-individuelle`, à jour sur `main`, HEAD `38ffb2d9`).
Document en lecture seule : aucun fichier de code n'a été modifié. Les numéros de lignes sont ceux du dépôt à cette date.

Vocabulaire : « principal » = site principal (`site_id` NULL) ; « site » = un site du CMS (`mk_sites`, `site_id` entier).

---

## 0. Résumé en dix points (à lire d'abord)

1. Le Personnalisateur a un catalogue FERMÉ à plat : `PANELS` (customizer.js:28) et `controls` (alimenté par `add(...)`, :46-47). Il n'y a ni groupes, ni onglets, ni sous-rubriques. Chaque panneau est une ligne de la liste racine.
2. Un réglage est un chemin pointé (`settings.layout.contentWidth`). Il est validé par `coerce` (:317), puis par le moteur propriétaire (`normalizeSettings` strict pour un site), puis écrit dans `mk_sites.settings` à la publication via `pages.saveSiteDesign` (pages/index.js:551).
3. Le principal n'a PAS de bloc « settings » : `appearance_configs` ne porte que `{tokens, header, footer}` (appearance.js:79-85). Une rubrique « Page individuelle » ne peut donc être livrée que pour les SITES dans un premier temps.
4. `normalizeSettings` (siteSettings.js:105-200) LAISSE TOMBER toute clé inconnue. Toute nouvelle clé `settings.pageSingle.*` doit être ajoutée à `DEFAULT_SETTINGS` (:19) et à `normalizeSettings`, sinon elle est silencieusement perdue à la publication.
5. Aujourd'hui, une page « page » n'affiche AUCUN titre automatique : le H1 vient du contenu (section « bandeau » à `_sections.ejs:27`, ou widget Titre, ou modèle `single_page` avec `{{post.title}}`). `page.title` ne sert qu'à `<title>` et au SEO.
6. Le conteneur public est toujours `<main class="lp-main">` (landing.ejs:38) : 760 px par défaut (landing.css:26), surchargé par `settings.layout.contentWidth`/`fullWidth`/`gutter` (siteSettings.js:217-222) et par le « Format » de page `theme.layout` (layoutFormat.js:45-58). La variable `--kw-content` (jetons, 1080 px) est posée mais AUCUNE feuille du dépôt (src, public/css, views) ne la lit.
7. Il n'y a PAS de colonne latérale à côté d'une page. Il existe une zone de widgets `sidebar` (Apparence → Widgets, `cms_widget_layouts`) rendue seulement dans le blog (`views/blog/index.ejs:5`, `show.ejs:238`), et un type de modèle Theme Builder `sidebar` rendu SOUS le contenu (pages/index.js:1020).
8. Exceptions par page : le bon endroit existant est `mk_landing_pages.theme` (JSON, versionné avec brouillon, publication, historique, duplication). Il faut étendre `normalizeTheme` (pages/index.js:27) ; précédent direct : `theme.layout`.
9. Composants réutilisables : `window.KWNumeric.create` (page-builder.js:8509) est exporté ; le reste (boîte d'espacement 4 côtés liés, `spacingBox` :3566) vit dans la fermeture de `page-builder.js` et n'est pas exportable tel quel. Le personnalisateur a ses propres `numberInput`, `selectInput`, etc. (customizer.js).
10. Piège majeur : `catalog()` (customizer.js:276-283) masque aux sites à thème « paquet » tout réglage qui n'est pas dans `ALWAYS` (:245) ou mesuré comme agissant sur le thème. Le nouveau panneau doit être ajouté à `ALWAYS`.

---

## 1. Le Personnalisateur

### 1.1 Fichiers

| Rôle | Fichier |
|---|---|
| Catalogue, validation, brouillon, aperçu, publication, versions, planification, partage | `src/services/customizer.js` (646 lignes) |
| Routes HTTP (`/marketing/site-web/personnaliser/...`) | `src/marketing/web/customizer.js` (192 lignes) ; `BASE` :15 |
| Gabarit de l'écran | `views/marketing/customizer.ejs` (113 lignes) |
| JS du panneau (IIFE unique) | `public/js/customizer.js` (642 lignes) ; styles `public/css/customizer.css` |
| Aperçu réel (`?kwcustom=1` / `?kwshare=`) | `src/middlewares/customizerPreview.js`, branché dans `src/middlewares/locals.js:78` |
| Tables | `cms_customizer_drafts`, `cms_customizer_versions`, `cms_customizer_shares` (migration `src/marketing/migrations/096_personnalisateur.sql`) |
| Moteurs qui reçoivent la publication | Site : `mk_sites.tokens/settings` ; principal : `appearance_configs` |

Note : le JS du panneau n'est pas `cms-*.js` mais `public/js/customizer.js`.

### 1.2 Structure du catalogue

- `PANELS` (customizer.js:28-45) : liste plate `{ id, label, icon, hint }` : theme-choice, identite, couleurs, typographie, mise-en-page, arriere-plan, images, formulaires, appareils, mode-sombre, palette, en-tete, menus, pied, boutons, css.
- `add(id, panel, kind, label, opts)` (:47) crée `{ id, panel, kind, label, scope: BOTH, live: true, ...opts }`.
  - `kind` : `color | text | textarea | number | select | toggle | media | css` + `palette` (ajouté plus bas). Le commentaire de la ligne 26 liste les 8 premiers.
  - `scope` : `["principal"]`, `["site"]` ou les deux (`BOTH`, :25).
  - `live` : `true` = ne change que du CSS (aperçu sans rechargement) ; `false` = change du contenu (l'iframe est rechargée en gardant la position de défilement). `previewFor` calcule `structural` (:499-505).
  - Options utiles : `min/max/step/unit`, `nullable`, `allowEmpty`, `options` (tableau `[valeur, libellé]` ou fonction `(siteId) => ...`), `number: true` (select numérique), `showIf: { "chemin": valeur | [valeurs] | "*" }`, `perm` (droit requis), `store: "id" | "url"` (media), `help`, `max` (texte).
- `BY_ID` (:221), `ROOTS = ["tokens","header","footer","settings","name","parts","theme"]` (:222).
- `UNSUPPORTED` (:225) : ce que le moteur ne sait pas rendre, affiché tel quel en bas de la liste racine.
- `catalog(siteId, over)` (:276) filtre par portée ; pour un site à thème paquet, ne garde que `ALWAYS(c)` (:245) ou les réglages que la mesure a vus agir (`themeCustomization().staticFor`). `panelsFor` (:284) renvoie les panneaux non vides (+ `menus` toujours) avec leurs contrôles via `publicControl` (:289), qui fait `{...rest}` : toute propriété supplémentaire d'un contrôle (ex. `tab`, `device`) arrive donc automatiquement au client dans `boot.panels[].controls[]`.

### 1.3 Validation d'un réglage

Chaîne côté serveur, dans l'ordre :

1. `cleanChanges(raw, siteId, {can})` (:374-390) : le chemin doit exister dans le catalogue DE CE SITE (`ctl`, `cat.some`), droit `perm` éventuel, puis `coerce`, puis `mediaBelongs` pour les médias (:367, jamais l'image d'un autre site).
2. `coerce(c, raw, siteId)` (:317-366) : par `kind` (toggle → booléen ; number → bornes `min/max`, `null` si `nullable` ; select → doit figurer dans `options` ; color → `#rrggbb` ou `token:xxx` ; media ; text/css → longueur max, caractères de contrôle retirés ; palette → tableau).
3. `applyChanges(config, changes, siteId)` (:400-419) : `setPath` sur une copie de la config publiée, puis validation STRICTE par le moteur :
   - site : `tokensLib.normalizeTokens(..., {strict:true})`, `siteSettings().normalizeSettings(next.settings, {strict:true})` (:413) ;
   - principal : `appearance.normalizeConfig(..., {strict:true})`.
   `assertTokensKept` (:425) refuse une valeur « corrigée en silence » pour les `tokens.*`. Pour `settings.*`, c'est `normalizeSettings` strict qui lève (`bad(...)`).
4. `diffAgainst(live, changes, siteId)` (:435-450) : ne garde que ce qui diffère de la version en ligne. Gère nombres, null/"" et tableaux (branche `Array.isArray`, :438). ATTENTION : un OBJET est comparé via `String(cur) === String(v)` donc `"[object Object]"` : un contrôle de type objet (ex. espacement 4 côtés en un seul contrôle) exige d'étendre cette fonction (comparer en JSON), de même `valuesOf` (:455) et `coerce`.

### 1.4 Brouillon

- Table `cms_customizer_drafts` (096_personnalisateur.sql:6) : `site_id` (NULL = principal), `changes` (JSON `{chemin: valeur}` des seuls réglages DIFFÉRENTS de la version en ligne), `rev` (verrou optimiste), `base_rev` (révision du moteur au début du brouillon), `publish_at`, `scheduled_by`, `publish_error`.
- `saveDraft(ctx, siteId, rawChanges, userId, {rev, can})` (:479-492) : valide tout (`cleanChanges` + `diffAgainst` + `applyChanges` « à blanc »), refuse si `rev` périmé (conflit multi-onglets), vide → supprime le brouillon.
- `state()` (:462) : revalide le brouillon à chaque lecture (un brouillon devenu invalide est signalé via `stale`, jamais appliqué) et renvoie `panels`, `values`, `live`, `changes`, `draft`, `can`.
- Limites : `MAX_CHANGES = 200` (:20), `MAX_VERSIONS = 40`.

### 1.5 Aperçu (CSS recalculé)

1. Client : `set(id, value)` (customizer.js:306) → `afterChange` → `schedulePreview` (délai 220 ms) → `sendPreview` (:~335) → `POST /site-web/personnaliser/rendu` avec `{changes: work()}`.
2. Serveur : route `/rendu` (web/customizer.js:110-118) → `customizer.previewFor` (:499) : mêmes `cleanChanges`/`diffAgainst`/`applyChanges`, puis `assetsOf(siteId, config)` (:507). Pour un site : `siteSettings().siteAssets(tokens, settings, themeCss)` (siteSettings.js:302) donne `theme` = `themeCss(tokens) + layoutCss(settings) + classCss(...)`, plus `custom`, `pack`, et `bodyStyle = tokensToCss(tokens)`. Pour le principal : `appearance.buildCss(config)` (`appearanceCss`).
3. La route range aussi les changements dans `req.session.kwCustomizer[clé]` (clé `"p"` ou l'identifiant du site).
4. Client : `applyAssets(r.assets)` (customizer.js:~362) écrit dans l'iframe les `<style id="kw-appearance" | "kw-site-theme" | "kw-site-custom" | "kw-site-faces" | "kw-pack-cz">` et pose les variables de `bodyStyle` sur `<body>` ; si `structural`, `reloadFrame()` recharge l'iframe.
5. Au chargement de l'iframe (`?kwcustom=1`), `customizerPreview.attach` (middlewares/customizerPreview.js:8) enveloppe `res.render` : pour la vue qui reçoit `site`, il remplace `site.name/tokens/settings/assets` par la config recalculée à partir de `req.session.kwCustomizer` (:53-62). Conséquence capitale : tout ce que la page publique lit dans `site.settings` ou `site.assets.theme` est automatiquement « aperçu en direct ». Ce qui est lu AILLEURS (base de données, `page.theme`) ne l'est pas.
6. Aperçu partageable : `?kwshare=<jeton>` (createShare :~597), sites seulement.

### 1.6 Publication (site principal vs site)

`publish(ctx, siteId, userId, {rev, note, can})` (customizer.js:528-566), dans une transaction (`transaction` de marketing/db/tx) :

- Contrôles : brouillon présent, `rev` identique, `base_rev === live.revision` (sinon « publié par ailleurs »), pour le principal pas de brouillon de l'Éditeur en cours.
- Principal : `appearance.setDraft(null, config, userId)` puis `appearance.publish(null, userId, note)` (table `appearance_configs`, `published_css` calculé par `buildCss`).
- Site : `pages().saveSiteDesign(ctx, siteId, {tokens, settings, name, revision})` (pages/index.js:551-590) : contrôle de révision `mk_sites.settings_revision`, revalide `normalizeTokens` et `normalizeSettings` en strict, `UPDATE mk_sites SET name, tokens, settings, settings_revision = settings_revision + 1`, `invalidateSites()`. Puis `setSiteParts` si en-tête/pied changent.
- Ensuite : insertion dans `cms_customizer_versions` (champs `changes` et `previous` pour le retour arrière), purge au-delà de 40 versions, suppression du brouillon.
- Retour arrière : `restoreVersion` (:568) replace les valeurs « previous » DANS LE BROUILLON (rien n'est publié).
- Planification : `schedule`/`runDue` (:584-~650), publication à l'heure choisie avec les droits revérifiés.

Routes (web/customizer.js) : `GET /site-web/personnaliser` (:74), `POST /rendu` (:110), `/brouillon` (:120), `/annuler` (:129), `/publier` (:139), `/restaurer` (:149), `/planifier` (:159), `/deplanifier`, `/partager` (:173), `/revoquer-partage`. Droits : `appearance.read` (ouvrir), `appearance.styles` (brouillon/aperçu), `appearance.publish`, `pages.code` (CSS additionnel), `seo.edit` (slogan).

### 1.7 JS du panneau (`public/js/customizer.js`)

- `boot` (JSON intégré par la route :92-102) : `panels`, `values`, `live`, `changes`, `draft`, `revision`, `can`, `perControl`, `previews`, etc.
- `renderRoot` (:85-114) : liste des panneaux (en-tête et pied exclus car gérés par le Theme Builder) ; `renderPanel(id)` (:122-137) : boucle `p.controls.forEach(field)`.
- `field(c)` (:153-173) : dispatch par `c.kind` vers `colorInput`, `numberInput` (:221), `selectInput` (:236), `toggleInput` (:242), `mediaInput` (:265), `cssInput`, `paletteInput` (:201), sinon `textInput`. Chaque champ a un bouton « réinitialiser » (`set(c.id, live[c.id])`), un marqueur `is-modified`, `help`, zone d'erreur.
- `updateVisibility` (:286) applique `showIf` (via `wants`).
- État : `values` (valeurs courantes), `live` (en ligne), `work()` (diff = changes), `undoStack/redoStack`, `set`, `sendPreview`, `saveDraft` (:~395), `publish`.
- Appareils : boutons `[data-device]` (:~405) qui règlent seulement la largeur du cadre d'aperçu (`#kwc-frame[data-device]`) ; ils ne changent PAS les valeurs. Les valeurs par appareil existent comme CONTRÔLES SÉPARÉS (`settings.responsive.tablet.h1`… panneau « appareils », customizer.js:193-198 côté serveur).
- Sélection directe d'un élément dans l'aperçu (`installPick`, `selectElement`) : existe pour les éléments, sans lien avec un type de publication.

### 1.8 Exemple complet de bout en bout : « Largeur du contenu de texte »

Contrôle : `add("settings.layout.contentWidth", "mise-en-page", "number", "Largeur du contenu de texte", { scope: ["site"], min: 320, max: 1200, unit: "px" })` (customizer.js:99).

1. L'écran charge `boot.values["settings.layout.contentWidth"]` (760 par défaut, `DEFAULT_SETTINGS.layout.contentWidth` siteSettings.js:21).
2. La personne tape 900 : `numberInput.commit("900")` (customizer.js:226-231) → bornes locales → `set(id, 900)` → `schedulePreview`.
3. `POST /marketing/site-web/personnaliser/rendu?site=12` avec `{site:"12", changes:{"settings.layout.contentWidth":900}}`. La route `target()` (web/customizer.js:39-55) valide le site (accès limité à un site → le sien) ; `need("appearance.styles")`.
4. `previewFor` : `coerce` (number entre 320 et 1200 → 900), `diffAgainst` (≠ 760 → gardé), `applyChanges` (`setPath(next, "settings.layout.contentWidth", 900)` puis `normalizeSettings` strict : `num(ly.contentWidth, 480, 1600, ...)` accepte), `assetsOf` → `layoutCss` produit `.lp-site .lp-main{max-width:900px}` (siteSettings.js:217-220).
5. Réponse `{structural:false, assets:{theme:"..."}}` ; `applyAssets` remplace le contenu de `<style id="kw-site-theme">` dans l'iframe : effet immédiat.
6. « Enregistrer le brouillon » : `POST /brouillon` → `saveDraft` → ligne `cms_customizer_drafts` `{changes:'{"settings.layout.contentWidth":900}', rev:1, base_rev:<settings_revision>}`.
7. « Publier » : `POST /publier` → `publish` → `saveSiteDesign` écrit `mk_sites.settings.layout.contentWidth = 900`, `settings_revision + 1`, `invalidateSites()` ; ligne ajoutée à `cms_customizer_versions` avec `previous = {"settings.layout.contentWidth":760}`.
8. Page publique : `landingPublic.siteOf` → `pages.getSite` → `parseSite` (pages/index.js:427) recalcule `site.assets.theme` → `landing.ejs:14` `<style id="kw-site-theme">`.

Note : 480 est le plancher de `normalizeSettings` (siteSettings.js:119) alors que le contrôle annonce `min: 320` : une valeur 320-479 passerait `coerce` puis serait refusée en strict (« Largeur du contenu : un nombre entre 480 et 1600 »). Écart existant à ne pas reproduire.

---

## 2. Pages « page » du CMS : création, enregistrement, rendu

### 2.1 Modèle de données

- Table `mk_landing_pages` (027_pages_atterrissage.sql) + colonnes ajoutées par migrations : `kind` (`landing | page | step`, `KINDS` pages/index.js:18), `site_id` (NULL = principal), `parent_id` (047), `draft` (JSON du brouillon), `revision` (compteur), `seo`, `header_mode`/`header_component_id` (044), `scheduled_at`, `archived_at`, `published_at`, `indexable`.
- Contenu en ligne : colonnes `sections`, `theme`, `title`, `description`, `seo`. Brouillon : colonne `draft` = `{sections, theme, title, description, seo}` (`normalizeContent`, pages/index.js:~121-143).
- `theme` par défaut : `{accent, background, text}` (`DEFAULT_THEME` landing/index.js:18). `normalizeTheme` (pages/index.js:27-43) accepte : ces 3 couleurs, `css` (CSS de la page vérifié), `layout` (format guidé), `scrollSnap`, puis `motionScenes.applyToTheme` ajoute les scènes Motion Studio. TOUTE autre clé est supprimée.
- Versions : `mk_page_versions` (numéro, contenu complet), historique commun `services/revisions`.

### 2.2 Création

`createPage(ctx, input)` → `createPageInner` (pages/index.js:310-349), dans une transaction : `landing.createPage` puis `UPDATE ... SET kind, site_id, indexable` ; contenu de départ = gabarit (`template`, `mine:<id>` pour un modèle enregistré), ou `sections` fournies, ou `blank`, ou « bandeau + texte ». Route : `POST /marketing/pages` (web/landing.js:120) ; `kind = siteId || mode ? "page" : "landing"` (:137). L'éditeur est `GET /marketing/pages/:id/editeur` (:459).

### 2.3 Enregistrement, révision, publication

- Brouillon : `PUT /marketing/pages/:id/brouillon` (web/landing.js:~570) → `pages.saveDraft` (pages/index.js:153-172) : verrou `revision` (conflit si périmé), `normalizeContent`, `layoutFormat.checkLocked`, `UPDATE ... SET draft, revision = revision + 1`, point d'historique.
- Publication : `POST /pages/:id/publier(.json)` → `pages.publish` (pages/index.js:182-206) : `preflight`, version dans `mk_page_versions`, copie `draft` → `sections/theme/title/description/seo`, `status='published'`, `draft=NULL`, `revision + 1`.
- Réglages de page (nom, adresse, formulaire, étiquettes, indexation) : `landing.saveSettings` (landing/index.js:~84-100), appliqués tout de suite, hors brouillon.

### 2.4 Sélection / aperçu

- Liste : `GET /marketing/pages` (web/landing.js:83) ; filtre de site `ctx.siteScope`/`siteFilter` (cmsPages.js `siteClause`).
- Aperçu d'une page : `GET /marketing/pages/:id/apercu` (web/landing.js:270) → `renderPreview` (:264) → `res.render("marketing-public/landing", { page: shown(...), site, tokensToCss, ... })` où `shown` (:228) = `landing.viewModel`. Même gabarit que le public, `preview: true`. Aperçu de contenu édité non enregistré : `POST /pages/:id/rendu` (:553).
- Dans le personnalisateur, une page du site est proposée via `previewTargets` (web/customizer.js:19-31) = `/marketing/pages/<id>/apercu` pour les sites (jusqu'à 40 pages, hors `step` et archivées), pages fixes du blog etc. pour le principal. Cette liste n'est pas filtrée par type de page ; une rubrique « Page individuelle » voudra présélectionner une page `kind='page'`.

### 2.5 Rendu public

- Route : `GET /p/:slug` (web/landingPublic.js:96) ; sur le domaine d'un site, `/` et `/<adresse>` sont réécrits en `/p/<adresse>` par `middlewares/siteHost.js:81,93,168`. Données : `landing.getPublishedPage(db, slug, {standalone:true})` (landing/index.js:35) qui exclut les pages servant de contenu à un modèle Theme Builder.
- `show` (:55-69) → `res.render("marketing-public/landing", { page: shownPage(req,page), site: siteOf(req,page), tokensToCss, ... })`. `shownPage` (:42-47) appelle `pages.withSiteParts(ctx, page, pages.resolveSections(...), { themeBuilder: true })` puis `landing.viewModel`. `siteOf` : site actif ou null.
- Gabarit `views/marketing-public/landing.ejs` (55 lignes), ordre du `<head>` :
  1. `webPageSeo` + `seo-head-tags`, favicon, `landing.css` (:11),
  2. `<style id="kw-site-theme">` = `siteX.assets.theme` (:14) = thème + `layoutCss` + classes globales,
  3. thème paquet (`assets.pack`), `@font-face`,
  4. `page.nodeCss` (:19) = `layoutFormat.css(theme.layout)` + `scrollSnap.css` + `nodes.pageCss`,
  5. `<style id="kw-site-custom">` (CSS du site), transition, CSS de page `page.customCss`.
- `<body class="lp-body lp-site" style="<tokensToCss> ...">` (:30) seulement si `siteStyle` existe, donc pour une page de SITE. Une page du principal (`site_id` NULL) tombe dans le `else` : `<body class="lp-body" style="--lp-accent: page.theme.accent...">` : pas de classe `lp-site`, pas de jetons, pas de `layoutCss`. Conséquence : tous les sélecteurs `.lp-site ...` ne s'appliquent PAS aux pages du principal.
- Contenu : `<main class="lp-main" id="main">` (:38) contient `_sections.ejs` (sections historiques `hero`, `text`, ..., et sections `layout` du Page Builder qui rendent `.kw-layout > .kw-node`). En-tête et pied de page sont des sections `sitePart` insérées dans ce même `<main>` (`withSiteParts`, pages/index.js:961-992), ce qui explique `.lp-main:has(> .lp-block.lp-site-header:first-child)` (landing.css:860).
- Pied : widgets `footer-1`/`footer-2` via `widgetZoneFor` (landing.ejs:43, `_foot-extra.ejs`).

### 2.6 Largeur du contenu et mise en page : qui décide quoi

| Mécanisme | Où | Effet |
|---|---|---|
| Défaut moteur | `public/css/landing.css:26` `.lp-main{max-width:760px;margin:0 auto;padding:32px 16px 48px}` | colonne de texte |
| `settings.layout.fullWidth/contentWidth/gutter` | `layoutCss` siteSettings.js:215-222 → `.lp-site .lp-main{max-width, padding-left/right}` | tout le site |
| `settings.layout.containerWidth` | `--kw-band-w` et `.kw-container` (:223-225) | bandes et conteneurs des éléments |
| Jeton `tokens.sizes.content` (1080) / `narrow` (720) | `tokensToCss` → `--kw-content`, `--kw-narrow` (tokens.js:219) ; principal : `.container-wide`/`.container` (appearance.js:237-238) | `--kw-content` n'est lu par AUCUN CSS du dépôt (à vérifier dans public/js avant de s'appuyer dessus) |
| Format de page `theme.layout` | `layoutFormat.css` (layoutFormat.js:45-58) émis dans `page.nodeCss` | remet `.lp-main` à `max-width:none; padding:0` et donne leur largeur aux éléments de premier niveau ; peut être « verrouillé » |
| Valeurs par appareil | `layoutCss` (:228-243) `@media (max-width: breakpoints.tablet/mobile)` | `gutter` seulement sur `.lp-main` |

Les quatre mises en page du conteneur voulues (pleine largeur / encadré / étroit / large) se rapprochent de : `fullWidth` (existe), `containerWidth` (existe), `contentWidth` (existe, « étroit »), `tokens.sizes.content` (« large », inutilisé). Elles sont aujourd'hui GLOBALES au site, pas propres au type « page ».

### 2.7 Où le titre (H1) est-il affiché ?

- Aucun titre automatique : ni `landing.ejs` ni `_sections.ejs` n'affichent `page.title`.
- Page historique : la 1re section « bandeau » devient `<h1>` (`_sections.ejs:27`, `i === firstHero ? "h1" : "h2"`).
- Page Page Builder : un widget Titre de niveau 1 posé par l'auteur.
- Page enveloppée par un modèle `single_page` : le modèle contient `{{post.title}}` dans un `H1` (single_page.js:6 `TITLE`, utilisé par les 10 ouvertures `HEROES`).
- Une « zone de titre activable » devra donc injecter un `<header class="kw-page-title"><h1>` avant les sections, avec protections contre le double H1 (voir §2.8 et §7).

### 2.8 Insertion d'un modèle `single_page` du Theme Builder dans ce rendu

Catalogue : `src/themeBuilder/catalog/single_page.js` (183 lignes), 100 modèles (10 familles × 10) ; type `single_page` défini dans `src/themeBuilder/types.js:8` (`views: ["front","page"]`, `legacy: "static_page"`).

Chaîne d'application :

1. `withSiteParts(..., {themeBuilder:true})` (pages/index.js:961) appelle `themeSingleSections(ctx, page, sections)` (:995-1017), seulement pour une page de SITE (`page.site_id` vrai), hors canevas de l'éditeur.
2. `themeBuilder/render.js: singleFor(ctx, page)` (:102-118) : exige `page.kind === "page"` et `site_id`, un modèle `single_page` publié sur le site, que la page ne soit pas elle-même un modèle (`store.byDocument`), résout par conditions (vue `front` = accueil, sinon `page`, avec parents) via `Res.resolve`. Retour `{template, row}` ou `null`.
3. `themeSingleSections` ne s'applique que si TOUTES les sections de la page sont de type `layout` (pages Page Builder). Il clone les sections du modèle, remplace chaque nœud `postcontent` par un conteneur portant le contenu PROPRE de la page, lie `{{post.title}}` et `{{post.excerpt}}` à `page.title || page.name` et `page.description`, retire l'image `{{post.image}}`. Exactement UN `postcontent` requis, sinon repli sur la page nue.
4. Le résultat est inséré entre l'en-tête et le pied dans le même `<main class="lp-main">` ; le modèle est donc contraint par `.lp-main` (largeur, gouttières) comme le reste.
5. `themeExtraSections` (pages/index.js:1020) ajoute APRÈS le contenu la barre latérale Theme Builder (`resolveExtras`, render.js:60) et les modèles « custom ».

Conséquence pour la fonctionnalité : si un modèle `single_page` s'applique, le H1 est déjà fourni par le modèle ; le personnalisateur ne doit pas en ajouter un second, et les largeurs internes du modèle (ex. `NARROW("860px")`) sont les siennes. Aucun indicateur « un modèle s'applique » n'est exposé à `landing.ejs` aujourd'hui (il faudrait poser un drapeau, par ex. `page.singleTemplate`, au retour de `themeSingleSections`).

---

## 3. Colonnes latérales et zones de widgets

- Gestionnaire existant : Apparence → Widgets. Service `src/services/widgets.js` (81 lignes), table `cms_widget_layouts` (migration `097_widgets_par_site.sql`), UNE ligne par site (`site_id` NULL = principal), `layout` JSON `{zones:{sidebar, footer-1, footer-2}, inactive}`, `revision` pour le verrou optimiste. Catalogue des blocs et zones : `src/marketing/widgets/catalog.js` (`ZONES` :11-15, `cleanLayout` :~180-187). UI : `public/js/cms-widgets.js` + `views/marketing/widgets.ejs`.
- Rendu : `widgets.renderZone(siteId, zoneKey)` (widgets.js:57-71) renvoie `<aside class="kw-widget-zone kw-zone-<clé>">...` (chaîne vide si rien). Exposé aux vues : `res.locals.widgetZone(zone)` (site de la requête) et `res.locals.widgetZoneFor(siteId, zone)` (src/middlewares/locals.js:81-82).
- Où la zone `sidebar` est affichée aujourd'hui : uniquement le blog (`views/blog/index.ejs:5`, `views/blog/show.ejs:238`). Les zones `footer-1/2` : `views/partials/footer.ejs:56` et `landing.ejs:43`/`_foot-extra.ejs`.
- Pages du Page Builder : `landing.ejs` n'affiche JAMAIS la zone `sidebar`. Le type Theme Builder `sidebar` (composant, `themeBuilder/types.js:7`) s'affiche SOUS le contenu, pas à côté.
- Pour afficher une colonne à côté du contenu d'une page, deux options :
  - (recommandée, minimale) réutiliser la zone existante `sidebar` : dans `landing.ejs`, entourer `<main>` d'une grille et ajouter `<aside>` avec `widgetZoneFor(wzId, "sidebar")`, uniquement quand le réglage « colonne » ≠ « sans » et `page.kind === 'page'`. Mettre à jour le texte de `ZONES[0].description` (« Colonne à droite de la liste des articles du blog... »).
  - ajouter une zone `page-sidebar` à `ZONES` : propre mais casse `tests/apparence-widgets.test.js:20,51` (qui comparent exactement `["sidebar","footer-1","footer-2"]`) et change l'écran Widgets.
- Colonne « alternative » (une colonne de chaque côté ou alternance) : aucun moteur existant ; à décider (suggestion : alternative = colonne à gauche sur mobile/au-dessus, à droite sur bureau, ou deux colonnes `sidebar` + `sidebar-2` : ce dernier cas nécessite une nouvelle zone et est hors périmètre minimal).

---

## 4. Responsive et isolation multi-sites

### 4.1 Points de rupture

- Stockage : `mk_sites.settings.layout.breakpoints = { tablet: 1023, mobile: 767, wide: 1920 }` (`DEFAULT_BREAKPOINTS` siteSettings.js:8), bornes tablette 820-1279, mobile 400-767, large 1400-3000 ; mobile < tablette obligatoire (:~124).
- Lecture : `siteSettings.breakpointsOf(settings)` (siteSettings.js:204). Utilisé par `layoutCss` (valeurs par appareil `@media (max-width: <bp>px)`, :228-243), `nodes.classCss` (siteSettings.js:306) et `nodes.pageCss(sections, breakpoints)` (landing/index.js:427-434, qui relit `mk_sites.settings` de la page).
- Contrôles du personnalisateur : `settings.layout.breakpoints.tablet|mobile` (customizer.js:~114-115).
- Convention : « ordinateur » = styles de base ; tablette = `max-width: breakpoints.tablet` ; mobile = `max-width: breakpoints.mobile`. Les nœuds du Page Builder portent `styles.desktop|tablet|mobile`.
- Valeurs par appareil existantes : `settings.responsive.{tablet,mobile}.{h1,h2,h3,body,gutter,spaceLg,spaceXl}` (nullable = valeur globale). C'est le patron à imiter pour marges internes/externes par appareil.
- Le sélecteur d'appareil du personnalisateur n'est qu'un redimensionnement de l'iframe : les media queries du CSS recalculé réagissent donc réellement dans l'aperçu.

### 4.2 Isolation (siteScope)

- `src/services/siteScope.js` : `where(siteId, alias)`, `sameScope("site_id")` (égalité principal/site), `assert` (entier positif ou null). Le site doit venir du contexte vérifié, jamais d'un champ libre.
- Personnalisateur : `target()` (web/customizer.js:39-55) : si `ctx.siteScope` est défini (accès limité), seul le site propre est permis ; sinon `?site=`/`body.site` (entier) ou principal. Brouillon, versions, partages indexés par `site_id` (`draftRow` :458, `sameScope`).
- Aperçu : copie de travail en SESSION par site (`req.session.kwCustomizer[clé]`) ; `customizerPreview` vérifie `cmsAccess.can(user, "appearance.read", {siteId})` par site et n'applique les changements que pour le site de la vue.
- Médias : `mediaBelongs` (customizer.js:367) : jamais l'image d'un autre site.
- Pages : `inScope(ctx, siteId)` (pages/index.js:~76), `assertSiteScope`, `landing.getPublishedPage` ne filtre pas par site mais le domaine/`siteHost` le fait (page d'un autre site → 404, siteHost.js:84).
- Un nouveau réglage `settings.pageSingle.*` hérite de tout cela gratuitement (même pipeline). Un stockage par page (`theme.single`) hérite de l'isolation du moteur de pages.

---

## 5. Modèle de données recommandé (le moins invasif)

Priorité voulue : page > global « page individuelle » > thème > défauts du moteur.

### 5.1 (a) Réglages globaux par site : `mk_sites.settings.pageSingle`

Aucune migration SQL (colonne `settings` JSON déjà versionnée par `settings_revision`). Forme proposée :

```
settings.pageSingle = {
  title:   { enabled: false },
  container: { layout: "default" | "full" | "boxed" | "narrow" | "wide", style: "default" | "open" | "boxed-all" },
  sidebar: { layout: "none" | "right" | "left" | "alternate", style: "default" | "open" | "boxed" },
  content: { widthMode: "default" | "custom", width: 760 },
  padding: { linked: true, unit: "px", desktop: {top,right,bottom,left}, tablet: {...}, mobile: {...} },   // valeurs null = héritées
  margin:  { idem }
}
```

À faire : l'ajouter à `DEFAULT_SETTINGS` (siteSettings.js:19), à `normalizeSettings` (avant le `return` :200) avec `oneOf/num/bool` (strict = erreur claire), et au CSS. Rien n'existe pour le principal (§1.6) : le déclarer dans `UNSUPPORTED.principal` (« Types de publication : réservé aux sites »).

Identifiants de contrôles : `settings.pageSingle.*` (préfixe `settings` déjà dans `ROOTS`). Deux modélisations des espacements :
- plate (comme `settings.responsive.*`) : 2 propriétés × 3 appareils × 4 côtés = 24 contrôles `number nullable` + unité/lien : lourde pour `MAX_CHANGES=200`, pas pour le plafond, mais encombrante pour le catalogue ;
- objet (un contrôle `kind:"spacing"` par propriété) : plus propre côté UI, impose d'étendre `coerce`, `diffAgainst`, `valuesOf` (voir §1.3). Recommandé.

### 5.2 (b) Exceptions par page : `mk_landing_pages.theme.single`

- Stocker dans `theme` (JSON de la page) : même clé que `theme.layout`. Avantages : versionné avec le brouillon/publication/historique (`mk_page_versions`), dupliqué avec la page, verrou de révision déjà géré, pas de colonne, cohérent avec le « Format » existant (page-builder.js:7195-7232 : `content.theme.layout`).
- À faire : étendre `normalizeTheme` (pages/index.js:27) pour accepter/valider `single` (mêmes champs que le global, tous optionnels = « hériter »). Sans cela la clé est supprimée au premier `saveDraft`.
- Alternative écartée : colonnes dédiées (précédent `header_mode`, migration 044) : exige une migration, une copie dans `publish`, duplication et export à gérer.
- UI : onglet « Page » du Page Builder (pattern `setLayout`/`change`, page-builder.js:7196-7232).

### 5.3 Résolution et émission du CSS

Ordre CSS existant dans `landing.ejs` : `assets.theme` (global) PUIS `page.nodeCss`. Cela donne naturellement page > global.

- Global : étendre `layoutCss` (siteSettings.js:207) avec une fonction dédiée (idéalement dans un nouveau module `src/marketing/pages/pageSingle.js` appelée depuis `layoutCss`) → inclus dans `siteAssets().theme` → aperçu direct du personnalisateur sans rien d'autre.
- Portée : restreindre aux pages `kind='page'` via une classe sur `<body>` posée par `landing.ejs:30` (par ex. `kw-kind-page`), sélecteurs `.lp-site.kw-kind-page .lp-main`. Sans cela, les landing pages et étapes de tunnel du même site seraient touchées. Décider si l'accueil (`home_page_id`) est inclus (WordPress l'exclut).
- Page : ajouter une 3e entrée dans le tableau `nodeCss` (landing/index.js:434) : `pageSingle.cssForPage(siteSettings.pageSingle, page.theme.single, breakpoints)`. Les réglages du site y sont DÉJÀ relus (lignes 427-433) ; mais attention, cette lecture vient de la base : l'aperçu du personnalisateur ne la voit pas. Donc ne mettre dans `nodeCss` que l'exception de page, et laisser le global dans `layoutCss`. Pour que la page l'emporte sans `!important`, utiliser une spécificité égale ou supérieure et l'ordre (nodeCss vient après).
- Thème (paquet) : les feuilles `assets.pack` viennent après `assets.theme` mais avant `nodeCss` ; un paquet qui définit `.lp-main` serait donc plus fort que le global (et moins fort que la page). Vérifier les 70 paquets avant de promettre « global > thème ».
- Défauts du moteur : `landing.css:26` et `DEFAULT_SETTINGS.layout`. Ne rien émettre quand la valeur vaut le défaut (patron de `layoutCss` : `if (L.gutter !== D.gutter)`).
- Interaction avec `theme.layout` (Format guidé, layoutFormat.js:45) : ce format force `.lp-main{max-width:none;padding:0}` avec une spécificité `body.lp-body .lp-main` ; il faudra décider qui gagne (proposition : un Format guidé EXPLICITE de la page prime sur le réglage global, mais pas sur une exception `theme.single`, et le documenter).

### 5.4 Titre

Ajouter dans `landing.ejs` (avant `_sections`) un bloc conditionnel : `sx.pageSingle.title.enabled && page.kind === 'page' && !<modèle single_page appliqué> && !<la page contient déjà un H1>` → `<header class="kw-page-title"><h1><%= page.title || page.name %></h1></header>`. Le texte d'un titre vient de `page.title || page.name` (même règle que `themeSingleSections`, pages/index.js:1000). Détection du H1 existant : parcourir `sections` (`_sections.ejs:27` + nœuds `heading` niveau 1 déjà parcourus dans `viewModel`, landing/index.js:~409-410).

---

## 6. Composants réutilisables

### 6.1 Dans le Page Builder (`public/js/page-builder.js`, 8723 lignes, IIFE)

- Exporté : `window.KWNumeric = { create: numericControl }` (:8509) et `window.KWEditor` (:8510). `numericControl` (:~2950-3140) : champ nombre + unité (select ou en ligne), pas +/-, glisser pour changer, curseur (`slider`), `onCommit(texteNombre, unité, opts)`. Paramètres documentés :2954-2957. Sert de base pour « slider avec unité ».
- Boîte d'espacement 4 côtés liés : `spacingBox(items)` (:3566) avec `linkState` (:3567, mémorisé via `store.get("spacing-link")`), `cell`, `unitSel` (unité commune), `linkBtn` (lie/délie et uniformise), `tokBtn` (valeur du site). Styles `.pb-spacing`, `.pb-sp-group`, `.pb-sp-grid`, `.pb-sp-box`, `.pb-link-btn` dans `public/css/page-builder.css:1471+`. NON exporté et couplé à `setStyles`, `ownValue`, `inheritedValue`, `renderInspector` : à copier/adapter plutôt qu'à appeler.
- Unités : `UNITS`/`unitsOf` (:2932-2933) : marges `px % rem em auto`, intérieur `px % rem em`. `splitLen` (:2934-2941) découpe « 64px ».
- Sélecteur à vignettes (formats de page) : dans `new-page-dialog.js` et l'onglet « Page » (`LF = boot.layoutFormats`, page-builder.js:7195, `FORMATS` serveur layoutFormat.js:13-19) ; sélection de gabarits à vignettes dans la bibliothèque Theme Builder (`public/js/theme-builder.js`, `src/themeBuilder/thumb.js`). Aucun composant générique « choix à vignettes » n'existe dans le personnalisateur.

### 6.2 Dans le personnalisateur (`public/js/customizer.js`)

- `numberInput` (:221-235) = curseur `range` + champ nombre + unité statique (`c.unit`) : pas de sélecteur d'unité ni de valeurs par appareil.
- `selectInput`, `toggleInput`, `colorInput`, `paletteInput` (liste éditable avec ajout/suppression : bon modèle pour un contrôle composé), `mediaInput`.
- Utilitaires : `h()` (création DOM), `icon()`, `toast()`, `modal()`, `set()/clearError()/setError()` et `showIf`.

### 6.3 Comment les réutiliser

- Ajouter à `field()` (customizer.js:153) de nouveaux `kind` : `choice` (vignettes : `options` avec un petit SVG inline par option, boutons `role="radio"` dans un `role="radiogroup"`), `spacing` (4 champs + lien + unité + onglets d'appareils), `slider` (nombre + unité). Reprendre les classes `kwc-numrow`, `kwc-field`, `kwc-chips` (customizer.css:119, 214).
- Onglets GÉNÉRAL/DESIGN : propriété `tab` portée par chaque contrôle (traverse `publicControl`), et un petit rendu d'onglets dans `renderPanel` (:122) ; liste racine : ajouter une propriété `group:"types"` aux panneaux et un titre de groupe « Types de publication » dans `renderRoot` (:85-114).
- Valeurs par appareil : réutiliser la variable `device` (boutons `[data-device]`) comme appareil actif de l'éditeur de marges (aujourd'hui elle ne sert qu'à dimensionner l'iframe).
- Pour le Page Builder (exception de page) : appeler `KWNumeric.create` depuis une extension de l'onglet « Page » ; pour la boîte 4 côtés, copier `spacingBox` dans un petit fichier `public/js/kw-spacing.js` partagé (hors `page-builder.js`) plutôt que dupliquer deux fois.

---

## 7. Tests existants à connaître

Exécution : `npm test` = `node --test --test-concurrency=1 "tests/*.test.js"` (très lent). Lancer un fichier : `node --test tests/<fichier>.test.js`. Les fichiers `*-navigateur.test.js` exigent Playwright/Chrome et sont ignorés sans. Aides : `tests/marketing-helpers.js`, `tests/helpers.js`, `tests/helpers-editeur-navigateur.js`, `tests/widgets-helpers.js`.

Personnalisateur :
- `tests/personnalisateur.test.js` : brouillon, aperçu, publication, versions PAR SITE sur vraies routes ; couleurs, typo, identité, mise en page, CSS ; conflit de version ; permissions ; isolation A/B/principal ; publication vérifiée dans le moteur ET dans le rendu public.
- `tests/personnalisateur-etendu.test.js` : arrière-plan, images, champs, h4-h6, boutons, points de rupture, transitions ; bout en bout.
- `tests/personnalisateur-complet.test.js` : valeurs par appareil, mode sombre, palette, composants d'en-tête/pied, publication planifiée, lien d'aperçu partageable.
- `tests/personnalisateur-etendu-navigateur.test.js`, `tests/personnalisateur-complet-navigateur.test.js` : même matière dans un vrai Chrome (sélection directe, appareils, brouillon/publication/annulation, clavier, téléphone, lecture seule, isolation).
- `tests/personnalisation*.test.js` (`personnalisation`, `-ciblee`, `-themes` et leurs variantes `-navigateur`) : personnalisation par élément et par thème (manifestes de thèmes paquets) ; à relire avant de toucher `ALWAYS`/`catalog()`.
- Contrôler aussi toute assertion sur la liste des panneaux (grep `panels` dans les trois premiers fichiers) avant d'ajouter un panneau.

Réglages du site / rendu :
- `tests/site-web-reglages.test.js`, `tests/site-web-reglages-theme.test.js` (arrière-plan, mise en page, points de rupture, CSS ; valeur enregistrée relue, page PUBLIÉE et canevas), `tests/site-web-reglages-navigateur.test.js`, `tests/site-web-reglages-ecrans-navigateur.test.js`.
- `tests/reglages-lecture.test.js`, `tests/ecriture-reglages.test.js`.

Rendu et cycle de vie des pages :
- `tests/cms-pages.test.js` (créer → éditeur → enregistrer → aperçu → publier → dupliquer → corbeille, sites multiples), `tests/moteur-pages.test.js`, `tests/moteur-pages-unitaire.test.js`, `tests/moteur-pages-navigateur.test.js`, `tests/registre-pages.test.js`, `tests/creation-page-contexte-site.test.js`, `tests/pages-01-liste.test.js`, `tests/pages-02-nouvelle-page.test.js`, `tests/nouvelle-page-boite-commune.test.js`, `tests/etape3-pages.test.js`, `tests/marketing-pages-atterrissage.test.js`.
- Format de page : `tests/format-mise-en-page.test.js` (persistance brouillon/publication/version, CSS, verrouillage), `tests/format-mise-en-page-navigateur.test.js`, `tests/layout-priorite-css-navigateur.test.js`, `tests/layout-parite-canevas-publie-navigateur.test.js`, `tests/layout-apercu-immediat-navigateur.test.js`.
- Responsive : `tests/programme22-8-responsive.test.js`, `tests/programme22-8-responsive-navigateur.test.js`, `tests/palier14-responsive-navigateur.test.js`, `tests/responsive-*.test.js`.
- Isolation : `tests/isolation-des-sites.test.js`, `tests/isolation-des-sites-caches.test.js`, `tests/palier12-isolation-composants.test.js`, `tests/responsive-isolation-navigateur.test.js`.
- Theme Builder : `tests/theme-builder-page-individuelle-100.test.js` (100 modèles : distincts, valides, « Utiliser » → éditeur → publication → site public → isolation), `tests/theme-builder-page-individuelle-navigateur.test.js` (contrôle visuel 1280/820/390 px, H1 présent), `tests/theme-builder-rendu.test.js`, `tests/theme-builder-contexte-rendu.test.js`, `tests/theme-builder-barre-laterale-personnalise.test.js` (barre latérale SOUS le contenu), `tests/theme-builder-stockage.test.js`, `tests/theme-builder-article-individuel*.test.js`.
- Widgets : `tests/apparence-widgets.test.js` (assertion exacte des zones, :51), `tests/apparence-widgets-navigateur.test.js`, `tests/site-widgets.test.js`.

---

## 8. Plan d'implémentation minimal recommandé

Ordre proposé (chaque étape est testable seule ; scope « site » uniquement dans cette première version).

1. `src/marketing/pages/pageSingle.js` (NOUVEAU) : constantes (mises en page, styles, bornes, unités), `normalize(input, {strict})` (global ET exception de page : mêmes champs, exception = champs optionnels), `css(global, page, breakpoints)` qui produit le CSS (conteneur, colonne, marges par appareil via `breakpointsOf`). Un fichier neuf limite les conflits avec les autres sessions.
2. `src/marketing/pages/siteSettings.js` : ajouter `pageSingle` à `DEFAULT_SETTINGS` (:19), l'appeler dans `normalizeSettings` (avant :200), et brancher `pageSingle.css` dans `layoutCss` (:207). Mettre à jour `DEFAULT_SETTINGS` dans les tests qui comparent l'objet entier.
3. `src/marketing/pages/index.js` : `normalizeTheme` (:27) accepte `single` ; (optionnel) renvoyer un drapeau « modèle `single_page` appliqué » depuis `themeSingleSections` (:995).
4. `src/marketing/landing/index.js` : ajouter l'exception de page au tableau `nodeCss` (:434) avec les points de rupture déjà lus (:427-433).
5. `views/marketing-public/landing.ejs` : classe `kw-kind-page` sur `<body>` (:30), bloc titre conditionnel (avant `_sections`, :39), grille avec `<aside>` `widgetZoneFor(wzId,"sidebar")` quand la colonne ≠ « sans » ; `public/css/landing.css` : styles de base de la grille et de `.kw-page-title`.
6. `src/marketing/widgets/catalog.js` : description de la zone `sidebar` mise à jour (sans changer les clés).
7. `src/services/customizer.js` : (a) importer les contrôles depuis un petit module `src/services/customizerPageSingle.js` (NOUVEAU, une ligne d'appel dans `customizer.js`) pour éviter de gonfler ce fichier ; (b) nouveau panneau (id par ex. `type-page`) avec groupe `types` ; (c) ajouter ce panneau à `ALWAYS` (:245) ; (d) étendre `coerce`, `diffAgainst` (:435) et `valuesOf` (:455) pour les types `choice` et `spacing` (objet) ; (e) `UNSUPPORTED.principal` : mention « Types de publication ».
8. `public/js/customizer.js` : `renderRoot` (groupe « Types de publication »), `renderPanel` (onglets GÉNÉRAL/DESIGN via `c.tab`), `field()` : kinds `choice` (vignettes), `spacing` (4 côtés liés, unité, appareils via `device`), slider avec unité ; `public/css/customizer.css` : styles associés.
9. `public/js/page-builder.js` (onglet « Page ») : interface d'exception de page écrivant `content.theme.single` (patron `setLayout`, :7196-7232), idéalement avec le module partagé `public/js/kw-spacing.js` extrait de `spacingBox` (:3566). Peut être livré dans un second lot.
10. Tests (nouveaux fichiers, ne pas surcharger les existants) : `tests/personnalisateur-page-individuelle.test.js` (validation stricte, brouillon, aperçu, publication, rendu public, isolation A/B/principal, priorité page > global > défaut, absence d'effet sur `landing`/`step`, pas de double H1 avec un modèle `single_page`), `tests/personnalisateur-page-individuelle-navigateur.test.js` (onglets, vignettes, liaison des 4 côtés, appareils). Relancer au minimum : `personnalisateur`, `personnalisateur-complet`, `site-web-reglages-theme`, `format-mise-en-page`, `apparence-widgets`, `theme-builder-page-individuelle-100`, `theme-builder-rendu`.

Points de décision à trancher avec le propriétaire du produit avant de coder :
- accueil (`home_page_id`) inclus ou non dans « Page individuelle » ;
- sémantique exacte de « alternative » pour la colonne ;
- priorité entre `theme.layout` (Format guidé) et le réglage de conteneur ;
- principal : hors périmètre v1 (voir §0.3) ou extension de `appearance_configs` (plus invasif).

---

## 9. Risques et collisions

Autres sessions sur `main` : travaux Theme Builder `single_post` / `single_page` (`src/themeBuilder/catalog/single_page.js`, `src/themeBuilder/catalog/single_post/`, `single_post.js`, `themeBuilder/render.js`, `themeBuilder/types.js`). Zones de contact avec cette fonctionnalité :

- `src/marketing/pages/index.js` (`themeSingleSections` :995, `withSiteParts` :961, `normalizeTheme` :27) : fichier partagé de 1200+ lignes ; modifier au plus 2 endroits, avec de petits commits, rebaser souvent.
- `src/themeBuilder/render.js` (`singleFor` :102, `extrasFor` :72) : ne PAS le modifier ; si un drapeau « modèle appliqué » est nécessaire, le calculer dans `themeSingleSections` côté pages.
- `views/marketing-public/landing.ejs` (55 lignes, lignes très longues) : conflits de fusion probables si une autre session y touche (en-tête collant, pied unique) ; intervenir par ajouts localisés.
- `src/services/customizer.js` et `public/js/customizer.js` : d'autres chantiers (catalogues Theme Builder, thèmes paquets) y ajoutent des réglages ; isoler le nouveau code dans des modules neufs (§8, étapes 1 et 7).
- Titres : un modèle `single_page` contient déjà `{{post.title}}` en H1 ; sans garde, la « zone de titre » créerait deux H1 (accessibilité/SEO) ; les tests `theme-builder-page-individuelle-navigateur` vérifient précisément « H1 présent » par modèle.
- Colonne latérale : la zone `sidebar` est PARTAGÉE avec le blog ; activer une colonne sur les pages affichera les mêmes widgets que le blog (acceptable, à documenter). Une nouvelle zone casserait `apparence-widgets.test.js:51`.
- Portée trop large du CSS : sans la classe `kw-kind-page`, `layoutCss` toucherait les landing pages, étapes de tunnel et modèles Theme Builder du site (`wrapHtml` de themeRender.js émet aussi un `.lp-main`). Les modèles Theme Builder rendus par `themeRender.wrapHtml` (blog, archives, 404) ne passent pas par `landing.ejs` : ils ne doivent pas être affectés.
- Pages du principal : rendues sans `lp-site` ni jetons ; toute règle `.lp-site ...` n'a aucun effet pour elles. Ne pas promettre la fonctionnalité au principal en v1.
- `normalizeSettings` supprime les clés inconnues : oublier `DEFAULT_SETTINGS`/`normalizeSettings` = réglage « enregistré » puis perdu à la publication (le test de relecture doit passer par la base, pas seulement par la réponse API).
- Sites à thème paquet : oubli de `ALWAYS` = rubrique invisible pour ces sites (cas de 70 thèmes).
- Contrôles de type objet : oubli de `diffAgainst` = brouillon toujours « modifié » (`[object Object]`) ou jamais détecté.
- Écart de bornes déjà présent (contentWidth 320 côté contrôle vs 480 côté moteur) : aligner les nouvelles bornes dès le départ.
- Performance : tests lents et machine chargée ; lancer les fichiers un par un, éviter `npm test`.
- Publication : `publish()` refuse si `base_rev !== live.revision` ; toute session qui publie par ailleurs (Apparence → Styles, Réglages du site) invalide les brouillons du personnalisateur : comportement existant, à ne pas contourner.
