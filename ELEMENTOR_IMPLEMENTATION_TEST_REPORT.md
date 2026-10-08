# Rapport de tests — intégration des capacités Elementor (8 octobre 2026)

## Résultat global
Suite complète du projet (`npm test`, avec Chrome piloté par Playwright) sur la branche finale, après fusion du `main` du jour :

```
Tests : 3227   Réussis : 3227   Échecs : 0   Ignorés : 0
```
Régressions détectées : **0** (la suite complète comprend les 17 + 17 tests des règles / magnétisme, les tests de l'éditeur, du
blog, du site, de l'inspecteur, des effets, du design et du SEO existants). Un premier passage avait relevé 2 échecs, tous deux expliqués et
traités : (1) deux classes CSS sans définition ajoutées par erreur (`kw-postcontent-empty`, `field-label`) — corrigées ;
(2) `seo-jobs`, qui dépend du fichier `.env` absent du dossier de travail isolé — passe avec ce fichier (copie non versionnée, retirée ensuite).

## Tests ajoutés par cette mission (25)
| Fichier | Tests | Ce qui est prouvé |
|---|---|---|
| `tests/editeur-dynamique.test.js` | 11 | sources (article, formation, « produit », visiteur, page, site, date, adresse) ; filtres ; échappement HTML ; revalidation des adresses et images après résolution (`javascript:` refusé) ; étiquette seule acceptée dans une adresse / image, mélange refusé, jamais dans les styles ; réglages de boucle bornés ; boucle réelle (articles : nombre, pagination, recherche `?q=`, catégorie, tri, titres échappés, image dangereuse non écrite, brouillons jamais montrés ; formations : prix, tri, lien compté correct d'une page à l'autre) ; étiquettes hors boucle et conservation dans le document ; filtre par catégorie ; conditions d'affichage ; points d'extension |
| `tests/editeur-dynamique-navigateur.test.js` | 4 | (Chrome réel) activer la boucle depuis l'inspecteur, réglages enregistrés, un exemplaire par article dans le canevas, sélecteur de données, titres résolus, écriture directe refusée sur un contenu dynamique, page publiée sans étiquette ni outil d'édition |
| `tests/editeur-classes-globales.test.js` | 2 | noms réservés / doublons / limites / styles validés ; classe enregistrée dans le site → appliquée à tous les éléments qui la portent, pas aux autres ; style propre prioritaire (ordre des règles) ; mise à jour en un enregistrement |
| `tests/editeur-classes-navigateur.test.js` | 3 | (Chrome réel) créer une classe depuis un élément, l'appliquer à un autre, mettre à jour : les deux suivent, supprimer |
| `tests/editeur-modeles-theme.test.js` | 5 | modèle d'article (données, texte de l'article, sommaire / commentaires / SEO conservés) ; page non publiée sans effet ; retrait → affichage d'origine ; catégorie et public ; le plus précis gagne ; doublon refusé ; liste du blog avec catégorie ; page 404 (statut conservé) ; écran d'administration ; page modèle supprimée |

## Non-régression (familles demandées)
Canevas, widgets, conteneurs, Flexbox, Grille, Structure, glisser-déposer, sélection, responsive, zoom, sauvegarde, aperçu,
publication, éditeur en blocs : couverts par les fichiers `editeur-*`, `page-builder-*`, `site-web-*`, `inspecteur-*`, `effets-*`
(479 tests de ce sous-ensemble relancés à part, tous réussis, avant la fusion finale) puis par la suite complète (3227).

## Ce qui n'est PAS testé automatiquement
- Aucun audit visuel automatisé des nouveaux panneaux (sélecteur de données, classes globales, écran des modèles) : contrôlés
  par les scénarios Chrome ci-dessus (présence, clics, enregistrement), pas par capture d'écran comparée.
- Charge : pas de test de performance dédié sur de grosses boucles (24 éléments au plus par page de résultats ; recherches limitées à 500 éléments).
- Déploiement en ligne : non vérifiable depuis cette session (voir le compte rendu).
