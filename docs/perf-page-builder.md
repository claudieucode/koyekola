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
| Chargement de l'éditeur | 825 → **655** | 1212 → **799** | 2619 → **968** | 2430 → **749** |
| Sélection d'un calque (médiane, jusqu'à l'image suivante) | 31.5 → **28.2** | 36.1 → **26.3** | 61.7 → **40.7** | 37.5 → **42.1** |
| Frappe dans l'inspecteur (réponse du panneau) | 23.7 → **24.3** | 22.8 → **23.8** | 23.9 → **23.5** | 21.9 → **23.3** |
| **Frappe → le CANEVAS est à jour** | 283 → **168** | 649 → **192** | 1824 → **347** | 2154 → **335** |
| Dupliquer — traitement JS | 15.2 → **6.9** | 44.9 → **20.7** | 106.2 → **74.8** | 153.5 → **66.3** |
| Dupliquer — jusqu'à l'image suivante | 28 → **26.2** | 64.7 → **67.3** | 133.5 → **191.4** | 187.7 → **175.2** |
| Annuler — traitement JS | 6 → **3.2** | 30.7 → **13.1** | 92.7 → **35.7** | 116.4 → **46.7** |
| Annuler — jusqu'à l'image suivante | 15.6 → **23.3** | 46 → **42.3** | 160.5 → **108.4** | 149 → **141.4** |
| Rétablir — traitement JS | 3.6 → **2.3** | 25.4 → **12.6** | 87.4 → **34.8** | 105.5 → **49.7** |
| Rétablir — jusqu'à l'image suivante | 17.9 → **14.9** | 42.9 → **42.3** | 119.9 → **100** | 146.7 → **143.5** |
| Supprimer — traitement JS | 3.6 → **2.7** | 23.7 → **11.1** | 78 → **31.8** | 102.8 → **48.5** |
| Supprimer — jusqu'à l'image suivante | 12.1 → **10.6** | 38.9 → **38.6** | 106.9 → **98.5** | 144.4 → **135.1** |
| Défilement du canevas (images/s) | 62 → 62 | 62 → 62 | 62 → 62 | 62 → 62 |
| Nœuds DOM (éditeur + canevas) | 2977 + 81 | 5757 + 275 | 12149 + 730 | 15456 + 964 |

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
   (une modification de style ne touche plus aucun calque) ; marquage incrémental de la sélection (seules les lignes qui changent) ; noms calculés une fois par reconstruction ;
   `contain: layout style` sur la liste des calques (leur mise en page ne recalcule plus le reste de l'éditeur).
4. **Délai de regroupement du rendu fixe à 150 ms** même pour une action isolée (dupliquer, supprimer, annuler, valeur choisie). **Correction** : 30 ms pour une action
   isolée, 150 ms conservés pour la saisie continue.
5. *Constaté, non corrigé* : historique par copies JSON complètes (150 × document), reconstruction complète des calques lors d'une modification de structure, envoi du
   document complet à chaque rendu et chaque enregistrement (50 Ko à 400 éléments : l'enregistrement mesuré reste ~20–30 ms ; ce n'est PAS un goulot).

Ce qui n'était pas un goulot (mesuré) : enregistrement automatique (20–30 ms côté serveur à 400 éléments), défilement du canevas (62 images/s partout), sélection
(≈ 40 ms à 400 éléments, dont ~22 ms de plancher d'affichage), mémoire (< 10 Mo de tas JS mesuré).

## Budgets

| Budget initial | Statut (mesuré, machine chargée) |
|---|---|
| Réponse visuelle < 50 ms pour les interactions courantes | sélection et frappe : atteint (≈ 25–42 ms, dont ~22 ms de plancher) ; annuler / rétablir / supprimer : traitement JS 30–50 ms à 300–400 éléments, **mais 100–190 ms jusqu'à l'image suivante** → **non atteint** pour les opérations structurelles sur les grandes pages |
| 60 images/s en interaction continue | défilement du canevas : 62 images/s à toutes les tailles ; glisser-déposer : non mesuré par le banc |
| Pas de remount injustifié du canevas | `patchCanvas` conservé ; vérifié par les tests de non-régression existants |
| Enregistrement non bloquant | confirmé (20–30 ms serveur, une sauvegarde à la fois) |

## Prochaines optimisations prioritaires (non faites)

1. Reconstruction **différentielle** des calques (au lieu d'un `textContent = ""` + reconstruction) et icônes partagées : les opérations structurelles à 400 éléments passeraient sous 50 ms.
2. Rendu **par section** : envoyer au serveur seulement la section modifiée (le serveur sait déjà rendre une section) : la latence canevas ne dépendrait plus de la taille de la page.
3. Historique par **commandes / correctifs** au lieu de copies JSON complètes (mémoire et coût de `snapshot()` à 400 éléments).
4. Virtualisation de la liste des calques seulement si le plafond de 400 éléments est relevé (aujourd'hui 15 000 nœuds : acceptable).

## Recommandations pour les futurs widgets

- Un widget = un fichier de description (`src/marketing/pages/widgets/*.js`) + un gabarit : le coût de rendu est proportionnel au nombre d'éléments, pas de widgets
  disponibles ; ne jamais lire de mise en page (`getBoundingClientRect`…) pendant un traitement d'événement sans nécessité.
- Toute donnée dynamique passe par `data()` (serveur) ; éviter les requêtes lourdes dans cette fonction (elle s'exécute à chaque rendu d'aperçu).
- Lancer le banc (`--sizes=100,400`) avant et après l'ajout d'un widget qui touche au rendu ou aux calques.
