# Registre des anomalies P0 à P3 (palier 24)

*20 anomalies consolidées et dédupliquées (références au palier 23 : AN-xx). **Aucune P0 confirmée.** Une cause n'est dite « confirmée » que si je l'ai vérifiée dans le code ou par une mesure ; sinon c'est une « hypothèse ».*

Répartition : P1 = 4 · P2 = 12 · P3 = 4.

## G-01 — P1 — Le webhook de paiement n'est pas configuré en production

- **Module** : Commerce / Stripe
- **Résultat attendu** : Un paiement, un remboursement, un échec ou une expiration de session Stripe sont enregistrés par le webhook signé
- **Constaté / limite de vérification** : POST /stripe/webhook sans signature → 503 « Webhook non configuré » sur kolakisa.com ; la clé secrète Stripe (nécessaire pour encaisser) n'est pas lisible : paiement en production NON VALIDÉ
- **Preuves** : Sonde production lecture seule ; src/routes/stripeWebhook.js ligne 12-13
- **Fichiers concernés** : src/routes/stripeWebhook.js, src/services/payments.js, src/routes/orders.js
- **Modules affectés** : Commerce, Contact Core, Analytics, e-mail de confirmation
- **Risque de régression d'une correction** : Moyen : le flux commande est dense en tests
- **Priorité recommandée / palier** : Palier 25 (essai avec clés de TEST) puis 27 (configuration vérifiée)
- **Tests de confirmation** : Paiement de test → commande + accès + événement ; remboursement de test enregistré ; webhook répond 400 sans signature
- **Conditions préalables** : Variables Stripe (par le propriétaire, jamais par moi) ; domaine du webhook déclaré chez Stripe
- **Cause** : Cause CONFIRMÉE (variable absente côté production, déduite du 503) ; l'état de STRIPE_SECRET_KEY est inconnu

## G-02 — P1 — Les moteurs de tâche de fond dépendent d'une variable de production non vérifiable

