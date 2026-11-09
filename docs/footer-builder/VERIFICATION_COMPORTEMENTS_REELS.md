# Vérification des comportements réels de la bibliothèque de 100 pieds de page

Date : 8 novembre 2026. Branche `footer-reconstruction`. Tout ce qui est écrit « vérifié » ci-dessous a été **exécuté** : vrai serveur de test (base jetable), vrai Chrome (profil neuf, port libre, groupe de processus arrêté à la fin), pages publiques réelles. Rien n'est déduit de la lecture du code seule sauf quand c'est écrit « non vérifié ».

Nouveaux tests ajoutés (aucun fichier existant de modèle ou de moteur n'a été modifié, sauf le correctif signalé en §0) :

| Fichier | Rôle | Durée mesurée (machine chargée) |
|---|---|---|
| `tests/footer-comportements-navigateur.test.js` | points 1, 2, 3 dans Chrome (page publique, aperçu de la bibliothèque) | ≈ 4 min (largeurs) + ≈ 15 min (accordéon) + ≈ 6 min (aperçu = publié) |
| `tests/footer-comportements-reels.test.js` | points 4, 5, 7 (serveur réel, requêtes HTTP réelles par domaine de site) | ≈ 8 min |
| `tests/footer-comportements-editeur-navigateur.test.js` | point 6 (vrai Page Builder du composant dans Chrome) | ≈ 7 min |

Lancement : `TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/<fichier>`. Variables facultatives : `FOOTER_REPORT` (JSON de résultats), `FOOTER_CAP_DIR` (captures `comp-*.png`), `FOOTER_REPORT_EDITEUR`.

## État APRÈS correctifs (dernière passe, 8 novembre 2026)

Les défauts D1, D2, D4, D5, D6 et D8 ont été corrigés dans cette dernière passe (D3 l'était déjà ; D7 est une limite connue, non corrigée). Les sections 1 à 8 ci-dessous décrivent l'état **avant** correctifs (elles gardent leurs preuves) ; ce tableau donne l'état actuel et la preuve exécutée.

| N° | État | Correctif | Preuve exécutée |
|---|---|---|---|
| D1 | **Corrigé** | `themeRender.js` `previewDoc` : `landing.js` chargé pour l'aperçu complet, jamais pour la vignette | `footer-comportements-navigateur` (aperçu = publié) : à 390 px les 5 modèles à accordéon de l'échantillon ont leurs volets repliés au départ, un clic ouvre puis referme ; `footer-catalogue-widgets` : vignette 0 script, aperçu = seul `/js/landing.js` |
| D2 | **Corrigé** (blog, recherche, 404) | route `POST /p/_pied/inscription` sans page porteuse (`landingPublic.js`), `themeLayout.js` (jeton, retour, message), `emailsubscribe.ejs` | `footer-comportements-reels` : le test `todo` est un vrai test, vert : adresse `/p/_pied/inscription`, refus sans consentement avec message, e-mail invalide refusé, envoi accepté (contact créé) avec message de succès, champ piège sans enregistrement, retour externe refusé, widget d'un autre site refusé ; 5 fichiers de formulaires toujours verts. **Non mesuré** : boutique et compte client (même gabarit, mais non servis par le serveur de test) |
| D3 | Corrigé (avant) | `widgetOf(page, id, req)` | idem |
| D4 | **Corrigé** | `landing.js` : un volet réduit à son titre n'a ni bouton ni contenu vide, il reste masqué | Mesure Chrome des 28 modèles à accordéon à 390 px, SANS et AVEC données d'entreprise (56 mesures, 219 volets ouverts un par un) : 0 volet qui s'ouvre sur du vide |
| D5 | **Corrigé** | `<body class="lp-body lp-site">` pour l'aperçu d'un pied ; règles `[data-kw-footer]` déplacées dans `landing.css` (cause réelle des +24 px) | 60 comparaisons aperçu / publié : écart de hauteur et de bloc ≤ 3 px partout |
| D6 | **Corrigé** | menu d'exemple annoncé « (menu d'exemple) » (`data-kw-sample`), aperçu et vignette seulement | le test vérifie la mention ; le site publié sans menu n'affiche aucun menu |
| D7 | Limite connue | — | — |
| D8 | **Expliqué / corrigé** | 296 px = faux écart de la mesure (éléments non affichés) ; 56 px et 4 px = menu d'exemple dans une pile + règles absentes des pages du Page Builder | idem D5 |

Éditeur (§6) : le seul échec reproduit deux fois (« annuler une suppression » sur `ft-minimalistes-01`) ne se reproduit pas quand le modèle est lancé seul (11 actions sur 11 réussies) : c'est un retard d'enregistrement automatique sous charge, pas un défaut de l'annulation du Page Builder. L'attente du test a été portée de 7 à 10 s.

## 0. Correctif minimal effectué (défaut bloquant général)

**D3 — La lettre d'information et le formulaire de contact d'un pied de page ne pouvaient pas être envoyés.** Sur une page du Page Builder, l'envoi (POST `/p/<page>/inscription`) répondait « 400 » sans aucun message, et aucun contact n'était créé : la route cherchait le widget uniquement dans les sections de la page, jamais dans le pied du site. Cela touchait les 36 modèles qui contiennent une lettre d'information (33) ou un formulaire de contact (3). Les tests existants ne l'avaient pas vu (ils ne rendaient que le gabarit, sans envoi).
Correctif : `src/marketing/web/landingPublic.js`, fonction `widgetOf(page, id, req)` : elle cherche aussi dans les parties du site (pied, en-tête) via `pages.withSiteParts`, comme l'affichage de la page ; 3 appels mis à jour. Aucune autre ligne touchée. Vérifié ensuite par le test réel (§7) : refus sans consentement avec message, refus d'un e-mail invalide avec message, envoi valide accepté (contact créé), champ piège = faux succès sans enregistrement, formulaire de contact accepté.

## 1. Accordéon mobile réel (28 modèles)

Modèles retrouvés **par le code** (conteneur `mode: accordion` avec `accMobile`) : **28 sur 100**, 114 volets au total (liste : voir le test, `accordionModels()`).

Vérifié sur la **page publique** de chacun des 28, dans Chrome :
- 390 px : 114 boutons créés (un par volet), tous des `<button>`, hauteur minimale mesurée **56 px** (exigence 44 px), `aria-expanded="false"` et volet `hidden` au départ (sauf modèles qui démarrent ouverts : aucun), `aria-controls` pointe un volet existant avec `role="region"` ;
- ouverture et fermeture au clic souris réel ; Tab atteint le bouton ; focus visible (`:focus-visible` + contour) ; Entrée puis Espace ouvrent et ferment ; aucun défilement horizontal volets ouverts ; **379 liens** à l'intérieur des volets, tous visibles une fois ouverts, dans la fenêtre, hauteur minimale **44 px** ;
- 820 px et 1280 px : affichage normal (0 bouton, 0 volet masqué, pas de défilement horizontal) ;
- sans JavaScript (page publique sans ses `<script>`, feuilles de style conservées) : 0 bouton, 0 volet masqué, titre de chaque colonne affiché ;
- mouvement réduit (émulé) : aucune transition ni animation sur les boutons et volets.
Résultat : **aucun défaut de comportement**. Un seul point : D4 ci-dessous (volets vides).

**D1 — IMPORTANT. L'aperçu de la bibliothèque ne charge pas le script de la page, donc les volets y sont DÉPLIÉS à 390 px (28 modèles).** Cause : `src/marketing/web/themeRender.js`, fonction `previewDoc`, la page d'aperçu n'ajoute `landing.js` que si `!(thumb || type === "footer")`. Mesure : sur 5 modèles à accordéon, l'aperçu fait +240 à +1 190 px de plus que la page publiée à 390 px. **Preuve que le correctif règle le problème** : en ajoutant `landing.js` à la page d'aperçu ouverte, les boutons apparaissent (3, 6, 4, 4, 4) et la hauteur devient celle de la page publiée à 24 px près (écart expliqué par D5), ou à l'écart du menu d'exemple (D6) près.
La vérité attendue (« l'aperçu doit correspondre au modèle inséré ») impose donc de charger le script dans l'aperçu COMPLET (pas la vignette). **Correctif exact** (non appliqué : `themeRender.js` est modifié en parallèle par un autre agent) : dans `previewDoc`, remplacer `${thumb || type === "footer" ? "" : '<script src="…landing.js" defer></script>'}` par `${thumb ? "" : '<script src="…landing.js" defer></script>'}` ; adapter l'assertion « AUCUN script » de `tests/footer-catalogue-widgets.test.js` (ligne `!/<script/i.test(r.text)`) pour ne l'exiger que pour la vignette (`kind === "vignette"`) et accepter, pour l'aperçu, le seul script `/js/landing.js`.

**D4 — IMPORTANT. Des volets s'ouvrent sur RIEN quand le site n'a ni menu ni coordonnées.** Mesuré sur un site sans menu ni données d'entreprise : 10 modèles ont au moins un volet vide (le bouton existe, le volet s'ouvre sur une zone sans texte) : `ft-corporate-01-grande-marque-volets` (« Société », « Contact »), `ft-corporate-07-affiche-noir-et-or` (« Le groupe »), `ft-corporate-08-contact-et-trois-niveaux-legaux` (« Informations légales »), `ft-saas-tech-08-integrations-et-expert` (« Nous joindre »), `ft-editoriaux-04-media-numerique-nuit` (« Actualités »), `ft-services-06-cabinet-de-soins-accueillant` (« Venir au cabinet »), `ft-finance-juridique-01-banque-en-ligne-securite` et `ft-finance-juridique-06-fintech-moderne-statut` (« Nous joindre »), `ft-ong-associations-05-tiers-lieu-adhesion-agenda` (« Venir »). Cause : ces volets ne contiennent que des widgets de données (menu du site, coordonnées, horaires) ; le test « aucune colonne faite seulement de données » exempte les volets parce que leur titre reste affiché, mais sur mobile le titre devient un bouton qui ouvre du vide. Correctif proposé : donner à chaque volet un élément permanent (lien réel ou phrase), ou masquer le volet (bouton compris) quand tous ses enfants sont des widgets de données sans donnée (calcul côté serveur au rendu).

## 2. Aperçu = publié (20 modèles × 3 largeurs = 60 mesures)

Échantillon : 1 modèle sans accordéon par famille (15 familles) + 5 modèles à accordéon répartis. Pour chaque modèle et chaque largeur (390 / 820 / 1280 px) : hauteur totale du pied, position et taille de chaque bloc (`.kw-node`) de l'aperçu de la bibliothèque comparées à celles de la page publique du même modèle.

Résultat : les **blocs** ont la même position et la même taille (écart ≤ 3 px) sur **50 des 60** mesures ; la **hauteur totale** n'est dans la tolérance de 3 px sur **aucune** des 60 (40 fois exactement +24 px dans la page publiée) à cause des écarts ci-dessous :

| Cause | Mesures | Effet | Gravité |
|---|---|---|---|
| D5 — le `<body>` de l'aperçu n'a pas les classes `lp-body lp-site` de la page publique : la ligne légale du site a des marges de 14/18 px (aperçu) au lieu de 24/32 px (publié), et le texte hérité est en Times au lieu de la police du site (Figtree) | 40 / 60 : pied publié exactement **+24 px** plus haut (dont 32 mesures sans aucun autre écart) | hauteur | MINEUR |
| D6 — menu d'exemple « Accueil / Services / Blog / Contact » affiché seulement dans l'aperçu (`sampleMenu`), alors que le site de test n'a pas de menu | 22 / 60 (10 modèles avec widget de menu ; 1 bloc de plus dans l'aperçu pour 18 mesures) | −12 à −46 px (hauteur publiée moins aperçu), liens en plus | MINEUR (données d'exemple voulues, mais non étiquetées « exemple ») |
| D1 — accordéon déplié dans l'aperçu (script absent) | 5 / 20 modèles à 390 px | −240 à −1 192 px | IMPORTANT |
| Écart de 56 px sur la hauteur d'un `kw-stack` (`ft-communautes-02-forum-rubriques-et-charte` à 820/1280 px, `ft-institutionnels-03-agence-plan-du-site-trois-niveaux` à 820/1280 px) et de 296 px sur `ft-editoriaux-01-pied-de-journal` à 390 px | 6 | non expliqué précisément (très probablement le menu d'exemple dans une pile) | À examiner par l'agent des modèles |

