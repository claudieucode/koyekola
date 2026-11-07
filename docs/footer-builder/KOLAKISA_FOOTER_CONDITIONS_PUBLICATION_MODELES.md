# Pied de page : conditions d'affichage, publication, modèles multiples (audit du 7 novembre 2026)

Statuts : OK / partiel / absent. Les « scénarios exécutés » viennent d'un script Node lancé pendant l'audit sur `resolve.js` + `conditions.js` (pur, sans serveur) ; les tests cités sont des suites existantes (résultats donnés quand je les ai relancées).

## 1. Conditions d'affichage

### 1.1 Mécanique
* Un modèle porte `{ include: [...], exclude: [...] }` (JSON validé, schéma fermé : `conditions.js:5-60`). Inclusions en **OU**, critères d'une condition en **ET**, une **exclusion** qui correspond **retire** le modèle (`resolve.js:11-22`). Aucune inclusion = « tout le site » (score 10).
* **Précision** (`match.js:13` `scoreOf`) : accueil 90 · enfant direct 80 · enfants 70 · pages précises 100+ · taxonomie/auteur 60 · archive catégorie/étiquette avec noms 60 · 404 50 · recherche 40 · tout contenu individuel 20 · tout le site 10. Le plus précis gagne ; égalité : le plus récemment publié, puis le plus petit identifiant (`resolve.js:25`). Les limites : 20 règles, 50 valeurs, 80 caractères.
* Maximum **200 modèles par site** (`store.js:11`).

### 1.2 Types supportés vs liste demandée
| Demandé | Kolakisa | Statut | Preuve |
|---|---|---|---|
| Tout le site | `site` | **OK** | `conditions.js:9` |
| Accueil | `front_page` | **OK** | scénario : l'accueil prend le pied « accueil » |
| Pages | `page` (+ `ids`, `author`) | **OK** | scénario |
| Pages précises | `page` avec `ids` | **OK** (identifiants numériques saisis à la main dans le dialogue ; le dialogue propose seulement des exemples) | `public/js/theme-builder.js:326` |
| Enfants d'une page | `child_of` (direct ou tous) | **OK** | `conditions.js:14` |
| Articles | `post` (+ identifiants, catégorie, sous-catégorie, étiquette, auteur) | **OK** | scénario : article « News » → pied articles ; article « Promo » exclu → pied général |
| Archives | `archive` (sous-types blog, catégorie, étiquette, auteur, date, recherche) | **OK**, **date sans effet** (pas d'archives par date dans le blog) | `ELEMENTOR_THEME_BUILDER_PARITY.md` l.8 |
| Catégories / étiquettes | `archive` sous-type + `names`, option « inclure les sous-éléments » | **OK** | scénario catégorie « Promo » → pied dédié |
| Recherche | `search` / `archive` sous-type recherche | **OK** | scénario |
| 404 | `not_found` | **OK** | scénario |
| Types de publication personnalisés | **absent** | Kolakisa n'a pas de types de contenu libres ; `custom` (condition programmée par le code serveur) existe mais **aucune n'est enregistrée** (`registerCondition` jamais appelé hors définition) | recherche dans `src` |
| Boutique | `product_archive` (sous-types boutique, catégorie, étiquette, recherche) | **OK** (logique) | scénario ; mais voir 1.3 |
| Produit | `product` (+ catégorie, étiquette, auteur) | **OK** (logique) | scénario |
| Compte client | **absent** | aucune « vue » compte/panier/commande dans `Types.VIEWS` (`types.js:5`) | idem parité l.13 |
| Utilisateur connecté, rôle, langue, appareil, date/heure, provenance | **absent** | — | seul un horaire par **élément** existe (`schedule`, `nodes.js` normalizeSchedule), pas par pied |
| Inclusions / exclusions | **OK** | `conditions.js` | tests `theme-builder-noyau` 14/14 et `theme-builder-regles` 12/12 (exécutés) |
| Conditions multiples (OU) | **OK** | `resolve.js:20` | — |
| Contenu précis mais « inclure + exclure » identiques | refusé à l'enregistrement | « Une condition ne peut pas être à la fois incluse et exclue » (`conditions.js` normalize) | — |

Scénarios exécutés (4 pieds publiés : général, accueil, articles hors « Promo », archive catégorie « Promo ») :
accueil → pied accueil ; page → général ; article « News » → articles ; article « Promo » → général ; archive « Promo » → archive ; recherche → général ; 404 → général ; produit → général ; boutique → général.

### 1.3 Où les conditions s'appliquent VRAIMENT à l'affichage (limite importante)
* Le contexte « vue » dépend de la route. Pour les **pages du Page Builder**, `partsFor` ne connaît que accueil (`front`) et page (`render.js:85-97`). Pour les pages « habillées » (blog, article, archives, recherche, 404, `routes/pages.js`, formations), `renderRegion` pose la vue réelle (`themeRender.js:85`). Toute autre page (login, compte, panier, liste de formations, etc.) reçoit `defaultContext` = accueil si `/`, sinon page (`render.js:48`).
* **Pages boutique** (catalogue, produit, panier, compte) : elles se terminent par `views/boutique/_bottom.ejs` avec leur propre pied `sh-foot` ; le pied du Theme Builder n'y est pas injecté (`themeFooter` n'est lu que par `partials/footer.ejs` et `site-public-error.ejs`). Donc des conditions « Produit » / « Boutique » sont acceptées mais **n'ont d'effet visible que si la page passe par `partials/footer.ejs`** : non vérifié en exécution, établi par lecture. À tester avant de promettre « pied de boutique ».
* Modèles de pied pour une **formation** (`single_course`) : `renderRegion` n'a pas de famille `course` dans `FAMILY` (`render.js:21-31`) → `regionContext` renvoie `null` → vue par défaut « page ». Conséquence : une condition « Articles » ne s'applique pas aux fiches de formation (attendu), mais il n'existe pas non plus de condition « formation » (la boutique de formations est le cœur de Kolakisa).
* Le simulateur « Pourquoi ce modèle ? » (`GET …/api/resolution`, `themeBuilder.js:141`) reproduit la résolution pour n'importe quelle vue, **y compris celles qui n'ont pas de pied visible** : il peut donc annoncer un pied qui ne s'affichera pas (boutique).

