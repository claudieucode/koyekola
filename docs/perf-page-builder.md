# Performance du Page Builder — audit, mesures, corrections

Tout ce qui est écrit comme « mesuré » vient de `scripts/perf/bench-page-builder.js` (Chrome réel piloté par Playwright contre un vrai serveur).
Les hypothèses sont signalées comme telles.

## Architecture identifiée (réelle)

Le Page Builder n'est **pas** une application React : c'est un script JavaScript unique (`public/js/page-builder.js`, ~6 200 lignes, sans framework)
servi avec une page EJS. Points clés :

| Élément | Réalité |
|---|---|
| Document | `content.sections` : arbre JSON (sections libres → conteneurs → éléments), limites du produit : 400 éléments, 30 sections |
| Canevas | une **iframe** qui affiche le vrai rendu public ; à chaque modification, le navigateur envoie TOUT le document à `POST …/rendu`, le **serveur** valide et rend la page (EJS), le navigateur compare section par section (`patchCanvas`) et remplace les sections changées |
| Sélection | `selection` (tableau d'identifiants), calques (`renderTree`), inspecteur (`renderInspector`), barre contextuelle |
| Historique | `change()` : capture JSON complète du document avant chaque action (150 étapes au plus) ; saisies regroupées par clé |
| Enregistrement | `scheduleSave` : 1 s après la dernière modification, `PUT …/brouillon` du document complet, une sauvegarde à la fois, copie locale (`backup`) |
| Styles | générés côté serveur (`pageCss`) |

## Protocole de mesure (reproductible)

```
NODE_PATH=<dossier de playwright-core> node scripts/perf/bench-page-builder.js --sizes=20,100,300,400 [--profile] [--json=fichier]
```

Pages de 20, 100, 300 et 400 éléments (400 = limite du produit ; 500 est donc impossible), mélange de titres, textes riches, boutons, images, listes,
conteneurs imbriqués, grilles, styles et réglages par écran. Scénarios : chargement, sélection (12 calques), saisie (8 frappes puis latence
jusqu'au canevas), enregistrement automatique, 5 cycles dupliquer → annuler → rétablir → supprimer, défilement (cadence), nœuds DOM, mémoire.
`--profile` ajoute un profil CPU (CDP) par scénario : fonctions et lignes les plus coûteuses.
Configuration : Intel i5-6500 3,2 GHz ×4, Chrome 150, macOS Darwin 21.6.0, **machine chargée par d'autres programmes** (charge ≈ 6–12) :
les valeurs absolues sont pessimistes et bruitées (±30 %) ; les comparaisons avant / après ont été faites dans la même session avec le même protocole.
Mesures non réalisées : consommation mémoire fine (seul `performance.memory` est lu), pages de 500 éléments (limite produit), écrans tactiles.

## Résultats : avant → **après** (médianes)

| Mesure (ms) | 20 éléments | 100 | 300 | 400 |
|---|---|---|---|---|
| Chargement de l'éditeur | 825 → **2011** | 1212 → **687** | 2619 → **1271** | 2430 → **1077** |
| Sélection d'un calque (médiane, jusqu'à l'image suivante) | 31.5 → **28.3** | 36.1 → **27.3** | 61.7 → **27.4** | 37.5 → **32.3** |
| Frappe dans l'inspecteur (réponse du panneau) | 23.7 → **23** | 22.8 → **23.9** | 23.9 → **23.6** | 21.9 → **22** |
| **Frappe → le CANEVAS est à jour** | 283 → **164** | 649 → **179** | 1824 → **207** | 2154 → **236** |
| Dupliquer — traitement JS | 15.2 → **5.7** | 44.9 → **8.4** | 106.2 → **26.6** | 153.5 → **28.2** |
| Dupliquer — jusqu'à l'image suivante | 28 → **25.6** | 64.7 → **46.6** | 133.5 → **127.3** | 187.7 → **136.2** |
| Annuler — traitement JS | 6 → **3.6** | 30.7 → **4** | 92.7 → **10** | 116.4 → **15.5** |
| Annuler — jusqu'à l'image suivante | 15.6 → **17.1** | 46 → **20** | 160.5 → **33.6** | 149 → **41.4** |
| Rétablir — traitement JS | 3.6 → **2.2** | 25.4 → **5.2** | 87.4 → **13.6** | 105.5 → **23** |
| Rétablir — jusqu'à l'image suivante | 17.9 → **17.6** | 42.9 → **33.6** | 119.9 → **74.6** | 146.7 → **128.5** |
| Supprimer — traitement JS | 3.6 → **2.3** | 23.7 → **5.6** | 78 → **12.5** | 102.8 → **20.6** |
| Supprimer — jusqu'à l'image suivante | 12.1 → **10.8** | 38.9 → **35.3** | 106.9 → **69.3** | 144.4 → **109.7** |
| Défilement du canevas (images/s) | 62 → 61 | 62 → 61 | 62 → 61 | 62 → 61 |

## Goulots mesurés (par ordre d'impact) et causes confirmées

1. **Rendu serveur de l'aperçu : ~4 ms par élément** (1 s et plus pour 300 éléments). Cause confirmée par un profil CPU du serveur : plus de 85 % du temps
   était la **compilation des gabarits EJS** (`scanLine`, `compile`, `generateSource`) refaite à CHAQUE `include()` — donc pour chaque élément de la page.
   Express n'active le cache des gabarits que si `NODE_ENV=production` ; en développement et dans les tests il est coupé, et rien ne le forçait côté
   application. **Correction** (`server.js`) : cache toujours actif ; hors production, il est vidé dès qu'un fichier de `views/` change (gabarits toujours modifiables à chaud).
   Effet mesuré : latence frappe → canevas à 400 éléments **2 154 → 335 ms**, à 300 : **1 824 → 347 ms**, chargement de l'éditeur ÷ 3.
   *Hypothèse non vérifiée* : sur kolakisa.com, `NODE_ENV=production` est documenté (DEPLOIEMENT-HOSTINGER.md) ; si la variable y est bien posée, le cache y
   était déjà actif et seul l'environnement local / développement bénéficie de ce gain. Je n'ai pas accès aux variables de l'hébergeur.
2. **Mises en page forcées dans le fil principal** (`getBoundingClientRect`, `offsetHeight`, `scrollTop`, `scrollIntoView` : jusqu'à 140 ms cumulés par
   scénario à 300 éléments). Causes : lecture de `head.offsetHeight` et écriture de `scrollTop` à chaque reconstruction de l'inspecteur ; `scrollIntoView` immédiat
   à chaque sélection. **Corrections** : hauteur de l'en-tête connue d'avance (corrigée par le `ResizeObserver` avant l'affichage), défilement de l'inspecteur suivi par un
   écouteur au lieu d'être relu, `scrollIntoView` différé à l'image suivante.
3. **Calques reconstruits entièrement à chaque action** (`renderTree` : ~15 000 nœuds DOM à 400 éléments, 400 lignes × icônes clonées et écouteurs) et **sélection
   appliquée aux 400 lignes**. **Corrections** : signature des calques (identifiants, noms, drapeaux, hiérarchie, repli, filtre) : sans changement, pas de reconstruction
   (une modification de style ne touche plus aucun calque) ; **reconstruction différentielle** : une modification de structure ne crée que les lignes nouvelles ou changées
   (les autres sont réutilisées, leurs écouteurs lisent l'élément par son identifiant au moment du clic) ; marquage incrémental de la sélection ; noms calculés une fois ;
   `contain: layout style` sur la liste des calques.
4. **Délai de regroupement du rendu fixe à 150 ms** même pour une action isolée (dupliquer, supprimer, annuler, valeur choisie). **Correction** : 30 ms pour une action
   isolée, 150 ms conservés pour la saisie continue.
5. *Examiné et mesuré, non retenu comme goulot* : historique par copies JSON complètes (voir « Lots 4, 7 et 8 »), envoi du document complet à chaque rendu et
   chaque enregistrement (50 Ko à 400 éléments : enregistrement ≈ 20–30 ms côté serveur).

6. **Saut de 46 px de tout le canevas à chaque modification** (instabilité, pas lenteur) : la largeur de l'en-tête dépendait du texte d'état d'enregistrement
   (« Modifications non enregistrées » est plus long que « Enregistré à 14:03 ») ; à certaines largeurs (1 366 px mesuré, ou un titre de page long) l'en-tête passait
   sur une ligne de plus pendant la seconde qui précède l'enregistrement automatique, puis redescendait. Le test `editeur-stabilite-navigateur` l'a révélé dès que le rendu
   est devenu plus rapide (il mesurait avant la fin de cette seconde). **Correction** : texte court « Non enregistré » (le texte complet reste en infobulle).

Ce qui n'était pas un goulot (mesuré) : enregistrement automatique (20–30 ms côté serveur à 400 éléments), défilement du canevas (62 images/s partout), sélection
(≈ 40 ms à 400 éléments, dont ~22 ms de plancher d'affichage), mémoire (< 10 Mo de tas JS mesuré).

## Lots 4, 7 et 8 (mesurés)

**Glisser-déposer (lot 4)** — banc : 40 déplacements de souris réels (HTML5) puis dépôt, cadence mesurée par `requestAnimationFrame`.
Glisser un calque : médiane 16,6–16,9 ms/image (60 images/s) à toutes les tailles ; glisser un élément de la bibliothèque dans le canevas : idem. Pire image : 18 ms
(20–100 éléments), 63–154 ms une seule fois par glissement (au premier survol) à 300–400 éléments. Le code utilise déjà `requestAnimationFrame` pour l'indicateur de dépôt
et ne reconstruit rien pendant le déplacement : **aucune correction nécessaire**, aucune modification apportée.

**Ressources et widgets (lot 7)** — à l'ouverture de l'éditeur : 10 scripts (706 Ko décompressés, **193 Ko transférés**, dont `page-builder.js` 134 Ko), 6 feuilles de style
(305 Ko décompressés), 2 polices du site. Les widgets sont décrits par des DONNÉES (la fiche envoyée par le serveur) et non par du code : ajouter un widget n'ajoute aucun JavaScript ni
aucun écouteur ; la bibliothèque typographique (manifeste de 227 Ko, 420 polices) ne se charge qu'à la première ouverture du sélecteur. Les gains possibles restants
(différer `site-settings.js` 47 Ko et `page-builder-effects.js` 44 Ko) représentent ~13 % du JavaScript : **non fait**, gain non démontré (quelques ms d'analyse).

**Montée en charge (lot 8)** — option `--stress` : 150 modifications consécutives sur 400 éléments (historique plein) : médiane 11,5 ms par modification, pire 196 ms ;
mémoire JS (après nettoyage) 6,7 → 13 Mo, bornée par la limite de 150 étapes ; 150 annulations d'affilée en 2,0 s (13 ms chacune). Conclusion : l'historique par copies JSON
n'est pas un problème mesurable aujourd'hui (≈ 50 Ko × 150 = 7 Mo) ; il le deviendrait si la limite de 400 éléments était relevée.

## Budgets

| Budget initial | Statut (mesuré, machine chargée) |
|---|---|
| Réponse visuelle < 50 ms pour les interactions courantes | sélection et frappe : atteint (≈ 23–32 ms, dont ~22 ms de plancher) ; annuler : atteint (≤ 41 ms à 400) ; **rétablir, supprimer et dupliquer : traitement JS 14–28 ms mais 70–136 ms jusqu'à l'image suivante à 300–400 éléments → non atteint** (reste : mise en page et peinture du canevas et du panneau après l'opération, non isolées plus avant) |
| 60 images/s en interaction continue | défilement du canevas et glisser-déposer : 60 images/s (médiane 16,6 ms) à toutes les tailles ; une image lente isolée (63–154 ms) au premier survol pendant un glisser sur 300–400 éléments |
| Pas de remount injustifié du canevas | `patchCanvas` conservé ; vérifié par les tests de non-régression existants |
| Enregistrement non bloquant | confirmé (20–30 ms serveur, une sauvegarde à la fois) |

## Prochaines optimisations prioritaires (non faites)

1. Isoler le coût « jusqu'à l'image suivante » des opérations structurelles (profil de mise en page et de peinture : canevas patché + inspecteur reconstruit) : cible < 50 ms à 400 éléments.
2. Rendu **par section** : envoyer au serveur seulement la section modifiée (le serveur sait déjà rendre une section) : la latence canevas ne dépendrait plus de la taille de la page.
3. Historique par **commandes / correctifs** : seulement si le plafond de 400 éléments est relevé (7 Mo mesurés aujourd'hui).
4. Virtualisation de la liste des calques seulement si le plafond de 400 éléments est relevé (aujourd'hui 15 000 nœuds : acceptable).

## Recommandations pour les futurs widgets

- Un widget = un fichier de description (`src/marketing/pages/widgets/*.js`) + un gabarit : le coût de rendu est proportionnel au nombre d'éléments, pas de widgets
  disponibles ; ne jamais lire de mise en page (`getBoundingClientRect`…) pendant un traitement d'événement sans nécessité.
- Toute donnée dynamique passe par `data()` (serveur) ; éviter les requêtes lourdes dans cette fonction (elle s'exécute à chaque rendu d'aperçu).
- Lancer le banc (`--sizes=100,400`) avant et après l'ajout d'un widget qui touche au rendu ou aux calques.
