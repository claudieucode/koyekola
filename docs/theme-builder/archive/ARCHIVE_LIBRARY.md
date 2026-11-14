> **REMPLACÉ par la version 4** : voir `docs/theme-builder/archive-v4/README.md`. Ce document décrit une ancienne numérotation (25 compositions) et reste pour l'historique.

# Bibliothèque « Archive » — 100 modèles à identité indépendante (8 novembre 2026)

Catégorie `archive` du Theme Builder (blog, catégories, étiquettes, auteurs, recherche par date). Remplace la bibliothèque 10 × 10 du commit 03a98517. Contexte, recherche et audit : `PHASE1_AUDIT_ET_CONCEPTS.md`.

## 1. Fichiers
| Fichier | Rôle |
|---|---|
| `src/themeBuilder/catalog/archive.js` | Entrée du catalogue : 100 entrées (une par concept), 100 identités, 25 familles |
| `src/themeBuilder/catalog/archive-lib/concepts.js` | Les 100 concepts : famille, usage, composition, colonnes, image, barre latérale, en-tête, navigation, filtre, palette (fond · encre · accent), polices |
| `src/themeBuilder/catalog/archive-lib/skins.js` | Identité d'un concept : couleurs **fixes**, polices `font.<id>` de la bibliothèque locale, « forme » (8 jeux d'arrondis/filets/casse/densité), garantie de contraste AA |
| `src/themeBuilder/catalog/archive-lib/compose.js` | 25 compositions de page + fiches d'article + en-têtes + barres latérales + filtres |
| `src/themeBuilder/catalog/index.js` | Modes d'identité (`own` / `site` / `hybrid`), clé de cache par mode |
| `src/themeBuilder/catalog/use.js`, `src/marketing/web/themeBuilder.js` | Paramètre `identite` à l'insertion (`POST …/bibliotheque/utiliser`) et à l'aperçu (`?identite=`) |
| `scripts/audit-archives.js` | Audit statique (sans serveur) |
| `tests/theme-builder-archives-bibliotheque.test.js` | Tests unitaires + serveur réel |

Aucun second moteur de rendu : les modèles sont des documents du Page Builder (grammaire fermée `nodes.js`), rendus par `themeRender.renderRegion` comme avant. Aucune migration de base de données.

## 2. Identité graphique indépendante
**Constat de départ** : les 100 anciens modèles utilisaient les jetons du site (1 155 couleurs `token:*`, 661 polices « site »), donc prenaient la charte du site (par défaut la charte Kolakisa). Les en-têtes et pieds de page avaient déjà des identités à valeurs fixes (`catalog/identities.js`) ; le même mécanisme (`ownSkins`) est appliqué ici.

| Mode (`identite`) | Effet à l'insertion | Vérifié par |
|---|---|---|
| `own` (défaut) | Couleurs et polices **fixes** du modèle. Une modification de la charte du site ne change rien. | `audit-archives.js` (0 jeton sur 100), test serveur « bleu marine → beige/noir » |
| `site` | Les valeurs fixes sont remplacées par les jetons du site (`token:background`, `token:text`, `token:primary`, `token:surface`, `token:muted`, `token:on-primary`, polices `body`/`heading`) : le modèle suit la charte. | audit + test serveur |
| `hybrid` | Identité propre ; le kicker de l'en-tête devient le **nom réel du site** (`sitetitle`). | audit |

**Priorité des styles** (de la plus forte à la plus faible) : valeur posée par l'utilisateur sur un élément (`.kw-n-<id>`) > identité du modèle (valeurs fixes) > jetons du site (mode `site`) > défauts du moteur (`:where()`, spécificité 0). Aucun `!important` ajouté.

**Persistance** : l'identité est écrite dans les valeurs des éléments de la copie. Elle est donc conservée à l'enregistrement, au rechargement, à l'aperçu et à la publication, et ne bouge pas quand la charte du site change.

### Limites assumées (non simulées)
- **Le changement de mode se fait en réinsérant le modèle** (une nouvelle copie, avec le mode voulu). Il n'existe pas encore de bouton « passer du mode propre au mode site » *dans l'éditeur* d'une copie existante qui mémorise les personnalisations des deux modes : cela demande un champ d'identité dans le document du modèle et un changement de l'éditeur (fichiers partagés sensibles). Les copies existantes restent intactes (copies indépendantes).
- **Pas de sélecteur de mode dans l'interface** de la bibliothèque : le paramètre existe côté serveur (`identite`) et est testé ; l'interface n'a pas été modifiée.
- **Les feuilles de thème (« packs »)** n'utilisent pas `@layer` : une règle de pack plus spécifique qu'un élément du modèle peut encore passer devant. Non corrigé ici (fichier partagé `landing.css` / packs) ; à mesurer pack par pack.
- Les identités du mode propre ne remplacent pas l'en-tête ni le pied de page du site (volontaire : modèle d'archive seulement).