### 1.4 Détection de conflits et priorité
* **Bloquant** : deux pieds publiés avec exactement les mêmes conditions (`resolve.js:51-60`, scénario : « blocking:duplicate »). Publication refusée avec message, sauf **« remplacer »** explicite : l'ancien repasse en brouillon (`store.js:125-145`, confirmation dans `theme-builder.js:293`).
* **Avertissement** : deux pieds qui peuvent viser la même page avec la même précision (scénario : « warning:ambiguous ») ; le plus récent gagne. Affiché (« Publié, avec N avertissement(s) »).
* Conservatisme : `condOverlap` peut sur-signaler mais ne rate pas un chevauchement (`resolve.js:41`).
* Cas non détecté : un pied « tout le site » + un autre « Pages » ne sont pas en conflit (précisions différentes) : normal.
* Priorité testée de façon déterministe avec ordre de chargement aléatoire (`KOLAKISA_THEME_BUILDER_PIED_DE_PAGE_CAUSES_RACINES.md`, test `pied-de-page-coherence`, non relancé ici).

## 2. Plusieurs pieds : cycle de vie

| Action | Statut | Preuve |
|---|---|---|
| Créer (nom + type, ou depuis la bibliothèque de 100) | **OK** | `store.js:79`, `catalog/use.js` ; création = **brouillon**, conditions vides (« tout le site ») ; **aucune question sur les conditions à la création ni à la publication** (dialogue `views/marketing/theme-builder.ejs:59-65` : type + nom seulement) |
| Renommer | **OK** (nom unique par site, suffixe « (2) ») | `store.js:97`, `uniqueName` |
| Dupliquer | **OK** (copie du composant + mêmes conditions, en brouillon) | `store.js:171` |
| Supprimer avec confirmation | **OK** en deux temps : Archiver, puis « Supprimer définitivement » avec `confirm()` ; le composant reste dans Composants ; droit `pages.delete` | `store.js:158-170`, `theme-builder.js:286` |
| Archiver / restaurer | **OK** | `store.js:158-165` |
| Brouillon / publier / dépublier | **OK** | `store.js:125,154` ; `unpublish` : le modèle repasse en brouillon, le site retombe sur le pied suivant ou le repli |
| Prévisualiser | **OK** | aperçu du composant tel quel (`force`), annonce « conditions ignorées » ; aussi vignette réelle |
| Réutiliser | **partiel** | duplication + bibliothèque ; pas de « partage de pied entre sites » autrement que par export/import |
| « Où est-il utilisé ? » | **OK** | `instances.js` : énumère les pages du site où CE pied gagne ; dit explicitement ne pas énumérer articles/archives/produits |
| Pastille en ligne / brouillon sur la carte | **OK** | `card()` : `active`, `hasConflict`, `willReplace` |

