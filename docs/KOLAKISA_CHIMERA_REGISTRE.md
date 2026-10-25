# CHIMERA — registre des défauts et point de reprise (25 oct. 2026)

Base : `origin/main` ; suite complète lancée (554 fichiers) : 6040 tests, 5974 réussis, 47 échecs, 16 annulés.

## Corrigé et vérifié (lot 1)
- Index manquants sur des clés étrangères (`mk_admin_notes`, `cms_privacy_requests`) → migration 108 (test D3 `audit-corrections`).
- `contenus-par-site-unitaire` : liste de migrations figée en dur (s'arrêtait à 091) → 16 tests d'isolation par site étaient annulés ; attendu désormais dérivé du dossier.
- Inventaire des tables : `mk_import_sources`, `mk_importer_state`, `mk_user_profiles` classées.
- `marketing-r0-coque` : « sitedash » masqué volontairement ; `cms-users` : la liste des pages d'un site est sous `/sites/:id/pages`.
- Ombres noires `rgba(0,0,0,…)` dans `landing.css` teintées bleu nuit (règle de la refonte).

## Ouvert (non corrigé)
- `refonte-design` « aucune classe orpheline » : ~50 classes sans style (certaines faux positifs du scan de scripts : `typeof`, `tab`, `ok`…).
- `marketing-rss` (5 tests) : `bridge/catalog.js listPosts` avale toute exception (`catch { return [] }`) ; le test utilise une base distincte de la base globale que lit `permalinks` (`mk_organizations` absente) → liste vide silencieuse. Corriger : ne rattraper que « no such table: posts », et fournir l'organisation du contexte à `permalinks.postPath`.
- Échecs de la suite complète non reproduits isolément (délais de démarrage du serveur de test) : à relancer par fichier.
- Autres échecs de la suite non analysés : `registre et menu`, `accès par site`, `performance`, `éditeur du site : écrans`, `export vers les Outils`, `lanceur SSH v2`.

## Lot 2 et 3 (même jour)
Seconde exécution complète sur `origin/main` : 6088 tests, 6048 réussis, 19 échecs, 18 annulés (contre 47 / 16 au départ). Les échecs restants se répartissent ainsi :
- Corrigés ensuite et revérifiés fichier par fichier : liste RSS (permaliens tolérants, `listPosts` ne masque plus les erreurs), apparence (logo), fiche d'un site, export des contacts, menu Apparence, colonnes de profil, widget Menu (référence régénérée), textes admin sous 0,72 rem (`cms.css`), flèche du tri des catégories (`dashboard.css`), bibliothèque apprenant, registre du menu, borne de migration (109), BOM du CSV.
- Environnement : `r9-lancer-recette-prod` (branche locale `r8-recette-outil` absente) ; `effacer-donnees` « e-mail non parti » (la file d'envoi tente un vrai envoi dans ce bac à sable et remet la ligne en attente) ; fichiers qui échouent seulement sous charge (API publique, performance) et passent seuls.
- Ouvert : test des classes CSS orphelines (`refonte-design`, `refonte-design-v3` Lot D selon les cas).
Les bornes de migration figées dans quelques tests (`site-espace`, `site-menu-p1a`) cassent à chaque nouvelle migration : à remplacer par une règle dérivée du dossier.
