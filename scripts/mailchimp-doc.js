// Génère docs/mailchimp/MAILCHIMP_DOC.md à partir du catalogue réel (src/marketing/mailchimp/catalog.js et transactional.js) : la documentation ne peut donc pas diverger du code.
// Usage : node scripts/mailchimp-doc.js   (écrit le fichier)   ·   un test vérifie que le fichier est à jour.
const fs = require("node:fs");
const path = require("node:path");
const { OPS } = require("../src/marketing/mailchimp/catalog");
const tx = require("../src/marketing/mailchimp/transactional");

const OUT = path.join(__dirname, "..", "docs", "mailchimp", "MAILCHIMP_DOC.md");
const API = "/marketing/mailchimp/api";
const SAMPLE = { email_address: "ana@exemple.fr", status: "subscribed", name: "Exemple", type: "regular", title: "Exemple", html: "<p>Bonjour *|FNAME|*</p>", url: "https://exemple.fr/hook", id: "exemple", list_id: "a1b2c3d4e5", note: "Appel du 30 octobre",
  schedule_time: "2026-11-05T09:00:00+00:00", currency_code: "EUR", opt_in_status: true, verification_email: "contact@exemple.fr", code: "123456", order_total: 49.9, send_type: "html", permission_reminder: "Vous recevez cet e-mail car vous vous êtes inscrit sur notre site." };
const skeleton = (op) => {
  const body = {};
  for (const k of op.required) {
    body[k] = Object.hasOwn(SAMPLE, k) ? SAMPLE[k]
      : k === "members" ? [{ email_address: "ana@exemple.fr", status: "subscribed" }] : k === "tags" ? [{ name: "client", status: "active" }] : k === "test_emails" ? ["moi@exemple.fr"] : k === "contact" ? { company: "Ma société", address1: "1 rue de la Paix", city: "Paris", state: "IDF", zip: "75001", country: "FR" }
      : k === "campaign_defaults" ? { from_name: "Ma société", from_email: "contact@exemple.fr", subject: "Actualités", language: "fr" } : k === "recipients" ? { list_id: "a1b2c3d4e5" } : k === "trigger_settings" ? { workflow_type: "welcomeSeries" }
      : k === "variants" ? [{ id: "v1", title: "Standard", price: 49.9 }] : k === "lines" ? [{ id: "l1", product_id: "p1", product_variant_id: "v1", quantity: 1, price: 49.9 }] : k === "customer" ? { id: "c1", email_address: "ana@exemple.fr", opt_in_status: true }
      : k === "operations" ? [{ method: "GET", path: "/lists", operation_id: "op1" }] : k === "email_type_option" ? false : "…";
  }
  return body;
};
const json = (v) => `\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``;
const code = (s) => `\`${s}\``;

