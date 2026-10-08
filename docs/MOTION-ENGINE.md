# Moteur de mouvement (Motion Effects Engine)

Un seul moteur, du panneau de l'éditeur à la page publiée :

```
Configuration (panneau « Effets de mouvement », « Défilement : de → à », « Souris : amplitudes », « Épinglage »)
   → modèle de document  (node.motion + styles par écran : position / top / bottom / zIndex)
   → validation serveur  (src/marketing/pages/nodes.js : normalizeMotion — bornes, listes fermées, jamais de CSS libre)
   → registre            (src/marketing/pages/motion.js : 63 animations, courbes, répétitions, directions, déclencheurs)
   → rendu               (nodes.js : entranceRules + motionAttrs → CSS de page limité aux animations utilisées + attributs data-kw-*)
   → exécution           (public/js/landing.js : entrées ; public/js/kw-effects.js : défilement et souris ; CSS : épinglage)
   → canevas / aperçu / page publiée (même rendu serveur ; l'aperçu du panneau pose un style temporaire, jamais enregistré)
```

## Ce qui existait et a été réutilisé (aucun second moteur)

| Existant | Devenu |
|---|---|
| `ENTRANCES` (10 animations, keyframes écrits à la main dans landing.css) | Registre `motion.js` : les 10 identifiants historiques sont conservés (pages déjà enregistrées) + 53 nouvelles ; keyframes retirés de landing.css |
| `kw-effects.js` (défilement symétrique, souris suivre / incliner) | Même fichier, même boucle : réglages d'origine inchangés + « de → à » et « amplitudes » composés au même endroit |
| Section « Épinglage » (position: sticky) | Même section : héritage par écran, « Aucun » coupe l'héritage, z-index, diagnostics réels |
| `setMotion` / `change()` / historique | Toutes les modifications y passent : annuler / rétablir sans historique parallèle |

## Modèle de données (additif, rétro-compatible, validé à chaque enregistrement)

```
motion: {
  entrance: "fade-in-up",            // id du registre
  duration: 800, delay: 200,         // ms (100–10000 · 0–10000)
  easing: "ease-out" | "cubic-bezier(0.1, 0.2, 0.3, 1)",   // noms connus ou 4 nombres bornés
  iterations: 2 | 3 | "infinite",    // absent = 1 (jamais infinie par défaut)
  direction: "reverse" | "alternate" | "alternate-reverse",
  trigger: "load" | "click" | "hover",   // absent = quand l'élément est visible
  repeat: true,                      // « Jouer une seule fois » décoché
  screens: { tablet: "fade-in" | "none", mobile: … },   // vide = hérite de l'écran plus grand
  hover: "grow" | …,
  alwaysMotion: true,                // décoché « Respecter le mouvement réduit »
  scroll: { y, x, opacity, blur, scale, rotate },   // réglages d'origine (amplitude centrée)
  scrollFx: { translateY|translateX|rotate|rotateX|scale|opacity|blur: {from,to}, start, end, dir, invert, perspective },
  mouse: { mode, strength, invert },                // réglages d'origine
  mouseFx: { translateX, translateY, rotateX, rotateY, rotateZ, scale, perspective, speed },
  off: ["mobile"]                    // écrans où défilement et souris sont coupés
}
styles.<écran>: { position: "sticky"|"static", top|bottom, zIndex }   // épinglage, indépendant par écran
```

## Composition (rien ne s'écrase)

* **Défilement et souris** : propriétés CSS indépendantes `translate`, `scale`, `rotate`, `opacity`, `filter`, calculées UNE fois par `renderFx` :
  déplacements additionnés, échelles multipliées, **rotations composées en quaternions** (X, Y, Z, inclinaison → une seule propriété `rotate`),
  opacités multipliées, flous additionnés.
* **Animation d'entrée** : chaque image-clé part de la transformation propre de l'élément (`--kw-tf`, écrite par le serveur à côté de son
  `transform`) puis y ajoute son mouvement ; à la fin l'élément retrouve exactement sa transformation. Même principe pour les effets au survol.
* **Entrée + défilement/souris** : le défilement et la souris attendent le déclenchement de l'entrée (l'élément n'est pas déplacé avant d'être apparu) ; les propriétés indépendantes se composent avec `transform`.

## Performance et accessibilité

* Seules les animations utilisées sont écrites dans le CSS de la page (une page sans mouvement n'a aucune image-clé du moteur).
* Un seul écouteur de défilement (passif) et un seul de souris pour toute la page ; `requestAnimationFrame` seulement tant que quelque chose
  bouge, lissage de la souris arrêté dès que la cible est atteinte ; `IntersectionObserver` pour l'entrée et pour ne calculer que les éléments visibles ;
  `destroy()` retire écouteurs, observateur et styles posés.
* Mouvement réduit (par défaut) : entrées → fondu court (ou aucune animation pour attention / sortie), défilement et souris coupés. Décocher
  « Respecter les préférences système » est un choix explicite de l'auteur (`data-kw-motion-always`).

## Ajouter une animation

Une ligne dans `DEFS` de `motion.js` (id, libellé, catégorie, type `in` / `attn` / `out`, images-clés CSS, comportement réduit, durée et courbe conseillées).
Le menu, la recherche, l'aperçu, la validation et le CSS publié la prennent en compte ; le test « chaque animation est réellement exécutée »
la vérifie automatiquement dans Chrome.

## Tests

* `tests/moteur-mouvement.test.js` — registre, validation, CSS et attributs, calculs purs.
* `tests/moteur-mouvement-navigateur.test.js` — panneau (menu, recherche, aperçu au survol non enregistré, paramètres, écrans, historique, copier / coller, réinitialiser).
* `tests/moteur-mouvement-chrome.test.js` — vrai Chrome sur la page publiée : les 63 animations exécutées, déclencheurs, écrans, mouvement réduit,
  défilement de → à (début / milieu / fin, zone, inversion, sens), souris, composition, épinglage (Flexbox, Grille, imbriqué, par écran), aperçu, performance.
