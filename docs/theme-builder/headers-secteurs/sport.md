# Secteur sport : matrice de conception des 10 en-têtes

Fichier : `src/themeBuilder/catalog/header/sectors/sport.js`. Zone visuelle : énergie, contrastes durs, typographies condensées, angles, bandeaux diagonaux, boutons d'action très visibles.

| Clé | Nom | Direction | Composition | Palette (fond / texte / accent) | Polices (titres / texte) | Navigation | Mode / entrée / survol |
|---|---|---|---|---|---|---|---|
| sport-01 | Brut Béton | Brutalisme moderne | 3 cases à filets 4 px : marque, navigation, grand bloc d'action | #e9e6dc / #0a0a0a / #ff4a1c | Archivo Black / Space Mono | cases bordées (survol orange) | sticky / slide / push |
| sport-02 | Volt Rush | Sportif dynamique | Asymétrique : bloc de marque lime + 3 bandeaux diagonaux, bouton incliné | #0b0b10 / #fff / #d4ff00 | Big Shoulders / Barlow Condensed | soulignée | stickyshrink / slide / grow |
| sport-03 | Ligue Un | Compétition, ligue | Ticker de résultats, marque entre 4 barres inclinées, onglets pleine largeur | #0c1b3a / #fff / #ffc20e | Oswald / Titillium Web | onglets | sticky / rise / pop |
| sport-04 | Foulée | Running | Capsule sombre flottante sur fond clair | #f3efe7 / #101828 / #ff5a3c | League Spartan / Manrope | fine | sticky / soft / lift |
| sport-05 | Box 24 | CrossFit, box | Marque monumentale, infos + navigation en blocs, ruban diagonal | #111 / #f5f5f5 / #ffb800 | Anton / Roboto Condensed | blocs | stickyhide / reveal / push |
| sport-06 | Dojo Kata | Arts martiaux | Filet rouge vertical + disque, marque + accroche, deux boutons empilés, bande de navigation centrée dessous | #14100e / #f2ece2 / #d4202a | Sofia Sans Extra Condensed / Work Sans | soulignée centrée | sticky / zoom / pulse |
| sport-07 | Peloton | Cyclisme | Liseré dégradé, marque entre roues, bande jaune à liens répartis | #fff / #0a2540 / #0a2540 (bande #ffd60a) | Kanit / DM Sans | soulignée répartie | stickyshrink / rise / lift |
| sport-08 | Coach Pilote | Coach en ligne | Annonce fine, pastille dégradée + navigation en pilules (capsule segmentée) à gauche, compte + bouton | #120a2a / #fff / #2ee6a6 | Sora / DM Sans | pilules | glass / slide / grow |
| sport-09 | Sentier Nord | Outdoor, trail | Pic (2 bandeaux), marque + accroche, infos, bande forêt (navigation, date) | #f2efe6 / #1d2b1f / #e07a1f | Saira Condensed / Work Sans | soulignée | sticky / rise / lift |
| sport-10 | Club Néon | Club, salle | Barre fine mono, marque géante, compteur d'inscriptions (consigne), filet néon | #0a0a0a / #fff / #00e5ff | League Gothic / Space Grotesk | mono | static / zoom / bounce |

Responsive : grilles à une colonne sur mobile, navigation repliée (burger), informations, date et réseaux masqués sur mobile, boutons conservés. Mouvements natifs, coupés en « réduire les animations ».
Limites : menu plein écran non utilisé (jugé non pertinent ici) ; compteur d'inscriptions = texte « 000 » à remplacer (pas de donnée réelle) ; les textes du ticker sont des consignes.
