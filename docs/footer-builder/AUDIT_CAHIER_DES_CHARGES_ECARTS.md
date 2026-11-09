# Audit du Footer Builder Kolakisa face au cahier des charges (11 points)

Date : 8 novembre 2026. Audit en **lecture seule** : aucun code, aucun test, aucune migration, aucun modèle n'a été modifié ni supprimé. Dépôt : branche `audit-footer` (copie de `main` à jour).

## Ce qui est vérifié par exécution, et ce qui ne l'est pas

**Vérifié par exécution (cette session)** :
- chargement du catalogue par code : nombre, ids, noms, familles, widgets, rangées, colonnes (tableau complet dans CATALOGUE_ACTUEL_INVENTAIRE.md) ;
- empreintes structurelles et similarité des 100 modèles (script d'audit, sections 2) ;
- relance de 34 fichiers de tests, un à un : 381 réussis, 2 échoués (échecs d'en-têtes déjà connus), 3 fichiers sans exécution (Chrome/Playwright) (section 4) ;
- **300 mesures Chrome réelles** (100 modèles × 3 largeurs 390 / 820 / 1280 px) sur les vraies routes d'aperçu d'un vrai serveur de test, avec mesure de débordement, chevauchement, éléments hors écran, texte coupé, erreurs JavaScript, largeur pleine ;
- 10 captures d'écran regardées une par une (7 modèles, 390 et/ou 1280 px ; 24 captures enregistrées au total hors dépôt) ;
- 3 insertions réelles de modèles dans une base locale de test + 9 requêtes SQL de contrôle ;
- 6 affirmations sur Elementor recherchées sur le web.

**Non vérifié** : la base de production (aucun accès) ; l'utilisation à la main dans un navigateur par un humain ; le lecteur d'écran ; les performances chiffrées ; les 300 autres mesures « avec données d'entreprise renseignées » du rapport précédent (je n'ai mesuré que le cas « site sans données ») ; les largeurs 600, 1024, 1440, 1920 px ; les 100 captures (j'en ai regardé 10, pas 100).

## 1. État réel en bref

| Question | Réponse | Preuve |
|---|---|---|
| Combien de modèles ? | **100 exactement** | `Catalog.entries("footer").length` = 100 |
| Ids et noms uniques ? | **Oui : 100 ids, 100 noms** | exécution |
| Combien de familles ? | **10 familles de 10** (pas les 15 demandées) | `FAMILIES` dans `catalog/footer.js` |
| Modèles structurellement distincts ? | **99 empreintes sur 100** (une paire identique) ; 97 si l'on ne compte que l'arbre des types. 11 paires ≥ 90 % de ressemblance ; **36 modèles ont un voisin ≥ 85 %** | section 2 |
| Vignette / aperçu viennent de la vraie structure ? | **Oui**, aucune image pré-générée | section 3 |
| Tests relancés | 34 fichiers : 381 tests réussis, 2 échoués (catalogue d'en-têtes, déjà connus), 3 fichiers non exécutés ; les 8 suites footer : 184 / 184 | section 4 |
| Mesures Chrome | **300 mesures : 0 débordement, 0 chevauchement, 0 hors écran, 0 texte coupé, 0 erreur JavaScript, 100 % pleine largeur** | section 5 |
| Reconstruction nécessaire ? | **Non** : enrichissement ciblé (ETAPES_PROPOSEES.md) | |

## 2. Inventaire et distinction structurelle (point A)

**Comment le catalogue est construit.** C'est du **code** (`src/themeBuilder/catalog/footer.js`, 386 lignes) : 10 familles × 10 « compositions » décrites par une petite grammaire (rangées C = colonnes, L = deux zones, T = trois zones, Z = pile centrée). Chaque modèle a une **identité visuelle propre** (palette + polices ; 33 identités). Identifiant = `composition.identité` (ex. `trois-colonnes-marque.marque`). Le document est construit **à la demande** et gardé dans un cache mémoire de 300 entrées (`catalog/index.js`). **Un seul registre** pour la bibliothèque du Theme Builder. Les anciennes clés (catalogue 20 × 5) ont été supprimées au chantier précédent (test 404). **Autre catalogue séparé** : 24 composants « pied de page » de la bibliothèque du Page Builder (`libraryComponents.js`), qui ne passent pas par la bibliothèque du Theme Builder.

**Familles déclarées vs familles demandées.**

| Famille demandée | Modèles réellement dédiés aujourd'hui |
|---|---|
| Minimalistes | 10 (famille « Minimal ») |
| Corporate | ~5 (famille « Entreprise », 4 corporate-*) |
| E-commerce | 10 (famille « Boutique ») |
| SaaS / tech | 4 (saas-*) |
| Éditoriaux / magazines | 10 |
| Créatifs / portfolios | 10 |
| Communautés / réseaux sociaux | 10 (famille « Réseaux ») |
| Services / prestations | ~4 (famille « Contact » en partie) |
| Landing pages | ~3 (centre-abonnement, newsletter-compacte…) |
| Éducation / formation | **1** (boutique-formations) |
| Restaurants / hôtellerie | **1** (horaires-et-carte) |
| Immobilier | **0** |
| Finance / juridique | **0** |
| ONG / associations | **0** |
| Institutionnels | **0** |

(Comptage par lecture des noms et descriptions : jugement, pas test automatique.)

**Distinction structurelle (calculée).** J'ai construit pour chaque modèle l'arbre complet (types de nœuds, ordre, sens et poids des colonnes, alignement, propriétés clés des widgets) **sans couleurs, polices ni textes**, puis comparé :
- empreintes distinctes : **99 / 100** (97 / 100 avec l'arbre des types seul) ;
- paire identique : `trois-colonnes-marque.marque` = `colonnes-et-barre-alternee.doux` ;
- paires identiques en types seuls (diffèrent seulement par un réglage de style : cartes, centrage, fond) : `colonnes-centrees.nuit` ~ `colonnes-en-cartes.clair` ; `newsletter-blog.marque` ~ `blog-abonnement-et-rubriques.clair` ;
- similarité maximale entre deux modèles différents : **0,94** (`coordonnees-bandeau-couleur` ~ `boutique-bandeau-appel`) ; 11 paires ≥ 0,90 ; 78 paires ≥ 0,80 ; **36 modèles** ont un voisin ≥ 0,85 ;
- le test existant (`≥ 98 structures différentes`) accepte donc jusqu'à 2 doublons : son seuil est cohérent avec ce que je mesure, mais le titre « 100 compositions DISTINCTES » est un peu généreux.
Le rapport précédent a donc raison sur le fond : pas de simple recoloration en masse. Mais la **diversité réelle est plus faible que 100** : beaucoup de modèles sont « 3 colonnes marque / navigation / contact + barre du bas » avec de petites variantes.

**Lecture à la main de 8 modèles** (7 vus en capture et lus dans le code, 1 lu dans le code) (contenus, hiérarchie, connexions) :
1. `trois-colonnes-marque.marque` : propre, titres + menu du pied + « Nous écrire » ; **le texte de présentation est un texte d'exemple** (« Décrivez en une ou deux phrases… ») ; coordonnées : invisibles tant que le site n'a pas de données d'entreprise (colonne « Contact » presque vide, voir captures).
2. `newsletter-bandeau-couleur.doux` : très beau bandeau, mais **« S'inscrire » n'existe pas** : un bouton « Nous contacter » (sans formulaire du site) ; titre centré, bouton calé à gauche du bloc (légère désaxe, visible en capture).
3. `boutique-quatre-colonnes.clair` : bonne hiérarchie ; paiements et livraison **ne s'affichent que si les données d'entreprise existent** ; « Mon compte » et « Panier » sont en plus gros que les autres liens (incohérence de taille visible). « Acheter » : deux liens fixes (/boutique, /catalogue), **pas de catégories de produits**.
4. `saas-produit-ressources.editorial` : colonnes « Produit » et « Ressources » **affichent le même menu** (Accueil / Services / Blog / Contact deux fois) : étiquettes sans contenu propre ; icônes de réseaux **minuscules**.
5. `accordeons-mobile.nuit` : seuls « À propos » et « Nous joindre » sont repliables, **sur toutes les largeurs** (pas seulement mobile) ; les navigations ne sont pas repliées. C'est le **seul** modèle avec accordéon.
6. `carte-a-droite.doux` : carte Google réelle (centrée sur « France » par défaut : à régler) ; colonne gauche très vide sans données d'entreprise.
7. `centre-presentation.marque` : le plus abouti sur mobile (logo, texte, menu, réseaux, copyright centrés).
8. `newsletter-carte-centree.nuit` : lu dans le code seulement (non vu en capture) : titre, texte et bouton « Nous contacter » centrés ; même remarque que le n°2.
Jugement : **qualité visuelle correcte et cohérente** (alignements propres, pas de débordement) ; **contenus génériques** ; **plusieurs blocs sont conditionnels aux données d'entreprise**, donc les modèles paraissent plus pauvres sur un site vide.

**Widgets utilisés (catalogue, 100 modèles)** : copyright 100, menu 76, logo du site 48, lien 47, liens légaux 39, réseaux 34 (3 à 4 réseaux par défaut), coordonnées 21, boutons 35, retour en haut 23, listes dynamiques 12, paiements 5, livraison 4, horaires 4, carte 4, compte 6, mini-panier 5, recherche 3, téléphone 3, e-mail 1, formation 1, séparateur 2, bascule (accordéon) 1. **Formulaire d'inscription réel : 15 modèles, et seulement si le site possède déjà un formulaire.**

## 3. Vignettes et aperçus (point B)

Trois mécanismes, **tous dérivés du même document du catalogue** (`Catalog.build` / `thumbDoc`) :
- **Vignette de carte** (`.../bibliotheque/footer/<clé>/vignette`) : le **vrai rendu public** du modèle dans un cadre réduit (cache navigateur privé de 2 minutes) ;
- **Aperçu complet** (`.../apercu`) : le même rendu, sans cache ;
- **Miniature filaire** (`.../miniature`, `src/themeBuilder/thumb.js`) : un dessin SVG construit à partir de la structure réelle (types d'éléments, colonnes), **jamais une image fabriquée à part** ; sert de repli.
- « Utiliser ce modèle » copie ce **même** document (`catalog/use.js`) : `build(type, key, {formId})` avec le formulaire du site.
Je n'ai trouvé **aucun mécanisme où une vignette serait fabriquée indépendamment** (aucun fichier image pré-généré). Tests existants : `theme-builder-apercu-vignette`, `theme-builder-vignettes-retour`, `footer-catalogue-widgets` (« aperçu = vignette », « aperçu de la bibliothèque = copie du site = pied publié ») : voir résultats section 4.
**Limite** : ces tests comparent la **liste des éléments**, pas les pixels. Je n'ai pas fait de comparaison pixel à pixel ; le cahier des charges demande « captures de contrôle visuel des 100 vs aperçus » : **non fait** (les 300 mesures sont des mesures de géométrie, pas des comparaisons d'image).

## 4. Tests relancés (point C)

Commande : `TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/<fichier>`, un fichier à la fois, sur la branche `audit-footer` (machine partagée et chargée : durées longues).

| Fichier | Code | Réussis | Échoués | Ignorés | Durée |
|---|---|---|---|---|---|
| footer-catalogue-widgets.test.js | 0 | 15 | 0 | 0 | 103 s |
| footer-conditions.test.js | 0 | 46 | 0 | 0 | 91 s |
| footer-editeur-etats.test.js | 0 | 18 | 0 | 0 | 280 s |
| footer-import-export.test.js | 0 | 13 | 0 | 0 | 12 s |
| footer-rendu-unifie.test.js | 0 | 10 | 0 | 0 | 6 s |
| footer-revisions.test.js | 0 | 14 | 0 | 0 | 9 s |
| footer-widgets-entreprise.test.js | 0 | 40 | 0 | 0 | 11 s |
| isolation-proprietes.test.js | 0 | 28 | 0 | 0 | 114 s |
| theme-builder-apercu-contenu.test.js | 0 | 3 | 0 | 0 | 11 s |
| theme-builder-apercu-vignette.test.js | 0 | 5 | 0 | 0 | 14 s |
| theme-builder-catalogue-direct-navigateur.test.js | 0 | 0 | 0 | 0 | 2 s |
| theme-builder-catalogue-public.test.js | 1 | 4 | 1 | 0 | 9 s |
| theme-builder-catalogue.test.js | 1 | 20 | 1 | 0 | 5 s |
| theme-builder-contexte-rendu.test.js | 0 | 7 | 0 | 0 | 1 s |
| theme-builder-couverture-rendu.test.js | 0 | 9 | 0 | 0 | 8 s |
| theme-builder-identite.test.js | 0 | 7 | 0 | 0 | 10 s |
| theme-builder-modeles-editeur.test.js | 0 | 0 | 0 | 1 | 0 s |
| theme-builder-noyau.test.js | 0 | 14 | 0 | 0 | 0 s |
| theme-builder-parties-actuelles.test.js | 0 | 4 | 0 | 0 | 1 s |
| theme-builder-pied-de-page-coherence.test.js | 0 | 7 | 0 | 0 | 5 s |
| theme-builder-pied-unique.test.js | 0 | 4 | 0 | 0 | 5 s |
| theme-builder-pieds-bibliotheque.test.js | 0 | 17 | 0 | 0 | 18 s |
| theme-builder-pieds-identites.test.js | 0 | 4 | 0 | 0 | 1 s |
| theme-builder-proprietes-rendu.test.js | 0 | 0 | 0 | 0 | 0 s |
| theme-builder-regles.test.js | 0 | 12 | 0 | 0 | 1 s |
| theme-builder-rendu.test.js | 0 | 8 | 0 | 0 | 8 s |
| theme-builder-routes-20-3.test.js | 0 | 6 | 0 | 0 | 5 s |
| theme-builder-routes.test.js | 0 | 10 | 0 | 0 | 7 s |
| theme-builder-serveur.test.js | 0 | 14 | 0 | 0 | 9 s |
| theme-builder-site-principal.test.js | 0 | 6 | 0 | 0 | 5 s |
| theme-builder-stabilisation.test.js | 0 | 14 | 0 | 0 | 6 s |
| theme-builder-stockage.test.js | 0 | 13 | 0 | 0 | 2 s |
| theme-builder-vignettes-retour.test.js | 0 | 3 | 0 | 0 | 5 s |
| widgets-theme-builder-unicite.test.js | 0 | 6 | 0 | 0 | 7 s |

**Total : 34 fichiers, 381 tests réussis, 2 échoués, 1 ignorés.** Fichiers avec au moins un échec : theme-builder-catalogue-public.test.js, theme-builder-catalogue.test.js.

**Comparaison avec le rapport final précédent** :
- Les 8 suites « footer » ont **exactement** les nombres annoncés (rendu-unifie 10, conditions 46, widgets-entreprise 40, revisions 14, import-export 13, editeur-etats 18, catalogue-widgets 15, isolation-proprietes 28) : **184 tests, 0 échec : reproduit**.
- Je n'ai pas lancé « 35 suites » mais **34 fichiers** choisis par moi (Theme Builder pied / aperçu / rendu / catalogue…). **32 fichiers sans échec, 2 en échec** : `theme-builder-catalogue` (« liste paginée, recherche sans accents… ») et `theme-builder-catalogue-public` (« en-tête et pied de page de la bibliothèque… », l'assertion qui casse porte sur le **logo de l'en-tête**). Le rapport précédent les liste lui-même comme échecs préexistants du catalogue d'**en-têtes** ; je n'ai pas cherché à les corriger, et je n'ai pas prouvé qu'ils sont indépendants des pieds au-delà de la lecture du message d'erreur. L'affirmation « 0 échec » du résumé est donc **à nuancer** : 0 échec sur les pieds, 2 échecs connus sur les en-têtes dans les mêmes suites.
- **3 fichiers n'ont rien exécuté** : `theme-builder-proprietes-rendu` (« Playwright ou Chrome absent », 0 test), `theme-builder-catalogue-direct-navigateur` (0 test), `theme-builder-modeles-editeur` (1 ignoré). Ces parcours navigateur de l'interface ne sont donc **pas reproduits** ici.
- Mesure Chrome des 100 modèles : le script du dépôt (`scripts/audit-pieds.js`) ne tourne pas tel quel (`playwright-core` absent) ; mon équivalent a reproduit la moitié « sans données » (300 mesures, 0 défaut), voir section 5. La moitié « avec données » (300 mesures) n'a pas été rejouée.

## 5. Mesures Chrome et captures (point C)

- **Script existant** : `scripts/audit-pieds.js` mesure 100 × 3 largeurs, mais exige `playwright-core`, **non installé** dans ce dépôt : je ne l'ai pas installé (pas de modification). **J'ai écrit un équivalent** avec le pilote maison `tests/helpers-chrome-cdp.js` (profil neuf, port 0, groupe de processus arrêté ensuite), enregistré hors dépôt dans le dossier de travail de la session.
- **Résultat : 300 mesures, 0 erreur de chargement, 0 partie absente, 0 débordement horizontal, 0 chevauchement, 0 élément hors écran, 0 texte coupé, 0 erreur JavaScript, 300/300 bandes à pleine largeur de fenêtre.** Cela **reproduit l'affirmation « 0 débordement, 0 erreur JavaScript »** pour le cas « site sans données » (la moitié des 600 mesures annoncées).
- **Un seul `<footer>` ?** Mon test donne 0 `<footer>` dans la page d'**aperçu** (normal : l'aperçu n'est pas la page publiée). L'unicité sur page publiée relève des suites `footer-rendu-unifie` et `theme-builder-pied-unique` (section 4).
- **Cibles tactiles** : sur mobile, 76 modèles sur 100 contiennent au moins un lien ou bouton de **moins de 30 px de haut** (liens de texte en ligne, réseaux…). Le catalogue pose bien un réglage de 44 px sur les liens, boutons, menus et réseaux ; ce que je mesure vient donc d'éléments non couverts (à examiner). Écart **possible** avec « boutons utilisables sur smartphone » : non tranché.
- **Captures** : 10 vues regardées (7 modèles). Qualité : alignements nets, hiérarchie titre / liens correcte, aucune superposition, polices cohérentes par identité. Défauts vus : bouton du bandeau newsletter décalé à gauche du texte centré ; tailles différentes entre « Mon compte / Panier » et les autres liens ; deux colonnes identiques dans le modèle SaaS ; colonnes presque vides sans données d'entreprise ; deux captures mobiles tronquées en bas par mon outil (le bas du pied n'a pas pu être regardé sur ces deux-là).
- **Largeurs** : seulement 390, 820, 1280. Pas 600, 1024, 1440, 1920 : **non vérifié**.

## 6. Étude d'Elementor existante : couverture et 6 vérifications (consigne « évaluer ce qui existe »)

- **Couverture** : 7 documents (≈ 850 lignes), légende à 4 niveaux : [C] confirmé par article officiel lu (≈ 320 mentions), [O] observé/déduit (39), [N] non vérifiable (87), [K] choix Kolakisa. **Aucune interface Elementor réelle n'a été ouverte** : le document le dit lui-même (rien n'est « observé dans l'éditeur »). Il manque donc la catégorie « observé dans l'interface » du cahier des charges.
- **Sources** : le texte parle d'articles lus par l'API publique du centre d'aide, mais **ne liste presque aucune adresse** (2 occurrences de `elementor.com/help`, dont un modèle vide) ; l'ARCHITECTURE renvoie à « §12 » pour les sources, or le §12 traite de WPML. **Les sources ne sont donc pas retraçables** depuis le document. Écart de méthode à corriger (liste d'adresses).
- **Six affirmations vérifiées par recherche web** :

| # | Affirmation | Résultat | Source |
|---|---|---|---|
| 1 | Conditions d'affichage inclure / exclure | **Confirmée** (docs développeur : « conditions can be either included or excluded ») | developers.elementor.com/docs/theme-conditions/ |
| 2 | Points de rupture par défaut 1024 (tablette) / 767 (mobile) | **Confirmée** (centre d'aide + blog développeur v3.2.0) | elementor.com/help/mobile-editing ; developers.elementor.com/breakpoint-system-changes-in-elementor-v3-2-0/ |
| 3 | Créer un pied : Elementor > Theme Builder > Footer > « + » | **Confirmée** (centre d'aide) | elementor.com/help/create-footers-using-elementors-theme-builder/ |
| 4 | Le Theme Builder est réservé à Elementor Pro | **Confirmée par des tiers seulement** (Templately) ; pas de page officielle lue dans mes résultats | docs.templately.com |
| 5 | Réglage « HTML Tag » = footer | **Confirmée** (liste div, header, footer, article, section, aside, nav) ; ce n'est **pas** automatique, c'est un choix manuel ; la synthèse précédente propose bien de le poser automatiquement chez Kolakisa | elementor.com/help/how-to-add-html-tags-to-my-templates/ |
| 6 | Respect de « réduire les animations » | **Partiellement confirmée** : ancien article officiel + forum WordPress (versions 3.32 / 3.33) ; pas de page officielle récente complète | elementor.com/help/entrance-animations/ ; wordpress.org/support (fil cité) |
| (bonus) | Export / import en fichier .json | **Non confirmée officiellement** : seuls des guides tiers (le centre d'aide officiel n'est pas apparu dans mes résultats) | kinsta.com, elementoraddons.com |

## 7. Écarts avec le cahier des charges (point D)

Légende : **Fait** / **Partiel** / **Absent** / **NV** (non vérifiable ici).

| # | Exigence | État | Preuve | Écart |
|---|---|---|---|---|
| 1a | Exactement 100 modèles | **Fait** | 100 (exécution) ; test `pieds-bibliotheque` | — |
| 1b | Modèles réellement distincts | **Partiel** | 99 empreintes / 100 ; 36 modèles ont un voisin ≥ 85 % | 3 paires à fusionner ; diversité plus faible que 100 |
| 1c | 15 familles | **Absent** | 10 familles × 10 | 4 familles métier sans aucun modèle dédié (immobilier, finance/juridique, ONG, institutionnel), éducation et restauration à 1 modèle |
| 1d | Compositions d'exemple | **Partiel** | logo gauche + nav centre + réseaux droite : oui (`titre-copyright-reseaux`, `trois-zones`) ; 4/5 colonnes : oui ; colonne newsletter : oui ; zone de marque : oui (`marque-en-geant`) ; deux niveaux de navigation : oui ; formulaire de contact : **non** ; localisation + téléphone/e-mail : oui ; CTA : oui ; menu horizontal, logo centré : oui ; **menu déroulant mobile : non** (`mobileToggle:false` partout dans les pieds) ; **accordéon mobile : 1 modèle, repliable aussi sur ordinateur** ; légal + infos entreprise : oui ; e-commerce **catégories** : non (catégories d'articles seulement), service client/compte/paiement : oui ; SaaS docs/ressources : **titres seuls** ; éducatif, communautaire : minimal | voir REPARTITION_100_PAR_FAMILLE.md |
| 2 | Ouvrir, insérer, modifier, sauvegarder, prévisualiser, publier | **Fait** (par tests, cycle complet « édition → sauvegarde → rechargement → aperçu → publication → site public ») | `theme-builder-pieds-bibliotheque` ; `footer-*` | non essayé à la main par un humain (le rapport le dit aussi) |
| 2b | « Aucun bouton décoratif » | **Partiel** | bouton « Nous contacter » dans les modèles newsletter sans formulaire | un bouton qui mène au contact au lieu d'abonner |
| 3a | Widgets identité (logo, nom, description, image de marque) | **Partiel** | logo, titre du site OK ; **description = texte libre d'exemple**, pas de source dynamique ; image de marque non utilisée par les modèles | slogan/description dynamique absent |
| 3b | Navigation (menu, liens perso, groupes, secondaire, légale, catégories) | **Partiel** | menu pied + menu site, liens, liens légaux OK ; catégories d'**articles** seulement | catégories de produits absentes |
| 3c | Contact (adresse, tél., e-mail, horaires, coordonnées pro) | **Fait** (10 widgets « Pied de page », migration 140) | `footer-widgets-entreprise` | invisibles tant que les données ne sont pas saisies (choix assumé) |
| 3d | Réseaux (Facebook, Instagram, LinkedIn, YouTube, TikTok, X, Pinterest, autres, URL perso) | **Partiel** | le widget propose **13 réseaux** (`SOCIAL_NETWORKS`) et URL libres ; les modèles n'en posent que 3-4 | TikTok/X/Pinterest : à ajouter à la main |
| 3e | Newsletter (champ, bouton, validation, succès/erreur, consentement, emailing, état « non configuré ») | **Partiel** | 15 modèles utilisent `signupform` **si** un formulaire existe ; widget `emailsubscribe` (consentement + remerciement) **jamais utilisé par un modèle** ; sinon bouton « Nous contacter » | l'« état non configuré explicite » n'existe pas ; le rapport dit « abonnement absent des modèles » : **à moitié vrai** (présent sous condition) |
| 3f | E-commerce (boutique, catégories, compte, suivi commandes, retours, livraison, paiements) | **Partiel** | compte, panier, livraison/retours, paiements : oui (4 à 6 modèles) ; **suivi de commande, catégories produits : non** | 5 modèles à moyens de paiement seulement |
| 3g | Divers (copyright dynamique, séparateurs, boutons, icônes, texte, HTML sûr, contenu dynamique, légal, retour en haut, infos de marque) | **Fait** (widgets du Page Builder : 159 types dont `html`, `dyntext`, `divider`, `icon`) | exécution `NODE_TYPES` ; `html` réservé à `pages.code` (administrateurs) | HTML : réservé aux administrateurs (sûr) |
| 4 | Responsive (grand écran, desktop, portable, tablette, smartphone), sans débordement | **Partiel** | 390 / 820 / 1280 mesurés : 0 défaut ; flexbox qui passe à la ligne | grand écran / portable / largeurs intermédiaires non mesurés ; menus mobiles et accordéons : quasi absents |
| 5a | Vignettes générées de la structure réelle | **Fait** | section 3 | pas de comparaison pixel |
| 5b | Nom, description, catégorie, id stable, métadonnées | **Partiel** | nom, description, famille, étiquettes, identité, id : oui ; version, date, auteur : non | pas de numéro de version |
| 5c | Recherche, filtres | **Fait** | recherche sans accents, filtres famille / identité / étiquette, pagination | — |
| 5d | Tri, favoris | **Absent** | `public/js/theme-builder.js` : tri seulement sur « mes modèles », aucun favori | à créer (étape 9) |
| 5e | Bibliothèque affiche exactement 100 | **Fait** | `stats()` | — |
| 6a | Affectation : site / pages / catégories / articles / archives / recherche / e-commerce / spécifiques | **Fait** | 17 types de conditions (`conditions.js`), 46 tests | — |
| 6b | Inclusion / exclusion, priorité | **Fait / Partiel** | exclusion l'emporte ; le plus précis gagne ; **pas de champ priorité manuel** | priorité automatique, non réglable |
| 6c | Un seul footer par contexte | **Fait** | `theme-builder-pied-unique`, `footer-rendu-unifie` (résultats section 4) | à reprendre en cas de pied dans le contenu d'une page |
| 6d | Fond pleine largeur + contenu en conteneur | **Fait** | 300/300 bandes à pleine largeur (mesure) ; conteneur interne `maxWidth` | contenu interne ≤ 1180 px non mesuré à 1920 |
| 7 | Multi-sites : bibliothèque commune, instance indépendante | **Fait** | copie à l'insertion (3 insertions : composants distincts) ; tests d'isolation | médias/permissions : non testés en détail |
| 8 | Remplacement contrôlé sans perte | **Partiel** | copie = pas de perte ; mais `origin_key` vide pour les anciens pieds ; pas de version ; pas d'alias | voir PLAN_REMPLACEMENT_BIBLIOTHEQUE.md |
| 9 | Tests (bibliothèque, construction, fonctionnels, rendu, non-régression, multi-sites) ; captures des 100 | **Partiel** | nombreux tests ; pas de comparaison de captures ; 3 largeurs | voir PLAN_DE_TESTS_COMPLEMENTAIRE.md |
| 10 | Documentation | **Fait** | 21 documents + ceux-ci | trop de documents qui se recoupent ; sources Elementor non retraçables |
| 11 | Travail par étapes | **—** | ETAPES_PROPOSEES.md | |

**Sécurité.** HTML libre réservé à la permission `pages.code`, adresses `tel:` / `mailto:` en liste blanche, aucun script dans les modèles (test). Insertion exige `forms.write`. **Non audité à fond** : injection par le contenu des widgets de données d'entreprise.

## 8. Les cinq écarts principaux

1. **Familles** : 10 familles « de forme » au lieu des 15 familles « métier » demandées ; 4 familles métier n'ont aucun modèle.
2. **Newsletter** : vrai formulaire seulement si le site en a déjà un ; sinon un bouton « Nous contacter » ; aucun état « non configuré » ; le widget d'abonnement dédié n'est utilisé par aucun modèle.
3. **Responsive mobile** : pas de menu déroulant ni d'accordéon mobile (1 seul modèle, repliable partout) ; 76 modèles ont des cibles tactiles < 30 px sur mobile.
4. **Bibliothèque** : pas de tri, pas de favoris, pas de numéro de version par modèle.
5. **Diversité réelle** : 3 paires identiques, 36 modèles à voisin ≥ 85 % ; contenus d'exemple génériques et colonnes vides tant que les données d'entreprise manquent.

## 9. Où sont les pièces de l'audit (hors dépôt)
Captures et mesures brutes : dossier de travail de la session, `/private/tmp/claude-501/-Users-imac-Downloads-Ptojry-google-stich-design/234805b0-e56d-4b6e-a957-09d5db8adc8d/scratchpad/` (`shots/` : captures ; `measure.json` : 300 mesures ; `inv.json`, `tab.json`, `fp2.json` : inventaire et empreintes ; `log-*.txt` : sorties des tests). Ces fichiers ne sont pas dans le dépôt.
