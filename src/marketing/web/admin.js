// Routes d'administration : tableau de bord, contacts, listes, étiquettes, propriétés, conformité.
// Chaque écriture passe par les services du module (jamais de SQL d'écriture ici) et vérifie la permission du rôle.
const express = require("express");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const audience = require("../audience");
const compliance = require("../compliance");
const sms = require("../sms");
const { getOverview } = require("../overview");
const segmentsService = require("../segments");
const { parseKey } = require("../security/crypto");
const { attempt, need, flashError, siteChoices } = require("./kit");
const sendtime = require("../sending/sendtime");
const core = require("../contactcore");
const automationsLib = require("../automations");

const PROFILE_FIELDS = ["first_name", "last_name", "phone", "company", "country", "language", "timezone"];
const pick = (body, keys) => Object.fromEntries(keys.filter((k) => typeof body[k] === "string").map((k) => [k, body[k]]));
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = ({ db }) => {
  const router = express.Router();
  const siteAccess = require("../contactcore/siteAccess");
  const requests = require("../contactcore/requests");

  // Charge la fiche ou répond 404 (identifiant non numérique, inconnu ou d'une autre organisation)
  const loadContact = (req, res) => {
    const id = intOrNull(req.params.id);
    let contact = id ? audience.getContact(req.mk.ctx, id) : null;
    // R7 : accès selon le site (contactcore/siteAccess) — lecture : contacts associés au site ; écriture (toute requête autre que GET) : contacts dont l'origine est ce site
    if (contact && req.mk.siteOnly) { const ok = req.method === "GET" ? siteAccess.canRead(req.mk.ctx, contact) : siteAccess.canWrite(req.mk.ctx, contact); if (!ok) contact = null; }
    if (!contact) res.status(404).render("error", { message: "Contact introuvable." });
    return contact;
  };

  // ---------- Accueil ----------
  router.get("/", need("contacts.read"), (req, res) => {
    let keyOk = true;
    try { parseKey(process.env.ENCRYPTION_KEY); } catch { keyOk = false; }
    const overview = getOverview(req.mk.ctx, { workerOn: process.env.MARKETING_WORKER === "on", smtpAvailable: Boolean(process.env.SMTP_HOST), keyOk, can: req.mk.can, days: req.query.periode });
    // Modèles proposés en bas de l'Accueil : les vrais modèles de l'organisation (aucun modèle fictif)
    let templates = [];
    try { if (req.mk.can("templates.read")) templates = require("../templates").listTemplates(req.mk.ctx).slice(0, 12); } catch { templates = []; }
    res.render("marketing/dashboard", { title: "Accueil", active: "dashboard", overview, templates });
  });

  // ---------- Contacts ----------
  // Paramètres de l'adresse (français) → critères de recherche ; toute valeur invalide est ignorée, jamais une erreur
  const contactQuery = (query, ctx, req = null) => {
    const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const q = text(query.q, 100);
    const status = audience.STATUSES.includes(query.status) ? query.status : undefined;
    const listId = intOrNull(query.liste);
    const tagId = intOrNull(query.etiquette);
    const source = text(query.source, 50);
    const sendable = query.joignables === "1";
    const sinceDays = [7, 30, 90].includes(Number(query.depuis)) ? Number(query.depuis) : undefined;
    // Segment enregistré : sa définition est compilée par le serveur ; un segment inconnu ou cassé est simplement ignoré
    let segmentId = intOrNull(query.segment);
    let custom;
    if (segmentId) {
      try {
        const saved = segmentsService.getSegment(ctx, segmentId);
        if (saved) custom = segmentsService.selectSql(ctx, saved.definition);
      } catch { custom = undefined; }
      if (!custom) segmentId = null;
    }
    // Contact Core (palier 15) : cycle de vie, état de la fiche (défaut : actives et inactives), site, consentement, dates, inactivité
    const lifecycle = Object.hasOwn(core.lifecycleStages(ctx), query.cycle) ? query.cycle : undefined;
    const etat = ["active", "inactive", "archived", "merged", "all"].includes(query.etat) ? query.etat : undefined;
    const siteQ = intOrNull(query.site);
    const consent = audience.CONSENT_FILTERS.includes(query.consentement) ? query.consentement : undefined;
    const ymdOk = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
    const createdFrom = ymdOk(query.cree_du), createdTo = ymdOk(query.cree_au);
    const inactiveDays = [30, 90, 180, 365].includes(Number(query.inactifs)) ? Number(query.inactifs) : undefined;
    // Accès limité à un site : le site est imposé par le serveur, jamais par l'adresse ; sans droit « données sensibles », la recherche ne porte que sur les noms
    const siteForced = req && req.mk.siteOnly ? req.mk.siteId : siteQ;
    const noSensitive = Boolean(req && !req.mk.can("contacts.view_sensitive"));
    const criteria = { ...(q && { q }), recordStatus: etat || "live", ...(noSensitive && { noSensitiveSearch: true }), ...(lifecycle && { lifecycle }), ...(siteForced && { siteId: siteForced }), ...(consent && { consent }), ...(createdFrom && { createdFrom }), ...(createdTo && { createdTo }), ...(inactiveDays && { inactiveDays }), ...(status && { status }), ...(listId && { listId }), ...(tagId && { tagId }), ...(source && { source }), ...(sendable && { sendable }), ...(sinceDays && { sinceDays }), ...(custom && { custom }) };
    const params = { ...(q && { q }), ...(status && { status }), ...(listId && { liste: listId }), ...(tagId && { etiquette: tagId }), ...(source && { source }), ...(sendable && { joignables: "1" }), ...(sinceDays && { depuis: sinceDays }), ...(segmentId && { segment: segmentId }),
      ...(lifecycle && { cycle: lifecycle }), ...(etat && { etat }), ...(siteQ && { site: siteQ }), ...(consent && { consentement: consent }), ...(createdFrom && { cree_du: createdFrom }), ...(createdTo && { cree_au: createdTo }), ...(inactiveDays && { inactifs: inactiveDays }) };
    return { criteria, params, filters: { cycle: lifecycle ?? "", etat: etat ?? "", site: siteQ ?? "", consentement: consent ?? "", cree_du: createdFrom ?? "", cree_au: createdTo ?? "", inactifs: inactiveDays ?? "", q, status: status ?? "", liste: listId ?? "", etiquette: tagId ?? "", source, joignables: sendable, depuis: sinceDays ?? "", segment: segmentId ?? "" } };
  };
  // Adresse de retour d'une action groupée : uniquement une page contacts du site (aucune redirection ouverte)
  const safeBack = (value) => (typeof value === "string" && /^\/marketing\/contacts(\?[A-Za-z0-9_%&=.+\-]*)?$/.test(value) ? value : "/marketing/contacts");

  router.get("/contacts", need("contacts.read"), (req, res) => {
    const { ctx } = req.mk;
    const { criteria, params, filters } = contactQuery(req.query, ctx, req);
    const result = audience.searchContacts(ctx, criteria, { sort: req.query.tri, dir: req.query.sens, page: req.query.page, pageSize: req.query.taille });
    const sensitiveOk = req.mk.can("contacts.view_sensitive");
    if (!sensitiveOk) result.rows = result.rows.map(core.maskContact);
    const defaultSort = result.sort === "created" && result.dir === "desc" && !req.query.tri;
    const view = { ...params, ...(req.query.tri && result.sort ? { tri: result.sort, sens: result.dir } : {}), ...(result.pageSize !== 50 && { taille: result.pageSize }) };
    // Adresse de la page avec des paramètres modifiés (null = retirer)
    const url = (changes = {}) => {
      const merged = { ...view, ...changes };
      const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false).map(([k, v]) => [k, String(v)]));
      const text = qs.toString();
      return `/marketing/contacts${text ? `?${text}` : ""}`;
    };
    const exportParams = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
    res.render("marketing/contacts", {
      title: "Contacts", active: "contacts", result, rows: result.rows, tagsOf: audience.tagsForContacts(ctx, result.rows.map((c) => c.id)), url, view, defaultSort,
      range: { from, to: from + result.rows.length - (result.total === 0 ? 0 : 1) }, filters, hasFilters: Object.keys(params).length > 0,
      exportUrl: `/marketing/contacts/export.csv${exportParams ? `?${exportParams}` : ""}`,
      lists: audience.listLists(ctx), tags: audience.listTags(ctx), statuses: audience.STATUSES, sensitiveOk, siteScoped: req.mk.siteOnly,
      lifecycles: core.lifecycleStages(ctx), recordLabels: core.RECORD_STATUS_LABELS, sitesList: req.mk.siteOnly ? [] : db.prepare(`SELECT id, name FROM mk_sites WHERE organization_id = ?${primarySite.excludeSql(db)} ORDER BY name`).all(ctx.organizationId), savedSegments: segmentsService.listSegments(ctx).map((x) => ({ id: x.id, name: x.name })),
      sources: db.prepare("SELECT DISTINCT source FROM mk_contacts WHERE organization_id = ? AND source <> '' ORDER BY source LIMIT 50").all(ctx.organizationId).map((r) => r.source),
    });
  });

  // Export CSV des contacts filtrés (administrateurs) — avant « /contacts/:id »
  router.get("/contacts/export.csv", need("contacts.export"), (req, res) => {
    if (!req.mk.can("contacts.view_sensitive")) return res.status(403).render("error", { message: "L'export contient adresses et numéros complets : il demande aussi le droit « voir les données sensibles des contacts »." });
    const { criteria } = contactQuery(req.query, req.mk.ctx, req);
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="contacts-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" });
    audience.exportContacts(req.mk.ctx, criteria, (chunk) => res.write(chunk));
    res.end();
  });

  // Actions groupées sur la sélection (éditeurs) : étiquette et liste. Aucun statut ni consentement n'est touché.
  router.post("/contacts/actions", need("contacts.write"), (req, res, next) => {
    const ids = [].concat(req.body.ids ?? []).flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter((v) => v !== "").map(Number);
    const op = String(req.body.op ?? "");
    const back = safeBack(req.body.back);
    attempt(req, res, next, back, () => {
      const { ctx } = req.mk;
      siteAccess.assertWritableIds(ctx, ids); // R7 : un accès limité à un site n'agit que sur les contacts dont l'origine est son site
      if (op === "tag_add" || op === "tag_remove") {
        const r = op === "tag_add" ? audience.bulkTag(ctx, ids, req.body.tag) : audience.bulkUntag(ctx, ids, req.body.tag);
        const name = String(req.body.tag).trim();
        const plural = (n) => `${n} contact${n > 1 ? "s" : ""}`;
        if (op === "tag_add") return `Étiquette « ${name} » ajoutée à ${plural(r.changed)}${r.changed < r.processed ? ` (${r.processed - r.changed} l'avaient déjà)` : ""}.`;
        return `Étiquette « ${name} » retirée de ${plural(r.changed)}${r.changed < r.processed ? ` (${r.processed - r.changed} ne l'avaient pas)` : ""}.`;
      }
      if (op === "list_add" || op === "list_remove") {
        const listId = intOrNull(req.body.list_id);
        if (!ids.length) return flashError(req, "Sélectionnez au moins un contact.");
        if (!ids.every((id) => Number.isInteger(id) && id > 0)) return flashError(req, "Sélection invalide.");
        const list = audience.getList(ctx, listId);
        if (!list) return flashError(req, "Liste introuvable.");
        if (op === "list_add") {
          const r = audience.addToList(ctx, list.id, ids);
          return `${r.added} contact${r.added > 1 ? "s" : ""} ajouté${r.added > 1 ? "s" : ""} à la liste « ${list.name} »${r.alreadyMembers ? ` (${r.alreadyMembers} déjà membre${r.alreadyMembers > 1 ? "s" : ""})` : ""}. Cela ne donne aucun consentement.`;
        }
        const removed = audience.removeFromList(ctx, list.id, ids);
        return `${removed} contact${removed > 1 ? "s" : ""} retiré${removed > 1 ? "s" : ""} de la liste « ${list.name} ».`;
      }
      return flashError(req, "Action inconnue.");
    });
  });

  router.get("/contacts/nouveau", need("contacts.write"), (req, res) => res.render("marketing/contact-new", { title: "Nouveau contact", active: "contacts" }));

  router.post("/contacts", need("contacts.write"), (req, res, next) => {
    let created = null;
    // Réussite : vers la fiche du nouveau contact ; erreur : retour au formulaire avec le message.
    // R7 : pour un accès LIMITÉ à un site, la réponse est la même que l'adresse soit nouvelle ou déjà connue d'un autre site (retour à la liste, même message) : aucune
    // fiche n'est exposée et l'existence d'une adresse protégée n'est pas confirmée. Une adresse déjà visible de son site garde le message « existe déjà ».
    const target = () => {
      const q = req.mk.siteOnly ? `?site=${req.mk.siteId}` : "";
      if (created === null) return `/marketing/contacts/nouveau${q}`;
      return req.mk.siteOnly ? `/marketing/contacts${q}` : `/marketing/contacts/${created.id}`;
    };
    attempt(req, res, next, target, () => {
      if (req.mk.siteOnly) requests.guard(req.mk.ctx); // limite de débit par site : même refus quel que soit le résultat de la création
      const out = audience.upsertContact(req.mk.ctx, { email: req.body.email, ...pick(req.body, PROFILE_FIELDS), source: "manual" }, { failIfExists: true });
      // R7 lot 5 : adresse déjà connue d'un autre site → demande mise en file (même réponse visible que pour une création) ; adresse nouvelle → créée tout de suite
      if (req.mk.siteOnly && out.withheld) requests.enqueue(req.mk.ctx, { email: req.body.email, source: "admin" });
      created = req.mk.siteOnly ? { masked: true } : out.contact;
      return req.mk.siteOnly ? "Contact enregistré." : "Contact créé.";
    });
  });

  router.get("/contacts/:id", need("contacts.read"), (req, res) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    const { ctx } = req.mk;
    const defs = audience.listProperties(ctx);
    // Chaque audience avec l'état d'abonnement du contact DANS cette audience (palier 16)
    const memberOf = audience.subscriptionsOf(ctx, contact.id).map((x) => ({ id: x.list_id, name: x.name, state: x.state, stateLabel: audience.STATES[x.state] }));
    // Contact Core (palier 15) : sans le droit « données sensibles », adresse et numéro sont masqués et les preuves détaillées ne sont pas montrées
    const sensitiveOk = req.mk.can("contacts.view_sensitive");
    const siteLimit = req.mk.siteOnly ? req.mk.siteId : null;
    const eventsPage = req.mk.can("events.view") ? core.eventsOf(ctx, contact.id, { before: intOrNull(req.query.avant), limit: 20, siteId: siteLimit }) : null;
    const absorbed = db.prepare("SELECT id, email, created_at FROM mk_contacts WHERE organization_id = ? AND merged_into_id = ? ORDER BY id").all(ctx.organizationId, contact.id).map((a) => (sensitiveOk ? a : { ...a, email: core.maskEmail(a.email) }));
    const aliases = db.prepare("SELECT email, created_at FROM mk_contact_aliases WHERE organization_id = ? AND contact_id = ? ORDER BY id").all(ctx.organizationId, contact.id).map((a) => (sensitiveOk ? a : { ...a, email: core.maskEmail(a.email) }));
    const mergedInto = contact.merged_into_id ? audience.getContact(ctx, contact.merged_into_id) : null;
    res.render("marketing/contact", {
      commerce: req.mk.can("events.view") && !req.mk.siteOnly ? require("../bridge/commerce").commerceOf(ctx, contact) : null,
      journeys: req.mk.can("events.view") ? require("../funnels/events").contactJourney(ctx, contact.id, { siteId: siteLimit }) : null,
      autoRuns: req.mk.can("automations.read") ? automationsLib.contactRuns(ctx, contact.id) : null,
      sensitiveOk, eventsPage, absorbed, aliases, mergedInto: mergedInto ? { id: mergedInto.id, email: sensitiveOk ? mergedInto.email : core.maskEmail(mergedInto.email) } : null,
      lifecycles: core.lifecycleStages(ctx), recordLabels: core.RECORD_STATUS_LABELS, originSite: contact.origin_site_id ? db.prepare(`SELECT id, name FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(contact.origin_site_id, ctx.organizationId) : null,
      absorbedProofs: absorbed.length && sensitiveOk ? core.consentProofs(ctx, contact.id, { limit: 50 }).filter((k) => k.contact_id !== contact.id) : [],
      title: sensitiveOk ? contact.email : core.maskEmail(contact.email), active: "contacts", contact: sensitiveOk ? contact : core.maskContact(contact), defs, values: audience.getContactProperties(ctx, contact.id), tags: audience.tagsOf(ctx, contact.id),
      memberOf, allLists: audience.listLists(ctx), history: compliance.consentHistory(ctx, contact.id), preferences: compliance.preferencesOf(ctx, contact.id),
      sendable: compliance.isSendable(ctx, contact.id), smsSendable: sms.isSmsSendable(ctx, contact.id), smsPhoneMasked: sms.maskPhone(contact.sms_phone),
      summary: audience.contactSummary(ctx, contact.id), timeline: audience.contactTimeline(ctx, contact.id, { limit: 50 }), score: require("../scoring").contactScore(ctx, contact.id),
      // Compte KOLAKISA lié (relation, formations, achats) : fourni par server.js, absent si le pont CRM n'est pas branché
      lms: req.app.locals.crm ? req.app.locals.crm.lmsOfContact(req.session.user.id, contact) : null, relations: req.app.locals.crm ? req.app.locals.crm.RELATIONS : {},
      // Fuseau réellement utilisé pour l'envoi à l'heure locale, et d'où il vient (contact, compte, pays, défaut)
      zone: sendtime.contactZones(ctx, [contact.id])[contact.id], zoneBasis: sendtime.BASIS_LABELS, timeZones: sendtime.timeZoneList(),
      files: require("../forms").contactFiles(ctx, contact.id),
    });
  });
  // Fichier envoyé par un formulaire : uniquement pour l'équipe (droit de lecture des contacts), jamais mis en cache,
  // téléchargé (jamais affiché dans la page : un fichier envoyé par un inconnu n'est jamais interprété par le navigateur)
  router.get("/contacts/:id/fichiers/:fileId", need("contacts.read"), (req, res) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    const file = /^\d{1,12}$/.test(req.params.fileId) ? require("../forms").formFile(req.mk.ctx, Number(req.params.fileId)) : null;
    if (!file || file.contact_id !== contact.id) return res.status(404).render("error", { message: "Fichier introuvable." });
    res.set({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" });
    res.download(file.abs, file.original_name, (error) => { if (error && !res.headersSent) res.status(404).render("error", { message: "Fichier absent du serveur." }); });
  });

  router.post("/contacts/:id", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      audience.updateContact(req.mk.ctx, contact.id, pick(req.body, PROFILE_FIELDS)); // e-mail et statut : jamais lus depuis le formulaire
      return "Contact mis à jour.";
    });
  });

  router.post("/contacts/:id/proprietes", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      const values = {};
      for (const def of audience.listProperties(req.mk.ctx)) {
        const raw = req.body[`prop_${def.key}`];
        if (typeof raw === "string") values[def.key] = raw;
      }
      audience.setContactProperties(req.mk.ctx, contact.id, values);
      return "Propriétés enregistrées.";
    });
  });

  router.post("/contacts/:id/etiquettes", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      audience.tagContact(req.mk.ctx, contact.id, req.body.name);
      return "Étiquette ajoutée.";
    });
  });
  router.post("/contacts/:id/etiquettes/retirer", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      audience.untagContact(req.mk.ctx, contact.id, req.body.name);
      return "Étiquette retirée.";
    });
  });

  router.post("/contacts/:id/listes", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      audience.addToList(req.mk.ctx, intOrNull(req.body.list_id), [contact.id]);
      return "Contact ajouté à la liste (cela ne donne aucun consentement).";
    });
  });
  router.post("/contacts/:id/listes/retirer", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      audience.removeFromList(req.mk.ctx, intOrNull(req.body.list_id), [contact.id]);
      return "Contact retiré de la liste.";
    });
  });

  // Consentement saisi par l'équipe (preuve obligatoire). Ne réabonne jamais un désinscrit ni une adresse bloquée.
  router.post("/contacts/:id/consentement", need("compliance.manage"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      const result = compliance.recordConsent(req.mk.ctx, contact.id, { source: "admin", textShown: req.body.text });
      if (!result.ok && result.reason === "unsubscribed") return flashError(req, "Ce contact s'est désinscrit : seule la personne elle-même peut se réabonner (centre de préférences ou formulaire).");
      if (!result.ok) return flashError(req, "Cette adresse est bloquée (rebond, plainte ou blocage manuel) : elle ne peut pas être abonnée.");
      return result.already ? "Ce contact était déjà abonné." : "Consentement enregistré : le contact est abonné.";
    });
  });

  router.post("/contacts/:id/desinscrire", need("contacts.write"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      const r = compliance.unsubscribe(req.mk.ctx, contact.id, { source: "admin" });
      return r.already ? "Ce contact était déjà désinscrit." : "Contact désinscrit.";
    });
  });

  router.post("/contacts/:id/supprimer-adresse", need("compliance.manage"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    attempt(req, res, next, `/marketing/contacts/${contact.id}`, () => {
      const r = compliance.addSuppression(req.mk.ctx, { email: contact.email, reason: "manual", note: req.body.note });
      return r.added ? "Adresse bloquée : plus aucun envoi marketing." : "Cette adresse était déjà bloquée.";
    });
  });

  router.post("/contacts/:id/effacer", need("contacts.delete"), (req, res, next) => {
    const contact = loadContact(req, res);
    if (!contact) return;
    if (req.body.confirm !== "on") {
      flashError(req, "Cochez la case de confirmation pour effacer définitivement ce contact.");
      return res.redirect(`/marketing/contacts/${contact.id}`);
    }
    attempt(req, res, next, "/marketing/contacts", () => {
      audience.deleteContact(req.mk.ctx, contact.id, { suppress: req.body.suppress === "on" });
      return "Contact effacé définitivement.";
    });
  });

  // ---------- Listes ----------
  const LIST_SORT_KEYS = ["name", "contacts", "sendable", "created"];
  router.get("/listes", need("lists.read"), (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
    const sort = LIST_SORT_KEYS.includes(req.query.tri) ? req.query.tri : null;
    const dir = req.query.sens === "asc" || req.query.sens === "desc" ? req.query.sens : null;
    const lists = audience.listListsWithStats(req.mk.ctx, { q, sort, dir });
    // Adresse de la page avec des paramètres modifiés (null = retirer) — même logique que /contacts
    const url = (changes = {}) => {
      const merged = { q: q || undefined, tri: req.query.tri, sens: req.query.sens, ...changes };
      const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => [k, String(v)]));
      const text = qs.toString();
      return `/marketing/listes${text ? `?${text}` : ""}`;
    };
    res.render("marketing/lists", { title: "Listes", active: "lists", lists, q, sort, dir, url, hasQuery: Boolean(q), ...siteChoices(req) });
  });

  router.post("/listes", need("lists.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/listes", () => {
      audience.createList(req.mk.ctx, { name: req.body.name, description: req.body.description, siteId: req.body.site });
      return "Liste créée.";
    }));

  const loadList = (req, res) => {
    const id = intOrNull(req.params.id);
    const list = id ? audience.getList(req.mk.ctx, id) : null;
    if (!list) res.status(404).render("error", { message: "Liste introuvable." });
    return list;
  };

  router.get("/listes/:id", need("lists.read"), (req, res) => {
    const list = loadList(req, res);
    if (!list) return;
    const etat = Object.hasOwn(audience.STATES, req.query.etat) ? req.query.etat : "";
    const page = audience.listSubscribers(req.mk.ctx, list.id, { state: etat || undefined, limit: 50, afterId: intOrNull(req.query.apres) ?? undefined });
    const stats = audience.listListsWithStats(req.mk.ctx).find((l) => l.id === list.id);
    const sensitiveOk = req.mk.can("contacts.view_sensitive");
    res.render("marketing/list", {
      title: list.name, active: "lists", list, rows: sensitiveOk ? page.rows : page.rows.map((r) => ({ ...require("../contactcore").maskContact(r), subscription_state: r.subscription_state })),
      nextUrl: page.nextAfterId ? `/marketing/listes/${list.id}?${etat ? `etat=${etat}&` : ""}apres=${page.nextAfterId}` : null,
      count: stats.member_count, sendableCount: stats.sendable_count, etat, stateCounts: audience.stateCounts(req.mk.ctx, list.id), STATES: audience.STATES,
    });
  });

  router.post("/listes/:id/ajouter", need("lists.write"), (req, res, next) => {
    const list = loadList(req, res);
    if (!list) return;
    attempt(req, res, next, `/marketing/listes/${list.id}`, () => {
      const lines = String(req.body.emails ?? "").split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 500);
      const ids = [];
      const unknown = [];
      const invalid = [];
      for (const line of lines) {
        const check = audience.validateEmail(line);
        if (!check.ok) { invalid.push(line.slice(0, 60)); continue; }
        const c = audience.findByEmail(req.mk.ctx, check.email);
        if (c) ids.push(c.id); else unknown.push(check.email);
      }
      const r = ids.length ? audience.addToList(req.mk.ctx, list.id, ids) : { added: 0, alreadyMembers: 0 };
      const parts = [`${r.added} contact${r.added > 1 ? "s" : ""} ajouté${r.added > 1 ? "s" : ""}.`];
      if (r.alreadyMembers) parts.push(`${r.alreadyMembers} déjà dans la liste.`);
      if (unknown.length) parts.push(`Introuvables (créez-les ou importez-les d'abord) : ${unknown.slice(0, 10).join(", ")}.`);
      if (invalid.length) parts.push(`Invalides : ${invalid.slice(0, 10).join(", ")}.`);
      return parts.join(" ");
    });
  });

  router.post("/listes/:id/retirer", need("lists.write"), (req, res, next) => {
    const list = loadList(req, res);
    if (!list) return;
    attempt(req, res, next, `/marketing/listes/${list.id}`, () => {
      audience.removeFromList(req.mk.ctx, list.id, [intOrNull(req.body.contact_id)].filter(Boolean));
      return "Contact retiré de la liste.";
    });
  });

  router.post("/listes/:id/supprimer", need("lists.write"), (req, res, next) => {
    const list = loadList(req, res);
    if (!list) return;
    attempt(req, res, next, "/marketing/listes", () => {
      audience.deleteList(req.mk.ctx, list.id);
      return "Liste supprimée (les contacts restent).";
    });
  });

  // ---------- Étiquettes ----------
  router.get("/etiquettes", need("lists.read"), (req, res) => res.render("marketing/tags", { title: "Étiquettes", active: "tags", tags: audience.listTags(req.mk.ctx) }));
  router.post("/etiquettes", need("lists.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/etiquettes", () => {
      audience.ensureTag(req.mk.ctx, req.body.name);
      return "Étiquette enregistrée.";
    }));
  router.post("/etiquettes/:id/supprimer", need("lists.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/etiquettes", () => {
      audience.deleteTag(req.mk.ctx, intOrNull(req.params.id));
      return "Étiquette supprimée (les contacts restent).";
    }));

  // ---------- Propriétés personnalisées ----------
  router.get("/proprietes", need("contacts.read"), (req, res) => res.render("marketing/properties", { title: "Propriétés", active: "properties", defs: audience.listProperties(req.mk.ctx), types: audience.TYPES, usage: audience.propertyUsage(req.mk.ctx) }));
  router.post("/proprietes", need("contacts.manage_fields"), (req, res, next) =>
    attempt(req, res, next, "/marketing/proprietes", () => {
      const options = String(req.body.options ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      audience.defineProperty(req.mk.ctx, { key: req.body.key, label: req.body.label, type: req.body.type, options });
      return "Propriété créée.";
    }));

  // ---------- Référence du design system (administrateurs) ----------
  router.get("/composants", need("settings.read"), (req, res) => res.render("marketing/components", { title: "Composants", active: "components" }));

  // ---------- Conformité ----------
  const SUPPRESSION_REASONS = ["bounced", "complained", "manual"]; // valeurs réelles de mk_suppressions.reason (voir suppression.js)
  router.get("/conformite", need("compliance.read"), (req, res) => {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 254) : "";
    const reason = SUPPRESSION_REASONS.includes(req.query.motif) ? req.query.motif : "";
    const page = compliance.listSuppressions(req.mk.ctx, { limit: 50, afterId: intOrNull(req.query.apres) ?? undefined, q, reason });
    res.render("marketing/compliance", {
      title: "Conformité", active: "compliance", suppressions: page.rows,
      nextUrl: page.nextAfterId ? `/marketing/conformite?${new URLSearchParams({ ...(q && { q }), ...(reason && { motif: reason }), apres: page.nextAfterId }).toString()}` : null,
      categories: compliance.listCategories(req.mk.ctx), q, reason, hasQuery: Boolean(q || reason),
    });
  });
  router.post("/conformite/suppression", need("compliance.manage"), (req, res, next) =>
    attempt(req, res, next, "/marketing/conformite", () => {
      const r = compliance.addSuppression(req.mk.ctx, { email: req.body.email, reason: "manual", note: req.body.note });
      return r.added ? "Adresse bloquée : plus aucun envoi marketing." : "Cette adresse était déjà bloquée.";
    }));
  router.post("/conformite/suppression/retirer", need("compliance.manage"), (req, res, next) =>
    attempt(req, res, next, "/marketing/conformite", () => {
      const r = compliance.removeSuppression(req.mk.ctx, req.body.email);
      return r.removed ? "Blocage retiré : l'adresse reste désinscrite tant que la personne ne se réabonne pas elle-même." : "Adresse introuvable dans la liste.";
    }));
  router.post("/conformite/categories", need("compliance.manage"), (req, res, next) =>
    attempt(req, res, next, "/marketing/conformite", () => {
      compliance.createCategory(req.mk.ctx, { key: req.body.key, label: req.body.label, description: req.body.description });
      return "Catégorie créée.";
    }));

  return router;
};
