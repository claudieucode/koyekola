# Brief : passe « ILLUSTRATION » sur les 168 pieds inspirés (ft2-266 à ft2-433)

## Le reproche du propriétaire (à prendre au sérieux)
« Ce que tu as fait ne correspond en rien aux images que je t'ai envoyées : c'est un peu du copier-coller de ce qui existe déjà, il n'y a pas d'illustration, rien du tout. »
Les captures d'inspiration sont RICHES VISUELLEMENT : marque/logo dessiné et monumental, fonds en dégradés lumineux (halo orange/rouge flouté, bleu nuit profond), formes 3D, bandes ondulées en bas de pied, cartes géographiques, rangées de vignettes/photos, pastilles d'icônes de réseaux, badges, motifs, grandes lettres avec effet. Nos pieds sont du texte sur des aplats : ça ne suffit pas.

## Mission
Pour CHAQUE modèle de vos 2 familles : OUVRIR (Read) vos captures, repérer ce qui fait leur personnalité VISUELLE, et ajouter au modèle une vraie ILLUSTRATION propre (pas un copier-coller de la capture : votre propre dessin, votre propre marque fictive), puis recomposer la mise en page autour d'elle pour que le pied ressemble à une vraie page de site soignée.

### Moyens autorisés (déjà utilisés par les 100 premiers modèles)
- **Dessin vectoriel inline (SVG)** dans le widget `html` : `k.W("html", { html: "<svg viewBox=… aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\">…</svg>" }, {width:"100%", display:"block", fontSize:"0px", lineHeight:…})` ; voir `familles/agences-portfolios-art.js` (lignes ~195 et ~363-491) et `familles/auto-sport-mobilite.js` pour des exemples. Déclarer `"html"` dans `widgets` (déjà accepté pour le catalogue). Couleurs `#rrggbb` en dur dans le SVG ; `<defs>` avec `linearGradient`/`radialGradient`, `<filter>` flou (feGaussianBlur) pour les halos lumineux ; `<pattern>` pour les motifs. Pas de `<script>`, pas d'événements, pas d'images externes, pas de `rx`/`ry` arrondis (angles droits) sauf cercles/pastilles de dessin à l'intérieur du SVG s'ils font partie du motif (le contrôle d'angles droits ne mesure que les `border-radius` CSS).
- **Dégradés CSS** : option `degrade` de `G.bande` / `gradient` (voir kit-v2.js l.102) pour fonds lumineux/halo.
- **Carte** (widget `bizmap`/`map` si le modèle s'y prête : adresse, restaurants, hôtels…) et **widget réseaux avec icônes** ; **images décoratives** sont impossibles (pas de fichiers) : on les remplace par des illustrations SVG (vignettes dessinées : paysage géométrique, objet, motif).
- Illustrations animées en douceur possibles (SVG `<animate>` lent ≤ 8 s, ou `motion` du kit) mais sous `prefers-reduced-motion` tout doit être immobile : préférer l'animation CSS/`motion` du moteur ; pas de clignotement.

### Exigences par modèle
1. **Au moins UNE illustration substantielle et unique** (≥ 25 % de la hauteur du pied ou le motif principal) : monogramme/logo dessiné, scène, ville, relief, objet, motif graphique, halo lumineux, vague, etc. Thème cohérent avec le secteur et la marque fictive. **Aucune illustration réutilisée entre deux modèles** (ni entre vos 12, ni avec d'autres) ; aucun logo de marque réelle.
2. **Variété de rôle** : sur vos 12 modèles, utilisez des rôles différents (grande marque dessinée à gauche, bandeau illustré pleine largeur, halo/dégradé de fond, bande ondulée en bas, rangée de 4 vignettes dessinées, carte, médaillon/badge, motif répété, etc.) et des mises en page différentes.
3. Garder : angles droits CSS, animations douces 360 ms, une animation visible, polices bibliothèque locale (pas figtree/bricolage), contrastes AA (le texte placé SUR une illustration/dégradé doit rester lisible : prévoir un aplat ou un voile), cibles 44 px, pas de débordement 390/820/1280/1920, imbrication ≤ 8, `gap` à deux valeurs interdit sur k.row/k.col (utiliser rowGap/columnGap), `widgets` déclarés = types présents, aucun lien hors routes plateforme (`/`, `/contact`, `/faq`, `/blog`, `/catalogue`, `/boutique`, `/connexion`, `/inscription`, `/cookies`) ou `https://`/`tel:`/`mailto:`/`#`.
4. **Ressemblance structurelle ≤ 0,60** contre les 433 modèles (script de BRIEF_CARRE2 ; seuil 0,6). Le widget `html` compte dans l'empreinte : varier aussi les structures.
5. Ne changez PAS les ids, noms ni numéros ; gardez le champ `concept` ; mettez à jour la fiche de concept (directionArtistique : décrire l'illustration) dans `docs/footer-v2/concepts/inspire/aXX.json` ET dans `docs/footer-v2/concepts/concepts-inspire.json` (même objet, même `id`).

## Règles de travail (le dossier est PARTAGÉ avec 13 autres agents)
- Vous ne modifiez QUE vos 2 fichiers de famille (+ un fichier d'aides nouveau `aides-illus-<agent>.js` à vous, à côté de `v2/`). Ni `index.js`, ni les tests, ni les autres familles.
- **Écriture atomique** : travaillez sur une COPIE dans votre dossier de scratchpad ; avant de recopier sur `familles/<cle>.js`, vérifiez `node --check` ET que le fichier se charge seul ; recopiez ensuite d'un coup (`cp`). Ne laissez jamais un fichier cassé dans le dossier partagé (les autres agents chargent toute la bibliothèque).
- Ne lancez AUCUN `pkill` large, ne supprimez aucun fichier ni capture qui ne soit pas à vous, pas de `git stash`/`checkout`/`reset` dans le dossier partagé.
- Vérifications : `FOOTER_V2_APERCU=1 node scripts/audit-pieds-cdp.js --v2` (0 défaut) puis OUVRIR les captures 390 et 1280 de CHAQUE modèle : on doit VOIR l'illustration et le résultat doit avoir l'allure d'une vraie page soignée. `FOOTER_V2_ONLY=<ids> TEST_START_TIMEOUT_MS=900000 node --test tests/footer-v2-navigateur.test.js`. Test bibliothèque filtré non requis.
- Machine chargée : relancer seul un test qui expire. Si Chrome ne démarre pas, réessayez avant de conclure.
Rendre : rapport court (par modèle : l'illustration ajoutée, capture regardée oui/non, similarité max, tests).
