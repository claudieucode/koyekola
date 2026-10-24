// Données rattachées à UN site : commentaires, fiche de contact, consentements, listes, journal d'activité (dont envois de formulaires),
// e-mails et SMS reçus, réponses à des sondages, fichiers envoyés par formulaire. Chaque requête est bornée par le site (jamais par un champ de formulaire) ;
// le site principal n'obtient QUE ce qui n'est rattaché à aucun site. Relation réelle : contact retrouvé par l'adresse e-mail identique, rattaché au site (mk_contact_sites).
const { tableExists, hasColumn, when, contactOf, siteClause, section } = require("./_helpers");

const jsonSafe = (text) => { try { const v = JSON.parse(text || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
// Métadonnées d'événement : valeurs simples seulement, jamais de secret
const flat = (obj) => Object.entries(obj).filter(([k, v]) => ["string", "number", "boolean"].includes(typeof v) && !/pass|token|secret|key|hash/i.test(k)).map(([k, v]) => `${k} : ${v}`).join(" ; ");
const statusFr = { pending: "En attente", approved: "Approuvé", spam: "Indésirable", trash: "Corbeille" };
const consentFr = { granted: "Consentement donné", withdrawn: "Consentement retiré" };

const collectors = [
  {
    id: "commentaires", title: "Commentaires", category: "Contributions", owner: "Kolakisa — Commentaires", order: 50, scope: "both",
    description: "Commentaires publiés par la personne sur les contenus de ce site (compte connecté ou invité avec la même adresse).",
    fields: ["texte du commentaire", "contenu commenté", "statut de modération", "nom affiché", "date"],
    method: "Lecture de blog_comments : identifiant du compte OU adresse e-mail identique saisie par un invité ; contenu rattaché au site par mk_content_sites.",
    filter: "Commentaires des contenus de CE site seulement (le site principal : contenus rattachés à aucun site). L'empreinte d'adresse IP n'est pas exportée.", limits: "",
    collect(ctx) {
      const site = ctx.siteId === null
        ? "NOT EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = c.content_type AND cs.content_id = c.content_id AND cs.site_id IS NOT NULL)"
        : "EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = c.content_type AND cs.content_id = c.content_id AND cs.site_id = ?)";
      const who = ctx.subject.userId ? "(c.user_id = ? OR lower(c.author_email) = ?)" : "lower(c.author_email) = ?";
      const params = [...(ctx.siteId === null ? [] : [ctx.siteId]), ...(ctx.subject.userId ? [ctx.subject.userId] : []), ctx.subject.email];
      const rows = ctx.db.prepare(`SELECT c.id, c.content_type, c.content_id, c.author_name, c.body, c.status, c.created_at, p.title AS post_title FROM blog_comments c LEFT JOIN posts p ON c.content_type = 'post' AND p.id = c.content_id WHERE ${site} AND ${who} ORDER BY c.id`).all(...params);
      return { sections: [section("commentaires", "Commentaires", [["contenu", "Contenu commenté"], ["nom", "Nom affiché"], ["commentaire", "Commentaire"], ["statut", "Statut"], ["date", "Date"]],
        rows.map((r) => ({ contenu: r.post_title || `${r.content_type} n°${r.content_id}`, nom: r.author_name, commentaire: r.body, statut: statusFr[r.status] || r.status, date: when(r.created_at) })))] };
    },
  },
  {
    id: "contact-fiche", title: "Fiche de contact", category: "Contact (e-mailing)", owner: "Kolakisa — Contact Core", order: 60, scope: "both", permission: "contacts.view_sensitive",
    description: "Fiche de contact de la personne dans l'audience de ce site.",
    fields: ["adresse e-mail", "prénom", "nom", "téléphone", "société", "pays", "langue", "origine", "statut d'abonnement", "dates d'ajout, d'activité et de désinscription"],
    method: "Lecture de mk_contacts (adresse e-mail identique) ; un site ne voit la fiche que si le contact lui est rattaché (mk_contact_sites).", filter: "Contact de l'organisation rattaché à CE site (site principal : équipe de l'organisation).",
    limits: "Les contacts n'ont pas de mot de passe : aucune donnée d'authentification n'existe ici.",
    collect(ctx) {
      const c = contactOf(ctx); if (!c) return { sections: [] };
      const rows = [["E-mail", c.email], ["Prénom", c.first_name], ["Nom", c.last_name], ["Téléphone", c.phone], ["Société", c.company], ["Pays", c.country], ["Langue", c.language], ["Origine", c.source], ["Statut d'abonnement", c.status],
        ["Ajouté le", when(c.created_at)], ["Dernière activité", when(c.last_activity_at)], ["Désinscrit le", when(c.unsubscribed_at)]].filter(([, v]) => v !== "" && v !== null && v !== undefined).map(([champ, valeur]) => ({ champ, valeur: String(valeur) }));
      return { sections: [section("fiche", "Fiche de contact", [["champ", "Champ"], ["valeur", "Valeur"]], rows)] };
    },
  },
  {
    id: "contact-consentements", title: "Consentements", category: "Contact (e-mailing)", owner: "Kolakisa — Conformité", order: 61, scope: "both", permission: "contacts.view_sensitive",
    description: "Preuves de consentement : ce qui a été présenté à la personne et ce qu'elle a accepté ou retiré.",
    fields: ["objet", "action", "origine", "texte présenté", "adresse IP tronquée", "date"], method: "Lecture de mk_consents du contact.", filter: "Preuves de CE site (site principal : celles sans site).", limits: "Ces preuves sont conservées en écriture seule (obligation de pouvoir prouver un consentement).",
    collect(ctx) {
      const c = contactOf(ctx); if (!c || !hasColumn(ctx.db, "mk_consents", "site_id")) return { sections: [] };
      const f = siteClause("site_id", ctx.siteId);
      const rows = ctx.db.prepare(`SELECT purpose, action, source, text_shown, ip, created_at FROM mk_consents WHERE contact_id = ? AND ${f.sql} ORDER BY id`).all(c.id, ...f.params);
      return { sections: [section("consentements", "Consentements", [["objet", "Objet"], ["action", "Action"], ["origine", "Origine"], ["texte", "Texte présenté"], ["ip", "Adresse IP (tronquée)"], ["date", "Date"]],
        rows.map((r) => ({ objet: r.purpose, action: consentFr[r.action] || r.action, origine: r.source, texte: r.text_shown, ip: r.ip, date: when(r.created_at) })))] };
    },
  },
  {
    id: "contact-listes", title: "Listes d'envoi", category: "Contact (e-mailing)", owner: "Kolakisa — Audience", order: 62, scope: "both", permission: "contacts.view_sensitive",
    description: "Listes d'envoi auxquelles la personne appartient.", fields: ["nom de la liste", "date d'ajout"], method: "Lecture de mk_list_members et mk_lists.", filter: "Listes de CE site seulement (site principal : listes sans site).", limits: "",
    collect(ctx) {
      const c = contactOf(ctx); if (!c || !hasColumn(ctx.db, "mk_lists", "site_id")) return { sections: [] };
      const f = siteClause("l.site_id", ctx.siteId);
      const rows = ctx.db.prepare(`SELECT l.name, m.added_at FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id WHERE m.contact_id = ? AND ${f.sql} ORDER BY l.name`).all(c.id, ...f.params);
      return { sections: [section("listes", "Listes", [["liste", "Liste"], ["ajoute_le", "Ajouté le"]], rows.map((r) => ({ liste: r.name, ajoute_le: when(r.added_at) })))] };
    },
  },
  {
    id: "contact-organisation", title: "Étiquettes, propriétés et notes internes", category: "Contact (e-mailing)", owner: "Kolakisa — Audience", order: 63, scope: "principal", orgOnly: true, permission: "contacts.view_sensitive",
    description: "Éléments de la fiche gérés au niveau de l'organisation : étiquettes, propriétés personnalisées, préférences de catégories et notes de l'équipe.",
    fields: ["étiquettes", "propriétés personnalisées", "préférences de catégories", "notes internes"], method: "Lectures de mk_contact_tags, mk_contact_property_values, mk_contact_preferences et mk_contact_notes.",
    filter: "Réservé à l'export du site principal : ces éléments sont partagés entre les sites et pourraient révéler ce qui concerne un autre site.", limits: "Non inclus dans l'export d'un site (partage entre sites).",
    collect(ctx) {
      const c = contactOf(ctx); if (!c) return { sections: [] };
      const q = (sql) => ctx.db.prepare(sql).all(c.id);
      return { sections: [
        section("etiquettes", "Étiquettes", [["etiquette", "Étiquette"]], q("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? ORDER BY t.name").map((r) => ({ etiquette: r.name }))),
        section("proprietes", "Propriétés personnalisées", [["propriete", "Propriété"], ["valeur", "Valeur"]], q("SELECT d.label, v.value_text, v.value_number, v.value_date, v.value_boolean FROM mk_contact_property_values v JOIN mk_property_defs d ON d.id = v.property_id WHERE v.contact_id = ? ORDER BY d.label")
          .map((r) => ({ propriete: r.label, valeur: String(r.value_text ?? r.value_number ?? r.value_date ?? (r.value_boolean === null || r.value_boolean === undefined ? "" : r.value_boolean ? "oui" : "non")) }))),
        section("preferences-categories", "Préférences de catégories", [["categorie", "Catégorie"], ["abonne", "Abonné"]], q("SELECT cat.label, p.subscribed FROM mk_contact_preferences p JOIN mk_preference_categories cat ON cat.id = p.category_id WHERE p.contact_id = ? ORDER BY cat.label").map((r) => ({ categorie: r.label, abonne: r.subscribed ? "oui" : "non" }))),
        section("notes-internes", "Notes de l'équipe", [["note", "Note"], ["date", "Date"]], q("SELECT body, created_at FROM mk_contact_notes WHERE contact_id = ? ORDER BY id").map((r) => ({ note: r.body, date: when(r.created_at) }))),
      ] };
    },
  },
  {
    id: "activite", title: "Journal d'activité (formulaires, événements)", category: "Activité", owner: "Kolakisa — Contact Core", order: 70, scope: "both", permission: "contacts.view_sensitive",
    description: "Événements enregistrés pour la personne sur ce site, dont les envois de formulaires.", fields: ["nom de l'événement", "date", "origine", "informations simples associées (formulaire, page…)"],
    method: "Lecture de mk_events pour le contact (identifiant) ou l'adresse e-mail identique.", filter: "Événements de CE site seulement (site principal : événements sans site).", limits: "Seules les informations simples (texte, nombre) sont reprises.",
    collect(ctx) {
      const c = contactOf(ctx); if (!c && ctx.siteId !== null) return { sections: [] };
      const f = siteClause("site_id", ctx.siteId);
      const rows = ctx.db.prepare(`SELECT name, occurred_at, source, metadata FROM mk_events WHERE organization_id = ? AND ${f.sql} AND (${c ? "contact_id = ? OR " : ""}lower(email) = ?) ORDER BY id LIMIT 2000`).all(ctx.organizationId, ...f.params, ...(c ? [c.id] : []), ctx.subject.email);
      return { sections: [section("evenements", "Événements", [["evenement", "Événement"], ["date", "Date"], ["origine", "Origine"], ["details", "Détails"]],
        rows.map((r) => ({ evenement: r.name, date: when(r.occurred_at), origine: r.source, details: flat(jsonSafe(r.metadata)) })))], note: rows.length >= 2000 ? "Limité aux 2 000 événements les plus anciens." : "" };
    },
  },
  {
    id: "envois", title: "E-mails et SMS reçus", category: "Activité", owner: "Kolakisa — E-mailing et SMS", order: 71, scope: "both", permission: "contacts.view_sensitive",
    description: "Campagnes d'e-mails et de SMS envoyées à la personne par ce site.", fields: ["objet ou campagne", "état d'envoi", "dates d'envoi, d'ouverture et de clic", "numéro de téléphone (SMS)"],
    method: "Lecture de mk_messages et mk_sms_messages, reliés aux campagnes.", filter: "Campagnes de CE site seulement (site principal : campagnes sans site).", limits: "Le contenu des messages n'est pas rejoué : seules les traces d'envoi le sont.",
    collect(ctx) {
      const c = contactOf(ctx); if (!c) return { sections: [] };
      const out = [];
      if (hasColumn(ctx.db, "mk_campaigns", "site_id")) {
        const f = siteClause("ca.site_id", ctx.siteId);
        out.push(section("emails", "E-mails de campagne", [["campagne", "Campagne"], ["objet", "Objet"], ["etat", "État"], ["envoye_le", "Envoyé le"], ["ouvertures", "Ouvertures"], ["clics", "Clics"]],
          ctx.db.prepare(`SELECT ca.name, m.subject, m.status, m.sent_at, m.open_count, m.click_count FROM mk_messages m JOIN mk_campaigns ca ON ca.id = m.campaign_id WHERE m.contact_id = ? AND ${f.sql} ORDER BY m.id`).all(c.id, ...f.params)
            .map((r) => ({ campagne: r.name, objet: r.subject, etat: r.status, envoye_le: when(r.sent_at), ouvertures: r.open_count, clics: r.click_count }))));
      }
      if (tableExists(ctx.db, "mk_sms_messages") && hasColumn(ctx.db, "mk_sms_campaigns", "site_id")) {
        const f = siteClause("sc.site_id", ctx.siteId);
        out.push(section("sms", "SMS de campagne", [["campagne", "Campagne"], ["telephone", "Numéro"], ["etat", "État"], ["envoye_le", "Envoyé le"]],
          ctx.db.prepare(`SELECT sc.name, m.phone, m.status, m.sent_at FROM mk_sms_messages m JOIN mk_sms_campaigns sc ON sc.id = m.campaign_id WHERE m.contact_id = ? AND ${f.sql} ORDER BY m.id`).all(c.id, ...f.params)
            .map((r) => ({ campagne: r.name, telephone: r.phone, etat: r.status, envoye_le: when(r.sent_at) }))));
      }
      return { sections: out };
    },
  },
  {
    id: "sondages", title: "Réponses à des sondages", category: "Contributions", owner: "Kolakisa — Sondages", order: 72, scope: "principal", orgOnly: true, permission: "contacts.view_sensitive",
    description: "Réponses données par la personne à des sondages.", fields: ["sondage", "réponses", "date"], method: "Lecture de mk_survey_responses du contact.",
    filter: "Réservé au site principal : les sondages ne sont pas rattachés à un site.", limits: "Non inclus dans l'export d'un site.",
    collect(ctx) {
      const c = contactOf(ctx); if (!c) return { sections: [] };
      const rows = ctx.db.prepare("SELECT s.name, r.answers, r.created_at FROM mk_survey_responses r JOIN mk_surveys s ON s.id = r.survey_id WHERE r.contact_id = ? ORDER BY r.id").all(c.id);
      return { sections: [section("sondages", "Réponses", [["sondage", "Sondage"], ["reponses", "Réponses"], ["date", "Date"]], rows.map((r) => ({ sondage: r.name, reponses: r.answers, date: when(r.created_at) })))] };
    },
  },
  {
    id: "fichiers-formulaires", title: "Fichiers envoyés par formulaire", category: "Contributions", owner: "Kolakisa — Formulaires", order: 73, scope: "both", permission: "contacts.view_sensitive",
    description: "Fichiers déposés par la personne dans un formulaire de ce site.", fields: ["nom d'origine", "type", "taille", "date"], method: "Lecture de mk_form_files.", filter: "Formulaires de CE site seulement (site principal : formulaires sans site).",
    limits: "Les fichiers eux-mêmes ne sont pas copiés dans l'archive (seules leurs références) : à remettre séparément sur demande.",
    collect(ctx) {
      const c = contactOf(ctx); if (!c || !hasColumn(ctx.db, "mk_forms", "site_id")) return { sections: [] };
      const f = siteClause("fo.site_id", ctx.siteId);
      const rows = ctx.db.prepare(`SELECT ff.original_name, ff.mime, ff.size, ff.created_at FROM mk_form_files ff JOIN mk_forms fo ON fo.id = ff.form_id WHERE ff.contact_id = ? AND ${f.sql} ORDER BY ff.id`).all(c.id, ...f.params);
      return { sections: [section("fichiers", "Fichiers", [["nom", "Nom"], ["type", "Type"], ["taille", "Taille (octets)"], ["date", "Date"]], rows.map((r) => ({ nom: r.original_name, type: r.mime, taille: r.size, date: when(r.created_at) })))] };
    },
  },
];

// Sources que Kolakisa ne peut PAS lire : signalées, jamais prétendues collectées
const externals = [
  { id: "sauvegardes", title: "Sauvegardes de la plateforme", action: "Les copies quotidiennes de la base peuvent contenir ces données jusqu'à leur renouvellement : elles ne sont pas modifiées par cet export.", detect: () => true },
  { id: "messagerie", title: "Service d'envoi d'e-mails", action: "Le prestataire d'envoi (SMTP) conserve ses propres journaux de livraison : à demander auprès de lui si la personne les réclame.", detect: () => Boolean(process.env.SMTP_HOST) },
  { id: "paiement", title: "Prestataire de paiement", action: "Les données de paiement (carte, facturation bancaire) sont détenues par le prestataire de paiement, pas par Kolakisa : à demander auprès de lui.", detect: () => Boolean(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || process.env.STRIPE_API_KEY) },
];

module.exports = { collectors, externals };
