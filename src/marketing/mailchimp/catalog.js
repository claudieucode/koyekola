// CATALOGUE des opérations de l'API Mailchimp Marketing v3 exposées par Kolakisa. Source UNIQUE pour : les routes internes (routes.js), la validation (identifiants, paramètres de requête,
// champs obligatoires, confirmation des actions destructrices) et la documentation générée (scripts/mailchimp-doc.js → docs/mailchimp/MAILCHIMP_DOC.md).
// Chaque entrée : id stable · méthode · chemin Mailchimp (avec {jetons}) · route interne (avec :jetons) · résumé · cas d'usage · priorité · paramètres de requête autorisés · champs obligatoires du corps.
// `confirm: true` = action irréversible ou à effet visible (envoi, suppression) : refusée sans confirmation explicite.
const PAGE = ["count", "offset", "fields", "exclude_fields"];
const FIELDS = ["fields", "exclude_fields"];
const OPS = [];
function add(group, id, method, mc, route, summary, usage, priority, extra = {}) {
  OPS.push({ group, id, method, mc, route, summary, usage, priority, query: [], required: [], confirm: false, ...extra });
}
const C = "CRITIQUE", I = "IMPORTANT", O = "OPTIONNEL";

// ---------- AUDIENCES ----------
const G1 = "Audiences";
add(G1, "audiences.list", "GET", "/lists", "/audiences", "Lister toutes les audiences", "Écran « Audiences » : nom, effectif, taux d'ouverture et de clic de chaque audience.", C, { query: [...PAGE, "before_date_created", "since_date_created", "email", "sort_field", "sort_dir"],
  example: { request: "GET /marketing/mailchimp/api/audiences?count=10", response: { ok: true, data: { lists: [{ id: "a1b2c3d4e5", name: "Newsletter", stats: { member_count: 1250, unsubscribe_count: 31, open_rate: 0.42, click_rate: 0.07 } }], total_items: 1 } } } });
add(G1, "audiences.get", "GET", "/lists/{listId}", "/audiences/:listId", "Détail d'une audience", "Fiche d'audience : coordonnées légales, rappel d'autorisation, statistiques.", C, { query: FIELDS });
add(G1, "audiences.create", "POST", "/lists", "/audiences", "Créer une audience", "Créer l'audience qui recevra les inscrits d'un site Kolakisa.", C, {
  required: ["name", "contact", "permission_reminder", "campaign_defaults", "email_type_option"],
  example: { request: { name: "Newsletter Kolakisa", contact: { company: "Ma société", address1: "1 rue de la Paix", city: "Paris", state: "IDF", zip: "75001", country: "FR" }, permission_reminder: "Vous recevez ce message car vous vous êtes inscrit sur notre site.", campaign_defaults: { from_name: "Ma société", from_email: "contact@example.com", subject: "Actualités", language: "fr" }, email_type_option: false }, response: { id: "a1b2c3d4e5", name: "Newsletter Kolakisa", stats: { member_count: 0 } } } });
add(G1, "audiences.update", "PATCH", "/lists/{listId}", "/audiences/:listId", "Modifier une audience", "Changer le nom, l'expéditeur par défaut ou activer la double confirmation (double_optin).", C, {});
add(G1, "audiences.delete", "DELETE", "/lists/{listId}", "/audiences/:listId", "Supprimer une audience", "Retirer une audience devenue inutile (irréversible chez Mailchimp : tous ses membres disparaissent).", I, { confirm: true });
add(G1, "audiences.growth", "GET", "/lists/{listId}/growth-history", "/audiences/:listId/croissance", "Historique de croissance mensuel", "Graphique d'évolution des abonnés (existing, imports, optins).", C, { query: [...PAGE, "sort_field", "sort_dir"] });
add(G1, "audiences.activity", "GET", "/lists/{listId}/activity", "/audiences/:listId/activite", "Activité quotidienne récente (jusqu'à 180 jours)", "Courbe des 30 derniers jours : inscriptions, désinscriptions, e-mails envoyés.", I, { query: PAGE });
add(G1, "audiences.locations", "GET", "/lists/{listId}/locations", "/audiences/:listId/localisations", "Répartition géographique des abonnés", "Carte des pays d'où viennent les abonnés.", O, { query: PAGE });
add(G1, "audiences.clients", "GET", "/lists/{listId}/clients", "/audiences/:listId/clients", "Clients de messagerie utilisés", "Répartition par application de messagerie (Gmail, Apple Mail…) : la seule vue « appareils » exposée par l'API.", O, { query: FIELDS });
add(G1, "audiences.abuse", "GET", "/lists/{listId}/abuse-reports", "/audiences/:listId/plaintes", "Plaintes (signalements d'abus) de l'audience", "Surveiller la réputation d'expéditeur.", I, { query: PAGE });
add(G1, "audiences.batchSubscribe", "POST", "/lists/{listId}", "/audiences/:listId/lot", "Ajouter / mettre à jour des contacts en masse", "Import CSV (jusqu'à 500 contacts par appel).", C, { required: ["members"],
  example: { request: { members: [{ email_address: "ana@example.com", status: "subscribed", merge_fields: { FNAME: "Ana" } }], update_existing: true }, response: { new_members: [], updated_members: [{ id: "…", email_address: "ana@example.com", status: "subscribed" }], total_created: 0, total_updated: 1, error_count: 0, errors: [] } } });
