# Navigation du CMS sans flash (14 novembre 2026)

**Architecture réelle** : Kolakisa n'est pas une application React : ce sont des pages serveur (Express + EJS). Chaque clic charge un nouveau document ; il n'y a ni remontage de composants ni Suspense à corriger.

**Cause mesurée** (`scripts/mesure-scintillement.js`, vrai Chrome, réseau 1,5 Mbit/s + 120 ms, processeur ralenti ×4, 30 navigations entre rubriques) : le navigateur affichait des images intermédiaires à moitié construites (barre du haut et rail présents, menu latéral encore vide et clair, contenu absent). Avant : **21 images « flash » sur 615** dans la colonne de menus. Sur un réseau rapide en local : 0, ce qui explique que le défaut ne se voie pas sur la machine du développeur.
Cause secondaire : chaque bloc du contenu remontait de 8 px en 400 ms avec un décalage jusqu'à 160 ms à chaque clic (`kola-compose.css` §11).

**Corrections** (aucune bibliothèque ajoutée, aucun système de navigation parallèle) :
1. `views/marketing/partials/top.ejs` et `views/partials/header.ejs` : `<link rel="expect" href="#main" blocking="render">` — aucune image n'est affichée avant que la coque (barres, menus) soit construite.
2. `public/css/kola-stable.css` (CMS/Marketing) et `public/css/dashboard.css` (Mon espace) : `@view-transition { navigation: auto; }` ; la barre d'administration, le rail et le menu latéral ont un nom de transition et ne bougent pas ; seul le contenu fond en 140 ms ; mouvement réduit respecté.
3. Entrées du contenu : un fondu de 150 ms en opacité, sans décalage ni déplacement.
Navigateurs sans ces fonctions : navigation habituelle, rien ne casse.

**Après** : 0 image « flash » sur 613 (même mesure). Test : `tests/cms-navigation-stable-navigateur.test.js`.
**Limites** : le test mesure Chrome (Safari/Firefox n'ont pas la transition de document ; ils profitent seulement de l'attente de construction quand elle est prise en charge). Les changements de site, de thème et les permissions n'ont pas été mesurés image par image ; leurs parcours serveur existants n'ont pas été modifiés. Six tests de réglages de thème de site échouaient déjà avant ce travail.
