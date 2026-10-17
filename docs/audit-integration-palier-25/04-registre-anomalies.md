# Registre des anomalies reproduites ou découvertes (palier 25)

Les anomalies du palier 24 (G-01 à G-20) restent valables ; seules sont détaillées ici celles que les **tests d'intégration** ont reproduites ou découvertes. Aucune n'a été corrigée. **Aucune anomalie P0.** Une cause n'est dite « confirmée » que si je l'ai vérifiée.

## G-03 — REPRODUIT puis **CORRIGÉE** (P1) — La rédaction d'articles est réservée au compte créateur
- **Scénario** : INT-CMS-006 (critères « Éditeur / Auteur / Contributeur : peut créer un article », 3 échecs reproduits ; le créateur réussit, le Lecteur et le compte hors équipe sont refusés comme attendu).
- **Module / intégration** : Articles ↔ Permissions (I05).
- **Attendu** : un rôle qui a `articles.write` ou `articles.edit_own` peut créer et modifier ses articles dans l'éditeur.
- **Constaté** : `POST /formateur/blog/nouveau` → **403** pour Éditeur, Auteur et Contributeur (preuve : `resultats/resultats-scenarios.json`, scénario INT-CMS-006).
- **Reproduction** : créer un compte, l'ajouter à l'équipe avec le rôle Éditeur, envoyer le formulaire de création d'article avec l'en-tête `x-blog-editor: 1`.
- **Impact** : travail d'équipe impossible sur le blog ; la permission `articles.edit_own` est sans effet pratique.
- **Gravité** : P1. **Cause** : **confirmée au palier 24** (deux gardes successifs : `routes/pages.js` ligne 13 puis `routes/blog.js`).
- **Correctif envisagé (palier 26)** : correctif déjà prêt et validé en copie jetable : `audit-parite/patch-articles-multi-auteurs.diff`.
- **Tests de non-régression requis** : `tests/integration-globale.test.js` (INT-CMS-006 sans critère « anomalie »), `tests/cms-articles-multi-auteurs.test.js` (inclus dans le correctif), matrice de permissions.

## A25-02 — NOUVELLE, **CORRIGÉE** (P2) — L'écran d'un scénario actif ne rappelle plus que le fournisseur « console » n'envoie rien
- **Scénario** : INT-EML-011 (critère « APRÈS l'activation… » en échec ; le critère « AVANT l'activation… » réussit).
- **Module / intégration** : Automatisations ↔ Email Engine (I07/I08).
- **Attendu** : tant que le fournisseur d'envoi est « console » (aucun envoi réel), l'interface le rappelle, y compris sur un scénario actif qui contient une étape d'e-mail.
- **Constaté** : avant l'activation, l'écran affiche « Fournisseur « console » : rien ne sera réellement envoyé » ; **après l'activation, ce message disparaît**, alors que le worker enregistre les messages avec le statut « sent » (fournisseur « console ») et que le passage se termine « completed ». Rien n'est transmis à personne.
- **Reproduction** : fournisseur par défaut ; créer un modèle et un scénario avec une étape « e-mail » ; lire la page du scénario ; activer ; relire la page ; soumettre un formulaire avec consentement ; lire `mk_messages` (status `sent`, provider `console`).
- **Impact** : faux sentiment de réussite : en production, si le fournisseur n'est pas configuré, des scénarios « fonctionnent » sans qu'aucun e-mail ne parte, sans avertissement visible sur l'écran du scénario. L'écran des campagnes garde, lui, l'avertissement.
- **Gravité** : P2 (P1 si la production est effectivement en mode console : à vérifier, G-02). **Cause** : **confirmée par lecture du code** — le message est un avertissement du **contrôle avant activation** (`src/marketing/automations/service.js` ligne 210, affiché par `views/marketing/automation.ejs` ligne 46) ; une fois le scénario activé, ce panneau n'est plus affiché. Le rappel dans l'éditeur d'étape (`src/editor/automation/stepEditors.js` ligne 245) existe, mais ne figure pas sur l'écran du scénario actif.
- **Dépendances** : Email Engine, écran de scénario, worker. **Correctif envisagé** : afficher l'avertissement à tout état du scénario tant que le fournisseur est « console », et signaler dans la liste des messages qu'ils n'ont pas quitté le serveur. **Tests requis** : INT-EML-011 (critère A25-02 passant), tests de l'écran des scénarios.

