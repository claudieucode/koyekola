// Étape 0 : robustesse de la commande. Serveur dédié : une panne simulée ne doit jamais faire tomber le site.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof;
before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
});
after(() => srv.stop());

test("une panne pendant la commande : rien n'est enregistré, le site reste en ligne, message clair", async () => {
  const c = await createCourse(prof, srv, { title: "Atomicité", price: 15 });
  const e = await newStudent(srv);
  await e.post(`/panier/ajouter/${c.id}`, {});

  // On sabote l'écriture des lignes de commande pour provoquer un échec au milieu de la commande
  const db = srv.db();
  db.exec("CREATE TRIGGER sabotage BEFORE INSERT ON order_items BEGIN SELECT RAISE(ABORT, 'panne simulée'); END");
  const avant = db.prepare("SELECT COUNT(*) n FROM orders").get().n;

  const r = await e.post("/commande", {});

  const apres = db.prepare("SELECT COUNT(*) n FROM orders").get().n;
  const inscrits = db.prepare("SELECT COUNT(*) n FROM enrollments WHERE course_id = ?").get(c.id).n;
  db.exec("DROP TRIGGER sabotage");
  db.close();

  assert.equal((await new Client(srv.base).get("/sante")).status, 200, "le serveur doit être toujours en vie");
  assert.equal(r.status, 500, "l'étudiant doit recevoir une page d'erreur, pas une connexion coupée");
  assert.doesNotMatch(r.text, /panne simulée|SQLITE|sqlite/i, "aucun détail technique affiché");
  assert.equal(apres, avant, "aucune commande orpheline ne doit rester");
  assert.equal(inscrits, 0, "aucune inscription sans achat");
});
