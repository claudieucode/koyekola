# Guide : construire un modèle de pied de page v2 (pour les 99 autres)

Date : 9 novembre 2026. Branche `footer-v2-etude`. Lecteur : l'agent (ou le développeur) qui transforme UNE fiche de `docs/footer-v2/concepts/concepts.json` en modèle de la bibliothèque v2.
Modèle de référence, déjà construit et testé : **`ft2-017-phrase-de-lancement`** (fichier `src/themeBuilder/catalog/footer/v2/familles/saas-tech-startup.js`). Copiez-le, ne le réécrivez pas.
Légende : **[exécuté]** = vu dans un vrai Chrome / un vrai test ; **[lu]** = lu dans le code, non exécuté.

## 1. Ce que fait la v2 (en 6 lignes)

* 100 modèles, 14 familles (celles de `CONCEPTS_100.md`), un fichier par famille : `src/themeBuilder/catalog/footer/v2/familles/<famille>.js`.
* Chaque modèle est **indépendant du site** : il déclare `ftMode: "solo"` (inséré avec `<footer data-kw-ft="solo">` après `</main>`), ses **propres couleurs** (hexadécimal), ses **propres polices** (bibliothèque auto-hébergée `font.<nom>`) et ses jetons locaux `--ft-*` (posés sur la racine du pied pour les widgets partagés). Ni `token:…` ni `var(--kw-…)` : un test le vérifie.
* On **étend le moteur existant** (`footer/moteur.js`) : pas de second moteur. Le kit v2 (`footer/v2/kit-v2.js`) ajoute l'identité propre, les « gestes forts » et un `modeleV2()` qui valide tout de suite.
* **La liste publique ne change pas** tant que les 14 familles ne sont pas toutes `built` (100 modèles). Pour VOIR un modèle v2 dans la bibliothèque avant : variable d'environnement de test `FOOTER_V2_APERCU=1` (voir §8).
* Les fiches de concept sont des **idées sur papier** : on respecte la direction artistique, pas chaque chiffre (les contrastes sont recalculés, les tailles adaptées au moteur, §7).
* Rien d'inventé : pas de coordonnées, pas de chiffres, pas de témoignages faux ; tout ce qui est « exemple » est dit dans le code (commentaire) et reste modifiable dans l'éditeur.

## 2. Pas à pas : de la fiche au modèle

1. **Lire la fiche** (`concepts.json`, entrée `c-NNN-…` ; ou `CONCEPTS_100.md`) : direction artistique, composition, couleurs (`couleurs.*`), typographies, responsive (390 / 820 / 1280), `particulariteGraphique`, `risquesTechniques`, widgets.
2. **Choisir l'identifiant** : `ft2-<NNN>-<slug du concept>` (ex. `c-017-phrase-de-lancement` → `ft2-017-phrase-de-lancement`) ; `identifiantV2(17, "phrase-de-lancement")`. Stable, jamais réutilisé, 80 caractères au plus ; `concept` = l'identifiant de la fiche (le test vérifie la correspondance).
3. **Écrire l'identité** avec `identite({...})` (§4) : palette complète + polices + formes. Elle vérifie les contrastes AA et lève une erreur claire sinon.
4. **Composer** avec `compose(k, env, G)` (§5) : `G.racine(k, [G.bande(k, [...])])`. Pour un pied simple, on peut aussi écrire `structure: { rows: [C(), L(), T(), Z(), A()] }` comme la bibliothèque actuelle (le moteur les transforme en bandes).
5. **Déclarer le modèle** avec `modeleV2({...}, FAM)` et l'ajouter à `models` du module de famille ; ne passer `built: true` que lorsque `models.length === target`.
6. **Mesurer** (§9) : 0 défaut sur 5 largeurs × avec/sans données ; **ouvrir les captures** (390 et 1280 au minimum) et les regarder pour de vrai.
7. **Itérer** jusqu'à la note A (§11) : un modèle « sans défaut mesurable » n'est pas forcément beau.

## 3. L'API du kit v2 (`require("../kit-v2")`)

