# Audit de la qualité visuelle (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

## Méthode et limite principale
Aucun navigateur n'est disponible (Chrome absent) : **aucune capture d'écran n'a été examinée et aucune appréciation esthétique n'est donnée**. Ce qui suit est un audit **structurel** : directions artistiques proposées (45 directions = 15 briefs × 3), contrastes calculés, structure des sections rendues, hiérarchie des titres. Les critères de la mission non mesurables ici (originalité, harmonie, équilibre perçu, cohérence des images) sont **NON ÉVALUÉS**. Une revue visuelle humaine sur captures est la première action recommandée du palier 22.2.

## Grille documentée
| Axe | Critère objectif retenu | Résultat |
|---|---|---|
| Couleurs | Contraste texte/fond des 3 directions (calcul du Design Generator) | **45/45 conformes** |
| Couleurs | Diversité des teintes entre secteurs | 4 familles seulement : bleu ≈ 215° (**11 sites sur 15**), orange 22° (construction, restaurant), vert 145° (institutionnel, services), violet 262° (portfolio) |
| Couleurs | Diversité entre les 3 directions d'un brief | **écart de teinte 0 à 3°** : mêmes couleurs, luminosité et saturation légèrement différentes |
| Couleurs | Respect des couleurs citées | Respecté : « orange et gris foncé » → 22°, « vert profond » → 145°, « violet/créatif » → 262° ; une couleur secondaire citée (jaune de l'éducation) n'est pas reprise |
| Typographie | Paires de polices proposées | 4 paires (neutre, classique, moderne, éditorial) ; **dans 8 briefs sur 15, deux directions sur trois partagent la même paire** |
| Typographie | Hiérarchie | un seul h1 par page (53/53) |
| Mise en page | Variété des sections de l'accueil | 4 types sur 4 (1,0), mais **identiques pour les 15 sites** |
| Mise en page | Alternance des fonds | 0,33 sur l'accueil (1 changement de fond sur 3 transitions) |
| Mise en page | Rythme | sections regroupées en 11 enchaînements différents sur 72 pages ; l'enchaînement « hero > texte > cartes > témoignages » représente 15 pages |
| Composants | Boutons, formulaires, menus, pieds de page, galeries | Non évalués visuellement. La galerie n'existe pas comme composant natif (une image par section, pile verticale) |
| Images | Pertinence, cadrage, proportions | **0 image** dans les 53 pages : non évaluable |

## Défauts récurrents (preuves)
1. **Sites interchangeables** : 15 accueils de structure identique (Q1) et 11 sites bleus (Q7).
2. **Directions peu distinctes** : proposer « trois directions » qui ne diffèrent presque que par la luminosité ne donne pas un vrai choix.
3. **Page vide d'image** : un bandeau sans image est un défaut visuel majeur pour la photographie, l'immobilier et la mode ; l'étape médias n'est pas déclenchée par la génération de pages.
4. **Espaces réservés visibles** (Q2) : 44/53 pages publiées affichent des `[crochets]` ; 21/53 un faux témoignage « Remplacez par… ».

## Causes racines
Recettes de pages fixes (Page Generator), génération des directions par variations autour d'une seule teinte (Design Generator), étape médias séparée (Media Generator) — voir `KOLAKISA_PROGRAMME22_ROADMAP.md`. Ce ne sont pas des défauts du moteur de rendu.

## À mesurer au palier suivant
Captures desktop/laptop/tablette/mobile des 15 sites (Playwright), grille d'évaluation humaine à 5 critères (originalité, cohérence, hiérarchie, rythme, finition), contrôle de contraste réel sur le rendu (et non sur les jetons).
