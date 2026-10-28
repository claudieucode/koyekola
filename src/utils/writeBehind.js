// Écriture groupée pour les compteurs d'audience (lectures d'article, vues de formulaire, accès aux redirections, journal des 404).
//
// Problème mesuré (TITAN XXXI) : chaque écriture SQLite est validée avec une synchronisation disque (journal WAL, synchronous = FULL).
// Sur une page publique vue en continu — ou face à un robot qui sonde des adresses inventées — chaque visite payait cette attente
// (p95 136 ms par écriture sur la machine de mesure) ET bloquait tout le serveur, SQLite étant synchrone dans Node.
//
// Ici : les petites écritures sans conséquence sont mises en file et validées ensemble, dans UNE transaction, toutes les 2 s (ou
// à 500 écritures). 100 écritures groupées coûtent ≈ 4 ms au total. Les garanties de durabilité des données importantes (commandes,
// contenus, comptes) ne changent pas : elles ne passent pas par ici et gardent synchronous = FULL.
//
// Contrat : à n'utiliser que pour des données dont la perte des 2 dernières secondes est sans conséquence (compteurs d'audience).
// Écriture vidée à l'arrêt normal du processus (exit) ; un arrêt brutal (coupure, kill -9) peut perdre au plus 2 s de compteurs.
// Activation : seulement par le serveur (server.js, hors NODE_ENV=test) ou par KW_WRITE_BEHIND_MS. Partout ailleurs (tests, scripts, outils en ligne de
// commande, code appelé sans serveur) l'écriture reste IMMÉDIATE, comme avant : rien ne dépend d'une minuterie qui n'existerait pas.
"use strict";
const db = require("../config/database");

const FORCED = Number(process.env.KW_WRITE_BEHIND_MS);
let enabled = Boolean(FORCED);
const INTERVAL_MS = FORCED || 2000;
const MAX_QUEUE = 500;

let queue = [];
let timer = null;
let reported = false;

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return 0;
  // Appelé au milieu d'une transaction de l'appelant : on ne l'imbrique pas, on repasse juste après
  if (db.isTransaction) { timer = setTimeout(flush, 0); if (timer.unref) timer.unref(); return 0; }
  const batch = queue;
  queue = [];
  let begun = false;
  try {
    db.exec("BEGIN");
    begun = true;
    for (const job of batch) {
      try { job(); } catch (error) { report(error); } // une écriture en échec ne fait pas perdre les autres
    }
    db.exec("COMMIT");
  } catch (error) {
    if (begun) { try { db.exec("ROLLBACK"); } catch { /* transaction déjà fermée */ } }
    report(error);
  }
  return batch.length;
}

function report(error) {
  if (reported) return;
  reported = true; // une fois : une panne de compteur ne doit ni casser une page ni inonder les journaux
  console.error("[KOLAKISA] Écriture groupée des compteurs :", error && error.message);
}

// Met `job` (une écriture synchrone sur la base) dans la file. Ne lève jamais.
function defer(job) {
  if (!enabled) { job(); return; }
  queue.push(job);
  if (queue.length >= MAX_QUEUE) { flush(); return; }
  if (!timer) { timer = setTimeout(flush, INTERVAL_MS); if (timer.unref) timer.unref(); }
}

process.on("exit", () => { try { flush(); } catch { /* arrêt : rien à faire de plus */ } });

// Appelé par le serveur au démarrage : à partir de là, les écritures sont groupées
function enable() { enabled = true; }

module.exports = { defer, flush, enable, enabled: () => enabled, pending: () => queue.length, INTERVAL_MS };
