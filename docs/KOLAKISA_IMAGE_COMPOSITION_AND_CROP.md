# Composition et recadrage

## Ce qui existait
Le moteur de pages gère `objectFit` (cover/contain/fill/none), `objectPosition` (9 mots-clés), `aspectRatio` (dont 16/9, 21/9) ; le point focal x/y est stocké dans les métadonnées d'un média.

## Ajouté (`crop.js`, `analyzer.js`)
- Point focal **proposé** : centre de gravité du contraste local pondéré par la saturation (heuristique, **pas** de détection de sujet). Correction manuelle prioritaire (`focalSource: "manuel"`).
- `plan(image, { ratio, mode, focal, region })` → région en pixels, `objectPosition` en % et mot-clé natif le plus proche, part de l'image conservée, avertissements (sujet possiblement coupé, étirement).
- `perDevice` : bureau 16:9, tablette 4:3, mobile 4:5 ; **variante dédiée conseillée** si le cadrage conserve moins de 40 % de l'image (ex. bandeau 3:1 sur mobile).
- Côté calme de l'image : indique où poser le texte.
- Non destructif : `destructive: false` ; le fichier d'origine n'est jamais réécrit.

## Route
`GET /marketing/site-web/sites/:id/medias-ia/medias/:mid/analyse.json?ratio=16:9&fx=0.3&fy=0.5`

## Non fait
Aucun curseur de point focal / aperçu dans l'interface ; les valeurs proposées ne sont pas écrites dans la page (la personne les applique dans l'éditeur existant).
