# Contrat d'un fichier de secteur d'en-têtes

Chaque secteur peut remplacer ses 10 modèles hérités par 10 modèles écrits sur mesure, dans **un seul fichier** :
`src/themeBuilder/catalog/header/sectors/<secteur>.js` (secteurs : `luxe sport ecom tech agence corpo sante archi resto media`).
Un agent ne touche **que** son fichier. `header.js`, `contract.js`, `blocks.js`, `blocks2.js` et `models.js` ne se modifient pas à plusieurs.

## Format

```js
const { ID, mark, nav, btn, g, band, inner, wrap, mv, hv /* … */ } = require("../blocks");
const X = require("../blocks2");           // briques nouvelles (formes, ticker, menu plein écran…)
module.exports = {
  sector: "luxe",                           // = nom du fichier
  models: [                                 // null = on garde les 10 modèles hérités ; sinon EXACTEMENT 10, clés luxe-01 … luxe-10
    {
      key: "luxe-01", name: "Maison Aurore", art: "Luxe éditorial", desc: "Une phrase qui décrit la composition.",
      S: ID("luxe-01", "Maison Aurore", { bg: "#…", fg: "#…", mute: "#…", alt: "#…", accent: "#…", onAccent: "#…", line: "#…", font: "font.jost", head: "font.cormorant-garamond", weight: "500" }),
      build: (k, P) => [ /* rangées (nœuds natifs) */ ],
      mode: "static",                       // static | sticky | stickyhide | stickyshrink | glass | overlay | overlaysolid
      anim: "rise",                         // entrée du logo / menu / actions : none | rise | soft | reveal | slide | zoom
      hover: "",                            // survol des boutons : un identifiant de HOVERS (grow, lift, push, pop…)
      dark: true, tags: ["…"],
      features: ["…", "…", "…"],            // ≥ 3 fonctionnalités RÉELLES du modèle
      animations: ["fade-in-up", "grow"],   // mouvements annoncés : chacun doit exister dans les nœuds construits
      settings: ["Couleurs", "Police"],     // réglages réellement proposés (éditeur d'éléments)
    },
  ],
};
```

## Règles vérifiées au chargement (`header/contract.js`) : un fichier invalide fait échouer le démarrage