## A25-03 — NOUVELLE, **CORRIGÉE** (P3) — Un lot de mesure sans date client, rejoué, est compté deux fois
- **Scénario** : INT-ANA-016 (critère « lot sans date client rejoué… » en échec : 3 lignes puis 6).
- **Module / intégration** : Mesure ↔ Analytics (I19).
- **Attendu** : un événement reçu deux fois ne compte qu'une fois.
- **Constaté** : la déduplication repose sur un index unique qui inclut l'heure de l'événement ; le **vrai script du site** (`public/js/visitor.js`) joint la date de chaque événement, donc **les navigateurs ne sont pas concernés** (critère « avec date » réussi). Une requête sans date reçoit l'heure d'arrivée et n'est pas dédupliquée.
- **Impact** : faible : seul un client non-navigateur (ou un script) peut gonfler ses propres chiffres ; l'identifiant visiteur exige déjà le cookie de consentement. **Gravité** : P3. **Cause** : confirmée par lecture (`src/marketing/visitors/index.js`, index `uq_mk_web_events_dedupe` de la migration 066).
- **Correctif envisagé** : borner le nombre d'événements identiques par visiteur et par minute, ou dériver une clé stable. **Tests requis** : INT-ANA-016.

## Observations sans anomalie (comportements à connaître)
- **O25-01** : une adresse e-mail dont la partie locale contient un accent (« Abonné@… ») est refusée avec le message clair « Adresse e-mail invalide » (400) ; aucun contact n'est créé. Limite assumée, pas un faux succès.
- **O25-02** : le pont boutique → événements **n'enregistre jamais l'historique** : une commande passée avant la pose de ses curseurs (premier démarrage du worker) ne produit aucun événement. C'est le comportement documenté ; il faut en tenir compte lors de la première activation du worker en production. Ce comportement a fait échouer mon premier essai (mon erreur de séquence, corrigée), pas le produit.
- **O25-03** : les 3 échecs de la suite relevés au palier 24 (« ombres bleu nuit », « 16 nouvelles propriétés », import de 5 000 lignes) **ne se sont pas reproduits** dans l'exécution du palier 25 (4 041 tests, 0 échec). Cause non établie (hypothèse : correctifs d'autres sessions fusionnés, ou lenteur pour l'import).

## Robustesse confirmée (aucune anomalie)
Aucun test de concurrence n'a produit de doublon : 6 webhooks de paiement simultanés → 1 commande, 1 inscription, 1 e-mail de confirmation (INT-COM-018) ; 6 envois simultanés d'un formulaire → 1 contact, 1 preuve de consentement (INT-CON-010).


## État après les corrections (2026-10-11)
- **A25-02 corrigée** : `src/marketing/web/automations.js` + `views/marketing/automation.ejs` ; INT-EML-011 passe (critère « après l'activation… » réussi).
- **A25-03 corrigée** : `src/marketing/visitors/index.js` (heure arrondie à la minute sans date client) ; INT-ANA-016 passe.
- **G-03 corrigée** (avec ton accord explicite « fais-le pour moi ») : le correctif `audit-parite/patch-articles-multi-auteurs.diff` a été appliqué ; INT-CMS-006 passe (177 critères sur 177) ; suites voisines vertes ; matrice de permissions relancée sans écart (365 routes : anonyme 365/365 vers la connexion, non-membre 365/365 refusé ; seule différence voulue : un Auteur ou un Contributeur peut créer un article).
