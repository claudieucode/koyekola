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
| Chargement de l'éditeur | 825 → **1389** | 1212 → **983** | 2619 → **1445** | 2430 → **1696** |
| Sélection d'un calque (médiane, jusqu'à l'image suivante) | 31.5 → **30.4** | 36.1 → **35.1** | 61.7 → **36.4** | 37.5 → **43** |
| Frappe dans l'inspecteur (réponse du panneau) | 23.7 → **22.7** | 22.8 → **22.8** | 23.9 → **23.3** | 21.9 → **23.2** |
| **Frappe → le CANEVAS est à jour** | 283 → **96** | 649 → **167** | 1824 → **218** | 2154 → **221** |
| Dupliquer — traitement JS | 15.2 → **4.3** | 44.9 → **6.2** | 106.2 → **13.7** | 153.5 → **23.6** |
| Dupliquer — jusqu'à l'image suivante | 28 → **24.9** | 64.7 → **27.6** | 133.5 → **40.6** | 187.7 → **55.8** |
| Annuler — traitement JS | 6 → **3.4** | 30.7 → **4.6** | 92.7 → **11.8** | 116.4 → **16** |
| Annuler — jusqu'à l'image suivante | 15.6 → **17.8** | 46 → **19.4** | 160.5 → **38.6** | 149 → **48.5** |
| Rétablir — traitement JS | 3.6 → **2.1** | 25.4 → **3.6** | 87.4 → **9.9** | 105.5 → **15.7** |
| Rétablir — jusqu'à l'image suivante | 17.9 → **16** | 42.9 → **17.7** | 119.9 → **30.7** | 146.7 → **39.7** |
| Supprimer — traitement JS | 3.6 → **2.1** | 23.7 → **3.6** | 78 → **8.7** | 102.8 → **13.5** |
| Supprimer — jusqu'à l'image suivante | 12.1 → **12** | 38.9 → **17.6** | 106.9 → **28.2** | 144.4 → **36.5** |
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
   `contain: layout style` sur la liste des calques. **Deux défauts trouvés par trace de rendu du navigateur** (catégories `devtools.timeline` + suivi des invalidations,
   option `--trace` du banc) : (a) les lignes des CONTENEURS étaient recréées à chaque opération (leur libellé « supprimer … et ses N éléments » dépend du nombre de
   descendants), ce qui déplaçait tous leurs descendants dans le DOM : plus de 4 800 invalidations de mise en page et un recalcul de style de ~13 700 éléments (91 à 420 ms) par
   opération ; le libellé est maintenant mis à jour en place ; (b) l'ordre des lignes était rétabli en « déplaçant » la ligne suivante devant une ligne supprimée : les
   lignes disparues sont retirées d'abord. Effet à 400 éléments (par opération) : mise en page 17 → 6 ms, calcul de style 28 → 5 ms.
