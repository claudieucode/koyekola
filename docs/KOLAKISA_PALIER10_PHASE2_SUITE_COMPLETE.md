# Palier 10 — phase 2 : suite complète isolée

## Conclusion

**SUITE EXÉCUTÉE AVEC ÉCHECS À ANALYSER** — 5 019 tests, 5 017 réussis, **2 échecs**, 0 ignoré, 0 annulé. Les 2 échecs sont dans un seul fichier (`editeur-menu-navigateur`), ne se reproduisent pas (rejeux seuls et sous charge, sur HEAD comme sur `738322d`) et leur cause n'est **pas démontrée**. Aucun fichier de production n'a été modifié dans cette phase.

## Exécution (commit testé : `d8a4daa`, branche `theme-builder-brouillon-parties`, arbre propre)

- Commande : `NODE_PATH=<jsdom>:<playwright-core 1.64>:<sharp 0.35.5> npm test` (= `node --test --test-concurrency=1 "tests/*.test.js"`, 395 fichiers).
- Début 2026-10-13 20:54:38 UTC, fin 22:41:12 UTC (1 h 47). Chrome 150 réel, Node 24.20.0.
- **Isolation** : 107 mesures (une par minute) = 0 processus de test d'une autre session, du premier au dernier relevé. La condition « isolé » est remplie. (Deux tentatives précédentes, abandonnées pour chevauchement, sont décrites plus bas.)
- Bilan Node : tests 5 019 · suites 1 051 · réussis 5 017 · échoués 2 · ignorés 0 · annulés 0 · durée 6 392 s.
- Aucun test ignoré : donc les parcours navigateur et les 5 fichiers `sharp` ont réellement tourné (au lieu de 3 ignorés + 6 blocs `sharp` ignorés lors de l'essai précédent).

## Les 2 échecs

Fichier `tests/editeur-menu-navigateur.test.js` (réglages du menu de navigation, parcours Chrome) :
- test 6 « réordonner (boutons puis glisser-déposer) » : après le glisser-déposer de « Contact », le brouillon n'a pas pris le nouvel ordre dans les 12 s (`Délai dépassé : enregistré : Contact glissé`) ;
- test 7 « sous-menu » : même type de délai (`Blog sous Contact`), à la suite de l'état laissé par le test 6.
Les tests 1 à 5 et 8 à 12 passent.

Analyse (faite le 2026-10-18) :
- Rejeu seul sur HEAD : 3 fois 12/12 ; sur `738322d` (worktree détaché, supprimé ensuite) : 3 fois 12/12.
- Rejeu sous 12 boucles CPU (les miennes), alterné HEAD / `738322d` : 6 fois chacun, **12/12 réussis partout**.
- Le fichier de test n'a pas changé depuis `738322d`, mais `public/js/page-builder.js` et `src/marketing/pages/index.js` ont changé (paliers 9 et 9.1) : un lien avec ces changements **ne peut pas être écarté**, ni démontré. Le geste en cause est un glisser-déposer natif (`dragTo`) ; ce fichier n'avait pas échoué lors de la suite précédente sur `4189ed9`.
- Classement : **non reproduit, cause non démontrée** (test de geste instable, ou régression rare). Rien n'a été corrigé en production, rien n'a été assoupli dans le test.
- Pour trancher : rejouer ce fichier un grand nombre de fois (≥ 30) sur HEAD et sur `738322d`, ou refaire la suite complète et voir si l'échec revient au même endroit.

## Vérifications demandées

- **En-tête / pied : brouillon, aperçu, publication** : les fichiers `theme-builder-*` et les tests « en-tête et pied de page » font partie des 5 017 réussis (0 échec, 0 ignoré).
- **SMS** (`marketing-sms-parcours`) et **e-mail** (course `sent` / `completed`) : réussis dans cette suite isolée. Une réussite unique ne prouve pas la stabilité ; l'e-mail avait déjà été vérifié sous 12 boucles CPU en phase 1.
- **Fluidité 300 éléments** : réussie ; seuil **inchangé**. Une seule réussite ne la déclare pas résolue : les tâches longues natives des widgets variés (52–263 ms) restent ouvertes.
- **`sharp`** : 5 fichiers exécutés réellement (0 ignoré).
- `refonte-design` (classe `mk-hint`) et `marketing-interface-5` : réussis.

## Tentatives précédentes (abandonnées)

- 2026-10-12 : non lancée, trois autres sessions faisaient tourner leurs suites (commit `d8a4daa`).
- 2026-10-13 12:15–12:41 UTC : suite lancée puis arrêtée par moi (processus du dossier `KOYEKOLA-noyau` seulement) quand `KOYEKOLA-accueil` puis `p9/final` ont lancé des tests ; aucun processus d'une autre session touché.

## Outils / environnement

- Le dossier temporaire a été partiellement nettoyé par macOS entre-temps (fichiers de `playwright-core` effacés) ; réinstallé hors du projet (`bench2`). `package.json`, verrou et `node_modules` du projet : non touchés.

## Git

Commits locaux uniquement. Aucun push, fusion ni déploiement.
