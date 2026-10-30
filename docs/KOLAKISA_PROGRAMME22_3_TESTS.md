# Tests — programme 22.3

| Fichier | Tests | Contenu |
|---|---|---|
| `tests/programme22-3-layouts.test.js` | 31 | Service, vraie base, vrai `saveDraft`, vrai générateur de CSS (`pageCss`) |
| `tests/programme22-3-layouts-http.test.js` | 6 | Serveur réel : écran, API, droits, isolation entre sites, application, protections, annulation |
| `tests/programme22-3-reference.test.js` | 1 | Comparaison avec les 15 scénarios de 22.1 |
| `tests/manuel/layouts-ui-smoke.js` | 24 contrôles | Chrome réel (1280 px et 390 px) ; hors `npm test` |

Les 20 scénarios de la mission sont couverts ainsi (heros corporate/éditorial/asymétrique/immersif, grille de services, mosaïque, galerie éditoriale, statistiques, équipe, témoignages, tarifs, pages services/institutionnelle/portfolio/produit/catégorie, mobile, tablette, contenu long et court) : **chaque** layout est construit avec un contenu complet et passe le normaliseur natif ; widgets du registre ; zéro CSS libre ; profondeur et nombre de nœuds bornés ; espacements en jetons ; équilibre ≥ 70 sans erreur ; contenu long non tronqué ; responsive (modèle + CSS) ; réenregistrement identique (éditabilité) ; sauvegarde en brouillon ; aperçu filaire.
Les pages complètes (services, accueil) sont testées par composition (`composePage`) ; les pages « institutionnelle », « produit », « catégorie » le sont par les rôles qui les composent (intro/équipe, détail, catégories/produits), pas par une page entière dédiée.
Comparaison avec 22.1 (`tests/programme22-3-reference.test.js`, 1 test, scénarios de `tests/quality-lab/scenarios.js`) : l'accueil de chacun des 15 briefs est composé avec des contenus FICTIFS identiques par nature (images seulement pour les scénarios visuels). Résultat mesuré : **14 accueils structurellement distincts sur 15** (22.1 : 1/15), similarité moyenne des layouts **0,26** (22.1 : 1,00), score d'équilibre minimal 90. Objectif de suivi 22.1 (≥ 8/15, < 0,6) atteint **pour la composition** ; cela ne mesure ni la qualité rédactionnelle, ni les couleurs/typographies (hors périmètre 22.3), ni le rendu final. Le laboratoire 22.1 complet (serveur, rendu public) n'a pas été relancé avec ce moteur : il n'est pas branché sur le Page Generator.
Non exécuté : suite complète, Firefox/Safari, lecteur d'écran, appareils réels, test de charge, lint/typecheck/build (inexistants pour ce code ; `node --check`).
