# Plan d'exécution par phases (phase 1 = cette étude ; aucune date promise)

Base : `ARCHITECTURE_ISOLATION_PROPOSEE.md` (technique retenue : frontière de pied par exclusion + jetons locaux). Durées : petite / moyenne / grande, relatives, sans promesse de délai. Règle commune : **on ajoute, on n'écrase jamais** ; rien n'est déployé sans que l'utilisateur ait vu le résultat ; tout nouveau code est livré avec ses tests.

## Phase 2 : préparation du nouveau système (durée : grande)
* **Objectif** : disposer de la frontière, de l'aperçu, de l'éditeur et du rendu public, **sans changer un seul pied existant**.
* **Périmètre** : (1) module `footerFrontier.js` (exclusion, CSS de la frontière, table de remappage) ; (2) passage de tous les émetteurs de CSS « site » par `excludeFooter` (thèmes, `themeCss`, `globalStyles`, `siteSettings`, CSS perso) ; (3) rendu : balise racine `data-kw-ft`, pied hors `<main>`, ligne légale dans le pied ; pages hors Page Builder (blog, boutique, 404) ; (4) aperçu sans CSS de site + case « avec mon thème » ; (5) canevas de l'éditeur avec la même racine ; (6) réglage de pied `legacy | solo | site` et bouton « Rendre ce pied indépendant » avec aperçu avant/après ; (7) émission des `--ft-*` par `moteur.js` / `kit-conception.js` ; (8) stratégie de remplacement mise en place (voir `PLAN_REMPLACEMENT_ANCIEN_CATALOGUE.md` : sauvegarde, alias).
* **Fichiers** : voir le tableau §5 de l'architecture (`footerFrontier.js` nouveau, `packs/index.js`, `themeCss.js`, `globalStyles.js`, `siteSettings.js`, `themeRender.js`, `_sections.ejs`, `landing.ejs`, `partials/footer.ejs`, `_foot-legal.ejs`, `moteur.js`, `kit-conception.js`, `nodes.js`, `landing.css`, vue de l'éditeur de composant).
* **Dépendances** : aucune en amont ; l'utilisateur doit trancher les décisions 1 à 6 du §8 de l'architecture avant de coder ce qui en dépend (CSS perso, points de rupture, aperçu).
* **Risques** : fuite par un émetteur oublié ; régression de l'accessibilité en sortant le pied de `<main>` ; cascade des thèmes (130) modifiée par erreur ; pages hors Page Builder non couvertes ; éditeur (contours de sélection dans une racine `all: initial`) ; double chargement de `landing.css`.
* **Livrables** : code + tests de la frontière ; les 100 pieds actuels **inchangés au pixel et au style calculé** tant qu'ils sont en `legacy` (test d'égalité avant/après déploiement) ; rapport de phase.
* **Critères de validation** : (a) scénario en 10 étapes automatisé sur un pied de test en `solo` : **0 changement** sous les 9 états × 2 largeurs, 0 contamination en-tête/contenu ; (b) mêmes 100 pieds en `legacy` : 0 écart vs. avant déploiement ; (c) aperçu = publié (styles calculés) ; (d) éditeur : sélection, enregistrement, rechargement OK ; (e) suites de régression existantes vertes (liste dans `TESTS_STRATEGIE.md`) ; (f) test de couverture du remappage vert.
* **Décisions utilisateur** : les 6 du §8 de l'architecture.

## Phase 3 : UN modèle de référence premium, complet (durée : moyenne)
* **Objectif** : prouver la chaîne complète (conception → éditeur → public → aperçu → changements du site) sur un seul pied soigné, avant toute production en série.
* **Périmètre** : un modèle (choix proposé par l'utilisateur ; suggestion : un pied riche en widgets, ex. famille « corporate » ou « e-commerce ») écrit avec les `--ft-*` ; widgets réels (liens, réseaux, recherche, lettre d'information, ligne légale, accordéon mobile) ; responsive 5 largeurs ; états survol/focus ; mouvement réduit ; impression ; polices embarquées.
* **Fichiers** : un fichier de famille sous `src/themeBuilder/catalog/footer/familles/` (ou nouveau dossier de la bibliothèque v2), plus ses tests.
* **Dépendances** : phase 2 terminée.
* **Risques** : jetons mal choisis (à refaire pour 99 modèles) ; poids des polices ; écart entre l'éditeur et le public.
* **Livrables** : le modèle, planches de captures (identité marine, 4 thèmes, 5 largeurs, aperçu, éditeur, public), rapport de contrôle.
* **Critères** : scénario d'indépendance à 0 ; contraste AA calculé ; cibles ≥ 44 px ; clavier complet ; capture regardée une par une ; poids CSS/polices mesurés ; modèle ouvert et modifié dans l'éditeur puis republié sans changement d'identité.
* **Décision utilisateur** : **valider (ou refuser) le modèle de référence** avant la phase 4 ; fixer le budget de poids par pied.

