# Canvas du Page Builder KOLAKISA — audit face aux règles documentées d'Elementor (9 octobre 2026)

Mission : vérifier que le Canvas existant se comporte comme un vrai moteur de création (conteneurs Flexbox imbriquables, widgets,
dimensions, insertion, sélection, Structure, responsive, enregistrement, publication), **sans le remplacer**. Cette note garde la trace de ce qui a
été lu, mesuré, corrigé et testé. Aucune valeur d'Elementor n'est reprise comme vérité : on distingue ce qui est **documenté**, ce qui est
**propre à Kolakisa** (choix d'implémentation) et ce qui est **mesuré**.

## 1. Règles documentées retenues (pages d'aide Elementor lues le 9 octobre 2026)

| Sujet | Règle documentée | Source |
|---|---|---|
| Largeur du conteneur | Deux modes : *Boxed* (la largeur règle le **contenu**, pas le conteneur) et *Full Width* (le contenu suit la largeur du conteneur). Défaut : Boxed. Unités : px, %, vw | « Define container layout » |
| Hauteur | *Min Height* seulement, en px ou vh (« 100vh = hauteur de la fenêtre ») | idem |
| Disposition | Direction (4 valeurs), Justify (6), Align items (4), Gap (px, %, vw ; 20 px par défaut du site), Wrap, Align content (6), Overflow (défaut / masqué / auto), balise HTML | idem |
| Réglages avancés | Marges et intérieurs par côté (px, em, %, rem), largeur d'un widget (pleine / en ligne / personnalisée), align-self, ordre (début / fin / personnalisé), taille flex (grow / shrink / personnalisée), position (défaut / absolue / fixe + décalages), z-index, ID et classes CSS | « Define advanced settings » |
| Marges de premier niveau | Une marge gauche/droite sur un conteneur de premier niveau fait déborder (100 % + marge) : il vaut mieux la mettre sur un enfant | « Set container size and behavior » |
| Responsive | Points de rupture par défaut : tablette 1024 px, mobile 767 px ; les petits écrans héritent du bureau tant qu'aucune valeur propre n'est définie ; direction, wrap, ordre, visibilité modifiables par écran | « Responsive design using containers » |
| Données | Un conteneur = `id`, `elType`, `isInner`, `settings`, `elements` ; récursif | developers.elementor.com |

Limites de la lecture : les pages d'aide ne donnent ni valeur par défaut de flex-grow / shrink / basis ni liste des largeurs de widget (« en ligne /
pleine / personnalisée ») sous forme exploitable ; le détail du stockage responsive (`_tablet`, `_mobile`) n'est pas dans l'extrait lu. Ces points n'ont
donc pas servi de référence.

## 2. Architecture du Canvas de Kolakisa (conservée)

- **Document** : `mk_landing_pages` → `{ sections[], title, description, seo, theme }` ; arbre récursif d'éléments `{ id, type, props, styles{écran → état → propriétés}, children }` (`src/marketing/pages/nodes.js`). Grammaire **fermée** : une propriété de style = un validateur (`STYLE_PROPS`), valeur refusée ou ignorée sinon.
- **Rendu unique** : `views/marketing-public/_sections.ejs` + `_node.ejs` + `landing.css`, pour le canevas (`POST /rendu`), l'aperçu et la page publiée. Le canevas est un `<iframe>` ; les aides d'édition sont des surcouches `position:absolute`.
- **Éditeur** : `public/js/page-builder.js` (Structure, Inspecteur, canevas, glisser-déposer, historique, enregistrement automatique).
- **Écrans** : ordinateur (fluide, au moins 1 024 px), tablette 820 px, mobile 390 px ; points de rupture du site 1 023 / 767 px, réglables (Réglages du site). Le zoom est une transformation du cadre : les dimensions enregistrées ne changent pas.

## 3. Tableau d'écarts