const COVERAGE = [
  ["LISTES / AUDIENCES", [
    ["Créer, modifier, supprimer une audience", ["audiences.create", "audiences.update", "audiences.delete"]], ["Récupérer toutes les audiences", ["audiences.list", "audiences.get"]],
    ["Statistiques d'une audience (ouverture, désinscription, croissance)", ["audiences.get", "audiences.growth", "audiences.activity", "audiences.clients", "audiences.locations", "audiences.abuse"]],
    ["Segments : créer, modifier, supprimer, lister", ["segments.create", "segments.update", "segments.delete", "segments.list", "segments.get", "segments.members", "segments.batch", "segments.addMember", "segments.removeMember"]],
    ["Tags : ajouter, supprimer, lister", ["tags.search", "members.tags", "members.tagsUpdate", "segments.create", "segments.batch"]], ["Groupes d'intérêts", ["interestCategories.list", "interestCategories.create", "interestCategories.update", "interestCategories.delete", "interests.list", "interests.create", "interests.update", "interests.delete"]],
    ["Merge fields (champs personnalisés)", ["mergefields.list", "mergefields.get", "mergefields.create", "mergefields.update", "mergefields.delete"]]]],
  ["CONTACTS / MEMBRES", [
    ["Ajouter un contact (abonnement)", ["members.add", "members.upsert"]], ["Désabonner un contact", ["members.update"]], ["Mettre à jour un contact", ["members.update", "members.upsert"]], ["Supprimer définitivement", ["members.deletePermanent"]],
    ["Historique d'activité d'un contact", ["members.activity", "members.events", "members.goals", "members.notes"]], ["Importer en masse", ["audiences.batchSubscribe", "COMPOSITE:import CSV"]], ["Archiver un contact", ["members.archive"]],
    ["Contacts par statut (subscribed, unsubscribed, cleaned, pending)", ["members.list"]], ["Vérifier si un e-mail existe", ["COMPOSITE:existence d'un contact"]],
    ["Contacts supprimés (deleted members)", ["members.list"], "L'API ne liste que les contacts archivés (status=archived) ; un contact supprimé définitivement n'est plus lisible."]]],
  ["CAMPAGNES", [
    ["Créer (regular, plaintext, rss, variate)", ["campaigns.create"]], ["Modifier / dupliquer / supprimer", ["campaigns.update", "campaigns.replicate", "campaigns.delete"]], ["Envoyer immédiatement", ["campaigns.send"]], ["Planifier / annuler la planification", ["campaigns.schedule", "campaigns.unschedule"]],
    ["Envoyer un test", ["campaigns.test"]], ["Pause / reprise d'une campagne RSS", ["campaigns.pause", "campaigns.resume"]], ["Lister avec filtres", ["campaigns.list", "campaigns.get"]], ["Résumé de campagne", ["reports.get"]], ["Contenu HTML (lire / définir)", ["campaigns.contentGet", "campaigns.contentSet"]], ["Contrôle avant envoi", ["campaigns.sendChecklist"]]]],
  ["TEMPLATES", [
    ["Créer / modifier / supprimer un template HTML", ["templates.create", "templates.update", "templates.delete"]], ["Lister (personnalisés + Mailchimp)", ["templates.list", "templates.get"]], ["Récupérer le HTML", ["templates.defaultContent", "COMPOSITE:HTML d'un modèle"], "L'API Mailchimp ne renvoie PAS le HTML complet d'un modèle (seulement ses sections modifiables). Kolakisa conserve le HTML des modèles qu'il crée ou modifie ; pour un modèle créé ailleurs, le HTML n'est pas récupérable."],
    ["Rendre un template avec des variables", ["COMPOSITE:aperçu de modèle"], "L'API Marketing n'a pas de point d'accès de rendu : Mailchimp rend les balises *|…|* à l'envoi. Kolakisa propose un aperçu LOCAL avec des valeurs d'exemple."]]],
  ["AUTOMATIONS", [
    ["Lister", ["automations.list", "automations.get"]], ["Démarrer / arrêter", ["automations.start", "automations.pause", "automations.emailStart", "automations.emailPause"]], ["Ajouter un contact", ["automations.queueAdd", "journeys.trigger"]], ["Supprimer un contact", ["automations.removeSubscriber"]],
    ["E-mails d'une automation", ["automations.emails", "automations.email"]], ["File d'attente", ["automations.queue", "automations.queueGet"]]]],
  ["RAPPORTS & ANALYTICS", [
    ["Rapport global", ["reports.get", "reports.list"]], ["Ouvertures", ["reports.opens"]], ["Clics", ["reports.clicks", "reports.clickMembers"]], ["Bounces durs et mous", ["COMPOSITE:rebonds", "reports.emailActivity"]], ["Désabonnements", ["reports.unsubscribed"]], ["Abus", ["reports.abuse", "audiences.abuse"]],
    ["EepURL", ["reports.eepurl"]], ["Domaines", ["reports.domains"]], ["Géolocalisation", ["reports.locations", "audiences.locations"]], ["Performances des appareils", ["audiences.clients"], "L'API Marketing n'expose pas de répartition par appareil (mobile / ordinateur) : seule la répartition par application de messagerie est disponible."],
    ["Croissance d'audience", ["audiences.growth"]], ["Comparaison de campagnes", ["COMPOSITE:comparaison"]], ["Revenus des campagnes", ["reports.productActivity", "reports.get"]], ["Conseils et sous-rapports A/B", ["reports.advice", "reports.subReports"]]]],
  ["LANDING PAGES", [["Créer / modifier / supprimer", ["landingPages.create", "landingPages.update", "landingPages.delete"]], ["Publier / dépublier", ["landingPages.publish", "landingPages.unpublish"]], ["Lister", ["landingPages.list", "landingPages.get", "landingPages.content"]], ["Rapport", ["landingPages.report", "landingPages.reports"]]]],
  ["FORMULAIRES", [["Récupérer le formulaire d'inscription", ["audiences.signupForms"]], ["Modifier le formulaire (champs, style)", ["audiences.signupFormCustomize", "mergefields.create"]],
    ["Emails de confirmation (opt-in)", ["audiences.update", "members.add"], "Double confirmation : option `double_optin` de l'audience, ou statut `pending` à l'ajout. Le TEXTE de l'e-mail de confirmation ne se modifie pas par l'API Marketing (interface Mailchimp)."]]],
  ["WEBHOOKS", [["Créer / supprimer / lister", ["webhooks.create", "webhooks.delete", "webhooks.list", "webhooks.get", "webhooks.update"]], ["Événements subscribe, unsubscribe, profile, cleaned, upemail, campaign", ["COMPOSITE:réception des webhooks"]]]],
  ["E-COMMERCE", [["Boutiques", ["stores.create", "stores.update", "stores.delete", "stores.list", "stores.get"]], ["Produits et variantes", ["products.create", "products.update", "products.delete", "products.list", "products.get", "variants.create", "variants.update", "variants.delete", "variants.list"]], ["Commandes", ["orders.create", "orders.update", "orders.delete", "orders.list", "orders.get"]],
    ["Clients e-commerce", ["customers.create", "customers.upsert", "customers.delete", "customers.list", "customers.get"]], ["Rapport de revenus des campagnes", ["reports.productActivity", "reports.get"]]]],
  ["COMPTE", [["Infos du compte", ["account.info", "account.ping"]], ["Domaines vérifiés", ["account.domains", "account.domainAdd", "account.domainVerify", "account.domainDelete"]], ["Applications autorisées", ["account.apps"], "L'API ne permet que de LISTER les applications autorisées ; leur révocation se fait dans Mailchimp."],
    ["Activité du compte", ["account.activity"]], ["Utilisateurs du compte", [], "NON DISPONIBLE : l'API Marketing v3 n'expose aucun point d'accès de gestion des utilisateurs du compte."]]],
  ["TRANSACTIONNEL (Mandrill)", [["Envoyer un e-mail transactionnel", ["TX:messages.send"]], ["Utiliser un modèle", ["TX:messages.sendTemplate", "TX:templates.render"]], ["Suivi des messages", ["TX:messages.search", "TX:messages.info", "TX:messages.content"]], ["Expéditeurs vérifiés", ["TX:senders.list", "TX:senders.domains", "TX:senders.addDomain", "TX:senders.checkDomain", "TX:senders.verifyDomain"]],
    ["Webhooks transactionnels", ["TX:webhooks.list", "TX:webhooks.add", "TX:webhooks.update", "TX:webhooks.delete"]], ["Blacklist / whitelist", ["TX:rejects.list", "TX:rejects.add", "TX:rejects.delete", "TX:allowlists.list", "TX:allowlists.add", "TX:allowlists.delete"]]]],
];

