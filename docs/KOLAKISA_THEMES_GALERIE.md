# Thèmes — galerie, aperçu rapide et performances (refonte TITAN XVI)

Écran : Apparence → Thèmes (`/marketing/site-web/themes`). Un seul système de thèmes (service `src/services/themes.js`, catalogue `src/marketing/themes`) : rien n'a été dupliqué.

## Ce qui a changé
- **Facettes exactes** (`gallery()`) : chaque compteur (catégories, Tous/Installés/Disponibles, styles) tient compte de tous les autres filtres sauf du sien. Une catégorie ou un style sans résultat est atténué et inactif (jamais de filtre « actif » qui ne change rien). Le fragment `?fragment=1` embarque ces compteurs (`data-tg-meta`) ; le script ne fait que les afficher.
- **Filtres sans rechargement** (`public/js/cms-themes.js`) : une requête à la fois (la précédente est annulée par `AbortController`), 120 ms d'attente à la frappe, réponses gardées 60 s, barre de progression seulement si la réponse dépasse 150 ms, erreur affichée avec « Réessayer » (plus de rechargement forcé), bouton « Réinitialiser les filtres ». L'adresse ne contient plus `tri=relevance`.
- **Cartes** : une seule image (la pastille mobile et la ligne « N pages : … » sont supprimées), hauteur de corps réservée, aucun déplacement au survol (bordure + ombre légères), premières cartes chargées en priorité, les autres au défilement ; panneau du thème actif en vignette 480/720 au lieu de la capture 960.
- **Aperçu rapide** (`partials/themes-quick.ejs`) : fenêtre `<dialog>` ouverte depuis « Prévisualiser » (le lien vers l'aperçu complet reste valable sans script, avec Ctrl/⌘-clic). Site de démonstration ISOLÉ dans un `<iframe sandbox="allow-scripts allow-forms">` (sans `allow-same-origin`), créé à l'ouverture, remplacé à chaque changement de page/thème, détruit à la fermeture (`about:blank` puis retrait). Un chargement périmé est ignoré ; image de présentation affichée le temps du rendu ; message honnête si le rendu tarde (12 s) avec « Réessayer ». Précédent/suivant (boutons et flèches), pages du thème, appareil, vraie action de la carte (installer / utiliser / personnaliser, mêmes formulaires), Échap, focus rendu à la carte.
- **Rendu de démonstration** (`themeDemo.js`) : mémoire serveur (10 min, 60 entrées, clé organisation + thème + page + site) et `Cache-Control: private, max-age=120` ; une requête légère « d'intention » au survol/focus d'un bouton Prévisualiser réchauffe la page (jamais en économie de données).
- **Correctif** : une règle héritée de `kola-stable.css` imposait des colonnes minimales aux filtres et provoquait 16 px de défilement horizontal à 320 px ; supprimée.
- Thème sombre : `kola-brand.css` couvre les nouveaux composants.

## Passe TITAN XVII (complément)
- Pastilles de filtres actifs (une par filtre, retirable seule) et lien « Réinitialiser » ; miniature indisponible = état « Aperçu indisponible » aux dimensions de la carte (jamais une fausse capture).
- En-tête plus court ; fiche d'un thème : actions séparées des informations, pages en pastilles ; aperçu complet : titre, appareils et actions sur une rangée, pages défilantes sur la suivante (appareils masqués sous 720 px).
- Vérifié avec Chrome piloté : retrait d'une pastille (les autres filtres restent), image cassée remplacée, aperçu complet et fiche à 1440 et 390 px.

## Mesures (Chrome 1440×900, serveur de test local, machine chargée : valeurs indicatives, une série par état)
| Mesure | Avant | Après |
|---|---|---|
| Images dans la page (éléments) | 54 | 28 |
| Images téléchargées au chargement | 11 · 102 Ko | 8 · 69–97 Ko (selon la série) |
| LCP | 1480 ms | 864–1208 ms |
| Filtre (saisie → résultats) | 413 ms | 185–198 ms |
| Ouverture d'un aperçu | navigation complète (≈1350 ms) | fenêtre ouverte en 31–41 ms, rendu prêt 504 ms (avec survol préalable) / 910–1057 ms (à froid) |
| Changement de page / de thème dans l'aperçu | rechargement de la page d'administration | 169–496 ms / 333–525 ms |
| Cadres après 12 changements rapides ; après fermeture | — | 1 ; 0 |
Poids du HTML de la page : 116 Ko → 130 Ko (21 pastilles de catégories, fenêtre d'aperçu, compteurs) ; non compressé en local.

## Tests
`tests/themes-galerie-refonte.test.js` (6) + `themes-bibliotheque-http`, `apparence-themes`, `themes-bibliotheque`, `marketing-apparence`, `refonte-design-v3`. Les tests Playwright restent ignorés (non installé) ; l'ouverture, les touches, l'erreur réseau simulée, l'installation réelle depuis la fenêtre et les largeurs 320–1920 ont été vérifiées avec Chrome piloté (CDP).

## Reste à faire / limites
- Le défilement horizontal de la coque d'administration à 320 px (barre supérieure) est antérieur et hors périmètre.
- Les liens internes cliqués DANS le cadre de démonstration dépendent du cookie de session d'un cadre à origine opaque (comme l'aperçu complet existant) : la navigation se fait par les onglets de pages de la fenêtre.
- Pas de virtualisation : 24 cartes par page suffisent.