| Comportement attendu | Comportement actuel (mesuré) | Écart | Cause | Composant | Correction | Test |
|---|---|---|---|---|---|---|
| Créer un conteneur : « + » → disposition (Flexbox / Grille) → 16 structures | Existe : sélecteur de mise en page, structures prédéfinies (une à quatre colonnes, lignes, en-tête + pied…) | aucun | — | `page-builder.js` (`canvasAdd`) | — | T1 |
| Largeur / hauteur min. / direction / répartition / alignement / écart / wrap réellement appliqués | Oui pour les 43 réglages testés (CSS calculé par Chrome) | aucun | — | `STYLE_PROPS`, `landing.css` | — | `proprietes-effectives` (129 contrôles) |
| **Largeur max., marge gauche/droite d'un conteneur en pleine largeur ou imbriqué** | **Sans effet** : « 260 px » devenait « none », « 23 px » devenait « 0 » | **Réglage décoratif** (le contrôle de l'Inspecteur existait mais n'agissait pas) | Règles par défaut `.kw-container.kw-full` et `.kw-container .kw-container` (spécificité 0-2-0) plus fortes que le réglage de l'élément `.kw-n-<id>` (0-1-0) | `public/css/landing.css`, `siteSettings.js` | Valeurs par défaut en `:where()` (spécificité nulle) ; la règle de largeur du site exclut les conteneurs imbriqués | `dimensions` (largeur max. 300 px l'emporte sur 800 px, même en pleine largeur) et `proprietes-effectives` |
| Boxed = fond sur toute la largeur, contenu limité | « Encadrée » = **le conteneur lui-même** est limité (1 100 px) et centré ; le fond suit | Différence de modèle | Choix d'origine de Kolakisa (le conteneur est la boîte) | `landing.css`, `nodes.js` | **Mode ajouté en option** « Fond pleine largeur, contenu encadré » (voir § 4) ; « Encadrée » inchangée | `fond-pleine-largeur` |
| Largeur de contenu par défaut 1 140 px | 1 100 px (conteneurs) dans une colonne de page de 760 px par défaut | Valeurs différentes, **réglables** | Pages d'abord pensées comme pages de vente en colonne | `siteSettings.js` | Réglable : Réglages du site › Mise en page (contenu pleine largeur, largeur du contenu, largeur des conteneurs). Valeurs par défaut conservées pour ne pas casser l'existant | — |
| Gap par défaut 20 px | 16 px | Valeur par défaut | Choix d'origine | `landing.css` | Non modifié (même raison) | — |
| Conteneur vide : pas de hauteur arbitraire | Dans le **canevas seulement**, un conteneur vide reçoit une zone d'édition (11 à 17 rem) pour pouvoir le cliquer et y déposer ; **absente de la page publiée** (0 px) | Voulu (éditeur) | Sans cela un conteneur vide mesure 0 px et n'est pas utilisable | `landing.css` (`.lp-builder .kw-is-empty`, `:where`) | Conservé : elle disparaît dès qu'un enfant est ajouté, et tout réglage de hauteur l'emporte (spécificité nulle) | Test de parité (conteneurs remplis) |
| Widget : largeur adaptée au type | Titre / texte / image / séparateur : pleine largeur du parent ; **bouton : en ligne** (115 px mesurés) | aucun | — | `landing.css` | — | mesure directe |
| Ordre, align-self, taille flex, position, z-index, overflow | Contrôles présents et réels (Ordre : début / fin / personnalisé ; flex-grow / shrink / basis ; position statique → fixe + décalages) | aucun | — | `page-builder.js` (`orderControl`, `CHILD_KEYS`) | — | `proprietes-effectives` |
| Responsive : surcharge par écran sans toucher au bureau ; héritage | Oui : le bureau reste intact, l'écran mobile a sa valeur, enregistrée dans `styles.mobile` | aucun | — | `setStyle`, `styleSet` | — | T15 |
| Insertion : indication de dépôt fidèle, parent et rang justes | Oui : « Après « Texte · Droite 1 » · dans « Conteneur » », trait sur la largeur de la cible ; l'élément arrive dans CE conteneur, au bon rang, sélectionné | aucun | — | `showDropIndicator` | — | T7 (vrai glisser-déposer) |
| Sélection : cadres hors flux, enfant sélectionné (pas le parent), parent par le fil d'Ariane | Oui : aucune dimension ni position ne change, défilement stable | aucun | — | `drawOverlays` | — | T10 |
| Structure = même modèle que le canevas | Oui : déplacer dans Structure met le canevas à jour (et inversement) | aucun | un seul arbre | `renderTree` | — | T13-T14 |
| Enregistrement, rechargement, annuler / rétablir | Document identique après rechargement ; annuler / rétablir sans doublon | aucun | — | `change`, `saveNow` | — | T16, T20 |
| Rendu public = canevas | Mêmes positions et tailles (±1 px) sur ordinateur, tablette et mobile ; aucun cadre ni bouton d'édition dans la page publiée | aucun | — | rendu partagé | — | T18-T19 |
| Pas de débordement horizontal involontaire (1 280 / 1 024 / 820 / 390 px) | Aucun, mot très long compris | aucun | — | `landing.css` | — | `dimensions` |
| Unités non rendables refusées | `10pt`, `5cm`, `12in`, `calc()`, `expression()` refusés (422) ; `px %, rem, em, vw, vh, auto` acceptés | aucun | grammaire fermée | `STYLE_PROPS` (`len`) | — | `dimensions` |

## 4. Suite donnée aux écarts (10 octobre 2026)

1. **Boxed façon Elementor — fait, en option.** Nouveau mode de conteneur « Fond pleine largeur, contenu encadré » (Inspecteur › Général › Largeur du contenu). Le conteneur (donc son fond) occupe toute la largeur de son parent ; ses intérieurs gauche / droite centrent le contenu à la largeur des conteneurs du site (réglable). L'intérieur choisi par l'auteur reste un minimum. Rien d'autre ne change : le HTML n'a pas d'enveloppe supplémentaire (sélection, glisser-déposer et Structure inchangés), les conteneurs existants gardent le mode « encadrée » et leur rendu. Stockage : `props.band` (exclusif avec `props.full`). Limite : un conteneur de ce mode doit garder une largeur automatique (une largeur propre fausserait le centrage).
2. **Valeurs par défaut — fait sans toucher à l'existant.** Un conteneur **ajouté** naît avec un écart de 20 px ; les conteneurs existants gardent leur écart (16 px). La largeur des conteneurs reste 1 100 px par défaut (réglable ; l'aide de Réglages du site indique que 1 140 px est la valeur courante) : la changer pour tous les sites déformerait toutes les pages déjà publiées.
3. **Conteneur vide — volontairement conservé.** La zone d'édition (11 à 17 rem) n'existe que dans l'éditeur : un conteneur vide à 0 px ne se voit pas et ne reçoit aucun dépôt. Elle disparaît dès le premier enfant, n'existe pas dans la page publiée (0 px mesuré) et tout réglage de hauteur l'emporte (spécificité nulle). La réduire reviendrait à l'ancien défaut « conteneur impossible à utiliser » corrigé le 7 octobre.
4. **Recherche documentaire complétée.** Confirmé : défilement « de haut en bas » du responsive (une modification sur un grand écran touche les plus petits, jamais l'inverse ; c'est le comportement de Kolakisa) ; points de rupture par défaut 1 024 / 767 px ; Elementor permet jusqu'à six points de rupture supplémentaires (Kolakisa : tablette et mobile réglables, pas de point supplémentaire). **Toujours non documentés dans les pages lues** : valeurs par défaut de flex-grow / shrink / basis et options de largeur d'un widget ; ils ne sont donc pas une référence ici.

