# KOLAKISA — Palier 2 : résumé des changements et procédure de déploiement / retour arrière

Branche `site-manager` (fusionnée avec `origin/main` sans conflit : aucun fichier modifié des deux côtés ; le travail des autres sessions est intact). Rien n'est poussé ni déployé tant que le déploiement n'est pas explicitement autorisé.

## Ce qui part en ligne (différence avec `main` = 24 fichiers)
| Domaine | Changement | Fichiers principaux |
|---|---|---|
| Contexte et droits | contexte de site vérifié à chaque requête ; déplacement de page exige les droits sur la destination ; composants propres à un site non utilisables ailleurs ; déplacement sans lien résiduel | `services/siteContext.js`, `web/index.js`, `web/landing.js`, `pages/index.js` |
| Base de données | **migration 071** : 7 déclencheurs (aucune donnée touchée) | `migrations/071_isolation_des_sites.sql` |
| Domaines | domaine inconnu = **421** ; site archivé / supprimé = 404 ; le domaine d'un site ne sert plus le blog / formations / catalogue du site principal ; hôtes normalisés ; `HOTES_AUTORISES` ; journal « Hôte refusé » | `middlewares/siteHost.js`, `services/urls.js`, `server.js` |
| Audit | écran Centre de gestion → Sauvegardes → « Audit des sites » (lecture seule, nombres uniquement) + scripts | `services/auditSites.js`, `routes/gestion.js`, `views/gestion/*`, `scripts/*` |
| Tests | ~65 nouveaux tests ; 4 tests existants mis à jour (règle des domaines, test instable du worker) | `tests/*` |

## Avant le déploiement (vous)
1. Confirmer dans le panneau Hostinger que `SITE_URL` vaut `https://kolakisa.com` (sans le modifier). Déduit du site public, non lu.
2. Vérifier qu'aucun autre nom (domaine provisoire de l'hébergeur) n'est utilisé pour consulter l'application ; sinon l'ajouter dans `HOTES_AUTORISES`.
3. Faire une sauvegarde : Mon espace → Centre de gestion → Sauvegardes → « Sauvegarder maintenant », puis la télécharger.

## Pendant / juste après (contrôles de fumée)
Accueil `https://kolakisa.com/` · `https://kolakisa.com/sante` · connexion · Mon espace · Centre de gestion → Sauvegardes → « Audit des sites » (résultat à me transmettre) · Site Web → Mes sites · le journal du serveur ne doit contenir aucune ligne « Hôte refusé (421) » pour kolakisa.com. La migration 071 crée d'elle-même une sauvegarde « Avant mise à jour » (visible dans la liste des sauvegardes).

## Retour arrière
- **Code** : annuler par un commit d'annulation (`git revert` du commit de fusion), jamais en réécrivant l'historique de `main` ; Hostinger redéploie l'ancienne version. À demander à l'assistant.
- **Migration 071** : les 7 déclencheurs peuvent rester (inoffensifs pour l'ancien code, ils n'empêchent que des associations entre sites différents) ; la suppression propre est décrite dans `KOLAKISA_PALIER_2_ISOLATION.md` §11.
- **Données** : aucune donnée n'est modifiée par ce déploiement. Une restauration de la base est possible depuis la sauvegarde « Avant mise à jour » ou celle que vous aurez téléchargée.
- **Domaine refusé par erreur (421)** : ajouter l'hôte à `HOTES_AUTORISES` (variable Hostinger, à saisir par vous), le journal indique l'hôte exact à ajouter.

## Risques restants
Articles, catégories, médias, formulaires, modèles de pages et SEO non isolés par site (Palier 3) ; contacts et consentements inchangés ; hôte transmis par le proxy non vérifiable d'ici ; audit de la base de production à faire dans l'interface après déploiement ; la fusion avec le travail des autres sessions n'a pas été exécutée dans un navigateur réel (tests Chrome fournis par ces sessions inclus dans la suite complète si Chrome est présent).

## Résultats des tests (commit de fusion 225c859 + ce document)
Suite complète `npm test` : **4898 tests, 4893 réussis, 2 échecs (le même test, compté avec son fichier), 0 annulé, 3 ignorés**, + 11 tests « non exécutables sur cette machine » (jsdom, sharp, Chrome absents) comptés réussis sans rien vérifier.
Les 2 échecs : `tests/automatisations-palette-navigateur.test.js` (« Plusieurs chemins ») — le navigateur Chrome du test est resté figé environ 30 minutes (0 % de processeur) pendant que la machine était saturée par d'autres sessions ; j'ai dû interrompre ce fichier (« 1 904 746 ms »). Relancé seul sur le même code : **15 tests sur 15 réussis**. Ce n'est pas lié au palier (éditeur d'automatisations, aucun fichier commun), mais la suite complète n'a donc pas été verte d'un seul tenant.
