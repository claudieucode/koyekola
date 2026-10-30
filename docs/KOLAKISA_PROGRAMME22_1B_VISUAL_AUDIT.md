# KOLAKISA — Audit de la qualité visuelle des sites générés (programme 22.1)

Méthode : (1) contrôles **mesurés** dans Chrome (contraste AA calculé, débordements, images, tailles de texte, structure de l'accueil) ; (2) **inspection de captures** (bureau 1440 px et mobile 375 px de chaque site, dans `docs/quality-lab-navigateur/captures/`) ; (3) comparaison des directions artistiques proposées. Le jugement du goût reste subjectif : il est séparé des mesures.

## 1. Ce qui est mesuré

### Structure visible de l'accueil

<!--TABLE:Diversité des résultats rendus-->
| Scénario | blocs de l'accueil (ordre) | mots | H1 | bouton(s) | image(s) |
| --- | --- | ---: | --- | ---: | ---: |
| entreprise | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| immobilier | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |
| construction | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| tech | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |
| photo | header.lp-hero | 1 | Accueil | 0 | 1 |
| portfolio | header.lp-hero | 1 | Accueil | 0 | 1 |
| institution | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |
| restaurant | header.lp-hero | 1 | Accueil | 0 | 1 |
| blog | header.lp-hero | 1 | Accueil | 0 | 1 |
| boutique | div.lp-block > div.lp-block | 30 | Accueil | 0 | 0 |
| mode | div.lp-block > div.lp-block | 30 | Accueil | 0 | 0 |
| informatique | div.lp-block > div.lp-block | 30 | Accueil | 0 | 0 |
| services | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| education | div.lp-block > div.lp-block > div.lp-block | 41 | Accueil | 0 | 1 |
| sante | div.lp-block > div.lp-block | 30 | Accueil | 0 | 1 |

Signatures distinctes : 3 sur 15 sites (accueil).
<!--/TABLE-->

### Lisibilité (contraste)

Le contraste est calculé sur les éléments de texte dont l'arrière-plan est une couleur unie (les zones à image ou dégradé sont « inconnues »). Résultat : **aucun défaut de contraste** sur les éléments mesurés (colonne « contraste KO/vérifiés » du tableau `SEO_ACCESSIBILITY`). Les palettes proposées par le Design Generator passent toutes le contrôle AA (test `22.1 — Design Generator`). **Limite** : peu d'éléments sont mesurables (3 à 12 par page) ; le texte posé sur le bandeau d'image n'est pas évalué.

## 2. Ce que montrent les captures

Inspection des captures du site « Norvalis Conseil » (entreprise) et de la boutique « PixelPort » :

- **Aucun en-tête de navigation ni logo** : la page commence par une grande image puis un titre. Les 3 à 5 pages du site ne sont reliées que par des adresses connues (défaut D-N1).
- **Bandeau d'accueil** : une image d'attente (dégradé généré localement, « démonstration », dont la teinte varie d'un site à l'autre : violet, bleu, vert) sous un titre qui reprend le **nom de la page (« Accueil »)** ; ni sous-titre, ni bouton (D-C1). La teinte de l'image ne dépend pas de la palette appliquée : le violet du site d'entreprise ne dialogue pas avec le bleu marine du reste de la page.
- **Accueils réduits à un bandeau** : photographe, portfolio, restaurant et blog n'affichent qu'une image, le titre « Accueil » et le pied de page (les sections de texte, d'image et d'appel à l'action du plan ont disparu).
- **Sections** : un bloc de cartes blanches arrondies avec des textes entre crochets, puis un bloc de témoignage avec le texte « Remplacez par le témoignage réel d'un client » — honnête (aucun faux avis), mais **non publiable en l'état**.
- **Pied de page** : le nom du site et « Cookies » seulement.
- **Boutique** : l'accueil est une page « Services » (« [Service 1] »…) ; aucun produit n'y est présenté (D-S1).
- **Cohérence** : espacements réguliers, arrondis cohérents, typographie lisible ; aucune superposition, aucun débordement. La base graphique du moteur est **propre mais très sobre**.

## 3. Diagnostic par axe de la mission

| Axe | Observation | Preuve |
|---|---|---|
| Originalité | **Faible** : mêmes blocs (3 signatures d'accueil distinctes sur 15 sites), même habillage, même couleur dominante pour la quasi-totalité des sites, même titre « Accueil ». | Tableaux de diversité ; test D-V1 (14/15 bleus) |
| Cohérence | Bonne à l'intérieur d'un site (mêmes jetons, mêmes arrondis), **sauf** le visuel d'attente violet. | Captures |
| Adaptation à la marque / au secteur | **Absente** : un restaurant, un photographe et un cabinet de santé reçoivent la même teinte et la même recette. | Test D-V1 |
| Couleurs | Contrastes conformes (AA) sur ce qui est mesuré ; palette limitée à un camaïeu de bleus. | Tableau SEO/accessibilité ; sondage des 15 palettes |
| Typographie | 2 associations seulement sur 15 sites (« neutre », « moderne ») ; hiérarchie lisible (H1 unique). | Test D-V1 |
| Mise en page | Régulière, alignée, sans débordement ; **rythme pauvre** (peu de types de blocs par accueil). | Tableau de diversité |
| Composants | Boutons : **absents de l'accueil des 15 sites** (0 bouton) (aucun bouton d'action). Cartes, formulaire : propres. En-tête : **absent**. Pied de page : minimal. | Colonne « bouton(s) » |
| Images | Une seule image par site, d'attente ; ratio correct, aucune image cassée. | Tableau média |

Défauts récurrents de la liste de la mission : *sites trop génériques* (oui), *sections répétitives* (oui : mêmes recettes), *design sans personnalité* (oui), *images mal adaptées* (oui, visuel d'attente), *mauvaise hiérarchie* (non : H1 unique, titres cohérents), *boutons disproportionnés* (non mesuré : presque aucun bouton), *mauvais alignements* (non), *pages déséquilibrées* (par manque de contenu : oui).

## 4. Causes racines

- **Génération** : le pont plan → pages ne transmet pas les objectifs de section (titre, texte attendu, bouton), donc le bandeau n'a ni titre propre ni action ; la structure visible dépend entièrement d'une seconde passe de contenu.
- **Design System / Design Generator** : teinte pilotée par le seul type de site ; peu de variantes de typographie ; aucun contrôle de **cohérence entre le visuel généré et la palette** (le fournisseur « demo » utilise sa propre teinte).
- **Rendu** : aucune responsabilité sur l'en-tête : le rendu n'affiche un menu que si le site en possède un, et le générateur n'en crée pas.

## 5. Recommandations (détail dans la feuille de route)

1. Créer l'en-tête et le menu du site à partir de `navigation.main` du plan (P1).
2. Transmettre titre, sous-titre et bouton du plan jusqu'aux sections ; ne jamais produire un bandeau dont le titre est le nom de la page (P1).
3. Faire dépendre teinte, ambiance et typographie du **secteur** et du ton du brief, avec davantage de palettes et d'associations typographiques ; garder le contrôle de contraste (P1).
4. Dériver la teinte des visuels d'attente de la palette appliquée (P2).
5. Ajouter des contrôles visuels automatisés (déborde-t-il ? y a-t-il une navigation ? un bouton ?) dans la publication (P2).

## 6. Limites

Pas de modèle de langage réel : les directions artistiques demandées « avec des mots » (« chaleureux », « élégant ») sont interprétées par des règles de mots-clés, non par un modèle. Pas de test de Firefox ni de Safari. Les captures sont des JPEG compressés à qualité 55 (suffisants pour juger la composition, pas les détails fins).
