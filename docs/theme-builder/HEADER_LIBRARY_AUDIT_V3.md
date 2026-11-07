# Bibliothèque d'en-têtes « Atelier » : audit V3 et évolutions décidées

Constat factuel, mesuré sur le catalogue réel et sur des captures Chrome (planches `/private/tmp/claude-501/hd-shots/planche-<secteur>.png`, script `scripts/capture-entetes.js`). Aucune appréciation esthétique n'est présentée comme une mesure.

## 1. État actuel

* 100 modèles = 10 secteurs × 10, **36 architectures** (`header/arch.js`), toutes construites par les mêmes briques (`header/blocks.js`) : une architecture sert 1 à 5 modèles (`cells` 5, `twolevel` 5, `classic`/`centre`/`masthead`/`frame`/`monument`/`booking` 4 chacune ; `bigcta`, `slim`, `searchfirst` 1).
* La signature de composition (types d'éléments, grille, position, filets, formes, navigation, éléments masqués) est unique pour les 100 modèles : le test actuel est donc satisfait, **mais cette signature ne regarde pas le dessin obtenu** (deux compositions « différentes » par la signature peuvent produire presque la même silhouette).
* Identités (couleurs fixes + polices locales) : propres à chaque modèle. C'est ce qui fait varier l'impression à l'œil ; la **structure** varie peu.

## 2. Familles de rendu identiques constatées sur les planches

Lecture des planches desktop 1280 px (regardées : tech, corpo, luxe, sport ; les modèles des autres secteurs sont rattachés aux familles d'après la mesure de distance ci-dessous, pas d'après un regard) :

| Famille | Modèles concernés (constat visuel) | Ce qui se répète |
|---|---|---|
| « Barre d'annonce colorée + rangée marque à gauche / menu centré / compte + bouton à droite » | tech-01, tech-02, tech-03, tech-05 ; corpo-01, corpo-02, corpo-03 ; ecom (étals à bandeau) | même découpage en deux bandes, même place de chaque élément ; seuls fond, police et couleur du bouton changent |
| « Une rangée : marque à gauche, menu au centre, bouton à droite » | tech-04, tech-10, sante-01/02/04/05, corpo-04/05/09, sport-01/02/05/06, agence-06, resto-10, media-05/07/08/09 | identique à la hauteur et à la teinte près |
| « Marque centrée, liens fins de chaque côté ou dessous » | luxe-01, luxe-03, luxe-04, luxe-05 | même axe central, mêmes capitales espacées |
| « Pilule flottante » | tech-06, tech-07 | même forme arrondie détachée du bord |

Distance visuelle mesurée (niveaux de gris, sans texte, 96×24, contraste normalisé, distance L2 ; voir `rapport-visuel-entetes-atelier.json`) :
* plus proche voisin : **0,015** (resto-01 / resto-03) ; médiane des plus proches voisins **0,061**, 90e centile 0,138 ; distance médiane entre deux modèles quelconques ≈ 0,3 ;
* **56 paires** sous le seuil retenu de **0,05** (12 dans un même secteur, 44 entre secteurs) ; 39 modèles sur 100 ont au moins un « jumeau » sous ce seuil (resto 7, tech 6, corpo 5, sante 5, sport 4, media 4, archi 2, agence 2, luxe 2, ecom 2) ;
* jumeaux évidents retrouvés : tech-01 / tech-03 (0,043), corpo-01 / corpo-02 (0,026), archi-01 / archi-02 (0,016), sante-04 / sante-05 (0,019), resto-01 / resto-03 (0,015).
* Calibrage du seuil : 0,05 attrape les jumeaux évidents ci-dessus et laisse passer des paires visiblement distinctes sur les planches (ex. ecom-01 / ecom-03 à 0,073, sport-01 / sport-02 à 0,068, luxe-01 / luxe-02 à 0,25). Il se règle par `ENTETES_SEUIL`. tech-01 / tech-02 (0,30) n'est pas détectée : la barre sombre et la rangée sombre de tech-02 contrastent autrement que celles de tech-01 ; la mesure par niveaux de gris est un indicateur, pas un jugement.

## 3. Lacunes fonctionnelles (reprises de la section « Limites restantes » du rapport des 100 modèles)

1. Pas de menu plein écran sur ordinateur dans la bibliothèque (le menu natif ne se replie que sur mobile) : le widget Motion Studio existait mais ses liens étaient écrits à la main et **sa feuille de styles était absente de `main`** (voir 4.1).
2. Pas de méga-menu à panneaux (un seul niveau de sous-menu).
3. Pas de logo alternatif au défilement, pas de logo clair/sombre, barre supérieure non fermable.
4. Mouvements non natifs : « split text », « character reveal », « magnetic button » non utilisés dans les en-têtes (les widgets Motion Studio existent mais ne sont pas posés dans les modèles).
5. Aperçu responsive dans la fenêtre de la bibliothèque : un seul rendu par largeur, pas de sélecteur d'appareil (travail de l'agent « UI/exécution »).
6. Pas de bouton « revenir au modèle initial » dédié.
7. Constaté pendant l'audit : un `iconlist` en ligne (`is-inline`, `display:flex`) **n'est pas masqué sur mobile** malgré `hideOn: ["mobile"]` (la règle `.lp-hide-mobile` est moins spécifique que `.kw-iconlist.is-inline`). Les coordonnées de l'architecture `contactfirst` (`blocks.contact`) en sont affectées ; la brique `X.info` contourne le défaut. Le correctif propre est dans la feuille de style de base (hors périmètre de ce lot).