const COMPOSITES = [
  ["import CSV", "POST", "/audiences/:listId/import", "Import de 5 000 lignes au plus : adresses validées, doublons écartés, personnes désinscrites / rebondies / plaignantes chez Kolakisa écartées, lots de 500. Sans `attestConsent: true`, les contacts sont importés `pending` (Mailchimp envoie lui-même l'e-mail de confirmation).", { rows: [{ email: "ana@exemple.fr", FNAME: "Ana", tags: "vip" }], attestConsent: true, updateExisting: false, tags: ["import"] }, { received: 1, sent: 1, created: 1, updated: 0, invalid: [], blocked: 0, duplicates: 0, errors: [], status: "subscribed" }, "CRITIQUE"],
  ["export CSV", "GET", "/audiences/:listId/export.csv?status=subscribed", "Fichier CSV (BOM UTF-8, formules de tableur neutralisées).", null, "text/csv", "IMPORTANT"],
  ["existence d'un contact", "GET", "/audiences/:listId/membres/:hash/existe", "Accepte l'adresse e-mail ou l'empreinte MD5.", null, { exists: true, status: "subscribed", email: "ana@exemple.fr" }, "CRITIQUE"],
  ["aperçu de modèle", "POST", "/modeles/apercu", "Aperçu LOCAL : remplace les balises de fusion par des valeurs d'exemple (échappées).", { html: "<p>Bonjour *|FNAME|*</p>", variables: { FNAME: "Camille" } }, { html: "<p>Bonjour Camille</p>", used: ["FNAME"], unknown: [] }, "IMPORTANT"],
  ["rebonds", "GET", "/rapports/:campaignId/rebonds", "Rebonds durs et mous d'une campagne (lus dans l'activité par destinataire).", null, { hard: [{ email: "x@exemple.fr", at: "2026-10-30T10:00:00+00:00" }], soft: [], total: 1 }, "CRITIQUE"],
  ["comparaison", "POST", "/rapports/comparer", "Compare 2 à 10 campagnes sur les mêmes indicateurs.", { ids: ["9f8e7d6c5b", "1a2b3c4d5e"] }, { campaigns: [{ id: "9f8e7d6c5b", sent: 100, openRate: 0.3 }], best: { openRate: "9f8e7d6c5b", clickRate: "1a2b3c4d5e" } }, "IMPORTANT"],
  ["tableau de bord", "GET", "/tableau-de-bord?live=0", "Totaux, campagnes récentes, évolution sur 30 jours et alertes (rebonds ≥ 5 %, désabonnements ≥ 1 %, plaintes ≥ 0,1 % sur 7 jours, à partir de 100 envois).", null, { totals: { audiences: 1, contacts: 1250, campaigns: 12, avgOpenRate: 0.41, revenue: 0 }, alerts: [] }, "CRITIQUE"],
  ["liaison d'une audience", "POST", "/audiences/:listId/lier  ·  /delier", "Relie une audience à une liste Kolakisa (existante ou créée). Seules les audiences liées échangent des contacts.", { create: true }, { remoteId: "a1b2c3d4e5", localListId: 12 }, "CRITIQUE"],
  ["synchronisation", "POST", "/sync", "Lance une synchronisation en arrière-plan (`full: true` relit tous les membres). L'état se lit par `GET /etat`.", { full: false }, { started: true }, "CRITIQUE"],
  ["installation du webhook", "POST", "/audiences/:listId/webhooks/installer", "Crée (ou met à jour) chez Mailchimp le webhook qui pointe vers Kolakisa (sources user + admin, jamais api).", {}, { id: "ab12cd34", created: true }, "CRITIQUE"],
  ["réception des webhooks", "POST", "/webhooks/mailchimp/:organisation/:jeton", "Route PUBLIQUE appelée par Mailchimp (corps `application/x-www-form-urlencoded`). Voir la section « Webhooks entrants ».", null, { ok: true }, "CRITIQUE"],
  ["journal des événements", "GET / POST", "/evenements  ·  /evenements/:id/rejouer", "Journal des événements reçus (filtres `type`, `status`, lecture incrémentale `after`) et rejeu d'un événement.", null, { events: [] }, "IMPORTANT"],
  ["HTML d'un modèle", "GET", "/modeles/:templateId/html", "HTML conservé par Kolakisa pour les modèles créés ou modifiés depuis l'écran (`available: false` sinon : l'API Mailchimp ne le fournit pas).", null, { html: "<p>Bonjour *|FNAME|*</p>", available: true, updatedAt: "2026-10-30 10:00:00" }, "IMPORTANT"],
  ["journal des appels", "GET", "/journal-appels?limit=100", "Appels sortants (méthode, chemin masqué, statut, durée, tentatives), 30 jours.", null, [], "IMPORTANT"],
];

