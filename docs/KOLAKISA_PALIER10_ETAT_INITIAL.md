# Palier 10 — état initial (suite complète et risques ouverts)

*Relevé du 2026-10-12 sur la branche `theme-builder-brouillon-parties`, base `4189ed9` (paliers 8 `19f0bcf`, 9 `a0598f3`, 9.1 `4189ed9`). Aucun push, fusion ni déploiement.*

## 1. Suite complète
- **Commande exacte :** `NODE_PATH=<jsdom + playwright-core hors projet> npm test`, soit `node --test --test-concurrency=1 "tests/*.test.js"` (395 fichiers). Sans `NODE_PATH`, les parcours navigateur (jsdom, Playwright) sont ignorés : ils ont donc été activés pour cette exécution.
- **Durée :** 19:27 → 21:40 UTC, soit 2 h 13 (7 975 s). Elle s'est **terminée normalement** (code de sortie 1 à cause des échecs).
- **Résultat réel :** 4 996 tests · **4 990 réussis · 3 échoués · 3 ignorés** · 0 annulé · 0 bloqué · 0 non exécuté (hors fichiers entièrement ignorés listés plus bas).
- **Chevauchement avec d'autres sessions :** il n'a **pas** pu être évité. L'échantillonnage minute par minute (130 relevés) montre 1 à 6 autres processus `node --test` (dossiers `KOYEKOLA-studio` et `KOYEKOLA-deploy`), 4 le plus souvent, et une charge machine de 8 à 83. Les résultats sont donc obtenus **sous charge** ; chaque échec a été rejoué seul.

## 2. Échecs : cause, origine, statut
| Test | Rejoué seul sur `HEAD` | Rejoué sur `738322d` (avant paliers 8-9.1) | Verdict |
|---|---|---|---|
| `refonte-design` › « aucune classe orpheline » (`mk-hint`) | échoue | **réussit** | **Régression introduite par moi** au palier 9 : la page *Modèles de thème* utilisait une classe `mk-hint` sans style. **Corrigée** (classe `field-hint`), test rejoué : réussi (37/37 avec le fichier Theme Builder). |
| `marketing-sms-parcours` › « double confirmation : l'accord SMS… » (+ « formulaires : case accepter les SMS ») | échoue | **échoue aussi** | **Préexistant**, sans lien avec les paliers 8-9.1. Cause **non analysée** (hors périmètre de cette étape). |
| `marketing-interface-5` › « un élève s'inscrit → … e-mail de scénario » (`running` au lieu de `completed`) | **réussit** | réussit | **Instabilité sous charge** (attente d'un travail en arrière-plan) ; non reproduite seul. Cause non démontrée. |

## 3. Tests ignorés (3 + fichiers entiers)
- 3 tests marqués `SKIP` dans les suites navigateur (diaporama de fond / Ken Burns, galerie à 12 colonnes, témoignage / code / barre de lecture) : ignorés par leur auteur, raison non réexaminée.
- **`sharp` absent** (module non installé localement) : 6 fichiers / blocs entiers ignorés — « galerie : options (navigateur) », « résolution d'image : éditeur (navigateur) », « résolutions d'image », « fond d'image et photo de témoignage », « widget Image : visionneuse », « santé du redimensionnement ». À exécuter sur une machine avec `sharp` (il est disponible en production d'après la mémoire du projet, non revérifié ici).

## 4. Test de fluidité (mission 6, ~300 éléments)
`performance : geste de poignée fluide sur une page de 300 éléments (aucune image > 50 ms)` : **réussi** dans cette exécution (4,9 s), malgré la charge. Il reste **intermittent** d'après le palier 8 (échecs reproduits sous charge, jusqu'à 300 ms) ; **cause non démontrée**, seuil intact. Toujours ouvert.

## 5. Ce qui n'est pas validé
- **Navigateurs :** Chrome 150 / macOS uniquement. Firefox, Safari, tactile : aucun test.
- **Accessibilité :** noms accessibles et clavier de base vérifiés en Chrome sur le catalogue (palier 8) ; contrastes mesurés, lecteur d'écran réel, clavier du nouveau menu « Abandonner les modifications non publiées » : non faits.
- **Widgets Elementor absents du registre** (vérifié au palier 8) : Shortcode, Sidebar, Portfolio, Méga-menu, boutons de paiement, Avant/Après, Marquee. Onglets / accordéons sans widgets imbriqués ; pas de modèle de page individuelle générique.
- **Limites des paliers :** 8 (G1-G6), 9 (L1 réglée par 9.1 ; L2-L12 ouvertes), 9.1 (brouillon non copié avec un site, aperçu sans sélecteur de page, pas d'historique de composants, pas de liste des pages touchées avant « Mettre à jour »).

## 6. Risques de régression détectés
1. Le palier 9 a laissé passer une classe CSS orpheline que la suite complète seule a révélée → **toute mission doit relancer au moins `refonte-design`** ; les tests ciblés ne suffisaient pas.
2. Le comportement « en-tête / pied de page publiés à chaque enregistrement » a changé (9.1) : tout test ou document qui l'affirme encore est périmé (cinq tests adaptés ; `docs/cms-appearance.md` et les documents d'origine du palier « En-tête du site » n'ont pas été revus).
3. Instabilité sous charge de tests dépendant de tâches de fond (`marketing-interface-5`) : sans machine isolée, des faux échecs sont possibles.
4. Instabilité résiduelle du canevas sur de grandes pages (fluidité, palier 10).

## 7. Plan de validation du palier 10 (proposé, rien n'est corrigé avant votre accord)
1. **Base saine :** décider du sort de l'échec SMS préexistant (analyse de cause d'abord, 30 min) ; réexécuter la suite complète sur machine isolée (aucune autre session) pour confirmer 0 échec hors SMS.
2. **Performance :** profil du geste de poignée avec widgets variés sur ~300 éléments (cause à démontrer avant tout seuil), mesure avant / après.
3. **Compatibilité :** installer Firefox et WebKit pour Playwright ; rejouer les parcours critiques (éditeur, publication, en-tête / pied) ; tactile émulé.
4. **Accessibilité :** contrastes (outil automatique + thème clair / sombre), parcours clavier de l'éditeur et du site publié, noms accessibles ; lecteur d'écran réel si disponible.
5. **Parité Elementor :** décider quels widgets absents ajouter (Marquee, Avant/Après, Shortcode… un par un) et les imbrications onglets / accordéons ; chaque ajout avec ses tests.
6. **Sécurité :** isolation entre organisations (tests multi-organisations), contenu hostile dans les composants.
7. **Clôture :** suite complète finale sur machine isolée, `sharp` installé.
