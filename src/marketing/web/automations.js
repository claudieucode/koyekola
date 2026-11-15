// Pages des scénarios d'automatisation et du flux d'événements. L'activation exige le droit « automations.activate » (administrateur).
const express = require("express");
const auto = require("../automations");
const templates = require("../templates");
const segments = require("../segments");
const { fieldCatalog } = require("../segments/catalog");
const audience = require("../audience");
const { listTags } = require("../audience/tags");
const sendingConfig = require("../sending/config");
const { getSmsConfig } = require("../sms/config");
const bridge = require("../bridge/events");
const abandon = require("../funnels/abandon");
const journeys = require("../automations/journeys");
const { MarketingError } = require("../errors");
const { attempt, need, safeJson } = require("./kit");

// Listes proposées pour filtrer un déclencheur (identifiants en texte : c'est ainsi qu'ils sont comparés)
function triggerChoices(ctx) {
  const pagesList = require("../pages").listPages(ctx).map((p) => [String(p.id), `${p.name} (/p/${p.slug})`]);
  const funnelLib = require("../funnels");
  const funnels = funnelLib.listFunnels(ctx).map((f) => funnelLib.getFunnel(ctx, f.id));
  return {
    pages: pagesList,
    funnels: funnels.map((f) => [String(f.id), f.name]),
    funnelSteps: funnels.flatMap((f) => f.steps.map((s, i) => [String(s.id), `${f.name} — étape ${i + 1} : ${s.name}`])),
    forms: require("../forms").listForms(ctx).map((f) => [String(f.id), f.name]),
    courses: require("../bridge/catalog").listCourses(ctx).map((c) => [String(c.id), c.title]),
    scoreLevels: require("../scoring").levels(ctx).map((l) => [String(l.id), `${l.name} (à partir de ${l.min_score} points)`]),
  };
}

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const STATUS = { draft: ["Brouillon", "badge-muted"], active: ["Actif", "badge-success"], paused: ["En pause", "badge-warning"] };
const RUN_STATUS = { running: "en cours", completed: "terminé", exited: "sorti", failed: "en échec" };
const { WORKER_DETAIL, workerHuman } = require("../workerNotice");
const workerOn = () => process.env.MARKETING_WORKER === "on";

