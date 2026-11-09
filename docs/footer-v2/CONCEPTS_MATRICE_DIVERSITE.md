# Concepts de pieds de page : matrice de diversité

Date : 9 novembre 2026. Branche `footer-v2-etude`. Phase 1 (conception sur papier) : **aucun code du produit n'a été écrit ou modifié**. Les 100 concepts sont décrits dans `CONCEPTS_100.md` et, sous forme de données, dans `concepts/concepts.json`. Cette page explique comment on a mesuré la diversité, ce qu'on a corrigé et ce que la mesure ne dit pas.

## 1. En clair

- Sur les 4 950 paires possibles de concepts, la plus proche est à **0.454** (sur 1) ; la moyenne est de **0.865**. Aucun couple n'est sous le seuil de 0,45 fixé pour la phase 1.
- Au départ (première version des 100 fiches), **81 paires** étaient sous 0,45 et la plus proche était à 0.062 : plusieurs fiches étaient des quasi-doublons (deux « cartes empilées », deux « lignes uniques », deux « onglets »…). Elles ont été reconçues, pas seulement recolorées.
- Aucune composition ne dépasse 5 concepts sur 100 (limite : 15 %). Aucune famille de palette ne dépasse 10 sur 100 (limite : 20 %).
- Les 100 concepts ont aussi été comparés aux **100 modèles actuels**. Ils sont globalement très différents (la plupart des modèles actuels sont des grilles de colonnes ou des bandes empilées), mais **8 concepts** étaient trop proches de modèles actuels : ils ont été reconçus (section 8).
- La mesure porte sur ce que les fiches **déclarent**, pas sur ce qu'on verra à l'écran. Voir les limites (section 10).

## 2. Méthode

Chaque concept porte des attributs **catégoriels** (valeurs de listes fermées, voir `concepts/concepts.json`, clé `vocabulaires`). La distance entre deux concepts, de 0 (identiques) à 1 (tout est différent), est une somme pondérée :

| Bloc | Poids | Attributs comparés | Règle |
|---|---|---|---|
| Composition | 30 % | `compositionType` (32 types) | 0 si identique, 1 sinon |
| Structure | 25 % | colonnes desktop, position du logo, style de menu | moyenne ; colonnes : 0 si égales, 0,5 si écart de 1, sinon 1 |
| Direction visuelle | 25 % | famille de palette, famille typographique, langage de formes, type de fond | moyenne de 4 égalités |
| Geste et interactions | 10 % | geste fort (≈ 85 valeurs), interaction | moyenne de 2 égalités |
| Responsive | 10 % | stratégie mobile (8 valeurs) | 0 si identique, 1 sinon |

Seuil de « trop proche » : **distance < 0,45**. Limites de répartition : une même composition ≤ 15 %, une même famille de palette ≤ 20 %.

Scripts (hors dépôt) : `/private/tmp/claude-501/-Users-imac-Downloads-Ptojry-google-stich-design/234805b0-e56d-4b6e-a957-09d5db8adc8d/scratchpad/concepts-v2/` (`analyze.py` pour la distance, `final.py` pour les exports, `current.py` et `textsim.py` pour la comparaison aux modèles actuels). Les données sont dans `concepts/concepts.json` ; la matrice complète 100 x 100 est dans `concepts/matrice_distances.json`.

## 3. Répartition de chaque attribut

### compositionType (32 valeurs utilisées)

```
tableau-de-bord                      5  ██████████████████████████████
asymetrique                          5  ██████████████████████████████
frise                                5  ██████████████████████████████
annuaire                             4  ████████████████████████
modulaire-bento                      4  ████████████████████████
split-vertical                       4  ████████████████████████
marque-monumentale                   4  ████████████████████████
centre-pile                          4  ████████████████████████
phrase-geante                        4  ████████████████████████
image-de-fond                        4  ████████████████████████
4col                                 4  ████████████████████████
cta-plein                            4  ████████████████████████
bandeau-lateral                      3  ██████████████████
bandes-superposees                   3  ██████████████████
cadre-passe-partout                  3  ██████████████████
navigation-horizontale-compacte      3  ██████████████████
formulaire-integre                   3  ██████████████████
carte-decollee                       3  ██████████████████
editorial-colonne                    3  ██████████████████
navigation-verticale                 3  ██████████████████
immersif                             3  ██████████████████
colophon                             2  ████████████
3col                                 2  ████████████
cartes-empilees                      2  ████████████
index-numerote                       2  ████████████
onglets                              2  ████████████
ticker-statique                      2  ████████████
5-6col-mega                          2  ████████████
ligne-unique                         2  ████████████
2col                                 2  ████████████
carte-localisation                   2  ████████████
accordeon                            2  ████████████
```

### paletteFamille (14 valeurs utilisées)

```
sombre-neutre                       10  ██████████████████████████████
blanc-casse                          9  ███████████████████████████
pastel                               9  ███████████████████████████
beige-sable                          9  ███████████████████████████
vif-sature                           8  ████████████████████████
bicolore-contraste                   8  ████████████████████████
monochrome-couleur                   8  ████████████████████████
noir                                 8  ████████████████████████
sombre-bleu                          7  █████████████████████
sombre-chaud                         7  █████████████████████
degrade                              6  ██████████████████
clair-froid                          4  ████████████
terre-naturel                        4  ████████████
neon-sombre                          3  █████████
```

