# Écrire la fiche d'un thème (bibliothèque Kolakisa)

Un fichier `specs/<categorie>.js` exporte un **tableau de fiches**. Chaque fiche décrit UN thème complet : ses jetons de design (couleurs, polices, formes), son « ADN » de mise en page et ses pages de démonstration, composées de **blocs** `[variante, paramètres]` définis dans `compose.js`.
Rien d'autre n'est écrit à la main : le moteur fabrique de vraies sections du Page Builder (validées, modifiables dans l'éditeur), les visuels (illustrations originales SVG) et les aperçus.

Vérifier : `node scripts/themes-check.js <clé> …` (pages validées par le moteur, contrastes WCAG AA, diversité). Voir : `PX_FULL=1 PX_OUT=/tmp/x NODE_PATH=<dossier node_modules avec playwright-core> node scripts/themes-previews.js <clé>` (une capture pleine page par page de démonstration → à regarder avec l'outil de lecture d'images).

## Fiche

```js
{
  key: "meridien",                 // minuscules, chiffres, tirets ; unique dans TOUTE la bibliothèque
  name: "Méridien",                // nom du thème (60 car. max)
  category: "entreprise",          // clé de catégorie (voir index.js : entreprise, agence, portfolio, boutique, restaurant, tourisme, immobilier, education, sante, tech, finance, mode, association, magazine, evenement, industrie, auto, agriculture, sport, createur, local)
  tags: ["classique", "editorial"],// 1 à 3 styles parmi : minimaliste editorial audacieux chaleureux sombre luxe ludique technique naturel classique moderne geometrique
  siteType: "Cabinet de conseil",  // type de site précis (affiché et cherché)
  description: "…",                // 1 à 2 phrases professionnelles (280 car. max) qui décrivent le DESIGN et l'usage
  featured: true,                  // facultatif : au plus 1 thème sur 6 (mis en avant)
  isNew: true,                     // facultatif
  modules: ["Boutique en ligne (module non installé)"],   // facultatif : modules dont une fonction dépend (honnêteté : voir règles)
  brand: "Cabinet Méridien",       // nom de marque FICTIF affiché dans l'en-tête et le pied de page
  tokens: {                        // jetons du design system (tous facultatifs sauf colors et fonts)
    colors: { primary, secondary, accent, background, surface, text, muted },   // #rrggbb ; contrastes AA obligatoires (text et muted sur background ET sur surface : 4,5 :1)
    fonts: { heading: "font.playfair-display", body: "font.inter", button: "font.inter", link: "font.inter" },  // identifiants de la bibliothèque (liste plus bas)
    radius: { sm, md, lg, button, field, card },   // 0 à 48 (px)
    shadow: { card: "none|sm|md|lg", button: "none|sm|md|lg" },
    type: { h1: { size: 56, weight: 800, lineHeight: 1.05, letterSpacing: -0.02, transform: "none|uppercase" }, h2: {…}, body: { size: 17 } },  // facultatif (letterSpacing en em)
    buttons: { paddingY: 14, paddingX: 28 }, border: { width: 1, color: "#d6e2ec" },
  },
  dna: { scale: "s|m|l|xl", pad: "tight|normal|airy", align: "left|center", shape: "sharp|soft|pill" },   // taille des titres, respiration, alignement, formes
  art: { seed: "meridien", motifs: ["arches", "skyline", "topo"] },   // motifs des visuels : dunes waves skyline mountains bokeh tiles botanical ribbons halftone arches plates topo rays blobs objects mesh
  head: ["head:bar", {}],          // variante d'en-tête (voir plus bas)
  foot: ["foot:columns", {…}],     // variante de pied de page
  menu: [["Accueil", "/"], ["Expertises", "/expertises"], …],   // chaque lien = une page du thème (« / » = accueil) ; 4 à 6 entrées
  cta: ["Prendre rendez-vous", "/contact"],                      // bouton d'action de l'en-tête
  contact: { address, phone, email, hours, tagline },            // coordonnées FICTIVES (email en .example)
  social: ["facebook", "instagram", "linkedin"],                 // facultatif
  pages: [ { key: "accueil", name: "Accueil", blocks: [ [variante, params], … ] }, … ],   // 1re page = « accueil » ; 4 à 6 pages ; « recherche » et « introuvable » sont ajoutées automatiquement
}
```

## Variantes et paramètres (tous les textes en français, concrets, propres au secteur)

Valeurs partagées : `cta: ["Libellé", "/page"]` (le lien est « /clé-de-page » d'une page du thème ou « /contact »), `items` = tableau, `bg` = `"token:surface"` / `"token:background"` / `"token:secondary"` pour alterner les fonds.

**En-têtes** `head:*` : `bar` (logo à gauche, menu et bouton à droite) · `center` (logo centré, menu dessous) · `split` (menu coupé de part et d'autre du logo) · `minimal` · `topbar` (bandeau d'infos au-dessus : `{info, note}`) · `float` (barre flottante arrondie) · `masthead` (bandeau de journal : `{dateline}`) · `dark` (bandeau foncé, filet d'accent) · `side` (logo + slogan, menu à droite).

**Bandeaux d'accueil** `hero:*` — params `{eyebrow?, title, sub, cta?, cta2?, image?, alt?, stats?: [["25 ans","d'expérience"],…], overlay?}` : `split` (texte + image à droite) · `split-left` (image à gauche, portrait) · `center` (centré, option `stats`) · `cover` (image plein bandeau + voile) · `gradient` (dégradé primaire→secondaire, option `angle`, `stats`) · `editorial` (énorme titre de presse + image panoramique ; `kicker`) · `framed` (carte blanche + carré) · `stacked` (texte puis grande image, `stats`) · `bleed` (fond secondaire, image 3/4) · `poster` (affiche : titre géant en capitales sur fond primaire) · `collage` (4 images décalées) · `minimal` (texte seul, très grand) · `search` (image + champ de recherche ; `placeholder`) · `countdown` (compte à rebours ; `until: "2030-06-01T18:00:00+02:00"`).

**Contenus** `feat:*` — params `{eyebrow?, title, intro?, items, bg?}` avec `items: [{t, x, icon?, link?, price?}]` : `cards` (cartes à icône) · `rows` (lignes numérotées titre / texte) · `numbered` (3 gros chiffres) · `alt` (alterné image / texte, 2 à 4 items ; `link: ["Voir","/page"]`) · `icons` (boîtes d'icônes à gauche) · `bento` (1 grande carte + 2 petites : 3 items) · `strips` (bandes horizontales) · `tabs` (onglets, 3 à 5 items) · `pricelist` (liste de prix : `price` obligatoire par item) · `accordion` (questions : t = question, x = réponse) · `steps` (chronologie ; `d` = repère) · `checks` (titre + bouton à gauche, liste à coches à droite ; `cta`) · `grid-icons` (grille d'icônes sans cartes, 3 à 4) · `compare` (tableau : `rows: [["", "Offre A", "Offre B"], ["Critère", "oui", "non"], …]`) · `list2` (liste à coches sur deux colonnes).

**Preuve** `proof:*` : `quotes` (`items: [{q, n, r}]`, 3 max ; les noms sont fictifs, `r` finit par « client fictif ») · `big` (une grande citation) · `stats` (`{title?, items: [["180","missions"], …]}` : tableaux `[valeur, libellé]`) · `statsbar` (idem sur bande primaire) · `team` (`items: [{n, r}]`, 3 à 4) · `logos` (`{title, items: ["Nom fictif", …]}`).

**Galeries** `gal:*` — `items: [{t, x?, tag?, price?}]` : `grid` · `masonry` · `cards` (image + badge `tag` + titre + texte) · `carousel` · `wall` (4 carrés) · `products` (4 produits : `price: "49 €"`) · `featured` (1 grande + 3 petites) · `strip` (5 carrés, `title`) · `listings` (biens/hébergements : `tag`, `price`, `x`) · `coursecards` (formations : `tag` = niveau, `price`, `x`, `cta`, `url`).

**Tarifs** `price:tiers` : `items: [{t, price, period?, x?, f: ["inclus 1", …], cta?, url?, hl?: true}]`.

**Appels à l'action** `cta:*` — `{title, sub?, cta, cta2?}` : `band` (bande primaire) · `split` (texte + boutons) · `image` (image + voile) · `card` (carte centrée).

**Contact** `contact:*` : `info` (coordonnées + carte d'invitation + formulaire ; `title`, `formTitle`, `formIntro`, `cta`) · `map` (`{title, mapAddress}` coordonnées + carte) · `cards` (une carte par coordonnée + formulaire). Les coordonnées viennent de `contact` de la fiche.

**Pieds de page** `foot:*` : `columns` (`{about, cols: [["Titre","lien","lien"], …]}`, 2 colonnes) · `simple` · `center` · `big` (grand nom de marque ; `title`) · `newsletter` (`{title, sub, button}`) · `line`.

**Pages et éléments divers** `misc:*` : `pagehead` (`{title, sub?, bg?}` titre de page + fil d'Ariane, à placer en tête de chaque page intérieure) · `text` (`{eyebrow?, title, paras: [..]}`) · `story` (texte + portrait : `{eyebrow?, title, paras, image?: "portrait-1"}`) · `posts` (derniers articles du blog du site : `{title, count, layout: "grid|list"}`) · `courses` (formations réelles du catalogue Kolakisa) · `search` · `hours` (`{title, rows: [["Lundi","9 h – 18 h"], …]}`) · `quote` (`{text, by}`) · `marquee` (`{items: ["Livraison offerte", …]}` bande d'annonces) · `product` (fiche produit : `{eyebrow?, title, price, text, points: [..], cta, url, cta2?, note?}`) · `article` (page d'article : `{tag, title, meta, paras, quote?, by?}`) · `menu` (carte de restaurant : `{eyebrow?, title, intro?, left: ["Entrées", [{t, x, price}]], right: ["Plats", [...]]}`) · `schedule` (programme : `{title, items: [{d: "9 h 30", t, x}]}`) · `faq` (`{title?, items: [{t, x}]}`) · `tiers`.

## Règles de qualité (non négociables)

1. **Chaque thème est une vraie proposition de design** : une identité (palette, paire de polices, formes), une composition d'accueil propre, des pages adaptées à son métier. Deux thèmes ne doivent pas partager la même suite de variantes d'accueil ni la même paire de polices (`heading`+`body`) ; variez en-têtes, bandeaux, contenus, pieds de page, fonds alternés, échelles de titres, alignements (left/center), formes (sharp/soft/pill), densité (tight/airy), titres en capitales ou non, motifs d'illustration.
2. **Palettes** : au moins une couleur franche par thème, très différentes d'un thème à l'autre (pas seulement la teinte : clair/sombre, chaud/froid, saturé/neutre). Textes lisibles (AA). Au moins 1 thème sur 5 sombre dans les catégories qui s'y prêtent.
3. **Polices** : uniquement des identifiants de la bibliothèque (liste ci-dessous). Titres et texte contrastés (serif/sans, display/neutre…). Une police de titre ne sert pas à plus de 4 thèmes dans toute la bibliothèque.
4. **Contenus** : français professionnel, spécifique au secteur (services, produits, tarifs, horaires cohérents), jamais de « Lorem ipsum », jamais de texte générique répété d'un thème à l'autre. Marques, personnes, entreprises et coordonnées sont **fictives** : noms inventés (aucune marque réelle, aucun nom de personne réelle), e-mails en `.example`, téléphones fictifs, témoignages « client fictif », chiffres présentés comme exemples réalistes (pas d'affirmations vérifiables : « 94 % de satisfaction » reste un exemple).
5. **Honnêteté fonctionnelle** : pas de panier ni de paiement simulé. Les thèmes de boutique montrent un catalogue de démonstration (`gal:products`, `misc:product`) et renvoient vers `/contact` ; ils déclarent `modules: ["Boutique en ligne : le module e-commerce n'est pas installé, le catalogue est une démonstration"]`. Formation : `misc:courses` lit le vrai catalogue Kolakisa ; `gal:coursecards` est une démonstration. Immobilier, auto, tourisme : annonces de démonstration.
6. **Pages** : 4 à 6 pages utiles au métier (+ recherche et introuvable ajoutées automatiquement), chacune avec au moins 3 blocs (en-tête et pied de page sont ajoutés par `head` / `foot`). Les pages intérieures commencent par `misc:pagehead` (sauf cas éditorial voulu). Le menu ne pointe que vers des pages du thème.
7. Variantes interdites ou inventées : aucune. N'utilisez que celles ci-dessus ; icônes : uniquement celles de la liste.

## Icônes disponibles
`star starOutline check checkCircle trophy heart heartFilled zap shield sparkles sun moon globe mapPin smartphone mail clock home tag cart coin book graduation briefcase users user calculator barChart trendingUp activity layers network settings sliders palette bot send gitBranch infinity bell help info alertTriangle lock eye search download upload video play image grid list fileText calendarClock quiz printer clip monitor tablet layout keyboard plug externalLink arrowRight arrowLeft`

## Polices (identifiants de la bibliothèque, les plus sûres)
Sans : `font.inter font.poppins font.montserrat font.raleway font.manrope font.dm-sans font.work-sans font.josefin-sans font.archivo font.syne font.outfit font.sora font.jost font.nunito font.quicksand font.rubik font.karla font.cabin font.urbanist font.plus-jakarta-sans font.lexend font.red-hat-display font.epilogue font.figtree font.public-sans font.mulish font.chivo font.space-grotesk font.league-spartan font.barlow font.ibm-plex-sans font.titillium-web font.kanit font.prompt font.saira font.unbounded font.bricolage-grotesque`
Serif : `font.playfair-display font.lora font.merriweather font.cormorant-garamond font.libre-baskerville font.crimson-text font.eb-garamond font.spectral font.bitter font.source-serif-4 font.ibm-plex-serif font.dm-serif-display font.fraunces font.instrument-serif font.cinzel font.marcellus font.tenor-sans font.italiana font.gloock font.young-serif font.newsreader font.literata font.zilla-slab font.roboto-slab font.alegreya font.prata font.bodoni-moda font.yeseva-one font.rozha-one font.abril-fatface font.ibarra-real-nova`
Affichage / caractère : `font.oswald font.bebas-neue font.anton font.barlow-condensed font.teko font.staatliches font.alfa-slab-one font.bungee font.righteous font.fredoka font.baloo-2 font.caveat font.pacifico font.dancing-script font.amatic-sc font.permanent-marker font.lobster font.orbitron font.exo-2 font.space-mono font.jetbrains-mono font.ibm-plex-mono`
