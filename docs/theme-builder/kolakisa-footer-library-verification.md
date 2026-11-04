# Pieds de page — rapport de vérification (4 novembre 2026)

## Contrôle visuel par lots (`scripts/audit-pieds.js`)

Aperçu réel de chaque modèle dans Chrome (serveur de test, vrai moteur de rendu), 100 modèles × 3 largeurs (1280, 820, 390 px) = **300 mesures**.
Mesures : défilement horizontal, chevauchement d'éléments, éléments hors écran, contraste texte / fond < 3, partie absente, hauteur < 20 px, erreurs JavaScript.

| Résultat | Détail |
|---|---|
| Mesures avec défaut | **1 sur 300** : `accordeons-mobile.nuit` (mobile), « chevauchement » entre le texte d'une rubrique repliée et le menu |
| Analyse | **Faux positif** : le texte compté est celui d'un `<details>` replié, invisible ; la capture est correcte. Le script ignore désormais le contenu des `<details>` fermés. |
| Défauts corrigés avant ce contrôle | icônes de coordonnées invisibles sur fond de marque (couleur d'icône = couleur d'accent) ; ombre portée sous le pied (identité « marque ») ; menu horizontal replié derrière un « hamburger » |
| Défaut trouvé par les tests | `logo-menu-reseaux` n'avait pas de copyright → rangée de copyright ajoutée |

Relecture humaine des captures : 3 planches desktop sur 10 (planches 1, 2, 5) et 2 planches mobile sur 5 (planche 3) relues à l'œil ; les 100 modèles ont été mesurés automatiquement. Les planches se régénèrent avec `scripts/audit-pieds-planches.js`.
Alignements constatés : colonnes sur une même ligne de base, zone centrée de 1180 px, marges latérales identiques entre rangées, colonnes empilées sur mobile, aucun texte coupé.

**Limite constatée** : les cartes (`map`) s'affichent vides dans l'aperçu hors ligne (cadre Google Maps non chargé) ; la hauteur est réservée, la mise en page n'en est pas affectée.

## Tests automatisés

| Fichier | Résultat |
|---|---|
| `theme-builder-pieds-bibliotheque` (nouveau : 100 modèles, distinction, grammaire, contenu non factice, responsive, liste/filtres, formulaire réel, utilisation, 100 sauvegardes, publication, 100 aperçus + vignettes, anciennes clés 404, un seul pied sur le site publié) | 17 / 17 |
| `theme-builder-pied-de-page-coherence` (navigateur : éditeur = aperçu = vignette = public, 3 largeurs) | réussi (adapté : clé de famille ; ligne légale de la plateforme) |
| `theme-builder-entetes-bibliotheque` | 12 / 12 (corrigé par le correctif de `catalog/index.js`) |
| `theme-builder-catalogue`, `-catalogue-public`, `-pied-unique`, `-vignettes-retour`, `-apercu-vignette`, `-en-tete-collant-public`, `widgets-theme-builder-unicite` | réussis |

Dernière exécution groupée : 94 tests, 89 réussis avant les corrections de tests listées ci-dessous ; après correction : 15 / 15 (rendu + cohérence) et 24 / 24 (catalogue).
Corrections de tests : site de test sans accueil ni article (le site public répondait 404), aperçu de composant sans page, ligne légale « Site · Cookies » ajoutée après le pied par le site public (`_foot-legal.ejs`, commit `d74fb554`) que le test de cohérence ne prévoyait pas.

## Défauts trouvés sur `origin/main`

* `catalog/index.js` : `build()` et `list()` avaient perdu la gestion du catalogue « plat » lors de la fusion `fd8c31fd` → aperçu, vignette et « Utiliser » des **en-têtes** levaient `Cannot read properties of undefined (reading 'build')`, et le filtre de famille listait 100 entrées. Corrigé.