// Adresse de la bibliothèque avec ses filtres (pour les liens « catégorie », « afficher plus », favoris) : valeurs vides omises
const LIBRARY_KEYS = ["q", "categorie", "canal", "objectif", "declencheur", "audience", "statut", "etapes", "vue", "tri", "page"];
const libraryQuery = (q, override = {}) => {
  const merged = { ...q, ...override };
  const parts = LIBRARY_KEYS.filter((k) => merged[k] !== undefined && merged[k] !== "" && merged[k] !== null && !(k === "vue" && merged[k] === "tous") && !(k === "page" && Number(merged[k]) === 1)).map((k) => `${k}=${encodeURIComponent(merged[k])}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

module.exports = ({ db }) => {
  const router = express.Router();

  router.get("/automatisations", need("automations.read"), (req, res) => {
    res.render("marketing/automations", { title: "Automatisations", active: "automations", automations: auto.listAutomations(req.mk.ctx), triggers: auto.TRIGGERS, STATUS, workerOn: workerOn() });
  });

  router.post("/automatisations", need("automations.write"), (req, res, next) => {
    let created = null;
    // Un événement personnalisé tapé dans le champ libre remplace le choix du menu déroulant (jamais l'inverse) :
    // le menu reste rempli même quand on tape un événement personnalisé, pas besoin de JavaScript pour les distinguer.
    const customEvent = String(req.body.trigger_event_custom || "").trim();
    attempt(req, res, next, () => (created ? `/marketing/automatisations/${created.id}` : "/marketing/automatisations"), () => {
      created = auto.createAutomation(req.mk.ctx, { name: req.body.name, kind: req.body.kind, triggerEvent: customEvent || req.body.trigger_event, siteId: req.body.site });
      return "Scénario créé : ajoutez ses étapes puis activez-le.";
    });
  });

  // ---------- Historique de tous les passages (palier 17) ----------
  // Avant « /automatisations/:id » : « historique » n'est pas un identifiant.
  router.get("/automatisations/historique", need("automations.read"), (req, res) => {
    const { ctx } = req.mk;
    const text = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
    const f = { automation: intOrNull(req.query.scenario), status: auto.STATUSES.includes(req.query.etat) ? req.query.etat : "", q: text(req.query.q, 100), from: text(req.query.du, 10), to: text(req.query.au, 10), onlyErrors: req.query.erreurs === "1" };
    const result = auto.runHistory(ctx, { automationId: f.automation ?? undefined, status: f.status, q: f.q, from: f.from, to: f.to, onlyErrors: f.onlyErrors, page: req.query.page });
    const sensitiveOk = req.mk.can("contacts.view_sensitive");
    if (!sensitiveOk) result.rows = result.rows.map((r) => ({ ...r, contact: { ...r.contact, email: require("../contactcore").maskEmail(r.contact.email) } }));
    const qs = (over = {}) => { const m = { scenario: f.automation, etat: f.status, q: f.q, du: f.from, au: f.to, erreurs: f.onlyErrors ? "1" : "", ...over }; const p = new URLSearchParams(Object.entries(m).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString(); return `/marketing/automatisations/historique${p ? `?${p}` : ""}`; };
    res.render("marketing/automations-history", { title: "Historique des passages", active: "automations", result, rows: result.rows, f, qs, STATUS_LABELS: auto.STATUS_LABELS, automations: auto.listAutomations(ctx).map((a) => ({ id: a.id, name: a.name })), sensitiveOk });
  });

  // ---------- Parcours tout prêts (comme les « Pre-built journeys » de Mailchimp) ----------
  // Avant « /automatisations/:id » : « parcours » n'est pas un identifiant. Création = brouillon complet dans l'éditeur.
  router.get("/automatisations/parcours", need("automations.read"), (req, res) => {
    const lib = journeys.browseLibrary(req.mk.ctx, req.query, { workerOn: workerOn() });
    res.render("marketing/journeys", { title: "Parcours tout prêts", active: "journeys", lib, qs: libraryQuery });
  });
  // Favori (personnel) : bascule puis retour sur la liste, filtres conservés. N'écrit que dans mk_journey_favorites.
  // Aperçu réel d'un e-mail du parcours (HTML d'exemple, sans script) : affiché dans un cadre isolé (sandbox) par les cartes et la fiche.
  router.get("/automatisations/parcours/:key/email/:n(\\d{1,2})", need("automations.read"), (req, res, next) => {
    try {
      const html = journeys.emailPreview(req.mk.ctx, req.params.key, Number(req.params.n));
      if (html === null) return res.status(404).type("text/plain").send("Aperçu introuvable.");
      res.set({ "Content-Security-Policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:; sandbox", "X-Frame-Options": "SAMEORIGIN", "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" });
      res.type("html").send(html);
    } catch (error) { next(error); }
  });
  router.post("/automatisations/parcours/:key/favori", need("automations.read"), (req, res, next) => {
    try {
      if (!journeys.byKey(req.params.key)) return res.status(404).render("error", { message: "Parcours introuvable." });
      journeys.toggleFavorite(req.mk.ctx, req.params.key);
      const back = String(req.body.retour || "");
      res.redirect(/^\/marketing\/automatisations\/parcours(\/[a-z0-9-]+)?(\?[A-Za-z0-9=&%_.+-]*)?(#[a-z0-9-]+)?$/.test(back) ? back : "/marketing/automatisations/parcours");
    } catch (error) { next(error); }
  });
  router.get("/automatisations/parcours/:key", need("automations.read"), (req, res) => {
    // Formations proposées au sélecteur : lues ici (couche web), jamais par le module marketing lui-même
    const courses = db.prepare("SELECT id, title FROM courses ORDER BY title COLLATE NOCASE LIMIT 300").all();
    const journey = journeys.detailFor(req.mk.ctx, req.params.key, { workerOn: workerOn(), courses });
    if (!journey) return res.status(404).render("error", { message: "Parcours introuvable." });
    res.render("marketing/journey", { title: journey.label, active: "journeys", journey, workerOn: workerOn() });
  });
  router.post("/automatisations/parcours/:key", need("automations.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/automatisations/${created.id}` : `/marketing/automatisations/parcours/${encodeURIComponent(req.params.key)}`), () => {
      const courseId = intOrNull(req.body.formation);
      if (courseId && !db.prepare("SELECT 1 FROM courses WHERE id = ?").get(courseId)) throw new MarketingError("not_found", "Formation introuvable.");
      created = journeys.createJourney(req.mk.ctx, req.params.key, { listId: req.body.liste, courseId, siteId: req.body.site });
      const n = created.steps.filter((s) => s.type === "email").length;
      const k = created.steps.filter((s) => s.type === "sms").length;
      if (!n) return `Parcours créé en brouillon avec ${k} SMS. Relisez chaque SMS (cliquez sur l'étape), ajustez les délais si besoin, puis activez-le : rien n'est envoyé avant.`;
      return `Parcours créé en brouillon avec ${n} e-mail${n > 1 ? "s" : ""}${k ? ` et ${k} SMS` : ""} (modèles « ${created.name.replace(/^Parcours · /, "")} »). Relisez chaque e-mail, ajustez les délais si besoin, puis activez-le : rien n'est envoyé avant.`;
    });
  });

  const load = (req, res) => {
    const id = intOrNull(req.params.id);
    const automation = id ? auto.getAutomation(req.mk.ctx, id) : null;
    if (!automation) res.status(404).render("error", { message: "Scénario introuvable." });
    return automation;
  };

  router.get("/automatisations/:id", need("automations.read"), (req, res) => {
    const a = load(req, res);
    if (!a) return;
    const { ctx } = req.mk;
    const locked = a.status === "active" || !req.mk.can("automations.write");
    const payload = {
      readOnly: locked,
      automation: { id: a.id, name: a.name, kind: a.kind, status: a.status, triggerEvent: a.trigger_event, triggerFilter: a.triggerFilter, triggers: a.triggers, steps: a.steps, error: a.error },
      // Le canevas déjà enregistré (positions dessinées par la personne) prime ; sinon on en calcule un à la volée
      // à partir des étapes existantes (première ouverture d'un scénario créé avant cette phase).
      canvas: a.canvas || auto.stepsToGraph({ steps: a.steps, triggers: a.triggers, triggerEvent: a.trigger_event, triggerFilter: a.triggerFilter }),
      templates: templates.listTemplates(ctx).filter((t) => t.kind === a.kind).map((t) => ({ id: t.id, name: t.name, kind: t.kind, subject: t.subject })),
      lists: audience.listLists(ctx).map((l) => ({ id: l.id, name: l.name })),
      // Expéditeur réel (réglages d'envoi), affiché dans la configuration d'une étape « Envoyer un e-mail »
      sender: (({ provider, from, replyTo }) => ({ provider, from, replyTo }))(sendingConfig.getSendingConfig(ctx)),
      // Étiquettes existantes : proposées dans « Ajouter / Retirer une étiquette » (une nouvelle reste possible à l'ajout)
      tags: listTags(ctx).map((t) => t.name),
      segments: segments.listSegments(ctx).map((s) => ({ id: s.id, name: s.name, definition: s.definition })),
      // Webhooks configurés (adresse réduite à son domaine : jamais le secret ni le chemin complet) : cibles de l'étape « Envoyer vers un webhook »
      webhooks: require("../webhooks/endpoints").listEndpoints(ctx).map((w) => { let host = ""; try { host = new URL(w.url).host; } catch { host = ""; } return { id: w.id, name: w.name, host, enabled: w.enabled }; }),
      // Membres de l'équipe (destinataires de l'étape « Notifier l'équipe ») : jamais une adresse saisie librement
      team: ctx.db.prepare("SELECT u.id, u.username, u.email FROM mk_org_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? AND u.email IS NOT NULL AND u.email <> '' ORDER BY u.username").all(ctx.organizationId).map((u) => ({ id: u.id, name: u.username, email: u.email })),
      // Autres scénarios : cibles des étapes « Démarrer / Arrêter un autre scénario »
      automations: auto.listAutomations(ctx).filter((x) => x.id !== a.id).map((x) => ({ id: x.id, name: x.name, status: x.status })),
      // Propriétés personnalisées de type date : proposées par l'étape « Attendre une date ou une heure » (champ date du contact)
      // Toutes les propriétés personnalisées (clé, libellé, type) : étapes « Copier un champ », « Définir une date », « Calculer un nombre »
      properties: audience.listProperties(ctx).map((p) => ({ key: p.key, label: p.label, type: p.type })),
      dateProperties: audience.listProperties(ctx).filter((p) => p.type === "date").map((p) => ({ key: p.key, label: p.label })),
      // Catalogue des champs/comparateurs : permet de construire une condition ET/OU directement dans le panneau
      // du nœud (src/editor/automation-flow.js), sans devoir d'abord enregistrer un segment séparé.
      segmentCatalog: fieldCatalog(ctx),
      // Actions du registre avec leur disponibilité RÉELLE (connexion requise ?) : la palette l'affiche, jamais une action muette
      actions: auto.describeActions(ctx),
      triggers: auto.TRIGGERS,
      // Choix des filtres de déclencheur : vraies pages, étapes de tunnels, tunnels et formulaires
      choices: triggerChoices(ctx),
      // Étape « Envoyer un SMS » : expéditeur, limite facturée et heures de silence réels (réglages SMS), pour le compteur
      sms: (({ provider, sender, maxSegments, quietStart, quietEnd }) => ({ provider, sender, maxSegments, quietStart, quietEnd, baseUrl: process.env.SITE_URL || "" }))(getSmsConfig(ctx)),
    };
    res.render("marketing/automation", {
      title: a.name, active: "automations", a, SOURCE_LABELS: auto.SOURCE_LABELS, sourceOf: auto.sourceOf,
      TRIGGER_NAMES: Object.fromEntries(Object.entries(auto.TRIGGERS).map(([k, v]) => [k, v.label])),
      GOAL_EVENTS: ["purchase.completed", "lms.order_completed", "funnel.completed", "contact.subscribed", "email.clicked"].filter((k) => auto.TRIGGERS[k]).map((k) => ({ value: k, label: auto.TRIGGERS[k].label })), STATUS, RUN_STATUS, STEP_LABELS: auto.STEP_LABELS, data: safeJson(payload), locked,
      check: a.status === "active" ? null : auto.automationPreflight(ctx, a.id, { workerOn: workerOn(), smtpAvailable: Boolean(process.env.SMTP_HOST) }),
      // Palier 25 (A25-02) : un scénario ACTIF garde l'avertissement « console » (le contrôle avant activation n'est plus affiché, mais rien ne part vraiment tant que le fournisseur est « console »)
      activeNotes: a.status === "active" ? auto.automationPreflight(ctx, a.id, { workerOn: workerOn(), smtpAvailable: Boolean(process.env.SMTP_HOST) }).warnings.filter((w) => w.code === "provider_console") : [],
      versions: auto.listVersions(ctx, a.id), canSimulate: req.mk.can("automations.write") && req.mk.can("contacts.read"),
      stats: auto.automationStats(ctx, a.id), revenue: require("../revenue").automationRevenue(ctx, a.id), runs: auto.listRuns(ctx, a.id, { limit: 50 }).map((r) => (req.mk.can("contacts.view_sensitive") ? r : { ...r, email: require("../contactcore").maskEmail(r.email) })),
    });
  });

  // Simulation sur un contact réel : lecture seule, rien n'est envoyé ni modifié (palier 17). Réservée à qui peut modifier le scénario et voir les contacts.
  router.get("/automatisations/:id/simulation", need("automations.write"), async (req, res, next) => {
    const a = load(req, res);
    if (!a) return;
    if (!req.mk.can("contacts.read")) return res.status(403).render("error", { message: "La simulation lit les données d'un contact : le droit « voir les contacts » est nécessaire." });
    const { ctx } = req.mk;
    const raw = typeof req.query.contact === "string" ? req.query.contact.trim().slice(0, 254) : "";
    let report = null, error = null, contact = null;
    try {
      if (raw) {
        contact = /^\d{1,12}$/.test(raw) ? audience.getContact(ctx, Number(raw)) : audience.findByEmail(ctx, raw);
        // accès limité à un site : seulement un contact de CE site
        if (contact && Number.isInteger(ctx.siteScope) && !(contact.origin_site_id === ctx.siteScope || db.prepare("SELECT 1 FROM mk_events WHERE organization_id = ? AND contact_id = ? AND site_id = ? LIMIT 1").get(ctx.organizationId, contact.id, ctx.siteScope))) contact = null;
        if (!contact) error = "Aucun contact ne correspond (adresse e-mail exacte ou numéro de fiche).";
        else report = await auto.dryRun(ctx, a, contact.id);
      }
    } catch (e) { if (!(e instanceof MarketingError)) return next(e); error = e.message; }
    const sensitiveOk = req.mk.can("contacts.view_sensitive");
    res.render("marketing/automation-simulation", { title: `Simulation — ${a.name}`, active: "automations", a, STATUS, report, error, raw: sensitiveOk ? raw : "", contact: contact ? { id: contact.id, email: sensitiveOk ? contact.email : require("../contactcore").maskEmail(contact.email) } : null });
  });

  // Détail d'un passage (journal pas à pas — mk_automation_log, déjà alimenté par le moteur mais jusqu'ici jamais affiché)
  router.get("/automatisations/:id/passages/:runId", need("automations.read"), (req, res, next) => {
    const a = load(req, res);
    if (!a) return;
    const runId = intOrNull(req.params.runId);
    if (!runId) return res.status(404).render("error", { message: "Passage introuvable." });
    try {
      const { run, steps, log } = auto.runDetail(req.mk.ctx, a.id, runId);
      res.render("marketing/automation-run", { title: `Passage — ${a.name}`, active: "automations", a, STATUS, RUN_STATUS, STEP_LABELS: auto.STEP_LABELS, run, steps, log });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(404).render("error", { message: error.message });
      next(error);
    }
  });

  // Dupliquer : toujours un nouveau brouillon indépendant, jamais actif, jamais les passages de l'original
  router.post("/automatisations/:id/dupliquer", need("automations.write"), (req, res, next) => {
    const a = load(req, res);
    if (!a) return;
    let copy = null;
    attempt(req, res, next, () => (copy ? `/marketing/automatisations/${copy.id}` : `/marketing/automatisations/${a.id}`), () => {
      copy = auto.duplicateAutomation(req.mk.ctx, a.id);
      return `Scénario dupliqué : « ${copy.name} ».`;
    });
  });

  // Enregistrement depuis l'éditeur (JSON) : toute erreur métier → 400 avec le message (numéro d'étape compris)
  router.post("/automatisations/:id", need("automations.write"), (req, res, next) => {
    const id = intOrNull(req.params.id);
    try {
      if (!id) throw new MarketingError("not_found", "Scénario introuvable.");
      const b = req.body || {};
      // Le canevas (nœuds + arêtes) est la source à partir de cette phase : les étapes exécutées par le moteur
      // en sont DÉRIVÉES ici, jamais l'inverse — engine.js continue de ne lire que `steps`, inchangé.
      const steps = b.canvas ? auto.graphToSteps(b.canvas) : b.steps;
      // Brouillon : des étapes insérées mais pas encore réglées. Le schéma (et le nom, les déclencheurs) est
      // enregistré, les étapes exécutées restent celles d'avant ; l'activation est bloquée par le contrôle avant
      // activation tant qu'il en reste (automationPreflight). Une donnée INVALIDE reste refusée (400) comme avant.
      const incomplete = b.canvas ? auto.incompleteNodes(b.canvas) : [];
      // `triggers` (liste complète, jusqu'à 3) prime s'il est fourni par le nœud déclencheur du canevas ;
      // triggerEvent/triggerFilter restent acceptés pour compatibilité (ne touchent alors que le 1er déclencheur).
      auto.updateAutomation(req.mk.ctx, id, { name: b.name, triggers: b.triggers, triggerEvent: b.triggerEvent, triggerFilter: b.triggerFilter, steps: incomplete.length ? undefined : steps, canvas: b.canvas });
      res.json({ ok: true, incomplete });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : 400).json({ error: error.message });
      next(error);
    }
  });

  const control = (path, permission, fn, message) =>
    router.post(`/automatisations/:id/${path}`, need(permission), (req, res, next) => {
      const a = load(req, res);
      if (!a) return;
      attempt(req, res, next, path === "supprimer" ? () => "/marketing/automatisations" : `/marketing/automatisations/${a.id}`, () => { fn(req.mk.ctx, a.id); return message; });
    });
  router.post("/automatisations/:id/objectif", need("automations.write"), (req, res, next) => {
    const a = load(req, res);
    if (!a) return;
    attempt(req, res, next, `/marketing/automatisations/${a.id}`, () => {
      const goal = String(req.body.objectif || "");
      if (goal && !auto.TRIGGERS[goal]) throw new MarketingError("invalid_automation", "Objectif inconnu.");
      auto.setGoalEvent(req.mk.ctx, a.id, goal);
      return goal ? "Objectif enregistré : les contacts qui l'atteignent sortent du parcours." : "Objectif retiré.";
    });
  });
  control("activer", "automations.activate", (ctx, id) => auto.activateAutomation(ctx, id, { workerOn: workerOn(), smtpAvailable: Boolean(process.env.SMTP_HOST) }), "Scénario activé : les prochains événements correspondants le déclencheront (l'historique n'est jamais rejoué).");
  control("pause", "automations.activate", auto.pauseAutomation, "Scénario mis en pause : les passages en cours attendent, aucun nouveau contact n'y entre.");
  control("reprendre", "automations.activate", auto.resumeAutomation, "Scénario repris.");
  control("supprimer", "automations.write", auto.deleteAutomation, "Scénario supprimé.");

  // ---------- Événements et pont ----------
  router.get("/evenements", need("contacts.read"), (req, res) => {
    const org = req.mk.ctx.organizationId;
    res.render("marketing/events", {
      title: "Événements", active: "events",
      cursors: db.prepare("SELECT source, last_id, initialized_at, updated_at FROM mk_bridge_cursors WHERE organization_id = ? AND source <> 'funnel_sweep' ORDER BY source").all(org),
      events: db.prepare("SELECT id, name, email, source, occurred_at, processed_at FROM mk_events WHERE organization_id = ? ORDER BY id DESC LIMIT 100").all(org),
      workerOn: workerOn(), canSync: req.mk.can("queue.manage"),
    });
  });

  // Diagnostic d'un événement : scénarios qui l'écoutent, passages nés, e-mails partis (lecture seule, site de l'équipe respecté)
  router.get("/evenements/:id(\\d+)", need("contacts.read"), (req, res, next) => {
    try {
      const t = auto.traceEvent(req.mk.ctx, Number(req.params.id));
      res.render("marketing/event-trace", { title: "Diagnostic d'un événement", active: "events", t });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(404).render("error", { message: "Événement introuvable." });
      next(error);
    }
  });

  // Détection des abandons à la demande (en plus de la tâche récurrente)
  router.post("/evenements/abandons", need("queue.manage"), (req, res, next) =>
    attempt(req, res, next, "/marketing/evenements", () => {
      const r = abandon.sweep(req.mk.ctx);
      return `Détection terminée : ${r.funnels} abandon${r.funnels > 1 ? "s" : ""} de tunnel, ${r.checkouts} commande${r.checkouts > 1 ? "s" : ""} abandonnée${r.checkouts > 1 ? "s" : ""}, ${r.carts} panier${r.carts > 1 ? "s" : ""} abandonné${r.carts > 1 ? "s" : ""}.`;
    }));

  router.post("/evenements/synchroniser", need("queue.manage"), (req, res, next) =>
    attempt(req, res, next, "/marketing/evenements", () => {
      const r = bridge.syncLmsEvents(req.mk.ctx, { limit: 500 });
      const n = Object.values(r.emitted).reduce((a, b) => a + b, 0);
      if (r.initialized.length && !n) return "Synchronisation terminée : le pont est initialisé (les événements passés ne sont jamais rejoués).";
      const text = `Synchronisation terminée : ${n} événement${n > 1 ? "s" : ""} émis.`;
      return workerOn() ? text : { text: `${text} ${workerHuman("ils seront distribués dès qu'il sera rétabli")}`, detail: WORKER_DETAIL };
    }));

  return router;
};
