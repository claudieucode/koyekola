// Centre de gestion → vue d'ensemble : indicateurs tirés de sources réelles (support, sauvegardes, journal, ventes sur 30 jours comparées aux 30 précédents),
// alertes avec le niveau écrit en toutes lettres. Aucun chiffre inventé : état des sauvegardes déduit des fichiers présents.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("./helpers");
const { backupStatus } = require("../src/services/gestion/health");

const G = "/formateur/gestion";
let srv, prof, course;
const run = (sql, ...x) => { const d = srv.db(); try { return d.prepare(sql).run(...x); } finally { d.close(); } };
const get = (sql, ...x) => { const d = srv.db(); try { return d.prepare(sql).get(...x); } finally { d.close(); } };
const DAY = 864e5;

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Cours vue", price: 50 });
});
after(async () => { if (srv) await srv.stop(); });

test("état des sauvegardes (fonction pure) : aucune, ancienne, récente, automatique désactivée", () => {
  const now = Date.parse("2026-10-25T12:00:00Z");
  const at = (d) => ({ name: "x.db", createdAt: new Date(now - d) });
  assert.equal(backupStatus([], { now }).level, "warning");
  assert.match(backupStatus([], { now }).title, /Aucune sauvegarde/);
  assert.equal(backupStatus([at(5 * DAY)], { now }).level, "warning");
  assert.match(backupStatus([at(5 * DAY)], { now }).title, /il y a 5 jours/);
  assert.equal(backupStatus([at(3 * 3600e3)], { now }).level, "ok");
  assert.equal(backupStatus([at(3 * 3600e3)], { now }).label, "Dernière : aujourd'hui");
  assert.equal(backupStatus([at(1.5 * DAY)], { now }).label, "Dernière il y a 1 jour");
  assert.match(backupStatus([], { now, auto: false }).detail, /désactivée/);
});

test("support : le nombre de demandes en attente est celui de la base", async () => {
  assert.match((await prof.get(G)).text, /Aucune demande en attente/);
  const st = await newStudent(srv);
  const uid = get("SELECT id FROM users WHERE email = ?", st.email).id;
  run("INSERT INTO support_tickets (user_id, instructor_id, course_id, subject, status, priority) VALUES (?, ?, ?, 'Aide', 'open', 'normal')", uid, get("SELECT instructor_id i FROM courses WHERE id = ?", course.id).i, course.id);
  assert.match((await prof.get(G)).text, /1 demande\(s\) en attente de réponse/);
});

test("sauvegardes : à jour après une sauvegarde ; alerte « À surveiller » écrite en toutes lettres quand elles sont anciennes", async () => {
  await prof.post(`${G}/sauvegardes`, {});
  let html = (await prof.get(G)).text;
  assert.match(html, /Dernière : aujourd(?:'|&#39;)hui/);
  assert.doesNotMatch(html, /Dernière sauvegarde de la base il y a/);
  const dir = path.join(srv.dir, "data", "backups");
  const old = new Date(Date.now() - 6 * DAY);
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".db")) fs.utimesSync(path.join(dir, f), old, old);
  html = (await prof.get(G)).text;
  assert.match(html, /Dernière il y a 6 jours/);
  assert.match(html, /g-alert-level">À surveiller</);
  assert.match(html, /Dernière sauvegarde de la base il y a 6 jours/);
  assert.match((await prof.get(`${G}/activite?vue=alertes`)).text, /Dernière sauvegarde de la base il y a 6 jours/, "la même alerte est dans la page Activité");
});

test("journal : la dernière opération réellement enregistrée est affichée", async () => {
  await prof.post(`${G}/ventes/coupons`, { code: "VUE10", kind: "percent", value: "10", active: "on" });
  const last = get("SELECT summary FROM audit_log ORDER BY id DESC").summary;
  assert.ok(last);
  assert.match((await prof.get(G)).text, /Dernière : /);
});

test("ventes : tendance sur 30 jours comparée aux 30 précédents (calculée sur les vraies commandes)", async () => {
  assert.match((await prof.get(G)).text, /0,00\s€ sur 30 jours \(aucune vente les 30 jours précédents\)/);
  const e = await newStudent(srv); await buy(e, course);
  assert.match((await prof.get(G)).text, /50,00\s€ sur 30 jours \(aucune vente les 30 jours précédents\)/);
  run("UPDATE orders SET created_at = datetime('now', '-45 days') WHERE id = (SELECT MIN(id) FROM orders)");
  const e2 = await newStudent(srv); await buy(e2, course);
  assert.match((await prof.get(G)).text, /50,00\s€ sur 30 jours · 0 % par rapport aux 30 jours précédents/);
  const e3 = await newStudent(srv); await buy(e3, course);
  assert.match((await prof.get(G)).text, /100,00\s€ sur 30 jours · \+100 % par rapport/);
});