4. **Délai de regroupement du rendu fixe à 150 ms** même pour une action isolée (dupliquer, supprimer, annuler, valeur choisie) et pour une petite page. **Correction** : 30 ms
   pour une action isolée ; pour la saisie, délai proportionnel au coût du dernier rendu (50 ms mini, 150 ms maxi).
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
| Réponse visuelle < 50 ms pour les interactions courantes | atteint, machine chargée : frappe (≈ 23 ms), annuler (≈ 48 ms), rétablir (≈ 39 ms), supprimer (≈ 37 ms), dupliquer (≈ 41–56 ms) à 300–400 éléments ; **sélection : 36–48 ms médiane à 300–400 éléments (plancher d'affichage ≈ 22 ms) mais des valeurs extrêmes jusqu'à 100–130 ms** ; dupliquer un conteneur entier est la plus lente |
| 60 images/s en interaction continue | défilement du canevas et glisser-déposer : 60 images/s (médiane 16,6 ms) à toutes les tailles ; une image lente isolée (63–154 ms) au premier survol pendant un glisser sur 300–400 éléments |
| Pas de remount injustifié du canevas | `patchCanvas` conservé ; vérifié par les tests de non-régression existants |
| Enregistrement non bloquant | confirmé (20–30 ms serveur, une sauvegarde à la fois) |

## Prochaines optimisations prioritaires (non faites)

1. Latence « frappe → canevas » (≈ 200–250 ms à 300–400 éléments) : se compose du regroupement de la saisie (≤ 150 ms), de la requête (calcul serveur ≈ 65 ms à 400 éléments, le reste est le transport et les intergiciels) et du comparateur de sections du navigateur. Le rendu **par section** ne ferait gagner que ≈ 50 ms au maximum (calcul serveur) : **évalué, non retenu pour l'instant**.
2. Valeurs extrêmes de la sélection (100–130 ms) : à profiler avec `--trace` quand la machine est calme.
3. Historique par **commandes / correctifs** : seulement si le plafond de 400 éléments est relevé (7 Mo mesurés aujourd'hui).
4. Virtualisation de la liste des calques seulement si le plafond de 400 éléments est relevé (aujourd'hui 15 000 nœuds : acceptable).

## Recommandations pour les futurs widgets

- Un widget = un fichier de description (`src/marketing/pages/widgets/*.js`) + un gabarit : le coût de rendu est proportionnel au nombre d'éléments, pas de widgets
  disponibles ; ne jamais lire de mise en page (`getBoundingClientRect`…) pendant un traitement d'événement sans nécessité.
- Toute donnée dynamique passe par `data()` (serveur) ; éviter les requêtes lourdes dans cette fonction (elle s'exécute à chaque rendu d'aperçu).
- Lancer le banc (`--sizes=100,400`) avant et après l'ajout d'un widget qui touche au rendu ou aux calques.

## Référence du 2026-10-10 (LOT 2 du programme « Editor Excellence »)

Mesure fraîche, protocole inchangé : `node scripts/perf/bench-page-builder.js --sizes=100,400 --json=…`. Machine : Intel i5-6500 ×4, Chrome 150.0.7871.125,
Darwin 21.6.0, **charge 6,1 / 12,3 / 19,2** (encore élevée : valeurs pessimistes, bruit possible de ±30 %). Une seule exécution par taille : ce sont des valeurs
de référence, pas des médianes de plusieurs séries. Médianes en ms, « image » = jusqu'à l'image suivante.

| Mesure | 100 éléments | 400 éléments |
|---|---|---|
| Chargement de l'éditeur | 1081 | 760 |
| Nœuds DOM (fenêtre / canevas) | 5 920 / 275 | 15 619 / 964 |
| Mémoire JS (début → fin) Mo | 5,4 → 6,0 | 6,1 → 6,9 |
| Sélection d'un calque (médiane / max) | 25,8 / 40,2 | 40,6 / 74,7 |
| Frappe dans l'inspecteur (médiane) | 20,1 | 24,3 |
| Frappe → canevas à jour | 182 | 196 |
| Dupliquer : JS / image | 5,6 / 23,9 | 20,9 / 56,1 |
| Annuler : JS / image | 4,6 / 19,9 | 17,7 / 48,7 |
| Rétablir : JS / image | 3,8 / 17,3 | 15,3 / 42,2 |
| Supprimer : JS / image | 3,6 / 16,6 | 13,9 / 38,0 |
| Glisser un calque : médiane / pire image / tâches longues | 16,7 / 24,5 / 0 | 16,7 / 55,3 / 1 |
| Glisser depuis la bibliothèque : médiane / pire / tâches longues | 16,7 / 49 / 0 | 16,7 / 83,3 / 2 |
| Défilement du canevas (images/s) | 61 | 61 |
| Taille du document envoyé (Ko) | 256 | 294 |

Lecture : aucune régression visible par rapport à la table « après » ci-dessus (mêmes ordres de grandeur ; ce n'est pas une comparaison statistique). À 400 éléments,
dupliquer dépasse légèrement 50 ms jusqu'à l'image (56,1) ; les autres actions restent sous 50 ms. Le glisser depuis la bibliothèque y montre 2 tâches longues : point à
surveiller, non corrigé (cause non profilée). Non mesuré : latence de rendu **par section** (le canevas ne rend pas une section isolée ; voir `patchCanvas`), 500 éléments
(au-delà de la limite produit), appareils tactiles.

### Garde-fous automatiques existants (pas de doublon créé)

`tests/page-builder-performance-navigateur.test.js` vérifie déjà : calques non reconstruits pour une modification de style, reconstruction différentielle
(< 120 mutations), sélection incrémentale, et rendu serveur de 400 éléments (< 1 400 ms, gabarits compilés une fois). Ces seuils sont larges exprès (la machine est partagée).

### Garde-fou proposé (non construit)

Un test de seuils larges sur 400 éléments (action → image suivante < 250 ms, soit ≈ 4–5 × la référence ci-dessus) attraperait une régression grossière sans casser sous charge.
Il n'est pas écrit : sans plusieurs séries de mesures à machine calme, un seuil serré serait instable et un seuil large attraperait peu. À décider après une série de 5 exécutions.