add(G1, "audiences.signupForms", "GET", "/lists/{listId}/signup-forms", "/audiences/:listId/formulaires", "Formulaires d'inscription hébergés", "Récupérer les formulaires d'inscription d'une audience.", I, {});
add(G1, "audiences.signupFormCustomize", "POST", "/lists/{listId}/signup-forms", "/audiences/:listId/formulaires", "Personnaliser le formulaire d'inscription", "Modifier l'en-tête, le contenu et les styles du formulaire hébergé.", O, {});
add(G1, "mergefields.list", "GET", "/lists/{listId}/merge-fields", "/audiences/:listId/champs", "Lister les champs personnalisés (merge fields)", "Faire correspondre les propriétés de contact Kolakisa aux champs Mailchimp.", C, { query: [...PAGE, "type", "required"] });
add(G1, "mergefields.get", "GET", "/lists/{listId}/merge-fields/{mergeId}", "/audiences/:listId/champs/:mergeId", "Détail d'un champ", "Afficher le type et les options d'un champ.", I, { query: FIELDS });
add(G1, "mergefields.create", "POST", "/lists/{listId}/merge-fields", "/audiences/:listId/champs", "Créer un champ", "Ajouter un champ (texte, nombre, date, adresse…).", I, { required: ["name", "type"], example: { request: { name: "Ville", type: "text", tag: "VILLE", required: false }, response: { merge_id: 5, tag: "VILLE", name: "Ville", type: "text" } } });
add(G1, "mergefields.update", "PATCH", "/lists/{listId}/merge-fields/{mergeId}", "/audiences/:listId/champs/:mergeId", "Modifier un champ", "Renommer ou changer les options d'un champ.", O, {});
add(G1, "mergefields.delete", "DELETE", "/lists/{listId}/merge-fields/{mergeId}", "/audiences/:listId/champs/:mergeId", "Supprimer un champ", "Retirer un champ inutilisé (les valeurs sont perdues).", O, { confirm: true });
add(G1, "interestCategories.list", "GET", "/lists/{listId}/interest-categories", "/audiences/:listId/groupes", "Lister les groupes d'intérêts", "Centre de préférences : catégories proposées aux abonnés.", I, { query: [...PAGE, "type"] });
add(G1, "interestCategories.create", "POST", "/lists/{listId}/interest-categories", "/audiences/:listId/groupes", "Créer un groupe d'intérêts", "Ajouter une catégorie (cases à cocher, menu, boutons radio).", O, { required: ["title", "type"] });
add(G1, "interestCategories.update", "PATCH", "/lists/{listId}/interest-categories/{categoryId}", "/audiences/:listId/groupes/:categoryId", "Modifier un groupe d'intérêts", "Renommer ou réordonner.", O, {});
add(G1, "interestCategories.delete", "DELETE", "/lists/{listId}/interest-categories/{categoryId}", "/audiences/:listId/groupes/:categoryId", "Supprimer un groupe d'intérêts", "Retirer une catégorie obsolète.", O, { confirm: true });
add(G1, "interests.list", "GET", "/lists/{listId}/interest-categories/{categoryId}/interests", "/audiences/:listId/groupes/:categoryId/interets", "Lister les intérêts d'un groupe", "Options choisies par les abonnés.", I, { query: PAGE });
add(G1, "interests.create", "POST", "/lists/{listId}/interest-categories/{categoryId}/interests", "/audiences/:listId/groupes/:categoryId/interets", "Créer un intérêt", "Ajouter une option.", O, { required: ["name"] });
add(G1, "interests.update", "PATCH", "/lists/{listId}/interest-categories/{categoryId}/interests/{interestId}", "/audiences/:listId/groupes/:categoryId/interets/:interestId", "Modifier un intérêt", "Renommer une option.", O, {});
add(G1, "interests.delete", "DELETE", "/lists/{listId}/interest-categories/{categoryId}/interests/{interestId}", "/audiences/:listId/groupes/:categoryId/interets/:interestId", "Supprimer un intérêt", "Retirer une option.", O, { confirm: true });
add(G1, "segments.list", "GET", "/lists/{listId}/segments", "/audiences/:listId/segments", "Lister les segments (et les tags statiques)", "Cibler une campagne sur un segment.", C, { query: [...PAGE, "type", "since_created_at", "before_created_at"] });
add(G1, "segments.get", "GET", "/lists/{listId}/segments/{segmentId}", "/audiences/:listId/segments/:segmentId", "Détail d'un segment", "Conditions et effectif.", I, { query: FIELDS });
add(G1, "segments.create", "POST", "/lists/{listId}/segments", "/audiences/:listId/segments", "Créer un segment", "Segment dynamique (options.conditions) ou statique (static_segment = e-mails).", I, { required: ["name"], example: { request: { name: "Clients Paris", options: { match: "all", conditions: [{ condition_type: "TextMerge", field: "VILLE", op: "is", value: "Paris" }] } }, response: { id: 112233, name: "Clients Paris", type: "saved", member_count: 87 } } });
add(G1, "segments.update", "PATCH", "/lists/{listId}/segments/{segmentId}", "/audiences/:listId/segments/:segmentId", "Modifier un segment", "Changer les conditions ou le nom.", I, {});
add(G1, "segments.delete", "DELETE", "/lists/{listId}/segments/{segmentId}", "/audiences/:listId/segments/:segmentId", "Supprimer un segment", "Retirer un segment (les membres restent dans l'audience).", I, { confirm: true });
add(G1, "segments.members", "GET", "/lists/{listId}/segments/{segmentId}/members", "/audiences/:listId/segments/:segmentId/membres", "Membres d'un segment", "Voir qui sera ciblé.", I, { query: [...PAGE, "include_cleaned", "include_transactional", "include_unsubscribed"] });
add(G1, "segments.batch", "POST", "/lists/{listId}/segments/{segmentId}", "/audiences/:listId/segments/:segmentId/lot", "Ajouter / retirer des membres d'un segment statique en lot", "Tagguer en masse (members_to_add / members_to_remove, 500 maximum).", I, {});
add(G1, "segments.addMember", "POST", "/lists/{listId}/segments/{segmentId}/members", "/audiences/:listId/segments/:segmentId/membres", "Ajouter un membre à un segment statique", "Ajouter un contact à un tag.", I, { required: ["email_address"] });
add(G1, "segments.removeMember", "DELETE", "/lists/{listId}/segments/{segmentId}/members/{hash}", "/audiences/:listId/segments/:segmentId/membres/:hash", "Retirer un membre d'un segment statique", "Retirer un contact d'un tag.", I, {});
add(G1, "tags.search", "GET", "/lists/{listId}/tag-search", "/audiences/:listId/tags", "Lister / rechercher les tags d'une audience", "Filtres par tag dans l'écran Contacts.", C, { query: ["name"] });

