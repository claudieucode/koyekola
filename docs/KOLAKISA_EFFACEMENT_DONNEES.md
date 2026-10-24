# KOLAKISA CMS — Outils → Effacer les données

Écran : **Outils → Effacer les données** (`/marketing/site-web/outils/effacer-donnees`, ou « Effacer les données » dans le cadre d'un site). Référence : l'écran WordPress « Effacer les données » (Outils).

## 1. Audit avant la mission

| Fonction | État | Constat |
|---|---|---|
| Guide de politique de confidentialité (`services/privacy`) | Opérationnel | Modules déclaratifs (formulaires, commentaires, comptes…) pour **rédiger** la politique. **Aucun** effacement. Réutilisé : même dossier, même principe de modules enregistrables. |
| Suppression de compte (`services/account.js`) | Opérationnel | Anonymise le compte (commandes conservées, comptabilité), efface notes, avis, commentaires, favoris, préférences ; efface le contact marketing. **Conservé tel quel** : l'effacement de données n'est pas une suppression de compte. |
| Effacement d'un contact marketing (`audience.deleteContact`) | Opérationnel | Efface la fiche, consentements, envois, fichiers de formulaires, retire l'adresse des événements. **Réutilisé** par le traitement « Contact marketing » (aucune seconde suppression écrite). |
| Export des données d'un compte (`account.exportData`) | Opérationnel | Export côté personne ; hors de cet écran. |
| Moteur de réglages, permissions, journal d'activité, file d'e-mails (`outbox`), protection CSRF | Opérationnels | Réutilisés (permissions ajoutées au catalogue existant, journal `audit_log`, `queueMail`, `sameOriginOnly`). |
| Demandes d'effacement, confirmation par lien, états, traitement par lots, reprise | **Absents** | Créés par cette mission. |

## 2. Cycle de vie

```
en attente ──(lien confirmé par la personne)──► confirmée ──(traitement réussi)──► terminée
     │                                              │
     └──(expirée · e-mail non envoyé)──► échouée ◄──(une catégorie échoue)
échouée ──(renvoi)──► en attente · échouée « effacement incomplet » ──(reprise)──► confirmée
```

- **Création** : identifiant (nom d'utilisateur d'un compte) **ou** adresse e-mail, validés côté client et serveur. Avec la case cochée : jeton aléatoire de 256 bits, **seul son SHA-256 est stocké**, valable **48 h**, usage unique, e-mail en file avec lien `…/effacement/confirmer/<n°>.<jeton>`. Décochée : demande « Confirmée » par l'administrateur (aucun e-mail).
- **Confirmation** : le lien (GET) n'affiche qu'un bouton (un aperçu de messagerie ne confirme rien) ; le POST confirme, une seule fois. Jeton comparé à temps constant ; lié à la demande **et au site** (un lien d'un site ne fonctionne pas sur l'adresse d'un autre). **La confirmation n'efface rien.**
- **Aucun effacement au clic de création.** Pour effacer : récapitulatif réel (comptages par catégorie, ce qui sera conservé et pourquoi, ce qui reste manuel), case « J'ai relu » **et** saisie du mot `EFFACER`.
- **Forcer** (demande non confirmée par la personne) : permission distincte `privacy.force` (propriétaire), mêmes confirmations, trace d'audit.
- **Terminée** seulement si **toutes** les catégories sont terminées sans erreur ; sinon « Échouée — effacement incomplet », avec la liste des catégories en échec. L'e-mail de l'administrateur qui a créé la demande l'avertit.
- **Marquer comme terminée** (demande traitée par un autre moyen) : n'efface rien, la trace le dit.
- **Supprimer de la liste** : ne touche à aucune donnée personnelle, refusé pour une demande en cours de traitement.
- Transitions autorisées dans `erasureRequests.TRANSITIONS` ; chaque action vérifie l'éligibilité côté serveur.

## 3. Moteur central (`services/privacy/erasure.js`)

Un traitement = un fichier dans `services/privacy/erasers/` : `id`, `title`, `description`, `categories`, `scope` (`main` ou `any`), `preview()` (comptages réels sans écrire), `run()` (un **lot** à la fois). Un module ajoute le sien sans toucher au cœur.

- **Lots** : taille 200 (réglable par `KOLA_ERASURE_BATCH`), un lot + sa ligne de tâche dans **une transaction** ; une interruption laisse un état cohérent.
- **Reprise** : les tâches et leur curseur sont en base ; un verrou de 60 s empêche deux traitements simultanés ; un verrou périmé se reprend ; les catégories terminées ne sont **jamais** refaites (« Reprendre » ne relance que celles en échec).
- **Idempotence** : chaque traitement relit ce qui reste (un commentaire déjà anonymisé ne correspond plus).
- **Progression réelle** : catégories terminées sur total, éléments effacés et anonymisés enregistrés. L'interface appelle `traiter` lot après lot sans bloquer le navigateur.

### Catégories couvertes (uniquement celles que Kolakisa gère vraiment)

| Traitement | Portée | Effacé | Anonymisé | Conservé (raison) |
|---|---|---|---|---|
| Profil du compte | site principal | demandes de réinitialisation de mot de passe | bio, photo, fuseau horaire | nom d'utilisateur, e-mail, mot de passe, rôle (le **compte n'est pas supprimé**) ; comptes de gestion : action manuelle |
| Formations | site principal | notes, avis, favoris, préférences, position de lecture | — | commandes (obligation comptable), inscriptions/progression/quiz, certificats |
| Commentaires | site de la demande | texte (option « supprimer le texte ») | auteur : compte, nom, e-mail, empreinte d'adresse | texte (contribution publique) par défaut |
| Messages et e-mails | site principal | messages du formulaire de contact, e-mails de la file envoyés à la personne | — | — |
| Contact marketing | site de la demande | fiche, consentements, envois, formulaires et fichiers (via `audience.deleteContact`) | adresse retirée des événements | liste de suppression (désinscriptions) ; fiche partagée entre sites : action manuelle |

Aucun effacement par partage de nom ou d'adresse de relation : la correspondance se fait sur le compte et l'adresse **exacte** de la personne.

### Hors du périmètre de Kolakisa (toujours affiché, jamais présenté comme effacé)
Sauvegardes et archives ; fournisseur d'envoi d'e-mails et journaux de l'hébergeur ; outils d'analyse, paiement et services tiers.

## 4. Multi-site
- Une demande appartient à **un site** ; tout est revérifié sur **le site de la demande** (permissions, traitement, jeton, actions groupées), jamais sur celui de l'URL.
- Un site ne traite que ses commentaires et ses fiches (une fiche rattachée à plusieurs sites n'est jamais effacée par l'un d'eux) ; les catégories de la plateforme (comptes, messages) se traitent depuis le site principal et sont listées « non traitées » pour un site.
- Modèles d'e-mails communs à l'organisation (équipe seulement). Les nouveaux sites en bénéficient automatiquement (une seule implémentation).

## 5. Sécurité et audit
Permissions `privacy.view`, `privacy.request`, `privacy.erase` (administrateur) et `privacy.force` (propriétaire) · CSRF (`sameOriginOnly`) · double soumission refusée · limitation des essais sur la page publique (429) · jetons hachés, à usage unique, expirables · journal d'activité (`tools.erasure_*`) **sans adresse complète ni jeton** (forme masquée `j***@domaine`) · adresse retirée de la demande dès qu'elle est terminée · erreurs sans donnée personnelle · **rétention** : demandes terminées ou échouées retirées de la liste après 365 jours.

## 6. Limites connues
- Pas de formulaire public « demander l'effacement de mes données » : la demande est créée par un administrateur.
- Pas de suppression des données dans les sauvegardes ni chez les services tiers (affiché comme action manuelle).
- Les modèles d'e-mails existent en français et en anglais (langue du site) ; d'autres langues demandent d'ajouter un jeu de textes.
- Le jeton expire après 48 h (WordPress : 24 h) ; relançable.
- L'e-mail « effacement terminé » n'est envoyé que si la case d'envoi était cochée.

## 7. Fichiers
`src/marketing/migrations/102_effacement_donnees.sql` · `src/services/privacy/erasure.js`, `erasureRequests.js`, `erasers/*` · `src/marketing/web/erasure.js` (monté par `tools.js`) · `src/routes/erasure.js` (confirmation publique) · `views/marketing/tools-erasure*.ejs`, `views/erasure-confirm.ejs` · `public/js/cms-effacement.js`, `public/css/kola-pages.css` · permissions dans `cmsAccess.js` et `organizations.js` · test `tests/effacer-donnees.test.js`.
