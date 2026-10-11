// KOLAKISA SEO CORE — lot 6 : tâches programmées (état réel, exécution automatique et manuelle) et rapports téléchargeables.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

describe("SEO CORE : tâches programmées et rapports", () => {
  let srv, prof;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  const msgOf = (r) => decodeURIComponent(String(r.location || "").split(/[?&](?:msg|err)=/)[1] || "");
  const job = (name) => q("SELECT * FROM seo_jobs WHERE name = ?", name)[0];
  before(async () => {
    srv = await startServer({ SEO_JOBS: "on", SEO_JOBS_TICK_MS: "300", ENCRYPTION_KEY: require("crypto").randomBytes(32).toString("hex") }); // clé fixée : « Non connecté » (et non « Configuration requise ») ne dépend plus de l'environnement de la machine
    prof = await loginInstructor(srv);
    await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
  });
  after(() => srv.stop());

  test("page des tâches : 6 tâches, jamais exécutées, prochain passage programmé", async () => {
    const html = (await prof.get("/formateur/seo/taches")).text;
    for (const label of ["Audit complet du site", "Vitesse de la page d&#39;accueil", "Actualisation Search Console", "Actualisation Google Analytics 4", "Nettoyage des journaux", "Surveillance du site"]) assert.ok(html.includes(label), label);
    assert.equal((html.match(/Jamais exécutée/g) || []).length, 6);
    assert.match(job("audit").next_run_at, /^\d{4}-\d\d-\d\d 03:00:00$/);
    assert.equal(new Date(`${job("audit").next_run_at}Z`).getUTCDay(), 1, "chaque semaine : le lundi");
  });

  test("exécution manuelle de l'audit : vrai audit enregistré, résultat et historique", async () => {
    const r = await prof.post("/formateur/seo/taches/audit/executer", {});
    assert.match(msgOf(r), /Terminé : Audit n° \d+ : \d+ pages lues/);
    const a = q("SELECT * FROM seo_audits ORDER BY id DESC LIMIT 1")[0];
    assert.equal(a.status, "done");
    assert.equal(a.source, "scheduled");
    assert.equal(job("audit").last_status, "ok");
    assert.equal(q("SELECT trigger FROM seo_job_runs WHERE job = 'audit'")[0].trigger, "manual");
    assert.match((await prof.get("/formateur/seo/taches")).text, /Réussie/);
  });

  test("service non configuré : tâche « ignorée » avec la raison, jamais de faux résultat", async () => {
    assert.match(msgOf(await prof.post("/formateur/seo/taches/search_console/executer", {})), /Tâche ignorée : Non connecté/);
    assert.match(msgOf(await prof.post("/formateur/seo/taches/pagespeed/executer", {})), /Tâche ignorée : Configuration requise : SITE_URL/);
    assert.equal(job("search_console").last_status, "skipped");
    assert.equal(q("SELECT COUNT(*) n FROM seo_pagespeed")[0].n, 0);
  });

  test("programmation : fréquence et heure enregistrées, désactivation, valeurs invalides refusées", async () => {
    await prof.post("/formateur/seo/taches/analytics", { frequency: "daily", hour: "7" });
    assert.match(job("analytics").next_run_at, / 07:00:00$/);
    await prof.post("/formateur/seo/taches/analytics", { frequency: "off", hour: "7" });
    assert.equal(job("analytics").enabled, 0);
    assert.equal(job("analytics").next_run_at, null);
    assert.match(msgOf(await prof.post("/formateur/seo/taches/analytics", { frequency: "daily", hour: "25" })), /Heure invalide/);
  });

  test("exécution automatique à l'heure prévue : nettoyage réel des 404 anciennes, prochain passage reprogrammé", async () => {
    run("INSERT INTO seo_404 (path, hits_human, first_seen, last_seen) VALUES ('/vieille-erreur', 3, datetime('now', '-400 days'), datetime('now', '-200 days'))");
    run("INSERT INTO seo_404 (path, hits_human) VALUES ('/erreur-recente', 1)");
    run("UPDATE seo_jobs SET next_run_at = datetime('now', '-1 minute') WHERE name = 'cleanup'");
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !job("cleanup").last_run_at) await new Promise((r) => setTimeout(r, 200));
    const j = job("cleanup");
    assert.equal(j.last_status, "ok", j.last_message || "");
    assert.match(j.last_message, /^1 adresse\(s\) 404/);
    assert.deepEqual(q("SELECT path FROM seo_404").map((r) => r.path), ["/erreur-recente"]);
    assert.ok(new Date(`${j.next_run_at}Z`) > new Date(), "reprogrammée dans le futur");
    assert.equal(q("SELECT trigger FROM seo_job_runs WHERE job = 'cleanup'")[0].trigger, "auto");
    assert.equal(q("SELECT COUNT(*) n FROM seo_job_runs WHERE job = 'cleanup'")[0].n, 1, "une seule exécution");
  });

  test("rapports : audit CSV/JSON, synthèse JSON, journaux CSV ; aucun secret ; accès refusé aux élèves", async () => {
    const a = q("SELECT id FROM seo_audits WHERE status = 'done' ORDER BY id DESC LIMIT 1")[0];
    const page = (await prof.get("/formateur/seo/rapports")).text;
    assert.match(page, new RegExp(`/formateur/seo/rapports/audit-${a.id}\\.csv`));
    const c = await prof.get(`/formateur/seo/rapports/audit-${a.id}.csv`);
    assert.match(c.headers.get("content-type"), /text\/csv/);
    assert.match(c.headers.get("content-disposition"), /attachment; filename="audit-seo-\d+-kolakisa\.csv"/);
    assert.match(c.text, /^﻿?gravité,catégorie,règle,problème,adresse,détail,corrigé le\n/);
    const issues = q("SELECT COUNT(*) n FROM seo_issues WHERE audit_id = ?", a.id)[0].n;
    assert.equal(c.text.trim().split("\n").length, issues + 1, "une ligne par problème enregistré");
    const j = JSON.parse((await prof.get(`/formateur/seo/rapports/audit-${a.id}.json`)).text);
    assert.equal(j.issues.length, issues);
    const s = JSON.parse((await prof.get("/formateur/seo/rapports/synthese.json")).text);
    assert.equal(s.latest_audit.id, a.id);
    assert.equal(s.integrations.search_console.label, "Non connecté");
    assert.equal(s.pagespeed_latest, null, "aucune mesure : null, pas d'estimation");
    assert.ok(s.jobs.some((x) => x.name === "cleanup" && x.last_status === "ok"));
    assert.match((await prof.get("/formateur/seo/rapports/erreurs-404.csv")).text, /\/erreur-recente/);
    assert.match((await prof.get("/formateur/seo/rapports/journal.csv")).text, /^﻿?date \(UTC\),élément/);
    assert.equal((await prof.get("/formateur/seo/rapports/audit-99999.csv")).status, 404);
    const student = await newStudent(srv);
    assert.notEqual((await student.get("/formateur/seo/rapports/synthese.json")).status, 200);
    assert.notEqual((await student.post("/formateur/seo/taches/audit/executer", {})).status, 200);
  });

  test("surveillance : référence puis alertes réelles (robots.txt, plan du site bloqué, nouvelle 404), « Vu »", async () => {
    assert.match((await prof.get("/formateur/seo")).text, /Non configuré : la surveillance n&#39;a encore jamais tourné|Non configuré : la surveillance n'a encore jamais tourné/);
    assert.match(msgOf(await prof.post("/formateur/seo/taches/monitor/executer", {})), /Référence enregistrée/);
    assert.match(msgOf(await prof.post("/formateur/seo/taches/monitor/executer", {})), /Aucun changement constaté/);
    await prof.post("/formateur/seo/reglages", { robots_custom: "User-agent: *\nDisallow: /catalogue" });
    await new Client(srv.base).request("/page-disparue-surveillee", { headers: { "User-Agent": "Mozilla/5.0 (Macintosh)" } });
    assert.match(msgOf(await prof.post("/formateur/seo/taches/monitor/executer", {})), /\d+ changement\(s\) signalé\(s\)/);
    const alerts = q("SELECT severity, kind, message FROM seo_alerts ORDER BY id");
    assert.ok(alerts.some((a) => a.kind === "robots" && a.severity === "high" && a.message.includes("/catalogue")), JSON.stringify(alerts));
    assert.ok(alerts.some((a) => a.kind === "robots" && /robots\.txt a changé/.test(a.message)));
    assert.ok(alerts.some((a) => a.kind === "404" && a.message.includes("/page-disparue-surveillee (1)")));
    assert.equal(alerts.some((a) => a.kind === "page"), false, "pas de fausse alerte sur des pages inchangées");
    const html = (await prof.get("/formateur/seo")).text;
    assert.match(html, /seo-alert is-high/);
    await prof.post("/formateur/seo/alertes/vues", {});
    assert.equal(q("SELECT COUNT(*) n FROM seo_alerts WHERE seen_at IS NULL")[0].n, 0);
    assert.match((await prof.get("/formateur/seo")).text, /Aucun changement à signaler/);
    await prof.post("/formateur/seo/reglages", { robots_custom: "" });
  });

  test("rapport par catégorie : seulement les problèmes de la catégorie demandée", async () => {
    const a = q("SELECT id FROM seo_audits WHERE status = 'done' ORDER BY id DESC LIMIT 1")[0];
    const j = JSON.parse((await prof.get(`/formateur/seo/rapports/audit-${a.id}.json?categorie=content`)).text);
    assert.equal(j.category, "content");
    assert.equal(j.issues.length, q("SELECT COUNT(*) n FROM seo_issues WHERE audit_id = ? AND category = 'content'", a.id)[0].n);
    assert.ok(j.issues.every((i) => i.categorie === "Contenu"));
  });
});
