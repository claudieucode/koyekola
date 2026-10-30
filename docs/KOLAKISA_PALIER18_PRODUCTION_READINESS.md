# KOLAKISA — Palier 18 : préparation à la production

Évaluation par critère. Un élément sans preuve n'est pas marqué validé. Légende : **OK** (preuve) · **RÉSERVES** (preuve partielle ou défaut mineur documenté) · **NON VÉRIFIÉ** · **ABSENT**.

| Critère | Statut | Preuve / constat |
|---|---|---|
| Sécurité — dépendances | OK | `npm audit --omit=dev` : 0 vulnérabilité après correctifs (6 avant) |
| Sécurité — secrets | OK | Aucun secret réel dans les fichiers suivis (recherche de motifs) ; masquage testé (`journal-service`, `sante-du-site`) |
| Sécurité — autorisations côté serveur | OK | `palier18-isolation.test.js` (accès directs, identifiants falsifiés, écritures croisées) + suites de droits par site |
| Sécurité — en-têtes, CSP, entrées malveillantes | OK (tests) | `securite-*`, `audit-corrections` (CSP, échappement) ; pas de test d'intrusion externe |
| Isolation entre sites | OK | `portee-des-routes` (milliers de combinaisons), `admin-multisite`, `palier18-isolation`, inventaire des tables classé |
| Fonctions fondamentales | OK (tests) | 6 660 tests, 99,5 % de réussite avant corrections (6 625 sur 6 660) ; 175 fichiers pilotent un vrai Chrome |
| Fiabilité | RÉSERVES | 1 test instable trouvé et corrigé à la source ; 10 échecs préexistants documentés (voir défauts restants) ; l'effacement de données (e-mail non parti) reste à reproduire à la main |
| Tests automatisés | RÉSERVES | Suite complète exécutable (≈ 2 h en 4 tranches parallèles) ; **aucune intégration continue active** (facturation GitHub) |
| Lint, typage, compilation de production | ABSENT | Aucun outil dans le projet |
| Base de données — schéma et migrations | OK | Migration 115 additive ; ordre imposé par le lanceur ; mise à niveau 113→115 testée ; clés étrangères toutes indexées (D3) |
| Base de données — migration R9 | OK (tests) | Comptage sous verrou ; application et retour arrière testés sur bases jetables. La **recette sur la production reste à faire** (lanceur SSH : 4 tests en échec, voir défaut 2) |
| Sauvegarde et restauration | OK (tests) | `sauvegarde-restauration.test.js` : copie `VACUUM INTO`, `integrity_check`, archive des fichiers. Restauration **sur la production** non éprouvée |
| Performance | RÉSERVES | gzip actif ; `style.css` 223 Ko → 45 Ko gzip ; scripts d'éditeurs 770–920 Ko avant compression. Aucune mesure temporelle comparative dans cette passe (`scripts/audit-performance.js` non lancé) |
| Responsive | RÉSERVES | 120 écrans × 3 largeurs : 0 débordement de page ; 1 élément hors cadre (16 px) et 46 petites cibles tactiles |
| Accessibilité | NON VÉRIFIÉ (WCAG complet) | Tests partiels (focus, libellés, contrastes statiques) ; un test de contraste de dégradé en échec à qualifier |
| Intégrations externes | NON VÉRIFIÉ | Paiement, SMTP, Search Console / GA4, réseaux sociaux, SMS : testés avec doublures locales uniquement |
| Observabilité | RÉSERVES | Journal d'activité, journal des 404 SEO, « Santé du site » (informations techniques, copie sans secret). Pas de supervision externe vérifiée |
| Déploiement et retour arrière | NON VÉRIFIÉ | Hostinger déploie depuis GitHub ; aucun accès ici pour confirmer un déploiement ou un retour arrière. Retour arrière applicatif = `git revert` ; retour arrière migration 115 = suppression de 2 index |

## État final proposé : **VALIDÉ AVEC RÉSERVES**
Raisons : aucun défaut P0 ni P1 ; isolation et sécurité démontrées par des tests directs ; dépendances à 0 vulnérabilité ; corrections livrées avec tests. Réserves : 10 échecs de tests préexistants non corrigés, aucune intégration continue active, déploiement et intégrations externes non vérifiés, absence de lint/typage.
Ce n'est **pas** un feu vert de mise en production : les points « NON VÉRIFIÉ » doivent être traités au Palier 19.

## Points à traiter au Palier 19
1. Rétablir l'intégration continue (facturation GitHub), puis vérifier que « Tests » passe.
2. Vérifier le déploiement Hostinger de ces commits et la migration 115 en production.
3. Reproduire à la main le défaut « e-mail non parti » des demandes d'effacement ; corriger.
4. Rendre les tests du lanceur SSH indépendants de l'environnement ; faire la recette R9 sur une copie de production.
5. Trancher les options d'éditeur en conflit avec la charte (ombres franches, dégradé violet) et qualifier le contraste du dégradé « sand ».
6. Corriger le dépassement de 16 px de l'éditeur d'articles à 390 px et les petites cibles tactiles.
7. Styler ou retirer les ≈ 95 classes orphelines (après la fin du Funnel Studio de l'autre session).
8. Lancer `scripts/audit-performance.js` avant/après toute optimisation ; envisager de scinder les plus gros scripts d'éditeur.
9. Ajouter lint et contrôle de syntaxe à la CI.
10. Tester avec de vrais services : SMTP, paiement, Search Console / GA4, réseaux sociaux, SMS.
11. Tester la perte réseau et un très grand document dans l'éditeur ; faire un audit d'accessibilité complet.