// ---------- CONTACTS ----------
const G2 = "Contacts (membres)";
add(G2, "members.list", "GET", "/lists/{listId}/members", "/audiences/:listId/membres", "Lister les contacts d'une audience (filtres par statut)", "Tableau des contacts : subscribed, unsubscribed, cleaned, pending, transactional, archived.", C, {
  query: [...PAGE, "email_type", "status", "since_timestamp_opt", "before_timestamp_opt", "since_last_changed", "before_last_changed", "unique_email_id", "vip_only", "interest_category_id", "interest_ids", "interest_match", "sort_field", "sort_dir", "since_last_campaign", "unsubscribed_since"],
  example: { request: "GET /marketing/mailchimp/api/audiences/a1b2c3d4e5/membres?status=subscribed&count=50", response: { ok: true, data: { members: [{ id: "f3b…", email_address: "ana@example.com", status: "subscribed", merge_fields: { FNAME: "Ana", LNAME: "Diallo" }, tags: [{ id: 1, name: "client" }] }], total_items: 1 } } } });
add(G2, "members.get", "GET", "/lists/{listId}/members/{hash}", "/audiences/:listId/membres/:hash", "Détail d'un contact (l'adresse e-mail ou son empreinte MD5 sont acceptées)", "Fiche contact ; vérifier si une adresse existe (404 = absente).", C, { query: FIELDS });
add(G2, "members.add", "POST", "/lists/{listId}/members", "/audiences/:listId/membres", "Ajouter un contact (abonnement)", "Inscrire un visiteur : status « subscribed » (ou « pending » pour la double confirmation).", C, { required: ["email_address", "status"],
  example: { request: { email_address: "ana@example.com", status: "subscribed", merge_fields: { FNAME: "Ana" }, tags: ["site"] }, response: { id: "f3b…", email_address: "ana@example.com", status: "subscribed" } } });
add(G2, "members.upsert", "PUT", "/lists/{listId}/members/{hash}", "/audiences/:listId/membres/:hash", "Ajouter ou mettre à jour (upsert)", "Synchronisation idempotente d'un contact (status_if_new pour un nouveau).", C, { required: ["email_address"] });
add(G2, "members.update", "PATCH", "/lists/{listId}/members/{hash}", "/audiences/:listId/membres/:hash", "Mettre à jour un contact / désabonner", "Changer le nom, les champs ou le statut (« unsubscribed » pour désabonner).", C, { example: { request: { status: "unsubscribed" }, response: { email_address: "ana@example.com", status: "unsubscribed" } } });
add(G2, "members.archive", "DELETE", "/lists/{listId}/members/{hash}", "/audiences/:listId/membres/:hash", "Archiver un contact", "Retirer un contact de l'audience sans le détruire (réversible par réabonnement).", I, { confirm: true });
add(G2, "members.deletePermanent", "POST", "/lists/{listId}/members/{hash}/actions/delete-permanent", "/audiences/:listId/membres/:hash/suppression-definitive", "Supprimer définitivement un contact", "Droit à l'effacement (RGPD) : irréversible, l'adresse ne pourra plus être réimportée.", I, { confirm: true });
add(G2, "members.activity", "GET", "/lists/{listId}/members/{hash}/activity-feed", "/audiences/:listId/membres/:hash/activite", "Historique d'activité d'un contact", "Fiche contact : ouvertures, clics, désabonnement.", C, { query: [...PAGE, "activity_filters"] });
add(G2, "members.tags", "GET", "/lists/{listId}/members/{hash}/tags", "/audiences/:listId/membres/:hash/tags", "Tags d'un contact", "Afficher les tags.", C, { query: PAGE });
add(G2, "members.tagsUpdate", "POST", "/lists/{listId}/members/{hash}/tags", "/audiences/:listId/membres/:hash/tags", "Ajouter / retirer des tags d'un contact", "{tags:[{name,status:'active'|'inactive'}]}.", C, { required: ["tags"], example: { request: { tags: [{ name: "client", status: "active" }, { name: "prospect", status: "inactive" }] }, response: null } });
add(G2, "members.notes", "GET", "/lists/{listId}/members/{hash}/notes", "/audiences/:listId/membres/:hash/notes", "Notes d'un contact", "Historique de contact.", O, { query: PAGE });
add(G2, "members.noteAdd", "POST", "/lists/{listId}/members/{hash}/notes", "/audiences/:listId/membres/:hash/notes", "Ajouter une note", "Consigner un échange.", O, { required: ["note"] });
add(G2, "members.goals", "GET", "/lists/{listId}/members/{hash}/goals", "/audiences/:listId/membres/:hash/objectifs", "Objectifs atteints par un contact", "Suivi des conversions.", O, { query: FIELDS });
add(G2, "members.events", "GET", "/lists/{listId}/members/{hash}/events", "/audiences/:listId/membres/:hash/evenements", "Événements personnalisés d'un contact", "Historique d'événements envoyés à Mailchimp.", O, { query: PAGE });
add(G2, "members.eventAdd", "POST", "/lists/{listId}/members/{hash}/events", "/audiences/:listId/membres/:hash/evenements", "Enregistrer un événement personnalisé", "Alimenter les automatisations (achat, inscription à une formation).", I, { required: ["name"] });

