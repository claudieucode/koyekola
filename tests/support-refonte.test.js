// Support, refonte : anti-doublons, réponse + résolution, demande résolue non modifiable par le formateur, brouillon conservé, indicateurs réels,
// pagination, tri par ancienneté, filtres de l'élève, e-mails mis en file (jamais présentés comme envoyés), isolation.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const G = "/formateur/gestion";
let srv, prof;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const run = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).run(...args); } finally { db.close(); } };
const open = async (e, subject = "Une question sur mon accès", message = "Je n'arrive plus à ouvrir la leçon 2, merci de m'aider.") => {
  const r = await e.post("/support", { subject, message });
  return { r, id: r.status === 302 ? Number(r.location.match(/\/support\/(\d+)/)[1]) : null };
};
const count = (id) => sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ?", id)[0].n;
const status = (id) => sql("SELECT status, closed_at FROM support_tickets WHERE id = ?", id)[0];

before(async () => { srv = await startServer(); prof = await loginInstructor(srv); });
after(() => srv.stop());

test("double envoi de la même demande : un seul ticket", async () => {
  const e = await newStudent(srv);
  const [a, b] = await Promise.all([open(e, "Doublon exact", "Le même texte envoyé deux fois de suite."), open(e, "Doublon exact", "Le même texte envoyé deux fois de suite.")]);
  const c = await open(e, "Doublon exact", "Le même texte envoyé deux fois de suite.");
  assert.equal(sql("SELECT COUNT(*) n FROM support_tickets WHERE subject = 'Doublon exact'")[0].n, 1);
  assert.equal(a.id, c.id); assert.equal(b.id, c.id);
  assert.match((await e.get(`/support/${a.id}`)).text, /Demande #\d+ envoyée|venait déjà/, "confirmation avec le numéro réel, une seule fois");
});

test("réponses simultanées identiques : un seul message enregistré", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e);
  await Promise.all([1, 2, 3, 4, 5].map(() => e.post(`/support/${id}/repondre`, { message: "Toujours le même problème." })));
  assert.equal(count(id), 2);
});

test("« envoyer et résoudre » : réponse enregistrée, demande résolue, élève prévenu ; le formateur ne peut plus écrire dans une demande résolue", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e);
  await prof.post(`${G}/support/${id}/repondre`, { message: "Essayez de vider le cache puis réessayez.", resolve: "1" });
  assert.equal(status(id).status, "closed"); assert.notEqual(status(id).closed_at, null);
  assert.equal(count(id), 2);
  assert.equal(sql("SELECT COUNT(*) n FROM notifications WHERE user_id = (SELECT user_id FROM support_tickets WHERE id = ?) AND kind = 'support'", id)[0].n, 1);
  await prof.post(`${G}/support/${id}/repondre`, { message: "Message après résolution." });
  assert.equal(count(id), 2, "refusé côté serveur, pas seulement masqué");
  assert.equal(status(id).status, "closed");
  assert.match((await prof.get(`${G}/support/${id}`)).text, /Rouvrez-la|rouvrez-la/);
  const again = await prof.post(`${G}/support/${id}/fermer`, {});
  assert.equal(again.status, 302);
  assert.equal(status(id).status, "closed");
});

test("message refusé : l'élève retrouve ce qu'il a écrit (brouillon conservé) et l'erreur", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e);
  const long = "x".repeat(5001);
  await e.post(`/support/${id}/repondre`, { message: long });
  assert.equal(count(id), 1);
  const page = (await e.get(`/support/${id}`)).text;
  assert.match(page, /1 et 5000 caractères/); assert.ok(page.includes("x".repeat(100)), "brouillon réaffiché");
  assert.doesNotMatch((await e.get(`/support/${id}`)).text, /1 et 5000 caractères/, "l'erreur ne s'affiche qu'une fois");
});