function generate() {
  const L = [];
  const byId = new Map(OPS.map((o) => [o.id, o]));
  L.push("# Mailchimp — documentation des fonctionnalités intégrées à Kolakisa", "",
    "*Généré par `node scripts/mailchimp-doc.js` à partir du catalogue réel du code (`src/marketing/mailchimp/catalog.js`, `transactional.js`) : ce document ne peut pas diverger du code, un test le vérifie.*", "",
    "## Lire ce document sans se tromper", "",
    "- **Ce qui est vérifié** : chaque opération ci-dessous est testée de bout en bout (méthode, chemin, paramètres et corps reçus par le serveur Mailchimp **simulé** `tests/fake-mailchimp.js`). Les chemins, méthodes et champs obligatoires proviennent de la documentation publique de l'API Marketing v3 telle que connue du rédacteur.",
    "- **Ce qui n'est PAS vérifié** : aucun appel n'a été fait vers le vrai service Mailchimp (aucune clé n'était disponible). Avant de s'y fier en production, passer le parcours « Connexion → Synchronisation → petite campagne de test » avec une clé réelle (voir `README_MAILCHIMP.md`).",
    "- **Exemples de réponses** : fournis pour les opérations principales ; pour les autres, la réponse est le JSON renvoyé par Mailchimp (sans le bloc `_links`), toujours enveloppé par Kolakisa dans `{ \"ok\": true, \"data\": … }`.", "",
    "## Principes communs", "",
    "| Sujet | Règle |", "|---|---|",
    "| Authentification Mailchimp | HTTP Basic (identifiant quelconque, clé d'API en mot de passe). L'hôte dépend du centre de données porté par la clé : `https://<dc>.api.mailchimp.com/3.0` (dc extrait de `…-us21`). |",
    "| Limite de débit | Mailchimp limite à **10 connexions simultanées** par compte (et coupe une requête après 120 s) — pas « 10 requêtes par seconde ». Kolakisa plafonne à **8** requêtes simultanées (10 au maximum quoi qu'on configure), **partagées par organisation** (écran, synchronisation et webhooks utilisent le même plafond), et met les autres en attente. |",
    "| Nouvelles tentatives | `429` : toujours réessayé (3 fois maximum, en respectant `Retry-After`, sinon 0,5 s · 1 s · 2 s avec gigue). `5xx` et pannes réseau : réessayés pour GET, PUT, PATCH, DELETE **jamais pour POST** (risque de doublon : un envoi ou une création). |",
    "| Pagination | `count` (1 à 1000) et `offset`. Les lectures complètes (synchronisation, export) parcourent toutes les pages. |",
    "| Enveloppe de réponse | `{ \"ok\": true, \"data\": … }` ou `{ \"ok\": false, \"error\": { \"code\", \"message\" (français), \"detail\"? } }`. |",
    "| Droits | Permission `mailchimp.manage` (administrateur de l'organisation) ; jamais ouvert à un accès limité à un site. Toute requête qui modifie exige l'en-tête `X-Requested-With: fetch`. |",
    "| Actions irréversibles | Envoi, planification, suppressions, suppression définitive, publication : refusées (`409 confirm_required`) sans `confirm: true` (corps) ou `?confirm=1` (requête). |",
    "| Identifiants | Chaque identifiant de chemin est validé (audience : 10 caractères hexadécimaux ; membre : adresse e-mail ou empreinte MD5 de 32 caractères ; autres : lettres, chiffres, `_`, `-`, `.`). Un paramètre de requête non prévu est refusé. |",
    "| Consentement | Kolakisa reste maître des consentements : voir `INTEGRATION_PLAN.md` §4 (le plus restrictif gagne). Les opérations qui abonnent (`members.add`, `members.upsert`, `members.update`, `audiences.batchSubscribe`) sont **refusées** (`422 consent_blocked`) pour une adresse désinscrite, rebondie, plaignante ou supprimée chez Kolakisa. |", "",
    "### Erreurs", "", "| HTTP Mailchimp | Code Kolakisa | Statut renvoyé | Message (extrait) |", "|---|---|---|---|",
    "| 401, ou 403 « clé invalide » | `auth_invalid` | 422 | La clé d'API Mailchimp est refusée (invalide ou révoquée)… |", "| 403 | `forbidden` | 422 | Mailchimp refuse cette action pour ce compte (droits ou offre insuffisants) |",
    "| 404 | `not_found` | 404 | Élément introuvable chez Mailchimp… |", "| 400 / 422 | `invalid_request` (champ fautif cité) | 400 | Mailchimp a refusé la demande (données invalides)… |",
    "| 400 « Member Exists » | `member_exists` | 422 | Ce contact est déjà présent dans l'audience |", "| 400 « compliance state » | `compliance_state` | 422 | Mailchimp refuse de réabonner cette adresse… |",
    "| 429 | `rate_limited` | 429 | Mailchimp limite le nombre de requêtes simultanées… |", "| 5xx | `server_error` | 502 | Mailchimp est momentanément indisponible |",
    "| délai dépassé / réseau | `timeout` / `network` | 504 / 502 | Mailchimp n'a pas répondu à temps / Impossible de joindre Mailchimp |", "");
  L.push("## Couverture des fonctionnalités demandées", "", "Chaque ligne renvoie aux opérations qui la réalisent. « COMPOSITE » = opération composée de Kolakisa (voir plus bas) ; « TX » = Transactionnel.", "");
  let missing = 0;
  for (const [group, rows] of COVERAGE) {
    L.push(`### ${group}`, "", "| Fonctionnalité | Opérations | Remarque |", "|---|---|---|");
    for (const [label, ids, note] of rows) {
      const names = ids.map((id) => (id.startsWith("COMPOSITE:") || id.startsWith("TX:") ? id : (byId.has(id) ? code(id) : ((missing++), `**${id} (ABSENTE)**`))));
      L.push(`| ${label} | ${names.join(", ") || "—"} | ${note || (ids.length ? "Disponible" : "")} |`);
    }
    L.push("");
  }
  if (missing) throw new Error(`Couverture : ${missing} opération(s) citée(s) absente(s) du catalogue.`);

  L.push("## Opérations de l'API Marketing v3", "", `${OPS.length} opérations. Route interne = préfixe ${code(API)} + route indiquée. Les paramètres de requête listés sont les seuls acceptés.`, "");
  for (const group of [...new Set(OPS.map((o) => o.group))]) {
    L.push(`### ${group}`, "");
    for (const op of OPS.filter((o) => o.group === group)) {
      L.push(`#### ${code(op.id)} — ${op.summary}`, "",
        `- **Priorité d'intégration** : ${op.priority}`, `- **Endpoint Mailchimp** : ${code(`${op.method} /3.0${op.mc}`)}`, `- **Route Kolakisa** : ${code(`${op.method} ${API}${op.route}`)}`,
        `- **Cas d'usage dans Kolakisa** : ${op.usage}`,
        `- **Paramètres de requête (facultatifs)** : ${op.query.length ? op.query.map(code).join(", ") : "aucun"}`,
        `- **Champs obligatoires du corps** : ${op.required.length ? op.required.map(code).join(", ") : "aucun"}`,
        op.confirm ? `- **Confirmation** : obligatoire (${op.method === "GET" || op.method === "DELETE" ? "`?confirm=1`" : "`confirm: true` dans le corps"}) — sinon \`409 confirm_required\`` : "- **Confirmation** : non requise");
      const ex = op.example;
      if (ex && ex.request !== undefined) { L.push("", "Exemple de requête :", typeof ex.request === "string" ? code(ex.request) : json(ex.request)); }
      else if (op.method !== "GET" && op.method !== "DELETE") { L.push("", "Exemple de corps (champs obligatoires) :", json(op.confirm ? { ...skeleton(op), confirm: true } : skeleton(op))); }
      if (ex && ex.response !== undefined) L.push("", "Exemple de réponse :", json(ex.response));
      else L.push("", `Réponse : le JSON de Mailchimp ${op.method === "DELETE" || /\/actions\//.test(op.mc) ? "(en général vide, code 204 → `data: null`)" : "(voir la documentation officielle de la ressource)"}, enveloppé \`{ "ok": true, "data": … }\`.`);
      L.push("");
    }
  }
  L.push("## Opérations composées (propres à Kolakisa)", "", "Elles s'appuient sur les opérations ci-dessus et ajoutent des garanties (consentement, validation, lots, calcul local).", "");
  for (const [name, method, route, desc, req, res, prio] of COMPOSITES) {
    L.push(`#### ${name}`, "", `- **Priorité** : ${prio}`, `- **Route** : ${code(`${method} ${route.startsWith("/webhooks") ? "" : API}${route}`)}`, `- **Description** : ${desc}`);
    if (req) L.push("", "Exemple de requête :", json(req));
    L.push("", "Exemple de réponse :", typeof res === "string" ? code(res) : json(res), "");
  }
  L.push("## Webhooks entrants (Mailchimp → Kolakisa)", "",
    "Mailchimp **ne signe pas** ses webhooks Marketing (il n'existe pas de signature HMAC à vérifier). Kolakisa protège donc le point d'entrée autrement :", "",
    "1. l'adresse contient un **jeton secret** de 48 caractères, propre à l'organisation, chiffré en base et comparé à temps constant ; un jeton faux répond `404` sans explication ; il se régénère d'un clic (l'ancienne adresse cesse aussitôt de fonctionner) ;",
    "2. l'événement doit concerner une **audience connue** (sinon enregistré « ignoré ») ;",
    "3. chaque événement est **enregistré avec sa charge complète** avant d'être appliqué ; une clé de déduplication (organisation, type, date, adresse, identifiant) rend le traitement **idempotent** ;",
    "4. la limite de corps est de 64 Ko (`413` au-delà) et le débit est limité par adresse IP ;",
    "5. le webhook est créé avec les sources **user** et **admin** seulement : les écritures de Kolakisa par l'API ne reviennent pas en boucle.", "",
    "Mailchimp teste l'adresse par un `GET` à la création : elle répond `200 ok` si le jeton est exact. Une fois le jeton validé, la réponse est toujours `200` (Mailchimp désactive un webhook qui répond en erreur) ; un événement en échec est conservé, **retraité automatiquement** (doublon reçu, ou passe de rattrapage de la synchronisation, 3 essais) et peut être **rejoué** depuis l'écran. Seuls les jetons **refusés** comptent dans le limiteur (600 par minute et par adresse IP) : une vague d'événements légitimes n'est jamais bloquée.", "",
    "| Événement | Effet dans Kolakisa |", "|---|---|",
    "| `subscribe` | **seulement si l'audience est liée à une liste Kolakisa** : contact créé ou retrouvé, consentement enregistré avec preuve (source `mailchimp`, audience d'origine), ajouté à la liste liée, sans déclencher les séries de bienvenue de Kolakisa — **sauf** s'il est désinscrit (de Kolakisa ou de cette liste), rebondi, plaignant, supprimé ou effacé chez Kolakisa : il reste désinscrit et son désabonnement est renvoyé à Mailchimp |",
    "| `unsubscribe` | désinscription du contact (créé « désinscrit » s'il était inconnu : il ne sera jamais joignable) |", "| `profile` | audience liée seulement : prénom et nom mis à jour s'ils figurent dans l'événement (Mailchimp fait autorité) |",
    "| `cleaned` | adresse placée en liste de suppression (rebond dur ; plainte si `reason = abuse`) |", "| `upemail` | audience liée seulement : la nouvelle adresse est abonnée (preuve de consentement) et l'ancienne désinscrite ; si l'ancienne était désinscrite chez Kolakisa, la nouvelle hérite de la désinscription |", "| `campaign` | statut de la campagne mis à jour, rapport relu à la prochaine synchronisation |", "",
    "Exemple (corps reçu, décodé) :", json({ type: "subscribe", fired_at: "2026-10-30 10:00:00", data: { id: "8a25ff1d98", list_id: "a1b2c3d4e5", email: "ana@exemple.fr", email_type: "html", merges: { EMAIL: "ana@exemple.fr", FNAME: "Ana", LNAME: "Diallo" }, ip_opt: "203.0.113.7" } }), "");
  L.push("## Mailchimp Transactional (Mandrill)", "",
    "**API distincte** de l'API Marketing : autre hôte (`https://mandrillapp.com/api/1.0/<catégorie>/<méthode>.json`), autre clé (SMTP & API Info de Transactional), autre facturation (module complémentaire payant de Mailchimp). Toutes les requêtes sont des `POST` JSON dont le corps contient la clé. Mandrill répond `HTTP 500` + `{ status: \"error\", name, message }` pour presque toutes les erreurs : Kolakisa les classe par `name` (`Invalid_Key` → `auth_invalid`, `PaymentRequired` → `quota`, `Unknown_*` → `not_found`, `ValidationError` → `invalid_request`).", "",
    "Règles propres à Kolakisa : la clé est **vérifiée en direct** (`users/ping2`) avant d'être conservée chiffrée ; un envoi (`messages/send`, `send-template`) exige `confirm: true`, n'est **jamais réessayé** automatiquement, et est refusé avant tout appel si un destinataire a un **rebond dur ou une plainte** enregistrés chez Kolakisa (un destinataire simplement désinscrit du marketing reste autorisé : un reçu n'est pas du marketing) ; 50 destinataires au plus ; champs du message limités à une liste blanche.", "",
    `Route : ${code(`POST ${API}/transactionnel/<opération>`)} (corps = champs Mandrill ; ${code(`PUT ${API}/transactionnel/cle`)} pour la clé).`, "");
  for (const [id, op] of Object.entries(tx.OPS)) {
    L.push(`#### ${code(id)} — ${op.summary}`, "", `- **Priorité d'intégration** : ${op.priority}`, `- **Endpoint Mandrill** : ${code(`POST /api/1.0/${op.endpoint}.json`)}`, `- **Cas d'usage** : ${op.usage}`, `- **Champs acceptés** : ${op.keys.length ? op.keys.map(code).join(", ") : "aucun"}`, `- **Champs obligatoires** : ${op.required.length ? op.required.map(code).join(", ") : "aucun"}`,
      `- **Confirmation** : ${op.confirm ? "obligatoire (`confirm: true`)" : "non requise"}`);
    if (op.example) L.push("", "Exemple de requête :", json(op.example.request), "", "Exemple de réponse :", json(op.example.response));
    L.push("");
  }
  L.push("## Ce que l'API ne permet pas (et que Kolakisa ne simule pas)", "",
    "- Gérer les **utilisateurs du compte** (aucun point d'accès dans l'API Marketing v3).", "- **Révoquer** une application autorisée (lecture seule).", "- Une répartition par **appareil** (mobile / ordinateur) : seule la répartition par application de messagerie existe (`audiences.clients`).",
    "- Un **rendu** de modèle par l'API : Mailchimp rend les balises à l'envoi ; Kolakisa n'offre qu'un aperçu local avec des valeurs d'exemple.", "- Modifier le **texte de l'e-mail de confirmation** de la double inscription (interface Mailchimp).", "- Retrouver un contact **supprimé définitivement**.",
    "- Créer des parcours **Customer Journeys** complets : l'API permet seulement de déclencher une étape de type API (`journeys.trigger`).", "");
  return L.join("\n");
}

if (require.main === module) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, generate()); console.log(`${OUT} écrit (${generate().length} caractères)`); }
module.exports = { generate, OUT };