## 3. Sauvegarde, état non enregistré, historique

| Point | Statut | Preuve |
|---|---|---|
| Sauvegarde automatique | **OK** (éditeur) | brouillon du composant enregistré 1 s après la dernière modification, nouvel essai toutes les 5 s en cas d'échec (`public/js/page-builder.js:8356,8410`) ; copie de secours `localStorage` « pb-backup-<id> » avant fermeture (`pb:8381`) |
| Sauvegarde manuelle | **OK** | `saveNow` `pb:8415` |
| État « non enregistré / enregistré à HH:MM » | **OK** | `setSave(...)` `pb:8401` |
| Protection contre la perte | **OK** | `beforeunload` `pb:8418` ; restauration d'une copie de secours à l'ouverture `pb:8637`. Côté Theme Builder, dialogues avec confirmation avant de quitter si modifiés (`theme-builder.js:241,300`) |
| Conflit d'édition (2 onglets) | **OK** | révision du composant vérifiée à l'enregistrement (409) ; révision du modèle vérifiée à la publication et aux conditions (`store.js:111,128`) |
| Annuler / rétablir | **OK** (session + localStorage, voir doc construction) | `pb:257` |
| Historique / révisions | **partiel** | `mk_tb_versions` : un instantané **à chaque publication** (contenu publié + conditions + nom), **30 conservés**, restauration = remet le contenu en **brouillon** (jamais de mise hors ligne ; les conditions ne reviennent que si le modèle n'est pas publié) `store.js:186-205`. **Pas** de révision à chaque enregistrement (≠ Elementor : une révision par enregistrement, 25 conservées [C], voir `ELEMENTOR_FOOTER_ARCHITECTURE.md` §10) ; pas de comparaison entre versions ; pas d'action « historique des actions » consultable après fermeture |
| Retour au modèle initial | **absent pour le pied** | n'existe que pour les en-têtes installés depuis la bibliothèque (`themeBuilder.js:108-121` : `t.type !== "header"` → refus) ; clé d'origine `libraryKey` stockée seulement sur l'en-tête |

## 4. Import / export (`portable.js`)

* Format fermé `kolakisa-theme-template@1`, 2 Mo max (`portable.js:8`). Export : `GET …/modeles/:id/export.json` ; import : `POST …/importer` avec `payload`.
* L'export **retire** les identifiants propres au site dans les conditions (`ids`, `author`, `parent`) et le dit dans `notes` (`portable.js:11-19`) ; le document est celui du composant (`section`).
* À l'import : type et document revalidés (le composant repasse par la grammaire du Page Builder via `createComponent`) ; le modèle est créé **en brouillon** avec les conditions nettoyées (`importTemplate` → `store.create`, statut `draft`). Pas de code exécutable conservé.
* Manques / vigilance : (1) ni `.zip` ni lot de plusieurs modèles ; (2) un `signupform` garde le numéro de formulaire du site d'origine : il est revalidé seulement contre l'organisation (`nodes.js:845`), donc il peut pointer vers un formulaire d'un autre site de la même organisation ; (3) images conservées par adresse (`imageUrl` valide la forme, pas l'appartenance : `sections.js:32`) ; (4) pas d'export des **réglages du site** utilisés par le pied (menus, identité) ; (5) l'export du pied n'inclut pas la version diffusée si elle diffère du brouillon (`section` = version publiée) — non vérifié en exécution.

