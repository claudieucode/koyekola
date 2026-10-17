// Point d'entrée du module marketing : applique les migrations, prépare l'organisation KOLAKISA et ses réglages.
// Si l'initialisation échoue (migration refusée, sauvegarde impossible…), l'erreur est affichée clairement et le module
// se déclare « indisponible » : le LMS continue de fonctionner (il n'en dépend pas), rien n'est masqué en silence.
const path = require("path");
const { migrate } = require("./db/migrate");
const { ensureDefaultOrganization, syncInstructorMembers } = require("./organizations");
const { createSettings } = require("./settings");
const { createEventBus } = require("./events/bus");
const { createWorker } = require("./queue/worker");
const imports = require("./import");
const sending = require("./sending");
const bridgeEvents = require("./bridge/events");
const automations = require("./automations");
const webhooksOut = require("./webhooks");
const smsCampaigns = require("./sms/campaigns");
const { syncLmsUsers } = require("./bridge/lms");
const revenue = require("./revenue");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

function initMarketing({ db, dbFile, dataDir, env = process.env, log = console }) {
  try {
    const migrations = migrate(db, { dir: MIGRATIONS_DIR, dbPath: dbFile, backupDir: path.join(dataDir, "backups"), log });
    try { require("./transitions").runAiOnce(db, { log }); } catch (error) { log.warn?.("[KOLAKISA] Transition IA non exécutée (sera retentée au prochain démarrage) :", error.message); } // R7 lot 6.2 : activation initiale UNIQUE du module « ai » pour les sites qui utilisaient déjà le studio de pages IA
    require("../services/siteContent").ensureCoreTriggers(db); // R6 lot 1 : déclencheurs d'intégrité des contenus par site (idempotents, additifs)
    const organization = ensureDefaultOrganization(db, { name: "KOLAKISA", slug: "koyekola" });
    syncInstructorMembers(db, organization.id);
    // Comptes du LMS → contacts « unknown » (jamais de consentement déduit). Une panne ici ne rend pas le module indisponible.
    try {
      syncLmsUsers({ db, organizationId: organization.id, userId: null, bus: null });
    } catch (error) {
      log.warn?.("[KOLAKISA] Synchronisation des comptes vers les contacts marketing impossible :", error.message);
    }
    const bus = createEventBus(db, { log });
    // Le worker n'est démarré que si MARKETING_WORKER=on (voir server.js) : aucun traitement en arrière-plan par défaut
    const settings = createSettings(db, { encryptionKey: env.ENCRYPTION_KEY });
    const handlers = {
      ...bus.jobHandlers(), ...imports.jobHandlers({ db, bus }), ...sending.jobHandlers({ db, bus, settings, env, log }), ...bridgeEvents.jobHandlers({ db, bus, log }),
      ...automations.jobHandlers({ db, bus, settings, env, log }), ...webhooksOut.jobHandlers({ db, env, log }), ...require("./rss").jobHandlers({ db, bus, settings, env, log }),
      ...smsCampaigns.smsJobHandlers({ db, bus, settings, env, log }), ...require("./social").jobHandlers({ db, bus, settings, env, log }),
    };
    bus.on("*", automations.eventHandler({ db, settings, env, log })); // événements → passages dans les scénarios actifs
    bus.on("*", webhooksOut.eventHandler({ db, env })); // événements → livraisons de webhooks sortants abonnés
    bus.on("lms.order_completed", revenue.eventHandler({ db, settings })); // commande → attribuée au dernier e-mail cliqué
    bus.on("*", require("./scoring").eventHandler({ db, bus })); // événements → points du score des contacts
    // Outils du CMS (palier 13) : import, export, santé… exécutés par la même file de travaux
    const tools = require("../services/tools/runner").init({ organizationId: organization.id, bus, settings, env, log });
    Object.assign(handlers, tools.handlers());
    const worker = createWorker({ db, handlers, log });
    // Lance la lecture périodique du LMS (appelé par server.js quand le worker est actif)
    const startBridge = () => bridgeEvents.startBridge(db, organization.id);
    return { ready: true, organizationId: organization.id, settings, bus, worker, migrations, startBridge, tools };
  } catch (error) {
    log.error("[KOLAKISA] Module marketing INDISPONIBLE (le reste du site fonctionne normalement) :", error.message);
    return { ready: false, error: error.message };
  }
}

module.exports = { initMarketing, MIGRATIONS_DIR };