## 4 bis. Constaté, non modifié

- **Marges gauche/droite sur un conteneur de premier niveau en pleine largeur** : même piège que celui décrit par Elementor (100 % + marge déborde). Non traité (je n'ai pas vérifié si l'interface avertit).
- Les unités `vh` / `vw` dans le canevas suivent la **fenêtre du cadre**, pas un appareil fictif.
- Une propriété de style inconnue (par exemple le raccourci `padding`) est **ignorée sans erreur** par le serveur.

## 5. Tests ajoutés (vrai Chrome, vrai serveur)

- `tests/editeur-canvas-moteur-navigateur.test.js` — parcours complet : créer, régler (largeur, hauteur min., encadrée → pleine largeur, direction, répartition, alignement, écart, retour à la ligne), imbriquer, ajouter des widgets, déplacer dans Structure, réordonner, mobile, enregistrer / recharger, annuler / rétablir, glisser-déposer palette → conteneur, sélection, publication et **parité canevas / page publiée sur trois écrans**.
- `tests/editeur-canvas-dimensions-navigateur.test.js` — largeurs (auto / fixe / % / vw / min / max), hauteurs, modèle de boîte, marges, wrap, nowrap, imbrication, contenu long, débordement horizontal à 4 largeurs, unités acceptées / refusées, parité canevas / publié.
- `tests/editeur-canvas-fond-pleine-largeur-navigateur.test.js` — mode « fond pleine largeur, contenu encadré » : fond, alignement exact du texte sur un conteneur encadré, intérieur minimum, choix dans l'Inspecteur, écart de 20 px des nouveaux conteneurs.
- `tests/editeur-canvas-proprietes-effectives-navigateur.test.js` — 43 réglages × 3 contextes de conteneur + 3 types de widget : chaque valeur enregistrée produit le CSS calculé attendu.

## 6. Contrat de mise en page « le parent met en page ses enfants » (10 octobre 2026)

**Symptôme.** Section libre > deux conteneurs, Affichage = Flex, Direction = ligne : le bouton se coche, les conteneurs restent empilés.

**Reproduction (vrai Chrome, page publiée).** Section en Flex avec les 4 directions : « ligne », « ligne inversée », « colonne », « colonne inversée » donnaient
le **même** résultat (conteneur 1 au-dessus du conteneur 2) ; le style de la section était bien écrit (`flex-direction: row`…) mais sur le mauvais élément.