| Nom | Rôle |
|---|---|
| `identite({ key, label, humeur, fond, texte, discret, accent, surface, police, titres, rayon, rayonBouton, ombre, poids, casse, suivi, filet, remplissage, ecart, bouton, bordure, ligne, encre, surEncre })` | Identité propre (palette + polices + formes). `key` : minuscules/chiffres/tirets, unique. Les couleurs sont `#rrggbb`. `discret` = texte secondaire (relevé automatiquement s'il est illisible sur le fond OU la surface). Renvoie aussi `ftVars` (jetons `--ft-*`). |
| `police(id)` / `pile(id)` | Vérifie qu'une police existe (`font.<nom>`) / donne la pile CSS. |
| `modeleV2(modèle, famille)` | Valide immédiatement (identifiant, fiche, famille, nom ≤ 80, description 40–280, étiquettes, `compose` ou `structure`). |
| `identifiantV2(n, slug)` | `ft2-017-…`. |
| `G.racine(k, bandes)` | Le conteneur pleine largeur qui porte les bandes. |
| `G.bande(k, enfants, { fond, degrade:{from,to,angle}, padV:[bureau,tablette,mobile], padH:[…], padB (marge basse), max, filetHaut:{epaisseur,couleur}, colonne, gap, aligne, innerMobile, nom })` | UNE bande pleine largeur (fond de bord à bord) et son contenu centré. |
| `G.colonne(k, enfants, { poids, min, base, aligne, gap, soi, extra, tablette, mobile })` / `G.ligne(k, enfants, { gap, aligne, justifie, largeur, tablette, mobile })` | Colonne flexible / rangée qui passe à la ligne. `gap: "20px 48px"` = ligne × colonne (`G.gaps`). |
| `G.geant(html, { taille:[min,max], lh, suivi, poids, police, couleur })` | La phrase ou le nom MONUMENTAL (texte fluide borné 8–200 px, interligne serré). `html` : `<p>…</p>`, `<br>`, `<span style="color:#hex">`. |
| `G.texteFluide`, `G.libelle`, `G.phrase`, `G.filet` | Texte fluide général, petit libellé en capitales, texte courant, filet court (ou pleine largeur). |
| `G.lienFleche(label, url, opts)` / `G.reseauxTexte([[nom, url]…])` | Nom suivi d'une flèche ↗ qui glisse de 4 px au survol/focus. |
| `G.pilule`, `G.pilules([[label, url]…], opts)` | Liens en pilules de 44 px (contour, survol plein). |
| `G.liens`, `G.indexNumerote`, `G.boutons(a, b)`, `G.pastille(s)` | Liens simples, index numéroté, deux boutons côte à côte, étiquettes arrondies (copiés des aides locales des familles actuelles, généralisés). |
| `G.chiffres`, `G.carte`, `G.cadre`, `G.nomRogne`, `G.ruban` | Bande de chiffres (exemples), carte « décollée » sur aplat, cadre à filet, nom monumental rogné en bas, ruban statique de mots. |
| `G.abonnement({ titre, intro, bouton, largeur, soulignement, … })` | Widget e-mail (`emailsubscribe`) habillé aux couleurs du modèle, **état « non configuré » honnête**. |
| `G.ligneLegale({ sansCookies })` | Copyright automatique + liens légaux (jamais de lien mort). `sansCookies: true` : seulement les pages légales renseignées ; « Cookies » reste dans la ligne légale de la plateforme (ajoutée sous le pied) : évite le doublon. |
| `G.code("socials:x+instagram")`, `G.cote([...])` | N'importe quel élément en texte du moteur (menu, contact, hours, legallinks…) fini par le moteur. |
| `G.fini(k, nœud, états)` | Applique la finition du moteur (états, 44 px mobile) PUIS vos états de survol/focus (le moteur écrase `states` d'un lien : toujours appeler `fini`). |

Un geste renvoie une fonction `(k, env, center) => nœud` : dans `compose`, on l'appelle `G.pilules(...)(k, env)` ; dans une rangée `structure`, on le met tel quel. `k` = le kit de construction (`k.row`, `k.col`, `k.T`, `k.H`, `k.B`, `k.LINK`, `k.W`, `k.divider`, `k.card`…, voir `catalog/kit.js`).

## 4. Jetons, couleurs, indépendance

* `identite()` fabrique `ftVars` : `--ft-bg --ft-bg-alt --ft-text --ft-muted --ft-accent --ft-on-accent --ft-req --ft-font --ft-font-head --ft-radius --ft-radius-btn`. Le catalogue les copie dans `section.ftVars` ; la racine du pied les lit et les relie aux variables que les widgets partagés utilisent (table `FT_TO_KW`, `footerFrontier.js`). **Les widgets (e-mail, contact, horaires…) prennent donc la palette du modèle.**
* Dans vos nœuds : **toujours des couleurs `#rrggbb`** (ou `#rrggbbaa`) lues dans `k.S` (`S.bg S.fg S.mute S.alt S.accent S.onAccent S.line`). Jamais `token:…`, jamais `var(--kw-…)`, jamais `fontFamily: "heading"|"body"|"system"` : test d'indépendance `footer-v2-bibliotheque`.
* `racine: { desktop: { backgroundColor: "#…", gap: "0px" } }` (champ du modèle) : style de la balise `<footer>` elle-même. **Indispensable** si le modèle a un fond coloré : la ligne légale de la plateforme (« Nom du site · Cookies ») est ajoutée DANS le `<footer>` après vos bandes ; elle prend la couleur de fond de votre dernière bande, mais sans `gap: 0px` une bande blanche de 16 px apparaît entre les deux. Terminez un dégradé par la couleur de fond de la racine.
* Contrastes : texte ≥ 4,5:1 (3:1 si ≥ 24 px), sur **toutes** les extrémités d'un dégradé. Le test calcule chaque texte contre le fond de sa bande (dégradé compris) ; le script de mesure Chrome ne regarde que `background-color`.

## 5. Polices disponibles

La plateforme embarque **1 775 familles** (`public/fonts/library/`, auto-hébergées, libres) : aucune requête vers un site tiers. On les cite par `font.<nom-en-minuscules-avec-tirets>` (`font.unbounded`, `font.instrument-serif`…). Les `@font-face` sont livrés avec la page **publique, l'aperçu et l'éditeur** pour les familles citées par les styles du modèle ET par `--ft-font` / `--ft-font-head` ; la police du modèle ne dépend donc jamais de celle du site [exécuté : test d'indépendance + éditeur + page publique, voir rapport].
**Les 123 polices des 100 concepts sont TOUTES disponibles** (aucune substitution nécessaire). Voir aussi `public/js/font-manager.js` (sélecteur de l'éditeur) et `src/utils/fontLibrary.js`.
Limites : (1) fichiers « latin » seulement : accents français OK, mais les flèches `↗ →` et symboles hors Latin-1 retombent sur la police du système (acceptable ; ne jamais dépendre d'un glyphe rare) ; (2) polices variables : toutes les graisses d'une plage ; polices statiques : seulement les graisses listées ; (3) la taille d'une police variable chargée pèse (≈ 30–100 Ko par famille) : 2 familles par modèle au plus.

| Police (concept) | Identifiant | Concepts | Type | Graisses | Catégorie |
|---|---|---|---|---|---|
| Inter | `font.inter` | 9 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Figtree | `font.figtree` | 5 | variable | 300 400 500 600 700 800 900 | sans-serif |
| Karla | `font.karla` | 5 | variable | 200 300 400 500 600 700 800 | sans-serif |
| Lato | `font.lato` | 5 | statique | 100 300 400 700 900 | sans-serif |
| Manrope | `font.manrope` | 5 | variable | 200 300 400 500 600 700 800 | sans-serif |
| Work Sans | `font.work-sans` | 5 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Archivo | `font.archivo` | 4 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Cormorant Garamond | `font.cormorant-garamond` | 4 | variable | 300 400 500 600 700 | serif |
| Hanken Grotesk | `font.hanken-grotesk` | 4 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Jost | `font.jost` | 4 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Mulish | `font.mulish` | 4 | variable | 200 300 400 500 600 700 800 900 | sans-serif |
| Source Sans 3 | `font.source-sans-3` | 4 | variable | 200 300 400 500 600 700 800 900 | sans-serif |
| Hind | `font.hind` | 3 | statique | 300 400 500 600 700 | sans-serif |
| IBM Plex Mono | `font.ibm-plex-mono` | 3 | statique | 100 200 300 400 500 600 700 | monospace |
| Nunito Sans | `font.nunito-sans` | 3 | variable | 200 300 400 500 600 700 800 900 | sans-serif |
| Syne | `font.syne` | 3 | variable | 400 500 600 700 800 | sans-serif |
| Albert Sans | `font.albert-sans` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Archivo Narrow | `font.archivo-narrow` | 2 | variable | 400 500 600 700 | sans-serif |
| Atkinson Hyperlegible | `font.atkinson-hyperlegible` | 2 | statique | 400 700 | sans-serif |
| DM Sans | `font.dm-sans` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Epilogue | `font.epilogue` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Fraunces | `font.fraunces` | 2 | variable | 100 200 300 400 500 600 700 800 900 | serif |
| IBM Plex Sans | `font.ibm-plex-sans` | 2 | variable | 100 200 300 400 500 600 700 | sans-serif |
| Instrument Sans | `font.instrument-sans` | 2 | variable | 400 500 600 700 | sans-serif |
| Instrument Serif | `font.instrument-serif` | 2 | statique | 400 | serif |
| Inter Tight | `font.inter-tight` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| JetBrains Mono | `font.jetbrains-mono` | 2 | variable | 100 200 300 400 500 600 700 800 | monospace |
| Lexend | `font.lexend` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Libre Franklin | `font.libre-franklin` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Noto Sans | `font.noto-sans` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Nunito | `font.nunito` | 2 | variable | 200 300 400 500 600 700 800 900 | sans-serif |
| Onest | `font.onest` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Open Sans | `font.open-sans` | 2 | variable | 300 400 500 600 700 800 | sans-serif |
| Outfit | `font.outfit` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Playfair Display | `font.playfair-display` | 2 | variable | 400 500 600 700 800 900 | serif |
| Public Sans | `font.public-sans` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Red Hat Display | `font.red-hat-display` | 2 | variable | 300 400 500 600 700 800 900 | sans-serif |
| Roboto Condensed | `font.roboto-condensed` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Source Serif 4 | `font.source-serif-4` | 2 | variable | 200 300 400 500 600 700 800 900 | serif |
| Space Grotesk | `font.space-grotesk` | 2 | variable | 300 400 500 600 700 | sans-serif |
| Unbounded | `font.unbounded` | 2 | variable | 200 300 400 500 600 700 800 900 | sans-serif |
| Urbanist | `font.urbanist` | 2 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Zilla Slab | `font.zilla-slab` | 2 | statique | 300 400 500 600 700 | serif |
| Alegreya | `font.alegreya` | 1 | variable | 400 500 600 700 800 900 | serif |
| Alegreya Sans | `font.alegreya-sans` | 1 | statique | 100 300 400 500 700 800 900 | sans-serif |
| Andika | `font.andika` | 1 | statique | 400 700 | sans-serif |
| Anton | `font.anton` | 1 | statique | 400 | sans-serif |
| Archivo Black | `font.archivo-black` | 1 | statique | 400 | sans-serif |
| Assistant | `font.assistant` | 1 | variable | 200 300 400 500 600 700 800 | sans-serif |
| Bagel Fat One | `font.bagel-fat-one` | 1 | statique | 400 | display |
| Barlow | `font.barlow` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Barlow Condensed | `font.barlow-condensed` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Barlow Semi Condensed | `font.barlow-semi-condensed` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Be Vietnam Pro | `font.be-vietnam-pro` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Bebas Neue | `font.bebas-neue` | 1 | statique | 400 | sans-serif |
| Bitter | `font.bitter` | 1 | variable | 100 200 300 400 500 600 700 800 900 | serif |
| Bodoni Moda | `font.bodoni-moda` | 1 | variable | 400 500 600 700 800 900 | serif |
| Bowlby One | `font.bowlby-one` | 1 | statique | 400 | display |
| Bricolage Grotesque | `font.bricolage-grotesque` | 1 | variable | 200 300 400 500 600 700 800 | sans-serif |
| Cabin | `font.cabin` | 1 | variable | 400 500 600 700 | sans-serif |
| Cardo | `font.cardo` | 1 | statique | 400 700 | serif |
| Caveat | `font.caveat` | 1 | variable | 400 500 600 700 | cursive |
| Caveat Brush | `font.caveat-brush` | 1 | statique | 400 | cursive |
| Chivo | `font.chivo` | 1 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Comfortaa | `font.comfortaa` | 1 | variable | 300 400 500 600 700 | display |
| Cormorant SC | `font.cormorant-sc` | 1 | statique | 300 400 500 600 700 | serif |
| Crimson Pro | `font.crimson-pro` | 1 | variable | 200 300 400 500 600 700 800 900 | serif |
| Dela Gothic One | `font.dela-gothic-one` | 1 | statique | 400 | display |
| DM Mono | `font.dm-mono` | 1 | statique | 300 400 500 | monospace |
| DM Serif Display | `font.dm-serif-display` | 1 | statique | 400 | serif |
| DM Serif Text | `font.dm-serif-text` | 1 | statique | 400 | serif |
| EB Garamond | `font.eb-garamond` | 1 | variable | 400 500 600 700 800 | serif |
| Familjen Grotesk | `font.familjen-grotesk` | 1 | variable | 400 500 600 700 | sans-serif |
| Fira Sans | `font.fira-sans` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Fira Sans Condensed | `font.fira-sans-condensed` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Fredoka | `font.fredoka` | 1 | variable | 300 400 500 600 700 | sans-serif |
| Geist | `font.geist` | 1 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Geist Mono | `font.geist-mono` | 1 | variable | 100 200 300 400 500 600 700 800 900 | monospace |
| Gelasio | `font.gelasio` | 1 | variable | 400 500 600 700 | serif |
| Gentium Plus | `font.gentium-plus` | 1 | statique | 400 700 | serif |
| Gloock | `font.gloock` | 1 | statique | 400 | serif |
| Homemade Apple | `font.homemade-apple` | 1 | statique | 400 | cursive |
| Italiana | `font.italiana` | 1 | statique | 400 | sans-serif |
| League Gothic | `font.league-gothic` | 1 | statique | 400 | sans-serif |
| Libre Baskerville | `font.libre-baskerville` | 1 | variable | 400 500 600 700 | serif |
| Libre Caslon Text | `font.libre-caslon-text` | 1 | statique | 400 700 | serif |
| Literata | `font.literata` | 1 | variable | 200 300 400 500 600 700 800 900 | serif |
| Lora | `font.lora` | 1 | variable | 400 500 600 700 | serif |
| M PLUS Rounded 1c | `font.m-plus-rounded-1c` | 1 | statique | 100 300 400 500 700 800 900 | sans-serif |
| Major Mono Display | `font.major-mono-display` | 1 | statique | 400 | monospace |
| Mali | `font.mali` | 1 | statique | 200 300 400 500 600 700 | cursive |
| Marcellus | `font.marcellus` | 1 | statique | 400 | serif |
| Martian Mono | `font.martian-mono` | 1 | variable | 100 200 300 400 500 600 700 800 | monospace |
| Merriweather | `font.merriweather` | 1 | variable | 300 400 500 600 700 800 900 | serif |
| Michroma | `font.michroma` | 1 | statique | 400 | sans-serif |
| Montserrat | `font.montserrat` | 1 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Newsreader | `font.newsreader` | 1 | variable | 200 300 400 500 600 700 800 | serif |
| Noto Serif | `font.noto-serif` | 1 | variable | 100 200 300 400 500 600 700 800 900 | serif |
| Oswald | `font.oswald` | 1 | variable | 200 300 400 500 600 700 | sans-serif |
| Overpass | `font.overpass` | 1 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Plus Jakarta Sans | `font.plus-jakarta-sans` | 1 | variable | 200 300 400 500 600 700 800 | sans-serif |
| Poppins | `font.poppins` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Prata | `font.prata` | 1 | statique | 400 | serif |
| Quicksand | `font.quicksand` | 1 | variable | 300 400 500 600 700 | sans-serif |
| Raleway | `font.raleway` | 1 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Reenie Beanie | `font.reenie-beanie` | 1 | statique | 400 | cursive |
| Roboto Mono | `font.roboto-mono` | 1 | variable | 100 200 300 400 500 600 700 | monospace |
| Roboto Slab | `font.roboto-slab` | 1 | variable | 100 200 300 400 500 600 700 800 900 | serif |
| Rubik | `font.rubik` | 1 | variable | 300 400 500 600 700 800 900 | sans-serif |
| Rubik Mono One | `font.rubik-mono-one` | 1 | statique | 400 | sans-serif |
| Saira | `font.saira` | 1 | variable | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Saira Extra Condensed | `font.saira-extra-condensed` | 1 | statique | 100 200 300 400 500 600 700 800 900 | sans-serif |
| Schibsted Grotesk | `font.schibsted-grotesk` | 1 | variable | 400 500 600 700 800 900 | sans-serif |
| Share Tech Mono | `font.share-tech-mono` | 1 | statique | 400 | monospace |
| Sora | `font.sora` | 1 | variable | 100 200 300 400 500 600 700 800 | sans-serif |
| Source Code Pro | `font.source-code-pro` | 1 | variable | 200 300 400 500 600 700 800 900 | monospace |
| Space Mono | `font.space-mono` | 1 | statique | 400 700 | monospace |
| Spectral | `font.spectral` | 1 | statique | 200 300 400 500 600 700 800 | serif |
| Staatliches | `font.staatliches` | 1 | statique | 400 | display |
| Teko | `font.teko` | 1 | variable | 300 400 500 600 700 | sans-serif |
| Titillium Web | `font.titillium-web` | 1 | statique | 200 300 400 600 700 900 | sans-serif |
| Vollkorn | `font.vollkorn` | 1 | variable | 400 500 600 700 800 900 | serif |
| Young Serif | `font.young-serif` | 1 | statique | 400 | serif |

## 5 bis. Polices d'affichage : TEST DE RENDU OBLIGATOIRE

**Pourquoi.** Le modèle de référence utilisait d'abord Unbounded (police du concept). À 150 px, le « a », le « à », le « ê » et la barre du « e » avaient des **encoches et fentes parasites**. Cause isolée [exécuté] : ce n'est **pas** un réglage CSS. Le même défaut apparaît (1) dans un Chrome sans aucune règle de la plateforme, (2) avec `text-rendering: geometricPrecision`, `optimizeLegibility`, `-webkit-font-smoothing`, `font-optical-sizing: none`, `will-change`, `translateZ(0)`, graisse 650, ligatures et crénage coupés, contour `-webkit-text-stroke` (aucun n'a changé quoi que ce soit), et (3) avec **FreeType (Pillow)** hors navigateur : les contours du fichier variable `unbounded/latin-wght-normal.woff2` (axe 200-900) sont pincés dès ~500 de graisse. Ce n'est pas la synthèse de graisse (le fichier couvre 200-900). **On ne le corrige donc pas en CSS : on change de police** (ou de graisse).

**Règle.** Avant d'adopter une police d'affichage (grand corps, ≥ 80 px, graisse ≥ 600), la tester :
1. Écrire une page de test avec les `@font-face` de `fontLib.faceCss(fontLib.byId("font.<nom>"))`, le mot `Prêts à lancer ? é ê` (accents, « a », « e », « n », « ? ») à **150 px**, dans la graisse voulue, en blanc sur fond uni foncé.
2. Capturer (CDP, `screenshot`) et **zoomer** : chercher traits clairs qui coupent une lettre, encoches à la jonction panse/hampe (« a », « n »), fentes dans la barre du « e », bords en dents de scie.
3. Si doute : même rendu avec FreeType (Pillow `ImageFont.set_variation_by_axes([graisse])`) : si le défaut y est aussi, il vient du fichier.
4. Garder la capture dans les notes du modèle ; passer à une police propre sinon.

**Résultats [exécuté, à l'œil sur captures de 80 à 150 px, accents compris].**
* PROPRES : Sora 800 (choisie pour la référence), Lexend 800, Outfit 800, Plus Jakarta Sans 800, Archivo 800 (variable), Syne 800 (très large), Bricolage Grotesque 800, Space Grotesk 700, Playfair Display 900, Fraunces 900, Bodoni Moda 900, DM Serif Display, Instrument Serif, Young Serif, Bebas Neue, Anton, League Gothic, Staatliches, Teko 700, Michroma, Unbounded **400 seulement** (encoche déjà discrète).
* AVEC ARTEFACTS (ne pas utiliser en grand corps) : **Unbounded ≥ 500** (encoches « a », « à », « n », fente du « e »), **Dela Gothic One** (fentes dans les « e », contours irréguliers), **Archivo Black** (fine fente claire dans la barre du « e »), **Bowlby One** (contours irréguliers et fentes : dessin « craquelé »).
* NON testées en grand corps : toutes les autres des 1 775 familles (dont celles des concepts de `CONCEPTS_100.md` qui n'apparaissent pas ci-dessus : à tester avec la méthode). Cette liste n'est pas une garantie : relancer le test pour toute police choisie.
**Substitution faite** : concept c-017 « Unbounded » → **Sora 800** (géométrique, sans fioriture, rendu propre, même esprit « startup »). Tout modèle dont le concept cite une police défectueuse prend une police propre voisine et le note dans son commentaire.

## 6. Règles de qualité (ce qui distingue « premium » de « correct »)

Tirées de `MARKETPLACES_ANALYSE.md` (17 principes) et de ce qu'on a vu sur la référence :
1. **Un geste fort, un seul** par pied (phrase géante, nom rogné, cadre, ruban…) ; tout le reste est discret. Contraste d'échelle ≥ 8 : 150 px contre 12 px.
2. **Hiérarchie lisible en 2 secondes** : 1 chose regardée en premier, 1 action claire.
3. **Détails** : filet court d'accent, flèches ↗, pilules de 44 px, libellés en capitales espacées 12 px, filets fins `#ffffff40`, états de survol qui bougent de 4 px.
4. **Respiration** : marges verticales 96–120 px bureau, 64 px mobile ; rythme de 8 px.
5. **Responsive pensé**, pas réduit : à chaque largeur, dire ce qui change vraiment (ordre, nombre de colonnes, taille du geste, flux des pilules). Les tailles fluides (`taille:[min,max]`) évitent les débordements à 1920 px.
6. **Newsletter honnête** : jamais de faux champ ; sans formulaire publié, le widget dit « non configuré » (style discret) et la publication n'est pas bloquée.
7. **Données** : aucune coordonnée inventée (widgets de Données de l'entreprise), chiffres marqués « exemple », réseaux avec adresse d'exemple modifiable.
8. **Accessibilité** : AA, cibles ≥ 44 px sur mobile, contour de focus ≥ 2 px visible sur CHAQUE élément interactif, mouvement réduit respecté (la frontière de pied coupe les transitions), ordre de lecture = ordre visuel.
9. **Un seul `<footer>`**, après `</main>`, pleine largeur ; pas d'image ni de script ; pas de second moteur.
10. **Description** : 40–280 caractères, concrète, sans jargon ; nom unique (≤ 80).

## 7. Limites du moteur découvertes (à connaître avant de se tromper)

1. `gap` n'accepte **qu'une valeur** : utiliser `rowGap` / `columnGap` (`G.gaps("20px 48px")`). `normalizeStyleSet` refuse le reste en clair (c'est le nettoyeur qui vous le dit, au premier test).
2. Texte riche : balises `p br strong em span a…` ; `span` n'accepte que `color` / `background-color` (hex), **pas de taille** en ligne. Le titre (`heading`) est du texte brut : pour un mot en couleur, utiliser un nœud `text` avec `<span style="color:#…">` (cas du modèle de référence). `&nbsp;` devient une vraie espace insécable.
3. Parties de widget : la partie « message non configuré » du widget e-mail n'accepte **que le texte** (pas de bordure ni de fond) ; il n'y a pas de partie pour l'étiquette du champ ; le champ e-mail et le bouton acceptent texte, fond, bordure, espacement.
4. Le moteur **écrase les `states`** d'un lien/bouton (`finishNode`) : poser vos états avec `G.fini(k, n, états)`.
5. Taille fluide : bornes 8–200 px, interpolation linéaire 320 → 1440 px ; **au-delà de 200 px** (nom rogné « 24 rem ») il faut `vw` fixe ou accepter 200 px.
6. `menu` (menu affecté « Pied de page ») ne montre rien si aucun menu n'est affecté : un modèle premium par défaut utilise des liens explicites vers `LIENS_PLATEFORME` (`/blog /faq /contact /connexion …`) ; le menu affecté reste possible en plus.
7. Le widget Réseaux sociaux ne sait faire que des **icônes** : pour des noms suivis d'une flèche, `G.reseauxTexte` (liens vers la page d'accueil du réseau, à remplacer).
8. La ligne légale de la plateforme est ajoutée **dans** le `<footer>` après vos bandes (voir §4, `racine`) ; elle reprend `backgroundColor` / `color` de la dernière bande (pas le dégradé).
9. Les états de survol d'une **partie** de widget se limitent à `hover` / `focus`.
10. **Bogues corrigés au passage** (fichiers partagés, mesurés avant/après) : le champ-piège « Ne pas remplir » du widget e-mail était visible dans TOUS les pieds (règle `.hp-field` absente de `landing.css` pour `.kw-emailsub-form`) ; l'astérisque « obligatoire » était rouge foncé quelle que soit la couleur du pied (`--ft-req`, repli inchangé).
11. Le pilote Chrome de test ne capturait pas une zone plus basse que la fenêtre : `screenshot(clip)` utilise désormais `captureBeyondViewport`.
12. Les modèles v2 sont insérés en `solo` : leur **mode** est modifiable ensuite (Theme Builder › « Apparence du pied… ») ; « Revenir au modèle d'origine » remet `solo` + les jetons du modèle.

## 8. Commandes : tester, mesurer, capturer, voir

```
# 1) contrôles rapides, sans serveur (à relancer à chaque modèle)
node --test --test-concurrency=1 tests/footer-v2-bibliotheque.test.js

# 2) mesure Chrome : 5 largeurs (390 820 1280 1440 1920) × avec/sans données d'entreprise, captures PNG
TEST_START_TIMEOUT_MS=900000 node scripts/audit-pieds-cdp.js --v2 --id=ft2-017-phrase-de-lancement --captures=/tmp/v2 --sortie=/tmp/v2.json
#   --v2 : modèles v2 (active FOOTER_V2_APERCU) ; --famille=saas-tech-startup ; --id=ft2-… ; --largeurs=390,1280 ; --donnees=avec ; --max=40
#   les captures montrent le pied ENTIER (pas seulement la fenêtre) : OUVRIR au moins 390 et 1280 avec l'outil Read et décrire ce qu'on voit

# 3) page publiée, focus clavier, cibles 44 px, survol, mouvement réduit, polices chargées (vrai serveur, vrai Chrome)
TEST_START_TIMEOUT_MS=900000 FOOTER_V2_ONLY=ft2-017-phrase-de-lancement node --test --test-concurrency=1 tests/footer-v2-navigateur.test.js

# 4) INDÉPENDANCE : scénario en 10 étapes (site marine → insertion → couleurs, polices, échelle, « Global », boutons, 4 thèmes maille/noir/sape/volt → republication) : 0 propriété modifiée
FOOTER_ISO_V2=1 TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/footer-isolation.test.js

# 5) ÉDITEUR RÉEL : texte, adresse, couleur, espacement, ajout/déplacement/duplication/suppression de widget, enregistrer, recharger, aperçu, publier + identité intacte + police dans le canevas et en public
FOOTER_EDIT_V2=1 FOOTER_EDIT_ONLY=ft2-017-phrase-de-lancement TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 tests/footer-comportements-editeur-navigateur.test.js

# 6) VOIR le modèle dans la bibliothèque (liste, vignette, aperçu) : lancer le serveur avec la variable d'essai
FOOTER_V2_APERCU=1 npm start      # puis Theme Builder › Pied de page : les modèles v2 s'ajoutent à la liste actuelle (jamais en production)
```
Si Chrome ne démarre pas sous charge : relancer SEUL (un fichier à la fois, jamais en parallèle). Les tests ne laissent aucun Chrome vivant (`close()` tue le groupe de processus). Pas de `rm` : `git rm` / `git mv`.

## 9. Pièges rencontrés (et comment les éviter)

* « Aucun défaut mesuré » ≠ « beau » : regardez les captures. Sur la référence, les 10 mesures étaient à 0 défaut dès la première version alors que la phrase se touchait (`-0.045em` trop serré pour Unbounded) et que la ligne légale était blanche sous un pied violet : seule la capture l'a montré.
* **Les mesures ne voient pas les défauts de dessin d'une police** (encoches, fentes) : seul un zoom sur la capture les montre. Voir §5 bis (test de rendu obligatoire).
* Une capture qui s'arrête à la hauteur de la fenêtre n'est pas le pied entier (corrigé, §7.11).
* La ligne légale de la plateforme et le `gap: 16px` de la racine (§4).
* Une police absente : `police()` lève une erreur au chargement du module (pas à l'affichage).
* Un contraste calculé sur `background-color` seul ignore les dégradés : le test v2 les prend en compte.
* L'état « formulaire publié » et l'état « non configuré » sont **deux rendus différents** : regarder les deux (pour voir l'état « formulaire publié » : `forms.createForm(ctx, { name, fields: [], consentText, siteId })` puis `forms.setStatus(ctx, id, "published")`, exemple dans `tests/footer-v2-navigateur.test.js`).
* Le moteur ajoute des cibles de 44 px sur mobile aux liens/boutons qu'il connaît ; pour un nœud construit à la main, passer par `G.fini` ou donner `minHeight: "44px"`.

## 10. Checklist « excellent » (cocher avant de passer le modèle en A)

- [ ] Identité propre : palette, polices (≤ 2 familles), rayons ; contrastes AA (`identite()` ne lève pas d'erreur).
- [ ] Un geste fort lisible en 2 secondes ; contraste d'échelle ≥ 8 ; détails (filets, flèches, pilules, libellés).
- [ ] Capture 1280 ET 390 ouvertes, décrites honnêtement ; tout est à sa place, rien ne se touche, rien n'est coupé.
- [ ] Responsive : à 390 / 820 / 1280 on sait dire ce qui CHANGE (pas juste ce qui rétrécit).
- [ ] Newsletter : état « non configuré » élégant ET état « formulaire publié » vérifiés.
- [ ] Mesure Chrome : 0 défaut, 5 largeurs × avec/sans données.
- [ ] Focus visible partout, cibles ≥ 44 px, mouvement réduit, ordre de lecture.
- [ ] `ftMode: "solo"` ; aucun `token:` ni `var(--kw-`; polices chargées sur la page publique, l'aperçu et l'éditeur.
- [ ] Scénario d'indépendance : 0 propriété modifiée ; éditeur réel : identité intacte.
- [ ] Textes en français simple, aucune donnée inventée, exemples signalés.
- [ ] `tests/footer-v2-bibliotheque.test.js` vert (similarité ≤ 0,85 avec les autres modèles, v2 et actuels).

## 11. Rubrique de notation (A / B / C)

Chaque ligne vaut 0 (absent), 1 (correct), 2 (excellent). Total /20.

| # | Critère | 2 points si… |
|---|---|---|
| 1 | Fidélité à la fiche | la direction artistique, la composition et le geste du concept sont reconnaissables |
| 2 | Contraste d'échelle et hiérarchie | un élément domine nettement, le reste est discret |
| 3 | Finitions | filets, flèches, pilules, états de survol, libellés soignés |
| 4 | Palette et polices propres | 2 familles au plus, harmonieuses, AA partout |
| 5 | Responsive pensé | 390 / 820 / 1280 se distinguent par leur composition |
| 6 | Newsletter / appel | honnête dans les deux états, élégante |
| 7 | Accessibilité | focus, 44 px, mouvement réduit, ordre |
| 8 | Indépendance | scénario 0 propriété modifiée, polices chargées partout |
| 9 | Données et honnêteté | rien d'inventé, exemples signalés |
| 10 | Mesure | 0 défaut Chrome, captures regardées |

**A** : ≥ 18 et aucun 0 → on passe au suivant. **B** : 14–17 ou un seul 0 non bloquant → corriger puis re-noter. **C** : < 14, ou un défaut bloquant (illisible, débordement, lien mort, donnée inventée, dépendance au site) → refaire. Le modèle de référence est noté **A** (voir le rapport de la phase 3).

## 12. Exemple annoté : `ft2-017-phrase-de-lancement`

```js
// 1 · IDENTITÉ — palette et polices du CONCEPT (fond #4B2BFF, citron #CAFF3D), contrastes vérifiés par identite()
const orbito = identite({
  key: "c017", label: "Violet électrique et citron", humeur: "dark",
  fond: "#4b2bff", texte: "#ffffff", discret: "#d6d0ff", accent: "#caff3d", surface: "#6347ff",
  police: "font.inter", titres: "font.sora",                  // 2 familles auto-hébergées (Sora et non Unbounded : voir §5 bis)
  rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff40",
});                                                           // « discret » est relevé à #ebe8ff : #d6d0ff ne passe pas 4,5:1 sur la surface #6347ff

const phraseLancement = modeleV2({
  id: identifiantV2(17, "phrase-de-lancement"), concept: "c-017-phrase-de-lancement",
  name: "Phrase de lancement", family: "saas-tech-startup", description: "…(≤ 280)…", tags: [...],
  identity: orbito,
  racine: { desktop: { backgroundColor: "#4b2bff", gap: "0px" } },   // le <footer> : même fond que le bas du dégradé, pas de bande blanche avant la ligne légale du site
  widgets: ["text", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 2 · LE GESTE FORT : Sora 800, 64 → 180 px, interligne 0,95 ; « lancer ? » en citron (span coloré dans un nœud texte)
    const phrase = G.geant(`<p>Prêts&nbsp;à<br><span style="color:${S.accent}">lancer&nbsp;?</span></p>`, { taille: [64, 180], tablette: { taille: [110, 150] }, mobile: { taille: [64, 180] }, lh: 0.95, suivi: "-0.035em", poids: "800", police: S.head, couleur: S.fg })(k, env);
    // 3 · LE DÉTAIL : filet citron de 56 × 4 px au-dessus de la phrase
    const filetCitron = G.filet({ largeur: "56px", epaisseur: "4px" })(k, env);
    // 4 · LE CHAMP : widget e-mail habillé (soulignement citron, bouton pilule) ; « non configuré » honnête sans formulaire
    const abo = G.abonnement({ titre: "Newsletter", intro: "Recevez les nouveautés et les annonces de lancement.", bouton: "S'abonner", largeur: "440px" })(k, env);
    // 5 · COMPOSITION : 8/12 phrase, 4/12 champ ; filet vertical qui disparaît quand les deux zones s'empilent (mobile)
    const gauche = G.colonne(k, [filetCitron, phrase], { poids: 8, min: "300px", gap: "28px" });
    const droite = G.colonne(k, [abo], { poids: 4, min: "280px", soi: "flex-end", extra: { borderLeftWidth: "1px", borderStyle: "solid", borderColor: S.line, paddingLeft: "32px" }, mobile: { borderLeftWidth: "0px", paddingLeft: "0px" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "48px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 6 · LIGNE D'OUTILS : pilules (liens de la plateforme, jamais de lien mort) à gauche, réseaux « Nom ↗ » à droite
    // 7 · MENTIONS : copyright automatique + liens légaux, 12 px
    // 8 · LA BANDE : dégradé du violet clair au violet fond, 112 px de marge (88 tablette, 64 mobile)
    return [G.racine(k, [G.bande(k, [haut, filet, milieu, mentions], { colonne: true, gap: "44px", padV: ["112px", "88px", "64px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" }, degrade: { from: "#6347ff", to: "#4b2bff", angle: 200 } })])];
  },
}, "saas-tech-startup");
```
Ce qui change selon l'écran (ce modèle) : **1280** : phrase ≈ 172 px sur 2 lignes à gauche, champ à droite séparé par un filet vertical, pilules à gauche et réseaux à droite sur une ligne ; **820** : mêmes zones côte à côte, phrase ≈ 110-150 px, pleine ligne, champ dessous ; **390** : phrase ≈ 72 px puis champ pleine largeur (filet vertical supprimé, champ de 56 px de haut), pilules sur 2 lignes, réseaux sur une ligne, mentions empilées ; la marge verticale passe de 112 à 64 px.
