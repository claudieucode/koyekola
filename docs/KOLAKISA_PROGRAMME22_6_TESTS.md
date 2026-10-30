# Programme 22.6 — tests

Tout est exécuté sans réseau et sans coût : IA **simulée** (fonction `call` injectée), base de test avec les vraies migrations, vrai serveur HTTP, vrai Chrome.

| Fichier | Niveau | Tests |
|---|---|---|
| `tests/programme22-6-content-intelligence.test.js` | services, base réelle en mémoire | 39 |
| `tests/programme22-6-content-intelligence-http.test.js` | serveur réel, membres de rôles différents, deux sites | 10 |
| `tests/programme22-6-content-intelligence-navigateur.test.js` | Chrome réel (Playwright) | 6 |

## Couverture des 25 sujets demandés
| # | Sujet | Test(s) |
|---|---|---|
| 1 | Page commerciale / de service | service 7, 17 |
| 2 | Page institutionnelle | service 1, 2 (genres et faits attendus) |
| 3 | Article | service 14 ; HTTP « évaluer un texte d'article » |
| 4 | Page produit | service 2 (faits attendus `products`) |
| 5 | Page catégorie | service 1 |
| 6 | Voix de marque | service 10, 18 |
| 7 | Intention de recherche | service 3, 4, 19 |
| 8 | Métadonnées | service 13 (corrections dérivées du contenu) |
| 9 | Analyse des titres | service 5 |
| 10 | Liens internes | service 28 à 33 ; HTTP maillage ; Chrome maillage |
| 11 | Contenus incomplets | service 9, 22 |
| 12 | Informations non vérifiées | service 8 |
| 13 | Optimisation d'un texte existant | service 23, 24 (14 actions comprises par 21.9) |
| 14 | Préservation du texte original | service 24 (aucune écriture sans acceptation, fait inventé refusé) |
| 15 | Annulation et restauration | service 25 ; liens : version de page prise avant |
| 16 | Multilingue | service 34, 36, 37 |
| 17 | Marchés internationaux | service 37 |
| 18 | Canonical et hreflang | service 35, 38 (**calcul et validation ; émission dans le `<head>` non faite**) |
| 19 | Données structurées | service 38 (cohérence FAQ/Product/Article) |
| 20 | Sitemap | non modifié ; couvert par `seo-*` (régression) |
| 21 | Permissions multisites | HTTP (lecteur sans droit, membre d'un autre site) ; service 42 |
| 22 | Isolation des données | service 33, 41 ; HTTP |
| 23 | Sauvegarde et rechargement | service 17 (cache relu), 29 (brouillon relu) |
| 24 | Publication réelle | pages publiées de test ; **le lien accepté va au brouillon et la page en ligne reste intacte** (HTTP, Chrome). Pas de publication automatique par ce moteur |
| 25 | Compatibilité SEO existant | régression : 55 fichiers (`seo-*`, `cms-seo*`, `portee-des-routes`, `programme21-*`, `site-*`, `palier12-*`) |

## Résultats
- 39/39 services · 10/10 HTTP · 6/6 Chrome.
- **Régression : 618/618** sur 55 fichiers (SEO, CMS-SEO, portée des routes, inventaire des tables, menus, paliers 21.x dont régénération et contenu, site-espace).
- **Mutations volontaires** (code cassé puis restauré) : désactiver le refus d'une métrique sur une estimation de l'IA et retirer le filtre `site_id` des mots-clés et des propositions de liens font échouer 3 tests (33, 39, 41).

## Défauts trouvés par les tests et corrigés
1. **Quatre des quatorze actions d'optimisation n'étaient pas comprises par la régénération 21.9** (« plus commercial », sous-titres, autre cible, harmoniser le ton → demande d'éclaircissement). Textes réécrits avec les verbes que l'analyseur reconnaît ; un test vérifie désormais les 14.
2. **Mots du texte de consigne (« avis », « garantie ») interprétés par l'analyseur 21.9 comme une section** : consigne sobre ; la garde anti-invention reste appliquée par le code.
3. **Liens Markdown confondus avec des images** (`![](a.png)` comptée comme lien).
4. **Contenu vide noté** : il reçoit maintenant « pas de note » et un problème bloquant.
5. **Intention « comment choisir… » classée commerciale** : un indice qui ouvre la requête pèse double.
6. **Tableau des pages débordant de 320 px** : conteneur à défilement horizontal, focusable, avec libellé.
7. `optimize` levait une exception synchrone au lieu d'un rejet de promesse.

## Non exécuté
Lint, typecheck, build (inexistants pour ce code ; `node --check` seulement). Suite complète `npm test` non lancée. Aucun fournisseur d'IA réel.