### typoFamille (11 valeurs utilisées)

```
sans-geometrique                    15  ██████████████████████████████
serif-editorial                     15  ██████████████████████████████
display                             11  ██████████████████████
grotesque                           10  ████████████████████
humaniste                            9  ██████████████████
arrondie-douce                       9  ██████████████████
mono                                 9  ██████████████████
condensee                            8  ████████████████
serif-contraste                      7  ██████████████
slab                                 5  ██████████
script-accent                        2  ████
```

### formeLangage (9 valeurs utilisées)

```
angles-droits                       22  ██████████████████████████████
filets                              20  ███████████████████████████
arrondis                            13  ██████████████████
organique                           12  ████████████████
cadre-bordure                        8  ███████████
cartes                               8  ███████████
pilules                              8  ███████████
facettes                             6  ████████
brutaliste                           3  ████
```

### fond (8 valeurs utilisées)

```
aplat                               46  ██████████████████████████████
texture                             12  ████████
degrade                             12  ████████
motif                               12  ████████
ligne-grille                         7  █████
bi-aplat                             6  ████
photo                                4  ███
verre                                1  █
```

### logoPosition (9 valeurs utilisées)

```
gauche                              41  ██████████████████████████████
centre                              27  ████████████████████
haut-large                           8  ██████
absent                               7  █████
monumental                           5  ████
signature-bas                        5  ████
droite                               4  ███
filigrane                            2  █
vertical                             1  █
```

### menuStyle (12 valeurs utilisées)

```
ligne-horizontale                   19  ██████████████████████████████
colonnes-titrees                    17  ███████████████████████████
minimal-3liens                      16  █████████████████████████
cartes-liens                        13  █████████████████████
tableau                             11  █████████████████
pilules                              9  ██████████████
annuaire-dense                       4  ██████
liste-geante                         4  ██████
index-numerote                       3  █████
onglets                              2  ███
mega-grille                          1  ██
accordeon                            1  ██
```

### newsletterStyle (8 valeurs utilisées)

```
aucune                              59  ██████████████████████████████
champ-souligne                      10  █████
inline-bouton                        9  █████
champ-pilule                         8  ████
carte-dediee                         7  ████
bande-pleine                         4  ██
formulaire-complet                   2  █
grande-phrase                        1  █
```

### contactStyle (8 valeurs utilisées)

```
aucun                               30  ██████████████████████████████
bloc-adresse                        24  ████████████████████████
ligne-compacte                      19  ███████████████████
horaires-en-direct                  10  ██████████
telephone-en-avant                   9  █████████
cartes-multiples                     4  ████
email-geant                          2  ██
carte-bureaux                        2  ██
```

### socialStyle (7 valeurs utilisées)

```
liste-texte                         26  ██████████████████████████████
icones-rondes                       25  █████████████████████████████
fleches-texte                       21  ████████████████████████
icones-carrees                      12  ██████████████
pastilles-texte                      9  ██████████
aucun                                5  ██████
grille-labels                        2  ██
```

### densite (3 valeurs utilisées)

```
moyenne                             52  ██████████████████████████████
aeree                               32  ██████████████████
dense                               16  █████████
```

### interaction (14 valeurs utilisées)

```
survol-decalage                     22  ██████████████████████████████
survol-inversion                    20  ███████████████████████████
apparition-fondu                    17  ███████████████████████
survol-soulignement                 15  ████████████████████
statique                             6  ████████
focus-renforce                       5  ███████
survol-soulignement-anime            3  ████
survol-fleche                        3  ████
survol-couleur                       3  ████
defilement-lent                      2  ███
trait-qui-se-dessine                 1  █
respiration-lente                    1  █
rotation-lente                       1  █
revelation-texte                     1  █
```

### responsiveStrategy (8 valeurs utilisées)

```
empilement                          31  ██████████████████████████████
reorganisation                      28  ███████████████████████████
accordeon                           15  ███████████████
grille-2col                          8  ████████
menu-compact                         8  ████████
defilement-horizontal                5  █████
elements-masques                     3  ███
onglets                              2  ██
```

### geste (84 valeurs utilisées sur 100 concepts)

Valeurs les plus partagées : sticker-pastille (4), logo-monumental (3), index-chiffre (3), chiffres-cles (2), accordeons-ouverts (2), fleche-geante (2), illustration-svg (2), ombre-dure (2). Les autres gestes sont portés par 1 ou 2 concepts.

### colonnes desktop
```
 1 colonne(s)    12  ███████████
 2 colonne(s)    22  █████████████████████
 3 colonne(s)    32  ██████████████████████████████
 4 colonne(s)    22  █████████████████████
 5 colonne(s)     8  ████████
 6 colonne(s)     2  ██
 7 colonne(s)     2  ██
```