* 10 modèles exactement, clés `<secteur>-NN` (01 à 10, mêmes clés qu'aujourd'hui : aucune clé orpheline), noms uniques dans **toute** la bibliothèque.
* `S` créé par `ID(clé, nom, {…})` avec `S.key` = clé du modèle ; couleurs **fixes** `#rrggbb` (`bg fg mute alt accent onAccent line`), polices `font.<nom>` de la bibliothèque locale (jamais un jeton du site ni la charte d'administration).
* `build(k, P)` renvoie un tableau de nœuds : `k.S` = identité, `P` = contenu du secteur (`P.cta = [libellé, adresse]`, `P.notice`, `P.tag`, `P.tagline`). Il n'ajoute **pas** l'enveloppe : `wrap(S, rangées, mode)` (conteneur collant / superposé, effet au défilement), l'entrée du logo, du menu et des actions (`anim`) et le survol des boutons (`hover`) sont posés par `header.js`. Un nœud qui porte déjà `motion.entrance` garde son mouvement.
* Les nœuds passent `normalizeSections` (mêmes contrôles que la sauvegarde) : grammaire fermée, propriétés connues, longueurs valides.
* Chaque entrée de `animations` existe réellement (entrée `motion.entrance` ou survol `motion.hover`) dans les nœuds construits.
* `arch` n'existe pas pour un modèle de secteur : sa clé tient lieu d'architecture (chaque modèle est sa propre architecture).

## Règles produit (tests `theme-builder-entetes-atelier*.test.js`)

* Aucune image, vidéo, HTML libre, script ; pas de coordonnée inventée (utiliser `X.info`, qui pose des consignes) ; menus = `source: "location"` (menu affecté à « En-tête ») ; boutons vers `/catalogue /inscription /contact /blog /connexion`.
* Responsive : pas de position absolue dans une rangée (la position n'existe que sur l'enveloppe) ; menu repliable sur mobile (sauf vertical) ; toute grille a un réglage tablette et un `1fr` sur mobile ; `social`, `date`, `iconlist` masqués sur mobile (`hideOn: ["mobile"]`) ; largeur fixe ≤ 260 px.
* Contraste ≥ 4,5 (texte/fond, texte secondaire/fond, texte du bouton/accent).
* Diversité : signature de composition unique + distance visuelle (rendus réels, niveaux de gris, sans texte) sous le seuil interdite : voir plus bas.
* Types de nœuds admis : ceux de la liste du test (`container group stack grid sitelogo sitetitle menu search account minicart button social dyntext text iconlist divider spacer heading link`) **plus** ceux des briques ci-dessous (`marquee motionfsmenu`).

## Briques de `header/blocks.js` (existantes)

`mark(k,{kind:"title|logo|both", size, caps, track, weight, font, italic, color})` marque · `nav(k, kind, {…})` menu (`plain underline pill box block tab thin mono`, `vertical`) · `btn(k, libellé, url, kind)` (`solid outline pill line ghost arrow`) · `search` · `account` · `cart` · `social` · `date` · `note` · `tag` · `line` · `sp` · `contact` · `g` (groupe flex) · `stack` · `grid(cols, …)` · `band` (bande pleine largeur) · `inner` (contenu borné) · `wrap` · `mv(nœud, entrée, délai, durée)` · `hv(nœud, survol)` · `ID`.

## Briques de `header/blocks2.js` (nouvelles, testées dans Chrome : `tests/theme-builder-entetes-briques.test.js`)

| Brique | Rôle | Réel |
|---|---|---|
| `X.disc(k,{size, color \| gradient:{from,to,angle}})` | disque plein ou dégradé | conteneur vide, `borderRadius` 999 px, dégradé natif |
| `X.ring(k,{size,w,color})` | anneau | bordure |
| `X.slash(k,{w,h,angle,color\|gradient})` | bandeau diagonal (parallélogramme) | `transform.skewX` natif |
| `X.stripe(k,{h,gradient})` | liseré pleine largeur en dégradé | conteneur pleine largeur |
| `X.vrule(k,{h,w,color})` | filet vertical entre cellules | conteneur 1 px |
| `X.slab(k, enfants, {bg,fg,padV,padH,radius})` | case colorée portant du contenu | groupe flex |
| `X.monument(k,{min,max,font,caps,track,italic})` | nom du site monumental, taille **fluide** `fluid:min-max` (8–200 px), lisible dès 320 px | `sitetitle` + typographie fluide native |
| `X.ticker(k, [textes], {speed,direction,sep,bg,color,pause})` | bande de textes qui défile (annonces à personnaliser) | widget natif `marquee` : pause au survol/clavier, immobile si « réduire les animations » |
| `X.info(k, ["hours","phone","address","mail"], {inline,color,icon})` | bloc d'informations pratiques | `iconlist` ; texte = **consigne à remplacer**, jamais de donnée inventée ; masqué sur mobile |
| `X.navTiles(k, kind, {w,gap,border,bg})` | navigation en mosaïque : liens en cases bordées qui passent à la ligne dans un bloc de largeur bornée | menu affecté, parties `list` et `link` |
| `X.navStack(k, kind)` | navigation verticale (liens empilés) | menu `vertical` |
| `X.fsMenu(k,{buttonLabel,closeLabel,numbers,align,preset:"fade\|slide-down\|slide-right\|circle",duration,stagger})` | bouton hamburger + **menu plein écran sur ordinateur ET mobile**, liens en cascade, Échap, focus piégé | widget natif `motionfsmenu` (Motion Studio) ; **évolution moteur** : nouveau réglage `source` (`manual` par défaut, inchangé pour l'existant ; `location` = liens du menu affecté à « En-tête », premier niveau, 12 liens max ; sans menu affecté, rien n'est affiché) |
| `X.cartPill(k,{bg,fg})` | mini-panier avec pastille de compte colorée | `minicart`, partie `count` ; données réelles seulement si le site a une boutique |

## Limites connues des briques (ne pas contourner par du faux)

* **Pas de vraie grille à colonnes pour les liens du menu** : la partie « Liste » du menu n'accepte que flex (pas `gridTemplate`). `navTiles` donne l'effet de cases qui passent à la ligne ; il ne garantit pas un nombre de colonnes.
* **Pas de numérotation « 01, 02 » des liens du menu de la rangée** (il faudrait des compteurs CSS) : seul `fsMenu` numérote.
* **Pas de formes en position absolue** (cercles qui débordent, fonds décalés) : le moteur les accepte mais le contrat les interdit dans une rangée (responsive) ; une forme est un élément du flux (flex), éventuellement avec marges négatives.
* **`fsMenu` ne montre que le premier niveau** du menu (pas de sous-menus) ; en éditeur la liste s'affiche à plat (le panneau se teste sur la page publiée).
* **Pas de sélecteur CSS libre, pas de `clip-path`, pas de blend-mode** : les formes sont des conteneurs, dégradés et inclinaisons.

## Mesure de diversité (à lancer avant de rendre la main)

1. `node scripts/audit-entetes-atelier.js` : signature de composition ; aucune paire identique.
2. `OUT=… node scripts/capture-entetes.js <secteur>` : planche à regarder (`Read`) ; la planche doit montrer 10 compositions que l'on distingue en niveaux de gris.
3. `KOYEKOLA_TEST_SEED_DB=/private/tmp/claude-501/seed.db TEST_START_TIMEOUT_MS=900000 NODE_PATH=/private/tmp/claude-501/pw/node_modules node scripts/audit-entetes-atelier.js --visuel <secteur>` : recapture **ton** secteur, compare à tous les autres (descripteurs enregistrés dans `rapport-visuel-entetes-atelier.json`) et liste, pour chaque modèle, le plus proche voisin et les paires sous le seuil. Méthode : texte rendu transparent, niveaux de gris, 96×24, contraste normalisé, distance L2, polarité ignorée. Le test navigateur échoue pour toute paire nouvelle sous le seuil (`ENTETES_STRICT=1` : échoue pour toute paire, y compris héritée).