## Phase 4 : les 99 autres modèles, par petits groupes (durée : grande)
* **Objectif** : produire la bibliothèque complète sur la même base.
* **Périmètre** : groupes de 5 à 8 modèles ; **matrice de diversité** (famille × ambiance × structure × widgets × longueur) pour qu'aucun groupe ne se ressemble ; chaque groupe passe : tests d'indépendance, structure, responsive (5 largeurs), contraste AA, contrôle visuel, accessibilité (clavier), poids.
* **Fichiers** : modèles v2 + `footer-aliases.js` (chaque nouvel identifiant reçoit son alias AVANT d'être listé).
* **Dépendances** : phase 3 validée.
* **Risques** : dérive visuelle (gabarits répétés), régression d'un widget partagé, explosion du poids, lenteur des tests (le serveur de test charge 100 modèles).
* **Livrables** : par groupe : modèles, planche, résultats des tests, rapport court.
* **Critères** : les mêmes que la phase 3, plus « aucun modèle n'est un clone d'un autre » (matrice de diversité remplie, vérifiée à l'œil sur planche).
* **Décisions utilisateur** : validation de chaque planche de groupe (ou par lot de plusieurs).

## Phase 5 : remplacement complet de l'ancien catalogue (durée : moyenne)
* **Objectif** : la bibliothèque affiche les 100 modèles v2 ; les anciens restent ouvrables via les alias ; **aucun pied publié ou affecté ne bouge**.
* **Périmètre** : voir `PLAN_REMPLACEMENT_ANCIEN_CATALOGUE.md` (sauvegarde avant, export des instances et affectations, git tag, alias en chaîne ancien → actuel → v2, favoris, `origin_key`, révisions, `footer/ancien.js`, catalogue Page Builder des 24 composants conservé, caches).
* **Fichiers** : `catalog/footer.js` (assembleur), `footer-aliases.js`, `originBackfill.js`, tests `footer-aliases`, `footer-100-integration`, `footer-bibliotheque-*`, `theme-builder-pieds-*`.
* **Dépendances** : phase 4 terminée et validée ; sauvegardes faites ; requêtes Q1-Q9 de l'audit des risques exécutées sur les bases réelles.
* **Risques** : alias manquant (favori orphelin, « Revenir au modèle d'origine » indisponible), 2 minutes de cache navigateur, déploiement manuel (hPanel).
* **Livrables** : catalogue v2 publié (code), journal de contrôle avant/après, procédure de retour arrière testée.
* **Critères** : Q6 renvoie 0 ligne ; tous les anciens identifiants se résolvent ; les pieds publiés ont les mêmes styles calculés qu'avant ; le test « aucun identifiant publié n'a disparu sans alias » est vert.
* **Décisions utilisateur** : activer `solo` sur les copies existantes (aucune / à la demande / toutes) ; date de retrait de `ancien.js` (seulement après `originBackfill` sur toutes les bases).

## Phase 6 : audit final (durée : petite à moyenne)
* **Objectif** : rejouer, sur le produit livré, le même audit que la phase 1 et conclure honnêtement.
* **Périmètre** : scénario en 10 étapes sur les 100 modèles ; contamination ; structure ; responsive ; accessibilité ; performance ; visuel (100 captures regardées) ; multisite ; régression complète.
* **Livrables** : rapport d'audit comparant AVANT (phase 1) / APRÈS, avec la liste de ce qui n'est pas encore atteint.
* **Critères** : 100/100 « INDÉPENDANT » (définition de `AUDIT_INDEPENDANCE_GRAPHIQUE.md` §5), 0 contamination, 0 régression.
* **Décision utilisateur** : clôture ou nouveau cycle.