**Contrôle des plafonds.** Composition la plus fréquente : tableau-de-bord (5 %). Palette la plus fréquente : sombre-neutre (10 %). Les deux sont sous les limites (15 % et 20 %).

Une réserve honnête : **la position du logo « gauche » reste majoritaire (41 %)**, le fond « aplat » aussi (46 %) et l'absence de newsletter (59 %). C'est volontaire en partie (un pied de page sérieux a souvent un logo à gauche et peu de décor) mais la phase 3 devra veiller à ne pas faire revenir un air de famille.

## 4. Distances entre concepts

| Indicateur | Valeur |
|---|---|
| Nombre de paires | 4950 |
| Minimum | 0.454 |
| 1er centile | 0.537 |
| 10e centile | 0.733 |
| Médiane | 0.875 |
| Moyenne | 0.865 |
| Maximum | 1.000 |
| Paires sous 0,45 | 0 |
| Paires sous 0,50 | 16 |

Histogramme des 4 950 distances :
```
0.00 - 0.45      0  
0.45 - 0.50     16  █
0.50 - 0.60     91  █
0.60 - 0.70    221  ███
0.70 - 0.80    739  ███████████
0.80 - 0.90   1777  █████████████████████████
0.90 - 1.00   2106  ██████████████████████████████
```

## 5. Les 20 paires les plus proches, avant et après

### Avant (première version des fiches)

| # | Distance | Concept A | Concept B | Même composition |
|---|---|---|---|---|
| 1 | 0.062 | mutuelle-en-cartes | cartes-de-classe | oui |
| 2 | 0.113 | agora-en-tuiles | appli-en-tuiles | oui |
| 3 | 0.113 | nom-et-heure | juste-une-ligne | oui |
| 4 | 0.125 | onglets-documentation | ecole-de-code | oui |
| 5 | 0.167 | index-du-comptable | revue-sommaire | oui |
| 6 | 0.175 | pacte-en-deux | deux-rives | oui |
| 7 | 0.175 | statut-nuage | plan-du-salon | oui |
| 8 | 0.175 | revue-sommaire | cotes-de-bibliotheque | oui |
| 9 | 0.175 | commande-en-grand | rendez-vous-bleu | oui |
| 10 | 0.196 | gouache-et-feuilles | coliving-arche | oui |
| 11 | 0.217 | filet-lumineux | contributeurs | oui |
| 12 | 0.217 | mode-en-capitales | nom-rogne-rouge | oui |
| 13 | 0.225 | neon-en-mouvement | glitch-au-survol | oui |
| 14 | 0.237 | registre-public | palace-annuaire | oui |
| 15 | 0.237 | usine-et-plan | chantier-rayures | oui |
| 16 | 0.237 | agora-en-tuiles | specimen-typographique | oui |
| 17 | 0.237 | gestion-privee | gouache-et-feuilles | oui |
| 18 | 0.237 | grain-de-pellicule | climat-en-chiffres | oui |
| 19 | 0.258 | chancellerie | cartel-de-musee | oui |
| 20 | 0.258 | filet-lumineux | journal-triple-filet | oui |

Avant, **81 paires étaient sous 0,45**. Presque toutes avaient la même composition et les mêmes choix structurels (même colonnes, même logo, même menu) : par exemple « Mutuelle en cartes » et « Cartes de classe » ne différaient que par les couleurs et le sujet, ce que l'utilisateur ne veut justement pas.

### Après (état final)

| # | Distance | Concept A | Concept B | Même composition |
|---|---|---|---|---|
| 1 | 0.454 | gestion-privee | point-final | oui |
| 2 | 0.467 | assurance-claire | atelier-sticker | oui |
| 3 | 0.471 | usine-et-plan | pellicule-et-salles | oui |
| 4 | 0.471 | plan-du-salon | rapports-ouverts | oui |
| 5 | 0.475 | chancellerie | coliving-arche | oui |
| 6 | 0.475 | carnet-de-marges | pied-en-phrases | oui |
| 7 | 0.475 | reportage-legende | gouache-et-feuilles | oui |
| 8 | 0.483 | grain-de-pellicule | courbes-de-niveau | oui |
| 9 | 0.487 | barres-de-son | semaine-en-frise | oui |
| 10 | 0.492 | registre-public | palace-annuaire | oui |
| 11 | 0.492 | nom-rogne-rouge | galets-de-spa | oui |
| 12 | 0.492 | fintech-tableau | statut-nuage | oui |
| 13 | 0.496 | phrase-de-lancement | affiche-de-festival | oui |
| 14 | 0.496 | marche-du-terroir | anse-turquoise | oui |
| 15 | 0.496 | nom-rogne-rouge | votre-agent-local | oui |
| 16 | 0.496 | anse-turquoise | benevoles-en-cartes | oui |
| 17 | 0.504 | colophon-du-cabinet | grand-club-lettre | non |
| 18 | 0.504 | pacte-en-deux | chantier-rayures | oui |
| 19 | 0.504 | cap-sur-le-telephone | grille-brutale | oui |
| 20 | 0.504 | concept-store-pastel | programmes-neufs | oui |