Le pied `<footer>` unique et le repère `data-kw-footer` sont bien présents dans l'aperçu comme dans la page publique pour les 20 modèles. Les enveloppes `<footer>` / `<main>` de la page publique n'expliquent aucun écart de bloc.

## 3. Un seul pied, fond pleine largeur (100 modèles × 3 largeurs = 300 mesures)

Page publique de chacun des 100 modèles (un seul serveur, publication puis mesure), à 390, 1280 et 1920 px : **300 mesures sans aucun défaut** :
- exactement 1 balise `<footer>` et 1 repère `data-kw-footer` ;
- 0 `<footer>`, `<header>`, `<main>`, `role=banner` ou `role=contentinfo` imbriqué dans le pied ;
- la bande extérieure et toutes les bandes `.kw-full` ont `x = 0` et une largeur égale à celle de la fenêtre (± 1 px) ;
- aucun défilement horizontal de la page ni du corps ; aucun élément visible du pied hors de la fenêtre ;
- contenu jamais collé au bord : marge gauche minimale **15 px à 390 px**, 24 px à 1280 px ; conteneurs internes centrés (marges gauche = droite à 2 px près) ;
- aucune erreur JavaScript dans la page.
Hauteur maximale mesurée : 2 423 px à 390 px, 1 132 px à 1280/1920 px.