**Cause exacte (preuve : styles calculés).** Cas C / J de la liste de causes : la valeur est stockée, rendue et appliquée, mais **à l'enveloppe, pas au parent réel des enfants**.
Une Section libre est rendue `.lp-block.kw-n-<id>` (porte les réglages de l'Inspecteur) › `.kw-layout` (flex colonne, écart 16 px, fixe) › enfants. Les enfants étaient donc
les éléments Flexbox de `.kw-layout`, jamais de la section. Les autres causes (bouton visuel seul, mauvais nom de propriété, écrasement par une règle plus spécifique, canevas ≠ publié, responsive) ont été écartées par mesure.
Le même schéma existait, plus discret, pour les **marges automatiques** : un conteneur centre sa largeur par `margin-inline: auto` ; dans un parent en ligne ou en grille, ces marges
se partagent l'espace libre et **neutralisent « Répartition » et « Écart »** (constaté pour les enfants conteneurs d'une Section libre, d'un Groupe ou d'une Pile).

**Flux avant.** Inspecteur › `styles.<écran>.display / flexDirection…` de la section › `.kw-n-<id>{…}` sur `.lp-block` › sans effet sur les enfants (enveloppe `.kw-layout` fixe).

**Flux après.** Idem, mais `.kw-layout` est transparente (`display: contents`) : les enfants directs sont les éléments Flexbox / Grille de la section. La mise en page par défaut (colonne, 16 px)
est portée par la section à spécificité nulle (`:where(.lp-block-layout)`) : tout réglage de l'auteur l'emporte. Pour les marges automatiques, le serveur écrit, pour chaque parent contenant des conteneurs,
une règle par écran (héritage ordinateur › tablette › mobile) qui retire ces marges quand le parent est en ligne / en grille et les rend quand un écran plus étroit repasse en colonne
(`rowMarginRules` dans `nodes.js`) ; les marges de l'enfant lui-même l'emportent toujours. L'éditeur lit le style du **vrai** parent (`layoutParentEl`) pour l'axe de l'indication de dépôt et l'accrochage.

**Contrat commun.** Tout élément qui peut contenir des enfants (`container: true` dans le registre : Section libre, Conteneur, imbriqué, Groupe, Pile, Colonnes, Grille) utilise le même moteur : mêmes propriétés
(`STYLE_PROPS`, groupe « layout »), mêmes règles CSS, mêmes réglages par écran. Un futur type d'élément qui déclare `container: true` hérite du contrat ; les tests ci-dessous échouent s'il ne le respecte pas.

**Tests (vrai Chrome).**
- `editeur-layout-contrat-navigateur.test.js` : 6 types de parents × 15 scénarios (4 directions, wrap, répartition centre / espacé, alignement, écart, grille 3 et 2 colonnes, valeurs par écran R/C/C, C/R/C, R/R/C) mesurés à 1 280, 900 et 390 px. Sans les correctifs : Section libre, Groupe et Pile échouent.
- `editeur-layout-section-navigateur.test.js` : critère d'acceptation par l'interface (Affichage = Flex, Direction ligne / colonne / ligne inversée / colonne inversée), répartition, enregistrement, rechargement, annuler / rétablir (cadre non rechargé), aperçu, page publiée, mobile en colonne.
- `editeur-canvas-proprietes-restantes-navigateur.test.js` : toutes les propriétés de `STYLE_PROPS` non couvertes par le premier fichier + réglages composés, **avec garde-fou** : une propriété ajoutée sans test d'effet réel fait échouer la suite.

**Autre contrôle décoratif trouvé et corrigé.** Image : « Hauteur » et « Proportions » de l'élément s'appliquaient à la boîte mais l'image gardait sa hauteur naturelle (boîte vide en dessous), et « Cadrage » / « Point focal » n'avaient aucun effet
(`object-fit` posé sur la boîte, pas sur l'image). Mesuré avec une vraie image 400 × 100 dans une boîte 300 × 300 : image 300 × 75, `object-fit: fill`. Corrigé : l'image remplit sa boîte quand une hauteur ou des proportions sont définies pour l'écran ;
cadrage et point focal sont hérités. Une image sans réglage garde sa taille naturelle (mesuré).

**Contrôles vérifiés et conformes.** Les 43 réglages de conteneur et 3 types de widget (premier fichier), puis typographie, couleurs, bordures par côté et par coin, ombres, filtres, transformation, masque, dégradé, voile, image de fond, position, grille et placement d'un enfant de grille : chaque valeur produit le CSS calculé attendu.

**Effet sur les pages existantes (à savoir).** Une Section libre où quelqu'un a déjà coché Direction, Écart, Répartition ou Grille voyait ce réglage ignoré : il s'applique maintenant. Je n'ai pas pu compter ces cas en production (la base locale ne contient aucune page).
Une image dont l'élément avait une hauteur ou des proportions enregistrées est maintenant remplie et recadrée comme demandé.

**Risques restants.** Un widget de type image dans une boîte à hauteur fixe est recadré (voulu) ; `min-height` seul ne force pas le remplissage ; un conteneur du mode « Fond pleine largeur, contenu encadré » doit garder une largeur automatique.