Les 20 paires les plus proches sont toutes **entre 0,45 et 0,51** : ce sont des concepts qui partagent leur composition mais diffèrent par l'univers (palette, typographie, formes, geste). Elles sont lisibles dans le tableau ci-dessus et restent à surveiller à l'étape de maquette.

## 6. Déroulé des itérations

| Étape | Ce qui a été retouché | Distance mini | Distance moyenne | Paires < 0,45 | Composition la + fréquente | Palette la + fréquente |
|---|---|---|---|---|---|---|
| 0 | Version initiale (100 fiches écrites une première fois) | 0.062 | 0.819 | 81 | bandes-superposees (5) | vif-sature (11) |
| 1 | Retouche 1 : composition et structure des fiches trop proches | 0.208 | 0.851 | 27 | 4col (5) | pastel (10) |
| 2 | Retouche 2 : couleurs, formes, fonds, logos, menus | 0.329 | 0.866 | 6 | 4col (5) | blanc-casse (9) |
| 3 | Retouche 3 : dernières paires sous 0,45 | 0.454 | 0.866 | 0 | 4col (5) | sombre-neutre (10) |
| 4 | Retouche 4 : écart aux 100 modèles actuels (fiches reconçues) | 0.217 | 0.864 | 4 | tableau-de-bord (5) | sombre-neutre (10) |
| 5 | Retouche 5 : paires rouvertes par la retouche 4 | 0.454 | 0.865 | 0 | tableau-de-bord (5) | sombre-neutre (10) |
| 6 | Retouche 6 : widget non nécessaire retiré d'un concept phare | 0.454 | 0.865 | 0 | tableau-de-bord (5) | sombre-neutre (10) |

L'étape 4 a **rouvert 4 paires sous le seuil** : en reconcevant des fiches trop proches des modèles actuels, on avait créé de nouveaux voisinages ; l'étape 5 les a refermés. Les retouches changent des compositions, des structures, des palettes et des gestes (et les textes correspondants), pas seulement une valeur dans un tableau. Voir la limite n°2.

## 7. Carte des familles (distance moyenne entre familles)

| | Agences | Associatif | Automobile | Corporate | Culture | E-commerce | Finance | Immobilier | Minimalisme | Médias | Restauration | SaaS | Santé | Éducation |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Agences (11) | 0.84 | 0.89 | 0.88 | 0.83 | 0.85 | 0.87 | 0.85 | 0.86 | 0.83 | 0.86 | 0.88 | 0.85 | 0.85 | 0.89 |
| Associatif (6) | 0.89 | 0.85 | 0.88 | 0.88 | 0.88 | 0.86 | 0.86 | 0.83 | 0.92 | 0.89 | 0.85 | 0.87 | 0.87 | 0.87 |
| Automobile (5) | 0.88 | 0.88 | 0.89 | 0.86 | 0.86 | 0.87 | 0.85 | 0.88 | 0.94 | 0.90 | 0.90 | 0.86 | 0.91 | 0.88 |
| Corporate (8) | 0.83 | 0.88 | 0.86 | 0.87 | 0.86 | 0.83 | 0.84 | 0.85 | 0.85 | 0.85 | 0.86 | 0.85 | 0.85 | 0.88 |
| Culture (6) | 0.85 | 0.88 | 0.86 | 0.86 | 0.93 | 0.87 | 0.87 | 0.87 | 0.88 | 0.88 | 0.87 | 0.87 | 0.88 | 0.89 |
| E-commerce (9) | 0.87 | 0.86 | 0.87 | 0.83 | 0.87 | 0.87 | 0.83 | 0.86 | 0.86 | 0.84 | 0.85 | 0.87 | 0.86 | 0.86 |
| Finance (6) | 0.85 | 0.86 | 0.85 | 0.84 | 0.87 | 0.83 | 0.83 | 0.86 | 0.83 | 0.86 | 0.87 | 0.84 | 0.85 | 0.85 |
| Immobilier (7) | 0.86 | 0.83 | 0.88 | 0.85 | 0.87 | 0.86 | 0.86 | 0.86 | 0.90 | 0.88 | 0.86 | 0.86 | 0.84 | 0.87 |
| Minimalisme (5) | 0.83 | 0.92 | 0.94 | 0.85 | 0.88 | 0.86 | 0.83 | 0.90 | 0.81 | 0.84 | 0.88 | 0.88 | 0.88 | 0.90 |
| Médias (8) | 0.86 | 0.89 | 0.90 | 0.85 | 0.88 | 0.84 | 0.86 | 0.88 | 0.84 | 0.88 | 0.87 | 0.89 | 0.89 | 0.88 |
| Restauration (8) | 0.88 | 0.85 | 0.90 | 0.86 | 0.87 | 0.85 | 0.87 | 0.86 | 0.88 | 0.87 | 0.88 | 0.89 | 0.84 | 0.86 |
| SaaS (9) | 0.85 | 0.87 | 0.86 | 0.85 | 0.87 | 0.87 | 0.84 | 0.86 | 0.88 | 0.89 | 0.89 | 0.87 | 0.87 | 0.88 |
| Santé (6) | 0.85 | 0.87 | 0.91 | 0.85 | 0.88 | 0.86 | 0.85 | 0.84 | 0.88 | 0.89 | 0.84 | 0.87 | 0.86 | 0.89 |
| Éducation (6) | 0.89 | 0.87 | 0.88 | 0.88 | 0.89 | 0.86 | 0.85 | 0.87 | 0.90 | 0.88 | 0.86 | 0.88 | 0.89 | 0.90 |

