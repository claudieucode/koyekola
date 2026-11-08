# Groupe 1 — sept modèles « Minimalistes » (404-001 à 404-007)

> Construits dans `src/themeBuilder/catalog/not_found2.js` (nouvelle bibliothèque, **non exposée** : elle ne remplace l'ancienne que si `KW_404_V2=1` ; sans cette variable, rien ne change pour les sites). Tests : `tests/theme-builder-404-v2.test.js`.

## Modèles et axes réels
| ID | Nom | Composition | Numéro | Parcours | Particularité réelle |
|---|---|---|---|---|---|
| 404-001 | Page blanche | centré | 404 géant gris pâle | accueil | un bouton, rien d'autre |
| 404-002 | Trait unique | bandeau entre deux filets | « 404 — » discret | contact (« signalez-le-nous ») | une ligne, serif italique |
| 404-003 | Marge latérale | asymétrique 38 % / 52 % | 404 « fantôme » dans la marge | articles | **3 articles récents réels** (message propre si aucun) |
| 404-004 | Point final | affiche | 404 en **contour** (trait de texte) | liens | grand point rouge = bouton rond « Accueil » |
| 404-005 | Deux mots | pile typographique | aucun numéro | recherche | « Introuvable. / Pardon. » géants + recherche réelle |
| 404-006 | Index sobre | deux colonnes | discret | plan du site | index numéroté 01–04, filets, police à chasse fixe |
| 404-007 | Silence | centré, fond sombre | discret | recherche | **machine à écrire réelle** (widget natif, bouton Pause intégré, mouvement réduit géré par le widget) |

## Mesures (exécutées)
- Axes déclarés : pour **chaque paire** (21 paires), ≥ 5 axes sur 8 différents et ≥ 3 axes structurels sur 6 → **respecté**. La première version ne le respectait pas pour 4 paires (compositions trop proches) : le test les a refusées, les modèles ont été retravaillés (numéro en contour, articles réels, index, machine à écrire…) — c'est le fonctionnement voulu.
- Densité déclarée = densité mesurée (3 à 11 éléments de contenu) → respecté.
- Arbres construits : 7 signatures distinctes ; aucune paire au-dessus de 85 % de similarité (sac de types et de dispositions).
- Serveur réel (2 sites, domaines) : chaque modèle utilisé puis publié → adresse inconnue du site A = **HTTP 404** avec le titre du modèle, `noindex` ; le site B n'affiche rien du modèle ; l'accueil de A reste **200**.
- Responsive réel (Chrome) à 1440 / 820 / 390 px : aucun défilement horizontal, aucun élément hors écran, un seul `h1`.
- Validation du serveur (« Utiliser ») : les 7 documents passent la validation des styles (deux valeurs refusées par le moteur ont été corrigées en cours de route : `line-height` minimum 0,8 ; `clamp()` interdit dans les tailles).

## Limites constatées (honnêtes)
- Le moteur **n'a pas** de propriétés de rotation/transformation ni de dégradé au niveau d'un élément : les concepts « collage incliné », « diagonales » et « arrière-plans en dégradé » du plan devront utiliser d'autres moyens (texte en contour, découpe, couleurs, décalages, widgets `motion*`) — à traiter dans les groupes concernés, sans promettre ce que le moteur ne sait pas faire.
- La vignette ne montre pas l'animation de la machine à écrire (le script ne tourne pas dans la vignette) : elle affiche la phrase.
- Le test de densité et les portes de diversité ne remplacent pas le contrôle visuel : fait ici sur captures à trois largeurs (voir PR).
