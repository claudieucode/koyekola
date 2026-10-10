# CMS KOLAKISA — Automation Engine (palier 17)

## Audit de départ
Le module Marketing contenait déjà un moteur d'automatisation complet (documents `EMAIL_MARKETING_AUTOMATIONS.md` et §26-§31 de `EMAIL_MARKETING_ARCHITECTURE.md`) :
scénarios (`mk_automations`) à 1 à 3 déclencheurs, éditeur graphique à canevas (nœuds, arêtes, zoom, déplacement, duplication, validation), registre d'actions extensible
(e-mail, SMS, attente, attendre une date, attendre un événement, condition, plusieurs chemins, tirage au sort, étiquette, liste, champ, note, score, webhook, notification d'équipe, démarrer/arrêter un scénario, fin),
passages persistants (`mk_automation_runs`, UNIQUE par scénario et contact), journal pas à pas (`mk_automation_log`), attentes = date de réveil en base + travail planifié dans la file (`mk_jobs`, jamais un processus qui dort),
réessais espacés avec plafond, pause / reprise, contenu FIGÉ à l'activation, contrôle avant activation (étapes incomplètes, orphelines, modèles, fournisseur, adresse publique), parcours prêts à l'emploi, statistiques réelles, 25 déclencheurs.
**Garde-fous de conception :** un contact n'entre qu'une fois dans un scénario ; les actions d'un scénario n'émettent AUCUN événement (aucune boucle d'événements) ; les sauts ne vont qu'en avant (aucune boucle d'étapes) ; le consentement est revérifié à chaque e-mail marketing (désinscrit ⇒ le contact sort) ; le transactionnel respecte la liste de protection.

**Décision : aucun second moteur.** Le palier 17 comble les manques réels.

## Ce que le palier ajoute
| Manque constaté | Réponse |
|---|---|
| Aucun contexte de **site** | Migration `063_automation_engine.sql` : `site_id` ; isolation au point de passage unique (`createRepository … siteScope`) ; un scénario de site n'accueille que les contacts de ce site ; une audience, un modèle ou un scénario d'un autre site est refusé à la création/modification ; `start_automation` vérifie aussi à l'exécution |
| Pas de **versions** publiées | `version` (+1 à chaque publication d'un contenu modifié), table immuable `mk_automation_versions` (instantané figé), version portée par chaque passage ; panneau « Versions publiées » |
| Pas de **simulation** | `automations/dryrun.js` : lecture seule sur un contact réel — conditions et embranchements évalués pour de vrai, consentement contrôlé, actions qui écrivent seulement annoncées, attentes comptées, aucune écriture (testé) |
| Pas d'**historique global** ni de vue par contact | `/marketing/automatisations/historique` (filtres : scénario, état, contact, dates, erreurs ; 50 par page) et panneau « Scénarios d'automatisation » sur la fiche contact (état, prochaine étape, prochaine exécution) |
| Déclencheurs du Contact Core / Email Engine absents | `user.registered`, `contact.lifecycle_changed` (filtre sur l'étape), `email.delivered`, `email.bounced`, `email.complained`, `comment.approved` — tous réellement émis |

## Correspondance avec la demande (ce qui existe, sans doublon)
| Demande | Réalité |
|---|---|
| Workflow, versions, nodes, connexions persistantes | scénario + canevas persistant + versions figées |
| Triggers / conditions / ET-OU-NON / branches | déclencheurs du catalogue ; conditions = moteur de segments (ET / OU / NON, opérateurs typés) ; « Condition », « Plusieurs chemins » |
| Attente (minutes → semaines, date, événement) | actions `wait`, `wait_until`, `wait_for_event` ; fuseau du contact / du site |
| Actions : e-mail, étiquette, audience, champ, contact | `email` (Email Engine), `add_tag`/`remove_tag`, `add_to_list`/`remove_from_list`, `update_field`… ; **création de contact par un scénario : volontairement absente** (un scénario réagit à un contact existant) |
| Exécution, étapes tracées, erreurs, réessais | passages + journal ; réessais espacés (4 essais), échecs visibles ; file de travaux existante (pas de seconde file) |
| Idempotence | passage unique par (scénario, contact) + clé d'idempotence des événements et des travaux |
| Cycles / limites | aucun saut arrière, aucune action ne réémet d'événement ; plafond quotidien d'e-mails par contact (marketing) |
| Pause ≠ annulation, désactivation | pause garde les passages ; la reprise les relance |
| Permissions | `automations.read` (voir), `automations.write` (créer, modifier, supprimer, simuler + `contacts.read`), `automations.activate` (publier, pause, reprise : administrateur) |
| Mode test | **simulation en lecture seule** ; un essai réel contrôlé sur un seul contact n'existe pas |

## Limites réelles
- Pas d'essai réel contrôlé (envoi effectif à un contact de test) : seule la simulation existe.
- Pas de « dead letter » dédiée : un passage en échec reste visible (état « en échec » / erreur) et rejouable depuis la file existante.
- Les noms de scénarios restent uniques par organisation.
- Plafond d'envoi par contact : le plafond quotidien existant ; pas de « cooldown » entre scénarios ni de plafond d'exécutions par contact (architecture prête, non appliquée).
- Les événements CMS `article.published`, `page.published` ne sont pas émis aujourd'hui : non proposés comme déclencheurs. Checkout, achats, remboursements, paniers abandonnés : seuls les événements déjà émis par la boutique de formations (`lms.*`) existent ; rien n'est inventé pour un futur e-commerce.
- Le Workflow Builder est l'éditeur de canevas existant (pas de mini-carte).