**D7 — MINEUR (connu).** Sur toute page du Page Builder, le `<footer>` est placé **dans** `<main class="lp-main">` (limite déjà documentée dans `FOOTER_RENDU_UNIFIE.md`). Le rôle `contentinfo` est explicite, mais le pied n'est pas frère de `<main>`. Non corrigé (compteur de liens qui oblige à rendre le pied avec les sections).

Note de méthode : une première version du test du « fond » par `elementFromPoint` donnait de fausses alertes (Chrome sans fenêtre répond avec une image périmée après un défilement) ; elle a été remplacée par la mesure des rectangles de toutes les bandes.

## 4. Isolation multi-sites (7 contrôles, tous réussis)

- « Utiliser » le même modèle sur le site A et sur le site B crée **deux composants distincts** (ids différents, `site_id` A et B), deux modèles du Theme Builder distincts, même contenu au départ ; la bibliothèque (document construit) reste identique (empreinte SHA-1 avant/après).
- Modifier le texte de l'instance de A, l'enregistrer et la publier : l'instance de B est **inchangée à l'octet près** (ligne de base de données identique), la page publique de A montre la modification, celle de B non ; un 3e site qui insère le modèle après coup reçoit le modèle d'origine (jamais la version modifiée de A).
- Dépublier, archiver puis supprimer sur A : B garde son pied publié et en ligne ; la bibliothèque est intacte.
- Un membre du site B (rôle éditeur de B seulement) : 403/404 sur chaque chemin du site A (liste des modèles, plan de publication, publier, supprimer, dupliquer, export, « utiliser »), sur l'identifiant d'un modèle de A présenté sous l'adresse de B (404), et sur l'écriture directe du composant de A (le composant n'est pas modifié) ; son propre site fonctionne.
- Droits réels : lecteur (`forms.read`) = lecture et aperçu seulement, « utiliser » et publier refusés (403) ; éditeur (`forms.write`) insère et publie ; **un éditeur sans `pages.code` insère les 100 modèles sans refus** ; aucun des 100 modèles ne contient de HTML libre, de code ou d'iframe (donc `pages.code` n'est jamais nécessaire) ; supprimer exige en plus `pages.delete` (403 pour l'éditeur, normal).
- Réglages et affectations propres à chaque site : le formulaire publié de A apparaît dans le pied de A et **jamais** dans celui de B (B affiche « non configuré ») ; un seul pied publié par site.
- Médias : **aucun** des 100 modèles ne contient d'image, de vidéo ni de média de la médiathèque (rien à copier ni à partager entre sites).

## 5. Conditions et priorité (6 contrôles, tous réussis)

Modèles NOUVEAUX de la bibliothèque (un par famille, texte repère unique dans tout le catalogue), pages publiques réelles servies par domaine :
- **Site à domaine** — cascade « tout le site → page d'accueil → page X → 404 » : accueil → pied « accueil » ; page X → pied « page X » ; page Y → pied « tout le site » ; page introuvable → pied « 404 ». Chaque page : 1 `<footer>`, 1 repère, exactement 1 pied reconnu.
- **Site principal** (blog, recherche) — cascade « tout le site → articles → articles de la catégorie Actualités → archives → recherche → 404 » : article de la catégorie → pied « catégorie » ; autre article → pied « articles » ; `/blog` → « archives » ; `/blog?q=zzz` → « recherche » ; 404 → « 404 » ; `/a-propos` → « tout le site ».
- **Exclusion** : un pied « tout le site sauf la page Y » ne s'affiche pas sur Y, la page X garde son pied précis, l'accueil garde le sien.
- **2e pied sur le même contexte** : publication refusée (409) avec conflit bloquant expliqué, **rien ne change** sur le site ; avec « remplacer », le précédent repasse en brouillon, un seul pied ensuite.
- **Balayage** de 14 adresses (deux sites) : jamais plus d'un `<footer>`, jamais plus d'un repère, jamais le pied d'un autre site.
- **Boutique, produit, compte client, panier, commande, formation, recherche, 404** : par le moteur de résolution du rendu public sur la base du serveur : compte → pied « compte » (aussi `/boutique/compte/commandes`) ; panier et commande → pied « boutique » ; liste de produits → « boutique » ; fiche produit → pied « produit » (le plus précis) ; formation → pied « formation » ; recherche et 404 → le général ; un autre site n'hérite d'aucun de ces pieds.
Suites existantes relancées : voir §8.

Non vérifié par requête HTTP : les pages de la boutique, du compte client et des formations **servies réellement** (la boutique n'est servie que sur l'hôte principal avec le module commerce ouvert) : seule la résolution est exécutée pour ces vues.

## 6. Édition réelle dans le Page Builder (12 modèles)

Test : `tests/footer-comportements-editeur-navigateur.test.js` — vrai serveur, vrai éditeur du composant (`/marketing/site-web/composants/<id>/editeur`) dans Chrome. Clics souris réels sur les calques (ou dans le canevas), champs renseignés comme une saisie, barre d'outils flottante du canevas, bouton Enregistrer, bouton Aperçu, bouton Publier. **Chaque action est contrôlée dans la base** (brouillon puis version en ligne) et la publication est contrôlée sur la **page publique réelle**.

12 modèles de 12 familles : `ft-minimalistes-01-menu-et-mentions`, `ft-corporate-01-grande-marque-volets`, `ft-ecommerce-01-mega-enseigne`, `ft-saas-tech-01-mega-pied-six-colonnes`, `ft-editoriaux-01-pied-de-journal`, `ft-creatifs-portfolios-01-pied-affiche-titre-geant`, `ft-education-01-universite-cinq-colonnes`, `ft-communautes-01-reseau-social-dense`, `ft-services-01-artisan-grand-telephone`, `ft-restauration-hotellerie-01-bistrot-ardoise-du-jour`, `ft-immobilier-01-agence-de-quartier-estimation`, `ft-finance-juridique-01-banque-en-ligne-securite`. Sur chacun : une action de chaque type.

Résultat de la passe complète (12 modèles) : **les contrôles réagissent, aucun bouton décoratif trouvé** ; réussites par type d'action :

| Action | Réussie sur |
|---|---|
| modifier le texte et l'adresse d'un lien (enregistrés dans le brouillon) | 12 / 12 |
| couleur de fond d'une bande (sélecteur de couleur, code `#123456`) | 12 / 12 |
| espacement (intérieur haut d'une bande) | 11 / 12 |
| ajouter un widget (palette → clic) | 11 / 12 |
| déplacer un élément d'un rang (bouton « Monter » du canevas) | 11 / 12 |
| dupliquer (bouton « Dupliquer ») | 12 / 12 |
| supprimer (drapeau du calque) | 12 / 12 |
| annuler la suppression (bouton Annuler) | 10 / 12 |
| recharger l'éditeur : modifications relues | 12 / 12 |
| aperçu : montre la version modifiée | 12 / 12 |
| publier depuis l'éditeur : version en ligne ET page publique changées, toujours 1 seul `<footer>` | 12 / 12 |

Les 6 échecs restants (`ft-saas-tech-01` : espacement et widget ; `ft-education-01` : déplacement ; `ft-minimalistes-01` et `ft-finance-juridique-01` : annulation) **ne sont pas reproductibles à l'identique** : une 2e passe sur 4 de ces modèles a réussi `ft-saas-tech-01` en entier et fait échouer d'autres actions sur `ft-education-01` (suppression, annulation) et `ft-finance-juridique-01` (déplacement, suppression) ; seul `ft-minimalistes-01` échoue deux fois de suite sur « annulation après suppression » (6 → 6 au lieu de 7). Je les classe **« à confirmer »** (probablement l'enregistrement automatique de l'éditeur, qui peut tarder sur une machine chargée, ou la pilotage ; la possibilité d'un vrai défaut d'annulation sur `ft-minimalistes-01` reste ouverte). Ils ne rendent pas le résultat « 100 % ».

Non couvert : glisser-déposer à la souris, édition du texte riche directement dans le canevas, états survol/focus par écran dans cet éditeur (couverts par `footer-editeur-etats`), modèles restants (88).

## 7. Newsletter et formulaires (4 contrôles + 1 défaut connu)

- **Sans formulaire publié** : les **36 modèles** concernés (33 lettres d'information + 3 formulaires de contact) affichent, sur la page d'accueil, le blog et la page 404 (108 mesures), l'état « non configuré » explicite (`data-kw-state="not-configured"`), **sans `<form>`, sans champ e-mail, sans case de consentement, sans bouton d'envoi factice et sans jargon d'éditeur** (« Audience », « Formulaires d'inscription »).
- **Avec un formulaire publié** (site avec formulaire) : le vrai formulaire apparaît dans le pied (champ e-mail, case de consentement, champ piège, jeton anti-robot) avec une adresse d'envoi `/p/<page>/inscription`.
- **Envoi POST réel** : sans consentement → 400 + message « Cochez la case… » affiché ; e-mail invalide → 400 + message ; envoi valide → accepté, **contact créé**, message de succès après retour sur la page ; champ piège rempli → faux succès silencieux, **rien enregistré**. (Avant le correctif D3 : 400 sans message et aucun contact.)
- **Formulaire de contact du pied** (`ft-corporate-08-contact-et-trois-niveaux-legaux`) : envoi réel accepté, contact enregistré.

**D2 — IMPORTANT.** Sur les pages qui ne sont pas des pages du Page Builder (blog, page 404, boutique, compte client), le formulaire du pied est affiché mais son adresse d'envoi est **`/p//inscription`** (pas de page courante) : l'envoi échoue. Cause : `views/marketing-public/widgets/emailsubscribe.ejs` écrit `action="/p/<%= page.slug %>/inscription"` ; `page` n'existe pas hors Page Builder. Le test correspondant est marqué `todo` (défaut connu D2). Correctif proposé : utiliser le titre de page de l'accueil du site comme page porteuse (`/p/<accueil du site>/inscription`) ou ajouter une route d'envoi propre au pied.

## 8. Non-régression globale

Méthode : chaque fichier lancé seul (`node --test --test-concurrency=1`), sur l'arbre de travail actuel (qui contient aussi le travail en cours des autres agents), puis les fichiers en échec relancés sur une copie propre du dernier commit (`git archive HEAD`, « état de départ ») pour savoir si l'échec existait déjà.

**78 fichiers exécutés** (les 73 demandés hors fichiers « navigateur » + 5 fichiers qui exercent la route d'inscription que j'ai corrigée : `editeur-widgets`, `marketing-pages-atterrissage`, `pages-formulaires-sms-par-site`, `tunnels`, `marketing-forms-public`) : **940 contrôles réussis, 10 en échec, 3 annulés, 1 ignoré** au premier passage.

| Fichier | Premier passage | État de départ (HEAD) | Conclusion |
|---|---|---|---|
| `theme-builder-catalogue` | 20 / 1 échec | 20 / 1 échec | préexistant (connu) |
| `theme-builder-catalogue-public` | 4 / 1 échec | 4 / 1 échec | préexistant (connu) |
| `theme-builder-404-bibliotheque` | 6 / 1 échec | 6 / 1 échec | préexistant (aperçu ≠ vignette) |
| `theme-builder-archives-bibliotheque` | 10 / 1 échec | 10 / 1 échec | préexistant |
| `theme-builder-recherche-bibliotheque` | 9 / 1 échec | 9 / 1 échec | préexistant |
| `theme-builder-archives-produits-bibliotheque` | 42 / 1 échec | 42 / 1 échec | préexistant (script dans l'aperçu) |
| `isolation-proprietes` | 26 / 2 échecs | 28 / 0 | **fausse alerte** : relancé seul, 28 / 0 (Chrome lancé en même temps qu'un autre test) |
| `footer-editeur-etats` | 15 / 3 annulés | 18 / 0 | **fausse alerte** : « Chrome n'a pas démarré » ; relancé seul, 18 / 0 |
| `footer-rendu-unifie` | 8 / **2 échecs** | **10 / 0** | **RÉGRESSION due au travail en cours** : la règle CSS `[data-kw-footer] …` ajoutée dans `themeRender.js` (5 occurrences de `data-kw-footer` dans la page) fait échouer le test qui compte `data-kw-footer` dans tout le HTML (6 au lieu de 1). Correctif : le test doit compter l'attribut (` data-kw-footer=`), pas le texte. Pas causé par mon correctif. |
| `theme-builder-modeles-editeur` | ignoré (jsdom absent) | idem | préexistant |

Tous les autres fichiers (dont `footer-100-integration` 4, `footer-aliases` 12, `footer-bibliotheque-interface` 21, `footer-catalogue-widgets` 15, `footer-conditions` 46, `footer-elements-refonte` 9, `footer-import-export` 13, `footer-reconstruction` 128, `footer-revisions` 14, `footer-widgets-entreprise` 40, `site-principal-theme-builder`, `site-web-entete`, `themes-packs`, `isolation-conteneur` 22, `commerce-par-site` 7, `apparence-themes` 28, `editeur-blocs-styles-communs` 7, tous les `theme-builder-*` serveur) : **0 échec**.
Les cinq fichiers qui exercent l'inscription publique (pages, tunnels, formulaires, widgets de l'éditeur : 18 + 8 + 18 + 8 + 8 contrôles) passent : **le correctif D3 ne casse pas les formulaires de page**.
Les échecs préexistants listés dans la mission (`cms-interface`, migration 081, `agent-ia`, infobulles) n'étaient pas dans le périmètre lancé.
Non lancés : les fichiers `*-navigateur` (hors `footer-editeur-etats`, `isolation-proprietes`, qui pilotent Chrome et ont été exécutés), `page-builder-performance-navigateur`, `site-web-entete-navigateur`.

## État des tests livrés (dernière exécution)

| Test | Résultat | Remarque |
|---|---|---|
| navigateur : 100 modèles × 3 largeurs | **réussi** | 300 mesures, 0 défaut |
| navigateur : accordéon des 28 modèles | **échoue volontairement** | 14 signalements, tous de type « volet vide » (D4) ; aucun défaut de comportement |
| navigateur : aperçu = publié (20 modèles) | **échoue volontairement** | D1, D5, D6 et D8 ; devient vert quand D1/D5 sont corrigés (D6 : tolérer ou étiqueter) |
| reels : isolation multi-sites (7) | **réussi** | |
| reels : conditions et priorité (6) | **réussi** | |
| reels : newsletter et formulaires (4 + 1 `todo`) | **réussi** ; `todo` = D2 | |
| éditeur : 12 modèles | **8 modèles complets**, 4 avec 1 à 2 actions non confirmées | voir §6 |

## Défauts classés

| N° | Gravité | Modèles / zone | Défaut | Correctif |
|---|---|---|---|---|
| D3 | BLOQUANT — **corrigé** | 36 modèles (lettre d'information, contact) | l'envoi du formulaire du pied échouait en silence | `landingPublic.js` `widgetOf` (fait) |
| D1 | IMPORTANT | 28 modèles à accordéon, aperçu de la bibliothèque | volets dépliés dans l'aperçu à ≤ 767 px | charger `landing.js` dans l'aperçu complet (`themeRender.js`, ligne décrite en §1) |
| D2 | IMPORTANT | 36 modèles, pages hors Page Builder | action `/p//inscription` | voir §7 |
| D4 | IMPORTANT | 10 modèles à accordéon (liste en §1) | volet qui s'ouvre sur du vide sans données | élément permanent ou volet masqué |
| D5 | MINEUR | aperçu (tous les modèles) | `<body>` sans `lp-body lp-site` : +24 px et police Times | `<body class="lp-body lp-site">` pour le pied dans `previewDoc` |
| D6 | MINEUR | modèles avec widget de menu | menu d'exemple non étiqueté dans l'aperçu | libeller « (exemple) » ou ne pas l'afficher |
| D7 | MINEUR (connu) | 100 modèles | `<footer>` dans `<main>` | limite documentée |
| D8 | À EXAMINER | `ft-communautes-02-forum-rubriques-et-charte`, `ft-institutionnels-03-agence-plan-du-site-trois-niveaux`, `ft-editoriaux-01-pied-de-journal` | écarts de 56 px / 296 px aperçu ≠ publié | à analyser |

## Ce qui n'est PAS vérifié

- Pas de test sur appareil réel ni sur Safari/Firefox : uniquement Chrome (macOS, sans fenêtre).
- Pas de lecteur d'écran : les attributs ARIA sont contrôlés, pas la restitution vocale.
- Le basculement exact à 767 px (largeur limite) et le redimensionnement d'une même page entre 390 et 1280 px n'ont pas été testés (largeurs fixes à chaque chargement).
- Le test « sans JavaScript » charge la page publique privée de ses `<script>` (le navigateur n'a pas été lancé avec JavaScript désactivé).
- Pages réelles de la boutique, du compte client et des formations : seulement la résolution du pied, pas le rendu HTTP complet.
- Les aperçus et pages publiques ont été mesurés avec un site de test **sans menu ni données d'entreprise** ; un site riche en données change les hauteurs.
- Le comportement des 100 modèles dans l'éditeur n'a été exercé que sur 12 modèles (une action de chaque type) ; l'édition par glisser-déposer à la souris n'a pas été testée (déplacement par bouton).
