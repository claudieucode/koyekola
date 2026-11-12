# Brief : 60 pieds « carrés » (ft2-126 à ft2-185)

Demande du propriétaire : « 60 footers standard mais très pros, avec animation fluide ; éviter les bords arrondis le plus possible, plutôt des bords carrés (plus pro) ».
Même logique que les 25 pieds « sites du quotidien » (voir `familles/vie-locale.js` et `CATALOGUE_QUOTIDIEN.md`) : modèles **indépendants du site** (mode `solo`, palette et polices propres), vrais contenus utiles, marques fictives, aucune coordonnée ni chiffre inventé.

## Règle n°1 : ANGLES DROITS
* **Aucun `border-radius` non nul dans tout le pied** : ni cartes, ni boutons, ni champs, ni pastilles, ni cartes (map), ni images, ni icônes de réseaux, ni points ronds.
* Dans `identite({...})` : `rayon: "0px", rayonBouton: "0px"`.
* Le kit a des défauts ARRONDIS à écraser : `G.pilule`/`G.pilules` (`rayon: "0px"` à passer), `G.pastille`, `G.boutons`, `G.abonnement` (`rayonBouton: "0px"`, `rayonChamp: "0px"`), les boutons du kit (`borderRadius: o.rayon || "999px"` : passer `rayon: "0px"`), le badge `k.T` (999px). Pour un nœud fait à la main : `borderRadius: "0px"`.
* Un test navigateur (`footer-v2-navigateur`, section « angles droits ») mesure `getComputedStyle(...).borderRadius` de TOUS les éléments du pied pour ces 60 modèles : tout ≠ 0 échoue. Les widgets partagés (réseaux, recherche, e-mail, horaires, carte…) doivent être vérifiés un par un : si un widget impose un arrondi qu'on ne peut pas retirer par ses `parts`, ne pas l'utiliser.
* Pour le caractère « pro » : filets fins, aplats francs, grilles, alignements rigoureux, grandes capitales, numérotation, bandes à bords nets, barres de couleur verticales ou horizontales, cartouches à angles droits.

## Règle n°2 : STANDARD MAIS TRÈS PRO
Pieds lisibles et crédibles pour des sites ordinaires (une PME, un cabinet, une boutique…), pas des pieds expérimentaux : colonnes de liens claires, coordonnées et horaires (widgets « Données de l'entreprise »), réseaux, lettre d'information, mentions légales. Sobriété, hiérarchie nette, typographie soignée, contrastes AA.
Chaque famille de 5 modèles doit offrir 5 compositions et 5 palettes NETTEMENT différentes (pas des variantes d'une même grille), et chaque modèle une idée graphique propre (pas seulement une autre couleur).

## Règle n°3 : ANIMATIONS FLUIDES
* Transitions de survol/focus longues et douces (`transitionDuration` 300 à 450 ms, la constante `G.MOUVEMENT` du kit) : couleur, fond, filet qui s'étire, décalage de 2 à 6 px, soulignement qui se dessine.
* Au moins UNE animation visible et élégante par modèle, parmi celles que le moteur sait faire (champ `motion` / `anime(...)` du kit, `scrollFx`) : barre ou filet qui se remplit au survol, carte qui se soulève (`lift`), flèche qui glisse, pastille qui « souffle » (pulse lent), fond qui change doucement, indicateur de statut qui respire. Fluide = courbes douces, pas de saccade, pas de clignotement, pas d'effet agressif.
* Tout doit disparaître sous « prefers-reduced-motion: reduce » (le moteur le fait ; le test « 0 animation » le vérifie). Limite connue du moteur : PAS d'animation d'ENTRÉE (elle devient un fondu de 300 ms refusé par ce test) ; PAS de widget « Défilement continu » (l'audit le signale hors écran). Un `hover:"lift"` seul est autorisé, pas d'`entrance` sur un nœud qui doit rester visible.

## Contraintes de construction (rappel)
* Un fichier par famille, déjà créé en squelette (`built: false`, `models: []`) : le remplir, `built: true` quand 5 modèles. Identifiants `ft2-<NNN>-<slug>` (`identifiantV2`), noms français distincts dans toute la bibliothèque (vérifier qu'aucun autre fichier de `familles/` n'utilise le même nom).
* `concept` = identifiant de la fiche `c-<NNN>-<slug>` ; écrire les 10 fiches (2 familles) dans `docs/footer-v2/concepts/carre/<agent>.json` au format `{ "concepts": [ … ] }` (même forme que `concepts-quotidien.json` : id, ordre, nom, famille, secteur, directionArtistique.texte, typographies {titre, corps, accent, source}, tags).
* Polices : uniquement la bibliothèque locale (`font.<nom>`), 2 familles au plus par modèle. Couleurs `#rrggbb`. Pas de `token:`/`var(--kw-…)`. Contrastes AA. Racine : `racine: { desktop: { backgroundColor, gap: "0px" } }`.
* Cibles tactiles ≥ 44 px à 390 px, focus visible ≥ 2 px, nom de site en lien de 44 px (`cibleTactile`), aucun débordement horizontal 390/820/1280/1920, imbrication ≤ 8 niveaux, widgets autorisés sans droit code (pas de widget HTML ni de `bizemail` déclaré en dehors de ceux acceptés par le test : voir `vie-locale.js`).
* Ne PAS modifier `index.js`, les tests, ni les fichiers des autres familles. Ne jamais supprimer de fichier.

## Vérifier (depuis la racine du dépôt de travail)
1. Charger : `node -e 'const V=require("./src/themeBuilder/catalog/footer/v2"); console.log(V.assemble().familles.map(f=>f.key+":"+f.models.length).slice(-12))'`
2. Mesure Chrome : `FOOTER_V2_APERCU=1 node scripts/audit-pieds-cdp.js --v2 …` (voir l'en-tête du script pour filtrer par modèle) : 0 défaut sur les 5 largeurs avec et sans données ; OUVRIR les captures (390 et 1280) et les regarder.
3. `FOOTER_V2_ONLY=ft2-126-…,ft2-127-… TEST_START_TIMEOUT_MS=900000 node --test tests/footer-v2-navigateur.test.js` (modèles de votre famille uniquement).
4. Angles droits : vérifier avec une lecture Chrome que `borderRadius` calculé = 0 sur tous les éléments du pied (script CDP ou test).
La machine est chargée (plusieurs agents en parallèle) : relancer seul un test qui expire.