// ---------- CAMPAGNES ----------
const G3 = "Campagnes";
add(G3, "campaigns.list", "GET", "/campaigns", "/campagnes", "Lister les campagnes (filtres : statut, type, dates)", "Écran « Campagnes ».", C, { query: [...PAGE, "type", "status", "before_send_time", "since_send_time", "before_create_time", "since_create_time", "list_id", "folder_id", "member_id", "sort_field", "sort_dir"] });
add(G3, "campaigns.get", "GET", "/campaigns/{campaignId}", "/campagnes/:campaignId", "Détail d'une campagne", "Résumé, paramètres, destinataires.", C, { query: FIELDS });
add(G3, "campaigns.create", "POST", "/campaigns", "/campagnes", "Créer une campagne (regular, plaintext, rss, variate)", "Assistant de création. Type « variate » = test A/B ; « rss » exige rss_opts.", C, { required: ["type"],
  example: { request: { type: "regular", recipients: { list_id: "a1b2c3d4e5" }, settings: { subject_line: "Nos nouveautés", title: "Newsletter novembre", from_name: "Ma société", reply_to: "contact@example.com" } }, response: { id: "9f8e7d6c5b", type: "regular", status: "save", settings: { subject_line: "Nos nouveautés" } } } });
add(G3, "campaigns.update", "PATCH", "/campaigns/{campaignId}", "/campagnes/:campaignId", "Modifier une campagne", "Changer l'objet, l'expéditeur, le segment.", C, {});
add(G3, "campaigns.delete", "DELETE", "/campaigns/{campaignId}", "/campagnes/:campaignId", "Supprimer une campagne", "Supprimer un brouillon (impossible pour une campagne envoyée).", C, { confirm: true });
add(G3, "campaigns.replicate", "POST", "/campaigns/{campaignId}/actions/replicate", "/campagnes/:campaignId/dupliquer", "Dupliquer une campagne", "Repartir d'une campagne existante.", I, {});
add(G3, "campaigns.sendChecklist", "GET", "/campaigns/{campaignId}/send-checklist", "/campagnes/:campaignId/verification", "Liste de contrôle avant envoi", "Bloquer l'envoi tant que la liste n'est pas « is_ready ».", C, { query: FIELDS });
add(G3, "campaigns.send", "POST", "/campaigns/{campaignId}/actions/send", "/campagnes/:campaignId/envoyer", "Envoyer immédiatement", "Envoi réel à toute l'audience ciblée : irréversible.", C, { confirm: true });
add(G3, "campaigns.schedule", "POST", "/campaigns/{campaignId}/actions/schedule", "/campagnes/:campaignId/planifier", "Planifier l'envoi", "schedule_time en UTC, minutes multiples de 15 ; timewarp et batch_delivery selon l'offre.", C, { required: ["schedule_time"], confirm: true, example: { request: { schedule_time: "2026-11-05T09:00:00+00:00", confirm: true }, response: null } });
add(G3, "campaigns.unschedule", "POST", "/campaigns/{campaignId}/actions/unschedule", "/campagnes/:campaignId/deplanifier", "Annuler un envoi planifié", "Repasser la campagne en brouillon.", C, {});
add(G3, "campaigns.test", "POST", "/campaigns/{campaignId}/actions/test", "/campagnes/:campaignId/test", "Envoyer un e-mail de test", "Valider le rendu (test_emails : 5 adresses maximum).", C, { required: ["test_emails", "send_type"], example: { request: { test_emails: ["moi@example.com"], send_type: "html" }, response: null } });
add(G3, "campaigns.pause", "POST", "/campaigns/{campaignId}/actions/pause", "/campagnes/:campaignId/pause", "Mettre en pause une campagne RSS", "Suspendre l'envoi automatique d'un flux RSS.", I, {});
add(G3, "campaigns.resume", "POST", "/campaigns/{campaignId}/actions/resume", "/campagnes/:campaignId/reprendre", "Reprendre une campagne RSS", "Relancer l'envoi automatique.", I, {});
add(G3, "campaigns.cancelSend", "POST", "/campaigns/{campaignId}/actions/cancel-send", "/campagnes/:campaignId/annuler-envoi", "Interrompre un envoi en cours", "Réservé aux comptes payants ; les e-mails déjà partis ne sont pas rappelés.", O, { confirm: true });
add(G3, "campaigns.createResend", "POST", "/campaigns/{campaignId}/actions/create-resend", "/campagnes/:campaignId/renvoi", "Créer un renvoi aux non-ouvreurs", "Relancer ceux qui n'ont pas ouvert.", O, {});
add(G3, "campaigns.contentGet", "GET", "/campaigns/{campaignId}/content", "/campagnes/:campaignId/contenu", "Lire le contenu (HTML et texte)", "Prévisualiser / éditer.", C, { query: FIELDS });
add(G3, "campaigns.contentSet", "PUT", "/campaigns/{campaignId}/content", "/campagnes/:campaignId/contenu", "Définir le contenu (html, plain_text, template, url)", "Éditeur HTML de l'assistant (étape 4).", C, { example: { request: { html: "<h1>Bonjour *|FNAME|*</h1><p>Notre actualité…</p><p><a href=\"*|UNSUB|*\">Se désabonner</a></p>" }, response: { html: "<h1>Bonjour *|FNAME|*</h1>…", plain_text: "…" } } });
add(G3, "campaigns.feedback", "GET", "/campaigns/{campaignId}/feedback", "/campagnes/:campaignId/commentaires", "Commentaires de relecture", "Collaboration interne.", O, { query: PAGE });
add(G3, "campaignFolders.list", "GET", "/campaign-folders", "/dossiers-campagnes", "Lister les dossiers de campagnes", "Classer les campagnes.", O, { query: PAGE });

