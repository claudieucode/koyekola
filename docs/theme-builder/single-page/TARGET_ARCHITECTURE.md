# Architecture cible Page individuelle

**Aucun nouveau moteur.** Mêmes briques : catalogue en code, kit, grammaire fermée, `render.js`, conditions, Page Builder.

## Décision d'architecture n° 1 — cadre ou page complète
| Option | Description | Avantage | Risque |
|---|---|---|---|
| **A (recommandée)** | Le modèle est un **cadre riche** : ouverture propre à l'usage, bandes de modèle autour du `postcontent`, colonnes latérales, conclusion ; le corps de la page reste dans la page | Respecte le moteur actuel et les pages existantes ; zéro doublon avec la bibliothèque de pages complètes | Une « page d'accueil » reste partiellement à saisir dans la page |
| B | Le modèle est une page complète (toutes les sections dedans) ; `postcontent` devient une petite zone | Rendu immédiat proche d'un site fini | Duplique la bibliothèque de pages complètes ; écrase la logique « une page = son contenu » ; contraire à la règle « pas de deuxième système » |
Les 100 concepts du plan sont écrits pour l'option A : chacun a une ouverture, des bandes et une conclusion propres à son usage.

## Décision n° 2 — construction des modèles
Un fichier par modèle (ou par famille, un modèle par fonction `L(...)`), jamais d'assemblage de pièces communes. Un petit nombre d'assistants partagés (titre, corps, consigne) reste permis comme pour les articles ; la structure (grilles, ordre, widgets) est écrite pour chaque modèle.

## Décision n° 3 — champs personnalisés de page
Option 1 (recommandée pour l'instant) : ne rien créer ; les modèles utilisent les données du site (`biz*`) et le contenu de la page. Option 2 : ajouter un stockage de champs par page (colonne JSON) et une étiquette `{{page.field.<nom>}}`. À ne faire que sur demande : migration de base de données.

## Ajouts techniques prévus (un par étape, après validation)
1. Audit statique `scripts/audit-page-individuelle.js` (100 exacts, similarité ≤ 0,70, un H1 + un `postcontent`, aucune donnée inventée, grilles repliées, aucun absolu) — **n'existe pas aujourd'hui**.
2. Sélecteur « Aperçu avec » (page réelle) pour le type `single_page`.
3. Test de profil de diversité à 14 champs.
4. Nouvelles mises en page `single_page/` (dossier par famille), l'ancien fichier restant en place jusqu'à la bascule.

## Données et sauvegarde
Aucune nouvelle table pour A. Retour arrière = commit précédent ; les pages et modèles des sites sont des copies indépendantes et ne sont pas touchés.
