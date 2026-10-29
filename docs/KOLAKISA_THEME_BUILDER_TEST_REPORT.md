# Mission 9 — Theme Builder : rapport de tests

Machine : Chrome 150 / macOS, 4 cœurs, fortement chargée par d'autres sessions. Commande type : `NODE_PATH=<jsdom+playwright> node --test <fichiers>`. Aucun test désactivé, aucun seuil modifié.

## 1. Nouveaux tests (20)

| Fichier | Tests | Contenu |
|---|---|---|
| `tests/theme-builder-serveur.test.js` (vrai serveur) | 14 | conflit entre onglets (409) ; mise à jour refusée sur révision périmée / version identique sans doublon ; droits d'un lecteur sur un composant ; deux composants indépendants et une page par composant ; pied de page (une fois, pas hors site, retiré) ; copie de site (en-tête, pied, exception, identifiants) ; déplacement de page (variante) ; rendu sans doublon `<html>` ; page-modèle protégée à la corbeille ; explication de la résolution ; écran « Pourquoi ce modèle ? » ; droits d'un lecteur sur les modèles et entrées invalides ; étape de tunnel refusée ; 404 avec modèle (statut 404) |
| `tests/theme-builder-navigateur.test.js` (Chrome réel) | 6 | deux onglets + « Mettre à jour » vérifié sur la page publiée ; en-tête : canevas = page publiée à 320 / 768 / 1440 px (un seul en-tête, pas de défilement horizontal) ; diaporama texte sans adresse ; rafale de saisies = 1 enregistrement ; publication pendant un enregistrement en cours ; réseau coupé puis session expirée |

**Résultat : 20 réussis, 0 échoué, 0 ignoré** (dernière exécution : fichiers `reg9b-final`, avec les 121 autres de la même commande).

### Avant correction
- Serveur : sur les 11 premiers tests écrits, **6 échouaient** (T1 ×2, T4, T5, T6, T7) et 5 réussissaient (ce qui était déjà correct).
- Navigateur : le test « deux onglets » échouait tant que le bouton « Mettre à jour » restait caché (T3).
- T8 : le code du correctif a été **remis temporairement à l'ancienne version** : le test de publication pendant un enregistrement échouait (« Premier jet » diffusé au lieu de « Dernière saisie »), puis le correctif a été rétabli.

## 2. Régression ciblée (exécutée)

| Lot | Fichiers | Réussis | Échoués | Ignorés |
|---|---|---|---|---|
| Serveur (pages, tunnels, A/B, sites, en-tête, composants, blocs, modèles de thème, widgets, classes, apparence, persistance, révisions, URLs, SEO, duplication, éditeur v3) | 24 | **424** | 0 | 0 |
| Navigateur, 1re passe | 7 | 64 | **1** | 0 |
| Navigateur, après correction (persistance, composants, en-tête, apparence, intégrité du noyau, canevas, structure, corrections widgets, édition visuelle) | 9 | **77** | 0 | 0 |
| Final (nouveaux tests + en-tête, composants, modèles de thème, apparence, gestionnaire de sites, pages) | 8 | **141** | 0 | 0 |

L'échec de la 1re passe était **une régression que j'avais introduite** : en rendant le message de conflit adapté au composant, j'avais écrit « page modifié ailleurs » au lieu de « page modifiée ailleurs », ce que le test de persistance (mission 7) attendait. Corrigé dans `page-builder.js`, test rejoué : réussi.

## 3. Non exécuté / bloqué
- **Suite complète (~4 840 tests) : non lancée.** Elle n'a pas été relancée depuis la mission 2. La seule autre exécution visible pendant la mission (`automatisations-palette-navigateur` dans `KOYEKOLA-studio`) n'était pas une suite complète et n'a pas fourni de résultat exploitable.
- `elementor-parite-3-navigateur` (2 tests) : exigent `sharp`, absent localement ; non exécutés.
- Firefox, Safari, tactile, lecteur d'écran réel, contrastes mesurés : non testés.
- Test de fluidité de la mission 6 : non relancé (intermittent sous charge, cause non démontrée au palier 8).
- Familles de modèles non rejouées une par une (fiche formation, archives vides, pagination) : voir LIMITATIONS L7.