// ---------- MODÈLES ----------
const G4 = "Modèles (templates)";
add(G4, "templates.list", "GET", "/templates", "/modeles", "Lister les modèles (personnalisés + Mailchimp)", "Galerie de modèles : type « user », « base » ou « gallery ».", C, { query: [...PAGE, "created_by", "since_date_created", "before_date_created", "type", "category", "folder_id", "sort_field"] });
add(G4, "templates.get", "GET", "/templates/{templateId}", "/modeles/:templateId", "Détail d'un modèle", "Nom, type, miniature.", C, { query: FIELDS });
add(G4, "templates.create", "POST", "/templates", "/modeles", "Créer un modèle HTML personnalisé", "Publier un modèle de la bibliothèque Kolakisa dans Mailchimp (HTML inline, 1 Mo maximum).", C, { required: ["name", "html"], example: { request: { name: "Newsletter simple", html: "<html><body><h1>*|MC:SUBJECT|*</h1><div mc:edit=\"corps\">Contenu</div></body></html>" }, response: { id: 10045, name: "Newsletter simple", type: "user", active: true } } });
add(G4, "templates.update", "PATCH", "/templates/{templateId}", "/modeles/:templateId", "Modifier un modèle", "Changer le nom ou le HTML.", C, {});
add(G4, "templates.delete", "DELETE", "/templates/{templateId}", "/modeles/:templateId", "Supprimer un modèle", "Retirer un modèle personnalisé.", C, { confirm: true });
add(G4, "templates.defaultContent", "GET", "/templates/{templateId}/default-content", "/modeles/:templateId/sections", "Sections modifiables d'un modèle et leur contenu par défaut", "Lire les zones `mc:edit` d'un modèle (l'API ne renvoie PAS le HTML complet d'un modèle : Kolakisa conserve lui-même le HTML des modèles qu'il crée, voir /modeles/:id/html).", I, { query: FIELDS });

// ---------- AUTOMATISATIONS ----------
const G5 = "Automatisations";
add(G5, "automations.list", "GET", "/automations", "/automatisations", "Lister les automatisations classiques", "Écran « Automatisations ».", C, { query: [...PAGE, "before_create_time", "since_create_time", "before_start_time", "since_start_time", "status"] });
add(G5, "automations.get", "GET", "/automations/{automationId}", "/automatisations/:automationId", "Détail d'une automatisation", "Statut, déclencheur, effectif.", C, { query: FIELDS });
add(G5, "automations.create", "POST", "/automations", "/automatisations", "Créer une automatisation classique", "Séquence de bienvenue (trigger_settings.workflow_type, recipients.list_id).", I, { required: ["recipients", "trigger_settings"] });
add(G5, "automations.start", "POST", "/automations/{automationId}/actions/start-all-emails", "/automatisations/:automationId/demarrer", "Démarrer tous les e-mails", "Activer l'automatisation.", C, { confirm: true });
add(G5, "automations.pause", "POST", "/automations/{automationId}/actions/pause-all-emails", "/automatisations/:automationId/arreter", "Arrêter (mettre en pause) tous les e-mails", "Suspendre l'automatisation.", C, {});
add(G5, "automations.archive", "POST", "/automations/{automationId}/actions/archive", "/automatisations/:automationId/archiver", "Archiver une automatisation", "Retirer définitivement de la liste active.", O, { confirm: true });
add(G5, "automations.emails", "GET", "/automations/{automationId}/emails", "/automatisations/:automationId/emails", "E-mails d'une automatisation", "Étapes de la séquence.", C, { query: FIELDS });
add(G5, "automations.email", "GET", "/automations/{automationId}/emails/{emailId}", "/automatisations/:automationId/emails/:emailId", "Détail d'un e-mail d'automatisation", "Délai, objet, statut.", I, { query: FIELDS });
add(G5, "automations.emailStart", "POST", "/automations/{automationId}/emails/{emailId}/actions/start", "/automatisations/:automationId/emails/:emailId/demarrer", "Démarrer un e-mail", "Activer une étape.", I, { confirm: true });
add(G5, "automations.emailPause", "POST", "/automations/{automationId}/emails/{emailId}/actions/pause", "/automatisations/:automationId/emails/:emailId/arreter", "Mettre un e-mail en pause", "Suspendre une étape.", I, {});
add(G5, "automations.queue", "GET", "/automations/{automationId}/emails/{emailId}/queue", "/automatisations/:automationId/emails/:emailId/file", "File d'attente d'un e-mail", "Voir qui recevra l'e-mail.", C, { query: FIELDS });
add(G5, "automations.queueAdd", "POST", "/automations/{automationId}/emails/{emailId}/queue", "/automatisations/:automationId/emails/:emailId/file", "Ajouter un contact à l'automatisation (file de l'e-mail)", "Inscrire manuellement un contact.", C, { required: ["email_address"], example: { request: { email_address: "ana@example.com" }, response: { id: "…", email_address: "ana@example.com", list_id: "a1b2c3d4e5" } } });
add(G5, "automations.queueGet", "GET", "/automations/{automationId}/emails/{emailId}/queue/{hash}", "/automatisations/:automationId/emails/:emailId/file/:hash", "Un contact dans la file", "Vérifier l'inscription d'un contact.", O, { query: FIELDS });
add(G5, "automations.removed", "GET", "/automations/{automationId}/removed-subscribers", "/automatisations/:automationId/retires", "Contacts retirés de l'automatisation", "Historique des retraits.", I, { query: FIELDS });
add(G5, "automations.removeSubscriber", "POST", "/automations/{automationId}/removed-subscribers", "/automatisations/:automationId/retires", "Retirer un contact de l'automatisation", "Arrêter la séquence pour un contact (définitif pour cette automatisation).", C, { required: ["email_address"], confirm: true });
add(G5, "journeys.trigger", "POST", "/customer-journeys/journeys/{journeyId}/steps/{stepId}/actions/trigger", "/parcours/:journeyId/etapes/:stepId/declencher", "Déclencher une étape de parcours client (Customer Journeys)", "Faire entrer un contact dans un parcours via une étape « API ».", I, { required: ["email_address"] });