## 3. Types d'archives et données
Rendu public : `src/routes/blog.js renderList` (inchangé). Familles de modèles : `author_archive`, `category_archive`, `tag_archive`, repli `blog_archive` (+ `search_results` pour `?q=`). Les boucles « suivent l'archive » (`archive: true`) : catégorie (avec sous-catégories), étiquette, auteur. Terme inexistant = vraie 404. Données : titre, description, nombre (`archiveinfo`), articles réels (titre, image, extrait, auteur, date, rubrique, lectures), fiche d'auteur (`authorbox`, visible sur une page d'auteur uniquement), listes réelles de rubriques, étiquettes, récents, plus lus.

| Demandé | État |
|---|---|
| Archive générale, catégorie, sous-catégorie, étiquette, auteur | **Pris en charge** (moteur existant) |
| Archive par date | **Partiel** : `/blog?date=AAAA-MM[-JJ]` filtre la liste, mais le moteur la traite comme « blog » (le modèle `archive.kind = date` n'est jamais sélectionné) et il n'existe pas d'adresses `/blog/2026/11`. Non modifié (route partagée). **À tester/corriger séparément.** |
| Type de contenu / taxonomie personnalisés | **Non pris en charge par le moteur** (seule la boutique a sa catégorie). Aucun faux modèle. |
| Image de catégorie, tri choisi par le visiteur, filtres combinés | **Non disponibles dans les données/le moteur** ; aucun faux contrôle |
| État vide | Message dans chaque boucle (« Aucun article dans cette rubrique… ») ; une catégorie existante sans article répond 200 |

## 4. Navigation, filtres, pagination
Pagination = moteur de requêtes commun (`query.js`) : `numbers`, `prevnext`, `both`, `more` (charger plus), `infinite` (défilement infini géré par `public/js/landing.js`). Répartition sur les 100 concepts : numéros 54 · charger plus 26 · défilement infini 11 · précédent/suivant 9.
Filtres : rubriques = `catfilter` branché sur la boucle (`urlFilter` → `?categorie=`) ; recherche = widget `search` ; étiquettes = liste réelle qui mène aux archives d'étiquette. Le test refuse tout `select`/`tabs` et vérifie que chaque `catfilter` est relié à une boucle.
**Boucles multiples** : les compositions « héros + grille », « une + brèves », « mosaïque »… utilisent une boucle de tête non paginée (articles à la une, toujours les premiers) puis une boucle paginée qui continue après eux (`offset`). La liste du bas ne répète jamais les articles de tête, mais la tête reste identique sur les pages suivantes.

## 5. Compositions (25) — ce que chacune fait réellement
G grille · GA asymétrique (colonne large + colonne étroite) · LI/LD liste image à gauche/droite · LT liste texte seul · IX index daté · GM index daté sur deux colonnes · MO mosaïque (grande + deux à titre superposé + grille) · UB une + brèves · HG héros + grille · V3 trois vedettes verticales + liste · MS sections (à la une, plus lus, tous les articles) · CJ colonnes de journal à filets · TL frise datée · OV cartes à titre superposé · FS images pleine largeur · CR bandes défilantes (carrousel du moteur) · TB tableau titre/rubrique/date · ZZ grandes vignettes à filets · SP écran scindé (titre et filtres collants à gauche) · NU classement par nombre de lectures (tri réel) · CH cartes compactes · TY titres géants · PO mur de fiches cadrées · ST pile d'images.
Onze concepts reçoivent une **variante** de leur composition (table `VARIANT` dans `compose.js`) pour que deux concepts voisins n'aient pas la même structure.

**Écarts avec les intitulés initiaux du plan (honnêtes)** : pas de regroupement automatique par mois (GM = index daté) ; pas de numérotation 1…n (NU = tri par lectures avec compteur de lectures) ; pas de vraie alternance gauche/droite (ZZ) ; pas de fiches inclinées (PO = fiches cadrées) ; pas de maçonnerie ; « titre superposé » obtenu par marge négative (le projet interdit le positionnement absolu).

## 6. Diversité mesurée (`node scripts/audit-archives.js`)
100 documents différents · 100 structures d'éléments différentes · 100 signatures de réglages différentes · 100 palettes différentes · **34 paires de concepts ne diffèrent que d'un seul réglage de structure** (elles se distinguent par la famille, la palette, les polices et la particularité) : limite connue, à retravailler si vous exigez davantage.

## 7. Responsive
Aucun positionnement absolu ; toute ligne flex passe à la ligne ; toute grille de plusieurs colonnes a des réglages tablette (2 colonnes) et mobile (1 colonne) ; barres latérales sous le contenu. Contrôlé par test sur les 100 documents. **Non vérifié visuellement dans un navigateur** à ce stade, voir le rapport de session.

## 8. Remplacement et retour arrière
Le catalogue est du code : remplacer `archive.js` ne modifie aucune ligne en base. Les sites qui ont « utilisé » un ancien modèle ont une **copie indépendante** (page + modèle du Theme Builder) : intacte, avec ses conditions d'affichage. Les anciennes clés (`blog.grille`…) disparaissent du catalogue ; `tests/theme-builder-catalogue-public.test.js` a été mis à jour. **Retour arrière** : revenir au commit précédent (`git revert` du commit de cette branche).

## 9. Risques
Fichiers partagés touchés : `src/themeBuilder/catalog/index.js` (clé de cache + mode d'identité, ajouts seulement), `use.js` (paramètre optionnel), `src/marketing/web/themeBuilder.js` (deux lectures de paramètre). Aucun fichier de rendu, de conditions ou de l'éditeur modifié. Après fusion de `main` : relancer `tests/header-*`, `tests/footer-*`, `tests/isolation-*` (consigne du projet).

## 10. Aperçu : articles d'exemple (ajout)
L'aperçu et la vignette de la bibliothèque affichaient l'état vide (aucun article). Ils affichent maintenant **12 articles d'exemple** (titre, résumé, rubrique, auteur, date, lectures), annoncés par un bandeau jaune « Aperçu avec des articles d'exemple » sur l'aperçu. Mécanisme identique à la boutique (`page.demoShop`) : `page.demoPosts`, posé uniquement par `themeRender.previewDoc` ; `src/marketing/landing/index.js` (`demoPostsResult`). **Jamais sur un site publié.** Aucune image d'exemple : le projet ne sert aucun visuel libre de droits (les adresses `/themes-art/…` testées répondent 404), donc les modèles à grandes images s'aperçoivent sans photo ; ils sont conçus pour rester lisibles sans image (test visuel).

## 11. Résultats réels des vérifications (8 novembre 2026)
| Vérification | Résultat |
|---|---|
| `node scripts/audit-archives.js` | 15 contrôles OK : 100 modèles, 100 documents / structures / signatures / palettes différents, 0 jeton du site en mode propre, polices de la bibliothèque, contrastes AA, limites du moteur (≤ 400 éléments, ≤ 8 niveaux), **validation du moteur du Page Builder : 300/300 documents acceptés** |
| `tests/theme-builder-archives-bibliotheque.test.js` | 16/16 (dont : insertion des 100 modèles dans un site, aperçu = vignette ×100, archive de catégorie paginée, filtre `?categorie=`, état vide, scénario d'identité bleu marine → beige/noir en 9 étapes) |
| Fichiers liés (`catalogue`, `catalogue-public`, `apercu-vignette`, `routes`, `recherche-bibliotheque`) | Au total **67/67 réussis** sur les 6 fichiers lancés |
| Chrome headless (`scripts/verification-visuelle-archives.js`, desktop 1280 / tablette 820 / mobile 390) | **Échantillon de 25 modèles sur 100** (1 sur 4) mesuré : aucun débordement horizontal après correction de 3 défauts trouvés par la mesure ; 9 mesures initiales « indisponibles » (Chrome trop lent) re-mesurées ensuite. **Les 75 autres modèles n'ont pas été mesurés dans Chrome.** |
Défauts réels trouvés et corrigés pendant ces vérifications : 9 modèles dépassaient la profondeur maximale du moteur (8 niveaux) ; valeurs refusées par le moteur (`gap` à deux valeurs, `boxShadow` libre, `clamp()`) ; titres hors écran en tablette (index sur deux colonnes avec barre latérale) ; cartes à titre superposé invisibles sans image ; titres collés au bord des fiches sans rubrique.

### Ce qui n'est pas fait
- 75 modèles non mesurés dans Chrome ; aucune vérification visuelle de la qualité graphique modèle par modèle (je n'ai regardé que quelques captures).
- Pas de sélecteur de mode d'identité dans l'interface ; pas de bascule de mode dans l'éditeur d'une copie existante (voir § 2).
- Archives par date et types de contenu personnalisés : non traités (voir § 3).
- Recherche de marché : démos ThemeForest/TemplateMonster/Creative Market non consultées (voir `PHASE1_AUDIT_ET_CONCEPTS.md` § 1).
- Tests multisite : l'isolation entre sites (site B garde son rendu historique, aucun article d'un autre site) est couverte par le test serveur existant ; non testé : isolation des identités entre deux sites ayant inséré des modèles différents.
