# Brief : 168 pieds « inspirés de captures » (ft2-266 à ft2-433)

Demande du propriétaire : « fais-moi 168 footers TRÈS VARIÉS, dans la même logique ; tu as des images comme modèles d'inspiration ; pas de plagiat, t'en inspirer fortement pour créer de NOUVEAUX footers en respectant notre logique ».

## Ce que vous recevez
- 2 familles de 6 modèles (squelettes déjà créés dans `src/themeBuilder/catalog/footer/v2/familles/<cle>.js`, `built:false`, `models:[]`) : à remplir, `built:true`. Numéros contigus indiqués dans votre mission ; ids `ft2-<NNN>-<slug>` (`identifiantV2`), noms français distincts dans toute la bibliothèque.
- 2 à 3 captures d'inspiration (PNG, à OUVRIR avec l'outil Read). Ce sont des pieds de sites réels : mise en page, hiérarchie, idées (logo géant, cartes de colonnes, bandeau newsletter en tête, grille de liens, marque monumentale, etc.). Chaque capture doit inspirer environ 4 modèles : reprendre l'IDÉE de composition (pas la copie : autres couleurs, autres proportions, autre contenu, autre marque fictive, pas de logo/photo copiés).

## Règles (LIRE D'ABORD : `BRIEF_CARRE.md`, `BRIEF_CARRE2.md`, `DIVERSITE_STRICTE.md` dans ce dossier)
1. **ANGLES DROITS partout** (aucun border-radius non nul, même si la capture a des cartes arrondies : les traduire en cartes à angles nets). `identite({rayon:"0px", rayonBouton:"0px"})`, voir BRIEF_CARRE.
2. Standard mais très pro, contenu utile, marques fictives, aucun chiffre/coordonnée inventé ; animations fluides (360 ms, une animation visible par modèle), pas d'animation d'entrée, pas de marquee.
3. VARIÉTÉ MAXIMALE : 168 modèles au total, donc chaque modèle doit avoir un squelette, une palette (clair, sombre, couleur franche, bicolore…) et une typographie nettement différents de tous les autres. Ressemblance structurelle (`empreinte.js`) : **≤ 0,60** contre TOUS les modèles existants (265 + ceux des autres agents), voir script de BRIEF_CARRE2 (adapter le seuil et le compte).
4. Pièges connus (BRIEF_CARRE2) : pas de polices `font.figtree`/`font.bricolage-grotesque` ; `showOpenNow:false` sur bizhours ; `widgets` déclarés = types réellement présents ; contraste AA du consentement e-mail ; imbrication ≤ 8 ; `gap` à deux valeurs interdit sur k.row/k.col ; taille fluide ≤ 200 ; couleurs de bordure par côté ignorées.
5. Le BAS de page (copyright / ligne légale plateforme) est varié automatiquement par `v2/bas.js` : ne pas s'en occuper ; mais la dernière bande doit rendre le texte légal lisible.
6. Ne PAS modifier `index.js`, les tests, ni d'autres familles ; ne jamais supprimer de fichier ; pas de `pkill` large ; vos captures de travail dans votre propre sous-dossier du scratchpad.
7. Fiches de concept : `docs/footer-v2/concepts/inspire/<agent>.json` au format `{ "concepts": [ … ] }` (id `c-<NNN>-<slug>`, ordre, nom, famille = libellé EXACT, secteur, directionArtistique.texte, typographies {titre, corps, accent, source}, tags), comme `concepts/carre2/`. Le champ `concept` du modèle = l'id de la fiche.

## Vérifier avant de rendre (racine du worktree `/private/tmp/claude-501/carre2b-wt`)
- Chargement : `node -e 'const V=require("./src/themeBuilder/catalog/footer/v2"); console.log(V.assemble().familles.filter(f=>f.built).length)'`
- Aperçu/Chrome : `FOOTER_V2_APERCU=1 node scripts/audit-pieds-cdp.js --v2 …` : 0 défaut ; OUVRIR les captures 390 et 1280.
- `FOOTER_V2_ONLY=<vos ids> TEST_START_TIMEOUT_MS=900000 node --test tests/footer-v2-navigateur.test.js` (contient angles droits, polices, focus, 44 px, survol, mouvement réduit).
- Le test bibliothèque ne connaît pas encore vos familles (l'intégrateur l'étend).
Rendre : un court rapport (ids, noms, similarité max, tests, limites).
