# Brief : 80 pieds « standard pro animé » (ft2-434 à ft2-513)

Demande du propriétaire : « 80 modèles standard, pros et animés, PAS d'illustrations : des textes, des couleurs, un agencement et un classement très pros, des animations très pros, même logique que les précédents ».

## Ce que vous recevez
2 familles de 5 modèles (squelettes déjà créés : `src/themeBuilder/catalog/footer/v2/familles/<cle>.js`, `built:false`, `models:[]`). Vos numéros sont donnés dans votre message. À remplir ; `built:true` quand 5 modèles. Ids `ft2-<NNN>-<slug>` (`identifiantV2`), `concept: "c-<NNN>-<slug>"`, noms français UNIQUES dans toute la bibliothèque (chercher dans `familles/` avant).

## Ce qu'on veut (qualité)
* **Zéro illustration, zéro image décorative, zéro widget `html`** : pas de SVG. Tout est typographie, couleur, filets, aplats, grilles, cartes, chiffres/numéros, étiquettes, boutons, formulaires, widgets de données (horaires, contact, réseaux, newsletter).
* **Bien classé** : hiérarchie nette et lisible — titres de colonnes en petites capitales ou en gras, liens groupés par catégories logiques (ex. Produits / Ressources / Société / Aide), coordonnées + horaires regroupés, réseaux, lettre d'information, mentions légales. Alignements rigoureux, marges régulières, colonnes de largeur cohérente, rythme vertical régulier.
* **Standard mais très pro** : crédible pour un vrai site du secteur de la famille (contenus utiles, libellés réels en français, marques fictives, AUCUNE coordonnée / chiffre / certificat inventé ; les « Données de l'entreprise » fournissent adresse, téléphone, e-mail, horaires).
* **Animations très pros, fluides** : transitions de survol/focus de 360 ms (`G.MOUVEMENT`), courbes douces : soulignement qui se dessine, filet d'accent qui s'étire, décalage de 2 à 6 px, flèche qui glisse, fond de ligne qui s'éclaire, carte qui se soulève (`lift`), bouton qui s'inverse, pastille de statut qui « respire » (pulse lent). AU MOINS UNE animation visible par modèle, jamais agressive. Pas d'animation d'entrée, pas de défilement continu. Tout disparaît sous `prefers-reduced-motion` (le moteur le fait).
* **VARIÉTÉ** : 80 modèles au total (et 433 existants) : chaque modèle a un squelette (nombre/forme des bandes, colonnes, présence d'un bandeau newsletter en tête ou en pied, bandeau d'appel, barre latérale, grille de cartes, sommaire numéroté, double rangée de liens…), une palette (clair, ivoire, sombre, couleur franche, bicolore, monochrome profond…) et une typographie nettement différents de tous les autres. Pas de simples variantes de couleur.
* **Ressemblance structurelle ≤ 0,60** contre TOUS les modèles de la bibliothèque (script plus bas) ; le test refuse 0,85.

## Règle ANGLES DROITS (voir BRIEF_CARRE.md, à lire)
Aucun `border-radius` non nul : `identite({rayon:"0px", rayonBouton:"0px"})`, `rayon:"0px"` pour `G.pilule(s)`/boutons du kit, `rayonBouton:"0px"`/`rayonChamp:"0px"` pour `G.abonnement`, `borderRadius:"0px"` pour les nœuds faits main. Les icônes de réseaux (widget `social`) sont rendues carrées automatiquement pour les numéros ≥ 266 : rien à faire.

## Pièges connus (tous déjà rencontrés)
1. Polices : uniquement la bibliothèque locale (`font.<nom>`, 2 familles au plus par modèle) ; PAS `font.figtree` ni `font.bricolage-grotesque`.
2. Widget `bizhours` : `showOpenNow:false` (pastille ronde).
3. La liste `widgets: [...]` du modèle doit correspondre EXACTEMENT aux types présents dans l'arbre (pas de `divider`, `text`, `social`… déclarés mais absents ; vérifier par script).
4. `G.abonnement` : couleur du texte de consentement/titre lisible (AA) sur le fond RÉEL de la bande où il se trouve.
5. La ligne légale de la plateforme prend la couleur de la dernière bande (`color: S.fg` par défaut). Sur fond sombre/coloré, passer `couleur: "#ffffff"` (ou une couleur lisible) dans les options de `G.bande` de la DERNIÈRE bande. Vérifier en capture.
6. Imbrication ≤ 8 niveaux (compter conteneur racine, bande, conteneur interne…). Éviter les pile>groupe>pile>groupe superflus.
7. Liens : `https://`, `tel:`, `mailto:`, `#ancre` (jamais `#` seul → utiliser `#haut`), ou routes de la plateforme : `/ /contact /cookies /faq /connexion /inscription /blog /catalogue /boutique /boutique/panier /boutique/compte /boutique/souhaits`. Aucun autre chemin.
8. `lineHeight` jamais 0 (≥ 0.8). `gap` à deux valeurs : utiliser `G.gaps("a b")` ou la forme « gap: "20px 48px" » dans les options de `G.bande` (convertie automatiquement).
9. Texte HTML : pas de `&gt;`, utiliser `›` ; `®`/`©` en caractères, pas en entités.
10. Contrastes AA sur TOUT texte (y compris titres de widgets, étiquettes de formulaire, boutons). Le test bibliothèque les calcule.
11. Couleurs de bordure par côté ignorées : couleur unique ou petits éléments séparés.
12. Titres/mots géants : `fluid:` ≤ 200 ; vérifier à 390 px qu'aucun texte ne passe sur un autre (chevauchement).
13. Machine chargée : relancer seul un test qui expire. Pas de `pkill`/`killall`, pas de `git stash`, pas de `git checkout`/`reset`, ne jamais supprimer de fichiers (pas de `rm`), n'écrire que vos fichiers (écritures atomiques : fichier temporaire puis `mv`). Plusieurs agents travaillent dans le même dépôt : ne touchez NI `index.js`, NI `kit-v2.js`, NI `bas.js`, NI les tests, NI les familles des autres.
14. Vos captures de travail : dans votre sous-dossier du scratchpad uniquement.

## Contenu des fichiers
* Un fichier par famille (déjà créé). Vous pouvez créer un fichier d'aides à vous : `src/themeBuilder/catalog/footer/v2/aides-std-<agent>.js`.
* Fiches de concept : `docs/footer-v2/concepts/standard/<agent>.json` au format `{ "concepts": [ … ] }` : `id` (`c-<NNN>-<slug>`), `ordre` (= numéro), `nom`, `famille` (libellé EXACT de la famille du squelette), `secteur`, `directionArtistique.texte` (2-4 phrases), `typographies {titre, corps, accent, source}`, `tags`. Même forme que `docs/footer-v2/concepts/concepts-inspire.json` (en lire 2 entrées).
* Description de famille ≤ 280 caractères ; en-tête de fichier qui explique les modèles et les animations.

## Vérifier avant de rendre (racine : `/private/tmp/claude-501/carre2b-wt`)
1. Charger : `node -e 'const V=require("./src/themeBuilder/catalog/footer/v2");console.log(V.assemble().familles.filter(f=>f.built).length)'`
2. Ressemblance : 
```
node -e 'const V2=require("./src/themeBuilder/catalog/footer/v2").assemble();const {kit,withIds}=require("./src/themeBuilder/catalog/kit");const Emp=require("./src/themeBuilder/catalog/footer/empreinte");const skins=new Map(V2.skins.map(s=>[s.key,s]));const T=V2.nouveaux.map(e=>({k:e.fullKey,t:Emp.jetons({type:"layout",children:withIds(e.build(kit(skins.get(e.skin)),{}))})}));const mine=T.filter(x=>+x.k.slice(4,7)>=NNN1&&+x.k.slice(4,7)<=NNN2);const bad=[];for(const a of mine)for(const b of T){if(a.k===b.k)continue;const s=Emp.similarite(a.t,b.t);if(s>0.6)bad.push(a.k+" "+b.k+" "+s.toFixed(2))}console.log(mine.length,bad)'
```
(remplacer NNN1/NNN2 par votre plage).
3. Contrôles du test bibliothèque pour vos modèles : liens, widgets déclarés, contraste, nettoyeur Page Builder, imbrication. Le test global ne connaît pas encore vos fiches : écrire un petit script ou, mieux, lancer `node --test tests/footer-v2-bibliotheque.test.js 2>&1 | grep -E "ft2-(vos numéros)"` après avoir écrit vos fiches (le test lit `concepts-standard.json`, que l'intégrateur fusionne : avant fusion, il échoue sur le compte global ; ne regardez que les lignes de VOS ids).
4. Chrome : `FOOTER_V2_APERCU=1 TEST_START_TIMEOUT_MS=900000 node scripts/audit-pieds-cdp.js --v2 --id=<vos ids> --largeurs=390,1280 --donnees=avec --captures=<votre dossier>` : 0 défaut ; OUVRIR les captures (390 et 1280) avec Read et les regarder (alignements, chevauchements, lisibilité, ligne légale du bas).
5. `FOOTER_V2_ONLY=<vos ids> TEST_START_TIMEOUT_MS=900000 node --test tests/footer-v2-navigateur.test.js` : 0 échec (angles droits, polices, focus, cibles 44 px, survol visible sur les 8 premiers liens (la couleur de survol DOIT différer de la couleur normale), mouvement réduit).
Rendre un court rapport : ids, noms, similarité max, tests, défauts restants.
