// Sonde de mesure (jamais chargée en production) : préchargée avec `node --require scripts/perf/sonde-sql.js server.js`.
// Compte et chronomètre les requêtes SQLite de CHAQUE requête HTTP, et les renvoie dans des en-têtes X-Q-* (nombre, temps cumulé,
// requête la plus lente). Les requêtes sont synchrones : les compteurs sont fiables pour un banc qui envoie une requête à la fois.
"use strict";
const sqlite = require("node:sqlite");
const http = require("node:http");
const state = { n: 0, ms: 0, w: 0, wms: 0, slow: { ms: 0, sql: "" } };
const reset = () => { state.n = 0; state.ms = 0; state.w = 0; state.wms = 0; state.slow = { ms: 0, sql: "" }; };
const proto = sqlite.DatabaseSync.prototype;
const prepare = proto.prepare;
// SONDE_PLANS=fichier : plan d'exécution (EXPLAIN QUERY PLAN) de chaque requête distincte, écrit à l'arrêt, avec son nombre d'exécutions
const PLANS = process.env.SONDE_PLANS ? new Map() : null;
if (PLANS) process.on("SIGTERM", () => process.exit(0));
if (PLANS) process.on("exit", () => { try { require("node:fs").writeFileSync(process.env.SONDE_PLANS, JSON.stringify([...PLANS.values()], null, 1)); } catch { /* ignore */ } });
proto.prepare = function (sql) {
  if (PLANS && !/^\s*EXPLAIN/i.test(sql)) {
    const key = String(sql).replace(/\s+/g, " ").trim();
    let e = PLANS.get(key);
    if (!e) { e = { sql: key.slice(0, 400), runs: 0, ms: 0, plan: [] }; PLANS.set(key, e); try { e.plan = prepare.call(this, "EXPLAIN QUERY PLAN " + sql).all().map((r) => r.detail); } catch { e.plan = ["(plan indisponible)"]; } }
    const st0 = prepare.call(this, sql);
    for (const m of ["get", "all", "run"]) { const o = st0[m]; st0[m] = function (...a) { const t = process.hrtime.bigint(); try { return o.apply(this, a); } finally { e.runs += 1; e.ms += Number(process.hrtime.bigint() - t) / 1e6; } }; }
    // la mesure par requête HTTP est faite plus bas sur la même instruction
    return wrapCount(st0, sql);
  }
  return wrapCount(prepare.call(this, sql), sql);
};
function wrapCount(st, sql) {
  for (const m of ["get", "all", "run"]) {
    const orig = st[m];
    st[m] = function (...a) {
      const t = process.hrtime.bigint();
      try { return orig.apply(this, a); } finally {
        const ms = Number(process.hrtime.bigint() - t) / 1e6;
        state.n += 1; state.ms += ms;
        if (m === "run") { state.w += 1; state.wms += ms; }
        if (ms > state.slow.ms) state.slow = { ms, sql: String(sql).replace(/\s+/g, " ").slice(0, 160) };
      }
    };
  }
  return st;
}
const exec = proto.exec;
proto.exec = function (sql) { const t = process.hrtime.bigint(); try { return exec.call(this, sql); } finally { state.n += 1; state.ms += Number(process.hrtime.bigint() - t) / 1e6; } };
const emit = http.Server.prototype.emit;
http.Server.prototype.emit = function (ev, req, res) {
  if (ev === "request" && res) {
    reset();
    const start = process.hrtime.bigint();
    const wh = res.writeHead;
    res.writeHead = function (...a) {
      if (!res.headersSent) {
        res.setHeader("X-Q-Writes", `${state.w}/${state.wms.toFixed(2)}`); res.setHeader("X-Q-Count", String(state.n)); res.setHeader("X-Q-Ms", state.ms.toFixed(2));
        res.setHeader("X-Q-Slow", encodeURIComponent(`${state.slow.ms.toFixed(2)}ms ${state.slow.sql}`));
        res.setHeader("X-Srv-Ms", (Number(process.hrtime.bigint() - start) / 1e6).toFixed(2));
      }
      return wh.apply(this, a);
    };
  }
  return emit.apply(this, arguments);
};
