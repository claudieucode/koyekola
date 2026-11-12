# Brief : 80 pieds « carrés 2 » (ft2-186 à ft2-265)

Demande du propriétaire : « rajoute encore 80 dans la même logique » = mêmes règles que `BRIEF_CARRE.md` (LIRE D'ABORD : angles droits partout, standard mais très pro, animations fluides, vérifications). Références de qualité : les 60 modèles déjà livrés (`familles/pme-entreprise.js`, `conseil-b2b.js`, `sport-clubs.js`…, `CATALOGUE_CARRE.md`).

## Pièges déjà rencontrés (À ÉVITER)
1. **Polices** : `font.figtree` et `font.bricolage-grotesque` sont déjà déclarées (mal chargées) par la plateforme : le test de chargement des polices échoue. Ne pas les utiliser.
2. **Horaires** : la pastille « Ouvert maintenant » du widget `bizhours` est ronde (CSS partagé) : toujours `showOpenNow: false`.
3. **Widgets déclarés** : la liste `widgets: [...]` du modèle doit correspondre aux types RÉELLEMENT présents dans l'arbre (ex. ne pas déclarer `"divider"` si le modèle n'en contient pas).
4. **Texte de consentement du widget e-mail** (`emailsubscribe`) : sa couleur doit contraster (AA) avec le fond réel où se trouve le widget. `G.abonnement({... texte: <couleur lisible sur CE fond> })` colore aussi le consentement ; vérifier avec le test bibliothèque.
5. **Ligne légale de la plateforme** (« Nom du site · Cookies ») : elle prend la couleur de la DERNIÈRE bande ; sur fond sombre, la bande doit rendre ce texte lisible (vérifier en capture).
6. **Ressemblance structurelle** : le test refuse deux modèles dont l'empreinte est trop proche (similarité > 0,85, `src/themeBuilder/catalog/footer/empreinte.js`) — contre TOUS les modèles de la bibliothèque (185 existants + les vôtres). Varier réellement les squelettes (nombre et forme des bandes, colonnes, widgets), pas seulement les couleurs. Vérifier avant de rendre (script ci-dessous).
7. Couleurs de bordure par côté (`borderLeftColor`…) ignorées par le moteur : utiliser de petits éléments séparés ou une couleur unique.
8. Machine chargée : relancer seul un test qui expire (30 s). Ne pas lancer de `pkill` large (tue le Chrome des autres agents). Ne jamais supprimer de fichiers ni de captures qui ne sont pas les vôtres ; travailler dans votre propre sous-dossier du scratchpad.

## Vérification de ressemblance (à lancer depuis la racine du dépôt de travail)
```
node -e 'const V2=require("./src/themeBuilder/catalog/footer/v2").assemble();const {kit,withIds}=require("./src/themeBuilder/catalog/kit");const Emp=require("./src/themeBuilder/catalog/footer/empreinte");const skins=new Map(V2.skins.map(s=>[s.key,s]));const T=V2.nouveaux.map(e=>({k:e.fullKey,t:Emp.jetons({type:"layout",children:withIds(e.build(kit(skins.get(e.skin)),{}))})}));const bad=[];for(let i=0;i<T.length;i++)for(let j=i+1;j<T.length;j++){const s=Emp.similarite(T[i].t,T[j].t);if(s>0.8)bad.push(T[i].k+" "+T[j].k+" "+s.toFixed(2))}console.log(T.length,bad)'
```
(0,80 ou moins pour vos modèles.)

## Test angles droits et navigateur
`FOOTER_V2_ONLY=<ids séparés par des virgules> TEST_START_TIMEOUT_MS=900000 node --test tests/footer-v2-navigateur.test.js` : contient déjà le contrôle des angles droits pour tout modèle numéroté 126 ou plus, ET la page publiée, les polices, le focus, les cibles 44 px, le survol et le mouvement réduit.
Le test `tests/footer-v2-bibliotheque.test.js` ne connaît pas encore les nouvelles familles/fiches (l'intégrateur l'étend à la fin) : ne pas le modifier ; pour contrôler vos 10 modèles, copier la logique dans un script du scratchpad ou utiliser l'audit Chrome (`scripts/audit-pieds-cdp.js --v2`).

## Fiches de concept
`docs/footer-v2/concepts/carre2/<agent>.json` (même format qu'avant ; `famille` = libellé EXACT de la famille du squelette ; ordre = numéro du modèle).