// ---------- RAPPORTS ----------
const G6 = "Rapports et analytics";
add(G6, "reports.list", "GET", "/reports", "/rapports", "Rapports de toutes les campagnes envoyées", "Dashboard analytics global.", C, { query: [...PAGE, "type", "before_send_time", "since_send_time"] });
add(G6, "reports.get", "GET", "/reports/{campaignId}", "/rapports/:campaignId", "Rapport global d'une campagne (ouvertures, clics, rebonds, désabonnements, revenus)", "Résumé de campagne.", C, { query: FIELDS,
  example: { request: "GET /marketing/mailchimp/api/rapports/9f8e7d6c5b", response: { ok: true, data: { id: "9f8e7d6c5b", emails_sent: 1250, opens: { opens_total: 880, unique_opens: 520, open_rate: 0.416 }, clicks: { clicks_total: 140, unique_clicks: 96, click_rate: 0.077 }, bounces: { hard_bounces: 4, soft_bounces: 9 }, unsubscribed: 6, ecommerce: { total_revenue: 1840.5 } } } } });
add(G6, "reports.opens", "GET", "/reports/{campaignId}/open-details", "/rapports/:campaignId/ouvertures", "Qui a ouvert, et quand", "Tableau des ouvertures par contact.", C, { query: [...PAGE, "since"] });
add(G6, "reports.clicks", "GET", "/reports/{campaignId}/click-details", "/rapports/:campaignId/clics", "Liens cliqués et nombre de clics", "Tableau des clics par lien.", C, { query: PAGE });
add(G6, "reports.clickMembers", "GET", "/reports/{campaignId}/click-details/{linkId}/members", "/rapports/:campaignId/clics/:linkId/membres", "Qui a cliqué sur un lien", "Détail par lien.", I, { query: PAGE });
add(G6, "reports.emailActivity", "GET", "/reports/{campaignId}/email-activity", "/rapports/:campaignId/activite", "Activité par destinataire (ouvertures, clics, rebonds)", "Base des rapports de rebonds.", C, { query: [...PAGE, "since"] });
add(G6, "reports.sentTo", "GET", "/reports/{campaignId}/sent-to", "/rapports/:campaignId/destinataires", "Destinataires et statut de livraison", "Savoir à qui la campagne a été envoyée.", I, { query: PAGE });
add(G6, "reports.unsubscribed", "GET", "/reports/{campaignId}/unsubscribed", "/rapports/:campaignId/desabonnements", "Désabonnements causés par la campagne", "Rapport des désabonnements.", C, { query: PAGE });
add(G6, "reports.abuse", "GET", "/reports/{campaignId}/abuse-reports", "/rapports/:campaignId/plaintes", "Signalements d'abus", "Suivre les plaintes.", I, { query: PAGE });
add(G6, "reports.domains", "GET", "/reports/{campaignId}/domain-performance", "/rapports/:campaignId/domaines", "Performance par domaine de messagerie", "Comparer gmail.com, orange.fr…", I, { query: FIELDS });
add(G6, "reports.locations", "GET", "/reports/{campaignId}/locations", "/rapports/:campaignId/localisations", "Localisation géographique des ouvertures", "Carte par pays.", O, { query: PAGE });
add(G6, "reports.eepurl", "GET", "/reports/{campaignId}/eepurl", "/rapports/:campaignId/eepurl", "Activité des liens raccourcis EepURL", "Suivi des partages sociaux.", O, { query: FIELDS });
add(G6, "reports.advice", "GET", "/reports/{campaignId}/advice", "/rapports/:campaignId/conseils", "Conseils de performance", "Recommandations de Mailchimp.", O, { query: FIELDS });
add(G6, "reports.productActivity", "GET", "/reports/{campaignId}/ecommerce-product-activity", "/rapports/:campaignId/produits", "Revenus par produit", "Rapport de revenus e-commerce d'une campagne.", I, { query: PAGE });
add(G6, "reports.subReports", "GET", "/reports/{campaignId}/sub-reports", "/rapports/:campaignId/sous-rapports", "Sous-rapports (test A/B, variantes)", "Comparer les variantes d'un test A/B.", I, { query: FIELDS });

