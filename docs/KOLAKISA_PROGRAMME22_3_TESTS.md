# Tests — programme 22.3

| Fichier | Tests | Contenu |
|---|---|---|
| `tests/programme22-3-layouts.test.js` | 31 | Service, vraie base, vrai `saveDraft`, vrai générateur de CSS (`pageCss`) |
| `tests/programme22-3-layouts-http.test.js` | 6 | Serveur réel : écran, API, droits, isolation entre sites, application, protections, annulation |
| `tests/manuel/layouts-ui-smoke.js` | 24 contrôles | Chrome réel (1280 px et 390 px) ; hors `npm test` |

Les 20 scénarios de la mission sont couverts ainsi (heros corporate/éditorial/asymétrique/immersif, grille de services, mosaïque, galerie éditoriale, statistiques, équipe, témoignages, tarifs, pages services/institutionnelle/portfolio/produit/catégorie, mobile, tablette, contenu long et court) : **chaque** layout est construit avec un contenu complet et passe le normaliseur natif ; widgets du registre ; zéro CSS libre ; profondeur et nombre de nœuds bornés ; espacements en jetons ; équilibre ≥ 70 sans erreur ; contenu long non tronqué ; responsive (modèle + CSS) ; réenregistrement identique (éditabilité) ; sauvegarde en brouillon ; aperçu filaire.
Les pages complètes (services, accueil) sont testées par composition (`composePage`) ; les pages « institutionnelle », « produit », « catégorie » le sont par les rôles qui les composent (intro/équipe, détail, catégories/produits), pas par une page entière dédiée.
Comparaison avec 22.1 : l'audit 22.1 ne fournit pas de scénarios de référence exécutables ; aucune comparaison chiffrée n'a été faite.
Non exécuté : suite complète, Firefox/Safari, lecteur d'écran, appareils réels, test de charge, lint/typecheck/build (inexistants pour ce code ; `node --check`).
