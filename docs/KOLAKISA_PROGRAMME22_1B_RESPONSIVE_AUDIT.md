# KOLAKISA — Audit responsive des sites générés (programme 22.1)

## Méthode

Chaque page **publiée** de chaque site est ouverte dans un **vrai Chrome** à quatre largeurs : bureau 1440 px, portable 1024 px, tablette 768 px, mobile 375 px (hauteurs 900 / 768 / 1024 / 812). Mesures : défilement horizontal de la page, éléments dépassant la largeur visible, texte coupé (ellipse ou `overflow: hidden` rognant du texte), texte sous 12 px, images cassées, **cibles tactiles sous 32 px** (liens et boutons de l'en-tête, du contenu et du pied de page). Pour les boutiques s'ajoutent la fiche produit, le panier et la caisse (parcours simulé aux largeurs 1280, 820 et 375 px).

Limites : Chrome seul (pas de Firefox ni de Safari), émulation de la taille de fenêtre (pas de vrai téléphone, pas de rotation, pas de zoom du texte), seuil de 32 px plus indulgent que la recommandation de 44 px.

## Résultats

<!--TABLE:Responsive-->
| Scénario | pages | débordement desktop | laptop | tablette | mobile | cibles < 32 px (mobile) | texte coupé | texte < 12 px | images cassées |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| entreprise | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| immobilier | 3 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| construction | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| tech | 3 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| photo | 3 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| portfolio | 3 | 0 | 0 | 0 | 0 | 4 | 0 | 0 | 0 |
| institution | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| restaurant | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| blog | 3 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| boutique | 10 | 0 | 0 | 0 | 0 | 30 | 0 | 0 | 0 |
| mode | 9 | 0 | 0 | 0 | 0 | 28 | 0 | 0 | 0 |
| informatique | 9 | 0 | 0 | 0 | 0 | 28 | 0 | 0 | 0 |
| services | 3 | 0 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| education | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
| sante | 4 | 0 | 0 | 0 | 0 | 8 | 0 | 0 | 0 |
<!--/TABLE-->

Exemples de cibles sous 32 px (accueil, mobile) :

<!--TABLE:Cibles tactiles-->
| Scénario | éléments |
| --- | --- |
| entreprise | a:101x17 ; a:51x17 |
| immobilier | a:89x17 ; a:51x17 |
| construction | a:49x17 ; a:51x17 |
| tech | a:75x17 ; a:51x17 |
| photo | a:87x17 ; a:51x17 |
| portfolio | a:90x17 ; a:51x17 |
| institution | a:252x17 ; a:51x17 |
| restaurant | a:61x17 ; a:51x17 |
| blog | a:82x17 ; a:51x17 |
| boutique | a:86x17 ; a:51x17 |
| mode | a:76x17 ; a:51x17 |
| informatique | a:55x17 ; a:51x17 |
| services | a:109x17 ; a:51x17 |
| education | a:91x17 ; a:51x17 |
| sante | a:107x17 ; a:51x17 |
<!--/TABLE-->

### Parcours d'achat des boutiques

<!--TABLE:Parcours d'achat-->
| Boutique | 1280 px | 820 px | 375 px |
| --- | --- | --- | --- |
| boutique | ok (1567 ms) | ok (852 ms) | ok (1822 ms) |
| mode | ok (2574 ms) | ok (939 ms) | ok (990 ms) |
| informatique | ok (1884 ms) | ok (1380 ms) | ok (1081 ms) |
<!--/TABLE-->

## Constats

- **Aucun débordement, aucun défilement horizontal, aucun texte coupé, aucune image cassée** sur 15 sites × pages publiées × 4 formats : la **mise en page est robuste** (grilles qui se replient, cartes empilées sur mobile, conteneurs bornés). C'est le point fort mesuré de la chaîne.
- **Les cibles tactiles sous 32 px** sont presque toutes des **liens de pied de page** (« Cookies », nom du site) : défaut P2, commun à tous les sites parce qu'il vient du composant de pied de page, pas des pages générées (D-R1).
- **La boutique (fiche produit, panier, caisse)** a été vérifiée aux 3 largeurs : panier transformé en cartes sous 600 px (correction du programme 20.5), parcours complet jusqu'à la confirmation de commande en paiement manuel.
- **Ce qui rend les pages « responsive » est le moteur natif**, pas la génération : les sites générés utilisent le moteur de rendu natif de Kolakisa (aucun HTML libre, structures validées) et en héritent.
- **Ce qui n'est pas évalué** : adaptation du contenu (titres trop longs, images au cadrage inadapté à un format) — les textes sont des exemples courts ; une page pleine d'un vrai texte pourrait se comporter autrement. Les réglages responsives du Design Generator (tailles de titres tablette/mobile, espacements) existent et ont été produits, mais le laboratoire ne compare pas les jetons appliqués aux styles calculés du rendu (à ajouter, feuille de route P2-4).

## Causes racines

| Défaut | Cause |
|---|---|
| Cibles < 32 px | composant de pied de page : liens en texte courant sans zone minimale (Renderer / Design System) |
| (aucun autre) | — |

## Recommandations

P2 : zone cliquable minimale de 44 px pour les liens d'en-tête et de pied de page dans les composants natifs (impact : tous les sites). P2 : rejouer l'audit avec du contenu réel (titres longs, textes longs, 12 produits). P3 : essais sur un vrai téléphone, Firefox et Safari ; mesure du déplacement cumulé de la mise en page (CLS).