- **Module** : Automatisations / E-mail / Pont boutique
- **Résultat attendu** : Scénarios, e-mails programmés, détection d'abandons et pont boutique → événements tournent en production
- **Constaté / limite de vérification** : Le worker et le pont ne démarrent que si MARKETING_WORKER=on ; sa valeur de production n'est pas lisible ; aucun point de santé n'indique si le worker tourne
- **Preuves** : server.js lignes 244-251 ; absence d'URL de santé (sonde : 404)
- **Fichiers concernés** : server.js, src/marketing/queue, src/marketing/bridge
- **Modules affectés** : Automatisations, Email Engine, commerce (abandons), événements
- **Risque de régression d'une correction** : Faible si on ne touche qu'à la lecture d'état
- **Priorité recommandée / palier** : Palier 25 (essai avec worker) ; palier 26 (écran d'état du worker)
- **Tests de confirmation** : Scénario d'essai exécuté en tâche de fond ; arrêt/redémarrage = reprise
- **Conditions préalables** : Accès à l'état de production par le propriétaire
- **Cause** : Hypothèse : variable absente ou présente, inconnue

## G-03 — P1 — Seul le compte créateur peut écrire des articles

- **Module** : Articles / droits
- **Résultat attendu** : Les rôles Éditeur, Auteur, Contributeur écrivent selon `articles.write` / `articles.edit_own`
- **Constaté / limite de vérification** : 403 sur l'éditeur et refus de création pour Administrateur, Éditeur, Auteur, Contributeur ; la permission `articles.edit_own` est sans effet pratique. Le correctif complet (aussi dans `src/routes/pages.js`, premier garde-fou) a été validé en copie jetable : 290 tests
- **Preuves** : Sondes palier 23 ; `audit-parite/patch-articles-multi-auteurs.diff` ; pages.js ligne 13
- **Fichiers concernés** : src/routes/blog.js, src/routes/pages.js, src/marketing/web/articles.js, views/marketing/articles.ejs
- **Modules affectés** : Droits, taxonomies, commentaires, révisions
- **Risque de régression d'une correction** : Moyen : touche aux gardes d'accès (déjà testé : 290 tests)
- **Priorité recommandée / palier** : Appliquer le correctif prêt (autorisation explicite du responsable des droits)
- **Tests de confirmation** : tests/cms-articles-multi-auteurs (5) + cms-articles mis à jour
- **Conditions préalables** : Autorisation explicite de modifier les droits d'accès
- **Cause** : Cause CONFIRMÉE : deux gardes successifs (routes/pages.js puis routes/blog.js) réservent /formateur au créateur

## G-04 — P1 — Du travail n'existe que sur ce Mac (non poussé)

- **Module** : Organisation du travail
- **Résultat attendu** : Tout le travail terminé est sur origin/main
- **Constaté / limite de vérification** : Sur 56 copies de travail : 4 branches ont des commits absents de origin/main — `espacement` (9 commits de l'éditeur : raccourcis clavier, règles et magnétisme, accordéons, double tampon, création sans rechargement), `inspecteur-editeur` (2), `cms-roles` (1, doublon connu du palier 9 poussé séparément) ; `phase-6-certificats` (2) est équivalent à main. Aucune modification non commitée (hors dossiers node_modules)
- **Preuves** : git cherry sur chaque copie ; `git worktree list`
- **Fichiers concernés** : Branches `espacement`, `inspecteur-editeur`, `cms-roles`
- **Modules affectés** : Éditeur (Page Builder)
- **Risque de régression d'une correction** : Faible (lecture) ; fusion = risque d'éditeur
- **Priorité recommandée / palier** : Avant palier 26 : décider de fusionner ou d'abandonner chaque branche
- **Tests de confirmation** : Fusion testée par la suite Chrome éditeur
- **Conditions préalables** : Décision du propriétaire sur chaque branche
- **Cause** : Cause CONFIRMÉE (travail non fusionné) ; un crash du Mac a déjà eu lieu pendant ce projet

## G-05 — P2 — Le multi-site s'arrête aux pages, tunnels, e-mails et automatisations

- **Module** : Multi-site
- **Résultat attendu** : Chaque site a ses contenus et ses données
- **Constaté / limite de vérification** : Pas de site_id sur posts, taxonomy_terms, blog_comments, mk_media, mk_contacts (origin_site_id seulement), orders, courses ; 23 tables sur 155 ont un site_id
- **Preuves** : PRAGMA table_info sur 155 tables (audit-global/resultats/tables.json)
- **Fichiers concernés** : src/config/database.js, migrations
- **Modules affectés** : Blog, médias, commerce, Contact Core
- **Risque de régression d'une correction** : Élevé (migrations sur tables existantes)
- **Priorité recommandée / palier** : Après décision D1 (palier 26 ou dédié)
- **Tests de confirmation** : Deux sites × tous les écrans ; IDOR par identifiant
- **Conditions préalables** : Décision multi-site
- **Cause** : Cause CONFIRMÉE (choix documentés)

## G-06 — P2 — Le tunnel n'a ni paiement, ni upsell, ni downsell

- **Module** : Tunnel / Commerce
- **Résultat attendu** : Un funnel complet orchestre pages, offre, paiement, upsell
- **Constaté / limite de vérification** : Étapes de paiement absentes ; la boutique est le panier des formations ; l'attribution d'achat est « dernier tunnel touché sur 30 jours »
- **Preuves** : docs/cms-tunnel.md, cms-orchestration.md, cms-commerce.md
- **Fichiers concernés** : src/marketing/funnels, src/routes/orders.js
- **Modules affectés** : Commerce, Analytics
- **Risque de régression d'une correction** : Élevé (moteur de paiement)
- **Priorité recommandée / palier** : Hors paliers 25–27 : à décider
- **Tests de confirmation** : Parcours tunnel → paiement → commande testé de bout en bout
- **Conditions préalables** : Décision de périmètre produit
- **Cause** : Cause CONFIRMÉE (non construit)

## G-07 — P2 — Systèmes parallèles à gouverner

- **Module** : Architecture
- **Résultat attendu** : Une source de vérité par responsabilité
- **Constaté / limite de vérification** : Deux journaux d'audit (`audit_log`, `mk_audit_logs`) ; deux stockages de médias (`media`, `mk_media`) ; sept tables de suivi (`mk_events`, `mk_web_events`, `mk_landing_events`, `mk_message_events`, `mk_page_test_events`, `mk_sms_clicks`, `mk_web_visitors`) ; deux A/B (pages, e-mails) ; deux styles de site ; réglages dans 8 stockages ; e-mails transactionnels (`mail_outbox`) et marketing (`mk_jobs`/Email Engine) séparés ; 5 éditeurs (Page Builder, article, e-mail, canevas d'automatisation, formation)
- **Preuves** : Liste des tables ; docs de chaque palier
- **Fichiers concernés** : Voir 05-sources-de-verite.md
- **Modules affectés** : Tous
- **Risque de régression d'une correction** : Moyen à élevé selon le doublon
- **Priorité recommandée / palier** : Palier 26 : décision par doublon (ne rien fusionner sans accord)
- **Tests de confirmation** : Tests de chaque module concerné avant/après
- **Conditions préalables** : Inventaire validé par le propriétaire
- **Cause** : Cause CONFIRMÉE (histoire du projet)

## G-08 — P2 — Aucun point de santé, aucune supervision

- **Module** : Exploitation
- **Résultat attendu** : Savoir si le site, la base, le worker et l'envoi fonctionnent
- **Constaté / limite de vérification** : Aucune URL de santé ; journalisation par `console.error` (9 appels dans server.js) ; pas de métrique ; « requêtes lentes : non mesuré »
- **Preuves** : Sonde (/health, /healthz : 404) ; server.js ; docs/cms-outils.md
- **Fichiers concernés** : server.js
- **Modules affectés** : Tous
- **Risque de régression d'une correction** : Faible
- **Priorité recommandée / palier** : Palier 26/27
- **Tests de confirmation** : Une URL de santé qui échoue si la base ou le worker sont indisponibles
- **Conditions préalables** : Aucun
- **Cause** : Cause CONFIRMÉE (absent)

## G-09 — P2 — Sauvegardes sur le même disque, restauration jamais exercée en production

- **Module** : Sauvegardes
- **Résultat attendu** : Perte du disque sans perte de données
- **Constaté / limite de vérification** : Copie quotidienne de la base (14 gardées) sur le disque du site ; téléchargement manuel base + fichiers ; script de restauration testé en test (tests/sauvegarde-restauration) mais pas en production
- **Preuves** : src/services/backups.js ; scripts/restaurer.js ; tests/sauvegarde-restauration
- **Fichiers concernés** : src/services/backups.js
- **Modules affectés** : Tout
- **Risque de régression d'une correction** : Faible (ajout)
- **Priorité recommandée / palier** : Palier 27 (critère de sortie)
- **Tests de confirmation** : Restauration complète sur un environnement de test, comptes identiques
- **Conditions préalables** : Stockage externe (décision et identifiants du propriétaire)
- **Cause** : Cause CONFIRMÉE ; sauvegardes de l'hébergeur NON VÉRIFIABLES

## G-10 — P2 — La suite principale n'est pas entièrement verte

- **Module** : Suite de tests
- **Résultat attendu** : Tous les tests passent sur main
- **Constaté / limite de vérification** : 2 échecs déjà présents sur origin/main : « les ombres sont teintées de bleu nuit » (refonte-design) et « les 16 nouvelles propriétés sont dans le registre » (proprietes-style-completes) ; 1 échec intermittent sous charge (import de 5 000 lignes) ; 2 tests Chrome échouent une fois sous charge
- **Preuves** : Suite complète du 2026-10-11 : 4 014 réussis / 4 020
- **Fichiers concernés** : tests/refonte-design.test.js, tests/proprietes-style-completes.test.js
- **Modules affectés** : Éditeur, design
- **Risque de régression d'une correction** : Faible
- **Priorité recommandée / palier** : Avant palier 27 : suite verte ou échecs acceptés par écrit
- **Tests de confirmation** : Suite complète sans échec connu
- **Conditions préalables** : Autres sessions propriétaires de ces zones
- **Cause** : Cause : hypothèse (dérive CSS et registre d'une autre session) ; lenteur pour les intermittents

## G-11 — P2 — Pas de double authentification ; protection CSRF sans jeton

- **Module** : Sécurité
- **Résultat attendu** : Comptes d'équipe protégés ; formulaires contre les requêtes forgées
- **Constaté / limite de vérification** : Pas de 2FA ; contrôle Origin/Referer seul (requête sans en-tête acceptée) ; CSP limitée à object-src/base-uri/frame-ancestors ; connexions journalisées depuis le palier 23
- **Preuves** : Sondes palier 23 ; src/middlewares/security.js
- **Fichiers concernés** : src/middlewares/security.js, src/routes/auth.js
- **Modules affectés** : Authentification
- **Risque de régression d'une correction** : Moyen (connexion de tout le monde)
- **Priorité recommandée / palier** : Palier 26
- **Tests de confirmation** : 2FA obligatoire pour les administrateurs ; POST sans en-tête refusé
- **Conditions préalables** : Décision de politique de sécurité
- **Cause** : Cause CONFIRMÉE

## G-12 — P2 — Pas de copie locale de secours

- **Module** : Page Builder
- **Résultat attendu** : Le travail non envoyé survit à une coupure
- **Constaté / limite de vérification** : Aucune copie locale dans le Page Builder (l'éditeur d'articles en a une)
- **Preuves** : docs/cms-revisions.md
- **Fichiers concernés** : public/js/marketing-editor.js
- **Modules affectés** : Éditeur
- **Risque de régression d'une correction** : Élevé (fichier édité en parallèle)
- **Priorité recommandée / palier** : Palier 26 (coordonné avec la session de l'éditeur)
- **Tests de confirmation** : Coupure réseau, rechargement, restauration
- **Conditions préalables** : Coordination avec l'autre session
- **Cause** : Cause CONFIRMÉE (documentée)

## G-13 — P2 — Aucune API de contenu ; pas d'import WordPress

- **Module** : API
- **Résultat attendu** : Intégrations externes sur le contenu
- **Constaté / limite de vérification** : L'API /api/v1 couvre contacts, événements, campagnes, listes, aperçu
- **Preuves** : src/marketing/api/router.js
- **Fichiers concernés** : src/marketing/api
- **Modules affectés** : Intégrations
- **Risque de régression d'une correction** : Faible (ajout)
- **Priorité recommandée / palier** : Hors 25–27 sauf décision
- **Tests de confirmation** : —
- **Conditions préalables** : Décision D5
- **Cause** : Cause CONFIRMÉE

## G-14 — P2 — Aucune variante d'image

- **Module** : Médiathèque
- **Résultat attendu** : Images adaptées à l'écran
- **Constaté / limite de vérification** : Fichier d'origine servi ; pas de srcset ni WebP généré
- **Preuves** : Absence de bibliothèque d'image ; media/index.js
- **Fichiers concernés** : src/marketing/media/index.js
- **Modules affectés** : Pages, articles
- **Risque de régression d'une correction** : Moyen
- **Priorité recommandée / palier** : Palier 26
- **Tests de confirmation** : Poids et vitesse mobile mesurés avant/après
- **Conditions préalables** : Choix de méthode (dépendance ou outil système)
- **Cause** : Cause CONFIRMÉE

## G-15 — P2 — Le Lecteur voit contacts, revenus et abonnés SMS

- **Module** : Contact Core / vie privée
- **Résultat attendu** : Moindre privilège
- **Constaté / limite de vérification** : Le rôle Lecteur obtient 200 sur /contacts, /revenus, /sms/abonnes… (lecture seule)
- **Preuves** : Sonde matrice palier 23
- **Fichiers concernés** : src/marketing/organizations.js, src/services/cmsAccess.js
- **Modules affectés** : Droits
- **Risque de régression d'une correction** : Moyen (toucher aux permissions)
- **Priorité recommandée / palier** : Palier 26 (après décision D3)
- **Tests de confirmation** : Matrice relancée
- **Conditions préalables** : Décision D3
- **Cause** : Cause CONFIRMÉE (conception)

## G-16 — P2 — Événements du CMS non branchés

- **Module** : Intégrations
- **Résultat attendu** : page.published, article.published, comment.* déclenchent des scénarios
- **Constaté / limite de vérification** : Non émis ou sans abonné
- **Preuves** : docs
- **Fichiers concernés** : services/comments.js, taxonomy.js, navigation.js
- **Modules affectés** : Automatisations
- **Risque de régression d'une correction** : Faible
- **Priorité recommandée / palier** : Palier 26 si utile
- **Tests de confirmation** : Un scénario réagit à une publication
- **Conditions préalables** : Décision d'usage
- **Cause** : Cause CONFIRMÉE

## G-17 — P3 — Dépendance indirecte vulnérable (source-map-js) et revue SQL non exhaustive

- **Module** : Sécurité
- **Résultat attendu** : Aucune vulnérabilité haute connue
- **Constaté / limite de vérification** : `npm audit --omit=dev` : 1 haute (déni de service par fichier de cartes source), 0 critique ; 182 gabarits SQL à fragment dynamique : aucun ne reçoit directement une donnée de requête (recherche automatique), revue manuelle non exhaustive
- **Preuves** : npm audit ; git grep
- **Fichiers concernés** : package-lock.json
- **Modules affectés** : Dépendances
- **Risque de régression d'une correction** : Faible (mise à jour mineure) mais partagée entre sessions
- **Priorité recommandée / palier** : Palier 26
- **Tests de confirmation** : npm audit sans vulnérabilité haute ; suite complète verte
- **Conditions préalables** : Coordination (node_modules partagé)
- **Cause** : Cause CONFIRMÉE

## G-18 — P3 — Limites de mesure annoncées

- **Module** : Analytics / A/B
- **Résultat attendu** : —
- **Constaté / limite de vérification** : Seuls les visiteurs ayant accepté la mesure sont comptés ; attribution « dernier contact » ; achat attribuable seulement à un visiteur suivi et relié à un contact ; A/B à deux versions
- **Preuves** : docs
- **Fichiers concernés** : —
- **Modules affectés** : —
- **Risque de régression d'une correction** : —
- **Priorité recommandée / palier** : Information
- **Tests de confirmation** : —
- **Conditions préalables** : —
- **Cause** : Cause CONFIRMÉE (limites documentées)

## G-19 — P3 — Documentation du dépôt partiellement obsolète

- **Module** : Documentation
- **Résultat attendu** : Documentation fidèle
- **Constaté / limite de vérification** : Le CLAUDE.md du dossier racine décrit un autre projet (« Nakewenze », Supabase) ; plusieurs paliers affirment « chaque case correspond à une vérification réelle » (contredit par G-03)
- **Preuves** : Lecture
- **Fichiers concernés** : CLAUDE.md, docs/cms-utilisateurs.md
- **Modules affectés** : —
- **Risque de régression d'une correction** : Aucun
- **Priorité recommandée / palier** : Palier 26
- **Tests de confirmation** : Relecture de la documentation
- **Conditions préalables** : —
- **Cause** : Cause CONFIRMÉE

## G-20 — P3 — Petites cibles tactiles, archives par date absentes, 404 générique

- **Module** : UX
- **Résultat attendu** : Confort et conformité
- **Constaté / limite de vérification** : 1 à 8 contrôles de moins de 24 px par écran ; pas d'archives par date ; page 404 générique par défaut
- **Preuves** : Sondes palier 23
- **Fichiers concernés** : —
- **Modules affectés** : —
- **Risque de régression d'une correction** : Faible
- **Priorité recommandée / palier** : Palier 26
- **Tests de confirmation** : —
- **Conditions préalables** : —
- **Cause** : Cause CONFIRMÉE