// ---------- LANDING PAGES ----------
const G7 = "Pages de destination (landing pages)";
add(G7, "landingPages.list", "GET", "/landing-pages", "/pages", "Lister les landing pages", "Écran « Pages ».", I, { query: ["sort_dir", "sort_field", "count", "fields", "exclude_fields"] });
add(G7, "landingPages.get", "GET", "/landing-pages/{pageId}", "/pages/:pageId", "Détail d'une landing page", "Statut, URL publique.", I, { query: FIELDS });
add(G7, "landingPages.create", "POST", "/landing-pages", "/pages", "Créer une landing page", "name, title, type « signup » ou « product » (store_id).", I, { required: ["type"], query: ["use_default_list"] });
add(G7, "landingPages.update", "PATCH", "/landing-pages/{pageId}", "/pages/:pageId", "Modifier une landing page", "Titre, nom, contenu.", I, { query: ["use_default_list"] });
add(G7, "landingPages.delete", "DELETE", "/landing-pages/{pageId}", "/pages/:pageId", "Supprimer une landing page", "Retirer une page.", I, { confirm: true });
add(G7, "landingPages.publish", "POST", "/landing-pages/{pageId}/actions/publish", "/pages/:pageId/publier", "Publier", "Mettre la page en ligne.", I, { confirm: true });
add(G7, "landingPages.unpublish", "POST", "/landing-pages/{pageId}/actions/unpublish", "/pages/:pageId/depublier", "Dépublier", "Retirer la page de la ligne.", I, {});
add(G7, "landingPages.content", "GET", "/landing-pages/{pageId}/content", "/pages/:pageId/contenu", "Contenu d'une landing page", "Aperçu.", O, { query: FIELDS });
add(G7, "landingPages.reports", "GET", "/reporting/landing-pages", "/pages-rapports", "Rapports de toutes les landing pages", "Visites et inscriptions.", O, { query: PAGE });
add(G7, "landingPages.report", "GET", "/reporting/landing-pages/{pageId}", "/pages/:pageId/rapport", "Rapport d'une landing page", "Visites, désabonnements, conversions.", I, { query: FIELDS });

// ---------- WEBHOOKS ----------
const G8 = "Webhooks";
add(G8, "webhooks.list", "GET", "/lists/{listId}/webhooks", "/audiences/:listId/webhooks", "Lister les webhooks d'une audience", "Centre de webhooks.", C, { query: FIELDS });
add(G8, "webhooks.get", "GET", "/lists/{listId}/webhooks/{webhookId}", "/audiences/:listId/webhooks/:webhookId", "Détail d'un webhook", "Événements et sources.", I, { query: FIELDS });
add(G8, "webhooks.create", "POST", "/lists/{listId}/webhooks", "/audiences/:listId/webhooks", "Créer un webhook (url, events, sources)", "Événements : subscribe, unsubscribe, profile, cleaned, upemail, campaign.", C, { required: ["url"], example: { request: { url: "https://exemple.fr/webhooks/mailchimp/1/<jeton>", events: { subscribe: true, unsubscribe: true, profile: true, cleaned: true, upemail: true, campaign: true }, sources: { user: true, admin: true, api: false } }, response: { id: "ab12cd34", url: "https://exemple.fr/webhooks/mailchimp/1/<jeton>", events: { subscribe: true }, sources: { user: true } } } });
add(G8, "webhooks.update", "PATCH", "/lists/{listId}/webhooks/{webhookId}", "/audiences/:listId/webhooks/:webhookId", "Modifier un webhook", "Changer les événements ou l'adresse.", I, {});
add(G8, "webhooks.delete", "DELETE", "/lists/{listId}/webhooks/{webhookId}", "/audiences/:listId/webhooks/:webhookId", "Supprimer un webhook", "Retirer un webhook.", C, { confirm: true });

