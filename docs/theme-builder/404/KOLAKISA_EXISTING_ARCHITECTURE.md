# Architecture existante de la catégorie « Page 404 » de Kolakisa

> Audit du 2026-11-08, code de `main` (lecture seule + exécution de tests existants et de mesures). Les affirmations « confirmé » sont vérifiées dans le code ou par exécution ; « non vérifié » est dit explicitement.

## 1. Le catalogue actuel (code, pas de données)
- `src/themeBuilder/catalog/not_found.js` (78 lignes) : **20 archétypes × 5 traitements = 100 entrées** (`entries()`, l. 70). Clé = `<archétype>.<traitement>` (ex. `humour.centre`). Traitements : centré, scindé, éditorial, bandeau, carte. Identité (skin) : `SKIN_ORDER[(i + décalage) % 5]`, soit 5 skins × 20 entrées (`kit.js:7-16`, couleurs en grande partie en jetons du site).
- API : `types()`, `entries(type)` (mémorisé), `list(type,{q,tag,skin,layout,page,limit})` (24 par page par défaut, 60 max), `find`, `build(type,key,env)` (mise en cache, 300 entrées), `thumbDoc`, `stats()` (`catalog/index.js:19-85`).
- Aides de composition `k.*` (`kit.js`) : `row col band inner section card grid loop spacer divider H L T B LINK logo siteTitle menu search account social dyn img W`.
- Aperçus et vignettes : `src/marketing/web/themeBuilder.js:186-216` — `/miniature` (SVG schématique), `/apercu` et `/vignette` (rendu réel via `themeRender.previewDoc`, vignette en cache 2 minutes). Interface : `public/js/theme-builder.js` (liste 24/page, filtres : texte, identité, mise en page ; vignettes chargées à la demande).

## 2. Données et indépendance (confirmé par le code)
- « Utiliser » un modèle (`catalog/use.js:17-31`) : une **copie profonde** des sections est écrite dans `mk_landing_pages` (`kind:"page"`) et un `mk_tb_templates` en **brouillon** est créé ; rien n'est publié (publication = route séparée `POST /modeles/:id/publier` avec `{replace:true}`).
- **Aucune clé de catalogue n'est conservée pour un modèle 404** (`legacy_ref` ne sert qu'à l'import d'anciens réglages ; `origin_key` n'est posé que pour les pieds de page ; « revenir au modèle initial » est refusé hors en-tête/pied).
- Conséquence : **remplacer le catalogue ne touche pas les 404 déjà utilisées** par les sites ; elles gardent leur copie et leur rendu. Seules les anciennes clés cessent d'être trouvables via `find` (précédent : le test vérifie déjà que cinq anciennes clés ont disparu).
- Non vérifié : si l'export portable (`portable.js`) ou des marqueurs embarquent des clés de catalogue (recherche textuelle : rien trouvé).

