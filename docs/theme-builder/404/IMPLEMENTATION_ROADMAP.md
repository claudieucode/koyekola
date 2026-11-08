# Feuille de route progressive — Page 404

> Chaque étape est **présentée avant** d'être réalisée, testée, puis validée par vous avant la suivante. Aucune étape n'est lancée par ce document. Aucune suppression avant l'étape 8.

| # | Étape | Contenu | Livrable | Critères de validation |
|---|---|---|---|---|
| 0 | **Validation du plan** (cette étape) | Lire les 10 documents, trancher les décisions (§ ci-dessous) | Votre accord | Décisions D1–D5 prises |
| 1 | Remise à zéro du baseline | Résoudre les 2 échecs existants liés (aperçu ≠ vignette : `data-kw-demo`) ; ne rien changer d'autre | Tests existants 404 verts | 77/77 sur la liste de tests de référence |
| 2 | Architecture du catalogue | Index par familles, métadonnées, filtre par famille et tri ; **un seul modèle pilote** ajouté en parallèle de l'ancien | Interface identique, 1 nouveau modèle | Liste, filtre, aperçu, vignette, « Utiliser », publication OK |
| 3 | Routage et statut HTTP | Tests dédiés sur URL inexistante (site principal, deux sites), redirections, mal formées, noindex ; décision A/B (cohérence des erreurs de contenu) | Batterie de tests HTTP | 404 vrai partout ; aucun 200 ; sitemap sans URL inconnue |
| 4 | Premier modèle complet | Un concept complet (composition, recherche réelle, responsive, mouvement réduit) | 1 modèle validé de bout en bout | éditeur ↔ aperçu ↔ vignette ↔ publié identiques à 4 largeurs |
| 5 | Widgets et personnalisation | Vérifier que chaque élément du premier modèle se modifie (texte, image, couleurs, ajout, suppression, duplication, déplacement) | Rapport d'édition | Toute commande affichée fonctionne |
| 6 | Aperçus et vignettes | Vignettes fidèles ; contrôle visuel automatisé | Script de rapport visuel | 0 décalage / chevauchement / texte coupé |
| 7 | Groupes de modèles | **10 groupes d'environ 10 modèles** (une à deux familles par groupe), diversité remesurée à chaque groupe | 10 jalons | seuils de diversité tenus ; tests de groupe verts ; aucun défaut critique |
| 8 | Remplacement contrôlé | Inventaire des modèles utilisés par site, sauvegarde, bascule du catalogue, retrait de l'ancienne bibliothèque | Catalogue de 100 uniquement | Aucune 404 active supprimée ; restauration testée |
| 9 | Tests globaux et non-régression | Header, footer, page individuelle, article, archive, recherche, e-commerce, Theme Builder, éditeur | Rapport complet | Tout vert ou défauts documentés |
| 10 | Documentation finale | Mise à jour des 10 documents | Dossier complet | Relecture |

## Décisions à prendre avant l'étape 2
- **D1 — Source des photos et vidéos** (famille « Photographiques », ~6 modèles + emplacements dans d'autres) : (a) images libres de droits fournies par Kolakisa et ajoutées au projet (licence à vérifier), (b) emplacements vides avec repli en dégradé, à remplir par l'utilisateur. *Recommandation : (b) pour les photos, vectoriel natif pour les illustrations.*
- **D2 — Cohérence de la 404** pour les erreurs de contenu (TARGET_ARCHITECTURE.md §4) : A ou B. *Recommandation : A, mais en étape 3, après les tests.*
- **D3 — Jeux** : accepter 3 à 4 mini-jeux écrits pour Kolakisa (sans dépendance), ou rester sur des interactions sans jeu. *Recommandation : 3 jeux simples et accessibles.*
- **D4 — Animations Lottie** : fichiers à créer (licence) ou rester sur les `motion*` natifs. *Recommandation : `motion*` et CSS, Lottie seulement avec un fichier maison.*
- **D5 — Rythme** : groupes de 10 comme proposé, ou plus petits.