## 5. Options avancées demandées

| Option | Statut | Remarques |
|---|---|---|
| Barre inférieure (copyright/légal) | **partiel** | simulée par une rangée dans la composition (`BAR`) ; pas d'objet « barre inférieure » avec réglages propres ; ligne légale automatique (cookies/confidentialité) ajoutée **uniquement** sur le chemin A (pages Page Builder) |
| Sous-sections / colonnes | **OK** | rangées et colonnes du catalogue |
| Bouton retour en haut | **absent** | voir inventaire |
| Éléments fixes (sticky) | **partiel** | conteneur sticky possible, aucun comportement de pied |
| Visibilité conditionnelle par élément | **OK** | `hideOn` par écran, `schedule` par dates, audiences visiteur (`AUDIENCES` `nodes.js`) ; pas de condition « connecté / rôle » au niveau du pied |
| Image / vidéo de fond | **OK** | image, diaporama, vidéo mp4/webm avec image de secours et pause en mouvement réduit |
| Séparation visuelle (filet, forme) | **OK** | `rule` du catalogue (fin, accent, épais, double), `shapes` |

## 6. Le bouton « Publier » applique-t-il réellement les conditions ?

**Oui, mais sans les demander.** Détail vérifié :
1. « Publier » (carte du Theme Builder) appelle `store.publish`, qui **ne modifie pas** les conditions : il publie le composant, enregistre une version, passe le modèle à `published` (`store.js:125-152`).
2. Les conditions sont **évaluées à chaque affichage** à partir de la ligne `mk_tb_templates` (`render.js:51-56`, `resolve.js:11`), donc elles s'appliquent dès la publication. Preuve : tests `theme-builder-pied-unique` (4/4 exécutés : pied avec exclusion de la page « Exclue » → présent ailleurs, absent sur la page exclue) et `theme-builder-pieds-bibliotheque` l.143 « publication et conditions ».
3. Par défaut (création sans conditions) un pied publié s'affiche sur **tout le site** ; il n'y a **pas de fenêtre « Où afficher ? » à la première publication** (Elementor en ouvre une [C]). Le bouton « Conditions » est séparé (`theme-builder.js:128`). Risque produit : publier un pied de test « partout » par inadvertance (atténué : refus si doublon exact + confirmation de remplacement).
4. Si le modèle est **déjà publié** et qu'on modifie les conditions, elles s'appliquent immédiatement (il n'y a pas de brouillon de conditions) ; un doublon exact est refusé à ce moment-là (`store.js:114-117`).
5. « Mettre à jour » dans l'éditeur (composant) : republie le contenu ; l'état du modèle reste géré dans le Theme Builder (stabilisation, limites).
6. Conditions qui n'ont pas d'effet visible aujourd'hui : voir 1.3 (boutique/compte/fiche formation).

## 7. À retenir pour la reconstruction
* Ajouter une étape « Où afficher ce pied ? » à la première publication (reprendre `conditions()` du tableau de bord).
* Rendre les vues réelles disponibles au rendu des pages Page Builder (article/archive via leurs routes déjà couvertes ; boutique/compte/formation à créer).
* Révisions : décider d'une version par enregistrement (comme Elementor) ou garder « par publication » et le documenter à l'utilisateur.
* Conserver `mk_tb_templates`/`mk_tb_versions`, `legacy_ref`, et le format `kolakisa-theme-template@1` (compatibilité des exports déjà produits).