// ---------- E-COMMERCE ----------
const G9 = "E-commerce (boutiques Mailchimp)";
add(G9, "stores.list", "GET", "/ecommerce/stores", "/boutiques", "Lister les boutiques", "Relier une boutique à une audience.", I, { query: PAGE });
add(G9, "stores.get", "GET", "/ecommerce/stores/{storeId}", "/boutiques/:storeId", "Détail d'une boutique", "Devise, audience, synchronisation.", I, { query: FIELDS });
add(G9, "stores.create", "POST", "/ecommerce/stores", "/boutiques", "Créer une boutique", "id, list_id, name, currency_code obligatoires.", I, { required: ["id", "list_id", "name", "currency_code"], example: { request: { id: "kolakisa-boutique", list_id: "a1b2c3d4e5", name: "Boutique Kolakisa", currency_code: "EUR" }, response: { id: "kolakisa-boutique", name: "Boutique Kolakisa", currency_code: "EUR" } } });
add(G9, "stores.update", "PATCH", "/ecommerce/stores/{storeId}", "/boutiques/:storeId", "Modifier une boutique", "Nom, domaine, devise.", O, {});
add(G9, "stores.delete", "DELETE", "/ecommerce/stores/{storeId}", "/boutiques/:storeId", "Supprimer une boutique", "Efface produits, commandes et clients de la boutique chez Mailchimp.", O, { confirm: true });
add(G9, "products.list", "GET", "/ecommerce/stores/{storeId}/products", "/boutiques/:storeId/produits", "Lister les produits", "Catalogue.", I, { query: PAGE });
add(G9, "products.get", "GET", "/ecommerce/stores/{storeId}/products/{productId}", "/boutiques/:storeId/produits/:productId", "Détail d'un produit", "Variantes et prix.", I, { query: FIELDS });
add(G9, "products.create", "POST", "/ecommerce/stores/{storeId}/products", "/boutiques/:storeId/produits", "Ajouter un produit et ses variantes", "id, title, variants[] obligatoires.", I, { required: ["id", "title", "variants"] });
add(G9, "products.update", "PATCH", "/ecommerce/stores/{storeId}/products/{productId}", "/boutiques/:storeId/produits/:productId", "Modifier un produit", "Titre, prix, image.", I, {});
add(G9, "products.delete", "DELETE", "/ecommerce/stores/{storeId}/products/{productId}", "/boutiques/:storeId/produits/:productId", "Supprimer un produit", "Retirer du catalogue.", O, { confirm: true });
add(G9, "variants.list", "GET", "/ecommerce/stores/{storeId}/products/{productId}/variants", "/boutiques/:storeId/produits/:productId/variantes", "Lister les variantes", "Tailles, couleurs.", I, { query: PAGE });
add(G9, "variants.create", "POST", "/ecommerce/stores/{storeId}/products/{productId}/variants", "/boutiques/:storeId/produits/:productId/variantes", "Ajouter une variante", "id, title obligatoires.", I, { required: ["id", "title"] });
add(G9, "variants.update", "PATCH", "/ecommerce/stores/{storeId}/products/{productId}/variants/{variantId}", "/boutiques/:storeId/produits/:productId/variantes/:variantId", "Modifier une variante", "Prix, stock.", I, {});
add(G9, "variants.delete", "DELETE", "/ecommerce/stores/{storeId}/products/{productId}/variants/{variantId}", "/boutiques/:storeId/produits/:productId/variantes/:variantId", "Supprimer une variante", "Retirer.", O, { confirm: true });
add(G9, "orders.list", "GET", "/ecommerce/stores/{storeId}/orders", "/boutiques/:storeId/commandes", "Lister les commandes", "Suivi des ventes.", I, { query: [...PAGE, "customer_id", "has_outreach", "campaign_id"] });
add(G9, "orders.get", "GET", "/ecommerce/stores/{storeId}/orders/{orderId}", "/boutiques/:storeId/commandes/:orderId", "Détail d'une commande", "Lignes, client, attribution.", I, { query: FIELDS });
add(G9, "orders.create", "POST", "/ecommerce/stores/{storeId}/orders", "/boutiques/:storeId/commandes", "Enregistrer une commande", "Alimente le rapport de revenus des campagnes (campaign_id).", I, { required: ["id", "customer", "currency_code", "order_total", "lines"] });
add(G9, "orders.update", "PATCH", "/ecommerce/stores/{storeId}/orders/{orderId}", "/boutiques/:storeId/commandes/:orderId", "Modifier une commande", "Statut de paiement / livraison.", I, {});
add(G9, "orders.delete", "DELETE", "/ecommerce/stores/{storeId}/orders/{orderId}", "/boutiques/:storeId/commandes/:orderId", "Supprimer une commande", "Annuler une commande saisie par erreur.", O, { confirm: true });
add(G9, "customers.list", "GET", "/ecommerce/stores/{storeId}/customers", "/boutiques/:storeId/clients", "Lister les clients e-commerce", "Clients de la boutique.", I, { query: [...PAGE, "email_address"] });
add(G9, "customers.get", "GET", "/ecommerce/stores/{storeId}/customers/{customerId}", "/boutiques/:storeId/clients/:customerId", "Détail d'un client", "Total dépensé, commandes.", I, { query: FIELDS });
add(G9, "customers.create", "POST", "/ecommerce/stores/{storeId}/customers", "/boutiques/:storeId/clients", "Ajouter un client", "id, email_address, opt_in_status obligatoires.", I, { required: ["id", "email_address", "opt_in_status"] });
add(G9, "customers.upsert", "PUT", "/ecommerce/stores/{storeId}/customers/{customerId}", "/boutiques/:storeId/clients/:customerId", "Ajouter ou mettre à jour un client", "Synchronisation idempotente.", I, { required: ["id", "email_address", "opt_in_status"] });
add(G9, "customers.delete", "DELETE", "/ecommerce/stores/{storeId}/customers/{customerId}", "/boutiques/:storeId/clients/:customerId", "Supprimer un client", "Retirer.", O, { confirm: true });

// ---------- COMPTE ----------
const G10 = "Compte";
add(G10, "account.info", "GET", "/", "/compte", "Informations du compte", "Écran Connexion : nom, e-mail, offre, nombre d'abonnés.", C, { query: FIELDS });
add(G10, "account.ping", "GET", "/ping", "/compte/ping", "Test de santé de l'API", "Valider la clé en temps réel.", C, {});
add(G10, "account.apps", "GET", "/authorized-apps", "/compte/applications", "Applications autorisées", "Lister les applications OAuth connectées.", O, { query: PAGE });
add(G10, "account.activity", "GET", "/activity-feed/chimp-chatter", "/compte/activite", "Activité récente du compte (Chimp Chatter)", "Fil d'activité.", O, { query: PAGE });
add(G10, "account.domains", "GET", "/verified-domains", "/compte/domaines", "Domaines d'expédition vérifiés", "Vérifier que l'expéditeur est autorisé.", I, {});
add(G10, "account.domainAdd", "POST", "/verified-domains", "/compte/domaines", "Ajouter un domaine à vérifier", "Envoie un code de vérification à l'adresse indiquée.", I, { required: ["verification_email"] });
add(G10, "account.domainVerify", "POST", "/verified-domains/{domain}/actions/verify", "/compte/domaines/:domain/verifier", "Vérifier un domaine avec le code reçu", "Terminer la vérification.", I, { required: ["code"] });
add(G10, "account.domainDelete", "DELETE", "/verified-domains/{domain}", "/compte/domaines/:domain", "Supprimer un domaine", "Retirer.", O, { confirm: true });

// ---------- LOTS ----------
const G11 = "Lots (batches)";
add(G11, "batches.list", "GET", "/batches", "/lots", "Lister les lots d'opérations", "Suivre les opérations groupées.", O, { query: PAGE });
add(G11, "batches.get", "GET", "/batches/{batchId}", "/lots/:batchId", "État d'un lot", "Progression et URL des résultats.", O, { query: FIELDS });

const BY_ID = new Map(OPS.map((o) => [o.id, o]));
const TOKENS = (s) => [...s.matchAll(/[{:]([A-Za-z]+)\}?/g)].map((m) => m[1]);
module.exports = { OPS, BY_ID, TOKENS, PAGE };