test("indicateurs réels, tri par ancienneté d'attente, pagination, recherche par numéro", async () => {
  const e = await newStudent(srv);
  const base = sql("SELECT COUNT(*) n FROM support_tickets")[0].n;
  const first = await open(e, "Attente la plus ancienne zzk", "Le plus ancien message en attente de réponse.");
  const second = await open(e, "Attente plus récente zzk", "Un message arrivé après le premier, en attente.");
  run("UPDATE support_tickets SET updated_at = datetime('now', '-3 days') WHERE id = ?", first.id);
  run("UPDATE support_tickets SET updated_at = datetime('now', '-1 hours') WHERE id = ?", second.id);
  const html = (await prof.get(`${G}/support?q=zzk`)).text;
  assert.ok(html.indexOf("Attente la plus ancienne zzk") < html.indexOf("Attente plus récente zzk"), "la plus ancienne attente d'abord");
  assert.match(html, /depuis 3 j/);
  const real = sql("SELECT COUNT(*) n FROM support_tickets WHERE status = 'open'")[0].n;
  assert.match((await prof.get(`${G}/support`)).text, new RegExp(`À traiter</span><span class="kpi-value">${real}<`));
  const byNumber = (await prof.get(`${G}/support?q=${first.id}`)).text;
  assert.match(byNumber, /Attente la plus ancienne zzk/);
  // pagination : 30 demandes de plus → 2 pages de 25 au plus
  for (let i = 0; i < 30; i++) run("INSERT INTO support_tickets (user_id, instructor_id, subject) SELECT user_id, instructor_id, ? FROM support_tickets WHERE id = ?", `Volume ${i} pgk`, first.id);
  const p1 = (await prof.get(`${G}/support?q=pgk`)).text, p2 = (await prof.get(`${G}/support?q=pgk&page=2`)).text;
  assert.equal((p1.match(/<tr>/g) || []).length - 1, 25); assert.equal((p2.match(/<tr>/g) || []).length - 1, 5);
  assert.match(p1, /Page 1 sur 2/); void base;
});

test("l'élève filtre ses demandes ; « réponse reçue » passe en tête ; libellés côté élève", async () => {
  const e = await newStudent(srv);
  const a = await open(e, "Sans réponse yqk", "Cette demande reste sans réponse du formateur.");
  const b = await open(e, "Avec réponse yqk", "Cette demande recevra une réponse du formateur.");
  await prof.post(`${G}/support/${b.id}/repondre`, { message: "Voici la réponse." });
  const all = (await e.get("/support")).text;
  assert.ok(all.indexOf("Avec réponse yqk") < all.indexOf("Sans réponse yqk"));
  assert.match(all, /Réponse reçue/); assert.match(all, /En attente du formateur/);
  const only = (await e.get("/support?statut=answered")).text;
  assert.match(only, /Avec réponse yqk/); assert.doesNotMatch(only, /Sans réponse yqk/);
  assert.match((await e.get("/support?statut=closed")).text, /Aucune demande dans cette catégorie/);
  void a;
});

test("e-mails de suivi mis en file par la file d'envoi partagée (pas d'envoi affirmé)", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e, "Suivi par courriel", "Merci de me répondre par la plateforme.");
  const rows = () => sql("SELECT kind, to_email FROM mail_outbox WHERE subject LIKE ?", `%#${id}%`).concat(sql("SELECT kind, to_email FROM mail_outbox WHERE subject LIKE ?", "%Suivi par courriel%"));
  assert.ok(rows().some((r) => r.kind === "support_staff"), "le formateur reçoit la demande");
  await prof.post(`${G}/support/${id}/repondre`, { message: "Bien reçu, voici la marche à suivre." });
  assert.ok(rows().some((r) => r.kind === "support_reply" && r.to_email === e.email), "l'élève reçoit la réponse");
  assert.doesNotMatch((await prof.get(`${G}/support/${id}`)).text, /e-mail envoyé|courriel envoyé/i);
});

test("isolation : l'identifiant d'un autre élève n'ouvre rien ; l'élève n'accède pas au Centre de gestion", async () => {
  const a = await newStudent(srv), b = await newStudent(srv);
  const { id } = await open(a, "Privé", "Contenu privé qui ne doit pas fuiter.");
  assert.equal((await b.get(`/support/${id}`)).status, 404);
  assert.equal((await b.post(`/support/${id}/repondre`, { message: "intrus" })).status, 404);
  assert.equal(count(id), 1);
  assert.notEqual((await b.get(`${G}/support/${id}`)).status, 200);
  assert.doesNotMatch((await b.get("/support")).text, /Contenu privé/);
});
