# CMS KOLAKISA — Email Engine (palier 16)

## Audit de départ
Le module Marketing contenait déjà un moteur d'e-mailing complet (jalons « parité Mailchimp », documents `EMAIL_MARKETING_*.md`) :
audiences (`mk_lists` + `mk_list_members`), segments dynamiques (ET / OU / NON), campagnes (statuts draft → scheduled → sending → paused → sent / cancelled / failed, programmation, pause, reprise, annulation, duplication, tests A/B), modèles avec versions et éditeur de blocs,
variables validées, aperçu avec contact réel et envoi de test, file de travaux et worker (`mk_jobs`), envoi par fournisseur (SMTP, Resend ; « console » par défaut = rien ne part),
suivi des clics (jamais de redirection ouverte, destination lue en base) et des ouvertures (marquées indicatives), désinscription en un clic signée, centre de préférences, rebonds et plaintes par webhooks signés et idempotents,
liste de suppression, domaines d'envoi avec vérification DNS réelle (SPF, DKIM, DMARC), double confirmation, statistiques, API publique et webhooks sortants.

**Décision : aucun second système.** Le palier 16 comble les vrais manques de ce moteur.

## Ce que le palier ajoute
| Manque constaté | Réponse |
|---|---|
| Aucune notion de **site** (tout au niveau organisation) | Migration `062_email_engine.sql` : `site_id` sur audiences, segments, modèles, campagnes ; isolation appliquée au point de passage unique (`db/repository.js`, option `siteScope`) + requêtes de liste |
| Pas d'**état d'abonnement par audience** | `audience/subscriptions.js` : états dérivés (abonné, en attente, désabonné, protégé) à partir du Contact Core, des désinscriptions et de la liste de suppression ; aucune table ni copie de contact |
| Événements d'e-mail peu exploitables par le Contact Core | `email.clicked/opened/delivered/bounced/complained` portent la campagne (objet) et le site dans le journal du contact |
| Identité d'expédition unique | Paramètres → Emailing (moteur de réglages du palier 14) : nom, adresse, réponse par site, avec contrôle du domaine ; utilisée à l'envoi |
| Import de contacts hors Contact Core | L'import CSV existant passe par `contactcore.identify` (téléphone normalisé, cycle de vie, origine) |
| Fiche : état dans chaque audience | « Listes » de la fiche contact indique l'état dans chaque audience |

## Multi-site
- `site_id NULL` = site principal / organisation (toutes les données existantes) ; un numéro = ce site.
- **Équipe de l'organisation** : voit tout, filtre par site (`?site=`), choisit le site à la création d'une audience, d'un segment ou d'un modèle. Une **campagne prend le site de son audience** (jamais un choix séparé).
- **Accès limité à un site** (`mk_site_members`) : le serveur impose `siteScope` ; liste/lecture/écriture limitées à ce site ; les ressources des autres sites ou sans site répondent 403 ; la création est forcée dans son site.
- **Cohérence** : une campagne ne cible qu'une audience ou un segment de son site ; modèle du site ou modèle sans site (partagé), jamais celui d'un autre site ; un segment de site n'atteint que les contacts de ce site (origine ou événement).
- Les contacts restent dans le Contact Core ; leur visibilité par site suit les règles du palier 15 (fiche, journal, chronologie restreints au site).

## Fournisseur, file, suivi
Fournisseur : celui de Marketing → Envoi (console / SMTP / Resend). **Par défaut « console » : rien ne part et l'interface le dit** (« Configuration d'envoi requise »). File : `mk_jobs` + worker existant (`MARKETING_WORKER=on`). Aucune clé n'apparaît dans les Paramètres du CMS.
Ouvertures : pixel facultatif, présentées comme indicatives. Clics : liens signés, destination en base. Webhooks : signature Svix, idempotence par identifiant de livraison.

## Droits (système du palier 9, sans doublon)
| Capacité demandée | Droit existant |
|---|---|
| voir / créer / modifier | `campaigns.read` / `campaigns.write` (idem `lists.*`, `segments.*`, `templates.*`) |
| envoyer, programmer, pause, annuler, reprendre | `campaigns.send` (administrateur) |
| statistiques | `analytics.read` |
| domaines | `domains.manage` |
| identité d'expédition | `settings.write` (Paramètres → Emailing) |
| export | `contacts.export` (+ `contacts.view_sensitive`) |

## Limites réelles
- Les noms d'audience, de segment, de modèle et de campagne restent **uniques par organisation** (contrainte historique) : deux sites ne peuvent pas avoir deux audiences du même nom.
- Pas de modèle partagé « en lecture » pour une personne limitée à un site : elle ne voit que les modèles de son site.
- L'état « en attente » = membre sans preuve de consentement (ajout manuel, import) ; la double confirmation en attente n'est pas distinguée.
- Le site d'origine d'un contact ne vient pas encore des formulaires publics (seulement des imports dans une audience de site et des événements portant un site).
- Pas de moteur d'automatisation, de tunnel ni d'e-commerce ici : l'Email Engine expose seulement les événements (`email.*`) et les services.
- Export d'une audience ou d'un segment : l'export CSV filtré existant (`/marketing/contacts/export.csv`) ; l'export Outils « Contacts » du palier 15 reste global.
