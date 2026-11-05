# Rapport de tests — extension n°2 (30 thèmes, 41 à 70)

Généré à la livraison. Environnement : Chrome réel (Playwright), banc d'essai `scripts/lib/themeHarness.js`, machine chargée.

## Résultats mesurés
- **Anti-clone** (`node scripts/themes-matrice.js`) : 70 thèmes, 0 problème, 0 axe partagé entre deux thèmes, aucune paire de polices ni palette identique.
- **Audit des paquets** (`auditPack`) : `[]` pour les 30 thèmes (balises supprimées, liens morts, h1 unique, limite 20 000 caractères par bloc).
- **Balayage responsive et erreurs** (`/private/tmp/.../sweep.js`, toutes les pages de chaque thème à 320, 768, 1024 et 1920 px) : 0 débordement horizontal, 0 erreur JavaScript, 0 lien vide. Deux débordements trouvés puis corrigés (Volt 320 px, tableau incliné ; Meeple 2 px, non reproduit ensuite).
- **Interactions** : chaque composant signature a été testé par clic en navigateur par son auteur (filtres, calculs, configurateurs, réservations simulées, lecteurs, terminal, bandeau d'accessibilité), sans erreur JavaScript.
- **Tests du projet** : `tests/themes-packs.test.js` et `tests/apparence-themes.test.js` passent (45 tests).

## Non mesuré (honnêtement)
- **Lighthouse** : non installé ; aucun score Performance/Accessibilité chiffré. Les contrastes ont été vérifiés à l'œil et, pour Civitas, calculés.
- **Poids JavaScript** : 7 à 17 Ko par thème, au-dessus de la cible de 10 Ko pour une vingtaine d'entre eux (chargé uniquement par le thème actif).
- **Formulaire de contact et recherche natifs** : invisibles dans le banc d'essai ; habillage CSS écrit mais à contrôler sur le vrai site.
- **Orientation paysage** tablette/mobile : non testée.
- **Collections thématiques** de la bibliothèque : non ajoutées (catégories, recherche, filtres et pagination existants suffisent pour 70 thèmes).

## Problèmes connus restants
| Priorité | Problème |
|---|---|
| Moyenne | Contrôler sur le site réel le formulaire de contact (habillage) de chaque thème |
| Moyenne | Mesurer Lighthouse mobile et réduire le JS des plus lourds (bouclier, essence, meeple, petale, talent) |
| Basse | Panneaux « sans JS » : certains éléments masqués par le filtre `hidden` s'affichent ensemble |
| Basse | Pas de photos : illustrations SVG uniquement |