La diagonale (distance moyenne **à l'intérieur** d'une famille) est aussi haute que les autres cases : les concepts d'un même secteur ne se ressemblent pas plus qu'avec les autres secteurs, ce qui est le but.

## 8. Proximité avec les 100 modèles actuels

**Méthode (approximative).** Les 100 modèles actuels (`docs/footer-builder/CATALOGUE_100_MODELES.md`) n'ont pas les mêmes attributs que les concepts. J'ai donc reconstitué une *empreinte* : composition devinée à partir de leur description (mots-clés), nombre maximal de colonnes, famille de palette devinée sur le nom de l'ambiance, widgets utilisés et accordéon mobile (50 % du score), plus la ressemblance des mots de leur description avec ceux du concept (50 %). Score de 0 à 1. **Seuil de vigilance : 0,65.**

Répartition du score du modèle actuel le plus proche : médiane 0.47, moyenne 0.47, maximum 0.75. Concepts à 0,65 ou plus : **5**.

Ce que l'on constate sur les modèles actuels (par l'empreinte, donc avec prudence) : environ les deux tiers sont des grilles de 3 à 4 colonnes ou des bandes empilées. Les concepts proposent beaucoup de compositions absentes ou rares dans le catalogue actuel (frise, onglets, bandeau latéral, navigation verticale géante, cadre, colophon, split, bento, ticker, formulaire comme geste principal…).

### Les 15 concepts les plus proches d'un modèle actuel (état final)

| Score | Concept | Modèle actuel le plus proche | Verdict |
|---|---|---|---|
| 0.75 | `c-013-mutuelle-en-cartes` | `ft-restauration-hotellerie-03-cafe-boulangerie-cartes-chaudes` | Faux ami : « trois cartes » en commun, mais ici éventail posé en couches avec focus, palette verte ; à surveiller. |
| 0.71 | `c-045-cartel-de-musee` | `ft-restauration-hotellerie-03-cafe-boulangerie-cartes-chaudes` | Faux ami : cartels à bordure fine et angles droits contre cartes arrondies d'un café. |
| 0.69 | `c-097-point-final` | `ft-minimalistes-05-cartouche-centre` | Pile centrée courte en commun ; le geste (point géant) et le noir total n'ont rien à voir. À surveiller. |
| 0.66 | `c-086-carte-du-quartier` | `ft-institutionnels-03-agence-plan-du-site-trois-niveaux` | Faux ami : « carte » dessinée contre « plan du site ». |
| 0.66 | `c-067-campus-blason` | `ft-education-01-universite-cinq-colonnes` | Même secteur (université). Reconçu en onglets avec blason (le modèle actuel est en cinq colonnes) ; reste un voisin thématique. |
| 0.62 | `c-011-gestion-privee` | `ft-minimalistes-01-menu-et-mentions` | Pile centrée sobre en commun ; signature manuscrite et beige distinguent. À surveiller. |
| 0.62 | `c-004-usine-et-plan` | `ft-institutionnels-07-prefecture-bandeau-officiel` | Faux ami (bandes et filets épais) ; quadrillage jaune sans équivalent. |
| 0.62 | `c-015-palette-de-commandes` | `ft-landing-pages-06-capture-sobre-colonne` | Champ de recherche vs colonne étroite d'inscription : structure différente. |
| 0.62 | `c-068-ecole-de-code` | `ft-landing-pages-06-capture-sobre-colonne` | Formulaire d'inscription en commun ; ici c'est une ligne de commande sur fond sombre. |
| 0.61 | `c-027-concept-store-pastel` | `ft-corporate-06-certifications-centre` | Faux ami (4 colonnes centrées) ; pastilles de catégories colorées. |
| 0.60 | `c-084-pellicule-et-salles` | `ft-creatifs-portfolios-06-bande-annonce-neon` | Bande pleine largeur en commun ; pellicule perforée sans équivalent. |
| 0.60 | `c-056-carte-du-gite` | `ft-restauration-hotellerie-03-cafe-boulangerie-cartes-chaudes` | Faux ami : cartes (map) contre cartes arrondies. |
| 0.60 | `c-022-atelier-sticker` | `ft-creatifs-portfolios-02-cadre-exposition` | Trois colonnes en commun ; autocollants brutalistes contre grand cadre noir. |
| 0.60 | `c-036-revue-sommaire` | `ft-editoriaux-05-revue-et-colophon` | Même thème (revue) : sommaire vertical contre colophon. Voisin thématique, à surveiller. |
| 0.59 | `c-052-bistro-ardoise` | `ft-restauration-hotellerie-01-bistrot-ardoise-du-jour` | À examiner à la maquette. |

