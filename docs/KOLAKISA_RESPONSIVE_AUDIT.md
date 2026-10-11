# Audit du moteur responsive

*Mission 4. Branche `responsive` (partie de `146aaa4`). Rapports des missions 1 à 3 lus ; leurs résultats servent de références (parité canevas / publié, aperçu immédiat, priorité CSS) et ne sont pas refaits.*

## 1. Système réel (lu dans le code, vérifié dans Chrome)

| Élément | Constat |
|---|---|
| Appareils | 4 : `desktop`, `wide` (≥ 1920), `tablet`, `mobile` (`BREAKPOINTS`, `nodes.js`) |
| Points de rupture par défaut | tablette ≤ **1023**, mobile ≤ **767**, grand écran ≥ **1920** (`DEFAULT_BREAKPOINTS`) |
| Configurables | Oui, **par site** (`siteSettings.layout.breakpoints`, bornes : tablette 820–1279, mobile 400–767 ; mobile < tablette). Propagés à `pageCss`, `classCss` et à la règle de visibilité |
| Stockage | `styles.<appareil>.<propriété>` et `states.<état>` ; une clé absente n'écrit rien |
| Héritage | tablette ← ordinateur, mobile ← tablette ← ordinateur, **grand écran ← ordinateur (jamais la tablette)** ; CSS en cascade par `@media` ; côté éditeur `inheritedValue` |
| Canevas | iframe : ordinateur = `tablette + 1` px (1024 par défaut), grand écran 1920, tablette 820, mobile 390 ; largeur du bureau recalée sur les points de rupture du site |
| Visibilité par appareil | `hideOn: [appareils]` → classes `lp-hide-*` + `@media` (à la fin de `pageCss`) |

## 2. Résultats vérifiés (tests nouveaux, Chrome réel)

| Question | Réponse | Preuve |
|---|---|---|
| Une valeur posée sur un appareil écrase-t-elle les autres ? | **Non**, pour 9 réglages de 4 types d'éléments (taille, largeur, marge, alignement du texte, casse, direction, justification, gap, largeur d'image) dans l'ordre ordinateur → tablette → mobile → retour ; même après rechargement ; ↺ ne retire que la valeur de l'appareil | `responsive-isolation-navigateur` (9/9) |
| Le contrôle affiche-t-il la valeur de l'appareil ? | Oui, après chaque changement d'appareil et après rechargement | idem |
| Limites exactes des points de rupture (−1 / limite / +1) et largeurs intermédiaires (19 largeurs) | Valeur correcte partout, avec les points de rupture par défaut **et** ceux d'un site qui les a réglés (tablette 1279, mobile 600) ; aucun débordement horizontal | `responsive-largeurs-navigateur` |
| Héritage | « seulement mobile » : l'ordinateur et la tablette gardent leur valeur ; « grand écran » ne reprend jamais la valeur de la tablette ; le mobile reprend la tablette | idem |
| Grille | 3 → 2 → 1 colonnes aux limites 1023/1024 et 767/768 | idem |
| Canevas de chaque appareil = page publiée à cette largeur | Oui (4 appareils × 2 jeux de points de rupture) | idem |
| Aperçu immédiat sur tablette / mobile | Oui (rendu serveur retardé de 2,5 s : taille et alignement apparaissent tout de suite, enregistrés pour CET appareil seulement) | `responsive-apercu-navigateur` (2/2) |
| Changer d'appareil | 6 à 25 ms ; **aucun enregistrement** déclenché ; 1 rendu serveur par changement | rapport de performance |

## 3. Aucun défaut du moteur démontré — et une fausse piste écartée

**Fausse piste (corrigée par moi-même pendant la mission).** J'ai d'abord pris pour un défaut le fait que « Afficher sur : Ordinateur ☐ » masque aussi les écrans ≥ 1920 px (la règle `.lp-hide-desktop` n'a pas de borne haute), et je l'avais corrigé. Les tests existants ont montré que c'est un **choix documenté et testé** (`elementor-parite-5-grand-ecran-navigateur` : « « ordinateur » masque aussi le grand écran (compatibilité) », pour que les pages créées avant l'existence de l'écran « Grand écran » restent masquées sur les grands écrans). Ma correction contredisait la règle de préservation des pages existantes ; **elle a été annulée** (`nodes.js` inchangé). Le comportement est désormais verrouillé par un test et signalé en limite : l'interface affiche pourtant quatre cases indépendantes, ce qui peut surprendre.

**Production : aucune modification de code.** Les trois angles audités (isolation des valeurs, limites des points de rupture, aperçu sur tablette / mobile) n'ont révélé aucun défaut ; le livrable de code de cette mission est donc un jeu de tests qui le démontre.

## 4. Non constaté

Aucune fuite de valeurs entre appareils, aucune erreur de limite, aucun débordement horizontal sur la page d'essai, aucune divergence canevas / publié. Le moteur responsive est consolidé par des preuves, pas réécrit.

## 5. Point de vigilance hérité (test numérique intermittent)

Non reproduit dans cette mission non plus (le fichier fait partie du lot de régression ; résultats dans le rapport de tests). Cause toujours inconnue.