## 4. Évolutions décidées (et état)

### 4.1 Faites dans ce lot
* **Contrat par secteur** (`header/sectors/<secteur>.js`, validation au chargement, doc `HEADER_SECTOR_CONTRACT.md`) : 10 fichiers livrés avec `models: null` (existant conservé) ; test `theme-builder-entetes-contrat-secteur.test.js`.
* **Briques nouvelles** (`header/blocks2.js`, testées dans Chrome) : disque, anneau, bandeau diagonal, liseré en dégradé, filet vertical, case colorée, titre monumental fluide, ticker (widget `marquee`), bloc d'informations (consignes), mosaïque de navigation, navigation verticale, **menu plein écran ordinateur + mobile**, pastille de panier.
* **Évolution moteur (additive)** : le widget « Menu plein écran animé » reçoit un réglage `source` (`manual` par défaut, comportement inchangé ; `location` = liens du menu affecté à « En-tête », premier niveau ; aucun menu affecté = rien d'affiché).
* **Correction d'une régression sur `main`** : `public/css/motion-studio.css` ne contenait plus que 26 lignes (le menu plein écran et les autres composants Motion Studio n'avaient plus de style : panneau jamais masqué, bouton sans forme). La version complète (773 lignes, commit `7931646b`) a été restituée ; aucune ligne existante modifiée. À valider/fusionner séparément par l'agent « UI/exécution » s'il touche ce fichier.
* **Mesure de diversité visuelle** : `scripts/lib/entetes-visuel.js`, `scripts/audit-entetes-atelier.js --visuel [secteur…]`, test navigateur à **cliquet** (aucune nouvelle paire sous 0,05 ; les 56 paires héritées sont listées dans `scripts/lib/entetes-paires-tolerees.json` et doivent disparaître ; `ENTETES_STRICT=1` interdit toute paire).

### 4.2 À faire par les 10 agents de secteur
* Réécrire les 10 modèles de chaque secteur avec une composition propre, en s'appuyant sur les briques ; vider la liste des paires tolérées au fur et à mesure (le test échoue si une paire tolérée est devenue distincte : on la retire).
* Chaque modèle déclare `features`, `animations`, `settings` : seul ce qui existe réellement.
* Audit de clôture : planches `capture-entetes.js`, `--visuel`, `ENTETES_STRICT=1`.

### 4.3 Non décidé / hors périmètre
* Méga-menu à panneaux, logo alternatif, barre supérieure fermable : nécessitent des évolutions du widget menu et du moteur ; non engagées.
* Vraie grille à colonnes pour la liste des liens du menu (la partie « Liste » n'accepte que flex), numérotation des liens du menu, formes en position absolue : voir les limites du contrat.
* Correctif de spécificité de `.lp-hide-*` (voir 3.7).