## 3. Routage et statut HTTP (confirmé)
Ordre dans `server.js` : rattachement du site par domaine (`attachSite`, l. 71-77) → journal 404 → **redirections gérées** → isolation → permaliens → routage du site → repli « ancien slug → 301 » (l. ~129-136) → routeurs (l. 138-168) → **gestionnaire final** (l. 195-203).
- Gestionnaire final : site retiré → 404 neutre (l. 196) ; site du domaine → `renderRegion(…,"not_found")` puis `res.status(404).render("error", …)` (l. 198) ; site principal : idem (l. 200). **`res.status(404)` est posé avant le rendu dans tous les cas** (modèle trouvé, absent, ou rendu en erreur → repli sur l'erreur par défaut, toujours 404). Aucun chemin retournant 200 n'a été trouvé.
- Choix du modèle : `TB.pickRegion` → `Res.resolve` ; il faut `site_id` correspondant, `status='published'`, non archivé ; une exclusion qui correspond gagne ; les inclusions sont en OU ; sans inclusion = tout le site (score 10) ; condition `not_found` = score 50 ; départage : score, date de publication la plus récente, id le plus petit.
- Le site vient **uniquement du domaine** (`req.kwSite`), jamais de la requête (`siteHost.js:41-47`).
- Tableau des situations :

| Situation | Statut | Modèle utilisé |
|---|---|---|
| URL inconnue, site principal ou domaine de site | 404 | modèle `not_found` du site, sinon page d'erreur neutre |
| Site sans page d'accueil publiée | 404 | page neutre « pas encore publié » (**modèle masqué**) |
| Page brouillon / non publiée (`/p/x`, `/x`) | 404 | erreur simple, **sans** modèle 404 |
| Article, catégorie, étiquette, auteur inconnus | 404 | erreur simple, **sans** modèle 404 |
| Produit, catégorie boutique inconnus, boutique fermée | 404 | erreur simple, **sans** modèle 404 |
| Chemin réservé au site principal sur un domaine de site | 404 | réécrit vers `/__introuvable__` → gestionnaire final avec modèle |
| Méthode non-GET sur ces chemins | 404 texte brut | aucun |
| Domaine de site archivé/supprimé | 404 | neutre, sans modèle |
| Domaine inconnu | 421 texte brut | aucun |
| Ancienne adresse (historique d'URL) | 301 | redirection |
| Redirection gérée | 301/302/307/308 ou 410 | avant toute page |
| URL mal formée | 400 ou 404 | erreur |

- SEO : `noindex` confirmé (balise + `X-Robots-Tag` sur domaines de site ; test `cms-urls.test.js:309-315` sur le site principal). Sitemap : ne liste que le contenu publié, hors pages noindex, hors pages-modèles, hors adresses redirigées (`seo/sitemap.js`). **Canonical sur les 404 : non vérifié.** Soft 404 : aucune réponse 200 « introuvable » trouvée, recherche non exhaustive (flux sociaux, RSS non vérifiés).

## 4. Éléments disponibles dans le moteur (mesuré)
`NODE_TYPES` : **159 types** (structure, texte, média, interaction, dynamique, commerce, avancé, marketing dont **45 `motion*`**, `lottie`, `marquee`, `countdown`, `testimonial`, `signupform`, `shop*`, `html`/`embed`…). Extensible par `registerWidget`.
Utilisés par les 100 modèles actuels (mesure sur les 100 documents) : container 210, heading 272, stack 178, button 141, text 128, group 120, search 29, querylist 27, link 32, divider 20, posts 12, courselist 10, grid 8, menu 6, account 5. **Aucun** widget image, icône, vidéo, lottie, animation, minuteur ni jeu.

## 5. Diversité mesurée de la bibliothèque actuelle
- 100 modèles, **85 arbres complets distincts**, mais **2 compositions de premier niveau seulement** (85× un conteneur, 15× deux), **29 ensembles de types d'éléments**, **20 archétypes × 5 traitements × 5 identités**. Le test existant exige seulement **≥ 60 arbres distincts** et 5 arbres distincts par archétype.
- Verdict : la diversité actuelle est **réelle dans le texte et les blocs dynamiques, faible dans la composition, nulle dans le média et l'interaction**. C'est exactement ce que la demande veut dépasser.

## 6. Tests existants et état de référence
Exécution du 2026-11-08 sur `main` : `theme-builder-404-bibliotheque`, `theme-builder-couverture-rendu`, `theme-builder-catalogue-public`, `theme-builder-contexte-rendu`, `cms-urls` → **77 tests, 75 réussis, 2 échecs déjà présents sur `main`** (indépendants de ce travail) :
1. « les 100 modèles : l'aperçu et la vignette répondent, rendent le même modèle » : l'aperçu porte `data-kw-demo="1"` sur `<body>` et pas la vignette (ajout récent du démonstrateur d'en-têtes).
2. « en-tête et pied de page de la bibliothèque : ils habillent le blog, un article et la 404 » : l'en-tête attendu (`kw-sitelogo`) n'apparaît pas sur l'accueil du site A.
Le premier concerne directement la catégorie 404 et sera à résoudre en début de chantier (voir RISKS_AND_COMPATIBILITY.md).
Contraintes codées en dur dans le test actuel : 100 modèles, 20 archétypes × 5, 5 identités × 20, cinq anciennes clés disparues, clés `humour.centre`, `corporate.scinde`, `recherche.carte` et leurs titres.