### Concepts reconçus à cause de cette comparaison

Les 8 concepts suivants étaient de vraies variantes de modèles actuels ; ils ont été **reconçus** (composition et geste changés), pas seulement recolorés :

- `banque-nocturne` (ex-méga-pied à 6 colonnes, comme le méga-pied SaaS actuel) -> nom monumental corail avec lueur.
- `frise-de-confiance` (ex-« service client d'abord », déjà couvert par `ecommerce-08-service-client-en-deux-volets`) -> frise en quatre étapes.
- `palette-de-commandes` (ex-« filet lumineux », 6 colonnes SaaS déjà présentes) -> champ de recherche central + 3 lignes.
- `mutuelle-en-cartes` (trois cartes terre cuite, proche de `communautes-03`) -> éventail de cartes vertes.
- `bastion-ardoise` (grande marque + 4 volets + chiffres d'exemple, proche de `corporate-01` et `finance-juridique-06`) -> bande latérale de chiffres.
- `votre-agent-local` (ex-« recherche en tête », proche de `immobilier-04`) -> carte de l'agent.
- `reperes-de-clinique` (ex-« clinique sereine », proche de `services-06`) -> annuaire d'étages avec repères de couleur.
- `campus-blason` (proche de `education-01`) -> onglets sous blason.
- `journee-d-ecole` (ex-« cartes de classe », doublon d'un autre concept) -> frise de la journée.

Les trois derniers du tableau ci-dessus (pile centrée, cartel, revue) sont **gardés** mais signalés : ce sont des voisins de thème, pas des copies.

Le fichier complet (score, empreinte, ressemblance de texte, deux autres voisins par concept) est dans `concepts/proximite_modeles_actuels.json`.

## 9. Vérifications honnêtes

**Contrastes AA (calculés par script, sur les palettes déclarées).** Pour chaque concept : texte principal sur fond, texte discret sur fond, texte sur surface, accent (au moins 3:1 sur le fond ou sur la surface, car l'accent ne porte jamais seul l'information). Résultat : **100 concepts conformes**. Minimums relevés : texte/fond 5.29:1, texte discret/fond 4.54:1, texte/surface 5.24:1, accent 3.21:1. 8 palettes ont été corrigées à la main pendant la rédaction (accents trop pâles, texte discret de la moitié claire d'un split, un second texte pour les cartes claires sur fond sombre). Les valeurs sont dans `contrastesAA` de chaque concept.

**Faisabilité technique.** Recherche de mots dans les 100 fiches : WebGL = 0, canvas = 1, three.js = 0, shader = 0, vidéo = 0, compte à rebours = 1, « plus que / derniers exemplaires » = 0. Les effets utilisés sont tous en CSS (dégradés, `clip-path`, `backdrop-filter` avec repli, `writing-mode`, `conic-gradient`, animations d'opacité, d'échelle ou de rotation) ou en SVG statique. Les seuls scripts évoqués sont de très petits scripts pour l'heure locale et l'état ouvert/fermé, qui ont un repli sans script.

**Pas de copie.** Aucun concept ne reprend le nom, le texte ou la mise en page d'une référence : les références sont citées par numéro (R-xx, P-xx) comme point de départ, puis transformées (Monzo -> nom en minuscules corail avec lueur sur une banque fictive ; Afterglo/Zoox -> carte arrondie sur un aplat vert, avec un contenu différent ; Blackpizza -> phrase géante « Prêts à lancer ? » en violet ; etc.). Tous les noms de marque sont fictifs. Aucun numéro officiel (garde, écoute, agrément, immatriculation) n'est inventé : ce sont des champs que le client saisit.

**Pas de fausse urgence.** Le ruban « Drop Sneakers » n'annonce que des services vrais ; aucun compte à rebours ni stock fictif ; les chiffres-clés sont toujours « à saisir et sourcer par le client ».

## 10. Limites (à lire)

1. **La distance mesure ce que les fiches déclarent, pas le rendu.** Deux concepts à 0,6 peuvent se ressembler à l'écran, et deux à 0,5 peuvent être très différents. Seule la maquette (phase 3) tranchera.
2. **Les retouches ont été faites pour passer la mesure** (c'est l'exercice demandé) : j'ai cherché des changements qui ont du sens (changer de composition, de logo, de fond), mais un attribut comme « fond : aplat » ou « logo : centre » est une catégorie grossière. Le risque de « jouer avec la métrique » existe ; le garde-fou est la lecture des fiches.
3. **Le geste vaut peu** (10 % avec l'interaction) et ses étiquettes sont presque toutes différentes (≈ 85 valeurs pour 100 concepts), ce qui favorise la distance moyenne. Sans le geste, la distance minimale serait un peu plus basse.
4. **La distance aux modèles actuels est une empreinte devinée** à partir de textes : composition et palette du catalogue actuel ont été classées par mots-clés, elles peuvent se tromper. Le résultat sert à repérer des suspects, pas à prouver une différence.
5. **Palettes** : les contrastes sont calculés sur les couleurs déclarées ; les cas où le texte passe sur une photo, un dégradé ou une texture ne sont pas mesurés (voile obligatoire, indiqué dans les fiches).
6. **Polices** : toutes sont citées par leur nom Google Fonts, mais leur disponibilité et leur licence (SIL OFL pour la grande majorité) doivent être revérifiées à l'intégration.
7. **Widgets** : l'existant a été vérifié contre la liste des types de nœuds du Page Builder (`src/marketing/pages/nodes.js`), pas testé dans une interface ; l'effet exact de chaque widget (par exemple `tabs` dans un pied) reste à valider en phase 2.
8. Les cases à « 15 concepts avec widget nouveau » : voir `CONCEPTS_100.md`, section « Widgets nouveaux ».

## 11. Un voisin par concept (plus proche concept et distance)

| Concept | Voisin le plus proche | Distance |
|---|---|---|
| `c-001-bastion-ardoise` | `c-028-frise-de-confiance` | 0.517 |
| `c-002-registre-public` | `c-053-palace-annuaire` | 0.492 |
| `c-003-colophon-du-cabinet` | `c-031-grand-club-lettre` | 0.504 |
| `c-004-usine-et-plan` | `c-084-pellicule-et-salles` | 0.471 |
| `c-005-chancellerie` | `c-065-coliving-arche` | 0.475 |
| `c-006-agora-en-tuiles` | `c-044-planche-contact` | 0.512 |
| `c-007-pacte-en-deux` | `c-064-chantier-rayures` | 0.504 |
| `c-008-cap-sur-le-telephone` | `c-048-grille-brutale` | 0.504 |
| `c-009-banque-nocturne` | `c-034-mode-en-capitales` | 0.525 |
| `c-010-assurance-claire` | `c-022-atelier-sticker` | 0.467 |
| `c-011-gestion-privee` | `c-097-point-final` | 0.454 |
| `c-012-fintech-tableau` | `c-019-statut-nuage` | 0.492 |
| `c-013-mutuelle-en-cartes` | `c-061-programmes-neufs` | 0.579 |
| `c-014-index-du-comptable` | `c-049-index-des-projets` | 0.525 |
| `c-015-palette-de-commandes` | `c-068-ecole-de-code` | 0.517 |
| `c-016-onglets-documentation` | `c-067-campus-blason` | 0.533 |
| `c-017-phrase-de-lancement` | `c-079-affiche-de-festival` | 0.496 |
| `c-018-aurore-ia` | `c-029-botanique-bio` | 0.608 |
| `c-019-statut-nuage` | `c-012-fintech-tableau` | 0.492 |
| `c-020-appli-diptyque` | `c-093-maillot-en-biais` | 0.525 |
| `c-021-terminal-vigie` | `c-026-drop-sneakers` | 0.658 |
| `c-022-atelier-sticker` | `c-010-assurance-claire` | 0.467 |
| `c-023-laboratoire-donnees` | `c-042-nom-rogne-rouge` | 0.517 |
| `c-024-maison-ivoire` | `c-034-mode-en-capitales` | 0.554 |
| `c-025-marche-du-terroir` | `c-054-anse-turquoise` | 0.496 |
| `c-026-drop-sneakers` | `c-059-commande-en-grand` | 0.579 |
| `c-027-concept-store-pastel` | `c-061-programmes-neufs` | 0.504 |
| `c-028-frise-de-confiance` | `c-001-bastion-ardoise` | 0.517 |
| `c-029-botanique-bio` | `c-063-estimation-photo` | 0.529 |
| `c-030-horlogerie-bandeau` | `c-001-bastion-ardoise` | 0.596 |
| `c-031-grand-club-lettre` | `c-003-colophon-du-cabinet` | 0.504 |
| `c-032-brocante-annuaire` | `c-073-reperes-de-clinique` | 0.517 |
| `c-033-journal-triple-filet` | `c-024-maison-ivoire` | 0.600 |
| `c-034-mode-en-capitales` | `c-009-banque-nocturne` | 0.525 |
| `c-035-carnet-de-marges` | `c-100-pied-en-phrases` | 0.475 |
| `c-036-revue-sommaire` | `c-067-campus-blason` | 0.579 |
| `c-037-barres-de-son` | `c-058-semaine-en-frise` | 0.487 |
| `c-038-presse-regionale` | `c-027-concept-store-pastel` | 0.533 |
| `c-039-reportage-legende` | `c-047-gouache-et-feuilles` | 0.475 |
| `c-040-rubriques-geantes` | `c-049-index-des-projets` | 0.596 |
| `c-041-bonjour-ecrit` | `c-079-affiche-de-festival` | 0.554 |
| `c-042-nom-rogne-rouge` | `c-074-galets-de-spa` | 0.492 |
| `c-043-nom-et-heure` | `c-096-juste-une-ligne` | 0.637 |
| `c-044-planche-contact` | `c-006-agora-en-tuiles` | 0.512 |
| `c-045-cartel-de-musee` | `c-005-chancellerie` | 0.596 |
| `c-046-neon-en-mouvement` | `c-050-grain-de-pellicule` | 0.554 |
| `c-047-gouache-et-feuilles` | `c-039-reportage-legende` | 0.475 |
| `c-048-grille-brutale` | `c-008-cap-sur-le-telephone` | 0.504 |
| `c-049-index-des-projets` | `c-014-index-du-comptable` | 0.525 |
| `c-050-grain-de-pellicule` | `c-095-courbes-de-niveau` | 0.483 |
| `c-051-specimen-typographique` | `c-044-planche-contact` | 0.588 |
| `c-052-bistro-ardoise` | `c-070-parcours-formation` | 0.533 |
| `c-053-palace-annuaire` | `c-002-registre-public` | 0.492 |
| `c-054-anse-turquoise` | `c-025-marche-du-terroir` | 0.496 |
| `c-055-heures-du-four` | `c-084-pellicule-et-salles` | 0.517 |
| `c-056-carte-du-gite` | `c-085-don-en-un-geste` | 0.608 |
| `c-057-etiquette-de-cave` | `c-100-pied-en-phrases` | 0.554 |
| `c-058-semaine-en-frise` | `c-037-barres-de-son` | 0.487 |
| `c-059-commande-en-grand` | `c-075-rendez-vous-bleu` | 0.504 |
| `c-060-votre-agent-local` | `c-042-nom-rogne-rouge` | 0.496 |
| `c-061-programmes-neufs` | `c-027-concept-store-pastel` | 0.504 |
| `c-062-cartouche-de-plan` | `c-004-usine-et-plan` | 0.567 |
| `c-063-estimation-photo` | `c-029-botanique-bio` | 0.529 |
| `c-064-chantier-rayures` | `c-007-pacte-en-deux` | 0.504 |
| `c-065-coliving-arche` | `c-005-chancellerie` | 0.475 |
| `c-066-jardin-botanique` | `c-027-concept-store-pastel` | 0.533 |
| `c-067-campus-blason` | `c-016-onglets-documentation` | 0.533 |
| `c-068-ecole-de-code` | `c-015-palette-de-commandes` | 0.517 |
| `c-069-journee-d-ecole` | `c-080-rideau-de-scene` | 0.525 |
| `c-070-parcours-formation` | `c-052-bistro-ardoise` | 0.533 |
| `c-071-cotes-de-bibliotheque` | `c-066-jardin-botanique` | 0.629 |
| `c-072-cours-ouverts` | `c-098-inversion-noir-blanc` | 0.558 |
| `c-073-reperes-de-clinique` | `c-032-brocante-annuaire` | 0.517 |
| `c-074-galets-de-spa` | `c-042-nom-rogne-rouge` | 0.492 |
| `c-075-rendez-vous-bleu` | `c-059-commande-en-grand` | 0.504 |
| `c-076-croix-de-garde` | `c-001-bastion-ardoise` | 0.575 |
| `c-077-cercle-de-souffle` | `c-082-sillon-et-label` | 0.517 |
| `c-078-deux-rives` | `c-013-mutuelle-en-cartes` | 0.596 |
| `c-079-affiche-de-festival` | `c-017-phrase-de-lancement` | 0.496 |
| `c-080-rideau-de-scene` | `c-037-barres-de-son` | 0.517 |
| `c-081-numeros-d-inventaire` | `c-042-nom-rogne-rouge` | 0.596 |
| `c-082-sillon-et-label` | `c-077-cercle-de-souffle` | 0.517 |
| `c-083-plan-du-salon` | `c-088-rapports-ouverts` | 0.471 |
| `c-084-pellicule-et-salles` | `c-004-usine-et-plan` | 0.471 |
| `c-085-don-en-un-geste` | `c-063-estimation-photo` | 0.575 |
| `c-086-carte-du-quartier` | `c-013-mutuelle-en-cartes` | 0.600 |
| `c-087-contributeurs` | `c-033-journal-triple-filet` | 0.637 |
| `c-088-rapports-ouverts` | `c-083-plan-du-salon` | 0.471 |
| `c-089-climat-en-chiffres` | `c-006-agora-en-tuiles` | 0.533 |
| `c-090-benevoles-en-cartes` | `c-054-anse-turquoise` | 0.496 |
| `c-091-concession-contraste` | `c-009-banque-nocturne` | 0.554 |
| `c-092-garage-damier` | `c-048-grille-brutale` | 0.596 |
| `c-093-maillot-en-biais` | `c-020-appli-diptyque` | 0.525 |
| `c-094-planning-de-salle` | `c-012-fintech-tableau` | 0.512 |
| `c-095-courbes-de-niveau` | `c-050-grain-de-pellicule` | 0.483 |
| `c-096-juste-une-ligne` | `c-003-colophon-du-cabinet` | 0.546 |
| `c-097-point-final` | `c-011-gestion-privee` | 0.454 |
| `c-098-inversion-noir-blanc` | `c-072-cours-ouverts` | 0.558 |
| `c-099-glitch-au-survol` | `c-017-phrase-de-lancement` | 0.533 |
| `c-100-pied-en-phrases` | `c-035-carnet-de-marges` | 0.475 |
